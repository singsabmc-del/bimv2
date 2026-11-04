import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StudentFeeRecord, StudentFeePaymentItem, MONTH_NAMES, MONTH_NAMES_KH } from '../types';
import {
  Search,
  Plus,
  CheckCircle2,
  Edit2,
  Trash2,
  DollarSign,
  Printer,
  ChevronDown,
  X,
  CreditCard,
  FileSpreadsheet,
  Filter,
  Calendar,
  Sparkles,
  Send,
  User,
  Receipt,
  Check,
  FileText,
  Layers,
  Eye,
  UserMinus,
  UserX,
  RotateCcw,
  GraduationCap,
  GripVertical,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { StudentInvoiceHistoryTable } from './StudentInvoiceHistoryTable';
import { PromoteStudentsModal } from './PromoteStudentsModal';
import { ClassMonthManagerModal } from './ClassMonthManagerModal';
import { ExcelStudentImportModal } from './ExcelStudentImportModal';
import { InvoiceQRCode } from './InvoiceQRCode';

interface StudentFeesViewProps {
  onPrintReport?: () => void;
  onOpenOfficialRoster?: () => void;
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

// Date formatter helpers: ISO <-> DD-MM-YYYY
const toISODate = (dStr?: string): string => {
  if (!dStr) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return dStr;
  const parts = dStr.split(/[-./_]/);
  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return new Date().toISOString().slice(0, 10);
};

const toSchoolDate = (isoStr?: string): string => {
  if (!isoStr) return new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return isoStr;
};

export const StudentFeesView: React.FC<StudentFeesViewProps> = ({ onPrintReport, onOpenOfficialRoster }) => {
  const {
    classData,
    orderedClassList,
    reorderClasses,
    academicMonths,
    selectedClassId,
    setSelectedClassId,
    updateStudentFee,
    recordStudentPayment,
    addStudent,
    deleteStudent,
    clearStudentsPaymentHistory,
    clearAllPaymentHistory,
    addClass,
    permissions,
    currentUser,
    globalMonth,
    globalYear,
    setGlobalMonth,
    setGlobalYear,
    branches,
    currentBranchId,
    currentBranch,
    settings,
    sendTelegramAlert,
    t,
    openInvoiceVerification,
  } = useApp();

  const currentClass = classData[selectedClassId] || orderedClassList[0] || Object.values(classData)[0];

  // Total students across all classes for school-wide clear
  const totalSchoolStudents = useMemo(() => {
    return Object.values(classData).reduce((sum, cls) => sum + cls.students.length, 0);
  }, [classData]);

  // Student Selection for Batch Actions (Admin Only)
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [clearHistoryScope, setClearHistoryScope] = useState<'selected' | 'current_class' | 'all_classes'>('selected');
  const [clearHistoryResetActiveStatus, setClearHistoryResetActiveStatus] = useState(true);
  const [clearHistoryConfirmText, setClearHistoryConfirmText] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all, paid, unpaid, prepaid, stopped
  const [filterCase, setFilterCase] = useState<string>('all'); // all, Full, Contribute, 50%
  const [filterGender, setFilterGender] = useState<string>('all'); // all, Man, Female
  const [filterPaidBy, setFilterPaidBy] = useState<string>('all'); // all, ABA, AC, Cash
  const [filterMonth, setFilterMonth] = useState<string>('all'); // all or specific month

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [managerInitialTab, setManagerInitialTab] = useState<'classes' | 'months'>('classes');
  const [draggedStripClassIndex, setDraggedStripClassIndex] = useState<number | null>(null);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<StudentFeeRecord | null>(null);

  // Sorting state
  type StudentSortField = 'id' | 'studentCode' | 'name' | 'gender' | 'note' | 'feesGroup' | 'startDate' | 'paymentDate' | 'caseType' | 'paidBy' | 'cash';
  const [sortField, setSortField] = useState<StudentSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: StudentSortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Stop / Drop Out Student Modal states
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [stopStudentId, setStopStudentId] = useState<number | null>(null);
  const [stopActionType, setStopActionType] = useState<'stop' | 'reactivate'>('stop');
  const [stopReason, setStopReason] = useState('ឈប់រៀន');
  const [stopCustomNote, setStopCustomNote] = useState('');
  const [stopDate, setStopDate] = useState(() => new Date().toISOString().slice(0, 10));

  const handleOpenStopModal = (student?: StudentFeeRecord) => {
    if (student) {
      const isStopped = student.feesGroup.toLowerCase().includes('stop');
      setStopStudentId(student.id);
      setStopActionType(isStopped ? 'reactivate' : 'stop');
      setStopReason(student.paymentDate && student.paymentDate !== '- ' && !student.paymentDate.includes('-202') ? student.paymentDate : 'ឈប់រៀន');
    } else {
      const firstStudent = currentClass?.students[0];
      setStopStudentId(firstStudent ? firstStudent.id : null);
      setStopActionType('stop');
      setStopReason('ឈប់រៀន');
    }
    setStopCustomNote('');
    setStopDate(new Date().toISOString().slice(0, 10));
    setIsStopModalOpen(true);
  };

  const handleConfirmStopAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass || !stopStudentId) return;

    const target = currentClass.students.find((s) => s.id === stopStudentId);
    if (!target) return;

    if (stopActionType === 'stop') {
      const finalReason = stopCustomNote.trim() ? stopCustomNote.trim() : stopReason;
      updateStudentFee(currentClass.classId, stopStudentId, {
        feesGroup: 'Stopped',
        paymentDate: finalReason,
        paidBy: '$ -',
        cash: 0.0,
      });
      sendTelegramAlert?.(
        'សិស្សឈប់រៀន (Student Stopped / Dropped)',
        `សិស្ស៖ ${target.name} (${currentClass.className})\nកូដសិស្ស៖ ${target.studentCode}\nស្ថានភាព៖ ឈប់រៀន\nមូលហេតុ៖ ${finalReason}\nកាលបរិច្ឆេទ៖ ${stopDate}`,
        'system',
        target.name
      );
    } else {
      updateStudentFee(currentClass.classId, stopStudentId, {
        feesGroup: globalMonth,
        paymentDate: toSchoolDate(stopDate),
        paidBy: 'Cash',
        cash: 0.0,
      });
      sendTelegramAlert?.(
        'សិស្សចូលរៀនឡើងវិញ (Student Reactivated)',
        `សិស្ស៖ ${target.name} (${currentClass.className})\nកូដសិស្ស៖ ${target.studentCode}\nស្ថានភាព៖ ចូលរៀនវិញក្នុងខែ ${globalMonth}\nកាលបរិច្ឆេទ៖ ${stopDate}`,
        'system',
        target.name
      );
    }

    setIsStopModalOpen(false);
    setStopStudentId(null);
  };

  const [selectedStudent, setSelectedStudent] = useState<StudentFeeRecord | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<{
    student: StudentFeeRecord;
    receipt: StudentFeePaymentItem;
  } | null>(null);

  const handleOpenStudentDetails = (student: StudentFeeRecord) => {
    setSelectedStudentForDetails(student);
    setIsDetailsModalOpen(true);
  };

  // Form states with correct types
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentLatin, setNewStudentLatin] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Man' | 'Female'>('Man');
  const [newStudentNote, setNewStudentNote] = useState<'Old' | 'New'>('Old');
  const [newStudentCase, setNewStudentCase] = useState<'Full' | 'Contribute' | '50%'>('Full');
  const [newStudentFeesGroup, setNewStudentFeesGroup] = useState(globalMonth);
  const [newStudentStartDate, setNewStudentStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [newStudentPaymentDate, setNewStudentPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [newStudentPaidBy, setNewStudentPaidBy] = useState<'ABA' | 'AC' | 'Cash' | '$ -'>('ABA');
  const [newStudentCash, setNewStudentCash] = useState<number>(12.5);

  // Multi-Month Quick Pay Modal Form (Pay Multi-Month for 1 Invoice)
  const [payMethod, setPayMethod] = useState<'ABA' | 'AC' | 'Cash'>('ABA');
  const [payMonths, setPayMonths] = useState<string[]>([`${globalMonth} ${globalYear}`]);
  const [payMonthlyRate, setPayMonthlyRate] = useState<number>(12.5);
  const [payDiscount, setPayDiscount] = useState<number>(0);
  const [payAmount, setPayAmount] = useState<number>(12.5);
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [payInvoiceNo, setPayInvoiceNo] = useState<string>('');
  const [payNote, setPayNote] = useState<string>('');
  const [sendTelegramNotice, setSendTelegramNotice] = useState<boolean>(true);

  // New Class Form
  const [newClassName, setNewClassName] = useState('');
  const [newClassPeriod, setNewClassPeriod] = useState(`01.10.${globalYear} _ 31.10.${globalYear}`);

  // Filter students based on all filter parameters
  const filteredStudents = (currentClass?.students || []).filter((st) => {
    // Search by Name or Student ID/Code
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.latinName && st.latinName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      st.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.id.toString() === searchQuery.trim();

    // Case filter
    const matchesCase =
      filterCase === 'all' || st.caseType.toLowerCase() === filterCase.toLowerCase();

    // Gender filter
    const matchesGender =
      filterGender === 'all' || st.gender === filterGender;

    // Payment Method filter
    const matchesPaidBy =
      filterPaidBy === 'all' || st.paidBy === filterPaidBy;

    // Month filter
    const matchesMonth =
      filterMonth === 'all' || st.feesGroup.toLowerCase() === filterMonth.toLowerCase();

    // Payment Status filter
    let matchesStatus = true;
    if (filterStatus === 'paid') {
      matchesStatus = st.cash > 0 && !st.feesGroup.toLowerCase().includes('stop');
    } else if (filterStatus === 'unpaid') {
      matchesStatus = st.cash === 0 && !st.feesGroup.toLowerCase().includes('stop') && !st.feesGroup.toLowerCase().includes('already');
    } else if (filterStatus === 'prepaid') {
      matchesStatus = st.feesGroup.toLowerCase().includes('already');
    } else if (filterStatus === 'stopped') {
      matchesStatus = st.feesGroup.toLowerCase().includes('stop');
    }

    return matchesSearch && matchesCase && matchesGender && matchesPaidBy && matchesMonth && matchesStatus;
  });

  // Sort students based on sortField and sortDirection
  const sortedStudents = useMemo(() => {
    if (!sortField) return filteredStudents;
    return [...filteredStudents].sort((a, b) => {
      let result = 0;
      if (sortField === 'cash') {
        result = (Number(a.cash) || 0) - (Number(b.cash) || 0);
      } else if (sortField === 'id') {
        result = (Number(a.id) || 0) - (Number(b.id) || 0);
      } else if (sortField === 'startDate' || sortField === 'paymentDate') {
        const aIso = toISODate(a[sortField]);
        const bIso = toISODate(b[sortField]);
        result = aIso.localeCompare(bIso);
      } else {
        const aStr = (a[sortField] || '').toString();
        const bStr = (b[sortField] || '').toString();
        result = aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
      }
      return sortDirection === 'asc' ? result : -result;
    });
  }, [filteredStudents, sortField, sortDirection]);

  const renderSortIndicator = (field: StudentSortField) => {
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

  const handleOpenEdit = (student: StudentFeeRecord) => {
    setSelectedStudent(student);
    setNewStudentName(student.name);
    setNewStudentLatin(student.latinName || '');
    setNewStudentGender(student.gender);
    setNewStudentNote(student.note);
    setNewStudentCase(student.caseType);
    setNewStudentFeesGroup(student.feesGroup);
    setNewStudentStartDate(toISODate(student.startDate));
    setNewStudentPaymentDate(toISODate(student.paymentDate));
    setNewStudentPaidBy(student.paidBy);
    setNewStudentCash(student.cash);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !currentClass) return;

    updateStudentFee(currentClass.classId, selectedStudent.id, {
      name: newStudentName.trim(),
      latinName: newStudentLatin.trim(),
      gender: newStudentGender,
      note: newStudentNote,
      caseType: newStudentCase,
      feesGroup: newStudentFeesGroup,
      startDate: toSchoolDate(newStudentStartDate),
      paymentDate: toSchoolDate(newStudentPaymentDate),
      paidBy: newStudentPaidBy,
      cash: Number(newStudentCash) || 0,
    });

    setIsEditModalOpen(false);
    setSelectedStudent(null);
  };

  // Open Quick Pay Modal with Multi-Month support
  const handleOpenQuickPay = (student: StudentFeeRecord) => {
    setSelectedStudent(student);
    const suggestedRate =
      student.caseType === 'Full' ? 12.5 : student.caseType === '50%' ? 6.25 : 5.0;

    // Detect all months already paid by student
    const alreadyPaidMonths = new Set<string>();
    student.feeHistory?.forEach((rec) => {
      if (rec.months && rec.months.length > 0) {
        rec.months.forEach((m) => alreadyPaidMonths.add(m));
      } else if (rec.month) {
        alreadyPaidMonths.add(rec.month);
      }
    });

    // Pick first unpaid month
    const firstUnpaid =
      ACADEMIC_MONTHS.find((m) => !alreadyPaidMonths.has(m)) || `${globalMonth} ${globalYear}`;

    const initialMonths = [firstUnpaid];
    setPayMonths(initialMonths);
    setPayMonthlyRate(suggestedRate);
    setPayDiscount(0);
    setPayAmount(suggestedRate);
    setPayMethod(student.paidBy !== '$ -' ? (student.paidBy as any) : 'ABA');
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayInvoiceNo(`INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`);
    setPayNote(`បង់ថ្លៃសិក្សា ${getKhmerMonthName(firstUnpaid)}`);
    setSendTelegramNotice(true);
    setIsPayModalOpen(true);
  };

  // Helper to select quick presets of months (1, 2, 3, 6, 10 months)
  const handleSetQuickPresetMonths = (monthsCount: number) => {
    if (!selectedStudent) return;
    const alreadyPaidMonths = new Set<string>();
    selectedStudent.feeHistory?.forEach((rec) => {
      if (rec.months && rec.months.length > 0) {
        rec.months.forEach((m) => alreadyPaidMonths.add(m));
      } else if (rec.month) {
        alreadyPaidMonths.add(rec.month);
      }
    });

    // Find unpaid months
    const available = ACADEMIC_MONTHS.filter((m) => !alreadyPaidMonths.has(m));
    const targetMonths = (available.length >= monthsCount ? available : ACADEMIC_MONTHS).slice(0, monthsCount);
    if (targetMonths.length === 0) targetMonths.push(`${globalMonth} ${globalYear}`);

    setPayMonths(targetMonths);
    const subtotal = targetMonths.length * payMonthlyRate;
    setPayAmount(Math.max(0, subtotal - payDiscount));
    setPayNote(
      targetMonths.length > 1
        ? `បង់ថ្លៃសិក្សា ${targetMonths.length}ខែ (${getKhmerMonthName(targetMonths[0])} - ${getKhmerMonthName(targetMonths[targetMonths.length - 1])})`
        : `បង់ថ្លៃសិក្សា ${getKhmerMonthName(targetMonths[0])}`
    );
  };

  // Toggle single month in multi-month selection
  const handleToggleMonth = (mStr: string) => {
    let nextMonths: string[];
    if (payMonths.includes(mStr)) {
      if (payMonths.length === 1) return; // Keep at least 1 month
      nextMonths = payMonths.filter((m) => m !== mStr);
    } else {
      nextMonths = [...payMonths, mStr];
      // Sort in chronological order according to ACADEMIC_MONTHS
      nextMonths.sort((a, b) => {
        const idxA = ACADEMIC_MONTHS.indexOf(a);
        const idxB = ACADEMIC_MONTHS.indexOf(b);
        return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
      });
    }
    setPayMonths(nextMonths);
    const subtotal = nextMonths.length * payMonthlyRate;
    setPayAmount(Math.max(0, subtotal - payDiscount));
    setPayNote(
      nextMonths.length > 1
        ? `បង់ថ្លៃសិក្សា ${nextMonths.length}ខែ (${getKhmerMonthName(nextMonths[0])} - ${getKhmerMonthName(nextMonths[nextMonths.length - 1])})`
        : `បង់ថ្លៃសិក្សា ${getKhmerMonthName(nextMonths[0])}`
    );
  };

  // Update monthly rate and recalculate total
  const handleChangeMonthlyRate = (rate: number) => {
    setPayMonthlyRate(rate);
    const subtotal = payMonths.length * rate;
    setPayAmount(Math.max(0, subtotal - payDiscount));
  };

  // Update discount and recalculate total
  const handleChangeDiscount = (disc: number) => {
    setPayDiscount(disc);
    const subtotal = payMonths.length * payMonthlyRate;
    setPayAmount(Math.max(0, subtotal - disc));
  };

  // Submit Multi-Month Payment and Open Official Printable Invoice
  const handleSaveQuickPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !currentClass) return;

    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
    const invoiceNo = payInvoiceNo.trim() || `INV-${Date.now().toString().slice(-6)}`;
    const totalAmount = Number(payAmount) || 0;
    const finalMonths = payMonths.length > 0 ? payMonths : [`${globalMonth} ${globalYear}`];

    recordStudentPayment(currentClass.classId, selectedStudent.id, {
      month: finalMonths.join(', '),
      months: finalMonths,
      monthsCount: finalMonths.length,
      feePerMonthUSD: payMonthlyRate,
      discountUSD: Number(payDiscount) || 0,
      amountUSD: totalAmount,
      paidBy: payMethod,
      date: toSchoolDate(payDate),
      receiptNo,
      invoiceNo,
      note: payNote.trim(),
      sendTelegram: sendTelegramNotice,
    });

    setIsPayModalOpen(false);

    // Automatically open the Official Multi-Month Invoice Preview Modal!
    const generatedReceipt: StudentFeePaymentItem = {
      receiptNo,
      invoiceNo,
      month: finalMonths.join(', '),
      months: finalMonths,
      monthsCount: finalMonths.length,
      feePerMonthUSD: payMonthlyRate,
      discountUSD: Number(payDiscount) || 0,
      amountUSD: totalAmount,
      amountKHR: Math.round(totalAmount * settings.exchangeRate),
      paidBy: payMethod,
      date: toSchoolDate(payDate),
      recordedBy: currentUser.khmerName,
      status: 'paid',
      note: payNote.trim(),
    };

    setActiveInvoice({
      student: selectedStudent,
      receipt: generatedReceipt,
    });
    setIsInvoiceModalOpen(true);
  };

  // Open Invoice Modal for any student
  const handleOpenInvoice = (student: StudentFeeRecord, receiptIndex = 0) => {
    setSelectedStudent(student);
    const receipt: StudentFeePaymentItem =
      student.feeHistory && student.feeHistory.length > 0
        ? student.feeHistory[receiptIndex]
        : {
            receiptNo: `REC-${student.id.toString().padStart(6, '0')}`,
            invoiceNo: `INV-${new Date().getFullYear()}-${student.id.toString().padStart(4, '0')}`,
            month: student.feesGroup || globalMonth,
            months: [student.feesGroup || globalMonth],
            monthsCount: 1,
            feePerMonthUSD: student.cash || 12.5,
            amountUSD: student.cash || 12.5,
            amountKHR: (student.cash || 12.5) * settings.exchangeRate,
            paidBy: student.paidBy !== '$ -' ? student.paidBy : 'Cash',
            date: student.paymentDate || new Date().toISOString().slice(0, 10),
            recordedBy: currentUser.khmerName,
            status: 'paid',
          };

    setActiveInvoice({ student, receipt });
    setIsInvoiceModalOpen(true);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass || !newStudentName.trim()) return;

    addStudent(currentClass.classId, {
      name: newStudentName.trim(),
      latinName: newStudentLatin.trim(),
      gender: newStudentGender,
      note: newStudentNote,
      caseType: newStudentCase,
      feesGroup: newStudentFeesGroup,
      startDate: toSchoolDate(newStudentStartDate),
      paymentDate: toSchoolDate(newStudentPaymentDate),
      paidBy: newStudentPaidBy,
      cash: Number(newStudentCash) || 0,
    });

    // Reset Form
    setNewStudentName('');
    setNewStudentLatin('');
    setIsAddModalOpen(false);
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    addClass(newClassName.trim(), newClassPeriod.trim());
    setNewClassName('');
    setIsNewClassModalOpen(false);
  };

  if (!currentClass) {
    return <div className="p-8 text-center text-slate-500 font-khmer">មិនមានទិន្នន័យថ្នាក់រៀនទេ</div>;
  }

  const collectionRate = currentClass.targetCollectionRate;
  const totalCashCollected = currentClass.totalCollectedCash;

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner & Class Tab Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-700 font-khmer">
              <span>សាលា អ៊ីរ៉ែលកម្ពុជា · BIM Rangsei School</span>
              <span>·</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1">
                <span>🏢</span>
                <span>{currentBranch.nameKhmer}</span>
                <span className="font-mono text-[10px] bg-white/80 px-1 rounded border border-amber-200">
                  {currentBranch.code}
                </span>
              </span>
              <span>·</span>
              <span className="text-slate-500 font-mono">Academic Year {globalYear}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5 font-khmer">
              តារាងបង់ប្រាក់ថ្លៃសិក្សាសិស្ស ({currentClass.className})
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono mt-1">
              <span>កាលបរិច្ឆេទ (Period): {currentClass.period}</span>
              <span>·</span>
              <span className="font-khmer text-amber-700 font-bold">
                ខែទូទាត់សកម្ម៖ {globalMonth} {globalYear}
              </span>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Progress Rate Pill */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-right">
              <div className="text-[10px] text-slate-400 font-bold uppercase font-khmer">
                {t('អត្រាប្រមូលបាន', 'Collection Rate')}
              </div>
              <div className="text-xl font-bold font-mono text-emerald-700">
                {collectionRate}%
              </div>
            </div>

            {/* Collected Cash Pill */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-right">
              <div className="text-[10px] text-amber-800 font-bold uppercase font-khmer">
                {t('ទឹកប្រាក់ប្រមូលបាន', 'Total Cash')}
              </div>
              <div className="text-xl font-bold font-mono text-slate-900">
                ${totalCashCollected.toFixed(2)}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {onOpenOfficialRoster && (
                <button
                  onClick={onOpenOfficialRoster}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-xl border border-indigo-200 transition-colors text-xs font-bold font-khmer shadow-2xs"
                  title="បើកបញ្ជីនាមសិស្សតាមថ្នាក់ ជាទម្រង់ផ្លូវការ (MoEYS Official Class Roster)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="hidden sm:inline">{t('បញ្ជីនាមសិស្សផ្លូវការ', 'Official Roster')}</span>
                </button>
              )}

              {onPrintReport && (
                <button
                  onClick={onPrintReport}
                  className="p-2 sm:p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                  title="Print Official Document"
                >
                  <Printer className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => openInvoiceVerification()}
                className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 transition-colors text-xs font-bold font-khmer shadow-2xs cursor-pointer"
                title={t('ផ្ទៀងផ្ទាត់វិក្កយបត្រតាម QR Code', 'Verify Invoice via QR Code')}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">{t('ផ្ទៀងផ្ទាត់ QR', 'Verify Invoice')}</span>
              </button>

              {permissions.canEdit && (
                <button
                  type="button"
                  onClick={() => setIsPromoteModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold font-khmer shadow-2xs transition-all text-xs cursor-pointer"
                  title={t('ឡើងថ្នាក់សិស្សតាមថ្នាក់ (Promote Student by Class)', 'Promote Students by Class')}
                >
                  <GraduationCap className="w-4 h-4 shrink-0 text-white" />
                  <span className="hidden sm:inline">{t('ឡើងថ្នាក់សិស្ស', 'Promote Students')}</span>
                </button>
              )}

              {permissions.canEdit && (
                <button
                  type="button"
                  onClick={() => handleOpenStopModal()}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded-xl border border-rose-200 transition-colors text-xs font-bold font-khmer shadow-2xs cursor-pointer"
                  title={t('អាប់ដែតសិស្សឈប់រៀន / ផ្អាកការសិក្សា', 'Update Stopped / Dropped Students')}
                >
                  <UserX className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="hidden sm:inline">{t('អាប់ដែតសិស្សឈប់', 'Stopped Students')}</span>
                  {currentClass.students.filter((s) => s.feesGroup.toLowerCase().includes('stop')).length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-900 text-[10px] font-mono font-bold">
                      {currentClass.students.filter((s) => s.feesGroup.toLowerCase().includes('stop')).length}
                    </span>
                  )}
                </button>
              )}

              {permissions.canEdit && (
                <button
                  type="button"
                  onClick={() => setIsExcelImportModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs font-khmer transition-all shadow-xs cursor-pointer"
                  title={t('នាំចូលទិន្នន័យសិស្សពី Excel (Paste from Excel)', 'Import from Excel')}
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0 text-white" />
                  <span className="hidden sm:inline">{t('នាំចូលពី Excel', 'Import from Excel')}</span>
                </button>
              )}

              {permissions.canEdit && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs font-khmer transition-all shadow-xs cursor-pointer"
                  title={t('ចុះឈ្មោះសិស្សថ្មី', 'Enroll Student')}
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{t('ចុះឈ្មោះសិស្សថ្មី', 'Enroll Student')}</span>
                </button>
              )}

              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    setClearHistoryScope(selectedStudentIds.length > 0 ? 'selected' : 'current_class');
                    setClearHistoryConfirmText('');
                    setIsClearHistoryModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded-xl border border-rose-300 transition-colors text-xs font-bold font-khmer shadow-2xs cursor-pointer"
                  title="សម្អាតប្រវត្តិបង់ប្រាក់តាមជ្រើសរើស ឬ ទាំងអស់ (សិទ្ធិសម្រាប់តែ Admin)"
                >
                  <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="hidden sm:inline">{t('សម្អាតប្រវត្តិបង់ប្រាក់', 'Clear History')}</span>
                  {selectedStudentIds.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-900 text-[10px] font-mono font-bold">
                      {selectedStudentIds.length}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Class Selection Tabs Strip with Native Drag-and-Drop Reordering */}
        <div className="flex items-center justify-between border-t border-slate-100 mt-5 pt-4 gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 min-w-0 flex-1">
            {orderedClassList.length === 0 ? (
              <div className="py-1 px-3 text-xs text-slate-500 font-khmer flex items-center gap-2">
                <span>🏢 {t('មិនទាន់មានថ្នាក់រៀនសម្រាប់សាខានេះនៅឡើយទេ', 'No classes registered for this campus yet')}</span>
              </div>
            ) : (
              orderedClassList.map((cls, index) => {
                const isSelected = cls.classId === selectedClassId;
                const branchCode = branches.find((b) => b.id === (cls.branchId || 'branch-central'))?.code || 'BIM-01';
                return (
                  <button
                    key={cls.classId}
                    draggable={true}
                    onDragStart={(e) => {
                      setDraggedStripClassIndex(index);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedStripClassIndex === null || draggedStripClassIndex === index) return;
                      const currentList = orderedClassList.map((c) => c.classId);
                      const updated = [...currentList];
                      const [moved] = updated.splice(draggedStripClassIndex, 1);
                      updated.splice(index, 0, moved);
                      reorderClasses(updated);
                      setDraggedStripClassIndex(null);
                    }}
                    onClick={() => setSelectedClassId(cls.classId)}
                    className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-khmer transition-all whitespace-nowrap cursor-grab active:cursor-grabbing select-none ${
                      draggedStripClassIndex === index
                        ? 'opacity-40 border-dashed border border-amber-500 bg-amber-50'
                        : isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title={`${cls.className} [${branchCode}] (${cls.students.length} សិស្ស) - អូសដើម្បីប្តូរទីតាំង (Drag to reorder)`}
                  >
                    <GripVertical className={`w-3 h-3 transition-opacity ${isSelected ? 'text-slate-400' : 'text-slate-400 opacity-30 group-hover:opacity-100'}`} />
                    <span>{cls.className}</span>
                    {currentBranchId === 'all' && (
                      <span className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
                        isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {branchCode}
                      </span>
                    )}
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-200 text-slate-600'}`}>
                      {cls.students.length}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setManagerInitialTab('classes');
                setIsManagerModalOpen(true);
              }}
              className="text-xs text-indigo-700 hover:text-indigo-900 font-bold font-khmer whitespace-nowrap px-2.5 py-1.5 flex items-center gap-1.5 hover:bg-indigo-50 rounded-xl border border-indigo-200 transition-colors"
              title="បើកផ្ទាំងគ្រប់គ្រង កែប្រែ លុប ឬតម្រៀបថ្នាក់ & ខែ"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>រៀបចំថ្នាក់ & ខែ</span>
            </button>

            {permissions.canEdit && (
              <button
                onClick={() => setIsNewClassModalOpen(true)}
                className="text-xs text-amber-700 hover:text-amber-800 font-bold font-khmer whitespace-nowrap px-2 py-1 flex items-center gap-1"
              >
                <span>+ បន្ថែមថ្នាក់ថ្មី</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE FILTER STRIP (Filter for all!) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs w-full space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 font-khmer">
          <Filter className="w-3.5 h-3.5 text-amber-600" />
          <span>{t('តម្រងទិន្នន័យ & ស្វែងរក (Filter All)', 'Filter & Search Students')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* 1. Universal Search Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ស្វែងរកឈ្មោះ / កូដ', 'Search Name / Code')}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="search"
                placeholder="ឈ្មោះសិស្ស, BIM-..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* 2. Payment Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ស្ថានភាពបង់ប្រាក់', 'Payment Status')}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50"
            >
              <option value="all">{t('ទាំងអស់ (All Status)', 'All Status')}</option>
              <option value="paid">{t('បានបង់ (Paid)', 'Paid')}</option>
              <option value="unpaid">{t('មិនទាន់បង់ (Unpaid)', 'Unpaid')}</option>
              <option value="prepaid">{t('បង់ពីខែមុន (Prepaid)', 'Prepaid')}</option>
              <option value="stopped">{t('ឈប់រៀន (Stopped)', 'Stopped')}</option>
            </select>
          </div>

          {/* 3. Case Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ប្រភេទ Case', 'Case Type')}
            </label>
            <select
              value={filterCase}
              onChange={(e) => setFilterCase(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50"
            >
              <option value="all">{t('គ្រប់ Case (All Cases)', 'All Cases')}</option>
              <option value="full">Full (ទូទៅ 100%)</option>
              <option value="contribute">Contribute (ឧបត្ថម្ភ)</option>
              <option value="50%">50% (អាហារូបករណ៍)</option>
            </select>
          </div>

          {/* 4. Gender Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('ភេទ', 'Gender')}
            </label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50"
            >
              <option value="all">{t('ទាំងពីរ (Both)', 'All Genders')}</option>
              <option value="Man">{t('ប្រុស (Man)', 'Man')}</option>
              <option value="Female">{t('ស្រី (Female)', 'Female')}</option>
            </select>
          </div>

          {/* 5. Payment Method Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 font-khmer mb-1">
              {t('វិធីទូទាត់', 'Paid By Method')}
            </label>
            <select
              value={filterPaidBy}
              onChange={(e) => setFilterPaidBy(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50"
            >
              <option value="all">All Methods</option>
              <option value="ABA">ABA Bank</option>
              <option value="AC">ACLEDA (AC)</option>
              <option value="Cash">Cash (សាច់ប្រាក់)</option>
              <option value="$ -">$ - (Unpaid)</option>
            </select>
          </div>

          {/* 6. Active Month Picker */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold text-slate-500 font-khmer">
                {t('ខែសិក្សា', 'Study Month')}
              </label>
              <button
                type="button"
                onClick={() => {
                  setManagerInitialTab('months');
                  setIsManagerModalOpen(true);
                }}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-khmer font-bold flex items-center gap-0.5"
                title="កែប្រែ, លុប ឬតម្រៀបខែ"
              >
                <SlidersHorizontal className="w-2.5 h-2.5" />
                <span>រៀបចំខែ</span>
              </button>
            </div>
            <select
              value={globalMonth}
              onChange={(e) => setGlobalMonth(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50 font-bold"
            >
              {academicMonths.map((m) => (
                <option key={m} value={m}>
                  {m} ({MONTH_NAMES_KH[m] || m})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter results count pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-khmer">
              បង្ហាញសិស្សចំនួន <strong>{sortedStudents.length}</strong> នាក់ (ក្នុងចំណោមសរុប {currentClass.students.length} នាក់)
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
            {(searchQuery || filterStatus !== 'all' || filterCase !== 'all' || filterGender !== 'all' || filterPaidBy !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterCase('all');
                  setFilterGender('all');
                  setFilterPaidBy('all');
                }}
                className="text-amber-700 hover:text-amber-900 font-bold font-khmer cursor-pointer"
              >
                ✕ កំណត់តម្រងឡើងវិញ (Reset Filters)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Batch Action Bar for Selected Students (Admin Only) */}
      {currentUser.role === 'admin' && selectedStudentIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-300 rounded-xl shadow-xs">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white font-mono font-bold text-xs">
              {selectedStudentIds.length}
            </span>
            <span className="text-xs font-bold text-amber-950 font-khmer">
              បានជ្រើសរើសសិស្ស <strong>{selectedStudentIds.length}</strong> នាក់
            </span>
            <button
              type="button"
              onClick={() => setSelectedStudentIds([])}
              className="text-xs text-amber-800 hover:text-amber-950 underline font-khmer cursor-pointer ml-1"
            >
              ដោះការជ្រើសរើស (Deselect)
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setClearHistoryScope('selected');
                setClearHistoryConfirmText('');
                setIsClearHistoryModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold font-khmer transition-all shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>សម្អាតប្រវត្តិសិស្សដែលបានជ្រើស ({selectedStudentIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setClearHistoryScope('current_class');
                setClearHistoryConfirmText('');
                setIsClearHistoryModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-bold font-khmer transition-all shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>សម្អាតក្នុងថ្នាក់ {currentClass.className} ទាំងអស់</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setClearHistoryScope('all_classes');
                setClearHistoryConfirmText('');
                setIsClearHistoryModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-900 hover:bg-rose-950 text-white rounded-lg text-xs font-bold font-khmer transition-all shadow-xs cursor-pointer"
              title="សម្អាតប្រវត្តិបង់ប្រាក់សិស្សគ្រប់ថ្នាក់ទាំងអស់ក្នុងសាលាតែម្ដង"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
              <span>សម្អាតគ្រប់សិស្សទាំងអស់តែម្តង (All Classes)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Full-Width Student Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-amber-400 text-slate-900 font-bold border-b border-amber-500 select-none">
                {currentUser.role === 'admin' && (
                  <th className="py-2.5 px-2 border-r border-amber-500 text-center w-10 select-none">
                    <input
                      type="checkbox"
                      checked={sortedStudents.length > 0 && selectedStudentIds.length === sortedStudents.length}
                      onChange={() => {
                        if (selectedStudentIds.length === sortedStudents.length) {
                          setSelectedStudentIds([]);
                        } else {
                          setSelectedStudentIds(sortedStudents.map((s) => s.id));
                        }
                      }}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      title="ជ្រើសរើសសិស្សទាំងអស់ក្នុងតារាងនេះ"
                    />
                  </th>
                )}
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
                  onClick={() => handleSort('studentCode')}
                  className="py-2.5 px-3 border-r border-amber-500 text-center cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមកូដសិស្ស', 'Sort by Student Code')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>កូដសិស្ស</span>
                    {renderSortIndicator('studentCode')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-2.5 px-4 border-r border-amber-500 font-khmer min-w-[140px] cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមឈ្មោះសិស្ស', 'Sort by Student Name')}
                >
                  <div className="inline-flex items-center">
                    <span>ឈ្មោះសិស្ស</span>
                    {renderSortIndicator('name')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('gender')}
                  className="py-2.5 px-3 border-r border-amber-500 text-center cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមភេទ', 'Sort by Gender')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>ភេទ</span>
                    {renderSortIndicator('gender')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('note')}
                  className="py-2.5 px-3 border-r border-amber-500 text-center cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាម Note', 'Sort by Note')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>Note</span>
                    {renderSortIndicator('note')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('feesGroup')}
                  className="py-2.5 px-3 border-r border-amber-500 text-center cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមស្ថានភាពថ្លៃសិក្សា', 'Sort by Fees Status')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>Fees ({globalMonth})</span>
                    {renderSortIndicator('feesGroup')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('startDate')}
                  className="py-2.5 px-3 border-r border-amber-500 text-center cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមកាលបរិច្ឆេទចូលរៀន', 'Sort by Start Date')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>Start Date</span>
                    {renderSortIndicator('startDate')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('paymentDate')}
                  className="py-2.5 px-3 border-r border-amber-500 text-center cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមកាលបរិច្ឆេទបង់ប្រាក់', 'Sort by Payment Date')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>Payment Date</span>
                    {renderSortIndicator('paymentDate')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('caseType')}
                  className="py-2.5 px-3 border-r border-amber-500 text-center cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាម Case', 'Sort by Case')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>Case</span>
                    {renderSortIndicator('caseType')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('paidBy')}
                  className="py-2.5 px-3 border-r border-amber-500 text-center cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមវិធីទូទាត់', 'Sort by Payment Method')}
                >
                  <div className="inline-flex items-center justify-center">
                    <span>Paid by</span>
                    {renderSortIndicator('paidBy')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cash')}
                  className="py-2.5 px-4 border-r border-amber-500 text-right cursor-pointer hover:bg-amber-500/80 transition-colors group"
                  title={t('ចុចដើម្បីតម្រៀបតាមចំនួនទឹកប្រាក់ ($)', 'Sort by Cash Amount')}
                >
                  <div className="inline-flex items-center justify-end">
                    <span>Cash ($)</span>
                    {renderSortIndicator('cash')}
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center no-print">ប្រតិបត្តិការ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={currentUser.role === 'admin' ? 13 : 12} className="py-12 text-center text-slate-400 font-khmer text-xs">
                    មិនមានទិន្នន័យសិស្សត្រូវនឹងលក្ខខណ្ឌតម្រងខាងលើឡើយ
                  </td>
                </tr>
              ) : (
                sortedStudents.map((st, index) => {
                  const isPaid = st.cash > 0;
                  const isStopped = st.feesGroup.toLowerCase().includes('stop');
                  const isAlready = st.feesGroup.toLowerCase().includes('already');
                  const isSelected = selectedStudentIds.includes(st.id);

                  let rowBg = isSelected ? 'bg-amber-100/70' : 'hover:bg-amber-50/40';
                  if (!isSelected) {
                    if (isStopped) rowBg = 'bg-rose-50/50 hover:bg-rose-50';
                    else if (isAlready) rowBg = 'bg-blue-50/40 hover:bg-blue-50';
                  }

                  return (
                    <tr key={st.id} className={`${rowBg} transition-colors`}>
                      {currentUser.role === 'admin' && (
                        <td className="py-2.5 px-2 border-r border-slate-200 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedStudentIds((prev) =>
                                prev.includes(st.id) ? prev.filter((id) => id !== st.id) : [...prev, st.id]
                              );
                            }}
                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-medium text-slate-600">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-800">
                        <button
                          type="button"
                          onClick={() => handleOpenStudentDetails(st)}
                          className="hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                          title="មើលព័ត៌មានលម្អិត & ប្រវត្តិវិក្កយបត្រ (View Details & Invoices)"
                        >
                          {st.studentCode}
                        </button>
                      </td>
                      <td className="py-2.5 px-4 border-r border-slate-200 font-khmer font-bold text-slate-900">
                        <button
                          type="button"
                          onClick={() => handleOpenStudentDetails(st)}
                          className="text-left hover:text-blue-600 transition-colors cursor-pointer group"
                          title="មើលព័ត៌មានលម្អិត & ប្រវត្តិវិក្កយបត្រ (View Details & Invoices)"
                        >
                          <div className="group-hover:underline">{st.name}</div>
                          {st.latinName && (
                            <div className="text-[10px] text-slate-400 font-sans font-normal">{st.latinName}</div>
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.gender === 'Female'
                              ? 'bg-pink-100 text-pink-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {st.gender}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-medium text-slate-600">
                        {st.note}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-medium">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : isStopped
                              ? 'bg-rose-100 text-rose-800'
                              : isAlready
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {st.feesGroup}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-[11px] text-slate-600">
                        {st.startDate}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-[11px]">
                        <span className={!isPaid && !isAlready && !isStopped ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                          {st.paymentDate}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-semibold text-slate-800">
                        {st.caseType}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-xs font-bold text-slate-700">
                        {st.paidBy}
                      </td>
                      <td className="py-2.5 px-4 border-r border-slate-200 text-right font-mono font-bold tabular-nums">
                        <div className="flex flex-col items-end">
                          <span className={isPaid ? 'text-emerald-700 text-sm font-bold' : 'text-slate-400'}>
                            {st.cash > 0 ? `$ ${st.cash.toFixed(2)}` : '$ -'}
                          </span>
                          {st.feeHistory && st.feeHistory.length > 0 && st.feeHistory[0].monthsCount && st.feeHistory[0].monthsCount > 1 && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[9px] font-bold font-khmer">
                              {st.feeHistory[0].monthsCount} ខែ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenStudentDetails(st)}
                            title="ព័ត៌មានលម្អិត & ប្រវត្តិវិក្កយបត្រ (Student Details & Invoices Table)"
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 rounded-md hover:bg-indigo-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {permissions.canCollectFee && !isStopped && (
                            <button
                              onClick={() => handleOpenQuickPay(st)}
                              title={isPaid ? "បង់បន្ថែម / បង់ច្រើនខែ (Pay Advance / Multi-month)" : "បង់ប្រាក់ថ្លៃសិក្សា (Pay Tuition Fee)"}
                              className={`px-2.5 py-1 rounded-md font-bold text-[10px] flex items-center gap-1 shadow-2xs font-khmer transition-all ${
                                isPaid
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>{isPaid ? 'បង់បន្ត' : 'បង់ប្រាក់'}</span>
                            </button>
                          )}

                          {(isPaid || (st.feeHistory && st.feeHistory.length > 0)) && (
                            <button
                              onClick={() => handleOpenInvoice(st)}
                              title="មើល & បោះពុម្ពវិក្កយបត្រ (View & Print Invoice)"
                              className="px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[10px] flex items-center gap-1 font-khmer transition-all"
                            >
                              <Receipt className="w-3 h-3 text-indigo-600" />
                              <span>វិក្កយបត្រ</span>
                            </button>
                          )}

                          {permissions.canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenStopModal(st)}
                              title={isStopped ? "សិស្សចូលរៀនឡើងវិញ (Reactivate Student)" : "អាប់ដែតសិស្សឈប់ (Mark Student as Stopped)"}
                              className={`p-1.5 rounded-md transition-colors ${
                                isStopped
                                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                  : 'text-rose-600 hover:text-rose-800 hover:bg-rose-50'
                              }`}
                            >
                              {isStopped ? <RotateCcw className="w-3.5 h-3.5" /> : <UserMinus className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {permissions.canEdit && (
                            <button
                              onClick={() => handleOpenEdit(st)}
                              title="Edit student"
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {permissions.canDelete && (
                            <button
                              onClick={() => {
                                if (window.confirm(`តើអ្នកពិតជាចង់លុបសិស្ស "${st.name}" មែនទេ?`)) {
                                  deleteStudent(currentClass.classId, st.id);
                                }
                              }}
                              title="Delete student"
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
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
              <tr className="bg-amber-300 font-bold text-slate-900 border-t-2 border-amber-500">
                <td colSpan={10} className="py-2.5 px-4 text-right border-r border-amber-400 uppercase tracking-wide font-khmer">
                  {t('សរុបទឹកប្រាក់ប្រមូលបាន (Total Collected)', 'Total Collected')}:
                </td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-base border-r border-amber-400 text-slate-950 font-black">
                  $ {totalCashCollected.toFixed(2)}
                </td>
                <td className="no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Official Summary Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs w-full">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900 font-khmer">
              តារាងសង្ខេបលទ្ធផលប្រមូលថ្លៃសិក្សា (Official Fee Summary Breakdown)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {currentClass.className} · {globalMonth} {globalYear}
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-amber-400 text-slate-900 font-bold border-b border-amber-500">
                <th className="py-2.5 px-3 border-r border-amber-500 text-center w-12">ID</th>
                <th className="py-2.5 px-4 border-r border-amber-500 font-khmer">Case / ប្រភេទ</th>
                <th className="py-2.5 px-3 border-r border-amber-500 text-center">General</th>
                <th className="py-2.5 px-3 border-r border-amber-500 text-center">Contribute</th>
                <th className="py-2.5 px-3 border-r border-amber-500 text-center">50%</th>
                <th className="py-2.5 px-3 border-r border-amber-500 text-center">Total Students</th>
                <th className="py-2.5 px-4 text-right">Cash ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentClass.summaryRows.map((row) => {
                let textClass = 'text-slate-800';
                if (row.id === 2 || row.id === 4) textClass = 'text-rose-700 font-semibold';
                else if (row.id === 3) textClass = 'text-blue-700 font-semibold';
                else if (row.id === 5) textClass = 'text-emerald-700 font-semibold';

                return (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-medium text-slate-700">
                      {row.id}
                    </td>
                    <td className={`py-2 px-4 border-r border-slate-200 font-khmer font-semibold ${textClass}`}>
                      {row.caseKhmer}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono tabular-nums">
                      {row.general}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono tabular-nums">
                      {row.contribute}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono tabular-nums">
                      {row.fiftyPercent}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-bold tabular-nums">
                      {row.totalStudents}
                    </td>
                    <td className="py-2 px-4 text-right font-mono font-bold tabular-nums">
                      {row.totalCash > 0 ? `$ ${row.totalCash.toFixed(2)}` : '$ -'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-amber-300 font-bold text-slate-900 border-t-2 border-amber-500">
                <td colSpan={6} className="py-2 px-4 text-right border-r border-amber-400 uppercase tracking-wide font-khmer">
                  Grand Total Collected
                </td>
                <td className="py-2 px-4 text-right font-mono tabular-nums text-sm font-black">
                  $ {totalCashCollected.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MULTI-MONTH TUITION PAYMENT MODAL (1 INVOICE FOR MULTIPLE MONTHS) */}
      {isPayModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-xs my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base font-khmer">
                    {t('បង់ថ្លៃសិក្សា & ចេញវិក្កយបត្រ (Multi-Month Invoice)', 'Multi-Month Tuition Payment & Invoice')}
                  </h3>
                  <div className="text-[10px] text-slate-500 font-khmer">
                    អនុញ្ញាតឱ្យបង់ច្រើនខែក្នុងវិក្កយបត្រតែមួយ (Pay multiple months for 1 invoice)
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPay} className="mt-4 space-y-4">
              {/* Student Profile Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center font-khmer text-sm">
                    {selectedStudent.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 font-khmer text-sm">
                      {selectedStudent.name}
                      {selectedStudent.latinName && (
                        <span className="font-sans font-normal text-xs text-slate-500 ml-1.5">
                          ({selectedStudent.latinName})
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                      Code: <span className="font-bold text-slate-800">{selectedStudent.studentCode}</span> · ថ្នាក់: {currentClass.className}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold font-mono text-xs">
                    Case: {selectedStudent.caseType}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    (ស្តង់ដារ ${selectedStudent.caseType === 'Full' ? '12.50' : selectedStudent.caseType === '50%' ? '6.25' : '5.00'}/ខែ)
                  </span>
                </div>
              </div>

              {/* Quick Multi-Month Duration Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 font-bold font-khmer text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ជ្រើសរើសខែបង់ប្រាក់ (Select Months to Pay) *</span>
                  </label>
                  <span className="text-[10px] text-indigo-700 font-bold font-khmer bg-indigo-50 px-2 py-0.5 rounded-full">
                    បានជ្រើសរើស: {payMonths.length} ខែ
                  </span>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                  {[
                    { label: '១ ខែ (1 Month)', count: 1 },
                    { label: '២ ខែ (2 Months)', count: 2 },
                    { label: '៣ ខែ (ត្រីមាស)', count: 3 },
                    { label: '៦ ខែ (ឆមាស)', count: 6 },
                    { label: '១ ឆ្នាំ (10 Months)', count: 10 },
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.count}
                      onClick={() => handleSetQuickPresetMonths(preset.count)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-khmer font-bold border transition-all ${
                        payMonths.length === preset.count
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Interactive Month Chips Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {ACADEMIC_MONTHS.map((mStr) => {
                    const isSelected = payMonths.includes(mStr);
                    // Check if already paid in history
                    const isAlreadyPaid = selectedStudent.feeHistory?.some((rec) =>
                      rec.months?.includes(mStr) || rec.month === mStr
                    );

                    return (
                      <button
                        type="button"
                        key={mStr}
                        onClick={() => handleToggleMonth(mStr)}
                        className={`text-left p-2 rounded-lg border text-[11px] transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : isAlreadyPaid
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
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
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-200 text-emerald-950 font-khmer font-semibold shrink-0">
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
                      step="0.01"
                      min="0"
                      value={payMonthlyRate}
                      onChange={(e) => handleChangeMonthlyRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-bold text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                      ចំនួនខែសរុប (Months)
                    </label>
                    <div className="px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-bold text-xs bg-slate-100 text-indigo-900 flex items-center justify-between">
                      <span>{payMonths.length} ខែ</span>
                      <span className="text-[10px] text-slate-400 font-sans">× ${payMonthlyRate.toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                      បញ្ចុះតម្លៃ ($ Discount)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={payDiscount}
                      onChange={(e) => handleChangeDiscount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs bg-white text-rose-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Grand Total Highlight Box */}
                <div className="p-3 rounded-xl bg-indigo-900 text-white flex items-center justify-between shadow-sm">
                  <div>
                    <div className="text-[10px] text-indigo-200 font-khmer uppercase tracking-wider font-semibold">
                      ទឹកប្រាក់ត្រូវទូទាត់សរុប (1 Invoice Total)
                    </div>
                    <div className="text-xl sm:text-2xl font-mono font-black mt-0.5 tracking-tight text-amber-400">
                      ${payAmount.toFixed(2)} USD
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-indigo-200 font-mono">អត្រាប្តូរប្រាក់ 1$ = {settings.exchangeRate.toLocaleString()}៛</div>
                    <div className="text-sm sm:text-base font-mono font-extrabold text-white mt-0.5">
                      {Math.round(payAmount * settings.exchangeRate).toLocaleString()} ៛
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details: Invoice No, Method, Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    លេខវិក្កយបត្រ (Invoice No.) *
                  </label>
                  <input
                    type="text"
                    value={payInvoiceNo}
                    onChange={(e) => setPayInvoiceNo(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-bold text-xs bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    កាលបរិច្ឆេទបង់ប្រាក់ (Payment Date) *
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  វិធីទូទាត់ (Payment Method) *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['ABA', 'AC', 'Cash'] as const).map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setPayMethod(method)}
                      className={`py-2 px-2 rounded-lg font-bold text-xs border transition-all text-center ${
                        payMethod === method
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {method === 'AC' ? 'ACLEDA' : method === 'Cash' ? 'សាច់ប្រាក់' : method}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPayMethod('ABA')}
                    className="py-2 px-2 rounded-lg font-bold text-xs border border-slate-200 hover:bg-slate-50 text-slate-700 text-center"
                  >
                    Wing / ផ្សេងៗ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  កំណត់សម្គាល់លើវិក្កយបត្រ (Invoice Memo / Note)
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="ឧ. បង់ថ្លៃសិក្សា ៣ខែ (តុលា, វិច្ឆិកា, ធ្នូ)"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-white"
                />
              </div>

              {/* Telegram Alert Toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-sky-50 border border-sky-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendTelegramNotice}
                  onChange={(e) => setSendTelegramNotice(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-sky-950 font-khmer flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-600" />
                    <span>ផ្ញើការជូនដំណឹង Telegram Alert ភ្លាមៗ (Telegram Instant Notice)</span>
                  </div>
                  <div className="text-[10px] text-sky-700 font-khmer mt-0.5">
                    ជូនដំណឹងលេខវិក្កយបត្រ បញ្ជីខែបង់ ({payMonths.length} ខែ) និងទឹកប្រាក់សរុបទៅគ្រុប Telegram
                  </div>
                </div>
              </label>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold font-khmer shadow-sm flex items-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>បញ្ជាក់ការបង់ប្រាក់ & ចេញវិក្កយបត្រ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL MULTI-MONTH TUITION INVOICE / RECEIPT MODAL */}
      {isInvoiceModalOpen && activeInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header & Quick Actions */}
            <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm font-khmer">
                  {t('វិក្កយបត្រផ្លូវការ & បង្កាន់ដៃទទួលប្រាក់', 'Official Tuition Invoice & Receipt')}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  (#{activeInvoice.receipt.invoiceNo || activeInvoice.receipt.receiptNo})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('បោះពុម្ព (Print)', 'Print')}</span>
                </button>
                <button
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-900 bg-white" id="official-tuition-invoice">
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
                    វិក្កយបត្រ & បង្កាន់ដៃទទួលប្រាក់ថ្លៃសិក្សា
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    TUITION FEE OFFICIAL INVOICE & RECEIPT VOUCHER
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center">
                  <InvoiceQRCode
                    invoiceNo={activeInvoice.receipt.invoiceNo || activeInvoice.receipt.receiptNo}
                    studentCode={activeInvoice.student.studentCode}
                    studentName={activeInvoice.student.name}
                    amountUSD={activeInvoice.receipt.amountUSD}
                    amountKHR={activeInvoice.receipt.amountKHR}
                    paymentDate={activeInvoice.receipt.date}
                    paidBy={activeInvoice.receipt.paidBy}
                    status={activeInvoice.receipt.status}
                    className={currentClass.className}
                    academicYear={settings.academicYear}
                    size={95}
                    showDetails={true}
                    onVerifyClick={() =>
                      openInvoiceVerification(
                        activeInvoice.receipt.invoiceNo || activeInvoice.receipt.receiptNo,
                        activeInvoice.student.studentCode
                      )
                    }
                  />
                </div>
              </div>

              {/* Meta Details Box */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-khmer">
                <div>
                  <span className="text-slate-500 block text-[10px]">លេខវិក្កយបត្រ / Invoice No:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {activeInvoice.receipt.invoiceNo || activeInvoice.receipt.receiptNo}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">កាលបរិច្ឆេទ / Date:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {activeInvoice.receipt.date}
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
                    {activeInvoice.student.name}
                  </span>
                  {activeInvoice.student.latinName && (
                    <span className="block text-[10px] text-slate-500 font-sans">
                      {activeInvoice.student.latinName}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">អត្តលេខសិស្ស / Student Code:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeInvoice.student.studentCode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ថ្នាក់រៀន / Class:</span>
                  <span className="font-bold text-slate-900">
                    {currentClass.className}
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
                        បរិយាយ / ខែសិក្សា (Tuition Description / Month)
                      </th>
                      <th className="py-2 px-3 text-center border-r border-slate-300 w-24">ចំនួនខែ</th>
                      <th className="py-2 px-3 text-right border-r border-slate-300 w-28">តម្លៃ ១ខែ ($)</th>
                      <th className="py-2 px-3 text-right w-28">ទឹកប្រាក់ ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeInvoice.receipt.months && activeInvoice.receipt.months.length > 0 ? (
                      activeInvoice.receipt.months.map((m, idx) => {
                        const feeRate =
                          activeInvoice.receipt.feePerMonthUSD ||
                          (activeInvoice.receipt.amountUSD / (activeInvoice.receipt.months?.length || 1));
                        return (
                          <tr key={m} className="hover:bg-slate-50">
                            <td className="py-2 px-3 text-center font-mono text-slate-500 border-r border-slate-200">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 border-r border-slate-200 font-khmer">
                              <span className="font-bold text-slate-900">
                                ថ្លៃសិក្សា {getKhmerMonthName(m)}
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
                      })
                    ) : (
                      <tr>
                        <td className="py-2 px-3 text-center font-mono text-slate-500 border-r border-slate-200">
                          1
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 font-khmer font-bold text-slate-900">
                          ថ្លៃសិក្សា {activeInvoice.receipt.month}
                        </td>
                        <td className="py-2 px-3 text-center border-r border-slate-200 font-mono font-medium">
                          {activeInvoice.receipt.monthsCount || 1} ខែ
                        </td>
                        <td className="py-2 px-3 text-right font-mono border-r border-slate-200">
                          ${activeInvoice.receipt.amountUSD.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          ${activeInvoice.receipt.amountUSD.toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="border-t border-slate-300 bg-slate-50 text-xs">
                    <tr>
                      <td colSpan={4} className="py-2 px-3 text-right font-khmer font-bold text-slate-700 border-r border-slate-300">
                        សរុបរួម (Subtotal):
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        ${((activeInvoice.receipt.amountUSD || 0) + (activeInvoice.receipt.discountUSD || 0)).toFixed(2)}
                      </td>
                    </tr>
                    {(activeInvoice.receipt.discountUSD ?? 0) > 0 ? (
                      <tr>
                        <td colSpan={4} className="py-1.5 px-3 text-right font-khmer font-bold text-rose-700 border-r border-slate-300">
                          បញ្ចុះតម្លៃពិសេស (Discount):
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-700">
                          -${(activeInvoice.receipt.discountUSD || 0).toFixed(2)}
                        </td>
                      </tr>
                    ) : null}
                    <tr className="bg-amber-100 font-black text-slate-950 border-t border-amber-300">
                      <td colSpan={4} className="py-2.5 px-3 text-right font-khmer font-black text-slate-950 border-r border-amber-300 text-sm">
                        ទឹកប្រាក់ត្រូវទូទាត់សរុប (Grand Total USD):
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-base text-slate-950">
                        ${activeInvoice.receipt.amountUSD.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="bg-amber-50 font-bold text-slate-900 border-t border-amber-200">
                      <td colSpan={4} className="py-2 px-3 text-right font-khmer text-slate-700 border-r border-amber-200">
                        គិតជាប្រាក់រៀល (Total in KHR @ {settings.exchangeRate.toLocaleString()}៛):
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-900">
                        {activeInvoice.receipt.amountKHR.toLocaleString()} ៛
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
                    {activeInvoice.receipt.paidBy}
                  </span>
                </div>
                {activeInvoice.receipt.note && (
                  <div className="text-slate-600">
                    <span className="text-slate-500">សម្គាល់: </span>
                    <span>{activeInvoice.receipt.note}</span>
                  </div>
                )}
                <div className="text-slate-500 text-[11px]">
                  អ្នកចេញវិក្កយបត្រ៖ <span className="font-bold text-slate-800">{activeInvoice.receipt.recordedBy || currentUser.khmerName}</span>
                </div>
              </div>

              {/* Signatures Block */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-xs text-center font-khmer">
                <div className="space-y-12">
                  <div className="font-bold text-slate-800">ហត្ថលេខាអ្នកបង់ប្រាក់ (Payer Signature)</div>
                  <div className="text-slate-400 font-mono">...................................</div>
                </div>
                <div className="space-y-12">
                  <div className="font-bold text-slate-800">ហត្ថលេខា & ត្រាបេឡាធិការ (Cashier Stamp)</div>
                  <div className="font-bold text-slate-900">
                    {activeInvoice.receipt.recordedBy || currentUser.khmerName}
                  </div>
                </div>
              </div>

              {/* Official Seal Footnote */}
              <div className="pt-4 text-center text-[10px] text-slate-400 font-khmer border-t border-slate-100">
                វិក្កយបត្រនេះត្រូវបានបង្កើតឡើងដោយប្រព័ន្ធស្វ័យប្រវត្តិនៃ {settings.schoolNameKhmer}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / ENROLL STUDENT MODAL (Correct input types) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base font-khmer">
                {t('ចុះឈ្មោះសិស្សថ្មី', 'Enroll New Student')} ({currentClass.className})
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">ឈ្មោះសិស្ស (Khmer) *</label>
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="ឧ. សុខ ចាន់ថា"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Latin Name</label>
                  <input
                    type="text"
                    value={newStudentLatin}
                    onChange={(e) => setNewStudentLatin(e.target.value)}
                    placeholder="Sok Chantha"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">ភេទ *</label>
                  <select
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Man">ប្រុស (Man)</option>
                    <option value="Female">ស្រី (Female)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Note *</label>
                  <select
                    value={newStudentNote}
                    onChange={(e) => setNewStudentNote(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="New">New (សិស្សថ្មី)</option>
                    <option value="Old">Old (សិស្សចាស់)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Case *</label>
                  <select
                    value={newStudentCase}
                    onChange={(e) => setNewStudentCase(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Full">Full (100%)</option>
                    <option value="Contribute">Contribute</option>
                    <option value="50%">50%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">ថ្ងៃចូលរៀន (Start Date)</label>
                  <input
                    type="date"
                    value={newStudentStartDate}
                    onChange={(e) => setNewStudentStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">ថ្ងៃបង់ប្រាក់ (Payment Date)</label>
                  <input
                    type="date"
                    value={newStudentPaymentDate}
                    onChange={(e) => setNewStudentPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Paid By</label>
                  <select
                    value={newStudentPaidBy}
                    onChange={(e) => setNewStudentPaidBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  >
                    <option value="ABA">ABA</option>
                    <option value="AC">AC (ACLEDA)</option>
                    <option value="Cash">Cash</option>
                    <option value="$ -">$ - (Unpaid)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cash ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={newStudentCash}
                    onChange={(e) => setNewStudentCash(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold font-khmer"
                >
                  រក្សាទុកសិស្សថ្មី
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {isEditModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base font-khmer">
                {t('កែប្រែព័ត៌មានសិស្ស', 'Edit Student')} ({selectedStudent.studentCode})
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">ឈ្មោះសិស្ស *</label>
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Latin Name</label>
                  <input
                    type="text"
                    value={newStudentLatin}
                    onChange={(e) => setNewStudentLatin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Gender</label>
                  <select
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Man">Man</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Note</label>
                  <select
                    value={newStudentNote}
                    onChange={(e) => setNewStudentNote(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Old">Old</option>
                    <option value="New">New</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Case</label>
                  <select
                    value={newStudentCase}
                    onChange={(e) => setNewStudentCase(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Full">Full</option>
                    <option value="Contribute">Contribute</option>
                    <option value="50%">50%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">ថ្ងៃចូលរៀន</label>
                  <input
                    type="date"
                    value={newStudentStartDate}
                    onChange={(e) => setNewStudentStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    ស្ថានភាព / ក្រុម (Status / Group)
                  </label>
                  <select
                    value={newStudentFeesGroup}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewStudentFeesGroup(val);
                      if (val.toLowerCase().includes('stop')) {
                        setNewStudentCash(0);
                        setNewStudentPaidBy('$ -');
                        if (!newStudentPaymentDate || newStudentPaymentDate.includes('-202')) {
                          setNewStudentPaymentDate('ឈប់រៀន');
                        }
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg font-khmer font-bold ${
                      newStudentFeesGroup.toLowerCase().includes('stop')
                        ? 'border-rose-300 bg-rose-50 text-rose-800'
                        : 'border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    <option value={globalMonth}>{globalMonth} (សកម្ម / កំពុងរៀន)</option>
                    <option value="Stopped">Stopped (សិស្សឈប់រៀន / ប្តូរថ្នាក់)</option>
                    <option value="Already">Already (បានបង់ពីខែមុនរួច)</option>
                    <option value="Unpaid">Unpaid (មិនទាន់បង់)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                    {newStudentFeesGroup.toLowerCase().includes('stop') ? 'មូលហេតុឈប់ / ផ្អាក' : 'ថ្ងៃបង់ប្រាក់'}
                  </label>
                  {newStudentFeesGroup.toLowerCase().includes('stop') ? (
                    <input
                      type="text"
                      placeholder="ឧ. ឈប់រៀន ឬ ប្ដូរទៅថ្នាក់ទី១ក"
                      value={newStudentPaymentDate}
                      onChange={(e) => setNewStudentPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 border border-rose-300 bg-rose-50 rounded-lg font-khmer font-semibold text-xs"
                    />
                  ) : (
                    <input
                      type="date"
                      value={newStudentPaymentDate}
                      onChange={(e) => setNewStudentPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Paid By</label>
                  <select
                    value={newStudentPaidBy}
                    onChange={(e) => setNewStudentPaidBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  >
                    <option value="ABA">ABA</option>
                    <option value="AC">AC</option>
                    <option value="Cash">Cash</option>
                    <option value="$ -">$ -</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cash ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    value={newStudentCash}
                    onChange={(e) => setNewStudentCash(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold font-khmer"
                >
                  រក្សាទុកការកែប្រែ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW CLASS MODAL */}
      {isNewClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base font-khmer">
                {t('បង្កើតថ្នាក់រៀនថ្មី', 'Create New Class')}
              </h3>
              <button onClick={() => setIsNewClassModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">ឈ្មោះថ្នាក់រៀន *</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="ឧ. ថ្នាក់ទី ២A (Grade 2A)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Period (កាលបរិច្ឆេទសិក្សា)</label>
                <input
                  type="text"
                  value={newClassPeriod}
                  onChange={(e) => setNewClassPeriod(e.target.value)}
                  placeholder="01.10.2026 _ 31.10.2026"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewClassModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold font-khmer"
                >
                  បង្កើតថ្នាក់
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* STUDENT DETAILS & INVOICE HISTORY TABLE MODAL */}
      {isDetailsModalOpen && selectedStudentForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-xs my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 p-0.5 shadow-2xs">
                  <div className="w-full h-full rounded-[10px] bg-slate-900 text-amber-300 font-extrabold text-xl font-khmer flex items-center justify-center">
                    {selectedStudentForDetails.name.slice(0, 1)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base font-khmer">
                      {selectedStudentForDetails.name}
                    </h3>
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {selectedStudentForDetails.studentCode}
                    </span>
                    {selectedStudentForDetails.latinName && (
                      <span className="font-mono text-xs text-slate-500 font-sans">
                        ({selectedStudentForDetails.latinName})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-khmer mt-0.5 flex items-center gap-3 flex-wrap">
                    <span>ថ្នាក់៖ <strong className="text-slate-800">{currentClass.className}</strong></span>
                    <span>ភេទ៖ <strong className="text-slate-800">{selectedStudentForDetails.gender}</strong></span>
                    <span>អាណាព្យាបាល៖ <strong className="text-slate-800">{selectedStudentForDetails.guardianName || 'N/A'}</strong> ({selectedStudentForDetails.phone || 'N/A'})</span>
                    <span>ប្រភេទ៖ <strong className="text-slate-800">{selectedStudentForDetails.caseType}</strong></span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedStudentForDetails(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comprehensive Table Component */}
            <StudentInvoiceHistoryTable
              student={selectedStudentForDetails}
              className={currentClass.className}
              showTitle={true}
              onOpenQuickPay={() => {
                const s = selectedStudentForDetails;
                setIsDetailsModalOpen(false);
                handleOpenQuickPay(s);
              }}
            />
          </div>
        </div>
      )}

      {/* STOP / REACTIVATE STUDENT MODAL */}
      {isStopModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-2xs">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-khmer">
                    {t('អាប់ដែតស្ថានភាពសិស្សឈប់ / ចូលរៀនវិញ', 'Update Student Stopped / Active Status')}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-khmer">
                    ថ្នាក់រៀន៖ <span className="font-bold text-slate-800">{currentClass.className}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsStopModalOpen(false);
                  setStopStudentId(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmStopAction} className="mt-4 space-y-4 font-khmer">
              {/* Student Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ជ្រើសរើសសិស្ស (Select Student) *
                </label>
                <select
                  value={stopStudentId || ''}
                  onChange={(e) => {
                    const sid = Number(e.target.value);
                    setStopStudentId(sid);
                    const found = currentClass.students.find((s) => s.id === sid);
                    if (found) {
                      const isSt = found.feesGroup.toLowerCase().includes('stop');
                      setStopActionType(isSt ? 'reactivate' : 'stop');
                      if (found.paymentDate && !found.paymentDate.includes('-202')) {
                        setStopReason(found.paymentDate);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-khmer font-bold text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  required
                >
                  {currentClass.students.map((st) => {
                    const isSt = st.feesGroup.toLowerCase().includes('stop');
                    return (
                      <option key={st.id} value={st.id}>
                        {st.name} {st.latinName ? `(${st.latinName})` : ''} · {st.studentCode} · {isSt ? '【ឈប់រៀន - Stopped】' : `【កំពុងរៀន - ${st.feesGroup}】`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Action Type Toggle */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  សកម្មភាពប្រតិបត្តិការ (Action) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStopActionType('stop')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      stopActionType === 'stop'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <UserMinus className="w-4 h-4" />
                    <span>សិស្សឈប់រៀន (Mark Stopped)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStopActionType('reactivate')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      stopActionType === 'reactivate'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>ចូលរៀនឡើងវិញ (Reactivate)</span>
                  </button>
                </div>
              </div>

              {stopActionType === 'stop' ? (
                <>
                  {/* Preset Reasons */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      មូលហេតុឈប់ ឬ ប្តូរថ្នាក់ (Reason / Note) *
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      {[
                        'ឈប់រៀន',
                        'ប្ដូរទៅថ្នាក់ទី១ក',
                        'ប្ដូរទៅថ្នាក់ទី២ក',
                        'ប្ដូរទៅសាលាផ្សេង',
                        'ផ្លាស់ប្តូរទីលំនៅ',
                        'ព្យួរការសិក្សា',
                      ].map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => {
                            setStopReason(preset);
                            setStopCustomNote('');
                          }}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] text-left transition-all ${
                            stopReason === preset && !stopCustomNote
                              ? 'bg-rose-50 text-rose-900 border-rose-300 font-bold'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="ឬសរសេរមូលហេតុផ្សេងៗនៅទីនេះ (Custom reason/note)..."
                      value={stopCustomNote}
                      onChange={(e) => setStopCustomNote(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-khmer text-xs focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  {/* Effective Date */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      កាលបរិច្ឆេទឈប់រៀន (Stop Date) *
                    </label>
                    <input
                      type="date"
                      value={stopDate}
                      onChange={(e) => setStopDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs"
                      required
                    />
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                    ℹ️ នៅពេលកំណត់ជា <strong className="text-rose-700">សិស្សឈប់រៀន</strong> ប្រព័ន្ធនឹងរាប់សិស្សនេះចូលក្នុងជួរទី ២ នៃតារាងសង្ខេប (សិស្សឈប់រៀនក្នុងខែ) ដោយស្វ័យប្រវត្តិ។
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      កាលបរិច្ឆេទចូលរៀនឡើងវិញ (Resumption Date) *
                    </label>
                    <input
                      type="date"
                      value={stopDate}
                      onChange={(e) => setStopDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs"
                      required
                    />
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 leading-relaxed">
                    ℹ️ សិស្សនឹងត្រូវបានកំណត់ជាសកម្មក្នុងខែ <strong className="text-emerald-800">{globalMonth} {globalYear}</strong> ឡើងវិញ ហើយអាចកត់ត្រាការបង់ប្រាក់ថ្លៃសិក្សាជាធម្មតា។
                  </div>
                </>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsStopModalOpen(false);
                    setStopStudentId(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl font-bold font-khmer shadow-xs transition-all ${
                    stopActionType === 'stop'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {stopActionType === 'stop' ? 'បញ្ជាក់សិស្សឈប់' : 'បញ្ជាក់ចូលរៀនវិញ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promotion Modal (ឡើងថ្នាក់សិស្សតាមថ្នាក់) */}
      <PromoteStudentsModal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        defaultSourceClassId={currentClass.classId}
      />

      {/* Class & Academic Month Drag-and-Drop Manager Modal */}
      <ClassMonthManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        initialTab={managerInitialTab}
      />

      {/* Excel Student Import Modal (នាំចូលសិស្សពី Excel ផ្គូផ្គងជួរឈរស្វ័យប្រវត្តិ) */}
      <ExcelStudentImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        defaultTargetClassId={currentClass.classId}
      />

      {/* Clear Payment History Modal (សម្អាតប្រវត្តិបង់ប្រាក់តាមជ្រើសរើស ឬ ទាំងអស់ - Admin Only) */}
      {isClearHistoryModalOpen && currentUser.role === 'admin' && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 font-khmer">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center font-bold shrink-0">
                  <RotateCcw className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">
                      {t('សម្អាតប្រវត្តិបង់ប្រាក់ថ្លៃសិក្សា', 'Clear Student Payment History')}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                      Admin Only
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t(
                      'សម្អាតប្រវត្តិវិក្កយបត្របង់ប្រាក់តាមជ្រើសរើស ឬទាំងអស់ក្នុងថ្នាក់/សាលា',
                      'Clear payment invoices by selection or for all students'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsClearHistoryModalOpen(false);
                  setClearHistoryConfirmText('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Selection */}
            <div className="py-4 space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                {t('ជ្រើសរើសវិសាលភាពនៃការសម្អាត (Clear Scope)', 'Select Scope to Clear')}:
              </label>

              <div className="space-y-2">
                {/* 1. Selected Students */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    clearHistoryScope === 'selected'
                      ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-400'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  } ${selectedStudentIds.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="clearScope"
                    value="selected"
                    disabled={selectedStudentIds.length === 0}
                    checked={clearHistoryScope === 'selected'}
                    onChange={() => setClearHistoryScope('selected')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>តាមសិស្សដែលបានជ្រើសរើស (Selected Students)</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-900 text-[10px] font-mono font-bold">
                        {selectedStudentIds.length} នាក់
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {selectedStudentIds.length > 0
                        ? `សម្អាតប្រវត្តិបង់ប្រាក់សម្រាប់តែសិស្ស ${selectedStudentIds.length} នាក់ដែលបាន Check ក្នុងថ្នាក់នេះ`
                        : 'មិនទាន់បាន Check ជ្រើសរើសសិស្សក្នុងតារាងនៅឡើយទេ'}
                    </div>
                  </div>
                </label>

                {/* 2. All Students in Current Class */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    clearHistoryScope === 'current_class'
                      ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-400'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearScope"
                    value="current_class"
                    checked={clearHistoryScope === 'current_class'}
                    onChange={() => setClearHistoryScope('current_class')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>សិស្សទាំងអស់ក្នុងថ្នាក់បច្ចុប្បន្ន ({currentClass.className})</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 text-[10px] font-mono font-bold">
                        {currentClass.students.length} នាក់
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      សម្អាតប្រវត្តិបង់ប្រាក់សិស្សទាំងអស់ក្នុងថ្នាក់ {currentClass.className}
                    </div>
                  </div>
                </label>

                {/* 3. All Students School-wide */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    clearHistoryScope === 'all_classes'
                      ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-400'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearScope"
                    value="all_classes"
                    checked={clearHistoryScope === 'all_classes'}
                    onChange={() => setClearHistoryScope('all_classes')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="text-rose-700 font-extrabold">គ្រប់សិស្សទាំងអស់តែម្តងទូទាំងសាលា (All Classes)</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold">
                        {totalSchoolStudents} នាក់
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      សម្អាតប្រវត្តិបង់ប្រាក់គ្រប់សិស្សទាំងអស់ក្នុង {Object.keys(classData).length} ថ្នាក់ក្នុងសាលាតែម្ដង
                    </div>
                  </div>
                </label>
              </div>

              {/* Reset Active Month Fee Option */}
              <div className="pt-2">
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={clearHistoryResetActiveStatus}
                    onChange={(e) => setClearHistoryResetActiveStatus(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                  />
                  <span className="text-slate-800 font-bold">
                    កំណត់ស្ថានភាពបង់ខែបច្ចុប្បន្នឡើងវិញជា «មិនទាន់បង់ (Unpaid)» និង Cash: $0
                  </span>
                </label>
              </div>

              {/* Informational Warning */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <span>ℹ️ ការពារទិន្នន័យសិស្ស៖</span>
                </div>
                <div>
                  ប្រព័ន្ធនឹងសម្អាតតែប្រវត្តិវិក្កយបត្រ និងទិន្នន័យប្រាក់បង់ប៉ុណ្ណោះ។ ឈ្មោះសិស្ស ព័ត៌មានចុះឈ្មោះ ថ្នាក់រៀន និងការកំណត់សាលាត្រូវបានរក្សាទុកដដែល ១០០%។
                </div>
              </div>

              {/* Safety Confirmation Input for All Classes */}
              {clearHistoryScope === 'all_classes' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-rose-900">
                    ដើម្បីបញ្ជាក់ការសម្អាតគ្រប់សិស្សទាំងអស់ទូទាំងសាលាតែម្ដង សូមវាយពាក្យ <span className="underline font-mono">CLEAR</span> ឬ <span className="underline">សម្អាត</span>៖
                  </label>
                  <input
                    type="text"
                    value={clearHistoryConfirmText}
                    onChange={(e) => setClearHistoryConfirmText(e.target.value)}
                    placeholder="វាយពាក្យ CLEAR ដើម្បីបញ្ជាក់..."
                    className="w-full px-3 py-2 border border-rose-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsClearHistoryModalOpen(false);
                  setClearHistoryConfirmText('');
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {t('បោះបង់', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={
                  (clearHistoryScope === 'selected' && selectedStudentIds.length === 0) ||
                  (clearHistoryScope === 'all_classes' &&
                    clearHistoryConfirmText.trim().toUpperCase() !== 'CLEAR' &&
                    clearHistoryConfirmText.trim() !== 'សម្អាត')
                }
                onClick={() => {
                  if (clearHistoryScope === 'selected') {
                    if (selectedStudentIds.length === 0) {
                      alert(t('សូមជ្រើសរើសសិស្សយ៉ាងហោចណាស់ម្នាក់!', 'Please select at least one student!'));
                      return;
                    }
                    const res = clearStudentsPaymentHistory(currentClass.classId, selectedStudentIds, clearHistoryResetActiveStatus);
                    setSelectedStudentIds([]);
                    alert(t(
                      `បានសម្អាតប្រវត្តិបង់ប្រាក់សិស្សចំនួន ${res.clearedCount} នាក់ដោយជោគជ័យ!`,
                      `Successfully cleared payment history for ${res.clearedCount} students!`
                    ));
                  } else if (clearHistoryScope === 'current_class') {
                    const studentIdsInClass = currentClass.students.map((s) => s.id);
                    const res = clearStudentsPaymentHistory(currentClass.classId, studentIdsInClass, clearHistoryResetActiveStatus);
                    setSelectedStudentIds([]);
                    alert(t(
                      `បានសម្អាតប្រវត្តិបង់ប្រាក់សិស្សក្នុងថ្នាក់ ${currentClass.className} ចំនួន ${res.clearedCount} នាក់ដោយជោគជ័យ!`,
                      `Successfully cleared payment history for ${res.clearedCount} students in ${currentClass.className}!`
                    ));
                  } else if (clearHistoryScope === 'all_classes') {
                    const res = clearAllPaymentHistory('all', clearHistoryResetActiveStatus);
                    setSelectedStudentIds([]);
                    alert(t(
                      `បានសម្អាតប្រវត្តិបង់ប្រាក់គ្រប់សិស្សទាំងអស់ទូទាំងសាលា ចំនួន ${res.clearedCount} នាក់ដោយជោគជ័យ!`,
                      `Successfully cleared payment history for all ${res.clearedCount} students school-wide!`
                    ));
                  }

                  setIsClearHistoryModalOpen(false);
                  setClearHistoryConfirmText('');
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>
                  {clearHistoryScope === 'all_classes'
                    ? 'បញ្ជាក់សម្អាតគ្រប់សិស្សទាំងអស់'
                    : clearHistoryScope === 'current_class'
                    ? `សម្អាតក្នុងថ្នាក់ ${currentClass.className}`
                    : `សម្អាតដែលបានជ្រើស (${selectedStudentIds.length})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
