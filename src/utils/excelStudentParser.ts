/**
 * Intelligent Excel & Table Parser for Student Information & Admission Form Auto-Mapping
 * Handles raw clipboard text (TSV / CSV / Tab-delimited) pasted from Excel or Google Sheets.
 */

import { StudentAdmissionData, StudentFeeRecord } from '../types';

export type TargetAdmissionField =
  | 'skip'
  | 'no'
  | 'name'
  | 'latinName'
  | 'gender'
  | 'note'
  | 'caseType'
  | 'dob'
  | 'phone'
  | 'phone2'
  | 'address'
  | 'fatherName'
  | 'motherName'
  | 'otherNotes';

export interface ColumnDefinition {
  field: TargetAdmissionField;
  labelKhmer: string;
  labelEnglish: string;
  required?: boolean;
}

export const TARGET_ADMISSION_COLUMNS: ColumnDefinition[] = [
  { field: 'skip', labelKhmer: '— មិនយក / រំលង —', labelEnglish: 'Skip Column' },
  { field: 'name', labelKhmer: 'ឈ្មោះសិស្ស (Khmer)', labelEnglish: 'Student Name *', required: true },
  { field: 'latinName', labelKhmer: 'ឈ្មោះជាឡាតាំង (Latin)', labelEnglish: 'Latin Name' },
  { field: 'gender', labelKhmer: 'ភេទ (Gender)', labelEnglish: 'Gender (Man/Female)' },
  { field: 'note', labelKhmer: 'ចំណាំ (Status/Note)', labelEnglish: 'Note (Old/New)' },
  { field: 'caseType', labelKhmer: 'ករណី (Case Type)', labelEnglish: 'Case (General/Landfill/FC)' },
  { field: 'dob', labelKhmer: 'ថ្ងៃខែកំណើត (DOB)', labelEnglish: 'Date of Birth (DD-MM-YYYY)' },
  { field: 'phone', labelKhmer: 'លេខទូរស័ព្ទ ១ (Phone 1)', labelEnglish: 'Primary Phone' },
  { field: 'phone2', labelKhmer: 'លេខទូរស័ព្ទ ២ (Phone 2)', labelEnglish: 'Secondary Phone' },
  { field: 'address', labelKhmer: 'លំនៅបច្ចុប្បន្ន (Address)', labelEnglish: 'Current Address' },
  { field: 'fatherName', labelKhmer: 'ឈ្មោះឪពុក (Father Name)', labelEnglish: "Father's Name" },
  { field: 'motherName', labelKhmer: 'ឈ្មោះម្តាយ (Mother Name)', labelEnglish: "Mother's Name" },
  { field: 'otherNotes', labelKhmer: 'ផ្សេងៗ (Other/Notes)', labelEnglish: 'Other Notes' },
  { field: 'no', labelKhmer: 'ល.រ (Row #)', labelEnglish: 'Row Number' },
];

export interface ParsedStudentRow {
  index: number;
  selected: boolean;
  rawValues: string[];
  // Mapped & Normalized Values
  name: string;
  latinName?: string;
  gender: 'Man' | 'Female';
  note: 'Old' | 'New';
  caseType: 'Full' | 'Contribute' | '50%';
  rawCase: string; // e.g. "General", "Landfill", "FC"
  dob: string; // YYYY-MM-DD
  phone: string;
  phone2?: string;
  address: string;
  fatherName?: string;
  motherName?: string;
  otherNotes?: string;
  // Validation status
  isValid: boolean;
  warnings: string[];
}

/**
 * Normalizes date strings (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, or Excel serial numbers)
 * into standard ISO format (YYYY-MM-DD).
 */
export function normalizeBirthDate(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed || trimmed.toLowerCase() === 'no' || trimmed === '-') return '';

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Excel serial date number (e.g., 43917)
  const num = Number(trimmed);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    try {
      const utcDays = Math.floor(num - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      return dateInfo.toISOString().slice(0, 10);
    } catch {
      // Fallback
    }
  }

  return trimmed;
}

/**
 * Normalizes gender input
 */
export function normalizeGender(raw: string): 'Man' | 'Female' {
  if (!raw) return 'Man';
  const val = raw.trim().toLowerCase();
  if (
    val === 'female' ||
    val === 'f' ||
    val === 'women' ||
    val === 'woman' ||
    val === 'ស្រី' ||
    val === 'ស'
  ) {
    return 'Female';
  }
  return 'Man';
}

/**
 * Normalizes student enrollment note/status
 */
export function normalizeStudentNote(raw: string): 'Old' | 'New' {
  if (!raw) return 'Old';
  const val = raw.trim().toLowerCase();
  if (val === 'new' || val === 'ថ្មី' || val === 'n') {
    return 'New';
  }
  return 'Old';
}

/**
 * Cleans phone strings ("No", "-", "0125290099" -> "0125290099")
 */
export function cleanPhoneNumber(raw?: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'no' || lower === 'គ្មាន' || lower === 'n/a' || lower === '-' || lower === 'none') {
    return '';
  }
  // Remove non-digit characters except +
  const cleaned = trimmed.replace(/[^\d+]/g, '');
  // Format leading 0 if missing for 8-9 digit local numbers
  if (/^\d{8,9}$/.test(cleaned) && !cleaned.startsWith('0')) {
    return '0' + cleaned;
  }
  return cleaned;
}

/**
 * Maps raw case name (General, Landfill, FC) to standard system caseType
 */
export function mapCaseType(raw?: string): { caseType: 'Full' | 'Contribute' | '50%'; rawCase: string } {
  if (!raw) return { caseType: 'Full', rawCase: 'General' };
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  if (lower === '50%' || lower.includes('fifty') || lower.includes('៥០')) {
    return { caseType: '50%', rawCase: trimmed };
  }
  if (lower.includes('contribute') || lower.includes('ឧបត្ថម្ភ') || lower === 'landfill') {
    // Landfill students are often on full scholarship or contribute basis
    return { caseType: 'Contribute', rawCase: trimmed };
  }
  if (lower === 'fc' || lower === 'full' || lower === 'general') {
    return { caseType: 'Full', rawCase: trimmed };
  }

  return { caseType: 'Full', rawCase: trimmed };
}

/**
 * Auto-detects column field based on header text or typical values
 */
export function detectColumnField(headerText: string, sampleValues: string[], colIndex: number, totalCols: number): TargetAdmissionField {
  const h = headerText.trim().toLowerCase();

  // 1. Check Row No
  if (h === 'ល.រ' || h === 'លរ' || h === 'no' || h === 'no.' || h === '#' || h === 'id') {
    return 'no';
  }

  // 2. Check Student Name
  if (
    h.includes('ឈ្មោះសិស្ស') ||
    h === 'ឈ្មោះ' ||
    h === 'name' ||
    h.includes('student name') ||
    h.includes('គោត្តនាម')
  ) {
    return 'name';
  }

  // 3. Check Latin Name
  if (
    h.includes('ឡាតាំង') ||
    h.includes('latin') ||
    h.includes('english name') ||
    h === 'latin'
  ) {
    return 'latinName';
  }

  // 4. Check Gender
  if (h.includes('ភេទ') || h === 'gender' || h === 'sex') {
    return 'gender';
  }

  // 5. Check Note / Status
  if (h.includes('ចំណាំ') || h === 'note' || h === 'status' || h === 'ចំណាំ (ចាស់/ថ្មី)') {
    return 'note';
  }

  // 6. Check Case
  if (h.includes('ករណី') || h === 'case' || h === 'case type' || h === 'condition') {
    return 'caseType';
  }

  // 7. Check Date of Birth
  if (
    h.includes('កំណើត') ||
    h.includes('dob') ||
    h.includes('birth') ||
    h === 'b-day' ||
    h === 'ថ្ងៃខែកំណើត'
  ) {
    return 'dob';
  }

  // 8. Check Phone numbers
  if (h.includes('ទូរស័ព្ទ') || h.includes('phone') || h.includes('tel')) {
    if (h.includes('២') || h.includes('2') || h.includes('បន្ទាប់បន្សំ') || h.includes('second')) {
      return 'phone2';
    }
    // If colIndex follows another phone column, default to phone2
    return 'phone';
  }

  // 9. Current Address
  if (h.includes('លំនៅ') || h.includes('អាសយដ្ឋាន') || h.includes('address') || h.includes('ទីលំនៅ')) {
    return 'address';
  }

  // 10. Father Name
  if (h.includes('ឪពុក') || h.includes('បិតា') || h.includes('father')) {
    return 'fatherName';
  }

  // 11. Mother Name
  if (h.includes('ម្តាយ') || h.includes('មាតា') || h.includes('mother')) {
    return 'motherName';
  }

  // 12. Other / Notes
  if (h.includes('ផ្សេង') || h.includes('other') || h.includes('remark') || h.includes('memo')) {
    return 'otherNotes';
  }

  // Content-based heuristic fallbacks if header was empty or generic
  const nonEmpties = sampleValues.filter(Boolean);
  if (nonEmpties.length > 0) {
    // Check if looks like DOB (e.g., 27-03-2020)
    if (nonEmpties.some((v) => /^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(v.trim()))) {
      return 'dob';
    }
    // Check if looks like Gender (Man/Female)
    if (nonEmpties.every((v) => ['man', 'female', 'm', 'f', 'ស្រី', 'ប្រុស'].includes(v.trim().toLowerCase()))) {
      return 'gender';
    }
    // Check if looks like Note (Old/New)
    if (nonEmpties.every((v) => ['old', 'new', 'ចាស់', 'ថ្មី'].includes(v.trim().toLowerCase()))) {
      return 'note';
    }
    // Check if looks like Phone Number
    if (nonEmpties.some((v) => /^\d{8,12}$/.test(v.replace(/\D/g, '')) || v.toLowerCase() === 'no')) {
      return colIndex > 6 ? 'phone2' : 'phone';
    }
  }

  return 'skip';
}

/**
 * Splits raw pasted clipboard text into a 2D matrix of strings.
 * Handles Tab-separated (Excel / Google Sheets), Comma-separated (CSV), or semicolons.
 */
export function parsePastedTable(rawText: string): string[][] {
  if (!rawText || !rawText.trim()) return [];

  // Normalize line endings
  const lines = rawText.split(/\r\n|\n|\r/);

  return lines
    .map((line) => {
      // Determine delimiter: Excel copies as \t tabs
      if (line.includes('\t')) {
        return line.split('\t').map((c) => c.trim());
      }
      // CSV parsing fallback
      if (line.includes(',')) {
        return line.split(',').map((c) => c.trim().replace(/^"(.*)"$/, '$1'));
      }
      if (line.includes(';')) {
        return line.split(';').map((c) => c.trim());
      }
      return [line.trim()];
    })
    .filter((row) => row.some((c) => c.length > 0)); // Filter blank rows
}

/**
 * Determines whether the first row represents a header row.
 */
export function isHeaderRow(firstRow: string[]): boolean {
  if (!firstRow || firstRow.length === 0) return false;
  const headerKeywords = [
    'ល.រ',
    'លរ',
    'no',
    'ឈ្មោះ',
    'ឈ្មោះសិស្ស',
    'ភេទ',
    'gender',
    'ចំណាំ',
    'ករណី',
    'ថ្ងៃខែ',
    'កំណើត',
    'dob',
    'ទូរស័ព្ទ',
    'phone',
    'លំនៅ',
    'អាសយដ្ឋាន',
    'ឪពុក',
    'ម្តាយ',
    'ផ្សេងៗ',
  ];

  let matches = 0;
  firstRow.forEach((col) => {
    const lower = col.toLowerCase().trim();
    if (headerKeywords.some((kw) => lower.includes(kw))) {
      matches += 1;
    }
  });

  return matches >= 2;
}

/**
 * Converts parsed rows into full Student Admission & Fee records.
 */
export function buildStudentRecordsFromParsed(
  parsedRows: ParsedStudentRow[],
  targetClassId: string,
  academicYear = '2026-2027',
  schoolName = 'សាលា អ៊ីរ៉ែលកម្ពុជា / BIM Rangsei School'
): Array<Omit<StudentFeeRecord, 'id' | 'studentCode'> & { studentCode?: string }> {
  return parsedRows
    .filter((r) => r.selected && r.name.trim().length > 0)
    .map((row) => {
      const primaryPhone = row.phone || '';
      const secondaryPhone = row.phone2 || '';
      const guardianName = row.fatherName || row.motherName || 'អាណាព្យាបាល';
      const guardianPhone = secondaryPhone || primaryPhone || '';

      const admissionData: StudentAdmissionData = {
        nameKhmer: row.name,
        nameEnglish: row.latinName || undefined,
        gender: row.gender,
        dob: row.dob,
        nationality: 'ខ្មែរ',
        religion: 'ព្រះពុទ្ធ',
        permanentAddress: row.address,
        placeOfBirth: row.address ? `ភូមិ${row.address} ក្រុងប៉ោយប៉ែត ខេត្តបន្ទាយមានជ័យ` : 'ក្រុងប៉ោយប៉ែត ខេត្តបន្ទាយមានជ័យ',
        presentGrade: targetClassId,
        presentYear: academicYear,
        presentSchool: schoolName,
        declarationAccepted: true,
        father: row.fatherName
          ? {
              name: row.fatherName,
              phone: primaryPhone || undefined,
            }
          : undefined,
        mother: row.motherName
          ? {
              name: row.motherName,
              phone: secondaryPhone || undefined,
            }
          : undefined,
        caretaker: {
          name: guardianName,
          phone: guardianPhone || primaryPhone || undefined,
        },
        services: {
          breakfast: true,
          lunch: true,
          eveningFood: false,
        },
      };

      const defaultFee = row.caseType === 'Full' ? 12.5 : row.caseType === '50%' ? 6.25 : 5.0;

      return {
        name: row.name,
        latinName: row.latinName || undefined,
        gender: row.gender,
        note: row.note,
        caseType: row.caseType,
        feesGroup: 'October',
        startDate: new Date().toISOString().slice(0, 10),
        paymentDate: new Date().toISOString().slice(0, 10),
        paidBy: '$ -',
        cash: defaultFee,
        dob: row.dob || undefined,
        phone: primaryPhone || undefined,
        guardianName,
        guardianPhone: guardianPhone || undefined,
        address: row.address || undefined,
        nationality: 'ខ្មែរ',
        religion: 'ព្រះពុទ្ធ',
        placeOfBirth: admissionData.placeOfBirth,
        admissionData,
      };
    });
}

/**
 * Exact 15 sample student rows transcribed from the user's uploaded screenshot.
 * Allows instant 1-click testing!
 */
export const SCREENSHOT_SAMPLE_RAW_TSV = `ល.រ\tឈ្មោះសិស្ស\tភេទ\tចំណាំ\tករណី\tថ្ងៃខែកំណើត\tលេខទូរស័ព្ទ\tលេខទូរស័ព្ទ២\tលំនៅបច្ចុប្បន្ន\tឈ្មោះឪពុក\tឈ្មោះម្តាយ\tផ្សេងៗ
1\tវេន សុខលាភ\tMan\tOld\tGeneral\t27-03-2020\t0125290099\t0972833279\tទួលពង្រ\tវេន ប្រុស\tស៊ាន សេងលី\t
2\tក្រាប ចានអី\tMan\tOld\tGeneral\t19-08-2020\t092293374\t089953405\tអូរឫស្សី\tប៉ូ ក្រាប\tរ៉ាន សុខឡា\t
3\tប៉ា សៀវហោង\tFemale\tOld\tGeneral\t20-11-2020\t0964758628\tNo\tទួលពង្រ\tម៉ុក សុដា\tភឿន នាង\t
4\tវះ ចារ៉ូ\tMan\tOld\tLandfill\t30-10-2019\t010494954\t093404003\tទួលពង្រ\tសុខ ចោរ\tលាង ស្រីនាត\t
5\tធន សុភ័ណ្ឌា\tMan\tOld\tLandfill\t23-01-2020\t0616106060\t090904747\tទួលពង្រ\tយុក សុភី\tបាន ចន្ទី\t
6\tក្រាក់ ជីវែន\tMan\tOld\tLandfill\t11-05-2020\t0888502242\t0972781243\tទួលពង្រ\tផល ក្រាក់\tមាន សុផាត់\t
7\tវ៉ា ណាវី\tMan\tOld\tLandfill\t02-05-2020\t0888257476\tNo\tទួលពង្រ\tថា វ៉ា\tគី ឌី\t
8\tក្រា ស្រីណែត\tFemale\tOld\tLandfill\t07-06-2020\t076163099\tNo\tអូរឫស្សី\tវិទ ក្រា\tឈុន គឹមសេង\t
9\tចិត្រ ម៉ីលីង\tFemale\tOld\tGeneral\t\t\t\t\t\t\t
10\tគាត់ ធីតា\tFemale\tOld\tFC\t01-01-2020\t0976331788\t0883414698\tអូរឫស្សី\tយេង ស៊ីម\t\t
11\tរស្សី និញអី\tFemale\tNew\tGeneral\t16-02-2020\t078894167\tNo\tអូរឫស្សី\tឡាយ រស្សី\tទៀក វាន់ឌី\t
12\tដែន ដាណេ\tFemale\tNew\tGeneral\t08-12-2020\t0762047402\t089911608\tអូរឫស្សី\tយេង ដែន\tមុន សាវ៉ី\t
13\tម៉ិត ស្រីពេជ្រ\tFemale\tNew\tGeneral\t02-03-2020\t0971190342\tNo\tអូរឫស្សី\tក្រាប សាម៉េត\tថន ខួច\t
14\tយី លីម៉េង\tMan\tNew\tGeneral\t26-03-2020\t0975803760\tNo\tសិលាខ្មែរ\tយី ភិញ\tសន់ ស្រីពៅ\t
15\tឈឿន លីលី\tFemale\tNew\tGeneral\t19-09-2019\t0979558151\t0713009829\tទួលប្រាសាទ\tឆាត ឈឿន\tវ៉ាស្រីពៅ\t`;
