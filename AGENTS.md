<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

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
