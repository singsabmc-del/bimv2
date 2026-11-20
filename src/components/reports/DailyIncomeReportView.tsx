// Reporting Section → Daily Income Report (layout of "Reporting Section.xlsx", amounts in Riel)
import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { normalizeDateToISO } from '../../utils/transactions';
import {
  useAllTransactions, riel, longDate, todayISO, isCashMethod,
  PrintButton, ReportToolbar, Field, inputCls, SheetHeader, XTable, td, Signatures, EmptyRow,
} from './ReportKit';

const monthOnly = (m: string) => (m || '').trim().split(/\s+/)[0];
const genderLabel = (g?: string) => (g === 'Female' ? 'Female' : g === 'Man' ? 'Man' : g || '');
const payBy = (p?: string) => (!p || p === '$ -' ? 'Cash' : p);

export const DailyIncomeReportView: React.FC = () => {
  const { settings, canteenHistory, classData } = useApp();
  const all = useAllTransactions();
  const [date, setDate] = useState(todayISO());

  const day = useMemo(() => all.filter((t) => t.date === date), [all, date]);

  const totals = useMemo(() => {
    let cash = 0, bank = 0;
    day.forEach((t) => (isCashMethod(t.paidBy) ? (cash += t.amountKHR) : (bank += t.amountKHR)));
    return { cash, bank, total: cash + bank };
  }, [day]);

  // Tuition: one row per month paid (as in the Excel sheet)
  const tuitionRows = useMemo(() => {
    const rows: { name: string; gender: string; cls: string; group: string; amount: number; payBy: string }[] = [];
    day.filter((t) => t.category === 'tuition').forEach((t) => {
      const st = t.rawDetails?.student;
      const rec = t.rawDetails?.receipt;
      const months: string[] = rec?.months?.length ? rec.months : [rec?.month || ''];
      const per = t.amountKHR / (months.length || 1);
      months.forEach((m) =>
        rows.push({
          name: st?.name || t.payerName,
          gender: genderLabel(st?.gender),
          cls: t.rawDetails?.className || '',
          group: monthOnly(m),
          amount: per,
          payBy: payBy(t.paidBy),
        })
      );
    });
    return rows;
  }, [day]);

  const busRows = useMemo(
    () =>
      day.filter((t) => t.category === 'bus').map((t) => {
        const bp = t.rawDetails || {};
        const st = Object.values(classData || {}).flatMap((c) => c.students).find((s) => s.id === bp.studentId);
        return {
          name: t.payerName,
          gender: genderLabel(st?.gender),
          cls: bp.className || bp.classId || '',
          group: monthOnly((bp.months && bp.months[0]) || bp.month || ''),
          amount: t.amountKHR,
          payBy: payBy(t.paidBy),
        };
      }),
    [day, classData]
  );

  const uniformRows = useMemo(
    () =>
      day.filter((t) => t.category === 'uniform').map((t) => ({
        name: t.payerName,
        size: t.rawDetails?.size || '',
        qty: t.rawDetails?.quantity || 0,
        group: t.rawDetails?.typeNameKhmer || t.rawDetails?.type || '',
        amount: t.amountKHR,
        payBy: payBy(t.paidBy),
      })),
    [day]
  );

  const materialRows = useMemo(() => {
    const map = new Map<string, { qty: number; amount: number }>();
    day.filter((t) => t.category === 'material').forEach((t) => {
      const name = t.rawDetails?.itemName || t.description;
      const cur = map.get(name) || { qty: 0, amount: 0 };
      cur.qty += t.rawDetails?.quantity || 0;
      cur.amount += t.amountKHR;
      map.set(name, cur);
    });
    return Array.from(map.entries()).map(([name, v]) => ({ name, ...v }));
  }, [day]);

  // Stall fee: every seller recorded that day, paid or not
  const stallRows = useMemo(() => {
    const rows: { name: string; unpaid: number; paid: number }[] = [];
    Object.values(canteenHistory || {}).forEach((rep: any) => {
      (rep?.dailyRecords || []).forEach((dr: any) => {
        if (normalizeDateToISO(dr.date) !== date) return;
        Object.entries(dr.vendorStatus || {}).forEach(([vId, vs]: [string, any]) => {
          const vendor = (rep.vendors || []).find((v: any) => v.id === vId);
          const fee = vendor?.dailyFeeKHR || dr.standardFeeKHR || 10000;
          const paid = vs.status === 'paid' || vs.status === 'double_paid' ? vs.amountKHR || fee : 0;
          const unpaid = vs.status === 'unpaid' ? fee : 0;
          rows.push({ name: vendor?.name || vId, unpaid, paid });
        });
      });
    });
    return rows;
  }, [canteenHistory, date]);

  const sum = <T,>(arr: T[], f: (x: T) => number) => arr.reduce((n, x) => n + f(x), 0);

  return (
    <div className="space-y-4">
      <ReportToolbar title="របាយការណ៍ចំណូលប្រចាំថ្ងៃ (Daily Income Report)" subtitle="ជ្រើសរើសកាលបរិច្ឆេទ ដើម្បីមើល និងបោះពុម្ព">
        <Field label="កាលបរិច្ឆេទ (Select Date)">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </Field>
        <PrintButton />
      </ReportToolbar>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 print:border-0 print:p-0 space-y-5">
        <SheetHeader title="របាយការណ៍ប្រាក់ចំណូលប្រចាំថ្ងៃ / Daily Income Report" subtitle={`Date: ${longDate(date)}`} />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-3">
            {/* Total money collected */}
            <div>
              <h4 className="mb-1.5 text-xs font-bold text-slate-800 font-khmer">ទឹកប្រាក់សរុបដែលបានប្រមូល (Total Money Collected)</h4>
              <XTable head={['សាច់ប្រាក់ (Cash)', 'គណនី ABA (Cash in ABA account)', 'សរុប (Total)']}>
                <tr>
                  <td className={`${td} text-right font-mono`}>{riel(totals.cash)}</td>
                  <td className={`${td} text-right font-mono`}>{riel(totals.bank)}</td>
                  <td className={`${td} text-right font-mono font-bold`}>{riel(totals.total)}</td>
                </tr>
              </XTable>
            </div>

            {/* Student payment */}
            <div>
              <h4 className="mb-1.5 text-xs font-bold text-slate-800 font-khmer">ថ្លៃសិក្សាសិស្ស (Student Payment)</h4>
              <XTable
                head={['ID', 'Student Name', 'Gender', 'Class', 'Fees Group', 'Cash Paid', 'Pay by']}
                foot={<tr><td colSpan={5} className={`${td} text-right`}>Total</td><td className={`${td} text-right font-mono`}>{riel(sum(tuitionRows, (r) => r.amount))}</td><td className={td} /></tr>}
              >
                {tuitionRows.length === 0 ? <EmptyRow cols={7} /> : tuitionRows.map((r, i) => (
                  <tr key={i}>
                    <td className={`${td} text-center font-mono`}>{i + 1}</td>
                    <td className={`${td} font-bold`}>{r.name}</td>
                    <td className={`${td} text-center`}>{r.gender}</td>
                    <td className={`${td} text-center`}>{r.cls}</td>
                    <td className={`${td} text-center`}>{r.group}</td>
                    <td className={`${td} text-right font-mono`}>{riel(r.amount, false)}</td>
                    <td className={`${td} text-center`}>{r.payBy}</td>
                  </tr>
                ))}
              </XTable>
            </div>

            {/* Uniform */}
            <div>
              <h4 className="mb-1.5 text-xs font-bold text-slate-800 font-khmer">ឯកសណ្ឋាន (Uniform Payment)</h4>
              <XTable
                head={['ID', 'Student Name', 'Clothing Size', 'Quantity', 'Uniformed Group', 'Cash Paid', 'Pay by']}
                foot={<tr><td colSpan={3} className={`${td} text-right`}>Total</td><td className={`${td} text-center font-mono`}>{sum(uniformRows, (r) => r.qty)}</td><td className={td} /><td className={`${td} text-right font-mono`}>{riel(sum(uniformRows, (r) => r.amount))}</td><td className={td} /></tr>}
              >
                {uniformRows.length === 0 ? <EmptyRow cols={7} /> : uniformRows.map((r, i) => (
                  <tr key={i}>
                    <td className={`${td} text-center font-mono`}>{i + 1}</td>
                    <td className={`${td} font-bold`}>{r.name}</td>
                    <td className={`${td} text-center`}>{r.size}</td>
                    <td className={`${td} text-center font-mono`}>{r.qty}</td>
                    <td className={`${td} text-center`}>{r.group}</td>
                    <td className={`${td} text-right font-mono`}>{riel(r.amount, false)}</td>
                    <td className={`${td} text-center`}>{r.payBy}</td>
                  </tr>
                ))}
              </XTable>
            </div>

            {/* Transportation */}
            <div>
              <h4 className="mb-1.5 text-xs font-bold text-slate-800 font-khmer">សេវាដឹកជញ្ជូនសិស្ស (Student Transportation)</h4>
              <XTable
                head={['ID', 'Student Name', 'Gender', 'Class', 'Fees Group', 'Cash Paid', 'Pay by']}
                foot={<tr><td colSpan={5} className={`${td} text-right`}>Total</td><td className={`${td} text-right font-mono`}>{riel(sum(busRows, (r) => r.amount))}</td><td className={td} /></tr>}
              >
                {busRows.length === 0 ? <EmptyRow cols={7} /> : busRows.map((r, i) => (
                  <tr key={i}>
                    <td className={`${td} text-center font-mono`}>{i + 1}</td>
                    <td className={`${td} font-bold`}>{r.name}</td>
                    <td className={`${td} text-center`}>{r.gender}</td>
                    <td className={`${td} text-center`}>{r.cls}</td>
                    <td className={`${td} text-center`}>{r.group}</td>
                    <td className={`${td} text-right font-mono`}>{riel(r.amount, false)}</td>
                    <td className={`${td} text-center`}>{r.payBy}</td>
                  </tr>
                ))}
              </XTable>
            </div>
          </div>

          <div className="space-y-5 lg:col-span-2">
            {/* Study materials */}
            <div>
              <h4 className="mb-1.5 text-xs font-bold text-slate-800 font-khmer">លក់សម្ភារៈសិក្សា (Sales Of Study Materials)</h4>
              <XTable
                head={['Item Name', 'Quantity', 'Total']}
                foot={<tr><td colSpan={2} className={`${td} text-right`}>Total</td><td className={`${td} text-right font-mono`}>{riel(sum(materialRows, (r) => r.amount))}</td></tr>}
              >
                {materialRows.length === 0 ? <EmptyRow cols={3} /> : materialRows.map((r) => (
                  <tr key={r.name}>
                    <td className={`${td} font-bold`}>{r.name}</td>
                    <td className={`${td} text-center font-mono`}>{r.qty}</td>
                    <td className={`${td} text-right font-mono`}>{riel(r.amount, false)}</td>
                  </tr>
                ))}
              </XTable>
            </div>

            {/* Stall fee */}
            <div>
              <h4 className="mb-1.5 text-xs font-bold text-slate-800 font-khmer">ថ្លៃតូប (Stall Fee)</h4>
              <XTable
                head={["Seller's Name", 'Unpaid money', 'Total']}
                foot={<tr><td className={`${td} text-right`}>Total</td><td className={`${td} text-right font-mono`}>{riel(sum(stallRows, (r) => r.unpaid), false)}</td><td className={`${td} text-right font-mono`}>{riel(sum(stallRows, (r) => r.paid))}</td></tr>}
              >
                {stallRows.length === 0 ? <EmptyRow cols={3} /> : stallRows.map((r, i) => (
                  <tr key={i}>
                    <td className={`${td} font-bold`}>{r.name}</td>
                    <td className={`${td} text-right font-mono ${r.unpaid ? 'text-rose-700' : ''}`}>{riel(r.unpaid, false)}</td>
                    <td className={`${td} text-right font-mono`}>{riel(r.paid, false)}</td>
                  </tr>
                ))}
              </XTable>
            </div>
          </div>
        </div>

        <Signatures blocks={[{ role: 'បានឃើញ និងឯកភាព', name: settings.directorName }, { role: 'រៀបចំ និងពិនិត្យដោយ', name: settings.accountantName }]} />
      </div>
    </div>
  );
};
