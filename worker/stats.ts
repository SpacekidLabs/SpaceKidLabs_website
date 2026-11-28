/**
 * GitHub data for the /dev dashboard's Overview tab: recent pushes, weekly activity, issues, pull requests,
 * Actions runs, and releases (this site and DATABEND). Each section is fetched on its own, so a section the
 * token can't read shows a short message instead of breaking the page. Only public-facing fields are passed
 * on (titles, dates, links, counts); nothing from the request side.
 */

type Get = <T>(path: string) => Promise<{ status: number; data: T | null }>;

/** DATABEND's own repository (scripts/fetch-databend-release.ts reads it too). */
export const DATABEND_REPO = 'SpacekidLabs/data-bend';
const WEEKS = 12;

type Section<T> = ({ ok: true } & T) | { ok: false; error: string };

function failure(status: number, what: string, fix: string): { ok: false; error: string } {
  if (status === 403 || status === 404) return { ok: false, error: `The token can't read ${what}. ${fix}` };
  if (status === 401) return { ok: false, error: 'GitHub rejected the token (401). Replace GITHUB_TOKEN in Cloudflare.' };
  return { ok: false, error: `GitHub answered ${status} for ${what}.` };
}

interface GhCommit { sha: string; html_url: string; commit: { message: string; author: { name: string; date: string } } }
interface GhIssue { number: number; state: string; title: string; html_url: string; created_at: string; updated_at: string; user: { login: string } | null; labels: Array<{ name: string } | string>; pull_request?: unknown; comments: number }
interface GhPull { number: number; title: string; html_url: string; state: string; draft?: boolean; merged_at: string | null; updated_at: string; user: { login: string } | null; head: { ref: string } }
interface GhRelease { tag_name: string; name: string | null; html_url: string; published_at: string | null; draft: boolean; prerelease: boolean; assets: Array<{ name: string; download_count: number; size: number }> }
interface GhTag { name: string; commit: { sha: string } }
interface GhRuns { total_count: number; workflow_runs: Array<{ name: string; html_url: string; status: string; conclusion: string | null; created_at: string; head_sha: string; event: string; display_title: string }> }
interface GhRepo { private: boolean; pushed_at: string; size: number; html_url: string; default_branch: string; open_issues_count: number }

/** Monday 00:00 UTC of the week containing `d`. */
function weekStart(d: Date): number {
  const day = (d.getUTCDay() + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
}

const firstLine = (s: string) => s.split('\n')[0].slice(0, 160);

const releases = (list: GhRelease[]) =>
  list.filter(r => !r.draft).map(r => ({
    tag: r.tag_name,
    name: r.name || r.tag_name,
    url: r.html_url,
    date: r.published_at,
    prerelease: r.prerelease,
    downloads: r.assets.reduce((n, a) => n + a.download_count, 0),
    assets: r.assets.map(a => ({ name: a.name, downloads: a.download_count, size: a.size })),
  }));

export async function githubStats(get: Get, repo: string) {
  const since = new Date(weekStart(new Date()) - (WEEKS - 1) * 7 * 86_400_000).toISOString();
  const r = `/repos/${repo}`;

  const [repoInfo, commitPages, issues, pulls, runs, siteReleases, tags, databend] = await Promise.all([
    get<GhRepo>(r),
    Promise.all([1, 2, 3].map(page => get<GhCommit[]>(`${r}/commits?sha=main&per_page=100&page=${page}&since=${since}`))),
    get<GhIssue[]>(`${r}/issues?state=all&per_page=30&sort=updated`),
    get<GhPull[]>(`${r}/pulls?state=all&per_page=10&sort=updated&direction=desc`),
    get<GhRuns>(`${r}/actions/runs?per_page=6`),
    get<GhRelease[]>(`${r}/releases?per_page=5`),
    get<GhTag[]>(`${r}/tags?per_page=6`),
    get<GhRelease[]>(`/repos/${DATABEND_REPO}/releases?per_page=6`),
  ]);

  // Pushes: commits on main, newest first, and how many per week.
  let commits: Section<{ recent: unknown[]; weeks: Array<{ start: string; count: number }>; total: number }>;
  if (commitPages[0].data) {
    const all = commitPages.flatMap(p => p.data ?? []);
    const counts = new Map<number, number>();
    for (let i = 0; i < WEEKS; i++) counts.set(weekStart(new Date(since)) + i * 7 * 86_400_000, 0);
    for (const c of all) {
      const w = weekStart(new Date(c.commit.author.date));
      if (counts.has(w)) counts.set(w, counts.get(w)! + 1);
    }
    commits = {
      ok: true,
      total: all.length,
      weeks: [...counts].map(([start, count]) => ({ start: new Date(start).toISOString().slice(0, 10), count })),
      recent: all.slice(0, 12).map(c => ({
        sha: c.sha,
        url: c.html_url,
        message: firstLine(c.commit.message),
        author: c.commit.author.name,
        date: c.commit.author.date,
        fromDashboard: c.commit.message.includes('Added from the /dev dashboard'),
      })),
    };
  } else {
    commits = failure(commitPages[0].status, 'commits', 'It needs "Contents: Read".');
  }

  const permissionFix = (name: string) => `On GitHub, edit the token and add "${name}: Read-only".`;

  return {
    repo: repoInfo.data
      ? { ok: true as const, private: repoInfo.data.private, pushedAt: repoInfo.data.pushed_at, sizeKb: repoInfo.data.size, url: repoInfo.data.html_url }
      : failure(repoInfo.status, 'the repository', permissionFix('Metadata')),
    commits,
    issues: issues.data
      ? {
          ok: true as const,
          items: issues.data.filter(i => !i.pull_request).slice(0, 10).map(i => ({
            number: i.number, title: i.title.slice(0, 160), url: i.html_url, updated: i.updated_at,
            author: i.user?.login ?? '', comments: i.comments,
            labels: i.labels.map(l => (typeof l === 'string' ? l : l.name)).slice(0, 4),
            state: i.state,
          })),
        }
      : failure(issues.status, 'issues', permissionFix('Issues')),
    pulls: pulls.data
      ? {
          ok: true as const,
          items: pulls.data.map(p => ({
            number: p.number, title: p.title.slice(0, 160), url: p.html_url, updated: p.updated_at,
            author: p.user?.login ?? '', branch: p.head.ref,
            state: p.merged_at ? 'merged' : p.draft && p.state === 'open' ? 'draft' : p.state,
          })),
        }
      : failure(pulls.status, 'pull requests', permissionFix('Pull requests')),
    runs: runs.data
      ? {
          ok: true as const,
          items: runs.data.workflow_runs.map(w => ({
            name: w.name, title: firstLine(w.display_title), url: w.html_url, status: w.status,
            conclusion: w.conclusion, date: w.created_at, sha: w.head_sha, event: w.event,
          })),
        }
      : failure(runs.status, 'Actions runs', permissionFix('Actions')),
    versions: {
      site: siteReleases.data ? { ok: true as const, releases: releases(siteReleases.data) } : failure(siteReleases.status, 'releases', 'It needs "Contents: Read".'),
      tags: tags.data ? { ok: true as const, items: tags.data.map(t => ({ name: t.name, sha: t.commit.sha })) } : failure(tags.status, 'tags', 'It needs "Contents: Read".'),
      databend: databend.data
        ? { ok: true as const, repo: DATABEND_REPO, releases: releases(databend.data) }
        : failure(databend.status, `${DATABEND_REPO}`, `On GitHub, edit the token and add ${DATABEND_REPO} to its repositories.`),
    },
  };
}
