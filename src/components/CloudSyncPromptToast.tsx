import React from 'react';
import { useApp } from '../context/AppContext';
import { Cloud, X, Database, CheckCircle2, ArrowRight } from 'lucide-react';

export const CloudSyncPromptToast: React.FC = () => {
  const { cloudSyncPrompt, dismissCloudSyncPrompt, triggerCloudSync, openAutoBackupModal, t } = useApp();

  if (!cloudSyncPrompt || !cloudSyncPrompt.isOpen) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs font-khmer text-white flex items-center gap-1.5">
              <span>{t('បានបម្រុងទុកទិន្នន័យស្វ័យប្រវត្ត!', 'Auto-Backup Completed!')}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-[11px] text-slate-300 font-khmer mt-0.5 leading-snug">
              {t(
                'ទិន្នន័យលក់ និងបញ្ជីសិស្សត្រូវបានរក្សាទុកក្នុង Local Storage រួចរាល់។',
                'Daily sales and student rosters have been saved locally.'
              )}
            </div>
          </div>
        </div>

        <button
          onClick={dismissCloudSyncPrompt}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={() => {
            openAutoBackupModal();
            dismissCloudSyncPrompt();
          }}
          className="text-[11px] text-slate-400 hover:text-slate-200 font-khmer font-medium flex items-center gap-1 cursor-pointer"
        >
          <Database className="w-3.5 h-3.5" />
          <span>{t('មើល Snapshots', 'View Snapshots')}</span>
        </button>

        <button
          onClick={async () => {
            await triggerCloudSync();
            dismissCloudSyncPrompt();
          }}
          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold font-khmer flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>{t('Sync ទៅ Cloud ឥឡូវនេះ', 'Sync to Cloud Now')}</span>
        </button>
      </div>
    </div>
  );
};
