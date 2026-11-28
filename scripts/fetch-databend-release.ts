/**
 * Reads the latest DATABEND release from GitHub (SpacekidLabs/data-bend) and writes it to
 * src/data/databend-release.json, which the /download page reads at build time.
 *
 *   npx tsx scripts/fetch-databend-release.ts
 *
 * Runs at the start of every site build. If GitHub can't be reached, or the repo has no published release
 * yet, the file is left as it is, so the build never fails because of this step and the page keeps showing
 * the last known release (or the Google Drive fallback that's committed in the file).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { DatabendRelease, ReleaseAsset } from '../src/data/databend';

const REPO = 'SpacekidLabs/data-bend';
const OUT = 'src/data/databend-release.json';
const TIMEOUT_MS = 10_000;

type GitHubAsset = { name: string; browser_download_url: string; size: number; digest?: string | null };
type GitHubRelease = { tag_name: string; name: string | null; published_at: string; html_url: string; body: string | null; assets: GitHubAsset[] };

/** Which Mac the file is for, from its name (electron-builder adds -arm64 / -x64 / -universal). */
function archOf(name: string): ReleaseAsset['arch'] {
  if (/universal/i.test(name)) return 'universal';
  if (/arm-?64|aarch64|apple.?silicon/i.test(name)) return 'arm64';
  if (/x64|x86[-_]?64|intel/i.test(name)) return 'x64';
  return 'unknown';
}

async function main() {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'spacekidlabs-site-build' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  let release: GitHubRelease;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (res.status === 404) {
      console.log(`DATABEND release: ${REPO} has no published release yet; keeping ${OUT}`);
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    release = (await res.json()) as GitHubRelease;
  } catch (err) {
    console.warn(`DATABEND release: couldn't reach GitHub (${(err as Error).message}); keeping ${OUT}`);
    return;
  }

  // Only installable Mac files: skip electron-builder's update metadata (latest-mac.yml, *.blockmap)
  // and any Windows or Linux builds.
  const assets: ReleaseAsset[] = release.assets
    .filter((a) => /\.(dmg|zip)$/i.test(a.name) && !/win|linux/i.test(a.name))
    .map((a) => ({
      name: a.name,
      url: a.browser_download_url,
      size: a.size,
      arch: archOf(a.name),
      sha256: a.digest?.startsWith('sha256:') ? a.digest.slice(7) : undefined,
    }));

  // electron-builder only adds an arch suffix to non-default builds: next to an -arm64 file, a file with no
  // suffix is the Intel one.
  if (assets.some((a) => a.arch === 'arm64')) for (const a of assets) if (a.arch === 'unknown') a.arch = 'x64';

  if (assets.length === 0) {
    console.warn(`DATABEND release ${release.tag_name} has no .dmg or .zip files; keeping ${OUT}`);
    return;
  }

  const data: DatabendRelease = {
    source: 'github',
    version: release.tag_name.replace(/^v/, ''),
    date: release.published_at.slice(0, 10),
    pageUrl: release.html_url,
    notes: (release.body ?? '').trim(),
    assets,
  };

  const json = JSON.stringify(data, null, 2) + '\n';
  if (readFileSync(OUT, 'utf8') !== json) writeFileSync(OUT, json);
  console.log(`DATABEND release: v${data.version} (${assets.map((a) => a.name).join(', ')})`);
}

main();
