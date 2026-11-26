/**
 * Runs after `vite build`: renders every page and archive post to static HTML in dist/, each with its own
 * <title>, description and link-preview tags. Link-preview bots (Discord, Instagram, X...) and search engines
 * then see real content without running JavaScript; in the browser, React takes over the same HTML (src/main.tsx).
 *
 * Output: dist/index.html for "/", dist/<path>.html for every other page (Netlify serves /archive/wavesets from
 * dist/archive/wavesets.html), and dist/shell.html, the empty app used for any other URL (see netlify.toml).
 * It also writes dist/rss.xml, the archive's RSS feed, using the same post descriptions.
 *
 * Usage: npx tsx scripts/prerender.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createServer } from 'vite';
import type { Post } from '../src/posts';
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, STATIC_PAGES } from './site';

const DIST = resolve(import.meta.dirname, '..', 'dist');

interface PageInfo {
  path: string;
  title: string;
  description: string;
  type: 'website' | 'article';
}

const escapeAttr = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const decodeEntities = (s: string) =>
  s
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

/** First real paragraph of a rendered post, trimmed to a preview-friendly length. */
function firstParagraph(html: string): string | undefined {
  const body = html.slice(html.indexOf('prose prose-invert'));
  for (const match of body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)) {
    const text = decodeEntities(match[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (text.length < 40) continue; // skip one-line taglines
    if (text.length <= 200) return text;
    const cut = text.slice(0, 197);
    return cut.slice(0, cut.lastIndexOf(' ')) + '…';
  }
  return undefined;
}

/** Replaces the content="" of an existing meta tag in the template. */
function setMeta(html: string, attr: 'name' | 'property', key: string, value: string): string {
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
  if (!re.test(html)) throw new Error(`index.html has no <meta ${attr}="${key}">`);
  return html.replace(re, `$1${escapeAttr(value)}$2`);
}

function fillTemplate(template: string, page: PageInfo, appHtml: string): string {
  const url = SITE_URL + (page.path === '/' ? '/' : page.path);
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(page.title)}</title>`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${url}"`)
    .replace(/https:\/\/spacekidlabs\.netlify\.app\/og-image\.png/g, `${SITE_URL}/og-image.png`)
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
  html = setMeta(html, 'name', 'description', page.description);
  html = setMeta(html, 'property', 'og:type', page.type);
  html = setMeta(html, 'property', 'og:title', page.title);
  html = setMeta(html, 'property', 'og:description', page.description);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'name', 'twitter:title', page.title);
  html = setMeta(html, 'name', 'twitter:description', page.description);
  return html;
}

/** RFC 822 date for RSS, at noon UTC so the day doesn't shift in any time zone. */
const rssDate = (isoDay: string) => new Date(`${isoDay}T12:00:00Z`).toUTCString();

/** RSS 2.0 feed of the archive, newest first. Deterministic: only changes when posts change. */
function buildFeed(posts: Post[], descriptions: Map<string, string>): string {
  const newest = posts.map(p => p.meta.date).sort().at(-1)!;
  const items = posts.map(p => {
    const url = `${SITE_URL}/archive/${p.meta.slug}`;
    return [
      '    <item>',
      `      <title>${escapeAttr(p.meta.title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <pubDate>${rssDate(p.meta.date)}</pubDate>`,
      `      <description>${escapeAttr(descriptions.get(`/archive/${p.meta.slug}`) ?? '')}</description>`,
      ...p.meta.tags.map(tag => `      <category>${escapeAttr(tag)}</category>`),
      '    </item>',
    ].join('\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${SITE_NAME} — Archive</title>`,
    `    <link>${SITE_URL}/archive</link>`,
    `    <description>Thoughts, esoteric tools and interactive audio experiments from ${SITE_NAME}.</description>`,
    '    <language>en</language>',
    `    <lastBuildDate>${rssDate(newest)}</lastBuildDate>`,
    `    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
    `    <image><url>${SITE_URL}/apple-touch-icon.png</url><title>${SITE_NAME} — Archive</title><link>${SITE_URL}/archive</link></image>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

function outFile(path: string) {
  return resolve(DIST, path === '/' ? 'index.html' : `.${path}.html`);
}

const template = readFileSync(resolve(DIST, 'index.html'), 'utf8');
if (!template.includes('<div id="root"></div>')) {
  throw new Error('dist/index.html is already pre-rendered; run `vite build` first');
}
// The empty app shell, served for URLs that weren't pre-rendered (e.g. typos -> the 404 page).
writeFileSync(resolve(DIST, 'shell.html'), template);

const vite = await createServer({
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const { render, POSTS } = (await vite.ssrLoadModule('/src/entry-server.tsx')) as {
    render: (url: string) => Promise<string>;
    POSTS: Post[];
  };

  const pages: PageInfo[] = [
    ...STATIC_PAGES.map(p => ({
      path: p.path,
      title: p.title ? `${p.title} — ${SITE_NAME}` : SITE_NAME,
      description: p.description,
      type: 'website' as const,
    })),
    ...POSTS.map(p => ({
      path: `/archive/${p.meta.slug}`,
      title: `${p.meta.title} — ${SITE_NAME}`,
      description: p.meta.description ?? '', // filled from the rendered post below if empty
      type: 'article' as const,
    })),
  ];

  const descriptions = new Map<string, string>();
  for (const page of pages) {
    // Note: React moves large blocks (like the labs) to the end of the HTML and swaps them into place with a
    // tiny inline script as the page loads. The content is all there; that's expected.
    const appHtml = await render(page.path);
    if (!page.description) page.description = firstParagraph(appHtml) ?? DEFAULT_DESCRIPTION;
    descriptions.set(page.path, page.description);
    const file = outFile(page.path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, fillTemplate(template, page, appHtml));
  }
  console.log(`Pre-rendered ${pages.length} pages for ${SITE_URL}`);

  writeFileSync(resolve(DIST, 'rss.xml'), buildFeed(POSTS, descriptions));
  console.log(`RSS feed: ${POSTS.length} posts`);
} finally {
  await vite.close();
}
