// Income Statistics → Cash Report: total money collected per income type for a date range (Riel)
import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  useAllTransactions, riel, longDate, monthRange, todayISO, isCashMethod,
  PrintButton, ReportToolbar, Field, inputCls, SheetHeader, XTable, td, Signatures,
} from './ReportKit';

const ROWS: { key: 'tuition' | 'uniform' | 'bus' | 'material' | 'canteen'; en: string; km: string }[] = [
  { key: 'tuition', en: 'Payment Student', km: 'ថ្លៃសិក្សាសិស្ស' },
  { key: 'uniform', en: 'Uniform Payment', km: 'ឯកសណ្ឋាន' },
  { key: 'bus', en: 'Student Transportation Service', km: 'សេវាដឹកជញ្ជូនសិស្ស' },
  { key: 'material', en: 'Sales Of Study Materials', km: 'លក់សម្ភារៈសិក្សា' },
  { key: 'canteen', en: 'Stall fee', km: 'ថ្លៃតូប' },
];

export const CashReportView: React.FC = () => {
  const { settings } = useApp();
  const all = useAllTransactions();
  const initial = monthRange(todayISO());
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  const stats = useMemo(() => {
    const inRange = all.filter((t) => t.date >= from && t.date <= to);
    const by: Record<string, { total: number; cash: number; bank: number; count: number }> = {};
    ROWS.forEach((r) => (by[r.key] = { total: 0, cash: 0, bank: 0, count: 0 }));
    inRange.forEach((t) => {
      const b = by[t.category];
      if (!b) return;
      b.total += t.amountKHR;
      b.count += 1;
      if (isCashMethod(t.paidBy)) b.cash += t.amountKHR;
      else b.bank += t.amountKHR;
    });
    const grand = ROWS.reduce((n, r) => n + by[r.key].total, 0);
    const cash = ROWS.reduce((n, r) => n + by[r.key].cash, 0);
    const bank = ROWS.reduce((n, r) => n + by[r.key].bank, 0);
    return { by, grand, cash, bank };
  }, [all, from, to]);

  return (
    <div className="space-y-4">
      <ReportToolbar title="ស្ថិតិចំណូល (Income Statistics)" subtitle="Cash Report · ទឹកប្រាក់សរុបដែលបានប្រមូល តាមផ្នែកនីមួយៗ">
        <Field label="ពីថ្ងៃ (From)">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
        </Field>
        <Field label="ដល់ថ្ងៃ (To)">
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
        </Field>
        <PrintButton />
      </ReportToolbar>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 no-print">
        {[
          ['សរុបទឹកប្រាក់ (Total)', stats.grand, 'text-teal-800 bg-teal-50 border-teal-200'],
          ['សាច់ប្រាក់ (Cash)', stats.cash, 'text-emerald-800 bg-emerald-50 border-emerald-200'],
          ['គណនី ABA / ធនាគារ', stats.bank, 'text-sky-800 bg-sky-50 border-sky-200'],
        ].map(([label, v, cls]) => (
          <div key={label as string} className={`rounded-2xl border p-4 ${cls}`}>
            <div className="text-xs font-bold font-khmer opacity-80">{label as string}</div>
            <div className="mt-1 font-mono text-xl font-black tabular-nums">{riel(v as number)}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 print:border-0 print:p-0">
        <SheetHeader title="ស្ថិតិចំណូល / Income Statistics" subtitle={`${longDate(from)} — ${longDate(to)}`} />
        <h3 className="mb-2 text-center font-muol text-sm text-slate-900">ទឹកប្រាក់សរុបដែលបានប្រមូល (Total Money Collected)</h3>
        <XTable
          head={['ល.រ', 'ផ្នែកហិរញ្ញវត្ថុ (Finance Department)', 'ចំនួនប្រតិបត្តិការ', 'សាច់ប្រាក់ (Cash)', 'គណនី ABA', 'ទឹកប្រាក់សរុប (Total Money Collected)']}
          foot={
            <tr>
              <td colSpan={3} className={`${td} text-right font-khmer`}>សរុបរួម (Total)</td>
              <td className={`${td} text-right font-mono`}>{riel(stats.cash)}</td>
              <td className={`${td} text-right font-mono`}>{riel(stats.bank)}</td>
              <td className={`${td} text-right font-mono text-sm`}>{riel(stats.grand)}</td>
            </tr>
          }
        >
          {ROWS.map((r, i) => (
            <tr key={r.key} className="hover:bg-amber-50/40">
              <td className={`${td} text-center font-mono`}>{i + 1}</td>
              <td className={td}>
                <div className="font-bold text-slate-900">{r.en}</div>
                <div className="text-[10px] text-slate-500">{r.km}</div>
              </td>
              <td className={`${td} text-center font-mono`}>{stats.by[r.key].count}</td>
              <td className={`${td} text-right font-mono`}>{riel(stats.by[r.key].cash)}</td>
              <td className={`${td} text-right font-mono`}>{riel(stats.by[r.key].bank)}</td>
              <td className={`${td} text-right font-mono font-bold`}>{riel(stats.by[r.key].total)}</td>
            </tr>
          ))}
        </XTable>
        <p className="mt-2 text-[10px] text-slate-500 font-khmer">
          ចំណាំ៖ ទឹកប្រាក់ដែលកត់ត្រាជាដុល្លារ ត្រូវបានប្តូរជារៀល តាមអត្រា 1 USD = {settings.exchangeRate.toLocaleString()} ៛
        </p>

        <Signatures blocks={[{ role: 'បេឡា' }, { role: 'រដ្ឋបាល' }, { role: 'គណនេយ្យ', name: settings.accountantName }]} />
        <Signatures blocks={[{ role: 'នាយក', name: settings.directorName }]} />
      </div>
    </div>
  );
};
