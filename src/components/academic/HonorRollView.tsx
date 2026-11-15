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
import { KbachCorner, KhmerOrnament, PanelCard, printWithOrientation } from './KhmerDoc';

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
  const today = new Date();
  const [lunarDate, setLunarDate] = useState('ថ្ងៃ.........ខែ.............ឆ្នាំ.............ព.ស. ២៥.....');
  const [solarDate, setSolarDate] = useState(
    `${settings.address ? settings.address.split(',')[0] + ', ' : ''}ថ្ងៃទី${toKh(today.getDate())} ខែ${KH_MONTHS[today.getMonth()]} ឆ្នាំ${toKh(today.getFullYear())}`
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
    .filter((x) => x.r?.rank)
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
        <div className={`font-muol ${big ? 'text-2xl' : 'text-xl'} leading-none text-[#c0151b]`}>{toKh(item.r.rank!)}</div>
        <div
          className={`mt-1 overflow-hidden border-[3px] border-[#1d4ed8] bg-slate-100 shadow-md ${big ? 'h-[34mm] w-[27mm]' : 'h-[30mm] w-[24mm]'}`}
          style={{ outline: '1.5px solid #c9a227', outlineOffset: '2px' }}
        >
          {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] text-slate-400">រូបថត</div>}
        </div>
        <div className="mt-2 min-w-[42mm] rounded-full border-2 border-[#1d4ed8] bg-white px-4 py-0.5 text-center font-muol text-[12px] text-[#0b2a6f] shadow-sm">
          {item.st.name}
        </div>
        <div className="text-[10px] text-slate-600">មធ្យមភាគ {toKh(fmt(to10(item.r.average), 2))}</div>
      </div>
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
        <div className="mx-auto w-[210mm] bg-[#0b2a6f] p-[5mm] shadow-xl print:shadow-none" style={{ minHeight: '287mm' }}>
          <div className="relative h-full border-[3px] border-[#c9a227] p-[2mm]" style={{ minHeight: '277mm' }}>
            <div
              className="relative flex h-full flex-col border border-[#c9a227] px-[12mm] py-[10mm]"
              style={{ minHeight: '271mm', background: 'radial-gradient(circle at 50% 35%, #fffdf5 0%, #fbf3dc 60%, #f3e3b8 100%)' }}
            >
              <KbachCorner className="absolute left-1 top-1 h-16 w-16" />
              <KbachCorner className="absolute right-1 top-1 h-16 w-16 -scale-x-100" />
              <KbachCorner className="absolute bottom-1 left-1 h-16 w-16 -scale-y-100" />
              <KbachCorner className="absolute bottom-1 right-1 h-16 w-16 -scale-100" />

              <div className="flex items-start justify-between gap-4 text-[#0b2a6f]">
                <div className="flex flex-col items-center text-center">
                  <div className="font-muol text-[11px]">{settings.ministryDeptName || 'មន្ទីរអប់រំ យុវជន និងកីឡា'}</div>
                  {settings.eduOfficeName && <div className="font-muol text-[10.5px]">{settings.eduOfficeName}</div>}
                  <div className="font-muol text-[13px]">{settings.schoolNameKhmer}</div>
                  <div className="font-muol text-[11px]">{cls?.className}</div>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="font-muol text-[14px]">ព្រះរាជាណាចក្រកម្ពុជា</div>
                  <div className="font-muol text-[12px]">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
                  <KhmerOrnament color="#0b2a6f" />
                </div>
              </div>

              <div className="mt-4 text-center">
                <div className="font-muol text-[26px] leading-tight text-[#c0151b]" style={{ textShadow: '0 1px 0 #f3d27a' }}>
                  {title}
                </div>
                <div className="font-muol text-[14px] text-[#0b2a6f]">ឆ្នាំសិក្សា {toKh(settings.academicYear)}</div>
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

              <div className="mt-4 grid grid-cols-2 gap-6 text-center text-[11.5px] text-[#0b2a6f]">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HonorRollView;
