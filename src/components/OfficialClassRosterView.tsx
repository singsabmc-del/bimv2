import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StudentFeeRecord } from '../types';
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
} from 'lucide-react';
import { ExcelStudentImportModal } from './ExcelStudentImportModal';

export interface OfficialRosterStudent {
  id: number;
  no: number;
  surname: string; // គោត្តនាម
  firstName: string; // នាម
  fullName: string;
  gender: 'ស' | 'ប'; // ស = ស្រី, ប = ប្រុស
  dob: string; // DD/MM/YYYY
  note: string;
}

// 50 Official Students Transcribed Faithfully from User Uploaded Document (Grade 12 'A' Science)
export const OFFICIAL_TEMPLATE_STUDENTS_12A: OfficialRosterStudent[] = [
  // Left Column (1-25)
  { id: 1, no: 1, surname: 'ឃឹម', firstName: 'ច័ន្ទវិមាន', fullName: 'ឃឹម ច័ន្ទវិមាន', gender: 'ស', dob: '19/01/2009', note: '' },
  { id: 2, no: 2, surname: 'យឿន', firstName: 'ម៉ាលី', fullName: 'យឿន ម៉ាលី', gender: 'ស', dob: '25/11/2008', note: '' },
  { id: 3, no: 3, surname: 'ចេង', firstName: 'ពេជ្ររ៉ាភី', fullName: 'ចេង ពេជ្ររ៉ាភី', gender: 'ស', dob: '21/04/2008', note: '' },
  { id: 4, no: 4, surname: 'ចែវ', firstName: 'ស៊ីហួត', fullName: 'ចែវ ស៊ីហួត', gender: 'ប', dob: '21/08/2008', note: '' },
  { id: 5, no: 5, surname: 'ឆាយ', firstName: 'ម៉ីម៉ី', fullName: 'ឆាយ ម៉ីម៉ី', gender: 'ស', dob: '11/11/2008', note: '' },
  { id: 6, no: 6, surname: 'ជិន', firstName: 'ស្រីរ័ត្ន', fullName: 'ជិន ស្រីរ័ត្ន', gender: 'ស', dob: '15/12/2008', note: '' },
  { id: 7, no: 7, surname: 'ឈឹម', firstName: 'គង់សុខពិសី', fullName: 'ឈឹម គង់សុខពិសី', gender: 'ស', dob: '1/10/2009', note: '' },
  { id: 8, no: 8, surname: 'ឈាង', firstName: 'សុភ័ក្ត្រា', fullName: 'ឈាង សុភ័ក្ត្រា', gender: 'ប', dob: '7/08/2006', note: '' },
  { id: 9, no: 9, surname: 'ឈួន', firstName: 'ស្រីល័ក្ខ', fullName: 'ឈួន ស្រីល័ក្ខ', gender: 'ស', dob: '4/11/2008', note: '' },
  { id: 10, no: 10, surname: 'ថា', firstName: 'ណារី', fullName: 'ថា ណារី', gender: 'ស', dob: '26/07/2009', note: '' },
  { id: 11, no: 11, surname: 'ទ្រី', firstName: 'ស្រីនិច', fullName: 'ទ្រី ស្រីនិច', gender: 'ស', dob: '30/09/2008', note: '' },
  { id: 12, no: 12, surname: 'ធី', firstName: 'ចិន្តា', fullName: 'ធី ចិន្តា', gender: 'ស', dob: '16/05/2009', note: '' },
  { id: 13, no: 13, surname: 'នូ', firstName: 'ស្រីណិច', fullName: 'នូ ស្រីណិច', gender: 'ស', dob: '12/08/2007', note: '' },
  { id: 14, no: 14, surname: 'ប៊ុន', firstName: 'រ៉ាវីត', fullName: 'ប៊ុន រ៉ាវីត', gender: 'ប', dob: '4/06/2008', note: '' },
  { id: 15, no: 15, surname: 'ប៊ុន', firstName: 'ពុធធីតា', fullName: 'ប៊ុន ពុធធីតា', gender: 'ស', dob: '27/08/2008', note: '' },
  { id: 16, no: 16, surname: 'ប៉ុក', firstName: 'ថៃប៊ុនឡុង', fullName: 'ប៉ុក ថៃប៊ុនឡុង', gender: 'ប', dob: '13/03/2008', note: '' },
  { id: 17, no: 17, surname: 'ផន', firstName: 'រត្នះ', fullName: 'ផន រត្នះ', gender: 'ប', dob: '24/10/2008', note: '' },
  { id: 18, no: 18, surname: 'ផន', firstName: 'ផល្លីច័ន្ទបូរមី', fullName: 'ផន ផល្លីច័ន្ទបូរមី', gender: 'ស', dob: '15/11/2010', note: '' },
  { id: 19, no: 19, surname: 'ផល្លា', firstName: 'បញ្ញាបុត្រ', fullName: 'ផល្លា បញ្ញាបុត្រ', gender: 'ប', dob: '25/03/2008', note: '' },
  { id: 20, no: 20, surname: 'ផាត់', firstName: 'ដាវី', fullName: 'ផាត់ ដាវី', gender: 'ស', dob: '20/05/2008', note: '' },
  { id: 21, no: 21, surname: 'ផុន', firstName: 'រតនៈពេជ្ររ័ត្ន', fullName: 'ផុន រតនៈពេជ្ររ័ត្ន', gender: 'ស', dob: '4/09/2010', note: '' },
  { id: 22, no: 22, surname: 'ពិត', firstName: 'បញ្ញា', fullName: 'ពិត បញ្ញា', gender: 'ប', dob: '29/01/2007', note: '' },
  { id: 23, no: 23, surname: 'ភី', firstName: 'វីរៈ', fullName: 'ភី វីរៈ', gender: 'ប', dob: '18/07/2008', note: '' },
  { id: 24, no: 24, surname: 'ភើយ', firstName: 'តេងណាកាំ', fullName: 'ភើយ តេងណាកាំ', gender: 'ប', dob: '21/02/2009', note: '' },
  { id: 25, no: 25, surname: 'ម៉ៅ', firstName: 'សុវណ្ណរស្មី', fullName: 'ម៉ៅ សុវណ្ណរស្មី', gender: 'ប', dob: '28/01/2009', note: '' },

  // Right Column (26-50)
  { id: 26, no: 26, surname: 'ថ្ងៃ', firstName: 'បញ្ញាវី', fullName: 'ថ្ងៃ បញ្ញាវី', gender: 'ស', dob: '30/09/2009', note: '' },
  { id: 27, no: 27, surname: 'រិន', firstName: 'បើណា', fullName: 'រិន បើណា', gender: 'ប', dob: '23/07/2007', note: '' },
  { id: 28, no: 28, surname: 'លាង', firstName: 'សៀកអ៊ឹម', fullName: 'លាង សៀកអ៊ឹម', gender: 'ស', dob: '27/04/2008', note: '' },
  { id: 29, no: 29, surname: 'លី', firstName: 'ដាលីន', fullName: 'លី ដាលីន', gender: 'ស', dob: '13/01/2009', note: '' },
  { id: 30, no: 30, surname: 'លីវ', firstName: 'ស៊ឹងស៊ឹង', fullName: 'លីវ ស៊ឹងស៊ឹង', gender: 'ស', dob: '16/01/2009', note: '' },
  { id: 31, no: 31, surname: 'លេម', firstName: 'ណាច', fullName: 'លេម ណាច', gender: 'ប', dob: '23/03/2007', note: '' },
  { id: 32, no: 32, surname: 'វ៉ាង', firstName: 'វ៉ាហាង', fullName: 'វ៉ាង វ៉ាហាង', gender: 'ប', dob: '18/01/2009', note: '' },
  { id: 33, no: 33, surname: 'វ៉ាន់', firstName: 'ស្រីនាង', fullName: 'វ៉ាន់ ស្រីនាង', gender: 'ស', dob: '2/06/2007', note: '' },
  { id: 34, no: 34, surname: 'វឿន', firstName: 'សុវណ្ណារិទ្ធ', fullName: 'វឿន សុវណ្ណារិទ្ធ', gender: 'ប', dob: '27/07/2009', note: '' },
  { id: 35, no: 35, surname: 'សកល', firstName: 'នីតា', fullName: 'សកល នីតា', gender: 'ស', dob: '1/03/2010', note: '' },
  { id: 36, no: 36, surname: 'សានុគ', firstName: 'ធាដា', fullName: 'សានុគ ធាដា', gender: 'ស', dob: '12/11/2009', note: '' },
  { id: 37, no: 37, surname: 'សុកា', firstName: 'ស្រីពេជ្រ', fullName: 'សុកា ស្រីពេជ្រ', gender: 'ស', dob: '16/02/2009', note: '' },
  { id: 38, no: 38, surname: 'សុវណ្ណ', firstName: 'ឌីណា', fullName: 'សុវណ្ណ ឌីណា', gender: 'ប', dob: '18/02/2009', note: '' },
  { id: 39, no: 39, surname: 'សៀន', firstName: 'សុខយីនសៀវ', fullName: 'សៀន សុខយីនសៀវ', gender: 'ប', dob: '17/12/2008', note: '' },
  { id: 40, no: 40, surname: 'សេង', firstName: 'មយូរ៉ាវីត', fullName: 'សេង មយូរ៉ាវីត', gender: 'ស', dob: '26/11/2008', note: '' },
  { id: 41, no: 41, surname: 'ស្រុង', firstName: 'ម៉ាលីសាន', fullName: 'ស្រុង ម៉ាលីសាន', gender: 'ស', dob: '6/11/2008', note: '' },
  { id: 42, no: 42, surname: 'ហុង', firstName: 'គឹមឡាង', fullName: 'ហុង គឹមឡាង', gender: 'ស', dob: '12/06/2008', note: '' },
  { id: 43, no: 43, surname: 'ហៃ', firstName: 'ស្រីណុច', fullName: 'ហៃ ស្រីណុច', gender: 'ស', dob: '18/04/2007', note: '' },
  { id: 44, no: 44, surname: 'ឡាយ', firstName: 'សារ៉ាវ៉ាន់', fullName: 'ឡាយ សារ៉ាវ៉ាន់', gender: 'ស', dob: '21/12/2007', note: '' },
  { id: 45, no: 45, surname: 'ឥណ្ឌា', firstName: 'អាម៉ាតា', fullName: 'ឥណ្ឌា អាម៉ាតា', gender: 'ស', dob: '10/11/2008', note: '' },
  { id: 46, no: 46, surname: 'អ៊ិន', firstName: 'ចរណៃ', fullName: 'អ៊ិន ចរណៃ', gender: 'ស', dob: '5/02/2008', note: '' },
  { id: 47, no: 47, surname: 'អ៊ុក', firstName: 'សុជាតិ', fullName: 'អ៊ុក សុជាតិ', gender: 'ប', dob: '29/05/2008', note: '' },
  { id: 48, no: 48, surname: 'អ៊ិន', firstName: 'ម៉ានុត', fullName: 'អ៊ិន ម៉ានុត', gender: 'ស', dob: '28/04/2007', note: '' },
  { id: 49, no: 49, surname: 'អ៊ិន', firstName: 'ថាពិន', fullName: 'អ៊ិន ថាពិន', gender: 'ស', dob: '26/10/2008', note: '' },
  { id: 50, no: 50, surname: 'អែម', firstName: 'រក្សា', fullName: 'អែម រក្សា', gender: 'ស', dob: '6/07/2008', note: '' },
];

export const OfficialClassRosterView: React.FC = () => {
  const {
    classData,
    orderedClassList,
    reorderClasses,
    moveClassOrder,
    sortClasses,
    selectedClassId,
    setSelectedClassId,
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

  // Mode: Template Class (12A official 50 students) or App Classes (1A, 1B, 2A...)
  const [selectedRosterSource, setSelectedRosterSource] = useState<string>('official_12A');

  // Class Drag-and-Drop and Auto-Sort State
  const [draggedClassIndex, setDraggedClassIndex] = useState<number | null>(null);
  const [isClassSortDropdownOpen, setIsClassSortDropdownOpen] = useState(false);
  const classSortDropdownRef = useRef<HTMLDivElement>(null);

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

  // Custom template state for 12A
  const [templateStudents, setTemplateStudents] = useState<OfficialRosterStudent[]>(OFFICIAL_TEMPLATE_STUDENTS_12A);

  // Layout View mode: 'dual_column' (official matching the image) or 'single_column'
  const [layoutMode, setLayoutMode] = useState<'dual_column' | 'single_column'>('dual_column');

  // Document Config Header Fields
  const [ministryDept, setMinistryDept] = useState('មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តស្ទឹងត្រែង');
  const [schoolInstitution, setSchoolInstitution] = useState('វិ. ព្រះរាជបូជនីយកិច្ច');
  const [classNameTitle, setClassNameTitle] = useState("ថ្នាក់ទី ១២ 'ក' (វិទ្យាសាស្ត្រ)");
  const [academicYear, setAcademicYear] = useState('២០២៥-២០២៦');
  const [homeroomTeacher, setHomeroomTeacher] = useState('ម៉ៅ ហ៊ាត');
  const [teacherPhone, setTeacherPhone] = useState('0974500788');
  const [directorTitle, setDirectorTitle] = useState('នាយកវិទ្យាល័យ');
  const [directorName, setDirectorName] = useState('រឿន រឿន');
  const [lunarDateText, setLunarDateText] = useState('ថ្ងៃ សៅរ៍ ១១កើត ខែ កត្តិក ឆ្នាំ រោង ឆស័ក ព.ស ២៥៦៩');
  const [solarDateText, setSolarDateText] = useState('ត្រូវនឹងថ្ងៃទី ១ ខែ វិច្ឆិកា គ.ស ២០២៥');

  // Logo upload ref and state
  const rosterLogoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleRosterLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(t('សូមជ្រើសរើសឯកសាររូបភាពប៉ុណ្ណោះ!', 'Please select an image file only!'));
      return;
    }
    setIsUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        let finalUrl = base64Data;
        try {
          const res = await fetch('/api/upload-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Data,
              filename: file.name,
            }),
          });
          const json = await res.json();
          if (json.success && json.url) {
            finalUrl = json.url;
          }
        } catch (err) {
          console.warn('Direct upload error, falling back to data URL:', err);
        }
        updateSettings({ schoolLogo: finalUrl });
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsUploadingLogo(false);
    }
    e.target.value = '';
  };

  // Editing modal / inline edit
  const [isEditMode, setIsEditMode] = useState(false);
  const [isOriginalPreviewOpen, setIsOriginalPreviewOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [tempTeacherName, setTempTeacherName] = useState(homeroomTeacher);
  const [tempTeacherPhone, setTempTeacherPhone] = useState(teacherPhone);
  const [searchFilter, setSearchFilter] = useState('');

  // Handle switching class source
  const handleSelectSource = (srcId: string) => {
    setSelectedRosterSource(srcId);
    if (srcId === 'official_12A') {
      setMinistryDept('មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តស្ទឹងត្រែង');
      setSchoolInstitution('វិ. ព្រះរាជបូជនីយកិច្ច');
      setClassNameTitle("ថ្នាក់ទី ១២ 'ក' (វិទ្យាសាស្ត្រ)");
      setAcademicYear('២០២៥-២០២៦');
      setHomeroomTeacher('ម៉ៅ ហ៊ាត');
      setTeacherPhone('0974500788');
      setDirectorTitle('នាយកវិទ្យាល័យ');
      setDirectorName('រឿន រឿន');
      setLunarDateText('ថ្ងៃ សៅរ៍ ១១កើត ខែ កត្តិក ឆ្នាំ រោង ឆស័ក ព.ស ២៥៦៩');
      setSolarDateText('ត្រូវនឹងថ្ងៃទី ១ ខែ វិច្ឆិកា គ.ស ២០២៥');
    } else {
      const cls = classData[srcId];
      if (cls) {
        setSelectedClassId(srcId);
        setMinistryDept('មន្ទីរអប់រំ យុវជន និងកីឡារាជធានីភ្នំពេញ');
        setSchoolInstitution(`${settings.schoolNameKhmer} (${settings.schoolNameEnglish})`);
        setClassNameTitle(cls.className);
        setAcademicYear(settings.academicYear || '២០២៦-២០២៧');
        const assignedTeacher = cls.homeroomTeacher || (cls.classId === '1A' ? 'សុខ ម៉ាលី' : 'គ្រូបន្ទុកថ្នាក់');
        const assignedPhone = cls.teacherPhone || (cls.classId === '1A' ? '012 345 678' : settings.phone);
        setHomeroomTeacher(assignedTeacher);
        setTeacherPhone(assignedPhone);
        setTempTeacherName(assignedTeacher);
        setTempTeacherPhone(assignedPhone);
        setDirectorTitle('នាយកសាលា');
        setDirectorName(settings.directorName || 'យ៉េន ណាវីន');
        setLunarDateText('ថ្ងៃ ពុធ ៥កើត ខែ កត្តិក ឆ្នាំ ម្សាញ់ សប្តស័ក ព.ស ២៥៧០');
        setSolarDateText(`ត្រូវនឹងថ្ងៃទី ០៧ ខែ តុលា គ.ស ២០២៦`);
      }
    }
  };

  const handleSaveTeacherAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempTeacherName.trim()) return;
    setHomeroomTeacher(tempTeacherName.trim());
    setTeacherPhone(tempTeacherPhone.trim());
    if (selectedRosterSource !== 'official_12A' && updateClassTeacher) {
      updateClassTeacher(selectedRosterSource, tempTeacherName.trim(), tempTeacherPhone.trim());
    }
    setIsTeacherModalOpen(false);
  };

  // Convert current student records into OfficialRosterStudent structure
  const activeStudents: OfficialRosterStudent[] = useMemo(() => {
    if (selectedRosterSource === 'official_12A') {
      return templateStudents;
    }
    const cls = classData[selectedRosterSource] || orderedClassList[0] || Object.values(classData)[0];
    if (!cls) return [];

    return cls.students.map((st, idx) => {
      // Split Khmer surname and firstname
      const parts = st.name.trim().split(' ');
      const surname = parts[0] || '';
      const firstName = parts.slice(1).join(' ') || surname;

      // Gender: Man -> ប, Female -> ស
      const genderKh: 'ស' | 'ប' = st.gender === 'Female' ? 'ស' : 'ប';

      // Format DOB to DD/MM/YYYY
      let dobKh = st.dob || '01/01/2019';
      if (/^\d{4}-\d{2}-\d{2}$/.test(dobKh)) {
        const [y, m, d] = dobKh.split('-');
        dobKh = `${d}/${m}/${y}`;
      }

      return {
        id: st.id,
        no: idx + 1,
        surname,
        firstName,
        fullName: st.name,
        gender: genderKh,
        dob: dobKh,
        note: st.note === 'New' ? 'សិស្សថ្មី' : '',
      };
    });
  }, [selectedRosterSource, templateStudents, classData, orderedClassList]);

  // Filtered students for display
  const filteredStudents = useMemo(() => {
    if (!searchFilter.trim()) return activeStudents;
    const q = searchFilter.toLowerCase().trim();
    return activeStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.surname.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.no.toString() === q
    );
  }, [activeStudents, searchFilter]);

  // Counts
  const totalStudentsCount = activeStudents.length;
  const femaleCount = activeStudents.filter((s) => s.gender === 'ស').length;
  const maleCount = activeStudents.filter((s) => s.gender === 'ប').length;

  // Split into left (1 to mid) and right (mid+1 to end) for dual-column layout
  const midPoint = Math.ceil(filteredStudents.length / 2);
  const leftColumnStudents = filteredStudents.slice(0, midPoint);
  const rightColumnStudents = filteredStudents.slice(midPoint);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['No', 'Surname', 'First Name', 'Full Name', 'Gender', 'DOB', 'Note'];
    const rows = activeStudents.map((s) => [
      s.no,
      `"${s.surname}"`,
      `"${s.firstName}"`,
      `"${s.fullName}"`,
      s.gender,
      s.dob,
      `"${s.note || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Official_Roster_${classNameTitle.replace(/[\s/'"()]/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Telegram alert
  const handleShareTelegram = () => {
    sendTelegramAlert(
      `📋 បញ្ជីនាមសិស្សផ្លូវការ (Official Class Roster)`,
      `ថ្នាក់រៀន៖ ${classNameTitle}\nឆ្នាំសិក្សា៖ ${academicYear}\nចំនួនសិស្សសរុប៖ ${totalStudentsCount} នាក់ (ស្រី៖ ${femaleCount} នាក់, ប្រុស៖ ${maleCount} នាក់)\nគ្រូបន្ទុកថ្នាក់៖ ${homeroomTeacher} (${teacherPhone})\nស្ថាប័ន៖ ${schoolInstitution}`,
      'material',
      homeroomTeacher
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Toolbar (No-Print) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs no-print space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-800 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-700 font-khmer">
                ទម្រង់ផ្លូវការក្រសួងអប់រំ យុវជន និងកីឡា · Official MoEYS Document Format
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-khmer">
                {t('បញ្ជីនាមសិស្សតាមថ្នាក់ ជាទម្រង់ផ្លូវការ', 'Official Class Student Roster')}
              </h2>
              <div className="text-xs text-slate-500 font-khmer">
                ទម្រង់តារាងភ្លោះសងខាង (Dual Parallel Columns 1-25 & 26-50) ជាមួយក្បាលលិខិតជាតិ និងត្រាផ្លូវការ
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={() => {
                setTempTeacherName(homeroomTeacher);
                setTempTeacherPhone(teacherPhone);
                setIsTeacherModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-bold font-khmer transition-all shadow-2xs"
              title="កំណត់គ្រូបន្ទុកថ្នាក់ (Assign Homeroom Teacher)"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
              <span className="hidden sm:inline">កំណត់គ្រូបន្ទុកថ្នាក់</span>
            </button>

            <button
              onClick={() => setIsExcelImportOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold font-khmer transition-all shadow-2xs"
              title="នាំចូលទិន្នន័យសិស្សពី Excel (Paste from Excel)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">នាំចូលពី Excel</span>
            </button>

            <button
              onClick={() => setIsOriginalPreviewOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold font-khmer transition-all shadow-2xs"
              title="មើលឯកសាររូបភាពដើមដែលបានភ្ជាប់ (View Attached Reference Document)"
            >
              <Eye className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="hidden sm:inline">មើលគំរូដើម</span>
            </button>

            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold font-khmer transition-all shadow-2xs ${
                isEditMode
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title={isEditMode ? 'បិទការកែប្រែ' : 'កែប្រែក្បាលលិខិត'}
            >
              <Edit3 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{isEditMode ? 'បិទកែប្រែ' : 'កែប្រែក្បាលលិខិត'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold font-khmer transition-colors shadow-2xs"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={handleShareTelegram}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-bold font-khmer transition-colors shadow-2xs"
              title="ផ្ញើទៅកាន់ Telegram"
            >
              <Send className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="hidden sm:inline">Telegram</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-khmer transition-all shadow-xs"
              title="បោះពុម្ពបញ្ជីផ្លូវការ (Print A4)"
            >
              <Printer className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">បោះពុម្ពបញ្ជីផ្លូវការ</span>
            </button>
          </div>
        </div>

        {/* Source Class Selection Strip with Drag-and-Drop Reordering and Auto-Sorting */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-khmer py-0.5">
            <span className="text-slate-500 font-bold whitespace-nowrap flex items-center gap-1 shrink-0">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t('ជ្រើសរើសថ្នាក់៖', 'Select Class:')}</span>
            </span>

            {/* MoEYS Official Template 12A Button */}
            <button
              type="button"
              onClick={() => handleSelectSource('official_12A')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 select-none cursor-pointer ${
                selectedRosterSource === 'official_12A'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title={t('ថ្នាក់គំរូ ៥០ នាក់ តាមឯកសារក្រសួងដើម', 'Original MoEYS 50-student Template')}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>ថ្នាក់ទី ១២ 'ក' (គំរូ ៥០ នាក់)</span>
            </button>

            {/* Draggable Reorderable School Classes from orderedClassList */}
            {orderedClassList.map((cls, index) => {
              const isSelected = selectedRosterSource === cls.classId;
              return (
                <div
                  key={cls.classId}
                  draggable={permissions.canEdit}
                  onDragStart={(e) => {
                    setDraggedClassIndex(index);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedClassIndex === null || draggedClassIndex === index) return;
                    const currentList = orderedClassList.map((c) => c.classId);
                    const updated = [...currentList];
                    const [moved] = updated.splice(draggedClassIndex, 1);
                    updated.splice(index, 0, moved);
                    reorderClasses(updated);
                    setDraggedClassIndex(null);
                  }}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all font-khmer select-none shrink-0 ${
                    draggedClassIndex === index
                      ? 'opacity-40 scale-95 ring-2 ring-indigo-400 bg-indigo-50'
                      : isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
                  }`}
                >
                  {permissions.canEdit && (
                    <span
                      className="cursor-grab active:cursor-grabbing text-slate-400 group-hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity -ml-1"
                      title={t('អូសដើម្បីផ្លាស់ប្តូរលំដាប់ថ្នាក់ (Drag to reorder class)', 'Drag to reorder class')}
                    >
                      <GripVertical className="w-3 h-3" />
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSelectSource(cls.classId)}
                    className="flex items-center gap-1.5 cursor-pointer text-left"
                    title={`${cls.className} (${cls.students.length} នាក់) - អូសដើម្បីរៀបលំដាប់`}
                  >
                    <span>{cls.className}</span>
                    {currentBranchId === 'all' && (
                      <span className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
                        isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {branches.find((b) => b.id === (cls.branchId || 'branch-central'))?.code || 'BIM-01'}
                      </span>
                    )}
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                        isSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cls.students.length}
                    </span>
                  </button>

                  {/* Move Up/Down Quick Control Buttons for non-drag accessibility */}
                  {permissions.canEdit && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center -mr-1 transition-opacity">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveClassOrder(cls.classId, 'up');
                          }}
                          className="p-0.5 text-slate-400 hover:text-indigo-400 transition-colors"
                          title="រំកិលទៅមុខ (Move Up)"
                        >
                          <ArrowUp className="w-2.5 h-2.5" />
                        </button>
                      )}
                      {index < orderedClassList.length - 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveClassOrder(cls.classId, 'down');
                          }}
                          className="p-0.5 text-slate-400 hover:text-indigo-400 transition-colors"
                          title="រំកិលទៅក្រោយ (Move Down)"
                        >
                          <ArrowDown className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Action Cluster: Class Auto-Sort Dropdown & Search */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            {permissions.canEdit && (
              <div className="relative" ref={classSortDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsClassSortDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-700 hover:text-slate-900 text-xs font-khmer font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                  title={t('តម្រៀបលំដាប់ថ្នាក់ស្វ័យប្រវត្តិ (Auto-Sort Classes)', 'Auto-Sort Classes')}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{t('តម្រៀបថ្នាក់', 'Sort Classes')}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
                      isClassSortDropdownOpen ? 'rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>

                {isClassSortDropdownOpen && (
                  <div className="absolute right-0 sm:left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs font-khmer animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      {t('តម្រៀបលំដាប់ថ្នាក់រៀន', 'Sort Classes')}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sortClasses('name_asc');
                        setIsClassSortDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{t('តាមឈ្មោះថ្នាក់ (A → Z / ១ ដល់ ១២)', 'By Class Name (A → Z)')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sortClasses('name_desc');
                        setIsClassSortDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{t('តាមឈ្មោះថ្នាក់ (Z → A / ១២ ដល់ ១)', 'By Class Name (Z → A)')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sortClasses('students_desc');
                        setIsClassSortDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{t('តាមចំនួនសិស្ស (ច្រើនទៅតិច)', 'By Student Count (High to Low)')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Search in roster */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="ស្វែងរកឈ្មោះសិស្ស ឬលេខរៀង..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Inline Config Panel (When Edit Mode is Active) */}
        {isEditMode && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150 text-xs font-khmer">
            <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>កែសម្រួលព័ត៌មានក្បាលលិខិត & ហត្ថលេខាផ្លូវការ</span>
              <span className="text-[11px] text-slate-500 font-normal">ទិន្នន័យនេះនឹងត្រូវបោះពុម្ពលើឯកសារផ្លូវការ</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 font-semibold mb-1">មន្ទីរអប់រំ / រដ្ឋបាល</label>
                <input
                  type="text"
                  value={ministryDept}
                  onChange={(e) => setMinistryDept(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 font-semibold mb-1">គ្រឹះស្ថានសិក្សា / សាលា</label>
                <input
                  type="text"
                  value={schoolInstitution}
                  onChange={(e) => setSchoolInstitution(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 font-semibold mb-1">ឈ្មោះថ្នាក់រៀន</label>
                <input
                  type="text"
                  value={classNameTitle}
                  onChange={(e) => setClassNameTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 font-semibold mb-1">ឆ្នាំសិក្សា</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                  កំណត់គ្រូបន្ទុកថ្នាក់ (Homeroom Teacher)
                </label>
                <div className="space-y-1">
                  <input
                    type="text"
                    value={homeroomTeacher}
                    onChange={(e) => setHomeroomTeacher(e.target.value)}
                    placeholder="ឈ្មោះគ្រូបន្ទុកថ្នាក់"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-bold font-khmer"
                  />
                  {allUsers && allUsers.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          const u = allUsers.find((usr) => usr.id === e.target.value);
                          if (u) {
                            setHomeroomTeacher(u.khmerName.split('(')[0].trim());
                          }
                        }
                      }}
                      className="w-full px-2 py-1 border border-slate-300 rounded bg-slate-50 text-[10px] font-khmer text-slate-700"
                    >
                      <option value="">-- ជ្រើសរើសពីបុគ្គលិកសាលា --</option>
                      {allUsers
                        .filter((u) => u.role === 'teacher' || u.role === 'admin')
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.khmerName}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 font-semibold mb-1">ទូរស័ព្ទទំនាក់ទំនង</label>
                <input
                  type="text"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 font-semibold mb-1">តួនាទីថ្នាក់ដឹកនាំ</label>
                <input
                  type="text"
                  value={directorTitle}
                  onChange={(e) => setDirectorTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 font-semibold mb-1">ឈ្មោះនាយកសាលា</label>
                <input
                  type="text"
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-bold"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-600 font-semibold mb-1">កាលបរិច្ឆេទតាមចន្ទគតិ</label>
                <input
                  type="text"
                  value={lunarDateText}
                  onChange={(e) => setLunarDateText(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-600 font-semibold mb-1">កាលបរិច្ឆេទតាមសុរិយគតិ</label>
                <input
                  type="text"
                  value={solarDateText}
                  onChange={(e) => setSolarDateText(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                />
              </div>

              {/* Quick School Logo Upload row */}
              <div className="sm:col-span-4 p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded border border-slate-200 p-0.5 flex items-center justify-center shrink-0 bg-slate-50">
                    <img
                      src={settings.schoolLogo || '/assets/aistudio/image_aa91f44e.png'}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-xs">ឡូហ្គោសាលា (School Logo)</div>
                    <div className="text-[10px] text-slate-500">ទាញយកពី System Settings ឬផ្ទុកឡើងផ្ទាល់ពីទីនេះ</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => rosterLogoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-khmer font-bold text-xs shadow-2xs transition-colors"
                  >
                    {isUploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>ផ្ទុកឡើង Logo ថ្មី</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ schoolLogo: '/assets/aistudio/image_aa91f44e.png' })}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-khmer text-xs"
                  >
                    ប្រើ MoEYS ដើម
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* THE OFFICIAL CAMBODIAN DOCUMENT SHEET (EXACT PIXEL-PERFECT REPLICA)      */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-300 rounded-xl p-4 sm:p-8 lg:p-10 shadow-lg mx-auto max-w-[960px] print:p-0 print:border-none print:shadow-none print:max-w-full text-black">
        {/* Document Header */}
        <div className="flex items-start justify-between gap-4 pb-3">
          {/* Top Left: MoEYS / School Emblem & Institution Name */}
          <div className="text-center sm:text-left space-y-1 w-64">
            <div className="flex items-center gap-2">
              <input
                ref={rosterLogoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                onChange={handleRosterLogoUpload}
                className="hidden"
              />
              <div
                onClick={() => rosterLogoInputRef.current?.click()}
                title="ចុចដើម្បីផ្ទុកឡើង / ផ្លាស់ប្តូរ Logo សាលា (Click to upload/change logo)"
                className="relative group w-12 h-12 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer rounded-lg hover:ring-2 hover:ring-indigo-400 transition-all bg-white"
              >
                <img
                  src={settings.schoolLogo || '/assets/aistudio/image_aa91f44e.png'}
                  alt="School Emblem Logo"
                  className="w-12 h-12 object-contain"
                />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity print:hidden">
                  {isUploadingLogo ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>
            <div className="text-[11px] font-bold font-khmer text-slate-900 leading-tight">
              {ministryDept}
            </div>
            <div className="text-[11px] font-semibold font-khmer text-slate-800 leading-tight">
              {schoolInstitution}
            </div>
          </div>

          {/* Top Right: Kingdom National Motto */}
          <div className="text-center space-y-1">
            <div className="text-sm sm:text-base font-extrabold font-khmer text-slate-900 tracking-wider">
              ព្រះរាជាណាចក្រកម្ពុជា
            </div>
            <div className="text-xs sm:text-sm font-bold font-khmer text-slate-800">
              ជាតិ សាសនា ព្រះមហាក្សត្រ
            </div>
            {/* National Ornament / Signature underline */}
            <div className="flex items-center justify-center gap-1 pt-0.5 text-slate-600">
              <span className="w-6 h-[1.5px] bg-slate-800 inline-block"></span>
              <span className="text-[10px]">♦</span>
              <span className="w-6 h-[1.5px] bg-slate-800 inline-block"></span>
            </div>
          </div>
        </div>

        {/* Center Document Title */}
        <div className="text-center pt-3 pb-4 space-y-1">
          <h1 className="text-xl sm:text-2xl font-black font-khmer text-blue-700 tracking-wide">
            បញ្ជីនាមសិស្ស
          </h1>
          <div className="text-sm sm:text-base font-bold font-khmer text-slate-900">
            {classNameTitle} ឆ្នាំសិក្សា {academicYear}
          </div>
        </div>

        {/* DUAL-COLUMN OFFICIAL TABLE FORMAT (MATCHING IMAGE 1-25 & 26-50) */}
        <div className="w-full border-2 border-black overflow-x-auto text-[11px] sm:text-xs">
          <table className="w-full border-collapse text-left">
            <thead>
              {/* Dual Column Master Header */}
              <tr className="bg-slate-50 text-black font-bold border-b-2 border-black font-khmer text-center">
                {/* LEFT HALF HEADER (Columns 1 to 25) */}
                <th className="py-2 px-1 border-r border-black w-8 text-center">លរ</th>
                <th className="py-2 px-2 border-r border-black text-center" colSpan={2}>
                  នាម និង គោត្តនាម
                </th>
                <th className="py-2 px-1 border-r border-black w-9 text-center">ភេទ</th>
                <th className="py-2 px-1.5 border-r-2 border-black w-24 text-center">ថ្ងៃខែឆ្នាំកំណើត</th>
                <th className="py-2 px-1 border-r-2 border-black w-14 text-center">ផ្សេងៗ</th>

                {/* RIGHT HALF HEADER (Columns 26 to 50) */}
                <th className="py-2 px-1 border-r border-black w-8 text-center">លរ</th>
                <th className="py-2 px-2 border-r border-black text-center" colSpan={2}>
                  នាម និង គោត្តនាម
                </th>
                <th className="py-2 px-1 border-r border-black w-9 text-center">ភេទ</th>
                <th className="py-2 px-1.5 border-r border-black w-24 text-center">ថ្ងៃខែឆ្នាំកំណើត</th>
                <th className="py-2 px-1 w-14 text-center">ផ្សេងៗ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/70">
              {leftColumnStudents.map((leftItem, idx) => {
                const rightItem = rightColumnStudents[idx];
                return (
                  <tr key={leftItem.id} className="hover:bg-slate-50 font-khmer">
                    {/* LEFT ITEM (1-25) */}
                    <td className="py-1 px-1 border-r border-black text-center font-mono font-medium">
                      {leftItem.no}
                    </td>
                    <td className="py-1 px-2 border-r border-black/50 font-bold whitespace-nowrap">
                      {leftItem.surname}
                    </td>
                    <td className="py-1 px-2 border-r border-black font-bold whitespace-nowrap">
                      {leftItem.firstName}
                    </td>
                    <td className="py-1 px-1 border-r border-black text-center font-bold">
                      {leftItem.gender}
                    </td>
                    <td className="py-1 px-1 border-r-2 border-black text-center font-mono text-[10px] sm:text-[11px] whitespace-nowrap">
                      {leftItem.dob}
                    </td>
                    <td className="py-1 px-1 border-r-2 border-black text-center text-[10px]">
                      {leftItem.note || ''}
                    </td>

                    {/* RIGHT ITEM (26-50) */}
                    {rightItem ? (
                      <>
                        <td className="py-1 px-1 border-r border-black text-center font-mono font-medium">
                          {rightItem.no}
                        </td>
                        <td className="py-1 px-2 border-r border-black/50 font-bold whitespace-nowrap">
                          {rightItem.surname}
                        </td>
                        <td className="py-1 px-2 border-r border-black font-bold whitespace-nowrap">
                          {rightItem.firstName}
                        </td>
                        <td className="py-1 px-1 border-r border-black text-center font-bold">
                          {rightItem.gender}
                        </td>
                        <td className="py-1 px-1 border-r border-black text-center font-mono text-[10px] sm:text-[11px] whitespace-nowrap">
                          {rightItem.dob}
                        </td>
                        <td className="py-1 px-1 text-center text-[10px]">
                          {rightItem.note || ''}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-1 px-1 border-r border-black text-center">-</td>
                        <td className="py-1 px-2 border-r border-black/50"></td>
                        <td className="py-1 px-2 border-r border-black"></td>
                        <td className="py-1 px-1 border-r border-black text-center"></td>
                        <td className="py-1 px-1 border-r border-black text-center"></td>
                        <td className="py-1 px-1 text-center"></td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Document Footer: Counts & Signatures */}
        <div className="pt-4 flex flex-col sm:flex-row items-start justify-between gap-6 text-xs font-khmer">
          {/* Left Footer: Cutoff count & Teacher Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-6 font-bold text-slate-900">
              <div>
                បញ្ឈប់បញ្ជីត្រឹមចំនួន{' '}
                <span className="font-mono text-sm underline underline-offset-4 font-bold ml-1">
                  {totalStudentsCount}
                </span>{' '}
                នាក់
              </div>
              <div>
                ស្រីមានចំនួន{' '}
                <span className="font-mono text-sm underline underline-offset-4 font-bold ml-1">
                  {femaleCount}
                </span>{' '}
                នាក់
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-700">គ្រូបន្ទុកថ្នាក់:</span>
                <span className="font-bold text-slate-950 text-sm">{homeroomTeacher}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-700">ទូរស័ព្ទទំនាក់ទំនង:</span>
                <span className="font-mono font-bold text-slate-900">{teacherPhone}</span>
              </div>
            </div>
          </div>

          {/* Right Footer: Lunar Date & Principal Stamp */}
          <div className="text-center sm:text-center space-y-1 w-full sm:w-72 self-end sm:self-auto">
            <div className="text-[11px] text-slate-800">{lunarDateText}</div>
            <div className="text-[11px] font-semibold text-slate-900">{solarDateText}</div>
            <div className="font-bold text-sm text-blue-900 pt-1 tracking-wide">
              {directorTitle}
            </div>

            {/* Clean Principal Signature Area (Stamp removed as requested: លុបបោះត្រាចេញ) */}
            <div className="h-24 flex flex-col items-center justify-end my-1">
              <div className="text-[10px] text-slate-300 print:hidden italic select-none">
                (ហត្ថលេខា & ត្រាជាក់ស្តែង)
              </div>
            </div>

            <div className="font-bold text-sm font-khmer text-slate-900 pt-0.5">
              {directorName}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ASSIGN HOMEROOM TEACHER (កំណត់គ្រូបន្ទុកថ្នាក់) */}
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
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
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

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-[11px] font-khmer">
                ព័ត៌មានគ្រូបន្ទុកថ្នាក់នេះ នឹងត្រូវបានបង្ហាញលើក្បាលបញ្ជីនាមសិស្សផ្លូវការ និងរក្សាទុកក្នុងប្រព័ន្ធសម្រាប់ថ្នាក់ {classNameTitle}។
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-khmer font-medium"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold font-khmer transition-colors shadow-xs"
                >
                  រក្សាទុកគ្រូបន្ទុកថ្នាក់
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW ORIGINAL ATTACHED IMAGE FOR REFERENCE */}
      {isOriginalPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 text-xs my-auto animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base font-khmer">
                  រូបភាពឯកសារដើមផ្លូវការ (Original Reference Document)
                </h3>
              </div>
              <button
                onClick={() => setIsOriginalPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 flex justify-center">
              <img
                src="/assets/aistudio/image_aa91f44e.png"
                alt="Original Official Roster"
                className="w-full h-auto object-contain rounded-lg shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-500 font-khmer">
              <span>ឯកសារគំរូផ្លូវការ៖ បញ្ជីនាមសិស្ស ថ្នាក់ទី ១២ 'ក' (វិទ្យាសាស្ត្រ)</span>
              <button
                onClick={() => setIsOriginalPreviewOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold font-khmer hover:bg-slate-800"
              >
                យល់ព្រម
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Student Import Modal */}
      <ExcelStudentImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        defaultTargetClassId={selectedClassId}
      />
    </div>
  );
};
