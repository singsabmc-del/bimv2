import React, { useState } from 'react';
import { StudentFeeRecord } from '../types';
import { useApp } from '../context/AppContext';
import {
  Printer,
  Edit2,
  Check,
  X,
  Share2,
  Download,
  Sparkles,
  Camera,
  FileText,
  User,
  GraduationCap,
  Calendar,
  Phone,
  MapPin,
  Save,
} from 'lucide-react';

interface StudentGeneralInfoDocumentProps {
  student: StudentFeeRecord;
  className?: string;
  onUpdateStudent?: (updated: Partial<StudentFeeRecord>) => void;
  allowEdit?: boolean;
}

export const StudentGeneralInfoDocument: React.FC<StudentGeneralInfoDocumentProps> = ({
  student,
  className,
  onUpdateStudent,
  allowEdit = true,
}) => {
  const { settings, currentBranch, permissions, updateStudentFee } = useApp();
  const [isEditing, setIsEditing] = useState(false);

  // Form local state for editing
  const [formData, setFormData] = useState({
    name: student.name || '',
    latinName: student.latinName || '',
    gender: student.gender || 'Man',
    nationality: student.nationality || student.admissionData?.pupil?.nationality || 'ខ្មែរ',
    dob: student.dob || student.admissionData?.pupil?.dob || '6/26/2020',
    religion: student.religion || student.admissionData?.pupil?.religion || 'ព្រះពុទ្ធ',
    studentCode: student.studentCode || '000001',
    placeOfBirth: student.placeOfBirth || student.admissionData?.pupil?.placeOfBirth || student.address || 'ភូមិអូរឫស្សី សង្កាត់អូរឫស្សី ក្រុងប៉ោយប៉ែត ខេត្តបន្ទាយមានជ័យ',
    
    // Grade Level
    previousGrade: student.admissionData?.gradeLevel?.previousGrade || 'មត្តេយ្យ',
    previousYear: student.admissionData?.gradeLevel?.previousYear || '២០២៥-២០២៦',
    previousSchool: student.admissionData?.gradeLevel?.previousSchool || 'សាលាបឋមសិក្សាអូរឫស្សី',
    presentGrade: student.admissionData?.gradeLevel?.presentGrade || className || 'ថ្នាក់ទី១',
    presentYear: student.admissionData?.gradeLevel?.presentYear || '២០២៦-២០២៧',
    presentSchool: student.admissionData?.gradeLevel?.presentSchool || 'BIM School',
    studyDays: student.admissionData?.gradeLevel?.studyDays || 'ថ្ងៃចន្ទ-ថ្ងៃសុក្រ',
    studyHours: student.admissionData?.gradeLevel?.studyHours || 'ម៉ោង៧:០០នាទី-១៦:០០នាទី',
    
    // Photo
    photoUrl: (student as any).avatar || student.admissionData?.photoUrl || '',
  });

  // Section III: Health Data State
  const [healthData, setHealthData] = useState<Record<string, { hasCondition: boolean; details?: string }>>({
    malnutrition: student.admissionData?.health?.malnutrition || { hasCondition: false, details: '' },
    heartCondition: student.admissionData?.health?.heartCondition || { hasCondition: false, details: '' },
    asthma: student.admissionData?.health?.asthma || { hasCondition: false, details: '' },
    migraine: student.admissionData?.health?.migraine || { hasCondition: false, details: '' },
    diabetes: student.admissionData?.health?.diabetes || { hasCondition: false, details: '' },
    dizziness: student.admissionData?.health?.dizziness || { hasCondition: false, details: '' },
    behaviorConcerns: student.admissionData?.health?.behaviorConcerns || { hasCondition: false, details: '' },
    learningConcerns: student.admissionData?.health?.learningConcerns || { hasCondition: false, details: '' },
    hearingConcerns: student.admissionData?.health?.hearingConcerns || { hasCondition: false, details: '' },
    visionConcerns: student.admissionData?.health?.visionConcerns || { hasCondition: false, details: '' },
    speechConcerns: student.admissionData?.health?.speechConcerns || { hasCondition: false, details: '' },
    mobilityConcerns: student.admissionData?.health?.mobilityConcerns || { hasCondition: false, details: '' },
  });

  const [takesMedication, setTakesMedication] = useState<boolean>(
    student.admissionData?.health?.takesMedication || false
  );
  const [medicationDetails, setMedicationDetails] = useState<string>(
    student.admissionData?.health?.medicationDetails || ''
  );

  // Section IV: Parents & Caretaker State
  const [parentsData, setParentsData] = useState({
    fatherName: student.admissionData?.parents?.father?.name || student.admissionData?.father?.name || '',
    fatherOccupation: student.admissionData?.parents?.father?.occupation || student.admissionData?.father?.occupation || 'កសិករ',
    fatherPhone: student.admissionData?.parents?.father?.phone || student.admissionData?.father?.phone || '',
    fatherPhoto: student.admissionData?.parents?.father?.photoUrl || student.admissionData?.father?.photoUrl || '',

    motherName: student.admissionData?.parents?.mother?.name || student.admissionData?.mother?.name || '',
    motherOccupation: student.admissionData?.parents?.mother?.occupation || student.admissionData?.mother?.occupation || 'មេផ្ទះ',
    motherPhone: student.admissionData?.parents?.mother?.phone || student.admissionData?.mother?.phone || '',
    motherPhoto: student.admissionData?.parents?.mother?.photoUrl || student.admissionData?.mother?.photoUrl || '',

    caretakerName: student.admissionData?.parents?.caretaker?.name || student.admissionData?.caretaker?.name || student.guardianName || '',
    caretakerOccupation: student.admissionData?.parents?.caretaker?.occupation || student.admissionData?.caretaker?.occupation || 'អាជីវករ',
    caretakerPhone: student.admissionData?.parents?.caretaker?.phone || student.admissionData?.caretaker?.phone || student.phone || '',
    caretakerPhoto: student.admissionData?.parents?.caretaker?.photoUrl || student.admissionData?.caretaker?.photoUrl || '',

    emergencyRelationship: student.admissionData?.parents?.emergencyContact?.relationship || student.admissionData?.emergencyContact?.relationship || 'អ្នកជិតខាង',
    emergencyOccupation: student.admissionData?.parents?.emergencyContact?.occupation || student.admissionData?.emergencyContact?.occupation || 'អាជីវករ',
    emergencyPhone: student.admissionData?.parents?.emergencyContact?.phone || student.admissionData?.emergencyContact?.phone || '',

    hasForbiddenPerson: student.admissionData?.parents?.forbiddenPickupPerson?.hasForbiddenPerson || student.admissionData?.forbiddenPickupPerson?.hasForbiddenPerson || false,
    forbiddenPersonDetails: student.admissionData?.parents?.forbiddenPickupPerson?.details || student.admissionData?.forbiddenPickupPerson?.details || '',
  });

  // Section V: Services & Meals
  const [servicesData, setServicesData] = useState({
    breakfast: student.admissionData?.services?.breakfast ?? true,
    lunch: student.admissionData?.services?.lunch ?? true,
    eveningFood: student.admissionData?.services?.eveningFood ?? false,
  });

  const [permanentAddress, setPermanentAddress] = useState<string>(
    student.admissionData?.permanentAddress || student.address || student.placeOfBirth || 'ភូមិអូរឫស្សី សង្កាត់អូរឫស្សី ក្រុងប៉ោយប៉ែត ខេត្តបន្ទាយមានជ័យ'
  );

  // Extract up to 6 digits for the segmented ID boxes
  const rawCode = (formData.studentCode || '').replace(/\D/g, '');
  const paddedCode = rawCode ? rawCode.padStart(6, '0').slice(-6) : '000001';
  const idDigits = paddedCode.split('');

  const handleSave = () => {
    if (onUpdateStudent) {
      onUpdateStudent({
        name: formData.name,
        latinName: formData.latinName,
        gender: formData.gender as 'Man' | 'Female',
        nationality: formData.nationality,
        dob: formData.dob,
        religion: formData.religion,
        studentCode: formData.studentCode,
        placeOfBirth: formData.placeOfBirth,
        address: permanentAddress || formData.placeOfBirth,
        guardianName: parentsData.caretakerName || parentsData.fatherName || student.guardianName,
        phone: parentsData.caretakerPhone || parentsData.fatherPhone || student.phone,
        admissionData: {
          ...student.admissionData,
          photoUrl: formData.photoUrl,
          permanentAddress,
          services: servicesData,
          pupil: {
            ...student.admissionData?.pupil,
            nameKhmer: formData.name,
            nameEnglish: formData.latinName,
            gender: formData.gender as 'Man' | 'Female',
            nationality: formData.nationality,
            dob: formData.dob,
            religion: formData.religion,
            studentId: formData.studentCode,
            placeOfBirth: formData.placeOfBirth,
          },
          gradeLevel: {
            ...student.admissionData?.gradeLevel,
            previousGrade: formData.previousGrade,
            previousYear: formData.previousYear,
            previousSchool: formData.previousSchool,
            presentGrade: formData.presentGrade,
            presentYear: formData.presentYear,
            presentSchool: formData.presentSchool,
            studyDays: formData.studyDays,
            studyHours: formData.studyHours,
          },
          health: {
            malnutrition: healthData.malnutrition,
            heartCondition: healthData.heartCondition,
            asthma: healthData.asthma,
            migraine: healthData.migraine,
            diabetes: healthData.diabetes,
            dizziness: healthData.dizziness,
            behaviorConcerns: healthData.behaviorConcerns,
            learningConcerns: healthData.learningConcerns,
            hearingConcerns: healthData.hearingConcerns,
            visionConcerns: healthData.visionConcerns,
            speechConcerns: healthData.speechConcerns,
            mobilityConcerns: healthData.mobilityConcerns,
            takesMedication,
            medicationDetails,
          },
          parents: {
            father: {
              name: parentsData.fatherName,
              occupation: parentsData.fatherOccupation,
              phone: parentsData.fatherPhone,
              photoUrl: parentsData.fatherPhoto,
            },
            mother: {
              name: parentsData.motherName,
              occupation: parentsData.motherOccupation,
              phone: parentsData.motherPhone,
              photoUrl: parentsData.motherPhoto,
            },
            caretaker: {
              name: parentsData.caretakerName,
              occupation: parentsData.caretakerOccupation,
              phone: parentsData.caretakerPhone,
              photoUrl: parentsData.caretakerPhoto,
            },
            emergencyContact: {
              relationship: parentsData.emergencyRelationship,
              occupation: parentsData.emergencyOccupation,
              phone: parentsData.emergencyPhone,
            },
            forbiddenPickupPerson: {
              hasForbiddenPerson: parentsData.hasForbiddenPerson,
              details: parentsData.forbiddenPersonDetails,
            },
          },
        },
      });
    }
    setIsEditing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Control Action Bar (Hidden on print) */}
      <div className="no-print flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs font-khmer">
            A4
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900 font-khmer">
              ទម្រង់ពាក្យសុំចូលរៀនផ្លូវការ (Official Registration Form)
            </div>
            <div className="text-[11px] text-slate-500 font-khmer">
              ផ្អែកតាមទម្រង់ដើមរបស់ សាលា អ៊ីរ៉ែលកម្ពុជា · BIM School
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allowEdit && permissions.canEdit && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold font-khmer flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>កែសម្រួលទិន្នន័យ (Edit)</span>
            </button>
          )}

          {isEditing && (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold font-khmer flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>បោះបង់</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold font-khmer flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>រក្សាទុក (Save)</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold font-khmer flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>បោះពុម្ពទម្រង់ (Print A4)</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT SHEET (Exact Replication of Image image_1d7d19d3.png) */}
      <div className="bg-white border border-slate-300 shadow-md rounded-lg p-8 sm:p-10 max-w-[850px] mx-auto text-slate-900 font-sans print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="flex items-start justify-between gap-4 pb-4">
          
          {/* Left: BIM Love Without Boundaries Round Logo */}
          <div className="shrink-0 pt-1">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#E5971A] p-2 flex items-center justify-center shadow-xs">
              {/* LWB Emblem: Outer Crimson Heart & Inner Teal Heart */}
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
                {/* Outer Crimson Heart Outline */}
                <path
                  d="M50 84 C26 64 12 48 12 32 C12 18 24 10 36 10 C43 10 48 14 50 18 C52 14 57 10 64 10 C76 10 88 18 88 32 C88 48 74 64 50 84 Z"
                  fill="none"
                  stroke="#9C1D24"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Inner Teal Heart Outline */}
                <path
                  d="M50 72 C33 56 24 44 24 33 C24 23 31 18 39 18 C44 18 48 21 50 24 C52 21 56 18 61 18 C69 18 76 23 76 33 C76 44 67 56 50 72 Z"
                  fill="none"
                  stroke="#27B4A3"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Center: School Name & Full Official Contact Info */}
          <div className="flex-1 text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D4ED8] font-khmer tracking-normal">
              សាលាអ៊ីរ៉ែលកម្ពុជា
            </h1>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1D4ED8] tracking-wide font-sans">
              BIM School
            </h2>
            <div className="text-[11px] sm:text-xs text-slate-800 leading-snug pt-1 font-serif">
              <p>
                <strong className="font-semibold">Address : </strong>
                O reangsei Village, Sorngkat O reangsei,Poi Pet City, Banteay MeanChey Province, Kingdom of Cambodia.
              </p>
              <p className="pt-0.5">
                <strong className="font-semibold">Website : </strong>
                <a
                  href="https://www.lovewithoutboundaries.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1D4ED8] underline font-medium hover:text-blue-800"
                >
                  www.lovewithoutboundaries.com
                </a>
              </p>
              <p className="pt-0.5">
                <strong className="font-semibold">Email : </strong>
                <a
                  href="mailto:sokleng.in@lwbmail.com"
                  className="text-[#1D4ED8] underline font-medium hover:text-blue-800"
                >
                  sokleng.in@lwbmail.com
                </a>
              </p>
              <p className="pt-0.5">
                <strong className="font-semibold">Tel : </strong>
                088 756 191 2/071 45 35 710/067 444 288
              </p>
            </div>
          </div>

          {/* Right: 4*6 Photo Box and Segmented 6-digit ID */}
          <div className="shrink-0 flex flex-col items-center space-y-2 pt-1">
            {/* 4*6 Photo Box */}
            <div className="w-[88px] h-[116px] bg-[#E8F0FE] border border-[#CBD5E1] rounded-xs flex items-center justify-center text-slate-500 font-bold text-sm overflow-hidden relative shadow-2xs">
              {formData.photoUrl ? (
                <img
                  src={formData.photoUrl}
                  alt={formData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-600 font-sans tracking-widest text-sm font-semibold">
                  4*6
                </span>
              )}
              {isEditing && (
                <label className="absolute inset-0 bg-black/40 hover:bg-black/50 flex flex-col items-center justify-center text-white cursor-pointer text-[10px] font-khmer">
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span>ប្តូររូប</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () =>
                          setFormData({ ...formData, photoUrl: reader.result as string });
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {/* Segmented 6-Digit ID Box: ID [ ][ ][ ][ ][ ][ ] */}
            <div className="flex items-center gap-1 pt-1">
              <span className="font-bold text-xs sm:text-sm text-slate-900 tracking-wider mr-0.5">
                ID
              </span>
              <div className="flex items-center gap-1">
                {idDigits.map((digit, idx) => (
                  <div
                    key={idx}
                    className="w-5 h-7 sm:w-6 sm:h-8 bg-[#E8F0FE] border border-[#BFDBFE] rounded-[2px] flex items-center justify-center font-mono font-bold text-xs sm:text-sm text-slate-800"
                  >
                    {digit}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= DOCUMENT TITLE ================= */}
        <div className="text-center my-4 space-y-0.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1D4ED8] font-khmer tracking-wide">
            ពាក្យសុំចូលរៀន
          </h2>
          <div className="text-base sm:text-lg font-bold text-[#1D4ED8] underline decoration-2 underline-offset-4 tracking-normal">
            Registration Form
          </div>
        </div>

        {/* ================= SECTION I: PUPIL DETAILS ================= */}
        <div className="mt-4 space-y-2.5">
          {/* Solid Yellow Banner */}
          <div className="bg-[#F59E0B] px-3.5 py-1.5 rounded-[3px] shadow-2xs">
            <h3 className="font-extrabold text-sm sm:text-base text-[#991B1B] font-khmer tracking-wide">
              I. ព័ត៌មានសិស្ស / Pupil Details
            </h3>
          </div>

          <div className="space-y-2 text-xs sm:text-[13px] text-slate-900 font-serif">
            
            {/* Row 1: Name in Khmer + Gender */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <div className="min-w-[130px] sm:min-w-[145px] shrink-0 font-khmer">
                  <div className="font-bold text-slate-900 leading-tight">១. នាម និងគោត្តនាម:</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Name in Khmer:</div>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 min-h-[34px] flex items-center">
                    {formData.name || student.name}
                  </div>
                )}
              </div>

              {/* Gender Checkboxes */}
              <div className="flex items-center gap-3 shrink-0 pl-2">
                <div className="font-khmer">
                  <div className="font-bold text-slate-900 leading-tight">ភេទ:</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Sex:</div>
                </div>

                {/* Male */}
                <label className="flex items-center gap-1.5 cursor-pointer font-khmer">
                  <span className="font-semibold text-slate-800">ប្រុស</span>
                  <div
                    onClick={() => isEditing && setFormData({ ...formData, gender: 'Man' })}
                    className={`w-5 h-5 bg-[#E8F0FE] border border-[#BFDBFE] rounded-[2px] flex items-center justify-center font-bold text-blue-900 ${
                      formData.gender === 'Man' ? 'bg-[#D0E2FE]' : ''
                    }`}
                  >
                    {formData.gender === 'Man' && '✓'}
                  </div>
                  <span className="text-[11px] text-slate-500 font-sans">Male</span>
                </label>

                {/* Female */}
                <label className="flex items-center gap-1.5 cursor-pointer font-khmer">
                  <span className="font-semibold text-slate-800">ស្រី</span>
                  <div
                    onClick={() => isEditing && setFormData({ ...formData, gender: 'Female' })}
                    className={`w-5 h-5 bg-[#E8F0FE] border border-[#BFDBFE] rounded-[2px] flex items-center justify-center font-bold text-blue-900 ${
                      formData.gender === 'Female' ? 'bg-[#D0E2FE]' : ''
                    }`}
                  >
                    {formData.gender === 'Female' && '✓'}
                  </div>
                  <span className="text-[11px] text-slate-500 font-sans">Female</span>
                </label>
              </div>
            </div>

            {/* Row 2: Name in English + Nationality */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="min-w-[130px] sm:min-w-[145px] shrink-0 font-khmer">
                  <div className="font-bold text-slate-900 leading-tight">២. ឈ្មោះអក្សរឡាតាំង:</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Name in English:</div>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.latinName}
                    onChange={(e) => setFormData({ ...formData, latinName: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-mono font-bold uppercase text-slate-900 min-h-[34px] flex items-center">
                    {formData.latinName || student.latinName || '-'}
                  </div>
                )}
              </div>

              {/* Nationality */}
              <div className="flex items-center gap-2 w-full sm:w-[240px] shrink-0">
                <div className="min-w-[70px] shrink-0 font-khmer">
                  <div className="font-bold text-slate-900 leading-tight">សញ្ជាតិ:</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Nationality:</div>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 min-h-[34px] flex items-center">
                    {formData.nationality}
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Date of Birth + Religion */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="min-w-[130px] sm:min-w-[145px] shrink-0 font-khmer">
                  <div className="font-bold text-slate-900 leading-tight">៣. ថ្ងៃ.ខែ.ឆ្នាំកំណើត:</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Date of Birth:</div>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-mono font-bold text-slate-900 min-h-[34px] flex items-center">
                    {formData.dob || student.dob || '-'}
                  </div>
                )}
              </div>

              {/* Religion */}
              <div className="flex items-center gap-2 w-full sm:w-[240px] shrink-0">
                <div className="min-w-[70px] shrink-0 font-khmer">
                  <div className="font-bold text-slate-900 leading-tight">សាសនា:</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Religion:</div>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.religion}
                    onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 min-h-[34px] flex items-center">
                    {formData.religion}
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: Student ID */}
            <div className="flex items-center gap-2">
              <div className="min-w-[130px] sm:min-w-[145px] shrink-0 font-khmer">
                <div className="font-bold text-slate-900 leading-tight">៤. ID សិស្ស:</div>
                <div className="text-[11px] text-slate-600 font-sans leading-tight">Student ID:</div>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.studentCode}
                  onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                  className="flex-1 sm:max-w-md bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <div className="flex-1 sm:max-w-md bg-[#E8F0FE] rounded-md px-3 py-1.5 font-mono font-bold text-slate-900 min-h-[34px] flex items-center">
                  {formData.studentCode}
                </div>
              )}
            </div>

            {/* Row 5: Place of Birth (Full Width) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-0.5">
              <div className="min-w-[130px] sm:min-w-[145px] shrink-0 font-khmer">
                <div className="font-bold text-slate-900 leading-tight">៥. ទីកន្លែងកំណើត:</div>
                <div className="text-[11px] text-slate-600 font-sans leading-tight">Place of Birth:</div>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.placeOfBirth}
                  onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                  className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer text-slate-900 min-h-[34px] flex items-center">
                  {formData.placeOfBirth}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= SECTION II: GRADE LEVEL ================= */}
        <div className="mt-5 space-y-2.5">
          {/* Solid Yellow Banner */}
          <div className="bg-[#F59E0B] px-3.5 py-1.5 rounded-[3px] shadow-2xs">
            <h3 className="font-extrabold text-sm sm:text-base text-[#991B1B] font-khmer tracking-wide">
              II. កម្មវិធីសិក្សា / GRADE LEVEL
            </h3>
          </div>

          <div className="space-y-2.5 text-xs sm:text-[13px] text-slate-900 font-serif">
            
            {/* Row 1: Previous Grade + Year */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="min-w-[140px] sm:min-w-[155px] shrink-0 font-khmer">
                  <div className="font-bold text-slate-900 leading-tight">១.កម្រិតថ្នាក់ឆ្នាំចាស់:</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Previous Grade:</div>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.previousGrade}
                    onChange={(e) => setFormData({ ...formData, previousGrade: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 min-h-[34px] flex items-center">
                    {formData.previousGrade}
                  </div>
                )}
              </div>

              {/* Year */}
              <div className="flex items-center gap-2 w-full sm:w-[260px] shrink-0">
                <div className="min-w-[70px] shrink-0 font-khmer">
                  <div className="font-bold text-slate-900 leading-tight">ឆ្នាំសិក្សា:</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Year:</div>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.previousYear}
                    onChange={(e) => setFormData({ ...formData, previousYear: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-mono font-bold text-slate-900 min-h-[34px] flex items-center">
                    {formData.previousYear}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Previous School Name */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="min-w-[140px] sm:min-w-[155px] shrink-0 font-khmer">
                <div className="font-bold text-slate-900 leading-tight">ឈ្មោះសាលា:</div>
                <div className="text-[11px] text-slate-600 font-sans leading-tight">School name:</div>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.previousSchool}
                  onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                  className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer text-slate-900 min-h-[34px] flex items-center">
                  {formData.previousSchool}
                </div>
              )}
            </div>

            {/* Row 3: Present Grade + Year */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="min-w-[140px] sm:min-w-[155px] shrink-0 font-khmer">
                  <div className="font-bold text-slate-900 leading-tight">២.កម្រិតថ្នាក់បច្ចុប្បន្ន:</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Present Grade:</div>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.presentGrade}
                    onChange={(e) => setFormData({ ...formData, presentGrade: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 min-h-[34px] flex items-center">
                    {formData.presentGrade}
                  </div>
                )}
              </div>

              {/* Year */}
              <div className="flex items-center gap-2 w-full sm:w-[260px] shrink-0">
                <div className="min-w-[70px] shrink-0 font-khmer">
                  <div className="font-bold text-slate-900 leading-tight">ឆ្នាំសិក្សា:</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Year:</div>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.presentYear}
                    onChange={(e) => setFormData({ ...formData, presentYear: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-mono font-bold text-slate-900 min-h-[34px] flex items-center">
                    {formData.presentYear}
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: School name (BIM School) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="min-w-[140px] sm:min-w-[155px] shrink-0 font-khmer">
                <div className="font-bold text-slate-900 leading-tight">ឈ្មោះសាលា:</div>
                <div className="text-[11px] text-slate-600 font-sans leading-tight">School name:</div>
              </div>
              <div className="flex-1 bg-[#E8F0FE] rounded-md px-4 py-2 font-serif font-extrabold text-slate-900 text-sm sm:text-base min-h-[36px] flex items-center">
                {formData.presentSchool}
              </div>
            </div>

            {/* Row 5: Day + Time */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="min-w-[100px] shrink-0 font-khmer">
                  <div className="font-bold text-slate-900 leading-tight">៣.ថ្ងៃសិក្សា:</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Day:</div>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.studyDays}
                    onChange={(e) => setFormData({ ...formData, studyDays: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 min-h-[34px] flex items-center justify-center text-center">
                    {formData.studyDays}
                  </div>
                )}
              </div>

              {/* Time */}
              <div className="flex items-center gap-2 flex-1">
                <div className="min-w-[85px] shrink-0 font-khmer">
                  <div className="font-bold text-slate-900 leading-tight">ម៉ោងសិក្សា:</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Time:</div>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.studyHours}
                    onChange={(e) => setFormData({ ...formData, studyHours: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 min-h-[34px] flex items-center justify-center text-center">
                    {formData.studyHours}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ================= SECTION III: STUDENT HEALTH SECTION ================= */}
        <div className="mt-5 space-y-3">
          {/* Solid Yellow Banner */}
          <div className="bg-[#F59E0B] px-3.5 py-1.5 rounded-[3px] shadow-2xs">
            <h3 className="font-extrabold text-sm sm:text-base text-[#991B1B] font-khmer tracking-wide">
              III. ព័ត៌មានសុខភាពកុមារ / Student Health Section
            </h3>
          </div>

          {/* Question 1 Heading */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-1 font-serif">
            <div>
              <div className="font-bold text-sm sm:text-base text-slate-950 font-khmer leading-snug">
                1  តើកូនរបស់អ្នកមានបញ្ហាដូចខាងក្រោមនេះដែឬទេ?
              </div>
              <div className="text-xs text-slate-800 font-sans leading-tight">
                Does your child suffer from any of the following:
              </div>
            </div>
            <div className="text-xs font-bold text-slate-800 font-khmer shrink-0 sm:text-right">
              សូមបញ្ជាក់អោយច្បាស់
            </div>
          </div>

          {/* 12 Conditions List */}
          <div className="space-y-3 pt-1 text-xs sm:text-[13px] text-slate-900 font-serif">
            {[
              {
                key: 'malnutrition',
                labelKh: 'កង្វះអាហារូបត្ថម្ភ',
                labelEn: 'Malnutrition (lack of food)',
              },
              {
                key: 'heartCondition',
                labelKh: 'ស្ថានភាពបេះដូង',
                labelEn: 'Heart condition',
              },
              {
                key: 'asthma',
                labelKh: 'ជំងឺហឺត (បញ្ហាផ្លូវដង្ហើម)',
                labelEn: 'Asthma (breathing issues)',
              },
              {
                key: 'migraine',
                labelKh: 'ជំងឺឈឺក្បាលប្រកាំង',
                labelEn: 'Migraine',
              },
              {
                key: 'diabetes',
                labelKh: 'ជំងឺទឹកនោមផ្អែម (ជាតិស្ករក្នុងឈាម)',
                labelEn: 'Diabetes (sugar in the blood)',
              },
              {
                key: 'dizziness',
                labelKh: 'វិលមុខ ងងឹតមុខ ដួលសន្លប់',
                labelEn: 'Dizziness/Black Outs/Fainting',
              },
              {
                key: 'behaviorConcerns',
                labelKh: 'បញ្ហា អាកប្បកិរិយា',
                labelEn: 'Behavior Concerns',
              },
              {
                key: 'learningConcerns',
                labelKh: 'បញ្ហា ការសិក្សា',
                labelEn: 'Learning Concerns',
              },
              {
                key: 'hearingConcerns',
                labelKh: 'បញ្ហា ការស្តាប់',
                labelEn: 'Hearing Concerns',
              },
              {
                key: 'visionConcerns',
                labelKh: 'បញ្ហា ការមើល',
                labelEn: 'Vision Concerns',
              },
              {
                key: 'speechConcerns',
                labelKh: 'បញ្ហា ការនិយាយស្តី',
                labelEn: 'Speech Concerns',
              },
              {
                key: 'mobilityConcerns',
                labelKh: 'បញ្ហា ការចល័ត',
                labelEn: 'Mobility Concerns',
              },
            ].map((item) => {
              const cond = healthData[item.key] || { hasCondition: false, details: '' };
              const hasYes = !!cond.hasCondition;

              return (
                <div key={item.key} className="space-y-0.5 leading-snug">
                  {/* Line 1: Khmer Bullet */}
                  <div className="font-bold text-slate-950 font-khmer flex items-center gap-2">
                    <span className="text-slate-900">•</span>
                    <span>{item.labelKh}</span>
                  </div>

                  {/* Line 2: English Bullet + Yes/No + Specify */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pl-4 text-xs">
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-900 font-sans min-w-[200px] sm:min-w-[240px]">
                        • {item.labelEn}
                      </span>

                      {/* Yes / No Toggle matching paper __ Yes / No __ */}
                      <div className="flex items-center gap-1.5 font-sans">
                        <span className="text-slate-400">__</span>
                        <button
                          type="button"
                          disabled={!isEditing}
                          onClick={() => {
                            if (isEditing) {
                              setHealthData({
                                ...healthData,
                                [item.key]: { ...cond, hasCondition: true },
                              });
                            }
                          }}
                          className={`px-1.5 py-0.5 rounded text-xs font-bold transition-colors ${
                            hasYes
                              ? 'bg-rose-100 text-rose-900 border border-rose-300 font-extrabold'
                              : 'text-slate-700 hover:text-black'
                          } ${isEditing ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                        >
                          {hasYes ? '✓ Yes' : 'Yes'}
                        </button>
                        <span className="text-slate-400">/</span>
                        <button
                          type="button"
                          disabled={!isEditing}
                          onClick={() => {
                            if (isEditing) {
                              setHealthData({
                                ...healthData,
                                [item.key]: { hasCondition: false, details: '' },
                              });
                            }
                          }}
                          className={`px-1.5 py-0.5 rounded text-xs font-bold transition-colors ${
                            !hasYes
                              ? 'bg-slate-200 text-slate-900 font-extrabold'
                              : 'text-slate-500 hover:text-black'
                          } ${isEditing ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                        >
                          {!hasYes ? '✓ No' : 'No'}
                        </button>
                        <span className="text-slate-400">__</span>
                      </div>
                    </div>

                    {/* If yes, please specify */}
                    <div className="flex items-center gap-1.5 flex-1 w-full md:w-auto">
                      <span className="text-slate-700 font-sans whitespace-nowrap text-[11px] sm:text-xs">
                        If yes, please specify
                      </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={cond.details || ''}
                          onChange={(e) => {
                            setHealthData({
                              ...healthData,
                              [item.key]: {
                                hasCondition: true,
                                details: e.target.value,
                              },
                            });
                          }}
                          placeholder="សូមបញ្ជាក់..."
                          className="flex-1 border-b-2 border-slate-400 focus:border-blue-600 bg-transparent px-2 py-0.5 text-xs font-khmer text-slate-900 focus:outline-none"
                        />
                      ) : (
                        <div className="flex-1 border-b border-slate-400 min-h-[22px] px-2 text-xs font-khmer text-slate-800 flex items-center">
                          {hasYes ? cond.details || 'មានអាការៈ' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Question 2: Medication */}
          <div className="pt-4 space-y-2 border-t border-slate-200 mt-4 font-serif">
            <div>
              <div className="font-bold text-sm sm:text-base text-slate-950 font-khmer leading-snug">
                2. តើកូនរបស់អ្នកលេបថ្នាំណាមួយទេ?បើមាន សូមរាយបញ្ជី និងបញ្ជាក់ថា
              </div>
              <div className="font-bold text-sm sm:text-base text-slate-950 font-khmer leading-snug pl-4">
                តើថ្នាំណាដែលត្រូវលេបជាប្រចាំថ្ងៃ ឬ ជាចាំបាច់។
              </div>
              <div className="text-xs text-slate-800 font-sans leading-tight pt-0.5">
                Does your child take any medication(s) If yes, please list and indicate if meds are taken daily or as needed?
              </div>
            </div>

            {/* Yes / No Boxes matching image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Yes Box */}
              <div
                onClick={() => isEditing && setTakesMedication(true)}
                className={`bg-[#E8F0FE] border border-[#BFDBFE] rounded-md p-3 min-h-[46px] flex flex-col justify-center ${
                  isEditing ? 'cursor-pointer hover:border-blue-400' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 font-sans">
                    Yes:
                  </span>
                  {takesMedication && (
                    <span className="font-bold text-blue-700 font-mono text-sm">✓</span>
                  )}
                  {isEditing ? (
                    <input
                      type="text"
                      value={medicationDetails}
                      onChange={(e) => {
                        setTakesMedication(true);
                        setMedicationDetails(e.target.value);
                      }}
                      placeholder="រាយបញ្ជីថ្នាំ និងកាលវិភាគ..."
                      className="flex-1 bg-white/70 border border-blue-200 rounded px-2 py-1 text-xs font-khmer text-slate-900 focus:outline-none"
                    />
                  ) : (
                    <span className="flex-1 font-khmer text-xs text-slate-800 border-b border-slate-400 min-h-[20px] px-1">
                      {takesMedication ? medicationDetails || 'មានថ្នាំត្រូវលេប' : '________________________'}
                    </span>
                  )}
                </div>
              </div>

              {/* No Box */}
              <div
                onClick={() => isEditing && setTakesMedication(false)}
                className={`bg-[#E8F0FE] border border-[#BFDBFE] rounded-md p-3 min-h-[46px] flex items-center justify-between ${
                  isEditing ? 'cursor-pointer hover:border-blue-400' : ''
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 font-sans">
                    No:
                  </span>
                  {!takesMedication ? (
                    <span className="font-bold text-blue-700 font-mono text-sm">✓ គ្មានការលេបថ្នាំជាប្រចាំ</span>
                  ) : (
                    <span className="text-slate-400 font-mono">________________________</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION IV: PARENTS / CARETAKER'S DETAILS ================= */}
        <div className="mt-6 space-y-3">
          {/* Solid Yellow Banner */}
          <div className="bg-[#F59E0B] px-3.5 py-1.5 rounded-[3px] shadow-2xs">
            <h3 className="font-extrabold text-sm sm:text-base text-[#991B1B] font-khmer tracking-wide">
              IV. ព័ត៌មានមាតាបិតា / Parents /Caretaker's Details
            </h3>
          </div>

          <div className="space-y-4 text-xs sm:text-[13px] text-slate-900 font-serif">
            
            {/* 1. FATHER */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                {/* Left: Father's Name & Occupation */}
                <div className="flex-1 space-y-2">
                  {/* Father's Name */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="min-w-[130px] shrink-0 font-khmer">
                      <div className="font-bold text-slate-900 leading-tight">១. ឪពុកឈ្មោះ :</div>
                      <div className="text-[11px] text-slate-600 font-sans leading-tight">Father's name:</div>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={parentsData.fatherName}
                        onChange={(e) => setParentsData({ ...parentsData, fatherName: e.target.value })}
                        className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 min-h-[34px] flex items-center">
                        {parentsData.fatherName || '________________________'}
                      </div>
                    )}
                  </div>

                  {/* Occupation */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="min-w-[130px] shrink-0 font-khmer">
                      <div className="font-bold text-slate-900 leading-tight">មុខរបរ:</div>
                      <div className="text-[11px] text-slate-600 font-sans leading-tight">Occupation:</div>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={parentsData.fatherOccupation}
                        onChange={(e) => setParentsData({ ...parentsData, fatherOccupation: e.target.value })}
                        className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer text-slate-900 min-h-[34px] flex items-center">
                        {parentsData.fatherOccupation || '________________________'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: 4*6 Photo Box for Father */}
                <div className="shrink-0 w-[76px] sm:w-[84px] h-[82px] sm:h-[90px] bg-[#E8F0FE] border border-[#BFDBFE] rounded-[2px] flex items-center justify-center text-slate-500 font-sans font-semibold text-xs relative overflow-hidden shadow-2xs">
                  {parentsData.fatherPhoto ? (
                    <img src={parentsData.fatherPhoto} alt="Father" className="w-full h-full object-cover" />
                  ) : (
                    <span>4*6</span>
                  )}
                  {isEditing && (
                    <label className="absolute inset-0 bg-black/40 hover:bg-black/50 flex flex-col items-center justify-center text-white cursor-pointer text-[9px] font-khmer">
                      <Camera className="w-3.5 h-3.5 mb-0.5" />
                      <span>រូប</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () =>
                              setParentsData({ ...parentsData, fatherPhoto: reader.result as string });
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Full Width Tel */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="min-w-[130px] shrink-0 font-khmer font-bold text-slate-900">
                  លេខទូរស័ព្ទ / Tel :
                </div>
                {isEditing ? (
                  <input
                    type="tel"
                    value={parentsData.fatherPhone}
                    onChange={(e) => setParentsData({ ...parentsData, fatherPhone: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-mono font-bold text-slate-900 min-h-[34px] flex items-center">
                    {parentsData.fatherPhone || '________________________'}
                  </div>
                )}
              </div>
            </div>

            {/* 2. MOTHER */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-start justify-between gap-3">
                {/* Left: Mother's Name & Occupation */}
                <div className="flex-1 space-y-2">
                  {/* Mother's Name */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="min-w-[130px] shrink-0 font-khmer">
                      <div className="font-bold text-slate-900 leading-tight">២. ម្តាយឈ្មោះ :</div>
                      <div className="text-[11px] text-slate-600 font-sans leading-tight">Mother's name :</div>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={parentsData.motherName}
                        onChange={(e) => setParentsData({ ...parentsData, motherName: e.target.value })}
                        className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 min-h-[34px] flex items-center">
                        {parentsData.motherName || '________________________'}
                      </div>
                    )}
                  </div>

                  {/* Occupation */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="min-w-[130px] shrink-0 font-khmer">
                      <div className="font-bold text-slate-900 leading-tight">មុខរបរ:</div>
                      <div className="text-[11px] text-slate-600 font-sans leading-tight">Occupation:</div>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={parentsData.motherOccupation}
                        onChange={(e) => setParentsData({ ...parentsData, motherOccupation: e.target.value })}
                        className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer text-slate-900 min-h-[34px] flex items-center">
                        {parentsData.motherOccupation || '________________________'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: 4*6 Photo Box for Mother */}
                <div className="shrink-0 w-[76px] sm:w-[84px] h-[82px] sm:h-[90px] bg-[#E8F0FE] border border-[#BFDBFE] rounded-[2px] flex items-center justify-center text-slate-500 font-sans font-semibold text-xs relative overflow-hidden shadow-2xs">
                  {parentsData.motherPhoto ? (
                    <img src={parentsData.motherPhoto} alt="Mother" className="w-full h-full object-cover" />
                  ) : (
                    <span>4*6</span>
                  )}
                  {isEditing && (
                    <label className="absolute inset-0 bg-black/40 hover:bg-black/50 flex flex-col items-center justify-center text-white cursor-pointer text-[9px] font-khmer">
                      <Camera className="w-3.5 h-3.5 mb-0.5" />
                      <span>រូប</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () =>
                              setParentsData({ ...parentsData, motherPhoto: reader.result as string });
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Full Width Tel */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="min-w-[130px] shrink-0 font-khmer font-bold text-slate-900">
                  លេខទូរស័ព្ទ / Tel :
                </div>
                {isEditing ? (
                  <input
                    type="tel"
                    value={parentsData.motherPhone}
                    onChange={(e) => setParentsData({ ...parentsData, motherPhone: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-mono font-bold text-slate-900 min-h-[34px] flex items-center">
                    {parentsData.motherPhone || '________________________'}
                  </div>
                )}
              </div>
            </div>

            {/* 3. CARETAKER */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-start justify-between gap-3">
                {/* Left: Caretaker's Name & Occupation */}
                <div className="flex-1 space-y-2">
                  {/* Caretaker's Name */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="min-w-[130px] shrink-0 font-khmer">
                      <div className="font-bold text-slate-900 leading-tight">៣. អាណាព្យាបាលឈ្មោះ:</div>
                      <div className="text-[11px] text-slate-600 font-sans leading-tight">Caretaker's name:</div>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={parentsData.caretakerName}
                        onChange={(e) => setParentsData({ ...parentsData, caretakerName: e.target.value })}
                        className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer font-bold text-slate-900 min-h-[34px] flex items-center">
                        {parentsData.caretakerName || student.guardianName || '________________________'}
                      </div>
                    )}
                  </div>

                  {/* Occupation */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="min-w-[130px] shrink-0 font-khmer">
                      <div className="font-bold text-slate-900 leading-tight">មុខរបរ:</div>
                      <div className="text-[11px] text-slate-600 font-sans leading-tight">Occupation:</div>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={parentsData.caretakerOccupation}
                        onChange={(e) => setParentsData({ ...parentsData, caretakerOccupation: e.target.value })}
                        className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer text-slate-900 min-h-[34px] flex items-center">
                        {parentsData.caretakerOccupation || '________________________'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: 4*6 Photo Box for Caretaker */}
                <div className="shrink-0 w-[76px] sm:w-[84px] h-[82px] sm:h-[90px] bg-[#E8F0FE] border border-[#BFDBFE] rounded-[2px] flex items-center justify-center text-slate-500 font-sans font-semibold text-xs relative overflow-hidden shadow-2xs">
                  {parentsData.caretakerPhoto ? (
                    <img src={parentsData.caretakerPhoto} alt="Caretaker" className="w-full h-full object-cover" />
                  ) : (
                    <span>4*6</span>
                  )}
                  {isEditing && (
                    <label className="absolute inset-0 bg-black/40 hover:bg-black/50 flex flex-col items-center justify-center text-white cursor-pointer text-[9px] font-khmer">
                      <Camera className="w-3.5 h-3.5 mb-0.5" />
                      <span>រូប</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () =>
                              setParentsData({ ...parentsData, caretakerPhoto: reader.result as string });
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Full Width Tel */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="min-w-[130px] shrink-0 font-khmer font-bold text-slate-900">
                  លេខទូរស័ព្ទ / Tel :
                </div>
                {isEditing ? (
                  <input
                    type="tel"
                    value={parentsData.caretakerPhone}
                    onChange={(e) => setParentsData({ ...parentsData, caretakerPhone: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-mono font-bold text-slate-900 min-h-[34px] flex items-center">
                    {parentsData.caretakerPhone || student.phone || '________________________'}
                  </div>
                )}
              </div>
            </div>

            {/* 4. NEIGHBOR / EMERGENCY CONTACT */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="min-w-[200px] shrink-0 font-khmer">
                  <div className="font-bold text-slate-900 leading-tight">៤. អ្នកជិតខាងដែលអាចទាក់ទងបាន</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Relationship to child:</div>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={parentsData.emergencyRelationship}
                    onChange={(e) => setParentsData({ ...parentsData, emergencyRelationship: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer text-slate-900 min-h-[34px] flex items-center">
                    {parentsData.emergencyRelationship || '________________________'}
                  </div>
                )}
              </div>

              {/* Occupation */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="min-w-[200px] shrink-0 font-khmer">
                  <div className="font-bold text-slate-900 leading-tight">មុខរបរ:</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Occupation:</div>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={parentsData.emergencyOccupation}
                    onChange={(e) => setParentsData({ ...parentsData, emergencyOccupation: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-khmer text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-khmer text-slate-900 min-h-[34px] flex items-center">
                    {parentsData.emergencyOccupation || '________________________'}
                  </div>
                )}
              </div>

              {/* Full Width Tel */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="min-w-[200px] shrink-0 font-khmer font-bold text-slate-900">
                  លេខទូរស័ព្ទ / Tel :
                </div>
                {isEditing ? (
                  <input
                    type="tel"
                    value={parentsData.emergencyPhone}
                    onChange={(e) => setParentsData({ ...parentsData, emergencyPhone: e.target.value })}
                    className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-md px-3 py-1.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex-1 bg-[#E8F0FE] rounded-md px-3 py-1.5 font-mono font-bold text-slate-900 min-h-[34px] flex items-center">
                    {parentsData.emergencyPhone || '________________________'}
                  </div>
                )}
              </div>
            </div>

            {/* 5. FORBIDDEN PICKUP PERSON */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div>
                <div className="font-bold text-sm sm:text-base text-slate-950 font-khmer leading-snug">
                  ៥. តើមានបុគ្គលដែលហាមមិនអោយជួបឬមកទទួលកុមារដែឬទេ?
                </div>
                <div className="text-xs text-slate-800 font-sans leading-tight pt-0.5">
                  Is there any person that is not allowed to see/pick up the child from school?
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Yes Box */}
                <div
                  onClick={() => isEditing && setParentsData({ ...parentsData, hasForbiddenPerson: true })}
                  className={`bg-[#E8F0FE] border border-[#BFDBFE] rounded-md p-3 min-h-[46px] flex flex-col justify-center ${
                    isEditing ? 'cursor-pointer hover:border-blue-400' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 font-sans">
                      Yes:
                    </span>
                    {parentsData.hasForbiddenPerson && (
                      <span className="font-bold text-rose-700 font-mono text-sm">✓</span>
                    )}
                    {isEditing ? (
                      <input
                        type="text"
                        value={parentsData.forbiddenPersonDetails}
                        onChange={(e) => {
                          setParentsData({
                            ...parentsData,
                            hasForbiddenPerson: true,
                            forbiddenPersonDetails: e.target.value,
                          });
                        }}
                        placeholder="ឈ្មោះ និងមូលហេតុ..."
                        className="flex-1 bg-white/70 border border-blue-200 rounded px-2 py-1 text-xs font-khmer text-slate-900 focus:outline-none"
                      />
                    ) : (
                      <span className="flex-1 font-khmer text-xs text-rose-900 border-b border-slate-400 min-h-[20px] px-1 font-semibold">
                        {parentsData.hasForbiddenPerson ? parentsData.forbiddenPersonDetails || 'មានបុគ្គលហាមឃាត់' : '________________________'}
                      </span>
                    )}
                  </div>
                </div>

                {/* No Box */}
                <div
                  onClick={() =>
                    isEditing && setParentsData({ ...parentsData, hasForbiddenPerson: false, forbiddenPersonDetails: '' })
                  }
                  className={`bg-[#E8F0FE] border border-[#BFDBFE] rounded-md p-3 min-h-[46px] flex items-center justify-between ${
                    isEditing ? 'cursor-pointer hover:border-blue-400' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 font-sans">
                      No:
                    </span>
                    {!parentsData.hasForbiddenPerson ? (
                      <span className="font-bold text-blue-700 font-mono text-sm">✓ គ្មានបុគ្គលហាមឃាត់</span>
                    ) : (
                      <span className="text-slate-400 font-mono">________________________</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ================= SECTION V: OTHER SERVICES ================= */}
        <div className="mt-6 space-y-3">
          {/* Solid Yellow Banner */}
          <div className="bg-[#F59E0B] px-3.5 py-1.5 rounded-[3px] shadow-2xs">
            <h3 className="font-extrabold text-sm sm:text-base text-[#991B1B] font-khmer tracking-wide">
              V. សេវាកម្មផ្សេងៗ / Other
            </h3>
          </div>

          <div className="space-y-4 text-xs sm:text-[13px] text-slate-900 font-serif">
            
            {/* Meals 3 Columns matching image */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              
              {/* 1. Breakfast */}
              <div
                onClick={() =>
                  isEditing && setServicesData({ ...servicesData, breakfast: !servicesData.breakfast })
                }
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  servicesData.breakfast
                    ? 'border-blue-300 bg-blue-50/50'
                    : 'border-slate-200 bg-slate-50/40'
                } ${isEditing ? 'cursor-pointer' : ''}`}
              >
                <div>
                  <div className="font-bold text-slate-950 font-khmer leading-tight">១. អាហារពេលព្រឹក</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Breakfast</div>
                </div>
                <div className="w-6 h-6 bg-[#E8F0FE] border border-[#BFDBFE] rounded-[3px] flex items-center justify-center font-bold text-blue-900 text-sm shadow-2xs">
                  {servicesData.breakfast && '✓'}
                </div>
              </div>

              {/* 2. Lunch */}
              <div
                onClick={() =>
                  isEditing && setServicesData({ ...servicesData, lunch: !servicesData.lunch })
                }
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  servicesData.lunch
                    ? 'border-blue-300 bg-blue-50/50'
                    : 'border-slate-200 bg-slate-50/40'
                } ${isEditing ? 'cursor-pointer' : ''}`}
              >
                <div>
                  <div className="font-bold text-slate-950 font-khmer leading-tight">អាហារថ្ងៃត្រង់:</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Lunch:</div>
                </div>
                <div className="w-6 h-6 bg-[#E8F0FE] border border-[#BFDBFE] rounded-[3px] flex items-center justify-center font-bold text-blue-900 text-sm shadow-2xs">
                  {servicesData.lunch && '✓'}
                </div>
              </div>

              {/* 3. Evening Food */}
              <div
                onClick={() =>
                  isEditing && setServicesData({ ...servicesData, eveningFood: !servicesData.eveningFood })
                }
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  servicesData.eveningFood
                    ? 'border-blue-300 bg-blue-50/50'
                    : 'border-slate-200 bg-slate-50/40'
                } ${isEditing ? 'cursor-pointer' : ''}`}
              >
                <div>
                  <div className="font-bold text-slate-950 font-khmer leading-tight">អាហារពេលល្ងាច</div>
                  <div className="text-[11px] text-slate-600 font-sans leading-tight">Evening Food</div>
                </div>
                <div className="w-6 h-6 bg-[#E8F0FE] border border-[#BFDBFE] rounded-[3px] flex items-center justify-center font-bold text-blue-900 text-sm shadow-2xs">
                  {servicesData.eveningFood && '✓'}
                </div>
              </div>

            </div>

            {/* Permanent Address matching image */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 pt-2">
              <div className="min-w-[140px] shrink-0 font-khmer pt-1">
                <div className="font-bold text-slate-950 leading-tight">អាសយដ្ឋានបច្ចុប្បន្ន</div>
                <div className="text-[11px] text-slate-600 font-sans leading-tight">Permanent Address:</div>
              </div>

              {isEditing ? (
                <textarea
                  rows={2}
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  className="flex-1 bg-[#E8F0FE] border border-[#BFDBFE] rounded-lg p-3 font-khmer text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <div className="flex-1 bg-[#E8F0FE] rounded-lg p-3.5 font-khmer text-slate-900 min-h-[54px] flex items-center">
                  {permanentAddress || 'ភូមិអូរឫស្សី សង្កាត់អូរឫស្សី ក្រុងប៉ោយប៉ែត ខេត្តបន្ទាយមានជ័យ'}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer Signature area on print */}
        <div className="hidden print:flex items-center justify-between text-xs pt-8 text-slate-700 font-khmer">
          <div className="text-center space-y-8">
            <div>ហត្ថលេខាអាណាព្យាបាល</div>
            <div className="border-t border-slate-400 w-36 mx-auto pt-1">
              {student.guardianName || '................................'}
            </div>
          </div>
          <div className="text-center space-y-8">
            <div>ហត្ថលេខា និងត្រានាយកសាលា</div>
            <div className="border-t border-slate-400 w-36 mx-auto pt-1">
              {settings.directorName || 'យ៉េន ណាវីន'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
