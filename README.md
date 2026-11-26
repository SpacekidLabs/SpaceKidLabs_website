# SPACEKID LABS

[![CI](https://github.com/SpacekidLabs/SpaceKidLabs_website/actions/workflows/ci.yml/badge.svg)](https://github.com/SpacekidLabs/SpaceKidLabs_website/actions/workflows/ci.yml)

The website of SPACEKID: experimental audio research, music production and interactive DSP experiments.

It's a React + Vite single-page app served by a small Express server. Many pages have interactive audio demos (wavesets, databending, granular resonators, microtonal tuning, psychoacoustics and more) that run in the browser with the Web Audio API.

## Pages

| Route | What's there |
| --- | --- |
| `/` | Landing page with projects and releases |
| `/archive` | Research archive; each post (`/archive/:slug`) has its own interactive lab |
| `/waveset-quantizer` | Waveset Quantizer tool |
| `/samples` | Sample pack browser with audio previews |
| `/download` | Downloads |
| `/services` | Services |

## Getting started

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm install
npm run dev
```

The site runs at http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the Express server with Vite middleware (hot reload) |
| `npm run build:site` | Builds the site into `dist/`, pre-renders every page, and generates `sitemap.xml` and `robots.txt` (this is what Netlify runs) |
| `npm run build` | Same as `build:site`, plus bundles the Node server into `dist/server.cjs` |
| `npm start` | Runs the production build (set `NODE_ENV=production`) |
| `npm run lint` | Type-checks the project with `tsc` (also runs on GitHub for every push and pull request) |
| `npm run clean` | Deletes build output |
| `npm run favicons` | Downloads icons for new links in the Resources post into `public/favicons/` (add `-- --force` to refetch all) |

## How it's put together

```
src/
  pages/        One file per route
  components/   Layout, navigation and the interactive audio labs
  posts/        One file per archive post (see "Adding an archive post")
  data/         Sample pack metadata
  lib/          Shared helpers (including per-page tab titles)
public/         Favicon, touch icon, link-preview image and sample previews (audio/)
scripts/        One-off helper scripts
server.ts       Express server for local development and self-hosting
```

**Sample previews.** The samples page plays compressed MP3 previews served by the site itself from `public/audio/`. The original WAVs stay on Google Drive, and the per-sample and full-pack download buttons link there. After adding or replacing samples in `src/data/samples.ts`, run `npx tsx scripts/make-sample-previews.ts` (needs `ffmpeg`): it downloads the originals, encodes the previews and fills in each sample's duration.

**Pre-rendering.** After the normal build, `scripts/prerender.ts` renders every page and archive post to static HTML (`dist/<path>.html`) with its own title, description and link-preview tags, so shared links and search engines see real content. In the browser, React takes over that HTML instead of redrawing it (`src/main.tsx`). Page descriptions live in `scripts/site.ts`; a post's description defaults to its first paragraph, or set `description` in its `meta`. Anything shown during the first render must look the same every time: use `seededRandom` (`src/lib/seededRandom.ts`) instead of `Math.random` for decorative randomness.

**Helper scripts.** `scripts/fetch-names.ts` rebuilds the sample list from Drive file IDs (then run `make-sample-previews.ts`), and `scripts/download-cover-art.ts` downloads the sample-pack cover art into `public/`. Run either with `npx tsx scripts/<file>`.

## Adding an archive post

Each post is one file in `src/posts/`, named after its URL: `src/posts/my-post.tsx` appears at `/archive/my-post`. New files are picked up automatically.

```tsx
import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "My Post",
  slug: "my-post",          // must match the file name
  date: "2026-12-01",
  tags: ["DSP", "TOOLS"],
  index: 27,                // higher numbers are listed first
  accentColor: "#ff8c00",   // optional
};

export default function Post() {
  return (
    <>
      <p>Post content…</p>
    </>
  );
}
```

To embed an interactive lab so it only downloads when the post is opened:

```tsx
import { lazyLab } from '../lib/lazyNamed';
const GranularResonatorLab = lazyLab(() => import('../components/GranularResonatorLab'), 'GranularResonatorLab');
```

### Resources post links

The links in **Curated Resources & Bookmarks** live in `src/data/resources.ts`. After adding one, run `npm run favicons` and commit the new file in `public/favicons/` plus `src/data/favicons.json`. Icons are served from this site, so visitors' browsers never contact the linked sites until they click. A site with no usable icon gets its first letter instead.

## Deploying

**Netlify (live site).** The site deploys to Netlify from this GitHub repo on every push to `main`. `netlify.toml` builds the frontend into `dist/` and sends every route to the React app.

**Your own Node server.**

```bash
npm run build
NODE_ENV=production npm start
```

The server listens on port 3000.
