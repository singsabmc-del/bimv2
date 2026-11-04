import {
  SchoolBackupBundle,
  DailySalesExportPayload,
  StudentRecordsExportPayload,
  BackupSnapshotMeta,
  ClassFeeData,
  MaterialSaleTransaction,
  UniformSaleTransaction,
  CanteenReport,
  BusStudentEnrollment,
  BusPaymentRecord,
  SchoolSettings,
  SchoolBranch,
  UserProfile,
  DailyMaterialsReport,
} from '../types';
import { saveToIndexedDB, loadFromIndexedDB } from './persistentStorage';

export const SNAPSHOTS_STORAGE_KEY = 'BIM_AUTO_BACKUP_SNAPSHOTS_LIST';
export const LAST_BACKUP_TIME_KEY = 'BIM_LAST_AUTO_BACKUP_TIMESTAMP';

/**
 * Format today's date in DD-MM-YYYY format matching applet format
 */
export function getTodayFormatted(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}-${m}-${y}`;
}

export function getTodayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Extract and summarize current daily sales across tuition, materials, uniforms, canteen, and bus
 */
export function generateDailySalesPayload(
  classData: { [classId: string]: ClassFeeData },
  materialSalesHistory: MaterialSaleTransaction[] = [],
  uniformSalesHistory: UniformSaleTransaction[] = [],
  canteenReport?: CanteenReport,
  busPayments: BusPaymentRecord[] = [],
  exchangeRate: number = 4100,
  targetDate?: string // Optional specific date, defaults to today
): DailySalesExportPayload {
  const todayFormatted = targetDate || getTodayFormatted();
  const todayISO = getTodayISODate();

  // 1. Tuition Fee Payments matching today
  const feePayments: any[] = [];
  Object.values(classData).forEach((cls) => {
    (cls.students || []).forEach((st) => {
      (st.feeHistory || []).forEach((pay) => {
        // match today's date or recent
        if (pay.date === todayFormatted || pay.date === todayISO) {
          feePayments.push({
            ...pay,
            studentName: st.name,
            studentCode: st.studentCode,
            className: cls.className,
          });
        }
      });
    });
  });

  // If no payments recorded strictly today, take latest payments up to 20 for completeness
  if (feePayments.length === 0) {
    Object.values(classData).forEach((cls) => {
      (cls.students || []).forEach((st) => {
        (st.feeHistory || []).slice(0, 2).forEach((pay) => {
          feePayments.push({
            ...pay,
            studentName: st.name,
            studentCode: st.studentCode,
            className: cls.className,
          });
        });
      });
    });
  }

  // 2. Material Sales matching today (or all recent if today is empty)
  let matSales = materialSalesHistory.filter((m) => m.date === todayISO || m.date === todayFormatted);
  if (matSales.length === 0 && materialSalesHistory.length > 0) {
    matSales = materialSalesHistory.slice(-15);
  }

  // 3. Uniform Sales matching today (or all recent if today is empty)
  let uniSales = uniformSalesHistory.filter((u) => u.date === todayISO || u.date === todayFormatted);
  if (uniSales.length === 0 && uniformSalesHistory.length > 0) {
    uniSales = uniformSalesHistory.slice(-15);
  }

  // 4. Canteen records
  const canteenCollections: Array<{ date: string; vendorCount: number; dailyTotalKHR: number }> = [];
  if (canteenReport?.dailyRecords) {
    canteenReport.dailyRecords.slice(-10).forEach((rec) => {
      canteenCollections.push({
        date: rec.date,
        vendorCount: rec.vendorCount,
        dailyTotalKHR: rec.dailyTotalKHR,
      });
    });
  }

  // 5. Bus payments
  const busPays = busPayments.filter((b) => b.paymentDate === todayISO || b.paymentDate === todayFormatted);
  const busList = busPays.length > 0 ? busPays : busPayments.slice(-10);

  // Compute Total Revenue
  let totalUSD = 0;
  let totalKHR = 0;

  feePayments.forEach((p) => {
    totalUSD += p.amountUSD || 0;
    totalKHR += p.amountKHR || Math.round((p.amountUSD || 0) * exchangeRate);
  });

  matSales.forEach((m) => {
    totalKHR += m.totalAmountKHR || 0;
    totalUSD += Number(((m.totalAmountKHR || 0) / exchangeRate).toFixed(2));
  });

  uniSales.forEach((u) => {
    totalKHR += u.totalAmountKHR || 0;
    totalUSD += Number(((u.totalAmountKHR || 0) / exchangeRate).toFixed(2));
  });

  canteenCollections.forEach((c) => {
    totalKHR += c.dailyTotalKHR || 0;
    totalUSD += Number(((c.dailyTotalKHR || 0) / exchangeRate).toFixed(2));
  });

  busList.forEach((b) => {
    totalUSD += b.amountUSD || 0;
    totalKHR += b.amountKHR || Math.round((b.amountUSD || 0) * exchangeRate);
  });

  const transactionCount =
    feePayments.length + matSales.length + uniSales.length + busList.length;

  return {
    date: todayFormatted,
    periodKhmer: `កាលបរិច្ឆេទ ${todayFormatted} (${new Date().toLocaleDateString('km-KH')})`,
    totals: {
      usd: Number(totalUSD.toFixed(2)),
      khr: Math.round(totalKHR),
      count: transactionCount,
    },
    tuitionFeePayments: feePayments,
    materialSales: matSales,
    uniformSales: uniSales,
    canteenCollections,
    busPayments: busList,
  };
}

/**
 * Extract and summarize student directory across all classes
 */
export function generateStudentRecordsPayload(
  classData: { [classId: string]: ClassFeeData }
): StudentRecordsExportPayload {
  const classesList: any[] = [];
  const studentsList: any[] = [];

  Object.entries(classData).forEach(([classId, cls]) => {
    classesList.push({
      classId,
      className: cls.className,
      teacherName: cls.homeroomTeacher || 'មិនទាន់ចាត់តាំង',
      studentCount: (cls.students || []).length,
    });

    (cls.students || []).forEach((st) => {
      const history = st.feeHistory || [];
      const lastPay = history.length > 0 ? history[0] : null;

      studentsList.push({
        id: st.id,
        studentCode: st.studentCode,
        name: st.name,
        latinName: st.latinName,
        gender: st.gender,
        className: cls.className,
        classId,
        branchId: st.branchId || cls.branchId,
        phone: st.phone || st.guardianPhone,
        feesGroup: st.feesGroup,
        caseType: st.caseType,
        cash: st.cash,
        hasHealthConcern: !!(st as any).healthData,
        admissionDate: st.startDate,
        parentPhone: st.guardianPhone,
        recentPaymentsCount: history.length,
        lastPaymentDate: lastPay?.date,
      });
    });
  });

  return {
    totalStudents: studentsList.length,
    totalClasses: classesList.length,
    exportedAt: new Date().toISOString(),
    classes: classesList,
    students: studentsList,
  };
}

/**
 * Build the full consolidated school backup bundle
 */
export function buildCompleteBackupBundle(params: {
  classData: { [classId: string]: ClassFeeData };
  materialSalesHistory: MaterialSaleTransaction[];
  uniformSalesHistory: UniformSaleTransaction[];
  canteenHistory: { [key: string]: CanteenReport };
  canteenReport?: CanteenReport;
  materialsHistory?: { [key: string]: DailyMaterialsReport };
  busEnrollments: BusStudentEnrollment[];
  busPayments: BusPaymentRecord[];
  settings: SchoolSettings;
  branches: SchoolBranch[];
  users: UserProfile[];
  backupType?: 'auto_interval' | 'manual' | 'daily_close' | 'cloud_sync';
}): SchoolBackupBundle {
  const {
    classData,
    materialSalesHistory,
    uniformSalesHistory,
    canteenHistory,
    canteenReport,
    materialsHistory,
    busEnrollments,
    busPayments,
    settings,
    branches,
    users,
    backupType = 'auto_interval',
  } = params;

  const now = new Date();
  const snapshotId = `BIM-SNAP-${now.getTime()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const dailySales = generateDailySalesPayload(
    classData,
    materialSalesHistory,
    uniformSalesHistory,
    canteenReport,
    busPayments,
    settings.exchangeRate
  );

  const studentRecords = generateStudentRecordsPayload(classData);

  return {
    snapshotId,
    createdAt: now.toISOString(),
    backupType,
    version: '4.5',
    school: {
      nameKhmer: settings.schoolNameKhmer,
      nameEnglish: settings.schoolNameEnglish,
      academicYear: settings.academicYear,
      director: settings.directorName,
      accountant: settings.accountantName,
    },
    dailySales,
    studentRecords,
    classesData: classData,
    materialsHistory,
    materialSalesHistory,
    uniformSalesHistory,
    canteenHistory,
    busEnrollments,
    busPayments,
    settings,
    branches,
    users,
  };
}

/**
 * Save snapshot bundle to localStorage ring and IndexedDB
 */
export async function saveBackupSnapshotToLocal(
  bundle: SchoolBackupBundle,
  maxSnapshots: number = 15
): Promise<BackupSnapshotMeta> {
  const jsonString = JSON.stringify(bundle);
  const sizeBytes = new Blob([jsonString]).size;

  const meta: BackupSnapshotMeta = {
    id: bundle.snapshotId,
    filename: `backup_${bundle.backupType}_${bundle.createdAt.slice(0, 10)}.json`,
    timestamp: bundle.createdAt,
    source: bundle.backupType,
    totalStudents: bundle.studentRecords.totalStudents,
    totalClasses: bundle.studentRecords.totalClasses,
    todaySalesUSD: bundle.dailySales.totals.usd,
    todaySalesKHR: bundle.dailySales.totals.khr,
    todayTransactionsCount: bundle.dailySales.totals.count,
    fileSizeBytes: sizeBytes,
    syncedToCloud: false,
    syncedToServer: false,
    summary: {
      materialsCount: bundle.dailySales.materialSales.length,
      uniformSalesCount: bundle.dailySales.uniformSales.length,
      feePaymentsCount: bundle.dailySales.tuitionFeePayments.length,
      canteenCount: bundle.dailySales.canteenCollections.length,
      busPaymentsCount: bundle.dailySales.busPayments.length,
    },
  };

  try {
    // 1. Update localStorage list of snapshots
    let existingList: BackupSnapshotMeta[] = [];
    const storedList = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
    if (storedList) {
      try {
        existingList = JSON.parse(storedList);
      } catch {}
    }

    // Keep most recent first, trim beyond maxSnapshots
    const updatedList = [meta, ...existingList.filter((s) => s.id !== meta.id)].slice(0, maxSnapshots);
    localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(updatedList));

    // Save full data of latest snapshot in localStorage
    localStorage.setItem(`BIM_SNAPSHOT_${bundle.snapshotId}`, jsonString);
    localStorage.setItem(LAST_BACKUP_TIME_KEY, bundle.createdAt);

    // Clean up oldest removed snapshot bodies from localStorage
    const keptIds = new Set(updatedList.map((m) => m.id));
    existingList.forEach((oldMeta) => {
      if (!keptIds.has(oldMeta.id)) {
        try {
          localStorage.removeItem(`BIM_SNAPSHOT_${oldMeta.id}`);
        } catch {}
      }
    });

    // 2. Save into IndexedDB for persistent disaster recovery
    saveToIndexedDB(`snapshot_${bundle.snapshotId}`, bundle).catch(() => {});
    saveToIndexedDB('latest_auto_backup', bundle).catch(() => {});
  } catch (err) {
    console.warn('Local snapshot storage warning:', err);
  }

  return meta;
}

/**
 * Retrieve all local backup snapshot metadata
 */
export function getLocalBackupSnapshots(): BackupSnapshotMeta[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

/**
 * Retrieve full bundle of a specific local snapshot
 */
export async function getLocalSnapshotBundle(snapshotId: string): Promise<SchoolBackupBundle | null> {
  // 1. Try localStorage
  try {
    const raw = localStorage.getItem(`BIM_SNAPSHOT_${snapshotId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  // 2. Fallback to IndexedDB
  try {
    const fromIdb = await loadFromIndexedDB(`snapshot_${snapshotId}`);
    if (fromIdb) return fromIdb;
  } catch {}

  return null;
}

/**
 * Delete a local snapshot
 */
export function deleteLocalBackupSnapshot(snapshotId: string): boolean {
  try {
    const list = getLocalBackupSnapshots().filter((s) => s.id !== snapshotId);
    localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(list));
    localStorage.removeItem(`BIM_SNAPSHOT_${snapshotId}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sync backup to server file storage and Cloud (Telegram Cloud Group)
 */
export async function syncBackupToServerAndCloud(
  bundle: SchoolBackupBundle,
  telegramConfig?: SchoolSettings['telegramConfig']
): Promise<{ success: boolean; message: string; tgSynced?: boolean; snapshotName?: string }> {
  try {
    const res = await fetch('/api/cloud-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        backupData: bundle,
        telegramConfig: telegramConfig?.botToken && telegramConfig?.chatId ? telegramConfig : undefined,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Cloud sync failed');
    }

    // Mark as synced in local meta
    try {
      const list = getLocalBackupSnapshots();
      const idx = list.findIndex((s) => s.id === bundle.snapshotId);
      if (idx !== -1) {
        list[idx].syncedToServer = true;
        list[idx].syncedToCloud = !!json.tgSynced;
        localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(list));
      }
    } catch {}

    return {
      success: true,
      message: json.message || 'បានធ្វើសមកាលកម្មទិន្នន័យដោយជោគជ័យ!',
      tgSynced: json.tgSynced,
      snapshotName: json.snapshotName,
    };
  } catch (err: any) {
    console.warn('Cloud sync error:', err);
    return {
      success: false,
      message: err.message || 'មិនអាចធ្វើសមកាលកម្មទៅ Cloud បានទេ',
    };
  }
}

/**
 * Export current daily sales and student records to a formatted JSON download file
 */
export function exportDailySalesAndStudentsJSON(bundle: SchoolBackupBundle): void {
  const exportData = {
    exportTitle: 'BIM Rangsei School - Daily Sales & Student Records Export',
    snapshotId: bundle.snapshotId,
    exportedAt: bundle.createdAt,
    schoolName: bundle.school.nameKhmer,
    schoolNameEnglish: bundle.school.nameEnglish,
    director: bundle.school.director,
    accountant: bundle.school.accountant,
    dailySales: bundle.dailySales,
    studentRecords: bundle.studentRecords,
    summaryStatistics: {
      totalStudentsEnrolled: bundle.studentRecords.totalStudents,
      totalClassesActive: bundle.studentRecords.totalClasses,
      todayRevenueUSD: bundle.dailySales.totals.usd,
      todayRevenueKHR: bundle.dailySales.totals.khr,
      todayTotalTransactions: bundle.dailySales.totals.count,
    },
    fullSystemState: {
      classesData: bundle.classesData,
      materialSalesHistory: bundle.materialSalesHistory,
      uniformSalesHistory: bundle.uniformSalesHistory,
      canteenHistory: bundle.canteenHistory,
      busEnrollments: bundle.busEnrollments,
      busPayments: bundle.busPayments,
      settings: bundle.settings,
    },
  };

  const jsonStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  const dateStr = bundle.createdAt.slice(0, 10);
  downloadAnchor.setAttribute('href', jsonStr);
  downloadAnchor.setAttribute('download', `BIM_Daily_Sales_and_Students_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
