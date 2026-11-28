/**
 * Momentum for the /dev Launchpad: everything you shipped in the last year, as dated events, plus what's going stale.
 *
 * What counts (decided with the owner): anything public (sketches, samples and archive posts added to the website,
 * releases in any repository), issues closed as done, ideas captured, and promo ticked off (worker/ship.ts).
 * GitHub parts come from one GraphQL query with the projects token; ideas from the D1 inbox (worker/ideas.ts).
 * The browser buckets events into days in its own time zone, so streaks follow your local midnight.
 */
import type { IdeasEnv } from './ideas';
import { dbReady, ideasDb } from './ideas';
import { promoEvents, promoQueue } from './ship';

export type MomentumKind = 'idea' | 'sketch' | 'samples' | 'post' | 'release' | 'issue' | 'promo';
export interface MomentumEvent { t: number; kind: MomentumKind; label: string; url?: string }
export interface StaleIssue { repo: string; number: number; title: string; url: string; updated: string }

type GraphQL = <T>(query: string, variables: object) => Promise<T>;

const YEAR = 371 * 86_400_000; // 53 weeks, what the heatmap shows
const STALE_DAYS = 21;

interface Commit { committedDate: string; messageHeadline: string; url: string }
interface Data {
  site: { object: { sketches: { nodes: Commit[] }; samples: { nodes: Commit[] }; posts: { nodes: Commit[] } } | null } | null;
  owner: { repositories: { nodes: Array<{ name: string; releases: { nodes: Array<{ name: string | null; tagName: string; publishedAt: string | null; url: string; isDraft: boolean }> } }> } } | null;
  closed: { nodes: Array<{ title?: string; number?: number; url?: string; closedAt?: string; repository?: { name: string } }> };
  stale: { issueCount: number; nodes: Array<{ title?: string; number?: number; url?: string; updatedAt?: string; repository?: { name: string } }> };
}

const QUERY = `query ($owner: String!, $site: String!, $since: GitTimestamp!, $closedQ: String!, $staleQ: String!) {
  site: repository(owner: $owner, name: $site) {
    object(expression: "main") {
      ... on Commit {
        sketches: history(first: 100, since: $since, path: "src/data/sketches.json") { nodes { committedDate messageHeadline url } }
        samples: history(first: 100, since: $since, path: "src/data/samples.ts") { nodes { committedDate messageHeadline url } }
        posts: history(first: 100, since: $since, path: "src/posts") { nodes { committedDate messageHeadline url } }
      }
    }
  }
  owner: repositoryOwner(login: $owner) {
    repositories(first: 100, orderBy: { field: PUSHED_AT, direction: DESC }) {
      nodes { name releases(first: 20, orderBy: { field: CREATED_AT, direction: DESC }) { nodes { name tagName publishedAt url isDraft } } }
    }
  }
  closed: search(query: $closedQ, type: ISSUE, first: 100) {
    nodes { ... on Issue { title number url closedAt repository { name } } }
  }
  stale: search(query: $staleQ, type: ISSUE, first: 5) {
    issueCount
    nodes { ... on Issue { title number url updatedAt repository { name } } }
  }
}`;

/** Commits that add things count; removals, edits and fixes don't. */
const isAdd = (message: string) => !/\b(remove|removed|delete|deleted|edit|edited|fix|fixes|rename|revert)\b/i.test(message);

/** "Sketches: add "Foo"" → "Foo"; anything else stays as it is. */
const what = (message: string) => /"(.+)"/.exec(message)?.[1] ?? message.replace(/^[^:]{1,30}:\s*/, '');

export async function momentum(env: IdeasEnv, graphql: GraphQL | null, owner: string, site: string) {
  const now = Date.now();
  const since = now - YEAR;
  const events: MomentumEvent[] = [];
  const errors: string[] = [];
  let stale: StaleIssue[] = [];
  let staleCount = 0;

  try {
    const db = ideasDb(env);
    await dbReady();
    const rows = (await db.prepare('SELECT created, text FROM ideas WHERE created >= ? ORDER BY created').bind(since).all<{ created: number; text: string }>()).results;
    for (const r of rows) events.push({ t: r.created, kind: 'idea', label: r.text.split('\n')[0].slice(0, 80) || 'Idea with files' });
    events.push(...(await promoEvents(env, since)));
  } catch (err) {
    errors.push(`Ideas: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (graphql) {
    try {
      const day = (t: number) => new Date(t).toISOString().slice(0, 10);
      const d = await graphql<Data>(QUERY, {
        owner, site, since: new Date(since).toISOString(),
        closedQ: `user:${owner} is:issue is:closed reason:completed closed:>=${day(since)}`,
        staleQ: `user:${owner} is:issue is:open archived:false updated:<${day(now - STALE_DAYS * 86_400_000)} sort:updated-asc`,
      });
      const c = d.site?.object;
      const content: Array<[MomentumKind, Commit[] | undefined]> = [['sketch', c?.sketches.nodes], ['samples', c?.samples.nodes], ['post', c?.posts.nodes]];
      for (const [kind, commits] of content) {
        for (const x of commits ?? []) {
          if (isAdd(x.messageHeadline)) events.push({ t: Date.parse(x.committedDate), kind, label: what(x.messageHeadline).slice(0, 80), url: x.url });
        }
      }
      for (const repo of d.owner?.repositories.nodes ?? []) {
        for (const r of repo.releases.nodes) {
          if (r.isDraft || !r.publishedAt || Date.parse(r.publishedAt) < since) continue;
          events.push({ t: Date.parse(r.publishedAt), kind: 'release', label: `${repo.name} ${r.name || r.tagName}`.slice(0, 80), url: r.url });
        }
      }
      for (const i of d.closed.nodes) {
        if (!i.closedAt || !i.repository) continue;
        events.push({ t: Date.parse(i.closedAt), kind: 'issue', label: `${i.repository.name}#${i.number} ${i.title}`.slice(0, 80), url: i.url });
      }
      staleCount = d.stale.issueCount;
      stale = d.stale.nodes.filter(i => i.repository && i.url).map(i => ({
        repo: i.repository!.name, number: i.number!, title: i.title ?? '', url: i.url!, updated: i.updatedAt ?? '',
      }));
    } catch (err) {
      errors.push(`GitHub: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    errors.push('GitHub: no token set, so only ideas count here (see docs/HOSTING.md).');
  }

  events.sort((a, b) => a.t - b.t);
  let promo: Awaited<ReturnType<typeof promoQueue>> | null = null;
  try {
    promo = await promoQueue(env, events);
  } catch (err) {
    errors.push(`Promo: ${err instanceof Error ? err.message : String(err)}`);
  }
  return { events, stale, staleCount, staleDays: STALE_DAYS, promo, errors };
}
