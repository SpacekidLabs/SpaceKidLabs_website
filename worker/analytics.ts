/**
 * Cloudflare traffic numbers for the /dev Overview tab, from Cloudflare's GraphQL Analytics API.
 *
 * Needs the CF_API_TOKEN secret: a Cloudflare API token with only "Zone → Analytics → Read" (spacekidlabs.com)
 * and "Account → Account Analytics → Read". It can read numbers and nothing else. Zone and account IDs are
 * plain vars in wrangler.jsonc (identifiers, not credentials).
 *
 * Each query is separate, so one the plan or token doesn't allow shows a message instead of failing the rest.
 */

export interface AnalyticsEnv {
  CF_API_TOKEN?: string;
  CF_ZONE_ID?: string;
  CF_ACCOUNT_ID?: string;
  /** Only for local tests against a mock. */
  CF_GRAPHQL_URL?: string;
  /** Only for local tests against a mock: Analytics Engine's SQL API (worker/events.ts). */
  CF_SQL_URL?: string;
}

const WORKER_NAME = 'spacekidlabs';

type Section<T> = ({ ok: true } & T) | { ok: false; error: string };

async function query<T>(env: Required<Pick<AnalyticsEnv, 'CF_API_TOKEN'>> & AnalyticsEnv, gql: string, variables: object): Promise<Section<{ data: T }>> {
  const res = await fetch(env.CF_GRAPHQL_URL || 'https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: gql, variables }),
  });
  if (res.status === 401 || res.status === 403) {
    return { ok: false, error: 'Cloudflare rejected CF_API_TOKEN. Check the token and its two Analytics: Read permissions.' };
  }
  if (!res.ok) return { ok: false, error: `Cloudflare answered ${res.status}.` };
  const body = (await res.json()) as { data?: T; errors?: Array<{ message: string }> | null };
  if (body.errors?.length) {
    // Cloudflare's own messages (e.g. "not authorized for that account", "time range too large"); no request data in them.
    console.error('Analytics:', body.errors.map(e => e.message).join('; '));
    return { ok: false, error: body.errors[0].message.slice(0, 200) };
  }
  if (!body.data) return { ok: false, error: 'Cloudflare returned no data.' };
  return { ok: true, data: body.data };
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

interface DayGroup {
  dimensions: { date: string };
  sum: {
    requests: number; cachedRequests: number; bytes: number; pageViews: number; threats: number;
    countryMap: Array<{ clientCountryName: string; requests: number }>;
    responseStatusMap: Array<{ edgeResponseStatus: number; requests: number }>;
    browserMap: Array<{ uaBrowserFamily: string; pageViews: number }>;
  };
  uniq: { uniques: number };
}

/** Adds up per-day {key, value} lists into a sorted top list. */
function top<T>(days: DayGroup[], pick: (d: DayGroup) => T[], key: (x: T) => string, value: (x: T) => number, n: number) {
  const totals = new Map<string, number>();
  for (const d of days) for (const x of pick(d)) totals.set(key(x), (totals.get(key(x)) ?? 0) + value(x));
  return [...totals].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }));
}

export async function cloudflareAnalytics(env: AnalyticsEnv, days: number) {
  if (!env.CF_API_TOKEN || !env.CF_ZONE_ID || !env.CF_ACCOUNT_ID) {
    return { configured: false as const };
  }
  const authed = { ...env, CF_API_TOKEN: env.CF_API_TOKEN.trim() };
  const now = new Date();
  const from = new Date(now.getTime() - (days - 1) * 86_400_000);
  const dayBefore = new Date(now.getTime() - 86_400_000);

  const [zone, paths, worker] = await Promise.all([
    query<{ viewer: { zones: Array<{ httpRequests1dGroups: DayGroup[] }> } }>(authed, `
      query ($zone: String!, $from: Date!, $to: Date!) {
        viewer { zones(filter: { zoneTag: $zone }) {
          httpRequests1dGroups(limit: 100, filter: { date_geq: $from, date_leq: $to }, orderBy: [date_ASC]) {
            dimensions { date }
            sum {
              requests cachedRequests bytes pageViews threats
              countryMap { clientCountryName requests }
              responseStatusMap { edgeResponseStatus requests }
              browserMap { uaBrowserFamily pageViews }
            }
            uniq { uniques }
          }
        } }
      }`, { zone: env.CF_ZONE_ID, from: iso(from), to: iso(now) }),
    // Top pages, last 24 hours (the free plan keeps request-level detail only briefly).
    query<{ viewer: { zones: Array<{ httpRequestsAdaptiveGroups: Array<{ count: number; dimensions: { clientRequestPath: string } }> }> } }>(authed, `
      query ($zone: String!, $from: Time!, $to: Time!) {
        viewer { zones(filter: { zoneTag: $zone }) {
          httpRequestsAdaptiveGroups(limit: 12, orderBy: [count_DESC], filter: {
            datetime_geq: $from, datetime_leq: $to, requestSource: "eyeball", edgeResponseContentTypeName: "html"
          }) { count dimensions { clientRequestPath } }
        } }
      }`, { zone: env.CF_ZONE_ID, from: dayBefore.toISOString(), to: now.toISOString() }),
    // The Worker only runs for /api/* (contact form and this dashboard); pages are static and don't count here.
    query<{ viewer: { accounts: Array<{ workersInvocationsAdaptive: Array<{ sum: { requests: number; errors: number }; dimensions: { date: string } }> }> } }>(authed, `
      query ($account: String!, $from: Date!, $to: Date!, $script: String!) {
        viewer { accounts(filter: { accountTag: $account }) {
          workersInvocationsAdaptive(limit: 100, filter: { scriptName: $script, date_geq: $from, date_leq: $to }, orderBy: [date_ASC]) {
            sum { requests errors }
            dimensions { date }
          }
        } }
      }`, { account: env.CF_ACCOUNT_ID, from: iso(from), to: iso(now), script: WORKER_NAME }),
  ]);

  let traffic: Section<{
    totals: { requests: number; cachedRequests: number; bytes: number; pageViews: number; visitors: number; threats: number };
    daily: Array<{ date: string; pageViews: number; visitors: number; requests: number }>;
    countries: Array<{ name: string; count: number }>;
    statuses: Array<{ name: string; count: number }>;
    browsers: Array<{ name: string; count: number }>;
  }>;
  if (zone.ok) {
    const groups = zone.data.viewer.zones[0]?.httpRequests1dGroups ?? [];
    const byDate = new Map(groups.map(g => [g.dimensions.date, g]));
    const daily = Array.from({ length: days }, (_, i) => {
      const date = iso(new Date(from.getTime() + i * 86_400_000));
      const g = byDate.get(date);
      return { date, pageViews: g?.sum.pageViews ?? 0, visitors: g?.uniq.uniques ?? 0, requests: g?.sum.requests ?? 0 };
    });
    const sum = (f: (g: DayGroup) => number) => groups.reduce((n, g) => n + f(g), 0);
    traffic = {
      ok: true,
      totals: {
        requests: sum(g => g.sum.requests),
        cachedRequests: sum(g => g.sum.cachedRequests),
        bytes: sum(g => g.sum.bytes),
        pageViews: sum(g => g.sum.pageViews),
        // Daily unique visitors added up: someone who comes back on two days counts twice.
        visitors: sum(g => g.uniq.uniques),
        threats: sum(g => g.sum.threats),
      },
      daily,
      countries: top(groups, g => g.sum.countryMap, x => x.clientCountryName, x => x.requests, 8),
      statuses: top(groups, g => g.sum.responseStatusMap, x => String(x.edgeResponseStatus), x => x.requests, 6),
      browsers: top(groups, g => g.sum.browserMap, x => x.uaBrowserFamily, x => x.pageViews, 6),
    };
  } else {
    traffic = zone;
  }

  return {
    configured: true as const,
    days,
    traffic,
    topPages: paths.ok
      ? { ok: true as const, items: (paths.data.viewer.zones[0]?.httpRequestsAdaptiveGroups ?? []).map(p => ({ name: p.dimensions.clientRequestPath, count: p.count })) }
      : paths,
    worker: worker.ok
      ? {
          ok: true as const,
          requests: worker.data.viewer.accounts[0]?.workersInvocationsAdaptive.reduce((n, d) => n + d.sum.requests, 0) ?? 0,
          errors: worker.data.viewer.accounts[0]?.workersInvocationsAdaptive.reduce((n, d) => n + d.sum.errors, 0) ?? 0,
        }
      : worker,
  };
}
