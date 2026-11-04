import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MaterialSaleTransaction } from '../types';
import {
  History,
  ShoppingBag,
  Search,
  Plus,
  Download,
  Trash2,
  Calendar,
  Filter,
  DollarSign,
  X,
  Send,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export const MaterialSalesHistoryView: React.FC = () => {
  const {
    materialSalesHistory,
    dailyMaterials,
    recordMaterialSaleTransaction,
    deleteMaterialSaleTransaction,
    permissions,
    currentUser,
    t,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Column sorting state
  type MaterialSortField = 'id' | 'receiptNo' | 'date' | 'itemName' | 'quantity' | 'unitPriceKHR' | 'totalAmountKHR' | 'paymentMethod' | 'customerName' | 'recordedBy';
  const [sortField, setSortField] = useState<MaterialSortField | null>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: MaterialSortField) => {
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
  const [saleItemId, setSaleItemId] = useState<number>(dailyMaterials.items[0]?.id || 1);
  const [saleQty, setSaleQty] = useState<number>(1);
  const [saleCustomer, setSaleCustomer] = useState<string>('');
  const [salePaymentMethod, setSalePaymentMethod] = useState<'Cash' | 'ABA' | 'AC'>('Cash');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Filter transactions (Filter for all!)
  const filteredHistory = materialSalesHistory.filter((tx) => {
    const matchesSearch =
      tx.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.customerName && tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
    const matchesPayment = filterPayment === 'all' || tx.paymentMethod === filterPayment;

    let matchesDate = true;
    if (startDate && tx.date < startDate) matchesDate = false;
    if (endDate && tx.date > endDate) matchesDate = false;

    return matchesSearch && matchesCategory && matchesPayment && matchesDate;
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

  const renderSortIndicator = (field: MaterialSortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 text-slate-800/40 group-hover:text-slate-900 opacity-60 inline-block shrink-0 transition-opacity ml-1" />
      );
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-slate-950 inline-block shrink-0 font-extrabold stroke-[2.5] ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-slate-950 inline-block shrink-0 font-extrabold stroke-[2.5] ml-1" />
    );
  };

  const totalRevenueKHR = filteredHistory.reduce((sum, tx) => sum + tx.totalAmountKHR, 0);
  const totalUnitsSold = filteredHistory.reduce((sum, tx) => sum + tx.quantity, 0);

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    const item = dailyMaterials.items.find((i) => i.id === saleItemId);
    if (!item) return;

    recordMaterialSaleTransaction({
      date: saleDate,
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

    setIsNewSaleOpen(false);
    setSaleCustomer('');
    setSaleQty(1);
  };

  const handleExportCSV = () => {
    const headers = ['Receipt No', 'Date', 'Item Name', 'Category', 'Quantity', 'Unit Price (KHR)', 'Total (KHR)', 'Payment Method', 'Customer', 'Cashier'];
    const rows = filteredHistory.map((tx) => [
      tx.receiptNo,
      tx.date,
      `"${tx.itemName}"`,
      tx.category,
      tx.quantity,
      tx.unitPriceKHR,
      tx.totalAmountKHR,
      tx.paymentMethod,
      `"${tx.customerName || ''}"`,
      `"${tx.recordedBy}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BIM_Material_Sales_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-xs">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-700 font-khmer">
                សាលា អ៊ីរ៉ែលកម្ពុជា · BIM Rangsei School
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5 font-khmer">
                ប្រវត្តិប្រតិបត្តិការលក់សម្ភារៈសិក្សា (Material Sales History Ledger)
              </h2>
              <div className="text-xs text-slate-500 font-medium">
                Detailed transaction log with invoice receipts, payment channels & cashier signatures
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
              <div className="text-[10px] text-amber-800 font-bold uppercase font-khmer">
                {t('ចំណូលលក់សម្ភារៈក្នុងតម្រង', 'Filtered Revenue')}
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {totalRevenueKHR.toLocaleString()} <span className="text-xs font-normal font-khmer">៛</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                  onClick={() => setIsNewSaleOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs font-khmer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('កត់ត្រាលក់ថ្មី & Alert', 'Record New Sale')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* COMPREHENSIVE FILTER STRIP (Filter for all!) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ស្វែងរក', 'Search Item/Customer/Invoice')}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="search"
                placeholder={t('ប៊ិច, សៀវភៅ, MAT-001...', 'Search item or invoice...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ប្រភេទមុខទំនិញ', 'Category')}
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50"
            >
              <option value="all">{t('គ្រប់ប្រភេទ (All Categories)', 'All Categories')}</option>
              <option value="stationery">{t('សម្ភារៈសរសេរ', 'Stationery')}</option>
              <option value="books">{t('សៀវភៅ & ក្រប', 'Books')}</option>
              <option value="uniform_card">{t('កាតសិស្ស', 'ID Cards')}</option>
              <option value="textbooks">{t('សៀវភៅពុម្ព', 'Textbooks')}</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('វិធីទូទាត់ (Payment Method)', 'Payment Method')}
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
              បង្ហាញប្រតិបត្តិការចំនួន <strong>{sortedHistory.length}</strong> (លក់បាន {totalUnitsSold} ឯកតា)
            </span>
            {sortField && (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">
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
                className="text-indigo-600 hover:text-indigo-800 font-bold font-khmer cursor-pointer text-xs"
              >
                ↺ កំណត់លំដាប់ដើម (Reset Sort)
              </button>
            )}
            {(searchQuery || filterCategory !== 'all' || filterPayment !== 'all' || startDate || endDate) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('all');
                  setFilterPayment('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-amber-700 hover:text-amber-800 font-bold cursor-pointer"
              >
                ✕ កំណត់តម្រងឡើងវិញ
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
              <tr className="bg-amber-400 text-slate-900 font-bold border-b border-amber-500 select-none">
                <th
                  onClick={() => handleSort('id')}
                  className="py-2.5 px-3 border-r border-amber-500 text-center w-12 cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមលេខរៀង', 'Sort by Index')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>ល.រ</span>
                    {renderSortIndicator('id')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('receiptNo')}
                  className="py-2.5 px-3 border-r border-amber-500 font-mono cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមលេខវិក្កយបត្រ', 'Sort by Invoice No')}
                >
                  <div className="inline-flex items-center">
                    <span>វិក្កយបត្រ (Invoice)</span>
                    {renderSortIndicator('receiptNo')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('date')}
                  className="py-2.5 px-3 border-r border-amber-500 font-mono cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមកាលបរិច្ឆេទ', 'Sort by Date')}
                >
                  <div className="inline-flex items-center">
                    <span>កាលបរិច្ឆេទ</span>
                    {renderSortIndicator('date')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('itemName')}
                  className="py-2.5 px-4 border-r border-amber-500 font-khmer cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមឈ្មោះទំនិញ', 'Sort by Item Name')}
                >
                  <div className="inline-flex items-center">
                    <span>មុខទំនិញ (Item)</span>
                    {renderSortIndicator('itemName')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('quantity')}
                  className="py-2.5 px-3 border-r border-amber-500 text-center cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមចំនួនលក់', 'Sort by Quantity')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>ចំនួន (Qty)</span>
                    {renderSortIndicator('quantity')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('unitPriceKHR')}
                  className="py-2.5 px-3 border-r border-amber-500 text-right cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមតម្លៃឯកតា', 'Sort by Unit Price')}
                >
                  <div className="inline-flex items-center justify-end">
                    <span>តម្លៃឯកតា</span>
                    {renderSortIndicator('unitPriceKHR')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalAmountKHR')}
                  className="py-2.5 px-4 border-r border-amber-500 text-right font-bold bg-amber-300 cursor-pointer hover:bg-amber-400/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមទឹកប្រាក់សរុប', 'Sort by Total Amount')}
                >
                  <div className="inline-flex items-center justify-end">
                    <span>សរុប (៛ KHR)</span>
                    {renderSortIndicator('totalAmountKHR')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('paymentMethod')}
                  className="py-2.5 px-3 border-r border-amber-500 text-center cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមវិធីទូទាត់', 'Sort by Payment Method')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>វិធីទូទាត់</span>
                    {renderSortIndicator('paymentMethod')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('customerName')}
                  className="py-2.5 px-3 border-r border-amber-500 font-khmer cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមអតិថិជន', 'Sort by Customer')}
                >
                  <div className="inline-flex items-center">
                    <span>អតិថិជន</span>
                    {renderSortIndicator('customerName')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('recordedBy')}
                  className="py-2.5 px-3 border-r border-amber-500 font-khmer cursor-pointer hover:bg-amber-500/80 transition-colors group"
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
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-khmer text-xs">
                    មិនមានកំណត់ត្រាលក់ក្នុងលក្ខខណ្ឌតម្រងនេះទេ
                  </td>
                </tr>
              ) : (
                sortedHistory.map((tx, idx) => (
                  <tr key={tx.id} className="hover:bg-amber-50/40 transition-colors">
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
                      {tx.itemName}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-center tabular-nums text-slate-800">
                      {tx.quantity}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-right tabular-nums text-slate-600">
                      {tx.unitPriceKHR.toLocaleString()}៛
                    </td>
                    <td className="py-2 px-4 border-r border-slate-200 font-mono text-right font-black text-slate-900 tabular-nums bg-amber-50/40">
                      {tx.totalAmountKHR.toLocaleString()}៛
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.paymentMethod === 'ABA'
                            ? 'bg-blue-100 text-blue-800'
                            : tx.paymentMethod === 'AC'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-khmer text-slate-800">
                      {tx.customerName || '-'}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-khmer text-slate-600">
                      {tx.recordedBy}
                    </td>
                    <td className="py-2 px-2 text-center no-print">
                      {permissions.canDelete ? (
                        <button
                          onClick={() => {
                            if (window.confirm(`លុបវិក្កយបត្រ "${tx.receiptNo}"?`)) {
                              deleteMaterialSaleTransaction(tx.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-amber-300 font-bold text-slate-900 border-t-2 border-amber-500 text-xs">
                <td colSpan={4} className="py-2.5 px-4 text-right border-r border-amber-400 font-khmer uppercase">
                  សរុបទាំងអស់ (Total):
                </td>
                <td className="py-2.5 px-3 border-r border-amber-400 text-center font-mono font-black tabular-nums">
                  {totalUnitsSold}
                </td>
                <td className="border-r border-amber-400"></td>
                <td className="py-2.5 px-4 text-right font-mono font-black tabular-nums text-sm border-r border-amber-400">
                  {totalRevenueKHR.toLocaleString()} ៛
                </td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* RECORD SALE MODAL (Correct input field types) */}
      {isNewSaleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base font-khmer">
                  {t('កត់ត្រាលក់សម្ភារៈ & Telegram Alert', 'Record Material Sale')}
                </h3>
              </div>
              <button onClick={() => setIsNewSaleOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  មុខទំនិញ (Item) *
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
                    វិធីទូទាត់ (Payment)
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
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    អតិថិជន / សិស្ស (Customer)
                  </label>
                  <input
                    type="text"
                    placeholder="ឈ្មោះអ្នកទិញ"
                    value={saleCustomer}
                    onChange={(e) => setSaleCustomer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-[11px] flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-600 shrink-0" />
                <span>ការទូទាត់នេះនឹងបង្កើតវិក្កយបត្រ និងផ្ញើសារជូនដំណឹង Telegram Alert ភ្លាមៗ</span>
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
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg font-khmer shadow-xs"
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
