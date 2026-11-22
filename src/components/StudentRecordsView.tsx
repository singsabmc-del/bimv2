// Student records — evaluation, counselling, student/guardian agreement, parent invitation letter
// and call notes. One shared-store key per record (BIM_STUDENT_REC_<id>) so several devices can
// add records at the same time without overwriting each other.
// Teachers see students of their own classes (classData is already scoped); Admin sees all.
// Confidential counselling notes are visible only to their author and Admin.
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { StudentCareRecord, StudentFeeRecord, StudentRecordType } from '../types';
import {
  ClipboardList,
  Edit3,
  FileSignature,
  HeartHandshake,
  Lock,
  Mail,
  PhoneCall,
  Plus,
  Printer,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';

export const REC_PREFIX = 'BIM_STUDENT_REC_';

const TYPES: Record<StudentRecordType, { kh: string; Icon: any; cls: string }> = {
  evaluation: { kh: 'រង្វាយតម្លៃ', Icon: Star, cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  counseling: { kh: 'ប្រឹក្សាសិស្ស', Icon: HeartHandshake, cls: 'bg-rose-50 text-rose-800 border-rose-200' },
  contract: { kh: 'កិច្ចសន្យា', Icon: FileSignature, cls: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  invitation: { kh: 'លិខិតអញ្ជើញ', Icon: Mail, cls: 'bg-sky-50 text-sky-800 border-sky-200' },
  call: { kh: 'Call note', Icon: PhoneCall, cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
};
const TYPE_ORDER: StudentRecordType[] = ['evaluation', 'counseling', 'contract', 'invitation', 'call'];

export const CRITERIA: { key: string; kh: string }[] = [
  { key: 'study', kh: 'ការសិក្សា' },
  { key: 'behaviour', kh: 'អាកប្បកិរិយា' },
  { key: 'discipline', kh: 'វិន័យ' },
  { key: 'participation', kh: 'ការចូលរួម' },
  { key: 'social', kh: 'ទំនាក់ទំនងជាមួយមិត្ត' },
  { key: 'hygiene', kh: 'អនាម័យ' },
];
const SCORE_KH = ['', 'ខ្សោយ', 'មធ្យម', 'ល្អបង្គួរ', 'ល្អ', 'ល្អប្រសើរ'];
const OUTCOME_KH: Record<NonNullable<StudentCareRecord['outcome']>, string> = {
  answered: 'បានលើក',
  no_answer: 'មិនលើក',
  busy: 'ជាប់រវល់',
  wrong_number: 'លេខខុស',
};
const DEFAULT_COMMITMENTS = [
  'មករៀនឱ្យទាន់ម៉ោង និងទៀងទាត់',
  'ធ្វើកិច្ចការផ្ទះ និងកិច្ចការសាលាឱ្យបានគ្រប់',
  'គោរពគ្រូ និងរួសរាយរាក់ទាក់ជាមួយមិត្តភក្តិ',
  'អនុវត្តតាមបទបញ្ជាផ្ទៃក្នុងរបស់សាលា',
];

const pad = (n: number) => String(n).padStart(2, '0');
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const fmt = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '');
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
const avgScore = (r: StudentCareRecord) => {
  const v = Object.values(r.scores || {}).filter((x) => x > 0);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
};

/** Hook: records visible to the current user */
export const useStudentRecords = () => {
  const { syncedEntries, syncedSet, currentUser, classData } = useApp() as any;
  const isAdmin = currentUser.role === 'admin';
  const myName = currentUser.khmerName || currentUser.name;
  const visibleClassIds = new Set(Object.keys(classData || {}));
  const all: StudentCareRecord[] = (syncedEntries(REC_PREFIX) as [string, StudentCareRecord][])
    .map(([, v]) => v)
    .filter((r) => r && r.id)
    .filter((r) => currentUser.role !== 'teacher' || visibleClassIds.has(r.classId))
    .filter((r) => !r.confidential || isAdmin || r.createdBy === myName)
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  const save = (r: StudentCareRecord) => syncedSet(REC_PREFIX + r.id, { ...r, updatedAt: new Date().toISOString() });
  const remove = (id: string) => syncedSet(REC_PREFIX + id, null);
  const canModify = (r: StudentCareRecord) => isAdmin || r.createdBy === myName;
  return { all, save, remove, canModify, myName };
};

// ------------------------------------------------------------------ printing
const printRecord = (r: StudentCareRecord, settings: any) => {
  const school = esc(settings?.schoolNameKhmer || 'សាលា');
  const head = `
    <div class="head">
      <div class="left">
        ${settings?.schoolLogo ? `<img src="${esc(settings.schoolLogo)}" class="logo"/>` : ''}
        <div class="muol">${school}</div>
        <div>${esc(settings?.schoolNameEnglish || '')}</div>
        <div class="small">${esc(settings?.address || '')}${settings?.phone ? ' · ' + esc(settings.phone) : ''}</div>
      </div>
      <div class="right"><div class="muol">ព្រះរាជាណាចក្រកម្ពុជា</div><div class="muol">ជាតិ សាសនា ព្រះមហាក្សត្រ</div><div>❧❧❧</div></div>
    </div>`;
  const stu = `${esc(r.studentName)} (${esc(r.studentCode)}) · ថ្នាក់ ${esc(r.className)}`;
  const sign = (left: string, right: string) =>
    `<div class="sign"><div><div>${left}</div><div class="line"></div></div><div><div>ធ្វើនៅថ្ងៃទី ${fmt(r.date)}</div><div>${right}</div><div class="line"></div></div></div>`;
  let body = '';
  if (r.type === 'invitation') {
    body = `<h2 class="muol">លិខិតអញ្ជើញ</h2>
      <p><b>គោរពជូន៖</b> លោក/លោកស្រី អាណាព្យាបាលរបស់សិស្ស ${stu}</p>
      <p><b>កម្មវត្ថុ៖</b> សូមអញ្ជើញលោក/លោកស្រី មកជួបពិភាក្សាជាមួយគណៈគ្រប់គ្រងសាលា ${r.reason ? 'ទាក់ទងនឹង ' + esc(r.reason) : ''}។</p>
      <p>អាស្រ័យដូចបានជម្រាបជូនខាងលើ សូមលោក/លោកស្រី មេត្តាអញ្ជើញមកដល់សាលា នៅ៖</p>
      <table class="kv"><tr><td>ថ្ងៃ</td><td>${fmt(r.meetingDate)}</td></tr><tr><td>ម៉ោង</td><td>${esc(r.meetingTime || '')}</td></tr><tr><td>ទីកន្លែង</td><td>${esc(r.place || school)}</td></tr></table>
      ${r.notes ? `<p>${esc(r.notes).replace(/\n/g, '<br/>')}</p>` : ''}
      <p>សូមលោក/លោកស្រី ទទួលនូវការគោរពដ៏ខ្ពង់ខ្ពស់ពីយើងខ្ញុំ។</p>
      ${sign('', 'នាយកសាលា<br/><b>' + esc(settings?.directorName || '') + '</b>')}`;
  } else if (r.type === 'contract') {
    body = `<h2 class="muol">កិច្ចសន្យារបស់សិស្ស និងអាណាព្យាបាល</h2>
      <p>ខ្ញុំបាទ/នាងខ្ញុំ សិស្សឈ្មោះ <b>${stu}</b> និងអាណាព្យាបាលឈ្មោះ <b>${esc(r.guardianName || '..................')}</b> សូមសន្យាថា៖</p>
      <ol>${(r.commitments || []).map((c) => `<li>${esc(c)}</li>`).join('')}</ol>
      ${r.consequences ? `<p><b>ប្រសិនបើមិនគោរពតាមកិច្ចសន្យា៖</b> ${esc(r.consequences)}</p>` : ''}
      <p>កិច្ចសន្យានេះមានសុពលភាពពីថ្ងៃទី ${fmt(r.startDate || r.date)}${r.endDate ? ` ដល់ថ្ងៃទី ${fmt(r.endDate)}` : ''}។</p>
      ${r.notes ? `<p>${esc(r.notes).replace(/\n/g, '<br/>')}</p>` : ''}
      <div class="sign three"><div>ស្នាមមេដៃ/ហត្ថលេខាសិស្ស<div class="line"></div></div><div>ហត្ថលេខាអាណាព្យាបាល<div class="line"></div></div><div>គ្រូ/នាយកសាលា<div class="line"></div><div>${esc(r.createdBy)}</div></div></div>`;
  } else if (r.type === 'evaluation') {
    body = `<h2 class="muol">របាយការណ៍រង្វាយតម្លៃសិស្ស</h2>
      <p><b>សិស្ស៖</b> ${stu}<br/><b>រយៈពេល៖</b> ${esc(r.period || fmt(r.date))}</p>
      <table class="grid"><tr><th>លក្ខណៈវិនិច្ឆ័យ</th>${[1, 2, 3, 4, 5].map((n) => `<th>${SCORE_KH[n]}</th>`).join('')}</tr>
      ${CRITERIA.map((c) => `<tr><td>${c.kh}</td>${[1, 2, 3, 4, 5].map((n) => `<td class="c">${(r.scores || {})[c.key] === n ? '✔' : ''}</td>`).join('')}</tr>`).join('')}
      </table>
      <p><b>មធ្យមភាគ៖</b> ${avgScore(r).toFixed(1)} / 5</p>
      ${r.strengths ? `<p><b>ចំណុចខ្លាំង៖</b> ${esc(r.strengths)}</p>` : ''}
      ${r.improvements ? `<p><b>ចំណុចត្រូវកែលម្អ៖</b> ${esc(r.improvements)}</p>` : ''}
      ${r.notes ? `<p><b>មតិគ្រូ៖</b> ${esc(r.notes)}</p>` : ''}
      ${sign('ហត្ថលេខាអាណាព្យាបាល', 'គ្រូបង្រៀន<br/><b>' + esc(r.createdBy) + '</b>')}`;
  } else {
    const t = TYPES[r.type].kh;
    body = `<h2 class="muol">${t}</h2><p><b>សិស្ស៖</b> ${stu}<br/><b>ថ្ងៃ៖</b> ${fmt(r.date)}</p>
      ${r.type === 'counseling' ? `<p><b>ប្រធានបទ៖</b> ${esc(r.topic || '')}</p><p><b>ខ្លឹមសារ៖</b><br/>${esc(r.notes || '').replace(/\n/g, '<br/>')}</p><p><b>វិធានការ៖</b> ${esc(r.actions || '')}</p>` : ''}
      ${r.type === 'call' ? `<p><b>អ្នកទទួល៖</b> ${esc(r.contactName || '')} · ${esc(r.phone || '')} · ${r.direction === 'in' ? 'ហៅចូល' : 'ហៅចេញ'} · ${r.outcome ? OUTCOME_KH[r.outcome] : ''}</p><p>${esc(r.notes || '').replace(/\n/g, '<br/>')}</p>` : ''}
      ${r.followUp ? `<p><b>តាមដាន៖</b> ${esc(r.followUp)} ${r.followUpDate ? '(' + fmt(r.followUpDate) + ')' : ''}</p>` : ''}
      ${sign('', esc(r.createdBy))}`;
  }
  const w = window.open('', '_blank');
  if (!w) return alert('សូមអនុញ្ញាត Pop-up ដើម្បីបោះពុម្ព');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${esc(TYPES[r.type].kh)} - ${esc(r.studentName)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Moul&display=swap" rel="stylesheet"/>
  <style>
    @page{size:A4;margin:16mm}
    body{font-family:Battambang,'Khmer OS',sans-serif;font-size:14px;line-height:1.9;color:#111}
    .muol{font-family:Moul,'Khmer OS Muol Light',serif;font-weight:400}
    .head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
    .head .left{text-align:center}.head .right{text-align:center}
    .logo{height:56px;display:block;margin:0 auto 4px}
    .small{font-size:11px;color:#444}
    h2{text-align:center;font-size:18px;margin:16px 0}
    table.kv td{padding:2px 12px 2px 0}
    table.grid{border-collapse:collapse;width:100%;margin:8px 0}
    table.grid th,table.grid td{border:1px solid #333;padding:4px 6px;font-size:13px}
    td.c{text-align:center}
    .sign{display:flex;justify-content:space-between;margin-top:36px;text-align:center}
    .sign>div{min-width:40%}.sign.three>div{min-width:30%}
    .line{height:64px}
  </style></head><body>${head}${body}<script>window.onload=function(){setTimeout(function(){window.print()},400)}</script></body></html>`);
  w.document.close();
};

// ------------------------------------------------------------------ form
const RecordForm: React.FC<{
  initial: Partial<StudentCareRecord>;
  students: (StudentFeeRecord & { classId: string; className: string })[];
  lockStudent?: boolean;
  onClose: () => void;
}> = ({ initial, students, lockStudent, onClose }) => {
  const { save, myName } = useStudentRecords();
  const { currentUser, showNotification } = useApp() as any;
  const [r, setR] = useState<Partial<StudentCareRecord>>({
    date: todayIso(),
    status: 'open',
    direction: 'out',
    outcome: 'answered',
    commitments: initial.type === 'contract' && !initial.commitments ? [...DEFAULT_COMMITMENTS] : undefined,
    scores: initial.type === 'evaluation' && !initial.scores ? {} : undefined,
    ...initial,
  });
  const set = (p: Partial<StudentCareRecord>) => setR((x) => ({ ...x, ...p }));
  const [q, setQ] = useState('');
  const stu = students.find((s) => s.id === r.studentId && s.classId === r.classId);
  const phones = stu ? Array.from(new Set([stu.guardianPhone, stu.phone, stu.admissionData?.father?.phone, stu.admissionData?.mother?.phone, stu.admissionData?.caretaker?.phone].filter(Boolean) as string[])) : [];
  const type = r.type as StudentRecordType;

  const valid = !!stu && !!r.date && (type !== 'invitation' || !!r.meetingDate) && (type !== 'contract' || (r.commitments || []).some((c) => c.trim()));
  const submit = () => {
    if (!valid || !stu) return;
    const rec: StudentCareRecord = {
      ...(r as StudentCareRecord),
      id: r.id || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      studentName: stu.name,
      studentCode: stu.studentCode,
      classId: stu.classId,
      className: stu.className,
      createdBy: r.createdBy || myName,
      createdById: r.createdById || currentUser.id,
      createdAt: r.createdAt || new Date().toISOString(),
      commitments: (r.commitments || []).map((c) => c.trim()).filter(Boolean),
      ...(type === 'contract' ? { guardianName: r.guardianName ?? stu.guardianName } : {}),
      ...(type === 'call' ? { contactName: r.contactName ?? stu.guardianName, phone: r.phone ?? phones[0] } : {}),
      ...(type === 'contract' ? { startDate: r.startDate || r.date } : {}),
    };
    save(rec);
    showNotification?.('បានរក្សាទុក', 'success');
    onClose();
  };

  const filtered = q.trim() ? students.filter((s) => s.name.includes(q.trim()) || (s.latinName || '').toLowerCase().includes(q.trim().toLowerCase()) || (s.studentCode || '').toLowerCase().includes(q.trim().toLowerCase())) : students;
  const input = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';
  const lbl = 'flex flex-col gap-1 text-xs font-bold text-slate-600';
  const T = TYPES[type];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-2xl font-khmer sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900">
            <T.Icon className="h-5 w-5" /> {r.id ? 'កែ' : 'បន្ថែម'} {T.kh}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 overflow-y-auto px-4 py-3">
          {/* type */}
          {!r.id && (
            <div className="flex flex-wrap gap-1.5">
              {TYPE_ORDER.map((k) => (
                <button key={k} type="button" onClick={() => set({ type: k, commitments: k === 'contract' ? r.commitments || [...DEFAULT_COMMITMENTS] : r.commitments, scores: k === 'evaluation' ? r.scores || {} : r.scores })}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${type === k ? TYPES[k].cls : 'border-slate-200 text-slate-500'}`}>{TYPES[k].kh}</button>
              ))}
            </div>
          )}
          {/* student */}
          {lockStudent && stu ? (
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm"><b>{stu.name}</b> <span className="text-xs text-slate-500">{stu.studentCode} · {stu.className}</span></div>
          ) : (
            <div className={lbl}>
              សិស្ស *
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={stu ? `${stu.name} · ${stu.className}` : 'ស្វែងរកឈ្មោះ ឬអត្តលេខ'} className={`${input} pl-8`} />
              </div>
              {(q || !stu) && (
                <div className="max-h-40 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 font-normal">
                  {filtered.slice(0, 50).map((s) => (
                    <button key={`${s.classId}_${s.id}`} type="button" onClick={() => { set({ studentId: s.id, classId: s.classId }); setQ(''); }}
                      className={`flex w-full justify-between px-3 py-1.5 text-left text-xs hover:bg-teal-50 ${stu?.id === s.id && stu?.classId === s.classId ? 'bg-teal-50' : ''}`}>
                      <span className="font-bold text-slate-800">{s.name}</span><span className="text-slate-500">{s.className}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && <div className="p-3 text-center text-xs text-slate-400">រកមិនឃើញ</div>}
                </div>
              )}
            </div>
          )}
          <label className={lbl}>ថ្ងៃ<input type="date" value={r.date || ''} onChange={(e) => set({ date: e.target.value })} className={input} /></label>

          {type === 'evaluation' && (
            <>
              <label className={lbl}>រយៈពេល (ឧ. ខែវិច្ឆិកា ២០២៦ / ឆមាសទី១)<input value={r.period || ''} onChange={(e) => set({ period: e.target.value })} className={input} /></label>
              <div className="space-y-1.5 rounded-xl border border-slate-200 p-2">
                {CRITERIA.map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-700">{c.kh}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" title={SCORE_KH[n]} onClick={() => set({ scores: { ...(r.scores || {}), [c.key]: n } })}
                          className={`h-8 w-8 rounded-lg border text-sm font-bold ${(r.scores || {})[c.key] >= n ? 'border-amber-400 bg-amber-400 text-white' : 'border-slate-200 text-slate-300'}`}>★</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <label className={lbl}>ចំណុចខ្លាំង<textarea rows={2} value={r.strengths || ''} onChange={(e) => set({ strengths: e.target.value })} className={input} /></label>
              <label className={lbl}>ចំណុចត្រូវកែលម្អ<textarea rows={2} value={r.improvements || ''} onChange={(e) => set({ improvements: e.target.value })} className={input} /></label>
            </>
          )}

          {type === 'counseling' && (
            <>
              <label className={lbl}>ប្រធានបទ<input value={r.topic || ''} onChange={(e) => set({ topic: e.target.value })} placeholder="ឧ. ការសិក្សាធ្លាក់ចុះ / បញ្ហាគ្រួសារ" className={input} /></label>
              <label className={lbl}>វិធានការ / ដំណោះស្រាយ<textarea rows={2} value={r.actions || ''} onChange={(e) => set({ actions: e.target.value })} className={input} /></label>
              <label className="flex items-center gap-2 text-xs font-bold text-rose-700"><input type="checkbox" className="accent-rose-600" checked={!!r.confidential} onChange={(e) => set({ confidential: e.target.checked })} /> <Lock className="h-3.5 w-3.5" /> សម្ងាត់ (មើលបានតែខ្ញុំ និង Admin)</label>
            </>
          )}

          {type === 'contract' && (
            <>
              <label className={lbl}>ឈ្មោះអាណាព្យាបាល<input value={r.guardianName ?? stu?.guardianName ?? ''} onChange={(e) => set({ guardianName: e.target.value })} className={input} /></label>
              <div className={lbl}>
                ការសន្យា
                {(r.commitments || []).map((c, i) => (
                  <div key={i} className="flex gap-1.5">
                    <span className="w-5 pt-2 text-right text-slate-400">{i + 1}.</span>
                    <input value={c} onChange={(e) => set({ commitments: (r.commitments || []).map((x, j) => (j === i ? e.target.value : x)) })} className={`${input} font-normal`} />
                    <button type="button" onClick={() => set({ commitments: (r.commitments || []).filter((_, j) => j !== i) })} className="rounded-lg px-2 text-rose-500 hover:bg-rose-50"><X className="h-4 w-4" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => set({ commitments: [...(r.commitments || []), ''] })} className="self-start rounded-lg bg-slate-100 px-2.5 py-1 text-[11px]">+ បន្ថែមការសន្យា</button>
              </div>
              <label className={lbl}>បើមិនគោរពតាម<textarea rows={2} value={r.consequences || ''} onChange={(e) => set({ consequences: e.target.value })} className={input} /></label>
              <div className="grid grid-cols-2 gap-2">
                <label className={lbl}>ចាប់ពី<input type="date" value={r.startDate || r.date || ''} onChange={(e) => set({ startDate: e.target.value })} className={input} /></label>
                <label className={lbl}>ដល់<input type="date" value={r.endDate || ''} onChange={(e) => set({ endDate: e.target.value })} className={input} /></label>
              </div>
            </>
          )}

          {type === 'invitation' && (
            <>
              <label className={lbl}>មូលហេតុ<input value={r.reason || ''} onChange={(e) => set({ reason: e.target.value })} placeholder="ឧ. ការសិក្សា និងវត្តមានរបស់កូន" className={input} /></label>
              <div className="grid grid-cols-2 gap-2">
                <label className={lbl}>ថ្ងៃជួប *<input type="date" value={r.meetingDate || ''} onChange={(e) => set({ meetingDate: e.target.value })} className={input} /></label>
                <label className={lbl}>ម៉ោង<input type="time" value={r.meetingTime || ''} onChange={(e) => set({ meetingTime: e.target.value })} className={input} /></label>
              </div>
              <label className={lbl}>ទីកន្លែង<input value={r.place || ''} onChange={(e) => set({ place: e.target.value })} placeholder="ការិយាល័យនាយកសាលា" className={input} /></label>
            </>
          )}

          {type === 'call' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <label className={lbl}>ឈ្មោះអ្នកទទួល<input value={r.contactName ?? stu?.guardianName ?? ''} onChange={(e) => set({ contactName: e.target.value })} className={input} /></label>
                <label className={lbl}>លេខទូរស័ព្ទ<input value={r.phone ?? phones[0] ?? ''} onChange={(e) => set({ phone: e.target.value })} list="rec-phones" className={input} /></label>
                <datalist id="rec-phones">{phones.map((p) => <option key={p} value={p} />)}</datalist>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['out', 'in'] as const).map((d) => (
                  <button key={d} type="button" onClick={() => set({ direction: d })} className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${r.direction === d ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-500'}`}>{d === 'out' ? '📤 ហៅចេញ' : '📥 ហៅចូល'}</button>
                ))}
                {(Object.keys(OUTCOME_KH) as (keyof typeof OUTCOME_KH)[]).map((o) => (
                  <button key={o} type="button" onClick={() => set({ outcome: o })} className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${r.outcome === o ? 'border-sky-300 bg-sky-50 text-sky-800' : 'border-slate-200 text-slate-500'}`}>{OUTCOME_KH[o]}</button>
                ))}
              </div>
              {(r.phone ?? phones[0]) && (
                <a href={`tel:${String(r.phone ?? phones[0]).replace(/\s+/g, '')}`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><PhoneCall className="h-4 w-4" /> ហៅឥឡូវ</a>
              )}
            </>
          )}

          <label className={lbl}>{type === 'evaluation' ? 'មតិគ្រូ' : type === 'counseling' ? 'ខ្លឹមសារពិភាក្សា' : type === 'call' ? 'ខ្លឹមសារសន្ទនា' : 'កំណត់សម្គាល់'}
            <textarea rows={3} value={r.notes || ''} onChange={(e) => set({ notes: e.target.value })} className={`${input} font-normal`} />
          </label>
          {(type === 'counseling' || type === 'call' || type === 'invitation') && (
            <div className="grid grid-cols-2 gap-2">
              <label className={`${lbl} col-span-2`}>ការតាមដាន<input value={r.followUp || ''} onChange={(e) => set({ followUp: e.target.value })} className={`${input} font-normal`} /></label>
              <label className={lbl}>ថ្ងៃតាមដាន<input type="date" value={r.followUpDate || ''} onChange={(e) => set({ followUpDate: e.target.value })} className={input} /></label>
              <label className={lbl}>ស្ថានភាព
                <select value={r.status || 'open'} onChange={(e) => set({ status: e.target.value as any })} className={input}>
                  <option value="open">កំពុងតាមដាន</option><option value="done">រួចរាល់</option>
                </select>
              </label>
            </div>
          )}
        </div>
        <div className="border-t border-slate-100 px-4 py-3">
          <button onClick={submit} disabled={!valid} className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-40">រក្សាទុក</button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ list
const RecordCard: React.FC<{ r: StudentCareRecord; onEdit: () => void; showStudent: boolean }> = ({ r, onEdit, showStudent }) => {
  const { settings } = useApp() as any;
  const { canModify, remove } = useStudentRecords();
  const T = TYPES[r.type];
  const summary =
    r.type === 'evaluation' ? `★ ${avgScore(r).toFixed(1)}/5${r.period ? ' · ' + r.period : ''}`
    : r.type === 'counseling' ? r.topic || ''
    : r.type === 'contract' ? `${(r.commitments || []).length} ការសន្យា${r.endDate ? ' · ដល់ ' + fmt(r.endDate) : ''}`
    : r.type === 'invitation' ? `ជួប ${fmt(r.meetingDate)} ${r.meetingTime || ''}${r.reason ? ' · ' + r.reason : ''}`
    : `${r.direction === 'in' ? '📥' : '📤'} ${r.contactName || ''} ${r.phone || ''} · ${r.outcome ? OUTCOME_KH[r.outcome] : ''}`;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${T.cls}`}><T.Icon className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            {showStudent && <b className="text-slate-900">{r.studentName}</b>}
            <span className={`rounded-full border px-1.5 text-[10px] font-bold ${T.cls}`}>{T.kh}</span>
            {r.confidential && <Lock className="h-3.5 w-3.5 text-rose-500" />}
            {r.status === 'open' && (r.type === 'counseling' || r.type === 'call' || r.type === 'invitation') && r.followUp && (
              <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-800">តាមដាន{r.followUpDate ? ' ' + fmt(r.followUpDate) : ''}</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500">{fmt(r.date)}{showStudent ? ` · ${r.className}` : ''} · {r.createdBy}</div>
          {summary.trim() && <div className="mt-1 text-xs font-bold text-slate-700">{summary}</div>}
          {r.notes && <div className="mt-0.5 line-clamp-2 text-xs text-slate-600">{r.notes}</div>}
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-1">
        <button type="button" onClick={() => printRecord(r, settings)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100"><Printer className="h-3.5 w-3.5" /> បោះពុម្ព</button>
        {canModify(r) && (
          <>
            <button type="button" onClick={onEdit} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50"><Edit3 className="h-3.5 w-3.5" /> កែ</button>
            <button type="button" onClick={() => confirm(`លុប ${T.kh} របស់ ${r.studentName}?`) && remove(r.id)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /> លុប</button>
          </>
        )}
      </div>
    </div>
  );
};

/** Main page (or embedded for one student when `student` is given) */
export const StudentRecordsView: React.FC<{ student?: { id: number; classId: string } }> = ({ student }) => {
  const { classData } = useApp() as any;
  const { all } = useStudentRecords();
  const [type, setType] = useState<StudentRecordType | 'all'>('all');
  const [classId, setClassId] = useState<string>('all');
  const [q, setQ] = useState('');
  const [form, setForm] = useState<Partial<StudentCareRecord> | null>(null);

  const students = useMemo(
    () =>
      Object.entries(classData || {}).flatMap(([cid, c]: [string, any]) =>
        (c.students || []).filter((s: StudentFeeRecord) => !String(s.feesGroup || '').toLowerCase().includes('stop')).map((s: StudentFeeRecord) => ({ ...s, classId: cid, className: c.className }))
      ),
    [classData]
  );

  const list = all.filter(
    (r) =>
      (!student || (r.studentId === student.id && r.classId === student.classId)) &&
      (type === 'all' || r.type === type) &&
      (classId === 'all' || r.classId === classId) &&
      (!q.trim() || r.studentName.includes(q.trim()) || (r.studentCode || '').toLowerCase().includes(q.trim().toLowerCase()))
  );
  const counts = TYPE_ORDER.reduce((m, k) => ({ ...m, [k]: all.filter((r) => (!student || (r.studentId === student.id && r.classId === student.classId)) && r.type === k).length }), {} as Record<string, number>);
  const openFollowUps = list.filter((r) => r.status === 'open' && r.followUp).length;

  return (
    <div className={`space-y-3 font-khmer ${student ? '' : 'mx-auto max-w-4xl'}`}>
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
        {!student && (
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><ClipboardList className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-slate-900">កំណត់ត្រាសិស្ស</div>
              <p className="text-[11px] text-slate-500">រង្វាយតម្លៃ · ប្រឹក្សា · កិច្ចសន្យា · លិខិតអញ្ជើញ · Call note{openFollowUps ? ` · ត្រូវតាមដាន ${openFollowUps}` : ''}</p>
            </div>
          </div>
        )}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button type="button" onClick={() => setType('all')} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${type === 'all' ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200 text-slate-600'}`}>ទាំងអស់</button>
          {TYPE_ORDER.map((k) => (
            <button key={k} type="button" onClick={() => setType(k)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${type === k ? TYPES[k].cls : 'border-slate-200 text-slate-600'}`}>
              {TYPES[k].kh} {counts[k] ? <span className="opacity-70">{counts[k]}</span> : null}
            </button>
          ))}
        </div>
        {!student && (
          <div className="grid grid-cols-2 gap-2">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm">
              <option value="all">គ្រប់ថ្នាក់</option>
              {Object.entries(classData || {}).map(([cid, c]: [string, any]) => <option key={cid} value={cid}>{c.className}</option>)}
            </select>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ស្វែងរកសិស្ស" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-2 text-sm" />
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setForm({ type: type === 'all' ? 'call' : type, ...(student ? { studentId: student.id, classId: student.classId } : {}) })}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" /> បន្ថែម{type === 'all' ? 'កំណត់ត្រា' : TYPES[type].kh}
        </button>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">មិនទាន់មានកំណត់ត្រា</div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {list.map((r) => <RecordCard key={r.id} r={r} showStudent={!student} onEdit={() => setForm(r)} />)}
        </div>
      )}

      {form && <RecordForm initial={form} students={students} lockStudent={!!student || !!form.id} onClose={() => setForm(null)} />}
    </div>
  );
};
