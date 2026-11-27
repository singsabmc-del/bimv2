// Firebase (Cloud Firestore) storage for the BIM school state — no extra npm packages.
// Talks to the Firestore REST API with a service-account token signed by Node's crypto.
//
// Enable it by setting ONE environment variable on the server (Vercel → Settings → Environment Variables):
//   FIREBASE_SERVICE_ACCOUNT = the whole service-account JSON file
//                              (Firebase console → Project settings → Service accounts → Generate new private key)
//   (base64 of that JSON also works)
//
// Layout in Firestore (Firestore allows at most 1 MiB per document, so big JSON is split):
//   bim_state/latest           { lastSavedAt, updatedAt, chunks, bytes }
//   bim_state/latest_0 … _n    { data: "<part of the JSON text>" }
//   bim_backups/<id>           { title, createdAt, meta, chunks }  + bim_backups/<id>_0 … _n
import crypto from 'crypto';

type ServiceAccount = { project_id: string; client_email: string; private_key: string };

const CHUNK_CHARS = 250_000; // ≤ ~750 KB even if every character were 3-byte Khmer
const MAX_OLD_CHUNKS = 40; // stale chunks beyond the new count are deleted up to this index

function readServiceAccount(): ServiceAccount | null {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || process.env.BIM_FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (!raw) return null;
  try {
    const text = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const sa = JSON.parse(text);
    if (!sa.project_id || !sa.client_email || !sa.private_key) return null;
    sa.private_key = String(sa.private_key).replace(/\\n/g, '\n');
    return sa;
  } catch {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT is set but is not valid service-account JSON');
    return null;
  }
}

const SA = readServiceAccount();
export const firebaseEnabled = !!SA;
export const firebaseProjectId = SA?.project_id || null;
const BASE = SA ? `https://firestore.googleapis.com/v1/projects/${SA.project_id}/databases/(default)/documents` : '';
const DOC_ROOT = SA ? `projects/${SA.project_id}/databases/(default)/documents` : '';

let token: { value: string; exp: number } | null = null;
async function accessToken(): Promise<string> {
  if (!SA) throw new Error('Firebase is not configured');
  const now = Math.floor(Date.now() / 1000);
  if (token && token.exp - 60 > now) return token.value;
  const b64 = (o: any) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: SA.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(SA.private_key).toString('base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new Error(`Firebase auth failed: ${json.error_description || json.error || res.status}`);
  token = { value: json.access_token, exp: now + Number(json.expires_in || 3600) };
  return token.value;
}

async function call(method: string, url: string, body?: any, timeoutMs = 25000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const json: any = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  } finally {
    clearTimeout(t);
  }
}

const fieldsOf = (doc: any) => doc?.fields || {};
const num = (f: any) => (f?.integerValue != null ? Number(f.integerValue) : f?.doubleValue != null ? Number(f.doubleValue) : null);
const str = (f: any) => (f?.stringValue != null ? String(f.stringValue) : null);

function chunksOf(text: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_CHARS) out.push(text.slice(i, i + CHUNK_CHARS));
  return out.length ? out : [''];
}

/** Write a JSON value as <collection>/<id> + chunk documents, atomically */
async function writeChunked(collection: string, id: string, value: any, headFields: Record<string, any>) {
  const parts = chunksOf(JSON.stringify(value));
  const writes: any[] = parts.map((p, i) => ({
    update: { name: `${DOC_ROOT}/${collection}/${id}_${i}`, fields: { data: { stringValue: p } } },
  }));
  for (let i = parts.length; i < parts.length + MAX_OLD_CHUNKS; i++) writes.push({ delete: `${DOC_ROOT}/${collection}/${id}_${i}` });
  writes.push({
    update: {
      name: `${DOC_ROOT}/${collection}/${id}`,
      fields: { ...headFields, chunks: { integerValue: String(parts.length) }, updatedAt: { timestampValue: new Date().toISOString() } },
    },
  });
  const r = await call('POST', `${BASE}:commit`, { writes });
  if (!r.ok) throw new Error(r.json?.error?.message || `Firestore write failed (${r.status})`);
}

/** Read a chunked JSON value; null when the head document does not exist */
async function readChunked(collection: string, id: string): Promise<{ value: any; head: any } | null> {
  const head = await call('GET', `${BASE}/${collection}/${id}`, undefined, 8000);
  if (head.status === 404) return null;
  if (!head.ok) throw new Error(head.json?.error?.message || `Firestore read failed (${head.status})`);
  const n = num(fieldsOf(head.json).chunks) || 0;
  if (!n) return null;
  const names = Array.from({ length: n }, (_, i) => `${DOC_ROOT}/${collection}/${id}_${i}`);
  const got = await call('POST', `${BASE}:batchGet`, { documents: names }, 15000);
  if (!got.ok) throw new Error(got.json?.error?.message || `Firestore read failed (${got.status})`);
  const byName = new Map<string, string>();
  (Array.isArray(got.json) ? got.json : []).forEach((r: any) => r.found && byName.set(r.found.name, str(fieldsOf(r.found).data) || ''));
  if (names.some((nm) => !byName.has(nm))) throw new Error('Firestore data is incomplete (missing chunk)');
  return { value: JSON.parse(names.map((nm) => byName.get(nm)).join('')), head: fieldsOf(head.json) };
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function firebaseLoadState(): Promise<{ data: any; updatedAt: string | null } | null> {
  const r = await readChunked('bim_state', 'latest');
  if (!r) return null;
  return { data: r.value, updatedAt: r.head.updatedAt?.timestampValue || null };
}

export async function firebaseSaveState(payload: any): Promise<void> {
  await writeChunked('bim_state', 'latest', payload, {
    lastSavedAt: { integerValue: String(Number(payload?.lastSavedAt) || Date.now()) },
  });
}

export async function firebaseSaveBackup(id: string, title: string, meta: any, data: any): Promise<void> {
  const safeId = id.replace(/[/\s]+/g, '_');
  await writeChunked('bim_backups', safeId, data, {
    title: { stringValue: title },
    createdAt: { timestampValue: new Date().toISOString() },
    meta: { stringValue: JSON.stringify(meta || {}) },
  });
}

/** Quick connectivity check for the status endpoint */
export async function firebasePing(): Promise<{ ok: boolean; error?: string; lastSavedAt?: number | null }> {
  try {
    const head = await call('GET', `${BASE}/bim_state/latest`, undefined, 8000);
    if (head.status === 404) return { ok: true, lastSavedAt: null };
    if (!head.ok) return { ok: false, error: head.json?.error?.message || `HTTP ${head.status}` };
    return { ok: true, lastSavedAt: num(fieldsOf(head.json).lastSavedAt) };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Firebase unreachable' };
  }
}
