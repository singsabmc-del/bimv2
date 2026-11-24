// ប្រតិទិនការងារ — one calendar for everything with a date: school events, holidays, work-plan
// tasks, meetings, appointments, approved leave and requests' needed-by dates.
// Staff see their own items (plus school-wide events and holidays); Admin / Accounting see all.
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { AppointmentItem, HolidayDef, MeetingItem, SchoolEventItem, StaffRequestItem, TeacherLeaveRequest, WorkPlanTask } from '../types';
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { TaskForm } from './WorkPlanView';
import { ApptForm, MeetingForm } from './CollabView';

type Kind = 'event' | 'holiday' | 'task' | 'meeting' | 'appt' | 'leave' | 'request';
interface CalItem {
  id: string;
  kind: Kind;
  title: string;
  from: string;
  to: string;
  time?: string;
  sub?: string;
  go?: string; // page to open
  raw?: any;
}
const KIND: Record<Kind, { kh: string; dot: string; chip: string }> = {
  event: { kh: 'ព្រឹត្តិការណ៍', dot: 'bg-fuchsia-500', chip: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200' },
  holiday: { kh: 'ថ្ងៃឈប់', dot: 'bg-rose-600', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
  task: { kh: 'ការងារ', dot: 'bg-teal-500', chip: 'bg-teal-50 text-teal-800 border-teal-200' },
  meeting: { kh: 'ប្រជុំ', dot: 'bg-sky-500', chip: 'bg-sky-50 text-sky-800 border-sky-200' },
  appt: { kh: 'ណាត់ជួប', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-800 border-amber-200' },
  leave: { kh: 'ច្បាប់', dot: 'bg-orange-400', chip: 'bg-orange-50 text-orange-800 border-orange-200' },
  request: { kh: 'សំណើ', dot: 'bg-slate-500', chip: 'bg-slate-50 text-slate-700 border-slate-200' },
};
const ORDER: Kind[] = ['holiday', 'event', 'meeting', 'appt', 'task', 'leave', 'request'];
const AUD = { all: 'ទាំងអស់', staff: 'បុគ្គលិក', students: 'សិស្ស', parents: 'អាណាព្យាបាល' } as const;
const DOW = ['អា', 'ច', 'អ', 'ពុ', 'ព្រ', 'សុ', 'ស'];
const KH_M = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const fmt = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '');

export const WorkCalendarView: React.FC = () => {
  const { syncedEntries, syncedSet, currentUser, linkedTeacher, teacherCheckIn, showNotification, sendTelegramAlert } = useApp() as any;
  const isManager = currentUser.role === 'admin' || currentUser.role === 'accountant';
  const myName = currentUser.khmerName || currentUser.name;
  const myId: string | undefined = linkedTeacher?.id;
  const today = isoOf(new Date());
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(today);
  const [hidden, setHidden] = useState<Kind[]>([]);
  const [form, setForm] = useState<SchoolEventItem | null>(null);
  const [quick, setQuick] = useState<'task' | 'meeting' | 'appt' | null>(null);

  const val = <T,>(prefix: string): T[] => (syncedEntries(prefix) as [string, T][]).map(([, v]) => v).filter((v: any) => v && v.id);

  const items: CalItem[] = useMemo(() => {
    const out: CalItem[] = [];
    val<SchoolEventItem>('BIM_EVENT_').forEach((e) =>
      out.push({ id: e.id, kind: 'event', title: e.title, from: e.from, to: e.to || e.from, time: e.time, sub: [e.place, AUD[e.audience]].filter(Boolean).join(' · '), raw: e })
    );
    ((teacherCheckIn.holidays || []) as HolidayDef[]).forEach((h) => out.push({ id: h.id, kind: 'holiday', title: h.name, from: h.from, to: h.to || h.from }));
    val<WorkPlanTask>('BIM_WORKPLAN_')
      .filter((t) => t.status !== 'cancelled' && (isManager || t.createdBy === myName || (myId && t.assigneeIds.includes(myId))))
      .forEach((t) =>
        out.push({ id: t.id, kind: 'task', title: `${t.status === 'done' ? '✓ ' : ''}${t.title}`, from: t.dueDate, to: t.dueDate, time: t.dueTime, sub: `ផុតកំណត់ · ${t.assigneeNames.join(', ')} · ${t.progress}%`, go: 'work_plan' })
      );
    val<MeetingItem>('BIM_MEETING_')
      .filter((m) => m.status !== 'cancelled' && (isManager || m.createdBy === myName || (myId && m.attendeeIds.includes(myId))))
      .forEach((m) => out.push({ id: m.id, kind: 'meeting', title: m.title, from: m.date, to: m.date, time: m.startTime, sub: [m.place, `${m.attendeeIds.length} នាក់`].filter(Boolean).join(' · '), go: 'meetings' }));
    val<AppointmentItem>('BIM_APPT_')
      .filter((a) => a.status !== 'cancelled' && (isManager || a.createdBy === myName || a.hostId === myId))
      .forEach((a) => out.push({ id: a.id, kind: 'appt', title: `${a.visitorName}${a.studentName ? ' (' + a.studentName.split(' · ')[0] + ')' : ''}`, from: a.date, to: a.date, time: a.time, sub: `${a.purpose} · ${a.hostName || ''}`, go: 'meetings' }));
    ((teacherCheckIn.leaveRequests || []) as TeacherLeaveRequest[])
      .filter((r) => r.status === 'approved' && (isManager || r.teacherId === myId))
      .forEach((r) => out.push({ id: r.id, kind: 'leave', title: `${r.teacherName}`, from: r.fromDate, to: r.toDate || r.fromDate, time: r.unit === 'hour' ? r.fromTime : undefined, sub: r.unit === 'hour' ? `${r.fromTime}–${r.toTime} · ${r.reason}` : r.reason, go: 'teacher_leave' }));
    val<StaffRequestItem>('BIM_REQUEST_')
      .filter((r) => r.neededBy && (r.status === 'pending' || r.status === 'approved') && (isManager || r.requesterName === myName || r.requesterId === myId))
      .forEach((r) => out.push({ id: r.id, kind: 'request', title: r.title, from: r.neededBy!, to: r.neededBy!, sub: `ត្រូវការ · ${r.requesterName}`, go: 'meetings' }));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncedEntries, teacherCheckIn, isManager, myName, myId]);

  const shown = items.filter((i) => !hidden.includes(i.kind));
  const on = (iso: string) => shown.filter((i) => i.from <= iso && iso <= i.to).sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || (a.time || '').localeCompare(b.time || ''));

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(first, i - first.getDay()));
  const monthPrefix = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`;
  const monthCount = (k: Kind) => items.filter((i) => i.kind === k && i.from.slice(0, 7) <= monthPrefix && i.to.slice(0, 7) >= monthPrefix).length;
  const upcoming = shown.filter((i) => i.to >= today && i.from <= isoOf(addDays(new Date(), 7)) && i.kind !== 'holiday').sort((a, b) => (a.from + (a.time || '')).localeCompare(b.from + (b.time || '')));

  const newEvent = (): SchoolEventItem => ({ id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, title: '', from: selected, to: selected, audience: 'all', createdBy: myName, createdAt: new Date().toISOString() });
  const saveEvent = (e: SchoolEventItem) => {
    syncedSet('BIM_EVENT_' + e.id, { ...e, title: e.title.trim(), to: e.to < e.from ? e.from : e.to, updatedAt: new Date().toISOString() });
    const isNew = !items.some((i) => i.id === e.id);
    if (isNew) sendTelegramAlert?.('🗓️ ព្រឹត្តិការណ៍សាលា', [`📌 ${e.title.trim()}`, `📅 ${fmt(e.from)}${e.to && e.to !== e.from ? ' → ' + fmt(e.to) : ''}${e.time ? ' ម៉ោង ' + e.time : ''}`, ...(e.place ? [`📍 ${e.place}`] : []), `👥 ${AUD[e.audience]}`, ...(e.note ? [`📝 ${e.note}`] : [])].join('\n'), 'system');
    showNotification?.('បានរក្សាទុកព្រឹត្តិការណ៍', 'success');
    setForm(null);
  };

  const DayList: React.FC<{ iso: string }> = ({ iso }) => {
    const list = on(iso);
    if (!list.length) return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center text-xs text-slate-400">គ្មានអ្វីក្នុងថ្ងៃនេះ</div>;
    return (
      <div className="space-y-1.5">
        {list.map((i) => (
          <button
            key={i.kind + i.id}
            type="button"
            onClick={() => (i.kind === 'event' && isManager ? setForm(i.raw) : i.go ? (window.location.hash = i.go) : undefined)}
            className={`flex w-full min-w-0 items-start gap-2.5 rounded-2xl border p-2.5 text-left ${KIND[i.kind].chip}`}
          >
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${KIND[i.kind].dot}`} />
            {i.time && <span className="shrink-0 font-mono text-[11px] font-bold">{i.time}</span>}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{i.title}</span>
              {(i.sub || i.from !== i.to) && (
                <span className="block truncate text-[11px] opacity-80">
                  {i.from !== i.to ? `${fmt(i.from)} → ${fmt(i.to)}${i.sub ? ' · ' : ''}` : ''}{i.sub}
                </span>
              )}
            </span>
            <span className="shrink-0 rounded-full bg-white/70 px-1.5 text-[10px] font-bold">{KIND[i.kind].kh}</span>
          </button>
        ))}
      </div>
    );
  };

  const selDate = new Date(selected + 'T00:00:00');

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3 overflow-x-hidden font-khmer">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-3">
          {/* Month header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="rounded-xl border border-slate-200 p-2"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" onClick={() => { setCursor(new Date()); setSelected(today); }} className="flex-1 text-center text-base font-bold text-slate-900">ខែ{KH_M[cursor.getMonth()]} {cursor.getFullYear()}</button>
              <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="rounded-xl border border-slate-200 p-2"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <div className="mt-2 flex max-w-full gap-1.5 overflow-x-auto no-scrollbar">
              {ORDER.map((k) => {
                const off = hidden.includes(k);
                return (
                  <button key={k} type="button" onClick={() => setHidden(off ? hidden.filter((x) => x !== k) : [...hidden, k])}
                    className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${off ? 'border-slate-200 text-slate-400 line-through' : KIND[k].chip}`}>
                    <span className={`h-2 w-2 rounded-full ${KIND[k].dot}`} /> {KIND[k].kh} {monthCount(k) || ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Month grid */}
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs">
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400">{DOW.map((d, i) => <div key={d} className={`py-1 ${i === 0 ? 'text-rose-600' : ''}`}>{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {cells.map((d) => {
                const iso = isoOf(d);
                const inMonth = d.getMonth() === cursor.getMonth();
                const list = on(iso);
                const hol = list.find((i) => i.kind === 'holiday');
                const sel = iso === selected;
                return (
                  <button key={iso} type="button" onClick={() => setSelected(iso)}
                    className={`flex min-h-[3rem] min-w-0 flex-col items-stretch rounded-xl border p-0.5 text-left sm:min-h-[5.5rem] sm:p-1 ${!inMonth ? 'opacity-35' : ''} ${sel ? 'border-teal-500 ring-2 ring-teal-200' : 'border-transparent'} ${hol || d.getDay() === 0 ? 'bg-rose-50' : ''}`}>
                    <span className={`self-center text-xs sm:self-start ${iso === today ? 'flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 font-bold text-white' : hol || d.getDay() === 0 ? 'font-mono font-bold text-rose-600' : 'font-mono text-slate-700'}`}>{d.getDate()}</span>
                    {/* phone: dots · wider screens: short labels */}
                    <span className="mt-0.5 flex flex-wrap justify-center gap-0.5 sm:hidden">
                      {list.slice(0, 5).map((i) => <span key={i.kind + i.id} className={`h-1.5 w-1.5 rounded-full ${KIND[i.kind].dot}`} />)}
                    </span>
                    <span className="mt-0.5 hidden space-y-0.5 sm:block">
                      {list.slice(0, 3).map((i) => (
                        <span key={i.kind + i.id} className={`block truncate rounded px-1 text-[10px] leading-4 ${KIND[i.kind].chip}`}>{i.time ? i.time + ' ' : ''}{i.title}</span>
                      ))}
                      {list.length > 3 && <span className="block text-[10px] text-slate-400">+{list.length - 3}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Day agenda + next 7 days */}
        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className={`text-sm font-bold ${selDate.getDay() === 0 || on(selected).some((i) => i.kind === 'holiday') ? 'text-rose-600' : 'text-slate-800'}`}>{DOW[selDate.getDay()]} {fmt(selected)}</div>
          </div>
          <div className={`grid gap-1.5 text-xs font-bold ${isManager ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
            <button type="button" onClick={() => setQuick('task')} className="flex items-center justify-center gap-1 rounded-xl border border-teal-200 bg-teal-50 px-2 py-2 text-teal-800"><Plus className="h-3.5 w-3.5" /> ការងារ</button>
            <button type="button" onClick={() => setQuick('appt')} className="flex items-center justify-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2 py-2 text-amber-800"><Plus className="h-3.5 w-3.5" /> ណាត់ជួប</button>
            <button type="button" onClick={() => setQuick('meeting')} className="flex items-center justify-center gap-1 rounded-xl border border-sky-200 bg-sky-50 px-2 py-2 text-sky-800"><Plus className="h-3.5 w-3.5" /> ប្រជុំ</button>
            {isManager && <button type="button" onClick={() => setForm(newEvent())} className="flex items-center justify-center gap-1 rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-2 py-2 text-fuchsia-800"><Plus className="h-3.5 w-3.5" /> ព្រឹត្តិការណ៍</button>}
          </div>
          <DayList iso={selected} />
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="mb-2 text-xs font-bold text-slate-600">៧ ថ្ងៃខាងមុខ</div>
            {upcoming.length === 0 ? (
              <div className="text-xs text-slate-400">គ្មាន</div>
            ) : (
              <div className="space-y-1">
                {upcoming.slice(0, 12).map((i) => (
                  <button key={i.kind + i.id} type="button" onClick={() => { setSelected(i.from < today ? today : i.from); setCursor(new Date((i.from < today ? today : i.from) + 'T00:00:00')); }} className="flex w-full items-center gap-2 text-left text-xs">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${KIND[i.kind].dot}`} />
                    <span className="w-14 shrink-0 font-mono text-slate-500">{fmt(i.from).slice(0, 5)}</span>
                    <span className="min-w-0 flex-1 truncate">{i.time ? <b>{i.time} </b> : null}{i.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {quick === 'task' && <TaskForm date={selected} onClose={() => setQuick(null)} />}
      {quick === 'appt' && <ApptForm date={selected} onClose={() => setQuick(null)} />}
      {quick === 'meeting' && <MeetingForm date={selected} onClose={() => setQuick(null)} />}
      {form && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={() => setForm(null)}>
          <div className="w-full max-w-md space-y-3 rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="text-base font-bold text-slate-900">ព្រឹត្តិការណ៍សាលា</div>
              <button onClick={() => setForm(null)} className="rounded-lg p-1.5 text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            {(() => {
              const f = form;
              const set = (p: Partial<SchoolEventItem>) => setForm({ ...f, ...p });
              const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';
              const lbl = 'flex flex-col gap-1 text-xs font-bold text-slate-600';
              const exists = items.some((i) => i.id === f.id);
              return (
                <>
                  <label className={lbl}>ឈ្មោះព្រឹត្តិការណ៍ *<input value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="ឧ. ប្រឡងឆមាសទី១ / ទិវាកុមារ" className={inp} /></label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={lbl}>ពីថ្ងៃ<input type="date" value={f.from} onChange={(e) => set({ from: e.target.value, to: f.to < e.target.value ? e.target.value : f.to })} className={inp} /></label>
                    <label className={lbl}>ដល់ថ្ងៃ<input type="date" value={f.to} min={f.from} onChange={(e) => set({ to: e.target.value })} className={inp} /></label>
                    <label className={lbl}>ម៉ោង<input type="time" value={f.time || ''} onChange={(e) => set({ time: e.target.value })} className={inp} /></label>
                    <label className={lbl}>ទីកន្លែង<input value={f.place || ''} onChange={(e) => set({ place: e.target.value })} className={inp} /></label>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(AUD) as (keyof typeof AUD)[]).map((k) => (
                      <button key={k} type="button" onClick={() => set({ audience: k })} className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${f.audience === k ? 'border-fuchsia-600 bg-fuchsia-600 text-white' : 'border-slate-200 text-slate-600'}`}>{AUD[k]}</button>
                    ))}
                  </div>
                  <label className={lbl}>កំណត់សម្គាល់<textarea rows={2} value={f.note || ''} onChange={(e) => set({ note: e.target.value })} className={`${inp} font-normal`} /></label>
                  <div className="flex gap-2">
                    {exists && <button onClick={() => { if (confirm('លុបព្រឹត្តិការណ៍នេះ?')) { syncedSet('BIM_EVENT_' + f.id, null); setForm(null); } }} className="rounded-xl border border-rose-200 px-3 text-rose-600"><Trash2 className="h-4 w-4" /></button>}
                    <button onClick={() => saveEvent(f)} disabled={!f.title.trim()} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white disabled:opacity-40">រក្សាទុក</button>
                  </div>
                  <p className="text-[11px] text-slate-500">ថ្ងៃឈប់សម្រាក កែនៅ ការកំណត់ប្រព័ន្ធ → ថ្ងៃបុណ្យឈប់សម្រាក</p>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
