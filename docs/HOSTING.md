# Hosting: Cloudflare

spacekidlabs.com runs on **Cloudflare Workers** (free plan): Cloudflare serves the pre-rendered site from `dist/`,
and a small Worker (`worker/index.ts`) handles the contact form. DNS and email forwarding for the domain are on
Cloudflare too. The domain itself is registered at **GoDaddy**.

Moved from Netlify in November 2026, because Netlify's free plan allows only about 20 production deploys a month
(300 credits, 15 per deploy). Cloudflare's free plan has no deploy limit that this site gets near: Workers Builds
allows 3,000 build minutes a month and a build takes about a minute.

## How a deploy works

Every push to `main` deploys automatically (Cloudflare **Workers Builds**, connected to this GitHub repo):

1. Cloudflare runs `npm run build:site`: fetches the latest DATABEND release, builds with Vite, pre-renders every
   page and writes `sitemap.xml`, `robots.txt` and `rss.xml` into `dist/`.
2. Then `npx wrangler deploy`, which uploads `dist/` and the Worker using `wrangler.jsonc`.

Pushes to other branches build a preview version with its own `*.workers.dev` address and don't touch the live site.

See builds and logs in the Cloudflare dashboard: **Workers & Pages → spacekidlabs → Deployments**. Roll back from
the same page (**⋯ → Rollback**).

To deploy by hand from your Mac instead: `npx wrangler login` once, then `npm run deploy`.

## What's where

| File | What it does |
| --- | --- |
| `wrangler.jsonc` | Worker name, static files, 404 handling, email binding, custom domain |
| `worker/index.ts` | The Worker: `POST /api/contact` emails the message. Every other URL is a static file and never runs the Worker |
| `public/_headers` | Cache rules (copied into `dist/`): built JS/CSS for a year, audio and favicons for a week, RSS content type |
| `scripts/prerender.ts` | Writes `dist/<page>.html` for each page, and `dist/404.html` (the empty app) for everything else |

How URLs are served (`assets` in `wrangler.jsonc`):

- `/download` serves `dist/download.html`, `/archive/wavesets` serves `dist/archive/wavesets.html`.
- Any other URL gets `dist/404.html` with a real **404** status. The React app then shows the 404 page.
- `/api/*` goes to the Worker.

## Contact form

The form (`src/components/ContactForm.tsx`) posts to `/api/contact`. The Worker checks the fields, drops
submissions that fill in the hidden honeypot field, and emails the message through **Cloudflare Email Routing**:

- **From:** `contact-form@spacekidlabs.com` (`CONTACT_FROM` in `wrangler.jsonc`)
- **To:** the `CONTACT_TO` secret. It's kept in Cloudflare, not in this repo, and must be a **verified destination
  address** in Email Routing.
- **Reply-To:** the visitor's address, so replying to the email answers them.

To change where messages go:

1. Cloudflare dashboard → **spacekidlabs.com → Email → Email Routing → Destination addresses**: add the new address
   and click the link in the verification email.
2. **Workers & Pages → spacekidlabs → Settings → Variables and Secrets**: edit `CONTACT_TO`.

If sending fails, the form shows an error with the email address as a fallback. Worker logs:
**Workers & Pages → spacekidlabs → Logs**.

## Email on the domain

Email Routing also forwards **hello@spacekidlabs.com** to the same Gmail inbox
(**spacekidlabs.com → Email → Email Routing → Routing rules**). It only receives; to send from that address, set
up Gmail's "Send mail as" with an SMTP service, or use a paid mailbox.

## Domain and DNS

- **Registrar:** GoDaddy (renewals and the nameserver setting are there).
- **Nameservers:** GoDaddy points the domain at Cloudflare's two nameservers, shown in the Cloudflare dashboard under
  **spacekidlabs.com → DNS → Records** (top of the page). Change DNS records in Cloudflare, not GoDaddy.
- **Records:**
  - `spacekidlabs.com` is the Worker's custom domain (Cloudflare creates and manages this record).
  - `www` is a proxied record with a redirect rule (**Rules → Redirect Rules**) that sends
    `www.spacekidlabs.com/*` to `https://spacekidlabs.com/*` (301).
  - MX and TXT records for Email Routing (added by Cloudflare when Email Routing was turned on).
- **HTTPS:** automatic (Cloudflare Universal SSL). SSL/TLS mode is **Full (strict)**.

## Running it locally

```bash
npm run dev          # normal development: Express + Vite with hot reload, http://localhost:3000
npm run preview:cf   # the built site on Cloudflare's runtime (wrangler dev), http://localhost:8787
```

`preview:cf` serves exactly what's deployed, including 404s, `_headers` and the form. To test the form locally,
create `.dev.vars` (git-ignored) with `CONTACT_TO=test@example.com`. Emails aren't sent; wrangler saves each one
as an `.eml` file under `.wrangler/tmp/` and prints the path.

## The old Netlify site

`spacekidlabs.netlify.app` still exists and still serves the last version Netlify built. It's no longer linked
from anywhere, and its pages point search engines at spacekidlabs.com. It can be deleted in the Netlify dashboard
(**Project configuration → Delete project**) once search results show the new domain.
