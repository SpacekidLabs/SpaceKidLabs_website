/**
 * Google Drive for releasing samples: /dev uploads originals straight into a pack's Drive folder and fills in the
 * Drive IDs, and Claude (the MCP connector) can check a folder, link missing IDs and queue a release.
 *
 * Sign-in: OAuth 2.0 with the owner's Google account ("Connect Google Drive" in /dev), scope `drive`, offline access.
 * The refresh token is kept in D1 (`settings`), encrypted with a key derived from GOOGLE_CLIENT_SECRET, so the
 * database alone doesn't give access to the Drive. Access tokens live in memory for under an hour.
 *
 * Config: GOOGLE_CLIENT_ID (var in wrangler.jsonc), GOOGLE_CLIENT_SECRET (secret). See docs/HOSTING.md.
 *
 * Uploads don't pass through the Worker (it has a 100 MB request limit and little CPU): the Worker opens a
 * resumable upload session for the browser's origin, and the browser sends the file straight to Google.
 */
import { dbReady, ideasDb, type IdeasEnv } from './ideas';

export interface DriveEnv extends IdeasEnv {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  /** Public address of the site; only set for local tests (e.g. http://localhost:8787). */
  SITE_ORIGIN?: string;
}

/** The site's own address for Google's redirect and upload CORS: always https, except a local test origin. */
export const siteOrigin = (env: DriveEnv, url: URL) => env.SITE_ORIGIN || `https://${url.host}`;

export class DriveError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const SCOPE = 'https://www.googleapis.com/auth/drive';
const API = 'https://www.googleapis.com/drive/v3';
const enc = new TextEncoder();

async function db(env: DriveEnv) {
  const d = ideasDb(env);
  await dbReady();
  return d;
}
const getSetting = async (d: D1Database, key: string) =>
  (await d.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>())?.value ?? null;
const setSetting = (d: D1Database, key: string, value: string) =>
  d.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value').bind(key, value).run();
const delSetting = (d: D1Database, key: string) => d.prepare('DELETE FROM settings WHERE key = ?').bind(key).run();

function configured(env: DriveEnv): { id: string; secret: string } {
  const id = env.GOOGLE_CLIENT_ID?.trim();
  const secret = env.GOOGLE_CLIENT_SECRET?.trim();
  if (!id || !secret) throw new DriveError(503, 'Google Drive is not set up yet: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing (docs/HOSTING.md).');
  return { id, secret };
}

// ---------- Refresh token at rest ----------

async function key(secret: string): Promise<CryptoKey> {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode(`drive-refresh-token:${secret}`));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function seal(secret: string, text: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(secret), enc.encode(text)));
  return `${b64(iv)}.${b64(data)}`;
}
async function open(secret: string, sealed: string): Promise<string> {
  const [iv, data] = sealed.split('.');
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await key(secret), unb64(data)));
}

// ---------- Connect ----------

/** The Google sign-in page to send the browser to. The state is single-use and expires in 10 minutes. */
export async function connectUrl(env: DriveEnv, origin: string): Promise<string> {
  const { id } = configured(env);
  const d = await db(env);
  const state = crypto.randomUUID();
  await setSetting(d, `drive_state:${state}`, String(Date.now() + 10 * 60_000));
  const p = new URLSearchParams({
    client_id: id, redirect_uri: `${origin}/api/dev/google-callback`, response_type: 'code', scope: SCOPE,
    access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

/**
 * Google sends the browser back here. The login cookie isn't sent on this cross-site redirect (SameSite=Strict),
 * so the single-use state from connectUrl is what proves the owner started it.
 */
export async function callback(env: DriveEnv, url: URL): Promise<Response> {
  const origin = siteOrigin(env, url);
  const back = (msg: string) => Response.redirect(`${origin}/dev#samples/drive:${encodeURIComponent(msg)}`, 302);
  try {
    const { id, secret } = configured(env);
    const d = await db(env);
    const state = url.searchParams.get('state') ?? '';
    const expires = Number(await getSetting(d, `drive_state:${state}`));
    await delSetting(d, `drive_state:${state}`);
    if (!state || !expires || expires < Date.now()) return back('That sign-in link expired. Try Connect again.');
    if (url.searchParams.get('error')) return back(`Google said: ${url.searchParams.get('error')}`);
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: url.searchParams.get('code') ?? '', client_id: id, client_secret: secret,
        redirect_uri: `${origin}/api/dev/google-callback`, grant_type: 'authorization_code',
      }),
    });
    const t = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; error_description?: string };
    if (!res.ok || !t.refresh_token || !t.access_token) return back(`Google refused: ${t.error_description ?? res.status}`);
    cached = { token: t.access_token, until: Date.now() + ((t.expires_in ?? 3600) - 120) * 1000 };
    const who = (await (await fetch(`${API}/about?fields=user(emailAddress)`, { headers: { Authorization: `Bearer ${t.access_token}` } })).json()) as { user?: { emailAddress?: string } };
    await setSetting(d, 'drive_refresh', await seal(secret, t.refresh_token));
    await setSetting(d, 'drive_account', who.user?.emailAddress ?? 'unknown');
    return back('connected');
  } catch (err) {
    console.error('Drive callback:', err instanceof Error ? err.message : String(err));
    return back(err instanceof DriveError ? err.message : 'Connecting failed. See the Worker logs.');
  }
}

export async function driveStatus(env: DriveEnv) {
  const ready = Boolean(env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim());
  if (!ready) return { configured: false, connected: false, account: null };
  const d = await db(env);
  const account = await getSetting(d, 'drive_account');
  return { configured: true, connected: Boolean(account && (await getSetting(d, 'drive_refresh'))), account };
}

export async function disconnect(env: DriveEnv) {
  const d = await db(env);
  const sealed = await getSetting(d, 'drive_refresh');
  if (sealed && env.GOOGLE_CLIENT_SECRET) {
    // Also revoke at Google, so the old token is useless even if it leaked.
    const token = await open(env.GOOGLE_CLIENT_SECRET.trim(), sealed).catch(() => null);
    if (token) await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: 'POST' }).catch(() => {});
  }
  await delSetting(d, 'drive_refresh');
  await delSetting(d, 'drive_account');
  cached = null;
  return { connected: false };
}

// ---------- Calls ----------

let cached: { token: string; until: number } | null = null;

async function accessToken(env: DriveEnv): Promise<string> {
  if (cached && cached.until > Date.now()) return cached.token;
  const { id, secret } = configured(env);
  const d = await db(env);
  const sealed = await getSetting(d, 'drive_refresh');
  if (!sealed) throw new DriveError(409, 'Google Drive is not connected. Press "Connect Google Drive" in /dev → Samples.');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: id, client_secret: secret, refresh_token: await open(secret, sealed), grant_type: 'refresh_token' }),
  });
  const t = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !t.access_token) {
    if (t.error === 'invalid_grant') {
      await delSetting(d, 'drive_refresh');
      throw new DriveError(409, 'Google ended the Drive connection (password change or access removed). Connect again in /dev → Samples.');
    }
    throw new DriveError(502, `Google token refresh failed (${res.status})`);
  }
  cached = { token: t.access_token, until: Date.now() + ((t.expires_in ?? 3600) - 120) * 1000 };
  return t.access_token;
}

async function call<T>(env: DriveEnv, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path.startsWith('https://') ? path : `${API}${path}`, {
    ...init, headers: { Authorization: `Bearer ${await accessToken(env)}`, ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const msg = ((await res.json().catch(() => ({}))) as { error?: { message?: string } }).error?.message ?? '';
    console.error(`Drive ${init.method ?? 'GET'} ${path.split('?')[0]}: ${res.status} ${msg}`);
    if (res.status === 404) throw new DriveError(404, 'Not found on Drive, or the connected account can\'t see it.');
    throw new DriveError(502, `Drive said ${res.status}${msg ? `: ${msg.slice(0, 200)}` : ''}`);
  }
  return (await res.json()) as T;
}

/** The folder id in a Drive folder link (…/folders/<id>?usp=sharing), or the id itself. */
export function folderId(linkOrId: string): string {
  const m = /\/folders\/([A-Za-z0-9_-]{10,})/.exec(linkOrId) ?? /^([A-Za-z0-9_-]{10,})$/.exec(linkOrId.trim());
  if (!m) throw new DriveError(400, 'That is not a Drive folder link');
  return m[1];
}

export interface DriveFile {
  id: string; name: string; size: number; mimeType: string;
  /** Subfolder path inside the pack folder ("" at the top, "Kicks" or "Drums/Kicks" below). */
  path: string;
}

const FOLDER = 'application/vnd.google-apps.folder';

/**
 * Every file in a folder and its subfolders. Lists one level at a time, with up to 40 folders per query, so even a
 * pack with many category folders stays far below the free plan's 50 outgoing requests per call.
 */
export async function listFolder(env: DriveEnv, folder: string): Promise<DriveFile[]> {
  const out: DriveFile[] = [];
  let level = new Map([[folderId(folder), '']]); // folder id → its path
  for (let depth = 0; level.size && depth < 6; depth++) {
    const next = new Map<string, string>();
    const ids = [...level.keys()];
    for (let i = 0; i < ids.length; i += 40) {
      const parents = ids.slice(i, i + 40).map(id => `'${id}' in parents`).join(' or ');
      let page = '';
      do {
        const q = new URLSearchParams({
          q: `(${parents}) and trashed = false`,
          fields: 'nextPageToken, files(id, name, size, mimeType, parents)', pageSize: '1000',
          supportsAllDrives: 'true', includeItemsFromAllDrives: 'true', ...(page && { pageToken: page }),
        });
        const r = await call<{ nextPageToken?: string; files: Array<{ id: string; name: string; size?: string; mimeType: string; parents?: string[] }> }>(env, `/files?${q}`);
        for (const f of r.files) {
          const path = level.get(f.parents?.find(p => level.has(p)) ?? '') ?? '';
          if (f.mimeType === FOLDER) next.set(f.id, path ? `${path}/${f.name}` : f.name);
          else out.push({ id: f.id, name: f.name, size: Number(f.size ?? 0), mimeType: f.mimeType, path });
        }
        page = r.nextPageToken ?? '';
      } while (page && out.length < 10_000);
    }
    level = next;
  }
  return out;
}

/** Whether "anyone with the link" can open the folder (the site's download buttons need that). */
export async function folderIsPublic(env: DriveEnv, folder: string): Promise<boolean> {
  const r = await call<{ permissions?: Array<{ type: string; role: string }> }>(env, `/files/${folderId(folder)}?fields=permissions(type,role)&supportsAllDrives=true`);
  return (r.permissions ?? []).some(p => p.type === 'anyone');
}

/**
 * Opens a resumable upload into a folder for the browser at `origin`, which then PUTs the bytes straight to Google.
 * Google answers that PUT with the new file's id and name.
 */
export async function startUpload(env: DriveEnv, input: { folder: string; name: string; size: number; type: string }, origin: string) {
  const name = String(input.name ?? '').replace(/[\\/]/g, '-').trim().slice(0, 200);
  if (!name) throw new DriveError(400, 'File name missing');
  const size = Number(input.size);
  if (!Number.isFinite(size) || size <= 0 || size > 5e9) throw new DriveError(400, 'Bad file size');
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name&supportsAllDrives=true', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await accessToken(env)}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': input.type || 'application/octet-stream',
      'X-Upload-Content-Length': String(size),
      Origin: origin, // lets the browser at this origin send the bytes (CORS)
    },
    body: JSON.stringify({ name, parents: [folderId(input.folder)] }),
  });
  const location = res.headers.get('Location');
  if (!res.ok || !location) {
    const msg = ((await res.json().catch(() => ({}))) as { error?: { message?: string } }).error?.message ?? '';
    throw new DriveError(502, `Drive refused the upload (${res.status})${msg ? `: ${msg.slice(0, 200)}` : ''}`);
  }
  return { uploadUrl: location };
}

/** A Drive file's bytes, streamed through (for making previews of a queued release in the browser). */
export async function downloadFile(env: DriveEnv, fileId: unknown): Promise<Response> {
  const id = String(fileId ?? '');
  if (!/^[A-Za-z0-9_-]{10,}$/.test(id)) throw new DriveError(400, 'Bad file id');
  const res = await fetch(`${API}/files/${id}?alt=media&supportsAllDrives=true`, { headers: { Authorization: `Bearer ${await accessToken(env)}` } });
  if (!res.ok) throw new DriveError(res.status === 404 ? 404 : 502, `Drive download failed (${res.status})`);
  return new Response(res.body, {
    headers: { 'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

// ---------- Releases queued by Claude ----------

export interface QueuedRelease {
  id: string; pack: string; category: string; maxSeconds: number; created: number; files: Array<{ id: string; name: string; size: number }>;
}

export async function queueRelease(env: DriveEnv, r: Omit<QueuedRelease, 'id' | 'created'>) {
  const d = await db(env);
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  await d.prepare('INSERT INTO releases (id, pack, category, max_seconds, files, created) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, r.pack, r.category, r.maxSeconds, JSON.stringify(r.files), Date.now()).run();
  return id;
}

export async function listReleases(env: DriveEnv): Promise<QueuedRelease[]> {
  const d = await db(env);
  const rows = (await d.prepare('SELECT * FROM releases ORDER BY created').all<{ id: string; pack: string; category: string; max_seconds: number; files: string; created: number }>()).results;
  return rows.map(r => ({ id: r.id, pack: r.pack, category: r.category, maxSeconds: r.max_seconds, created: r.created, files: JSON.parse(r.files) }));
}

export async function removeRelease(env: DriveEnv, id: unknown) {
  const d = await db(env);
  await d.prepare('DELETE FROM releases WHERE id = ?').bind(String(id ?? '')).run();
  return { ok: true };
}
