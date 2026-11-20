// Personal look & feel: page background, colour skin and icon style (saved per device & account)
export interface ThemePrefs {
  skin: string; // key of SKINS
  bg: string; // key of BACKGROUNDS, or a hex colour
  icon: 'thin' | 'regular' | 'bold';
  iconChips: boolean; // menu icons on a soft coloured tile
  sidebar: string; // key of SIDEBARS, or a hex colour
}

export const DEFAULT_THEME: ThemePrefs = { skin: 'teal', bg: 'mint', icon: 'regular', iconChips: false, sidebar: 'white' };

const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;

/** Colour skins (Tailwind-like scales 50 → 950) */
export const SKINS: Record<string, { name: string; c: string[] }> = {
  teal: { name: 'បៃតងខ្ចី (Teal)', c: ['#f0fdfa', '#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a', '#042f2e'] },
  emerald: { name: 'បៃតង (Emerald)', c: ['#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#022c22'] },
  blue: { name: 'ខៀវ (Blue)', c: ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554'] },
  indigo: { name: 'ខៀវចាស់ (Indigo)', c: ['#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81', '#1e1b4b'] },
  violet: { name: 'ស្វាយ (Violet)', c: ['#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#2e1065'] },
  rose: { name: 'ផ្កាឈូក (Rose)', c: ['#fff1f2', '#ffe4e6', '#fecdd3', '#fda4af', '#fb7185', '#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337', '#4c0519'] },
  orange: { name: 'ទឹកក្រូច (Orange)', c: ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12', '#431407'] },
  maroon: { name: 'ក្រហមចាស់ BIM (Maroon)', c: ['#fdf2f2', '#fbe3e3', '#f6c6c6', '#ee9c9c', '#e06a6a', '#c94343', '#b22a2a', '#951f1f', '#7a1c1c', '#5c1717', '#3a0d0d'] },
  slate: { name: 'ប្រផេះ (Slate)', c: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#020617'] },
};

export const BACKGROUNDS: Record<string, { name: string; color: string }> = {
  mint: { name: 'បៃតងស្រាល', color: '#f4f7f6' },
  gray: { name: 'ប្រផេះស្រាល', color: '#f3f4f6' },
  warm: { name: 'ក្រែម', color: '#faf7f2' },
  sky: { name: 'ខៀវស្រាល', color: '#f1f5fb' },
  lavender: { name: 'ស្វាយស្រាល', color: '#f6f4fb' },
  blush: { name: 'ផ្កាឈូកស្រាល', color: '#fbf4f5' },
  white: { name: 'ស', color: '#ffffff' },
  tint: { name: 'តាមពណ៌ Skin', color: 'skin' },
};

/** Side menu colours: light ones keep dark text, dark ones switch to light text */
export const SIDEBARS: Record<string, { name: string }> = {
  white: { name: 'ស' },
  tint: { name: 'ស្រាលតាម Skin' },
  skin: { name: 'Skin ចាស់' },
  dark: { name: 'ខ្មៅ' },
  navy: { name: 'ខៀវចាស់' },
};

/** Background (CSS) and tone of the side menu */
export const sidebarStyle = (prefs: ThemePrefs): { bg: string; tone: 'light' | 'dark' } => {
  const skin = SKINS[prefs.skin] || SKINS.teal;
  const v = prefs.sidebar || 'white';
  if (v.startsWith('#')) {
    const n = parseInt(v.slice(1), 16);
    const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return { bg: v, tone: lum < 0.55 ? 'dark' : 'light' };
  }
  if (v === 'tint') return { bg: skin.c[0], tone: 'light' };
  if (v === 'skin') return { bg: `linear-gradient(180deg, ${skin.c[7]} 0%, ${skin.c[9]} 100%)`, tone: 'dark' };
  if (v === 'dark') return { bg: '#0f172a', tone: 'dark' };
  if (v === 'navy') return { bg: 'linear-gradient(180deg, #1e3a8a 0%, #172554 100%)', tone: 'dark' };
  return { bg: '#ffffff', tone: 'light' };
};

const ICON_STROKE: Record<ThemePrefs['icon'], number> = { thin: 1.4, regular: 1.9, bold: 2.5 };

const keyFor = (userId?: string) => (userId ? `BIM_THEME_${userId}` : 'BIM_THEME_LAST');

export const loadTheme = (userId?: string): ThemePrefs => {
  try {
    const raw = localStorage.getItem(keyFor(userId)) || localStorage.getItem('BIM_THEME_LAST');
    return raw ? { ...DEFAULT_THEME, ...JSON.parse(raw) } : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

export const saveTheme = (prefs: ThemePrefs, userId?: string) => {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(prefs));
    localStorage.setItem('BIM_THEME_LAST', JSON.stringify(prefs));
  } catch {}
};

export const backgroundColor = (prefs: ThemePrefs) => {
  if (prefs.bg.startsWith('#')) return prefs.bg;
  const b = BACKGROUNDS[prefs.bg] || BACKGROUNDS.mint;
  return b.color === 'skin' ? (SKINS[prefs.skin] || SKINS.teal).c[0] : b.color;
};

/** Apply to the page: the app's accent (teal / indigo scales) follows the skin */
export const applyTheme = (prefs: ThemePrefs) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const skin = SKINS[prefs.skin] || SKINS.teal;
  SHADES.forEach((s, i) => {
    root.style.setProperty(`--color-teal-${s}`, skin.c[i]);
    root.style.setProperty(`--color-indigo-${s}`, skin.c[i]);
  });
  root.style.setProperty('--color-brand', skin.c[7]);
  root.style.setProperty('--color-brand-dark', skin.c[8]);
  const bg = backgroundColor(prefs);
  root.style.setProperty('--color-surface', bg);
  root.style.setProperty('--app-bg', bg);
  root.style.setProperty('--icon-stroke', String(ICON_STROKE[prefs.icon] || 1.9));
  root.dataset.icon = prefs.icon;
  root.dataset.iconChips = prefs.iconChips ? 'on' : 'off';
  const sb = sidebarStyle(prefs);
  root.style.setProperty('--sidebar-bg', sb.bg);
  root.dataset.sidebarTone = sb.tone;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', skin.c[7]);
};
