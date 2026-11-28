import { memo, useMemo } from 'react';

const PEAK_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Turns the 64-character outline written by scripts/make-sample-previews.ts into one SVG path of
 * bars, so a waveform is a single element instead of 64 (a pack can show hundreds of them).
 */
function outlinePath(peaks: string): { d: string; width: number } {
  let d = '';
  [...peaks].forEach((c, i) => {
    const h = Math.max(0.04, PEAK_ALPHABET.indexOf(c) / 63);
    d += `M${i * 3} ${(16 - h * 15).toFixed(1)}h2v${(h * 30).toFixed(1)}h-2z`;
  });
  return { d, width: peaks.length * 3 };
}

interface WaveformProps {
  peaks: string;
  /** Receives the played-part overlay; the player sets its width while this sample plays. */
  progressRef: (el: HTMLDivElement | null) => void;
  /** Called with the clicked position, 0 to 1. */
  onSeek: (fraction: number) => void;
  className?: string;
}

/** Static outline of a sample. The played part turns orange; click anywhere to play from there. */
export const Waveform = memo(function Waveform({ peaks, progressRef, onSeek, className = '' }: WaveformProps) {
  const { d, width } = useMemo(() => outlinePath(peaks), [peaks]);

  const outline = (fill: string) => (
    <svg viewBox={`0 0 ${width} 32`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <path d={d} fill={fill} />
    </svg>
  );

  return (
    <div
      // A size container, so the orange copy below can be exactly as wide as this box (100cqw).
      className={`relative h-8 cursor-pointer group/wave [container-type:inline-size] ${className}`}
      onClick={e => {
        e.stopPropagation();
        const box = e.currentTarget.getBoundingClientRect();
        onSeek(Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)));
      }}
      title="Click to play from here"
    >
      <div className="absolute inset-0 opacity-60 group-hover/wave:opacity-90 transition-opacity">{outline('#52525b')}</div>
      {/* Played part: an orange copy of the outline, revealed from the left. */}
      <div ref={progressRef} className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: '0%' }}>
        <div className="absolute inset-y-0 left-0 w-[100cqw]">{outline('#ffaa00')}</div>
      </div>
    </div>
  );
});
