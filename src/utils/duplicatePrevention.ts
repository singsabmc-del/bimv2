import { ClassFeeData, StudentFeeRecord, StudentFeePaymentItem, BusStudentEnrollment } from '../types';

export interface DuplicateStudentCheckResult {
  isDuplicateCode: boolean;
  isDuplicateNameInClass: boolean;
  isDuplicateNameCrossClass: boolean;
  matchedStudent?: StudentFeeRecord;
  matchedClassName?: string;
  matchedClassId?: string;
  errorMessage?: string;
  warningMessage?: string;
  canProceed: boolean;
}

/**
 * Normalizes text for lenient Cambodian name comparisons (trims, collapses multiple spaces, case-insensitive).
 */
export const normalizeText = (text?: string): string => {
  if (!text) return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
};

/**
 * Checks for duplicate student code or name across all classes.
 */
export const checkDuplicateStudent = (
  classData: { [classId: string]: ClassFeeData },
  studentInfo: {
    studentCode?: string;
    nameKhmer: string;
    dob?: string;
    phone?: string;
  },
  targetClassId: string,
  excludeStudentId?: number
): DuplicateStudentCheckResult => {
  const normName = normalizeText(studentInfo.nameKhmer);
  const normCode = normalizeText(studentInfo.studentCode);
  const normPhone = normalizeText(studentInfo.phone);
  const normDob = studentInfo.dob?.trim();

  let isDuplicateCode = false;
  let isDuplicateNameInClass = false;
  let isDuplicateNameCrossClass = false;
  let matchedStudent: StudentFeeRecord | undefined;
  let matchedClassName: string | undefined;
  let matchedClassId: string | undefined;

  if (!normName && !normCode) {
    return {
      isDuplicateCode: false,
      isDuplicateNameInClass: false,
      isDuplicateNameCrossClass: false,
      canProceed: true,
    };
  }

  // Iterate all classes
  for (const cls of Object.values(classData)) {
    for (const st of cls.students) {
      // Skip the student being edited
      if (excludeStudentId !== undefined && st.id === excludeStudentId && cls.classId === targetClassId) {
        continue;
      }

      // 1. Strict Duplicate Student Code (Hard block)
      if (normCode && normalizeText(st.studentCode) === normCode) {
        isDuplicateCode = true;
        matchedStudent = st;
        matchedClassName = cls.className;
        matchedClassId = cls.classId;
        return {
          isDuplicateCode: true,
          isDuplicateNameInClass: cls.classId === targetClassId,
          isDuplicateNameCrossClass: cls.classId !== targetClassId,
          matchedStudent,
          matchedClassName,
          matchedClassId,
          errorMessage: `អត្តលេខសិស្ស «${st.studentCode}» ត្រូវបានប្រើប្រាស់រួចហើយសម្រាប់សិស្ស «${st.name}» (${cls.className})! សូមបញ្ចូលអត្តលេខផ្សេង។`,
          canProceed: false,
        };
      }

      // 2. Check Name in target class
      if (normName && normalizeText(st.name) === normName) {
        if (cls.classId === targetClassId) {
          isDuplicateNameInClass = true;
          matchedStudent = st;
          matchedClassName = cls.className;
          matchedClassId = cls.classId;
        } else {
          // Cross-class check: match name + (DOB or phone or latin name)
          const stPhone = normalizeText(st.phone || st.guardianPhone);
          const stDob = st.dob?.trim();
          if ((normDob && stDob && normDob === stDob) || (normPhone && stPhone && normPhone === stPhone)) {
            isDuplicateNameCrossClass = true;
            matchedStudent = st;
            matchedClassName = cls.className;
            matchedClassId = cls.classId;
          }
        }
      }
    }
  }

  if (isDuplicateNameInClass && matchedStudent) {
    return {
      isDuplicateCode: false,
      isDuplicateNameInClass: true,
      isDuplicateNameCrossClass: false,
      matchedStudent,
      matchedClassName,
      matchedClassId,
      warningMessage: `រកឃើញឈ្មោះស្ទួនក្នុងថ្នាក់តែមួយ៖ មានសិស្សឈ្មោះ «${matchedStudent.name}» (អត្តលេខ: ${matchedStudent.studentCode}) រួចហើយក្នុង ${matchedClassName}!`,
      canProceed: false,
    };
  }

  if (isDuplicateNameCrossClass && matchedStudent) {
    return {
      isDuplicateCode: false,
      isDuplicateNameInClass: false,
      isDuplicateNameCrossClass: true,
      matchedStudent,
      matchedClassName,
      matchedClassId,
      warningMessage: `រកឃើញសិស្សស្ទួននៅថ្នាក់ផ្សេង៖ សិស្ស «${matchedStudent.name}» (អត្តលេខ: ${matchedStudent.studentCode}) កំពុងរៀននៅ ${matchedClassName}!`,
      canProceed: false,
    };
  }

  return {
    isDuplicateCode: false,
    isDuplicateNameInClass: false,
    isDuplicateNameCrossClass: false,
    canProceed: true,
  };
};

/**
 * Checks if payment for selected month(s) has already been recorded for a student.
 */
export const checkDuplicatePayment = (
  student: StudentFeeRecord,
  selectedMonths: string[]
): {
  hasDuplicate: boolean;
  duplicateMonths: string[];
  matchedReceipts: StudentFeePaymentItem[];
  warningMessage?: string;
} => {
  if (!student.feeHistory || student.feeHistory.length === 0 || selectedMonths.length === 0) {
    return { hasDuplicate: false, duplicateMonths: [], matchedReceipts: [] };
  }

  const duplicateMonths: string[] = [];
  const matchedReceipts: StudentFeePaymentItem[] = [];

  for (const m of selectedMonths) {
    const normTarget = normalizeText(m);
    for (const rec of student.feeHistory) {
      if (rec.status !== 'paid' && rec.status !== 'prepaid') continue;

      let isPaid = false;
      if (rec.months && rec.months.length > 0) {
        isPaid = rec.months.some((rm) => normalizeText(rm) === normTarget);
      } else if (rec.month) {
        isPaid = normalizeText(rec.month) === normTarget;
      }

      if (isPaid) {
        if (!duplicateMonths.includes(m)) duplicateMonths.push(m);
        if (!matchedReceipts.some((r) => r.receiptNo === rec.receiptNo)) {
          matchedReceipts.push(rec);
        }
      }
    }
  }

  if (duplicateMonths.length > 0) {
    const monthsText = duplicateMonths.join(', ');
    const firstReceipt = matchedReceipts[0];
    const receiptInfo = firstReceipt ? ` (វិក្កយបត្រ #${firstReceipt.invoiceNo || firstReceipt.receiptNo} ថ្ងៃទី ${firstReceipt.date})` : '';
    return {
      hasDuplicate: true,
      duplicateMonths,
      matchedReceipts,
      warningMessage: `ការព្រមានបង់ប្រាក់ស្ទួន៖ ខែ [${monthsText}] សិស្សនេះបានបង់រួចរាល់ហើយ${receiptInfo}!`,
    };
  }

  return { hasDuplicate: false, duplicateMonths: [], matchedReceipts: [] };
};

/**
 * Checks if a class name is duplicate.
 */
export const checkDuplicateClass = (
  classData: { [classId: string]: ClassFeeData },
  className: string,
  excludeClassId?: string
): { isDuplicate: boolean; matchedClass?: ClassFeeData; errorMessage?: string } => {
  const norm = normalizeText(className);
  if (!norm) return { isDuplicate: false };

  for (const cls of Object.values(classData)) {
    if (excludeClassId && cls.classId === excludeClassId) continue;
    if (normalizeText(cls.className) === norm) {
      return {
        isDuplicate: true,
        matchedClass: cls,
        errorMessage: `ថ្នាក់ឈ្មោះ «${cls.className}» មានក្នុងប្រព័ន្ធរួចរាល់ហើយ! មិនអាចបង្កើតថ្នាក់ឈ្មោះស្ទួនបានទេ។`,
      };
    }
  }

  return { isDuplicate: false };
};

/**
 * Checks if a stationery/materials item is duplicate.
 */
export const checkDuplicateMaterialItem = (
  items: Array<{ id: number; name: string }>,
  itemName: string,
  excludeItemId?: number
): { isDuplicate: boolean; errorMessage?: string } => {
  const norm = normalizeText(itemName);
  if (!norm) return { isDuplicate: false };

  const found = items.find((i) => i.id !== excludeItemId && normalizeText(i.name) === norm);
  if (found) {
    return {
      isDuplicate: true,
      errorMessage: `មុខទំនិញ «${found.name}» មានក្នុងបញ្ជីរួចរាល់ហើយ! សូមកុំបញ្ចូលស្ទួន។`,
    };
  }

  return { isDuplicate: false };
};

/**
 * Checks if a student is already enrolled on an active bus route.
 */
export const checkDuplicateBusEnrollment = (
  enrollments: BusStudentEnrollment[],
  studentId: number,
  routeId: string,
  excludeEnrollmentId?: string
): { isDuplicate: boolean; matchedEnrollment?: BusStudentEnrollment; errorMessage?: string } => {
  const found = enrollments.find(
    (e) =>
      e.id !== excludeEnrollmentId &&
      e.studentId === studentId &&
      e.routeId === routeId
  );

  if (found) {
    return {
      isDuplicate: true,
      matchedEnrollment: found,
      errorMessage: `សិស្សនេះបានចុះឈ្មោះក្នុងខ្សែរត់នេះរួចរាល់ហើយ!`,
    };
  }

  return { isDuplicate: false };
};
