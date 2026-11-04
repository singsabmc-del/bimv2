import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StudentFeeRecord, StudentFeePaymentItem } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Printer,
  X,
  CreditCard,
  Calendar,
  User,
  GraduationCap,
  Building,
  Receipt,
  QrCode,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Camera,
  Upload,
} from 'lucide-react';
import { InvoiceQRCode } from './InvoiceQRCode';

interface InvoiceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInvoiceNo?: string;
  initialStudentCode?: string;
  onReprint?: (receipt: StudentFeePaymentItem, student: StudentFeeRecord) => void;
}

export interface VerificationResult {
  isValid: boolean;
  isPaid: boolean;
  status: 'paid' | 'pending' | 'unpaid' | 'not_found';
  invoiceNo: string;
  receiptNo: string;
  date: string;
  amountUSD: number;
  amountKHR: number;
  paidBy: string;
  recordedBy: string;
  monthsCovered: string[];
  description: string;
  student: StudentFeeRecord | null;
  className: string;
  itemType: 'tuition' | 'bus' | 'materials' | 'uniform';
  securityToken: string;
  verifiedAt: string;
}

export const InvoiceVerificationModal: React.FC<InvoiceVerificationModalProps> = ({
  isOpen,
  onClose,
  initialInvoiceNo = '',
  initialStudentCode = '',
  onReprint,
}) => {
  const { classData, settings, currentUser, busPayments, uniformSalesHistory, materialSalesHistory, t } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>(initialInvoiceNo || initialStudentCode || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Update query when initial props change
  useEffect(() => {
    if (initialInvoiceNo) {
      setSearchQuery(initialInvoiceNo);
    } else if (initialStudentCode) {
      setSearchQuery(initialStudentCode);
    }
  }, [initialInvoiceNo, initialStudentCode]);

  // Search across the live database for matching invoice or student
  const verificationResult = useMemo<VerificationResult | null>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    // 1. Search in student tuition feeHistory & active payment
    for (const [classId, cls] of Object.entries(classData)) {
      for (const st of cls.students || []) {
        // Check feeHistory array
        if (st.feeHistory && st.feeHistory.length > 0) {
          for (const item of st.feeHistory) {
            const invNo = (item.invoiceNo || '').toLowerCase();
            const recNo = (item.receiptNo || '').toLowerCase();
            const stCode = (st.studentCode || '').toLowerCase();
            const stName = (st.name || '').toLowerCase();
            const stLatin = (st.latinName || '').toLowerCase();

            if (
              invNo.includes(q) ||
              recNo.includes(q) ||
              stCode === q ||
              stName.includes(q) ||
              stLatin.includes(q)
            ) {
              const isPaid = item.status === 'paid' || item.amountUSD > 0;
              return {
                isValid: true,
                isPaid,
                status: isPaid ? 'paid' : 'pending',
                invoiceNo: item.invoiceNo || item.receiptNo || 'INV-2026-0000',
                receiptNo: item.receiptNo || item.invoiceNo || 'REC-0000',
                date: item.date || st.paymentDate || new Date().toISOString().slice(0, 10),
                amountUSD: item.amountUSD || st.cash || 0,
                amountKHR: item.amountKHR || Math.round((item.amountUSD || st.cash || 0) * settings.exchangeRate),
                paidBy: item.paidBy || st.paidBy || 'Cash',
                recordedBy: item.recordedBy || settings.accountantName || 'ប្រាជ្ញ ស៊ីដា',
                monthsCovered: item.months || [item.month || st.feesGroup || 'October 2026'],
                description: item.description || `ថ្លៃសិក្សាប្រចាំ ${item.month || st.feesGroup || 'ខែតុលា'}`,
                student: st,
                className: cls.className,
                itemType: 'tuition',
                securityToken: `SEC-${Math.abs(hashCode(`${item.receiptNo}-${st.studentCode}`)).toString(16).toUpperCase().padStart(8, '0')}`,
                verifiedAt: new Date().toLocaleString('km-KH'),
              };
            }
          }
        }

        // Check student's current active cash/feesGroup
        const stCode = (st.studentCode || '').toLowerCase();
        const stName = (st.name || '').toLowerCase();
        const stLatin = (st.latinName || '').toLowerCase();
        if (stCode === q || stName.includes(q) || stLatin.includes(q)) {
          const isPaid = st.cash > 0 && !st.feesGroup.toLowerCase().includes('stop');
          return {
            isValid: true,
            isPaid,
            status: isPaid ? 'paid' : 'unpaid',
            invoiceNo: `INV-2026-${st.id.toString().padStart(5, '0')}`,
            receiptNo: `REC-2026-10-${st.id.toString().padStart(3, '0')}`,
            date: st.paymentDate || new Date().toISOString().slice(0, 10),
            amountUSD: st.cash || 0,
            amountKHR: Math.round((st.cash || 0) * settings.exchangeRate),
            paidBy: st.paidBy !== '$ -' ? st.paidBy : 'Unpaid',
            recordedBy: settings.accountantName || 'ប្រាជ្ញ ស៊ីដា',
            monthsCovered: [st.feesGroup || 'October 2026'],
            description: `ថ្លៃសិក្សាប្រចាំ ${st.feesGroup || 'ខែតុលា'}`,
            student: st,
            className: cls.className,
            itemType: 'tuition',
            securityToken: `SEC-${Math.abs(hashCode(`STU-${st.id}-${st.studentCode}`)).toString(16).toUpperCase().padStart(8, '0')}`,
            verifiedAt: new Date().toLocaleString('km-KH'),
          };
        }
      }
    }

    // 2. Search in School Bus Payments
    for (const busPay of busPayments || []) {
      const invNo = (busPay.invoiceNo || '').toLowerCase();
      const recNo = (busPay.receiptNo || '').toLowerCase();
      const stName = (busPay.studentName || '').toLowerCase();
      const stCode = (busPay.studentCode || '').toLowerCase();

      if (invNo.includes(q) || recNo.includes(q) || stName.includes(q) || stCode === q) {
        // Find matching student
        let matchedStudent: StudentFeeRecord | null = null;
        let matchedClass = 'ថ្នាក់សាលា';
        for (const [cid, cls] of Object.entries(classData)) {
          const found = cls.students.find((s) => s.id === busPay.studentId || s.name === busPay.studentName);
          if (found) {
            matchedStudent = found;
            matchedClass = cls.className;
            break;
          }
        }

        return {
          isValid: true,
          isPaid: true,
          status: 'paid',
          invoiceNo: busPay.invoiceNo || busPay.receiptNo,
          receiptNo: busPay.receiptNo,
          date: busPay.paymentDate,
          amountUSD: busPay.amountUSD,
          amountKHR: busPay.amountKHR,
          paidBy: busPay.paidBy,
          recordedBy: busPay.recordedBy,
          monthsCovered: busPay.months || [busPay.month],
          description: `ថ្លៃរថយន្តសាលា (${busPay.routeName})`,
          student: matchedStudent,
          className: matchedClass,
          itemType: 'bus',
          securityToken: `SEC-${Math.abs(hashCode(`BUS-${busPay.receiptNo}`)).toString(16).toUpperCase().padStart(8, '0')}`,
          verifiedAt: new Date().toLocaleString('km-KH'),
        };
      }
    }

    // 3. Search in Uniform Sales History
    for (const u of uniformSalesHistory || []) {
      const recNo = (u.receiptNo || '').toLowerCase();
      const buyer = (u.buyerName || '').toLowerCase();
      if (recNo.includes(q) || buyer.includes(q)) {
        const amountKHR = u.totalAmountKHR || 0;
        const amountUSD = Number((amountKHR / settings.exchangeRate).toFixed(2));
        return {
          isValid: true,
          isPaid: true,
          status: 'paid',
          invoiceNo: u.receiptNo,
          receiptNo: u.receiptNo,
          date: u.date,
          amountUSD,
          amountKHR,
          paidBy: u.paymentMethod || 'Cash',
          recordedBy: u.recordedBy || 'គណនេយ្យករ',
          monthsCovered: ['ទិញឯកសណ្ឋាន'],
          description: `ទិញឯកសណ្ឋាន ${u.typeNameKhmer || u.type} (ទំហំ ${u.size}) x${u.quantity}`,
          student: null,
          className: u.classId || 'ទូទៅ',
          itemType: 'uniform',
          securityToken: `SEC-${Math.abs(hashCode(`UNI-${u.receiptNo}`)).toString(16).toUpperCase().padStart(8, '0')}`,
          verifiedAt: new Date().toLocaleString('km-KH'),
        };
      }
    }

    // If query was typed but no record matches
    return {
      isValid: false,
      isPaid: false,
      status: 'not_found',
      invoiceNo: searchQuery,
      receiptNo: searchQuery,
      date: new Date().toISOString().slice(0, 10),
      amountUSD: 0,
      amountKHR: 0,
      paidBy: '-',
      recordedBy: '-',
      monthsCovered: [],
      description: 'មិនមានកំណត់ត្រាក្នុងទិន្នន័យសាលាទេ',
      student: null,
      className: '-',
      itemType: 'tuition',
      securityToken: 'INVALID-TOKEN',
      verifiedAt: new Date().toLocaleString('km-KH'),
    };
  }, [searchQuery, classData, busPayments, uniformSalesHistory, settings]);

  if (!isOpen) return null;

  const handleCopyToken = () => {
    if (verificationResult?.securityToken) {
      navigator.clipboard.writeText(verificationResult.securityToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 text-xs my-auto overflow-hidden font-khmer">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-sm">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-khmer">
                {t('ផ្ទៀងផ្ទាត់វិក្កយបត្រ & ស្ថានភាពបង់ប្រាក់សិស្ស', 'Invoice & Payment Status Verification')}
              </h3>
              <p className="text-[11px] text-slate-400 font-khmer">
                ប្រព័ន្ធផ្ទៀងផ្ទាត់ QR Code ផ្លូវការសម្រាប់បុគ្គលិក និងគណៈគ្រប់គ្រងសាលា
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Lookup Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            ស្វែងរក ឬស្កេនលេខវិក្កយបត្រ / អត្តលេខសិស្ស (Invoice No or Student Code)៖
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ឧ. INV-2026-00001 ឬ REC-2026-10-001 ឬ STU-0001..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Demo Pickers */}
            <button
              type="button"
              onClick={() => {
                const firstCls = Object.values(classData)[0];
                const firstSt = firstCls?.students?.[0];
                if (firstSt) {
                  setSearchQuery(firstSt.studentCode);
                }
              }}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs whitespace-nowrap cursor-pointer shadow-2xs"
              title="សាកល្បងសិស្សគំរូ"
            >
              សិស្សគំរូ
            </button>
          </div>
        </div>

        {/* Verification Result Area */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {!searchQuery.trim() ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="font-khmer text-sm font-bold text-slate-600">
                សូមវាយលេខវិក្កយបត្រ ឬអត្តលេខសិស្សដើម្បីផ្ទៀងផ្ទាត់
              </div>
              <div className="text-xs text-slate-400 max-w-sm mx-auto">
                ប្រព័ន្ធនឹងពិនិត្យលើទិន្នន័យបង់ប្រាក់ជាក់ស្តែងរបស់សាលា ដើម្បីផ្ទៀងផ្ទាត់ភាពត្រឹមត្រូវ និងទប់ស្កាត់វិក្កយបត្រក្លែងក្លាយ។
              </div>
            </div>
          ) : verificationResult?.status === 'not_found' ? (
            /* INVALID / NOT FOUND RESULT */
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                <XCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-rose-900 font-khmer">
                  វិក្កយបត្រគ្មានសុពលភាព ឬ រកមិនឃើញក្នុងប្រព័ន្ធ
                </h4>
                <div className="text-xs text-rose-700 font-mono mt-1">
                  Query: "{searchQuery}"
                </div>
              </div>
              <p className="text-xs text-rose-600 max-w-md mx-auto leading-relaxed">
                មិនមានទិន្នន័យវិក្កយបត្រ ឬសិស្សដែលត្រូវគ្នាក្នុងប្រព័ន្ធសាលាឡើយ។ សូមពិនិត្យលេខវិក្កយបត្រ ឬអត្តលេខសិស្សឡើងវិញដោយប្រុងប្រយ័ត្ន។
              </p>
            </div>
          ) : verificationResult ? (
            /* VALID VERIFIED RESULT */
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
              {/* Official Seal Banner */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                  verificationResult.isPaid
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-sm ${
                      verificationResult.isPaid
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm sm:text-base font-khmer">
                        {verificationResult.isPaid
                          ? '✅ វិក្កយបត្រផ្លូវការមានសុពលភាព (VERIFIED & PAID)'
                          : '⏳ ស្ថានភាព៖ មិនទាន់ទូទាត់ប្រាក់ (PENDING / UNPAID)'}
                      </h4>
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>លេខវិក្កយបត្រ៖ <strong>{verificationResult.invoiceNo}</strong></span>
                      <span>·</span>
                      <span>កាលបរិច្ឆេទ៖ <strong>{verificationResult.date}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-base font-black text-emerald-800">
                    ${verificationResult.amountUSD.toFixed(2)} USD
                  </div>
                  <div className="font-mono text-xs text-slate-600">
                    {verificationResult.amountKHR.toLocaleString()} ៛
                  </div>
                </div>
              </div>

              {/* Verified Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Student Info Card */}
                <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-800 text-xs">
                      ព័ត៌មានសិស្ស (Student Information)
                    </span>
                  </div>

                  {verificationResult.student ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">ឈ្មោះសិស្ស៖</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {verificationResult.student.name}
                        </span>
                        {verificationResult.student.latinName && (
                          <span className="block text-[11px] text-slate-500 font-sans">
                            {verificationResult.student.latinName}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px]">អត្តលេខសិស្ស (Student ID)៖</span>
                        <span className="font-mono font-bold text-indigo-700 text-sm">
                          {verificationResult.student.studentCode}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px]">ថ្នាក់រៀន (Class)៖</span>
                        <span className="font-bold text-slate-800">
                          {verificationResult.className}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px]">ភេទ & ប្រភេទសិស្ស៖</span>
                        <span className="text-slate-800 font-khmer">
                          {verificationResult.student.gender === 'Female' ? 'ស្រី' : 'ប្រុស'} · {verificationResult.student.caseType}
                        </span>
                      </div>

                      <div className="col-span-2 pt-1 border-t border-slate-200/80">
                        <span className="text-slate-500 block text-[10px]">អាណាព្យាបាល & លេខទូរស័ព្ទ៖</span>
                        <span className="text-slate-800 font-khmer">
                          {verificationResult.student.guardianName || 'N/A'} ({verificationResult.student.phone || 'N/A'})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-600 text-xs">
                      អ្នកទិញទូទៅ / អតិថិជនក្រៅប្រព័ន្ធ
                    </div>
                  )}
                </div>

                {/* QR Code & Token Box */}
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <InvoiceQRCode
                    invoiceNo={verificationResult.invoiceNo}
                    studentCode={verificationResult.student?.studentCode || 'STU-0000'}
                    studentName={verificationResult.student?.name || 'Student'}
                    amountUSD={verificationResult.amountUSD}
                    paymentDate={verificationResult.date}
                    paidBy={verificationResult.paidBy}
                    status={verificationResult.isPaid ? 'paid' : 'pending'}
                    size={90}
                    showDetails={false}
                  />
                  <div className="mt-2 text-center w-full">
                    <span className="text-[9px] text-slate-400 block font-mono">TOKEN:</span>
                    <button
                      type="button"
                      onClick={handleCopyToken}
                      className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-colors cursor-pointer inline-flex items-center gap-1 mt-0.5"
                      title="ចុចចម្លង Security Token"
                    >
                      <span>{verificationResult.securityToken}</span>
                      {copied ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-indigo-500" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Receipt Specifications */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">
                    ព័ត៌មានលម្អិតការទូទាត់ (Payment Transaction Details)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">វិធីទូទាត់ (Method)៖</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded inline-block text-[11px] mt-0.5">
                      {verificationResult.paidBy}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">ខែសិក្សា / មុខទំនិញ៖</span>
                    <span className="font-bold text-slate-800 text-[11px] block mt-0.5">
                      {verificationResult.monthsCovered.join(', ')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">បេឡាធិការទទួលប្រាក់៖</span>
                    <span className="font-bold text-slate-800 text-[11px] block mt-0.5">
                      {verificationResult.recordedBy}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">កាលបរិច្ឆេទផ្ទៀងផ្ទាត់៖</span>
                    <span className="font-mono text-slate-600 text-[10px] block mt-0.5">
                      {verificationResult.verifiedAt}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 font-khmer flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ប្រព័ន្ធផ្ទៀងផ្ទាត់ដោយផ្ទាល់ពីទិន្នន័យជាក់ស្តែង {settings.schoolNameKhmer}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
            >
              បិទ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple deterministic hash code helper for security token
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
