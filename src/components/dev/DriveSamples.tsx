import { useEffect, useState } from 'react';
import { HardDriveUpload, Link2, Rocket, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api, postJson } from '../../lib/devApi';
import { analyse, encodeMp3 } from '../../lib/devAudio';
import { PACKS } from '../../data/samples';
import { button, errorText, ghostButton, label } from './ui';

/**
 * Google Drive on the Samples tab (worker/drive.ts): connect, check a pack's folder against the site, link missing
 * Drive ids, upload originals straight to Drive, and run releases Claude queued from a Drive folder.
 */

export interface DriveStatus { configured: boolean; connected: boolean; account: string | null }
export interface FolderStatus {
  pack: string; folder: string; public: boolean; audioOnDrive: number; samplesOnSite: number; subfolders: string[];
  notOnSite: Array<{ id: string; name: string; size: number; path: string }>;
  duplicateNames: string[]; otherFiles: string[];
  missingIds: Array<{ id: number; name: string; driveFile: string | null }>;
  notOnDrive: string[];
  driveFiles: Array<{ id: string; name: string }>;
}
interface QueuedRelease { id: string; pack: string; category: string; maxSeconds: number; created: number; files: Array<{ id: string; name: string; size: number }> }

/** Keep each upload under the Worker's 100 MB request limit (base64 inside adds a third). */
const BATCH_BYTES = 40_000_000;

export function useDrive() {
  const [status, setStatus] = useState<DriveStatus | null>(null);
  const load = () => api<DriveStatus>('drive-status').then(setStatus).catch(() => setStatus({ configured: false, connected: false, account: null }));
  useEffect(() => { load(); }, []);
  return { status, reload: load };
}

/**
 * Uploads one original into the pack's Drive folder, straight from the browser to Google, and returns its file id.
 * The Worker only opens the upload session.
 */
export async function uploadOriginal(pack: string, file: File, onProgress?: (f: number) => void): Promise<string> {
  const { uploadUrl } = await postJson<{ uploadUrl: string }>('drive-upload', { pack, name: file.name, size: file.size, type: file.type || 'application/octet-stream' });
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(e.loaded / e.total); };
    xhr.onload = () => {
      try {
        const r = JSON.parse(xhr.responseText) as { id?: string; error?: { message?: string } };
        if (xhr.status >= 200 && xhr.status < 300 && r.id) resolve(r.id);
        else reject(new Error(`Drive upload of ${file.name} failed: ${r.error?.message ?? xhr.status}`));
      } catch {
        reject(new Error(`Drive upload of ${file.name} failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error(`Drive upload of ${file.name} failed (network)`));
    xhr.send(file);
  });
}

/** Sends samples (previews + details) to the Worker in commits of at most BATCH_BYTES. Returns the last commit. */
export async function publishSamples(
  pack: string, category: string,
  done: Array<{ meta: { name: string; duration: string; format: string; sizeBytes: number; peaks: string; driveId?: string }; mp3: Blob }>,
  onStatus: (s: string) => void,
): Promise<string> {
  const batches: typeof done[] = [[]];
  let size = 0;
  for (const d of done) {
    if (size + d.mp3.size > BATCH_BYTES && batches[batches.length - 1].length) { batches.push([]); size = 0; }
    batches[batches.length - 1].push(d);
    size += d.mp3.size;
  }
  let sha = '';
  for (const [i, batch] of batches.entries()) {
    onStatus(`Publishing${batches.length > 1 ? ` part ${i + 1} of ${batches.length}` : ''}…`);
    const form = new FormData();
    form.set('meta', JSON.stringify({ pack, category, items: batch.map(b => b.meta) }));
    batch.forEach((b, j) => form.set(`preview${j}`, b.mp3, `preview${j}.mp3`));
    sha = (await api<{ sha: string }>('samples', { method: 'POST', body: form })).sha;
  }
  return sha;
}

// ---------- Connection ----------

export function DriveConnection({ drive, notice }: { drive: ReturnType<typeof useDrive>; notice: string }) {
  const [error, setError] = useState('');
  const s = drive.status;
  async function connect() {
    try { location.href = (await api<{ url: string }>('drive-connect')).url; } catch (err) { setError(errorText(err)); }
  }
  async function disconnect() {
    if (!confirm('Disconnect Google Drive? Uploads and Claude\'s Drive tools stop until you connect again.')) return;
    try { await postJson('drive-disconnect', {}); drive.reload(); } catch (err) { setError(errorText(err)); }
  }
  if (!s) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 border border-zinc-800 bg-zinc-950/40 px-4 py-3">
      <HardDriveUpload className={cn('w-4 h-4', s.connected ? 'text-emerald-400' : 'text-zinc-500')} aria-hidden />
      {!s.configured ? (
        <span className="text-sm text-zinc-400">Google Drive isn't set up yet (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET, see docs/HOSTING.md).</span>
      ) : s.connected ? (
        <>
          <span className="text-sm text-zinc-300">Drive connected as <span className="font-mono text-zinc-100">{s.account}</span></span>
          <span className="flex-grow" />
          <button type="button" onClick={disconnect} className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 hover:text-white">Disconnect</button>
        </>
      ) : (
        <>
          <span className="text-sm text-zinc-400">Connect the Google account that owns the pack folders.</span>
          <span className="flex-grow" />
          <button type="button" onClick={connect} className={cn(button, 'py-2')}>Connect Google Drive</button>
        </>
      )}
      {(notice || error) && <p className={cn('w-full font-mono text-xs', error || notice !== 'connected' ? 'text-red-400' : 'text-emerald-400')}>
        {error || (notice === 'connected' ? 'Google Drive connected.' : notice)}
      </p>}
    </div>
  );
}

// ---------- Folder check ----------

export function DriveFolder({ pack }: { pack: string }) {
  const [st, setSt] = useState<FolderStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState('');
  const load = () => { setSt(null); setError(''); api<FolderStatus>(`drive-folder?pack=${encodeURIComponent(pack)}`).then(setSt).catch(e => setError(errorText(e))); };
  useEffect(() => { setResult(''); load(); }, [pack]);

  async function link() {
    setBusy('Linking…');
    try {
      const r = await postJson<{ linked: number; stillMissing: string[]; sha: string | null }>('drive-link', { pack });
      setResult(`Linked ${r.linked} sample${r.linked === 1 ? '' : 's'}${r.stillMissing.length ? `; ${r.stillMissing.length} still have no file of the same name on Drive` : ''}.${r.sha ? ' Live in about 2 minutes.' : ''}`);
      load();
    } catch (err) { setError(errorText(err)); } finally { setBusy(''); }
  }

  const linkable = st?.missingIds.filter(m => m.driveFile).length ?? 0;
  return (
    <div className="border border-zinc-900 px-4 py-3 space-y-2">
      <p className={label}>Drive folder · {PACKS.find(p => p.id === pack)?.title}</p>
      {error ? <p className="font-mono text-xs text-red-400">{error}</p> : !st ? <p className="text-xs text-zinc-500">Reading the folder…</p> : (
        <>
          <ul className="font-mono text-xs text-zinc-400 space-y-1">
            <li>
              {st.audioOnDrive} audio files on Drive{st.subfolders.length ? ` in ${st.subfolders.length} subfolder${st.subfolders.length === 1 ? '' : 's'} (${st.subfolders.slice(0, 6).join(', ')}${st.subfolders.length > 6 ? '…' : ''})` : ''}
              {' · '}{st.samplesOnSite} samples on the site
            </li>
            {!st.public && <li className="text-amber-400">The folder isn't shared as "Anyone with the link": download buttons won't work for visitors.</li>}
            {st.notOnSite.length > 0 && <li className="text-zinc-200">{st.notOnSite.length} audio file{st.notOnSite.length === 1 ? '' : 's'} on Drive not on the site yet (ask Claude to start a release, or add them below)</li>}
            {st.missingIds.length > 0 && <li className="text-amber-400">{st.missingIds.length} sample{st.missingIds.length === 1 ? '' : 's'} without a download link{linkable ? `, ${linkable} can be linked by name` : ''}</li>}
            {st.duplicateNames.length > 0 && <li className="text-amber-400">Same file name in more than one place: {st.duplicateNames.slice(0, 3).join(', ')}{st.duplicateNames.length > 3 ? '…' : ''} (linking uses the first)</li>}
            {st.otherFiles.length > 0 && <li>Not audio: {st.otherFiles.slice(0, 4).join(', ')}{st.otherFiles.length > 4 ? '…' : ''}</li>}
            {st.notOnDrive.length > 0 && <li>{st.notOnDrive.length} sample{st.notOnDrive.length === 1 ? '' : 's'} with no file of the same name on Drive</li>}
          </ul>
          {linkable > 0 && (
            <button type="button" className={cn(ghostButton, 'py-1.5 inline-flex items-center gap-2')} disabled={Boolean(busy)} onClick={link}>
              <Link2 className="w-3.5 h-3.5" aria-hidden /> {busy || `Link ${linkable} by name`}
            </button>
          )}
        </>
      )}
      {result && <p className="font-mono text-xs text-emerald-400">{result}</p>}
    </div>
  );
}

// ---------- Releases queued by Claude ----------

export function QueuedReleases() {
  const [list, setList] = useState<QueuedRelease[] | null>(null);
  const [status, setStatus] = useState<{ id: string; text: string; error?: boolean } | null>(null);
  const load = () => api<{ releases: QueuedRelease[] }>('releases-queued').then(r => setList(r.releases)).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  async function release(r: QueuedRelease) {
    try {
      const done: Parameters<typeof publishSamples>[2] = [];
      for (const [i, f] of r.files.entries()) {
        setStatus({ id: r.id, text: `Fetching ${i + 1} of ${r.files.length} from Drive: ${f.name}` });
        const res = await fetch(`/api/dev/drive-file?id=${encodeURIComponent(f.id)}`, { credentials: 'same-origin' });
        if (!res.ok) throw new Error(`${f.name}: ${((await res.json().catch(() => ({}))) as { error?: string }).error ?? res.status}`);
        const file = new File([await res.blob()], f.name);
        setStatus({ id: r.id, text: `Making preview ${i + 1} of ${r.files.length}: ${f.name}` });
        const a = await analyse(file);
        const mp3 = await encodeMp3(a.buffer, { kbps: 192, maxSeconds: r.maxSeconds });
        done.push({ meta: { name: f.name, duration: a.duration, format: a.format, sizeBytes: f.size || file.size, peaks: a.peaks, driveId: f.id }, mp3 });
      }
      await publishSamples(r.pack, r.category, done, text => setStatus({ id: r.id, text }));
      await postJson('release-remove', { id: r.id });
      setStatus({ id: r.id, text: `Released ${done.length} sample${done.length === 1 ? '' : 's'} to ${PACKS.find(p => p.id === r.pack)?.title}. Live in about 2 minutes.` });
      load();
    } catch (err) {
      setStatus({ id: r.id, text: errorText(err), error: true });
    }
  }
  async function drop(r: QueuedRelease) {
    if (!confirm(`Drop this queued release of ${r.files.length} files? Nothing on Drive changes.`)) return;
    await postJson('release-remove', { id: r.id }).catch(() => {});
    load();
  }

  if (!list?.length && !status) return null;
  const busy = Boolean(status && !status.error && list?.some(r => r.id === status.id));
  return (
    <section className="space-y-3">
      <h2 className="font-display font-bold text-xl text-white flex items-center gap-2"><Rocket className="w-5 h-5 text-brand-orange" aria-hidden /> Ready to release</h2>
      <p className="text-xs text-zinc-500">Queued by Claude from Drive. Release fetches each original, makes its preview here in your browser and publishes them all with their download links.</p>
      <ul className="space-y-2">
        {list?.map(r => (
          <li key={r.id} className="border border-zinc-800 bg-zinc-950/40 px-4 py-3 flex flex-wrap items-center gap-3">
            <span className="text-zinc-100">{r.files.length} sample{r.files.length === 1 ? '' : 's'} → {PACKS.find(p => p.id === r.pack)?.title ?? r.pack} · {r.category}</span>
            <span className="font-mono text-[11px] text-zinc-500 truncate max-w-md">{r.files.slice(0, 3).map(f => f.name).join(', ')}{r.files.length > 3 ? '…' : ''}</span>
            <span className="flex-grow" />
            <button type="button" className={cn(button, 'py-2')} disabled={busy} onClick={() => release(r)}>Release</button>
            <button type="button" className="p-2 text-zinc-500 hover:text-red-400 disabled:opacity-40" disabled={busy} onClick={() => drop(r)} aria-label="Drop this release"><Trash2 className="w-4 h-4" aria-hidden /></button>
          </li>
        ))}
      </ul>
      {status && <p role="status" className={cn('font-mono text-xs', status.error ? 'text-red-400' : 'text-zinc-400')}>{status.text}</p>}
    </section>
  );
}
