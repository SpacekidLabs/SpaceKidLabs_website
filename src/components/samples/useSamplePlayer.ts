import { useCallback, useEffect, useRef, useState } from 'react';
import { track } from '../../lib/track';

export interface Playable {
  id: number;
  name: string;
  preview: string;
  /** "0.5s", "12.3s" or "1:16" */
  duration: string;
}

/** Previews longer than this stream through an <audio> element instead of being decoded up front. */
const STREAM_OVER_SECONDS = 20;
/** Decoded audio kept in memory, in seconds (about 380 KB per second of stereo audio). */
const CACHE_SECONDS = 150;
/** Background downloads at once. */
const PREFETCH_CONCURRENCY = 4;

/** "0.5s" -> 0.5, "1:16" -> 76 */
export function durationSeconds(d: string): number {
  const m = d.match(/^(\d+):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : parseFloat(d) || 0;
}

const isLong = (s: Playable) => durationSeconds(s.duration) > STREAM_OVER_SECONDS;

/**
 * One player shared by every row on the samples page; only one sample plays at a time.
 *
 * Short previews are fetched and decoded ahead of time (`prefetch`, called as rows scroll into view)
 * and played from memory with the Web Audio API, so a click sounds almost immediately. Long previews
 * stream through a single <audio> element so they can start before the whole file has downloaded.
 *
 * The playing row's progress bar is moved directly (see `registerProgress`), not through React state,
 * so playback doesn't re-render the page on every animation frame.
 */
export function useSamplePlayer(onEnded?: (id: number) => void, { analytics = true }: { analytics?: boolean } = {}) {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const playingIdRef = useRef<number | null>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const ctxRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  /** For the Web Audio path: context time at which position 0 of the playing buffer would have played. */
  const startedAtRef = useRef(0);
  const durationRef = useRef(0);
  /** For the streaming path: the original's length. Long previews are only its first 30 s or so, so
   * positions are measured against this rather than the preview's own length. */
  const fullDurationRef = useRef(0);
  const frameRef = useRef(0);

  // Decoded previews (Map order = least recently used first) and in-flight loads.
  const buffers = useRef(new Map<string, AudioBuffer>());
  const cachedSeconds = useRef(0);
  const loading = useRef(new Map<string, Promise<AudioBuffer | null>>());
  const queue = useRef<string[]>([]);
  const active = useRef(0);

  // Progress bars of the rows currently on screen, by sample id.
  const progressEls = useRef(new Map<number, HTMLElement>());
  const setBar = (id: number | null, fraction: number) => {
    if (id === null) return;
    const el = progressEls.current.get(id);
    if (el) el.style.width = `${Math.min(100, Math.max(0, fraction * 100))}%`;
  };

  const context = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext({ latencyHint: 'interactive' });
    return ctxRef.current;
  };

  const remember = (url: string, buffer: AudioBuffer) => {
    buffers.current.set(url, buffer);
    cachedSeconds.current += buffer.duration;
    for (const [oldUrl, old] of buffers.current) {
      if (cachedSeconds.current <= CACHE_SECONDS || oldUrl === url) break;
      buffers.current.delete(oldUrl);
      cachedSeconds.current -= old.duration;
    }
  };

  /** Fetches and decodes one preview (once; later calls share the same promise). */
  const load = useCallback((url: string): Promise<AudioBuffer | null> => {
    const cached = buffers.current.get(url);
    if (cached) {
      buffers.current.delete(url); // move to most recently used
      buffers.current.set(url, cached);
      return Promise.resolve(cached);
    }
    let p = loading.current.get(url);
    if (!p) {
      // An OfflineAudioContext decodes without needing a user gesture first.
      p = fetch(url)
        .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.arrayBuffer(); })
        .then(data => new OfflineAudioContext(2, 1, 48000).decodeAudioData(data))
        .then(buffer => { remember(url, buffer); return buffer; })
        .catch(err => { console.error(`Could not load preview ${url}:`, err); return null; })
        .finally(() => loading.current.delete(url));
      loading.current.set(url, p);
    }
    return p;
  }, []);

  const pump = useCallback(() => {
    while (active.current < PREFETCH_CONCURRENCY && queue.current.length) {
      const url = queue.current.shift()!;
      if (buffers.current.has(url) || loading.current.has(url)) continue;
      active.current++;
      load(url).finally(() => { active.current--; pump(); });
    }
  }, [load]);

  /** Loads previews in the background, nearest first. Long previews are skipped (they stream). */
  const prefetch = useCallback((samples: Playable[]) => {
    if (typeof window === 'undefined') return;
    const urls = samples.filter(s => !isLong(s)).map(s => s.preview)
      .filter(u => !buffers.current.has(u) && !loading.current.has(u));
    queue.current = [...urls, ...queue.current.filter(u => !urls.includes(u))].slice(0, 200);
    pump();
  }, [pump]);

  const tick = useCallback(() => {
    const id = playingIdRef.current;
    if (id === null) return;
    let fraction = 0;
    if (sourceRef.current && ctxRef.current) {
      fraction = (ctxRef.current.currentTime - startedAtRef.current) / (durationRef.current || 1);
    } else if (audioRef.current && audioRef.current.duration > 0) {
      fraction = audioRef.current.currentTime / Math.max(audioRef.current.duration, fullDurationRef.current);
    }
    setBar(id, fraction);
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  /** Silences whatever is playing without touching React state. */
  const halt = () => {
    cancelAnimationFrame(frameRef.current);
    const source = sourceRef.current;
    sourceRef.current = null;
    if (source) { source.onended = null; try { source.stop(); } catch { /* already stopped */ } }
    const audio = audioRef.current;
    if (audio && !audio.paused) audio.pause();
    setBar(playingIdRef.current, 0);
  };

  const finish = useCallback(() => {
    const id = playingIdRef.current;
    halt();
    playingIdRef.current = null;
    setPlayingId(null);
    if (id !== null) onEndedRef.current?.(id);
  }, []);

  const stop = useCallback(() => {
    halt();
    playingIdRef.current = null;
    setPlayingId(null);
  }, []);

  /** Plays a sample from the start, or from a position between 0 and 1. */
  const play = useCallback((sample: Playable, from = 0) => {
    // A seek inside the sample that's already playing isn't another play.
    if (analytics && playingIdRef.current !== sample.id) track('sample_play', `${sample.id} ${sample.name}`);
    halt();
    playingIdRef.current = sample.id;
    setPlayingId(sample.id);

    if (isLong(sample)) {
      if (!audioRef.current) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.addEventListener('ended', () => { if (!sourceRef.current) finish(); });
        audioRef.current = audio;
      }
      const audio = audioRef.current;
      const src = new URL(sample.preview, location.href).href;
      if (audio.src !== src) audio.src = src;
      fullDurationRef.current = durationSeconds(sample.duration);
      const start = () => {
        if (playingIdRef.current !== sample.id) return;
        if (audio.duration > 0) {
          // A click on the waveform is a position in the whole sound; the preview may stop short of it.
          const at = from * Math.max(audio.duration, fullDurationRef.current);
          audio.currentTime = Math.min(at, Math.max(0, audio.duration - 2));
        }
        audio.play().then(() => { frameRef.current = requestAnimationFrame(tick); }).catch(err => {
          // Switching samples quickly cancels the previous play() with an AbortError; that's expected.
          if (err?.name === 'AbortError' || playingIdRef.current !== sample.id) return;
          console.error(`Playback failed for ${sample.name}:`, err);
          stop();
        });
      };
      if (from > 0 && !(audio.duration > 0)) audio.addEventListener('loadedmetadata', start, { once: true });
      else start();
      return;
    }

    // Resume inside the click/key handler: browsers only allow audio to start from a user gesture.
    const ctx = context();
    if (ctx.state !== 'running') void ctx.resume();
    const begin = (buffer: AudioBuffer | null) => {
      if (playingIdRef.current !== sample.id) return; // something else was picked while loading
      if (!buffer) { stop(); return; }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      // Positions are in the whole sound, which can be longer than its preview (see --max-preview).
      const full = Math.max(buffer.duration, durationSeconds(sample.duration));
      const offset = Math.min(from * full, buffer.duration * 0.999);
      startedAtRef.current = ctx.currentTime - offset;
      durationRef.current = full;
      source.onended = () => { if (sourceRef.current === source) finish(); };
      source.start(0, offset);
      sourceRef.current = source;
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(tick);
    };
    const ready = buffers.current.get(sample.preview);
    if (ready) begin(ready);
    else void load(sample.preview).then(begin);
  }, [analytics, finish, load, stop, tick]);

  const toggle = useCallback((sample: Playable) => {
    if (playingIdRef.current === sample.id) stop();
    else play(sample);
  }, [play, stop]);

  /** Rows hand over their progress-bar element so playback can move it without a re-render. */
  const registerProgress = useCallback((id: number, el: HTMLElement | null) => {
    if (el) progressEls.current.set(id, el);
    else progressEls.current.delete(id);
  }, []);

  useEffect(() => () => {
    halt();
    audioRef.current?.removeAttribute('src');
    void ctxRef.current?.close();
  }, []);

  return { playingId, play, stop, toggle, prefetch, registerProgress };
}
