import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UniformSaleTransaction } from '../types';
import { SearchableSelect, SearchOption } from './SearchableSelect';
import {
  Shirt,
  Search,
  Plus,
  Download,
  Trash2,
  Calendar,
  Filter,
  X,
  Send,
  Tag,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export const UniformSalesHistoryView: React.FC = () => {
  const {
    uniformSalesHistory,
    uniformReport,
    recordUniformSale,
    deleteUniformSaleTransaction,
    syncUniformMatrixFromLedger,
    classData,
    uniformTypes,
    addUniformType,
    addUniformSize,
    permissions,
    currentUser,
    t,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSize, setFilterSize] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Column sorting state
  type UniformSortField = 'id' | 'receiptNo' | 'date' | 'type' | 'size' | 'quantity' | 'unitPriceKHR' | 'totalAmountKHR' | 'paymentMethod' | 'buyerName' | 'recordedBy';
  const [sortField, setSortField] = useState<UniformSortField | null>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: UniformSortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection(field === 'date' || field === 'totalAmountKHR' ? 'desc' : 'asc');
    }
  };

  // Modal
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [saleType, setSaleType] = useState<string>(uniformTypes[0]?.id || 'general_shirt');
  const [saleSize, setSaleSize] = useState<string>('S');
  const [saleQty, setSaleQty] = useState<number>(1);
  const [saleCustomPrice, setSaleCustomPrice] = useState<number>(30000);
  const [saleBuyer, setSaleBuyer] = useState<string>('');
  const [selectedStudentCode, setSelectedStudentCode] = useState<string>('');
  const [saleClassId, setSaleClassId] = useState<string>('');
  const [salePaymentMethod, setSalePaymentMethod] = useState<'Cash' | 'ABA' | 'AC'>('Cash');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Flatten registered students for searchable buyer dropdown
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

  // Inline add size
  const [showInlineAddSize, setShowInlineAddSize] = useState(false);
  const [inlineNewSize, setInlineNewSize] = useState('');

  // Helper: get price for type
  const getPriceForType = (typeId: string) => {
    const ut = uniformTypes.find((t) => t.id === typeId);
    if (ut?.id === 'general_shirt') return uniformReport.shirtPriceKHR || ut.defaultPriceKHR;
    if (ut?.id === 'sports_bottom') return uniformReport.sportPriceKHR || ut.defaultPriceKHR;
    return ut?.defaultPriceKHR || 30000;
  };

  const handleSaleTypeChange = (typeId: string) => {
    setSaleType(typeId);
    setSaleCustomPrice(getPriceForType(typeId));
    const selected = uniformTypes.find((ut) => ut.id === typeId);
    if (selected && selected.sizes.length > 0) {
      setSaleSize(selected.sizes[0]);
    }
  };

  const handleInlineAddSize = () => {
    const trimmed = inlineNewSize.trim();
    if (!trimmed) return;
    addUniformSize(saleType, trimmed);
    setSaleSize(trimmed);
    setInlineNewSize('');
    setShowInlineAddSize(false);
  };

  // Filter transactions (Filter for all!)
  const filteredHistory = uniformSalesHistory.filter((tx) => {
    const typeLabel =
      tx.typeNameKhmer ||
      uniformTypes.find((ut) => ut.id === tx.type)?.nameKhmer ||
      (tx.type === 'general_shirt' ? 'អាវសិស្សទូទៅ' : 'ខោ/សំពត់កីឡា');

    const matchesSearch =
      tx.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
      typeLabel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesSize = filterSize === 'all' || tx.size === filterSize;
    const matchesPayment = filterPayment === 'all' || tx.paymentMethod === filterPayment;

    let matchesDate = true;
    if (startDate && tx.date < startDate) matchesDate = false;
    if (endDate && tx.date > endDate) matchesDate = false;

    return matchesSearch && matchesType && matchesSize && matchesPayment && matchesDate;
  });

  // Sort filtered transactions based on active column header
  const sortedHistory = useMemo(() => {
    if (!sortField) return filteredHistory;
    return [...filteredHistory].sort((a, b) => {
      let result = 0;
      if (sortField === 'id' || sortField === 'quantity' || sortField === 'unitPriceKHR' || sortField === 'totalAmountKHR') {
        result = (Number(a[sortField]) || 0) - (Number(b[sortField]) || 0);
      } else if (sortField === 'date') {
        result = (a.date || '').localeCompare(b.date || '');
      } else {
        const aStr = (a[sortField] || '').toString();
        const bStr = (b[sortField] || '').toString();
        result = aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
      }
      return sortDirection === 'asc' ? result : -result;
    });
  }, [filteredHistory, sortField, sortDirection]);

  const renderSortIndicator = (field: UniformSortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 text-indigo-200 group-hover:text-white opacity-60 inline-block shrink-0 transition-opacity ml-1" />
      );
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-white inline-block shrink-0 font-extrabold stroke-[2.5] ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-white inline-block shrink-0 font-extrabold stroke-[2.5] ml-1" />
    );
  };

  const totalRevenueKHR = filteredHistory.reduce((sum, tx) => sum + tx.totalAmountKHR, 0);
  const totalUnits = filteredHistory.reduce((sum, tx) => sum + tx.quantity, 0);

  // All unique sizes across all uniform types
  const allUniqueSizes = Array.from(
    new Set(uniformTypes.flatMap((ut) => ut.sizes))
  );

  const handleCreateSale = (e: React.FormEvent) => {
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
    setIsNewSaleOpen(false);
    setSaleBuyer('');
    setSelectedStudentCode('');
    setSaleClassId('');
    setSaleQty(1);
    setShowInlineAddSize(false);
  };

  const handleExportCSV = () => {
    const headers = [
      'Receipt No',
      'Date',
      'Type',
      'Size',
      'Quantity',
      'Unit Price (KHR)',
      'Total (KHR)',
      'Buyer Name',
      'Payment Method',
      'Cashier',
    ];
    const rows = filteredHistory.map((tx) => {
      const typeLabel =
        tx.typeNameKhmer ||
        uniformTypes.find((ut) => ut.id === tx.type)?.nameEnglish ||
        tx.type;
      return [
        tx.receiptNo,
        tx.date,
        typeLabel,
        tx.size,
        tx.quantity,
        tx.unitPriceKHR,
        tx.totalAmountKHR,
        `"${tx.buyerName}"`,
        tx.paymentMethod,
        `"${tx.recordedBy}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BIM_Uniform_Sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center text-white shadow-xs">
              <Shirt className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-700 font-khmer">
                សាលា អ៊ីរ៉ែលកម្ពុជា · BIM Rangsei School
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5 font-khmer">
                ប្រវត្តិប្រតិបត្តិការលក់ឯកសណ្ឋានសិស្ស (Uniform Sales History Ledger)
              </h2>
              <div className="text-xs text-slate-500 font-medium">
                Detailed transaction log with size matrices, buyer names, receipts & cashier signatures
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2">
              <div className="text-[10px] text-indigo-800 font-bold uppercase font-khmer">
                {t('ចំណូលលក់ឯកសណ្ឋានក្នុងតម្រង', 'Filtered Revenue')}
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {totalRevenueKHR.toLocaleString()} <span className="text-xs font-normal font-khmer">៛</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {totalUnits} units total
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  syncUniformMatrixFromLedger();
                  alert(t('បានធ្វើសមកាលកម្មទិន្នន័យម៉ាទ្រីសពី Ledger ជោគជ័យ!', 'Uniform Sales Matrix synced successfully!'));
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors font-khmer shadow-2xs"
                title="Auto-Sync Uniform Sales Matrix from Sales Ledger"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('សមកាលកម្មម៉ាទ្រីស (Sync Matrix)', 'Sync Matrix')}</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
                title="Export CSV"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export CSV</span>
              </button>

              {permissions.canCollectFee && (
                <button
                  onClick={() => {
                    const first = uniformTypes[0];
                    if (first) {
                      setSaleType(first.id);
                      setSaleCustomPrice(getPriceForType(first.id));
                      if (first.sizes.length > 0) setSaleSize(first.sizes[0]);
                    }
                    setIsNewSaleOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs font-khmer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('កត់ត្រាលក់ថ្មី & Alert', 'Record Uniform Sale')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Strip (Filter for all!) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ស្វែងរក (Buyer/Invoice)', 'Search')}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="search"
                placeholder={t('ឈ្មោះអ្នកទិញ, UNI-001...', 'Search buyer or invoice...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ប្រភេទឯកសណ្ឋាន', 'Type')}
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50"
            >
              <option value="all">{t('គ្រប់ប្រភេទ (All Types)', 'All Types')}</option>
              {uniformTypes.map((ut) => (
                <option key={ut.id} value={ut.id}>
                  {ut.nameKhmer}
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
              {t('វិធីទូទាត់', 'Payment Method')}
            </label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50 font-bold"
            >
              <option value="all">All Methods</option>
              <option value="Cash">Cash (សាច់ប្រាក់)</option>
              <option value="ABA">ABA Bank</option>
              <option value="AC">ACLEDA (AC)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ពីថ្ងៃ (From Date)', 'From Date')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ដល់ថ្ងៃ (To Date)', 'To Date')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 mt-2 font-khmer">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              បង្ហាញប្រតិបត្តិការចំនួន <strong>{sortedHistory.length}</strong> (លក់បាន {totalUnits} ឈុត)
            </span>
            {sortField && (
              <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-900 border border-indigo-300 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">
                Sorted by: {sortField} ({sortDirection.toUpperCase()})
                <button
                  type="button"
                  onClick={() => setSortField(null)}
                  className="hover:text-red-700 ml-0.5"
                  title="Remove sort"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {sortField && (
              <button
                type="button"
                onClick={() => setSortField(null)}
                className="text-indigo-700 hover:text-indigo-900 font-bold font-khmer cursor-pointer text-xs"
              >
                ↺ កំណត់លំដាប់ដើម (Reset Sort)
              </button>
            )}
            {(searchQuery ||
              filterType !== 'all' ||
              filterSize !== 'all' ||
              filterPayment !== 'all' ||
              startDate ||
              endDate) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setFilterSize('all');
                  setFilterPayment('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>កំណត់តម្រងឡើងវិញ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Full-Width Transaction Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-indigo-600 text-white font-bold border-b border-indigo-700 select-none">
                <th
                  onClick={() => handleSort('id')}
                  className="py-2.5 px-3 border-r border-indigo-500 text-center w-12 cursor-pointer hover:bg-indigo-700 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមលេខរៀង', 'Sort by Index')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>ល.រ</span>
                    {renderSortIndicator('id')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('receiptNo')}
                  className="py-2.5 px-3 border-r border-indigo-500 font-mono cursor-pointer hover:bg-indigo-700 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមលេខវិក្កយបត្រ', 'Sort by Invoice No')}
                >
                  <div className="inline-flex items-center">
                    <span>វិក្កយបត្រ (Invoice)</span>
                    {renderSortIndicator('receiptNo')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('date')}
                  className="py-2.5 px-3 border-r border-indigo-500 font-mono cursor-pointer hover:bg-indigo-700 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមកាលបរិច្ឆេទ', 'Sort by Date')}
                >
                  <div className="inline-flex items-center">
                    <span>កាលបរិច្ឆេទ</span>
                    {renderSortIndicator('date')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('type')}
                  className="py-2.5 px-4 border-r border-indigo-500 font-khmer cursor-pointer hover:bg-indigo-700 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមប្រភេទឯកសណ្ឋាន', 'Sort by Uniform Type')}
                >
                  <div className="inline-flex items-center">
                    <span>ប្រភេទឯកសណ្ឋាន</span>
                    {renderSortIndicator('type')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('size')}
                  className="py-2.5 px-3 border-r border-indigo-500 text-center cursor-pointer hover:bg-indigo-700 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមទំហំ', 'Sort by Size')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>ទំហំ (Size)</span>
                    {renderSortIndicator('size')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('quantity')}
                  className="py-2.5 px-3 border-r border-indigo-500 text-center cursor-pointer hover:bg-indigo-700 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមចំនួនលក់', 'Sort by Quantity')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>ចំនួន (Qty)</span>
                    {renderSortIndicator('quantity')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('unitPriceKHR')}
                  className="py-2.5 px-3 border-r border-indigo-500 text-right cursor-pointer hover:bg-indigo-700 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមតម្លៃឯកតា', 'Sort by Unit Price')}
                >
                  <div className="inline-flex items-center justify-end">
                    <span>តម្លៃឯកតា</span>
                    {renderSortIndicator('unitPriceKHR')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalAmountKHR')}
                  className="py-2.5 px-4 border-r border-indigo-500 text-right font-bold bg-indigo-700 cursor-pointer hover:bg-indigo-800 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមទឹកប្រាក់សរុប', 'Sort by Total Amount')}
                >
                  <div className="inline-flex items-center justify-end">
                    <span>សរុប (៛ KHR)</span>
                    {renderSortIndicator('totalAmountKHR')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('paymentMethod')}
                  className="py-2.5 px-3 border-r border-indigo-500 text-center cursor-pointer hover:bg-indigo-700 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមវិធីទូទាត់', 'Sort by Payment Method')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>វិធីទូទាត់</span>
                    {renderSortIndicator('paymentMethod')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('buyerName')}
                  className="py-2.5 px-3 border-r border-indigo-500 font-khmer cursor-pointer hover:bg-indigo-700 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមអ្នកទិញ', 'Sort by Buyer')}
                >
                  <div className="inline-flex items-center">
                    <span>អ្នកទិញ</span>
                    {renderSortIndicator('buyerName')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('recordedBy')}
                  className="py-2.5 px-3 border-r border-indigo-500 font-khmer cursor-pointer hover:bg-indigo-700 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមអ្នកទទួល', 'Sort by Cashier')}
                >
                  <div className="inline-flex items-center">
                    <span>អ្នកទទួល</span>
                    {renderSortIndicator('recordedBy')}
                  </div>
                </th>
                <th className="py-2.5 px-2 text-center no-print w-10">លុប</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedHistory.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 font-khmer text-xs">
                    មិនមានកំណត់ត្រាលក់ក្នុងលក្ខខណ្ឌតម្រងនេះទេ
                  </td>
                </tr>
              ) : (
                sortedHistory.map((tx, idx) => {
                  const typeLabel =
                    tx.typeNameKhmer ||
                    uniformTypes.find((ut) => ut.id === tx.type)?.nameKhmer ||
                    (tx.type === 'general_shirt'
                      ? 'អាវសិស្សទូទៅ'
                      : tx.type === 'sports_bottom'
                      ? 'ខោ/សំពត់កីឡា'
                      : tx.type);

                  return (
                    <tr key={tx.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-slate-900">
                        {tx.receiptNo}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-700 text-center">
                        {tx.date}
                      </td>
                      <td className="py-2 px-4 border-r border-slate-200 font-khmer font-bold text-slate-900">
                        {typeLabel}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono font-black text-center text-indigo-700">
                        {tx.size}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-center font-bold">
                        {tx.quantity}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-right text-slate-600">
                        {tx.unitPriceKHR.toLocaleString()} ៛
                      </td>
                      <td className="py-2 px-4 border-r border-slate-200 font-mono text-right font-black text-slate-900 bg-indigo-50/30">
                        {tx.totalAmountKHR.toLocaleString()} ៛
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            tx.paymentMethod === 'ABA'
                              ? 'bg-sky-100 text-sky-800'
                              : tx.paymentMethod === 'AC'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-khmer text-slate-800">
                        {tx.buyerName}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-khmer text-slate-600">
                        {tx.recordedBy}
                      </td>
                      <td className="py-2 px-2 text-center no-print">
                        {permissions.canDelete && (
                          <button
                            onClick={() => {
                              if (window.confirm(`លុបវិក្កយបត្រ ${tx.receiptNo}?`)) {
                                deleteUniformSaleTransaction(tx.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredHistory.length > 0 ? (
              <tfoot>
                <tr className="bg-indigo-50 font-bold border-t-2 border-indigo-200 text-slate-900">
                  <td colSpan={5} className="py-2.5 px-4 text-right font-khmer">
                    សរុបទាំងអស់ (Total Filtered):
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-black text-indigo-700">
                    {totalUnits}
                  </td>
                  <td className="py-2.5 px-3 border-r border-indigo-200"></td>
                  <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                    {totalRevenueKHR.toLocaleString()} ៛
                  </td>
                  <td colSpan={4} className="py-2.5 px-4"></td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>

      {/* RECORD NEW SALE MODAL */}
      {isNewSaleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shirt className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base font-khmer">
                  {t('កត់ត្រាលក់ឯកសណ្ឋានថ្មី', 'Record Uniform Sale')}
                </h3>
              </div>
              <button
                onClick={() => setIsNewSaleOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="mt-4 space-y-3.5">
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
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ប្រភេទ (Type) *
                  </label>
                  <select
                    value={saleType}
                    onChange={(e) => handleSaleTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer font-bold"
                  >
                    {uniformTypes.map((ut) => (
                      <option key={ut.id} value={ut.id}>
                        {ut.nameKhmer} ({getPriceForType(ut.id).toLocaleString()}៛)
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
                        onClick={handleInlineAddSize}
                        className="px-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-xs"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ចំនួន (Qty) *
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
                  ឈ្មោះអ្នកទិញ (Buyer / Select Student) *
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                >
                  <option value="Cash">Cash (សាច់ប្រាក់)</option>
                  <option value="ABA">ABA Bank</option>
                  <option value="AC">ACLEDA (AC)</option>
                </select>
              </div>

              <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-[11px] flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-600 shrink-0" />
                <span>ការទូទាត់នេះនឹងបង្កើតវិក្កយបត្រ និងផ្ញើសារ Telegram Alert ភ្លាមៗ</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSaleOpen(false)}
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
    </div>
  );
};
