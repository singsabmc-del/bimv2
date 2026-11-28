// Super Admin page (open /#setup, no login needed): connect this school's deployment to its own
// Firebase project by uploading the service-account key. Protected by the BIM_SUPERADMIN_PIN set
// on the server. The key is checked against Firebase before it is used.
import React, { useEffect, useState } from 'react';
import { CheckCircle2, Database, KeyRound, Loader2, ShieldAlert, Upload } from 'lucide-react';

type Status = {
  superAdminPinSet: boolean;
  canSaveToVercel: boolean;
  firebase: { configured: boolean; projectId: string | null; connected: boolean; error: string | null };
};

export const FirebaseSetupView: React.FC = () => {
  const [status, setStatus] = useState<Status | null>(null);
  const [pin, setPin] = useState('');
  const [keyText, setKeyText] = useState('');
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const load = () =>
    fetch('/api/setup/status', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setError('មិនអាចភ្ជាប់ទៅ server បានទេ'));
  useEffect(() => {
    load();
  }, []);

  let keyInfo: { project?: string; email?: string } | null = null;
  try {
    const k = JSON.parse(keyText);
    keyInfo = { project: k.project_id, email: k.client_email };
  } catch {
    keyInfo = null;
  }

  const onFile = async (f?: File) => {
    if (!f) return;
    setFileName(f.name);
    setKeyText(await f.text());
    setResult(null);
    setError('');
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const r = await fetch('/api/setup/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, serviceAccount: keyText }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) setError(j.error || `HTTP ${r.status}`);
      else {
        setResult(j);
        setKeyText('');
        setFileName('');
        load();
      }
    } catch (e: any) {
      setError(e?.message || 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  const fb = status?.firebase;
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-khmer">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">ភ្ជាប់ Firebase សម្រាប់សាលានេះ</div>
            <div className="text-xs text-slate-500">Super Admin · {window.location.host}</div>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          {!status ? (
            <span className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> កំពុងពិនិត្យ…</span>
          ) : fb?.configured ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold">
                {fb.connected ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <ShieldAlert className="h-4 w-4 text-rose-600" />}
                {fb.connected ? 'កំពុងប្រើ Firebase' : 'Firebase ភ្ជាប់មិនបាន'}
              </div>
              <div className="font-mono text-xs text-slate-600">Project: {fb.projectId}</div>
              {fb.error && <div className="text-xs text-rose-600">{fb.error}</div>}
            </div>
          ) : (
            <div className="font-bold text-amber-700">មិនទាន់ភ្ជាប់ Firebase ទេ</div>
          )}
        </div>

        {status && !status.superAdminPinSet ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            ត្រូវកំណត់ <b className="font-mono">BIM_SUPERADMIN_PIN</b> នៅ Vercel → Settings → Environment Variables របស់ project នេះជាមុនសិន រួច Redeploy។
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">
              ១. ឯកសារ Service Account (.json)
              <div className="mt-1 flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                  <Upload className="h-4 w-4" /> ជ្រើសឯកសារ
                  <input type="file" accept=".json,application/json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                </label>
                <span className="truncate text-xs text-slate-500">{fileName || 'Firebase → Project settings → Service accounts → Generate new private key'}</span>
              </div>
            </label>
            {keyText && (
              <div className={`rounded-lg px-3 py-2 text-xs ${keyInfo?.project ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
                {keyInfo?.project ? <>Project: <b className="font-mono">{keyInfo.project}</b> · {keyInfo.email}</> : 'ឯកសារនេះមិនមែនជា service-account key ទេ'}
              </div>
            )}
            <label className="block text-sm font-bold text-slate-700">
              ២. PIN របស់ Super Admin
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  autoComplete="off"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
                />
              </div>
            </label>
            <button
              type="button"
              disabled={busy || !keyInfo?.project || !pin}
              onClick={submit}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} ពិនិត្យ & ភ្ជាប់ Firebase
            </button>
            {status && !status.canSaveToVercel && (
              <p className="text-[11px] text-slate-500">
                គ្មាន <span className="font-mono">VERCEL_TOKEN</span>៖ key នឹងប្រើបានភ្លាម ប៉ុន្តែនឹងបាត់ពេល server ចាប់ផ្តើមឡើងវិញ។ ដើម្បីរក្សាទុកជាអចិន្ត្រៃយ៍ សូមកំណត់ VERCEL_TOKEN ឬដាក់ FIREBASE_SERVICE_ACCOUNT ដោយដៃ។
              </p>
            )}
          </div>
        )}

        {error && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
        {result && (
          <div className="mt-3 space-y-1 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <div className="font-bold">✓ បានភ្ជាប់ {result.projectId}</div>
            <div>{result.hasData ? 'Firebase នេះមានទិន្នន័យសាលារួចហើយ។' : 'Firebase នេះទទេ៖ ទិន្នន័យនឹងចាប់ផ្តើមពីការរក្សាទុកលើកដំបូង។'}</div>
            <div>
              {result.savedToVercel
                ? `បានរក្សាទុកក្នុង Vercel${result.redeploy ? ' ហើយកំពុង Redeploy (~២ នាទី) — បន្ទាប់មក Refresh ទំព័រ។' : '។ សូម Redeploy ម្តង។'}`
                : 'មិនបានរក្សាទុកក្នុង Vercel — សូមដាក់ FIREBASE_SERVICE_ACCOUNT នៅ Vercel ដោយដៃ ដើម្បីកុំឲ្យបាត់។'}
            </div>
            {result.vercelError && <div className="text-rose-700">Vercel: {result.vercelError}</div>}
          </div>
        )}

        <a href="/#" className="mt-5 block text-center text-xs font-bold text-slate-500 hover:text-teal-700">
          ← ត្រឡប់ទៅកម្មវិធី
        </a>
      </div>
    </div>
  );
};
