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
  driveFolderStatus, linkDriveIds, listDrafts, listPosts, listSamples, postFiles, promoteIdea, publishDrafts, publishPost, setVisibility,
  startRelease, removeSketchById, BRANCH, type DevEnv,
} from './dev';
import { addIdea, IdeaError, listIdeas } from './ideas';
import { listMessages, markMessage, MessageError } from './messages';
import { momentum, type MomentumEvent } from './momentum';
import { releaseNotes, releases, SKIP, ShipError, tickPromo } from './ship';
import { DriveError, listReleases } from './drive';
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
    const known = err instanceof HttpError || err instanceof IssueError || err instanceof IdeaError || err instanceof DriveError
      || err instanceof MessageError || err instanceof ShipError;
    const message = err instanceof Error ? err.message : String(err);
    if (!known) console.error('MCP tool:', message);
    return { content: [{ type: 'text', text: message.slice(0, 500) }], isError: true };
  }
}

const today = () => new Date().toISOString().slice(0, 10);
const READ = { readOnlyHint: true, openWorldHint: false } as const;
const WRITE = { readOnlyHint: false, destructiveHint: false, openWorldHint: false } as const;

const DAY = 86_400_000;
const PUBLIC_KINDS = new Set(['sketch', 'samples', 'post', 'release']);

/** YYYY-MM-DD of a time in a time zone (an IANA name like "Europe/Paris"); UTC if the name is unknown. */
function dayIn(timeZone: string) {
  let f: Intl.DateTimeFormat;
  try { f = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }); }
  catch { f = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }); }
  return (t: number) => f.format(new Date(t));
}

/** The same streak rule as the Launchpad (src/components/dev/Momentum.tsx): alive until midnight. */
function streakOf(events: MomentumEvent[], timeZone: string) {
  const day = dayIn(timeZone);
  const days = new Set(events.map(e => day(e.t)));
  const now = Date.now();
  const today = events.filter(e => day(e.t) === day(now)).length;
  let streak = 0;
  for (let t = today ? now : now - DAY; days.has(day(t)); t -= DAY) streak++;
  return { streak, today, alive: today > 0 };
}

/** The next archive post number: the highest `index:` in src/posts and its drafts. */
async function nextPostIndex(gh: GitHub): Promise<number> {
  const indexes = (await postFiles(gh)).map(f => Number(/^\s*index:\s*(\d+)/m.exec(f.text)?.[1] ?? 0));
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
        'capture_idea saves a private note to the idea inbox on /dev (nothing public); use it whenever the user says ' +
        '"save idea", "note this", "remember this idea" or similar. ' +
        'New sketches and archive posts you add are saved as hidden drafts: show the user what you made (list_drafts), and ' +
        'call publish_drafts only after they say yes in this chat. They can also publish them from /dev (Launchpad → Drafts). ' +
        'Edits to things already on the site commit straight to the website, which goes live about 2 minutes later. ' +
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
    description: `Saves an idea (text) or a demo placeholder (no audio; add audio later from ${SITE}/dev) for the Sketches page, as a hidden draft: it isn't on the site until publish_drafts (after the user says yes) or Publish in /dev.`,
    inputSchema: {
      kind: z.enum(['idea', 'demo']).optional().describe('Default: idea'),
      title: z.string().min(1).max(200),
      text: z.string().max(20_000).optional().describe('Blank line = new paragraph'),
      tags: z.array(z.string()).max(12).optional().describe('e.g. "120 BPM", "F minor", "WIP"'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('YYYY-MM-DD. Default: today'),
    },
    annotations: WRITE,
  }, ({ kind, title, text, tags, date }) => run(async () => {
    const r = await addTextSketch(gh, { kind: kind ?? 'idea', title, text: text ?? '', tags: tags ?? [], date: date ?? today() }, true);
    return { ...r, draft: true, note: 'Saved as a hidden draft. Ask the user, then publish_drafts with this id.', review: `${SITE}/dev#launchpad` };
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
      draft: z.literal(true).optional().describe('true takes the post off the site and keeps it as a draft. To publish a draft, use publish_drafts'),
    },
    annotations: { ...WRITE, idempotentHint: true },
  }, ({ slug, accent_color, highlighted, body, draft, ...rest }) => run(async () => {
    const r = await editPost(gh, slug, { ...rest, accentColor: accent_color, isSpecial: highlighted }, body, draft);
    return r.draft ? { ...r, note: 'Saved as a draft: not on the site' } : { ...r, url: `${SITE}/archive/${slug}`, live: 'in about 2 minutes' };
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
    const { samples, hidden } = await listSamples(gh, pack);
    const q = search?.toLowerCase();
    const found = q ? samples.filter(s => s.name.toLowerCase().includes(q)) : samples;
    const packs = [...new Set(samples.map(s => s.pack))];
    const hiddenIds = new Set(hidden.samples);
    return {
      total: found.length, packs: pack ? undefined : packs, hiddenPacks: hidden.packs,
      samples: found.slice(0, limit ?? 100).map(({ peaks: _peaks, ...s }) => ({ ...s, hidden: hiddenIds.has(s.id) || hidden.packs.includes(s.pack) })),
    };
  }));

  server.registerTool('set_samples_visibility', {
    title: 'Hide or show samples and packs',
    description: 'Hides packs and/or samples from /samples without deleting them, or shows them again. Hidden ones stay saved and editable in /dev.',
    inputSchema: {
      hidden: z.boolean().describe('true hides, false shows'),
      packs: z.array(z.string()).max(100).optional().describe('Pack ids'),
      sample_ids: z.array(z.number().int()).max(2000).optional(),
    },
    annotations: { ...WRITE, idempotentHint: true },
  }, ({ hidden, packs, sample_ids }) => run(() => setVisibility(gh, { hidden, packs, samples: sample_ids })));

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
    title: 'Write an archive post (draft)',
    description:
      `Writes a new post for ${SITE}/archive/<slug>, saved as a draft: it isn't on the site until publish_drafts (after the ` +
      'user says yes) or Publish in /dev. Text format: blank line between paragraphs, "## " headings, ' +
      '"- " list items, [links](https://...), **bold**. Interactive labs and images still need code.',
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
      description, accentColor: accent_color ?? '#ffaa00', index: await nextPostIndex(gh), draft: true,
    });
    return { ...r, note: 'Saved as a draft: not on the site. Ask the user, then publish_drafts with this slug.', review: `${SITE}/dev#launchpad` };
  }));

  // ---------- Drafts ----------

  server.registerTool('list_drafts', {
    title: 'List drafts',
    description: 'Everything saved but not on the site yet: draft archive posts (slug, title, date, tags, summary) and hidden sketches. Use get_post to read a draft post\'s text.',
    inputSchema: {},
    annotations: READ,
  }, () => run(async () => {
    const d = await listDrafts(gh);
    return {
      posts: d.posts.map(p => ({ slug: p.slug, title: p.meta.title, date: p.meta.date, tags: p.meta.tags, summary: p.meta.description })),
      sketches: d.sketches.map(({ hidden: _h, ...s }) => s),
      review: `${SITE}/dev#launchpad`,
    };
  }));

  server.registerTool('publish_drafts', {
    title: 'Publish drafts',
    description:
      'Puts draft posts and hidden sketches on the site (live about 2 minutes later). Only call this after the user has said yes ' +
      'to publishing these exact items in the chat. One commit per item, so each counts as a ship on the Launchpad.',
    inputSchema: {
      posts: z.array(z.string()).max(50).optional().describe('Draft post slugs (list_drafts)'),
      sketches: z.array(z.string()).max(50).optional().describe('Hidden sketch ids (list_drafts)'),
    },
    annotations: { ...WRITE, idempotentHint: true },
  }, ({ posts, sketches }) => run(async () => {
    const r = await publishDrafts(gh, { posts, sketches });
    return { ...r, published: r.published.map(p => ({ ...p, url: `${SITE}${p.url}` })), live: 'in about 2 minutes' };
  }));

  // ---------- Idea inbox (private) ----------

  server.registerTool('capture_idea', {
    title: 'Capture idea',
    description: 'Saves an idea to the private inbox on /dev (Launchpad tab). Nothing is published; the owner sorts it later into an issue, a sketch or a post.',
    inputSchema: {
      text: z.string().min(1).max(20_000).describe("The idea in the user's own words; keep their wording"),
      project: z.string().optional().describe('Repository name it belongs to, if clear (e.g. "data-bend"); call list_projects if unsure'),
    },
    annotations: WRITE,
  }, ({ text, project }) => run(async () => {
    const idea = await addIdea(env, { text, project, source: 'mcp' });
    return { saved: idea.id, inbox: `${SITE}/dev#launchpad` };
  }));

  server.registerTool('list_ideas', {
    title: 'List ideas',
    description: 'Ideas in the private /dev inbox (default), or the ones already promoted or binned. Files are listed by name only.',
    inputSchema: { status: z.enum(['inbox', 'promoted', 'binned']).optional() },
    annotations: READ,
  }, ({ status }) => run(async () => {
    const r = await listIdeas(env, status ?? 'inbox');
    return {
      count: r.count,
      ideas: r.ideas.map(i => ({
        id: i.id, text: i.text, project: i.project, created: new Date(i.created).toISOString(),
        files: i.files.map(f => f.name), promotedTo: i.promotedTo ?? undefined,
      })),
    };
  }));

  server.registerTool('promote_idea', {
    title: 'Promote idea',
    description: 'Turns an inbox idea into a GitHub issue (target "issue", needs repo) or a hidden sketch draft (target "sketch"; becomes a demo if the idea has an MP3; publish it with publish_drafts after the user says yes). Marks the idea as promoted.',
    inputSchema: {
      id: z.string().describe('Idea id from list_ideas'),
      target: z.enum(['issue', 'sketch']),
      title: z.string().min(1).max(200),
      text: z.string().max(20_000).optional().describe('Issue or sketch text; default: the idea text'),
      repo: z.string().optional().describe('For issues: repository name'),
    },
    annotations: WRITE,
  }, ({ id, target, title, text, repo }) => run(async () => {
    const ideas = await listIdeas(env, 'inbox', 500);
    const idea = ideas.ideas.find(i => i.id === id);
    return promoteIdea(env, gh, rest, owner, { id, target, title, text: text ?? idea?.text ?? '', repo, hidden: true });
  }));

  // ---------- Google Drive: releasing samples ----------

  server.registerTool('drive_folder_status', {
    title: 'Drive folder status',
    description: "Compares a sample pack's Google Drive folder (with its subfolders) with the samples on the site, by file name: audio files on Drive not on the site yet, samples without a Drive id (and whether a matching file exists), samples missing from Drive, and whether the folder is public.",
    inputSchema: { pack: z.string().describe('Pack id, e.g. "vrac" (list_samples shows pack ids)') },
    annotations: READ,
  }, ({ pack }) => run(async () => { const { driveFiles: _all, ...st } = await driveFolderStatus(env, gh, pack); return st; }));

  server.registerTool('link_drive_ids', {
    title: 'Link Drive ids',
    description: 'Fills in the missing Drive file id of every sample in a pack that has a file with the same name in the pack\'s Drive folder, so its download button works. One commit to the website.',
    inputSchema: { pack: z.string() },
    annotations: WRITE,
  }, ({ pack }) => run(() => linkDriveIds(env, gh, pack)));

  server.registerTool('start_release', {
    title: 'Start a sample release',
    description: "Queues the audio files in a pack's Drive folder (and its subfolders) that aren't on the site yet (all of them, or only `names`). Nothing is published yet: the owner opens /dev → Samples and presses Release, which makes the MP3 previews in the browser and publishes them with their Drive ids in one commit. Tell the user to do that.",
    inputSchema: {
      pack: z.string(),
      category: z.string().min(1).max(60).optional().describe('Category for all of them, e.g. "Kicks". Leave out to use each file\'s subfolder name as its category (one release per subfolder)'),
      names: z.array(z.string()).max(500).optional().describe('Exact file names to release; default: every new audio file in the folder'),
      max_preview_seconds: z.number().int().min(0).max(600).optional().describe('Cut long previews to this many seconds (0 = whole file)'),
    },
    annotations: WRITE,
  }, ({ pack, category, names, max_preview_seconds }) => run(() => startRelease(env, gh, { pack, category, names, maxSeconds: max_preview_seconds })));

  server.registerTool('list_queued_releases', {
    title: 'Queued releases',
    description: 'Sample releases waiting for the owner to press Release in /dev.',
    inputSchema: {},
    annotations: READ,
  }, () => run(async () => ({ releases: (await listReleases(env)).map(r => ({ id: r.id, pack: r.pack, category: r.category, files: r.files.length, queued: new Date(r.created).toISOString() })) })));

  // ---------- Contact messages ----------

  server.registerTool('list_messages', {
    title: 'List contact messages',
    description: 'Messages sent through the contact form on the site: not answered yet (default, oldest first) or answered. The owner replies by email; then mark_message_answered.',
    inputSchema: { status: z.enum(['unanswered', 'answered']).optional() },
    annotations: READ,
  }, ({ status }) => run(async () => {
    const r = await listMessages(env, status ?? 'unanswered');
    return {
      count: r.count,
      messages: r.messages.map(m => ({
        id: m.id, received: new Date(m.created).toISOString(), name: m.name, email: m.email, about: m.service, message: m.message,
        links: m.links || undefined, answered: m.answered ? new Date(m.answered).toISOString() : undefined,
      })),
    };
  }));

  server.registerTool('mark_message_answered', {
    title: 'Mark a message answered',
    description: 'Marks a contact message as answered (or, with answered: false, as waiting again). Only when the user says they replied.',
    inputSchema: { id: z.string().describe('From list_messages'), answered: z.boolean().optional().describe('Default: true') },
    annotations: { ...WRITE, idempotentHint: true },
  }, ({ id, answered }) => run(() => markMessage(env, { id, answered: answered ?? true })));

  // ---------- Momentum, promo, stats, releases ----------

  const loadMomentum = () => momentum(env, (q, v) => pg.graphql(q, v), owner, siteName);

  server.registerTool('momentum', {
    title: 'Momentum and nudges',
    description:
      'What the /dev Launchpad shows: the daily streak (alive until midnight in the given time zone), what shipped in the last 7 days, ' +
      'days since something public, and the nudges: open issues untouched for 3+ weeks, unanswered contact messages, ' +
      'samples queued for release, ships whose promo isn\'t done, and ideas waiting in the inbox.',
    inputSchema: {
      time_zone: z.string().optional().describe('IANA time zone of the user, e.g. "Europe/Paris". Default: UTC'),
    },
    annotations: READ,
  }, ({ time_zone }) => run(async () => {
    const [m, ideas] = await Promise.all([loadMomentum(), listIdeas(env, 'inbox', 1)]);
    const week = m.events.filter(e => e.t >= Date.now() - 7 * DAY);
    const lastPublic = [...m.events].reverse().find(e => PUBLIC_KINDS.has(e.kind));
    const promoOpen = m.promo?.items.filter(i => !i.done) ?? [];
    return {
      ...streakOf(m.events, time_zone ?? 'UTC'),
      daysSincePublic: lastPublic ? Math.floor((Date.now() - lastPublic.t) / DAY) : null,
      lastSevenDays: week.reverse().map(e => ({ when: new Date(e.t).toISOString(), kind: e.kind, what: e.label })),
      nudges: {
        staleIssues: { count: m.staleCount, olderThanDays: m.staleDays, oldest: m.stale.map(i => ({ repo: i.repo, number: i.number, title: i.title, updated: i.updated })) },
        unansweredMessages: m.messages?.unanswered ?? null,
        samplesQueuedForRelease: m.queuedSamples,
        promoNotDone: promoOpen.length,
        ideasInInbox: ideas.count.inbox,
      },
      errors: m.errors.length ? m.errors : undefined,
    };
  }));

  server.registerTool('promo_checklist', {
    title: 'Promo checklist',
    description: 'Every public ship (sketch, samples, post, release) since promo tracking began, with the owner\'s channels ticked or not. Default: only the ones not done.',
    inputSchema: { include_done: z.boolean().optional() },
    annotations: READ,
  }, ({ include_done }) => run(async () => {
    const m = await loadMomentum();
    if (!m.promo) throw new HttpError(502, m.errors.join('; ') || 'Promo is not available');
    const { channels, items } = m.promo;
    return {
      channels,
      items: items.filter(i => include_done || !i.done).map(i => ({
        ref: i.ref, kind: i.kind, what: i.label, shipped: new Date(i.t).toISOString(),
        ticked: Object.keys(i.ticks).filter(c => c !== SKIP), notDone: i.skipped ? [] : channels.filter(c => !(c in i.ticks)),
        noPromoNeeded: i.skipped || undefined, done: i.done,
      })),
    };
  }));

  server.registerTool('tick_promo', {
    title: 'Tick off promo',
    description: `Marks channels as done (or not) for one ship from promo_checklist, after the user says they posted there. Channel "${SKIP}" means "no promo needed". A tick counts toward the streak.`,
    inputSchema: {
      ref: z.string().url().describe('The ship\'s ref from promo_checklist'),
      channels: z.array(z.string().min(1).max(40)).min(1).max(12),
      done: z.boolean().optional().describe('Default: true; false un-ticks'),
      what: z.string().max(200).optional().describe('The ship\'s name (promo_checklist "what"), shown on the Launchpad'),
    },
    annotations: { ...WRITE, idempotentHint: true },
  }, ({ ref, channels, done, what }) => run(async () => {
    for (const channel of channels) await tickPromo(env, { ref, channel, done: done ?? true, label: what ?? '' });
    return { ref, channels, done: done ?? true };
  }));

  server.registerTool('play_stats', {
    title: 'Plays and downloads',
    description:
      'Counts for the last 7 and 30 days: sample plays and downloads (top samples, and totals per pack), full-pack downloads, ' +
      'DATABEND downloads, labs started and contact messages. Nothing about visitors is stored.',
    inputSchema: {},
    annotations: READ,
  }, () => run(async () => {
    const counts = await eventCounts(env);
    if (!counts.configured) return { configured: false, note: 'CF_API_TOKEN / CF_ACCOUNT_ID are not set (docs/HOSTING.md)' };
    if (!counts.ok) throw new HttpError(502, counts.error);
    const { samples } = await listSamples(gh);
    const packOf = new Map(samples.map(s => [String(s.id), s.pack]));
    return {
      events: counts.events.map(e => {
        const perPack = e.event.startsWith('sample_')
          ? Object.values(e.top.reduce<Record<string, { pack: string; week: number; month: number }>>((acc, t) => {
            const pack = packOf.get(t.key.split(' ')[0]) ?? 'unknown';
            const p = (acc[pack] ??= { pack, week: 0, month: 0 });
            p.week += t.week; p.month += t.month;
            return acc;
          }, {})).sort((a, b) => b.month - a.month)
          : undefined;
        return { event: e.event, label: e.label, last7Days: e.week, last30Days: e.month, top: e.top, perPackFromTop: perPack };
      }),
    };
  }));

  server.registerTool('list_releases', {
    title: 'Releases',
    description: 'Every repository with GitHub releases: the last 5 releases each, publish date, and downloads per release and per file.',
    inputSchema: {},
    annotations: READ,
  }, () => run(() => releases((q, v) => pg.graphql(q, v), owner)));

  server.registerTool('release_notes', {
    title: 'Changelog draft',
    description:
      'A changelog draft for the next release of a repository: issues closed as done and pull requests merged since its latest release ' +
      '(or since a date). Returns markdown to edit, plus the link to GitHub\'s new-release page. Nothing is published.',
    inputSchema: {
      repo: z.string(),
      since: z.string().optional().describe('ISO date; default: when the latest release was published'),
    },
    annotations: READ,
  }, ({ repo, since }) => run(async () => {
    const full = ownRepo(repo, owner);
    let from = since ?? null;
    let latest: { tag: string; published: string } | null = null;
    if (!from) {
      // 404 = no releases yet: everything counts.
      const r = await pg.get<{ tag_name: string; published_at: string }>(`/repos/${full}/releases/latest`);
      if (r.data) {
        latest = { tag: r.data.tag_name, published: r.data.published_at };
        from = r.data.published_at;
      }
    }
    const notes = await releaseNotes((q, v) => pg.graphql(q, v), full, from);
    return { ...notes, latestRelease: latest, newReleasePage: `https://github.com/${full}/releases/new` };
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
