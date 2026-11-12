import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar, NavTab } from './components/Sidebar';
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
import { DailyPaymentReportView } from './components/DailyPaymentReportView';
import { SystemSettingsView } from './components/SystemSettingsView';
import { OfficialPrintReport } from './components/OfficialPrintReport';
import { OfficialClassRosterView } from './components/OfficialClassRosterView';
import { UserRoleModal } from './components/UserRoleModal';
import { LoginView } from './components/LoginView';
import { TeacherManagementView } from './components/TeacherManagementView';
import { StudentAttendanceView } from './components/StudentAttendanceView';
import { MonthlyReportsView } from './components/MonthlyReportsView';
import { StudentAdmissionModal } from './components/StudentAdmissionModal';
import { StudentAdmissionView } from './components/StudentAdmissionView';
import { PromoteStudentsModal } from './components/PromoteStudentsModal';
import { StudentAnnualUpgradeView } from './components/StudentAnnualUpgradeView';
import { InvoiceVerificationModal } from './components/InvoiceVerificationModal';
import { AutoBackupModal } from './components/AutoBackupModal';
import { CloudSyncPromptToast } from './components/CloudSyncPromptToast';
import {
  Send,
  CheckCircle2,
  X,
  LayoutDashboard,
  Users,
  ShoppingCart,
  Shirt,
  Bus,
} from 'lucide-react';

function MainApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
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
  } = useApp();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-amber-100 selection:text-amber-900 pb-16 lg:pb-0">
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
          {/* Section 1: Dashboard */}
          {(activeTab === 'overview' || activeTab === 'daily_report') && (
            <OverviewDashboard setActiveTab={setActiveTab} />
          )}

          {/* Section 2: Student Management */}
          {(activeTab === 'student_list' || activeTab === 'official_roster') && (
            <OfficialClassRosterView />
          )}

          {activeTab === 'student_attendance' && (
            <StudentAttendanceView />
          )}

          {activeTab === 'student_admission' && (
            <StudentAdmissionView
              onBack={() => setActiveTab('student_list')}
            />
          )}

          {activeTab === 'student_upgrade' && (
            <StudentAnnualUpgradeView />
          )}

          {(activeTab === 'student_info' || activeTab === 'student_portal') && (
            <StudentPortalView />
          )}

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
            <MonthlyReportsView initialReportType="tuition_fee" />
          )}

          {activeTab === 'report_uniform' && (
            <MonthlyReportsView initialReportType="uniform_sales" />
          )}

          {activeTab === 'report_transport' && (
            <MonthlyReportsView initialReportType="transportation" />
          )}

          {activeTab === 'report_materials' && (
            <MonthlyReportsView initialReportType="study_materials" />
          )}

          {activeTab === 'report_stall_fee' && (
            <MonthlyReportsView initialReportType="stall_fee" />
          )}

          {/* Utility Tools */}
          {activeTab === 'ai_scanner' && (
            <ReportScannerView setActiveTab={setActiveTab} />
          )}

          {activeTab === 'system_settings' && (
            <SystemSettingsView />
          )}
        </main>

        {/* Mobile App-like Bottom Navigation Bar */}
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden print:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around safe-bottom"
        >
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-khmer">ទូទៅ</span>
          </button>

          <button
            onClick={() => setActiveTab('student_fees')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'student_fees'
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-khmer">ថ្លៃសិក្សា</span>
          </button>

          {/* Quick POS Center Button (Floating App Pill style) */}
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex flex-col items-center justify-center py-1 px-3 -mt-3 rounded-2xl shadow-md transition-all ${
              activeTab === 'pos'
                ? 'bg-emerald-600 text-white shadow-emerald-500/30 ring-2 ring-emerald-300'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
            }`}
          >
            <ShoppingCart className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-khmer font-bold">លក់ POS</span>
          </button>

          <button
            onClick={() => setActiveTab('uniform_sales')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'uniform_sales' || activeTab === 'uniform_history'
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Shirt className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-khmer">ឯកសណ្ឋាន</span>
          </button>

          <button
            onClick={() => setActiveTab('school_bus')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'school_bus'
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bus className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-khmer">រថយន្ត</span>
          </button>
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
