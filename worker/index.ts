/**
 * Cloudflare Worker for spacekidlabs.com.
 *
 * Static files in dist/ are served by Cloudflare directly (see "assets" in wrangler.jsonc); this code only runs
 * for /api/*, the MCP connector and its sign-in. It handles:
 *   - the contact form: POST /api/contact keeps a copy for the /dev Messages tab (worker/messages.ts) and emails the
 *     message to the CONTACT_TO secret through Cloudflare Email Routing (send_email binding in wrangler.jsonc);
 *   - the /dev dashboard's API (worker/dev.ts);
 *   - event counts: POST /api/event (worker/events.ts) counts plays, downloads and labs started;
 *   - the MCP connector at /mcp (worker/mcp.ts), behind OAuth (worker/oauth.ts and Cloudflare's OAuthProvider,
 *     which serves /token, /register and the /.well-known metadata).
 * See docs/HOSTING.md.
 */
import { EmailMessage } from 'cloudflare:email';
import { OAuthProvider, type OAuthHelpers } from '@cloudflare/workers-oauth-provider';
import { handleDev, type DevEnv } from './dev';
import { handleMcp } from './mcp';
import { handleAuthorize, SCOPE } from './oauth';
import { handleEvent, record, type EventsEnv } from './events';
import { saveMessage } from './messages';

interface Env extends DevEnv, EventsEnv {
  /** MCP connector sign-ins (worker/oauth.ts): registered apps and grants. */
  OAUTH_KV: KVNamespace;
  /** Set by OAuthProvider for the /authorize page. */
  OAUTH_PROVIDER: OAuthHelpers;
  /** Public address of this site, for OAuth metadata. Only set for local tests. */
  SITE_ORIGIN?: string;
  CONTACT_EMAIL: SendEmail;
  /** Address the form sends from; must be on a domain with Email Routing turned on. */
  CONTACT_FROM: string;
  /** Where messages go (a secret); must be a verified destination address in Email Routing. */
  CONTACT_TO: string;
}

const SERVICES: Record<string, string> = {
  production: 'Production',
  mixing: 'Mixing',
  mastering: 'Mastering',
  'sound-design': 'Sound design / samples',
  software: 'Audio software',
  other: 'Something else',
};

const LIMITS = { name: 200, email: 254, message: 10_000, links: 2_000, page: 200 };

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** One line of header text: no line breaks (header injection), trimmed and capped. */
const oneLine = (s: string, max: number) => s.replace(/[\r\n]+/g, ' ').trim().slice(0, max);

/** RFC 2047 encoded-word, so names and subjects in any language survive. */
const encodeHeader = (s: string) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${base64(s)}?=`);

function base64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** base64 body wrapped at 76 characters per line, as MIME requires. */
const base64Body = (s: string) => base64(s).replace(/.{76}/g, '$&\r\n');

async function handleContact(request: Request, env: Env): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: 'Expected form data' });
  }
  const field = (k: string) => (typeof form.get(k) === 'string' ? (form.get(k) as string) : '');

  // Honeypot: hidden from people, filled in by bots. Pretend it worked so bots don't retry.
  if (field('bot-field')) return json(200, { ok: true });

  const name = oneLine(field('name'), LIMITS.name);
  const email = oneLine(field('email'), LIMITS.email);
  const service = SERVICES[field('service')] ?? '';
  const message = field('message').trim().slice(0, LIMITS.message);
  const links = field('links').trim().slice(0, LIMITS.links);
  const page = oneLine(field('page'), LIMITS.page);

  if (!name || !message || !service || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: 'Missing or invalid fields' });
  }

  // A copy for the /dev Messages tab first: if the email fails below, the message is still safe.
  let saved = false;
  try {
    await saveMessage(env, { name, email, service, links, page, message });
    saved = true;
  } catch (err) {
    console.error('Contact form: saving a copy failed', err instanceof Error ? err.message : String(err));
  }

  if (!env.CONTACT_TO) {
    console.error('Contact form: the CONTACT_TO secret is not set (see docs/HOSTING.md)');
    if (saved) { record(env, 'contact_sent'); return json(200, { ok: true }); }
    return json(500, { error: 'Not configured' });
  }

  const subject = `[spacekidlabs.com] ${service}: ${name}`;
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `About: ${service}`,
    ...(links ? [`Links: ${links}`] : []),
    ...(page ? [`Sent from: https://spacekidlabs.com${page}`] : []),
    '',
    message.replace(/\r?\n/g, '\r\n'),
    '',
    '--',
    'Reply to this email to answer them directly.',
  ].join('\r\n');

  const domain = env.CONTACT_FROM.split('@')[1];
  const raw = [
    `From: ${encodeHeader('SPACEKID LABS contact form')} <${env.CONTACT_FROM}>`,
    `To: <${env.CONTACT_TO}>`,
    `Reply-To: ${encodeHeader(name.replace(/["<>]/g, ''))} <${email}>`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body(text),
  ].join('\r\n');

  try {
    await env.CONTACT_EMAIL.send(new EmailMessage(env.CONTACT_FROM, env.CONTACT_TO, raw));
  } catch (err) {
    console.error('Contact form: sending failed', err);
    // Saved in /dev, so the visitor's message isn't lost; only the email notification is.
    if (!saved) return json(502, { error: 'Could not send' });
  }
  record(env, 'contact_sent');
  return json(200, { ok: true });
}

/** Everything that isn't the MCP endpoint itself. */
const site: ExportedHandler<Env> = {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact') {
      if (request.method !== 'POST') return json(405, { error: 'Use POST' });
      return handleContact(request, env);
    }
    if (pathname === '/api/event') return handleEvent(request, env);
    if (pathname.startsWith('/api/dev/')) return handleDev(request, env, pathname);
    if (pathname === '/authorize') return handleAuthorize(request, env);
    return json(404, { error: 'Not found' });
  },
};

/** The MCP endpoint, reached only with a valid access token. */
const mcp = {
  fetch: (request: Request, env: Env) => handleMcp(request, env),
};

// One provider per origin (spacekidlabs.com live; localhost in local tests).
const providers = new Map<string, OAuthProvider<Env>>();

function provider(origin: string): OAuthProvider<Env> {
  let p = providers.get(origin);
  if (!p) {
    p = new OAuthProvider<Env>({
      apiRoute: '/mcp',
      apiHandler: mcp,
      defaultHandler: site,
      authorizeEndpoint: '/authorize',
      tokenEndpoint: '/token',
      clientRegistrationEndpoint: '/register',
      scopesSupported: [SCOPE],
      requiredScopes: [SCOPE],
      resourceMetadata: { resource: `${origin}/mcp`, authorization_servers: [origin] },
      clientIdMetadataDocumentEnabled: true,
      // A token lasts an hour; the app refreshes it. Unused for 30 days, the connection ends.
      accessTokenTTL: 3600,
      refreshTokenTTL: 90 * 86_400,
      refreshTokenIdleTTL: 30 * 86_400,
    });
    providers.set(origin, p);
  }
  return p;
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return provider(env.SITE_ORIGIN || 'https://spacekidlabs.com').fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
