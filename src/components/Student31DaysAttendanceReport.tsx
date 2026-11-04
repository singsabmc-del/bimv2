import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MONTH_NAMES, MONTH_NAMES_KH, AttendanceStatus } from '../types';
import {
  Calendar,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  Check,
  Building,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

interface Attendance31DayCell {
  status: AttendanceStatus | 'holiday';
  note?: string;
}

interface MonthlyClassAttendanceRecord {
  classId: string;
  month: string;
  year: number;
  records: {
    [studentId: number]: {
      [day: number]: Attendance31DayCell;
    };
  };
}

interface Student31DaysAttendanceReportProps {
  defaultClassId?: string;
  defaultMonth?: string;
  defaultYear?: number;
}

export const Student31DaysAttendanceReport: React.FC<Student31DaysAttendanceReportProps> = ({
  defaultClassId,
  defaultMonth,
  defaultYear,
}) => {
  const {
    classData,
    orderedClassList,
    selectedClassId,
    currentBranch,
    settings,
    currentUser,
    globalMonth,
    globalYear,
    permissions,
    t,
  } = useApp();

  const [activeClassId, setActiveClassId] = useState<string>(
    defaultClassId || selectedClassId || '1A'
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    defaultMonth || globalMonth || 'October'
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    defaultYear || globalYear || 2026
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Female' | 'Man'>('all');
  const [activeDayQuick, setActiveDayQuick] = useState<number>(1);

  const currentClass =
    classData[activeClassId] || orderedClassList[0] || Object.values(classData)[0];

  // Number of days in the selected month
  const monthIdx = MONTH_NAMES.indexOf(selectedMonth as any);
  const daysInMonth =
    monthIdx >= 0 ? new Date(selectedYear, monthIdx + 1, 0).getDate() : 31;
  const daysArray = Array.from({ length: 31 }, (_, i) => i + 1);

  // Storage key
  const storageKey = `BIM_ATTENDANCE_31D_${activeClassId}_${selectedMonth}_${selectedYear}`;

  // State persistence for 31-day attendance
  const [monthlyAttendance, setMonthlyAttendance] = useState<{
    [studentId: number]: { [day: number]: Attendance31DayCell };
  }>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch {}

    // Generate smart baseline attendance (weekdays mostly present, weekends holiday)
    const initial: { [studentId: number]: { [day: number]: Attendance31DayCell } } = {};
    if (currentClass?.students) {
      currentClass.students.forEach((st) => {
        initial[st.id] = {};
        for (let d = 1; d <= 31; d++) {
          if (d > daysInMonth) {
            initial[st.id][d] = { status: 'holiday' };
            continue;
          }
          const dayOfWeek = new Date(selectedYear, monthIdx >= 0 ? monthIdx : 9, d).getDay();
          if (dayOfWeek === 0) {
            // Sunday is weekly off
            initial[st.id][d] = { status: 'holiday' };
          } else {
            // Seed sample realistic attendance
            const isUnpaid = st.feesGroup?.toLowerCase().includes('unpaid');
            const isStopped = st.feesGroup?.toLowerCase().includes('stop');
            if (isStopped && d > 10) {
              initial[st.id][d] = { status: 'absent_no_permission' };
            } else if (d === 15 && st.id % 5 === 0) {
              initial[st.id][d] = { status: 'absent_permission' };
            } else if (d === 7 && st.id % 7 === 0) {
              initial[st.id][d] = { status: 'late' };
            } else {
              initial[st.id][d] = { status: 'present' };
            }
          }
        }
      });
    }
    return initial;
  });

  // Re-load when class/month/year changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setMonthlyAttendance(JSON.parse(stored));
        return;
      }
    } catch {}

    // If not found in storage, generate default structure
    const initial: { [studentId: number]: { [day: number]: Attendance31DayCell } } = {};
    if (currentClass?.students) {
      currentClass.students.forEach((st) => {
        initial[st.id] = {};
        for (let d = 1; d <= 31; d++) {
          if (d > daysInMonth) {
            initial[st.id][d] = { status: 'holiday' };
            continue;
          }
          const dayOfWeek = new Date(selectedYear, monthIdx >= 0 ? monthIdx : 9, d).getDay();
          if (dayOfWeek === 0) {
            initial[st.id][d] = { status: 'holiday' };
          } else {
            initial[st.id][d] = { status: 'present' };
          }
        }
      });
    }
    setMonthlyAttendance(initial);
  }, [activeClassId, selectedMonth, selectedYear, daysInMonth, storageKey]);

  // Save changes
  const saveAttendanceData = (data: typeof monthlyAttendance) => {
    setMonthlyAttendance(data);
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  };

  // Cycle status on cell click: present -> absent_permission -> absent_no_permission -> late -> present
  const handleCellClick = (studentId: number, day: number) => {
    if (day > daysInMonth) return;
    const currentStatus = monthlyAttendance[studentId]?.[day]?.status || 'present';
    let nextStatus: AttendanceStatus | 'holiday' = 'present';

    if (currentStatus === 'present') nextStatus = 'absent_permission';
    else if (currentStatus === 'absent_permission') nextStatus = 'absent_no_permission';
    else if (currentStatus === 'absent_no_permission') nextStatus = 'late';
    else if (currentStatus === 'late') nextStatus = 'holiday';
    else if (currentStatus === 'holiday') nextStatus = 'present';

    const updated = {
      ...monthlyAttendance,
      [studentId]: {
        ...(monthlyAttendance[studentId] || {}),
        [day]: { status: nextStatus },
      },
    };
    saveAttendanceData(updated);
  };

  // Bulk mark all present for a specific day
  const handleMarkDayAllPresent = (day: number) => {
    if (day > daysInMonth) return;
    const updated = { ...monthlyAttendance };
    currentClass.students.forEach((st) => {
      updated[st.id] = {
        ...(updated[st.id] || {}),
        [day]: { status: 'present' },
      };
    });
    saveAttendanceData(updated);
  };

  // Reset entire month to default weekdays present
  const handleResetMonthBaseline = () => {
    if (!confirm(`តើលោកអ្នកពិតជាចង់កំណត់ឡើងវិញនូវវត្តមានសិស្សទាំងអស់សម្រាប់ខែ ${selectedMonth} ${selectedYear} មែនទេ?`)) {
      return;
    }
    const resetData: typeof monthlyAttendance = {};
    currentClass.students.forEach((st) => {
      resetData[st.id] = {};
      for (let d = 1; d <= 31; d++) {
        if (d > daysInMonth) {
          resetData[st.id][d] = { status: 'holiday' };
          continue;
        }
        const dayOfWeek = new Date(selectedYear, monthIdx >= 0 ? monthIdx : 9, d).getDay();
        resetData[st.id][d] = { status: dayOfWeek === 0 ? 'holiday' : 'present' };
      }
    });
    saveAttendanceData(resetData);
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    if (!currentClass?.students) return [];
    return currentClass.students.filter((st) => {
      const matchGender = genderFilter === 'all' || st.gender === genderFilter;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        st.name.toLowerCase().includes(q) ||
        (st.latinName && st.latinName.toLowerCase().includes(q)) ||
        st.studentCode.toLowerCase().includes(q);
      return matchGender && matchQuery;
    });
  }, [currentClass, searchQuery, genderFilter]);

  // Per student statistics calculation across 31 days
  const studentStats = useMemo(() => {
    const stats: {
      [studentId: number]: {
        present: number;
        permission: number;
        noPermission: number;
        late: number;
        studyDays: number;
        rate: number;
      };
    } = {};

    currentClass.students.forEach((st) => {
      let p = 0,
        a = 0,
        o = 0,
        l = 0,
        studyDays = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const cell = monthlyAttendance[st.id]?.[d]?.status || 'present';
        if (cell === 'holiday') continue; // Don't count holiday in attendance denominator
        studyDays++;
        if (cell === 'present') p++;
        else if (cell === 'absent_permission') a++;
        else if (cell === 'absent_no_permission') o++;
        else if (cell === 'late') l++;
      }
      const rate = studyDays > 0 ? Math.round(((p + l * 0.5) / studyDays) * 100) : 100;
      stats[st.id] = { present: p, permission: a, noPermission: o, late: l, studyDays, rate };
    });

    return stats;
  }, [currentClass, monthlyAttendance, daysInMonth]);

  // Overall class averages
  const classSummary = useMemo(() => {
    let totalP = 0,
      totalA = 0,
      totalO = 0,
      totalL = 0;
    const count = currentClass.students.length;

    currentClass.students.forEach((st) => {
      const s = studentStats[st.id];
      if (s) {
        totalP += s.present;
        totalA += s.permission;
        totalO += s.noPermission;
        totalL += s.late;
      }
    });

    const avgRate =
      count > 0
        ? Math.round(
            currentClass.students.reduce((sum, st) => sum + (studentStats[st.id]?.rate || 0), 0) /
              count
          )
        : 100;

    return { totalP, totalA, totalO, totalL, avgRate, studentCount: count };
  }, [currentClass, studentStats]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Student Code',
      'Student Name (Khmer)',
      'Latin Name',
      'Gender',
      ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`),
      'Total Present (P)',
      'Total Excused (A)',
      'Total Absent (O)',
      'Total Late (L)',
      'Attendance Rate (%)',
    ];

    const rows = filteredStudents.map((st, idx) => {
      const s = studentStats[st.id] || { present: 0, permission: 0, noPermission: 0, late: 0, rate: 0 };
      const dayValues = Array.from({ length: 31 }, (_, i) => {
        const d = i + 1;
        if (d > daysInMonth) return '-';
        const stCode = monthlyAttendance[st.id]?.[d]?.status;
        if (stCode === 'present') return 'P';
        if (stCode === 'absent_permission') return 'A';
        if (stCode === 'absent_no_permission') return 'O';
        if (stCode === 'late') return 'L';
        if (stCode === 'holiday') return 'H';
        return 'P';
      });

      return [
        idx + 1,
        st.studentCode,
        `"${st.name.replace(/"/g, '""')}"`,
        `"${(st.latinName || '').replace(/"/g, '""')}"`,
        st.gender,
        ...dayValues,
        s.present,
        s.permission,
        s.noPermission,
        s.late,
        `${s.rate}%`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Attendance_31Days_${currentClass.className}_${selectedMonth}_${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Toolbar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-khmer text-slate-900">
                  របាយការណ៍ស្រង់វត្តមានសិស្ស ៣១ ថ្ងៃ (31 Days Student Attendance Report)
                </h1>
                <p className="text-xs text-slate-500 font-khmer mt-0.5">
                  តារាងវត្តមានប្រចាំខែពេញ ៣១ ថ្ងៃ គណនាផលបូកវត្តមាន អវត្តមាន និងអត្រាភាគរយដោយស្វ័យប្រវត្តិ
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold font-khmer transition-all"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>{t('នាំចេញជា Excel / CSV', 'Export CSV')}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-khmer shadow-xs transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>{t('បោះពុម្ពតារាង ៣១ ថ្ងៃ (Print A4)', 'Print Official Sheet')}</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 font-khmer mb-1">
              ជ្រើសរើសថ្នាក់រៀន (Class)
            </label>
            <select
              value={activeClassId}
              onChange={(e) => setActiveClassId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold bg-slate-50 focus:bg-white"
            >
              {orderedClassList.map((c) => (
                <option key={c.classId} value={c.classId}>
                  {c.className} ({c.period}) · {c.students.length} សិស្ស
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 font-khmer mb-1">
              ខែសិក្សា (Month)
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer font-bold bg-slate-50 focus:bg-white"
            >
              {MONTH_NAMES.map((m) => (
                <option key={m} value={m}>
                  {MONTH_NAMES_KH[m] || m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 font-khmer mb-1">
              ឆ្នាំសិក្សា (Year)
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-slate-50 focus:bg-white"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 font-khmer mb-1">
              ស្វែងរកសិស្ស (Search)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ស្វែងរកតាមឈ្មោះ ឬកូដ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Quick Batch Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs font-khmer">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-600 font-bold">ឧបករណ៍រហ័ស៖</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">ថ្ងៃទី</span>
              <select
                value={activeDayQuick}
                onChange={(e) => setActiveDayQuick(Number(e.target.value))}
                className="px-2 py-1 border border-slate-200 rounded-lg font-mono font-bold text-xs bg-slate-50"
              >
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleMarkDayAllPresent(activeDayQuick)}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[11px] transition-all"
              >
                ✓ មានវត្តមានទាំងអស់ថ្ងៃ {activeDayQuick}
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetMonthBaseline}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] transition-all flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>បំពេញវត្តមានឡើងវិញ (Reset Baseline)</span>
            </button>
          </div>

          {/* Legend Help Indicator */}
          <div className="flex items-center gap-3 text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>✓ / P: វត្តមាន</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>A: ច្បាប់</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>O: ឥតច្បាប់</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
              <span>L: យឺត</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
              <span>-: ឈប់សម្រាក</span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 no-print">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-khmer">សិស្សសរុបក្នុងថ្នាក់</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {classSummary.studentCount} <span className="text-xs font-khmer font-normal text-slate-500">នាក់</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200/90 shadow-2xs">
          <div className="text-[11px] text-emerald-700 font-khmer font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>សរុបវត្តមាន (Total P)</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            {classSummary.totalP}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200/90 shadow-2xs">
          <div className="text-[11px] text-amber-700 font-khmer font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>សរុបសុំច្បាប់ (Total A)</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">
            {classSummary.totalA}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200/90 shadow-2xs">
          <div className="text-[11px] text-rose-700 font-khmer font-bold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>សរុបឥតច្បាប់ (Total O)</span>
          </div>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1">
            {classSummary.totalO}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200/90 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] text-blue-700 font-khmer font-bold">
            អត្រាមធ្យមវត្តមាន
          </div>
          <div className="text-xl font-bold font-mono text-blue-700 mt-1">
            {classSummary.avgRate}%
          </div>
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
          <div className="text-base font-bold font-khmer text-slate-900 pt-1.5 uppercase">
            តារាងស្រង់វត្តមានសិស្សប្រចាំខែ (៣១ ថ្ងៃ) - MONTHLY STUDENT ATTENDANCE REGISTER
          </div>
          <div className="text-xs font-bold font-khmer text-slate-800">
            ថ្នាក់រៀន៖ {currentClass.className} ({currentClass.period}) · ខែ៖ {MONTH_NAMES_KH[selectedMonth] || selectedMonth} {selectedYear}
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            គ្រូបន្ទុកថ្នាក់៖ {currentClass.homeroomTeacher || 'យ៉េន ណាវីន'} · ចំនួនសិស្សសរុប៖ {currentClass.students.length} នាក់
          </div>
        </div>

        {/* 31-Day Attendance Matrix Table */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
              <thead>
                {/* Day of Week Row */}
                <tr className="bg-slate-850 text-white font-khmer text-[9px] border-b border-slate-700">
                  <th colSpan={4} className="py-1 px-2 border-r border-slate-700 text-center uppercase tracking-wide">
                    ព័ត៌មានសិស្ស
                  </th>
                  <th colSpan={31} className="py-1 px-2 border-r border-slate-700 text-center uppercase tracking-wider font-bold text-amber-300">
                    កាលបរិច្ឆេទក្នុងខែ (ថ្ងៃទី ១ ដល់ ថ្ងៃទី ៣១)
                  </th>
                  <th colSpan={5} className="py-1 px-2 text-center uppercase tracking-wide text-emerald-300">
                    សរុបវត្តមាន
                  </th>
                </tr>

                {/* Day Numbers Row (1..31) */}
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 font-mono text-[10px]">
                  <th className="py-2 px-2 text-center w-8 border-r border-slate-300 font-khmer">ល.រ</th>
                  <th className="py-2 px-2.5 border-r border-slate-300 font-khmer whitespace-nowrap">អត្តលេខ</th>
                  <th className="py-2 px-3 border-r border-slate-300 font-khmer min-w-36 whitespace-nowrap">គោត្តនាម-នាមសិស្ស</th>
                  <th className="py-2 px-1.5 text-center w-8 border-r border-slate-300 font-khmer">ភេទ</th>

                  {/* 31 Day Headers */}
                  {daysArray.map((d) => {
                    const isExceed = d > daysInMonth;
                    const dayDate = !isExceed ? new Date(selectedYear, monthIdx >= 0 ? monthIdx : 9, d) : null;
                    const isSunday = dayDate?.getDay() === 0;

                    return (
                      <th
                        key={d}
                        className={`py-1.5 px-0.5 text-center w-6 border-r border-slate-300 font-mono select-none ${
                          isExceed
                            ? 'bg-slate-200 text-slate-400'
                            : isSunday
                            ? 'bg-rose-50 text-rose-700 font-extrabold'
                            : 'hover:bg-slate-200'
                        }`}
                        title={!isExceed && dayDate ? `${d}-${selectedMonth}: ${dayDate.toLocaleDateString('en-US', { weekday: 'short' })}` : undefined}
                      >
                        <div className="leading-tight">{d}</div>
                        {!isExceed && dayDate && (
                          <div className={`text-[8px] font-sans font-normal ${isSunday ? 'text-rose-600' : 'text-slate-500'}`}>
                            {dayDate.toLocaleDateString('en-US', { weekday: 'narrow' })}
                          </div>
                        )}
                      </th>
                    );
                  })}

                  {/* Summary Metric Headers */}
                  <th className="py-2 px-1 text-center w-8 border-r border-slate-300 bg-emerald-100 text-emerald-900 font-bold" title="វត្តមាន (Present)">P</th>
                  <th className="py-2 px-1 text-center w-8 border-r border-slate-300 bg-amber-100 text-amber-900 font-bold" title="សុំច្បាប់ (Excused)">A</th>
                  <th className="py-2 px-1 text-center w-8 border-r border-slate-300 bg-rose-100 text-rose-900 font-bold" title="អវត្តមានឥតច្បាប់ (Absent)">O</th>
                  <th className="py-2 px-1 text-center w-8 border-r border-slate-300 bg-purple-100 text-purple-900 font-bold" title="យឺត (Late)">L</th>
                  <th className="py-2 px-1.5 text-center w-12 bg-blue-100 text-blue-900 font-bold" title="ភាគរយវត្តមាន">%</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={40} className="py-12 text-center text-slate-400 font-khmer">
                      មិនមានទិន្នន័យសិស្សក្នុងថ្នាក់នេះទេ
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, idx) => {
                    const s = studentStats[st.id] || { present: 0, permission: 0, noPermission: 0, late: 0, rate: 0 };

                    return (
                      <tr key={st.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="py-1 px-1.5 text-center font-mono text-slate-500 border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="py-1 px-2 font-mono font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap">
                          {st.studentCode}
                        </td>
                        <td className="py-1 px-3 font-bold font-khmer text-slate-900 border-r border-slate-200 whitespace-nowrap">
                          <span>{st.name}</span>
                          {st.latinName && (
                            <span className="text-[10px] text-slate-400 font-sans ml-1">
                              ({st.latinName})
                            </span>
                          )}
                        </td>
                        <td className="py-1 px-1 text-center font-khmer border-r border-slate-200 text-[10px]">
                          <span className={st.gender === 'Female' ? 'text-pink-600 font-bold' : 'text-blue-600'}>
                            {st.gender === 'Female' ? 'ស្រី' : 'ប្រុស'}
                          </span>
                        </td>

                        {/* 31 Day Cells */}
                        {daysArray.map((d) => {
                          const isExceed = d > daysInMonth;
                          const cell = monthlyAttendance[st.id]?.[d];
                          const status = cell?.status || 'present';
                          const dayDate = !isExceed ? new Date(selectedYear, monthIdx >= 0 ? monthIdx : 9, d) : null;
                          const isSunday = dayDate?.getDay() === 0;

                          if (isExceed) {
                            return (
                              <td key={d} className="py-1 px-0.5 text-center border-r border-slate-200 bg-slate-100 text-slate-300 font-mono text-[9px]">
                                -
                              </td>
                            );
                          }

                          return (
                            <td
                              key={d}
                              onClick={() => handleCellClick(st.id, d)}
                              className={`py-1 px-0.5 text-center border-r border-slate-200 font-mono text-[10px] cursor-pointer select-none transition-all ${
                                isSunday && status === 'holiday'
                                  ? 'bg-slate-100 text-slate-400'
                                  : status === 'present'
                                  ? 'bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 font-bold'
                                  : status === 'absent_permission'
                                  ? 'bg-amber-100 text-amber-900 font-bold hover:bg-amber-200'
                                  : status === 'absent_no_permission'
                                  ? 'bg-rose-100 text-rose-900 font-black hover:bg-rose-200'
                                  : status === 'late'
                                  ? 'bg-purple-100 text-purple-900 font-bold hover:bg-purple-200'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                              title={`ថ្ងៃ ${d}-${selectedMonth}: ចុចដើម្បីផ្លាស់ប្តូរវត្តមាន`}
                            >
                              {status === 'present' && '✓'}
                              {status === 'absent_permission' && 'A'}
                              {status === 'absent_no_permission' && 'O'}
                              {status === 'late' && 'L'}
                              {status === 'holiday' && '-'}
                            </td>
                          );
                        })}

                        {/* Total Counts */}
                        <td className="py-1 px-1 text-center font-mono font-bold text-emerald-800 border-r border-slate-200 bg-emerald-50/40">
                          {s.present}
                        </td>
                        <td className="py-1 px-1 text-center font-mono font-bold text-amber-800 border-r border-slate-200 bg-amber-50/40">
                          {s.permission}
                        </td>
                        <td className="py-1 px-1 text-center font-mono font-bold text-rose-800 border-r border-slate-200 bg-rose-50/40">
                          {s.noPermission}
                        </td>
                        <td className="py-1 px-1 text-center font-mono font-bold text-purple-800 border-r border-slate-200 bg-purple-50/40">
                          {s.late}
                        </td>
                        <td className="py-1 px-1 text-center font-mono font-black text-slate-900 bg-blue-50/40">
                          {s.rate}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Footer Total Summary Row */}
              <tfoot>
                <tr className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300 font-mono text-[10px]">
                  <td colSpan={4} className="py-2 px-3 text-right font-khmer border-r border-slate-300">
                    សរុបវត្តមានប្រចាំថ្ងៃ (Daily Total Present):
                  </td>

                  {/* 31 Daily Sum Column */}
                  {daysArray.map((d) => {
                    const isExceed = d > daysInMonth;
                    if (isExceed) {
                      return (
                        <td key={d} className="py-1.5 px-0.5 text-center border-r border-slate-300 text-slate-400 bg-slate-200">
                          -
                        </td>
                      );
                    }

                    let dayPresentCount = 0;
                    currentClass.students.forEach((st) => {
                      if (monthlyAttendance[st.id]?.[d]?.status === 'present') {
                        dayPresentCount++;
                      }
                    });

                    return (
                      <td key={d} className="py-1.5 px-0.5 text-center border-r border-slate-300 font-bold text-slate-800">
                        {dayPresentCount}
                      </td>
                    );
                  })}

                  <td className="py-1.5 px-1 text-center border-r border-slate-300 bg-emerald-200 text-emerald-950 font-black">
                    {classSummary.totalP}
                  </td>
                  <td className="py-1.5 px-1 text-center border-r border-slate-300 bg-amber-200 text-amber-950 font-black">
                    {classSummary.totalA}
                  </td>
                  <td className="py-1.5 px-1 text-center border-r border-slate-300 bg-rose-200 text-rose-950 font-black">
                    {classSummary.totalO}
                  </td>
                  <td className="py-1.5 px-1 text-center border-r border-slate-300 bg-purple-200 text-purple-950 font-black">
                    {classSummary.totalL}
                  </td>
                  <td className="py-1.5 px-1 text-center bg-blue-200 text-blue-950 font-black text-xs">
                    {classSummary.avgRate}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Legend Explanations on Print */}
        <div className="hidden print:flex items-center justify-between text-[10px] text-slate-600 font-khmer pt-3 border-t border-slate-300 mt-2">
          <div className="flex items-center gap-4">
            <span className="font-bold">សម្គាល់សញ្ញា៖</span>
            <span><strong>✓</strong>: មានវត្តមាន (Present)</span>
            <span><strong>A</strong>: សុំច្បាប់ (Excused)</span>
            <span><strong>O</strong>: អវត្តមានឥតច្បាប់ (Absent)</span>
            <span><strong>L</strong>: មកយឺត (Late)</span>
            <span><strong>-</strong>: ថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍ / ថ្ងៃបុណ្យ (Holiday)</span>
          </div>
          <div>
            អត្រាវត្តមានជាមធ្យមទូទាំងថ្នាក់៖ <strong>{classSummary.avgRate}%</strong>
          </div>
        </div>

        {/* Dual Signatures on Print */}
        <div className="hidden print:grid grid-cols-2 pt-10 text-xs text-center font-khmer">
          <div className="space-y-12">
            <div className="font-bold text-slate-800">បានឃើញ និងឯកភាព (នាយកសាលា)</div>
            <div className="font-bold text-slate-900">{settings.directorName}</div>
          </div>
          <div className="space-y-12">
            <div className="font-bold text-slate-800">គ្រូបន្ទុកថ្នាក់ / អ្នកស្រង់វត្តមាន</div>
            <div className="font-bold text-slate-900">{currentClass.homeroomTeacher || currentUser.khmerName}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
