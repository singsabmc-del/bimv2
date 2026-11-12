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
} from 'lucide-react';

export type NavTab =
  // 1. Dashboard
  | 'overview'
  // 2. Student Management
  | 'student_list'
  | 'student_attendance'
  | 'student_admission'
  | 'student_upgrade'
  | 'student_info'
  // 3. Teacher Management
  | 'teacher_list'
  | 'teacher_info'
  | 'teaching_schedule'
  | 'teacher_subject'
  | 'teacher_attendance'
  // 4. Daily School Revenue
  | 'revenue_student'
  | 'revenue_uniform'
  | 'revenue_transport'
  | 'revenue_materials'
  | 'revenue_stall_fee'
  // 5. Monthly Report Section
  | 'report_tuition'
  | 'report_uniform'
  | 'report_transport'
  | 'report_materials'
  | 'report_stall_fee'
  // Compatibility & System Aliases
  | 'student_fees'
  | 'student_portal'
  | 'official_roster'
  | 'pos'
  | 'daily_materials'
  | 'material_history'
  | 'uniform_sales'
  | 'uniform_history'
  | 'school_bus'
  | 'canteen_vendors'
  | 'daily_report'
  | 'ai_scanner'
  | 'system_settings';

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
  const { currentUser, logout, language, setLanguage, t, settings, currentBranch, openInvoiceVerification, openAutoBackupModal } = useApp();

  // Collapsible section state to keep sidebar neat
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({
    student: false,
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
          activeMatch: ['overview', 'daily_report'],
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
    // Section 5: Monthly Report Section
    {
      id: 'reports',
      title: 'Monthly Report Section',
      titleKhmer: 'ផ្នែករបាយការណ៍ប្រចាំខែ',
      color: 'blue',
      items: [
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
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden no-print"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-slate-800 lg:translate-x-0 print:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-extrabold shadow-sm shrink-0">
              <GraduationCap className="w-5 h-5 text-slate-950" />
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-xs tracking-tight text-white truncate">
                {language === 'km' ? settings.schoolNameKhmer : settings.schoolNameEnglish}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-[10px] text-slate-400 truncate">
                  {language === 'km'
                    ? currentBranch.nameKhmer.split('(')[0].trim()
                    : currentBranch.nameEnglish.split('(')[0].trim()}{' '}
                  ({currentBranch.code})
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-md lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Card */}
        <div className="px-3 py-2 bg-slate-850 border-b border-slate-800 shrink-0">
          <div
            onClick={onOpenUserModal}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-slate-700 overflow-hidden shrink-0 border border-slate-600">
                <img
                  src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                  {currentUser.khmerName.split('(')[0].trim()}
                </div>
                <div className="text-[10px] text-slate-400 font-mono capitalize">
                  {currentUser.role}
                </div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
          </div>
        </div>

        {/* Scrollable Navigation List organized strictly by the 5 flowchart modules */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3.5 text-xs font-sans">
          {sections.map((sec) => {
            const isCollapsed = collapsedSections[sec.id] || false;
            const sectionTitle = language === 'km' ? sec.titleKhmer : sec.title;
            const sectionBadge =
              sec.badge && (language === 'km' ? 'ចំណូលសាលា' : sec.badge);

            return (
              <div key={sec.id} className="space-y-1">
                {/* Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(sec.id)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold tracking-wide uppercase text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-amber-400">❖</span>
                    <span className={`text-white font-extrabold truncate ${language === 'km' ? 'font-khmer text-xs' : ''}`}>
                      {sectionTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {sectionBadge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                        {sectionBadge}
                      </span>
                    )}
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                        isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  </div>
                </button>

                {/* Sub-items */}
                {!isCollapsed && (
                  <div className="space-y-0.5 pt-0.5">
                    {sec.items.map((item) => {
                      const isActive =
                        activeTab === item.id ||
                        (item.activeMatch && item.activeMatch.includes(activeTab as any));
                      const Icon = item.icon;
                      const itemTitle = language === 'km' ? item.labelKhmer : item.label;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-all text-left text-xs ${
                            isActive
                              ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          } ${language === 'km' ? 'font-khmer' : 'font-sans'}`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-slate-950' : 'text-slate-400'
                              }`}
                            />
                            <span className="truncate leading-tight">
                              {itemTitle}
                            </span>
                          </div>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* System Utility Settings */}
          <div className="pt-2 border-t border-slate-800 space-y-0.5">
            <button
              onClick={() => {
                openInvoiceVerification();
                if (window.innerWidth < 1024) setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all text-xs text-emerald-400 hover:bg-slate-800/80 hover:text-emerald-300 font-bold ${
                language === 'km' ? 'font-khmer' : 'font-sans'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">
                {language === 'km'
                  ? 'ផ្ទៀងផ្ទាត់វិក្កយបត្រ (QR)'
                  : 'Verify Invoice (QR Code)'}
              </span>
            </button>

            <button
              onClick={() => {
                openAutoBackupModal();
                if (window.innerWidth < 1024) setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all text-xs text-indigo-400 hover:bg-slate-800/80 hover:text-indigo-300 font-bold ${
                language === 'km' ? 'font-khmer' : 'font-sans'
              }`}
            >
              <Database className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">
                {language === 'km'
                  ? 'បម្រុងទុកស្វ័យប្រវត្ត & Sync'
                  : 'Auto-Backup & Sync'}
              </span>
            </button>

            <button
              onClick={() => handleNavClick('system_settings')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-all text-xs ${
                activeTab === 'system_settings'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              } ${language === 'km' ? 'font-khmer' : 'font-sans'}`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Settings className={`w-4 h-4 shrink-0 ${activeTab === 'system_settings' ? 'text-slate-950' : 'text-amber-400'}`} />
                <span className="truncate">
                  {language === 'km'
                    ? 'ការកំណត់ & Telegram Backup'
                    : 'Settings & Telegram Backup'}
                </span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${activeTab === 'system_settings' ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                ⚙
              </span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 shrink-0 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={() => setLanguage(language === 'km' ? 'en' : 'km')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-amber-400 font-bold transition-colors cursor-pointer"
            title={language === 'km' ? 'Switch to English' : 'ប្តូរជាភាសាខ្មែរ'}
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'km' ? 'ភាសាខ្មែរ (KM)' : 'English (EN)'}</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 text-[11px] transition-colors cursor-pointer"
            title={language === 'km' ? 'ចាកចេញពីប្រព័ន្ធ' : 'Log out of system'}
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className={language === 'km' ? 'font-khmer' : 'font-sans'}>
              {language === 'km' ? 'ចាកចេញ' : 'Logout'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
