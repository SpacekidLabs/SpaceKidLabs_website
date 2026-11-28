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

**spacekidlabs.com/dev** (linked only as a small **DEV** in the footer, and in the top bar on the local dev server) is a password-protected dashboard for all
your GitHub projects, and for adding sketches, samples and archive posts to the website, from any browser, including
a phone. The open tab and project are in the address (e.g. `/dev#projects/xen`, `/dev#issues/data-bend`), so the back
button and bookmarks work.

How it works: the browser converts audio to MP3 and works out the duration and waveform itself, then sends it to the
Worker (`worker/dev.ts`). The Worker commits the change to `main` on GitHub through the GitHub API, and that push
deploys the site like any other, so a new item is live about 2 minutes after saving. Every save is a normal commit
("Added from the /dev dashboard"), so anything can be undone with `git revert`.

| Group | Tab | What it does |
| --- | --- | --- |
| Lab | Launchpad | the first screen: a capture box (type and press Enter, paste a link or screenshot, drop audio or any file, record a voice memo) and the **private idea inbox**. Each idea can become a GitHub issue, a sketch (a demo with the audio if it has an MP3) or an archive post (opens the Archive tab filled in), or go in the bin. Press **N** on any tab to jump to the box. Above it: your **streak** and nudges; below it: a year **heatmap** of what you shipped (see Momentum below). Ideas are stored in Cloudflare D1, not in the repo (see below) |
| Lab | Ship | **Tell people:** every public ship (sketch, samples, post, release) gets a promo checklist of your channels by itself; tick each one off, or mark "No promo needed". **Releases:** every repository with releases, its latest version, days since, and downloads per release and per file; open one for a changelog draft (issues closed as done and pull requests merged since the last release) to copy, or to open GitHub's new-release page with the next version and the notes filled in (`worker/ship.ts`) |
| All projects | Projects | every repository you own, grouped by kind (plugins & instruments, apps & tools, research, websites) with search and public/private filters. Open one for its pushes per week, recent commits, issues, pull requests, releases and Actions runs (`worker/stats.ts`). Reads only |
| All projects | Issues | GitHub issues of one project or all of them: list, create, edit title/text/labels, comment, close (done or not planned), reopen (`worker/issues.ts`). Changes issues, not files |
| Website | Overview | Cloudflare traffic (`worker/analytics.ts`), plays and downloads (`worker/events.ts`), live version vs main, counts of sketches, samples and posts, DATABEND downloads, and the website repo's GitHub activity. Reads only |
| Website | Sketches | add, edit (all fields; replace or remove audio) and delete. `src/data/sketches.json`, demo audio in `public/audio/sketches/` (a replaced file gets a new name, since browsers cache /audio for a week) |
| Website | Samples | add (rows appended to `src/data/samples.ts`, MP3 previews in `public/audio/`; originals stay on your computer), and edit: rename, change category or pack, set the Drive file ID (download button), delete with the preview |
| Website | Archive | list, write, edit and delete posts (`src/posts/<slug>.tsx`). Title, date, tags, order, colour, summary and highlight can be changed on any post; the text only on posts written in the dashboard (they keep their plain text in a comment at the end of the file). Hand-written posts with labs are code: change their text in the code. The URL (slug) never changes |

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

### Idea inbox (Launchpad)

Ideas are private, so they are **not** committed to this repo (everything in it is public). They live in a Cloudflare
**D1** database, `spacekidlabs-ideas` (binding `IDEAS_DB` in `wrangler.jsonc`), code in `worker/ideas.ts`:

- `wrangler.jsonc` has no `database_id`: the first `wrangler deploy` (the Workers Build after a push) creates the
  database, and the Worker creates its tables the first time it's used. If a build ever fails with a D1 permission
  error, create the database by hand (**Storage & databases → D1 → Create**, name `spacekidlabs-ideas`) and add its
  ID as `"database_id"` in `wrangler.jsonc`.
- Files are kept in the database in 1.9 MB pieces (a D1 row holds at most 2 MB), up to 25 MB per file. Audio is
  converted to MP3 in the browser first, if the browser can read it. Free plan: 5 GB of storage.
- Files are only served to the logged-in dashboard. Anything that isn't audio or a plain image downloads instead of
  opening, so an uploaded HTML or SVG file can't run on the site.
- **Bin** keeps an idea (Binned filter); **Delete forever** removes it and its files. To look at the data directly:
  **Storage & databases → D1 → spacekidlabs-ideas → Console**.
- Locally (`npm run preview:cf`) wrangler uses a separate local database under `.wrangler/`, never the live one.

### Momentum (Launchpad)

`GET /api/dev/momentum` (`worker/momentum.ts`) lists everything shipped in the last 53 weeks as dated events. What
counts: **promo ticked off** on the Ship tab, **anything public** (commits that add to `src/data/sketches.json`, `src/data/samples.ts` or `src/posts/`;
removals and edits don't count) and **releases** in any of your repositories, **issues closed as done** in any
repository, and **ideas captured**. It's one GitHub GraphQL query with the projects token (the first 100 of each kind
a year) plus the D1 inbox; without a token only ideas count.

- **Streak:** days in a row with at least one event, in your browser's time zone. It stays alive until midnight, so
  a streak that hasn't been fed today still shows, with a "not yet today" nudge.
- **Nudges** (above the capture box): the streak ending tonight, nothing public for 7+ days, and open issues untouched
  for 21+ days (the two oldest, with a link to the rest).
- **Promo** (Ship tab): checklists are made from the public events above, for ships since the first time the
  momentum endpoint ran (a week back from then, kept in the D1 `settings` table as `promo_since`). Only ticks are
  stored (D1 `promo_ticks`, keyed by the ship's GitHub URL). Channels default to Instagram, YouTube, Newsletter and
  Bandcamp; change them under the list. The Launchpad nudges about the newest ship whose promo isn't done.
- When something you do makes today count for the first time, a random hit from your **VRAC** snares, claps and perc
  plays. The speaker button turns it off (remembered in this browser).

To try the dashboard locally: `npm run preview:cf` with `DEV_PASSWORD` (and a `GITHUB_TOKEN` if you want saves to
really commit) in `.dev.vars`. Saving from there commits to the real `main`.

## Plays and downloads (#19)

The site counts sample plays and downloads, full-pack downloads, DATABEND downloads, labs started and contact
messages sent. The page calls `track()` (`src/lib/track.ts`), which sends `POST /api/event` with `sendBeacon`;
`worker/events.ts` checks it came from the site's own pages, drops bots, and writes one data point to **Workers
Analytics Engine** (the `EVENTS` binding, dataset `spacekidlabs_events`, in `wrangler.jsonc`). A point holds the
event name and which thing (sample, pack, lab or file), nothing about the visitor. The contact form is counted by the
Worker after the email is sent. Nothing is counted from `npm run dev`.

Reading uses Analytics Engine's SQL API with the same `CF_API_TOKEN` as the traffic numbers (Account Analytics:
Read covers it). Cloudflare keeps the points for 3 months; the dashboard shows the last 7 or 30 days. Free plan:
100,000 points a day. If you add an event, add it to `EVENTS` in `worker/events.ts` and to `src/pages/Privacy.tsx`.

## MCP connector (/mcp)

**https://spacekidlabs.com/mcp** gives Claude (or any MCP client) the dashboard as tools. It runs in the same Worker,
on the free plan, with no extra secrets.

| Tool | Does |
| --- | --- |
| `list_projects`, `project_activity` | your repositories; one project's pushes, commits, issues, PRs, Actions, releases |
| `list_issues`, `get_issue` | issues of one project or all of them; one issue with comments |
| `create_issue`, `update_issue`, `comment_on_issue` | open, edit, label, close/reopen, comment |
| `site_traffic` | Cloudflare analytics for the site (7 or 30 days), plus plays and downloads |
| `list_sketches`, `add_sketch`, `update_sketch`, `delete_sketch` | the Sketches page (ideas and demo placeholders; new audio still goes through /dev) |
| `list_posts`, `get_post`, `publish_archive_post`, `update_post`, `delete_post` | archive posts, with the same limits as /dev |
| `list_samples`, `update_samples`, `delete_samples` | samples: rename, category, pack, Drive ID, delete |
| `capture_idea`, `list_ideas`, `promote_idea` | the private idea inbox: save an idea ("save idea: …"), list them, turn one into an issue or a sketch |

**Connecting.** In Claude: **Settings → Connectors → Add custom connector**, URL `https://spacekidlabs.com/mcp`. Claude
opens a spacekidlabs.com page that shows which app is asking; enter the /dev password there. In Claude Code:
`claude mcp add --transport http spacekidlabs https://spacekidlabs.com/mcp`, then `/mcp` to sign in.

**How it's secured.** OAuth 2.1 with PKCE (Cloudflare's `@cloudflare/workers-oauth-provider`, `worker/oauth.ts`): apps
register themselves, you approve each one with the dashboard password, and they get an access token that lasts an
hour and refreshes itself. A connection unused for 30 days ends (90 days at most); then sign in again. Registered
apps and grants live in the KV namespace **spacekidlabs-mcp-oauth** (binding `OAUTH_KV`), tokens only as hashes.
Changing `DEV_PASSWORD` doesn't end existing connections: to cut them all, delete the keys in that KV namespace
(Storage & databases → Workers KV) or remove the connector in Claude. The GitHub and Cloudflare tokens never leave
the Worker. Tools act only on repositories under the owner of `GITHUB_REPO`.

**Code.** `worker/mcp.ts` (tools; stateless Streamable HTTP, one server per request), `worker/oauth.ts` (the sign-in
page), `worker/index.ts` (routing). The paths the Worker handles are listed in `run_worker_first` in `wrangler.jsonc`.

**Testing locally.** `npx wrangler dev --local-upstream localhost:8788 --port 8788` with `SITE_ORIGIN=http://localhost:8788`
in `.dev.vars` (OAuth accepts plain http only on localhost).

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

## The web apps (subdomains)

Each web app has its own GitHub repo and its own Cloudflare Worker, set up the same way as this site: Workers
Builds is connected to the repo, every push to `main` deploys, and the subdomain comes from `routes` in that
repo's `wrangler.jsonc` (`custom_domain: true` creates the DNS record and HTTPS certificate on deploy).

| App | Address | Repo | Worker |
| --- | --- | --- | --- |
| DATABEND online | https://databend.spacekidlabs.com | [data-bend](https://github.com/SpacekidLabs/data-bend) | `databend` |
| Noise Forge | https://noiseforge.spacekidlabs.com | [noise-forge](https://github.com/SpacekidLabs/noise-forge) | `noise-forge` |
| DataPaint | https://datapaint.spacekidlabs.com | [datapaint](https://github.com/SpacekidLabs/datapaint) | `datapaint` |
| Spectral Rotator FX | https://spectralrotator.spacekidlabs.com | [spectral-rotator](https://github.com/SpacekidLabs/spectral-rotator) | `spectral-rotator` |

- **DATABEND online** is built from the desktop app's own files: Workers Builds runs `npm run build:web`, which
  copies the UI files listed in `package.json` `build.files` (minus the Electron-only ones) into `web-dist/`.
  Build variable `ELECTRON_SKIP_BINARY_DOWNLOAD=1` keeps `npm ci` from downloading Electron. A push to `main`
  updates the online version; a version tag also builds the desktop release (see the data-bend README), which
  this site's download page reads on its next build.
- **Noise Forge, DataPaint and Spectral Rotator** repos hold the built apps as they were on Netlify (`site/`,
  minified); the original source wasn't available. Build command: none.

They were on `*.netlify.app` until November 2026. Those Netlify sites (noiseforge, datapaint, spectralrotatorfx,
databenddaw) were deleted on 2026-11-28, so the old addresses no longer work; nothing links to them.

## The old Netlify site

`spacekidlabs.netlify.app` still exists and still serves the last version Netlify built. It's no longer linked
from anywhere, and its pages point search engines at spacekidlabs.com. It can be deleted in the Netlify dashboard
(**Project configuration → Delete project**) once search results show the new domain.
