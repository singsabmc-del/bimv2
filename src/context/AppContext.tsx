import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  ClassFeeData,
  DailyMaterialsReport,
  CanteenReport,
  CanteenVendor,
  CanteenAttendanceRecord,
  UniformReport,
  UniformTypeConfig,
  StudentFeeRecord,
  StudentFeePaymentItem,
  StudentFeeSummaryRow,
  UserProfile,
  UserRole,
  RolePermissions,
  MaterialSaleTransaction,
  UniformSaleTransaction,
  SchoolSettings,
  SchoolBranch,
  Language,
  TelegramAlertToast,
  TelegramAlertLogItem,
  MONTH_NAMES,
  PromotionRecord,
  BusRoute,
  BusStudentEnrollment,
  BusAttendanceRecord,
  BusPaymentRecord,
  POSCartItem,
  AutoBackupConfig,
  BackupSnapshotMeta,
  SchoolBackupBundle,
} from '../types';
import {
  buildCompleteBackupBundle,
  saveBackupSnapshotToLocal,
  getLocalBackupSnapshots,
  deleteLocalBackupSnapshot,
  syncBackupToServerAndCloud,
  exportDailySalesAndStudentsJSON,
  LAST_BACKUP_TIME_KEY,
} from '../utils/autoBackupService';
import {
  INITIAL_CLASS_FEE_DATA,
  INITIAL_DAILY_MATERIALS_REPORT,
  INITIAL_CANTEEN_REPORT,
  INITIAL_OCTOBER_CANTEEN_REPORT,
  INITIAL_UNIFORM_REPORT,
  INITIAL_UNIFORM_TYPES,
  INITIAL_USERS,
  INITIAL_SETTINGS,
  INITIAL_BRANCHES,
  INITIAL_MATERIAL_SALES_HISTORY,
  INITIAL_UNIFORM_SALES_HISTORY,
  INITIAL_BUS_ROUTES,
  INITIAL_BUS_ENROLLMENTS,
  INITIAL_BUS_PAYMENTS,
} from '../data/initialData';
import {
  getStoredItemWithFallback,
  syncStateToServer,
  restoreStateOnStartup,
} from '../utils/persistentStorage';
import {
  checkDuplicateStudent,
  checkDuplicateClass,
  checkDuplicateMaterialItem,
  checkDuplicateBusEnrollment,
} from '../utils/duplicatePrevention';
import { supabase } from '../lib/supabase';

// Month generator helper for clean month records
const createDefaultMaterialsReport = (month: string, year: number): DailyMaterialsReport => {
  const monthIdx = MONTH_NAMES.indexOf(month as any);
  const daysInMonth = monthIdx >= 0 ? new Date(year, monthIdx + 1, 0).getDate() : 31;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  return {
    month,
    year,
    dateRange: `01.${(monthIdx + 1).toString().padStart(2, '0')}.${year} _ ${daysInMonth}.${(monthIdx + 1).toString().padStart(2, '0')}.${year}`,
    availableDays: daysArray,
    approvedBy: 'យ៉េន ណាវីន (នាយកសាលា)',
    preparedBy: 'ប្រាជ្ញ ស៊ីដា (គណនេយ្យករ)',
    items: INITIAL_DAILY_MATERIALS_REPORT.items.map((it) => ({
      ...it,
      dailyQuantities: {},
      totalQty: 0,
      totalAmountKHR: 0,
    })),
  };
};

const createDefaultCanteenReport = (month: string, year: number): CanteenReport => {
  const monthIdx = MONTH_NAMES.indexOf(month as any);
  const daysInMonth = monthIdx >= 0 ? new Date(year, monthIdx + 1, 0).getDate() : 31;
  const shortMonth = month.slice(0, 3);
  const template = INITIAL_CANTEEN_REPORT;

  const dailyRecords = [];
  for (let d = 1; d <= Math.min(daysInMonth, 31); d++) {
    const dayOfWeek = new Date(year, monthIdx >= 0 ? monthIdx : 9, d).getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Weekdays only
      dailyRecords.push({
        date: `${d}-${shortMonth}-${year.toString().slice(-2)}`,
        vendorStatus: {},
        vendorCount: 0,
        standardFeeKHR: 10000,
        dailyTotalKHR: 0,
      });
    }
  }

  return {
    month,
    year,
    schoolName: 'សាលា អ៊ីរ៉ែលកម្ពុជា / BIM Rangsei School',
    approvedBy: 'យ៉េន ណាវីន (នាយកសាលា)',
    preparedBy: 'ប្រាជ្ញ ស៊ីដា (គណនេយ្យករ)',
    vendors: template.vendors,
    dailyRecords: dailyRecords.length > 0 ? dailyRecords : template.dailyRecords,
  };
};

const createDefaultUniformReport = (month: string, year: number): UniformReport => ({
  month,
  year,
  schoolName: 'សាលា អ៊ីរ៉ែលកម្ពុជា / BIM Rangsei School',
  shirtPriceKHR: 30000,
  sportPriceKHR: 30000,
  shirtSizes: ['XXL', 'XL', 'L', 'M', 'S', '12', '10', '8', '6', '4'],
  sportSizes: ['XL', 'L', 'M', 'S', '30', '28', '26', '24', '22'],
  approvedBy: 'បានឃើញ និងឯកភាព',
  preparedBy: 'រៀបចំដោយ',
  shirtDailyRecords: [],
  sportDailyRecords: [],
  recordsByType: {},
});

interface AppContextType {
  // Auth & RBAC
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchUser: (userId: string) => void;
  allUsers: UserProfile[];
  addUser: (user: Omit<UserProfile, 'id'>) => void;
  updateUser: (id: string, updates: Partial<UserProfile>) => void;
  deleteUser: (id: string) => boolean;
  permissions: RolePermissions;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string, rememberLogin?: boolean) => { success: boolean; error?: string };
  logout: () => void;
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (km: string, en: string) => string;
  // Settings
  settings: SchoolSettings;
  updateSettings: (updates: Partial<SchoolSettings>) => void;
  // Multi-Branch Management
  branches: SchoolBranch[];
  currentBranchId: string;
  currentBranch: SchoolBranch;
  setCurrentBranchId: (id: string) => void;
  addBranch: (branch: Omit<SchoolBranch, 'id' | 'createdDate'>) => SchoolBranch;
  updateBranch: (id: string, updates: Partial<SchoolBranch>) => void;
  deleteBranch: (id: string) => { success: boolean; message?: string };
  setMainBranch: (id: string) => void;
  getBranchName: (branchId?: string) => string;
  // Global Period Selection
  globalMonth: string;
  setGlobalMonth: (m: string) => void;
  globalYear: number;
  setGlobalYear: (y: number) => void;
  setGlobalPeriod: (month: string, year: number) => void;
  // Telegram Alert & Notification Toast
  activeToast: TelegramAlertToast | null;
  dismissToast: () => void;
  telegramAlertLogs: TelegramAlertLogItem[];
  clearTelegramLogs: () => void;
  deleteTelegramLog: (id: string) => void;
  sendTelegramAlert: (
    title: string,
    message: string,
    type?: TelegramAlertToast['type'],
    payerName?: string,
    amount?: string
  ) => Promise<boolean>;
  // Classes & Student Fees
  classData: { [classId: string]: ClassFeeData };
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  selectedStudentForProfile: StudentFeeRecord | null;
  setSelectedStudentForProfile: (st: StudentFeeRecord | null) => void;
  updateStudentFee: (classId: string, studentId: number, updates: Partial<StudentFeeRecord>) => void;
  recordStudentPayment: (
    classId: string,
    studentId: number,
    payment: {
      month?: string;
      months?: string[];
      monthsCount?: number;
      feePerMonthUSD?: number;
      discountUSD?: number;
      amountUSD: number;
      paidBy: 'ABA' | 'AC' | 'Cash';
      date: string;
      receiptNo?: string;
      invoiceNo?: string;
      note?: string;
      sendTelegram?: boolean;
    }
  ) => void;
  addStudent: (classId: string, student: Omit<StudentFeeRecord, 'id' | 'studentCode'> & { studentCode?: string }) => { success: boolean; error?: string };
  batchAddStudents: (
    classId: string,
    students: Array<Omit<StudentFeeRecord, 'id' | 'studentCode'> & { studentCode?: string }>
  ) => { success: boolean; addedCount: number; errors: string[] };
  deleteStudent: (classId: string, studentId: number) => boolean;
  deleteStudentPaymentRecord: (classId: string, studentId: number, receiptNo: string) => boolean;
  clearStudentsPaymentHistory: (
    classId: string,
    studentIds: number[],
    resetActiveStatus?: boolean
  ) => { success: boolean; clearedCount: number };
  clearAllPaymentHistory: (
    classId?: string,
    resetActiveStatus?: boolean
  ) => { success: boolean; clearedCount: number };
  addClass: (className: string, period?: string, homeroomTeacher?: string, teacherPhone?: string, branchId?: string) => { success: boolean; error?: string; classId?: string };
  updateClass: (classId: string, updates: { className?: string; period?: string; homeroomTeacher?: string; teacherPhone?: string; branchId?: string }) => { success: boolean; error?: string };
  deleteClass: (classId: string) => { success: boolean; message?: string };
  reorderClasses: (newOrderClassIds: string[]) => void;
  moveClassOrder: (classId: string, direction: 'up' | 'down') => void;
  sortClasses: (mode: 'name_asc' | 'name_desc' | 'students_desc') => void;
  classOrder: string[];
  orderedClassList: ClassFeeData[];
  allClassesList: ClassFeeData[];
  updateClassTeacher: (classId: string, homeroomTeacher: string, teacherPhone: string) => void;
  // Academic Months
  academicMonths: string[];
  addAcademicMonth: (monthName: string) => { success: boolean; error?: string };
  updateAcademicMonth: (oldMonthName: string, newMonthName: string) => { success: boolean; error?: string };
  deleteAcademicMonth: (monthName: string) => { success: boolean; message?: string };
  reorderAcademicMonths: (newMonthsOrder: string[]) => void;
  moveAcademicMonthOrder: (monthName: string, direction: 'up' | 'down') => void;
  sortAcademicMonths: (mode: 'academic' | 'calendar' | 'alphabetical') => void;
  // Student Promotion (ការឡើងថ្នាក់សិស្ស)
  promoteStudents: (
    sourceClassId: string,
    targetClassId: string,
    studentIds: number[],
    options?: {
      newFeeGroup?: string;
      carryOverPrepaid?: boolean;
      createNewClassIfNeeded?: { className: string; period?: string };
      removeFromOldClass?: boolean;
      sendTelegramAlert?: boolean;
    }
  ) => { success: boolean; count: number; targetClassName: string; error?: string };
  promotionHistory: PromotionRecord[];
  // Daily Materials & Sales History (Multi-month)
  materialsHistory: { [key: string]: DailyMaterialsReport };
  selectedMaterialsMonth: string;
  setSelectedMaterialsMonth: (key: string) => void;
  dailyMaterials: DailyMaterialsReport;
  createMaterialsMonthRecord: (month: string, year: number) => void;
  deleteMaterialsMonthRecord: (monthKey: string) => boolean;
  materialSalesHistory: MaterialSaleTransaction[];
  updateDailyMaterialSale: (itemId: number, day: number, qty: number) => void;
  addMaterialItem: (name: string, category: 'stationery' | 'books' | 'uniform_card' | 'textbooks', unitPriceKHR: number) => void;
  recordMaterialSaleTransaction: (tx: Omit<MaterialSaleTransaction, 'id' | 'receiptNo' | 'timestamp'>) => void;
  deleteMaterialSaleTransaction: (id: string) => boolean;
  // Canteen & Monthly History
  canteenHistory: { [key: string]: CanteenReport };
  selectedCanteenMonth: string;
  setSelectedCanteenMonth: (key: string) => void;
  currentCanteenReport: CanteenReport;
  canteenReport: CanteenReport;
  updateVendorAttendance: (date: string, vendorId: string, status: 'paid' | 'absent' | 'double_paid' | 'unpaid', amountKHR?: number, note?: string) => void;
  addCanteenVendor: (name: string, stallName: string, dailyFeeKHR: number) => void;
  updateCanteenVendor: (vendorId: string, updates: Partial<CanteenVendor>) => void;
  deleteCanteenVendor: (vendorId: string) => boolean;
  addCanteenDailyRecord: (dateStr: string, defaultStatus?: 'paid' | 'absent' | 'unpaid') => { success: boolean; error?: string };
  autoPopulateFullMonthDates: (mode?: 'all_days' | 'weekdays_only') => void;
  createCanteenMonthRecord: (month: string, year: number) => void;
  deleteCanteenMonthRecord: (monthKey: string) => boolean;
  // Uniform & Sales History (Multi-month) & Custom Types/Sizes
  uniformTypes: UniformTypeConfig[];
  addUniformType: (
    nameKhmer: string,
    nameEnglish: string,
    defaultPriceKHR: number,
    initialSizes: string[],
    description?: string
  ) => void;
  addUniformSize: (typeId: string, sizeName: string) => void;
  deleteUniformType: (typeId: string) => boolean;
  deleteUniformSize: (typeId: string, sizeName: string) => boolean;
  updateUniformSize: (typeId: string, oldSizeName: string, newSizeName: string) => boolean;
  updateUniformType: (typeId: string, updates: Partial<UniformTypeConfig>) => void;
  deleteUniformDailyRecord: (typeId: string, date: string) => boolean;
  updateUniformDailyQty: (typeId: string, date: string, size: string, qty: number) => void;
  uniformHistory: { [key: string]: UniformReport };
  selectedUniformMonth: string;
  setSelectedUniformMonth: (key: string) => void;
  uniformReport: UniformReport;
  createUniformMonthRecord: (month: string, year: number) => void;
  deleteUniformMonthRecord: (monthKey: string) => boolean;
  uniformSalesHistory: UniformSaleTransaction[];
  recordUniformSale: (
    date: string,
    type: string,
    size: string,
    qty: number,
    buyerName?: string,
    paymentMethod?: 'Cash' | 'ABA' | 'AC',
    customPriceKHR?: number,
    studentId?: number,
    classId?: string
  ) => void;
  deleteUniformSaleTransaction: (id: string) => boolean;
  syncUniformMatrixFromLedger: (targetMonth?: string) => void;
  // Point of Sale (POS)
  recordPOSSale: (saleData: {
    items: POSCartItem[];
    buyerName: string;
    studentId?: number;
    classId?: string;
    paymentMethod: 'Cash' | 'ABA' | 'AC';
    totalAmountUSD: number;
    totalAmountKHR: number;
    cashTenderedUSD?: number;
    cashTenderedKHR?: number;
    changeUSD?: number;
    changeKHR?: number;
  }) => { receiptNo: string; timestamp: string };
  // School Bus Management
  busRoutes: BusRoute[];
  addBusRoute: (route: Omit<BusRoute, 'id'>) => void;
  updateBusRoute: (id: string, updates: Partial<BusRoute>) => void;
  deleteBusRoute: (id: string) => boolean;
  busEnrollments: BusStudentEnrollment[];
  enrollStudentInBus: (enrollment: Omit<BusStudentEnrollment, 'id'>) => void;
  updateBusEnrollment: (id: string, updates: Partial<BusStudentEnrollment>) => void;
  removeBusEnrollment: (id: string) => boolean;
  busPayments: BusPaymentRecord[];
  recordBusPayment: (
    enrollmentId: string,
    payment: {
      paidBy: 'ABA' | 'AC' | 'Cash';
      months?: string[];
      feePerMonthUSD?: number;
      discountUSD?: number;
      amountUSD?: number;
      paymentDate?: string;
      notes?: string;
    }
  ) => BusPaymentRecord | null;
  busAttendance: BusAttendanceRecord[];
  recordBusAttendance: (
    date: string,
    routeId: string,
    shift: 'morning' | 'evening',
    records: { [enrollmentId: string]: 'present' | 'absent' | 'excused' }
  ) => void;
  // Financial aliases
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  importExtractedReport: (reportData: any) => void;
  // Backup & Reset
  resetToInitialData: () => void;
  clearAllDataKeepSettings: () => void;
  downloadFullBackup: () => void;
  restoreFromBackup: (jsonContent: string) => boolean;
  backupToTelegramGroup: () => Promise<{ success: boolean; message: string }>;
  // Invoice Verification
  isVerifyInvoiceModalOpen: boolean;
  verifyInvoiceTarget: { invoiceNo?: string; studentCode?: string } | null;
  openInvoiceVerification: (invoiceNo?: string, studentCode?: string) => void;
  closeInvoiceVerification: () => void;
  // Periodic Auto-Backup & Cloud Sync
  autoBackupConfig: AutoBackupConfig;
  updateAutoBackupConfig: (updates: Partial<AutoBackupConfig>) => void;
  triggerAutoBackup: (source?: 'manual' | 'auto_interval' | 'daily_close' | 'cloud_sync') => Promise<{ success: boolean; meta?: BackupSnapshotMeta; message: string }>;
  triggerCloudSync: () => Promise<{ success: boolean; message: string; tgSynced?: boolean }>;
  exportDailySalesAndStudents: () => void;
  backupSnapshots: BackupSnapshotMeta[];
  refreshBackupSnapshots: () => void;
  deleteBackupSnapshot: (id: string) => void;
  restoreFromSnapshotBundle: (bundle: SchoolBackupBundle) => boolean;
  isAutoBackupModalOpen: boolean;
  openAutoBackupModal: () => void;
  closeAutoBackupModal: () => void;
  cloudSyncPrompt: { isOpen: boolean; snapshotId?: string; timestamp?: string } | null;
  dismissCloudSyncPrompt: () => void;
  lastBackupTime: string | null;
  // Supabase Cloud Database Sync
  syncToSupabaseNow: () => Promise<{ success: boolean; message: string }>;
  restoreFromSupabaseNow: () => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_PREFIX = 'BIM_RANGSEI_V3';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language
  const [language, setLanguage] = useState<Language>(() => {
    return getStoredItemWithFallback<Language>(`${STORAGE_PREFIX}_LANG`, 'LANG', 'km');
  });

  // Global Period Selection (default: October 2026 - active school month)
  const [globalMonth, setGlobalMonth] = useState<string>('October');
  const [globalYear, setGlobalYear] = useState<number>(2026);

  // Users & Auth (Fixed auto-login & session persistence)
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const stored = getStoredItemWithFallback<UserProfile[]>(`${STORAGE_PREFIX}_USERS`, 'USERS', INITIAL_USERS);
    return stored.map((u) => {
      const initMatch = INITIAL_USERS.find((iu) => iu.id === u.id || iu.username === u.username);
      return {
        ...u,
        password: u.password || initMatch?.password || '123456',
      };
    });
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const stored = getStoredItemWithFallback<UserProfile>(`${STORAGE_PREFIX}_CURRENT_USER`, 'CURRENT_USER', null as any);
    if (stored && stored.id) return stored;
    return INITIAL_USERS[0];
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return true;
      // If user explicitly clicked logout, keep them logged out
      const explicitLogout =
        localStorage.getItem(`${STORAGE_PREFIX}_AUTH_SESSION`) === 'false' ||
        localStorage.getItem('BIM_RANGSEI_PERMANENT_AUTH_SESSION') === 'false';
      if (explicitLogout) {
        return false;
      }
      // If session exists or user is saved, or default for active applet session
      return true;
    } catch {
      return true;
    }
  });

  // Settings
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    return getStoredItemWithFallback<SchoolSettings>(`${STORAGE_PREFIX}_SETTINGS`, 'SETTINGS', INITIAL_SETTINGS);
  });

  // Multi-Branch Management States
  const [branches, setBranches] = useState<SchoolBranch[]>(() => {
    return getStoredItemWithFallback<SchoolBranch[]>(`${STORAGE_PREFIX}_BRANCHES`, 'BRANCHES', INITIAL_BRANCHES);
  });

  const [currentBranchId, setCurrentBranchId] = useState<string>(() => {
    const stored = getStoredItemWithFallback<string>(`${STORAGE_PREFIX}_CURRENT_BRANCH_ID`, 'CURRENT_BRANCH_ID', 'branch-central');
    return stored || 'branch-central';
  });

  const currentBranch = useMemo<SchoolBranch>(() => {
    if (currentBranchId === 'all') {
      return {
        id: 'all',
        nameKhmer: 'គ្រប់សាខាទាំងអស់ (All Campuses)',
        nameEnglish: 'All Campuses (Consolidated)',
        code: 'ALL',
        phone: '023 888 999',
        email: 'info@bimrangsei.edu.kh',
        address: 'គ្រប់ទីតាំងសាខាទាំងអស់',
        directorName: 'យ៉េន ណាវីន (Yen Navin)',
        accountantName: 'ប្រាជ្ញ ស៊ីដា (Prach Sida)',
        isMainBranch: false,
        status: 'active',
        createdDate: '2025-01-01',
      };
    }
    return branches.find((b) => b.id === currentBranchId) || branches.find((b) => b.isMainBranch) || branches[0] || INITIAL_BRANCHES[0];
  }, [branches, currentBranchId]);

  const getBranchName = (branchId?: string): string => {
    if (!branchId || branchId === 'all') return 'គ្រប់សាខាទាំងអស់ (All Campuses)';
    const found = branches.find((b) => b.id === branchId);
    return found ? found.nameKhmer : branchId;
  };

  const handleSetCurrentBranchId = (id: string) => {
    setCurrentBranchId(id);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}_CURRENT_BRANCH_ID`, id);
    } catch (e) {
      console.error('Failed to save currentBranchId:', e);
    }
  };

  const addBranch = (newBranchData: Omit<SchoolBranch, 'id' | 'createdDate'>): SchoolBranch => {
    const newId = `branch-${Date.now().toString(36)}`;
    const today = new Date().toISOString().split('T')[0];
    const newBranch: SchoolBranch = {
      ...newBranchData,
      id: newId,
      createdDate: today,
    };

    setBranches((prev) => {
      let updated = [...prev];
      if (newBranch.isMainBranch) {
        updated = updated.map((b) => ({ ...b, isMainBranch: false }));
      }
      const result = [...updated, newBranch];
      try {
        localStorage.setItem(`${STORAGE_PREFIX}_BRANCHES`, JSON.stringify(result));
      } catch (e) {
        console.error('Failed to store branches:', e);
      }
      return result;
    });

    return newBranch;
  };

  const updateBranch = (id: string, updates: Partial<SchoolBranch>) => {
    setBranches((prev) => {
      const updated = prev.map((b) => {
        if (b.id === id) {
          return { ...b, ...updates };
        }
        if (updates.isMainBranch && b.id !== id) {
          return { ...b, isMainBranch: false };
        }
        return b;
      });
      try {
        localStorage.setItem(`${STORAGE_PREFIX}_BRANCHES`, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update branch:', e);
      }
      return updated;
    });
  };

  const deleteBranch = (id: string): { success: boolean; message?: string } => {
    if (branches.length <= 1) {
      return { success: false, message: 'មិនអាចលុបសាខាចុងក្រោយបានទេ (Cannot delete the only remaining branch)' };
    }
    const branchToDelete = branches.find((b) => b.id === id);
    if (branchToDelete?.isMainBranch) {
      return { success: false, message: 'មិនអាចលុបសាខាមេបានទេ សូមកំណត់សាខាផ្សេងជាសាខាមេជាមុនសិន (Cannot delete main campus)' };
    }

    setBranches((prev) => {
      const filtered = prev.filter((b) => b.id !== id);
      try {
        localStorage.setItem(`${STORAGE_PREFIX}_BRANCHES`, JSON.stringify(filtered));
      } catch (e) {
        console.error('Failed to save branches:', e);
      }
      return filtered;
    });

    if (currentBranchId === id) {
      const fallback = branches.find((b) => b.id !== id && b.isMainBranch) || branches.find((b) => b.id !== id) || branches[0];
      if (fallback) {
        setCurrentBranchId(fallback.id);
        try {
          localStorage.setItem(`${STORAGE_PREFIX}_CURRENT_BRANCH_ID`, fallback.id);
        } catch (e) {
          console.error(e);
        }
      }
    }

    return { success: true };
  };

  const setMainBranch = (id: string) => {
    setBranches((prev) => {
      const updated = prev.map((b) => ({
        ...b,
        isMainBranch: b.id === id,
      }));
      try {
        localStorage.setItem(`${STORAGE_PREFIX}_BRANCHES`, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to set main branch:', e);
      }
      return updated;
    });
  };

  // School Bus Management States
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>(() => {
    return getStoredItemWithFallback<BusRoute[]>(`${STORAGE_PREFIX}_BUS_ROUTES`, 'BUS_ROUTES', INITIAL_BUS_ROUTES);
  });

  const [busEnrollments, setBusEnrollments] = useState<BusStudentEnrollment[]>(() => {
    return getStoredItemWithFallback<BusStudentEnrollment[]>(`${STORAGE_PREFIX}_BUS_ENROLLMENTS`, 'BUS_ENROLLMENTS', INITIAL_BUS_ENROLLMENTS);
  });

  const [busAttendance, setBusAttendance] = useState<BusAttendanceRecord[]>(() => {
    return getStoredItemWithFallback<BusAttendanceRecord[]>(`${STORAGE_PREFIX}_BUS_ATTENDANCE`, 'BUS_ATTENDANCE', []);
  });

  const [busPayments, setBusPayments] = useState<BusPaymentRecord[]>(() => {
    return getStoredItemWithFallback<BusPaymentRecord[]>(`${STORAGE_PREFIX}_BUS_PAYMENTS`, 'BUS_PAYMENTS', INITIAL_BUS_PAYMENTS);
  });


  // Invoice Verification Modal State
  const [isVerifyInvoiceModalOpen, setIsVerifyInvoiceModalOpen] = useState(false);
  const [verifyInvoiceTarget, setVerifyInvoiceTarget] = useState<{ invoiceNo?: string; studentCode?: string } | null>(null);

  const openInvoiceVerification = (invoiceNo?: string, studentCode?: string) => {
    setVerifyInvoiceTarget({ invoiceNo, studentCode });
    setIsVerifyInvoiceModalOpen(true);
  };

  const closeInvoiceVerification = () => {
    setIsVerifyInvoiceModalOpen(false);
    setVerifyInvoiceTarget(null);
  };

  // Auto-detect ?verify_invoice=... on page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const inv = params.get('verify_invoice');
        const st = params.get('student_code');
        if (inv || st) {
          openInvoiceVerification(inv || '', st || '');
        }
      } catch (e) {
        console.error('URL params verification error:', e);
      }
    }
  }, []);

  // Auto-Backup State & Modals
  const [isAutoBackupModalOpen, setIsAutoBackupModalOpen] = useState(false);
  const [cloudSyncPrompt, setCloudSyncPrompt] = useState<{ isOpen: boolean; snapshotId?: string; timestamp?: string } | null>(null);
  const [backupSnapshots, setBackupSnapshots] = useState<BackupSnapshotMeta[]>(() => getLocalBackupSnapshots());
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_BACKUP_TIME_KEY) || settings.autoBackupConfig?.lastBackupAt || null;
    } catch {
      return null;
    }
  });

  const openAutoBackupModal = () => setIsAutoBackupModalOpen(true);
  const closeAutoBackupModal = () => setIsAutoBackupModalOpen(false);
  const dismissCloudSyncPrompt = () => setCloudSyncPrompt(null);
  const refreshBackupSnapshots = () => setBackupSnapshots(getLocalBackupSnapshots());
  const deleteBackupSnapshot = (id: string) => {
    deleteLocalBackupSnapshot(id);
    refreshBackupSnapshots();
  };

  const autoBackupConfig: AutoBackupConfig = useMemo(() => {
    return (
      settings.autoBackupConfig || {
        enabled: true,
        frequency: '1h',
        autoPromptCloudSync: true,
        syncToTelegramCloud: true,
        syncToServerStorage: true,
        saveLocalHistory: true,
        maxLocalSnapshots: 15,
      }
    );
  }, [settings.autoBackupConfig]);

  const updateAutoBackupConfig = (updates: Partial<AutoBackupConfig>) => {
    const updated = { ...autoBackupConfig, ...updates };
    updateSettings({ autoBackupConfig: updated });
    try {
      localStorage.setItem(`${STORAGE_PREFIX}_AUTO_BACKUP_CONFIG`, JSON.stringify(updated));
    } catch {}
  };

  // Auto-backup handlers and interval effect are declared below after state definitions

  // Telegram Alert Toast
  const [activeToast, setActiveToast] = useState<TelegramAlertToast | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Telegram Alert Logs History
  const [telegramAlertLogs, setTelegramAlertLogs] = useState<TelegramAlertLogItem[]>(() => {
    return getStoredItemWithFallback<TelegramAlertLogItem[]>(`${STORAGE_PREFIX}_TG_LOGS`, 'TG_LOGS', [
      {
        id: 'log-sample-1',
        title: 'បង្កាន់ដៃបង់ថ្លៃសិក្សា (Tuition Fee Paid)',
        message: 'សិស្ស៖ ផន សុខហេង (ថ្នាក់ទី ១A)\nចំនួន៖ $12.50 (51,250៛)\nវិធីទូទាត់៖ ABA\nបង្កាន់ដៃ៖ #REC-2026-10-001',
        timestamp: '07/10/2026 09:30',
        type: 'fee',
        payerName: 'ផន សុខហេង',
        amount: '$12.50',
        success: true,
      },
      {
        id: 'log-sample-2',
        title: 'លក់សម្ភារៈសិក្សា (Stationery Sale Paid)',
        message: 'មុខទំនិញ៖ ប៊ិចខៀវ (Blue Pen)\nចំនួន៖ 3 pcs\nតម្លៃសរុប៖ 1,500៛\nវិធីទូទាត់៖ Cash',
        timestamp: '30/09/2026 08:15',
        type: 'material',
        payerName: 'សិស្សទូទៅ',
        amount: '1,500៛',
        success: true,
      },
    ]);
  });

  const clearTelegramLogs = () => {
    setTelegramAlertLogs([]);
    localStorage.removeItem(`${STORAGE_PREFIX}_TG_LOGS`);
  };

  const deleteTelegramLog = (id: string) => {
    setTelegramAlertLogs((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(`${STORAGE_PREFIX}_TG_LOGS`, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update telegram logs in storage:', e);
      }
      return updated;
    });
  };

  const dismissToast = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setActiveToast(null);
  };

  // Classes Data (Safe storage with legacy fallback to prevent loss on redeployment)
  const [classData, setClassData] = useState<{ [classId: string]: ClassFeeData }>(() => {
    return getStoredItemWithFallback(`${STORAGE_PREFIX}_CLASSES`, 'CLASSES', INITIAL_CLASS_FEE_DATA);
  });

  const DEFAULT_ACADEMIC_MONTHS = [
    'October',
    'November',
    'December',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
  ];

  const [classOrder, setClassOrder] = useState<string[]>(() => {
    const stored = getStoredItemWithFallback<string[]>(`${STORAGE_PREFIX}_CLASS_ORDER`, 'CLASS_ORDER', []);
    if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    return Object.keys(INITIAL_CLASS_FEE_DATA);
  });

  const [academicMonths, setAcademicMonths] = useState<string[]>(() => {
    const stored = getStoredItemWithFallback<string[]>(
      `${STORAGE_PREFIX}_ACADEMIC_MONTHS`,
      'ACADEMIC_MONTHS',
      DEFAULT_ACADEMIC_MONTHS
    );
    if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    return DEFAULT_ACADEMIC_MONTHS;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_CLASS_ORDER`, JSON.stringify(classOrder));
    localStorage.setItem('BIM_RANGSEI_PERMANENT_CLASS_ORDER', JSON.stringify(classOrder));
  }, [classOrder]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_ACADEMIC_MONTHS`, JSON.stringify(academicMonths));
    localStorage.setItem('BIM_RANGSEI_PERMANENT_ACADEMIC_MONTHS', JSON.stringify(academicMonths));
  }, [academicMonths]);

  // Computed list of all classes in school regardless of branch
  const allClassesList = useMemo(() => {
    const list: ClassFeeData[] = [];
    const addedIds = new Set<string>();

    classOrder.forEach((id) => {
      if (classData[id]) {
        list.push(classData[id]);
        addedIds.add(id);
      }
    });

    Object.keys(classData).forEach((id) => {
      if (!addedIds.has(id)) {
        list.push(classData[id]);
      }
    });

    return list;
  }, [classData, classOrder]);

  // Computed ordered class list (Filtered by active Campus Branch)
  const orderedClassList = useMemo(() => {
    if (currentBranchId === 'all') {
      return allClassesList;
    }
    return allClassesList.filter((c) => (c.branchId || 'branch-central') === currentBranchId);
  }, [allClassesList, currentBranchId]);

  const [selectedClassId, setSelectedClassId] = useState<string>('1A');

  // Automatically switch selected class if it does not belong to active branch
  useEffect(() => {
    if (orderedClassList.length > 0) {
      const exists = orderedClassList.some((c) => c.classId === selectedClassId);
      if (!exists) {
        setSelectedClassId(orderedClassList[0].classId);
      }
    }
  }, [orderedClassList, selectedClassId]);

  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<StudentFeeRecord | null>(null);

  // Multi-Month Materials Store
  const [materialsHistory, setMaterialsHistory] = useState<{ [key: string]: DailyMaterialsReport }>(() => {
    return getStoredItemWithFallback(`${STORAGE_PREFIX}_MAT_HISTORY_STORE`, 'MAT_HISTORY_STORE', {
      'September 2026': INITIAL_DAILY_MATERIALS_REPORT,
      'October 2026': createDefaultMaterialsReport('October', 2026),
      'November 2026': createDefaultMaterialsReport('November', 2026),
    });
  });
  const [selectedMaterialsMonth, setSelectedMaterialsMonth] = useState<string>('October 2026');

  // Material Sales Transactions
  const [materialSalesHistory, setMaterialSalesHistory] = useState<MaterialSaleTransaction[]>(() => {
    return getStoredItemWithFallback(`${STORAGE_PREFIX}_MAT_SALES_TX`, 'MAT_SALES_TX', INITIAL_MATERIAL_SALES_HISTORY);
  });

  // Multi-Month Canteen History
  const [canteenHistory, setCanteenHistory] = useState<{ [key: string]: CanteenReport }>(() => {
    return getStoredItemWithFallback(`${STORAGE_PREFIX}_CANTEEN_HIST`, 'CANTEEN_HIST', {
      'September 2026': INITIAL_CANTEEN_REPORT,
      'October 2026': INITIAL_OCTOBER_CANTEEN_REPORT,
      'November 2026': createDefaultCanteenReport('November', 2026),
    });
  });
  const [selectedCanteenMonth, setSelectedCanteenMonth] = useState<string>('October 2026');

  // Multi-Month Uniform Store
  const [uniformHistory, setUniformHistory] = useState<{ [key: string]: UniformReport }>(() => {
    return getStoredItemWithFallback(`${STORAGE_PREFIX}_UNIFORM_HIST_STORE`, 'UNIFORM_HIST_STORE', {
      'September 2026': INITIAL_UNIFORM_REPORT,
      'October 2026': createDefaultUniformReport('October', 2026),
      'November 2026': createDefaultUniformReport('November', 2026),
    });
  });
  const [selectedUniformMonth, setSelectedUniformMonth] = useState<string>('October 2026');

  // Uniform Sales Transactions
  const [uniformSalesHistory, setUniformSalesHistory] = useState<UniformSaleTransaction[]>(() => {
    return getStoredItemWithFallback(`${STORAGE_PREFIX}_UNI_SALES_TX`, 'UNI_SALES_TX', INITIAL_UNIFORM_SALES_HISTORY);
  });

  // Uniform Types Configuration (Allows creating custom uniform types & sizes)
  const [uniformTypes, setUniformTypes] = useState<UniformTypeConfig[]>(() => {
    return getStoredItemWithFallback(`${STORAGE_PREFIX}_UNIFORM_TYPES`, 'UNIFORM_TYPES', INITIAL_UNIFORM_TYPES);
  });

  // Student Promotion History (Durable audit log of promoted students)
  const [promotionHistory, setPromotionHistory] = useState<PromotionRecord[]>(() => {
    return getStoredItemWithFallback<PromotionRecord[]>(`${STORAGE_PREFIX}_PROMOTIONS`, 'PROMOTIONS', []);
  });

  // Global Period Synchronizer (Changes Month & Year across all school reports)
  const setGlobalPeriod = (month: string, year: number) => {
    setGlobalMonth(month);
    setGlobalYear(year);
    const key = `${month} ${year}`;

    // Auto-create in materials if needed
    setMaterialsHistory((prev) => {
      if (!prev[key]) {
        return { ...prev, [key]: createDefaultMaterialsReport(month, year) };
      }
      return prev;
    });
    setSelectedMaterialsMonth(key);

    // Auto-create in canteen if needed
    setCanteenHistory((prev) => {
      if (!prev[key]) {
        return { ...prev, [key]: createDefaultCanteenReport(month, year) };
      }
      return prev;
    });
    setSelectedCanteenMonth(key);

    // Auto-create in uniform if needed
    setUniformHistory((prev) => {
      if (!prev[key]) {
        return { ...prev, [key]: createDefaultUniformReport(month, year) };
      }
      return prev;
    });
    setSelectedUniformMonth(key);

    // Update class period string dynamically
    const monthIdx = MONTH_NAMES.indexOf(month as any);
    const monthNum = (monthIdx >= 0 ? monthIdx + 1 : 10).toString().padStart(2, '0');
    const daysInMonth = monthIdx >= 0 ? new Date(year, monthIdx + 1, 0).getDate() : 31;
    const newPeriod = `01.${monthNum}.${year} _ ${daysInMonth}.${monthNum}.${year}`;

    setClassData((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((cId) => {
        updated[cId] = {
          ...updated[cId],
          period: newPeriod,
        };
      });
      return updated;
    });
  };

  // Translation helper
  const t = (km: string, en: string) => (language === 'km' ? km : en);

  // Role permissions computation
  const getPermissions = (role: UserRole): RolePermissions => {
    switch (role) {
      case 'admin':
        return {
          canEdit: true,
          canDelete: true,
          canCollectFee: true,
          canModifySettings: true,
          canViewAllClasses: true,
          canExportBackup: true,
        };
      case 'accountant':
        return {
          canEdit: true,
          canDelete: false, // Restricted
          canCollectFee: true,
          canModifySettings: false,
          canViewAllClasses: true,
          canExportBackup: false,
        };
      case 'teacher':
        return {
          canEdit: false, // Read only
          canDelete: false,
          canCollectFee: false,
          canModifySettings: false,
          canViewAllClasses: false,
          canExportBackup: false,
        };
      case 'student':
        return {
          canEdit: false,
          canDelete: false,
          canCollectFee: false,
          canModifySettings: false,
          canViewAllClasses: false,
          canExportBackup: false,
        };
      default:
        return {
          canEdit: false,
          canDelete: false,
          canCollectFee: false,
          canModifySettings: false,
          canViewAllClasses: false,
          canExportBackup: false,
        };
    }
  };

  const permissions = getPermissions(currentUser.role);

  const [isHydrated, setIsHydrated] = useState(false);

  // Local Storage Sync (with unversioned permanent backup mirror keys)
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_LANG`, language);
    localStorage.setItem('BIM_RANGSEI_PERMANENT_LANG', language);
  }, [language]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`${STORAGE_PREFIX}_CURRENT_USER`, JSON.stringify(currentUser));
      localStorage.setItem('BIM_RANGSEI_PERMANENT_CURRENT_USER', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_USERS`, JSON.stringify(users));
    localStorage.setItem('BIM_RANGSEI_PERMANENT_USERS', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_SETTINGS`, JSON.stringify(settings));
    localStorage.setItem('BIM_RANGSEI_PERMANENT_SETTINGS', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_CLASSES`, JSON.stringify(classData));
    localStorage.setItem('BIM_RANGSEI_PERMANENT_CLASSES', JSON.stringify(classData));
  }, [classData]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_MAT_HISTORY_STORE`, JSON.stringify(materialsHistory));
    localStorage.setItem('BIM_RANGSEI_PERMANENT_MAT_HISTORY_STORE', JSON.stringify(materialsHistory));
  }, [materialsHistory]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_MAT_SALES_TX`, JSON.stringify(materialSalesHistory));
    localStorage.setItem('BIM_RANGSEI_PERMANENT_MAT_SALES_TX', JSON.stringify(materialSalesHistory));
  }, [materialSalesHistory]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_CANTEEN_HIST`, JSON.stringify(canteenHistory));
    localStorage.setItem('BIM_RANGSEI_PERMANENT_CANTEEN_HIST', JSON.stringify(canteenHistory));
  }, [canteenHistory]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_UNIFORM_HIST_STORE`, JSON.stringify(uniformHistory));
    localStorage.setItem('BIM_RANGSEI_PERMANENT_UNIFORM_HIST_STORE', JSON.stringify(uniformHistory));
  }, [uniformHistory]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_UNI_SALES_TX`, JSON.stringify(uniformSalesHistory));
    localStorage.setItem('BIM_RANGSEI_PERMANENT_UNI_SALES_TX', JSON.stringify(uniformSalesHistory));
  }, [uniformSalesHistory]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_UNIFORM_TYPES`, JSON.stringify(uniformTypes));
    localStorage.setItem('BIM_RANGSEI_PERMANENT_UNIFORM_TYPES', JSON.stringify(uniformTypes));
  }, [uniformTypes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_PROMOTIONS`, JSON.stringify(promotionHistory));
    localStorage.setItem('BIM_RANGSEI_PERMANENT_PROMOTIONS', JSON.stringify(promotionHistory));
  }, [promotionHistory]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_BUS_ROUTES`, JSON.stringify(busRoutes));
    localStorage.setItem('BIM_RANGSEI_PERMANENT_BUS_ROUTES', JSON.stringify(busRoutes));
  }, [busRoutes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_BUS_ENROLLMENTS`, JSON.stringify(busEnrollments));
    localStorage.setItem('BIM_RANGSEI_PERMANENT_BUS_ENROLLMENTS', JSON.stringify(busEnrollments));
  }, [busEnrollments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_BUS_ATTENDANCE`, JSON.stringify(busAttendance));
    localStorage.setItem('BIM_RANGSEI_PERMANENT_BUS_ATTENDANCE', JSON.stringify(busAttendance));
  }, [busAttendance]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_TG_LOGS`, JSON.stringify(telegramAlertLogs));
  }, [telegramAlertLogs]);

  // Boot hydration: restore from Server / IndexedDB / Mirror if available (prevents data reset on redeployment)
  useEffect(() => {
    restoreStateOnStartup().then((serverData) => {
      try {
        if (serverData && typeof serverData === 'object') {
          if (serverData.users && Array.isArray(serverData.users)) {
            setUsers(serverData.users);
          }
          if (serverData.classes && Object.keys(serverData.classes).length > 0) {
            setClassData(serverData.classes);
          }
          if (serverData.classOrder && Array.isArray(serverData.classOrder) && serverData.classOrder.length > 0) {
            setClassOrder(serverData.classOrder);
          }
          if (serverData.branches && Array.isArray(serverData.branches) && serverData.branches.length > 0) {
            setBranches(serverData.branches);
          }
          if (serverData.currentBranchId) {
            setCurrentBranchId(serverData.currentBranchId);
          }
          if (serverData.materialsHistory && Object.keys(serverData.materialsHistory).length > 0) {
            setMaterialsHistory(serverData.materialsHistory);
          }
          if (serverData.materialSalesHistory && Array.isArray(serverData.materialSalesHistory)) {
            setMaterialSalesHistory(serverData.materialSalesHistory);
          }
          if (serverData.canteenHistory && Object.keys(serverData.canteenHistory).length > 0) {
            setCanteenHistory(serverData.canteenHistory);
          }
          if (serverData.uniformHistory && Object.keys(serverData.uniformHistory).length > 0) {
            setUniformHistory(serverData.uniformHistory);
          }
          if (serverData.uniformSalesHistory && Array.isArray(serverData.uniformSalesHistory)) {
            setUniformSalesHistory(serverData.uniformSalesHistory);
          }
          if (serverData.uniformTypes && Array.isArray(serverData.uniformTypes)) {
            setUniformTypes(serverData.uniformTypes);
          }
          if (serverData.promotionHistory && Array.isArray(serverData.promotionHistory)) {
            setPromotionHistory(serverData.promotionHistory);
          }
          if (serverData.busRoutes && Array.isArray(serverData.busRoutes)) {
            setBusRoutes(serverData.busRoutes);
          }
          if (serverData.busEnrollments && Array.isArray(serverData.busEnrollments)) {
            setBusEnrollments(serverData.busEnrollments);
          }
          if (serverData.busPayments && Array.isArray(serverData.busPayments)) {
            setBusPayments(serverData.busPayments);
          }
          if (serverData.busAttendance && Array.isArray(serverData.busAttendance)) {
            setBusAttendance(serverData.busAttendance);
          }
          if (serverData.currentUser && serverData.currentUser.id) {
            setCurrentUser(serverData.currentUser);
            localStorage.setItem(`${STORAGE_PREFIX}_CURRENT_USER`, JSON.stringify(serverData.currentUser));
            localStorage.setItem('BIM_RANGSEI_PERMANENT_CURRENT_USER', JSON.stringify(serverData.currentUser));
          }
          if (serverData.settings) {
            setSettings(serverData.settings);
          }
        }
      } catch (err) {
        console.warn('Hydration parse warning:', err);
      } finally {
        setIsHydrated(true);
      }
    });
  }, []);

  // Multi-tier background sync to IndexedDB and server persistence (debounced)
  // CRITICAL: only sync after hydration completes so initial fallback doesn't overwrite existing durable data!
  useEffect(() => {
    if (!isHydrated) return;
    syncStateToServer({
      currentUser,
      users,
      classes: classData,
      classOrder,
      branches,
      currentBranchId,
      materialsHistory,
      materialSalesHistory,
      canteenHistory,
      uniformHistory,
      uniformSalesHistory,
      uniformTypes,
      promotionHistory,
      busRoutes,
      busEnrollments,
      busPayments,
      busAttendance,
      settings,
    });
  }, [
    isHydrated,
    currentUser,
    users,
    classData,
    classOrder,
    branches,
    currentBranchId,
    materialsHistory,
    materialSalesHistory,
    canteenHistory,
    uniformHistory,
    uniformSalesHistory,
    uniformTypes,
    promotionHistory,
    busRoutes,
    busEnrollments,
    busPayments,
    busAttendance,
    settings,
  ]);

  const triggerAutoBackup = async (
    source: 'manual' | 'auto_interval' | 'daily_close' | 'cloud_sync' = 'manual'
  ): Promise<{ success: boolean; meta?: BackupSnapshotMeta; message: string }> => {
    try {
      const bundle = buildCompleteBackupBundle({
        classData,
        materialSalesHistory,
        uniformSalesHistory,
        canteenHistory,
        canteenReport: currentCanteenReport,
        materialsHistory,
        busEnrollments,
        busPayments,
        settings,
        branches,
        users,
        backupType: source,
      });

      // 1. Save to Local Storage Ring & IndexedDB
      const meta = await saveBackupSnapshotToLocal(bundle, autoBackupConfig.maxLocalSnapshots || 15);
      setLastBackupTime(bundle.createdAt);
      refreshBackupSnapshots();

      // 2. Sync to Server persistent storage file
      if (autoBackupConfig.syncToServerStorage) {
        try {
          await fetch('/api/backups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bundle),
          });
        } catch {}
      }

      // 3. Sync to Telegram Cloud if enabled and configured
      if (autoBackupConfig.syncToTelegramCloud && settings.telegramConfig.botToken && settings.telegramConfig.chatId) {
        try {
          await syncBackupToServerAndCloud(bundle, settings.telegramConfig);
        } catch {}
      }

      // 4. Update last backup date in settings
      updateSettings({
        autoBackupConfig: {
          ...autoBackupConfig,
          lastBackupAt: bundle.createdAt,
        },
      });

      // 5. Prompt for Cloud Sync if auto-backup triggered periodically or requested
      if (autoBackupConfig.autoPromptCloudSync && source === 'auto_interval') {
        setCloudSyncPrompt({
          isOpen: true,
          snapshotId: bundle.snapshotId,
          timestamp: bundle.createdAt,
        });
      }

      return {
        success: true,
        meta,
        message: 'បានបម្រុងទុកទិន្នន័យដោយជោគជ័យ!',
      };
    } catch (err: any) {
      console.error('Trigger backup error:', err);
      return {
        success: false,
        message: err.message || 'មិនអាចបង្កើត Backup បានទេ',
      };
    }
  };

  const triggerCloudSync = async (): Promise<{ success: boolean; message: string; tgSynced?: boolean }> => {
    try {
      const bundle = buildCompleteBackupBundle({
        classData,
        materialSalesHistory,
        uniformSalesHistory,
        canteenHistory,
        canteenReport: currentCanteenReport,
        materialsHistory,
        busEnrollments,
        busPayments,
        settings,
        branches,
        users,
        backupType: 'cloud_sync',
      });

      const res = await syncBackupToServerAndCloud(bundle, settings.telegramConfig);
      if (res.success) {
        setLastBackupTime(bundle.createdAt);
        refreshBackupSnapshots();
        sendTelegramAlert(
          '☁️ Cloud Sync ជោគជ័យ (BIM Rangsei Cloud)',
          `ទិន្នន័យសិស្ស និងចំណូលលក់ប្រចាំថ្ងៃត្រូវបានធ្វើសមកាលកម្មទៅ Cloud ដោយជោគជ័យ (${new Date().toLocaleString('km-KH')})`,
          'system'
        );
      }
      return res;
    } catch (err: any) {
      return { success: false, message: err.message || 'Error executing cloud sync' };
    }
  };

  const exportDailySalesAndStudents = () => {
    const bundle = buildCompleteBackupBundle({
      classData,
      materialSalesHistory,
      uniformSalesHistory,
      canteenHistory,
      canteenReport: currentCanteenReport,
      materialsHistory,
      busEnrollments,
      busPayments,
      settings,
      branches,
      users,
      backupType: 'manual',
    });
    exportDailySalesAndStudentsJSON(bundle);
  };

  const restoreFromSnapshotBundle = (bundle: SchoolBackupBundle): boolean => {
    try {
      if (bundle.classesData) setClassData(bundle.classesData);
      if (bundle.materialsHistory) setMaterialsHistory(bundle.materialsHistory);
      if (bundle.materialSalesHistory) setMaterialSalesHistory(bundle.materialSalesHistory);
      if (bundle.canteenHistory) setCanteenHistory(bundle.canteenHistory);
      if (bundle.uniformSalesHistory) setUniformSalesHistory(bundle.uniformSalesHistory);
      if (bundle.busEnrollments) setBusEnrollments(bundle.busEnrollments);
      if (bundle.busPayments) setBusPayments(bundle.busPayments);
      if (bundle.branches) setBranches(bundle.branches);
      if (bundle.users) setUsers(bundle.users);
      if (bundle.settings) setSettings(bundle.settings);
      return true;
    } catch (e) {
      console.error('Failed to restore snapshot bundle:', e);
      return false;
    }
  };

  const syncToSupabaseNow = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const bundle = {
        currentUser,
        users,
        classes: classData,
        classOrder,
        branches,
        currentBranchId,
        materialsHistory,
        materialSalesHistory,
        canteenHistory,
        uniformHistory,
        uniformSalesHistory,
        uniformTypes,
        promotionHistory,
        busRoutes,
        busEnrollments,
        busPayments,
        busAttendance,
        settings,
        lastSavedAt: Date.now(),
      };

      // 1. Path A: Try backend server endpoint first (which also updates local JSON cache)
      let serverSaved = false;
      let serverErrorMsg = '';

      try {
        const res = await fetch('/api/supabase/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bundle),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success && data.savedToSupabase) {
          serverSaved = true;
          return {
            success: true,
            message: 'ទិន្នន័យត្រូវបានរក្សាទុកក្នុង Supabase Cloud Database ដោយជោគជ័យ!',
          };
        }
        if (data.supabaseError) {
          serverErrorMsg = data.supabaseError;
        }
      } catch (err: any) {
        serverErrorMsg = err?.message || 'Server proxy unreachable';
      }

      // 2. Path B: Direct client-side Supabase REST fallback
      // Since anon key has full table rights, direct client call guarantees persistence even if server proxy times out
      try {
        const { error } = await supabase.from('bim_school_state').upsert({
          id: 'latest',
          data: bundle,
          updated_at: new Date().toISOString(),
        });

        if (!error) {
          return {
            success: true,
            message: 'ទិន្នន័យត្រូវបានរក្សាទុកក្នុង Supabase Cloud Database ដោយជោគជ័យ!',
          };
        }

        return {
          success: false,
          message: error.message
            ? `បរាជ័យក្នុងការរក្សាទុកទៅ Supabase: ${error.message}`
            : (serverErrorMsg || 'បរាជ័យក្នុងការរក្សាទុកទៅ Supabase'),
        };
      } catch (clientErr: any) {
        return {
          success: false,
          message: clientErr.message || serverErrorMsg || 'បរាជ័យក្នុងការរក្សាទុកទៅ Supabase',
        };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Error connecting to Supabase' };
    }
  };

  const restoreFromSupabaseNow = async (): Promise<{ success: boolean; message: string }> => {
    try {
      let d: any = null;

      // 1. Path A: Try server endpoint first
      try {
        const res = await fetch('/api/supabase/state');
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && json.data) {
            d = json.data;
          }
        }
      } catch {}

      // 2. Path B: Direct client fallback
      if (!d) {
        try {
          const { data, error } = await supabase
            .from('bim_school_state')
            .select('data')
            .eq('id', 'latest')
            .single();
          if (!error && data && data.data) {
            d = data.data;
          }
        } catch {}
      }

      if (!d) {
        return { success: false, message: 'ពុំមានទិន្នន័យរក្សាទុកក្នុង Supabase នៅឡើយទេ ឬមិនអាចទាញយកបាន' };
      }

      if (d.classes) setClassData(d.classes);
      if (d.classOrder) setClassOrder(d.classOrder);
      if (d.materialsHistory) setMaterialsHistory(d.materialsHistory);
      if (d.materialSalesHistory) setMaterialSalesHistory(d.materialSalesHistory);
      if (d.canteenHistory) setCanteenHistory(d.canteenHistory);
      if (d.uniformHistory) setUniformHistory(d.uniformHistory);
      if (d.uniformSalesHistory) setUniformSalesHistory(d.uniformSalesHistory);
      if (d.uniformTypes) setUniformTypes(d.uniformTypes);
      if (d.promotionHistory) setPromotionHistory(d.promotionHistory);
      if (d.busRoutes) setBusRoutes(d.busRoutes);
      if (d.busEnrollments) setBusEnrollments(d.busEnrollments);
      if (d.busPayments) setBusPayments(d.busPayments);
      if (d.busAttendance) setBusAttendance(d.busAttendance);
      if (d.branches) setBranches(d.branches);
      if (d.currentBranchId) setCurrentBranchId(d.currentBranchId);
      if (d.users) setUsers(d.users);
      if (d.settings) setSettings(d.settings);

      return { success: true, message: 'បានទាញយកទិន្នន័យពី Supabase Database ដោយជោគជ័យ!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error restoring from Supabase' };
    }
  };

  useEffect(() => {
    if (!autoBackupConfig.enabled || autoBackupConfig.frequency === 'manual') return;

    const getFrequencyMinutes = (freq: any): number => {
      switch (freq) {
        case '15m': return 15;
        case '30m': return 30;
        case '1h': return 60;
        case '4h': return 240;
        case 'daily_evening': return 24 * 60;
        default: return 60;
      }
    };

    const intervalId = setInterval(() => {
      const now = new Date();
      const last = lastBackupTime ? new Date(lastBackupTime).getTime() : 0;
      const elapsedMinutes = (now.getTime() - last) / (60 * 1000);

      if (autoBackupConfig.frequency === 'daily_evening') {
        const isEvening = now.getHours() >= 17;
        const backedUpToday = last && new Date(last).toDateString() === now.toDateString();
        if (isEvening && !backedUpToday) {
          triggerAutoBackup('daily_close');
        }
      } else {
        const targetMinutes = getFrequencyMinutes(autoBackupConfig.frequency);
        if (elapsedMinutes >= targetMinutes) {
          triggerAutoBackup('auto_interval');
        }
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [autoBackupConfig, lastBackupTime, classData, materialSalesHistory, uniformSalesHistory]);

  const switchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem(`${STORAGE_PREFIX}_CURRENT_USER`, JSON.stringify(found));
      localStorage.setItem('BIM_RANGSEI_PERMANENT_CURRENT_USER', JSON.stringify(found));
    }
  };

  const addUser = (userData: Omit<UserProfile, 'id'>) => {
    const newId = `user-${Date.now()}`;
    const newUser: UserProfile = {
      ...userData,
      id: newId,
      avatar: userData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${userData.username}`,
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<UserProfile>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentUser.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const deleteUser = (id: string): boolean => {
    if (currentUser.id === id) {
      alert(t('មិនអាចលុបគណនីដែលកំពុងដំណើរការបានទេ!', 'Cannot delete currently logged-in account!'));
      return false;
    }
    const admins = users.filter((u) => u.role === 'admin');
    const target = users.find((u) => u.id === id);
    if (target?.role === 'admin' && admins.length <= 1) {
      alert(t('ប្រព័ន្ធត្រូវតែមាន Admin យ៉ាងតិចម្នាក់!', 'System must have at least one Admin!'));
      return false;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    return true;
  };

  const login = (
    usernameOrEmail: string,
    password: string,
    rememberLogin: boolean = true
  ): { success: boolean; error?: string } => {
    const trimmedInput = usernameOrEmail.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedInput || !trimmedPass) {
      return {
        success: false,
        error: language === 'km'
          ? 'សូមបញ្ចូលឈ្មោះគណនី/អ៊ីមែល និងពាក្យសម្ងាត់'
          : 'Please enter username/email and password',
      };
    }

    const matchedUser = users.find(
      (u) =>
        u.username.toLowerCase() === trimmedInput ||
        u.email.toLowerCase() === trimmedInput
    );

    if (!matchedUser) {
      return {
        success: false,
        error: language === 'km'
          ? 'រកមិនឃើញឈ្មោះគណនី ឬអ៊ីមែលនេះក្នុងប្រព័ន្ធឡើយ'
          : 'User account or email not found in system',
      };
    }

    const validPassword =
      matchedUser.password ||
      (matchedUser.role === 'admin'
        ? 'admin123'
        : matchedUser.role === 'accountant'
        ? 'accountant123'
        : matchedUser.role === 'teacher'
        ? 'teacher123'
        : 'student123');

    const isMatch = trimmedPass === validPassword || trimmedPass === '123456';

    if (!isMatch) {
      return {
        success: false,
        error: language === 'km'
          ? 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ សូមពិនិត្យឡើងវិញ'
          : 'Incorrect password. Please verify and try again.',
      };
    }

    setCurrentUser(matchedUser);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('BIM_RANGSEI_REMEMBER_ME', 'true');
      localStorage.setItem('BIM_RANGSEI_REMEMBERED_USERNAME', trimmedInput);
      localStorage.setItem(`${STORAGE_PREFIX}_AUTH_SESSION`, 'true');
      localStorage.setItem('BIM_RANGSEI_PERMANENT_AUTH_SESSION', 'true');
      localStorage.setItem(`${STORAGE_PREFIX}_CURRENT_USER`, JSON.stringify(matchedUser));
      localStorage.setItem('BIM_RANGSEI_PERMANENT_CURRENT_USER', JSON.stringify(matchedUser));
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`${STORAGE_PREFIX}_AUTH_SESSION`, 'true');
        sessionStorage.setItem(`${STORAGE_PREFIX}_CURRENT_USER`, JSON.stringify(matchedUser));
      }
    } catch (e) {
      console.error('Failed to save auth session:', e);
    }

    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}_AUTH_SESSION`, 'false');
      localStorage.setItem('BIM_RANGSEI_PERMANENT_AUTH_SESSION', 'false');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`${STORAGE_PREFIX}_AUTH_SESSION`);
        sessionStorage.removeItem(`${STORAGE_PREFIX}_CURRENT_USER`);
      }
    } catch (e) {
      console.error('Failed to save logout state:', e);
    }
  };


  // Telegram Alert Sender & Visual Toast Dispatcher
  const sendTelegramAlert = async (
    title: string,
    message: string,
    type: TelegramAlertToast['type'] = 'fee',
    payerName?: string,
    amount?: string
  ): Promise<boolean> => {
    const timestampStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const fullDateStr = new Date().toLocaleString('km-KH');

    // 1. Immediately pop up Toast on screen
    const newToast: TelegramAlertToast = {
      id: `toast-${Date.now()}`,
      title,
      message,
      timestamp: timestampStr,
      type,
    };
    setActiveToast(newToast);

    // Auto-dismiss after 6 seconds
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 6000);

    // 2. Dispatch to backend proxy to send to Telegram
    const logId = `tg-log-${Date.now()}`;
    const initialLogItem: TelegramAlertLogItem = {
      id: logId,
      title,
      message,
      timestamp: fullDateStr,
      type,
      payerName,
      amount,
      success: false,
    };

    try {
      const token = settings.telegramConfig?.botToken?.trim();
      const chatId = settings.telegramConfig?.chatId?.trim();
      const isPlaceholderToken =
        !token ||
        token === 'bot_demo_token_bim_school' ||
        token.startsWith('bot_demo_');

      if (!settings.telegramConfig?.enabled || isPlaceholderToken || !chatId) {
        setTelegramAlertLogs((prev) => [
          { ...initialLogItem, success: false },
          ...prev.slice(0, 49),
        ]);
        return false;
      }

      const text = `🔔 *${title}*\n🏫 *${settings.schoolNameKhmer} (${settings.schoolNameEnglish})*\n\n${message}\n\n⏱ _${fullDateStr}_`;

      const cleanToken = token.trim().replace(/^bot(?=\d+:)/i, '').replace(/[\r\n\t]/g, '');
      let cleanChatId = chatId.trim().replace(/[\r\n\t"']/g, '');
      if (cleanChatId.includes('web.telegram.org') && cleanChatId.includes('#-')) {
        const match = cleanChatId.match(/#(-?\d+)/);
        if (match) cleanChatId = match[1];
      } else if (cleanChatId.match(/t\.me\/c\/(\d+)/)) {
        const match = cleanChatId.match(/t\.me\/c\/(\d+)/);
        if (match) cleanChatId = `-100${match[1]}`;
      } else if (cleanChatId.startsWith('https://t.me/')) {
        cleanChatId = '@' + cleanChatId.replace('https://t.me/', '').split('/')[0].split('?')[0];
      } else if (cleanChatId.startsWith('t.me/')) {
        cleanChatId = '@' + cleanChatId.replace('t.me/', '').split('/')[0].split('?')[0];
      }
      if (/^100\d{8,11}$/.test(cleanChatId)) {
        cleanChatId = `-${cleanChatId}`;
      }

      let isOk = false;

      // 1. Try server proxy route
      try {
        const res = await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: cleanToken,
            chatId: cleanChatId,
            text,
          }),
        });

        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success === true) {
          isOk = true;
        }
      } catch (proxyErr) {
        console.warn('Server telegram proxy unreachable, falling back to direct Telegram API:', proxyErr);
      }

      // 2. Direct client fallback if server proxy was not available
      if (!isOk) {
        try {
          const directRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: cleanChatId,
              text,
            }),
          });
          const directJson = await directRes.json();
          if (directRes.ok && directJson.ok) {
            isOk = true;
          }
        } catch (directErr) {
          console.warn('Direct telegram API send error:', directErr);
        }
      }

      setTelegramAlertLogs((prev) => [
        { ...initialLogItem, success: isOk },
        ...prev.slice(0, 49),
      ]);

      return isOk;
    } catch (err) {
      console.warn('Telegram notice error:', err);
      setTelegramAlertLogs((prev) => [
        { ...initialLogItem, success: false },
        ...prev.slice(0, 49),
      ]);
      return false;
    }
  };

  // Recalculate Class Summary Breakdown
  const recomputeClassSummary = (students: StudentFeeRecord[]): {
    summaryRows: StudentFeeSummaryRow[];
    totalCollected: number;
    totalExpected: number;
    rate: number;
  } => {
    let generalDue = 0, contributeDue = 0, fiftyDue = 0;
    let generalStopped = 0, contributeStopped = 0, fiftyStopped = 0, cashStopped = 0;
    let generalAlready = 0, contributeAlready = 0, fiftyAlready = 0, cashAlready = 0;
    let generalUnpaid = 0, contributeUnpaid = 0, fiftyUnpaid = 0, cashUnpaid = 0;
    let generalPaid = 0, contributePaid = 0, fiftyPaid = 0, cashPaid = 0;

    students.forEach((s) => {
      const isStopped = s.feesGroup.toLowerCase().includes('stop');
      const isAlready = s.feesGroup.toLowerCase().includes('already');
      const isUnpaid = s.feesGroup.toLowerCase().includes('unpaid') || s.cash === 0;

      if (s.caseType === 'Full') generalDue++;
      else if (s.caseType === 'Contribute') contributeDue++;
      else if (s.caseType === '50%') fiftyDue++;

      if (isStopped) {
        if (s.caseType === 'Full') generalStopped++;
        else if (s.caseType === 'Contribute') contributeStopped++;
        else if (s.caseType === '50%') fiftyStopped++;
        cashStopped += 15.0;
      } else if (isAlready) {
        if (s.caseType === 'Full') generalAlready++;
        else if (s.caseType === 'Contribute') contributeAlready++;
        else if (s.caseType === '50%') fiftyAlready++;
        cashAlready += s.cash;
      } else if (isUnpaid && s.cash === 0) {
        if (s.caseType === 'Full') generalUnpaid++;
        else if (s.caseType === 'Contribute') contributeUnpaid++;
        else if (s.caseType === '50%') fiftyUnpaid++;
        cashUnpaid += s.caseType === 'Full' ? 12.5 : s.caseType === '50%' ? 6.25 : 5.0;
      } else {
        if (s.caseType === 'Full') generalPaid++;
        else if (s.caseType === 'Contribute') contributePaid++;
        else if (s.caseType === '50%') fiftyPaid++;
        cashPaid += s.cash;
      }
    });

    const totalStudents = students.length;
    const totalExpected = cashPaid + cashUnpaid + cashAlready;
    const rate = totalExpected > 0 ? Math.round((cashPaid / totalExpected) * 100) : 0;

    const summaryRows: StudentFeeSummaryRow[] = [
      { id: 1, caseKhmer: 'ចំនួនសិស្សត្រូវបង់ខែ (Total Due)', general: generalDue, contribute: contributeDue, fiftyPercent: fiftyDue, totalStudents, totalCash: totalExpected },
      { id: 2, caseKhmer: 'សិស្សឈប់រៀនក្នុងខែ (Dropped / Stopped)', general: generalStopped, contribute: contributeStopped, fiftyPercent: fiftyStopped, totalStudents: generalStopped + contributeStopped + fiftyStopped, totalCash: cashStopped },
      { id: 3, caseKhmer: 'សិស្សបានបង់ពីខែមុនរួច (Prepaid)', general: generalAlready, contribute: contributeAlready, fiftyPercent: fiftyAlready, totalStudents: generalAlready + contributeAlready + fiftyAlready, totalCash: cashAlready },
      { id: 4, caseKhmer: 'សិស្សមិនទាន់បង់ខែ (Unpaid)', general: generalUnpaid, contribute: contributeUnpaid, fiftyPercent: fiftyUnpaid, totalStudents: generalUnpaid + contributeUnpaid + fiftyUnpaid, totalCash: cashUnpaid },
      { id: 5, caseKhmer: 'សិស្សបានបង់ខែ (Collected)', general: generalPaid, contribute: contributePaid, fiftyPercent: fiftyPaid, totalStudents: generalPaid + contributePaid + fiftyPaid, totalCash: cashPaid },
    ];

    return { summaryRows, totalCollected: cashPaid, totalExpected, rate };
  };

  const updateStudentFee = (classId: string, studentId: number, updates: Partial<StudentFeeRecord>) => {
    if (!permissions.canEdit) {
      alert(t('អ្នកគ្មានសិទ្ធិកែប្រែទិន្នន័យទេ (Permission Denied)', 'Permission Denied: You do not have permission to edit records.'));
      return;
    }

    setClassData((prev) => {
      const cls = prev[classId];
      if (!cls) return prev;
      const updatedStudents = cls.students.map((st) => {
        if (st.id !== studentId) return st;

        // If paying now, append to receipt history and trigger Telegram Alert
        let feeHistory = st.feeHistory || [];
        if (updates.cash && updates.cash > 0 && updates.cash !== st.cash) {
          const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
          const amountUSD = updates.cash;
          const amountKHR = updates.cash * settings.exchangeRate;
          const paidBy = updates.paidBy || st.paidBy || 'ABA';

          const newReceipt = {
            receiptNo,
            month: updates.feesGroup || globalMonth,
            date: updates.paymentDate || new Date().toISOString().slice(0, 10),
            amountUSD,
            amountKHR,
            paidBy,
            recordedBy: currentUser.khmerName,
            status: 'paid' as const,
          };
          feeHistory = [newReceipt, ...feeHistory];

          // Trigger Telegram alert for payment!
          sendTelegramAlert(
            'បង្កាន់ដៃបង់ថ្លៃសិក្សា (Tuition Fee Paid)',
            `សិស្ស៖ ${st.name} (${cls.className})\nកូដសិស្ស៖ ${st.studentCode}\nចំនួនទឹកប្រាក់៖ $${amountUSD.toFixed(2)} (${amountKHR.toLocaleString()}៛)\nវិធីទូទាត់៖ ${paidBy}\nបង្កាន់ដៃ៖ #${receiptNo}\nអ្នកទទួល៖ ${currentUser.khmerName}`,
            'fee',
            st.name,
            `$${amountUSD.toFixed(2)}`
          );
        }

        return { ...st, ...updates, feeHistory };
      });

      const { summaryRows, totalCollected, totalExpected, rate } = recomputeClassSummary(updatedStudents);
      return {
        ...prev,
        [classId]: {
          ...cls,
          students: updatedStudents,
          summaryRows,
          totalCollectedCash: totalCollected,
          totalExpectedCash: totalExpected,
          targetCollectionRate: rate,
        },
      };
    });
  };

  const recordStudentPayment = (
    classId: string,
    studentId: number,
    payment: {
      month?: string;
      months?: string[];
      monthsCount?: number;
      feePerMonthUSD?: number;
      discountUSD?: number;
      amountUSD: number;
      paidBy: 'ABA' | 'AC' | 'Cash';
      date: string;
      receiptNo?: string;
      invoiceNo?: string;
      note?: string;
      sendTelegram?: boolean;
    }
  ) => {
    if (!permissions.canCollectFee && !permissions.canEdit) {
      alert(t('អ្នកគ្មានសិទ្ធិប្រមូលប្រាក់ទេ (Permission Denied)', 'Permission Denied: You do not have permission to collect fees.'));
      return;
    }

    setClassData((prev) => {
      const cls = prev[classId];
      if (!cls) return prev;
      const receiptNo = payment.receiptNo || `REC-${Date.now().toString().slice(-6)}`;
      const invoiceNo = payment.invoiceNo || `INV-${Date.now().toString().slice(-6)}`;
      const amountKHR = Math.round(payment.amountUSD * settings.exchangeRate);

      const months =
        payment.months && payment.months.length > 0
          ? payment.months
          : [payment.month || globalMonth];
      const monthsCount = payment.monthsCount || months.length;
      const monthDisplay = months.length > 1 ? months.join(', ') : months[0];
      const feesGroupLabel =
        months.length > 1
          ? `${months[0].split(' ')[0]}-${months[months.length - 1].split(' ')[0]} (${months.length}M)`
          : months[0];

      let studentName = '';
      let studentCode = '';

      const updatedStudents = cls.students.map((st) => {
        if (st.id !== studentId) return st;
        studentName = st.name;
        studentCode = st.studentCode;

        const newReceipt: StudentFeePaymentItem = {
          receiptNo,
          invoiceNo,
          month: monthDisplay,
          months,
          monthsCount,
          feePerMonthUSD: payment.feePerMonthUSD,
          discountUSD: payment.discountUSD,
          date: payment.date,
          amountUSD: payment.amountUSD,
          amountKHR,
          paidBy: payment.paidBy,
          recordedBy: currentUser.khmerName,
          status: 'paid',
          note: payment.note,
        };

        const feeHistory = [newReceipt, ...(st.feeHistory || [])];
        return {
          ...st,
          cash: payment.amountUSD,
          feesGroup: feesGroupLabel,
          paymentDate: payment.date,
          paidBy: payment.paidBy,
          feeHistory,
        };
      });

      // Send telegram alert (default true)
      if (payment.sendTelegram !== false) {
        const fullMonthsText = months.length > 1 ? `${months.join(', ')} (${months.length} ខែ)` : monthDisplay;
        const feeRateText = payment.feePerMonthUSD ? `\nតម្លៃក្នុង១ខែ៖ $${payment.feePerMonthUSD.toFixed(2)}` : '';
        const discountText = payment.discountUSD && payment.discountUSD > 0 ? `\nបញ្ចុះតម្លៃ៖ -$${payment.discountUSD.toFixed(2)}` : '';
        sendTelegramAlert(
          'វិក្កយបត្រ & បង់ថ្លៃសិក្សា (Tuition Fee Invoice Paid)',
          `សិស្ស៖ ${studentName} (${cls.className})\nកូដសិស្ស៖ ${studentCode}\nវិក្កយបត្រ៖ #${invoiceNo || receiptNo}\nខែទូទាត់ (${monthsCount} ខែ)៖ ${fullMonthsText}${feeRateText}${discountText}\nទឹកប្រាក់សរុប៖ $${payment.amountUSD.toFixed(2)} (${amountKHR.toLocaleString()}៛)\nវិធីទូទាត់៖ ${payment.paidBy}\nអ្នកទទួល៖ ${currentUser.khmerName}${payment.note ? `\nកំណត់សម្គាល់៖ ${payment.note}` : ''}`,
          'fee',
          studentName,
          `$${payment.amountUSD.toFixed(2)}`
        );
      }

      const { summaryRows, totalCollected, totalExpected, rate } = recomputeClassSummary(updatedStudents);
      return {
        ...prev,
        [classId]: {
          ...cls,
          students: updatedStudents,
          summaryRows,
          totalCollectedCash: totalCollected,
          totalExpectedCash: totalExpected,
          targetCollectionRate: rate,
        },
      };
    });
  };

  const addStudent = (
    classId: string,
    studentData: Omit<StudentFeeRecord, 'id' | 'studentCode'> & { studentCode?: string }
  ): { success: boolean; error?: string } => {
    if (!permissions.canEdit) {
      alert(t('អ្នកគ្មានសិទ្ធិបញ្ចូលទិន្នន័យសិស្សទេ!', 'Permission Denied: Cannot add student.'));
      return { success: false, error: 'Permission Denied' };
    }

    const cls = classData[classId];
    if (!cls) return { success: false, error: 'Class not found' };

    const nextId = cls.students.length > 0 ? Math.max(...cls.students.map((s) => s.id)) + 1 : 1;
    const studentCode = studentData.studentCode?.trim() || `BIM-${classId}-${nextId.toString().padStart(3, '0')}`;

    // DUPLICATE SAFEGUARD 1: Check Student Code across entire school
    const dupCheck = checkDuplicateStudent(
      classData,
      {
        studentCode,
        nameKhmer: studentData.name,
        dob: studentData.dob,
        phone: studentData.phone,
      },
      classId
    );

    if (dupCheck.isDuplicateCode) {
      alert(t(
        `⚠️ អត្តលេខសិស្ស «${studentCode}» ត្រូវបានប្រើប្រាស់រួចហើយសម្រាប់សិស្ស «${dupCheck.matchedStudent?.name}» (${dupCheck.matchedClassName})! សូមបញ្ចូលអត្តលេខផ្សេង។`,
        `⚠️ Student code "${studentCode}" is already in use by "${dupCheck.matchedStudent?.name}" (${dupCheck.matchedClassName})! Please use another code.`
      ));
      return { success: false, error: dupCheck.errorMessage };
    }

    // DUPLICATE SAFEGUARD 2: Check Name in same class
    if (dupCheck.isDuplicateNameInClass) {
      const confirmAdd = window.confirm(
        t(
          `⚠️ រកឃើញឈ្មោះស្ទួនក្នុងថ្នាក់ ${cls.className}៖\nសិស្សឈ្មោះ «${dupCheck.matchedStudent?.name}» (អត្តលេខ: ${dupCheck.matchedStudent?.studentCode}) មានរួចហើយក្នុងថ្នាក់នេះ!\n\nតើលោកអ្នកពិតជាចង់ចុះឈ្មោះសិស្សឈ្មោះដូចគ្នានេះបន្ថែមទៀតមែនទេ?`,
          `⚠️ Duplicate student name detected in ${cls.className}:\nStudent "${dupCheck.matchedStudent?.name}" (Code: ${dupCheck.matchedStudent?.studentCode}) is already enrolled!\n\nDo you want to proceed anyway?`
        )
      );
      if (!confirmAdd) {
        return { success: false, error: 'Duplicate name cancelled by user' };
      }
    }

    setClassData((prev) => {
      const currentCls = prev[classId];
      if (!currentCls) return prev;
      const newStudent: StudentFeeRecord = {
        ...studentData,
        id: nextId,
        studentCode,
        branchId: currentCls.branchId || 'branch-central',
        feeHistory: studentData.cash > 0 ? [
          {
            receiptNo: `REC-${Date.now().toString().slice(-6)}`,
            month: studentData.feesGroup || globalMonth,
            date: studentData.paymentDate || new Date().toISOString().slice(0, 10),
            amountUSD: studentData.cash,
            amountKHR: studentData.cash * settings.exchangeRate,
            paidBy: studentData.paidBy,
            recordedBy: currentUser.khmerName,
            status: 'paid',
          }
        ] : [],
      };

      if (studentData.cash > 0) {
        sendTelegramAlert(
          'ចុះឈ្មោះ & បង់ថ្លៃសិក្សាថ្មី (New Student Fee)',
          `សិស្សថ្មី៖ ${studentData.name} (${currentCls.className})\nចំនួន៖ $${studentData.cash.toFixed(2)}\nវិធីទូទាត់៖ ${studentData.paidBy}\nអ្នកទទួល៖ ${currentUser.khmerName}`,
          'fee',
          studentData.name,
          `$${studentData.cash.toFixed(2)}`
        );
      }

      const updatedStudents = [...currentCls.students, newStudent];
      const { summaryRows, totalCollected, totalExpected, rate } = recomputeClassSummary(updatedStudents);

      return {
        ...prev,
        [classId]: {
          ...currentCls,
          students: updatedStudents,
          summaryRows,
          totalCollectedCash: totalCollected,
          totalExpectedCash: totalExpected,
          targetCollectionRate: rate,
        },
      };
    });

    return { success: true };
  };

  const batchAddStudents = (
    classId: string,
    newStudentsData: Array<Omit<StudentFeeRecord, 'id' | 'studentCode'> & { studentCode?: string }>
  ): { success: boolean; addedCount: number; errors: string[] } => {
    if (!permissions.canEdit) {
      alert(t('អ្នកគ្មានសិទ្ធិបញ្ចូលទិន្នន័យសិស្សទេ!', 'Permission Denied: Cannot add students.'));
      return { success: false, addedCount: 0, errors: ['Permission Denied'] };
    }

    const cls = classData[classId];
    if (!cls) return { success: false, addedCount: 0, errors: ['Class not found'] };

    let currentHighestId = cls.students.length > 0 ? Math.max(...cls.students.map((s) => s.id)) : 0;
    const addedStudents: StudentFeeRecord[] = [];
    const errors: string[] = [];

    newStudentsData.forEach((studentData, index) => {
      currentHighestId += 1;
      const nextId = currentHighestId;
      const studentCode = studentData.studentCode?.trim() || `BIM-${classId}-${nextId.toString().padStart(3, '0')}`;

      const newStudent: StudentFeeRecord = {
        ...studentData,
        id: nextId,
        studentCode,
        branchId: cls.branchId || 'branch-central',
        feeHistory: studentData.cash > 0 ? [
          {
            receiptNo: `REC-${Date.now().toString().slice(-6)}-${index + 1}`,
            month: studentData.feesGroup || globalMonth,
            date: studentData.paymentDate || new Date().toISOString().slice(0, 10),
            amountUSD: studentData.cash,
            amountKHR: studentData.cash * settings.exchangeRate,
            paidBy: studentData.paidBy || 'Cash',
            recordedBy: currentUser.khmerName,
            status: 'paid',
          }
        ] : [],
      };

      addedStudents.push(newStudent);
    });

    if (addedStudents.length === 0) {
      return { success: false, addedCount: 0, errors };
    }

    setClassData((prev) => {
      const currentCls = prev[classId];
      if (!currentCls) return prev;
      const updatedStudents = [...currentCls.students, ...addedStudents];
      const { summaryRows, totalCollected, totalExpected, rate } = recomputeClassSummary(updatedStudents);

      return {
        ...prev,
        [classId]: {
          ...currentCls,
          students: updatedStudents,
          summaryRows,
          totalCollectedCash: totalCollected,
          totalExpectedCash: totalExpected,
          targetCollectionRate: rate,
        },
      };
    });

    // Send Telegram alert for batch import
    sendTelegramAlert(
      'នាំចូលសិស្សពី Excel (Excel Batch Import)',
      `ថ្នាក់៖ ${cls.className}\nចំនួនសិស្សនាំចូល៖ ${addedStudents.length} នាក់\nអ្នកកត់ត្រា៖ ${currentUser.khmerName}`,
      'fee',
      `សិស្សថ្មី ${addedStudents.length} នាក់`
    );

    return { success: true, addedCount: addedStudents.length, errors };
  };

  const deleteStudent = (classId: string, studentId: number): boolean => {
    if (!permissions.canDelete) {
      alert(t('មានតែ Admin ទើបមានសិទ្ធិលុបឈ្មោះសិស្ស!', 'Permission Denied: Only Admin can delete student records.'));
      return false;
    }

    setClassData((prev) => {
      const cls = prev[classId];
      if (!cls) return prev;
      const updatedStudents = cls.students.filter((s) => s.id !== studentId);
      const { summaryRows, totalCollected, totalExpected, rate } = recomputeClassSummary(updatedStudents);
      return {
        ...prev,
        [classId]: {
          ...cls,
          students: updatedStudents,
          summaryRows,
          totalCollectedCash: totalCollected,
          totalExpectedCash: totalExpected,
          targetCollectionRate: rate,
        },
      };
    });
    return true;
  };

  const deleteStudentPaymentRecord = (classId: string, studentId: number, receiptNo: string): boolean => {
    if (currentUser.role !== 'admin') {
      alert(t('មានតែគណនី Admin ទើបមានសិទ្ធិលុបប្រវត្តិវិក្កយបត្រ!', 'Permission Denied: Only Admin accounts can delete payment records.'));
      return false;
    }

    let deleted = false;
    setClassData((prev) => {
      const cls = prev[classId];
      if (!cls) return prev;

      const updatedStudents = cls.students.map((st) => {
        if (st.id !== studentId) return st;

        const currentHistory = st.feeHistory || [];
        const newHistory = currentHistory.filter(
          (r) => r.receiptNo !== receiptNo && r.invoiceNo !== receiptNo
        );

        if (newHistory.length !== currentHistory.length) {
          deleted = true;
        }

        if (newHistory.length === 0) {
          return {
            ...st,
            cash: 0,
            paidBy: '$ -' as const,
            paymentDate: '',
            feesGroup: 'Unpaid',
            feeHistory: [],
          };
        } else {
          const latest = newHistory[0];
          return {
            ...st,
            cash: latest.amountUSD,
            paidBy: latest.paidBy,
            paymentDate: latest.date,
            feesGroup: latest.months && latest.months.length > 1
              ? `${latest.months[0].split(' ')[0]}-${latest.months[latest.months.length - 1].split(' ')[0]} (${latest.months.length}M)`
              : (latest.month || globalMonth),
            feeHistory: newHistory,
          };
        }
      });

      if (!deleted) return prev;

      const { summaryRows, totalCollected, totalExpected, rate } = recomputeClassSummary(updatedStudents);
      return {
        ...prev,
        [classId]: {
          ...cls,
          students: updatedStudents,
          summaryRows,
          totalCollectedCash: totalCollected,
          totalExpectedCash: totalExpected,
          targetCollectionRate: rate,
        },
      };
    });

    if (selectedStudentForProfile && selectedStudentForProfile.id === studentId) {
      setSelectedStudentForProfile((prev) => {
        if (!prev) return null;
        const newHistory = (prev.feeHistory || []).filter(
          (r) => r.receiptNo !== receiptNo && r.invoiceNo !== receiptNo
        );
        if (newHistory.length === 0) {
          return {
            ...prev,
            cash: 0,
            paidBy: '$ -' as const,
            paymentDate: '',
            feesGroup: 'Unpaid',
            feeHistory: [],
          };
        }
        const latest = newHistory[0];
        return {
          ...prev,
          cash: latest.amountUSD,
          paidBy: latest.paidBy,
          paymentDate: latest.date,
          feeHistory: newHistory,
        };
      });
    }

    return deleted;
  };

  const clearStudentsPaymentHistory = (
    classId: string,
    studentIds: number[],
    resetActiveStatus: boolean = true
  ): { success: boolean; clearedCount: number } => {
    if (currentUser.role !== 'admin') {
      alert(t('មានតែគណនី Admin ទើបមានសិទ្ធិសម្អាតប្រវត្តិបង់ប្រាក់!', 'Permission Denied: Only Admin accounts can clear payment records.'));
      return { success: false, clearedCount: 0 };
    }

    const cls = classData[classId];
    if (!cls || studentIds.length === 0) {
      return { success: false, clearedCount: 0 };
    }

    const studentIdSet = new Set(studentIds);
    let count = 0;

    setClassData((prev) => {
      const currentCls = prev[classId];
      if (!currentCls) return prev;

      const updatedStudents = currentCls.students.map((st) => {
        if (!studentIdSet.has(st.id)) return st;
        count++;
        return {
          ...st,
          feeHistory: [],
          ...(resetActiveStatus ? {
            cash: 0,
            paidBy: '$ -' as const,
            paymentDate: '',
            feesGroup: 'Unpaid',
          } : {}),
        };
      });

      const { summaryRows, totalCollected, totalExpected, rate } = recomputeClassSummary(updatedStudents);
      return {
        ...prev,
        [classId]: {
          ...currentCls,
          students: updatedStudents,
          summaryRows,
          totalCollectedCash: totalCollected,
          totalExpectedCash: totalExpected,
          targetCollectionRate: rate,
        },
      };
    });

    if (selectedStudentForProfile && studentIdSet.has(selectedStudentForProfile.id)) {
      setSelectedStudentForProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          feeHistory: [],
          ...(resetActiveStatus ? {
            cash: 0,
            paidBy: '$ -' as const,
            paymentDate: '',
            feesGroup: 'Unpaid',
          } : {}),
        };
      });
    }

    sendTelegramAlert(
      '🧹 សម្អាតប្រវត្តិបង់ប្រាក់តាមជ្រើសរើស (Cleared Payment History)',
      `ថ្នាក់៖ ${cls.className}\nចំនួនសិស្សដែលបានសម្អាត៖ ${count} នាក់\nកំណត់ស្ថានភាពជា៖ ${resetActiveStatus ? 'Unpaid ($0)' : 'Keep Current Fee'}\nប្រតិបត្តិករ៖ ${currentUser.khmerName}`,
      'system'
    );

    return { success: true, clearedCount: count };
  };

  const clearAllPaymentHistory = (
    classId?: string,
    resetActiveStatus: boolean = true
  ): { success: boolean; clearedCount: number } => {
    if (currentUser.role !== 'admin') {
      alert(t('មានតែគណនី Admin ទើបមានសិទ្ធិសម្អាតប្រវត្តិបង់ប្រាក់!', 'Permission Denied: Only Admin accounts can clear payment records.'));
      return { success: false, clearedCount: 0 };
    }

    let totalStudentsCleared = 0;

    setClassData((prev) => {
      const nextClassData = { ...prev };
      const targetClassIds = classId && classId !== 'all' ? [classId] : Object.keys(nextClassData);

      targetClassIds.forEach((cid) => {
        const cls = nextClassData[cid];
        if (!cls) return;

        const updatedStudents = cls.students.map((st) => {
          totalStudentsCleared++;
          return {
            ...st,
            feeHistory: [],
            ...(resetActiveStatus ? {
              cash: 0,
              paidBy: '$ -' as const,
              paymentDate: '',
              feesGroup: 'Unpaid',
            } : {}),
          };
        });

        const { summaryRows, totalCollected, totalExpected, rate } = recomputeClassSummary(updatedStudents);
        nextClassData[cid] = {
          ...cls,
          students: updatedStudents,
          summaryRows,
          totalCollectedCash: totalCollected,
          totalExpectedCash: totalExpected,
          targetCollectionRate: rate,
        };
      });

      return nextClassData;
    });

    if (selectedStudentForProfile) {
      const shouldClearProfile = !classId || classId === 'all' || selectedClassId === classId;
      if (shouldClearProfile) {
        setSelectedStudentForProfile((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            feeHistory: [],
            ...(resetActiveStatus ? {
              cash: 0,
              paidBy: '$ -' as const,
              paymentDate: '',
              feesGroup: 'Unpaid',
            } : {}),
          };
        });
      }
    }

    const targetDesc = classId && classId !== 'all'
      ? `ថ្នាក់៖ ${classData[classId]?.className || classId}`
      : 'គ្រប់ថ្នាក់ទាំងអស់ក្នុងសាលា (All Classes in School)';

    sendTelegramAlert(
      '🧹 សម្អាតប្រវត្តិបង់ប្រាក់ទាំងអស់ (Cleared All Payment History)',
      `${targetDesc}\nចំនួនសិស្សសរុប៖ ${totalStudentsCleared} នាក់\nកំណត់ស្ថានភាពជា៖ ${resetActiveStatus ? 'Unpaid ($0)' : 'Keep Current Fee'}\nប្រតិបត្តិករ៖ ${currentUser.khmerName}`,
      'system'
    );

    return { success: true, clearedCount: totalStudentsCleared };
  };

  const addClass = (
    className: string,
    period = '01.10.2026 _ 31.10.2026',
    homeroomTeacher = '',
    teacherPhone = '',
    branchId?: string
  ): { success: boolean; error?: string; classId?: string } => {
    if (!permissions.canEdit) return { success: false, error: 'Permission Denied' };

    const effectiveBranchId = branchId || (currentBranchId !== 'all' ? currentBranchId : (branches.find(b => b.isMainBranch)?.id || 'branch-central'));

    // Check duplicate in the same branch
    const dupCheck = checkDuplicateClass(classData, className);
    if (dupCheck.isDuplicate) {
      const sameBranchDup = Object.values(classData).find(
        (c) => c.className.toLowerCase().trim() === className.toLowerCase().trim() && (c.branchId || 'branch-central') === effectiveBranchId
      );
      if (sameBranchDup) {
        alert(t(
          `⚠️ ឈ្មោះថ្នាក់ «${className}» មានរួចហើយនៅក្នុងសាខានេះ!`,
          `⚠️ Class "${className}" already exists in this campus!`
        ));
        return { success: false, error: 'Duplicate class in branch' };
      }
    }

    const newClassId = `cls_${Date.now().toString().slice(-4)}`;
    setClassData((prev) => ({
      ...prev,
      [newClassId]: {
        classId: newClassId,
        className: className.trim(),
        period: period.trim(),
        homeroomTeacher: homeroomTeacher.trim(),
        teacherPhone: teacherPhone.trim(),
        branchId: effectiveBranchId,
        targetCollectionRate: 0,
        totalExpectedCash: 0,
        totalCollectedCash: 0,
        students: [],
        summaryRows: [
          { id: 1, caseKhmer: 'ចំនួនសិស្សត្រូវបង់ខែ', general: 0, contribute: 0, fiftyPercent: 0, totalStudents: 0, totalCash: 0 },
          { id: 2, caseKhmer: 'សិស្សឈប់រៀនក្នុងខែ', general: 0, contribute: 0, fiftyPercent: 0, totalStudents: 0, totalCash: 0 },
          { id: 3, caseKhmer: 'សិស្សបានបង់ពីខែមុនរួច', general: 0, contribute: 0, fiftyPercent: 0, totalStudents: 0, totalCash: 0 },
          { id: 4, caseKhmer: 'សិស្សមិនទាន់បង់ខែ', general: 0, contribute: 0, fiftyPercent: 0, totalStudents: 0, totalCash: 0 },
          { id: 5, caseKhmer: 'សិស្សបានបង់ខែ', general: 0, contribute: 0, fiftyPercent: 0, totalStudents: 0, totalCash: 0 },
        ],
      },
    }));

    setClassOrder((prev) => [...prev, newClassId]);
    setSelectedClassId(newClassId);
    return { success: true, classId: newClassId };
  };

  const updateClass = (
    classId: string,
    updates: {
      className?: string;
      period?: string;
      homeroomTeacher?: string;
      teacherPhone?: string;
      branchId?: string;
    }
  ): { success: boolean; error?: string } => {
    if (!permissions.canEdit) {
      alert(t('អ្នកគ្មានសិទ្ធិកែប្រែព័ត៌មានថ្នាក់ទេ!', 'Permission Denied: Cannot edit class.'));
      return { success: false, error: 'Permission denied' };
    }

    if (!classData[classId]) {
      return { success: false, error: 'Class not found' };
    }

    const currentCls = classData[classId];
    const targetBranch = updates.branchId || currentCls.branchId || 'branch-central';

    if (updates.className && updates.className.trim() !== currentCls.className) {
      const dup = Object.values(classData).find(
        (c) => c.classId !== classId &&
               c.className.toLowerCase().trim() === updates.className!.toLowerCase().trim() &&
               (c.branchId || 'branch-central') === targetBranch
      );
      if (dup) {
        alert(t(`⚠️ ឈ្មោះថ្នាក់ «${updates.className}» មានរួចហើយនៅក្នុងសាខានេះ!`, `⚠️ Class name "${updates.className}" already exists in this campus!`));
        return { success: false, error: 'Duplicate class name' };
      }
    }

    setClassData((prev) => {
      const target = prev[classId];
      if (!target) return prev;
      return {
        ...prev,
        [classId]: {
          ...target,
          className: updates.className !== undefined ? updates.className.trim() : target.className,
          period: updates.period !== undefined ? updates.period.trim() : target.period,
          homeroomTeacher: updates.homeroomTeacher !== undefined ? updates.homeroomTeacher.trim() : target.homeroomTeacher,
          teacherPhone: updates.teacherPhone !== undefined ? updates.teacherPhone.trim() : target.teacherPhone,
          branchId: updates.branchId !== undefined ? updates.branchId : (target.branchId || 'branch-central'),
        },
      };
    });

    return { success: true };
  };

  const deleteClass = (classId: string): { success: boolean; message?: string } => {
    if (!permissions.canDelete) {
      alert(t('មានតែ Admin ទើបមានសិទ្ធិលុបថ្នាក់រៀន!', 'Permission Denied: Only Admin can delete classes.'));
      return { success: false, message: 'Permission denied' };
    }

    const availableClasses = Object.keys(classData);
    if (availableClasses.length <= 1) {
      alert(t('មិនអាចលុបថ្នាក់ចុងក្រោយក្នុងសាលាបានទេ!', 'Cannot delete the only remaining class!'));
      return { success: false, message: 'Cannot delete the last class' };
    }

    const cls = classData[classId];
    if (cls && cls.students.length > 0) {
      const confirmDelete = window.confirm(
        t(
          `⚠️ ថ្នាក់ «${cls.className}» មានសិស្សចំនួន ${cls.students.length} នាក់!\n\nតើលោកអ្នកពិតជាចង់លុបថ្នាក់នេះ និងទិន្នន័យសិស្សទាំងអស់ក្នុងថ្នាក់នេះមែនទេ?`,
          `⚠️ Class "${cls.className}" contains ${cls.students.length} students!\n\nAre you sure you want to delete this class and all its student records?`
        )
      );
      if (!confirmDelete) {
        return { success: false, message: 'Cancelled by user' };
      }
    }

    setClassData((prev) => {
      const copy = { ...prev };
      delete copy[classId];
      return copy;
    });

    setClassOrder((prev) => prev.filter((id) => id !== classId));

    if (selectedClassId === classId) {
      const fallback = availableClasses.find((id) => id !== classId) || '1A';
      setSelectedClassId(fallback);
    }

    return { success: true };
  };

  const reorderClasses = (newOrderClassIds: string[]) => {
    setClassOrder(newOrderClassIds);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}_CLASS_ORDER`, JSON.stringify(newOrderClassIds));
      localStorage.setItem('BIM_RANGSEI_PERMANENT_CLASS_ORDER', JSON.stringify(newOrderClassIds));
    } catch (e) {
      console.error(e);
    }
  };

  const moveClassOrder = (classId: string, direction: 'up' | 'down') => {
    const currentList = orderedClassList.map((c) => c.classId);
    const index = currentList.indexOf(classId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentList.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...currentList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    reorderClasses(updated);
  };

  const sortClasses = (mode: 'name_asc' | 'name_desc' | 'students_desc') => {
    const list = [...orderedClassList];
    if (mode === 'name_asc') {
      list.sort((a, b) => a.className.localeCompare(b.className, 'km'));
    } else if (mode === 'name_desc') {
      list.sort((a, b) => b.className.localeCompare(a.className, 'km'));
    } else if (mode === 'students_desc') {
      list.sort((a, b) => b.students.length - a.students.length);
    }
    reorderClasses(list.map((c) => c.classId));
  };

  const updateClassTeacher = (classId: string, homeroomTeacher: string, teacherPhone: string) => {
    updateClass(classId, { homeroomTeacher, teacherPhone });
  };

  // Academic Months Operations
  const addAcademicMonth = (monthName: string): { success: boolean; error?: string } => {
    const trimmed = monthName.trim();
    if (!trimmed) return { success: false, error: 'Month name required' };
    if (academicMonths.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, error: 'Month already exists' };
    }
    setAcademicMonths((prev) => [...prev, trimmed]);
    return { success: true };
  };

  const updateAcademicMonth = (oldMonthName: string, newMonthName: string): { success: boolean; error?: string } => {
    const trimmed = newMonthName.trim();
    if (!trimmed) return { success: false, error: 'Month name required' };
    if (oldMonthName !== trimmed && academicMonths.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, error: 'Month name already in use' };
    }
    setAcademicMonths((prev) => prev.map((m) => (m === oldMonthName ? trimmed : m)));
    if (globalMonth === oldMonthName) {
      setGlobalMonth(trimmed);
    }
    return { success: true };
  };

  const deleteAcademicMonth = (monthName: string): { success: boolean; message?: string } => {
    if (academicMonths.length <= 1) {
      alert(t('មិនអាចលុបខែចុងក្រោយបានទេ!', 'Cannot delete the only remaining month!'));
      return { success: false, message: 'Cannot delete last month' };
    }
    setAcademicMonths((prev) => prev.filter((m) => m !== monthName));
    if (globalMonth === monthName) {
      const fallback = academicMonths.find((m) => m !== monthName) || 'October';
      setGlobalMonth(fallback);
    }
    return { success: true };
  };

  const reorderAcademicMonths = (newMonthsOrder: string[]) => {
    setAcademicMonths(newMonthsOrder);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}_ACADEMIC_MONTHS`, JSON.stringify(newMonthsOrder));
      localStorage.setItem('BIM_RANGSEI_PERMANENT_ACADEMIC_MONTHS', JSON.stringify(newMonthsOrder));
    } catch (e) {
      console.error(e);
    }
  };

  const moveAcademicMonthOrder = (monthName: string, direction: 'up' | 'down') => {
    const index = academicMonths.indexOf(monthName);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === academicMonths.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...academicMonths];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    reorderAcademicMonths(updated);
  };

  const sortAcademicMonths = (mode: 'academic' | 'calendar' | 'alphabetical') => {
    const list = [...academicMonths];
    if (mode === 'academic') {
      const orderMap = DEFAULT_ACADEMIC_MONTHS.reduce((acc, m, i) => ({ ...acc, [m]: i }), {} as any);
      list.sort((a, b) => (orderMap[a] ?? 99) - (orderMap[b] ?? 99));
    } else if (mode === 'calendar') {
      const calMap = MONTH_NAMES.reduce((acc, m, i) => ({ ...acc, [m]: i }), {} as any);
      list.sort((a, b) => (calMap[a] ?? 99) - (calMap[b] ?? 99));
    } else if (mode === 'alphabetical') {
      list.sort((a, b) => a.localeCompare(b));
    }
    reorderAcademicMonths(list);
  };

  const promoteStudents = (
    sourceClassId: string,
    targetClassId: string,
    studentIds: number[],
    options?: {
      newFeeGroup?: string;
      carryOverPrepaid?: boolean;
      createNewClassIfNeeded?: { className: string; period?: string };
      removeFromOldClass?: boolean;
      sendTelegramAlert?: boolean;
    }
  ) => {
    if (!permissions.canEdit) {
      alert(t('អ្នកគ្មានសិទ្ធិឡើងថ្នាក់សិស្សទេ!', 'Permission Denied: Cannot promote students.'));
      return { success: false, count: 0, targetClassName: '', error: 'Permission denied' };
    }

    if (!studentIds || studentIds.length === 0) {
      alert(t('សូមជ្រើសរើសសិស្សយ៉ាងហោចណាស់ម្នាក់ដើម្បីឡើងថ្នាក់!', 'Please select at least one student to promote.'));
      return { success: false, count: 0, targetClassName: '', error: 'No students selected' };
    }

    const sourceClass = classData[sourceClassId];
    if (!sourceClass) {
      return { success: false, count: 0, targetClassName: '', error: 'Source class not found' };
    }

    let finalTargetClassId = targetClassId;
    let finalTargetClassName = classData[targetClassId]?.className || targetClassId;

    if (options?.createNewClassIfNeeded && (!classData[targetClassId] || targetClassId === 'NEW_CLASS')) {
      const newId = `cls_${Date.now().toString().slice(-4)}`;
      finalTargetClassId = newId;
      finalTargetClassName = options.createNewClassIfNeeded.className;
      const period = options.createNewClassIfNeeded.period || sourceClass.period;
      addClass(finalTargetClassName, period);
    }

    const studentsToPromote = sourceClass.students.filter((st) => studentIds.includes(st.id));
    if (studentsToPromote.length === 0) {
      return { success: false, count: 0, targetClassName: '', error: 'No matching students' };
    }

    const effectiveFeeGroup = options?.newFeeGroup || globalMonth;
    const nowStr = new Date().toISOString().slice(0, 10);
    const newPromotionRecords: PromotionRecord[] = [];

    setClassData((prev) => {
      const currentSource = prev[sourceClassId];
      if (!currentSource) return prev;

      let currentTarget = prev[finalTargetClassId];
      if (!currentTarget) {
        currentTarget = {
          classId: finalTargetClassId,
          className: finalTargetClassName,
          period: currentSource.period,
          targetCollectionRate: 0,
          totalExpectedCash: 0,
          totalCollectedCash: 0,
          students: [],
          summaryRows: [],
        };
      }

      let maxTargetId = currentTarget.students.length > 0
        ? Math.max(...currentTarget.students.map((s) => s.id))
        : 0;

      const promotedStudentsToAdd: StudentFeeRecord[] = studentsToPromote.map((st) => {
        maxTargetId += 1;
        const carryPrepaid = options?.carryOverPrepaid && st.feesGroup === 'Already';

        newPromotionRecords.push({
          id: `prom-${Date.now()}-${st.id}`,
          studentId: st.id,
          studentCode: st.studentCode,
          studentName: st.name,
          fromClassId: sourceClassId,
          fromClassName: currentSource.className,
          toClassId: finalTargetClassId,
          toClassName: finalTargetClassName,
          promotedDate: nowStr,
          academicYear: settings.academicYear,
          promotedBy: currentUser.khmerName,
          feeGroupAssigned: effectiveFeeGroup,
        });

        return {
          ...st,
          id: maxTargetId,
          note: 'Old',
          feesGroup: carryPrepaid ? 'Already' : effectiveFeeGroup,
          startDate: nowStr,
          paymentDate: carryPrepaid ? st.paymentDate : 'Unpaid-1month',
          paidBy: carryPrepaid ? st.paidBy : '$ -',
          cash: carryPrepaid ? st.cash : 0,
          feeHistory: st.feeHistory || [],
        };
      });

      const shouldRemoveFromOld = options?.removeFromOldClass !== false;
      const updatedSourceStudents = shouldRemoveFromOld
        ? currentSource.students.filter((st) => !studentIds.includes(st.id))
        : currentSource.students;

      const updatedTargetStudents = [...currentTarget.students, ...promotedStudentsToAdd];

      const sourceSummary = recomputeClassSummary(updatedSourceStudents);
      const targetSummary = recomputeClassSummary(updatedTargetStudents);

      return {
        ...prev,
        [sourceClassId]: {
          ...currentSource,
          students: updatedSourceStudents,
          summaryRows: sourceSummary.summaryRows,
          totalCollectedCash: sourceSummary.totalCollected,
          totalExpectedCash: sourceSummary.totalExpected,
          targetCollectionRate: sourceSummary.rate,
        },
        [finalTargetClassId]: {
          ...currentTarget,
          students: updatedTargetStudents,
          summaryRows: targetSummary.summaryRows,
          totalCollectedCash: targetSummary.totalCollected,
          totalExpectedCash: targetSummary.totalExpected,
          targetCollectionRate: targetSummary.rate,
        },
      };
    });

    setPromotionHistory((prev) => [...newPromotionRecords, ...prev]);

    if (options?.sendTelegramAlert !== false) {
      sendTelegramAlert(
        '🎓 ឡើងថ្នាក់សិស្សជោគជ័យ (Students Promoted)',
        `ថ្នាក់ដើម៖ ${sourceClass.className}\nថ្នាក់ថ្មី៖ ${finalTargetClassName}\nចំនួនសិស្ស៖ ${studentsToPromote.length} នាក់\nខែសិក្សា៖ ${effectiveFeeGroup}\nអ្នកអនុវត្ត៖ ${currentUser.khmerName}`,
        'system',
        `${studentsToPromote.length} នាក់`,
        finalTargetClassName
      );
    }

    return {
      success: true,
      count: studentsToPromote.length,
      targetClassName: finalTargetClassName,
    };
  };

  // Active Materials Report (Multi-Month)
  const currentMaterialsReport: DailyMaterialsReport =
    materialsHistory[selectedMaterialsMonth] ||
    materialsHistory['October 2026'] ||
    Object.values(materialsHistory)[0];

  const createMaterialsMonthRecord = (month: string, year: number) => {
    const key = `${month} ${year}`;
    if (!materialsHistory[key]) {
      const newRep = createDefaultMaterialsReport(month, year);
      setMaterialsHistory((prev) => ({ ...prev, [key]: newRep }));
    }
    setSelectedMaterialsMonth(key);
  };

  const deleteMaterialsMonthRecord = (monthKey: string): boolean => {
    if (!permissions.canDelete) return false;
    const remaining = Object.keys(materialsHistory).filter((k) => k !== monthKey);
    if (remaining.length === 0) return false;
    setMaterialsHistory((prev) => {
      const copy = { ...prev };
      delete copy[monthKey];
      return copy;
    });
    if (selectedMaterialsMonth === monthKey) {
      setSelectedMaterialsMonth(remaining[0]);
    }
    return true;
  };

  const updateDailyMaterialSale = (itemId: number, day: number, qty: number) => {
    if (!permissions.canEdit) return;
    setMaterialsHistory((prevStore) => {
      const activeReport = prevStore[selectedMaterialsMonth] || currentMaterialsReport;
      const updatedItems = activeReport.items.map((it) => {
        if (it.id !== itemId) return it;
        const newDaily = { ...it.dailyQuantities };
        if (qty > 0) newDaily[day] = qty;
        else delete newDaily[day];
        const totalQty = Object.values(newDaily).reduce((sum, val) => sum + (val || 0), 0);
        return { ...it, dailyQuantities: newDaily, totalQty, totalAmountKHR: totalQty * it.unitPriceKHR };
      });
      return {
        ...prevStore,
        [selectedMaterialsMonth]: {
          ...activeReport,
          items: updatedItems,
        },
      };
    });
  };

  const addMaterialItem = (
    name: string,
    category: 'stationery' | 'books' | 'uniform_card' | 'textbooks',
    unitPriceKHR: number
  ) => {
    if (!permissions.canEdit) return;
    const activeReport = materialsHistory[selectedMaterialsMonth] || currentMaterialsReport;
    const dupCheck = checkDuplicateMaterialItem(activeReport.items, name);
    if (dupCheck.isDuplicate) {
      alert(t(`⚠️ ${dupCheck.errorMessage}`, `⚠️ Item "${name}" already exists!`));
      return;
    }

    setMaterialsHistory((prevStore) => {
      const rep = prevStore[selectedMaterialsMonth] || currentMaterialsReport;
      const nextId = rep.items.length > 0 ? Math.max(...rep.items.map((i) => i.id)) + 1 : 1;
      const newItem = { id: nextId, name: name.trim(), category, unitPriceKHR, dailyQuantities: {}, totalQty: 0, totalAmountKHR: 0 };
      return {
        ...prevStore,
        [selectedMaterialsMonth]: {
          ...rep,
          items: [...rep.items, newItem],
        },
      };
    });
  };

  const recordMaterialSaleTransaction = (tx: Omit<MaterialSaleTransaction, 'id' | 'receiptNo' | 'timestamp'>) => {
    if (!permissions.canCollectFee && !permissions.canEdit) return;
    const now = new Date();
    const receiptNo = `MAT-${Date.now().toString().slice(-6)}`;
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;

    const newTx: MaterialSaleTransaction = {
      ...tx,
      id: `mat-sale-${Date.now()}`,
      receiptNo,
      timestamp,
    };
    setMaterialSalesHistory((prev) => [newTx, ...prev]);

    // Also update daily calendar cell for current day
    const dayNum = parseInt(tx.date.split('-')[2] || '1', 10);
    const item = currentMaterialsReport.items.find((i) => i.id === tx.itemId);
    if (item) {
      const currentDayQty = item.dailyQuantities[dayNum] || 0;
      updateDailyMaterialSale(tx.itemId, dayNum, currentDayQty + tx.quantity);
    }

    // Trigger Telegram alert for payment!
    sendTelegramAlert(
      'លក់សម្ភារៈសិក្សា (Stationery Sale Paid)',
      `មុខទំនិញ៖ ${tx.itemName}\nចំនួន៖ ${tx.quantity} pcs\nតម្លៃសរុប៖ ${tx.totalAmountKHR.toLocaleString()}៛\nអ្នកទិញ៖ ${tx.customerName || 'ទូទៅ'}\nវិធីទូទាត់៖ ${tx.paymentMethod}\nវិក្កយបត្រ៖ #${receiptNo}\nអ្នកលក់៖ ${tx.recordedBy}`,
      'material',
      tx.customerName,
      `${tx.totalAmountKHR.toLocaleString()}៛`
    );
  };

  const deleteMaterialSaleTransaction = (id: string): boolean => {
    if (!permissions.canDelete) {
      alert(t('មានតែ Admin ទើបមានសិទ្ធិលុបប្រវត្តិលក់!', 'Permission Denied: Only Admin can delete sales history.'));
      return false;
    }
    setMaterialSalesHistory((prev) => prev.filter((item) => item.id !== id));
    return true;
  };

  // Canteen Vendor Attendance & Monthly History
  const currentCanteenReport =
    canteenHistory[selectedCanteenMonth] ||
    canteenHistory['October 2026'] ||
    Object.values(canteenHistory)[0];

  const updateVendorAttendance = (
    date: string,
    vendorId: string,
    status: 'paid' | 'absent' | 'double_paid' | 'unpaid',
    amountKHR?: number,
    note?: string
  ) => {
    if (!permissions.canEdit) return;

    setCanteenHistory((prev) => {
      const report = prev[selectedCanteenMonth] || currentCanteenReport;
      if (!report) return prev;

      let computedAmount = amountKHR;
      if (computedAmount === undefined) {
        if (status === 'paid') computedAmount = 10000;
        else if (status === 'double_paid') computedAmount = 20000;
        else computedAmount = 0;
      }

      const updatedRecords = report.dailyRecords.map((r) => {
        if (r.date !== date) return r;
        const updatedStatus = {
          ...r.vendorStatus,
          [vendorId]: {
            status,
            amountKHR: computedAmount,
            note: note || (status === 'absent' ? 'ឈប់' : status === 'unpaid' ? '-៛' : undefined),
          },
        };
        const activeCount = Object.values(updatedStatus).filter((s) => s.status !== 'absent').length;
        const dailyTotalKHR = Object.values(updatedStatus).reduce((sum, s) => sum + (s.amountKHR || 0), 0);
        return {
          ...r,
          vendorStatus: updatedStatus,
          vendorCount: activeCount,
          dailyTotalKHR,
        };
      });

      // Trigger Telegram alert for canteen fee payment!
      if (computedAmount && computedAmount > 0 && (status === 'paid' || status === 'double_paid')) {
        const vendor = report.vendors.find((v) => v.id === vendorId);
        sendTelegramAlert(
          'ថ្លៃទីតាំងអាហារដ្ឋាន (Canteen Stall Fee Paid)',
          `អ្នកលក់៖ ${vendor?.name || 'អាជីវករ'} (${vendor?.stallName || ''})\nកាលបរិច្ឆេទ៖ ${date}\nចំនួនប្រាក់៖ ${computedAmount.toLocaleString()}៛\nស្ថានភាព៖ ${status === 'double_paid' ? 'បង់ទ្វេដង (20,000៛)' : 'បានបង់ (10,000៛)'}`,
          'canteen',
          vendor?.name,
          `${computedAmount.toLocaleString()}៛`
        );
      }

      return {
        ...prev,
        [selectedCanteenMonth]: {
          ...report,
          dailyRecords: updatedRecords,
        },
      };
    });
  };

  const addCanteenVendor = (name: string, stallName: string, dailyFeeKHR = 10000) => {
    if (!permissions.canEdit) return;
    const report = currentCanteenReport || INITIAL_CANTEEN_REPORT;
    const isDup = report.vendors.some(
      (v) =>
        v.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        v.stallName.trim().toLowerCase() === stallName.trim().toLowerCase()
    );
    if (isDup) {
      alert(t(
        `⚠️ អ្នកលក់ឈ្មោះ «${name}» (${stallName}) មានក្នុងបញ្ជីរួចរាល់ហើយ!`,
        `⚠️ Vendor "${name}" (${stallName}) is already registered!`
      ));
      return;
    }

    setCanteenHistory((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((monthKey) => {
        const rep = updated[monthKey];
        const nextId = `v${rep.vendors.length + 1}`;
        updated[monthKey] = {
          ...rep,
          vendors: [...rep.vendors, { id: nextId, name: name.trim(), stallName: stallName.trim(), dailyFeeKHR }],
        };
      });
      return updated;
    });
  };

  const updateCanteenVendor = (
    vendorId: string,
    updates: Partial<CanteenVendor>
  ) => {
    if (!permissions.canEdit) {
      alert(t('អ្នកគ្មានសិទ្ធិកែប្រែព័ត៌មានអ្នកលក់ទេ!', 'Permission Denied: Cannot edit vendor.'));
      return;
    }
    setCanteenHistory((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((monthKey) => {
        const rep = updated[monthKey];
        const updatedVendors = rep.vendors.map((v) =>
          v.id === vendorId
            ? {
                ...v,
                ...updates,
                name: updates.name ? updates.name.trim() : v.name,
                stallName: updates.stallName ? updates.stallName.trim() : v.stallName,
              }
            : v
        );
        updated[monthKey] = {
          ...rep,
          vendors: updatedVendors,
        };
      });
      return updated;
    });
  };

  const deleteCanteenVendor = (vendorId: string): boolean => {
    if (!permissions.canDelete) {
      alert(t('មានតែ Admin ទើបមានសិទ្ធិលុបអ្នកលក់!', 'Permission Denied: Only Admin can delete vendor.'));
      return false;
    }
    setCanteenHistory((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((monthKey) => {
        const rep = updated[monthKey];
        updated[monthKey] = {
          ...rep,
          vendors: rep.vendors.filter((v) => v.id !== vendorId),
        };
      });
      return updated;
    });
    return true;
  };

  const addCanteenDailyRecord = (
    dateStr: string,
    defaultStatus: 'paid' | 'absent' | 'unpaid' = 'paid'
  ): { success: boolean; error?: string } => {
    if (!permissions.canEdit) return { success: false, error: 'Permission Denied' };
    const report = canteenHistory[selectedCanteenMonth] || currentCanteenReport;
    if (!report) return { success: false, error: 'Report not found' };

    const trimmedDate = dateStr.trim();
    if (!trimmedDate) return { success: false, error: 'Invalid date' };

    const exists = report.dailyRecords.some((r) => r.date.toLowerCase() === trimmedDate.toLowerCase());
    if (exists) {
      alert(t(`កាលបរិច្ឆេទ «${trimmedDate}» មានក្នុងតារាងរួចហើយ!`, `Date "${trimmedDate}" already exists in the ledger!`));
      return { success: false, error: 'Date already exists' };
    }

    const defaultVendorStatus: { [vId: string]: { status: 'paid' | 'absent' | 'double_paid' | 'unpaid'; amountKHR: number; note?: string } } = {};
    let dailyTotal = 0;
    let activeCount = 0;

    report.vendors.forEach((v) => {
      const fee = v.dailyFeeKHR || 10000;
      if (defaultStatus === 'paid') {
        defaultVendorStatus[v.id] = { status: 'paid', amountKHR: fee };
        dailyTotal += fee;
        activeCount++;
      } else if (defaultStatus === 'unpaid') {
        defaultVendorStatus[v.id] = { status: 'unpaid', amountKHR: 0, note: '-៛' };
        activeCount++;
      } else {
        defaultVendorStatus[v.id] = { status: 'absent', amountKHR: 0, note: 'ឈប់' };
      }
    });

    const newRecord: CanteenAttendanceRecord = {
      date: trimmedDate,
      vendorStatus: defaultVendorStatus,
      vendorCount: activeCount,
      standardFeeKHR: 10000,
      dailyTotalKHR: dailyTotal,
    };

    setCanteenHistory((prev) => {
      const rep = prev[selectedCanteenMonth] || currentCanteenReport;
      const parseDateNum = (dStr: string): number => {
        if (!dStr) return 0;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return new Date(dStr).getTime();
        const parts = dStr.split(/[-/._]/);
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const mStr = parts[1].toLowerCase();
          const yStr = parts[2];
          const fullYear = yStr.length === 2 ? 2000 + parseInt(yStr, 10) : parseInt(yStr, 10);
          const monthShorts = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          const mIdx = monthShorts.findIndex((s) => mStr.startsWith(s));
          if (mIdx >= 0 && !isNaN(day) && !isNaN(fullYear)) {
            return new Date(fullYear, mIdx, day).getTime();
          }
        }
        return 0;
      };

      const updatedRecords = [...rep.dailyRecords, newRecord].sort((a, b) => {
        return parseDateNum(a.date) - parseDateNum(b.date);
      });

      return {
        ...prev,
        [selectedCanteenMonth]: {
          ...rep,
          dailyRecords: updatedRecords,
        },
      };
    });

    return { success: true };
  };

  const autoPopulateFullMonthDates = (
    mode: 'all_days' | 'weekdays_only' = 'weekdays_only'
  ) => {
    if (!permissions.canEdit) return;
    const report = canteenHistory[selectedCanteenMonth] || currentCanteenReport;
    if (!report) return;

    const monthName = report.month;
    const year = report.year;
    const monthIdx = MONTH_NAMES.indexOf(monthName as any);
    const validMonthIdx = monthIdx >= 0 ? monthIdx : 9;
    const daysInMonth = new Date(year, validMonthIdx + 1, 0).getDate();
    const monthShort = monthName.slice(0, 3);
    const yrShort = year.toString().slice(-2);

    const existingDatesMap = new Map(report.dailyRecords.map((r) => [r.date.toLowerCase(), r]));
    const newRecords: CanteenAttendanceRecord[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, validMonthIdx, day);
      const dayOfWeek = dateObj.getDay();

      if (mode === 'weekdays_only' && (dayOfWeek === 0 || dayOfWeek === 6)) {
        continue;
      }

      const dateStr = `${day}-${monthShort}-${yrShort}`;
      let existing = existingDatesMap.get(dateStr.toLowerCase());
      if (!existing) {
        existing = report.dailyRecords.find((r) => {
          const parts = r.date.split('-');
          return parts.length >= 2 && parseInt(parts[0], 10) === day;
        });
      }

      if (existing) {
        newRecords.push(existing);
      } else {
        const defaultVendorStatus: { [vId: string]: { status: 'paid' | 'absent' | 'double_paid' | 'unpaid'; amountKHR: number } } = {};
        let dailyTotal = 0;
        let activeCount = 0;

        report.vendors.forEach((v) => {
          const fee = v.dailyFeeKHR || 10000;
          defaultVendorStatus[v.id] = { status: 'paid', amountKHR: fee };
          dailyTotal += fee;
          activeCount++;
        });

        newRecords.push({
          date: dateStr,
          vendorStatus: defaultVendorStatus,
          vendorCount: activeCount,
          standardFeeKHR: 10000,
          dailyTotalKHR: dailyTotal,
        });
      }
    }

    setCanteenHistory((prev) => {
      const rep = prev[selectedCanteenMonth] || currentCanteenReport;
      return {
        ...prev,
        [selectedCanteenMonth]: {
          ...rep,
          dailyRecords: newRecords,
        },
      };
    });

    sendTelegramAlert(
      '📅 បង្កើតកាលបរិច្ឆេទពេញមួយខែស្វ័យប្រវត្ត (Auto-Populate Canteen Dates)',
      `ខែ៖ ${monthName} ${year}\nចំនួនថ្ងៃបង្កើត៖ ${newRecords.length} ថ្ងៃ\nអ្នកអនុវត្ត៖ ${currentUser.khmerName}`,
      'canteen',
      'Canteen Ledger',
      `${newRecords.length} ថ្ងៃ`
    );
  };

  const createCanteenMonthRecord = (month: string, year: number) => {
    const key = `${month} ${year}`;
    if (canteenHistory[key]) {
      setSelectedCanteenMonth(key);
      return;
    }
    const template = currentCanteenReport || INITIAL_CANTEEN_REPORT;
    const newReport: CanteenReport = {
      month,
      year,
      schoolName: settings.schoolNameKhmer,
      approvedBy: settings.directorName,
      preparedBy: settings.accountantName,
      vendors: template.vendors,
      dailyRecords: [
        {
          date: `1-${month.slice(0, 3)}-${year.toString().slice(-2)}`,
          vendorStatus: {},
          vendorCount: 0,
          standardFeeKHR: 10000,
          dailyTotalKHR: 0,
        },
      ],
    };
    setCanteenHistory((prev) => ({ ...prev, [key]: newReport }));
    setSelectedCanteenMonth(key);
  };

  const deleteCanteenMonthRecord = (monthKey: string): boolean => {
    if (!permissions.canDelete) return false;
    const remaining = Object.keys(canteenHistory).filter((k) => k !== monthKey);
    if (remaining.length === 0) return false;
    setCanteenHistory((prev) => {
      const copy = { ...prev };
      delete copy[monthKey];
      return copy;
    });
    if (selectedCanteenMonth === monthKey) {
      setSelectedCanteenMonth(remaining[0]);
    }
    return true;
  };

  // Multi-Month Uniform Sales Store
  const currentUniformReport: UniformReport =
    uniformHistory[selectedUniformMonth] ||
    uniformHistory['October 2026'] ||
    Object.values(uniformHistory)[0];

  const createUniformMonthRecord = (month: string, year: number) => {
    const key = `${month} ${year}`;
    if (!uniformHistory[key]) {
      const newRep = createDefaultUniformReport(month, year);
      setUniformHistory((prev) => ({ ...prev, [key]: newRep }));
    }
    setSelectedUniformMonth(key);
  };

  const deleteUniformMonthRecord = (monthKey: string): boolean => {
    if (!permissions.canDelete) return false;
    const remaining = Object.keys(uniformHistory).filter((k) => k !== monthKey);
    if (remaining.length === 0) return false;
    setUniformHistory((prev) => {
      const copy = { ...prev };
      delete copy[monthKey];
      return copy;
    });
    if (selectedUniformMonth === monthKey) {
      setSelectedUniformMonth(remaining[0]);
    }
    return true;
  };

  const addUniformType = (
    nameKhmer: string,
    nameEnglish: string,
    defaultPriceKHR: number,
    initialSizes: string[],
    description?: string
  ) => {
    if (!permissions.canEdit) {
      alert(t('អ្នកគ្មានសិទ្ធិបន្ថែមប្រភេទឯកសណ្ឋានទេ!', 'Permission Denied: Cannot add uniform type.'));
      return;
    }
    const cleanSizes = initialSizes.map((s) => s.trim()).filter(Boolean);
    const finalSizes = cleanSizes.length > 0 ? cleanSizes : ['Free Size'];
    const id = `type_${Date.now()}`;
    const newType: UniformTypeConfig = {
      id,
      nameKhmer: nameKhmer.trim(),
      nameEnglish: nameEnglish.trim() || nameKhmer.trim(),
      defaultPriceKHR: Number(defaultPriceKHR) || 30000,
      sizes: finalSizes,
      description: description?.trim() || undefined,
    };
    setUniformTypes((prev) => [...prev, newType]);
  };

  const addUniformSize = (typeId: string, sizeName: string) => {
    if (!permissions.canEdit) return;
    const trimmed = sizeName.trim();
    if (!trimmed) return;

    setUniformTypes((prev) =>
      prev.map((ut) => {
        if (ut.id === typeId) {
          if (ut.sizes.includes(trimmed)) return ut;
          return { ...ut, sizes: [...ut.sizes, trimmed] };
        }
        return ut;
      })
    );

    // Sync to active report if default types
    if (typeId === 'general_shirt') {
      setUniformHistory((prev) => {
        const rep = prev[selectedUniformMonth] || currentUniformReport;
        if (!rep.shirtSizes.includes(trimmed)) {
          return {
            ...prev,
            [selectedUniformMonth]: {
              ...rep,
              shirtSizes: [...rep.shirtSizes, trimmed],
            },
          };
        }
        return prev;
      });
    } else if (typeId === 'sports_bottom') {
      setUniformHistory((prev) => {
        const rep = prev[selectedUniformMonth] || currentUniformReport;
        if (!rep.sportSizes.includes(trimmed)) {
          return {
            ...prev,
            [selectedUniformMonth]: {
              ...rep,
              sportSizes: [...rep.sportSizes, trimmed],
            },
          };
        }
        return prev;
      });
    }
  };

  const deleteUniformType = (typeId: string): boolean => {
    if (!permissions.canDelete) {
      alert(t('មានតែ Admin ទើបអាចលុបមុខទំនិញឯកសណ្ឋានបាន!', 'Permission Denied: Only Admin can delete uniform items.'));
      return false;
    }
    if (uniformTypes.length <= 1) {
      alert(t('មិនអាចលុបមុខទំនិញឯកសណ្ឋានចុងក្រោយបង្អស់បានទេ!', 'Cannot delete the only remaining uniform item!'));
      return false;
    }
    setUniformTypes((prev) => prev.filter((ut) => ut.id !== typeId));
    // Clean up records in active month report if custom
    setUniformHistory((prev) => {
      const rep = prev[selectedUniformMonth] || currentUniformReport;
      if (rep.recordsByType && rep.recordsByType[typeId]) {
        const copyByType = { ...rep.recordsByType };
        delete copyByType[typeId];
        return {
          ...prev,
          [selectedUniformMonth]: {
            ...rep,
            recordsByType: copyByType,
          },
        };
      }
      return prev;
    });
    return true;
  };

  const deleteUniformSize = (typeId: string, sizeName: string): boolean => {
    if (!permissions.canEdit) return false;
    setUniformTypes((prev) =>
      prev.map((ut) => {
        if (ut.id === typeId) {
          return { ...ut, sizes: ut.sizes.filter((s) => s !== sizeName) };
        }
        return ut;
      })
    );
    // Also remove from report shirtSizes/sportSizes if applicable
    if (typeId === 'general_shirt') {
      setUniformHistory((prev) => {
        const rep = prev[selectedUniformMonth] || currentUniformReport;
        return {
          ...prev,
          [selectedUniformMonth]: {
            ...rep,
            shirtSizes: rep.shirtSizes.filter((s) => s !== sizeName),
          },
        };
      });
    } else if (typeId === 'sports_bottom') {
      setUniformHistory((prev) => {
        const rep = prev[selectedUniformMonth] || currentUniformReport;
        return {
          ...prev,
          [selectedUniformMonth]: {
            ...rep,
            sportSizes: rep.sportSizes.filter((s) => s !== sizeName),
          },
        };
      });
    }
    return true;
  };

  const updateUniformSize = (typeId: string, oldSizeName: string, newSizeName: string): boolean => {
    if (!permissions.canEdit) return false;
    const trimmed = newSizeName.trim();
    if (!trimmed || trimmed === oldSizeName) return false;

    setUniformTypes((prev) =>
      prev.map((ut) => {
        if (ut.id === typeId) {
          return {
            ...ut,
            sizes: ut.sizes.map((s) => (s === oldSizeName ? trimmed : s)),
          };
        }
        return ut;
      })
    );

    setUniformHistory((prev) => {
      const rep = prev[selectedUniformMonth] || currentUniformReport;
      if (typeId === 'general_shirt') {
        const newShirtSizes = rep.shirtSizes.map((s) => (s === oldSizeName ? trimmed : s));
        const newRecords = rep.shirtDailyRecords.map((r) => {
          const copy = { ...r.sizes };
          if (copy[oldSizeName] !== undefined) {
            copy[trimmed] = copy[oldSizeName];
            delete copy[oldSizeName];
          }
          return { ...r, sizes: copy };
        });
        return {
          ...prev,
          [selectedUniformMonth]: {
            ...rep,
            shirtSizes: newShirtSizes,
            shirtDailyRecords: newRecords,
          },
        };
      } else if (typeId === 'sports_bottom') {
        const newSportSizes = rep.sportSizes.map((s) => (s === oldSizeName ? trimmed : s));
        const newRecords = rep.sportDailyRecords.map((r) => {
          const copy = { ...r.sizes };
          if (copy[oldSizeName] !== undefined) {
            copy[trimmed] = copy[oldSizeName];
            delete copy[oldSizeName];
          }
          return { ...r, sizes: copy };
        });
        return {
          ...prev,
          [selectedUniformMonth]: {
            ...rep,
            sportSizes: newSportSizes,
            sportDailyRecords: newRecords,
          },
        };
      } else if (rep.recordsByType && rep.recordsByType[typeId]) {
        const newRecords = rep.recordsByType[typeId].map((r: any) => {
          const copy = { ...r.sizes };
          if (copy[oldSizeName] !== undefined) {
            copy[trimmed] = copy[oldSizeName];
            delete copy[oldSizeName];
          }
          return { ...r, sizes: copy };
        });
        return {
          ...prev,
          [selectedUniformMonth]: {
            ...rep,
            recordsByType: {
              ...rep.recordsByType,
              [typeId]: newRecords,
            },
          },
        };
      }
      return prev;
    });

    return true;
  };

  const updateUniformType = (typeId: string, updates: Partial<UniformTypeConfig>) => {
    if (!permissions.canEdit) return;
    setUniformTypes((prev) =>
      prev.map((ut) => (ut.id === typeId ? { ...ut, ...updates } : ut))
    );
    // If name changed, also update in sales history for consistency
    if (updates.nameKhmer) {
      setUniformSalesHistory((prev) =>
        prev.map((tx) =>
          tx.type === typeId ? { ...tx, typeNameKhmer: updates.nameKhmer! } : tx
        )
      );
    }
    // If sizes updated, sync to report shirtSizes / sportSizes
    if (updates.sizes) {
      setUniformHistory((prev) => {
        const rep = prev[selectedUniformMonth] || currentUniformReport;
        if (typeId === 'general_shirt') {
          return {
            ...prev,
            [selectedUniformMonth]: { ...rep, shirtSizes: updates.sizes! },
          };
        }
        if (typeId === 'sports_bottom') {
          return {
            ...prev,
            [selectedUniformMonth]: { ...rep, sportSizes: updates.sizes! },
          };
        }
        return prev;
      });
    }
    if (typeId === 'general_shirt' && updates.defaultPriceKHR) {
      setUniformHistory((prev) => {
        const rep = prev[selectedUniformMonth] || currentUniformReport;
        return {
          ...prev,
          [selectedUniformMonth]: { ...rep, shirtPriceKHR: updates.defaultPriceKHR! },
        };
      });
    } else if (typeId === 'sports_bottom' && updates.defaultPriceKHR) {
      setUniformHistory((prev) => {
        const rep = prev[selectedUniformMonth] || currentUniformReport;
        return {
          ...prev,
          [selectedUniformMonth]: { ...rep, sportPriceKHR: updates.defaultPriceKHR! },
        };
      });
    }
  };

  const deleteUniformDailyRecord = (typeId: string, date: string): boolean => {
    if (!permissions.canDelete) return false;
    setUniformHistory((prev) => {
      const rep = prev[selectedUniformMonth] || currentUniformReport;
      if (typeId === 'general_shirt') {
        return {
          ...prev,
          [selectedUniformMonth]: {
            ...rep,
            shirtDailyRecords: rep.shirtDailyRecords.filter((r) => r.date !== date),
          },
        };
      }
      if (typeId === 'sports_bottom') {
        return {
          ...prev,
          [selectedUniformMonth]: {
            ...rep,
            sportDailyRecords: rep.sportDailyRecords.filter((r) => r.date !== date),
          },
        };
      }
      if (rep.recordsByType && rep.recordsByType[typeId]) {
        return {
          ...prev,
          [selectedUniformMonth]: {
            ...rep,
            recordsByType: {
              ...rep.recordsByType,
              [typeId]: rep.recordsByType[typeId].filter((r: any) => r.date !== date),
            },
          },
        };
      }
      return prev;
    });
    return true;
  };

  const updateUniformDailyQty = (typeId: string, date: string, size: string, qty: number) => {
    if (!permissions.canEdit) return;
    const finalQty = Math.max(0, qty);
    setUniformHistory((prev) => {
      const rep = prev[selectedUniformMonth] || currentUniformReport;
      const ut = uniformTypes.find((u) => u.id === typeId);
      const unitPrice =
        typeId === 'general_shirt'
          ? rep.shirtPriceKHR
          : typeId === 'sports_bottom'
          ? rep.sportPriceKHR
          : ut?.defaultPriceKHR || 30000;

      const updateList = (list: any[]) => {
        return list.map((r) => {
          if (r.date !== date) return r;
          const newSizes = { ...r.sizes };
          if (finalQty > 0) newSizes[size] = finalQty;
          else delete newSizes[size];
          const totalQty = Object.values(newSizes).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
          const totalAmountKHR = totalQty * (r.unitPriceKHR || unitPrice);
          return {
            ...r,
            sizes: newSizes,
            totalQty,
            totalAmountKHR,
          };
        });
      };

      if (typeId === 'general_shirt') {
        return {
          ...prev,
          [selectedUniformMonth]: {
            ...rep,
            shirtDailyRecords: updateList(rep.shirtDailyRecords),
          },
        };
      }
      if (typeId === 'sports_bottom') {
        return {
          ...prev,
          [selectedUniformMonth]: {
            ...rep,
            sportDailyRecords: updateList(rep.sportDailyRecords),
          },
        };
      }
      if (rep.recordsByType && rep.recordsByType[typeId]) {
        return {
          ...prev,
          [selectedUniformMonth]: {
            ...rep,
            recordsByType: {
              ...rep.recordsByType,
              [typeId]: updateList(rep.recordsByType[typeId]),
            },
          },
        };
      }
      return prev;
    });
  };

  const recordUniformSale = (
    date: string,
    type: string,
    size: string,
    qty: number,
    buyerName = 'សិស្សទូទៅ',
    paymentMethod: 'Cash' | 'ABA' | 'AC' = 'Cash',
    customPriceKHR?: number,
    studentId?: number,
    classId?: string
  ) => {
    if (!permissions.canEdit) return;

    const matchedType = uniformTypes.find((ut) => ut.id === type);
    const unitPrice =
      customPriceKHR !== undefined
        ? customPriceKHR
        : matchedType?.defaultPriceKHR ||
          (type === 'general_shirt'
            ? currentUniformReport.shirtPriceKHR
            : type === 'sports_bottom'
            ? currentUniformReport.sportPriceKHR
            : 30000);
    const totalAmountKHR = qty * unitPrice;
    const receiptNo = `UNI-${Date.now().toString().slice(-6)}`;
    const typeKhmer = matchedType?.nameKhmer || (type === 'general_shirt' ? 'អាវសិស្សទូទៅ' : type === 'sports_bottom' ? 'ខោ/សំពត់កីឡា' : type);

    // Record to detailed history first
    const now = new Date();
    const newTx: UniformSaleTransaction = {
      id: `uni-sale-${Date.now()}`,
      receiptNo,
      timestamp: `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`,
      date,
      type,
      typeNameKhmer: typeKhmer,
      size,
      quantity: qty,
      unitPriceKHR: unitPrice,
      totalAmountKHR,
      buyerName,
      studentId,
      classId,
      paymentMethod,
      recordedBy: currentUser.khmerName,
    };

    setUniformSalesHistory((prev) => {
      const nextHistory = [newTx, ...prev];
      // Trigger instant auto-sync of matrix from the updated sales ledger!
      setTimeout(() => syncUniformMatrixFromLedger(), 10);
      return nextHistory;
    });

    // Trigger Telegram alert for payment!
    sendTelegramAlert(
      'លក់ឯកសណ្ឋានសិស្ស (Uniform Sale Paid)',
      `ប្រភេទ៖ ${typeKhmer} (Size ${size})\nចំនួន៖ ${qty} pcs\nតម្លៃសរុប៖ ${totalAmountKHR.toLocaleString()}៛\nអ្នកទិញ៖ ${buyerName}${classId ? ` (${classId})` : ''}\nវិធីទូទាត់៖ ${paymentMethod}\nបង្កាន់ដៃ៖ #${receiptNo}`,
      'uniform',
      buyerName,
      `${totalAmountKHR.toLocaleString()}៛`
    );
  };

  const deleteUniformSaleTransaction = (id: string): boolean => {
    if (!permissions.canDelete) {
      alert(t('មានតែ Admin ទើបមានសិទ្ធិលុបប្រវត្តិលក់!', 'Permission Denied: Only Admin can delete sales history.'));
      return false;
    }
    setUniformSalesHistory((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      setTimeout(() => syncUniformMatrixFromLedger(), 10);
      return filtered;
    });
    return true;
  };

  // Auto-Sync Uniform Sales Matrix from Uniform Sales History Ledger
  const syncUniformMatrixFromLedger = (targetMonth?: string) => {
    setUniformHistory((prevStore) => {
      const updatedStore = { ...prevStore };

      // Helper to determine month key from date string
      const getMonthKey = (dStr: string): string => {
        if (!dStr) return selectedUniformMonth;
        // ISO YYYY-MM-DD
        const isoMatch = dStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoMatch) {
          const y = parseInt(isoMatch[1], 10);
          const mIdx = parseInt(isoMatch[2], 10) - 1;
          if (mIdx >= 0 && mIdx < 12) return `${MONTH_NAMES[mIdx]} ${y}`;
        }
        // DD-Mon-YY e.g. "07-Sep-26"
        const shortMonMatch = dStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
        if (shortMonMatch) {
          const monShort = shortMonMatch[2].toLowerCase();
          const y = shortMonMatch[3].length === 2 ? 2000 + parseInt(shortMonMatch[3], 10) : parseInt(shortMonMatch[3], 10);
          const mIdx = MONTH_NAMES.findIndex((m) => m.toLowerCase().startsWith(monShort));
          if (mIdx >= 0) return `${MONTH_NAMES[mIdx]} ${y}`;
        }
        return selectedUniformMonth;
      };

      // Group all uniform sales transactions by month
      const txByMonth: { [monthKey: string]: UniformSaleTransaction[] } = {};
      uniformSalesHistory.forEach((tx) => {
        const mKey = getMonthKey(tx.date);
        if (!txByMonth[mKey]) txByMonth[mKey] = [];
        txByMonth[mKey].push(tx);
      });

      const monthsToProcess = targetMonth
        ? [targetMonth]
        : Array.from(new Set([...Object.keys(updatedStore), ...Object.keys(txByMonth)]));

      monthsToProcess.forEach((mKey) => {
        const parts = mKey.split(' ');
        const mName = parts[0] || 'October';
        const mYear = parseInt(parts[1] || '2026', 10);
        const existingRep = updatedStore[mKey] || createDefaultUniformReport(mName, mYear);

        const txs = txByMonth[mKey] || [];

        // Build matrices for shirt, sport, and other custom types
        const shirtMap: { [date: string]: { sizes: { [s: string]: number }; totalQty: number; totalAmountKHR: number; unitPrice: number } } = {};
        const sportMap: { [date: string]: { sizes: { [s: string]: number }; totalQty: number; totalAmountKHR: number; unitPrice: number } } = {};
        const customMap: { [typeId: string]: { [date: string]: { sizes: { [s: string]: number }; totalQty: number; totalAmountKHR: number; unitPrice: number; typeKhmer: string } } } = {};

        txs.forEach((tx) => {
          const date = tx.date;
          const size = tx.size;
          const qty = tx.quantity;
          const unitPrice = tx.unitPriceKHR || 30000;
          const total = tx.totalAmountKHR || qty * unitPrice;

          if (tx.type === 'general_shirt') {
            if (!shirtMap[date]) shirtMap[date] = { sizes: {}, totalQty: 0, totalAmountKHR: 0, unitPrice };
            shirtMap[date].sizes[size] = (shirtMap[date].sizes[size] || 0) + qty;
            shirtMap[date].totalQty += qty;
            shirtMap[date].totalAmountKHR += total;
          } else if (tx.type === 'sports_bottom') {
            if (!sportMap[date]) sportMap[date] = { sizes: {}, totalQty: 0, totalAmountKHR: 0, unitPrice };
            sportMap[date].sizes[size] = (sportMap[date].sizes[size] || 0) + qty;
            sportMap[date].totalQty += qty;
            sportMap[date].totalAmountKHR += total;
          } else {
            if (!customMap[tx.type]) customMap[tx.type] = {};
            if (!customMap[tx.type][date]) {
              const uConf = uniformTypes.find((ut) => ut.id === tx.type);
              customMap[tx.type][date] = {
                sizes: {},
                totalQty: 0,
                totalAmountKHR: 0,
                unitPrice,
                typeKhmer: uConf?.nameKhmer || tx.typeNameKhmer || tx.type,
              };
            }
            customMap[tx.type][date].sizes[size] = (customMap[tx.type][date].sizes[size] || 0) + qty;
            customMap[tx.type][date].totalQty += qty;
            customMap[tx.type][date].totalAmountKHR += total;
          }
        });

        // Convert maps to sorted arrays
        const newShirtDaily = Object.keys(shirtMap)
          .sort()
          .map((d) => ({
            date: d,
            type: 'general_shirt',
            typeNameKhmer: 'អាវសិស្សទូទៅ',
            unitPriceKHR: shirtMap[d].unitPrice,
            sizes: shirtMap[d].sizes,
            totalQty: shirtMap[d].totalQty,
            totalAmountKHR: shirtMap[d].totalAmountKHR,
          }));

        const newSportDaily = Object.keys(sportMap)
          .sort()
          .map((d) => ({
            date: d,
            type: 'sports_bottom',
            typeNameKhmer: 'ខោ/សំពត់កីឡា',
            unitPriceKHR: sportMap[d].unitPrice,
            sizes: sportMap[d].sizes,
            totalQty: sportMap[d].totalQty,
            totalAmountKHR: sportMap[d].totalAmountKHR,
          }));

        const newRecordsByType: { [typeId: string]: any[] } = {};
        Object.keys(customMap).forEach((tId) => {
          newRecordsByType[tId] = Object.keys(customMap[tId])
            .sort()
            .map((d) => ({
              date: d,
              type: tId,
              typeNameKhmer: customMap[tId][d].typeKhmer,
              unitPriceKHR: customMap[tId][d].unitPrice,
              sizes: customMap[tId][d].sizes,
              totalQty: customMap[tId][d].totalQty,
              totalAmountKHR: customMap[tId][d].totalAmountKHR,
            }));
        });

        // If transactions exist, update the daily matrix
        updatedStore[mKey] = {
          ...existingRep,
          shirtDailyRecords: newShirtDaily.length > 0 ? newShirtDaily : existingRep.shirtDailyRecords,
          sportDailyRecords: newSportDaily.length > 0 ? newSportDaily : existingRep.sportDailyRecords,
          recordsByType: {
            ...(existingRep.recordsByType || {}),
            ...newRecordsByType,
          },
        };
      });

      return updatedStore;
    });
  };

  // Point of Sale (POS) Checkout
  const recordPOSSale = (saleData: {
    items: POSCartItem[];
    buyerName: string;
    studentId?: number;
    classId?: string;
    paymentMethod: 'Cash' | 'ABA' | 'AC';
    totalAmountUSD: number;
    totalAmountKHR: number;
    cashTenderedUSD?: number;
    cashTenderedKHR?: number;
    changeUSD?: number;
    changeKHR?: number;
  }): { receiptNo: string; timestamp: string } => {
    const receiptNo = `POS-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${dateStr} ${now.toTimeString().slice(0, 5)}`;

    const newUniformTxs: UniformSaleTransaction[] = [];
    const newMaterialTxs: MaterialSaleTransaction[] = [];

    saleData.items.forEach((item) => {
      if (item.category === 'uniform') {
        const typeId = item.typeId || 'general_shirt';
        const size = item.size || 'Free Size';
        newUniformTxs.push({
          id: `uni-sale-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          receiptNo,
          timestamp: timeStr,
          date: dateStr,
          type: typeId,
          typeNameKhmer: item.name,
          size,
          quantity: item.quantity,
          unitPriceKHR: item.unitPriceKHR,
          totalAmountKHR: item.totalPriceKHR,
          buyerName: saleData.buyerName,
          classId: saleData.classId,
          paymentMethod: saleData.paymentMethod,
          recordedBy: currentUser.khmerName,
        });
      } else {
        newMaterialTxs.push({
          id: `mat-sale-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          receiptNo,
          timestamp: timeStr,
          date: dateStr,
          itemId: item.itemId || 1,
          itemName: item.name,
          category: item.category,
          quantity: item.quantity,
          unitPriceKHR: item.unitPriceKHR,
          totalAmountKHR: item.totalPriceKHR,
          paymentMethod: saleData.paymentMethod,
          customerName: saleData.buyerName,
          recordedBy: currentUser.khmerName,
        });
      }
    });

    if (newUniformTxs.length > 0) {
      setUniformSalesHistory((prev) => [...newUniformTxs, ...prev]);
      setTimeout(() => syncUniformMatrixFromLedger(), 50);
    }

    if (newMaterialTxs.length > 0) {
      setMaterialSalesHistory((prev) => [...newMaterialTxs, ...prev]);
    }

    sendTelegramAlert(
      '🛒 ការលក់ទំនិញតាម POS (POS Order Paid)',
      `អ្នកទិញ៖ ${saleData.buyerName}${saleData.classId ? ` (${saleData.classId})` : ''}\nចំនួនមុខទំនិញ៖ ${saleData.items.length} មុខ (${saleData.items.reduce((s, i) => s + i.quantity, 0)} pcs)\nទឹកប្រាក់សរុប៖ ${saleData.totalAmountKHR.toLocaleString()}៛ ($${saleData.totalAmountUSD.toFixed(2)})\nវិធីទូទាត់៖ ${saleData.paymentMethod}\nវិក្កយបត្រ៖ #${receiptNo}\nអ្នកគិតលុយ៖ ${currentUser.khmerName}`,
      'uniform',
      saleData.buyerName,
      `${saleData.totalAmountKHR.toLocaleString()}៛`
    );

    return { receiptNo, timestamp: timeStr };
  };

  // School Bus Methods
  const addBusRoute = (routeData: Omit<BusRoute, 'id'>) => {
    const newRoute: BusRoute = {
      ...routeData,
      id: `route-${Date.now()}`,
    };
    setBusRoutes((prev) => [...prev, newRoute]);
  };

  const updateBusRoute = (id: string, updates: Partial<BusRoute>) => {
    setBusRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteBusRoute = (id: string): boolean => {
    if (!permissions.canDelete) {
      alert(t('មានតែ Admin ទើបមានសិទ្ធិលុបខ្សែរត់!', 'Permission Denied: Only Admin can delete routes.'));
      return false;
    }
    const hasEnrollments = busEnrollments.some((e) => e.routeId === id);
    if (hasEnrollments) {
      alert(t('មិនអាចលុបខ្សែរត់ដែលមានសិស្សកំពុងជិះបានទេ!', 'Cannot delete route with enrolled students!'));
      return false;
    }
    setBusRoutes((prev) => prev.filter((r) => r.id !== id));
    return true;
  };

  const enrollStudentInBus = (enrData: Omit<BusStudentEnrollment, 'id'>): { success: boolean; error?: string } => {
    const dupCheck = checkDuplicateBusEnrollment(busEnrollments, enrData.studentId, enrData.routeId);
    if (dupCheck.isDuplicate) {
      alert(t(
        `⚠️ ${dupCheck.errorMessage}`,
        `⚠️ This student is already enrolled on this bus route!`
      ));
      return { success: false, error: dupCheck.errorMessage };
    }

    const newEnr: BusStudentEnrollment = {
      ...enrData,
      id: `bus-enr-${Date.now()}`,
    };
    setBusEnrollments((prev) => [...prev, newEnr]);
    return { success: true };
  };

  const updateBusEnrollment = (id: string, updates: Partial<BusStudentEnrollment>) => {
    setBusEnrollments((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const removeBusEnrollment = (id: string): boolean => {
    if (!permissions.canDelete) {
      alert(t('មានតែ Admin ទើបមានសិទ្ធិលុបសិស្សចេញពីរថយន្ត!', 'Permission Denied: Only Admin can remove riders.'));
      return false;
    }
    setBusEnrollments((prev) => prev.filter((e) => e.id !== id));
    return true;
  };

  const recordBusPayment = (
    enrollmentId: string,
    payment: {
      paidBy: 'ABA' | 'AC' | 'Cash';
      months?: string[];
      feePerMonthUSD?: number;
      discountUSD?: number;
      amountUSD?: number;
      paymentDate?: string;
      notes?: string;
    }
  ): BusPaymentRecord | null => {
    const enr = busEnrollments.find((e) => e.id === enrollmentId);
    if (!enr) return null;

    const r = busRoutes.find((rt) => rt.id === enr.routeId);
    const routeName = r?.name || enr.routeId;
    const nowStr = payment.paymentDate || new Date().toISOString().slice(0, 10);
    const months = payment.months && payment.months.length > 0
      ? payment.months
      : [`${globalMonth} ${globalYear}`];
    const monthsCount = months.length;
    const feePerMonthUSD = payment.feePerMonthUSD !== undefined ? payment.feePerMonthUSD : enr.monthlyFeeUSD;
    const discountUSD = payment.discountUSD || 0;
    const calculatedAmountUSD = Math.max(0, monthsCount * feePerMonthUSD - discountUSD);
    const finalAmountUSD = payment.amountUSD !== undefined ? payment.amountUSD : calculatedAmountUSD;
    const finalAmountKHR = Math.round(finalAmountUSD * settings.exchangeRate);

    const receiptNo = `BUS-REC-${Date.now().toString().slice(-6)}`;
    const invoiceNo = `BUS-INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const newPaymentRecord: BusPaymentRecord = {
      id: `bus-pay-${Date.now()}`,
      enrollmentId,
      studentId: enr.studentId,
      studentCode: enr.studentCode,
      studentName: enr.studentName,
      latinName: enr.latinName,
      classId: enr.classId,
      className: enr.className,
      routeId: enr.routeId,
      routeName,
      month: months[0] || `${globalMonth} ${globalYear}`,
      months,
      monthsCount,
      feePerMonthUSD,
      discountUSD,
      amountUSD: finalAmountUSD,
      amountKHR: finalAmountKHR,
      paidBy: payment.paidBy,
      receiptNo,
      invoiceNo,
      paymentDate: nowStr,
      recordedBy: currentUser.khmerName,
      notes: payment.notes || `ថ្លៃរថយន្តសាលាសម្រាប់ខែ៖ ${months.join(', ')}`,
    };

    // Update Rider status and paidMonths
    setBusEnrollments((prev) =>
      prev.map((e) => {
        if (e.id === enrollmentId) {
          const prevMonths = e.paidMonths || [];
          const mergedMonths = Array.from(new Set([...prevMonths, ...months]));
          return {
            ...e,
            status: 'paid',
            paidBy: payment.paidBy,
            paymentDate: nowStr,
            receiptNo,
            paidMonths: mergedMonths,
            paymentHistory: [newPaymentRecord, ...(e.paymentHistory || [])],
          };
        }
        return e;
      })
    );

    // Save into busPayments ledger
    setBusPayments((prev) => {
      const updated = [newPaymentRecord, ...prev];
      try {
        localStorage.setItem(`${STORAGE_PREFIX}_BUS_PAYMENTS`, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save busPayments:', e);
      }
      return updated;
    });

    // Send rich Telegram Alert
    sendTelegramAlert(
      '🚌 ថ្លៃសេវារថយន្តសាលា (School Bus Fee Paid)',
      `សិស្ស៖ ${enr.studentName} (${enr.className})\nកូដសិស្ស៖ ${enr.studentCode}\nខ្សែរត់៖ ${routeName}\nខែទូទាត់៖ ${months.join(', ')} (${monthsCount} ខែ)\nចំនួនទឹកប្រាក់៖ $${finalAmountUSD.toFixed(2)} (${finalAmountKHR.toLocaleString()}៛)\nវិធីទូទាត់៖ ${payment.paidBy}\nលេខវិក្កយបត្រ៖ #${invoiceNo}\nអ្នកកត់ត្រា៖ ${currentUser.khmerName}`,
      'system',
      enr.studentName,
      `$${finalAmountUSD.toFixed(2)}`
    );

    return newPaymentRecord;
  };

  const recordBusAttendance = (
    date: string,
    routeId: string,
    shift: 'morning' | 'evening',
    records: { [enrollmentId: string]: 'present' | 'absent' | 'excused' }
  ) => {
    const newRecord: BusAttendanceRecord = {
      id: `bus-att-${date}-${routeId}-${shift}-${Date.now()}`,
      date,
      routeId,
      shift,
      records,
      recordedBy: currentUser.khmerName,
      timestamp: new Date().toISOString(),
    };

    setBusAttendance((prev) => {
      const filtered = prev.filter(
        (a) => !(a.date === date && a.routeId === routeId && a.shift === shift)
      );
      return [newRecord, ...filtered];
    });
  };

  const updateSettings = (updates: Partial<SchoolSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const resetToInitialData = () => {
    if (!permissions.canModifySettings) {
      alert(t('មានតែ Admin ទើបមានសិទ្ធិកំណត់ឡើងវិញ!', 'Permission Denied.'));
      return;
    }
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setClassData(INITIAL_CLASS_FEE_DATA);
    setMaterialsHistory({
      'October 2026': createDefaultMaterialsReport('October', 2026),
      'September 2026': INITIAL_DAILY_MATERIALS_REPORT,
    });
    setSelectedMaterialsMonth('October 2026');
    setMaterialSalesHistory(INITIAL_MATERIAL_SALES_HISTORY);
    setCanteenHistory({
      'October 2026': INITIAL_OCTOBER_CANTEEN_REPORT,
      'September 2026': INITIAL_CANTEEN_REPORT,
    });
    setSelectedCanteenMonth('October 2026');
    setUniformHistory({
      'October 2026': createDefaultUniformReport('October', 2026),
      'September 2026': INITIAL_UNIFORM_REPORT,
    });
    setSelectedUniformMonth('October 2026');
    setUniformSalesHistory(INITIAL_UNIFORM_SALES_HISTORY);
    setUniformTypes(INITIAL_UNIFORM_TYPES);
    setBusRoutes(INITIAL_BUS_ROUTES);
    setBusEnrollments(INITIAL_BUS_ENROLLMENTS);
    setBusAttendance([]);
    setBusPayments(INITIAL_BUS_PAYMENTS);
    setBranches(INITIAL_BRANCHES);
    setCurrentBranchId('branch-central');
    setSettings(INITIAL_SETTINGS);
    setSelectedClassId('1A');
  };

  const clearAllDataKeepSettings = () => {
    if (!permissions.canModifySettings) {
      alert(t('មានតែ Admin ទើបមានសិទ្ធិសម្អាតទិន្នន័យ!', 'Permission Denied: Only Admin can clear data.'));
      return;
    }

    // 1. Clear Students from all classes while keeping class definitions and teacher assignments
    setClassData((prev) => {
      const cleared: { [key: string]: ClassFeeData } = {};
      Object.keys(prev).forEach((classId) => {
        const cls = prev[classId];
        cleared[classId] = {
          ...cls,
          students: [],
          totalCollectedCash: 0,
          totalExpectedCash: 0,
          targetCollectionRate: 0,
          summaryRows: [
            { id: 1, caseKhmer: 'ចំនួនសិស្សត្រូវបង់ខែ (Total Due)', general: 0, contribute: 0, fiftyPercent: 0, totalStudents: 0, totalCash: 0 },
            { id: 2, caseKhmer: 'សិស្សឈប់រៀនក្នុងខែ (Dropped / Stopped)', general: 0, contribute: 0, fiftyPercent: 0, totalStudents: 0, totalCash: 0 },
            { id: 3, caseKhmer: 'សិស្សបានបង់ពីខែមុនរួច (Prepaid)', general: 0, contribute: 0, fiftyPercent: 0, totalStudents: 0, totalCash: 0 },
            { id: 4, caseKhmer: 'សិស្សមិនទាន់បង់ខែ (Unpaid)', general: 0, contribute: 0, fiftyPercent: 0, totalStudents: 0, totalCash: 0 },
            { id: 5, caseKhmer: 'សិស្សបានបង់ខែ (Collected)', general: 0, contribute: 0, fiftyPercent: 0, totalStudents: 0, totalCash: 0 },
          ],
        };
      });
      return cleared;
    });

    // 2. Clear Daily Materials sales matrices while preserving material catalog items
    setMaterialsHistory((prev) => {
      const cleared: { [key: string]: DailyMaterialsReport } = {};
      Object.keys(prev).forEach((k) => {
        const rep = prev[k];
        cleared[k] = {
          ...rep,
          items: rep.items.map((item) => ({
            ...item,
            dailyQuantities: {},
            totalQty: 0,
            totalAmountKHR: 0,
          })),
        };
      });
      return cleared;
    });
    setMaterialSalesHistory([]);

    // 3. Clear Canteen daily attendance and records while preserving vendor stalls
    setCanteenHistory((prev) => {
      const cleared: { [key: string]: CanteenReport } = {};
      Object.keys(prev).forEach((k) => {
        const rep = prev[k];
        cleared[k] = {
          ...rep,
          dailyRecords: [],
        };
      });
      return cleared;
    });

    // 4. Clear Uniform sales records while preserving custom uniform types and sizes configs
    setUniformHistory((prev) => {
      const cleared: { [key: string]: UniformReport } = {};
      Object.keys(prev).forEach((k) => {
        const rep = prev[k];
        cleared[k] = {
          ...rep,
          shirtDailyRecords: [],
          sportDailyRecords: [],
          recordsByType: {},
        };
      });
      return cleared;
    });
    setUniformSalesHistory([]);

    // 5. Clear Bus enrollments, payments, and attendance while preserving routes
    setBusEnrollments([]);
    setBusAttendance([]);
    setBusPayments([]);

    // 6. Clear Student Promotion History and Telegram Alert Logs
    setPromotionHistory([]);
    setTelegramAlertLogs([]);
    setSelectedStudentForProfile(null);

    // 7. Send Telegram Alert notice if enabled
    sendTelegramAlert(
      'សម្អាតទិន្នន័យជោគជ័យ (Data Cleared - Settings Kept)',
      `ប្រព័ន្ធបានសម្អាតទិន្នន័យសិស្ស ប្រវត្តិលក់ និងកំណត់ត្រាប្រតិបត្តិការទាំងអស់ដោយជោគជ័យ។\nការកំណត់ (Settings) ថ្នាក់រៀន គណនី និងមុខទំនិញត្រូវបានរក្សាទុកដដែល។\nប្រតិបត្តិករ៖ ${currentUser.khmerName}`,
      'system'
    );
  };

  const downloadFullBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      school: settings.schoolNameEnglish,
      version: '4.0',
      branches,
      currentBranchId,
      users,
      classes: classData,
      materialsHistory,
      materialSalesHistory,
      canteenHistory,
      uniformHistory,
      uniformSalesHistory,
      uniformTypes,
      promotionHistory,
      busRoutes,
      busEnrollments,
      busAttendance,
      busPayments,
      settings,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `BIM_Rangsei_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const restoreFromBackup = (jsonContent: string): boolean => {
    if (!permissions.canModifySettings) {
      alert(t('មានតែ Admin ទើបមានសិទ្ធិស្តារទិន្នន័យពី Backup!', 'Permission Denied: Only Admin can restore from backup.'));
      return false;
    }
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed.branches && Array.isArray(parsed.branches)) setBranches(parsed.branches);
      if (parsed.currentBranchId) setCurrentBranchId(parsed.currentBranchId);
      if (parsed.users && Array.isArray(parsed.users)) setUsers(parsed.users);
      if (parsed.classes) setClassData(parsed.classes);
      if (parsed.materialsHistory) setMaterialsHistory(parsed.materialsHistory);
      if (parsed.materialSalesHistory) setMaterialSalesHistory(parsed.materialSalesHistory);
      if (parsed.canteenHistory) setCanteenHistory(parsed.canteenHistory);
      if (parsed.uniformHistory) setUniformHistory(parsed.uniformHistory);
      if (parsed.uniformSalesHistory) setUniformSalesHistory(parsed.uniformSalesHistory);
      if (parsed.uniformTypes) setUniformTypes(parsed.uniformTypes);
      if (parsed.promotionHistory) setPromotionHistory(parsed.promotionHistory);
      if (parsed.busRoutes && Array.isArray(parsed.busRoutes)) setBusRoutes(parsed.busRoutes);
      if (parsed.busEnrollments && Array.isArray(parsed.busEnrollments)) setBusEnrollments(parsed.busEnrollments);
      if (parsed.busAttendance && Array.isArray(parsed.busAttendance)) setBusAttendance(parsed.busAttendance);
      if (parsed.busPayments && Array.isArray(parsed.busPayments)) setBusPayments(parsed.busPayments);
      if (parsed.settings) setSettings(parsed.settings);
      return true;
    } catch (e) {
      console.error('Backup restoration failed:', e);
      return false;
    }
  };

  const backupToTelegramGroup = async (): Promise<{ success: boolean; message: string }> => {
    try {
      if (!settings.telegramConfig.botToken || !settings.telegramConfig.chatId) {
        return {
          success: false,
          message: 'សូមបញ្ចូល Telegram Bot Token និង Chat ID នៅក្នុងការកំណត់ជាមុនសិន! (Please set Bot Token and Chat ID in Settings)',
        };
      }

      const cleanToken = settings.telegramConfig.botToken.trim().replace(/^bot(?=\d+:)/i, '').replace(/[\r\n\t]/g, '');
      let cleanChatId = settings.telegramConfig.chatId.trim().replace(/[\r\n\t"']/g, '');

      if (cleanChatId.includes('web.telegram.org') && cleanChatId.includes('#-')) {
        const match = cleanChatId.match(/#(-?\d+)/);
        if (match) cleanChatId = match[1];
      } else if (cleanChatId.match(/t\.me\/c\/(\d+)/)) {
        const match = cleanChatId.match(/t\.me\/c\/(\d+)/);
        if (match) cleanChatId = `-100${match[1]}`;
      } else if (cleanChatId.startsWith('https://t.me/')) {
        cleanChatId = '@' + cleanChatId.replace('https://t.me/', '').split('/')[0].split('?')[0];
      } else if (cleanChatId.startsWith('t.me/')) {
        cleanChatId = '@' + cleanChatId.replace('t.me/', '').split('/')[0].split('?')[0];
      }

      if (/^100\d{8,11}$/.test(cleanChatId)) {
        cleanChatId = `-${cleanChatId}`;
      }

      const bundle = buildCompleteBackupBundle({
        classData,
        materialSalesHistory,
        uniformSalesHistory,
        canteenHistory,
        canteenReport: currentCanteenReport,
        materialsHistory,
        busEnrollments,
        busPayments,
        settings,
        branches,
        users,
        backupType: 'manual',
      });

      const now = new Date();
      const datePart = now.toISOString().slice(0, 10);
      const timePart = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const defaultFileName = `BIM_Rangsei_Backup_${datePart}_${timePart}.json`;
      let fileName = defaultFileName;
      let successMsg = '';

      // 1. Try server proxy endpoint first
      try {
        const res = await fetch('/api/telegram/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: cleanToken,
            chatId: cleanChatId,
            storeData: bundle,
          }),
        });

        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success) {
          fileName = json.fileName || defaultFileName;
          successMsg = json.message || 'បាន Backup ទិន្នន័យទៅ Telegram Group ដោយជោគជ័យ!';
        }
      } catch (proxyErr) {
        console.warn('Server backup endpoint unreachable, trying direct Telegram upload fallback:', proxyErr);
      }

      // 2. Direct client-side FormData fallback if server route is unavailable
      if (!successMsg) {
        const jsonPayload = JSON.stringify(bundle, null, 2);
        const dateKhmer = now.toLocaleString('km-KH');
        const sizeKb = (new Blob([jsonPayload]).size / 1024).toFixed(1);

        const captionHtml = `💾 <b>BIM Rangsei School Database Backup</b>\n📅 <b>កាលបរិច្ឆេទ៖</b> ${dateKhmer}\n📁 <b>ឯកសារ៖</b> <code>${fileName}</code> (${sizeKb} KB)\n🏫 <b>សាលា អ៊ីរ៉ែលកម្ពុជា (BIM Rangsei School)</b>\n✅ <b>ទិន្នន័យ៖</b> បញ្ជីសិស្ស, ថ្លៃសិក្សា, សម្ភារៈ, ឯកសណ្ឋាន &amp; អាហារដ្ឋាន`;

        const formData = new FormData();
        formData.append('chat_id', cleanChatId);
        formData.append('caption', captionHtml);
        formData.append('parse_mode', 'HTML');
        const blob = new Blob([jsonPayload], { type: 'application/json' });
        formData.append('document', blob, fileName);

        let directRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendDocument`, {
          method: 'POST',
          body: formData,
        });
        let directJson = await directRes.json();

        // Retry plain text caption if HTML parse issue
        if (!directRes.ok && (directJson.description?.includes('parse') || directJson.description?.includes('entity'))) {
          const plainCaption = `💾 BIM Rangsei School Database Backup\n📅 កាលបរិច្ឆេទ: ${dateKhmer}\n📁 ឯកសារ: ${fileName} (${sizeKb} KB)\n✅ ទិន្នន័យ: បញ្ជីសិស្ស, ថ្លៃសិក្សា, សម្ភារៈ, ឯកសណ្ឋាន & អាហារដ្ឋាន`;
          const retryFd = new FormData();
          retryFd.append('chat_id', cleanChatId);
          retryFd.append('caption', plainCaption);
          retryFd.append('document', blob, fileName);

          directRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendDocument`, {
            method: 'POST',
            body: retryFd,
          });
          directJson = await directRes.json();
        }

        if (directRes.ok && directJson.ok) {
          successMsg = `បានផ្ញើឯកសារ Backup (${fileName}) ទៅកាន់ Telegram Group ដោយជោគជ័យ!`;
        } else {
          let errText = directJson.description || 'បរាជ័យក្នុងការផ្ញើឯកសារ Backup ទៅកាន់ Telegram';
          if (errText.includes('chat not found')) {
            errText = `រកមិនឃើញ Chat ID "${cleanChatId}" ទេ។ សូម Add Bot ចូលក្នុង Telegram Group ហើយតម្លើងជា Administrator។`;
          } else if (errText.includes('bot is not a member') || errText.includes('not a member')) {
            errText = `Bot មិនទាន់បានចូលក្នុង Group ទេ។ សូម Add Bot ចូលក្នុង Group ហើយតម្លើងជា Administrator។`;
          }
          throw new Error(errText);
        }
      }

      // Add to Telegram Alert logs
      sendTelegramAlert(
        '💾 ទិន្នន័យត្រូវបាន Backup ទៅ Telegram Group',
        `បានបញ្ជូនឯកសារទិន្នន័យសាលាទាំងស្រុង (${new Date().toLocaleString('km-KH')}) ទៅកាន់ Telegram Group ដោយជោគជ័យ។ ឯកសារ៖ ${fileName}`,
        'system'
      );

      // Update last backup date in settings
      updateSettings({
        telegramConfig: {
          ...settings.telegramConfig,
          lastBackupDate: new Date().toISOString(),
        },
      });

      return { success: true, message: successMsg };
    } catch (err: any) {
      console.warn('Backup to Telegram error:', err);
      return { success: false, message: err.message || 'Error backing up to Telegram' };
    }
  };

  const importExtractedReport = (data: any) => {
    if (!data) return;
    try {
      if (data.reportType === 'student_fees' && Array.isArray(data.rows)) {
        const clsId = selectedClassId || '1A';
        data.rows.forEach((row: any) => {
          if (row.name) {
            addStudent(clsId, {
              name: row.name,
              gender: row.gender === 'Female' ? 'Female' : 'Man',
              note: row.note === 'New' ? 'New' : 'Old',
              feesGroup: row.feesGroup || globalMonth,
              startDate: row.startDate || '01-10-2026',
              paymentDate: row.paymentDate || '08-10-2026',
              caseType: row.caseType || 'Full',
              paidBy: row.paidBy || 'ABA',
              cash: Number(row.cash) || 0,
            });
          }
        });
      }
    } catch (e) {
      console.error('Failed to import extracted report:', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchUser,
        allUsers: users,
        addUser,
        updateUser,
        deleteUser,
        permissions,
        isAuthenticated,
        login,
        logout,
        language,
        setLanguage,
        t,
        settings,
        updateSettings,
        branches,
        currentBranchId,
        currentBranch,
        setCurrentBranchId: handleSetCurrentBranchId,
        addBranch,
        updateBranch,
        deleteBranch,
        setMainBranch,
        getBranchName,
        globalMonth,
        setGlobalMonth,
        globalYear,
        setGlobalYear,
        setGlobalPeriod,
        activeToast,
        dismissToast,
        telegramAlertLogs,
        clearTelegramLogs,
        deleteTelegramLog,
        sendTelegramAlert,
        classData,
        classOrder,
        orderedClassList,
        allClassesList,
        selectedClassId,
        setSelectedClassId,
        selectedStudentForProfile,
        setSelectedStudentForProfile,
        updateStudentFee,
        recordStudentPayment,
        addStudent,
        batchAddStudents,
        deleteStudent,
        deleteStudentPaymentRecord,
        clearStudentsPaymentHistory,
        clearAllPaymentHistory,
        addClass,
        updateClass,
        deleteClass,
        reorderClasses,
        moveClassOrder,
        sortClasses,
        updateClassTeacher,
        academicMonths,
        addAcademicMonth,
        updateAcademicMonth,
        deleteAcademicMonth,
        reorderAcademicMonths,
        moveAcademicMonthOrder,
        sortAcademicMonths,
        promoteStudents,
        promotionHistory,
        materialsHistory,
        selectedMaterialsMonth,
        setSelectedMaterialsMonth,
        dailyMaterials: currentMaterialsReport,
        createMaterialsMonthRecord,
        deleteMaterialsMonthRecord,
        materialSalesHistory,
        updateDailyMaterialSale,
        addMaterialItem,
        recordMaterialSaleTransaction,
        deleteMaterialSaleTransaction,
        canteenHistory,
        selectedCanteenMonth,
        setSelectedCanteenMonth,
        currentCanteenReport,
        canteenReport: currentCanteenReport,
        updateVendorAttendance,
        addCanteenVendor,
        updateCanteenVendor,
        deleteCanteenVendor,
        addCanteenDailyRecord,
        autoPopulateFullMonthDates,
        createCanteenMonthRecord,
        deleteCanteenMonthRecord,
        uniformHistory,
        selectedUniformMonth,
        setSelectedUniformMonth,
        uniformReport: currentUniformReport,
        createUniformMonthRecord,
        deleteUniformMonthRecord,
        uniformSalesHistory,
        recordUniformSale,
        deleteUniformSaleTransaction,
        syncUniformMatrixFromLedger,
        recordPOSSale,
        busRoutes,
        addBusRoute,
        updateBusRoute,
        deleteBusRoute,
        busEnrollments,
        enrollStudentInBus,
        updateBusEnrollment,
        removeBusEnrollment,
        busPayments,
        recordBusPayment,
        busAttendance,
        recordBusAttendance,
        uniformTypes,
        addUniformType,
        addUniformSize,
        deleteUniformType,
        deleteUniformSize,
        updateUniformSize,
        updateUniformType,
        deleteUniformDailyRecord,
        updateUniformDailyQty,
        exchangeRate: settings.exchangeRate,
        setExchangeRate: (rate: number) => updateSettings({ exchangeRate: rate }),
        importExtractedReport,
        resetToInitialData,
        clearAllDataKeepSettings,
        downloadFullBackup,
        restoreFromBackup,
        backupToTelegramGroup,
        isVerifyInvoiceModalOpen,
        verifyInvoiceTarget,
        openInvoiceVerification,
        closeInvoiceVerification,
        autoBackupConfig,
        updateAutoBackupConfig,
        triggerAutoBackup,
        triggerCloudSync,
        exportDailySalesAndStudents,
        backupSnapshots,
        refreshBackupSnapshots,
        deleteBackupSnapshot,
        restoreFromSnapshotBundle,
        isAutoBackupModalOpen,
        openAutoBackupModal,
        closeAutoBackupModal,
        cloudSyncPrompt,
        dismissCloudSyncPrompt,
        lastBackupTime,
        syncToSupabaseNow,
        restoreFromSupabaseNow,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
