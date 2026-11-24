// "កាលវិភាគរបស់ខ្ញុំ" — a teacher's own timetable by day, week and month, built for phones first.
// Admin / staff can pick any teacher. Holidays from System Settings are shown as days off.
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ScheduleSlot, ScheduleTimePeriod, TeacherRecord } from '../types';
import { holidayOn } from '../utils/shifts';
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock, DoorOpen, Users } from 'lucide-react';

type Day = ScheduleSlot['dayOfWeek'];
const WEEK: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const JS_DAY: Day[] = [undefined as any, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; // getDay() 0 = Sunday
const DAY_KH: Record<Day, string> = { Monday: 'ចន្ទ', Tuesday: 'អង្គារ', Wednesday: 'ពុធ', Thursday: 'ព្រហស្បតិ៍', Friday: 'សុក្រ', Saturday: 'សៅរ៍' };
const DOW_SHORT = ['អា', 'ច', 'អ', 'ពុ', 'ព្រ', 'សុ', 'ស'];
const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
const toMin = (t?: string) => {
  const m = (t || '').match(/(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
};
const rangeOf = (s: ScheduleSlot, periods: ScheduleTimePeriod[]) => {
  const t = s.timeSlot || periods.find((p) => p.period === s.periodNumber)?.time || '';
  const [a, b] = t.split(/\s*[-–]\s*/);
  return { text: t, start: toMin(a), end: toMin(b) };
};
const PALETTE = ['bg-teal-50 border-teal-200 text-teal-900', 'bg-indigo-50 border-indigo-200 text-indigo-900', 'bg-amber-50 border-amber-200 text-amber-900', 'bg-rose-50 border-rose-200 text-rose-900', 'bg-sky-50 border-sky-200 text-sky-900', 'bg-violet-50 border-violet-200 text-violet-900', 'bg-emerald-50 border-emerald-200 text-emerald-900'];

export const MyScheduleView: React.FC = () => {
  const { currentUser, linkedTeacher, teachers, teacherSchedules, scheduleTimePeriods, teacherCheckIn } = useApp() as any;
  const isTeacher = currentUser.role === 'teacher';
  const [pickedTeacherId, setPickedTeacherId] = useState<string>(linkedTeacher?.id || '');
  const teacher: TeacherRecord | undefined = isTeacher
    ? linkedTeacher
    : (teachers as TeacherRecord[]).find((t) => t.id === pickedTeacherId) || linkedTeacher || (teachers as TeacherRecord[])[0];

  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [cursor, setCursor] = useState(() => new Date());
  const todayIso = isoOf(new Date());
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const periods: ScheduleTimePeriod[] = scheduleTimePeriods || [];

  const mine: ScheduleSlot[] = useMemo(
    () => (teacherSchedules as ScheduleSlot[]).filter((s) => teacher && (s.teacherId === teacher.id || (!s.teacherId && s.teacherName === teacher.nameKhmer))),
    [teacherSchedules, teacher]
  );
  const byDay = useMemo(() => {
    const m: Record<string, ScheduleSlot[]> = {};
    WEEK.forEach((d) => (m[d] = mine.filter((s) => s.dayOfWeek === d).sort((a, b) => a.periodNumber - b.periodNumber)));
    return m;
  }, [mine]);
  // stable colour per subject
  const colorOf = useMemo(() => {
    const names = Array.from(new Set(mine.map((s) => s.subjectName)));
    return (name: string) => PALETTE[Math.max(0, names.indexOf(name)) % PALETTE.length];
  }, [mine]);
  const slotsOn = (d: Date) => (d.getDay() === 0 ? [] : byDay[JS_DAY[d.getDay()]] || []);
  const minutesOf = (list: ScheduleSlot[]) =>
    list.reduce((sum, s) => {
      const r = rangeOf(s, periods);
      return sum + (r.end > r.start ? r.end - r.start : 45);
    }, 0);
  const hoursText = (min: number) => (min % 60 ? `${Math.floor(min / 60)}ម៉ោង ${min % 60}នាទី` : `${min / 60} ម៉ោង`);

  const step = (dir: 1 | -1) =>
    setCursor((c) => (view === 'day' ? addDays(c, dir) : view === 'week' ? addDays(c, 7 * dir) : new Date(c.getFullYear(), c.getMonth() + dir, 1)));

  // ---------- one lesson card ----------
  const Lesson: React.FC<{ s: ScheduleSlot; date?: string; compact?: boolean }> = ({ s, date, compact }) => {
    const r = rangeOf(s, periods);
    const live = date === todayIso && nowMin >= r.start && nowMin < r.end;
    return (
      <div className={`flex gap-3 rounded-2xl border p-3 ${colorOf(s.subjectName)} ${live ? 'ring-2 ring-teal-500' : ''}`}>
        <div className="w-14 shrink-0 text-center">
          <div className="text-[10px] font-bold opacity-70">ម៉ោងទី {s.periodNumber}</div>
          <div className="font-mono text-sm font-bold">{r.text.split(/\s*[-–]\s*/)[0] || '--:--'}</div>
          <div className="font-mono text-[10px] opacity-70">{r.text.split(/\s*[-–]\s*/)[1] || ''}</div>
        </div>
        <div className="min-w-0 flex-1 border-l border-current/10 pl-3">
          <div className="flex items-center gap-1.5">
            <div className="truncate text-sm font-bold">{s.subjectName}</div>
            {live && <span className="shrink-0 rounded-full bg-teal-600 px-1.5 text-[10px] font-bold text-white">កំពុងបង្រៀន</span>}
          </div>
          {!compact && (
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] opacity-80">
              <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{s.className}</span>
              {s.room && <span className="inline-flex items-center gap-1"><DoorOpen className="h-3 w-3" />{s.room}</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  const DayList: React.FC<{ date: Date }> = ({ date }) => {
    const iso = isoOf(date);
    const hol = holidayOn(teacherCheckIn, iso);
    const list = slotsOn(date);
    if (date.getDay() === 0) return <Empty text="ថ្ងៃអាទិត្យ · ឈប់សម្រាក" />;
    if (hol) return <Empty text={`🎉 ថ្ងៃឈប់សម្រាក៖ ${hol.name}`} tone="violet" />;
    if (!list.length) return <Empty text="មិនមានម៉ោងបង្រៀនទេ" />;
    return (
      <div className="space-y-2">
        {list.map((s) => <Lesson key={s.id} s={s} date={iso} />)}
      </div>
    );
  };

  // ---------- header ----------
  const weekStart = mondayOf(cursor);
  const title =
    view === 'day'
      ? `${cursor.getDay() === 0 ? 'អាទិត្យ' : DAY_KH[JS_DAY[cursor.getDay()]]} ${cursor.getDate()} ${KH_MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
      : view === 'week'
      ? `${weekStart.getDate()} ${KH_MONTHS[weekStart.getMonth()]} – ${addDays(weekStart, 5).getDate()} ${KH_MONTHS[addDays(weekStart, 5).getMonth()]}`
      : `ខែ${KH_MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const weekMinutes = minutesOf(mine);
  const weekCount = mine.length;

  // month grid
  const monthCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = addDays(first, -first.getDay()); // from Sunday
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);
  const monthStats = useMemo(() => {
    let lessons = 0, minutes = 0, days = 0;
    const y = cursor.getFullYear(), m = cursor.getMonth();
    for (let d = new Date(y, m, 1); d.getMonth() === m; d = addDays(d, 1)) {
      if (holidayOn(teacherCheckIn, isoOf(d))) continue;
      const l = slotsOn(d);
      if (l.length) { days++; lessons += l.length; minutes += minutesOf(l); }
    }
    return { lessons, minutes, days };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, byDay, teacherCheckIn]);

  if (!teacher) {
    return <Empty text={isTeacher ? 'គណនីរបស់អ្នកមិនទាន់ភ្ជាប់ជាមួយបុគ្គលិកទេ · សូមទាក់ទង Admin' : 'មិនមានគ្រូ'} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3 font-khmer">
      {/* Teacher + view switch */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><CalendarDays className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-slate-500">កាលវិភាគបង្រៀន</div>
            {isTeacher ? (
              <div className="truncate text-base font-bold text-slate-900">{teacher.nameKhmer}</div>
            ) : (
              <select value={teacher.id} onChange={(e) => setPickedTeacherId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-bold">
                {(teachers as TeacherRecord[]).filter((t) => t.status !== 'resigned').map((t) => (
                  <option key={t.id} value={t.id}>{t.nameKhmer}{t.position ? ` · ${t.position}` : ''}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          {([['day', 'ថ្ងៃ'], ['week', 'សប្តាហ៍'], ['month', 'ខែ']] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setView(k)} className={`flex-1 rounded-lg py-2 ${view === k ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500'}`}>{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => step(-1)} className="rounded-xl border border-slate-200 p-2 text-slate-600"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => setCursor(new Date())} className="min-w-0 flex-1 truncate text-center text-sm font-bold text-slate-900">{title}</button>
          <button type="button" onClick={() => step(1)} className="rounded-xl border border-slate-200 p-2 text-slate-600"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {(view === 'month'
            ? [['ម៉ោងបង្រៀន', monthStats.lessons], ['ថ្ងៃបង្រៀន', monthStats.days], ['សរុប', hoursText(monthStats.minutes)]]
            : view === 'week'
            ? [['ម៉ោងបង្រៀន', weekCount], ['ថ្នាក់', new Set(mine.map((s) => s.classId)).size], ['សរុប', hoursText(weekMinutes)]]
            : [['ម៉ោងបង្រៀន', slotsOn(cursor).length], ['ថ្នាក់', new Set(slotsOn(cursor).map((s) => s.classId)).size], ['សរុប', hoursText(minutesOf(slotsOn(cursor)))]]
          ).map(([k, v]) => (
            <div key={k as string} className="rounded-xl bg-slate-50 py-1.5">
              <div className="text-[10px] text-slate-500">{k}</div>
              <div className="text-sm font-bold text-slate-900">{v as any}</div>
            </div>
          ))}
        </div>
      </div>

      {/* DAY */}
      {view === 'day' && <DayList date={cursor} />}

      {/* WEEK: one block per day (phone) */}
      {view === 'week' && (
        <div className="space-y-3">
          {WEEK.map((d, i) => {
            const date = addDays(weekStart, i);
            const iso = isoOf(date);
            const hol = holidayOn(teacherCheckIn, iso);
            const list = byDay[d];
            return (
              <div key={d} className={`rounded-2xl border bg-white p-3 ${iso === todayIso ? 'border-teal-400' : 'border-slate-200'}`}>
                <button type="button" onClick={() => { setCursor(date); setView('day'); }} className="mb-2 flex w-full items-center justify-between text-left">
                  <span className="text-sm font-bold text-slate-900">
                    {DAY_KH[d]} <span className="font-normal text-slate-500">{date.getDate()}/{date.getMonth() + 1}</span>
                    {iso === todayIso && <span className="ml-1.5 rounded-full bg-teal-600 px-1.5 text-[10px] text-white">ថ្ងៃនេះ</span>}
                  </span>
                  <span className="text-[11px] text-slate-500">{hol ? '' : `${list.length} ម៉ោង`}</span>
                </button>
                {hol ? (
                  <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">🎉 {hol.name}</div>
                ) : list.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">{list.map((s) => <Lesson key={s.id} s={s} date={iso} />)}</div>
                ) : (
                  <div className="text-xs text-slate-400">មិនមានម៉ោងបង្រៀន</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MONTH: calendar + list of the chosen day */}
      {view === 'month' && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs">
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400">
              {DOW_SHORT.map((d, i) => <div key={d} className={`py-1 ${i === 0 ? 'text-rose-600' : ''}`}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthCells.map((d) => {
                const iso = isoOf(d);
                const inMonth = d.getMonth() === cursor.getMonth();
                const hol = holidayOn(teacherCheckIn, iso);
                const n = hol ? 0 : slotsOn(d).length;
                const selected = iso === isoOf(cursor);
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setCursor(d)}
                    className={`flex aspect-square min-h-0 flex-col items-center justify-center rounded-xl text-xs ${!inMonth ? 'opacity-30' : ''} ${
                      selected ? 'bg-teal-600 text-white' : hol || d.getDay() === 0 ? 'bg-rose-50 font-bold text-rose-600' : iso === todayIso ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <span className="font-mono">{d.getDate()}</span>
                    <span className="mt-0.5 flex h-1.5 gap-0.5">
                      {hol ? <span className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-white' : 'bg-rose-500'}`} /> :
                        Array.from({ length: Math.min(n, 4) }, (_, k) => <span key={k} className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-white' : 'bg-teal-500'}`} />)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="px-1 text-xs font-bold text-slate-600">
            {cursor.getDay() === 0 ? 'អាទិត្យ' : DAY_KH[JS_DAY[cursor.getDay()]]} {cursor.getDate()} {KH_MONTHS[cursor.getMonth()]}
          </div>
          <DayList date={cursor} />
        </>
      )}

      {/* Subjects legend */}
      {mine.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700"><BookOpen className="h-4 w-4" /> មុខវិជ្ជាក្នុងមួយសប្តាហ៍</div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(new Set(mine.map((s) => s.subjectName))).map((name) => (
              <span key={name} className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${colorOf(name)}`}>
                {name} · {mine.filter((s) => s.subjectName === name).length}
              </span>
            ))}
          </div>
        </div>
      )}
      {mine.length === 0 && (
        <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-500">
          <Clock className="h-4 w-4" /> មិនទាន់មានម៉ោងបង្រៀនក្នុងកាលវិភាគទេ · Admin បញ្ចូលនៅទំព័រ «កាលវិភាគបង្រៀន»
        </div>
      )}
    </div>
  );
};

const Empty: React.FC<{ text: string; tone?: 'violet' }> = ({ text, tone }) => (
  <div className={`rounded-2xl border border-dashed p-6 text-center text-sm font-khmer ${tone === 'violet' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-400'}`}>{text}</div>
);
