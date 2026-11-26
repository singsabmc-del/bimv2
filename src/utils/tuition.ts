// Tuition cases (ប្រភេទថ្លៃសិក្សា):
//   Full       — 100% of the class's monthly tuition
//   50%        — half of the class's monthly tuition
//   Contribute — a flat $5 / month for every class level
//   Free       — studies free of charge ($0)
// The full monthly tuition is set per class (ClassFeeData.fullFeeUSD); $12.50 when not set.
import type { ClassFeeData, StudentFeeRecord } from '../types';

export type TuitionCase = StudentFeeRecord['caseType'];

export const DEFAULT_FULL_FEE_USD = 12.5;
export const CONTRIBUTE_FEE_USD = 5;

export const TUITION_CASES: { value: TuitionCase; en: string; kh: string }[] = [
  { value: 'Full', en: 'Full 100%', kh: 'បង់តម្លៃពេញ' },
  { value: '50%', en: '50%', kh: 'បង់ពាក់កណ្តាល' },
  { value: 'Contribute', en: 'Contribute', kh: 'បង់ $5 គ្រប់កម្រិត' },
  { value: 'Free', en: 'Free', kh: 'រៀនមិនគិតថ្លៃ' },
];

export const fullFeeOf = (cls?: Pick<ClassFeeData, 'fullFeeUSD'> | null): number => {
  const v = Number(cls?.fullFeeUSD);
  return v > 0 ? v : DEFAULT_FULL_FEE_USD;
};

/** Standard monthly fee (USD) for a case, given the class's full fee */
export const caseRate = (caseType: string | undefined, fullFee: number = DEFAULT_FULL_FEE_USD): number => {
  switch (caseType) {
    case 'Free':
      return 0;
    case '50%':
      return Math.round((fullFee / 2) * 100) / 100;
    case 'Contribute':
      return CONTRIBUTE_FEE_USD;
    default:
      return fullFee;
  }
};

export const isFreeCase = (caseType?: string) => caseType === 'Free';

/** "Full 100% ($12.50)" style option label */
export const caseOptionLabel = (c: (typeof TUITION_CASES)[number], fullFee: number) =>
  `${c.en} · ${c.kh} ($${caseRate(c.value, fullFee).toFixed(2)})`;
