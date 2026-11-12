import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TeacherRecord, SubjectItem, ScheduleSlot, ScheduleTimePeriod } from '../types';
import {
  Users,
  Calendar,
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Phone,
  Mail,
  GraduationCap,
  Clock,
  Printer,
  CheckCircle2,
  ChevronRight,
  UserCheck,
  Building,
  Award,
  Layers,
  X,
  FileSpreadsheet,
  Sparkles,
  Zap,
  Copy,
  RotateCcw,
  Sliders,
  Check,
  ArrowRight,
  Sun,
  Moon,
  AlertTriangle,
  Send,
} from 'lucide-react';

// Baseline initial subjects
const INITIAL_SUBJECTS: SubjectItem[] = [
  {
    id: 'sub-kh-1',
    code: 'KH-01',
    nameKhmer: 'ភាសាខ្មែរ (Khmer Literature)',
    nameEnglish: 'Khmer Language & Literature',
    gradeLevels: ['ថ្នាក់ទី ១', 'ថ្នាក់ទី ២', 'ថ្នាក់ទី ៣', 'ថ្នាក់ទី ៤', 'ថ្នាក់ទី ៥', 'ថ្នាក់ទី ៦'],
    hoursPerWeek: 6,
    department: 'Khmer Literature',
    description: 'ការអាន សំណេរ វេយ្យាករណ៍ និងការយល់ដឹងអត្ថបទ',
    color: 'emerald',
  },
  {
    id: 'sub-math-1',
    code: 'MATH-01',
    nameKhmer: 'គណិតវិទ្យា (Mathematics)',
    nameEnglish: 'Primary & Secondary Mathematics',
    gradeLevels: ['ថ្នាក់ទី ១', 'ថ្នាក់ទី ២', 'ថ្នាក់ទី ៣', 'ថ្នាក់ទី ៤', 'ថ្នាក់ទី ៥', 'ថ្នាក់ទី ៦'],
    hoursPerWeek: 6,
    department: 'Mathematics & Science',
    description: 'លេខនព្វន្ត ធរណីមាត្រ ពិជគណិត និងការដោះស្រាយចំណោទ',
    color: 'blue',
  },
  {
    id: 'sub-eng-1',
    code: 'ENG-01',
    nameKhmer: 'ភាសាអង់គ្លេស (English Language)',
    nameEnglish: 'English as a Second Language',
    gradeLevels: ['Pre-School', 'ថ្នាក់ទី ១', 'ថ្នាក់ទី ២', 'ថ្នាក់ទី ៣', 'ថ្នាក់ទី ៤', 'ថ្នាក់ទី ៥', 'ថ្នាក់ទី ៦'],
    hoursPerWeek: 5,
    department: 'Foreign Languages',
    description: 'Phonics, Vocabulary, Speaking, Reading and Grammar',
    color: 'indigo',
  },
  {
    id: 'sub-sci-1',
    code: 'SCI-01',
    nameKhmer: 'វិទ្យាសាស្ត្រ & សិក្សាសង្គម (Science & Social)',
    nameEnglish: 'Integrated Science & Social Studies',
    gradeLevels: ['ថ្នាក់ទី ១', 'ថ្នាក់ទី ២', 'ថ្នាក់ទី ៣', 'ថ្នាក់ទី ៤', 'ថ្នាក់ទី ៥', 'ថ្នាក់ទី ៦'],
    hoursPerWeek: 4,
    department: 'Social Studies',
    description: 'រូបវិទ្យា ជីវវិទ្យា បរិស្ថាន និងប្រវត្តិសាស្ត្រ',
    color: 'amber',
  },
  {
    id: 'sub-mor-1',
    code: 'MOR-01',
    nameKhmer: 'សីលធម៌ និងពលរដ្ឋវិជ្ជា (Civics & Ethics)',
    nameEnglish: 'Ethics & Citizenship Education',
    gradeLevels: ['ថ្នាក់ទី ១', 'ថ្នាក់ទី ២', 'ថ្នាក់ទី ៣', 'ថ្នាក់ទី ៤', 'ថ្នាក់ទី ៥'],
    hoursPerWeek: 2,
    department: 'Social Studies',
    description: 'សីលធម៌រស់នៅ ការគោរពច្បាប់ និងទំនៀមទម្លាប់ខ្មែរ',
    color: 'rose',
  },
  {
    id: 'sub-pe-1',
    code: 'PE-01',
    nameKhmer: 'អប់រំកាយ និងកីឡា (Physical Education)',
    nameEnglish: 'Physical Education & Sports',
    gradeLevels: ['All Grades'],
    hoursPerWeek: 2,
    department: 'Arts & Physical Education',
    description: 'កីឡាបាល់ទាត់ បាល់ទះ អត្តពលកម្ម និងសុខភាព',
    color: 'cyan',
  },
];

// Baseline teachers
const INITIAL_TEACHERS: TeacherRecord[] = [
  {
    id: 'tch-1',
    teacherCode: 'TCH-001',
    nameKhmer: 'សុខ ម៉ាលី',
    nameEnglish: 'Sok Maly',
    gender: 'Female',
    dob: '1988-05-12',
    phone: '012 888 234',
    email: 'maly.sok@bimrangsei.edu.kh',
    qualification: 'បរិញ្ញាបត្រអប់រំ (B.Ed in Primary Education)',
    subjects: ['ភាសាខ្មែរ (Khmer Literature)', 'សីលធម៌ និងពលរដ្ឋវិជ្ជា (Civics & Ethics)'],
    homeroomClassId: '1A',
    homeroomClassName: 'ថ្នាក់ទី ១A',
    joinDate: '2021-09-01',
    status: 'active',
    branchId: 'branch-central',
    salaryUSD: 450,
  },
  {
    id: 'tch-2',
    teacherCode: 'TCH-002',
    nameKhmer: 'គង់ វណ្ណៈ',
    nameEnglish: 'Kong Vannak',
    gender: 'Male',
    dob: '1985-11-20',
    phone: '098 776 543',
    email: 'vannak.kong@bimrangsei.edu.kh',
    qualification: 'បរិញ្ញាបត្រគណិតវិទ្យា (B.Sc Mathematics)',
    subjects: ['គណិតវិទ្យា (Mathematics)', 'វិទ្យាសាស្ត្រ & សិក្សាសង្គម (Science & Social)'],
    homeroomClassId: 'pre2',
    homeroomClassName: 'ថ្នាក់ Pre-2',
    joinDate: '2020-10-15',
    status: 'active',
    branchId: 'branch-central',
    salaryUSD: 480,
  },
  {
    id: 'tch-3',
    teacherCode: 'TCH-003',
    nameKhmer: 'ចាន់ ធីតា',
    nameEnglish: 'Chan Thida',
    gender: 'Female',
    dob: '1992-02-18',
    phone: '077 334 455',
    email: 'thida.chan@bimrangsei.edu.kh',
    qualification: 'បរិញ្ញាបត្រភាសាអង់គ្លេស (B.A in TEFL / English)',
    subjects: ['ភាសាអង់គ្លេស (English Language)'],
    homeroomClassId: 'TK-1A',
    homeroomClassName: 'ថ្នាក់ទី TK-1A',
    joinDate: '2022-01-10',
    status: 'active',
    branchId: 'branch-tk',
    salaryUSD: 420,
  },
  {
    id: 'tch-4',
    teacherCode: 'TCH-004',
    nameKhmer: 'រស់ ពិសី',
    nameEnglish: 'Ros Pisey',
    gender: 'Female',
    dob: '1990-08-30',
    phone: '085 221 199',
    email: 'pisey.ros@bimrangsei.edu.kh',
    qualification: 'គរុកោសល្យបឋមសិក្សា (Pedagogy Certificate)',
    subjects: ['ភាសាខ្មែរ (Khmer Literature)', 'អប់រំកាយ និងកីឡា (Physical Education)'],
    homeroomClassId: 'CA-1A',
    homeroomClassName: 'ថ្នាក់ទី CA-1A',
    joinDate: '2023-03-01',
    status: 'active',
    branchId: 'branch-ca',
    salaryUSD: 400,
  },
];

// Baseline weekly schedule slots
const INITIAL_SCHEDULE: ScheduleSlot[] = [
  { id: 'sch-1', dayOfWeek: 'Monday', timeSlot: '07:30 - 08:30', periodNumber: 1, classId: '1A', className: 'ថ្នាក់ទី ១A', subjectId: 'sub-kh-1', subjectName: 'ភាសាខ្មែរ', teacherId: 'tch-1', teacherName: 'សុខ ម៉ាលី', room: 'បន្ទប់ ១០១' },
  { id: 'sch-2', dayOfWeek: 'Monday', timeSlot: '08:35 - 09:35', periodNumber: 2, classId: '1A', className: 'ថ្នាក់ទី ១A', subjectId: 'sub-math-1', subjectName: 'គណិតវិទ្យា', teacherId: 'tch-2', teacherName: 'គង់ វណ្ណៈ', room: 'បន្ទប់ ១០១' },
  { id: 'sch-3', dayOfWeek: 'Monday', timeSlot: '09:50 - 10:50', periodNumber: 3, classId: '1A', className: 'ថ្នាក់ទី ១A', subjectId: 'sub-eng-1', subjectName: 'ភាសាអង់គ្លេស', teacherId: 'tch-3', teacherName: 'ចាន់ ធីតា', room: 'បន្ទប់ ១០១' },
  { id: 'sch-4', dayOfWeek: 'Tuesday', timeSlot: '07:30 - 08:30', periodNumber: 1, classId: '1A', className: 'ថ្នាក់ទី ១A', subjectId: 'sub-math-1', subjectName: 'គណិតវិទ្យា', teacherId: 'tch-2', teacherName: 'គង់ វណ្ណៈ', room: 'បន្ទប់ ១០១' },
  { id: 'sch-5', dayOfWeek: 'Tuesday', timeSlot: '08:35 - 09:35', periodNumber: 2, classId: '1A', className: 'ថ្នាក់ទី ១A', subjectId: 'sub-kh-1', subjectName: 'ភាសាខ្មែរ', teacherId: 'tch-1', teacherName: 'សុខ ម៉ាលី', room: 'បន្ទប់ ១០១' },
  { id: 'sch-6', dayOfWeek: 'Wednesday', timeSlot: '07:30 - 08:30', periodNumber: 1, classId: '1A', className: 'ថ្នាក់ទី ១A', subjectId: 'sub-sci-1', subjectName: 'វិទ្យាសាស្ត្រ', teacherId: 'tch-2', teacherName: 'គង់ វណ្ណៈ', room: 'បន្ទប់ ១០១' },
  { id: 'sch-7', dayOfWeek: 'Thursday', timeSlot: '07:30 - 08:30', periodNumber: 1, classId: '1A', className: 'ថ្នាក់ទី ១A', subjectId: 'sub-eng-1', subjectName: 'ភាសាអង់គ្លេស', teacherId: 'tch-3', teacherName: 'ចាន់ ធីតា', room: 'បន្ទប់ ១០១' },
  { id: 'sch-8', dayOfWeek: 'Friday', timeSlot: '08:35 - 09:35', periodNumber: 2, classId: '1A', className: 'ថ្នាក់ទី ១A', subjectId: 'sub-pe-1', subjectName: 'អប់រំកាយ', teacherId: 'tch-4', teacherName: 'រស់ ពិសី', room: 'ទីលានកីឡា' },
];

const DAYS_OF_WEEK: Array<ScheduleSlot['dayOfWeek']> = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_KH: { [key in ScheduleSlot['dayOfWeek']]: string } = {
  Monday: 'ថ្ងៃចន្ទ (Monday)',
  Tuesday: 'ថ្ងៃអង្គារ (Tuesday)',
  Wednesday: 'ថ្ងៃពុធ (Wednesday)',
  Thursday: 'ថ្ងៃព្រហស្បតិ៍ (Thursday)',
  Friday: 'ថ្ងៃសុក្រ (Friday)',
  Saturday: 'ថ្ងៃសៅរ៍ (Saturday)',
};

// Default configurable time periods
const DEFAULT_TIME_PERIODS: ScheduleTimePeriod[] = [
  { period: 1, time: '07:30 - 08:30', labelKhmer: 'ម៉ោងទី ១', shift: 'morning' },
  { period: 2, time: '08:35 - 09:35', labelKhmer: 'ម៉ោងទី ២', shift: 'morning' },
  { period: 3, time: '09:50 - 10:50', labelKhmer: 'ម៉ោងទី ៣', shift: 'morning' },
  { period: 4, time: '10:55 - 11:30', labelKhmer: 'ម៉ោងទី ៤', shift: 'morning' },
  { period: 5, time: '13:30 - 14:30', labelKhmer: 'ម៉ោងទី ៥', shift: 'afternoon' },
  { period: 6, time: '14:35 - 15:35', labelKhmer: 'ម៉ោងទី ៦', shift: 'afternoon' },
];

// Presets for quick time periods setup
const TIME_PERIOD_PRESETS = [
  {
    name: 'វេនព្រឹកស្តង់ដារ (07:00 - 11:15)',
    periods: [
      { period: 1, time: '07:00 - 07:50', labelKhmer: 'ម៉ោងទី ១', shift: 'morning' as const },
      { period: 2, time: '07:55 - 08:45', labelKhmer: 'ម៉ោងទី ២', shift: 'morning' as const },
      { period: 3, time: '09:00 - 09:50', labelKhmer: 'ម៉ោងទី ៣ (ក្រោយសម្រាក)', shift: 'morning' as const },
      { period: 4, time: '09:55 - 10:45', labelKhmer: 'ម៉ោងទី ៤', shift: 'morning' as const },
      { period: 5, time: '10:45 - 11:15', labelKhmer: 'ម៉ោងទី ៥', shift: 'morning' as const },
    ],
  },
  {
    name: 'ព្រឹក & រសៀល (07:30 - 15:35)',
    periods: [
      { period: 1, time: '07:30 - 08:30', labelKhmer: 'ម៉ោងទី ១', shift: 'morning' as const },
      { period: 2, time: '08:35 - 09:35', labelKhmer: 'ម៉ោងទី ២', shift: 'morning' as const },
      { period: 3, time: '09:50 - 10:50', labelKhmer: 'ម៉ោងទី ៣', shift: 'morning' as const },
      { period: 4, time: '10:55 - 11:30', labelKhmer: 'ម៉ោងទី ៤', shift: 'morning' as const },
      { period: 5, time: '13:30 - 14:30', labelKhmer: 'ម៉ោងទី ៥', shift: 'afternoon' as const },
      { period: 6, time: '14:35 - 15:35', labelKhmer: 'ម៉ោងទី ៦', shift: 'afternoon' as const },
    ],
  },
  {
    name: 'ពេញមួយថ្ងៃ (៨ ម៉ោង / ថ្ងៃ)',
    periods: [
      { period: 1, time: '07:30 - 08:20', labelKhmer: 'ម៉ោងទី ១', shift: 'morning' as const },
      { period: 2, time: '08:25 - 09:15', labelKhmer: 'ម៉ោងទី ២', shift: 'morning' as const },
      { period: 3, time: '09:30 - 10:20', labelKhmer: 'ម៉ោងទី ៣', shift: 'morning' as const },
      { period: 4, time: '10:25 - 11:15', labelKhmer: 'ម៉ោងទី ៤', shift: 'morning' as const },
      { period: 5, time: '13:00 - 13:50', labelKhmer: 'ម៉ោងទី ៥', shift: 'afternoon' as const },
      { period: 6, time: '13:55 - 14:45', labelKhmer: 'ម៉ោងទី ៦', shift: 'afternoon' as const },
      { period: 7, time: '15:00 - 15:50', labelKhmer: 'ម៉ោងទី ៧', shift: 'afternoon' as const },
      { period: 8, time: '15:55 - 16:45', labelKhmer: 'ម៉ោងទី ៨', shift: 'afternoon' as const },
    ],
  },
];

export type TeacherSubTab =
  | 'teacher_list'
  | 'teacher_info'
  | 'teaching_schedule'
  | 'subject'
  | 'teacher_attendance';

interface TeacherManagementViewProps {
  initialSubTab?: TeacherSubTab;
}

export const TeacherManagementView: React.FC<TeacherManagementViewProps> = ({
  initialSubTab = 'teacher_list',
}) => {
  const { classData, orderedClassList, currentBranch, branches, permissions, t, settings, sendTelegramAlert } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<TeacherSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Local state persistence for teachers, subjects, schedules, and custom time periods
  const [teachers, setTeachers] = useState<TeacherRecord[]>(() => {
    try {
      const stored = localStorage.getItem('BIM_RANGSEI_TEACHERS');
      return stored ? JSON.parse(stored) : INITIAL_TEACHERS;
    } catch {
      return INITIAL_TEACHERS;
    }
  });

  const [subjects, setSubjects] = useState<SubjectItem[]>(() => {
    try {
      const stored = localStorage.getItem('BIM_RANGSEI_SUBJECTS');
      return stored ? JSON.parse(stored) : INITIAL_SUBJECTS;
    } catch {
      return INITIAL_SUBJECTS;
    }
  });

  const [schedules, setSchedules] = useState<ScheduleSlot[]>(() => {
    try {
      const stored = localStorage.getItem('BIM_RANGSEI_SCHEDULES');
      return stored ? JSON.parse(stored) : INITIAL_SCHEDULE;
    } catch {
      return INITIAL_SCHEDULE;
    }
  });

  // Configurable study time periods state
  const [timePeriods, setTimePeriods] = useState<ScheduleTimePeriod[]>(() => {
    try {
      const stored = localStorage.getItem('BIM_RANGSEI_TIME_PERIODS');
      return stored ? JSON.parse(stored) : DEFAULT_TIME_PERIODS;
    } catch {
      return DEFAULT_TIME_PERIODS;
    }
  });

  // Filter & Search states
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('1A');
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<string>('all');

  // Teacher Attendance state & persistence
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: 'present' | 'absent' | 'leave' | 'late'; note?: string }>>(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const stored = localStorage.getItem(`BIM_RANGSEI_TEACHER_ATT_${today}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Reload attendance when date changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`BIM_RANGSEI_TEACHER_ATT_${attendanceDate}`);
      if (stored) {
        setAttendanceRecords(JSON.parse(stored));
      } else {
        setAttendanceRecords({});
      }
    } catch {}
  }, [attendanceDate]);

  const handleAttendanceChange = (teacherId: string, status: 'present' | 'absent' | 'leave' | 'late', note?: string) => {
    setAttendanceRecords((prev) => {
      const updated = {
        ...prev,
        [teacherId]: {
          status,
          note: note !== undefined ? note : (prev[teacherId]?.note || ''),
        },
      };
      try {
        localStorage.setItem(`BIM_RANGSEI_TEACHER_ATT_${attendanceDate}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleMarkAllTeachersPresent = () => {
    const updated: Record<string, { status: 'present' | 'absent' | 'leave' | 'late'; note?: string }> = {};
    teachers.forEach((tch) => {
      updated[tch.id] = { status: 'present', note: attendanceRecords[tch.id]?.note || '' };
    });
    setAttendanceRecords(updated);
    try {
      localStorage.setItem(`BIM_RANGSEI_TEACHER_ATT_${attendanceDate}`, JSON.stringify(updated));
    } catch {}
  };

  const handleShareAttendanceTelegram = () => {
    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let lateCount = 0;

    teachers.forEach((tch) => {
      const rec = attendanceRecords[tch.id]?.status || 'present';
      if (rec === 'present') presentCount++;
      else if (rec === 'absent') absentCount++;
      else if (rec === 'leave') leaveCount++;
      else if (rec === 'late') lateCount++;
    });

    const lines = teachers.map((tch) => {
      const status = attendanceRecords[tch.id]?.status || 'present';
      const statusKh = status === 'present' ? '✅ វត្តមាន' : status === 'absent' ? '❌ អវត្តមាន' : status === 'leave' ? '📝 សុំច្បាប់' : '⚠️ មកយឺត';
      const note = attendanceRecords[tch.id]?.note ? ` (${attendanceRecords[tch.id]?.note})` : '';
      return `• ${tch.nameKhmer} [${tch.teacherCode}]: ${statusKh}${note}`;
    }).join('\n');

    sendTelegramAlert(
      `📋 របាយការណ៍វត្តមានលោកគ្រូ-អ្នកគ្រូ (Teacher Attendance)`,
      `កាលបរិច្ឆេទ៖ ${attendanceDate}\nសាខា៖ ${currentBranch.nameKhmer}\n\nសរុបគ្រូ៖ ${teachers.length} នាក់\n• វត្តមាន៖ ${presentCount} នាក់\n• អវត្តមាន៖ ${absentCount} នាក់\n• សុំច្បាប់៖ ${leaveCount} នាក់\n• មកយឺត៖ ${lateCount} នាក់\n\nព័ត៌មានលម្អិត៖\n${lines}`,
      'system',
      'Teacher Attendance',
      attendanceDate
    );
  };

  // Modals state
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);

  // Ultra-Fast Schedule Modals & Tools
  const [isTimePeriodModalOpen, setIsTimePeriodModalOpen] = useState(false);
  const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] = useState(false);
  const [isBatchAddModalOpen, setIsBatchAddModalOpen] = useState(false);
  const [isCopyScheduleModalOpen, setIsCopyScheduleModalOpen] = useState(false);

  // Quick cell picker popover state: target cell day & period
  const [quickPickerCell, setQuickPickerCell] = useState<{ day: ScheduleSlot['dayOfWeek']; period: ScheduleTimePeriod } | null>(null);

  // Sync to local storage
  const saveTeachers = (newTeachers: TeacherRecord[]) => {
    setTeachers(newTeachers);
    try {
      localStorage.setItem('BIM_RANGSEI_TEACHERS', JSON.stringify(newTeachers));
    } catch (e) {
      console.error(e);
    }
  };

  const saveSubjects = (newSubjects: SubjectItem[]) => {
    setSubjects(newSubjects);
    try {
      localStorage.setItem('BIM_RANGSEI_SUBJECTS', JSON.stringify(newSubjects));
    } catch (e) {
      console.error(e);
    }
  };

  const saveSchedules = (newSchedules: ScheduleSlot[]) => {
    setSchedules(newSchedules);
    try {
      localStorage.setItem('BIM_RANGSEI_SCHEDULES', JSON.stringify(newSchedules));
    } catch (e) {
      console.error(e);
    }
  };

  const saveTimePeriods = (newPeriods: ScheduleTimePeriod[]) => {
    setTimePeriods(newPeriods);
    try {
      localStorage.setItem('BIM_RANGSEI_TIME_PERIODS', JSON.stringify(newPeriods));
    } catch (e) {
      console.error(e);
    }
  };

  // Ultra-Fast Feature 1: Instant 1-Click Auto-Generate Schedule
  const handleAutoGenerateSchedule = (classId: string, replaceExisting: boolean = true) => {
    const targetClass = classData[classId] || orderedClassList.find((c) => c.classId === classId) || {
      className: classId,
      homeroomTeacher: 'សុខ ម៉ាលី',
    };

    // Homeroom teacher resolution
    const homeroomTeacherObj = teachers.find(
      (t) => t.nameKhmer === targetClass.homeroomTeacher || t.homeroomClassId === classId
    ) || teachers[0];

    // Priority subjects mapping
    const khmerSub = subjects.find((s) => s.id === 'sub-kh-1' || s.nameKhmer.includes('ខ្មែរ')) || subjects[0];
    const mathSub = subjects.find((s) => s.id === 'sub-math-1' || s.nameKhmer.includes('គណិត')) || subjects[1] || subjects[0];
    const engSub = subjects.find((s) => s.id === 'sub-eng-1' || s.nameKhmer.includes('អង់គ្លេស')) || subjects[2] || subjects[0];
    const sciSub = subjects.find((s) => s.id === 'sub-sci-1' || s.nameKhmer.includes('វិទ្យាសាស្ត្រ')) || subjects[3] || subjects[0];
    const morSub = subjects.find((s) => s.id === 'sub-mor-1' || s.nameKhmer.includes('សីលធម៌')) || subjects[4] || subjects[0];
    const peSub = subjects.find((s) => s.id === 'sub-pe-1' || s.nameKhmer.includes('កីឡា')) || subjects[5] || subjects[0];

    // Specialized subject teacher helper
    const getTeacherForSubject = (sub: SubjectItem): TeacherRecord => {
      const match = teachers.find(
        (t) =>
          t.subjects.some((s) => s.includes(sub.nameKhmer) || sub.nameKhmer.includes(s))
      );
      return match || homeroomTeacherObj || teachers[0];
    };

    // Weekly distribution template matrix
    // Monday to Saturday distribution across periods
    const weeklyBlueprint: { [day in ScheduleSlot['dayOfWeek']]: { [period: number]: SubjectItem } } = {
      Monday: { 1: khmerSub, 2: mathSub, 3: engSub, 4: sciSub, 5: morSub, 6: peSub },
      Tuesday: { 1: mathSub, 2: khmerSub, 3: engSub, 4: sciSub, 5: morSub, 6: peSub },
      Wednesday: { 1: khmerSub, 2: mathSub, 3: engSub, 4: morSub, 5: sciSub, 6: peSub },
      Thursday: { 1: mathSub, 2: engSub, 3: khmerSub, 4: sciSub, 5: peSub, 6: morSub },
      Friday: { 1: khmerSub, 2: mathSub, 3: engSub, 4: peSub, 5: sciSub, 6: morSub },
      Saturday: { 1: khmerSub, 2: mathSub, 3: engSub, 4: morSub, 5: peSub, 6: sciSub },
    };

    const newSlots: ScheduleSlot[] = [];

    DAYS_OF_WEEK.forEach((day) => {
      timePeriods.forEach((period) => {
        // If not replacing and a slot already exists here, keep existing
        if (!replaceExisting) {
          const exists = schedules.some(
            (s) =>
              s.classId === classId &&
              s.dayOfWeek === day &&
              (s.periodNumber === period.period || s.timeSlot === period.time)
          );
          if (exists) return;
        }

        const subject =
          weeklyBlueprint[day]?.[period.period] ||
          subjects[(period.period + DAYS_OF_WEEK.indexOf(day)) % subjects.length];

        const teacher = getTeacherForSubject(subject);

        newSlots.push({
          id: `sch-${Date.now()}-${day}-${period.period}-${Math.random().toString(36).substr(2, 4)}`,
          dayOfWeek: day,
          timeSlot: period.time,
          periodNumber: period.period,
          classId: classId,
          className: targetClass.className,
          subjectId: subject.id,
          subjectName: subject.nameKhmer.split('(')[0].trim(),
          teacherId: teacher.id,
          teacherName: teacher.nameKhmer,
          room: `បន្ទប់ ${targetClass.className.replace(/\D/g, '') || '១០១'}`,
        });
      });
    });

    const updatedSchedules = replaceExisting
      ? schedules.filter((s) => s.classId !== classId).concat(newSlots)
      : [...schedules, ...newSlots];

    saveSchedules(updatedSchedules);
    setIsAutoGenerateModalOpen(false);
  };

  // Ultra-Fast Feature 2: 1-Click Quick Cell Assign (From Popover Chip)
  const handleQuickAssignSlot = (subject: SubjectItem) => {
    if (!quickPickerCell) return;
    const { day, period } = quickPickerCell;

    const targetClass = classData[selectedClassFilter] || {
      className: selectedClassFilter,
      homeroomTeacher: 'សុខ ម៉ាលី',
    };

    // Find teacher specialized in this subject or default to homeroom
    const teacherMatch =
      teachers.find((t) => t.subjects.some((s) => s.includes(subject.nameKhmer))) ||
      teachers.find((t) => t.nameKhmer === targetClass.homeroomTeacher) ||
      teachers[0];

    // Remove any existing slot in this cell first
    const cleanSchedules = schedules.filter(
      (s) =>
        !(
          s.classId === selectedClassFilter &&
          s.dayOfWeek === day &&
          (s.periodNumber === period.period || s.timeSlot === period.time)
        )
    );

    const newSlot: ScheduleSlot = {
      id: `sch-${Date.now()}-${day}-${period.period}`,
      dayOfWeek: day,
      timeSlot: period.time,
      periodNumber: period.period,
      classId: selectedClassFilter,
      className: targetClass.className,
      subjectId: subject.id,
      subjectName: subject.nameKhmer.split('(')[0].trim(),
      teacherId: teacherMatch.id,
      teacherName: teacherMatch.nameKhmer,
      room: `បន្ទប់ ${targetClass.className.replace(/\D/g, '') || '១០១'}`,
    };

    saveSchedules([...cleanSchedules, newSlot]);
    setQuickPickerCell(null);
  };

  // Ultra-Fast Feature 3: Clear Schedule for current class
  const handleClearCurrentClassSchedule = () => {
    const className = classData[selectedClassFilter]?.className || selectedClassFilter;
    if (confirm(`តើអ្នកពិតជាចង់សម្អាតកាលវិភាគទាំងអស់របស់ថ្នាក់ "${className}" មែនទេ?`)) {
      saveSchedules(schedules.filter((s) => s.classId !== selectedClassFilter));
    }
  };

  // Ultra-Fast Feature 4: Copy Schedule from Class to Class
  const handleCopySchedule = (sourceClassId: string, targetClassId: string) => {
    const sourceSlots = schedules.filter((s) => s.classId === sourceClassId);
    if (sourceSlots.length === 0) {
      alert('ថ្នាក់ប្រភពមិនទាន់មានកាលវិភាគដើម្បីចម្លងទេ!');
      return;
    }

    const targetClass = classData[targetClassId] || { className: targetClassId };

    // Duplicate all slots with new IDs and target class
    const copiedSlots: ScheduleSlot[] = sourceSlots.map((slot) => ({
      ...slot,
      id: `sch-${Date.now()}-${slot.dayOfWeek}-${slot.periodNumber}-${Math.random().toString(36).substr(2, 4)}`,
      classId: targetClassId,
      className: targetClass.className,
    }));

    // Remove existing in target class and append copied
    const updated = schedules.filter((s) => s.classId !== targetClassId).concat(copiedSlots);
    saveSchedules(updated);
    setSelectedClassFilter(targetClassId);
    setIsCopyScheduleModalOpen(false);
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter((tch) => {
      const q = teacherSearch.toLowerCase();
      return (
        tch.nameKhmer.toLowerCase().includes(q) ||
        tch.nameEnglish.toLowerCase().includes(q) ||
        tch.teacherCode.toLowerCase().includes(q) ||
        tch.phone.includes(q) ||
        (tch.homeroomClassName && tch.homeroomClassName.toLowerCase().includes(q))
      );
    });
  }, [teachers, teacherSearch]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-Navigation aligned with flowchart */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-khmer text-slate-900">
                  ការគ្រប់គ្រងគ្រូបង្រៀន (Teacher Management)
                </h1>
                <p className="text-xs text-slate-500 font-khmer mt-0.5">
                  ប្រព័ន្ធគ្រប់គ្រងព័ត៌មានគ្រូ កាលវិភាគបង្រៀន ម៉ោងសិក្សា និងមុខវិជ្ជា
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold font-khmer transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>{t('បោះពុម្ពកាលវិភាគ / បញ្ជី', 'Print Schedule / Directory')}</span>
            </button>
          </div>
        </div>

        {/* 5 Sub-tabs exact to diagram */}
        <div className="flex items-center gap-2 border-b border-slate-200 mt-6 pt-1 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('teacher_list')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold font-khmer border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'teacher_list'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>បញ្ជីឈ្មោះគ្រូបង្រៀន (Teacher List)</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600 font-mono">
              {teachers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('teacher_info')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold font-khmer border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'teacher_info'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>ព័ត៌មានគ្រូបង្រៀន (Teacher Information)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('teaching_schedule')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold font-khmer border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'teaching_schedule'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>កាលវិភាគបង្រៀន (Teaching Schedule)</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600 font-mono">
              {schedules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('subject')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold font-khmer border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'subject'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>មុខវិជ្ជាសិក្សា (Subject)</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600 font-mono">
              {subjects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('teacher_attendance')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold font-khmer border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'teacher_attendance'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>វត្តមានគ្រូបង្រៀន (Teacher Attendance)</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Wrapper */}
      <div className="print-container">
        {/* Printable Official Header (Shown Only on Print) */}
        <div className="hidden print:block text-center space-y-1 mb-6">
          <div className="font-bold text-xs font-khmer text-slate-800">ព្រះរាជាណាចក្រកម្ពុជា</div>
          <div className="text-[11px] font-semibold font-khmer text-slate-700">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
          <div className="text-sm font-extrabold font-khmer text-slate-900 pt-1">
            {settings.schoolNameKhmer} · {settings.schoolNameEnglish}
          </div>
          <div className="text-xs font-semibold font-khmer text-indigo-700">
            {currentBranch.nameKhmer}
          </div>
          <div className="text-base font-bold font-khmer text-slate-900 pt-2 uppercase">
            {activeSubTab === 'teacher_list' && 'បញ្ជីឈ្មោះលោកគ្រូ-អ្នកគ្រូ (Official Teacher Directory)'}
            {activeSubTab === 'teacher_info' && 'ព័ត៌មានលម្អិតលោកគ្រូ-អ្នកគ្រូ (Teacher Information & Profiles)'}
            {activeSubTab === 'teaching_schedule' && `កាលវិភាគបង្រៀនប្រចាំសប្តាហ៍ (${classData[selectedClassFilter]?.className || selectedClassFilter})`}
            {activeSubTab === 'subject' && 'តារាងកម្មវិធីសិក្សា និងមុខវិជ្ជា (Curriculum Subjects)'}
            {activeSubTab === 'teacher_attendance' && `វត្តមានលោកគ្រូ-អ្នកគ្រូប្រចាំថ្ងៃ (${attendanceDate})`}
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            ឆ្នាំសិក្សា៖ {settings.academicYear} · វេន៖ {classData[selectedClassFilter]?.period || 'វេនព្រឹក'} · បោះពុម្ពថ្ងៃទី៖ {new Date().toLocaleDateString('km-KH')}
          </div>
        </div>

        {/* 1. TEACHER LIST SUB-VIEW */}
        {activeSubTab === 'teacher_list' && (
          <div className="space-y-4">
            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ស្វែងរកតាមឈ្មោះ កូដ លេខទូរស័ព្ទ..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-khmer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {permissions.canEdit && (
                <button
                  onClick={() => {
                    setEditingTeacher(null);
                    setIsTeacherModalOpen(true);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-khmer shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>បន្ថែមគ្រូបង្រៀនថ្មី</span>
                </button>
              )}
            </div>

            {/* Teacher Cards / Table Grid */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 font-khmer">
                      <th className="py-3 px-3.5 text-center w-12">ល.រ</th>
                      <th className="py-3 px-4">កូដគ្រូ</th>
                      <th className="py-3 px-4">ឈ្មោះគ្រូបង្រៀន</th>
                      <th className="py-3 px-4">ភេទ</th>
                      <th className="py-3 px-4">ថ្នាក់ទទួលបន្ទុក</th>
                      <th className="py-3 px-4">មុខវិជ្ជាបង្រៀន</th>
                      <th className="py-3 px-4">លេខទូរស័ព្ទ / អ៊ីមែល</th>
                      <th className="py-3 px-4">កម្រិតវប្បធម៌</th>
                      <th className="py-3 px-4 text-center">ស្ថានភាព</th>
                      {permissions.canEdit && (
                        <th className="py-3 px-4 text-center no-print">សកម្មភាព</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredTeachers.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400 font-khmer">
                          មិនមានទិន្នន័យគ្រូបង្រៀនដែលត្រូវនឹងការស្វែងរកទេ
                        </td>
                      </tr>
                    ) : (
                      filteredTeachers.map((tch, idx) => (
                        <tr key={tch.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3.5 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                            {tch.teacherCode}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 font-khmer">{tch.nameKhmer}</div>
                            <div className="text-[11px] text-slate-500 font-sans">{tch.nameEnglish}</div>
                          </td>
                          <td className="py-3 px-4 font-khmer">
                            {tch.gender === 'Female' ? 'ស្រី' : 'ប្រុស'}
                          </td>
                          <td className="py-3 px-4">
                            {tch.homeroomClassName ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-khmer">
                                {tch.homeroomClassName}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-khmer text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {tch.subjects.map((s, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50/80 text-indigo-700 font-khmer"
                                >
                                  {s.split('(')[0].trim()}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            <div>{tch.phone}</div>
                            <div className="text-slate-400 text-[10px]">{tch.email}</div>
                          </td>
                          <td className="py-3 px-4 text-[11px] font-khmer text-slate-600">
                            {tch.qualification}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold font-khmer ${
                                tch.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {tch.status === 'active' ? 'បង្រៀនសកម្ម' : 'ឈប់សម្រាក'}
                            </span>
                          </td>
                          {permissions.canEdit && (
                            <td className="py-3 px-4 text-center no-print">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingTeacher(tch);
                                    setIsTeacherModalOpen(true);
                                  }}
                                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="កែប្រែ"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`តើអ្នកពិតជាចង់លុបគ្រូ ${tch.nameKhmer} មែនទេ?`)) {
                                      saveTeachers(teachers.filter((t) => t.id !== tch.id));
                                    }
                                  }}
                                  className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="លុប"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. TEACHER INFORMATION PROFILE CARDS SUB-VIEW */}
        {activeSubTab === 'teacher_info' && (
          <div className="space-y-4">
            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ស្វែងរកតាមឈ្មោះ កូដ លេខទូរស័ព្ទ..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-khmer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {permissions.canEdit && (
                <button
                  onClick={() => {
                    setEditingTeacher(null);
                    setIsTeacherModalOpen(true);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-khmer shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>បន្ថែមគ្រូបង្រៀនថ្មី</span>
                </button>
              )}
            </div>

            {/* Profile Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeachers.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 font-khmer bg-white rounded-2xl border border-slate-200">
                  មិនមានទិន្នន័យគ្រូបង្រៀនដែលត្រូវនឹងការស្វែងរកទេ
                </div>
              ) : (
                filteredTeachers.map((tch) => {
                  const initials = tch.nameKhmer.slice(0, 2) || 'គ្រូ';
                  return (
                    <div
                      key={tch.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        {/* Top Profile Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm font-khmer shadow-xs shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 font-khmer text-sm">
                                  {tch.nameKhmer}
                                </h4>
                                <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold font-khmer ${
                                  tch.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {tch.status === 'active' ? 'សកម្ម' : 'ឈប់'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-sans mt-0.5">{tch.nameEnglish}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                  {tch.teacherCode}
                                </span>
                                <span className="text-[11px] text-slate-400">·</span>
                                <span className="text-[11px] font-khmer text-slate-600">
                                  {tch.gender === 'Female' ? 'ស្រី' : 'ប្រុស'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {permissions.canEdit && (
                            <button
                              onClick={() => {
                                setEditingTeacher(tch);
                                setIsTeacherModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                              title="កែប្រែព័ត៌មានគ្រូ"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Details Breakdown */}
                        <div className="mt-4 space-y-2 pt-3 border-t border-slate-100 text-xs">
                          {/* Homeroom */}
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-khmer text-slate-500">ថ្នាក់ទទួលបន្ទុក៖</span>
                            {tch.homeroomClassName ? (
                              <span className="font-bold text-indigo-700 font-khmer bg-indigo-50/80 px-2 py-0.5 rounded-lg border border-indigo-100">
                                {tch.homeroomClassName}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-khmer">មិនទាន់ចាត់តាំង</span>
                            )}
                          </div>

                          {/* Qualifications */}
                          <div className="flex items-start justify-between gap-2 text-slate-600">
                            <span className="font-khmer text-slate-500 shrink-0">កម្រិតវប្បធម៌៖</span>
                            <span className="font-khmer text-slate-800 text-right font-medium">
                              {tch.qualification || '---'}
                            </span>
                          </div>

                          {/* Contact Info */}
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-khmer text-slate-500">ទូរស័ព្ទ៖</span>
                            <a href={`tel:${tch.phone}`} className="font-mono text-slate-800 font-bold hover:text-indigo-600">
                              {tch.phone}
                            </a>
                          </div>

                          {tch.email && (
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="font-khmer text-slate-500">អ៊ីមែល៖</span>
                              <span className="font-sans text-slate-700 truncate max-w-[180px]">{tch.email}</span>
                            </div>
                          )}

                          {/* Subjects */}
                          <div className="pt-2">
                            <div className="text-[11px] font-khmer text-slate-500 mb-1.5">មុខវិជ្ជាបង្រៀន៖</div>
                            <div className="flex flex-wrap gap-1">
                              {tch.subjects.map((sub, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-khmer"
                                >
                                  {sub.split('(')[0].trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="text-[11px] font-mono text-slate-400">
                          {tch.joinDate ? `ចូលបម្រើការ៖ ${tch.joinDate}` : ''}
                        </div>
                        <button
                          onClick={() => {
                            if (tch.homeroomClassId) {
                              setSelectedClassFilter(tch.homeroomClassId);
                            }
                            setActiveSubTab('teaching_schedule');
                          }}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-khmer font-bold cursor-pointer"
                        >
                          <span>កាលវិភាគ</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 3. TEACHING SCHEDULE SUB-VIEW */}
        {activeSubTab === 'teaching_schedule' && (
          <div className="space-y-4">
            {/* Top Toolbar: Class Selector + Day Filter + Ultra-Fast Schedule Action Buttons */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 no-print">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Left: Class & Day Selector */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-bold font-khmer text-slate-700 whitespace-nowrap">
                    ថ្នាក់រៀន៖
                  </span>
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-khmer font-bold bg-slate-50 focus:bg-white cursor-pointer"
                  >
                    {orderedClassList.map((c) => (
                      <option key={c.classId} value={c.classId}>
                        {c.className} ({c.period})
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedScheduleDay}
                    onChange={(e) => setSelectedScheduleDay(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-khmer font-medium bg-slate-50 focus:bg-white cursor-pointer"
                  >
                    <option value="all">បង្ហាញគ្រប់ថ្ងៃ (Mon - Sat)</option>
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {DAYS_KH[d]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Right: Fast Action Buttons Group */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Button 1: Manage Time Slots */}
                  <button
                    onClick={() => setIsTimePeriodModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold font-khmer transition-all cursor-pointer"
                    title="កែប្រែ ចន្លោះម៉ោង និងបន្ថែមម៉ោងសិក្សា"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>⏰ កែប្រែម៉ោងសិក្សា ({timePeriods.length} ម៉ោង)</span>
                  </button>

                  {/* Button 2: 1-Click Instant Auto-Generate */}
                  {permissions.canEdit && (
                    <button
                      onClick={() => setIsAutoGenerateModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-khmer shadow-xs transition-all cursor-pointer"
                      title="បង្កើតកាលវិភាគស្វ័យប្រវត្តិកំពូលរហ័ស ១ វិនាទី"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>⚡ បង្កើតស្វ័យប្រវត្តិកំពូលរហ័ស</span>
                    </button>
                  )}

                  {/* Button 3: Batch Multi-Day Fill */}
                  {permissions.canEdit && (
                    <button
                      onClick={() => setIsBatchAddModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold font-khmer transition-all cursor-pointer"
                      title="បញ្ចូលមុខវិជ្ជាជាបណ្តុំច្រើនថ្ងៃក្នុងពេលតែមួយ"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-600" />
                      <span>បញ្ចូលជាបណ្តុំ</span>
                    </button>
                  )}

                  {/* Button 4: Copy from another class */}
                  {permissions.canEdit && (
                    <button
                      onClick={() => setIsCopyScheduleModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold font-khmer transition-all cursor-pointer"
                      title="ចម្លងកាលវិភាគពីថ្នាក់ផ្សេង"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>ចម្លងពីថ្នាក់...</span>
                    </button>
                  )}

                  {/* Button 5: Add Single Slot */}
                  {permissions.canEdit && (
                    <button
                      onClick={() => {
                        setEditingSlot(null);
                        setIsScheduleModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-khmer transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>បញ្ចូលមួយៗ</span>
                    </button>
                  )}

                  {/* Button 6: Clear Schedule */}
                  {permissions.canEdit && (
                    <button
                      onClick={handleClearCurrentClassSchedule}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                      title="សម្អាតកាលវិភាគថ្នាក់នេះ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Guidance Bar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-khmer text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>
                    💡 <strong>គន្លឹះរហ័ស៖</strong> ចុចលើ <strong>ក្រឡាទទេ (+)</strong> ដើម្បីជ្រើសរើសមុខវិជ្ជាភ្លាមៗ ដោយមិនបាច់បំពេញទម្រង់យូរ!
                  </span>
                </div>
                <div className="font-mono text-slate-400">
                  ម៉ោងសិក្សាសរុប៖ {schedules.filter((s) => s.classId === selectedClassFilter).length} ម៉ោង
                </div>
              </div>
            </div>

            {/* Weekly Timetable Grid Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-khmer flex items-center gap-2">
                    <span>កាលវិភាគប្រចាំសប្តាហ៍៖ {classData[selectedClassFilter]?.className || selectedClassFilter}</span>
                    <span className="text-[11px] font-normal text-slate-500 font-sans">
                      ({timePeriods.length} ម៉ោងសិក្សា / ថ្ងៃ)
                    </span>
                  </h3>
                  <div className="text-[11px] text-slate-500 font-khmer mt-0.5">
                    គ្រូបន្ទុកថ្នាក់៖ <strong className="text-slate-800">{classData[selectedClassFilter]?.homeroomTeacher || 'មិនទាន់ចាត់តាំង'}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                    {classData[selectedClassFilter]?.period || 'វេនព្រឹក'}
                  </span>
                  <button
                    onClick={() => setIsTimePeriodModalOpen(true)}
                    className="no-print p-1 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                    title="កែប្រែម៉ោងសិក្សា"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-khmer">
                      <th className="py-2.5 px-3 border-r border-slate-800 w-36">ម៉ោងសិក្សា</th>
                      {DAYS_OF_WEEK.filter((d) => selectedScheduleDay === 'all' || selectedScheduleDay === d).map((day) => (
                        <th key={day} className="py-2.5 px-3 border-r border-slate-800">
                          {DAYS_KH[day].split(' ')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {timePeriods.map((period) => (
                      <tr key={period.period} className="hover:bg-slate-50/50">
                        {/* Time slot column */}
                        <td className="py-3 px-3 bg-slate-50 font-mono font-bold text-slate-700 border-r border-slate-200 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-[11px] text-indigo-700 font-khmer font-bold">
                              {period.labelKhmer || `ម៉ោងទី ${period.period}`}
                            </span>
                            {period.shift === 'afternoon' ? (
                              <Moon className="w-3 h-3 text-amber-500" />
                            ) : (
                              <Sun className="w-3 h-3 text-amber-500" />
                            )}
                          </div>
                          <div className="text-xs text-slate-900 mt-0.5">{period.time}</div>
                        </td>

                        {/* Days columns */}
                        {DAYS_OF_WEEK.filter((d) => selectedScheduleDay === 'all' || selectedScheduleDay === d).map((day) => {
                          const slot = schedules.find(
                            (s) =>
                              s.classId === selectedClassFilter &&
                              s.dayOfWeek === day &&
                              (s.periodNumber === period.period || s.timeSlot === period.time)
                          );

                          const isCurrentCellActiveForQuickPick =
                            quickPickerCell &&
                            quickPickerCell.day === day &&
                            quickPickerCell.period.period === period.period;

                          return (
                            <td
                              key={day}
                              className="py-1.5 px-1.5 border-r border-slate-200 align-top h-20 min-w-32 relative"
                            >
                              {slot ? (
                                <div className="p-2 rounded-xl bg-indigo-50/90 border border-indigo-200 text-left space-y-1 shadow-2xs group relative hover:border-indigo-400 transition-all">
                                  <div className="font-bold text-indigo-950 font-khmer text-xs leading-snug">
                                    {slot.subjectName}
                                  </div>
                                  <div className="text-[10px] text-slate-600 font-khmer flex items-center gap-1 truncate">
                                    <span>👨‍🏫 {slot.teacherName}</span>
                                  </div>
                                  <div className="text-[9px] text-slate-500 font-mono flex items-center justify-between pt-0.5">
                                    <span>{slot.room}</span>
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 no-print transition-opacity">
                                      <button
                                        onClick={() => {
                                          setEditingSlot(slot);
                                          setIsScheduleModalOpen(true);
                                        }}
                                        className="text-indigo-600 hover:text-indigo-800 p-0.5 cursor-pointer"
                                        title="កែប្រែម៉ោងនេះ"
                                      >
                                        <Edit2 className="w-2.5 h-2.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm('តើចង់លុបម៉ោងបង្រៀននេះចេញពីកាលវិភាគមែនទេ?')) {
                                            saveSchedules(schedules.filter((s) => s.id !== slot.id));
                                          }
                                        }}
                                        className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                                        title="លុបម៉ោងនេះ"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isCurrentCellActiveForQuickPick) {
                                      setQuickPickerCell(null);
                                    } else {
                                      setQuickPickerCell({ day, period });
                                    }
                                  }}
                                  className={`w-full h-full min-h-[4rem] rounded-xl border border-dashed flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all cursor-pointer no-print ${
                                    isCurrentCellActiveForQuickPick
                                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-2 ring-indigo-300'
                                      : 'border-slate-200'
                                  }`}
                                  title="ចុចដើម្បីដាក់មុខវិជ្ជាភ្លាមៗ"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span className="text-[10px] font-khmer">ដាក់មុខវិជ្ជា</span>
                                </button>
                              )}

                              {/* Print view for empty slot */}
                              {!slot && (
                                <div className="hidden print:flex h-full items-center justify-center text-slate-300 text-xs font-mono">
                                  -
                                </div>
                              )}

                              {/* Inline Quick-Assign Popover Right on the Cell */}
                              {isCurrentCellActiveForQuickPick && (
                                <div className="absolute top-2 left-2 right-2 z-30 bg-white rounded-xl shadow-xl border border-indigo-200 p-2.5 text-left text-xs font-khmer animate-in fade-in zoom-in-95 no-print">
                                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-2">
                                    <span className="font-bold text-slate-900 text-[11px]">
                                      ⚡ ជ្រើសរើសមុខវិជ្ជាភ្លាមៗ
                                    </span>
                                    <button
                                      onClick={() => setQuickPickerCell(null)}
                                      className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
                                    {subjects.map((sub) => (
                                      <button
                                        key={sub.id}
                                        type="button"
                                        onClick={() => handleQuickAssignSlot(sub)}
                                        className="w-full text-left px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-900 transition-colors flex items-center justify-between group cursor-pointer"
                                      >
                                        <span className="font-bold truncate text-[11px]">
                                          {sub.nameKhmer.split('(')[0].trim()}
                                        </span>
                                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                                      </button>
                                    ))}
                                  </div>

                                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingSlot({
                                          id: '',
                                          dayOfWeek: day,
                                          timeSlot: period.time,
                                          periodNumber: period.period,
                                          classId: selectedClassFilter,
                                          className: classData[selectedClassFilter]?.className || selectedClassFilter,
                                          subjectId: subjects[0]?.id || '',
                                          subjectName: subjects[0]?.nameKhmer || '',
                                          teacherId: teachers[0]?.id || '',
                                          teacherName: teachers[0]?.nameKhmer || '',
                                          room: 'បន្ទប់ ១០១',
                                        });
                                        setQuickPickerCell(null);
                                        setIsScheduleModalOpen(true);
                                      }}
                                      className="text-indigo-600 hover:underline font-bold cursor-pointer"
                                    >
                                      ទម្រង់លម្អិត...
                                    </button>
                                    <span className="text-slate-400 font-mono">{period.time}</span>
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. SUBJECT CATALOG SUB-VIEW */}
        {activeSubTab === 'subject' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-khmer">
                  បញ្ជីមុខវិជ្ជាកម្មវិធីសិក្សាផ្លូវការ (Official Curriculum Subjects)
                </h3>
                <p className="text-xs text-slate-500 font-khmer">
                  មុខវិជ្ជាទាំងអស់ដែលបានកំណត់ក្នុងកាលវិភាគ និងការវាយតម្លៃសិស្ស
                </p>
              </div>

              {permissions.canEdit && (
                <button
                  onClick={() => {
                    setEditingSubject(null);
                    setIsSubjectModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-khmer shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>បន្ថែមមុខវិជ្ជាថ្មី</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono font-bold text-xs border border-indigo-200">
                      {sub.code}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {sub.hoursPerWeek} ម៉ោង / សប្តាហ៍
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm font-khmer">
                      {sub.nameKhmer}
                    </h4>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      {sub.nameEnglish}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-600 font-khmer line-clamp-2">
                    {sub.description || 'មុខវិជ្ជាគោលក្នុងកម្មវិធីសិក្សាជាតិ'}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-khmer">
                      {sub.department}
                    </span>

                    <div className="flex items-center gap-1 no-print">
                      <button
                        onClick={() => {
                          setEditingSubject(sub);
                          setIsSubjectModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="កែប្រែ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`តើអ្នកពិតជាចង់លុបមុខវិជ្ជា ${sub.nameKhmer} មែនទេ?`)) {
                            saveSubjects(subjects.filter((s) => s.id !== sub.id));
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="លុប"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. TEACHER ATTENDANCE SUB-VIEW */}
        {activeSubTab === 'teacher_attendance' && (
          <div className="space-y-4">
            {/* Top Toolbar: Date Picker, Quick Mark All, Telegram Share */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-khmer text-slate-700 whitespace-nowrap">
                    កាលបរិច្ឆេទវត្តមាន៖
                  </span>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>

                <div className="text-xs text-slate-500 font-khmer">
                  សាខា៖ <strong className="text-slate-800">{currentBranch.nameKhmer}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleMarkAllTeachersPresent}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-khmer shadow-xs transition-all cursor-pointer"
                  title="កត់ត្រាមានវត្តមានទាំងអស់"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>ស្រង់វត្តមានគ្រប់គ្រូ (Mark All Present)</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareAttendanceTelegram}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold font-khmer transition-all cursor-pointer"
                  title="ផ្ញើរបាយការណ៍ទៅ Telegram"
                >
                  <Send className="w-3.5 h-3.5 text-sky-600" />
                  <span>ផ្ញើទៅ Telegram</span>
                </button>
              </div>
            </div>

            {/* Quick Summary Metrics */}
            {(() => {
              let presentCount = 0;
              let absentCount = 0;
              let leaveCount = 0;
              let lateCount = 0;
              teachers.forEach((t) => {
                const s = attendanceRecords[t.id]?.status || 'present';
                if (s === 'present') presentCount++;
                else if (s === 'absent') absentCount++;
                else if (s === 'leave') leaveCount++;
                else if (s === 'late') lateCount++;
              });
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <div className="text-[11px] font-bold text-emerald-800 font-khmer">វត្តមាន (Present)</div>
                    <div className="text-xl font-bold font-mono text-emerald-700 mt-1">{presentCount} នាក់</div>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                    <div className="text-[11px] font-bold text-rose-800 font-khmer">អវត្តមាន (Absent)</div>
                    <div className="text-xl font-bold font-mono text-rose-700 mt-1">{absentCount} នាក់</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <div className="text-[11px] font-bold text-amber-800 font-khmer">សុំច្បាប់ (Leave)</div>
                    <div className="text-xl font-bold font-mono text-amber-700 mt-1">{leaveCount} នាក់</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <div className="text-[11px] font-bold text-blue-800 font-khmer">មកយឺត (Late)</div>
                    <div className="text-xl font-bold font-mono text-blue-700 mt-1">{lateCount} នាក់</div>
                  </div>
                </div>
              );
            })()}

            {/* Attendance Matrix Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 font-khmer">
                      <th className="py-3 px-3.5 text-center w-12">ល.រ</th>
                      <th className="py-3 px-4 w-28">កូដគ្រូ</th>
                      <th className="py-3 px-4">ឈ្មោះគ្រូបង្រៀន</th>
                      <th className="py-3 px-4">ថ្នាក់ទទួលបន្ទុក</th>
                      <th className="py-3 px-4">មុខវិជ្ជា</th>
                      <th className="py-3 px-4 text-center w-64">ស្ថានភាពវត្តមាន</th>
                      <th className="py-3 px-4">មូលហេតុ / ចំណាំ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {teachers.map((tch, idx) => {
                      const rec = attendanceRecords[tch.id] || { status: 'present', note: '' };
                      return (
                        <tr key={tch.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3.5 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                            {tch.teacherCode}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 font-khmer">{tch.nameKhmer}</div>
                            <div className="text-[11px] text-slate-400 font-sans">{tch.nameEnglish}</div>
                          </td>
                          <td className="py-3 px-4 font-khmer">
                            {tch.homeroomClassName ? (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                                {tch.homeroomClassName}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[11px] font-khmer text-slate-600 max-w-xs truncate">
                            {tch.subjects.map((s) => s.split('(')[0].trim()).join(', ')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
                              <button
                                type="button"
                                onClick={() => handleAttendanceChange(tch.id, 'present')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-khmer font-bold transition-all cursor-pointer ${
                                  rec.status === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                វត្តមាន
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAttendanceChange(tch.id, 'absent')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-khmer font-bold transition-all cursor-pointer ${
                                  rec.status === 'absent'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                អវត្តមាន
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAttendanceChange(tch.id, 'leave')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-khmer font-bold transition-all cursor-pointer ${
                                  rec.status === 'leave'
                                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                ច្បាប់
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAttendanceChange(tch.id, 'late')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-khmer font-bold transition-all cursor-pointer ${
                                  rec.status === 'late'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                យឺត
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={rec.note || ''}
                              onChange={(e) => handleAttendanceChange(tch.id, rec.status, e.target.value)}
                              placeholder="ចំណាំ ឬ មូលហេតុ..."
                              className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-khmer bg-white focus:bg-white focus:border-indigo-400"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: MANAGE TIME PERIODS (កែប្រែម៉ោងសិក្សា)            */}
      {/* ======================================================== */}
      {isTimePeriodModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 text-xs font-khmer my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    កំណត់ និងកែប្រែម៉ោងសិក្សា (Manage Study Time Periods)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-khmer">
                    កំណត់ចន្លោះម៉ោងចាប់ផ្តើម-បញ្ចប់ បន្ថែមម៉ោង ឬជ្រើសរើសទម្រង់គំរូស្រេច
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTimePeriodModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ready-made Presets Bar */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>ទម្រង់ម៉ោងគំរូរហ័ស (Ready-made Presets)៖</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TIME_PERIOD_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (confirm(`តើអ្នកចង់កំណត់ម៉ោងសិក្សាទៅជាទម្រង់ "${preset.name}" មែនទេ?`)) {
                        saveTimePeriods(preset.periods);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{preset.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">({preset.periods.length} ម៉ោង)</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Periods List */}
            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-600 pb-1 border-b border-slate-100">
                <div className="col-span-2 text-center">ម៉ោងទី</div>
                <div className="col-span-4">ចន្លោះម៉ោង (Start - End)</div>
                <div className="col-span-3">ឈ្មោះសម្គាល់</div>
                <div className="col-span-2">វេន</div>
                <div className="col-span-1 text-center">លុប</div>
              </div>

              {timePeriods.map((p, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50"
                >
                  <div className="col-span-2 text-center font-mono font-bold text-slate-700">
                    #{p.period}
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={p.time}
                      onChange={(e) => {
                        const updated = [...timePeriods];
                        updated[idx].time = e.target.value;
                        setTimePeriods(updated);
                      }}
                      placeholder="07:30 - 08:30"
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-400/20"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={p.labelKhmer || `ម៉ោងទី ${p.period}`}
                      onChange={(e) => {
                        const updated = [...timePeriods];
                        updated[idx].labelKhmer = e.target.value;
                        setTimePeriods(updated);
                      }}
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-khmer focus:ring-2 focus:ring-indigo-400/20"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={p.shift || 'morning'}
                      onChange={(e) => {
                        const updated = [...timePeriods];
                        updated[idx].shift = e.target.value as any;
                        setTimePeriods(updated);
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-khmer cursor-pointer"
                    >
                      <option value="morning">ព្រឹក</option>
                      <option value="afternoon">រសៀល</option>
                      <option value="evening">យប់</option>
                    </select>
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (timePeriods.length <= 1) {
                          alert('មិនអាចលុបបានទេ ត្រូវមានយ៉ាងហោចណាស់ ១ ម៉ោងសិក្សា');
                          return;
                        }
                        const filtered = timePeriods.filter((_, i) => i !== idx).map((item, newIdx) => ({
                          ...item,
                          period: newIdx + 1,
                        }));
                        setTimePeriods(filtered);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                      title="លុបម៉ោងនេះ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextNum = timePeriods.length + 1;
                  const newPeriod: ScheduleTimePeriod = {
                    period: nextNum,
                    time: '15:40 - 16:30',
                    labelKhmer: `ម៉ោងទី ${nextNum}`,
                    shift: nextNum > 4 ? 'afternoon' : 'morning',
                  };
                  setTimePeriods([...timePeriods, newPeriod]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>បន្ថែមម៉ោងសិក្សា (# {timePeriods.length + 1})</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    saveTimePeriods(DEFAULT_TIME_PERIODS);
                  }}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800 rounded-xl text-xs cursor-pointer"
                >
                  កំណត់ដូចដើម (Reset)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveTimePeriods(timePeriods);
                    setIsTimePeriodModalOpen(false);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  រក្សាទុកម៉ោងសិក្សា
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: 1-CLICK INSTANT AUTO-GENERATE SCHEDULE          */}
      {/* ======================================================== */}
      {isAutoGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs font-khmer my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    ⚡ បង្កើតកាលវិភាគស្វ័យប្រវត្តិកំពូលរហ័ស
                  </h3>
                  <p className="text-[11px] text-slate-500 font-khmer">
                    បង្កើតកាលវិភាគពេញមួយសប្តាហ៍ (ចន្ទ-សៅរ៍) ដោយស្វ័យប្រវត្តិតាមកម្មវិធីសិក្សា
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAutoGenerateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>ថ្នាក់គោលដៅ៖ {classData[selectedClassFilter]?.className || selectedClassFilter}</span>
                </div>
                <div className="text-[11px] text-slate-600 font-khmer">
                  ប្រព័ន្ធនឹងរៀបចំមុខវិជ្ជាស្នូល (ភាសាខ្មែរ គណិតវិទ្យា អង់គ្លេស វិទ្យាសាស្ត្រ សីលធម៌ កីឡា) និងផ្គូផ្គងជាមួយគ្រូបង្រៀនឯកទេស និងគ្រូបន្ទុកថ្នាក់ដោយស្វ័យប្រវត្តិ។
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ជ្រើសរើសរបៀបបង្កើត (Generation Mode)៖
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="autoGenMode"
                      defaultChecked
                      id="mode-replace"
                      className="text-indigo-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">បង្កើតថ្មីទាំងស្រុង (Full Replace)</div>
                      <div className="text-[10px] text-slate-500">
                        លុបកាលវិភាគចាស់របស់ថ្នាក់នេះ ហើយបង្កើតកាលវិភាគពេញលេញ ៦ ថ្ងៃឡើងវិញ
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="autoGenMode"
                      id="mode-fill"
                      className="text-indigo-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">បំពេញតែក្រឡាទទេ (Fill Empty Slots Only)</div>
                      <div className="text-[10px] text-slate-500">
                        រក្សាម៉ោងដែលមានរួច ហើយបំពេញបន្ថែមតែម៉ោងដែលនៅទំនេរ
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAutoGenerateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const isReplace = (document.getElementById('mode-replace') as HTMLInputElement)?.checked;
                    handleAutoGenerateSchedule(selectedClassFilter, isReplace);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>ដំណើរការបង្កើតភ្លាមៗ (១ វិនាទី)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: BATCH MULTI-DAY QUICK FILL                      */}
      {/* ======================================================== */}
      {isBatchAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs font-khmer my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    បញ្ចូលមុខវិជ្ជាជាបណ្តុំ (Batch Multi-Day)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-khmer">
                    កំណត់មុខវិជ្ជាតែមួយដង សម្រាប់ច្រើនថ្ងៃ និងម៉ោងសិក្សា
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const subjectId = formData.get('batchSubject') as string;
                const teacherId = formData.get('batchTeacher') as string;
                const room = formData.get('batchRoom') as string || 'បន្ទប់ ១០១';

                const selectedDays: ScheduleSlot['dayOfWeek'][] = [];
                DAYS_OF_WEEK.forEach((d) => {
                  if (formData.get(`day_${d}`)) {
                    selectedDays.push(d);
                  }
                });

                const selectedPeriods: number[] = [];
                timePeriods.forEach((p) => {
                  if (formData.get(`period_${p.period}`)) {
                    selectedPeriods.push(p.period);
                  }
                });

                if (selectedDays.length === 0 || selectedPeriods.length === 0) {
                  alert('សូមជ្រើសរើសយ៉ាងហោចណាស់ ១ ថ្ងៃ និង ១ ម៉ោងសិក្សា');
                  return;
                }

                const subObj = subjects.find((s) => s.id === subjectId) || subjects[0];
                const tchObj = teachers.find((t) => t.id === teacherId) || teachers[0];
                const targetClassName = classData[selectedClassFilter]?.className || selectedClassFilter;

                const newSlots: ScheduleSlot[] = [];
                selectedDays.forEach((day) => {
                  selectedPeriods.forEach((pNum) => {
                    const pObj = timePeriods.find((tp) => tp.period === pNum) || timePeriods[0];
                    newSlots.push({
                      id: `sch-${Date.now()}-${day}-${pNum}-${Math.random().toString(36).substr(2, 4)}`,
                      dayOfWeek: day,
                      timeSlot: pObj.time,
                      periodNumber: pNum,
                      classId: selectedClassFilter,
                      className: targetClassName,
                      subjectId: subObj.id,
                      subjectName: subObj.nameKhmer.split('(')[0].trim(),
                      teacherId: tchObj.id,
                      teacherName: tchObj.nameKhmer,
                      room,
                    });
                  });
                });

                // Overwrite any collision slots for chosen days & periods
                const cleaned = schedules.filter(
                  (s) =>
                    !(
                      s.classId === selectedClassFilter &&
                      selectedDays.includes(s.dayOfWeek) &&
                      selectedPeriods.includes(s.periodNumber)
                    )
                );

                saveSchedules([...cleaned, ...newSlots]);
                setIsBatchAddModalOpen(false);
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">មុខវិជ្ជា (Subject) *</label>
                <select
                  name="batchSubject"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold cursor-pointer"
                  required
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.nameKhmer}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">គ្រូបង្រៀន (Teacher) *</label>
                <select
                  name="batchTeacher"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold cursor-pointer"
                  required
                >
                  {teachers.map((tch) => (
                    <option key={tch.id} value={tch.id}>
                      {tch.nameKhmer} ({tch.teacherCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ជ្រើសរើសថ្ងៃបង្រៀន (Days) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <label
                      key={day}
                      className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-[11px]"
                    >
                      <input
                        type="checkbox"
                        name={`day_${day}`}
                        defaultChecked={day === 'Monday' || day === 'Wednesday' || day === 'Friday'}
                        className="rounded text-indigo-600"
                      />
                      <span>{DAYS_KH[day].split(' ')[0]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ជ្រើសរើសម៉ោងសិក្សា (Periods) *
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                  {timePeriods.map((p) => (
                    <label
                      key={p.period}
                      className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-[11px]"
                    >
                      <input
                        type="checkbox"
                        name={`period_${p.period}`}
                        defaultChecked={p.period === 1}
                        className="rounded text-indigo-600"
                      />
                      <span className="font-mono">
                        {p.labelKhmer || `ម៉ោងទី ${p.period}`}: {p.time}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">បន្ទប់រៀន (Room)</label>
                <input
                  name="batchRoom"
                  type="text"
                  defaultValue="បន្ទប់ ១០១"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  ⚡ បញ្ចូលទាំងអស់
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: COPY SCHEDULE FROM ANOTHER CLASS                */}
      {/* ======================================================== */}
      {isCopyScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs font-khmer my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Copy className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    ចម្លងកាលវិភាគពីថ្នាក់ផ្សេង (Copy Schedule)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-khmer">
                    ចម្លងកាលវិភាគទាំងមូលពីថ្នាក់មួយ មកកាន់ថ្នាក់មួយទៀត
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCopyScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const source = formData.get('sourceClass') as string;
                const target = formData.get('targetClass') as string;
                if (source === target) {
                  alert('ថ្នាក់ប្រភព និងថ្នាក់គោលដៅមិនអាចដូចគ្នាបានទេ');
                  return;
                }
                handleCopySchedule(source, target);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ចម្លងចេញពីថ្នាក់ (Source Class) *
                </label>
                <select
                  name="sourceClass"
                  defaultValue={orderedClassList[0]?.classId}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold cursor-pointer"
                  required
                >
                  {orderedClassList.map((c) => (
                    <option key={c.classId} value={c.classId}>
                      {c.className} ({schedules.filter((s) => s.classId === c.classId).length} ម៉ោង)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ចម្លងចូលទៅកាន់ថ្នាក់ (Target Class) *
                </label>
                <select
                  name="targetClass"
                  defaultValue={selectedClassFilter}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold cursor-pointer"
                  required
                >
                  {orderedClassList.map((c) => (
                    <option key={c.classId} value={c.classId}>
                      {c.className}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCopyScheduleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  ចម្លងភ្លាមៗ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: SINGLE SCHEDULE SLOT (ADD / EDIT)               */}
      {/* ======================================================== */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs font-khmer my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingSlot ? 'កែប្រែម៉ោងបង្រៀន' : 'បញ្ចូលម៉ោងបង្រៀនក្នុងកាលវិភាគ'}
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const classId = formData.get('classId') as string;
                const dayOfWeek = formData.get('dayOfWeek') as ScheduleSlot['dayOfWeek'];
                const timeSlot = formData.get('timeSlot') as string;
                const subjectId = formData.get('subjectId') as string;
                const teacherId = formData.get('teacherId') as string;
                const room = formData.get('room') as string || 'បន្ទប់ ១០១';

                const targetClass = classData[classId] || { className: classId };
                const subObj = subjects.find((s) => s.id === subjectId) || subjects[0];
                const tchObj = teachers.find((t) => t.id === teacherId) || teachers[0];

                const periodObj = timePeriods.find((p) => p.time === timeSlot);
                const periodNumber = periodObj ? periodObj.period : 1;

                if (editingSlot && editingSlot.id) {
                  saveSchedules(
                    schedules.map((s) =>
                      s.id === editingSlot.id
                        ? {
                            ...s,
                            classId,
                            className: targetClass.className,
                            dayOfWeek,
                            timeSlot,
                            periodNumber,
                            subjectId,
                            subjectName: subObj.nameKhmer.split('(')[0].trim(),
                            teacherId,
                            teacherName: tchObj.nameKhmer,
                            room,
                          }
                        : s
                    )
                  );
                } else {
                  // Replace any collision
                  const filtered = schedules.filter(
                    (s) =>
                      !(
                        s.classId === classId &&
                        s.dayOfWeek === dayOfWeek &&
                        (s.periodNumber === periodNumber || s.timeSlot === timeSlot)
                      )
                  );

                  const newSlot: ScheduleSlot = {
                    id: `sch-${Date.now()}`,
                    classId,
                    className: targetClass.className,
                    dayOfWeek,
                    timeSlot,
                    periodNumber,
                    subjectId,
                    subjectName: subObj.nameKhmer.split('(')[0].trim(),
                    teacherId,
                    teacherName: tchObj.nameKhmer,
                    room,
                  };
                  saveSchedules([...filtered, newSlot]);
                }

                setIsScheduleModalOpen(false);
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ថ្នាក់រៀន (Class) *</label>
                <select
                  name="classId"
                  defaultValue={editingSlot?.classId || selectedClassFilter}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold cursor-pointer"
                  required
                >
                  {orderedClassList.map((c) => (
                    <option key={c.classId} value={c.classId}>
                      {c.className} ({c.period})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ថ្ងៃសិក្សា (Day) *</label>
                  <select
                    name="dayOfWeek"
                    defaultValue={editingSlot?.dayOfWeek || 'Monday'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer cursor-pointer"
                    required
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {DAYS_KH[d]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ម៉ោងសិក្សា (Period) *</label>
                  <select
                    name="timeSlot"
                    defaultValue={editingSlot?.timeSlot || timePeriods[0]?.time}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono cursor-pointer"
                    required
                  >
                    {timePeriods.map((p) => (
                      <option key={p.period} value={p.time}>
                        {p.labelKhmer || `ម៉ោង ${p.period}`}: {p.time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">មុខវិជ្ជា (Subject) *</label>
                <select
                  name="subjectId"
                  defaultValue={editingSlot?.subjectId || subjects[0]?.id}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold cursor-pointer"
                  required
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.nameKhmer} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">គ្រូបង្រៀន (Teacher) *</label>
                <select
                  name="teacherId"
                  defaultValue={editingSlot?.teacherId || teachers[0]?.id}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold cursor-pointer"
                  required
                >
                  {teachers.map((tch) => (
                    <option key={tch.id} value={tch.id}>
                      {tch.nameKhmer} ({tch.nameEnglish}) · {tch.teacherCode}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">បន្ទប់រៀន (Room)</label>
                <input
                  name="room"
                  type="text"
                  defaultValue={editingSlot?.room || 'បន្ទប់ ១០១'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  {editingSlot ? 'រក្សាទុកការកែប្រែ' : 'បញ្ចូលកាលវិភាគ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: ADD / EDIT TEACHER                              */}
      {/* ======================================================== */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs font-khmer my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingTeacher ? 'កែប្រែព័ត៌មានគ្រូបង្រៀន' : 'បន្ថែមគ្រូបង្រៀនថ្មី'}
              </h3>
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const teacherCode = formData.get('teacherCode') as string;
                const nameKhmer = formData.get('nameKhmer') as string;
                const nameEnglish = formData.get('nameEnglish') as string;
                const gender = formData.get('gender') as 'Female' | 'Male';
                const phone = formData.get('phone') as string;
                const email = formData.get('email') as string;
                const qualification = formData.get('qualification') as string;
                const homeroomClassId = formData.get('homeroomClassId') as string;
                const status = formData.get('status') as 'active' | 'leave';

                const matchedClass = classData[homeroomClassId];

                if (editingTeacher) {
                  saveTeachers(
                    teachers.map((t) =>
                      t.id === editingTeacher.id
                        ? {
                            ...t,
                            teacherCode,
                            nameKhmer,
                            nameEnglish,
                            gender,
                            phone,
                            email,
                            qualification,
                            homeroomClassId,
                            homeroomClassName: matchedClass?.className || '',
                            status,
                          }
                        : t
                    )
                  );
                } else {
                  const newTeacher: TeacherRecord = {
                    id: `tch-${Date.now()}`,
                    teacherCode,
                    nameKhmer,
                    nameEnglish,
                    gender,
                    dob: '1990-01-01',
                    phone,
                    email,
                    qualification,
                    subjects: ['ភាសាខ្មែរ (Khmer Literature)', 'គណិតវិទ្យា (Mathematics)'],
                    homeroomClassId,
                    homeroomClassName: matchedClass?.className || '',
                    joinDate: new Date().toISOString().slice(0, 10),
                    status,
                    branchId: currentBranch.id,
                  };
                  saveTeachers([...teachers, newTeacher]);
                }
                setIsTeacherModalOpen(false);
              }}
              className="mt-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">កូដគ្រូ *</label>
                  <input
                    name="teacherCode"
                    type="text"
                    defaultValue={editingTeacher?.teacherCode || `TCH-${(teachers.length + 1).toString().padStart(3, '0')}`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ភេទ *</label>
                  <select
                    name="gender"
                    defaultValue={editingTeacher?.gender || 'Female'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer cursor-pointer"
                  >
                    <option value="Female">ស្រី (Female)</option>
                    <option value="Male">ប្រុស (Male)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ឈ្មោះជាភាសាខ្មែរ *</label>
                  <input
                    name="nameKhmer"
                    type="text"
                    defaultValue={editingTeacher?.nameKhmer || ''}
                    placeholder="ឧ. សុខ ម៉ាលី"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ឈ្មោះឡាតាំង (English) *</label>
                  <input
                    name="nameEnglish"
                    type="text"
                    defaultValue={editingTeacher?.nameEnglish || ''}
                    placeholder="e.g. Sok Maly"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-sans"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">លេខទូរស័ព្ទ *</label>
                  <input
                    name="phone"
                    type="text"
                    defaultValue={editingTeacher?.phone || ''}
                    placeholder="012 345 678"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">អ៊ីមែល</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={editingTeacher?.email || ''}
                    placeholder="teacher@bimrangsei.edu.kh"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ថ្នាក់ទទួលបន្ទុក (Homeroom)</label>
                  <select
                    name="homeroomClassId"
                    defaultValue={editingTeacher?.homeroomClassId || ''}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer cursor-pointer"
                  >
                    <option value="">-- មិនមានបន្ទុកថ្នាក់ --</option>
                    {orderedClassList.map((c) => (
                      <option key={c.classId} value={c.classId}>
                        {c.className} ({c.period})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ស្ថានភាពបង្រៀន</label>
                  <select
                    name="status"
                    defaultValue={editingTeacher?.status || 'active'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer cursor-pointer"
                  >
                    <option value="active">បង្រៀនសកម្ម (Active)</option>
                    <option value="leave">ឈប់សម្រាក (On Leave)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">កម្រិតវប្បធម៌ / សញ្ញាបត្រ</label>
                <input
                  name="qualification"
                  type="text"
                  defaultValue={editingTeacher?.qualification || 'បរិញ្ញាបត្រអប់រំ (B.Ed)'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  រក្សាទុក
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 7: ADD / EDIT SUBJECT                              */}
      {/* ======================================================== */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs font-khmer my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingSubject ? 'កែប្រែមុខវិជ្ជា' : 'បន្ថែមមុខវិជ្ជាថ្មី'}
              </h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const code = formData.get('code') as string;
                const nameKhmer = formData.get('nameKhmer') as string;
                const nameEnglish = formData.get('nameEnglish') as string;
                const hours = Number(formData.get('hoursPerWeek')) || 4;
                const department = formData.get('department') as SubjectItem['department'];
                const description = formData.get('description') as string;

                if (editingSubject) {
                  saveSubjects(
                    subjects.map((s) =>
                      s.id === editingSubject.id
                        ? { ...s, code, nameKhmer, nameEnglish, hoursPerWeek: hours, department, description }
                        : s
                    )
                  );
                } else {
                  const newSub: SubjectItem = {
                    id: `sub-${Date.now()}`,
                    code,
                    nameKhmer,
                    nameEnglish,
                    hoursPerWeek: hours,
                    department,
                    description,
                    gradeLevels: ['ថ្នាក់ទី ១', 'ថ្នាក់ទី ២'],
                  };
                  saveSubjects([...subjects, newSub]);
                }
                setIsSubjectModalOpen(false);
              }}
              className="mt-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">កូដមុខវិជ្ជា *</label>
                  <input
                    name="code"
                    type="text"
                    defaultValue={editingSubject?.code || 'SUB-01'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ម៉ោង / សប្តាហ៍</label>
                  <input
                    name="hoursPerWeek"
                    type="number"
                    defaultValue={editingSubject?.hoursPerWeek || 5}
                    min={1}
                    max={20}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ឈ្មោះមុខវិជ្ជា (ខ្មែរ) *</label>
                <input
                  name="nameKhmer"
                  type="text"
                  defaultValue={editingSubject?.nameKhmer || ''}
                  placeholder="ឧ. ភាសាខ្មែរ"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ឈ្មោះជាភាសាអង់គ្លេស *</label>
                <input
                  name="nameEnglish"
                  type="text"
                  defaultValue={editingSubject?.nameEnglish || ''}
                  placeholder="e.g. Khmer Language"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ដេប៉ាតឺម៉ង់ / ផ្នែក</label>
                <select
                  name="department"
                  defaultValue={editingSubject?.department || 'Khmer Literature'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer cursor-pointer"
                >
                  <option value="Khmer Literature">អក្សរសាស្ត្រខ្មែរ (Khmer Literature)</option>
                  <option value="Mathematics & Science">គណិតវិទ្យា & វិទ្យាសាស្ត្រ (Math & Science)</option>
                  <option value="Foreign Languages">ភាសាបរទេស (Foreign Languages)</option>
                  <option value="Social Studies">សិក្សាសង្គម & សីលធម៌ (Social Studies)</option>
                  <option value="Arts & Physical Education">សិល្បៈ & កីឡា (Arts & PE)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ការពិពណ៌នា</label>
                <textarea
                  name="description"
                  defaultValue={editingSubject?.description || ''}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  រក្សាទុក
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
