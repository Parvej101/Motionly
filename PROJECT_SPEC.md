# Motion Graphics Video Generator: Project Spec

> This file is the single source of truth for the AI agent building this project. Read it fully before writing any code. Follow the rules in "Hard Constraints" strictly.

## 1. Product Summary

A web app where a user:

1. Uploads 1 to 10 images
2. Enters text (headline, subtitle, CTA, brand name)
3. Picks a style (Minimal, Kinetic Typography, Fashion Luxury, Social Promo, Corporate)
4. Sees a live preview in the browser
5. Clicks **Generate**, the server renders an MP4, and the user **downloads it immediately**

**Videos are never stored permanently.** The user generates, downloads, and the server deletes everything. Because of this, database usage must stay minimal.

## 2. Hard Constraints (do not violate)

1. **No permanent storage of videos or user images.** Only temporary files, deleted right after download or after a short TTL (max 30 minutes).
2. **Minimal MongoDB usage.** Store only what is truly needed (see Section 6). Do not create collections for projects, videos, assets, or templates.
3. **Preview runs fully in the browser** (Remotion Player with object URLs). Nothing is uploaded until the user clicks Generate.
4. **Styles are code, not data.** Each style is a Remotion React component in the repo, not a DB record.
5. **Use TypeScript everywhere.**
6. **Support Bangla text.** Use Noto Sans Bengali or Hind Siliguri via `@remotion/google-fonts`, and verify rendering.

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS |
| Video engine | Remotion (`remotion`, `@remotion/player`, `@remotion/renderer`, `@remotion/bundler`) |
| Database | MongoDB (official `mongodb` driver or Mongoose) |
| Auth | Auth.js (NextAuth) with MongoDB adapter, or a simple JWT session |
| Image processing | `sharp` (resize/compress before render) |
| Temp storage | Local `/tmp/vidgen/<jobId>/` on the render server |
| Queue (optional, later) | BullMQ + Redis. For MVP use an in-process limiter (max 2 concurrent renders) |
| Payments (later) | SSLCommerz / bKash (BD), Stripe (international) |

## 4. User Flow

1. **Editor page** (`/editor`): user picks images (kept in browser memory as `blob:` URLs), fills text, selects style, brand color, aspect ratio (9:16, 1:1, 16:9), duration.
2. **Live preview** via `<Player>` from `@remotion/player` using the same composition as the server.
3. **Generate click**:
   - Browser sends `multipart/form-data` (images + JSON props) to `POST /api/render`.
   - Server saves images to `/tmp/vidgen/<jobId>/`, resizes with `sharp`.
   - Server creates a job record in MongoDB (status `queued`, with TTL).
   - Server renders the MP4 to `/tmp/vidgen/<jobId>/out.mp4`.
4. **Status**: browser polls `GET /api/render/[id]/status` until `done`.
5. **Download**: `GET /api/render/[id]/download` streams the MP4. After the stream ends, the server deletes the whole job folder and marks the job `downloaded`.
6. **Cleanup safety net**: a cron or `setInterval` sweeper deletes any folder in `/tmp/vidgen/` older than 30 minutes.

## 5. Folder Structure

```
/app
  /(marketing)/page.tsx          landing page
  /editor/page.tsx               editor UI + Remotion Player
  /api
    /render/route.ts             POST: accept upload, start render
    /render/[id]/status/route.ts GET: job status
    /render/[id]/download/route.ts GET: stream MP4, then delete
/remotion
  Root.tsx                       registers all compositions
  /compositions
    MinimalStyle.tsx
    KineticStyle.tsx
    FashionLuxuryStyle.tsx
    SocialPromoStyle.tsx
    CorporateStyle.tsx
  /components
    AnimatedText.tsx
    KenBurns.tsx
    Transition.tsx
  types.ts                       VideoProps
/lib
  db.ts                          MongoDB connection (cached)
  render.ts                      renderMedia wrapper
  tempfiles.ts                   create/delete/sweep temp folders
  limiter.ts                     concurrency limiter
  auth.ts
```

## 6. MongoDB: Minimal Schema

Only **two or three** collections. Keep documents tiny.

### `users`
```ts
{
  _id: ObjectId,
  email: string,           // unique index
  name?: string,
  passwordHash?: string,   // if credentials auth
  plan: "free" | "pro",    // default "free"
  rendersUsedThisMonth: number,
  monthKey: string,        // e.g. "2026-10", reset counter when it changes
  createdAt: Date
}
```

### `render_jobs` (temporary, auto-deleted)
```ts
{
  _id: ObjectId,           // used as jobId
  userId?: ObjectId,       // optional for guest renders
  status: "queued" | "rendering" | "done" | "failed" | "downloaded",
  styleId: string,         // e.g. "kinetic"
  aspectRatio: "9:16" | "1:1" | "16:9",
  error?: string,
  createdAt: Date          // TTL index on this field
}
```

**Required index:**
```ts
db.render_jobs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // auto-delete after 1 hour
db.users.createIndex({ email: 1 }, { unique: true });
```

Do **not** store: video files, image files, text content, props, or render history. The job record exists only so status polling works across server instances, and it disappears automatically.

### Optional (later): `payments`
Only if payments are added. One small document per transaction.

## 7. Remotion Contract

All compositions share one props type:

```ts
export type VideoProps = {
  images: string[];          // blob URLs in preview, file paths/URLs in render
  headline: string;
  subtitle?: string;
  cta?: string;
  brandName?: string;
  brandColor: string;        // hex
  fontFamily: "NotoSansBengali" | "HindSiliguri" | "Inter";
  aspectRatio: "9:16" | "1:1" | "16:9";
  durationInSeconds: number; // 5 to 30
  musicTrack?: string;       // optional bundled track id
};
```

Rules:
- 30 fps. Dimensions: 9:16 = 1080x1920, 1:1 = 1080x1080, 16:9 = 1920x1080.
- Each style must handle 1 to 10 images and divide time evenly across them.
- Use `spring()` / `interpolate()` for animation. No CSS transitions or `setTimeout`.
- Every style must look correct with Bangla and English text.

## 8. Rendering Details

- Bundle once at server start (`bundle()` from `@remotion/bundler`), cache the bundle path.
- Per job: `selectComposition` then `renderMedia` with `codec: "h264"`, `outputLocation` inside the job's temp folder.
- Serve images to the renderer via file paths or a temporary local route, not public URLs.
- Limit concurrency to 2 for MVP. Return a "busy, try again" or queue position if exceeded.
- Wrap in try/catch: on failure, set status `failed` and delete the temp folder.

## 9. API Reference

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/render` | Accept images + props, create job, start render, return `{ jobId }` |
| GET | `/api/render/[id]/status` | Return `{ status, error? }` |
| GET | `/api/render/[id]/download` | Stream MP4 with `Content-Disposition: attachment`, then delete files |

Validation: max 10 images, max 5 MB each, allowed types `jpeg/png/webp`, headline max 80 chars.

## 10. Free Tier and Abuse Control

- Free plan: 3 renders per month, watermark added in the composition.
- Pro plan: no watermark, higher limits.
- Rate limit `/api/render` per IP and per user.
- Track usage with `users.rendersUsedThisMonth` only (no history).

## 11. Deployment Notes

- Rendering needs a real server with Chromium and ffmpeg, so use a VPS or Docker container. Next.js on Vercel serverless is **not** suitable for rendering. Either self-host everything on a VPS, or host UI on Vercel and render on a separate Docker worker.
- Use a persistent MongoDB (Atlas free/shared tier is enough because usage is tiny).
- Remotion has a commercial license for companies. Check before launch.

## 12. Build Order for the Agent

**Phase 1 (preview only)**
1. Init Next.js + TypeScript + Tailwind.
2. Install Remotion and set up `/remotion` with `Root.tsx`.
3. Build 2 styles: `MinimalStyle`, `KineticStyle`.
4. Build editor UI with image picker, text fields, style select, and `<Player>` preview.

**Phase 2 (server render and download)**
5. Add `/lib/db.ts` and `render_jobs` collection with TTL index.
6. Implement `POST /api/render`, temp folder handling, `sharp` resize.
7. Implement `renderMedia` with concurrency limiter.
8. Implement status and download routes with cleanup after stream.
9. Add the temp-folder sweeper.

**Phase 3 (accounts and limits)**
10. Auth, `users` collection, monthly render counter, watermark logic.

**Phase 4 (growth)**
11. More styles (Fashion Luxury, Social Promo, Corporate), music tracks, payments, queue with BullMQ.

## 13. Definition of Done (MVP)

- User can upload images, enter Bangla or English text, pick a style, and see a live preview.
- Clicking Generate produces an MP4 and downloads it.
- After download, no video or image remains on the server, and the job document expires from MongoDB automatically.
- MongoDB contains only `users` and short-lived `render_jobs`.
