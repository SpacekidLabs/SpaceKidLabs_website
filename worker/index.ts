/**
 * Cloudflare Worker for spacekidlabs.com.
 *
 * Static files in dist/ are served by Cloudflare directly (see "assets" in wrangler.jsonc); this code only
 * runs for /api/*. It handles the contact form: POST /api/contact emails the message to the CONTACT_TO secret
 * through Cloudflare Email Routing (send_email binding in wrangler.jsonc). See docs/HOSTING.md.
 */
import { EmailMessage } from 'cloudflare:email';

interface Env {
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

  if (!env.CONTACT_TO) {
    console.error('Contact form: the CONTACT_TO secret is not set (see docs/HOSTING.md)');
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
    return json(502, { error: 'Could not send' });
  }
  return json(200, { ok: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact') {
      if (request.method !== 'POST') return json(405, { error: 'Use POST' });
      return handleContact(request, env);
    }
    return json(404, { error: 'Not found' });
  },
} satisfies ExportedHandler<Env>;
