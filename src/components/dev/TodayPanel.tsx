import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, ChevronDown, ChevronRight, SkipForward } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api, postJson } from '../../lib/devApi';
import { errorText } from './ui';

/**
 * Launchpad: the latest weekly review (written by Claude) and today's pick of 1–3 issues (worker/focus.ts).
 * "Not today" is remembered in this browser until midnight; "Done" closes the issue as completed.
 */
interface Pick { repo: string; number: number; title: string; url: string; size: string | null; now: boolean; waitedDays: number; why: string }
interface Review { id: string; created: number; markdown: string }

const SKIP_KEY = 'dev-today-skip';
const dayKey = () => new Date().toLocaleDateString('en-CA');
function readSkips(): string[] {
  try {
    const s = JSON.parse(localStorage.getItem(SKIP_KEY) ?? 'null') as { day: string; keys: string[] } | null;
    return s?.day === dayKey() ? s.keys : [];
  } catch { return []; }
}
function writeSkips(keys: string[]) {
  localStorage.setItem(SKIP_KEY, JSON.stringify({ day: dayKey(), keys }));
}

export function WeeklyReview() {
  const [review, setReview] = useState<Review | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { api<{ review: Review | null }>('review').then(r => setReview(r.review)).catch(() => setReview(null)); }, []);
  if (!review) return null;
  const days = Math.floor((Date.now() - review.created) / 86_400_000);
  return (
    <section className="border border-zinc-800 bg-zinc-950/40">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-zinc-900/60">
        {open ? <ChevronDown className="w-4 h-4 text-zinc-500" aria-hidden /> : <ChevronRight className="w-4 h-4 text-zinc-500" aria-hidden />}
        <span className="font-display font-bold text-white tracking-wide">Weekly review</span>
        <span className="font-mono text-[11px] text-zinc-500">by Claude · {days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`}</span>
        {!open && <span className="ml-2 truncate text-sm text-zinc-400">{review.markdown.replace(/^#+\s*/gm, '').split('\n').find(l => l.trim()) ?? ''}</span>}
      </button>
      {open && <div className="px-4 pb-4 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{review.markdown}</div>}
    </section>
  );
}

export function TodayPanel({ onChange }: { onChange: () => void }) {
  const [pick, setPick] = useState<Pick[] | null>(null);
  const [open, setOpen] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = () => api<{ pick: Pick[]; open: number }>(`today?exclude=${encodeURIComponent(readSkips().join(','))}`)
    .then(r => { setPick(r.pick); setOpen(r.open); setError(''); }).catch(e => setError(errorText(e)));
  useEffect(() => { load(); }, []);

  const key = (p: Pick) => `${p.repo}#${p.number}`;
  function skip(p: Pick) { writeSkips([...readSkips(), key(p)]); load(); }
  async function done(p: Pick) {
    setBusy(key(p));
    try {
      await postJson('issue-save', { repo: p.repo, number: p.number, state: 'closed', reason: 'completed' });
      onChange();
      await load();
    } catch (e) { setError(errorText(e)); } finally { setBusy(''); }
  }

  if (error) return <p className="font-mono text-xs text-red-400">Today: {error}</p>;
  if (!pick?.length) return null;
  return (
    <section aria-labelledby="today-h">
      <div className="flex items-baseline gap-3 mb-3">
        <h2 id="today-h" className="font-display font-bold text-xl text-white tracking-wide">Today</h2>
        <span className="font-mono text-[11px] text-zinc-500">{pick.length} of {open} open issues · "now" and small ones first</span>
      </div>
      <ul className="grid gap-3 md:grid-cols-3">
        {pick.map(p => (
          <li key={key(p)} className={cn('border bg-zinc-950/40 p-4 flex flex-col', p.now ? 'border-brand-orange/50' : 'border-zinc-800')}>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">{p.repo} #{p.number}</p>
            <a href={p.url} target="_blank" rel="noreferrer" className="text-zinc-100 hover:text-white leading-snug flex-grow">
              {p.title} <ArrowUpRight className="inline w-3 h-3 text-zinc-500" aria-hidden />
            </a>
            <p className="mt-2 font-mono text-[10px] text-zinc-500">{p.why}</p>
            <div className="flex gap-2 mt-3">
              <button type="button" disabled={busy === key(p)} onClick={() => done(p)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-widest border border-emerald-900/70 text-emerald-400 hover:text-emerald-300 disabled:opacity-40">
                <Check className="w-3.5 h-3.5" aria-hidden /> Done
              </button>
              <button type="button" onClick={() => skip(p)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:text-white">
                <SkipForward className="w-3.5 h-3.5" aria-hidden /> Not today
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
