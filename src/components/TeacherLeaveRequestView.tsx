// Teacher Management → Leave Request (សំណើសុំច្បាប់)
// Teachers send a request; Admin / Accounting approve or reject. Approved days show as "leave" in Check In.
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { TeacherCheckInRecord, TeacherLeaveRequest, TeacherRecord } from '../types';
import { CalendarDays, Check, X, Send, Clock, Trash2 } from 'lucide-react';

const pad = (n: number) => String(n).padStart(2, '0');
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const dmy = (iso: string) => (iso || '').split('-').reverse().join('-');

/** School days (Mon–Fri) between two dates, inclusive */
const daysBetween = (from: string, to: string) => {
  const out: string[] = [];
  const d = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  while (d <= end && out.length < 200) {
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
};

const TYPES: Record<TeacherLeaveRequest['type'], string> = {
  sick: 'ឈឺ (Sick)',
  personal: 'កិច្ចការផ្ទាល់ខ្លួន (Personal)',
  family: 'កិច្ចការគ្រួសារ (Family)',
  other: 'ផ្សេងៗ (Other)',
};
const STATUS: Record<TeacherLeaveRequest['status'], { label: string; cls: string }> = {
  pending: { label: 'កំពុងរង់ចាំ', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'បានអនុម័ត', cls: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'បដិសេធ', cls: 'bg-rose-100 text-rose-800' },
};

export const TeacherLeaveRequestView: React.FC = () => {
  const { teachers, teacherCheckIn, setTeacherCheckIn, currentUser, linkedTeacher, sendTelegramAlert, showNotification } = useApp() as any;
  const canApprove = currentUser.role === 'admin' || currentUser.role === 'accountant';
  const selfOnly = currentUser.role === 'teacher';

  const [teacherId, setTeacherId] = useState<string>('');
  const [fromDate, setFromDate] = useState(todayISO());
  const [toDate, setToDate] = useState(todayISO());
  const [type, setType] = useState<TeacherLeaveRequest['type']>('sick');
  const [reason, setReason] = useState('');
  const [filter, setFilter] = useState<'all' | TeacherLeaveRequest['status']>('all');

  const requests: TeacherLeaveRequest[] = teacherCheckIn.leaveRequests || [];
  const who: TeacherRecord | undefined = selfOnly ? linkedTeacher : (teachers as TeacherRecord[]).find((t) => t.id === teacherId);

  const visible = useMemo(
    () =>
      requests
        .filter((r) => (!selfOnly || r.teacherId === linkedTeacher?.id) && (filter === 'all' || r.status === filter))
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    [requests, selfOnly, linkedTeacher, filter]
  );
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const tg = (title: string, lines: string[]) => {
    try {
      sendTelegramAlert?.(title, lines.join('\n'), 'system');
    } catch {}
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!who) return;
    if (toDate < fromDate) {
      alert('ថ្ងៃបញ្ចប់ត្រូវនៅក្រោយថ្ងៃចាប់ផ្តើម');
      return;
    }
    if (!reason.trim()) {
      alert('សូមសរសេរមូលហេតុ');
      return;
    }
    const req: TeacherLeaveRequest = {
      id: `leave-${Date.now()}`,
      teacherId: who.id,
      teacherName: who.nameKhmer,
      fromDate,
      toDate,
      type,
      reason: reason.trim(),
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    setTeacherCheckIn((p: any) => ({ ...p, leaveRequests: [...(p.leaveRequests || []), req] }));
    const n = daysBetween(fromDate, toDate).length;
    tg('📝 សំណើសុំច្បាប់ថ្មី (Leave Request)', [
      `👩‍🏫 ${who.nameKhmer} (${who.position || who.homeroomClassName || who.teacherCode})`,
      `📅 ${dmy(fromDate)} → ${dmy(toDate)} (${n} ថ្ងៃ)`,
      `🏷️ ${TYPES[type]}`,
      `💬 ${reason.trim()}`,
      'សូម Admin / គណនេយ្យ ពិនិត្យ និងអនុម័ត។',
    ]);
    showNotification?.('បានផ្ញើសំណើសុំច្បាប់', 'success');
    setReason('');
  };

  const decide = (req: TeacherLeaveRequest, status: 'approved' | 'rejected') => {
    const note = status === 'rejected' ? prompt('មូលហេតុបដិសេធ (ជម្រើស)') || '' : '';
    setTeacherCheckIn((p: any) => {
      const decided = {
        ...req, status, decisionNote: note, decidedAt: new Date().toISOString(), decidedBy: currentUser.khmerName || currentUser.name,
      };
      let records: TeacherCheckInRecord[] = p.records;
      if (status === 'approved') {
        // Mark each school day as leave (keeps a real check-in if the teacher already came that day)
        daysBetween(req.fromDate, req.toDate).forEach((d) => {
          const id = `${d}_${req.teacherId}`;
          const cur = records.find((r) => r.id === id);
          if (cur?.checkIn) return;
          records = [
            ...records.filter((r) => r.id !== id),
            { id, teacherId: req.teacherId, date: d, status: 'leave', note: `សុំច្បាប់៖ ${req.reason}`, recordedBy: decided.decidedBy },
          ];
        });
      }
      return { ...p, records, leaveRequests: (p.leaveRequests || []).map((r: TeacherLeaveRequest) => (r.id === req.id ? decided : r)) };
    });
    tg(status === 'approved' ? '✅ សំណើសុំច្បាប់ត្រូវបានអនុម័ត' : '❌ សំណើសុំច្បាប់ត្រូវបានបដិសេធ', [
      `👩‍🏫 ${req.teacherName}`,
      `📅 ${dmy(req.fromDate)} → ${dmy(req.toDate)}`,
      `ដោយ៖ ${currentUser.khmerName || currentUser.name}${note ? ` — ${note}` : ''}`,
    ]);
  };

  const cancel = (req: TeacherLeaveRequest) => {
    if (!confirm('លុបសំណើនេះ?')) return;
    setTeacherCheckIn((p: any) => ({ ...p, leaveRequests: (p.leaveRequests || []).filter((r: TeacherLeaveRequest) => r.id !== req.id) }));
  };

  return (
    <div className="space-y-4 font-khmer">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">សំណើសុំច្បាប់ (Leave Request)</h2>
          <p className="text-xs text-slate-500">
            {canApprove ? 'ពិនិត្យ និងអនុម័តសំណើរបស់គ្រូ' : 'ផ្ញើសំណើសុំច្បាប់ ទៅ Admin / គណនេយ្យ'}
          </p>
        </div>
        {canApprove && pendingCount > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            <Clock className="mr-1 inline h-3.5 w-3.5" /> រង់ចាំអនុម័ត {pendingCount}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Request form */}
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs lg:col-span-1">
          <div className="text-sm font-bold text-slate-900">ស្នើសុំច្បាប់ថ្មី</div>
          {selfOnly ? (
            <div className="rounded-xl bg-teal-50 p-3">
              <div className="text-[11px] text-teal-700">ឈ្មោះគ្រូ</div>
              <div className="font-bold text-teal-900">{linkedTeacher ? linkedTeacher.nameKhmer : '—'}</div>
              {!linkedTeacher && (
                <div className="mt-1 text-[11px] text-amber-700">គណនីមិនទាន់ភ្ជាប់ជាមួយបញ្ជីគ្រូ។ សូមឱ្យ Admin ភ្ជាប់នៅ ការកំណត់ → អ្នកប្រើប្រាស់។</div>
              )}
            </div>
          ) : (
            <label className="flex flex-col gap-1 font-bold text-slate-600">
              ឈ្មោះគ្រូ
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <option value="">-- ជ្រើសរើសគ្រូ --</option>
                {(teachers as TeacherRecord[]).map((t) => (
                  <option key={t.id} value={t.id}>{t.nameKhmer} · {t.position || t.teacherCode}</option>
                ))}
              </select>
            </label>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 font-bold text-slate-600">
              ពីថ្ងៃ
              <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); if (toDate < e.target.value) setToDate(e.target.value); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1 font-bold text-slate-600">
              ដល់ថ្ងៃ
              <input type="date" value={toDate} min={fromDate} onChange={(e) => setToDate(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
            </label>
          </div>
          <div className="text-[11px] text-slate-500">
            <CalendarDays className="mr-1 inline h-3.5 w-3.5" /> ថ្ងៃសិក្សា (ចន្ទ–សុក្រ)៖ {daysBetween(fromDate, toDate).length} ថ្ងៃ
          </div>
          <label className="flex flex-col gap-1 font-bold text-slate-600">
            ប្រភេទ
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-bold text-slate-600">
            មូលហេតុ
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" placeholder="សូមសរសេរមូលហេតុ…" />
          </label>
          <button disabled={!who} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-40">
            <Send className="h-4 w-4" /> ផ្ញើសំណើ
          </button>
        </form>

        {/* Requests list */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-bold text-slate-900">{selfOnly ? 'សំណើរបស់ខ្ញុំ' : 'សំណើទាំងអស់'}</div>
            <div className="flex rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((k) => (
                <button key={k} type="button" onClick={() => setFilter(k)} className={`rounded-lg px-2.5 py-1 ${filter === k ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500'}`}>
                  {k === 'all' ? 'ទាំងអស់' : STATUS[k].label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {visible.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">មិនមានសំណើ</div>}
            {visible.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 p-3 text-xs">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900">{r.teacherName}</div>
                    <div className="text-slate-600">
                      📅 {dmy(r.fromDate)} → {dmy(r.toDate)} · {daysBetween(r.fromDate, r.toDate).length} ថ្ងៃ · {TYPES[r.type]}
                    </div>
                    <div className="mt-1 text-slate-700">💬 {r.reason}</div>
                    <div className="mt-1 text-[10px] text-slate-400">
                      ស្នើនៅ {new Date(r.requestedAt).toLocaleString('en-GB')}
                      {r.decidedBy && ` · ${STATUS[r.status].label}ដោយ ${r.decidedBy}`}
                      {r.decisionNote && ` — ${r.decisionNote}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                    {canApprove && r.status === 'pending' && (
                      <>
                        <button type="button" onClick={() => decide(r, 'approved')} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 font-bold text-white hover:bg-emerald-700">
                          <Check className="h-3.5 w-3.5" /> អនុម័ត
                        </button>
                        <button type="button" onClick={() => decide(r, 'rejected')} className="flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-1 font-bold text-white hover:bg-rose-700">
                          <X className="h-3.5 w-3.5" /> បដិសេធ
                        </button>
                      </>
                    )}
                    {(r.status === 'pending' && (selfOnly || canApprove)) && (
                      <button type="button" onClick={() => cancel(r)} className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="លុប">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
