/**
 * Runs after `vite build`: writes dist/robots.txt and dist/sitemap.xml.
 *
 * The archive post list is read from src/posts (through Vite, so it's the exact same data the site uses).
 * The site address comes from Netlify's URL variable (the site's main address, including a custom domain),
 * with a fallback for local builds.
 *
 * Usage: npx tsx scripts/generate-seo-files.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import type { Post } from '../src/posts';

const SITE_URL = (process.env.URL || 'https://spacekidlabs.netlify.app').replace(/\/$/, '');
const DIST = resolve(import.meta.dirname, '..', 'dist');

/** Pages that aren't archive posts. Keep in sync with the routes in src/App.tsx. */
const STATIC_PAGES = ['/', '/archive', '/samples', '/services', '/download', '/waveset-quantizer'];

async function loadPosts(): Promise<Post[]> {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false, watch: null },
    appType: 'custom',
    logLevel: 'error',
  });
  try {
    const mod = (await vite.ssrLoadModule('/src/posts/index.ts')) as { POSTS: Post[] };
    return mod.POSTS;
  } finally {
    await vite.close();
  }
}

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function urlEntry(path: string, lastmod?: string) {
  return [
    '  <url>',
    `    <loc>${escapeXml(SITE_URL + path)}</loc>`,
    ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
    '  </url>',
  ].join('\n');
}

const posts = await loadPosts();
const newestPost = posts.map(p => p.meta.date).sort().at(-1);

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...STATIC_PAGES.map(path => urlEntry(path, path === '/archive' ? newestPost : undefined)),
  ...posts.map(p => urlEntry(`/archive/${p.meta.slug}`, p.meta.date)),
  '</urlset>',
  '',
].join('\n');

const robots = ['User-agent: *', 'Allow: /', 'Disallow: /api/', '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n');

writeFileSync(resolve(DIST, 'sitemap.xml'), sitemap);
writeFileSync(resolve(DIST, 'robots.txt'), robots);
console.log(`SEO files: sitemap.xml (${STATIC_PAGES.length} pages + ${posts.length} posts) and robots.txt for ${SITE_URL}`);
