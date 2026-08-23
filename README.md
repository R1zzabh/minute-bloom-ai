# MinuteBloom AI

Meetings end. Momentum starts.

MinuteBloom AI is a Next.js 16.3.2 meeting workspace that accepts private meeting recordings, stores them in Supabase, transcribes them with OpenAI, generates structured notes, and keeps the results editable and exportable in a per-user dashboard.

## Product split

- `/demo` is always deterministic fixture data. It never depends on Supabase, OpenAI, or another user's records.
- `/app` is always the real authenticated workspace. It never falls back to `demoMeeting` or `fixture-user`.
- When Supabase public config is missing, `/app` shows an explicit configuration-required state with a link back to `/demo`.
- When Supabase auth works but live processing is incomplete, users can still sign in and browse their dashboard, but upload processing and Ask AI remain disabled with exact missing-variable guidance.

## Core capabilities

- Private upload flow for `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav`, and `webm`
- Hard 25 MB limit enforced in the browser, on the server, and in the `meeting-audio` Supabase bucket
- MP4 acceptance only when the stored file contains a usable audio track
- Transcript-first persistence so summarization failures do not discard transcription work
- Structured summary output: executive summary, key topics, decisions, blockers, open questions, and action items
- Editable action items with ownership-scoped mutations
- Grounded Ask AI answers limited to one meeting transcript and summary
- Markdown, plain text, and JSON exports from shared export builders
- Light/dark theme, reduced-motion support, and explicit loading/error/not-found states

## Runtime architecture

1. The browser creates a meeting row in `public.meetings`.
2. The browser uploads the audio directly into the private `meeting-audio` bucket.
3. `POST /api/meetings/[id]/upload-complete` verifies the owned storage object exists before marking the meeting `uploaded`.
4. `POST /api/meetings/[id]/process` queues work in `public.meeting_processing_jobs` and returns `202` quickly.
5. A secret-protected internal worker route claims queued or stale jobs through the `claim_meeting_processing_job` Postgres function.
6. The worker downloads the private object, validates the file again, transcribes it, persists the transcript, summarizes it, replaces action items idempotently, and marks the meeting complete.
7. Vercel cron hits `/api/internal/meeting-processing` every minute for durable recovery when the best-effort immediate trigger does not finish the job.

## Supabase objects

- Project ref: `knlounxdcfqbbpflaivj`
- Live application tables:
  - `public.meetings`
  - `public.action_items`
  - `public.meeting_processing_jobs`
  - `public.shared_rate_limits`
- Private bucket: `meeting-audio`
- Applied migrations as of Sunday, August 23, 2026:
  - `202608230001_minutebloom_init`
  - `202608230002_minutebloom_backend_hardening`
  - `minutebloom_jobs_and_rate_limits`
  - `minutebloom_job_table_policies`

## Environment variables

Create `.env.local` beside `package.json`.

Canonical variables:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
OPENAI_API_KEY=
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-transcribe-diarize
OPENAI_SUMMARY_MODEL=gpt-4.1-mini
CRON_SECRET=
```

Supported legacy aliases:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` instead of `SUPABASE_SECRET_KEY`

Environment handling rules:

- Whitespace-only values are treated as missing.
- Server-key values are never exposed to client bundles.
- The Settings screen and `/api/health` expose only safe readiness booleans and missing variable names.

## Local setup

1. Use a Node version supported by Next.js 16 and Vercel. Node 24 is currently used in this workspace.
2. Copy `.env.example` to `.env.local`.
3. Fill the required Supabase, OpenAI, and `CRON_SECRET` values.
4. Install dependencies with `npm install`.
5. Run `npm run dev`.
6. Confirm:
   - `/demo` still loads fixture data
   - `/app` no longer shows fixture content
   - Settings reports the expected readiness state

## Auth configuration

Supabase Auth must allow the callback path `/auth/callback`.

Local development:

- Site URL: `http://localhost:3000`
- Redirect allowlist: `http://localhost:3000/auth/callback`
- Safe post-auth route: `/app`

Production:

- Site URL: the real Vercel production origin
- Redirect allowlist: `<production-origin>/auth/callback`

The auth callback only accepts safe same-origin internal `next` paths and falls back to `/app` for malicious values.

## API routes

- `GET /api/health`
- `GET /api/demo-audio`
- `POST /api/meetings`
  - Requires full live-processing configuration
  - Shared rate-limited
- `GET /api/meetings/[id]`
- `PATCH /api/meetings/[id]`
  - User-editable metadata only: title, description, language
  - Shared rate-limited
- `DELETE /api/meetings/[id]`
  - Shared rate-limited
- `POST /api/meetings/[id]/upload-complete`
  - Shared rate-limited
- `PATCH /api/meetings/[id]/action-items/[actionItemId]`
  - Shared rate-limited
- `POST /api/meetings/[id]/process`
  - Queue only, returns quickly
- `POST /api/meetings/[id]/retry`
  - Queue only, resets attempt state
- `POST /api/meetings/[id]/chat`
- `GET /api/meetings/[id]/export?format=markdown|text|json`
- `GET /api/internal/meeting-processing`
  - Secret-protected worker/cron endpoint

## Security notes

- Meeting rows and action items are protected by RLS.
- Worker and shared rate-limit tables are server-owned and deny ordinary authenticated access.
- Upload creation, upload verification, metadata edits, action-item edits, processing, retry, and Ask AI all use shared database-backed rate limits.
- Browser-originated mutating routes enforce same-origin checks.
- Errors are sanitized before persistence and response.
- Security headers are configured in `next.config.ts`, including CSP, anti-framing, `nosniff`, referrer policy, permissions policy, and HSTS when `NEXT_PUBLIC_APP_URL` is HTTPS.

## Tests and validation

Local commands:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:e2e
npm run build
npm audit --omit=dev
```

Playwright:

- Default E2E covers landing and demo behavior.
- Live E2E must only run when an explicit environment flag such as `RUN_LIVE_E2E=1` is set.

## Deployment status

- GitHub remote: `https://github.com/R1zzabh/minute-bloom-ai.git`
- Expected branch: `main`
- Vercel production URL: not verified yet from this environment

Deployment is still blocked here by external credentials and platform access:

- GitHub push permissions from the sandbox
- Vercel authentication and project linkage
- Verified live Supabase/OpenAI credentials for a smoke test

## Screenshots and demo artifacts

- Public screenshots: not yet updated in this workspace
- Demo recording command: `npm run test:e2e:record-demo`
- Public demo/workflow video link: not yet available

No screenshots, URLs, or demo artifacts are fabricated here; add them only after a real browser-backed capture against the final deployed build.
