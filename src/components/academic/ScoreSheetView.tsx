// បញ្ជីស្រង់ពិន្ទុសិស្ស — monthly / semester score sheet with grades (A–F) and ranks.
import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Printer, Settings2, ListOrdered, CheckSquare, Scale } from 'lucide-react';
import type { GradeDef } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  academicPeriods,
  activeStudents,
  classSubjects,
  computePeriodResults,
  defaultSubjectIdsForClass,
  fmt,
  gradeLetter,
  gradeRemark,
  getGradeScale,
  DEFAULT_GRADE_SCALE,
  scaleAvg,
  subjectCfg,
  toPct,
  periodLabel,
  subjectLabel,
  toKh,
} from '../../utils/academic';
import { KhmerDocHeader, KhmerSignatureBlock, PanelCard, printWithOrientation } from './KhmerDoc';

const GRADE_STYLE: { [k: string]: string } = {
  A: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  B: 'border-sky-300 bg-sky-50 text-sky-700',
  C: 'border-amber-300 bg-amber-50 text-amber-700',
  D: 'border-orange-300 bg-orange-50 text-orange-700',
  E: 'border-rose-200 bg-rose-50 text-rose-600',
  F: 'border-rose-400 bg-rose-100 text-rose-800',
  '-': 'border-slate-200 bg-white text-slate-400',
};

export const GradeBadge: React.FC<{ g: string }> = ({ g }) => (
  <span
    className={`inline-flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-bold print:h-auto print:w-auto print:border-0 print:bg-transparent print:text-black ${GRADE_STYLE[g] || GRADE_STYLE['-']}`}
  >
    {g}
  </span>
);

export const ScoreSheetView: React.FC = () => {
  const { orderedClassList, classData, subjects, settings, updateSettings, updateClassAcademic, permissions, currentUser } = useApp();
  // Teachers enter scores for their own classes (orderedClassList is already limited to them)
  const canScore = permissions.canEdit || currentUser.role === 'teacher';
  const [entryMode, setEntryMode] = useState<'quick' | 'sheet'>(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'quick' : 'sheet'));
  const [quickSubject, setQuickSubject] = useState<string>('');
  const periods = useMemo(() => academicPeriods(settings.academicYear), [settings.academicYear]);
  const nowKey = `m-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const [classId, setClassId] = useState<string>(orderedClassList[0]?.classId || '');
  const [periodKey, setPeriodKey] = useState<string>(periods.some((p) => p.key === nowKey) ? nowKey : periods[0].key);
  const [sortByRank, setSortByRank] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showHeaderEdit, setShowHeaderEdit] = useState(false);

  useEffect(() => {
    if (!classData[classId] && orderedClassList[0]) setClassId(orderedClassList[0].classId);
  }, [classData, classId, orderedClassList]);

  const cls = classData[classId];
  const subs = classSubjects(cls, subjects);
  const subIds = subs.map((s) => s.id);
  const students = activeStudents(cls);
  const periodScores = cls?.scores?.[periodKey];
  const results = useMemo(() => computePeriodResults(students, subIds, periodScores, cls), [students, subIds.join(), periodScores, cls?.subjectConfig]);
  const outOf = settings.averageOutOf || 100;
  const scale = getGradeScale();
  const cfg = (sid: string) => subjectCfg(cls, sid);
  const [showScoring, setShowScoring] = useState(false);
  const [scaleDraft, setScaleDraft] = useState<GradeDef[] | null>(null);
  const setSubjectCfg = (sid: string, patch: { max?: number; coef?: number }) =>
    updateClassAcademic(classId, (c) => ({ subjectConfig: { ...(c.subjectConfig || {}), [sid]: { ...(c.subjectConfig?.[sid] || {}), ...patch } } }));

  const rows = useMemo(() => {
    const list = [...students];
    if (sortByRank) list.sort((a, b) => (results[a.id]?.rank ?? 9999) - (results[b.id]?.rank ?? 9999));
    return list;
  }, [students, results, sortByRank]);

  const setScore = (studentId: number, subjectId: string, raw: string) => {
    const v = raw.trim() === '' ? null : Math.max(0, Math.min(subjectCfg(cls, subjectId).max, Number(raw)));
    if (v !== null && Number.isNaN(v)) return;
    updateClassAcademic(classId, (c) => {
      const book = { ...(c.scores || {}) };
      const period = { ...(book[periodKey] || {}) };
      period[String(studentId)] = { ...(period[String(studentId)] || {}), [subjectId]: v };
      book[periodKey] = period;
      // stamp the cell so another device editing other cells does not overwrite it
      const stamps = { ...(c.scoresT || {}) };
      const pT = { ...(stamps[periodKey] || {}) };
      pT[String(studentId)] = { ...(pT[String(studentId)] || {}), [subjectId]: Date.now() };
      stamps[periodKey] = pT;
      return { scores: book, scoresT: stamps };
    });
  };

  const toggleSubject = (id: string) => {
    const current = cls?.subjectIds?.length ? cls.subjectIds : defaultSubjectIdsForClass(cls, subjects);
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    updateClassAcademic(classId, () => ({ subjectIds: next }));
  };

  // Move to the next input with Enter (fast data entry, column-wise)
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const next = document.querySelector<HTMLInputElement>(`input[data-cell="${r + 1}-${c}"]`);
    next?.focus();
    next?.select();
  };

  const classAvg = (() => {
    const v = Object.values(results).map((r) => r.average).filter((x): x is number => x !== null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  })();
  const dist = scale.map((g) => ({
    g: g.letter,
    n: Object.values(results).filter((r) => gradeLetter(r.average) === g.letter).length,
  }));

  const isMonth = periodKey.startsWith('m-');
  const title = isMonth ? `បញ្ជីស្រង់ពិន្ទុសិស្សប្រចាំ${periodLabel(periodKey)}` : `បញ្ជីស្រង់ពិន្ទុ${periodLabel(periodKey)}`;

  if (!cls) {
    return <div className="p-8 text-center font-khmer text-slate-500">មិនទាន់មានថ្នាក់រៀនទេ</div>;
  }

  return (
    <div className="space-y-4 font-khmer">
      {/* ── Controls (screen only) ── */}
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <BookOpen className="h-6 w-6 text-indigo-600" /> គ្រប់គ្រងពិន្ទុសិស្ស
          </h1>
          <p className="text-xs text-slate-500">បញ្ចូលពិន្ទុ (០–១០០) · គណនាមធ្យមភាគ និទ្ទេស និងចំណាត់ថ្នាក់ដោយស្វ័យប្រវត្ត</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            {orderedClassList.map((c) => (
              <option key={c.classId} value={c.classId}>
                {c.className}
              </option>
            ))}
          </select>
          <select value={periodKey} onChange={(e) => setPeriodKey(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            {periods.map((p) => (
              <option key={p.key} value={p.key}>
                {p.labelKh}
              </option>
            ))}
          </select>
          <button onClick={() => setSortByRank((v) => !v)} className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-sm ${sortByRank ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700'}`}>
            <ListOrdered className="h-4 w-4" /> {sortByRank ? 'តម្រៀបតាមចំណាត់ថ្នាក់' : 'តម្រៀបតាមបញ្ជី'}
          </button>
          {permissions.canEdit && (
            <button onClick={() => { setShowScoring((v) => !v); setScaleDraft(null); }} className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-sm ${showScoring ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700'}`}>
              <Scale className="h-4 w-4" /> មេគុណ & និទ្ទេស
            </button>
          )}
          <button onClick={() => setShowSubjectPicker((v) => !v)} className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <CheckSquare className="h-4 w-4" /> មុខវិជ្ជា ({toKh(subs.length)})
          </button>
          {permissions.canEdit && (
            <button onClick={() => setShowHeaderEdit((v) => !v)} className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <Settings2 className="h-4 w-4" /> ក្បាលឯកសារ
            </button>
          )}
          <button onClick={() => printWithOrientation('landscape')} className="flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow">
            <Printer className="h-4 w-4" /> បោះពុម្ព A4
          </button>
        </div>
      </div>

      {showSubjectPicker && (
        <PanelCard title={`មុខវិជ្ជាសម្រាប់ ${cls.className}`}>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => {
              const on = subIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  disabled={!permissions.canEdit}
                  onClick={() => toggleSubject(s.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${on ? 'border-indigo-400 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
                >
                  {subjectLabel(s)}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">បន្ថែម/កែមុខវិជ្ជាថ្មីនៅ «គ្រប់គ្រងគ្រូបង្រៀន ➔ មុខវិជ្ជា»</p>
        </PanelCard>
      )}

      {showScoring && permissions.canEdit && (
        <PanelCard title={`ពិន្ទុខ្ពស់បំផុត & មេគុណ · ${cls.className}`}>
          <div className="overflow-x-auto">
            <table data-no-cards className="w-full min-w-[420px] text-xs">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-1 pr-2">មុខវិជ្ជា</th>
                  <th className="py-1 pr-2">ពិន្ទុខ្ពស់បំផុត</th>
                  <th className="py-1 pr-2">មេគុណ</th>
                  <th className="py-1">ពិន្ទុសរុបអតិបរមា</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((x) => {
                  const c = cfg(x.id);
                  return (
                    <tr key={x.id} className="border-t border-slate-100">
                      <td className="py-1.5 pr-2 font-bold text-slate-800">{subjectLabel(x)}</td>
                      <td className="py-1.5 pr-2">
                        <input type="number" min={1} value={c.max} onChange={(e) => setSubjectCfg(x.id, { max: Math.max(1, Number(e.target.value) || 100) })} className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-center font-mono" />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input type="number" min={0.5} step={0.5} value={c.coef} onChange={(e) => setSubjectCfg(x.id, { coef: Math.max(0.5, Number(e.target.value) || 1) })} className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center font-mono" />
                      </td>
                      <td className="py-1.5 font-mono text-slate-600">{fmt(c.max * c.coef, 1)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-slate-200 font-bold">
                  <td className="py-1.5">សរុប</td>
                  <td />
                  <td className="py-1.5 font-mono">{fmt(subs.reduce((a, x) => a + cfg(x.id).coef, 0), 1)}</td>
                  <td className="py-1.5 font-mono">{fmt(subs.reduce((a, x) => a + cfg(x.id).max * cfg(x.id).coef, 0), 1)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">មធ្យមភាគ = Σ(ពិន្ទុ ÷ ពិន្ទុខ្ពស់បំផុត × មេគុណ) ÷ Σមេគុណ · ចំណាត់ថ្នាក់តាមមធ្យមភាគ (ពិន្ទុស្មើ = ចំណាត់ថ្នាក់ដូចគ្នា)</p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold text-slate-700">និទ្ទេស & មូលវិចារណ៍ (ប្រើគ្រប់ថ្នាក់)</div>
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              បង្ហាញមធ្យមភាគលើ
              <select value={outOf} onChange={(e) => updateSettings({ averageOutOf: Number(e.target.value) })} className="rounded-lg border border-slate-200 px-2 py-1">
                {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          {(() => {
            const draft = scaleDraft || scale.map((g) => ({ ...g }));
            const upd = (i: number, patch: Partial<GradeDef>) => setScaleDraft(draft.map((g, j) => (j === i ? { ...g, ...patch } : g)));
            return (
              <div className="mt-2 space-y-1.5">
                {draft.map((g, i) => (
                  <div key={i} className="grid grid-cols-[3rem_4.5rem_1fr] gap-1.5 sm:grid-cols-[3rem_4.5rem_8rem_1fr_2rem]">
                    <input value={g.letter} onChange={(e) => upd(i, { letter: e.target.value })} className="rounded-lg border border-slate-200 px-1 py-1 text-center text-xs font-bold" />
                    <label className="flex items-center gap-1 text-[11px] text-slate-500">≥<input type="number" min={0} max={100} value={g.min} onChange={(e) => upd(i, { min: Number(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-200 px-1 py-1 text-center font-mono text-xs" />%</label>
                    <input value={g.kh} onChange={(e) => upd(i, { kh: e.target.value })} placeholder="និទ្ទេស" className="rounded-lg border border-slate-200 px-2 py-1 text-xs" />
                    <input value={g.remark || ''} onChange={(e) => upd(i, { remark: e.target.value })} placeholder="មូលវិចារណ៍" className="col-span-3 rounded-lg border border-slate-200 px-2 py-1 text-xs sm:col-span-1" />
                    <button type="button" onClick={() => setScaleDraft(draft.filter((_, j) => j !== i))} disabled={draft.length <= 2} className="hidden rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 sm:block">✕</button>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 pt-1 text-xs">
                  <button type="button" onClick={() => setScaleDraft([...draft, { letter: '?', min: 0, kh: '', remark: '' }])} className="rounded-lg border border-slate-200 px-2.5 py-1">+ បន្ថែមកម្រិត</button>
                  <button type="button" onClick={() => setScaleDraft(DEFAULT_GRADE_SCALE.map((g) => ({ ...g })))} className="rounded-lg border border-slate-200 px-2.5 py-1">↺ លំនាំដើម</button>
                  {scaleDraft && (
                    <button type="button" onClick={() => { updateSettings({ gradeScale: [...scaleDraft].sort((a, b) => b.min - a.min) }); setScaleDraft(null); }} className="rounded-lg bg-indigo-600 px-3 py-1 font-bold text-white">រក្សាទុកនិទ្ទេស</button>
                  )}
                </div>
              </div>
            );
          })()}
        </PanelCard>
      )}

      {showHeaderEdit && (
        <PanelCard title="ក្បាលឯកសារផ្លូវការ (ប្រើគ្រប់ឯកសារសិក្សា)">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-slate-600">
              មន្ទីរ
              <input
                defaultValue={settings.ministryDeptName || ''}
                onBlur={(e) => updateSettings({ ministryDeptName: e.target.value })}
                placeholder="មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្ត..."
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs text-slate-600">
              ការិយាល័យ
              <input
                defaultValue={settings.eduOfficeName || ''}
                onBlur={(e) => updateSettings({ eduOfficeName: e.target.value })}
                placeholder="ការិយាល័យ អ.យ.ក នៃរដ្ឋបាលស្រុក..."
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
            </label>
          </div>
        </PanelCard>
      )}

      {/* ── Stats (screen only) ── */}
      <div className="flex flex-wrap gap-2 text-xs print:hidden">
        <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5">សិស្ស៖ <b>{toKh(students.length)}</b> នាក់</span>
        <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5">មធ្យមភាគថ្នាក់៖ <b className="font-mono text-indigo-700">{fmt(scaleAvg(classAvg, outOf))}/{outOf}</b></span>
        {dist.map((d) => (
          <span key={d.g} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1">
            <GradeBadge g={d.g} /> {toKh(d.n)}
          </span>
        ))}
      </div>

      {/* ── Entry mode: quick (one subject, big inputs — phones) or the full sheet ── */}
      <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold print:hidden">
        {([['quick', 'បញ្ចូលតាមមុខវិជ្ជា'], ['sheet', 'តារាងពេញ']] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setEntryMode(k)} className={`flex-1 rounded-lg py-2 ${entryMode === k ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'}`}>{l}</button>
        ))}
      </div>

      {entryMode === 'quick' && (() => {
        const sid = subIds.includes(quickSubject) ? quickSubject : subIds[0];
        const sub = subs.find((x) => x.id === sid);
        const filled = students.filter((st) => periodScores?.[String(st.id)]?.[sid] != null).length;
        return (
          <div className="space-y-3 print:hidden">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {subs.map((x) => {
                const n = students.filter((st) => periodScores?.[String(st.id)]?.[x.id] != null).length;
                return (
                  <button key={x.id} type="button" onClick={() => setQuickSubject(x.id)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${x.id === sid ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>
                    {subjectLabel(x)} <span className="opacity-70">{toKh(n)}/{toKh(students.length)}</span>
                  </button>
                );
              })}
            </div>
            {!sub ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">ថ្នាក់នេះមិនទាន់មានមុខវិជ្ជា</div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 bg-indigo-50/60 px-3 py-2 text-xs">
                  <b className="text-indigo-900">{subjectLabel(sub)} · {periodLabel(periodKey)} <span className="font-normal text-slate-500">(/{cfg(sid).max}{cfg(sid).coef !== 1 ? ` · មេគុណ ${cfg(sid).coef}` : ''})</span></b>
                  <span className="text-slate-500">បានបញ្ចូល {toKh(filled)}/{toKh(students.length)}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {rows.map((st, r) => {
                    const v = periodScores?.[String(st.id)]?.[sid];
                    return (
                      <label key={st.id} className="flex items-center gap-3 px-3 py-2">
                        <span className="w-6 shrink-0 text-center font-mono text-xs text-slate-400">{r + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-slate-900">{st.name}</span>
                          <span className="block text-[10px] text-slate-400">{st.studentCode}</span>
                        </span>
                        <GradeBadge g={gradeLetter(toPct(v, cfg(sid).max))} />
                        <input
                          data-quick={r}
                          type="number"
                          inputMode="decimal"
                          enterKeyHint="next"
                          min={0}
                          max={cfg(sid).max}
                          disabled={!canScore}
                          value={v ?? ''}
                          onChange={(e) => setScore(st.id, sid, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter') return;
                            e.preventDefault();
                            const next = document.querySelector<HTMLInputElement>(`input[data-quick="${r + 1}"]`);
                            next?.focus();
                            next?.select();
                          }}
                          onFocus={(e) => e.target.select()}
                          placeholder="—"
                          className="h-11 w-20 shrink-0 rounded-xl border border-slate-200 text-center font-mono text-lg font-bold focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <p className="text-[11px] text-slate-500">ពិន្ទុ ០–{toKh(cfg(sid).max)} · ចុច «Next/Enter» លើក្តារចុច ដើម្បីទៅសិស្សបន្ទាប់ · រក្សាទុកដោយស្វ័យប្រវត្តិ</p>
          </div>
        );
      })()}

      {/* ── Printable sheet ── */}
      <div className={`overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:block print:overflow-visible print:rounded-none print:border-0 print:p-0 print:shadow-none ${entryMode === 'quick' ? 'hidden' : ''}`}>
        <KhmerDocHeader
          title={title}
          subtitle={
            <>
              <div>សិស្សានុសិស្ស{settings.schoolNameKhmer}</div>
              <div>សម្រាប់ឆ្នាំសិក្សា {toKh(settings.academicYear)}</div>
            </>
          }
          badge={cls.className}
        />

        <table className="mt-4 w-full border-collapse text-[12px] print:text-[10.5px]">
          <thead>
            <tr className="bg-[#fdf3dc] text-slate-900 print:bg-[#fdf3dc]">
              <th rowSpan={2} className="border border-slate-400 px-1 py-1 w-8">លរ</th>
              <th rowSpan={2} className="border border-slate-400 px-2 py-1 min-w-[120px]">គោត្តនាម-នាម</th>
              <th rowSpan={2} className="border border-slate-400 px-1 py-1">អត្តលេខ</th>
              {subs.map((s) => (
                <th key={s.id} colSpan={3} className="border border-slate-400 px-1 py-1 font-muol text-[11px] font-normal">
                  {subjectLabel(s)}
                  <div className="font-khmer text-[9px] text-slate-500">({toKh(cfg(s.id).max)} ពិន្ទុ{cfg(s.id).coef !== 1 ? ` · មេគុណ ${toKh(cfg(s.id).coef)}` : ''})</div>
                </th>
              ))}
              <th rowSpan={2} className="border border-slate-400 px-1 py-1">សរុប</th>
              <th rowSpan={2} className="border border-slate-400 bg-indigo-50 px-1 py-1">មធ្យមភាគ<div className="text-[9px] font-normal text-slate-500">(/{toKh(outOf)})</div></th>
              <th rowSpan={2} className="border border-slate-400 px-1 py-1">និទ្ទេស</th>
              <th rowSpan={2} className="border border-slate-400 px-1 py-1">ចំណាត់ថ្នាក់</th>
              <th rowSpan={2} className="border border-slate-400 px-1 py-1 min-w-[120px]">មូលវិចារណ៍</th>
            </tr>
            <tr className="bg-[#fdf3dc] text-[10px] text-slate-700">
              {subs.map((s) => (
                <React.Fragment key={s.id}>
                  <th className="border border-slate-400 px-1">ពិន្ទុ</th>
                  <th className="border border-slate-400 px-1">និទ្ទេស</th>
                  <th className="border border-slate-400 px-1">ច.ថ្នាក់</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((st, r) => {
              const res = results[st.id];
              const row = periodScores?.[String(st.id)] || {};
              return (
                <tr key={st.id} className="odd:bg-white even:bg-slate-50/60 print:even:bg-white">
                  <td className="border border-slate-300 text-center">{toKh(r + 1)}</td>
                  <td className="border border-slate-300 px-2 font-semibold whitespace-nowrap">{st.name}</td>
                  <td className="border border-slate-300 px-1 text-center font-mono text-[10.5px]">{st.studentCode}</td>
                  {subs.map((s, c) => {
                    const v = row[s.id];
                    const rank = res?.subjectRank[s.id];
                    return (
                      <React.Fragment key={s.id}>
                        <td className="border border-slate-300 px-0.5 text-center">
                          <input
                            data-cell={`${r}-${c}`}
                            type="number"
                            min={0}
                            max={cfg(s.id).max}
                            disabled={!canScore}
                            value={v ?? ''}
                            onChange={(e) => setScore(st.id, s.id, e.target.value)}
                            onKeyDown={(e) => onKeyDown(e, r, c)}
                            className="w-12 rounded border border-slate-200 px-1 py-0.5 text-center font-mono print:hidden"
                          />
                          <span className="hidden font-mono print:inline">{v ?? ''}</span>
                        </td>
                        <td className="border border-slate-300 text-center">
                          <GradeBadge g={gradeLetter(toPct(v, cfg(s.id).max))} />
                        </td>
                        <td className={`border border-slate-300 text-center ${rank && rank <= 3 ? 'font-bold text-amber-700' : 'text-slate-600'}`}>
                          {rank ? toKh(rank) : ''}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className="border border-slate-300 text-center font-bold">{res?.total !== null ? fmt(res.total, 1) : ''}{res?.totalMax ? <div className="text-[9px] font-normal text-slate-400">/{fmt(res.totalMax, 1)}</div> : null}</td>
                  <td className="border border-slate-300 bg-indigo-50/60 text-center font-mono font-bold text-indigo-800 print:bg-white print:text-black">
                    {res?.average !== null ? fmt(scaleAvg(res.average, outOf), 2) : ''}
                  </td>
                  <td className="border border-slate-300 text-center">
                    <GradeBadge g={gradeLetter(res?.average)} />
                  </td>
                  <td className="border border-slate-300 text-center font-bold text-rose-700 print:text-black">{res?.rank ? toKh(res.rank) : ''}</td>
                  <td className="border border-slate-300 px-1.5 text-[11px] text-slate-700">{res?.average !== null ? gradeRemark(res?.average) : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-2 flex flex-wrap gap-x-4 text-[10.5px] text-slate-600">
          {scale.map((g, i) => (
            <span key={g.letter + i}>
              {g.letter} = {g.kh} ({toKh(g.min)}{i === 0 ? '-១០០' : `-${toKh(Number((scale[i - 1].min - 0.01).toFixed(2)))}`}%)
            </span>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-8 break-inside-avoid">
          <KhmerSignatureBlock role="បានឃើញ និងឯកភាព នាយកសាលា" name={settings.directorName} showDates={false} />
          <KhmerSignatureBlock role="គ្រូបន្ទុកថ្នាក់" name={cls.homeroomTeacher} />
        </div>
      </div>
    </div>
  );
};

export default ScoreSheetView;
