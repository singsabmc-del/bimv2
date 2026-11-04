import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Building,
  DollarSign,
  Shirt,
  ShoppingBag,
  Bus,
  Store,
  ChevronRight,
  Download,
  Filter,
  CheckCircle2,
  Users,
  Search,
  Check,
} from 'lucide-react';
import { Student31DaysAttendanceReport } from './Student31DaysAttendanceReport';

export type MonthlyReportType =
  | 'tuition_fee'
  | 'attendance_31days'
  | 'uniform_sales'
  | 'transportation'
  | 'study_materials'
  | 'stall_fee';

interface MonthlyReportsViewProps {
  initialReportType?: MonthlyReportType;
}

export const MonthlyReportsView: React.FC<MonthlyReportsViewProps> = ({
  initialReportType = 'tuition_fee',
}) => {
  const {
    classData,
    orderedClassList,
    selectedClassId,
    setSelectedClassId,
    globalMonth,
    globalYear,
    setGlobalMonth,
    currentBranch,
    branches,
    settings,
    dailyMaterials,
    materialsHistory,
    selectedMaterialsMonth,
    canteenReport,
    canteenHistory,
    selectedCanteenMonth,
    uniformReport,
    uniformHistory,
    selectedUniformMonth,
    uniformTypes,
    busEnrollments,
    busPayments,
    busRoutes,
    t,
  } = useApp();

  const [activeReport, setActiveReport] = useState<MonthlyReportType>(initialReportType);
  const [selectedClassReportId, setSelectedClassReportId] = useState<string>(selectedClassId || '1A');

  const currentClass = classData[selectedClassReportId] || orderedClassList[0] || Object.values(classData)[0];

  const handlePrint = () => {
    window.print();
  };

  // Bus report statistics
  const busStats = useMemo(() => {
    const enrolledCount = busEnrollments.length;
    const paidRecords = busPayments.filter((p) => p.month.includes(globalMonth));
    const totalUSD = paidRecords.reduce((sum, p) => sum + p.amountUSD, 0);
    const totalKHR = Math.round(totalUSD * settings.exchangeRate);
    return { enrolledCount, paidCount: paidRecords.length, totalUSD, totalKHR };
  }, [busEnrollments, busPayments, globalMonth, settings.exchangeRate]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Module Selector */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-khmer text-slate-900">
                  ផ្នែករបាយការណ៍ប្រចាំខែ (Monthly Report Section)
                </h1>
                <p className="text-xs text-slate-500 font-khmer mt-0.5">
                  របាយការណ៍បង់ថ្លៃសិក្សា ឯកសណ្ឋាន រថយន្តសាលា សម្ភារៈសិក្សា និងតូបអាហារដ្ឋាន
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-khmer shadow-xs transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>បោះពុម្ពរបាយការណ៍ផ្លូវការ (Print A4)</span>
            </button>
          </div>
        </div>

        {/* 6 Report Section Tabs matching flowchart + 31 Days Attendance */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveReport('tuition_fee')}
            className={`p-3 rounded-xl border text-left transition-all font-khmer flex flex-col justify-between cursor-pointer ${
              activeReport === 'tuition_fee'
                ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 text-blue-900 font-bold'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">1</span>
            </div>
            <div className="text-xs font-bold leading-snug">
              Tuition Fee Report
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              របាយការណ៍បង់ថ្លៃសិក្សា
            </div>
          </button>

          <button
            onClick={() => setActiveReport('attendance_31days')}
            className={`p-3 rounded-xl border text-left transition-all font-khmer flex flex-col justify-between cursor-pointer ${
              activeReport === 'attendance_31days'
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20 text-emerald-900 font-bold'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">2</span>
            </div>
            <div className="text-xs font-bold leading-snug">
              31 Days Attendance
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              របាយការណ៍វត្តមាន ៣១ ថ្ងៃ
            </div>
          </button>

          <button
            onClick={() => setActiveReport('uniform_sales')}
            className={`p-3 rounded-xl border text-left transition-all font-khmer flex flex-col justify-between ${
              activeReport === 'uniform_sales'
                ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20 text-indigo-900 font-bold'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Shirt className="w-4 h-4 text-indigo-600" />
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold">2</span>
            </div>
            <div className="text-xs font-bold leading-snug">
              School Uniform Sales Report
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              របាយការណ៍លក់ឯកសណ្ឋាន
            </div>
          </button>

          <button
            onClick={() => setActiveReport('transportation')}
            className={`p-3 rounded-xl border text-left transition-all font-khmer flex flex-col justify-between ${
              activeReport === 'transportation'
                ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-500/20 text-sky-900 font-bold'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Bus className="w-4 h-4 text-sky-600" />
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-bold">3</span>
            </div>
            <div className="text-xs font-bold leading-snug">
              Student Transportation Report
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              របាយការណ៍រថយន្តសាលា
            </div>
          </button>

          <button
            onClick={() => setActiveReport('study_materials')}
            className={`p-3 rounded-xl border text-left transition-all font-khmer flex flex-col justify-between ${
              activeReport === 'study_materials'
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20 text-emerald-900 font-bold'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">4</span>
            </div>
            <div className="text-xs font-bold leading-snug">
              Sales Report for Study Materials
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              របាយការណ៍លក់សម្ភារៈ
            </div>
          </button>

          <button
            onClick={() => setActiveReport('stall_fee')}
            className={`p-3 rounded-xl border text-left transition-all font-khmer flex flex-col justify-between ${
              activeReport === 'stall_fee'
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20 text-amber-900 font-bold'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Store className="w-4 h-4 text-amber-600" />
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">5</span>
            </div>
            <div className="text-xs font-bold leading-snug">
              Stall Fee Payment Report
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              របាយការណ៍ថ្លៃតូបអាហារដ្ឋាន
            </div>
          </button>
        </div>
      </div>

      {/* Printable Sheet Viewport */}
      <div className="print-container">
        {/* Printable Official Header (Shown Only on Print for other reports) */}
        {activeReport !== 'attendance_31days' && (
          <div className="hidden print:block text-center space-y-1 mb-6">
            <div className="font-bold text-xs font-khmer text-slate-800">ព្រះរាជាណាចក្រកម្ពុជា</div>
            <div className="text-[11px] font-semibold font-khmer text-slate-700">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
            <div className="text-sm font-extrabold font-khmer text-slate-900 pt-1">
              {settings.schoolNameKhmer} · {settings.schoolNameEnglish}
            </div>
            <div className="text-xs font-semibold font-khmer text-indigo-700">
              {currentBranch.nameKhmer}
            </div>
            <div className="text-base font-bold font-khmer text-slate-900 pt-2 uppercase">
              {activeReport === 'tuition_fee' && `របាយការណ៍បង់ថ្លៃសិក្សាសិស្ស (Tuition Fee Payment Report) - ${currentClass.className}`}
              {activeReport === 'uniform_sales' && `របាយការណ៍លក់ឯកសណ្ឋានសិស្សប្រចាំខែ (School Uniform Sales Report) - ${uniformReport.month} ${uniformReport.year}`}
              {activeReport === 'transportation' && `របាយការណ៍សេវារថយន្តសាលា (Student Transportation Service Report) - ${globalMonth} ${globalYear}`}
              {activeReport === 'study_materials' && `របាយការណ៍លក់សម្ភារៈសិក្សាប្រចាំថ្ងៃ (Sales Report for Study Materials) - ${dailyMaterials.month} ${dailyMaterials.year}`}
              {activeReport === 'stall_fee' && `របាយការណ៍ប្រមូលថ្លៃតូបអាហារដ្ឋាន (Stall Fee Payment Report) - ${canteenReport.month} ${canteenReport.year}`}
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              ឆ្នាំសិក្សា៖ {settings.academicYear} · អត្រាប្តូរប្រាក់៖ 1 USD = {settings.exchangeRate.toLocaleString()} ៛
            </div>
          </div>
        )}

        {/* 1. TUITION FEE PAYMENT REPORT (Flow: Class -> Monthly Tuition Fee Payment -> Summary Report of Cash Received) */}
        {activeReport === 'tuition_fee' && (
          <div className="space-y-6">
            {/* Class Selector Bar (PDF: Class selector node) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold font-khmer text-slate-700">ជ្រើសរើសថ្នាក់រៀន (Class):</span>
                <select
                  value={selectedClassReportId}
                  onChange={(e) => setSelectedClassReportId(e.target.value)}
                  className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-khmer font-bold focus:bg-white"
                >
                  {orderedClassList.map((c) => (
                    <option key={c.classId} value={c.classId}>
                      {c.className} ({c.period}) · {c.students.length} សិស្ស
                    </option>
                  ))}
                </select>
              </div>

              {/* Breadcrumb Flow indicator */}
              <div className="flex items-center gap-2 text-xs font-khmer text-slate-600 bg-blue-50/70 px-3 py-1.5 rounded-xl border border-blue-200">
                <span className="font-bold text-blue-900">{currentClass.className}</span>
                <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                <span>Monthly tuition fee payment</span>
                <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-bold text-blue-700">Summary Report of Cash Received</span>
              </div>
            </div>

            {/* Monthly Tuition Fee Payment Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-khmer">
                    តារាងបង់ថ្លៃសិក្សាសិស្សប្រចាំខែ (Monthly Tuition Fee Payment)
                  </h3>
                  <div className="text-[11px] text-slate-500 font-khmer">
                    ថ្នាក់៖ <strong>{currentClass.className}</strong> ({currentClass.period}) · គ្រូបន្ទុក៖ {currentClass.homeroomTeacher || 'យ៉េន ណាវីន'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-emerald-700">
                    សរុបប្រមូលបាន៖ ${currentClass.totalCollectedCash.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    អត្រាប្រមូល៖ {currentClass.targetCollectionRate}%
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-khmer font-bold">
                      <th className="py-2.5 px-3 text-center border-r border-slate-800 w-10">ល.រ</th>
                      <th className="py-2.5 px-3 border-r border-slate-800">អត្តលេខ</th>
                      <th className="py-2.5 px-3 border-r border-slate-800">គោត្តនាម-នាម</th>
                      <th className="py-2.5 px-3 border-r border-slate-800">ភេទ</th>
                      <th className="py-2.5 px-3 border-r border-slate-800">ប្រភេទសិស្ស</th>
                      <th className="py-2.5 px-3 border-r border-slate-800">ស្ថានភាពបង់</th>
                      <th className="py-2.5 px-3 border-r border-slate-800">កាលបរិច្ឆេទ</th>
                      <th className="py-2.5 px-3 border-r border-slate-800 text-center">វិធីបង់</th>
                      <th className="py-2.5 px-3 text-right">ទឹកប្រាក់ ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentClass.students.map((st, idx) => (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center font-mono text-slate-500 border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-700 border-r border-slate-100">
                          {st.studentCode}
                        </td>
                        <td className="py-2 px-3 font-bold font-khmer text-slate-900 border-r border-slate-100">
                          {st.name} {st.latinName ? `(${st.latinName})` : ''}
                        </td>
                        <td className="py-2 px-3 font-khmer text-center border-r border-slate-100">
                          {st.gender === 'Female' ? 'ស្រី' : 'ប្រុស'}
                        </td>
                        <td className="py-2 px-3 font-khmer border-r border-slate-100">
                          {st.caseType}
                        </td>
                        <td className="py-2 px-3 font-khmer border-r border-slate-100">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.cash > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                          }`}>
                            {st.feesGroup}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono border-r border-slate-100">
                          {st.paymentDate || '-'}
                        </td>
                        <td className="py-2 px-3 font-mono text-center border-r border-slate-100">
                          {st.paidBy}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          ${st.cash.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Report of Cash Received (PDF: Summary Report of Cash Received node) */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-4 bg-blue-900 text-white flex items-center justify-between font-khmer">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <h3 className="font-bold text-sm">
                    របាយការណ៍សង្ខេបថវិកាទទួលបាន (Summary Report of Cash Received)
                  </h3>
                </div>
                <div className="text-xs font-mono font-bold text-amber-300">
                  {currentClass.className}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse font-khmer">
                  <thead>
                    <tr className="bg-blue-50 text-blue-950 font-bold border-b border-blue-200">
                      <th className="py-2.5 px-3 border-r border-blue-200 text-center w-10">ល.រ</th>
                      <th className="py-2.5 px-4 border-r border-blue-200">ករណីសិក្សា / ស្ថានភាព</th>
                      <th className="py-2.5 px-3 border-r border-blue-200 text-center">ពេញថ្លៃ (General)</th>
                      <th className="py-2.5 px-3 border-r border-blue-200 text-center">ឧបត្ថម្ភ (Contribute)</th>
                      <th className="py-2.5 px-3 border-r border-blue-200 text-center">បញ្ចុះ 50%</th>
                      <th className="py-2.5 px-3 border-r border-blue-200 text-center font-bold">សរុបសិស្ស</th>
                      <th className="py-2.5 px-4 text-right font-bold">ទឹកប្រាក់ទទួលបាន ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentClass.summaryRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-center font-mono border-r border-slate-200 text-slate-500">
                          {row.id}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-200">
                          {row.caseKhmer}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono border-r border-slate-200">
                          {row.general}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono border-r border-slate-200">
                          {row.contribute}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono border-r border-slate-200">
                          {row.fiftyPercent}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 border-r border-slate-200">
                          {row.totalStudents}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                          ${row.totalCash.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                      <td colSpan={5} className="py-3 px-4 text-right border-r border-slate-300">
                        សរុបថវិកាទទួលបានជាក់ស្តែង (Actual Cash Received):
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-black text-slate-900 border-r border-slate-300">
                        {currentClass.students.length} នាក់
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-800 text-sm">
                        ${currentClass.totalCollectedCash.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. 31 DAYS STUDENT ATTENDANCE REPORT */}
        {activeReport === 'attendance_31days' && (
          <Student31DaysAttendanceReport
            defaultClassId={selectedClassReportId}
            defaultMonth={globalMonth}
            defaultYear={globalYear}
          />
        )}

        {/* 3. SCHOOL UNIFORM SALES REPORT */}
        {activeReport === 'uniform_sales' && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden space-y-4">
            <div className="p-4 bg-indigo-900 text-white flex items-center justify-between font-khmer">
              <h3 className="font-bold text-sm">
                របាយការណ៍លក់ឯកសណ្ឋានសិស្សប្រចាំខែ (School Uniform Sales Report) - {uniformReport.month} {uniformReport.year}
              </h3>
              <span className="text-xs font-mono text-indigo-200 font-bold">
                {currentBranch.nameKhmer}
              </span>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-indigo-50 text-indigo-950 font-bold border-b border-indigo-200 font-khmer">
                    <th className="py-2.5 px-3 border-r border-indigo-200">កាលបរិច្ឆេទ</th>
                    <th className="py-2.5 px-3 border-r border-indigo-200">ប្រភេទឯកសណ្ឋាន</th>
                    <th className="py-2.5 px-3 border-r border-indigo-200 text-center">ចំនួន (Qty)</th>
                    <th className="py-2.5 px-3 border-r border-indigo-200 text-right">តម្លៃរាយ (៛)</th>
                    <th className="py-2.5 px-3 border-r border-indigo-200 text-right">សរុបជាប្រាក់រៀល (៛)</th>
                    <th className="py-2.5 px-3 text-right">សមមូលជាដុល្លារ ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-khmer">
                  {uniformReport.shirtDailyRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono border-r border-slate-200">{r.date}</td>
                      <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200">អាវសិស្សទូទៅ (Shirt)</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-indigo-700 border-r border-slate-200">{r.totalQty}</td>
                      <td className="py-2 px-3 text-right font-mono border-r border-slate-200">{uniformReport.shirtPriceKHR.toLocaleString()} ៛</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200">{r.totalAmountKHR.toLocaleString()} ៛</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">${(r.totalAmountKHR / settings.exchangeRate).toFixed(2)}</td>
                    </tr>
                  ))}
                  {uniformReport.sportDailyRecords.map((r, i) => (
                    <tr key={`sport-${i}`} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono border-r border-slate-200">{r.date}</td>
                      <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200">ឯកសណ្ឋានកីឡា (Sport)</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-indigo-700 border-r border-slate-200">{r.totalQty}</td>
                      <td className="py-2 px-3 text-right font-mono border-r border-slate-200">{uniformReport.sportPriceKHR.toLocaleString()} ៛</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200">{r.totalAmountKHR.toLocaleString()} ៛</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">${(r.totalAmountKHR / settings.exchangeRate).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. STUDENT TRANSPORTATION SERVICE REPORT */}
        {activeReport === 'transportation' && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden space-y-4">
            <div className="p-4 bg-sky-900 text-white flex items-center justify-between font-khmer">
              <h3 className="font-bold text-sm">
                របាយការណ៍សេវារថយន្តសាលា (Student Transportation Service Report) - {globalMonth} {globalYear}
              </h3>
              <span className="text-xs font-mono font-bold text-sky-200">
                សរុប៖ ${busStats.totalUSD.toFixed(2)} ({busStats.totalKHR.toLocaleString()} ៛)
              </span>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-sky-50 text-sky-950 font-bold border-b border-sky-200 font-khmer">
                    <th className="py-2.5 px-3 border-r border-sky-200 text-center w-10">ល.រ</th>
                    <th className="py-2.5 px-3 border-r border-sky-200">អត្តលេខ</th>
                    <th className="py-2.5 px-3 border-r border-sky-200">ឈ្មោះសិស្ស</th>
                    <th className="py-2.5 px-3 border-r border-sky-200">ថ្នាក់រៀន</th>
                    <th className="py-2.5 px-3 border-r border-sky-200">ខ្សែរថយន្ត & ទីតាំង</th>
                    <th className="py-2.5 px-3 border-r border-sky-200 text-center">វេន</th>
                    <th className="py-2.5 px-3 border-r border-sky-200 text-center">ស្ថានភាពបង់</th>
                    <th className="py-2.5 px-3 text-right">ថ្លៃសេវា ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-khmer">
                  {busEnrollments.map((enr, idx) => {
                    const r = busRoutes.find((rt) => rt.id === enr.routeId);
                    return (
                      <tr key={enr.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center font-mono text-slate-500 border-r border-slate-200">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-700 border-r border-slate-200">{enr.studentCode}</td>
                        <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">{enr.studentName}</td>
                        <td className="py-2 px-3 border-r border-slate-200">{enr.className}</td>
                        <td className="py-2 px-3 border-r border-slate-200">{r?.name || enr.routeId}</td>
                        <td className="py-2 px-3 text-center border-r border-slate-200">{enr.shift}</td>
                        <td className="py-2 px-3 text-center border-r border-slate-200">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            enr.status === 'paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                          }`}>
                            {enr.status === 'paid' ? 'បានបង់' : 'មិនទាន់បង់'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">${enr.monthlyFeeUSD.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. SALES REPORT FOR STUDY MATERIALS */}
        {activeReport === 'study_materials' && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden space-y-4">
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between font-khmer">
              <h3 className="font-bold text-sm">
                របាយការណ៍លក់សម្ភារៈសិក្សាប្រចាំថ្ងៃ (Sales Report for Study Materials) - {dailyMaterials.month} {dailyMaterials.year}
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-200">
                {dailyMaterials.dateRange}
              </span>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-emerald-200 font-khmer">
                    <th className="py-2.5 px-3 border-r border-emerald-200 text-center w-10">ល.រ</th>
                    <th className="py-2.5 px-4 border-r border-emerald-200">មុខទំនិញ / សម្ភារៈ</th>
                    <th className="py-2.5 px-3 border-r border-emerald-200 text-right">តម្លៃរាយ (៛)</th>
                    <th className="py-2.5 px-3 border-r border-emerald-200 text-center">បរិមាណលក់ (Qty)</th>
                    <th className="py-2.5 px-4 border-r border-emerald-200 text-right">សរុបជាប្រាក់រៀល (៛)</th>
                    <th className="py-2.5 px-4 text-right">សមមូលជាដុល្លារ ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-khmer">
                  {dailyMaterials.items.map((it, idx) => (
                    <tr key={it.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-mono text-slate-500 border-r border-slate-200">{idx + 1}</td>
                      <td className="py-2 px-4 font-bold text-slate-900 border-r border-slate-200">{it.name}</td>
                      <td className="py-2 px-3 text-right font-mono border-r border-slate-200">{it.unitPriceKHR.toLocaleString()} ៛</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700 border-r border-slate-200">{it.totalQty}</td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-slate-900 border-r border-slate-200">{it.totalAmountKHR.toLocaleString()} ៛</td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-emerald-800">${(it.totalAmountKHR / settings.exchangeRate).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. STALL FEE PAYMENT REPORT */}
        {activeReport === 'stall_fee' && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden space-y-4">
            <div className="p-4 bg-amber-900 text-white flex items-center justify-between font-khmer">
              <h3 className="font-bold text-sm">
                របាយការណ៍ប្រមូលថ្លៃតូបអាហារដ្ឋាន (Stall Fee Payment Report) - {canteenReport.month} {canteenReport.year}
              </h3>
              <span className="text-xs font-mono font-bold text-amber-200">
                {currentBranch.nameKhmer}
              </span>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-amber-50 text-amber-950 font-bold border-b border-amber-200 font-khmer">
                    <th className="py-2.5 px-3 border-r border-amber-200 text-center w-10">ល.រ</th>
                    <th className="py-2.5 px-4 border-r border-amber-200">ឈ្មោះអ្នកលក់ / ម្ចាស់តូប</th>
                    <th className="py-2.5 px-4 border-r border-amber-200">ប្រភេទមុខម្ហូប / អាហារ</th>
                    <th className="py-2.5 px-3 border-r border-amber-200 text-center">លេខទូរស័ព្ទ</th>
                    <th className="py-2.5 px-3 border-r border-amber-200 text-right">ថ្លៃតូបប្រចាំថ្ងៃ (៛)</th>
                    <th className="py-2.5 px-3 text-center">ស្ថានភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-khmer">
                  {canteenReport.vendors.map((v, idx) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-mono text-slate-500 border-r border-amber-200">{idx + 1}</td>
                      <td className="py-2 px-4 font-bold text-slate-900 border-r border-amber-200">{v.name}</td>
                      <td className="py-2 px-4 border-r border-amber-200">{v.stallName}</td>
                      <td className="py-2 px-3 font-mono text-center border-r border-amber-200">{v.phone}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-900 border-r border-amber-200">10,000 ៛</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                          សកម្ម
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dual Signatures on Print for other reports */}
        {activeReport !== 'attendance_31days' && (
          <div className="hidden print:grid grid-cols-2 pt-12 text-xs text-center font-khmer">
            <div className="space-y-12">
              <div className="font-bold text-slate-700">បានឃើញ និងឯកភាព (នាយកសាលា)</div>
              <div className="font-bold text-slate-900">{settings.directorName}</div>
            </div>
            <div className="space-y-12">
              <div className="font-bold text-slate-700">រៀបចំដោយ (គណនេយ្យករ)</div>
              <div className="font-bold text-slate-900">{settings.accountantName}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
