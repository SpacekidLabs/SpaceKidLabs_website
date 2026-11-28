import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/devApi';
import { BarChart } from './BarChart';

/** Cloudflare traffic for the /dev Overview tab (worker/analytics.ts). */

type Section<T> = ({ ok: true } & T) | { ok: false; error: string };
type Top = Array<{ name: string; count: number }>;
type Analytics =
  | { configured: false }
  | {
      configured: true;
      days: number;
      traffic: Section<{
        totals: { requests: number; cachedRequests: number; bytes: number; pageViews: number; visitors: number; threats: number };
        daily: Array<{ date: string; pageViews: number; visitors: number; requests: number }>;
        countries: Top;
        statuses: Top;
        browsers: Top;
      }>;
      topPages: Section<{ items: Top }>;
      worker: Section<{ requests: number; errors: number }>;
    };

const nf = new Intl.NumberFormat('en');
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const dayLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const shortDay = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function bytes(n: number): string {
  if (n < 1e6) return `${Math.round(n / 1e3)} KB`;
  if (n < 1e9) return `${(n / 1e6).toFixed(1)} MB`;
  return `${(n / 1e9).toFixed(2)} GB`;
}

const heading = 'font-mono text-[11px] uppercase tracking-widest text-zinc-500 mb-3';
const card = 'border border-zinc-800 bg-zinc-900/40 p-5';

function Stat({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className={card}>
      <div className={heading}>{label}</div>
      <div className="font-display font-bold text-3xl text-white tabular-nums">{value}</div>
      {detail && <div className="mt-1 text-xs text-zinc-400">{detail}</div>}
    </div>
  );
}

/** A ranked list with a thin bar per row, scaled to the first (largest) row. */
function TopList({ title, items, note, empty = 'No data yet.' }: { title: string; items: Top; note?: string; empty?: string }) {
  const max = items[0]?.count || 1;
  return (
    <section className={card}>
      <h2 className={heading}>{title}</h2>
      {!items.length ? <p className="text-sm text-zinc-500">{empty}</p> : (
        <ul className="space-y-2">
          {items.map(it => (
            <li key={it.name} className="text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-zinc-300 truncate font-mono text-xs">{it.name || '(unknown)'}</span>
                <span className="text-zinc-400 tabular-nums text-xs">{nf.format(it.count)}</span>
              </div>
              <div className="mt-1 h-1 bg-zinc-800 rounded-full overflow-hidden" aria-hidden>
                <div className="h-full bg-brand-orange/70 rounded-full" style={{ width: `${(it.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {note && <p className="mt-3 text-[11px] text-zinc-500">{note}</p>}
    </section>
  );
}

const Problem = ({ text }: { text: string }) => <p className="text-xs text-amber-400 leading-relaxed">{text}</p>;

export function TrafficSection() {
  const [days, setDays] = useState<7 | 30>(7);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    api<Analytics>(`analytics?days=${days}`).then(setData).catch(e => setError(e instanceof Error ? e.message : String(e)));
  }, [days]);

  const header = (
    <div className="flex items-baseline justify-between gap-4 pt-4">
      <h2 className="font-display font-bold text-xl text-white tracking-wide">Traffic</h2>
      <div role="group" aria-label="Time range" className="flex gap-1 font-mono text-[11px] uppercase tracking-widest">
        {([7, 30] as const).map(d => (
          <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}
            className={cn('px-3 py-1 border transition-colors', days === d ? 'border-brand-orange text-brand-orange bg-brand-orange/10' : 'border-zinc-800 text-zinc-400 hover:text-white')}>
            {d} days
          </button>
        ))}
      </div>
    </div>
  );

  if (error) return <>{header}<Problem text={error} /></>;
  if (!data) return <>{header}<p className="text-sm text-zinc-500">Loading…</p></>;
  if (!data.configured) {
    return (
      <>
        {header}
        <p className="text-sm text-zinc-400">
          Not set up yet: add the <code className="text-zinc-200">CF_API_TOKEN</code> secret in Cloudflare (an API token with
          Analytics read access only). See docs/HOSTING.md.
        </p>
      </>
    );
  }

  const t = data.traffic;
  return (
    <div className="space-y-4">
      {header}
      {!t.ok ? <Problem text={t.error} /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Visitors" value={compact.format(t.totals.visitors)} detail="Unique per day, added up" />
            <Stat label="Page views" value={compact.format(t.totals.pageViews)} detail={`${compact.format(t.totals.requests)} requests in all`} />
            <Stat
              label="Served from cache"
              value={t.totals.requests ? `${Math.round((t.totals.cachedRequests / t.totals.requests) * 100)}%` : '–'}
              detail={`${bytes(t.totals.bytes)} sent`}
            />
            <Stat
              label="Worker (/api)"
              value={data.worker.ok ? compact.format(data.worker.requests) : '–'}
              detail={data.worker.ok ? `${data.worker.errors} error${data.worker.errors === 1 ? '' : 's'} · contact form and /dev` : data.worker.error}
            />
          </div>
          <section className={card}>
            <h2 className={heading}>Page views per day</h2>
            <BarChart
              points={t.daily.map(d => ({ key: dayLabel(d.date), value: d.pageViews }))}
              describe={i => {
                const d = t.daily[i];
                return (
                  <>
                    <span className="font-mono tabular-nums text-white">{nf.format(d.pageViews)}</span> page views,{' '}
                    <span className="font-mono tabular-nums text-white">{nf.format(d.visitors)}</span> visitors on {dayLabel(d.date)}
                    {i === t.daily.length - 1 && <span className="text-zinc-500"> (today so far)</span>}
                  </>
                );
              }}
              firstLabel={shortDay(t.daily[0].date)}
              lastLabel="today"
            />
          </section>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.topPages.ok
              ? <TopList title="Top pages · 24 h" items={data.topPages.items} note="HTML page requests, so bots count too." />
              : <section className={card}><h2 className={heading}>Top pages · 24 h</h2><Problem text={data.topPages.error} /></section>}
            <TopList title="Countries" items={t.countries} note="By requests." />
            <TopList title="Browsers" items={t.browsers} note="By page views." />
            <TopList title="Status codes" items={t.statuses} note={t.totals.threats ? `${nf.format(t.totals.threats)} threats blocked.` : undefined} />
          </div>
        </>
      )}
    </div>
  );
}
