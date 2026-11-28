import type { ReactNode } from 'react';
import { CheckCircle2, CircleDot, GitCommitHorizontal, GitMerge, GitPullRequest, Loader2, Tag, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BarChart } from './BarChart';

/**
 * GitHub panels for one repository (worker/stats.ts): weekly pushes, recent pushes, issues, pull requests,
 * versions and Actions runs. Used by the Website tab and by each project in the Projects tab.
 */

export type Section<T> = ({ ok: true } & T) | { ok: false; error: string };
export interface Commit { sha: string; url: string; message: string; author: string; date: string; fromDashboard: boolean }
export interface Release { tag: string; name: string; url: string; date: string | null; prerelease: boolean; downloads: number; assets: Array<{ name: string; downloads: number }> }
export interface Stats {
  repo: Section<{ name: string; branch: string; private: boolean; pushedAt: string; sizeKb: number; url: string }>;
  commits: Section<{ recent: Commit[]; weeks: Array<{ start: string; count: number }>; total: number }>;
  issues: Section<{ items: Array<{ number: number; title: string; url: string; updated: string; author: string; comments: number; labels: string[]; state: string }> }>;
  pulls: Section<{ items: Array<{ number: number; title: string; url: string; updated: string; author: string; branch: string; state: string }> }>;
  runs: Section<{ items: Array<{ name: string; title: string; url: string; status: string; conclusion: string | null; date: string; event: string }> }>;
  versions: {
    site: Section<{ releases: Release[] }>;
    tags: Section<{ items: Array<{ name: string; sha: string }> }>;
    databend: Section<{ repo: string; releases: Release[] }> | null;
  };
}

/** "3m ago", "5h ago", "2d ago", or a date for anything older than a month. */
export function ago(iso: string | null): string {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 30 * 86_400) return `${Math.floor(s / 86_400)}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const nf = new Intl.NumberFormat('en');
const weekLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export const heading = 'font-mono text-[11px] uppercase tracking-widest text-zinc-500 mb-3';
export const card = 'border border-zinc-800 bg-zinc-900/40 p-5';

export function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
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

export function Stat({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className={card}>
      <div className={heading}>{label}</div>
      <div className="font-display font-bold text-3xl text-white tabular-nums">{value}</div>
      {detail && <div className="mt-1 text-xs text-zinc-400">{detail}</div>}
    </div>
  );
}

/** The message of a failed section (narrowing doesn't follow these without strictNullChecks). */
export const errorOf = (s: { ok: boolean }) => (s as { error?: string }).error ?? '';

export const Problem = ({ text }: { text: string }) => <p className="text-xs text-amber-400 leading-relaxed">{text}</p>;
export const Empty = ({ text }: { text: string }) => <p className="text-sm text-zinc-500">{text}</p>;

export function ExtLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cn('hover:text-brand-orange transition-colors', className)}>
      {children}
    </a>
  );
}

function ActivityChart({ weeks }: { weeks: Array<{ start: string; count: number }> }) {
  return (
    <BarChart
      points={weeks.map(w => ({ key: `Week of ${weekLabel(w.start)}`, value: w.count }))}
      describe={i => (
        <>
          <span className="font-mono tabular-nums text-white">{weeks[i].count}</span> commit{weeks[i].count === 1 ? '' : 's'} in the week of {weekLabel(weeks[i].start)}
          {i === weeks.length - 1 && <span className="text-zinc-500"> (this week)</span>}
        </>
      )}
      firstLabel={weekLabel(weeks[0].start)}
      lastLabel="this week"
    />
  );
}

function runIcon(status: string, conclusion: string | null) {
  if (status !== 'completed') return <Loader2 className="w-4 h-4 text-zinc-400 animate-spin shrink-0" aria-label="Running" />;
  if (conclusion === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-label="Passed" />;
  return <XCircle className="w-4 h-4 text-red-400 shrink-0" aria-label={conclusion ?? 'Failed'} />;
}

export function ReleaseList({ list, empty }: { list: Release[]; empty: string }) {
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

/** This repository's own releases, or its tags, or a note. */
function OwnVersions({ stats, none }: { stats: Stats; none: string }) {
  const v = stats.versions;
  if (v.site.ok && v.site.releases.length) return <ReleaseList list={v.site.releases} empty="" />;
  if (v.tags.ok && v.tags.items.length) return <p className="text-sm text-zinc-300 font-mono">{v.tags.items.map(t => t.name).join(' · ')}</p>;
  if (!v.site.ok) return <Problem text={errorOf(v.site)} />;
  return <Empty text={none} />;
}

export function RepoPanels({
  stats, repoUrl, aside, liveCommit, versionsTop, noVersions = 'No releases or tags yet.', onIssues,
}: {
  stats: Stats | null;
  repoUrl: string;
  /** Next to the weekly chart (e.g. samples per pack on the Website tab). */
  aside?: ReactNode;
  /** Marks the commit the live site was built from. */
  liveCommit?: string;
  /** Shown above this repository's own versions (e.g. DATABEND). */
  versionsTop?: ReactNode;
  noVersions?: string;
  /** Opens the Issues tab for this repository. */
  onIssues?: () => void;
}) {
  const branch = stats?.repo.ok ? stats.repo.branch : 'main';
  const chart = (
    <Panel title={`Pushes to ${branch} · last 12 weeks${stats?.commits.ok ? ` · ${stats.commits.total}` : ''}`}>
      {!stats ? <Empty text="Loading…" /> : stats.commits.ok ? <ActivityChart weeks={stats.commits.weeks} /> : <Problem text={errorOf(stats.commits)} />}
    </Panel>
  );

  return (
    <div className="space-y-4">
      {aside ? <div className="grid lg:grid-cols-[3fr_2fr] gap-4">{chart}{aside}</div> : chart}

      <Panel title="Recent pushes" action={<ExtLink href={`${repoUrl}/commits`} className="font-mono text-[11px] text-zinc-400">All commits</ExtLink>}>
        {!stats ? <Empty text="Loading…" /> : !stats.commits.ok ? <Problem text={errorOf(stats.commits)} /> : !stats.commits.recent.length ? <Empty text="No pushes in the last 12 weeks." /> : (
          <ul className="divide-y divide-zinc-900">
            {stats.commits.recent.map(c => (
              <li key={c.sha} className="flex items-baseline gap-3 py-2 text-sm">
                <GitCommitHorizontal className="w-4 h-4 text-zinc-500 shrink-0 translate-y-0.5" aria-hidden />
                <ExtLink href={c.url} className="font-mono text-xs text-zinc-400 shrink-0">{c.sha.slice(0, 7)}</ExtLink>
                <span className="text-zinc-200 truncate">{c.message}</span>
                {c.fromDashboard && <span className="font-mono text-[10px] uppercase text-brand-orange border border-brand-orange/40 px-1 shrink-0">dev</span>}
                {liveCommit && c.sha === liveCommit && <span className="font-mono text-[10px] uppercase text-emerald-400 border border-emerald-400/40 px-1 shrink-0">live</span>}
                <span className="ml-auto text-xs text-zinc-500 shrink-0">{ago(c.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Issues" action={
          onIssues
            ? <button type="button" onClick={onIssues} className="font-mono text-[11px] text-zinc-400 hover:text-brand-orange">Open in Issues tab</button>
            : <ExtLink href={`${repoUrl}/issues`} className="font-mono text-[11px] text-zinc-400">On GitHub</ExtLink>
        }>
          {!stats ? <Empty text="Loading…" /> : !stats.issues.ok ? <Problem text={errorOf(stats.issues)} /> : !stats.issues.items.length ? <Empty text="No issues." /> : (
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
        <Panel title="Pull requests" action={<ExtLink href={`${repoUrl}/pulls`} className="font-mono text-[11px] text-zinc-400">On GitHub</ExtLink>}>
          {!stats ? <Empty text="Loading…" /> : !stats.pulls.ok ? <Problem text={errorOf(stats.pulls)} /> : !stats.pulls.items.length ? <Empty text="No pull requests." /> : (
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
        <Panel title="Versions" action={<ExtLink href={`${repoUrl}/releases`} className="font-mono text-[11px] text-zinc-400">Releases</ExtLink>}>
          {versionsTop}
          {!stats ? <Empty text="Loading…" /> : <OwnVersions stats={stats} none={noVersions} />}
        </Panel>
        <Panel title="GitHub Actions" action={<ExtLink href={`${repoUrl}/actions`} className="font-mono text-[11px] text-zinc-400">On GitHub</ExtLink>}>
          {!stats ? <Empty text="Loading…" /> : !stats.runs.ok ? <Problem text={errorOf(stats.runs)} /> : !stats.runs.items.length ? <Empty text="No runs yet." /> : (
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
          {stats.repo.name}: {stats.repo.private ? 'private' : 'public'} · {(stats.repo.sizeKb / 1024).toFixed(0)} MB · last push {ago(stats.repo.pushedAt)}
        </p>
      )}
    </div>
  );
}
