/**
 * The plain-text format of posts written in the /dev dashboard, parsed into blocks.
 * Shared by the Worker, which turns them into a post file (worker/content.ts postFile), and the dashboard's
 * preview (src/components/dev/PostPreview.tsx), so the preview shows exactly what gets published.
 *
 * Blank line = new paragraph, "## " or "### " heading, "- " or "* " list lines, [text](url) links, **bold**.
 */

export type Inline = { kind: 'text'; text: string } | { kind: 'link'; text: string; href: string } | { kind: 'bold'; text: string };
export type Block = { kind: 'heading'; content: Inline[] } | { kind: 'list'; items: Inline[][] } | { kind: 'paragraph'; content: Inline[] };

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  const text = (t: string) => { if (t) out.push({ kind: 'text', text: t }); };
  for (const m of s.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)|\*\*([^*]+)\*\*/g)) {
    text(s.slice(last, m.index));
    if (m[1] !== undefined) out.push({ kind: 'link', text: m[1], href: m[2] });
    else out.push({ kind: 'bold', text: m[3] });
    last = m.index! + m[0].length;
  }
  text(s.slice(last));
  return out;
}

export function parseBody(body: string): Block[] {
  return body.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map((block): Block => {
    const lines = block.split('\n').map(l => l.trim());
    if (lines.length === 1 && /^#{2,3}\s+/.test(lines[0])) return { kind: 'heading', content: parseInline(lines[0].replace(/^#+\s+/, '')) };
    if (lines.every(l => /^[-*]\s+/.test(l))) return { kind: 'list', items: lines.map(l => parseInline(l.replace(/^[-*]\s+/, ''))) };
    return { kind: 'paragraph', content: parseInline(lines.join(' ')) };
  });
}

/** Class names used for each block, in the published file and the preview alike. */
export const POST_CLASSES = {
  body: 'space-y-5 text-zinc-300 font-sans font-light leading-relaxed',
  heading: 'text-white font-display font-medium text-lg pt-2',
  list: 'list-disc pl-6 space-y-1.5 text-zinc-400',
  link: 'text-brand-orange hover:underline',
  bold: 'text-zinc-200',
};
export const listMarker = (accent?: string) => (accent ? `marker:text-[${accent}]/60` : 'marker:text-brand-orange/60');
