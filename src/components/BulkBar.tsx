// Shared row selection + action bar for "do it once for the selected rows (or all)".
import React, { useCallback, useEffect, useMemo, useState } from 'react';

export function useRowSelection<K extends string | number>(visibleIds: K[], resetKey?: unknown) {
  const [picked, setPicked] = useState<Set<K>>(new Set());
  useEffect(() => setPicked(new Set()), [resetKey]);
  const key = visibleIds.join('|');
  // keep only ids still visible
  useEffect(() => {
    setPicked((p) => {
      const vis = new Set(visibleIds);
      const n = new Set([...p].filter((id) => vis.has(id)));
      return n.size === p.size ? p : n;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const all = visibleIds.length > 0 && visibleIds.every((id) => picked.has(id));
  const toggle = useCallback(
    (id: K) =>
      setPicked((p) => {
        const n = new Set(p);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    []
  );
  const toggleAll = () => setPicked(all ? new Set() : new Set(visibleIds));
  const clear = () => setPicked(new Set());
  const ids = useMemo(() => visibleIds.filter((id) => picked.has(id)), [key, picked]); // eslint-disable-line react-hooks/exhaustive-deps
  return { picked, ids, all, toggle, toggleAll, clear, has: (id: K) => picked.has(id) };
}

export interface BulkAction {
  label: string;
  onClick: () => void;
  tone?: 'green' | 'red' | 'blue' | 'amber' | 'plain';
  hidden?: boolean;
}

const TONE: Record<NonNullable<BulkAction['tone']>, string> = {
  green: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  red: 'bg-rose-600 hover:bg-rose-700 text-white',
  blue: 'bg-sky-600 hover:bg-sky-700 text-white',
  amber: 'bg-amber-500 hover:bg-amber-600 text-white',
  plain: 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700',
};

export const BulkBar: React.FC<{
  count: number;
  total: number;
  all: boolean;
  onToggleAll: () => void;
  onClear: () => void;
  actions: BulkAction[];
}> = ({ count, total, all, onToggleAll, onClear, actions }) => (
  <div className="no-print flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-khmer">
    <label className="flex items-center gap-1.5 font-bold text-amber-950 cursor-pointer">
      <input type="checkbox" className="accent-amber-600 w-4 h-4" checked={all} onChange={onToggleAll} disabled={total === 0} />
      {count > 0 ? `បានជ្រើស ${count}` : `ជ្រើសទាំងអស់ (${total})`}
    </label>
    {count > 0 && (
      <>
        <button type="button" onClick={onClear} className="text-amber-800 underline cursor-pointer">
          ដោះការជ្រើស
        </button>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {actions
            .filter((a) => !a.hidden)
            .map((a) => (
              <button key={a.label} type="button" onClick={a.onClick} className={`rounded-lg px-2.5 py-1 font-bold cursor-pointer ${TONE[a.tone || 'plain']}`}>
                {a.label}
              </button>
            ))}
        </div>
      </>
    )}
  </div>
);

/** Download rows as a UTF-8 CSV that opens correctly in Excel */
export const downloadCSV = (filename: string, rows: unknown[][]) => {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const blob = new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};
