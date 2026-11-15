// ស្ទូឌីយោកាតសិស្សផ្លូវការ — Khmer / English student ID card, print one card or a whole class (A4, 3×3).
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { IdCard, Printer, Users, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { activeStudents, KH_MONTHS, studentPhoto, toKh } from '../../utils/academic';
import { KhmerOrnament, printWithOrientation } from './KhmerDoc';
import { ClassFeeData, StudentFeeRecord } from '../../types';

type Lang = 'kh' | 'en';

/**
 * Auto-shrinking single-line text: measures the real rendered width and lowers the font size
 * (0.2pt steps) until the text fits its space. If the primary font still does not fit at its
 * minimum, it switches to a narrower fallback font (e.g. Muol → bold Battambang) and fits again.
 */
export const FitText: React.FC<{
  text: string;
  maxPt: number;
  minPt: number;
  className?: string;
  fallbackClassName?: string;
  fallbackMaxPt?: number;
  fallbackMinPt?: number;
}> = ({ text, maxPt, minPt, className = '', fallbackClassName, fallbackMaxPt, fallbackMinPt }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState<{ pt: number; fallback: boolean }>({ pt: maxPt, fallback: false });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const overflows = () => el.scrollWidth > el.clientWidth + 0.5;
    const shrink = (from: number, to: number) => {
      let size = from;
      el.style.fontSize = `${size}pt`;
      while (overflows() && size > to) {
        size = Math.max(to, Math.round((size - 0.2) * 10) / 10);
        el.style.fontSize = `${size}pt`;
      }
      return size;
    };
    el.className = `${base} ${className}`;
    let size = shrink(maxPt, minPt);
    let fallback = false;
    if (overflows() && fallbackClassName) {
      el.className = `${base} ${fallbackClassName}`;
      size = shrink(fallbackMaxPt ?? maxPt, fallbackMinPt ?? minPt);
      fallback = true;
    }
    setFit({ pt: size, fallback });
  }, [text, maxPt, minPt, className, fallbackClassName, fallbackMaxPt, fallbackMinPt]);

  return (
    <span ref={ref} className={`${base} ${fit.fallback && fallbackClassName ? fallbackClassName : className}`} style={{ fontSize: `${fit.pt}pt` }}>
      {text}
    </span>
  );
};
// overflow-hidden is needed for horizontal fitting, but it also clips Khmer vowels/subscripts
// above and below the line. Vertical padding enlarges the clip box; the equal negative margin
// keeps the layout unchanged.
const base = 'block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap py-[0.5em] -my-[0.5em]';

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
    m: 'ប្រុស',
    f: 'ស្រី',
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
    m: 'Male',
    f: 'Female',
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

export const StudentIdCard: React.FC<{
  student: StudentFeeRecord;
  cls: ClassFeeData;
  lang: Lang;
  o?: CardOverrides;
  stampGuide?: boolean; // print a faint dashed circle where the official stamp goes
}> = ({ student, cls, lang, o = {}, stampGuide = false }) => {
  const { settings } = useApp();
  const t = L[lang];
  const ad = student.admissionData;
  const name = lang === 'en' ? student.latinName || ad?.nameEnglish || student.name : student.name;
  const school = o.schoolName || (lang === 'en' ? settings.schoolNameEnglish : settings.schoolNameKhmer);
  const year = o.year || (lang === 'kh' ? toKh(settings.academicYear) : settings.academicYear);
  const photo = studentPhoto(student);
  // "ថ្នាក់ទី ១A (Grade 1A)" → KH "១A" (label already says ថ្នាក់ទី), EN "Grade 1A"
  const classValue =
    lang === 'kh'
      ? cls.className.split(' (')[0].replace(/^ថ្នាក់ទី\s*/, '').trim() || cls.className
      : cls.className.match(/\s\(([^)]*)\)/)?.[1]?.split(' - ')[0] || cls.className;
  const today = new Date();
  const issue =
    o.issueText ||
    (lang === 'kh'
      ? `ថ្ងៃទី ${toKh(today.getDate())} ខែ${KH_MONTHS[today.getMonth()]} ឆ្នាំ ${toKh(today.getFullYear())}`
      : today.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }));

  // Values shrink automatically to fit; the name uses Muol and falls back to bold Battambang when very long
  const Row: React.FC<{ k: string; v?: string; strong?: boolean; className?: string }> = ({ k, v, strong, className = '' }) => (
    <div className={`flex min-w-0 items-baseline gap-1 leading-[1.36] ${className}`}>
      <span className="shrink-0 text-[6.8pt] text-slate-600">{k} :</span>
      {strong ? (
        <FitText
          text={v || '-'}
          maxPt={8.5}
          minPt={6.8}
          className="font-muol !leading-[1.45] text-[#0b2a6f]"
          fallbackClassName="font-khmer font-bold text-[#0b2a6f]"
          fallbackMaxPt={7.8}
          fallbackMinPt={6}
        />
      ) : (
        <FitText text={v || '-'} maxPt={7.3} minPt={5.8} className="font-semibold text-slate-900" />
      )}
    </div>
  );

  return (
    <div
      className="relative flex h-[85.6mm] w-[54mm] shrink-0 flex-col overflow-hidden rounded-[3mm] border-[1.2mm] border-[#123a8f] bg-white font-khmer text-[7.2pt] text-slate-900 shadow-lg print:shadow-none"
      style={{ background: 'linear-gradient(160deg,#eaf2ff 0%,#ffffff 38%,#ffffff 70%,#dbe8ff 100%)' }}
    >
      {/* corner kbach + wave */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full border-[6px] border-[#c9a227]/40" />
      <div className="pointer-events-none absolute -bottom-[22.5mm] -left-6 h-24 w-[70mm] rotate-[4deg] bg-gradient-to-r from-[#123a8f] to-[#2f6fde]" />
      <div className="pointer-events-none absolute -bottom-[23.5mm] -left-6 h-24 w-[70mm] rotate-[4deg] border-t-2 border-[#c9a227]" />

      <div className="relative flex items-center gap-1.5 px-2 pt-1">
        <div className="flex h-[10mm] w-[10mm] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#c9a227] bg-white">
          {settings.schoolLogo ? <img src={settings.schoolLogo} alt="" className="h-full w-full object-cover" /> : <span className="text-lg">🎓</span>}
        </div>
        <div className="flex-1 text-center">
          <div className="font-muol !leading-[1.6] text-[7.5pt] text-[#0b2a6f]">ព្រះរាជាណាចក្រកម្ពុជា</div>
          <div className="font-muol !leading-[1.6] text-[6.8pt] text-[#0b2a6f]">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
          <KhmerOrnament color="#0b2a6f" className="-my-0.5 scale-75" />
        </div>
      </div>

      <div className="relative mx-2 mt-0.5 border-t border-[#123a8f]/50 pt-0.5 text-center">
        <div className={`${lang === 'kh' ? 'font-muol !leading-[1.55] text-[10pt]' : 'text-[10pt] font-black leading-tight tracking-wide'} text-[#0f7a3a]`}>{t.title}</div>
        <FitText text={school} maxPt={7.8} minPt={6} className="w-full text-center font-muol !leading-[1.5] text-[#c0151b]" />
        <div className="text-[7.8pt] font-bold leading-tight text-[#c0151b]">ID: {o.cardId || student.studentCode}</div>
      </div>

      <div className="relative mt-0.5 space-y-0 px-2.5">
        <Row k={t.name} v={name} strong />
        <Row k={t.dob} v={formatDob(student.dob || ad?.dob, lang)} />
        <div className="grid min-w-0 grid-cols-[1fr_auto] gap-1.5">
          <Row k={t.cls} v={classValue} />
          <Row k={t.gender} v={student.gender === 'Female' ? t.f : t.m} />
        </div>
        {/* Father and mother each get a full row so long names keep a readable size */}
        <Row k={t.father} v={o.father ?? ad?.father?.name ?? student.guardianName} />
        <Row k={t.mother} v={o.mother ?? ad?.mother?.name} />
        <Row k={t.address} v={o.address ?? student.address} />
        <Row k={t.year} v={year} />
      </div>

      <div className="relative mt-auto flex items-end gap-2 px-2 pb-1.5">
        <div className="h-[20mm] w-[16mm] shrink-0 overflow-hidden rounded-[1.5mm] border-[0.6mm] border-[#123a8f] bg-slate-100">
          {photo ? (
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[6.5pt] text-slate-400">រូបថត ៤x៦</div>
          )}
        </div>
        <div className="flex h-[20mm] min-w-0 flex-1 flex-col items-center text-center text-[6.8pt] leading-tight text-[#0b2a6f]">
          <div className="font-semibold">{issue}</div>
          <div className="font-muol !leading-[1.5] text-[7.5pt] text-[#0b2a6f]">{t.director}</div>
          {/* ── Stamp area (ចន្លោះបោះត្រា): white background, overlaps the photo corner slightly ── */}
          <div className="relative -ml-[6mm] w-[calc(100%+6mm)] flex-1">
            {settings.principalStampUrl ? (
              <img src={settings.principalStampUrl} alt="" className="absolute left-1/2 top-1/2 z-10 h-[14mm] w-[14mm] -translate-x-1/2 -translate-y-1/2 object-contain" />
            ) : (
              <div
                className={`absolute left-1/2 top-1/2 flex h-[12mm] w-[12mm] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-dashed border-[#c0151b]/45 text-[5.5pt] text-[#c0151b]/60 ${stampGuide ? '' : 'print:hidden'}`}
              >
                កន្លែងបោះត្រា
              </div>
            )}
          </div>
          {settings.directorName && (
            <FitText text={settings.directorName} maxPt={7.2} minPt={5.8} className="relative w-full flex-none text-center font-muol !leading-[1.55] text-[#0b2a6f]" />
          )}
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
  const [stampGuide, setStampGuide] = useState(false);

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
            <label className="col-span-2 flex items-center gap-2 rounded-lg bg-rose-50 px-2 py-1.5 text-xs text-rose-800">
              <input type="checkbox" checked={stampGuide} onChange={(e) => setStampGuide(e.target.checked)} />
              បោះពុម្ពរង្វង់ចំណុចៗ សម្គាល់កន្លែងបោះត្រា (ពេលបោះត្រាដោយដៃ)
            </label>
            <p className="col-span-2 text-[11px] text-slate-500">រូបថតយកពីព័ត៌មានសិស្ស។ ឡូហ្គោ និងត្រានាយកកំណត់នៅ «តារាងកិត្តិយស» ឬការកំណត់ប្រព័ន្ធ។</p>
          </div>
        </div>

        <div className="flex min-h-[420px] items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-blue-50 p-6 print:block print:bg-white print:p-0">
          <div aria-hidden="true" className="pointer-events-none fixed -left-[10000px] top-0 grid grid-cols-3 gap-[6mm] print:pointer-events-auto print:static print:left-auto">
            {printList.map(({ cls, st }) => (
              <div key={`${cls.classId}::${st.id}`} className="break-inside-avoid">
                <StudentIdCard student={st} cls={cls} lang={lang} o={printClass ? {} : o} stampGuide={stampGuide} />
              </div>
            ))}
          </div>
          <div className="print:hidden">
            {current ? (
              <div className="origin-center scale-[1.35] py-16">
                <StudentIdCard student={current.st} cls={current.cls} lang={lang} o={o} stampGuide={stampGuide} />
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
