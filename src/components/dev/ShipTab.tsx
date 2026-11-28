import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, ClipboardCopy, Download, Megaphone, Package } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api, postJson } from '../../lib/devApi';
import { KIND_LABEL, useMomentum, useSound, type PromoItem } from './Momentum';
import { button, errorText, ghostButton, input, label } from './ui';

/**
 * Ship: tell people about what you shipped (a promo checklist per ship, made automatically; every tick counts toward
 * the streak), your releases with download counts, and a changelog draft for the next release (worker/ship.ts).
 */

const DAY = 86_400_000;
const nf = new Intl.NumberFormat();
const ago = (t: number) => {
  const d = Math.floor((Date.now() - t) / DAY);
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
};

// ---------- Promo ----------

function PromoCard({ item, channels, onTick }: { key?: string; item: PromoItem; channels: string[]; onTick: (item: PromoItem, channel: string, done: boolean) => Promise<void> }) {
  const [busy, setBusy] = useState('');
  const tick = async (c: string, done: boolean) => { setBusy(c); await onTick(item, c, done); setBusy(''); };
  const n = channels.filter(c => c in item.ticks).length;
  return (
    <li className={cn('border p-4', item.done ? 'border-zinc-900 opacity-70' : 'border-zinc-800 bg-zinc-950/40')}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{KIND_LABEL[item.kind]} · {ago(item.t)}</span>
        <a href={item.url} target="_blank" rel="noreferrer" className="text-zinc-100 hover:text-white inline-flex items-center gap-1 min-w-0">
          <span className="truncate">{item.label}</span> <ArrowUpRight className="w-3 h-3 shrink-0" aria-hidden />
        </a>
        <span className="ml-auto font-mono text-[11px] text-zinc-500">{item.skipped ? 'skipped' : `${n}/${channels.length}`}</span>
      </div>
      <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label={`Promo for ${item.label}`}>
        {channels.map(c => {
          const on = c in item.ticks;
          return (
            <button key={c} type="button" aria-pressed={on} disabled={busy !== '' || item.skipped} onClick={() => tick(c, !on)}
              title={on ? `Done ${new Date(item.ticks[c]).toLocaleString()}` : `Mark ${c} done`}
              className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 border font-mono text-[11px] uppercase tracking-widest transition-colors disabled:opacity-40',
                on ? 'border-emerald-700 text-emerald-400 bg-emerald-950/30' : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600')}>
              {on && <Check className="w-3.5 h-3.5" aria-hidden />} {c}
            </button>
          );
        })}
        <span className="flex-grow" />
        <button type="button" disabled={busy !== ''} onClick={() => tick('skip', !item.skipped)}
          className="px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-zinc-500 hover:text-white disabled:opacity-40">
          {item.skipped ? 'Unskip' : 'No promo needed'}
        </button>
      </div>
    </li>
  );
}

function Channels({ channels, onSaved }: { channels: string[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  async function save() {
    try {
      await postJson('promo-channels', { channels: value.split(',') });
      setOpen(false); onSaved();
    } catch (err) { setError(errorText(err)); }
  }
  if (!open) {
    return (
      <button type="button" onClick={() => { setValue(channels.join(', ')); setOpen(true); setError(''); }} className="font-mono text-[11px] text-zinc-500 hover:text-white">
        Channels: {channels.join(', ')} · change
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input className={cn(input, 'max-w-md py-1.5 text-xs')} value={value} onChange={e => setValue(e.target.value)} aria-label="Promo channels, comma separated"
        onKeyDown={e => { if (e.key === 'Enter') save(); }} />
      <button type="button" className={cn(button, 'py-1.5')} onClick={save}>Save</button>
      <button type="button" className={cn(ghostButton, 'py-1.5')} onClick={() => setOpen(false)}>Cancel</button>
      {error && <span className="font-mono text-xs text-red-400">{error}</span>}
    </div>
  );
}

function Promo() {
  const sound = useSound();
  const [cheer, setCheer] = useState('');
  const [showDone, setShowDone] = useState(false);
  const m = useMomentum(streak => {
    sound.play();
    setCheer(streak > 1 ? `Day ${streak}. Streak alive.` : 'Day 1. A new streak starts.');
    setTimeout(() => setCheer(''), 5000);
  });
  const [error, setError] = useState('');
  const promo = m.data?.promo;

  async function onTick(item: PromoItem, channel: string, done: boolean) {
    try {
      setError('');
      await postJson('promo-tick', { ref: item.ref, channel, done, label: item.label });
      await m.reload();
    } catch (err) { setError(errorText(err)); }
  }

  const pending = promo?.items.filter(i => !i.done) ?? [];
  const done = promo?.items.filter(i => i.done) ?? [];

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display font-bold text-xl text-white tracking-wide flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-orange" aria-hidden /> Tell people
            {promo && pending.length > 0 && <span className="text-zinc-500 font-normal"> · {pending.length} to do</span>}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Everything you ship gets a checklist here by itself. Each tick counts toward your streak.
          </p>
        </div>
        {cheer && <p role="status" className="font-mono text-xs text-brand-orange">{cheer}</p>}
      </div>
      {m.error ? <p className="font-mono text-xs text-red-400">{m.error}</p>
        : !m.data ? <p className="text-sm text-zinc-500">Loading…</p>
        : !promo ? <p className="font-mono text-xs text-red-400">{m.data.errors.join(' · ')}</p>
        : (
          <>
            {pending.length ? (
              <ul className="space-y-3">{pending.map(i => <PromoCard key={i.ref} item={i} channels={promo.channels} onTick={onTick} />)}</ul>
            ) : (
              <p className="text-sm text-zinc-500 border border-dashed border-zinc-800 px-4 py-8 text-center">
                Nothing waiting. Ship something and it shows up here.
              </p>
            )}
            {error && <p className="mt-3 font-mono text-xs text-red-400">{error}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              {done.length > 0 && (
                <button type="button" onClick={() => setShowDone(v => !v)} className="font-mono text-[11px] text-zinc-500 hover:text-white">
                  {showDone ? 'Hide' : 'Show'} {done.length} done
                </button>
              )}
              <Channels channels={promo.channels} onSaved={m.reload} />
              <span className="font-mono text-[11px] text-zinc-600">Ships since {new Date(promo.since).toLocaleDateString()}</span>
            </div>
            {showDone && <ul className="space-y-2 mt-3">{done.map(i => <PromoCard key={i.ref} item={i} channels={promo.channels} onTick={onTick} />)}</ul>}
          </>
        )}
    </section>
  );
}

// ---------- Releases ----------

interface Rel { name: string; tag: string; published: string; url: string; prerelease: boolean; downloads: number; assets: Array<{ name: string; downloads: number }> }
interface Repo { repo: string; url: string; total: number; releases: Rel[] }

/** v1.2.3 → v1.2.4; anything else gets no suggestion. */
const nextTag = (tag: string) => {
  const m = /^(v?)(\d+)\.(\d+)\.(\d+)$/.exec(tag);
  return m ? `${m[1]}${m[2]}.${m[3]}.${Number(m[4]) + 1}` : '';
};

function Changelog({ repo }: { repo: Repo }) {
  const latest = repo.releases[0];
  const [notes, setNotes] = useState<{ markdown: string; issues: unknown[]; prs: unknown[] } | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    api<{ markdown: string; issues: unknown[]; prs: unknown[] }>(`release-notes?repo=${encodeURIComponent(repo.repo)}&since=${encodeURIComponent(latest.published)}`)
      .then(r => { setNotes(r); setText(r.markdown); })
      .catch(e => setError(errorText(e)));
  }, [repo.repo, latest.published]);
  const tag = nextTag(latest.tag);
  const draftUrl = `${repo.url}/releases/new?${new URLSearchParams({ ...(tag && { tag, title: tag }), body: text })}`;

  if (error) return <p className="font-mono text-xs text-red-400">{error}</p>;
  if (!notes) return <p className="text-sm text-zinc-500">Reading issues and pull requests since {latest.tag}…</p>;
  return (
    <div className="space-y-3">
      <p className={label}>Next release: {notes.issues.length} issue{notes.issues.length === 1 ? '' : 's'} done and {notes.prs.length} pull request{notes.prs.length === 1 ? '' : 's'} merged since {latest.tag}</p>
      <textarea className={cn(input, 'min-h-40 font-mono text-[13px]')} value={text} onChange={e => setText(e.target.value)} aria-label="Changelog draft"
        placeholder="Nothing closed or merged since the last release yet." />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={cn(ghostButton, 'py-2 inline-flex items-center gap-2')} disabled={!text}
          onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}>
          <ClipboardCopy className="w-3.5 h-3.5" aria-hidden /> {copied ? 'Copied' : 'Copy'}
        </button>
        <a href={draftUrl} target="_blank" rel="noreferrer" className={cn(button, 'py-2 inline-flex items-center gap-2')}>
          Draft {tag || 'release'} on GitHub <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}

function Releases() {
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { api<{ repos: Repo[] }>('releases').then(r => setRepos(r.repos)).catch(e => setError(errorText(e))); }, []);

  return (
    <section>
      <h2 className="font-display font-bold text-xl text-white tracking-wide flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-brand-orange" aria-hidden /> Releases
      </h2>
      {error ? <p className="font-mono text-xs text-red-400">{error}</p>
        : !repos ? <p className="text-sm text-zinc-500">Loading from GitHub…</p>
        : !repos.length ? <p className="text-sm text-zinc-500">No releases yet in any repository.</p>
        : (
          <ul className="divide-y divide-zinc-900 border-y border-zinc-900">
            {repos.map(r => {
              const latest = r.releases[0];
              const days = Math.floor((Date.now() - Date.parse(latest.published)) / DAY);
              const all = r.releases.reduce((n, x) => n + x.downloads, 0);
              const isOpen = open === r.repo;
              return (
                <li key={r.repo} className="py-3">
                  <button type="button" onClick={() => setOpen(isOpen ? null : r.repo)} aria-expanded={isOpen}
                    className="w-full grid grid-cols-[1fr_auto] md:grid-cols-[12rem_1fr_auto_auto] items-baseline gap-x-6 gap-y-1 text-left group">
                    <span className="text-zinc-100 group-hover:text-white truncate">{r.repo}</span>
                    <span className="font-mono text-xs text-zinc-400 truncate">{latest.name !== latest.tag ? `${latest.name} · ` : ''}{latest.tag}{latest.prerelease && ' · pre-release'}</span>
                    <span className={cn('font-mono text-[11px]', days > 90 ? 'text-amber-400' : 'text-zinc-500')}>{days === 0 ? 'today' : `${days} d ago`}</span>
                    <span className="font-mono text-[11px] text-zinc-300 inline-flex items-center gap-1" title={`${nf.format(latest.downloads)} for ${latest.tag}; ${nf.format(all)} for the last ${r.releases.length} releases`}>
                      <Download className="w-3 h-3 text-zinc-500" aria-hidden /> {nf.format(latest.downloads)}
                      {r.releases.length > 1 && <span className="text-zinc-600"> / {nf.format(all)}</span>}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="mt-4 grid lg:grid-cols-2 gap-8">
                      <div>
                        <p className={label}>Downloads per release</p>
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-zinc-900">
                            {r.releases.map(x => (
                              <tr key={x.tag} className="align-top">
                                <td className="py-1.5 pr-3"><a href={x.url} target="_blank" rel="noreferrer" className="font-mono text-xs text-zinc-300 hover:text-white">{x.tag}</a></td>
                                <td className="py-1.5 pr-3 font-mono text-[11px] text-zinc-500">{x.published.slice(0, 10)}</td>
                                <td className="py-1.5 font-mono text-xs text-zinc-200 text-right">{nf.format(x.downloads)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {latest.assets.length > 0 && (
                          <>
                            <p className={cn(label, 'mt-4')}>{latest.tag} by file</p>
                            <ul className="space-y-1">
                              {[...latest.assets].sort((a, b) => b.downloads - a.downloads).map(a => (
                                <li key={a.name} className="flex justify-between gap-3 font-mono text-[11px]">
                                  <span className="text-zinc-400 truncate">{a.name}</span><span className="text-zinc-200">{nf.format(a.downloads)}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        <p className="mt-3 font-mono text-[10px] text-zinc-600">GitHub counts downloads of release files only, not source code archives.</p>
                      </div>
                      <Changelog repo={r} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
    </section>
  );
}

export function ShipTab() {
  return (
    <div className="space-y-14">
      <Promo />
      <Releases />
    </div>
  );
}
