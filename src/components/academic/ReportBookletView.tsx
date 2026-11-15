// សៀវភៅសិក្ខាគារិក (Booklet Spread A4 Landscape — ២ ទំព័រ): semester results, absences,
// evaluation, yearly result, praise / remarks and director's comment.
import React, { useMemo, useState } from 'react';
import { BookMarked, Printer, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  activeStudents,
  attendanceSummary,
  academicPeriods,
  classSubjects,
  computeSemesterResults,
  computeYearResults,
  DEFAULT_SEM1_MONTHS,
  DEFAULT_SEM2_MONTHS,
  fmt,
  SemesterResult,
  subjectLabel,
  to10,
  toKh,
} from '../../utils/academic';
import { KhmerSignatureBlock, printWithOrientation } from './KhmerDoc';
import { PrintableText, StudentPicker } from './StudentPicker';
import { ClassFeeData, StudentBookletNote, StudentFeeRecord, SubjectItem } from '../../types';

const cell = 'border border-slate-800 px-1 text-center';
const s10 = (v: number | null | undefined) => (v === null || v === undefined ? '-' : fmt(to10(v), 2));
const rk = (r?: number) => (r ? toKh(String(r).padStart(2, '0')) : '');

const BookletSpread: React.FC<{
  cls: ClassFeeData;
  student: StudentFeeRecord;
  subs: SubjectItem[];
  sem1: { [id: string]: SemesterResult };
  sem2: { [id: string]: SemesterResult };
  year: ReturnType<typeof computeYearResults>;
  classSize: number;
  monthPrefixes: { s1: string[]; s2: string[] };
}> = ({ cls, student, subs, sem1, sem2, year, classSize, monthPrefixes }) => {
  const { settings, updateClassAcademic, permissions } = useApp();
  const id = String(student.id);
  const a = sem1[id];
  const b = sem2[id];
  const y = year[id];
  const note: StudentBookletNote = cls.bookletNotes?.[id] || {};
  const passed = y?.yearAvg !== null && y?.yearAvg !== undefined ? y.yearAvg >= 50 : null;
  const abs1 = attendanceSummary(cls.classId, student.id, monthPrefixes.s1);
  const abs2 = attendanceSummary(cls.classId, student.id, monthPrefixes.s2);

  const setNote = (k: keyof StudentBookletNote, v: string) =>
    updateClassAcademic(cls.classId, (c) => ({
      bookletNotes: { ...(c.bookletNotes || {}), [id]: { ...(c.bookletNotes?.[id] || {}), [k]: v } },
    }));
  const ed = (k: keyof StudentBookletNote, placeholder: string, rows = 3) => (
    <PrintableText value={note[k] || ''} onChange={(v) => setNote(k, v)} disabled={!permissions.canEdit} rows={rows} placeholder={placeholder} />
  );

  const summaryRows: [string, (r?: SemesterResult) => string, (r?: SemesterResult) => string][] = [
    ['សរុបពិន្ទុ', (r) => (r?.examTotal !== null && r?.examTotal !== undefined ? fmt((r.examTotal || 0) / 10, 1) : '-'), (r) => rk(r?.examRank)],
    ['មធ្យមភាគ', (r) => s10(r?.examAvg), (r) => rk(r?.examRank)],
    ['មធ្យមភាគប្រចាំខែ', (r) => s10(r?.monthlyAvg), (r) => rk(r?.monthlyRank)],
    ['មធ្យមភាគប្រចាំឆមាស', (r) => s10(r?.semesterAvg), (r) => rk(r?.semesterRank)],
  ];

  return (
    <div className="mx-auto grid w-full max-w-[297mm] grid-cols-2 gap-6 break-after-page bg-white p-5 text-slate-950 shadow-sm print:gap-[10mm] print:p-0 print:shadow-none">
      {/* ───── Left page ───── */}
      <div className="flex flex-col border border-slate-800 p-4 text-[11.5px]">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            នាមត្រកូល នាមខ្លួន <span className="border-b border-dotted border-slate-600 px-2 font-muol text-[12px]">{student.name}</span>
          </div>
          <div className="font-muol text-[12px] text-[#1e3a8a]">ថ្នាក់ទី {cls.className}</div>
          <div>
            ចំនួនសិស្ស <span className="border-b border-dotted border-slate-600 px-2">{toKh(classSize)}</span>
          </div>
        </div>
        <table className="mt-3 w-full border-collapse">
          <thead>
            <tr>
              <th colSpan={5} className={`${cell} font-muol text-[12px] font-normal`}>ក.លទ្ធផលនៃការប្រឡងឆមាស</th>
            </tr>
            <tr>
              <th rowSpan={2} className={`${cell} font-muol text-[11px] font-normal`}>មុខវិជ្ជា</th>
              <th colSpan={2} className={`${cell} font-muol text-[11px] font-normal`}>ឆមាសទី១</th>
              <th colSpan={2} className={`${cell} font-muol text-[11px] font-normal`}>ឆមាសទី២</th>
            </tr>
            <tr className="text-[10.5px]">
              <th className={`${cell} w-14`}>ពិន្ទុ</th>
              <th className={`${cell} w-14`}>ចំណាត់ថ្នាក់</th>
              <th className={`${cell} w-14`}>ពិន្ទុ</th>
              <th className={`${cell} w-14`}>ចំណាត់ថ្នាក់</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id}>
                <td className="border border-slate-800 px-1">{subjectLabel(s)}</td>
                <td className={cell}>{s10(a?.subjectScores[s.id])}</td>
                <td className={cell}>{rk(a?.subjectRanks[s.id])}</td>
                <td className={cell}>{s10(b?.subjectScores[s.id])}</td>
                <td className={cell}>{rk(b?.subjectRanks[s.id])}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 8 - subs.length) }).map((_, i) => (
              <tr key={i}>
                <td className="border border-slate-800 px-1 text-slate-300">.............................................</td>
                <td className={cell} />
                <td className={cell} />
                <td className={cell} />
                <td className={cell} />
              </tr>
            ))}
            {summaryRows.map(([label, val, rank]) => (
              <tr key={label} className="font-semibold">
                <td className="border border-slate-800 px-1">{label}</td>
                <td className={cell}>{val(a)}</td>
                <td className={cell}>{rank(a)}</td>
                <td className={cell}>{val(b)}</td>
                <td className={cell}>{rank(b)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="mt-4 w-full border-collapse">
          <thead>
            <tr>
              <th colSpan={3} className={`${cell} font-muol text-[12px] font-normal`}>ខ-ចំនួនពេលអវត្តមាន</th>
            </tr>
            <tr className="text-[10.5px]">
              <th className={cell} />
              <th className={cell}>ឆមាសទី១</th>
              <th className={cell}>ឆមាសទី២</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['មានច្បាប់', abs1.permission, abs2.permission],
              ['ឥតច្បាប់', abs1.noPermission, abs2.noPermission],
              ['មកយឺត', abs1.late, abs2.late],
            ].map(([k, x, z]) => (
              <tr key={String(k)}>
                <td className="border border-slate-800 px-1">{k}</td>
                <td className={cell}>{toKh(x as number)}</td>
                <td className={cell}>{toKh(z as number)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ───── Right page ───── */}
      <div className="flex flex-col border border-slate-800 p-4 text-[11.5px]">
        <div className="flex items-end justify-between">
          <div className="font-muol text-[12.5px] text-[#1e3a8a]">{settings.schoolNameKhmer}</div>
          <div className="font-muol text-[12.5px] text-[#1e3a8a]">ឆ្នាំសិក្សា {toKh(settings.academicYear)}</div>
        </div>
        <div className="mt-2 border border-slate-800">
          <div className="border-b border-slate-800 text-center font-muol text-[12px]">គ-វាយតម្លៃលើការសិក្សា</div>
          <div className="grid grid-cols-3 divide-x divide-slate-800">
            {(
              [
                ['ឆមាសទី១', 'evalSem1'],
                ['ឆមាសទី២', 'evalSem2'],
                ['ប្រចាំឆ្នាំ', 'evalYear'],
              ] as [string, keyof StudentBookletNote][]
            ).map(([label, k]) => (
              <div key={k}>
                <div className="border-b border-slate-800 text-center font-muol text-[11px]">{label}</div>
                <div className="p-1">{ed(k, 'វាយតម្លៃ...')}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 border border-slate-800 p-2">
          <div className="text-center font-muol text-[12px]">ឃ-លទ្ធផលប្រចាំឆ្នាំ</div>
          <div className="mt-1 flex justify-between">
            <span>
              មធ្យមភាគប្រចាំឆ្នាំ៖ <b>{y?.yearAvg !== null && y?.yearAvg !== undefined ? toKh(fmt(to10(y.yearAvg), 2)) : '-'}</b>
            </span>
            <span>
              ចំណាត់ថ្នាក់៖ <b>{y?.yearRank ? `${toKh(y.yearRank)} / ${toKh(classSize)}` : '-'}</b>
            </span>
            {passed !== null && <span className={passed ? 'font-bold text-emerald-700' : 'font-bold text-rose-700'}>{passed ? 'ជាប់' : 'ធ្លាក់'}</span>}
          </div>
          <div className="mt-1 grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
            <span>ត្រូវបានឡើងថ្នាក់ទី</span>
            {ed('promotedTo', '', 1)}
            <span>ត្រូវប្រឡងឡើងថ្នាក់ៈ មុខវិជ្ជា</span>
            {ed('retestSubjects', '', 1)}
            <span>ត្រូវរៀនត្រួតថ្នាក់ទី</span>
            {ed('repeatGrade', '', 1)}
          </div>
        </div>

        <div className="mt-3 border border-slate-800 p-2">
          <div className="text-center font-muol text-[12px]">ង-ការសរសើរនិងកែលម្អ</div>
          <div className="mt-1 grid grid-cols-2 gap-3">
            <div>
              <div className="text-center font-muol text-[11px] underline">ការសរសើរ</div>
              {ed('praise', 'ឧ. គោរពពេលវេលា មានទំនាក់ទំនងល្អ...')}
            </div>
            <div>
              <div className="text-center font-muol text-[11px] underline">កែលម្អ</div>
              {ed('improve', 'ឧ. ត្រូវខិតខំរៀនបន្ថែម...')}
            </div>
          </div>
          <div className="mt-1">
            <KhmerSignatureBlock role="គ្រូប្រចាំថ្នាក់" name={cls.homeroomTeacher} />
          </div>
        </div>

        <div className="mt-3 flex-1 border border-slate-800 p-2">
          <div className="text-center font-muol text-[12px]">ច-មតិរបស់នាយកសាលា</div>
          {ed('directorComment', 'មតិរបស់នាយកសាលា...', 2)}
          <KhmerSignatureBlock role="នាយកសាលា" name={settings.directorName} stampUrl={settings.principalStampUrl} />
        </div>
      </div>
    </div>
  );
};

export const ReportBookletView: React.FC = () => {
  const { orderedClassList, classData, subjects, settings } = useApp();
  const [classId, setClassId] = useState(orderedClassList[0]?.classId || '');
  const [studentId, setStudentId] = useState<number | null>(null);
  const [printAll, setPrintAll] = useState(false);

  const cls = classData[classId];
  const subs = classSubjects(cls, subjects);
  const subIds = subs.map((s) => s.id);
  const students = activeStudents(cls);
  const m1 = settings.semester1Months?.length ? settings.semester1Months : DEFAULT_SEM1_MONTHS;
  const m2 = settings.semester2Months?.length ? settings.semester2Months : DEFAULT_SEM2_MONTHS;

  const { sem1, sem2, year } = useMemo(() => {
    if (!cls) return { sem1: {}, sem2: {}, year: {} };
    const s1 = computeSemesterResults(cls, subIds, 1, settings.academicYear, m1);
    const s2 = computeSemesterResults(cls, subIds, 2, settings.academicYear, m2);
    return { sem1: s1, sem2: s2, year: computeYearResults(s1, s2) };
  }, [cls, subIds.join(), settings.academicYear, m1.join(), m2.join()]); // eslint-disable-line react-hooks/exhaustive-deps

  const prefixes = useMemo(() => {
    const ps = academicPeriods(settings.academicYear).filter((p) => p.month);
    const toPrefix = (months: number[]) =>
      ps.filter((p) => months.includes(p.month!)).map((p) => `${p.year}-${String(p.month).padStart(2, '0')}`);
    return { s1: toPrefix(m1), s2: toPrefix(m2) };
  }, [settings.academicYear, m1.join(), m2.join()]); // eslint-disable-line react-hooks/exhaustive-deps

  const student = students.find((s) => s.id === studentId);
  const y = student ? year[String(student.id)] : undefined;

  const doPrint = (all: boolean) => {
    setPrintAll(all);
    setTimeout(() => printWithOrientation('landscape'), 50);
  };

  return (
    <div className="space-y-4 font-khmer">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <BookMarked className="h-6 w-6 text-rose-700" /> សៀវភៅសិក្ខាគារិក (Booklet)
          </h1>
          <p className="text-xs text-slate-500">ទម្រង់សៀវភៅសិក្ខាគារិកផ្លូវការ ស្របតាមក្រសួងអប់រំ យុវជន និងកីឡា (២ ទំព័រទល់មុខគ្នា · A4 Landscape)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => doPrint(false)} className="flex items-center gap-1 rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white shadow">
            <Printer className="h-4 w-4" /> បោះពុម្ពសិស្សនេះ
          </button>
          <button onClick={() => doPrint(true)} className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-800">
            <Users className="h-4 w-4" /> បោះពុម្ពទាំងថ្នាក់
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <StudentPicker classId={classId} setClassId={setClassId} studentId={studentId} setStudentId={setStudentId} />
        {student && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg border border-slate-200 px-3 py-1">
              មធ្យមភាគប្រចាំឆ្នាំ៖ <b className="font-mono text-rose-700">{y?.yearAvg !== null && y?.yearAvg !== undefined ? fmt(to10(y.yearAvg), 2) : '-'}</b>
            </span>
            <span className="rounded-lg border border-slate-200 px-3 py-1">ចំណាត់ថ្នាក់៖ <b>{y?.yearRank ? `លេខ ${toKh(y.yearRank)}` : '-'}</b></span>
            {y?.yearAvg !== null && y?.yearAvg !== undefined && (
              <span className={`rounded-lg px-3 py-1 font-bold ${y.yearAvg >= 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {y.yearAvg >= 50 ? 'បានឡើងថ្នាក់' : 'មិនបានឡើងថ្នាក់'}
              </span>
            )}
            <span className="rounded-lg bg-slate-50 px-3 py-1 text-slate-500">
              ឆមាសទី១៖ ខែ {m1.map((m) => toKh(m)).join(', ')} · ឆមាសទី២៖ ខែ {m2.map((m) => toKh(m)).join(', ')}
            </span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl bg-slate-100 p-4 print:overflow-visible print:bg-white print:p-0">
        {cls &&
          (printAll ? students : student ? [student] : []).map((st) => (
            <div key={st.id} className={printAll && st.id !== studentId ? 'hidden print:block' : ''}>
              <BookletSpread
                cls={cls}
                student={st}
                subs={subs}
                sem1={sem1}
                sem2={sem2}
                year={year}
                classSize={students.length}
                monthPrefixes={prefixes}
              />
            </div>
          ))}
      </div>
    </div>
  );
};

export default ReportBookletView;
