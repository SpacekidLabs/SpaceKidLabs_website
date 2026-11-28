/**
 * Counts of things people do on the site (#19): sample plays and downloads, full-pack downloads, DATABEND
 * downloads, labs started and contact messages sent.
 *
 * The site sends POST /api/event {e, k} with navigator.sendBeacon (src/lib/track.ts). Each event is one data
 * point in Workers Analytics Engine (the EVENTS binding in wrangler.jsonc): the event name, which thing (a
 * sample id, pack, lab or file name) and nothing else. No cookie, no IP address, no user agent, no visitor id
 * is stored, so counts can't be tied to a person. Cloudflare keeps the points for 3 months.
 *
 * Reading uses Analytics Engine's SQL API with the same CF_API_TOKEN as the traffic numbers (its
 * "Account Analytics: Read" permission covers it).
 */
import type { AnalyticsEnv } from './analytics';

export const DATASET = 'spacekidlabs_events';

/** Every event the site may send, with the label the dashboard shows. */
export const EVENTS: Record<string, string> = {
  sample_play: 'Sample plays',
  sample_download: 'Sample downloads',
  pack_download: 'Full pack downloads',
  databend_download: 'DATABEND downloads',
  lab_start: 'Labs started',
  contact_sent: 'Contact messages',
};

/** Crawlers, link previewers, headless browsers and scripts. People's browsers don't say these. */
const BOT = /bot|crawl|spider|slurp|preview|fetch|monitor|headless|lighthouse|python|curl|wget|httpclient|axios|node-fetch|go-http|java\//i;

export interface EventsEnv {
  EVENTS?: AnalyticsEngineDataset;
  SITE_ORIGIN?: string;
}

/** Writes one event. Does nothing if the binding is missing (local dev without it). */
export function record(env: EventsEnv, event: string, key = '') {
  if (!(event in EVENTS)) return;
  try {
    env.EVENTS?.writeDataPoint({ blobs: [event, key.slice(0, 100)], doubles: [1], indexes: [event] });
  } catch (err) {
    console.error('Event not recorded:', err);
  }
}

const done = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

/** POST /api/event. Always answers 204, so a beacon never shows an error; bad or foreign requests are just not counted. */
export async function handleEvent(request: Request, env: EventsEnv): Promise<Response> {
  if (request.method !== 'POST') return new Response(null, { status: 405 });
  const origin = env.SITE_ORIGIN || 'https://spacekidlabs.com';
  const from = request.headers.get('Origin');
  const site = request.headers.get('Sec-Fetch-Site');
  // Only the site's own pages count: browsers set Origin on POST, and Sec-Fetch-Site when they support it.
  if (from !== origin || (site && site !== 'same-origin')) return done();
  if (BOT.test(request.headers.get('User-Agent') ?? '')) return done();

  let body: { e?: unknown; k?: unknown };
  try {
    const text = await request.text();
    if (text.length > 500) return done();
    body = JSON.parse(text);
  } catch {
    return done();
  }
  const event = typeof body.e === 'string' ? body.e : '';
  if (event === 'contact_sent') return done(); // counted by the Worker itself after the email goes out
  const key = typeof body.k === 'string' && /^[\w .:/-]{0,100}$/.test(body.k) ? body.k : '';
  record(env, event, key);
  return done();
}

// ---------- Reading ----------

export interface EventCount {
  event: string;
  label: string;
  week: number;
  month: number;
  /** The most counted things this month, e.g. which samples or labs. */
  top: Array<{ key: string; week: number; month: number }>;
}

export type EventCounts = { configured: false } | { configured: true; ok: true; events: EventCount[] } | { configured: true; ok: false; error: string };

async function sql(env: AnalyticsEnv, query: string): Promise<Array<Record<string, string | number>>> {
  const url = env.CF_SQL_URL || `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`;
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${env.CF_API_TOKEN!.trim()}` }, body: query });
  const text = await res.text();
  if (res.status === 401 || res.status === 403) throw new Error('Cloudflare rejected CF_API_TOKEN for event counts. It needs Account Analytics: Read.');
  if (!res.ok) {
    // A dataset that has never been written to doesn't exist yet: that's zero events, not an error.
    if (/unknown table|does not exist|not found/i.test(text)) return [];
    throw new Error(`Cloudflare answered ${res.status}: ${text.slice(0, 160)}`);
  }
  return (JSON.parse(text) as { data?: Array<Record<string, string | number>> }).data ?? [];
}

/** Counts per event and per thing for the last 7 and 30 days. */
export async function eventCounts(env: AnalyticsEnv): Promise<EventCounts> {
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) return { configured: false };
  // Analytics Engine may sample busy datasets; _sample_interval turns each stored point back into what it stands for.
  const period = (days: number) => `
    SELECT blob1 AS event, blob2 AS key, SUM(_sample_interval) AS n
    FROM ${DATASET}
    WHERE timestamp > NOW() - INTERVAL '${days}' DAY
    GROUP BY event, key`;
  try {
    const [week, month] = await Promise.all([sql(env, period(7)), sql(env, period(30))]);
    const weekly = new Map(week.map(r => [`${r.event}\n${r.key}`, Number(r.n)]));
    const events: EventCount[] = Object.entries(EVENTS).map(([event, label]) => {
      const rows = month.filter(r => r.event === event);
      const top = rows
        .map(r => ({ key: String(r.key), week: weekly.get(`${event}\n${r.key}`) ?? 0, month: Number(r.n) }))
        .sort((a, b) => b.month - a.month);
      return {
        event,
        label,
        week: top.reduce((s, r) => s + r.week, 0),
        month: top.reduce((s, r) => s + r.month, 0),
        top: top.filter(r => r.key).slice(0, 10),
      };
    });
    return { configured: true, ok: true, events };
  } catch (err) {
    return { configured: true, ok: false, error: err instanceof Error ? err.message : 'Could not read event counts.' };
  }
}
