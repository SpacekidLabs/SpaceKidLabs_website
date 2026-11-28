import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Lightbulb, LogOut, Mic, Trash2 } from 'lucide-react';
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
import { button, errorText, Field, input, label } from '../components/dev/ui';

/**
 * /dev: the owner's dashboard, from any browser: all GitHub projects and their issues, plus the website's traffic
 * and adding sketches, samples and archive posts.
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

  const load = () => api<{ sketches: Sketch[] }>('content').then(r => setList(r.sketches)).catch(e => setStatus({ kind: 'error', text: errorText(e) }));
  useEffect(() => { load(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const form = new FormData();
      form.set('meta', JSON.stringify({ kind, title, date, text, tags: tags.split(',') }));
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
      const r = await api<{ sha: string; id: string }>('sketch', { method: 'POST', body: form });
      setStatus({ kind: 'ok', text: `Saved "${title}":`, sha: r.sha, href: `/sketches#${r.id}` });
      setTitle(''); setText(''); setTags(''); setFile(null); setFileKey(k => k + 1);
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
      setStatus({ kind: 'ok', text: `Deleted "${s.title}":`, sha: r.sha });
      load();
    } catch (err) {
      setStatus({ kind: 'error', text: errorText(err) });
    }
  }

  return (
    <div className="grid md:grid-cols-[1fr_1fr] gap-10">
      <form onSubmit={submit} className="space-y-5">
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
          <Field name="Audio" hint="WAV, MP3, AIFF or FLAC. Anything that isn't MP3 is converted in your browser. Leave empty for a placeholder.">
            <input key={fileKey} type="file" accept="audio/*,.wav,.mp3,.aif,.aiff,.flac" onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:px-4 file:py-2 file:border-0 file:bg-zinc-800 file:text-zinc-200 file:font-mono file:text-xs file:uppercase" />
          </Field>
        )}
        <Field name={kind === 'demo' ? 'Note' : 'The idea'} hint="Blank line = new paragraph.">
          <textarea className={cn(input, 'min-h-32')} value={text} onChange={e => setText(e.target.value)} />
        </Field>
        <Field name="Tags" hint="Comma separated, e.g. 120 BPM, F minor, WIP"><input className={input} value={tags} onChange={e => setTags(e.target.value)} /></Field>
        <button className={button} disabled={status.kind === 'busy' || !title}>Save {kind}</button>
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
    <form onSubmit={submit} className="space-y-5 max-w-xl">
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
  );
}

// ---------- Archive ----------

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

function ArchiveTab() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [date, setDate] = useState(today);
  const [tags, setTags] = useState('');
  const [accent, setAccent] = useState('#ffaa00');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const nextIndex = Math.max(0, ...POSTS.map(p => p.meta.index)) + 1;
  const finalSlug = slugEdited ? slug : slugify(title);

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      setStatus({ kind: 'busy', text: 'Saving to GitHub…' });
      const r = await postJson<{ sha: string; slug: string }>('post', {
        title, slug: finalSlug, date, tags: tags.split(','), index: nextIndex, accentColor: accent, description, body,
      });
      setStatus({ kind: 'ok', text: `Published "${title}":`, sha: r.sha, href: `/archive/${r.slug}` });
      setTitle(''); setSlug(''); setSlugEdited(false); setTags(''); setDescription(''); setBody('');
    } catch (err) {
      setStatus({ kind: 'error', text: errorText(err) });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 max-w-3xl">
      <div className="grid md:grid-cols-2 gap-5">
        <Field name="Title"><input className={input} value={title} onChange={e => setTitle(e.target.value)} required maxLength={200} /></Field>
        <Field name="URL" hint={`/archive/${finalSlug || '…'}`}>
          <input className={input} value={finalSlug} onChange={e => { setSlug(slugify(e.target.value)); setSlugEdited(true); }} required />
        </Field>
        <Field name="Date"><input type="date" className={input} value={date} onChange={e => setDate(e.target.value)} required /></Field>
        <Field name="Tags" hint="Comma separated, e.g. DSP, Granular"><input className={input} value={tags} onChange={e => setTags(e.target.value)} /></Field>
      </div>
      <Field name="Accent color"><input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="h-9 w-16 bg-transparent border border-zinc-800 cursor-pointer" /></Field>
      <Field name="Summary" hint="One line for link previews and search results. Optional: the first paragraph is used otherwise.">
        <input className={input} value={description} onChange={e => setDescription(e.target.value)} maxLength={300} />
      </Field>
      <Field name="Text" hint={<>Blank line = new paragraph. <code>## Heading</code>, <code>- list item</code>, <code>[link](https://…)</code>, <code>**bold**</code>. Labs and images still need code: write the text here and ask Claude to add them.</>}>
        <textarea className={cn(input, 'min-h-80 font-mono text-[13px] leading-relaxed')} value={body} onChange={e => setBody(e.target.value)} required />
      </Field>
      <button className={button} disabled={status.kind === 'busy' || !title || !body || !finalSlug}>Publish post</button>
      <StatusLine status={status} />
    </form>
  );
}

// ---------- Page ----------

/** Tabs in two groups. The address holds the open one (#projects/xen, #issues/data-bend, #sketches…). */
const GROUPS = [
  { name: 'All projects', tabs: [{ id: 'projects', label: 'Projects' }, { id: 'issues', label: 'Issues' }] },
  {
    name: 'Website',
    tabs: [{ id: 'overview', label: 'Overview' }, { id: 'sketches', label: 'Sketches' }, { id: 'samples', label: 'Samples' }, { id: 'archive', label: 'Archive post' }],
  },
] as const;
type TabId = (typeof GROUPS)[number]['tabs'][number]['id'];
const TAB_IDS: string[] = GROUPS.flatMap(g => g.tabs.map(t => t.id));
/** Tabs that commit to the website repository. */
const SAVES = ['sketches', 'samples', 'archive'];

function readHash(): { tab: TabId; sub: string } {
  const [tab, ...rest] = decodeURIComponent(location.hash.slice(1)).split('/');
  return TAB_IDS.includes(tab) ? { tab: tab as TabId, sub: rest.join('/') } : { tab: 'projects', sub: '' };
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
