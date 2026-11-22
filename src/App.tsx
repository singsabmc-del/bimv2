import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar, NavTab, isNavTab } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { OverviewDashboard } from './components/OverviewDashboard';
import { StudentFeesView } from './components/StudentFeesView';
import { StudentPortalView } from './components/StudentPortalView';
import { DailyMaterialsView } from './components/DailyMaterialsView';
import { MaterialSalesHistoryView } from './components/MaterialSalesHistoryView';
import { CanteenVendorsView } from './components/CanteenVendorsView';
import { UniformSalesView } from './components/UniformSalesView';
import { UniformSalesHistoryView } from './components/UniformSalesHistoryView';
import { ReportScannerView } from './components/ReportScannerView';
import { POSSalesView } from './components/POSSalesView';
import { SchoolBusView } from './components/SchoolBusView';
import { DailyIncomeReportView } from './components/reports/DailyIncomeReportView';
import { CashReportView } from './components/reports/CashReportView';
import { MonthlyExcelReportView } from './components/reports/MonthlyExcelReportView';
import { canOpenTab, homeTabFor } from './utils/access';
import { TeacherCheckInView } from './components/TeacherCheckInView';
import { TeacherLeaveRequestView } from './components/TeacherLeaveRequestView';
import { MyScheduleView } from './components/MyScheduleView';
import { StudentRecordsView } from './components/StudentRecordsView';
import { StudentPaymentHistoryView } from './components/StudentPaymentHistoryView';
import { StaffShiftsView } from './components/StaffShiftsView';
import { SystemSettingsView } from './components/SystemSettingsView';
import { useMobileUi } from './utils/mobileUi';
import { setGradeScale } from './utils/academic';
import { OfficialPrintReport } from './components/OfficialPrintReport';
import { OfficialClassRosterView } from './components/OfficialClassRosterView';
import { UserRoleModal } from './components/UserRoleModal';
import { LoginView } from './components/LoginView';
import { TeacherManagementView } from './components/TeacherManagementView';
import { StudentAttendanceView } from './components/StudentAttendanceView';
import { StudentAdmissionModal } from './components/StudentAdmissionModal';
import { StudentAdmissionView } from './components/StudentAdmissionView';
import { PromoteStudentsModal } from './components/PromoteStudentsModal';
import { StudentAnnualUpgradeView } from './components/StudentAnnualUpgradeView';
import { InvoiceVerificationModal } from './components/InvoiceVerificationModal';
import { AutoBackupModal } from './components/AutoBackupModal';
import { CloudSyncPromptToast } from './components/CloudSyncPromptToast';
import { ScoreSheetView } from './components/academic/ScoreSheetView';
import { StudyTrackingBookView } from './components/academic/StudyTrackingBookView';
import { ReportBookletView } from './components/academic/ReportBookletView';
import { HonorRollView } from './components/academic/HonorRollView';
import { StudentIdCardView } from './components/academic/StudentIdCardView';
import {
  Send,
  CheckCircle2,
  X,
  LayoutDashboard,
  Users,
  ShoppingCart,
  Shirt,
  Bus,
  Clock,
  CalendarDays,
} from 'lucide-react';

function MainApp() {
  // Current page lives in the URL (#pos, #academic_scores, …) so a refresh stays on the same page
  // and the browser Back / Forward buttons move between pages.
  const readTabFromUrl = (): NavTab => {
    const h = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
    return isNavTab(h) ? h : 'overview';
  };
  const [activeTab, setActiveTabState] = useState<NavTab>(readTabFromUrl);
  const setActiveTab = useCallback((tab: NavTab) => {
    setActiveTabState(tab);
    if (window.location.hash.replace(/^#\/?/, '') !== tab) {
      window.history.pushState(null, '', `#${tab}`);
    }
  }, []);
  useEffect(() => {
    const sync = () => setActiveTabState(readTabFromUrl());
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const {
    isAuthenticated,
    settings,
    activeToast,
    dismissToast,
    t,
    isVerifyInvoiceModalOpen,
    verifyInvoiceTarget,
    closeInvoiceVerification,
    academicYearArchives,
    switchAcademicYear,
    currentUser,
    teacherClassIds,
    permissions,
  } = useApp();
  // Phone: shorter labels, tables as cards, even button heights
  useMobileUi(isAuthenticated);
  // School grade scale (A–F, remarks) used by every score view
  setGradeScale(settings?.gradeScale);

  // A teacher account with no class assigned has nothing to show on class pages
  const CLASS_PAGES: NavTab[] = ['student_list', 'official_roster', 'student_attendance', 'student_info', 'student_portal'];
  const teacherWithoutClass = currentUser?.role === 'teacher' && (teacherClassIds?.length ?? 0) === 0;

  // Land each role on a page it is allowed to open (e.g. a teacher starts at the student list)
  // Right after logging in, a teacher starts on Check In (their front page)
  const wasAuthenticated = useRef(isAuthenticated);
  useEffect(() => {
    if (!wasAuthenticated.current && isAuthenticated && currentUser?.role === 'teacher') {
      setActiveTabState('teacher_checkin');
      window.history.replaceState(null, '', '#teacher_checkin');
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, currentUser?.role]);

  useEffect(() => {
    if (isAuthenticated && currentUser && !canOpenTab(currentUser.role, activeTab)) {
      setActiveTabState(homeTabFor(currentUser.role));
      window.history.replaceState(null, '', `#${homeTabFor(currentUser.role)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUser?.role]);

  // Is an older academic year open? (switched from the header year menu)
  const activeAcademicYear = settings.academicYear || '2026-2027';
  const latestAcademicYear = Array.from(
    new Set([activeAcademicYear, ...Object.keys(academicYearArchives || {})])
  ).sort((a, b) => b.localeCompare(a))[0];
  const isViewingOldYear = activeAcademicYear !== latestAcademicYear;

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] flex font-sans selection:bg-teal-100 selection:text-teal-900 pb-16 lg:pb-0">
      {/* Collapsible / Responsive Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onOpenUserModal={() => setIsUserModalOpen(true)}
      />

      {/* Main Content Area (Offset by sidebar on desktop lg:pl-64) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 print:pl-0 transition-all duration-300">
        {/* Sticky Top Bar with Search Dropdown & Quick User Control */}
        <TopHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onPrint={() => setIsPrintOpen(true)}
          onOpenUserModal={() => setIsUserModalOpen(true)}
        />

        {/* Live Telegram Alert Notification Banner (Floats on top right whenever a payment occurs) */}
        {activeToast && (
          <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full animate-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-sky-500/40 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                <Send className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-sky-400">
                      Telegram Alert Sent
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{activeToast.timestamp}</span>
                </div>
                <div className="font-bold text-xs text-white mt-0.5 font-khmer truncate">
                  {activeToast.title}
                </div>
                <div className="text-[11px] text-slate-300 font-khmer mt-1 whitespace-pre-line leading-relaxed max-h-24 overflow-y-auto no-scrollbar">
                  {activeToast.message}
                </div>
              </div>
              <button
                onClick={dismissToast}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Full-Width Dynamic Views Viewport matching 5 Flowchart Sections */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 print:p-0 w-full max-w-full overflow-x-hidden">
          {isViewingOldYear && (
            <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 font-khmer">
              <div className="text-sm text-rose-900">
                <span className="font-bold">កំពុងមើលទិន្នន័យឆ្នាំសិក្សាចាស់ </span>
                <span className="font-mono font-bold">{activeAcademicYear}</span>
                <span className="text-rose-700 text-xs block sm:inline sm:ml-2">
                  អាចមើល និងបោះពុម្ពបញ្ជីបាន · ឆ្នាំបច្ចុប្បន្នគឺ {latestAcademicYear}
                </span>
              </div>
              <button
                type="button"
                onClick={() => switchAcademicYear(latestAcademicYear)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                ត្រឡប់ទៅឆ្នាំ {latestAcademicYear}
              </button>
            </div>
          )}
          {/* Section 1: Dashboard */}
          {!canOpenTab(currentUser.role, activeTab) && (
            <div className="mx-auto mt-10 max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center font-khmer">
              <div className="text-sm font-bold text-amber-900">គណនីរបស់អ្នកមិនមានសិទ្ធិចូលទំព័រនេះទេ</div>
              <button
                type="button"
                onClick={() => setActiveTab(homeTabFor(currentUser.role))}
                className="mt-3 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700"
              >
                ទៅទំព័រដើម
              </button>
            </div>
          )}
          {canOpenTab(currentUser.role, activeTab) && teacherWithoutClass && CLASS_PAGES.includes(activeTab) && (
            <div className="mx-auto mt-10 max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center font-khmer">
              <div className="text-sm font-bold text-amber-900">គណនីរបស់អ្នកមិនទាន់មានថ្នាក់ទទួលបន្ទុកនៅឡើយ</div>
              <p className="mt-1 text-xs text-amber-800">សូមឱ្យ Admin កំណត់ថ្នាក់ នៅ ការកំណត់ → អ្នកប្រើប្រាស់</p>
            </div>
          )}
          {canOpenTab(currentUser.role, activeTab) && !(teacherWithoutClass && CLASS_PAGES.includes(activeTab)) && (<>
          {activeTab === 'overview' && (
            <OverviewDashboard setActiveTab={setActiveTab} />
          )}

          {activeTab === 'daily_report' && <DailyIncomeReportView />}
          {activeTab === 'income_statistics' && <CashReportView />}

          {/* Section 2: Student Management */}
          {(activeTab === 'student_list' || activeTab === 'official_roster') && (
            <OfficialClassRosterView />
          )}

          {activeTab === 'student_attendance' && (
            <StudentAttendanceView />
          )}

          {activeTab === 'student_admission' && (
            <div className="space-y-4">
              {permissions?.canEdit && <StudentFeesView toolsOnly="class" />}
              <StudentAdmissionView
                onBack={() => setActiveTab('student_list')}
              />
            </div>
          )}

          {activeTab === 'student_upgrade' && (
            <StudentAnnualUpgradeView />
          )}

          {(activeTab === 'student_info' || activeTab === 'student_portal') && (
            <div className="space-y-4">
              {currentUser?.role !== 'student' && (
                <StudentFeesView
                  toolsOnly
                  onPrintReport={() => setIsPrintOpen(true)}
                  onOpenOfficialRoster={() => setActiveTab('student_list')}
                />
              )}
              <StudentPortalView />
            </div>
          )}

          {/* Section 2b: Academic & Results */}
          {activeTab === 'academic_scores' && <ScoreSheetView />}
          {activeTab === 'academic_tracking' && <StudyTrackingBookView />}
          {activeTab === 'academic_booklet' && <ReportBookletView />}
          {activeTab === 'academic_honor' && <HonorRollView />}
          {activeTab === 'student_idcard' && <StudentIdCardView />}

          {/* Section 3: Teacher Management */}
          {activeTab === 'teacher_list' && (
            <TeacherManagementView initialSubTab="teacher_list" />
          )}

          {activeTab === 'teacher_info' && (
            <TeacherManagementView initialSubTab="teacher_info" />
          )}

          {activeTab === 'teaching_schedule' && (
            <TeacherManagementView initialSubTab="teaching_schedule" />
          )}

          {activeTab === 'teacher_subject' && (
            <TeacherManagementView initialSubTab="subject" />
          )}

          {activeTab === 'teacher_checkin' && <TeacherCheckInView />}
          {activeTab === 'teacher_shifts' && <StaffShiftsView />}
          {activeTab === 'teacher_leave' && <TeacherLeaveRequestView />}
          {activeTab === 'my_schedule' && <MyScheduleView />}
          {activeTab === 'student_records' && <StudentRecordsView />}

          {activeTab === 'teacher_attendance' && (
            <TeacherManagementView initialSubTab="teacher_attendance" />
          )}

          {/* Section 4: Daily School Revenue (School Income) */}
          {(activeTab === 'revenue_student' || activeTab === 'student_fees') && (
            <StudentFeesView
              onPrintReport={() => setIsPrintOpen(true)}
              onOpenOfficialRoster={() => setActiveTab('student_list')}
            />
          )}

          {activeTab === 'student_payment_history' && <StudentPaymentHistoryView />}

          {(activeTab === 'revenue_uniform' || activeTab === 'uniform_sales') && (
            <UniformSalesView onPrintReport={() => setIsPrintOpen(true)} />
          )}

          {(activeTab === 'revenue_transport' || activeTab === 'school_bus') && (
            <SchoolBusView onPrintReport={() => setIsPrintOpen(true)} />
          )}

          {(activeTab === 'revenue_materials' || activeTab === 'pos') && (
            <POSSalesView />
          )}

          {activeTab === 'daily_materials' && (
            <DailyMaterialsView onPrintReport={() => setIsPrintOpen(true)} />
          )}

          {activeTab === 'material_history' && (
            <MaterialSalesHistoryView />
          )}

          {activeTab === 'uniform_history' && (
            <UniformSalesHistoryView />
          )}

          {(activeTab === 'revenue_stall_fee' || activeTab === 'canteen_vendors') && (
            <CanteenVendorsView onPrintReport={() => setIsPrintOpen(true)} />
          )}

          {/* Section 5: Monthly Report Section */}
          {activeTab === 'report_tuition' && (
            <MonthlyExcelReportView key="report_tuition" initialReportType="tuition_fee" />
          )}

          {activeTab === 'report_uniform' && (
            <MonthlyExcelReportView key="report_uniform" initialReportType="uniform_sales" />
          )}

          {activeTab === 'report_transport' && (
            <MonthlyExcelReportView key="report_transport" initialReportType="transportation" />
          )}

          {activeTab === 'report_materials' && (
            <MonthlyExcelReportView key="report_materials" initialReportType="study_materials" />
          )}

          {activeTab === 'report_stall_fee' && (
            <MonthlyExcelReportView key="report_stall_fee" initialReportType="stall_fee" />
          )}

          {/* Utility Tools */}
          {activeTab === 'ai_scanner' && (
            <ReportScannerView setActiveTab={setActiveTab} />
          )}

          {activeTab === 'system_settings' && (
            <SystemSettingsView />
          )}
          </>)}
        </main>

        {/* Mobile App-like Bottom Navigation Bar (only the pages this role may open) */}
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden print:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around safe-bottom"
        >
          {(currentUser.role === 'teacher'
            ? ([
                { tab: 'my_schedule', label: 'កាលវិភាគ', Icon: CalendarDays },
                { tab: 'student_attendance', label: 'វត្តមានសិស្ស', Icon: CheckCircle2 },
                { tab: 'teacher_checkin', label: 'Check In', Icon: Clock, center: true },
                { tab: 'student_list', label: 'បញ្ជីសិស្ស', Icon: Users },
                { tab: 'teacher_leave', label: 'សុំច្បាប់', Icon: Send },
              ] as { tab: NavTab; label: string; Icon: any; center?: boolean }[])
            : ([
                { tab: 'overview', label: 'ទូទៅ', Icon: LayoutDashboard },
                { tab: 'student_fees', label: 'ថ្លៃសិក្សា', Icon: Users },
                { tab: 'pos', label: 'លក់ POS', Icon: ShoppingCart, center: true },
                { tab: 'uniform_sales', label: 'ឯកសណ្ឋាន', Icon: Shirt },
                { tab: 'school_bus', label: 'រថយន្ត', Icon: Bus },
              ] as { tab: NavTab; label: string; Icon: any; center?: boolean }[])
          )
            .filter((it) => canOpenTab(currentUser.role, it.tab))
            .map(({ tab, label, Icon, center }) =>
              center ? (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-col items-center justify-center py-1 px-3 -mt-3 rounded-2xl shadow-md transition-all ${
                    activeTab === tab
                      ? 'bg-teal-700 text-white shadow-teal-600/30 ring-2 ring-teal-300'
                      : 'bg-gradient-to-br from-teal-600 to-teal-500 text-white shadow-teal-600/25'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-khmer font-bold">{label}</span>
                </button>
              ) : (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                    activeTab === tab ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-khmer">{label}</span>
                </button>
              )
            )}
        </nav>

        {/* Global User Authentication & Role Permission Restriction Modal */}
        <UserRoleModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
        />

        {/* Official Printable Report Preview Modal */}
        {isPrintOpen && (
          <OfficialPrintReport
            activeTab={activeTab}
            onClose={() => setIsPrintOpen(false)}
          />
        )}

        {/* Global Invoice & Payment Status Verification Modal for Staff */}
        <InvoiceVerificationModal
          isOpen={isVerifyInvoiceModalOpen}
          onClose={closeInvoiceVerification}
          initialInvoiceNo={verifyInvoiceTarget?.invoiceNo}
          initialStudentCode={verifyInvoiceTarget?.studentCode}
        />

        {/* Global Auto-Backup & Cloud Sync Manager Modal */}
        <AutoBackupModal />

        {/* Floating Cloud Sync Prompt Notification */}
        <CloudSyncPromptToast />

        {/* Full-Width App Footer */}
        <footer className="no-print mt-auto border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500 w-full">
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">{settings.schoolNameEnglish}</span>
              <span aria-hidden="true">·</span>
              <span className="font-khmer text-amber-700 font-semibold">{settings.schoolNameKhmer}</span>
              <span aria-hidden="true">·</span>
              <span>Administrative System</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
              <span>Academic Year {settings.academicYear}</span>
              <span aria-hidden="true">·</span>
              <span>1 USD = {settings.exchangeRate.toLocaleString()} KHR</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
