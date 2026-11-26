import { useCallback, useEffect, useRef, useState } from 'react';

interface Playable {
  id: number;
  name: string;
  preview: string;
}

/**
 * One audio player shared by every row on the samples page. Only one sample plays at a time, and
 * there's a single <audio> element no matter how many samples are auditioned.
 */
export function useSamplePlayer(onEnded?: (id: number) => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  /** Playback position of the current sample, 0 to 1. */
  const [progress, setProgress] = useState(0);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const playingIdRef = useRef<number | null>(null);

  // Created in an effect so the page can be pre-rendered without a browser.
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    let frame = 0;
    const tick = () => {
      if (audio.duration > 0) setProgress(audio.currentTime / audio.duration);
      frame = requestAnimationFrame(tick);
    };
    const onPlay = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(tick); };
    const onPause = () => cancelAnimationFrame(frame);
    const onEnd = () => {
      cancelAnimationFrame(frame);
      const id = playingIdRef.current;
      playingIdRef.current = null;
      setPlayingId(null);
      setProgress(0);
      if (id !== null) onEndedRef.current?.(id);
    };
    const onError = () => {
      console.error(`Could not load preview ${audio.src}`);
      onEnd();
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);
    return () => {
      cancelAnimationFrame(frame);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    playingIdRef.current = null;
    setPlayingId(null);
    setProgress(0);
  }, []);

  /** Plays a sample from the start, or from a position between 0 and 1. */
  const play = useCallback((sample: Playable, from = 0) => {
    const audio = audioRef.current;
    if (!audio) return;
    const src = new URL(sample.preview, location.href).href;
    if (audio.src !== src) audio.src = src;
    const start = () => {
      if (audio.duration > 0) audio.currentTime = from * audio.duration;
      audio.play().catch(err => {
        console.error(`Playback failed for ${sample.name}:`, err);
        stop();
      });
    };
    // Seeking needs the file's duration; for a fresh file wait until it's known.
    if (from > 0 && !(audio.duration > 0)) {
      audio.addEventListener('loadedmetadata', start, { once: true });
      audio.load();
    } else {
      start();
    }
    playingIdRef.current = sample.id;
    setPlayingId(sample.id);
    setProgress(from);
  }, [stop]);

  const toggle = useCallback((sample: Playable) => {
    if (playingIdRef.current === sample.id) stop();
    else play(sample);
  }, [play, stop]);

  return { playingId, progress, play, stop, toggle };
}
