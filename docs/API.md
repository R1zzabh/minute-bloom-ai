# API

## `GET /api/health`

- Public
- Returns a timestamp plus safe readiness booleans
- Does not expose secret values

## `POST /api/meetings`

- Auth required
- Same-origin required
- Full live-processing configuration required
- Shared rate-limited
- Creates a real meeting row for the authenticated user

## `GET /api/meetings/[id]`

- Auth required
- Returns the owned meeting plus a signed audio URL when available

## `PATCH /api/meetings/[id]`

- Auth required
- Same-origin required
- Supabase admin configuration required for shared rate limiting
- Shared rate-limited
- Only updates user-editable meeting metadata:
  - `title`
  - `description`
  - `language`

## `DELETE /api/meetings/[id]`

- Auth required
- Same-origin required
- Supabase admin configuration required for shared rate limiting
- Shared rate-limited
- Deletes the private storage object first
- Deletes the meeting row only after storage cleanup succeeds or the object is already absent

## `POST /api/meetings/[id]/upload-complete`

- Auth required
- Same-origin required
- Full live-processing configuration required
- Shared rate-limited
- Verifies the owned storage object exists before marking the meeting `uploaded`
- Enqueues a processing job and triggers the local worker best-effort path

## `POST /api/meetings/[id]/process`

- Auth required
- Same-origin required
- Shared rate-limited
- Requeues work safely and returns `202`
- Does not wait for transcription or summarization to finish

## `POST /api/meetings/[id]/retry`

- Auth required
- Same-origin required
- Shared rate-limited
- Only valid when the meeting is `failed`
- Resets queue attempt state and requeues safely

## `POST /api/meetings/[id]/chat`

- Auth required
- Same-origin required
- Shared rate-limited
- Returns a grounded answer plus timestamp citations when supported

## `PATCH /api/meetings/[id]/action-items/[actionItemId]`

- Auth required
- Same-origin required
- Supabase admin configuration required for shared rate limiting
- Shared rate-limited
- Updates only the owned action item

## `GET /api/meetings/[id]/export?format=markdown|text|json`

- Auth required
- Returns a downloadable export using the shared export builders

## `GET /api/internal/meeting-processing`

- Secret-protected with `Authorization: Bearer <CRON_SECRET>`
- Used by both best-effort immediate triggers and Vercel cron recovery
- Safe to invoke locally in development to consume queued jobs
