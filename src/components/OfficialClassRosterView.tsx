import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StudentFeeRecord, StudentAdmissionData } from '../types';
import {
  Printer,
  Download,
  Share2,
  Send,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  FileSpreadsheet,
  Users,
  Search,
  Eye,
  RefreshCw,
  Phone,
  User,
  GraduationCap,
  Calendar,
  Layers,
  ChevronDown,
  Sparkles,
  UserCheck,
  Settings,
  Upload,
  Camera,
  Loader2,
  SlidersHorizontal,
  GripVertical,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  RotateCcw,
  FileText,
  ChevronLeft,
  ChevronRight,
  Heart,
  Utensils,
  BookOpen,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { ExcelStudentImportModal } from './ExcelStudentImportModal';
import { StudentGeneralInfoDocument } from './StudentGeneralInfoDocument';

export interface RosterStudentRow {
  id: number;
  studentCode?: string;
  name: string;
  latinName?: string;
  gender: 'Man' | 'Female';
  dob: string;
  age: number;
  address: string;
  phone: string;
  guardianName: string;
  note?: string;
  admissionData?: StudentAdmissionData;
  originalStudent?: StudentFeeRecord;
}

// 15 Students Transcribed Faithfully from User Uploaded Image
export const OFFICIAL_USER_IMAGE_STUDENTS: RosterStudentRow[] = [
  { id: 1, studentCode: 'BIM-2020-001', name: 'ផេក ស៊ីវម៉ិញ', latinName: 'PHEK SIVMINH', gender: 'Man', dob: '6/26/2020', age: 6, address: 'អូរខាវ', phone: '0313033311', guardianName: 'ម៉ែន ប៉ិកា', note: '' },
  { id: 2, studentCode: 'BIM-2020-002', name: 'ហាក់ សៀវម៉ិញ', latinName: 'HAK SIEVMINH', gender: 'Female', dob: '11/9/2020', age: 6, address: 'អូរឫស្សី', phone: '0883646145', guardianName: 'ហាក់ ប៊ុនសេង', note: '' },
  { id: 3, studentCode: 'BIM-2020-003', name: 'សេង ម៉េងហួរ', latinName: 'SENG MENGHOUR', gender: 'Man', dob: '5/20/2020', age: 6, address: 'អូរឫស្សី', phone: '0762841041', guardianName: 'សេង ថិន', note: '' },
  { id: 4, studentCode: 'BIM-2020-004', name: 'ណាប់ ផានុន', latinName: 'NAP PHANUN', gender: 'Man', dob: '3/5/2020', age: 6, address: 'សិលាខ្មែរ', phone: '095251089', guardianName: 'ប៉ាង ចំណាប់', note: '' },
  { id: 5, studentCode: 'BIM-2020-005', name: 'បញ្ញា ខេម៉ា', latinName: 'PANHA KHEMA', gender: 'Man', dob: '2/29/2020', age: 6, address: 'អូរឫស្សី', phone: '099549553', guardianName: 'ឆាន បញ្ញា', note: '' },
  { id: 6, studentCode: 'BIM-2020-006', name: 'ប្រុស សោភា', latinName: 'PROS SOPHEA', gender: 'Female', dob: '09/09/2020', age: 6, address: 'សិលាខ្មែរ', phone: '069690397', guardianName: 'ឡាង ប្រុស', note: '' },
  { id: 7, studentCode: 'BIM-2020-007', name: 'ហឿន មេត្តា', latinName: 'HOEUN METTA', gender: 'Man', dob: '06/08/2020', age: 6, address: 'ទួលពង្រ', phone: '077494981', guardianName: 'យាង មេក', note: '' },
  { id: 8, studentCode: 'BIM-2020-008', name: 'ឡន ស្រីលាភ', latinName: 'LORN SREYLEAP', gender: 'Female', dob: '03/13/2020', age: 6, address: 'ទួលពង្រ', phone: 'No', guardianName: 'លឹម លឹម', note: '' },
  { id: 9, studentCode: 'BIM-2020-009', name: 'វីរៈ ចំរ៉ុង', latinName: 'VIRAK CHAMROEUN', gender: 'Man', dob: '06/23/2020', age: 6, address: 'ទួលពង្រ', phone: '0884147151', guardianName: 'ប៊ុន វីរៈ', note: '' },
  { id: 10, studentCode: 'BIM-2020-010', name: 'វុត ភា', latinName: 'VUT PHEA', gender: 'Man', dob: '04/04/2020', age: 6, address: 'ទួលពង្រ', phone: '0883827668', guardianName: 'ជា វុត', note: '' },
  { id: 11, studentCode: 'BIM-2020-011', name: 'ភ្ញៀច សីលៀង', latinName: 'PHNJECH SEYLEANG', gender: 'Female', dob: '10/29/2019', age: 7, address: 'អូរឫស្សី', phone: 'No', guardianName: 'វិច ភ្ញៀច', note: '' },
  { id: 12, studentCode: 'BIM-2020-012', name: 'ប៉ោយ ម៉ាយុ', latinName: 'POY MAYU', gender: 'Female', dob: '06/09/2020', age: 6, address: 'ទួលពង្រ', phone: '0973611517', guardianName: 'ឆៃ ថិន', note: '' },
  { id: 13, studentCode: 'BIM-2020-013', name: 'វឿន ណារ៉ិទ្ធី', latinName: 'VOEUN NARITTHY', gender: 'Man', dob: '12/03/2020', age: 5, address: 'ទួលពង្រ', phone: '070935208', guardianName: 'លី សាឌឿន', note: '' },
  { id: 14, studentCode: 'BIM-2020-014', name: 'សុវត្ថិ ដេននី', latinName: 'SOVATH DENNY', gender: 'Man', dob: '12/06/2020', age: 5, address: 'ទួលពង្រ', phone: '0965599919', guardianName: 'ញាន សុវត្ថិ', note: '' },
  { id: 15, studentCode: 'BIM-2020-015', name: 'ក្រូចចាន់ លីហួត', latinName: 'KROUCHCHAN LYHUOT', gender: 'Man', dob: '2/13/2020', age: 6, address: 'ទួលពង្រ', phone: 'No', guardianName: 'ឡាង ក្រូច', note: '' },
];

export const OfficialClassRosterView: React.FC = () => {
  const {
    classData,
    orderedClassList,
    reorderClasses,
    sortClasses,
    permissions,
    settings,
    updateSettings,
    branches,
    currentBranchId,
    currentBranch,
    t,
    sendTelegramAlert,
    allUsers,
    updateClassTeacher,
  } = useApp();

  // Mode: 'official_image' (the 15 students uploaded by user), or classId (1A, 1B, 2A...)
  const [selectedRosterSource, setSelectedRosterSource] = useState<string>('official_image');

  // Vertical Slice states
  const [isClassSliceOpen, setIsClassSliceOpen] = useState(true);
  const [classSliceSearch, setClassSliceSearch] = useState('');
  const [draggedClassIndex, setDraggedClassIndex] = useState<number | null>(null);
  const [isClassSortDropdownOpen, setIsClassSortDropdownOpen] = useState(false);
  const classSortDropdownRef = useRef<HTMLDivElement>(null);

  // Admission Form Details Modal state (for requirement 2)
  const [selectedStudentForAdmission, setSelectedStudentForAdmission] = useState<RosterStudentRow | null>(null);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Search filter inside table
  const [searchFilter, setSearchFilter] = useState('');

  // Header configs
  const [classNameTitle, setClassNameTitle] = useState('បញ្ជីនាមសិស្សតាមថ្នាក់');
  const [academicYear, setAcademicYear] = useState('២០២៦-២០២៧');
  const [homeroomTeacher, setHomeroomTeacher] = useState('សុខ ម៉ាលី');
  const [teacherPhone, setTeacherPhone] = useState('012 345 678');
  const [tempTeacherName, setTempTeacherName] = useState(homeroomTeacher);
  const [tempTeacherPhone, setTempTeacherPhone] = useState(teacherPhone);

  // Settings Modal & Display Toggles (ការកំណត់ក្បាលបញ្ជី ជើងបញ្ជី និងជួរឈរ)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsActiveSubTab, setSettingsActiveSubTab] = useState<'header_footer' | 'signatures' | 'columns'>('header_footer');
  const [showHeader, setShowHeader] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [ministryName, setMinistryName] = useState('ក្រសួងអប់រំ យុវជន និងកីឡា');
  const [departmentName, setDepartmentName] = useState('មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តបន្ទាយមានជ័យ');
  const [schoolNameKhmer, setSchoolNameKhmer] = useState(settings?.schoolNameKhmer || 'សាលាអន្តរជាតិ BIM');
  const [schoolNameEnglish, setSchoolNameEnglish] = useState(settings?.schoolNameEnglish || 'BIM School');
  const [customDirectorName, setCustomDirectorName] = useState(settings?.directorName || 'យ៉េន ណាវីន');
  const [footerLocationDate, setFooterLocationDate] = useState('ថ្ងៃ................ ទី....... ខែ............... ឆ្នាំ២០២៦');

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    gender: true,
    dob: true,
    age: true,
    address: true,
    phone: true,
    guardian: true,
    note: true,
    actions: true,
  });

  // Temporary edit states for modal
  const [tempTitle, setTempTitle] = useState(classNameTitle);
  const [tempAcademicYear, setTempAcademicYear] = useState(academicYear);
  const [tempHomeroomTeacher, setTempHomeroomTeacher] = useState(homeroomTeacher);
  const [tempDirectorName, setTempDirectorName] = useState(customDirectorName);
  const [tempSchoolNameKhmer, setTempSchoolNameKhmer] = useState(schoolNameKhmer);
  const [tempSchoolNameEnglish, setTempSchoolNameEnglish] = useState(schoolNameEnglish);
  const [tempMinistryName, setTempMinistryName] = useState(ministryName);
  const [tempDepartmentName, setTempDepartmentName] = useState(departmentName);
  const [tempFooterDate, setTempFooterDate] = useState(footerLocationDate);

  // Close class sort dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (classSortDropdownRef.current && !classSortDropdownRef.current.contains(e.target as Node)) {
        setIsClassSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate age helper
  const calculateAge = (dobStr: string): number => {
    if (!dobStr) return 6;
    try {
      let birthYear = 2020;
      if (dobStr.includes('-')) {
        const parts = dobStr.split('-');
        birthYear = parseInt(parts[0], 10);
      } else if (dobStr.includes('/')) {
        const parts = dobStr.split('/');
        const yr = parts[2] || parts[0];
        if (yr && yr.length === 4) {
          birthYear = parseInt(yr, 10);
        }
      }
      const calculated = 2026 - birthYear;
      return isNaN(calculated) || calculated <= 0 ? 6 : calculated;
    } catch {
      return 6;
    }
  };

  // Convert current student records into RosterStudentRow structure
  const activeStudents: RosterStudentRow[] = useMemo(() => {
    if (selectedRosterSource === 'official_image') {
      return OFFICIAL_USER_IMAGE_STUDENTS;
    }
    const cls = classData[selectedRosterSource] || orderedClassList[0] || Object.values(classData)[0];
    if (!cls) return [];

    return cls.students.map((st, idx) => {
      return {
        id: st.id,
        studentCode: st.studentCode,
        name: st.name,
        latinName: st.latinName,
        gender: st.gender,
        dob: st.dob || '01/01/2020',
        age: calculateAge(st.dob || ''),
        address: st.address || st.admissionData?.permanentAddress || 'អូរឫស្សី',
        phone: st.phone || st.admissionData?.caretaker?.phone || st.admissionData?.father?.phone || 'No',
        guardianName: st.guardianName || st.admissionData?.caretaker?.name || st.admissionData?.father?.name || st.admissionData?.mother?.name || '---',
        note: st.note === 'New' ? 'សិស្សថ្មី' : (st.note || ''),
        admissionData: st.admissionData,
        originalStudent: st,
      };
    });
  }, [selectedRosterSource, classData, orderedClassList]);

  // Filtered classes in left slice
  const filteredClasses = useMemo(() => {
    if (!classSliceSearch.trim()) return orderedClassList;
    const q = classSliceSearch.toLowerCase().trim();
    return orderedClassList.filter((c) =>
      c.className.toLowerCase().includes(q) ||
      c.period.toLowerCase().includes(q) ||
      (c.homeroomTeacher && c.homeroomTeacher.toLowerCase().includes(q))
    );
  }, [orderedClassList, classSliceSearch]);

  // Filtered students for display in table
  const filteredStudents = useMemo(() => {
    if (!searchFilter.trim()) return activeStudents;
    const q = searchFilter.toLowerCase().trim();
    return activeStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.latinName && s.latinName.toLowerCase().includes(q)) ||
        s.guardianName.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.id.toString() === q
    );
  }, [activeStudents, searchFilter]);

  // Counts
  const totalStudentsCount = activeStudents.length;
  const femaleCount = activeStudents.filter((s) => s.gender === 'Female').length;
  const maleCount = activeStudents.filter((s) => s.gender === 'Man').length;

  const handleSelectSource = (srcId: string) => {
    setSelectedRosterSource(srcId);
    if (srcId === 'official_image') {
      setClassNameTitle('បញ្ជីនាមសិស្ស (គំរូផ្លូវការ)');
      setAcademicYear('២០២៦-២០២៧');
      setHomeroomTeacher('សុខ ម៉ាលី');
      setTeacherPhone('012 345 678');
    } else {
      const cls = classData[srcId];
      if (cls) {
        setClassNameTitle(cls.className);
        setAcademicYear(settings.academicYear || '២០២៦-២០២៧');
        const assignedTeacher = cls.homeroomTeacher || 'គ្រូបន្ទុកថ្នាក់';
        const assignedPhone = cls.teacherPhone || settings.phone;
        setHomeroomTeacher(assignedTeacher);
        setTeacherPhone(assignedPhone);
        setTempTeacherName(assignedTeacher);
        setTempTeacherPhone(assignedPhone);
      }
    }
  };

  const handleSaveTeacherAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempTeacherName.trim()) return;
    setHomeroomTeacher(tempTeacherName.trim());
    setTeacherPhone(tempTeacherPhone.trim());
    if (selectedRosterSource !== 'official_image' && updateClassTeacher) {
      updateClassTeacher(selectedRosterSource, tempTeacherName.trim(), tempTeacherPhone.trim());
    }
    setIsTeacherModalOpen(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Gender', 'Date of birth', 'Student Age', 'Address', 'Phone Number', "Guardian's Name", 'Other markings'];
    const rows = activeStudents.map((s) => [
      s.id,
      `"${s.name}"`,
      s.gender,
      `"${s.dob}"`,
      s.age,
      `"${s.address}"`,
      `"${s.phone}"`,
      `"${s.guardianName}"`,
      `"${s.note || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Class_Roster_${classNameTitle.replace(/[\s/'"()]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareTelegram = () => {
    sendTelegramAlert(
      `📋 បញ្ជីនាមសិស្សតាមថ្នាក់ (Class Student Roster)`,
      `ថ្នាក់រៀន៖ ${classNameTitle}\nឆ្នាំសិក្សា៖ ${academicYear}\nចំនួនសិស្សសរុប៖ ${totalStudentsCount} នាក់ (ស្រី៖ ${femaleCount} នាក់, ប្រុស៖ ${maleCount} នាក់)\nគ្រូបន្ទុកថ្នាក់៖ ${homeroomTeacher} (${teacherPhone})\nសាខា៖ ${currentBranch.nameKhmer}`,
      'material',
      homeroomTeacher
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Controls Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs no-print space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-xs font-bold shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-700 font-khmer">
                តារាងបញ្ជីនាមសិស្សតាមថ្នាក់ · Student Class Roster
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-khmer">
                {t('បញ្ជីនាមសិស្សតាមថ្នាក់ (Student Roster List)', 'Class Student Roster')}
              </h2>
              <div className="text-xs text-slate-500 font-khmer">
                ទម្រង់តារាងស្តង់ដារ (ID, Name, Gender, Date of birth, Student Age, Address, Phone Number, Guardian's Name, Other markings)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setTempTitle(classNameTitle);
                setTempAcademicYear(academicYear);
                setTempHomeroomTeacher(homeroomTeacher);
                setTempTeacherPhone(teacherPhone);
                setTempDirectorName(customDirectorName || settings?.directorName || 'យ៉េន ណាវីន');
                setTempSchoolNameKhmer(schoolNameKhmer);
                setTempSchoolNameEnglish(schoolNameEnglish);
                setTempMinistryName(ministryName);
                setTempDepartmentName(departmentName);
                setTempFooterDate(footerLocationDate);
                setIsSettingsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold font-khmer transition-all shadow-xs cursor-pointer"
              title="ការកំណត់ក្បាលបញ្ជី ជើងបញ្ជី និងទម្រង់តារាង (Roster Settings)"
            >
              <Settings className="w-4 h-4 text-slate-950 shrink-0" />
              <span>ការកំណត់</span>
            </button>

            <button
              onClick={() => {
                setTempTeacherName(homeroomTeacher);
                setTempTeacherPhone(teacherPhone);
                setIsTeacherModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold font-khmer transition-all shadow-2xs cursor-pointer"
              title="កំណត់គ្រូបន្ទុកថ្នាក់"
            >
              <UserCheck className="w-4 h-4 text-indigo-700 shrink-0" />
              <span>កំណត់គ្រូបន្ទុកថ្នាក់</span>
            </button>

            <button
              onClick={() => setIsExcelImportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-khmer transition-all shadow-xs cursor-pointer"
              title="នាំចូលទិន្នន័យសិស្សពី Excel"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>នាំចូលពី Excel</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold font-khmer transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleShareTelegram}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold font-khmer transition-colors shadow-2xs cursor-pointer"
            >
              <Send className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Telegram</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-khmer transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400 shrink-0" />
              <span>បោះពុម្ពបញ្ជី</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout: Left Vertical Slice Class Rail + Right Roster Table */}
      <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
        {/* VERTICAL SLICE: CLASS SELECTOR RAIL */}
        <aside className={`transition-all duration-300 shrink-0 w-full ${isClassSliceOpen ? 'lg:w-64 xl:w-72' : 'lg:w-16'} no-print`}>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 sticky top-20 flex flex-col space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center font-bold shrink-0">
                  <GraduationCap className="w-4 h-4 text-amber-700" />
                </div>
                {isClassSliceOpen && (
                  <div className="truncate">
                    <div className="font-bold text-xs text-slate-900 font-khmer flex items-center gap-1.5">
                      <span>ថ្នាក់រៀន (Classes)</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px]">
                        {orderedClassList.length + 1}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-khmer">ជ្រើសរើសថ្នាក់ដើម្បីមើលបញ្ជី</div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsClassSliceOpen(!isClassSliceOpen)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title={isClassSliceOpen ? 'បង្រួមបញ្ជីថ្នាក់' : 'ពង្រីកបញ្ជីថ្នាក់'}
              >
                {isClassSliceOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {isClassSliceOpen ? (
              <>
                {/* Search in class slice */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="ស្វែងរកថ្នាក់..."
                    value={classSliceSearch}
                    onChange={(e) => setClassSliceSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-khmer focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Class list vertical buttons */}
                <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto no-scrollbar pt-1">
                  {/* Official User Image Roster (15 students) */}
                  <div
                    onClick={() => handleSelectSource('official_image')}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                      selectedRosterSource === 'official_image'
                        ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-amber-50/50 border-amber-200 text-amber-950 hover:bg-amber-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="w-4 h-4 text-slate-950 shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-xs font-khmer">
                          បញ្ជីសិស្សគំរូ (១៥ នាក់)
                        </div>
                        <div className={`text-[10px] ${selectedRosterSource === 'official_image' ? 'text-slate-900/80 font-medium' : 'text-amber-800'}`}>
                          តាមរូបភាព Image Roster
                        </div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold bg-white text-slate-950 shrink-0">
                      15
                    </span>
                  </div>

                  {/* School Classes */}
                  {filteredClasses.map((cls, idx) => {
                    const isSelected = selectedRosterSource === cls.classId;
                    return (
                      <div
                        key={cls.classId}
                        draggable={permissions.canEdit}
                        onDragStart={() => setDraggedClassIndex(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedClassIndex === null || draggedClassIndex === idx) return;
                          const currentList = orderedClassList.map((c) => c.classId);
                          const updated = [...currentList];
                          const [moved] = updated.splice(draggedClassIndex, 1);
                          updated.splice(idx, 0, moved);
                          reorderClasses(updated);
                          setDraggedClassIndex(null);
                        }}
                        onClick={() => handleSelectSource(cls.classId)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                            : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {permissions.canEdit && (
                            <span className="cursor-grab text-slate-400 group-hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <div className="truncate">
                            <div className="font-bold text-xs font-khmer">
                              {cls.className}
                            </div>
                            <div className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                              {cls.period}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold shrink-0 ${
                            isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {cls.students.length} សិស្ស
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Collapsed rail icons */
              <div className="space-y-1.5 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => handleSelectSource('official_image')}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                    selectedRosterSource === 'official_image'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  }`}
                  title="បញ្ជីសិស្សគំរូ (១៥ នាក់)"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                {orderedClassList.map((cls) => {
                  const isSelected = selectedRosterSource === cls.classId;
                  return (
                    <button
                      key={cls.classId}
                      type="button"
                      onClick={() => handleSelectSource(cls.classId)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                        isSelected ? 'bg-slate-900 text-amber-400 shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title={`${cls.className} (${cls.students.length} សិស្ស)`}
                    >
                      {cls.className.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* 3. Right Column: Roster Table matching User Uploaded Image */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Top Search & Stats Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-3">
              <div className="font-bold text-sm font-khmer text-slate-900">
                {classNameTitle}
              </div>
              <div className="flex items-center gap-2 text-xs font-khmer">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                  សរុប៖ {totalStudentsCount} នាក់
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-mono font-bold">
                  ស្រី៖ {femaleCount} នាក់
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono font-bold">
                  ប្រុស៖ {maleCount} នាក់
                </span>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="ស្វែងរកតាមឈ្មោះ, អាសយដ្ឋាន, លេខទូរស័ព្ទ..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-khmer bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Roster Table Container matching Uploaded Image exact headers and style */}
          <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden print:border-none print:shadow-none">
            
            {/* ================= OFFICIAL HEADER (ក្បាលបញ្ជីនាមសិស្ស) ================= */}
            {showHeader && (
              <div className="p-6 sm:p-8 border-b border-slate-200 bg-white">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
                  {/* Left: Ministry & School Info */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-800 font-khmer">
                      {ministryName}
                    </div>
                    <div className="text-xs text-slate-600 font-khmer">
                      {departmentName}
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-[#1D4ED8] font-khmer pt-0.5">
                      {schoolNameKhmer} · {schoolNameEnglish}
                    </div>
                    <div className="text-xs font-semibold text-amber-700 font-khmer">
                      {currentBranch.nameKhmer}
                    </div>
                  </div>

                  {/* Right: Kingdom of Cambodia Motto */}
                  <div className="text-center sm:text-right space-y-1">
                    <div className="text-sm sm:text-base font-bold font-khmer text-slate-950 tracking-wider">
                      ព្រះរាជាណាចក្រកម្ពុជា
                    </div>
                    <div className="text-xs sm:text-sm font-bold font-khmer text-slate-800">
                      ជាតិ សាសនា ព្រះមហាក្សត្រ
                    </div>
                    <div className="text-xs text-slate-400 tracking-widest font-serif">❖ ❖ ❖</div>
                  </div>
                </div>

                {/* Center: Title & Academic Year */}
                <div className="text-center mt-5 mb-2 space-y-1.5">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 font-khmer tracking-wide">
                    {classNameTitle}
                  </h1>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold font-khmer text-slate-800 flex-wrap">
                    <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-950 border border-amber-300 font-extrabold">
                      ថ្នាក់រៀន៖ {classNameTitle}
                    </span>
                    <span>·</span>
                    <span>ឆ្នាំសិក្សា៖ <span className="font-mono text-slate-900">{academicYear}</span></span>
                    <span>·</span>
                    <span>
                      គ្រូបន្ទុកថ្នាក់៖ <span className="text-indigo-900 font-bold">{homeroomTeacher}</span>
                      {teacherPhone && <span className="font-mono text-slate-600 ml-1">({teacherPhone})</span>}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Roster Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-xs font-khmer text-slate-900">
                <thead>
                  {/* Yellow header row matching user uploaded image */}
                  <tr className="bg-[#fbb03b] text-black font-bold border-b border-black text-center text-xs">
                    {visibleColumns.id && <th className="py-2.5 px-2 border border-black w-12 text-center font-bold">ID</th>}
                    {visibleColumns.name && <th className="py-2.5 px-3 border border-black text-left font-bold min-w-[130px]">Name</th>}
                    {visibleColumns.gender && <th className="py-2.5 px-2 border border-black text-center font-bold w-20">Gender</th>}
                    {visibleColumns.dob && <th className="py-2.5 px-2 border border-black text-center font-bold w-28">Date of birth</th>}
                    {visibleColumns.age && <th className="py-2.5 px-2 border border-black text-center font-bold w-24">Student Age</th>}
                    {visibleColumns.address && <th className="py-2.5 px-2 border border-black text-center font-bold min-w-[100px]">Address</th>}
                    {visibleColumns.phone && <th className="py-2.5 px-2 border border-black text-center font-bold w-32 font-mono">Phone Number</th>}
                    {visibleColumns.guardian && <th className="py-2.5 px-3 border border-black text-left font-bold min-w-[130px]">Guardian's Name</th>}
                    {visibleColumns.note && <th className="py-2.5 px-2 border border-black text-center font-bold min-w-[100px]">Other markings</th>}
                    {visibleColumns.actions && <th className="py-2.5 px-2 border border-black text-center font-bold w-28 no-print">សកម្មភាព</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/40">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={Object.values(visibleColumns).filter(Boolean).length || 1} className="p-8 text-center text-slate-400 font-khmer">
                        រកមិនឃើញទិន្នន័យសិស្សទេ
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => {
                      return (
                        <tr
                          key={st.id}
                          className="hover:bg-amber-50/50 transition-colors cursor-pointer group"
                          onClick={() => setSelectedStudentForAdmission(st)}
                          title="ចុចដើម្បីមើលព័ត៌មានលម្អិតតាមទម្រង់ Admission Form"
                        >
                          {visibleColumns.id && (
                            <td className="py-2 px-2 border border-black text-center font-mono font-medium">
                              {st.id}
                            </td>
                          )}
                          {visibleColumns.name && (
                            <td className="py-2 px-3 border border-black text-left font-bold text-slate-950 group-hover:text-amber-800">
                              {st.name}
                            </td>
                          )}
                          {visibleColumns.gender && (
                            <td className="py-2 px-2 border border-black text-center font-medium font-sans">
                              {st.gender}
                            </td>
                          )}
                          {visibleColumns.dob && (
                            <td className="py-2 px-2 border border-black text-center font-mono">
                              {st.dob}
                            </td>
                          )}
                          {visibleColumns.age && (
                            <td className="py-2 px-2 border border-black text-center font-mono font-bold">
                              {st.age}
                            </td>
                          )}
                          {visibleColumns.address && (
                            <td className="py-2 px-2 border border-black text-center font-khmer">
                              {st.address}
                            </td>
                          )}
                          {visibleColumns.phone && (
                            <td className="py-2 px-2 border border-black text-center font-mono font-semibold">
                              {st.phone}
                            </td>
                          )}
                          {visibleColumns.guardian && (
                            <td className="py-2 px-3 border border-black text-left font-khmer">
                              {st.guardianName}
                            </td>
                          )}
                          {visibleColumns.note && (
                            <td className="py-2 px-2 border border-black text-center text-[11px] text-slate-500">
                              {st.note || ''}
                            </td>
                          )}
                          {visibleColumns.actions && (
                            <td className="py-2 px-2 border border-black text-center no-print" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setSelectedStudentForAdmission(st)}
                                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg text-[11px] font-bold font-khmer transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer"
                                title="មើលទម្រង់ពាក្យសុំចូលរៀន (Admission Form)"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-800" />
                                <span>ពាក្យសុំ</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ================= OFFICIAL FOOTER (ជើងបញ្ជីនាមសិស្ស) ================= */}
            {showFooter && (
              <div className="p-6 sm:p-8 border-t border-slate-200 bg-white space-y-6">
                {/* Summary Statement Line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-khmer text-slate-900 bg-amber-50/70 border border-amber-200/80 rounded-xl px-4 py-2.5">
                  <div className="font-bold">
                    បញ្ឈប់បញ្ជីត្រឹមចំនួន៖ <span className="font-mono text-sm text-slate-950 font-extrabold">{totalStudentsCount}</span> នាក់
                    {'  '}ស្រីមានចំនួន <span className="font-mono text-sm text-rose-700 font-extrabold">{femaleCount}</span> នាក់
                    {'  '}ប្រុសមានចំនួន <span className="font-mono text-sm text-blue-700 font-extrabold">{maleCount}</span> នាក់
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono">
                    កាលបរិច្ឆេទស្រង់៖ {new Date().toLocaleDateString('km-KH')}
                  </div>
                </div>

                {/* Signatures & Stamps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 text-xs font-khmer text-slate-800">
                  {/* Left: Homeroom Teacher Signature */}
                  <div className="text-center sm:text-left space-y-16">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">គ្រូបន្ទុកថ្នាក់</div>
                      <div className="text-[11px] text-slate-500 font-sans">Homeroom Teacher</div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-slate-950 text-sm font-khmer">
                        {homeroomTeacher}
                      </div>
                      <div className="text-[11px] font-mono text-slate-600">
                        ទូរស័ព្ទទាក់ទង៖ {teacherPhone || '012 345 678'}
                      </div>
                    </div>
                  </div>

                  {/* Right: School Director Signature & Stamp */}
                  <div className="text-center sm:text-right space-y-16">
                    <div>
                      <div className="text-[11px] text-slate-600 font-khmer">
                        {footerLocationDate}
                      </div>
                      <div className="font-bold text-slate-900 text-sm mt-1">
                        បានឃើញ និងឯកភាព · នាយកសាលា
                      </div>
                      <div className="text-[11px] text-slate-500 font-sans">Seen & Approved by Director</div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-slate-950 text-sm font-khmer">
                        {customDirectorName || settings.directorName || 'យ៉េន ណាវីន'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {schoolNameKhmer}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 4. MODAL: ADMISSION FORM DETAILS (បង្ហាញព័ត៌មានលម្អិតតាមទម្រង់ Admission Form សម្រាប់ Tab ទី១) */}
      {selectedStudentForAdmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 text-xs my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-4 rounded-t-2xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 font-bold">
                  <FileText className="w-5 h-5 text-amber-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base font-khmer text-white">
                      ពាក្យសុំចូលរៀន / Student Admission Form
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-900 font-mono">
                      BIM School
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-100 font-khmer mt-0.5">
                    ព័ត៌មានលម្អិតផ្លូវការសិស្ស៖ {selectedStudentForAdmission.name} ({selectedStudentForAdmission.studentCode || `ID-${selectedStudentForAdmission.id}`})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>បោះពុម្ព</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForAdmission(null)}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/20 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Complete Form Sections (I to VI) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-100">
              {/* SECTION I & II: Exact Official Document matching image_1d7d19d3.png */}
              <StudentGeneralInfoDocument
                student={selectedStudentForAdmission.originalStudent || {
                  id: selectedStudentForAdmission.id,
                  studentCode: selectedStudentForAdmission.studentCode || `BIM-2020-${selectedStudentForAdmission.id.toString().padStart(3, '0')}`,
                  name: selectedStudentForAdmission.name,
                  latinName: selectedStudentForAdmission.latinName || '',
                  gender: selectedStudentForAdmission.gender,
                  note: 'New' as const,
                  startDate: '2026-10-01',
                  feesGroup: 'October',
                  caseType: 'Full' as const,
                  cash: 12.5,
                  paidBy: 'Cash' as const,
                  paymentDate: '2026-10-01',
                  dob: selectedStudentForAdmission.dob,
                  address: selectedStudentForAdmission.address,
                  placeOfBirth: selectedStudentForAdmission.address,
                  guardianName: selectedStudentForAdmission.guardianName,
                  phone: selectedStudentForAdmission.phone,
                  nationality: 'ខ្មែរ',
                  religion: 'ព្រះពុទ្ធ',
                  admissionData: selectedStudentForAdmission.admissionData,
                }}
                className={classNameTitle}
                allowEdit={false}
              />

              {/* SECTION III: STUDENT HEALTH */}
              <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="font-bold text-slate-900 text-sm font-khmer flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span>III. ព័ត៌មានសុខភាពកុមារ / Student Health (12 Conditions)</span>
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs font-khmer">
                  {[
                    'កង្វះអាហារូបត្ថម្ភ',
                    'ស្ថានភាពបេះដូង',
                    'ជំងឺហឺត',
                    'ឈឺក្បាលប្រកាំង',
                    'ជំងឺទឹកនោមផ្អែម',
                    'វិលមុខ/ដួលសន្លប់',
                    'បញ្ហាអាកប្បកិរិយា',
                    'បញ្ហាការសិក្សា',
                    'បញ្ហាការស្តាប់',
                    'បញ្ហាការមើល',
                    'បញ្ហាការនិយាយស្តី',
                    'បញ្ហាការចល័ត',
                  ].map((cond, i) => (
                    <div key={i} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-700 text-[11px] truncate">{cond}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                        No
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-slate-500 font-khmer pt-1">
                  ការលេបថ្នាំប្រចាំកាយ៖ <strong>គ្មានការលេបថ្នាំប្រចាំកាយជាប្រចាំទេ</strong>
                </div>
              </div>

              {/* SECTION IV: PARENTS & CARETAKER */}
              <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="font-bold text-slate-900 text-sm font-khmer flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>IV. ព័ត៌មានមាតាបិតា & អាណាព្យាបាល / Parents & Caretaker</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-khmer">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">អាណាព្យាបាល (Guardian)៖</span>
                    <strong className="text-slate-900 text-sm block mt-0.5">{selectedStudentForAdmission.guardianName}</strong>
                    <span className="text-slate-500 text-[11px] block mt-1">ទូរស័ព្ទ៖ <strong className="font-mono text-slate-800">{selectedStudentForAdmission.phone}</strong></span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">ឪពុក (Father)៖</span>
                    <strong className="text-slate-900 block mt-0.5">
                      {selectedStudentForAdmission.admissionData?.father?.name || selectedStudentForAdmission.guardianName}
                    </strong>
                    <span className="text-slate-500 text-[11px] block mt-1">ទូរស័ព្ទ៖ <strong className="font-mono text-slate-800">{selectedStudentForAdmission.phone}</strong></span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">ម្តាយ (Mother)៖</span>
                    <strong className="text-slate-900 block mt-0.5">
                      {selectedStudentForAdmission.admissionData?.mother?.name || '---'}
                    </strong>
                    <span className="text-slate-500 text-[11px] block mt-1">មុខរបរ៖ មេផ្ទះ</span>
                  </div>
                </div>
              </div>

              {/* SECTION V: SERVICES & ADDRESS */}
              <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="font-bold text-slate-900 text-sm font-khmer flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-amber-600" />
                    <span>V. សេវាកម្មផ្សេងៗ & អាសយដ្ឋាន / Services & Address</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-khmer">
                  <div>
                    <span className="text-slate-500 block text-[11px]">អាសយដ្ឋានបច្ចុប្បន្ន (Address)៖</span>
                    <strong className="text-slate-900 text-sm block mt-0.5">{selectedStudentForAdmission.address}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">សេវាអាហារសាលា៖</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        ✓ អាហារពេលព្រឹក
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        ✓ អាហារថ្ងៃត្រង់
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION VI: DECLARATION */}
              <div className="p-4 sm:p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-xs font-khmer leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>VI. សេចក្តីបញ្ជាក់ផ្លូវការ (Official Declaration)</span>
                </div>
                <p className="text-slate-700 text-[11px]">
                  សូមបញ្ជាក់ថាខ្ញុំពិតជាបានយល់យ៉ាងច្បាស់លាស់ពី {settings.schoolNameKhmer} ({currentBranch.nameKhmer}) ហើយសូមធានាអះអាងថារាល់ព័ត៌មានដែលបានផ្តល់ជូនសាលាពិតជាត្រឹមត្រូវ។
                </p>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-600 border-t border-amber-200/80">
                  <span>កាលបរិច្ឆេទចុះឈ្មោះ៖ <strong className="font-mono">2026-10-01</strong></span>
                  <span>អ្នកធានា៖ <strong className="text-slate-950">{selectedStudentForAdmission.guardianName}</strong></span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 bg-slate-50 rounded-b-2xl">
              <span className="text-xs text-slate-500 font-khmer">
                សាខា៖ <strong className="text-slate-800">{currentBranch.nameKhmer}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForAdmission(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-khmer text-xs font-bold transition-all cursor-pointer"
                >
                  បិទ
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-khmer text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>បោះពុម្ពពាក្យសុំចូលរៀន</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN HOMEROOM TEACHER */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base font-khmer">
                  កំណត់គ្រូបន្ទុកថ្នាក់ ({classNameTitle})
                </h3>
              </div>
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacherAssignment} className="mt-4 space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ជ្រើសរើសពីបុគ្គលិក / គ្រូបង្រៀន
                </label>
                <select
                  onChange={(e) => {
                    const found = allUsers?.find((u) => u.id === e.target.value);
                    if (found) {
                      setTempTeacherName(found.khmerName.split('(')[0].trim());
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-xs font-khmer focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="">-- ជ្រើសរើសគ្រូបង្រៀនក្នុងប្រព័ន្ធ --</option>
                  {allUsers
                    ?.filter((u) => u.role === 'teacher' || u.role === 'admin')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.khmerName} ({u.role})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  ឈ្មោះគ្រូបន្ទុកថ្នាក់ *
                </label>
                <input
                  type="text"
                  value={tempTeacherName}
                  onChange={(e) => setTempTeacherName(e.target.value)}
                  placeholder="ឧ. សុខ ម៉ាលី"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-khmer font-bold focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-khmer">
                  លេខទូរស័ព្ទទាក់ទង (Phone Number)
                </label>
                <input
                  type="tel"
                  value={tempTeacherPhone}
                  onChange={(e) => setTempTeacherPhone(e.target.value)}
                  placeholder="ឧ. 012 345 678"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-khmer font-medium cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold font-khmer transition-colors shadow-xs cursor-pointer"
                >
                  រក្សាទុកគ្រូបន្ទុកថ្នាក់
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ROSTER & TABLE SETTINGS (ការកំណត់ក្បាលបញ្ជី ជើងបញ្ជី និងជួរឈរ) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 text-xs my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-4 sm:p-5 rounded-t-2xl flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/30 backdrop-blur-xs flex items-center justify-center text-slate-950 shrink-0 font-bold shadow-2xs">
                  <Settings className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base font-khmer text-slate-950">
                      ការកំណត់បញ្ជីនាមសិស្ស · Roster Settings
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-900/80 font-khmer font-medium mt-0.5">
                    កំណត់ក្បាលបញ្ជី ជើងបញ្ជី ហត្ថលេខា និងជម្រើសបង្ហាញជួរឈរ
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 text-slate-950 hover:bg-black/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-khmer shrink-0">
              <button
                type="button"
                onClick={() => setSettingsActiveSubTab('header_footer')}
                className={`py-2 px-3.5 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  settingsActiveSubTab === 'header_footer'
                    ? 'border-amber-500 text-amber-950 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-600" />
                <span>ក្បាលបញ្ជី & ស្ថាប័ន (Header)</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsActiveSubTab('signatures')}
                className={`py-2 px-3.5 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  settingsActiveSubTab === 'signatures'
                    ? 'border-amber-500 text-amber-950 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4 text-amber-600" />
                <span>ជើងបញ្ជី & ហត្ថលេខា (Footer)</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsActiveSubTab('columns')}
                className={`py-2 px-3.5 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  settingsActiveSubTab === 'columns'
                    ? 'border-amber-500 text-amber-950 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                <span>ការបង្ហាញជួរឈរ (Columns)</span>
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setClassNameTitle(tempTitle);
                setAcademicYear(tempAcademicYear);
                setHomeroomTeacher(tempHomeroomTeacher);
                setTeacherPhone(tempTeacherPhone);
                setCustomDirectorName(tempDirectorName);
                setSchoolNameKhmer(tempSchoolNameKhmer);
                setSchoolNameEnglish(tempSchoolNameEnglish);
                setMinistryName(tempMinistryName);
                setDepartmentName(tempDepartmentName);
                setFooterLocationDate(tempFooterDate);

                updateSettings({
                  directorName: tempDirectorName,
                  schoolNameKhmer: tempSchoolNameKhmer,
                  schoolNameEnglish: tempSchoolNameEnglish,
                  academicYear: tempAcademicYear,
                });

                setIsSettingsModalOpen(false);
              }}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs font-khmer"
            >
              {/* TAB 1: HEADER & SCHOOL INFO */}
              {settingsActiveSubTab === 'header_footer' && (
                <div className="space-y-4">
                  {/* Master toggle for header */}
                  <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        បង្ហាញក្បាលបញ្ជីផ្លូវការ (Show Official Cambodian Header)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        បង្ហាញព្រះរាជាណាចក្រកម្ពុជា ក្រសួងអប់រំ និងឈ្មោះសាលានៅផ្នែកខាងលើ
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showHeader}
                        onChange={(e) => setShowHeader(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        ចំណងជើងតារាង (Class Roster Title) *
                      </label>
                      <input
                        type="text"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        placeholder="ឧ. បញ្ជីនាមសិស្សតាមថ្នាក់ ឬ បញ្ជីនាមសិស្សថ្នាក់ទី ១A"
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-khmer font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        ឆ្នាំសិក្សា (Academic Year) *
                      </label>
                      <input
                        type="text"
                        value={tempAcademicYear}
                        onChange={(e) => setTempAcademicYear(e.target.value)}
                        placeholder="ឧ. ២០២៦-២០២៧"
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        ឈ្មោះសាលារៀន (ភាសាខ្មែរ)
                      </label>
                      <input
                        type="text"
                        value={tempSchoolNameKhmer}
                        onChange={(e) => setTempSchoolNameKhmer(e.target.value)}
                        placeholder="ឧ. សាលាអន្តរជាតិ BIM"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-khmer font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        ឈ្មោះសាលារៀន (School Name English)
                      </label>
                      <input
                        type="text"
                        value={tempSchoolNameEnglish}
                        onChange={(e) => setTempSchoolNameEnglish(e.target.value)}
                        placeholder="ឧ. BIM School"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-sans font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        ក្រសួងសាមី (Ministry Line)
                      </label>
                      <input
                        type="text"
                        value={tempMinistryName}
                        onChange={(e) => setTempMinistryName(e.target.value)}
                        placeholder="ក្រសួងអប់រំ យុវជន និងកីឡា"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-khmer"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        មន្ទីរអប់រំខេត្ត/ក្រុង (Department Line)
                      </label>
                      <input
                        type="text"
                        value={tempDepartmentName}
                        onChange={(e) => setTempDepartmentName(e.target.value)}
                        placeholder="មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តបន្ទាយមានជ័យ"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-khmer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SIGNATURES & FOOTER */}
              {settingsActiveSubTab === 'signatures' && (
                <div className="space-y-4">
                  {/* Master toggle for footer */}
                  <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        បង្ហាញជើងបញ្ជី & ហត្ថលេខា (Show Footer & Signatures)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        បង្ហាញហត្ថលេខាគ្រូបន្ទុកថ្នាក់ នាយកសាលា និងសេចក្តីសង្ខេបចំនួនសិស្ស
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showFooter}
                        onChange={(e) => setShowFooter(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        ឈ្មោះគ្រូបន្ទុកថ្នាក់ (Homeroom Teacher)
                      </label>
                      <input
                        type="text"
                        value={tempHomeroomTeacher}
                        onChange={(e) => setTempHomeroomTeacher(e.target.value)}
                        placeholder="ឧ. សុខ ម៉ាលី"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-khmer font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        លេខទូរស័ព្ទទាក់ទង (Teacher Phone)
                      </label>
                      <input
                        type="tel"
                        value={tempTeacherPhone}
                        onChange={(e) => setTempTeacherPhone(e.target.value)}
                        placeholder="ឧ. 012 345 678"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        ឈ្មោះនាយកសាលា (School Director Name)
                      </label>
                      <input
                        type="text"
                        value={tempDirectorName}
                        onChange={(e) => setTempDirectorName(e.target.value)}
                        placeholder="ឧ. យ៉េន ណាវីន"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-khmer font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        កាលបរិច្ឆេទលើជើងបញ្ជី (Footer Date/Location Line)
                      </label>
                      <input
                        type="text"
                        value={tempFooterDate}
                        onChange={(e) => setTempFooterDate(e.target.value)}
                        placeholder="ឧ. ថ្ងៃ................ ទី....... ខែ............... ឆ្នាំ២០២៦"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-khmer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: COLUMN VISIBILITY */}
              {settingsActiveSubTab === 'columns' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
                    ជ្រើសរើសជួរឈរដែលអ្នកចង់បង្ហាញ ឬលាក់នៅលើតារាងបញ្ជីនាមសិស្ស៖
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { key: 'id', label: 'ID (លេខរៀង / អត្តលេខ)', desc: 'ជួរឈរ ID សិស្ស' },
                      { key: 'name', label: 'Name (ឈ្មោះសិស្ស)', desc: 'ឈ្មោះជាភាសាខ្មែរ' },
                      { key: 'gender', label: 'Gender (ភេទ)', desc: 'Man / Female' },
                      { key: 'dob', label: 'Date of birth (ថ្ងៃខែឆ្នាំកំណើត)', desc: 'ខែ/ថ្ងៃ/ឆ្នាំ' },
                      { key: 'age', label: 'Student Age (អាយុសិស្ស)', desc: 'អាយុគិតតាមឆ្នាំកំណើត' },
                      { key: 'address', label: 'Address (អាសយដ្ឋាន)', desc: 'ភូមិ/ឃុំ/សង្កាត់' },
                      { key: 'phone', label: 'Phone Number (លេខទូរស័ព្ទ)', desc: 'លេខទំនាក់ទំនង' },
                      { key: 'guardian', label: "Guardian's Name (ឈ្មោះអាណាព្យាបាល)", desc: 'ឪពុក ម្តាយ ឬអាណាព្យាបាល' },
                      { key: 'note', label: 'Other markings (ចំណាំផ្សេងៗ)', desc: 'កំណត់ចំណាំផ្សេងៗ' },
                      { key: 'actions', label: 'សកម្មភាព (Actions / Admission Form)', desc: 'ប៊ូតុងបើកមើលពាក្យសុំចូលរៀន' },
                    ].map((col) => {
                      const isChecked = visibleColumns[col.key as keyof typeof visibleColumns];
                      return (
                        <label
                          key={col.key}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-amber-50/60 border-amber-300 text-slate-900'
                              : 'bg-white border-slate-200 text-slate-400 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              setVisibleColumns((prev) => ({
                                ...prev,
                                [col.key]: e.target.checked,
                              }))
                            }
                            className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs">{col.label}</div>
                            <div className="text-[10px] text-slate-500">{col.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setTempTitle('បញ្ជីនាមសិស្សតាមថ្នាក់');
                    setTempAcademicYear('២០២៦-២០២៧');
                    setTempHomeroomTeacher('សុខ ម៉ាលី');
                    setTempTeacherPhone('012 345 678');
                    setTempDirectorName(settings?.directorName || 'យ៉េន ណាវីន');
                    setTempSchoolNameKhmer(settings?.schoolNameKhmer || 'សាលាអន្តរជាតិ BIM');
                    setTempSchoolNameEnglish(settings?.schoolNameEnglish || 'BIM School');
                    setTempMinistryName('ក្រសួងអប់រំ យុវជន និងកីឡា');
                    setTempDepartmentName('មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តបន្ទាយមានជ័យ');
                    setTempFooterDate('ថ្ងៃ................ ទី....... ខែ............... ឆ្នាំ២០២៦');
                    setShowHeader(true);
                    setShowFooter(true);
                    setVisibleColumns({
                      id: true,
                      name: true,
                      gender: true,
                      dob: true,
                      age: true,
                      address: true,
                      phone: true,
                      guardian: true,
                      note: true,
                      actions: true,
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-khmer text-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>កំណត់ដូចដើម (Reset)</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-khmer text-xs font-bold transition-all cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-khmer text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>រក្សាទុកការកំណត់</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Student Import Modal */}
      <ExcelStudentImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        defaultTargetClassId={selectedRosterSource !== 'official_image' ? selectedRosterSource : '1A'}
      />
    </div>
  );
};
