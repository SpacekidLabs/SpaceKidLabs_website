import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, FileText, Github, Lightbulb, Mic, Paperclip, Pencil, RotateCcw, Square, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api, postJson } from '../../lib/devApi';
import { analyse, encodeMp3 } from '../../lib/devAudio';
import { useProjects } from './useProjects';
import { Heatmap, NudgeStrip, useMomentum, useSound } from './Momentum';
import { button, errorText, ghostButton, input, label } from './ui';

/**
 * Launchpad: the first screen of /dev. A capture box for anything (text, links, pasted screenshots, dropped audio,
 * a voice memo), and the private idea inbox below it, where ideas get promoted to an issue, a sketch or a post,
 * or binned. Ideas are stored in Cloudflare D1 (worker/ideas.ts), never in the website repo.
 */

export interface IdeaFile { id: string; name: string; type: string; size: number }
export interface Idea {
  id: string; text: string; project: string | null; status: 'inbox' | 'promoted' | 'binned';
  promotedTo: { kind: string; label: string; url: string } | null; source: string; created: number; updated: number; files: IdeaFile[];
}
type Status = 'inbox' | 'promoted' | 'binned';
interface ListResult { ideas: Idea[]; count: Record<Status, number>; oldestInbox: number | null }

/** Handed to the Archive tab when an idea becomes a post; the Archive tab marks the idea once the post is published. */
export const POST_HANDOFF = 'dev-idea-post';
export interface PostHandoff { id: string; title: string; body: string }

const MAX_FILE = 25_000_000;
const DAY = 86_400_000;

export const fileUrl = (id: string) => `/api/dev/idea-file?id=${encodeURIComponent(id)}`;

function ago(t: number): string {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86_400);
  if (d < 14) return `${d} day${d > 1 ? 's' : ''} ago`;
  if (d < 60) return `${Math.floor(d / 7)} weeks ago`;
  return `${Math.floor(d / 30)} months ago`;
}

const isAudio = (f: File) => f.type.startsWith('audio/') || /\.(wav|aiff?|flac|mp3|m4a|ogg|webm)$/i.test(f.name);

/** Audio becomes an MP3 (small, plays everywhere, can turn into a sketch demo). If the browser can't read it, it stays as it is. */
async function prepare(f: File, onStatus: (s: string) => void): Promise<File> {
  if (!isAudio(f) || f.type === 'audio/mpeg' || /\.mp3$/i.test(f.name)) return f;
  try {
    onStatus(`Converting ${f.name} to MP3…`);
    const { buffer } = await analyse(f);
    const mp3 = await encodeMp3(buffer, { kbps: 160, onProgress: p => onStatus(`Converting ${f.name} to MP3… ${Math.round(p * 100)}%`) });
    return new File([mp3], f.name.replace(/\.[^.]+$/, '') + '.mp3', { type: 'audio/mpeg' });
  } catch {
    return f;
  }
}

/** URLs in the text become links. */
function Linked({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<>"']+)/g);
  return <>{parts.map((p, i) => (i % 2 ? <a key={i} href={p} target="_blank" rel="noreferrer" className="text-brand-orange underline break-all hover:text-brand-gold">{p}</a> : p))}</>;
}

/** First line as a title, the rest as text; a single long line is cut for the title and kept whole as text. */
function split(text: string): { title: string; body: string } {
  const [first, ...rest] = text.trim().split('\n');
  const t = first.trim();
  if (rest.length) return { title: t.slice(0, 120), body: rest.join('\n').trim() };
  return t.length > 80 ? { title: `${t.slice(0, 77).replace(/\s+\S*$/, '')}…`, body: t } : { title: t, body: '' };
}

// ---------- Capture ----------

function Capture({ projects, onSaved }: { projects: string[]; onSaved: () => void }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [project, setProject] = useState('');
  const [projectTouched, setProjectTouched] = useState(false);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [recording, setRecording] = useState<{ rec: MediaRecorder; started: number } | null>(null);
  const [, tick] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  // A project named in the text is picked for you, until you pick one yourself.
  const guess = useMemo(() => {
    const t = text.toLowerCase();
    return projects.find(p => t.includes(p.toLowerCase()) || t.includes(p.toLowerCase().replace(/[-_]/g, ' '))) ?? '';
  }, [text, projects]);
  const shownProject = projectTouched ? project : guess;

  useEffect(() => { box.current?.focus(); }, []);
  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => tick(n => n + 1), 500);
    return () => clearInterval(t);
  }, [recording]);

  function add(list: FileList | File[]) {
    const next = [...list];
    const big = next.find(f => f.size > MAX_FILE);
    if (big) setMessage({ ok: false, text: `${big.name} is over 25 MB. Bounce a shorter or compressed version.` });
    setFiles(prev => [...prev, ...next.filter(f => f.size <= MAX_FILE)]);
  }

  async function record() {
    if (recording) { recording.rec.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        setRecording(null);
        const type = rec.mimeType || 'audio/webm';
        const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        const stamp = new Date().toLocaleString('sv-SE').slice(0, 16).replace(':', '.');
        add([new File(chunks, `Voice memo ${stamp}.${ext}`, { type: type.split(';')[0] })]);
        box.current?.focus();
      };
      rec.start();
      setRecording({ rec, started: Date.now() });
    } catch (err) {
      setMessage({ ok: false, text: `Microphone: ${errorText(err)}` });
    }
  }

  async function save() {
    if (busy || recording || (!text.trim() && !files.length)) return;
    setMessage(null);
    try {
      const form = new FormData();
      form.set('text', text);
      if (shownProject) form.set('project', shownProject);
      for (const f of files) form.append('file', await prepare(f, setBusy));
      setBusy('Saving…');
      await api('idea', { method: 'POST', body: form });
      setText(''); setFiles([]); setProject(''); setProjectTouched(false);
      setMessage({ ok: true, text: 'Saved to the inbox.' });
      onSaved();
      box.current?.focus();
    } catch (err) {
      setMessage({ ok: false, text: errorText(err) });
    } finally {
      setBusy('');
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); save(); }
  }
  function onPaste(e: ClipboardEvent) {
    if (e.clipboardData.files.length) add(e.clipboardData.files);
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) { add(e.dataTransfer.files); return; }
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (url) setText(t => (t ? `${t}\n${url}` : url));
  }

  const seconds = recording ? Math.floor((Date.now() - recording.started) / 1000) : 0;

  return (
    <section
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
      onDrop={onDrop}
      className={cn('border bg-zinc-950/60 p-4 md:p-5 transition-colors', dragging ? 'border-brand-orange bg-brand-orange/5' : 'border-zinc-800 focus-within:border-zinc-600')}
    >
      <textarea
        id="capture-box"
        ref={box}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKey}
        onPaste={onPaste}
        rows={3}
        aria-label="New idea"
        placeholder={dragging ? 'Drop it here' : 'Got an idea? Type it, paste a link or screenshot, drop audio, or record a memo.'}
        className="w-full bg-transparent text-lg md:text-xl text-zinc-100 placeholder:text-zinc-600 outline-none resize-y min-h-20 font-sans leading-snug"
      />
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2 mt-3" aria-label="Files to add">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 border border-zinc-800 bg-black/40 pl-3 pr-1 py-1 font-mono text-[11px] text-zinc-300">
              {isAudio(f) ? <Mic className="w-3.5 h-3.5 text-brand-orange" aria-hidden /> : <Paperclip className="w-3.5 h-3.5 text-zinc-500" aria-hidden />}
              <span className="max-w-[16rem] truncate">{f.name}</span>
              <span className="text-zinc-600">{(f.size / 1e6).toFixed(1)} MB</span>
              <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`} className="p-1 text-zinc-500 hover:text-white">
                <X className="w-3.5 h-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button type="button" onClick={record} aria-pressed={Boolean(recording)}
          className={cn(ghostButton, 'py-2 inline-flex items-center gap-2', recording && 'border-red-500 text-red-400 hover:text-red-300')}>
          {recording ? <><Square className="w-3.5 h-3.5 fill-current" aria-hidden /> Stop {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</> : <><Mic className="w-3.5 h-3.5" aria-hidden /> Record</>}
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} className={cn(ghostButton, 'py-2 inline-flex items-center gap-2')}>
          <Paperclip className="w-3.5 h-3.5" aria-hidden /> Attach
        </button>
        <input ref={fileInput} type="file" multiple hidden onChange={e => { if (e.target.files) add(e.target.files); e.target.value = ''; }} />
        <select value={shownProject} onChange={e => { setProject(e.target.value); setProjectTouched(true); }} aria-label="Project"
          className={cn(input, 'w-auto py-2 text-xs font-mono')}>
          <option value="">No project</option>
          {projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="flex-grow" />
        <span className="hidden md:inline font-mono text-[10px] text-zinc-600">Enter saves · Shift+Enter new line</span>
        <button type="button" onClick={save} className={cn(button, 'py-2')} disabled={Boolean(busy) || Boolean(recording) || (!text.trim() && !files.length)}>
          Save idea
        </button>
      </div>
      {(busy || message) && (
        <p role="status" className={cn('mt-3 font-mono text-xs', busy ? 'text-zinc-400' : message?.ok ? 'text-emerald-400' : 'text-red-400')}>
          {busy || message?.text}
        </p>
      )}
    </section>
  );
}

// ---------- One idea ----------

type Panel = null | 'edit' | 'issue' | 'sketch';

function IdeaCard({ idea, projects, site, onChange, onPost }: {
  key?: string;
  idea: Idea; projects: string[]; site: string; onChange: () => void; onPost: (idea: Idea) => void;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [repo, setRepo] = useState('');
  const [tags, setTags] = useState('');
  const [project, setProject] = useState(idea.project ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const hasMp3 = idea.files.some(f => f.type === 'audio/mpeg');

  function open(p: Panel) {
    setError('');
    if (p === panel) { setPanel(null); return; }
    const s = split(idea.text || idea.files[0]?.name.replace(/\.[^.]+$/, '') || '');
    setTitle(s.title); setBody(p === 'edit' ? idea.text : s.body); setRepo(idea.project ?? site); setTags(''); setProject(idea.project ?? '');
    setPanel(p);
  }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError('');
    try { await fn(); setPanel(null); onChange(); } catch (err) { setError(errorText(err)); } finally { setBusy(false); }
  }
  const update = (patch: Record<string, unknown>) => run(() => postJson('idea-update', { id: idea.id, ...patch }));
  const promote = () => run(() => postJson('idea-promote', { id: idea.id, target: panel, title, text: body, repo, tags: tags.split(',').map(t => t.trim()).filter(Boolean) }));
  const remove = () => confirm('Delete this idea and its files for good? This can\'t be undone.') && run(() => postJson('idea-delete', { id: idea.id }));

  const age = Date.now() - idea.created;
  const action = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-40 transition-colors';

  return (
    <li className={cn('border bg-zinc-950/40 p-4', idea.status === 'inbox' && age > 14 * DAY ? 'border-amber-900/60' : 'border-zinc-900')}>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
        <span className={cn(idea.status === 'inbox' && age > 14 * DAY && 'text-amber-400')} title={new Date(idea.created).toLocaleString()}>{ago(idea.created)}</span>
        {idea.project && <span className="px-1.5 py-0.5 border border-zinc-800 text-zinc-300 normal-case tracking-normal">{idea.project}</span>}
        {idea.source === 'mcp' && <span>via Claude</span>}
        {idea.promotedTo && (
          idea.promotedTo.url.startsWith('/')
            ? <Link to={idea.promotedTo.url} className="ml-auto inline-flex items-center gap-1 text-emerald-400 normal-case tracking-normal hover:text-emerald-300">→ {idea.promotedTo.kind}: {idea.promotedTo.label}</Link>
            : <a href={idea.promotedTo.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-emerald-400 normal-case tracking-normal hover:text-emerald-300">→ {idea.promotedTo.label} <ArrowUpRight className="w-3 h-3" aria-hidden /></a>
        )}
      </div>

      {idea.text && <p className="text-zinc-100 whitespace-pre-wrap break-words leading-relaxed"><Linked text={idea.text} /></p>}

      {idea.files.length > 0 && (
        <div className="mt-3 space-y-2">
          {idea.files.map(f => f.type.startsWith('audio/') ? (
            <div key={f.id}>
              <p className="font-mono text-[10px] text-zinc-500 mb-1">{f.name}</p>
              <audio controls preload="none" src={fileUrl(f.id)} className="w-full max-w-md h-9 [color-scheme:dark]" />
            </div>
          ) : /^image\/(png|jpeg|gif|webp|avif)$/.test(f.type) ? (
            <a key={f.id} href={fileUrl(f.id)} target="_blank" rel="noreferrer" className="inline-block mr-2">
              <img src={fileUrl(f.id)} alt={f.name} loading="lazy" className="max-h-48 border border-zinc-800" />
            </a>
          ) : (
            <a key={f.id} href={fileUrl(f.id)} className="flex items-center gap-2 font-mono text-xs text-zinc-300 hover:text-white">
              <Paperclip className="w-3.5 h-3.5" aria-hidden /> {f.name} <span className="text-zinc-600">{(f.size / 1e6).toFixed(1)} MB</span>
            </a>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        {idea.status === 'inbox' && (
          <>
            <button type="button" className={cn(action, panel === 'issue' && 'border-brand-orange text-brand-orange')} onClick={() => open('issue')} disabled={busy}><Github className="w-3.5 h-3.5" aria-hidden /> Issue</button>
            <button type="button" className={cn(action, panel === 'sketch' && 'border-brand-orange text-brand-orange')} onClick={() => open('sketch')} disabled={busy}><Lightbulb className="w-3.5 h-3.5" aria-hidden /> Sketch</button>
            <button type="button" className={action} onClick={() => onPost(idea)} disabled={busy}><FileText className="w-3.5 h-3.5" aria-hidden /> Post</button>
            <span className="flex-grow" />
            <button type="button" className={cn(action, panel === 'edit' && 'border-brand-orange text-brand-orange')} onClick={() => open('edit')} disabled={busy} aria-label="Edit"><Pencil className="w-3.5 h-3.5" aria-hidden /></button>
            <button type="button" className={cn(action, 'hover:text-red-400')} onClick={() => update({ status: 'binned' })} disabled={busy}><Trash2 className="w-3.5 h-3.5" aria-hidden /> Bin</button>
          </>
        )}
        {idea.status === 'promoted' && (
          <button type="button" className={action} onClick={() => update({ status: 'inbox' })} disabled={busy}><RotateCcw className="w-3.5 h-3.5" aria-hidden /> Back to inbox</button>
        )}
        {idea.status === 'binned' && (
          <>
            <button type="button" className={action} onClick={() => update({ status: 'inbox' })} disabled={busy}><RotateCcw className="w-3.5 h-3.5" aria-hidden /> Restore</button>
            <button type="button" className={cn(action, 'text-red-400 border-red-900/60')} onClick={remove} disabled={busy}><Trash2 className="w-3.5 h-3.5" aria-hidden /> Delete forever</button>
          </>
        )}
      </div>

      {panel === 'edit' && (
        <div className="mt-4 space-y-3 border-t border-zinc-900 pt-4">
          <textarea className={cn(input, 'min-h-28')} value={body} onChange={e => setBody(e.target.value)} aria-label="Idea text" />
          <select className={cn(input, 'w-auto text-xs font-mono')} value={project} onChange={e => setProject(e.target.value)} aria-label="Project">
            <option value="">No project</option>
            {projects.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="button" className={cn(button, 'py-2')} disabled={busy} onClick={() => update({ text: body, project })}>Save</button>
            <button type="button" className={cn(ghostButton, 'py-2')} onClick={() => setPanel(null)}>Cancel</button>
          </div>
        </div>
      )}

      {(panel === 'issue' || panel === 'sketch') && (
        <div className="mt-4 space-y-3 border-t border-zinc-900 pt-4">
          <p className={label}>{panel === 'issue' ? 'New GitHub issue' : hasMp3 ? 'New demo on /sketches, with the MP3' : 'New idea on /sketches'}</p>
          {panel === 'issue' && (
            <select className={cn(input, 'w-auto text-xs font-mono')} value={repo} onChange={e => setRepo(e.target.value)} aria-label="Repository">
              {projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
          <input className={input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" aria-label="Title" maxLength={200} />
          <textarea className={cn(input, 'min-h-24')} value={body} onChange={e => setBody(e.target.value)} placeholder="Text (optional)" aria-label="Text" />
          {panel === 'sketch' && <input className={input} value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags, comma separated (optional)" aria-label="Tags" />}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={cn(button, 'py-2')} disabled={busy || !title.trim() || (panel === 'issue' && !repo)} onClick={promote}>
              {busy ? 'Working…' : panel === 'issue' ? `Create issue in ${repo}` : 'Add to sketches'}
            </button>
            <button type="button" className={cn(ghostButton, 'py-2')} onClick={() => setPanel(null)}>Cancel</button>
            {panel === 'sketch' && <span className="font-mono text-[10px] text-zinc-500">Public: live on the site in about 2 minutes.</span>}
          </div>
        </div>
      )}
      {error && <p className="mt-3 font-mono text-xs text-red-400">{error}</p>}
    </li>
  );
}

// ---------- Tab ----------

export function LaunchpadTab({ onPost, onIssues }: { onPost: (handoff: PostHandoff) => void; onIssues: () => void }) {
  const [status, setStatus] = useState<Status>('inbox');
  const [cheer, setCheer] = useState('');
  const sound = useSound();
  const momentum = useMomentum(streak => {
    sound.play();
    setCheer(streak > 1 ? `Day ${streak}. Streak alive.` : 'Day 1. A new streak starts.');
    setTimeout(() => setCheer(''), 5000);
  });
  const [data, setData] = useState<ListResult | null>(null);
  const [error, setError] = useState('');
  const { data: projectData } = useProjects();

  const projects = useMemo(
    () => (projectData?.ok ? projectData.items.filter(p => !p.archived && !p.fork).map(p => p.name) : []),
    [projectData],
  );
  const site = projectData?.ok ? projectData.site : '';

  const load = (s = status) =>
    api<ListResult>(`ideas?status=${s}`).then(r => { setData(r); setError(''); }).catch(e => setError(errorText(e)));
  /** After anything you do: the list, and the streak (which may cheer). */
  const changed = () => { load(); momentum.reload(); };
  useEffect(() => { setData(null); load(status); }, [status]);

  const inbox = data?.count.inbox ?? 0;
  const oldestDays = data?.oldestInbox ? Math.floor((Date.now() - data.oldestInbox) / DAY) : 0;

  let nudge: ReactNode = null;
  if (data && status === 'inbox') {
    if (inbox === 0) nudge = <span className="text-zinc-500">Inbox zero. Empty your head into the box above.</span>;
    else if (oldestDays >= 14) nudge = <span className="text-amber-400">The oldest idea has waited {oldestDays} days. Promote it or bin it.</span>;
    else if (inbox >= 10) nudge = <span className="text-amber-400">{inbox} ideas waiting. Pick one and ship it.</span>;
  }

  return (
    <div className="space-y-10">
      <div>
        <NudgeStrip data={momentum.data} s={momentum.stats} sound={sound} cheer={cheer} onIssues={onIssues} />
        <Capture projects={projects} onSaved={() => { momentum.reload(); if (status === 'inbox') load(); else setStatus('inbox'); }} />
      </div>

      <Heatmap s={momentum.stats} data={momentum.data} error={momentum.error} />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display font-bold text-xl text-white tracking-wide">
              {status === 'inbox' ? 'Inbox' : status === 'promoted' ? 'Promoted' : 'Binned'}
              {data && status === 'inbox' && inbox > 0 && <span className="text-zinc-500 font-normal"> · {inbox} waiting</span>}
            </h2>
            {nudge && <p className="mt-1 font-mono text-xs">{nudge}</p>}
          </div>
          <div role="group" aria-label="Show" className="flex gap-1 font-mono text-[11px] uppercase tracking-widest">
            {(['inbox', 'promoted', 'binned'] as const).map(s => (
              <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)}
                className={cn('px-3 py-1.5 border transition-colors', status === s ? 'border-brand-orange text-brand-orange bg-brand-orange/10' : 'border-zinc-800 text-zinc-400 hover:text-white')}>
                {s} {data ? `(${data.count[s]})` : ''}
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="font-mono text-xs text-red-400">{error}</p>
          : !data ? <p className="text-sm text-zinc-500">Loading…</p>
          : !data.ideas.length ? (
            <p className="text-sm text-zinc-500 border border-dashed border-zinc-800 px-4 py-8 text-center">
              {status === 'inbox' ? 'Nothing waiting.' : status === 'promoted' ? 'Nothing promoted yet.' : 'The bin is empty.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {data.ideas.map(i => (
                <IdeaCard key={i.id} idea={i} projects={projects} site={site} onChange={changed}
                  onPost={idea => {
                    const s = split(idea.text || '');
                    onPost({ id: idea.id, title: s.title, body: s.body || idea.text });
                  }} />
              ))}
            </ul>
          )}
        {status === 'binned' && data && data.ideas.length > 0 && (
          <p className="mt-3 font-mono text-[11px] text-zinc-600">Binned ideas stay until you delete them for good.</p>
        )}
      </section>
      <p className="font-mono text-[11px] text-zinc-600">
        Private: ideas live in Cloudflare, not on the site. Press <kbd className="text-zinc-400">N</kbd> on any tab to jump here.
        Claude can save ideas too (<code>capture_idea</code> in the spacekidlabs connector).
      </p>
    </div>
  );
}
