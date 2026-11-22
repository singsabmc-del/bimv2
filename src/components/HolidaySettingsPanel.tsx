// System Settings → school holidays (one day or a range). Stored in the shared check-in config
// so every device sees them; used by the staff and student attendance reports.
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { HolidayDef } from '../types';
import { CalendarOff, Plus, Trash2 } from 'lucide-react';

/** Add / remove school holidays (shared with every device via the check-in config) */
export const HolidaySettingsPanel: React.FC = () => {
  const { teacherCheckIn, setTeacherCheckIn, permissions, showNotification } = useApp() as any;
  const holidays: HolidayDef[] = teacherCheckIn?.holidays || [];
  const canEdit = !!permissions?.canEdit;
  const now = new Date();
  const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const onChange = (next: HolidayDef[]) => {
    setTeacherCheckIn((prev: any) => ({ ...prev, holidays: next }));
    showNotification?.('បានរក្សាទុកថ្ងៃឈប់សម្រាក', 'success');
  };
  const [from, setFrom] = useState(defaultDate);
  const [to, setTo] = useState('');
  const [name, setName] = useState('');
  const [year, setYear] = useState(defaultDate.slice(0, 4));
  const list = holidays.filter((h) => h.from.startsWith(year) || (h.to || '').startsWith(year)).sort((a, b) => a.from.localeCompare(b.from));
  const years = Array.from(new Set([defaultDate.slice(0, 4), ...holidays.map((h) => h.from.slice(0, 4))])).sort();
  const countDays = (h: HolidayDef) => Math.round((new Date((h.to || h.from) + 'T00:00:00').getTime() - new Date(h.from + 'T00:00:00').getTime()) / 86400000) + 1;

  const add = () => {
    if (!from || !name.trim()) return;
    const end = to && to >= from ? to : from;
    onChange([...holidays, { id: `hol_${Date.now()}`, from, to: end, name: name.trim() }]);
    setName('');
    setTo('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs w-full font-khmer">
      <div className="max-w-2xl">
        <div className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
          <CalendarOff className="h-5 w-5 text-violet-600" /> ថ្ងៃបុណ្យ & ថ្ងៃឈប់សម្រាក (Holidays)
        </div>
        <p className="mb-4 text-xs text-slate-500">
          ថ្ងៃទាំងនេះមិនរាប់ជាថ្ងៃធ្វើការ ឬអវត្តមាន ក្នុងរបាយការណ៍វត្តមានបុគ្គលិក និងសិស្ស · ប្រើរួមគ្នាគ្រប់ឧបករណ៍
        </p>

        {canEdit && (
          <div className="mb-3 space-y-2 rounded-xl border border-violet-200 bg-violet-50/50 p-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ឈ្មោះថ្ងៃបុណ្យ ឧ. ចូលឆ្នាំខ្មែរ" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label>ពីថ្ងៃ<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-sm" /></label>
              <label>ដល់ថ្ងៃ (ទុកទទេ = ១ ថ្ងៃ)<input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-sm" /></label>
            </div>
            <button onClick={add} disabled={!from || !name.trim()} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-40">
              <Plus className="h-4 w-4" /> បន្ថែមថ្ងៃឈប់សម្រាក
            </button>
          </div>
        )}

        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-slate-500">បញ្ជីឆ្នាំ</span>
          <select value={year} onChange={(e) => setYear(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono">
            {years.map((yy) => <option key={yy} value={yy}>{yy}</option>)}
          </select>
        </div>
        <div className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
          {list.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">មិនទាន់មានថ្ងៃឈប់សម្រាកក្នុងឆ្នាំ {year}</div>
          ) : (
            list.map((h) => (
              <div key={h.id} className="flex items-center gap-3 px-3 py-2">
                <div className="w-28 shrink-0 font-mono text-xs text-violet-800">
                  {h.from}{h.to && h.to !== h.from ? <><br />→ {h.to}</> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-slate-900">{h.name}</div>
                  <div className="text-[11px] text-slate-500">{countDays(h)} ថ្ងៃ</div>
                </div>
                {canEdit && (
                  <button
                    onClick={() => confirm(`លុប «${h.name}»?`) && onChange(holidays.filter((x) => x.id !== h.id))}
                    className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                    title="លុប"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
