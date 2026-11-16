// Shared Khmer official-document pieces: header (ministry / school + Kingdom motto),
// ornament dividers, signature blocks and an orientation-aware print helper.
import React from 'react';
import { useApp } from '../../context/AppContext';
import { toKh } from '../../utils/academic';

/** Traditional divider under the national motto: ─── ❖ ─── */
export const KhmerOrnament: React.FC<{ className?: string; color?: string }> = ({ className = '', color = '#1e3a8a' }) => (
  <div className={`flex items-center justify-center gap-1.5 ${className}`} aria-hidden="true">
    <span className="h-px w-8" style={{ background: color }} />
    <span className="text-[10px] leading-none" style={{ color }}>
      ❖
    </span>
    <span className="h-[2px] w-10 rounded" style={{ background: color }} />
    <span className="text-[10px] leading-none" style={{ color }}>
      ❖
    </span>
    <span className="h-px w-8" style={{ background: color }} />
  </div>
);

/** Kbach-style corner flourish for certificates (pure CSS/SVG, no external images). */
export const KbachCorner: React.FC<{ className?: string; color?: string }> = ({ className = '', color = '#b8860b' }) => (
  <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
    <path d="M4 76 V20 Q4 4 20 4 H76" fill="none" stroke={color} strokeWidth="3" />
    <path d="M12 76 V26 Q12 12 26 12 H76" fill="none" stroke={color} strokeWidth="1.2" />
    <path d="M20 40 Q20 20 40 20 Q30 28 32 40 Q24 34 20 40Z" fill={color} opacity="0.85" />
    <circle cx="20" cy="20" r="3.5" fill={color} />
    <path d="M44 20 q8 -8 16 0 q-8 4 -16 0Z M20 44 q-8 8 0 16 q4 -8 0 -16Z" fill={color} opacity="0.7" />
  </svg>
);

/** Official header: left = ministry / office / school, right = Kingdom of Cambodia motto. */
export const KhmerDocHeader: React.FC<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  compact?: boolean;
}> = ({ title, subtitle, badge, compact }) => {
  const { settings } = useApp();
  const dept = settings.ministryDeptName || 'មន្ទីរអប់រំ យុវជន និងកីឡា';
  const office = settings.eduOfficeName || '';
  const school = settings.schoolNameKhmer || 'សាលារៀន';
  return (
    <div className="text-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col items-center text-center">
          <div className={`font-muol ${compact ? 'text-[11px]' : 'text-[12.5px]'}`}>{dept}</div>
          {office && <div className={`font-muol ${compact ? 'text-[10.5px]' : 'text-[12px]'}`}>{office}</div>}
          <div className={`font-muol text-[#1e3a8a] ${compact ? 'text-[11.5px]' : 'text-[13px]'}`}>{school}</div>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className={`font-muol ${compact ? 'text-[13px]' : 'text-[15px]'}`}>ព្រះរាជាណាចក្រកម្ពុជា</div>
          <div className={`font-muol ${compact ? 'text-[11.5px]' : 'text-[13px]'}`}>ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
          <KhmerOrnament className="mt-0.5" />
        </div>
      </div>
      {(title || subtitle || badge) && (
        <div className="mt-2 flex flex-col items-center text-center">
          {title && <div className={`font-muol ${compact ? 'text-base' : 'text-xl'} text-slate-950`}>{title}</div>}
          {subtitle && <div className="font-khmer text-[13px] text-slate-800">{subtitle}</div>}
          {badge && (
            <div className="mt-1 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-0.5 font-muol text-[12px] text-indigo-800 print:border-slate-400 print:bg-white print:text-black">
              {badge}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** Lunar + solar date lines and a signature title, Khmer layout. */
export const KhmerSignatureBlock: React.FC<{
  role: string;
  name?: string;
  lunarDate?: string;
  solarPlace?: string;
  stampUrl?: string;
  showDates?: boolean;
}> = ({ role, name, lunarDate, solarPlace, stampUrl, showDates = true }) => (
  <div className="flex flex-col items-center text-center font-khmer text-[12px] text-slate-900">
    {showDates && (
      <>
        <div>{lunarDate || 'ថ្ងៃ...............ខែ.............ឆ្នាំ.............ព.ស. ២៥.....'}</div>
        <div>{solarPlace || '.....................ថ្ងៃទី.........ខែ.................ឆ្នាំ២០.....'}</div>
      </>
    )}
    <div className="font-muol text-[12.5px] mt-0.5">{role}</div>
    <div className="relative h-16 w-40">
      {stampUrl && <img src={stampUrl} alt="" className="absolute inset-0 m-auto h-16 object-contain opacity-90" />}
    </div>
    {name && <div className="font-muol text-[12.5px]">{name}</div>}
  </div>
);

/** Print with a specific page orientation (A4 portrait / landscape). */
export const printWithOrientation = (orientation: 'portrait' | 'landscape') => {
  const style = document.createElement('style');
  style.setAttribute('data-print-orientation', '1');
  style.textContent = `@media print { @page { size: A4 ${orientation}; margin: 8mm; } }`;
  document.head.appendChild(style);
  const cleanup = () => {
    style.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
  setTimeout(cleanup, 60000);
};

/** Small helper for "ឆ្នាំសិក្សា ២០២៦-២០២៧". */
export const khYear = (year?: string) => toKh(year || '');

/** Shared control-panel card (screen only). */
export const PanelCard: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }> = ({
  title,
  icon,
  children,
  className = '',
}) => (
  <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden ${className}`}>
    <div className="mb-3 flex items-center gap-2 font-khmer text-sm font-bold text-slate-800">
      {icon}
      {title}
    </div>
    {children}
  </div>
);
