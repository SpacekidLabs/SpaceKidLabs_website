/**
 * Counts an action on the site (#19): sends {event, key} to POST /api/event (worker/events.ts), which adds one to
 * a counter in Cloudflare Workers Analytics Engine. No cookie, no id, nothing about the visitor: only which action
 * and which thing (a sample, pack, lab or file). Fire and forget; it never blocks or throws.
 */
export type TrackedEvent = 'sample_play' | 'sample_download' | 'pack_download' | 'databend_download' | 'lab_start';

export function track(event: TrackedEvent, key = '') {
  if (import.meta.env.DEV || typeof navigator === 'undefined') return;
  const body = JSON.stringify({ e: event, k: key.replace(/[^\w .:/-]+/g, ' ').trim().slice(0, 100) });
  try {
    if (navigator.sendBeacon?.('/api/event', body)) return;
    fetch('/api/event', { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch {
    /* counting is optional */
  }
}
