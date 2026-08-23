# Architecture

As of Sunday, August 23, 2026, MinuteBloom AI uses a queue-backed processing design that separates browser upload requests from long-running transcription and summarization work.

## Route split

- `/` and `/demo` are public.
- `/demo` is deterministic fixture data only.
- `/app` is the real authenticated workspace and never returns fixture records.

## Data flow

1. The browser creates a meeting row in `public.meetings`.
2. The browser uploads the media file directly into the private `meeting-audio` bucket.
3. `POST /api/meetings/[id]/upload-complete` verifies the storage object exists before changing the meeting state to `uploaded`.
4. `POST /api/meetings/[id]/process` records a queue job in `public.meeting_processing_jobs`, updates the visible meeting state, and returns `202`.
5. A best-effort immediate trigger calls `/api/internal/meeting-processing` after the response completes.
6. Vercel cron hits `/api/internal/meeting-processing` every minute for durable recovery.
7. The worker claims one queued or stale job through `claim_meeting_processing_job`, downloads the private object, validates the audio, transcribes it, persists the transcript, summarizes it, replaces action items, and finalizes the meeting.

## Tables

- `public.meetings`
- `public.action_items`
- `public.meeting_processing_jobs`
- `public.shared_rate_limits`

## Ownership and security

- Meeting and action-item rows are protected by RLS.
- `meeting_processing_jobs` and `shared_rate_limits` are server-owned tables with explicit deny policies for ordinary authenticated clients.
- Browser-originated mutating routes enforce same-origin checks.
- Auth callback redirects are restricted to safe same-origin internal paths.

## Reliability choices

- Transcript persistence happens before summary generation.
- Action items are replaced idempotently after summary generation.
- Failed jobs record sanitized errors and can be retried safely.
- Queued jobs use leases so stale work can be reclaimed after interruptions.
- Shared database rate limits protect uploads, mutable workspace actions, processing, retries, and Ask AI routes across deployments.
