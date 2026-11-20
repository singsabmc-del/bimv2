import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCheck,
  UserPlus,
  ArrowUpRight,
  Calendar,
  BookOpen,
  DollarSign,
  Shirt,
  Bus,
  ShoppingBag,
  Store,
  FileSpreadsheet,
  Settings,
  Languages,
  Shield,
  LogOut,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  CreditCard,
  Send,
  ShoppingCart,
  Receipt,
  Sparkles,
  History,
  CheckCircle2,
  ShieldCheck,
  Database,
  ClipboardList,
  NotebookPen,
  BookMarked,
  Trophy,
  IdCard,
  CalendarDays,
  PieChart,
  Clock,
  CalendarClock,
} from 'lucide-react';
import { canOpenTab, ROLE_LABELS } from '../utils/access';

export const NAV_TAB_IDS = [
  'overview',
  'student_list',
  'student_attendance',
  'student_admission',
  'student_upgrade',
  'student_info',
  'academic_scores',
  'academic_tracking',
  'academic_booklet',
  'academic_honor',
  'student_idcard',
  'teacher_list',
  'teacher_info',
  'teaching_schedule',
  'teacher_subject',
  'teacher_attendance',
  'revenue_student',
  'revenue_uniform',
  'revenue_transport',
  'revenue_materials',
  'revenue_stall_fee',
  'report_tuition',
  'report_uniform',
  'report_transport',
  'report_materials',
  'report_stall_fee',
  'student_fees',
  'student_portal',
  'official_roster',
  'pos',
  'daily_materials',
  'material_history',
  'uniform_sales',
  'uniform_history',
  'school_bus',
  'canteen_vendors',
  'daily_report',
  'ai_scanner',
  'system_settings',
  'income_statistics',
  'teacher_checkin',
  'teacher_leave',
  'student_payment_history',
  'teacher_shifts',
] as const;

export type NavTab = (typeof NAV_TAB_IDS)[number];

export const isNavTab = (v: string): v is NavTab => (NAV_TAB_IDS as readonly string[]).includes(v);

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onOpenUserModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  onOpenUserModal,
}) => {
  const { currentUser, logout, language, setLanguage, t, settings, currentBranch, openInvoiceVerification, openAutoBackupModal, classData } = useApp();

  // Live counts shown as small badges next to some menu items
  const studentCount = Object.values(classData || {}).reduce((n, c) => n + (c.students?.length || 0), 0);
  const itemBadge: { [id: string]: number } = {
    student_list: studentCount,
  };

  // Collapsible section state to keep sidebar neat
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({
    student: false,
    academic: false,
    teacher: false,
    revenue: false,
    reports: false,
  });

  const toggleSection = (sec: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sec]: !prev[sec],
    }));
  };

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  // 5 Sections directly matching the PDF Flowchart Diagram
  const sections = [
    // Section 1: Dashboard
    {
      id: 'dashboard',
      title: 'Dashboard',
      titleKhmer: 'ផ្ទាំងគ្រប់គ្រងទូទៅ',
      color: 'amber',
      items: [
        {
          id: 'overview' as NavTab,
          label: 'Dashboard',
          labelKhmer: 'ផ្ទាំងគ្រប់គ្រងទូទៅ',
          icon: LayoutDashboard,
          activeMatch: ['overview'],
        },
      ],
    },
    // Section 2: Student Management
    {
      id: 'student',
      title: 'Student Management',
      titleKhmer: 'ការគ្រប់គ្រងសិស្ស',
      color: 'blue',
      items: [
        {
          id: 'student_list' as NavTab,
          label: 'Student List',
          labelKhmer: 'បញ្ជីឈ្មោះសិស្សផ្លូវការ',
          icon: Users,
          activeMatch: ['student_list', 'official_roster'],
        },
        {
          id: 'student_attendance' as NavTab,
          label: 'Student Attendance',
          labelKhmer: 'ការស្រង់វត្តមានសិស្ស',
          icon: CheckCircle2,
          activeMatch: ['student_attendance'],
        },
        {
          id: 'student_admission' as NavTab,
          label: 'Admission of new students',
          labelKhmer: 'ចុះឈ្មោះសិស្សថ្មី',
          icon: UserPlus,
          activeMatch: ['student_admission'],
        },
        {
          id: 'student_upgrade' as NavTab,
          label: 'Upgrading students',
          labelKhmer: 'ការឡើងថ្នាក់សិស្ស',
          icon: ArrowUpRight,
          activeMatch: ['student_upgrade'],
        },
        {
          id: 'student_info' as NavTab,
          label: 'Student Information',
          labelKhmer: 'ព័ត៌មាន & ប្រវត្តិរូបសិស្ស',
          icon: UserCheck,
          activeMatch: ['student_info', 'student_portal'],
        },
      ],
    },
    // Section 2b: Academic & Results (scores, study books, honor roll, ID cards)
    {
      id: 'academic',
      title: 'Academic & Results',
      titleKhmer: 'ការសិក្សា & លទ្ធផល',
      color: 'emerald',
      items: [
        {
          id: 'academic_scores' as NavTab,
          label: 'Student Scores',
          labelKhmer: 'គ្រប់គ្រងពិន្ទុសិស្ស',
          icon: ClipboardList,
          activeMatch: ['academic_scores'],
        },
        {
          id: 'academic_tracking' as NavTab,
          label: 'Study Tracking Book',
          labelKhmer: 'សៀវភៅតាមដានការសិក្សា',
          icon: NotebookPen,
          activeMatch: ['academic_tracking'],
        },
        {
          id: 'academic_booklet' as NavTab,
          label: 'Report Booklet',
          labelKhmer: 'សៀវភៅសិក្ខាគារិក',
          icon: BookMarked,
          activeMatch: ['academic_booklet'],
        },
        {
          id: 'academic_honor' as NavTab,
          label: 'Honor Roll',
          labelKhmer: 'តារាងកិត្តិយស',
          icon: Trophy,
          activeMatch: ['academic_honor'],
        },
        {
          id: 'student_idcard' as NavTab,
          label: 'Student ID Cards',
          labelKhmer: 'កាតសិស្ស (ID Cards)',
          icon: IdCard,
          activeMatch: ['student_idcard'],
        },
      ],
    },
    // Section 3: Teacher Management
    {
      id: 'teacher',
      title: 'Teacher Management',
      titleKhmer: 'ការគ្រប់គ្រងគ្រូបង្រៀន',
      color: 'indigo',
      items: [
        {
          id: 'teacher_list' as NavTab,
          label: 'Teacher List',
          labelKhmer: 'បញ្ជីឈ្មោះគ្រូបង្រៀន',
          icon: Users,
          activeMatch: ['teacher_list'],
        },
        {
          id: 'teacher_info' as NavTab,
          label: 'Teacher Information',
          labelKhmer: 'ព័ត៌មានគ្រូបង្រៀន',
          icon: GraduationCap,
          activeMatch: ['teacher_info'],
        },
        {
          id: 'teaching_schedule' as NavTab,
          label: 'Teaching schedule',
          labelKhmer: 'កាលវិភាគបង្រៀន',
          icon: Calendar,
          activeMatch: ['teaching_schedule'],
        },
        {
          id: 'teacher_subject' as NavTab,
          label: 'Subject',
          labelKhmer: 'មុខវិជ្ជាសិក្សា',
          icon: BookOpen,
          activeMatch: ['teacher_subject'],
        },
        {
          id: 'teacher_attendance' as NavTab,
          label: 'Teacher Attendance',
          labelKhmer: 'វត្តមានគ្រូបង្រៀន',
          icon: CheckCircle2,
          activeMatch: ['teacher_attendance'],
        },
        {
          id: 'teacher_shifts' as NavTab,
          label: 'Work Shifts',
          labelKhmer: 'វេនការងារ (Shifts)',
          icon: CalendarClock,
          activeMatch: ['teacher_shifts'],
        },
        {
          id: 'teacher_checkin' as NavTab,
          label: 'Attendance Check In',
          labelKhmer: 'ចុះវត្តមាន (Check In)',
          icon: Clock,
          activeMatch: ['teacher_checkin'],
        },
        {
          id: 'teacher_leave' as NavTab,
          label: 'Leave Request',
          labelKhmer: 'សំណើសុំច្បាប់ (Leave Request)',
          icon: CalendarDays,
          activeMatch: ['teacher_leave'],
        },
      ],
    },
    // Section 4: Daily School Revenue (School Income)
    {
      id: 'revenue',
      title: 'Daily School Revenue',
      titleKhmer: 'ចំណូលសាលាប្រចាំថ្ងៃ',
      badge: 'School income',
      color: 'emerald',
      items: [
        {
          id: 'revenue_student' as NavTab,
          label: 'Payment Student',
          labelKhmer: 'បង់ថ្លៃសិក្សាសិស្ស',
          icon: DollarSign,
          activeMatch: ['revenue_student', 'student_fees'],
        },
        {
          id: 'student_payment_history' as NavTab,
          label: 'Student Payment History',
          labelKhmer: 'ប្រវត្តិបង់ថ្លៃសិក្សា',
          icon: History,
          activeMatch: ['student_payment_history'],
        },
        {
          id: 'revenue_uniform' as NavTab,
          label: 'Uniform Payment',
          labelKhmer: 'ទូទាត់ថ្លៃឯកសណ្ឋាន',
          icon: Shirt,
          activeMatch: ['revenue_uniform', 'uniform_sales', 'uniform_history'],
        },
        {
          id: 'revenue_transport' as NavTab,
          label: 'Student Transportation Service',
          labelKhmer: 'សេវារថយន្តសាលា',
          icon: Bus,
          activeMatch: ['revenue_transport', 'school_bus'],
        },
        {
          id: 'revenue_materials' as NavTab,
          label: 'Study Materials',
          labelKhmer: 'សម្ភារៈសិក្សា & POS',
          icon: ShoppingBag,
          activeMatch: ['revenue_materials', 'pos', 'daily_materials', 'material_history'],
        },
        {
          id: 'revenue_stall_fee' as NavTab,
          label: 'Stall fee',
          labelKhmer: 'ថ្លៃតូបអាហារដ្ឋាន',
          icon: Store,
          activeMatch: ['revenue_stall_fee', 'canteen_vendors'],
        },
      ],
    },
    // Section 5: Reporting Section (Monthly Report + Daily Income Report)
    {
      id: 'reports',
      title: 'Reporting Section',
      titleKhmer: 'ផ្នែករបាយការណ៍',
      color: 'blue',
      items: [
        {
          id: 'daily_report' as NavTab,
          label: 'Daily Income Report',
          labelKhmer: 'របាយការណ៍ចំណូលប្រចាំថ្ងៃ',
          icon: CalendarDays,
          activeMatch: ['daily_report'],
        },
        {
          id: 'report_tuition' as NavTab,
          label: 'Tuition Fee Payment Report',
          labelKhmer: 'របាយការណ៍បង់ថ្លៃសិក្សា',
          icon: FileSpreadsheet,
          activeMatch: ['report_tuition'],
        },
        {
          id: 'report_uniform' as NavTab,
          label: 'School Uniform Sales Report',
          labelKhmer: 'របាយការណ៍លក់ឯកសណ្ឋាន',
          icon: Shirt,
          activeMatch: ['report_uniform'],
        },
        {
          id: 'report_transport' as NavTab,
          label: 'Student Transportation Service Report',
          labelKhmer: 'របាយការណ៍រថយន្តសាលា',
          icon: Bus,
          activeMatch: ['report_transport'],
        },
        {
          id: 'report_materials' as NavTab,
          label: 'Sales Report for Study Materials',
          labelKhmer: 'របាយការណ៍លក់សម្ភារៈ',
          icon: ShoppingBag,
          activeMatch: ['report_materials'],
        },
        {
          id: 'report_stall_fee' as NavTab,
          label: 'Stall Fee Payment Report',
          labelKhmer: 'របាយការណ៍ថ្លៃតូបអាហារដ្ឋាន',
          icon: Store,
          activeMatch: ['report_stall_fee'],
        },
      ],
    },
    // Section 6: Income Statistics
    {
      id: 'income',
      title: 'Income Statistics',
      titleKhmer: 'ស្ថិតិចំណូល',
      color: 'emerald',
      items: [
        {
          id: 'income_statistics' as NavTab,
          label: 'Cash Report',
          labelKhmer: 'របាយការណ៍សាច់ប្រាក់ (Cash Report)',
          icon: PieChart,
          activeMatch: ['income_statistics'],
        },
      ],
    },
  ]
    // Show only the pages this user's role may open (Setting → access rights)
    .map((sec) => ({ ...sec, items: sec.items.filter((it) => canOpenTab(currentUser.role, it.id)) }))
    .filter((sec) => sec.items.length > 0)
    // A teacher's own tools (Check In, Leave Request) come first as "My work"
    .map((sec) => ((currentUser.role === 'teacher' || currentUser.role === 'cashier') && sec.id === 'teacher' ? { ...sec, id: 'mine', title: 'My Work', titleKhmer: 'ការងាររបស់ខ្ញុំ' } : sec))
    .sort((a, b) => (a.id === 'mine' ? -1 : b.id === 'mine' ? 1 : 0));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] lg:hidden no-print"
        />
      )}

      {/* Sidebar Container — light teal design (v2) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-slate-200/80 bg-white text-slate-700 transition-transform duration-300 ease-in-out lg:translate-x-0 print:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex shrink-0 items-center justify-between px-4 pb-3 pt-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-md shadow-teal-600/25">
              {settings.schoolLogo ? (
                <img src={settings.schoolLogo} alt="" className="h-full w-full rounded-xl object-cover" />
              ) : (
                <GraduationCap className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-display truncate text-[15px] font-bold leading-tight text-teal-800">
                {language === 'km' ? settings.schoolNameKhmer : settings.schoolNameEnglish}
              </div>
              <div className="truncate text-[11px] text-slate-500 font-khmer">
                {language === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងសាលា' : 'School Management'}
              </div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="rounded-md p-1 text-slate-400 hover:text-slate-700 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile card */}
        <div className="shrink-0 px-3 pb-2">
          <button
            onClick={onOpenUserModal}
            className="group flex w-full items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-2.5 text-left shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition hover:border-teal-200 hover:bg-teal-50/40"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-600 text-sm font-bold text-white">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                (currentUser.name || 'U').slice(0, 1)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-slate-900 font-khmer">{currentUser.khmerName.split('(')[0].trim()}</div>
              <div className="truncate text-[11px] text-slate-500 font-khmer">
                {language === 'km' ? ROLE_LABELS[currentUser.role]?.km : ROLE_LABELS[currentUser.role]?.en}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-teal-600" />
          </button>
          <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-[11px] text-slate-600">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span className="truncate font-khmer">
              {language === 'km' ? currentBranch.nameKhmer.split('(')[0].trim() : currentBranch.nameEnglish.split('(')[0].trim()}
            </span>
            <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-400">{currentBranch.code}</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 space-y-4 overflow-y-auto px-3 py-2 text-[13px]">
          {sections.map((sec) => {
            const isCollapsed = collapsedSections[sec.id] || false;
            const sectionTitle = language === 'km' ? sec.titleKhmer : sec.title;
            return (
              <div key={sec.id}>
                <button
                  type="button"
                  onClick={() => toggleSection(sec.id)}
                  className="group flex w-full items-center justify-between px-2 pb-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600"
                >
                  <span className={`truncate ${language === 'km' ? 'font-khmer' : 'uppercase tracking-wider'}`}>{sectionTitle}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-300 opacity-0 transition group-hover:opacity-100 ${isCollapsed ? '-rotate-90 opacity-100' : ''}`} />
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {sec.items.map((item) => {
                      const isActive = activeTab === item.id || (item.activeMatch && item.activeMatch.includes(activeTab as any));
                      const Icon = item.icon;
                      const itemTitle = language === 'km' ? item.labelKhmer : item.label;
                      const badge = itemBadge[item.id];
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                            isActive ? 'nav-item-active bg-teal-50 font-bold text-teal-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          } ${language === 'km' ? 'font-khmer' : ''}`}
                        >
                          <Icon className={`nav-icon h-[18px] w-[18px] shrink-0 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} strokeWidth={1.8} />
                          <span className="flex-1 truncate leading-tight">{itemTitle}</span>
                          {badge !== undefined && badge > 0 && (
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] ${
                                isActive ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* System (hidden for teacher accounts: none of these tools apply) */}
          {currentUser.role !== 'teacher' && currentUser.role !== 'student' && <div>
            <div className={`px-2 pb-1 text-[11px] font-semibold text-slate-400 ${language === 'km' ? 'font-khmer' : 'uppercase tracking-wider'}`}>
              {language === 'km' ? 'ប្រព័ន្ធ' : 'System'}
            </div>
            <div className="space-y-0.5">
              {(
                [
                  {
                    key: 'qr',
                    icon: ShieldCheck,
                    label: language === 'km' ? 'ផ្ទៀងផ្ទាត់វិក្កយបត្រ (QR)' : 'Verify Invoice (QR)',
                    onClick: () => {
                      openInvoiceVerification();
                      if (window.innerWidth < 1024) setIsOpen(false);
                    },
                    active: false,
                  },
                  {
                    key: 'backup',
                    icon: Database,
                    label: language === 'km' ? 'បម្រុងទុក & Sync' : 'Backup & Sync',
                    onClick: () => {
                      openAutoBackupModal();
                      if (window.innerWidth < 1024) setIsOpen(false);
                    },
                    active: false,
                  },
                  {
                    key: 'settings',
                    icon: Settings,
                    label: language === 'km' ? 'ការកំណត់ & Telegram' : 'Settings & Telegram',
                    onClick: () => handleNavClick('system_settings'),
                    active: activeTab === 'system_settings',
                  },
                ] as const
              ).filter(({ key }) =>
                key === 'settings' ? canOpenTab(currentUser.role, 'system_settings')
                : key === 'backup' ? currentUser.role === 'admin' || currentUser.role === 'accountant'
                : key === 'qr' ? currentUser.role !== 'teacher' && currentUser.role !== 'student'
                : true
              ).map(({ key, icon: Icon, label, onClick, active }) => (
                <button
                  key={key}
                  onClick={onClick}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                    active ? 'bg-teal-50 font-bold text-teal-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  } ${language === 'km' ? 'font-khmer' : ''}`}
                >
                  <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-teal-700' : 'text-slate-400'}`} strokeWidth={1.8} />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-4 py-3 text-[11px] text-slate-400">
          <span>Version 2.0</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLanguage(language === 'km' ? 'en' : 'km')}
              className="flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-teal-700"
              title={language === 'km' ? 'Switch to English' : 'ប្តូរជាភាសាខ្មែរ'}
            >
              <Languages className="h-3.5 w-3.5" />
              {language === 'km' ? 'EN / ខ្មែរ' : 'ខ្មែរ / EN'}
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
              title={language === 'km' ? 'ចាកចេញពីប្រព័ន្ធ' : 'Log out'}
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
