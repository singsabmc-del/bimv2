import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Building,
  Languages,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, settings, currentBranch, language, setLanguage, t } = useApp();

  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('BIM_RANGSEI_REMEMBER_ME');
        return saved !== null ? saved === 'true' : true;
      }
    } catch {}
    return true;
  });

  const [usernameOrEmail, setUsernameOrEmail] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('BIM_RANGSEI_REMEMBERED_USERNAME') || '';
      }
    } catch {}
    return '';
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = login(usernameOrEmail, password, rememberMe);
      if (!result.success) {
        setErrorMessage(result.error || t('ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ', 'Invalid username or password'));
        setIsLoading(false);
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-850 to-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-amber-400 selection:text-slate-950 relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar: Campus Info & Language Switcher */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 backdrop-blur-md shadow-xs">
          <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs text-slate-200 font-khmer font-semibold truncate max-w-[170px] sm:max-w-none">
            {currentBranch.nameKhmer.split('(')[0].trim()}
          </span>
          <span className="text-[10px] font-mono text-amber-400 px-1.5 py-0.2 bg-amber-500/20 rounded font-bold">
            {currentBranch.code}
          </span>
        </div>

        {/* Language switch */}
        <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 p-1 rounded-xl backdrop-blur-md">
          <Languages className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          <button
            type="button"
            onClick={() => setLanguage('km')}
            className={`px-2.5 py-1 rounded-lg text-xs font-khmer font-semibold transition-all ${
              language === 'km'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ខ្មែរ
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 rounded-lg text-xs font-sans font-semibold transition-all ${
              language === 'en'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            EN
          </button>
        </div>
      </header>

      {/* Main Container Card */}
      <main className="w-full max-w-5xl mx-auto my-auto py-6 sm:py-10 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: School Crest & System Overview */}
          <div className="lg:col-span-6 text-white space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 p-2 pr-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md shadow-inner">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div className="text-left">
                <div className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
                  Cambodia Education Portal
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  Academic Year {settings.academicYear}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                {settings.schoolNameEnglish}
              </h1>
              <h2 className="text-2xl sm:text-3xl font-bold text-amber-400 font-khmer">
                {settings.schoolNameKhmer}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm font-khmer pt-2 max-w-lg leading-relaxed">
                {t(
                  'ប្រព័ន្ធគ្រប់គ្រងរដ្ឋបាល និងហិរញ្ញវត្ថុសាលារៀន ៖ ប្រមូលថ្លៃសិក្សា គ្រប់គ្រងសិស្ស របាយការណ៍ហាងទំនិញ POS អាហារដ្ឋាន និងរថយន្តដឹកសិស្ស។',
                  'Comprehensive school administration and financial management: tuition fee collection, student records, POS stationery, canteen, and bus transportation.'
                )}
              </p>
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2 max-w-md mx-auto lg:mx-0">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2.5 text-left">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white font-khmer">
                    {t('គ្រប់គ្រងថ្លៃសិក្សា & POS', 'Tuition & POS Billing')}
                  </div>
                  <div className="text-[11px] text-slate-400 font-khmer">
                    {t('វិក្កយបត្រ & បង្កាន់ដៃរហ័ស', 'Instant invoice & receipt')}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2.5 text-left">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white font-khmer">
                    {t('ជូនដំណឹង Telegram', 'Telegram Real-Time Alerts')}
                  </div>
                  <div className="text-[11px] text-slate-400 font-khmer">
                    {t('ស្វ័យប្រវត្តទៅគ្រុបគណនេយ្យ', 'Auto bot dispatch on payment')}
                  </div>
                </div>
              </div>
            </div>

            {/* Security Trust Note */}
            <div className="flex items-center justify-center lg:justify-start gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('ការតភ្ជាប់មានសុវត្ថិភាពខ្ពស់ 256-Bit Encrypted & Durable Offline Sync', '256-Bit Encrypted Connection & Durable Storage')}</span>
            </div>
          </div>

          {/* Right Column: Interactive Login Box */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-white/98 rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 backdrop-blur-xl relative">
              <div className="mb-6 text-left">
                <h3 className="text-xl font-extrabold text-slate-900 font-khmer">
                  {t('ចូលប្រើប្រាស់ប្រព័ន្ធ', 'Sign In to Your Account')}
                </h3>
                <p className="text-xs text-slate-500 font-khmer mt-1">
                  {t('សូមបញ្ចូលឈ្មោះគណនី ឬអ៊ីមែល និងពាក្យសម្ងាត់របស់អ្នក', 'Enter your username/email and password to proceed')}
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 animate-in fade-in duration-200">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs font-khmer font-semibold leading-relaxed">
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username or Email Input */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 font-khmer">
                    {t('ឈ្មោះគណនី ឬអ៊ីមែល', 'Username or Email')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      placeholder={t('ឧទាហរណ៍៖ director ឬ accountant', 'e.g. director or accountant')}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 font-khmer">
                    {t('ពាក្យសម្ងាត់', 'Password')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me / Remember Login Toggle */}
                <div className="flex items-center justify-between text-xs pt-1.5">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400 cursor-pointer accent-amber-500"
                    />
                    <span className="font-khmer text-slate-700 font-semibold text-xs">
                      {t('ចងចាំការចូល (Remember Login)', 'Remember Login')}
                    </span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-khmer">
                    {t('រក្សាទុកការចូល', 'Stay logged in')}
                  </span>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-3 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-950/20 disabled:opacity-70 disabled:cursor-not-allowed font-khmer cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 text-amber-400" />
                      <span>{t('ចូលប្រព័ន្ធ (Sign In)', 'Sign In')}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Security & Support Note */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-khmer">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {t(
                      'ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យសុវត្ថិភាពសាលា · សូមទាក់ទងរដ្ឋបាល ប្រសិនបើភ្លេចលេខកូដ',
                      'Secure School Management · Contact administration if you forgot password'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <footer className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 pt-4 border-t border-slate-800/80 z-10 font-khmer">
        <div className="flex items-center gap-2">
          <span className="font-sans font-bold text-slate-200">{settings.schoolNameEnglish}</span>
          <span>·</span>
          <span className="text-amber-400 font-semibold">{settings.schoolNameKhmer}</span>
          <span>·</span>
          <span>{settings.directorName}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span>Exchange: 1$ = {settings.exchangeRate.toLocaleString()}៛</span>
          <span>·</span>
          <span>Version 3.0</span>
        </div>
      </footer>
    </div>
  );
};
