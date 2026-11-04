import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BackupFrequency, BackupSnapshotMeta, SchoolBackupBundle } from '../types';
import { getLocalSnapshotBundle } from '../utils/autoBackupService';
import {
  Cloud,
  CloudCheck,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Sliders,
  Database,
  Calendar,
  X,
  FileText,
  DollarSign,
  Users,
  Send,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const AutoBackupModal: React.FC = () => {
  const {
    isAutoBackupModalOpen,
    closeAutoBackupModal,
    autoBackupConfig,
    updateAutoBackupConfig,
    triggerAutoBackup,
    triggerCloudSync,
    exportDailySalesAndStudents,
    backupSnapshots,
    refreshBackupSnapshots,
    deleteBackupSnapshot,
    restoreFromSnapshotBundle,
    lastBackupTime,
    settings,
    t,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'settings' | 'snapshots'>('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [restoringSnapshotId, setRestoringSnapshotId] = useState<string | null>(null);
  const [confirmRestoreBundle, setConfirmRestoreBundle] = useState<SchoolBackupBundle | null>(null);

  // Form states for settings
  const [enabled, setEnabled] = useState(autoBackupConfig.enabled);
  const [frequency, setFrequency] = useState<BackupFrequency>(autoBackupConfig.frequency);
  const [autoPromptCloudSync, setAutoPromptCloudSync] = useState(autoBackupConfig.autoPromptCloudSync);
  const [syncToTelegramCloud, setSyncToTelegramCloud] = useState(autoBackupConfig.syncToTelegramCloud);
  const [syncToServerStorage, setSyncToServerStorage] = useState(autoBackupConfig.syncToServerStorage);
  const [maxLocalSnapshots, setMaxLocalSnapshots] = useState(autoBackupConfig.maxLocalSnapshots || 15);

  useEffect(() => {
    if (isAutoBackupModalOpen) {
      setEnabled(autoBackupConfig.enabled);
      setFrequency(autoBackupConfig.frequency);
      setAutoPromptCloudSync(autoBackupConfig.autoPromptCloudSync);
      setSyncToTelegramCloud(autoBackupConfig.syncToTelegramCloud);
      setSyncToServerStorage(autoBackupConfig.syncToServerStorage);
      setMaxLocalSnapshots(autoBackupConfig.maxLocalSnapshots || 15);
      refreshBackupSnapshots();
    }
  }, [isAutoBackupModalOpen, autoBackupConfig]);

  if (!isAutoBackupModalOpen) return null;

  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleManualBackup = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await triggerAutoBackup('manual');
      if (res.success) {
        showFeedback(t('បានបង្កើត Backup ដោយជោគជ័យ និងរក្សាទុកក្នុង Local Storage!', 'Backup created and saved to Local Storage successfully!'));
      } else {
        showFeedback(res.message, 'error');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Error creating backup', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloudSync = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await triggerCloudSync();
      if (res.success) {
        showFeedback(t(res.message, 'Cloud sync completed successfully!'));
      } else {
        showFeedback(res.message, 'error');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Error during cloud sync', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveConfig = () => {
    updateAutoBackupConfig({
      enabled,
      frequency,
      autoPromptCloudSync,
      syncToTelegramCloud,
      syncToServerStorage,
      maxLocalSnapshots: Number(maxLocalSnapshots) || 15,
    });
    showFeedback(t('បានរក្សាទុកការកំណត់ Auto-Backup រួចរាល់!', 'Auto-Backup settings saved!'));
  };

  const handleDownloadSnapshot = async (meta: BackupSnapshotMeta) => {
    const bundle = await getLocalSnapshotBundle(meta.id);
    if (!bundle) {
      showFeedback(t('មិនអាចស្វែងរកទិន្នន័យ Backup នេះបានទេ!', 'Snapshot data not found!'), 'error');
      return;
    }
    const jsonStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(bundle, null, 2))}`;
    const a = document.createElement('a');
    a.href = jsonStr;
    a.download = meta.filename || `BIM_Backup_${meta.timestamp.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handlePromptRestore = async (snapshotId: string) => {
    const bundle = await getLocalSnapshotBundle(snapshotId);
    if (!bundle) {
      showFeedback(t('មិនអាចផ្ទុកទិន្នន័យ Backup បានទេ!', 'Failed to load snapshot!'), 'error');
      return;
    }
    setRestoringSnapshotId(snapshotId);
    setConfirmRestoreBundle(bundle);
  };

  const handleExecuteRestore = () => {
    if (!confirmRestoreBundle) return;
    const ok = restoreFromSnapshotBundle(confirmRestoreBundle);
    if (ok) {
      showFeedback(t('បានស្តារទិន្នន័យពី Backup ជោគជ័យ!', 'Restored from backup successfully!'));
      setConfirmRestoreBundle(null);
      setRestoringSnapshotId(null);
    } else {
      showFeedback(t('ការស្តារទិន្នន័យមិនបានសម្រេច!', 'Restore operation failed!'), 'error');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatTimeAgo = (iso?: string | null) => {
    if (!iso) return t('មិនទាន់មាន (Never)', 'Never');
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / (60 * 1000));
    if (mins < 1) return t('អម្បាញ់មិញ (Just now)', 'Just now');
    if (mins < 60) return `${mins} ${t('នាទីមុន', 'mins ago')}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ${t('ម៉ោងមុន', 'hours ago')}`;
    const days = Math.floor(hours / 24);
    return `${days} ${t('ថ្ងៃមុន', 'days ago')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-khmer">
                  {t('ប្រព័ន្ធបម្រុងទុកស្វ័យប្រវត្ត & សមកាលកម្ម Cloud', 'Auto-Backup & Cloud Sync System')}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  autoBackupConfig.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {autoBackupConfig.enabled ? 'ACTIVE' : 'PAUSED'}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 font-khmer mt-0.5">
                {t(
                  'ការពារទិន្នន័យលក់ប្រចាំថ្ងៃ បញ្ជីសិស្ស និងថ្លៃសិក្សាដោយស្វ័យប្រវត្តទៅកាន់ Local Storage & Cloud',
                  'Automatically safeguard daily sales, student rosters, and fees to Local Storage & Cloud'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={closeAutoBackupModal}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Tabs */}
        <div className="px-5 pt-3 pb-0 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3.5 py-2 text-xs font-bold font-khmer border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{t('ផ្ទាំងទិដ្ឋភាពទូទៅ (Overview & Actions)', 'Overview & Actions')}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('settings')}
              className={`px-3.5 py-2 text-xs font-bold font-khmer border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'settings'
                  ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{t('កំណត់ពេល & ជម្រើស (Schedule & Config)', 'Schedule & Options')}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('snapshots')}
              className={`px-3.5 py-2 text-xs font-bold font-khmer border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'snapshots'
                  ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {t('ប្រវត្តិ Snapshots (History)', 'Snapshots History')} ({backupSnapshots.length})
              </span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 py-2 hidden sm:block">
            Last Backup: {formatTimeAgo(lastBackupTime)}
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {statusMessage && (
          <div
            className={`mx-5 mt-3 p-3 rounded-xl text-xs font-khmer flex items-center gap-2 shrink-0 animate-in fade-in duration-150 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-sky-50 text-sky-800 border border-sky-200'
            }`}
          >
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />}
            {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-sky-600" />}
            <span className="flex-1 font-semibold">{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: OVERVIEW & INSTANT ACTIONS */}
          {activeSubTab === 'overview' && (
            <div className="space-y-5">
              {/* Status Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm font-khmer flex items-center gap-2">
                      <span>{t('ស្ថានភាពការពារទិន្នន័យ (Data Protection Status)', 'Data Protection Status')}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 font-mono">
                        Multi-Tier Sync
                      </span>
                    </h4>
                    <p className="text-xs text-slate-600 font-khmer mt-0.5">
                      {t('ប្រព័ន្ធកំពុងការពារទិន្នន័យដោយស្វ័យប្រវត្តរៀងរាល់', 'Periodic auto-backup runs every')}{' '}
                      <span className="font-bold text-indigo-700 font-mono">
                        {frequency === '15m'
                          ? '15 នាទី'
                          : frequency === '30m'
                          ? '30 នាទី'
                          : frequency === '1h'
                          ? '1 ម៉ោង'
                          : frequency === '4h'
                          ? '4 ម៉ោង'
                          : frequency === 'daily_evening'
                          ? 'រៀងរាល់ម៉ោង 5:00 ល្ងាច'
                          : 'ដោយដៃ (Manual)'}
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-mono">
                      <span>• Last: {lastBackupTime ? new Date(lastBackupTime).toLocaleString('km-KH') : 'None'}</span>
                      <span>• Snapshots in ring: {backupSnapshots.length}/{maxLocalSnapshots}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleManualBackup}
                    disabled={isProcessing}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-khmer flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>{t('បម្រុងទុកឥឡូវនេះ (Backup Now)', 'Backup Now')}</span>
                  </button>

                  <button
                    onClick={handleCloudSync}
                    disabled={isProcessing}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-khmer flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>{t('Sync ទៅ Cloud (Sync Cloud)', 'Sync to Cloud')}</span>
                  </button>
                </div>
              </div>

              {/* Action Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Local Storage Backup */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                      <Database className="w-5 h-5" />
                    </div>
                    <h5 className="font-bold text-slate-900 font-khmer text-sm">
                      {t('Local Storage Snapshots', 'Local Storage Snapshots')}
                    </h5>
                    <p className="text-xs text-slate-500 font-khmer mt-1">
                      {t(
                        'រក្សាទុកកញ្ចប់ Snapshot ក្នុង Browser (LocalStorage & IndexedDB) ធានាថាមិនបាត់បង់ពេល Refresh ឬដាច់ Internet។',
                        'Saves snapshots locally into browser storage and IndexedDB. Safe offline.'
                      )}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">
                      {backupSnapshots.length} កំណត់ត្រា
                    </span>
                    <button
                      onClick={() => setActiveSubTab('snapshots')}
                      className="text-indigo-600 hover:text-indigo-800 font-bold font-khmer text-xs flex items-center gap-1"
                    >
                      <span>{t('មើលបញ្ជី Snapshots', 'View Snapshots')}</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                {/* Card 2: Export Daily Sales & Students */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5">
                      <Download className="w-5 h-5" />
                    </div>
                    <h5 className="font-bold text-slate-900 font-khmer text-sm">
                      {t('ទាញយកឯកសារ JSON ប្រចាំថ្ងៃ', 'Export Daily Sales & Students')}
                    </h5>
                    <p className="text-xs text-slate-500 font-khmer mt-1">
                      {t(
                        'ទាញយកទិន្នន័យលក់ថ្ងៃនេះ បញ្ជីសិស្សតាមថ្នាក់ និងស្ថានភាពបង់ប្រាក់ជាឯកសារ .json រក្សាទុកលើកុំព្យូទ័រ។',
                        'Export current daily sales transactions, tuition fee receipts, and full student directory as JSON.'
                      )}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-3">
                    <button
                      onClick={exportDailySalesAndStudents}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold font-khmer flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('ទាញយក JSON (Download JSON)', 'Download JSON Export')}</span>
                    </button>
                  </div>
                </div>

                {/* Card 3: Cloud Sync via Telegram / Server */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-2.5">
                      <Send className="w-5 h-5" />
                    </div>
                    <h5 className="font-bold text-slate-900 font-khmer text-sm">
                      {t('សមកាលកម្មទៅ Cloud Group', 'Cloud Sync & Telegram Dispatch')}
                    </h5>
                    <p className="text-xs text-slate-500 font-khmer mt-1">
                      {t(
                        'បញ្ជូនឯកសារ Backup ដោយស្វ័យប្រវត្តទៅកាន់ Server Storage និង Telegram Group របស់ថ្នាក់ដឹកនាំសាលា។',
                        'Dispatches backup documents directly to Server storage and Telegram Cloud group.'
                      )}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-slate-500 truncate max-w-[130px]">
                      {settings.telegramConfig.chatId || 'No Telegram Chat ID'}
                    </span>
                    <button
                      onClick={handleCloudSync}
                      disabled={isProcessing}
                      className="text-sky-600 hover:text-sky-800 font-bold font-khmer text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>{t('Sync ឥឡូវនេះ', 'Sync Now')}</span>
                      <Cloud className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Latest Snapshot Quick Preview */}
              {backupSnapshots.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 font-khmer text-xs flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>{t('កំណត់ត្រា Backup ចុងក្រោយបង្អស់ (Latest Local Snapshot)', 'Latest Local Snapshot')}</span>
                    </h5>
                    <span className="font-mono text-[11px] text-slate-500">
                      {new Date(backupSnapshots[0].timestamp).toLocaleString('km-KH')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-khmer">សិស្សសរុប (Students)</div>
                      <div className="font-bold text-slate-900 text-sm font-mono mt-0.5">
                        {backupSnapshots[0].totalStudents} នាក់
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-khmer">ការលក់ថ្ងៃនេះ (Today Sales)</div>
                      <div className="font-bold text-emerald-700 text-sm font-mono mt-0.5">
                        ${backupSnapshots[0].todaySalesUSD.toFixed(2)}
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-khmer">ប្រតិបត្តិការ (Transactions)</div>
                      <div className="font-bold text-slate-900 text-sm font-mono mt-0.5">
                        {backupSnapshots[0].todayTransactionsCount} ប្រតិបត្តិការ
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-khmer">ទំហំឯកសារ (Size)</div>
                      <div className="font-bold text-slate-900 text-sm font-mono mt-0.5">
                        {formatFileSize(backupSnapshots[0].fileSizeBytes)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleDownloadSnapshot(backupSnapshots[0])}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold font-khmer flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('ទាញយក JSON', 'Download JSON')}</span>
                    </button>
                    <button
                      onClick={() => handlePromptRestore(backupSnapshots[0].id)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold font-khmer flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t('ស្តារទិន្នន័យ (Restore)', 'Restore')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SCHEDULE & OPTIONS SETTINGS */}
          {activeSubTab === 'settings' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
                <h4 className="font-bold text-slate-900 font-khmer text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>{t('កាលវិភាគបម្រុងទុកស្វ័យប្រវត្ត (Auto-Backup Scheduler)', 'Auto-Backup Scheduler')}</span>
                </h4>

                {/* Enable Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="font-bold text-slate-800 text-xs font-khmer">
                      {t('បើកដំណើរការ Auto-Backup (Enable Periodic Auto-Backup)', 'Enable Periodic Auto-Backup')}
                    </div>
                    <div className="text-[11px] text-slate-500 font-khmer mt-0.5">
                      {t('ប្រព័ន្ធនឹងធ្វើការ Backup ទៅ Local Storage ដោយស្វ័យប្រវត្តតាមចន្លោះពេលដែលបានជ្រើសរើស', 'Automatically exports snapshots at your chosen time interval')}
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Frequency Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-khmer mb-1.5">
                    {t('ភាពញឹកញាប់នៃការ Backup (Backup Frequency / Interval):', 'Backup Frequency / Interval:')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      { val: '15m', labelKhmer: 'រៀងរាល់ 15 នាទី', labelEn: 'Every 15 mins' },
                      { val: '30m', labelKhmer: 'រៀងរាល់ 30 នាទី', labelEn: 'Every 30 mins' },
                      { val: '1h', labelKhmer: 'រៀងរាល់ 1 ម៉ោង (ណែនាំ)', labelEn: 'Every 1 hour (Rec.)' },
                      { val: '4h', labelKhmer: 'រៀងរាល់ 4 ម៉ោង', labelEn: 'Every 4 hours' },
                      { val: 'daily_evening', labelKhmer: 'រៀងរាល់ម៉ោង 5:00 ល្ងាច', labelEn: 'Daily at 5:00 PM' },
                      { val: 'manual', labelKhmer: 'ដោយដៃតែប៉ុណ្ណោះ', labelEn: 'Manual Only' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setFrequency(opt.val as BackupFrequency)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          frequency === opt.val
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200 font-bold'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium'
                        }`}
                      >
                        <div className="font-khmer text-xs">{opt.labelKhmer}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{opt.labelEn}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Toggles */}
                <div className="space-y-2.5 pt-2">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoPromptCloudSync}
                      onChange={(e) => setAutoPromptCloudSync(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-xs font-khmer">
                        {t('បង្ហាញប្រអប់សួរ Sync ទៅ Cloud ពេល Backup រួច (Prompt Cloud Sync)', 'Prompt Cloud Sync after auto-backup')}
                      </div>
                      <div className="text-[11px] text-slate-500 font-khmer">
                        {t('ផ្តល់ជម្រើសរហ័សដើម្បីបញ្ជូនទិន្នន័យទៅ Telegram Cloud ឬ Server Storage ភ្លាមៗ', 'Displays a subtle quick prompt to sync to Cloud storage')}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncToServerStorage}
                      onChange={(e) => setSyncToServerStorage(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-xs font-khmer">
                        {t('រក្សាទុក Snapshot ទៅកាន់ Server Backups Folder (/data/backups/)', 'Save snapshot files to server storage')}
                      </div>
                      <div className="text-[11px] text-slate-500 font-khmer">
                        {t('បង្កើតឯកសារ .json ស្វ័យប្រវត្តលើ Server សម្រាប់ការពារទិន្នន័យរយៈពេលវែង', 'Persists JSON files onto server disk alongside local browser cache')}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncToTelegramCloud}
                      onChange={(e) => setSyncToTelegramCloud(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-xs font-khmer">
                        {t('បញ្ជូនទៅ Telegram Cloud Group ដោយស្វ័យប្រវត្ត (Auto-send to Telegram)', 'Auto-dispatch to Telegram Cloud Group')}
                      </div>
                      <div className="text-[11px] text-slate-500 font-khmer">
                        {t('បញ្ជូនឯកសារ JSON ទៅ Group ថ្នាក់ដឹកនាំ ប្រសិនបើមានកំណត់ Bot Token & Chat ID', 'Sends JSON documents to configured Telegram group for off-site disaster recovery')}
                      </div>
                    </div>
                  </label>
                </div>

                {/* Retain Snapshots Ring Count */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 font-khmer mb-1">
                    {t('ចំនួន Snapshots រក្សាទុកក្នុង Local Storage (Ring Buffer Size):', 'Local Snapshots Ring Buffer Size:')}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="5"
                      value={maxLocalSnapshots}
                      onChange={(e) => setMaxLocalSnapshots(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <span className="font-mono font-bold text-xs px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800 shrink-0">
                      {maxLocalSnapshots} snapshots
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-khmer flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('រក្សាទុកការកំណត់ (Save Configuration)', 'Save Configuration')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SNAPSHOTS HISTORY TABLE */}
          {activeSubTab === 'snapshots' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 font-khmer text-sm">
                    {t('ប្រវត្តិ Snapshots ក្នុង Local Storage', 'Local Storage Snapshots History')}
                  </h4>
                  <p className="text-xs text-slate-500 font-khmer mt-0.5">
                    {t('អាចទាញយកជា JSON ឬស្តារទិន្នន័យ (Restore) ឡើងវិញបានគ្រប់ពេលវេលា', 'Download as JSON or restore state anytime')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={refreshBackupSnapshots}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-khmer font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('ផ្ទុកឡើងវិញ', 'Refresh')}</span>
                </button>
              </div>

              {backupSnapshots.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-600 font-khmer">
                    {t('មិនទាន់មាន Snapshot ក្នុង Local Storage នៅឡើយទេ', 'No local snapshots stored yet')}
                  </div>
                  <button
                    onClick={handleManualBackup}
                    className="mt-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold font-khmer inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{t('បង្កើត Snapshot ដំបូង (Create First Snapshot)', 'Create First Snapshot')}</span>
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-khmer">
                        <tr>
                          <th className="py-2.5 px-3 font-bold">កាលបរិច្ឆេទ (Timestamp)</th>
                          <th className="py-2.5 px-3 font-bold">ប្រភព (Source)</th>
                          <th className="py-2.5 px-3 font-bold">ទិន្នន័យ (Records)</th>
                          <th className="py-2.5 px-3 font-bold">ចំណូលថ្ងៃនេះ (Sales)</th>
                          <th className="py-2.5 px-3 font-bold">ទំហំ (Size)</th>
                          <th className="py-2.5 px-3 font-bold text-right">សកម្មភាព (Actions)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {backupSnapshots.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 text-xs">
                                {new Date(item.timestamp).toLocaleString('km-KH')}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                ID: {item.id}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-khmer">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.source === 'auto_interval'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : item.source === 'cloud_sync'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {item.source === 'auto_interval'
                                  ? 'ស្វ័យប្រវត្ត (Auto)'
                                  : item.source === 'cloud_sync'
                                  ? 'Cloud Sync'
                                  : 'ដោយដៃ (Manual)'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-khmer">
                              <div className="text-slate-800 font-medium">
                                {item.totalStudents} សិស្ស ({item.totalClasses} ថ្នាក់)
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {item.todayTransactionsCount} txs (Fee: {item.summary?.feePaymentsCount || 0}, Mat: {item.summary?.materialsCount || 0})
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-emerald-700 text-xs">
                                ${item.todaySalesUSD.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {item.todaySalesKHR.toLocaleString()} ៛
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 text-xs">
                              {formatFileSize(item.fileSizeBytes)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1 font-khmer">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSnapshot(item)}
                                  className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title={t('ទាញយកឯកសារ JSON', 'Download JSON file')}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePromptRestore(item.id)}
                                  className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                  title={t('ស្តារទិន្នន័យឡើងវិញ (Restore)', 'Restore')}
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(t('តើអ្នកពិតជាចង់លុប Snapshot នេះមែនទេ?', 'Delete this snapshot?'))) {
                                      deleteBackupSnapshot(item.id);
                                      showFeedback(t('បានលុប Snapshot ដោយជោគជ័យ!', 'Snapshot deleted!'));
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title={t('លុបកំណត់ត្រានេះ', 'Delete')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-khmer flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{t('ទិន្នន័យត្រូវបានការពារដោយស្វ័យប្រវត្តក្នុង LocalStorage & IndexedDB', 'State mirrored in resilient LocalStorage & IndexedDB')}</span>
          </div>

          <button
            type="button"
            onClick={closeAutoBackupModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-khmer transition-colors cursor-pointer"
          >
            {t('បិទ (Close)', 'Close')}
          </button>
        </div>
      </div>

      {/* Safety Confirmation Modal for Restore */}
      {confirmRestoreBundle && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border-2 border-amber-400 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 font-khmer text-base">
                  {t('បញ្ជាក់ការស្តារទិន្នន័យឡើងវិញ (Confirm Restore)', 'Confirm Restore from Snapshot')}
                </h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {confirmRestoreBundle.snapshotId}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-khmer space-y-1">
              <p className="font-semibold">
                ⚠️ {t('ការស្តារទិន្នន័យនឹងជំនួសទិន្នន័យបច្ចុប្បន្នដោយទិន្នន័យពី Snapshot នេះ៖', 'Restoring will replace current state with this snapshot:')}
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] pt-1">
                <li>{t('កាលបរិច្ឆេទបង្កើត៖', 'Created at:')} {new Date(confirmRestoreBundle.createdAt).toLocaleString('km-KH')}</li>
                <li>{t('ចំនួនសិស្ស៖', 'Students count:')} {confirmRestoreBundle.studentRecords?.totalStudents || 0} នាក់</li>
                <li>{t('ចំណូលលក់ប្រចាំថ្ងៃ៖', 'Daily Sales:')} ${confirmRestoreBundle.dailySales?.totals?.usd || 0} ({confirmRestoreBundle.dailySales?.totals?.khr?.toLocaleString() || 0} ៛)</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRestoreBundle(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold font-khmer transition-colors cursor-pointer"
              >
                {t('បោះបង់ (Cancel)', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold font-khmer transition-colors cursor-pointer shadow-xs"
              >
                {t('យល់ព្រមស្តារទិន្នន័យ (Yes, Restore)', 'Yes, Restore Now')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
