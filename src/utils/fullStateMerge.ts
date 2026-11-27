// Merge for the whole school state, so several people saving at the same time (two cashiers,
// a cashier and an admin…) never wipe each other's work.
//
// The app stamps what it changed since its last save: each changed list item gets `_u` (time),
// each changed object-map entry / class / whole section gets a time in `_sync`, and removed items
// are remembered in `_sync.del`. The server then merges item by item: newest change wins, and
// anything that was not deleted on purpose is kept.

export interface SyncMeta {
  /** whole-section change time */
  t: Record<string, number>;
  /** per-key change time inside object maps (classes, canteenHistory, …) */
  k: Record<string, Record<string, number>>;
  /** tombstones: section (or "classes.<id>.students") → item id → deletion time */
  del: Record<string, Record<string, number>>;
}

/** Parts that are not merged here (handled elsewhere or per-device) */
const SKIP = new Set(['lastSavedAt', 'currentUser', '_sync', 'syncedStore', 'teacherCheckIn']);
/** Object maps merged entry by entry */
const MAP_SECTIONS = new Set(['canteenHistory', 'materialsHistory', 'uniformHistory', 'academicYearArchives']);

const emptyMeta = (): SyncMeta => ({ t: {}, k: {}, del: {} });
const isIdList = (v: any) => Array.isArray(v) && v.length > 0 && v.every((x) => x && typeof x === 'object' && 'id' in x);
const u = (x: any) => Number(x?._u) || 0;
const strip = (x: any) => {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return JSON.stringify(x);
  const { _u, ...rest } = x;
  return JSON.stringify(rest);
};

const mergeIdLists = (a: any[] = [], b: any[] = [], del: Record<string, number> = {}) => {
  const out = new Map<string, any>();
  // incoming (b) order first, then anything only the stored copy has
  [...b, ...a].forEach((item) => {
    const id = String(item?.id);
    const cur = out.get(id);
    if (!cur) out.set(id, item);
    else if (u(item) > u(cur)) out.set(id, item);
  });
  return Array.from(out.values()).filter((it) => !(del[String(it.id)] && del[String(it.id)] >= u(it)));
};

const mergeDel = (a: SyncMeta['del'] = {}, b: SyncMeta['del'] = {}) => {
  const out: SyncMeta['del'] = {};
  [a, b].forEach((m) =>
    Object.entries(m || {}).forEach(([sec, ids]) => {
      out[sec] ??= {};
      Object.entries(ids || {}).forEach(([id, ts]) => (out[sec][id] = Math.max(out[sec][id] || 0, Number(ts) || 0)));
    })
  );
  return out;
};

/** Merge a stored state (`a`) with an incoming save (`b`). Incoming wins ties. */
/**
 * Scores are merged cell by cell (period → student → subject) using `scoresT` stamps, so two
 * teachers typing scores for the same class at the same time keep both sets of marks.
 */
export const mergeScoreBooks = (ca: any, cb: any, bWins: boolean) => {
  const sa = ca.scores || {}, sb = cb.scores || {};
  const ta = ca.scoresT || {}, tb = cb.scoresT || {};
  const scores: any = {}, scoresT: any = {};
  new Set([...Object.keys(sa), ...Object.keys(sb)]).forEach((p) => {
    scores[p] = {};
    scoresT[p] = {};
    new Set([...Object.keys(sa[p] || {}), ...Object.keys(sb[p] || {})]).forEach((st) => {
      const ra = sa[p]?.[st] || {}, rb = sb[p]?.[st] || {};
      const xa = ta[p]?.[st] || {}, xb = tb[p]?.[st] || {};
      const row: any = {}, rowT: any = {};
      new Set([...Object.keys(ra), ...Object.keys(rb)]).forEach((sub) => {
        const inA = sub in ra, inB = sub in rb;
        const tA = Number(xa[sub]) || 0, tB = Number(xb[sub]) || 0;
        const useB = inB && (!inA || tB > tA || (tB === tA && bWins));
        row[sub] = useB ? rb[sub] : ra[sub];
        const t = useB ? tB : tA;
        if (t) rowT[sub] = t;
      });
      scores[p][st] = row;
      if (Object.keys(rowT).length) scoresT[p][st] = rowT;
    });
  });
  return { scores, scoresT };
};

export const mergeFullState = (a: any, b: any) => {
  if (!a || typeof a !== 'object') return b;
  if (!b || typeof b !== 'object') return a;
  const ma: SyncMeta = { ...emptyMeta(), ...(a._sync || {}) };
  const mb: SyncMeta = { ...emptyMeta(), ...(b._sync || {}) };
  const del = mergeDel(ma.del, mb.del);
  const meta: SyncMeta = { t: { ...ma.t }, k: {}, del };
  Object.entries(mb.t || {}).forEach(([s, ts]) => (meta.t[s] = Math.max(meta.t[s] || 0, ts)));
  const out: any = { ...a, ...b };

  const sections = new Set([...Object.keys(a), ...Object.keys(b)]);
  sections.forEach((s) => {
    if (SKIP.has(s)) return;
    const va = a[s];
    const vb = b[s];
    if (vb === undefined) {
      out[s] = va;
      return;
    }
    if (va === undefined) return;

    // Lists of records with ids (sales, payments, users, teachers, …)
    if ((isIdList(va) || isIdList(vb)) && Array.isArray(va) && Array.isArray(vb)) {
      out[s] = mergeIdLists(va, vb, del[s]);
      return;
    }

    // Classes: class by class, students one by one
    if (s === 'classes' && va && vb && typeof va === 'object' && typeof vb === 'object') {
      const ka = ma.k?.classes || {};
      const kb = mb.k?.classes || {};
      const merged: any = {};
      new Set([...Object.keys(va), ...Object.keys(vb)]).forEach((cid) => {
        const ca = va[cid];
        const cb = vb[cid];
        const ta = ka[cid] || 0;
        const tb = kb[cid] || 0;
        const dt = del.classes?.[cid] || 0;
        if (!ca || !cb) {
          const only = ca || cb;
          const t = ca ? ta : tb;
          if (!(dt && dt >= t)) merged[cid] = only;
          return;
        }
        const base = tb >= ta ? cb : ca;
        merged[cid] = {
          ...base,
          students: mergeIdLists(ca.students || [], cb.students || [], del[`classes.${cid}.students`]),
          ...(ca.scores || cb.scores ? mergeScoreBooks(ca, cb, tb >= ta) : {}),
        };
      });
      out[s] = merged;
      meta.k.classes = { ...ka };
      Object.entries(kb).forEach(([cid, ts]) => (meta.k.classes[cid] = Math.max(meta.k.classes[cid] || 0, ts)));
      return;
    }

    // Object maps: entry by entry
    if (MAP_SECTIONS.has(s) && va && vb && typeof va === 'object' && typeof vb === 'object' && !Array.isArray(va)) {
      const ka = ma.k?.[s] || {};
      const kb = mb.k?.[s] || {};
      const merged: any = {};
      new Set([...Object.keys(va), ...Object.keys(vb)]).forEach((key) => {
        const ta = ka[key] || 0;
        const tb = kb[key] || 0;
        const dt = del[s]?.[key] || 0;
        let v = key in vb && key in va ? (tb >= ta ? vb[key] : va[key]) : key in vb ? vb[key] : va[key];
        const t = key in vb && key in va ? Math.max(ta, tb) : key in vb ? tb : ta;
        if (dt && dt >= t) return;
        merged[key] = v;
      });
      out[s] = merged;
      meta.k[s] = { ...ka };
      Object.entries(kb).forEach(([key, ts]) => (meta.k[s][key] = Math.max(meta.k[s][key] || 0, ts)));
      return;
    }

    // Anything else (settings, class order, month list…): the newer change wins
    out[s] = (mb.t?.[s] || 0) >= (ma.t?.[s] || 0) ? vb : va;
  });

  // keep per-key times of sections we did not touch above
  [ma.k, mb.k].forEach((m) =>
    Object.entries(m || {}).forEach(([s, keys]) => {
      if (meta.k[s]) return;
      meta.k[s] = { ...(ma.k?.[s] || {}) };
      Object.entries(keys || {}).forEach(([key, ts]) => (meta.k[s][key] = Math.max(meta.k[s][key] || 0, ts)));
    })
  );
  out._sync = meta;
  return out;
};

// ───────────────────────── Client side: stamp what changed since the last save ─────────────────────────
type Snap = {
  lists: Record<string, Record<string, string>>; // section → id → json
  classes: Record<string, { meta: string; students: Record<string, string> }>;
  maps: Record<string, Record<string, string>>;
  plain: Record<string, string>;
};

const snapshotOf = (bundle: any): Snap => {
  const snap: Snap = { lists: {}, classes: {}, maps: {}, plain: {} };
  Object.keys(bundle || {}).forEach((s) => {
    if (SKIP.has(s)) return;
    const v = bundle[s];
    if (isIdList(v)) {
      snap.lists[s] = Object.fromEntries(v.map((x: any) => [String(x.id), strip(x)]));
    } else if (s === 'classes' && v && typeof v === 'object') {
      Object.entries(v).forEach(([cid, c]: [string, any]) => {
        const { students, ...meta } = c || {};
        snap.classes[cid] = { meta: JSON.stringify(meta), students: Object.fromEntries((students || []).map((x: any) => [String(x.id), strip(x)])) };
      });
    } else if (MAP_SECTIONS.has(s) && v && typeof v === 'object' && !Array.isArray(v)) {
      snap.maps[s] = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, JSON.stringify(x)]));
    } else {
      snap.plain[s] = JSON.stringify(v);
    }
  });
  return snap;
};

let lastSnap: Snap | null = null;
let meta: SyncMeta = (() => {
  try {
    return { ...emptyMeta(), ...(JSON.parse(localStorage.getItem('BIM_SYNC_META') || 'null') || {}) };
  } catch {
    return emptyMeta();
  }
})();
const saveMeta = () => {
  try {
    localStorage.setItem('BIM_SYNC_META', JSON.stringify(meta));
  } catch {}
};

/** Remember data that just came from the server, so it is not treated as a local change */
export const rememberServerState = (data: any) => {
  if (!data || typeof data !== 'object') return;
  const fresh = snapshotOf(data);
  if (!lastSnap) lastSnap = fresh;
  else {
    Object.keys(data).forEach((s) => {
      if (SKIP.has(s)) return;
      if (fresh.lists[s]) lastSnap!.lists[s] = fresh.lists[s];
      if (s === 'classes') lastSnap!.classes = fresh.classes;
      if (fresh.maps[s]) lastSnap!.maps[s] = fresh.maps[s];
      if (s in fresh.plain) lastSnap!.plain[s] = fresh.plain[s];
    });
  }
  if (data._sync) {
    const m: SyncMeta = { ...emptyMeta(), ...data._sync };
    Object.entries(m.t || {}).forEach(([s, ts]) => (meta.t[s] = Math.max(meta.t[s] || 0, ts)));
    Object.entries(m.k || {}).forEach(([s, keys]) => {
      meta.k[s] ??= {};
      Object.entries(keys || {}).forEach(([key, ts]) => (meta.k[s][key] = Math.max(meta.k[s][key] || 0, ts)));
    });
    meta.del = mergeDel(meta.del, m.del);
    saveMeta();
  }
};

/** Is a section of this device different from what it last sent / received? (= unsaved local edits) */
export const hasLocalChanges = (bundle: any, section: string) => {
  if (!lastSnap) return false;
  const cur = snapshotOf({ [section]: bundle[section] });
  if (cur.lists[section]) return JSON.stringify(cur.lists[section]) !== JSON.stringify(lastSnap.lists[section] || {});
  if (section === 'classes') return JSON.stringify(cur.classes) !== JSON.stringify(lastSnap.classes);
  if (cur.maps[section]) return JSON.stringify(cur.maps[section]) !== JSON.stringify(lastSnap.maps[section] || {});
  return cur.plain[section] !== lastSnap.plain[section];
};

/** The change-tracking baseline, so a save that did not reach the server can be undone */
export const getSyncBaseline = () => lastSnap;
export const restoreSyncBaseline = (snap: typeof lastSnap) => {
  lastSnap = snap;
};

/** Stamp a bundle before sending it: changed items get `_u`, removals become tombstones. */
export const stampForSync = (bundle: any, now = Date.now()) => {
  const out: any = { ...bundle };
  const cur = snapshotOf(bundle);
  if (!lastSnap) {
    // First save after opening the app: nothing to compare with yet
    lastSnap = cur;
    out._sync = meta;
    return out;
  }
  const prev = lastSnap;

  Object.entries(cur.lists).forEach(([s, items]) => {
    const before = prev.lists[s] || {};
    out[s] = (bundle[s] as any[]).map((x) => (before[String(x.id)] !== items[String(x.id)] ? { ...x, _u: now } : x));
    Object.keys(before).forEach((id) => {
      if (!(id in items)) (meta.del[s] ??= {})[id] = now;
    });
    if (JSON.stringify(before) !== JSON.stringify(items)) meta.t[s] = now;
  });
  // A list that became empty
  Object.keys(prev.lists).forEach((s) => {
    if (!cur.lists[s] && Array.isArray(bundle[s])) {
      Object.keys(prev.lists[s]).forEach((id) => ((meta.del[s] ??= {})[id] = now));
      meta.t[s] = now;
    }
  });

  if (bundle.classes) {
    const classesOut: any = {};
    Object.entries(bundle.classes as Record<string, any>).forEach(([cid, c]) => {
      const was = prev.classes[cid];
      const nowSnap = cur.classes[cid];
      if (!was || was.meta !== nowSnap.meta) (meta.k.classes ??= {})[cid] = now;
      const beforeSt = was?.students || {};
      classesOut[cid] = {
        ...c,
        students: (c.students || []).map((st: any) => (beforeSt[String(st.id)] !== nowSnap.students[String(st.id)] ? { ...st, _u: now } : st)),
      };
      Object.keys(beforeSt).forEach((id) => {
        if (!(id in nowSnap.students)) (meta.del[`classes.${cid}.students`] ??= {})[id] = now;
      });
    });
    Object.keys(prev.classes).forEach((cid) => {
      if (!(cid in bundle.classes)) (meta.del.classes ??= {})[cid] = now;
    });
    out.classes = classesOut;
  }

  Object.entries(cur.maps).forEach(([s, entries]) => {
    const before = prev.maps[s] || {};
    Object.entries(entries).forEach(([key, json]) => {
      if (before[key] !== json) (meta.k[s] ??= {})[key] = now;
    });
    Object.keys(before).forEach((key) => {
      if (!(key in entries)) (meta.del[s] ??= {})[key] = now;
    });
  });

  Object.entries(cur.plain).forEach(([s, json]) => {
    if (prev.plain[s] !== json) meta.t[s] = now;
  });

  lastSnap = cur;
  saveMeta();
  out._sync = meta;
  return out;
};
