/**
 * GitHub issues for the /dev dashboard's Issues tab: list, read with comments, create, edit, close/reopen, comment.
 * Works on any repository of the owner (the owner of GITHUB_REPO), one at a time or all together. Writing needs
 * the token to have "Issues: Read and write" on that repository; without it GitHub answers 403 and the tab says so.
 */

/** Sends one GitHub REST call (path from the API root) and returns the JSON, or throws a readable error. */
export type Rest = <T>(method: string, path: string, body?: object) => Promise<T>;

export class IssueError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** A repository name from the browser, always under the owner: the dashboard never reaches other people's repos. */
export function ownRepo(name: unknown, owner: string): string {
  if (typeof name !== 'string' || !/^[A-Za-z0-9._-]{1,100}$/.test(name) || name === '.' || name === '..') {
    throw new IssueError(400, 'Unknown repository');
  }
  return `${owner}/${name}`;
}

interface GhLabel { name: string; color: string; description: string | null }
interface GhIssue {
  number: number; title: string; body: string | null; state: 'open' | 'closed'; state_reason: string | null;
  html_url: string; created_at: string; updated_at: string; closed_at: string | null; comments: number;
  user: { login: string } | null; labels: Array<GhLabel | string>; pull_request?: unknown; repository_url?: string;
}
interface GhComment { id: number; body: string; html_url: string; created_at: string; user: { login: string } | null }

const label = (l: GhLabel | string) => (typeof l === 'string' ? { name: l, color: '888888' } : { name: l.name, color: l.color });

/** `repo` is the short name (e.g. "data-bend"); search results carry it in repository_url. */
const issue = (i: GhIssue, repo?: string) => ({
  repo: repo ?? i.repository_url?.split('/').pop() ?? '',
  number: i.number,
  title: i.title,
  body: i.body ?? '',
  state: i.state,
  stateReason: i.state_reason,
  url: i.html_url,
  created: i.created_at,
  updated: i.updated_at,
  closed: i.closed_at,
  comments: i.comments,
  author: i.user?.login ?? 'ghost',
  labels: i.labels.map(label),
});

function text(v: unknown, field: string, max: number, required = false): string {
  if (v === undefined || v === null) v = '';
  if (typeof v !== 'string') throw new IssueError(400, `${field} must be text`);
  const s = v.trim();
  if (required && !s) throw new IssueError(400, `${field} is empty`);
  if (s.length > max) throw new IssueError(400, `${field} is longer than ${max} characters`);
  return s;
}

function number(v: unknown): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new IssueError(400, 'Bad issue number');
  return n;
}

function labels(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.map(l => String(l).trim()).filter(Boolean).map(l => l.slice(0, 50)))].slice(0, 20);
}

const short = (fullName: string) => fullName.split('/')[1];

export async function listIssues(rest: Rest, repo: string, state: unknown) {
  const s = state === 'closed' || state === 'all' ? state : 'open';
  const [items, repoLabels] = await Promise.all([
    rest<GhIssue[]>('GET', `/repos/${repo}/issues?state=${s}&per_page=100&sort=updated&direction=desc`),
    rest<GhLabel[]>('GET', `/repos/${repo}/labels?per_page=100`),
  ]);
  return {
    // The issues endpoint also returns pull requests; those are in the Projects tab.
    issues: items.filter(i => !i.pull_request).map(i => issue(i, short(repo))),
    labels: repoLabels.map(label),
  };
}

/** Issues across every repository of the owner the token can read (GitHub search, newest activity first). */
export async function listAllIssues(rest: Rest, owner: string, state: unknown) {
  const filter = state === 'closed' ? ' state:closed' : state === 'all' ? '' : ' state:open';
  const q = encodeURIComponent(`user:${owner} is:issue${filter}`);
  const r = await rest<{ items: GhIssue[]; total_count: number }>('GET', `/search/issues?q=${q}&sort=updated&order=desc&per_page=100`);
  return { issues: r.items.map(i => issue(i)), total: r.total_count, labels: [] };
}

export async function readIssue(rest: Rest, repo: string, n: unknown) {
  const num = number(n);
  const [i, comments, repoLabels] = await Promise.all([
    rest<GhIssue>('GET', `/repos/${repo}/issues/${num}`),
    rest<GhComment[]>('GET', `/repos/${repo}/issues/${num}/comments?per_page=100`),
    rest<GhLabel[]>('GET', `/repos/${repo}/labels?per_page=100`),
  ]);
  return {
    issue: issue(i, short(repo)),
    labels: repoLabels.map(label),
    comments: comments.map(c => ({ id: c.id, body: c.body, url: c.html_url, created: c.created_at, author: c.user?.login ?? 'ghost' })),
  };
}

/** Creates an issue (no number) or edits one. `state` closes or reopens it. */
export async function saveIssue(rest: Rest, repo: string, input: Record<string, unknown>) {
  const body: Record<string, unknown> = {};
  if ('title' in input) body.title = text(input.title, 'Title', 256, true);
  if ('body' in input) body.body = text(input.body, 'Text', 60_000);
  if ('labels' in input) body.labels = labels(input.labels);
  if (input.number === undefined || input.number === null) {
    if (!body.title) throw new IssueError(400, 'Title is empty');
    return { issue: issue(await rest<GhIssue>('POST', `/repos/${repo}/issues`, body), short(repo)) };
  }
  if (input.state === 'open') {
    body.state = 'open';
  } else if (input.state === 'closed') {
    body.state = 'closed';
    body.state_reason = input.reason === 'not_planned' ? 'not_planned' : 'completed';
  }
  return { issue: issue(await rest<GhIssue>('PATCH', `/repos/${repo}/issues/${number(input.number)}`, body), short(repo)) };
}

export async function commentIssue(rest: Rest, repo: string, input: Record<string, unknown>) {
  const c = await rest<GhComment>('POST', `/repos/${repo}/issues/${number(input.number)}/comments`, {
    body: text(input.body, 'Comment', 60_000, true),
  });
  return { comment: { id: c.id, body: c.body, url: c.html_url, created: c.created_at, author: c.user?.login ?? 'ghost' } };
}
