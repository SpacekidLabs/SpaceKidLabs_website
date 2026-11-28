/**
 * Builds the sample previews played on /samples.
 *
 * For every sample in src/data/samples.ts it:
 *   1. downloads the original from Google Drive into a cache folder (outside the repo),
 *   2. converts it to a compressed MP3 in public/audio/<name>.mp3 (served by the site itself),
 *   3. writes the preview path, duration, file size, format and a small waveform outline (peaks)
 *      back into src/data/samples.ts.
 * The originals stay on Drive; the download buttons still link there.
 *
 * Needs ffmpeg and ffprobe (brew install ffmpeg). Re-run after adding or replacing samples:
 *   npx tsx scripts/make-sample-previews.ts
 * Already-downloaded originals are reused; set SAMPLE_CACHE to choose the cache folder,
 * and pass --force to re-encode existing previews.
 *
 * Only one pack:      --pack weird-breaks   (other packs' rows are kept as they are)
 * Originals on disk:  LOCAL_SAMPLES="/path/to/folder" (files named exactly like `name`; used
 *                     instead of Drive, so this works before the pack is uploaded)
 * Shorter previews:   --max-preview 30  (seconds; longer sounds get the first 30 s with a fade-out.
 *                     Duration, size and waveform still describe the whole original.)
 * Smaller previews:   --quality 6  (LAME VBR level, 0 best to 9 smallest; default 2. Useful for
 *                     packs of long clips, where previews add up quickly.)
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { SAMPLES } from '../src/data/samples';

const ROOT = resolve(import.meta.dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'audio');
const DATA_FILE = join(ROOT, 'src', 'data', 'samples.ts');
const CACHE = process.env.SAMPLE_CACHE || join(tmpdir(), 'spacekid-sample-originals');
const FORCE = process.argv.includes('--force');
const ONLY_PACK = process.argv.includes('--pack') ? process.argv[process.argv.indexOf('--pack') + 1] : null;
const LOCAL = process.env.LOCAL_SAMPLES;
const MAX_PREVIEW = process.argv.includes('--max-preview') ? Number(process.argv[process.argv.indexOf('--max-preview') + 1]) : 0;
const QUALITY = process.argv.includes('--quality') ? process.argv[process.argv.indexOf('--quality') + 1] : '2';

/** "SP26 Kick 1+.wav" -> "sp26-kick-1" */
export function previewName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.(wav|mp3|aif|aiff|flac)$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** 0.62 -> "0.6s", 12.4 -> "12.4s", 75 -> "1:15" */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function run(cmd: string, args: string[]): string {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${cmd} failed: ${r.stderr || r.error}`);
  return r.stdout;
}


/** Number of bars in each waveform outline. */
const PEAK_BARS = 64;
/** One character per bar, 0 (silent) to 63 (loudest), so 64 bars fit in a 64-character string. */
const PEAK_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Loudest point in each of PEAK_BARS slices of the sound, scaled so the loudest bar is full height. */
function peaks(file: string): string {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', '8000', '-f', 'f32le', '-'], {
    maxBuffer: 1 << 28,
  });
  if (r.status !== 0) throw new Error(`ffmpeg peaks failed: ${r.stderr}`);
  const pcm = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, Math.floor(r.stdout.byteLength / 4));
  const bars = new Array(PEAK_BARS).fill(0);
  for (let i = 0; i < pcm.length; i++) {
    const bar = Math.min(PEAK_BARS - 1, Math.floor((i / pcm.length) * PEAK_BARS));
    bars[bar] = Math.max(bars[bar], Math.abs(pcm[i]));
  }
  const loudest = Math.max(...bars) || 1;
  return bars.map(v => PEAK_ALPHABET[Math.round((v / loudest) * 63)]).join('');
}

/** "WAV 24-bit", "WAV 32-bit float", "MP3" */
function formatLabel(file: string): string {
  const [codec, bits] = run('ffprobe', [
    '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_name,bits_per_sample', '-of', 'csv=p=0', file,
  ]).trim().split(',');
  if (codec.startsWith('pcm_f')) return `WAV ${bits}-bit float`;
  if (codec.startsWith('pcm_')) return `WAV ${bits}-bit`;
  return codec.toUpperCase();
}

async function download(driveId: string, file: string) {
  if (existsSync(file)) return;
  const res = await fetch(`https://drive.google.com/uc?export=download&id=${driveId}`);
  const type = res.headers.get('content-type') || '';
  if (!res.ok || type.includes('text/html')) {
    throw new Error(`Drive did not return audio for ${driveId} (${res.status} ${type}); check the file is shared publicly`);
  }
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(CACHE, { recursive: true });

const names = new Set<string>();
const updated = [];
for (const sample of SAMPLES) {
  const base = previewName(sample.name);
  if (names.has(base)) throw new Error(`Two samples map to the same preview name: ${base}`);
  names.add(base);
  if (ONLY_PACK && sample.pack !== ONLY_PACK) { updated.push(sample); continue; }

  const local = LOCAL && join(LOCAL, sample.name);
  const original = local && existsSync(local) ? local : join(CACHE, `${sample.driveId}`);
  const preview = join(OUT_DIR, `${base}.mp3`);
  if (original !== local) await download(sample.driveId, original);

  const seconds = Number(
    run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', original]).trim(),
  );
  if (FORCE || !existsSync(preview)) {
    const cut = MAX_PREVIEW > 0 && seconds > MAX_PREVIEW
      ? ['-t', String(MAX_PREVIEW), '-af', `afade=t=out:st=${MAX_PREVIEW - 1.5}:d=1.5`]
      : [];
    // VBR MP3 around 190 kbps: transparent for previews, about a tenth of the 24-bit WAV size.
    run('ffmpeg', ['-v', 'error', '-y', '-i', original, '-vn', ...cut, '-map_metadata', '-1', '-c:a', 'libmp3lame', '-q:a', QUALITY, preview]);
  }
  updated.push({
    ...sample,
    duration: formatDuration(seconds),
    preview: `/audio/${base}.mp3`,
    format: formatLabel(original),
    sizeBytes: statSync(original).size,
    peaks: peaks(original),
  });
  process.stdout.write('.');
}

const header = readFileSync(DATA_FILE, 'utf8').split('export const SAMPLES')[0];
const rows = updated.map(
  s =>
    `  { id: ${s.id}, pack: ${JSON.stringify(s.pack)}, name: ${JSON.stringify(s.name)}, category: ${JSON.stringify(s.category)}, ` +
    `duration: ${JSON.stringify(s.duration)}, format: ${JSON.stringify(s.format)}, sizeBytes: ${s.sizeBytes}, ` +
    `preview: ${JSON.stringify(s.preview)}, driveId: ${JSON.stringify(s.driveId)},\n    peaks: ${JSON.stringify(s.peaks)} },`,
);
writeFileSync(DATA_FILE, `${header}export const SAMPLES: Sample[] = [\n${rows.join('\n')}\n];\n`);
console.log(`\n${updated.length} previews in public/audio, durations, sizes and waveforms written to src/data/samples.ts`);
