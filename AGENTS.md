<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Repo Commands

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test:coverage`
- `npm run test:e2e`
- `npm run build`

## Quality Rules

- Do not weaken the 25 MB upload validation.
- Keep brand strings and external links centralized in `lib/config.ts`.
- Keep provider calls inside `lib/ai/` and `lib/supabase/`.
- Treat `/demo` as fixture-only and never wire it to another user's data.
- Do not expose secrets in logs, docs, screenshots, or tests.
