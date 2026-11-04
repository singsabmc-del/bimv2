import React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  ShoppingBag,
  Store,
  Shirt,
  FileText,
  Printer,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'student_fees'
  | 'daily_materials'
  | 'canteen_vendors'
  | 'uniform_sales'
  | 'original_reports'
  | 'ai_scanner';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onPrint: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onPrint,
  onReset,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <a
                href="#top"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('overview');
                }}
                className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap block"
              >
                BIM Rangsei School
              </a>
              <span className="text-xs text-slate-500 font-khmer block -mt-0.5">
                សាលា អ៊ីរ៉ែលកម្ពុជា
              </span>
            </div>
          </div>

          {/* Zone 2: 5 clean single-line nav links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs xl:text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('student_fees')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'student_fees'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Student Fees</span>
            </button>

            <button
              onClick={() => setActiveTab('daily_materials')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'daily_materials'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Daily Materials</span>
            </button>

            <button
              onClick={() => setActiveTab('canteen_vendors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'canteen_vendors'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Canteen Vendors</span>
            </button>

            <button
              onClick={() => setActiveTab('uniform_sales')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'uniform_sales'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Shirt className="w-4 h-4" />
              <span>Uniform Sales</span>
            </button>

            <button
              onClick={() => setActiveTab('original_reports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'original_reports'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Original Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_scanner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'ai_scanner'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'hover:text-amber-700 text-amber-700 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Scanner</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onPrint}
              title="Print official report"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onReset}
              title="Reset data to original report values"
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('ai_scanner')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Upload Report
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="lg:hidden flex overflow-x-auto border-t border-slate-200 px-3 py-2 gap-2 text-xs no-scrollbar bg-slate-50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 bg-white border border-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('student_fees')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'student_fees' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 bg-white border border-slate-200'
          }`}
        >
          Student Fees
        </button>
        <button
          onClick={() => setActiveTab('daily_materials')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'daily_materials' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 bg-white border border-slate-200'
          }`}
        >
          Daily Materials
        </button>
        <button
          onClick={() => setActiveTab('canteen_vendors')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'canteen_vendors' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 bg-white border border-slate-200'
          }`}
        >
          Canteen
        </button>
        <button
          onClick={() => setActiveTab('uniform_sales')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'uniform_sales' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 bg-white border border-slate-200'
          }`}
        >
          Uniforms
        </button>
        <button
          onClick={() => setActiveTab('original_reports')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'original_reports' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 bg-white border border-slate-200'
          }`}
        >
          Screenshots
        </button>
        <button
          onClick={() => setActiveTab('ai_scanner')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'ai_scanner' ? 'bg-amber-600 text-white font-medium' : 'text-amber-800 bg-amber-50 border border-amber-200'
          }`}
        >
          AI Scan
        </button>
      </div>
    </header>
  );
};
