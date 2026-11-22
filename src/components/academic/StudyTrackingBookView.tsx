// សៀវភៅតាមដានការសិក្សាប្រចាំខែ — one A4 portrait page per student (scores shown /10 with Khmer levels).
import React, { useMemo, useState } from 'react';
import { NotebookPen, Printer, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  academicPeriods,
  activeStudents,
  attendanceSummary,
  classSubjects,
  computePeriodResults,
  subjectCfg,
  toPct,
  fmt,
  level10,
  LEVELS_10,
  periodLabel,
  subjectLabel,
  to10,
  toKh,
} from '../../utils/academic';
import { KhmerDocHeader, KhmerSignatureBlock, printWithOrientation } from './KhmerDoc';
import { StudentPicker } from './StudentPicker';
import { ClassFeeData, StudentFeeRecord, SubjectItem } from '../../types';

const TrackingPage: React.FC<{
  cls: ClassFeeData;
  student: StudentFeeRecord;
  subs: SubjectItem[];
  periodKey: string;
  results: ReturnType<typeof computePeriodResults>;
  classSize: number;
}> = ({ cls, student, subs, periodKey, results, classSize }) => {
  const { settings } = useApp();
  const row = cls.scores?.[periodKey]?.[String(student.id)] || {};
  const res = results[String(student.id)];
  const avg10 = to10(res?.average ?? null);
  const lvl = level10(avg10);
  const m = periodKey.match(/^m-(\d{4})-(\d{2})$/);
  const att = m ? attendanceSummary(cls.classId, student.id, [`${m[1]}-${m[2]}`]) : null;
  const blankRows = Math.max(0, 8 - subs.length);

  return (
    <div className="mx-auto w-full max-w-[210mm] break-after-page rounded-2xl border-2 border-[#1e40af] bg-white p-6 text-slate-900 shadow-sm print:rounded-none print:border-[#1e40af] print:shadow-none">
      <KhmerDocHeader compact />
      <div className="mt-3 grid grid-cols-[1.4fr_0.7fr_1.6fr_1fr] gap-x-3 gap-y-1 text-[12.5px]">
        <div>
          សិស្សឈ្មោះ៖ <span className="border-b border-dotted border-slate-500 px-1 font-bold text-[#1e3a8a]">{student.name}</span>
        </div>
        <div>
          ភេទ៖ <span className="border-b border-dotted border-slate-500 px-1 text-[#1e3a8a]">{student.gender === 'Female' ? 'ស្រី' : 'ប្រុស'}</span>
        </div>
        <div>
          ថ្នាក់ទី៖ <span className="border-b border-dotted border-slate-500 px-1 text-[#1e3a8a]">{cls.className}</span>
        </div>
        <div>
          អត្តលេខ៖ <span className="border-b border-dotted border-slate-500 px-1 font-mono text-[#1e3a8a]">{student.studentCode}</span>
        </div>
        <div className="col-span-4">
          ឆ្នាំសិក្សា៖ <span className="border-b border-dotted border-slate-500 px-1 text-[#1e3a8a]">{toKh(settings.academicYear)}</span>
        </div>
      </div>
      <div className="mt-3 h-px bg-[#1e40af]/40" />
      <h2 className="my-3 text-center font-muol text-2xl text-[#1e3a8a]">លទ្ធផលនៃការសិក្សាប្រចាំ{periodLabel(periodKey)}</h2>

      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="text-[#1e3a8a]">
            <th rowSpan={2} className="border border-[#1e40af] px-2 py-1 font-muol text-[12px] font-normal">មុខវិជ្ជា</th>
            <th colSpan={4} className="border border-[#1e40af] py-1 font-muol text-[12px] font-normal">និទ្ទេស</th>
            <th rowSpan={2} className="border border-[#1e40af] px-2 py-1 font-muol text-[12px] font-normal">ចំណុចដែលត្រូវជួយពង្រឹងបន្ថែម</th>
          </tr>
          <tr className="text-[10px] text-[#1e3a8a]">
            {LEVELS_10.map((l) => (
              <th key={l.key} className="w-14 border border-[#1e40af] px-0.5 leading-tight">
                {l.kh}
                <div className="text-[8.5px] text-slate-500">ពិន្ទុ {l.range}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subs.map((s) => {
            const v10 = to10(toPct(row[s.id] ?? null, subjectCfg(cls, s.id).max));
            const l = level10(v10);
            return (
              <tr key={s.id} className="h-9">
                <td className="border border-[#1e40af] px-2 font-semibold">{subjectLabel(s)}</td>
                {LEVELS_10.map((x) => (
                  <td key={x.key} className="border border-[#1e40af] text-center text-[#1e3a8a]">
                    {l?.key === x.key ? (
                      <span className="font-bold">
                        ✓ <span className="text-[11px]">({toKh(fmt(v10, 1))})</span>
                      </span>
                    ) : null}
                  </td>
                ))}
                <td className="border border-[#1e40af] px-2 text-[11.5px]">{l ? l.comment : ''}</td>
              </tr>
            );
          })}
          {Array.from({ length: blankRows }).map((_, i) => (
            <tr key={`b${i}`} className="h-9">
              <td className="border border-[#1e40af] px-2 text-slate-300">........................................</td>
              {LEVELS_10.map((x) => (
                <td key={x.key} className="border border-[#1e40af]" />
              ))}
              <td className="border border-[#1e40af] px-2 text-slate-300">........................................</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[12px]">
        {[
          ['មធ្យមភាគ', avg10 !== null ? toKh(fmt(avg10, 2)) : '-'],
          ['ចំណាត់ថ្នាក់', res?.rank ? `${toKh(res.rank)} / ${toKh(classSize)}` : '-'],
          ['និទ្ទេសរួម', lvl?.kh || '-'],
          ['វត្តមាន', att?.rate !== null && att?.rate !== undefined ? `${toKh(att.rate)}%` : '-'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-[#1e40af] px-2 py-1.5">
            <div className="text-[10.5px] text-slate-500">{k}</div>
            <div className="font-muol text-[13px] text-[#1e3a8a]">{v}</div>
          </div>
        ))}
      </div>
      {att && att.days > 0 && (
        <div className="mt-1 text-center text-[11px] text-slate-600">
          អវត្តមានមានច្បាប់ {toKh(att.permission)} ដង · អត់ច្បាប់ {toKh(att.noPermission)} ដង · យឺត {toKh(att.late)} ដង
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-6">
        <KhmerSignatureBlock role="ហត្ថលេខាមាតាបិតា ឬអាណាព្យាបាល" showDates={false} />
        <KhmerSignatureBlock role="គ្រូបន្ទុកថ្នាក់" name={cls.homeroomTeacher} />
      </div>
    </div>
  );
};

export const StudyTrackingBookView: React.FC = () => {
  const { orderedClassList, classData, subjects, settings } = useApp();
  const periods = useMemo(() => academicPeriods(settings.academicYear).filter((p) => p.month), [settings.academicYear]);
  const nowKey = `m-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [classId, setClassId] = useState(orderedClassList[0]?.classId || '');
  const [studentId, setStudentId] = useState<number | null>(null);
  const [periodKey, setPeriodKey] = useState(periods.some((p) => p.key === nowKey) ? nowKey : periods[0].key);
  const [printAll, setPrintAll] = useState(false);

  const cls = classData[classId];
  const subs = classSubjects(cls, subjects);
  const students = activeStudents(cls);
  const results = useMemo(
    () => computePeriodResults(students, subs.map((s) => s.id), cls?.scores?.[periodKey], cls),
    [cls, periodKey, subjects] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const student = students.find((s) => s.id === studentId);
  const res = student ? results[String(student.id)] : undefined;
  const avg10 = to10(res?.average ?? null);

  const doPrint = (all: boolean) => {
    setPrintAll(all);
    setTimeout(() => printWithOrientation('portrait'), 50);
  };

  return (
    <div className="space-y-4 font-khmer">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <NotebookPen className="h-6 w-6 text-blue-700" /> សៀវភៅតាមដានការសិក្សា
          </h1>
          <p className="text-xs text-slate-500">ទម្រង់សៀវភៅតាមដានការសិក្សាផ្លូវការ A4 Portrait · ពិន្ទុបង្ហាញលើ ១០</p>
        </div>
        <div className="flex gap-2">
          <select value={periodKey} onChange={(e) => setPeriodKey(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            {periods.map((p) => (
              <option key={p.key} value={p.key}>
                {p.labelKh}
              </option>
            ))}
          </select>
          <button onClick={() => doPrint(false)} className="flex items-center gap-1 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white shadow">
            <Printer className="h-4 w-4" /> បោះពុម្ពសិស្សនេះ
          </button>
          <button onClick={() => doPrint(true)} className="flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800">
            <Users className="h-4 w-4" /> បោះពុម្ពទាំងថ្នាក់
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <StudentPicker classId={classId} setClassId={setClassId} studentId={studentId} setStudentId={setStudentId} />
        {student && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg border border-slate-200 px-3 py-1">មធ្យមភាគ៖ <b className="font-mono text-indigo-700">{fmt(avg10, 2)}</b></span>
            <span className="rounded-lg border border-slate-200 px-3 py-1">ចំណាត់ថ្នាក់៖ <b>{res?.rank ? `លេខ ${toKh(res.rank)}` : '-'}</b></span>
            <span className="rounded-lg border border-slate-200 px-3 py-1">និទ្ទេស៖ <b className="text-blue-700">{level10(avg10)?.kh || '-'}</b></span>
            {res && res.entered < subs.length && (
              <span className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 text-amber-800">
                ⚠️ ពិន្ទុមិនទាន់គ្រប់ ({toKh(res.entered)}/{toKh(subs.length)} មុខវិជ្ជា)
              </span>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-slate-100 p-4 print:bg-white print:p-0">
        {cls &&
          (printAll ? students : student ? [student] : []).map((st) => (
            <div key={st.id} className={printAll && st.id !== studentId ? 'hidden print:block' : ''}>
              <TrackingPage cls={cls} student={st} subs={subs} periodKey={periodKey} results={results} classSize={students.length} />
            </div>
          ))}
      </div>
    </div>
  );
};

export default StudyTrackingBookView;
