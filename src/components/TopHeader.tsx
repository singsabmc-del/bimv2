import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
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
  QrCode,
  Database,
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
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
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
  const tgLogsDropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut Cmd+K or Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMobileSearchOpen(false);
        setIsBranchOpen(false);
        setIsPeriodOpen(false);
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

  const filteredStudents = searchQuery.trim()
    ? allStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.latinName && s.latinName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.id.toString() === searchQuery.trim()
      )
    : [];

  const filteredMaterials = searchQuery.trim()
    ? dailyMaterials.items.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredVendors = searchQuery.trim()
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

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'overview':
        return t('ផ្ទាំងគ្រប់គ្រង (Overview)', 'Overview Dashboard');
      case 'daily_report':
        return t('របាយការណ៍បង់ប្រាក់ប្រចាំថ្ងៃ', 'Daily Payment Report');
      case 'student_fees':
        return t('ថ្លៃសិក្សាសិស្ស (Student Fees)', 'Student Fees Collection');
      case 'student_portal':
        return t('ផតថលសិស្ស (Student Portal)', 'Student Profile & Portal');
      case 'pos':
        return t('ប្រព័ន្ធលក់រហ័ស (POS)', 'Point of Sale (POS)');
      case 'daily_materials':
        return t('សម្ភារៈលក់ប្រចាំថ្ងៃ', 'Daily Stationery');
      case 'material_history':
        return t('ប្រវត្តិលក់សម្ភារៈ', 'Material Sales History');
      case 'canteen_vendors':
        return t('ថ្លៃតូបអាហារដ្ឋាន (Canteen)', 'Canteen Vendors');
      case 'uniform_sales':
        return t('លក់ឯកសណ្ឋាន (Uniforms)', 'Uniform Sales');
      case 'uniform_history':
        return t('ប្រវត្តិលក់ឯកសណ្ឋាន', 'Uniform History');
      case 'school_bus':
        return t('សេវារថយន្តសាលា (School Bus)', 'School Bus Service');
      case 'ai_scanner':
        return t('វិភាគឯកសារ AI', 'AI Scanner');
      case 'system_settings':
        return t('ការកំណត់ & Backup & Telegram', 'Settings & Telegram');
      default:
        return 'BIM Rangsei School';
    }
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
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs w-full max-w-full overflow-x-clip print:hidden">
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
        <div className="px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 max-w-full min-w-0">
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
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
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
                className="w-full pl-9 pr-12 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50 focus:bg-white transition-colors"
              />
              <div className="absolute right-2 top-2 hidden sm:flex items-center gap-0.5 pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white border border-slate-200 text-slate-500 rounded">
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
            <div className="relative" ref={branchDropdownRef}>
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
            </div>

            {/* Dynamic Global Period Selector (Compact on mobile) */}
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

            {/* Telegram Payment Alerts Log Popover (Hidden on Mobile) */}
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

            {/* Quick QR Invoice Verification Button for Staff */}
            <button
              onClick={() => openInvoiceVerification()}
              title={t('ផ្ទៀងផ្ទាត់វិក្កយបត្រតាម QR Code', 'Verify Invoice via QR Code')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden lg:inline font-khmer text-xs">
                {t('ផ្ទៀងផ្ទាត់ QR', 'Verify QR')}
              </span>
            </button>

            {/* Quick Auto-Backup & Cloud Sync Button */}
            <button
              onClick={() => openAutoBackupModal()}
              title={
                autoBackupConfig?.enabled
                  ? t(`ការបម្រុងទុកស្វ័យប្រវត្ត (សកម្ម) - ចុងក្រោយ: ${lastBackupTime ? new Date(lastBackupTime).toLocaleTimeString() : 'មិនទាន់មាន'}`, `Auto-Backup (Active) - Last: ${lastBackupTime ? new Date(lastBackupTime).toLocaleTimeString() : 'None'}`)
                  : t('ការបម្រុងទុកស្វ័យប្រវត្ត & Cloud Sync', 'Auto-Backup & Cloud Sync')
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                autoBackupConfig?.enabled
                  ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-800'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${autoBackupConfig?.enabled ? 'text-indigo-600' : 'text-slate-500'}`} />
              <span className="hidden xl:inline font-khmer text-xs">
                {t('បម្រុងទុកទិន្នន័យ', 'Auto-Backup')}
              </span>
            </button>

            {/* Print button (Hidden on Mobile) */}
            <button
              onClick={onPrint}
              title={t('បោះពុម្ពរបាយការណ៍', 'Print Official Report')}
              className="hidden sm:flex items-center justify-center p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

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

            {/* Quick Logout Button */}
            <button
              onClick={() => {
                if (window.confirm(t('តើអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធមែនទេ?', 'Are you sure you want to log out?'))) {
                  logout();
                }
              }}
              title={t('ចាកចេញពីប្រព័ន្ធ (Log Out)', 'Log Out')}
              className="flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline font-khmer text-xs">
                {t('ចាកចេញ', 'Log Out')}
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
