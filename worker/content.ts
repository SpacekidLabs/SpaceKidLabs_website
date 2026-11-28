/**
 * Pure text helpers for the /dev dashboard: they take a repo file's current text and return the new text.
 * No network or Worker APIs here, so they can be tested with `npx tsx` (see scripts/test-dev-content.ts).
 */
import { listMarker, parseBody, POST_CLASSES, type Inline } from '../src/lib/postText';

/** "Night Drive (v2)" -> "night-drive-v2" */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\.(wav|mp3|aif|aiff|flac|ogg|m4a)$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/** First of base, base-2, base-3... not in `taken`. */
export function uniqueName(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// ---------- Sketches (src/data/sketches.json) ----------

export interface SketchInput {
  kind: 'demo' | 'idea';
  title: string;
  date: string;
  text?: string;
  tags?: string[];
}

export interface SketchEntry extends SketchInput {
  id: string;
  file?: string;
}

export function cleanSketch(input: SketchInput): SketchInput {
  const title = String(input.title ?? '').trim().slice(0, 200);
  if (!title) throw new Error('Title is required');
  if (input.kind !== 'demo' && input.kind !== 'idea') throw new Error('Kind must be demo or idea');
  if (!DATE.test(input.date)) throw new Error('Date must be YYYY-MM-DD');
  const text = String(input.text ?? '').replace(/\r\n/g, '\n').trim().slice(0, 20_000);
  const tags = (input.tags ?? []).map(t => String(t).trim().slice(0, 40)).filter(Boolean).slice(0, 12);
  return { kind: input.kind, title, date: input.date, ...(text && { text }), ...(tags.length && { tags }) };
}

/** Adds a sketch at the top. Returns the new file text and the entry (with its id). */
export function addSketch(json: string, input: SketchInput, audioFor?: (id: string) => string) {
  const list = JSON.parse(json) as SketchEntry[];
  const clean = cleanSketch(input);
  const id = uniqueName(slugify(`${clean.date}-${clean.title}`) || clean.date, new Set(list.map(s => s.id)));
  const entry: SketchEntry = { id, ...clean, ...(audioFor && { file: audioFor(id) }) };
  return { text: JSON.stringify([entry, ...list], null, 2) + '\n', entry };
}

/** Removes a sketch. Returns the new file text and the removed entry. */
export function removeSketch(json: string, id: string) {
  const list = JSON.parse(json) as SketchEntry[];
  const entry = list.find(s => s.id === id);
  if (!entry) throw new Error(`No sketch with id "${id}"`);
  return { text: JSON.stringify(list.filter(s => s.id !== id), null, 2) + '\n', entry };
}

/**
 * Changes a sketch in place (same id, same position). `file`: undefined keeps the audio, null removes it, a path sets it.
 * Returns the new file text, the new entry and the audio path it had before.
 */
export function updateSketch(json: string, id: string, input: SketchInput, file?: string | null) {
  const list = JSON.parse(json) as SketchEntry[];
  const i = list.findIndex(s => s.id === id);
  if (i < 0) throw new Error(`No sketch with id "${id}"`);
  const old = list[i];
  const clean = cleanSketch(input);
  const keep = file === undefined ? old.file : file ?? undefined;
  const entry: SketchEntry = { id, ...clean, ...(keep && { file: keep }) };
  list[i] = entry;
  return { text: JSON.stringify(list, null, 2) + '\n', entry, oldFile: old.file };
}

// ---------- Samples (src/data/samples.ts) ----------

export interface SampleInput {
  name: string;
  /** Google Drive file id of the original, when it was uploaded or linked (download button). */
  driveId?: string;
  duration: string;
  format: string;
  sizeBytes: number;
  peaks: string;
}

/** Pack ids and their categories, read from samples.ts. */
export function readPacks(ts: string): Map<string, Set<string>> {
  const packs = new Map<string, Set<string>>();
  for (const m of ts.matchAll(/^\s*id: "([^"]+)",\s*$/gm)) packs.set(m[1], new Set());
  for (const m of ts.matchAll(/pack: "([^"]+)", name: "(?:[^"\\]|\\.)*", category: "((?:[^"\\]|\\.)*)"/g)) {
    packs.get(m[1])?.add(JSON.parse(`"${m[2]}"`));
  }
  return packs;
}

/**
 * Appends rows to SAMPLES in samples.ts, in the same format as scripts/make-sample-previews.ts.
 * Returns the new text and, for each input, the public path its MP3 preview must be written to and its new id.
 */
export function appendSamples(ts: string, pack: string, category: string, items: SampleInput[]) {
  if (!readPacks(ts).has(pack)) throw new Error(`Unknown pack "${pack}"`);
  category = category.trim().slice(0, 60);
  if (!category) throw new Error('Category is required');
  if (!items.length) throw new Error('No samples');

  let nextId = Math.max(0, ...[...ts.matchAll(/\{ id: (\d+), pack:/g)].map(m => Number(m[1]))) + 1;
  const taken = new Set([...ts.matchAll(/preview: "\/audio\/([^"]+)\.mp3"/g)].map(m => m[1]));
  const previews: string[] = [];
  const ids: number[] = [];
  const rows = items.map(it => {
    const name = String(it.name).replace(/[\\/]/g, '-').trim().slice(0, 120);
    if (!name) throw new Error('A sample has no name');
    if (!/^[A-Za-z0-9\-_]{64}$/.test(it.peaks)) throw new Error(`Bad waveform for ${name}`);
    const base = uniqueName(slugify(name) || 'sample', taken);
    taken.add(base);
    const preview = `/audio/${base}.mp3`;
    const driveId = it.driveId && /^[A-Za-z0-9_-]{10,100}$/.test(it.driveId) ? it.driveId : '';
    previews.push(preview);
    ids.push(nextId);
    return (
      `  { id: ${nextId++}, pack: ${JSON.stringify(pack)}, name: ${JSON.stringify(name)}, category: ${JSON.stringify(category)}, ` +
      `duration: ${JSON.stringify(String(it.duration).slice(0, 12))}, format: ${JSON.stringify(String(it.format).slice(0, 30))}, ` +
      `sizeBytes: ${Math.max(0, Math.round(Number(it.sizeBytes) || 0))}, ` +
      `preview: ${JSON.stringify(preview)}, driveId: ${JSON.stringify(driveId)},\n    peaks: ${JSON.stringify(it.peaks)} },`
    );
  });

  const end = ts.lastIndexOf('];');
  if (end < 0 || !ts.includes('export const SAMPLES')) throw new Error('samples.ts has an unexpected shape');
  return { text: ts.slice(0, end) + rows.join('\n') + '\n' + ts.slice(end), previews, ids };
}

export interface SampleRow {
  id: number; pack: string; name: string; category: string; duration: string; format: string;
  sizeBytes: number; preview: string; driveId: string;
  /** Waveform outline (64 characters), for the dashboard's player. */
  peaks: string;
}

const STR = '("(?:[^"\\\\]|\\\\.)*")';
/** One SAMPLES row: two lines, exactly as appendSamples and scripts/make-sample-previews.ts write them. */
const ROW = new RegExp(
  `^  \\{ id: (\\d+), pack: ${STR}, name: ${STR}, category: ${STR}, duration: ${STR}, format: ${STR}, ` +
    `sizeBytes: (\\d+), preview: ${STR}, driveId: ${STR},\\n    peaks: ("[^"]*") \\},$`,
  'gm',
);

function rowOf(m: RegExpMatchArray): SampleRow {
  return {
    id: Number(m[1]), pack: JSON.parse(m[2]), name: JSON.parse(m[3]), category: JSON.parse(m[4]),
    duration: JSON.parse(m[5]), format: JSON.parse(m[6]), sizeBytes: Number(m[7]), preview: JSON.parse(m[8]), driveId: JSON.parse(m[9]),
    peaks: JSON.parse(m[10]),
  };
}

function rowText(r: SampleRow, peaks: string): string {
  return (
    `  { id: ${r.id}, pack: ${JSON.stringify(r.pack)}, name: ${JSON.stringify(r.name)}, category: ${JSON.stringify(r.category)}, ` +
    `duration: ${JSON.stringify(r.duration)}, format: ${JSON.stringify(r.format)}, sizeBytes: ${r.sizeBytes}, ` +
    `preview: ${JSON.stringify(r.preview)}, driveId: ${JSON.stringify(r.driveId)},\n    peaks: ${peaks} },`
  );
}

/** Every sample row in samples.ts (all of them, or one pack's). */
export function parseSamples(ts: string, pack?: string): SampleRow[] {
  return [...ts.matchAll(ROW)].map(rowOf).filter(r => !pack || r.pack === pack);
}

export interface SampleChange { id: number; name?: string; category?: string; driveId?: string; pack?: string }

/** Edits rows in place (name, category, Drive ID, pack). Unknown ids are an error, so nothing half-applies. */
export function updateSamples(ts: string, changes: SampleChange[]) {
  if (!changes.length) throw new Error('No changes');
  const byId = new Map(changes.map(c => [Number(c.id), c]));
  const packs = readPacks(ts);
  const seen = new Set<number>();
  const text = ts.replace(ROW, (...args) => {
    const m = args.slice(0, 11) as unknown as RegExpMatchArray;
    const row = rowOf(m);
    const c = byId.get(row.id);
    if (!c) return m[0];
    seen.add(row.id);
    if (c.name !== undefined) {
      row.name = String(c.name).replace(/[\\/]/g, '-').trim().slice(0, 120);
      if (!row.name) throw new Error(`Sample ${row.id}: the name is empty`);
    }
    if (c.category !== undefined) {
      row.category = String(c.category).trim().slice(0, 60);
      if (!row.category) throw new Error(`Sample ${row.id}: the category is empty`);
    }
    if (c.driveId !== undefined) {
      row.driveId = String(c.driveId).trim();
      if (row.driveId && !/^[A-Za-z0-9_-]{10,100}$/.test(row.driveId)) throw new Error(`Sample ${row.id}: that doesn't look like a Google Drive file ID`);
    }
    if (c.pack !== undefined) {
      if (!packs.has(String(c.pack))) throw new Error(`Unknown pack "${c.pack}"`);
      row.pack = String(c.pack);
    }
    return rowText(row, m[10]);
  });
  const missing = [...byId.keys()].filter(id => !seen.has(id));
  if (missing.length) throw new Error(`No sample with id ${missing.join(', ')}`);
  return { text, changed: seen.size };
}

/** Removes rows. Returns the new text and the preview files no remaining row uses. */
export function removeSamples(ts: string, ids: number[]) {
  const drop = new Set(ids.map(Number));
  if (!drop.size) throw new Error('No samples');
  const removed: SampleRow[] = [];
  const text = ts.replace(new RegExp(ROW.source + '\\n?', 'gm'), (...args) => {
    const m = args.slice(0, 11) as unknown as RegExpMatchArray;
    const row = rowOf(m);
    if (!drop.has(row.id)) return m[0];
    removed.push(row);
    return '';
  });
  const missing = [...drop].filter(id => !removed.some(r => r.id === id));
  if (missing.length) throw new Error(`No sample with id ${missing.join(', ')}`);
  const stillUsed = new Set(parseSamples(text).map(r => r.preview));
  return { text, removed, previews: [...new Set(removed.map(r => r.preview))].filter(p => !stillUsed.has(p)) };
}

// ---------- Archive posts (src/posts/<slug>.tsx) ----------

export interface PostInput {
  title: string;
  slug: string;
  date: string;
  tags: string[];
  index: number;
  accentColor?: string;
  description?: string;
  /** Plain text: blank line between paragraphs, "## " headings, "- " list lines, [links](https://...), **bold**. */
  body: string;
}

/** Text that is safe inside JSX: braces and angle brackets escaped. */
const jsxText = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[{}]/g, c => `{'${c}'}`);

/** A run of text, a link or bold, as JSX. */
function inline(t: Inline): string {
  if (t.kind === 'text') return jsxText(t.text);
  if (t.kind === 'bold') return `<span className="${POST_CLASSES.bold}">${jsxText(t.text)}</span>`;
  const external = t.href.startsWith('http');
  return `<a href=${JSON.stringify(t.href)}${external ? ' target="_blank" rel="noreferrer"' : ''} className="${POST_CLASSES.link}">${jsxText(t.text)}</a>`;
}

export function postFile(input: PostInput): string {
  const title = String(input.title ?? '').trim().slice(0, 200);
  if (!title) throw new Error('Title is required');
  const slug = String(input.slug ?? '');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug === 'index' || slug === 'types') {
    throw new Error('Slug must be lowercase letters, numbers and dashes');
  }
  if (!DATE.test(input.date)) throw new Error('Date must be YYYY-MM-DD');
  const accent = input.accentColor && /^#[0-9a-fA-F]{6}$/.test(input.accentColor) ? input.accentColor : '';
  const tags = (input.tags ?? []).map(t => String(t).trim().toUpperCase().slice(0, 40)).filter(Boolean).slice(0, 8);
  const description = String(input.description ?? '').replace(/\s+/g, ' ').trim().slice(0, 300);
  const body = String(input.body ?? '').replace(/\r\n/g, '\n').trim();
  if (!body) throw new Error('Body is required');

  const marker = listMarker(accent);
  const html = (c: Inline[]) => c.map(inline).join('');
  const jsx = parseBody(body).map(block => {
    if (block.kind === 'heading') return `      <h3 className="${POST_CLASSES.heading}">${html(block.content)}</h3>`;
    if (block.kind === 'list') {
      const items = block.items.map(it => `        <li>${html(it)}</li>`).join('\n');
      return `      <ul className="${POST_CLASSES.list} ${marker}">\n${items}\n      </ul>`;
    }
    return `      <p>\n        ${html(block.content)}\n      </p>`;
  });

  const meta = [
    `  title: ${JSON.stringify(title)},`,
    `  slug: ${JSON.stringify(slug)},`,
    `  date: ${JSON.stringify(input.date)},`,
    `  tags: ${JSON.stringify(tags).replace(/","/g, '", "')},`,
    `  index: ${Math.max(0, Math.round(Number(input.index) || 0))},`,
    ...(accent ? [`  accentColor: ${JSON.stringify(accent)},`] : []),
    ...(description ? [`  description: ${JSON.stringify(description)},`] : []),
  ];

  return `import type { PostMeta } from './types';

export const meta: PostMeta = {
${meta.join('\n')}
};

export default function Post() {
  return (
    <div className="${POST_CLASSES.body}">
${jsx.join('\n\n')}
    </div>
  );
}

${sourceComment(body)}
`;
}

// ---------- Editing posts ----------

const SOURCE_TAG = '@dev-source ';

/**
 * Posts written in the dashboard keep their plain text in a comment at the end, so the text can be edited again.
 * JSON keeps it on one line; "*\/" is escaped so it can't end the comment early.
 */
function sourceComment(body: string): string {
  return `/* Written in the /dev dashboard. Edit the text there; this line is what it reads:\n${SOURCE_TAG}${JSON.stringify(body).replace(/\*\//g, '*\\/')}\n*/`;
}

/** Fields of PostMeta the dashboard can change. slug isn't one: it's the file name and the URL. */
export interface PostMetaPatch {
  title?: string; date?: string; tags?: string[]; index?: number; accentColor?: string | null;
  description?: string | null; isSpecial?: boolean;
}

const META_BLOCK = /^export const meta: PostMeta = \{\n([\s\S]*?)\n\};$/m;
const META_LINE = /^  ([A-Za-z]+): (.*),$/;

export interface PostInfo {
  slug: string;
  /** Values that are plain data; anything else (e.g. a named constant) is in `fixed` and stays as written. */
  meta: Record<string, unknown>;
  fixed: Record<string, string>;
  /** The plain text, for posts written in the dashboard; null for hand-written posts (code, labs). */
  source: string | null;
}

export function readPost(slug: string, src: string): PostInfo {
  const block = META_BLOCK.exec(src);
  if (!block) throw new Error(`${slug}: no meta block`);
  const meta: Record<string, unknown> = {};
  const fixed: Record<string, string> = {};
  for (const line of block[1].split('\n')) {
    const m = META_LINE.exec(line);
    if (!m) continue;
    try {
      meta[m[1]] = JSON.parse(m[2]);
    } catch {
      fixed[m[1]] = m[2];
    }
  }
  const tagged = src.split('\n').find(l => l.startsWith(SOURCE_TAG));
  let source: string | null = null;
  if (tagged) {
    try {
      source = JSON.parse(tagged.slice(SOURCE_TAG.length)) as string;
    } catch {
      source = null;
    }
  }
  return { slug, meta, fixed, source };
}

/**
 * Changes a post's details, and its text if it was written in the dashboard. Other lines of the file stay as they are.
 * Values the dashboard can't read (e.g. `accentColor: ACCENT`) can't be changed here either.
 */
export function updatePost(slug: string, src: string, patch: PostMetaPatch, body?: string): string {
  const info = readPost(slug, src);
  const next: Record<string, unknown> = { ...info.meta };
  for (const key of Object.keys(patch) as Array<keyof PostMetaPatch>) {
    if (patch[key] === undefined) continue;
    if (key in info.fixed) throw new Error(`"${key}" is set in the post's code; change it there`);
    next[key] = patch[key];
  }

  const title = String(next.title ?? '').trim().slice(0, 200);
  if (!title) throw new Error('Title is required');
  next.title = title;
  if (!DATE.test(String(next.date))) throw new Error('Date must be YYYY-MM-DD');
  next.tags = (Array.isArray(next.tags) ? next.tags : []).map(t => String(t).trim().toUpperCase().slice(0, 40)).filter(Boolean).slice(0, 8);
  next.index = Math.max(0, Math.round(Number(next.index) || 0));
  if (next.accentColor === null || next.accentColor === '') delete next.accentColor;
  else if (next.accentColor !== undefined && !/^#[0-9a-fA-F]{6}$/.test(String(next.accentColor))) throw new Error('Colour must be like #ffaa00');
  if (next.description === null || next.description === '') delete next.description;
  else if (next.description !== undefined) next.description = String(next.description).replace(/\s+/g, ' ').trim().slice(0, 300);
  if (next.isSpecial === false) delete next.isSpecial;

  if (body !== undefined) {
    if (info.source === null) throw new Error('This post is hand-written code (labs, components), so its text can only be changed in the code');
    return postFile({
      title, slug, date: String(next.date), tags: next.tags as string[], index: next.index as number,
      accentColor: next.accentColor as string | undefined, description: next.description as string | undefined, body,
    });
  }

  // Rewrite only the meta block: known keys in their usual order, then anything else the file had.
  const order = ['title', 'slug', 'date', 'tags', 'index', 'accentColor', 'isSpecial', 'description'];
  const keys = [...order, ...Object.keys(next), ...Object.keys(info.fixed)].filter((k, i, a) => a.indexOf(k) === i);
  const lines = keys
    .filter(k => k in next || k in info.fixed)
    .map(k => `  ${k}: ${k in info.fixed ? info.fixed[k] : Array.isArray(next[k]) ? JSON.stringify(next[k]).replace(/","/g, '", "') : JSON.stringify(next[k])},`);
  return src.replace(META_BLOCK, `export const meta: PostMeta = {\n${lines.join('\n')}\n};`);
}

// ---------- Drafts (src/posts/drafts/<slug>.tsx) ----------

/**
 * Moves a post file's relative imports one folder deeper (into drafts/) or back up (out of drafts/).
 * Drafts live in their own folder because src/posts/index.ts only picks up ./*.tsx: a draft isn't built into the site at all.
 */
export function rebaseImports(src: string, intoDrafts: boolean): string {
  return src.replace(/(\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}\/[^'"]*)\2/g, (_all, lead: string, q: string, spec: string) => {
    let next: string;
    if (intoDrafts) next = spec.startsWith('./') ? `../${spec.slice(2)}` : `../${spec}`;
    else if (spec.startsWith('../../')) next = spec.slice(3);
    else if (spec.startsWith('../')) next = `./${spec.slice(3)}`;
    else throw new Error(`Can't move an import of "${spec}" out of drafts/`);
    return `${lead}${q}${next}${q}`;
  });
}

// ---------- Hidden packs and samples (src/data/hidden.json) ----------

/** Packs and samples that are saved in samples.ts but not shown on /samples yet. */
export interface Hidden { packs: string[]; samples: number[] }

export function readHidden(json: string | null): Hidden {
  const raw = (json ? JSON.parse(json) : {}) as Partial<Hidden>;
  return {
    packs: Array.isArray(raw.packs) ? raw.packs.map(String) : [],
    samples: Array.isArray(raw.samples) ? raw.samples.map(Number).filter(Number.isInteger) : [],
  };
}

export function hiddenText(h: Hidden): string {
  const packs = [...new Set(h.packs)].sort();
  const samples = [...new Set(h.samples)].sort((a, b) => a - b);
  return `{\n  "packs": ${JSON.stringify(packs)},\n  "samples": ${JSON.stringify(samples)}\n}\n`;
}

/** Hides or shows packs and/or samples. Returns the new file text. */
export function setHidden(json: string | null, change: { packs?: string[]; samples?: number[]; hidden: boolean }): string {
  const h = readHidden(json);
  const apply = <T,>(list: T[], items: T[] | undefined) => {
    if (!items?.length) return list;
    const set = new Set(list);
    for (const x of items) if (change.hidden) set.add(x); else set.delete(x);
    return [...set];
  };
  return hiddenText({ packs: apply(h.packs, change.packs?.map(String)), samples: apply(h.samples, change.samples?.map(Number)) });
}
