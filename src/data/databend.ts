/**
 * DATABEND download info for /download.
 *
 * databend-release.json is refreshed from the latest GitHub release of SpacekidLabs/data-bend at the start of
 * every build (scripts/fetch-databend-release.ts). Until that repo has a release, it holds the old Google
 * Drive link.
 */
import RELEASE_JSON from './databend-release.json';

export type ReleaseAsset = {
  name: string;
  url: string;
  /** Bytes; null when unknown (the Google Drive fallback). */
  size: number | null;
  arch: 'arm64' | 'x64' | 'universal' | 'unknown';
  /** From GitHub's asset digest, when it has one. */
  sha256?: string;
};

export type DatabendRelease = {
  source: 'github' | 'fallback';
  version: string;
  /** YYYY-MM-DD */
  date: string | null;
  /** The GitHub release page */
  pageUrl: string | null;
  /** Release notes (Markdown from the GitHub release) */
  notes: string;
  assets: ReleaseAsset[];
};

export const DATABEND_RELEASE = RELEASE_JSON as DatabendRelease;

export const DATABEND_REPO_URL = 'https://github.com/SpacekidLabs/data-bend';
export const DATABEND_RELEASES_URL = `${DATABEND_REPO_URL}/releases`;
export const DATABEND_WEB_URL = 'https://databenddaw.netlify.app/';

/**
 * The app is built on Electron 25, which runs on macOS 10.13 High Sierra and later.
 * Update this if the app moves to a newer Electron (27+ needs macOS 10.15).
 */
export const MIN_MACOS = 'macOS 10.13 High Sierra or later';

export const ARCH_LABEL: Record<ReleaseAsset['arch'], string> = {
  arm64: 'Apple Silicon (M1 and later)',
  x64: 'Intel Mac',
  universal: 'Apple Silicon and Intel',
  unknown: 'macOS',
};

export function formatSize(bytes: number | null): string | null {
  if (bytes == null) return null;
  return bytes >= 1e6 ? `${(bytes / 1e6).toFixed(0)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}

export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Release notes as a flat list of lines: Markdown bullets become items, headings and blank lines are dropped. */
export function noteLines(markdown: string): string[] {
  return markdown
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) =>
      l
        .replace(/^[-*]\s+/, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [text](url) → text
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1'),
    );
}
