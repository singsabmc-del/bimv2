import { TUITION_CASES, caseRate, caseOptionLabel, fullFeeOf } from '../utils/tuition';
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StudentFeeRecord, StudentAdmissionData } from '../types';
import { checkDuplicateStudent } from '../utils/duplicatePrevention';
import {
  FileText,
  Upload,
  Sparkles,
  Printer,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Heart,
  Users,
  Utensils,
  BookOpen,
  Calendar,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Check,
  RefreshCw,
  Eye,
  Download,
  FileSpreadsheet,
  ArrowLeft,
} from 'lucide-react';
import { ExcelStudentImportModal } from './ExcelStudentImportModal';

interface StudentAdmissionViewProps {
  onBack?: () => void;
  targetClassId?: string;
  existingStudent?: StudentFeeRecord | null;
  onStudentSaved?: (student: StudentFeeRecord) => void;
}

export const StudentAdmissionView: React.FC<StudentAdmissionViewProps> = ({
  onBack,
  targetClassId,
  existingStudent,
  onStudentSaved,
}) => {
  const {
    classData,
    orderedClassList,
    branches,
    addStudent,
    updateStudentFee,
    settings,
    currentUser,
    permissions,
    sendTelegramAlert,
    currentBranch,
    t,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'pupil' | 'grade' | 'health' | 'parents' | 'other' | 'declaration'>('pupil');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    targetClassId || orderedClassList[0]?.classId || Object.keys(classData)[0] || '1A'
  );
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);

  // AI Extraction state
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Section I: Pupil Details
  const [nameKhmer, setNameKhmer] = useState(existingStudent?.name || '');
  const [nameEnglish, setNameEnglish] = useState(existingStudent?.latinName || '');
  const [gender, setGender] = useState<'Man' | 'Female'>(existingStudent?.gender || 'Man');
  const [nationality, setNationality] = useState(existingStudent?.nationality || 'ខ្មែរ');
  const [dob, setDob] = useState(existingStudent?.dob || '2019-05-15');
  const [religion, setReligion] = useState(existingStudent?.religion || 'ព្រះពុទ្ធ');
  const [studentIdCode, setStudentIdCode] = useState(
    existingStudent?.studentCode || `BIM-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`
  );
  const [placeOfBirth, setPlaceOfBirth] = useState(
    existingStudent?.placeOfBirth || 'ក្រុងប៉ោយប៉ែត ខេត្តបន្ទាយមានជ័យ'
  );
  const [photoUrl, setPhotoUrl] = useState<string>(existingStudent?.photoUrl || '');

  // Section II: Grade Level
  const [previousGrade, setPreviousGrade] = useState(existingStudent?.admissionData?.previousGrade || '');
  const [previousYear, setPreviousYear] = useState(existingStudent?.admissionData?.previousYear || '');
  const [previousSchool, setPreviousSchool] = useState(existingStudent?.admissionData?.previousSchool || '');
  const [presentGrade, setPresentGrade] = useState(existingStudent?.admissionData?.presentGrade || '1A');
  const [presentYear, setPresentYear] = useState(existingStudent?.admissionData?.presentYear || '2026-2027');
  const [presentSchool, setPresentSchool] = useState(
    existingStudent?.admissionData?.presentSchool || 'សាលា អ៊ីរ៉ែលកម្ពុជា / BIM School'
  );
  const [studyDays, setStudyDays] = useState(existingStudent?.admissionData?.studyDays || 'ថ្ងៃចន្ទ-ថ្ងៃសុក្រ');
  const [studyHours, setStudyHours] = useState(existingStudent?.admissionData?.studyHours || 'ម៉ោង៧:០០នាទី-១៦:០០នាទី');

  // Section III: Student Health (12 conditions)
  const [healthConditions, setHealthConditions] = useState<{
    malnutrition: { has: boolean; details: string };
    heartCondition: { has: boolean; details: string };
    asthma: { has: boolean; details: string };
    migraine: { has: boolean; details: string };
    diabetes: { has: boolean; details: string };
    dizziness: { has: boolean; details: string };
    behaviorConcerns: { has: boolean; details: string };
    learningConcerns: { has: boolean; details: string };
    hearingConcerns: { has: boolean; details: string };
    visionConcerns: { has: boolean; details: string };
    speechConcerns: { has: boolean; details: string };
    mobilityConcerns: { has: boolean; details: string };
    takesMedication: { has: boolean; details: string };
  }>({
    malnutrition: { has: false, details: '' },
    heartCondition: { has: false, details: '' },
    asthma: { has: false, details: '' },
    migraine: { has: false, details: '' },
    diabetes: { has: false, details: '' },
    dizziness: { has: false, details: '' },
    behaviorConcerns: { has: false, details: '' },
    learningConcerns: { has: false, details: '' },
    hearingConcerns: { has: false, details: '' },
    visionConcerns: { has: false, details: '' },
    speechConcerns: { has: false, details: '' },
    mobilityConcerns: { has: false, details: '' },
    takesMedication: { has: false, details: '' },
  });

  // Section IV: Parents / Caretaker
  const [fatherName, setFatherName] = useState(existingStudent?.admissionData?.father?.name || '');
  const [fatherJob, setFatherJob] = useState(existingStudent?.admissionData?.father?.occupation || '');
  const [fatherPhone, setFatherPhone] = useState(existingStudent?.admissionData?.father?.phone || '');

  const [motherName, setMotherName] = useState(existingStudent?.admissionData?.mother?.name || '');
  const [motherJob, setMotherJob] = useState(existingStudent?.admissionData?.mother?.occupation || '');
  const [motherPhone, setMotherPhone] = useState(existingStudent?.admissionData?.mother?.phone || '');

  const [caretakerName, setCaretakerName] = useState(
    existingStudent?.admissionData?.caretaker?.name || existingStudent?.guardianName || ''
  );
  const [caretakerJob, setCaretakerJob] = useState(existingStudent?.admissionData?.caretaker?.occupation || '');
  const [caretakerPhone, setCaretakerPhone] = useState(
    existingStudent?.admissionData?.caretaker?.phone || existingStudent?.guardianPhone || ''
  );

  const [emergencyRelation, setEmergencyRelation] = useState(
    existingStudent?.admissionData?.emergencyContact?.relationship || 'អ្នកជិតខាង / ជីដូន'
  );
  const [emergencyJob, setEmergencyJob] = useState(existingStudent?.admissionData?.emergencyContact?.occupation || '');
  const [emergencyPhone, setEmergencyPhone] = useState(existingStudent?.admissionData?.emergencyContact?.phone || '');

  const [hasForbiddenPerson, setHasForbiddenPerson] = useState<boolean>(
    existingStudent?.admissionData?.forbiddenPickupPerson?.hasForbiddenPerson || false
  );
  const [forbiddenPersonDetails, setForbiddenPersonDetails] = useState(
    existingStudent?.admissionData?.forbiddenPickupPerson?.details || ''
  );

  // Section V: Services & Address
  const [hasBreakfast, setHasBreakfast] = useState(existingStudent?.admissionData?.services?.breakfast ?? true);
  const [hasLunch, setHasLunch] = useState(existingStudent?.admissionData?.services?.lunch ?? true);
  const [hasEveningFood, setHasEveningFood] = useState(existingStudent?.admissionData?.services?.eveningFood ?? false);
  const [permanentAddress, setPermanentAddress] = useState(
    existingStudent?.address || existingStudent?.admissionData?.permanentAddress || 'ភូមិអូរឫស្សី សង្កាត់អូរឫស្សី ក្រុងប៉ោយប៉ែត'
  );

  // Section VI: Declaration
  const [declarationAccepted, setDeclarationAccepted] = useState(true);
  const [parentSignDate, setParentSignDate] = useState(new Date().toISOString().slice(0, 10));

  // Fee Details
  const [caseType, setCaseType] = useState<'Full' | 'Contribute' | '50%' | 'Free'>(existingStudent?.caseType || 'Full');
  const [monthlyFeeUSD, setMonthlyFeeUSD] = useState<number>(existingStudent?.cash || caseRate(existingStudent?.caseType || 'Full', fullFeeOf(classData[targetClassId || ''])));

  // Duplicate Prevention States
  const [allowDuplicateNameOverride, setAllowDuplicateNameOverride] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live real-time duplicate check
  const duplicateCheck = useMemo(() => {
    return checkDuplicateStudent(
      classData,
      {
        studentCode: studentIdCode,
        nameKhmer,
        dob,
        phone: caretakerPhone || fatherPhone || motherPhone,
      },
      selectedClassId,
      existingStudent?.id
    );
  }, [classData, studentIdCode, nameKhmer, dob, caretakerPhone, fatherPhone, motherPhone, selectedClassId, existingStudent]);

  const SECTIONS = [
    { id: 'pupil', labelKh: 'I. ព័ត៌មានសិស្ស', labelEn: 'Pupil Details', icon: User, color: 'text-amber-600' },
    { id: 'grade', labelKh: 'II. កម្មវិធីសិក្សា', labelEn: 'Grade Level', icon: BookOpen, color: 'text-indigo-600' },
    { id: 'health', labelKh: 'III. សុខភាពកុមារ', labelEn: 'Student Health', icon: Heart, color: 'text-rose-600' },
    { id: 'parents', labelKh: 'IV. មាតាបិតា & អាណាព្យាបាល', labelEn: 'Parents & Caretaker', icon: Users, color: 'text-sky-600' },
    { id: 'other', labelKh: 'V. សេវាកម្ម & អាសយដ្ឋាន', labelEn: 'Services & Address', icon: Utensils, color: 'text-amber-600' },
    { id: 'declaration', labelKh: 'VI. សេចក្តីបញ្ជាក់ & ចុះឈ្មោះ', labelEn: 'Declaration & Confirm', icon: ShieldCheck, color: 'text-emerald-600' },
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId as any);
    const target = document.getElementById(`page-section-${sectionId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 180;
      const sectionIds = ['pupil', 'grade', 'health', 'parents', 'other', 'declaration'];
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(`page-section-${sectionIds[i]}`);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sectionIds[i] as any);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // AI Extraction runner
  const handleRunAiExtraction = async (fileBase64?: string, mimeType?: string, useSample?: boolean) => {
    setIsScanning(true);
    setScanMessage('AI កំពុងវិភាគពាក្យសុំចូលរៀន (Gemini 3.8 Flash)...');
    setScanError(null);

    try {
      const res = await fetch('/api/extract-admission-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          mimeType: mimeType || 'application/pdf',
          useSamplePdf: useSample,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to extract form');
      }

      const data = json.data;

      // Populate extracted fields
      if (data.nameKhmer) setNameKhmer(data.nameKhmer);
      if (data.nameEnglish) setNameEnglish(data.nameEnglish);
      if (data.gender) setGender(data.gender === 'Female' ? 'Female' : 'Man');
      if (data.nationality) setNationality(data.nationality);
      if (data.dob) setDob(data.dob);
      if (data.religion) setReligion(data.religion);
      if (data.studentId) setStudentIdCode(data.studentId);
      if (data.placeOfBirth) setPlaceOfBirth(data.placeOfBirth);

      if (data.previousGrade) setPreviousGrade(data.previousGrade);
      if (data.previousYear) setPreviousYear(data.previousYear);
      if (data.previousSchool) setPreviousSchool(data.previousSchool);
      if (data.presentGrade) {
        setPresentGrade(data.presentGrade);
        const matchClass = Object.keys(classData).find((cid) =>
          cid.toLowerCase().includes(data.presentGrade.toLowerCase())
        );
        if (matchClass) setSelectedClassId(matchClass);
      }
      if (data.presentYear) setPresentYear(data.presentYear);
      if (data.presentSchool) setPresentSchool(data.presentSchool);

      // Health
      if (data.health) {
        setHealthConditions((prev) => {
          const updated = { ...prev };
          Object.keys(data.health).forEach((k) => {
            if ((updated as any)[k]) {
              (updated as any)[k] = {
                has: !!data.health[k]?.hasCondition,
                details: data.health[k]?.details || '',
              };
            }
          });
          if (data.takesMedication !== undefined) {
            updated.takesMedication = {
              has: !!data.takesMedication,
              details: data.medicationDetails || '',
            };
          }
          return updated;
        });
      }

      // Parents
      if (data.father) {
        if (data.father.name) setFatherName(data.father.name);
        if (data.father.occupation) setFatherJob(data.father.occupation);
        if (data.father.phone) setFatherPhone(data.father.phone);
      }
      if (data.mother) {
        if (data.mother.name) setMotherName(data.mother.name);
        if (data.mother.occupation) setMotherJob(data.mother.occupation);
        if (data.mother.phone) setMotherPhone(data.mother.phone);
      }
      if (data.caretaker) {
        if (data.caretaker.name) setCaretakerName(data.caretaker.name);
        if (data.caretaker.occupation) setCaretakerJob(data.caretaker.occupation);
        if (data.caretaker.phone) setCaretakerPhone(data.caretaker.phone);
      }
      if (data.emergencyContact) {
        if (data.emergencyContact.relationship) setEmergencyRelation(data.emergencyContact.relationship);
        if (data.emergencyContact.occupation) setEmergencyJob(data.emergencyContact.occupation);
        if (data.emergencyContact.phone) setEmergencyPhone(data.emergencyContact.phone);
      }
      if (data.forbiddenPickupPerson) {
        setHasForbiddenPerson(!!data.forbiddenPickupPerson.hasForbiddenPerson);
        if (data.forbiddenPickupPerson.details) setForbiddenPersonDetails(data.forbiddenPickupPerson.details);
      }

      // Services & Address
      if (data.services) {
        setHasBreakfast(!!data.services.breakfast);
        setHasLunch(!!data.services.lunch);
        setHasEveningFood(!!data.services.eveningFood);
      }
      if (data.permanentAddress) setPermanentAddress(data.permanentAddress);
      if (data.parentSignDate) setParentSignDate(data.parentSignDate);

      setScanMessage('AI បានស្រង់ព័ត៌មានពីទម្រង់ជោគជ័យ! សូមពិនិត្យផ្ទៀងផ្ទាត់។');
      setTimeout(() => setScanMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
      setScanError(err.message || 'មិនអាចស្រង់ព័ត៌មានបានទេ។');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      handleRunAiExtraction(b64, file.type);
    };
    reader.readAsDataURL(file);
  };

  // Submit and Save Student
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameKhmer.trim()) {
      alert('សូមបញ្ចូលឈ្មោះសិស្សជាភាសាខ្មែរ!');
      return;
    }

    const admissionData: StudentAdmissionData = {
      nameKhmer: nameKhmer.trim(),
      nameEnglish: nameEnglish.trim() || undefined,
      gender,
      nationality: nationality.trim() || 'ខ្មែរ',
      dob,
      religion: religion.trim() || 'ព្រះពុទ្ធ',
      studentIdCode: studentIdCode.trim(),
      placeOfBirth: placeOfBirth.trim(),
      photoUrl,

      previousGrade: previousGrade.trim() || undefined,
      previousYear: previousYear.trim() || undefined,
      previousSchool: previousSchool.trim() || undefined,
      presentGrade: presentGrade.trim() || selectedClassId,
      presentYear: presentYear.trim(),
      presentSchool: presentSchool.trim(),
      studyDays: studyDays.trim(),
      studyHours: studyHours.trim(),

      health: {
        malnutrition: { hasCondition: healthConditions.malnutrition.has, details: healthConditions.malnutrition.details },
        heartCondition: { hasCondition: healthConditions.heartCondition.has, details: healthConditions.heartCondition.details },
        asthma: { hasCondition: healthConditions.asthma.has, details: healthConditions.asthma.details },
        migraine: { hasCondition: healthConditions.migraine.has, details: healthConditions.migraine.details },
        diabetes: { hasCondition: healthConditions.diabetes.has, details: healthConditions.diabetes.details },
        dizziness: { hasCondition: healthConditions.dizziness.has, details: healthConditions.dizziness.details },
        behaviorConcerns: { hasCondition: healthConditions.behaviorConcerns.has, details: healthConditions.behaviorConcerns.details },
        learningConcerns: { hasCondition: healthConditions.learningConcerns.has, details: healthConditions.learningConcerns.details },
        hearingConcerns: { hasCondition: healthConditions.hearingConcerns.has, details: healthConditions.hearingConcerns.details },
        visionConcerns: { hasCondition: healthConditions.visionConcerns.has, details: healthConditions.visionConcerns.details },
        speechConcerns: { hasCondition: healthConditions.speechConcerns.has, details: healthConditions.speechConcerns.details },
        mobilityConcerns: { hasCondition: healthConditions.mobilityConcerns.has, details: healthConditions.mobilityConcerns.details },
        takesMedication: healthConditions.takesMedication.has,
        medicationDetails: healthConditions.takesMedication.details,
      },

      father: {
        name: fatherName.trim() || undefined,
        occupation: fatherJob.trim() || undefined,
        phone: fatherPhone.trim() || undefined,
      },
      mother: {
        name: motherName.trim() || undefined,
        occupation: motherJob.trim() || undefined,
        phone: motherPhone.trim() || undefined,
      },
      caretaker: {
        name: caretakerName.trim() || undefined,
        occupation: caretakerJob.trim() || undefined,
        phone: caretakerPhone.trim() || undefined,
      },
      emergencyContact: {
        relationship: emergencyRelation.trim() || undefined,
        occupation: emergencyJob.trim() || undefined,
        phone: emergencyPhone.trim() || undefined,
      },
      forbiddenPickupPerson: {
        hasForbiddenPerson,
        details: forbiddenPersonDetails.trim() || undefined,
      },

      services: {
        breakfast: hasBreakfast,
        lunch: hasLunch,
        eveningFood: hasEveningFood,
      },
      permanentAddress: permanentAddress.trim(),

      declarationAccepted,
      parentSignDate,
      formScannedUrl: '/assets/aistudio/2.1._____________version3_ac242d81.pdf',
    };

    // DUPLICATE SAFEGUARDS
    if (duplicateCheck.isDuplicateCode) {
      alert(duplicateCheck.errorMessage || t('អត្តលេខសិស្សស្ទួន!', 'Duplicate Student ID!'));
      return;
    }

    if (duplicateCheck.isDuplicateNameInClass && !allowDuplicateNameOverride) {
      alert(t(
        '⚠️ រកឃើញឈ្មោះស្ទួនក្នុងថ្នាក់! សូមគូសបញ្ជាក់ «ខ្ញុំបានផ្ទៀងផ្ទាត់ហើយ...» ឬប្តូរឈ្មោះសិស្សមុននឹងចុះឈ្មោះ។',
        '⚠️ Duplicate student name in this class! Please check the verification checkbox before saving.'
      ));
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (existingStudent) {
        updateStudentFee(selectedClassId, existingStudent.id, {
          name: nameKhmer.trim(),
          latinName: nameEnglish.trim(),
          gender,
          dob,
          phone: caretakerPhone.trim() || fatherPhone.trim() || motherPhone.trim(),
          guardianName: caretakerName.trim() || fatherName.trim() || motherName.trim(),
          guardianPhone: caretakerPhone.trim() || fatherPhone.trim() || motherPhone.trim(),
          address: permanentAddress.trim(),
          nationality,
          religion,
          placeOfBirth,
          admissionData,
        });
        if (onStudentSaved) {
          onStudentSaved({ ...existingStudent, name: nameKhmer.trim(), admissionData });
        }
      } else {
        const res = addStudent(selectedClassId, {
          studentCode: studentIdCode.trim(),
          name: nameKhmer.trim(),
          latinName: nameEnglish.trim() || undefined,
          gender,
          dob,
          phone: caretakerPhone.trim() || fatherPhone.trim() || motherPhone.trim(),
          guardianName: caretakerName.trim() || fatherName.trim() || motherName.trim(),
          guardianPhone: caretakerPhone.trim() || fatherPhone.trim() || motherPhone.trim(),
          address: permanentAddress.trim(),
          nationality,
          religion,
          placeOfBirth,
          note: 'New',
          feesGroup: 'October',
          startDate: new Date().toISOString().slice(0, 10),
          paymentDate: new Date().toISOString().slice(0, 10),
          caseType,
          paidBy: '$ -',
          cash: caseType === 'Free' ? 0 : Number(monthlyFeeUSD) || 0,
          admissionData,
        });

        if (!res.success) {
          setIsSubmitting(false);
          return;
        }

        sendTelegramAlert(
          '📝 ចុះឈ្មោះសិស្សថ្មី (New Student Admission Form)',
          `សិស្ស៖ ${nameKhmer} (${nameEnglish || 'N/A'})\nអត្តលេខ៖ ${studentIdCode.trim()}\nភេទ៖ ${gender === 'Man' ? 'ប្រុស' : 'ស្រី'}\nថ្ងៃកំណើត៖ ${dob}\nថ្នាក់រៀន៖ ${selectedClassId}\nអាណាព្យាបាល៖ ${caretakerName || fatherName || motherName || 'N/A'}\nទូរស័ព្ទ៖ ${caretakerPhone || fatherPhone || motherPhone || 'N/A'}\nអាសយដ្ឋាន៖ ${permanentAddress}\nអ្នកកត់ត្រា៖ ${currentUser.khmerName}`,
          'system',
          nameKhmer,
          `ថ្នាក់ ${selectedClassId}`
        );
      }

      if (onBack) onBack();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* 1. Compact header: title + print / Excel / AI auto-fill in one row */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs px-4 py-3 no-print flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
              title="ត្រឡប់ក្រោយ"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-slate-950" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold font-khmer text-slate-900 leading-tight">
              {t('ពាក្យសុំចូលរៀន / Registration Form', 'Student Admission Form')}
            </h1>
            <div className="text-[11px] text-slate-500 font-khmer">{currentBranch.nameKhmer}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-khmer cursor-pointer" title="ស្កេនទម្រង់ដែលបំពេញរួច ដើម្បីបំពេញស្វ័យប្រវត្តិ (AI)">
            <Upload className="w-3.5 h-3.5" />
            <span>{isScanning ? 'កំពុងស្កេន...' : 'AI អាប់ឡូត Form'}</span>
            <input type="file" accept="application/pdf,image/*" onChange={handleFileUpload} disabled={isScanning} className="hidden" />
          </label>
          <button
            type="button"
            disabled={isScanning}
            onClick={() => handleRunAiExtraction(undefined, 'application/pdf', true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold font-khmer cursor-pointer"
            title="ប្រើទម្រង់គំរូផ្លូវការ (Sample PDF)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>គំរូ</span>
          </button>
          <a
            href="/assets/aistudio/2.1._____________version3_ac242d81.pdf"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs"
            title="PDF ដើម"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>PDF</span>
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold font-khmer cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>បោះពុម្ព</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExcelImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-khmer cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* AI Scan Alerts */}
      {scanMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-khmer flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{scanMessage}</span>
        </div>
      )}
      {scanError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-khmer flex items-center gap-2 shadow-2xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{scanError}</span>
        </div>
      )}

      {/* 2. Slim sticky bar: section shortcuts + target class + student ID */}
      <div className="flex flex-col gap-3">
        <div className="no-print sticky top-16 z-20 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-2 py-1.5 shadow-xs backdrop-blur">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => scrollToSection(sec.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold font-khmer transition ${
                activeSection === sec.id ? 'bg-amber-400 text-slate-950' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {sec.labelKh}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setPresentGrade(e.target.value);
              }}
              className="max-w-[16rem] px-2 py-1 border border-amber-300 rounded-lg text-[11px] font-khmer font-bold bg-amber-50 text-slate-900 cursor-pointer"
              title="ថ្នាក់រៀន (Target Class)"
            >
              {orderedClassList.map((cls) => {
                const bCode = branches.find((b) => b.id === (cls.branchId || 'branch-central'))?.code || 'BIM-01';
                return (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.className} [{bCode}]
                  </option>
                );
              })}
            </select>
            <span className="font-mono text-[11px] font-bold text-indigo-700" title="កូដសិស្ស (ID)">{studentIdCode}</span>
          </div>
        </div>

        {/* Right Column: Single-Page Continuous Form */}
        <form onSubmit={handleSaveStudent} className="pdf-form w-full rounded-2xl border border-slate-300 bg-white shadow-xs">
          {/* SECTION I: PUPIL DETAILS */}
          <div id="page-section-pupil" className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5 scroll-mt-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base font-khmer flex items-center gap-2">
                <User className="w-5 h-5 text-amber-600" />
                <span>I. ព័ត៌មានសិស្ស / Pupil Details</span>
              </h3>
              <div className="text-[11px] text-slate-400 font-mono">BIM Registration Form</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1 font-khmer text-xs">
                  ១. នាម និងគោត្តនាម (Name in Khmer) *
                </label>
                <input
                  type="text"
                  value={nameKhmer}
                  onChange={(e) => {
                    setNameKhmer(e.target.value);
                    setAllowDuplicateNameOverride(false);
                  }}
                  placeholder="ឧ. សុខ ចាន់ថន"
                  className={`w-full px-3 py-2 border rounded-xl font-khmer font-bold text-slate-900 bg-white ${
                    duplicateCheck.isDuplicateNameInClass ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200'
                  }`}
                  required
                />

                {/* DUPLICATE NAME WARNING IN SAME CLASS */}
                {duplicateCheck.isDuplicateNameInClass && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 font-khmer space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>⚠️ រកឃើញឈ្មោះសិស្សស្ទួនក្នុងថ្នាក់ {duplicateCheck.matchedClassName}</span>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      សិស្សឈ្មោះ «{duplicateCheck.matchedStudent?.name}» (អត្តលេខ: <span className="font-mono font-bold">{duplicateCheck.matchedStudent?.studentCode}</span>) មានរួចហើយក្នុងថ្នាក់នេះ។
                    </p>
                    <label className="flex items-center gap-2 pt-1 cursor-pointer font-bold text-amber-950 select-none text-[11px]">
                      <input
                        type="checkbox"
                        checked={allowDuplicateNameOverride}
                        onChange={(e) => setAllowDuplicateNameOverride(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                      />
                      <span>ខ្ញុំបានផ្ទៀងផ្ទាត់ហើយ នេះជាសិស្សផ្សេងគ្នាដែលមានឈ្មោះដូចគ្នា</span>
                    </label>
                  </div>
                )}

                {/* DUPLICATE NAME IN ANOTHER CLASS (INFORMATIONAL) */}
                {duplicateCheck.isDuplicateNameCrossClass && !duplicateCheck.isDuplicateNameInClass && (
                  <div className="mt-2 p-2 bg-sky-50 border border-sky-300 rounded-xl text-xs text-sky-950 font-khmer flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="text-[11px]">{duplicateCheck.warningMessage}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">
                  ២. ឈ្មោះអក្សរឡាតាំង (Name in English)
                </label>
                <input
                  type="text"
                  value={nameEnglish}
                  onChange={(e) => setNameEnglish(e.target.value)}
                  placeholder="e.g. SOK CHANTHORN"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-900 bg-white uppercase text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1 font-khmer text-xs">
                  ភេទ (Sex) *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-khmer bg-white text-xs"
                >
                  <option value="Man">ប្រុស (Male)</option>
                  <option value="Female">ស្រី (Female)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 font-khmer text-xs">
                  សញ្ជាតិ (Nationality)
                </label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-khmer bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 font-khmer text-xs">
                  ៣. ថ្ងៃ.ខែ.ឆ្នាំកំណើត *
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono bg-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 font-khmer text-xs">
                  សាសនា (Religion)
                </label>
                <input
                  type="text"
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-khmer bg-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1 font-khmer text-xs">
                  ៤. ID សិស្ស (Student ID) *
                </label>
                <input
                  type="text"
                  value={studentIdCode}
                  onChange={(e) => setStudentIdCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-indigo-700 bg-white text-xs"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1 font-khmer text-xs">
                  ៥. ទីកន្លែងកំណើត (Place of Birth) *
                </label>
                <input
                  type="text"
                  value={placeOfBirth}
                  onChange={(e) => setPlaceOfBirth(e.target.value)}
                  placeholder="ភូមិ... ឃុំ/សង្កាត់... ក្រុង/ស្រុក... ខេត្ត..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-khmer bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION II: GRADE LEVEL */}
          <div id="page-section-grade" className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5 scroll-mt-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base font-khmer flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>II. កម្មវិធីសិក្សា / GRADE LEVEL</span>
              </h3>
              <div className="text-[11px] text-slate-400 font-mono">Academic Enrollment</div>
            </div>

            {/* Previous Schooling */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <span className="font-bold text-xs text-slate-800 font-khmer block">
                ១. កម្រិតថ្នាក់ឆ្នាំចាស់ (Previous Grade & School)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1 font-khmer">
                    កម្រិតថ្នាក់ចាស់ (Previous Grade)
                  </label>
                  <input
                    type="text"
                    value={previousGrade}
                    onChange={(e) => setPreviousGrade(e.target.value)}
                    placeholder="ឧ. មត្តេយ្យ, ថ្នាក់ទី១..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1 font-khmer">
                    ឆ្នាំសិក្សា (Year)
                  </label>
                  <input
                    type="text"
                    value={previousYear}
                    onChange={(e) => setPreviousYear(e.target.value)}
                    placeholder="ឧ. 2025-2026"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1 font-khmer">
                    ឈ្មោះសាលាចាស់ (School Name)
                  </label>
                  <input
                    type="text"
                    value={previousSchool}
                    onChange={(e) => setPreviousSchool(e.target.value)}
                    placeholder="ឧ. សាលាបឋមសិក្សា..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Present Schooling */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
              <span className="font-bold text-xs text-amber-950 font-khmer block">
                ២. កម្រិតថ្នាក់បច្ចុប្បន្ន (Present Grade & Schedule)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold text-[11px] mb-1 font-khmer">
                    ថ្នាក់រៀនក្នុងប្រព័ន្ធ (Class / Grade) *
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setPresentGrade(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl text-xs font-khmer font-bold bg-white text-slate-900"
                  >
                    {orderedClassList.map((cls) => {
                      const bCode = branches.find((b) => b.id === (cls.branchId || 'branch-central'))?.code || 'BIM-01';
                      return (
                        <option key={cls.classId} value={cls.classId}>
                          {cls.className} [{bCode}] ({cls.period})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 text-[11px] mb-1 font-khmer">
                    ឆ្នាំសិក្សា (Year)
                  </label>
                  <input
                    type="text"
                    value={presentYear}
                    onChange={(e) => setPresentYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-[11px] mb-1 font-khmer">
                    ឈ្មោះសាលា (School Name)
                  </label>
                  <input
                    type="text"
                    value={presentSchool}
                    onChange={(e) => setPresentSchool(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer bg-white font-bold text-amber-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-700 text-[11px] mb-1 font-khmer">
                    ៣. ថ្ងៃសិក្សា (Day)
                  </label>
                  <input
                    type="text"
                    value={studyDays}
                    onChange={(e) => setStudyDays(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-[11px] mb-1 font-khmer">
                    ម៉ោងសិក្សា (Time)
                  </label>
                  <input
                    type="text"
                    value={studyHours}
                    onChange={(e) => setStudyHours(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-khmer bg-white font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION III: STUDENT HEALTH (12 Conditions) */}
          <div id="page-section-health" className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5 scroll-mt-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base font-khmer flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-600" />
                  <span>III. ព័ត៌មានសុខភាពកុមារ / Student Health Section</span>
                </h3>
                <p className="text-xs text-slate-500 font-khmer mt-0.5">
                  តើកូនរបស់អ្នកមានបញ្ហាដូចខាងក្រោមនេះដែរឬទេ? (Does your child suffer from any of the following?)
                </p>
              </div>
            </div>

            {/* Conditions List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[
                { key: 'malnutrition', kh: 'កង្វះអាហារូបត្ថម្ភ', en: 'Malnutrition (lack of food)' },
                { key: 'heartCondition', kh: 'ស្ថានភាពបេះដូង', en: 'Heart condition' },
                { key: 'asthma', kh: 'ជំងឺហឺត (បញ្ហាផ្លូវដង្ហើម)', en: 'Asthma (breathing issues)' },
                { key: 'migraine', kh: 'ជំងឺឈឺក្បាលប្រកាំង', en: 'Migraine' },
                { key: 'diabetes', kh: 'ជំងឺទឹកនោមផ្អែម (ជាតិស្ករក្នុងឈាម)', en: 'Diabetes (sugar in the blood)' },
                { key: 'dizziness', kh: 'វិលមុខ ងងឹតមុខ ដួលសន្លប់', en: 'Dizziness/Black Outs/Fainting' },
                { key: 'behaviorConcerns', kh: 'បញ្ហាអាកប្បកិរិយា', en: 'Behavior Concerns' },
                { key: 'learningConcerns', kh: 'បញ្ហាការសិក្សា', en: 'Learning Concerns' },
                { key: 'hearingConcerns', kh: 'បញ្ហាការស្តាប់', en: 'Hearing Concerns' },
                { key: 'visionConcerns', kh: 'បញ្ហាការមើល', en: 'Vision Concerns' },
                { key: 'speechConcerns', kh: 'បញ្ហាការនិយាយស្តី', en: 'Speech Concerns' },
                { key: 'mobilityConcerns', kh: 'បញ្ហាការចល័ត', en: 'Mobility Concerns' },
              ].map((item) => {
                const state = (healthConditions as any)[item.key];
                return (
                  <div
                    key={item.key}
                    className={`p-3 rounded-xl border transition-all ${
                      state.has ? 'bg-rose-50/70 border-rose-300' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-slate-900 font-khmer">{item.kh}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{item.en}</div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setHealthConditions((prev) => ({
                              ...prev,
                              [item.key]: { ...prev[item.key as keyof typeof prev], has: false, details: '' },
                            }))
                          }
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold cursor-pointer ${
                            !state.has ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setHealthConditions((prev) => ({
                              ...prev,
                              [item.key]: { ...prev[item.key as keyof typeof prev], has: true },
                            }))
                          }
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold cursor-pointer ${
                            state.has ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          Yes
                        </button>
                      </div>
                    </div>

                    {state.has && (
                      <input
                        type="text"
                        placeholder="សូមបញ្ជាក់លម្អិត (Please specify)..."
                        value={state.details}
                        onChange={(e) =>
                          setHealthConditions((prev) => ({
                            ...prev,
                            [item.key]: { ...prev[item.key as keyof typeof prev], details: e.target.value },
                          }))
                        }
                        className="w-full mt-2 px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-khmer text-slate-900"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Medication */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 font-khmer">
                    តើកូនរបស់អ្នកលេបថ្នាំណាមួយទេ? (Does child take medication?)
                  </span>
                  <span className="block text-[10px] text-slate-500 font-khmer">
                    បើមាន សូមរាយបញ្ជី និងបញ្ជាក់ថាតើថ្នាំណាដែលត្រូវលេបប្រចាំថ្ងៃ ឬជាចាំបាច់
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setHealthConditions((prev) => ({
                        ...prev,
                        takesMedication: { has: false, details: '' },
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                      !healthConditions.takesMedication.has
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setHealthConditions((prev) => ({
                        ...prev,
                        takesMedication: { has: true, details: prev.takesMedication.details },
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                      healthConditions.takesMedication.has
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {healthConditions.takesMedication.has && (
                <input
                  type="text"
                  placeholder="រាយបញ្ជីឈ្មោះថ្នាំ និងការប្រើប្រាស់ (Medication names & schedule)..."
                  value={healthConditions.takesMedication.details}
                  onChange={(e) =>
                    setHealthConditions((prev) => ({
                      ...prev,
                      takesMedication: { ...prev.takesMedication, details: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-khmer"
                />
              )}
            </div>
          </div>

          {/* SECTION IV: PARENTS & CARETAKER */}
          <div id="page-section-parents" className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5 scroll-mt-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base font-khmer flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>IV. ព័ត៌មានមាតាបិតា & អាណាព្យាបាល / Parents & Caretaker's Details</span>
              </h3>
            </div>

            {/* Father */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-xs text-slate-800 font-khmer">១. ព័ត៌មានឪពុក (Father)</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 font-khmer mb-0.5">ឪពុកឈ្មោះ</label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="ឧ. សុខ សំអាត"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-khmer mb-0.5">មុខរបរ (Occupation)</label>
                  <input
                    type="text"
                    value={fatherJob}
                    onChange={(e) => setFatherJob(e.target.value)}
                    placeholder="ឧ. កសិករ, អាជីវករ..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-khmer mb-0.5">លេខទូរស័ព្ទ / Tel</label>
                  <input
                    type="text"
                    value={fatherPhone}
                    onChange={(e) => setFatherPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Mother */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-xs text-slate-800 font-khmer">២. ព័ត៌មានម្តាយ (Mother)</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 font-khmer mb-0.5">ម្តាយឈ្មោះ</label>
                  <input
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder="ឧ. ហេង សុផល"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-khmer mb-0.5">មុខរបរ (Occupation)</label>
                  <input
                    type="text"
                    value={motherJob}
                    onChange={(e) => setMotherJob(e.target.value)}
                    placeholder="ឧ. មេផ្ទះ, លក់ដូរ..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-khmer mb-0.5">លេខទូរស័ព្ទ / Tel</label>
                  <input
                    type="text"
                    value={motherPhone}
                    onChange={(e) => setMotherPhone(e.target.value)}
                    placeholder="097 888 999"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Caretaker */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-xs text-slate-800 font-khmer">៣. អាណាព្យាបាល (Caretaker)</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 font-khmer mb-0.5">អាណាព្យាបាលឈ្មោះ</label>
                  <input
                    type="text"
                    value={caretakerName}
                    onChange={(e) => setCaretakerName(e.target.value)}
                    placeholder="ឧ. ហេង សុផល (ម្តាយ)"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-khmer mb-0.5">មុខរបរ (Occupation)</label>
                  <input
                    type="text"
                    value={caretakerJob}
                    onChange={(e) => setCaretakerJob(e.target.value)}
                    placeholder="ឧ. មេផ្ទះ..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-khmer mb-0.5">លេខទូរស័ព្ទ / Tel</label>
                  <input
                    type="text"
                    value={caretakerPhone}
                    onChange={(e) => setCaretakerPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-xs text-slate-800 font-khmer">
                ៤. អ្នកជិតខាងដែលអាចទាក់ទងបាន (Emergency Contact)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 font-khmer mb-0.5">
                    ទំនាក់ទំនង (Relationship)
                  </label>
                  <input
                    type="text"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-khmer mb-0.5">មុខរបរ (Occupation)</label>
                  <input
                    type="text"
                    value={emergencyJob}
                    onChange={(e) => setEmergencyJob(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-khmer bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-khmer mb-0.5">លេខទូរស័ព្ទ / Tel</label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Forbidden Pickup Person */}
            <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-rose-950 font-khmer">
                  ៥. តើមានបុគ្គលដែលហាមមិនអោយជួប ឬមកទទួលកុមារដែរឬទេ?
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setHasForbiddenPerson(false)}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold cursor-pointer ${
                      !hasForbiddenPerson ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasForbiddenPerson(true)}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold cursor-pointer ${
                      hasForbiddenPerson ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {hasForbiddenPerson && (
                <input
                  type="text"
                  placeholder="សូមបញ្ជាក់ឈ្មោះ និងមូលហេតុ (Person's name and details)..."
                  value={forbiddenPersonDetails}
                  onChange={(e) => setForbiddenPersonDetails(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs font-khmer"
                />
              )}
            </div>
          </div>

          {/* SECTION V: SERVICES & ADDRESS */}
          <div id="page-section-other" className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5 scroll-mt-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base font-khmer flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-600" />
                <span>V. សេវាកម្មផ្សេងៗ & អាសយដ្ឋាន / Other Services</span>
              </h3>
            </div>

            {/* Meals Service */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="font-bold text-xs text-slate-900 font-khmer block">
                ១. សេវាអាហារសាលា (School Meal Services)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-amber-400">
                  <input
                    type="checkbox"
                    checked={hasBreakfast}
                    onChange={(e) => setHasBreakfast(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs font-khmer text-slate-900">អាហារពេលព្រឹក</span>
                    <span className="block text-[10px] text-slate-400 font-sans">Breakfast</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-amber-400">
                  <input
                    type="checkbox"
                    checked={hasLunch}
                    onChange={(e) => setHasLunch(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs font-khmer text-slate-900">អាហារថ្ងៃត្រង់</span>
                    <span className="block text-[10px] text-slate-400 font-sans">Lunch</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-amber-400">
                  <input
                    type="checkbox"
                    checked={hasEveningFood}
                    onChange={(e) => setHasEveningFood(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs font-khmer text-slate-900">អាហារពេលល្ងាច</span>
                    <span className="block text-[10px] text-slate-400 font-sans">Evening Food</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Permanent Address */}
            <div>
              <label className="block text-slate-800 font-bold mb-1 font-khmer text-xs">
                អាសយដ្ឋានបច្ចុប្បន្ន (Permanent Address) *
              </label>
              <textarea
                rows={3}
                value={permanentAddress}
                onChange={(e) => setPermanentAddress(e.target.value)}
                placeholder="ភូមិ... ឃុំ/សង្កាត់... ក្រុង/ស្រុក... ខេត្ត..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-khmer text-xs bg-white text-slate-900"
                required
              />
            </div>

            {/* Fee and Case Type */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
              <div>
                <label className="block text-slate-800 font-bold mb-1 font-khmer text-xs">
                  ប្រភេទថ្លៃសិក្សា (Tuition Case Type)
                </label>
                <select
                  value={caseType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setCaseType(val);
                    setMonthlyFeeUSD(caseRate(val, fullFeeOf(classData[selectedClassId])));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-khmer bg-white"
                >
                  {TUITION_CASES.map((c) => (
                    <option key={c.value} value={c.value}>{caseOptionLabel(c, fullFeeOf(classData[selectedClassId]))}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1 font-khmer text-xs">
                  តម្លៃក្នុង ១ខែ ($ USD)
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={monthlyFeeUSD}
                  onChange={(e) => setMonthlyFeeUSD(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION VI: DECLARATION & ENROLL */}
          <div id="page-section-declaration" className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5 scroll-mt-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base font-khmer flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>VI. សេចក្តីបញ្ជាក់ & ចុះឈ្មោះ / Declaration & Confirmation</span>
              </h3>
            </div>

            {/* Official Declaration Text Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-3 font-khmer text-slate-700 leading-relaxed">
              <p>
                សូមបញ្ជាក់ថាខ្ញុំពិតជាបានយល់យ៉ាងច្បាស់លាស់ពី <strong>{settings.schoolNameKhmer} ({currentBranch.nameKhmer})</strong> ហើយក៏ទទួលបានការណែនាំពីការបំពេញពាក្យសុំចូលរៀននេះបានយ៉ាងត្រឹមត្រូវ។ ខ្ញុំសូមធានាអះអាងថារាល់ព័ត៌មានដែលបានផ្តល់ឱ្យសាលាពិតជាត្រឹមត្រូវ ហើយខ្ញុំគឺជាមាតាបិតារបស់សិស្សផ្ទាល់។
              </p>
              <p className="text-slate-500 font-sans text-[11px]">
                Please note that I have a clear understanding about BIM School Cambodia and I have received more instructions on how to complete this application properly. I certify that all information provided to the school is accurate and that I am the parent of the student certainly.
              </p>

              <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-[11px] font-khmer mb-1">
                    កាលបរិច្ឆេទ (Declaration Date)
                  </label>
                  <input
                    type="date"
                    value={parentSignDate}
                    onChange={(e) => setParentSignDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] font-khmer mb-1">
                    អ្នកធានា / មាតាបិតា
                  </label>
                  <div className="px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-100 font-bold text-slate-900">
                    {caretakerName || fatherName || motherName || 'មាតាបិតាសិស្ស'}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Preview Box */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <span className="font-bold text-xs text-amber-950 font-khmer block">
                ព័ត៌មានសង្ខេបសម្រាប់ការចុះឈ្មោះ (Registration Summary)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-khmer">
                <div>សិស្ស៖ <strong>{nameKhmer || '---'}</strong></div>
                <div>អក្សរឡាតាំង៖ <strong className="font-mono">{nameEnglish || '---'}</strong></div>
                <div>កូដសិស្ស៖ <strong className="font-mono text-indigo-700">{studentIdCode}</strong></div>
                <div>ថ្នាក់រៀន៖ <strong className="font-mono text-emerald-800">{selectedClassId}</strong></div>
              </div>
            </div>
          </div>

          {/* Sticky Form Actions Footer */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-md px-4 py-2 border-t border-slate-200 rounded-b-2xl shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex items-center justify-between gap-3 z-20">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-khmer">
              <span>សាខា៖</span>
              <strong className="text-slate-800">{currentBranch.nameKhmer}</strong>
            </div>

            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-khmer cursor-pointer text-xs font-semibold"
                >
                  បោះបង់ / ត្រឡប់ក្រោយ
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold font-khmer text-xs shadow-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{existingStudent ? 'រក្សាទុកការកែប្រែ' : 'ចុះឈ្មោះសិស្សចូលរៀន'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Excel Batch Student Import Modal */}
      <ExcelStudentImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        defaultTargetClassId={selectedClassId}
      />
    </div>
  );
};
