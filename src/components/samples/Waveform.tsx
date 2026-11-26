const PEAK_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Decodes the 64-character outline written by scripts/make-sample-previews.ts into bar heights (0 to 1). */
function decodePeaks(peaks: string): number[] {
  return [...peaks].map(c => Math.max(0.04, PEAK_ALPHABET.indexOf(c) / 63));
}

interface WaveformProps {
  peaks: string;
  /** Playback position, 0 to 1, or null when this sample isn't playing. */
  progress: number | null;
  /** Called with the clicked position, 0 to 1. */
  onSeek: (fraction: number) => void;
  className?: string;
}

/** Static outline of a sample. Played part is orange; click anywhere to play from there. */
export function Waveform({ peaks, progress, onSeek, className = '' }: WaveformProps) {
  const bars = decodePeaks(peaks);
  const width = bars.length * 3;

  const outline = (fill: string) => (
    <svg viewBox={`0 0 ${width} 32`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
      {bars.map((h, i) => (
        <rect key={i} x={i * 3} y={16 - h * 15} width={2} height={h * 30} fill={fill} />
      ))}
    </svg>
  );

  return (
    <div
      className={`relative h-8 cursor-pointer group/wave ${className}`}
      onClick={e => {
        e.stopPropagation();
        const box = e.currentTarget.getBoundingClientRect();
        onSeek(Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)));
      }}
      title="Click to play from here"
    >
      <div className="absolute inset-0 opacity-60 group-hover/wave:opacity-90 transition-opacity">{outline('#52525b')}</div>
      {progress !== null && (
        <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${progress * 100}%` }}>
          <div className="absolute inset-y-0 left-0" style={{ width: `${progress > 0 ? 100 / progress : 0}%` }}>
            {outline('#ffaa00')}
          </div>
        </div>
      )}
    </div>
  );
}
