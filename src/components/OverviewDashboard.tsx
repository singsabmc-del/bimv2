import React, { useMemo, useState } from 'react';
import { collectAllTransactions } from '../utils/transactions';
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
    busEnrollments,
    busPayments,
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

  // ───────────── v2 design: daily card, KPI sparklines, 12-month chart ─────────────
  const todayISO = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const shiftDay = (d: number) => {
    const x = new Date(selectedDate);
    x.setDate(x.getDate() + d);
    setSelectedDate(x.toISOString().slice(0, 10));
  };

  const allTx = useMemo(
    () =>
      collectAllTransactions({
        classData,
        uniformSalesHistory,
        materialSalesHistory,
        busEnrollments,
        busPayments,
        canteenHistory,
        selectedCanteenMonth,
        settings,
        currentBranchId,
      }),
    [classData, uniformSalesHistory, materialSalesHistory, busEnrollments, busPayments, canteenHistory, selectedCanteenMonth, settings, currentBranchId]
  );

  const dayTx = allTx.filter((tx) => tx.date === selectedDate);
  const dayUSD = dayTx.reduce((s, tx) => s + (tx.amountUSD || 0), 0);
  const isCash = (m: string) => !m || m === 'Cash' || m === '$ -';
  const dayCashUSD = dayTx.filter((tx) => isCash(tx.paidBy)).reduce((s, tx) => s + (tx.amountUSD || 0), 0);
  const dayBankUSD = dayUSD - dayCashUSD;
  const monthKeySel = selectedDate.slice(0, 7);
  const monthUSD = allTx.filter((tx) => tx.date.startsWith(monthKeySel)).reduce((s, tx) => s + (tx.amountUSD || 0), 0);
  const outstandingUSD = Math.max(0, totalExpectedTuitionUSD - totalTuitionUSD);
  const unpaidCount = Math.max(0, allStudents.length - paidStudentsCount);

  // Last 12 months (ending at the selected month), per category
  const months12 = useMemo(() => {
    const out: string[] = [];
    const base = new Date(`${monthKeySel}-01T00:00:00`);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return out;
  }, [monthKeySel]);
  const seriesFor = (cats: string[]) =>
    months12.map((m) => allTx.filter((tx) => cats.includes(tx.category) && tx.date.startsWith(m)).reduce((s, tx) => s + (tx.amountUSD || 0), 0));
  const pctChange = (arr: number[]) => {
    const cur = arr[arr.length - 1];
    const prev = arr[arr.length - 2];
    if (!prev) return cur ? 100 : 0;
    return ((cur - prev) / prev) * 100;
  };
  const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const usd0 = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

  const kpis = [
    { key: 'tuition', label: t('ថ្លៃសិក្សា', 'Tuition'), value: usd(totalTuitionUSD), sub: `${paidStudentsCount}/${allStudents.length} ${t('នាក់បានបង់', 'paid')}`, cats: ['tuition'], icon: Users, tint: 'from-teal-50', bar: '#14b8a6', iconCls: 'text-teal-600', tab: 'student_fees' as NavTab },
    { key: 'material', label: t('សម្ភារៈ & POS', 'Supplies & POS'), value: `${totalMaterialsKHR.toLocaleString()}៛`, sub: `${totalMaterialsQty} ${t('មុខ', 'pcs')}`, cats: ['material'], icon: ShoppingBag, tint: 'from-amber-50', bar: '#f59e0b', iconCls: 'text-amber-600', tab: 'pos' as NavTab },
    { key: 'uniform', label: t('ឯកសណ្ឋាន', 'Uniforms'), value: `${totalUniformKHR.toLocaleString()}៛`, sub: `${totalUniformQty} ${t('ឈុត', 'sets')}`, cats: ['uniform'], icon: Shirt, tint: 'from-violet-50', bar: '#8b5cf6', iconCls: 'text-violet-600', tab: 'uniform_sales' as NavTab },
    { key: 'canteen', label: t('អាហារដ្ឋាន', 'Canteen'), value: `${totalCanteenKHR.toLocaleString()}៛`, sub: `${totalVendorDays} ${t('ថ្ងៃ-តូប', 'stall-days')}`, cats: ['canteen'], icon: Store, tint: 'from-rose-50', bar: '#f43f5e', iconCls: 'text-rose-500', tab: 'canteen_vendors' as NavTab },
  ];

  const chartCats = [
    { cats: ['tuition'], label: t('ថ្លៃសិក្សា', 'Tuition'), color: '#14b8a6' },
    { cats: ['material'], label: t('សម្ភារៈ', 'Supplies'), color: '#f59e0b' },
    { cats: ['uniform'], label: t('ឯកសណ្ឋាន', 'Uniforms'), color: '#8b5cf6' },
    { cats: ['bus', 'canteen'], label: t('សេវាផ្សេងៗ', 'Services'), color: '#f43f5e' },
  ].map((c) => ({ ...c, data: seriesFor(c.cats) }));
  const monthTotals = months12.map((_, i) => chartCats.reduce((s, c) => s + c.data[i], 0));
  const chartMax = Math.max(1, ...monthTotals);
  const KH_MON = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

  const quickPills: { label: string; tab: NavTab }[] = [
    { label: t('ថ្លៃសិក្សា', 'Tuition'), tab: 'student_fees' },
    { label: t('លក់ POS', 'POS'), tab: 'pos' },
    { label: t('ឯកសណ្ឋាន', 'Uniforms'), tab: 'uniform_sales' },
    { label: t('ឡានសាលា', 'School Bus'), tab: 'school_bus' },
    { label: t('អាហារដ្ឋាន', 'Canteen'), tab: 'canteen_vendors' },
    { label: t('វត្តមាន', 'Attendance'), tab: 'student_attendance' },
    { label: t('ពិន្ទុសិស្ស', 'Scores'), tab: 'academic_scores' },
    { label: t('បញ្ជីសិស្ស', 'Students'), tab: 'student_list' },
    { label: t('របាយការណ៍ប្រចាំថ្ងៃ', 'Daily Report'), tab: 'daily_report' },
  ];

  const Spark: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
    const max = Math.max(1, ...data);
    return (
      <svg viewBox="0 0 120 36" className="h-9 w-28" aria-hidden="true">
        {data.map((v, i) => {
          const h = v > 0 ? Math.max(3, (v / max) * 32) : 2;
          return <rect key={i} x={i * 10 + 1} y={36 - h} width="5" height={h} rx="1.5" fill={color} opacity={i === data.length - 1 ? 1 : v > 0 ? 0.45 : 0.18} />;
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-5">
      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500 px-6 py-7 text-white shadow-lg shadow-teal-700/20 sm:px-8 sm:py-8">
        <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 70 C200 20 380 110 600 70 C820 30 1000 100 1200 60 V120 H0 Z" fill="#ffffff" opacity="0.07" />
          <path d="M0 95 C240 60 420 120 660 92 C880 66 1040 110 1200 90 V120 H0 Z" fill="#ffffff" opacity="0.08" />
        </svg>
        <div className="pointer-events-none absolute left-[55%] top-8 h-1.5 w-1.5 rounded-full bg-white/50" />
        <div className="pointer-events-none absolute left-[70%] top-16 h-1 w-1 rounded-full bg-white/60" />
        {/* school building illustration */}
        <svg className="pointer-events-none absolute bottom-0 right-6 hidden h-40 w-56 md:block lg:right-12" viewBox="0 0 220 160" aria-hidden="true">
          <circle cx="182" cy="26" r="12" fill="#fde68a" opacity="0.9" />
          <rect x="18" y="62" width="62" height="98" rx="6" fill="#ccfbf1" opacity="0.85" />
          <rect x="88" y="34" width="70" height="126" rx="6" fill="#f0fdfa" />
          <rect x="166" y="78" width="38" height="82" rx="6" fill="#5eead4" opacity="0.9" />
          <path d="M88 34 L123 14 L158 34 Z" fill="#99f6e4" />
          <rect x="121" y="2" width="2" height="16" fill="#f0fdfa" />
          <path d="M123 3 h14 l-4 4 l4 4 h-14 Z" fill="#f43f5e" />
          {Array.from({ length: 5 }).map((_, r) =>
            [0, 1, 2].map((c) => <rect key={`a${r}${c}`} x={98 + c * 18} y={48 + r * 20} width="11" height="11" rx="2" fill="#5eead4" opacity={0.75} />)
          )}
          {Array.from({ length: 4 }).map((_, r) =>
            [0, 1].map((c) => <rect key={`b${r}${c}`} x={28 + c * 22} y={74 + r * 20} width="12" height="11" rx="2" fill="#14b8a6" opacity={0.55} />)
          )}
          <rect x="114" y="136" width="18" height="24" rx="3" fill="#14b8a6" />
        </svg>

        <div className="relative max-w-2xl">
          <h1 className="font-display text-2xl font-bold leading-snug sm:text-[28px]">
            {t('សូមស្វាគមន៍', 'Welcome')}, {currentUser.khmerName.split('(')[0].trim()} 👋
          </h1>
          <p className="mt-1.5 text-[13px] text-teal-50/90 font-khmer">
            {t('ខែនេះប្រមូលបាន', 'Collected this month')} <b className="font-mono text-white">{usd(monthUSD)}</b> · {t('សិស្ស', 'Students')}{' '}
            <b className="text-amber-300">{allStudents.length}</b> · {t('បានបង់', 'Paid')} <b className="text-white">{paidStudentsCount}</b> ·{' '}
            {t('ថ្នាក់', 'Classes')} <b className="text-white">{orderedClassList.length}</b> · <span className="opacity-80">{currentBranch.nameKhmer.split('(')[0].trim()}</span>
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveTab('student_fees')}
              className="rounded-2xl bg-white px-5 py-2.5 text-[13px] font-bold text-teal-800 shadow-sm transition hover:bg-teal-50 font-khmer"
            >
              + {t('ទទួលប្រាក់ថ្លៃសិក្សា', 'Receive Tuition')}
            </button>
            <button
              onClick={() => setActiveTab('pos')}
              className="rounded-2xl border border-white/40 bg-white/10 px-5 py-2.5 text-[13px] font-bold text-white backdrop-blur-sm transition hover:bg-white/20 font-khmer"
            >
              {t('លក់ POS', 'Open POS')} <span className="ml-1 rounded bg-white/20 px-1 font-mono text-[10px]">F2</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick pills ── */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {quickPills.map((p, i) => (
          <button
            key={p.tab}
            onClick={() => setActiveTab(p.tab)}
            className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-khmer transition ${
              i === 0 ? 'border-teal-700 bg-teal-700 font-bold text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Daily income card ── */}
      <div className="ui-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-[15px] font-bold text-slate-900">{t('ចំណូលប្រចាំថ្ងៃ', 'Daily Income')}</h2>
            {selectedDate === todayISO && <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 font-khmer">{t('ថ្ងៃនេះ', 'Today')}</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => shiftDay(-1)} className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-slate-500 hover:text-teal-700">‹</button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-mono text-[13px] text-slate-700"
            />
            <button onClick={() => shiftDay(1)} className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-slate-500 hover:text-teal-700">›</button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <button onClick={() => setActiveTab('daily_report')} className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-left transition hover:shadow-md">
            <div className="flex items-center justify-between text-[12px] text-emerald-700 font-khmer">
              <span>↗ {t('ចំណូល', 'Income')}</span>
              <span className="text-emerald-700/70">{dayTx.length} {t('ប្រតិបត្តិការ', 'transactions')}</span>
            </div>
            <div className="mt-2 font-mono text-[28px] font-bold leading-none text-emerald-700">{usd(dayUSD)}</div>
            <div className="mt-2 font-mono text-[11px] text-emerald-700/70">
              CASH {usd(dayCashUSD)} · BANK {usd(dayBankUSD)}
            </div>
          </button>
          <button onClick={() => setActiveTab('student_fees')} className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-left transition hover:shadow-md">
            <div className="flex items-center justify-between text-[12px] text-rose-600 font-khmer">
              <span>↘ {t('ថ្លៃសិក្សាមិនទាន់បង់', 'Outstanding Tuition')}</span>
              <span className="text-rose-600/70">{unpaidCount} {t('នាក់', 'students')}</span>
            </div>
            <div className="mt-2 font-mono text-[28px] font-bold leading-none text-rose-600">{usd(outstandingUSD)}</div>
            <div className="mt-2 text-[11px] text-rose-600/70 font-khmer">{t('សរុបនៅសល់ត្រូវប្រមូល', 'Remaining to collect')}</div>
          </button>
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white">
            <div className="text-[12px] text-slate-300 font-khmer">{t('ចំណូលខែនេះ (គ្រប់ប្រភព)', 'This Month (all streams)')}</div>
            <div className="mt-2 font-mono text-[28px] font-bold leading-none">{usd(monthUSD)}</div>
            <div className="mt-2 text-[11px] text-slate-400 font-khmer">
              {t('សរុបចំណូលទាំងអស់', 'Grand total')} {usd(Number(totalIncomeUSD))} · {totalIncomeKHR.toLocaleString()}៛
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI cards with sparklines ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const data = seriesFor(k.cats);
          const ch = pctChange(data);
          const Icon = k.icon;
          return (
            <button
              key={k.key}
              onClick={() => setActiveTab(k.tab)}
              className={`ui-card bg-gradient-to-br ${k.tint} to-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg`}
            >
              <div className="flex items-start justify-between">
                <div className="text-[12px] text-slate-500 font-khmer">{k.label}</div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Icon className={`h-[18px] w-[18px] ${k.iconCls}`} />
                </div>
              </div>
              <div className="mt-1 font-mono text-[22px] font-bold text-slate-900">{k.value}</div>
              <div className="mt-3 flex items-end justify-between">
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${
                    ch >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {ch >= 0 ? '↗' : '↘'}
                  {Math.abs(ch).toFixed(1)}%
                </span>
                <Spark data={data} color={k.bar} />
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-khmer">{k.sub}</div>
            </button>
          );
        })}
      </div>

      {/* ── Collection rate + 12-month chart ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="ui-card p-5">
          <h3 className="font-display text-[15px] font-bold text-slate-900">{t('ស្ថានភាពបង់ថ្លៃសិក្សា', 'Tuition Status')}</h3>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="bg-emerald-500" style={{ width: `${allStudents.length ? (paidStudentsCount / allStudents.length) * 100 : 0}%` }} />
            <div className="bg-rose-500" style={{ width: `${allStudents.length ? (unpaidCount / allStudents.length) * 100 : 0}%` }} />
          </div>
          <div className="mt-4 space-y-3 text-[13px] font-khmer">
            {[
              [t('បានបង់', 'Paid'), paidStudentsCount, 'bg-emerald-500'],
              [t('មិនទាន់បង់', 'Unpaid'), unpaidCount, 'bg-rose-500'],
              [t('ថ្នាក់រៀន', 'Classes'), orderedClassList.length, 'bg-teal-600'],
            ].map(([k, v, c]) => (
              <div key={String(k)} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-sm ${c}`} />
                  {k}
                </span>
                <span className="font-mono font-semibold text-slate-900">{v}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-slate-600">{t('អត្រាប្រមូល', 'Collection rate')}</span>
              <span className="font-mono font-bold text-teal-700">
                {totalExpectedTuitionUSD ? ((totalTuitionUSD / totalExpectedTuitionUSD) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        </div>

        <div className="ui-card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-[15px] font-bold text-slate-900">{t('ចំណូល ១២ ខែចុងក្រោយ', 'Income, last 12 months')}</h3>
              <p className="text-[11px] text-slate-400 font-khmer">{t('តាមប្រភពចំណូល (USD)', 'By income stream (USD)')}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 font-khmer">
              {chartCats.map((c) => (
                <span key={c.label} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  {c.label}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 flex h-48 items-end gap-2">
            {months12.map((m, i) => (
              <div key={m} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div className="font-mono text-[9px] text-slate-400 opacity-0 transition group-hover:opacity-100">{usd0(monthTotals[i])}</div>
                <div className="flex w-full max-w-[26px] flex-col-reverse overflow-hidden rounded-md" style={{ height: `${(monthTotals[i] / chartMax) * 100}%`, minHeight: 2 }}>
                  {chartCats.map((c) => (
                    <div key={c.label} style={{ height: `${monthTotals[i] ? (c.data[i] / monthTotals[i]) * 100 : 0}%`, background: c.color }} />
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 font-khmer">{KH_MON[Number(m.slice(5)) - 1].slice(0, 3)}</div>
              </div>
            ))}
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
