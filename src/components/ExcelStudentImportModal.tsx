import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Clipboard,
  RefreshCw,
  Users,
  Check,
  ChevronDown,
  Info,
  Calendar,
  Phone,
  MapPin,
  Eye,
  FileCheck,
  ArrowRight,
} from 'lucide-react';
import {
  parsePastedTable,
  isHeaderRow,
  detectColumnField,
  normalizeBirthDate,
  normalizeGender,
  normalizeStudentNote,
  cleanPhoneNumber,
  mapCaseType,
  buildStudentRecordsFromParsed,
  TARGET_ADMISSION_COLUMNS,
  TargetAdmissionField,
  ParsedStudentRow,
  SCREENSHOT_SAMPLE_RAW_TSV,
} from '../utils/excelStudentParser';

interface ExcelStudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTargetClassId?: string;
  onSuccess?: (addedCount: number, className: string) => void;
}

export const ExcelStudentImportModal: React.FC<ExcelStudentImportModalProps> = ({
  isOpen,
  onClose,
  defaultTargetClassId,
  onSuccess,
}) => {
  const {
    classData,
    orderedClassList,
    batchAddStudents,
    globalYear,
    settings,
    permissions,
    t,
  } = useApp();

  const [targetClassId, setTargetClassId] = useState<string>(
    defaultTargetClassId || orderedClassList[0]?.classId || Object.keys(classData)[0] || '1A'
  );

  const [rawText, setRawText] = useState<string>('');
  const [columnMappings, setColumnMappings] = useState<TargetAdmissionField[]>([]);
  const [headerNames, setHeaderNames] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [activeTab, setActiveTab] = useState<'paste' | 'mapper' | 'preview'>('paste');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ count: number; className: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync targetClassId when prop changes or modal opens
  useEffect(() => {
    if (defaultTargetClassId && classData[defaultTargetClassId]) {
      setTargetClassId(defaultTargetClassId);
    }
  }, [defaultTargetClassId, classData, isOpen]);

  // Target class details
  const targetClass = classData[targetClassId] || orderedClassList[0];
  const existingStudentsInClass = useMemo(() => {
    return targetClass ? targetClass.students : [];
  }, [targetClass]);

  // Parsing & Auto-Mapping Engine
  useEffect(() => {
    if (!rawText.trim()) {
      setColumnMappings([]);
      setHeaderNames([]);
      setParsedRows([]);
      return;
    }

    const matrix = parsePastedTable(rawText);
    if (matrix.length === 0) return;

    const hasHeader = isHeaderRow(matrix[0]);
    const headers = hasHeader ? matrix[0] : matrix[0].map((_, i) => `ជួរឈរ ${i + 1}`);
    const dataRows = hasHeader ? matrix.slice(1) : matrix;

    setHeaderNames(headers);

    // Auto-detect mappings for each column
    const detected: TargetAdmissionField[] = headers.map((h, colIdx) => {
      // Gather sample values for heuristics
      const sampleVals = dataRows.slice(0, 5).map((r) => r[colIdx] || '');
      return detectColumnField(h, sampleVals, colIdx, headers.length);
    });

    setColumnMappings(detected);
  }, [rawText]);

  // Generate ParsedStudentRows whenever data or mappings change
  useEffect(() => {
    if (!rawText.trim() || columnMappings.length === 0) {
      setParsedRows([]);
      return;
    }

    const matrix = parsePastedTable(rawText);
    const hasHeader = isHeaderRow(matrix[0]);
    const dataRows = hasHeader ? matrix.slice(1) : matrix;

    const rows: ParsedStudentRow[] = dataRows.map((rawRow, idx) => {
      let name = '';
      let latinName = '';
      let genderStr = '';
      let noteStr = '';
      let caseStr = '';
      let dobStr = '';
      let phoneStr = '';
      let phone2Str = '';
      let addressStr = '';
      let fatherStr = '';
      let motherStr = '';
      let otherStr = '';

      columnMappings.forEach((field, colIdx) => {
        const val = rawRow[colIdx]?.trim() || '';
        switch (field) {
          case 'name':
            name = val;
            break;
          case 'latinName':
            latinName = val;
            break;
          case 'gender':
            genderStr = val;
            break;
          case 'note':
            noteStr = val;
            break;
          case 'caseType':
            caseStr = val;
            break;
          case 'dob':
            dobStr = val;
            break;
          case 'phone':
            phoneStr = val;
            break;
          case 'phone2':
            phone2Str = val;
            break;
          case 'address':
            addressStr = val;
            break;
          case 'fatherName':
            fatherStr = val;
            break;
          case 'motherName':
            motherStr = val;
            break;
          case 'otherNotes':
            otherStr = val;
            break;
          default:
            break;
        }
      });

      const normalizedGender = normalizeGender(genderStr);
      const normalizedNote = normalizeStudentNote(noteStr);
      const normalizedDob = normalizeBirthDate(dobStr);
      const cleanedPhone1 = cleanPhoneNumber(phoneStr);
      const cleanedPhone2 = cleanPhoneNumber(phone2Str);
      const { caseType, rawCase } = mapCaseType(caseStr);

      const warnings: string[] = [];
      if (!name) {
        warnings.push('ខ្វះឈ្មោះសិស្ស (Missing Name)');
      }
      if (!normalizedDob) {
        warnings.push('ខ្វះថ្ងៃខែកំណើត (Missing DOB)');
      }

      // Check if duplicate in target class
      if (
        name &&
        existingStudentsInClass.some(
          (s) => s.name.trim().toLowerCase() === name.trim().toLowerCase()
        )
      ) {
        warnings.push(`ឈ្មោះ «${name}» មានក្នុងថ្នាក់នេះរួចហើយ (Duplicate in class)`);
      }

      return {
        index: idx + 1,
        selected: Boolean(name),
        rawValues: rawRow,
        name,
        latinName: latinName || undefined,
        gender: normalizedGender,
        note: normalizedNote,
        caseType,
        rawCase,
        dob: normalizedDob,
        phone: cleanedPhone1,
        phone2: cleanedPhone2 || undefined,
        address: addressStr,
        fatherName: fatherStr || undefined,
        motherName: motherStr || undefined,
        otherNotes: otherStr || undefined,
        isValid: Boolean(name),
        warnings,
      };
    });

    setParsedRows(rows);
  }, [columnMappings, rawText, existingStudentsInClass]);

  if (!isOpen) return null;

  // Stats
  const totalRows = parsedRows.length;
  const validRows = parsedRows.filter((r) => r.isValid).length;
  const selectedRows = parsedRows.filter((r) => r.selected).length;
  const duplicateWarningsCount = parsedRows.filter((r) =>
    r.warnings.some((w) => w.includes('Duplicate'))
  ).length;

  const handleMappingChange = (colIndex: number, field: TargetAdmissionField) => {
    setColumnMappings((prev) => {
      const copy = [...prev];
      copy[colIndex] = field;
      return copy;
    });
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.isValid ? { ...r, selected: checked } : r))
    );
  };

  const handleToggleRowSelect = (index: number) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.index === index ? { ...r, selected: !r.selected } : r))
    );
  };

  // Load 15 students from user's screenshot
  const handleLoadSampleFromScreenshot = () => {
    setRawText(SCREENSHOT_SAMPLE_RAW_TSV);
    setActiveTab('preview');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawText(text);
        setActiveTab('preview');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Execute Batch Import into AppContext
  const handleExecuteImport = () => {
    if (!permissions.canEdit) {
      alert(t('អ្នកគ្មានសិទ្ធិបញ្ចូលទិន្នន័យសិស្សទេ!', 'Permission Denied'));
      return;
    }

    if (selectedRows === 0) {
      alert(t('សូមជ្រើសរើសសិស្សយ៉ាងហោចណាស់ ១នាក់ដើម្បីនាំចូល!', 'Please select at least 1 student to import!'));
      return;
    }

    if (duplicateWarningsCount > 0) {
      const proceed = window.confirm(
        t(
          `⚠️ រកឃើញសិស្សឈ្មោះស្ទួនចំនួន ${duplicateWarningsCount} នាក់ក្នុងថ្នាក់ ${targetClass?.className}។ តើលោកអ្នកពិតជាចង់បន្តនាំចូលមែនទេ?`,
          `⚠️ Duplicate student names detected (${duplicateWarningsCount}). Proceed anyway?`
        )
      );
      if (!proceed) return;
    }

    setIsImporting(true);

    try {
      const recordsToImport = buildStudentRecordsFromParsed(
        parsedRows,
        targetClassId,
        `${globalYear}-${globalYear + 1}`,
        settings.schoolNameKhmer
      );

      const result = batchAddStudents(targetClassId, recordsToImport);

      if (result.success) {
        setImportResult({
          count: result.addedCount,
          className: targetClass?.className || targetClassId,
        });
        if (onSuccess) {
          onSuccess(result.addedCount, targetClass?.className || targetClassId);
        }
      } else {
        alert(t('មានបញ្ហាក្នុងការនាំចូលទិន្នន័យ!', 'Failed to import student records.'));
      }
    } catch (err) {
      console.error('Import error:', err);
      alert(t('កំហុសបច្ចេកទេសក្នុងការនាំចូលទិន្នន័យ!', 'Technical error during import.'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 text-xs flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center shadow-2xs">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base font-khmer">
                  {t('នាំចូលព័ត៌មានសិស្សពី Excel (Paste from Excel to Import)', 'Import Student Records from Excel')}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-khmer">
                  Auto Column Map
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-khmer mt-0.5">
                {t(
                  'ចម្លង (Copy) ពី Excel រួចចុច Paste (Ctrl+V) — ប្រព័ន្ធផ្គូផ្គងជួរឈរតាមទម្រង់ពាក្យសុំចុះឈ្មោះ (Admission Form) ដោយស្វ័យប្រវត្តិ',
                  'Copy table from Excel and paste here. Automatically maps columns to admission form fields.'
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

        {/* Import Result Success Screen */}
        {importResult ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900 font-khmer">
                {t('នាំចូលទិន្នន័យសិស្សជោគជ័យ!', 'Students Imported Successfully!')}
              </h4>
              <p className="text-slate-600 font-khmer text-sm mt-1">
                បានបញ្ចូលសិស្សចំនួន{' '}
                <strong className="text-emerald-700 text-base font-mono">
                  {importResult.count}
                </strong>{' '}
                នាក់ ទៅក្នុងថ្នាក់{' '}
                <strong className="text-slate-900 font-bold">
                  {importResult.className}
                </strong>{' '}
                យ៉ាងពេញលេញ និងត្រឹមត្រូវ។
              </p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl max-w-md mx-auto text-left text-xs font-khmer text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <span>ព័ត៌មានដែលបានធ្វើសមកាលកម្ម (Synced Data)៖</span>
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 text-emerald-800 ml-1">
                <li>ឈ្មោះសិស្ស (ខ្មែរ/ឡាតាំង), ភេទ, ថ្ងៃខែកំណើត (DOB)</li>
                <li>លេខទូរស័ព្ទ ១ និង ២, ទីលំនៅបច្ចុប្បន្ន</li>
                <li>ឈ្មោះឪពុក, ឈ្មោះម្តាយ, អាណាព្យាបាល</li>
                <li>ប្រភេទករណី (General, Landfill, FC), ចំណាំសិស្ស (Old/New)</li>
                <li>បង្កើតពាក្យសុំចូលរៀន (Admission Form Record) រួចរាល់</li>
              </ul>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setImportResult(null);
                  setRawText('');
                  setActiveTab('paste');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold font-khmer transition-colors"
              >
                នាំចូលទិន្នន័យបន្ថែមទៀត
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold font-khmer shadow-xs transition-colors"
              >
                រួចរាល់ និងបិទផ្ទាំង
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Control Bar: Target Class Selector & Quick Actions */}
            <div className="px-5 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-bold font-khmer text-xs">
                  {t('នាំចូលទៅកាន់ថ្នាក់ (Target Class)៖', 'Target Class:')}
                </span>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-khmer font-bold text-slate-800 focus:outline-indigo-500"
                >
                  {orderedClassList.map((cls) => {
                    const bCode = (cls.branchId === 'branch-tk' ? 'BIM-02' : cls.branchId === 'branch-ca' ? 'BIM-03' : 'BIM-01');
                    return (
                      <option key={cls.classId} value={cls.classId}>
                        {cls.className} [{bCode}] ({cls.students.length} សិស្ស)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center gap-2">
                {/* 1-Click Load Sample from Screenshot */}
                <button
                  type="button"
                  onClick={handleLoadSampleFromScreenshot}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold font-khmer text-xs transition-colors shadow-2xs"
                  title="ផ្ទុកទិន្នន័យសិស្សទាំង ១៥ នាក់តាមរូបថតអេក្រង់ដែលបានផ្ញើមក"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>សាកល្បងទិន្នន័យគំរូក្នុងរូបភាព (15 នាក់)</span>
                </button>

                {/* Upload File Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv, .tsv, .txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold font-khmer text-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>បញ្ចូលឯកសារ (.csv / .tsv)</span>
                </button>

                {rawText && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawText('');
                      setActiveTab('paste');
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="សម្អាតទិន្នន័យ"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-5 border-b border-slate-200 bg-slate-50 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`py-2.5 px-3 font-bold font-khmer border-b-2 transition-all flex items-center gap-1.5 text-xs ${
                  activeTab === 'paste'
                    ? 'border-indigo-600 text-indigo-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>១. បិទភ្ជាប់ទិន្នន័យ (Paste Data)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mapper')}
                disabled={!rawText.trim()}
                className={`py-2.5 px-3 font-bold font-khmer border-b-2 transition-all flex items-center gap-1.5 text-xs ${
                  activeTab === 'mapper'
                    ? 'border-indigo-600 text-indigo-700 bg-white'
                    : !rawText.trim()
                    ? 'border-transparent text-slate-300 cursor-not-allowed'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>២. ផ្គូផ្គងជួរឈរ (Auto-Map Columns)</span>
                {columnMappings.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold">
                    {columnMappings.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                disabled={!rawText.trim()}
                className={`py-2.5 px-3 font-bold font-khmer border-b-2 transition-all flex items-center gap-1.5 text-xs ${
                  activeTab === 'preview'
                    ? 'border-indigo-600 text-indigo-700 bg-white'
                    : !rawText.trim()
                    ? 'border-transparent text-slate-300 cursor-not-allowed'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>៣. ផ្ទៀងផ្ទាត់ & នាំចូល (Preview & Import)</span>
                {parsedRows.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                    {parsedRows.length} នាក់
                  </span>
                )}
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {/* TAB 1: PASTE */}
              {activeTab === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 font-khmer text-xs flex items-center gap-1.5">
                      <Clipboard className="w-4 h-4 text-indigo-600" />
                      <span>បិទភ្ជាប់ (Paste) ទិន្នន័យចម្លងចេញពី Excel ឬ Google Sheets៖</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-khmer">
                      ប្រើ Ctrl+V ឬ Cmd+V
                    </span>
                  </div>

                  <textarea
                    rows={12}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`ឧទាហរណ៍នៃការបិទភ្ជាប់ចេញពី Excel (Copy ពី Excel រួច Paste នៅទីនេះ)៖

ល.រ	ឈ្មោះសិស្ស	ភេទ	ចំណាំ	ករណី	ថ្ងៃខែកំណើត	លេខទូរស័ព្ទ	លេខទូរស័ព្ទ២	លំនៅបច្ចុប្បន្ន	ឈ្មោះឪពុក	ឈ្មោះម្តាយ	ផ្សេងៗ
1	វេន សុខលាភ	Man	Old	General	27-03-2020	0125290099	0972833279	ទួលពង្រ	វេន ប្រុស	ស៊ាន សេងលី	
2	ក្រាប ចានអី	Man	Old	General	19-08-2020	092293374	089953405	អូរឫស្សី	ប៉ូ ក្រាប	រ៉ាន សុខឡា	
3	ប៉ា សៀវហោង	Female	Old	General	20-11-2020	0964758628	No	ទួលពង្រ	ម៉ុក សុដា	ភឿន នាង`}
                    className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-indigo-500 whitespace-pre overflow-x-auto leading-relaxed shadow-inner"
                  />

                  {rawText.trim() && (
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-[11px] text-slate-600 font-khmer flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>
                          បានរកឃើញជួរដេកទិន្នន័យចំនួន <strong>{parsedRows.length}</strong> ជួរ
                          និង <strong>{columnMappings.length}</strong> ជួរឈរ។
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('preview')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold font-khmer text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <span>ពិនិត្យទិន្នន័យ (Preview)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: COLUMN MAPPER */}
              {activeTab === 'mapper' && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl text-indigo-900 text-xs font-khmer flex items-start gap-2">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">ការផ្គូផ្គងជួរឈរស្វ័យប្រវត្តិ (Auto Column Mapping)៖</span>{' '}
                      ប្រព័ន្ធបានវិភាគក្បាលជួរឈរ និងទិន្នន័យគំរូនីមួយៗ ហើយផ្គូផ្គងជាមួយវាលនៃទម្រង់ពាក្យសុំចុះឈ្មោះចូលរៀន (Admission Form)។
                      ប្រសិនបើជួរឈរណាផ្គូផ្គងមិនត្រូវ លោកអ្នកអាចកែសម្រួលបានតាមបញ្ជីខាងក្រោម។
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {columnMappings.map((mappedField, idx) => {
                      const colHeader = headerNames[idx] || `ជួរឈរ ${idx + 1}`;
                      const sampleVals = parsedRows
                        .slice(0, 3)
                        .map((r) => r.rawValues[idx] || '')
                        .filter(Boolean);

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border transition-all ${
                            mappedField !== 'skip'
                              ? 'bg-white border-slate-200 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">
                              Col {idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 font-khmer text-xs truncate max-w-[140px]" title={colHeader}>
                              «{colHeader}»
                            </span>
                          </div>

                          <label className="block text-[10px] text-slate-500 font-khmer mb-1">
                            ផ្គូផ្គងទៅកាន់ (Map to Field)៖
                          </label>
                          <select
                            value={mappedField}
                            onChange={(e) => handleMappingChange(idx, e.target.value as TargetAdmissionField)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-khmer font-bold text-slate-900 focus:outline-indigo-500"
                          >
                            {TARGET_ADMISSION_COLUMNS.map((targetCol) => (
                              <option key={targetCol.field} value={targetCol.field}>
                                {targetCol.labelKhmer} ({targetCol.labelEnglish})
                              </option>
                            ))}
                          </select>

                          {/* Sample preview values */}
                          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-0.5">
                            <span className="font-khmer text-slate-400">គំរូទិន្នន័យ៖</span>
                            {sampleVals.length > 0 ? (
                              sampleVals.map((sv, sIdx) => (
                                <div key={sIdx} className="font-mono truncate text-slate-700 bg-slate-100/70 px-1.5 py-0.5 rounded">
                                  {sv || '—'}
                                </div>
                              ))
                            ) : (
                              <div className="italic text-slate-300">ទិន្នន័យទទេ (Empty)</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold font-khmer text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <span>ផ្ទៀងផ្ទាត់ទិន្នន័យ និងនាំចូល</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: PREVIEW & IMPORT */}
              {activeTab === 'preview' && (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-600" />
                        <span className="text-slate-600 font-khmer">សិស្សសរុប៖</span>
                        <span className="font-mono font-bold text-slate-900">{totalRows}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-slate-600 font-khmer">ត្រឹមត្រូវ៖</span>
                        <span className="font-mono font-bold text-emerald-700">{validRows}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-600 font-khmer">បានជ្រើសរើស៖</span>
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                          {selectedRows}
                        </span>
                      </div>
                      {duplicateWarningsCount > 0 && (
                        <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span className="font-khmer text-[11px]">
                            ឈ្មោះស្ទួនក្នុងថ្នាក់៖ {duplicateWarningsCount}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 font-khmer text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedRows === validRows && validRows > 0}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                        />
                        <span>ជ្រើសទាំងអស់</span>
                      </label>
                    </div>
                  </div>

                  {/* Data Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-[50vh] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100/90 text-slate-700 font-bold font-khmer sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 text-center w-8">
                            <input
                              type="checkbox"
                              checked={selectedRows === validRows && validRows > 0}
                              onChange={(e) => handleToggleSelectAll(e.target.checked)}
                              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300"
                            />
                          </th>
                          <th className="p-2.5 w-10 text-center font-mono">#</th>
                          <th className="p-2.5 min-w-[120px]">ឈ្មោះសិស្ស (Khmer)</th>
                          <th className="p-2.5 text-center w-16">ភេទ</th>
                          <th className="p-2.5 text-center w-16">ចំណាំ</th>
                          <th className="p-2.5 text-center w-20">ករណី</th>
                          <th className="p-2.5 min-w-[100px]">ថ្ងៃខែកំណើត</th>
                          <th className="p-2.5 min-w-[120px]">លេខទូរស័ព្ទ</th>
                          <th className="p-2.5 min-w-[100px]">លំនៅបច្ចុប្បន្ន</th>
                          <th className="p-2.5 min-w-[120px]">ឈ្មោះឪពុក</th>
                          <th className="p-2.5 min-w-[120px]">ឈ្មោះម្តាយ</th>
                          <th className="p-2.5 min-w-[100px]">ស្ថានភាព</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((row) => (
                          <tr
                            key={row.index}
                            className={`transition-colors ${
                              !row.isValid
                                ? 'bg-rose-50/40 text-slate-400'
                                : row.selected
                                ? 'bg-indigo-50/30 hover:bg-indigo-50/50'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="p-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={row.selected}
                                disabled={!row.isValid}
                                onChange={() => handleToggleRowSelect(row.index)}
                                className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300"
                              />
                            </td>
                            <td className="p-2.5 text-center font-mono text-slate-500 text-[11px]">
                              {row.index}
                            </td>
                            <td className="p-2.5 font-bold text-slate-900 font-khmer">
                              {row.name || <span className="text-rose-400 italic">គ្មានឈ្មោះ</span>}
                              {row.latinName && (
                                <div className="text-[10px] text-slate-400 font-sans font-normal">
                                  {row.latinName}
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-mono">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  row.gender === 'Female'
                                    ? 'bg-pink-100 text-pink-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {row.gender === 'Female' ? 'ស្រី' : 'ប្រុស'}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-mono">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  row.note === 'New'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {row.note}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-mono text-[11px]">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-800">
                                {row.rawCase || 'General'}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-700">
                              {row.dob ? (
                                <span className="text-slate-900">{row.dob}</span>
                              ) : (
                                <span className="text-slate-400 italic">មិនបានបញ្ជាក់</span>
                              )}
                            </td>
                            <td className="p-2.5 font-mono text-[11px]">
                              {row.phone && (
                                <div className="text-slate-900 font-bold">{row.phone}</div>
                              )}
                              {row.phone2 && (
                                <div className="text-slate-500 text-[10px]">{row.phone2}</div>
                              )}
                              {!row.phone && !row.phone2 && (
                                <span className="text-slate-300 italic">គ្មាន</span>
                              )}
                            </td>
                            <td className="p-2.5 font-khmer text-slate-700 text-[11px]">
                              {row.address || '—'}
                            </td>
                            <td className="p-2.5 font-khmer text-slate-700 text-[11px]">
                              {row.fatherName || '—'}
                            </td>
                            <td className="p-2.5 font-khmer text-slate-700 text-[11px]">
                              {row.motherName || '—'}
                            </td>
                            <td className="p-2.5 text-[10px]">
                              {row.warnings.length > 0 ? (
                                <div className="space-y-0.5">
                                  {row.warnings.map((w, wIdx) => (
                                    <div
                                      key={wIdx}
                                      className="text-amber-800 font-khmer flex items-center gap-1 bg-amber-50 px-1 py-0.5 rounded"
                                    >
                                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                      <span className="truncate max-w-[120px]" title={w}>
                                        {w}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-khmer bg-emerald-50 px-1.5 py-0.5 rounded">
                                  <Check className="w-3 h-3" />
                                  <span>ត្រៀមនាំចូល</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2 text-slate-500 font-khmer text-xs">
                <span>
                  នាំចូលទៅ៖ <strong className="text-slate-900">{targetClass?.className}</strong>
                </span>
                <span>·</span>
                <span>
                  ជ្រើសរើស៖ <strong className="text-indigo-700 font-mono">{selectedRows}</strong> នាក់
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-khmer text-xs"
                >
                  {t('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={selectedRows === 0 || isImporting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold font-khmer text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>
                    {isImporting
                      ? 'កំពុងនាំចូល...'
                      : `នាំចូលសិស្សចំនួន ${selectedRows} នាក់ (Import)`}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
