// Khmer ornamental (kbach) certificate frames — pure SVG, crisp in print, no external images.
// Motifs: ក្បាច់ភ្ញីទេស (flame-leaf band), ផ្កាឈូក (lotus rosette corners), ក្បាច់កំពូល (crown crest).
import React, { useId } from 'react';

export type KbachFrameId = 'vine-gold' | 'royal-blue' | 'phni-tes-gold' | 'angkor-red' | 'lotus-green' | 'temple-stone' | 'simple-line';

export interface KbachPalette {
  outer: string; // outermost board colour
  band: string; // kbach band background
  motif: string; // kbach motif colour
  accent: string; // dots / secondary lines
  paper: string; // CSS background of the writing area
  ink: string; // body text colour
  title: string; // title colour
}

export type KbachMotif = 'phni-tes' | 'chhouk' | 'none' | 'vine';

export const KBACH_FRAMES: {
  id: KbachFrameId;
  nameKh: string;
  palette: KbachPalette;
  band: number;
  motif: KbachMotif;
  layout?: 'classic' | 'ribbon'; // 'ribbon' = staggered photos with medal + name ribbons
}[] = [
  {
    id: 'vine-gold',
    nameKh: 'វល្លិមាស (ផ្ទៃស)',
    band: 0,
    motif: 'vine',
    layout: 'ribbon',
    palette: {
      outer: '#ffffff',
      band: '#ffffff',
      motif: '#b8862b',
      accent: '#f3d27a',
      paper: '#ffffff',
      ink: '#8a4b0f',
      title: '#e0161e',
    },
  },
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
const BandTile: React.FC<{ p: KbachPalette; motif: KbachMotif }> = ({ p, motif }) => {
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

  if (f.motif === 'vine') {
    return (
      <div className="relative bg-white" style={{ ...vars, minHeight: `${minHeightMm}mm` }}>
        <VineBorder />
        <div className="relative flex flex-col px-[19mm] pb-[18mm] pt-[17mm]" style={{ minHeight: `${minHeightMm}mm` }}>
          {children}
        </div>
      </div>
    );
  }

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

// ───────────── Gold vine border (ក្បាច់វល្លិ) — corners + mid-edge flourishes ─────────────
const GOLD_STOPS = (
  <>
    <stop offset="0" stopColor="#8a5a12" />
    <stop offset="0.35" stopColor="#e9c46a" />
    <stop offset="0.55" stopColor="#fff1b8" />
    <stop offset="0.75" stopColor="#c99a3b" />
    <stop offset="1" stopColor="#7a4e0e" />
  </>
);

/** One vine arm running along the top edge from the corner (x 40→170). */
const VineArm: React.FC<{ g: string }> = ({ g }) => (
  <g fill={`url(#${g})`} stroke="none">
    {/* stem */}
    <path d="M38 30 C60 14 78 40 100 27 C118 17 134 36 152 28 C160 25 166 22 172 24 L172 26.5 C165 25 160 28 152 31 C133 39 117 21 101 30 C78 44 60 18 40 33 Z" />
    {/* curls under the stem */}
    <path d="M70 31 C64 40 70 50 79 47 C86 45 85 36 79 36 C75 36 74 41 77 42 C74 43 71 39 74 35 C78 31 86 34 86 41 C86 50 74 54 67 47 C63 42 65 35 70 31 Z" />
    <path d="M128 31 C123 38 128 46 135 44 C141 42 140 35 135 35 C132 35 131 39 134 40 C131 41 129 37 131 34 C134 31 141 33 141 39 C141 47 131 50 125 44 C122 40 124 34 128 31 Z" />
    {/* flame leaves (ភ្ញីទេស) above the stem */}
    <path d="M92 26 C88 16 94 8 104 6 C99 11 99 17 103 22 C99 21 95 23 92 26 Z" />
    <path d="M112 24 C114 15 122 11 130 13 C124 15 121 19 121 24 C118 22 115 22 112 24 Z" />
    <path d="M58 24 C55 15 60 8 69 7 C65 12 65 17 68 22 C64 21 61 22 58 24 Z" />
    <path d="M146 27 C148 20 154 17 161 18 C156 20 154 23 154 27 C151 26 149 26 146 27 Z" />
    {/* small buds */}
    <circle cx="108" cy="36" r="2.2" />
    <circle cx="50" cy="40" r="2" />
    <circle cx="162" cy="34" r="1.6" />
  </g>
);

/** Corner flourish (top-left orientation), 180 × 180 units. */
const VineCorner: React.FC<{ g: string }> = ({ g }) => (
  <g>
    <VineArm g={g} />
    <g transform="matrix(0 1 1 0 0 0)">
      <VineArm g={g} />
    </g>
    <g fill={`url(#${g})`}>
      {/* big corner spiral */}
      <path d="M14 46 C10 26 26 10 46 14 C62 17 66 38 52 44 C42 48 34 40 38 32 C41 27 48 28 48 33 C46 30 41 31 41 35 C41 41 50 43 55 37 C61 29 54 18 42 18 C26 19 18 34 22 48 C24 56 30 62 38 64 C28 64 18 58 14 46 Z" />
      {/* corner lotus flame pointing inward */}
      <path d="M44 44 C56 46 66 56 70 70 C60 62 52 60 44 62 C48 56 48 50 44 44 Z" />
      <circle cx="30" cy="30" r="3" />
    </g>
  </g>
);

/** Mid-edge flourish (top centre orientation), centred at x=0. */
const VineMid: React.FC<{ g: string }> = ({ g }) => (
  <g fill={`url(#${g})`}>
    <path d="M0 4 C-7 12 -7 22 0 30 C7 22 7 12 0 4 Z" />
    <path d="M0 11 C-3 15 -3 20 0 24 C3 20 3 15 0 11 Z" fill="#fff6d6" />
    {[1, -1].map((d) => (
      <g key={d} transform={`scale(${d} 1)`}>
        <path d="M6 26 C14 14 28 14 34 22 C40 30 52 30 60 22 C56 32 42 36 34 30 C28 25 18 24 10 30 Z" />
        <path d="M30 18 C28 10 33 4 41 3 C37 7 37 12 40 16 C37 15 33 16 30 18 Z" />
        <path d="M46 28 C42 34 47 40 53 38 C58 36 57 30 53 30 C50 30 50 33 52 34 C49 35 47 31 50 28 C53 25 59 27 59 33 C59 41 48 44 43 38 Z" />
        <circle cx="64" cy="22" r="1.8" />
      </g>
    ))}
  </g>
);

/** One repeating 60 × 30 tile of the continuous vine band (horizontal). */
const VineBandTile: React.FC<{ g: string }> = ({ g }) => (
  <g fill={`url(#${g})`}>
    {/* wavy stem */}
    <path d="M0 13.5 C10 3.5 20 23.5 30 13.5 C40 3.5 50 23.5 60 13.5 L60 17 C50 27 40 7 30 17 C20 27 10 7 0 17 Z" />
    {/* full spiral above */}
    <path d="M9 12 C4 6 7 -0.5 14 0 C20 0.5 21 8 16 9.5 C12.5 10.5 11 6 14 5.5 C11.5 4.5 9 7.5 11 10 C13 12.5 19 12 21.5 7.5 C23 14 13 17 9 12 Z" />
    {/* full spiral below */}
    <path d="M51 18 C56 24 53 30.5 46 30 C40 29.5 39 22 44 20.5 C47.5 19.5 49 24 46 24.5 C48.5 25.5 51 22.5 49 20 C47 17.5 41 18 38.5 22.5 C37 16 47 13 51 18 Z" />
    {/* flame leaves (ភ្ញីទេស) */}
    <path d="M23 13 C20 6 25 1 33 1 C28 4.5 28 8.5 31 12 C28 11 25.5 11.5 23 13 Z" />
    <path d="M37 17 C40 24 35 29 27 29 C32 25.5 32 21.5 29 18 C32 19 34.5 18.5 37 17 Z" />
    <circle cx="3" cy="25" r="2" />
    <circle cx="57" cy="5" r="2" />
  </g>
);

/** Ornate gold kbach border: double rules, continuous vine band, big corners and mid crests (A4). */
const VineBorder: React.FC = () => {
  const g = `vg-${useId().replace(/:/g, '')}`;
  const W = 794; // ≈ 210mm @96dpi
  const H = 1085; // ≈ 287mm
  const o = 10; // outer rule
  const band = 32; // vine band thickness
  const i1 = o + band + 4; // inner rule
  const pat = (id: string, vertical: boolean) => (
    <pattern id={id} width="60" height="30" patternUnits="userSpaceOnUse" patternTransform={vertical ? 'rotate(90)' : undefined}>
      <VineBandTile g={g} />
    </pattern>
  );
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          {GOLD_STOPS}
        </linearGradient>
        {pat(`${g}-h`, false)}
        {pat(`${g}-v`, true)}
      </defs>
      {/* continuous vine band on the four edges */}
      <g transform={`translate(0 ${o + 2})`}>
        <rect x={o} width={W - o * 2} height={band} fill={`url(#${g}-h)`} />
      </g>
      <g transform={`translate(${W} ${H - o - 2}) rotate(180)`}>
        <rect x={o} width={W - o * 2} height={band} fill={`url(#${g}-h)`} />
      </g>
      <g transform={`translate(${o + 2 + band} 0)`}>
        <rect x={-band} y={o} width={band} height={H - o * 2} fill={`url(#${g}-v)`} />
      </g>
      <g transform={`translate(${W - o - 2 - band} ${H}) rotate(180)`}>
        <rect x={-band} y={o} width={band} height={H - o * 2} fill={`url(#${g}-v)`} />
      </g>
      {/* rules */}
      <rect x={o} y={o} width={W - o * 2} height={H - o * 2} fill="none" stroke={`url(#${g})`} strokeWidth="3.5" />
      <rect x={i1} y={i1} width={W - i1 * 2} height={H - i1 * 2} fill="none" stroke={`url(#${g})`} strokeWidth="2" />
      <rect x={i1 + 5} y={i1 + 5} width={W - (i1 + 5) * 2} height={H - (i1 + 5) * 2} fill="none" stroke={`url(#${g})`} strokeWidth="0.8" />
      {/* big corner flourishes */}
      {(
        [
          [o - 2, o - 2, 1, 1],
          [W - o + 2, o - 2, -1, 1],
          [o - 2, H - o + 2, 1, -1],
          [W - o + 2, H - o + 2, -1, -1],
        ] as const
      ).map(([x, y, sx, sy], k) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${sx * 1.25} ${sy * 1.25})`}>
          <VineCorner g={g} />
        </g>
      ))}
      {/* mid-edge crests */}
      {(
        [
          [W / 2, i1 + 2, 0, 1.25],
          [W / 2, H - i1 - 2, 180, 1.25],
          [i1 + 2, H / 2, -90, 1.15],
          [W - i1 - 2, H / 2, 90, 1.15],
        ] as const
      ).map(([x, y, r, sc], k) => (
        <g key={k} transform={`translate(${x} ${y}) rotate(${r}) scale(${sc})`}>
          <VineMid g={g} />
        </g>
      ))}
    </svg>
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
