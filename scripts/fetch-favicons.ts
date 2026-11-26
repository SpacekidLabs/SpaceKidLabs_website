/**
 * Downloads the favicon of every link in src/data/resources.ts into public/favicons/, so the archive's
 * "Curated Resources & Bookmarks" post shows them without loading anything from other sites.
 *
 *   npm run favicons            fetch icons for links that don't have one yet
 *   npm run favicons -- --force fetch them all again
 *
 * For each site it reads the page's <link rel="icon"> tags (preferring SVG, then the PNG closest to 32 px),
 * then falls back to /favicon.ico. Files are checked before saving: they must really be an image, at most
 * 100 KB, and SVGs must not contain scripts or event handlers (they're served from this site's own domain).
 * The result is listed in src/data/favicons.json, which the post reads; sites with no usable icon get a
 * letter placeholder instead.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RESOURCE_LINKS } from '../src/data/resources';

const OUT_DIR = 'public/favicons';
const MANIFEST = 'src/data/favicons.json';
const MAX_BYTES = 100_000;
const TIMEOUT_MS = 10_000;
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (favicon fetcher)', Accept: '*/*' };

type Manifest = Record<string, string>; // hostname -> "/favicons/<file>"

async function get(url: string) {
  const res = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

/** Icon candidates from the page's <link> tags, best first. */
function iconLinks(html: string, pageUrl: string): string[] {
  const found: { href: string; score: number }[] = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attr = (name: string) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
    const rel = (attr('rel') ?? '').toLowerCase();
    const href = attr('href');
    // "mask-icon" is Safari's one-colour pinned-tab shape (black on transparent): invisible on this dark site.
    if (!href || !/\bicon\b/.test(rel) || rel.includes('mask-icon')) continue;
    const type = (attr('type') ?? '').toLowerCase();
    const size = Number((attr('sizes') ?? '').match(/(\d+)x\d+/)?.[1] ?? 0);
    let score = 50;
    if (type.includes('svg') || /\.svg(\?|$)/i.test(href)) score = 100;
    else if (size) score = 90 - Math.abs(size - 32) / 4; // closest to 32 px wins
    if (rel.includes('apple-touch')) score = 40; // large (180 px); fine, but a last resort
    try { found.push({ href: new URL(href, pageUrl).href, score }); } catch { /* bad URL */ }
  }
  return found.sort((a, b) => b.score - a.score).map(f => f.href);
}

/** Works out the image type from the file's first bytes; null if it isn't an image we accept. */
function imageType(bytes: Buffer): 'png' | 'ico' | 'jpg' | 'gif' | 'webp' | 'svg' | null {
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (bytes.readUInt32BE(0) === 0x00000100) return 'ico';
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpg';
  if (bytes.subarray(0, 4).toString() === 'GIF8') return 'gif';
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return 'webp';
  const text = bytes.subarray(0, 1000).toString('utf8').trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg\b/i.test(text)) return 'svg';
  return null;
}

/** SVGs are served from this site, so anything that could run code is refused. */
function unsafeSvg(svg: string) {
  return /<script|<foreignObject|\bon[a-z]+\s*=|javascript:|<iframe|<embed|<object/i.test(svg);
}

async function download(url: string): Promise<{ bytes: Buffer; ext: string } | null> {
  try {
    const res = await get(url);
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length < 16 || bytes.length > MAX_BYTES) return null;
    const ext = imageType(bytes);
    if (!ext) return null;
    if (ext === 'svg' && unsafeSvg(bytes.toString('utf8'))) return null;
    return { bytes, ext };
  } catch {
    return null;
  }
}

async function iconFor(pageUrl: string) {
  let candidates: string[] = [];
  try {
    const res = await get(pageUrl);
    candidates = iconLinks(await res.text(), res.url);
  } catch (err) {
    console.warn(`  page not reachable (${(err as Error).message}), trying /favicon.ico`);
  }
  candidates.push(new URL('/favicon.ico', pageUrl).href);
  for (const url of [...new Set(candidates)]) {
    const icon = await download(url);
    if (icon) return { ...icon, from: url };
  }
  return null;
}

async function main() {
  const force = process.argv.includes('--force');
  mkdirSync(OUT_DIR, { recursive: true });
  const old: Manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
  const manifest: Manifest = {};
  const hosts = [...new Set(RESOURCE_LINKS.map(l => new URL(l.url).hostname))];

  for (const host of hosts) {
    const existing = old[host];
    if (!force && existing && existsSync(join('public', existing))) {
      manifest[host] = existing;
      continue;
    }
    const link = RESOURCE_LINKS.find(l => new URL(l.url).hostname === host)!;
    console.log(`${host}`);
    const icon = await iconFor(link.url);
    if (existing) rmSync(join('public', existing), { force: true });
    if (!icon) {
      console.warn('  no usable icon; the post shows a letter instead');
      continue;
    }
    const file = `${host}.${icon.ext}`;
    writeFileSync(join(OUT_DIR, file), icon.bytes);
    manifest[host] = `/favicons/${file}`;
    const from = icon.from.startsWith('data:') ? 'an image embedded in the page' : icon.from;
    console.log(`  ${file} (${icon.bytes.length} bytes) from ${from}`);
  }

  // Keep the manifest in a stable order so re-runs only show real changes in git.
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + '\n');
  console.log(`\n${Object.keys(sorted).length} of ${hosts.length} sites have an icon. Manifest: ${MANIFEST}`);
}

main();
