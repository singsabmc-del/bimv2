import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DailyMaterialItem, MONTH_NAMES, MONTH_NAMES_KH } from '../types';
import {
  Search,
  Plus,
  ShoppingBag,
  Printer,
  X,
  FileSpreadsheet,
  Check,
  Calendar,
  Filter,
  DollarSign,
  Send,
  SlidersHorizontal,
  GripVertical,
  RotateCcw,
  ArrowDown,
  ArrowUp,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type MaterialsMonthSortMode = 'chrono_asc' | 'chrono_desc' | 'academic' | 'custom';

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

interface DailyMaterialsViewProps {
  onPrintReport?: () => void;
}

export const DailyMaterialsView: React.FC<DailyMaterialsViewProps> = ({ onPrintReport }) => {
  const {
    materialsHistory,
    selectedMaterialsMonth,
    setSelectedMaterialsMonth,
    dailyMaterials,
    createMaterialsMonthRecord,
    deleteMaterialsMonthRecord,
    academicMonths,
    updateDailyMaterialSale,
    addMaterialItem,
    recordMaterialSaleTransaction,
    permissions,
    currentUser,
    t,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterSalesActivity, setFilterSalesActivity] = useState<string>('all'); // all, with_sales, zero_sales

  // Modals
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);

  // Month Sorting & Drag-Drop State
  const [monthSortMode, setMonthSortMode] = useState<MaterialsMonthSortMode>(() => {
    const saved = localStorage.getItem('BIM_RANGSEI_MATERIALS_MONTH_SORT');
    return (saved as MaterialsMonthSortMode) || 'chrono_asc';
  });

  const [customMonthOrder, setCustomMonthOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('BIM_RANGSEI_MATERIALS_CUSTOM_MONTH_ORDER');
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

  const handleSetSortMode = (mode: MaterialsMonthSortMode) => {
    setMonthSortMode(mode);
    setIsSortDropdownOpen(false);
    try {
      localStorage.setItem('BIM_RANGSEI_MATERIALS_MONTH_SORT', mode);
    } catch (e) {
      console.error(e);
    }
  };

  // Compute automatically sorted month keys
  const sortedMaterialsMonths = useMemo(() => {
    const allKeys = Object.keys(materialsHistory);

    if (monthSortMode === 'custom' && customMonthOrder.length > 0) {
      const ordered: string[] = [];
      const added = new Set<string>();
      customMonthOrder.forEach((k) => {
        if (materialsHistory[k]) {
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
  }, [materialsHistory, monthSortMode, customMonthOrder, academicMonths]);

  const handleDeleteMonth = (monthKey: string) => {
    if (!permissions.canDelete) {
      alert(t('មានតែ Admin ទើបមានសិទ្ធិលុបកំណត់ត្រាខែ!', 'Permission Denied: Only Admin can delete monthly records.'));
      return;
    }
    if (sortedMaterialsMonths.length <= 1) {
      alert(t('មិនអាចលុបខែចុងក្រោយបង្អស់បានទេ!', 'Cannot delete the only remaining month!'));
      return;
    }
    if (window.confirm(t(`តើអ្នកពិតជាចង់លុបកំណត់ត្រាខែ «${monthKey}» មែនទេ?`, `Are you sure you want to delete month record "${monthKey}"?`))) {
      deleteMaterialsMonthRecord(monthKey);
    }
  };

  // New Month Form
  const [newMonthName, setNewMonthName] = useState<string>('November');
  const [newMonthYear, setNewMonthYear] = useState<number>(2026);

  // Quick Sale Form (Correct input field types)
  const [saleItemId, setSaleItemId] = useState<number>(dailyMaterials.items[0]?.id || 1);
  const [saleDay, setSaleDay] = useState<number>(1);
  const [saleQty, setSaleQty] = useState<number>(1);
  const [saleCustomer, setSaleCustomer] = useState<string>('');
  const [salePaymentMethod, setSalePaymentMethod] = useState<'Cash' | 'ABA' | 'AC'>('Cash');

  // Add Item Form (Correct input field types)
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'stationery' | 'books' | 'uniform_card' | 'textbooks'>('stationery');
  const [newItemPrice, setNewItemPrice] = useState<number>(500);

  // Inline editing state: { itemId, day }
  const [editingCell, setEditingCell] = useState<{ itemId: number; day: number } | null>(null);
  const [cellInputValue, setCellInputValue] = useState<string>('');

  const days = dailyMaterials.availableDays;

  // Filter items (Filter for all!)
  const filteredItems = dailyMaterials.items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    let matchesActivity = true;
    if (filterSalesActivity === 'with_sales') {
      matchesActivity = item.totalQty > 0;
    } else if (filterSalesActivity === 'zero_sales') {
      matchesActivity = item.totalQty === 0;
    }

    return matchesSearch && matchesCategory && matchesActivity;
  });

  // Calculate Column Totals (Revenue per day in KHR)
  const dailyColumnTotals: { [day: number]: number } = {};
  days.forEach((day) => {
    let dayTotal = 0;
    dailyMaterials.items.forEach((item) => {
      const q = item.dailyQuantities[day] || 0;
      dayTotal += q * item.unitPriceKHR;
    });
    dailyColumnTotals[day] = dayTotal;
  });

  // Grand Totals
  const grandTotalUnits = dailyMaterials.items.reduce((sum, item) => sum + item.totalQty, 0);
  const grandTotalKHR = dailyMaterials.items.reduce((sum, item) => sum + item.totalAmountKHR, 0);

  const startEditCell = (itemId: number, day: number, currentVal: number) => {
    if (!permissions.canEdit) return;
    setEditingCell({ itemId, day });
    setCellInputValue(currentVal > 0 ? currentVal.toString() : '');
  };

  const commitCellEdit = () => {
    if (!editingCell) return;
    const qty = parseInt(cellInputValue, 10);
    updateDailyMaterialSale(editingCell.itemId, editingCell.day, isNaN(qty) ? 0 : Math.max(0, qty));
    setEditingCell(null);
  };

  const handleQuickSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = dailyMaterials.items.find((i) => i.id === saleItemId);
    if (!item) return;

    // Record via transaction ledger so it triggers Telegram alert and updates calendar cell!
    const todayDate = `${dailyMaterials.year}-${(MONTH_NAMES.indexOf(dailyMaterials.month as any) + 1).toString().padStart(2, '0')}-${saleDay.toString().padStart(2, '0')}`;
    recordMaterialSaleTransaction({
      date: todayDate,
      itemId: saleItemId,
      itemName: item.name,
      category: item.category,
      quantity: Number(saleQty) || 1,
      unitPriceKHR: item.unitPriceKHR,
      totalAmountKHR: (Number(saleQty) || 1) * item.unitPriceKHR,
      paymentMethod: salePaymentMethod,
      customerName: saleCustomer.trim() || undefined,
      recordedBy: currentUser.khmerName,
    });

    setIsQuickSaleOpen(false);
    setSaleCustomer('');
    setSaleQty(1);
  };

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    addMaterialItem(newItemName.trim(), newItemCategory, Number(newItemPrice) || 0);
    setNewItemName('');
    setIsAddItemOpen(false);
  };

  const handleCreateMonthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMaterialsMonthRecord(newMonthName, Number(newMonthYear) || 2026);
    setIsNewMonthModalOpen(false);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Monthly History Switcher Strip (Multi-month archive with Auto-Sorting & Drag-and-Drop) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs w-full flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left & Center: Month Label + Horizontally Scrollable Pills */}
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          <span className="text-xs font-semibold text-slate-500 font-khmer flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span className="whitespace-nowrap">{t('ជ្រើសរើសខែរបាយការណ៍៖', 'Select Report Month:')}</span>
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
              {sortedMaterialsMonths.map((monthKey, index) => {
                const isSelected = selectedMaterialsMonth === monthKey;
                const rep = materialsHistory[monthKey];
                const totalAmount = rep ? rep.items.reduce((sum, item) => sum + (item.totalAmountKHR || 0), 0) : 0;
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
                      const updated = [...sortedMaterialsMonths];
                      const [moved] = updated.splice(draggedMonthIndex, 1);
                      updated.splice(index, 0, moved);
                      setCustomMonthOrder(updated);
                      setMonthSortMode('custom');
                      try {
                        localStorage.setItem('BIM_RANGSEI_MATERIALS_CUSTOM_MONTH_ORDER', JSON.stringify(updated));
                        localStorage.setItem('BIM_RANGSEI_MATERIALS_MONTH_SORT', 'custom');
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
                      onClick={() => setSelectedMaterialsMonth(monthKey)}
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
                        {(totalAmount / 1000).toFixed(0)}k៛
                      </span>
                    </button>

                    {/* Delete month if more than 1 month and permissions.canDelete */}
                    {permissions.canDelete && sortedMaterialsMonths.length > 1 && (
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
              <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs font-khmer animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  {t('របៀបតម្រៀបខែស្វ័យប្រវត្តិ', 'Automatic Month Sorting')}
                </div>

                <button
                  type="button"
                  onClick={() => handleSetSortMode('chrono_asc')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                    monthSortMode === 'chrono_asc' ? 'text-amber-700 font-bold bg-amber-50/50' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ArrowDown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{t('តាមលំដាប់កាលបរិច្ឆេទ (ចាស់ទៅថ្មី)', 'Chronological (Oldest First)')}</span>
                  </div>
                  {monthSortMode === 'chrono_asc' && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSetSortMode('chrono_desc')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                    monthSortMode === 'chrono_desc' ? 'text-amber-700 font-bold bg-amber-50/50' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ArrowUp className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{t('តាមលំដាប់កាលបរិច្ឆេទ (ថ្មីទៅចាស់)', 'Chronological (Newest First)')}</span>
                  </div>
                  {monthSortMode === 'chrono_desc' && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSetSortMode('academic')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                    monthSortMode === 'academic' ? 'text-amber-700 font-bold bg-amber-50/50' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{t('តាមឆ្នាំសិក្សា (Academic Year)', 'Academic Year (Oct → Aug)')}</span>
                  </div>
                  {monthSortMode === 'academic' && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
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

      {/* Top Banner and Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-amber-700 font-khmer">
              សាលា អ៊ីរ៉ែលកម្ពុជា · BIM Rangsei School
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5 font-khmer">
              សម្ភារៈលក់ប្រចាំថ្ងៃ ({dailyMaterials.month} {dailyMaterials.year})
            </h2>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              កាលបរិច្ឆេទ (Period): {dailyMaterials.dateRange}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
              <div className="text-[10px] text-amber-800 font-bold uppercase font-khmer">
                {t('ចំណូលលក់សម្ភារៈសរុប', 'Total Material Sales')}
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {grandTotalKHR.toLocaleString()} <span className="text-xs font-normal font-khmer">៛</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onPrintReport && (
                <button
                  onClick={onPrintReport}
                  className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium transition-colors"
                  title="Print Official Ledger"
                >
                  <Printer className="w-4 h-4" />
                </button>
              )}

              {permissions.canEdit && (
                <button
                  onClick={() => setIsAddItemOpen(true)}
                  className="px-3.5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold font-khmer transition-colors"
                >
                  + បន្ថែមមុខទំនិញ
                </button>
              )}

              {permissions.canCollectFee && (
                <button
                  onClick={() => setIsQuickSaleOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold font-khmer transition-all shadow-xs"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t('កត់ត្រាការលក់ (Sale & Alert)', 'Record Daily Sale')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter for all! */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ស្វែងរកមុខទំនិញ', 'Search Item Name')}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="search"
                placeholder={t('ប៊ិច, សៀវភៅ, កាត...', 'Search supplies...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ប្រភេទមុខទំនិញ (Category)', 'Category')}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50"
            >
              <option value="all">{t('គ្រប់ប្រភេទ (All Categories)', 'All Categories')}</option>
              <option value="stationery">{t('សម្ភារៈសរសេរ (Stationery)', 'Stationery')}</option>
              <option value="books">{t('សៀវភៅ & ក្រប (Books)', 'Books')}</option>
              <option value="uniform_card">{t('កាតសិស្ស & ខ្សែ (ID Cards)', 'ID Cards & Lanyards')}</option>
              <option value="textbooks">{t('សៀវភៅពុម្ព (Textbooks)', 'Textbooks')}</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ស្ថានភាពលក់', 'Sales Activity')}
            </label>
            <select
              value={filterSalesActivity}
              onChange={(e) => setFilterSalesActivity(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50"
            >
              <option value="all">{t('ទំនិញទាំងអស់ (All Items)', 'All Items')}</option>
              <option value="with_sales">{t('ទំនិញមានការលក់ (Sold > 0)', 'Items with Sales')}</option>
              <option value="zero_sales">{t('ទំនិញមិនទាន់លក់ (Zero Sales)', 'Zero Sales')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Full-Width Daily Sales Ledger Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-amber-400 text-slate-900 font-bold border-b border-amber-500">
                <th className="py-2 px-2 border-r border-amber-500 text-center w-10 sticky left-0 bg-amber-400 z-10">
                  ID
                </th>
                <th className="py-2 px-3 border-r border-amber-500 font-khmer min-w-[180px] sticky left-10 bg-amber-400 z-10 shadow-r">
                  មុខទំនិញ (Item Name)
                </th>
                <th className="py-2 px-2 border-r border-amber-500 text-right min-w-[70px]">
                  តម្លៃ (៛)
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="py-1 px-1 border-r border-amber-500 text-center font-mono w-8 text-[11px]"
                  >
                    {day}
                  </th>
                ))}
                <th className="py-2 px-2 border-r border-amber-500 text-center font-bold min-w-[65px] bg-amber-300">
                  សរុបចំនួន
                </th>
                <th className="py-2 px-3 text-right font-bold min-w-[95px] bg-amber-300">
                  សរុបទឹកប្រាក់ (៛)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {filteredItems.map((item, index) => {
                const isEven = index % 2 === 0;
                return (
                  <tr
                    key={item.id}
                    className={`${isEven ? 'bg-white' : 'bg-slate-50/50'} hover:bg-amber-50/50 transition-colors`}
                  >
                    <td className="py-1 px-2 border-r border-slate-200 text-center text-slate-500 sticky left-0 bg-inherit z-10">
                      {item.id}
                    </td>
                    <td className="py-1 px-3 border-r border-slate-200 font-khmer font-bold text-slate-900 sticky left-10 bg-inherit z-10 shadow-r truncate max-w-[200px]">
                      {item.name}
                    </td>
                    <td className="py-1 px-2 border-r border-slate-200 text-right tabular-nums text-slate-600">
                      {item.unitPriceKHR.toLocaleString()}
                    </td>
                    {days.map((day) => {
                      const qty = item.dailyQuantities[day] || 0;
                      const isEditing = editingCell?.itemId === item.id && editingCell?.day === day;

                      return (
                        <td
                          key={day}
                          onClick={() => startEditCell(item.id, day, qty)}
                          className={`py-1 px-0.5 border-r border-slate-200 text-center tabular-nums cursor-pointer transition-colors ${
                            qty > 0
                              ? 'bg-amber-100/60 font-bold text-slate-900'
                              : 'text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              step="1"
                              autoFocus
                              value={cellInputValue}
                              onChange={(e) => setCellInputValue(e.target.value)}
                              onBlur={commitCellEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitCellEdit();
                                else if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-full text-center font-bold text-slate-900 bg-white border border-amber-500 rounded p-0 text-xs focus:outline-none"
                            />
                          ) : qty > 0 ? (
                            qty
                          ) : (
                            ''
                          )}
                        </td>
                      );
                    })}
                    <td className="py-1 px-2 border-r border-slate-200 text-center font-bold text-slate-900 bg-amber-50/40 tabular-nums">
                      {item.totalQty}
                    </td>
                    <td className="py-1 px-3 text-right font-bold text-slate-900 bg-amber-50/40 tabular-nums">
                      {item.totalAmountKHR > 0 ? item.totalAmountKHR.toLocaleString() : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-amber-300 font-bold text-slate-900 border-t-2 border-amber-500 text-xs font-mono">
                <td colSpan={3} className="py-2.5 px-3 text-right border-r border-amber-400 font-khmer uppercase sticky left-0 bg-amber-300 z-10">
                  សរុបចំណូលប្រចាំថ្ងៃ (Daily Total ៛):
                </td>
                {days.map((day) => {
                  const dayRev = dailyColumnTotals[day] || 0;
                  return (
                    <td
                      key={day}
                      className="py-1 px-0.5 border-r border-amber-400 text-center text-[10px] tabular-nums"
                    >
                      {dayRev > 0 ? (dayRev >= 1000 ? `${Math.round(dayRev / 1000)}k` : dayRev) : ''}
                    </td>
                  );
                })}
                <td className="py-2 px-2 border-r border-amber-400 text-center tabular-nums font-black">
                  {grandTotalUnits}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-sm font-black">
                  {grandTotalKHR.toLocaleString()} ៛
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* QUICK SALE MODAL (Correct input field types) */}
      {isQuickSaleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base font-khmer">
                  {t('កត់ត្រាការលក់សម្ភារៈ & Telegram Alert', 'Record Daily Material Sale')}
                </h3>
              </div>
              <button onClick={() => setIsQuickSaleOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickSaleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ជ្រើសរើសមុខទំនិញ (Item) *
                </label>
                <select
                  value={saleItemId}
                  onChange={(e) => setSaleItemId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer font-bold bg-slate-50"
                  required
                >
                  {dailyMaterials.items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.unitPriceKHR.toLocaleString()}៛)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ថ្ងៃនៃខែ (Day 1 - {days.length}) *
                  </label>
                  <select
                    value={saleDay}
                    onChange={(e) => setSaleDay(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        ថ្ងៃទី {d} ({dailyMaterials.month})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ចំនួនលក់ (Quantity) *
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
                    វិធីទូទាត់ (Payment)
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
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ឈ្មោះអ្នកទិញ (Customer)
                  </label>
                  <input
                    type="text"
                    placeholder="ឈ្មោះសិស្ស ឬអតិថិជន"
                    value={saleCustomer}
                    onChange={(e) => setSaleCustomer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-[11px] flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-600 shrink-0" />
                <span>ការលក់នេះនឹងធ្វើបច្ចុប្បន្នភាពតារាង និងផ្ញើ Telegram Alert ភ្លាមៗ</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickSaleOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold font-khmer shadow-xs"
                >
                  កត់ត្រា & ផ្ញើ Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base font-khmer">
                {t('បន្ថែមមុខទំនិញថ្មី', 'Add New Stationery Item')}
              </h3>
              <button onClick={() => setIsAddItemOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ឈ្មោះមុខទំនិញ (Item Name) *
                </label>
                <input
                  type="text"
                  placeholder="ឧ. ប៊ិចជែល 0.5mm"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ប្រភេទ (Category) *
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer"
                  >
                    <option value="stationery">សម្ភារៈសរសេរ</option>
                    <option value="books">សៀវភៅ & ក្រប</option>
                    <option value="uniform_card">កាតសិស្ស</option>
                    <option value="textbooks">សៀវភៅពុម្ព</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    តម្លៃឯកតា (UnitPrice ៛) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    inputMode="numeric"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddItemOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold font-khmer"
                >
                  បន្ថែមទំនិញ
                </button>
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
                {t('បង្កើតខែរបាយការណ៍សម្ភារៈថ្មី', 'Create New Materials Report Month')}
              </h3>
              <button onClick={() => setIsNewMonthModalOpen(false)} className="text-slate-400 hover:text-slate-600">
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
