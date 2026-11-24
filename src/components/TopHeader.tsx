import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { canOpenTab } from '../utils/access';
import { InstallAppButton } from './InstallAppButton';
import { ThemePicker } from './ThemePicker';
import { NavTab } from './Sidebar';
import {
  Menu,
  Search,
  Printer,
  Send,
  Store,
  ShoppingBag,
  X,
  Trash2,
  Building,
  Calendar,
  LogOut,
  MoreHorizontal,
  Palette,
  QrCode,
  Database,
  Settings,
  ShoppingCart,
  GraduationCap,
} from 'lucide-react';

import { MONTH_NAMES, MONTH_NAMES_KH } from '../types';

interface TopHeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onToggleSidebar: () => void;
  onPrint: () => void;
  onOpenUserModal: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  setActiveTab,
  onToggleSidebar,
  onPrint,
  onOpenUserModal,
}) => {
  const {
    classData,
    dailyMaterials,
    currentCanteenReport,
    setSelectedStudentForProfile,
    currentUser,
    logout,
    settings,
    branches,
    currentBranchId,
    currentBranch,
    setCurrentBranchId,
    globalMonth,
    globalYear,
    setGlobalPeriod,
    academicMonths,
    telegramAlertLogs,
    clearTelegramLogs,
    deleteTelegramLog,
    t,
    openInvoiceVerification,
    openAutoBackupModal,
    autoBackupConfig,
    lastBackupTime,
    academicYearArchives,
    switchAcademicYear,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [isTgLogsOpen, setIsTgLogsOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Helper to compute classes & student counts per campus
  const getBranchStats = (bId: string) => {
    const classes = Object.values(classData).filter((c) => (c.branchId || 'branch-central') === bId);
    const studentCount = classes.reduce((sum, c) => sum + (c.students?.length || 0), 0);
    return { classCount: classes.length, studentCount };
  };

  const totalClassesCount = Object.keys(classData).length;
  const totalStudentsCount = Object.values(classData).reduce((sum, c) => sum + (c.students?.length || 0), 0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const periodDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Academic years that have their own data (active year + archived years), newest first
  const activeAcademicYear = settings.academicYear || '2026-2027';
  const academicYearList = Array.from(
    new Set([activeAcademicYear, ...Object.keys(academicYearArchives || {})])
  ).sort((a, b) => b.localeCompare(a));
  const latestAcademicYear = academicYearList[0];
  const tgLogsDropdownRef = useRef<HTMLDivElement>(null);

  // Header tools shown per role (Setting → access rights)
  const role = currentUser.role;
  const isStaff = role === 'admin' || role === 'cashier' || role === 'accountant';
  const can = (tab: NavTab) => canOpenTab(role, tab);
  const showPOS = can('pos');
  const showBackup = role === 'admin' || role === 'accountant';
  const showSettings = can('system_settings');
  // Switching the academic year changes the data for everyone, so only Admin may do it
  const canSwitchYear = role === 'admin';
  // Pages with a print layout in the shared print sheet; other pages print themselves
  const PRINT_SHEET_TABS: string[] = [
    'student_fees', 'revenue_student', 'daily_materials', 'revenue_materials', 'pos', 'canteen_vendors',
    'revenue_stall_fee', 'uniform_sales', 'revenue_uniform', 'school_bus', 'revenue_transport', 'overview',
  ];
  const handlePrint = () => (PRINT_SHEET_TABS.includes(activeTab) ? onPrint() : window.print());

  const currentUserRoleRef = useRef(currentUser.role);
  currentUserRoleRef.current = currentUser.role;

  // Keyboard shortcut Cmd+K or Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 (or Alt+P) = Quick Open POS from any page
      if (e.key === 'F2' || (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'p' || e.key === 'P'))) {
        if (!canOpenTab(currentUserRoleRef.current, 'pos')) return;
        e.preventDefault();
        setActiveTab('pos');
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMobileSearchOpen(false);
        setIsBranchOpen(false);
        setIsPeriodOpen(false);
        setIsYearOpen(false);
        setIsTgLogsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus mobile input when mobile search opens
  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
    }
  }, [isMobileSearchOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setIsBranchOpen(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
        setIsYearOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(e.target as Node)) {
        setIsPeriodOpen(false);
      }
      if (tgLogsDropdownRef.current && !tgLogsDropdownRef.current.contains(e.target as Node)) {
        setIsTgLogsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Collect all searchable records
  const allStudents = Object.values(classData).flatMap((cls) =>
    cls.students.map((st) => ({ ...st, className: cls.className, classId: cls.classId }))
  );

  const filteredStudents = searchQuery.trim() && canOpenTab(currentUser.role, 'student_portal')
    ? allStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.latinName && s.latinName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.id.toString() === searchQuery.trim()
      )
    : [];

  const filteredMaterials = searchQuery.trim() && canOpenTab(currentUser.role, 'daily_materials')
    ? dailyMaterials.items.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredVendors = searchQuery.trim() && canOpenTab(currentUser.role, 'canteen_vendors')
    ? currentCanteenReport.vendors.filter(
        (v) =>
          v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.stallName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const hasResults =
    filteredStudents.length > 0 || filteredMaterials.length > 0 || filteredVendors.length > 0;

  const handleSelectStudent = (st: (typeof allStudents)[0]) => {
    setSelectedStudentForProfile(st);
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setSearchQuery('');
    setActiveTab('student_portal');
  };

  const handleSelectMaterial = () => {
    setActiveTab('daily_materials');
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setSearchQuery('');
  };

  const handleSelectVendor = () => {
    setActiveTab('canteen_vendors');
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setSearchQuery('');
  };

  const TAB_TITLES: Partial<Record<NavTab, [string, string]>> = {
    overview: ['ផ្ទាំងគ្រប់គ្រង', 'Dashboard'],
    student_list: ['បញ្ជីឈ្មោះសិស្ស', 'Student List'],
    official_roster: ['បញ្ជីឈ្មោះសិស្ស', 'Student List'],
    student_attendance: ['ការស្រង់វត្តមានសិស្ស', 'Student Attendance'],
    student_admission: ['ចុះឈ្មោះសិស្សថ្មី', 'Admission'],
    student_upgrade: ['ការឡើងថ្នាក់សិស្ស', 'Upgrading Students'],
    student_info: ['ព័ត៌មានសិស្ស', 'Student Information'],
    student_portal: ['ព័ត៌មានសិស្ស', 'Student Information'],
    student_idcard: ['កាតសិស្ស', 'Student ID Cards'],
    academic_scores: ['ពិន្ទុសិស្ស', 'Student Scores'],
    academic_tracking: ['សៀវភៅតាមដាន', 'Study Tracking Book'],
    academic_booklet: ['សៀវភៅសិក្ខាគារិក', 'Report Booklet'],
    academic_honor: ['តារាងកិត្តិយស', 'Honor Roll'],
    teacher_list: ['បញ្ជីឈ្មោះគ្រូ', 'Teacher List'],
    teacher_info: ['ព័ត៌មានគ្រូ', 'Teacher Information'],
    teaching_schedule: ['កាលវិភាគបង្រៀន', 'Teaching Schedule'],
    my_schedule: ['កាលវិភាគរបស់ខ្ញុំ', 'My Schedule'],
    my_attendance: ['វត្តមានរបស់ខ្ញុំ', 'My Attendance'],
    work_plan: ['ផែនការការងារ', 'Work Plan'],
    meetings: ['ប្រជុំ · ណាត់ជួប · សំណើ', 'Meetings & Requests'],
    work_calendar: ['ប្រតិទិនការងារ', 'Work Calendar'],
    student_records: ['កំណត់ត្រាសិស្ស', 'Student Records'],
    teacher_subject: ['មុខវិជ្ជា', 'Subjects'],
    teacher_attendance: ['វត្តមានគ្រូ', 'Teacher Attendance'],
    teacher_checkin: ['ចុះវត្តមានគ្រូ (Check In)', 'Attendance Check In'],
    teacher_leave: ['សំណើសុំច្បាប់', 'Leave Request'],
    teacher_shifts: ['វេនការងារ', 'Work Shifts'],
    revenue_student: ['បង់ថ្លៃសិក្សា', 'Payment Student'],
    student_payment_history: ['ប្រវត្តិបង់ថ្លៃសិក្សា', 'Student Payment History'],
    student_fees: ['បង់ថ្លៃសិក្សា', 'Payment Student'],
    revenue_uniform: ['ឯកសណ្ឋាន', 'Uniform Payment'],
    uniform_sales: ['ឯកសណ្ឋាន', 'Uniform Payment'],
    uniform_history: ['ប្រវត្តិលក់ឯកសណ្ឋាន', 'Uniform History'],
    revenue_transport: ['សេវាដឹកជញ្ជូនសិស្ស', 'Student Transportation'],
    school_bus: ['សេវាដឹកជញ្ជូនសិស្ស', 'Student Transportation'],
    revenue_materials: ['លក់សម្ភារៈ (POS)', 'Study Materials (POS)'],
    pos: ['លក់សម្ភារៈ (POS)', 'Point of Sale'],
    daily_materials: ['សម្ភារៈលក់ប្រចាំថ្ងៃ', 'Daily Materials'],
    material_history: ['ប្រវត្តិលក់សម្ភារៈ', 'Material Sales History'],
    revenue_stall_fee: ['ថ្លៃតូប', 'Stall Fee'],
    canteen_vendors: ['ថ្លៃតូប', 'Stall Fee'],
    daily_report: ['របាយការណ៍ចំណូលប្រចាំថ្ងៃ', 'Daily Income Report'],
    report_tuition: ['របាយការណ៍បង់ថ្លៃសិក្សា', 'Monthly Report · Payment Student'],
    report_uniform: ['របាយការណ៍ឯកសណ្ឋាន', 'Monthly Report · Uniform'],
    report_transport: ['របាយការណ៍ដឹកជញ្ជូន', 'Monthly Report · Transportation'],
    report_materials: ['របាយការណ៍សម្ភារៈ', 'Monthly Report · Materials'],
    report_stall_fee: ['របាយការណ៍ថ្លៃតូប', 'Monthly Report · Stall Fee'],
    income_statistics: ['ស្ថិតិចំណូល (Cash Report)', 'Income Statistics'],
    ai_scanner: ['វិភាគឯកសារ AI', 'AI Scanner'],
    system_settings: ['ការកំណត់', 'Settings'],
  };
  const getBreadcrumbTitle = () => {
    const tt = TAB_TITLES[activeTab];
    return tt ? t(tt[0], tt[1]) : 'BIM Rangsei School';
  };

  // Reusable search results list
  const renderSearchResults = () => (
    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
      {!hasResults && (
        <div className="p-6 text-center text-xs text-slate-400 font-khmer">
          មិនមានទិន្នន័យត្រូវគ្នានឹង "{searchQuery}"
        </div>
      )}

      {/* Students Section */}
      {filteredStudents.length > 0 && (
        <div className="p-2 border-b border-slate-100">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-khmer">
            {t('សិស្ស (Students)', 'Students')} ({filteredStudents.length})
          </div>
          <div className="space-y-0.5 mt-1">
            {filteredStudents.slice(0, 5).map((st) => (
              <div
                key={st.id}
                onClick={() => handleSelectStudent(st)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px] font-khmer">
                    {st.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 font-khmer">{st.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {st.studentCode} · {st.className}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      st.cash > 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {st.cash > 0 ? `$${st.cash.toFixed(2)}` : 'Unpaid'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Materials Section */}
      {filteredMaterials.length > 0 && (
        <div className="p-2 border-b border-slate-100">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-khmer">
            {t('សម្ភារៈសិក្សា (Stationery Items)', 'Supplies')} ({filteredMaterials.length})
          </div>
          <div className="space-y-0.5 mt-1">
            {filteredMaterials.slice(0, 4).map((it) => (
              <div
                key={it.id}
                onClick={handleSelectMaterial}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <span className="font-khmer font-medium text-slate-800">{it.name}</span>
                </div>
                <span className="font-mono text-slate-600 font-bold">{it.unitPriceKHR}៛</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vendors Section */}
      {filteredVendors.length > 0 && (
        <div className="p-2">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-khmer">
            {t('អ្នកលក់អាហារ (Canteen Vendors)', 'Vendors')} ({filteredVendors.length})
          </div>
          <div className="space-y-0.5 mt-1">
            {filteredVendors.map((v) => (
              <div
                key={v.id}
                onClick={handleSelectVendor}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-khmer font-bold text-slate-900">{v.name}</span>
                    <span className="text-[10px] text-slate-500 font-khmer ml-2">{v.stallName}</span>
                  </div>
                </div>
                <span className="font-mono text-[11px] font-medium text-emerald-700">10,000៛/ថ្ងៃ</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/70 w-full max-w-full overflow-x-clip print:hidden">
      {/* Mobile Search Overlay Bar */}
      {isMobileSearchOpen ? (
        <div className="px-3 h-16 flex items-center gap-2 max-w-full min-w-0 bg-white relative" ref={dropdownRef}>
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={mobileSearchInputRef}
            type="text"
            placeholder={t('ស្វែងរកសិស្ស, មុខទំនិញ, អ្នកលក់...', 'Search student, item, vendor...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-0 py-2 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-khmer placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              setIsMobileSearchOpen(false);
              setSearchQuery('');
            }}
            className="px-2.5 py-1.5 text-xs font-khmer font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg shrink-0 transition-colors"
          >
            {t('បោះបង់', 'Cancel')}
          </button>
          {searchQuery.trim().length > 0 && renderSearchResults()}
        </div>
      ) : (
        /* Normal Header Bar */
        <div className="px-3 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between gap-2 sm:gap-4 max-w-full min-w-0">
          {/* Left: Mobile hamburger & Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden shrink-0"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0">
              <span className="font-semibold text-slate-400 hidden md:inline font-khmer shrink-0">
                {settings.schoolNameKhmer}
              </span>
              <span className="text-slate-300 hidden md:inline shrink-0">/</span>
              <span className="font-bold text-slate-800 font-khmer truncate max-w-[130px] xs:max-w-[180px] sm:max-w-xs md:max-w-none">
                {getBreadcrumbTitle()}
              </span>
            </div>
          </div>

          {/* Center: Desktop Global Search */}
          <div className="hidden sm:block flex-1 max-w-md relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t('ស្វែងរកសិស្ស, មុខទំនិញ, អ្នកលក់... (Cmd+K)', 'Search student, item, vendor... (Ctrl+K)')}
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                className="w-full pl-10 pr-14 py-2.5 border border-slate-200 rounded-2xl text-[13px] font-khmer placeholder:text-slate-400 shadow-[0_1px_2px_rgb(15_23_42/0.04)] focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 bg-white transition"
              />
              <div className="absolute right-2.5 top-2.5 hidden sm:flex items-center gap-0.5 pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-50 border border-slate-200 text-slate-500 rounded-md">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Desktop Search Results Dropdown */}
            {isSearchOpen && searchQuery.trim().length > 0 && renderSearchResults()}
          </div>

          {/* Right Actions: Search trigger (mobile), Period Switcher, Telegram Status, Print, User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Search Button (Compact Icon Button) */}
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="sm:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Search"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Dynamic Campus / Branch Selector */}
            {isStaff && <div className="relative" ref={branchDropdownRef}>
              <button
                type="button"
                onClick={() => setIsBranchOpen((prev) => !prev)}
                className={`flex items-center gap-1 sm:gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                  currentBranchId === 'all'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                }`}
                title={`${t('ប្តូរសាខាសាលា (Switch Campus Branch)', 'Switch Campus Branch')}: ${currentBranch.nameKhmer}`}
              >
                <Building className={`w-4 h-4 shrink-0 ${currentBranchId === 'all' ? 'text-indigo-600' : 'text-amber-600'}`} />
                <span className="hidden sm:inline font-khmer truncate max-w-[130px] text-xs">
                  {currentBranchId === 'all' ? t('គ្រប់សាខាទាំងអស់', 'All Campuses') : currentBranch.nameKhmer.split('(')[0].trim()}
                </span>
                <span className="hidden xl:inline px-1 py-0.2 bg-white rounded text-[10px] font-mono text-slate-600 border border-slate-200">
                  {currentBranch.code}
                </span>
                <span className="hidden sm:inline text-[10px] text-slate-500">▾</span>
              </button>

              {isBranchOpen && (
                <div className="fixed sm:absolute top-16 sm:top-full mt-2 left-3 right-3 sm:left-0 sm:right-auto sm:w-84 max-w-sm sm:max-w-none mx-auto sm:mx-0 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                  {/* Visual caret pointer on desktop */}
                  <div className="hidden sm:block absolute -top-1.5 left-5 w-3 h-3 bg-white border-t border-l border-slate-200 rotate-45 pointer-events-none" />

                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 relative">
                    <span className="font-bold text-slate-900 font-khmer">
                      {t('ជ្រើសរើសសាខាសាលា', 'Select Active Campus')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {branches.length} Campuses
                    </span>
                  </div>

                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    {/* Option: All Campuses (Consolidated) */}
                    <div
                      onClick={() => {
                        setCurrentBranchId('all');
                        setIsBranchOpen(false);
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-2 border mb-1.5 ${
                        currentBranchId === 'all'
                          ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-indigo-50/70 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                            currentBranchId === 'all' ? 'bg-white text-indigo-950' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            ALL
                          </span>
                          <span className="font-khmer truncate text-xs font-bold">
                            {t('គ្រប់សាខាទាំងអស់ (មើលទិន្នន័យសរុប)', 'All Campuses (Consolidated View)')}
                          </span>
                        </div>
                        <div className={`text-[10px] font-khmer mt-0.5 flex items-center gap-2 ${
                          currentBranchId === 'all' ? 'text-indigo-100' : 'text-slate-500'
                        }`}>
                          <span>{totalClassesCount} ថ្នាក់រៀន</span>
                          <span>•</span>
                          <span>{totalStudentsCount} សិស្សសរុប</span>
                        </div>
                      </div>
                      {currentBranchId === 'all' && <span className="text-xs shrink-0 font-bold">✓</span>}
                    </div>

                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-khmer px-1 pt-1 pb-0.5">
                      {t('ជ្រើសរើសតាមសាខាជាក់លាក់ (Select Branch)', 'Select Campus Branch')}
                    </div>

                    {branches.map((b) => {
                      const isSelected = b.id === currentBranchId;
                      const stats = getBranchStats(b.id);
                      return (
                        <div
                          key={b.id}
                          onClick={() => {
                            setCurrentBranchId(b.id);
                            setIsBranchOpen(false);
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-2 ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                                isSelected ? 'bg-slate-950 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {b.code}
                              </span>
                              <span className="font-khmer truncate text-xs">{b.nameKhmer}</span>
                            </div>
                            <div className={`text-[10px] font-khmer mt-0.5 flex items-center gap-2 ${
                              isSelected ? 'text-amber-950 font-semibold' : 'text-slate-500'
                            }`}>
                              <span>{stats.classCount} ថ្នាក់</span>
                              <span>•</span>
                              <span>{stats.studentCount} សិស្ស</span>
                            </div>
                            <div className={`text-[9px] font-khmer truncate mt-0.5 opacity-80 ${
                              isSelected ? 'text-amber-950' : 'text-slate-400'
                            }`}>
                              {b.address}
                            </div>
                          </div>
                          {isSelected && <span className="text-xs shrink-0 font-bold">✓</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBranchOpen(false);
                        setActiveTab('system_settings');
                      }}
                      className="text-[11px] font-khmer text-amber-700 hover:text-amber-900 font-bold transition-colors cursor-pointer"
                    >
                      គ្រប់គ្រងសាខា (Manage Branches) ⚙
                    </button>
                  </div>
                </div>
              )}
            </div>}

            {/* Academic Year Switcher — open an old year's data at any time */}
            <div className="relative" ref={yearDropdownRef}>
              <button
                onClick={() => canSwitchYear && setIsYearOpen((prev) => !prev)}
                className={`flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                  activeAcademicYear !== latestAcademicYear
                    ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-900'
                    : 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-900'
                }`}
                title={canSwitchYear ? t('ប្តូរឆ្នាំសិក្សា', 'Switch academic year') : t('ឆ្នាំសិក្សា (មានតែ Admin ទេដែលប្តូរបាន)', 'Academic year (only Admin can switch)')}
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline font-mono text-[11px]">{activeAcademicYear}</span>
                {canSwitchYear && <span className="hidden sm:inline text-[10px] opacity-70">▾</span>}
              </button>

              {isYearOpen && canSwitchYear && (
                <div className="fixed sm:absolute top-16 sm:top-full mt-2 left-3 right-3 sm:left-auto sm:right-0 sm:w-72 max-w-sm sm:max-w-none mx-auto sm:mx-0 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="pb-2 mb-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-800 font-khmer">
                      {t('ឆ្នាំសិក្សា', 'Academic Year')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-khmer mt-0.5">
                      {t('ជ្រើសឆ្នាំដើម្បីមើល ឬបោះពុម្ពទិន្នន័យឆ្នាំនោះ', 'Pick a year to view or print its data')}
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {academicYearList.map((y) => {
                      const isActive = y === activeAcademicYear;
                      const archive = academicYearArchives?.[y];
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => {
                            setIsYearOpen(false);
                            if (isActive) return;
                            switchAcademicYear(y);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 ${
                            isActive
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-mono font-bold">{y}</div>
                            <div className={`text-[10px] font-khmer ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                              {y === latestAcademicYear ? t('ឆ្នាំបច្ចុប្បន្ន', 'Current year') : t('ឆ្នាំចាស់', 'Past year')}
                              {!isActive && archive ? ` · ${archive.totalStudents} ${t('សិស្ស', 'students')}` : ''}
                            </div>
                          </div>
                          {isActive && <span className="text-[10px] font-khmer shrink-0">✓ {t('កំពុងបើក', 'Open')}</span>}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsYearOpen(false);
                      setActiveTab('student_upgrade');
                    }}
                    className="w-full mt-2 pt-2 border-t border-slate-100 text-[11px] font-khmer text-teal-700 hover:text-teal-900 font-bold text-left"
                  >
                    {t('គ្រប់គ្រងឆ្នាំសិក្សា / ឡើងថ្នាក់ →', 'Manage years / promotion →')}
                  </button>
                </div>
              )}
            </div>

            {/* Dynamic Global Period Selector (Compact on mobile) — staff only */}
            {isStaff && (<>
            <div className="relative" ref={periodDropdownRef}>
              <button
                onClick={() => setIsPeriodOpen((prev) => !prev)}
                className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-300 text-amber-950 text-xs font-bold transition-all shadow-2xs"
                title={`Change Global School Report Period: ${globalMonth} ${globalYear}`}
              >
                <Calendar className="w-4 h-4 text-amber-700 shrink-0 sm:hidden" />
                <span className="hidden sm:inline font-khmer truncate text-xs">
                  {MONTH_NAMES_KH[globalMonth] || globalMonth}
                </span>
                <span className="hidden sm:inline font-mono text-[11px] text-amber-800">{globalYear}</span>
                <span className="hidden sm:inline text-[10px] text-amber-700">▾</span>
              </button>

              {isPeriodOpen && (
                <div className="fixed sm:absolute top-16 sm:top-full mt-2 left-3 right-3 sm:left-auto sm:right-0 sm:w-72 max-w-sm sm:max-w-none mx-auto sm:mx-0 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 font-khmer">
                      {t('ជ្រើសរើសខែ & ឆ្នាំទូទៅ', 'Global Report Month & Year')}
                    </span>
                    <div className="flex items-center gap-1">
                      {[2025, 2026, 2027].map((y) => (
                        <button
                          key={y}
                          onClick={() => setGlobalPeriod(globalMonth, y)}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                            globalYear === y ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
                    {(academicMonths && academicMonths.length > 0 ? academicMonths : MONTH_NAMES).map((m) => {
                      const isSelected = globalMonth === m;
                      return (
                        <button
                          key={m}
                          onClick={() => {
                            setGlobalPeriod(m, globalYear);
                            setIsPeriodOpen(false);
                          }}
                          className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-khmer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span className="truncate">{MONTH_NAMES_KH[m] || m}</span>
                          {isSelected && <span className="text-[10px]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            </>)}

            {/* Telegram Payment Alerts Log Popover (Hidden on Mobile) — staff only */}
            {isStaff && (<>
            <div className="relative hidden md:block" ref={tgLogsDropdownRef}>
              <button
                onClick={() => setIsTgLogsOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 text-xs font-medium transition-all shadow-2xs"
                title="Recent Telegram Payment Alerts"
              >
                <Send className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                <span className="hidden sm:inline font-mono font-bold text-[11px] text-sky-700">Telegram</span>
                <span className="w-4 h-4 rounded-full bg-sky-600 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                  {telegramAlertLogs.length}
                </span>
              </button>

              {isTgLogsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-sky-600" />
                      <span className="text-xs font-bold text-slate-900 font-khmer">
                        {t('ប្រវត្តិការផ្ញើ Telegram Alert', 'Telegram Alert Notifications')}
                      </span>
                    </div>
                    {telegramAlertLogs.length > 0 && (
                      <div>
                        {showClearConfirm ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                            <span className="text-[10px] text-rose-700 font-khmer font-bold">លុបទាំងអស់?</span>
                            <button
                              type="button"
                              onClick={() => {
                                clearTelegramLogs();
                                setShowClearConfirm(false);
                              }}
                              className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-khmer font-bold transition-colors"
                            >
                              {t('លុប', 'Yes')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowClearConfirm(false)}
                              className="px-1 py-0.5 text-slate-500 hover:text-slate-700 text-[10px] font-khmer"
                            >
                              {t('ទេ', 'No')}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowClearConfirm(true)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-khmer font-medium transition-colors"
                            title={t('សម្អាតប្រវត្តិទាំងអស់', 'Clear All Logs')}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{t('សម្អាត', 'Clear')}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2 -mr-1 pr-1">
                    {telegramAlertLogs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 font-khmer">
                        មិនទាន់មានការជូនដំណឹងទូទាត់ប្រាក់នៅឡើយទេ
                      </div>
                    ) : (
                      telegramAlertLogs.map((log) => (
                        <div key={log.id} className="py-2.5 space-y-1 text-xs group relative">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 font-khmer truncate">
                              {log.title}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {log.timestamp}
                              </span>
                              <button
                                type="button"
                                onClick={() => deleteTelegramLog(log.id)}
                                className="opacity-60 hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                                title={t('លុបសារនេះ', 'Delete this log')}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-600 font-khmer whitespace-pre-line leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {log.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Bot Dispatch Active
                    </span>
                    <button
                      onClick={() => {
                        setIsTgLogsOpen(false);
                        setActiveTab('system_settings');
                      }}
                      className="text-amber-700 hover:text-amber-900 font-bold font-khmer text-xs"
                    >
                      ការកំណត់ Bot ⚙
                    </button>
                  </div>
                </div>
              )}
            </div>
            </>)}

            {/* Quick Open POS (desktop) — also F2 / Alt+P */}
            {showPOS && (
            <button
              onClick={() => setActiveTab('pos')}
              title={t('បើកលក់ POS រហ័ស (F2)', 'Quick Open POS (F2)')}
              className={`hidden md:flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pos'
                  ? 'bg-teal-800 text-white ring-2 ring-teal-300'
                  : 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md shadow-teal-600/25'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="font-khmer text-xs">{t('លក់ POS', 'POS')}</span>
              <kbd className="hidden xl:inline rounded bg-white/20 px-1 font-mono text-[10px] font-semibold">F2</kbd>
            </button>
            )}

            {/* User Profile Pill */}
            <button
              onClick={onOpenUserModal}
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:pl-2 sm:pr-3 sm:py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shrink-0"
              title={`${currentUser.name} (${currentUser.role})`}
            >
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                {currentUser.khmerName.slice(0, 1)}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-[11px] font-bold text-slate-800 font-khmer leading-none">
                  {currentUser.name}
                </div>
                <div className="text-[9px] uppercase font-mono font-bold text-amber-800 mt-0.5 leading-none">
                  {currentUser.role}
                </div>
              </div>
            </button>

            {/* Theme panel (opened from the More menu) */}
            <ThemePicker hideButton open={isThemeOpen} onOpenChange={setIsThemeOpen} />

            {/* More: theme, install app, print, log out (QR / backup / settings live in the side menu) */}
            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setIsMoreOpen((v) => !v)}
                title={t('ឧបករណ៍ផ្សេងៗ', 'More')}
                className={`flex items-center justify-center p-2 rounded-xl border text-slate-700 transition-colors cursor-pointer ${isMoreOpen ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {isMoreOpen && (
                <div className="fixed sm:absolute top-16 sm:top-full mt-2 right-3 sm:right-0 w-60 z-50 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl font-khmer">
                  <button
                    type="button"
                    onClick={() => { setIsMoreOpen(false); setIsThemeOpen(true); }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Palette className="h-4 w-4 text-teal-600" /> {t('ប្តូរ Theme', 'Theme')}
                  </button>
                  <InstallAppButton variant="menu" onDone={() => setIsMoreOpen(false)} />
                  <button
                    type="button"
                    onClick={() => { setIsMoreOpen(false); handlePrint(); }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Printer className="h-4 w-4 text-slate-500" /> {t('បោះពុម្ពទំព័រនេះ', 'Print this page')}
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreOpen(false);
                      if (window.confirm(t('តើអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធមែនទេ?', 'Are you sure you want to log out?'))) logout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" /> {t('ចាកចេញ', 'Log Out')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
