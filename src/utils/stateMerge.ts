// Merging of the parts of the school state that many devices write at the same time
// (student attendance, teacher check-ins, leave requests…). Used by the server when a device
// saves, and by the app when it receives the merged copy back, so one phone's save never wipes
// another phone's attendance. Every item carries a timestamp; the newest wins; deletions are
// remembered as tombstones so they are not brought back by an older device.

export const ATTENDANCE_STORE_KEY = 'BIM_RANGSEI_ATTENDANCE';

/** Keys of the browser stores that are shared through the server */
export const isSyncedStoreKey = (k: string) =>
  k === ATTENDANCE_STORE_KEY ||
  k === 'BIM_HONOR_TEACHER_SIGNATURES' ||
  k.startsWith('BIM_ATTENDANCE_31D_') ||
  k.startsWith('BIM_RANGSEI_TEACHER_ATT_');

export interface SyncedStore {
  data: Record<string, any>;
  /** last change time per key */
  t: Record<string, number>;
}

const recTime = (r: any) => Number(r?.updatedAt) || 0;

/** Student attendance store: { "<classId>_<date>": record } merged record by record */
const mergeAttendanceStore = (a: Record<string, any> = {}, b: Record<string, any> = {}) => {
  const out: Record<string, any> = { ...a };
  Object.entries(b || {}).forEach(([k, rb]) => {
    const ra = out[k];
    if (!ra || recTime(rb) >= recTime(ra)) out[k] = rb;
  });
  return out;
};

/** Merge two shared browser stores. `b` wins ties. */
export const mergeSyncedStore = (a?: SyncedStore | null, b?: SyncedStore | null): SyncedStore => {
  const A: SyncedStore = { data: { ...(a?.data || {}) }, t: { ...(a?.t || {}) } };
  if (!b) return A;
  Object.keys(b.data || {}).forEach((k) => {
    if (k === ATTENDANCE_STORE_KEY) {
      A.data[k] = mergeAttendanceStore(A.data[k], b.data[k]);
      A.t[k] = Math.max(A.t[k] || 0, b.t?.[k] || 0);
      return;
    }
    if (!(k in A.data) || (b.t?.[k] || 0) >= (A.t[k] || 0)) {
      A.data[k] = b.data[k];
      A.t[k] = b.t?.[k] || 0;
    }
  });
  return A;
};

// ---------- Teacher Check In / Leave ----------
const CONFIG_KEYS = ['startTime', 'endTime', 'lateGraceMinutes', 'leaveQuotas', 'leaveTypes', 'hoursPerDay', 'shifts', 'shiftAssignments', 'holidays'];

const mergeById = (a: any[] = [], b: any[] = [], deleted: Record<string, number> = {}) => {
  const map = new Map<string, any>();
  [...a, ...b].forEach((item) => {
    if (!item?.id) return;
    const cur = map.get(item.id);
    if (!cur || recTime(item) >= recTime(cur)) map.set(item.id, item);
  });
  return Array.from(map.values()).filter((item) => !(deleted[item.id] && deleted[item.id] >= recTime(item)));
};

/** Merge two Teacher Check In data objects. `b` wins ties. */
export const mergeCheckIn = (a: any, b: any) => {
  if (!a) return b;
  if (!b) return a;
  const deleted: Record<string, number> = { ...(a.deleted || {}) };
  Object.entries(b.deleted || {}).forEach(([id, ts]) => (deleted[id] = Math.max(deleted[id] || 0, Number(ts) || 0)));
  const newerConfig = (Number(b.configUpdatedAt) || 0) >= (Number(a.configUpdatedAt) || 0) ? b : a;
  const out: any = { ...a, ...b };
  CONFIG_KEYS.forEach((k) => {
    if (k in newerConfig) out[k] = newerConfig[k];
  });
  out.configUpdatedAt = Math.max(Number(a.configUpdatedAt) || 0, Number(b.configUpdatedAt) || 0);
  out.records = mergeById(a.records, b.records, deleted);
  out.leaveRequests = mergeById(a.leaveRequests, b.leaveRequests, deleted);
  out.deleted = deleted;
  return out;
};

/**
 * Stamp a new Teacher Check In value against the previous one: changed items get `updatedAt`,
 * removed items get a tombstone, changed settings bump `configUpdatedAt`.
 */
export const stampCheckIn = (prev: any, next: any, now = Date.now()) => {
  if (!prev || prev === next) return next;
  const out: any = { ...next };
  const strip = (x: any) => {
    const { updatedAt, ...rest } = x || {};
    return JSON.stringify(rest);
  };
  const stampList = (key: 'records' | 'leaveRequests') => {
    const before = new Map<string, any>((prev[key] || []).map((x: any) => [x.id, x]));
    const after = (next[key] || []) as any[];
    out[key] = after.map((x) => {
      const old = before.get(x.id);
      return !old || strip(old) !== strip(x) ? { ...x, updatedAt: now } : x;
    });
    const afterIds = new Set(after.map((x) => x.id));
    before.forEach((_, id) => {
      if (!afterIds.has(id)) out.deleted = { ...(out.deleted || prev.deleted || {}), [id]: now };
    });
  };
  stampList('records');
  stampList('leaveRequests');
  if (CONFIG_KEYS.some((k) => JSON.stringify(prev[k]) !== JSON.stringify(next[k]))) out.configUpdatedAt = now;
  return out;
};

/** Merge the shared sections of a stored state with an incoming one (incoming wins ties). */
export const mergeSharedSections = (stored: any, incoming: any) => {
  if (!stored || !incoming) return incoming;
  const out = { ...incoming };
  if (stored.syncedStore || incoming.syncedStore) out.syncedStore = mergeSyncedStore(stored.syncedStore, incoming.syncedStore);
  if (stored.teacherCheckIn || incoming.teacherCheckIn) out.teacherCheckIn = mergeCheckIn(stored.teacherCheckIn, incoming.teacherCheckIn);
  return out;
};
