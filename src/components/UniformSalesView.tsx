import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MONTH_NAMES, MONTH_NAMES_KH, UniformTypeConfig } from '../types';
import { SearchableSelect, SearchOption } from './SearchableSelect';
import {
  Shirt,
  Printer,
  Plus,
  X,
  Calendar,
  Search,
  DollarSign,
  Send,
  Tag,
  Settings,
  Trash2,
  Check,
  RotateCcw,
  SlidersHorizontal,
  GripVertical,
  ArrowDown,
  ArrowUp,
  Edit2,
  Edit3,
  Save,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type UniformMonthSortMode = 'chrono_asc' | 'chrono_desc' | 'academic' | 'custom';

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

interface UniformSalesViewProps {
  onPrintReport?: () => void;
}

export const UniformSalesView: React.FC<UniformSalesViewProps> = ({ onPrintReport }) => {
  const {
    uniformHistory,
    selectedUniformMonth,
    setSelectedUniformMonth,
    uniformReport,
    createUniformMonthRecord,
    deleteUniformMonthRecord,
    academicMonths,
    recordUniformSale,
    syncUniformMatrixFromLedger,
    classData,
    uniformTypes,
    addUniformType,
    addUniformSize,
    deleteUniformType,
    deleteUniformSize,
    updateUniformSize,
    updateUniformType,
    deleteUniformDailyRecord,
    updateUniformDailyQty,
    permissions,
    t,
  } = useApp();

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);
  const [isNewTypeModalOpen, setIsNewTypeModalOpen] = useState(false);
  const [isAddSizeModalOpen, setIsAddSizeModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isEditTypeModalOpen, setIsEditTypeModalOpen] = useState(false);

  // Edit Uniform Item Form State
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editTypeNameKhmer, setEditTypeNameKhmer] = useState<string>('');
  const [editTypeNameEnglish, setEditTypeNameEnglish] = useState<string>('');
  const [editTypePriceKHR, setEditTypePriceKHR] = useState<number>(30000);
  const [editTypeDesc, setEditTypeDesc] = useState<string>('');
  const [editTypeSizes, setEditTypeSizes] = useState<string[]>([]);
  const [newSizeInEditModal, setNewSizeInEditModal] = useState<string>('');
  const [renamingSizeIdx, setRenamingSizeIdx] = useState<number | null>(null);
  const [renamingSizeValue, setRenamingSizeValue] = useState<string>('');

  // Inline Cell Editing State
  const [editingCell, setEditingCell] = useState<{ typeId: string; date: string; size: string } | null>(null);
  const [cellInputValue, setCellInputValue] = useState<string>('');

  // New Month Form
  const [newMonthName, setNewMonthName] = useState<string>('November');
  const [newMonthYear, setNewMonthYear] = useState<number>(2026);

  // Month Sorting & Drag-Drop State
  const [monthSortMode, setMonthSortMode] = useState<UniformMonthSortMode>(() => {
    const saved = localStorage.getItem('BIM_RANGSEI_UNIFORM_MONTH_SORT');
    return (saved as UniformMonthSortMode) || 'chrono_asc';
  });

  const [customMonthOrder, setCustomMonthOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('BIM_RANGSEI_UNIFORM_CUSTOM_MONTH_ORDER');
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

  const handleSetSortMode = (mode: UniformMonthSortMode) => {
    setMonthSortMode(mode);
    setIsSortDropdownOpen(false);
    try {
      localStorage.setItem('BIM_RANGSEI_UNIFORM_MONTH_SORT', mode);
    } catch (e) {
      console.error(e);
    }
  };

  // Compute automatically sorted month keys
  const sortedUniformMonths = useMemo(() => {
    const allKeys = Object.keys(uniformHistory);

    if (monthSortMode === 'custom' && customMonthOrder.length > 0) {
      const ordered: string[] = [];
      const added = new Set<string>();
      customMonthOrder.forEach((k) => {
        if (uniformHistory[k]) {
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

      // Default 'chrono_asc'
      return infoA.timestamp - infoB.timestamp;
    });
  }, [uniformHistory, monthSortMode, customMonthOrder, academicMonths]);

  const handleDeleteMonth = (monthKey: string) => {
    if (!permissions.canDelete) {
      alert(t('មានតែ Admin ទើបមានសិទ្ធិលុបកំណត់ត្រាខែ!', 'Permission Denied: Only Admin can delete monthly records.'));
      return;
    }
    if (sortedUniformMonths.length <= 1) {
      alert(t('មិនអាចលុបខែចុងក្រោយបង្អស់បានទេ!', 'Cannot delete the only remaining month!'));
      return;
    }
    if (window.confirm(t(`តើអ្នកពិតជាចង់លុបកំណត់ត្រាខែ «${monthKey}» មែនទេ?`, `Are you sure you want to delete month record "${monthKey}"?`))) {
      deleteUniformMonthRecord(monthKey);
    }
  };

  // Record Sale Form
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [saleType, setSaleType] = useState<string>(uniformTypes[0]?.id || 'general_shirt');
  const [saleSize, setSaleSize] = useState<string>('S');
  const [saleQty, setSaleQty] = useState<number>(1);
  const [saleCustomPrice, setSaleCustomPrice] = useState<number>(30000);
  const [saleBuyer, setSaleBuyer] = useState<string>('');
  const [selectedStudentCode, setSelectedStudentCode] = useState<string>('');
  const [saleClassId, setSaleClassId] = useState<string>('');
  const [salePaymentMethod, setSalePaymentMethod] = useState<'Cash' | 'ABA' | 'AC'>('Cash');
  const [inlineNewSize, setInlineNewSize] = useState<string>('');
  const [showInlineAddSize, setShowInlineAddSize] = useState<boolean>(false);

  // Flatten registered students for searchable buyer selection
  const studentOptions: SearchOption[] = useMemo(() => {
    const list: SearchOption[] = [];
    Object.values(classData).forEach((cls) => {
      cls.students.forEach((st) => {
        list.push({
          id: st.studentCode,
          label: `${st.name} ${st.latinName ? `(${st.latinName})` : ''}`,
          subLabel: cls.className,
          badge: st.studentCode,
          data: { ...st, classId: cls.classId, className: cls.className },
        });
      });
    });
    return list;
  }, [classData]);

  // New Uniform Type Form
  const [newTypeNameKhmer, setNewTypeNameKhmer] = useState<string>('');
  const [newTypeNameEnglish, setNewTypeNameEnglish] = useState<string>('');
  const [newTypePriceKHR, setNewTypePriceKHR] = useState<number>(30000);
  const [newTypeSizesInput, setNewTypeSizesInput] = useState<string>('S, M, L, XL, XXL');
  const [newTypeDesc, setNewTypeDesc] = useState<string>('');

  // Add Size Form (Global modal)
  const [targetTypeIdForSize, setTargetTypeIdForSize] = useState<string>(uniformTypes[0]?.id || 'general_shirt');
  const [newSizeName, setNewSizeName] = useState<string>('');

  // Filters (Filter for all!)
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSize, setFilterSize] = useState<string>('all');
  const [searchDate, setSearchDate] = useState<string>('');

  // Helper: get records for any uniform type
  const getRecordsForType = (typeId: string) => {
    if (typeId === 'general_shirt') {
      return uniformReport.shirtDailyRecords || [];
    }
    if (typeId === 'sports_bottom') {
      return uniformReport.sportDailyRecords || [];
    }
    return uniformReport.recordsByType?.[typeId] || [];
  };

  // Helper: get price for type
  const getPriceForType = (ut: UniformTypeConfig) => {
    if (ut.id === 'general_shirt') return uniformReport.shirtPriceKHR || ut.defaultPriceKHR;
    if (ut.id === 'sports_bottom') return uniformReport.sportPriceKHR || ut.defaultPriceKHR;
    return ut.defaultPriceKHR;
  };

  // Grand Total Calculation across all uniform types
  let grandTotalCash = 0;
  let grandTotalUnits = 0;

  uniformTypes.forEach((ut) => {
    const records = getRecordsForType(ut.id);
    const price = getPriceForType(ut);
    const units = records.reduce((sum, r) => sum + r.totalQty, 0);
    grandTotalUnits += units;
    grandTotalCash += records.reduce((sum, r) => sum + (r.totalAmountKHR || r.totalQty * price), 0);
  });

  // Extract all unique sizes across types for the filter dropdown
  const allUniqueSizes = Array.from(
    new Set(uniformTypes.flatMap((ut) => ut.sizes))
  );

  // When saleType changes, sync default price & size
  const handleSaleTypeChange = (typeId: string) => {
    setSaleType(typeId);
    const selected = uniformTypes.find((ut) => ut.id === typeId);
    if (selected) {
      setSaleCustomPrice(getPriceForType(selected));
      if (selected.sizes.length > 0) {
        setSaleSize(selected.sizes[0]);
      }
    }
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBuyer = saleBuyer.trim() || 'សិស្សទូទៅ';
    recordUniformSale(
      saleDate,
      saleType,
      saleSize,
      Number(saleQty) || 1,
      finalBuyer,
      salePaymentMethod,
      Number(saleCustomPrice) || undefined,
      undefined,
      saleClassId || undefined
    );
    setIsRecordModalOpen(false);
    setSaleBuyer('');
    setSelectedStudentCode('');
    setSaleClassId('');
    setSaleQty(1);
    setShowInlineAddSize(false);
    setInlineNewSize('');
  };

  const handleInlineAddSizeSubmit = () => {
    const trimmed = inlineNewSize.trim();
    if (!trimmed) return;
    addUniformSize(saleType, trimmed);
    setSaleSize(trimmed);
    setInlineNewSize('');
    setShowInlineAddSize(false);
  };

  const handleCreateTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeNameKhmer.trim()) return;
    const sizesArray = newTypeSizesInput
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    addUniformType(
      newTypeNameKhmer.trim(),
      newTypeNameEnglish.trim(),
      Number(newTypePriceKHR) || 30000,
      sizesArray.length > 0 ? sizesArray : ['Free Size'],
      newTypeDesc.trim() || undefined
    );
    setIsNewTypeModalOpen(false);
    setNewTypeNameKhmer('');
    setNewTypeNameEnglish('');
    setNewTypeSizesInput('S, M, L, XL, XXL');
    setNewTypeDesc('');
  };

  const handleAddSizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSizeName.trim()) return;
    addUniformSize(targetTypeIdForSize, newSizeName.trim());
    setNewSizeName('');
    setIsAddSizeModalOpen(false);
  };

  const handleCreateMonthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUniformMonthRecord(newMonthName, Number(newMonthYear) || 2026);
    setIsNewMonthModalOpen(false);
  };

  const handleOpenEditTypeModal = (ut: UniformTypeConfig) => {
    setEditingTypeId(ut.id);
    setEditTypeNameKhmer(ut.nameKhmer);
    setEditTypeNameEnglish(ut.nameEnglish);
    setEditTypePriceKHR(getPriceForType(ut));
    setEditTypeDesc(ut.description || '');
    setEditTypeSizes([...ut.sizes]);
    setNewSizeInEditModal('');
    setRenamingSizeIdx(null);
    setRenamingSizeValue('');
    setIsEditTypeModalOpen(true);
  };

  const handleSaveEditType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTypeId || !editTypeNameKhmer.trim()) return;
    const cleanSizes = editTypeSizes.map((s) => s.trim()).filter(Boolean);
    const finalSizes = cleanSizes.length > 0 ? cleanSizes : ['Free Size'];

    updateUniformType(editingTypeId, {
      nameKhmer: editTypeNameKhmer.trim(),
      nameEnglish: editTypeNameEnglish.trim() || editTypeNameKhmer.trim(),
      defaultPriceKHR: Number(editTypePriceKHR) || 30000,
      description: editTypeDesc.trim() || undefined,
      sizes: finalSizes,
    });
    setIsEditTypeModalOpen(false);
    setEditingTypeId(null);
  };

  const handleDeleteUniformType = (ut: UniformTypeConfig) => {
    if (!permissions.canDelete) {
      alert(t('មានតែ Admin ទើបមានសិទ្ធិលុបមុខទំនិញឯកសណ្ឋាន!', 'Permission Denied: Only Admin can delete uniform items.'));
      return;
    }
    if (uniformTypes.length <= 1) {
      alert(t('មិនអាចលុបមុខទំនិញឯកសណ្ឋានចុងក្រោយបង្អស់បានទេ!', 'Cannot delete the only remaining uniform item!'));
      return;
    }
    if (
      window.confirm(
        t(
          `តើលោកអ្នកពិតជាចង់លុបមុខទំនិញ «${ut.nameKhmer}» (${ut.nameEnglish}) មែនទេ?`,
          `Are you sure you want to delete uniform item "${ut.nameKhmer}" (${ut.nameEnglish})?`
        )
      )
    ) {
      deleteUniformType(ut.id);
    }
  };

  const handleAddSizeInEditModal = () => {
    const trimmed = newSizeInEditModal.trim();
    if (!trimmed) return;
    if (editTypeSizes.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      alert(t(`ទំហំ "${trimmed}" មានរួចហើយ!`, `Size "${trimmed}" already exists!`));
      return;
    }
    setEditTypeSizes((prev) => [...prev, trimmed]);
    setNewSizeInEditModal('');
  };

  const handleRemoveSizeInEditModal = (szToRemove: string) => {
    if (editTypeSizes.length <= 1) {
      alert(t('មុខទំនិញត្រូវមានទំហំយ៉ាងហោចណាស់ ១!', 'Must have at least one size!'));
      return;
    }
    setEditTypeSizes((prev) => prev.filter((s) => s !== szToRemove));
  };

  const handleCommitSizeRename = (index: number) => {
    const trimmed = renamingSizeValue.trim();
    if (!trimmed) {
      setRenamingSizeIdx(null);
      return;
    }
    setEditTypeSizes((prev) => {
      const copy = [...prev];
      copy[index] = trimmed;
      return copy;
    });
    setRenamingSizeIdx(null);
    setRenamingSizeValue('');
  };

  const handleDeleteRow = (typeId: string, date: string) => {
    if (!permissions.canDelete) {
      alert(t('មានតែ Admin ទើបអាចលុបកំណត់ត្រាបាន!', 'Permission Denied: Only Admin can delete daily records.'));
      return;
    }
    if (window.confirm(t(`តើអ្នកពិតជាចង់លុបកំណត់ត្រាលក់កាលបរិច្ឆេទ «${date}» មែនទេ?`, `Delete record for date "${date}"?`))) {
      deleteUniformDailyRecord(typeId, date);
    }
  };

  const handleStartCellEdit = (typeId: string, date: string, size: string, currentQty: number) => {
    if (!permissions.canEdit) return;
    setEditingCell({ typeId, date, size });
    setCellInputValue(currentQty > 0 ? currentQty.toString() : '');
  };

  const handleCommitCellEdit = () => {
    if (!editingCell) return;
    const val = parseInt(cellInputValue, 10);
    updateUniformDailyQty(editingCell.typeId, editingCell.date, editingCell.size, isNaN(val) ? 0 : val);
    setEditingCell(null);
    setCellInputValue('');
  };

  const handleResetFilters = () => {
    setFilterType('all');
    setFilterSize('all');
    setSearchDate('');
  };

  return (
    <div className="space-y-6 w-full">
      {/* Monthly History Switcher Strip (Multi-month archive with Auto-Sorting & Drag-and-Drop) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs w-full flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left & Center: Month Label + Horizontally Scrollable Pills */}
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          <span className="text-xs font-semibold text-slate-500 font-khmer flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span className="whitespace-nowrap">{t('ជ្រើសរើសខែឯកសណ្ឋាន៖', 'Select Uniform Month:')}</span>
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
              {sortedUniformMonths.map((monthKey, index) => {
                const isSelected = selectedUniformMonth === monthKey;
                const rep = uniformHistory[monthKey];
                const shirtSum = rep?.shirtDailyRecords ? rep.shirtDailyRecords.reduce((sum, r) => sum + (r.totalAmountKHR || 0), 0) : 0;
                const sportSum = rep?.sportDailyRecords ? rep.sportDailyRecords.reduce((sum, r) => sum + (r.totalAmountKHR || 0), 0) : 0;
                const customSum = rep?.recordsByType
                  ? Object.values(rep.recordsByType).reduce((cSum, list) => cSum + (Array.isArray(list) ? list.reduce((s, r) => s + (r.totalAmountKHR || 0), 0) : 0), 0)
                  : 0;
                const totalAmount = shirtSum + sportSum + customSum;
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
                      const updated = [...sortedUniformMonths];
                      const [moved] = updated.splice(draggedMonthIndex, 1);
                      updated.splice(index, 0, moved);
                      setCustomMonthOrder(updated);
                      setMonthSortMode('custom');
                      try {
                        localStorage.setItem('BIM_RANGSEI_UNIFORM_CUSTOM_MONTH_ORDER', JSON.stringify(updated));
                        localStorage.setItem('BIM_RANGSEI_UNIFORM_MONTH_SORT', 'custom');
                      } catch (err) {
                        console.error(err);
                      }
                      setDraggedMonthIndex(null);
                    }}
                    className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all font-khmer select-none ${
                      draggedMonthIndex === index ? 'opacity-40 scale-95 ring-2 ring-indigo-400' : ''
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
                      onClick={() => setSelectedUniformMonth(monthKey)}
                      className="flex items-center gap-1.5 cursor-pointer text-left"
                      title={`${monthKey} (${khmerMonthLabel})`}
                    >
                      <span>{monthKey}</span>
                      <span className="text-[10px] opacity-75 font-normal">({khmerMonthLabel})</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums ${
                          isSelected ? 'bg-indigo-400 text-slate-950 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {(totalAmount / 1000).toFixed(0)}k៛
                      </span>
                    </button>

                    {/* Delete month if more than 1 month and permissions.canDelete */}
                    {permissions.canDelete && sortedUniformMonths.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMonth(monthKey);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-0.5 rounded transition-all cursor-pointer"
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
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                {monthSortMode === 'chrono_asc' && t('តម្រៀប: ចាស់ទៅថ្មី', 'Sort: Oldest First')}
                {monthSortMode === 'chrono_desc' && t('តម្រៀប: ថ្មីទៅចាស់', 'Sort: Newest First')}
                {monthSortMode === 'academic' && t('តម្រៀប: ឆ្នាំសិក្សា', 'Sort: Academic Year')}
                {monthSortMode === 'custom' && t('តម្រៀប: តាមចិត្ត', 'Sort: Custom Order')}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
                  isSortDropdownOpen ? 'rotate-180 text-indigo-600' : ''
                }`}
              />
            </button>

            {isSortDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs font-khmer animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  {t('របៀបតម្រៀបខែស្វ័យប្រវត្តិ', 'Automatic Month Sorting')}
                </div>

                <button
                  type="button"
                  onClick={() => handleSetSortMode('chrono_asc')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                    monthSortMode === 'chrono_asc' ? 'text-indigo-700 font-bold bg-indigo-50/50' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ArrowDown className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{t('តាមលំដាប់កាលបរិច្ឆេទ (ចាស់ទៅថ្មី)', 'Chronological (Oldest First)')}</span>
                  </div>
                  {monthSortMode === 'chrono_asc' && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSetSortMode('chrono_desc')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                    monthSortMode === 'chrono_desc' ? 'text-indigo-700 font-bold bg-indigo-50/50' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ArrowUp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{t('តាមលំដាប់កាលបរិច្ឆេទ (ថ្មីទៅចាស់)', 'Chronological (Newest First)')}</span>
                  </div>
                  {monthSortMode === 'chrono_desc' && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSetSortMode('academic')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                    monthSortMode === 'academic' ? 'text-indigo-700 font-bold bg-indigo-50/50' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{t('តាមឆ្នាំសិក្សា (Academic Year)', 'Academic Year (Oct → Aug)')}</span>
                  </div>
                  {monthSortMode === 'academic' && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </button>

                {monthSortMode === 'custom' && (
                  <div className="border-t border-slate-100 my-1 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSetSortMode('chrono_asc')}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-[11px]"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-400" />
                      <span>{t('កំណត់លំដាប់ឡើងវិញទៅលំនាំដើម', 'Reset to Default Chronological')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {permissions.canEdit && (
            <button
              onClick={() => setIsNewMonthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-khmer shrink-0 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('+ បង្កើតខែថ្មី', '+ New Month')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Shirt className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-700 font-khmer">
                សាលា អ៊ីរ៉ែលកម្ពុជា · BIM Rangsei School
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5 font-khmer">
                របាយការណ៍ឯកសណ្ឋានសិស្សប្រចាំខែ {uniformReport.month} {uniformReport.year}
              </h2>
              <div className="text-xs text-slate-500 font-medium">
                Student Uniform Sales & Sizing Inventory Ledger ({uniformReport.month} {uniformReport.year})
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2">
              <div className="text-[10px] text-indigo-800 font-bold uppercase font-khmer">
                {t('ចំណូលលក់ឯកសណ្ឋានសរុប', 'Grand Uniform Revenue')}
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {grandTotalCash.toLocaleString()} <span className="text-xs font-normal font-khmer">៛</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {grandTotalUnits} pcs sold
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onPrintReport && (
                <button
                  onClick={onPrintReport}
                  className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                  title="Print Official Ledger"
                >
                  <Printer className="w-4 h-4" />
                </button>
              )}

              {permissions.canEdit && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      syncUniformMatrixFromLedger(selectedUniformMonth);
                      alert(t('បានធ្វើសមកាលកម្មទិន្នន័យម៉ាទ្រីសពី Sales Ledger ជោគជ័យ!', 'Uniform Sales Matrix synced from Sales Ledger!'));
                    }}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold font-khmer transition-all shadow-2xs cursor-pointer"
                    title="Auto-Sync Uniform Sales Matrix from Uniform Sales History Ledger"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('សមកាលកម្មម៉ាទ្រីស (Sync Matrix)', 'Sync Matrix')}</span>
                  </button>

                  <button
                    onClick={() => setIsNewTypeModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold font-khmer transition-all border border-slate-200"
                    title="Create new uniform type (e.g. Tie, Cap, Badge, Vest)"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t('+ ប្រភេទឯកសណ្ឋាន', '+ New Type')}</span>
                  </button>

                  <button
                    onClick={() => setIsAddSizeModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold font-khmer transition-all border border-slate-200"
                    title="Add a new size to uniform types"
                  >
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    <span>{t('+ បន្ថែមទំហំ Size', '+ Add Size')}</span>
                  </button>

                  <button
                    onClick={() => setIsManageModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold font-khmer transition-all border border-slate-200"
                    title="Manage types and sizes"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-600" />
                    <span>{t('គ្រប់គ្រងប្រភេទ & ទំហំ', 'Manage')}</span>
                  </button>
                </>
              )}

              {permissions.canCollectFee && (
                <button
                  onClick={() => {
                    const firstType = uniformTypes[0];
                    if (firstType) {
                      setSaleType(firstType.id);
                      setSaleCustomPrice(getPriceForType(firstType));
                      if (firstType.sizes.length > 0) setSaleSize(firstType.sizes[0]);
                    }
                    setIsRecordModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-khmer transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('កត់ត្រាលក់ឯកសណ្ឋាន (Sale & Alert)', 'Record Sale')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Multi-Dimensional Filter Bar (Filter for all!) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ប្រភេទឯកសណ្ឋាន (Uniform Type)', 'Uniform Type')}
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50"
            >
              <option value="all">{t('ទាំងអស់ (All Types)', 'All Uniform Types')}</option>
              {uniformTypes.map((ut) => (
                <option key={ut.id} value={ut.id}>
                  {ut.nameKhmer} ({ut.nameEnglish})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ទំហំ (Size)', 'Size')}
            </label>
            <select
              value={filterSize}
              onChange={(e) => setFilterSize(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50 font-bold"
            >
              <option value="all">All Sizes (គ្រប់ទំហំ)</option>
              {allUniqueSizes.map((s) => (
                <option key={s} value={s}>
                  Size {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ស្វែងរកកាលបរិច្ឆេទ (Date)', 'Filter Date')}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="search"
                placeholder="ឧ. 03-Sep, 10-Oct..."
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold font-khmer transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('កំណត់ឡើងវិញ', 'Reset Filters')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Uniform Matrices: One ledger per uniform type */}
      {uniformTypes
        .filter((ut) => filterType === 'all' || filterType === ut.id)
        .map((ut, typeIdx) => {
          const unitPrice = getPriceForType(ut);
          const rawRecords = getRecordsForType(ut.id);

          // Compute size totals for this type
          const sizeTotals: { [size: string]: number } = {};
          ut.sizes.forEach((sz) => {
            sizeTotals[sz] = rawRecords.reduce((sum, r) => sum + (r.sizes[sz] || 0), 0);
          });
          const typeTotalQty = Object.values(sizeTotals).reduce((a, b) => a + b, 0);
          const typeTotalAmount = rawRecords.reduce(
            (sum, r) => sum + (r.totalAmountKHR || r.totalQty * unitPrice),
            0
          );

          // Filter records by date and size
          const filteredRecords = rawRecords.filter((r) => {
            const matchesSearch =
              !searchDate || r.date.toLowerCase().includes(searchDate.toLowerCase());
            const matchesSize =
              filterSize === 'all' || (r.sizes[filterSize] && r.sizes[filterSize] > 0);
            return matchesSearch && matchesSize;
          });

          return (
            <div
              key={ut.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs w-full"
            >
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {typeIdx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 font-khmer">
                        {ut.nameKhmer}
                      </h3>
                      <span className="text-slate-400 font-mono text-xs">
                        ({ut.nameEnglish})
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-mono font-bold">
                        {unitPrice.toLocaleString()} ៛/កំប្លេ
                      </span>
                    </div>
                    {ut.description && (
                      <p className="text-[11px] text-slate-500 font-khmer mt-0.5">{ut.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <span className="text-xs text-slate-700 font-mono font-bold mr-1">
                    Total: {typeTotalQty} pcs · {typeTotalAmount.toLocaleString()} ៛
                  </span>

                  {permissions.canEdit && (
                    <>
                      {/* Edit Uniform Item Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditTypeModal(ut)}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold font-khmer flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                        title={t('កែប្រែព័ត៌មានមុខទំនិញឯកសណ្ឋាននេះ (ឈ្មោះ តម្លៃ ទំហំ)', 'Edit uniform item')}
                      >
                        <Edit2 className="w-3 h-3 text-amber-700" />
                        <span>{t('កែប្រែ', 'Edit')}</span>
                      </button>

                      {/* Delete Uniform Item Button */}
                      {permissions.canDelete && uniformTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUniformType(ut)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold font-khmer flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                          title={t('លុបមុខទំនិញឯកសណ្ឋាននេះ', 'Delete uniform item')}
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>{t('លុប', 'Delete')}</span>
                        </button>
                      )}

                      {/* Add Size Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setTargetTypeIdForSize(ut.id);
                          setIsAddSizeModalOpen(true);
                        }}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-indigo-700 font-khmer flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                        title="Add size to this uniform type"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ ទំហំ</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-amber-400 text-slate-900 font-bold border-b border-amber-500">
                      <th className="py-2 px-3 border-r border-amber-500 text-center w-12">ល.រ</th>
                      <th className="py-2 px-4 border-r border-amber-500 font-mono">ថ្ងៃខែ (Date)</th>
                      {ut.sizes.map((sz) => (
                        <th
                          key={sz}
                          className="py-2 px-2 border-r border-amber-500 text-center font-mono min-w-12"
                        >
                          {sz}
                        </th>
                      ))}
                      <th className="py-2 px-3 border-r border-amber-500 text-center font-bold bg-amber-300">
                        សរុបចំនួន
                      </th>
                      <th className="py-2 px-4 text-right font-bold bg-amber-300">
                        សរុបទឹកប្រាក់ (៛)
                      </th>
                      {permissions.canDelete && (
                        <th className="py-2 px-2 text-center w-10 bg-amber-400">
                          លុប
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-xs">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={ut.sizes.length + (permissions.canDelete ? 5 : 4)}
                          className="py-8 text-center text-slate-400 font-khmer"
                        >
                          មិនទាន់មានទិន្នន័យលក់សម្រាប់ខែនេះឡើយ (No sales records for {ut.nameKhmer})
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((record, index) => (
                        <tr key={index} className="hover:bg-amber-50/40 transition-colors group">
                          <td className="py-2 px-3 border-r border-slate-200 text-center text-slate-500">
                            {index + 1}
                          </td>
                          <td className="py-2 px-4 border-r border-slate-200 font-bold text-slate-900">
                            {record.date}
                          </td>
                          {ut.sizes.map((sz) => {
                            const qty = record.sizes[sz] || 0;
                            const isEditing =
                              editingCell?.typeId === ut.id &&
                              editingCell?.date === record.date &&
                              editingCell?.size === sz;

                            return (
                              <td
                                key={sz}
                                onClick={() => handleStartCellEdit(ut.id, record.date, sz, qty)}
                                className={`py-1 px-1 border-r border-slate-200 text-center tabular-nums cursor-pointer transition-colors ${
                                  qty > 0
                                    ? 'bg-amber-100/60 font-bold text-slate-900'
                                    : 'text-slate-300 hover:bg-slate-100'
                                }`}
                                title="ចុចដើម្បីកែប្រែចំនួន (Click to edit quantity)"
                              >
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    autoFocus
                                    value={cellInputValue}
                                    onChange={(e) => setCellInputValue(e.target.value)}
                                    onBlur={handleCommitCellEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleCommitCellEdit();
                                      else if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                    className="w-12 text-center font-bold text-slate-900 bg-white border border-amber-500 rounded p-0 text-xs focus:outline-hidden"
                                  />
                                ) : qty > 0 ? (
                                  qty
                                ) : (
                                  ''
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-slate-900 bg-amber-50/40 tabular-nums">
                            {record.totalQty}
                          </td>
                          <td className="py-2 px-4 text-right font-bold text-slate-900 bg-amber-50/40 tabular-nums">
                            {record.totalAmountKHR.toLocaleString()}
                          </td>
                          {permissions.canDelete && (
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(ut.id, record.date)}
                                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 transition-opacity p-1 cursor-pointer"
                                title={`លុបកំណត់ត្រាថ្ងៃ ${record.date}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-amber-300 font-bold text-slate-900 border-t-2 border-amber-500 text-xs font-mono">
                      <td
                        colSpan={2}
                        className="py-2.5 px-4 text-right border-r border-amber-400 font-khmer uppercase"
                      >
                        សរុបលក់ចេញតាមទំហំ:
                      </td>
                      {ut.sizes.map((sz) => (
                        <td
                          key={sz}
                          className="py-2.5 px-2 border-r border-amber-400 text-center tabular-nums font-black"
                        >
                          {sizeTotals[sz] || 0}
                        </td>
                      ))}
                      <td className="py-2.5 px-3 border-r border-amber-400 text-center tabular-nums font-black">
                        {typeTotalQty}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-sm font-black">
                        {typeTotalAmount.toLocaleString()} ៛
                      </td>
                      {permissions.canDelete && <td />}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })}

      {/* RECORD SALE MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shirt className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base font-khmer">
                  {t('កត់ត្រាលក់ឯកសណ្ឋាន & Telegram Alert', 'Record Uniform Sale')}
                </h3>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    កាលបរិច្ឆេទ (Date) *
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold font-khmer">
                      ប្រភេទ (Type) *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecordModalOpen(false);
                        setIsNewTypeModalOpen(true);
                      }}
                      className="text-[10px] text-indigo-600 font-bold hover:underline font-khmer"
                    >
                      + បង្កើតប្រភេទថ្មី
                    </button>
                  </div>
                  <select
                    value={saleType}
                    onChange={(e) => handleSaleTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer font-bold"
                  >
                    {uniformTypes.map((ut) => (
                      <option key={ut.id} value={ut.id}>
                        {ut.nameKhmer} ({getPriceForType(ut).toLocaleString()}៛)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold font-khmer">
                      ទំហំ (Size) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowInlineAddSize(!showInlineAddSize)}
                      className="text-[10px] text-purple-600 font-bold hover:underline font-khmer"
                    >
                      {showInlineAddSize ? 'បិទ' : '+ ទំហំថ្មី'}
                    </button>
                  </div>

                  {!showInlineAddSize ? (
                    <select
                      value={saleSize}
                      onChange={(e) => setSaleSize(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                    >
                      {(uniformTypes.find((ut) => ut.id === saleType)?.sizes || ['Free Size']).map(
                        (sz) => (
                          <option key={sz} value={sz}>
                            Size {sz}
                          </option>
                        )
                      )}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="ឧ. 3XL, 14, Free"
                        value={inlineNewSize}
                        onChange={(e) => setInlineNewSize(e.target.value)}
                        className="w-full px-2 py-1.5 border border-purple-300 rounded font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleInlineAddSizeSubmit}
                        className="px-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-xs"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ចំនួន (Quantity) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={saleQty}
                    onChange={(e) => setSaleQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    តម្លៃឯកតា (Unit Price ៛) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={saleCustomPrice}
                    onChange={(e) => setSaleCustomPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    សរុបទឹកប្រាក់ (Total KHR)
                  </label>
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-slate-900">
                    {(saleQty * saleCustomPrice).toLocaleString()} ៛
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  អ្នកទិញ (Buyer / Select Student) *
                </label>
                <SearchableSelect
                  options={studentOptions}
                  value={selectedStudentCode || saleBuyer}
                  onChange={(val, opt) => {
                    if (opt?.data) {
                      setSelectedStudentCode(opt.data.studentCode);
                      setSaleBuyer(`${opt.data.name} (${opt.data.studentCode})`);
                      setSaleClassId(opt.data.classId || '');
                    } else {
                      setSelectedStudentCode('');
                      setSaleBuyer(String(val));
                      setSaleClassId('');
                    }
                  }}
                  allowCustom={true}
                  placeholder="ជ្រើសរើសសិស្ស ឬវាយឈ្មោះអ្នកទិញ..."
                  searchPlaceholder="ស្វែងរកតាមឈ្មោះ ឬកូដសិស្ស..."
                  customOptionLabel={(q) => `ប្រើឈ្មោះអ្នកទិញ "${q}" (Non-student)`}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  វិធីទូទាត់ (Payment Method) *
                </label>
                <select
                  value={salePaymentMethod}
                  onChange={(e) => setSalePaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                >
                  <option value="Cash">Cash (សាច់ប្រាក់)</option>
                  <option value="ABA">ABA Bank</option>
                  <option value="AC">ACLEDA (AC)</option>
                </select>
              </div>

              <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-[11px] flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-600 shrink-0" />
                <span>ការលក់នេះនឹងធ្វើបច្ចុប្បន្នភាពទំហំ និងផ្ញើសារ Telegram Alert ភ្លាមៗ</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold font-khmer shadow-xs"
                >
                  កត់ត្រា & ផ្ញើ Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW UNIFORM TYPE MODAL (បង្កើតប្រភេទឯកសណ្ឋាន) */}
      {isNewTypeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base font-khmer">
                  {t('បង្កើតប្រភេទឯកសណ្ឋានថ្មី', 'Create New Uniform Type')}
                </h3>
              </div>
              <button
                onClick={() => setIsNewTypeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTypeSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ឈ្មោះប្រភេទឯកសណ្ឋាន (Khmer Name) *
                </label>
                <input
                  type="text"
                  placeholder="ឧ. ក្រវ៉ាត់ក, មួកសិស្ស, អាវកាក់, ស្លាកឈ្មោះ..."
                  value={newTypeNameKhmer}
                  onChange={(e) => setNewTypeNameKhmer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ឈ្មោះជាភាសាអង់គ្លេស (English Name)
                </label>
                <input
                  type="text"
                  placeholder="e.g. School Necktie, Student Cap, School Vest"
                  value={newTypeNameEnglish}
                  onChange={(e) => setNewTypeNameEnglish(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  តម្លៃឯកតាលំនាំដើម (Default Unit Price ៛ KHR) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={newTypePriceKHR}
                  onChange={(e) => setNewTypePriceKHR(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  បញ្ជីទំហំ Size ដំបូង (បំបែកដោយក្បៀស ",") *
                </label>
                <input
                  type="text"
                  placeholder="ឧ. XXL, XL, L, M, S ឬ 12, 10, 8 ឬ Free Size"
                  value={newTypeSizesInput}
                  onChange={(e) => setNewTypeSizesInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400">
                  អ្នកអាចបន្ថែមទំហំផ្សេងទៀតបន្ថែមនៅពេលក្រោយបានគ្រប់ពេល
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ការពិពណ៌នា (Description)
                </label>
                <input
                  type="text"
                  placeholder="ព័ត៌មានលម្អិតបន្ថែមអំពីឯកសណ្ឋាននេះ"
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTypeModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold font-khmer shadow-xs"
                >
                  បង្កើតប្រភេទថ្មី
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SIZE MODAL (បន្ថែមទំហំ Size ថ្មី) */}
      {isAddSizeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base font-khmer">
                  {t('បន្ថែមទំហំ Size ថ្មីទៅក្នុងប្រភេទឯកសណ្ឋាន', 'Add Uniform Size')}
                </h3>
              </div>
              <button
                onClick={() => setIsAddSizeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSizeSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ជ្រើសរើសប្រភេទឯកសណ្ឋាន (Uniform Type) *
                </label>
                <select
                  value={targetTypeIdForSize}
                  onChange={(e) => setTargetTypeIdForSize(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer font-bold"
                >
                  {uniformTypes.map((ut) => (
                    <option key={ut.id} value={ut.id}>
                      {ut.nameKhmer} ({ut.nameEnglish})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ទំហំ Size ថ្មីដែលត្រូវបន្ថែម *
                </label>
                <input
                  type="text"
                  placeholder="ឧ. 3XL, 4XL, 14, 16, Free Size..."
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  required
                  autoFocus
                />
              </div>

              {/* Current sizes preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] font-bold text-slate-500 uppercase font-khmer mb-2">
                  ទំហំដែលមានស្រាប់ក្នុងប្រភេទនេះ៖
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(uniformTypes.find((ut) => ut.id === targetTypeIdForSize)?.sizes || []).map(
                    (s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[11px] font-bold"
                      >
                        {s}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSizeModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold font-khmer shadow-xs"
                >
                  បន្ថែមទំហំ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE TYPES & SIZES MODAL */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-base font-khmer">
                  {t('គ្រប់គ្រងប្រភេទ និងទំហំឯកសណ្ឋានសិស្ស', 'Manage Uniform Types & Sizes')}
                </h3>
              </div>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-600 font-khmer text-xs">
                  អ្នកអាចកំណត់តម្លៃ ពិនិត្យមើល និងបន្ថែមទំហំ (Size) ឬបង្កើតប្រភេទឯកសណ្ឋានថ្មីបាននៅទីនេះ។
                </p>
                <button
                  onClick={() => {
                    setIsManageModalOpen(false);
                    setIsNewTypeModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold font-khmer text-xs shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ ប្រភេទថ្មី</span>
                </button>
              </div>

              <div className="space-y-3">
                {uniformTypes.map((ut) => (
                  <div
                    key={ut.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-khmer text-sm">
                            {ut.nameKhmer}
                          </span>
                          <span className="text-slate-400 font-mono text-xs">
                            ({ut.nameEnglish})
                          </span>
                        </div>
                        {ut.description && (
                          <div className="text-[11px] text-slate-500 font-khmer mt-0.5">
                            {ut.description}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="text-slate-500 font-khmer text-[11px]">តម្លៃ៖</span>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            defaultValue={ut.defaultPriceKHR}
                            onBlur={(e) => {
                              const val = Number(e.target.value);
                              if (val && val !== ut.defaultPriceKHR) {
                                updateUniformType(ut.id, { defaultPriceKHR: val });
                              }
                            }}
                            className="w-20 text-right font-mono font-bold text-slate-900 text-xs bg-transparent focus:outline-hidden"
                          />
                          <span className="text-[10px] text-slate-400 font-khmer">៛</span>
                        </div>

                        {permissions.canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsManageModalOpen(false);
                              handleOpenEditTypeModal(ut);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors font-khmer"
                            title={t('កែប្រែមុខទំនិញ', 'Edit item')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>កែប្រែ</span>
                          </button>
                        )}

                        {permissions.canDelete && uniformTypes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUniformType(ut)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                            title={t('លុបមុខទំនិញ', 'Delete uniform item')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sizing badges */}
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase font-khmer mb-1.5 flex items-center justify-between">
                        <span>ទំហំ Size ទាំងអស់ ({ut.sizes.length})៖</span>
                        <span className="text-slate-400 font-normal lowercase">ចុចដើម្បីកែឈ្មោះ ឬលុបទំហំ</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {ut.sizes.map((sz) => (
                          <span
                            key={sz}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono text-xs font-bold shadow-2xs group"
                          >
                            <span>{sz}</span>
                            {permissions.canEdit && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newName = window.prompt(
                                    t(`ប្តូរឈ្មោះទំហំ "${sz}" ទៅជា៖`, `Rename size "${sz}" to:`),
                                    sz
                                  );
                                  if (newName && newName.trim() && newName.trim() !== sz) {
                                    updateUniformSize(ut.id, sz, newName.trim());
                                  }
                                }}
                                className="text-slate-300 hover:text-indigo-600 transition-colors"
                                title={t(`កែឈ្មោះទំហំ ${sz}`, `Rename size ${sz}`)}
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                            {ut.sizes.length > 1 && permissions.canDelete && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(t(`តើអ្នកចង់លុបទំហំ "${sz}" ពី ${ut.nameKhmer} មែនទេ?`, `Delete size "${sz}" from ${ut.nameKhmer}?`))) {
                                    deleteUniformSize(ut.id, sz);
                                  }
                                }}
                                className="text-slate-300 hover:text-rose-500 transition-colors"
                                title={`Remove size ${sz}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))}

                        <button
                          onClick={() => {
                            setTargetTypeIdForSize(ut.id);
                            setIsManageModalOpen(false);
                            setIsAddSizeModalOpen(true);
                          }}
                          className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs font-khmer flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>បន្ថែម Size</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold font-khmer"
              >
                រួចរាល់
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT UNIFORM TYPE MODAL */}
      {isEditTypeModalOpen && editingTypeId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-khmer">
                    {t('កែប្រែព័ត៌មានមុខទំនិញឯកសណ្ឋាន', 'Edit Uniform Item')}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-khmer">
                    {t('កែប្រែឈ្មោះ តម្លៃលក់ និងគ្រប់គ្រងទំហំ (Sizes)', 'Update name, default price, and manage sizes')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditTypeModalOpen(false);
                  setEditingTypeId(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditType} className="mt-4 space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  {t('ឈ្មោះជាភាសាខ្មែរ (Khmer Name) *', 'Khmer Name *')}
                </label>
                <input
                  type="text"
                  value={editTypeNameKhmer}
                  onChange={(e) => setEditTypeNameKhmer(e.target.value)}
                  placeholder="ឧ. អាវសិស្ស, សំពត់/ខោខៀវ..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer text-slate-900 focus:outline-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    {t('ឈ្មោះជាភាសាអង់គ្លេស (English) *', 'English Name *')}
                  </label>
                  <input
                    type="text"
                    value={editTypeNameEnglish}
                    onChange={(e) => setEditTypeNameEnglish(e.target.value)}
                    placeholder="e.g. Student Shirt, School Pants"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-sans text-slate-900 focus:outline-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    {t('តម្លៃកំណត់ដើម (KHR) *', 'Default Price (KHR) *')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={editTypePriceKHR}
                    onChange={(e) => setEditTypePriceKHR(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  {t('ការពិពណ៌នាសង្ខេប (Description)', 'Description')}
                </label>
                <input
                  type="text"
                  value={editTypeDesc}
                  onChange={(e) => setEditTypeDesc(e.target.value)}
                  placeholder="ឧ. ឯកសណ្ឋានសិស្សទូទៅ ថ្នាក់ទី១ ដល់ទី១២"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer text-slate-900 focus:outline-indigo-500"
                />
              </div>

              {/* SIZES MANAGEMENT SECTION */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold font-khmer text-xs">
                    {t('ទំហំ (Sizes) ទាំងអស់', 'All Available Sizes')} ({editTypeSizes.length})
                  </label>
                  <span className="text-[10px] text-slate-400 font-khmer">
                    {t('ចុចប៊ូតុងខ្មៅដៃដើម្បីកែឈ្មោះ ឬសញ្ញាខ្វែងដើម្បីលុប', 'Click pencil to rename or cross to remove')}
                  </span>
                </div>

                {/* Size Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {editTypeSizes.map((sz, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-xs font-bold shadow-2xs"
                    >
                      {renamingSizeIdx === idx ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            autoFocus
                            value={renamingSizeValue}
                            onChange={(e) => setRenamingSizeValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCommitSizeRename(idx);
                              } else if (e.key === 'Escape') {
                                setRenamingSizeIdx(null);
                              }
                            }}
                            className="w-16 px-1 py-0.5 border border-indigo-400 rounded text-xs font-mono font-bold bg-indigo-50/50 text-indigo-900 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => handleCommitSizeRename(idx)}
                            className="p-0.5 text-emerald-600 hover:text-emerald-800"
                            title="Save"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span>{sz}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setRenamingSizeIdx(idx);
                              setRenamingSizeValue(sz);
                            }}
                            className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
                            title={t(`កែឈ្មោះទំហំ ${sz}`, `Rename size ${sz}`)}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          {editTypeSizes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSizeInEditModal(sz)}
                              className="p-0.5 text-slate-400 hover:text-rose-600 transition-colors"
                              title={t(`លុបទំហំ ${sz}`, `Remove size ${sz}`)}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add new size row inside modal */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                  <input
                    type="text"
                    value={newSizeInEditModal}
                    onChange={(e) => setNewSizeInEditModal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSizeInEditModal();
                      }
                    }}
                    placeholder={t('បញ្ចូលទំហំថ្មី (ឧ. 4XL, 16...)', 'New size (e.g. 4XL, 16...)')}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono placeholder:font-khmer text-slate-800 focus:outline-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSizeInEditModal}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold font-khmer text-xs flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('បន្ថែមទំហំ', 'Add Size')}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  {permissions.canDelete && uniformTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetUt = uniformTypes.find((u) => u.id === editingTypeId);
                        if (targetUt) {
                          setIsEditTypeModalOpen(false);
                          setEditingTypeId(null);
                          handleDeleteUniformType(targetUt);
                        }
                      }}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold font-khmer text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('លុបមុខទំនិញនេះ', 'Delete this item')}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditTypeModalOpen(false);
                      setEditingTypeId(null);
                    }}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-khmer text-xs"
                  >
                    {t('បោះបង់', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold font-khmer text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{t('រក្សាទុកការកែប្រែ', 'Save Changes')}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW MONTH MODAL */}
      {isNewMonthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base font-khmer">
                {t('បង្កើតខែរបាយការណ៍ឯកសណ្ឋានថ្មី', 'Create New Uniform Report Month')}
              </h3>
              <button
                onClick={() => setIsNewMonthModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMonthSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ខែ (Month) *
                </label>
                <select
                  value={newMonthName}
                  onChange={(e) => setNewMonthName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold font-khmer"
                >
                  {MONTH_NAMES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ឆ្នាំ (Year) *
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={newMonthYear}
                  onChange={(e) => setNewMonthYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewMonthModalOpen(false)}
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
    </div>
  );
};
