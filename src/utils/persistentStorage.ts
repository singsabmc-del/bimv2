/**
 * Multi-tier Persistent Storage Adapter for BIM Rangsei School Management
 * 
 * Prevents data loss during redeployments, browser refreshes, cache clearing,
 * host migrations, or version upgrades.
 * 
 * Layers:
 * 1. LocalStorage with universal prefix fallback & permanent unversioned mirror keys
 * 2. IndexedDB (durable browser storage, survives cache clears and redeployments)
 * 3. Server-side /api/state REST storage with snapshot backups
 * 4. Automatic snapshot archiving (BIM_RANGSEI_AUTO_SNAPSHOT)
 */

const DB_NAME = 'BIM_Rangsei_Permanent_DB';
const DB_VERSION = 1;
const STORE_NAME = 'school_state';
const PRIMARY_KEY = 'latest_school_snapshot';
const PERMANENT_MIRROR_KEY = 'BIM_RANGSEI_PERMANENT_MASTER_SNAPSHOT';

// Comprehensive list of legacy and alternative prefixes
const KNOWN_PREFIXES = [
  'BIM_RANGSEI_V4',
  'BIM_RANGSEI_V3',
  'BIM_RANGSEI_V2',
  'BIM_RANGSEI_V1',
  'BIM_RANGSEI',
  'RANGSEI_SCHOOL',
  'RANGSEI',
  'BIM',
  'SCHOOL',
  '',
];

// Open IndexedDB safely with error recovery
function openIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Save snapshot to IndexedDB with timestamp
 */
export async function saveToIndexedDB(key: string, data: any): Promise<boolean> {
  const db = await openIndexedDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record = {
        data,
        savedAt: Date.now(),
      };
      const req = store.put(record, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Load snapshot from IndexedDB
 */
export async function loadFromIndexedDB(key: string): Promise<any | null> {
  const db = await openIndexedDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const result = req.result;
        if (!result) return resolve(null);
        // Handle both raw object or { data, savedAt } wrapper
        if (result && typeof result === 'object' && 'data' in result) {
          resolve(result.data);
        } else {
          resolve(result);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Read from localStorage with deep universal fallback search across all prefixes and raw keys
 */
export function getStoredItemWithFallback<T>(primaryKey: string, legacyKeySuffix: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;

  // 1. Try exact primary key
  try {
    const raw = localStorage.getItem(primaryKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed !== undefined && parsed !== null) return parsed;
    }
  } catch {}

  // 2. Try unversioned permanent mirror key
  const permanentKey = `BIM_RANGSEI_PERMANENT_${legacyKeySuffix}`;
  try {
    const raw = localStorage.getItem(permanentKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed !== undefined && parsed !== null) {
        // Re-seed primary key for fast subsequent reads
        try { localStorage.setItem(primaryKey, raw); } catch {}
        return parsed;
      }
    }
  } catch {}

  // 3. Check all known prefixes
  for (const prefix of KNOWN_PREFIXES) {
    const key = prefix ? `${prefix}_${legacyKeySuffix}` : legacyKeySuffix;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed !== undefined && parsed !== null) {
          // Migrate to primary & permanent key
          try {
            localStorage.setItem(primaryKey, raw);
            localStorage.setItem(permanentKey, raw);
          } catch {}
          return parsed;
        }
      }
    } catch {}
  }

  // 4. Deep scan: look through all keys in localStorage for any matching suffix
  try {
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (key.endsWith(`_${legacyKeySuffix}`) || key.toUpperCase().endsWith(`_${legacyKeySuffix.toUpperCase()}`)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed !== undefined && parsed !== null) {
            try {
              localStorage.setItem(primaryKey, raw);
              localStorage.setItem(permanentKey, raw);
            } catch {}
            return parsed;
          }
        }
      }
    }
  } catch {}

  return fallback;
}

/**
 * Synchronize state to multi-tier persistent storage:
 * - LocalStorage permanent mirror
 * - IndexedDB durable storage
 * - Server REST endpoint /api/state
 */
let debounceTimeout: any = null;
export function syncStateToServer(stateBundle: any): void {
  if (typeof window === 'undefined' || !stateBundle) return;

  const now = Date.now();
  const bundleWithTimestamp = {
    ...stateBundle,
    lastSavedAt: now,
  };

  // 1. Always mirror immediately to permanent localStorage key so data is never lost even if redeployed
  try {
    const bundleStr = JSON.stringify(bundleWithTimestamp);
    localStorage.setItem(PERMANENT_MIRROR_KEY, bundleStr);
    localStorage.setItem('BIM_RANGSEI_LAST_SAVED_AT', now.toString());
  } catch {}

  // 2. Debounced sync to IndexedDB and Server to optimize performance
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(async () => {
    // Durable IndexedDB write
    saveToIndexedDB(PRIMARY_KEY, bundleWithTimestamp).catch(() => {});

    // Server-side write (if backend running)
    // Report whether the data actually reached Supabase, so the app can warn the user.
    const report = (ok: boolean, error?: string) => {
      try {
        window.dispatchEvent(new CustomEvent('bim-supabase-sync', { detail: { ok, error, at: Date.now() } }));
      } catch {}
    };
    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundleWithTimestamp),
      });
      const json: any = await res.json().catch(() => ({}));
      if (res.ok && json.savedToSupabase) report(true);
      else report(false, json.supabaseError || json.error || `HTTP ${res.status}`);
    } catch (err: any) {
      report(false, err?.message || 'Server unreachable');
    }
  }, 600);
}

/**
 * Attempt to restore state on startup with timestamp-based arbitration:
 * 1. Checks LocalStorage & IndexedDB timestamps
 * 2. Checks Server /api/state timestamp
 * 3. Whichever is NEWEST wins!
 * 4. If the local browser data is newer than newly redeployed server data,
 *    local data is PRESERVED and automatically uploaded to the server!
 */
export async function restoreStateOnStartup(): Promise<any | null> {
  // A. Check local storage
  let localData: any = null;
  let localSavedAt = 0;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const mirror = localStorage.getItem(PERMANENT_MIRROR_KEY);
      const savedAtStr = localStorage.getItem('BIM_RANGSEI_LAST_SAVED_AT');
      if (savedAtStr) {
        localSavedAt = parseInt(savedAtStr, 10) || 0;
      }
      if (mirror) {
        const parsed = JSON.parse(mirror);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          localData = parsed;
          if (parsed.lastSavedAt && parsed.lastSavedAt > localSavedAt) {
            localSavedAt = parsed.lastSavedAt;
          }
        }
      }
    }
  } catch {}

  // B. Check IndexedDB durable fallback
  let idbData: any = null;
  let idbSavedAt = 0;
  try {
    const dbRecord = await loadFromIndexedDB(PRIMARY_KEY);
    if (dbRecord && typeof dbRecord === 'object' && Object.keys(dbRecord).length > 0) {
      idbData = dbRecord;
      idbSavedAt = dbRecord.lastSavedAt || 0;
    }
  } catch {}

  // Pick the newer local store
  let bestLocalData = localData;
  let bestLocalTimestamp = localSavedAt;
  if (idbData && idbSavedAt > bestLocalTimestamp) {
    bestLocalData = idbData;
    bestLocalTimestamp = idbSavedAt;
  }

  // C. Check Server API
  let serverData: any = null;
  let serverSavedAt = 0;
  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data && typeof json.data === 'object' && Object.keys(json.data).length > 0) {
        serverData = json.data;
        serverSavedAt = serverData.lastSavedAt || 0;
      }
    }
  } catch {}

  // CRITICAL PROTECTION AGAINST RE-INITIALIZATION ON REDEPLOY:
  // If the browser already has local data, and the server data is either missing, has no timestamp,
  // or the local browser data was saved MORE RECENTLY than the server data (e.g. server was just redeployed):
  // KEEP THE BROWSER DATA, and push it to the server container!
  if (bestLocalData && (!serverData || bestLocalTimestamp >= serverSavedAt)) {
    try {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bestLocalData, lastSavedAt: bestLocalTimestamp || Date.now() }),
      }).catch(() => {});
    } catch {}

    return bestLocalData;
  }

  // If server data is strictly newer (e.g. updated from another device)
  if (serverData) {
    return serverData;
  }

  if (bestLocalData) {
    return bestLocalData;
  }

  return null;
}

