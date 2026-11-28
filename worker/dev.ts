/**
 * The /dev dashboard's API: POST/GET /api/dev/*. Lets the site owner add sketches, samples and archive posts
 * from any browser. Every change is a commit to `main` on GitHub, which redeploys the site (docs/HOSTING.md).
 *
 * Secrets (set in Cloudflare, never in this repo; locally in .dev.vars, which git ignores):
 *   DEV_PASSWORD  the dashboard password; it also signs the login cookie, so changing it logs everyone out
 *   GITHUB_TOKEN  fine-grained token with Contents: read and write on this repository only (saving content)
 *   GITHUB_PROJECTS_TOKEN  optional, read-mostly token for all your repositories (Projects and Issues tabs):
 *                 Issues: read and write; Contents, Pull requests, Actions: read. Without it GITHUB_TOKEN is used,
 *                 which only sees this repository and public ones.
 * Var: GITHUB_REPO ("owner/name", in wrangler.jsonc).
 *
 * Neither secret is ever put in a response or a log line.
 */
import {
  addSketch, appendSamples, parseSamples, postFile, readHidden, readPost, rebaseImports, readPacks, removeSamples, removeSketch, setHidden,
  setSketchHidden, slugify, updatePost, updateSamples, updateSketch,
  type SketchEntry,
  type PostInfo, type PostInput, type PostMetaPatch, type SampleChange, type SampleInput, type SketchInput,
} from './content';
import { githubStats, projects } from './stats';
import { cloudflareAnalytics, type AnalyticsEnv } from './analytics';
import { eventCounts } from './events';
import { commentIssue, IssueError, listAllIssues, listIssues, ownRepo, readIssue, saveIssue } from './issues';
import { momentum } from './momentum';
import { ensureLabels, FocusError, latestReview, setFocusLabels, todayPick } from './focus';
import {
  callback as driveCallback, connectUrl, disconnect as driveDisconnect, downloadFile, DriveError, driveStatus, folderIsPublic,
  listFolder, listReleases, queueRelease, removeRelease, siteOrigin, startUpload, type DriveEnv,
} from './drive';
import { deleteMessage, listMessages, markMessage, MessageError } from './messages';
import { releaseNotes, releases, setChannels, ShipError, tickPromo } from './ship';
import { addIdea, deleteIdea, getIdea, IdeaError, ideaFileResponse, listIdeas, mergeIdeas, readIdeaFile, updateIdea, type IdeasEnv } from './ideas';

export interface DevEnv extends AnalyticsEnv, IdeasEnv, DriveEnv {
  DEV_PASSWORD?: string;
  GITHUB_TOKEN?: string;
  GITHUB_PROJECTS_TOKEN?: string;
  GITHUB_REPO?: string;
  /** Only for local tests against a mock; defaults to GitHub's API. */
  GITHUB_API?: string;
}

export const BRANCH = 'main';
const COOKIE = 'dev_session';
const SESSION_DAYS = 30;
const SKETCHES = 'src/data/sketches.json';
const SAMPLES = 'src/data/samples.ts';
/** Packs and samples saved but not shown on /samples yet. */
const HIDDEN = 'src/data/hidden.json';

const json = (status: number, body: object, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// ---------- Login ----------

const enc = new TextEncoder();

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(`dev-session:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
  return [...sig].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Compares two strings without leaking where they differ (both hashed first, so lengths match). */
async function sameString(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([a, b].map(s => crypto.subtle.digest('SHA-256', enc.encode(s))));
  return crypto.subtle.timingSafeEqual(ha, hb);
}

async function isLoggedIn(request: Request, env: DevEnv): Promise<boolean> {
  if (!env.DEV_PASSWORD) return false;
  const cookie = request.headers.get('Cookie') ?? '';
  const value = cookie.split(/;\s*/).find(c => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!value) return false;
  const [expires, sig] = value.split('.');
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  return sameString(sig, await hmac(env.DEV_PASSWORD, expires));
}

async function login(request: Request, env: DevEnv): Promise<Response> {
  if (!env.DEV_PASSWORD) return json(503, { error: 'The dashboard is not set up yet (DEV_PASSWORD secret missing).' });
  const { password } = (await request.json().catch(() => ({}))) as { password?: unknown };
  if (typeof password !== 'string' || !(await sameString(password, env.DEV_PASSWORD))) {
    await new Promise(r => setTimeout(r, 800)); // slows down guessing
    return json(401, { error: 'Wrong password' });
  }
  const expires = String(Date.now() + SESSION_DAYS * 86_400_000);
  const value = `${expires}.${await hmac(env.DEV_PASSWORD, expires)}`;
  return json(200, { ok: true }, {
    'Set-Cookie': `${COOKIE}=${value}; Path=/api/dev; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 86_400}`,
  });
}

const logout = () =>
  json(200, { ok: true }, { 'Set-Cookie': `${COOKIE}=; Path=/api/dev; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });

// ---------- GitHub ----------

function base64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export class GitHub {
  constructor(private env: Required<Pick<DevEnv, 'GITHUB_TOKEN' | 'GITHUB_REPO'>> & Pick<DevEnv, 'GITHUB_API'>) {}

  private async call(path: string, init: RequestInit & { raw?: boolean } = {}): Promise<Response> {
    const { raw, ...rest } = init;
    const res = await fetch(`${this.env.GITHUB_API || 'https://api.github.com'}/repos/${this.env.GITHUB_REPO}${path}`, {
      ...rest,
      headers: {
        Authorization: `Bearer ${this.env.GITHUB_TOKEN}`,
        Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'spacekidlabs-dev-dashboard',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    if (!res.ok && res.status !== 404 && res.status !== 422) {
      // Only the status and GitHub's own message go back; request headers (the token) never do.
      const detail = ((await res.json().catch(() => ({}))) as { message?: string }).message ?? '';
      console.error(`GitHub ${init.method ?? 'GET'} ${path.split('?')[0]}: ${res.status} ${detail}`);
      throw new HttpError(502, `GitHub said ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
    }
    return res;
  }

  /** GET any API path from the root (e.g. /repos/o/r/issues) for the stats. Never throws on HTTP errors. */
  async get<T>(path: string): Promise<{ status: number; data: T | null }> {
    const res = await fetch(`${this.env.GITHUB_API || 'https://api.github.com'}${path}`, {
      headers: {
        Authorization: `Bearer ${this.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'spacekidlabs-dev-dashboard',
      },
    });
    if (!res.ok) return { status: res.status, data: null };
    return { status: res.status, data: (await res.json()) as T };
  }

  /** A REST call for the Issues tab. Throws a readable error on anything but success. */
  async rest<T>(method: string, path: string, body?: object): Promise<T> {
    const res = await fetch(`${this.env.GITHUB_API || 'https://api.github.com'}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'spacekidlabs-dev-dashboard',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) return (await res.json()) as T;
    const detail = ((await res.json().catch(() => ({}))) as { message?: string }).message ?? '';
    console.error(`GitHub ${method} ${path.split('?')[0]}: ${res.status} ${detail}`);
    const repo = path.split('/').slice(2, 4).join('/');
    if (res.status === 401) throw new HttpError(502, 'GitHub rejected the token (401). Replace GITHUB_TOKEN in Cloudflare.');
    if (res.status === 403 && method !== 'GET') {
      throw new HttpError(403, `The token can't change issues in ${repo}. In GitHub, give the token "Issues: Read and write" on that repository (docs/HOSTING.md).`);
    }
    if (res.status === 404) throw new HttpError(404, `Not found on GitHub, or the token can't see ${repo}.`);
    if (res.status === 410) throw new HttpError(410, `Issues are turned off for ${repo}.`);
    throw new HttpError(502, `GitHub said ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
  }

  /** One GraphQL query (e.g. many files in a single request; Workers on the free plan get 50 requests per call). */
  async graphql<T>(query: string, variables: object): Promise<T> {
    const res = await fetch(`${this.env.GITHUB_API || 'https://api.github.com'}/graphql`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'spacekidlabs-dev-dashboard',
      },
      body: JSON.stringify({ query, variables }),
    });
    const body = (await res.json().catch(() => ({}))) as { data?: T; errors?: Array<{ message: string }>; message?: string };
    if (!res.ok || body.errors?.length || !body.data) {
      const detail = body.errors?.[0]?.message ?? body.message ?? '';
      console.error(`GitHub GraphQL: ${res.status} ${detail}`);
      throw new HttpError(502, `GitHub said ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
    }
    return body.data;
  }

  get repo(): string {
    return this.env.GITHUB_REPO;
  }

  async head(): Promise<string> {
    const res = await this.call(`/git/ref/heads/${BRANCH}`);
    return ((await res.json()) as { object: { sha: string } }).object.sha;
  }

  /** File text at a commit, or null if it doesn't exist. */
  async read(path: string, ref: string): Promise<string | null> {
    const res = await this.call(`/contents/${path}?ref=${ref}`, { raw: true });
    if (res.status === 404) return null;
    return res.text();
  }

  /** One commit on top of `parent` with these changes (null content deletes). False if main moved meanwhile. */
  async commit(parent: string, message: string, files: Array<{ path: string; content: string | Uint8Array | null }>): Promise<string | false> {
    const base = (await (await this.call(`/git/commits/${parent}`)).json()) as { tree: { sha: string } };
    const tree = [];
    for (const f of files) {
      if (f.content === null) {
        tree.push({ path: f.path, mode: '100644', type: 'blob', sha: null });
        continue;
      }
      const bytes = typeof f.content === 'string' ? enc.encode(f.content) : f.content;
      const blob = await this.call('/git/blobs', { method: 'POST', body: JSON.stringify({ content: base64(bytes), encoding: 'base64' }) });
      tree.push({ path: f.path, mode: '100644', type: 'blob', sha: ((await blob.json()) as { sha: string }).sha });
    }
    const newTree = await this.call('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: base.tree.sha, tree }) });
    const treeSha = ((await newTree.json()) as { sha: string }).sha;
    const commit = await this.call('/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message: `${message}\n\nAdded from the /dev dashboard.`, tree: treeSha, parents: [parent] }),
    });
    const sha = ((await commit.json()) as { sha: string }).sha;
    const ref = await this.call(`/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: JSON.stringify({ sha, force: false }) });
    return ref.status === 422 ? false : sha;
  }

  /** Reads, changes and commits, retrying if someone else committed in between. */
  async change(
    message: string,
    build: (read: (path: string) => Promise<string | null>) => Promise<Array<{ path: string; content: string | Uint8Array | null }>>,
  ): Promise<string> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const head = await this.head();
      const files = await build(path => this.read(path, head));
      const sha = await this.commit(head, message, files);
      if (sha) return sha;
    }
    throw new HttpError(409, 'The repository changed while saving. Try again.');
  }
}

// ---------- Actions ----------

export async function must(read: (p: string) => Promise<string | null>, path: string): Promise<string> {
  const text = await read(path);
  if (text === null) throw new HttpError(500, `${path} is missing from the repository`);
  return text;
}

/** An MP3 from the form, checked to be an MP3 (the browser encodes everything to MP3 before uploading). */
async function mp3(form: FormData, field: string): Promise<Uint8Array | null> {
  const file = form.get(field);
  if (!file || typeof file === 'string') return null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isMp3(bytes)) throw new HttpError(400, `${field} is not an MP3`);
  return bytes;
}

function isMp3(bytes: Uint8Array): boolean {
  const id3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
  const frame = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
  return id3 || frame;
}

async function saveSketch(request: Request, gh: GitHub) {
  const form = await request.formData();
  const input = JSON.parse(String(form.get('meta') ?? '{}')) as SketchInput;
  return addSketchWithAudio(gh, input, input.kind === 'demo' ? await mp3(form, 'audio') : null);
}

/** Adds a sketch, with its MP3 in the same commit when there is one. `hidden`: saved as a draft, off the site. */
async function addSketchWithAudio(gh: GitHub, input: SketchInput, audio: Uint8Array | null, hidden = false) {
  let id = '';
  const sha = await gh.change(`Sketches: ${hidden ? 'draft' : 'add'} "${String(input.title).slice(0, 60)}"`, async read => {
    const { text, entry } = addSketch(await must(read, SKETCHES), input, audio ? i => `/audio/sketches/${i}.mp3` : undefined, hidden);
    id = entry.id;
    return [{ path: SKETCHES, content: text }, ...(audio ? [{ path: `public${entry.file}`, content: audio }] : [])];
  });
  return { sha, id, hidden };
}

async function deleteSketch(request: Request, gh: GitHub) {
  const { id } = (await request.json()) as { id: string };
  return removeSketchById(gh, String(id));
}

/** Removes a sketch and its uploaded audio in one commit. */
export async function removeSketchById(gh: GitHub, id: string) {
  const sha = await gh.change(`Sketches: remove "${id.slice(0, 60)}"`, async read => {
    const { text, entry } = removeSketch(await must(read, SKETCHES), id);
    const audio = entry.file?.startsWith('/audio/sketches/') ? [{ path: `public${entry.file}`, content: null }] : [];
    return [{ path: SKETCHES, content: text }, ...audio];
  });
  return { sha };
}

/** Adds a sketch without audio (an idea, or a demo placeholder). Used by the MCP connector, which adds drafts. */
export async function addTextSketch(gh: GitHub, input: SketchInput, hidden = false) {
  return addSketchWithAudio(gh, input, null, hidden);
}

/** Edits a sketch. `audio`: "keep" (default), "remove", or a new MP3 in the form (field "audio"). */
async function editSketch(request: Request, gh: GitHub) {
  const form = await request.formData();
  const { id, audio: audioMode, ...input } = JSON.parse(String(form.get('meta') ?? '{}')) as SketchInput & { id: string; audio?: 'keep' | 'remove' };
  const audio = input.kind === 'demo' ? await mp3(form, 'audio') : null;
  return changeSketch(gh, String(id), input, audio ? 'replace' : input.kind === 'idea' || audioMode === 'remove' ? 'remove' : 'keep', audio);
}

/**
 * Changes a sketch's fields, and its audio: keep it, remove it, or replace it. A replacement gets a new file name,
 * because browsers keep /audio/* for a week (public/_headers); the old file is deleted in the same commit.
 */
export async function changeSketch(gh: GitHub, id: string, input: SketchInput, audio: 'keep' | 'remove' | 'replace', bytes?: Uint8Array | null) {
  const file = audio === 'replace' ? `/audio/sketches/${id}-${Date.now().toString(36)}.mp3` : audio === 'remove' ? null : undefined;
  const sha = await gh.change(`Sketches: edit "${String(input.title).slice(0, 60)}"`, async read => {
    const { text, entry, oldFile } = updateSketch(await must(read, SKETCHES), id, input, file);
    const files: Array<{ path: string; content: string | Uint8Array | null }> = [{ path: SKETCHES, content: text }];
    if (audio === 'replace' && bytes) files.push({ path: `public${entry.file}`, content: bytes });
    if (oldFile && oldFile !== entry.file && oldFile.startsWith('/audio/sketches/')) files.push({ path: `public${oldFile}`, content: null });
    return files;
  });
  return { sha, id };
}

// ---------- Archive posts ----------

const POSTS_DIR = 'src/posts';
/** Drafts: saved posts that aren't built into the site (src/posts/index.ts only reads ./*.tsx). */
const DRAFTS_DIR = 'src/posts/drafts';
const isSlug = (s: unknown): s is string => typeof s === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) && s !== 'index' && s !== 'types';
const postPath = (slug: string, draft: boolean) => `${draft ? DRAFTS_DIR : POSTS_DIR}/${slug}.tsx`;

type TreeFiles = { object: { entries: Array<{ name: string; object: { text: string | null } | null }> } | null };

/** Every .tsx file in src/posts and src/posts/drafts, read in one GraphQL query. */
export async function postFiles(gh: GitHub) {
  const [owner, name] = gh.repo.split('/');
  const data = await gh.graphql<{ repository: { live: TreeFiles['object']; drafts: TreeFiles['object'] } }>(
    `query ($owner: String!, $name: String!, $live: String!, $drafts: String!) {
      repository(owner: $owner, name: $name) {
        live: object(expression: $live) { ... on Tree { entries { name object { ... on Blob { text } } } } }
        drafts: object(expression: $drafts) { ... on Tree { entries { name object { ... on Blob { text } } } } }
      }
    }`,
    { owner, name, live: `${BRANCH}:${POSTS_DIR}`, drafts: `${BRANCH}:${DRAFTS_DIR}` },
  );
  const pick = (t: TreeFiles['object'], draft: boolean) =>
    (t?.entries ?? []).filter(e => e.name.endsWith('.tsx') && e.object?.text).map(e => ({ slug: e.name.slice(0, -4), text: e.object!.text!, draft }));
  return [...pick(data.repository.live, false), ...pick(data.repository.drafts, true)];
}

/** Every post's details (drafts too, marked draft: true), with the posts that link to each one. */
export async function listPosts(gh: GitHub) {
  const files = await postFiles(gh);
  const posts: Array<Omit<PostInfo, 'source'> & { draft: boolean; editableText: boolean; linkedFrom: string[] }> = [];
  for (const f of files) {
    try {
      const { source, ...info } = readPost(f.slug, f.text);
      const linkedFrom = files.filter(o => o !== f && !o.draft && o.text.includes(`/archive/${f.slug}`)).map(o => o.slug);
      posts.push({ ...info, draft: f.draft, editableText: source !== null, linkedFrom });
    } catch {
      // A file without a meta block isn't a post the dashboard can handle; skip it.
    }
  }
  return { posts: posts.sort((a, b) => Number(b.meta.index ?? 0) - Number(a.meta.index ?? 0)) };
}

/** A post's file, live or draft. */
async function findPost(read: (p: string) => Promise<string | null>, slug: string) {
  for (const draft of [false, true]) {
    const src = await read(postPath(slug, draft));
    if (src !== null) return { src, draft, path: postPath(slug, draft) };
  }
  throw new HttpError(404, `No post "${slug}"`);
}

export async function getPost(gh: GitHub, slug: unknown) {
  if (!isSlug(slug)) throw new HttpError(400, 'Bad slug');
  const head = await gh.head();
  const { src, draft } = await findPost(p => gh.read(p, head), slug);
  return { ...readPost(slug, src), draft };
}

/**
 * Changes a post's details, and its text if it was written in the dashboard.
 * `draft`: true moves it to drafts (off the site), false publishes it; undefined leaves it where it is.
 */
export async function editPost(gh: GitHub, slug: unknown, patch: PostMetaPatch, body?: string, draft?: boolean) {
  if (!isSlug(slug)) throw new HttpError(400, 'Bad slug');
  let nowDraft = false;
  const verb = draft === true ? 'unpublish' : draft === false ? 'publish' : 'edit';
  const sha = await gh.change(`Archive: ${verb} "${slug}"`, async read => {
    const found = await findPost(read, slug);
    const wantDraft = draft ?? found.draft;
    nowDraft = wantDraft;
    const hasPatch = body !== undefined || Object.values(patch).some(v => v !== undefined);
    let text = hasPatch ? updatePost(slug, found.src, patch, body) : found.src;
    // A new body is written fresh for src/posts (./types); a draft's file needs its imports one folder deeper.
    if (found.draft && body !== undefined) text = rebaseImports(text, true);
    if (wantDraft === found.draft) return [{ path: found.path, content: text }];
    text = rebaseImports(text, wantDraft);
    const to = postPath(slug, wantDraft);
    if ((await read(to)) !== null) throw new HttpError(409, `${to} already exists`);
    return [{ path: found.path, content: null }, { path: to, content: text }];
  });
  return { sha, slug, draft: nowDraft };
}

export async function deletePost(gh: GitHub, slug: unknown) {
  if (!isSlug(slug)) throw new HttpError(400, 'Bad slug');
  const sha = await gh.change(`Archive: delete "${slug}"`, async read => [{ path: (await findPost(read, slug)).path, content: null }]);
  return { sha, slug };
}

// ---------- Samples: list, edit, delete ----------

/** Samples from GitHub, with which packs and samples are hidden from the site. */
export async function listSamples(gh: GitHub, pack?: string | null) {
  const head = await gh.head();
  const [ts, hidden] = await Promise.all([must(p => gh.read(p, head), SAMPLES), gh.read(HIDDEN, head)]);
  return { samples: parseSamples(ts, pack || undefined), hidden: readHidden(hidden) };
}

/** Hides packs and/or samples from /samples, or shows them again. They stay saved either way. */
export async function setVisibility(gh: GitHub, change: { packs?: string[]; samples?: number[]; hidden: boolean }) {
  const packs = Array.isArray(change.packs) ? change.packs.map(String).slice(0, 100) : [];
  const samples = Array.isArray(change.samples) ? change.samples.map(Number).filter(Number.isInteger).slice(0, 2000) : [];
  if (!packs.length && !samples.length) throw new HttpError(400, 'Nothing to hide or show');
  const hidden = Boolean(change.hidden);
  const what = [packs.length && `${packs.length === 1 ? `pack ${packs[0]}` : `${packs.length} packs`}`, samples.length && `${samples.length} sample${samples.length === 1 ? '' : 's'}`]
    .filter(Boolean).join(' and ');
  const sha = await gh.change(`Samples: ${hidden ? 'hide' : 'show'} ${what}`, async read => {
    if (packs.length) {
      const known = readPacks(await must(read, SAMPLES));
      const bad = packs.find(p => !known.has(p));
      if (bad) throw new HttpError(400, `Unknown pack "${bad}"`);
    }
    return [{ path: HIDDEN, content: setHidden(await read(HIDDEN), { packs, samples, hidden }) }];
  });
  return { sha, hidden };
}

export async function editSamples(gh: GitHub, changes: SampleChange[]) {
  if (!Array.isArray(changes) || !changes.length || changes.length > 500) throw new HttpError(400, 'Send 1 to 500 changes');
  let changed = 0;
  const sha = await gh.change(`Samples: edit ${changes.length}`, async read => {
    const r = updateSamples(await must(read, SAMPLES), changes);
    changed = r.changed;
    return [{ path: SAMPLES, content: r.text }];
  });
  return { sha, changed };
}

/** Removes samples and the preview MP3s no other sample uses. */
export async function deleteSamples(gh: GitHub, ids: number[]) {
  if (!Array.isArray(ids) || !ids.length || ids.length > 500) throw new HttpError(400, 'Send 1 to 500 ids');
  let removed: string[] = [];
  const sha = await gh.change(`Samples: delete ${ids.length}`, async read => {
    const r = removeSamples(await must(read, SAMPLES), ids);
    removed = r.removed.map(x => x.name);
    const hidden = await read(HIDDEN);
    const unhide = hidden && readHidden(hidden).samples.some(id => ids.includes(id))
      ? [{ path: HIDDEN, content: setHidden(hidden, { samples: ids, hidden: false }) }] : [];
    return [{ path: SAMPLES, content: r.text }, ...r.previews.map(p => ({ path: `public${p}`, content: null })), ...unhide];
  });
  return { sha, removed };
}

async function saveSamples(request: Request, gh: GitHub) {
  const form = await request.formData();
  const { pack, category, items, hidden } = JSON.parse(String(form.get('meta') ?? '{}')) as { pack: string; category: string; items: SampleInput[]; hidden?: boolean };
  if (!Array.isArray(items) || items.length > 200) throw new HttpError(400, 'Send 1 to 200 samples at a time');
  const previews: Uint8Array[] = [];
  for (let i = 0; i < items.length; i++) {
    const bytes = await mp3(form, `preview${i}`);
    if (!bytes) throw new HttpError(400, `Missing preview for ${items[i].name}`);
    previews.push(bytes);
  }
  const sha = await gh.change(`Samples: add ${items.length} to ${pack}${hidden ? ' (hidden)' : ''}`, async read => {
    const { text, previews: paths, ids } = appendSamples(await must(read, SAMPLES), pack, category, items);
    const hide = hidden ? [{ path: HIDDEN, content: setHidden(await read(HIDDEN), { samples: ids, hidden: true }) }] : [];
    return [{ path: SAMPLES, content: text }, ...paths.map((p, i) => ({ path: `public${p}`, content: previews[i] })), ...hide];
  });
  return { sha };
}

async function savePost(request: Request, gh: GitHub) {
  return publishPost(gh, (await request.json()) as PostInput);
}

/** Writes a new post, live or (draft: true) saved in src/posts/drafts without going on the site. */
export async function publishPost(gh: GitHub, input: PostInput & { draft?: boolean }) {
  const draft = Boolean(input.draft);
  const file = draft ? rebaseImports(postFile(input), true) : postFile(input);
  const sha = await gh.change(`Archive: ${draft ? 'draft' : 'add'} "${String(input.title).slice(0, 60)}"`, async read => {
    for (const d of [false, true]) {
      if ((await read(postPath(input.slug, d))) !== null) throw new HttpError(409, `A post with the slug "${input.slug}" already exists${d ? ' (as a draft)' : ''}`);
    }
    return [{ path: postPath(input.slug, draft), content: file }];
  });
  return { sha, slug: input.slug, draft };
}

/** Sketches as they are on GitHub right now (the live site may be a deploy behind). */
export async function content(gh: GitHub) {
  const head = await gh.head();
  return { head, sketches: JSON.parse((await gh.read(SKETCHES, head)) ?? '[]') };
}

/** The next archive post number: the highest `index:` in src/posts and its drafts. */
export async function nextPostIndex(gh: GitHub): Promise<number> {
  const indexes = (await postFiles(gh)).map(f => Number(/^\s*index:\s*(\d+)/m.exec(f.text)?.[1] ?? 0));
  return Math.max(0, ...indexes) + 1;
}

// ---------- Drafts: saved, not on the site yet ----------

/** Draft posts (src/posts/drafts) and hidden sketches: what's waiting for "Publish". */
export async function listDrafts(gh: GitHub) {
  const [{ posts }, { sketches }] = await Promise.all([listPosts(gh), content(gh)]);
  return {
    posts: posts.filter(p => p.draft).map(({ draft: _d, linkedFrom: _l, ...p }) => p),
    sketches: (sketches as SketchEntry[]).filter(s => s.hidden),
  };
}

/**
 * Puts drafts on the site: draft posts move to src/posts, hidden sketches lose `hidden`. One commit per item, named
 * "… publish "…"", so each counts as a public ship on the Launchpad (and gets its promo checklist).
 */
export async function publishDrafts(gh: GitHub, input: { posts?: unknown; sketches?: unknown }) {
  const list = (v: unknown) => (Array.isArray(v) ? v.map(String).slice(0, 50) : []);
  const posts = list(input.posts);
  const sketches = list(input.sketches);
  if (!posts.length && !sketches.length) throw new HttpError(400, 'Nothing to publish');
  const published: Array<{ kind: 'post' | 'sketch'; id: string; url: string }> = [];
  const failed: Array<{ kind: 'post' | 'sketch'; id: string; error: string }> = [];
  for (const slug of posts) {
    try {
      await editPost(gh, slug, {}, undefined, false);
      published.push({ kind: 'post', id: slug, url: `/archive/${slug}` });
    } catch (err) {
      failed.push({ kind: 'post', id: slug, error: err instanceof Error ? err.message : String(err) });
    }
  }
  // The title goes in the commit message: the Launchpad shows it as the ship's name.
  const titles = sketches.length ? new Map((((await content(gh)).sketches) as SketchEntry[]).map(s => [s.id, s.title])) : new Map<string, string>();
  for (const id of sketches) {
    try {
      await gh.change(`Sketches: publish "${(titles.get(id) ?? id).slice(0, 60)}"`, async read => {
        const r = setSketchHidden(await must(read, SKETCHES), id, false);
        if (!r.was) throw new HttpError(400, `"${id}" is already on the site`);
        return [{ path: SKETCHES, content: r.text }];
      });
      published.push({ kind: 'sketch', id, url: `/sketches#${id}` });
    } catch (err) {
      failed.push({ kind: 'sketch', id, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return { published, failed };
}

// ---------- Ideas: promote ----------

/**
 * Turns an inbox idea into a GitHub issue or a sketch on the site, then marks it promoted with a link there.
 * A sketch becomes a demo with audio when the idea has an MP3, otherwise an idea sketch.
 * (Posts are written in the Archive tab, which marks the idea itself after publishing.)
 */
export async function promoteIdea(
  env: DevEnv, gh: GitHub, rest: <T>(m: string, p: string, b?: object) => Promise<T>, owner: string, input: Record<string, unknown>,
) {
  const idea = await getIdea(env, input.id);
  if (idea.status !== 'inbox') throw new HttpError(400, 'Only ideas in the inbox can be promoted');
  const title = String(input.title ?? '').trim();
  const text = String(input.text ?? '').trim();
  if (!title) throw new HttpError(400, 'Give it a title');
  let promotedTo: { kind: string; label: string; url: string };
  if (input.target === 'issue') {
    const repo = ownRepo(input.repo, owner);
    const files = idea.files.length ? `\n\n_${idea.files.length} file${idea.files.length > 1 ? 's' : ''} in the /dev idea inbox: ${idea.files.map(f => f.name).join(', ')}_` : '';
    const labels = Array.isArray(input.labels) ? input.labels.map(String) : [];
    await ensureLabels(rest, repo, labels);
    const { issue } = await saveIssue(rest, repo, { title, body: `${text}${files}`, ...(labels.length && { labels }) });
    promotedTo = { kind: 'issue', label: `${issue.repo}#${issue.number}`, url: issue.url };
  } else if (input.target === 'sketch') {
    const audioFile = idea.files.find(f => f.type === 'audio/mpeg');
    const audio = audioFile ? (await readIdeaFile(env, audioFile.id)).bytes : null;
    const withAudio = audio && isMp3(audio) ? audio : null;
    const today = new Date().toISOString().slice(0, 10);
    const tags = Array.isArray(input.tags) ? input.tags.map(String) : [];
    const hidden = input.hidden === true;
    const r = await addSketchWithAudio(gh, { kind: withAudio ? 'demo' : 'idea', title, date: today, text, tags }, withAudio, hidden);
    promotedTo = { kind: 'sketch', label: hidden ? `${title} (draft)` : title, url: `/sketches#${r.id}` };
  } else if (input.target === 'post') {
    // Always a draft: what Claude writes from an idea waits in /dev → Launchpad → Drafts.
    const body = text || idea.text;
    if (!body) throw new HttpError(400, 'A post needs some text');
    const slug = slugify(String(input.slug ?? '') || title);
    if (!slug) throw new HttpError(400, 'Give it a title with letters or digits');
    const tags = Array.isArray(input.tags) ? input.tags.map(String) : [];
    await publishPost(gh, {
      title, body, slug, date: new Date().toISOString().slice(0, 10), tags, accentColor: '#ffaa00',
      description: typeof input.description === 'string' ? input.description : undefined, index: await nextPostIndex(gh), draft: true,
    });
    promotedTo = { kind: 'post', label: `${title} (draft)`, url: `/dev#archive` };
  } else {
    throw new HttpError(400, 'Promote to "issue", "sketch" or "post"');
  }
  return { idea: await updateIdea(env, { id: idea.id, status: 'promoted', promotedTo }) };
}

// ---------- Google Drive: samples ----------

const AUDIO = /\.(wav|aiff?|flac|mp3|ogg|m4a)$/i;

/** A pack's Drive folder link, read from PACKS in samples.ts on GitHub. */
export async function packFolder(gh: GitHub, pack: unknown): Promise<string> {
  const ts = await must(p => gh.read(p, 'main'), SAMPLES);
  const id = String(pack ?? '');
  const at = ts.indexOf(`id: ${JSON.stringify(id)},`);
  const end = ts.indexOf('export const SAMPLES');
  const link = at >= 0 && at < end ? /driveFolder: "([^"]*)"/.exec(ts.slice(at, end)) : null;
  if (!link) throw new HttpError(404, `No pack "${id}"`);
  if (!link[1]) throw new HttpError(400, `The pack "${id}" has no Drive folder link yet`);
  return link[1];
}

/** What's in a pack's Drive folder (and its subfolders) compared with the samples on the site, matched by file name. */
export async function driveFolderStatus(env: DevEnv, gh: GitHub, pack: unknown) {
  const folder = await packFolder(gh, pack);
  const [files, isPublic, { samples }] = await Promise.all([listFolder(env, folder), folderIsPublic(env, folder), listSamples(gh, String(pack))]);
  const audio = files.filter(f => AUDIO.test(f.name));
  const byName = new Map<string, (typeof files)[number]>();
  for (const f of audio) if (!byName.has(f.name.toLowerCase())) byName.set(f.name.toLowerCase(), f);
  const onSite = new Set(samples.map(s => s.name.toLowerCase()));
  const seen = new Map<string, number>();
  for (const f of audio) seen.set(f.name.toLowerCase(), (seen.get(f.name.toLowerCase()) ?? 0) + 1);
  return {
    pack, folder, public: isPublic, audioOnDrive: audio.length, samplesOnSite: samples.length,
    subfolders: [...new Set(files.map(f => f.path).filter(Boolean))].sort(),
    notOnSite: audio.filter(f => !onSite.has(f.name.toLowerCase())).map(f => ({ id: f.id, name: f.name, size: f.size, path: f.path })),
    missingIds: samples.filter(s => !s.driveId).map(s => ({ id: s.id, name: s.name, driveFile: byName.get(s.name.toLowerCase())?.id ?? null })),
    notOnDrive: samples.filter(s => !byName.has(s.name.toLowerCase())).map(s => s.name),
    /** Same file name in more than one place: name matching picks the first. */
    duplicateNames: [...seen].filter(([, n]) => n > 1).map(([name]) => name),
    otherFiles: files.filter(f => !AUDIO.test(f.name)).map(f => (f.path ? `${f.path}/${f.name}` : f.name)),
    /** Every audio file, so /dev can reuse one instead of uploading a duplicate. */
    driveFiles: audio.map(f => ({ id: f.id, name: f.name })),
  };
}

/** Saves the Drive id of every sample in the pack that has none yet and has a file of the same name on Drive. */
export async function linkDriveIds(env: DevEnv, gh: GitHub, pack: unknown) {
  const st = await driveFolderStatus(env, gh, pack);
  const changes = st.missingIds.filter(m => m.driveFile).map(m => ({ id: m.id, driveId: m.driveFile! }));
  if (!changes.length) return { linked: 0, stillMissing: st.missingIds.map(m => m.name), sha: null };
  const r = await editSamples(gh, changes);
  return { linked: r.changed, stillMissing: st.missingIds.filter(m => !m.driveFile).map(m => m.name), sha: r.sha };
}

/**
 * Queues the audio files in the pack's folder that aren't on the site; /dev then makes previews and publishes.
 * Without a category, each file takes the name of the subfolder it's in ("Kicks/VR Kick 9.wav" → Kicks), and one
 * release is queued per category.
 */
export async function startRelease(env: DevEnv, gh: GitHub, input: { pack: string; category?: string; names?: string[]; maxSeconds?: number }) {
  const fixed = String(input.category ?? '').trim().slice(0, 60);
  const st = await driveFolderStatus(env, gh, input.pack);
  const wanted = input.names?.length ? new Set(input.names.map(n => n.toLowerCase())) : null;
  const files = st.notOnSite.filter(f => !wanted || wanted.has(f.name.toLowerCase()));
  if (!files.length) throw new HttpError(400, wanted ? 'None of those files are in the folder and missing from the site' : 'Every audio file in the folder is already on the site');
  if (files.length > 500) throw new HttpError(400, 'At most 500 files per release; pass names to split it');
  const groups = new Map<string, typeof files>();
  const loose: string[] = [];
  for (const f of files) {
    const category = fixed || f.path.split('/').pop()!.slice(0, 60);
    if (!category) { loose.push(f.name); continue; }
    groups.set(category, [...(groups.get(category) ?? []), f]);
  }
  if (loose.length) {
    throw new HttpError(400, `Give a category: ${loose.length} file${loose.length > 1 ? 's are' : ' is'} not in a subfolder (${loose.slice(0, 5).join(', ')}${loose.length > 5 ? '…' : ''})`);
  }
  const maxSeconds = Math.max(0, Math.min(600, Number(input.maxSeconds) || 0));
  const releases = [];
  for (const [category, list] of groups) {
    const id = await queueRelease(env, { pack: input.pack, category, maxSeconds, files: list.map(({ id, name, size }) => ({ id, name, size })) });
    releases.push({ release: id, category, files: list.length });
  }
  return { releases, public: st.public, next: 'Open spacekidlabs.com/dev → Samples and press Release on each, to make the previews and publish.' };
}

// ---------- Router ----------

/** Pasted secrets often carry a stray space or line break; GitHub then answers "Bad credentials". */
export function cleanEnv<E extends DevEnv>(raw: E): E {
  return {
    ...raw,
    GITHUB_TOKEN: raw.GITHUB_TOKEN?.trim(),
    GITHUB_PROJECTS_TOKEN: raw.GITHUB_PROJECTS_TOKEN?.trim(),
    DEV_PASSWORD: raw.DEV_PASSWORD?.trim(),
  };
}

/** Compares a typed password with DEV_PASSWORD without leaking timing. */
export async function checkPassword(typed: string, env: DevEnv): Promise<boolean> {
  return Boolean(env.DEV_PASSWORD) && (await sameString(typed, env.DEV_PASSWORD!));
}

export async function handleDev(request: Request, rawEnv: DevEnv, pathname: string): Promise<Response> {
  const env = cleanEnv(rawEnv);
  const action = pathname.slice('/api/dev/'.length);
  const method = request.method;

  // Writes only from this site's own pages (the cookie is SameSite=Strict too).
  if (method !== 'GET') {
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin) return json(403, { error: 'Wrong origin' });
  }

  if (action === 'login' && method === 'POST') return login(request, env);
  if (action === 'google-callback' && method === 'GET') return driveCallback(env, new URL(request.url));
  if (action === 'logout' && method === 'POST') return logout();
  const loggedIn = await isLoggedIn(request, env);
  if (action === 'session' && method === 'GET') {
    return json(200, { loggedIn, configured: Boolean(env.DEV_PASSWORD && env.GITHUB_TOKEN && env.GITHUB_REPO) });
  }
  if (!loggedIn) return json(401, { error: 'Log in first' });

  // The idea inbox only needs its database, so it works even before the GitHub tokens are set up.
  if (action.startsWith('idea') && !(action === 'idea-promote')) {
    try {
      const url = new URL(request.url);
      if (action === 'ideas' && method === 'GET') return json(200, await listIdeas(env, url.searchParams.get('status')));
      if (action === 'idea-file' && method === 'GET') return await ideaFileResponse(env, url.searchParams.get('id'), request);
      if (action === 'idea' && method === 'POST') {
        const form = await request.formData();
        const files = form.getAll('file').filter((f): f is File => typeof f !== 'string');
        return json(200, { idea: await addIdea(env, { text: form.get('text'), project: form.get('project'), tags: form.get('tags') ?? undefined, source: 'dev' }, files) });
      }
      if (action === 'idea-update' && method === 'POST') return json(200, { idea: await updateIdea(env, (await request.json()) as Record<string, unknown>) });
      if (action === 'idea-merge' && method === 'POST') return json(200, { idea: await mergeIdeas(env, (await request.json()) as Record<string, unknown>) });
      if (action === 'idea-delete' && method === 'POST') return json(200, await deleteIdea(env, ((await request.json()) as { id: string }).id));
    } catch (err) {
      if (err instanceof IdeaError) return json(err.status, { error: err.message });
      console.error('Idea inbox:', err instanceof Error ? err.message : String(err));
      return json(500, { error: 'The idea inbox failed. See the Worker logs.' });
    }
    return json(404, { error: 'Not found' });
  }

  if (action === 'review' && method === 'GET') {
    try {
      return json(200, { review: await latestReview(env) });
    } catch (err) {
      if (err instanceof FocusError || err instanceof IdeaError) return json(err.status, { error: err.message });
      throw err;
    }
  }

  if (action === 'momentum' && method === 'GET') {
    const token = env.GITHUB_PROJECTS_TOKEN || env.GITHUB_TOKEN;
    const pg = token && env.GITHUB_REPO ? new GitHub({ GITHUB_TOKEN: token, GITHUB_REPO: env.GITHUB_REPO, GITHUB_API: env.GITHUB_API }) : null;
    const [owner = '', site = ''] = (env.GITHUB_REPO ?? '').split('/');
    return json(200, await momentum(env, pg ? (q, v) => pg.graphql(q, v) : null, owner, site));
  }

  if (action.startsWith('message')) {
    try {
      if (action === 'messages' && method === 'GET') return json(200, await listMessages(env, new URL(request.url).searchParams.get('status')));
      const input = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      if (action === 'message-mark' && method === 'POST') return json(200, await markMessage(env, input));
      if (action === 'message-delete' && method === 'POST') return json(200, await deleteMessage(env, input.id));
    } catch (err) {
      if (err instanceof MessageError || err instanceof IdeaError) return json(err.status, { error: err.message });
      console.error('Messages:', err instanceof Error ? err.message : String(err));
      return json(500, { error: 'Messages failed. See the Worker logs.' });
    }
    return json(404, { error: 'Not found' });
  }

  if (action.startsWith('drive-') || action === 'releases-queued' || action === 'release-remove') {
    const url = new URL(request.url);
    try {
      if (action === 'drive-status' && method === 'GET') return json(200, await driveStatus(env));
      if (action === 'drive-connect' && method === 'GET') return json(200, { url: await connectUrl(env, siteOrigin(env, url)) });
      if (action === 'drive-disconnect' && method === 'POST') return json(200, await driveDisconnect(env));
      if (action === 'drive-file' && method === 'GET') return await downloadFile(env, url.searchParams.get('id'));
      if (action === 'releases-queued' && method === 'GET') return json(200, { releases: await listReleases(env) });
      if (action === 'release-remove' && method === 'POST') return json(200, await removeRelease(env, ((await request.json()) as { id: string }).id));
      // The rest needs the samples list on GitHub.
      if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return json(503, { error: 'GITHUB_TOKEN or GITHUB_REPO is not set (see docs/HOSTING.md)' });
      const gh = new GitHub({ GITHUB_TOKEN: env.GITHUB_TOKEN, GITHUB_REPO: env.GITHUB_REPO, GITHUB_API: env.GITHUB_API });
      if (action === 'drive-folder' && method === 'GET') return json(200, await driveFolderStatus(env, gh, url.searchParams.get('pack')));
      if (action === 'drive-link' && method === 'POST') return json(200, await linkDriveIds(env, gh, ((await request.json()) as { pack: string }).pack));
      if (action === 'drive-release' && method === 'POST') {
        const input = (await request.json()) as { pack: string; category?: string; names?: string[]; maxSeconds?: number };
        return json(200, await startRelease(env, gh, input));
      }
      if (action === 'drive-upload' && method === 'POST') {
        const input = (await request.json()) as { pack: string; name: string; size: number; type: string };
        return json(200, await startUpload(env, { ...input, folder: await packFolder(gh, input.pack) }, siteOrigin(env, url)));
      }
    } catch (err) {
      if (err instanceof DriveError || err instanceof HttpError) return json(err.status, { error: err.message });
      console.error('Drive:', err instanceof Error ? err.message : String(err));
      return json(500, { error: 'Drive failed. See the Worker logs.' });
    }
    return json(404, { error: 'Not found' });
  }

  if ((action === 'promo-tick' || action === 'promo-channels') && method === 'POST') {
    try {
      const input = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      return json(200, action === 'promo-tick' ? await tickPromo(env, input) : await setChannels(env, input.channels));
    } catch (err) {
      if (err instanceof ShipError || err instanceof IdeaError) return json(err.status, { error: err.message });
      console.error('Promo:', err instanceof Error ? err.message : String(err));
      return json(500, { error: 'Saving failed. See the Worker logs.' });
    }
  }

  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return json(503, { error: 'GITHUB_TOKEN or GITHUB_REPO is not set (see docs/HOSTING.md)' });

  const gh = new GitHub({ GITHUB_TOKEN: env.GITHUB_TOKEN, GITHUB_REPO: env.GITHUB_REPO, GITHUB_API: env.GITHUB_API });
  try {
    if (action === 'content' && method === 'GET') return json(200, await content(gh));
    if (action === 'analytics' && method === 'GET') {
      const days = Number(new URL(request.url).searchParams.get('days')) === 30 ? 30 : 7;
      return json(200, await cloudflareAnalytics(env, days));
    }
    if (action === 'events' && method === 'GET') return json(200, await eventCounts(env));
    // Reading across projects and handling issues use the projects token when there is one.
    const pg = new GitHub({ GITHUB_TOKEN: env.GITHUB_PROJECTS_TOKEN || env.GITHUB_TOKEN, GITHUB_REPO: env.GITHUB_REPO, GITHUB_API: env.GITHUB_API });
    const owner = env.GITHUB_REPO.split('/')[0];
    const url = new URL(request.url);
    if (action === 'projects' && method === 'GET') {
      return json(200, { ...(await projects(p => pg.get(p), owner)), owner, site: env.GITHUB_REPO.split('/')[1], projectsToken: Boolean(env.GITHUB_PROJECTS_TOKEN) });
    }
    if (action === 'github' && method === 'GET') {
      const name = url.searchParams.get('repo');
      const repo = name ? ownRepo(name, owner) : env.GITHUB_REPO;
      return json(200, await githubStats(p => pg.get(p), repo, repo === env.GITHUB_REPO));
    }
    if (action.startsWith('issue')) {
      const rest: <T>(m: string, p: string, b?: object) => Promise<T> = (m, p, b) => pg.rest(m, p, b);
      if (action === 'issues' && method === 'GET') {
        const repo = url.searchParams.get('repo');
        const state = url.searchParams.get('state');
        return json(200, repo === '*' ? await listAllIssues(rest, owner, state) : await listIssues(rest, ownRepo(repo, owner), state));
      }
      if (action === 'issue' && method === 'GET') {
        return json(200, await readIssue(rest, ownRepo(url.searchParams.get('repo'), owner), url.searchParams.get('number')));
      }
      if ((action === 'issue-save' || action === 'issue-comment') && method === 'POST') {
        const input = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const repo = ownRepo(input.repo, owner);
        if (action === 'issue-save' && Array.isArray(input.labels)) await ensureLabels(rest, repo, input.labels.map(String));
        return json(200, action === 'issue-save' ? await saveIssue(rest, repo, input) : await commentIssue(rest, repo, input));
      }
    }
    if (action === 'today' && method === 'GET') {
      const exclude = (url.searchParams.get('exclude') ?? '').split(',').filter(Boolean).slice(0, 50);
      return json(200, await todayPick((m, p, b) => pg.rest(m, p, b), owner, 3, exclude));
    }
    if (action === 'focus-labels' && method === 'POST') {
      const input = (await request.json()) as { repo: string; number: number; size?: 'small' | 'medium' | 'big' | null; priority?: 'now' | 'later' | null };
      return json(200, await setFocusLabels((m, p, b) => pg.rest(m, p, b), ownRepo(input.repo, owner), Number(input.number), input));
    }
    if (action === 'releases' && method === 'GET') return json(200, await releases((q, v) => pg.graphql(q, v), owner));
    if (action === 'release-notes' && method === 'GET') {
      return json(200, await releaseNotes((q, v) => pg.graphql(q, v), ownRepo(url.searchParams.get('repo'), owner), url.searchParams.get('since')));
    }
    if (action === 'idea-promote' && method === 'POST') {
      return json(200, await promoteIdea(env, gh, (m, p, b) => pg.rest(m, p, b), owner, (await request.json()) as Record<string, unknown>));
    }
    if (action === 'sketch' && method === 'POST') return json(200, await saveSketch(request, gh));
    if (action === 'sketch-delete' && method === 'POST') return json(200, await deleteSketch(request, gh));
    if (action === 'sketch-update' && method === 'POST') return json(200, await editSketch(request, gh));
    if (action === 'drafts' && method === 'GET') return json(200, await listDrafts(gh));
    if (action === 'drafts-publish' && method === 'POST') return json(200, await publishDrafts(gh, (await request.json()) as Record<string, unknown>));
    if (action === 'posts' && method === 'GET') return json(200, await listPosts(gh));
    if (action === 'post-get' && method === 'GET') return json(200, await getPost(gh, url.searchParams.get('slug')));
    if (action === 'post-update' && method === 'POST') {
      const { slug, meta, body, draft } = (await request.json()) as { slug: string; meta?: PostMetaPatch; body?: string; draft?: boolean };
      return json(200, await editPost(gh, slug, meta ?? {}, body, typeof draft === 'boolean' ? draft : undefined));
    }
    if (action === 'post-delete' && method === 'POST') return json(200, await deletePost(gh, ((await request.json()) as { slug: string }).slug));
    if (action === 'samples-list' && method === 'GET') return json(200, await listSamples(gh, url.searchParams.get('pack')));
    if (action === 'samples-update' && method === 'POST') return json(200, await editSamples(gh, ((await request.json()) as { changes: SampleChange[] }).changes));
    if (action === 'samples-delete' && method === 'POST') return json(200, await deleteSamples(gh, ((await request.json()) as { ids: number[] }).ids));
    if (action === 'visibility' && method === 'POST') return json(200, await setVisibility(gh, (await request.json()) as { packs?: string[]; samples?: number[]; hidden: boolean }));
    if (action === 'samples' && method === 'POST') return json(200, await saveSamples(request, gh));
    if (action === 'post' && method === 'POST') return json(200, await savePost(request, gh));
  } catch (err) {
    if (err instanceof HttpError || err instanceof IssueError || err instanceof IdeaError || err instanceof FocusError) return json(err.status, { error: err.message });
    // Errors from content.ts are input problems with plain messages; anything else stays in the log.
    const message = err instanceof Error ? err.message : String(err);
    console.error('Dev dashboard:', message);
    return json(400, { error: message.slice(0, 300) });
  }
  return json(404, { error: 'Not found' });
}
