// Teacher Management → Attendance Check In
// Teachers check in when they arrive and check out when they leave. Late = after start time + grace minutes.
import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { TeacherCheckInRecord, TeacherRecord } from '../types';
import { LogIn, LogOut, Clock, Search, Printer, Settings2, CalendarDays, UserCheck, FileText, Trash2, ListChecks, Users, ClipboardCheck, Send } from 'lucide-react';

const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const toMin = (t?: string) => {
  if (!t) return NaN;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const fmtDur = (mins: number) => (Number.isFinite(mins) && mins > 0 ? `${Math.floor(mins / 60)}h ${pad(mins % 60)}m` : '-');
const KH_DAYS = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

const STATUS_UI: Record<string, { label: string; cls: string }> = {
  on_time: { label: 'ទាន់ម៉ោង', cls: 'bg-emerald-100 text-emerald-800' },
  late: { label: 'មកយឺត', cls: 'bg-amber-100 text-amber-800' },
  leave: { label: 'សុំច្បាប់', cls: 'bg-sky-100 text-sky-800' },
  absent: { label: 'អវត្តមាន', cls: 'bg-rose-100 text-rose-800' },
  none: { label: 'មិនទាន់ចូល', cls: 'bg-slate-100 text-slate-500' },
};

/** Keep the older daily Teacher Attendance sheet in step with check-ins */
const mirrorToAttendanceSheet = (date: string, teacherId: string, status: TeacherCheckInRecord['status'], note?: string) => {
  try {
    const key = `BIM_RANGSEI_TEACHER_ATT_${date}`;
    const cur = JSON.parse(localStorage.getItem(key) || '{}');
    cur[teacherId] = { status: status === 'on_time' ? 'present' : status, note: note || cur[teacherId]?.note || '' };
    localStorage.setItem(key, JSON.stringify(cur));
  } catch {}
};

export const TeacherCheckInView: React.FC = () => {
  const { teachers, teacherCheckIn, setTeacherCheckIn, currentUser, settings, showNotification, linkedTeacher, sendTelegramAlert } = useApp() as any;
  const canManage = currentUser.role === 'admin' || currentUser.role === 'accountant';
  // Staff check in / out only for themselves; Admin & Accounting can also manage everyone
  const [mode, setMode] = useState<'me' | 'manage'>(canManage ? 'manage' : 'me');
  const selfOnly = !canManage || mode === 'me';

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const [tab, setTab] = useState<'today' | 'month'>('today');
  const [date, setDate] = useState(isoOf(new Date()));
  const [search, setSearch] = useState('');
  const [pickedId, setSelectedId] = useState<string>('');
  const selectedId = selfOnly ? linkedTeacher?.id || '' : pickedId;
  const [manualTime, setManualTime] = useState('');
  const [note, setNote] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const { records, startTime, endTime, lateGraceMinutes } = teacherCheckIn;
  const today = isoOf(now);
  const isToday = date === today;

  const recOf = (teacherId: string, d = date) => records.find((r: TeacherCheckInRecord) => r.teacherId === teacherId && r.date === d);

  const upsert = (teacherId: string, patch: Partial<TeacherCheckInRecord>) => {
    setTeacherCheckIn((prev: any) => {
      const id = `${date}_${teacherId}`;
      const existing = prev.records.find((r: TeacherCheckInRecord) => r.id === id);
      const next: TeacherCheckInRecord = {
        id, teacherId, date, status: 'on_time', ...(existing || {}), ...patch, recordedBy: currentUser.khmerName || currentUser.name,
      };
      mirrorToAttendanceSheet(date, teacherId, next.status, next.note);
      return { ...prev, records: [...prev.records.filter((r: TeacherCheckInRecord) => r.id !== id), next] };
    });
  };

  const lateLimit = toMin(startTime) + (Number(lateGraceMinutes) || 0);
  const timeToUse = () => (manualTime && canManage ? manualTime : hhmm(new Date()));

  const selected = (teachers as TeacherRecord[]).find((t) => t.id === selectedId);
  const selectedRec = selected ? recOf(selected.id) : undefined;

  const alertTelegram = (title: string, lines: string[]) => {
    try {
      sendTelegramAlert?.(title, [...lines, `ថ្ងៃ៖ ${date}`, `កត់ត្រាដោយ៖ ${currentUser.khmerName || currentUser.name}`].join('\n'), 'system');
    } catch {}
  };
  const doCheckIn = () => {
    if (!selected) return;
    const t = timeToUse();
    const status: TeacherCheckInRecord['status'] = toMin(t) > lateLimit ? 'late' : 'on_time';
    upsert(selected.id, { checkIn: t, status, note: note || selectedRec?.note });
    showNotification?.(`✅ ${selected.nameKhmer} ចូលម៉ោង ${t}${status === 'late' ? ' (មកយឺត)' : ''}`, 'success');
    const lateBy = toMin(t) - toMin(startTime);
    alertTelegram(status === 'late' ? '⚠️ គ្រូមកយឺត (Check In)' : '✅ គ្រូចូលធ្វើការ (Check In)', [
      `👩‍🏫 ${selected.nameKhmer} (${selected.position || selected.homeroomClassName || selected.teacherCode})`,
      `🕒 ម៉ោងចូល៖ ${t}${status === 'late' ? ` — យឺត ${lateBy} នាទី` : ' — ទាន់ម៉ោង'}`,
      ...(note ? [`📝 ${note}`] : []),
    ]);
    setNote('');
  };
  const doCheckOut = () => {
    if (!selected) return;
    const t = timeToUse();
    upsert(selected.id, { checkOut: t, note: note || selectedRec?.note });
    showNotification?.(`👋 ${selected.nameKhmer} ចេញម៉ោង ${t}`, 'success');
    const worked = toMin(t) - toMin(selectedRec?.checkIn);
    alertTelegram('👋 គ្រូចេញពីការងារ (Check Out)', [
      `👩‍🏫 ${selected.nameKhmer}`,
      `🕒 ចូល ${selectedRec?.checkIn || '-'} → ចេញ ${t} (${fmtDur(worked)})`,
      ...(toMin(t) < toMin(endTime) ? [`⚠️ ចេញមុនម៉ោង ${endTime}`] : []),
    ]);
    setNote('');
  };
  const doLeave = () => {
    if (!selected) return;
    upsert(selected.id, { status: 'leave', checkIn: undefined, checkOut: undefined, note: note || 'សុំច្បាប់' });
    setNote('');
  };
  const clearRec = (teacherId: string) => {
    if (!confirm('លុបការចុះវត្តមាននេះ?')) return;
    setTeacherCheckIn((prev: any) => ({ ...prev, records: prev.records.filter((r: TeacherCheckInRecord) => r.id !== `${date}_${teacherId}`) }));
  };

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (teachers as TeacherRecord[]).filter(
      (t) => t.status !== 'resigned' && (!q || t.nameKhmer.includes(q) || t.nameEnglish.toLowerCase().includes(q) || t.teacherCode.toLowerCase().includes(q))
    );
  }, [teachers, search]);

  const counts = useMemo(() => {
    const c = { on_time: 0, late: 0, leave: 0, none: 0 };
    (teachers as TeacherRecord[]).forEach((t) => {
      const r = recOf(t.id);
      if (!r) c.none++;
      else if (r.status === 'late') c.late++;
      else if (r.status === 'leave') c.leave++;
      else if (r.status === 'on_time') c.on_time++;
      else c.none++;
    });
    return c;
  }, [teachers, records, date]);

  // ---------- Monthly summary ----------
  const [month, setMonth] = useState(today.slice(0, 7));
  const monthly = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    const workDays: string[] = [];
    for (let d = 1; d <= last; d++) {
      const dt = new Date(y, m - 1, d);
      const iso = isoOf(dt);
      if (iso > today) break;
      if (dt.getDay() !== 0 && dt.getDay() !== 6) workDays.push(iso);
    }
    const rows = (teachers as TeacherRecord[]).filter((t) => !selfOnly || t.id === selectedId).map((t) => {
      let present = 0, late = 0, leave = 0, mins = 0;
      workDays.forEach((d) => {
        const r = recOf(t.id, d);
        if (!r) return;
        if (r.status === 'leave') leave++;
        else if (r.checkIn) {
          present++;
          if (r.status === 'late') late++;
          const w = toMin(r.checkOut) - toMin(r.checkIn);
          if (w > 0) mins += w;
        }
      });
      return { t, present, late, leave, absent: Math.max(0, workDays.length - present - leave), mins };
    });
    return { workDays: workDays.length, rows };
  }, [month, teachers, records, today, selfOnly, selectedId]);

  const dateLabel = (() => {
    const d = new Date(date + 'T00:00:00');
    return `ថ្ងៃ${KH_DAYS[d.getDay()]} ទី${d.getDate()} ខែ${KH_MONTHS[d.getMonth()]} ឆ្នាំ${d.getFullYear()}`;
  })();

  // ---------- Teacher's own app-style screen (like the phone check-in app) ----------
  if (selfOnly) {
    const go = (tab: string) => { window.location.hash = tab; };
    const myMonth = records
      .filter((r: TeacherCheckInRecord) => r.teacherId === selectedId && r.date.slice(0, 7) === today.slice(0, 7))
      .sort((a: TeacherCheckInRecord, b: TeacherCheckInRecord) => b.date.localeCompare(a.date));
    const mine = monthly.rows[0];
    const pendingLeaves = (teacherCheckIn.leaveRequests || []).filter((r: any) => r.teacherId === selectedId && r.status === 'pending').length;
    const doneToday = !!selectedRec?.checkOut || selectedRec?.status === 'leave';
    const btnLabel = !selectedRec?.checkIn ? 'CHECK IN' : !selectedRec?.checkOut ? 'CHECK OUT' : 'DONE';
    const onBig = () => (!selectedRec?.checkIn ? doCheckIn() : !selectedRec?.checkOut ? doCheckOut() : undefined);
    const firstName = (selected?.nameKhmer || currentUser.khmerName || '').split('(')[0].trim();
    return (
      <div className="mx-auto max-w-xl space-y-3 font-khmer">
        {canManage && (
          <button onClick={() => setMode('manage')} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
            ← គ្រប់គ្រងវត្តមានបុគ្គលិកទាំងអស់
          </button>
        )}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 p-4 text-white shadow-lg shadow-teal-900/20">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/5" />
          <div className="relative text-base font-bold leading-tight">សួស្តី, {firstName || 'បុគ្គលិក'}</div>
          <div className="relative text-[11px] text-teal-100">{dateLabel}</div>
          <div className="relative mt-2 flex items-center justify-between gap-2">
            <div>
              <div className="font-mono text-4xl font-black tabular-nums sm:text-5xl">
                {hhmm(now)}<span className="text-xl text-teal-200 sm:text-3xl">:{pad(now.getSeconds())}</span>
              </div>
              <div className="mt-1 text-[11px] text-teal-100">
                ចូល {selectedRec?.checkIn || '--:--'} · ចេញ {selectedRec?.checkOut || '--:--'}
                {selectedRec && <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_UI[selectedRec.status].cls}`}>{STATUS_UI[selectedRec.status].label}</span>}
              </div>
            </div>
            <button
              type="button"
              disabled={!selected || doneToday}
              onClick={onBig}
              className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-amber-400 text-xs font-bold tracking-wide shadow-[0_0_24px_rgba(251,191,36,0.35)] transition active:scale-95 disabled:opacity-50 sm:h-28 sm:w-28 sm:text-sm ${
                !selectedRec?.checkIn ? 'bg-white text-teal-800' : 'bg-amber-400 text-slate-900'
              }`}
            >
              {btnLabel}
            </button>
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="កំណត់សម្គាល់ (ជម្រើស)"
            className="relative mt-3 w-full rounded-xl bg-white/10 px-3 py-1.5 text-xs text-white placeholder:text-teal-100 focus:bg-white/15 focus:outline-none"
          />
          {!linkedTeacher && (
            <p className="relative mt-2 rounded-lg bg-amber-400/95 px-2 py-1.5 text-[10px] font-bold leading-snug text-slate-900">
              គណនីរបស់អ្នកមិនទាន់ភ្ជាប់ជាមួយឈ្មោះក្នុងបញ្ជីគ្រូទេ។ សូមឱ្យ Admin ភ្ជាប់នៅ ការកំណត់ → អ្នកប្រើប្រាស់។
            </p>
          )}
        </div>

        {/* Quick tiles */}
        <div className="grid grid-cols-3 overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
          {[
            { label: 'វត្តមានរបស់ខ្ញុំ', en: 'Attendance', Icon: Clock, onClick: () => document.getElementById('my-attendance')?.scrollIntoView({ behavior: 'smooth' }), badge: mine ? `${mine.present}` : '' },
            { label: 'សុំច្បាប់', en: 'Leave', Icon: Send, onClick: () => go('teacher_leave'), badge: pendingLeaves ? `${pendingLeaves}` : '' },
            { label: 'វត្តមានសិស្ស', en: 'Student Attendance', Icon: ClipboardCheck, onClick: () => go('student_attendance') },
            { label: 'បញ្ជីសិស្ស', en: 'Student List', Icon: Users, onClick: () => go('student_list') },
            { label: 'ព័ត៌មានសិស្ស', en: 'Student Info', Icon: ListChecks, onClick: () => go('student_info') },
            { label: 'សរុបខែនេះ', en: 'This month', Icon: CalendarDays, onClick: () => setTab('month') },
          ].filter((x) => currentUser.role === 'teacher' || !['Student Attendance', 'Student List', 'Student Info'].includes(x.en)).map(({ label, en, Icon, onClick, badge }) => (
            <button key={en} type="button" onClick={onClick} className="relative flex flex-col items-center gap-1 border-b border-r border-slate-100 px-1 py-3 hover:bg-teal-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Icon className="h-5 w-5" strokeWidth={1.9} /></span>
              <span className="text-[11px] font-bold leading-tight sm:text-sm">{label}</span>
              <span className="hidden text-[10px] text-slate-400 sm:block">{en}</span>
              {badge && <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-slate-900">{badge}</span>}
            </button>
          ))}
        </div>

        {/* My attendance this month */}
        <div id="my-attendance" className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-900">វត្តមានរបស់ខ្ញុំ (ខែនេះ)</div>
            {mine && (
              <div className="flex gap-1.5 text-[10px] font-bold">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">មក {mine.present}</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">យឺត {mine.late}</span>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-800">ច្បាប់ {mine.leave}</span>
              </div>
            )}
          </div>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-xs">
            {myMonth.length === 0 && <div className="p-4 text-center text-slate-400">មិនទាន់មានការចុះវត្តមានខែនេះ</div>}
            {myMonth.map((r: TeacherCheckInRecord) => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2">
                <span className="font-mono">{r.date.split('-').reverse().join('-')}</span>
                <span className="font-mono text-slate-600">{r.checkIn || '--:--'} → {r.checkOut || '--:--'}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_UI[r.status].cls}`}>{STATUS_UI[r.status].label}</span>
              </div>
            ))}
          </div>
        </div>

        {tab === 'month' && mine && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs">
            <div className="mb-2 text-sm font-bold text-slate-900">សរុបប្រចាំខែ</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[['វត្តមាន', mine.present, 'text-emerald-700'], ['យឺត', mine.late, 'text-amber-700'], ['ច្បាប់', mine.leave, 'text-sky-700'], ['អវត្តមាន', mine.absent, 'text-rose-700']].map(([l, v, c]) => (
                <div key={l as string} className="rounded-xl bg-slate-50 p-2">
                  <div className={`font-mono text-xl font-black ${c}`}>{v as number}</div>
                  <div className="text-[10px] text-slate-500">{l as string}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">ម៉ោងធ្វើការសរុប៖ {fmtDur(mine.mins)} · ថ្ងៃធ្វើការ {monthly.workDays} ថ្ងៃ</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 font-khmer">
      {/* Header */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">ចុះវត្តមានគ្រូ (Attendance Check In)</h2>
          <p className="text-xs text-slate-500">
            ម៉ោងចូលធ្វើការ {startTime} · យឺតបើលើស {lateGraceMinutes} នាទី · ម៉ោងចេញ {endTime}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            {(['today', 'month'] as const).map((k) => (
              <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-3 py-1.5 ${tab === k ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500'}`}>
                {k === 'today' ? 'ប្រចាំថ្ងៃ' : 'សរុបប្រចាំខែ'}
              </button>
            ))}
          </div>
          {canManage && (
            <button
              onClick={() => { setMode('me'); setDate(isoOf(new Date())); }}
              className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700"
              title={linkedTeacher ? '' : 'គណនីនេះមិនទាន់ភ្ជាប់ឈ្មោះក្នុងបញ្ជីបុគ្គលិក'}
            >
              Check In ខ្លួនឯង
            </button>
          )}
          {canManage && (
            <button onClick={() => setShowSettings((v) => !v)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" title="កំណត់ម៉ោង">
              <Settings2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {showSettings && canManage && (
        <div className="no-print grid grid-cols-1 gap-3 rounded-2xl border border-teal-200 bg-teal-50/50 p-4 sm:grid-cols-3">
          {[
            ['ម៉ោងចូលធ្វើការ', 'startTime', 'time'],
            ['ម៉ោងចេញ', 'endTime', 'time'],
            ['អនុញ្ញាតយឺត (នាទី)', 'lateGraceMinutes', 'number'],
          ].map(([label, key, type]) => (
            <label key={key} className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
              {label}
              <input
                type={type}
                min={0}
                value={(teacherCheckIn as any)[key]}
                onChange={(e) => setTeacherCheckIn((p: any) => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
              />
            </label>
          ))}
        </div>
      )}

      {tab === 'today' && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 no-print">
            {/* Check-in panel */}
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-600 to-teal-800 p-5 text-white lg:col-span-1">
              <div className="flex items-center gap-2 text-teal-100 text-xs"><Clock className="h-4 w-4" /> {isToday ? 'ម៉ោងឥឡូវនេះ' : 'ថ្ងៃដែលបានជ្រើស'}</div>
              <div className="mt-1 font-mono text-4xl font-black tabular-nums">{isToday ? hhmm(now) + `:${pad(now.getSeconds())}` : date}</div>
              <div className="text-xs text-teal-100">{dateLabel}</div>

              <div className="mt-4 rounded-xl bg-white/10 p-3">
                <div className="text-[11px] text-teal-100">គ្រូដែលបានជ្រើស</div>
                <div className="text-base font-bold">{selected ? selected.nameKhmer : '— សូមជ្រើសឈ្មោះខាងស្តាំ —'}</div>
                {selected && (
                  <div className="mt-1 text-[11px] text-teal-100">
                    {selected.position || selected.homeroomClassName || ''} · ចូល {selectedRec?.checkIn || '--:--'} · ចេញ {selectedRec?.checkOut || '--:--'}
                  </div>
                )}
              </div>

              {canManage && (
                <label className="mt-3 flex items-center gap-2 text-[11px] text-teal-100">
                  ម៉ោងផ្សេង (បើកត់ត្រាតាមក្រោយ)
                  <input type="time" value={manualTime} onChange={(e) => setManualTime(e.target.value)} className="rounded-lg bg-white/90 px-2 py-1 text-xs text-slate-900" />
                </label>
              )}
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="កំណត់សម្គាល់ (ជម្រើស)"
                className="mt-2 w-full rounded-lg bg-white/90 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400"
              />

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  disabled={!selected || !!selectedRec?.checkIn}
                  onClick={doCheckIn}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-white py-3 text-sm font-bold text-teal-800 hover:bg-teal-50 disabled:opacity-40"
                >
                  <LogIn className="h-4 w-4" /> ចូល (In)
                </button>
                <button
                  disabled={!selected || !selectedRec?.checkIn || !!selectedRec?.checkOut}
                  onClick={doCheckOut}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 py-3 text-sm font-bold text-slate-900 hover:bg-amber-300 disabled:opacity-40"
                >
                  <LogOut className="h-4 w-4" /> ចេញ (Out)
                </button>
              </div>
              {!selfOnly && <button
                disabled={!selected || !!selectedRec?.checkIn}
                onClick={doLeave}
                className="mt-2 w-full rounded-xl border border-white/40 py-2 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-40"
              >
                <FileText className="mr-1 inline h-3.5 w-3.5" /> សុំច្បាប់ (Leave)
              </button>}
              {selfOnly && !linkedTeacher && (
                <p className="mt-3 rounded-lg bg-amber-400/90 p-2 text-[11px] font-bold text-slate-900">
                  គណនីរបស់អ្នកមិនទាន់ភ្ជាប់ជាមួយឈ្មោះក្នុងបញ្ជីគ្រូទេ។ សូមឱ្យ Admin ភ្ជាប់នៅ ការកំណត់ → អ្នកប្រើប្រាស់។
                </p>
              )}
            </div>

            {/* Teacher picker (admin / accounting) — a teacher sees only their own history */}
            {selfOnly ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
                <div className="mb-2 text-sm font-bold text-slate-900">ប្រវត្តិចុះវត្តមានរបស់ខ្ញុំ (ខែនេះ)</div>
                <div className="max-h-[22rem] overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>{['ថ្ងៃ', 'ចូល', 'ចេញ', 'រយៈពេល', 'ស្ថានភាព'].map((h) => <th key={h} className="px-2 py-2 text-left font-bold">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records
                        .filter((r: TeacherCheckInRecord) => r.teacherId === selectedId && r.date.slice(0, 7) === today.slice(0, 7))
                        .sort((a: TeacherCheckInRecord, b: TeacherCheckInRecord) => b.date.localeCompare(a.date))
                        .map((r: TeacherCheckInRecord) => (
                          <tr key={r.id}>
                            <td className="px-2 py-1.5 font-mono">{r.date.split('-').reverse().join('-')}</td>
                            <td className="px-2 py-1.5 font-mono">{r.checkIn || '-'}</td>
                            <td className="px-2 py-1.5 font-mono">{r.checkOut || '-'}</td>
                            <td className="px-2 py-1.5 font-mono">{fmtDur(toMin(r.checkOut) - toMin(r.checkIn))}</td>
                            <td className="px-2 py-1.5"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_UI[r.status].cls}`}>{STATUS_UI[r.status].label}</span></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ស្វែងរកឈ្មោះគ្រូ…"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs"
                  />
                </div>
                {canManage && (
                  <label className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <CalendarDays className="h-4 w-4" />
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs" />
                  </label>
                )}
              </div>
              <div className="grid max-h-[22rem] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                {list.map((t) => {
                  const r = recOf(t.id);
                  const st = r ? r.status : 'none';
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className={`rounded-xl border p-2.5 text-left transition ${
                        selectedId === t.id ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="truncate text-xs font-bold text-slate-900">{t.nameKhmer}</div>
                      <div className="truncate text-[10px] text-slate-500">{t.position || t.homeroomClassName || t.teacherCode}</div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${STATUS_UI[st].cls}`}>{STATUS_UI[st].label}</span>
                        <span className="font-mono text-[10px] text-slate-500">{r?.checkIn || ''}{r?.checkOut ? `→${r.checkOut}` : ''}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            )}
          </div>

          {/* Summary + table (admin / accounting) */}
          {!selfOnly && (<>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 no-print">
            {(['on_time', 'late', 'leave', 'none'] as const).map((k) => (
              <div key={k} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_UI[k].cls}`}>{STATUS_UI[k].label}</div>
                <div className="mt-1 font-mono text-2xl font-black text-slate-900">{counts[k]}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 print:border-0 print:p-0">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-muol text-sm text-slate-900">បញ្ជីវត្តមានគ្រូប្រចាំថ្ងៃ</div>
                <div className="text-[11px] text-slate-500">{settings.schoolNameKhmer} · {dateLabel}</div>
              </div>
              <button onClick={() => window.print()} className="no-print flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">
                <Printer className="h-4 w-4" /> បោះពុម្ព
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-300">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-amber-400 text-slate-900">
                    {['ល.រ', 'ឈ្មោះ', 'តួនាទី', 'ម៉ោងចូល', 'ម៉ោងចេញ', 'រយៈពេល', 'ស្ថានភាព', 'កំណត់សម្គាល់'].map((h) => (
                      <th key={h} className="border-r border-amber-500 px-2 py-2 text-center font-bold">{h}</th>
                    ))}
                    {canManage && <th className="no-print px-2 py-2" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(teachers as TeacherRecord[]).map((t, i) => {
                    const r = recOf(t.id);
                    const st = r ? r.status : 'none';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="border-r border-slate-200 px-2 py-1.5 text-center font-mono">{i + 1}</td>
                        <td className="border-r border-slate-200 px-2 py-1.5">
                          <div className="font-bold text-slate-900">{t.nameKhmer}</div>
                          <div className="text-[10px] text-slate-500">{t.nameEnglish}</div>
                        </td>
                        <td className="border-r border-slate-200 px-2 py-1.5 text-center">{t.position || t.homeroomClassName || ''}</td>
                        <td className={`border-r border-slate-200 px-2 py-1.5 text-center font-mono ${r?.status === 'late' ? 'font-bold text-amber-700' : ''}`}>{r?.checkIn || '-'}</td>
                        <td className="border-r border-slate-200 px-2 py-1.5 text-center font-mono">{r?.checkOut || '-'}</td>
                        <td className="border-r border-slate-200 px-2 py-1.5 text-center font-mono">{fmtDur(toMin(r?.checkOut) - toMin(r?.checkIn))}</td>
                        <td className="border-r border-slate-200 px-2 py-1.5 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_UI[st].cls}`}>{STATUS_UI[st].label}</span>
                        </td>
                        <td className="border-r border-slate-200 px-2 py-1.5 text-[11px] text-slate-600">{r?.note || ''}</td>
                        {canManage && (
                          <td className="no-print px-2 py-1.5 text-center">
                            {r && (
                              <button onClick={() => clearRec(t.id)} className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="លុប">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </>)}
        </>
      )}

      {tab === 'month' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 print:border-0 print:p-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-muol text-sm text-slate-900">របាយការណ៍វត្តមានគ្រូប្រចាំខែ</div>
              <div className="text-[11px] text-slate-500">
                {settings.schoolNameKhmer} · ថ្ងៃធ្វើការ (ចន្ទ–សុក្រ) {monthly.workDays} ថ្ងៃ
              </div>
            </div>
            <div className="no-print flex items-center gap-2">
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
              <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">
                <Printer className="h-4 w-4" /> បោះពុម្ព
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-300">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-amber-400 text-slate-900">
                  {['ល.រ', 'ឈ្មោះ', 'តួនាទី', 'វត្តមាន', 'មកយឺត', 'សុំច្បាប់', 'អវត្តមាន', 'ម៉ោងធ្វើការសរុប'].map((h) => (
                    <th key={h} className="border-r border-amber-500 px-2 py-2 text-center font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {monthly.rows.map((r, i) => (
                  <tr key={r.t.id}>
                    <td className="border-r border-slate-200 px-2 py-1.5 text-center font-mono">{i + 1}</td>
                    <td className="border-r border-slate-200 px-2 py-1.5 font-bold">{r.t.nameKhmer}</td>
                    <td className="border-r border-slate-200 px-2 py-1.5 text-center">{r.t.position || ''}</td>
                    <td className="border-r border-slate-200 px-2 py-1.5 text-center font-mono text-emerald-700">{r.present}</td>
                    <td className="border-r border-slate-200 px-2 py-1.5 text-center font-mono text-amber-700">{r.late}</td>
                    <td className="border-r border-slate-200 px-2 py-1.5 text-center font-mono text-sky-700">{r.leave}</td>
                    <td className="border-r border-slate-200 px-2 py-1.5 text-center font-mono text-rose-700">{r.absent}</td>
                    <td className="px-2 py-1.5 text-center font-mono">{fmtDur(r.mins)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-6 text-center text-xs">
            <div><div className="font-bold">បានឃើញ និងឯកភាព</div><div className="h-16" /><div className="font-bold">{settings.directorName}</div></div>
            <div><div className="font-bold">រៀបចំ និងត្រួតពិនិត្យ</div><div className="h-16" /><div className="font-bold">{settings.accountantName}</div></div>
          </div>
        </div>
      )}

      {tab === 'today' && !selfOnly && counts.none > 0 && isToday && (
        <p className="no-print flex items-center gap-1.5 text-[11px] text-slate-500">
          <UserCheck className="h-3.5 w-3.5" /> គ្រូ {counts.none} នាក់មិនទាន់ចុះវត្តមានថ្ងៃនេះ
        </p>
      )}
    </div>
  );
};
