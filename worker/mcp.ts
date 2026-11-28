/**
 * MCP connector for the /dev dashboard: https://spacekidlabs.com/mcp
 *
 * The same things the dashboard does, as tools an AI client (Claude) can call: your GitHub projects and their
 * activity, issues in any project, the website's traffic, sketches and archive posts. Every call needs an OAuth
 * access token from worker/oauth.ts (signed in with DEV_PASSWORD); the tokens and secrets never reach the client.
 *
 * Stateless Streamable HTTP: each POST builds a fresh server, so no Durable Objects are needed (free plan).
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import {
  addTextSketch, changeSketch, cleanEnv, content, deletePost, deleteSamples, editPost, editSamples, getPost, GitHub, HttpError,
  listPosts, listSamples, publishPost, removeSketchById, BRANCH, type DevEnv,
} from './dev';
import { commentIssue, IssueError, listAllIssues, listIssues, ownRepo, readIssue, saveIssue, type Rest } from './issues';
import { githubStats, projects } from './stats';
import { cloudflareAnalytics } from './analytics';
import { eventCounts } from './events';
import { slugify } from './content';

const SITE = 'https://spacekidlabs.com';

type Result = { content: Array<{ type: 'text'; text: string }>; isError?: boolean };
const ok = (data: unknown): Result => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 1) }] });

/** Runs a tool; known errors (GitHub refused, bad input) go back as a readable tool error, not a crash. */
async function run(fn: () => Promise<unknown>): Promise<Result> {
  try {
    return ok(await fn());
  } catch (err) {
    const message = err instanceof HttpError || err instanceof IssueError || err instanceof Error ? err.message : String(err);
    if (!(err instanceof HttpError || err instanceof IssueError)) console.error('MCP tool:', message);
    return { content: [{ type: 'text', text: message.slice(0, 500) }], isError: true };
  }
}

const today = () => new Date().toISOString().slice(0, 10);
const READ = { readOnlyHint: true, openWorldHint: false } as const;
const WRITE = { readOnlyHint: false, destructiveHint: false, openWorldHint: false } as const;

/** The next archive post number: the highest `index:` in src/posts, read in one GraphQL query. */
async function nextPostIndex(gh: GitHub): Promise<number> {
  const [owner, name] = gh.repo.split('/');
  const data = await gh.graphql<{ repository: { object: { entries: Array<{ name: string; object: { text: string | null } | null }> } | null } }>(
    `query ($owner: String!, $name: String!, $expr: String!) {
      repository(owner: $owner, name: $name) { object(expression: $expr) { ... on Tree { entries { name object { ... on Blob { text } } } } } }
    }`,
    { owner, name, expr: `${BRANCH}:src/posts` },
  );
  const indexes = (data.repository.object?.entries ?? [])
    .filter(e => e.name.endsWith('.tsx'))
    .map(e => Number(/^\s*index:\s*(\d+)/m.exec(e.object?.text ?? '')?.[1] ?? 0));
  return Math.max(0, ...indexes) + 1;
}

export function buildServer(rawEnv: DevEnv): McpServer {
  const env = cleanEnv(rawEnv);
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) throw new HttpError(503, 'GITHUB_TOKEN or GITHUB_REPO is not set');
  const gh = new GitHub({ GITHUB_TOKEN: env.GITHUB_TOKEN, GITHUB_REPO: env.GITHUB_REPO, GITHUB_API: env.GITHUB_API });
  const pg = new GitHub({ GITHUB_TOKEN: env.GITHUB_PROJECTS_TOKEN || env.GITHUB_TOKEN, GITHUB_REPO: env.GITHUB_REPO, GITHUB_API: env.GITHUB_API });
  const owner = env.GITHUB_REPO.split('/')[0];
  const siteName = env.GITHUB_REPO.split('/')[1];
  const rest: Rest = (m, p, b) => pg.rest(m, p, b);
  const get = <T,>(p: string) => pg.get<T>(p);

  const server = new McpServer(
    { name: 'spacekidlabs-dev', version: '1.0.0' },
    {
      instructions:
        `Owner tools for SPACEKID LABS: ${owner}'s GitHub projects and issues, and the website ${SITE}. ` +
        `Repository names are short names under ${owner} (e.g. "${siteName}", "data-bend"); call list_projects to see them. ` +
        'Sketch, archive and sample tools commit to the website, which goes live about 2 minutes later. ' +
        'Deleting asks for nothing more, so confirm with the user before delete_post, delete_sketch or delete_samples.',
    },
  );

  // ---------- Projects ----------

  server.registerTool('list_projects', {
    title: 'List projects',
    description: `All of ${owner}'s GitHub repositories, newest push first: name, description, language, visibility, last push, open issues + PRs, topics.`,
    inputSchema: { include_archived: z.boolean().optional().describe('Also list archived repositories and forks') },
    annotations: READ,
  }, ({ include_archived }) => run(async () => {
    const r = await projects(get, owner);
    if (!r.ok) throw new HttpError(502, r.error);
    return {
      privateReposVisible: !r.limited,
      projects: r.items.filter(p => include_archived || (!p.archived && !p.fork)).map(p => ({
        name: p.name, description: p.description, language: p.language, private: p.private, archived: p.archived || undefined,
        lastPush: p.pushedAt, openIssuesAndPrs: p.openIssues, stars: p.stars || undefined, topics: p.topics, url: p.url,
      })),
    };
  }));

  server.registerTool('project_activity', {
    title: 'Project activity',
    description: 'GitHub activity of one project: pushes per week (12 weeks), recent commits, issues, pull requests, Actions runs, releases and tags.',
    inputSchema: { repo: z.string().describe('Repository name, e.g. "xen"') },
    annotations: READ,
  }, ({ repo }) => run(async () => {
    const full = ownRepo(repo, owner);
    return githubStats(get, full, full === env.GITHUB_REPO);
  }));

  // ---------- Issues ----------

  server.registerTool('list_issues', {
    title: 'List issues',
    description: 'Issues of one project, or of all projects when repo is left out. Pull requests are not included.',
    inputSchema: {
      repo: z.string().optional().describe('Repository name; leave out for all projects'),
      state: z.enum(['open', 'closed', 'all']).optional().describe('Default: open'),
    },
    annotations: READ,
  }, ({ repo, state }) => run(async () => {
    const r = repo ? await listIssues(rest, ownRepo(repo, owner), state) : await listAllIssues(rest, owner, state);
    // Bodies make the list long; get_issue has the full text.
    return { issues: r.issues.map(({ body, ...i }) => ({ ...i, labels: i.labels.map(l => l.name), preview: body.slice(0, 160) })), labels: r.labels.map(l => l.name) };
  }));

  server.registerTool('get_issue', {
    title: 'Read an issue',
    description: 'One issue with its full text, labels, state and all comments, plus the labels that exist in that project.',
    inputSchema: { repo: z.string(), number: z.number().int().positive() },
    annotations: READ,
  }, ({ repo, number }) => run(() => readIssue(rest, ownRepo(repo, owner), number)));

  server.registerTool('create_issue', {
    title: 'Create an issue',
    description: 'Opens a new issue in a project. Labels that don\'t exist yet are created.',
    inputSchema: {
      repo: z.string(),
      title: z.string().min(1).max(256),
      body: z.string().max(60_000).optional().describe('Markdown'),
      labels: z.array(z.string()).max(20).optional(),
    },
    annotations: WRITE,
  }, ({ repo, title, body, labels }) => run(() => saveIssue(rest, ownRepo(repo, owner), { title, body: body ?? '', labels: labels ?? [] })));

  server.registerTool('update_issue', {
    title: 'Edit, close or reopen an issue',
    description: 'Changes an issue\'s title, text or labels (labels replace the current set), and/or closes or reopens it.',
    inputSchema: {
      repo: z.string(),
      number: z.number().int().positive(),
      title: z.string().min(1).max(256).optional(),
      body: z.string().max(60_000).optional(),
      labels: z.array(z.string()).max(20).optional().describe('The full new set of labels'),
      state: z.enum(['open', 'closed']).optional(),
      close_reason: z.enum(['completed', 'not_planned']).optional().describe('When closing. Default: completed'),
    },
    annotations: { ...WRITE, idempotentHint: true },
  }, ({ repo, number, title, body, labels, state, close_reason }) => run(() => {
    const input: Record<string, unknown> = { number };
    if (title !== undefined) input.title = title;
    if (body !== undefined) input.body = body;
    if (labels !== undefined) input.labels = labels;
    if (state) input.state = state;
    if (close_reason) input.reason = close_reason;
    return saveIssue(rest, ownRepo(repo, owner), input);
  }));

  server.registerTool('comment_on_issue', {
    title: 'Comment on an issue',
    description: 'Adds a comment (markdown) to an issue.',
    inputSchema: { repo: z.string(), number: z.number().int().positive(), body: z.string().min(1).max(60_000) },
    annotations: WRITE,
  }, ({ repo, number, body }) => run(() => commentIssue(rest, ownRepo(repo, owner), { number, body })));

  // ---------- Website ----------

  server.registerTool('site_traffic', {
    title: 'Website traffic',
    description: `Cloudflare analytics for ${SITE}: visitors, page views, cache rate, bytes, daily page views, top pages (last 24 h), countries, browsers, status codes, /api Worker calls, and \`events\`: counts for the last 7 and 30 days of sample plays and downloads (by sample id), full-pack downloads (by pack), DATABEND downloads (by file), labs started (by lab) and contact messages sent.`,
    inputSchema: { days: z.union([z.literal(7), z.literal(30)]).optional().describe('Default: 7') },
    annotations: READ,
  }, ({ days }) => run(async () => {
    const [traffic, events] = await Promise.all([cloudflareAnalytics(env, days ?? 7), eventCounts(env)]);
    return { ...traffic, events };
  }));

  server.registerTool('list_sketches', {
    title: 'List sketches',
    description: `Demos and ideas on ${SITE}/sketches, as they are on GitHub now (the live site may be a deploy behind).`,
    inputSchema: {},
    annotations: READ,
  }, () => run(() => content(gh)));

  server.registerTool('add_sketch', {
    title: 'Add a sketch',
    description: `Adds an idea (text) or a demo placeholder (no audio; add audio later from ${SITE}/dev) to the Sketches page. Commits to the website.`,
    inputSchema: {
      kind: z.enum(['idea', 'demo']).optional().describe('Default: idea'),
      title: z.string().min(1).max(200),
      text: z.string().max(20_000).optional().describe('Blank line = new paragraph'),
      tags: z.array(z.string()).max(12).optional().describe('e.g. "120 BPM", "F minor", "WIP"'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('YYYY-MM-DD. Default: today'),
    },
    annotations: WRITE,
  }, ({ kind, title, text, tags, date }) => run(async () => {
    const r = await addTextSketch(gh, { kind: kind ?? 'idea', title, text: text ?? '', tags: tags ?? [], date: date ?? today() });
    return { ...r, url: `${SITE}/sketches#${r.id}`, live: 'in about 2 minutes' };
  }));

  server.registerTool('delete_sketch', {
    title: 'Delete a sketch',
    description: 'Removes a sketch (and its audio) from the website by id (see list_sketches). It stays in the Git history.',
    inputSchema: { id: z.string().min(1) },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  }, ({ id }) => run(() => removeSketchById(gh, id)));

  server.registerTool('update_sketch', {
    title: 'Edit a sketch',
    description: 'Changes a sketch\'s kind, title, date, text or tags (fields left out stay as they are). Can also remove its audio. New audio has to be uploaded from /dev. Commits to the website.',
    inputSchema: {
      id: z.string().min(1).describe('From list_sketches'),
      kind: z.enum(['idea', 'demo']).optional(),
      title: z.string().min(1).max(200).optional(),
      text: z.string().max(20_000).optional(),
      tags: z.array(z.string()).max(12).optional().describe('The full new set of tags'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      remove_audio: z.boolean().optional(),
    },
    annotations: { ...WRITE, idempotentHint: true },
  }, ({ id, remove_audio, ...patch }) => run(async () => {
    const current = (await content(gh)).sketches.find((s: { id: string }) => s.id === id) as
      | { kind: 'demo' | 'idea'; title: string; date: string; text?: string; tags?: string[] } | undefined;
    if (!current) throw new HttpError(404, `No sketch with id "${id}"`);
    const next = {
      kind: patch.kind ?? current.kind, title: patch.title ?? current.title, date: patch.date ?? current.date,
      text: patch.text ?? current.text ?? '', tags: patch.tags ?? current.tags ?? [],
    };
    const r = await changeSketch(gh, id, next, remove_audio || next.kind === 'idea' ? 'remove' : 'keep');
    return { ...r, url: `${SITE}/sketches#${id}`, live: 'in about 2 minutes' };
  }));

  // ---------- Archive ----------

  server.registerTool('list_posts', {
    title: 'List archive posts',
    description: `Every post on ${SITE}/archive: slug, title, date, tags, order (index), colour, summary; whether its text is editable (posts written in /dev or with publish_archive_post) or hand-written code; and which posts link to it.`,
    inputSchema: {},
    annotations: READ,
  }, () => run(() => listPosts(gh)));

  server.registerTool('get_post', {
    title: 'Read an archive post',
    description: 'One post\'s details and, if it was written in the dashboard, its plain text (source). Hand-written posts return source: null.',
    inputSchema: { slug: z.string().min(1) },
    annotations: READ,
  }, ({ slug }) => run(() => getPost(gh, slug)));

  server.registerTool('update_post', {
    title: 'Edit an archive post',
    description:
      'Changes a post\'s title, date, tags, order, colour, summary or highlighted state (fields left out stay). The text (body) can only be ' +
      'replaced for posts written in the dashboard; hand-written posts refuse it. The slug (URL) never changes. Commits to the website.',
    inputSchema: {
      slug: z.string().min(1),
      title: z.string().min(1).max(200).optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      tags: z.array(z.string()).max(8).optional().describe('The full new set of tags'),
      index: z.number().int().min(0).optional().describe('Order in the archive; higher shows first'),
      accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional().describe('null removes it'),
      description: z.string().max(300).nullable().optional().describe('null removes it'),
      highlighted: z.boolean().optional(),
      body: z.string().min(1).max(100_000).optional().describe('New text, same format as publish_archive_post'),
    },
    annotations: { ...WRITE, idempotentHint: true },
  }, ({ slug, accent_color, highlighted, body, ...rest }) => run(async () => {
    const r = await editPost(gh, slug, { ...rest, accentColor: accent_color, isSpecial: highlighted }, body);
    return { ...r, url: `${SITE}/archive/${slug}`, live: 'in about 2 minutes' };
  }));

  server.registerTool('delete_post', {
    title: 'Delete an archive post',
    description: 'Removes a post from the website (it stays in the Git history). Check list_posts first: links from other posts to it will break.',
    inputSchema: { slug: z.string().min(1) },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  }, ({ slug }) => run(() => deletePost(gh, slug)));

  // ---------- Samples ----------

  server.registerTool('list_samples', {
    title: 'List samples',
    description: 'Samples on the website, from GitHub (newest). Filter by pack id and/or a name search. Pack ids: raw-sessions, vrac, cybernetics, drum-hits-2, shlims, one-shots, trap-tape, databend, and any others.',
    inputSchema: {
      pack: z.string().optional(),
      search: z.string().optional().describe('Part of the name'),
      limit: z.number().int().min(1).max(500).optional().describe('Default: 100'),
    },
    annotations: READ,
  }, ({ pack, search, limit }) => run(async () => {
    const { samples } = await listSamples(gh, pack);
    const q = search?.toLowerCase();
    const found = q ? samples.filter(s => s.name.toLowerCase().includes(q)) : samples;
    const packs = [...new Set(samples.map(s => s.pack))];
    return { total: found.length, packs: pack ? undefined : packs, samples: found.slice(0, limit ?? 100) };
  }));

  server.registerTool('update_samples', {
    title: 'Edit samples',
    description: 'Renames samples, changes their category or pack, or sets their Google Drive file ID (download button). One commit for all changes.',
    inputSchema: {
      changes: z.array(z.object({
        id: z.number().int(),
        name: z.string().min(1).max(120).optional(),
        category: z.string().min(1).max(60).optional(),
        pack: z.string().optional(),
        drive_id: z.string().optional().describe('Empty string removes the download link'),
      })).min(1).max(500),
    },
    annotations: { ...WRITE, idempotentHint: true },
  }, ({ changes }) => run(() => editSamples(gh, changes.map(({ drive_id, ...c }) => ({ ...c, driveId: drive_id })))));

  server.registerTool('delete_samples', {
    title: 'Delete samples',
    description: 'Removes samples and their MP3 previews from the website. The originals on Google Drive aren\'t touched.',
    inputSchema: { ids: z.array(z.number().int()).min(1).max(500) },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  }, ({ ids }) => run(() => deleteSamples(gh, ids)));

  server.registerTool('publish_archive_post', {
    title: 'Publish an archive post',
    description:
      `Publishes a new post at ${SITE}/archive/<slug>. Text format: blank line between paragraphs, "## " headings, ` +
      '"- " list items, [links](https://...), **bold**. Interactive labs and images still need code. Commits to the website.',
    inputSchema: {
      title: z.string().min(1).max(200),
      body: z.string().min(1).max(100_000),
      slug: z.string().optional().describe('URL name; default: from the title'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('YYYY-MM-DD. Default: today'),
      tags: z.array(z.string()).max(12).optional(),
      description: z.string().max(300).optional().describe('One line for link previews; default: the first paragraph'),
      accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().describe('Default: #ffaa00'),
    },
    annotations: WRITE,
  }, ({ title, body, slug, date, tags, description, accent_color }) => run(async () => {
    const r = await publishPost(gh, {
      title, body, slug: slug ? slugify(slug) : slugify(title), date: date ?? today(), tags: tags ?? [],
      description, accentColor: accent_color ?? '#ffaa00', index: await nextPostIndex(gh),
    });
    return { ...r, url: `${SITE}/archive/${r.slug}`, live: 'in about 2 minutes' };
  }));

  return server;
}

/** POST /mcp (after the OAuth check). One stateless request, JSON response. */
export async function handleMcp(request: Request, env: DevEnv): Promise<Response> {
  if (request.method !== 'POST') {
    // No server-to-client stream in stateless mode.
    return new Response(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed' }, id: null }), {
      status: 405, headers: { 'Content-Type': 'application/json', Allow: 'POST' },
    });
  }
  const server = buildServer(env);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(request);
}
