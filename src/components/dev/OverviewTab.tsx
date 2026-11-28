import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/devApi';
import { PACKS, SAMPLES } from '../../data/samples';
import { POSTS } from '../../posts';
import { DATABEND_RELEASE } from '../../data/databend';
import type { Sketch } from '../../data/sketches';
import { TrafficSection } from './TrafficSection';
import { ago, card, ExtLink, heading, nf, Panel, Problem, ReleaseList, RepoPanels, Stat, type Stats } from './RepoPanels';

/**
 * /dev Website → Overview: what's on the site, whether the live site is up to date, traffic, and the website
 * repository's GitHub activity (RepoPanels). Data from worker/stats.ts and worker/analytics.ts.
 */

const REPO_URL = 'https://github.com/SpacekidLabs/SpaceKidLabs_website';
const DEPLOYS_URL = 'https://dash.cloudflare.com/?to=/:account/workers/services/view/spacekidlabs/production/deployments';

export function OverviewTab({ onIssues }: { onIssues?: () => void }) {
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
  const databendLatest = stats?.versions.databend?.ok ? stats.versions.databend.releases[0] : undefined;
  const databendDownloads = stats?.versions.databend?.ok ? stats.versions.databend.releases.reduce((n, r) => n + r.downloads, 0) : null;

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

      <TrafficSection />

      <h2 className="font-display font-bold text-xl text-white tracking-wide pt-4">GitHub</h2>
      <RepoPanels
        stats={stats}
        repoUrl={REPO_URL}
        liveCommit={__BUILD_COMMIT__}
        onIssues={onIssues}
        noVersions="No releases or tags. The site deploys every push to main; the live version is shown above."
        aside={
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
        }
        versionsTop={stats?.versions.databend && (
          <div className="mb-5">
            <h3 className="text-xs text-zinc-400 mb-2">DATABEND {stats.versions.databend.ok && <span className="font-mono text-zinc-500">({stats.versions.databend.repo})</span>}</h3>
            {stats.versions.databend.ok
              ? <ReleaseList list={stats.versions.databend.releases} empty="No releases yet." />
              : <Problem text={stats.versions.databend.error} />}
            <h3 className="text-xs text-zinc-400 mt-5 mb-2">This site</h3>
          </div>
        )}
      />
    </div>
  );
}
