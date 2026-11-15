// Class + student selector with previous / next, shared by the study books and ID cards.
import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { activeStudents, toKh } from '../../utils/academic';

export const StudentPicker: React.FC<{
  classId: string;
  setClassId: (id: string) => void;
  studentId: number | null;
  setStudentId: (id: number | null) => void;
  extra?: React.ReactNode;
}> = ({ classId, setClassId, studentId, setStudentId, extra }) => {
  const { orderedClassList, classData } = useApp();
  const students = activeStudents(classData[classId]);
  const idx = students.findIndex((s) => s.id === studentId);

  useEffect(() => {
    if (!classData[classId] && orderedClassList[0]) setClassId(orderedClassList[0].classId);
  }, [classData, classId, orderedClassList, setClassId]);

  useEffect(() => {
    if (!students.some((s) => s.id === studentId)) setStudentId(students[0]?.id ?? null);
  }, [classId, students.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
        {orderedClassList.map((c) => (
          <option key={c.classId} value={c.classId}>
            {c.className}
          </option>
        ))}
      </select>
      <select
        value={studentId ?? ''}
        onChange={(e) => setStudentId(Number(e.target.value))}
        className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.studentCode} - {s.name}
          </option>
        ))}
      </select>
      <button
        disabled={idx <= 0}
        onClick={() => setStudentId(students[idx - 1]?.id ?? null)}
        className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" /> សិស្សមុន
      </button>
      <button
        disabled={idx < 0 || idx >= students.length - 1}
        onClick={() => setStudentId(students[idx + 1]?.id ?? null)}
        className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-40"
      >
        សិស្សបន្ទាប់ <ChevronRight className="h-4 w-4" />
      </button>
      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{toKh(students.length)} នាក់</span>
      {extra}
    </div>
  );
};

/** Textarea on screen, plain text when printed. */
export const PrintableText: React.FC<{
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, disabled, rows = 2, placeholder, className = '' }) => (
  <>
    <textarea
      value={value}
      disabled={disabled}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full resize-none rounded border border-dashed border-slate-300 bg-amber-50/40 px-1 py-0.5 text-[11px] leading-snug print:hidden ${className}`}
    />
    <div className={`hidden whitespace-pre-wrap text-[11px] leading-snug print:block ${className}`}>{value}</div>
  </>
);
