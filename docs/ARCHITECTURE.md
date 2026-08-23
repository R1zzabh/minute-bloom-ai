# Architecture

MinuteBloom is structured around a Next.js App Router frontend, Supabase for auth, storage, and database access, and OpenAI for transcription plus structured summarization.

## Request flow

1. Public marketing and demo routes render without credentials.
2. `proxy.ts` refreshes the Supabase session and protects `/app`.
3. Meeting metadata lives in Postgres with per-user ownership.
4. Audio files live in the private `meeting-audio` bucket.
5. Processing happens in `app/api/meetings/[id]/process/route.ts`.
6. Results are persisted before the meeting is marked complete.

## Key modules

- `lib/supabase/`: browser, server, admin, and proxy session helpers
- `lib/meetings/`: validators, export helpers, rate limits, queries, and mutations
- `lib/ai/`: prompt text, schemas, transcription, and summarization
- `fixtures/demo-meeting.ts`: deterministic public demo data
- `supabase/migrations/`: versioned SQL schema

## Reliability decisions

- The process route acquires a conditional lock so duplicate requests do not double-charge.
- Transcript persistence happens before summarization to preserve partial success.
- Ask AI is grounded to one meeting and rate-limited.
- Storage paths are sanitized and ownership-scoped.
