import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, CircleDot, ExternalLink, GitCommitHorizontal, GitMerge, GitPullRequest, Loader2, RefreshCw, Tag, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/devApi';
import { PACKS, SAMPLES } from '../../data/samples';
import { POSTS } from '../../posts';
import { DATABEND_RELEASE } from '../../data/databend';
import type { Sketch } from '../../data/sketches';

/**
 * /dev Overview: what's on the site, whether the live site is up to date, and the GitHub side
 * (pushes, weekly activity, issues, pull requests, Actions, versions). Data from worker/stats.ts.
 */

type Section<T> = ({ ok: true } & T) | { ok: false; error: string };
interface Commit { sha: string; url: string; message: string; author: string; date: string; fromDashboard: boolean }
interface Release { tag: string; name: string; url: string; date: string | null; prerelease: boolean; downloads: number; assets: Array<{ name: string; downloads: number }> }
interface Stats {
  repo: Section<{ private: boolean; pushedAt: string; sizeKb: number; url: string }>;
  commits: Section<{ recent: Commit[]; weeks: Array<{ start: string; count: number }>; total: number }>;
  issues: Section<{ items: Array<{ number: number; title: string; url: string; updated: string; author: string; comments: number; labels: string[]; state: string }> }>;
  pulls: Section<{ items: Array<{ number: number; title: string; url: string; updated: string; author: string; branch: string; state: string }> }>;
  runs: Section<{ items: Array<{ name: string; title: string; url: string; status: string; conclusion: string | null; date: string; event: string }> }>;
  versions: {
    site: Section<{ releases: Release[] }>;
    tags: Section<{ items: Array<{ name: string; sha: string }> }>;
    databend: Section<{ repo: string; releases: Release[] }>;
  };
}

const REPO_URL = 'https://github.com/SpacekidLabs/SpaceKidLabs_website';
const DEPLOYS_URL = 'https://dash.cloudflare.com/?to=/:account/workers/services/view/spacekidlabs/production/deployments';

/** "3m ago", "5h ago", "2d ago", or a date for anything older than a month. */
function ago(iso: string | null): string {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 30 * 86_400) return `${Math.floor(s / 86_400)}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const nf = new Intl.NumberFormat('en');
const weekLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

const heading = 'font-mono text-[11px] uppercase tracking-widest text-zinc-500 mb-3';
const card = 'border border-zinc-800 bg-zinc-900/40 p-5';

function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn(card, className)}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className={heading}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className={card}>
      <div className={heading}>{label}</div>
      <div className="font-display font-bold text-3xl text-white tabular-nums">{value}</div>
      {detail && <div className="mt-1 text-xs text-zinc-400">{detail}</div>}
    </div>
  );
}

const Problem = ({ text }: { text: string }) => <p className="text-xs text-amber-400 leading-relaxed">{text}</p>;
const Empty = ({ text }: { text: string }) => <p className="text-sm text-zinc-500">{text}</p>;

function ExtLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cn('hover:text-brand-orange transition-colors', className)}>
      {children}
    </a>
  );
}

/** Commits per week, one series: bars on a shared baseline, hover (or focus) shows the exact count. */
function ActivityChart({ weeks }: { weeks: Array<{ start: string; count: number }> }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...weeks.map(w => w.count));
  const H = 120;
  const shown = hover ?? weeks.length - 1;
  return (
    <div>
      <p className="text-sm text-zinc-300 mb-3 h-5" aria-live="polite">
        <span className="font-mono tabular-nums text-white">{weeks[shown]?.count ?? 0}</span>{' '}
        commit{weeks[shown]?.count === 1 ? '' : 's'} in the week of {weeks[shown] && weekLabel(weeks[shown].start)}
        {hover === null && <span className="text-zinc-500"> (this week)</span>}
      </p>
      <div className="relative" style={{ height: H }}>
        {/* Recessive grid: baseline and the max line only. */}
        <div className="absolute inset-x-0 bottom-0 border-t border-zinc-700" aria-hidden />
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-zinc-800" aria-hidden />
        <span className="absolute -top-2 right-0 bg-[#0d0d0d] pl-1 font-mono text-[10px] text-zinc-500" aria-hidden>{max}</span>
        <div className="absolute inset-0 flex items-end gap-[2px] pr-6" onMouseLeave={() => setHover(null)}>
          {weeks.map((w, i) => (
            <button
              key={w.start}
              type="button"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`Week of ${weekLabel(w.start)}: ${w.count} commits`}
              className="relative flex-1 h-full flex items-end group outline-none"
            >
              <span
                className={cn(
                  'block w-full rounded-t-[4px] transition-colors',
                  w.count ? (hover === i ? 'bg-brand-gold' : 'bg-brand-orange') : 'bg-transparent',
                )}
                style={{ height: w.count ? Math.max(3, (w.count / max) * (H - 4)) : 0 }}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between pr-6 mt-2 font-mono text-[10px] text-zinc-500">
        <span>{weekLabel(weeks[0].start)}</span>
        <span>this week</span>
      </div>
    </div>
  );
}

function runIcon(status: string, conclusion: string | null) {
  if (status !== 'completed') return <Loader2 className="w-4 h-4 text-zinc-400 animate-spin shrink-0" aria-label="Running" />;
  if (conclusion === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-label="Passed" />;
  return <XCircle className="w-4 h-4 text-red-400 shrink-0" aria-label={conclusion ?? 'Failed'} />;
}

function ReleaseList({ list, empty }: { list: Release[]; empty: string }) {
  if (!list.length) return <Empty text={empty} />;
  return (
    <ul className="space-y-2">
      {list.map((r, i) => (
        <li key={r.tag} className="flex items-baseline gap-3 text-sm">
          <Tag className="w-3.5 h-3.5 text-zinc-500 shrink-0 translate-y-0.5" aria-hidden />
          <ExtLink href={r.url} className={cn('font-mono', i === 0 ? 'text-white' : 'text-zinc-300')}>{r.tag}</ExtLink>
          {r.prerelease && <span className="font-mono text-[10px] uppercase text-zinc-500 border border-zinc-700 px-1">pre</span>}
          <span className="text-xs text-zinc-500">{ago(r.date)}</span>
          <span className="ml-auto text-xs text-zinc-400 tabular-nums">{nf.format(r.downloads)} downloads</span>
        </li>
      ))}
    </ul>
  );
}

export function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sketches, setSketches] = useState<Sketch[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, c] = await Promise.all([api<Stats>('github'), api<{ sketches: Sketch[] }>('content')]);
      setStats(s);
      setSketches(c.sketches);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const demos = sketches?.filter(s => s.kind === 'demo').length ?? 0;
  const ideas = sketches?.filter(s => s.kind === 'idea').length ?? 0;
  const latestPost = POSTS[0]?.meta;
  const latestPostDate = POSTS.reduce((d, p) => (p.meta.date > d ? p.meta.date : d), '');
  const packCounts = PACKS.map(p => ({ title: p.title, n: SAMPLES.filter(s => s.pack === p.id).length }));
  const databendLatest = stats?.versions.databend.ok ? stats.versions.databend.releases[0] : undefined;
  const databendDownloads = stats?.versions.databend.ok ? stats.versions.databend.releases.reduce((n, r) => n + r.downloads, 0) : null;

  // Live site vs main: how many commits on main are newer than the one this page was built from.
  const recent = stats?.commits.ok ? stats.commits.recent : [];
  const behind = recent.findIndex(c => c.sha === __BUILD_COMMIT__);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-400">
          Site data is from the live build; GitHub data is live.
        </p>
        <button type="button" onClick={load} disabled={loading}
          className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-zinc-400 hover:text-white disabled:opacity-50">
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} aria-hidden /> Refresh
        </button>
      </div>
      {error && <p className="font-mono text-sm text-red-400">{error}</p>}

      {/* Live version */}
      <section className={cn(card, 'flex flex-wrap items-center gap-x-6 gap-y-2')}>
        <h2 className={cn(heading, 'mb-0')}>Live version</h2>
        <span className="font-mono text-sm text-white">
          {__BUILD_COMMIT__ ? <ExtLink href={`${REPO_URL}/commit/${__BUILD_COMMIT__}`}>{__BUILD_COMMIT__.slice(0, 7)}</ExtLink> : 'unknown'}
        </span>
        <span className="text-xs text-zinc-500">built {ago(__BUILD_TIME__)}</span>
        {stats?.commits.ok && (
          behind === 0 ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden /> Up to date with main</span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-amber-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
              {behind > 0 ? `${behind} newer commit${behind > 1 ? 's' : ''} on main: deploying, or the build failed` : 'Main has moved on; a deploy is probably running'}
            </span>
          )
        )}
        <ExtLink href={DEPLOYS_URL} className="ml-auto flex items-center gap-1 font-mono text-[11px] text-zinc-400">
          Cloudflare deploys <ExternalLink className="w-3 h-3" aria-hidden />
        </ExtLink>
      </section>

      {/* Content on the site */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Sketches" value={sketches ? sketches.length : '…'} detail={sketches && `${demos} demos · ${ideas} ideas`} />
        <Stat label="Samples" value={nf.format(SAMPLES.length)} detail={`${PACKS.length} packs`} />
        <Stat label="Archive posts" value={POSTS.length} detail={latestPost && <>Latest: {latestPost.title.length > 40 ? `${latestPost.title.slice(0, 40)}…` : latestPost.title} ({latestPostDate})</>} />
        <Stat
          label="DATABEND"
          value={databendLatest?.tag ?? `v${DATABEND_RELEASE.version}`}
          detail={databendDownloads !== null ? `${nf.format(databendDownloads)} downloads, all releases` : 'Downloads unavailable'}
        />
      </div>

      <div className="grid lg:grid-cols-[3fr_2fr] gap-4">
        <Panel title={`Pushes to main · last 12 weeks${stats?.commits.ok ? ` · ${stats.commits.total}` : ''}`}>
          {!stats ? <Empty text="Loading…" /> : stats.commits.ok ? <ActivityChart weeks={stats.commits.weeks} /> : <Problem text={stats.commits.error} />}
        </Panel>
        <Panel title="Samples per pack">
          <ul className="space-y-1.5">
            {packCounts.map(p => (
              <li key={p.title} className="flex justify-between gap-4 text-sm">
                <span className="text-zinc-300 truncate">{p.title}</span>
                <span className="font-mono text-zinc-400 tabular-nums">{p.n}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Recent pushes" action={<ExtLink href={`${REPO_URL}/commits/main`} className="font-mono text-[11px] text-zinc-400">All commits</ExtLink>}>
        {!stats ? <Empty text="Loading…" /> : !stats.commits.ok ? <Problem text={stats.commits.error} /> : (
          <ul className="divide-y divide-zinc-900">
            {stats.commits.recent.map(c => (
              <li key={c.sha} className="flex items-baseline gap-3 py-2 text-sm">
                <GitCommitHorizontal className="w-4 h-4 text-zinc-500 shrink-0 translate-y-0.5" aria-hidden />
                <ExtLink href={c.url} className="font-mono text-xs text-zinc-400 shrink-0">{c.sha.slice(0, 7)}</ExtLink>
                <span className="text-zinc-200 truncate">{c.message}</span>
                {c.fromDashboard && <span className="font-mono text-[10px] uppercase text-brand-orange border border-brand-orange/40 px-1 shrink-0">dev</span>}
                {c.sha === __BUILD_COMMIT__ && <span className="font-mono text-[10px] uppercase text-emerald-400 border border-emerald-400/40 px-1 shrink-0">live</span>}
                <span className="ml-auto text-xs text-zinc-500 shrink-0">{ago(c.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Issues" action={<ExtLink href={`${REPO_URL}/issues`} className="font-mono text-[11px] text-zinc-400">On GitHub</ExtLink>}>
          {!stats ? <Empty text="Loading…" /> : !stats.issues.ok ? <Problem text={stats.issues.error} /> : !stats.issues.items.length ? <Empty text="No issues." /> : (
            <ul className="space-y-2">
              {stats.issues.items.map(i => (
                <li key={i.number} className="flex items-baseline gap-2 text-sm">
                  <CircleDot className={cn('w-4 h-4 shrink-0 translate-y-0.5', i.state === 'open' ? 'text-emerald-400' : 'text-zinc-500')} aria-label={i.state} />
                  <ExtLink href={i.url} className="text-zinc-200 truncate">#{i.number} {i.title}</ExtLink>
                  <span className="ml-auto text-xs text-zinc-500 shrink-0">{ago(i.updated)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Pull requests" action={<ExtLink href={`${REPO_URL}/pulls`} className="font-mono text-[11px] text-zinc-400">On GitHub</ExtLink>}>
          {!stats ? <Empty text="Loading…" /> : !stats.pulls.ok ? <Problem text={stats.pulls.error} /> : !stats.pulls.items.length ? <Empty text="No pull requests." /> : (
            <ul className="space-y-2">
              {stats.pulls.items.map(p => (
                <li key={p.number} className="flex items-baseline gap-2 text-sm">
                  {p.state === 'merged'
                    ? <GitMerge className="w-4 h-4 text-violet-400 shrink-0 translate-y-0.5" aria-label="merged" />
                    : <GitPullRequest className={cn('w-4 h-4 shrink-0 translate-y-0.5', p.state === 'open' ? 'text-emerald-400' : 'text-zinc-500')} aria-label={p.state} />}
                  <ExtLink href={p.url} className="text-zinc-200 truncate">#{p.number} {p.title}</ExtLink>
                  <span className="ml-auto text-xs text-zinc-500 shrink-0">{p.state} · {ago(p.updated)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Versions">
          <h3 className="text-xs text-zinc-400 mb-2">DATABEND {stats?.versions.databend.ok && <span className="font-mono text-zinc-500">({stats.versions.databend.repo})</span>}</h3>
          {!stats ? <Empty text="Loading…" /> : stats.versions.databend.ok
            ? <ReleaseList list={stats.versions.databend.releases} empty="No releases yet." />
            : <Problem text={stats.versions.databend.error} />}
          <h3 className="text-xs text-zinc-400 mt-5 mb-2">This site</h3>
          {!stats ? null : stats.versions.site.ok && stats.versions.site.releases.length
            ? <ReleaseList list={stats.versions.site.releases} empty="" />
            : stats.versions.tags.ok && stats.versions.tags.items.length
              ? <p className="text-sm text-zinc-300 font-mono">{stats.versions.tags.items.map(t => t.name).join(' · ')}</p>
              : !stats.versions.site.ok ? <Problem text={stats.versions.site.error} />
              : <Empty text="No releases or tags. The site deploys every push to main; the live version is shown above." />}
        </Panel>
        <Panel title="GitHub Actions" action={<ExtLink href={`${REPO_URL}/actions`} className="font-mono text-[11px] text-zinc-400">On GitHub</ExtLink>}>
          {!stats ? <Empty text="Loading…" /> : !stats.runs.ok ? <Problem text={stats.runs.error} /> : !stats.runs.items.length ? <Empty text="No runs yet." /> : (
            <ul className="space-y-2">
              {stats.runs.items.map(r => (
                <li key={r.url} className="flex items-baseline gap-2 text-sm">
                  <span className="translate-y-0.5">{runIcon(r.status, r.conclusion)}</span>
                  <ExtLink href={r.url} className="text-zinc-200 truncate">{r.name}: {r.title}</ExtLink>
                  <span className="ml-auto text-xs text-zinc-500 shrink-0">{ago(r.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {stats?.repo.ok && (
        <p className="font-mono text-[11px] text-zinc-600">
          Repository: {stats.repo.private ? 'private' : 'public'} · {(stats.repo.sizeKb / 1024).toFixed(0)} MB · last push {ago(stats.repo.pushedAt)}
        </p>
      )}
    </div>
  );
}
