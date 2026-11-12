import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  ArrowRight,
  Check,
  Search,
  Users,
  Plus,
  Send,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  Archive,
  RotateCcw,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  X,
  Printer,
  Download,
  Trash2,
  ExternalLink,
  SlidersHorizontal,
  Award,
} from 'lucide-react';
import {
  ClassFeeData,
  ClassPromotionMapping,
  BatchAnnualPromotionOptions,
  MONTH_NAMES,
  MONTH_NAMES_KH,
} from '../types';

export const StudentAnnualUpgradeView: React.FC = () => {
  const {
    classData,
    classOrder,
    orderedClassList,
    settings,
    updateSettings,
    currentUser,
    permissions,
    t,
    availableAcademicYears,
    activeAcademicYear,
    academicYearArchives,
    switchAcademicYear,
    batchPromoteAcademicYear,
    restoreAcademicYearArchive,
    deleteAcademicYearArchive,
    addAcademicYearOption,
    promotionHistory,
    sendTelegramAlert,
  } = useApp();

  // Active top navigation tab
  const [activeMainTab, setActiveMainTab] = useState<'batch_upgrade' | 'archives' | 'single_class' | 'history'>('batch_upgrade');

  // Academic year selection for promotion
  const currentYear = settings.academicYear || '2026-2027';
  const [sourceYear, setSourceYear] = useState<string>(currentYear);
  const [targetYear, setTargetYear] = useState<string>(() => {
    const parts = currentYear.split('-');
    if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      return `${Number(parts[0]) + 1}-${Number(parts[1]) + 1}`;
    }
    return '2027-2028';
  });

  const [defaultFeeMonth, setDefaultFeeMonth] = useState<string>('October');
  const [keepOldYearArchived, setKeepOldYearArchived] = useState<boolean>(true);
  const [advanceStudentAge, setAdvanceStudentAge] = useState<boolean>(true);
  const [sendTelegram, setSendTelegram] = useState<boolean>(true);

  // Expanded class details in matrix
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  // Student search within matrix
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promotionSummaryResult, setPromotionSummaryResult] = useState<any | null>(null);

  // Custom year input modal
  const [isNewYearInputOpen, setIsNewYearInputOpen] = useState(false);
  const [customNewYearText, setCustomNewYearText] = useState('');

  // Helper function to smartly suggest the next grade level
  const suggestNextGrade = (className: string): { nextName: string; action: 'promote' | 'graduate' } => {
    const trimName = className.trim();

    // Check for Grade 6 graduating
    if (
      trimName.includes('ថ្នាក់ទី ៦') ||
      trimName.includes('ថ្នាក់ទី៦') ||
      trimName.includes('Grade 6') ||
      trimName.startsWith('6') ||
      trimName.includes('កម្រិត ៦')
    ) {
      return { nextName: 'បញ្ចប់ការសិក្សាបឋម (Graduated Elementary)', action: 'graduate' };
    }

    // Kindergarten / Preschool to Grade 1
    if (
      trimName.includes('មត្តេយ្យ') ||
      trimName.toLowerCase().includes('kindergarten') ||
      trimName.toLowerCase().includes('preschool')
    ) {
      return { nextName: 'ថ្នាក់ទី ១A (Grade 1A)', action: 'promote' };
    }

    // Grade 1 -> Grade 2
    if (trimName.includes('ថ្នាក់ទី ១') || trimName.includes('ថ្នាក់ទី១') || trimName.startsWith('1')) {
      const suffix = trimName.replace(/ថ្នាក់ទី\s*១/g, '').replace(/1/g, '').trim();
      return { nextName: `ថ្នាក់ទី ២${suffix ? ' ' + suffix : 'A'}`, action: 'promote' };
    }

    // Grade 2 -> Grade 3
    if (trimName.includes('ថ្នាក់ទី ២') || trimName.includes('ថ្នាក់ទី២') || trimName.startsWith('2')) {
      const suffix = trimName.replace(/ថ្នាក់ទី\s*២/g, '').replace(/2/g, '').trim();
      return { nextName: `ថ្នាក់ទី ៣${suffix ? ' ' + suffix : 'A'}`, action: 'promote' };
    }

    // Grade 3 -> Grade 4
    if (trimName.includes('ថ្នាក់ទី ៣') || trimName.includes('ថ្នាក់ទី៣') || trimName.startsWith('3')) {
      const suffix = trimName.replace(/ថ្នាក់ទី\s*៣/g, '').replace(/3/g, '').trim();
      return { nextName: `ថ្នាក់ទី ៤${suffix ? ' ' + suffix : 'A'}`, action: 'promote' };
    }

    // Grade 4 -> Grade 5
    if (trimName.includes('ថ្នាក់ទី ៤') || trimName.includes('ថ្នាក់ទី៤') || trimName.startsWith('4')) {
      const suffix = trimName.replace(/ថ្នាក់ទី\s*៤/g, '').replace(/4/g, '').trim();
      return { nextName: `ថ្នាក់ទី ៥${suffix ? ' ' + suffix : 'A'}`, action: 'promote' };
    }

    // Grade 5 -> Grade 6
    if (trimName.includes('ថ្នាក់ទី ៥') || trimName.includes('ថ្នាក់ទី៥') || trimName.startsWith('5')) {
      const suffix = trimName.replace(/ថ្នាក់ទី\s*៥/g, '').replace(/5/g, '').trim();
      return { nextName: `ថ្នាក់ទី ៦${suffix ? ' ' + suffix : 'A'}`, action: 'promote' };
    }

    // Default numeric increment if contains numbers
    const numMatch = trimName.match(/\d+/);
    if (numMatch) {
      const num = parseInt(numMatch[0], 10);
      const nextNum = num + 1;
      return { nextName: trimName.replace(numMatch[0], nextNum.toString()), action: 'promote' };
    }

    return { nextName: `${trimName} (ឆ្នាំថ្មី)`, action: 'promote' };
  };

  // State for class promotion mappings
  const [classMappings, setClassMappings] = useState<ClassPromotionMapping[]>([]);

  // Initialize or recompute classMappings whenever classData or sourceYear changes
  useEffect(() => {
    const initialMappings: ClassPromotionMapping[] = orderedClassList.map((cls) => {
      const suggestion = suggestNextGrade(cls.className);
      const allStudentIds = cls.students.map((s) => s.id);
      // Auto-exclude students who have "stop" in feesGroup
      const excludedIds = cls.students
        .filter((s) => s.feesGroup.toLowerCase().includes('stop'))
        .map((s) => s.id);
      const selectedIds = allStudentIds.filter((id) => !excludedIds.includes(id));

      return {
        sourceClassId: cls.classId,
        sourceClassName: cls.className,
        targetClassId: suggestion.action === 'graduate' ? 'GRADUATED' : `cls_${suggestion.nextName.replace(/\s+/g, '_')}`,
        targetClassName: suggestion.nextName,
        action: suggestion.action,
        selectedStudentIds: selectedIds,
        excludedStudentIds: excludedIds,
        studentCount: cls.students.length,
      };
    });

    setClassMappings(initialMappings);
  }, [orderedClassList, sourceYear]);

  // Update a single class mapping row
  const updateMappingRow = (
    sourceId: string,
    updates: Partial<ClassPromotionMapping>
  ) => {
    setClassMappings((prev) =>
      prev.map((m) => (m.sourceClassId === sourceId ? { ...m, ...updates } : m))
    );
  };

  // Toggle student exclusion for a class
  const toggleStudentExclusion = (sourceClassId: string, studentId: number) => {
    setClassMappings((prev) =>
      prev.map((m) => {
        if (m.sourceClassId !== sourceClassId) return m;
        const isCurrentlyExcluded = m.excludedStudentIds.includes(studentId);
        const newExcluded = isCurrentlyExcluded
          ? m.excludedStudentIds.filter((id) => id !== studentId)
          : [...m.excludedStudentIds, studentId];
        const newSelected = m.selectedStudentIds.includes(studentId) && !isCurrentlyExcluded
          ? m.selectedStudentIds.filter((id) => id !== studentId)
          : isCurrentlyExcluded
          ? [...m.selectedStudentIds, studentId]
          : m.selectedStudentIds;

        return {
          ...m,
          excludedStudentIds: newExcluded,
          selectedStudentIds: newSelected,
        };
      })
    );
  };

  // Summary statistics
  const totalSourceStudents = useMemo(() => {
    return classMappings.reduce((sum, m) => sum + m.studentCount, 0);
  }, [classMappings]);

  const totalPromotingStudents = useMemo(() => {
    return classMappings
      .filter((m) => m.action === 'promote' || m.action === 'custom')
      .reduce((sum, m) => sum + m.selectedStudentIds.length, 0);
  }, [classMappings]);

  const totalGraduatingStudents = useMemo(() => {
    return classMappings
      .filter((m) => m.action === 'graduate')
      .reduce((sum, m) => sum + m.selectedStudentIds.length, 0);
  }, [classMappings]);

  const totalExcludedStudents = useMemo(() => {
    return classMappings.reduce((sum, m) => sum + m.excludedStudentIds.length, 0);
  }, [classMappings]);

  // Handle Execute Annual Upgrade
  const handleExecutePromotion = async () => {
    if (!permissions.canEdit) {
      alert(t('អ្នកគ្មានសិទ្ធិឡើងថ្នាក់សិស្សទេ!', 'Permission Denied: Cannot promote students.'));
      return;
    }

    if (totalPromotingStudents === 0 && totalGraduatingStudents === 0) {
      alert(t('សូមជ្រើសរើសសិស្សយ៉ាងហោចណាស់ម្នាក់ដើម្បីឡើងថ្នាក់!', 'Please select at least one student to promote!'));
      return;
    }

    setIsSubmitting(true);
    try {
      const options: BatchAnnualPromotionOptions = {
        sourceAcademicYear: sourceYear,
        targetAcademicYear: targetYear,
        mappings: classMappings,
        keepOldYearArchived,
        defaultFeeMonth,
        advanceStudentAge,
        sendTelegramAlert: sendTelegram,
      };

      const result = await batchPromoteAcademicYear(options);
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
      setPromotionSummaryResult(result);
    } catch (err: any) {
      alert('Error during annual promotion: ' + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Academic Year Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-xs font-bold shrink-0">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-700 font-khmer flex items-center gap-2">
                <span>ប្រព័ន្ធឡើងថ្នាក់សិស្សប្រចាំឆ្នាំ · Annual Grade Promotion</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  ទិន្នន័យដាច់ដោយឡែក ១០០%
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-khmer">
                {t('ការឡើងថ្នាក់សិស្សប្រចាំឆ្នាំ (Annual Student Grade Upgrade)', 'Annual Student Grade Promotion')}
              </h2>
              <div className="text-xs text-slate-500 font-khmer">
                ផ្ទេរឈ្មោះសិស្សឡើងថ្នាក់ស្វ័យប្រវត្តពីឆ្នាំចាស់ទៅឆ្នាំថ្មី ដោយពុំបាច់វាយបញ្ចូលទិន្នន័យម្តងទៀតឡើយ
              </div>
            </div>
          </div>

          {/* Academic Year Quick Switcher Pill */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-khmer">
              <span className="text-slate-500">ឆ្នាំសិក្សាសកម្ម៖</span>
              <span className="font-mono font-extrabold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                {settings.academicYear || '2026-2027'}
              </span>
            </div>

            <button
              onClick={() => setActiveMainTab('archives')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold font-khmer transition-all cursor-pointer"
            >
              <Archive className="w-4 h-4 text-slate-600" />
              <span>មើលទិន្នន័យឆ្នាំចាស់ ({Object.keys(academicYearArchives).length})</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 gap-1 sm:gap-2 text-xs font-khmer overflow-x-auto no-scrollbar pt-2">
          <button
            onClick={() => setActiveMainTab('batch_upgrade')}
            className={`py-2.5 px-4 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeMainTab === 'batch_upgrade'
                ? 'border-amber-500 text-amber-950 bg-amber-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>ឡើងថ្នាក់ទូទាំងសាលា (Annual School-Wide)</span>
          </button>

          <button
            onClick={() => setActiveMainTab('archives')}
            className={`py-2.5 px-4 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeMainTab === 'archives'
                ? 'border-amber-500 text-amber-950 bg-amber-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Archive className="w-4 h-4 text-amber-600" />
            <span>ប័ណ្ណសារឆ្នាំសិក្សា (Year Archives)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono">
              {Object.keys(academicYearArchives).length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('single_class')}
            className={`py-2.5 px-4 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeMainTab === 'single_class'
                ? 'border-amber-500 text-amber-950 bg-amber-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-600" />
            <span>ឡើងថ្នាក់មួយថ្នាក់ៗ (Single Class)</span>
          </button>

          <button
            onClick={() => setActiveMainTab('history')}
            className={`py-2.5 px-4 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeMainTab === 'history'
                ? 'border-amber-500 text-amber-950 bg-amber-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>ប្រវត្តិឡើងថ្នាក់ & សិស្សបញ្ចប់ (History)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono">
              {promotionHistory.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2. SUCCESS PROMOTION BANNER */}
      {promotionSummaryResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-900 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="font-extrabold text-base font-khmer">
                  បានឡើងថ្នាក់សិស្សជោគជ័យ! ({promotionSummaryResult.sourceYear} ➔ {promotionSummaryResult.targetYear})
                </h3>
                <p className="text-xs text-emerald-700 font-khmer">
                  ទិន្នន័យឆ្នាំសិក្សាថ្មីត្រូវបានបង្កើតរួចរាល់ ហើយទិន្នន័យឆ្នាំចាស់ត្រូវបានរក្សាទុកដាច់ដោយឡែក ១០០%។
                </p>
              </div>
            </div>
            <button
              onClick={() => setPromotionSummaryResult(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-khmer pt-2 border-t border-emerald-200/80">
            <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
              <div className="text-slate-500 text-[11px]">សិស្សឡើងថ្នាក់សរុប</div>
              <div className="font-extrabold text-lg text-emerald-700 font-mono">
                {promotionSummaryResult.totalPromotedStudents} នាក់
              </div>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
              <div className="text-slate-500 text-[11px]">សិស្សបញ្ចប់ការសិក្សា</div>
              <div className="font-extrabold text-lg text-indigo-700 font-mono">
                {promotionSummaryResult.totalGraduatedStudents} នាក់
              </div>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
              <div className="text-slate-500 text-[11px]">ថ្នាក់ថ្មីដែលបានបង្កើត</div>
              <div className="font-extrabold text-lg text-amber-700 font-mono">
                {promotionSummaryResult.classesCreatedCount} ថ្នាក់
              </div>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
              <div className="text-slate-500 text-[11px]">ឆ្នាំសិក្សាថ្មីសកម្ម</div>
              <div className="font-extrabold text-lg text-slate-900 font-mono">
                {promotionSummaryResult.targetYear}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB 1: SCHOOL-WIDE ANNUAL UPGRADE (MAIN FEATURE) */}
      {activeMainTab === 'batch_upgrade' && (
        <div className="space-y-6">
          {/* Step 1: Academic Year & Global Promotion Parameters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-xs">
                  ១
                </span>
                <h3 className="font-bold text-slate-900 text-sm font-khmer">
                  ជ្រើសរើសឆ្នាំសិក្សា (Academic Year Configuration)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-khmer">ជំហានទី ១</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-khmer">
              {/* Source Year */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>ឆ្នាំសិក្សាប្រភព (Source Year - ឆ្នាំចាស់)</span>
                </label>
                <select
                  value={sourceYear}
                  onChange={(e) => setSourceYear(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  {availableAcademicYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr} {yr === settings.academicYear ? '(បច្ចុប្បន្ន)' : ''}
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-500">
                  សិស្សថ្នាក់ទី១, ទី២, ទី៣... ក្នុងឆ្នាំនេះ នឹងត្រូវផ្ទេរទៅឆ្នាំថ្មី
                </div>
              </div>

              {/* Target Year */}
              <div className="space-y-1.5">
                <label className="block text-indigo-900 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span>ឆ្នាំសិក្សាគោលដៅ (Target Year - ឆ្នាំថ្មី) *</span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={targetYear}
                    onChange={(e) => {
                      if (e.target.value === 'ADD_NEW') {
                        setIsNewYearInputOpen(true);
                      } else {
                        setTargetYear(e.target.value);
                      }
                    }}
                    className="flex-1 p-2.5 bg-indigo-50/50 border border-indigo-300 rounded-xl font-mono font-bold text-xs text-indigo-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {availableAcademicYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                    <option value="ADD_NEW">+ បន្ថែមឆ្នាំសិក្សាថ្មី...</option>
                  </select>
                </div>
                <div className="text-[11px] text-indigo-700 font-medium">
                  សិស្សនឹងត្រូវឡើងថ្នាក់មួយកម្រិតក្នុងឆ្នាំនេះ
                </div>
              </div>

              {/* Starting Fee Month */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>ខែទូទាត់ចាប់ផ្តើម (Starting Fee Month)</span>
                </label>
                <select
                  value={defaultFeeMonth}
                  onChange={(e) => setDefaultFeeMonth(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-khmer font-bold text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  {MONTH_NAMES.map((m) => (
                    <option key={m} value={m}>
                      {MONTH_NAMES_KH[m] || m} ({m})
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-500">
                  សៀវភៅបង់ប្រាក់សិស្សសម្រាប់ឆ្នាំថ្មី នឹងចាប់ផ្តើមពីខែនេះ
                </div>
              </div>
            </div>

            {/* Crucial Note Card: Isolation Guarantee */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50/80 via-emerald-50/40 to-indigo-50/50 border border-amber-200/80 text-xs font-khmer space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>ការធានារក្សាទុកទិន្នន័យដាច់ដោយឡែកពីគ្នា ១០០% (Data Isolation Guarantee)</span>
              </div>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                រាល់ទិន្នន័យសិស្ស ការបង់ប្រាក់ វត្តមាន និងបញ្ជីនាមសិស្សក្នុងឆ្នាំចាស់ ({sourceYear}) នឹងត្រូវបានចាក់សោរ និងរក្សាទុកជាប័ណ្ណសារប្រវត្តិដាច់ដោយឡែក។
                អ្នករៀបចំអាចប្តូរត្រឡប់មកមើលទិន្នន័យឆ្នាំចាស់ ឬបោះពុម្ពបញ្ជីនាមសិស្សឆ្នាំចាស់បានគ្រប់ពេលវេលា។
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={keepOldYearArchived}
                    onChange={(e) => setKeepOldYearArchived(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <span>រក្សាទុកទិន្នន័យឆ្នាំចាស់ ({sourceYear}) ជាប័ណ្ណសារដាច់ដោយឡែក (ណែនាំ)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={sendTelegram}
                    onChange={(e) => setSendTelegram(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                  />
                  <span className="flex items-center gap-1">
                    <Send className="w-3.5 h-3.5 text-sky-600" />
                    <span>ផ្ញើរបាយការណ៍សង្ខេបទៅកាន់ Telegram ស្វ័យប្រវត្ត</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Step 2: Grade Promotion Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs">
                  ២
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-khmer">
                    ផ្ទៀងផ្ទាត់ និងកែសម្រួលគម្រោងឡើងថ្នាក់ (Grade Promotion Matrix)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-khmer">
                    ប្រព័ន្ធបានផ្គូផ្គងថ្នាក់ចាស់ ➔ ថ្នាក់ថ្មីដោយស្វ័យប្រវត្ត។ លោកអ្នកអាចកែឈ្មោះថ្នាក់ ឬជ្រើសរើសសិស្សជាក់លាក់បាន។
                  </p>
                </div>
              </div>

              {/* Statistics Pill */}
              <div className="flex items-center gap-2 flex-wrap text-xs font-khmer">
                <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold">
                  សរុប៖ {totalSourceStudents} សិស្ស
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                  ឡើងថ្នាក់៖ {totalPromotingStudents} នាក់
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-800 font-bold">
                  បញ្ចប់៖ {totalGraduatingStudents} នាក់
                </span>
                {totalExcludedStudents > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-bold">
                    លើកលែង/ត្រួត៖ {totalExcludedStudents} នាក់
                  </span>
                )}
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full border-collapse text-xs font-khmer text-slate-900">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-center font-bold">
                    <th className="py-2.5 px-3 text-left w-12">#</th>
                    <th className="py-2.5 px-3 text-left min-w-[160px]">ថ្នាក់ចាស់ ({sourceYear})</th>
                    <th className="py-2.5 px-3 text-center w-24">ចំនួនសិស្ស</th>
                    <th className="py-2.5 px-2 text-center w-12"></th>
                    <th className="py-2.5 px-3 text-left w-36">សកម្មភាព</th>
                    <th className="py-2.5 px-3 text-left min-w-[200px]">ថ្នាក់ថ្មី ({targetYear})</th>
                    <th className="py-2.5 px-3 text-center w-32">សិស្សត្រូវឡើង</th>
                    <th className="py-2.5 px-3 text-center w-28">ពិនិត្យសិស្ស</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classMappings.map((row, idx) => {
                    const isExpanded = expandedClassId === row.sourceClassId;
                    const sourceClassObj = classData[row.sourceClassId];
                    const isGraduating = row.action === 'graduate';

                    return (
                      <React.Fragment key={row.sourceClassId}>
                        <tr className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>

                          {/* Source Class */}
                          <td className="py-3 px-3 text-left">
                            <div className="font-bold text-slate-900 text-xs">
                              {row.sourceClassName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {row.sourceClassId}
                            </div>
                          </td>

                          {/* Student Count */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                            {row.studentCount} នាក់
                          </td>

                          {/* Arrow */}
                          <td className="py-3 px-2 text-center text-slate-400">
                            <ArrowRight className="w-4 h-4 mx-auto text-amber-600" />
                          </td>

                          {/* Action Selector */}
                          <td className="py-3 px-3">
                            <select
                              value={row.action}
                              onChange={(e) => {
                                const newAction = e.target.value as any;
                                let newTarget = row.targetClassName;
                                if (newAction === 'graduate') {
                                  newTarget = 'បញ្ចប់ការសិក្សា (Graduated)';
                                } else if (row.action === 'graduate' && newAction === 'promote') {
                                  newTarget = suggestNextGrade(row.sourceClassName).nextName;
                                }
                                updateMappingRow(row.sourceClassId, {
                                  action: newAction,
                                  targetClassName: newTarget,
                                });
                              }}
                              className={`w-full p-1.5 rounded-lg border font-bold text-xs ${
                                isGraduating
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                                  : 'bg-white border-slate-200 text-slate-800'
                              }`}
                            >
                              <option value="promote">➔ ឡើងថ្នាក់ (Promote)</option>
                              <option value="graduate">🎓 បញ្ចប់ការសិក្សា (Graduate)</option>
                              <option value="retain">⏸ ត្រួតថ្នាក់ (Retain in Grade)</option>
                            </select>
                          </td>

                          {/* Target Class Name Input */}
                          <td className="py-3 px-3">
                            {isGraduating ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 text-indigo-900 rounded-lg font-bold border border-indigo-200">
                                <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span>បញ្ចប់ការសិក្សាបឋម (Alumni)</span>
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={row.targetClassName}
                                onChange={(e) =>
                                  updateMappingRow(row.sourceClassId, {
                                    targetClassName: e.target.value,
                                  })
                                }
                                placeholder="ឧ. ថ្នាក់ទី ២A"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            )}
                          </td>

                          {/* Count to Promote */}
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {row.selectedStudentIds.length} / {row.studentCount}
                            </span>
                          </td>

                          {/* Expand to inspect individual students */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedClassId(isExpanded ? null : row.sourceClassId)
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 mx-auto cursor-pointer ${
                                isExpanded
                                  ? 'bg-slate-800 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <span>{isExpanded ? 'បិទ' : 'សិស្ស'}</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          </td>
                        </tr>

                        {/* Expandable student exclusion panel */}
                        {isExpanded && sourceClassObj && (
                          <tr className="bg-slate-50/70 border-b border-slate-200">
                            <td colSpan={8} className="p-4 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="font-bold text-slate-800 flex items-center gap-2">
                                  <span>បញ្ជីសិស្សក្នុងថ្នាក់ {row.sourceClassName}</span>
                                  <span className="text-[11px] text-slate-500 font-normal">
                                    (ដោះធីកលើសិស្សណាដែលត្រួតថ្នាក់ ឬឈប់រៀន)
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const allIds = sourceClassObj.students.map((s) => s.id);
                                      updateMappingRow(row.sourceClassId, {
                                        selectedStudentIds: allIds,
                                        excludedStudentIds: [],
                                      });
                                    }}
                                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-indigo-700"
                                  >
                                    រើសឡើងថ្នាក់ទាំងអស់
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
                                {sourceClassObj.students.map((st) => {
                                  const isSelected = row.selectedStudentIds.includes(st.id);
                                  const isStopped = st.feesGroup.toLowerCase().includes('stop');

                                  return (
                                    <label
                                      key={st.id}
                                      className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-white border-emerald-300 text-slate-900 shadow-2xs'
                                          : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() =>
                                            toggleStudentExclusion(row.sourceClassId, st.id)
                                          }
                                          className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                        />
                                        <span className="font-bold text-xs truncate">
                                          {st.name}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                                        <span className={st.gender === 'Female' ? 'text-pink-600' : 'text-blue-600'}>
                                          {st.gender === 'Female' ? 'F' : 'M'}
                                        </span>
                                        {isStopped && (
                                          <span className="px-1 py-0.2 rounded bg-rose-100 text-rose-700 font-bold">
                                            ឈប់
                                          </span>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Execute Promotion Trigger Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>រួចរាល់សម្រាប់ការឡើងថ្នាក់ឆ្នាំសិក្សាថ្មី</span>
                </div>
                <div className="text-xs text-slate-300 font-khmer">
                  សិស្សសរុប <strong className="text-white font-mono text-sm">{totalPromotingStudents}</strong> នាក់ នឹងត្រូវផ្ទេរឈ្មោះឡើងថ្នាក់ទៅឆ្នាំសិក្សា <strong className="text-amber-400 font-mono text-sm">{targetYear}</strong>។
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(true)}
                disabled={totalPromotingStudents === 0 && totalGraduatingStudents === 0}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl font-khmer text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <GraduationCap className="w-5 h-5 text-slate-950" />
                <span>ដំណើរការឡើងថ្នាក់ទូទាំងសាលា</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: ACADEMIC YEAR ARCHIVES (VIEW PAST/ISOLATED YEARS) */}
      {activeMainTab === 'archives' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm font-khmer flex items-center gap-2">
                  <Archive className="w-5 h-5 text-amber-600" />
                  <span>ប័ណ្ណសារឆ្នាំសិក្សា (Academic Year Archives & Isolated Data)</span>
                </h3>
                <p className="text-xs text-slate-500 font-khmer mt-0.5">
                  ទិន្នន័យនៃឆ្នាំសិក្សានីមួយៗត្រូវបានរក្សាទុកដាច់ដោយឡែកពីគ្នា ១០០%។ លោកអ្នកអាចប្តូរទៅមើល ឬទាញយករបាយការណ៍ឆ្នាំចាស់បានគ្រប់ពេល។
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewYearInputOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold font-khmer transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>បន្ថែមឆ្នាំសិក្សា</span>
              </button>
            </div>

            {/* List of Archives & Active Year */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Active Current Academic Year Card */}
              <div className="p-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50/30 space-y-3 relative shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white font-khmer flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>ឆ្នាំសិក្សាកំពុងប្រើប្រាស់ (Active)</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-800">
                    {settings.academicYear || '2026-2027'}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-slate-900 font-mono">
                    Academic Year {settings.academicYear || '2026-2027'}
                  </h4>
                  <div className="text-xs text-slate-600 font-khmer mt-1">
                    ចំនួនថ្នាក់៖ <strong>{orderedClassList.length} ថ្នាក់</strong> · សិស្សសរុប៖ <strong>{orderedClassList.reduce((s, c) => s + c.students.length, 0)} នាក់</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs font-khmer">
                  <span className="text-emerald-700 font-bold text-[11px]">
                    ទិន្នន័យបច្ចុប្បន្នកំពុងដំណើរការ
                  </span>
                </div>
              </div>

              {/* Archived Past Academic Years */}
              {Object.entries(academicYearArchives).map(([archYear, archive]) => {
                const isActive = (settings.academicYear || '2026-2027') === archYear;

                return (
                  <div
                    key={archYear}
                    className={`p-4 rounded-2xl border space-y-3 transition-all ${
                      isActive
                        ? 'border-indigo-400 bg-indigo-50/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-khmer">
                        ប័ណ្ណសារឆ្នាំចាស់ (Archived)
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {archYear}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-base text-slate-900 font-mono">
                        Academic Year {archYear}
                      </h4>
                      <div className="text-xs text-slate-600 font-khmer mt-1">
                        ចំនួនថ្នាក់៖ <strong>{archive.totalClasses} ថ្នាក់</strong> · សិស្សសរុប៖ <strong>{archive.totalStudents} នាក់</strong>
                      </div>
                      <div className="text-[10px] text-slate-400 font-khmer mt-0.5">
                        រក្សាទុកដោយ៖ {archive.archivedBy} · {new Date(archive.archivedDate).toLocaleDateString('km-KH')}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-khmer">
                      <button
                        type="button"
                        onClick={() => switchAcademicYear(archYear)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                        <span>ប្តូរទៅមើលឆ្នាំនេះ</span>
                      </button>

                      {!isActive && permissions.canDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`តើអ្នកពិតជាចង់លុបប័ណ្ណសារឆ្នាំ ${archYear} មែនទេ?`)) {
                              deleteAcademicYearArchive(archYear);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="លុបប័ណ្ណសារ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: SINGLE CLASS PROMOTION (CONVENIENT FINE-GRAINED UPGRADE) */}
      {activeMainTab === 'single_class' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm font-khmer flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>ឡើងថ្នាក់មួយថ្នាក់ៗ (Single Class Promotion)</span>
            </h3>
            <p className="text-xs text-slate-500 font-khmer mt-0.5">
              សម្រាប់គ្រូបង្រៀន ឬអ្នកគ្រប់គ្រងដែលចង់ផ្ទេរ ឬឡើងថ្នាក់សិស្សម្តងមួយថ្នាក់ ឬសិស្សមួយចំនួនជាក់លាក់។
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-khmer">
            <p className="text-slate-700">
              សូមប្រើប្រាស់មុខងារឡើងថ្នាក់ទូទាំងសាលា (School-Wide Upgrade) ខាងលើសម្រាប់ឡើងថ្នាក់ទាំងអស់ក្នុងពេលតែមួយ ឬជ្រើសរើសថ្នាក់ដែលលោកអ្នកចង់ឡើងខាងក្រោម៖
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              {orderedClassList.map((cls) => (
                <div
                  key={cls.classId}
                  className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{cls.className}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{cls.students.length} សិស្ស</div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveMainTab('batch_upgrade');
                      setExpandedClassId(cls.classId);
                    }}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold font-khmer cursor-pointer"
                  >
                    ឡើងថ្នាក់ ➔
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: PROMOTION AUDIT HISTORY & GRADUATES */}
      {activeMainTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm font-khmer flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>កំណត់ត្រាប្រវត្តិឡើងថ្នាក់សិស្ស (Promotion & Graduation Audit Trail)</span>
              </h3>
              <p className="text-xs text-slate-500 font-khmer mt-0.5">
                កត់ត្រារាល់សកម្មភាពឡើងថ្នាក់សិស្សទាំងអស់ ឈ្មោះអ្នករៀបចំ និងកាលបរិច្ឆេទ។
              </p>
            </div>

            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              {promotionHistory.length} កំណត់ត្រា
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full border-collapse text-xs font-khmer text-slate-900">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-center font-bold">
                  <th className="py-2.5 px-3 text-left w-12">#</th>
                  <th className="py-2.5 px-3 text-left min-w-[140px]">ឈ្មោះសិស្ស</th>
                  <th className="py-2.5 px-3 text-center font-mono w-28">អត្តលេខ</th>
                  <th className="py-2.5 px-3 text-left min-w-[120px]">ថ្នាក់ដើម</th>
                  <th className="py-2.5 px-2 text-center w-8"></th>
                  <th className="py-2.5 px-3 text-left min-w-[140px]">ថ្នាក់ថ្មី</th>
                  <th className="py-2.5 px-3 text-center font-mono w-28">ឆ្នាំសិក្សា</th>
                  <th className="py-2.5 px-3 text-center font-mono w-28">កាលបរិច្ឆេទ</th>
                  <th className="py-2.5 px-3 text-left w-32">អ្នកអនុវត្ត</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promotionHistory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-khmer">
                      មិនទាន់មានកំណត់ត្រាឡើងថ្នាក់នៅឡើយទេ
                    </td>
                  </tr>
                ) : (
                  promotionHistory.map((rec, i) => (
                    <tr key={rec.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{i + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-950 text-left">{rec.studentName}</td>
                      <td className="py-2.5 px-3 font-mono text-center text-slate-600">{rec.studentCode}</td>
                      <td className="py-2.5 px-3 text-left text-slate-700">{rec.fromClassName}</td>
                      <td className="py-2.5 px-2 text-center text-amber-600">➔</td>
                      <td className="py-2.5 px-3 text-left font-bold text-indigo-950">
                        {rec.toClassName.includes('បញ្ចប់') ? (
                          <span className="text-emerald-700">{rec.toClassName}</span>
                        ) : (
                          rec.toClassName
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">{rec.academicYear || settings.academicYear}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">{rec.promotedDate}</td>
                      <td className="py-2.5 px-3 text-left text-slate-600">{rec.promotedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. CONFIRMATION MODAL BEFORE ANNUAL UPGRADE */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-xs my-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold">
                  <GraduationCap className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base font-khmer">
                    បញ្ជាក់ការឡើងថ្នាក់សិស្សប្រចាំឆ្នាំ
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {sourceYear} ➔ {targetYear}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-slate-800 font-khmer space-y-2 text-xs">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>សូមពិនិត្យសេចក្តីសង្ខេបមុនពេលអនុវត្ត៖</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700">
                <li>
                  សិស្សឡើងថ្នាក់៖ <strong className="font-mono text-slate-950">{totalPromotingStudents}</strong> នាក់
                </li>
                <li>
                  សិស្សបញ្ចប់ការសិក្សា៖ <strong className="font-mono text-indigo-700">{totalGraduatingStudents}</strong> នាក់
                </li>
                <li>
                  ឆ្នាំសិក្សាថ្មី៖ <strong className="font-mono text-slate-950">{targetYear}</strong> (ខែទូទាត់ចាប់ផ្តើម៖ {defaultFeeMonth})
                </li>
                <li className="text-emerald-700 font-bold">
                  ទិន្នន័យឆ្នាំចាស់ ({sourceYear}) ត្រូវបានចម្លងទុកជាប័ណ្ណសារដាច់ដោយឡែក ១០០%។
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl font-khmer cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleExecutePromotion}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl font-khmer flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>បញ្ជាក់ និងឡើងថ្នាក់ឥឡូវនេះ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: ADD CUSTOM ACADEMIC YEAR */}
      {isNewYearInputOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm font-khmer">
              បញ្ចូលឆ្នាំសិក្សាថ្មី (Add Academic Year)
            </h3>
            <input
              type="text"
              placeholder="ឧទាហរណ៍៖ 2027-2028 ឬ 2028-2029"
              value={customNewYearText}
              onChange={(e) => setCustomNewYearText(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewYearInputOpen(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-khmer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={() => {
                  if (customNewYearText.trim()) {
                    addAcademicYearOption(customNewYearText.trim());
                    setTargetYear(customNewYearText.trim());
                    setIsNewYearInputOpen(false);
                    setCustomNewYearText('');
                  }
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold font-khmer"
              >
                បន្ថែម
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
