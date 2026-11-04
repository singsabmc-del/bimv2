import React, { useState, useMemo } from 'react';
import { StudentFeeRecord, StudentFeePaymentItem, BusPaymentRecord, BusStudentEnrollment } from '../types';
import { useApp } from '../context/AppContext';
import {
  Search,
  Filter,
  Printer,
  Download,
  Receipt,
  CreditCard,
  CheckCircle2,
  Clock,
  Send,
  X,
  FileSpreadsheet,
  Layers,
  ShoppingBag,
  BookOpen,
  GraduationCap,
  Calendar,
  User,
  Bus,
  MapPin,
  Phone,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  DollarSign,
  Tag,
  Package,
  Trash2,
  RotateCcw,
  AlertTriangle,
  QrCode,
} from 'lucide-react';
import { InvoiceQRCode } from './InvoiceQRCode';

interface StudentInvoiceHistoryTableProps {
  student: StudentFeeRecord;
  className?: string;
  showTitle?: boolean;
  onOpenQuickPay?: () => void;
  defaultTab?: 'all' | 'tuition' | 'materials' | 'bus';
}

export const StudentInvoiceHistoryTable: React.FC<StudentInvoiceHistoryTableProps> = ({
  student,
  className,
  showTitle = true,
  onOpenQuickPay,
  defaultTab = 'all',
}) => {
  const {
    settings,
    currentUser,
    sendTelegramAlert,
    t,
    uniformSalesHistory,
    materialSalesHistory,
    busEnrollments,
    busPayments,
    busRoutes,
    classData,
    selectedClassId,
    deleteStudentPaymentRecord,
    clearStudentsPaymentHistory,
    permissions,
    openInvoiceVerification,
  } = useApp();

  // Selection & Confirmation for deletion
  const [selectedReceiptKeys, setSelectedReceiptKeys] = useState<string[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    mode: 'single' | 'selected' | 'all';
    targetReceipt?: StudentFeePaymentItem;
  } | null>(null);

  const targetClassId = useMemo(() => {
    const found = Object.keys(classData).find(
      (cid) => classData[cid].className === className || classData[cid].students.some((s) => s.id === student.id)
    );
    return found || selectedClassId;
  }, [classData, className, student.id, selectedClassId]);

  // Active Main Sub-Tab
  const [activeTab, setActiveTab] = useState<'all' | 'tuition' | 'materials' | 'bus'>(defaultTab);

  // Search & Filters for Invoices
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  // Search & Filters for Materials
  const [materialsSearch, setMaterialsSearch] = useState('');
  const [materialsCategory, setMaterialsCategory] = useState<string>('all');

  // Search & Filters for Bus
  const [busSearch, setBusSearch] = useState('');

  // Active Invoice for Modal Preview
  const [selectedInvoice, setSelectedInvoice] = useState<StudentFeePaymentItem | null>(null);

  // 1. TUITION & GENERAL RECEIPTS
  const allTuitionReceipts: StudentFeePaymentItem[] = useMemo(() => {
    if (student.feeHistory && student.feeHistory.length > 0) {
      return student.feeHistory;
    }
    if (student.cash > 0 || student.feesGroup) {
      return [
        {
          receiptNo: `REC-2026-10-${student.id.toString().padStart(3, '0')}`,
          invoiceNo: `INV-2026-${student.id.toString().padStart(5, '0')}`,
          month: student.feesGroup || 'October 2026',
          months: [student.feesGroup || 'October 2026'],
          monthsCount: 1,
          feePerMonthUSD: student.cash || 12.5,
          discountUSD: 0,
          date: student.paymentDate || new Date().toISOString().slice(0, 10),
          amountUSD: student.cash || 12.5,
          amountKHR: Math.round((student.cash || 12.5) * settings.exchangeRate),
          paidBy: student.paidBy !== '$ -' ? student.paidBy : 'ABA',
          recordedBy: settings.accountantName || 'ប្រាជ្ញ ស៊ីដា',
          status: student.cash > 0 ? 'paid' : 'pending',
          itemType: 'tuition',
          description: `ថ្លៃសិក្សាប្រចាំ ${student.feesGroup || 'ខែតុលា'}`,
          note: `ទូទាត់សម្រាប់សិស្ស ${student.name}`,
        },
      ];
    }
    return [];
  }, [student, settings]);

  // 2. MATERIALS & UNIFORM PURCHASES
  const studentUniformPurchases = useMemo(() => {
    return (uniformSalesHistory || []).filter(
      (u) =>
        (u.studentId && u.studentId === student.id) ||
        (u.buyerName && (u.buyerName.includes(student.name) || student.name.includes(u.buyerName)))
    );
  }, [uniformSalesHistory, student]);

  const studentMaterialPurchases = useMemo(() => {
    return (materialSalesHistory || []).filter(
      (m) =>
        (m.studentId && m.studentId === student.id) ||
        (m.customerName && (m.customerName.includes(student.name) || student.name.includes(m.customerName)))
    );
  }, [materialSalesHistory, student]);

  // Combined materials & uniform items list
  const combinedMaterialItems = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      receiptNo: string;
      category: 'uniform' | 'stationery' | 'books' | 'uniform_card' | 'other';
      categoryLabel: string;
      name: string;
      size?: string;
      quantity: number;
      unitPriceKHR: number;
      unitPriceUSD: number;
      totalAmountKHR: number;
      totalAmountUSD: number;
      paymentMethod: 'Cash' | 'ABA' | 'AC';
      recordedBy: string;
      timestamp?: string;
    }> = [];

    // Uniform items
    studentUniformPurchases.forEach((u) => {
      const unitUSD = u.unitPriceKHR / settings.exchangeRate;
      const totalUSD = u.totalAmountKHR / settings.exchangeRate;
      list.push({
        id: u.id,
        date: u.date,
        receiptNo: u.receiptNo,
        category: 'uniform',
        categoryLabel: 'ឯកសណ្ឋាន (Uniform)',
        name: u.typeNameKhmer || (u.type === 'general_shirt' ? 'អាវសិស្សទូទៅ (ពណ៌ស)' : 'ខោ/សំពត់កីឡា'),
        size: u.size,
        quantity: u.quantity,
        unitPriceKHR: u.unitPriceKHR,
        unitPriceUSD: unitUSD,
        totalAmountKHR: u.totalAmountKHR,
        totalAmountUSD: totalUSD,
        paymentMethod: u.paymentMethod,
        recordedBy: u.recordedBy,
        timestamp: u.timestamp,
      });
    });

    // Material items
    studentMaterialPurchases.forEach((m) => {
      const unitUSD = m.unitPriceKHR / settings.exchangeRate;
      const totalUSD = m.totalAmountKHR / settings.exchangeRate;
      let catLabel = 'សម្ភារៈសិក្សា';
      if (m.category === 'books') catLabel = 'សៀវភៅ (Books)';
      else if (m.category === 'uniform_card') catLabel = 'កាតសិស្ស & ខ្សែពាក់';
      else if (m.category === 'stationery') catLabel = 'សម្ភារៈ (Stationery)';

      list.push({
        id: m.id,
        date: m.date,
        receiptNo: m.receiptNo,
        category: m.category as any,
        categoryLabel: catLabel,
        name: m.itemName,
        quantity: m.quantity,
        unitPriceKHR: m.unitPriceKHR,
        unitPriceUSD: unitUSD,
        totalAmountKHR: m.totalAmountKHR,
        totalAmountUSD: totalUSD,
        paymentMethod: m.paymentMethod,
        recordedBy: m.recordedBy,
        timestamp: m.timestamp,
      });
    });

    // Sort by date descending
    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return list;
  }, [studentUniformPurchases, studentMaterialPurchases, settings]);

  // 3. SCHOOL BUS SERVICE
  const studentBusEnrollment: BusStudentEnrollment | undefined = useMemo(() => {
    return (busEnrollments || []).find(
      (b) =>
        b.studentId === student.id ||
        (b.studentCode && b.studentCode.toLowerCase() === student.studentCode.toLowerCase()) ||
        (b.studentName && (b.studentName.includes(student.name) || student.name.includes(b.studentName)))
    );
  }, [busEnrollments, student]);

  const studentBusRoute = useMemo(() => {
    if (!studentBusEnrollment?.routeId) return null;
    return (busRoutes || []).find((r) => r.id === studentBusEnrollment.routeId) || null;
  }, [studentBusEnrollment, busRoutes]);

  const studentBusPayments: BusPaymentRecord[] = useMemo(() => {
    return (busPayments || []).filter(
      (p) =>
        p.studentId === student.id ||
        (p.studentCode && p.studentCode.toLowerCase() === student.studentCode.toLowerCase()) ||
        (p.studentName && (p.studentName.includes(student.name) || student.name.includes(p.studentName)))
    );
  }, [busPayments, student]);

  // 4. UNIFIED ALL INVOICES (Tuition + Uniform/Material Receipts + Bus Payments)
  const unifiedAllInvoices: StudentFeePaymentItem[] = useMemo(() => {
    const list: StudentFeePaymentItem[] = [...allTuitionReceipts];

    // Add Uniform & Material purchases as unified invoice items
    combinedMaterialItems.forEach((m) => {
      // Check if already in list by receiptNo to avoid double count
      if (!list.some((it) => it.receiptNo === m.receiptNo || it.invoiceNo === m.receiptNo)) {
        list.push({
          receiptNo: m.receiptNo,
          invoiceNo: m.receiptNo,
          month: m.date ? `${m.date.slice(0, 7)}` : '2026',
          monthsCount: 1,
          date: m.date,
          amountUSD: m.totalAmountUSD,
          amountKHR: m.totalAmountKHR,
          paidBy: m.paymentMethod as any,
          recordedBy: m.recordedBy,
          status: 'paid',
          itemType: m.category === 'uniform' ? 'uniform' : 'stationery',
          description: `${m.name} ${m.size ? `(Size: ${m.size})` : ''} x${m.quantity}`,
          note: `ទិញសម្ភារៈ/ឯកសណ្ឋាន (POS Purchase)`,
        });
      }
    });

    // Add Bus payments as unified invoice items
    studentBusPayments.forEach((b) => {
      if (!list.some((it) => it.receiptNo === b.receiptNo || it.invoiceNo === b.invoiceNo)) {
        list.push({
          receiptNo: b.receiptNo,
          invoiceNo: b.invoiceNo || b.receiptNo,
          month: b.month,
          months: b.months || [b.month],
          monthsCount: b.monthsCount || 1,
          feePerMonthUSD: b.feePerMonthUSD,
          discountUSD: b.discountUSD || 0,
          date: b.paymentDate,
          amountUSD: b.amountUSD,
          amountKHR: b.amountKHR,
          paidBy: b.paidBy,
          recordedBy: b.recordedBy,
          status: 'paid',
          itemType: 'bus',
          description: `សេវាឡានក្រុង ${b.routeName || 'ខ្សែរថយន្តសាលា'} (${b.month})`,
          note: b.notes || 'សេវារថយន្តសាលាប្រចាំខែ',
        });
      }
    });

    // Sort descending by date
    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return list;
  }, [allTuitionReceipts, combinedMaterialItems, studentBusPayments]);

  // Unique months in unified invoices
  const uniqueMonths = useMemo(() => {
    const set = new Set<string>();
    unifiedAllInvoices.forEach((r) => {
      if (r.months && r.months.length > 0) {
        r.months.forEach((m) => set.add(m));
      } else if (r.month) {
        set.add(r.month);
      }
    });
    return Array.from(set);
  }, [unifiedAllInvoices]);

  // Filtered invoices according to activeTab
  const activeInvoicesList = useMemo(() => {
    if (activeTab === 'tuition') {
      return unifiedAllInvoices.filter((r) => r.itemType === 'tuition' || (!r.itemType && !r.description?.includes('ឡានក្រុង')));
    }
    if (activeTab === 'materials') {
      return unifiedAllInvoices.filter((r) => r.itemType === 'uniform' || r.itemType === 'stationery');
    }
    if (activeTab === 'bus') {
      return unifiedAllInvoices.filter((r) => r.itemType === 'bus');
    }
    return unifiedAllInvoices;
  }, [activeTab, unifiedAllInvoices]);

  const filteredInvoices = useMemo(() => {
    return activeInvoicesList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.invoiceNo && item.invoiceNo.toLowerCase().includes(q)) ||
        item.receiptNo.toLowerCase().includes(q) ||
        item.month.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.note && item.note.toLowerCase().includes(q));

      const itemCategory = item.itemType || 'tuition';
      const matchesCategory =
        filterCategory === 'all' || itemCategory === filterCategory;

      const matchesMethod =
        filterMethod === 'all' || item.paidBy === filterMethod;

      const matchesStatus =
        filterStatus === 'all' || item.status === filterStatus;

      const matchesMonth =
        filterMonth === 'all' ||
        (item.months && item.months.includes(filterMonth)) ||
        item.month.includes(filterMonth);

      return matchesSearch && matchesCategory && matchesMethod && matchesStatus && matchesMonth;
    });
  }, [activeInvoicesList, searchQuery, filterCategory, filterMethod, filterStatus, filterMonth]);

  // Filtered Materials
  const filteredMaterials = useMemo(() => {
    return combinedMaterialItems.filter((item) => {
      const q = materialsSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.receiptNo.toLowerCase().includes(q) ||
        item.date.toLowerCase().includes(q);

      const matchesCat =
        materialsCategory === 'all' || item.category === materialsCategory;

      return matchesSearch && matchesCat;
    });
  }, [combinedMaterialItems, materialsSearch, materialsCategory]);

  // Financial KPI calculations
  const totalInvoicesUSD = useMemo(
    () => filteredInvoices.reduce((sum, item) => sum + item.amountUSD, 0),
    [filteredInvoices]
  );
  const totalInvoicesKHR = useMemo(
    () => filteredInvoices.reduce((sum, item) => sum + (item.amountKHR || item.amountUSD * settings.exchangeRate), 0),
    [filteredInvoices, settings]
  );

  const totalMaterialsKHR = useMemo(
    () => filteredMaterials.reduce((sum, item) => sum + item.totalAmountKHR, 0),
    [filteredMaterials]
  );
  const totalMaterialsUSD = useMemo(
    () => totalMaterialsKHR / settings.exchangeRate,
    [totalMaterialsKHR, settings]
  );

  const totalBusPaidUSD = useMemo(
    () => studentBusPayments.reduce((sum, item) => sum + item.amountUSD, 0),
    [studentBusPayments]
  );
  const totalBusPaidKHR = useMemo(
    () => studentBusPayments.reduce((sum, item) => sum + item.amountKHR, 0),
    [studentBusPayments]
  );

  // Category Icon & Badge
  const getCategoryBadge = (item: StudentFeePaymentItem) => {
    const type = item.itemType || 'tuition';
    switch (type) {
      case 'tuition':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 font-khmer">
            <GraduationCap className="w-3 h-3 text-blue-600" />
            <span>ថ្លៃសិក្សា (Tuition)</span>
          </span>
        );
      case 'uniform':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 font-khmer">
            <ShoppingBag className="w-3 h-3 text-purple-600" />
            <span>ឯកសណ្ឋាន (Uniform)</span>
          </span>
        );
      case 'stationery':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 font-khmer">
            <BookOpen className="w-3 h-3 text-amber-700" />
            <span>សម្ភារសិក្សា (Stationery)</span>
          </span>
        );
      case 'admission':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-khmer">
            <User className="w-3 h-3 text-emerald-600" />
            <span>ចុះឈ្មោះចូលរៀន (Admission)</span>
          </span>
        );
      case 'bus':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 font-khmer">
            <Bus className="w-3 h-3 text-sky-600" />
            <span>សេវាឡានក្រុង (Bus)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-khmer">
            <span>ទូទៅ</span>
          </span>
        );
    }
  };

  // Payment Method Badge
  const getMethodBadge = (method: string) => {
    if (method === 'ABA') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-sky-100 text-sky-900 border border-sky-200">
          ABA Pay
        </span>
      );
    }
    if (method === 'AC') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-blue-100 text-blue-900 border border-blue-200">
          ACLEDA
        </span>
      );
    }
    if (method === 'Cash') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-200">
          Cash ($ / ៛)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-500">
        {method}
      </span>
    );
  };

  // Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-khmer">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>បានបង់រួច</span>
          </span>
        );
      case 'prepaid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 font-khmer">
            <Layers className="w-3 h-3 text-indigo-600" />
            <span>បង់មុន</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 font-khmer">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>រង់ចាំទូទាត់</span>
          </span>
        );
      case 'waived':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 font-khmer">
            <span>លើកលែង</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Export CSV
  const handleExportCSV = (tableType: 'invoices' | 'materials' | 'bus') => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = '';

    if (tableType === 'invoices') {
      headers = [
        'No',
        'Invoice No',
        'Receipt No',
        'Date',
        'Category',
        'Description',
        'Months',
        'Amount USD',
        'Amount KHR',
        'Method',
        'Recorded By',
        'Status',
        'Note',
      ];
      rows = filteredInvoices.map((r, i) => [
        i + 1,
        r.invoiceNo || '',
        r.receiptNo || '',
        r.date || '',
        r.itemType || 'tuition',
        `"${(r.description || '').replace(/"/g, '""')}"`,
        `"${(r.months?.join(', ') || r.month || '').replace(/"/g, '""')}"`,
        r.amountUSD.toFixed(2),
        r.amountKHR || Math.round(r.amountUSD * settings.exchangeRate),
        r.paidBy,
        r.recordedBy,
        r.status,
        `"${(r.note || '').replace(/"/g, '""')}"`,
      ]);
      filename = `Invoices_${student.studentCode}_${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (tableType === 'materials') {
      headers = ['No', 'Receipt No', 'Date', 'Category', 'Item Name', 'Size', 'Qty', 'Unit Price KHR', 'Total KHR', 'Total USD', 'Method', 'Recorded By'];
      rows = filteredMaterials.map((m, i) => [
        i + 1,
        m.receiptNo,
        m.date,
        m.categoryLabel,
        `"${m.name.replace(/"/g, '""')}"`,
        m.size || '-',
        m.quantity,
        m.unitPriceKHR,
        m.totalAmountKHR,
        m.totalAmountUSD.toFixed(2),
        m.paymentMethod,
        m.recordedBy,
      ]);
      filename = `Materials_Purchases_${student.studentCode}_${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      headers = ['No', 'Invoice No', 'Receipt No', 'Date', 'Month', 'Route', 'Amount USD', 'Amount KHR', 'Method', 'Recorded By', 'Notes'];
      rows = studentBusPayments.map((b, i) => [
        i + 1,
        b.invoiceNo || b.receiptNo,
        b.receiptNo,
        b.paymentDate,
        b.month,
        `"${(b.routeName || '').replace(/"/g, '""')}"`,
        b.amountUSD.toFixed(2),
        b.amountKHR,
        b.paidBy,
        b.recordedBy,
        `"${(b.notes || '').replace(/"/g, '""')}"`,
      ]);
      filename = `Bus_Payments_${student.studentCode}_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Telegram alert
  const handleShareTelegram = (receipt: StudentFeePaymentItem) => {
    sendTelegramAlert(
      `🧾 វិក្កយបត្របង់ប្រាក់សិស្ស (Invoice Record)`,
      `សិស្ស៖ ${student.name} (${className || '1A'})\nអត្តលេខ៖ ${student.studentCode}\nលេខវិក្កយបត្រ៖ ${receipt.invoiceNo || receipt.receiptNo}\nកាលបរិច្ឆេទ៖ ${receipt.date}\nបរិយាយ៖ ${receipt.description || receipt.month}\nចំនួនទឹកប្រាក់៖ $${receipt.amountUSD.toFixed(2)} (${(receipt.amountKHR || receipt.amountUSD * settings.exchangeRate).toLocaleString()} ៛)\nវិធីទូទាត់៖ ${receipt.paidBy}\nអ្នកកត់ត្រា៖ ${receipt.recordedBy}\nស្ថានភាព៖ ${receipt.status.toUpperCase()}`,
      'fee',
      student.name
    );
  };

  return (
    <div className="space-y-4">
      {/* Optional Top Title Header */}
      {showTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 font-khmer">
                  {t('ប្រវត្តិវិក្កយបត្រ សម្ភារៈ & សេវារថយន្តសាលា', 'Invoices, Materials & Bus Service Ledger')}
                </h3>
                <p className="text-xs text-slate-500 font-khmer">
                  តារាងលម្អិតវិក្កយបត្រថ្លៃសិក្សា ប្រវត្តិទិញសម្ភារៈ/ឯកសណ្ឋាន និងសេវារថយន្តរបស់សិស្ស៖{' '}
                  <span className="font-bold text-slate-800">{student.name}</span> ({student.studentCode})
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {onOpenQuickPay && (
              <button
                onClick={onOpenQuickPay}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold font-khmer transition-all shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>បង់ថ្លៃសិក្សា & ចេញវិក្កយបត្រ</span>
              </button>
            )}

            <button
              onClick={() => handleExportCSV(activeTab === 'materials' ? 'materials' : activeTab === 'bus' ? 'bus' : 'invoices')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold font-khmer transition-colors shadow-2xs"
              title="ទាញយកជា CSV (Export CSV)"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold font-khmer transition-colors shadow-2xs"
              title="បោះពុម្ពតារាង"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('បោះពុម្ពតារាង', 'Print Table')}</span>
            </button>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION SUB-TABS (All, Tuition, Materials/Uniforms, School Bus) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-khmer">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>វិក្កយបត្រទាំងអស់ ({unifiedAllInvoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tuition')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === 'tuition'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>ថ្លៃសិក្សា ({allTuitionReceipts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === 'materials'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>ទិញសម្ភារៈ & ឯកសណ្ឋាន ({combinedMaterialItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bus')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === 'bus'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
          }`}
        >
          <Bus className="w-3.5 h-3.5" />
          <span>សេវារថយន្តសាលា ({studentBusPayments.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1 & 2: INVOICES & TUITION LEDGER TABLE */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'tuition') && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 font-khmer">
                {activeTab === 'tuition' ? 'សរុបថ្លៃសិក្សាបានទូទាត់ ($)' : 'ទឹកប្រាក់បានទូទាត់សរុប ($)'}
              </div>
              <div className="text-xl font-black font-mono text-emerald-700 mt-1">
                ${totalInvoicesUSD.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                ≈ {totalInvoicesKHR.toLocaleString()} ៛
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 font-khmer">
                ចំនួនវិក្កយបត្រសរុប
              </div>
              <div className="text-xl font-black font-mono text-slate-900 mt-1">
                {filteredInvoices.length} <span className="text-xs font-normal font-khmer text-slate-500">ច្បាប់</span>
              </div>
              <div className="text-[10px] text-emerald-600 font-bold font-khmer mt-0.5">
                ស្ថានភាព៖ បានបង់រួចរាល់
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 font-khmer">
                វិធីទូទាត់ចម្បង
              </div>
              <div className="text-sm font-black font-mono text-slate-900 mt-2">
                {student.paidBy !== '$ -' ? student.paidBy : 'ABA / Cash'}
              </div>
              <div className="text-[10px] text-slate-400 font-khmer mt-0.5">
                ប្រភេទថ្លៃសិក្សា: {student.caseType}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 font-khmer">
                កាលបរិច្ឆេទចុងក្រោយ
              </div>
              <div className="text-sm font-bold font-mono text-slate-800 mt-2">
                {filteredInvoices[0]?.date || student.paymentDate || 'N/A'}
              </div>
              <div className="text-[10px] text-indigo-600 font-khmer mt-0.5">
                ក្រុម៖ {student.feesGroup}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs">
              <div className="relative sm:col-span-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="ស្វែងរកតាមលេខវិក្កយបត្រ, បរិយាយ, ខែ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {activeTab === 'all' && (
                <div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="all">ប្រភេទទាំងអស់ (All Categories)</option>
                    <option value="tuition">ថ្លៃសិក្សា (Tuition)</option>
                    <option value="uniform">ឯកសណ្ឋាន (Uniform)</option>
                    <option value="stationery">សម្ភារសិក្សា (Stationery)</option>
                    <option value="admission">ចុះឈ្មោះចូលរៀន (Admission)</option>
                    <option value="bus">ឡានក្រុង (Bus)</option>
                  </select>
                </div>
              )}

              <div>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="all">វិធីទូទាត់ទាំងអស់ (All Methods)</option>
                  <option value="ABA">ABA Pay</option>
                  <option value="AC">ACLEDA Bank</option>
                  <option value="Cash">Cash (សាច់ប្រាក់)</option>
                </select>
              </div>

              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="all">ស្ថានភាពទាំងអស់ (All Status)</option>
                  <option value="paid">បានបង់រួច (Paid)</option>
                  <option value="prepaid">បង់មុន (Prepaid)</option>
                  <option value="pending">រង់ចាំ (Pending)</option>
                </select>
              </div>
            </div>

            {uniqueMonths.length > 1 && (
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto text-[11px] font-khmer">
                <span className="text-slate-400 font-bold whitespace-nowrap">ខែសិក្សា៖</span>
                <button
                  onClick={() => setFilterMonth('all')}
                  className={`px-2 py-0.5 rounded-md whitespace-nowrap font-medium transition-all ${
                    filterMonth === 'all'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ទាំងអស់
                </button>
                {uniqueMonths.map((m) => (
                  <button
                    key={m}
                    onClick={() => setFilterMonth(m)}
                    className={`px-2 py-0.5 rounded-md whitespace-nowrap font-medium transition-all ${
                      filterMonth === m
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Batch Actions & Clear Payment History Toolbar (Admin Only) */}
          {currentUser.role === 'admin' && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-khmer text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={filteredInvoices.length > 0 && selectedReceiptKeys.length === filteredInvoices.length}
                    onChange={() => {
                      if (selectedReceiptKeys.length === filteredInvoices.length) {
                        setSelectedReceiptKeys([]);
                      } else {
                        setSelectedReceiptKeys(filteredInvoices.map((r) => r.receiptNo || r.invoiceNo || ''));
                      }
                    }}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-bold">
                    {selectedReceiptKeys.length > 0
                      ? `បានជ្រើសរើស (${selectedReceiptKeys.length}/${filteredInvoices.length})`
                      : 'ជ្រើសរើសទាំងអស់ (Select All)'}
                  </span>
                </label>

                {selectedReceiptKeys.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedReceiptKeys([])}
                    className="text-xs text-slate-500 hover:text-slate-800 underline font-khmer ml-1"
                  >
                    ដោះការជ្រើសរើស
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedReceiptKeys.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmModal({ isOpen: true, mode: 'selected' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold font-khmer transition-all shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>លុបវិក្កយបត្រដែលបានជ្រើស ({selectedReceiptKeys.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setConfirmModal({ isOpen: true, mode: 'all' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-bold font-khmer transition-all shadow-2xs"
                  title="សម្អាតប្រវត្តិបង់ប្រាក់ទាំងអស់របស់សិស្សនេះ (Admin Only)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>សម្អាតប្រវត្តិទាំងអស់ (Clear All)</span>
                </button>
              </div>
            </div>
          )}

          {/* Formatted Invoices Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-amber-400 text-slate-900 font-bold border-b border-amber-500 font-khmer select-none">
                    {currentUser.role === 'admin' && (
                      <th className="py-2.5 px-2 border-r border-amber-500 text-center w-9">
                        <input
                          type="checkbox"
                          checked={filteredInvoices.length > 0 && selectedReceiptKeys.length === filteredInvoices.length}
                          onChange={() => {
                            if (selectedReceiptKeys.length === filteredInvoices.length) {
                              setSelectedReceiptKeys([]);
                            } else {
                              setSelectedReceiptKeys(filteredInvoices.map((r) => r.receiptNo || r.invoiceNo || ''));
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          title="ជ្រើសរើសទាំងអស់"
                        />
                      </th>
                    )}
                    <th className="py-2.5 px-3 border-r border-amber-500 text-center w-10">ល.រ</th>
                    <th className="py-2.5 px-3 border-r border-amber-500 whitespace-nowrap">កាលបរិច្ឆេទ</th>
                    <th className="py-2.5 px-3 border-r border-amber-500 whitespace-nowrap">លេខវិក្កយបត្រ / បង្កាន់ដៃ</th>
                    <th className="py-2.5 px-3 border-r border-amber-500">ប្រភេទ & បរិយាយ</th>
                    <th className="py-2.5 px-3 border-r border-amber-500 text-center whitespace-nowrap">រយៈពេល / ខែ</th>
                    <th className="py-2.5 px-3 border-r border-amber-500 text-right whitespace-nowrap">ទឹកប្រាក់ ($)</th>
                    <th className="py-2.5 px-3 border-r border-amber-500 text-right whitespace-nowrap">ប្រាក់រៀល (៛)</th>
                    <th className="py-2.5 px-3 border-r border-amber-500 text-center whitespace-nowrap">វិធីទូទាត់</th>
                    <th className="py-2.5 px-3 border-r border-amber-500 whitespace-nowrap">បេឡាធិការ</th>
                    <th className="py-2.5 px-3 border-r border-amber-500 text-center whitespace-nowrap">ស្ថានភាព</th>
                    <th className="py-2.5 px-3 border-r border-amber-500">កំណត់ចំណាំ</th>
                    <th className="py-2.5 px-3 text-center no-print whitespace-nowrap">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={currentUser.role === 'admin' ? 13 : 12} className="py-10 text-center text-slate-400 font-khmer">
                        <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <div>មិនមានទិន្នន័យវិក្កយបត្រត្រូវនឹងការស្វែងរកឡើយ</div>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((rec, index) => {
                      const amountKHR = rec.amountKHR || Math.round(rec.amountUSD * settings.exchangeRate);
                      const key = rec.receiptNo || rec.invoiceNo || `inv-${index}`;
                      const isSelected = selectedReceiptKeys.includes(key);

                      return (
                        <tr
                          key={key}
                          className={`transition-colors ${isSelected ? 'bg-amber-100/70' : 'hover:bg-amber-50/40'}`}
                        >
                          {currentUser.role === 'admin' && (
                            <td className="py-2.5 px-2 border-r border-slate-200 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedReceiptKeys((prev) =>
                                    prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
                                  );
                                }}
                                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-500 font-medium">
                            {index + 1}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-slate-800 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{rec.date}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-mono whitespace-nowrap">
                            <div className="font-bold text-slate-900">
                              {rec.invoiceNo || rec.receiptNo}
                            </div>
                            {rec.invoiceNo && rec.receiptNo && rec.invoiceNo !== rec.receiptNo && (
                              <div className="text-[10px] text-slate-400">
                                Rec: {rec.receiptNo}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-khmer">
                            <div className="space-y-1">
                              <div>{getCategoryBadge(rec)}</div>
                              <div className="font-semibold text-slate-900 text-xs">
                                {rec.description || `ថ្លៃសិក្សា ${rec.month}`}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center font-khmer whitespace-nowrap">
                            {rec.months && rec.months.length > 0 ? (
                              <div>
                                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                                  {rec.months.length} ខែ
                                </span>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5 max-w-[140px] truncate" title={rec.months.join(', ')}>
                                  {rec.months.join(', ')}
                                </div>
                              </div>
                            ) : (
                              <span className="font-medium text-slate-700 font-mono">{rec.month}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-extrabold text-slate-900 whitespace-nowrap">
                            ${rec.amountUSD.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono text-slate-700 whitespace-nowrap">
                            {amountKHR.toLocaleString()} ៛
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center whitespace-nowrap">
                            {getMethodBadge(rec.paidBy)}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-khmer text-slate-700 whitespace-nowrap">
                            {rec.recordedBy || settings.accountantName}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center whitespace-nowrap">
                            {getStatusBadge(rec.status)}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-khmer text-slate-600 text-[11px] max-w-[160px] truncate" title={rec.note || ''}>
                            {rec.note || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center no-print whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setSelectedInvoice(rec)}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md font-bold text-[10px] font-khmer flex items-center gap-1 transition-all"
                                title="មើល & បោះពុម្ពវិក្កយបត្រ"
                              >
                                <Receipt className="w-3 h-3 text-indigo-600" />
                                <span>វិក្កយបត្រ</span>
                              </button>
                              <button
                                onClick={() => openInvoiceVerification(rec.invoiceNo || rec.receiptNo, student.studentCode)}
                                className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors"
                                title="ផ្ទៀងផ្ទាត់ QR Code"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleShareTelegram(rec)}
                                className="p-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-md transition-colors"
                                title="ផ្ញើទៅ Telegram"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                              {currentUser.role === 'admin' && (
                                <button
                                  onClick={() => setConfirmModal({ isOpen: true, mode: 'single', targetReceipt: rec })}
                                  className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                                  title="លុបវិក្កយបត្រនេះ (Admin Only)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-amber-300 font-bold text-slate-900 border-t-2 border-amber-500 font-khmer">
                    <td colSpan={currentUser.role === 'admin' ? 6 : 5} className="py-2.5 px-4 text-right border-r border-amber-400 uppercase tracking-wide">
                      សរុបទឹកប្រាក់វិក្កយបត្រ (Grand Total):
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 border-r border-amber-400 text-sm whitespace-nowrap">
                      ${totalInvoicesUSD.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 border-r border-amber-400 whitespace-nowrap">
                      {totalInvoicesKHR.toLocaleString()} ៛
                    </td>
                    <td colSpan={5} className="py-2.5 px-4 text-left font-mono text-[11px] text-slate-700">
                      ចំនួន {filteredInvoices.length} វិក្កយបត្រ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MATERIALS & UNIFORM PURCHASES HISTORY TABLE (ប្រវត្តិទិញសម្ភារៈ) */}
      {/* ========================================================================= */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200">
              <div className="text-[11px] font-bold text-purple-900 font-khmer">
                សរុបការទិញសម្ភារៈ & ឯកសណ្ឋាន (៛)
              </div>
              <div className="text-xl font-black font-mono text-purple-900 mt-1">
                {totalMaterialsKHR.toLocaleString()} ៛
              </div>
              <div className="text-[10px] text-purple-600 font-mono mt-0.5">
                ≈ ${totalMaterialsUSD.toFixed(2)} USD
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 font-khmer">
                ចំនួនមុខទំនិញបានទិញសរុប
              </div>
              <div className="text-xl font-black font-mono text-slate-900 mt-1">
                {filteredMaterials.reduce((acc, it) => acc + it.quantity, 0)}{' '}
                <span className="text-xs font-normal font-khmer text-slate-500">មុខ/កំប្លេ</span>
              </div>
              <div className="text-[10px] text-slate-500 font-khmer mt-0.5">
                សរុប {filteredMaterials.length} ប្រតិបត្តិការ
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 font-khmer">
                ឯកសណ្ឋានសាលា
              </div>
              <div className="text-xl font-black font-mono text-slate-900 mt-1">
                {studentUniformPurchases.reduce((acc, it) => acc + it.quantity, 0)}{' '}
                <span className="text-xs font-normal font-khmer text-slate-500">កំប្លេ</span>
              </div>
              <div className="text-[10px] text-purple-700 font-khmer mt-0.5">
                អាវសិស្ស & ខោ/សំពត់កីឡា
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 font-khmer">
                សៀវភៅ & សម្ភារៈសិក្សា
              </div>
              <div className="text-xl font-black font-mono text-slate-900 mt-1">
                {studentMaterialPurchases.reduce((acc, it) => acc + it.quantity, 0)}{' '}
                <span className="text-xs font-normal font-khmer text-slate-500">មុខ</span>
              </div>
              <div className="text-[10px] text-amber-800 font-khmer mt-0.5">
                សៀវភៅ, កាត, ខ្មៅដៃ...
              </div>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="ស្វែងរកតាមឈ្មោះសម្ភារៈ, លេខវិក្កយបត្រ..."
                value={materialsSearch}
                onChange={(e) => setMaterialsSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={materialsCategory}
                onChange={(e) => setMaterialsCategory(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="all">ប្រភេទសម្ភារៈទាំងអស់ (All Categories)</option>
                <option value="uniform">ឯកសណ្ឋាន (Uniforms)</option>
                <option value="books">សៀវភៅសិក្សា (Books)</option>
                <option value="stationery">សម្ភារៈ (Stationery)</option>
                <option value="uniform_card">កាតសិស្ស & ខ្សែពាក់ (ID Card)</option>
              </select>
            </div>
          </div>

          {/* Materials & Uniform History Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-purple-600 text-white font-bold border-b border-purple-700 font-khmer">
                    <th className="py-2.5 px-3 border-r border-purple-500 text-center w-10">ល.រ</th>
                    <th className="py-2.5 px-3 border-r border-purple-500 whitespace-nowrap">កាលបរិច្ឆេទ</th>
                    <th className="py-2.5 px-3 border-r border-purple-500 whitespace-nowrap">លេខបង្កាន់ដៃ</th>
                    <th className="py-2.5 px-3 border-r border-purple-500">ប្រភេទ</th>
                    <th className="py-2.5 px-3 border-r border-purple-500">មុខទំនិញ / សម្ភារៈ</th>
                    <th className="py-2.5 px-3 border-r border-purple-500 text-center whitespace-nowrap">ទំហំ / Size</th>
                    <th className="py-2.5 px-3 border-r border-purple-500 text-center whitespace-nowrap">បរិមាណ</th>
                    <th className="py-2.5 px-3 border-r border-purple-500 text-right whitespace-nowrap">តម្លៃរាយ (៛)</th>
                    <th className="py-2.5 px-3 border-r border-purple-500 text-right whitespace-nowrap">សរុប (៛)</th>
                    <th className="py-2.5 px-3 border-r border-purple-500 text-right whitespace-nowrap">សមមូល ($)</th>
                    <th className="py-2.5 px-3 border-r border-purple-500 text-center whitespace-nowrap">វិធីទូទាត់</th>
                    <th className="py-2.5 px-3 border-r border-purple-500 whitespace-nowrap">អ្នកកត់ត្រា</th>
                    <th className="py-2.5 px-3 text-center no-print whitespace-nowrap">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-10 text-center text-slate-400 font-khmer">
                        <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <div>មិនទាន់មានប្រវត្តិទិញសម្ភារៈ ឬឯកសណ្ឋានសម្រាប់សិស្សនេះនៅឡើយទេ</div>
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-purple-50/40 transition-colors">
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-500 font-medium">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-slate-800 whitespace-nowrap">
                          {item.date}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {item.receiptNo}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-khmer">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.category === 'uniform'
                              ? 'bg-purple-100 text-purple-800'
                              : item.category === 'books'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {item.categoryLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-khmer font-bold text-slate-900">
                          {item.name}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-semibold text-slate-700 whitespace-nowrap">
                          {item.size ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                              {item.size}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-900 whitespace-nowrap">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono text-slate-700 whitespace-nowrap">
                          {item.unitPriceKHR.toLocaleString()} ៛
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-black text-purple-900 whitespace-nowrap">
                          {item.totalAmountKHR.toLocaleString()} ៛
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                          ${item.totalAmountUSD.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center whitespace-nowrap">
                          {getMethodBadge(item.paymentMethod)}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-khmer text-slate-700 whitespace-nowrap">
                          {item.recordedBy}
                        </td>
                        <td className="py-2.5 px-3 text-center no-print whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedInvoice({
                                receiptNo: item.receiptNo,
                                invoiceNo: item.receiptNo,
                                month: item.date,
                                monthsCount: 1,
                                date: item.date,
                                amountUSD: item.totalAmountUSD,
                                amountKHR: item.totalAmountKHR,
                                paidBy: item.paymentMethod as any,
                                recordedBy: item.recordedBy,
                                status: 'paid',
                                itemType: item.category === 'uniform' ? 'uniform' : 'stationery',
                                description: `${item.name} ${item.size ? `(Size: ${item.size})` : ''} x${item.quantity}`,
                                note: 'វិក្កយបត្រទិញសម្ភារៈ/ឯកសណ្ឋានសាលា',
                              });
                            }}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-md font-bold text-[10px] font-khmer flex items-center gap-1 transition-all"
                            title="មើល & បោះពុម្ពបង្កាន់ដៃ"
                          >
                            <Receipt className="w-3 h-3 text-purple-600" />
                            <span>វិក្កយបត្រ</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-purple-100 font-bold text-purple-950 border-t-2 border-purple-300 font-khmer">
                    <td colSpan={8} className="py-2.5 px-4 text-right border-r border-purple-200 uppercase tracking-wide">
                      សរុបទឹកប្រាក់សម្ភារៈ & ឯកសណ្ឋាន (Grand Total):
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-purple-950 border-r border-purple-200 text-sm whitespace-nowrap">
                      {totalMaterialsKHR.toLocaleString()} ៛
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-purple-950 border-r border-purple-200 whitespace-nowrap">
                      ${totalMaterialsUSD.toFixed(2)}
                    </td>
                    <td colSpan={3} className="py-2.5 px-4 text-left font-mono text-[11px] text-purple-800">
                      សរុប {filteredMaterials.length} ប្រតិបត្តិការ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SCHOOL BUS SERVICE HISTORY & ENROLLMENT (សេវារថយន្តសាលា) */}
      {/* ========================================================================= */}
      {activeTab === 'bus' && (
        <div className="space-y-4">
          {/* School Bus Enrollment Card */}
          <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider font-khmer">
                    ព័ត៌មានចុះឈ្មោះសេវារថយន្តសាលា (School Bus Enrollment)
                  </div>
                  <h4 className="font-bold text-slate-900 text-base font-khmer">
                    {studentBusEnrollment ? studentBusEnrollment.studentName : student.name}
                  </h4>
                </div>
              </div>

              <div>
                {studentBusEnrollment ? (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-khmer ${
                    studentBusEnrollment.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : studentBusEnrollment.status === 'waived'
                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}>
                    {studentBusEnrollment.status === 'paid' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>បានបង់សេវាឡានរួចរាល់ (${studentBusEnrollment.monthlyFeeUSD}/ខែ)</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>មិនទាន់បង់សេវាឡាន (${studentBusEnrollment.monthlyFeeUSD}/ខែ)</span>
                      </>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 font-khmer">
                    មិនទាន់បានចុះឈ្មោះសេវាឡានក្រុង
                  </span>
                )}
              </div>
            </div>

            {/* Route & Driver Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-khmer">
              <div className="p-3 bg-white/80 rounded-xl border border-sky-100">
                <span className="text-slate-500 block text-[10px]">ខ្សែរថយន្ត (Route):</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                  {studentBusRoute ? studentBusRoute.name : 'ខ្សែទី១៖ ច្បារអំពៅ - បឹងកេងកង'}
                </span>
                <span className="text-[10px] text-sky-700 font-mono mt-0.5 block">
                  ស្លាកលេខ៖ {studentBusRoute?.vehiclePlate || 'ភ្នំពេញ 2BC-8899'}
                </span>
              </div>

              <div className="p-3 bg-white/80 rounded-xl border border-sky-100">
                <span className="text-slate-500 block text-[10px]">អ្នកបើកបរ (Driver):</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                  {studentBusRoute?.driverName || 'ឈុន វ៉ាន់ថេង'}
                </span>
                <span className="text-[10px] text-slate-600 font-mono mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {studentBusRoute?.driverPhone || '012 345 678'}
                </span>
              </div>

              <div className="p-3 bg-white/80 rounded-xl border border-sky-100">
                <span className="text-slate-500 block text-[10px]">ទីតាំងទទួល / ដាក់ (Stop):</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                  {studentBusEnrollment?.pickupLocation || 'វត្តច្បារអំពៅ'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  ទៅកាន់៖ {studentBusEnrollment?.dropoffLocation || 'សាលា អ៊ីរ៉ែលកម្ពុជា'}
                </span>
              </div>

              <div className="p-3 bg-white/80 rounded-xl border border-sky-100">
                <span className="text-slate-500 block text-[10px]">វេនរថយន្ត & តម្លៃ:</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                  {studentBusEnrollment?.shift === 'both' ? 'ទៅ និង មក (ទាំងសងខាង)' : studentBusEnrollment?.shift === 'morning' ? 'ពេលព្រឹក' : 'ពេលរសៀល'}
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-700 mt-0.5 block">
                  ${studentBusEnrollment?.monthlyFeeUSD || 25}.00 / ខែ (≈ {((studentBusEnrollment?.monthlyFeeUSD || 25) * settings.exchangeRate).toLocaleString()} ៛)
                </span>
              </div>
            </div>
          </div>

          {/* Bus Payment Receipts Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-0">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-sky-600" />
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 font-khmer">
                  តារាងប្រវត្តិបង់ថ្លៃរថយន្តសាលា (School Bus Payment Records)
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                សរុបបានបង់៖ ${totalBusPaidUSD.toFixed(2)} ({totalBusPaidKHR.toLocaleString()} ៛)
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-sky-700 text-white font-bold border-b border-sky-800 font-khmer">
                    <th className="py-2.5 px-3 border-r border-sky-600 text-center w-10">ល.រ</th>
                    <th className="py-2.5 px-3 border-r border-sky-600 whitespace-nowrap">កាលបរិច្ឆេទ</th>
                    <th className="py-2.5 px-3 border-r border-sky-600 whitespace-nowrap">លេខវិក្កយបត្រ</th>
                    <th className="py-2.5 px-3 border-r border-sky-600 whitespace-nowrap">ខែសិក្សា</th>
                    <th className="py-2.5 px-3 border-r border-sky-600">ខ្សែរថយន្ត & ទីតាំង</th>
                    <th className="py-2.5 px-3 border-r border-sky-600 text-right whitespace-nowrap">ទឹកប្រាក់ ($)</th>
                    <th className="py-2.5 px-3 border-r border-sky-600 text-right whitespace-nowrap">ប្រាក់រៀល (៛)</th>
                    <th className="py-2.5 px-3 border-r border-sky-600 text-center whitespace-nowrap">វិធីទូទាត់</th>
                    <th className="py-2.5 px-3 border-r border-sky-600 whitespace-nowrap">អ្នកកត់ត្រា</th>
                    <th className="py-2.5 px-3 border-r border-sky-600">កំណត់ចំណាំ</th>
                    <th className="py-2.5 px-3 text-center no-print whitespace-nowrap">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {studentBusPayments.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-slate-400 font-khmer">
                        <Bus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <div>មិនទាន់មានប្រវត្តិវិក្កយបត្របង់ថ្លៃរថយន្តសម្រាប់សិស្សនេះនៅឡើយទេ</div>
                      </td>
                    </tr>
                  ) : (
                    studentBusPayments.map((busPay, idx) => (
                      <tr key={busPay.id || idx} className="hover:bg-sky-50/40 transition-colors">
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-500 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-slate-800 whitespace-nowrap">
                          {busPay.paymentDate}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {busPay.invoiceNo || busPay.receiptNo}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-khmer font-bold text-sky-900 whitespace-nowrap">
                          {busPay.month}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-khmer">
                          <div className="font-semibold text-slate-900">{busPay.routeName}</div>
                          <div className="text-[10px] text-slate-500">{studentBusEnrollment?.pickupLocation || 'ចំណតឡានសាលា'}</div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                          ${busPay.amountUSD.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono text-slate-700 whitespace-nowrap">
                          {busPay.amountKHR.toLocaleString()} ៛
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center whitespace-nowrap">
                          {getMethodBadge(busPay.paidBy)}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-khmer text-slate-700 whitespace-nowrap">
                          {busPay.recordedBy}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-khmer text-slate-600 text-[11px]">
                          {busPay.notes || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center no-print whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedInvoice({
                                receiptNo: busPay.receiptNo,
                                invoiceNo: busPay.invoiceNo || busPay.receiptNo,
                                month: busPay.month,
                                months: busPay.months || [busPay.month],
                                monthsCount: busPay.monthsCount || 1,
                                feePerMonthUSD: busPay.feePerMonthUSD,
                                discountUSD: busPay.discountUSD || 0,
                                date: busPay.paymentDate,
                                amountUSD: busPay.amountUSD,
                                amountKHR: busPay.amountKHR,
                                paidBy: busPay.paidBy,
                                recordedBy: busPay.recordedBy,
                                status: 'paid',
                                itemType: 'bus',
                                description: `ថ្លៃរថយន្តសាលា ${busPay.routeName} (${busPay.month})`,
                                note: busPay.notes || 'សេវារថយន្តសាលាប្រចាំខែ',
                              });
                            }}
                            className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-md font-bold text-[10px] font-khmer flex items-center gap-1 transition-all"
                            title="មើល & បោះពុម្ពវិក្កយបត្រ"
                          >
                            <Receipt className="w-3 h-3 text-sky-600" />
                            <span>វិក្កយបត្រ</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-sky-100 font-bold text-sky-950 border-t-2 border-sky-300 font-khmer">
                    <td colSpan={5} className="py-2.5 px-4 text-right border-r border-sky-200 uppercase tracking-wide">
                      សរុបថ្លៃរថយន្តសាលា (Grand Total):
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-sky-950 border-r border-sky-200 text-sm whitespace-nowrap">
                      ${totalBusPaidUSD.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-sky-950 border-r border-sky-200 whitespace-nowrap">
                      {totalBusPaidKHR.toLocaleString()} ៛
                    </td>
                    <td colSpan={3} className="py-2.5 px-4 text-left font-mono text-[11px] text-sky-800">
                      សរុប {studentBusPayments.length} វិក្កយបត្រ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OFFICIAL PRINTABLE INVOICE / RECEIPT MODAL PREVIEW */}
      {/* ========================================================================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 text-xs my-auto animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal Top Bar */}
            <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                <span className="font-bold font-khmer">
                  វិក្កយបត្រ & បង្កាន់ដៃផ្លូវការ (Official Receipt Voucher)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>បោះពុម្ព (Print)</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-900 bg-white" id="official-student-invoice-sheet">
              {/* Cambodian Kingdom National Header & Official Verification QR Code */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="text-center sm:text-left space-y-1 flex-1">
                  <div className="font-bold text-xs font-khmer text-slate-800">ព្រះរាជាណាចក្រកម្ពុជា</div>
                  <div className="text-[11px] font-semibold font-khmer text-slate-700">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
                  <div className="text-sm font-extrabold font-khmer text-slate-900 pt-1">
                    {settings.schoolNameKhmer}
                  </div>
                  <div className="text-xs font-serif font-bold text-slate-600">
                    {settings.schoolNameEnglish}
                  </div>
                  <div className="text-base font-extrabold font-khmer text-amber-900 pt-1 tracking-wide uppercase">
                    វិក្កយបត្រ & បង្កាន់ដៃទទួលប្រាក់
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    OFFICIAL TUITION, MATERIALS & BUS SERVICES RECEIPT VOUCHER
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center">
                  <InvoiceQRCode
                    invoiceNo={selectedInvoice.invoiceNo || selectedInvoice.receiptNo}
                    studentCode={student.studentCode}
                    studentName={student.name}
                    amountUSD={selectedInvoice.amountUSD}
                    amountKHR={selectedInvoice.amountKHR}
                    paymentDate={selectedInvoice.date}
                    paidBy={selectedInvoice.paidBy}
                    status={selectedInvoice.status}
                    className={className}
                    academicYear={settings.academicYear}
                    size={95}
                    showDetails={true}
                    onVerifyClick={() =>
                      openInvoiceVerification(
                        selectedInvoice.invoiceNo || selectedInvoice.receiptNo,
                        student.studentCode
                      )
                    }
                  />
                </div>
              </div>

              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-khmer">
                <div>
                  <span className="text-slate-500 block text-[10px]">លេខវិក្កយបត្រ / Invoice No:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {selectedInvoice.invoiceNo || selectedInvoice.receiptNo}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">កាលបរិច្ឆេទ / Date:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedInvoice.date}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ឆ្នាំសិក្សា / Academic Year:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {settings.academicYear}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ឈ្មោះសិស្ស / Student:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {student.name}
                  </span>
                  {student.latinName && (
                    <span className="block text-[10px] text-slate-500 font-sans">
                      {student.latinName}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">អត្តលេខសិស្ស / Student ID:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {student.studentCode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ថ្នាក់រៀន / Class:</span>
                  <span className="font-bold text-slate-900">
                    {className || '1A'}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 font-khmer font-bold text-slate-800">
                    <tr>
                      <th className="py-2 px-3 text-center w-10 border-r border-slate-300">ល.រ</th>
                      <th className="py-2 px-3 text-left border-r border-slate-300">
                        បរិយាយមុខទំនិញ / សេវាកម្ម (Item Description)
                      </th>
                      <th className="py-2 px-3 text-center border-r border-slate-300 w-24">បរិមាណ</th>
                      <th className="py-2 px-3 text-right border-r border-slate-300 w-28">តម្លៃឯកតា ($)</th>
                      <th className="py-2 px-3 text-right w-28">សរុប ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedInvoice.months && selectedInvoice.months.length > 0 ? (
                      selectedInvoice.months.map((m, idx) => {
                        const feeRate =
                          selectedInvoice.feePerMonthUSD ||
                          selectedInvoice.amountUSD / selectedInvoice.months!.length;
                        return (
                          <tr key={m}>
                            <td className="py-2 px-3 text-center font-mono text-slate-500 border-r border-slate-200">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 border-r border-slate-200 font-khmer font-semibold text-slate-900">
                              {selectedInvoice.itemType === 'bus' ? `សេវាឡានក្រុង ${m}` : `ថ្លៃសិក្សា ${m}`}
                            </td>
                            <td className="py-2 px-3 text-center border-r border-slate-200 font-mono font-medium">
                              1 ខែ
                            </td>
                            <td className="py-2 px-3 text-right font-mono border-r border-slate-200">
                              ${feeRate.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              ${feeRate.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="py-2 px-3 text-center font-mono text-slate-500 border-r border-slate-200">
                          1
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 font-khmer font-semibold text-slate-900">
                          {selectedInvoice.description || `ថ្លៃសេវា ${selectedInvoice.month}`}
                        </td>
                        <td className="py-2 px-3 text-center border-r border-slate-200 font-mono font-medium">
                          {selectedInvoice.monthsCount || 1}
                        </td>
                        <td className="py-2 px-3 text-right font-mono border-r border-slate-200">
                          ${selectedInvoice.amountUSD.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          ${selectedInvoice.amountUSD.toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="border-t border-slate-300 bg-slate-50 text-xs font-mono">
                    {(selectedInvoice.discountUSD ?? 0) > 0 ? (
                      <tr>
                        <td colSpan={4} className="py-1.5 px-3 text-right font-khmer font-semibold text-rose-700 border-r border-slate-300">
                          បញ្ចុះតម្លៃពិសេស (Discount):
                        </td>
                        <td className="py-1.5 px-3 text-right font-bold text-rose-700">
                          -${(selectedInvoice.discountUSD || 0).toFixed(2)}
                        </td>
                      </tr>
                    ) : null}
                    <tr className="font-bold border-t border-slate-300 bg-amber-50">
                      <td colSpan={4} className="py-2.5 px-3 text-right font-khmer text-slate-900 border-r border-slate-300">
                        ទឹកប្រាក់ទូទាត់សរុប (Total Amount Due & Paid):
                      </td>
                      <td className="py-2.5 px-3 text-right text-base text-slate-950 font-black">
                        ${selectedInvoice.amountUSD.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="text-[11px] text-slate-600">
                      <td colSpan={4} className="py-1 px-3 text-right font-khmer border-r border-slate-300">
                        សមមូលជាប្រាក់រៀល (KHR Equivalent at {settings.exchangeRate.toLocaleString()} ៛):
                      </td>
                      <td className="py-1 px-3 text-right font-bold text-slate-800">
                        {(selectedInvoice.amountKHR || Math.round(selectedInvoice.amountUSD * settings.exchangeRate)).toLocaleString()} ៛
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Details Pill & Note */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs font-khmer">
                <div>
                  <span className="text-slate-500">វិធីសាស្ត្រទូទាត់:</span>
                  <span className="font-mono font-bold text-blue-900 ml-2">
                    {selectedInvoice.paidBy} ({selectedInvoice.status.toUpperCase()})
                  </span>
                  {selectedInvoice.note && (
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      កំណត់ចំណាំ៖ {selectedInvoice.note}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-slate-500">បេឡាធិការទទួលប្រាក់:</span>
                  <span className="font-bold text-slate-900 ml-2">
                    {selectedInvoice.recordedBy || settings.accountantName}
                  </span>
                </div>
              </div>

              {/* Dual Signatures */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 text-xs text-center font-khmer">
                <div className="space-y-10">
                  <div className="font-bold text-slate-700">ហត្ថលេខាអ្នកប្រគល់ប្រាក់ (Payer)</div>
                  <div className="text-slate-400">........................................</div>
                  <div className="text-[11px] text-slate-500">{student.guardianName || student.name}</div>
                </div>
                <div className="space-y-10">
                  <div className="font-bold text-slate-700">ហត្ថលេខាបេឡាធិការ / គណនេយ្យករ</div>
                  <div className="text-slate-400">........................................</div>
                  <div className="text-[11px] font-bold text-slate-900">
                    {selectedInvoice.recordedBy || settings.accountantName}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing/Deleting Payment History */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 font-khmer">
                  {confirmModal.mode === 'single'
                    ? 'បញ្ជាក់ការលុបវិក្កយបត្រ'
                    : confirmModal.mode === 'selected'
                    ? 'បញ្ជាក់ការលុបវិក្កយបត្រដែលបានជ្រើស'
                    : 'បញ្ជាក់ការសម្អាតប្រវត្តិបង់ប្រាក់ទាំងអស់'}
                </h3>
                <p className="text-xs text-slate-500 font-khmer">
                  សិស្ស៖ <span className="font-bold text-slate-800">{student.name}</span> ({student.studentCode})
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 font-khmer space-y-2 mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {confirmModal.mode === 'single' && confirmModal.targetReceipt && (
                <div>
                  តើលោកអ្នកពិតជាចង់លុបវិក្កយបត្រលេខ{' '}
                  <strong className="font-mono text-slate-900">
                    {confirmModal.targetReceipt.invoiceNo || confirmModal.targetReceipt.receiptNo}
                  </strong>{' '}
                  (ទឹកប្រាក់ <strong>${confirmModal.targetReceipt.amountUSD.toFixed(2)}</strong>) នេះមែនទេ?
                </div>
              )}
              {confirmModal.mode === 'selected' && (
                <div>
                  តើលោកអ្នកពិតជាចង់លុបវិក្កយបត្រដែលបានជ្រើសចំនួន{' '}
                  <strong className="text-rose-700 font-bold">{selectedReceiptKeys.length} ច្បាប់</strong> នេះមែនទេ?
                </div>
              )}
              {confirmModal.mode === 'all' && (
                <div>
                  តើលោកអ្នកពិតជាចង់សម្អាតប្រវត្តិបង់ប្រាក់ទាំងអស់របស់សិស្សនេះមែនទេ?
                  <div className="mt-1 text-slate-500">
                    ប្រវត្តិបង់ប្រាក់ទាំងអស់នឹងត្រូវបានសម្អាត ហើយស្ថានភាពបង់ខែបច្ចុប្បន្ននឹងត្រូវបានកំណត់ឡើងវិញជា Unpaid ($0)។ ឯកសារចុះឈ្មោះរបស់សិស្សនៅតែរក្សាទុកដដែល។
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold font-khmer text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {t('បោះបង់', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.mode === 'single' && confirmModal.targetReceipt) {
                    const key = confirmModal.targetReceipt.receiptNo || confirmModal.targetReceipt.invoiceNo || '';
                    deleteStudentPaymentRecord(targetClassId, student.id, key);
                    setSelectedReceiptKeys((prev) => prev.filter((k) => k !== key));
                  } else if (confirmModal.mode === 'selected') {
                    selectedReceiptKeys.forEach((key) => {
                      deleteStudentPaymentRecord(targetClassId, student.id, key);
                    });
                    setSelectedReceiptKeys([]);
                  } else if (confirmModal.mode === 'all') {
                    clearStudentsPaymentHistory(targetClassId, [student.id], true);
                    setSelectedReceiptKeys([]);
                  }
                  setConfirmModal(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold font-khmer transition-colors shadow-xs"
              >
                {t('យល់ព្រមលុប', 'Confirm Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
