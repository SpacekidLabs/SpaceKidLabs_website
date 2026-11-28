/** Calls the /dev dashboard's API (worker/dev.ts) with the login cookie. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/dev/${path}`, { credentials: 'same-origin', ...init });
  const type = res.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) {
    throw new Error('The dashboard API is not running here. It works on the live site, or locally with `npm run preview:cf`.');
  }
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
  return body;
}

export const postJson = <T,>(path: string, data: unknown) =>
  api<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
