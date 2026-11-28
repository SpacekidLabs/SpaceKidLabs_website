import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, CircleDot, CircleSlash, ExternalLink, MessageSquare, Plus, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api, postJson } from '../../lib/devApi';
import { button, errorText, Field, ghostButton, input, label } from './ui';
import { ago } from './RepoPanels';
import { useProjects, type Project } from './useProjects';

/**
 * /dev Issues: list, open, write, edit, label, close/reopen and comment on GitHub issues of any of your projects,
 * one project at a time or all together. Goes through worker/issues.ts; the token needs "Issues: Read and write".
 */

/** A repository name, or ALL for every project at once. */
const ALL = '*';
type StateFilter = 'open' | 'closed' | 'all';
interface Label { name: string; color: string }
interface Issue {
  repo: string; number: number; title: string; body: string; state: 'open' | 'closed'; stateReason: string | null; url: string;
  created: string; updated: string; closed: string | null; comments: number; author: string; labels: Label[];
}
interface Comment { id: number; body: string; url: string; created: string; author: string }

const keyOf = (i: Pick<Issue, 'repo' | 'number'>) => `${i.repo}#${i.number}`;

function StateIcon({ issue, className }: { issue: Pick<Issue, 'state' | 'stateReason'>; className?: string }) {
  if (issue.state === 'open') return <CircleDot className={cn('text-emerald-400', className)} aria-label="open" />;
  if (issue.stateReason === 'not_planned') return <CircleSlash className={cn('text-zinc-500', className)} aria-label="closed as not planned" />;
  return <CheckCircle2 className={cn('text-violet-400', className)} aria-label="closed as completed" />;
}

function Toggle<T extends string>({ value, options, onChange, name }: { value: T; options: Array<{ key: T; name: string }>; onChange: (v: T) => void; name: string }) {
  return (
    <div role="group" aria-label={name} className="flex gap-1 font-mono text-[11px] uppercase tracking-widest">
      {options.map(o => (
        <button key={o.key} type="button" aria-pressed={value === o.key} onClick={() => onChange(o.key)}
          className={cn('px-3 py-1.5 border transition-colors', value === o.key ? 'border-brand-orange text-brand-orange bg-brand-orange/10' : 'border-zinc-800 text-zinc-400 hover:text-white')}>
          {o.name}
        </button>
      ))}
    </div>
  );
}

function LabelChip({ l }: { l: Label; key?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-zinc-800 font-mono text-[10px] text-zinc-300">
      <span className="w-2 h-2 rounded-full" style={{ background: `#${l.color}` }} aria-hidden />
      {l.name}
    </span>
  );
}

/** Pick labels from the repository's own, or type a new one (GitHub creates it on save). */
function LabelPicker({ all, value, onChange }: { all: Label[]; value: string[]; onChange: (v: string[]) => void }) {
  const [extra, setExtra] = useState('');
  const known = new Set(all.map(l => l.name));
  const options = [...all, ...value.filter(v => !known.has(v)).map(name => ({ name, color: '888888' }))];
  const toggle = (name: string) => onChange(value.includes(name) ? value.filter(v => v !== name) : [...value, name]);
  return (
    <div>
      <span className={label}>Labels</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(l => {
          const on = value.includes(l.name);
          return (
            <button key={l.name} type="button" aria-pressed={on} onClick={() => toggle(l.name)}
              className={cn('inline-flex items-center gap-1.5 px-2 py-1 border font-mono text-[11px] transition-colors',
                on ? 'border-brand-orange text-white bg-brand-orange/10' : 'border-zinc-800 text-zinc-500 hover:text-zinc-200')}>
              <span className="w-2 h-2 rounded-full" style={{ background: `#${l.color}` }} aria-hidden />
              {l.name}
            </button>
          );
        })}
        <input
          className="bg-transparent border border-dashed border-zinc-800 focus:border-brand-orange px-2 py-1 font-mono text-[11px] text-zinc-200 outline-none w-28"
          placeholder="+ new label" value={extra} maxLength={50} aria-label="New label"
          onChange={e => setExtra(e.target.value)}
          onKeyDown={e => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            const name = extra.trim();
            if (name && !value.includes(name)) onChange([...value, name]);
            setExtra('');
          }}
        />
      </div>
    </div>
  );
}

type Msg = { kind: 'busy' | 'ok' | 'error'; text: string } | null;
const MsgLine = ({ msg }: { msg: Msg }) =>
  msg && (
    <p role="status" className={cn('font-mono text-xs', msg.kind === 'error' ? 'text-red-400' : msg.kind === 'ok' ? 'text-emerald-400' : 'text-zinc-400')}>
      {msg.text}
    </p>
  );

// ---------- Editor ----------

function NewIssue({ repo, labels, projects, onCreated }: { repo: string; labels: Label[]; projects: Project[]; onCreated: (i: Issue) => void; key?: string }) {
  const [target, setTarget] = useState(repo === ALL ? '' : repo);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [msg, setMsg] = useState<Msg>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      setMsg({ kind: 'busy', text: 'Creating…' });
      const r = await postJson<{ issue: Issue }>('issue-save', { repo: target, title, body, labels: picked });
      onCreated(r.issue);
    } catch (err) {
      setMsg({ kind: 'error', text: errorText(err) });
    }
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <h2 className="font-display font-bold text-xl text-white">New issue{repo !== ALL && <> in <span className="font-mono">{repo}</span></>}</h2>
      {repo === ALL && (
        <Field name="Project">
          <select className={input} value={target} onChange={e => setTarget(e.target.value)} required>
            <option value="" disabled>Pick a project…</option>
            {projects.filter(p => !p.archived).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </Field>
      )}
      <Field name="Title"><input className={input} value={title} onChange={e => setTitle(e.target.value)} required maxLength={256} autoFocus /></Field>
      <Field name="Text" hint="Markdown, as on GitHub.">
        <textarea className={cn(input, 'min-h-48 font-mono text-[13px] leading-relaxed')} value={body} onChange={e => setBody(e.target.value)} />
      </Field>
      <LabelPicker all={repo === ALL ? [] : labels} value={picked} onChange={setPicked} />
      <button className={button} disabled={msg?.kind === 'busy' || !title.trim() || !target}>Create issue</button>
      <MsgLine msg={msg} />
    </form>
  );
}

function EditIssue({ repo, number, onChanged }: { repo: string; number: number; onChanged: (i: Issue) => void; key?: string }) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [reply, setReply] = useState('');
  const [msg, setMsg] = useState<Msg>(null);
  const busy = msg?.kind === 'busy';

  const reset = (i: Issue) => { setIssue(i); setTitle(i.title); setBody(i.body); setPicked(i.labels.map(l => l.name)); };

  useEffect(() => {
    setIssue(null); setMsg(null); setReply('');
    api<{ issue: Issue; comments: Comment[]; labels: Label[] }>(`issue?repo=${encodeURIComponent(repo)}&number=${number}`)
      .then(r => { reset(r.issue); setComments(r.comments); setLabels(r.labels); })
      .catch(e => setMsg({ kind: 'error', text: errorText(e) }));
  }, [repo, number]);

  if (!issue) return msg ? <MsgLine msg={msg} /> : <p className="text-sm text-zinc-500">Loading…</p>;

  const labelsChanged = [...picked].sort().join('\n') !== issue.labels.map(l => l.name).sort().join('\n');
  const changed = title.trim() !== issue.title || body.trim() !== issue.body.trim() || labelsChanged;

  async function save(extra: Record<string, unknown>, done: string) {
    try {
      setMsg({ kind: 'busy', text: 'Saving…' });
      const r = await postJson<{ issue: Issue }>('issue-save', { repo, number, ...extra });
      reset(r.issue);
      onChanged(r.issue);
      setMsg({ kind: 'ok', text: done });
    } catch (err) {
      setMsg({ kind: 'error', text: errorText(err) });
    }
  }

  async function comment(close?: 'completed' | 'not_planned') {
    try {
      setMsg({ kind: 'busy', text: 'Commenting…' });
      const r = await postJson<{ comment: Comment }>('issue-comment', { repo, number, body: reply });
      setComments(c => [...c, r.comment]);
      setReply('');
      if (close) await save({ state: 'closed', reason: close }, 'Commented and closed.');
      else {
        onChanged({ ...issue!, comments: issue!.comments + 1, updated: r.comment.created });
        setMsg({ kind: 'ok', text: 'Comment added.' });
      }
    } catch (err) {
      setMsg({ kind: 'error', text: errorText(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <StateIcon issue={issue} className="w-5 h-5 shrink-0 mt-1" />
        <div className="min-w-0 flex-grow">
          <p className="font-mono text-[11px] text-zinc-500 uppercase tracking-widest">
            <span className="text-zinc-300 normal-case">{issue.repo}</span> #{issue.number} · {issue.state === 'open' ? 'open' : issue.stateReason === 'not_planned' ? 'closed, not planned' : 'closed, done'} · by {issue.author} · {ago(issue.created)}
          </p>
        </div>
        <a href={issue.url} target="_blank" rel="noreferrer" className="shrink-0 inline-flex items-center gap-1 font-mono text-[11px] text-zinc-400 hover:text-white">
          GitHub <ExternalLink className="w-3 h-3" aria-hidden />
        </a>
      </div>

      <form onSubmit={e => { e.preventDefault(); save({ title, body, labels: picked }, 'Saved.'); }} className="space-y-5">
        <Field name="Title"><input className={input} value={title} onChange={e => setTitle(e.target.value)} required maxLength={256} /></Field>
        <Field name="Text" hint="Markdown, as on GitHub.">
          <textarea className={cn(input, 'min-h-40 font-mono text-[13px] leading-relaxed')} value={body} onChange={e => setBody(e.target.value)} />
        </Field>
        <LabelPicker all={labels} value={picked} onChange={setPicked} />
        <div className="flex flex-wrap gap-2">
          <button className={button} disabled={busy || !changed || !title.trim()}>Save changes</button>
          {changed && <button type="button" className={ghostButton} disabled={busy} onClick={() => reset(issue)}>Undo edits</button>}
          <span className="flex-grow" />
          {issue.state === 'open' ? (
            <>
              <button type="button" className={ghostButton} disabled={busy} onClick={() => save({ state: 'closed', reason: 'completed' }, 'Closed as done.')}>Close as done</button>
              <button type="button" className={ghostButton} disabled={busy} onClick={() => save({ state: 'closed', reason: 'not_planned' }, 'Closed as not planned.')}>Not planned</button>
            </>
          ) : (
            <button type="button" className={ghostButton} disabled={busy} onClick={() => save({ state: 'open' }, 'Reopened.')}>Reopen</button>
          )}
        </div>
        <MsgLine msg={msg} />
      </form>

      <section className="border-t border-zinc-900 pt-6 space-y-4">
        <h3 className={label}>Comments ({comments.length})</h3>
        {comments.map(c => (
          <article key={c.id} className="border border-zinc-800 bg-zinc-900/40">
            <header className="flex justify-between gap-3 px-4 py-2 border-b border-zinc-800 font-mono text-[11px] text-zinc-500">
              <span><span className="text-zinc-300">{c.author}</span> · {ago(c.created)}</span>
              <a href={c.url} target="_blank" rel="noreferrer" className="hover:text-white" aria-label="Open comment on GitHub"><ExternalLink className="w-3 h-3" aria-hidden /></a>
            </header>
            <p className="px-4 py-3 text-sm text-zinc-300 whitespace-pre-wrap break-words">{c.body}</p>
          </article>
        ))}
        <textarea className={cn(input, 'min-h-24')} placeholder="Write a comment…" aria-label="New comment" value={reply} onChange={e => setReply(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className={button} disabled={busy || !reply.trim()} onClick={() => comment()}>Comment</button>
          {issue.state === 'open' && (
            <button type="button" className={ghostButton} disabled={busy || !reply.trim()} onClick={() => comment('completed')}>Comment and close</button>
          )}
        </div>
      </section>
    </div>
  );
}

// ---------- Tab ----------

export function IssuesTab({ repo, onRepo }: { repo: string; onRepo: (repo: string) => void }) {
  const { data: projectData } = useProjects();
  const projects = projectData?.ok ? projectData.items : [];
  const [state, setState] = useState<StateFilter>('open');
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<{ repo: string; number: number } | 'new' | null>(null);
  const [reload, setReload] = useState(0);
  const all = repo === ALL;

  useEffect(() => {
    setIssues(null); setError('');
    api<{ issues: Issue[]; labels: Label[] }>(`issues?repo=${encodeURIComponent(repo)}&state=${state}`)
      .then(r => { setIssues(r.issues); setLabels(r.labels); })
      .catch(e => setError(errorText(e)));
  }, [repo, state, reload]);

  useEffect(() => { setSelected(null); }, [repo]);

  /** Keeps the list in step with an edit without refetching it. */
  function upsert(i: Issue) {
    setIssues(list => {
      if (!list) return list;
      const fits = (state === 'all' || i.state === state) && (all || i.repo === repo);
      const rest = list.filter(x => keyOf(x) !== keyOf(i));
      return fits ? [i, ...rest].sort((a, b) => b.updated.localeCompare(a.updated)) : rest;
    });
    setLabels(known => [...known, ...i.labels.filter(l => !known.some(a => a.name === l.name))]);
  }

  // Projects with open issues first, so the picker leads with the busy ones.
  const options = [...projects].filter(p => !p.archived).sort((a, b) => b.openIssues - a.openIssues || a.name.localeCompare(b.name));
  const selectedKey = selected && selected !== 'new' ? keyOf(selected) : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select className={cn(input, 'w-auto min-w-[14rem] font-mono text-xs')} value={repo} onChange={e => onRepo(e.target.value)} aria-label="Project">
          <option value={ALL}>All projects</option>
          {options.map(p => <option key={p.name} value={p.name}>{p.name}{p.openIssues ? ` (${p.openIssues})` : ''}</option>)}
          {!all && !options.some(p => p.name === repo) && <option value={repo}>{repo}</option>}
        </select>
        <Toggle name="State" value={state} onChange={setState}
          options={[{ key: 'open', name: 'Open' }, { key: 'closed', name: 'Closed' }, { key: 'all', name: 'All' }]} />
        <button type="button" onClick={() => setReload(n => n + 1)} aria-label="Reload issues" className="p-1.5 text-zinc-500 hover:text-white">
          <RefreshCw className="w-4 h-4" aria-hidden />
        </button>
        <span className="flex-grow" />
        <button type="button" className={cn(button, 'inline-flex items-center gap-2 py-2')} onClick={() => setSelected('new')}>
          <Plus className="w-4 h-4" aria-hidden /> New issue
        </button>
      </div>

      <div className="grid md:grid-cols-[2fr_3fr] gap-8 items-start">
        <div>
          {error ? <p className="font-mono text-xs text-red-400 leading-relaxed">{error}</p>
            : !issues ? <p className="text-sm text-zinc-500">Loading…</p>
            : !issues.length ? <p className="text-sm text-zinc-500">No {state === 'all' ? '' : `${state} `}issues{all ? ' in any project' : ''}.</p>
            : (
              <ul className="divide-y divide-zinc-900 border-y border-zinc-900">
                {issues.map(i => (
                  <li key={keyOf(i)}>
                    <button type="button" onClick={() => setSelected({ repo: i.repo, number: i.number })} aria-current={selectedKey === keyOf(i)}
                      className={cn('w-full text-left flex gap-2.5 px-2 py-3 transition-colors', selectedKey === keyOf(i) ? 'bg-brand-orange/10' : 'hover:bg-zinc-900/60')}>
                      <StateIcon issue={i} className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="min-w-0 flex-grow">
                        {all && <span className="block font-mono text-[10px] text-brand-orange/80 mb-0.5">{i.repo}</span>}
                        <span className="block text-sm text-zinc-200 leading-snug">{i.title}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] text-zinc-500">
                          #{i.number} · {ago(i.updated)}
                          {i.comments > 0 && <span className="inline-flex items-center gap-0.5"><MessageSquare className="w-3 h-3" aria-hidden />{i.comments}</span>}
                          {i.labels.map(l => <LabelChip key={l.name} l={l} />)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </div>

        <div className="md:sticky md:top-24">
          {selected === 'new' ? (
            <NewIssue key={repo} repo={repo} labels={labels} projects={projects} onCreated={i => { upsert(i); setSelected({ repo: i.repo, number: i.number }); }} />
          ) : selected !== null ? (
            <EditIssue key={selectedKey} repo={selected.repo} number={selected.number} onChanged={upsert} />
          ) : (
            <p className="text-sm text-zinc-500">Pick an issue to read, edit, comment on or close, or start a new one.</p>
          )}
        </div>
      </div>
    </div>
  );
}
