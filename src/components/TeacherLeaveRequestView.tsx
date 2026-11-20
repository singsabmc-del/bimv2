// Staff Leave Request (សំណើសុំច្បាប់) — whole days or by the hour, with a yearly allowance per leave type.
// Staff send requests for themselves; Admin / Accounting approve or reject and set the allowances.
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { TeacherCheckInRecord, TeacherLeaveRequest, TeacherRecord } from '../types';
import { CalendarDays, Check, X, Send, Clock, Trash2, Settings2, Plus, FilePlus2, ListChecks } from 'lucide-react';

const pad = (n: number) => String(n).padStart(2, '0');
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const dmy = (iso: string) => (iso || '').split('-').reverse().join('-');
const toMin = (t?: string) => {
  if (!t) return NaN;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** School days (Mon–Fri) between two dates, inclusive */
const daysBetween = (from: string, to: string) => {
  const out: string[] = [];
  const d = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  while (d <= end && out.length < 400) {
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
};

export const LEAVE_TYPES: { key: string; kh: string; en: string; defaultDays: number }[] = [
  { key: 'annual', kh: 'ច្បាប់ប្រចាំឆ្នាំ', en: 'Annual leave', defaultDays: 18 },
  { key: 'sick', kh: 'ច្បាប់ឈឺ', en: 'Sick leave', defaultDays: 7 },
  { key: 'personal', kh: 'កិច្ចការផ្ទាល់ខ្លួន', en: 'Personal', defaultDays: 5 },
  { key: 'family', kh: 'កិច្ចការគ្រួសារ', en: 'Family', defaultDays: 5 },
  { key: 'maternity', kh: 'ច្បាប់សម្រាលកូន', en: 'Maternity', defaultDays: 90 },
  { key: 'other', kh: 'ផ្សេងៗ (គ្មានកំណត់)', en: 'Other', defaultDays: 0 },
];
/** A leave type as managed by Admin / Accounting */
export interface LeaveTypeDef {
  key: string;
  kh: string;
  en?: string;
  days: number; // allowance per year (0 = no limit)
  active?: boolean; // hidden types stay for old requests but cannot be chosen
}

const STATUS: Record<TeacherLeaveRequest['status'], { label: string; cls: string }> = {
  pending: { label: 'កំពុងរង់ចាំ', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'បានអនុម័ត', cls: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'បដិសេធ', cls: 'bg-rose-100 text-rose-800' },
};

/** "1 ថ្ងៃ 3 ម៉ោង" from hours */
const fmtDH = (hours: number, perDay: number) => {
  const h = Math.round(hours * 10) / 10;
  if (h <= 0) return '0';
  const d = Math.floor(h / perDay);
  const r = Math.round((h - d * perDay) * 10) / 10;
  return [d ? `${d} ថ្ងៃ` : '', r ? `${r} ម៉ោង` : ''].filter(Boolean).join(' ');
};

export const TeacherLeaveRequestView: React.FC = () => {
  const { teachers, teacherCheckIn, setTeacherCheckIn, currentUser, linkedTeacher, sendTelegramAlert, showNotification } = useApp() as any;
  const canApprove = currentUser.role === 'admin' || currentUser.role === 'accountant';
  const [mode, setMode] = useState<'me' | 'manage'>(canApprove ? 'manage' : 'me');
  const selfOnly = !canApprove || mode === 'me';

  const perDay: number = teacherCheckIn.hoursPerDay || 8;
  // Leave types: managed list, or the built-in defaults until someone edits them
  const allTypes: LeaveTypeDef[] = useMemo(
    () =>
      teacherCheckIn.leaveTypes && teacherCheckIn.leaveTypes.length
        ? teacherCheckIn.leaveTypes
        : LEAVE_TYPES.map((t) => ({ key: t.key, kh: t.kh, en: t.en, days: teacherCheckIn.leaveQuotas?.[t.key] ?? t.defaultDays, active: true })),
    [teacherCheckIn.leaveTypes, teacherCheckIn.leaveQuotas]
  );
  const activeTypes = allTypes.filter((t) => t.active !== false);
  const typeLabel = (k: string) => allTypes.find((x) => x.key === k)?.kh || k;
  const quotas: Record<string, number> = useMemo(() => {
    const q: Record<string, number> = {};
    allTypes.forEach((t) => (q[t.key] = Number(t.days) || 0));
    return q;
  }, [allTypes]);
  const saveTypes = (next: LeaveTypeDef[]) => setTeacherCheckIn((p: any) => ({ ...p, leaveTypes: next }));
  const usedCount = (key: string) => (teacherCheckIn.leaveRequests || []).filter((r: TeacherLeaveRequest) => r.type === key).length;

  const [teacherId, setTeacherId] = useState<string>('');
  const [unit, setUnit] = useState<'day' | 'hour'>('day');
  const [fromDate, setFromDate] = useState(todayISO());
  const [toDate, setToDate] = useState(todayISO());
  const [fromTime, setFromTime] = useState(teacherCheckIn.startTime || '07:00');
  const [toTime, setToTime] = useState('09:00');
  const [typeState, setType] = useState<string>('');
  const type = typeState;
  const [reason, setReason] = useState('');
  const [filter, setFilter] = useState<'all' | TeacherLeaveRequest['status']>('all');
  const [showQuota, setShowQuota] = useState(false);
  // Split the page into two tabs: request form / request list
  const [tab, setTab] = useState<'form' | 'list'>(canApprove ? 'list' : 'form');
  const year = new Date().getFullYear();

  const requests: TeacherLeaveRequest[] = teacherCheckIn.leaveRequests || [];
  const who: TeacherRecord | undefined = selfOnly ? linkedTeacher : (teachers as TeacherRecord[]).find((t) => t.id === teacherId);

  const hoursOf = (r: TeacherLeaveRequest) =>
    r.hours ?? (r.unit === 'hour' ? Math.max(0, (toMin(r.toTime) - toMin(r.fromTime)) / 60) : daysBetween(r.fromDate, r.toDate).length * perDay);

  /** Used / pending hours per type this year for one staff member */
  const balanceOf = (staffId?: string) => {
    const out: Record<string, { used: number; pending: number }> = {};
    allTypes.forEach((t) => (out[t.key] = { used: 0, pending: 0 }));
    requests
      .filter((r) => r.teacherId === staffId && r.fromDate.startsWith(String(year)))
      .forEach((r) => {
        const b = (out[r.type] ??= { used: 0, pending: 0 });
        if (r.status === 'approved') b.used += hoursOf(r);
        else if (r.status === 'pending') b.pending += hoursOf(r);
      });
    return out;
  };
  const balance = balanceOf(who?.id);

  const requestedHours =
    unit === 'hour'
      ? Math.max(0, (toMin(toTime) - toMin(fromTime)) / 60)
      : daysBetween(fromDate, toDate).length * perDay;

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

  const whenText = (r: { unit?: string; fromDate: string; toDate: string; fromTime?: string; toTime?: string }) =>
    r.unit === 'hour' ? `${dmy(r.fromDate)} ម៉ោង ${r.fromTime}–${r.toTime}` : `${dmy(r.fromDate)} → ${dmy(r.toDate)}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!who) return;
    const effTo = unit === 'hour' ? fromDate : toDate;
    if (unit === 'day' && toDate < fromDate) return alert('ថ្ងៃបញ្ចប់ត្រូវនៅក្រោយថ្ងៃចាប់ផ្តើម');
    if (unit === 'hour' && !(requestedHours > 0)) return alert('ម៉ោងបញ្ចប់ត្រូវនៅក្រោយម៉ោងចាប់ផ្តើម');
    if (requestedHours <= 0) return alert('មិនមានថ្ងៃធ្វើការក្នុងចន្លោះនេះទេ');
    if (!reason.trim()) return alert('សូមសរសេរមូលហេតុ');
    const type = (activeTypes.find((t) => t.key === typeState) ? typeState : activeTypes[0]?.key) || 'other';
    const q = quotas[type] || 0;
    if (q > 0) {
      const left = q * perDay - balance[type].used - balance[type].pending;
      if (requestedHours > left) {
        return alert(`${typeLabel(type)} នៅសល់តែ ${fmtDH(Math.max(0, left), perDay)} ប៉ុណ្ណោះ (រួមទាំងសំណើកំពុងរង់ចាំ)។`);
      }
    }
    const req: TeacherLeaveRequest = {
      id: `leave-${Date.now()}`,
      teacherId: who.id,
      teacherName: who.nameKhmer,
      fromDate,
      toDate: effTo,
      unit,
      ...(unit === 'hour' ? { fromTime, toTime } : {}),
      hours: Math.round(requestedHours * 100) / 100,
      type,
      reason: reason.trim(),
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    setTeacherCheckIn((p: any) => ({ ...p, leaveRequests: [...(p.leaveRequests || []), req] }));
    tg('📝 សំណើសុំច្បាប់ថ្មី (Leave Request)', [
      `👤 ${who.nameKhmer} (${who.position || who.homeroomClassName || who.teacherCode})`,
      `📅 ${whenText(req)} — ${fmtDH(requestedHours, perDay)}`,
      `🏷️ ${typeLabel(type)}`,
      `💬 ${reason.trim()}`,
      'សូម Admin / គណនេយ្យ ពិនិត្យ និងអនុម័ត។',
    ]);
    showNotification?.('បានផ្ញើសំណើសុំច្បាប់', 'success');
    setReason('');
    setFilter('all');
    setTab('list');
  };

  const decide = (req: TeacherLeaveRequest, status: 'approved' | 'rejected') => {
    const note = status === 'rejected' ? prompt('មូលហេតុបដិសេធ (ជម្រើស)') || '' : '';
    setTeacherCheckIn((p: any) => {
      const decided = {
        ...req, status, decisionNote: note, decidedAt: new Date().toISOString(), decidedBy: currentUser.khmerName || currentUser.name,
      };
      let records: TeacherCheckInRecord[] = p.records;
      if (status === 'approved') {
        if (req.unit === 'hour') {
          // Part of a day: note it on that day's attendance (status unchanged)
          const id = `${req.fromDate}_${req.teacherId}`;
          const cur = records.find((r) => r.id === id);
          const n = `សុំច្បាប់ ${req.fromTime}–${req.toTime}`;
          if (cur) records = records.map((r) => (r.id === id ? { ...r, note: [r.note, n].filter(Boolean).join(' · ') } : r));
        } else {
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
      }
      return { ...p, records, leaveRequests: (p.leaveRequests || []).map((r: TeacherLeaveRequest) => (r.id === req.id ? decided : r)) };
    });
    tg(status === 'approved' ? '✅ សំណើសុំច្បាប់ត្រូវបានអនុម័ត' : '❌ សំណើសុំច្បាប់ត្រូវបានបដិសេធ', [
      `👤 ${req.teacherName} · ${typeLabel(req.type)}`,
      `📅 ${whenText(req)} — ${fmtDH(hoursOf(req), perDay)}`,
      `ដោយ៖ ${currentUser.khmerName || currentUser.name}${note ? ` — ${note}` : ''}`,
    ]);
  };

  const cancel = (req: TeacherLeaveRequest) => {
    if (!confirm('លុបសំណើនេះ?')) return;
    setTeacherCheckIn((p: any) => ({ ...p, leaveRequests: (p.leaveRequests || []).filter((r: TeacherLeaveRequest) => r.id !== req.id) }));
  };

  const BalanceTable = ({ staffId }: { staffId?: string }) => {
    const b = balanceOf(staffId);
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-[11px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-2 py-1.5 text-left">ប្រភេទច្បាប់ ({year})</th>
              <th className="px-2 py-1.5 text-center">សិទ្ធិ</th>
              <th className="px-2 py-1.5 text-center">ប្រើអស់</th>
              <th className="px-2 py-1.5 text-center">រង់ចាំ</th>
              <th className="px-2 py-1.5 text-center">នៅសល់</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeTypes.map((t) => {
              const q = quotas[t.key] || 0;
              const left = q * perDay - (b[t.key]?.used || 0);
              const pct = q ? Math.min(100, ((b[t.key]?.used || 0) / (q * perDay)) * 100) : 0;
              return (
                <tr key={t.key}>
                  <td className="px-2 py-1.5 font-bold text-slate-800">
                    {t.kh}
                    {q > 0 && (
                      <div className="mt-0.5 h-1 w-full rounded bg-slate-100">
                        <div className={`h-1 rounded ${pct > 85 ? 'bg-rose-500' : 'bg-teal-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center font-mono">{q ? `${q} ថ្ងៃ` : '∞'}</td>
                  <td className="px-2 py-1.5 text-center font-mono text-amber-700">{fmtDH(b[t.key]?.used || 0, perDay)}</td>
                  <td className="px-2 py-1.5 text-center font-mono text-slate-500">{fmtDH(b[t.key]?.pending || 0, perDay)}</td>
                  <td className={`px-2 py-1.5 text-center font-mono font-bold ${q && left <= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {q ? fmtDH(Math.max(0, left), perDay) : '∞'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-4 font-khmer">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">សំណើសុំច្បាប់</h2>
          <p className="hidden sm:block text-xs text-slate-500">សុំច្បាប់ជាថ្ងៃ ឬជាម៉ោង · ១ ថ្ងៃ = {perDay} ម៉ោង</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canApprove && pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              <Clock className="mr-1 inline h-3.5 w-3.5" /> រង់ចាំអនុម័ត {pendingCount}
            </span>
          )}
          {canApprove && (
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              {(['manage', 'me'] as const).map((k) => (
                <button key={k} onClick={() => setMode(k)} className={`rounded-lg px-3 py-1.5 ${mode === k ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500'}`}>
                  {k === 'manage' ? 'គ្រប់គ្រងទាំងអស់' : 'សំណើរបស់ខ្ញុំ'}
                </button>
              ))}
            </div>
          )}
          {canApprove && (
            <button onClick={() => setShowQuota((v) => !v)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" title="គ្រប់គ្រងប្រភេទច្បាប់ និងចំនួនថ្ងៃ">
              <Settings2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {showQuota && canApprove && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-bold text-slate-800">គ្រប់គ្រងប្រភេទច្បាប់ និងចំនួនថ្ងៃ</div>
            <button
              type="button"
              onClick={() => saveTypes([...allTypes, { key: `type-${Date.now()}`, kh: 'ប្រភេទច្បាប់ថ្មី', en: '', days: 0, active: true }])}
              className="flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
            >
              <Plus className="h-3.5 w-3.5" /> បន្ថែមប្រភេទ
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left">ឈ្មោះ (ខ្មែរ)</th>
                  <th className="px-2 py-2 text-left">English</th>
                  <th className="w-28 px-2 py-2 text-center">ថ្ងៃ / ឆ្នាំ</th>
                  <th className="w-20 px-2 py-2 text-center">ប្រើប្រាស់</th>
                  <th className="w-20 px-2 py-2 text-center">សំណើ</th>
                  <th className="w-10 px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allTypes.map((t, i) => {
                  const n = usedCount(t.key);
                  const set = (patch: Partial<LeaveTypeDef>) => saveTypes(allTypes.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                  return (
                    <tr key={t.key} className={t.active === false ? 'opacity-50' : ''}>
                      <td className="px-2 py-1.5"><input value={t.kh} onChange={(e) => set({ kh: e.target.value })} className="w-full rounded-lg border border-slate-200 px-2 py-1" /></td>
                      <td className="px-2 py-1.5"><input value={t.en || ''} onChange={(e) => set({ en: e.target.value })} className="w-full rounded-lg border border-slate-200 px-2 py-1" /></td>
                      <td className="px-2 py-1.5 text-center">
                        <input type="number" min={0} value={t.days} onChange={(e) => set({ days: Math.max(0, Number(e.target.value) || 0) })} className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-center" />
                        <div className="text-[10px] text-slate-400">{t.days ? `${t.days} ថ្ងៃ` : 'គ្មានកំណត់'}</div>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <input type="checkbox" checked={t.active !== false} onChange={(e) => set({ active: e.target.checked })} className="h-4 w-4 accent-teal-600" title="បង្ហាញក្នុងទម្រង់សុំច្បាប់" />
                      </td>
                      <td className="px-2 py-1.5 text-center font-mono">{n}</td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (n > 0) return alert(`ប្រភេទនេះមានសំណើ ${n} រួចហើយ។ សូមដកធីក «ប្រើប្រាស់» ដើម្បីលាក់វា ជំនួសការលុប។`);
                            if (allTypes.filter((x) => x.active !== false).length <= 1 && t.active !== false) return alert('ត្រូវមានប្រភេទច្បាប់យ៉ាងតិចមួយ');
                            if (confirm(`លុបប្រភេទ «${t.kh}»?`)) saveTypes(allTypes.filter((_, j) => j !== i));
                          }}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="លុប"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-600">
            ម៉ោងធ្វើការក្នុង ១ ថ្ងៃ (សម្រាប់គិតច្បាប់ជាម៉ោង)
            <input
              type="number"
              min={1}
              max={24}
              value={perDay}
              onChange={(e) => setTeacherCheckIn((p: any) => ({ ...p, hoursPerDay: Math.min(24, Math.max(1, Number(e.target.value) || 8)) }))}
              className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs"
            />
            <span className="font-normal text-slate-400">ថ្ងៃ = 0 មានន័យថាគ្មានកំណត់ · ដកធីក «ប្រើប្រាស់» ដើម្បីលាក់ប្រភេទ ដោយមិនបាត់ប្រវត្តិ</span>
          </div>
        </div>
      )}

      {/* Tabs: Form / List */}
      <div className="flex rounded-2xl border border-slate-200 bg-white p-1 text-sm font-bold">
        <button type="button" onClick={() => setTab('form')} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 ${tab === 'form' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
          <FilePlus2 className="h-4 w-4" /> ស្នើសុំច្បាប់
        </button>
        <button type="button" onClick={() => setTab('list')} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 ${tab === 'list' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
          <ListChecks className="h-4 w-4" /> {selfOnly ? 'សំណើរបស់ខ្ញុំ' : 'បញ្ជីសំណើ'}
          {(requests.filter((r) => r.status === 'pending' && (!selfOnly || r.teacherId === linkedTeacher?.id)).length) > 0 && (
            <span className={`rounded-full px-1.5 text-[11px] ${tab === 'list' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'}`}>{requests.filter((r) => r.status === 'pending' && (!selfOnly || r.teacherId === linkedTeacher?.id)).length}</span>
          )}
        </button>
      </div>

      {tab === 'form' && (
        <div className="mx-auto w-full max-w-xl space-y-4">
          <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs">
            <div className="text-sm font-bold text-slate-900">ស្នើសុំច្បាប់ថ្មី</div>
            {selfOnly ? (
              <div className="rounded-xl bg-teal-50 p-3">
                <div className="text-[11px] text-teal-700">ឈ្មោះបុគ្គលិក</div>
                <div className="font-bold text-teal-900">{linkedTeacher ? linkedTeacher.nameKhmer : '—'}</div>
                {!linkedTeacher && (
                  <div className="mt-1 text-[11px] text-amber-700">គណនីមិនទាន់ភ្ជាប់ជាមួយបញ្ជីបុគ្គលិក។ សូមឱ្យ Admin ភ្ជាប់នៅ ការកំណត់ → អ្នកប្រើប្រាស់។</div>
                )}
              </div>
            ) : (
              <label className="flex flex-col gap-1 font-bold text-slate-600">
                ឈ្មោះបុគ្គលិក
                <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <option value="">-- ជ្រើសរើស --</option>
                  {(teachers as TeacherRecord[]).map((t) => (
                    <option key={t.id} value={t.id}>{t.nameKhmer} · {t.position || t.teacherCode}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex flex-col gap-1 font-bold text-slate-600">
              ប្រភេទច្បាប់
              <select value={type || activeTypes[0]?.key || ''} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                {activeTypes.map((t) => {
                  const q = quotas[t.key] || 0;
                  const left = q * perDay - (balance[t.key]?.used || 0) - (balance[t.key]?.pending || 0);
                  return (
                    <option key={t.key} value={t.key}>
                      {t.kh}{who ? ` — នៅសល់ ${q ? fmtDH(Math.max(0, left), perDay) : '∞'}` : ''}
                    </option>
                  );
                })}
              </select>
            </label>

            <div className="flex rounded-xl bg-slate-100 p-1 font-bold">
              {(['day', 'hour'] as const).map((u) => (
                <button key={u} type="button" onClick={() => setUnit(u)} className={`flex-1 rounded-lg py-1.5 ${unit === u ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500'}`}>
                  {u === 'day' ? 'ពេញថ្ងៃ' : 'ជាម៉ោង'}
                </button>
              ))}
            </div>

            {unit === 'day' ? (
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
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <label className="col-span-3 flex flex-col gap-1 font-bold text-slate-600">
                  ថ្ងៃ
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
                </label>
                <label className="col-span-3 grid grid-cols-2 gap-2 font-bold text-slate-600">
                  <span className="flex flex-col gap-1">ពីម៉ោង<input type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" /></span>
                  <span className="flex flex-col gap-1">ដល់ម៉ោង<input type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" /></span>
                </label>
              </div>
            )}
            <div className="flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600">
              <CalendarDays className="h-3.5 w-3.5" /> សរុប៖ <b className="text-slate-900">{fmtDH(requestedHours, perDay) || '0'}</b>
              {unit === 'day' && <span className="text-slate-400">(ចន្ទ–សុក្រ)</span>}
            </div>

            <label className="flex flex-col gap-1 font-bold text-slate-600">
              មូលហេតុ
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" placeholder="សូមសរសេរមូលហេតុ…" />
            </label>
            <button disabled={!who} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-40">
              <Send className="h-4 w-4" /> ផ្ញើសំណើ
            </button>
          </form>

          {who && (
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-bold text-slate-900">ច្បាប់ប្រើអស់ / នៅសល់ · {who.nameKhmer}</div>
              <BalanceTable staffId={who.id} />
            </div>
          )}
        </div>
      )}

      {tab === 'list' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-bold text-slate-900">{selfOnly ? 'សំណើរបស់ខ្ញុំ' : 'សំណើទាំងអស់'}</div>
            <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((k) => (
                <button key={k} type="button" onClick={() => setFilter(k)} className={`flex-1 shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 ${filter === k ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500'}`}>
                  {k === 'all' ? 'ទាំងអស់' : STATUS[k].label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {visible.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">មិនមានសំណើ</div>}
            {visible.map((r) => {
              const q = quotas[r.type] || 0;
              const left = q * perDay - balanceOf(r.teacherId)[r.type]?.used;
              return (
                <div key={r.id} className="rounded-xl border border-slate-200 p-3 text-xs">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">
                        {r.teacherName} · <span className="text-teal-700">{typeLabel(r.type)}</span>
                        {r.unit === 'hour' && <span className="ml-1 rounded bg-indigo-50 px-1.5 text-[10px] text-indigo-700">ជាម៉ោង</span>}
                      </div>
                      <div className="text-slate-600">📅 {whenText(r)} · <b>{fmtDH(hoursOf(r), perDay)}</b></div>
                      <div className="mt-1 text-slate-700">💬 {r.reason}</div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        ស្នើនៅ {new Date(r.requestedAt).toLocaleString('en-GB')}
                        {r.decidedBy && ` · ${STATUS[r.status].label}ដោយ ${r.decidedBy}`}
                        {r.decisionNote && ` — ${r.decisionNote}`}
                        {q > 0 && ` · ប្រភេទនេះនៅសល់ ${fmtDH(Math.max(0, left), perDay)}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                      {canApprove && !selfOnly && r.status === 'pending' && (
                        <>
                          <button type="button" onClick={() => decide(r, 'approved')} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 font-bold text-white hover:bg-emerald-700">
                            <Check className="h-3.5 w-3.5" /> អនុម័ត
                          </button>
                          <button type="button" onClick={() => decide(r, 'rejected')} className="flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-1 font-bold text-white hover:bg-rose-700">
                            <X className="h-3.5 w-3.5" /> បដិសេធ
                          </button>
                        </>
                      )}
                      {r.status === 'pending' && (selfOnly || canApprove) && (
                        <button type="button" onClick={() => cancel(r)} className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="លុប">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
