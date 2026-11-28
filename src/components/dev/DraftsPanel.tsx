import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, FileText, Lightbulb, Mic } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api, postJson } from '../../lib/devApi';
import type { Sketch } from '../../data/sketches';
import { PostPreview } from './PostPreview';
import { button, errorText, ghostButton } from './ui';

/**
 * Drafts on the Launchpad: archive posts saved as drafts and hidden sketches (everything Claude adds starts here).
 * Look at each one, then Publish it, or all of them at once. Nothing shows when there are no drafts.
 */
interface DraftPost {
  slug: string;
  meta: { title?: string; date?: string; tags?: string[]; index?: number; accentColor?: string; description?: string; isSpecial?: boolean };
  editableText: boolean;
}
interface Drafts { posts: DraftPost[]; sketches: Sketch[] }
type Key = `post:${string}` | `sketch:${string}`;

export function DraftsPanel({ onPublished, onEditPost }: { onPublished: () => void; onEditPost: () => void }) {
  const [data, setData] = useState<Drafts | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<Key | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const load = () => api<Drafts>('drafts').then(r => { setData(r); setError(''); }).catch(e => setError(errorText(e)));
  useEffect(() => {
    load();
    // Claude may add drafts or close issues while this tab is open: reload when you come back to it.
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  async function publish(posts: string[], sketches: string[]) {
    const n = posts.length + sketches.length;
    if (!confirm(`Publish ${n === 1 ? 'this draft' : `${n} drafts`}? ${n === 1 ? 'It goes' : 'They go'} live in about 2 minutes.`)) return;
    setBusy(true);
    setNote('');
    try {
      const r = await postJson<{ published: unknown[]; failed: Array<{ id: string; error: string }> }>('drafts-publish', { posts, sketches });
      setNote(r.failed.length
        ? `Published ${r.published.length}. Failed: ${r.failed.map(f => `${f.id} (${f.error})`).join(', ')}`
        : `Published ${r.published.length}. Live in about 2 minutes.`);
      setOpen(null);
      await load();
      onPublished();
    } catch (e) {
      setNote(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="font-mono text-xs text-red-400">Drafts: {error}</p>;
  if (!data || (!data.posts.length && !data.sketches.length)) return note ? <p className="font-mono text-xs text-zinc-400">{note}</p> : null;
  const total = data.posts.length + data.sketches.length;

  return (
    <section aria-labelledby="drafts-h" className="border border-amber-900/60 bg-amber-950/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 id="drafts-h" className="font-display font-bold text-xl text-white tracking-wide">
            Drafts <span className="text-zinc-500 font-normal">· {total} waiting to publish</span>
          </h2>
          <p className="mt-1 font-mono text-[11px] text-zinc-500">Saved, not on the site. What Claude writes lands here first.</p>
        </div>
        {total > 1 && (
          <button type="button" className={button} disabled={busy}
            onClick={() => publish(data.posts.map(p => p.slug), data.sketches.map(s => s.id))}>Publish all</button>
        )}
      </div>
      <ul className="divide-y divide-zinc-900 border-y border-zinc-900">
        {data.posts.map(p => (
          <DraftRow key={p.slug} k={`post:${p.slug}`} open={open} setOpen={setOpen} busy={busy}
            icon={<FileText className="w-4 h-4 text-zinc-400 shrink-0" aria-hidden />}
            title={p.meta.title ?? p.slug} sub={`Archive post · ${p.meta.date ?? ''} · /archive/${p.slug}`}
            onPublish={() => publish([p.slug], [])}>
            <PostDraft post={p} onEdit={onEditPost} />
          </DraftRow>
        ))}
        {data.sketches.map(s => (
          <DraftRow key={s.id} k={`sketch:${s.id}`} open={open} setOpen={setOpen} busy={busy}
            icon={s.kind === 'demo' ? <Mic className="w-4 h-4 text-brand-orange shrink-0" aria-hidden /> : <Lightbulb className="w-4 h-4 text-brand-gold shrink-0" aria-hidden />}
            title={s.title} sub={`Sketch (${s.kind}) · ${s.date}${s.kind === 'demo' && !s.file ? ' · no audio' : ''}`}
            onPublish={() => publish([], [s.id])}>
            <div className="space-y-3 text-sm text-zinc-300">
              {(s.text ?? '').split(/\n\s*\n/).filter(Boolean).map((para, i) => <p key={i} className="whitespace-pre-line">{para}</p>)}
              {!s.text && <p className="text-zinc-600 italic">No text.</p>}
              {s.tags?.length ? <p className="font-mono text-[11px] text-zinc-500">{s.tags.join(' · ')}</p> : null}
              {s.file && <audio controls preload="none" src={s.file} className="w-full" />}
              <p className="font-mono text-[11px] text-zinc-600">Edit it in the Sketches tab.</p>
            </div>
          </DraftRow>
        ))}
      </ul>
      {note && <p className="mt-3 font-mono text-xs text-zinc-400">{note}</p>}
    </section>
  );
}

function DraftRow({ k, open, setOpen, busy, icon, title, sub, onPublish, children }: {
  key?: string; k: Key; open: Key | null; setOpen: (k: Key | null) => void; busy: boolean; icon: ReactNode; title: string; sub: string;
  onPublish: () => void; children: ReactNode;
}) {
  const isOpen = open === k;
  return (
    <li className="py-2">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setOpen(isOpen ? null : k)} aria-expanded={isOpen}
          className="flex-1 min-w-0 flex items-center gap-3 text-left hover:bg-zinc-900/60 px-1 py-1">
          {isOpen ? <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden /> : <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden />}
          {icon}
          <span className="min-w-0">
            <span className="block truncate text-sm text-zinc-200">{title}</span>
            <span className="block truncate font-mono text-[10px] text-zinc-500">{sub}</span>
          </span>
        </button>
        <button type="button" className={cn(ghostButton, 'py-1.5')} disabled={busy} onClick={onPublish}>Publish</button>
      </div>
      {isOpen && <div className="mt-3 mb-2 pl-8">{children}</div>}
    </li>
  );
}

/** The post as it will look, read in full only when opened. */
function PostDraft({ post, onEdit }: { post: DraftPost; onEdit: () => void }) {
  const [source, setSource] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState('');
  useEffect(() => {
    api<{ source: string | null }>(`post-get?slug=${encodeURIComponent(post.slug)}`).then(r => setSource(r.source)).catch(e => setError(errorText(e)));
  }, [post.slug]);
  if (error) return <p className="font-mono text-xs text-red-400">{error}</p>;
  if (source === undefined) return <p className="text-sm text-zinc-500">Loading…</p>;
  const m = post.meta;
  return (
    <div className="space-y-3">
      {source === null
        ? <p className="text-sm text-zinc-500">Hand-written post: its text is code, so there's no preview here.</p>
        : <PostPreview title={m.title ?? ''} date={m.date ?? ''} tags={m.tags ?? []} index={Number(m.index ?? 0)}
            accentColor={m.accentColor ?? '#ffaa00'} isSpecial={Boolean(m.isSpecial)} body={source} />}
      <button type="button" onClick={onEdit} className="font-mono text-[11px] text-zinc-400 hover:text-white underline">Edit in the Archive tab</button>
    </div>
  );
}
