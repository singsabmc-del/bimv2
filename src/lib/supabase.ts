import { createClient } from '@supabase/supabase-js';

const REAL_SUPABASE_URL = 'https://fsiccthpfzmyaowwjzsw.supabase.co';
const REAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzaWNjdGhwZnpteWFvd3dqenN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3NzExMzMsImV4cCI6MjEwOTM0NzEzM30.NeTUZ8VTaVnA5kAtrZv2Y-s6iMbcTmWwm4SdHt3wNrI';
const REAL_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_U0h9397Q3Bfs9qi7jUP0YQ_qBs8GkGS';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_URL = (envUrl && !envUrl.includes('your-project') && envUrl.startsWith('http'))
  ? envUrl
  : REAL_SUPABASE_URL;

const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const SUPABASE_ANON_KEY = (envAnonKey && !envAnonKey.includes('your-anon-key') && envAnonKey.length > 20)
  ? envAnonKey
  : REAL_SUPABASE_ANON_KEY;

const envPublKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const SUPABASE_PUBLISHABLE_KEY = (envPublKey && !envPublKey.includes('your-publishable-key'))
  ? envPublKey
  : REAL_SUPABASE_PUBLISHABLE_KEY;

// Client-side Supabase instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'bim-rangsei-school',
    },
  },
});

export interface SupabaseHealthResult {
  connected: boolean;
  latencyMs?: number;
  url: string;
  projectId: string;
  error?: string;
  storageType?: 'supabase_postgres' | 'supabase_rest' | 'local_fallback';
  lastSyncedAt?: string;
}

/**
 * Check connectivity to Supabase via server API or direct ping
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  const start = performance.now();
  const projectId = 'fsiccthpfzmyaowwjzsw';

  try {
    // 1. Try server-side Supabase verification endpoint
    const res = await fetch('/api/supabase/status', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      const json = await res.json();
      return {
        connected: !!json.connected,
        latencyMs: Math.round(performance.now() - start),
        url: json.url || SUPABASE_URL,
        projectId: json.projectId || projectId,
        storageType: json.storageType || 'supabase_postgres',
        lastSyncedAt: json.lastSyncedAt,
        error: json.error,
      };
    }
  } catch {
    // Fall back to direct client check
  }

  // 2. Client-side direct ping to Supabase Auth/REST endpoint
  try {
    const directStart = performance.now();
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
      },
    });

    const latency = Math.round(performance.now() - directStart);
    if (res.ok || res.status === 200 || res.status === 401) {
      return {
        connected: true,
        latencyMs: latency,
        url: SUPABASE_URL,
        projectId,
        storageType: 'supabase_rest',
      };
    }

    return {
      connected: false,
      latencyMs: latency,
      url: SUPABASE_URL,
      projectId,
      error: `HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      connected: false,
      url: SUPABASE_URL,
      projectId,
      error: err.message || 'Cannot reach Supabase host',
    };
  }
}

/**
 * Save school master state snapshot to Supabase through the backend
 */
export async function saveStateToSupabase(stateBundle: any): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/supabase/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stateBundle),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { success: false, error: errJson.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { success: !!data.success };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error saving to Supabase' };
  }
}

/**
 * Load school master state from Supabase through the backend
 */
export async function loadStateFromSupabase(): Promise<any | null> {
  try {
    const res = await fetch('/api/supabase/state');
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        return json.data;
      }
    }
    return null;
  } catch {
    return null;
  }
}
