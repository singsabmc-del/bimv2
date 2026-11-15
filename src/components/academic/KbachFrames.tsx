// Khmer ornamental (kbach) certificate frames — pure SVG, crisp in print, no external images.
// Motifs: ក្បាច់ភ្ញីទេស (flame-leaf band), ផ្កាឈូក (lotus rosette corners), ក្បាច់កំពូល (crown crest).
import React, { useId } from 'react';

export type KbachFrameId = 'royal-blue' | 'phni-tes-gold' | 'angkor-red' | 'lotus-green' | 'temple-stone' | 'simple-line';

export interface KbachPalette {
  outer: string; // outermost board colour
  band: string; // kbach band background
  motif: string; // kbach motif colour
  accent: string; // dots / secondary lines
  paper: string; // CSS background of the writing area
  ink: string; // body text colour
  title: string; // title colour
}

export const KBACH_FRAMES: { id: KbachFrameId; nameKh: string; palette: KbachPalette; band: number; motif: 'phni-tes' | 'chhouk' | 'none' }[] = [
  {
    id: 'royal-blue',
    nameKh: 'ខៀវរាជ្យ មាស',
    band: 14,
    motif: 'phni-tes',
    palette: {
      outer: '#0b2a6f',
      band: '#0b2a6f',
      motif: '#d4af37',
      accent: '#f5d77a',
      paper: 'radial-gradient(circle at 50% 35%, #fffdf5 0%, #fbf3dc 60%, #f3e3b8 100%)',
      ink: '#0b2a6f',
      title: '#c0151b',
    },
  },
  {
    id: 'phni-tes-gold',
    nameKh: 'ក្បាច់ភ្ញីទេស មាស',
    band: 16,
    motif: 'phni-tes',
    palette: {
      outer: '#8a6416',
      band: '#fff4d6',
      motif: '#b8860b',
      accent: '#c0151b',
      paper: 'radial-gradient(circle at 50% 30%, #ffffff 0%, #fff8e6 65%, #f6e7bf 100%)',
      ink: '#5a3d06',
      title: '#b0121a',
    },
  },
  {
    id: 'angkor-red',
    nameKh: 'ក្រហមអង្គរ',
    band: 15,
    motif: 'chhouk',
    palette: {
      outer: '#7a0e14',
      band: '#7a0e14',
      motif: '#e8c25a',
      accent: '#ffe7a3',
      paper: 'radial-gradient(circle at 50% 35%, #fffaf2 0%, #fbeedd 65%, #f0d9b5 100%)',
      ink: '#5b0a0f',
      title: '#a3121b',
    },
  },
  {
    id: 'lotus-green',
    nameKh: 'បៃតងផ្កាឈូក',
    band: 14,
    motif: 'chhouk',
    palette: {
      outer: '#0f4d33',
      band: '#0f4d33',
      motif: '#e6c55f',
      accent: '#f7a8c0',
      paper: 'radial-gradient(circle at 50% 35%, #fbfff9 0%, #eef8ee 65%, #d9ecd8 100%)',
      ink: '#0f3d29',
      title: '#b4123c',
    },
  },
  {
    id: 'temple-stone',
    nameKh: 'ថ្មប្រាសាទ',
    band: 16,
    motif: 'phni-tes',
    palette: {
      outer: '#5b4a3a',
      band: '#cbb79a',
      motif: '#5b4a3a',
      accent: '#8a6f52',
      paper: 'radial-gradient(circle at 50% 30%, #fbf8f2 0%, #f1e9dc 70%, #e4d6c0 100%)',
      ink: '#3d3126',
      title: '#7a2e12',
    },
  },
  {
    id: 'simple-line',
    nameKh: 'បន្ទាត់សាមញ្ញ (សន្សំទឹកថ្នាំ)',
    band: 6,
    motif: 'none',
    palette: {
      outer: '#ffffff',
      band: '#ffffff',
      motif: '#1f2937',
      accent: '#1f2937',
      paper: '#ffffff',
      ink: '#111827',
      title: '#111827',
    },
  },
];

export const getFrame = (id?: string) => KBACH_FRAMES.find((f) => f.id === id) || KBACH_FRAMES[0];

/** One repeating tile of the band (horizontal orientation), 40 × 24 units. */
const BandTile: React.FC<{ p: KbachPalette; motif: 'phni-tes' | 'chhouk' | 'none' }> = ({ p, motif }) => {
  if (motif === 'none') return <rect x="0" y="11" width="40" height="2" fill={p.motif} />;
  if (motif === 'chhouk')
    // lotus bud row (ក្បាច់ផ្កាឈូក)
    return (
      <g>
        <rect x="0" y="0" width="40" height="1.6" fill={p.motif} />
        <rect x="0" y="22.4" width="40" height="1.6" fill={p.motif} />
        <path d="M20 4 C13 9 13 16 20 20 C27 16 27 9 20 4 Z" fill={p.motif} />
        <path d="M20 7 C17 10 17 15 20 17.5 C23 15 23 10 20 7 Z" fill={p.band} />
        <path d="M12 19 C9 15 9 11 12 8 C13 12 15 15 18 19 Z" fill={p.motif} opacity="0.85" />
        <path d="M28 19 C31 15 31 11 28 8 C27 12 25 15 22 19 Z" fill={p.motif} opacity="0.85" />
        <circle cx="4" cy="12" r="1.6" fill={p.accent} />
        <circle cx="36" cy="12" r="1.6" fill={p.accent} />
      </g>
    );
  // flame-leaf band (ក្បាច់ភ្ញីទេស)
  return (
    <g>
      <rect x="0" y="0" width="40" height="1.6" fill={p.motif} />
      <rect x="0" y="22.4" width="40" height="1.6" fill={p.motif} />
      <path d="M2 21 C2 11 10 5 20 4 C30 5 38 11 38 21" fill="none" stroke={p.motif} strokeWidth="1.3" />
      <path d="M20 6 C14.5 10 14.5 16 20 20.5 C25.5 16 25.5 10 20 6 Z" fill={p.motif} />
      <path d="M20 9.5 C18 11.5 18 15 20 17 C22 15 22 11.5 20 9.5 Z" fill={p.accent} />
      <path d="M7 20.5 C6.5 15 9.5 11.5 13 12.5 C10.5 13.5 9.8 16.5 11.5 20.5 Z" fill={p.motif} />
      <path d="M33 20.5 C33.5 15 30.5 11.5 27 12.5 C29.5 13.5 30.2 16.5 28.5 20.5 Z" fill={p.motif} />
      <circle cx="20" cy="2.6" r="1" fill={p.accent} />
    </g>
  );
};

/** Lotus rosette (ផ្កាឈូក) placed on the four corners. */
const Rosette: React.FC<{ p: KbachPalette; size: number }> = ({ p, size }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden="true">
    <rect x="0" y="0" width="60" height="60" fill={p.band} />
    <rect x="1.5" y="1.5" width="57" height="57" fill="none" stroke={p.motif} strokeWidth="1.5" />
    <g transform="translate(30 30)">
      {Array.from({ length: 8 }).map((_, i) => (
        <path key={i} transform={`rotate(${i * 45})`} d="M0 -26 C7 -18 7 -10 0 -6 C-7 -10 -7 -18 0 -26 Z" fill={p.motif} />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <path key={`s${i}`} transform={`rotate(${i * 45 + 22.5})`} d="M0 -18 C4 -13 4 -9 0 -7 C-4 -9 -4 -13 0 -18 Z" fill={p.accent} opacity="0.9" />
      ))}
      <circle r="6.5" fill={p.motif} />
      <circle r="3" fill={p.accent} />
    </g>
  </svg>
);

/** Crown crest (ក្បាច់កំពូល) at the top-centre of the frame. */
const Crest: React.FC<{ p: KbachPalette }> = ({ p }) => (
  <svg width="120" height="34" viewBox="0 0 120 34" aria-hidden="true">
    <path d="M4 32 C24 32 34 22 44 14 C50 9 54 4 60 1 C66 4 70 9 76 14 C86 22 96 32 116 32 Z" fill={p.band} stroke={p.motif} strokeWidth="1.5" />
    <path d="M60 5 C53 12 53 22 60 29 C67 22 67 12 60 5 Z" fill={p.motif} />
    <path d="M60 11 C57 15 57 20 60 24 C63 20 63 15 60 11 Z" fill={p.accent} />
    <path d="M40 30 C38 23 42 18 48 18 C44 21 44 26 47 30 Z M80 30 C82 23 78 18 72 18 C76 21 76 26 73 30 Z" fill={p.motif} />
    <path d="M22 31 C22 27 25 25 29 26 C26 27 26 29 27 31 Z M98 31 C98 27 95 25 91 26 C94 27 94 29 93 31 Z" fill={p.motif} opacity="0.85" />
  </svg>
);

/**
 * Full certificate frame. Children render on the "paper" area; CSS variables --ink and --title
 * carry the frame's text colours to the content.
 */
export const KbachFrame: React.FC<{ frameId?: string; children: React.ReactNode; minHeightMm?: number }> = ({
  frameId,
  children,
  minHeightMm = 287,
}) => {
  const f = getFrame(frameId);
  const p = f.palette;
  const uid = useId().replace(/:/g, '');
  const bandPx = f.band * 2.2; // visual thickness of the band in px
  const corner = bandPx + 10;
  const vars = { '--ink': p.ink, '--title': p.title } as React.CSSProperties;

  if (f.motif === 'none') {
    return (
      <div className="bg-white p-[5mm]" style={{ ...vars, minHeight: `${minHeightMm}mm` }}>
        <div className="border-[3px] border-double p-[2mm]" style={{ borderColor: p.motif, minHeight: `${minHeightMm - 10}mm` }}>
          <div className="flex flex-col border px-[12mm] py-[10mm]" style={{ borderColor: p.motif, background: p.paper, minHeight: `${minHeightMm - 16}mm` }}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  const strip = (orientation: 'h' | 'v') => (
    <svg width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern
          id={`kb-${uid}-${orientation}`}
          width="40"
          height="24"
          patternUnits="userSpaceOnUse"
          patternTransform={orientation === 'v' ? `rotate(90) scale(${bandPx / 24})` : `scale(${bandPx / 24})`}
        >
          <rect width="40" height="24" fill={p.band} />
          <BandTile p={p} motif={f.motif} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#kb-${uid}-${orientation})`} />
    </svg>
  );

  return (
    <div className="p-[4mm]" style={{ ...vars, background: p.outer, minHeight: `${minHeightMm}mm` }}>
      <div className="relative" style={{ padding: bandPx, minHeight: `${minHeightMm - 8}mm`, background: p.band }}>
        {/* bands */}
        <div className="absolute left-0 right-0 top-0" style={{ height: bandPx }}>{strip('h')}</div>
        <div className="absolute bottom-0 left-0 right-0 rotate-180" style={{ height: bandPx }}>{strip('h')}</div>
        <div className="absolute bottom-0 left-0 top-0 -scale-x-100" style={{ width: bandPx }}>{strip('v')}</div>
        <div className="absolute bottom-0 right-0 top-0" style={{ width: bandPx }}>{strip('v')}</div>
        {/* lotus corners */}
        {(['left-0 top-0', 'right-0 top-0', 'left-0 bottom-0', 'right-0 bottom-0'] as const).map((pos) => (
          <div key={pos} className={`absolute ${pos} z-10`} style={{ margin: -5 }}>
            <Rosette p={p} size={corner} />
          </div>
        ))}
        {/* crest */}
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2" style={{ marginTop: -6 }}>
          <Crest p={p} />
        </div>
        <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 rotate-180" style={{ marginBottom: -6 }}>
          <Crest p={p} />
        </div>
        {/* paper */}
        <div
          className="relative flex flex-col px-[12mm] py-[10mm]"
          style={{
            background: p.paper,
            minHeight: `calc(${minHeightMm - 8}mm - ${bandPx * 2}px)`,
            boxShadow: `inset 0 0 0 1.5px ${p.motif}, inset 0 0 0 5px ${p.band === p.outer ? 'transparent' : p.band}, inset 0 0 0 6px ${p.motif}`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

/** Small swatch preview for the frame picker. */
export const KbachFrameSwatch: React.FC<{ frameId: KbachFrameId; active?: boolean; onClick?: () => void }> = ({ frameId, active, onClick }) => {
  const f = getFrame(frameId);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border-2 p-1.5 text-[10.5px] transition ${active ? 'border-indigo-500 bg-indigo-50' : 'border-transparent hover:border-slate-200'}`}
    >
      <div className="pointer-events-none h-[88px] w-[66px] overflow-hidden rounded">
        <div className="origin-top-left scale-[0.105]" style={{ width: '210mm' }}>
          <KbachFrame frameId={frameId} minHeightMm={280}>
            <div className="text-center text-[60px] font-bold" style={{ color: 'var(--title)' }}>
              ★
            </div>
          </KbachFrame>
        </div>
      </div>
      <span className="text-center leading-tight text-slate-700">{f.nameKh}</span>
    </button>
  );
};
