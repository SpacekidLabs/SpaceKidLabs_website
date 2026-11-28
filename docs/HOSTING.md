# Hosting: Cloudflare

spacekidlabs.com runs on **Cloudflare Workers** (free plan): Cloudflare serves the pre-rendered site from `dist/`,
and a small Worker (`worker/index.ts`) handles the contact form. DNS and email forwarding for the domain are on
Cloudflare too. The domain itself is registered at **GoDaddy**.

Moved from Netlify in November 2026, because Netlify's free plan allows only about 20 production deploys a month
(300 credits, 15 per deploy). Cloudflare's free plan has no deploy limit that this site gets near: Workers Builds
allows 3,000 build minutes a month and a build takes about a minute.

## How a deploy works

Every push to `main` deploys automatically (Cloudflare **Workers Builds**, connected to this GitHub repo; Worker name
`spacekidlabs`, also at https://spacekidlabs.spacekid700.workers.dev):

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
| `worker/index.ts` | The Worker: `POST /api/contact` emails the message, `/api/dev/*` is the dev dashboard (`worker/dev.ts`). Every other URL is a static file and never runs the Worker |
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

## Dev dashboard (/dev)

**spacekidlabs.com/dev** (linked only as a small **DEV** in the footer) is a password-protected dashboard for all
your GitHub projects, and for adding sketches, samples and archive posts to the website, from any browser, including
a phone. The open tab and project are in the address (e.g. `/dev#projects/xen`, `/dev#issues/data-bend`), so the back
button and bookmarks work.

How it works: the browser converts audio to MP3 and works out the duration and waveform itself, then sends it to the
Worker (`worker/dev.ts`). The Worker commits the change to `main` on GitHub through the GitHub API, and that push
deploys the site like any other, so a new item is live about 2 minutes after saving. Every save is a normal commit
("Added from the /dev dashboard"), so anything can be undone with `git revert`.

| Group | Tab | What it does |
| --- | --- | --- |
| All projects | Projects | every repository you own, grouped by kind (plugins & instruments, apps & tools, research, websites) with search and public/private filters. Open one for its pushes per week, recent commits, issues, pull requests, releases and Actions runs (`worker/stats.ts`). Reads only |
| All projects | Issues | GitHub issues of one project or all of them: list, create, edit title/text/labels, comment, close (done or not planned), reopen (`worker/issues.ts`). Changes issues, not files |
| Website | Overview | Cloudflare traffic (`worker/analytics.ts`), live version vs main, counts of sketches, samples and posts, DATABEND downloads, and the website repo's GitHub activity. Reads only |
| Website | Sketches | `src/data/sketches.json`, demo audio in `public/audio/sketches/`. Deleting a sketch removes both |
| Website | Samples | rows appended to `src/data/samples.ts`, MP3 previews in `public/audio/`. Originals stay on your computer; add Drive IDs later for download buttons |
| Website | Archive post | `src/posts/<slug>.tsx` from plain text (paragraphs, `## headings`, `- lists`, `[links](https://...)`, `**bold**`). Labs and images still need code |

**Pull before working locally.** The dashboard commits straight to GitHub, so run `git pull` before editing in this
folder, or your next push will be rejected until you do.

### Setup (once)

The dashboard needs two **secrets**, plus two optional ones. They live only in Cloudflare: never put them in this repo, in `wrangler.jsonc`
or in chat. The Worker never sends them back in a response or writes them to its logs.

1. **GitHub token (website).** github.com → Settings → Developer settings → **Fine-grained personal access tokens →
   Generate new token**. Resource owner: **SpacekidLabs**. Repository access: **Only select repositories →
   SpaceKidLabs_website**. Permissions: **Contents → Read and write**. Pick an expiry (e.g. 1 year) and copy the
   token. This is the only token that can change files, and only in the website repository.
2. **Add both secrets.** Cloudflare dashboard → **Workers & Pages → spacekidlabs → Settings → Variables and Secrets →
   Add**, type **Secret**:
   - `GITHUB_TOKEN`: the token from step 1.
   - `DEV_PASSWORD`: a long password for the dashboard (a passphrase of 4+ random words is good).

   Or from this folder: `npx wrangler secret put GITHUB_TOKEN` and `npx wrangler secret put DEV_PASSWORD`, which ask
   for the value without echoing it.
3. Open spacekidlabs.com/dev and log in.
4. **Projects token (for the Projects and Issues tabs).** A second fine-grained token, so the one that can write
   files stays limited to the website. Name it `spacekidlabs-dev-projects`. Repository access: **All repositories**.
   Permissions: **Issues → Read and write**, and **Contents**, **Pull requests**, **Actions** as **Read-only**. It
   can't change any code. Add it as the secret `GITHUB_PROJECTS_TOKEN` (same place as step 2). Without it the
   dashboard uses `GITHUB_TOKEN`, which only sees the website and your public repositories. Editing a token's
   permissions later keeps the same token, so the secret doesn't change.
5. **Traffic numbers (optional).** Cloudflare dashboard → **My Profile → API Tokens → Create Token → Create Custom
   Token**. Name it `spacekidlabs-dev-analytics`. Permissions: **Zone → Analytics → Read** and **Account → Account
   Analytics → Read**. Zone Resources: **Include → Specific zone → spacekidlabs.com**. Account Resources: your account.
   Create it, then add it to the Worker as the secret `CF_API_TOKEN` (same place as step 2). It can only read
   statistics. `CF_ZONE_ID` and `CF_ACCOUNT_ID` are plain variables in `wrangler.jsonc`: they identify the site and
   account but can't be used without a token.

`GITHUB_REPO` (which repository it commits to) is a plain variable in `wrangler.jsonc`.

**Add or change secrets only when no deploy is running.** "Add variable and deploy" in the dashboard makes a new
version from whichever version was live when the settings page opened. If a push was still deploying then, the
secret goes live on the older code and the new code is rolled back until the next push. If that happens, push again
(or re-run the latest build under **Deployments**): builds keep all existing secrets.

**Security notes.** Login sets an HttpOnly, Secure, SameSite=Strict cookie that lasts 30 days and is signed with
`DEV_PASSWORD`: changing the password logs out every device. Wrong passwords are slowed down. Requests from other
sites are refused. If the token leaks, revoke it on GitHub and create a new one. It can only touch this one
repository's files.

To try the dashboard locally: `npm run preview:cf` with `DEV_PASSWORD` (and a `GITHUB_TOKEN` if you want saves to
really commit) in `.dev.vars`. Saving from there commits to the real `main`.

## Email on the domain

Email Routing also forwards **hello@spacekidlabs.com** to the same Gmail inbox
(**spacekidlabs.com → Email → Email Routing → Routing rules**). It only receives; to send from that address, set
up Gmail's "Send mail as" with an SMTP service, or use a paid mailbox.

## Domain and DNS

- **Registrar:** GoDaddy (renewals and the nameserver setting are there).
- **Nameservers:** GoDaddy points the domain at Cloudflare: `craig.ns.cloudflare.com` and `kimora.ns.cloudflare.com`
  (GoDaddy → spacekidlabs.com → DNS → Nameservers). Change DNS records in Cloudflare, not GoDaddy.
- **Records:**
  - `spacekidlabs.com` is the Worker's custom domain (Cloudflare creates and manages this record).
  - `www` is a proxied CNAME. A redirect rule (**Rules → Redirect Rules → "Redirect from WWW to root"**) sends
    `https://www.spacekidlabs.com/*` to `https://spacekidlabs.com/*` (301, keeps the query string) before the
    request goes anywhere, so the CNAME's target doesn't matter.
  - MX, SPF and DKIM records for Email Routing (added by Cloudflare when Email Routing was turned on).
  - `_dmarc` TXT, carried over from GoDaddy.
- **HTTPS:** automatic (Cloudflare Universal SSL). **Always Use HTTPS** is on (**SSL/TLS → Edge Certificates**), so
  `http://` redirects to `https://`.

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
