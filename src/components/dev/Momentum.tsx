import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, ArrowUpRight, Flame, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/devApi';
import { SAMPLES } from '../../data/samples';

/**
 * Momentum on the Launchpad: a daily streak, a year heatmap of everything shipped, and a strip of nudges.
 * Data from worker/momentum.ts. Days are counted in your own time zone.
 */

export type Kind = 'idea' | 'sketch' | 'samples' | 'post' | 'release' | 'issue' | 'promo';
export interface MomentumEvent { t: number; kind: Kind; label: string; url?: string }
export interface MomentumData {
  events: MomentumEvent[];
  stale: Array<{ repo: string; number: number; title: string; url: string; updated: string }>;
  staleCount: number; staleDays: number; errors: string[];
  promo: { channels: string[]; since: number; items: PromoItem[] } | null;
  messages: { unanswered: number; answered: number; oldestUnanswered: number | null } | null;
}
export interface PromoItem {
  ref: string; kind: Kind; label: string; url: string; t: number; ticks: Record<string, number>; skipped: boolean; done: boolean;
}

const PUBLIC: Kind[] = ['sketch', 'samples', 'post', 'release'];
export const KIND_LABEL: Record<Kind, string> = {
  idea: 'Idea', sketch: 'Sketch', samples: 'Samples', post: 'Post', release: 'Release', issue: 'Issue closed', promo: 'Promo',
};
const DAY = 86_400_000;
const dayKey = (d: Date) => d.toLocaleDateString('en-CA');
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// ---------- Numbers ----------

export interface Stats {
  byDay: Map<string, MomentumEvent[]>;
  today: number;
  streak: number;
  best: number;
  weekPublic: number;
  weekIdeas: number;
  weekIssues: number;
  weekPromo: number;
  daysSincePublic: number | null;
}

export function stats(events: MomentumEvent[]): Stats {
  const byDay = new Map<string, MomentumEvent[]>();
  for (const e of events) {
    const k = dayKey(new Date(e.t));
    byDay.set(k, [...(byDay.get(k) ?? []), e]);
  }
  const now = new Date();
  const today = byDay.get(dayKey(now))?.length ?? 0;
  // The streak is alive until midnight: it counts back from today, or from yesterday if today is still empty.
  let streak = 0;
  for (let d = today ? now : addDays(now, -1); byDay.has(dayKey(d)); d = addDays(d, -1)) streak++;
  let best = 0;
  let run = 0;
  for (let d = addDays(now, -370); d <= now; d = addDays(d, 1)) {
    run = byDay.has(dayKey(d)) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  const weekAgo = Date.now() - 7 * DAY;
  const week = events.filter(e => e.t >= weekAgo);
  const lastPublic = [...events].reverse().find(e => PUBLIC.includes(e.kind));
  return {
    byDay, today, streak, best,
    weekPublic: week.filter(e => PUBLIC.includes(e.kind)).length,
    weekIdeas: week.filter(e => e.kind === 'idea').length,
    weekIssues: week.filter(e => e.kind === 'issue').length,
    weekPromo: week.filter(e => e.kind === 'promo').length,
    daysSincePublic: lastPublic ? Math.floor((Date.now() - lastPublic.t) / DAY) : null,
  };
}

// ---------- Sound ----------

const SOUND_KEY = 'dev-sound';
/** Your own VRAC hits (snares, claps, perc): a different one each time the streak grows. */
const HITS = SAMPLES.filter(s => s.pack === 'vrac' && /snare|clap|perc/i.test(s.category) && s.preview).map(s => s.preview);

export function useSound() {
  const [on, setOn] = useState(() => typeof localStorage === 'undefined' || localStorage.getItem(SOUND_KEY) !== 'off');
  const toggle = () => setOn(v => { localStorage.setItem(SOUND_KEY, v ? 'off' : 'on'); return !v; });
  const play = useCallback(() => {
    if (!on || !HITS.length) return;
    const a = new Audio(HITS[Math.floor(Math.random() * HITS.length)]);
    a.volume = 0.8;
    a.play().catch(() => {});
  }, [on]);
  return { on, toggle, play };
}

// ---------- Data ----------

/**
 * Loads momentum; `reload()` after anything you do. When that makes today count for the first time,
 * `onStreak` fires with the new streak length (for the sound and the cheer).
 */
export function useMomentum(onStreak: (streak: number) => void) {
  const [data, setData] = useState<MomentumData | null>(null);
  const [error, setError] = useState('');
  const todayBefore = useRef<number | null>(null);
  const cb = useRef(onStreak);
  cb.current = onStreak;

  const reload = useCallback(() => api<MomentumData>('momentum').then(d => {
    setData(d); setError('');
    const s = stats(d.events);
    if (todayBefore.current === 0 && s.today > 0) cb.current(s.streak);
    todayBefore.current = s.today;
  }).catch(e => setError(e instanceof Error ? e.message : String(e))), []);

  useEffect(() => { reload(); }, [reload]);
  return { data, error, reload, stats: useMemo(() => (data ? stats(data.events) : null), [data]) };
}

// ---------- Nudge strip (top of the Launchpad) ----------

export function NudgeStrip({ data, s, sound, cheer, onIssues, onShip, onMessages }: {
  data: MomentumData | null; s: Stats | null; sound: ReturnType<typeof useSound>; cheer: string;
  onIssues: () => void; onShip: () => void; onMessages: () => void;
}) {
  const nudges: Array<{ text: ReactNode; href?: string; onClick?: () => void }> = [];
  if (s && data) {
    if (s.streak > 0 && s.today === 0) nudges.push({ text: <>Your {s.streak}-day streak ends at midnight. Capture or ship something.</> });
    if (s.daysSincePublic === null) nudges.push({ text: 'Nothing public in the last year. Put a sketch up.' });
    else if (s.daysSincePublic >= 7) nudges.push({ text: <>Nothing public in {s.daysSincePublic} days. Promote an idea to a sketch?</> });
    const msg = data.messages;
    if (msg?.unanswered && msg.oldestUnanswered) {
      const days = Math.floor((Date.now() - msg.oldestUnanswered) / DAY);
      nudges.push({
        text: <>{msg.unanswered} message{msg.unanswered > 1 ? 's' : ''} to answer{days ? `, oldest ${days} day${days > 1 ? 's' : ''}` : ''}</>,
        onClick: onMessages,
      });
    }
    const pending = data.promo?.items.filter(i => !i.done) ?? [];
    if (pending.length) {
      const p = pending[0];
      const n = data.promo!.channels.filter(c => c in p.ticks).length;
      const days = Math.floor((Date.now() - p.t) / DAY);
      nudges.push({
        text: <>“{p.label}” is out{days ? ` (${days} day${days > 1 ? 's' : ''})` : ''}, promo {n}/{data.promo!.channels.length}{pending.length > 1 ? `, and ${pending.length - 1} more to tell people about` : ''}</>,
        onClick: onShip,
      });
    }
    for (const i of data.stale.slice(0, 2)) {
      const days = Math.floor((Date.now() - Date.parse(i.updated)) / DAY);
      nudges.push({ text: <>{i.repo}#{i.number} “{i.title}” untouched for {days} days</>, href: i.url });
    }
  }
  const moreStale = data ? data.staleCount - Math.min(2, data.stale.length) : 0;
  const hot = s && s.today > 0;

  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-3 mb-4">
      <div className={cn('flex items-center gap-2 font-mono text-xs uppercase tracking-widest transition-colors', hot ? 'text-brand-orange' : 'text-zinc-500')}
        title={s ? `Best streak this year: ${s.best} days` : undefined}>
        <Flame className={cn('w-5 h-5', hot && 'fill-brand-orange/30', cheer && 'animate-bounce')} aria-hidden />
        <span className="font-display text-2xl font-black tracking-normal text-white">{s ? s.streak : '…'}</span>
        <span>day{s?.streak === 1 ? '' : 's'} streak{s && !hot && s.streak > 0 ? ' · not yet today' : ''}</span>
      </div>
      {cheer && <p role="status" className="font-mono text-xs text-brand-orange self-center">{cheer}</p>}
      <ul className="flex-grow min-w-0 space-y-1 self-center">
        {nudges.map((n, i) => (
          <li key={i} className="flex items-start gap-2 font-mono text-xs text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" aria-hidden />
            {n.href ? <a href={n.href} target="_blank" rel="noreferrer" className="hover:text-amber-200 truncate">{n.text}</a>
              : n.onClick ? <button type="button" onClick={n.onClick} className="text-left hover:text-amber-200">{n.text} →</button>
              : <span>{n.text}</span>}
          </li>
        ))}
        {moreStale > 0 && (
          <li className="pl-5 font-mono text-xs">
            <button type="button" onClick={onIssues} className="text-zinc-500 hover:text-white">and {moreStale} more stale issue{moreStale === 1 ? '' : 's'} →</button>
          </li>
        )}
      </ul>
      <button type="button" onClick={sound.toggle} aria-pressed={sound.on} title={sound.on ? 'Streak sound on' : 'Streak sound off'}
        aria-label={sound.on ? 'Turn the streak sound off' : 'Turn the streak sound on'} className="p-1.5 text-zinc-500 hover:text-white self-center">
        {sound.on ? <Volume2 className="w-4 h-4" aria-hidden /> : <VolumeX className="w-4 h-4" aria-hidden />}
      </button>
    </div>
  );
}

// ---------- Heatmap ----------

/** Sequential, one hue (brand orange), dim to bright on the dark surface. */
const LEVELS = ['#1c1c1f', '#4a3410', '#7f560a', '#bf8005', '#ffaa00'];
const level = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4);
const CELL = 11;
const GAP = 2;

export function Heatmap({ s, data, error }: { s: Stats | null; data: MomentumData | null; error: string }) {
  const [hover, setHover] = useState<{ key: string; x: number; y: number } | null>(null);
  const [picked, setPicked] = useState<string>(() => dayKey(new Date()));

  // 53 weeks of columns, Monday first, ending this week.
  const weeks = useMemo(() => {
    const today = new Date();
    const monday = addDays(today, -((today.getDay() + 6) % 7));
    const start = addDays(monday, -52 * 7);
    return Array.from({ length: 53 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
  }, []);
  const todayKey = dayKey(new Date());

  if (error) return <p className="font-mono text-xs text-red-400">{error}</p>;

  // A label where a month starts; none for a first month with under 3 weeks showing (it would collide with the next).
  const months = weeks.map((w, i) => {
    const starts = i === 0 || w[0].getMonth() !== weeks[i - 1][0].getMonth();
    if (!starts) return '';
    if (i === 0 && weeks.slice(0, 3).some(x => x[0].getMonth() !== w[0].getMonth())) return '';
    return w[0].toLocaleDateString(undefined, { month: 'short' });
  });
  const pickedEvents = s?.byDay.get(picked) ?? [];
  const hoverEvents = hover ? s?.byDay.get(hover.key) ?? [] : [];

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <h2 className="font-display font-bold text-xl text-white tracking-wide">Momentum</h2>
        {s && (
          <dl className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            <div><dt className="inline">Public this week </dt><dd className="inline text-white">{s.weekPublic}</dd></div>
            <div><dt className="inline">Issues closed </dt><dd className="inline text-white">{s.weekIssues}</dd></div>
            <div><dt className="inline">Ideas </dt><dd className="inline text-white">{s.weekIdeas}</dd></div>
            <div><dt className="inline">Promo </dt><dd className="inline text-white">{s.weekPromo}</dd></div>
            <div><dt className="inline">Best streak </dt><dd className="inline text-white">{s.best} d</dd></div>
          </dl>
        )}
      </div>

      <div className="relative overflow-x-auto pb-2">
        <svg viewBox={`0 0 ${53 * (CELL + GAP) + 28} ${7 * (CELL + GAP) + 18}`} width="100%" role="img" aria-label="Days with something shipped, last 53 weeks" className="block min-w-[640px] max-w-[1100px]">
          {months.map((m, i) => m && <text key={i} x={28 + i * (CELL + GAP)} y={9} className="fill-zinc-500 font-mono" fontSize={9}>{m}</text>)}
          {['Mon', '', 'Wed', '', 'Fri', '', ''].map((d, i) => d && <text key={d} x={0} y={18 + i * (CELL + GAP) + 9} className="fill-zinc-600 font-mono" fontSize={9}>{d}</text>)}
          {weeks.map((w, wi) => w.map((d, di) => {
            const key = dayKey(d);
            if (key > todayKey) return null;
            const n = s?.byDay.get(key)?.length ?? 0;
            return (
              <rect key={key} x={28 + wi * (CELL + GAP)} y={16 + di * (CELL + GAP)} width={CELL} height={CELL} rx={2}
                fill={LEVELS[level(n)]} stroke={key === picked ? '#ffffff' : key === todayKey ? '#ffcc66' : 'none'} strokeWidth={key === picked || key === todayKey ? 1 : 0}
                className="cursor-pointer"
                onMouseEnter={e => setHover({ key, x: (e.target as SVGRectElement).getBoundingClientRect().left, y: (e.target as SVGRectElement).getBoundingClientRect().top })}
                onMouseLeave={() => setHover(null)}
                onClick={() => setPicked(key)}>
                <title>{`${d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}: ${n || 'nothing'}`}</title>
              </rect>
            );
          }))}
        </svg>
        {hover && (
          <div className="fixed z-50 pointer-events-none border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-[11px] text-zinc-300 shadow-lg w-64"
            style={{ left: hover.x + 280 > window.innerWidth ? hover.x - 264 : hover.x + 16, top: hover.y - 8 }}>
            <p className="text-white mb-1">{new Date(`${hover.key}T12:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            {hoverEvents.length ? hoverEvents.slice(0, 6).map((e, i) => (
              <p key={i} className="truncate"><span className="text-zinc-500">{KIND_LABEL[e.kind]}</span> {e.label}</p>
            )) : <p className="text-zinc-500">Nothing shipped</p>}
            {hoverEvents.length > 6 && <p className="text-zinc-500">+{hoverEvents.length - 6} more</p>}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] text-zinc-500">
        Less {LEVELS.map(c => <span key={c} className="inline-block w-[11px] h-[11px] rounded-[2px]" style={{ background: c }} />)} More
        <span className="ml-3">Counts: anything public, issues closed as done, ideas captured, promo done.</span>
      </div>

      <div className="mt-5">
        <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 mb-2">
          {picked === todayKey ? 'Today' : new Date(`${picked}T12:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          {' · '}{pickedEvents.length || 'nothing yet'}
        </p>
        {pickedEvents.length > 0 && (
          <ul className="space-y-1">
            {pickedEvents.map((e, i) => (
              <li key={i} className="flex items-baseline gap-3 text-sm">
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 w-24 shrink-0">{KIND_LABEL[e.kind]}</span>
                {e.url ? <a href={e.url} target="_blank" rel="noreferrer" className="text-zinc-200 hover:text-white truncate inline-flex items-center gap-1">{e.label} <ArrowUpRight className="w-3 h-3 shrink-0" aria-hidden /></a>
                  : <span className="text-zinc-200 truncate">{e.label}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {data && data.errors.length > 0 && <p className="mt-3 font-mono text-[11px] text-zinc-600">{data.errors.join(' · ')}</p>}
    </section>
  );
}
