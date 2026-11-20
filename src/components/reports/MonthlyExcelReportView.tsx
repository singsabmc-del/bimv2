// Reporting Section → Monthly Report (layout of "Monthly Report.xlsx", amounts in Riel)
import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { normalizeDateToISO } from '../../utils/transactions';
import {
  useAllTransactions, riel, longDate, shortDate, monthRange, todayISO, MONTHS_EN,
  PrintButton, ReportToolbar, Field, inputCls, SheetHeader, XTable, td, Signatures, EmptyRow,
} from './ReportKit';

export type MonthlyReportKind = 'tuition_fee' | 'uniform_sales' | 'transportation' | 'study_materials' | 'stall_fee';

const TITLES: Record<MonthlyReportKind, { km: string; en: string }> = {
  tuition_fee: { km: 'របាយការណ៍បង់ថ្លៃសិក្សា', en: 'Payment Student' },
  uniform_sales: { km: 'របាយការណ៍លក់ឯកសណ្ឋាន', en: 'Uniform Payment' },
  transportation: { km: 'របាយការណ៍សេវាដឹកជញ្ជូនសិស្ស', en: 'Student Transportation' },
  study_materials: { km: 'របាយការណ៍លក់សម្ភារៈសិក្សា', en: 'Sales Of Study Materials' },
  stall_fee: { km: 'របាយការណ៍ថ្លៃតូប', en: 'Payment Of The Stall Fee' },
};

const monthOnly = (m: string) => (m || '').trim().split(/\s+/)[0];
const payBy = (p?: string) => (!p || p === '$ -' ? 'Cash' : p);
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const sizeKey = (s: string) => {
  const n = Number(s);
  if (!Number.isNaN(n)) return n;
  const i = SIZE_ORDER.indexOf(s.toUpperCase());
  return 1000 + (i < 0 ? 99 : i);
};

export const MonthlyExcelReportView: React.FC<{ initialReportType?: MonthlyReportKind }> = ({ initialReportType = 'tuition_fee' }) => {
  const { settings, classData, orderedClassList, canteenHistory, exchangeRate } = useApp() as any;
  const all = useAllTransactions();
  const kind = initialReportType;
  const initial = monthRange(todayISO());
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [classId, setClassId] = useState<string>(orderedClassList?.[0]?.classId || Object.keys(classData || {})[0] || '');
  const inRange = (iso: string) => iso >= from && iso <= to;
  const rate = settings.exchangeRate || exchangeRate || 4100;

  // ---------- Payment Student ----------
  const tuition = useMemo(() => {
    if (kind !== 'tuition_fee') return null;
    const cls = classData?.[classId];
    const [ry, rm] = from.split('-').map(Number);
    const rangeMonth = MONTHS_EN[rm - 1];
    const rows: { id: number; name: string; gender: string; group: string; start: string; payDate: string; amount: number; payBy: string }[] = [];
    (cls?.students || []).forEach((st: any, idx: number) => {
      const startDay = (normalizeDateToISO(st.startDate || '').split('-')[2] || '01').padStart(2, '0');
      const startFor = (monthName: string, yearHint?: string) => {
        const mi = MONTHS_EN.findIndex((m) => m.toLowerCase() === monthName.toLowerCase());
        if (mi < 0) return st.startDate || '';
        const y = yearHint || String(ry);
        return `${startDay}-${String(mi + 1).padStart(2, '0')}-${y}`;
      };
      const records = (st.feeHistory || []).filter((r: any) => r.status !== 'pending');
      let any = false;
      records.forEach((r: any) => {
        const iso = normalizeDateToISO(r.date);
        if (!inRange(iso)) return;
        const months: string[] = r.months?.length ? r.months : [r.month];
        const per = (r.amountKHR || Math.round((r.amountUSD || 0) * rate)) / (months.length || 1);
        months.forEach((m) => {
          any = true;
          const [mn, my] = (m || '').trim().split(/\s+/);
          rows.push({ id: idx + 1, name: st.name, gender: st.gender, group: mn, start: startFor(mn, my), payDate: shortDate(iso), amount: per, payBy: payBy(r.paidBy) });
        });
      });
      if (!any) {
        const prepaid = records.find((r: any) =>
          (r.months?.length ? r.months : [r.month]).some((m: string) => monthOnly(m).toLowerCase() === rangeMonth.toLowerCase())
        );
        rows.push({
          id: idx + 1, name: st.name, gender: st.gender,
          group: prepaid ? 'Already' : 'Unpaid',
          start: startFor(rangeMonth),
          payDate: prepaid ? shortDate(normalizeDateToISO(prepaid.date)) : 'Unpaid',
          amount: 0, payBy: prepaid ? payBy(prepaid.paidBy) : '-',
        });
      }
    });
    const groups = new Map<string, { qty: number; amount: number }>();
    rows.forEach((r) => {
      const g = groups.get(r.group) || { qty: 0, amount: 0 };
      g.qty += 1;
      g.amount += r.amount;
      groups.set(r.group, g);
    });
    const order = (g: string) => (g === 'Unpaid' ? -2 : g === 'Already' ? -1 : MONTHS_EN.indexOf(g));
    const summary = Array.from(groups.entries()).sort((a, b) => order(a[0]) - order(b[0]));
    const paidRows = rows.filter((r) => r.group !== 'Unpaid' && r.group !== 'Already');
    return { cls, rows, summary, totalQty: paidRows.length, totalAmount: paidRows.reduce((n, r) => n + r.amount, 0) };
  }, [kind, classData, classId, from, to, rate]);

  // ---------- Uniform ----------
  const uniform = useMemo(() => {
    if (kind !== 'uniform_sales') return null;
    const byType = new Map<string, Map<string, { qty: number; amount: number }>>();
    all.filter((t) => t.category === 'uniform' && inRange(t.date)).forEach((t) => {
      const type = t.rawDetails?.typeNameKhmer || t.rawDetails?.type || 'Uniform';
      const size = String(t.rawDetails?.size || '-');
      if (!byType.has(type)) byType.set(type, new Map());
      const m = byType.get(type)!;
      const cur = m.get(size) || { qty: 0, amount: 0 };
      cur.qty += t.rawDetails?.quantity || 0;
      cur.amount += t.amountKHR;
      m.set(size, cur);
    });
    const tables = Array.from(byType.entries()).map(([type, m]) => {
      const rows = Array.from(m.entries()).sort((a, b) => sizeKey(a[0]) - sizeKey(b[0]));
      return { type, rows, qty: rows.reduce((n, [, v]) => n + v.qty, 0), amount: rows.reduce((n, [, v]) => n + v.amount, 0) };
    });
    return { tables, qty: tables.reduce((n, t) => n + t.qty, 0), amount: tables.reduce((n, t) => n + t.amount, 0) };
  }, [kind, all, from, to]);

  // ---------- Study materials ----------
  const materials = useMemo(() => {
    if (kind !== 'study_materials') return null;
    const map = new Map<string, { qty: number; amount: number }>();
    all.filter((t) => t.category === 'material' && inRange(t.date)).forEach((t) => {
      const name = t.rawDetails?.itemName || t.description;
      const cur = map.get(name) || { qty: 0, amount: 0 };
      cur.qty += t.rawDetails?.quantity || 0;
      cur.amount += t.amountKHR;
      map.set(name, cur);
    });
    const rows = Array.from(map.entries()).map(([name, v]) => ({ name, ...v }));
    const half = Math.ceil(rows.length / 2);
    return { left: rows.slice(0, half), right: rows.slice(half), total: rows.reduce((n, r) => n + r.amount, 0) };
  }, [kind, all, from, to]);

  // ---------- Transportation ----------
  const bus = useMemo(() => {
    if (kind !== 'transportation') return null;
    const rows = all.filter((t) => t.category === 'bus' && inRange(t.date));
    return { rows, total: rows.reduce((n, r) => n + r.amountKHR, 0) };
  }, [kind, all, from, to]);

  // ---------- Stall fee grid ----------
  const stall = useMemo(() => {
    if (kind !== 'stall_fee') return null;
    const vendors = new Map<string, string>();
    const days: { date: string; cells: Record<string, number>; qty: number; due: number; total: number }[] = [];
    Object.values(canteenHistory || {}).forEach((rep: any) => {
      (rep?.vendors || []).forEach((v: any) => vendors.set(v.id, v.name));
      (rep?.dailyRecords || []).forEach((dr: any) => {
        const iso = normalizeDateToISO(dr.date);
        if (!inRange(iso)) return;
        const cells: Record<string, number> = {};
        let qty = 0, total = 0;
        Object.entries(dr.vendorStatus || {}).forEach(([vId, vs]: [string, any]) => {
          const fee = (rep.vendors || []).find((v: any) => v.id === vId)?.dailyFeeKHR || dr.standardFeeKHR || 10000;
          const amt = vs.status === 'paid' || vs.status === 'double_paid' ? vs.amountKHR || fee : 0;
          cells[vId] = amt;
          if (amt > 0) qty++;
          total += amt;
        });
        days.push({ date: iso, cells, qty, due: dr.standardFeeKHR || 10000, total });
      });
    });
    days.sort((a, b) => a.date.localeCompare(b.date));
    const vendorIds = Array.from(vendors.keys()).filter((id) => days.some((d) => id in d.cells));
    return { vendorIds, vendors, days, total: days.reduce((n, d) => n + d.total, 0) };
  }, [kind, canteenHistory, from, to]);

  const title = TITLES[kind];
  const sigs = <Signatures blocks={[{ role: 'បានឃើញ និងឯកភាព', name: settings.directorName }, { role: 'រៀបចំ និងត្រួតពិនិត្យ', name: settings.accountantName }]} />;

  return (
    <div className="space-y-4">
      <ReportToolbar title={`${title.km} (${title.en})`} subtitle="Monthly Report · ជ្រើសរើសកាលបរិច្ឆេទ (Select Date)">
        {kind === 'tuition_fee' && (
          <Field label="ថ្នាក់ (Select Class)">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputCls}>
              {(orderedClassList || Object.values(classData || {})).map((c: any) => (
                <option key={c.classId} value={c.classId}>{c.className}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="ពីថ្ងៃ (From)">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
        </Field>
        <Field label="ដល់ថ្ងៃ (To)">
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
        </Field>
        <PrintButton />
      </ReportToolbar>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 print:border-0 print:p-0 space-y-4">
        <SheetHeader
          title={`${title.km} / ${title.en}`}
          subtitle={`${longDate(from)} _ ${longDate(to)}${kind === 'tuition_fee' && tuition?.cls ? ` · ${tuition.cls.className}` : ''}`}
        />

        {tuition && (
          <>
            <XTable head={['ID', 'Student Name', 'Gender', 'Fees Group', 'Start Date', 'Payment Date', 'Cash Paid', 'Pay by']}>
              {tuition.rows.length === 0 ? <EmptyRow cols={8} /> : tuition.rows.map((r, i) => (
                <tr key={i} className={r.group === 'Unpaid' ? 'bg-rose-50/60' : r.group === 'Already' ? 'bg-sky-50/60' : ''}>
                  <td className={`${td} text-center font-mono`}>{r.id}</td>
                  <td className={`${td} font-bold`}>{r.name}</td>
                  <td className={`${td} text-center`}>{r.gender}</td>
                  <td className={`${td} text-center ${r.group === 'Unpaid' ? 'font-bold text-rose-700' : ''}`}>{r.group}</td>
                  <td className={`${td} text-center font-mono`}>{r.start}</td>
                  <td className={`${td} text-center font-mono`}>{r.payDate}</td>
                  <td className={`${td} text-right font-mono`}>{riel(r.amount, false)}</td>
                  <td className={`${td} text-center`}>{r.payBy}</td>
                </tr>
              ))}
            </XTable>
            <div className="max-w-md">
              <XTable
                head={['Fees Group', 'Quantity', 'Cash Paid']}
                foot={<tr><td className={td}>Total</td><td className={`${td} text-center font-mono`}>{tuition.totalQty}</td><td className={`${td} text-right font-mono`}>{riel(tuition.totalAmount)}</td></tr>}
              >
                {tuition.summary.map(([g, v]) => (
                  <tr key={g}>
                    <td className={`${td} font-bold ${g === 'Unpaid' ? 'text-rose-700' : ''}`}>{g}</td>
                    <td className={`${td} text-center font-mono`}>{v.qty}</td>
                    <td className={`${td} text-right font-mono`}>{v.amount ? riel(v.amount, false) : ''}</td>
                  </tr>
                ))}
              </XTable>
            </div>
          </>
        )}

        {uniform && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {uniform.tables.length === 0 && <div className="text-xs text-slate-400 font-khmer">មិនមានការលក់ឯកសណ្ឋានក្នុងកំឡុងពេលនេះ</div>}
              {uniform.tables.map((tb) => (
                <div key={tb.type}>
                  <h4 className="mb-1.5 text-xs font-bold text-slate-800 font-khmer">{tb.type}</h4>
                  <XTable
                    head={['Clothing Size', 'Quantity', 'Cash Paid']}
                    foot={<tr><td className={td}>Total</td><td className={`${td} text-center font-mono`}>{tb.qty}</td><td className={`${td} text-right font-mono`}>{riel(tb.amount)}</td></tr>}
                  >
                    {tb.rows.map(([size, v]) => (
                      <tr key={size}>
                        <td className={`${td} text-center font-mono`}>{size}</td>
                        <td className={`${td} text-center font-mono`}>{v.qty}</td>
                        <td className={`${td} text-right font-mono`}>{riel(v.amount, false)}</td>
                      </tr>
                    ))}
                  </XTable>
                </div>
              ))}
            </div>
            <div className="ml-auto max-w-xs">
              <XTable head={['', 'Quantity', 'Cash Paid']}>
                <tr className="font-bold"><td className={td}>Total</td><td className={`${td} text-center font-mono`}>{uniform.qty}</td><td className={`${td} text-right font-mono`}>{riel(uniform.amount)}</td></tr>
              </XTable>
            </div>
          </>
        )}

        {materials && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[materials.left, materials.right].map((half, hi) => (
                <XTable key={hi} head={['Item Name', 'Quantity', 'Cash']}>
                  {half.length === 0 ? <EmptyRow cols={3} /> : half.map((r) => (
                    <tr key={r.name}>
                      <td className={`${td} font-bold`}>{r.name}</td>
                      <td className={`${td} text-center font-mono`}>{r.qty}</td>
                      <td className={`${td} text-right font-mono`}>{riel(r.amount, false)}</td>
                    </tr>
                  ))}
                </XTable>
              ))}
            </div>
            <div className="ml-auto max-w-xs">
              <XTable head={['', 'Total']}>
                <tr className="font-bold"><td className={td}>Total</td><td className={`${td} text-right font-mono`}>{riel(materials.total)}</td></tr>
              </XTable>
            </div>
          </>
        )}

        {bus && (
          bus.rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm font-khmer text-slate-500">
              បច្ចុប្បន្នមិនទាន់មានសេវាកម្មនេះទេ / មិនមានការបង់ប្រាក់ក្នុងកំឡុងពេលនេះ
            </div>
          ) : (
            <XTable
              head={['ID', 'Student Name', 'Class', 'Fees Group', 'Payment Date', 'Cash Paid', 'Pay by']}
              foot={<tr><td colSpan={5} className={`${td} text-right`}>Total</td><td className={`${td} text-right font-mono`}>{riel(bus.total)}</td><td className={td} /></tr>}
            >
              {bus.rows.map((t, i) => (
                <tr key={t.id}>
                  <td className={`${td} text-center font-mono`}>{i + 1}</td>
                  <td className={`${td} font-bold`}>{t.payerName}</td>
                  <td className={`${td} text-center`}>{t.rawDetails?.className || t.rawDetails?.classId || ''}</td>
                  <td className={`${td} text-center`}>{monthOnly(t.rawDetails?.months?.[0] || t.rawDetails?.month || '')}</td>
                  <td className={`${td} text-center font-mono`}>{shortDate(t.date)}</td>
                  <td className={`${td} text-right font-mono`}>{riel(t.amountKHR, false)}</td>
                  <td className={`${td} text-center`}>{payBy(t.paidBy)}</td>
                </tr>
              ))}
            </XTable>
          )
        )}

        {stall && (
          <XTable
            head={['Date', ...stall.vendorIds.map((id) => stall.vendors.get(id) || id), 'Quantity', 'Amount To Be Paid', 'Total']}
            foot={<tr><td colSpan={stall.vendorIds.length + 3} className={`${td} text-right`}>Total</td><td className={`${td} text-right font-mono`}>{riel(stall.total)}</td></tr>}
          >
            {stall.days.length === 0 ? <EmptyRow cols={stall.vendorIds.length + 4} /> : stall.days.map((d) => (
              <tr key={d.date}>
                <td className={`${td} text-center font-mono`}>{shortDate(d.date)}</td>
                {stall.vendorIds.map((id) => (
                  <td key={id} className={`${td} text-right font-mono ${d.cells[id] ? '' : 'text-rose-600'}`}>{riel(d.cells[id] || 0, false)}</td>
                ))}
                <td className={`${td} text-center font-mono`}>{d.qty}</td>
                <td className={`${td} text-right font-mono`}>{riel(d.due, false)}</td>
                <td className={`${td} text-right font-mono font-bold`}>{riel(d.total, false)}</td>
              </tr>
            ))}
          </XTable>
        )}

        {sigs}
      </div>
    </div>
  );
};
