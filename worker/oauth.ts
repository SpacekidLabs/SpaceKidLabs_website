/**
 * Sign-in for the MCP connector (worker/mcp.ts). Claude and other MCP clients use OAuth: they register, send you to
 * /authorize, and get a token. This page is that step: it shows which app is asking and where access goes, and
 * asks for the /dev dashboard password (DEV_PASSWORD).
 *
 * The OAuth protocol itself (registration, PKCE, tokens, refresh, discovery) is Cloudflare's
 * @cloudflare/workers-oauth-provider. It stores clients and grants in the OAUTH_KV namespace, tokens only as hashes.
 */
import { AuthorizationError, CimdFetchError, type ConsentDescription, type OAuthHelpers } from '@cloudflare/workers-oauth-provider';
import { checkPassword, cleanEnv, type DevEnv } from './dev';

export const SCOPE = 'dashboard';

const escape = (value: string) => value.replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);

function page(details: ConsentDescription, handle: string, error = ''): string {
  const name = escape(details.clientName || 'An app');
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Connect ${name} · SPACEKID LABS</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #09090b; color: #e4e4e7; font: 15px/1.6 system-ui, sans-serif; }
  main { width: min(26rem, calc(100% - 3rem)); }
  .eyebrow { font: 11px ui-monospace, monospace; letter-spacing: .2em; text-transform: uppercase; color: #71717a; margin: 0 0 1rem; }
  h1 { font-size: 1.5rem; line-height: 1.3; margin: 0 0 1rem; color: #fff; }
  p { margin: 0 0 1rem; color: #a1a1aa; }
  strong { color: #fff; font-weight: 600; }
  .warn { color: #fbbf24; }
  .error { color: #f87171; font: 13px ui-monospace, monospace; }
  label { display: block; font: 11px ui-monospace, monospace; letter-spacing: .15em; text-transform: uppercase; color: #71717a; margin: 1.5rem 0 .4rem; }
  input { box-sizing: border-box; width: 100%; padding: .6rem .75rem; background: #000; border: 1px solid #27272a; color: #fff; font: inherit; outline: none; }
  input:focus { border-color: #ffaa00; }
  .buttons { display: flex; gap: .5rem; margin-top: 1.25rem; }
  button { padding: .7rem 1.2rem; border: 1px solid #27272a; background: transparent; color: #d4d4d8; font: 700 12px ui-monospace, monospace; letter-spacing: .15em; text-transform: uppercase; cursor: pointer; }
  button[value=approve] { background: #ffaa00; border-color: #ffaa00; color: #000; }
  button:hover { filter: brightness(1.1); }
</style>
<main>
  <p class="eyebrow">// SPACEKID LABS · Dev</p>
  <h1>Connect <strong>${name}</strong> to your dashboard?</h1>
  <p>${details.clientDomain ? `Published by <strong>${escape(details.clientDomain)}</strong>.` : 'This app registered itself, so its name is not verified.'}
     Access goes to <strong>${escape(details.redirectHost)}</strong>.</p>
  ${details.redirectIsLoopback ? '<p class="warn">That is an app on your computer. Continue only if you just started connecting from it.</p>' : ''}
  <p>It will be able to read your GitHub projects and site traffic, handle issues in any project, and add sketches and archive posts to the website.</p>
  <form method="post">
    <input type="hidden" name="handle" value="${escape(handle)}">
    <label for="password">Dashboard password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" autofocus>
    ${error ? `<p class="error" role="alert">${escape(error)}</p>` : ''}
    <div class="buttons">
      <button name="decision" value="approve">Connect</button>
      <button name="decision" value="deny" formnovalidate>Cancel</button>
    </div>
  </form>
</main>
</html>`;
}

const text = (status: number, message: string) =>
  new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

/** GET shows the page; POST checks the password and approves or declines. */
export async function handleAuthorize(request: Request, rawEnv: DevEnv & { OAUTH_PROVIDER: OAuthHelpers }): Promise<Response> {
  const env = cleanEnv(rawEnv);
  const oauth = rawEnv.OAUTH_PROVIDER;
  if (!env.DEV_PASSWORD) return text(503, 'The dashboard password (DEV_PASSWORD) is not set up yet.');
  try {
    if (request.method === 'GET') {
      const auth = await oauth.parseAuthRequest(request);
      const details = await oauth.describeConsent(auth);
      const consent = await oauth.beginConsent(auth);
      consent.headers.set('Content-Type', 'text/html; charset=utf-8');
      consent.headers.set('Cache-Control', 'no-store');
      return new Response(page(details, consent.handle), { headers: consent.headers });
    }
    if (request.method !== 'POST') return text(405, 'Method not allowed');

    const form = await request.formData();
    const handle = String(form.get('handle') ?? '');
    if (form.get('decision') !== 'approve') {
      const denied = await oauth.denyConsent(request, handle);
      return new Response(null, { status: 302, headers: denied.headers });
    }
    if (!(await checkPassword(String(form.get('password') ?? ''), env))) {
      await new Promise(r => setTimeout(r, 800)); // slows down guessing
      // The handle is still unused, so the same page can be shown again with the same form.
      let details: ConsentDescription | null = null;
      try {
        details = await oauth.describeConsent(await oauth.parseAuthRequest(request));
      } catch {
        details = null;
      }
      if (!details) return text(401, 'Wrong password. Go back and try again.');
      return new Response(page(details, handle, 'Wrong password'), {
        status: 401,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "frame-ancestors 'none'" },
      });
    }
    const approved = await oauth.approveConsent(request, handle, { scope: [SCOPE] });
    const { redirectTo } = await oauth.completeAuthorization({
      request: approved.request,
      userId: 'owner',
      metadata: { connectedAt: new Date().toISOString() },
      scope: [SCOPE],
      props: { owner: true },
    });
    approved.headers.set('Location', redirectTo);
    return new Response(null, { status: 302, headers: approved.headers });
  } catch (error) {
    if (error instanceof AuthorizationError && error.redirectTo) return Response.redirect(error.redirectTo, 302);
    if (error instanceof AuthorizationError) return text(400, `${error.description} Start connecting again from the app.`);
    if (error instanceof CimdFetchError) return text(400, 'This app could not be verified.');
    throw error;
  }
}
