import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BusRoute, BusStudentEnrollment, BusPaymentRecord } from '../types';
import { SearchableSelect, SearchOption } from './SearchableSelect';
import {
  Bus,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Plus,
  Search,
  DollarSign,
  Phone,
  CreditCard,
  X,
  FileSpreadsheet,
  AlertCircle,
  MapPin,
  Trash2,
  Edit2,
  Check,
  Receipt,
  Layers,
  Send,
  Eye,
  Building2,
  Filter,
} from 'lucide-react';

interface SchoolBusViewProps {
  onPrintReport?: () => void;
}

// 12 Months in the Cambodian School Academic Year
const ACADEMIC_MONTHS = [
  'October 2026',
  'November 2026',
  'December 2026',
  'January 2027',
  'February 2027',
  'March 2027',
  'April 2027',
  'May 2027',
  'June 2027',
  'July 2027',
  'August 2027',
  'September 2027',
];

const getKhmerMonthName = (mStr: string) => {
  const parts = mStr.split(' ');
  const m = parts[0];
  const yr = parts[1] || '';
  const khmerMap: { [key: string]: string } = {
    January: 'មករា',
    February: 'កុម្ភៈ',
    March: 'មីនា',
    April: 'មេសា',
    May: 'ឧសភា',
    June: 'មិថុនា',
    July: 'កក្កដា',
    August: 'សីហា',
    September: 'កញ្ញា',
    October: 'តុលា',
    November: 'វិច្ឆិកា',
    December: 'ធ្នូ',
  };
  return `${khmerMap[m] || m} ${yr}`;
};

export const SchoolBusView: React.FC<SchoolBusViewProps> = ({ onPrintReport }) => {
  const {
    busRoutes,
    addBusRoute,
    updateBusRoute,
    deleteBusRoute,
    busEnrollments,
    enrollStudentInBus,
    updateBusEnrollment,
    removeBusEnrollment,
    recordBusPayment,
    busPayments,
    busAttendance,
    recordBusAttendance,
    classData,
    settings,
    currentUser,
    permissions,
    currentBranch,
    currentBranchId,
    globalMonth,
    globalYear,
    t,
  } = useApp();

  // Active Tab: riders | routes | attendance | payments | report
  const [activeTab, setActiveTab] = useState<'riders' | 'routes' | 'attendance' | 'payments' | 'report'>('riders');

  // Filters for Riders
  const [searchRider, setSearchRider] = useState('');
  const [filterRoute, setFilterRoute] = useState<string>('all');
  const [filterFeeStatus, setFilterFeeStatus] = useState<string>('all');

  // Filters for Payments Ledger
  const [searchPayment, setSearchPayment] = useState('');
  const [paymentFilterRoute, setPaymentFilterRoute] = useState<string>('all');
  const [paymentFilterMethod, setPaymentFilterMethod] = useState<string>('all');
  const [paymentFilterMonth, setPaymentFilterMonth] = useState<string>('all');

  // Modals
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [riderToDelete, setRiderToDelete] = useState<BusStudentEnrollment | null>(null);

  // Selected records for payment & invoice
  const [selectedEnrollmentForPay, setSelectedEnrollmentForPay] = useState<BusStudentEnrollment | null>(null);
  const [activeInvoiceRecord, setActiveInvoiceRecord] = useState<BusPaymentRecord | null>(null);

  // New Enrollment Form
  const [enrollStudentCode, setEnrollStudentCode] = useState<string>('');
  const [enrollRouteId, setEnrollRouteId] = useState<string>(busRoutes[0]?.id || 'route-1');
  const [enrollPickup, setEnrollPickup] = useState<string>('');
  const [enrollDropoff, setEnrollDropoff] = useState<string>('សាលា អ៊ីរ៉ែលកម្ពុជា');
  const [enrollShift, setEnrollShift] = useState<'morning' | 'afternoon' | 'both'>('both');
  const [enrollFeeUSD, setEnrollFeeUSD] = useState<number>(25);

  // New Route Form
  const [routeNameKhmer, setRouteNameKhmer] = useState<string>('');
  const [routeNameEnglish, setRouteNameEnglish] = useState<string>('');
  const [routeDriverName, setRouteDriverName] = useState<string>('');
  const [routeDriverPhone, setRouteDriverPhone] = useState<string>('');
  const [routeVehiclePlate, setRouteVehiclePlate] = useState<string>('');
  const [routeCapacity, setRouteCapacity] = useState<number>(25);
  const [routeFeeUSD, setRouteFeeUSD] = useState<number>(25);
  const [routeNotes, setRouteNotes] = useState<string>('');

  // Multi-Month Bus Payment Form
  const [payMonths, setPayMonths] = useState<string[]>([`${globalMonth} ${globalYear}`]);
  const [payFeePerMonth, setPayFeePerMonth] = useState<number>(25);
  const [payDiscountUSD, setPayDiscountUSD] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'ABA' | 'AC' | 'Cash'>('ABA');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [payNotes, setPayNotes] = useState<string>('');
  const [sendTelegramNotice, setSendTelegramNotice] = useState<boolean>(true);

  // Attendance Form
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [attendanceRouteId, setAttendanceRouteId] = useState<string>(busRoutes[0]?.id || 'route-1');
  const [attendanceShift, setAttendanceShift] = useState<'morning' | 'evening'>('morning');
  const [attendanceState, setAttendanceState] = useState<{ [enrollmentId: string]: 'present' | 'absent' | 'excused' }>({});

  // Flatten registered students for SearchableSelect filtered by active campus
  const studentOptions: SearchOption[] = useMemo(() => {
    const list: SearchOption[] = [];
    Object.values(classData).forEach((cls) => {
      if (currentBranchId !== 'all' && (cls.branchId || 'branch-central') !== currentBranchId) {
        return;
      }
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
  }, [classData, currentBranchId]);

  // Selected student for enrollment
  const currentSelectedStudent = useMemo(() => {
    if (!enrollStudentCode) return null;
    for (const cls of Object.values(classData)) {
      const found = cls.students.find((s) => s.studentCode === enrollStudentCode);
      if (found) return { ...found, classId: cls.classId, className: cls.className };
    }
    return null;
  }, [classData, enrollStudentCode]);

  // Branch-partitioned enrollments
  const branchEnrollments = useMemo(() => {
    if (currentBranchId === 'all') return busEnrollments;
    return busEnrollments.filter((e) => {
      if (e.branchId) return e.branchId === currentBranchId;
      if (e.classId && classData[e.classId]?.branchId) {
        return classData[e.classId].branchId === currentBranchId;
      }
      return currentBranchId === 'branch-central';
    });
  }, [busEnrollments, currentBranchId, classData]);

  // Branch-partitioned payments
  const branchBusPayments = useMemo(() => {
    if (currentBranchId === 'all') return busPayments;
    return busPayments.filter((p) => {
      if (p.branchId) return p.branchId === currentBranchId;
      if (p.classId && classData[p.classId]?.branchId) {
        return classData[p.classId].branchId === currentBranchId;
      }
      return currentBranchId === 'branch-central';
    });
  }, [busPayments, currentBranchId, classData]);

  // Overall Financial & Rider Metrics
  const totalRiders = branchEnrollments.length;
  const paidRiders = branchEnrollments.filter((e) => e.status === 'paid').length;
  const unpaidRiders = branchEnrollments.filter((e) => e.status === 'unpaid').length;

  // Real collected bus revenue from ledger
  const totalBusRevenueUSD = useMemo(() => {
    if (branchBusPayments && branchBusPayments.length > 0) {
      return branchBusPayments.reduce((sum, p) => sum + p.amountUSD, 0);
    }
    return branchEnrollments
      .filter((e) => e.status === 'paid')
      .reduce((sum, e) => sum + e.monthlyFeeUSD, 0);
  }, [branchBusPayments, branchEnrollments]);

  const totalBusRevenueKHR = totalBusRevenueUSD * settings.exchangeRate;

  // Filtered riders
  const filteredEnrollments = branchEnrollments.filter((e) => {
    const matchesSearch =
      e.studentName.toLowerCase().includes(searchRider.toLowerCase()) ||
      (e.latinName && e.latinName.toLowerCase().includes(searchRider.toLowerCase())) ||
      e.studentCode.toLowerCase().includes(searchRider.toLowerCase()) ||
      e.pickupLocation.toLowerCase().includes(searchRider.toLowerCase());
    const matchesRoute = filterRoute === 'all' || e.routeId === filterRoute;
    const matchesStatus = filterFeeStatus === 'all' || e.status === filterFeeStatus;
    return matchesSearch && matchesRoute && matchesStatus;
  });

  // Filtered bus payments ledger
  const filteredBusPayments = useMemo(() => {
    return branchBusPayments.filter((p) => {
      const matchesSearch =
        p.studentName.toLowerCase().includes(searchPayment.toLowerCase()) ||
        (p.latinName && p.latinName.toLowerCase().includes(searchPayment.toLowerCase())) ||
        p.studentCode.toLowerCase().includes(searchPayment.toLowerCase()) ||
        (p.invoiceNo && p.invoiceNo.toLowerCase().includes(searchPayment.toLowerCase())) ||
        (p.receiptNo && p.receiptNo.toLowerCase().includes(searchPayment.toLowerCase()));
      const matchesRoute = paymentFilterRoute === 'all' || p.routeId === paymentFilterRoute;
      const matchesMethod = paymentFilterMethod === 'all' || p.paidBy === paymentFilterMethod;
      const matchesMonth =
        paymentFilterMonth === 'all' ||
        p.month === paymentFilterMonth ||
        (p.months && p.months.includes(paymentFilterMonth));
      return matchesSearch && matchesRoute && matchesMethod && matchesMonth;
    });
  }, [branchBusPayments, searchPayment, paymentFilterRoute, paymentFilterMethod, paymentFilterMonth]);

  // Open Payment Modal for a rider
  const handleOpenPayModal = (enr: BusStudentEnrollment) => {
    setSelectedEnrollmentForPay(enr);
    const matchedRoute = busRoutes.find((r) => r.id === enr.routeId);
    const defaultRate = enr.monthlyFeeUSD || matchedRoute?.monthlyFeeUSD || 25;
    setPayFeePerMonth(defaultRate);
    setPayDiscountUSD(0);
    setPayMethod('ABA');
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayNotes('');

    // Pre-select next unpaid month or current month
    const defaultMonth = `${globalMonth} ${globalYear}`;
    const alreadyPaid = enr.paidMonths || [];
    if (!alreadyPaid.includes(defaultMonth)) {
      setPayMonths([defaultMonth]);
    } else {
      // Find the first academic month not yet paid
      const nextUnpaid = ACADEMIC_MONTHS.find((m) => !alreadyPaid.includes(m));
      setPayMonths(nextUnpaid ? [nextUnpaid] : [defaultMonth]);
    }
    setIsPayModalOpen(true);
  };

  // Toggle month selection in payment modal
  const handleTogglePayMonth = (mStr: string) => {
    setPayMonths((prev) => {
      if (prev.includes(mStr)) {
        if (prev.length <= 1) return prev; // Keep at least one month
        return prev.filter((m) => m !== mStr);
      } else {
        return [...prev, mStr];
      }
    });
  };

  // Quick Preset for months (1M, 2M, 3M, 6M, 10M)
  const handleSetQuickPresetMonths = (count: number) => {
    if (!selectedEnrollmentForPay) return;
    const paidList = selectedEnrollmentForPay.paidMonths || [];
    // Prefer picking consecutive unpaid months starting from next available
    const unpaidMonths = ACADEMIC_MONTHS.filter((m) => !paidList.includes(m));
    if (unpaidMonths.length >= count) {
      setPayMonths(unpaidMonths.slice(0, count));
    } else {
      // Fallback: take first `count` academic months
      setPayMonths(ACADEMIC_MONTHS.slice(0, count));
    }
  };

  // Computed Payment totals
  const computedGrossUSD = payMonths.length * payFeePerMonth;
  const computedNetUSD = Math.max(0, computedGrossUSD - payDiscountUSD);
  const computedNetKHR = Math.round(computedNetUSD * settings.exchangeRate);

  // Submit Bus Payment
  const handleSubmitBusPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollmentForPay || payMonths.length === 0) return;

    const newRecord = recordBusPayment(selectedEnrollmentForPay.id, {
      paidBy: payMethod,
      amountUSD: computedNetUSD,
      paymentDate: payDate,
      months: payMonths,
      feePerMonthUSD: payFeePerMonth,
      discountUSD: payDiscountUSD,
      notes: payNotes.trim() || undefined,
    });

    setIsPayModalOpen(false);
    setSelectedEnrollmentForPay(null);

    // Open Official Cambodian Invoice Modal immediately
    if (newRecord) {
      setActiveInvoiceRecord(newRecord);
      setIsInvoiceModalOpen(true);
    }
  };

  // Handle Create Enrollment
  const handleCreateEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedStudent) {
      return;
    }

    enrollStudentInBus({
      studentId: currentSelectedStudent.id,
      studentCode: currentSelectedStudent.studentCode,
      studentName: currentSelectedStudent.name,
      latinName: currentSelectedStudent.latinName,
      classId: currentSelectedStudent.classId,
      className: currentSelectedStudent.className,
      routeId: enrollRouteId,
      pickupLocation: enrollPickup.trim() || 'សាលារៀន',
      dropoffLocation: enrollDropoff.trim() || 'សាលារៀន',
      shift: enrollShift,
      monthlyFeeUSD: Number(enrollFeeUSD) || 25,
      status: 'unpaid',
      paidBy: '$ -',
    });

    setIsEnrollModalOpen(false);
    setEnrollStudentCode('');
    setEnrollPickup('');
  };

  // Handle Create Route
  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeNameKhmer.trim() || !routeDriverName.trim()) return;

    addBusRoute({
      name: routeNameKhmer.trim(),
      nameEnglish: routeNameEnglish.trim() || undefined,
      driverName: routeDriverName.trim(),
      driverPhone: routeDriverPhone.trim(),
      vehiclePlate: routeVehiclePlate.trim(),
      capacity: Number(routeCapacity) || 25,
      monthlyFeeUSD: Number(routeFeeUSD) || 25,
      notes: routeNotes.trim() || undefined,
    });

    setIsRouteModalOpen(false);
    setRouteNameKhmer('');
    setRouteNameEnglish('');
    setRouteDriverName('');
    setRouteDriverPhone('');
    setRouteVehiclePlate('');
    setRouteNotes('');
  };

  // Riders on selected attendance route
  const ridersOnAttendanceRoute = useMemo(() => {
    return busEnrollments.filter((e) => e.routeId === attendanceRouteId);
  }, [busEnrollments, attendanceRouteId]);

  // Load existing attendance record for date/route/shift
  const existingAttendance = useMemo(() => {
    return busAttendance.find(
      (a) => a.date === attendanceDate && a.routeId === attendanceRouteId && a.shift === attendanceShift
    );
  }, [busAttendance, attendanceDate, attendanceRouteId, attendanceShift]);

  // Update attendance radio
  const handleSetAttendance = (enrId: string, status: 'present' | 'absent' | 'excused') => {
    setAttendanceState((prev) => ({ ...prev, [enrId]: status }));
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    const updated: { [id: string]: 'present' | 'absent' | 'excused' } = {};
    ridersOnAttendanceRoute.forEach((r) => {
      updated[r.id] = 'present';
    });
    setAttendanceState(updated);
  };

  // Save Attendance Record
  const handleSaveAttendance = () => {
    recordBusAttendance(attendanceDate, attendanceRouteId, attendanceShift, attendanceState);
  };

  return (
    <div className="space-y-5 w-full">
      {/* Top Banner & Metrics */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold border border-amber-300/40 shrink-0">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 font-khmer">
                  {t('សេវារថយន្តសាលា (School Bus Management)', 'School Bus Management')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase font-mono">
                  {busRoutes.length} Routes
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-khmer flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-indigo-500" />
                  <span>{currentBranch.nameKhmer}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-khmer mt-0.5">
                {t(
                  'គ្រប់គ្រងខ្សែរត់ សិស្សជិះរថយន្ត ការបង់ថ្លៃសេវាពហុខែ បង្កាន់ដៃ & វិក្កយបត្រ វត្តមានប្រចាំថ្ងៃ និងរបាយការណ៍ផ្លូវការ',
                  'Manage routes, student riders, multi-month bus fee payments, official receipts, daily attendance, and reports'
                )}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase font-khmer">
                {t('សិស្សជិះសរុប', 'Total Riders')}
              </div>
              <div className="text-lg font-bold font-mono text-slate-900">
                {totalRiders} នាក់
              </div>
            </div>

            <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-right">
              <div className="text-[10px] font-bold text-emerald-700 uppercase font-khmer">
                {t('បានបង់ថ្លៃសេវា', 'Paid')}
              </div>
              <div className="text-lg font-bold font-mono text-emerald-800">
                {paidRiders} / {totalRiders}
              </div>
            </div>

            <div className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-right">
              <div className="text-[10px] font-bold text-indigo-700 uppercase font-khmer">
                {t('ចំណូលសរុប ($ / ៛)', 'Bus Revenue')}
              </div>
              <div className="text-lg font-bold font-mono text-indigo-800">
                ${totalBusRevenueUSD.toFixed(2)} ({totalBusRevenueKHR.toLocaleString()}៛)
              </div>
            </div>

            {permissions.canEdit && (
              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold font-khmer text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('ចុះឈ្មោះសិស្សជិះរថយន្ត', 'Enroll Student')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-t border-slate-100 mt-5 pt-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('riders')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-khmer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'riders'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t('បញ្ជីសិស្ស & ការបង់ប្រាក់', 'Riders & Fees')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('routes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-khmer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'routes'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>{t('គ្រប់គ្រងខ្សែរត់ & អ្នកបើកបរ', 'Routes & Drivers')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-khmer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'attendance'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('កត់ត្រាវត្តមានប្រចាំថ្ងៃ', 'Daily Attendance')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-khmer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('ប្រវត្តិបង់ប្រាក់ & វិក្កយបត្រ', 'Payment Ledger & Invoices')}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 font-mono">
              {busPayments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-khmer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'report'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('របាយការណ៍ផ្លូវការ (Print)', 'Official Report')}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: RIDERS & FEES TABLE */}
      {activeTab === 'riders' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="search"
                placeholder={t('ស្វែងរកឈ្មោះសិស្ស កូដ ឬទីតាំង...', 'Search rider, code, pickup...')}
                value={searchRider}
                onChange={(e) => setSearchRider(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-khmer bg-slate-50"
              />
            </div>

            <div>
              <select
                value={filterRoute}
                onChange={(e) => setFilterRoute(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-khmer bg-slate-50"
              >
                <option value="all">គ្រប់ខ្សែរត់ទាំងអស់ (All Routes)</option>
                {busRoutes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterFeeStatus}
                onChange={(e) => setFilterFeeStatus(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-khmer bg-slate-50"
              >
                <option value="all">ស្ថានភាពបង់ប្រាក់ទាំងអស់ (All Status)</option>
                <option value="paid">បានបង់ (Paid)</option>
                <option value="unpaid">មិនទាន់បង់ (Unpaid)</option>
                <option value="waived">លើកលែង (Waived)</option>
              </select>
            </div>
          </div>

          {/* Riders Table */}
          <div className="overflow-x-auto w-full border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-amber-400 text-slate-900 font-bold border-b border-amber-500 font-khmer">
                  <th className="py-2.5 px-3 border-r border-amber-500 text-center w-12">ល.រ</th>
                  <th className="py-2.5 px-3 border-r border-amber-500 font-mono">កូដសិស្ស</th>
                  <th className="py-2.5 px-4 border-r border-amber-500">ឈ្មោះសិស្ស (Name)</th>
                  <th className="py-2.5 px-3 border-r border-amber-500 text-center">ថ្នាក់</th>
                  <th className="py-2.5 px-4 border-r border-amber-500">ខ្សែរត់រថយន្ត</th>
                  <th className="py-2.5 px-4 border-r border-amber-500">ទីតាំងឡើង / ចុះ</th>
                  <th className="py-2.5 px-3 border-r border-amber-500 text-center">វេន</th>
                  <th className="py-2.5 px-3 border-r border-amber-500 text-right font-mono">តម្លៃ/ខែ</th>
                  <th className="py-2.5 px-3 border-r border-amber-500 text-center">ខែដែលបានបង់</th>
                  <th className="py-2.5 px-3 border-r border-amber-500 text-center">ស្ថានភាពបង់</th>
                  <th className="py-2.5 px-3 text-center">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-khmer text-xs">
                {filteredEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      មិនមានទិន្នន័យសិស្សជិះរថយន្តឡើយ (No riders found)
                    </td>
                  </tr>
                ) : (
                  filteredEnrollments.map((enr, idx) => {
                    const matchedRoute = busRoutes.find((r) => r.id === enr.routeId);
                    const paidMonthsCount = enr.paidMonths?.length || (enr.status === 'paid' ? 1 : 0);
                    const riderLastPayment = busPayments.find((p) => p.enrollmentId === enr.id);

                    return (
                      <tr key={enr.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-2.5 px-3 border-r border-slate-100 text-center text-slate-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-100 font-mono font-bold text-slate-900">
                          {enr.studentCode}
                        </td>
                        <td className="py-2.5 px-4 border-r border-slate-100 font-bold text-slate-900">
                          <div>{enr.studentName}</div>
                          {enr.latinName && (
                            <div className="text-[10px] text-slate-400 font-mono font-normal">
                              {enr.latinName}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono font-bold text-slate-700">
                          {enr.className}
                        </td>
                        <td className="py-2.5 px-4 border-r border-slate-100 font-semibold text-slate-800">
                          {matchedRoute?.name || enr.routeId}
                        </td>
                        <td className="py-2.5 px-4 border-r border-slate-100 text-slate-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{enr.pickupLocation}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {enr.shift === 'both'
                              ? 'ព្រឹក-ល្ងាច'
                              : enr.shift === 'morning'
                              ? 'ព្រឹក'
                              : 'រសៀល'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-100 text-right font-mono font-bold text-slate-900">
                          ${enr.monthlyFeeUSD}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                          {enr.paidMonths && enr.paidMonths.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-center gap-1 max-w-[160px] mx-auto">
                              {enr.paidMonths.slice(-2).map((m) => (
                                <span
                                  key={m}
                                  className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold whitespace-nowrap"
                                >
                                  ✓ {getKhmerMonthName(m)}
                                </span>
                              ))}
                              {enr.paidMonths.length > 2 && (
                                <span className="text-[9px] font-mono text-slate-500 font-bold">
                                  +{enr.paidMonths.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-mono">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                          {enr.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>បានបង់ ({paidMonthsCount} ខែ)</span>
                            </span>
                          ) : enr.status === 'waived' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                              លើកលែង
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>មិនទាន់បង់</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {permissions.canCollectFee && (
                              <button
                                type="button"
                                onClick={() => handleOpenPayModal(enr)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                title="បង់ថ្លៃសេវារថយន្តសាលា (ពហុខែ)"
                              >
                                <DollarSign className="w-3 h-3" />
                                <span>{enr.status === 'paid' ? 'បង់បន្ត' : 'បង់ប្រាក់'}</span>
                              </button>
                            )}

                            {riderLastPayment && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveInvoiceRecord(riderLastPayment);
                                  setIsInvoiceModalOpen(true);
                                }}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="មើលវិក្កយបត្រផ្លូវការចុងក្រោយ"
                              >
                                <Receipt className="w-3 h-3 text-amber-600" />
                                <span>វិក្កយបត្រ</span>
                              </button>
                            )}

                            {permissions.canDelete && (
                              <button
                                type="button"
                                onClick={() => setRiderToDelete(enr)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="លុបសិស្សចេញពីរថយន្ត"
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
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROUTES & DRIVERS */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 font-khmer text-base">
              {t('បញ្ជីខ្សែរត់រថយន្តសាលាទាំងអស់ (Bus Routes)', 'All Bus Routes')}
            </h3>
            {permissions.canEdit && (
              <button
                type="button"
                onClick={() => setIsRouteModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-khmer shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ បន្ថែមខ្សែរត់ថ្មី</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {busRoutes.map((route) => {
              const ridersInRoute = busEnrollments.filter((e) => e.routeId === route.id);
              const utilization = Math.round((ridersInRoute.length / (route.capacity || 1)) * 100);

              return (
                <div
                  key={route.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 hover:border-amber-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold border border-amber-200">
                          <Bus className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 font-khmer">
                            {route.name}
                          </h4>
                          {route.nameEnglish && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              {route.nameEnglish}
                            </span>
                          )}
                        </div>
                      </div>

                      {permissions.canDelete && (
                        <button
                          type="button"
                          onClick={() => deleteBusRoute(route.id)}
                          className="p-1 text-slate-300 hover:text-rose-500 rounded cursor-pointer"
                          title="Delete route"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-khmer">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">អ្នកបើកបរ៖</span>
                        <span className="font-bold text-slate-900">{route.driverName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">ទូរស័ព្ទ៖</span>
                        <span className="font-mono font-bold text-indigo-700 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{route.driverPhone}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">ស្លាកលេខ៖</span>
                        <span className="font-mono font-bold text-slate-900">{route.vehiclePlate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">ថ្លៃសេវា៖</span>
                        <span className="font-mono font-bold text-emerald-700">
                          ${route.monthlyFeeUSD}/ខែ ({(route.monthlyFeeUSD * settings.exchangeRate).toLocaleString()}៛)
                        </span>
                      </div>
                    </div>

                    {/* Capacity progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-khmer">
                        <span className="text-slate-500">ចំណុះសិស្ស៖</span>
                        <span className="font-mono font-bold text-slate-900">
                          {ridersInRoute.length} / {route.capacity} នាក់ ({utilization}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            utilization >= 100
                              ? 'bg-rose-500'
                              : utilization >= 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, utilization)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {route.notes && (
                    <div className="text-[11px] text-slate-400 font-khmer italic pt-2 border-t border-slate-100">
                      {route.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DAILY ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 font-khmer text-base">
                {t('កត់ត្រាវត្តមានសិស្សជិះរថយន្តប្រចាំថ្ងៃ', 'Daily Bus Attendance Check')}
              </h3>
              <p className="text-xs text-slate-500 font-khmer mt-0.5">
                ជ្រើសរើសថ្ងៃ ខ្សែរត់ និងវេន ដើម្បីកត់ត្រាវត្តមានសិស្ស
              </p>
            </div>

            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold font-khmer flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('សម្គាល់វត្តមានទាំងអស់ (Mark All Present)', 'Mark All Present')}</span>
            </button>
          </div>

          {/* Attendance Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 font-khmer mb-1">
                កាលបរិច្ឆេទ (Date) *
              </label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 font-khmer mb-1">
                ខ្សែរត់រថយន្ត (Route) *
              </label>
              <select
                value={attendanceRouteId}
                onChange={(e) => setAttendanceRouteId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
              >
                {busRoutes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 font-khmer mb-1">
                វេនដឹក (Shift) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAttendanceShift('morning')}
                  className={`py-2 rounded-xl text-xs font-bold font-khmer border transition-all cursor-pointer ${
                    attendanceShift === 'morning'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  ពេលព្រឹក (Morning)
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceShift('evening')}
                  className={`py-2 rounded-xl text-xs font-bold font-khmer border transition-all cursor-pointer ${
                    attendanceShift === 'evening'
                      ? 'bg-indigo-600 text-white border-indigo-700 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  ពេលល្ងាច (Evening)
                </button>
              </div>
            </div>
          </div>

          {/* Riders List for Attendance */}
          <div className="space-y-2 pt-2">
            {ridersOnAttendanceRoute.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-khmer text-xs">
                មិនមានសិស្សក្នុងខ្សែរត់នេះទេ (No riders on this route)
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {ridersOnAttendanceRoute.map((rider, idx) => {
                  const currentStatus =
                    attendanceState[rider.id] ||
                    existingAttendance?.records[rider.id] ||
                    'present';

                  return (
                    <div
                      key={rider.id}
                      className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center text-xs text-slate-400 font-mono">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-xs text-slate-900 font-khmer">
                            {rider.studentName} ({rider.className})
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {rider.studentCode} · ឡើងនៅ {rider.pickupLocation}
                          </div>
                        </div>
                      </div>

                      {/* Attendance Radio Buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleSetAttendance(rider.id, 'present')}
                          className={`px-3 py-1 rounded-lg text-xs font-khmer font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>វត្តមាន (Present)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetAttendance(rider.id, 'absent')}
                          className={`px-3 py-1 rounded-lg text-xs font-khmer font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            currentStatus === 'absent'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>អវត្តមាន (Absent)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetAttendance(rider.id, 'excused')}
                          className={`px-3 py-1 rounded-lg text-xs font-khmer font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            currentStatus === 'excused'
                              ? 'bg-amber-500 text-slate-950 shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>ច្បាប់ (Excused)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={ridersOnAttendanceRoute.length === 0}
              onClick={handleSaveAttendance}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold font-khmer text-xs shadow-xs cursor-pointer disabled:opacity-50"
            >
              រក្សាទុកវត្តមាន (Save Attendance)
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: BUS PAYMENTS LEDGER & INVOICES */}
      {activeTab === 'payments' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 font-khmer text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                <span>{t('សៀវភៅបញ្ជីការបង់ថ្លៃរថយន្តសាលា (School Bus Payment Ledger)', 'School Bus Payment Ledger')}</span>
              </h3>
              <p className="text-xs text-slate-500 font-khmer mt-0.5">
                ប្រវត្តិប្រតិបត្តិការទូទាត់ប្រាក់ វិក្កយបត្រពហុខែ និងបង្កាន់ដៃផ្លូវការសម្រាប់សាខា {currentBranch.nameKhmer}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold font-khmer text-amber-800">
                ប្រតិបត្តិការសរុប: {busPayments.length} លើក
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="search"
                placeholder={t('ស្វែងរកសិស្ស, កូដ, លេខវិក្កយបត្រ...', 'Search student, code, invoice...')}
                value={searchPayment}
                onChange={(e) => setSearchPayment(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-khmer bg-slate-50"
              />
            </div>

            <div>
              <select
                value={paymentFilterRoute}
                onChange={(e) => setPaymentFilterRoute(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-khmer bg-slate-50"
              >
                <option value="all">គ្រប់ខ្សែរត់ទាំងអស់ (All Routes)</option>
                {busRoutes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={paymentFilterMethod}
                onChange={(e) => setPaymentFilterMethod(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono bg-slate-50"
              >
                <option value="all">វិធីទូទាត់ទាំងអស់ (All Methods)</option>
                <option value="ABA">ABA KHQR</option>
                <option value="AC">ACLEDA (AC)</option>
                <option value="Cash">Cash (សាច់ប្រាក់)</option>
              </select>
            </div>

            <div>
              <select
                value={paymentFilterMonth}
                onChange={(e) => setPaymentFilterMonth(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-khmer bg-slate-50"
              >
                <option value="all">គ្រប់ខែទាំងអស់ (All Months)</option>
                {ACADEMIC_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {getKhmerMonthName(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto w-full border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-900 text-white font-bold font-khmer">
                  <th className="py-2.5 px-3 border-r border-slate-800 text-center w-12">ល.រ</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 font-mono">លេខវិក្កយបត្រ</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 font-mono">កាលបរិច្ឆេទ</th>
                  <th className="py-2.5 px-4 border-r border-slate-800">ឈ្មោះសិស្ស</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-center">ថ្នាក់</th>
                  <th className="py-2.5 px-4 border-r border-slate-800">ខ្សែរត់រថយន្ត</th>
                  <th className="py-2.5 px-4 border-r border-slate-800">ខែដែលបានបង់</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-center font-mono">វិធីបង់</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-right font-mono">ទឹកប្រាក់ ($)</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-right font-mono">ទឹកប្រាក់ (៛)</th>
                  <th className="py-2.5 px-3 text-center">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-khmer text-xs">
                {filteredBusPayments.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-slate-400">
                      មិនមានប្រតិបត្តិការបង់ប្រាក់រថយន្តសាលាត្រូវនឹងលក្ខខណ្ឌស្វែងរកឡើយ (No records found)
                    </td>
                  </tr>
                ) : (
                  filteredBusPayments.map((pay, idx) => (
                    <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 border-r border-slate-100 text-center text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-100 font-mono font-bold text-indigo-700">
                        {pay.invoiceNo || pay.receiptNo}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-100 font-mono text-slate-600">
                        {pay.paymentDate}
                      </td>
                      <td className="py-2.5 px-4 border-r border-slate-100 font-bold text-slate-900">
                        <div>{pay.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">
                          {pay.studentCode}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono font-bold text-slate-700">
                        {pay.className}
                      </td>
                      <td className="py-2.5 px-4 border-r border-slate-100 text-slate-800 font-semibold">
                        {pay.routeName}
                      </td>
                      <td className="py-2.5 px-4 border-r border-slate-100">
                        <div className="flex flex-wrap gap-1">
                          {(pay.months || [pay.month]).map((m) => (
                            <span
                              key={m}
                              className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold"
                            >
                              {getKhmerMonthName(m)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-100 text-center font-mono font-bold text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px]">
                          {pay.paidBy}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-100 text-right font-mono font-bold text-emerald-700">
                        ${pay.amountUSD.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-100 text-right font-mono text-slate-600">
                        {pay.amountKHR.toLocaleString()} ៛
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveInvoiceRecord(pay);
                            setIsInvoiceModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-indigo-600" />
                          <span>វិក្កយបត្រ</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredBusPayments.length > 0 ? (
                <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 font-khmer">
                  <tr>
                    <td colSpan={8} className="py-3 px-4 text-right border-r border-slate-300">
                      សរុបទឹកប្រាក់ក្នុងបញ្ជី (Filtered Total):
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-emerald-800 text-sm border-r border-slate-300">
                      ${filteredBusPayments.reduce((s, p) => s + p.amountUSD, 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 border-r border-slate-300">
                      {filteredBusPayments.reduce((s, p) => s + p.amountKHR, 0).toLocaleString()} ៛
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: OFFICIAL PRINTABLE REPORT */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold font-khmer text-xs flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>បោះពុម្ពរបាយការណ៍ផ្លូវការ (Print Report)</span>
            </button>
          </div>

          {/* Official Document Container */}
          <div className="bg-white border border-slate-300 rounded-2xl p-6 sm:p-10 shadow-sm max-w-4xl mx-auto space-y-6 text-slate-900 font-khmer" id="official-bus-report">
            {/* Header: Kingdom of Cambodia */}
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900 font-moul">
                ព្រះរាជាណាចក្រកម្ពុជា
              </h3>
              <h4 className="font-bold text-sm text-slate-900 font-moul">
                ជាតិ សាសនា ព្រះមហាក្សត្រ
              </h4>
              <div className="text-xs font-mono text-slate-500">***</div>
            </div>

            {/* School Header & Campus */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 font-moul">
                  {settings.schoolNameKhmer}
                </h4>
                <div className="text-xs font-bold text-indigo-900">
                  {currentBranch.nameKhmer} ({currentBranch.code})
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  {settings.schoolNameEnglish} - {currentBranch.nameEnglish}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  អាសយដ្ឋាន៖ {currentBranch.address} · ទូរស័ព្ទ៖ {currentBranch.phone}
                </div>
              </div>
              <div className="text-right text-xs">
                <div>ឆ្នាំសិក្សា៖ {settings.academicYear}</div>
                <div>ខែរបាយការណ៍៖ {globalMonth} {globalYear}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  កាលបរិច្ឆេទចេញ៖ {new Date().toLocaleDateString('en-GB')}
                </div>
              </div>
            </div>

            {/* Report Title */}
            <div className="text-center py-2">
              <h2 className="text-lg font-bold font-moul text-slate-950 uppercase">
                របាយការណ៍សេវារថយន្តសាលា & ការប្រមូលថ្លៃប្រចាំខែ
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Official Monthly School Bus Operational & Financial Ledger ({currentBranch.nameKhmer})
              </p>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-500">ចំនួនខ្សែរត់</div>
                <div className="font-bold text-base font-mono text-slate-900 mt-0.5">{busRoutes.length}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-500">សិស្សជិះសរុប</div>
                <div className="font-bold text-base font-mono text-slate-900 mt-0.5">{totalRiders} នាក់</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-500">បានបង់ថ្លៃសេវា</div>
                <div className="font-bold text-base font-mono text-emerald-700 mt-0.5">{paidRiders} នាក់</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-500">ទឹកប្រាក់ប្រមូលបាន</div>
                <div className="font-bold text-base font-mono text-indigo-700 mt-0.5">${totalBusRevenueUSD.toFixed(2)}</div>
              </div>
            </div>

            {/* Official Riders List */}
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300 text-center w-10">ល.រ</th>
                  <th className="p-2 border-r border-slate-300 font-mono">កូដសិស្ស</th>
                  <th className="p-2 border-r border-slate-300">ឈ្មោះសិស្ស</th>
                  <th className="p-2 border-r border-slate-300 text-center">ថ្នាក់</th>
                  <th className="p-2 border-r border-slate-300">ខ្សែរត់</th>
                  <th className="p-2 border-r border-slate-300">ទីតាំងឡើង</th>
                  <th className="p-2 border-r border-slate-300 text-right">ថ្លៃសេវា ($)</th>
                  <th className="p-2 text-center">ស្ថានភាពបង់</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-xs">
                {busEnrollments.map((enr, i) => {
                  const r = busRoutes.find((rt) => rt.id === enr.routeId);
                  return (
                    <tr key={enr.id}>
                      <td className="p-2 border-r border-slate-200 text-center">{i + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-bold">{enr.studentCode}</td>
                      <td className="p-2 border-r border-slate-200 font-khmer font-bold">{enr.studentName}</td>
                      <td className="p-2 border-r border-slate-200 text-center">{enr.className}</td>
                      <td className="p-2 border-r border-slate-200 font-khmer">{r?.name || enr.routeId}</td>
                      <td className="p-2 border-r border-slate-200 font-khmer">{enr.pickupLocation}</td>
                      <td className="p-2 border-r border-slate-200 text-right">${enr.monthlyFeeUSD}</td>
                      <td className="p-2 text-center font-khmer font-bold">
                        {enr.status === 'paid' ? 'បានបង់' : 'មិនទាន់បង់'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <td colSpan={6} className="p-2.5 text-right border-r border-slate-300 font-khmer">
                    សរុបទឹកប្រាក់ប្រមូលបាន (Total Collected):
                  </td>
                  <td className="p-2.5 text-right font-mono font-black text-indigo-800">
                    ${totalBusRevenueUSD.toFixed(2)}
                  </td>
                  <td className="p-2.5 text-center font-mono">
                    ({totalBusRevenueKHR.toLocaleString()} ៛)
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Official Signatures */}
            <div className="pt-10 flex justify-between items-start text-center text-xs">
              <div className="space-y-16">
                <div>
                  <div className="font-bold">បានឃើញ និងឯកភាព</div>
                  <div className="text-slate-500">នាយកសាខា ({currentBranch.nameKhmer})</div>
                </div>
                <div className="font-bold text-slate-800 underline">
                  {currentBranch.directorName || settings.directorName}
                </div>
              </div>

              <div className="space-y-16">
                <div>
                  <div className="text-slate-500">
                    រាជធានីភ្នំពេញ, ថ្ងៃទី....... ខែ....... ឆ្នាំ{globalYear}
                  </div>
                  <div className="font-bold mt-1">បេឡាធិការ / អ្នកគ្រប់គ្រងរថយន្ត</div>
                </div>
                <div className="font-bold text-slate-800 underline">
                  {currentUser.khmerName}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-MONTH SCHOOL BUS PAYMENT MODAL */}
      {isPayModalOpen && selectedEnrollmentForPay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-xs my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700 font-bold font-khmer text-base">
                <Receipt className="w-5 h-5 text-amber-500" />
                <span>{t('បង់ថ្លៃសេវារថយន្តសាលា (School Bus Payment)', 'School Bus Payment')}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBusPayment} className="mt-4 space-y-4">
              {/* Student & Route Info Banner */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5 font-khmer">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedEnrollmentForPay.studentName}
                  </span>
                  <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {selectedEnrollmentForPay.studentCode}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <div>ថ្នាក់រៀន៖ <strong>{selectedEnrollmentForPay.className}</strong></div>
                  <div>ខ្សែរត់៖ <strong>{busRoutes.find((r) => r.id === selectedEnrollmentForPay.routeId)?.name}</strong></div>
                  <div>ឡើងនៅ៖ <strong>{selectedEnrollmentForPay.pickupLocation}</strong></div>
                </div>
              </div>

              {/* Month Selection Header & Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-800 font-bold font-khmer text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>ជ្រើសរើសខែបង់ប្រាក់ (Select Months to Pay) *</span>
                  </label>
                  <span className="text-[11px] text-indigo-700 font-bold font-khmer bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    បានជ្រើសរើស: {payMonths.length} ខែ
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                  {[
                    { label: '១ ខែ (1 Month)', count: 1 },
                    { label: '២ ខែ (2 Months)', count: 2 },
                    { label: '៣ ខែ (ត្រីមាស)', count: 3 },
                    { label: '៦ ខែ (ឆមាស)', count: 6 },
                    { label: '១០ ខែ (ពេញមួយឆ្នាំ)', count: 10 },
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.count}
                      onClick={() => handleSetQuickPresetMonths(preset.count)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-khmer font-bold border transition-all cursor-pointer ${
                        payMonths.length === preset.count
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* 12-Month Chip Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {ACADEMIC_MONTHS.map((mStr) => {
                    const isSelected = payMonths.includes(mStr);
                    const isAlreadyPaid = selectedEnrollmentForPay.paidMonths?.includes(mStr);

                    return (
                      <button
                        type="button"
                        key={mStr}
                        onClick={() => handleTogglePayMonth(mStr)}
                        className={`text-left p-2 rounded-lg border text-[11px] transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : isAlreadyPaid
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <div className={`font-khmer font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {getKhmerMonthName(mStr)}
                          </div>
                          <div className={`text-[9px] font-mono truncate ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {mStr}
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="w-4 h-4 rounded-full bg-white text-indigo-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                            ✓
                          </span>
                        ) : isAlreadyPaid ? (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-200 text-emerald-950 font-khmer font-bold shrink-0">
                            រួច
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Calculation Matrix */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                      តម្លៃក្នុង ១ខែ ($ USD) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={payFeePerMonth}
                      onChange={(e) => setPayFeePerMonth(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-bold text-xs bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                      ចំនួនខែសរុប (Months)
                    </label>
                    <div className="px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-bold text-xs bg-slate-100 text-indigo-900 flex items-center justify-between">
                      <span>{payMonths.length} ខែ</span>
                      <span className="text-[10px] text-slate-400 font-sans">× ${payFeePerMonth}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                      បញ្ចុះតម្លៃ ($ Discount)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={payDiscountUSD}
                      onChange={(e) => setPayDiscountUSD(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs bg-white text-rose-700"
                    />
                  </div>
                </div>

                {/* Grand Total Box */}
                <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
                  <div>
                    <div className="text-[10px] text-slate-300 font-khmer uppercase tracking-wider font-semibold">
                      ទឹកប្រាក់ត្រូវទូទាត់សរុប (Grand Total)
                    </div>
                    <div className="text-xl sm:text-2xl font-mono font-black mt-0.5 tracking-tight text-amber-400">
                      ${computedNetUSD.toFixed(2)} USD
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-mono">1$ = {settings.exchangeRate.toLocaleString()}៛</div>
                    <div className="text-sm sm:text-base font-mono font-extrabold text-white mt-0.5">
                      {computedNetKHR.toLocaleString()} ៛
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    វិធីទូទាត់ (Payment Method) *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['ABA', 'AC', 'Cash'] as const).map((method) => (
                      <button
                        type="button"
                        key={method}
                        onClick={() => setPayMethod(method)}
                        className={`py-2 px-2 rounded-lg font-bold text-xs border transition-all text-center cursor-pointer ${
                          payMethod === method
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {method === 'AC' ? 'ACLEDA' : method === 'Cash' ? 'សាច់ប្រាក់' : method}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    កាលបរិច្ឆេទបង់ប្រាក់ (Payment Date) *
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  កំណត់សម្គាល់លើវិក្កយបត្រ (Invoice Memo / Note)
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder={`ឧ. បង់ថ្លៃរថយន្តសាលាសម្រាប់ខែ៖ ${payMonths.map((m) => getKhmerMonthName(m)).join(', ')}`}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-khmer bg-white"
                />
              </div>

              {/* Instant Telegram Notice Banner */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-sky-50 border border-sky-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendTelegramNotice}
                  onChange={(e) => setSendTelegramNotice(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-sky-950 font-khmer flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-600" />
                    <span>ផ្ញើការជូនដំណឹង Telegram Alert ភ្លាមៗ (Telegram Instant Notice)</span>
                  </div>
                  <div className="text-[10px] text-sky-700 font-khmer mt-0.5">
                    ផ្ញើព័ត៌មានវិក្កយបត្រ បញ្ជីខែបង់ ({payMonths.length} ខែ) និងទឹកប្រាក់សរុបទៅគ្រុប Telegram
                  </div>
                </div>
              </label>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium font-khmer cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold font-khmer shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>បញ្ជាក់ការបង់ & ចេញវិក្កយបត្រ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL CAMBODIAN SCHOOL BUS INVOICE & RECEIPT MODAL */}
      {isInvoiceModalOpen && activeInvoiceRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Top Actions */}
            <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm font-khmer">
                  {t('វិក្កយបត្រផ្លូវការ & បង្កាន់ដៃបង់ថ្លៃរថយន្តសាលា', 'Official School Bus Invoice & Receipt')}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  (#{activeInvoiceRecord.invoiceNo || activeInvoiceRecord.receiptNo})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('បោះពុម្ព (Print)', 'Print')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-900 bg-white" id="official-bus-invoice">
              {/* National Header */}
              <div className="text-center space-y-1">
                <div className="font-bold text-xs font-khmer text-slate-800">ព្រះរាជាណាចក្រកម្ពុជា</div>
                <div className="text-[11px] font-semibold font-khmer text-slate-700">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
                <div className="text-sm font-extrabold font-khmer text-slate-900 pt-1.5">
                  {settings.schoolNameKhmer}
                </div>
                <div className="text-xs font-bold text-indigo-900 font-khmer">
                  {currentBranch.nameKhmer} ({currentBranch.code})
                </div>
                <div className="text-xs font-serif font-bold text-slate-600">
                  {settings.schoolNameEnglish} - {currentBranch.nameEnglish}
                </div>
                <div className="text-base font-extrabold font-khmer text-amber-900 pt-2 tracking-wide uppercase">
                  វិក្កយបត្រ & បង្កាន់ដៃទទួលប្រាក់ថ្លៃរថយន្តសាលា
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  OFFICIAL SCHOOL BUS SERVICE INVOICE & RECEIPT VOUCHER
                </div>
              </div>

              {/* Meta Details Box */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-khmer">
                <div>
                  <span className="text-slate-500 block text-[10px]">លេខវិក្កយបត្រ / Invoice No:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {activeInvoiceRecord.invoiceNo || activeInvoiceRecord.receiptNo}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">កាលបរិច្ឆេទ / Date:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {activeInvoiceRecord.paymentDate}
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
                    {activeInvoiceRecord.studentName}
                  </span>
                  {activeInvoiceRecord.latinName && (
                    <span className="block text-[10px] text-slate-500 font-sans">
                      {activeInvoiceRecord.latinName}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">អត្តលេខសិស្ស / Student Code:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeInvoiceRecord.studentCode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ថ្នាក់រៀន / Class:</span>
                  <span className="font-bold text-slate-900">
                    {activeInvoiceRecord.className}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-slate-500 block text-[10px]">ខ្សែរត់រថយន្ត / Bus Route:</span>
                  <span className="font-bold text-slate-900">
                    {activeInvoiceRecord.routeName}
                  </span>
                </div>
              </div>

              {/* Itemized Multi-Month Schedule Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 font-khmer font-bold text-slate-800">
                    <tr>
                      <th className="py-2 px-3 text-center w-10 border-r border-slate-300">ល.រ</th>
                      <th className="py-2 px-3 text-left border-r border-slate-300">
                        បរិយាយ / ខែសេវារថយន្ត (Bus Service Month)
                      </th>
                      <th className="py-2 px-3 text-center border-r border-slate-300 w-24">ចំនួនខែ</th>
                      <th className="py-2 px-3 text-right border-r border-slate-300 w-28">តម្លៃ ១ខែ ($)</th>
                      <th className="py-2 px-3 text-right w-28">ទឹកប្រាក់ ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(activeInvoiceRecord.months && activeInvoiceRecord.months.length > 0
                      ? activeInvoiceRecord.months
                      : [activeInvoiceRecord.month]
                    ).map((m, idx) => {
                      const feeRate =
                        activeInvoiceRecord.feePerMonthUSD ||
                        activeInvoiceRecord.amountUSD / (activeInvoiceRecord.months?.length || 1);
                      return (
                        <tr key={m} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center font-mono text-slate-500 border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 font-khmer">
                            <span className="font-bold text-slate-900">
                              ថ្លៃរថយន្តសាលា {getKhmerMonthName(m)}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px] ml-1.5">
                              ({m})
                            </span>
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
                    })}
                  </tbody>
                  <tfoot className="border-t border-slate-300 bg-slate-50 text-xs">
                    <tr>
                      <td colSpan={4} className="py-2 px-3 text-right font-khmer font-bold text-slate-700 border-r border-slate-300">
                        សរុបរួម (Subtotal):
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        ${((activeInvoiceRecord.amountUSD || 0) + (activeInvoiceRecord.discountUSD || 0)).toFixed(2)}
                      </td>
                    </tr>
                    {(activeInvoiceRecord.discountUSD ?? 0) > 0 ? (
                      <tr>
                        <td colSpan={4} className="py-1.5 px-3 text-right font-khmer font-bold text-rose-700 border-r border-slate-300">
                          បញ្ចុះតម្លៃពិសេស (Discount):
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-700">
                          -${(activeInvoiceRecord.discountUSD || 0).toFixed(2)}
                        </td>
                      </tr>
                    ) : null}
                    <tr className="bg-amber-100 font-black text-slate-950 border-t border-amber-300">
                      <td colSpan={4} className="py-2.5 px-3 text-right font-khmer font-black text-slate-950 border-r border-amber-300 text-sm">
                        ទឹកប្រាក់ត្រូវទូទាត់សរុប (Grand Total USD):
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-base text-slate-950">
                        ${activeInvoiceRecord.amountUSD.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="bg-amber-50 font-bold text-slate-900 border-t border-amber-200">
                      <td colSpan={4} className="py-2 px-3 text-right font-khmer text-slate-700 border-r border-amber-200">
                        គិតជាប្រាក់រៀល (Total in KHR @ {settings.exchangeRate.toLocaleString()}៛):
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-900">
                        {activeInvoiceRecord.amountKHR.toLocaleString()} ៛
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Method & Notes */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-khmer">
                <div>
                  <span className="text-slate-500">វិធីទូទាត់ / Payment Method: </span>
                  <span className="font-bold text-slate-900 font-mono ml-1">
                    {activeInvoiceRecord.paidBy}
                  </span>
                </div>
                {activeInvoiceRecord.notes && (
                  <div className="text-slate-600">
                    <span className="text-slate-500">សម្គាល់: </span>
                    <span>{activeInvoiceRecord.notes}</span>
                  </div>
                )}
                <div className="text-slate-500 text-[11px]">
                  អ្នកចេញវិក្កយបត្រ៖ <span className="font-bold text-slate-800">{activeInvoiceRecord.recordedBy || currentUser.khmerName}</span>
                </div>
              </div>

              {/* Signatures Block */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-xs text-center font-khmer">
                <div className="space-y-12">
                  <div className="font-bold text-slate-800">ហត្ថលេខាអាណាព្យាបាល / សិស្ស (Payer Signature)</div>
                  <div className="text-slate-400 font-mono">...................................</div>
                </div>
                <div className="space-y-12">
                  <div className="font-bold text-slate-800">ហត្ថលេខា & ត្រាបេឡាធិការ (Cashier Stamp)</div>
                  <div className="font-bold text-slate-900">
                    {activeInvoiceRecord.recordedBy || currentUser.khmerName}
                  </div>
                </div>
              </div>

              {/* Official Seal Footnote */}
              <div className="pt-4 text-center text-[10px] text-slate-400 font-khmer border-t border-slate-100">
                វិក្កយបត្រនេះត្រូវបានបង្កើតឡើងដោយប្រព័ន្ធស្វ័យប្រវត្តិនៃ {settings.schoolNameKhmer} ({currentBranch.nameKhmer})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE RIDER CONFIRMATION DIALOG (replaces window.confirm) */}
      {riderToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-rose-600 font-bold font-khmer text-base pb-2 border-b border-slate-100">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>បញ្ជាក់ការលុបសិស្ស</span>
            </div>
            <p className="mt-3 text-slate-600 font-khmer">
              តើអ្នកពិតជាចង់លុបសិស្ស <strong>"{riderToDelete.studentName}"</strong> ({riderToDelete.studentCode}) ចេញពីបញ្ជីរថយន្តសាលាមែនទេ?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRiderToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-khmer cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={() => {
                  removeBusEnrollment(riderToDelete.id);
                  setRiderToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold font-khmer cursor-pointer shadow-xs"
              >
                លុបចេញ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENROLL STUDENT IN BUS MODAL */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bus className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base font-khmer">
                  {t('ចុះឈ្មោះសិស្សជិះរថយន្តសាលា', 'Enroll Student in School Bus')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEnrollment} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ជ្រើសរើសសិស្ស (Select Student) *
                </label>
                <SearchableSelect
                  options={studentOptions}
                  value={enrollStudentCode}
                  onChange={(val) => setEnrollStudentCode(String(val))}
                  placeholder="ស្វែងរកសិស្សតាមឈ្មោះ ឬកូដ..."
                  searchPlaceholder="វាយឈ្មោះសិស្ស ឬកូដ..."
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ជ្រើសរើសខ្សែរត់រថយន្ត (Bus Route) *
                </label>
                <select
                  value={enrollRouteId}
                  onChange={(e) => {
                    const rId = e.target.value;
                    setEnrollRouteId(rId);
                    const matched = busRoutes.find((r) => r.id === rId);
                    if (matched) setEnrollFeeUSD(matched.monthlyFeeUSD);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold"
                >
                  {busRoutes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (${r.monthlyFeeUSD}/ខែ)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ទីតាំងទទួល (Pickup Location) *
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. វត្តច្បារអំពៅ, ស្តុបបឹងកេងកង..."
                    value={enrollPickup}
                    onChange={(e) => setEnrollPickup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    វេនដឹក (Shift) *
                  </label>
                  <select
                    value={enrollShift}
                    onChange={(e) => setEnrollShift(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                  >
                    <option value="both">ទាំងព្រឹកទាំងល្ងាច (Both Shifts)</option>
                    <option value="morning">តែពេលព្រឹក (Morning Only)</option>
                    <option value="afternoon">តែពេលរសៀល (Afternoon Only)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    តម្លៃសេវាប្រចាំខែ ($ USD) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={enrollFeeUSD}
                    onChange={(e) => setEnrollFeeUSD(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    តម្លៃគិតជាប្រាក់រៀល (KHR)
                  </label>
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800">
                    {(enrollFeeUSD * settings.exchangeRate).toLocaleString()} ៛
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold font-khmer shadow-xs cursor-pointer"
                >
                  ចុះឈ្មោះ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW ROUTE MODAL */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base font-khmer">
                  {t('បង្កើតខ្សែរត់រថយន្តសាលាថ្មី', 'Create New Bus Route')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRouteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ឈ្មោះខ្សែរត់ (Route Name Khmer) *
                </label>
                <input
                  type="text"
                  placeholder="ឧ. ខ្សែទី៤៖ ពោធិ៍ចិនតុង - ទឹកថ្លា - សាលារៀន"
                  value={routeNameKhmer}
                  onChange={(e) => setRouteNameKhmer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ឈ្មោះជាភាសាអង់គ្លេស (English Name)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Route 4: Pochentong - Teuk Thla"
                  value={routeNameEnglish}
                  onChange={(e) => setRouteNameEnglish(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ឈ្មោះអ្នកបើកបរ *
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. សុខ វិបុល"
                    value={routeDriverName}
                    onChange={(e) => setRouteDriverName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    លេខទូរស័ព្ទ *
                  </label>
                  <input
                    type="text"
                    placeholder="012 345 678"
                    value={routeDriverPhone}
                    onChange={(e) => setRouteDriverPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ស្លាកលេខឡាន
                  </label>
                  <input
                    type="text"
                    placeholder="ភ្នំពេញ 2A-..."
                    value={routeVehiclePlate}
                    onChange={(e) => setRouteVehiclePlate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ចំណុះ (កៅអី)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={routeCapacity}
                    onChange={(e) => setRouteCapacity(Number(e.target.value) || 25)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    តម្លៃ/ខែ ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={routeFeeUSD}
                    onChange={(e) => setRouteFeeUSD(Number(e.target.value) || 25)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRouteModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold font-khmer shadow-xs cursor-pointer"
                >
                  បង្កើតខ្សែរត់
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
