/**
 * The /dev Ship tab: promo checklists for everything you ship, your releases with download counts, and a changelog
 * draft for the next release.
 *
 * Promo: every public ship from worker/momentum.ts (sketch, samples, post, release) since `promo_since` gets a
 * checklist of your channels automatically, keyed by its URL. Only the ticks are stored (D1 `promo_ticks`); a tick
 * counts toward the streak. "skip" marks something that needs no promo.
 */
import { dbReady, ideasDb, type IdeasEnv } from './ideas';
import type { MomentumEvent } from './momentum';

type GraphQL = <T>(query: string, variables: object) => Promise<T>;

export const DEFAULT_CHANNELS = ['Instagram', 'YouTube', 'Newsletter', 'Bandcamp'];
const PUBLIC = new Set(['sketch', 'samples', 'post', 'release']);
export const SKIP = 'skip';

export class ShipError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function db(env: IdeasEnv) {
  const d = ideasDb(env);
  await dbReady();
  return d;
}

async function getSetting(d: D1Database, key: string): Promise<string | null> {
  return (await d.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>())?.value ?? null;
}
const setSetting = (d: D1Database, key: string, value: string) =>
  d.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value').bind(key, value).run();

export interface PromoItem {
  ref: string; kind: string; label: string; url: string; t: number;
  ticks: Record<string, number>; skipped: boolean; done: boolean;
}

/**
 * Channels, start date and the checklist for each ship since then. The start date is set the first time this runs
 * (a week back), so old ships don't flood the list.
 */
export async function promoQueue(env: IdeasEnv, events: MomentumEvent[]) {
  const d = await db(env);
  let since = Number(await getSetting(d, 'promo_since'));
  if (!since) {
    since = Date.now() - 7 * 86_400_000;
    await setSetting(d, 'promo_since', String(since));
  }
  const channels = JSON.parse((await getSetting(d, 'promo_channels')) ?? 'null') as string[] | null ?? DEFAULT_CHANNELS;
  const ticks = (await d.prepare('SELECT ref, channel, t FROM promo_ticks').all<{ ref: string; channel: string; t: number }>()).results;
  const byRef = new Map<string, Record<string, number>>();
  for (const x of ticks) byRef.set(x.ref, { ...(byRef.get(x.ref) ?? {}), [x.channel]: x.t });

  const items: PromoItem[] = events
    .filter(e => PUBLIC.has(e.kind) && e.url && e.t >= since)
    .map(e => {
      const t = byRef.get(e.url!) ?? {};
      const skipped = SKIP in t;
      return {
        ref: e.url!, kind: e.kind, label: e.label, url: e.url!, t: e.t, ticks: t, skipped,
        done: skipped || channels.every(c => c in t),
      };
    })
    .sort((a, b) => b.t - a.t);
  return { channels, since, items };
}

/** Promo ticks as momentum events, so they count toward the streak. */
export async function promoEvents(env: IdeasEnv, since: number): Promise<MomentumEvent[]> {
  const d = await db(env);
  const rows = (await d.prepare('SELECT channel, label, t FROM promo_ticks WHERE t >= ? AND channel != ?').bind(since, SKIP).all<{ channel: string; label: string; t: number }>()).results;
  return rows.map(r => ({ t: r.t, kind: 'promo' as const, label: `${r.channel}: ${r.label}`.slice(0, 80) }));
}

export async function tickPromo(env: IdeasEnv, input: Record<string, unknown>) {
  const d = await db(env);
  const ref = String(input.ref ?? '');
  const channel = String(input.channel ?? '').trim().slice(0, 40);
  if (!/^https:\/\//.test(ref) || ref.length > 500 || !channel) throw new ShipError(400, 'Bad promo item');
  if (input.done) {
    await d.prepare('INSERT OR REPLACE INTO promo_ticks (ref, channel, label, t) VALUES (?, ?, ?, ?)')
      .bind(ref, channel, String(input.label ?? '').slice(0, 200), Date.now()).run();
  } else {
    await d.prepare('DELETE FROM promo_ticks WHERE ref = ? AND channel = ?').bind(ref, channel).run();
  }
  return { ok: true };
}

export async function setChannels(env: IdeasEnv, input: unknown) {
  const d = await db(env);
  const list = Array.isArray(input) ? [...new Set(input.map(c => String(c).trim().slice(0, 40)).filter(c => c && c !== SKIP))].slice(0, 12) : [];
  if (!list.length) throw new ShipError(400, 'Keep at least one channel');
  await setSetting(d, 'promo_channels', JSON.stringify(list));
  return { channels: list };
}

// ---------- Releases ----------

interface Asset { name: string; downloadCount: number }
interface Release { name: string | null; tagName: string; publishedAt: string | null; url: string; isDraft: boolean; isPrerelease: boolean; releaseAssets: { nodes: Asset[] } }

/** Repositories with releases: the last 5 releases each, with download counts per file. */
export async function releases(graphql: GraphQL, owner: string) {
  const d = await graphql<{ repositoryOwner: { repositories: { nodes: Array<{ name: string; url: string; isArchived: boolean; releases: { totalCount: number; nodes: Release[] } }> } } | null }>(
    `query ($owner: String!) {
      repositoryOwner(login: $owner) {
        repositories(first: 100, orderBy: { field: PUSHED_AT, direction: DESC }) {
          nodes {
            name url isArchived
            releases(first: 5, orderBy: { field: CREATED_AT, direction: DESC }) {
              totalCount
              nodes { name tagName publishedAt url isDraft isPrerelease releaseAssets(first: 30) { nodes { name downloadCount } } }
            }
          }
        }
      }
    }`,
    { owner },
  );
  const repos = (d.repositoryOwner?.repositories.nodes ?? [])
    .filter(r => r.releases.totalCount > 0 && !r.isArchived)
    .map(r => {
      const list = r.releases.nodes.filter(x => !x.isDraft && x.publishedAt).map(x => ({
        name: x.name || x.tagName, tag: x.tagName, published: x.publishedAt!, url: x.url, prerelease: x.isPrerelease,
        assets: x.releaseAssets.nodes.map(a => ({ name: a.name, downloads: a.downloadCount })),
        downloads: x.releaseAssets.nodes.reduce((n, a) => n + a.downloadCount, 0),
      }));
      return { repo: r.name, url: r.url, total: r.releases.totalCount, releases: list };
    })
    .filter(r => r.releases.length)
    .sort((a, b) => Date.parse(b.releases[0].published) - Date.parse(a.releases[0].published));
  return { repos };
}

/** Issues closed as done and pull requests merged in one repository since a date, as a changelog draft. */
export async function releaseNotes(graphql: GraphQL, fullName: string, since: string | null) {
  const from = since && !Number.isNaN(Date.parse(since)) ? new Date(since).toISOString().replace(/\.\d+Z$/, 'Z') : '2000-01-01T00:00:00Z';
  type Item = { number?: number; title?: string; url?: string };
  const d = await graphql<{ issues: { nodes: Item[] }; prs: { nodes: Item[] } }>(
    `query ($issues: String!, $prs: String!) {
      issues: search(query: $issues, type: ISSUE, first: 100) { nodes { ... on Issue { number title url } } }
      prs: search(query: $prs, type: ISSUE, first: 100) { nodes { ... on PullRequest { number title url } } }
    }`,
    { issues: `repo:${fullName} is:issue is:closed reason:completed closed:>${from}`, prs: `repo:${fullName} is:pr is:merged merged:>${from}` },
  );
  const issues = d.issues.nodes.filter(i => i.number);
  const prs = d.prs.nodes.filter(i => i.number);
  const line = (i: Item) => `- ${i.title} (#${i.number})`;
  const markdown = [
    ...(issues.length ? ['## Done', ...issues.map(line), ''] : []),
    ...(prs.length ? ['## Changes', ...prs.map(line), ''] : []),
  ].join('\n').trim();
  return { since: from, issues, prs, markdown };
}
