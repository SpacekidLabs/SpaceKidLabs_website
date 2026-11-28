/**
 * The /dev dashboard's API: POST/GET /api/dev/*. Lets the site owner add sketches, samples and archive posts
 * from any browser. Every change is a commit to `main` on GitHub, which redeploys the site (docs/HOSTING.md).
 *
 * Secrets (set in Cloudflare, never in this repo; locally in .dev.vars, which git ignores):
 *   DEV_PASSWORD  the dashboard password; it also signs the login cookie, so changing it logs everyone out
 *   GITHUB_TOKEN  fine-grained token with Contents: read and write on this repository only
 * Var: GITHUB_REPO ("owner/name", in wrangler.jsonc).
 *
 * Neither secret is ever put in a response or a log line.
 */
import {
  addSketch, appendSamples, postFile, removeSketch,
  type PostInput, type SampleInput, type SketchInput,
} from './content';

export interface DevEnv {
  DEV_PASSWORD?: string;
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  /** Only for local tests against a mock; defaults to GitHub's API. */
  GITHUB_API?: string;
}

const BRANCH = 'main';
const COOKIE = 'dev_session';
const SESSION_DAYS = 30;
const SKETCHES = 'src/data/sketches.json';
const SAMPLES = 'src/data/samples.ts';

const json = (status: number, body: object, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });

class HttpError extends Error {
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

class GitHub {
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

async function must(read: (p: string) => Promise<string | null>, path: string): Promise<string> {
  const text = await read(path);
  if (text === null) throw new HttpError(500, `${path} is missing from the repository`);
  return text;
}

/** An MP3 from the form, checked to be an MP3 (the browser encodes everything to MP3 before uploading). */
async function mp3(form: FormData, field: string): Promise<Uint8Array | null> {
  const file = form.get(field);
  if (!file || typeof file === 'string') return null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const id3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
  const frame = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
  if (!id3 && !frame) throw new HttpError(400, `${field} is not an MP3`);
  return bytes;
}

async function saveSketch(request: Request, gh: GitHub) {
  const form = await request.formData();
  const input = JSON.parse(String(form.get('meta') ?? '{}')) as SketchInput;
  const audio = input.kind === 'demo' ? await mp3(form, 'audio') : null;
  let id = '';
  const sha = await gh.change(`Sketches: add "${String(input.title).slice(0, 60)}"`, async read => {
    const { text, entry } = addSketch(await must(read, SKETCHES), input, audio ? i => `/audio/sketches/${i}.mp3` : undefined);
    id = entry.id;
    return [{ path: SKETCHES, content: text }, ...(audio ? [{ path: `public${entry.file}`, content: audio }] : [])];
  });
  return { sha, id };
}

async function deleteSketch(request: Request, gh: GitHub) {
  const { id } = (await request.json()) as { id: string };
  const sha = await gh.change(`Sketches: remove "${String(id).slice(0, 60)}"`, async read => {
    const { text, entry } = removeSketch(await must(read, SKETCHES), String(id));
    const audio = entry.file?.startsWith('/audio/sketches/') ? [{ path: `public${entry.file}`, content: null }] : [];
    return [{ path: SKETCHES, content: text }, ...audio];
  });
  return { sha };
}

async function saveSamples(request: Request, gh: GitHub) {
  const form = await request.formData();
  const { pack, category, items } = JSON.parse(String(form.get('meta') ?? '{}')) as { pack: string; category: string; items: SampleInput[] };
  if (!Array.isArray(items) || items.length > 200) throw new HttpError(400, 'Send 1 to 200 samples at a time');
  const previews: Uint8Array[] = [];
  for (let i = 0; i < items.length; i++) {
    const bytes = await mp3(form, `preview${i}`);
    if (!bytes) throw new HttpError(400, `Missing preview for ${items[i].name}`);
    previews.push(bytes);
  }
  const sha = await gh.change(`Samples: add ${items.length} to ${pack}`, async read => {
    const { text, previews: paths } = appendSamples(await must(read, SAMPLES), pack, category, items);
    return [{ path: SAMPLES, content: text }, ...paths.map((p, i) => ({ path: `public${p}`, content: previews[i] }))];
  });
  return { sha };
}

async function savePost(request: Request, gh: GitHub) {
  const input = (await request.json()) as PostInput;
  const file = postFile(input);
  const path = `src/posts/${input.slug}.tsx`;
  const sha = await gh.change(`Archive: add "${String(input.title).slice(0, 60)}"`, async read => {
    if ((await read(path)) !== null) throw new HttpError(409, `A post with the slug "${input.slug}" already exists`);
    return [{ path, content: file }];
  });
  return { sha, slug: input.slug };
}

/** Sketches as they are on GitHub right now (the live site may be a deploy behind). */
async function content(gh: GitHub) {
  const head = await gh.head();
  return { head, sketches: JSON.parse((await gh.read(SKETCHES, head)) ?? '[]') };
}

// ---------- Router ----------

export async function handleDev(request: Request, rawEnv: DevEnv, pathname: string): Promise<Response> {
  // Pasted secrets often carry a stray space or line break; GitHub then answers "Bad credentials".
  const env: DevEnv = { ...rawEnv, GITHUB_TOKEN: rawEnv.GITHUB_TOKEN?.trim(), DEV_PASSWORD: rawEnv.DEV_PASSWORD?.trim() };
  const action = pathname.slice('/api/dev/'.length);
  const method = request.method;

  // Writes only from this site's own pages (the cookie is SameSite=Strict too).
  if (method !== 'GET') {
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin) return json(403, { error: 'Wrong origin' });
  }

  if (action === 'login' && method === 'POST') return login(request, env);
  if (action === 'logout' && method === 'POST') return logout();
  const loggedIn = await isLoggedIn(request, env);
  if (action === 'session' && method === 'GET') {
    return json(200, { loggedIn, configured: Boolean(env.DEV_PASSWORD && env.GITHUB_TOKEN && env.GITHUB_REPO) });
  }
  if (!loggedIn) return json(401, { error: 'Log in first' });
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return json(503, { error: 'GITHUB_TOKEN or GITHUB_REPO is not set (see docs/HOSTING.md)' });

  const gh = new GitHub({ GITHUB_TOKEN: env.GITHUB_TOKEN, GITHUB_REPO: env.GITHUB_REPO, GITHUB_API: env.GITHUB_API });
  try {
    if (action === 'content' && method === 'GET') return json(200, await content(gh));
    if (action === 'sketch' && method === 'POST') return json(200, await saveSketch(request, gh));
    if (action === 'sketch-delete' && method === 'POST') return json(200, await deleteSketch(request, gh));
    if (action === 'samples' && method === 'POST') return json(200, await saveSamples(request, gh));
    if (action === 'post' && method === 'POST') return json(200, await savePost(request, gh));
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { error: err.message });
    // Errors from content.ts are input problems with plain messages; anything else stays in the log.
    const message = err instanceof Error ? err.message : String(err);
    console.error('Dev dashboard:', message);
    return json(400, { error: message.slice(0, 300) });
  }
  return json(404, { error: 'Not found' });
}
