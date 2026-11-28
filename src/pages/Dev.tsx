import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Lightbulb, LogOut, Mic, Pencil, Trash2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { usePageTitle } from '../lib/usePageTitle';
import { cn } from '../lib/utils';
import { analyse, encodeMp3 } from '../lib/devAudio';
import { PACKS, SAMPLES } from '../data/samples';
import { POSTS } from '../posts';
import type { Sketch } from '../data/sketches';
import { api, postJson } from '../lib/devApi';
import { OverviewTab } from '../components/dev/OverviewTab';
import { IssuesTab } from '../components/dev/IssuesTab';
import { ProjectsTab } from '../components/dev/ProjectsTab';
import { ShipTab } from '../components/dev/ShipTab';
import { MessagesTab } from '../components/dev/MessagesTab';
import { LaunchpadTab, POST_HANDOFF, type PostHandoff } from '../components/dev/LaunchpadTab';
import { button, errorText, Field, ghostButton, input, label } from '../components/dev/ui';

/**
 * /dev: the owner's dashboard, from any browser: the Launchpad (quick capture and the private idea inbox), all GitHub
 * projects and their issues, plus the website's traffic and adding sketches, samples and archive posts.
 * Saving goes to the Worker (worker/dev.ts), which commits to GitHub; the push redeploys the site.
 * The password and GitHub token live only in Cloudflare; this page never sees them.
 */

const REPO_URL = 'https://github.com/SpacekidLabs/SpaceKidLabs_website';
/** Keep each upload under the Worker's 100 MB request limit (base64 inside adds a third). */
const BATCH_BYTES = 40_000_000;

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

type Status = { kind: 'idle' } | { kind: 'busy'; text: string } | { kind: 'ok'; text: string; sha?: string; href?: string } | { kind: 'error'; text: string };

function StatusLine({ status }: { status: Status }) {
  if (status.kind === 'idle') return null;
  return (
    <p
      role="status"
      className={cn(
        'mt-4 font-mono text-xs leading-relaxed',
        status.kind === 'error' ? 'text-red-400' : status.kind === 'ok' ? 'text-emerald-400' : 'text-zinc-400',
      )}
    >
      {status.text}
      {status.kind === 'ok' && status.sha && (
        <>
          {' '}
          <a href={`${REPO_URL}/commit/${status.sha}`} target="_blank" rel="noreferrer" className="underline hover:text-white">
            commit {status.sha.slice(0, 7)}
          </a>
          . Live on the site in about 2 minutes
          {status.href && <> at <Link to={status.href} className="underline hover:text-white">{status.href}</Link></>}.
        </>
      )}
    </p>
  );
}

// ---------- Sketches ----------

function SketchesTab() {
  const [kind, setKind] = useState<'demo' | 'idea'>('demo');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [text, setText] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [list, setList] = useState<Sketch[] | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [editing, setEditing] = useState<Sketch | null>(null);
  const [audioMode, setAudioMode] = useState<'keep' | 'remove'>('keep');

  const reset = () => {
    setEditing(null); setKind('demo'); setTitle(''); setDate(today()); setText(''); setTags(''); setFile(null); setFileKey(k => k + 1); setAudioMode('keep');
  };
  function startEdit(s: Sketch) {
    setEditing(s); setKind(s.kind); setTitle(s.title); setDate(s.date); setText(s.text ?? ''); setTags((s.tags ?? []).join(', '));
    setFile(null); setFileKey(k => k + 1); setAudioMode('keep'); setStatus({ kind: 'idle' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const load = () => api<{ sketches: Sketch[] }>('content').then(r => setList(r.sketches)).catch(e => setStatus({ kind: 'error', text: errorText(e) }));
  useEffect(() => { load(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const form = new FormData();
      form.set('meta', JSON.stringify({ kind, title, date, text, tags: tags.split(','), ...(editing && { id: editing.id, audio: audioMode }) }));
      if (kind === 'demo' && file) {
        let mp3: Blob = file;
        if (!/\.mp3$/i.test(file.name)) {
          setStatus({ kind: 'busy', text: 'Reading audio…' });
          const { buffer } = await analyse(file);
          mp3 = await encodeMp3(buffer, { kbps: 192, onProgress: f => setStatus({ kind: 'busy', text: `Encoding MP3… ${Math.round(f * 100)}%` }) });
        }
        form.set('audio', mp3, 'audio.mp3');
      }
      setStatus({ kind: 'busy', text: 'Saving to GitHub…' });
      const r = await api<{ sha: string; id: string }>(editing ? 'sketch-update' : 'sketch', { method: 'POST', body: form });
      setStatus({ kind: 'ok', text: `${editing ? 'Updated' : 'Saved'} "${title}":`, sha: r.sha, href: `/sketches#${r.id}` });
      reset();
      load();
    } catch (err) {
      setStatus({ kind: 'error', text: errorText(err) });
    }
  }

  async function remove(s: Sketch) {
    if (!confirm(`Delete "${s.title}"${s.file ? ' and its audio' : ''}? It stays in the Git history.`)) return;
    try {
      setStatus({ kind: 'busy', text: `Deleting "${s.title}"…` });
      const r = await postJson<{ sha: string }>('sketch-delete', { id: s.id });
      if (editing?.id === s.id) reset();
      setStatus({ kind: 'ok', text: `Deleted "${s.title}":`, sha: r.sha });
      load();
    } catch (err) {
      setStatus({ kind: 'error', text: errorText(err) });
    }
  }

  return (
    <div className="grid md:grid-cols-[1fr_1fr] gap-10">
      <form onSubmit={submit} className="space-y-5">
        {editing && (
          <div className="flex items-center justify-between gap-3 border border-brand-orange/40 bg-brand-orange/5 px-4 py-2.5">
            <span className="font-mono text-xs text-brand-orange truncate">Editing "{editing.title}"</span>
            <button type="button" onClick={reset} className="font-mono text-[11px] uppercase tracking-widest text-zinc-400 hover:text-white shrink-0">Cancel</button>
          </div>
        )}
        <div role="group" aria-label="Kind" className="flex gap-2 font-mono text-xs uppercase tracking-widest">
          {(['demo', 'idea'] as const).map(k => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}
              className={cn('px-4 py-2 border transition-colors', kind === k ? 'border-brand-orange text-brand-orange bg-brand-orange/10' : 'border-zinc-800 text-zinc-400 hover:text-white')}>
              {k === 'demo' ? 'Demo' : 'Idea'}
            </button>
          ))}
        </div>
        <Field name="Title"><input className={input} value={title} onChange={e => setTitle(e.target.value)} required maxLength={200} /></Field>
        <Field name="Date"><input type="date" className={input} value={date} onChange={e => setDate(e.target.value)} required /></Field>
        {kind === 'demo' && (
          <Field name={editing?.file ? 'Replace audio' : 'Audio'} hint={editing?.file
            ? 'Pick a file to replace the current audio, or leave empty to keep it.'
            : "WAV, MP3, AIFF or FLAC. Anything that isn't MP3 is converted in your browser. Leave empty for a placeholder."}>
            <input key={fileKey} type="file" accept="audio/*,.wav,.mp3,.aif,.aiff,.flac" onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:px-4 file:py-2 file:border-0 file:bg-zinc-800 file:text-zinc-200 file:font-mono file:text-xs file:uppercase" />
          </Field>
        )}
        {kind === 'demo' && editing?.file && !file && (
          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input type="checkbox" checked={audioMode === 'remove'} onChange={e => setAudioMode(e.target.checked ? 'remove' : 'keep')} className="accent-brand-orange" />
            Remove the current audio (it becomes a placeholder)
          </label>
        )}
        <Field name={kind === 'demo' ? 'Note' : 'The idea'} hint="Blank line = new paragraph.">
          <textarea className={cn(input, 'min-h-32')} value={text} onChange={e => setText(e.target.value)} />
        </Field>
        <Field name="Tags" hint="Comma separated, e.g. 120 BPM, F minor, WIP"><input className={input} value={tags} onChange={e => setTags(e.target.value)} /></Field>
        <button className={button} disabled={status.kind === 'busy' || !title}>{editing ? 'Save changes' : `Save ${kind}`}</button>
        <StatusLine status={status} />
      </form>

      <div>
        <h2 className={label}>On the site ({list?.length ?? '…'})</h2>
        <ul className="divide-y divide-zinc-900 border-y border-zinc-900">
          {list?.map(s => (
            <li key={s.id} className="flex items-center gap-3 py-2.5">
              {s.kind === 'demo' ? <Mic className="w-4 h-4 text-brand-orange shrink-0" aria-hidden /> : <Lightbulb className="w-4 h-4 text-brand-gold shrink-0" aria-hidden />}
              <span className="flex-grow min-w-0">
                <span className="block truncate text-sm text-zinc-200">{s.title}</span>
                <span className="font-mono text-[10px] text-zinc-500">{s.date}{s.kind === 'demo' && !s.file && ' · no audio'}</span>
              </span>
              <button type="button" onClick={() => startEdit(s)} disabled={status.kind === 'busy'} aria-label={`Edit ${s.title}`}
                className={cn('p-2 transition-colors', editing?.id === s.id ? 'text-brand-orange' : 'text-zinc-500 hover:text-white')}><Pencil className="w-4 h-4" aria-hidden /></button>
              <button type="button" onClick={() => remove(s)} disabled={status.kind === 'busy'} aria-label={`Delete ${s.title}`}
                className="p-2 text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" aria-hidden /></button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------- Samples ----------

function SamplesTab() {
  const [pack, setPack] = useState(PACKS[0].id);
  const [category, setCategory] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [maxSeconds, setMaxSeconds] = useState(0);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [fileKey, setFileKey] = useState(0);

  const categories = useMemo(() => [...new Set(SAMPLES.filter(s => s.pack === pack).map(s => s.category))], [pack]);
  const counts = useMemo(() => Object.fromEntries(PACKS.map(p => [p.id, SAMPLES.filter(s => s.pack === p.id).length])), []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const done: Array<{ meta: { name: string; duration: string; format: string; sizeBytes: number; peaks: string }; mp3: Blob }> = [];
      for (const [i, file] of files.entries()) {
        setStatus({ kind: 'busy', text: `Converting ${i + 1} of ${files.length}: ${file.name}` });
        const a = await analyse(file);
        const mp3 = await encodeMp3(a.buffer, { kbps: 192, maxSeconds });
        done.push({ meta: { name: file.name, duration: a.duration, format: a.format, sizeBytes: file.size, peaks: a.peaks }, mp3 });
      }
      // Several commits if the previews are large.
      const batches: typeof done[] = [[]];
      let size = 0;
      for (const d of done) {
        if (size + d.mp3.size > BATCH_BYTES && batches[batches.length - 1].length) { batches.push([]); size = 0; }
        batches[batches.length - 1].push(d);
        size += d.mp3.size;
      }
      let sha = '';
      for (const [i, batch] of batches.entries()) {
        setStatus({ kind: 'busy', text: `Uploading${batches.length > 1 ? ` part ${i + 1} of ${batches.length}` : ''}…` });
        const form = new FormData();
        form.set('meta', JSON.stringify({ pack, category, items: batch.map(b => b.meta) }));
        batch.forEach((b, j) => form.set(`preview${j}`, b.mp3, `preview${j}.mp3`));
        sha = (await api<{ sha: string }>('samples', { method: 'POST', body: form })).sha;
      }
      setStatus({ kind: 'ok', text: `Added ${files.length} sample${files.length > 1 ? 's' : ''} to ${PACKS.find(p => p.id === pack)?.title}:`, sha, href: `/samples?pack=${pack}` });
      setFiles([]); setFileKey(k => k + 1);
    } catch (err) {
      setStatus({ kind: 'error', text: errorText(err) });
    }
  }

  return (
    <div className="space-y-16">
    <form onSubmit={submit} className="space-y-5 max-w-xl">
      <h2 className="font-display font-bold text-xl text-white">Add samples</h2>
      <Field name="Pack">
        <select className={input} value={pack} onChange={e => { setPack(e.target.value); setCategory(''); }}>
          {PACKS.map(p => <option key={p.id} value={p.id}>{p.title} ({counts[p.id]})</option>)}
        </select>
      </Field>
      <Field name="Category" hint={categories.length ? `In this pack: ${categories.join(', ')}` : 'A new category name'}>
        <input className={input} value={category} onChange={e => setCategory(e.target.value)} list="dev-categories" required maxLength={60} />
        <datalist id="dev-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field name="Files" hint="Pick several at once. Names are kept as they are (e.g. “VRAC Kick 7.wav”). The originals stay on your computer; only MP3 previews are uploaded.">
        <input key={fileKey} type="file" multiple accept="audio/*,.wav,.mp3,.aif,.aiff,.flac" onChange={e => setFiles([...(e.target.files ?? [])])}
          className="block w-full text-sm text-zinc-400 file:mr-4 file:px-4 file:py-2 file:border-0 file:bg-zinc-800 file:text-zinc-200 file:font-mono file:text-xs file:uppercase" />
      </Field>
      <Field name="Preview length limit (seconds)" hint="0 = whole file. For long clips, e.g. 30 keeps the first 30 s with a fade-out.">
        <input type="number" min={0} max={600} className={cn(input, 'w-32')} value={maxSeconds} onChange={e => setMaxSeconds(Number(e.target.value) || 0)} />
      </Field>
      <p className="text-xs text-zinc-500">
        Downloads link to Google Drive. New samples have no Drive link yet, so they show without a download button
        until the Drive IDs are added.
      </p>
      <button className={button} disabled={status.kind === 'busy' || !files.length || !category}>
        Add {files.length || ''} sample{files.length === 1 ? '' : 's'}
      </button>
      <StatusLine status={status} />
    </form>
    <SampleEditor />
    </div>
  );
}

interface SampleRow { id: number; pack: string; name: string; category: string; duration: string; format: string; sizeBytes: number; preview: string; driveId: string }
type SampleEdit = { name?: string; category?: string; driveId?: string; pack?: string };
const PAGE = 100;

/** Edit or delete samples already on the site, one pack at a time, read from GitHub (newer than this build). */
function SampleEditor() {
  const [pack, setPack] = useState(PACKS[0].id);
  const [rows, setRows] = useState<SampleRow[] | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [edits, setEdits] = useState<Map<number, SampleEdit>>(new Map());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [limit, setLimit] = useState(PAGE);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [moveTo, setMoveTo] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  const busy = status.kind === 'busy';

  const load = (p = pack) => {
    setRows(null); setEdits(new Map()); setSelected(new Set()); setLimit(PAGE);
    api<{ samples: SampleRow[] }>(`samples-list?pack=${encodeURIComponent(p)}`).then(r => setRows(r.samples)).catch(e => setStatus({ kind: 'error', text: errorText(e) }));
  };
  useEffect(() => { load(pack); }, [pack]);

  const categories = useMemo(() => [...new Set((rows ?? []).map(r => r.category))], [rows]);
  const q = query.trim().toLowerCase();
  const shown = (rows ?? []).filter(r => (!category || r.category === category) && (!q || r.name.toLowerCase().includes(q)));
  const value = (r: SampleRow, k: keyof SampleEdit) => edits.get(r.id)?.[k] ?? r[k];

  function edit(r: SampleRow, k: keyof SampleEdit, v: string) {
    setEdits(prev => {
      const next = new Map<number, SampleEdit>(prev);
      const e: SampleEdit = { ...(next.get(r.id) ?? {}), [k]: v };
      if (e[k] === r[k]) delete e[k];
      if (Object.keys(e).length) next.set(r.id, e); else next.delete(r.id);
      return next;
    });
  }
  function bulk(k: 'pack' | 'category', v: string) {
    if (!v) return;
    setEdits(prev => {
      const next = new Map<number, SampleEdit>(prev);
      for (const id of selected) {
        const r = rows!.find(x => x.id === id)!;
        const e: SampleEdit = { ...(next.get(id) ?? {}), [k]: v };
        if (e[k] === r[k]) delete e[k];
        if (Object.keys(e).length) next.set(id, e); else next.delete(id);
      }
      return next;
    });
  }
  const toggle = (id: number) => setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allShown = shown.length > 0 && shown.every(r => selected.has(r.id));

  async function save() {
    try {
      setStatus({ kind: 'busy', text: `Saving ${edits.size} change${edits.size === 1 ? '' : 's'}…` });
      const r = await postJson<{ sha: string; changed: number }>('samples-update', { changes: [...edits].map(([id, e]) => ({ id, ...e })) });
      setStatus({ kind: 'ok', text: `Updated ${r.changed} sample${r.changed === 1 ? '' : 's'}:`, sha: r.sha, href: `/samples?pack=${pack}` });
      load();
    } catch (err) {
      setStatus({ kind: 'error', text: errorText(err) });
    }
  }
  async function remove() {
    const names = rows!.filter(r => selected.has(r.id)).map(r => r.name);
    if (!confirm(`Delete ${names.length} sample${names.length === 1 ? '' : 's'} and their previews from the site?\n\n${names.slice(0, 10).join('\n')}${names.length > 10 ? `\n…and ${names.length - 10} more` : ''}\n\nThe originals on Google Drive aren't touched.`)) return;
    try {
      setStatus({ kind: 'busy', text: `Deleting ${names.length}…` });
      const r = await postJson<{ sha: string; removed: string[] }>('samples-delete', { ids: [...selected] });
      setStatus({ kind: 'ok', text: `Deleted ${r.removed.length}:`, sha: r.sha, href: `/samples?pack=${pack}` });
      load();
    } catch (err) {
      setStatus({ kind: 'error', text: errorText(err) });
    }
  }

  const cell = 'bg-transparent border border-transparent hover:border-zinc-800 focus:border-brand-orange px-2 py-1 text-sm text-zinc-200 outline-none w-full';

  return (
    <section className="space-y-4">
      <h2 className="font-display font-bold text-xl text-white">Edit samples</h2>
      <div className="flex flex-wrap gap-3">
        <select className={cn(input, 'w-auto')} value={pack} onChange={e => setPack(e.target.value)} aria-label="Pack" disabled={busy}>
          {PACKS.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <select className={cn(input, 'w-auto')} value={category} onChange={e => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className={cn(input, 'w-56')} placeholder="Search names…" aria-label="Search samples" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {!rows ? <p className="text-sm text-zinc-500">Loading from GitHub…</p> : (
        <>
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-zinc-400">
            <span>{shown.length} shown{selected.size ? ` · ${selected.size} selected` : ''}{edits.size ? ` · ${edits.size} edited` : ''}</span>
            {selected.size > 0 && (
              <>
                <select className={cn(input, 'w-auto py-1 text-xs')} value={moveTo} aria-label="Move selected to pack"
                  onChange={e => { bulk('pack', e.target.value); setMoveTo(''); }}>
                  <option value="">Move selected to…</option>
                  {PACKS.filter(p => p.id !== pack).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <input className={cn(input, 'w-48 py-1 text-xs')} placeholder="Category for selected" list="dev-sample-categories" value={bulkCategory}
                  onChange={e => setBulkCategory(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); bulk('category', bulkCategory.trim()); setBulkCategory(''); } }} aria-label="Category for selected (press Enter)" />
              </>
            )}
          </div>
          <datalist id="dev-sample-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
          <div className="overflow-x-auto border border-zinc-900">
            <table className="w-full text-left">
              <thead className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 border-b border-zinc-900">
                <tr>
                  <th className="p-2 w-8"><input type="checkbox" aria-label="Select all shown" checked={allShown} className="accent-brand-orange"
                    onChange={() => setSelected(allShown ? new Set() : new Set(shown.map(r => r.id)))} /></th>
                  <th className="p-2">Name</th><th className="p-2">Category</th><th className="p-2">Drive file ID</th><th className="p-2 w-20">Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {shown.slice(0, limit).map(r => {
                  const moved = edits.get(r.id)?.pack;
                  return (
                    <tr key={r.id} className={cn(edits.has(r.id) && 'bg-brand-orange/5', selected.has(r.id) && 'bg-zinc-900/60')}>
                      <td className="p-2"><input type="checkbox" aria-label={`Select ${r.name}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="accent-brand-orange" /></td>
                      <td className="p-1 min-w-[14rem]">
                        <input className={cell} value={value(r, 'name')} onChange={e => edit(r, 'name', e.target.value)} aria-label={`Name of ${r.name}`} />
                        {moved && <span className="px-2 font-mono text-[10px] text-brand-orange">→ {PACKS.find(p => p.id === moved)?.title}</span>}
                      </td>
                      <td className="p-1 min-w-[9rem]"><input className={cell} list="dev-sample-categories" value={value(r, 'category')} onChange={e => edit(r, 'category', e.target.value)} aria-label={`Category of ${r.name}`} /></td>
                      <td className="p-1 min-w-[12rem]"><input className={cn(cell, 'font-mono text-xs')} value={value(r, 'driveId')} placeholder="none" onChange={e => edit(r, 'driveId', e.target.value)} aria-label={`Drive ID of ${r.name}`} /></td>
                      <td className="p-2 font-mono text-[11px] text-zinc-500">
                        <a href={r.preview} target="_blank" rel="noreferrer" className="hover:text-white">{r.duration}</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {shown.length > limit && (
            <button type="button" className={ghostButton} onClick={() => setLimit(l => l + PAGE)}>Show {Math.min(PAGE, shown.length - limit)} more</button>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={button} disabled={busy || !edits.size} onClick={save}>Save {edits.size || ''} change{edits.size === 1 ? '' : 's'}</button>
            {edits.size > 0 && <button type="button" className={ghostButton} disabled={busy} onClick={() => setEdits(new Map())}>Undo edits</button>}
            <span className="flex-grow" />
            <button type="button" disabled={busy || !selected.size} onClick={remove}
              className="px-4 py-2.5 border border-red-900/60 text-red-400 font-mono text-xs uppercase tracking-widest hover:bg-red-950/40 disabled:opacity-40 inline-flex items-center gap-2">
              <Trash2 className="w-4 h-4" aria-hidden /> Delete {selected.size || ''} selected
            </button>
          </div>
          <p className="text-xs text-zinc-500">The list comes from GitHub, so it includes changes that aren't live yet. Deleting removes the sample and its preview from the site; the original in Google Drive stays.</p>
        </>
      )}
      <StatusLine status={status} />
    </section>
  );
}

// ---------- Archive ----------

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

interface PostSummary {
  slug: string;
  meta: { title?: string; date?: string; tags?: string[]; index?: number; accentColor?: string; description?: string; isSpecial?: boolean };
  fixed: Record<string, string>;
  editableText: boolean;
  linkedFrom: string[];
}

function ArchiveTab() {
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [listError, setListError] = useState('');
  const [query, setQuery] = useState('');
  /** null = new post; a slug = editing that post. */
  const [editing, setEditing] = useState<PostSummary | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [date, setDate] = useState(today);
  const [tags, setTags] = useState('');
  const [accent, setAccent] = useState('#ffaa00');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(0);
  const [special, setSpecial] = useState(false);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  /** Narrow screens show the list or the form, not both. */
  const [formOpen, setFormOpen] = useState(false);

  /** An idea from the Launchpad being written up as a post; marked promoted once the post is published. */
  const [fromIdea, setFromIdea] = useState<PostHandoff | null>(null);

  const load = () => api<{ posts: PostSummary[] }>('posts').then(r => setPosts(r.posts)).catch(e => setListError(errorText(e)));
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const raw = sessionStorage.getItem(POST_HANDOFF);
    if (!raw) return;
    sessionStorage.removeItem(POST_HANDOFF);
    const h = JSON.parse(raw) as PostHandoff;
    startNew();
    setFromIdea(h); setTitle(h.title); setBody(h.body);
  }, []);

  const nextIndex = Math.max(0, ...(posts ?? POSTS.map(p => ({ meta: p.meta }))).map(p => Number(p.meta.index ?? 0))) + 1;
  const finalSlug = editing ? editing.slug : slugEdited ? slug : slugify(title);
  const busy = status.kind === 'busy';

  function startNew() {
    setFromIdea(null); setEditing(null); setSource(null); setTitle(''); setSlug(''); setSlugEdited(false); setDate(today()); setTags('');
    setAccent('#ffaa00'); setDescription(''); setBody(''); setSpecial(false); setStatus({ kind: 'idle' });
    setFormOpen(true);
    window.scrollTo({ top: 0 });
  }
  function closeForm() {
    setFormOpen(false); setEditing(null);
  }

  async function startEdit(p: PostSummary) {
    setEditing(p); setStatus({ kind: 'idle' }); setLoadingPost(true);
    const m = p.meta;
    setTitle(m.title ?? ''); setDate(m.date ?? today()); setTags((m.tags ?? []).join(', ')); setAccent(m.accentColor ?? '#ffaa00');
    setDescription(m.description ?? ''); setOrder(Number(m.index ?? 0)); setSpecial(Boolean(m.isSpecial)); setBody(''); setSource(null);
    setFormOpen(true);
    window.scrollTo({ top: 0 });
    try {
      const full = await api<{ source: string | null }>(`post-get?slug=${encodeURIComponent(p.slug)}`);
      setSource(full.source); setBody(full.source ?? '');
    } catch (err) {
      setStatus({ kind: 'error', text: errorText(err) });
    } finally {
      setLoadingPost(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      setStatus({ kind: 'busy', text: 'Saving to GitHub…' });
      if (editing) {
        const meta: Record<string, unknown> = { title, date, tags: tags.split(','), index: order, description: description || null, isSpecial: special };
        if (!('accentColor' in editing.fixed)) meta.accentColor = accent;
        const r = await postJson<{ sha: string; slug: string }>('post-update', { slug: editing.slug, meta, ...(source !== null && { body }) });
        setStatus({ kind: 'ok', text: `Updated "${title}":`, sha: r.sha, href: `/archive/${r.slug}` });
      } else {
        const r = await postJson<{ sha: string; slug: string }>('post', {
          title, slug: finalSlug, date, tags: tags.split(','), index: nextIndex, accentColor: accent, description, body,
        });
        if (fromIdea) {
          await postJson('idea-update', { id: fromIdea.id, status: 'promoted', promotedTo: { kind: 'post', label: title, url: `/archive/${r.slug}` } }).catch(() => {});
          setFromIdea(null);
        }
        startNew();
        setStatus({ kind: 'ok', text: `Published "${title}":`, sha: r.sha, href: `/archive/${r.slug}` });
      }
      load();
    } catch (err) {
      setStatus({ kind: 'error', text: errorText(err) });
    }
  }

  async function remove() {
    if (!editing) return;
    const links = editing.linkedFrom.length ? `\n\nThese posts link to it, and those links will break: ${editing.linkedFrom.join(', ')}.` : '';
    if (!confirm(`Delete "${editing.meta.title}" (/archive/${editing.slug})? It stays in the Git history.${links}`)) return;
    try {
      setStatus({ kind: 'busy', text: 'Deleting…' });
      const r = await postJson<{ sha: string }>('post-delete', { slug: editing.slug });
      setStatus({ kind: 'ok', text: `Deleted "${editing.meta.title}":`, sha: r.sha });
      setEditing(null);
      load();
    } catch (err) {
      setStatus({ kind: 'error', text: errorText(err) });
    }
  }

  const q = query.trim().toLowerCase();
  const shown = (posts ?? []).filter(p => !q || [p.slug, p.meta.title ?? '', ...(p.meta.tags ?? [])].join(' ').toLowerCase().includes(q));

  return (
    <div className="grid lg:grid-cols-[2fr_3fr] gap-10 items-start">
      <div className={cn('space-y-3', formOpen && 'hidden lg:block')}>
        <div className="flex gap-2">
          <input className={input} placeholder="Search posts…" aria-label="Search posts" value={query} onChange={e => setQuery(e.target.value)} />
          <button type="button" className={cn(button, 'shrink-0 py-2')} onClick={startNew}>New post</button>
        </div>
        {listError ? <p className="font-mono text-xs text-red-400">{listError}</p> : !posts ? <p className="text-sm text-zinc-500">Loading…</p> : (
          <ul className="divide-y divide-zinc-900 border-y border-zinc-900 max-h-[70vh] overflow-y-auto">
            {shown.map(p => (
              <li key={p.slug}>
                <button type="button" onClick={() => startEdit(p)} aria-current={editing?.slug === p.slug}
                  className={cn('w-full text-left flex items-start gap-3 px-2 py-2.5 transition-colors', editing?.slug === p.slug ? 'bg-brand-orange/10' : 'hover:bg-zinc-900/60')}>
                  <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: p.meta.accentColor ?? '#ffaa00' }} aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm text-zinc-200 leading-snug">{p.meta.title ?? p.slug}</span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      #{p.meta.index} · {p.meta.date}{p.editableText ? ' · text editable' : ''}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={submit} className={cn('space-y-5', !formOpen && 'hidden lg:block')}>
        <button type="button" onClick={closeForm} className="lg:hidden inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-zinc-400 hover:text-white">
          ← All posts
        </button>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display font-bold text-xl text-white truncate">{editing ? `Edit: ${editing.meta.title}` : 'New post'}</h2>
          {fromIdea && !editing && <span className="font-mono text-[11px] text-brand-gold shrink-0">From the idea inbox</span>}
          {editing && <Link to={`/archive/${editing.slug}`} target="_blank" className="font-mono text-[11px] text-zinc-400 hover:text-white shrink-0 inline-flex items-center gap-1">View <ExternalLink className="w-3 h-3" aria-hidden /></Link>}
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <Field name="Title"><input className={input} value={title} onChange={e => setTitle(e.target.value)} required maxLength={200} /></Field>
          <Field name="URL" hint={editing ? 'The address can\'t change: links to it would break.' : `/archive/${finalSlug || '…'}`}>
            <input className={cn(input, editing && 'opacity-60')} value={finalSlug} disabled={Boolean(editing)}
              onChange={e => { setSlug(slugify(e.target.value)); setSlugEdited(true); }} required />
          </Field>
          <Field name="Date"><input type="date" className={input} value={date} onChange={e => setDate(e.target.value)} required /></Field>
          <Field name="Tags" hint="Comma separated, e.g. DSP, Granular"><input className={input} value={tags} onChange={e => setTags(e.target.value)} /></Field>
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <Field name="Accent color" hint={editing && 'accentColor' in editing.fixed ? 'Set in the post\'s code' : undefined}>
            <input type="color" value={accent} onChange={e => setAccent(e.target.value)} disabled={Boolean(editing && 'accentColor' in editing.fixed)}
              className="h-9 w-16 bg-transparent border border-zinc-800 cursor-pointer disabled:opacity-40" />
          </Field>
          {editing && (
            <>
              <Field name="Order" hint="Higher shows first">
                <input type="number" min={0} className={cn(input, 'w-24')} value={order} onChange={e => setOrder(Number(e.target.value) || 0)} />
              </Field>
              <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer pb-2">
                <input type="checkbox" checked={special} onChange={e => setSpecial(e.target.checked)} className="accent-brand-orange" /> Highlighted card
              </label>
            </>
          )}
        </div>
        <Field name="Summary" hint="One line for link previews and search results. Optional: the first paragraph is used otherwise.">
          <input className={input} value={description} onChange={e => setDescription(e.target.value)} maxLength={300} />
        </Field>
        {editing && loadingPost ? <p className="text-sm text-zinc-500">Loading the text…</p>
          : editing && source === null ? (
            <p className="text-sm text-zinc-400 border border-zinc-800 bg-zinc-900/40 px-4 py-3 leading-relaxed">
              This post is hand-written code (it has labs, components or custom layout), so its text can't be edited here
              without breaking it. Everything above can. To change the text, ask Claude to edit <code className="text-zinc-200">src/posts/{editing.slug}.tsx</code>.
            </p>
          ) : (
            <Field name="Text" hint={<>Blank line = new paragraph. <code>## Heading</code>, <code>- list item</code>, <code>[link](https://…)</code>, <code>**bold**</code>. Labs and images still need code: write the text here and ask Claude to add them.</>}>
              <textarea className={cn(input, 'min-h-80 font-mono text-[13px] leading-relaxed')} value={body} onChange={e => setBody(e.target.value)} required />
            </Field>
          )}
        <div className="flex flex-wrap gap-2">
          <button className={button} disabled={busy || !title || !finalSlug || (!editing && !body) || (editing !== null && loadingPost)}>
            {editing ? 'Save changes' : 'Publish post'}
          </button>
          {editing && (
            <>
              <button type="button" className={ghostButton} disabled={busy} onClick={closeForm}>Cancel</button>
              <span className="flex-grow" />
              <button type="button" disabled={busy} onClick={remove}
                className="px-4 py-2.5 border border-red-900/60 text-red-400 font-mono text-xs uppercase tracking-widest hover:bg-red-950/40 disabled:opacity-40 inline-flex items-center gap-2">
                <Trash2 className="w-4 h-4" aria-hidden /> Delete post
              </button>
            </>
          )}
        </div>
        {editing && editing.linkedFrom.length > 0 && (
          <p className="text-xs text-zinc-500">Linked from: {editing.linkedFrom.join(', ')}</p>
        )}
        <StatusLine status={status} />
      </form>
    </div>
  );
}

// ---------- Page ----------

/** Tabs in two groups. The address holds the open one (#projects/xen, #issues/data-bend, #sketches…). */
const GROUPS = [
  { name: 'Lab', tabs: [{ id: 'launchpad', label: 'Launchpad' }, { id: 'ship', label: 'Ship' }, { id: 'messages', label: 'Messages' }] },
  { name: 'All projects', tabs: [{ id: 'projects', label: 'Projects' }, { id: 'issues', label: 'Issues' }] },
  {
    name: 'Website',
    tabs: [{ id: 'overview', label: 'Overview' }, { id: 'sketches', label: 'Sketches' }, { id: 'samples', label: 'Samples' }, { id: 'archive', label: 'Archive' }],
  },
] as const;
type TabId = (typeof GROUPS)[number]['tabs'][number]['id'];
const TAB_IDS: string[] = GROUPS.flatMap(g => g.tabs.map(t => t.id));
/** Tabs that commit to the website repository. */
const SAVES = ['sketches', 'samples', 'archive'];

function readHash(): { tab: TabId; sub: string } {
  const [tab, ...rest] = decodeURIComponent(location.hash.slice(1)).split('/');
  return TAB_IDS.includes(tab) ? { tab: tab as TabId, sub: rest.join('/') } : { tab: 'launchpad', sub: '' };
}

function useHashRoute() {
  const [route, setRoute] = useState(readHash);
  useEffect(() => {
    const on = () => setRoute(readHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = (tab: TabId, sub = '') => {
    location.hash = sub ? `${tab}/${encodeURIComponent(sub)}` : tab;
    window.scrollTo({ top: 0 });
  };
  return { ...route, go };
}

function ActiveTab({ tab, sub, go }: { tab: TabId; sub: string; go: (tab: TabId, sub?: string) => void }) {
  switch (tab) {
    case 'launchpad': return <LaunchpadTab onPost={h => { sessionStorage.setItem(POST_HANDOFF, JSON.stringify(h)); go('archive'); }} onIssues={() => go('issues')} onShip={() => go('ship')} onMessages={() => go('messages')} />;
    case 'ship': return <ShipTab />;
    case 'messages': return <MessagesTab />;
    case 'projects': return <ProjectsTab open={sub} onOpen={name => go('projects', name)} onIssues={repo => go('issues', repo)} />;
    case 'issues': return <IssuesTab repo={sub || '*'} onRepo={repo => go('issues', repo === '*' ? '' : repo)} />;
    case 'overview': return <OverviewTab onIssues={() => go('issues', REPO_URL.split('/').pop())} />;
    case 'sketches': return <SketchesTab />;
    case 'samples': return <SamplesTab />;
    case 'archive': return <ArchiveTab />;
  }
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      setStatus({ kind: 'busy', text: 'Checking…' });
      await postJson('login', { password });
      onDone();
    } catch (err) {
      setStatus({ kind: 'error', text: errorText(err) });
    }
  }
  return (
    <form onSubmit={submit} className="max-w-sm space-y-5">
      <Field name="Password">
        <input type="password" autoComplete="current-password" className={input} value={password} onChange={e => setPassword(e.target.value)} required autoFocus />
      </Field>
      <button className={button} disabled={status.kind === 'busy'}>Log in</button>
      <StatusLine status={status} />
    </form>
  );
}

export function DevPage() {
  usePageTitle('Dev');
  const [session, setSession] = useState<{ loggedIn: boolean; configured: boolean } | null>(null);
  const [error, setError] = useState('');
  const { tab, sub, go } = useHashRoute();

  const check = () =>
    api<{ loggedIn: boolean; configured: boolean }>('session')
      .then(setSession)
      .catch(e => setError(errorText(e)));
  useEffect(() => { check(); }, []);

  // N on any tab (outside a text field) jumps to the capture box.
  useEffect(() => {
    if (!session?.loggedIn) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key.toLowerCase() !== 'n' || e.metaKey || e.ctrlKey || e.altKey || el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      e.preventDefault();
      if (tab !== 'launchpad') go('launchpad');
      setTimeout(() => document.getElementById('capture-box')?.focus(), 50);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session?.loggedIn, tab]);

  async function logout() {
    await postJson('logout', {}).catch(() => {});
    setSession(s => s && { ...s, loggedIn: false });
  }

  return (
    <Layout>
      <div className="pt-24 pb-24 max-w-6xl mx-auto px-6 w-full">
        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4">// Owner only</p>
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-widest text-white uppercase">Dev</h1>
          </div>
          {session?.loggedIn && (
            <button type="button" onClick={logout} className="mt-2 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-zinc-400 hover:text-white">
              <LogOut className="w-4 h-4" aria-hidden /> Log out
            </button>
          )}
        </div>

        {error ? (
          <p className="font-mono text-sm text-red-400">{error}</p>
        ) : !session ? (
          <p className="font-mono text-sm text-zinc-500">Loading…</p>
        ) : !session.loggedIn ? (
          <LoginForm onDone={check} />
        ) : (
          <>
            {!session.configured && (
              <p className="mb-8 font-mono text-xs text-amber-400">The GitHub token isn't set up yet, so saving won't work. See docs/HOSTING.md.</p>
            )}
            <nav aria-label="Dashboard sections" className="flex flex-wrap gap-x-10 gap-y-4 border-b border-zinc-900 mb-10">
              {GROUPS.map(g => (
                <div key={g.name}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600 mb-2">{g.name}</p>
                  <div role="tablist" aria-label={g.name} className="flex gap-6 font-mono text-xs uppercase tracking-widest">
                    {g.tabs.map(t => (
                      <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => go(t.id)}
                        className={cn('pb-3 -mb-px border-b-2 transition-colors', tab === t.id ? 'border-brand-orange text-brand-orange' : 'border-transparent text-zinc-400 hover:text-white')}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <ActiveTab tab={tab} sub={sub} go={go} />
            {SAVES.includes(tab) && (
              <p className="mt-16 font-mono text-[11px] text-zinc-600 flex items-center gap-1.5">
                Every save is a commit to the website's main branch and goes live in about 2 minutes.{' '}
                <a href={`${REPO_URL}/commits/main`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-zinc-300">
                  History <ExternalLink className="w-3 h-3" aria-hidden />
                </a>
              </p>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
