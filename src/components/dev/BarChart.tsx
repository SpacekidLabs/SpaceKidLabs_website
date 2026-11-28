import { useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

const nf = new Intl.NumberFormat('en');

/**
 * One series as bars on a shared baseline (weekly pushes, daily page views). Hover or keyboard focus shows a
 * bar's exact value in the line above; with nothing hovered it shows the latest bar.
 */
export function BarChart({ points, describe, firstLabel, lastLabel }: {
  points: Array<{ key: string; value: number }>;
  describe: (i: number) => ReactNode;
  firstLabel: string;
  lastLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...points.map(p => p.value));
  const H = 120;
  const shown = hover ?? points.length - 1;
  return (
    <div>
      <p className="text-sm text-zinc-300 mb-3 min-h-5" aria-live="polite">{describe(shown)}</p>
      <div className="relative" style={{ height: H }}>
        {/* Recessive grid: baseline and the max line only. */}
        <div className="absolute inset-x-0 bottom-0 border-t border-zinc-700" aria-hidden />
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-zinc-800" aria-hidden />
        <span className="absolute -top-2 right-0 bg-[#0d0d0d] pl-1 font-mono text-[10px] text-zinc-500" aria-hidden>{nf.format(max)}</span>
        <div className="absolute inset-0 flex items-end gap-[2px] pr-8" onMouseLeave={() => setHover(null)}>
          {points.map((p, i) => (
            <button
              key={p.key}
              type="button"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={String(p.key) + ': ' + p.value}
              className="relative flex-1 h-full flex items-end outline-none"
            >
              <span
                className={cn('block w-full rounded-t-[4px] transition-colors', p.value ? (hover === i ? 'bg-brand-gold' : 'bg-brand-orange') : 'bg-transparent')}
                style={{ height: p.value ? Math.max(3, (p.value / max) * (H - 4)) : 0 }}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between pr-8 mt-2 font-mono text-[10px] text-zinc-500">
        <span>{firstLabel}</span>
        <span>{lastLabel}</span>
      </div>
    </div>
  );
}
