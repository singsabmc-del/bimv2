// Daily School Revenue → Student Payment History (ប្រវត្តិបង់ថ្លៃសិក្សា): every tuition payment, school-wide
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { StudentFeePaymentItem, StudentFeeRecord } from '../types';
import { normalizeDateToISO } from '../utils/transactions';
import { StudentInvoiceHistoryTable } from './StudentInvoiceHistoryTable';
import { Search, Printer, Download, X, Receipt } from 'lucide-react';

const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dmy = (iso: string) => (iso || '').split('-').reverse().join('-');
const riel = (n: number) => `${Math.round(n || 0).toLocaleString('en-US')} ៛`;
const payBy = (p?: string) => (!p || p === '$ -' ? 'Cash' : p);

interface Row {
  key: string;
  date: string; // ISO
  receipt: StudentFeePaymentItem;
  student: StudentFeeRecord;
  classId: string;
  className: string;
  months: string[];
  usd: number;
  khr: number;
}

export const StudentPaymentHistoryView: React.FC = () => {
  const { classData, orderedClassList, settings } = useApp();
  const rate = settings.exchangeRate || 4100;
  const now = new Date();
  const [from, setFrom] = useState(isoOf(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(isoOf(now));
  const [classId, setClassId] = useState('all');
  const [method, setMethod] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Row | null>(null);

  const all: Row[] = useMemo(() => {
    const out: Row[] = [];
    Object.values(classData || {}).forEach((cls) =>
      cls.students.forEach((st) =>
        (st.feeHistory || []).forEach((rec, i) => {
          const date = normalizeDateToISO(rec.date);
          if (!date) return;
          const months = rec.months?.length ? rec.months : (rec.month || '').split(',').map((m) => m.trim()).filter(Boolean);
          const usd = Number(rec.amountUSD) || 0;
          out.push({
            key: `${cls.classId}-${st.id}-${rec.receiptNo || i}-${i}`,
            date,
            receipt: rec,
            student: st,
            classId: cls.classId,
            className: cls.className,
            months,
            usd,
            khr: rec.amountKHR || Math.round(usd * rate),
          });
        })
      )
    );
    return out.sort((a, b) => b.date.localeCompare(a.date) || (b.receipt.receiptNo || '').localeCompare(a.receipt.receiptNo || ''));
  }, [classData, rate]);

  const methods = useMemo(() => Array.from(new Set(all.map((r) => payBy(r.receipt.paidBy)))).sort(), [all]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all.filter(
      (r) =>
        r.date >= from &&
        r.date <= to &&
        (classId === 'all' || r.classId === classId) &&
        (method === 'all' || payBy(r.receipt.paidBy) === method) &&
        (!s ||
          r.student.name.toLowerCase().includes(s) ||
          (r.student.latinName || '').toLowerCase().includes(s) ||
          (r.student.studentCode || '').toLowerCase().includes(s) ||
          (r.receipt.receiptNo || '').toLowerCase().includes(s) ||
          (r.receipt.invoiceNo || '').toLowerCase().includes(s))
    );
  }, [all, from, to, classId, method, q]);

  const totals = useMemo(() => {
    const byMethod: Record<string, { n: number; usd: number; khr: number }> = {};
    let usd = 0, khr = 0, monthsCount = 0;
    const students = new Set<string>();
    rows.forEach((r) => {
      usd += r.usd;
      khr += r.khr;
      monthsCount += r.months.length || 1;
      students.add(`${r.classId}-${r.student.id}`);
      const m = payBy(r.receipt.paidBy);
      byMethod[m] ??= { n: 0, usd: 0, khr: 0 };
      byMethod[m].n++;
      byMethod[m].usd += r.usd;
      byMethod[m].khr += r.khr;
    });
    return { usd, khr, monthsCount, students: students.size, byMethod };
  }, [rows]);

  const exportCsv = () => {
    const head = ['Date', 'Receipt', 'Invoice', 'Student Code', 'Student Name', 'Gender', 'Class', 'Months', 'Amount USD', 'Amount KHR', 'Pay by', 'Recorded by', 'Note'];
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map((r) =>
      [dmy(r.date), r.receipt.receiptNo, r.receipt.invoiceNo, r.student.studentCode, r.student.name, r.student.gender, r.className, r.months.join(' / '), r.usd.toFixed(2), Math.round(r.khr), payBy(r.receipt.paidBy), r.receipt.recordedBy, r.receipt.note]
        .map(esc)
        .join(',')
    );
    const blob = new Blob(['﻿' + [head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `student-payment-history_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const inputCls = 'rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-teal-400 focus:outline-none';

  return (
    <div className="space-y-4 font-khmer">
      <div className="no-print flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">ប្រវត្តិបង់ថ្លៃសិក្សា (Student Payment History)</h2>
          <p className="text-xs text-slate-500">ការបង់ថ្លៃសិក្សាទាំងអស់ · ចុចលើជួរ ដើម្បីមើលវិក្កយបត្រ និងប្រវត្តិរបស់សិស្សនោះ</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">ពីថ្ងៃ<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} /></label>
          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">ដល់ថ្ងៃ<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} /></label>
          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">
            ថ្នាក់
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputCls}>
              <option value="all">ទាំងអស់</option>
              {orderedClassList.map((c) => <option key={c.classId} value={c.classId}>{c.className}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">
            បង់តាម
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
              <option value="all">ទាំងអស់</option>
              {methods.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
            <Download className="h-4 w-4" /> Excel/CSV
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">
            <Printer className="h-4 w-4" /> បោះពុម្ព
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="no-print grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-3">
          <div className="text-[11px] font-bold text-teal-800">សរុបទឹកប្រាក់</div>
          <div className="font-mono text-lg font-black text-teal-900">${totals.usd.toFixed(2)}</div>
          <div className="font-mono text-[11px] text-teal-700">{riel(totals.khr)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="text-[11px] font-bold text-slate-500">ការបង់ប្រាក់</div>
          <div className="font-mono text-lg font-black text-slate-900">{rows.length}</div>
          <div className="text-[11px] text-slate-500">សិស្ស {totals.students} នាក់ · {totals.monthsCount} ខែ</div>
        </div>
        {Object.entries(totals.byMethod).slice(0, 2).map(([m, v]) => (
          <div key={m} className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-bold text-slate-500">{m} ({v.n})</div>
            <div className="font-mono text-lg font-black text-slate-900">${v.usd.toFixed(2)}</div>
            <div className="font-mono text-[11px] text-slate-500">{riel(v.khr)}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 print:border-0 print:p-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-muol text-sm text-slate-900">ប្រវត្តិបង់ថ្លៃសិក្សា</div>
            <div className="text-[11px] text-slate-500">{settings.schoolNameKhmer} · {dmy(from)} — {dmy(to)}</div>
          </div>
          <div className="no-print relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ឈ្មោះ / កូដ / លេខវិក្កយបត្រ…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs" />
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-300">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-amber-400 text-slate-900">
                {['ល.រ', 'កាលបរិច្ឆេទ', 'លេខវិក្កយបត្រ', 'សិស្ស', 'ថ្នាក់', 'ខែដែលបង់', 'ទឹកប្រាក់ ($)', 'ទឹកប្រាក់ (៛)', 'បង់តាម', 'អ្នកទទួល'].map((h) => (
                  <th key={h} className="border-r border-amber-500 px-2 py-2 text-center font-bold last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.length === 0 && (
                <tr><td colSpan={10} className="py-8 text-center text-slate-400">មិនមានការបង់ប្រាក់ក្នុងចន្លោះពេលនេះ</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.key} onClick={() => setOpen(r)} className="cursor-pointer hover:bg-teal-50/60">
                  <td className="border-r border-slate-200 px-2 py-1.5 text-center font-mono">{i + 1}</td>
                  <td className="border-r border-slate-200 px-2 py-1.5 text-center font-mono">{dmy(r.date)}</td>
                  <td className="border-r border-slate-200 px-2 py-1.5 text-center font-mono text-[11px] text-indigo-700">{r.receipt.invoiceNo || r.receipt.receiptNo}</td>
                  <td className="border-r border-slate-200 px-2 py-1.5">
                    <div className="font-bold text-slate-900">{r.student.name}</div>
                    <div className="font-mono text-[10px] text-slate-500">{r.student.studentCode}</div>
                  </td>
                  <td className="border-r border-slate-200 px-2 py-1.5 text-center">{r.className}</td>
                  <td className="border-r border-slate-200 px-2 py-1.5 text-center text-[11px]">
                    {r.months.map((m) => m.split(' ')[0]).join(', ')}
                    {r.months.length > 1 && <span className="ml-1 rounded bg-sky-100 px-1 text-[10px] font-bold text-sky-800">{r.months.length} ខែ</span>}
                  </td>
                  <td className="border-r border-slate-200 px-2 py-1.5 text-right font-mono font-bold">${r.usd.toFixed(2)}</td>
                  <td className="border-r border-slate-200 px-2 py-1.5 text-right font-mono">{Math.round(r.khr).toLocaleString('en-US')}</td>
                  <td className="border-r border-slate-200 px-2 py-1.5 text-center">{payBy(r.receipt.paidBy)}</td>
                  <td className="px-2 py-1.5 text-center text-[11px] text-slate-600">{r.receipt.recordedBy || '-'}</td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-amber-100 font-bold">
                  <td colSpan={6} className="border-r border-slate-200 px-2 py-2 text-right">សរុប (Total)</td>
                  <td className="border-r border-slate-200 px-2 py-2 text-right font-mono">${totals.usd.toFixed(2)}</td>
                  <td className="border-r border-slate-200 px-2 py-2 text-right font-mono">{Math.round(totals.khr).toLocaleString('en-US')}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3" onClick={() => setOpen(null)}>
          <div className="w-full max-w-5xl rounded-2xl bg-white p-4 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Receipt className="h-4 w-4 text-teal-700" /> {open.student.name} · {open.className}
              </div>
              <button onClick={() => setOpen(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <StudentInvoiceHistoryTable student={open.student} className={open.className} showTitle={true} defaultTab="tuition" />
          </div>
        </div>
      )}
    </div>
  );
};
