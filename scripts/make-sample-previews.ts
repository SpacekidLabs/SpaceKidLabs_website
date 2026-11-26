/**
 * Builds the sample previews played on /samples.
 *
 * For every sample in src/data/samples.ts it:
 *   1. downloads the original from Google Drive into a cache folder (outside the repo),
 *   2. converts it to a compressed MP3 in public/audio/<name>.mp3 (served by the site itself),
 *   3. writes the preview path and the real duration back into src/data/samples.ts.
 * The originals stay on Drive; the download buttons still link there.
 *
 * Needs ffmpeg and ffprobe (brew install ffmpeg). Re-run after adding or replacing samples:
 *   npx tsx scripts/make-sample-previews.ts
 * Already-downloaded originals are reused; set SAMPLE_CACHE to choose the cache folder,
 * and pass --force to re-encode existing previews.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { SAMPLES } from '../src/data/samples';

const ROOT = resolve(import.meta.dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'audio');
const DATA_FILE = join(ROOT, 'src', 'data', 'samples.ts');
const CACHE = process.env.SAMPLE_CACHE || join(tmpdir(), 'spacekid-sample-originals');
const FORCE = process.argv.includes('--force');

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

  const original = join(CACHE, `${sample.driveId}`);
  const preview = join(OUT_DIR, `${base}.mp3`);
  await download(sample.driveId, original);

  if (FORCE || !existsSync(preview)) {
    // VBR MP3 around 190 kbps: transparent for previews, about a tenth of the 24-bit WAV size.
    run('ffmpeg', ['-v', 'error', '-y', '-i', original, '-vn', '-map_metadata', '-1', '-c:a', 'libmp3lame', '-q:a', '2', preview]);
  }
  const seconds = Number(
    run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', original]).trim(),
  );
  updated.push({ ...sample, duration: formatDuration(seconds), preview: `/audio/${base}.mp3` });
  process.stdout.write('.');
}

const header = readFileSync(DATA_FILE, 'utf8').split('export const SAMPLES')[0];
const rows = updated.map(
  s =>
    `  { id: ${s.id}, name: ${JSON.stringify(s.name)}, category: ${JSON.stringify(s.category)}, ` +
    `duration: ${JSON.stringify(s.duration)}, preview: ${JSON.stringify(s.preview)}, driveId: ${JSON.stringify(s.driveId)} },`,
);
writeFileSync(DATA_FILE, `${header}export const SAMPLES = [\n${rows.join('\n')}\n];\n`);
console.log(`\n${updated.length} previews in public/audio, durations written to src/data/samples.ts`);
