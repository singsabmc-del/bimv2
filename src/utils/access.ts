// Role-based access (from "Structure BIM School" → Setting)
//   1. Admin      – checks and uses everything
//   2. Cashier    – Student Management, Daily School Revenue (to collect payments), Daily Income Report
//   3. Accounting – Teacher Management, Monthly Report, Income Statistics, Settings
//   4. Teacher    – own Check In + Leave Request; own class only: Student List (view only), Student Attendance (use),
//                   Student Information (view only)
import type { UserRole } from '../types';
import type { NavTab } from '../components/Sidebar';

export const ROLE_LABELS: Record<UserRole, { km: string; en: string }> = {
  admin: { km: 'អ្នកគ្រប់គ្រង', en: 'Admin' },
  cashier: { km: 'បេឡាករ', en: 'Cashier' },
  accountant: { km: 'គណនេយ្យ', en: 'Accounting' },
  teacher: { km: 'គ្រូបង្រៀន', en: 'Teacher' },
  student: { km: 'សិស្ស', en: 'Student' },
};

const STUDENT_MGMT: NavTab[] = [
  'student_list', 'official_roster', 'student_attendance', 'student_admission', 'student_upgrade',
  'student_info', 'student_portal', 'student_idcard',
];
const ACADEMIC: NavTab[] = ['academic_scores', 'academic_tracking', 'academic_booklet', 'academic_honor'];
const TEACHER_MGMT: NavTab[] = ['teacher_list', 'teacher_info', 'teaching_schedule', 'teacher_subject', 'teacher_attendance', 'teacher_checkin', 'teacher_leave'];
const REVENUE: NavTab[] = [
  'revenue_student', 'student_fees', 'revenue_uniform', 'uniform_sales', 'uniform_history', 'revenue_transport',
  'school_bus', 'revenue_materials', 'pos', 'daily_materials', 'material_history', 'revenue_stall_fee', 'canteen_vendors',
];
const MONTHLY_REPORTS: NavTab[] = ['report_tuition', 'report_uniform', 'report_transport', 'report_materials', 'report_stall_fee'];

/** Pages each role may open. `null` = every page. */
export const ROLE_TABS: Record<UserRole, NavTab[] | null> = {
  admin: null,
  cashier: ['overview', ...STUDENT_MGMT, ...REVENUE, 'daily_report'],
  accountant: ['overview', ...TEACHER_MGMT, ...MONTHLY_REPORTS, 'income_statistics', 'system_settings'],
  // Teacher: Check In is the front page; only their own class and their own records
  teacher: ['teacher_checkin', 'teacher_leave', 'student_list', 'official_roster', 'student_attendance', 'student_info', 'student_portal'],
  student: ['student_info', 'student_portal'],
};

export const canOpenTab = (role: UserRole, tab: NavTab): boolean => {
  const allowed = ROLE_TABS[role] ?? null;
  return allowed === null || allowed.includes(tab);
};

/** First page a role lands on */
export const homeTabFor = (role: UserRole): NavTab => {
  const allowed = ROLE_TABS[role];
  if (!allowed) return 'overview';
  return allowed[0];
};
