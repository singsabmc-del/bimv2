// Admin → 31-day staff attendance grid (staff × day 1–31), built from Check In records,
// approved leave requests and work shifts. Printable on A4 landscape.
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { TeacherCheckInRecord, TeacherLeaveRequest, TeacherRecord } from '../types';
import { shiftFor } from '../utils/shifts';
import { Download, Printer, Search } from 'lucide-react';

const pad = (n: number) => String(n).padStart(2, '0');
const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
const KH_DAY_SHORT = ['អា', 'ច', 'អ', 'ពុ', 'ព្រ', 'សុ', 'ស'];
const toMin = (t?: string) => {
  if (!t) return NaN;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** P present · L late · A approved leave · O absent · - day off · '' future / not yet */
type Cell = 'P' | 'L' | 'A' | 'O' | '-' | '';
const CELL_UI: Record<Cell, string> = {
  P: 'text-emerald-700',
  L: 'bg-amber-100 text-amber-800 font-bold',
  A: 'bg-sky-100 text-sky-800 font-bold',
  O: 'bg-rose-100 text-rose-700 font-bold',
  '-': 'bg-slate-50 text-slate-300',
  '': 'text-slate-200',
};

export const StaffAttendance31DayReport: React.FC = () => {
  const { teachers, teacherCheckIn, settings } = useApp() as any;
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const [month, setMonth] = useState(todayIso.slice(0, 7));
  const [search, setSearch] = useState('');
  const [showResigned, setShowResigned] = useState(false);

  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const report = useMemo(() => {
    const records: TeacherCheckInRecord[] = teacherCheckIn.records || [];
    const leaves: TeacherLeaveRequest[] = (teacherCheckIn.leaveRequests || []).filter(
      (r: TeacherLeaveRequest) => r.status === 'approved' && (r.unit || 'day') === 'day'
    );
    const recIdx = new Map<string, TeacherCheckInRecord>();
    records.forEach((r) => recIdx.set(`${r.teacherId}_${r.date}`, r));
    const q = search.trim().toLowerCase();

    const rows = (teachers as TeacherRecord[])
      .filter((t) => showResigned || t.status !== 'resigned')
      .filter((t) => !q || t.nameKhmer.includes(q) || (t.nameEnglish || '').toLowerCase().includes(q) || (t.teacherCode || '').toLowerCase().includes(q))
      .map((t) => {
        const cells: Cell[] = [];
        let P = 0, L = 0, A = 0, O = 0, work = 0, mins = 0;
        for (let d = 1; d <= 31; d++) {
          if (d > daysInMonth) { cells.push(''); continue; }
          const iso = `${month}-${pad(d)}`;
          const rec = recIdx.get(`${t.id}_${iso}`);
          const onLeave = rec?.status === 'leave' || leaves.some((lr) => lr.teacherId === t.id && lr.fromDate <= iso && iso <= lr.toDate);
          const hasShift = !!shiftFor(teacherCheckIn, t.id, iso);
          let c: Cell = '';
          if (rec?.checkIn) {
            c = rec.status === 'late' ? 'L' : 'P';
            const w = toMin(rec.checkOut) - toMin(rec.checkIn);
            if (w > 0) mins += w;
          } else if (onLeave) c = 'A';
          else if (!hasShift) c = '-';
          else if (iso < todayIso) c = 'O';
          else c = '';
          if (hasShift && iso <= todayIso) work++;
          if (c === 'P') P++;
          if (c === 'L') { L++; }
          if (c === 'A') A++;
          if (c === 'O') O++;
          cells.push(c);
        }
        const present = P + L;
        const rate = work > 0 ? Math.round((present / Math.max(1, work - A)) * 100) : 0;
        return { t, cells, P, L, A, O, present, work, hours: Math.round(mins / 6) / 10, rate: Math.min(100, rate) };
      });

    const totals = rows.reduce(
      (s, r) => ({ present: s.present + r.present, L: s.L + r.L, A: s.A + r.A, O: s.O + r.O }),
      { present: 0, L: 0, A: 0, O: 0 }
    );
    return { rows, totals };
  }, [teachers, teacherCheckIn, month, search, showResigned, daysInMonth, todayIso]);

  const exportCSV = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['ល.រ', 'អត្តលេខ', 'ឈ្មោះ', 'តួនាទី', ...days.map(String), 'មក', 'យឺត', 'ច្បាប់', 'អត់ច្បាប់', 'ម៉ោង', '%'];
    const lines = [head.map(esc).join(',')].concat(
      report.rows.map((r, i) =>
        [i + 1, r.t.teacherCode, r.t.nameKhmer, r.t.position || '', ...r.cells, r.present, r.L, r.A, r.O, r.hours, r.rate].map(esc).join(',')
      )
    );
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `staff_attendance_31d_${month}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const dowOf = (d: number) => (d <= daysInMonth ? new Date(y, m - 1, d).getDay() : -1);

  return (
    <div className="space-y-3 font-khmer">
      <style>{`@media print { @page { size: A4 landscape; margin: 8mm; } }`}</style>

      {/* Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono" />
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ស្វែងរកបុគ្គលិក..." className="w-48 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm" />
          </div>
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input type="checkbox" className="accent-teal-600" checked={showResigned} onChange={(e) => setShowResigned(e.target.checked)} /> បង្ហាញអ្នកឈប់
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> CSV
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">
            <Printer className="h-4 w-4" /> បោះពុម្ព A4
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="no-print grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          ['បុគ្គលិក', report.rows.length, 'text-slate-900 bg-white'],
          ['មក (ដង)', report.totals.present, 'text-emerald-700 bg-emerald-50'],
          ['យឺត', report.totals.L, 'text-amber-700 bg-amber-50'],
          ['ច្បាប់', report.totals.A, 'text-sky-700 bg-sky-50'],
          ['អត់ច្បាប់', report.totals.O, 'text-rose-700 bg-rose-50'],
        ].map(([k, v, cls]) => (
          <div key={k as string} className={`rounded-xl border border-slate-200 px-3 py-2 ${cls}`}>
            <div className="text-[11px] text-slate-500">{k}</div>
            <div className="font-mono text-lg font-bold">{v as number}</div>
          </div>
        ))}
      </div>

      {/* Sheet */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 print:border-0 print:p-0">
        <div className="mb-3 text-center">
          <div className="font-muol text-sm text-slate-900">{settings?.schoolNameKhmer || 'សាលា អ៊ីរ៉ែលកម្ពុជា'}</div>
          <div className="font-muol mt-1 text-sm text-slate-900">របាយការណ៍វត្តមានបុគ្គលិក ៣១ ថ្ងៃ</div>
          <div className="mt-1 text-xs text-slate-600">ខែ{KH_MONTHS[m - 1]} ឆ្នាំ{y}</div>
        </div>

        <div className="overflow-auto max-h-[70vh] print:max-h-none print:overflow-visible">
          <table className="w-full border-separate border-spacing-0 text-[11px] print:text-[8px]">
            <thead>
              <tr>
                <th rowSpan={2} className="sticky left-0 top-0 z-30 border border-slate-300 bg-slate-100 px-1 py-1 w-7">ល.រ</th>
                <th rowSpan={2} className="sticky left-7 top-0 z-30 border border-slate-300 bg-slate-100 px-2 py-1 text-left min-w-[140px]">ឈ្មោះបុគ្គលិក</th>
                {days.map((d) => {
                  const dow = dowOf(d);
                  return (
                    <th key={d} className={`sticky top-0 z-20 border border-slate-300 px-0.5 py-0.5 w-6 min-w-6 ${dow === 0 || dow === 6 ? 'bg-slate-200' : 'bg-slate-100'} ${d > daysInMonth ? 'text-slate-300' : ''}`}>
                      {d}
                    </th>
                  );
                })}
                {['មក', 'យឺត', 'ច្បាប់', 'អត់', 'ម៉ោង', '%'].map((h) => (
                  <th key={h} rowSpan={2} className="sticky top-0 z-20 border border-slate-300 bg-amber-100 px-1 py-1 min-w-8">{h}</th>
                ))}
              </tr>
              <tr>
                {days.map((d) => {
                  const dow = dowOf(d);
                  return (
                    <th key={d} className={`sticky top-[22px] z-20 border border-slate-300 px-0 py-0.5 text-[9px] font-normal ${dow === 0 || dow === 6 ? 'bg-slate-200' : 'bg-slate-100'}`}>
                      {dow >= 0 ? KH_DAY_SHORT[dow] : ''}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {report.rows.length === 0 ? (
                <tr><td colSpan={39} className="p-6 text-center text-slate-400">មិនមានបុគ្គលិក</td></tr>
              ) : (
                report.rows.map((r, i) => (
                  <tr key={r.t.id} className="hover:bg-amber-50/50">
                    <td className="sticky left-0 z-10 border border-slate-200 bg-white px-1 text-center text-slate-500">{i + 1}</td>
                    <td className="sticky left-7 z-10 border border-slate-200 bg-white px-2 py-1 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{r.t.nameKhmer}</div>
                      <div className="text-[9px] text-slate-400">{r.t.position || r.t.teacherCode}</div>
                    </td>
                    {r.cells.map((c, di) => (
                      <td key={di} className={`border border-slate-200 text-center ${CELL_UI[c]}`}>{c === 'P' ? '✓' : c}</td>
                    ))}
                    <td className="border border-slate-200 text-center font-bold text-emerald-700">{r.present}</td>
                    <td className="border border-slate-200 text-center text-amber-700">{r.L}</td>
                    <td className="border border-slate-200 text-center text-sky-700">{r.A}</td>
                    <td className="border border-slate-200 text-center text-rose-700">{r.O}</td>
                    <td className="border border-slate-200 text-center font-mono">{r.hours}</td>
                    <td className={`border border-slate-200 text-center font-bold ${r.rate >= 90 ? 'text-emerald-700' : r.rate >= 75 ? 'text-amber-700' : 'text-rose-700'}`}>{r.work ? `${r.rate}%` : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-600">
          <span><b className="text-emerald-700">✓</b> មកទាន់ម៉ោង</span>
          <span><b className="text-amber-700">L</b> មកយឺត</span>
          <span><b className="text-sky-700">A</b> ច្បាប់ (បានអនុម័ត)</span>
          <span><b className="text-rose-700">O</b> អត់ច្បាប់</span>
          <span><b className="text-slate-400">-</b> ថ្ងៃឈប់ / គ្មានវេន</span>
          <span>% = (មក + យឺត) ÷ (ថ្ងៃធ្វើការ − ច្បាប់)</span>
        </div>

        <div className="mt-8 hidden grid-cols-2 text-center text-xs print:grid">
          <div>
            <div>រៀបចំដោយ</div>
            <div className="mt-12">..............................</div>
          </div>
          <div>
            <div>បានឃើញ និងឯកភាព · នាយកសាលា</div>
            <div className="mt-12">{settings?.directorName || '..............................'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
