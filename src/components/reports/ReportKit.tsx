// Shared pieces for the Excel-style reports (amounts in Riel ៛)
import React from 'react';
import { Printer } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { collectAllTransactions, UnifiedDailyTransaction } from '../../utils/transactions';

export const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** 1234567 → "1,234,567 ៛" (keeps up to 2 decimals only when present) */
export const riel = (n: number, withSymbol = true) => {
  const v = Math.round((n || 0) * 100) / 100;
  const s = v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return withSymbol ? `${s} ៛` : s;
};

/** YYYY-MM-DD → "13-November-2026" */
export const longDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}-${MONTHS_EN[Number(m) - 1]}-${y}`;
};

/** YYYY-MM-DD → "13-11-2026" */
export const shortDate = (iso: string) => {
  const [y, m, d] = (iso || '').split('-');
  if (!y || !m || !d) return iso || '';
  return `${d}-${m}-${y}`;
};

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const monthRange = (iso: string) => {
  const [y, m] = iso.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, '0');
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(last).padStart(2, '0')}` };
};

export const isCashMethod = (paidBy?: string) => {
  const p = (paidBy || '').toLowerCase();
  return !(p.includes('aba') || p.includes('ac') || p.includes('wing') || p.includes('bank'));
};

/** Every payment received across the school (all canteen months included), for the active campus */
export const useAllTransactions = (): UnifiedDailyTransaction[] => {
  const {
    classData, uniformSalesHistory, materialSalesHistory, busEnrollments, busPayments,
    canteenHistory, selectedCanteenMonth, settings, currentBranchId,
  } = useApp();
  return React.useMemo(
    () =>
      collectAllTransactions({
        classData, uniformSalesHistory, materialSalesHistory, busEnrollments, busPayments,
        canteenHistory, selectedCanteenMonth, settings, currentBranchId, allCanteenMonths: true,
      }),
    [classData, uniformSalesHistory, materialSalesHistory, busEnrollments, busPayments, canteenHistory, selectedCanteenMonth, settings, currentBranchId]
  );
};

export const PrintButton: React.FC<{ label?: string }> = ({ label = 'បោះពុម្ព (Print)' }) => (
  <button
    type="button"
    onClick={() => window.print()}
    className="no-print inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 font-khmer"
  >
    <Printer className="h-4 w-4" /> {label}
  </button>
);

/** Toolbar wrapper with a white card look */
export const ReportToolbar: React.FC<{ title: string; subtitle?: string; children?: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="no-print ui-card flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
    <div>
      <h2 className="font-display text-lg font-bold text-slate-900 font-khmer">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 font-khmer">{subtitle}</p>}
    </div>
    <div className="flex flex-wrap items-end gap-2">{children}</div>
  </div>
);

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500 font-khmer">
    {label}
    {children}
  </label>
);

export const inputCls =
  'rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-teal-400 focus:outline-none';

/** School header used on printed sheets */
export const SheetHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  const { settings } = useApp();
  return (
    <div className="mb-4 flex items-center gap-3 border-b-2 border-amber-400 pb-3">
      {settings.schoolLogo && <img src={settings.schoolLogo} alt="" className="h-14 w-14 rounded-full object-cover" />}
      <div className="flex-1">
        <div className="font-muol text-sm text-teal-900">{settings.schoolNameKhmer}</div>
        <div className="text-xs font-bold text-slate-600">{settings.schoolNameEnglish}</div>
      </div>
      <div className="text-right">
        <div className="font-muol text-sm text-slate-900">{title}</div>
        {subtitle && <div className="text-[11px] font-bold text-slate-600">{subtitle}</div>}
      </div>
    </div>
  );
};

/** Excel-style yellow header table */
export const XTable: React.FC<{ head: React.ReactNode[]; children: React.ReactNode; foot?: React.ReactNode; className?: string }> = ({
  head, children, foot, className = '',
}) => (
  <div className={`overflow-x-auto rounded-xl border border-slate-300 ${className}`}>
    <table className="w-full border-collapse text-xs font-khmer">
      <thead>
        <tr className="bg-amber-400 text-slate-900">
          {head.map((h, i) => (
            <th key={i} className="border-r border-amber-500 px-2 py-2 text-center font-bold last:border-r-0">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200">{children}</tbody>
      {foot && <tfoot className="bg-amber-100 font-bold text-slate-900">{foot}</tfoot>}
    </table>
  </div>
);

export const td = 'border-r border-slate-200 px-2 py-1.5 last:border-r-0';

/** Signature blocks (date line + role + name) */
export const Signatures: React.FC<{ blocks: { role: string; name?: string }[] }> = ({ blocks }) => (
  <div className={`mt-8 grid gap-6 text-center text-xs font-khmer`} style={{ gridTemplateColumns: `repeat(${blocks.length}, minmax(0, 1fr))` }}>
    {blocks.map((b, i) => (
      <div key={i} className="flex flex-col items-center">
        <div className="text-[11px] text-slate-600">ថ្ងៃទី……..ខែ…………...ឆ្នាំ២០……</div>
        <div className="mt-1 font-bold text-slate-900">{b.role}</div>
        <div className="h-16" />
        <div className="min-w-[10rem] border-t border-dotted border-slate-400 pt-1 font-bold text-slate-800">{b.name || ''}</div>
      </div>
    ))}
  </div>
);

export const EmptyRow: React.FC<{ cols: number; text?: string }> = ({ cols, text = 'មិនមានទិន្នន័យ' }) => (
  <tr>
    <td colSpan={cols} className="px-3 py-4 text-center text-slate-400">{text}</td>
  </tr>
);
