import { useEffect, useState } from 'react';
import { Check, Mail, RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api, postJson } from '../../lib/devApi';
import { errorText } from './ui';

/**
 * Messages: what people sent through the contact form (worker/messages.ts), so nothing waits unseen in the mail.
 * Reply opens your mail app with the message quoted; then mark it answered. Kept for 12 months at most.
 */

interface Message {
  id: string; created: number; name: string; email: string; service: string; links: string; page: string; message: string; answered: number | null;
}
interface Counts { unanswered: number; answered: number; oldestUnanswered: number | null }

const DAY = 86_400_000;
const ago = (t: number) => {
  const m = Math.floor((Date.now() - t) / 60_000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)} h ago`;
  const d = Math.floor(m / 1440);
  return `${d} day${d > 1 ? 's' : ''} ago`;
};

function replyLink(m: Message): string {
  const quoted = m.message.split(/\r?\n/).map(l => `> ${l}`).join('\n');
  const body = `Hi ${m.name.split(' ')[0]},\n\n\n\n${new Date(m.created).toLocaleDateString()}, ${m.name} wrote:\n${quoted}`;
  // encodeURIComponent, not URLSearchParams: mail apps read "+" literally.
  return `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(`Re: ${m.service}`)}&body=${encodeURIComponent(body)}`;
}

function MessageCard({ m, onChange }: { key?: string; m: Message; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [replied, setReplied] = useState(false);
  async function run(path: string, data: object) {
    setBusy(true); setError('');
    try { await postJson(path, data); onChange(); } catch (err) { setError(errorText(err)); setBusy(false); }
  }
  const waiting = !m.answered && Date.now() - m.created > 2 * DAY;
  const action = 'inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest border transition-colors disabled:opacity-40';

  return (
    <li className={cn('border p-4 md:p-5', m.answered ? 'border-zinc-900' : waiting ? 'border-amber-900/60 bg-zinc-950/40' : 'border-zinc-800 bg-zinc-950/40')}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-zinc-100 font-medium">{m.name}</span>
        <a href={`mailto:${m.email}`} className="font-mono text-xs text-zinc-400 hover:text-white break-all">{m.email}</a>
        <span className="px-1.5 py-0.5 border border-zinc-800 font-mono text-[10px] uppercase tracking-widest text-zinc-400">{m.service}</span>
        <span className={cn('ml-auto font-mono text-[11px]', waiting ? 'text-amber-400' : 'text-zinc-500')} title={new Date(m.created).toLocaleString()}>
          {ago(m.created)}
        </span>
      </div>
      <p className="mt-3 text-zinc-200 whitespace-pre-wrap break-words leading-relaxed">{m.message}</p>
      {m.links && (
        <p className="mt-3 font-mono text-xs text-zinc-400 break-all">
          Links: {m.links.split(/\s+/).map((l, i) => (/^https?:\/\//.test(l)
            ? <a key={i} href={l} target="_blank" rel="noreferrer nofollow" className="text-brand-orange hover:underline mr-2">{l}</a>
            : <span key={i} className="mr-2">{l}</span>))}
        </p>
      )}
      {m.page && <p className="mt-1 font-mono text-[10px] text-zinc-600">Sent from {m.page}</p>}

      <div className="flex flex-wrap items-center gap-2 mt-4">
        {!m.answered ? (
          <>
            <a href={replyLink(m)} onClick={() => setReplied(true)} className={cn(action, 'border-brand-orange text-brand-orange hover:bg-brand-orange/10')}>
              <Mail className="w-3.5 h-3.5" aria-hidden /> Reply
            </a>
            <button type="button" disabled={busy} onClick={() => run('message-mark', { id: m.id, answered: true })}
              className={cn(action, replied ? 'border-emerald-600 text-emerald-400 hover:bg-emerald-950/40' : 'border-zinc-800 text-zinc-400 hover:text-white')}>
              <Check className="w-3.5 h-3.5" aria-hidden /> Mark answered
            </button>
          </>
        ) : (
          <>
            <span className="font-mono text-[11px] text-emerald-500">Answered {ago(m.answered)}</span>
            <button type="button" disabled={busy} onClick={() => run('message-mark', { id: m.id, answered: false })} className={cn(action, 'border-zinc-800 text-zinc-400 hover:text-white')}>
              <RotateCcw className="w-3.5 h-3.5" aria-hidden /> Not answered
            </button>
          </>
        )}
        <span className="flex-grow" />
        <button type="button" disabled={busy} aria-label={`Delete the message from ${m.name}`}
          onClick={() => confirm(`Delete the message from ${m.name}? It's still in your email.`) && run('message-delete', { id: m.id })}
          className="p-2 text-zinc-500 hover:text-red-400 disabled:opacity-40"><Trash2 className="w-4 h-4" aria-hidden /></button>
      </div>
      {replied && !m.answered && <p className="mt-2 font-mono text-[11px] text-zinc-500">Sent your reply? Mark it answered.</p>}
      {error && <p className="mt-2 font-mono text-xs text-red-400">{error}</p>}
    </li>
  );
}

export function MessagesTab() {
  const [status, setStatus] = useState<'unanswered' | 'answered'>('unanswered');
  const [data, setData] = useState<{ messages: Message[]; count: Counts } | null>(null);
  const [error, setError] = useState('');
  const load = (s = status) => api<{ messages: Message[]; count: Counts }>(`messages?status=${s}`).then(r => { setData(r); setError(''); }).catch(e => setError(errorText(e)));
  useEffect(() => { setData(null); load(status); }, [status]);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display font-bold text-xl text-white tracking-wide">
            Messages{data && status === 'unanswered' && data.count.unanswered > 0 && <span className="text-zinc-500 font-normal"> · {data.count.unanswered} to answer</span>}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">From the contact form. Each one is also in your email; replies go from your mail app.</p>
        </div>
        <div role="group" aria-label="Show" className="flex gap-1 font-mono text-[11px] uppercase tracking-widest">
          {(['unanswered', 'answered'] as const).map(s => (
            <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)}
              className={cn('px-3 py-1.5 border transition-colors', status === s ? 'border-brand-orange text-brand-orange bg-brand-orange/10' : 'border-zinc-800 text-zinc-400 hover:text-white')}>
              {s} {data ? `(${data.count[s]})` : ''}
            </button>
          ))}
        </div>
      </div>
      {error ? <p className="font-mono text-xs text-red-400">{error}</p>
        : !data ? <p className="text-sm text-zinc-500">Loading…</p>
        : !data.messages.length ? (
          <p className="text-sm text-zinc-500 border border-dashed border-zinc-800 px-4 py-8 text-center">
            {status === 'unanswered' ? 'All answered.' : 'Nothing answered yet.'}
          </p>
        ) : <ul className="space-y-3">{data.messages.map(m => <MessageCard key={m.id} m={m} onChange={() => load()} />)}</ul>}
      <p className="mt-6 font-mono text-[11px] text-zinc-600">
        Messages sent before this tab existed are only in your email. Each message is deleted from here after 12 months (it says so on /privacy).
      </p>
    </section>
  );
}
