import type { ReactNode } from 'react';
import { seededRandom } from '../lib/seededRandom';

// GENDY's pastel palette, set on a dark panel so it sits with the site's other previews:
// pastels become outlines, tints and highlights instead of solid fills.
const BG = '#0d0e11';
const SCREEN = '#08090b';
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
    <div
      className={`rounded-lg border p-2.5 flex flex-col ${className}`}
      style={{ backgroundColor: `${color}0d`, borderColor: `${color}55` }}
    >
      <div className="flex justify-between font-mono text-[8px] md:text-[9px] tracking-widest uppercase mb-1.5" style={{ color }}>
        <span>{title}</span>
        {right && <span className="text-zinc-500">{right}</span>}
      </div>
      {children}
    </div>
  );
}

function Chip({ color, active, children, className = '' }: { color: string; active?: boolean; children: ReactNode; className?: string }) {
  return (
    <span
      className={`rounded-sm border px-1.5 ${className}`}
      style={active
        ? { backgroundColor: `${color}26`, borderColor: color, color }
        : { borderColor: '#2a2a30', color: '#8a8a94' }}
    >
      {children}
    </span>
  );
}

export function GendyPreview() {
  return (
    <div
      className="w-full sm:aspect-[4/3] rounded-md border border-[#2a2a30] p-2.5 pt-8 md:p-3 md:pt-9 flex flex-col gap-2 select-none overflow-hidden text-zinc-400"
      style={{
        backgroundColor: BG,
        backgroundImage: 'linear-gradient(#ffffff06 1px, transparent 1px), linear-gradient(90deg, #ffffff06 1px, transparent 1px)',
        backgroundSize: '12px 12px',
      }}
    >
      {/* Header */}
      <div className="rounded-lg border px-3 py-1.5 flex items-center gap-3" style={{ backgroundColor: `${SKY}12`, borderColor: `${SKY}55` }}>
        <svg viewBox="0 0 24 20" className="w-5 h-4 shrink-0" fill={SKY}>
          <circle cx="4" cy="11" r="2.6" /><circle cx="11" cy="4" r="2.2" /><circle cx="17" cy="10" r="1.9" /><circle cx="10" cy="17" r="2.4" />
        </svg>
        <span className="font-display font-black text-lg md:text-xl tracking-widest leading-none" style={{ color: SKY }}>
          GENDY
        </span>
        <span className="hidden sm:block font-mono text-[7px] leading-tight tracking-wider uppercase text-zinc-500">
          A living waveform<br />Dynamic stochastic synthesis
        </span>
        <div className="ml-auto flex gap-1.5 font-mono text-[8px] uppercase">
          <span className="hidden md:block rounded-sm border border-[#2a2a30] bg-black/40 px-2 py-1 text-zinc-300">01 First light</span>
          <span className="rounded-sm border px-2 py-1" style={{ borderColor: PINK, color: PINK, backgroundColor: `${PINK}1a` }}>Freeze</span>
        </div>
      </div>

      {/* Waveform + mutation field */}
      <div className="flex-1 min-h-[130px] flex gap-2">
        <Panel color={SKY} title="01 / Waveform" right="12 pts" className="flex-[1.7] min-w-0">
          <div className="flex-1 min-h-0 rounded-sm border border-[#2a2a30] overflow-hidden" style={{ backgroundColor: SCREEN }}>
            <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="w-full h-full">
              {[60, 120, 180, 240].map(x => <line key={x} x1={x} y1="0" x2={x} y2="120" stroke="#ffffff0c" />)}
              {[30, 60, 90].map(y => <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#ffffff0c" />)}
              <path d={WAVE_PATH} fill="none" stroke={MINT} strokeOpacity="0.18" strokeWidth="7" strokeLinejoin="round" />
              <path d={WAVE_PATH} fill="none" stroke={MINT} strokeWidth="1.6" strokeLinejoin="round" />
              {BREAKPOINTS.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3.2" fill={SCREEN} stroke={SKY} strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
              ))}
            </svg>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 font-mono text-[7px] tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: MINT }} />
            Evolving
          </div>
        </Panel>

        <Panel color={PINK} title="02 / Mutation" className="flex-1 min-w-0">
          <div className="flex-1 min-h-0 rounded-sm border border-[#2a2a30] relative" style={{ backgroundColor: SCREEN }}>
            <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(${PINK}40 1px, transparent 1px)`, backgroundSize: '10px 10px', backgroundPosition: '5px 5px' }} />
            <div className="absolute top-2 bottom-2 left-[28%] w-px" style={{ backgroundColor: `${PINK}50` }} />
            <div className="absolute left-2 right-2 top-[68%] h-px" style={{ backgroundColor: `${PINK}50` }} />
            <div
              className="absolute left-[28%] top-[68%] -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
              style={{ backgroundColor: CORAL, boxShadow: `0 0 0 4px ${CORAL}30, 0 0 12px ${CORAL}80` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 font-mono text-[7px] tracking-widest uppercase">
            <span>Time <b style={{ color: CORAL }}>18</b></span>
            <span>Amp <b style={{ color: CORAL }}>24</b></span>
          </div>
        </Panel>
      </div>

      {/* Character knobs */}
      <Panel color={MINT} title="03 / Character">
        <div className="flex justify-between px-1">
          {KNOBS.map(k => (
            <div key={k.label} className="flex flex-col items-center gap-0.5">
              <div className="relative w-7 h-7 md:w-8 md:h-8 rounded-full border bg-[#16171b]" style={{ borderColor: `${MINT}80` }}>
                <div
                  className="absolute left-1/2 top-[3px] w-[2px] h-[7px] rounded-full origin-[50%_calc(100%+6px)] md:origin-[50%_calc(100%+7px)]"
                  style={{ backgroundColor: MINT, transform: `translateX(-50%) rotate(${k.angle}deg)` }}
                />
              </div>
              <span className="text-[8px] font-sans text-zinc-400">{k.label}</span>
              <span className="font-mono text-[7px] text-zinc-300">{k.value}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Bottom strip */}
      <div className="flex gap-2 font-mono text-[7px] md:text-[8px] uppercase tracking-wider">
        <div className="flex-1 rounded-lg border px-2 py-1 flex items-center gap-1" style={{ backgroundColor: `${LILAC}0d`, borderColor: `${LILAC}55` }}>
          <Chip color={LILAC} active>Uniform</Chip>
          <Chip color={LILAC} className="hidden sm:inline">Cauchy</Chip>
        </div>
        <div className="flex-1 rounded-lg border px-2 py-1 flex items-center gap-1" style={{ backgroundColor: `${BUTTER}0d`, borderColor: `${BUTTER}55` }}>
          <Chip color={BUTTER} active>Drone</Chip>
          <Chip color={BUTTER}>C3</Chip>
        </div>
        <div className="flex-1 rounded-lg border px-2 py-1 flex items-center justify-between" style={{ backgroundColor: `${SKY}0d`, borderColor: `${SKY}55` }}>
          <span style={{ color: SKY }}>MTS-ESP</span>
          <span className="text-zinc-500">v0.5.1</span>
        </div>
      </div>
    </div>
  );
}
