/**
 * The private idea inbox on /dev (Launchpad tab) and the MCP `capture_idea` tool. Ideas live in Cloudflare D1
 * (binding IDEAS_DB), never in the website repository, so nothing here is public until you promote it to an
 * issue, a sketch or a post.
 *
 * An idea is some text plus any number of files (audio as MP3, images, anything else). Files are stored in D1 in
 * chunks, because one D1 row holds at most 2 MB.
 */

export interface IdeasEnv {
  IDEAS_DB?: D1Database;
}

export type IdeaStatus = 'inbox' | 'promoted' | 'binned';

export interface IdeaFile { id: string; name: string; type: string; size: number }
export interface Idea {
  id: string;
  text: string;
  project: string | null;
  status: IdeaStatus;
  /** Where it went when promoted: { kind: "issue" | "sketch" | "post", label, url }. */
  promotedTo: { kind: string; label: string; url: string } | null;
  source: string;
  created: number;
  updated: number;
  files: IdeaFile[];
}

export class IdeaError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const MAX_FILE_BYTES = 25_000_000;
const CHUNK = 1_900_000;
const MAX_TEXT = 20_000;
const STATUSES: IdeaStatus[] = ['inbox', 'promoted', 'binned'];

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS ideas (
    id TEXT PRIMARY KEY, text TEXT NOT NULL, project TEXT, status TEXT NOT NULL DEFAULT 'inbox',
    promoted_to TEXT, source TEXT NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS ideas_status ON ideas (status, created)',
  `CREATE TABLE IF NOT EXISTS idea_files (
    id TEXT PRIMARY KEY, idea_id TEXT NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL, size INTEGER NOT NULL, created INTEGER NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS idea_files_idea ON idea_files (idea_id)',
  'CREATE TABLE IF NOT EXISTS idea_chunks (file_id TEXT NOT NULL, n INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY (file_id, n))',
  // Promo checklists (worker/ship.ts): one row per ticked channel of a shipped thing ("skip" = no promo needed).
  `CREATE TABLE IF NOT EXISTS promo_ticks (
    ref TEXT NOT NULL, channel TEXT NOT NULL, label TEXT NOT NULL, t INTEGER NOT NULL, PRIMARY KEY (ref, channel))`,
  'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
];

/** Tables are created on first use in each Worker instance (cheap: IF NOT EXISTS), so no migration step is needed. */
let ready: Promise<unknown> | null = null;

/** Waits for the tables (call before the first query in a request). */
export const dbReady = () => ready;

export function ideasDb(env: IdeasEnv): D1Database {
  const db = env.IDEAS_DB;
  if (!db) throw new IdeaError(503, 'The idea inbox has no database (IDEAS_DB binding missing; see docs/HOSTING.md).');
  if (!ready) ready = db.batch(SCHEMA.map(s => db.prepare(s))).catch(err => { ready = null; throw err; });
  return db;
}

const id = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16);

function cleanText(v: unknown): string {
  const s = typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim() : '';
  if (s.length > MAX_TEXT) throw new IdeaError(400, `The idea is longer than ${MAX_TEXT} characters`);
  return s;
}

function cleanProject(v: unknown): string | null {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string' || !/^[A-Za-z0-9._-]{1,100}$/.test(v)) throw new IdeaError(400, 'Unknown project');
  return v;
}

/** File names are shown and sent back in a header: keep them plain. */
const cleanName = (s: string) => s.replace(/[\x00-\x1f"\\/]+/g, ' ').trim().slice(0, 120) || 'file';
const cleanType = (s: string) => (/^[a-z]+\/[a-z0-9.+-]+$/i.test(s) ? s.toLowerCase() : 'application/octet-stream');

type Row = { id: string; text: string; project: string | null; status: IdeaStatus; promoted_to: string | null; source: string; created: number; updated: number };
type FileRow = IdeaFile & { idea_id: string };

function toIdea(r: Row, files: FileRow[]): Idea {
  return {
    id: r.id, text: r.text, project: r.project, status: r.status, source: r.source, created: r.created, updated: r.updated,
    promotedTo: r.promoted_to ? JSON.parse(r.promoted_to) : null,
    files: files.filter(f => f.idea_id === r.id).map(({ id, name, type, size }) => ({ id, name, type, size })),
  };
}

export async function listIdeas(env: IdeasEnv, status: unknown = 'inbox', limit = 200) {
  const db = ideasDb(env);
  await ready;
  const s = STATUSES.includes(status as IdeaStatus) ? (status as IdeaStatus) : 'inbox';
  const order = s === 'inbox' ? 'created DESC' : 'updated DESC';
  const rows = (await db.prepare(`SELECT * FROM ideas WHERE status = ? ORDER BY ${order} LIMIT ?`).bind(s, Math.min(500, limit)).all<Row>()).results;
  const files = rows.length
    ? (await db.prepare(`SELECT id, idea_id, name, type, size FROM idea_files WHERE idea_id IN (${rows.map(() => '?').join(',')}) ORDER BY created`)
      .bind(...rows.map(r => r.id)).all<FileRow>()).results
    : [];
  const counts = (await db.prepare('SELECT status, COUNT(*) AS n, MIN(created) AS oldest FROM ideas GROUP BY status').all<{ status: IdeaStatus; n: number; oldest: number }>()).results;
  const count = Object.fromEntries(STATUSES.map(st => [st, counts.find(c => c.status === st)?.n ?? 0])) as Record<IdeaStatus, number>;
  const oldestInbox = counts.find(c => c.status === 'inbox')?.oldest ?? null;
  return { ideas: rows.map(r => toIdea(r, files)), count, oldestInbox };
}

export async function getIdea(env: IdeasEnv, ideaId: unknown): Promise<Idea> {
  const db = ideasDb(env);
  await ready;
  const r = await db.prepare('SELECT * FROM ideas WHERE id = ?').bind(String(ideaId)).first<Row>();
  if (!r) throw new IdeaError(404, 'No such idea');
  const files = (await db.prepare('SELECT id, idea_id, name, type, size FROM idea_files WHERE idea_id = ? ORDER BY created').bind(r.id).all<FileRow>()).results;
  return toIdea(r, files);
}

/** Saves a new idea with its files. Needs text or at least one file. */
export async function addIdea(env: IdeasEnv, input: { text?: unknown; project?: unknown; source: string }, files: File[] = []): Promise<Idea> {
  const db = ideasDb(env);
  await ready;
  const text = cleanText(input.text);
  const project = cleanProject(input.project);
  if (!text && !files.length) throw new IdeaError(400, 'Type something or add a file');
  if (files.length > 20) throw new IdeaError(400, 'At most 20 files per idea');
  for (const f of files) if (f.size > MAX_FILE_BYTES) throw new IdeaError(413, `${f.name} is over ${MAX_FILE_BYTES / 1e6} MB`);

  const now = Date.now();
  const ideaId = id();
  const statements = [
    db.prepare('INSERT INTO ideas (id, text, project, status, source, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(ideaId, text, project, 'inbox', input.source, now, now),
  ];
  for (const [i, f] of files.entries()) {
    const fileId = id();
    const bytes = new Uint8Array(await f.arrayBuffer());
    statements.push(db.prepare('INSERT INTO idea_files (id, idea_id, name, type, size, created) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(fileId, ideaId, cleanName(f.name), cleanType(f.type), bytes.length, now + i));
    for (let n = 0; n * CHUNK < bytes.length; n++) {
      statements.push(db.prepare('INSERT INTO idea_chunks (file_id, n, data) VALUES (?, ?, ?)').bind(fileId, n, bytes.subarray(n * CHUNK, (n + 1) * CHUNK)));
    }
  }
  await db.batch(statements); // one transaction: all of it or nothing
  return getIdea(env, ideaId);
}

/** Changes text, project or status. `promotedTo` is set with status "promoted" and cleared otherwise. */
export async function updateIdea(env: IdeasEnv, input: Record<string, unknown>): Promise<Idea> {
  const db = ideasDb(env);
  const current = await getIdea(env, input.id);
  const text = 'text' in input ? cleanText(input.text) : current.text;
  const project = 'project' in input ? cleanProject(input.project) : current.project;
  const status = 'status' in input ? (STATUSES.includes(input.status as IdeaStatus) ? (input.status as IdeaStatus) : null) : current.status;
  if (!status) throw new IdeaError(400, 'Unknown status');
  if (!text && !current.files.length) throw new IdeaError(400, 'An idea without files needs some text');
  let promotedTo = status === 'promoted' ? current.promotedTo : null;
  if (status === 'promoted' && input.promotedTo) {
    const p = input.promotedTo as Record<string, unknown>;
    promotedTo = { kind: String(p.kind ?? '').slice(0, 20), label: String(p.label ?? '').slice(0, 200), url: String(p.url ?? '').slice(0, 500) };
  }
  await db.prepare('UPDATE ideas SET text = ?, project = ?, status = ?, promoted_to = ?, updated = ? WHERE id = ?')
    .bind(text, project, status, promotedTo ? JSON.stringify(promotedTo) : null, Date.now(), current.id).run();
  return getIdea(env, current.id);
}

/** Deletes an idea and its files for good. Only binned ideas, so nothing in the inbox goes by accident. */
export async function deleteIdea(env: IdeasEnv, ideaId: unknown) {
  const db = ideasDb(env);
  const idea = await getIdea(env, ideaId);
  if (idea.status !== 'binned') throw new IdeaError(400, 'Bin the idea first');
  await db.batch([
    ...idea.files.map(f => db.prepare('DELETE FROM idea_chunks WHERE file_id = ?').bind(f.id)),
    db.prepare('DELETE FROM idea_files WHERE idea_id = ?').bind(idea.id),
    db.prepare('DELETE FROM ideas WHERE id = ?').bind(idea.id),
  ]);
  return { deleted: idea.id };
}

export async function readIdeaFile(env: IdeasEnv, fileId: unknown) {
  const db = ideasDb(env);
  await ready;
  const f = await db.prepare('SELECT id, idea_id, name, type, size FROM idea_files WHERE id = ?').bind(String(fileId)).first<FileRow>();
  if (!f) throw new IdeaError(404, 'No such file');
  const chunks = (await db.prepare('SELECT data FROM idea_chunks WHERE file_id = ? ORDER BY n').bind(f.id).all<{ data: ArrayBuffer | number[] }>()).results;
  const bytes = new Uint8Array(f.size);
  let at = 0;
  for (const c of chunks) {
    const part = c.data instanceof ArrayBuffer ? new Uint8Array(c.data) : Uint8Array.from(c.data);
    bytes.set(part, at);
    at += part.length;
  }
  return { file: f as IdeaFile & { idea_id: string }, bytes };
}

/** Types the browser may show inline; anything else (HTML, SVG, PDFs…) downloads, so it can't run on this site. */
const INLINE = /^(audio\/(mpeg|mp4|wav|x-wav|ogg|webm|aac|flac)|image\/(png|jpeg|gif|webp|avif))$/;

/** A file as an HTTP response, with Range support (Safari won't play audio without it). */
export async function ideaFileResponse(env: IdeasEnv, fileId: unknown, request: Request): Promise<Response> {
  const { file, bytes } = await readIdeaFile(env, fileId);
  const inline = INLINE.test(file.type);
  const headers: Record<string, string> = {
    'Content-Type': inline ? file.type : 'application/octet-stream',
    'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    'Cache-Control': 'private, max-age=86400',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'Accept-Ranges': 'bytes',
  };
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('Range') ?? '');
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, bytes.length - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), bytes.length - 1) : bytes.length - 1;
    if (start >= bytes.length || start > end) {
      return new Response(null, { status: 416, headers: { ...headers, 'Content-Range': `bytes */${bytes.length}` } });
    }
    return new Response(bytes.slice(start, end + 1), { status: 206, headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${bytes.length}` } });
  }
  return new Response(bytes, { headers });
}
