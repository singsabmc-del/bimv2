// Academic helpers: grades, ranks, monthly / semester / yearly results, Khmer numerals.
// Scores are always stored on a 0–100 scale. The study books show them on a /10 scale.
import { ClassFeeData, ClassScoreBook, DailyStudentAttendanceRecord, GradeDef, StudentFeeRecord, SubjectItem } from '../types';

// ───────────────────────── Khmer numerals & labels ─────────────────────────
const KH_DIGITS = '០១២៣៤៥៦៧៨៩';
export const toKh = (v: number | string | null | undefined): string =>
  v === null || v === undefined || v === '' ? '' : String(v).replace(/[0-9]/g, (d) => KH_DIGITS[Number(d)]);

export const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

/** "ភាសាខ្មែរ (Khmer Literature)" → "ភាសាខ្មែរ" */
export const subjectLabel = (s?: SubjectItem | null) => (s ? s.nameKhmer.split(' (')[0].trim() : '');

export const fmt = (n: number | null | undefined, digits = 2) =>
  n === null || n === undefined || Number.isNaN(n) ? '-' : Number(n.toFixed(digits)).toString();

// ───────────────────────── Grade scales ─────────────────────────
/** A–F on a 0–100 score (score sheets). */
export const GRADE_SCALE_100 = [
  { letter: 'A', min: 85, kh: 'ល្អប្រសើរ' },
  { letter: 'B', min: 80, kh: 'ល្អណាស់' },
  { letter: 'C', min: 70, kh: 'ល្អ' },
  { letter: 'D', min: 60, kh: 'ល្អបង្គួរ' },
  { letter: 'E', min: 50, kh: 'មធ្យម' },
  { letter: 'F', min: 0, kh: 'ខ្សោយ' },
] as const;

export const DEFAULT_GRADE_SCALE: GradeDef[] = [
  { letter: 'A', min: 85, kh: 'ល្អប្រសើរ', remark: 'ល្អប្រសើរណាស់ សូមរក្សាការខិតខំ' },
  { letter: 'B', min: 80, kh: 'ល្អណាស់', remark: 'ល្អណាស់ បន្តខិតខំ' },
  { letter: 'C', min: 70, kh: 'ល្អ', remark: 'ល្អ ត្រូវខិតខំបន្ថែម' },
  { letter: 'D', min: 60, kh: 'ល្អបង្គួរ', remark: 'ល្អបង្គួរ ត្រូវយកចិត្តទុកដាក់បន្ថែម' },
  { letter: 'E', min: 50, kh: 'មធ្យម', remark: 'មធ្យម ត្រូវរៀនសូត្របន្ថែម' },
  { letter: 'F', min: 0, kh: 'ខ្សោយ', remark: 'ខ្សោយ ត្រូវការជំនួយពិសេស' },
];
// Active scale (from System Settings); set once by the app when settings load/change
let ACTIVE_SCALE: GradeDef[] = [...GRADE_SCALE_100].map((g) => ({ ...g, remark: DEFAULT_GRADE_SCALE.find((d) => d.letter === g.letter)?.remark }));
export const setGradeScale = (scale?: GradeDef[] | null) => {
  if (scale && scale.length) ACTIVE_SCALE = [...scale].sort((a, b) => b.min - a.min);
};
export const getGradeScale = () => ACTIVE_SCALE;
const gradeOf = (pct: number | null | undefined) => {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return null;
  return ACTIVE_SCALE.find((g) => pct >= g.min) || ACTIVE_SCALE[ACTIVE_SCALE.length - 1];
};
/** Letter for a percent (0–100) */
export const gradeLetter = (pct: number | null | undefined): string => gradeOf(pct)?.letter || '-';
export const gradeKh = (pct: number | null | undefined): string => gradeOf(pct)?.kh || '';
/** មូលវិចារណ៍ for a percent */
export const gradeRemark = (pct: number | null | undefined): string => gradeOf(pct)?.remark || '';

// ───────────────────────── Max score & coefficient per subject ─────────────────────────
export interface SubjectCfg {
  max: number;
  coef: number;
}
export const subjectCfg = (cls: ClassFeeData | undefined, subjectId: string): SubjectCfg => {
  const c = cls?.subjectConfig?.[subjectId] || {};
  return { max: Number(c.max) > 0 ? Number(c.max) : 100, coef: Number(c.coef) > 0 ? Number(c.coef) : 1 };
};
export const toPct = (score: number | null | undefined, max = 100) =>
  score === null || score === undefined || Number.isNaN(score) ? null : (score / (max || 100)) * 100;
/** percent (0–100) → shown on the school's scale (/10, /20, /50, /100) */
export const scaleAvg = (pct: number | null | undefined, outOf = 100) =>
  pct === null || pct === undefined || Number.isNaN(pct) ? null : (pct * outOf) / 100;

/** Khmer levels on a /10 score (study tracking book). */
export const LEVELS_10 = [
  { key: 'good', kh: 'ល្អ', min: 8, range: '8-10', comment: 'លទ្ធផលល្អ សូមរក្សាការខិតខំ' },
  { key: 'fair', kh: 'ល្អបង្គួរ', min: 6.5, range: '6.5-7.99', comment: 'លទ្ធផលល្អបង្គួរ ត្រូវបន្តខិតខំបន្ថែម' },
  { key: 'avg', kh: 'មធ្យម', min: 5, range: '5-6.49', comment: 'លទ្ធផលមធ្យម ត្រូវយកចិត្តទុកដាក់បន្ថែម' },
  { key: 'weak', kh: 'ខ្សោយ', min: 0, range: '0-4.99', comment: 'លទ្ធផលខ្សោយ ត្រូវការជំនួយពិសេស' },
] as const;

export const level10 = (score10: number | null | undefined) => {
  if (score10 === null || score10 === undefined || Number.isNaN(score10)) return null;
  return LEVELS_10.find((l) => score10 >= l.min) || LEVELS_10[LEVELS_10.length - 1];
};

export const to10 = (score100: number | null | undefined) =>
  score100 === null || score100 === undefined || Number.isNaN(score100) ? null : Math.round(score100) / 10;

// ───────────────────────── Periods ─────────────────────────
export interface PeriodOption {
  key: string; // m-2026-10 | sem-1 | sem-2
  month?: number; // 1-12
  year?: number;
  labelKh: string;
}

/** Academic year "2026-2027" → months Oct 2026 … Sep 2027 + two semester exams. */
export const academicPeriods = (academicYear: string): PeriodOption[] => {
  const [y1Raw, y2Raw] = (academicYear || '2026-2027').split('-');
  const y1 = Number(y1Raw) || new Date().getFullYear();
  const y2 = Number(y2Raw) || y1 + 1;
  const months: PeriodOption[] = [];
  for (let i = 0; i < 12; i++) {
    const month = ((9 + i) % 12) + 1; // 10,11,12,1,...,9
    const year = month >= 10 ? y1 : y2;
    months.push({ key: monthKey(year, month), month, year, labelKh: `ខែ${KH_MONTHS[month - 1]} ${toKh(year)}` });
  }
  return [
    ...months,
    { key: 'sem-1', labelKh: 'ប្រឡងឆមាសទី១' },
    { key: 'sem-2', labelKh: 'ប្រឡងឆមាសទី២' },
  ];
};

export const monthKey = (year: number, month: number) => `m-${year}-${String(month).padStart(2, '0')}`;

export const periodLabel = (key: string) => {
  if (key === 'sem-1') return 'ប្រឡងឆមាសទី១';
  if (key === 'sem-2') return 'ប្រឡងឆមាសទី២';
  const m = key.match(/^m-(\d{4})-(\d{2})$/);
  return m ? `ខែ${KH_MONTHS[Number(m[2]) - 1]}` : key;
};

export const DEFAULT_SEM1_MONTHS = [10, 11, 12, 1, 2];
export const DEFAULT_SEM2_MONTHS = [3, 4, 5, 6, 7];

// ───────────────────────── Ranking ─────────────────────────
/** Competition ranking: equal values share a rank (1, 2, 2, 4). Higher is better. */
export const rankMap = (values: { id: string; value: number | null }[]): { [id: string]: number } => {
  const valid = values.filter((v) => v.value !== null && !Number.isNaN(v.value as number)) as { id: string; value: number }[];
  const sorted = [...valid].sort((a, b) => b.value - a.value);
  const out: { [id: string]: number } = {};
  sorted.forEach((v, i) => {
    const prev = sorted[i - 1];
    out[v.id] = prev && Math.abs(prev.value - v.value) < 1e-9 ? out[prev.id] : i + 1;
  });
  return out;
};

// ───────────────────────── Results per period ─────────────────────────
export const activeStudents = (cls?: ClassFeeData) =>
  (cls?.students || []).filter((s) => !(s.feesGroup || '').toLowerCase().includes('stop'));

export interface PeriodResult {
  studentId: string;
  total: number | null;
  average: number | null; // weighted percent 0–100
  totalMax?: number | null; // highest possible total for the entered subjects (× coefficient)
  entered: number; // subjects with a score
  rank?: number;
  subjectRank: { [subjectId: string]: number };
}

/**
 * Results for one period. `average` is a weighted percent (0–100):
 * Σ(score ÷ max × 100 × coefficient) ÷ Σ(coefficient) over the subjects that have a score.
 * Without `cls` every subject counts as /100 with coefficient 1 (the old behaviour).
 */
export const computePeriodResults = (
  students: StudentFeeRecord[],
  subjectIds: string[],
  scores: ClassScoreBook[string] | undefined,
  cls?: ClassFeeData
): { [studentId: string]: PeriodResult } => {
  const out: { [studentId: string]: PeriodResult } = {};
  students.forEach((st) => {
    const row = scores?.[String(st.id)] || {};
    let total = 0;
    let weighted = 0;
    let coefSum = 0;
    let maxSum = 0;
    let entered = 0;
    subjectIds.forEach((sid) => {
      const v = row[sid];
      if (v !== null && v !== undefined && !Number.isNaN(v)) {
        const { max, coef } = subjectCfg(cls, sid);
        total += v * coef;
        maxSum += max * coef;
        weighted += (v / max) * 100 * coef;
        coefSum += coef;
        entered += 1;
      }
    });
    out[String(st.id)] = {
      studentId: String(st.id),
      total: entered ? total : null,
      totalMax: entered ? maxSum : null,
      average: entered && coefSum ? weighted / coefSum : null,
      entered,
      subjectRank: {},
    };
  });
  const ranks = rankMap(Object.values(out).map((r) => ({ id: r.studentId, value: r.average })));
  Object.values(out).forEach((r) => (r.rank = ranks[r.studentId]));
  subjectIds.forEach((sid) => {
    const sr = rankMap(
      students.map((st) => {
        const v = scores?.[String(st.id)]?.[sid];
        return { id: String(st.id), value: v === undefined || v === null ? null : v };
      })
    );
    Object.entries(sr).forEach(([id, r]) => (out[id].subjectRank[sid] = r));
  });
  return out;
};

// ───────────────────────── Semester / year results (booklet) ─────────────────────────
export interface SemesterResult {
  examAvg: number | null; // semester exam average (0–100)
  examTotal: number | null;
  monthlyAvg: number | null; // average of monthly averages in this semester
  semesterAvg: number | null; // (monthlyAvg + examAvg) / 2
  examRank?: number;
  monthlyRank?: number;
  semesterRank?: number;
  subjectScores: { [subjectId: string]: number | null };
  subjectRanks: { [subjectId: string]: number };
}

const mean = (vals: (number | null)[]) => {
  const v = vals.filter((x): x is number => x !== null && !Number.isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

export const computeSemesterResults = (
  cls: ClassFeeData,
  subjectIds: string[],
  semester: 1 | 2,
  academicYear: string,
  semMonths: number[]
): { [studentId: string]: SemesterResult } => {
  const students = activeStudents(cls);
  const scores = cls.scores || {};
  const exam = computePeriodResults(students, subjectIds, scores[`sem-${semester}`], cls);
  const monthKeys = academicPeriods(academicYear)
    .filter((p) => p.month && semMonths.includes(p.month))
    .map((p) => p.key)
    .filter((k) => scores[k]);
  const monthly = monthKeys.map((k) => computePeriodResults(students, subjectIds, scores[k], cls));

  const out: { [id: string]: SemesterResult } = {};
  students.forEach((st) => {
    const id = String(st.id);
    const monthlyAvg = mean(monthly.map((m) => m[id]?.average ?? null));
    const examAvg = exam[id]?.average ?? null;
    const semesterAvg = examAvg !== null && monthlyAvg !== null ? (examAvg + monthlyAvg) / 2 : examAvg ?? monthlyAvg;
    out[id] = {
      examAvg,
      examTotal: exam[id]?.total ?? null,
      monthlyAvg,
      semesterAvg,
      examRank: exam[id]?.rank,
      // as percent, so /10 displays stay right whatever the subject's highest score
      subjectScores: Object.fromEntries(subjectIds.map((sid) => [sid, toPct(scores[`sem-${semester}`]?.[id]?.[sid] ?? null, subjectCfg(cls, sid).max)])),
      subjectRanks: exam[id]?.subjectRank || {},
    };
  });
  const mr = rankMap(students.map((s) => ({ id: String(s.id), value: out[String(s.id)].monthlyAvg })));
  const sr = rankMap(students.map((s) => ({ id: String(s.id), value: out[String(s.id)].semesterAvg })));
  Object.entries(out).forEach(([id, r]) => {
    r.monthlyRank = mr[id];
    r.semesterRank = sr[id];
  });
  return out;
};

export const computeYearResults = (
  sem1: { [id: string]: SemesterResult },
  sem2: { [id: string]: SemesterResult }
): { [id: string]: { yearAvg: number | null; yearRank?: number } } => {
  const ids = Array.from(new Set([...Object.keys(sem1), ...Object.keys(sem2)]));
  const out: { [id: string]: { yearAvg: number | null; yearRank?: number } } = {};
  ids.forEach((id) => (out[id] = { yearAvg: mean([sem1[id]?.semesterAvg ?? null, sem2[id]?.semesterAvg ?? null]) }));
  const r = rankMap(ids.map((id) => ({ id, value: out[id].yearAvg })));
  ids.forEach((id) => (out[id].yearRank = r[id]));
  return out;
};

// ───────────────────────── Default subjects for a class ─────────────────────────
/** Subjects whose gradeLevels match the class's grade number (e.g. "ថ្នាក់ទី ១"). */
export const defaultSubjectIdsForClass = (cls: ClassFeeData, subjects: SubjectItem[]): string[] => {
  const m = cls.className.match(/ថ្នាក់ទី\s*([០-៩0-9]+)/);
  if (!m) return subjects.map((s) => s.id);
  const norm = (x: string) => x.replace(/[០-៩]/g, (c) => String(KH_DIGITS.indexOf(c)));
  const grade = norm(m[1]);
  const matched = subjects.filter((s) =>
    (s.gradeLevels || []).some((g) => {
      const gm = g.match(/ថ្នាក់ទី\s*([០-៩0-9]+)/);
      return gm ? norm(gm[1]) === grade : false;
    })
  );
  return (matched.length ? matched : subjects).map((s) => s.id);
};

export const classSubjects = (cls: ClassFeeData | undefined, subjects: SubjectItem[]): SubjectItem[] => {
  if (!cls) return [];
  const ids = cls.subjectIds && cls.subjectIds.length ? cls.subjectIds : defaultSubjectIdsForClass(cls, subjects);
  return ids.map((id) => subjects.find((s) => s.id === id)).filter((s): s is SubjectItem => !!s);
};

// ───────────────────────── Attendance (from the attendance screen's store) ─────────────────────────
export const readAttendanceStore = (): { [key: string]: DailyStudentAttendanceRecord } => {
  try {
    return JSON.parse(localStorage.getItem('BIM_RANGSEI_ATTENDANCE') || '{}') || {};
  } catch {
    return {};
  }
};

/** Counts for one student over the given months ("YYYY-MM" prefixes). */
export const attendanceSummary = (classId: string, studentId: number, monthPrefixes: string[]) => {
  const store = readAttendanceStore();
  let days = 0;
  let present = 0;
  let permission = 0;
  let noPermission = 0;
  let late = 0;
  Object.values(store).forEach((rec) => {
    if (!rec || rec.classId !== classId || !monthPrefixes.some((p) => rec.date?.startsWith(p))) return;
    const a = rec.attendance?.[studentId];
    if (!a) return;
    days += 1;
    if (a.status === 'present') present += 1;
    else if (a.status === 'late') {
      present += 1;
      late += 1;
    } else if (a.status === 'absent_permission') permission += 1;
    else if (a.status === 'absent_no_permission') noPermission += 1;
  });
  return { days, present, permission, noPermission, late, rate: days ? Math.round((present / days) * 100) : null };
};

export const studentPhoto = (s?: StudentFeeRecord | null) => s?.photoUrl || s?.admissionData?.photoUrl || '';
