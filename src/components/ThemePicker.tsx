// Header "Theme" button: background colour, colour skin and icon style
import React, { useEffect, useRef, useState } from 'react';
import { Palette, Check, RotateCcw, Home, Users, Settings, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThemePrefs, DEFAULT_THEME, SKINS, BACKGROUNDS, loadTheme, saveTheme, applyTheme, backgroundColor } from '../utils/theme';

export const ThemePicker: React.FC<{ open?: boolean; onOpenChange?: (v: boolean) => void; hideButton?: boolean }> = ({ open: openProp, onOpenChange, hideButton }) => {
  const { currentUser } = useApp();
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (v: boolean | ((p: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(open) : v;
    setOpenState(next);
    onOpenChange?.(next);
  };
  const [prefs, setPrefs] = useState<ThemePrefs>(() => loadTheme(currentUser?.id));
  const ref = useRef<HTMLDivElement>(null);

  // Each account keeps its own look on this device
  useEffect(() => {
    const p = loadTheme(currentUser?.id);
    setPrefs(p);
    applyTheme(p);
  }, [currentUser?.id]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const update = (patch: Partial<ThemePrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    applyTheme(next);
    saveTheme(next, currentUser?.id);
  };

  const swatch = 'relative h-8 w-8 rounded-full border-2 transition hover:scale-110';

  return (
    <div className="relative" ref={ref}>
      {!hideButton && <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="ប្តូរ Theme (ពណ៌ផ្ទៃ, Skin, រូបតំណាង)"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs cursor-pointer"
      >
        <Palette className="w-3.5 h-3.5 text-teal-600" />
        <span className="hidden xl:inline font-khmer">Theme</span>
      </button>}

      {open && (
        <div className="fixed sm:absolute top-16 sm:top-full mt-2 left-3 right-3 sm:left-auto sm:right-0 sm:w-80 z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl font-khmer">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-900">Theme របស់ខ្ញុំ</div>
            <button
              type="button"
              onClick={() => update(DEFAULT_THEME)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" /> លំនាំដើម
            </button>
          </div>

          {/* Skin */}
          <div className="mb-1.5 text-[11px] font-bold text-slate-500">Skin (ពណ៌សំខាន់)</div>
          <div className="mb-3 flex flex-wrap gap-2">
            {Object.entries(SKINS).map(([k, s]) => (
              <button
                key={k}
                type="button"
                title={s.name}
                onClick={() => update({ skin: k })}
                className={`${swatch} ${prefs.skin === k ? 'border-slate-900' : 'border-white shadow'}`}
                style={{ background: `linear-gradient(135deg, ${s.c[4]}, ${s.c[7]})` }}
              >
                {prefs.skin === k && <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />}
              </button>
            ))}
          </div>

          {/* Background */}
          <div className="mb-1.5 text-[11px] font-bold text-slate-500">ពណ៌ផ្ទៃខាងក្រោយ (Background)</div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {Object.entries(BACKGROUNDS).map(([k, b]) => {
              const color = b.color === 'skin' ? (SKINS[prefs.skin] || SKINS.teal).c[1] : b.color;
              return (
                <button
                  key={k}
                  type="button"
                  title={b.name}
                  onClick={() => update({ bg: k })}
                  className={`${swatch} ${prefs.bg === k ? 'border-teal-600' : 'border-slate-200'}`}
                  style={{ background: color }}
                >
                  {prefs.bg === k && <Check className="absolute inset-0 m-auto h-4 w-4 text-teal-700" />}
                  {b.color === 'skin' && prefs.bg !== k && <span className="absolute inset-0 m-auto h-2 w-2 rounded-full" style={{ background: (SKINS[prefs.skin] || SKINS.teal).c[6] }} />}
                </button>
              );
            })}
            <label title="ពណ៌ផ្ទាល់ខ្លួន" className={`${swatch} cursor-pointer overflow-hidden ${prefs.bg.startsWith('#') ? 'border-teal-600' : 'border-slate-200'}`} style={{ background: 'conic-gradient(#f87171,#fbbf24,#34d399,#60a5fa,#a78bfa,#f87171)' }}>
              <input type="color" value={backgroundColor(prefs)} onChange={(e) => update({ bg: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
            </label>
          </div>

          {/* Icon style */}
          <div className="mb-1.5 text-[11px] font-bold text-slate-500">រចនាប័ទ្មរូបតំណាង (Icon style)</div>
          <div className="mb-2 grid grid-cols-3 gap-1.5">
            {([
              ['thin', 'ស្តើង', 1.4],
              ['regular', 'ធម្មតា', 1.9],
              ['bold', 'ក្រាស់', 2.5],
            ] as const).map(([k, label, w]) => (
              <button
                key={k}
                type="button"
                onClick={() => update({ icon: k })}
                className={`flex flex-col items-center gap-1 rounded-xl border py-2 text-[11px] font-bold ${prefs.icon === k ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <span className="flex gap-1" style={{ ['--icon-stroke' as any]: w }}>
                  <Home className="h-4 w-4" style={{ strokeWidth: w }} />
                  <Users className="h-4 w-4" style={{ strokeWidth: w }} />
                  <Bell className="h-4 w-4" style={{ strokeWidth: w }} />
                </span>
                {label}
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><Settings className="h-4 w-4" /></span>
              រូបតំណាងម៉ឺនុយលើផ្ទាំងពណ៌
            </span>
            <input type="checkbox" checked={prefs.iconChips} onChange={(e) => update({ iconChips: e.target.checked })} className="h-4 w-4 accent-teal-600" />
          </label>
          <p className="mt-2 text-[10px] text-slate-400">រក្សាទុកសម្រាប់គណនីរបស់អ្នក នៅលើឧបករណ៍នេះ</p>
        </div>
      )}
    </div>
  );
};
