import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DailyStudentAttendanceRecord, AttendanceStatus } from '../types';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Users,
  Printer,
  Search,
  Filter,
  Check,
  Building,
  FileSpreadsheet,
} from 'lucide-react';
import { Student31DaysAttendanceReport } from './Student31DaysAttendanceReport';

export const StudentAttendanceView: React.FC = () => {
  const {
    classData,
    orderedClassList,
    selectedClassId,
    setSelectedClassId,
    currentBranch,
    settings,
    currentUser,
    permissions,
    t,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [activeClassId, setActiveClassId] = useState<string>(() => {
    return selectedClassId || '1A';
  });

  const [attendanceViewMode, setAttendanceViewMode] = useState<'daily' | 'monthly_31days'>('daily');

  const currentClass = classData[activeClassId] || orderedClassList[0] || Object.values(classData)[0];

  // Persistent attendance store
  const [attendanceRecords, setAttendanceRecords] = useState<{ [key: string]: DailyStudentAttendanceRecord }>(() => {
    try {
      const stored = localStorage.getItem('BIM_RANGSEI_ATTENDANCE');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const recordKey = `${activeClassId}_${selectedDate}`;
  const currentRecord = attendanceRecords[recordKey] || {
    id: `att-${recordKey}`,
    date: selectedDate,
    classId: activeClassId,
    className: currentClass?.className || activeClassId,
    recordedBy: currentUser.khmerName,
    attendance: {},
  };

  const [searchQuery, setSearchQuery] = useState('');

  const saveAttendance = (newAttendance: { [studentId: number]: { status: AttendanceStatus; note?: string } }) => {
    const updatedRecord: DailyStudentAttendanceRecord = {
      id: `att-${recordKey}`,
      date: selectedDate,
      classId: activeClassId,
      className: currentClass.className,
      recordedBy: currentUser.khmerName,
      attendance: newAttendance,
    };

    const updatedStore = {
      ...attendanceRecords,
      [recordKey]: updatedRecord,
    };

    setAttendanceRecords(updatedStore);
    try {
      localStorage.setItem('BIM_RANGSEI_ATTENDANCE', JSON.stringify(updatedStore));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetStudentStatus = (studentId: number, status: AttendanceStatus) => {
    const currentAtt = { ...currentRecord.attendance };
    currentAtt[studentId] = {
      ...currentAtt[studentId],
      status,
    };
    saveAttendance(currentAtt);
  };

  const handleMarkAllPresent = () => {
    const allPresent: { [studentId: number]: { status: AttendanceStatus; note?: string } } = {};
    currentClass.students.forEach((s) => {
      allPresent[s.id] = { status: 'present' };
    });
    saveAttendance(allPresent);
  };

  const filteredStudents = useMemo(() => {
    if (!currentClass?.students) return [];
    return currentClass.students.filter((st) => {
      const q = searchQuery.toLowerCase();
      return (
        st.name.toLowerCase().includes(q) ||
        (st.latinName && st.latinName.toLowerCase().includes(q)) ||
        st.studentCode.toLowerCase().includes(q)
      );
    });
  }, [currentClass, searchQuery]);

  // Summary statistics
  const stats = useMemo(() => {
    let present = 0;
    let permission = 0;
    let noPermission = 0;
    let late = 0;

    currentClass.students.forEach((s) => {
      const att = currentRecord.attendance[s.id]?.status || 'present';
      if (att === 'present') present++;
      else if (att === 'absent_permission') permission++;
      else if (att === 'absent_no_permission') noPermission++;
      else if (att === 'late') late++;
    });

    const total = currentClass.students.length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

    return { total, present, permission, noPermission, late, rate };
  }, [currentClass, currentRecord]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-khmer text-slate-900">
                  ការស្រង់វត្តមានសិស្ស (Student Attendance)
                </h1>
                <p className="text-xs text-slate-500 font-khmer mt-0.5">
                  កត់ត្រាវត្តមានប្រចាំថ្ងៃ ពិនិត្យអវត្តមាន និងបោះពុម្ពបញ្ជីស្រង់វត្តមានផ្លូវការ
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleMarkAllPresent}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-khmer shadow-xs transition-all"
            >
              <Check className="w-4 h-4" />
              <span>មានវត្តមានទាំងអស់ (Mark All Present)</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold font-khmer shadow-xs transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>បោះពុម្ពបញ្ជីវត្តមាន (A4)</span>
            </button>
          </div>
        </div>

        {/* View Mode Toggle: Daily vs 31 Days Report */}
        <div className="flex items-center gap-2 border-b border-slate-200 mt-6 pt-1">
          <button
            onClick={() => setAttendanceViewMode('daily')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold font-khmer border-b-2 transition-all cursor-pointer ${
              attendanceViewMode === 'daily'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ការស្រង់វត្តមានប្រចាំថ្ងៃ (Daily Attendance)</span>
          </button>

          <button
            onClick={() => setAttendanceViewMode('monthly_31days')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold font-khmer border-b-2 transition-all cursor-pointer ${
              attendanceViewMode === 'monthly_31days'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>របាយការណ៍វត្តមាន ៣១ ថ្ងៃ (31 Days Student Attendance Report)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
              31 Days
            </span>
          </button>
        </div>

        {attendanceViewMode === 'daily' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100">
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
                កាលបរិច្ឆេទស្រង់វត្តមាន (Date)
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 font-khmer mb-1">
                ស្វែងរកសិស្ស (Search Student)
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
        )}
      </div>

      {/* 31 Days Report View */}
      {attendanceViewMode === 'monthly_31days' && (
        <Student31DaysAttendanceReport defaultClassId={activeClassId} />
      )}

      {/* Daily Attendance Views */}
      {attendanceViewMode === 'daily' && (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 no-print">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-khmer">សិស្សសរុបក្នុងថ្នាក់</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {stats.total} <span className="text-xs font-khmer font-normal text-slate-500">នាក់</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200/90 shadow-2xs">
          <div className="text-[11px] text-emerald-700 font-khmer font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>មានវត្តមាន (Present)</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            {stats.present} <span className="text-xs font-khmer font-normal">នាក់</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200/90 shadow-2xs">
          <div className="text-[11px] text-amber-700 font-khmer font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>សុំច្បាប់ (Excused)</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">
            {stats.permission} <span className="text-xs font-khmer font-normal">នាក់</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200/90 shadow-2xs">
          <div className="text-[11px] text-rose-700 font-khmer font-bold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>អវត្តមាន (Absent)</span>
          </div>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1">
            {stats.noPermission} <span className="text-xs font-khmer font-normal">នាក់</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200/90 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] text-blue-700 font-khmer font-bold">
            អត្រាវត្តមាន (Attendance %)
          </div>
          <div className="text-xl font-bold font-mono text-blue-700 mt-1">
            {stats.rate}%
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
          <div className="text-xs font-semibold font-khmer text-emerald-700">
            {currentBranch.nameKhmer}
          </div>
          <div className="text-base font-bold font-khmer text-slate-900 pt-2 uppercase">
            បញ្ជីស្រង់វត្តមានសិស្សប្រចាំថ្ងៃ (Daily Attendance Sheet)
          </div>
          <div className="text-xs font-bold font-khmer text-slate-800">
            ថ្នាក់រៀន៖ {currentClass.className} ({currentClass.period}) · កាលបរិច្ឆេទ៖ {selectedDate}
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            គ្រូបន្ទុកថ្នាក់៖ {currentClass.homeroomTeacher || 'យ៉េន ណាវីន'} · អ្នកស្រង់វត្តមាន៖ {currentUser.khmerName}
          </div>
        </div>

        {/* Student Attendance Table */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 font-khmer">
                  <th className="py-3 px-3.5 text-center w-12 border-r border-slate-200">ល.រ</th>
                  <th className="py-3 px-4 border-r border-slate-200">អត្តលេខ</th>
                  <th className="py-3 px-4 border-r border-slate-200">គោត្តនាម-នាមសិស្ស</th>
                  <th className="py-3 px-4 border-r border-slate-200">ឈ្មោះឡាតាំង</th>
                  <th className="py-3 px-4 text-center border-r border-slate-200">ភេទ</th>
                  <th className="py-3 px-4 text-center border-r border-slate-200">ស្ថានភាពវត្តមាន</th>
                  <th className="py-3 px-4 text-center no-print">ការជ្រើសរើសរហ័ស</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-khmer">
                      មិនមានទិន្នន័យសិស្សក្នុងថ្នាក់នេះទេ
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, idx) => {
                    const status = currentRecord.attendance[st.id]?.status || 'present';

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3.5 text-center font-mono text-slate-500 border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-700 border-r border-slate-100">
                          {st.studentCode}
                        </td>
                        <td className="py-2.5 px-4 font-bold font-khmer text-slate-900 border-r border-slate-100">
                          {st.name}
                        </td>
                        <td className="py-2.5 px-4 font-sans text-slate-500 border-r border-slate-100">
                          {st.latinName || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-center font-khmer border-r border-slate-100">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            st.gender === 'Female' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {st.gender === 'Female' ? 'ស្រី' : 'ប្រុស'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-khmer border-r border-slate-100">
                          {status === 'present' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>មានវត្តមាន (Present)</span>
                            </span>
                          )}
                          {status === 'absent_permission' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>សុំច្បាប់ (Excused)</span>
                            </span>
                          )}
                          {status === 'absent_no_permission' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>អវត្តមាន (Absent)</span>
                            </span>
                          )}
                          {status === 'late' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Clock className="w-3.5 h-3.5 text-purple-600" />
                              <span>មកយឺត (Late)</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center no-print">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSetStudentStatus(st.id, 'present')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold font-khmer transition-all ${
                                status === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                              title="មានវត្តមាន"
                            >
                              វត្តមាន
                            </button>
                            <button
                              onClick={() => handleSetStudentStatus(st.id, 'absent_permission')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold font-khmer transition-all ${
                                status === 'absent_permission'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                              }`}
                              title="សុំច្បាប់"
                            >
                              សុំច្បាប់
                            </button>
                            <button
                              onClick={() => handleSetStudentStatus(st.id, 'absent_no_permission')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold font-khmer transition-all ${
                                status === 'absent_no_permission'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                              }`}
                              title="អវត្តមានឥតច្បាប់"
                            >
                              អវត្តមាន
                            </button>
                            <button
                              onClick={() => handleSetStudentStatus(st.id, 'late')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold font-khmer transition-all ${
                                status === 'late'
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-700'
                              }`}
                              title="មកយឺត"
                            >
                              យឺត
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dual Signatures on Print */}
        <div className="hidden print:grid grid-cols-2 pt-12 text-xs text-center font-khmer">
          <div className="space-y-12">
            <div className="font-bold text-slate-700">បានឃើញ និងឯកភាព (នាយកសាលា)</div>
            <div className="font-bold text-slate-900">{settings.directorName}</div>
          </div>
          <div className="space-y-12">
            <div className="font-bold text-slate-700">គ្រូបន្ទុកថ្នាក់ / អ្នកស្រង់វត្តមាន</div>
            <div className="font-bold text-slate-900">{currentUser.khmerName}</div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
