# Deployment

## Prerequisites

- Supabase project with auth, Postgres, and storage access
- OpenAI API key
- Vercel project access
- GitHub repository access

## Supabase

1. Apply `supabase/migrations/202608230001_minutebloom_init.sql`.
2. Confirm the `meeting-audio` bucket exists and is private.
3. Configure auth redirect URLs for local and production callback endpoints.

## Vercel

1. Link the repository.
2. Set all environment variables from `.env.example`.
3. Deploy the app.
4. Update `NEXT_PUBLIC_APP_URL` to the real production URL.
5. Add the production callback URL to Supabase and redeploy.

## Smoke tests

- `GET /api/health` returns success
- sign in works
- upload works
- processing reaches `completed`
- export works
- another account cannot access the same meeting

## Current blocker

Deployment has not been executed from this environment because GitHub CLI, Supabase CLI, Vercel authentication, and browser-backed account access are not available here.
