// Teacher Information → Employee Profile Form (ទម្រង់បែបបទប្រវត្តិរូបបុគ្គលិក), following the school's paper form
import React, { useState } from 'react';
import { X, Printer, Save, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { TeacherRecord } from '../types';

export interface TeacherProfile {
  surname?: string;
  firstName?: string;
  nationality?: string;
  birthPlace?: Address;
  citizenId?: string;
  passportId?: string;
  familyBookNo?: string;
  residenceBookNo?: string;
  permanentAddress?: Address;
  presentAddress?: Address;
  education?: {
    higher?: { degree?: string; institute?: string; year?: string };
    undergraduate?: { degree?: string; institute?: string; year?: string };
    highSchool?: { school?: string; year?: string };
    lowerSecondary?: { school?: string; year?: string };
    primary?: { school?: string; year?: string };
  };
  englishTests?: { date?: string; type?: string; year?: string; other?: string }[];
  teachingSkills?: { skill?: string; confidence?: string; time?: string; other?: string }[];
  otherSkills?: string;
  photo?: string;
}
interface Address {
  houseNo?: string;
  street?: string;
  village?: string;
  commune?: string;
  district?: string;
  province?: string;
}

const ageOf = (dob?: string) => {
  if (!dob) return '';
  const d = new Date(dob + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--;
  return String(a);
};

// Defined outside the form so inputs keep focus while typing
const L: React.FC<{ kh: string; en: string; children: React.ReactNode; className?: string }> = ({ kh, en, children, className = '' }) => (
  <label className={`flex items-end gap-1.5 text-[11px] text-slate-700 ${className}`}>
    <span className="shrink-0 whitespace-nowrap">{kh}<span className="text-slate-400"> ({en})</span>:</span>
    {children}
  </label>
);

const Bar: React.FC<{ n: string; kh: string; en: string }> = ({ n, kh, en }) => (
  <div className="mt-3 mb-1.5 rounded bg-amber-400 px-3 py-1 text-[12px] font-bold text-red-900">
    {n}. {kh} <span className="font-sans">({en})</span>
  </div>
);

export const TeacherProfileForm: React.FC<{ teacher: TeacherRecord; onClose: () => void }> = ({ teacher, onClose }) => {
  const { teachers, setTeachers, permissions, settings, showNotification } = useApp() as any;
  const canEdit = !!permissions?.canEdit;
  const [p, setP] = useState<TeacherProfile>(() => {
    const base: TeacherProfile = (teacher as any).profile || {};
    const [sur, ...rest] = (teacher.nameKhmer || '').split(' ');
    return {
      surname: sur, firstName: rest.join(' '), nationality: 'ខ្មែរ',
      englishTests: [{}, {}, {}], teachingSkills: [{}, {}, {}],
      ...base,
    };
  });
  const [core, setCore] = useState({ phone: teacher.phone || '', email: teacher.email || '', dob: teacher.dob || '', gender: teacher.gender });

  const set = (path: string, value: any) =>
    setP((prev) => {
      const next: any = structuredClone(prev);
      const keys = path.split('.');
      let o = next;
      keys.slice(0, -1).forEach((k) => (o = o[k] ??= {}));
      o[keys[keys.length - 1]] = value;
      return next;
    });

  const inp = (path: string, placeholder = '', cls = '') => {
    const val = path.split('.').reduce((o: any, k) => (o ? o[k] : undefined), p) || '';
    return (
      <input
        value={val}
        disabled={!canEdit}
        placeholder={placeholder}
        onChange={(e) => set(path, e.target.value)}
        className={`min-w-0 flex-1 border-0 border-b border-dotted border-slate-400 bg-transparent px-1 py-0.5 text-[12px] text-blue-900 focus:border-teal-500 focus:outline-none disabled:text-slate-800 ${cls}`}
      />
    );
  };
  const addr = (key: 'birthPlace' | 'permanentAddress' | 'presentAddress') => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-4 sm:grid-cols-3">
      <L kh="ផ្ទះលេខ" en="House No">{inp(`${key}.houseNo`)}</L>
      <L kh="ផ្លូវ" en="St. No">{inp(`${key}.street`)}</L>
      <L kh="ភូមិ" en="Village">{inp(`${key}.village`)}</L>
      <L kh="ឃុំ/សង្កាត់" en="Commune">{inp(`${key}.commune`)}</L>
      <L kh="ស្រុក/ខណ្ឌ" en="District">{inp(`${key}.district`)}</L>
      <L kh="ខេត្ត/ក្រុង" en="Province">{inp(`${key}.province`)}</L>
    </div>
  );

  const save = () => {
    setTeachers(
      (teachers as TeacherRecord[]).map((t) =>
        t.id === teacher.id ? ({ ...t, ...core, profile: p } as any) : t
      )
    );
    showNotification?.('បានរក្សាទុកប្រវត្តិរូបគ្រូ', 'success');
    onClose();
  };

  const rows = (key: 'englishTests' | 'teachingSkills', cols: { k: string; kh: string; en: string }[]) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-slate-100">
            <th className="w-10 border border-slate-400 px-1 py-1">ល.រ</th>
            {cols.map((c) => (
              <th key={c.k} className="border border-slate-400 px-1 py-1">{c.kh}<div className="font-normal text-slate-500">{c.en}</div></th>
            ))}
            {canEdit && <th className="no-print w-8 border border-slate-400" />}
          </tr>
        </thead>
        <tbody>
          {(p[key] || []).map((_, i) => (
            <tr key={i}>
              <td className="border border-slate-400 text-center">{i + 1}</td>
              {cols.map((c) => (
                <td key={c.k} className="border border-slate-400 px-1">{inp(`${key}.${i}.${c.k}`, '', 'border-b-0')}</td>
              ))}
              {canEdit && (
                <td className="no-print border border-slate-400 text-center">
                  <button type="button" onClick={() => setP((prev) => ({ ...prev, [key]: (prev[key] || []).filter((__, j) => j !== i) }))} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="mx-auto h-3.5 w-3.5" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {canEdit && (
        <button type="button" onClick={() => setP((prev) => ({ ...prev, [key]: [...(prev[key] || []), {}] }))} className="no-print mt-1 flex items-center gap-1 text-[11px] font-bold text-teal-700">
          <Plus className="h-3.5 w-3.5" /> បន្ថែមជួរ
        </button>
      )}
    </div>
  );

  return (
    <div className="print-isolate fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 print:bg-white print:p-0">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl print:max-w-none print:rounded-none print:shadow-none font-khmer">
        <div className="no-print sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white px-4 py-2.5">
          <div className="text-sm font-bold text-slate-900">ប្រវត្តិរូបបុគ្គលិក · {teacher.nameKhmer}</div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => window.print()} className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200">
              <Printer className="h-3.5 w-3.5" /> បោះពុម្ព
            </button>
            {canEdit && (
              <button onClick={save} className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700">
                <Save className="h-3.5 w-3.5" /> រក្សាទុក
              </button>
            )}
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          {/* Letterhead */}
          <div className="flex items-center gap-3 border-b-2 border-slate-800 pb-2">
            {settings.schoolLogo && <img src={settings.schoolLogo} alt="" className="h-12 w-12 rounded-full object-cover" />}
            <div className="flex-1">
              <div className="font-muol text-sm text-slate-900">{settings.schoolNameKhmer}</div>
              <div className="text-xs font-bold text-slate-600">{settings.schoolNameEnglish}</div>
            </div>
          </div>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="font-muol text-[13px] text-slate-900">ទម្រង់បែបបទប្រវត្តិរូបបុគ្គលិក</div>
              <div className="text-xs font-bold tracking-wide text-slate-700">EMPLOYEE PROFILE FORM</div>
            </div>
            <label className={`flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-400 bg-slate-50 text-[10px] text-slate-400 ${canEdit ? 'cursor-pointer' : ''}`}>
              {p.photo ? <img src={p.photo} alt="" className="h-full w-full object-cover" /> : '4 × 6'}
              {canEdit && (
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const img = new Image();
                    img.onload = () => {
                      const c = document.createElement('canvas');
                      const w = 240, h = 320;
                      c.width = w; c.height = h;
                      const ctx = c.getContext('2d')!;
                      const s = Math.max(w / img.width, h / img.height);
                      ctx.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
                      set('photo', c.toDataURL('image/jpeg', 0.8));
                    };
                    img.src = URL.createObjectURL(f);
                  }}
                />
              )}
            </label>
          </div>

          <Bar n="I" kh="ព័ត៌មានផ្ទាល់ខ្លួន" en="Personal Information" />
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <L kh="គោត្តនាម" en="Surname">{inp('surname')}</L>
              <L kh="នាមខ្លួន" en="First name">{inp('firstName')}</L>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
              <L kh="អាយុ" en="Age"><span className="flex-1 border-b border-dotted border-slate-400 px-1 text-[12px] text-blue-900">{ageOf(core.dob)}</span></L>
              <L kh="ភេទ" en="Sex">
                <select disabled={!canEdit} value={core.gender} onChange={(e) => setCore({ ...core, gender: e.target.value as any })} className="flex-1 border-0 border-b border-dotted border-slate-400 bg-transparent text-[12px] text-blue-900">
                  <option value="Female">ស្រី</option>
                  <option value="Male">ប្រុស</option>
                </select>
              </L>
              <L kh="សញ្ជាតិ" en="Nationality">{inp('nationality')}</L>
              <L kh="ថ្ងៃខែឆ្នាំកំណើត" en="DOB">
                <input type="date" disabled={!canEdit} value={core.dob} onChange={(e) => setCore({ ...core, dob: e.target.value })} className="flex-1 border-0 border-b border-dotted border-slate-400 bg-transparent text-[12px] text-blue-900" />
              </L>
            </div>
            <div className="text-[11px] text-slate-700">• ទីកន្លែងកំណើត (Place of Birth):</div>
            {addr('birthPlace')}
            <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
              <L kh="លេខទូរស័ព្ទ" en="Tel">
                <input disabled={!canEdit} value={core.phone} onChange={(e) => setCore({ ...core, phone: e.target.value })} className="flex-1 border-0 border-b border-dotted border-slate-400 bg-transparent px-1 text-[12px] text-blue-900" />
              </L>
              <L kh="អ៊ីមែល" en="Email">
                <input disabled={!canEdit} value={core.email} onChange={(e) => setCore({ ...core, email: e.target.value })} className="flex-1 border-0 border-b border-dotted border-slate-400 bg-transparent px-1 text-[12px] text-blue-900" />
              </L>
              <L kh="អត្តសញ្ញាណប័ណ្ណ" en="Citizen ID">{inp('citizenId')}</L>
              <L kh="លិខិតឆ្លងដែន" en="Passport ID">{inp('passportId')}</L>
              <L kh="សៀវភៅគ្រួសារលេខ" en="Family Book No">{inp('familyBookNo')}</L>
              <L kh="សៀវភៅស្នាក់នៅលេខ" en="Residence Book No">{inp('residenceBookNo')}</L>
            </div>
            <div className="text-[11px] text-slate-700">• ទីលំនៅអចិន្ត្រៃយ៍ (Permanent Address):</div>
            {addr('permanentAddress')}
            <div className="text-[11px] text-slate-700">• ទីលំនៅបច្ចុប្បន្ន (Present Address):</div>
            {addr('presentAddress')}
          </div>

          <Bar n="II" kh="ការងារ" en="Employment" />
          <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-[12px] sm:grid-cols-2">
            <div>តួនាទី (Position): <b className="text-blue-900">{teacher.position || teacher.homeroomClassName || '-'}</b></div>
            <div>ប្រភេទការងារ (Status): <b className="text-blue-900">{teacher.workStatus || '-'}</b></div>
            <div>ថ្ងៃចូលបម្រើការងារ (Date of service): <b className="text-blue-900">{teacher.joinDate ? teacher.joinDate.split('-').reverse().join('-') : '-'}</b></div>
            <div>កម្រិតវប្បធម៌ (Degree): <b className="text-blue-900">{teacher.qualification || '-'}</b></div>
          </div>

          <Bar n="V" kh="បញ្ជីសារពើភ័ណ្ឌផ្ទាល់ខ្លួននិងការអភិវឌ្ឍន៍" en="Personal Inventory and Development Record" />
          <div className="space-y-1.5 text-[11px]">
            <div className="font-bold">• ការសិក្សា (Education)</div>
            {([
              ['higher', 'ក្រោយឧត្តមសិក្សា', 'Higher Education', true],
              ['undergraduate', 'ឧត្តមសិក្សា', 'Under graduate', true],
              ['highSchool', 'វិទ្យាល័យ', 'Senior High School', false],
              ['lowerSecondary', 'អនុវិទ្យាល័យ', 'Lower Secondary School', false],
              ['primary', 'បឋមសិក្សា', 'Primary School', false],
            ] as const).map(([k, kh, en, isDegree]) => (
              <div key={k} className="pl-3">
                <div className="text-slate-700">○ {kh} ({en}):</div>
                <div className="grid grid-cols-1 gap-x-4 gap-y-1 pl-4 sm:grid-cols-3">
                  {isDegree ? (
                    <>
                      <L kh="សញ្ញាប័ត្រ" en="Degree">{inp(`education.${k}.degree`)}</L>
                      <L kh="វិទ្យាស្ថាន/សាកលវិទ្យាល័យ" en="Institute" className="sm:col-span-1">{inp(`education.${k}.institute`)}</L>
                    </>
                  ) : (
                    <L kh="សាលា" en="School" className="sm:col-span-2">{inp(`education.${k}.school`)}</L>
                  )}
                  <L kh="ឆ្នាំបញ្ចប់" en="Year Obtained">{inp(`education.${k}.year`)}</L>
                </div>
              </div>
            ))}

            <div className="pt-1 font-bold">• ការប្រឡង IELTS/ TOEFL ប្រចាំឆ្នាំ (Annual TOEFL Test)</div>
            {rows('englishTests', [
              { k: 'date', kh: 'ថ្ងៃខែប្រឡង', en: 'Test Date' },
              { k: 'type', kh: 'ប្រភេទប្រឡង', en: 'Test Type' },
              { k: 'year', kh: 'ឆ្នាំ', en: 'Year' },
              { k: 'other', kh: 'ផ្សេងៗ', en: 'Other' },
            ])}

            <div className="pt-1 font-bold">• ចំណេះជំនាញដែលអាចបង្រៀនបាន (Teaching Skills)</div>
            {rows('teachingSkills', [
              { k: 'skill', kh: 'មុខជំនាញ', en: 'Skills' },
              { k: 'confidence', kh: 'ទំនុកចិត្តលើខ្លួនឯង', en: 'Confidence (%)' },
              { k: 'time', kh: 'ម៉ោងដែលបង្រៀន', en: 'Teaching Time' },
              { k: 'other', kh: 'ផ្សេងៗ', en: 'Other' },
            ])}

            <div className="pt-1 font-bold">• ជំនាញឯកទេសផ្សេងៗ (Other Specialized Skills)</div>
            <textarea
              disabled={!canEdit}
              value={p.otherSkills || ''}
              onChange={(e) => set('otherSkills', e.target.value)}
              rows={2}
              className="w-full rounded border border-dotted border-slate-400 bg-transparent px-2 py-1 text-[12px] text-blue-900"
            />
          </div>

          <div className="mt-4 border-t border-slate-300 pt-1 text-center text-[9px] text-slate-500">
            {settings.address} · Tel: {settings.phone}
          </div>
        </div>
      </div>
    </div>
  );
};
