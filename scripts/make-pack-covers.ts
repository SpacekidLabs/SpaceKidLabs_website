/**
 * Draws the sample-pack cover art in public/packs/ from the packs' own waveforms (the `peaks`
 * outlines in src/data/samples.ts), so every cover is a picture of the sounds inside it.
 *
 *   npx tsx scripts/make-pack-covers.ts
 *
 * Re-run after make-sample-previews.ts changes a pack. The output is the same every time.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { SAMPLES, type Sample } from '../src/data/samples';
import { seededRandom } from '../src/lib/seededRandom';

const OUT = join(resolve(import.meta.dirname, '..'), 'public', 'packs');
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const SIZE = 800;
const ORANGE = '#ffaa00';
const FONT = `font-family="'JetBrains Mono', ui-monospace, Menlo, monospace"`;

/** "AZ_" -> [0, 0.4, 1] */
const levels = (s: Sample) => [...s.peaks].map(c => ALPHABET.indexOf(c) / 63);
const f = (n: number) => +n.toFixed(1);

function frame(body: string, label: string, sub: string) {
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
<rect width="${SIZE}" height="${SIZE}" fill="#050505"/>
${body}
<rect x="40" y="${SIZE - 112}" width="${SIZE - 80}" height="72" fill="#050505" opacity="0.88"/>
<text x="60" y="${SIZE - 70}" fill="#ffffff" font-size="30" font-weight="700" letter-spacing="4" ${FONT}>${esc(label)}</text>
<text x="60" y="${SIZE - 50}" fill="${ORANGE}" font-size="13" letter-spacing="3" ${FONT}>${esc(sub)}</text>
</svg>
`;
}

/** Weird Breaks: a grid with one cell per break, each cell that break's waveform; a few rows slip sideways. */
function weirdBreaks(samples: Sample[]) {
  const rand = seededRandom(186);
  const cols = Math.ceil(Math.sqrt(samples.length));
  const pad = 40;
  const cell = (SIZE - pad * 2) / cols;
  const rowH = (SIZE - pad - 140) / Math.ceil(samples.length / cols);
  const shades: Record<string, string> = { 'Short Breaks': '#8a8a8a', Breaks: ORANGE, 'Long Breaks': '#ffffff' };
  const slip = Array.from({ length: cols }, () => (rand() < 0.22 ? (rand() - 0.5) * cell * 3 : 0));
  let out = '';
  samples.forEach((s, i) => {
    const row = Math.floor(i / cols), col = i % cols;
    const x0 = pad + col * cell + slip[row], cy = pad + row * rowH + rowH / 2;
    const bars = levels(s);
    const step = (cell * 0.86) / bars.length;
    let d = '';
    bars.forEach((v, k) => {
      const h = Math.max(0.4, v * rowH * 0.42);
      d += `M${f(x0 + k * step)} ${f(cy - h)}V${f(cy + h)}`;
    });
    out += `<path d="${d}" stroke="${shades[s.category] ?? ORANGE}" stroke-width="${f(step * 0.7) || 0.3}" opacity="${slip[row] ? 1 : 0.85}"/>\n`;
  });
  return frame(out, 'WEIRD BREAKS', `${samples.length} BREAKS // AUDIOMOS // SPACEKID LABS`);
}

/** DataBend: every sample as one ridge line, stacked, with bands torn sideways and an RGB-split ghost. */
function databend(samples: Sample[]) {
  const rand = seededRandom(26);
  const top = 70, bottom = SIZE - 150, left = 50, right = SIZE - 50;
  const gap = (bottom - top) / samples.length;
  const tears = Array.from({ length: samples.length }, () => (rand() < 0.15 ? (rand() - 0.5) * 120 : 0));
  const line = (s: Sample, i: number, dx: number) => {
    const bars = levels(s);
    const y = top + i * gap + gap;
    const w = (right - left) / (bars.length - 1);
    const pts = bars.map((v, k) => {
      // Taper towards the edges so the ridges rise from a flat floor.
      const env = Math.sin((Math.PI * k) / (bars.length - 1)) ** 0.7;
      return `${f(left + k * w + dx + tears[i])},${f(y - v * env * gap * 5)}`;
    });
    return `M${pts.join('L')}`;
  };
  let ghost = '', ridges = '';
  samples.forEach((s, i) => {
    ghost += line(s, i, 4);
    // Fill below each ridge in black so nearer lines hide the ones behind them.
    ridges += `<path d="${line(s, i, 0)}L${right + tears[i]},${f(top + i * gap + gap + 2)}L${left + tears[i]},${f(top + i * gap + gap + 2)}Z" fill="#050505" stroke="${tears[i] ? '#ffffff' : ORANGE}" stroke-width="1.3" stroke-linejoin="round"/>\n`;
  });
  const body = `<path d="${ghost}" fill="none" stroke="#00d8ff" stroke-width="1" opacity="0.35"/>\n${ridges}`;
  return frame(body, 'DATABEND PROCESS', `${samples.length} SAMPLES // 48 KHZ // SPACEKID LABS`);
}

/** One-Shots: every hit as one spoke of a burst, its waveform drawn outward from the centre. */
function oneShots(samples: Sample[]) {
  const cx = SIZE / 2, cy = 330, inner = 46, outer = 270;
  const shades: Record<string, string> = { Kicks: ORANGE, Snares: '#ffffff', Claps: '#ffffff', Percussion: '#8a8a8a', 'Hats & Shakers': '#5a5a5a' };
  let out = `<circle cx="${cx}" cy="${cy}" r="${inner - 14}" fill="none" stroke="${ORANGE}" stroke-width="1.5"/>\n`;
  samples.forEach((s, i) => {
    const a = (i / samples.length) * Math.PI * 2 - Math.PI / 2;
    const ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
    const bars = levels(s);
    const step = (outer - inner) / bars.length;
    // Mirrored outline along the spoke, as a closed shape.
    const side = (sign: number) => bars.map((v, k) => {
      const r = inner + k * step, w = sign * Math.max(0.4, v * 5.5);
      return `${f(cx + ux * r + px * w)},${f(cy + uy * r + py * w)}`;
    });
    const pts = [...side(1), ...side(-1).reverse()];
    out += `<path d="M${pts.join('L')}Z" fill="${shades[s.category] ?? ORANGE}" opacity="0.9"/>\n`;
  });
  return frame(out, 'SPACEKID ONE-SHOTS', `${samples.length} HITS // KICKS SNARES CLAPS PERC // SPACEKID LABS`);
}

/** Trap & Tape: two tape reels; each loop is one ring, its waveform drawn around the circle. */
function trapTape(samples: Sample[]) {
  const reels = [{ cx: 220, cy: 330 }, { cx: 580, cy: 330 }];
  const half = Math.ceil(samples.length / 2);
  const inner = 34, outer = 160;
  let out = `<path d="M${reels[0].cx - 4} ${reels[0].cy + outer + 6}L${reels[1].cx + 4} ${reels[1].cy + outer + 6}" stroke="#3f3f46" stroke-width="3"/>\n`;
  reels.forEach((reel, ri) => {
    const list = samples.slice(ri * half, (ri + 1) * half);
    const gap = (outer - inner) / list.length;
    out += `<circle cx="${reel.cx}" cy="${reel.cy}" r="${inner - 10}" fill="none" stroke="${ORANGE}" stroke-width="1.5"/>\n`;
    list.forEach((s, i) => {
      const bars = levels(s), r0 = inner + i * gap;
      let d = '';
      bars.forEach((v, k) => {
        const a = (k / bars.length) * Math.PI * 2 + ri * 0.4;
        const r1 = r0 + Math.max(0.6, v * gap * 0.9);
        d += `M${f(reel.cx + Math.cos(a) * r0)} ${f(reel.cy + Math.sin(a) * r0)}L${f(reel.cx + Math.cos(a) * r1)} ${f(reel.cy + Math.sin(a) * r1)}`;
      });
      const color = s.category === '808s' ? '#ffffff' : s.category === 'Trap Loops' ? ORANGE : '#8a8a8a';
      out += `<path d="${d}" stroke="${color}" stroke-width="${f(Math.max(1, (2 * Math.PI * r0) / bars.length * 0.55))}"/>\n`;
    });
  });
  return frame(out, 'TRAP & TAPE', `${samples.length} SOUNDS // LOOPS 808S FX // SPACEKID LABS`);
}

mkdirSync(OUT, { recursive: true });
const pack = (id: string) => SAMPLES.filter(s => s.pack === id && s.peaks);
writeFileSync(join(OUT, 'weird-breaks.svg'), weirdBreaks(pack('weird-breaks')));
writeFileSync(join(OUT, 'databend.svg'), databend(pack('databend')));
writeFileSync(join(OUT, 'one-shots.svg'), oneShots(pack('one-shots')));
writeFileSync(join(OUT, 'trap-tape.svg'), trapTape(pack('trap-tape')));
console.log('Wrote the pack covers in public/packs/');
