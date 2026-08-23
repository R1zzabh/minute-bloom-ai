# API

## `GET /api/health`

Returns a minimal dependency-independent status payload.

## `POST /api/meetings/[id]/process`

- Auth required
- Verifies meeting ownership
- Downloads private audio
- Runs transcription and structured summary generation
- Persists transcript, summary, and action items

## `POST /api/meetings/[id]/chat`

- Auth required
- Request body: `{ "question": string }`
- Rate-limited per user
- Returns a grounded answer plus timestamp citations when available

## `POST /api/meetings/[id]/retry`

- Auth required
- Only valid for meetings in `failed`
- Requeues processing, reusing the saved transcript when possible

## `GET /api/meetings/[id]/export`

- Auth required
- Query param: `format=markdown|text|json`
- Returns a downloadable export
