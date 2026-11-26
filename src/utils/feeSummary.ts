import type { StudentFeeRecord, StudentFeePaymentItem, StudentFeeSummaryRow } from '../types';

import { caseRate, DEFAULT_FULL_FEE_USD } from './tuition';

const recordMonths = (rec: StudentFeePaymentItem): string[] =>
  rec.months && rec.months.length > 0
    ? rec.months
    : (rec.month || '').split(',').map((m) => m.trim()).filter(Boolean);

/**
 * Fee summary (5 official rows) for ONE month, e.g. "November" + 2026.
 * Built from each student's payment history so it follows the month chosen in the filter.
 * Students without a history for that month fall back to their legacy single-month fields.
 */
export function computeMonthlyFeeSummary(
  students: StudentFeeRecord[],
  month: string,
  year: number | string,
  fullFee: number = DEFAULT_FULL_FEE_USD
): { rows: StudentFeeSummaryRow[]; totalCollected: number } {
  const rateFor = (s: StudentFeeRecord) => caseRate(s.caseType, fullFee);
  const m = month.trim().toLowerCase();
  const full = `${m} ${year}`;
  const isTarget = (entry: string) => {
    const e = entry.trim().toLowerCase();
    return e === full || e === m;
  };

  const blank = () => ({ general: 0, contribute: 0, fiftyPercent: 0, free: 0, cash: 0 });
  const due = blank(), stopped = blank(), prepaid = blank(), unpaid = blank(), paid = blank();
  const add = (b: ReturnType<typeof blank>, s: StudentFeeRecord, cash: number) => {
    if (s.caseType === 'Full') b.general++;
    else if (s.caseType === 'Contribute') b.contribute++;
    else if (s.caseType === '50%') b.fiftyPercent++;
    else if (s.caseType === 'Free') b.free++;
    b.cash += cash;
  };

  students.forEach((s) => {
    const group = (s.feesGroup || '').toLowerCase();
    add(due, s, 0);

    if (group.includes('stop')) {
      add(stopped, s, rateFor(s));
      return;
    }
    // Free students study without paying: never "unpaid"
    if (s.caseType === 'Free') return;

    const rec = (s.feeHistory || []).find(
      (r) => r.status !== 'pending' && recordMonths(r).some(isTarget)
    );
    if (rec) {
      const list = recordMonths(rec);
      const count = rec.monthsCount || list.length || 1;
      const perMonth =
        rec.feePerMonthUSD != null
          ? Math.max(0, rec.feePerMonthUSD - (rec.discountUSD || 0) / count)
          : (rec.amountUSD || 0) / count;
      // Paid for this month as part of an advance (multi-month) payment that started earlier
      const idx = list.findIndex(isTarget);
      if (rec.status === 'prepaid' || idx > 0) add(prepaid, s, perMonth);
      else add(paid, s, perMonth);
      return;
    }

    // Legacy records (no payment history for the month)
    if (group === m && s.cash > 0) add(paid, s, s.cash);
    else if (group.includes('already') && (s.feeHistory || []).length === 0) add(prepaid, s, s.cash || rateFor(s));
    else add(unpaid, s, rateFor(s));
  });

  const total = (b: ReturnType<typeof blank>) => b.general + b.contribute + b.fiftyPercent + b.free;
  const row = (id: number, caseKhmer: string, b: ReturnType<typeof blank>, cash = b.cash): StudentFeeSummaryRow => ({
    id,
    caseKhmer,
    general: b.general,
    contribute: b.contribute,
    fiftyPercent: b.fiftyPercent,
    free: b.free,
    totalStudents: total(b),
    totalCash: Math.round(cash * 100) / 100,
  });

  const rows: StudentFeeSummaryRow[] = [
    row(1, `ចំនួនសិស្សត្រូវបង់ខែ ${month}`, due, paid.cash + unpaid.cash + prepaid.cash),
    row(2, `សិស្សឈប់រៀនក្នុងខែ ${month}`, stopped),
    row(3, 'សិស្សបានបង់ពីខែមុនរួច', prepaid),
    row(4, `សិស្សមិនទាន់បង់ខែ ${month}`, unpaid),
    row(5, `សិស្សបានបង់ខែ ${month}`, paid),
  ];
  return { rows, totalCollected: Math.round(paid.cash * 100) / 100 };
}
