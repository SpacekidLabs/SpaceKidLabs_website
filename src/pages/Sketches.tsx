import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, Mic, Pause, Play } from 'lucide-react';
import { Layout } from '../components/Layout';
import { usePageTitle } from '../lib/usePageTitle';
import { cn } from '../lib/utils';
import { SKETCHES, type Sketch, type SketchKind } from '../data/sketches';

type Filter = 'all' | SketchKind;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'demo', label: 'Demos' },
  { id: 'idea', label: 'Ideas' },
];

/** "2026-11-28" -> "28 Nov 2026" */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Play button and seek bar for one demo. Only one demo plays at a time (see `playingId`). */
function DemoPlayer({ sketch, playing, onPlay, onStop }: {
  sketch: Sketch & { file: string };
  playing: boolean;
  onPlay: () => void;
  onStop: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.play().catch(onStop);
    else audio.pause();
  }, [playing, onStop]);

  return (
    <div className="mt-5 flex items-center gap-4">
      <button
        type="button"
        onClick={playing ? onStop : onPlay}
        aria-label={playing ? `Pause ${sketch.title}` : `Play ${sketch.title}`}
        className="w-10 h-10 shrink-0 flex items-center justify-center border border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-black transition-colors"
      >
        {playing ? <Pause className="w-4 h-4" aria-hidden /> : <Play className="w-4 h-4" aria-hidden />}
      </button>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={time}
        onChange={e => {
          const t = Number(e.target.value);
          if (audioRef.current) audioRef.current.currentTime = t;
          setTime(t);
        }}
        aria-label={`Seek ${sketch.title}`}
        className="flex-grow accent-brand-orange h-1 cursor-pointer"
      />
      <span className="font-mono text-xs text-zinc-500 tabular-nums w-20 text-right">
        {formatTime(time)} / {formatTime(duration)}
      </span>
      <audio
        ref={audioRef}
        src={sketch.file}
        preload="metadata"
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
        onEnded={onStop}
      />
    </div>
  );
}

function SketchCard({ sketch, playing, onPlay, onStop }: {
  key?: string;
  sketch: Sketch;
  playing: boolean;
  onPlay: () => void;
  onStop: () => void;
}) {
  const isDemo = sketch.kind === 'demo';
  const Icon = isDemo ? Mic : Lightbulb;
  const paragraphs = sketch.text?.split(/\n\s*\n/) ?? [];

  return (
    <article
      id={sketch.id}
      className={cn(
        'scroll-mt-32 border bg-zinc-900/40 p-6 md:p-8 transition-colors',
        playing ? 'border-brand-orange/60' : 'border-zinc-800 hover:border-zinc-700',
      )}
    >
      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-zinc-500 mb-3">
        <Icon className={cn('w-4 h-4', isDemo ? 'text-brand-orange' : 'text-brand-gold')} aria-hidden />
        <span>{isDemo ? 'Demo' : 'Idea'}</span>
        <span aria-hidden>//</span>
        <time dateTime={sketch.date}>{formatDate(sketch.date)}</time>
      </div>
      <h2 className="font-display font-bold text-xl md:text-2xl text-white tracking-wide">{sketch.title}</h2>
      {paragraphs.map((p, i) => (
        <p key={i} className="mt-3 font-sans font-light text-zinc-300 leading-relaxed">{p}</p>
      ))}
      {sketch.tags?.length ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {sketch.tags.map(t => (
            <li key={t} className="px-2 py-0.5 border border-zinc-800 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
              {t}
            </li>
          ))}
        </ul>
      ) : null}
      {isDemo && (sketch.file ? (
        <DemoPlayer sketch={sketch as Sketch & { file: string }} playing={playing} onPlay={onPlay} onStop={onStop} />
      ) : (
        <p className="mt-5 font-mono text-xs uppercase tracking-widest text-zinc-600">// Audio coming soon</p>
      ))}
    </article>
  );
}

export function SketchesPage() {
  usePageTitle('Sketches');
  const [filter, setFilter] = useState<Filter>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const stop = useCallback(() => setPlayingId(null), []);

  const shown = SKETCHES.filter(s => filter === 'all' || s.kind === filter);

  return (
    <Layout>
      <div className="pt-24 pb-24 max-w-3xl mx-auto px-6 w-full">
        <Link to="/" className="inline-block text-zinc-400 hover:text-white font-mono text-sm uppercase tracking-widest transition-colors mb-10">
          ← Home
        </Link>
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4">// Unfinished on purpose</p>
        <h1 className="text-4xl md:text-5xl font-display font-black tracking-widest text-white uppercase mb-6">Sketches</h1>
        <p className="font-sans font-light text-zinc-300 text-lg leading-relaxed max-w-2xl mb-10">
          Rough demos and loose ideas. Things that might become tracks or tools, or might not.
        </p>

        <div role="group" aria-label="Filter sketches" className="flex gap-2 mb-8 font-mono text-xs uppercase tracking-widest">
          {FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                'px-4 py-2 border transition-colors',
                filter === f.id
                  ? 'border-brand-orange text-brand-orange bg-brand-orange/10'
                  : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {shown.length ? (
          <div className="flex flex-col gap-6">
            {shown.map(s => (
              <SketchCard
                key={s.id}
                sketch={s}
                playing={playingId === s.id}
                onPlay={() => setPlayingId(s.id)}
                onStop={stop}
              />
            ))}
          </div>
        ) : (
          <p className="font-mono text-sm text-zinc-500">Nothing here yet.</p>
        )}
      </div>
    </Layout>
  );
}
