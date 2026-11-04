import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Calendar,
  X,
  GripVertical,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  User,
  Phone,
} from 'lucide-react';
import { MONTH_NAMES_KH } from '../types';

interface ClassMonthManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'classes' | 'months';
}

export const ClassMonthManagerModal: React.FC<ClassMonthManagerModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'classes',
}) => {
  const {
    classData,
    orderedClassList,
    selectedClassId,
    setSelectedClassId,
    addClass,
    updateClass,
    deleteClass,
    reorderClasses,
    moveClassOrder,
    sortClasses,
    academicMonths,
    addAcademicMonth,
    updateAcademicMonth,
    deleteAcademicMonth,
    reorderAcademicMonths,
    moveAcademicMonthOrder,
    sortAcademicMonths,
    globalMonth,
    setGlobalMonth,
    branches,
    currentBranchId,
    getBranchName,
    permissions,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'classes' | 'months'>(initialTab);

  // Drag states for Classes
  const [draggedClassIndex, setDraggedClassIndex] = useState<number | null>(null);
  // Drag states for Months
  const [draggedMonthIndex, setDraggedMonthIndex] = useState<number | null>(null);

  // Class Edit / Add State
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editClassPeriod, setEditClassPeriod] = useState('');
  const [editClassTeacher, setEditClassTeacher] = useState('');
  const [editClassPhone, setEditClassPhone] = useState('');
  const [editClassBranchId, setEditClassBranchId] = useState('branch-central');

  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassPeriod, setNewClassPeriod] = useState('01.10.2026 _ 31.10.2026');
  const [newClassTeacher, setNewClassTeacher] = useState('');
  const [newClassPhone, setNewClassPhone] = useState('');
  const [newClassBranchId, setNewClassBranchId] = useState(
    currentBranchId !== 'all' ? currentBranchId : (branches[0]?.id || 'branch-central')
  );

  // Month Edit / Add State
  const [editingMonthName, setEditingMonthName] = useState<string | null>(null);
  const [editMonthInput, setEditMonthInput] = useState('');

  const [isAddingMonth, setIsAddingMonth] = useState(false);
  const [newMonthInput, setNewMonthInput] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  if (!isOpen) return null;

  // Class Drag & Drop Handlers
  const handleClassDragStart = (e: React.DragEvent, index: number) => {
    setDraggedClassIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleClassDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleClassDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedClassIndex === null || draggedClassIndex === targetIndex) return;

    const currentList = orderedClassList.map((c) => c.classId);
    const updated = [...currentList];
    const [moved] = updated.splice(draggedClassIndex, 1);
    updated.splice(targetIndex, 0, moved);

    reorderClasses(updated);
    setDraggedClassIndex(null);
    showToast(t('បានប្តូរលំដាប់ថ្នាក់ដោយជោគជ័យ!', 'Classes reordered successfully!'));
  };

  // Month Drag & Drop Handlers
  const handleMonthDragStart = (e: React.DragEvent, index: number) => {
    setDraggedMonthIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMonthDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleMonthDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedMonthIndex === null || draggedMonthIndex === targetIndex) return;

    const updated = [...academicMonths];
    const [moved] = updated.splice(draggedMonthIndex, 1);
    updated.splice(targetIndex, 0, moved);

    reorderAcademicMonths(updated);
    setDraggedMonthIndex(null);
    showToast(t('បានប្តូរលំដាប់ខែដោយជោគជ័យ!', 'Months reordered successfully!'));
  };

  // Start Class Edit
  const handleStartEditClass = (cls: (typeof orderedClassList)[0]) => {
    setEditingClassId(cls.classId);
    setEditClassName(cls.className);
    setEditClassPeriod(cls.period);
    setEditClassTeacher(cls.homeroomTeacher || '');
    setEditClassPhone(cls.teacherPhone || '');
    setEditClassBranchId(cls.branchId || 'branch-central');
  };

  const handleSaveClassEdit = (classId: string) => {
    if (!editClassName.trim()) {
      alert(t('សូមបញ្ចូលឈ្មោះថ្នាក់!', 'Class name required!'));
      return;
    }

    const res = updateClass(classId, {
      className: editClassName.trim(),
      period: editClassPeriod.trim(),
      homeroomTeacher: editClassTeacher.trim(),
      teacherPhone: editClassPhone.trim(),
      branchId: editClassBranchId,
    });

    if (res.success) {
      setEditingClassId(null);
      showToast(t('បានកែប្រែព័ត៌មានថ្នាក់ដោយជោគជ័យ!', 'Class updated successfully!'));
    }
  };

  // Create Class
  const handleCreateNewClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const res = addClass(
      newClassName.trim(),
      newClassPeriod.trim(),
      newClassTeacher.trim(),
      newClassPhone.trim(),
      newClassBranchId
    );

    if (res.success) {
      setNewClassName('');
      setNewClassTeacher('');
      setNewClassPhone('');
      setIsAddingClass(false);
      showToast(t(`បានបង្កើតថ្នាក់ថ្មីដោយជោគជ័យ!`, 'New class created successfully!'));
    }
  };

  // Delete Class
  const handleDeleteClass = (classId: string) => {
    const res = deleteClass(classId);
    if (res.success) {
      showToast(t('បានលុបថ្នាក់ដោយជោគជ័យ!', 'Class deleted successfully!'));
    }
  };

  // Month Edit
  const handleStartEditMonth = (month: string) => {
    setEditingMonthName(month);
    setEditMonthInput(month);
  };

  const handleSaveMonthEdit = (oldMonth: string) => {
    if (!editMonthInput.trim()) return;
    const res = updateAcademicMonth(oldMonth, editMonthInput.trim());
    if (res.success) {
      setEditingMonthName(null);
      showToast(t('បានកែប្រែឈ្មោះខែដោយជោគជ័យ!', 'Month updated successfully!'));
    } else {
      alert(res.error || 'Failed to update month');
    }
  };

  const handleCreateNewMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonthInput.trim()) return;
    const res = addAcademicMonth(newMonthInput.trim());
    if (res.success) {
      setNewMonthInput('');
      setIsAddingMonth(false);
      showToast(t('បានបន្ថែមខែថ្មីដោយជោគជ័យ!', 'New month added successfully!'));
    } else {
      alert(res.error || 'Failed to add month');
    }
  };

  const handleDeleteMonth = (month: string) => {
    const confirmDelete = window.confirm(
      t(`តើអ្នកពិតជាចង់លុបខែ «${month}» ចេញពីប្រព័ន្ធមែនទេ?`, `Are you sure you want to delete month "${month}"?`)
    );
    if (!confirmDelete) return;

    const res = deleteAcademicMonth(month);
    if (res.success) {
      showToast(t('បានលុបខែដោយជោគជ័យ!', 'Month deleted successfully!'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-xs my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-800 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base font-khmer">
                {t('គ្រប់គ្រងថ្នាក់រៀន & ខែសិក្សា', 'Manage Classes & Academic Months')}
              </h3>
              <p className="text-[11px] text-slate-500 font-khmer">
                {t(
                  'កែប្រែ, លុប, តម្រៀបលំដាប់ (Drag & Drop) នៃថ្នាក់រៀន និងខែសិក្សា',
                  'Edit, delete, sort, and drag-and-drop reorder classes and academic months'
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

        {/* Floating Notification Toast */}
        {toastMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-khmer font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('classes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-khmer transition-all ${
              activeTab === 'classes'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t('គ្រប់គ្រងថ្នាក់រៀន', 'Classes')}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'classes' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              {orderedClassList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('months')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-khmer transition-all ${
              activeTab === 'months'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t('គ្រប់គ្រងខែសិក្សា', 'Academic Months')}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'months' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              {academicMonths.length}
            </span>
          </button>
        </div>

        {/* TAB 1: CLASSES MANAGEMENT */}
        {activeTab === 'classes' && (
          <div className="mt-4 space-y-4">
            {/* Quick Sort & Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-600 font-khmer flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('តម្រៀបស្វ័យប្រវត្ត', 'Auto Sort')}:</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sortClasses('name_asc');
                    showToast(t('បានតម្រៀបថ្នាក់ A ទៅ Z', 'Sorted classes A to Z'));
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-mono font-bold text-slate-700 transition-colors"
                >
                  A-Z
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sortClasses('name_desc');
                    showToast(t('បានតម្រៀបថ្នាក់ Z ទៅ A', 'Sorted classes Z to A'));
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-mono font-bold text-slate-700 transition-colors"
                >
                  Z-A
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sortClasses('students_desc');
                    showToast(t('បានតម្រៀបតាមចំនួនសិស្សច្រើន', 'Sorted by most students'));
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-khmer font-bold text-slate-700 transition-colors"
                >
                  {t('សិស្សច្រើនទៅតិច', 'By Students')}
                </button>
              </div>

              {permissions.canEdit && (
                <button
                  type="button"
                  onClick={() => setIsAddingClass((prev) => !prev)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold font-khmer text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingClass ? t('បិទផ្ទាំង', 'Close Form') : t('+ បន្ថែមថ្នាក់ថ្មី', '+ Add Class')}</span>
                </button>
              )}
            </div>

            {/* Inline Add Class Form */}
            {isAddingClass && (
              <form onSubmit={handleCreateNewClass} className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 animate-in fade-in text-left">
                <div className="font-bold text-amber-950 font-khmer text-xs">
                  {t('បញ្ចូលព័ត៌មានថ្នាក់ថ្មី', 'Create New Class')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 font-khmer mb-1">
                      {t('ឈ្មោះថ្នាក់', 'Class Name')} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. ថ្នាក់ទី ២A (Grade 2A)"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-khmer focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 font-khmer mb-1">
                      {t('កាលបរិច្ឆេទ (Period)', 'Period')}
                    </label>
                    <input
                      type="text"
                      value={newClassPeriod}
                      onChange={(e) => setNewClassPeriod(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 font-khmer mb-1">
                      {t('គ្រូបន្ទុកថ្នាក់ (Teacher Name)', 'Homeroom Teacher')}
                    </label>
                    <input
                      type="text"
                      placeholder="ឈ្មោះគ្រូបន្ទុកថ្នាក់"
                      value={newClassTeacher}
                      onChange={(e) => setNewClassTeacher(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-khmer focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 font-khmer mb-1">
                      {t('លេខទូរស័ព្ទគ្រូ (Teacher Phone)', 'Teacher Phone')}
                    </label>
                    <input
                      type="text"
                      placeholder="012 345 678"
                      value={newClassPhone}
                      onChange={(e) => setNewClassPhone(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 font-khmer mb-1">
                      {t('សាខាសាលា (Campus Branch)', 'Campus Branch')} *
                    </label>
                    <select
                      value={newClassBranchId}
                      onChange={(e) => setNewClassBranchId(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-khmer focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code} - {b.nameKhmer}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingClass(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl font-khmer text-slate-600 hover:bg-slate-100"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-xl font-bold font-khmer hover:bg-slate-800 shadow-xs"
                  >
                    រក្សាទុកថ្នាក់ថ្មី
                  </button>
                </div>
              </form>
            )}

            {/* Drag & Drop Reorderable Class List */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {orderedClassList.map((cls, index) => {
                const isSelected = cls.classId === selectedClassId;
                const isEditing = editingClassId === cls.classId;

                return (
                  <div
                    key={cls.classId}
                    draggable={!isEditing}
                    onDragStart={(e) => handleClassDragStart(e, index)}
                    onDragOver={(e) => handleClassDragOver(e, index)}
                    onDrop={(e) => handleClassDrop(e, index)}
                    className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      draggedClassIndex === index
                        ? 'opacity-40 border-dashed border-amber-500 bg-amber-50'
                        : isSelected
                        ? 'border-slate-900 bg-slate-50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {isEditing ? (
                      /* Inline Class Edit Mode */
                      <div className="w-full space-y-2.5 text-left animate-in fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 font-khmer">ឈ្មោះថ្នាក់៖</span>
                            <input
                              type="text"
                              value={editClassName}
                              onChange={(e) => setEditClassName(e.target.value)}
                              className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-khmer font-bold focus:ring-1 focus:ring-slate-900"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 font-khmer">កាលបរិច្ឆេទ (Period)៖</span>
                            <input
                              type="text"
                              value={editClassPeriod}
                              onChange={(e) => setEditClassPeriod(e.target.value)}
                              className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-slate-900"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 font-khmer">គ្រូបន្ទុកថ្នាក់៖</span>
                            <input
                              type="text"
                              value={editClassTeacher}
                              onChange={(e) => setEditClassTeacher(e.target.value)}
                              placeholder="ឈ្មោះគ្រូ"
                              className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-khmer focus:ring-1 focus:ring-slate-900"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 font-khmer">លេខទូរស័ព្ទ៖</span>
                            <input
                              type="text"
                              value={editClassPhone}
                              onChange={(e) => setEditClassPhone(e.target.value)}
                              placeholder="012 xxx xxx"
                              className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-slate-900"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 font-khmer">សាខាសាលា (Campus)៖</span>
                            <select
                              value={editClassBranchId}
                              onChange={(e) => setEditClassBranchId(e.target.value)}
                              className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-khmer font-bold focus:ring-1 focus:ring-slate-900"
                            >
                              {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.code} - {b.nameKhmer}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingClassId(null)}
                            className="px-2.5 py-1 text-slate-500 hover:text-slate-800 font-khmer"
                          >
                            បោះបង់
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveClassEdit(cls.classId)}
                            className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold font-khmer shadow-2xs"
                          >
                            រក្សាទុក
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Row Mode */
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Drag Handle */}
                          <div
                            className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 rounded"
                            title={t('អូសដើម្បីផ្លាស់ប្តូរលំដាប់ (Drag to reorder)', 'Drag to reorder')}
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          <div className="w-7 h-7 rounded-xl bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">
                            {index + 1}
                          </div>

                          <div className="text-left min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 font-khmer text-sm truncate">
                                {cls.className}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-mono font-bold">
                                {branches.find((b) => b.id === (cls.branchId || 'branch-central'))?.code || 'BIM-01'}
                              </span>
                              {isSelected && (
                                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-khmer font-bold">
                                  សកម្ម (Active)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                              <span>{cls.students.length} សិស្ស</span>
                              <span>·</span>
                              <span className="truncate max-w-[150px]">{cls.period}</span>
                              {cls.homeroomTeacher && (
                                <>
                                  <span>·</span>
                                  <span className="font-khmer text-slate-700 font-semibold">{cls.homeroomTeacher}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order Controls & Actions */}
                        <div className="flex items-center justify-end gap-1.5 shrink-0">
                          {/* Move Up Button */}
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveClassOrder(cls.classId, 'up')}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Move Down Button */}
                          <button
                            type="button"
                            disabled={index === orderedClassList.length - 1}
                            onClick={() => moveClassOrder(cls.classId, 'down')}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Switch to this class */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClassId(cls.classId);
                              showToast(t(`បានជ្រើសរើស ${cls.className}`, `Switched to ${cls.className}`));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-khmer font-bold transition-all ${
                              isSelected
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected ? 'កំពុងមើល' : 'បើកមើល'}
                          </button>

                          {/* Edit Class Button */}
                          {permissions.canEdit && (
                            <button
                              type="button"
                              onClick={() => handleStartEditClass(cls)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title={t('កែប្រែថ្នាក់ (Edit Class)', 'Edit Class')}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Class Button */}
                          {permissions.canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteClass(cls.classId)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title={t('លុបថ្នាក់ (Delete Class)', 'Delete Class')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ACADEMIC MONTHS MANAGEMENT */}
        {activeTab === 'months' && (
          <div className="mt-4 space-y-4">
            {/* Quick Sort & Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-600 font-khmer flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('តម្រៀបស្វ័យប្រវត្ត', 'Auto Sort')}:</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sortAcademicMonths('academic');
                    showToast(t('បានតម្រៀបតាមឆ្នាំសិក្សា (តុលា - កញ្ញា)', 'Sorted by Academic Year (Oct - Sep)'));
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-khmer font-bold text-slate-700 transition-colors"
                >
                  {t('ឆ្នាំសិក្សា (Oct-Sep)', 'Academic (Oct-Sep)')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sortAcademicMonths('calendar');
                    showToast(t('បានតម្រៀបតាមប្រតិទិន (មករា - ធ្នូ)', 'Sorted by Calendar Year (Jan - Dec)'));
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-khmer font-bold text-slate-700 transition-colors"
                >
                  {t('ប្រតិទិន (Jan-Dec)', 'Calendar (Jan-Dec)')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sortAcademicMonths('alphabetical');
                    showToast(t('បានតម្រៀបតាមលំដាប់អក្សរ A-Z', 'Sorted alphabetically'));
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-mono font-bold text-slate-700 transition-colors"
                >
                  A-Z
                </button>
              </div>

              {permissions.canEdit && (
                <button
                  type="button"
                  onClick={() => setIsAddingMonth((prev) => !prev)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold font-khmer text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingMonth ? t('បិទផ្ទាំង', 'Close Form') : t('+ បន្ថែមខែថ្មី', '+ Add Month')}</span>
                </button>
              )}
            </div>

            {/* Inline Add Month Form */}
            {isAddingMonth && (
              <form onSubmit={handleCreateNewMonth} className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 animate-in fade-in text-left">
                <div className="font-bold text-amber-950 font-khmer text-xs">
                  {t('បន្ថែមខែសិក្សាថ្មី', 'Add New Academic Month')}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="ឧទាហរណ៍៖ October ឬ Summer Term"
                    value={newMonthInput}
                    onChange={(e) => setNewMonthInput(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-xl text-xs font-khmer focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddingMonth(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl font-khmer text-slate-600 hover:bg-slate-100"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-xl font-bold font-khmer hover:bg-slate-800 shadow-xs"
                  >
                    បន្ថែមខែ
                  </button>
                </div>
              </form>
            )}

            {/* Drag & Drop Reorderable Months List */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {academicMonths.map((month, index) => {
                const isSelected = month === globalMonth;
                const isEditing = editingMonthName === month;
                const khmerName = MONTH_NAMES_KH[month] || month;

                return (
                  <div
                    key={month}
                    draggable={!isEditing}
                    onDragStart={(e) => handleMonthDragStart(e, index)}
                    onDragOver={(e) => handleMonthDragOver(e, index)}
                    onDrop={(e) => handleMonthDrop(e, index)}
                    className={`p-2.5 sm:px-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      draggedMonthIndex === index
                        ? 'opacity-40 border-dashed border-amber-500 bg-amber-50'
                        : isSelected
                        ? 'border-slate-900 bg-slate-50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {isEditing ? (
                      /* Inline Month Edit Mode */
                      <div className="flex-1 flex items-center gap-2 animate-in fade-in">
                        <input
                          type="text"
                          value={editMonthInput}
                          onChange={(e) => setEditMonthInput(e.target.value)}
                          className="flex-1 p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:ring-1 focus:ring-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingMonthName(null)}
                          className="px-2.5 py-1 text-slate-500 hover:text-slate-800 font-khmer"
                        >
                          បោះបង់
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveMonthEdit(month)}
                          className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold font-khmer shadow-2xs"
                        >
                          រក្សាទុក
                        </button>
                      </div>
                    ) : (
                      /* Display Row Mode */
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Drag Handle */}
                          <div
                            className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 rounded"
                            title={t('អូសដើម្បីផ្លាស់ប្តូរលំដាប់ (Drag to reorder)', 'Drag to reorder')}
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-900 font-mono font-bold flex items-center justify-center text-[11px] shrink-0">
                            {index + 1}
                          </div>

                          <div className="text-left min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs truncate">
                                {month}
                              </span>
                              <span className="font-khmer text-slate-500 text-[11px]">
                                ({khmerName})
                              </span>
                              {isSelected && (
                                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-khmer font-bold">
                                  សកម្ម (Active)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order Controls & Actions */}
                        <div className="flex items-center justify-end gap-1 shrink-0">
                          {/* Move Up Button */}
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveAcademicMonthOrder(month, 'up')}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Move Down Button */}
                          <button
                            type="button"
                            disabled={index === academicMonths.length - 1}
                            onClick={() => moveAcademicMonthOrder(month, 'down')}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Activate this month */}
                          <button
                            type="button"
                            onClick={() => {
                              setGlobalMonth(month);
                              showToast(t(`បានប្តូរទៅខែ ${month}`, `Active month set to ${month}`));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-khmer font-bold transition-all ${
                              isSelected
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected ? 'សកម្ម' : 'ជ្រើសរើស'}
                          </button>

                          {/* Edit Month Button */}
                          {permissions.canEdit && (
                            <button
                              type="button"
                              onClick={() => handleStartEditMonth(month)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title={t('កែប្រែឈ្មោះខែ (Edit Month)', 'Edit Month')}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Month Button */}
                          {permissions.canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMonth(month)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title={t('លុបខែ (Delete Month)', 'Delete Month')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Close Button */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-khmer">
            💡 {t('អាចចុចអូស (Drag & Drop) ដោយផ្ទាល់ដើម្បីប្តូរទីតាំង', 'Drag and drop rows directly to reorder')}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl font-khmer hover:bg-slate-800 transition-colors shadow-2xs"
          >
            រួចរាល់ (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
