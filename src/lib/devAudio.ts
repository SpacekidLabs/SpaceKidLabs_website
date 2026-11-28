/**
 * Audio helpers for the /dev dashboard, run in the browser: duration, waveform outline and format of an
 * uploaded file, and an MP3 encode for the preview. They match scripts/make-sample-previews.ts, which does
 * the same with ffmpeg, so samples added either way look the same on /samples.
 */
import { Mp3Encoder } from '@breezystack/lamejs';

/** Number of bars and alphabet of the waveform outline (see make-sample-previews.ts). */
const PEAK_BARS = 64;
const PEAK_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export interface AnalysedAudio {
  buffer: AudioBuffer;
  /** "0.6s", "12.4s", "1:15" */
  duration: string;
  /** "WAV 24-bit", "WAV 32-bit float", "MP3", ... */
  format: string;
  peaks: string;
}

export async function analyse(file: File): Promise<AnalysedAudio> {
  const bytes = await file.arrayBuffer();
  const format = formatLabel(file.name, bytes);
  const ctx = new OfflineAudioContext(1, 1, 44100);
  let buffer: AudioBuffer;
  try {
    buffer = await ctx.decodeAudioData(bytes.slice(0));
  } catch {
    throw new Error(`${file.name}: this browser can't read that file. Try WAV or MP3.`);
  }
  return { buffer, duration: formatDuration(buffer.duration), format, peaks: peaks(buffer) };
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function peaks(buffer: AudioBuffer): string {
  const bars = new Array(PEAK_BARS).fill(0);
  const n = buffer.length;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < n; i++) {
      const bar = Math.min(PEAK_BARS - 1, Math.floor((i / n) * PEAK_BARS));
      const v = Math.abs(data[i]);
      if (v > bars[bar]) bars[bar] = v;
    }
  }
  const loudest = Math.max(...bars) || 1;
  return bars.map(v => PEAK_ALPHABET[Math.round((v / loudest) * 63)]).join('');
}

/** Reads the WAV header for bit depth; other formats are named by extension. */
function formatLabel(name: string, bytes: ArrayBuffer): string {
  const view = new DataView(bytes);
  const tag = (o: number) => String.fromCharCode(...new Uint8Array(bytes, o, 4));
  if (bytes.byteLength > 12 && tag(0) === 'RIFF' && tag(8) === 'WAVE') {
    for (let o = 12; o + 8 <= bytes.byteLength; ) {
      const size = view.getUint32(o + 4, true);
      if (tag(o) === 'fmt ') {
        let fmt = view.getUint16(o + 8, true);
        const bits = view.getUint16(o + 22, true);
        if (fmt === 0xfffe && size >= 26) fmt = view.getUint16(o + 32, true); // WAVE_FORMAT_EXTENSIBLE
        return fmt === 3 ? `WAV ${bits}-bit float` : `WAV ${bits}-bit`;
      }
      o += 8 + size + (size % 2);
    }
    return 'WAV';
  }
  const ext = name.split('.').pop()?.toUpperCase() ?? '';
  return ext === 'AIF' ? 'AIFF' : ext || 'Audio';
}

/**
 * Encodes to MP3 (stereo if the source is, at the source sample rate when MP3 supports it).
 * `maxSeconds` cuts long files with a 1.5 s fade-out, like the preview script's --max-preview.
 */
export async function encodeMp3(
  buffer: AudioBuffer,
  { kbps = 192, maxSeconds = 0, onProgress }: { kbps?: number; maxSeconds?: number; onProgress?: (f: number) => void } = {},
): Promise<Blob> {
  const rates = [8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000];
  let source = buffer;
  if (!rates.includes(buffer.sampleRate)) source = await resample(buffer, 44100);
  const channels = Math.min(2, source.numberOfChannels);
  const rate = source.sampleRate;
  const length = maxSeconds > 0 ? Math.min(source.length, Math.floor(maxSeconds * rate)) : source.length;
  const fadeStart = maxSeconds > 0 && source.length > length ? length - Math.floor(1.5 * rate) : length;

  const toInt16 = (data: Float32Array) => {
    const out = new Int16Array(length);
    for (let i = 0; i < length; i++) {
      let v = data[i];
      if (i >= fadeStart) v *= (length - i) / (length - fadeStart);
      v = Math.max(-1, Math.min(1, v));
      out[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
    }
    return out;
  };
  const left = toInt16(source.getChannelData(0));
  const right = channels > 1 ? toInt16(source.getChannelData(1)) : undefined;

  const encoder = new Mp3Encoder(channels, rate, kbps);
  const parts: Uint8Array[] = [];
  const block = 1152 * 20;
  for (let i = 0; i < length; i += block) {
    const chunk = encoder.encodeBuffer(left.subarray(i, i + block), right?.subarray(i, i + block));
    if (chunk.length) parts.push(new Uint8Array(chunk));
    if ((i / block) % 20 === 0) {
      onProgress?.(i / length);
      await new Promise(r => setTimeout(r)); // keep the page responsive
    }
  }
  const end = encoder.flush();
  if (end.length) parts.push(new Uint8Array(end));
  onProgress?.(1);
  return new Blob(parts as BlobPart[], { type: 'audio/mpeg' });
}

async function resample(buffer: AudioBuffer, rate: number): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(buffer.numberOfChannels, Math.ceil(buffer.duration * rate), rate);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start();
  return ctx.startRendering();
}
