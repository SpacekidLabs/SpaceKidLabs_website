import { useEffect, useState } from 'react';
import { api } from '../../lib/devApi';

/** Your GitHub repositories (worker/stats.ts `projects`), loaded once and shared by the Projects and Issues tabs. */

export interface Project {
  name: string; description: string; private: boolean; archived: boolean; fork: boolean; language: string | null;
  pushedAt: string; openIssues: number; stars: number; url: string; homepage: string | null; topics: string[];
}
export type ProjectsResult =
  | { ok: true; limited: boolean; items: Project[]; owner: string; site: string; projectsToken: boolean }
  | { ok: false; error: string };

let cache: Promise<ProjectsResult> | null = null;

export function useProjects(reload = 0) {
  const [data, setData] = useState<ProjectsResult | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (reload || !cache) cache = api<ProjectsResult>('projects');
    let live = true;
    cache.then(r => live && setData(r)).catch(e => { cache = null; if (live) setError(e instanceof Error ? e.message : String(e)); });
    return () => { live = false; };
  }, [reload]);
  return { data, error };
}

/** A rough kind from the repository's topics, for grouping. */
export const KINDS = [
  { id: 'plugin', name: 'Plugins & instruments', topics: ['vst3', 'clap', 'audio-plugin', 'audio-unit', 'ableton-live'] },
  { id: 'app', name: 'Apps & tools', topics: ['macos', 'electron', 'tauri', 'daw', 'cli'] },
  { id: 'research', name: 'Research', topics: ['research'] },
  { id: 'website', name: 'Websites', topics: ['website', 'static-site'] },
] as const;

export function kindOf(p: Project): string {
  const kind = KINDS.find(k => k.topics.some(t => p.topics.includes(t)))?.id;
  if (kind) return kind;
  // A synth that isn't a plugin and isn't tagged as an app (e.g. a standalone instrument).
  return p.topics.some(t => t === 'synthesizer' || t === 'sampler') ? 'plugin' : 'other';
}

/** GitHub's language colours for the ones you use; anything else is grey. */
export const LANGUAGE_COLORS: Record<string, string> = {
  Rust: '#dea584', TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', 'C++': '#f34b7d', HTML: '#e34c26', C: '#555555', Swift: '#F05138',
};
