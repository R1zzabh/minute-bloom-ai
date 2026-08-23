# MinuteBloom AI

<p align="center">
  <strong>Meetings end. Momentum starts.</strong><br />
  Upload a meeting recording and receive a timestamped transcript, structured summary, decisions, editable action items, grounded answers, and export-ready notes.
</p>

<p align="center">
  <a href="https://drive.google.com/file/d/1snprj4ITvJxCVh587g42a0vKGJzcX-sM/view?usp=sharing"><strong>Watch the demo video</strong></a>
  ·
  <a href="https://github.com/R1zzabh/minute-bloom-ai"><strong>GitHub repository</strong></a>
</p>

<p align="center">
  <img alt="Next.js 16.3.2" src="https://img.shields.io/badge/Next.js-16.3.2-000000?logo=nextdotjs" />
  <img alt="React 19" src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=111827" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20Storage-3FCF8E?logo=supabase&logoColor=white" />
  <img alt="Groq and OpenAI" src="https://img.shields.io/badge/AI-Groq%20or%20OpenAI-F55036" />
</p>

<p align="center">
  <a href="https://drive.google.com/file/d/1snprj4ITvJxCVh587g42a0vKGJzcX-sM/view?usp=sharing">
    <img src="docs/assets/screenshots/landing-light.jpeg" alt="MinuteBloom light-mode landing page; click to watch the demo" width="100%" />
  </a>
</p>

> The image above links to the submitted Google Drive demo. If Drive says access is restricted, change sharing to **Anyone with the link → Viewer**.

## Table of contents

- [What MinuteBloom does](#what-minutebloom-does)
- [Why this project exists](#why-this-project-exists)
- [Feature checklist](#feature-checklist)
- [Product tour](#product-tour)
- [How the system works](#how-the-system-works)
- [Technology stack](#technology-stack)
- [AI pipeline and prompt design](#ai-pipeline-and-prompt-design)
- [Repository structure](#repository-structure)
- [Run locally: complete beginner guide](#run-locally-complete-beginner-guide)
- [Environment variable reference](#environment-variable-reference)
- [Supabase setup](#supabase-setup)
- [Email OTP authentication setup](#email-otp-authentication-setup)
- [AI provider setup](#ai-provider-setup)
- [Process a real meeting](#process-a-real-meeting)
- [API reference](#api-reference)
- [Database model](#database-model)
- [Testing and quality checks](#testing-and-quality-checks)
- [Deploy to Vercel](#deploy-to-vercel)
- [Security and privacy](#security-and-privacy)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

## What MinuteBloom does

MinuteBloom is a full-stack AI meeting workspace. A signed-in user uploads a private audio or video recording. The application stores the file in a private Supabase bucket, transcribes the audio, asks an LLM to convert the transcript into actionable meeting intelligence, and saves everything in a user-owned workspace.

The final result includes:

- a complete text transcript;
- timestamped transcript segments;
- an executive summary;
- key topics;
- decisions and their supporting timestamps;
- blockers and open questions;
- editable action items with owner, due date, priority, and status;
- a transcript-grounded Ask AI interface;
- Markdown, text, and JSON exports.

This repository contains the frontend **and** backend. There is no second backend process to start: `npm run dev` runs the Next.js pages, API routes, authentication integration, upload orchestration, and processing endpoints.

## Why this project exists

Meeting recordings are difficult to search and easy to forget. Conventional transcripts reproduce every word but still leave a person to identify decisions, owners, and next steps. MinuteBloom turns an unstructured recording into a reusable work artifact while keeping every result scoped to the authenticated user.

| Requirement | MinuteBloom implementation |
| --- | --- |
| Meeting audio input | Private browser upload for common audio formats and MP4 with audio |
| Text transcript | Timestamped ASR transcript stored in Postgres |
| Summary | Structured executive summary, topics, decisions, blockers, and questions |
| Action items | Generated tasks that remain editable after processing |
| ASR integration | Groq Whisper or OpenAI transcription, selected by environment variable |
| Backend | Next.js route handlers, Supabase Postgres, private Storage, durable queue |
| LLM generation | Groq or OpenAI structured summary and grounded meeting Q&A |
| Frontend | Responsive upload, dashboard, workspace, exports, themes, failure states |
| Deliverables | GitHub repository, detailed README, screenshots, and demo video |

## Feature checklist

- [x] Email OTP authentication with server-side sessions and sign-out
- [x] Per-user meeting dashboard with search and status filters
- [x] Private direct-to-Supabase upload
- [x] MP3, MP4, MPEG, MPGA, M4A, WAV, and WebM support
- [x] 25 MB validation in the browser, API, and Storage configuration
- [x] Audio-track validation for MP4 uploads
- [x] Durable queued transcription and summarization
- [x] Timestamped, searchable transcript
- [x] Executive summary, topics, decisions, blockers, and open questions
- [x] Editable action items with owner, due date, priority, and status
- [x] Grounded Ask AI for the current meeting
- [x] Markdown, plain-text, and JSON exports
- [x] Light/dark themes and responsive design
- [x] Fixture-only public demo at `/demo`
- [x] Rate limits, row-level security, same-origin checks, and secure headers
- [x] Unit, integration, Playwright, accessibility, lint, type, format, and build checks

## Product tour

### Light and dark landing experience

The landing page explains the workflow and links to sign-in, real upload, and a safe fixture workspace.

<img src="docs/assets/screenshots/landing-dark.jpeg" alt="MinuteBloom dark-mode landing page" width="100%" />

### Action-oriented overview

The Overview tab separates the executive summary, topics, decisions, blockers, and open questions. Exports remain one click away.

<img src="docs/assets/screenshots/summary-detail-light.jpeg" alt="MinuteBloom executive summary, topics, decisions, and exports" width="100%" />

### Searchable timestamped transcript

<img src="docs/assets/screenshots/transcript-light.jpeg" alt="Searchable timestamped meeting transcript" width="100%" />

### Editable action items

Generated tasks can be reviewed and updated with an owner, due date, priority, and status.

<img src="docs/assets/screenshots/action-items-light.jpeg" alt="MinuteBloom editable action items in light mode" width="100%" />

### Grounded Ask AI

Ask AI is restricted to the current meeting and uses its transcript and summary as evidence.

<img src="docs/assets/screenshots/ask-ai-light.jpeg" alt="MinuteBloom transcript-grounded Ask AI interface" width="100%" />

### Complete meeting workspace

<img src="docs/assets/screenshots/workspace-summary-light.jpeg" alt="Complete MinuteBloom meeting workspace in light mode" width="100%" />

<img src="docs/assets/screenshots/workspace-summary-dark.jpeg" alt="Complete MinuteBloom meeting workspace in dark mode" width="100%" />

### Dark-mode task management

<img src="docs/assets/screenshots/action-items-dark.jpeg" alt="Editable meeting action items in dark mode" width="100%" />

## How the system works

```mermaid
flowchart LR
    A[Email OTP sign-in] --> B[Create meeting]
    B --> C[Upload to private Supabase Storage]
    C --> D[Verify object and queue job]
    D --> E[Worker claims database lease]
    E --> F[Groq Whisper or OpenAI transcription]
    F --> G[Persist transcript and timestamps]
    G --> H[Structured LLM summary]
    H --> I[Persist summary and action items]
    I --> J[Search, edit, ask, and export]
```

1. The browser creates a meeting through `POST /api/meetings`.
2. It uploads directly to the private `meeting-audio` bucket.
3. `upload-complete` verifies the user-owned object.
4. `process` creates one durable processing job and returns quickly.
5. An immediate trigger attempts the job; Vercel Cron provides recovery.
6. The worker downloads and validates the object, transcribes it, persists the transcript, summarizes it, and replaces action items idempotently.
7. Failures are sanitized and retried with bounded backoff; failed meetings can also be retried by the user.

### Route split

- `/demo` is public, deterministic, and fixture-only. It does not invoke Supabase or AI.
- `/app` is the real authenticated workspace and never silently falls back to fixtures.
- `/app/meetings/new` is the real upload route.
- `/app/meetings/[id]` is a private meeting workspace.

## Technology stack

| Area | Technology | Purpose |
| --- | --- | --- |
| Framework | Next.js 16.3.2 App Router | UI, server components, API routes, deployment |
| UI | React 19.2.4, TypeScript 5 | Typed application |
| Styling | Tailwind CSS 4, shadcn/Radix helpers | Responsive tactile design |
| Theme | `next-themes` | Light/dark preference |
| Data | Supabase Postgres | Meetings, summaries, tasks, jobs, rate limits |
| Authentication | Supabase Auth | Email OTP and server session cookies |
| Files | Supabase Storage | Private recordings |
| AI client | OpenAI JavaScript SDK | OpenAI and Groq's compatible API |
| ASR | Groq Whisper or OpenAI transcription | Audio to timestamped text |
| LLM | Groq or OpenAI | Summary and grounded answers |
| Validation | Zod | Inputs and model-output schemas |
| Tests | Vitest, Testing Library, Playwright, axe | Unit, integration, E2E, accessibility |
| Hosting | Vercel + Supabase | Web, API, cron, database, auth, Storage |

## AI pipeline and prompt design

Set `AI_PROVIDER=groq` or `AI_PROVIDER=openai`. One selected-provider key handles transcription, summarization, and Ask AI. **Groq** is the provider used here; **Grok** is a different product and is not required.

The transcript is persisted before summary generation, so a summary failure does not destroy successful ASR work. Long transcripts are processed in bounded chunks and then aggregated. Structured output is validated for:

- suggested title;
- executive summary;
- key topics;
- decisions;
- action items;
- blockers;
- open questions.

Prompts treat transcript text as untrusted meeting content. The model must ignore embedded instructions, use only supported facts, avoid inventing owners or deadlines, mark inference where needed, and keep Ask AI scoped to one meeting.

Read [`docs/PROMPT_DESIGN.md`](docs/PROMPT_DESIGN.md) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full contracts.

## Repository structure

```text
minute-bloom-ai/
├── app/
│   ├── (auth)/sign-in/          # Email OTP UI
│   ├── (marketing)/             # Landing page
│   ├── (workspace)/app/         # Authenticated dashboard and meetings
│   ├── api/                     # Health, meetings, chat, exports, worker
│   ├── auth/callback/           # Safe future OAuth/link callback
│   └── demo/                    # Fixture-only public workspace
├── components/                  # Auth, landing, meeting, shared, UI components
├── docs/                        # Architecture, API, prompt, deployment, screenshots
├── fixtures/                    # Deterministic demo meeting
├── lib/
│   ├── ai/                      # Provider, transcription, summary, Ask AI
│   ├── meetings/                # Jobs, processing, exports, validation
│   └── supabase/                # Browser/server/admin clients
├── supabase/migrations/         # Database, Storage, RLS, queue, hardening
├── tests/                       # Unit, integration, Playwright
├── types/                       # Database and product types
├── .env.example                 # Safe configuration template
├── next.config.ts               # Next.js and security headers
├── proxy.ts                     # Sessions and protected routes
└── vercel.json                  # Worker cron schedule
```

## Run locally: complete beginner guide

Do not paste secret keys into GitHub, screenshots, issues, or frontend code.

### 1. Install prerequisites

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) 24 recommended
- npm (included with Node)
- [Supabase](https://supabase.com/) account
- either [Groq](https://console.groq.com/) or [OpenAI](https://platform.openai.com/api-keys)
- optional [Vercel](https://vercel.com/) account

```bash
git --version
node --version
npm --version
```

If Node is below 20, upgrade first. This project and CI use Node 24.

### 2. Clone and install

```bash
git clone https://github.com/R1zzabh/minute-bloom-ai.git
cd minute-bloom-ai
npm install
```

Confirm you are in the folder containing `package.json` before running commands.

### 3. Create `.env.local`

macOS/Linux/Git Bash:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` and replace the required placeholders. It must sit beside `package.json`, not in the parent folder.

### 4. Configure services

Complete [Supabase setup](#supabase-setup), [Email OTP authentication setup](#email-otp-authentication-setup), and one option under [AI provider setup](#ai-provider-setup).

### 5. Start frontend and backend together

```bash
npm run dev
```

Open exactly `http://localhost:3000`. Do not switch between `localhost`, `127.0.0.1`, and `0.0.0.0` during authentication. Cookies are host-specific, and `0.0.0.0` is a bind address rather than a normal browser destination.

Open `http://localhost:3000/api/health` to see safe readiness booleans and missing variable names. Secret values are never returned.

## Environment variable reference

| Variable | Required | Source / value |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Yes | Local: `http://localhost:3000`; production: final HTTPS origin |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable key; safe for browser use |
| `SUPABASE_SECRET_KEY` | Yes | Supabase secret key; server only |
| `AI_PROVIDER` | Yes | Exactly `groq` or `openai` |
| `GROQ_API_KEY` | If Groq | Groq Console; server only |
| `GROQ_BASE_URL` | If Groq | `https://api.groq.com/openai/v1` |
| `GROQ_TRANSCRIPTION_MODEL` | If Groq | `whisper-large-v3-turbo` |
| `GROQ_SUMMARY_MODEL` | If Groq | `openai/gpt-oss-20b` |
| `OPENAI_API_KEY` | If OpenAI | OpenAI Platform; server only |
| `OPENAI_TRANSCRIPTION_MODEL` | If OpenAI | `gpt-4o-transcribe-diarize` |
| `OPENAI_SUMMARY_MODEL` | If OpenAI | `gpt-4.1-mini` |
| `CRON_SECRET` | Yes | A long random secret protecting the worker |

Supported legacy aliases:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for `SUPABASE_SECRET_KEY`

Never expose a secret/service-role or AI key with a `NEXT_PUBLIC_` prefix.

Generate a cron secret:

```bash
openssl rand -hex 32
```

After changing `.env.local`, stop Next.js with `Ctrl+C` and restart `npm run dev`.

## Supabase setup

### 1. Create a project and collect keys

1. Open the [Supabase Dashboard](https://supabase.com/dashboard) and choose **New project**.
2. Select an organization, name the project, save a strong database password, and choose a nearby region.
3. Wait for provisioning.
4. Open **Project Settings → API Keys**.
5. Put the project URL, publishable key, and secret key into `.env.local`.

If only legacy keys are shown, use the aliases above. Never use keys copied from another person's project.

### 2. Apply migrations

From the repository root:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref your-project-ref
npx supabase@latest migration list
npx supabase@latest db push
```

The project reference is the short value in `https://your-project-ref.supabase.co`. Enter the database password when requested.

Confirm these tables exist:

- `public.meetings`
- `public.action_items`
- `public.meeting_processing_jobs`
- `public.shared_rate_limits`

Confirm Storage contains a **private** `meeting-audio` bucket. The migrations create its ownership policies; do not make it public.

### 3. Configure URLs

Under **Authentication → URL Configuration** use:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`

OTP does not require a callback link, but canonical URLs prevent future OAuth/link flows from returning to the wrong host.

## Email OTP authentication setup

MinuteBloom expects a typed code, not a clickable magic link.

1. Enable Email under **Authentication → Providers**.
2. Open **Authentication → Email Templates → Magic Link**.
3. Use subject `Your MinuteBloom sign-in code`.
4. Replace the body with content that includes `{{ .Token }}`:

```html
<h2>Your MinuteBloom sign-in code</h2>
<p>Enter this one-time code in the MinuteBloom sign-in screen:</p>
<p style="font-size: 32px; font-weight: 700; letter-spacing: 8px;">
  {{ .Token }}
</p>
<p>This code expires shortly. If you did not request it, ignore this email.</p>
```

The critical variable is `{{ .Token }}`. If the template contains `{{ .ConfirmationURL }}`, Supabase sends another link instead of the code expected by the app. Save it and request a **new** email.

### SMTP

Supabase's default sender is limited. For a public demo, enable custom SMTP under Authentication settings and use a transactional provider.

Temporary Gmail values are:

- Host: `smtp.gmail.com`
- Port: `587`
- Username: the complete Gmail address
- Password: a Google 16-character **App Password**, not the normal password
- Sender email: normally the same Gmail address
- Sender name: `MinuteBloom`

Gmail App Passwords require 2-Step Verification and can be unavailable on managed accounts. Leave working custom SMTP enabled; turning it off restores Supabase's restricted default sender and may reintroduce delivery/rate-limit failures.

### Test OTP

1. Open `http://localhost:3000/sign-in`.
2. Enter a real inbox and click once.
3. Wait for the code; repeated requests are rate-limited.
4. Enter the newest code in the same browser on the same hostname.
5. Confirm `/app` loads.
6. Sign out and confirm `/app` redirects back to sign-in.

## AI provider setup

Choose one provider; you do not need both.

### Groq

```bash
AI_PROVIDER=groq
GROQ_API_KEY=your_real_groq_key
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_TRANSCRIPTION_MODEL=whisper-large-v3-turbo
GROQ_SUMMARY_MODEL=openai/gpt-oss-20b
```

Create the key in the [Groq Console](https://console.groq.com/keys). One key covers ASR and LLM requests. No Grok/xAI key is required.

### OpenAI

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=your_real_openai_key
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-transcribe-diarize
OPENAI_SUMMARY_MODEL=gpt-4.1-mini
```

Create the key in the [OpenAI Platform](https://platform.openai.com/api-keys) and ensure the account has model access and billing/credits.

## Process a real meeting

1. Run `npm run dev`.
2. Sign in with OTP.
3. Open `/app/meetings/new`.
4. Upload MP3, MP4, MPEG, MPGA, M4A, WAV, or WebM under 25 MB. MP4 must contain audio.
5. Wait for upload, transcription, summarization, and completion.
6. Review Overview, Transcript, Action Items, and Ask AI.
7. Export Markdown, text, or JSON.

Do not use `/demo` for real transcription; it is intentionally fixture-only.

### Do I run another backend?

No. `npm run dev` starts the frontend and backend route handlers. Supabase and the AI provider are managed external services.

The app triggers processing immediately, while Vercel Cron provides durable recovery. If a local job stays queued, invoke the worker from another terminal:

```bash
curl -H "Authorization: Bearer replace-with-the-same-CRON_SECRET" \
  http://localhost:3000/api/internal/meeting-processing
```

Use the same value as `.env.local` and never publish the real command with the secret.

## API reference

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Safe readiness status |
| `GET` | `/api/demo-audio` | Fixture-only demo audio |
| `POST` | `/api/meetings` | Create an owned meeting/upload record |
| `GET` | `/api/meetings/[id]` | Read an owned meeting |
| `PATCH` | `/api/meetings/[id]` | Update editable metadata |
| `DELETE` | `/api/meetings/[id]` | Delete meeting data and file |
| `POST` | `/api/meetings/[id]/upload-complete` | Verify uploaded object |
| `POST` | `/api/meetings/[id]/process` | Queue processing |
| `POST` | `/api/meetings/[id]/retry` | Retry failed processing |
| `POST` | `/api/meetings/[id]/chat` | Grounded meeting Q&A |
| `PATCH` | `/api/meetings/[id]/action-items/[actionItemId]` | Edit an action item |
| `GET` | `/api/meetings/[id]/export?format=markdown` | Markdown export |
| `GET` | `/api/meetings/[id]/export?format=text` | Plain-text export |
| `GET` | `/api/meetings/[id]/export?format=json` | JSON export |
| `GET` | `/api/internal/meeting-processing` | Secret-protected worker |

See [`docs/API.md`](docs/API.md) for more detail.

## Database model

```mermaid
erDiagram
    AUTH_USERS ||--o{ MEETINGS : owns
    AUTH_USERS ||--o{ ACTION_ITEMS : owns
    MEETINGS ||--o{ ACTION_ITEMS : contains
    MEETINGS ||--|| MEETING_PROCESSING_JOBS : queues

    MEETINGS {
      uuid id PK
      uuid user_id FK
      text title
      text storage_path
      text status
      int progress
      text transcript_text
      jsonb transcript_segments
      jsonb summary
    }
    ACTION_ITEMS {
      uuid id PK
      uuid meeting_id FK
      text task
      text owner
      date due_date
      text priority
      text status
      boolean is_inferred
    }
    MEETING_PROCESSING_JOBS {
      uuid id PK
      uuid meeting_id FK
      text status
      int attempt_count
      timestamptz lease_expires_at
    }
    SHARED_RATE_LIMITS {
      text scope PK
      int request_count
      timestamptz window_ends_at
    }
```

RLS restricts meetings and action items to their owner. Queue/rate-limit objects are server-owned. Storage paths begin with the authenticated user ID.

## Testing and quality checks

Fast check:

```bash
npm run format:check
npm run lint
npm run typecheck
```

Tests, build, and audit:

```bash
npm test
npm run test:coverage
npx playwright install chromium
npm run test:e2e
npm run build
npm audit --omit=dev
```

On Linux, missing `libnspr4.so` or `libnss3.so` means Chromium needs host libraries:

```bash
sudo npx playwright install-deps chromium
```

Live upload E2E is opt-in because it uses real private services and may incur cost. Review the test before setting `RUN_LIVE_E2E=1`.

## Deploy to Vercel

1. Push the repository to GitHub.
2. Open [Vercel](https://vercel.com/) → **Add New → Project**.
3. Import this repository or your fork.
4. Keep the Next.js preset and repository root.
5. Add every required environment variable under Project Settings.
6. Set `NEXT_PUBLIC_APP_URL` to the final HTTPS Vercel origin.
7. Deploy.
8. In Supabase Auth, change Site URL to the production origin and add `<production-origin>/auth/callback`.
9. Keep the email template on `{{ .Token }}` and keep SMTP enabled.
10. Request a fresh OTP from production and test a real upload.

`vercel.json` schedules `/api/internal/meeting-processing` every minute. Vercel authenticates the cron using `CRON_SECRET`. Confirm your plan supports that schedule and inspect Cron/Function logs after upload; otherwise use a supported interval or trusted external scheduler.

### Production smoke test

1. Open the HTTPS site in incognito.
2. Test light/dark theme.
3. Sign in with a fresh OTP.
4. Upload a short supported recording under 25 MB.
5. Confirm status becomes completed.
6. Compare transcript and summary with the recording.
7. Edit an action item.
8. Ask a meeting-specific question.
9. Download all export formats.
10. Sign out and confirm `/app` is protected.

## Security and privacy

- Private Storage bucket and owner-prefixed paths
- Postgres row-level security for meetings and tasks
- Server-only secret/service-role and AI keys
- Same-origin checks for browser mutations
- Repeated file size/type validation
- Leased processing jobs with bounded attempts and retry delays
- Sanitized provider and persistence errors
- Shared database-backed rate limits
- Prompt-injection-aware transcript handling
- CSP, anti-framing, `nosniff`, referrer, permissions, and production HSTS headers
- Fixture-only `/demo` with no live data access

Never expose `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`, or `CRON_SECRET`. Rotate any secret that appears in a commit, screenshot, log, or message.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Fixture mode | Live env is missing or `/demo` is open | Put `.env.local` beside `package.json`, fill selected provider/Supabase variables, restart, use `/app/meetings/new` |
| Email sends a link, not code | Template uses `{{ .ConfirmationURL }}` | Use `{{ .Token }}`, save, request a new email |
| No email | SMTP/rate limit/spam/invalid recipient | Check Auth logs, SMTP credentials, spam, and sender; wait for cooldown |
| Error sending confirmation email | SMTP login or sender invalid | Use exact provider credentials; Gmail username is full email and password is an App Password |
| OTP expired/invalid | Old or used code | Request once and enter only newest code |
| Redirect loop/wrong host | Mixed `localhost`, `127.0.0.1`, `0.0.0.0`, stale cookies | Use only `localhost`, clear local site data once, restart, request fresh OTP |
| Continue does nothing | Stale chunks/HMR or server stopped | Stop old servers, remove `.next`, run `npm run dev`, hard refresh |
| Connection refused | Next.js not running | Run `npm run dev` and keep the terminal open |
| Never summarizes | AI config/credits/model or worker issue | Check `/api/health`, Settings, provider account, logs, then invoke worker once |
| MP4 rejected | Over 25 MB or missing audio | Export a smaller file with audio or upload audio directly |
| Groq fails | Wrong provider/key/model | Copy the Groq example exactly and restart |
| OpenAI fails | Missing key/access/credits | Check key, model access, billing, restart |
| Chromium library error | Missing Playwright OS dependencies | Run `sudo npx playwright install-deps chromium` |
| Supabase table/bucket missing | Migrations not applied | Link the correct project and run `npx supabase@latest db push` |
| Production job stays queued | Cron/secret mismatch | Check Vercel env, cron and function logs |

Safe diagnostics:

```bash
# Show variable names only, never values
sed -n 's/=.*//p' .env.local

curl http://localhost:3000/api/health
git status --short --branch
git diff --check
```

## FAQ

### Is a frontend included?

Yes. Although the brief calls it optional, this is a complete responsive product interface.

### Do I run a separate backend?

No. Next.js serves the frontend and backend APIs. Supabase and the selected AI provider are remote services.

### Do I need both Groq and OpenAI?

No. Configure only the provider selected by `AI_PROVIDER`.

### Is Groq the same as Grok?

No. No Grok/xAI key is required.

### Why does `/demo` not process my file?

It is deliberately fixture-only. Use `/app/meetings/new` after signing in.

### Where are recordings stored?

In the private Supabase `meeting-audio` bucket.

### Maximum size?

25 MB, enforced at multiple boundaries.

### What if summarization fails after ASR?

The transcript is saved first and the durable job can retry.

### Can tasks be edited?

Yes. Owner, due date, priority, and status can be changed and persisted.

## Additional documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Prompt design](docs/PROMPT_DESIGN.md)
- [Demo script](docs/DEMO_SCRIPT.md)

## Submission links

- Repository: [github.com/R1zzabh/minute-bloom-ai](https://github.com/R1zzabh/minute-bloom-ai)
- Demo video: [Google Drive](https://drive.google.com/file/d/1snprj4ITvJxCVh587g42a0vKGJzcX-sM/view?usp=sharing)

---

Built as an end-to-end meeting summarizer: private recording in, timestamped transcript and action-ready intelligence out.
