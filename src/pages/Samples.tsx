import { Layout } from '../components/Layout';
import { usePageTitle } from '../lib/usePageTitle';
import { Archive, Download, Layers, Play, Pause, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useState, useRef, useMemo, useCallback, useEffect, memo } from 'react';
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

/** "All packs" in the picker and in the URL (?pack=all). */
const ALL = 'all';

/** Each pack's samples, categories (in first-seen order) and total size. */
const PACK_DATA = Object.fromEntries(PACKS.map(pack => {
  const samples = SAMPLES.filter(s => s.pack === pack.id);
  return [pack.id, {
    samples,
    categories: [...new Set(samples.map(s => s.category))],
    totalBytes: samples.reduce((sum, s) => sum + s.sizeBytes, 0),
  }];
}));
const PACK_BY_ID = Object.fromEntries(PACKS.map(p => [p.id, p]));
const PACK_ORDER = PACKS.map(p => p.id);
const SAMPLE_BY_ID = new Map(SAMPLES.map(s => [s.id, s]));

const driveDownloadUrl = (s: Sample) => `https://drive.google.com/uc?export=download&id=${s.driveId}`;

/** Every word of the query has to appear in the name, category or pack title. */
function matches(s: Sample, words: string[]): boolean {
  if (!words.length) return true;
  const text = `${s.name} ${s.category} ${PACK_BY_ID[s.pack]?.title ?? ''}`.toLowerCase();
  return words.every(w => text.includes(w));
}

interface SampleRowProps {
  key?: number;
  sample: Sample;
  showPack: boolean;
  isPlaying: boolean;
  isSelected: boolean;
  onToggle: (sample: Sample) => void;
  onSeek: (sample: Sample, fraction: number) => void;
  onSelect: (id: number) => void;
  registerProgress: (id: number, el: HTMLElement | null) => void;
}

/**
 * Memoized with stable handlers, so selecting or playing a sample only re-renders the rows that
 * changed. Off-screen rows skip layout and paint (content-visibility), so long packs stay fast.
 */
const SampleRow = memo(function SampleRow({ sample, showPack, isPlaying, isSelected, onToggle, onSeek, onSelect, registerProgress }: SampleRowProps) {
  const label = sample.name.replace(/\.(wav|mp3)$/i, '');
  const progressRef = useCallback((el: HTMLDivElement | null) => registerProgress(sample.id, el), [registerProgress, sample.id]);
  return (
    <div
      id={`sample-${sample.id}`}
      data-sid={sample.id}
      onClick={() => onSelect(sample.id)}
      // scroll-margin keeps a row clear of the nav bar and the sticky toolbar when it's scrolled into view
      className={`scroll-mt-52 scroll-mb-4 [content-visibility:auto] [contain-intrinsic-size:auto_68px] grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_minmax(0,15rem)_1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 border-b border-zinc-900 group ${
        isSelected ? 'bg-brand-orange/[0.06] shadow-[inset_2px_0_0_#ffaa00]' : 'hover:bg-zinc-900/50'
      }`}
    >
      <button
        onClick={e => { e.stopPropagation(); onSelect(sample.id); onToggle(sample); }}
        aria-label={`${isPlaying ? 'Stop' : 'Play'} ${label}`}
        aria-pressed={isPlaying}
        className={`w-11 h-11 flex items-center justify-center border rounded-sm shrink-0 ${
          isPlaying ? 'bg-brand-orange text-black border-brand-orange' : 'bg-black border-brand-orange/30 text-brand-orange hover:bg-brand-orange hover:text-black'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
      </button>

      <div className="min-w-0">
        <h4 className={`font-mono text-sm truncate ${isPlaying ? 'text-brand-orange' : 'text-white group-hover:text-brand-orange'}`}>
          {label}
        </h4>
        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest truncate block">
          {showPack && <>{PACK_BY_ID[sample.pack]?.title} · </>}{sample.category} · {sample.duration} · {formatBytes(sample.sizeBytes)}
        </span>
      </div>

      {/* Waveform: its own column on wide screens, full width under the name on phones */}
      <Waveform
        peaks={sample.peaks}
        progressRef={progressRef}
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

interface PackTileProps {
  key?: string;
  id: string;
  title: string;
  count: number;
  cover?: string;
  latest?: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}

/** One entry in the pack picker: small cover, name and sample count. */
function PackTile({ id, title, count, cover, latest, selected, onSelect }: PackTileProps) {
  return (
    <button
      onClick={() => onSelect(id)}
      role="radio"
      aria-checked={selected}
      className={`snap-start shrink-0 w-56 sm:w-auto flex items-center gap-3 p-2 pr-3 border text-left transition-colors ${
        selected ? 'border-brand-orange bg-brand-orange/[0.08]' : 'border-zinc-800 bg-black hover:border-zinc-600'
      }`}
    >
      <span className="w-12 h-12 shrink-0 bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center">
        {cover
          ? <img src={cover} alt="" width={48} height={48} className="w-full h-full object-cover" />
          : <Layers className="w-5 h-5 text-brand-orange" aria-hidden="true" />}
      </span>
      <span className="min-w-0">
        <span className={`block font-mono text-xs uppercase tracking-widest truncate ${selected ? 'text-brand-orange' : 'text-white'}`}>{title}</span>
        <span className="block font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
          {count} sounds{latest && <span className="ml-2 text-brand-orange">· New</span>}
        </span>
      </span>
    </button>
  );
}

/** The chosen pack: cover, description, facts and the full-pack download. */
function PackDetails({ pack }: { pack: SamplePack }) {
  const { samples, categories, totalBytes } = PACK_DATA[pack.id];
  return (
    <div className="border border-brand-orange/30 bg-black relative flex flex-wrap sm:flex-nowrap gap-4 sm:gap-5 p-4 sm:p-5">
      <CornerAccents />
      <img src={pack.cover} alt="" width={800} height={800} className="w-16 h-16 sm:w-36 sm:h-36 object-cover border border-zinc-800 shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col">
        <h2 className="font-display font-bold text-xl sm:text-2xl text-white uppercase tracking-wide">{pack.title}</h2>
        <p className="text-sm text-zinc-400 font-sans leading-relaxed mt-1">{pack.tagline}</p>
        <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed mt-3">
          {samples.length} samples · {formatBytes(totalBytes)} · 48 kHz WAV
          <span className="hidden md:inline"> · {categories.map(c => `${c} ${samples.filter(s => s.category === c).length}`).join(' · ')}</span>
        </p>
      </div>
      <div className="w-full sm:w-52 shrink-0 flex flex-col justify-center gap-2">
        {pack.driveFolder ? (
          <>
            <a href={pack.driveFolder} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-orange text-black hover:bg-white transition-colors font-mono font-bold text-xs uppercase tracking-widest">
              <Archive className="w-4 h-4" /> Download pack
            </a>
            <span className="font-mono text-[10px] text-zinc-500 text-center">{formatBytes(totalBytes)} · via Google Drive</span>
          </>
        ) : (
          <span className="w-full px-4 py-3 border border-zinc-800 text-zinc-500 font-mono text-xs uppercase tracking-widest text-center">Download coming soon</span>
        )}
      </div>
    </div>
  );
}

export function SamplesPage() {
  usePageTitle('Samples');
  const [packId, setPackId] = useState<string>(PACKS[0].id);
  const [query, setQuery] = useState('');
  /** A category within a pack, or (in "All packs") a pack id. */
  const [filter, setFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const allPacks = packId === ALL;

  // The pack and search live in the URL (?pack=…&q=…), so links and the back button work. Read after
  // the first render, because the pre-rendered page is always the default view.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get('pack');
    if (p && (p === ALL || PACK_BY_ID[p])) setPackId(p);
    if (params.get('q')) setQuery(params.get('q')!);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (packId === PACKS[0].id) params.delete('pack'); else params.set('pack', packId);
    if (query.trim()) params.set('q', query.trim()); else params.delete('q');
    const search = params.toString();
    const url = `${location.pathname}${search ? `?${search}` : ''}${location.hash}`;
    if (url !== `${location.pathname}${location.search}${location.hash}`) history.replaceState(history.state, '', url);
  }, [packId, query]);

  const pool = allPacks ? SAMPLES : PACK_DATA[packId].samples;
  const categories = allPacks ? PACK_ORDER : PACK_DATA[packId].categories;
  const keyOf = useCallback((s: Sample) => (allPacks ? s.pack : s.category), [allPacks]);

  // Search first, then the chip filter, so every chip can show how many results it holds.
  const searched = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return pool.filter(s => matches(s, words));
  }, [pool, query]);

  const visible = useMemo(() => searched
    .filter(s => !filter || keyOf(s) === filter)
    .sort((a, b) =>
      (allPacks ? PACK_ORDER.indexOf(a.pack) - PACK_ORDER.indexOf(b.pack) : 0) ||
      // Keep categories in their usual order; within one, "Loop 2" before "Loop 10".
      PACK_DATA[a.pack].categories.indexOf(a.category) - PACK_DATA[b.pack].categories.indexOf(b.category) ||
      a.name.localeCompare(b.name, 'en', { numeric: true }),
    ), [searched, filter, keyOf, allPacks]);

  const groups = useMemo(() => {
    const out: [string, Sample[]][] = [];
    for (const s of visible) {
      const key = keyOf(s);
      if (out.at(-1)?.[0] === key) out.at(-1)![1].push(s);
      else out.push([key, [s]]);
    }
    return out;
  }, [visible, keyOf]);

  const player = useSamplePlayer();
  const { play, toggle, stop, prefetch, registerProgress } = player;

  const choosePack = useCallback((id: string) => {
    if (id === packId) return;
    stop();
    setPackId(id);
    setFilter(null);
    setSelectedId(null);
  }, [packId, stop]);

  const select = useCallback((id: number) => {
    setSelectedId(id);
    // Instant, not the page's smooth scrolling: with a key held down, smooth scrolls interrupt each
    // other and the selected row ends up off-screen.
    document.getElementById(`sample-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, []);

  // Stable row handlers (see SampleRow).
  const onRowToggle = useCallback((sample: Sample) => toggle(sample), [toggle]);
  const onRowSeek = useCallback((sample: Sample, fraction: number) => play(sample, fraction), [play]);
  const onRowSelect = useCallback((id: number) => {
    setSelectedId(id);
    listRef.current?.focus({ preventScroll: true });
  }, []);

  // Preload previews as their rows come near the screen, so clicks play straight from memory.
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      const near = entries.filter(e => e.isIntersecting)
        .map(e => SAMPLE_BY_ID.get(Number((e.target as HTMLElement).dataset.sid)))
        .filter((s): s is Sample => !!s);
      if (near.length) prefetch(near);
    }, { rootMargin: '400px 0px' });
    list.querySelectorAll('[data-sid]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [visible, prefetch]);

  // And the ones around the selected one, for arrow-key auditioning.
  useEffect(() => {
    const i = visible.findIndex(s => s.id === selectedId);
    if (i >= 0) prefetch([...visible.slice(i, i + 6), ...visible.slice(Math.max(0, i - 3), i)]);
  }, [selectedId, visible, prefetch]);

  // "/" jumps to the search box from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Keyboard: works while focus is anywhere inside the browser panel.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const typing = target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'search';
    if (typing) {
      if (e.key === 'Escape') { if (query) setQuery(''); else listRef.current?.focus(); }
      else if ((e.key === 'ArrowDown' || e.key === 'Enter') && visible.length) {
        // From the search box: ↓ moves into the results, Enter plays the first one.
        e.preventDefault();
        listRef.current?.focus({ preventScroll: true });
        select(visible[0].id);
        if (e.key === 'Enter') play(visible[0]);
      }
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey || visible.length === 0) return;

    const index = visible.findIndex(s => s.id === selectedId);
    const current = visible[index];
    const step = (delta: number) => visible[Math.min(visible.length - 1, Math.max(0, (index < 0 ? -1 : index) + delta))];

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      // ↑↓ move to the next/previous sample and play it once.
      e.preventDefault();
      const next = step(e.key === 'ArrowDown' ? 1 : -1);
      if (next.id === selectedId) return; // already at the top/bottom of the list
      select(next.id);
      play(next);
    } else if (e.key === 'ArrowRight') {
      // → plays the selected sample again, from the start.
      e.preventDefault();
      const sample = current ?? visible[0];
      select(sample.id);
      play(sample);
    } else if (e.key === 'ArrowLeft') {
      // ← stops.
      e.preventDefault();
      stop();
    } else if ((e.key === ' ' || e.key === 'Enter') && target.tagName !== 'BUTTON' && target.tagName !== 'A' && target.tagName !== 'INPUT') {
      e.preventDefault();
      const sample = current ?? visible[0];
      select(sample.id);
      toggle(sample);
    }
  };

  const chipLabel = (key: string) => (allPacks ? PACK_BY_ID[key].title : key);
  const chip = (label: string, value: string | null, count: number) => (
    <button
      key={label}
      onClick={() => setFilter(value)}
      aria-pressed={filter === value}
      disabled={count === 0 && filter !== value}
      className={`shrink-0 px-3 py-2 md:py-1.5 font-mono text-[10px] uppercase tracking-widest border transition-colors disabled:opacity-40 disabled:cursor-default ${
        filter === value ? 'bg-brand-orange text-black border-brand-orange' : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
      }`}
    >
      {label} <span className="opacity-80">{count}</span>
    </button>
  );

  const scopeTitle = allPacks ? 'all packs' : PACK_BY_ID[packId].title;

  return (
    <Layout>
      <div className="pt-24">
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <Link to="/" className="inline-block text-brand-orange hover:text-white font-mono text-sm uppercase tracking-widest transition-colors">
             [← Return to Base]
          </Link>
        </div>

      {/* overflow-x-clip, not overflow-hidden: hidden would stop the toolbar below from sticking. */}
      <section id="samples" className="pb-24 overflow-x-clip">
        <div className="max-w-6xl mx-auto px-6 relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <Archive className="w-7 h-7 text-brand-orange" />
            <h1 className="text-3xl font-display font-black tracking-widest text-white uppercase">
              Sample Libraries & Packs
            </h1>
          </div>

          {/* Pack picker: a scrolling strip on phones, a grid from small screens up */}
          <div
            className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-2 overflow-x-auto sm:overflow-visible snap-x scroll-px-6 -mx-6 px-6 sm:mx-0 sm:px-0 pb-1"
            role="radiogroup"
            aria-label="Sample pack"
          >
            {PACKS.map((p, i) => (
              <PackTile key={p.id} id={p.id} title={p.title} count={PACK_DATA[p.id].samples.length} cover={p.cover} latest={i === 0} selected={p.id === packId} onSelect={choosePack} />
            ))}
            <PackTile key={ALL} id={ALL} title="All packs" count={SAMPLES.length} selected={allPacks} onSelect={choosePack} />
          </div>

          {!allPacks && <PackDetails pack={PACK_BY_ID[packId]} />}

          {/* Sample browser */}
          <div
            ref={listRef}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            className="border border-zinc-800 bg-black/50 relative outline-none"
          >
            {/* Toolbar: stays under the nav bar while the list scrolls */}
            <div className="sticky top-16 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 md:px-6 py-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    ref={searchRef}
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={`Search ${scopeTitle}…`}
                    aria-label={`Search ${scopeTitle}`}
                    className="w-full bg-black border border-zinc-800 focus:border-brand-orange/60 outline-none pl-9 pr-16 py-2.5 font-mono text-sm text-white placeholder:text-zinc-600"
                  />
                  {query ? (
                    <button
                      onClick={() => { setQuery(''); searchRef.current?.focus(); }}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <kbd className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-zinc-500 border border-zinc-700 px-1.5" aria-hidden="true">/</kbd>
                  )}
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap" role="group" aria-label={allPacks ? 'Filter by pack' : 'Filter by category'}>
                {chip('All', null, searched.length)}
                {categories.map(c => chip(chipLabel(c), c, searched.filter(s => keyOf(s) === c).length))}
              </div>
            </div>

            <div className="flex flex-col" aria-live="polite">
              {query.trim() && visible.length > 0 && (
                <p className="px-4 md:px-6 py-2 font-mono text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-900">
                  {visible.length} result{visible.length === 1 ? '' : 's'} for “{query.trim()}” in {scopeTitle}
                  {!allPacks && <> · <button onClick={() => choosePack(ALL)} className="text-brand-orange hover:text-white uppercase tracking-widest">search all packs</button></>}
                </p>
              )}
              {groups.map(([key, list]) => (
                <div key={key}>
                  <div className="px-4 md:px-6 py-2 bg-zinc-950 border-b border-zinc-900 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                    {chipLabel(key)} <span>({list.length})</span>
                  </div>
                  {list.map(sample => (
                    <SampleRow
                      key={sample.id}
                      sample={sample}
                      showPack={allPacks}
                      isPlaying={player.playingId === sample.id}
                      isSelected={selectedId === sample.id}
                      onToggle={onRowToggle}
                      onSeek={onRowSeek}
                      onSelect={onRowSelect}
                      registerProgress={registerProgress}
                    />
                  ))}
                </div>
              ))}
              {visible.length === 0 && (
                <div className="px-6 py-12 text-center font-mono text-xs text-zinc-500 space-y-3">
                  <p>No samples match “{query.trim()}”{filter ? ` in ${chipLabel(filter)}` : ''}{allPacks ? '' : ` in ${scopeTitle}`}.</p>
                  {!allPacks && query.trim() && (
                    <button onClick={() => choosePack(ALL)} className="text-brand-orange hover:text-white uppercase tracking-widest text-[10px]">Search all packs</button>
                  )}
                </div>
              )}
            </div>

            <div className="bg-zinc-900/50 px-4 py-3 flex flex-col md:flex-row gap-2 justify-between border-t border-zinc-800 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              <span>Previews are compressed, and some long ones are shortened. Downloads are the original files.</span>
              <span className="hidden md:inline">/ search · ↑↓ play next/previous · → play again · ← stop · Space play/stop</span>
            </div>
          </div>
        </div>
      </section>
      </div>
    </Layout>
  );
}
