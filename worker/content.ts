/**
 * Pure text helpers for the /dev dashboard: they take a repo file's current text and return the new text.
 * No network or Worker APIs here, so they can be tested with `npx tsx` (see scripts/test-dev-content.ts).
 */

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

// ---------- Samples (src/data/samples.ts) ----------

export interface SampleInput {
  name: string;
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
 * Returns the new text and, for each input, the public path its MP3 preview must be written to.
 */
export function appendSamples(ts: string, pack: string, category: string, items: SampleInput[]) {
  if (!readPacks(ts).has(pack)) throw new Error(`Unknown pack "${pack}"`);
  category = category.trim().slice(0, 60);
  if (!category) throw new Error('Category is required');
  if (!items.length) throw new Error('No samples');

  let nextId = Math.max(0, ...[...ts.matchAll(/\{ id: (\d+), pack:/g)].map(m => Number(m[1]))) + 1;
  const taken = new Set([...ts.matchAll(/preview: "\/audio\/([^"]+)\.mp3"/g)].map(m => m[1]));
  const previews: string[] = [];
  const rows = items.map(it => {
    const name = String(it.name).replace(/[\\/]/g, '-').trim().slice(0, 120);
    if (!name) throw new Error('A sample has no name');
    if (!/^[A-Za-z0-9\-_]{64}$/.test(it.peaks)) throw new Error(`Bad waveform for ${name}`);
    const base = uniqueName(slugify(name) || 'sample', taken);
    taken.add(base);
    const preview = `/audio/${base}.mp3`;
    previews.push(preview);
    return (
      `  { id: ${nextId++}, pack: ${JSON.stringify(pack)}, name: ${JSON.stringify(name)}, category: ${JSON.stringify(category)}, ` +
      `duration: ${JSON.stringify(String(it.duration).slice(0, 12))}, format: ${JSON.stringify(String(it.format).slice(0, 30))}, ` +
      `sizeBytes: ${Math.max(0, Math.round(Number(it.sizeBytes) || 0))}, ` +
      `preview: ${JSON.stringify(preview)}, driveId: "",\n    peaks: ${JSON.stringify(it.peaks)} },`
    );
  });

  const end = ts.lastIndexOf('];');
  if (end < 0 || !ts.includes('export const SAMPLES')) throw new Error('samples.ts has an unexpected shape');
  return { text: ts.slice(0, end) + rows.join('\n') + '\n' + ts.slice(end), previews };
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

/** Inline formatting: [text](url) and **bold**. */
function inline(s: string): string {
  let out = '';
  let last = 0;
  for (const m of s.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)|\*\*([^*]+)\*\*/g)) {
    out += jsxText(s.slice(last, m.index));
    if (m[1] !== undefined) {
      const external = m[2].startsWith('http');
      out += `<a href=${JSON.stringify(m[2])}${external ? ' target="_blank" rel="noreferrer"' : ''} className="text-brand-orange hover:underline">${jsxText(m[1])}</a>`;
    } else {
      out += `<span className="text-zinc-200">${jsxText(m[3])}</span>`;
    }
    last = m.index! + m[0].length;
  }
  return out + jsxText(s.slice(last));
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

  const blocks = body.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  const marker = accent ? `marker:text-[${accent}]/60` : 'marker:text-brand-orange/60';
  const jsx = blocks.map(block => {
    const lines = block.split('\n').map(l => l.trim());
    if (lines.length === 1 && /^#{2,3}\s+/.test(lines[0])) {
      return `      <h3 className="text-white font-display font-medium text-lg pt-2">${inline(lines[0].replace(/^#+\s+/, ''))}</h3>`;
    }
    if (lines.every(l => /^[-*]\s+/.test(l))) {
      const items = lines.map(l => `        <li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`).join('\n');
      return `      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 ${marker}">\n${items}\n      </ul>`;
    }
    return `      <p>\n        ${inline(lines.join(' '))}\n      </p>`;
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
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
${jsx.join('\n\n')}
    </div>
  );
}
`;
}
