// Forgot to check in / out? Staff send a correction request; Admin approves (or edits directly).
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { CheckInCorrection, TeacherCheckInRecord, TeacherRecord } from '../types';
import { shiftFor } from '../utils/shifts';
import { Check, Clock3, PencilLine, X } from 'lucide-react';

const toMin = (t?: string) => {
  if (!t) return NaN;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** Write the corrected times into the day's record (status recomputed from the shift start) */
export const applyCorrectionTo = (
  prev: any,
  opts: { teacherId: string; date: string; checkIn?: string; checkOut?: string; note?: string; by: string; status?: TeacherCheckInRecord['status'] }
) => {
  const id = `${opts.date}_${opts.teacherId}`;
  const existing: TeacherCheckInRecord | undefined = (prev.records || []).find((r: TeacherCheckInRecord) => r.id === id);
  const checkIn = opts.checkIn || existing?.checkIn;
  const checkOut = opts.checkOut || existing?.checkOut;
  const start = shiftFor(prev, opts.teacherId, opts.date)?.start || prev.startTime;
  const late = checkIn ? toMin(checkIn) > toMin(start) + (Number(prev.lateGraceMinutes) || 0) : false;
  const status: TeacherCheckInRecord['status'] = opts.status || (checkIn ? (late ? 'late' : 'on_time') : existing?.status || 'on_time');
  const next: TeacherCheckInRecord = {
    id,
    teacherId: opts.teacherId,
    date: opts.date,
    ...(existing || {}),
    checkIn: status === 'leave' || status === 'absent' ? undefined : checkIn,
    checkOut: status === 'leave' || status === 'absent' ? undefined : checkOut,
    status,
    note: opts.note ?? existing?.note,
    recordedBy: opts.by,
  };
  return { ...prev, records: [...(prev.records || []).filter((r: TeacherCheckInRecord) => r.id !== id), next] };
};

/** Shared form: 'request' = staff asks Admin; 'edit' = Admin fixes / records on someone's behalf */
export const CorrectionFormModal: React.FC<{
  mode: 'request' | 'edit';
  teacher: TeacherRecord;
  date: string;
  onClose: () => void;
}> = ({ mode, teacher, date: initialDate, onClose }) => {
  const { teacherCheckIn, setTeacherCheckIn, currentUser, showNotification, sendTelegramAlert, syncedGet, syncedSet } = useApp() as any;
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(initialDate > today ? today : initialDate);
  const rec: TeacherCheckInRecord | undefined = (teacherCheckIn.records || []).find((r: TeacherCheckInRecord) => r.teacherId === teacher.id && r.date === date);
  const [checkIn, setCheckIn] = useState(rec?.checkIn || '');
  const [checkOut, setCheckOut] = useState(rec?.checkOut || '');
  const [status, setStatus] = useState<'auto' | 'leave' | 'absent'>(rec?.status === 'leave' ? 'leave' : rec?.status === 'absent' ? 'absent' : 'auto');
  const [reason, setReason] = useState('');
  const by = currentUser.khmerName || currentUser.name;

  // keep form in step with the chosen day
  const pickDate = (d: string) => {
    setDate(d);
    const r: TeacherCheckInRecord | undefined = (teacherCheckIn.records || []).find((x: TeacherCheckInRecord) => x.teacherId === teacher.id && x.date === d);
    setCheckIn(r?.checkIn || '');
    setCheckOut(r?.checkOut || '');
  };

  const changed = checkIn !== (rec?.checkIn || '') || checkOut !== (rec?.checkOut || '') || (mode === 'edit' && status !== 'auto');
  const valid =
    !!date && (status !== 'auto' || !!checkIn || !!checkOut) && (!checkIn || !checkOut || toMin(checkOut) > toMin(checkIn)) && (mode === 'edit' || (!!reason.trim() && changed));

  const submit = () => {
    if (!valid) return;
    if (mode === 'request') {
      const req: CheckInCorrection = {
        id: `corr_${Date.now()}`,
        teacherId: teacher.id,
        teacherName: teacher.nameKhmer,
        date,
        ...(checkIn && checkIn !== rec?.checkIn ? { checkIn } : {}),
        ...(checkOut && checkOut !== rec?.checkOut ? { checkOut } : {}),
        reason: reason.trim(),
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };
      setTeacherCheckIn((p: any) => ({ ...p, corrections: [...(p.corrections || []), req] }));
      showNotification?.('បានផ្ញើសំណើកែវត្តមាន', 'success');
      try {
        sendTelegramAlert?.(
          '🛠️ សំណើកែវត្តមាន',
          [`👩‍🏫 ${teacher.nameKhmer}`, `📅 ${date}`, `🕒 ចូល ${req.checkIn || rec?.checkIn || '-'} · ចេញ ${req.checkOut || rec?.checkOut || '-'}`, `📝 ${req.reason}`].join('\n'),
          'system'
        );
      } catch {
        /* ignore */
      }
    } else {
      const note = reason.trim() ? `កែតម្រូវ៖ ${reason.trim()}` : rec?.note;
      setTeacherCheckIn((p: any) =>
        applyCorrectionTo(p, { teacherId: teacher.id, date, checkIn: checkIn || undefined, checkOut: checkOut || undefined, note, by, status: status === 'auto' ? undefined : status })
      );
      // keep the older daily Teacher Attendance sheet in step
      try {
        const key = `BIM_RANGSEI_TEACHER_ATT_${date}`;
        const cur = { ...(syncedGet?.(key) || {}) };
        cur[teacher.id] = { status: status === 'auto' ? 'present' : status, note: note || '' };
        syncedSet?.(key, cur);
      } catch {
        /* ignore */
      }
      showNotification?.(`បានកែវត្តមាន ${teacher.nameKhmer} ថ្ងៃ ${date}`, 'success');
    }
    onClose();
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl font-khmer" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900">
            <PencilLine className="h-5 w-5 text-indigo-600" />
            {mode === 'request' ? 'ស្នើកែវត្តមាន' : 'កែ / ដាក់វត្តមានជំនួស'}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
          <b>{teacher.nameKhmer}</b>
          <span className="ml-1 text-xs text-slate-500">{teacher.position || teacher.teacherCode}</span>
          <div className="text-[11px] text-slate-500">បច្ចុប្បន្ន៖ ចូល {rec?.checkIn || '--:--'} · ចេញ {rec?.checkOut || '--:--'}</div>
        </div>

        <div className="space-y-2 text-xs font-bold text-slate-600">
          <label className="flex flex-col gap-1">ថ្ងៃ
            <input type="date" value={date} max={today} onChange={(e) => e.target.value && pickDate(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm" />
          </label>
          {mode === 'edit' && (
            <div className="flex rounded-lg bg-slate-100 p-1">
              {([['auto', 'មកធ្វើការ'], ['leave', 'ច្បាប់'], ['absent', 'អវត្តមាន']] as const).map(([k, l]) => (
                <button key={k} type="button" onClick={() => setStatus(k)} className={`flex-1 rounded-md py-1.5 ${status === k ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>{l}</button>
              ))}
            </div>
          )}
          {status === 'auto' && (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">ម៉ោងចូល
                <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm" />
              </label>
              <label className="flex flex-col gap-1">ម៉ោងចេញ
                <input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm" />
              </label>
            </div>
          )}
          {checkIn && checkOut && toMin(checkOut) <= toMin(checkIn) && <div className="text-rose-600">ម៉ោងចេញត្រូវក្រោយម៉ោងចូល</div>}
          <label className="flex flex-col gap-1">{mode === 'request' ? 'មូលហេតុ (ចាំបាច់)' : 'មូលហេតុ / កំណត់សម្គាល់'}
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="ឧ. ភ្លេចស្កែនចេញ ព្រោះប្រញាប់ទៅប្រជុំ" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal" />
          </label>
        </div>

        <button onClick={submit} disabled={!valid} className="mt-3 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40">
          {mode === 'request' ? 'ផ្ញើសំណើទៅ Admin' : 'រក្សាទុក'}
        </button>
        {mode === 'request' && <p className="mt-1.5 text-center text-[11px] text-slate-500">Admin នឹងពិនិត្យ និងអនុម័ត · វត្តមាននឹងប្តូរពេលបានអនុម័ត</p>}
      </div>
    </div>
  );
};

const STATUS_PILL: Record<CheckInCorrection['status'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-700',
};
const STATUS_KH: Record<CheckInCorrection['status'], string> = { pending: 'រង់ចាំ', approved: 'អនុម័ត', rejected: 'បដិសេធ' };

/** List of correction requests: staff see their own; Admin can approve / reject */
export const CorrectionRequestsList: React.FC<{ teacherId?: string; canDecide?: boolean }> = ({ teacherId, canDecide }) => {
  const { teacherCheckIn, setTeacherCheckIn, currentUser, showNotification } = useApp() as any;
  const [filter, setFilter] = useState<'pending' | 'all'>(canDecide ? 'pending' : 'all');
  const all: CheckInCorrection[] = (teacherCheckIn.corrections || [])
    .filter((c: CheckInCorrection) => !teacherId || c.teacherId === teacherId)
    .sort((a: CheckInCorrection, b: CheckInCorrection) => b.requestedAt.localeCompare(a.requestedAt));
  const list = filter === 'pending' ? all.filter((c) => c.status === 'pending') : all;
  const by = currentUser.khmerName || currentUser.name;

  const decide = (c: CheckInCorrection, ok: boolean) => {
    const note = ok ? '' : window.prompt('មូលហេតុបដិសេធ (ជម្រើស)') || '';
    setTeacherCheckIn((p: any) => {
      let next = {
        ...p,
        corrections: (p.corrections || []).map((x: CheckInCorrection) =>
          x.id === c.id ? { ...x, status: ok ? 'approved' : 'rejected', decidedAt: new Date().toISOString(), decidedBy: by, decisionNote: note || undefined } : x
        ),
      };
      if (ok) next = applyCorrectionTo(next, { teacherId: c.teacherId, date: c.date, checkIn: c.checkIn, checkOut: c.checkOut, note: `កែតម្រូវ៖ ${c.reason}`, by });
      return next;
    });
    showNotification?.(ok ? `បានអនុម័ត និងកែវត្តមាន ${c.teacherName}` : 'បានបដិសេធ', ok ? 'success' : 'info');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 font-khmer">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
          <Clock3 className="h-4 w-4 text-indigo-600" /> សំណើកែវត្តមាន
          {all.some((c) => c.status === 'pending') && (
            <span className="rounded-full bg-amber-400 px-1.5 text-[10px] text-slate-900">{all.filter((c) => c.status === 'pending').length}</span>
          )}
        </div>
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-bold">
          {(['pending', 'all'] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-md px-2 py-1 ${filter === k ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>
              {k === 'pending' ? 'រង់ចាំ' : 'ទាំងអស់'}
            </button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">មិនមានសំណើ</div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-xs">
          {list.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900">
                  {!teacherId && <>{c.teacherName} · </>}
                  <span className="font-mono">{c.date.split('-').reverse().join('-')}</span>
                </div>
                <div className="text-slate-600">
                  {c.checkIn && <>ចូល <b className="font-mono">{c.checkIn}</b> </>}
                  {c.checkOut && <>ចេញ <b className="font-mono">{c.checkOut}</b> </>}— {c.reason}
                </div>
                {c.decisionNote && <div className="text-[11px] text-rose-600">{c.decisionNote}</div>}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_PILL[c.status]}`}>{STATUS_KH[c.status]}</span>
              {canDecide && c.status === 'pending' && (
                <div className="flex gap-1">
                  <button onClick={() => decide(c, true)} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"><Check className="h-3.5 w-3.5" /> អនុម័ត</button>
                  <button onClick={() => decide(c, false)} className="flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100"><X className="h-3.5 w-3.5" /> បដិសេធ</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
