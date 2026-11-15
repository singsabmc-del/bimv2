// ស្ទូឌីយោកាតសិស្សផ្លូវការ — Khmer / English student ID card, print one card or a whole class (A4, 3×3).
import React, { useMemo, useState } from 'react';
import { IdCard, Printer, Users, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { activeStudents, KH_MONTHS, studentPhoto, toKh } from '../../utils/academic';
import { KhmerOrnament, printWithOrientation } from './KhmerDoc';
import { ClassFeeData, StudentFeeRecord } from '../../types';

type Lang = 'kh' | 'en';

const formatDob = (dob: string | undefined, lang: Lang) => {
  if (!dob) return '-';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return dob;
  return lang === 'kh'
    ? `${toKh(String(d.getDate()).padStart(2, '0'))}/ ${KH_MONTHS[d.getMonth()]}/ ${toKh(d.getFullYear())}`
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const L = {
  kh: {
    title: 'ប័ណ្ណសម្គាល់ខ្លួនសិស្ស',
    name: 'គោត្តនាម នាម',
    gender: 'ភេទ',
    dob: 'ថ្ងៃខែឆ្នាំកំណើត',
    cls: 'ថ្នាក់ទី',
    father: 'ឪពុកឈ្មោះ',
    mother: 'ម្តាយឈ្មោះ',
    address: 'អាសយដ្ឋាន',
    year: 'ឆ្នាំសិក្សា',
    director: 'នាយកសាលា',
    m: 'ប',
    f: 'ស',
  },
  en: {
    title: 'STUDENT ID CARD',
    name: 'Name',
    gender: 'Sex',
    dob: 'Date of Birth',
    cls: 'Class',
    father: 'Father',
    mother: 'Mother',
    address: 'Address',
    year: 'Academic Year',
    director: 'Director',
    m: 'M',
    f: 'F',
  },
};

export interface CardOverrides {
  schoolName?: string;
  cardId?: string;
  year?: string;
  father?: string;
  mother?: string;
  address?: string;
  issueText?: string;
}

export const StudentIdCard: React.FC<{ student: StudentFeeRecord; cls: ClassFeeData; lang: Lang; o?: CardOverrides }> = ({
  student,
  cls,
  lang,
  o = {},
}) => {
  const { settings } = useApp();
  const t = L[lang];
  const ad = student.admissionData;
  const name = lang === 'en' ? student.latinName || ad?.nameEnglish || student.name : student.name;
  const school = o.schoolName || (lang === 'en' ? settings.schoolNameEnglish : settings.schoolNameKhmer);
  const year = o.year || (lang === 'kh' ? toKh(settings.academicYear) : settings.academicYear);
  const photo = studentPhoto(student);
  const today = new Date();
  const issue =
    o.issueText ||
    (lang === 'kh'
      ? `ថ្ងៃទី ${toKh(today.getDate())} ខែ${KH_MONTHS[today.getMonth()]} ឆ្នាំ ${toKh(today.getFullYear())}`
      : today.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }));

  const Row: React.FC<{ k: string; v?: string; strong?: boolean }> = ({ k, v, strong }) => (
    <div className="flex min-w-0 gap-1 leading-[1.4]">
      <span className="shrink-0 text-slate-600">{k} :</span>
      <span className={`truncate ${strong ? 'font-muol !leading-[1.4] text-[8pt] text-[#0b2a6f]' : 'font-semibold text-slate-900'}`}>{v || '-'}</span>
    </div>
  );

  return (
    <div
      className="relative flex h-[85.6mm] w-[54mm] shrink-0 flex-col overflow-hidden rounded-[3mm] border-[1.2mm] border-[#123a8f] bg-white font-khmer text-[7pt] text-slate-900 shadow-lg print:shadow-none"
      style={{ background: 'linear-gradient(160deg,#eaf2ff 0%,#ffffff 38%,#ffffff 70%,#dbe8ff 100%)' }}
    >
      {/* corner kbach + wave */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full border-[6px] border-[#c9a227]/40" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-[70mm] rotate-[-8deg] bg-gradient-to-r from-[#123a8f] to-[#2f6fde] opacity-90" />
      <div className="pointer-events-none absolute -bottom-12 -left-6 h-24 w-[70mm] rotate-[-8deg] border-t-2 border-[#c9a227]" />

      <div className="relative flex items-center gap-1.5 px-2 pt-1.5">
        <div className="flex h-[10mm] w-[10mm] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#c9a227] bg-white">
          {settings.schoolLogo ? <img src={settings.schoolLogo} alt="" className="h-full w-full object-cover" /> : <span className="text-lg">🎓</span>}
        </div>
        <div className="flex-1 text-center">
          <div className="font-muol !leading-[1.65] text-[7.3pt] text-[#0b2a6f]">ព្រះរាជាណាចក្រកម្ពុជា</div>
          <div className="font-muol !leading-[1.65] text-[6.4pt] text-[#0b2a6f]">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
          <KhmerOrnament color="#0b2a6f" className="-my-0.5 scale-75" />
        </div>
      </div>

      <div className="relative mx-2 mt-0.5 border-t border-[#123a8f]/50 pt-0.5 text-center">
        <div className={`${lang === 'kh' ? 'font-muol !leading-[1.7] text-[10pt]' : 'text-[10pt] font-black leading-tight tracking-wide'} text-[#0f7a3a]`}>{t.title}</div>
        <div className="font-muol !leading-[1.65] text-[7.8pt] text-[#c0151b]">{school}</div>
        <div className="text-[7.8pt] font-bold leading-tight text-[#c0151b]">ID: {o.cardId || student.studentCode}</div>
      </div>

      <div className="relative mt-0.5 space-y-0 px-2.5">
        <div className="flex min-w-0 justify-between gap-1">
          <Row k={t.name} v={name} strong />
          <Row k={t.gender} v={student.gender === 'Female' ? t.f : t.m} />
        </div>
        <Row k={t.dob} v={formatDob(student.dob || ad?.dob, lang)} />
        <Row k={t.cls} v={cls.className} />
        <div className="grid min-w-0 grid-cols-[1.15fr_1fr] gap-1">
          <Row k={t.father} v={o.father ?? ad?.father?.name ?? student.guardianName} />
          <Row k={t.mother} v={o.mother ?? ad?.mother?.name} />
        </div>
        <Row k={t.address} v={o.address ?? student.address} />
        <div className="text-center font-muol !leading-[1.7] text-[7.8pt] text-[#c0151b]">
          {t.year}: {year}
        </div>
      </div>

      <div className="relative mt-auto flex items-end gap-2 px-2 pb-1.5">
        <div className="h-[22mm] w-[17.5mm] shrink-0 overflow-hidden rounded-[1.5mm] border-[0.6mm] border-[#123a8f] bg-slate-100">
          {photo ? (
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[6pt] text-slate-400">រូបថត ៤x៦</div>
          )}
        </div>
        <div className="flex-1 pb-1 text-center text-[6.3pt] leading-tight text-white">
          <div className="rounded bg-white/85 px-1 font-semibold text-[#0b2a6f]">{issue}</div>
          <div className="relative h-[6mm]">
            {settings.principalStampUrl && <img src={settings.principalStampUrl} alt="" className="absolute inset-0 m-auto h-[9mm] object-contain" />}
          </div>
          <div className="font-muol !leading-[1.4] text-[7pt]">{t.director}</div>
        </div>
      </div>
    </div>
  );
};

export const StudentIdCardView: React.FC = () => {
  const { orderedClassList, classData, settings } = useApp();
  const [lang, setLang] = useState<Lang>('kh');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string>(''); // `${classId}::${studentId}`
  const [o, setO] = useState<CardOverrides>({});
  const [printClass, setPrintClass] = useState(false);

  const pool = useMemo(() => {
    const list: { cls: ClassFeeData; st: StudentFeeRecord }[] = [];
    orderedClassList.forEach((c) => {
      if (classFilter !== 'all' && c.classId !== classFilter) return;
      activeStudents(classData[c.classId]).forEach((st) => list.push({ cls: classData[c.classId], st }));
    });
    const q = query.trim().toLowerCase();
    return q ? list.filter(({ st }) => `${st.name} ${st.studentCode} ${st.latinName || ''}`.toLowerCase().includes(q)) : list;
  }, [orderedClassList, classData, classFilter, query]);

  const idx = Math.max(0, pool.findIndex(({ cls, st }) => `${cls.classId}::${st.id}` === selected));
  const current = pool[idx];
  const go = (d: number) => {
    const n = pool[idx + d];
    if (n) {
      setSelected(`${n.cls.classId}::${n.st.id}`);
      setO({});
    }
  };

  const field = (k: keyof CardOverrides, label: string, placeholder?: string) => (
    <label className="text-xs text-slate-600">
      {label}
      <input
        value={o[k] ?? ''}
        placeholder={placeholder}
        onChange={(e) => setO((p) => ({ ...p, [k]: e.target.value || undefined }))}
        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
      />
    </label>
  );

  const doPrint = (whole: boolean) => {
    setPrintClass(whole);
    setTimeout(() => printWithOrientation('portrait'), 50);
  };
  const printList = printClass ? pool : current ? [current] : [];

  return (
    <div className="space-y-4 font-khmer">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <IdCard className="h-6 w-6 text-emerald-700" /> ស្ទូឌីយោកាតសិស្សផ្លូវការ (Student ID Card Studio)
          </h1>
          <p className="text-xs text-slate-500">ប័ណ្ណសម្គាល់ខ្លួនសិស្ស ទំហំស្តង់ដារ ៥៤ x ៨៥.៦ ម.ម · បោះពុម្ព ឬរក្សាទុកជា PDF</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => doPrint(false)} className="flex items-center gap-1 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white shadow">
            <Printer className="h-4 w-4" /> បោះពុម្ពកាតសិស្ស
          </button>
          <button onClick={() => doPrint(true)} className="flex items-center gap-1 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow">
            <Users className="h-4 w-4" /> បោះពុម្ពទាំងបញ្ជី ({toKh(pool.length)})
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr] print:block">
        <div className="space-y-3 print:hidden">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-bold">ភាសាកាតសិស្ស (Card Language)</div>
            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm">
              {(['kh', 'en'] as Lang[]).map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`rounded-lg py-1.5 ${lang === l ? 'bg-white font-bold text-blue-700 shadow' : 'text-slate-500'}`}>
                  {l === 'kh' ? 'KH ភាសាខ្មែរ' : 'GB English'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm font-bold">
              ជ្រើសរើសសិស្ស (Select Student)
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{toKh(pool.length)} នាក់</span>
            </div>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="all">គ្រប់ថ្នាក់ទាំងអស់ (All Classes)</option>
              {orderedClassList.map((c) => (
                <option key={c.classId} value={c.classId}>
                  {c.className}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ស្វែងរកតាមឈ្មោះ, អត្តលេខ (ID)..."
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <select
              value={current ? `${current.cls.classId}::${current.st.id}` : ''}
              onChange={(e) => {
                setSelected(e.target.value);
                setO({});
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {pool.map(({ cls, st }) => (
                <option key={`${cls.classId}::${st.id}`} value={`${cls.classId}::${st.id}`}>
                  {st.studentCode} - {st.name} ({cls.className})
                </option>
              ))}
            </select>
            <div className="flex justify-between text-sm">
              <button onClick={() => go(-1)} disabled={idx <= 0} className="text-slate-600 disabled:opacity-40">
                ← សិស្សមុន
              </button>
              <button onClick={() => go(1)} disabled={idx >= pool.length - 1} className="text-slate-600 disabled:opacity-40">
                សិស្សបន្ទាប់ →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="col-span-2 text-sm font-bold">កែព័ត៌មានលើកាត (សម្រាប់កាតនេះ)</div>
            <div className="col-span-2">{field('schoolName', 'ឈ្មោះសាលារៀន (School Name)', lang === 'kh' ? settings.schoolNameKhmer : settings.schoolNameEnglish)}</div>
            {field('cardId', 'អត្តលេខកាត (ID)', current?.st.studentCode)}
            {field('year', 'ឆ្នាំសិក្សា', toKh(settings.academicYear))}
            {field('father', 'ឪពុកឈ្មោះ', current?.st.admissionData?.father?.name || current?.st.guardianName)}
            {field('mother', 'ម្តាយឈ្មោះ', current?.st.admissionData?.mother?.name)}
            <div className="col-span-2">{field('address', 'អាសយដ្ឋាន (Address)', current?.st.address)}</div>
            <p className="col-span-2 text-[11px] text-slate-500">រូបថតយកពីព័ត៌មានសិស្ស។ ឡូហ្គោ និងត្រានាយកកំណត់នៅ «តារាងកិត្តិយស» ឬការកំណត់ប្រព័ន្ធ។</p>
          </div>
        </div>

        <div className="flex min-h-[420px] items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-blue-50 p-6 print:block print:bg-white print:p-0">
          <div className="hidden print:grid print:grid-cols-3 print:gap-[6mm]">
            {printList.map(({ cls, st }) => (
              <div key={`${cls.classId}::${st.id}`} className="break-inside-avoid">
                <StudentIdCard student={st} cls={cls} lang={lang} o={printClass ? {} : o} />
              </div>
            ))}
          </div>
          <div className="print:hidden">
            {current ? (
              <div className="origin-center scale-[1.35] py-16">
                <StudentIdCard student={current.st} cls={current.cls} lang={lang} o={o} />
              </div>
            ) : (
              <div className="text-slate-500">មិនមានសិស្ស</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentIdCardView;
