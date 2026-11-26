// System Settings → ថ្លៃសិក្សា: the full monthly tuition per class level, and what each of the
// four tuition cases pays (Full 100% · 50% · Contribute $5 · Free).
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ClassFeeData } from '../types';
import { CONTRIBUTE_FEE_USD, DEFAULT_FULL_FEE_USD, TUITION_CASES, caseRate, fullFeeOf } from '../utils/tuition';
import { Wallet } from 'lucide-react';

export const TuitionSettingsPanel: React.FC = () => {
  const { classData, orderedClassList, updateClassAcademic, permissions, showNotification } = useApp() as any;
  const classes: ClassFeeData[] = (orderedClassList?.length ? orderedClassList : Object.values(classData || {})) as ClassFeeData[];
  const canEdit = !!permissions?.canEdit;
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [allValue, setAllValue] = useState('');

  const save = (cls: ClassFeeData, raw: string) => {
    const v = Math.round(Number(raw) * 100) / 100;
    if (!(v > 0) || v === fullFeeOf(cls)) return;
    updateClassAcademic(cls.classId, () => ({ fullFeeUSD: v }));
    showNotification?.(`បានកំណត់ថ្លៃសិក្សា ${cls.className} = $${v.toFixed(2)}`, 'success');
  };
  const applyAll = () => {
    const v = Math.round(Number(allValue) * 100) / 100;
    if (!(v > 0)) return;
    classes.forEach((c) => updateClassAcademic(c.classId, () => ({ fullFeeUSD: v })));
    setDraft({});
    showNotification?.(`បានកំណត់ $${v.toFixed(2)} ឲ្យគ្រប់ថ្នាក់`, 'success');
  };
  const count = (cls: ClassFeeData, c: string) => (cls.students || []).filter((s) => s.caseType === c && !s.feesGroup.toLowerCase().includes('stop')).length;

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 font-khmer shadow-2xs sm:p-6">
      <div className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
        <Wallet className="h-5 w-5 text-teal-600" /> ថ្លៃសិក្សាតាមកម្រិតថ្នាក់
      </div>
      <p className="mb-4 text-xs text-slate-500">
        កំណត់ថ្លៃសិក្សាពេញ (Full 100%) ក្នុង ១ ខែ សម្រាប់ថ្នាក់នីមួយៗ។ ករណីផ្សេងទៀតគណនាដោយស្វ័យប្រវត្តិ។
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TUITION_CASES.map((c) => (
          <div key={c.value} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-xs font-bold text-slate-800">{c.en}</div>
            <div className="text-[11px] text-slate-500">
              {c.value === 'Full' ? 'តម្លៃពេញរបស់ថ្នាក់' : c.value === '50%' ? 'ពាក់កណ្តាលនៃតម្លៃពេញ' : c.value === 'Contribute' ? `$${CONTRIBUTE_FEE_USD.toFixed(2)} គ្រប់កម្រិតថ្នាក់` : '$0 · មិនគិតថ្លៃ'}
            </div>
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="mb-3 flex flex-wrap items-end gap-2 rounded-xl border border-teal-100 bg-teal-50/50 p-3">
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
            កំណត់តម្លៃពេញដូចគ្នាឲ្យគ្រប់ថ្នាក់ ($)
            <input type="number" min={0} step="0.25" value={allValue} onChange={(e) => setAllValue(e.target.value)} placeholder={DEFAULT_FULL_FEE_USD.toFixed(2)} className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm" />
          </label>
          <button type="button" onClick={applyAll} disabled={!(Number(allValue) > 0)} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">
            អនុវត្តគ្រប់ថ្នាក់
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="border border-slate-200 px-3 py-2 text-left">ថ្នាក់</th>
              <th className="border border-slate-200 px-3 py-2 text-center">Full 100% ($/ខែ)</th>
              <th className="border border-slate-200 px-3 py-2 text-center">50%</th>
              <th className="border border-slate-200 px-3 py-2 text-center">Contribute</th>
              <th className="border border-slate-200 px-3 py-2 text-center">Free</th>
              <th className="border border-slate-200 px-3 py-2 text-center">សិស្ស (Full · 50% · Contr. · Free)</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => {
              const full = fullFeeOf(cls);
              const val = draft[cls.classId] ?? full.toFixed(2);
              const shown = Number(val) > 0 ? Number(val) : full;
              return (
                <tr key={cls.classId} className="hover:bg-slate-50">
                  <td className="border border-slate-200 px-3 py-1.5 font-bold text-slate-800">{cls.className}</td>
                  <td className="border border-slate-200 px-2 py-1 text-center">
                    {canEdit ? (
                      <input
                        type="number"
                        min={0}
                        step="0.25"
                        value={val}
                        onChange={(e) => setDraft((d) => ({ ...d, [cls.classId]: e.target.value }))}
                        onBlur={(e) => save(cls, e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-center font-mono font-bold"
                      />
                    ) : (
                      <span className="font-mono font-bold">${full.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="border border-slate-200 px-3 py-1.5 text-center font-mono">${caseRate('50%', shown).toFixed(2)}</td>
                  <td className="border border-slate-200 px-3 py-1.5 text-center font-mono">${caseRate('Contribute', shown).toFixed(2)}</td>
                  <td className="border border-slate-200 px-3 py-1.5 text-center font-mono text-slate-400">$0.00</td>
                  <td className="border border-slate-200 px-3 py-1.5 text-center font-mono text-slate-600">
                    {count(cls, 'Full')} · {count(cls, '50%')} · {count(cls, 'Contribute')} · {count(cls, 'Free')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-slate-500">
        ការប្តូរតម្លៃនេះ ប្រើសម្រាប់ការបង់ប្រាក់ថ្មី ចាប់ពីពេលនេះទៅ។ វិក្កយបត្រដែលបានចេញរួច មិនប្តូរទេ។
      </p>
    </div>
  );
};
