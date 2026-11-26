import type { ReactNode } from 'react';
import { seededRandom } from '../lib/seededRandom';

// GENDY's own palette: pastel panels, cream paper, bold ink outlines.
const INK = '#16181d';
const PAPER = '#fbf7ea';
const SKY = '#7fd6f6';
const PINK = '#f5b3d8';
const MINT = '#a8f0b8';
const LILAC = '#bcb0f5';
const BUTTER = '#fbe58a';
const CORAL = '#f0875f';

// Fixed breakpoints: a sine that has drifted a little, like a waveform mid-mutation.
// Seeded so the pre-rendered HTML and the browser draw the same shape.
const BREAKPOINTS = (() => {
  const r = seededRandom(1957);
  const n = 12;
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = 8 + (i / n) * 284 + (i > 0 && i < n ? (r() - 0.5) * 10 : 0);
    const y = 60 - Math.sin((i / n) * Math.PI * 2) * 34 + (i > 0 && i < n ? (r() - 0.5) * 16 : 0);
    return [x, y] as const;
  });
})();
const WAVE_PATH = BREAKPOINTS.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

const KNOBS = [
  { label: 'Evolution', value: '35%', angle: -50 },
  { label: 'Points', value: '12', angle: -20 },
  { label: 'Round', value: '55%', angle: 15 },
  { label: 'Tone', value: '6.5k', angle: 75 },
  { label: 'Space', value: '25%', angle: -70 },
];

function Panel({ color, title, right, className = '', children }: {
  color: string; title: string; right?: string; className?: string; children: ReactNode;
}) {
  return (
    <div className={`rounded-xl border-2 p-2.5 flex flex-col ${className}`} style={{ backgroundColor: color, borderColor: INK }}>
      <div className="flex justify-between font-mono text-[8px] md:text-[9px] tracking-widest uppercase mb-1.5" style={{ color: INK }}>
        <span>{title}</span>
        {right && <span>{right}</span>}
      </div>
      {children}
    </div>
  );
}

export function GendyPreview() {
  return (
    <div
      className="w-full sm:aspect-[4/3] rounded-lg border-2 p-2.5 pt-8 md:p-3 md:pt-9 flex flex-col gap-2 select-none overflow-hidden"
      style={{
        backgroundColor: PAPER,
        borderColor: INK,
        color: INK,
        backgroundImage: 'linear-gradient(#0000000a 1px, transparent 1px), linear-gradient(90deg, #0000000a 1px, transparent 1px)',
        backgroundSize: '12px 12px',
      }}
    >
      {/* Header */}
      <div className="rounded-xl border-2 px-3 py-1.5 flex items-center gap-3" style={{ backgroundColor: SKY, borderColor: INK }}>
        <svg viewBox="0 0 24 20" className="w-5 h-4 shrink-0" fill={INK}>
          <circle cx="4" cy="11" r="2.6" /><circle cx="11" cy="4" r="2.2" /><circle cx="17" cy="10" r="1.9" /><circle cx="10" cy="17" r="2.4" />
        </svg>
        <span
          className="font-display font-black text-xl md:text-2xl tracking-wide leading-none"
          style={{ color: PAPER, WebkitTextStroke: `1.5px ${INK}`, textShadow: `2px 2px 0 ${INK}` }}
        >
          GENDY
        </span>
        <span className="hidden sm:block font-mono text-[7px] leading-tight tracking-wider uppercase">
          A living waveform<br />Dynamic stochastic synthesis
        </span>
        <div className="ml-auto flex gap-1.5 font-mono text-[8px] uppercase">
          <span className="hidden md:block rounded-md border-2 px-2 py-1" style={{ backgroundColor: PAPER, borderColor: INK }}>01 First light</span>
          <span className="rounded-md border-2 px-2 py-1" style={{ backgroundColor: PINK, borderColor: INK }}>Freeze</span>
        </div>
      </div>

      {/* Waveform + mutation field */}
      <div className="flex-1 min-h-[130px] flex gap-2">
        <Panel color={SKY} title="01 / Waveform" right="12 breakpoints" className="flex-[1.7] min-w-0">
          <div className="flex-1 min-h-0 rounded-lg border-2 overflow-hidden" style={{ backgroundColor: PAPER, borderColor: INK }}>
            <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="w-full h-full">
              {[60, 120, 180, 240].map(x => <line key={x} x1={x} y1="0" x2={x} y2="120" stroke="#0000000f" />)}
              {[30, 60, 90].map(y => <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#0000000f" />)}
              <path d={WAVE_PATH} fill="none" stroke={MINT} strokeWidth="6" strokeLinejoin="round" />
              <path d={WAVE_PATH} fill="none" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
              {BREAKPOINTS.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3.6" fill={PAPER} stroke={INK} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
              ))}
            </svg>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 font-mono text-[7px] tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full border-[1.5px] animate-pulse" style={{ backgroundColor: MINT, borderColor: INK }} />
            Evolving
          </div>
        </Panel>

        <Panel color={PINK} title="02 / Mutation" className="flex-1 min-w-0">
          <div className="flex-1 min-h-0 rounded-lg border-2 relative" style={{ backgroundColor: '#fde3ef', borderColor: INK }}>
            <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(${INK}55 1px, transparent 1px)`, backgroundSize: '10px 10px', backgroundPosition: '5px 5px' }} />
            <div className="absolute top-2 bottom-2 left-[28%] w-px" style={{ backgroundColor: `${INK}80` }} />
            <div className="absolute left-2 right-2 top-[68%] h-px" style={{ backgroundColor: `${INK}80` }} />
            <div
              className="absolute left-[28%] top-[68%] -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2"
              style={{ backgroundColor: CORAL, borderColor: INK, boxShadow: `0 0 0 4px ${CORAL}40` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 font-mono text-[7px] tracking-widest uppercase">
            <span>Time <b style={{ color: '#c2410c' }}>18</b></span>
            <span>Amp <b style={{ color: '#c2410c' }}>24</b></span>
          </div>
        </Panel>
      </div>

      {/* Character knobs */}
      <Panel color={MINT} title="03 / Character">
        <div className="flex justify-between px-1">
          {KNOBS.map(k => (
            <div key={k.label} className="flex flex-col items-center gap-0.5">
              <div className="relative w-7 h-7 md:w-8 md:h-8 rounded-full border-2" style={{ backgroundColor: '#e8e8ef', borderColor: INK }}>
                <div
                  className="absolute left-1/2 top-[3px] w-[2px] h-[7px] rounded-full origin-[50%_calc(100%+5px)] md:origin-[50%_calc(100%+6px)]"
                  style={{ backgroundColor: INK, transform: `translateX(-50%) rotate(${k.angle}deg)` }}
                />
              </div>
              <span className="text-[8px] font-sans">{k.label}</span>
              <span className="rounded border-[1.5px] px-1.5 font-mono text-[7px]" style={{ backgroundColor: '#eafbea', borderColor: INK }}>{k.value}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Bottom strip */}
      <div className="flex gap-2 font-mono text-[7px] md:text-[8px] uppercase tracking-wider">
        <div className="flex-1 rounded-lg border-2 px-2 py-1 flex items-center gap-1" style={{ backgroundColor: LILAC, borderColor: INK }}>
          <span className="rounded border-[1.5px] px-1.5" style={{ backgroundColor: MINT, borderColor: INK }}>Uniform</span>
          <span className="hidden sm:inline rounded border-[1.5px] px-1.5" style={{ backgroundColor: PAPER, borderColor: INK }}>Cauchy</span>
        </div>
        <div className="flex-1 rounded-lg border-2 px-2 py-1 flex items-center gap-1" style={{ backgroundColor: BUTTER, borderColor: INK }}>
          <span className="rounded border-[1.5px] px-1.5" style={{ backgroundColor: PAPER, borderColor: INK }}>Drone</span>
          <span className="rounded border-[1.5px] px-1.5" style={{ backgroundColor: PAPER, borderColor: INK }}>C3</span>
        </div>
        <div className="flex-1 rounded-lg border-2 px-2 py-1 flex items-center justify-between" style={{ backgroundColor: SKY, borderColor: INK }}>
          <span>MTS-ESP</span>
          <span>v0.5.1</span>
        </div>
      </div>
    </div>
  );
}
