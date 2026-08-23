# Deployment

Deployment has not been completed from this environment as of Sunday, August 23, 2026 because GitHub push access, Vercel authentication, and verified live credentials are still missing here.

## Required environment variables

Set these in `.env.local` for local work and in Vercel for production:

```bash
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY        # optional legacy alias
SUPABASE_SECRET_KEY
SUPABASE_SERVICE_ROLE_KEY            # optional legacy alias
OPENAI_API_KEY
OPENAI_TRANSCRIPTION_MODEL
OPENAI_SUMMARY_MODEL
CRON_SECRET
```

## Supabase setup

1. Confirm the project ref is `knlounxdcfqbbpflaivj`.
2. Apply migrations in order:
   - `202608230001_minutebloom_init`
   - `202608230002_minutebloom_backend_hardening`
   - `minutebloom_jobs_and_rate_limits`
   - `minutebloom_job_table_policies`
3. Confirm the `meeting-audio` bucket exists, is private, has the 25 MB file-size limit, and allows:
   - `audio/mpeg`
   - `audio/mp4`
   - `audio/mpga`
   - `audio/m4a`
   - `audio/wav`
   - `audio/webm`
   - `video/mp4`

## Supabase Auth URLs

Local:

- Site URL: `http://localhost:3000`
- Redirect allowlist: `http://localhost:3000/auth/callback`

Production:

- Site URL: the real production origin
- Redirect allowlist: `<production-origin>/auth/callback`

## Vercel

1. Link the existing GitHub repository.
2. Configure the environment variables above.
3. Keep `NEXT_PUBLIC_APP_URL` set to the actual production origin.
4. Keep `CRON_SECRET` configured so Vercel cron can authorize `/api/internal/meeting-processing`.
5. Deploy the app.
6. Reconfirm Supabase production auth URLs after the production origin is final.
7. Verify `/api/health` reports the expected safe readiness booleans before enabling real users.

## Worker recovery path

- Immediate trigger: `after()` issues a best-effort authenticated request to `/api/internal/meeting-processing`.
- Durable recovery: `vercel.json` schedules `/api/internal/meeting-processing` every minute.

## Post-deploy smoke checklist

- `/`
- `/api/health`
- `/demo`
- `/sign-in`
- protected `/app`
- `/app/meetings/new`
- upload completion
- queued processing
- transcript persistence
- summary persistence
- action item editing
- Ask AI
- Markdown export
- text export
- JSON export
- meeting deletion
- mobile layout
- security headers
