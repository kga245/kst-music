# kst-music

Making AI-generated music and sample creation more accessible, less mystifying, and more fun for producers.

## Stack

- **Next.js 16** (App Router, TypeScript strict)
- **Vercel** (Fluid Compute — full Node.js runtime)
- **Tailwind CSS 4**
- **shadcn/ui** (to be added)
- **AI SDK + Vercel AI Gateway** (to be added — model routing, provider fallbacks)
- **Supabase** (to be added — auth + Postgres)
- **Vercel Blob** (to be added — audio file storage)

## Local development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The placeholder API route [http://localhost:3000/api/hello](http://localhost:3000/api/hello) returns a JSON payload — use it to confirm the deploy pipeline end-to-end.

## Scripts

| Script       | What it does                       |
| ------------ | ---------------------------------- |
| `pnpm dev`   | Start Next.js dev server (Turbopack) |
| `pnpm build` | Production build                   |
| `pnpm start` | Serve the production build locally |
| `pnpm lint`  | Run ESLint                         |

## Deployment

- `main` → Vercel production
- Every PR → Vercel preview URL
- Runtime: Fluid Compute (Node.js). Do not use the deprecated Edge Runtime unless there's a specific reason.

## Environment variables

Copy `.env.example` → `.env.local` and fill in:

| Var                     | Required | What it's for                                                    |
| ----------------------- | -------- | ---------------------------------------------------------------- |
| `REPLICATE_API_TOKEN`   | yes      | Calls `meta/musicgen` on Replicate from `/generate`.             |
| `BLOB_READ_WRITE_TOKEN` | yes      | Writes generated audio to the Vercel Blob store.                 |
| `MUSICGEN_VARIANT`      | no       | Override musicgen variant. Default `stereo-melody-large`.        |

For Vercel preview/production, add the same values via:

```bash
vercel env add REPLICATE_API_TOKEN production
vercel env add BLOB_READ_WRITE_TOKEN production
```

## `/generate` — prompt-to-audio demo

Internal alpha page. Enter a prompt + duration (5–30s), hit Generate, wait
~20–40s, get an MP3 stored in Vercel Blob with a playable audio element and
a download link. Every call emits one JSON log line (`event: music.generate`)
to stdout so Vercel Logs / log drains can aggregate latency and cost.

## Repo conventions

- TypeScript strict mode is on — no `any` without a reason, no `@ts-ignore` without a comment.
- App Router only. No Pages Router.
- Keep `AGENTS.md` in sync if project conventions change — agents read it before writing code.
