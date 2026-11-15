// តារាងកិត្តិយស — monthly / semester honor roll certificate with Khmer gold frame (A4 portrait).
import React, { useMemo, useState } from 'react';
import { Trophy, Printer, Upload, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  academicPeriods,
  activeStudents,
  classSubjects,
  computePeriodResults,
  fmt,
  KH_MONTHS,
  periodLabel,
  studentPhoto,
  to10,
  toKh,
} from '../../utils/academic';
import { KhmerOrnament, PanelCard, printWithOrientation } from './KhmerDoc';
import { KbachFrame, KbachFrameSwatch, KBACH_FRAMES, getFrame } from './KbachFrames';

/** Downscale an uploaded image to keep the synced data small. */
const readImage = (file: File, max = 420): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

const TEACHER_SIG_KEY = 'BIM_HONOR_TEACHER_SIGNATURES';

export const HonorRollView: React.FC = () => {
  const { orderedClassList, classData, subjects, settings, updateSettings, permissions } = useApp();
  const periods = useMemo(() => academicPeriods(settings.academicYear), [settings.academicYear]);
  const nowKey = `m-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [classId, setClassId] = useState(orderedClassList[0]?.classId || '');
  const [periodKey, setPeriodKey] = useState(periods.some((p) => p.key === nowKey) ? nowKey : periods[0].key);
  const [topN, setTopN] = useState(5);
  const frameId = settings.honorFrame || 'vine-gold';
  const ribbonLayout = getFrame(frameId).layout === 'ribbon';
  const today = new Date();
  const [lunarDate, setLunarDate] = useState('ថ្ងៃ.........ខែ.............ឆ្នាំ.............ព.ស. ២៥.....');
  const [solarDate, setSolarDate] = useState(
    `ធ្វើនៅ.................... ថ្ងៃទី${toKh(today.getDate())} ខែ${KH_MONTHS[today.getMonth()]} ឆ្នាំ${toKh(today.getFullYear())}`
  );
  const [teacherSigs, setTeacherSigs] = useState<{ [classId: string]: string }>(() => {
    try {
      return JSON.parse(localStorage.getItem(TEACHER_SIG_KEY) || '{}');
    } catch {
      return {};
    }
  });

  const cls = classData[classId] || orderedClassList[0];
  const subIds = classSubjects(cls, subjects).map((s) => s.id);
  const students = activeStudents(cls);
  const results = computePeriodResults(students, subIds, cls?.scores?.[periodKey]);
  const ranked = students
    .map((st) => ({ st, r: results[String(st.id)] }))
    // Only passing students (average ≥ 50/100, i.e. ≥ 5/10) can appear on the honor roll
    .filter((x) => x.r?.rank && (x.r.average ?? 0) >= 50)
    .sort((a, b) => (a.r.rank! - b.r.rank!))
    .slice(0, topN);

  // Pyramid rows: [1], [2,3], [4,5], then rows of 3
  const rows: typeof ranked[] = [];
  if (ranked.length) rows.push(ranked.slice(0, 1));
  if (ranked.length > 1) rows.push(ranked.slice(1, 3));
  if (ranked.length > 3) rows.push(ranked.slice(3, 5));
  for (let i = 5; i < ranked.length; i += 3) rows.push(ranked.slice(i, i + 3));

  const upload = async (e: React.ChangeEvent<HTMLInputElement>, kind: 'stamp' | 'teacher') => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return alert('ឯកសារធំពេក (អតិបរមា 5MB)');
    const url = await readImage(f);
    if (kind === 'stamp') updateSettings({ principalStampUrl: url });
    else {
      const next = { ...teacherSigs, [classId]: url };
      setTeacherSigs(next);
      try {
        localStorage.setItem(TEACHER_SIG_KEY, JSON.stringify(next));
      } catch {}
    }
  };

  const isMonth = periodKey.startsWith('m-');
  const title = isMonth ? `តារាងកិត្តិយសប្រចាំ${periodLabel(periodKey)}` : `តារាងកិត្តិយស${periodLabel(periodKey).replace('ប្រឡង', '')}`;

  const Card: React.FC<{ item: (typeof ranked)[number]; big?: boolean }> = ({ item, big }) => {
    const photo = studentPhoto(item.st);
    return (
      <div className="flex flex-col items-center">
        <div className={`font-muol ${big ? 'text-2xl' : 'text-xl'} leading-none text-[var(--title)]`}>{toKh(item.r.rank!)}</div>
        <div
          className={`mt-1 overflow-hidden border-[3px] border-[var(--ink)] bg-slate-100 shadow-md ${big ? 'h-[34mm] w-[27mm]' : 'h-[30mm] w-[24mm]'}`}
          style={{ outline: '1.5px solid #c9a227', outlineOffset: '2px' }}
        >
          {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] text-slate-400">រូបថត</div>}
        </div>
        <div className="mt-2 min-w-[42mm] rounded-full border-2 border-[var(--ink)] bg-white px-4 py-0.5 text-center font-muol text-[12px] text-[var(--ink)] shadow-sm">
          {item.st.name}
        </div>
        <div className="text-[10px] text-slate-600">មធ្យមភាគ {toKh(fmt(to10(item.r.average), 2))}</div>
      </div>
    );
  };

  // ── Ribbon layout (white page, gold vine frame): photo with gold rounded frame, medal + orange name ribbon ──
  const Medal: React.FC<{ rank: number; size?: number }> = ({ rank, size = 13 }) => (
    <div className="relative z-10 shrink-0" style={{ width: `${size}mm`, height: `${size + 4}mm` }}>
      <svg viewBox="0 0 40 52" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d="M10 30 L4 50 L12 45 L16 52 L20 32 Z" fill="#c8141c" />
        <path d="M30 30 L36 50 L28 45 L24 52 L20 32 Z" fill="#e0262e" />
        <circle cx="20" cy="20" r="18.5" fill="#ffffff" stroke="#e0161e" strokeWidth="3" />
        <circle cx="20" cy="20" r="14.5" fill="none" stroke="#f3c9a0" strokeWidth="1" />
      </svg>
      <div className="absolute left-0 right-0 top-0 flex items-center justify-center font-muol text-[#e0161e]" style={{ height: `${size}mm`, fontSize: `${size * 1.25}px` }}>
        {toKh(rank)}
      </div>
    </div>
  );

  const RibbonCard: React.FC<{ item: (typeof ranked)[number]; small?: boolean }> = ({ item, small }) => {
    const photo = studentPhoto(item.st);
    const w = small ? 30 : 38;
    const h = small ? 34 : 42;
    return (
      <div className="flex flex-col items-center">
        <div
          className="rounded-[14px] p-[3px] shadow-md"
          style={{ width: `${w}mm`, height: `${h}mm`, background: 'linear-gradient(160deg,#8a5a12 0%,#f3d27a 35%,#fff1b8 50%,#c99a3b 70%,#7a4e0e 100%)' }}
        >
          <div className="h-full w-full overflow-hidden rounded-[11px] bg-white">
            {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : null}
          </div>
        </div>
        <div className="relative -mt-[3mm] flex items-center" style={{ width: `${w + 16}mm` }}>
          <Medal rank={item.r.rank!} size={small ? 10 : 12} />
          <div
            className="-ml-[4mm] flex h-[9mm] flex-1 items-center justify-center rounded-r-full pl-[5mm] pr-3 font-khmer font-bold text-white shadow"
            style={{ background: 'linear-gradient(180deg,#f9a63a 0%,#f08a12 100%)', fontSize: small ? '13px' : '16px' }}
          >
            <span className="-my-[0.5em] truncate py-[0.5em]">{item.st.name}</span>
          </div>
        </div>
      </div>
    );
  };

  const shortClass = (cls?.className || '').split(' (')[0];
  const periodText = isMonth ? `ប្រចាំ${periodLabel(periodKey)}` : `ប្រចាំ${periodLabel(periodKey).replace('ប្រឡង', '')}`;
  const RibbonContent = () => {
    const [first, second, third, ...rest] = ranked;
    return (
      <>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col items-center text-center">
            {settings.schoolLogo ? (
              <img src={settings.schoolLogo} alt="" className="h-[18mm] w-[18mm] object-contain" />
            ) : (
              <div className="flex h-[16mm] w-[16mm] items-center justify-center rounded-full border-2 border-[var(--title)] text-2xl">🎓</div>
            )}
            <div className="font-muol text-[13px] leading-tight text-[var(--title)]">{settings.schoolNameKhmer}</div>
            {settings.schoolNameEnglish && <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--title)]">{settings.schoolNameEnglish}</div>}
          </div>
          <div className="flex flex-col items-center pt-1 text-center text-[var(--ink)]">
            <div className="font-muol text-[15px]">ព្រះរាជាណាចក្រកម្ពុជា</div>
            <div className="font-muol text-[13px]">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
            <KhmerOrnament color="#b8862b" />
          </div>
        </div>

        <div className="mt-2 text-center">
          <div className="font-muol text-[46px] leading-[1.5] text-[var(--title)]" style={{ textShadow: '2px 2px 0 #fff, 3px 3px 2px rgba(138,75,15,0.25)' }}>
            តារាងកិត្តិយស
          </div>
          <div className="font-muol text-[19px] text-[#c2410c]">សិស្សពូកែ{shortClass}</div>
          <div className="font-muol text-[19px] text-[#c2410c]">
            {periodText} ឆ្នាំសិក្សា{toKh(settings.academicYear)}
          </div>
        </div>

        <div className="relative mt-6 flex-1">
          <div className="grid grid-cols-3 items-start">
            <div className="flex justify-center pt-[38mm]">{second && <RibbonCard item={second} />}</div>
            <div className="flex justify-center">{first && <RibbonCard item={first} />}</div>
            <div className="flex justify-center pt-[38mm]">{third && <RibbonCard item={third} />}</div>
          </div>
          {rest.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-y-5">
              {rest.map((item) => (
                <div key={item.st.id} className="flex justify-center">
                  <RibbonCard item={item} small />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <div className="flex flex-col items-center text-center text-[13px] text-[#1f3b70]">
            <div>{lunarDate}</div>
            <div>{solarDate}</div>
            <div className="font-muol text-[14px] text-[#1e40af]">នាយកសាលា</div>
            <div className="relative h-16 w-40">
              {settings.principalStampUrl && <img src={settings.principalStampUrl} alt="" className="absolute inset-0 m-auto h-20 object-contain" />}
            </div>
            <div className="font-muol text-[13px] text-[#1e40af]">{settings.directorName}</div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="grid gap-4 font-khmer lg:grid-cols-[360px_1fr] print:block">
      {/* ── Controls ── */}
      <div className="space-y-3 print:hidden">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Trophy className="h-6 w-6 text-amber-500" /> តារាងកិត្តិយស
        </h1>
        <PanelCard title="ជ្រើសរើស">
          <div className="space-y-2">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              {orderedClassList.map((c) => (
                <option key={c.classId} value={c.classId}>
                  {c.className}
                </option>
              ))}
            </select>
            <select value={periodKey} onChange={(e) => setPeriodKey(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              {periods.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.labelKh}
                </option>
              ))}
            </select>
            <label className="flex items-center justify-between text-sm">
              ចំនួនសិស្សពូកែ
              <select value={topN} onChange={(e) => setTopN(Number(e.target.value))} className="rounded-lg border border-slate-200 px-2 py-1">
                {[3, 5, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {toKh(n)} នាក់
                  </option>
                ))}
              </select>
            </label>
            {!ranked.length && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">មិនទាន់មានពិន្ទុសម្រាប់ខែនេះទេ។ សូមបញ្ចូលពិន្ទុនៅ «គ្រប់គ្រងពិន្ទុសិស្ស»។</p>}
          </div>
        </PanelCard>

        <PanelCard title="ស៊ុមក្បាច់ខ្មែរ (Kbach Frame)">
          <div className="grid grid-cols-3 gap-1">
            {KBACH_FRAMES.map((f) => (
              <KbachFrameSwatch key={f.id} frameId={f.id} active={frameId === f.id} onClick={() => updateSettings({ honorFrame: f.id })} />
            ))}
          </div>
        </PanelCard>

        <PanelCard title="ត្រា & ហត្ថលេខា (Stamp & Signatures)">
          <div className="space-y-2 text-sm">
            {(
              [
                ['stamp', 'ត្រា & ហត្ថលេខានាយក', settings.principalStampUrl],
                ['teacher', 'ហត្ថលេខាគ្រូបន្ទុកថ្នាក់', teacherSigs[classId]],
              ] as const
            ).map(([kind, label, url]) => (
              <div key={kind} className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 p-2">
                {url ? <img src={url} alt="" className="h-10 w-10 object-contain" /> : <Upload className="h-5 w-5 text-slate-400" />}
                <label className="flex-1 cursor-pointer text-indigo-700">
                  Upload {label}
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" disabled={!permissions.canEdit} onChange={(e) => upload(e, kind)} />
                </label>
                {url && (
                  <button
                    onClick={() => {
                      if (kind === 'stamp') updateSettings({ principalStampUrl: '' });
                      else {
                        const next = { ...teacherSigs };
                        delete next[classId];
                        setTeacherSigs(next);
                        localStorage.setItem(TEACHER_SIG_KEY, JSON.stringify(next));
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </button>
                )}
              </div>
            ))}
            <p className="text-[11px] text-slate-500">PNG ផ្ទៃថ្លា (Transparent) ល្អបំផុត</p>
          </div>
        </PanelCard>

        <PanelCard title="កាលបរិច្ឆេទទាំងពីរ (Lunar & Solar Dates)">
          <label className="block text-xs text-slate-600">
            ថ្ងៃខែឆ្នាំ ចន្ទគតិ
            <input value={lunarDate} onChange={(e) => setLunarDate(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
          </label>
          <label className="mt-2 block text-xs text-slate-600">
            ថ្ងៃខែឆ្នាំ សុរិយគតិ
            <input value={solarDate} onChange={(e) => setSolarDate(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
          </label>
        </PanelCard>

        <button onClick={() => printWithOrientation('portrait')} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 text-sm font-bold text-white shadow">
          <Printer className="h-4 w-4" /> បោះពុម្ពតារាងកិត្តិយស (A4)
        </button>
      </div>

      {/* ── Certificate ── */}
      <div className="overflow-x-auto rounded-2xl bg-slate-100 p-4 print:overflow-visible print:bg-white print:p-0">
        <div className="mx-auto w-[210mm] shadow-xl [zoom:0.62] xl:[zoom:0.8] print:shadow-none print:[zoom:1]">
          <KbachFrame frameId={frameId}>
            {ribbonLayout ? (
              <RibbonContent />
            ) : (
            <>
              <div className="flex items-start justify-between gap-4 text-[var(--ink)]">
                <div className="flex flex-col items-center text-center">
                  <div className="font-muol text-[11px]">{settings.ministryDeptName || 'មន្ទីរអប់រំ យុវជន និងកីឡា'}</div>
                  {settings.eduOfficeName && <div className="font-muol text-[10.5px]">{settings.eduOfficeName}</div>}
                  <div className="font-muol text-[13px]">{settings.schoolNameKhmer}</div>
                  <div className="font-muol text-[11px]">{cls?.className}</div>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="font-muol text-[14px]">ព្រះរាជាណាចក្រកម្ពុជា</div>
                  <div className="font-muol text-[12px]">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
                  <KhmerOrnament color="var(--ink)" />
                </div>
              </div>

              <div className="mt-4 text-center">
                <div className="font-muol text-[26px] leading-tight text-[var(--title)]" style={{ textShadow: '0 1px 0 rgba(243,210,122,0.8)' }}>
                  {title}
                </div>
                <div className="font-muol text-[14px] text-[var(--ink)]">ឆ្នាំសិក្សា {toKh(settings.academicYear)}</div>
                <KhmerOrnament className="mt-1" color="#b8860b" />
              </div>

              <div className="mt-4 flex flex-1 flex-col justify-center gap-5">
                {rows.map((row, i) => (
                  <div key={i} className={`flex ${row.length === 1 ? 'justify-center' : row.length === 2 ? 'justify-between px-[8mm]' : 'justify-around'}`}>
                    {row.map((item) => (
                      <Card key={item.st.id} item={item} big={item.r.rank === 1} />
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-6 text-center text-[11.5px] text-[var(--ink)]">
                <div className="flex flex-col items-center justify-end">
                  <div className="font-muol text-[12px]">គ្រូបន្ទុកថ្នាក់</div>
                  <div className="relative h-14 w-36">
                    {teacherSigs[classId] && <img src={teacherSigs[classId]} alt="" className="absolute inset-0 m-auto h-14 object-contain" />}
                  </div>
                  <div className="font-muol text-[12px]">{cls?.homeroomTeacher}</div>
                </div>
                <div className="flex flex-col items-center">
                  <div>{lunarDate}</div>
                  <div>{solarDate}</div>
                  <div className="font-muol text-[12px]">នាយកសាលា</div>
                  <div className="relative h-14 w-36">
                    {settings.principalStampUrl && <img src={settings.principalStampUrl} alt="" className="absolute inset-0 m-auto h-16 object-contain" />}
                  </div>
                  <div className="font-muol text-[12px]">{settings.directorName}</div>
                </div>
              </div>
            </>
            )}
          </KbachFrame>
        </div>
      </div>
    </div>
  );
};

export default HonorRollView;
