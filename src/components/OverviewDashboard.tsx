import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  ShoppingBag,
  Store,
  Shirt,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Sparkles,
  Shield,
  Send,
  History,
  UserCheck,
  CreditCard,
  Receipt,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface OverviewDashboardProps {
  setActiveTab: (tab: NavTab) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ setActiveTab }) => {
  const {
    classData,
    orderedClassList,
    currentBranchId,
    currentBranch,
    dailyMaterials,
    materialSalesHistory,
    currentCanteenReport,
    canteenHistory,
    selectedCanteenMonth,
    uniformReport,
    uniformSalesHistory,
    settings,
    currentUser,
    permissions,
    t,
  } = useApp();

  const exchangeRate = settings.exchangeRate;

  // Aggregate student fees for active branch (or all branches if 'all' selected)
  const activeBranchClasses = orderedClassList;
  const totalTuitionUSD = activeBranchClasses.reduce(
    (sum: number, c) => sum + c.totalCollectedCash,
    0
  );
  const totalExpectedTuitionUSD = activeBranchClasses.reduce(
    (sum: number, c) => sum + c.totalExpectedCash,
    0
  );
  const totalTuitionKHR = Math.round(totalTuitionUSD * exchangeRate);

  // Aggregate materials revenue (ledger + transactions)
  const totalMaterialsKHR = dailyMaterials.items.reduce(
    (sum: number, item) => sum + item.totalAmountKHR,
    0
  );
  const totalMaterialsQty = dailyMaterials.items.reduce(
    (sum: number, item) => sum + item.totalQty,
    0
  );

  // Aggregate canteen vendor revenue
  const totalCanteenKHR = currentCanteenReport.dailyRecords.reduce(
    (sum: number, record) => sum + record.dailyTotalKHR,
    0
  );
  const totalVendorDays = currentCanteenReport.dailyRecords.reduce(
    (sum: number, record) => sum + record.vendorCount,
    0
  );

  // Aggregate uniform revenue across all types (shirts, sports bottoms, and custom uniform types)
  const totalUniformShirtKHR = (uniformReport.shirtDailyRecords || []).reduce(
    (sum: number, record) => sum + record.totalAmountKHR,
    0
  );
  const totalUniformSportKHR = (uniformReport.sportDailyRecords || []).reduce(
    (sum: number, record) => sum + record.totalAmountKHR,
    0
  );
  const totalUniformCustomKHR = uniformReport.recordsByType
    ? Object.values(uniformReport.recordsByType)
        .flat()
        .reduce((sum: number, record) => sum + record.totalAmountKHR, 0)
    : 0;
  const totalUniformKHR = totalUniformShirtKHR + totalUniformSportKHR + totalUniformCustomKHR;
  const totalUniformQty =
    (uniformReport.shirtDailyRecords || []).reduce((s, r) => s + r.totalQty, 0) +
    (uniformReport.sportDailyRecords || []).reduce((s, r) => s + r.totalQty, 0) +
    (uniformReport.recordsByType
      ? Object.values(uniformReport.recordsByType)
          .flat()
          .reduce((s, r) => s + r.totalQty, 0)
      : 0);

  // Grand Consolidated Revenue
  const totalIncomeKHR =
    totalTuitionKHR + totalMaterialsKHR + totalCanteenKHR + totalUniformKHR;
  const totalIncomeUSD = (totalIncomeKHR / exchangeRate).toFixed(2);

  // Total student count
  const allStudents = Object.values(classData).flatMap((cls) => cls.students);
  const paidStudentsCount = allStudents.filter((s) => s.cash > 0).length;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Institutional Banner (Hidden on mobile view per user request) */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-700 tracking-wider">
              <span>{settings.schoolNameEnglish}</span>
              <span>·</span>
              <span className="font-khmer">{settings.schoolNameKhmer}</span>
              <span>·</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1">
                <span>🏢</span>
                <span>{currentBranch.nameKhmer}</span>
                <span className="font-mono text-[10px] bg-white/80 px-1 rounded border border-amber-200">
                  {currentBranch.code}
                </span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-khmer">
              {t('ផ្ទាំងសង្ខេប & គ្រប់គ្រងទូទៅ (Executive Overview)', 'Administrative & Financial Ledger')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl font-khmer">
              {t(
                'ប្រព័ន្ធគ្រប់គ្រងរបាយការណ៍សាលា រួមមាន៖ ការបង់ថ្លៃសិក្សាសិស្ស ការលក់សម្ភារៈប្រចាំថ្ងៃ ថ្លៃទីតាំងអ្នកលក់អាហារ និងការលក់ឯកសណ្ឋានសិស្ស។',
                'Comprehensive administrative management system covering student tuition fees, stationery sales, canteen vendor fees, and uniform sales.'
              )}
            </p>
          </div>

          {/* Quick Active User Badge & Permissions info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                {currentUser.khmerName.slice(0, 1)}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs font-khmer">{currentUser.khmerName}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-amber-700">
                    Role: {currentUser.role}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[10px] text-slate-500">
                    {permissions.canDelete ? 'Full Access' : permissions.canEdit ? 'Edit Only' : 'Read Only'}
                  </span>
                </div>
              </div>
            </div>

            {settings.telegramConfig.enabled && (
              <div
                onClick={() => setActiveTab('system_settings')}
                className="cursor-pointer bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl px-3.5 py-3 flex items-center gap-2 text-sky-800 transition-colors"
                title="Telegram Bot Alert Configured"
              >
                <Send className="w-4 h-4 text-sky-600" />
                <div className="text-[11px] leading-tight font-medium">
                  <span className="font-bold font-mono">Telegram Alerts</span>
                  <div className="text-[10px] text-sky-600">Active Channel</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grand Consolidated Revenue Matrix */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="font-khmer">{t('ប្រាក់ចំណូលសរុបគ្រប់ផ្នែក', 'Consolidated Total Revenue')}</span>
              <span>·</span>
              <span className="font-mono">1 USD = {exchangeRate.toLocaleString()} KHR</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-4">
              <span className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-white">
                {totalIncomeKHR.toLocaleString()}៛
              </span>
              <span className="text-lg sm:text-2xl font-bold font-mono text-amber-400">
                ≈ ${Number(totalIncomeUSD).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-khmer">
              គណនាដោយស្វ័យប្រវត្តិចេញពី៖ ថ្លៃសិក្សា ({totalTuitionKHR.toLocaleString()}៛) + សម្ភារៈ ({totalMaterialsKHR.toLocaleString()}៛) + អាហារដ្ឋាន ({totalCanteenKHR.toLocaleString()}៛) + ឯកសណ្ឋានគ្រប់ប្រភេទ ({totalUniformKHR.toLocaleString()}៛)
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveTab('daily_report')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-khmer transition-all shadow-xs"
            >
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>{t('របាយការណ៍បង់ប្រាក់ប្រចាំថ្ងៃ', 'Daily Payment Report')}</span>
            </button>
            <button
              onClick={() => setActiveTab('student_portal')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold font-khmer transition-all"
            >
              <UserCheck className="w-4 h-4 text-slate-600" />
              <span>{t('ផតថលសិស្ស', 'Student Portal')}</span>
            </button>
            <button
              onClick={() => setActiveTab('system_settings')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-khmer transition-all shadow-xs"
            >
              <Shield className="w-4 h-4" />
              <span>{t('កំណត់ប្រព័ន្ធ', 'Settings')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Administrative Streams */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Student Fees */}
        <div
          onClick={() => setActiveTab('student_fees')}
          className="group bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 cursor-pointer shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="text-xs font-bold text-slate-500 font-khmer">
              {t('ថ្លៃសិក្សាសិស្ស (Tuition)', 'Student Tuition Fees')}
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              ${totalTuitionUSD.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              ≈ {totalTuitionKHR.toLocaleString()}៛
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-khmer">{paidStudentsCount}/{allStudents.length} {t('នាក់បានបង់', 'paid')}</span>
            <span className="text-blue-600 font-bold group-hover:underline font-khmer">
              {t('ពិនិត្យបញ្ជី →', 'View Class →')}
            </span>
          </div>
        </div>

        {/* 2. Daily Materials */}
        <div
          onClick={() => setActiveTab('daily_materials')}
          className="group bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 cursor-pointer shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition-colors" />
            </div>
            <div className="text-xs font-bold text-slate-500 font-khmer">
              {t('សម្ភារៈលក់ប្រចាំថ្ងៃ', 'Daily Materials & Books')}
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {totalMaterialsKHR.toLocaleString()}៛
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              ≈ ${(totalMaterialsKHR / exchangeRate).toFixed(2)} USD
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-khmer">{dailyMaterials.items.length} {t('មុខទំនិញ', 'items')} ({totalMaterialsQty} pcs)</span>
            <span className="text-amber-600 font-bold group-hover:underline font-khmer">
              {t('ពិនិត្យតារាង →', 'Open Ledger →')}
            </span>
          </div>
        </div>

        {/* 3. Canteen Vendors */}
        <div
          onClick={() => setActiveTab('canteen_vendors')}
          className="group bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 cursor-pointer shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div className="text-xs font-bold text-slate-500 font-khmer">
              {t('ថ្លៃទីតាំងអាហារដ្ឋាន (ខែ ' + currentCanteenReport.month + ')', 'Canteen Vendor Fee')}
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {totalCanteenKHR.toLocaleString()}៛
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              ≈ ${(totalCanteenKHR / exchangeRate).toFixed(2)} USD
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-khmer">{totalVendorDays} {t('វត្តមានស្តង់', 'vendor days')}</span>
            <span className="text-emerald-600 font-bold group-hover:underline font-khmer">
              {t('ប្រវត្តិប្រចាំខែ →', 'Monthly History →')}
            </span>
          </div>
        </div>

        {/* 4. Uniform Sales */}
        <div
          onClick={() => setActiveTab('uniform_sales')}
          className="group bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 cursor-pointer shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Shirt className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
            <div className="text-xs font-bold text-slate-500 font-khmer">
              {t('ឯកសណ្ឋានសិស្សគ្រប់ប្រភេទ', 'Uniform Sales (All Types)')}
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {totalUniformKHR.toLocaleString()}៛
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              ≈ ${(totalUniformKHR / exchangeRate).toFixed(2)} USD
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-khmer">{totalUniformQty} {t('កំប្លេ/ឈុតលក់ចេញ', 'items sold')}</span>
            <span className="text-indigo-600 font-bold group-hover:underline font-khmer">
              {t('មើលទំហំ Matrix →', 'View Sizing →')}
            </span>
          </div>
        </div>
      </div>

      {/* Quick History & Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Quick History Shortcuts & Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                <h2 className="font-bold text-slate-900 text-sm font-khmer">
                  {t('ប្រវត្តិប្រតិបត្តិការ & កំណត់ត្រា (History & Ledgers)', 'Transaction Ledgers & History Records')}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {/* Material Sales History Tile */}
              <div
                onClick={() => setActiveTab('material_history')}
                className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {materialSalesHistory.length} records
                  </span>
                </div>
                <div className="font-bold text-slate-900 font-khmer text-xs mt-3">
                  {t('ប្រវត្តិលក់សម្ភារៈសិក្សា', 'Material Sales History')}
                </div>
                <div className="text-[11px] text-slate-500 font-khmer mt-0.5">
                  ពិនិត្យវិក្កយបត្រលក់ប្រចាំថ្ងៃ កាតសិស្ស និងសៀវភៅតាមដាន
                </div>
              </div>

              {/* Uniform Sales History Tile */}
              <div
                onClick={() => setActiveTab('uniform_history')}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                    <Shirt className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {uniformSalesHistory.length} records
                  </span>
                </div>
                <div className="font-bold text-slate-900 font-khmer text-xs mt-3">
                  {t('ប្រវត្តិលក់ឯកសណ្ឋានសិស្ស', 'Uniform Sales History')}
                </div>
                <div className="text-[11px] text-slate-500 font-khmer mt-0.5">
                  កំណត់ត្រាលក់អាវសិស្ស ខោកីឡា និងសំពត់តាមទំហំ
                </div>
              </div>

              {/* Canteen Monthly History Tile */}
              <div
                onClick={() => setActiveTab('canteen_vendors')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Store className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {Object.keys(canteenHistory).length} months
                  </span>
                </div>
                <div className="font-bold text-slate-900 font-khmer text-xs mt-3">
                  {t('កំណត់ត្រាអាហារដ្ឋានប្រចាំខែ', 'Monthly Canteen Archive')}
                </div>
                <div className="text-[11px] text-slate-500 font-khmer mt-0.5">
                  ខែបច្ចុប្បន្ន៖ {selectedCanteenMonth} · {currentCanteenReport.vendors.length} អាជីវករ
                </div>
              </div>

              {/* Student Portal & Profile Tile */}
              <div
                onClick={() => setActiveTab('student_portal')}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {allStudents.length} students
                  </span>
                </div>
                <div className="font-bold text-slate-900 font-khmer text-xs mt-3">
                  {t('ផតថលសិស្ស & កាតសម្គាល់', 'Student Profile & ID Card')}
                </div>
                <div className="text-[11px] text-slate-500 font-khmer mt-0.5">
                  ព័ត៌មានលម្អិត បង្កាន់ដៃបង់ថ្លៃសិក្សា និងទម្រង់កាតសិស្សផ្លូវការ
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Sign-off & System Governance */}
        <div className="space-y-4">
          {/* Institutional Governance Sign-offs */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-slate-900 text-sm font-khmer">
                {t('ការអនុម័ត និងបញ្ជាក់ឯកសារ', 'Official Approvals & Signatures')}
              </h2>
            </div>

            <div className="space-y-3 font-khmer text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  {t('នាយកសាលា (School Director)', 'School Director')}
                </div>
                <div className="font-bold text-slate-900 mt-1 text-sm">
                  {settings.directorName}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                  <span>✓ បានឃើញ និងឯកភាព</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  {t('ប្រធានគណនេយ្យ (Chief Accountant)', 'Chief Accountant')}
                </div>
                <div className="font-bold text-slate-900 mt-1 text-sm">
                  {settings.accountantName}
                </div>
                <div className="text-[11px] text-blue-700 font-medium mt-0.5 flex items-center gap-1">
                  <span>✓ បានរៀបចំ និងត្រួតពិនិត្យ</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                <div>ទូរស័ព្ទ៖ <span className="font-mono text-slate-800">{settings.phone}</span></div>
                <div>អាសយដ្ឋាន៖ <span className="text-slate-800">{settings.address}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
