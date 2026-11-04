import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  DollarSign,
  Printer,
  Download,
  Search,
  Filter,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Receipt,
  CreditCard,
  Building,
  GraduationCap,
  Shirt,
  ShoppingBag,
  Bus,
  Store,
  Layers,
  ArrowUpRight,
  Eye,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export interface UnifiedDailyTransaction {
  id: string;
  timestamp: string;
  date: string;
  receiptNo: string;
  category: 'tuition' | 'uniform' | 'material' | 'bus' | 'canteen';
  categoryLabelKhmer: string;
  payerName: string;
  payerSub?: string;
  description: string;
  paidBy: 'Cash' | 'ABA' | 'AC' | 'Wing' | '$ -' | string;
  amountUSD: number;
  amountKHR: number;
  recordedBy: string;
  rawDetails?: any;
}

// Date normalization helper: returns YYYY-MM-DD
const normalizeDateToISO = (dateStr?: string): string => {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // Handles DD-MM-YYYY or DD/MM/YYYY
  const slashParts = trimmed.split(/[-./_]/);
  if (slashParts.length === 3) {
    if (slashParts[0].length === 2 && slashParts[2].length === 4) {
      return `${slashParts[2]}-${slashParts[1].padStart(2, '0')}-${slashParts[0].padStart(2, '0')}`;
    }
  }

  // Handles DD-Mon-YY (e.g. 22-Oct-26 or 7-Sep-26)
  const monthMap: { [m: string]: string } = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };
  const monMatch = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (monMatch) {
    const day = monMatch[1].padStart(2, '0');
    const mon = monthMap[monMatch[2]] || '01';
    let yr = monMatch[3];
    if (yr.length === 2) yr = `20${yr}`;
    return `${yr}-${mon}-${day}`;
  }

  return trimmed;
};

export const DailyPaymentReportView: React.FC = () => {
  const {
    classData,
    uniformSalesHistory,
    materialSalesHistory,
    busEnrollments,
    busPayments,
    canteenHistory,
    selectedCanteenMonth,
    settings,
    currentBranch,
    currentBranchId,
    t,
  } = useApp();

  // Selected date state (default to today)
  const todayISO = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<UnifiedDailyTransaction | null>(null);

  // Navigate date
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  // Aggregation of all revenue transactions for the selected day across the entire system
  const allDailyTransactions = useMemo<UnifiedDailyTransaction[]>(() => {
    const list: UnifiedDailyTransaction[] = [];
    const targetISO = selectedDate;

    // 1. Tuition Fees from Class Data (filtered by active campus)
    Object.values(classData).forEach((cls) => {
      if (currentBranchId !== 'all' && (cls.branchId || 'branch-central') !== currentBranchId) {
        return;
      }
      cls.students.forEach((st) => {
        if (st.feeHistory && st.feeHistory.length > 0) {
          st.feeHistory.forEach((rec) => {
            const recISO = normalizeDateToISO(rec.date);
            if (recISO === targetISO) {
              list.push({
                id: `fee-${st.id}-${rec.receiptNo}`,
                timestamp: `${rec.date}`,
                date: recISO,
                receiptNo: rec.invoiceNo || rec.receiptNo,
                category: 'tuition',
                categoryLabelKhmer: 'ថ្លៃសិក្សា',
                payerName: st.name,
                payerSub: `${st.studentCode} · ${cls.className}`,
                description:
                  rec.months && rec.months.length > 1
                    ? `បង់ថ្លៃសិក្សា ${rec.months.length} ខែ (${rec.month})`
                    : `បង់ថ្លៃសិក្សាខែ ${rec.month}`,
                paidBy: rec.paidBy,
                amountUSD: rec.amountUSD,
                amountKHR: rec.amountKHR || Math.round(rec.amountUSD * settings.exchangeRate),
                recordedBy: rec.recordedBy || 'គណនេយ្យករ',
                rawDetails: { student: st, receipt: rec, className: cls.className },
              });
            }
          });
        }
      });
    });

    // 2. Uniform Sales History
    uniformSalesHistory.forEach((tx) => {
      const txISO = normalizeDateToISO(tx.date);
      if (txISO === targetISO) {
        const amtUSD = tx.totalAmountKHR / settings.exchangeRate;
        list.push({
          id: tx.id,
          timestamp: tx.timestamp || tx.date,
          date: txISO,
          receiptNo: tx.receiptNo,
          category: 'uniform',
          categoryLabelKhmer: 'ឯកសណ្ឋាន',
          payerName: tx.buyerName,
          payerSub: tx.classId ? `ថ្នាក់: ${tx.classId}` : 'អតិថិជនទូទៅ',
          description: `${tx.typeNameKhmer || tx.type} (${tx.size}) × ${tx.quantity} pcs`,
          paidBy: tx.paymentMethod,
          amountUSD: amtUSD,
          amountKHR: tx.totalAmountKHR,
          recordedBy: tx.recordedBy || 'អ្នកលក់ឯកសណ្ឋាន',
          rawDetails: tx,
        });
      }
    });

    // 3. Materials & POS Stationery Sales History
    materialSalesHistory.forEach((tx) => {
      const txISO = normalizeDateToISO(tx.date);
      if (txISO === targetISO) {
        const amtUSD = tx.totalAmountKHR / settings.exchangeRate;
        list.push({
          id: tx.id,
          timestamp: tx.timestamp || tx.date,
          date: txISO,
          receiptNo: tx.receiptNo,
          category: 'material',
          categoryLabelKhmer: 'សម្ភារៈ/POS',
          payerName: tx.customerName || 'អតិថិជនទូទៅ',
          payerSub: tx.category,
          description: `${tx.itemName} × ${tx.quantity}`,
          paidBy: tx.paymentMethod,
          amountUSD: amtUSD,
          amountKHR: tx.totalAmountKHR,
          recordedBy: tx.recordedBy || 'អ្នកលក់សម្ភារៈ',
          rawDetails: tx,
        });
      }
    });

    // 4. School Bus Service Fees (from busPayments ledger filtered by active campus)
    if (busPayments && busPayments.length > 0) {
      busPayments.forEach((bp) => {
        if (currentBranchId !== 'all') {
          const bpBranch = bp.branchId || (bp.classId && classData[bp.classId]?.branchId) || 'branch-central';
          if (bpBranch !== currentBranchId) return;
        }
        const bpISO = normalizeDateToISO(bp.paymentDate);
        if (bpISO === targetISO) {
          list.push({
            id: `bus-pay-${bp.id}`,
            timestamp: bp.paymentDate,
            date: bpISO,
            receiptNo: bp.receiptNo || bp.invoiceNo || `BUS-${bp.id.slice(-4)}`,
            category: 'bus',
            categoryLabelKhmer: 'រថយន្តសាលា',
            payerName: bp.studentName,
            payerSub: `${bp.studentCode} · ${bp.className || bp.classId}`,
            description: `សេវារថយន្ត (${bp.routeName}) - ${bp.months?.join(', ') || bp.month}`,
            paidBy: bp.paidBy || 'Cash',
            amountUSD: bp.amountUSD,
            amountKHR: bp.amountKHR,
            recordedBy: bp.recordedBy || 'គណនេយ្យកររថយន្ត',
            rawDetails: bp,
          });
        }
      });
    } else {
      busEnrollments.forEach((e) => {
        if (currentBranchId !== 'all') {
          const eBranch = e.branchId || (e.classId && classData[e.classId]?.branchId) || 'branch-central';
          if (eBranch !== currentBranchId) return;
        }
        if (e.status === 'paid' && e.paymentDate) {
          const eISO = normalizeDateToISO(e.paymentDate);
          if (eISO === targetISO) {
            const amtUSD = Math.max(0, e.monthlyFeeUSD - (e.discountUSD || 0));
            list.push({
              id: `bus-${e.id}`,
              timestamp: e.paymentDate,
              date: eISO,
              receiptNo: e.receiptNo || `BUS-${e.id.slice(-4)}`,
              category: 'bus',
              categoryLabelKhmer: 'រថយន្តសាលា',
              payerName: e.studentName,
              payerSub: `${e.studentCode} · ${e.classId || 'សិស្សជិះឡាន'}`,
              description: `សេវារថយន្តសាលា (${e.pickupLocation || e.routeId})`,
              paidBy: e.paidBy || 'Cash',
              amountUSD: amtUSD,
              amountKHR: Math.round(amtUSD * settings.exchangeRate),
              recordedBy: 'គណនេយ្យកររថយន្ត',
              rawDetails: e,
            });
          }
        }
      });
    }

    // 5. Canteen Daily Stall Fees
    const currentCanteen = canteenHistory[selectedCanteenMonth] || Object.values(canteenHistory)[0];
    if (currentCanteen && currentCanteen.dailyRecords) {
      currentCanteen.dailyRecords.forEach((dr) => {
        const drISO = normalizeDateToISO(dr.date);
        if (drISO === targetISO && dr.vendorStatus) {
          Object.entries(dr.vendorStatus).forEach(([vId, vStat]) => {
            if (vStat.status === 'paid' || vStat.status === 'double_paid') {
              const vendor = currentCanteen.vendors.find((v) => v.id === vId);
              const feeKHR = vStat.amountKHR || (vStat.status === 'double_paid' ? 20000 : 10000);
              list.push({
                id: `canteen-${dr.date}-${vId}`,
                timestamp: dr.date,
                date: drISO,
                receiptNo: `CAN-${vId.toUpperCase()}`,
                category: 'canteen',
                categoryLabelKhmer: 'អាហារដ្ឋាន',
                payerName: vendor?.name || 'អាជីវករ',
                payerSub: vendor?.stallName || 'តូបអាហារ',
                description: `ថ្លៃទីតាំងអាហារដ្ឋាន (${vStat.status === 'double_paid' ? 'បង់ទ្វេដង' : 'បង់ធម្មតា'})`,
                paidBy: 'Cash',
                amountUSD: feeKHR / settings.exchangeRate,
                amountKHR: feeKHR,
                recordedBy: currentCanteen.preparedBy || 'គណនេយ្យករ',
                rawDetails: { vendor, status: vStat },
              });
            }
          });
        }
      });
    }

    return list;
  }, [
    selectedDate,
    classData,
    uniformSalesHistory,
    materialSalesHistory,
    busEnrollments,
    busPayments,
    canteenHistory,
    selectedCanteenMonth,
    settings.exchangeRate,
    currentBranchId,
  ]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return allDailyTransactions.filter((tx) => {
      const matchesCategory =
        selectedCategory === 'all' || tx.category === selectedCategory;
      const matchesMethod =
        selectedMethod === 'all' || tx.paidBy.toLowerCase() === selectedMethod.toLowerCase();
      const matchesSearch =
        tx.payerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.payerSub && tx.payerSub.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesMethod && matchesSearch;
    });
  }, [allDailyTransactions, selectedCategory, selectedMethod, searchQuery]);

  // Summary Metrics for the Selected Day
  const totalUSD = useMemo(
    () => allDailyTransactions.reduce((sum, tx) => sum + tx.amountUSD, 0),
    [allDailyTransactions]
  );
  const totalKHR = useMemo(
    () => allDailyTransactions.reduce((sum, tx) => sum + tx.amountKHR, 0),
    [allDailyTransactions]
  );

  // By Payment Method
  const methodTotals = useMemo(() => {
    let cashUSD = 0, cashKHR = 0;
    let abaUSD = 0, abaKHR = 0;
    let acUSD = 0, acKHR = 0;
    let otherUSD = 0, otherKHR = 0;

    allDailyTransactions.forEach((tx) => {
      const m = tx.paidBy.toUpperCase();
      if (m.includes('CASH') || m.includes('សាច់ប្រាក់')) {
        cashUSD += tx.amountUSD;
        cashKHR += tx.amountKHR;
      } else if (m.includes('ABA')) {
        abaUSD += tx.amountUSD;
        abaKHR += tx.amountKHR;
      } else if (m.includes('AC')) {
        acUSD += tx.amountUSD;
        acKHR += tx.amountKHR;
      } else {
        otherUSD += tx.amountUSD;
        otherKHR += tx.amountKHR;
      }
    });

    return { cashUSD, cashKHR, abaUSD, abaKHR, acUSD, acKHR, otherUSD, otherKHR };
  }, [allDailyTransactions]);

  // By Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const cats = {
      tuition: { count: 0, usd: 0, khr: 0 },
      uniform: { count: 0, usd: 0, khr: 0 },
      material: { count: 0, usd: 0, khr: 0 },
      bus: { count: 0, usd: 0, khr: 0 },
      canteen: { count: 0, usd: 0, khr: 0 },
    };

    allDailyTransactions.forEach((tx) => {
      if (cats[tx.category]) {
        cats[tx.category].count++;
        cats[tx.category].usd += tx.amountUSD;
        cats[tx.category].khr += tx.amountKHR;
      }
    });

    return cats;
  }, [allDailyTransactions]);

  // CSV Export with UTF-8 BOM for Excel
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Date',
      'Receipt/Invoice No',
      'Category',
      'Payer / Student',
      'Class/Details',
      'Description',
      'Payment Method',
      'Amount USD',
      'Amount KHR',
      'Cashier',
    ];

    const rows = filteredTransactions.map((tx, idx) => [
      idx + 1,
      tx.date,
      `"${tx.receiptNo}"`,
      `"${tx.categoryLabelKhmer}"`,
      `"${tx.payerName}"`,
      `"${tx.payerSub || ''}"`,
      `"${tx.description}"`,
      `"${tx.paidBy}"`,
      tx.amountUSD.toFixed(2),
      tx.amountKHR,
      `"${tx.recordedBy}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daily_Payment_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Date Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 font-khmer">
                    {t('របាយការណ៍បង់ប្រាក់ & ចំណូលប្រចាំថ្ងៃ', 'Daily Payment & Revenue Report')}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-khmer flex items-center gap-1">
                    <Building className="w-3 h-3 text-indigo-500" />
                    <span>{currentBranch.nameKhmer}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-khmer">
                  បូកសរុបចំណូលគ្រប់ប្រភព (ថ្លៃសិក្សា, ឯកសណ្ឋាន, សម្ភារៈ/POS, រថយន្ត, អាហារដ្ឋាន)
                </p>
              </div>
            </div>
          </div>

          {/* Date Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Day Nav Stepper */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                onClick={handlePrevDay}
                title="Previous Day"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <button
                onClick={handleNextDay}
                title="Next Day"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Today Preset Button */}
            <button
              onClick={() => setSelectedDate(todayISO)}
              className={`px-3 py-2 rounded-xl text-xs font-khmer font-bold border transition-all ${
                selectedDate === todayISO
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              ថ្ងៃនេះ (Today)
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
              title="Export filtered transactions to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            {/* Print Official Daily Report Button */}
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('បោះពុម្ពបិទបញ្ជី', 'Print Daily Report')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collections */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-indigo-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-khmer font-semibold text-indigo-200">
              ចំណូលសរុបប្រចាំថ្ងៃ
            </span>
            <span className="p-1.5 rounded-lg bg-white/10 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-mono font-black tracking-tight text-amber-400">
            ${totalUSD.toFixed(2)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-indigo-200 font-mono">
            <span>≈ {totalKHR.toLocaleString()} ៛</span>
            <span className="bg-indigo-800/60 px-2 py-0.5 rounded text-[10px] font-bold text-white font-khmer">
              {allDailyTransactions.length} ប្រតិបត្តិការ
            </span>
          </div>
        </div>

        {/* Cash Drawer Total */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-khmer font-semibold text-slate-500">
              សាច់ប្រាក់ក្នុងដៃ (Cash on Hand)
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-mono font-bold text-emerald-700">
            ${methodTotals.cashUSD.toFixed(2)}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono">
            {methodTotals.cashKHR.toLocaleString()} ៛
          </div>
        </div>

        {/* ABA Bank Transfers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-khmer font-semibold text-slate-500">
              ផ្ទេរតាម ABA Bank
            </span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <Building className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-mono font-bold text-sky-800">
            ${methodTotals.abaUSD.toFixed(2)}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono">
            {methodTotals.abaKHR.toLocaleString()} ៛
          </div>
        </div>

        {/* ACLEDA & Others */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-khmer font-semibold text-slate-500">
              ACLEDA / Wing / ផ្សេងៗ
            </span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-mono font-bold text-purple-800">
            ${(methodTotals.acUSD + methodTotals.otherUSD).toFixed(2)}
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono">
            {(methodTotals.acKHR + methodTotals.otherKHR).toLocaleString()} ៛
          </div>
        </div>
      </div>

      {/* Revenue Stream Categories Summary Pill Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            key: 'tuition',
            label: 'ថ្លៃសិក្សា',
            icon: GraduationCap,
            color: 'indigo',
            data: categoryBreakdown.tuition,
          },
          {
            key: 'uniform',
            label: 'ឯកសណ្ឋាន',
            icon: Shirt,
            color: 'amber',
            data: categoryBreakdown.uniform,
          },
          {
            key: 'material',
            label: 'សម្ភារៈ/POS',
            icon: ShoppingBag,
            color: 'emerald',
            data: categoryBreakdown.material,
          },
          {
            key: 'bus',
            label: 'រថយន្តសាលា',
            icon: Bus,
            color: 'blue',
            data: categoryBreakdown.bus,
          },
          {
            key: 'canteen',
            label: 'អាហារដ្ឋាន',
            icon: Store,
            color: 'rose',
            data: categoryBreakdown.canteen,
          },
        ].map((c) => {
          const Icon = c.icon;
          const isSelected = selectedCategory === c.key;
          return (
            <button
              type="button"
              key={c.key}
              onClick={() => setSelectedCategory(isSelected ? 'all' : c.key)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-khmer text-xs font-bold flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{c.label}</span>
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {c.data.count}
                </span>
              </div>
              <div className={`mt-2 font-mono font-bold text-sm ${isSelected ? 'text-amber-400' : 'text-slate-900'}`}>
                ${c.data.usd.toFixed(2)}
              </div>
              <div className={`text-[10px] font-mono mt-0.5 truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                {c.data.khr.toLocaleString()} ៛
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Transactions Section with Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        {/* Filter controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ស្វែងរកតាមឈ្មោះ, លេខវិក្កយបត្រ, ឬមុខទំនិញ..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-khmer focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-khmer text-[11px]">ផ្នែក៖</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-khmer font-bold text-slate-700"
              >
                <option value="all">គ្រប់ផ្នែក (All Categories)</option>
                <option value="tuition">ថ្លៃសិក្សា (Tuition)</option>
                <option value="uniform">ឯកសណ្ឋាន (Uniforms)</option>
                <option value="material">សម្ភារៈ/POS (Supplies)</option>
                <option value="bus">រថយន្តសាលា (School Bus)</option>
                <option value="canteen">អាហារដ្ឋាន (Canteen)</option>
              </select>
            </div>

            {/* Method Dropdown */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-khmer text-[11px]">វិធីទូទាត់៖</span>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700"
              >
                <option value="all">All Methods</option>
                <option value="Cash">Cash (សាច់ប្រាក់)</option>
                <option value="ABA">ABA Bank</option>
                <option value="AC">ACLEDA (AC)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 border-b border-slate-200 font-khmer font-bold text-slate-700">
              <tr>
                <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200">ល.រ</th>
                <th className="py-2.5 px-3 border-r border-slate-200">លេខវិក្កយបត្រ</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-200">ផ្នែក</th>
                <th className="py-2.5 px-4 border-r border-slate-200">អ្នកបង់ / សិស្ស</th>
                <th className="py-2.5 px-4 border-r border-slate-200">ព័ត៌មានលម្អិត / បរិយាយ</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-200">វិធីទូទាត់</th>
                <th className="py-2.5 px-4 text-right border-r border-slate-200">ចំនួនទឹកប្រាក់ ($)</th>
                <th className="py-2.5 px-4 text-right border-r border-slate-200">ប្រាក់រៀល (៛)</th>
                <th className="py-2.5 px-3 border-r border-slate-200">អ្នកទទួល</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-khmer text-xs">
                    មិនមានប្រតិបត្តិការប្រមូលប្រាក់សម្រាប់កាលបរិច្ឆេទ {selectedDate} ឡើយ
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500 border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 border-r border-slate-100">
                      {tx.receiptNo}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-100">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold font-khmer ${
                          tx.category === 'tuition'
                            ? 'bg-indigo-100 text-indigo-800'
                            : tx.category === 'uniform'
                            ? 'bg-amber-100 text-amber-900'
                            : tx.category === 'material'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.category === 'bus'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.categoryLabelKhmer}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100 font-khmer">
                      <div className="font-bold text-slate-900">{tx.payerName}</div>
                      {tx.payerSub && (
                        <div className="text-[10px] text-slate-400 font-mono">{tx.payerSub}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100 font-khmer text-slate-700">
                      {tx.description}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-100 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                        {tx.paidBy}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 border-r border-slate-100">
                      ${tx.amountUSD.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600 border-r border-slate-100">
                      {tx.amountKHR.toLocaleString()} ៛
                    </td>
                    <td className="py-2.5 px-3 font-khmer text-slate-600 text-[11px]">
                      {tx.recordedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredTransactions.length > 0 ? (
              <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={6} className="py-3 px-4 text-right font-khmer uppercase">
                    សរុបប្រតិបត្តិការ ({filteredTransactions.length} វិក្កយបត្រ)៖
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-base text-emerald-800 font-black border-r border-slate-200">
                    $
                    {filteredTransactions
                      .reduce((sum, tx) => sum + tx.amountUSD, 0)
                      .toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900">
                    {filteredTransactions
                      .reduce((sum, tx) => sum + tx.amountKHR, 0)
                      .toLocaleString()}{' '}
                    ៛
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>

      {/* OFFICIAL PRINTABLE DAILY REPORT MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto">
            {/* Action Bar */}
            <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm font-khmer">
                  {t('បោះពុម្ពរបាយការណ៍បិទបញ្ជីប្រចាំថ្ងៃ (Daily Closing Report)', 'Print Daily Closing Report')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>បោះពុម្ព (Print A4)</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable A4 Document Sheet */}
            <div className="p-8 sm:p-12 space-y-6 text-slate-900 bg-white" id="official-daily-report-sheet">
              {/* Cambodian Royal Header */}
              <div className="text-center space-y-1">
                <div className="font-bold text-xs font-khmer text-slate-800">ព្រះរាជាណាចក្រកម្ពុជា</div>
                <div className="text-[11px] font-semibold font-khmer text-slate-700">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
                <div className="text-sm font-extrabold font-khmer text-slate-900 pt-2">
                  {settings.schoolNameKhmer} ({settings.schoolNameEnglish})
                </div>
                <div className="text-xs font-bold text-amber-800 font-khmer">
                  {currentBranch.nameKhmer} · {currentBranch.address}
                </div>
                <div className="text-base font-extrabold font-khmer text-amber-900 pt-2 tracking-wide uppercase">
                  របាយការណ៍ប្រមូលចំណូល និងបិទបញ្ជីប្រចាំថ្ងៃ
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  DAILY CASH COLLECTION & REVENUE SUMMARY REPORT
                </div>
                <div className="text-xs font-khmer font-bold text-slate-800 pt-1">
                  សម្រាប់កាលបរិច្ឆេទ៖ {selectedDate}
                </div>
              </div>

              {/* High-Level Financial Summary Matrix */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl border border-slate-300 bg-slate-50 text-xs">
                <div>
                  <span className="text-slate-500 block font-khmer">សាច់ប្រាក់ជាក់ស្តែង (Cash):</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">
                    ${methodTotals.cashUSD.toFixed(2)}
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {methodTotals.cashKHR.toLocaleString()} ៛
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block font-khmer">ផ្ទេរតាមធនាគារ (ABA/Bank):</span>
                  <span className="font-mono font-bold text-sky-800 text-sm">
                    ${(methodTotals.abaUSD + methodTotals.acUSD).toFixed(2)}
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {(methodTotals.abaKHR + methodTotals.acKHR).toLocaleString()} ៛
                  </div>
                </div>

                <div className="bg-amber-100/60 p-2.5 rounded-lg border border-amber-300">
                  <span className="text-amber-950 font-bold block font-khmer">ចំណូលសរុប (Grand Total):</span>
                  <span className="font-mono font-black text-amber-950 text-base">
                    ${totalUSD.toFixed(2)}
                  </span>
                  <div className="text-[10px] text-amber-900 font-mono font-bold">
                    {totalKHR.toLocaleString()} ៛
                  </div>
                </div>
              </div>

              {/* Category Breakdown Table */}
              <div>
                <h4 className="font-bold text-xs text-slate-800 font-khmer mb-2">
                  ១. តារាងសង្ខេបចំណូលតាមប្រភពសេវា (Revenue Source Breakdown)
                </h4>
                <table className="w-full text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-khmer font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-1.5 px-3 text-left border-r border-slate-300">ប្រភពចំណូល</th>
                      <th className="py-1.5 px-3 text-center border-r border-slate-300">ចំនួនវិក្កយបត្រ</th>
                      <th className="py-1.5 px-3 text-right border-r border-slate-300">ទឹកប្រាក់ ($ USD)</th>
                      <th className="py-1.5 px-3 text-right">ទឹកប្រាក់ (៛ KHR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-1.5 px-3 font-khmer border-r border-slate-200">ថ្លៃសិក្សាសិស្ស (Tuition Fees)</td>
                      <td className="py-1.5 px-3 text-center font-mono border-r border-slate-200">{categoryBreakdown.tuition.count}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold border-r border-slate-200">${categoryBreakdown.tuition.usd.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right font-mono">{categoryBreakdown.tuition.khr.toLocaleString()} ៛</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-khmer border-r border-slate-200">ឯកសណ្ឋានសិស្ស (Uniforms)</td>
                      <td className="py-1.5 px-3 text-center font-mono border-r border-slate-200">{categoryBreakdown.uniform.count}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold border-r border-slate-200">${categoryBreakdown.uniform.usd.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right font-mono">{categoryBreakdown.uniform.khr.toLocaleString()} ៛</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-khmer border-r border-slate-200">សម្ភារៈសិក្សា & POS (Supplies)</td>
                      <td className="py-1.5 px-3 text-center font-mono border-r border-slate-200">{categoryBreakdown.material.count}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold border-r border-slate-200">${categoryBreakdown.material.usd.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right font-mono">{categoryBreakdown.material.khr.toLocaleString()} ៛</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-khmer border-r border-slate-200">សេវារថយន្តសាលា (School Bus)</td>
                      <td className="py-1.5 px-3 text-center font-mono border-r border-slate-200">{categoryBreakdown.bus.count}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold border-r border-slate-200">${categoryBreakdown.bus.usd.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right font-mono">{categoryBreakdown.bus.khr.toLocaleString()} ៛</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-khmer border-r border-slate-200">ថ្លៃទីតាំងអាហារដ្ឋាន (Canteen)</td>
                      <td className="py-1.5 px-3 text-center font-mono border-r border-slate-200">{categoryBreakdown.canteen.count}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold border-r border-slate-200">${categoryBreakdown.canteen.usd.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right font-mono">{categoryBreakdown.canteen.khr.toLocaleString()} ៛</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-amber-100 font-bold border-t border-amber-300">
                    <tr>
                      <td className="py-2 px-3 font-khmer border-r border-amber-300">សរុបរួម (Grand Total)</td>
                      <td className="py-2 px-3 text-center font-mono border-r border-amber-300">{allDailyTransactions.length}</td>
                      <td className="py-2 px-3 text-right font-mono text-sm border-r border-amber-300">${totalUSD.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono">{totalKHR.toLocaleString()} ៛</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Itemized Transactions List */}
              <div>
                <h4 className="font-bold text-xs text-slate-800 font-khmer mb-2">
                  ២. បញ្ជីប្រតិបត្តិការលម្អិតប្រចាំថ្ងៃ (Itemized Transactions)
                </h4>
                <table className="w-full text-[11px] border border-slate-300">
                  <thead className="bg-slate-100 font-khmer font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-1 px-2 text-center w-8 border-r border-slate-300">ល.រ</th>
                      <th className="py-1 px-2 border-r border-slate-300">លេខវិក្កយបត្រ</th>
                      <th className="py-1 px-2 text-center border-r border-slate-300">ផ្នែក</th>
                      <th className="py-1 px-2 border-r border-slate-300">អ្នកបង់ / សិស្ស</th>
                      <th className="py-1 px-2 border-r border-slate-300">បរិយាយ</th>
                      <th className="py-1 px-2 text-center border-r border-slate-300">វិធី</th>
                      <th className="py-1 px-2 text-right">ទឹកប្រាក់ ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {allDailyTransactions.map((tx, idx) => (
                      <tr key={tx.id}>
                        <td className="py-1 px-2 text-center font-mono border-r border-slate-200">{idx + 1}</td>
                        <td className="py-1 px-2 font-mono font-bold border-r border-slate-200">{tx.receiptNo}</td>
                        <td className="py-1 px-2 text-center font-khmer border-r border-slate-200">{tx.categoryLabelKhmer}</td>
                        <td className="py-1 px-2 font-khmer border-r border-slate-200">{tx.payerName}</td>
                        <td className="py-1 px-2 font-khmer border-r border-slate-200 truncate max-w-xs">{tx.description}</td>
                        <td className="py-1 px-2 text-center font-mono border-r border-slate-200">{tx.paidBy}</td>
                        <td className="py-1 px-2 text-right font-mono font-bold">${tx.amountUSD.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tri-Signature Block */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-3 text-xs text-center font-khmer">
                <div className="space-y-12">
                  <div className="font-bold text-slate-800">ហត្ថលេខាបេឡាធិការ (Cashier)</div>
                  <div className="text-slate-400 font-mono">...................................</div>
                </div>
                <div className="space-y-12">
                  <div className="font-bold text-slate-800">ប្រធានគណនេយ្យ (Chief Accountant)</div>
                  <div className="text-slate-400 font-mono">...................................</div>
                </div>
                <div className="space-y-12">
                  <div className="font-bold text-slate-800">បានឃើញ និងឯកភាព - នាយកសាលា (Principal)</div>
                  <div className="text-slate-400 font-mono">...................................</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
