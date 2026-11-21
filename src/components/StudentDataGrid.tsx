// Student data grid — every field from the admission form in one sortable table.
// Freeze the first columns (ID / name) on the left, and the action column is pinned on the right.
import React, { useEffect, useMemo, useState } from 'react';
import type { StudentFeeRecord, StudentAdmissionData } from '../types';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns3,
  Download,
  Edit3,
  Eye,
  Lock,
  Receipt,
  Trash2,
} from 'lucide-react';

type Accessor = (st: StudentFeeRecord, ad: StudentAdmissionData) => string | number | undefined;

interface ColDef {
  key: string;
  label: string;
  group: string;
  width: number;
  get: Accessor;
  numeric?: boolean;
}

const HEALTH_LABELS: Record<string, string> = {
  malnutrition: 'កង្វះអាហារូបត្ថម្ភ',
  heartCondition: 'បេះដូង',
  asthma: 'ហឺត',
  migraine: 'ឈឺក្បាលប្រកាំង',
  diabetes: 'ទឹកនោមផ្អែម',
  dizziness: 'វិលមុខ',
  behaviorConcerns: 'អាកប្បកិរិយា',
  learningConcerns: 'ការសិក្សា',
  hearingConcerns: 'ការស្តាប់',
  visionConcerns: 'ការមើលឃើញ',
  speechConcerns: 'ការនិយាយ',
  mobilityConcerns: 'ចលនា',
};

const ageOf = (dob?: string) => {
  if (!dob) return undefined;
  let y = NaN;
  if (/^\d{4}-/.test(dob)) y = Number(dob.slice(0, 4));
  else {
    const parts = dob.split(/[/.-]/);
    y = Number(parts[parts.length - 1]);
  }
  if (!y || isNaN(y)) return undefined;
  const age = new Date().getFullYear() - y;
  return age > 0 && age < 40 ? age : undefined;
};

const yes = (b?: boolean) => (b ? '✓' : '');

/** Admission data with the older nested sections folded in */
const adOf = (st: StudentFeeRecord): StudentAdmissionData => {
  const a = st.admissionData || {};
  return {
    ...a.pupil,
    ...a.gradeLevel,
    ...a,
    father: a.father || a.parents?.father,
    mother: a.mother || a.parents?.mother,
    caretaker: a.caretaker || a.parents?.caretaker,
    emergencyContact: a.emergencyContact || a.parents?.emergencyContact,
    forbiddenPickupPerson: a.forbiddenPickupPerson || a.parents?.forbiddenPickupPerson,
  };
};

export const STUDENT_GRID_COLUMNS: ColDef[] = [
  // I. Pupil
  { key: 'studentCode', label: 'អត្តលេខ', group: 'I. សិស្ស', width: 120, get: (s) => s.studentCode },
  { key: 'name', label: 'ឈ្មោះ (ខ្មែរ)', group: 'I. សិស្ស', width: 150, get: (s) => s.name },
  { key: 'latinName', label: 'ឈ្មោះឡាតាំង', group: 'I. សិស្ស', width: 150, get: (s, a) => s.latinName || a.nameEnglish },
  { key: 'gender', label: 'ភេទ', group: 'I. សិស្ស', width: 60, get: (s) => (s.gender === 'Female' ? 'ស្រី' : 'ប្រុស') },
  { key: 'dob', label: 'ថ្ងៃខែឆ្នាំកំណើត', group: 'I. សិស្ស', width: 110, get: (s, a) => s.dob || a.dob },
  { key: 'age', label: 'អាយុ', group: 'I. សិស្ស', width: 55, numeric: true, get: (s, a) => ageOf(s.dob || a.dob) },
  { key: 'nationality', label: 'សញ្ជាតិ', group: 'I. សិស្ស', width: 80, get: (s, a) => s.nationality || a.nationality },
  { key: 'religion', label: 'សាសនា', group: 'I. សិស្ស', width: 90, get: (s, a) => s.religion || a.religion },
  { key: 'placeOfBirth', label: 'ទីកន្លែងកំណើត', group: 'I. សិស្ស', width: 200, get: (s, a) => s.placeOfBirth || a.placeOfBirth },
  // II. Grade level
  { key: 'previousGrade', label: 'ថ្នាក់មុន', group: 'II. កម្រិតថ្នាក់', width: 80, get: (_s, a) => a.previousGrade },
  { key: 'previousYear', label: 'ឆ្នាំមុន', group: 'II. កម្រិតថ្នាក់', width: 90, get: (_s, a) => a.previousYear },
  { key: 'previousSchool', label: 'សាលាមុន', group: 'II. កម្រិតថ្នាក់', width: 160, get: (_s, a) => a.previousSchool },
  { key: 'presentGrade', label: 'ថ្នាក់បច្ចុប្បន្ន', group: 'II. កម្រិតថ្នាក់', width: 90, get: (_s, a) => a.presentGrade },
  { key: 'presentYear', label: 'ឆ្នាំសិក្សា', group: 'II. កម្រិតថ្នាក់', width: 90, get: (_s, a) => a.presentYear },
  { key: 'presentSchool', label: 'សាលាបច្ចុប្បន្ន', group: 'II. កម្រិតថ្នាក់', width: 180, get: (_s, a) => a.presentSchool },
  { key: 'studyDays', label: 'ថ្ងៃសិក្សា', group: 'II. កម្រិតថ្នាក់', width: 130, get: (_s, a) => a.studyDays },
  { key: 'studyHours', label: 'ម៉ោងសិក្សា', group: 'II. កម្រិតថ្នាក់', width: 150, get: (_s, a) => a.studyHours },
  // III. Health
  {
    key: 'health',
    label: 'បញ្ហាសុខភាព',
    group: 'III. សុខភាព',
    width: 180,
    get: (_s, a) =>
      Object.entries(a.health || {})
        .filter(([k, v]) => HEALTH_LABELS[k] && (v as any)?.hasCondition)
        .map(([k, v]) => HEALTH_LABELS[k] + ((v as any).details ? ` (${(v as any).details})` : ''))
        .join(', '),
  },
  { key: 'medication', label: 'ថ្នាំប្រើប្រចាំ', group: 'III. សុខភាព', width: 140, get: (_s, a) => (a.health?.takesMedication ? a.health.medicationDetails || '✓' : '') },
  // IV. Parents
  { key: 'fatherName', label: 'ឪពុក', group: 'IV. អាណាព្យាបាល', width: 130, get: (_s, a) => a.father?.name },
  { key: 'fatherJob', label: 'មុខរបរឪពុក', group: 'IV. អាណាព្យាបាល', width: 110, get: (_s, a) => a.father?.occupation },
  { key: 'fatherPhone', label: 'ទូរស័ព្ទឪពុក', group: 'IV. អាណាព្យាបាល', width: 110, get: (_s, a) => a.father?.phone },
  { key: 'motherName', label: 'ម្តាយ', group: 'IV. អាណាព្យាបាល', width: 130, get: (_s, a) => a.mother?.name },
  { key: 'motherJob', label: 'មុខរបរម្តាយ', group: 'IV. អាណាព្យាបាល', width: 110, get: (_s, a) => a.mother?.occupation },
  { key: 'motherPhone', label: 'ទូរស័ព្ទម្តាយ', group: 'IV. អាណាព្យាបាល', width: 110, get: (_s, a) => a.mother?.phone },
  { key: 'caretakerName', label: 'អាណាព្យាបាល', group: 'IV. អាណាព្យាបាល', width: 130, get: (s, a) => a.caretaker?.name || s.guardianName },
  { key: 'caretakerJob', label: 'មុខរបរអាណាព្យាបាល', group: 'IV. អាណាព្យាបាល', width: 130, get: (_s, a) => a.caretaker?.occupation },
  { key: 'caretakerPhone', label: 'ទូរស័ព្ទអាណាព្យាបាល', group: 'IV. អាណាព្យាបាល', width: 130, get: (s, a) => a.caretaker?.phone || s.guardianPhone || s.phone },
  { key: 'emergencyRel', label: 'ទំនាក់ទំនងបន្ទាន់', group: 'IV. អាណាព្យាបាល', width: 120, get: (_s, a) => a.emergencyContact?.relationship },
  { key: 'emergencyJob', label: 'មុខរបរ (បន្ទាន់)', group: 'IV. អាណាព្យាបាល', width: 110, get: (_s, a) => a.emergencyContact?.occupation },
  { key: 'emergencyPhone', label: 'ទូរស័ព្ទបន្ទាន់', group: 'IV. អាណាព្យាបាល', width: 110, get: (_s, a) => a.emergencyContact?.phone },
  { key: 'forbiddenPickup', label: 'ហាមមកទទួល', group: 'IV. អាណាព្យាបាល', width: 140, get: (_s, a) => (a.forbiddenPickupPerson?.hasForbiddenPerson ? a.forbiddenPickupPerson.details || '✓' : '') },
  // V. Services & address
  { key: 'breakfast', label: 'អាហារពេលព្រឹក', group: 'V. សេវា', width: 90, get: (_s, a) => yes(a.services?.breakfast) },
  { key: 'lunch', label: 'អាហារថ្ងៃត្រង់', group: 'V. សេវា', width: 90, get: (_s, a) => yes(a.services?.lunch) },
  { key: 'eveningFood', label: 'អាហារពេលល្ងាច', group: 'V. សេវា', width: 90, get: (_s, a) => yes(a.services?.eveningFood) },
  { key: 'address', label: 'អាសយដ្ឋាន', group: 'V. សេវា', width: 220, get: (s, a) => a.permanentAddress || s.address },
  // VI. Declaration & enrolment
  { key: 'parentSignDate', label: 'ថ្ងៃចុះហត្ថលេខា', group: 'VI. ផ្សេងៗ', width: 110, get: (_s, a) => a.parentSignDate },
  { key: 'declaration', label: 'យល់ព្រម', group: 'VI. ផ្សេងៗ', width: 70, get: (_s, a) => yes(a.declarationAccepted) },
  { key: 'note', label: 'ថ្មី/ចាស់', group: 'VI. ផ្សេងៗ', width: 75, get: (s) => (s.note === 'New' ? 'ថ្មី' : s.note === 'Old' ? 'ចាស់' : s.note) },
  { key: 'startDate', label: 'ថ្ងៃចូលរៀន', group: 'VI. ផ្សេងៗ', width: 100, get: (s) => s.startDate },
  { key: 'caseType', label: 'ប្រភេទបង់', group: 'VI. ផ្សេងៗ', width: 90, get: (s) => s.caseType },
  { key: 'feesGroup', label: 'ស្ថានភាព', group: 'VI. ផ្សេងៗ', width: 100, get: (s) => s.feesGroup },
];

const NO_WIDTH = 44;
const PREF_KEY = 'BIM_STUDENT_GRID_PREFS';

interface Props {
  students: StudentFeeRecord[];
  emptyText?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canSeePayments?: boolean;
  onView?: (st: StudentFeeRecord) => void;
  onEdit?: (st: StudentFeeRecord) => void;
  onDelete?: (st: StudentFeeRecord) => void;
  onPayHistory?: (st: StudentFeeRecord) => void;
  exportName?: string;
}

export const StudentDataGrid: React.FC<Props> = ({
  students,
  emptyText = 'មិនមានសិស្ស',
  canEdit,
  canDelete,
  canSeePayments,
  onView,
  onEdit,
  onDelete,
  onPayHistory,
  exportName = 'students',
}) => {
  const [prefs, setPrefs] = useState<{ freeze: number; hidden: string[] }>(() => {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) return { freeze: 2, hidden: [], ...JSON.parse(raw) };
    } catch {
      /* storage unavailable */
    }
    return { freeze: 2, hidden: [] };
  });
  useEffect(() => {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs]);

  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [showCols, setShowCols] = useState(false);

  const cols = STUDENT_GRID_COLUMNS.filter((c) => !prefs.hidden.includes(c.key));
  const freeze = Math.min(prefs.freeze, cols.length);

  // left offsets for frozen columns (after the # column)
  const leftOf = useMemo(() => {
    const out: number[] = [];
    let x = NO_WIDTH;
    cols.forEach((c, i) => {
      out[i] = x;
      if (i < freeze) x += c.width;
    });
    return out;
  }, [cols, freeze]);

  const rows = useMemo(() => {
    const list = students.map((st) => ({ st, ad: adOf(st) }));
    if (!sort) return list;
    const col = STUDENT_GRID_COLUMNS.find((c) => c.key === sort.key);
    if (!col) return list;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const va = col.get(a.st, a.ad);
      const vb = col.get(b.st, b.ad);
      const ea = va === undefined || va === '';
      const eb = vb === undefined || vb === '';
      if (ea || eb) return ea === eb ? 0 : ea ? 1 : -1; // blanks last
      if (col.numeric) return (Number(va) - Number(vb)) * dir;
      return String(va).localeCompare(String(vb), 'km', { numeric: true }) * dir;
    });
  }, [students, sort]);

  const toggleSort = (key: string) =>
    setSort((p) => (!p || p.key !== key ? { key, dir: 'asc' } : p.dir === 'asc' ? { key, dir: 'desc' } : null));

  const exportCSV = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      ['ល.រ', ...cols.map((c) => c.label)].map(esc).join(','),
      ...rows.map((r, i) => [i + 1, ...cols.map((c) => c.get(r.st, r.ad))].map(esc).join(',')),
    ];
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${exportName}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const hasActions = !!(onView || (canEdit && onEdit) || (canSeePayments && onPayHistory) || (canDelete && onDelete));
  const groups = Array.from(new Set(STUDENT_GRID_COLUMNS.map((c) => c.group)));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden font-khmer">
      {/* Grid toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">ចាក់សោជួរឈរ</span>
          <select
            value={prefs.freeze}
            onChange={(e) => setPrefs((p) => ({ ...p, freeze: Number(e.target.value) }))}
            className="px-2 py-1 border border-slate-200 rounded-lg bg-slate-50 font-bold"
          >
            <option value={0}>គ្មាន</option>
            {cols.slice(0, 4).map((c, i) => (
              <option key={c.key} value={i + 1}>
                ដល់ «{c.label}»
              </option>
            ))}
          </select>
          {sort && (
            <button type="button" onClick={() => setSort(null)} className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold cursor-pointer">
              ✕ ឈប់តម្រៀប
            </button>
          )}
        </div>
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCols((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
          >
            <Columns3 className="w-3.5 h-3.5" /> ជួរឈរ ({cols.length}/{STUDENT_GRID_COLUMNS.length})
          </button>
          <button
            type="button"
            onClick={exportCSV}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          {showCols && (
            <div className="absolute right-0 top-full mt-1 z-40 w-72 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              <div className="mb-2 flex justify-between">
                <button type="button" className="text-teal-700 font-bold cursor-pointer" onClick={() => setPrefs((p) => ({ ...p, hidden: [] }))}>
                  បង្ហាញទាំងអស់
                </button>
                <button type="button" className="text-slate-500 cursor-pointer" onClick={() => setShowCols(false)}>
                  បិទ
                </button>
              </div>
              {groups.map((g) => (
                <div key={g} className="mb-2">
                  <div className="text-[10px] font-bold text-slate-400 mb-1">{g}</div>
                  {STUDENT_GRID_COLUMNS.filter((c) => c.group === g).map((c) => (
                    <label key={c.key} className="flex items-center gap-2 py-0.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-teal-600"
                        checked={!prefs.hidden.includes(c.key)}
                        disabled={c.key === 'name'}
                        onChange={(e) =>
                          setPrefs((p) => ({
                            ...p,
                            hidden: e.target.checked ? p.hidden.filter((k) => k !== c.key) : [...p.hidden, c.key],
                          }))
                        }
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-auto max-h-[70vh]">
        <table className="border-separate border-spacing-0 text-xs" style={{ minWidth: '100%' }}>
          <thead>
            <tr>
              <th
                className="sticky top-0 left-0 z-30 bg-slate-100 border-b border-r border-slate-200 px-2 py-2 text-center text-slate-600"
                style={{ width: NO_WIDTH, minWidth: NO_WIDTH }}
              >
                #
              </th>
              {cols.map((c, i) => {
                const frozen = i < freeze;
                const s = sort?.key === c.key ? sort.dir : null;
                return (
                  <th
                    key={c.key}
                    onClick={() => toggleSort(c.key)}
                    className={`sticky top-0 ${frozen ? 'z-30' : 'z-20'} bg-slate-100 border-b border-r border-slate-200 px-2 py-2 text-left font-bold text-slate-700 whitespace-nowrap cursor-pointer select-none hover:bg-slate-200 ${
                      frozen && i === freeze - 1 ? 'shadow-[2px_0_0_0_#cbd5e1]' : ''
                    }`}
                    style={{ width: c.width, minWidth: c.width, ...(frozen ? { left: leftOf[i] } : {}) }}
                    title={`${c.group} · ចុចដើម្បីតម្រៀប`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.label}
                      {s === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-teal-600" />
                      ) : s === 'desc' ? (
                        <ArrowDown className="w-3 h-3 text-teal-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </span>
                  </th>
                );
              })}
              {hasActions && (
                <th className="sticky top-0 right-0 z-30 bg-slate-100 border-b border-l border-slate-200 px-2 py-2 text-center font-bold text-slate-700 whitespace-nowrap shadow-[-2px_0_0_0_#cbd5e1]">
                  សកម្មភាព
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={cols.length + 2} className="p-8 text-center text-slate-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map(({ st, ad }, ri) => (
                <tr key={st.id} className="group">
                  <td
                    className="sticky left-0 z-10 bg-white group-hover:bg-amber-50 border-b border-r border-slate-100 px-2 py-1.5 text-center font-mono text-slate-400"
                    style={{ width: NO_WIDTH, minWidth: NO_WIDTH }}
                  >
                    {ri + 1}
                  </td>
                  {cols.map((c, i) => {
                    const frozen = i < freeze;
                    const v = c.get(st, ad);
                    return (
                      <td
                        key={c.key}
                        className={`border-b border-r border-slate-100 px-2 py-1.5 whitespace-nowrap overflow-hidden text-ellipsis group-hover:bg-amber-50 ${
                          frozen ? 'sticky z-10 bg-white' : ''
                        } ${frozen && i === freeze - 1 ? 'shadow-[2px_0_0_0_#e2e8f0]' : ''} ${
                          c.key === 'name' ? 'font-bold text-slate-900' : 'text-slate-700'
                        } ${c.key === 'studentCode' ? 'font-mono' : ''}`}
                        style={{ maxWidth: c.width, ...(frozen ? { left: leftOf[i] } : {}) }}
                        title={v !== undefined ? String(v) : ''}
                      >
                        {v ?? ''}
                      </td>
                    );
                  })}
                  {hasActions && (
                    <td className="sticky right-0 z-10 bg-white group-hover:bg-amber-50 border-b border-l border-slate-100 px-1.5 py-1 shadow-[-2px_0_0_0_#e2e8f0]">
                      <div className="flex items-center justify-center gap-1">
                        {onView && (
                          <button type="button" onClick={() => onView(st)} title="មើលទម្រង់ពាក្យសុំ" className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 cursor-pointer">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {canEdit && onEdit && (
                          <button type="button" onClick={() => onEdit(st)} title="កែប្រែ" className="p-1.5 rounded-lg text-indigo-700 hover:bg-indigo-100 cursor-pointer">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {canSeePayments && onPayHistory && (
                          <button type="button" onClick={() => onPayHistory(st)} title="ប្រវត្តិបង់ប្រាក់" className="p-1.5 rounded-lg text-teal-700 hover:bg-teal-100 cursor-pointer">
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && onDelete && (
                          <button type="button" onClick={() => onDelete(st)} title="លុប" className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
