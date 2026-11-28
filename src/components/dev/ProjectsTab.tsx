import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Archive, ExternalLink, Globe, Lock, RefreshCw, Search, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/devApi';
import { input } from './ui';
import { ago, card, errorOf, heading, Problem, RepoPanels, Stat, type Stats } from './RepoPanels';
import { KINDS, kindOf, LANGUAGE_COLORS, useProjects, type Project } from './useProjects';

/**
 * /dev Projects: every repository you own, grouped by kind, newest push first. Click one for its GitHub activity.
 * The open project is in the address (#projects/<name>), so the browser's back button works.
 */

const WEEK = 7 * 86_400_000;

function LanguageDot({ language }: { language: string | null }) {
  if (!language) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: LANGUAGE_COLORS[language] ?? '#71717a' }} aria-hidden />
      {language}
    </span>
  );
}

function ProjectCard({ p, onOpen }: { p: Project; onOpen: () => void; key?: string }) {
  const fresh = Date.now() - new Date(p.pushedAt).getTime() < WEEK;
  return (
    <button type="button" onClick={onOpen}
      className={cn(card, 'text-left flex flex-col gap-2 hover:border-brand-orange/60 hover:bg-zinc-900/70 transition-colors group')}>
      <span className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-sm text-white truncate group-hover:text-brand-orange transition-colors">{p.name}</span>
        {p.private && <Lock className="w-3 h-3 text-zinc-500 shrink-0" aria-label="private" />}
        {p.archived && <Archive className="w-3 h-3 text-zinc-500 shrink-0" aria-label="archived" />}
        {fresh && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" aria-label="pushed this week" title="Pushed this week" />}
      </span>
      <span className="text-xs text-zinc-400 leading-relaxed line-clamp-2 min-h-[2.5em]">{p.description || 'No description.'}</span>
      <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-zinc-500">
        <LanguageDot language={p.language} />
        <span>{ago(p.pushedAt)}</span>
        {p.openIssues > 0 && <span className="text-zinc-300">{p.openIssues} open</span>}
        {p.stars > 0 && <span className="inline-flex items-center gap-0.5"><Star className="w-3 h-3" aria-hidden />{p.stars}</span>}
      </span>
    </button>
  );
}

function ProjectDetail({ p, site, onBack, onIssues }: { p: Project; site: string; onBack: () => void; onIssues: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setStats(null); setError('');
    api<Stats>(`github?repo=${encodeURIComponent(p.name)}`).then(setStats).catch(e => setError(e instanceof Error ? e.message : String(e)));
  }, [p.name]);

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-zinc-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" aria-hidden /> All projects
      </button>
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display font-bold text-2xl text-white">{p.name}</h2>
          <span className="font-mono text-[10px] uppercase tracking-widest border border-zinc-700 text-zinc-400 px-1.5 py-0.5">{p.private ? 'private' : 'public'}</span>
          {p.archived && <span className="font-mono text-[10px] uppercase tracking-widest border border-zinc-700 text-zinc-400 px-1.5 py-0.5">archived</span>}
          <span className="ml-auto flex gap-4 font-mono text-[11px] text-zinc-400">
            {p.homepage && <a href={p.homepage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white"><Globe className="w-3 h-3" aria-hidden /> Site</a>}
            <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white">GitHub <ExternalLink className="w-3 h-3" aria-hidden /></a>
          </span>
        </div>
        {p.description && <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">{p.description}</p>}
        <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-zinc-500">
          <LanguageDot language={p.language} />
          {p.topics.map(t => <span key={t}>#{t}</span>)}
        </p>
        {p.name === site && <p className="text-xs text-zinc-500">This is the website. Its traffic and content are in Website → Overview.</p>}
      </header>
      {error ? <Problem text={error} /> : <RepoPanels stats={stats} repoUrl={p.url} onIssues={onIssues} />}
    </div>
  );
}

export function ProjectsTab({ open, onOpen, onIssues }: { open: string; onOpen: (name: string) => void; onIssues: (repo: string) => void }) {
  const [reload, setReload] = useState(0);
  const { data, error } = useProjects(reload);
  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all');
  const [showArchived, setShowArchived] = useState(false);

  const items = data?.ok ? data.items : [];
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(p =>
      (showArchived || (!p.archived && !p.fork)) &&
      (visibility === 'all' || (visibility === 'private') === p.private) &&
      (!q || [p.name, p.description, p.language ?? '', ...p.topics].join(' ').toLowerCase().includes(q)));
  }, [items, query, visibility, showArchived]);

  if (error) return <Problem text={error} />;
  if (!data) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (!data.ok) return <Problem text={errorOf(data)} />;

  const selected = open ? items.find(p => p.name === open) : undefined;
  if (open && selected) return <ProjectDetail p={selected} site={data.site} onBack={() => onOpen('')} onIssues={() => onIssues(selected.name)} />;

  const active = items.filter(p => !p.archived && Date.now() - new Date(p.pushedAt).getTime() < WEEK).length;
  const openCount = items.reduce((n, p) => n + p.openIssues, 0);
  const languages = new Set(items.map(p => p.language).filter(Boolean)).size;
  const groups = [...KINDS, { id: 'other', name: 'Other' }]
    .map(k => ({ ...k, list: shown.filter(p => kindOf(p) === k.id) }))
    .filter(g => g.list.length);

  return (
    <div className="space-y-8">
      {data.limited && (
        <p className="text-xs text-amber-400 leading-relaxed">
          Showing public repositories only. To see private ones too, add a <code className="text-zinc-200">GITHUB_PROJECTS_TOKEN</code> with
          access to all your repositories (docs/HOSTING.md).
        </p>
      )}
      {open && !selected && <Problem text={`No project called "${open}".`} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Projects" value={items.filter(p => !p.archived).length} detail={`${items.filter(p => p.private).length} private · ${items.filter(p => !p.private).length} public`} />
        <Stat label="Pushed this week" value={active} detail={active ? 'Green dot on the card' : 'Quiet week'} />
        <Stat label="Open issues & PRs" value={openCount} detail="Across all projects" />
        <Stat label="Languages" value={languages} detail={[...new Set(items.map(p => p.language).filter(Boolean))].slice(0, 4).join(', ')} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex-grow min-w-[12rem] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" aria-hidden />
          <input className={cn(input, 'pl-9')} placeholder="Search name, description, topic…" aria-label="Search projects" value={query} onChange={e => setQuery(e.target.value)} />
        </label>
        <div role="group" aria-label="Visibility" className="flex gap-1 font-mono text-[11px] uppercase tracking-widest">
          {(['all', 'public', 'private'] as const).map(v => (
            <button key={v} type="button" aria-pressed={visibility === v} onClick={() => setVisibility(v)}
              className={cn('px-3 py-1.5 border transition-colors', visibility === v ? 'border-brand-orange text-brand-orange bg-brand-orange/10' : 'border-zinc-800 text-zinc-400 hover:text-white')}>
              {v}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-zinc-400 cursor-pointer">
          <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="accent-brand-orange" />
          Archived & forks
        </label>
        <button type="button" onClick={() => setReload(n => n + 1)} aria-label="Reload projects" className="ml-auto p-1.5 text-zinc-500 hover:text-white">
          <RefreshCw className="w-4 h-4" aria-hidden />
        </button>
      </div>

      {!groups.length && <p className="text-sm text-zinc-500">No projects match.</p>}
      {groups.map(g => (
        <section key={g.id}>
          <h2 className={heading}>{g.name} · {g.list.length}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {g.list.map(p => <ProjectCard key={p.name} p={p} onOpen={() => onOpen(p.name)} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
