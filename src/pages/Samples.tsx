import { Layout } from '../components/Layout';
import { usePageTitle } from '../lib/usePageTitle';
import { ScrollReveal } from '../components/ScrollReveal';
import { Archive, Download, Play, Pause, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useState, useRef, useMemo, useCallback, memo } from 'react';
import { useSamplePlayer } from '../components/samples/useSamplePlayer';
import { Waveform } from '../components/samples/Waveform';
import { PACKS, SAMPLES, type Sample, type SamplePack } from '../data/samples';

const CornerAccents = () => (
  <>
    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-brand-orange/50" />
    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-brand-orange/50" />
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-brand-orange/50" />
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-brand-orange/50" />
  </>
);

/** 72080 -> "72 KB", 2_400_000 -> "2.4 MB" (decimal units, like Finder) */
function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`;
  return `${(bytes / 1_000_000).toFixed(bytes < 10_000_000 ? 1 : 0)} MB`;
}

/** Each pack's samples, categories (in first-seen order) and total size. */
const PACK_DATA = Object.fromEntries(PACKS.map(pack => {
  const samples = SAMPLES.filter(s => s.pack === pack.id);
  return [pack.id, {
    samples,
    categories: [...new Set(samples.map(s => s.category))],
    totalBytes: samples.reduce((sum, s) => sum + s.sizeBytes, 0),
  }];
}));

const driveDownloadUrl = (s: Sample) => `https://drive.google.com/uc?export=download&id=${s.driveId}`;

interface SampleRowProps {
  key?: number;
  sample: Sample;
  isPlaying: boolean;
  isSelected: boolean;
  progress: number | null;
  onToggle: (sample: Sample) => void;
  onSeek: (sample: Sample, fraction: number) => void;
  onSelect: (id: number) => void;
}

/**
 * Memoized with stable handlers, so moving the selection or playing a sample only re-renders the
 * rows that changed, not all of them (a pack can have hundreds).
 */
const SampleRow = memo(function SampleRow({ sample, isPlaying, isSelected, progress, onToggle, onSeek, onSelect }: SampleRowProps) {
  const label = sample.name.replace(/\.(wav|mp3)$/i, '');
  return (
    <div
      id={`sample-${sample.id}`}
      onClick={() => onSelect(sample.id)}
      // scroll-margin keeps a row clear of the fixed nav bar and the sticky category header when it's scrolled into view
      className={`scroll-mt-28 scroll-mb-4 grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_minmax(0,14rem)_1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 border-b border-zinc-900 transition-colors group ${
        isSelected ? 'bg-brand-orange/[0.06] shadow-[inset_2px_0_0_#ffaa00]' : 'hover:bg-zinc-900/50'
      }`}
    >
      <button
        onClick={e => { e.stopPropagation(); onSelect(sample.id); onToggle(sample); }}
        aria-label={`${isPlaying ? 'Stop' : 'Play'} ${label}`}
        aria-pressed={isPlaying}
        className={`w-11 h-11 flex items-center justify-center border transition-colors rounded-sm shrink-0 ${
          isPlaying ? 'bg-brand-orange text-black border-brand-orange' : 'bg-black border-brand-orange/30 text-brand-orange hover:bg-brand-orange hover:text-black'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
      </button>

      <div className="min-w-0">
        <h4 className={`font-mono text-sm truncate transition-colors ${isPlaying ? 'text-brand-orange' : 'text-white group-hover:text-brand-orange'}`}>
          {label}
        </h4>
        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest truncate block">
          {sample.category} · {sample.duration} · {formatBytes(sample.sizeBytes)}
        </span>
      </div>

      {/* Waveform: its own column on wide screens, full width under the name on phones */}
      <Waveform
        peaks={sample.peaks}
        progress={progress}
        onSeek={f => { onSelect(sample.id); onSeek(sample, f); }}
        className="col-span-3 row-start-2 md:col-span-1 md:row-start-auto"
      />

      {sample.driveId ? <a
        href={driveDownloadUrl(sample)}
        onClick={e => e.stopPropagation()}
        target="_blank"
        rel="noreferrer"
        aria-label={`Download ${label} (${sample.format}, ${formatBytes(sample.sizeBytes)})`}
        title={`Download original (${sample.format}, ${formatBytes(sample.sizeBytes)})`}
        className="col-start-3 row-start-1 md:col-start-auto md:row-start-auto w-11 h-11 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded-sm"
      >
        <Download className="w-4 h-4" />
      </a> : <span className="col-start-3 row-start-1 md:col-start-auto md:row-start-auto w-11 h-11" />}
    </div>
  );
});

interface PackCardProps {
  key?: string;
  pack: SamplePack;
  latest: boolean;
  selected: boolean;
  onSelect: () => void;
}

function PackCard({ pack, latest, selected, onSelect }: PackCardProps) {
  const { samples, categories, totalBytes } = PACK_DATA[pack.id];
  return (
    <div
      className={`border bg-black flex flex-col group transition-colors shadow-2xl relative ${
        selected ? 'border-brand-orange box-glow' : 'border-zinc-800 hover:border-brand-orange/50'
      }`}
    >
      <CornerAccents />
      {latest && (
        <div className="absolute top-0 right-0 bg-brand-orange text-black font-mono text-[10px] font-bold px-3 py-1 uppercase z-20 shadow-lg">LATEST RELEASE</div>
      )}

      <button
        onClick={onSelect}
        role="radio"
        aria-checked={selected}
        aria-label={`Browse ${pack.title}`}
        className="relative aspect-square overflow-hidden border-b border-zinc-800 bg-zinc-950 block w-full"
      >
        <img
          src={pack.cover}
          alt=""
          width={800}
          height={800}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${selected ? 'opacity-100' : 'opacity-70 group-hover:opacity-90'}`}
        />
        <span className={`absolute top-3 left-3 font-mono text-[10px] uppercase tracking-widest px-2 py-1 border ${
          selected ? 'bg-brand-orange text-black border-brand-orange' : 'bg-black/90 text-zinc-300 border-zinc-700'
        }`}>
          {selected ? 'Browsing ↓' : 'Browse'}
        </span>
      </button>

      <div className="p-6 flex-1 flex flex-col">
        <h2 className="font-display font-bold text-2xl text-white mb-2 uppercase tracking-wide">{pack.title}</h2>
        <p className="text-sm text-zinc-400 font-sans leading-relaxed mb-6">{pack.tagline}</p>

        <dl className="grid grid-cols-3 gap-px bg-zinc-800 border border-zinc-800 mb-4 font-mono">
          {[
            ['Samples', String(samples.length)],
            ['Size', formatBytes(totalBytes)],
            ['Format', '48 kHz WAV'],
          ].map(([k, v]) => (
            <div key={k} className="bg-black px-3 py-2">
              <dt className="text-[9px] text-zinc-500 uppercase tracking-widest">{k}</dt>
              <dd className="text-sm text-white">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed mb-6">
          {categories.map(c => `${c} ${samples.filter(s => s.category === c).length}`).join(' · ')}
        </p>

        <div className="mt-auto pt-4 border-t border-zinc-800 flex flex-col gap-2">
          {pack.driveFolder ? (
            <>
              <a href={pack.driveFolder} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-orange text-black hover:bg-white transition-colors font-mono font-bold text-xs uppercase tracking-widest shadow-lg">
                <Archive className="w-4 h-4" /> Download Full Pack
              </a>
              <span className="font-mono text-[10px] text-zinc-500 text-center">{formatBytes(totalBytes)} · via Google Drive</span>
            </>
          ) : (
            <span className="w-full px-4 py-3 border border-zinc-800 text-zinc-500 font-mono text-xs uppercase tracking-widest text-center">Download coming soon</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function SamplesPage() {
  usePageTitle('Samples');
  const [packId, setPackId] = useState(PACKS[0].id);
  const pack = PACKS.find(p => p.id === packId)!;
  const { samples: SAMPLES, categories: CATEGORIES } = PACK_DATA[packId];
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [autoplay, setAutoplay] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SAMPLES.filter(s =>
      (!category || s.category === category) &&
      (!q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)),
    ).sort((a, b) =>
      // Keep categories in their usual order; within one, "Loop 2" before "Loop 10".
      CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) ||
      a.name.localeCompare(b.name, 'en', { numeric: true }),
    );
  }, [query, category, SAMPLES, CATEGORIES]);

  const groups = useMemo(
    () => CATEGORIES.map(c => [c, visible.filter(s => s.category === c)] as const).filter(([, list]) => list.length > 0),
    [visible, CATEGORIES],
  );

  const choosePack = (id: string) => {
    if (id === packId) return;
    player.stop();
    setPackId(id);
    setCategory(null);
    setSelectedId(null);
  };

  // Auto-play: when a sample ends, play the next visible one.
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const autoplayRef = useRef(autoplay);
  autoplayRef.current = autoplay;
  const player = useSamplePlayer(endedId => {
    if (!autoplayRef.current) return;
    const list = visibleRef.current;
    const next = list[list.findIndex(s => s.id === endedId) + 1];
    if (next) { setSelectedId(next.id); player.play(next); }
  });

  const select = useCallback((id: number) => {
    setSelectedId(id);
    // Instant, not the page's smooth scrolling: with a key held down, smooth scrolls interrupt each
    // other and the selected row ends up off-screen.
    document.getElementById(`sample-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, []);

  // Stable row handlers (see SampleRow).
  const { play, toggle } = player;
  const onRowToggle = useCallback((sample: Sample) => toggle(sample), [toggle]);
  const onRowSeek = useCallback((sample: Sample, fraction: number) => play(sample, fraction), [play]);
  const onRowSelect = useCallback((id: number) => {
    setSelectedId(id);
    listRef.current?.focus({ preventScroll: true });
  }, []);

  // Keyboard: works while focus is anywhere inside the browser panel.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const typing = target.tagName === 'INPUT';
    if (e.key === 'Escape' && typing) { setQuery(''); listRef.current?.focus(); return; }
    if (typing || e.metaKey || e.ctrlKey || e.altKey || visible.length === 0) return;

    const index = visible.findIndex(s => s.id === selectedId);
    const current = visible[index];
    const step = (delta: number) => visible[Math.min(visible.length - 1, Math.max(0, (index < 0 ? -1 : index) + delta))];

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      select(step(e.key === 'ArrowDown' ? 1 : -1).id);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = step(e.key === 'ArrowRight' ? 1 : -1);
      select(next.id);
      player.play(next);
    } else if ((e.key === ' ' || e.key === 'Enter') && target.tagName !== 'BUTTON' && target.tagName !== 'A') {
      e.preventDefault();
      const sample = current ?? visible[0];
      select(sample.id);
      player.toggle(sample);
    }
  };

  const chip = (label: string, value: string | null, count: number) => (
    <button
      key={label}
      onClick={() => setCategory(value)}
      aria-pressed={category === value}
      className={`px-3 py-2.5 md:py-1.5 font-mono text-[10px] uppercase tracking-widest border transition-colors ${
        category === value ? 'bg-brand-orange text-black border-brand-orange' : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
      }`}
    >
      {label} <span className="opacity-80">{count}</span>
    </button>
  );

  return (
    <Layout>
      <div className="pt-24">
        <ScrollReveal className="max-w-7xl mx-auto px-6 mb-12">
          <Link to="/" className="inline-block text-brand-orange hover:text-white font-mono text-sm uppercase tracking-widest transition-colors">
             [← Return to Base]
          </Link>
        </ScrollReveal>

      {/* Samples & Packs Section */}
      <section id="samples" className="py-24 overflow-hidden">
        <ScrollReveal className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <Archive className="w-8 h-8 text-brand-orange" />
            <h1 className="text-3xl font-display font-black tracking-widest text-white uppercase">
              Sample Libraries & Packs
            </h1>
          </div>

          <div className="max-w-6xl mx-auto space-y-12">

            {/* Packs: pick one to browse it below */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" role="radiogroup" aria-label="Sample pack">
              {PACKS.map((p, i) => (
                <PackCard key={p.id} pack={p} latest={i === 0} selected={p.id === packId} onSelect={() => choosePack(p.id)} />
              ))}
            </div>

            {/* Sample browser */}
            <div
              ref={listRef}
              tabIndex={-1}
              onKeyDown={onKeyDown}
              className="border border-zinc-800 bg-black/50 overflow-hidden relative outline-none"
            >
              <CornerAccents />
              <div className="bg-zinc-900/80 border-b border-zinc-800 px-4 md:px-6 py-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-mono text-sm text-white uppercase tracking-widest flex items-center gap-2">
                    <Play className="w-4 h-4 text-brand-orange" />
                    {pack.title}
                  </h3>
                  <label className="flex items-center gap-2 font-mono text-[10px] text-zinc-400 uppercase tracking-widest cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoplay}
                      onChange={e => setAutoplay(e.target.checked)}
                      className="accent-[#ffaa00] w-4 h-4"
                    />
                    Auto-play next
                  </label>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search samples…"
                    aria-label="Search samples"
                    className="w-full bg-black border border-zinc-800 focus:border-brand-orange/60 outline-none pl-9 pr-9 py-2.5 font-mono text-sm text-white placeholder:text-zinc-600"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
                  {chip('All', null, SAMPLES.length)}
                  {CATEGORIES.map(c => chip(c, c, SAMPLES.filter(s => s.category === c).length))}
                </div>
              </div>

              <div className="flex flex-col" aria-live="polite">
                {groups.map(([name, list]) => (
                  <div key={name}>
                    <div className="px-4 md:px-6 py-2 bg-zinc-950 border-b border-zinc-900 font-mono text-[10px] text-zinc-500 uppercase tracking-widest sticky top-16 z-10">
                      {name} <span className="text-zinc-500">({list.length})</span>
                    </div>
                    {list.map(sample => (
                      <SampleRow
                        key={sample.id}
                        sample={sample}
                        isPlaying={player.playingId === sample.id}
                        isSelected={selectedId === sample.id}
                        progress={player.playingId === sample.id ? player.progress : null}
                        onToggle={onRowToggle}
                        onSeek={onRowSeek}
                        onSelect={onRowSelect}
                      />
                    ))}
                  </div>
                ))}
                {visible.length === 0 && (
                  <p className="px-6 py-12 text-center font-mono text-xs text-zinc-500">
                    No samples match “{query}”{category ? ` in ${category}` : ''}.
                  </p>
                )}
              </div>

              <div className="bg-zinc-900/50 px-4 py-3 flex flex-col md:flex-row gap-2 justify-between border-t border-zinc-800 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                <span>Previews are compressed. Downloads are the original files.</span>
                <span className="hidden md:inline">↑↓ select · Space play · ← → previous / next</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
      </div>
    </Layout>
  );
}
