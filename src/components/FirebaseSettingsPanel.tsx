// System Settings → Firebase Cloud: where the school data lives now (replaces the old Supabase tab).
import React, { useEffect, useState } from 'react';
import { CheckCircle2, CloudDownload, Database, ExternalLink, Loader2, RefreshCw, ShieldAlert, UploadCloud } from 'lucide-react';
import { useApp } from '../context/AppContext';

type FbStatus = { configured: boolean; projectId?: string | null; connected?: boolean; lastSavedAt?: number | null; error?: string | null; message?: string };

export const useFirebaseStatus = () => {
  const [status, setStatus] = useState<FbStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const refresh = async () => {
    setLoading(true);
    try {
      setStatus(await fetch('/api/firebase/status', { cache: 'no-store' }).then((r) => r.json()));
    } catch (e: any) {
      setStatus({ configured: false, error: e?.message || 'Server unreachable' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
  }, []);
  return { status, loading, refresh };
};

export const FirebaseSettingsPanel: React.FC = () => {
  const { syncToSupabaseNow, restoreFromSupabaseNow, permissions } = useApp() as any;
  const { status, loading, refresh } = useFirebaseStatus();
  const [busy, setBusy] = useState<'' | 'sync' | 'restore'>('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const canEdit = !!permissions?.canEdit;

  const run = async (kind: 'sync' | 'restore') => {
    if (kind === 'restore' && !window.confirm('ទាញទិន្នន័យពី Firebase មកជំនួសទិន្នន័យនៅលើឧបករណ៍នេះ?')) return;
    setBusy(kind);
    setMsg(null);
    try {
      const res = kind === 'sync' ? await syncToSupabaseNow() : await restoreFromSupabaseNow();
      setMsg({ ok: !!res?.success, text: res?.message || '' });
      refresh();
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || 'Error' });
    } finally {
      setBusy('');
    }
  };

  const ok = status?.configured && status?.connected;
  return (
    <div className="w-full space-y-5 rounded-2xl border border-slate-200 bg-white p-4 font-khmer shadow-2xs sm:p-6">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">មូលដ្ឋានទិន្នន័យ Firebase Cloud</div>
            <div className="text-xs text-slate-500">ទិន្នន័យសាលាទាំងអស់រក្សាទុកក្នុង Cloud Firestore ហើយ Sync ស្វ័យប្រវត្តិ</div>
          </div>
        </div>
        <button type="button" onClick={refresh} className="flex items-center gap-1.5 self-start rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> ពិនិត្យម្តងទៀត
        </button>
      </div>

      <div className={`rounded-xl border p-4 ${ok ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'}`}>
        {!status ? (
          <span className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> កំពុងពិនិត្យ…</span>
        ) : (
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <div className="text-[11px] text-slate-500">ស្ថានភាព</div>
              <div className={`flex items-center gap-1.5 font-bold ${ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                {ok ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                {ok ? 'ភ្ជាប់រួច' : status.configured ? 'ភ្ជាប់មិនបាន' : 'មិនទាន់កំណត់'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Firebase Project</div>
              <div className="font-mono font-bold text-slate-800">{status.projectId || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">រក្សាទុកចុងក្រោយ</div>
              <div className="font-bold text-slate-800">{status.lastSavedAt ? new Date(status.lastSavedAt).toLocaleString('en-GB') : '—'}</div>
            </div>
            {(status.error || status.message) && <div className="text-xs text-rose-700 sm:col-span-3">{status.error || status.message}</div>}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" disabled={!canEdit || !!busy} onClick={() => run('sync')} className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">
          {busy === 'sync' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} រក្សាទុកទៅ Firebase ឥឡូវនេះ
        </button>
        <button type="button" disabled={!canEdit || !!busy} onClick={() => run('restore')} className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
          {busy === 'restore' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />} ទាញទិន្នន័យពី Firebase
        </button>
      </div>
      {msg && <div className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>{msg.text}</div>}

      <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
        <div>• ការកែប្រែទាំងអស់ Sync ទៅ Firebase ដោយស្វ័យប្រវត្តិ — ប៊ូតុងខាងលើសម្រាប់ករណីចាំបាច់ប៉ុណ្ណោះ។</div>
        <div>• Backup ប្រចាំថ្ងៃ (ម៉ោង ៥ ល្ងាច) ត្រូវបានរក្សាទុកក្នុង Firebase → bim_backups។</div>
        <div className="mt-1">
          • ប្តូរទៅ Firebase project ផ្សេង (Super Admin)៖{' '}
          <a href="/#setup" className="inline-flex items-center gap-1 font-bold text-teal-700 hover:underline">
            /#setup <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
