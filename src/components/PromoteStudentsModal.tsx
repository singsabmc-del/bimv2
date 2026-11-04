import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  X,
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
} from 'lucide-react';
import { MONTH_NAMES } from '../types';

interface PromoteStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSourceClassId?: string;
  preselectedStudentIds?: number[];
}

export const PromoteStudentsModal: React.FC<PromoteStudentsModalProps> = ({
  isOpen,
  onClose,
  defaultSourceClassId,
  preselectedStudentIds,
}) => {
  const {
    classData,
    selectedClassId,
    promoteStudents,
    addClass,
    globalMonth,
    globalYear,
    permissions,
    sendTelegramAlert,
    currentUser,
    settings,
    getBranchName,
    t,
  } = useApp();

  const [sourceClassId, setSourceClassId] = useState<string>(
    defaultSourceClassId || selectedClassId || Object.keys(classData)[0] || '1A'
  );

  useEffect(() => {
    if (defaultSourceClassId && classData[defaultSourceClassId]) {
      setSourceClassId(defaultSourceClassId);
    } else if (selectedClassId && classData[selectedClassId]) {
      setSourceClassId(selectedClassId);
    }
  }, [defaultSourceClassId, selectedClassId, classData]);

  const sourceClass = classData[sourceClassId] || Object.values(classData)[0];

  // Target class state
  const availableTargetClasses = useMemo(() => {
    return Object.values(classData).filter((cls) => cls.classId !== sourceClassId);
  }, [classData, sourceClassId]);

  const [targetClassChoice, setTargetClassChoice] = useState<string>(() => {
    return availableTargetClasses[0]?.classId || 'NEW_CLASS';
  });

  const [newClassName, setNewClassName] = useState('');
  const [newClassPeriod, setNewClassPeriod] = useState(`01.10.${globalYear} _ 31.10.${globalYear}`);

  // When source class changes, adjust target class choice if needed
  useEffect(() => {
    if (targetClassChoice === sourceClassId) {
      const fallback = Object.values(classData).find((c) => c.classId !== sourceClassId);
      setTargetClassChoice(fallback ? fallback.classId : 'NEW_CLASS');
    }
  }, [sourceClassId, classData, targetClassChoice]);

  // Selection mode: 'all' (Promote entire class) vs 'custom' (Select specific students)
  const [selectionMode, setSelectionMode] = useState<'all' | 'custom'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [excludeStopped, setExcludeStopped] = useState(true);

  // Initialize selectedStudentIds when source class changes or modal opens
  useEffect(() => {
    if (!sourceClass) return;
    if (preselectedStudentIds && preselectedStudentIds.length > 0) {
      setSelectedStudentIds(preselectedStudentIds);
      setSelectionMode('custom');
    } else {
      const validStudents = excludeStopped
        ? sourceClass.students.filter((s) => !s.feesGroup.toLowerCase().includes('stop')).map((s) => s.id)
        : sourceClass.students.map((s) => s.id);
      setSelectedStudentIds(validStudents);
    }
  }, [sourceClassId, excludeStopped, isOpen, preselectedStudentIds]);

  // Options
  const [removeFromOldClass, setRemoveFromOldClass] = useState(true);
  const [carryOverPrepaid, setCarryOverPrepaid] = useState(true);
  const [newFeeGroup, setNewFeeGroup] = useState(globalMonth);
  const [sendTelegram, setSendTelegram] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentStudents = sourceClass?.students || [];

  const eligibleStudents = currentStudents.filter((s) => {
    if (excludeStopped && s.feesGroup.toLowerCase().includes('stop')) return false;
    if (studentSearch.trim()) {
      const query = studentSearch.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(query) ||
        (s.latinName && s.latinName.toLowerCase().includes(query)) ||
        s.studentCode.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleToggleStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allEligibleIds = eligibleStudents.map((s) => s.id);
    setSelectedStudentIds(allEligibleIds);
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds([]);
  };

  const studentsToPromote = currentStudents.filter((s) => selectedStudentIds.includes(s.id));
  const maleCount = studentsToPromote.filter((s) => s.gender === 'Man').length;
  const femaleCount = studentsToPromote.filter((s) => s.gender === 'Female').length;

  const handleConfirmPromotion = async () => {
    if (!permissions.canEdit) {
      alert(t('អ្នកគ្មានសិទ្ធិឡើងថ្នាក់សិស្សទេ!', 'Permission Denied: Cannot promote students.'));
      return;
    }

    if (selectedStudentIds.length === 0) {
      alert(t('សូមជ្រើសរើសសិស្សយ៉ាងហោចណាស់ម្នាក់ដើម្បីឡើងថ្នាក់!', 'Please select at least one student to promote.'));
      return;
    }

    let finalTargetId = targetClassChoice;
    let finalTargetName = '';

    if (targetClassChoice === 'NEW_CLASS') {
      if (!newClassName.trim()) {
        alert(t('សូមបញ្ចូលឈ្មោះថ្នាក់ថ្មី!', 'Please enter the new class name!'));
        return;
      }
      finalTargetName = newClassName.trim();
    } else {
      finalTargetName = classData[targetClassChoice]?.className || targetClassChoice;
    }

    setIsSubmitting(true);

    try {
      const res = promoteStudents(sourceClassId, finalTargetId, selectedStudentIds, {
        newFeeGroup,
        carryOverPrepaid,
        removeFromOldClass,
        createNewClassIfNeeded:
          targetClassChoice === 'NEW_CLASS'
            ? { className: newClassName.trim(), period: newClassPeriod.trim() }
            : undefined,
        sendTelegramAlert: sendTelegram,
      });

      if (res.success) {
        if (sendTelegram) {
          sendTelegramAlert(
            'ឡើងថ្នាក់សិស្សជោគជ័យ (Students Promoted)',
            `ថ្នាក់ដើម៖ ${sourceClass.className}\nថ្នាក់ថ្មី៖ ${finalTargetName}\nចំនួនសិស្ស៖ ${res.count} នាក់ (ស្រី: ${femaleCount}, ប្រុស: ${maleCount})\nខែទូទាត់៖ ${newFeeGroup}\nអ្នករៀបចំ៖ ${currentUser.khmerName}`,
            'system'
          );
        }

        setSuccessMessage(
          t(
            `បានឡើងថ្នាក់សិស្សចំនួន ${res.count} នាក់ ពី «${sourceClass.className}» ទៅកាន់ «${finalTargetName}» ដោយជោគជ័យ!`,
            `Successfully promoted ${res.count} students from "${sourceClass.className}" to "${finalTargetName}"!`
          )
        );

        setTimeout(() => {
          setIsSubmitting(false);
          setSuccessMessage(null);
          onClose();
        }, 1200);
      } else {
        alert(res.error || 'Failed to promote students');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      alert('Error promoting students: ' + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-xs my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base font-khmer">
                {t('ឡើងថ្នាក់សិស្សតាមថ្នាក់ (Promote Student by Class)', 'Promote Students by Class')}
              </h3>
              <p className="text-[11px] text-slate-500 font-khmer">
                {t(
                  'ផ្ទេរ និងឡើងកម្រិតថ្នាក់សិស្សសម្រាប់ឆ្នាំសិក្សាថ្មី ឬឆមាសថ្មី',
                  'Transfer and promote students to a higher grade or new academic period'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 font-khmer font-bold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {/* Step 1: Source & Target Class Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            {/* Source Class */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-slate-700 font-khmer flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{t('ថ្នាក់ដើម (Source Class)', 'Source Class')}</span>
              </label>
              <select
                value={sourceClassId}
                onChange={(e) => setSourceClassId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-khmer font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.values(classData).map((cls) => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.className} · [{getBranchName(cls.branchId)}] ({cls.students.length} សិស្ស)
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-slate-500 font-khmer">
                សិស្សសរុប៖ {sourceClass?.students.length || 0} នាក់
              </div>
            </div>

            {/* Target Class */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-indigo-700 font-khmer flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span>{t('ថ្នាក់គោលដៅ (Target Class)', 'Target Class')}</span>
              </label>
              <select
                value={targetClassChoice}
                onChange={(e) => setTargetClassChoice(e.target.value)}
                className="w-full p-2.5 bg-white border border-indigo-300 rounded-xl font-khmer font-bold text-xs text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableTargetClasses.map((cls) => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.className} · [{getBranchName(cls.branchId)}] ({cls.students.length} សិស្ស)
                  </option>
                ))}
                <option value="NEW_CLASS">✨ + បង្កើតថ្នាក់ថ្មី (Create New Class)...</option>
              </select>
              <div className="text-[10px] text-indigo-600 font-khmer">
                {targetClassChoice === 'NEW_CLASS'
                  ? 'នឹងបង្កើតថ្នាក់ថ្មីដោយស្វ័យប្រវត្ត'
                  : `សិស្សនឹងត្រូវបញ្ចូលទៅ ${classData[targetClassChoice]?.className}`}
              </div>
            </div>
          </div>

          {/* New Class Inline Inputs (When NEW_CLASS is selected) */}
          {targetClassChoice === 'NEW_CLASS' && (
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in text-left">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-indigo-900 font-khmer">
                  {t('ឈ្មោះថ្នាក់ថ្មី', 'New Class Name')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧទាហរណ៍៖ ថ្នាក់ទី ២A (Grade 2A)"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full p-2 bg-white border border-indigo-300 rounded-lg text-xs font-khmer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-indigo-900 font-khmer">
                  {t('កាលបរិច្ឆេទថ្នាក់ថ្មី (Period)', 'Period')}
                </label>
                <input
                  type="text"
                  value={newClassPeriod}
                  onChange={(e) => setNewClassPeriod(e.target.value)}
                  className="w-full p-2 bg-white border border-indigo-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Step 2: Student Selection Mode */}
          <div className="space-y-2 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 font-khmer text-xs">
                  {t('ជ្រើសរើសសិស្សដែលត្រូវឡើងថ្នាក់', 'Select Students to Promote')}:
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold">
                  {studentsToPromote.length} / {currentStudents.length} សិស្ស
                </span>
              </div>

              {/* Mode switch tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectionMode('all');
                    handleSelectAll();
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-khmer font-bold transition-all ${
                    selectionMode === 'all'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('ឡើងថ្នាក់ទាំងអស់', 'Whole Class')}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionMode('custom')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-khmer font-bold transition-all ${
                    selectionMode === 'custom'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('រើសសិស្សជាក់លាក់', 'Select Specific')}
                </button>
              </div>
            </div>

            {/* Quick Toolbar for Custom Selection */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder={t('ស្វែងរកឈ្មោះ ឬអត្តលេខ...', 'Search name or code...')}
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-khmer focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-600 font-khmer">
                  <input
                    type="checkbox"
                    checked={excludeStopped}
                    onChange={(e) => setExcludeStopped(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300"
                  />
                  <span>{t('មិនរាប់សិស្សឈប់រៀន', 'Exclude Stopped')}</span>
                </label>

                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2 py-1 text-[10px] text-indigo-700 hover:bg-indigo-50 rounded border border-indigo-200 font-khmer font-bold"
                >
                  {t('រើសទាំងអស់', 'All')}
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-100 rounded border border-slate-200 font-khmer"
                >
                  {t('ដោះទាំងអស់', 'Clear')}
                </button>
              </div>
            </div>

            {/* Student selection list (Scrollable box) */}
            <div className="border border-slate-200 rounded-xl max-h-52 overflow-y-auto divide-y divide-slate-100 bg-white">
              {eligibleStudents.length === 0 ? (
                <div className="p-4 text-center text-slate-400 font-khmer text-xs">
                  {t('មិនមានសិស្សតាមលក្ខខណ្ឌស្វែងរកទេ', 'No students match current filter')}
                </div>
              ) : (
                eligibleStudents.map((st) => {
                  const isChecked = selectedStudentIds.includes(st.id);
                  const isStopped = st.feesGroup.toLowerCase().includes('stop');
                  return (
                    <div
                      key={st.id}
                      onClick={() => handleToggleStudent(st.id)}
                      className={`p-2 sm:px-3 flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                        isChecked ? 'bg-indigo-50/60 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent onClick
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="w-6 text-[10px] font-mono text-slate-400">
                          #{st.id}
                        </span>
                        <div className="truncate">
                          <span className="font-khmer text-slate-900 text-xs truncate">
                            {st.name}
                          </span>
                          {st.latinName && (
                            <span className="text-[10px] font-sans text-slate-400 ml-1.5">
                              ({st.latinName})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-khmer ${
                          st.gender === 'Female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {st.gender === 'Female' ? 'ស្រី' : 'ប្រុស'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                          {st.studentCode}
                        </span>
                        {isStopped && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[10px] font-khmer font-bold">
                            ឈប់
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 3: Promotion Options & Financial Carry-over */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 font-khmer">
                {t('ខែទូទាត់សម្រាប់ថ្នាក់ថ្មី', 'Fee Month for New Class')}
              </label>
              <select
                value={newFeeGroup}
                onChange={(e) => setNewFeeGroup(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-khmer focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {MONTH_NAMES.map((m) => (
                  <option key={m} value={m}>
                    {m} {globalYear}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-1 text-[11px] font-khmer text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={removeFromOldClass}
                  onChange={(e) => setRemoveFromOldClass(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
                <span className="font-bold">
                  {t('ផ្ទេរសិស្សចេញពីថ្នាក់ចាស់ (Move out of source class)', 'Remove from source class')}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={carryOverPrepaid}
                  onChange={(e) => setCarryOverPrepaid(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
                <span>
                  {t('រក្សាសមតុល្យសិស្សបានបង់រួច (Carry over prepaid)', 'Carry over prepaid balances')}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendTelegram}
                  onChange={(e) => setSendTelegram(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
                <span className="flex items-center gap-1 text-sky-700">
                  <Send className="w-3 h-3" />
                  <span>{t('ផ្ញើដំណឹង Telegram ស្វ័យប្រវត្ត', 'Send Telegram Notification')}</span>
                </span>
              </label>
            </div>
          </div>

          {/* Step 4: Promotion Summary Preview */}
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between text-xs font-khmer">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold font-mono">
                {studentsToPromote.length} សិស្ស
              </span>
              <div className="text-indigo-950 font-bold leading-tight">
                <div>
                  ពី {sourceClass?.className} <span className="text-indigo-500 font-sans">➔</span>{' '}
                  {targetClassChoice === 'NEW_CLASS' ? newClassName || 'ថ្នាក់ថ្មី' : classData[targetClassChoice]?.className}
                </div>
                <div className="text-[10px] text-indigo-700 font-normal mt-0.5">
                  ស្រី: {femaleCount} នាក់ · ប្រុស: {maleCount} នាក់
                </div>
              </div>
            </div>

            <div className="text-right text-[11px] text-indigo-800 font-mono">
              Year {settings.academicYear}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold font-khmer transition-colors"
          >
            {t('បោះបង់', 'Cancel')}
          </button>

          <button
            type="button"
            onClick={handleConfirmPromotion}
            disabled={isSubmitting || selectedStudentIds.length === 0}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-xl font-khmer flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <GraduationCap className="w-4 h-4" />
                <span>
                  {t(
                    `ឡើងថ្នាក់សិស្ស ${studentsToPromote.length} នាក់`,
                    `Promote ${studentsToPromote.length} Students`
                  )}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
