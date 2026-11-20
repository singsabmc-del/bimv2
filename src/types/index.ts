export type Currency = 'USD' | 'KHR';
export type Language = 'km' | 'en';

export type UserRole = 'admin' | 'cashier' | 'accountant' | 'teacher' | 'student';

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  khmerName: string;
  role: UserRole;
  email: string;
  phone?: string; // can be used to log in (with the account's own password)
  password?: string;
  avatar?: string;
  studentId?: number;
  classId?: string;
  teacherId?: string; // links a Teacher account to its TeacherRecord (own check-in, own class)
  branchId?: string;
}

export interface RolePermissions {
  canEdit: boolean;
  canDelete: boolean;
  canCollectFee: boolean;
  canModifySettings: boolean;
  canViewAllClasses: boolean;
  canExportBackup: boolean;
}

export interface StudentFeePaymentItem {
  receiptNo: string;
  invoiceNo?: string;
  month: string;
  months?: string[];
  monthsCount?: number;
  feePerMonthUSD?: number;
  discountUSD?: number;
  date: string;
  amountUSD: number;
  amountKHR: number;
  paidBy: 'ABA' | 'AC' | 'Cash' | '$ -';
  recordedBy: string;
  status: 'paid' | 'pending' | 'prepaid' | 'waived';
  itemType?: 'tuition' | 'uniform' | 'stationery' | 'admission' | 'bus' | 'other';
  description?: string;
  note?: string;
}

export interface StudentHealthCondition {
  hasCondition: boolean;
  details?: string;
}

export interface StudentHealthData {
  malnutrition?: StudentHealthCondition;
  heartCondition?: StudentHealthCondition;
  asthma?: StudentHealthCondition;
  migraine?: StudentHealthCondition;
  diabetes?: StudentHealthCondition;
  dizziness?: StudentHealthCondition;
  behaviorConcerns?: StudentHealthCondition;
  learningConcerns?: StudentHealthCondition;
  hearingConcerns?: StudentHealthCondition;
  visionConcerns?: StudentHealthCondition;
  speechConcerns?: StudentHealthCondition;
  mobilityConcerns?: StudentHealthCondition;
  takesMedication?: boolean;
  medicationDetails?: string;
}

export interface ParentCaretakerInfo {
  name?: string;
  occupation?: string;
  phone?: string;
  photoUrl?: string;
}

export interface StudentAdmissionData {
  // I. Pupil Details
  nameKhmer?: string;
  nameEnglish?: string;
  gender?: 'Man' | 'Female';
  nationality?: string;
  dob?: string;
  religion?: string;
  studentIdCode?: string;
  placeOfBirth?: string;
  photoUrl?: string;

  // II. Grade Level
  previousGrade?: string;
  previousYear?: string;
  previousSchool?: string;
  presentGrade?: string;
  presentYear?: string;
  presentSchool?: string;
  studyDays?: string;
  studyHours?: string;

  // III. Health Section
  health?: StudentHealthData;

  // IV. Parents / Caretaker
  father?: ParentCaretakerInfo;
  mother?: ParentCaretakerInfo;
  caretaker?: ParentCaretakerInfo;
  emergencyContact?: {
    relationship?: string;
    occupation?: string;
    phone?: string;
  };
  forbiddenPickupPerson?: {
    hasForbiddenPerson: boolean;
    details?: string;
  };

  // V. Other Services
  services?: {
    breakfast?: boolean;
    lunch?: boolean;
    eveningFood?: boolean;
  };
  permanentAddress?: string;

  // VI. Declaration
  declarationAccepted?: boolean;
  parentSignDate?: string;
  formScannedUrl?: string;

  // Optional nested sections for compatibility
  pupil?: {
    nameKhmer?: string;
    nameEnglish?: string;
    gender?: 'Man' | 'Female';
    nationality?: string;
    dob?: string;
    religion?: string;
    studentId?: string;
    placeOfBirth?: string;
  };
  gradeLevel?: {
    previousGrade?: string;
    previousYear?: string;
    previousSchool?: string;
    presentGrade?: string;
    presentYear?: string;
    presentSchool?: string;
    studyDays?: string;
    studyHours?: string;
  };
  parents?: {
    father?: ParentCaretakerInfo;
    mother?: ParentCaretakerInfo;
    caretaker?: ParentCaretakerInfo;
    emergencyContact?: {
      relationship?: string;
      occupation?: string;
      phone?: string;
    };
    forbiddenPickupPerson?: {
      hasForbiddenPerson: boolean;
      details?: string;
    };
  };
}

export interface StudentFeeRecord {
  id: number;
  studentCode: string; // e.g. BIM-2026-001
  name: string;
  latinName?: string;
  gender: 'Man' | 'Female';
  note: 'Old' | 'New';
  feesGroup: 'October' | 'Unpaid' | 'Already' | 'Stopped' | string;
  startDate: string;
  paymentDate: string;
  caseType: 'Full' | 'Contribute' | '50%';
  paidBy: 'ABA' | 'AC' | 'Cash' | '$ -';
  cash: number; // in USD
  dob?: string;
  phone?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  photoUrl?: string;
  nationality?: string;
  religion?: string;
  placeOfBirth?: string;
  admissionData?: StudentAdmissionData;
  feeHistory?: StudentFeePaymentItem[];
  branchId?: string;
}

export interface StudentFeeSummaryRow {
  id: number;
  caseKhmer: string;
  general: number;
  contribute: number;
  fiftyPercent: number;
  totalStudents: number;
  totalCash: number; // in USD
}

export interface ClassFeeData {
  classId: string;
  className: string;
  period: string; // e.g. "01.10.2026 _ 31.10.2026"
  targetCollectionRate: number; // e.g. 41%
  students: StudentFeeRecord[];
  summaryRows: StudentFeeSummaryRow[];
  totalExpectedCash: number;
  totalCollectedCash: number;
  homeroomTeacher?: string;
  teacherPhone?: string;
  branchId?: string;
  // ── Academic (scores) — kept per class, so each academic year's archive keeps its own scores ──
  subjectIds?: string[]; // subjects taught/scored in this class (ids from SubjectItem)
  scores?: ClassScoreBook; // { periodKey: { studentId: { subjectId: score(0-100) } } }
  bookletNotes?: { [studentId: string]: StudentBookletNote };
}

// periodKey: "m-2026-10" (monthly exam, Oct 2026) | "sem-1" | "sem-2" (semester exams)
export interface ClassScoreBook {
  [periodKey: string]: { [studentId: string]: { [subjectId: string]: number | null } };
}

export interface StudentBookletNote {
  evalSem1?: string; // គ-វាយតម្លៃលើការសិក្សា ឆមាសទី១
  evalSem2?: string;
  evalYear?: string;
  promotedTo?: string; // ត្រូវបានឡើងថ្នាក់ទី
  retestSubjects?: string; // ត្រូវបានប្រឡងឡើងថ្នាក់ៈ មុខវិជ្ជា
  repeatGrade?: string; // ត្រូវរៀនត្រួតថ្នាក់ទី
  praise?: string; // ការសរសើរ
  improve?: string; // កែលម្អ
  directorComment?: string; // មតិរបស់នាយកសាលា
}

export interface PromotionRecord {
  id: string;
  studentId: number;
  studentCode: string;
  studentName: string;
  fromClassId: string;
  fromClassName: string;
  toClassId: string;
  toClassName: string;
  promotedDate: string; // YYYY-MM-DD
  academicYear?: string;
  promotedBy: string;
  feeGroupAssigned: string;
}

export interface AcademicYearArchive {
  academicYear: string;
  archivedDate: string; // ISO date
  archivedBy: string;
  totalStudents: number;
  totalClasses: number;
  classesData: { [classId: string]: ClassFeeData };
  classOrder?: string[];
  note?: string;
}

export interface ClassPromotionMapping {
  sourceClassId: string;
  sourceClassName: string;
  targetClassId: string;
  targetClassName: string;
  action: 'promote' | 'graduate' | 'retain' | 'custom';
  selectedStudentIds: number[];
  excludedStudentIds: number[];
  studentCount: number;
}

export interface BatchAnnualPromotionOptions {
  sourceAcademicYear: string;
  targetAcademicYear: string;
  mappings: ClassPromotionMapping[];
  keepOldYearArchived: boolean;
  defaultFeeMonth: string;
  advanceStudentAge: boolean;
  sendTelegramAlert?: boolean;
}

export interface BatchAnnualPromotionResult {
  success: boolean;
  sourceYear: string;
  targetYear: string;
  totalPromotedStudents: number;
  totalGraduatedStudents: number;
  totalRepeatingStudents?: number;
  classesCreatedCount: number;
  details: Array<{
    sourceClassName: string;
    targetClassName: string;
    action: string;
    studentCount: number;
  }>;
  error?: string;
}

export interface DailyMaterialItem {
  id: number;
  name: string;
  category: 'stationery' | 'books' | 'uniform_card' | 'textbooks';
  unitPriceKHR: number;
  dailyQuantities: { [day: number]: number }; // day 1 to 31
  totalQty: number;
  totalAmountKHR: number;
}

export interface MaterialSaleTransaction {
  id: string;
  receiptNo: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
  itemId: number;
  itemName: string;
  category: string;
  quantity: number;
  unitPriceKHR: number;
  totalAmountKHR: number;
  paymentMethod: 'Cash' | 'ABA' | 'AC';
  customerName?: string;
  studentId?: number;
  studentCode?: string;
  classId?: string;
  branchId?: string;
  recordedBy: string;
}

export interface DailyMaterialsReport {
  month: string; // "September"
  year: number; // 2026
  dateRange: string; // "31-08-2026 _ 30-09-2026"
  availableDays: number[];
  items: DailyMaterialItem[];
  approvedBy: string;
  preparedBy: string;
}

export interface CanteenVendor {
  id: string;
  name: string;
  stallName: string;
  dailyFeeKHR: number; // default 10000
  phone?: string;
  branchId?: string;
}

export interface CanteenAttendanceRecord {
  date: string; // "7-Sep-26"
  vendorStatus: {
    [vendorId: string]: {
      status: 'paid' | 'absent' | 'double_paid' | 'unpaid';
      amountKHR: number;
      note?: string;
    };
  };
  vendorCount: number;
  standardFeeKHR: number;
  dailyTotalKHR: number;
  otherNote?: string;
}

export interface CanteenReport {
  month: string; // "September"
  year: number; // 2026
  schoolName: string;
  vendors: CanteenVendor[];
  dailyRecords: CanteenAttendanceRecord[];
  approvedBy: string;
  preparedBy: string;
}

export interface UniformTypeConfig {
  id: string; // e.g. 'general_shirt', 'sports_bottom', 'custom_...'
  nameKhmer: string; // e.g. 'អាវសិស្សទូទៅ', 'ខោ/សំពត់កីឡា', 'ក្រវាត់ក', 'មួក'
  nameEnglish: string;
  defaultPriceKHR: number;
  sizes: string[]; // e.g. ['XXL', 'XL', 'L', 'M', 'S', '12', '10', '8', '6', '4']
  description?: string;
}

export interface UniformDailyRecord {
  date: string; // "31-Aug-26"
  type: string;
  typeNameKhmer?: string;
  unitPriceKHR?: number;
  sizes: {
    [sizeKey: string]: number;
  };
  totalQty: number;
  totalAmountKHR: number;
}

export interface UniformSaleTransaction {
  id: string;
  receiptNo: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
  type: string;
  typeNameKhmer?: string;
  size: string;
  quantity: number;
  unitPriceKHR: number;
  totalAmountKHR: number;
  buyerName: string;
  studentId?: number;
  studentCode?: string;
  classId?: string;
  paymentMethod: 'Cash' | 'ABA' | 'AC';
  recordedBy: string;
  branchId?: string;
}

export interface UniformReport {
  month: string; // "September"
  year: number; // 2026
  schoolName: string;
  shirtPriceKHR: number; // 30,000
  sportPriceKHR: number; // 30,000
  shirtSizes: string[];
  sportSizes: string[];
  shirtDailyRecords: UniformDailyRecord[];
  sportDailyRecords: UniformDailyRecord[];
  recordsByType?: { [typeId: string]: UniformDailyRecord[] };
  approvedBy: string;
  preparedBy: string;
}

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
  alertOnFeePayment: boolean;
  alertOnDailyCanteen: boolean;
  alertOnUniformSale: boolean;
  alertOnMaterialSale: boolean;
  autoBackupEnabled?: boolean;
  lastBackupDate?: string;
}

export interface TelegramAlertToast {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'fee' | 'material' | 'uniform' | 'canteen' | 'system';
}

export interface TelegramAlertLogItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'fee' | 'material' | 'uniform' | 'canteen' | 'system';
  payerName?: string;
  amount?: string;
  success: boolean;
}

export interface SchoolBranch {
  id: string;
  nameKhmer: string;
  nameEnglish: string;
  code: string;
  phone: string;
  email?: string;
  address: string;
  directorName: string;
  accountantName?: string;
  isMainBranch?: boolean;
  status: 'active' | 'inactive';
  createdDate: string;
}

export interface SchoolSettings {
  schoolNameKhmer: string;
  schoolNameEnglish: string;
  schoolLogo?: string;
  ministryDeptName?: string;
  directorName: string;
  accountantName: string;
  phone: string;
  address: string;
  exchangeRate: number; // e.g. 4100
  academicYear: string;
  telegramConfig: TelegramConfig;
  autoBackupConfig?: AutoBackupConfig;
  // ── Official Khmer document header (scores, booklets, honor roll, ID cards) ──
  eduOfficeName?: string; // e.g. ការិយាល័យ អ.យ.ក នៃរដ្ឋបាលស្រុក ...
  semester1Months?: number[]; // months (1-12) averaged into semester 1, default [10,11,12,1,2]
  semester2Months?: number[]; // default [3,4,5,6,7]
  principalStampUrl?: string; // stamp + signature image (data URL)
  honorFrame?: string; // kbach frame style for the honor roll (KbachFrameId)
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const MONTH_NAMES_KH: { [key: string]: string } = {
  January: 'មករា (Jan)',
  February: 'កុម្ភៈ (Feb)',
  March: 'មីនា (Mar)',
  April: 'មេសា (Apr)',
  May: 'ឧសភា (May)',
  June: 'មិថុនា (Jun)',
  July: 'កក្កដា (Jul)',
  August: 'សីហា (Aug)',
  September: 'កញ្ញា (Sep)',
  October: 'តុលា (Oct)',
  November: 'វិច្ឆិកា (Nov)',
  December: 'ធ្នូ (Dec)',
};

// ==========================================
// School Bus Management Interfaces
// ==========================================
export interface BusRoute {
  id: string;
  name: string; // e.g. "ខ្សែទី១៖ ច្បារអំពៅ - បឹងកេងកង"
  nameEnglish?: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  capacity: number;
  monthlyFeeUSD: number;
  color?: string;
  notes?: string;
  branchId?: string;
}

export interface BusPaymentRecord {
  id: string;
  enrollmentId: string;
  studentId: number;
  studentCode: string;
  studentName: string;
  latinName?: string;
  classId: string;
  className: string;
  routeId: string;
  routeName: string;
  month: string;
  months?: string[];
  monthsCount?: number;
  feePerMonthUSD: number;
  discountUSD?: number;
  amountUSD: number;
  amountKHR: number;
  paidBy: 'ABA' | 'AC' | 'Cash';
  receiptNo: string;
  invoiceNo?: string;
  paymentDate: string; // YYYY-MM-DD
  recordedBy: string;
  notes?: string;
  branchId?: string;
}

export interface BusStudentEnrollment {
  id: string;
  studentId: number;
  studentCode: string;
  studentName: string;
  latinName?: string;
  classId: string;
  className: string;
  routeId: string;
  pickupLocation: string;
  dropoffLocation?: string;
  shift: 'morning' | 'afternoon' | 'both';
  monthlyFeeUSD: number;
  discountUSD?: number;
  status: 'paid' | 'unpaid' | 'waived';
  paymentDate?: string;
  paidBy?: 'ABA' | 'AC' | 'Cash' | '$ -';
  receiptNo?: string;
  notes?: string;
  paidMonths?: string[];
  paymentHistory?: BusPaymentRecord[];
  branchId?: string;
}

export interface BusAttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  routeId: string;
  shift: 'morning' | 'evening';
  records: {
    [enrollmentId: string]: 'present' | 'absent' | 'excused';
  };
  recordedBy: string;
  timestamp: string;
}

export interface POSCartItem {
  cartItemId: string;
  itemId?: number;
  typeId?: string;
  name: string;
  nameEnglish?: string;
  category: 'uniform' | 'stationery' | 'textbooks' | 'books';
  size?: string;
  quantity: number;
  unitPriceKHR: number;
  unitPriceUSD: number;
  totalPriceKHR: number;
  totalPriceUSD: number;
}

// ==========================================
// Teacher Management & Curriculum Types
// ==========================================
export interface TeacherRecord {
  id: string;
  teacherCode: string;
  nameKhmer: string;
  nameEnglish: string;
  gender: 'Male' | 'Female';
  dob?: string;
  phone: string;
  email: string;
  qualification: string; // e.g. "បរិញ្ញាបត្រអក្សរសាស្ត្រខ្មែរ" / "Bachelor in Education"
  subjects: string[]; // List of subject names or codes
  homeroomClassId?: string; // Homeroom class ID (e.g. "1A")
  homeroomClassName?: string;
  joinDate: string; // Date of service
  status: 'active' | 'leave' | 'resigned';
  position?: string; // e.g. "Grade 1A", "Kindergarten 1", "គ្រូភាសាអង់គ្លេស"
  workStatus?: string; // e.g. "ពេញម៉ោង" (full time)
  profile?: Record<string, any>; // Employee Profile Form details (addresses, education, skills…)
  branchId?: string;
  address?: string;
  salaryUSD?: number;
}

/** One teacher's check-in / check-out for one day (Teacher Management → Attendance Check In) */
export interface TeacherCheckInRecord {
  id: string; // `${date}_${teacherId}`
  teacherId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // HH:MM (24h)
  checkOut?: string; // HH:MM (24h)
  status: 'on_time' | 'late' | 'leave' | 'absent';
  note?: string;
  recordedBy?: string;
}

/** Teacher leave request (សំណើសុំច្បាប់) */
export interface TeacherLeaveRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  type: string; // leave type key, e.g. 'annual' | 'sick' | 'personal' | 'family' | 'other'
  unit?: 'day' | 'hour'; // whole days, or a few hours on one day
  fromTime?: string; // HH:MM when unit = 'hour'
  toTime?: string; // HH:MM when unit = 'hour'
  hours?: number; // total hours requested (days × hoursPerDay, or the hour range)
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string; // ISO
  decidedAt?: string;
  decidedBy?: string;
  decisionNote?: string;
}

export interface TeacherCheckInData {
  records: TeacherCheckInRecord[];
  startTime: string; // school start, e.g. "07:00"
  endTime: string; // school end, e.g. "16:00"
  lateGraceMinutes: number; // minutes after start before "late"
  leaveRequests?: TeacherLeaveRequest[];
  /** Leave allowance per type per year, in days (0 = no limit) */
  leaveQuotas?: Record<string, number>;
  /** Working hours in one day (to turn hours into days) */
  hoursPerDay?: number;
}

export interface SubjectItem {
  id: string;
  code: string; // e.g. "KH-01", "MATH-01", "ENG-01"
  nameKhmer: string;
  nameEnglish: string;
  gradeLevels: string[]; // e.g. ["ថ្នាក់ទី ១", "ថ្នាក់ទី ២", "ថ្នាក់ទី ៣"]
  hoursPerWeek: number;
  department: 'Khmer Literature' | 'Mathematics & Science' | 'Foreign Languages' | 'Social Studies' | 'Arts & Physical Education' | 'General';
  description?: string;
  color?: string;
}

export interface ScheduleTimePeriod {
  period: number;
  time: string; // e.g. "07:30 - 08:30"
  labelKhmer?: string; // e.g. "ម៉ោងទី ១"
  shift?: 'morning' | 'afternoon' | 'evening';
}

export interface ScheduleSlot {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  timeSlot: string; // e.g. "07:30 - 08:30"
  periodNumber: number;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  room: string;
}

// ==========================================
// Student Attendance Types
// ==========================================
export type AttendanceStatus = 'present' | 'absent_permission' | 'absent_no_permission' | 'late';

export interface DailyStudentAttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  className: string;
  recordedBy: string;
  attendance: {
    [studentId: number]: {
      status: AttendanceStatus;
      note?: string;
    };
  };
}

// ==========================================
// Periodic Auto-Backup & Cloud Sync Types
// ==========================================
export type BackupFrequency = '15m' | '30m' | '1h' | '4h' | 'daily_evening' | 'manual';

export interface AutoBackupConfig {
  enabled: boolean;
  frequency: BackupFrequency;
  lastBackupAt?: string;
  nextScheduledBackupAt?: string;
  autoPromptCloudSync: boolean;
  syncToTelegramCloud: boolean;
  syncToServerStorage: boolean;
  saveLocalHistory: boolean;
  maxLocalSnapshots: number; // e.g. 15
}

export interface BackupSnapshotMeta {
  id: string;
  filename: string;
  timestamp: string;
  source: 'auto_interval' | 'manual' | 'daily_close' | 'cloud_sync';
  totalStudents: number;
  totalClasses: number;
  todaySalesUSD: number;
  todaySalesKHR: number;
  todayTransactionsCount: number;
  fileSizeBytes?: number;
  syncedToCloud?: boolean;
  syncedToServer?: boolean;
  summary?: {
    materialsCount: number;
    uniformSalesCount: number;
    feePaymentsCount: number;
    canteenCount?: number;
    busPaymentsCount?: number;
  };
}

export interface DailySalesExportPayload {
  date: string;
  periodKhmer: string;
  totals: {
    usd: number;
    khr: number;
    count: number;
  };
  tuitionFeePayments: StudentFeePaymentItem[];
  materialSales: MaterialSaleTransaction[];
  uniformSales: UniformSaleTransaction[];
  canteenCollections: Array<{
    date: string;
    vendorCount: number;
    dailyTotalKHR: number;
  }>;
  busPayments: BusPaymentRecord[];
}

export interface StudentRecordsExportPayload {
  totalStudents: number;
  totalClasses: number;
  exportedAt: string;
  classes: Array<{
    classId: string;
    className: string;
    teacherName: string;
    studentCount: number;
  }>;
  students: Array<{
    id: number;
    studentCode?: string;
    name: string;
    latinName?: string;
    gender: string;
    className: string;
    classId: string;
    branchId?: string;
    phone?: string;
    feesGroup: string;
    caseType: string;
    cash: number;
    hasHealthConcern?: boolean;
    admissionDate?: string;
    parentPhone?: string;
    recentPaymentsCount: number;
    lastPaymentDate?: string;
  }>;
}

export interface SchoolBackupBundle {
  snapshotId: string;
  createdAt: string;
  backupType: 'auto_interval' | 'manual' | 'daily_close' | 'cloud_sync';
  version: string;
  school: {
    nameKhmer: string;
    nameEnglish: string;
    academicYear: string;
    director: string;
    accountant: string;
  };
  dailySales: DailySalesExportPayload;
  studentRecords: StudentRecordsExportPayload;
  classesData: { [classId: string]: ClassFeeData };
  materialsHistory?: { [key: string]: DailyMaterialsReport };
  materialSalesHistory?: MaterialSaleTransaction[];
  uniformSalesHistory?: UniformSaleTransaction[];
  canteenHistory?: { [key: string]: CanteenReport };
  busEnrollments?: BusStudentEnrollment[];
  busPayments?: BusPaymentRecord[];
  settings?: SchoolSettings;
  branches?: SchoolBranch[];
  users?: UserProfile[];
}




