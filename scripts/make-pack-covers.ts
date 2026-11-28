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

/** Cybernetics: every sound as one raster line, loud parts lit; a few lines tear sideways. One path per colour and
 * brightness step keeps the file small. */
function cybernetics(samples: Sample[]) {
  const rand = seededRandom(1984);
  const left = 40, top = 40, w = SIZE - 80, h = SIZE - 190, CELLS = 32;
  const rowH = h / samples.length, cellW = w / CELLS;
  const paths = new Map<string, string>();
  samples.forEach((s, i) => {
    const y = top + i * rowH;
    const tear = rand() < 0.08 ? (rand() - 0.5) * 160 : 0;
    const v = levels(s);
    const color = s.category === 'Textures' ? '#ffffff' : s.category === 'Glitch Hits' ? '#8a8a8a' : ORANGE;
    for (let k = 0; k < CELLS; k++) {
      const level = Math.max(v[k * 2], v[k * 2 + 1]) ** 2; // squared: only the loud parts light up
      if (level < 0.12) continue;
      const step = Math.min(4, Math.floor(level * 5));
      const key = `${color}|${step}`;
      paths.set(key, (paths.get(key) ?? '') + `M${f(left + k * cellW + tear)} ${f(y)}h${f(cellW - 0.6)}v${f(Math.max(rowH - 0.4, 0.6))}h${f(-(cellW - 0.6))}z`);
    }
  });
  let out = '';
  for (const [key, d] of paths) { const [color, step] = key.split('|'); out += `<path d="${d}" fill="${color}" opacity="${(0.2 + Number(step) * 0.2).toFixed(1)}"/>\n`; }
  return frame(out, 'CYBERNETICS', `${samples.length} GLITCH HITS, SLICES + TEXTURES // SPACEKID LABS`);
}

/** Drum Hits Vol. 2: a pad grid; each pad is one hit's waveform drawn around a circle. */
function drumHits(samples: Sample[]) {
  const cols = Math.ceil(Math.sqrt(samples.length * 1.1));
  const rows = Math.ceil(samples.length / cols);
  const pad = 50, cell = Math.min((SIZE - pad * 2) / cols, (SIZE - pad - 150) / rows);
  const x0 = (SIZE - cols * cell) / 2;
  const shades: Record<string, string> = { Kicks: ORANGE, 'Tape Hits': '#ffffff', 'Synth Hits': '#8a8a8a' };
  let out = '';
  samples.forEach((s, i) => {
    const cx = x0 + (i % cols) * cell + cell / 2, cy = pad + Math.floor(i / cols) * cell + cell / 2;
    const bars = levels(s), r0 = cell * 0.12;
    // The hit's waveform runs from the top of the pad down both sides, so each pad is symmetric.
    const side = (dir: number) => bars.map((v, k) => {
      const a = -Math.PI / 2 + dir * (k / (bars.length - 1)) * Math.PI, r = r0 + v * cell * 0.33;
      return `${f(cx + Math.cos(a) * r)},${f(cy + Math.sin(a) * r)}`;
    });
    const pts = [...side(1), ...side(-1).reverse()];
    out += `<path d="M${pts.join('L')}Z" fill="${shades[s.category] ?? ORANGE}" opacity="0.9"/>\n`;
  });
  return frame(out, 'DRUM HITS VOL. 2', `${samples.length} KICKS, TAPE HITS + SYNTH HITS // SPACEKID LABS`);
}

/** Shlims: every sound as a thin translucent waveform line, smeared into one stream. */
function shlims(samples: Sample[]) {
  const left = 40, right = SIZE - 40, mid = 330;
  const shades: Record<string, string> = { Loops: ORANGE, 'DATABEND & NoiseForge': '#ffffff', Smears: '#00d8ff', 'Metals & Objects': '#8a8a8a' };
  let out = '';
  samples.forEach((s, i) => {
    const bars = levels(s), step = (right - left) / (bars.length - 1);
    const drift = Math.sin(i * 0.7) * 120 * (i / samples.length);
    const top = bars.map((v, k) => `${f(left + k * step)},${f(mid + drift - v * 110)}`);
    const bottom = bars.map((v, k) => `${f(left + k * step)},${f(mid + drift + v * 110)}`).reverse();
    out += `<path d="M${top.join('L')}L${bottom.join('L')}Z" fill="${shades[s.category] ?? ORANGE}" opacity="0.07"/>\n`;
    out += `<path d="M${top.join('L')}" fill="none" stroke="${shades[s.category] ?? ORANGE}" stroke-width="0.6" opacity="0.5"/>\n`;
  });
  return frame(out, 'SHLIMS', `${samples.length} LOOPS, EXPORTS, SMEARS + METALS // SPACEKID LABS`);
}

/** VRAC Drums: a pad controller; every hit is one pad, its waveform lit as a level meter inside it. */
function vrac(samples: Sample[]) {
  const cols = 10;
  const pad = 60, gap = 10, cell = (SIZE - pad * 2 - gap * (cols - 1)) / cols;
  const shades: Record<string, string> = { Kicks: ORANGE, 'Snares, Claps & Perc': '#ffffff', 'Hats & Cymbals': '#8a8a8a' };
  let out = '';
  samples.forEach((s, i) => {
    const x = pad + (i % cols) * (cell + gap), y = 120 + Math.floor(i / cols) * (cell + gap);
    const color = shades[s.category] ?? ORANGE;
    out += `<rect x="${f(x)}" y="${f(y)}" width="${f(cell)}" height="${f(cell)}" rx="6" fill="none" stroke="#3f3f46" stroke-width="1.5"/>`;
    const bars = levels(s).filter((_, k) => k % 4 === 0), bw = (cell - 12) / bars.length;
    let d = '';
    bars.forEach((v, k) => { const hgt = Math.max(1, v * (cell - 14)); d += `M${f(x + 6 + k * bw)} ${f(y + cell - 7)}v${f(-hgt)}h${f(bw - 1.5)}v${f(hgt)}z`; });
    out += `<path d="${d}" fill="${color}" opacity="0.9"/>\n`;
  });
  return frame(out, 'VRAC DRUMS', `${samples.length} HITS // KICKS, PERC + HATS // SPACEKID LABS`);
}

/** Raw Sessions: every clip laid end to end like one long recording, wrapped into tape lanes. */
function rawSessions(samples: Sample[]) {
  const left = 40, right = SIZE - 40, top = 110, bottom = SIZE - 130;
  const shades: Record<string, string> = { Jams: ORANGE, 'Synth Sessions': '#ffffff', 'Tape & Radio': '#00d8ff', 'Junk & Percussion': '#8a8a8a', Processed: '#c084fc' };
  const bars = samples.flatMap(s => levels(s).filter((_, k) => k % 4 === 0).map(v => ({ v, color: shades[s.category] ?? ORANGE })));
  const bw = 3, perLane = Math.floor((right - left) / bw), lanes = Math.ceil(bars.length / perLane);
  const laneH = (bottom - top) / lanes;
  const paths: Record<string, string> = {};
  bars.forEach(({ v, color }, i) => {
    const x = left + (i % perLane) * bw, mid = top + Math.floor(i / perLane) * laneH + laneH / 2;
    const h = Math.max(0.6, v * (laneH * 0.9));
    paths[color] = (paths[color] ?? '') + `M${f(x)} ${f(mid - h / 2)}h2v${f(h)}h-2z`;
  });
  const out = Object.entries(paths).map(([c, d]) => `<path d="${d}" fill="${c}" opacity="0.85"/>`).join('\n');
  return frame(out, 'RAW SESSIONS', `${samples.length} CLIPS FROM LONG TAKES // SPACEKID LABS`);
}

mkdirSync(OUT, { recursive: true });
const pack = (id: string) => SAMPLES.filter(s => s.pack === id && s.peaks);
writeFileSync(join(OUT, 'weird-breaks.svg'), weirdBreaks(pack('weird-breaks')));
writeFileSync(join(OUT, 'databend.svg'), databend(pack('databend')));
writeFileSync(join(OUT, 'one-shots.svg'), oneShots(pack('one-shots')));
writeFileSync(join(OUT, 'trap-tape.svg'), trapTape(pack('trap-tape')));
writeFileSync(join(OUT, 'cybernetics.svg'), cybernetics(pack('cybernetics')));
writeFileSync(join(OUT, 'drum-hits-2.svg'), drumHits(pack('drum-hits-2')));
writeFileSync(join(OUT, 'shlims.svg'), shlims(pack('shlims')));
writeFileSync(join(OUT, 'vrac.svg'), vrac(pack('vrac')));
console.log('Wrote the pack covers in public/packs/');
writeFileSync(join(OUT, 'raw-sessions.svg'), rawSessions(pack('raw-sessions')));

// Small WebP thumbnails of the covers for the samples page.
await import('./make-pack-thumbs');
