import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StudentFeeRecord } from '../types';
import {
  User,
  GraduationCap,
  Calendar,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  Printer,
  CreditCard,
  Download,
  Upload,
  ArrowRight,
  Shield,
  FileCheck,
  Search,
  Send,
  FileText,
  Heart,
  Users,
  Utensils,
  Sparkles,
  Edit2,
  Receipt,
  ShoppingBag,
  Bus,
  UserX,
  RotateCcw,
} from 'lucide-react';
import { StudentAdmissionModal } from './StudentAdmissionModal';
import { StudentInvoiceHistoryTable } from './StudentInvoiceHistoryTable';
import { StudentGeneralInfoDocument } from './StudentGeneralInfoDocument';

export const StudentPortalView: React.FC = () => {
  const {
    classData,
    selectedClassId,
    selectedStudentForProfile,
    setSelectedStudentForProfile,
    updateStudentFee,
    recordStudentPayment,
    globalMonth,
    globalYear,
    sendTelegramAlert,
    permissions,
    currentUser,
    settings,
    t,
    uniformSalesHistory,
    materialSalesHistory,
    busEnrollments,
    busPayments,
    busRoutes,
    getBranchName,
  } = useApp();

  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [activePortalTab, setActivePortalTab] = useState<'profile' | 'receipts' | 'materials' | 'bus_service' | 'id_card' | 'admission_dossier' | 'submit_slip'>('profile');
  const [profileViewMode, setProfileViewMode] = useState<'official_document' | 'cards'>('official_document');
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [selectedStudentForAdmission, setSelectedStudentForAdmission] = useState<StudentFeeRecord | null>(null);

  // Payment proof form
  const [slipFile, setSlipFile] = useState<string | null>(null);
  const [slipNote, setSlipNote] = useState('');
  const [slipSubmitted, setSlipSubmitted] = useState(false);

  // Quick fee payment form in profile (Correct field types)
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(12.5);
  const [payMethod, setPayMethod] = useState<'ABA' | 'AC' | 'Cash'>('ABA');
  const [payMonth, setPayMonth] = useState<string>(globalMonth);
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Receipt filters
  const [receiptMonthFilter, setReceiptMonthFilter] = useState<string>('all');
  const [receiptStatusFilter, setReceiptStatusFilter] = useState<string>('all');

  // Collect all students across all classes
  const allStudents = Object.values(classData).flatMap((cls) =>
    cls.students.map((st) => ({ ...st, className: cls.className, classId: cls.classId }))
  );

  // If currentUser is student, auto-lock to their profile
  const studentUserRecord =
    currentUser.role === 'student' && currentUser.studentId
      ? allStudents.find((s) => s.id === currentUser.studentId)
      : null;

  const currentStudent =
    studentUserRecord ||
    selectedStudentForProfile ||
    allStudents[0];

  const currentStudentClass = currentStudent
    ? Object.values(classData).find((c) => c.students.some((s) => s.id === currentStudent.id))
    : null;

  const filteredStudentList = allStudents.filter(
    (st) =>
      st.name.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
      st.studentCode.toLowerCase().includes(searchStudentQuery.toLowerCase())
  );

  const isPaid = currentStudent?.cash > 0;
  const isStopped = currentStudent?.feesGroup.toLowerCase().includes('stop');
  const isAlready = currentStudent?.feesGroup.toLowerCase().includes('already');

  // Uniform & Material Purchases for current student
  const studentUniformCount = (uniformSalesHistory || []).filter(
    (u) =>
      (u.studentId && u.studentId === currentStudent?.id) ||
      (u.buyerName && (u.buyerName.includes(currentStudent?.name || '') || (currentStudent?.name || '').includes(u.buyerName)))
  ).reduce((acc, u) => acc + u.quantity, 0);

  const studentMaterialCount = (materialSalesHistory || []).filter(
    (m) =>
      (m.studentId && m.studentId === currentStudent?.id) ||
      (m.customerName && (m.customerName.includes(currentStudent?.name || '') || (currentStudent?.name || '').includes(m.customerName)))
  ).reduce((acc, m) => acc + m.quantity, 0);

  const studentBus = (busEnrollments || []).find(
    (b) =>
      b.studentId === currentStudent?.id ||
      (b.studentCode && b.studentCode.toLowerCase() === (currentStudent?.studentCode || '').toLowerCase()) ||
      (b.studentName && b.studentName.includes(currentStudent?.name || ''))
  );

  const studentBusRouteInfo = studentBus ? (busRoutes || []).find((r) => r.id === studentBus.routeId) : null;

  const handlePayFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent || !currentStudentClass) return;

    recordStudentPayment(currentStudentClass.classId, currentStudent.id, {
      month: payMonth || globalMonth,
      date: payDate,
      paidBy: payMethod,
      amountUSD: Number(payAmount) || 0,
      sendTelegram: true,
    });
    setIsPayOpen(false);
  };

  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setSlipFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (!currentStudent) {
    return <div className="p-8 text-center text-slate-500 font-khmer">មិនមានទិន្នន័យសិស្ស</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-700 font-khmer">
                សាលា អ៊ីរ៉ែលកម្ពុជា · BIM Rangsei School
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5 font-khmer">
                {t('ព័ត៌មានលម្អិត & ផតថលសិស្ស', 'Student Profile & Self-Service Portal')}
              </h2>
              <div className="text-xs text-slate-500">
                Official Student Identity, Tuition Ledger & Receipt Verification
              </div>
            </div>
          </div>

          {/* Action Bar & Student Selector (Only if not student role) */}
          {currentUser.role !== 'student' && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={t('ស្វែងរកឈ្មោះសិស្ស...', 'Search student name...')}
                  value={searchStudentQuery}
                  onChange={(e) => setSearchStudentQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {permissions.canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentForAdmission(null);
                    setIsAdmissionModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs font-khmer transition-all shadow-xs cursor-pointer shrink-0"
                  title="បំពេញពាក្យសុំចូលរៀន ឬ អាប់ឡូតឯកសារ AI (Fill or Upload Admission Form)"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>{t('ពាក្យសុំចូលរៀន (Admission)', 'Admission Form')}</span>
                </button>
              )}

              {searchStudentQuery && (
                <div className="absolute right-8 top-32 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto p-1 text-xs">
                  {filteredStudentList.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setSelectedStudentForProfile(st);
                        setSearchStudentQuery('');
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-50 font-khmer flex items-center justify-between"
                    >
                      <span className="font-bold">{st.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{st.studentCode}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Portal Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActivePortalTab('profile')}
            className={`px-3 py-1.5 rounded-lg font-khmer font-medium transition-all ${
              activePortalTab === 'profile'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t('ព័ត៌មានទូទៅ (Profile)', 'Profile & Details')}
          </button>

          <button
            onClick={() => setActivePortalTab('receipts')}
            className={`px-3 py-1.5 rounded-lg font-khmer font-medium transition-all flex items-center gap-1.5 ${
              activePortalTab === 'receipts'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{t('ប្រវត្តិវិក្កយបត្រ & ការទូទាត់ (Invoices & Payments)', 'Invoices & Payment History')}</span>
          </button>

          <button
            onClick={() => setActivePortalTab('materials')}
            className={`px-3 py-1.5 rounded-lg font-khmer font-medium transition-all flex items-center gap-1.5 ${
              activePortalTab === 'materials'
                ? 'bg-purple-600 text-white font-bold'
                : 'text-purple-700 bg-purple-50/70 hover:bg-purple-100'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t('ប្រវត្តិទិញសម្ភារៈ & ឯកសណ្ឋាន', 'Materials & Uniforms')}</span>
          </button>

          <button
            onClick={() => setActivePortalTab('bus_service')}
            className={`px-3 py-1.5 rounded-lg font-khmer font-medium transition-all flex items-center gap-1.5 ${
              activePortalTab === 'bus_service'
                ? 'bg-sky-600 text-white font-bold'
                : 'text-sky-800 bg-sky-50 hover:bg-sky-100'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>{t('សេវារថយន្តសាលា (School Bus)', 'Bus Service')}</span>
          </button>

          <button
            onClick={() => setActivePortalTab('id_card')}
            className={`px-3 py-1.5 rounded-lg font-khmer font-medium transition-all ${
              activePortalTab === 'id_card'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t('ប័ណ្ណសិស្ស (Student ID Card)', 'Digital ID Card')}
          </button>

          <button
            onClick={() => setActivePortalTab('admission_dossier')}
            className={`px-3 py-1.5 rounded-lg font-khmer font-medium transition-all flex items-center gap-1.5 ${
              activePortalTab === 'admission_dossier'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-blue-700 bg-blue-50/70 hover:bg-blue-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('សំណុំឯកសារចូលរៀន (Admission Form)', 'Admission Dossier')}</span>
          </button>

          <button
            onClick={() => setActivePortalTab('submit_slip')}
            className={`px-3 py-1.5 rounded-lg font-khmer font-medium transition-all ${
              activePortalTab === 'submit_slip'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            {t('ផ្ញើវិក្កយបត្រ ABA (Submit Slip)', 'Submit Payment Slip')}
          </button>
        </div>
      </div>

      {/* Main Content by Tab */}
      {activePortalTab === 'profile' && (
        <div className="space-y-4">
          {/* Sub-view switcher between Official Document & Summary Cards */}
          <div className="no-print flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-2xs">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setProfileViewMode('official_document')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-khmer font-bold transition-all cursor-pointer ${
                  profileViewMode === 'official_document'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t('ទម្រង់ពាក្យសុំផ្លូវការ (Official Form)', 'Official Registration Form')}</span>
              </button>

              <button
                type="button"
                onClick={() => setProfileViewMode('cards')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-khmer font-bold transition-all cursor-pointer ${
                  profileViewMode === 'cards'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{t('សង្ខេប & ការទូទាត់ (Tuition & Cards)', 'Summary Cards & Overview')}</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-khmer hidden sm:block">
              សិស្ស៖ <strong className="text-slate-900">{currentStudent.name}</strong> ({currentStudent.studentCode}) · ថ្នាក់ {currentStudentClass?.className || '1A'}
            </div>
          </div>

          {profileViewMode === 'official_document' ? (
            <StudentGeneralInfoDocument
              student={currentStudent}
              className={currentStudentClass?.className || '1A'}
              allowEdit={permissions.canEdit}
              onUpdateStudent={(updated) => {
                if (currentStudentClass) {
                  updateStudentFee(currentStudentClass.classId, currentStudent.id, updated);
                }
              }}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Identity Card (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 p-1 shadow-xs">
                  <div className="w-full h-full rounded-xl bg-slate-900 text-amber-300 font-extrabold text-3xl font-khmer flex items-center justify-center">
                    {currentStudent.name.slice(0, 1)}
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-lg mt-3 font-khmer">
                  {currentStudent.name}
                </h3>
                <div className="text-xs text-slate-500 font-mono">
                  {currentStudent.latinName || 'Student Name'} · {currentStudent.studentCode}
                </div>

                {/* Status Pill */}
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-khmer ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : isStopped
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : isAlready
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {isPaid ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>បានបង់រួចរាល់ (${currentStudent.cash.toFixed(2)})</span>
                      </>
                    ) : isStopped ? (
                      <span>ឈប់រៀន / ប្ដូរថ្នាក់</span>
                    ) : isAlready ? (
                      <span>បានបង់ពីខែមុនរួច</span>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>មិនទាន់បង់ (Unpaid)</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Student Metadata */}
              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-khmer">ថ្នាក់រៀន (Class):</span>
                  <span className="font-bold text-slate-900">{currentStudentClass?.className || '1A'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-khmer">សាខា (Campus):</span>
                  <span className="font-bold text-indigo-700 font-khmer">
                    {getBranchName(currentStudent.branchId || currentStudentClass?.branchId)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Gender:</span>
                  <span className="font-semibold text-slate-900">{currentStudent.gender}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-khmer">ប្រភេទថ្លៃសិក្សា:</span>
                  <span className="font-semibold text-slate-900 font-mono">{currentStudent.caseType}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-khmer">កាលបរិច្ឆេទចូលរៀន:</span>
                  <span className="font-mono text-slate-800">{currentStudent.startDate}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-khmer">អាណាព្យាបាល:</span>
                  <span className="font-khmer font-semibold text-slate-900">
                    {currentStudent.guardianName || 'លោក ផន សុជាតិ'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-khmer">លេខទូរស័ព្ទ:</span>
                  <span className="font-mono text-slate-800">{currentStudent.phone || '012 889 977'}</span>
                </div>
              </div>
            </div>

            {/* Student Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              {permissions.canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentForAdmission(currentStudent);
                    setIsAdmissionModalOpen(true);
                  }}
                  className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold font-khmer flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  title="មើល និងកែសម្រួលពាក្យសុំចូលរៀនរបស់សិស្សនេះ"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>{t('ពាក្យសុំចូលរៀនសិស្សនេះ (Admission)', 'View/Edit Admission Form')}</span>
                </button>
              )}

              {permissions.canCollectFee && (
                <button
                  type="button"
                  onClick={() => setIsPayOpen(true)}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-khmer flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>ប្រមូលថ្លៃសិក្សា (Collect Fee)</span>
                </button>
              )}

              {permissions.canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    if (!currentStudent || !currentStudentClass) return;
                    if (isStopped) {
                      if (window.confirm(`តើអ្នកពិតជាចង់កំណត់សិស្ស "${currentStudent.name}" ឱ្យចូលរៀនឡើងវិញមែនទេ?`)) {
                        updateStudentFee(currentStudentClass.classId, currentStudent.id, {
                          feesGroup: globalMonth,
                          paymentDate: new Date().toISOString().split('T')[0],
                          paidBy: 'Cash',
                          cash: 0.0,
                        });
                        sendTelegramAlert(
                          'សិស្សចូលរៀនឡើងវិញ (Student Reactivated)',
                          `សិស្ស៖ ${currentStudent.name} (${currentStudentClass.className})\nកូដសិស្ស៖ ${currentStudent.studentCode}\nស្ថានភាព៖ ចូលរៀនវិញក្នុងខែ ${globalMonth}`,
                          'system',
                          currentStudent.name
                        );
                      }
                    } else {
                      const reason = window.prompt(`សូមបញ្ចូលមូលហេតុឈប់ ឬ ប្តូរថ្នាក់សម្រាប់សិស្ស "${currentStudent.name}"៖`, 'ឈប់រៀន');
                      if (reason !== null) {
                        const finalReason = reason.trim() || 'ឈប់រៀន';
                        updateStudentFee(currentStudentClass.classId, currentStudent.id, {
                          feesGroup: 'Stopped',
                          paymentDate: finalReason,
                          paidBy: '$ -',
                          cash: 0.0,
                        });
                        sendTelegramAlert(
                          'សិស្សឈប់រៀន (Student Stopped / Dropped)',
                          `សិស្ស៖ ${currentStudent.name} (${currentStudentClass.className})\nកូដសិស្ស៖ ${currentStudent.studentCode}\nស្ថានភាព៖ ឈប់រៀន\nមូលហេតុ៖ ${finalReason}`,
                          'system',
                          currentStudent.name
                        );
                      }
                    }
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold font-khmer flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
                    isStopped
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                  title={isStopped ? "កំណត់សិស្សនេះឱ្យចូលរៀនវិញ" : "កំណត់សិស្សនេះជាសិស្សឈប់រៀន"}
                >
                  {isStopped ? (
                    <>
                      <RotateCcw className="w-4 h-4 text-emerald-600" />
                      <span>{t('កំណត់ចូលរៀនឡើងវិញ (Reactivate)', 'Reactivate Student')}</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4 text-rose-600" />
                      <span>{t('អាប់ដែតសិស្សឈប់ (Mark as Stopped)', 'Mark Student as Stopped')}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Right: Detailed Tuition & Ledger Overview (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Financial Status Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
              <h4 className="font-bold text-sm text-slate-900 font-khmer mb-4">
                ស្ថានភាពទូទាត់ថ្លៃសិក្សាប្រចាំខែ (Monthly Tuition Status)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 font-khmer">ថ្លៃសិក្សាត្រូវបង់ (Due)</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    ${currentStudent.caseType === 'Full' ? '12.50' : currentStudent.caseType === '50%' ? '6.25' : '5.00'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    ≈ {((currentStudent.caseType === 'Full' ? 12.5 : currentStudent.caseType === '50%' ? 6.25 : 5.0) * settings.exchangeRate).toLocaleString()} ៛
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 font-khmer">បានទូទាត់ (Collected)</div>
                  <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                    ${currentStudent.cash.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    វិធីទូទាត់: {currentStudent.paidBy}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 font-khmer">កាលបរិច្ឆេទបង់ប្រាក់</div>
                  <div className="text-sm font-bold font-mono text-slate-800 mt-2">
                    {currentStudent.paymentDate}
                  </div>
                  <div className="text-[11px] text-slate-400 font-khmer mt-0.5">
                    ក្រុម៖ {currentStudent.feesGroup}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Status Cards: Materials & School Bus Service */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Materials Card */}
              <div className="bg-purple-50/50 border border-purple-200 rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-purple-950 font-khmer">
                        សម្ភារៈ & ឯកសណ្ឋាន (Materials)
                      </h5>
                      <span className="text-[10px] text-purple-700 font-khmer">
                        ទិញសរុប {studentUniformCount + studentMaterialCount} មុខ/កំប្លេ
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActivePortalTab('materials')}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold font-khmer transition-colors shadow-2xs"
                  >
                    មើលតារាង →
                  </button>
                </div>
                <div className="text-[11px] text-slate-600 font-khmer">
                  ឯកសណ្ឋាន ({studentUniformCount} កំប្លេ) · សៀវភៅ & សម្ភារៈ ({studentMaterialCount} មុខ)
                </div>
              </div>

              {/* Bus Service Card */}
              <div className="bg-sky-50/50 border border-sky-200 rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                      <Bus className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-sky-950 font-khmer">
                        សេវាឡានក្រុងសាលា (School Bus)
                      </h5>
                      <span className="text-[10px] text-sky-700 font-khmer">
                        {studentBus ? (studentBus.status === 'paid' ? 'បានបង់ប្រាក់រួច' : 'រង់ចាំទូទាត់') : 'មិនទាន់ចុះឈ្មោះ'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActivePortalTab('bus_service')}
                    className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold font-khmer transition-colors shadow-2xs"
                  >
                    មើលតារាង →
                  </button>
                </div>
                <div className="text-[11px] text-slate-600 font-khmer">
                  {studentBus ? (
                    <span>
                      {studentBusRouteInfo?.name || 'ខ្សែទី១'} · ${studentBus.monthlyFeeUSD}/ខែ · {studentBus.pickupLocation}
                    </span>
                  ) : (
                    <span className="text-slate-400">សិស្សមិនទាន់បានប្រើប្រាស់សេវារថយន្តសាលានៅឡើយទេ</span>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Receipts & Invoices Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  <h4 className="font-bold text-sm text-slate-900 font-khmer">
                    ប្រវត្តិវិក្កយបត្រ & បង្កាន់ដៃទទួលប្រាក់ (Invoice & Payment Records)
                  </h4>
                </div>
                <button
                  onClick={() => setActivePortalTab('receipts')}
                  className="text-xs text-blue-600 font-semibold hover:underline font-khmer flex items-center gap-1"
                >
                  <span>មើលតារាងពេញលេញ →</span>
                </button>
              </div>

              {currentStudent.feeHistory && currentStudent.feeHistory.length > 0 ? (
                <div className="overflow-x-auto w-full border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 font-khmer">
                        <th className="py-2 px-3 border-r border-slate-200 text-center w-10">ល.រ</th>
                        <th className="py-2 px-3 border-r border-slate-200 whitespace-nowrap">កាលបរិច្ឆេទ</th>
                        <th className="py-2 px-3 border-r border-slate-200 whitespace-nowrap">លេខវិក្កយបត្រ</th>
                        <th className="py-2 px-3 border-r border-slate-200">បរិយាយ / ខែ</th>
                        <th className="py-2 px-3 border-r border-slate-200 text-right whitespace-nowrap">ទឹកប្រាក់ ($)</th>
                        <th className="py-2 px-3 border-r border-slate-200 text-center whitespace-nowrap">វិធីទូទាត់</th>
                        <th className="py-2 px-3 text-center whitespace-nowrap">ស្ថានភាព</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {currentStudent.feeHistory.slice(0, 5).map((rec, idx) => (
                        <tr key={rec.invoiceNo || rec.receiptNo || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-700 whitespace-nowrap">
                            {rec.date}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {rec.invoiceNo || rec.receiptNo}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 font-khmer">
                            <span className="font-semibold text-slate-800">
                              {rec.description || `ថ្លៃសិក្សា ${rec.month}`}
                            </span>
                            {rec.monthsCount && rec.monthsCount > 1 && (
                              <span className="ml-1.5 px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                                {rec.monthsCount} ខែ
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            ${rec.amountUSD.toFixed(2)}
                            <span className="text-[10px] text-slate-400 block font-normal">
                              {(rec.amountKHR || Math.round(rec.amountUSD * settings.exchangeRate)).toLocaleString()}៛
                            </span>
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-xs font-bold text-blue-900 whitespace-nowrap">
                            {rec.paidBy}
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] uppercase font-mono">
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 font-khmer">
                  មិនទាន់មានវិក្កយបត្រទូទាត់នៅឡើយទេ។
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActivePortalTab('receipts')}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold font-khmer flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>បើកមើលតារាងប្រវត្តិវិក្កយបត្រទាំងអស់ (View Full Table)</span>
                </button>
              </div>
            </div>
            </div>
            </div>
          )}
        </div>
      )}

      {/* Invoices & Receipts Tab (Full Formatted Table) */}
      {activePortalTab === 'receipts' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
          <StudentInvoiceHistoryTable
            student={currentStudent}
            className={currentStudentClass?.className}
            showTitle={true}
            onOpenQuickPay={() => setIsPayOpen(true)}
          />
        </div>
      )}

      {/* Materials & Uniform Purchases Tab */}
      {activePortalTab === 'materials' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
          <StudentInvoiceHistoryTable
            student={currentStudent}
            className={currentStudentClass?.className}
            showTitle={true}
            defaultTab="materials"
            onOpenQuickPay={() => setIsPayOpen(true)}
          />
        </div>
      )}

      {/* School Bus Service Tab */}
      {activePortalTab === 'bus_service' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
          <StudentInvoiceHistoryTable
            student={currentStudent}
            className={currentStudentClass?.className}
            showTitle={true}
            defaultTab="bus"
            onOpenQuickPay={() => setIsPayOpen(true)}
          />
        </div>
      )}

      {/* ID Card Badge Tab */}
      {activePortalTab === 'id_card' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-khmer">
                ប័ណ្ណសម្គាល់ខ្លួនសិស្ស (Digital Student ID Badge)
              </h3>
              <p className="text-xs text-slate-500">
                Official Student Identification Badge - Academic Year {settings.academicYear}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print ID Card</span>
            </button>
          </div>

          {/* Student ID Card Badge (Cambodian School standard layout) */}
          <div className="w-80 mx-auto bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border-4 border-amber-400/80 flex flex-col items-center text-center space-y-4">
            <div className="w-full flex items-center justify-between border-b border-blue-700/60 pb-3">
              <GraduationCap className="w-6 h-6 text-amber-400" />
              <div className="text-right">
                <div className="text-[10px] font-bold text-amber-300 font-khmer leading-none">{settings.schoolNameKhmer}</div>
                <div className="text-[9px] text-blue-200 font-bold leading-none mt-0.5">{settings.schoolNameEnglish}</div>
              </div>
            </div>

            <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md">
              <div className="w-full h-full rounded-xl bg-slate-900 text-amber-300 font-khmer font-extrabold text-3xl flex items-center justify-center">
                {currentStudent.name.slice(0, 1)}
              </div>
            </div>

            <div>
              <h4 className="text-base font-bold font-khmer text-amber-300">{currentStudent.name}</h4>
              <div className="text-xs text-blue-100 font-mono mt-0.5">{currentStudent.latinName || 'Student Name'}</div>
              <div className="mt-1 px-2.5 py-0.5 bg-blue-700/70 rounded-full text-[11px] font-mono font-bold tracking-wider text-white inline-block">
                ID: {currentStudent.studentCode}
              </div>
            </div>

            <div className="w-full bg-blue-950/60 rounded-xl p-3 text-[11px] space-y-1.5 text-left border border-blue-700/40 font-khmer">
              <div className="flex justify-between">
                <span className="text-blue-300">ថ្នាក់រៀន (Grade):</span>
                <span className="font-bold text-white">{currentStudentClass?.className}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-300">ភេទ (Gender):</span>
                <span className="font-bold text-white">{currentStudent.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-300">ឆ្នាំសិក្សា:</span>
                <span className="font-bold text-amber-300 font-mono">{settings.academicYear}</span>
              </div>
            </div>

            <div className="text-[9px] text-blue-300 font-khmer pt-2 border-t border-blue-700/60 w-full flex justify-between items-center">
              <span>ហត្ថលេខានាយក</span>
              <span className="font-bold text-white">{settings.directorName}</span>
            </div>
          </div>
        </div>
      )}

      {/* Submit Payment Proof Tab */}
      {activePortalTab === 'submit_slip' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-1 pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-khmer">
              ផ្ញើវិក្កយបត្របង់ប្រាក់តាមធនាគារ (ABA / ACLEDA Slip)
            </h3>
            <p className="text-xs text-slate-500 font-khmer">
              សិស្ស ឬអាណាព្យាបាលអាចភ្ជាប់រូបភាពបង្កាន់ដៃផ្ទេរប្រាក់ដើម្បីឱ្យគណនេយ្យករពិនិត្យ និងយល់ព្រម
            </p>
          </div>

          {slipSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-sm text-emerald-900 font-khmer">
                វិក្កយបត្រត្រូវបានផ្ញើជូនគណនេយ្យករដោយជោគជ័យ!
              </h4>
              <p className="text-xs text-emerald-700 font-khmer">
                ប្រព័ន្ធបានផ្ញើការជូនដំណឹង (Alert) ទៅកាន់ Telegram របស់សាលារួចរាល់។
              </p>
              <button
                onClick={() => {
                  setSlipSubmitted(false);
                  setSlipFile(null);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
              >
                ផ្ញើវិក្កយបត្រថ្មី
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSlipSubmitted(true);
                sendTelegramAlert(
                  'បង្កាន់ដៃផ្ទេរប្រាក់ពីផតថលសិស្ស (Online Slip Submitted)',
                  `សិស្ស៖ ${currentStudent.name} (${currentStudentClass?.className || ''})\nកូដសិស្ស៖ ${currentStudent.studentCode}\nកំណត់ចំណាំ៖ ${slipNote || 'បានបង់ថ្លៃសិក្សាតាមធនាគារ'}\nស្ថានភាព៖ រង់ចាំការផ្ទៀងផ្ទាត់ដោយគណនេយ្យករ`,
                  'fee',
                  currentStudent.name
                );
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  សិស្សបង់ប្រាក់
                </label>
                <input
                  type="text"
                  disabled
                  value={`${currentStudent.name} (${currentStudent.studentCode})`}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-khmer font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ភ្ជាប់រូបភាពបង្កាន់ដៃ (Upload Payment Slip Image)
                </label>
                <label className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="font-semibold text-slate-700 font-khmer">ជ្រើសរើសរូបភាព Screenshot</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">ABA Pay, ACLEDA ឬ KHQR slip</span>
                  <input type="file" accept="image/*" onChange={handleSlipUpload} className="hidden" />
                </label>

                {slipFile && (
                  <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden max-h-48 bg-slate-100 flex items-center justify-center">
                    <img src={slipFile} alt="Slip Preview" className="max-h-48 object-contain" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  កំណត់ចំណាំបន្ថែម
                </label>
                <textarea
                  rows={2}
                  value={slipNote}
                  onChange={(e) => setSlipNote(e.target.value)}
                  placeholder="ឧ. បានបង់ថ្លៃសិក្សាខែតុលា តាម ABA"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-khmer"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold font-khmer transition-colors shadow-xs"
              >
                បញ្ជូនវិក្កយបត្រ (Submit Slip)
              </button>
            </form>
          )}
        </div>
      )}

      {/* ADMISSION DOSSIER TAB CONTENT (បំពេញ & បង្ហាញពត៌មានសិស្សតាម Admission Form) */}
      {activePortalTab === 'admission_dossier' && (
        <div className="space-y-6">
          {/* Top Dossier Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-blue-700 font-bold font-khmer">
                  ពាក្យសុំចុះឈ្មោះចូលរៀនផ្លូវការ · BIM Rangsei School
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-khmer mt-0.5">
                  សំណុំឯកសារចូលរៀនរបស់សិស្ស៖ {currentStudent.name} {currentStudent.latinName ? `(${currentStudent.latinName})` : ''}
                </h3>
                <div className="text-xs text-slate-500 font-mono">
                  Student ID: {currentStudent.studentCode} · Class: {currentStudentClass?.className || '1A'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="/assets/aistudio/2.1._____________version3_ac242d81.pdf"
                target="_blank"
                rel="noreferrer"
                download="BIM_Admission_Form_Blank.pdf"
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold font-khmer text-xs flex items-center gap-1.5 transition-colors"
                title="ទាញយកពាក្យសុំដើមជា PDF (Download Original Blank Form)"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>ទាញយក PDF ដើម</span>
              </a>

              {permissions.canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentForAdmission(currentStudent);
                    setIsAdmissionModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold font-khmer text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>កែសម្រួល / អាប់ឡូត AI (Edit / Scan)</span>
                </button>
              )}
            </div>
          </div>

          {/* 6 Sections Dossier Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section I: Pupil Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 font-khmer text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>I. ព័ត៌មានលម្អិតរបស់សិស្ស (Pupil Details)</span>
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 font-mono">
                  {currentStudent.studentCode}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-khmer text-[11px]">១. នាម និងគោត្តនាម (Khmer)</span>
                  <span className="font-bold text-slate-900 font-khmer">{currentStudent.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">២. Name in English</span>
                  <span className="font-mono font-bold text-slate-800">{currentStudent.latinName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-khmer text-[11px]">ភេទ (Gender)</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                    currentStudent.gender === 'Female' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {currentStudent.gender === 'Female' ? 'ស្រី (Female)' : 'ប្រុស (Man)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-khmer text-[11px]">សញ្ជាតិ (Nationality)</span>
                  <span className="font-khmer font-medium text-slate-800">{currentStudent.nationality || currentStudent.admissionData?.pupil?.nationality || 'ខ្មែរ'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-khmer text-[11px]">៣. ថ្ងៃ.ខែ.ឆ្នាំកំណើត (DOB)</span>
                  <span className="font-mono font-bold text-slate-800">{currentStudent.admissionData?.pupil?.dob || currentStudent.startDate || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-khmer text-[11px]">សាសនា (Religion)</span>
                  <span className="font-khmer font-medium text-slate-800">{currentStudent.religion || currentStudent.admissionData?.pupil?.religion || 'ព្រះពុទ្ធ'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block font-khmer text-[11px]">៥. ទីកន្លែងកំណើត (Place of Birth)</span>
                  <span className="font-khmer text-slate-800">{currentStudent.placeOfBirth || currentStudent.admissionData?.pupil?.placeOfBirth || 'មិនបានបញ្ជាក់'}</span>
                </div>
              </div>
            </div>

            {/* Section II: Grade Level */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 font-khmer text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-600" />
                  <span>II. កម្រិតថ្នាក់ (Grade Level)</span>
                </h4>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-khmer font-bold text-[10px]">
                  {currentStudent.admissionData?.gradeLevel?.presentGrade || currentStudentClass?.className || '1A'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-700 font-khmer block text-[11px]">១. កម្រិតថ្នាក់ឆ្នាំចាស់ (Previous Grade):</span>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 font-khmer">
                    <div>ថ្នាក់៖ <strong className="text-slate-900">{currentStudent.admissionData?.gradeLevel?.previousGrade || '-'}</strong></div>
                    <div>ឆ្នាំសិក្សា៖ <strong className="text-slate-900">{currentStudent.admissionData?.gradeLevel?.previousYear || '-'}</strong></div>
                    <div className="col-span-2">សាលា៖ <strong className="text-slate-900">{currentStudent.admissionData?.gradeLevel?.previousSchool || '-'}</strong></div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1">
                  <span className="font-bold text-amber-900 font-khmer block text-[11px]">២. កម្រិតថ្នាក់បច្ចុប្បន្ន (Present Grade):</span>
                  <div className="grid grid-cols-2 gap-2 text-slate-700 font-khmer">
                    <div>ថ្នាក់៖ <strong className="text-slate-950">{currentStudent.admissionData?.gradeLevel?.presentGrade || currentStudentClass?.className || '1A'}</strong></div>
                    <div>ឆ្នាំសិក្សា៖ <strong className="text-slate-950">{currentStudent.admissionData?.gradeLevel?.presentYear || '2026-2027'}</strong></div>
                    <div className="col-span-2">សាលា៖ <strong className="text-slate-950">{currentStudent.admissionData?.gradeLevel?.presentSchool || 'សាលា អ៊ីរ៉ែលកម្ពុជា (BIM School)'}</strong></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700 font-khmer">
                  <div>
                    <span className="text-slate-400 block text-[11px]">៣. ថ្ងៃសិក្សា (Day)</span>
                    <span className="font-medium">{currentStudent.admissionData?.gradeLevel?.studyDays || 'ថ្ងៃចន្ទ-ថ្ងៃសុក្រ'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">ម៉ោងសិក្សា (Time)</span>
                    <span className="font-medium">{currentStudent.admissionData?.gradeLevel?.studyHours || 'ម៉ោង៧:០០-១៦:០០'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section III: Student Health (12 conditions) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 font-khmer text-sm flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-600" />
                  <span>III. ព័ត៌មានសុខភាពកុមារ (Student Health Section - 12 លក្ខខណ្ឌ)</span>
                </h4>
                {currentStudent.admissionData?.health?.takesMedication && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 font-khmer">
                    ⚠️ ត្រូវការលេបថ្នាំទៀងទាត់
                  </span>
                )}
              </div>

              {/* 12 Health Conditions Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
                {[
                  { labelKh: 'កង្វះអាហារូបត្ថម្ភ', labelEn: 'Malnutrition', key: 'malnutrition' },
                  { labelKh: 'ស្ថានភាពបេះដូង', labelEn: 'Heart Condition', key: 'heartCondition' },
                  { labelKh: 'ជំងឺហឺត/ពិបាកដកដង្ហើម', labelEn: 'Asthma', key: 'asthma' },
                  { labelKh: 'ឈឺក្បាលប្រកាំង', labelEn: 'Migraine', key: 'migraine' },
                  { labelKh: 'ជំងឺទឹកនោមផ្អែម', labelEn: 'Diabetes', key: 'diabetes' },
                  { labelKh: 'វិលមុខ/ងងឹតមុខ/ដួលសន្លប់', labelEn: 'Dizziness/Fainting', key: 'dizziness' },
                  { labelKh: 'បញ្ហាអាកប្បកិរិយា', labelEn: 'Behavior', key: 'behaviorConcerns' },
                  { labelKh: 'បញ្ហាការសិក្សា', labelEn: 'Learning', key: 'learningConcerns' },
                  { labelKh: 'បញ្ហាការស្តាប់', labelEn: 'Hearing', key: 'hearingConcerns' },
                  { labelKh: 'បញ្ហាការមើល/ភ្នែក', labelEn: 'Vision', key: 'visionConcerns' },
                  { labelKh: 'បញ្ហាការនិយាយស្តី', labelEn: 'Speech', key: 'speechConcerns' },
                  { labelKh: 'បញ្ហាការចល័ត/ជើង', labelEn: 'Mobility', key: 'mobilityConcerns' },
                ].map((item, idx) => {
                  const healthObj = (currentStudent.admissionData?.health as any)?.[item.key];
                  const hasCond = !!healthObj?.hasCondition;
                  const details = healthObj?.details;

                  return (
                    <div
                      key={item.key}
                      className={`p-2.5 rounded-xl border transition-all ${
                        hasCond
                          ? 'border-rose-300 bg-rose-50/70 text-rose-950 shadow-2xs'
                          : 'border-slate-100 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[11px] font-khmer truncate">{idx + 1}. {item.labelKh}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          hasCond ? 'bg-rose-200 text-rose-900' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {hasCond ? 'មាន' : 'គ្មាន'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">{item.labelEn}</div>
                      {hasCond && details && (
                        <div className="text-[11px] font-khmer text-rose-800 mt-1.5 bg-white/80 p-1.5 rounded border border-rose-200">
                          {details}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Medication Details */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800 font-khmer block text-[11px]">
                  ថ្នាំពេទ្យដែលត្រូវលេបប្រចាំ ឬពេលមានអាការៈ (Medication Schedule):
                </span>
                <p className="text-slate-600 font-khmer">
                  {currentStudent.admissionData?.health?.medicationDetails || 'គ្មានថ្នាំពេទ្យដែលត្រូវលេបជាប្រចាំទេ'}
                </p>
              </div>
            </div>

            {/* Section IV: Parents & Caretaker Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 font-khmer text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>IV. ព័ត៌មានមាតាបិតា & អាណាព្យាបាល (Parents Details)</span>
                </h4>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Father */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="font-bold text-slate-800 font-khmer block text-[11px]">១. ឪពុក (Father):</span>
                  <div className="grid grid-cols-2 gap-1 text-slate-600 font-khmer">
                    <div>ឈ្មោះ៖ <strong className="text-slate-900">{currentStudent.admissionData?.parents?.father?.name || '-'}</strong></div>
                    <div>មុខរបរ៖ <strong className="text-slate-900">{currentStudent.admissionData?.parents?.father?.occupation || '-'}</strong></div>
                    <div className="col-span-2">ទូរស័ព្ទ៖ <strong className="text-slate-900 font-mono">{currentStudent.admissionData?.parents?.father?.phone || '-'}</strong></div>
                  </div>
                </div>

                {/* Mother */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="font-bold text-slate-800 font-khmer block text-[11px]">២. ម្តាយ (Mother):</span>
                  <div className="grid grid-cols-2 gap-1 text-slate-600 font-khmer">
                    <div>ឈ្មោះ៖ <strong className="text-slate-900">{currentStudent.admissionData?.parents?.mother?.name || '-'}</strong></div>
                    <div>មុខរបរ៖ <strong className="text-slate-900">{currentStudent.admissionData?.parents?.mother?.occupation || '-'}</strong></div>
                    <div className="col-span-2">ទូរស័ព្ទ៖ <strong className="text-slate-900 font-mono">{currentStudent.admissionData?.parents?.mother?.phone || '-'}</strong></div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-0.5">
                  <span className="font-bold text-blue-900 font-khmer block text-[11px]">៤. អ្នកជិតខាងទាក់ទងបន្ទាន់ (Emergency Contact):</span>
                  <div className="grid grid-cols-2 gap-1 text-slate-700 font-khmer">
                    <div>ទំនាក់ទំនង៖ <strong>{currentStudent.admissionData?.parents?.emergencyContact?.relationship || '-'}</strong></div>
                    <div>មុខរបរ៖ <strong>{currentStudent.admissionData?.parents?.emergencyContact?.occupation || '-'}</strong></div>
                    <div className="col-span-2">ទូរស័ព្ទ៖ <strong className="font-mono text-blue-950">{currentStudent.admissionData?.parents?.emergencyContact?.phone || '-'}</strong></div>
                  </div>
                </div>

                {/* Forbidden Person */}
                {currentStudent.admissionData?.parents?.forbiddenPickupPerson?.hasForbiddenPerson && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                    <span className="font-bold font-khmer block text-[11px]">⚠️ បុគ្គលហាមឃាត់មិនអោយជួប ឬមកទទួលកុមារ៖</span>
                    <p className="font-khmer text-[11px]">{currentStudent.admissionData?.parents?.forbiddenPickupPerson?.details}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Section V & VI: Other Services & Declaration */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 font-khmer text-sm flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <span>V. សេវាកម្មអាហារ & VI. សេចក្តីបញ្ជាក់</span>
                </h4>
              </div>

              {/* Meals */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-700 font-khmer block text-[11px]">សេវាកម្មអាហារកុមារ (Services & Meals):</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className={`p-2.5 rounded-xl border text-center font-khmer ${
                    currentStudent.admissionData?.services?.breakfast ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold' : 'border-slate-100 bg-slate-50 text-slate-500'
                  }`}>
                    អាហារពេលព្រឹក
                  </div>
                  <div className={`p-2.5 rounded-xl border text-center font-khmer ${
                    currentStudent.admissionData?.services?.lunch ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold' : 'border-slate-100 bg-slate-50 text-slate-500'
                  }`}>
                    អាហារថ្ងៃត្រង់
                  </div>
                  <div className={`p-2.5 rounded-xl border text-center font-khmer ${
                    currentStudent.admissionData?.services?.eveningFood ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold' : 'border-slate-100 bg-slate-50 text-slate-500'
                  }`}>
                    អាហារពេលល្ងាច
                  </div>
                </div>

                {/* Permanent Address */}
                <div className="pt-2">
                  <span className="text-slate-400 block font-khmer text-[11px]">អាសយដ្ឋានអចិន្ត្រៃយ៍ (Permanent Address)</span>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-khmer text-slate-800">
                    {currentStudent.admissionData?.permanentAddress || 'ភូមិអូរឫស្សី សង្កាត់ប៉ោយប៉ែត ក្រុងប៉ោយប៉ែត ខេត្តបន្ទាយមានជ័យ'}
                  </div>
                </div>

                {/* Declaration */}
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-khmer text-amber-300 text-[11px]">VI. សេចក្តីបញ្ជាក់របស់មាតាបិតា (Declaration)</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Verified ✓</span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-khmer leading-relaxed">
                    ខ្ញុំបាទ/នាងខ្ញុំ សូមធានាអះអាងថាព័ត៌មានទាំងអស់ខាងលើពិតជាត្រឹមត្រូវពិតប្រាកដមែន ហើយសន្យាគោរពតាមបទបញ្ជាផ្ទៃក្នុងរបស់សាលា។
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>កាលបរិច្ឆេទ៖ {currentStudent.admissionData?.parentSignDate || currentStudent.startDate || '01-10-2026'}</span>
                    <span className="font-khmer text-slate-200">ហត្ថលេខា & ស្នាមមេដៃបានទទួល</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PAY MODAL */}
      {isPayOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 text-xs">
            <h3 className="font-bold text-slate-900 text-base font-khmer mb-3">
              ប្រមូលថ្លៃសិក្សា ({currentStudent.name})
            </h3>
            <form onSubmit={handlePayFee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-khmer">សម្រាប់ខែសិក្សា</label>
                  <select
                    value={payMonth}
                    onChange={(e) => setPayMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-khmer font-bold"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                      <option key={m} value={m}>
                        {m} {globalYear}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    inputMode="decimal"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ABA', 'AC', 'Cash'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`py-2 px-3 rounded-lg font-bold border ${
                        payMethod === m
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">កាលបរិច្ឆេទបង់ប្រាក់</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  required
                />
              </div>

              <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-[11px] flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-600 shrink-0" />
                <span>ការទូទាត់នេះនឹងផ្ញើសារជូនដំណឹង Telegram Alert ភ្លាមៗ</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium font-khmer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold font-khmer shadow-xs"
                >
                  បញ្ជាក់ការទទួលប្រាក់ & ផ្ញើ Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMISSION FORM MODAL */}
      {isAdmissionModalOpen && (
        <StudentAdmissionModal
          isOpen={isAdmissionModalOpen}
          onClose={() => {
            setIsAdmissionModalOpen(false);
            setSelectedStudentForAdmission(null);
          }}
          targetClassId={currentStudentClass?.classId || '1A'}
          existingStudent={selectedStudentForAdmission || undefined}
          onStudentSaved={(updated) => {
            if (updated && updated.id === currentStudent?.id) {
              setSelectedStudentForProfile(updated);
            }
          }}
        />
      )}
    </div>
  );
};
