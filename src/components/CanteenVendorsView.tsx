import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MONTH_NAMES, MONTH_NAMES_KH, CanteenVendor } from '../types';
import {
  Store,
  Printer,
  Plus,
  Check,
  X,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  History,
  TrendingUp,
  Filter,
  Search,
  Send,
  Edit2,
  Sparkles,
  Trash2,
  Users,
  CalendarPlus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  GripVertical,
  RotateCcw,
} from 'lucide-react';

export type CanteenMonthSortMode = 'chrono_asc' | 'chrono_desc' | 'academic' | 'custom';

// Parse "October 2026", "September 2026", "November 2026", etc. into chronological metadata
export const parseMonthYearKey = (key: string): { month: string; year: number; timestamp: number } => {
  const parts = key.trim().split(/\s+/);
  const month = parts[0] || 'October';
  let year = parseInt(parts[1], 10);
  if (isNaN(year)) year = 2026;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  let mIdx = monthNames.findIndex((m) => m.toLowerCase() === month.toLowerCase());
  if (mIdx === -1) {
    mIdx = monthNames.findIndex((m) => m.toLowerCase().startsWith(month.toLowerCase().slice(0, 3)));
  }
  if (mIdx === -1) mIdx = 9;

  const timestamp = new Date(year, mIdx, 1).getTime();
  return { month, year, timestamp };
};

// Parse canteen date string "7-Sep-26", "2026-09-07", etc. into millisecond timestamp
export const parseCanteenDate = (dateStr: string): number => {
  if (!dateStr) return 0;
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(trimmed).getTime();
  }
  const parts = trimmed.split(/[-/._]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const mStr = parts[1].toLowerCase();
    const yStr = parts[2];
    const fullYear = yStr.length === 2 ? 2000 + parseInt(yStr, 10) : parseInt(yStr, 10);

    const monthShorts = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    let mIdx = monthShorts.findIndex((s) => mStr.startsWith(s));
    if (mIdx === -1) {
      const parsedNum = parseInt(mStr, 10);
      if (!isNaN(parsedNum)) mIdx = parsedNum - 1;
    }
    if (mIdx >= 0 && !isNaN(day) && !isNaN(fullYear)) {
      return new Date(fullYear, mIdx, day).getTime();
    }
  }
  return 0;
};

interface CanteenVendorsViewProps {
  onPrintReport?: () => void;
}

export const CanteenVendorsView: React.FC<CanteenVendorsViewProps> = ({ onPrintReport }) => {
  const {
    canteenHistory,
    selectedCanteenMonth,
    setSelectedCanteenMonth,
    currentCanteenReport,
    updateVendorAttendance,
    addCanteenVendor,
    updateCanteenVendor,
    deleteCanteenVendor,
    addCanteenDailyRecord,
    autoPopulateFullMonthDates,
    createCanteenMonthRecord,
    deleteCanteenMonthRecord,
    academicMonths,
    permissions,
    t,
  } = useApp();

  const [selectedCell, setSelectedCell] = useState<{ date: string; vendorId: string } | null>(null);
  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [cellStatus, setCellStatus] = useState<'paid' | 'absent' | 'double_paid' | 'unpaid'>('paid');
  const [cellAmount, setCellAmount] = useState<number>(10000);
  const [cellNote, setCellNote] = useState<string>('');

  // Add Vendor Modal
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorStall, setNewVendorStall] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newVendorFee, setNewVendorFee] = useState<number>(10000);

  // Edit Vendor Modal
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [isManageVendorsOpen, setIsManageVendorsOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [editVendorName, setEditVendorName] = useState('');
  const [editVendorStall, setEditVendorStall] = useState('');
  const [editVendorPhone, setEditVendorPhone] = useState('');
  const [editVendorFee, setEditVendorFee] = useState<number>(10000);

  // Add Date Modal
  const [isAddDateOpen, setIsAddDateOpen] = useState(false);
  const [newDateInput, setNewDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newDateDefaultStatus, setNewDateDefaultStatus] = useState<'paid' | 'absent' | 'unpaid'>('paid');
  const [dateError, setDateError] = useState<string | null>(null);

  // Auto Full Month Modal
  const [isAutoMonthModalOpen, setIsAutoMonthModalOpen] = useState(false);
  const [autoMonthSuccessMessage, setAutoMonthSuccessMessage] = useState<string | null>(null);

  // New Month Modal
  const [isNewMonthOpen, setIsNewMonthOpen] = useState(false);
  const [newMonthName, setNewMonthName] = useState('November');
  const [newYear, setNewYear] = useState<number>(2026);

  // Month Sorting & Drag-Drop State
  const [monthSortMode, setMonthSortMode] = useState<CanteenMonthSortMode>(() => {
    const saved = localStorage.getItem('BIM_RANGSEI_CANTEEN_MONTH_SORT');
    return (saved as CanteenMonthSortMode) || 'chrono_asc';
  });

  const [customMonthOrder, setCustomMonthOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('BIM_RANGSEI_CANTEEN_CUSTOM_MONTH_ORDER');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [draggedMonthIndex, setDraggedMonthIndex] = useState<number | null>(null);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);

  const scrollMonthPills = (direction: 'left' | 'right') => {
    if (monthScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      monthScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSetSortMode = (mode: CanteenMonthSortMode) => {
    setMonthSortMode(mode);
    setIsSortDropdownOpen(false);
    try {
      localStorage.setItem('BIM_RANGSEI_CANTEEN_MONTH_SORT', mode);
    } catch (e) {
      console.error(e);
    }
  };

  // Compute automatically sorted month keys
  const sortedCanteenMonths = useMemo(() => {
    const allKeys = Object.keys(canteenHistory);

    if (monthSortMode === 'custom' && customMonthOrder.length > 0) {
      const ordered: string[] = [];
      const added = new Set<string>();
      customMonthOrder.forEach((k) => {
        if (canteenHistory[k]) {
          ordered.push(k);
          added.add(k);
        }
      });
      allKeys.forEach((k) => {
        if (!added.has(k)) ordered.push(k);
      });
      return ordered;
    }

    return [...allKeys].sort((a, b) => {
      const infoA = parseMonthYearKey(a);
      const infoB = parseMonthYearKey(b);

      if (monthSortMode === 'chrono_desc') {
        return infoB.timestamp - infoA.timestamp;
      }

      if (monthSortMode === 'academic') {
        const getAcademicRank = (key: string) => {
          const info = parseMonthYearKey(key);
          const mIdx = academicMonths.findIndex(
            (am) => am.toLowerCase() === info.month.toLowerCase()
          );
          const rank = mIdx >= 0 ? mIdx : 99;
          return info.year * 1000 + rank;
        };
        return getAcademicRank(a) - getAcademicRank(b);
      }

      // Default 'chrono_asc' (September 2026 -> October 2026 -> November 2026...)
      return infoA.timestamp - infoB.timestamp;
    });
  }, [canteenHistory, monthSortMode, customMonthOrder, academicMonths]);

  const handleDeleteMonth = (monthKey: string) => {
    if (!permissions.canDelete) {
      alert(t('មានតែ Admin ទើបមានសិទ្ធិលុបកំណត់ត្រាខែ!', 'Permission Denied: Only Admin can delete monthly records.'));
      return;
    }
    if (sortedCanteenMonths.length <= 1) {
      alert(t('មិនអាចលុបខែចុងក្រោយបង្អស់បានទេ!', 'Cannot delete the only remaining month!'));
      return;
    }
    if (window.confirm(t(`តើអ្នកពិតជាចង់លុបកំណត់ត្រាខែ «${monthKey}» មែនទេ?`, `Are you sure you want to delete month record "${monthKey}"?`))) {
      deleteCanteenMonthRecord(monthKey);
    }
  };

  // Filters (Filter for all!)
  const [filterVendorId, setFilterVendorId] = useState<string>('all');
  const [searchDateQuery, setSearchDateQuery] = useState<string>('');
  const [filterAttendanceStatus, setFilterAttendanceStatus] = useState<string>('all');

  // Daily Records Column Sorting
  type CanteenDailySortField = 'date' | 'vendorCount' | 'dailyTotalKHR';
  const [dailySortField, setDailySortField] = useState<CanteenDailySortField>('date');
  const [dailySortDirection, setDailySortDirection] = useState<'asc' | 'desc'>('asc');

  const handleDailySort = (field: CanteenDailySortField) => {
    if (dailySortField === field) {
      setDailySortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setDailySortField(field);
      setDailySortDirection(field === 'date' ? 'asc' : 'desc');
    }
  };

  // Active report summary
  const totalVendorDays = currentCanteenReport.dailyRecords.reduce((sum, r) => sum + r.vendorCount, 0);
  const grandTotalKHR = currentCanteenReport.dailyRecords.reduce((sum, r) => sum + r.dailyTotalKHR, 0);

  // Filter daily records
  const filteredDailyRecords = currentCanteenReport.dailyRecords.filter((r) => {
    const matchesDate = !searchDateQuery || r.date.toLowerCase().includes(searchDateQuery.toLowerCase());

    let matchesStatus = true;
    if (filterAttendanceStatus !== 'all') {
      matchesStatus = Object.values(r.vendorStatus).some((v) => v.status === filterAttendanceStatus);
    }

    return matchesDate && matchesStatus;
  });

  // Sort daily records chronologically by parsed date
  const sortedDailyRecords = useMemo(() => {
    return [...filteredDailyRecords].sort((a, b) => {
      let result = 0;
      if (dailySortField === 'date') {
        const tA = parseCanteenDate(a.date);
        const tB = parseCanteenDate(b.date);
        result = tA - tB;
      } else if (dailySortField === 'vendorCount') {
        result = a.vendorCount - b.vendorCount;
      } else if (dailySortField === 'dailyTotalKHR') {
        result = a.dailyTotalKHR - b.dailyTotalKHR;
      }
      return dailySortDirection === 'asc' ? result : -result;
    });
  }, [filteredDailyRecords, dailySortField, dailySortDirection]);

  const openStatusEditor = (date: string, vendorId: string) => {
    if (!permissions.canEdit) {
      alert(t('អ្នកគ្មានសិទ្ធិកែប្រែវត្តមានអ្នកលក់ទេ (Permission Denied)', 'Permission Denied: Edit access required.'));
      return;
    }
    const record = currentCanteenReport.dailyRecords.find((r) => r.date === date);
    const vStat = record?.vendorStatus[vendorId];
    setSelectedCell({ date, vendorId });
    setCellStatus(vStat?.status || 'paid');
    setCellAmount(vStat?.amountKHR ?? 10000);
    setCellNote(vStat?.note || '');
    setIsCellModalOpen(true);
  };

  const handleSaveCellStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell) return;
    updateVendorAttendance(
      selectedCell.date,
      selectedCell.vendorId,
      cellStatus,
      Number(cellAmount) || 0,
      cellNote
    );
    setIsCellModalOpen(false);
    setSelectedCell(null);
  };

  const handleAddVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim()) return;
    addCanteenVendor(newVendorName.trim(), newVendorStall.trim(), Number(newVendorFee) || 10000);
    setNewVendorName('');
    setNewVendorStall('');
    setNewVendorPhone('');
    setIsAddVendorOpen(false);
  };

  const openEditVendor = (v: CanteenVendor) => {
    if (!permissions.canEdit) {
      alert(t('អ្នកគ្មានសិទ្ធិកែប្រែព័ត៌មានអ្នកលក់ទេ!', 'Permission Denied: Edit access required.'));
      return;
    }
    setEditingVendorId(v.id);
    setEditVendorName(v.name);
    setEditVendorStall(v.stallName);
    setEditVendorPhone(v.phone || '');
    setEditVendorFee(v.dailyFeeKHR || 10000);
    setIsEditVendorOpen(true);
  };

  const handleEditVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendorId || !editVendorName.trim()) return;
    updateCanteenVendor(editingVendorId, {
      name: editVendorName.trim(),
      stallName: editVendorStall.trim(),
      dailyFeeKHR: Number(editVendorFee) || 10000,
      phone: editVendorPhone.trim(),
    });
    setIsEditVendorOpen(false);
    setEditingVendorId(null);
  };

  const handleDeleteVendor = (vendorId: string, vendorName: string) => {
    if (!permissions.canDelete) {
      alert(t('មានតែ Admin ទើបមានសិទ្ធិលុបអ្នកលក់!', 'Permission Denied: Only Admin can delete vendor.'));
      return;
    }
    if (window.confirm(t(`តើអ្នកពិតជាចង់លុបអ្នកលក់ «${vendorName}» មែនទេ?`, `Are you sure you want to delete vendor "${vendorName}"?`))) {
      deleteCanteenVendor(vendorId);
    }
  };

  const handleAddDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDateInput) return;
    // format YYYY-MM-DD to e.g. "24-Oct-26"
    const [y, m, d] = newDateInput.split('-');
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = parseInt(m, 10) - 1;
    const mStr = monthNamesShort[mIdx] || 'Oct';
    const dayNum = parseInt(d, 10);
    const yrStr = y.slice(-2);
    const dateFormatted = `${dayNum}-${mStr}-${yrStr}`;

    const res = addCanteenDailyRecord(dateFormatted, newDateDefaultStatus);
    if (res.success) {
      setIsAddDateOpen(false);
      setDateError(null);
    } else {
      setDateError(res.error || 'កាលបរិច្ឆេទនេះមានរួចហើយ!');
    }
  };

  const handleAutoPopulateMonth = (mode: 'weekdays_only' | 'all_days') => {
    autoPopulateFullMonthDates(mode);
    setIsAutoMonthModalOpen(false);
    setAutoMonthSuccessMessage(
      mode === 'weekdays_only'
        ? t('បានបង្កើតកាលបរិច្ឆេទថ្ងៃចន្ទ-សុក្រពេញមួយខែជោគជ័យ!', 'Successfully generated weekday dates for full month!')
        : t('បានបង្កើតកាលបរិច្ឆេទគ្រប់ថ្ងៃពេញមួយខែជោគជ័យ!', 'Successfully generated all calendar dates for full month!')
    );
    setTimeout(() => setAutoMonthSuccessMessage(null), 4000);
  };

  const handleCreateMonthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCanteenMonthRecord(newMonthName.trim(), Number(newYear) || 2026);
    setIsNewMonthOpen(false);
  };

  const activeVendorForModal = selectedCell
    ? currentCanteenReport.vendors.find((v) => v.id === selectedCell.vendorId)
    : null;

  return (
    <div className="space-y-6 w-full">
      {/* Monthly History Switcher Strip (Multi-month archive with Auto-Sorting & Drag-and-Drop) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs w-full flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left & Center: Month Label + Horizontally Scrollable Pills */}
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          <span className="text-xs font-semibold text-slate-500 font-khmer flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span className="whitespace-nowrap">{t('កំណត់ត្រាប្រចាំខែ:', 'Monthly Records:')}</span>
          </span>

          {/* Month Tabs Strip with Scroll Controls & Zero Scrollbar */}
          <div className="relative flex items-center min-w-0 flex-1 overflow-hidden">
            <button
              type="button"
              onClick={() => scrollMonthPills('left')}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md shrink-0 transition-colors cursor-pointer"
              title={t('រំកិលទៅឆ្វេង', 'Scroll Left')}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div
              ref={monthScrollRef}
              data-no-scrollbar="true"
              className="flex items-center gap-1.5 overflow-x-auto overflow-y-hidden no-scrollbar hide-scrollbar py-1 px-1 min-w-0 flex-1 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {sortedCanteenMonths.map((monthKey, index) => {
                const isSelected = selectedCanteenMonth === monthKey;
                const r = canteenHistory[monthKey];
                const sum = r ? r.dailyRecords.reduce((acc, curr) => acc + curr.dailyTotalKHR, 0) : 0;
                const info = parseMonthYearKey(monthKey);
                const khmerMonthLabel = MONTH_NAMES_KH[info.month] ? MONTH_NAMES_KH[info.month].split(' ')[0] : info.month;

                return (
                  <div
                    key={monthKey}
                    draggable={permissions.canEdit}
                    onDragStart={(e) => {
                      setDraggedMonthIndex(index);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedMonthIndex === null || draggedMonthIndex === index) return;
                      const updated = [...sortedCanteenMonths];
                      const [moved] = updated.splice(draggedMonthIndex, 1);
                      updated.splice(index, 0, moved);
                      setCustomMonthOrder(updated);
                      setMonthSortMode('custom');
                      try {
                        localStorage.setItem('BIM_RANGSEI_CANTEEN_CUSTOM_MONTH_ORDER', JSON.stringify(updated));
                        localStorage.setItem('BIM_RANGSEI_CANTEEN_MONTH_SORT', 'custom');
                      } catch (err) {
                        console.error(err);
                      }
                      setDraggedMonthIndex(null);
                    }}
                    className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all font-khmer select-none ${
                      draggedMonthIndex === index ? 'opacity-40 scale-95 ring-2 ring-amber-400' : ''
                    } ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
                    }`}
                  >
                    {permissions.canEdit && (
                      <span
                        className="cursor-grab active:cursor-grabbing text-slate-400 group-hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity -ml-1"
                        title={t('អូសដើម្បីរៀបចំលំដាប់ខែ', 'Drag to reorder month')}
                      >
                        <GripVertical className="w-3 h-3" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedCanteenMonth(monthKey)}
                      className="flex items-center gap-1.5 cursor-pointer text-left"
                      title={`${monthKey} (${khmerMonthLabel})`}
                    >
                      <span>{monthKey}</span>
                      <span className="text-[10px] opacity-75 font-normal">({khmerMonthLabel})</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums ${
                          isSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {(sum / 1000).toFixed(0)}k៛
                      </span>
                    </button>

                    {/* Delete month if more than 1 month and permissions.canDelete */}
                    {permissions.canDelete && sortedCanteenMonths.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMonth(monthKey);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-0.5 rounded transition-all"
                        title={`លុបកំណត់ត្រាខែ ${monthKey}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => scrollMonthPills('right')}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md shrink-0 transition-colors cursor-pointer"
              title={t('រំកិលទៅស្តាំ', 'Scroll Right')}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Side: Action Cluster (Sort Dropdown & New Month Button) */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {/* Quick Month Auto-Sort Menu Button */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSortDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-700 hover:text-slate-900 text-xs font-khmer font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
              title={t('តម្រៀបខែស្វ័យប្រវត្តិ (Auto-Sort Months)', 'Auto-Sort Months')}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                {monthSortMode === 'chrono_asc' && t('តម្រៀប: ចាស់ទៅថ្មី', 'Sort: Oldest First')}
                {monthSortMode === 'chrono_desc' && t('តម្រៀប: ថ្មីទៅចាស់', 'Sort: Newest First')}
                {monthSortMode === 'academic' && t('តម្រៀប: ឆ្នាំសិក្សា', 'Sort: Academic Year')}
                {monthSortMode === 'custom' && t('តម្រៀប: តាមចិត្ត', 'Sort: Custom Order')}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
                  isSortDropdownOpen ? 'rotate-180 text-amber-600' : ''
                }`}
              />
            </button>

            {isSortDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs font-khmer animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  {t('ជម្រើសតម្រៀបខែស្វ័យប្រវត្តិ', 'Auto-Sort Options')}
                </div>
                <button
                  type="button"
                  onClick={() => handleSetSortMode('chrono_asc')}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    monthSortMode === 'chrono_asc' ? 'bg-amber-50 text-amber-900 font-bold' : 'text-slate-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">📅 {t('ពីខែចាស់ទៅថ្មី (Chronological)', 'Oldest to Newest')}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Sep 2026 ➔ Oct 2026 ➔ Nov 2026</span>
                  </div>
                  {monthSortMode === 'chrono_asc' && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSetSortMode('chrono_desc')}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    monthSortMode === 'chrono_desc' ? 'bg-amber-50 text-amber-900 font-bold' : 'text-slate-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">⏳ {t('ពីខែថ្មីទៅចាស់ (Newest First)', 'Newest to Oldest')}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Nov 2026 ➔ Oct 2026 ➔ Sep 2026</span>
                  </div>
                  {monthSortMode === 'chrono_desc' && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSetSortMode('academic')}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    monthSortMode === 'academic' ? 'bg-amber-50 text-amber-900 font-bold' : 'text-slate-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">🎓 {t('តាមឆ្នាំសិក្សា (Academic Year)', 'Academic Year Order')}</span>
                    <span className="text-[10px] text-slate-400 font-mono">តុលា ➔ វិច្ឆិកា ... ➔ កញ្ញា</span>
                  </div>
                  {monthSortMode === 'academic' && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                </button>
              </div>
            )}
          </div>

          {permissions.canEdit && (
            <button
              onClick={() => setIsNewMonthOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-khmer shrink-0 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('បង្កើតខែថ្មី', '+ New Month')}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-500 shrink-0">
          <span>Archive:</span>
          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {selectedCanteenMonth}
          </span>
        </div>
      </div>

      {/* Main Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center text-white shadow-xs">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-700 font-khmer">
                សាលា អ៊ីរ៉ែលកម្ពុជា · BIM Rangsei School
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5 font-khmer">
                បញ្ជីឈ្មោះអ្នកលក់អាហារក្នុងបរិវេណសាលាប្រចាំខែ {currentCanteenReport.month} {currentCanteenReport.year}
              </h2>
              <div className="text-xs text-slate-500 font-medium">
                Canteen Food Vendor Daily Space Fee Collection Ledger ({currentCanteenReport.month} {currentCanteenReport.year})
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
              <div className="text-[10px] text-amber-800 font-bold uppercase font-khmer">
                {t('ចំណូលអាហារដ្ឋានប្រចាំខែ', 'Monthly Canteen Revenue')}
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {grandTotalKHR.toLocaleString()} <span className="text-sm font-normal font-khmer">៛</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 border-l border-slate-200 flex-wrap">
              {permissions.canEdit && (
                <>
                  {/* Add Date Button */}
                  <button
                    onClick={() => {
                      setNewDateInput(new Date().toISOString().split('T')[0]);
                      setDateError(null);
                      setIsAddDateOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs font-khmer"
                    title={t('បន្ថែមកាលបរិច្ឆេទបង់ប្រាក់ឈ្នួលតូប (Add Payment Date)', 'Add Stall Payment Date')}
                  >
                    <CalendarPlus className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">{t('បន្ថែមកាលបរិច្ឆេទ', 'Add Date')}</span>
                  </button>

                  {/* Auto-fill Full Month Dates Button */}
                  <button
                    onClick={() => setIsAutoMonthModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-2xs font-khmer"
                    title={t('ដាក់កាលបរិច្ឆេទពេញមួយខែដោយស្វ័យប្រវត្តិ (Auto-fill Full Month)', 'Auto-fill Full Month Dates')}
                  >
                    <Sparkles className="w-4 h-4 text-slate-950 shrink-0" />
                    <span className="hidden sm:inline">{t('ពេញមួយខែស្វ័យប្រវត្តិ', 'Auto Month')}</span>
                  </button>

                  {/* Edit/Manage Vendors Button */}
                  <button
                    onClick={() => setIsManageVendorsOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs font-khmer"
                    title={t('កែប្រែឈ្មោះអ្នកលក់អាហារក្នុងបរិវេណសាលា (Edit Vendors)', 'Edit Vendor Names & Stalls')}
                  >
                    <Users className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="hidden sm:inline">{t('កែប្រែអ្នកលក់', 'Edit Vendors')}</span>
                  </button>

                  {/* Add Vendor Button */}
                  <button
                    onClick={() => setIsAddVendorOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs font-khmer"
                    title={t('បន្ថែមតូបលក់ថ្មី (Add Stall Vendor)', 'Add Stall Vendor')}
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">{t('បន្ថែមតូបថ្មី', 'Add Stall')}</span>
                  </button>
                </>
              )}

              {onPrintReport && (
                <button
                  onClick={onPrintReport}
                  className="p-2 sm:p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium transition-colors"
                  title="Print Vendor Attendance Report"
                >
                  <Printer className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Auto Month Success Toast Banner */}
        {autoMonthSuccessMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-khmer flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{autoMonthSuccessMessage}</span>
            </div>
            <button
              onClick={() => setAutoMonthSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium font-khmer">ពណ៌សម្គាល់វត្តមាន:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-white border border-slate-300"></div>
            <span className="text-slate-700">10,000៛ (បានបង់ធម្មតា)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-red-600"></div>
            <span className="text-slate-700 font-medium font-khmer">ប្រអប់ក្រហម (ឈប់លក់ - 0៛)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-blue-50 border border-blue-300"></div>
            <span className="text-slate-700">20,000៛ (ទូទាត់ជំពាក់ / ២ថ្ងៃ)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-amber-50 border border-amber-300 text-amber-800 text-[10px] text-center font-bold">
              -
            </div>
            <span className="text-slate-700 font-khmer">-៛ (ជំពាក់ / មិនទាន់បង់)</span>
          </div>
        </div>

        {/* Filter Strip (Filter for all!) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ស្វែងរកកាលបរិច្ឆេទ (Date)', 'Search Date')}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="search"
                placeholder="ឧ. 7-Sep, 15-Oct..."
                value={searchDateQuery}
                onChange={(e) => setSearchDateQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ជ្រើសរើសអាជីវករ', 'Select Vendor')}
            </label>
            <select
              value={filterVendorId}
              onChange={(e) => setFilterVendorId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50 font-bold"
            >
              <option value="all">{t('អាជីវករទាំងអស់ (All Vendors)', 'All Vendors')}</option>
              {currentCanteenReport.vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.stallName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ស្ថានភាពវត្តមាន', 'Attendance Status')}
            </label>
            <select
              value={filterAttendanceStatus}
              onChange={(e) => setFilterAttendanceStatus(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50"
            >
              <option value="all">{t('គ្រប់ស្ថានភាព (All)', 'All')}</option>
              <option value="paid">បានបង់ (10,000៛)</option>
              <option value="double_paid">បង់ទ្វេដង (20,000៛)</option>
              <option value="absent">ឈប់លក់ (Absent)</option>
              <option value="unpaid">ជំពាក់ (-៛)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 mt-2 font-khmer">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              បង្ហាញកាលបរិច្ឆេទចំនួន <strong>{sortedDailyRecords.length}</strong> ថ្ងៃ (ក្នុងចំណោមសរុប {currentCanteenReport.dailyRecords.length} ថ្ងៃ)
            </span>
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">
              Sorted by: {dailySortField} ({dailySortDirection.toUpperCase()})
            </span>
          </div>
          <div className="flex items-center gap-3">
            {(dailySortField !== 'date' || dailySortDirection !== 'asc') && (
              <button
                type="button"
                onClick={() => {
                  setDailySortField('date');
                  setDailySortDirection('asc');
                }}
                className="text-blue-600 hover:text-blue-800 font-bold font-khmer cursor-pointer text-xs"
              >
                ↺ តម្រៀបថ្ងៃឡើងវិញ (Reset Date Sort)
              </button>
            )}
            {(searchDateQuery || filterVendorId !== 'all' || filterAttendanceStatus !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchDateQuery('');
                  setFilterVendorId('all');
                  setFilterAttendanceStatus('all');
                }}
                className="text-amber-700 hover:text-amber-800 font-bold cursor-pointer"
              >
                ✕ កំណត់តម្រងឡើងវិញ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Full-Width Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-blue-700 text-white font-bold border-b border-blue-800 select-none">
                <th
                  onClick={() => handleDailySort('date')}
                  className="py-2.5 px-4 border-r border-blue-600 font-khmer text-center w-28 cursor-pointer hover:bg-blue-800 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមកាលបរិច្ឆេទ', 'Sort by Date')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>កាលបរិច្ឆេទ</span>
                    {dailySortField === 'date' ? (
                      dailySortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-white inline-block ml-1 font-extrabold stroke-[2.5]" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-white inline-block ml-1 font-extrabold stroke-[2.5]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-blue-200 group-hover:text-white opacity-60 inline-block ml-1" />
                    )}
                  </div>
                </th>
                {currentCanteenReport.vendors
                  .filter((v) => filterVendorId === 'all' || v.id === filterVendorId)
                  .map((v) => (
                    <th
                      key={v.id}
                      className="py-2.5 px-3 border-r border-blue-600 font-khmer text-center group cursor-pointer hover:bg-blue-800 transition-colors"
                      onClick={() => openEditVendor(v)}
                      title={`ចុចដើម្បីកែប្រែឈ្មោះ ${v.name} (${v.stallName})`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold">{v.name}</span>
                        {permissions.canEdit && (
                          <Edit2 className="w-3 h-3 text-amber-300 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] font-normal text-blue-200 truncate max-w-[110px] mx-auto mt-0.5">
                        {v.stallName}
                      </div>
                    </th>
                  ))}
                <th
                  onClick={() => handleDailySort('vendorCount')}
                  className="py-2.5 px-3 border-r border-blue-600 font-khmer text-center w-16 cursor-pointer hover:bg-blue-800 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមចំនួនតូបលក់', 'Sort by Vendor Count')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>ចំនួន</span>
                    {dailySortField === 'vendorCount' ? (
                      dailySortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-white inline-block ml-1 font-extrabold stroke-[2.5]" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-white inline-block ml-1 font-extrabold stroke-[2.5]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-blue-200 group-hover:text-white opacity-60 inline-block ml-1" />
                    )}
                  </div>
                </th>
                <th className="py-2.5 px-3 border-r border-blue-600 font-khmer text-right w-28">
                  ទឹកប្រាក់ត្រូវបង់
                </th>
                <th
                  onClick={() => handleDailySort('dailyTotalKHR')}
                  className="py-2.5 px-4 border-r border-blue-600 font-khmer text-right w-28 cursor-pointer hover:bg-blue-800 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមទឹកប្រាក់សរុបប្រចាំថ្ងៃ', 'Sort by Daily Total')}
                >
                  <div className="inline-flex items-center justify-end">
                    <span>សរុប</span>
                    {dailySortField === 'dailyTotalKHR' ? (
                      dailySortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-white inline-block ml-1 font-extrabold stroke-[2.5]" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-white inline-block ml-1 font-extrabold stroke-[2.5]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-blue-200 group-hover:text-white opacity-60 inline-block ml-1" />
                    )}
                  </div>
                </th>
                <th className="py-2.5 px-4 font-khmer text-center min-w-[120px]">
                  ផ្សេងៗ (Notes)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedDailyRecords.length === 0 ? (
                <tr>
                  <td colSpan={currentCanteenReport.vendors.length + 5} className="py-8 text-center text-slate-400 font-khmer">
                    មិនមានទិន្នន័យត្រូវនឹងតម្រងខាងលើឡើយ
                  </td>
                </tr>
              ) : (
                sortedDailyRecords.map((record, rIdx) => {
                  return (
                    <tr key={record.date} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-4 border-r border-slate-200 font-mono font-bold text-slate-900 text-center">
                        {record.date}
                      </td>

                      {currentCanteenReport.vendors
                        .filter((v) => filterVendorId === 'all' || v.id === filterVendorId)
                        .map((vendor) => {
                          const vStatus = record.vendorStatus[vendor.id];
                          const status = vStatus?.status || 'paid';
                          const amount = vStatus?.amountKHR ?? 10000;

                          if (status === 'absent') {
                            return (
                              <td
                                key={vendor.id}
                                onClick={() => openStatusEditor(record.date, vendor.id)}
                                className="border-r border-slate-200 bg-red-600 hover:bg-red-700 text-white font-khmer font-bold text-center cursor-pointer text-xs"
                                title="ឈប់ (Absent) - Click to edit"
                              >
                                {vStatus?.note || 'ឈប់'}
                              </td>
                            );
                          }

                          if (status === 'double_paid') {
                            return (
                              <td
                                key={vendor.id}
                                onClick={() => openStatusEditor(record.date, vendor.id)}
                                className="border-r border-slate-200 bg-blue-50 hover:bg-blue-100 font-mono text-center font-bold text-blue-900 cursor-pointer tabular-nums"
                                title="20,000៛ (Double / Debt paid) - Click to edit"
                              >
                                {amount.toLocaleString()}៛
                              </td>
                            );
                          }

                          if (status === 'unpaid') {
                            return (
                              <td
                                key={vendor.id}
                                onClick={() => openStatusEditor(record.date, vendor.id)}
                                className="border-r border-slate-200 bg-amber-50 hover:bg-amber-100 text-center font-mono font-bold text-amber-800 cursor-pointer"
                                title="Pending payment - Click to edit"
                              >
                                {vStatus?.note || '-៛'}
                              </td>
                            );
                          }

                          return (
                            <td
                              key={vendor.id}
                              onClick={() => openStatusEditor(record.date, vendor.id)}
                              className="border-r border-slate-200 font-mono text-center text-slate-900 hover:bg-slate-100 cursor-pointer tabular-nums"
                              title="10,000៛ (Paid) - Click to edit"
                            >
                              {amount.toLocaleString()}៛
                            </td>
                          );
                        })}

                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-center font-bold text-slate-800 tabular-nums">
                        {record.vendorCount}
                      </td>

                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-right tabular-nums text-slate-600">
                        {record.standardFeeKHR.toLocaleString()}៛
                      </td>

                      <td className="py-2 px-4 border-r border-slate-200 font-mono text-right font-bold text-slate-900 tabular-nums bg-slate-50/60">
                        {record.dailyTotalKHR.toLocaleString()}៛
                      </td>

                      <td className="py-2 px-4 font-khmer text-slate-500 text-center">
                        {record.otherNote || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-950">
                <td className="py-2.5 px-4 font-khmer text-center border-r border-slate-800">
                  សរុបប្រចាំខែ
                </td>
                {currentCanteenReport.vendors
                  .filter((v) => filterVendorId === 'all' || v.id === filterVendorId)
                  .map((vendor) => {
                    const vendorMonthTotal = currentCanteenReport.dailyRecords.reduce((sum, r) => {
                      const stat = r.vendorStatus[vendor.id];
                      return sum + (stat?.amountKHR || (stat?.status === 'absent' || stat?.status === 'unpaid' ? 0 : 10000));
                    }, 0);
                    return (
                      <td key={vendor.id} className="py-2.5 px-2 text-center font-mono border-r border-slate-800 tabular-nums text-amber-300">
                        {(vendorMonthTotal / 1000).toFixed(0)}k៛
                      </td>
                    );
                  })}
                <td className="py-2.5 px-3 text-center font-mono border-r border-slate-800 tabular-nums">
                  {totalVendorDays}
                </td>
                <td className="py-2.5 px-3 text-right font-mono border-r border-slate-800 tabular-nums">
                  10,000៛
                </td>
                <td className="py-2.5 px-4 text-right font-mono font-black text-amber-400 text-sm tabular-nums border-r border-slate-800">
                  {grandTotalKHR.toLocaleString()} ៛
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* CELL STATUS EDITOR MODAL (Correct input field types & Telegram notification) */}
      {isCellModalOpen && selectedCell && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base font-khmer">
                {t('កត់ត្រាវត្តមាន & ថ្លៃទីតាំង', 'Edit Vendor Attendance & Fee')}
              </h3>
              <button onClick={() => setIsCellModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCellStatus} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold font-khmer text-sm text-slate-900">
                    {activeVendorForModal?.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-khmer mt-0.5">
                    {activeVendorForModal?.stallName}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Date</span>
                  <div className="font-mono font-bold text-slate-900">{selectedCell.date}</div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5 font-khmer">
                  ស្ថានភាពវត្តមាន (Status)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCellStatus('paid');
                      setCellAmount(10000);
                      setCellNote('');
                    }}
                    className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                      cellStatus === 'paid'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>10,000៛ (Paid)</div>
                    <div className="text-[10px] text-slate-500">បានបង់ធម្មតា</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCellStatus('absent');
                      setCellAmount(0);
                      setCellNote('ឈប់');
                    }}
                    className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                      cellStatus === 'absent'
                        ? 'border-red-600 bg-red-50 text-red-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-red-700 font-bold">ឈប់ (Absent)</div>
                    <div className="text-[10px] text-slate-500">ប្រអប់ក្រហម (0៛)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCellStatus('double_paid');
                      setCellAmount(20000);
                      setCellNote('ទូទាត់');
                    }}
                    className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                      cellStatus === 'double_paid'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>20,000៛ (Double)</div>
                    <div className="text-[10px] text-slate-500">ទូទាត់ជំពាក់ / ២ថ្ងៃ</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCellStatus('unpaid');
                      setCellAmount(0);
                      setCellNote('-៛');
                    }}
                    className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                      cellStatus === 'unpaid'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-amber-800 font-bold">-៛ (Pending)</div>
                    <div className="text-[10px] text-slate-500">មកលក់ តែជំពាក់</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ចំនួនទឹកប្រាក់ប្រមូលបាន (៛ KHR)
                </label>
                <input
                  type="number"
                  step="500"
                  min="0"
                  inputMode="numeric"
                  value={cellAmount}
                  onChange={(e) => setCellAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-sm bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              {(cellStatus === 'paid' || cellStatus === 'double_paid') && (
                <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-[11px] flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>ការទូទាត់នេះនឹងផ្ញើសារជូនដំណឹង Telegram Alert ភ្លាមៗ</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCellModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold font-khmer shadow-xs"
                >
                  រក្សាទុក
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW MONTH MODAL */}
      {isNewMonthOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base font-khmer">
                {t('បង្កើតខែរបាយការណ៍អាហារដ្ឋានថ្មី', 'Create New Canteen Month')}
              </h3>
              <button onClick={() => setIsNewMonthOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMonthSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">ខែ (Month) *</label>
                <select
                  value={newMonthName}
                  onChange={(e) => setNewMonthName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold font-khmer bg-slate-50"
                >
                  {MONTH_NAMES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">ឆ្នាំ (Year) *</label>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewMonthOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold font-khmer"
                >
                  បង្កើតខែថ្មី
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD VENDOR MODAL */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base font-khmer">
                {t('បន្ថែមតូបលក់អាហារថ្មី', 'Add New Food Stall Vendor')}
              </h3>
              <button onClick={() => setIsAddVendorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVendorSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">ឈ្មោះអ្នកលក់ *</label>
                <input
                  type="text"
                  placeholder="ឧ. អ៊ុំសុខា"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">ឈ្មោះតូប / មុខម្ហូប</label>
                <input
                  type="text"
                  placeholder="ឧ. តូបគុយទាវ & បាយឆា"
                  value={newVendorStall}
                  onChange={(e) => setNewVendorStall(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">លេខទូរស័ព្ទ (Phone)</label>
                <input
                  type="tel"
                  placeholder="012 345 678"
                  value={newVendorPhone}
                  onChange={(e) => setNewVendorPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">តម្លៃទីតាំងប្រចាំថ្ងៃ (៛ KHR) *</label>
                <input
                  type="number"
                  step="500"
                  min="0"
                  inputMode="numeric"
                  value={newVendorFee}
                  onChange={(e) => setNewVendorFee(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddVendorOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold font-khmer"
                >
                  បន្ថែមតូប
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VENDOR MODAL (កែប្រែឈ្មោះអ្នកលក់) */}
      {isEditVendorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base font-khmer">
                  {t('កែប្រែព័ត៌មានអ្នកលក់អាហារ', 'Edit Canteen Food Vendor')}
                </h3>
              </div>
              <button onClick={() => setIsEditVendorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditVendorSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ឈ្មោះអ្នកលក់ * (Vendor Name)
                </label>
                <input
                  type="text"
                  value={editVendorName}
                  onChange={(e) => setEditVendorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer font-bold text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ឈ្មោះតូប / មុខម្ហូប (Stall Name)
                </label>
                <input
                  type="text"
                  value={editVendorStall}
                  onChange={(e) => setEditVendorStall(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  លេខទូរស័ព្ទទាក់ទង (Phone Number)
                </label>
                <input
                  type="tel"
                  placeholder="012 345 678"
                  value={editVendorPhone}
                  onChange={(e) => setEditVendorPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  តម្លៃទីតាំងប្រចាំថ្ងៃ (៛ KHR) *
                </label>
                <input
                  type="number"
                  step="500"
                  min="0"
                  inputMode="numeric"
                  value={editVendorFee}
                  onChange={(e) => setEditVendorFee(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditVendorOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer hover:text-slate-800"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold font-khmer transition-colors shadow-xs"
                >
                  រក្សាទុកការកែប្រែ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE VENDORS MODAL (គ្រប់គ្រងអ្នកលក់ & លុប/កែប្រែ) */}
      {isManageVendorsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base font-khmer">
                  {t('គ្រប់គ្រងអ្នកលក់អាហារក្នុងបរិវេណសាលា', 'Manage Food Vendors')}
                </h3>
              </div>
              <button onClick={() => setIsManageVendorsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
              {currentCanteenReport.vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-bold font-khmer text-slate-900 text-sm">
                      {vendor.name}
                    </div>
                    <div className="text-[11px] font-khmer text-slate-500">
                      {vendor.stallName} · <span className="font-mono font-semibold text-emerald-700">{(vendor.dailyFeeKHR || 10000).toLocaleString()}៛/ថ្ងៃ</span>
                    </div>
                    {vendor.phone && (
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Tel: {vendor.phone}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsManageVendorsOpen(false);
                        openEditVendor(vendor);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-khmer font-bold text-xs transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>កែប្រែ</span>
                    </button>
                    {permissions.canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                        title={`លុបអ្នកលក់ ${vendor.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsManageVendorsOpen(false);
                  setIsAddVendorOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold font-khmer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>បន្ថែមតូបថ្មី</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManageVendorsOpen(false)}
                className="px-4 py-2 text-slate-600 font-khmer hover:text-slate-900"
              >
                បិទ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PAYMENT DATE MODAL (បន្ថែមកាលបរិច្ឆេទបង់ប្រាក់ឈ្នួលតូប) */}
      {isAddDateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base font-khmer">
                  {t('បន្ថែមកាលបរិច្ឆេទបង់ប្រាក់ឈ្នួលតូប', 'Add Stall Rental Date')}
                </h3>
              </div>
              <button onClick={() => setIsAddDateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ជ្រើសរើសកាលបរិច្ឆេទ (Select Date) *
                </label>
                <input
                  type="date"
                  value={newDateInput}
                  onChange={(e) => {
                    setNewDateInput(e.target.value);
                    setDateError(null);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5 font-khmer">
                  ស្ថានភាពលំនាំដើមសម្រាប់តូបទាំងអស់ (Default Status)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDateDefaultStatus('paid')}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      newDateDefaultStatus === 'paid'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-khmer font-bold">បានបង់</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">10,000៛</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewDateDefaultStatus('unpaid')}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      newDateDefaultStatus === 'unpaid'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-khmer font-bold">ជំពាក់</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">-៛ (0៛)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewDateDefaultStatus('absent')}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      newDateDefaultStatus === 'absent'
                        ? 'border-red-600 bg-red-50 text-red-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-khmer font-bold text-red-700">ឈប់លក់</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">0៛</div>
                  </button>
                </div>
              </div>

              {dateError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-khmer text-xs">
                  {dateError}
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-khmer">
                កាលបរិច្ឆេទថ្មីនេះ នឹងត្រូវបញ្ចូលទៅក្នុងតារាងតាមដានវត្តមាន និងប្រាក់ឈ្នួលតូបអាហារដ្ឋានប្រចាំខែ {currentCanteenReport.month}។
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDateOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer hover:text-slate-800"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold font-khmer transition-colors shadow-xs"
                >
                  បន្ថែមកាលបរិច្ឆេទ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUTO FULL MONTH MODAL (ដាក់កាលបរិច្ឆេទពេញមួយខែដោយស្វ័យប្រវត្តិ) */}
      {isAutoMonthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-base font-khmer">
                  {t('ដាក់កាលបរិច្ឆេទពេញមួយខែស្វ័យប្រវត្តិ', 'Auto-fill Full Month Dates')}
                </h3>
              </div>
              <button onClick={() => setIsAutoMonthModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-khmer">
                ប្រព័ន្ធនឹងបង្កើតកាលបរិច្ឆេទពេញមួយខែសម្រាប់ <strong>{currentCanteenReport.month} {currentCanteenReport.year}</strong> ដោយស្វ័យប្រវត្តិ។ រាល់ទិន្នន័យដែលបានកត់ត្រារួចហើយ នឹងរក្សាទុកដដែល មិនបាត់បង់ឡើយ។
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleAutoPopulateMonth('weekdays_only')}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-slate-900 bg-white hover:bg-slate-50 text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-khmer text-slate-900 text-sm">
                      ១. ថ្ងៃចន្ទ ដល់ សុក្រ (Weekdays Only)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold group-hover:bg-slate-900 group-hover:text-white">
                      ចន្ទ-សុក្រ
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-khmer mt-1">
                    បង្កើតកាលបរិច្ឆេទសម្រាប់ថ្ងៃសិក្សាធម្មតា (មិនរាប់បញ្ចូលថ្ងៃសៅរ៍ និងអាទិត្យ)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAutoPopulateMonth('all_days')}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-slate-900 bg-white hover:bg-slate-50 text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-khmer text-slate-900 text-sm">
                      ២. គ្រប់ថ្ងៃទាំងអស់ក្នុងខែ (All Calendar Days)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold group-hover:bg-slate-900 group-hover:text-white">
                      ថ្ងៃទី ១ ដល់ ៣១
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-khmer mt-1">
                    បង្កើតកាលបរិច្ឆេទគ្រប់ថ្ងៃទាំងអស់ក្នុងខែ (រាប់បញ្ចូលទាំងថ្ងៃចុងសប្តាហ៍)
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAutoMonthModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer hover:text-slate-800"
                >
                  បោះបង់
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
