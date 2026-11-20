// "Install app" button (PWA). Android/desktop Chrome: native prompt. iPhone/iPad: Add to Home Screen steps.
import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePwaInstall } from '../utils/pwa';

export const InstallAppButton: React.FC<{ variant?: 'header' | 'card' }> = ({ variant = 'header' }) => {
  const { canInstall, ios, install } = usePwaInstall();
  const [showIos, setShowIos] = useState(false);
  if (!canInstall && !ios) return null;

  const onClick = () => (canInstall ? install() : setShowIos(true));

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={onClick}
          title="ដំឡើងកម្មវិធី (Install App)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold shadow-2xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden lg:inline font-khmer">ដំឡើង App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-300 bg-teal-50 px-4 py-2.5 text-sm font-bold text-teal-800 hover:bg-teal-100 font-khmer"
        >
          <Download className="h-4 w-4" />
          ដំឡើងជាកម្មវិធីលើទូរស័ព្ទ / កុំព្យូទ័រ
        </button>
      )}

      {showIos && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-3 sm:items-center" onClick={() => setShowIos(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 font-khmer shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-bold text-slate-900">ដំឡើងលើ iPhone / iPad</div>
              <button onClick={() => setShowIos(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">1</span>
                បើកក្នុង <b>Safari</b> ហើយចុចប៊ូតុង <Share className="inline h-4 w-4 text-sky-600" /> <b>Share</b>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">2</span>
                ជ្រើស <PlusSquare className="inline h-4 w-4" /> <b>Add to Home Screen</b>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">3</span>
                ចុច <b>Add</b> — រូប BIM School នឹងនៅលើអេក្រង់ដើម
              </li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
};
