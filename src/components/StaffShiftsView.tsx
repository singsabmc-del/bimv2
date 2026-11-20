// Teacher Management → Work Shifts (គ្រប់គ្រងវេនការងារ): define shifts and assign them per staff per weekday
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ShiftDef, TeacherRecord } from '../types';
import { WEEKDAYS, shiftsOf, assignedShiftId, SHIFT_COLORS } from '../utils/shifts';
import { Plus, Trash2, Printer, Search, Clock, CopyCheck } from 'lucide-react';

const DAYS = WEEKDAYS.filter((w) => w.d !== 0); // Mon–Sat on the roster

export const StaffShiftsView: React.FC = () => {
  const { teachers, teacherCheckIn, setTeacherCheckIn, permissions, settings } = useApp() as any;
  const canEdit = !!permissions?.canEdit;
  const shifts: ShiftDef[] = shiftsOf(teacherCheckIn);
  const [q, setQ] = useState('');

  const setShifts = (next: ShiftDef[]) => setTeacherCheckIn((p: any) => ({ ...p, shifts: next }));
  const setCell = (staffId: string, weekday: number, shiftId: string) =>
    setTeacherCheckIn((p: any) => ({
      ...p,
      shiftAssignments: { ...(p.shiftAssignments || {}), [staffId]: { ...(p.shiftAssignments?.[staffId] || {}), [weekday]: shiftId } },
    }));
  const setRow = (staffId: string, shiftId: string) =>
    setTeacherCheckIn((p: any) => {
      const row: Record<number, string> = { ...(p.shiftAssignments?.[staffId] || {}) };
      DAYS.forEach((w) => (row[w.d] = w.d === 6 ? row[6] ?? 'off' : shiftId));
      return { ...p, shiftAssignments: { ...(p.shiftAssignments || {}), [staffId]: row } };
    });
  const setColumn = (weekday: number, shiftId: string) =>
    setTeacherCheckIn((p: any) => {
      const next = { ...(p.shiftAssignments || {}) };
      (teachers as TeacherRecord[]).forEach((t) => (next[t.id] = { ...(next[t.id] || {}), [weekday]: shiftId }));
      return { ...p, shiftAssignments: next };
    });

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (teachers as TeacherRecord[]).filter(
      (t) => t.status !== 'resigned' && (!s || t.nameKhmer.includes(s) || t.nameEnglish.toLowerCase().includes(s) || (t.position || '').toLowerCase().includes(s))
    );
  }, [teachers, q]);

  // How many staff work each shift on each weekday
  const coverage = useMemo(() => {
    const c: Record<number, Record<string, number>> = {};
    DAYS.forEach((w) => {
      c[w.d] = {};
      list.forEach((t) => {
        const id = assignedShiftId(teacherCheckIn, t.id, w.d);
        c[w.d][id] = (c[w.d][id] || 0) + 1;
      });
    });
    return c;
  }, [list, teacherCheckIn]);

  const color = (id: string) => (id === 'off' ? SHIFT_COLORS.slate : SHIFT_COLORS[shifts.find((s) => s.id === id)?.color || 'teal'] || SHIFT_COLORS.teal);
  const short = (id: string) => (id === 'off' ? 'ឈប់' : (shifts.find((s) => s.id === id)?.name || '?').split(' (')[0]);

  return (
    <div className="space-y-4 font-khmer">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">គ្រប់គ្រងវេនការងារ (Work Shifts)</h2>
          <p className="text-xs text-slate-500">កំណត់វេន និងចាត់វេនឱ្យបុគ្គលិកតាមថ្ងៃ · Check In គិតមកយឺត / ចេញមុន តាមវេនរបស់ម្នាក់ៗ</p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">
          <Printer className="h-4 w-4" /> បោះពុម្ព
        </button>
      </div>

      {/* Shift definitions */}
      <div className="no-print rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-bold text-slate-900">វេនការងារ</div>
          {canEdit && (
            <button
              onClick={() => setShifts([...shifts, { id: `s${Date.now()}`, name: 'វេនថ្មី', start: '08:00', end: '12:00', color: 'violet' }])}
              className="flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
            >
              <Plus className="h-3.5 w-3.5" /> បន្ថែមវេន
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {shifts.map((s, i) => (
            <div key={s.id} className={`flex flex-wrap items-center gap-2 rounded-xl border p-2 ${SHIFT_COLORS[s.color || 'teal']}`}>
              <Clock className="h-4 w-4 shrink-0" />
              <input
                disabled={!canEdit}
                value={s.name}
                onChange={(e) => setShifts(shifts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                className="min-w-0 flex-1 rounded-lg bg-white/70 px-2 py-1 text-xs font-bold text-slate-900"
              />
              <input disabled={!canEdit} type="time" value={s.start} onChange={(e) => setShifts(shifts.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} className="rounded-lg bg-white/70 px-1.5 py-1 text-xs" />
              <span className="text-xs">–</span>
              <input disabled={!canEdit} type="time" value={s.end} onChange={(e) => setShifts(shifts.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} className="rounded-lg bg-white/70 px-1.5 py-1 text-xs" />
              <select disabled={!canEdit} value={s.color || 'teal'} onChange={(e) => setShifts(shifts.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))} className="rounded-lg bg-white/70 px-1 py-1 text-[11px]">
                {Object.keys(SHIFT_COLORS).filter((c) => c !== 'slate').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {canEdit && shifts.length > 1 && (
                <button
                  onClick={() => {
                    if (!confirm(`លុបវេន «${s.name}»? បុគ្គលិកដែលមានវេននេះ នឹងប្រើវេនដំបូងជំនួស។`)) return;
                    setShifts(shifts.filter((_, j) => j !== i));
                  }}
                  className="rounded-lg p-1 text-slate-500 hover:bg-white/70 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly roster */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 print:border-0 print:p-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-muol text-sm text-slate-900">តារាងវេនការងារប្រចាំសប្តាហ៍</div>
            <div className="text-[11px] text-slate-500">{settings.schoolNameKhmer} · ឆ្នាំសិក្សា {settings.academicYear}</div>
          </div>
          <div className="no-print relative w-full sm:w-56">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ស្វែងរកបុគ្គលិក…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs" />
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-300">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-amber-400 text-slate-900">
                <th className="w-8 border-r border-amber-500 px-2 py-2">ល.រ</th>
                <th className="border-r border-amber-500 px-2 py-2 text-left">បុគ្គលិក</th>
                {DAYS.map((w) => (
                  <th key={w.d} className="border-r border-amber-500 px-1 py-2">
                    <div>{w.kh}</div>
                    {canEdit && (
                      <select
                        value=""
                        onChange={(e) => e.target.value && setColumn(w.d, e.target.value)}
                        className="no-print mt-1 w-full rounded bg-white/80 px-0.5 py-0.5 text-[10px] font-normal"
                        title="ដាក់វេនឱ្យគ្រប់គ្នាក្នុងថ្ងៃនេះ"
                      >
                        <option value="">ទាំងអស់…</option>
                        {shifts.map((s) => <option key={s.id} value={s.id}>{s.name.split(' (')[0]}</option>)}
                        <option value="off">ឈប់</option>
                      </select>
                    )}
                  </th>
                ))}
                {canEdit && <th className="no-print px-2 py-2">ច-ស</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list.map((t, i) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="border-r border-slate-200 px-2 py-1 text-center font-mono">{i + 1}</td>
                  <td className="border-r border-slate-200 px-2 py-1">
                    <div className="font-bold text-slate-900">{t.nameKhmer}</div>
                    <div className="text-[10px] text-slate-500">{t.position || t.homeroomClassName || ''}</div>
                  </td>
                  {DAYS.map((w) => {
                    const id = assignedShiftId(teacherCheckIn, t.id, w.d);
                    return (
                      <td key={w.d} className="border-r border-slate-200 px-1 py-1 text-center">
                        {canEdit ? (
                          <select
                            value={id}
                            onChange={(e) => setCell(t.id, w.d, e.target.value)}
                            className={`w-full rounded-lg border px-1 py-1 text-[11px] font-bold ${color(id)}`}
                          >
                            {shifts.map((s) => <option key={s.id} value={s.id}>{s.name.split(' (')[0]}</option>)}
                            <option value="off">ឈប់</option>
                          </select>
                        ) : (
                          <span className={`inline-block rounded-lg border px-2 py-0.5 text-[11px] font-bold ${color(id)}`}>{short(id)}</span>
                        )}
                      </td>
                    );
                  })}
                  {canEdit && (
                    <td className="no-print px-1 py-1 text-center">
                      <select value="" onChange={(e) => e.target.value && setRow(t.id, e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-1 py-1 text-[10px]" title="ដាក់វេនដូចគ្នា ចន្ទ–សុក្រ">
                        <option value="">ចន្ទ–សុក្រ…</option>
                        {shifts.map((s) => <option key={s.id} value={s.id}>{s.name.split(' (')[0]}</option>)}
                        <option value="off">ឈប់</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 text-[10px]">
                <td colSpan={2} className="border-r border-slate-200 px-2 py-1.5 text-right font-bold text-slate-600">
                  <CopyCheck className="mr-1 inline h-3.5 w-3.5" /> ចំនួនបុគ្គលិកតាមវេន
                </td>
                {DAYS.map((w) => (
                  <td key={w.d} className="border-r border-slate-200 px-1 py-1.5 text-center leading-tight">
                    {[...shifts.map((s) => s.id), 'off'].filter((id) => coverage[w.d]?.[id]).map((id) => (
                      <div key={id}>{short(id)}: <b>{coverage[w.d][id]}</b></div>
                    ))}
                  </td>
                ))}
                {canEdit && <td className="no-print" />}
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
          {shifts.map((s) => (
            <span key={s.id} className={`rounded-lg border px-2 py-0.5 ${SHIFT_COLORS[s.color || 'teal']}`}>{s.name}: {s.start}–{s.end}</span>
          ))}
          <span className={`rounded-lg border px-2 py-0.5 ${SHIFT_COLORS.slate}`}>ឈប់ = ថ្ងៃសម្រាក (មិនរាប់អវត្តមាន)</span>
        </div>
      </div>
    </div>
  );
};
