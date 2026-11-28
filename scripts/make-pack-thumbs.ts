/**
 * Small WebP versions of the pack covers for the samples page. The SVG covers are 30-370 KB each
 * (thousands of waveform paths) but only ever shown at 48 px (pack picker) and 64-144 px (pack
 * details), so the page loads these instead:
 *
 *   public/packs/<name>-96.webp    pack picker tile (48 px at 2x)
 *   public/packs/<name>-288.webp   pack details (144 px at 2x)
 *
 *   npx tsx scripts/make-pack-thumbs.ts
 *
 * make-pack-covers.ts runs this at the end, so new or changed covers get thumbnails too.
 * src/pages/Samples.tsx `thumb()` builds these paths from a pack's cover.
 */
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const DIR = join(resolve(import.meta.dirname, '..'), 'public', 'packs');
const SIZES = [96, 288];

for (const file of readdirSync(DIR).filter(f => f.endsWith('.svg'))) {
  const name = file.replace(/\.svg$/, '');
  for (const size of SIZES) {
    // Rendered at 2x the SVG size first: at low render sizes librsvg drops the thinnest strokes.
    await sharp(join(DIR, file), { density: 144 })
      .resize(size, size)
      .webp({ quality: 80 })
      .toFile(join(DIR, `${name}-${size}.webp`));
  }
}
console.log('Wrote the pack cover thumbnails in public/packs/');
