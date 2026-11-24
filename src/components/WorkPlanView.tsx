// ផែនការសកម្មភាពការងារ — staff work plan.
// Admin / Accounting plan activities and assign them to staff; everyone sees their own tasks,
// updates status, progress and checklist, and leaves comments. One shared-store key per task
// (BIM_WORKPLAN_<id>) so several devices can work at the same time.
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { TeacherRecord, WorkPlanTask, WorkTaskStatus } from '../types';
import { holidayOn } from '../utils/shifts';
import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardCheck, MessageSquare, Plus, Printer, Search, Trash2, User, X } from 'lucide-react';

export const WORKPLAN_PREFIX = 'BIM_WORKPLAN_';
const CATEGORIES = ['ការបង្រៀន', 'រដ្ឋបាល', 'ព្រឹត្តិការណ៍', 'ប្រជុំ', 'ថែទាំ & អនាម័យ', 'ហិរញ្ញវត្ថុ', 'ផ្សេងៗ'];
const STATUS: Record<WorkTaskStatus, { kh: string; cls: string }> = {
  todo: { kh: 'ត្រូវធ្វើ', cls: 'bg-slate-100 text-slate-700' },
  doing: { kh: 'កំពុងធ្វើ', cls: 'bg-sky-100 text-sky-800' },
  done: { kh: 'រួចរាល់', cls: 'bg-emerald-100 text-emerald-800' },
  cancelled: { kh: 'បោះបង់', cls: 'bg-rose-50 text-rose-500 line-through' },
};
const PRIORITY: Record<WorkPlanTask['priority'], { kh: string; dot: string }> = {
  high: { kh: 'បន្ទាន់', dot: 'bg-rose-500' },
  normal: { kh: 'ធម្មតា', dot: 'bg-amber-400' },
  low: { kh: 'ទាប', dot: 'bg-slate-300' },
};
const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmt = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '');
const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return isoOf(d);
};
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

const useWorkPlan = () => {
  const { syncedEntries, syncedSet, currentUser, linkedTeacher } = useApp() as any;
  const isManager = currentUser.role === 'admin' || currentUser.role === 'accountant';
  const myName = currentUser.khmerName || currentUser.name;
  const myStaffId: string | undefined = linkedTeacher?.id;
  const all: WorkPlanTask[] = (syncedEntries(WORKPLAN_PREFIX) as [string, WorkPlanTask][]).map(([, v]) => v).filter((t) => t && t.id);
  const isMine = (t: WorkPlanTask) => (!!myStaffId && t.assigneeIds.includes(myStaffId)) || t.createdBy === myName;
  const visible = isManager ? all : all.filter(isMine);
  const save = (t: WorkPlanTask) => syncedSet(WORKPLAN_PREFIX + t.id, { ...t, updatedAt: new Date().toISOString() });
  const remove = (id: string) => syncedSet(WORKPLAN_PREFIX + id, null);
  const canEditTask = (t: WorkPlanTask) => isManager || t.createdBy === myName;
  const canWork = (t: WorkPlanTask) => canEditTask(t) || (!!myStaffId && t.assigneeIds.includes(myStaffId));
  return { all, visible, save, remove, canEditTask, canWork, isManager, myName, myStaffId, isMine };
};

// ------------------------------------------------------------------ task form
const TaskForm: React.FC<{ initial?: WorkPlanTask; onClose: () => void }> = ({ initial, onClose }) => {
  const { teachers, currentUser, sendTelegramAlert, showNotification, teacherCheckIn } = useApp() as any;
  const { save, isManager, myName, myStaffId } = useWorkPlan();
  const today = isoOf(new Date());
  const staff: TeacherRecord[] = (teachers as TeacherRecord[]).filter((t) => t.status !== 'resigned');
  const [t, setT] = useState<WorkPlanTask>(
    initial || {
      id: `wp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: '',
      category: CATEGORIES[0],
      assigneeIds: myStaffId && !isManager ? [myStaffId] : [],
      assigneeNames: [],
      startDate: today,
      dueDate: today,
      priority: 'normal',
      status: 'todo',
      progress: 0,
      checklist: [],
      comments: [],
      createdBy: myName,
      createdById: currentUser.id,
      createdAt: new Date().toISOString(),
    }
  );
  const set = (p: Partial<WorkPlanTask>) => setT((x) => ({ ...x, ...p }));
  const [q, setQ] = useState('');
  const toggle = (id: string) => set({ assigneeIds: t.assigneeIds.includes(id) ? t.assigneeIds.filter((x) => x !== id) : [...t.assigneeIds, id] });
  const valid = t.title.trim() && t.assigneeIds.length > 0 && t.dueDate >= t.startDate;
  const hol = holidayOn(teacherCheckIn, t.dueDate);

  const submit = () => {
    if (!valid) return;
    const names = t.assigneeIds.map((id) => staff.find((s) => s.id === id)?.nameKhmer || (teachers as TeacherRecord[]).find((s) => s.id === id)?.nameKhmer || '');
    const task: WorkPlanTask = { ...t, title: t.title.trim(), assigneeNames: names, checklist: (t.checklist || []).filter((c) => c.text.trim()) };
    save(task);
    const newPeople = initial ? t.assigneeIds.filter((id) => !initial.assigneeIds.includes(id)) : t.assigneeIds;
    if (newPeople.length) {
      sendTelegramAlert?.(
        '📋 ការងារថ្មីត្រូវបានចាត់តាំង',
        [
          `📌 ${task.title}`,
          `👥 ${newPeople.map((id) => names[t.assigneeIds.indexOf(id)]).join(', ')}`,
          `📅 ${fmt(task.startDate)} → ${fmt(task.dueDate)}${task.dueTime ? ' ' + task.dueTime : ''} · ${PRIORITY[task.priority].kh}`,
          ...(task.description ? [`📝 ${task.description}`] : []),
          `ដោយ៖ ${myName}`,
        ].join('\n'),
        'system'
      );
    }
    showNotification?.('បានរក្សាទុកការងារ', 'success');
    onClose();
  };

  const input = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';
  const lbl = 'flex flex-col gap-1 text-xs font-bold text-slate-600';
  const shown = staff.filter((s) => !q.trim() || s.nameKhmer.includes(q.trim()) || (s.nameEnglish || '').toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-2xl font-khmer sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="text-base font-bold text-slate-900">{initial ? 'កែការងារ' : 'បន្ថែមការងារ'}</div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 overflow-y-auto px-4 py-3">
          <label className={lbl}>ចំណងជើងការងារ *<input value={t.title} onChange={(e) => set({ title: e.target.value })} placeholder="ឧ. រៀបចំកម្មវិធីបុណ្យចូលឆ្នាំ" className={input} /></label>
          <label className={lbl}>ពិពណ៌នា<textarea rows={2} value={t.description || ''} onChange={(e) => set({ description: e.target.value })} className={`${input} font-normal`} /></label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => set({ category: c })} className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${t.category === c ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200 text-slate-600'}`}>{c}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className={lbl}>ចាប់ផ្តើម<input type="date" value={t.startDate} onChange={(e) => set({ startDate: e.target.value, dueDate: t.dueDate < e.target.value ? e.target.value : t.dueDate })} className={input} /></label>
            <label className={lbl}>ផុតកំណត់<input type="date" value={t.dueDate} min={t.startDate} onChange={(e) => set({ dueDate: e.target.value })} className={input} /></label>
            <label className={lbl}>ម៉ោង (ជម្រើស)<input type="time" value={t.dueTime || ''} onChange={(e) => set({ dueTime: e.target.value })} className={input} /></label>
            <div className={lbl}>
              អាទិភាព
              <div className="flex gap-1">
                {(['high', 'normal', 'low'] as const).map((p) => (
                  <button key={p} type="button" onClick={() => set({ priority: p })} className={`flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-[11px] ${t.priority === p ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 text-slate-600'}`}>
                    <span className={`h-2 w-2 rounded-full ${PRIORITY[p].dot}`} />{PRIORITY[p].kh}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {hol && <div className="rounded-lg bg-violet-50 px-2 py-1.5 text-[11px] text-violet-800">🎉 ថ្ងៃផុតកំណត់ ត្រូវនឹងថ្ងៃឈប់សម្រាក ({hol.name})</div>}

          <div className={lbl}>
            អ្នកទទួលខុសត្រូវ * ({t.assigneeIds.length})
            {isManager ? (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ស្វែងរកបុគ្គលិក" className={`${input} pl-8 font-normal`} />
                </div>
                <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto font-normal">
                  {shown.map((s) => (
                    <button key={s.id} type="button" onClick={() => toggle(s.id)} className={`rounded-full border px-2.5 py-1 text-[11px] ${t.assigneeIds.includes(s.id) ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-700'}`}>
                      {s.nameKhmer}{s.position ? <span className="opacity-60"> · {s.position}</span> : null}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-normal">{staff.find((s) => s.id === myStaffId)?.nameKhmer || 'ខ្ញុំ'} (ផែនការផ្ទាល់ខ្លួន)</div>
            )}
          </div>

          <div className={lbl}>
            បញ្ជីជំហាន (Checklist)
            {(t.checklist || []).map((c, i) => (
              <div key={i} className="flex gap-1.5">
                <input value={c.text} onChange={(e) => set({ checklist: (t.checklist || []).map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} className={`${input} font-normal`} />
                <button type="button" onClick={() => set({ checklist: (t.checklist || []).filter((_, j) => j !== i) })} className="rounded-lg px-2 text-rose-500 hover:bg-rose-50"><X className="h-4 w-4" /></button>
              </div>
            ))}
            <button type="button" onClick={() => set({ checklist: [...(t.checklist || []), { text: '', done: false }] })} className="self-start rounded-lg bg-slate-100 px-2.5 py-1 text-[11px]">+ បន្ថែមជំហាន</button>
          </div>
        </div>
        <div className="border-t border-slate-100 px-4 py-3">
          <button onClick={submit} disabled={!valid} className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-40">រក្សាទុក</button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ task detail (work on it)
const TaskDetail: React.FC<{ task: WorkPlanTask; onClose: () => void; onEdit: () => void }> = ({ task, onClose, onEdit }) => {
  const { sendTelegramAlert } = useApp() as any;
  const { save, remove, canEditTask, canWork, myName } = useWorkPlan();
  const [comment, setComment] = useState('');
  const work = canWork(task);
  const update = (p: Partial<WorkPlanTask>) => {
    const next = { ...task, ...p };
    if (p.status === 'done' && task.status !== 'done') {
      next.progress = 100;
      next.completedAt = new Date().toISOString();
      sendTelegramAlert?.('✅ ការងាររួចរាល់', [`📌 ${task.title}`, `👥 ${task.assigneeNames.join(', ')}`, `ដោយ៖ ${myName}`].join('\n'), 'system');
    }
    if (p.status && p.status !== 'done') next.completedAt = undefined;
    save(next);
  };
  const toggleCheck = (i: number) => {
    const list = (task.checklist || []).map((c, j) => (j === i ? { ...c, done: !c.done } : c));
    const doneN = list.filter((c) => c.done).length;
    update({ checklist: list, progress: list.length ? Math.round((doneN / list.length) * 100) : task.progress, status: doneN && task.status === 'todo' ? 'doing' : task.status });
  };
  const addComment = () => {
    if (!comment.trim()) return;
    update({ comments: [...(task.comments || []), { by: myName, at: new Date().toISOString(), text: comment.trim() }] });
    setComment('');
  };
  const overdue = task.status !== 'done' && task.status !== 'cancelled' && task.dueDate < isoOf(new Date());

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-2xl font-khmer sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className={`h-2 w-2 rounded-full ${PRIORITY[task.priority].dot}`} />{task.category} · {PRIORITY[task.priority].kh}</div>
            <div className="text-base font-bold text-slate-900">{task.title}</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 overflow-y-auto px-4 py-3 text-sm">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-slate-50 p-2"><div className="text-slate-500">រយៈពេល</div><b>{fmt(task.startDate)} → {fmt(task.dueDate)} {task.dueTime || ''}</b>{overdue && <div className="font-bold text-rose-600">ហួសកំណត់</div>}</div>
            <div className="rounded-xl bg-slate-50 p-2"><div className="text-slate-500">អ្នកទទួលខុសត្រូវ</div><b>{task.assigneeNames.join(', ')}</b></div>
          </div>
          {task.description && <p className="whitespace-pre-line text-xs text-slate-700">{task.description}</p>}

          <div>
            <div className="mb-1 text-xs font-bold text-slate-600">ស្ថានភាព</div>
            <div className="grid grid-cols-4 gap-1">
              {(Object.keys(STATUS) as WorkTaskStatus[]).map((k) => (
                <button key={k} type="button" disabled={!work} onClick={() => update({ status: k })} className={`rounded-lg py-2 text-[11px] font-bold ${task.status === k ? STATUS[k].cls + ' ring-2 ring-slate-400' : 'bg-white border border-slate-200 text-slate-500'} disabled:opacity-60`}>{STATUS[k].kh}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs font-bold text-slate-600"><span>វឌ្ឍនភាព</span><span>{task.progress}%</span></div>
            <input type="range" min={0} max={100} step={10} value={task.progress} disabled={!work || !!task.checklist?.length} onChange={(e) => update({ progress: Number(e.target.value), status: Number(e.target.value) > 0 && task.status === 'todo' ? 'doing' : task.status })} className="w-full accent-teal-600" />
          </div>
          {!!task.checklist?.length && (
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-600">ជំហាន ({task.checklist.filter((c) => c.done).length}/{task.checklist.length})</div>
              {task.checklist.map((c, i) => (
                <label key={i} className="flex items-center gap-2 rounded-lg border border-slate-100 px-2 py-1.5 text-xs">
                  <input type="checkbox" className="accent-teal-600" checked={c.done} disabled={!work} onChange={() => toggleCheck(i)} />
                  <span className={c.done ? 'text-slate-400 line-through' : ''}>{c.text}</span>
                </label>
              ))}
            </div>
          )}
          <div>
            <div className="mb-1 flex items-center gap-1 text-xs font-bold text-slate-600"><MessageSquare className="h-3.5 w-3.5" /> មតិ / របាយការណ៍វឌ្ឍនភាព</div>
            <div className="space-y-1.5">
              {(task.comments || []).map((c, i) => (
                <div key={i} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                  <div className="text-[10px] text-slate-500">{c.by} · {new Date(c.at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="whitespace-pre-line">{c.text}</div>
                </div>
              ))}
            </div>
            {work && (
              <div className="mt-1.5 flex gap-1.5">
                <input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} placeholder="សរសេរមតិ…" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                <button type="button" onClick={addComment} className="rounded-lg bg-teal-600 px-3 text-xs font-bold text-white">ផ្ញើ</button>
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400">បង្កើតដោយ {task.createdBy} · {new Date(task.createdAt).toLocaleDateString('en-GB')}</div>
        </div>
        {canEditTask(task) && (
          <div className="flex gap-2 border-t border-slate-100 px-4 py-3">
            <button onClick={() => confirm(`លុបការងារ «${task.title}»?`) && (remove(task.id), onClose())} className="rounded-xl border border-rose-200 px-3 text-rose-600"><Trash2 className="h-4 w-4" /></button>
            <button onClick={onEdit} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700">កែការងារ</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ page
export const WorkPlanView: React.FC = () => {
  const { teachers, settings } = useApp() as any;
  const { visible, isManager, isMine } = useWorkPlan();
  const today = isoOf(new Date());
  const [scope, setScope] = useState<'mine' | 'all'>(isManager ? 'all' : 'mine');
  const [statusF, setStatusF] = useState<'open' | 'done' | 'all'>('open');
  const [staffF, setStaffF] = useState('all');
  const [q, setQ] = useState('');
  const [view, setView] = useState<'list' | 'week'>('list');
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return isoOf(d);
  });
  const [form, setForm] = useState<{ task?: WorkPlanTask } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(
    () =>
      visible
        .filter((t) => scope === 'all' || isMine(t))
        .filter((t) => (statusF === 'open' ? t.status === 'todo' || t.status === 'doing' : statusF === 'done' ? t.status === 'done' || t.status === 'cancelled' : true))
        .filter((t) => staffF === 'all' || t.assigneeIds.includes(staffF))
        .filter((t) => !q.trim() || t.title.includes(q.trim()) || t.assigneeNames.some((n) => n.includes(q.trim())))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || ({ high: 0, normal: 1, low: 2 }[a.priority] - { high: 0, normal: 1, low: 2 }[b.priority])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible, scope, statusF, staffF, q]
  );
  const open = visible.filter((t) => (scope === 'all' || isMine(t)) && (t.status === 'todo' || t.status === 'doing'));
  const overdueN = open.filter((t) => t.dueDate < today).length;
  const todayN = open.filter((t) => t.startDate <= today && t.dueDate >= today).length;
  const doneWeek = visible.filter((t) => (scope === 'all' || isMine(t)) && t.status === 'done' && (t.completedAt || '').slice(0, 10) >= addDays(today, -6)).length;

  const groups: [string, WorkPlanTask[]][] = useMemo(() => {
    const g: Record<string, WorkPlanTask[]> = { overdue: [], today: [], week: [], later: [], closed: [] };
    const weekEnd = addDays(today, 7);
    list.forEach((t) => {
      if (t.status === 'done' || t.status === 'cancelled') g.closed.push(t);
      else if (t.dueDate < today) g.overdue.push(t);
      else if (t.startDate <= today) g.today.push(t);
      else if (t.dueDate <= weekEnd) g.week.push(t);
      else g.later.push(t);
    });
    return [
      ['⚠️ ហួសកំណត់', g.overdue],
      ['📍 កំពុងដំណើរការថ្ងៃនេះ', g.today],
      ['🗓️ ៧ ថ្ងៃខាងមុខ', g.week],
      ['⏭️ ក្រោយមក', g.later],
      ['✅ បានបិទ', g.closed],
    ].filter(([, v]) => (v as WorkPlanTask[]).length) as [string, WorkPlanTask[]][];
  }, [list, today]);

  const printPlan = () => {
    const rows = list
      .map(
        (t, i) =>
          `<tr><td>${i + 1}</td><td><b>${esc(t.title)}</b>${t.description ? `<div class="s">${esc(t.description)}</div>` : ''}</td><td>${esc(t.category)}</td><td>${esc(t.assigneeNames.join(', '))}</td><td>${fmt(t.startDate)}<br/>${fmt(t.dueDate)}</td><td>${PRIORITY[t.priority].kh}</td><td>${STATUS[t.status].kh} ${t.progress}%</td><td></td></tr>`
      )
      .join('');
    const w = window.open('', '_blank');
    if (!w) return alert('សូមអនុញ្ញាត Pop-up ដើម្បីបោះពុម្ព');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>ផែនការសកម្មភាពការងារ</title>
      <link href="https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Moul&display=swap" rel="stylesheet"/>
      <style>@page{size:A4 landscape;margin:12mm}body{font-family:Battambang,sans-serif;font-size:12px}h2{font-family:Moul,serif;font-weight:400;text-align:center;font-size:16px}
      .c{text-align:center}table{border-collapse:collapse;width:100%}th,td{border:1px solid #333;padding:4px 6px;vertical-align:top}th{background:#fbb03b}.s{font-size:10px;color:#444}
      .sign{display:flex;justify-content:space-between;margin-top:30px;text-align:center}.sign div{width:40%}</style></head><body>
      <div class="c"><b>${esc(settings?.schoolNameKhmer || '')}</b></div>
      <h2>ផែនការសកម្មភាពការងារ</h2>
      <div class="c">បោះពុម្ពថ្ងៃទី ${fmt(today)} · ${list.length} ការងារ</div><br/>
      <table><tr><th>ល.រ</th><th>សកម្មភាព</th><th>ប្រភេទ</th><th>អ្នកទទួលខុសត្រូវ</th><th>ចាប់ផ្តើម / ផុតកំណត់</th><th>អាទិភាព</th><th>ស្ថានភាព</th><th>កំណត់សម្គាល់</th></tr>${rows}</table>
      <div class="sign"><div>រៀបចំដោយ<br/><br/><br/>..............................</div><div>បានឃើញ និងឯកភាព<br/>នាយកសាលា<br/><br/><b>${esc(settings?.directorName || '')}</b></div></div>
      <script>window.onload=function(){setTimeout(function(){window.print()},400)}</script></body></html>`);
    w.document.close();
  };

  const openTask = visible.find((t) => t.id === openId);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const DOW = ['ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហ', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ'];

  const Card: React.FC<{ t: WorkPlanTask; compact?: boolean }> = ({ t, compact }) => {
    const late = t.status !== 'done' && t.status !== 'cancelled' && t.dueDate < today;
    return (
      <button type="button" onClick={() => setOpenId(t.id)} className={`w-full rounded-2xl border bg-white p-3 text-left shadow-2xs hover:border-teal-300 ${late ? 'border-rose-200' : 'border-slate-200'}`}>
        <div className="flex items-start gap-2">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PRIORITY[t.priority].dot}`} />
          <div className="min-w-0 flex-1">
            <div className={`truncate text-sm font-bold ${t.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</div>
            {!compact && (
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-0.5"><User className="h-3 w-3" />{t.assigneeNames.join(', ')}</span>
                <span className={late ? 'font-bold text-rose-600' : ''}>📅 {fmt(t.dueDate)}{t.dueTime ? ' ' + t.dueTime : ''}</span>
                <span>{t.category}</span>
              </div>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS[t.status].cls}`}>{STATUS[t.status].kh}</span>
        </div>
        {!compact && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-500" style={{ width: `${t.progress}%` }} /></div>
            <span className="text-[10px] font-mono text-slate-500">{t.progress}%</span>
            {!!t.checklist?.length && <span className="text-[10px] text-slate-500">☑ {t.checklist.filter((c) => c.done).length}/{t.checklist.length}</span>}
            {!!t.comments?.length && <span className="text-[10px] text-slate-500">💬 {t.comments.length}</span>}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-3 font-khmer">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><ClipboardCheck className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold text-slate-900">ផែនការសកម្មភាពការងារ</div>
            <p className="text-[11px] text-slate-500">ចាត់តាំង តាមដាន និងរាយការណ៍ការងាររបស់បុគ្គលិក</p>
          </div>
          <button type="button" onClick={printPlan} title="បោះពុម្ពផែនការ" className="rounded-xl border border-slate-200 p-2.5 text-slate-600"><Printer className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[['កំពុងបើក', open.length, 'bg-slate-50 text-slate-900'], ['ថ្ងៃនេះ', todayN, 'bg-sky-50 text-sky-800'], ['ហួសកំណត់', overdueN, 'bg-rose-50 text-rose-700'], ['រួច ៧ថ្ងៃ', doneWeek, 'bg-emerald-50 text-emerald-700']].map(([k, v, c]) => (
            <div key={k as string} className={`rounded-xl py-1.5 ${c}`}><div className="text-[10px] opacity-70">{k}</div><div className="font-mono text-lg font-black">{v as number}</div></div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {isManager && (
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              {([['all', 'ទាំងអស់'], ['mine', 'របស់ខ្ញុំ']] as const).map(([k, l]) => (
                <button key={k} type="button" onClick={() => setScope(k)} className={`rounded-lg px-3 py-1.5 ${scope === k ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500'}`}>{l}</button>
              ))}
            </div>
          )}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            {([['open', 'កំពុងបើក'], ['done', 'បានបិទ'], ['all', 'ទាំងអស់']] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setStatusF(k)} className={`rounded-lg px-3 py-1.5 ${statusF === k ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500'}`}>{l}</button>
            ))}
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            {([['list', 'បញ្ជី'], ['week', 'សប្តាហ៍']] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setView(k)} className={`rounded-lg px-3 py-1.5 ${view === k ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {isManager && scope === 'all' ? (
            <select value={staffF} onChange={(e) => setStaffF(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm">
              <option value="all">បុគ្គលិកទាំងអស់</option>
              {(teachers as TeacherRecord[]).filter((t) => t.status !== 'resigned').map((t) => <option key={t.id} value={t.id}>{t.nameKhmer}</option>)}
            </select>
          ) : <div />}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ស្វែងរក" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-2 text-sm" />
          </div>
        </div>
        <button type="button" onClick={() => setForm({})} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700">
          <Plus className="h-4 w-4" /> {isManager ? 'បន្ថែម / ចាត់តាំងការងារ' : 'បន្ថែមផែនការរបស់ខ្ញុំ'}
        </button>
      </div>

      {view === 'list' ? (
        groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-300" /> មិនមានការងារ
          </div>
        ) : (
          groups.map(([title, items]) => (
            <div key={title} className="space-y-2">
              <div className="flex items-center gap-1.5 px-1 text-xs font-bold text-slate-600">{title} <span className="rounded-full bg-slate-200 px-1.5 text-[10px]">{items.length}</span></div>
              <div className="grid gap-2 md:grid-cols-2">{items.map((t) => <Card key={t.id} t={t} />)}</div>
            </div>
          ))
        )
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setWeekStart(addDays(weekStart, -7))} className="rounded-xl border border-slate-200 bg-white px-3 py-2">‹</button>
            <div className="flex-1 text-center text-sm font-bold text-slate-800"><CalendarDays className="mr-1 inline h-4 w-4" />{fmt(weekStart)} – {fmt(addDays(weekStart, 6))}</div>
            <button type="button" onClick={() => setWeekStart(addDays(weekStart, 7))} className="rounded-xl border border-slate-200 bg-white px-3 py-2">›</button>
          </div>
          {weekDays.map((d, i) => {
            const items = list.filter((t) => t.startDate <= d && t.dueDate >= d);
            return (
              <div key={d} className={`rounded-2xl border bg-white p-3 ${d === today ? 'border-teal-400' : 'border-slate-200'}`}>
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{DOW[i]} {fmt(d).slice(0, 5)} {d === today && <span className="ml-1 rounded-full bg-teal-600 px-1.5 text-[10px] text-white">ថ្ងៃនេះ</span>}</span>
                  <span className="text-slate-400">{items.length || ''}</span>
                </div>
                {items.length ? <div className="grid gap-1.5 md:grid-cols-2">{items.map((t) => <Card key={t.id} t={t} compact />)}</div> : <div className="text-[11px] text-slate-300">—</div>}
              </div>
            );
          })}
        </div>
      )}

      {overdueN > 0 && view === 'list' && statusF !== 'done' && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700"><AlertTriangle className="h-4 w-4" /> មានការងារហួសកំណត់ {overdueN}</div>
      )}

      {form && <TaskForm initial={form.task} onClose={() => setForm(null)} />}
      {openTask && <TaskDetail task={openTask} onClose={() => setOpenId(null)} onEdit={() => { setForm({ task: openTask }); setOpenId(null); }} />}
    </div>
  );
};
