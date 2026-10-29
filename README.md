# Motionly

A motion graphics video generator built with Next.js, Remotion, MongoDB, and Tailwind CSS. Upload 1–10 images, write Bangla or English copy, preview live in the browser, then render and download an MP4. Videos and source images are temporary and removed after download.

## Features

- Live Remotion `<Player>` preview using browser object URLs. Nothing uploads until **Generate**.
- Five code-based styles: Minimal, Kinetic Typography, Fashion Luxury, Social Promo, Corporate.
- Bangla-ready fonts through `@remotion/google-fonts`: Noto Sans Bengali, Hind Siliguri, Inter.
- Aspect ratios: 9:16, 1:1, 16:9. Durations from 5 to 30 seconds at 30 fps.
- Server rendering with `@remotion/bundler` and `@remotion/renderer`, capped at two concurrent renders.
- `sharp` resizing before render, data-URL image props for the renderer, temp folders under the OS temp directory.
- Optional email/password accounts with signed HTTP-only session cookies.
- Free-tier limits, watermarks, per-IP rate limits, and automatic cleanup.
- MongoDB stores only `users` and short-lived `render_jobs` (TTL index, one hour).

## Requirements

- Node.js 20+
- A Chromium/Chrome binary. On Windows, Chrome or Edge is detected automatically. On other platforms, install Chrome or let Remotion download its headless shell on first render.
- Internet access when the renderer loads Google Fonts.
- MongoDB if you want accounts. Guest rendering works without it (jobs are kept in memory).

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The editor is at `/editor`.

### Environment

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string. Required for accounts and persistent job status. |
| `MONGODB_DB` | Database name, defaults to `motionly`. |
| `AUTH_SECRET` | Secret used to sign session cookies. Set this in production. |
| `REMOTION_BROWSER_EXECUTABLE` | Optional path to Chrome/Chromium for rendering. |
| `RENDER_CONCURRENCY` | Concurrent render limit, defaults to `2`. |

## Scripts

```bash
npm run dev        # Next.js dev server
npm run build      # production build
npm run start      # production server
npm run lint       # ESLint
npm run typecheck  # TypeScript, no emit
```

## Flow

1. `/editor` keeps images in memory as `blob:` URLs and previews the selected Remotion composition.
2. `POST /api/render` validates the upload, resizes images with `sharp`, writes them to `<tmp>/vidgen/<jobId>/`, creates a `render_jobs` document, and schedules the render after responding.
3. The renderer bundles Remotion once, selects the composition, and writes `out.mp4` into the job folder.
4. The browser polls `GET /api/render/[id]/status`.
5. `GET /api/render/[id]/download` streams the MP4 and deletes the job folder when the stream closes.
6. A background sweeper removes any job folder older than 30 minutes. MongoDB TTL removes job documents after one hour.

## Limits

- Guests: three free renders per month per IP, watermark included.
- Free accounts: three renders per month, watermark included.
- Pro accounts: 100 renders per month, no watermark.
- `/api/render` is rate limited per IP and per user.

## Deployment

Rendering needs a real server with Chromium and ffmpeg. Do not deploy the renderer to serverless functions such as Vercel Functions. Use a VPS or a Docker worker with a persistent filesystem for the temp folder, and point `MONGODB_URI` at MongoDB Atlas or another persistent MongoDB instance.

Remotion has commercial licensing terms for companies. Check them before launch.

## Project structure

```
app/(marketing)/page.tsx                  landing page
app/editor/page.tsx                       editor + live preview
app/login/page.tsx                        accounts
app/api/render/route.ts                   upload, validate, start render
app/api/render/[id]/status/route.ts       job status
app/api/render/[id]/download/route.ts     stream MP4, delete files
app/api/auth/*                            signup, login, logout, session
remotion/Root.tsx                         composition registry
remotion/compositions/*                   five styles
remotion/components/*                     AnimatedText, KenBurns, Transition, Watermark
lib/*                                     db, jobs, temp files, limiter, auth, usage
```
