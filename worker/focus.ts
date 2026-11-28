/**
 * Working the issue pile down: size and priority labels in every repository, a "today" pick of 1–3 issues, stale
 * issues to close in a batch, and the weekly review Claude writes (kept in D1, shown on the Launchpad).
 *
 * Labels (decided with the owner): the same set everywhere, created with colours the first time they're used.
 * GitHub would create them on its own when an issue gets them, but grey and without a description.
 */
import type { Rest } from './issues';
import { listAllIssues } from './issues';
import { dbReady, ideasDb, type IdeasEnv } from './ideas';

export const SIZES = ['size:small', 'size:medium', 'size:big'] as const;
export const PRIORITIES = ['now', 'later'] as const;
export type Size = 'small' | 'medium' | 'big';
export type Priority = 'now' | 'later';

const LABELS: Record<string, { color: string; description: string }> = {
  'size:small': { color: '0e8a16', description: 'An hour or two' },
  'size:medium': { color: 'fbca04', description: 'About a day' },
  'size:big': { color: 'd93f0b', description: 'Several days or more' },
  now: { color: 'b60205', description: 'Do this soon' },
  later: { color: 'c5def5', description: 'Not soon; keep it around' },
};

export class FocusError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Creates the size/priority labels among `names` that the repository doesn't have yet. Others are left alone. */
export async function ensureLabels(rest: Rest, repo: string, names: string[]) {
  const wanted = [...new Set(names)].filter(n => n in LABELS);
  if (!wanted.length) return;
  const existing = new Set((await rest<Array<{ name: string }>>('GET', `/repos/${repo}/labels?per_page=100`)).map(l => l.name.toLowerCase()));
  for (const name of wanted) {
    if (existing.has(name)) continue;
    try {
      await rest('POST', `/repos/${repo}/labels`, { name, ...LABELS[name] });
    } catch {
      // Made in the meantime (422), or no permission: GitHub still adds it, grey, when the issue gets it.
    }
  }
}

/** Sets an issue's size and/or priority, keeping its other labels. `null` removes that kind. */
export async function setFocusLabels(rest: Rest, repo: string, number: number, change: { size?: Size | null; priority?: Priority | null }) {
  if (change.size !== undefined && change.size !== null && !['small', 'medium', 'big'].includes(change.size)) throw new FocusError(400, 'Size is small, medium or big');
  if (change.priority !== undefined && change.priority !== null && !['now', 'later'].includes(change.priority)) throw new FocusError(400, 'Priority is now or later');
  if (!Number.isInteger(number) || number < 1) throw new FocusError(400, 'Bad issue number');
  const current = await rest<{ labels: Array<{ name: string } | string> }>('GET', `/repos/${repo}/issues/${number}`);
  let names = current.labels.map(l => (typeof l === 'string' ? l : l.name));
  if (change.size !== undefined) names = [...names.filter(n => !n.startsWith('size:')), ...(change.size ? [`size:${change.size}`] : [])];
  if (change.priority !== undefined) names = [...names.filter(n => n !== 'now' && n !== 'later'), ...(change.priority ? [change.priority] : [])];
  await ensureLabels(rest, repo, names);
  const r = await rest<{ labels: Array<{ name: string }> }>('PATCH', `/repos/${repo}/issues/${number}`, { labels: names });
  return { repo: repo.split('/')[1], number, labels: r.labels.map(l => l.name) };
}

/** Size and priority as labels for a new issue. */
export const focusLabels = (size?: Size | null, priority?: Priority | null) =>
  [...(size ? [`size:${size}`] : []), ...(priority ? [priority] : [])];

// ---------- Today ----------

const DAY = 86_400_000;

type Open = Awaited<ReturnType<typeof listAllIssues>>['issues'][number];

/**
 * Ranks open issues for today: "now" first, then small ones, then the ones waiting longest. "later" issues are
 * left out. At most one per repository while there are enough repositories, so the pick isn't one project's backlog.
 */
export function rankToday(issues: Open[], count = 3, exclude: string[] = []) {
  const skip = new Set(exclude);
  const scored = issues
    .filter(i => !skip.has(`${i.repo}#${i.number}`))
    .map(i => {
      const names = i.labels.map(l => l.name);
      if (names.includes('later')) return null;
      const size = names.find(n => n.startsWith('size:'))?.slice(5) as Size | undefined;
      const now = names.includes('now');
      const waited = Math.floor((Date.now() - Date.parse(i.updated)) / DAY);
      const score = (now ? 4 : 0) + (size === 'small' ? 3 : size === 'medium' ? 1 : size === 'big' ? -2 : 0) + Math.min(waited / 14, 3);
      const why = [now && 'marked now', size && `${size}`, waited >= 14 && `untouched ${waited} days`].filter(Boolean).join(' · ') || 'next in line';
      return { issue: i, size: size ?? null, now, waited, score, why };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.score - a.score);
  const pick: typeof scored = [];
  const repos = new Set<string>();
  for (const x of scored) {
    if (pick.length >= count) break;
    if (repos.has(x.issue.repo)) continue;
    pick.push(x);
    repos.add(x.issue.repo);
  }
  for (const x of scored) if (pick.length < count && !pick.includes(x)) pick.push(x);
  return pick.map(x => ({
    repo: x.issue.repo, number: x.issue.number, title: x.issue.title, url: x.issue.url,
    size: x.size, now: x.now, waitedDays: x.waited, why: x.why,
  }));
}

export async function todayPick(rest: Rest, owner: string, count = 3, exclude: string[] = []) {
  const q = encodeURIComponent(`user:${owner} is:issue is:open archived:false -label:later`);
  const r = await rest<{ items: Parameters<typeof listAllIssuesShape>[0][]; total_count: number }>('GET', `/search/issues?q=${q}&sort=updated&order=asc&per_page=100`);
  const issues = r.items.map(listAllIssuesShape);
  return { pick: rankToday(issues, Math.max(1, Math.min(3, count)), exclude), open: r.total_count };
}

/** The same shape listAllIssues returns, from a search hit. */
function listAllIssuesShape(i: {
  number: number; title: string; html_url: string; updated_at: string; created_at: string; repository_url: string;
  labels: Array<{ name: string; color: string } | string>;
}): Open {
  return {
    repo: i.repository_url.split('/').pop() ?? '', number: i.number, title: i.title, body: '', state: 'open', stateReason: null,
    url: i.html_url, created: i.created_at, updated: i.updated_at, closed: null, comments: 0, author: '',
    labels: i.labels.map(l => (typeof l === 'string' ? { name: l, color: '888888' } : { name: l.name, color: l.color })),
  };
}

// ---------- Stale ----------

/** Open issues untouched for `days` or more, oldest first (up to 100). */
export async function staleIssues(rest: Rest, owner: string, days = 60) {
  const before = new Date(Date.now() - Math.max(7, days) * DAY).toISOString().slice(0, 10);
  const q = encodeURIComponent(`user:${owner} is:issue is:open archived:false updated:<${before}`);
  const r = await rest<{ items: Parameters<typeof listAllIssuesShape>[0][]; total_count: number }>('GET', `/search/issues?q=${q}&sort=updated&order=asc&per_page=100`);
  return {
    total: r.total_count, untouchedSince: before,
    issues: r.items.map(listAllIssuesShape).map(i => ({
      repo: i.repo, number: i.number, title: i.title, url: i.url, updated: i.updated,
      waitedDays: Math.floor((Date.now() - Date.parse(i.updated)) / DAY), labels: i.labels.map(l => l.name),
    })),
  };
}

/** Closes issues one by one (with an optional comment first); one failure doesn't stop the rest. */
export async function closeIssues(
  rest: Rest, owner: string, items: Array<{ repo: string; number: number }>, reason: 'not_planned' | 'completed', comment?: string,
) {
  const results: Array<{ repo: string; number: number; ok: boolean; error?: string }> = [];
  for (const it of items.slice(0, 100)) {
    const repo = `${owner}/${it.repo}`;
    try {
      if (comment?.trim()) await rest('POST', `/repos/${repo}/issues/${it.number}/comments`, { body: comment.trim().slice(0, 5000) });
      await rest('PATCH', `/repos/${repo}/issues/${it.number}`, { state: 'closed', state_reason: reason });
      results.push({ repo: it.repo, number: it.number, ok: true });
    } catch (err) {
      results.push({ repo: it.repo, number: it.number, ok: false, error: (err instanceof Error ? err.message : String(err)).slice(0, 200) });
    }
  }
  return { closed: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok).length, results };
}

// ---------- Weekly review ----------

async function db(env: IdeasEnv) {
  const d = ideasDb(env);
  await dbReady();
  return d;
}

export async function saveReview(env: IdeasEnv, markdown: unknown) {
  const text = typeof markdown === 'string' ? markdown.trim() : '';
  if (!text) throw new FocusError(400, 'The review is empty');
  if (text.length > 20_000) throw new FocusError(400, 'The review is longer than 20,000 characters');
  const d = await db(env);
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const created = Date.now();
  await d.prepare('INSERT INTO reviews (id, created, markdown) VALUES (?, ?, ?)').bind(id, created, text).run();
  // Keep a year of them.
  await d.prepare('DELETE FROM reviews WHERE created < ?').bind(created - 366 * DAY).run();
  return { id, created };
}

export async function latestReview(env: IdeasEnv) {
  const d = await db(env);
  return (await d.prepare('SELECT id, created, markdown FROM reviews ORDER BY created DESC LIMIT 1').first<{ id: string; created: number; markdown: string }>()) ?? null;
}
