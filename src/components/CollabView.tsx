// ការប្រជុំ · ការណាត់ជួប · សំណើ — meetings (agenda, RSVP, minutes → work-plan tasks),
// appointments with guardians / visitors, and staff requests with approval.
// Each item is its own shared-store key so devices never overwrite each other.
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { AppointmentItem, MeetingItem, StaffRequestItem, TeacherRecord, WorkPlanTask } from '../types';
import { holidayOn } from '../utils/shifts';
import { CalendarClock, Check, ClipboardList, FileQuestion, MapPin, Plus, Printer, Search, Trash2, Users, X } from 'lucide-react';

const P = { meeting: 'BIM_MEETING_', appt: 'BIM_APPT_', request: 'BIM_REQUEST_' } as const;
const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmt = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '');
const uid = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
const money = (n?: number) => (n ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '');

const useCollab = () => {
  const app = useApp() as any;
  const { syncedEntries, syncedSet, currentUser, linkedTeacher, teachers } = app;
  const isManager = currentUser.role === 'admin' || currentUser.role === 'accountant';
  const myName = currentUser.khmerName || currentUser.name;
  const myId: string | undefined = linkedTeacher?.id;
  const list = <T,>(prefix: string): T[] => (syncedEntries(prefix) as [string, T][]).map(([, v]) => v).filter((v: any) => v && v.id);
  const put = (prefix: string, item: any) => syncedSet(prefix + item.id, { ...item, updatedAt: new Date().toISOString() });
  const del = (prefix: string, id: string) => syncedSet(prefix + id, null);
  const staff: TeacherRecord[] = (teachers as TeacherRecord[]).filter((t) => t.status !== 'resigned');
  return { ...app, isManager, myName, myId, list, put, del, staff };
};

// ---------- small UI bits ----------
const Sheet: React.FC<{ title: string; onClose: () => void; footer?: React.ReactNode; children: React.ReactNode }> = ({ title, onClose, footer, children }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={onClose}>
    <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-2xl font-khmer sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="text-base font-bold text-slate-900">{title}</div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
      </div>
      <div className="space-y-3 overflow-y-auto px-4 py-3 text-sm">{children}</div>
      {footer && <div className="flex gap-2 border-t border-slate-100 px-4 py-3">{footer}</div>}
    </div>
  </div>
);
const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal';
const lbl = 'flex flex-col gap-1 text-xs font-bold text-slate-600';
const Lines: React.FC<{ value: string[]; onChange: (v: string[]) => void; placeholder: string; add: string }> = ({ value, onChange, placeholder, add }) => (
  <>
    {value.map((v, i) => (
      <div key={i} className="flex gap-1.5">
        <span className="w-5 pt-2 text-right text-slate-400">{i + 1}.</span>
        <input value={v} placeholder={placeholder} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} className={inp} />
        <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded-lg px-2 text-rose-500 hover:bg-rose-50"><X className="h-4 w-4" /></button>
      </div>
    ))}
    <button type="button" onClick={() => onChange([...value, ''])} className="self-start rounded-lg bg-slate-100 px-2.5 py-1 text-[11px]">{add}</button>
  </>
);
const StaffPicker: React.FC<{ staff: TeacherRecord[]; value: string[]; onChange: (v: string[]) => void }> = ({ staff, value, onChange }) => {
  const [q, setQ] = useState('');
  const shown = staff.filter((s) => !q.trim() || s.nameKhmer.includes(q.trim()) || (s.nameEnglish || '').toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ស្វែងរកបុគ្គលិក" className={`${inp} pl-8`} />
        </div>
        <button type="button" onClick={() => onChange(value.length === staff.length ? [] : staff.map((s) => s.id))} className="rounded-lg border border-slate-200 px-2 text-[11px]">{value.length === staff.length ? 'ដោះទាំងអស់' : 'ទាំងអស់'}</button>
      </div>
      <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto font-normal">
        {shown.map((s) => (
          <button key={s.id} type="button" onClick={() => onChange(value.includes(s.id) ? value.filter((x) => x !== s.id) : [...value, s.id])}
            className={`rounded-full border px-2.5 py-1 text-[11px] ${value.includes(s.id) ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-700'}`}>{s.nameKhmer}</button>
        ))}
      </div>
    </>
  );
};
const Pill: React.FC<{ cls: string; children: React.ReactNode }> = ({ cls, children }) => <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{children}</span>;

// =====================================================================  MEETINGS
const M_STATUS = { scheduled: ['បានកំណត់', 'bg-sky-100 text-sky-800'], done: ['បានប្រជុំ', 'bg-emerald-100 text-emerald-800'], cancelled: ['លុបចោល', 'bg-rose-50 text-rose-500'] } as const;

const MeetingForm: React.FC<{ initial?: MeetingItem; onClose: () => void }> = ({ initial, onClose }) => {
  const { put, staff, myName, sendTelegramAlert, showNotification, teacherCheckIn } = useCollab();
  const today = isoOf(new Date());
  const [m, setM] = useState<MeetingItem>(initial || { id: uid('mt'), title: '', date: today, startTime: '14:00', endTime: '15:00', place: '', attendeeIds: [], attendeeNames: [], agenda: [''], status: 'scheduled', createdBy: myName, createdAt: new Date().toISOString() });
  const set = (p: Partial<MeetingItem>) => setM((x) => ({ ...x, ...p }));
  const hol = holidayOn(teacherCheckIn, m.date);
  const valid = m.title.trim() && m.date && m.startTime && m.attendeeIds.length > 0;
  const save = () => {
    if (!valid) return;
    const names = m.attendeeIds.map((id) => staff.find((s: TeacherRecord) => s.id === id)?.nameKhmer || '');
    const item = { ...m, title: m.title.trim(), attendeeNames: names, agenda: m.agenda.map((a) => a.trim()).filter(Boolean) };
    put(P.meeting, item);
    if (!initial || initial.date !== m.date || initial.startTime !== m.startTime) {
      sendTelegramAlert?.(initial ? '📅 ការប្រជុំត្រូវបានប្តូរពេល' : '📅 ការអញ្ជើញប្រជុំ', [
        `📌 ${item.title}`, `🕒 ${fmt(item.date)} ម៉ោង ${item.startTime}${item.endTime ? '–' + item.endTime : ''}`, ...(item.place ? [`📍 ${item.place}`] : []),
        `👥 ${names.join(', ')}`, ...(item.agenda.length ? ['📋 របៀបវារៈ៖', ...item.agenda.map((a, i) => `  ${i + 1}. ${a}`)] : []), `ដោយ៖ ${myName}`,
      ].join('\n'), 'system');
    }
    showNotification?.('បានរក្សាទុកការប្រជុំ', 'success');
    onClose();
  };
  return (
    <Sheet title={initial ? 'កែការប្រជុំ' : 'កំណត់ការប្រជុំ'} onClose={onClose} footer={<button onClick={save} disabled={!valid} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white disabled:opacity-40">រក្សាទុក & ផ្ញើការអញ្ជើញ</button>}>
      <label className={lbl}>ប្រធានបទ *<input value={m.title} onChange={(e) => set({ title: e.target.value })} placeholder="ឧ. ប្រជុំបុគ្គលិកប្រចាំខែ" className={inp} /></label>
      <div className="grid grid-cols-3 gap-2">
        <label className={`${lbl} col-span-3 sm:col-span-1`}>ថ្ងៃ<input type="date" value={m.date} onChange={(e) => set({ date: e.target.value })} className={inp} /></label>
        <label className={lbl}>ចាប់ផ្តើម<input type="time" value={m.startTime} onChange={(e) => set({ startTime: e.target.value })} className={inp} /></label>
        <label className={lbl}>បញ្ចប់<input type="time" value={m.endTime || ''} onChange={(e) => set({ endTime: e.target.value })} className={inp} /></label>
      </div>
      {hol && <div className="rounded-lg bg-violet-50 px-2 py-1.5 text-[11px] text-violet-800">🎉 ថ្ងៃនេះជាថ្ងៃឈប់សម្រាក ({hol.name})</div>}
      <label className={lbl}>ទីកន្លែង / Link<input value={m.place || ''} onChange={(e) => set({ place: e.target.value })} placeholder="បន្ទប់ប្រជុំ ឬ Google Meet / Zoom link" className={inp} /></label>
      <div className={lbl}>អ្នកចូលរួម * ({m.attendeeIds.length})<StaffPicker staff={staff} value={m.attendeeIds} onChange={(v) => set({ attendeeIds: v })} /></div>
      <div className={lbl}>របៀបវារៈ<Lines value={m.agenda} onChange={(v) => set({ agenda: v })} placeholder="ចំណុចពិភាក្សា" add="+ បន្ថែមចំណុច" /></div>
    </Sheet>
  );
};

const MeetingDetail: React.FC<{ m: MeetingItem; onClose: () => void; onEdit: () => void }> = ({ m, onClose, onEdit }) => {
  const { put, del, isManager, myName, myId, staff, settings, syncedSet, sendTelegramAlert, showNotification } = useCollab();
  const canEdit = isManager || m.createdBy === myName;
  const [minutes, setMinutes] = useState(m.minutes || '');
  const [decisions, setDecisions] = useState(m.decisions || []);
  const rsvp = (a: 'yes' | 'no' | 'maybe') => myId && put(P.meeting, { ...m, rsvp: { ...(m.rsvp || {}), [myId]: a } });
  const saveMinutes = (close: boolean) => {
    put(P.meeting, { ...m, minutes, decisions: decisions.filter((d) => d.text.trim()), ...(close ? { status: 'done' } : {}) });
    showNotification?.('បានរក្សាទុកកំណត់ហេតុប្រជុំ', 'success');
  };
  // turn a decision into a work-plan task for its owner
  const toTask = (i: number) => {
    const d = decisions[i];
    if (!d.text.trim() || !d.ownerId) return alert('សូមជ្រើសអ្នកទទួលខុសត្រូវជាមុនសិន');
    const task: WorkPlanTask = {
      id: uid('wp'), title: d.text.trim(), description: `ពីការប្រជុំ «${m.title}» ថ្ងៃ ${fmt(m.date)}`, category: 'ប្រជុំ',
      assigneeIds: [d.ownerId], assigneeNames: [d.ownerName || ''], startDate: isoOf(new Date()), dueDate: d.dueDate || isoOf(new Date()),
      priority: 'normal', status: 'todo', progress: 0, checklist: [], comments: [], createdBy: myName, createdAt: new Date().toISOString(),
    };
    syncedSet('BIM_WORKPLAN_' + task.id, task);
    const next = decisions.map((x, j) => (j === i ? { ...x, taskId: task.id } : x));
    setDecisions(next);
    put(P.meeting, { ...m, minutes, decisions: next });
    sendTelegramAlert?.('📋 ការងារពីការប្រជុំ', [`📌 ${task.title}`, `👤 ${task.assigneeNames[0]}`, `📅 ផុតកំណត់ ${fmt(task.dueDate)}`].join('\n'), 'system');
  };
  const print = () => {
    const w = window.open('', '_blank');
    if (!w) return alert('សូមអនុញ្ញាត Pop-up ដើម្បីបោះពុម្ព');
    const ans = (id: string) => ({ yes: 'ចូលរួម', no: 'អវត្តមាន', maybe: 'មិនប្រាកដ' } as any)[m.rsvp?.[id] || ''] || '';
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>កំណត់ហេតុប្រជុំ</title><link href="https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Moul&display=swap" rel="stylesheet"/>
      <style>@page{size:A4;margin:16mm}body{font-family:Battambang,sans-serif;font-size:13px;line-height:1.8}h2{font-family:Moul,serif;font-weight:400;text-align:center}table{border-collapse:collapse;width:100%}td,th{border:1px solid #333;padding:3px 6px}.c{text-align:center}.sign{display:flex;justify-content:space-between;margin-top:30px;text-align:center}.sign div{width:40%}</style></head><body>
      <div class="c"><b>${esc(settings?.schoolNameKhmer || '')}</b></div><h2>កំណត់ហេតុប្រជុំ</h2>
      <p><b>ប្រធានបទ៖</b> ${esc(m.title)}<br/><b>ថ្ងៃ៖</b> ${fmt(m.date)} ម៉ោង ${esc(m.startTime)}${m.endTime ? '–' + esc(m.endTime) : ''}<br/><b>ទីកន្លែង៖</b> ${esc(m.place || '')}</p>
      <p><b>អ្នកចូលរួម (${m.attendeeIds.length})៖</b></p><table><tr><th>ល.រ</th><th>ឈ្មោះ</th><th>ចម្លើយ</th><th>ហត្ថលេខា</th></tr>${m.attendeeIds.map((id, i) => `<tr><td class="c">${i + 1}</td><td>${esc(m.attendeeNames[i])}</td><td>${ans(id)}</td><td></td></tr>`).join('')}</table>
      ${m.agenda.length ? `<p><b>របៀបវារៈ៖</b></p><ol>${m.agenda.map((a) => `<li>${esc(a)}</li>`).join('')}</ol>` : ''}
      <p><b>ខ្លឹមសារប្រជុំ៖</b><br/>${esc(minutes).replace(/\n/g, '<br/>')}</p>
      ${decisions.length ? `<p><b>សេចក្តីសម្រេច / ការងារត្រូវធ្វើ៖</b></p><table><tr><th>ល.រ</th><th>ការងារ</th><th>អ្នកទទួលខុសត្រូវ</th><th>ផុតកំណត់</th></tr>${decisions.map((d, i) => `<tr><td class="c">${i + 1}</td><td>${esc(d.text)}</td><td>${esc(d.ownerName || '')}</td><td>${fmt(d.dueDate)}</td></tr>`).join('')}</table>` : ''}
      <div class="sign"><div>លេខាធិការ<br/><br/><br/>..............................</div><div>ប្រធានអង្គប្រជុំ<br/><br/><br/><b>${esc(settings?.directorName || '')}</b></div></div>
      <script>window.onload=function(){setTimeout(function(){window.print()},400)}</script></body></html>`);
    w.document.close();
  };
  const counts = { yes: 0, no: 0, maybe: 0 } as Record<string, number>;
  Object.values(m.rsvp || {}).forEach((a) => counts[a]++);
  return (
    <Sheet title={m.title} onClose={onClose} footer={<>
      {canEdit && <button onClick={() => confirm('លុបការប្រជុំនេះ?') && (del(P.meeting, m.id), onClose())} className="rounded-xl border border-rose-200 px-3 text-rose-600"><Trash2 className="h-4 w-4" /></button>}
      <button onClick={print} className="rounded-xl border border-slate-200 px-3"><Printer className="h-4 w-4" /></button>
      {canEdit && <button onClick={onEdit} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold">កែ</button>}
      {canEdit && m.status === 'scheduled' && <button onClick={() => confirm('លុបចោលការប្រជុំ?') && put(P.meeting, { ...m, status: 'cancelled' })} className="rounded-xl border border-slate-200 px-3 text-xs">លុបចោល</button>}
    </>}>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-slate-50 p-2"><div className="text-slate-500">ពេលវេលា</div><b>{fmt(m.date)} · {m.startTime}{m.endTime ? '–' + m.endTime : ''}</b></div>
        <div className="rounded-xl bg-slate-50 p-2"><div className="text-slate-500">ទីកន្លែង</div><b className="break-all">{m.place?.startsWith('http') ? <a className="text-sky-700 underline" href={m.place} target="_blank" rel="noreferrer">ចូលរួម Online</a> : m.place || '-'}</b></div>
      </div>
      <div>
        <div className="mb-1 text-xs font-bold text-slate-600">អ្នកចូលរួម ({m.attendeeIds.length}) · ✅ {counts.yes} · ❌ {counts.no} · ❔ {counts.maybe}</div>
        <div className="flex flex-wrap gap-1">
          {m.attendeeIds.map((id, i) => {
            const a = m.rsvp?.[id];
            return <span key={id} className={`rounded-full border px-2 py-0.5 text-[11px] ${a === 'yes' ? 'border-emerald-300 bg-emerald-50' : a === 'no' ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200'}`}>{a === 'yes' ? '✅ ' : a === 'no' ? '❌ ' : a === 'maybe' ? '❔ ' : ''}{m.attendeeNames[i]}</span>;
          })}
        </div>
        {myId && m.attendeeIds.includes(myId) && m.status === 'scheduled' && (
          <div className="mt-2 grid grid-cols-3 gap-1.5 text-xs font-bold">
            {([['yes', '✅ ចូលរួម'], ['maybe', '❔ មិនប្រាកដ'], ['no', '❌ មិនបាន']] as const).map(([k, l]) => (
              <button key={k} onClick={() => rsvp(k)} className={`rounded-lg border py-2 ${m.rsvp?.[myId] === k ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200'}`}>{l}</button>
            ))}
          </div>
        )}
      </div>
      {m.agenda.length > 0 && (
        <div><div className="mb-1 text-xs font-bold text-slate-600">របៀបវារៈ</div><ol className="list-decimal space-y-0.5 pl-5 text-xs">{m.agenda.map((a, i) => <li key={i}>{a}</li>)}</ol></div>
      )}
      {canEdit && m.status !== 'cancelled' && (
        <div className="space-y-2 rounded-xl border border-slate-200 p-2.5">
          <div className="text-xs font-bold text-slate-600">កំណត់ហេតុប្រជុំ</div>
          <textarea rows={4} value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="ខ្លឹមសារពិភាក្សា…" className={inp} />
          <div className="text-xs font-bold text-slate-600">សេចក្តីសម្រេច / ការងារត្រូវធ្វើ</div>
          {decisions.map((d, i) => (
            <div key={i} className="space-y-1 rounded-lg bg-slate-50 p-2">
              <div className="flex gap-1.5">
                <input value={d.text} onChange={(e) => setDecisions(decisions.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} placeholder="ការងារ" className={inp} />
                <button type="button" onClick={() => setDecisions(decisions.filter((_, j) => j !== i))} className="rounded-lg px-2 text-rose-500"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex gap-1.5">
                <select value={d.ownerId || ''} onChange={(e) => setDecisions(decisions.map((x, j) => (j === i ? { ...x, ownerId: e.target.value, ownerName: staff.find((s: TeacherRecord) => s.id === e.target.value)?.nameKhmer } : x)))} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm">
                  <option value="">អ្នកទទួលខុសត្រូវ…</option>
                  {staff.map((s: TeacherRecord) => <option key={s.id} value={s.id}>{s.nameKhmer}</option>)}
                </select>
                <input type="date" value={d.dueDate || ''} onChange={(e) => setDecisions(decisions.map((x, j) => (j === i ? { ...x, dueDate: e.target.value } : x)))} className="w-36 shrink-0 rounded-lg border border-slate-200 px-2 py-2 text-sm" />
              </div>
              {d.taskId ? <div className="text-[11px] font-bold text-emerald-700">✓ បានបង្កើតក្នុងផែនការការងារ</div> : <button type="button" onClick={() => toTask(i)} className="text-[11px] font-bold text-indigo-700">→ បង្កើតជាការងារក្នុងផែនការការងារ</button>}
            </div>
          ))}
          <button type="button" onClick={() => setDecisions([...decisions, { text: '' }])} className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px]">+ បន្ថែមសេចក្តីសម្រេច</button>
          <div className="flex gap-2">
            <button onClick={() => saveMinutes(false)} className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-bold">រក្សាទុក</button>
            {m.status === 'scheduled' && <button onClick={() => saveMinutes(true)} className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white">រក្សាទុក & បិទការប្រជុំ</button>}
          </div>
        </div>
      )}
      {!canEdit && m.minutes && <div className="whitespace-pre-line rounded-xl bg-slate-50 p-2.5 text-xs">{m.minutes}</div>}
      <div className="text-[10px] text-slate-400">រៀបចំដោយ {m.createdBy}</div>
    </Sheet>
  );
};

// =====================================================================  APPOINTMENTS
const A_STATUS = { pending: ['រង់ចាំបញ្ជាក់', 'bg-amber-100 text-amber-800'], confirmed: ['បានបញ្ជាក់', 'bg-sky-100 text-sky-800'], done: ['បានជួប', 'bg-emerald-100 text-emerald-800'], cancelled: ['លុបចោល', 'bg-rose-50 text-rose-500'], no_show: ['មិនមក', 'bg-slate-200 text-slate-600'] } as const;
const A_TYPE = { guardian: 'អាណាព្យាបាល', visitor: 'ភ្ញៀវ', partner: 'ដៃគូ', other: 'ផ្សេងៗ' } as const;

const ApptForm: React.FC<{ initial?: AppointmentItem; onClose: () => void }> = ({ initial, onClose }) => {
  const { put, staff, myName, myId, sendTelegramAlert, showNotification, teacherCheckIn, classData } = useCollab();
  const today = isoOf(new Date());
  const [a, setA] = useState<AppointmentItem>(initial || { id: uid('ap'), visitorName: '', visitorType: 'guardian', hostId: myId, date: today, time: '09:00', purpose: '', status: 'pending', createdBy: myName, createdAt: new Date().toISOString() });
  const set = (p: Partial<AppointmentItem>) => setA((x) => ({ ...x, ...p }));
  const students = useMemo(() => Object.values(classData || {}).flatMap((c: any) => (c.students || []).map((s: any) => ({ name: s.name, cls: c.className, guardian: s.guardianName, phone: s.guardianPhone || s.phone }))), [classData]);
  const hol = holidayOn(teacherCheckIn, a.date);
  const valid = a.visitorName.trim() && a.purpose.trim() && a.date && a.time;
  const save = () => {
    if (!valid) return;
    const item = { ...a, hostName: staff.find((s: TeacherRecord) => s.id === a.hostId)?.nameKhmer || a.hostName };
    put(P.appt, item);
    if (!initial) sendTelegramAlert?.('🤝 ការណាត់ជួបថ្មី', [`👤 ${item.visitorName} (${A_TYPE[item.visitorType]})${item.visitorPhone ? ' ☎ ' + item.visitorPhone : ''}`, ...(item.studentName ? [`🎒 សិស្ស៖ ${item.studentName}`] : []), `🕒 ${fmt(item.date)} ម៉ោង ${item.time}`, `🧑‍🏫 ជួបជាមួយ៖ ${item.hostName || '-'}`, `📝 ${item.purpose}`].join('\n'), 'system');
    showNotification?.('បានរក្សាទុកការណាត់ជួប', 'success');
    onClose();
  };
  return (
    <Sheet title={initial ? 'កែការណាត់ជួប' : 'ណាត់ជួបថ្មី'} onClose={onClose} footer={<button onClick={save} disabled={!valid} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white disabled:opacity-40">រក្សាទុក</button>}>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(A_TYPE) as (keyof typeof A_TYPE)[]).map((k) => (
          <button key={k} type="button" onClick={() => set({ visitorType: k })} className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${a.visitorType === k ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200 text-slate-600'}`}>{A_TYPE[k]}</button>
        ))}
      </div>
      {a.visitorType === 'guardian' && (
        <label className={lbl}>សិស្ស (ជម្រើស)
          <input list="appt-students" value={a.studentName || ''} onChange={(e) => {
            const s = students.find((x: any) => `${x.name} · ${x.cls}` === e.target.value);
            set(s ? { studentName: e.target.value, visitorName: a.visitorName || s.guardian || '', visitorPhone: a.visitorPhone || s.phone || '' } : { studentName: e.target.value });
          }} placeholder="វាយឈ្មោះសិស្ស" className={inp} />
          <datalist id="appt-students">{students.map((s: any, i: number) => <option key={i} value={`${s.name} · ${s.cls}`} />)}</datalist>
        </label>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className={lbl}>ឈ្មោះអ្នកមកជួប *<input value={a.visitorName} onChange={(e) => set({ visitorName: e.target.value })} className={inp} /></label>
        <label className={lbl}>ទូរស័ព្ទ<input value={a.visitorPhone || ''} onChange={(e) => set({ visitorPhone: e.target.value })} inputMode="tel" className={inp} /></label>
        <label className={lbl}>ថ្ងៃ<input type="date" value={a.date} onChange={(e) => set({ date: e.target.value })} className={inp} /></label>
        <label className={lbl}>ម៉ោង<input type="time" value={a.time} onChange={(e) => set({ time: e.target.value })} className={inp} /></label>
      </div>
      {hol && <div className="rounded-lg bg-violet-50 px-2 py-1.5 text-[11px] text-violet-800">🎉 ថ្ងៃនេះជាថ្ងៃឈប់សម្រាក ({hol.name})</div>}
      <label className={lbl}>ជួបជាមួយ
        <select value={a.hostId || ''} onChange={(e) => set({ hostId: e.target.value })} className={inp}>
          <option value="">— ជ្រើសបុគ្គលិក —</option>
          {staff.map((s: TeacherRecord) => <option key={s.id} value={s.id}>{s.nameKhmer}{s.position ? ' · ' + s.position : ''}</option>)}
        </select>
      </label>
      <label className={lbl}>ទីកន្លែង<input value={a.place || ''} onChange={(e) => set({ place: e.target.value })} placeholder="ការិយាល័យ" className={inp} /></label>
      <label className={lbl}>គោលបំណង *<textarea rows={2} value={a.purpose} onChange={(e) => set({ purpose: e.target.value })} className={inp} /></label>
    </Sheet>
  );
};

// =====================================================================  REQUESTS
const R_CAT = { materials: 'សម្ភារៈសិក្សា', equipment: 'ឧបករណ៍', repair: 'ជួសជុល', budget: 'ថវិកា', other: 'ផ្សេងៗ' } as const;
const R_STATUS = { pending: ['រង់ចាំ', 'bg-amber-100 text-amber-800'], approved: ['អនុម័ត', 'bg-sky-100 text-sky-800'], rejected: ['បដិសេធ', 'bg-rose-100 text-rose-700'], done: ['បានផ្តល់', 'bg-emerald-100 text-emerald-800'] } as const;

const RequestForm: React.FC<{ initial?: StaffRequestItem; onClose: () => void }> = ({ initial, onClose }) => {
  const { put, myName, myId, sendTelegramAlert, showNotification } = useCollab();
  const [r, setR] = useState<StaffRequestItem>(initial || { id: uid('rq'), category: 'materials', title: '', items: [{ name: '', qty: 1 }], requesterId: myId, requesterName: myName, status: 'pending', createdAt: new Date().toISOString() });
  const set = (p: Partial<StaffRequestItem>) => setR((x) => ({ ...x, ...p }));
  const items = r.items || [];
  const total = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
  const valid = r.title.trim();
  const save = () => {
    if (!valid) return;
    const item = { ...r, title: r.title.trim(), items: items.filter((it) => it.name.trim()), amount: total || r.amount };
    put(P.request, item);
    if (!initial) sendTelegramAlert?.('📨 សំណើថ្មី', [`📌 ${item.title} (${R_CAT[item.category]})`, `👤 ${item.requesterName}`, ...(item.items || []).map((it) => `• ${it.name} × ${it.qty}${it.unitPrice ? ` ($${it.unitPrice})` : ''}`), ...(item.amount ? [`💵 សរុប ${money(item.amount)}`] : []), ...(item.neededBy ? [`📅 ត្រូវការមុន ${fmt(item.neededBy)}`] : []), ...(item.details ? [`📝 ${item.details}`] : []), 'សូម Admin ពិនិត្យ និងអនុម័ត។'].join('\n'), 'system');
    showNotification?.('បានផ្ញើសំណើ', 'success');
    onClose();
  };
  return (
    <Sheet title={initial ? 'កែសំណើ' : 'សំណើថ្មី'} onClose={onClose} footer={<button onClick={save} disabled={!valid} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white disabled:opacity-40">ផ្ញើសំណើ</button>}>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(R_CAT) as (keyof typeof R_CAT)[]).map((k) => (
          <button key={k} type="button" onClick={() => set({ category: k })} className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${r.category === k ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200 text-slate-600'}`}>{R_CAT[k]}</button>
        ))}
      </div>
      <label className={lbl}>ចំណងជើង *<input value={r.title} onChange={(e) => set({ title: e.target.value })} placeholder="ឧ. ស្នើសុំក្រដាស A4 និងទឹកខ្មៅ" className={inp} /></label>
      <div className={lbl}>
        មុខទំនិញ / ការងារ
        {items.map((it, i) => (
          <div key={i} className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/60 p-2">
            <div className="flex items-center gap-1.5">
              <span className="w-5 shrink-0 text-center text-slate-400">{i + 1}.</span>
              <input value={it.name} onChange={(e) => set({ items: items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} placeholder="ឈ្មោះមុខទំនិញ ឬការងារ" className={inp} />
              <button type="button" onClick={() => set({ items: items.filter((_, j) => j !== i) })} className="shrink-0 rounded-lg p-2 text-rose-500 hover:bg-rose-50"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-1.5 pl-6 text-[11px] font-normal text-slate-500">
              <label className="flex flex-col gap-0.5">ចំនួន
                <input type="number" min={1} inputMode="numeric" value={it.qty} onChange={(e) => set({ items: items.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)) })} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm" />
              </label>
              <label className="flex flex-col gap-0.5">តម្លៃរាយ ($)
                <input type="number" min={0} step="0.01" inputMode="decimal" value={it.unitPrice ?? ''} onChange={(e) => set({ items: items.map((x, j) => (j === i ? { ...x, unitPrice: e.target.value === '' ? undefined : Number(e.target.value) } : x)) })} placeholder="0.00" className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm" />
              </label>
              <div className="flex flex-col gap-0.5">សរុប
                <div className="rounded-lg bg-white px-2 py-2 text-center font-mono text-sm text-slate-800">{it.unitPrice ? money((Number(it.qty) || 0) * it.unitPrice) : '—'}</div>
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => set({ items: [...items, { name: '', qty: 1 }] })} className="self-start rounded-lg bg-slate-100 px-2.5 py-1 text-[11px]">+ បន្ថែមមុខ</button>
        {total > 0 && <div className="text-right text-xs">សរុប <b className="font-mono">{money(total)}</b></div>}
      </div>
      <label className={lbl}>ត្រូវការមុនថ្ងៃ<input type="date" value={r.neededBy || ''} onChange={(e) => set({ neededBy: e.target.value })} className={inp} /></label>
      <label className={lbl}>មូលហេតុ / ព័ត៌មានបន្ថែម<textarea rows={2} value={r.details || ''} onChange={(e) => set({ details: e.target.value })} className={inp} /></label>
    </Sheet>
  );
};

// =====================================================================  PAGE
export const CollabView: React.FC = () => {
  const { list, put, del, isManager, myName, myId, sendTelegramAlert } = useCollab();
  const today = isoOf(new Date());
  const [tab, setTab] = useState<'meeting' | 'appt' | 'request'>('meeting');
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming');
  const [form, setForm] = useState<{ kind: 'meeting' | 'appt' | 'request'; item?: any } | null>(null);
  const [openMeeting, setOpenMeeting] = useState<string | null>(null);

  const meetings = list<MeetingItem>(P.meeting).filter((m) => isManager || m.createdBy === myName || (myId && m.attendeeIds.includes(myId)));
  const appts = list<AppointmentItem>(P.appt).filter((a) => isManager || a.createdBy === myName || a.hostId === myId);
  const requests = list<StaffRequestItem>(P.request).filter((r) => isManager || r.requesterName === myName || r.requesterId === myId);

  const upM = meetings.filter((m) => m.status === 'scheduled' && m.date >= today).length;
  const upA = appts.filter((a) => (a.status === 'pending' || a.status === 'confirmed') && a.date >= today).length;
  const penR = requests.filter((r) => r.status === 'pending').length;

  const byWhen = <T extends { date: string; startTime?: string; time?: string; status: string }>(arr: T[], open: string[]) =>
    arr
      .filter((x) => (when === 'upcoming' ? x.date >= today && open.includes(x.status) : !(x.date >= today && open.includes(x.status))))
      .sort((a, b) => (when === 'upcoming' ? 1 : -1) * (a.date + (a.startTime || a.time || '')).localeCompare(b.date + (b.startTime || b.time || '')));

  const decideRequest = (r: StaffRequestItem, status: StaffRequestItem['status']) => {
    const note = status === 'rejected' ? prompt('មូលហេតុបដិសេធ (ជម្រើស)') || '' : '';
    put(P.request, { ...r, status, decidedBy: myName, decidedAt: new Date().toISOString(), decisionNote: note || r.decisionNote });
    sendTelegramAlert?.(status === 'approved' ? '✅ សំណើត្រូវបានអនុម័ត' : status === 'rejected' ? '❌ សំណើត្រូវបានបដិសេធ' : '📦 សំណើបានផ្តល់ជូនរួច', [`📌 ${r.title}`, `👤 ${r.requesterName}`, `ដោយ៖ ${myName}${note ? ' — ' + note : ''}`].join('\n'), 'system');
  };

  const tabs = [
    { k: 'meeting' as const, kh: 'ការប្រជុំ', Icon: Users, n: upM },
    { k: 'appt' as const, kh: 'ការណាត់ជួប', Icon: CalendarClock, n: upA },
    { k: 'request' as const, kh: 'សំណើ', Icon: FileQuestion, n: penR },
  ];
  const meetingOpen = meetings.find((m) => m.id === openMeeting);

  return (
    <div className="mx-auto max-w-3xl space-y-3 font-khmer">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
          {tabs.map(({ k, kh, Icon, n }) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={`relative flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold ${tab === k ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500'}`}>
              <Icon className="h-4 w-4" /> {kh}
              {n > 0 && <span className="rounded-full bg-amber-400 px-1.5 text-[10px] text-slate-900">{n}</span>}
            </button>
          ))}
        </div>
        {tab !== 'request' && (
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            {([['upcoming', 'ខាងមុខ'], ['past', 'កន្លងមក / បិទ']] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setWhen(k)} className={`flex-1 rounded-lg py-1.5 ${when === k ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500'}`}>{l}</button>
            ))}
          </div>
        )}
        <button type="button" onClick={() => setForm({ kind: tab })} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700">
          <Plus className="h-4 w-4" /> {tab === 'meeting' ? 'កំណត់ការប្រជុំ' : tab === 'appt' ? 'ណាត់ជួបថ្មី' : 'សំណើថ្មី'}
        </button>
      </div>

      {tab === 'meeting' && (
        <div className="space-y-2">
          {byWhen(meetings, ['scheduled']).map((m) => {
            const my = myId ? m.rsvp?.[myId] : undefined;
            return (
              <button key={m.id} type="button" onClick={() => setOpenMeeting(m.id)} className="flex w-full gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left hover:border-teal-300">
                <div className="w-14 shrink-0 rounded-xl bg-teal-50 py-1.5 text-center text-teal-800">
                  <div className="text-lg font-black leading-none">{m.date.slice(8)}</div>
                  <div className="text-[10px]">{m.date.slice(5, 7)}/{m.date.slice(2, 4)}</div>
                  <div className="mt-0.5 font-mono text-[10px] font-bold">{m.startTime}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2"><div className="flex-1 truncate text-sm font-bold text-slate-900">{m.title}</div><Pill cls={M_STATUS[m.status][1]}>{M_STATUS[m.status][0]}</Pill></div>
                  <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-slate-500">
                    {m.place && <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />{m.place.startsWith('http') ? 'Online' : m.place}</span>}
                    <span className="inline-flex items-center gap-0.5"><Users className="h-3 w-3" />{m.attendeeIds.length} នាក់</span>
                    {m.agenda.length > 0 && <span><ClipboardList className="inline h-3 w-3" /> {m.agenda.length} ចំណុច</span>}
                  </div>
                  {myId && m.attendeeIds.includes(myId) && m.status === 'scheduled' && (
                    <div className={`mt-1 text-[11px] font-bold ${my ? 'text-emerald-700' : 'text-amber-700'}`}>{my === 'yes' ? '✅ ខ្ញុំចូលរួម' : my === 'no' ? '❌ ខ្ញុំមិនបាន' : my === 'maybe' ? '❔ មិនប្រាកដ' : '⏳ សូមឆ្លើយតប'}</div>
                  )}
                </div>
              </button>
            );
          })}
          {byWhen(meetings, ['scheduled']).length === 0 && <Empty />}
        </div>
      )}

      {tab === 'appt' && (
        <div className="space-y-2">
          {byWhen(appts, ['pending', 'confirmed']).map((a) => {
            const canEdit = isManager || a.createdBy === myName || a.hostId === myId;
            return (
              <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex gap-3">
                  <div className="w-14 shrink-0 rounded-xl bg-sky-50 py-1.5 text-center text-sky-800">
                    <div className="text-lg font-black leading-none">{a.date.slice(8)}</div>
                    <div className="text-[10px]">{a.date.slice(5, 7)}/{a.date.slice(2, 4)}</div>
                    <div className="mt-0.5 font-mono text-[10px] font-bold">{a.time}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2"><div className="flex-1 truncate text-sm font-bold text-slate-900">{a.visitorName} <span className="text-[11px] font-normal text-slate-500">({A_TYPE[a.visitorType]})</span></div><Pill cls={A_STATUS[a.status][1]}>{A_STATUS[a.status][0]}</Pill></div>
                    <div className="text-[11px] text-slate-500">{a.studentName ? `🎒 ${a.studentName} · ` : ''}ជួបជាមួយ {a.hostName || '-'}{a.place ? ` · ${a.place}` : ''}</div>
                    <div className="mt-0.5 text-xs text-slate-700">{a.purpose}</div>
                  </div>
                </div>
                {canEdit && (
                  <div className="mt-2 flex flex-wrap justify-end gap-1 text-[11px] font-bold">
                    {a.visitorPhone && <a href={`tel:${a.visitorPhone.replace(/\s+/g, '')}`} className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">📞 ហៅ</a>}
                    {a.status === 'pending' && <button onClick={() => put(P.appt, { ...a, status: 'confirmed' })} className="rounded-lg bg-sky-50 px-2 py-1 text-sky-700">បញ្ជាក់</button>}
                    {(a.status === 'pending' || a.status === 'confirmed') && (
                      <>
                        <button onClick={() => put(P.appt, { ...a, status: 'done' })} className="rounded-lg bg-emerald-600 px-2 py-1 text-white"><Check className="inline h-3 w-3" /> បានជួប</button>
                        <button onClick={() => put(P.appt, { ...a, status: 'no_show' })} className="rounded-lg bg-slate-100 px-2 py-1">មិនមក</button>
                        <button onClick={() => put(P.appt, { ...a, status: 'cancelled' })} className="rounded-lg bg-slate-100 px-2 py-1">លុបចោល</button>
                      </>
                    )}
                    <button onClick={() => setForm({ kind: 'appt', item: a })} className="rounded-lg bg-slate-100 px-2 py-1">កែ</button>
                    <button onClick={() => confirm('លុបការណាត់ជួបនេះ?') && del(P.appt, a.id)} className="rounded-lg px-2 py-1 text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
            );
          })}
          {byWhen(appts, ['pending', 'confirmed']).length === 0 && <Empty />}
        </div>
      )}

      {tab === 'request' && (
        <div className="space-y-2">
          {[...requests].sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || b.createdAt.localeCompare(a.createdAt)).map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900">{r.title}</div>
                  <div className="text-[11px] text-slate-500">{R_CAT[r.category]} · {r.requesterName} · {fmt(r.createdAt.slice(0, 10))}{r.neededBy ? ` · ត្រូវការមុន ${fmt(r.neededBy)}` : ''}</div>
                </div>
                <Pill cls={R_STATUS[r.status][1]}>{R_STATUS[r.status][0]}</Pill>
              </div>
              {!!r.items?.length && (
                <ul className="mt-1.5 space-y-0.5 text-xs text-slate-700">
                  {r.items.map((it, i) => <li key={i}>• {it.name} × {it.qty}{it.unitPrice ? <span className="text-slate-500"> (${it.unitPrice})</span> : null}</li>)}
                </ul>
              )}
              {r.amount ? <div className="mt-1 text-xs">សរុប <b className="font-mono">{money(r.amount)}</b></div> : null}
              {r.details && <div className="mt-1 text-xs text-slate-600">{r.details}</div>}
              {r.decidedBy && <div className="mt-1 text-[11px] text-slate-500">{R_STATUS[r.status][0]} ដោយ {r.decidedBy}{r.decisionNote ? ` — ${r.decisionNote}` : ''}</div>}
              <div className="mt-2 flex flex-wrap justify-end gap-1 text-[11px] font-bold">
                {isManager && r.status === 'pending' && (
                  <>
                    <button onClick={() => decideRequest(r, 'approved')} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-white"><Check className="inline h-3 w-3" /> អនុម័ត</button>
                    <button onClick={() => decideRequest(r, 'rejected')} className="rounded-lg bg-rose-50 px-2.5 py-1 text-rose-700">បដិសេធ</button>
                  </>
                )}
                {isManager && r.status === 'approved' && <button onClick={() => decideRequest(r, 'done')} className="rounded-lg bg-sky-600 px-2.5 py-1 text-white">📦 បានផ្តល់ជូន</button>}
                {r.status === 'pending' && (r.requesterName === myName || isManager) && (
                  <>
                    <button onClick={() => setForm({ kind: 'request', item: r })} className="rounded-lg bg-slate-100 px-2 py-1">កែ</button>
                    <button onClick={() => confirm('លុបសំណើនេះ?') && del(P.request, r.id)} className="rounded-lg px-2 py-1 text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </>
                )}
              </div>
            </div>
          ))}
          {requests.length === 0 && <Empty />}
        </div>
      )}

      {form?.kind === 'meeting' && <MeetingForm initial={form.item} onClose={() => setForm(null)} />}
      {form?.kind === 'appt' && <ApptForm initial={form.item} onClose={() => setForm(null)} />}
      {form?.kind === 'request' && <RequestForm initial={form.item} onClose={() => setForm(null)} />}
      {meetingOpen && <MeetingDetail m={meetingOpen} onClose={() => setOpenMeeting(null)} onEdit={() => { setForm({ kind: 'meeting', item: meetingOpen }); setOpenMeeting(null); }} />}
    </div>
  );
};

const Empty = () => <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">មិនមានទិន្នន័យ</div>;
