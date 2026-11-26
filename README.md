# SPACEKID LABS

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
| `npm run build` | Builds the frontend into `dist/` and bundles the server into `dist/server.cjs` |
| `npm start` | Runs the production build (set `NODE_ENV=production`) |
| `npm run lint` | Type-checks the project with `tsc` |
| `npm run clean` | Deletes build output |

## How it's put together

```
src/
  pages/        One file per route
  components/   Layout, navigation and the interactive audio labs
  data/         Sample pack metadata
  lib/          Shared helpers
public/         Static images
server.ts       Express server: serves the app and proxies audio
```

**Audio proxy.** Sample previews are stored on Google Drive. `server.ts` exposes `GET /api/proxy-audio?id=<driveId>`, which streams the file from Drive with range support so the browser can play and seek it.

**Helper scripts.** `fetch-names.ts` rebuilds the sample list from Drive file IDs, and `download-img-2.ts` fetches the sample-pack cover art into `public/`. Run either with `npx tsx <file>`.

## Environment variables

Copy `.env.example` to `.env.local` if you need them. The site itself doesn't currently require any keys; `GEMINI_API_KEY` and `APP_URL` are left over from the Google AI Studio template the project started from.

## Deploying

```bash
npm run build
NODE_ENV=production npm start
```

The server listens on port 3000.
