# PromptFit — Local Development Migration Guide

> Generated: 2026-03-08. This document captures every platform-specific detail needed to run PromptFit outside of Manus.space.

---

## 1. Environment Variables & Secrets

All environment variables are injected by the Manus platform at runtime. When running locally, create a `.env` file at the project root (never commit it).

| Key | Used By | Purpose |
|-----|---------|---------|
| `DATABASE_URL` | `server/db.ts` | MySQL/TiDB connection string (Manus-managed TiDB Serverless) |
| `JWT_SECRET` | `server/_core/cookies.ts` | Signs session cookies with JOSE. Must be a long random string. |
| `VITE_APP_ID` | `client/src/const.ts` | Manus OAuth application ID (used in login URL construction) |
| `OAUTH_SERVER_URL` | `server/_core/oauth.ts` | Manus OAuth backend base URL (e.g. `https://api.manus.im`) |
| `VITE_OAUTH_PORTAL_URL` | `client/src/const.ts` | Manus login portal URL shown to unauthenticated users |
| `OWNER_OPEN_ID` | `server/db.ts` | Owner's Manus openId — auto-promoted to `admin` role on first login |
| `OWNER_NAME` | `server/_core/notification.ts` | Owner's display name for notification messages |
| `REDIS_URL` | `server/redis.ts` | Upstash Redis connection string. Format: `rediss://:<password>@<host>:<port>` |
| `BUILT_IN_FORGE_API_URL` | `server/storage.ts`, `server/_core/llm.ts` | Manus Forge API base URL (storage proxy, LLM, notifications) |
| `BUILT_IN_FORGE_API_KEY` | `server/storage.ts`, `server/_core/llm.ts` | Bearer token for server-side Forge API calls |
| `VITE_FRONTEND_FORGE_API_URL` | `client/src/` | Forge API URL for frontend-side calls (analytics, etc.) |
| `VITE_FRONTEND_FORGE_API_KEY` | `client/src/` | Bearer token for frontend Forge API calls |
| `VITE_ANALYTICS_ENDPOINT` | `client/src/main.tsx` | Analytics collection endpoint |
| `VITE_ANALYTICS_WEBSITE_ID` | `client/src/main.tsx` | Analytics website identifier |

### Local `.env` Template

```bash
# .env (never commit)
DATABASE_URL=mysql://user:password@host:port/dbname
JWT_SECRET=your-long-random-secret-here
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/login
OWNER_OPEN_ID=your-manus-open-id
OWNER_NAME=Bear
REDIS_URL=rediss://:your-upstash-password@your-host.upstash.io:6379
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-key
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

> **Note on Manus-specific vars:** `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID`, `BUILT_IN_FORGE_API_*`, and `VITE_FRONTEND_FORGE_API_*` are all Manus platform credentials. When migrating off Manus, you will need to replace the OAuth flow with your own provider (e.g. Auth0, Clerk, NextAuth) and replace the Forge API with direct AWS S3 + OpenAI API calls.

---

## 2. Redis Configuration

### Service

**Upstash Redis** (serverless, pay-per-request). The connection is confirmed in `server/redis.test.ts` which pings Upstash directly.

### Connection Details

```typescript
// server/redis.ts
import Redis from "ioredis";

const _redis = new Redis(process.env.REDIS_URL, {
  tls: url.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  reconnectOnError: () => true,
  lazyConnect: false,
});
```

- **Protocol:** `rediss://` (TLS, port 6379 or 6380 depending on Upstash region)
- **TLS:** `rejectUnauthorized: false` (Upstash self-signed cert)
- **Idle disconnects:** Upstash closes idle connections; the `retryStrategy` and `reconnectOnError` handle silent reconnection

### Key Pattern

```
plan:{planId}
```

Where `planId` is a 22-character Base62-encoded SHA-256 hash of the canonicalized workout JSON. This makes plan storage **content-addressed** — identical workouts always produce the same ID.

### TTL

**30 days (sliding)** — every read refreshes the TTL via `EXPIRE`:

```typescript
const TTL_SECONDS = 30 * 24 * 60 * 60; // 2,592,000 seconds

// Write (SETNX for deduplication)
await redis.setnx(key, canonical);
await redis.expire(key, TTL_SECONDS);

// Read (refresh TTL)
const raw = await redis.get(key);
await redis.expire(key, TTL_SECONDS); // sliding window
```

### Data Structure

Each key stores the **canonicalized JSON string** of the full workout plan object. The schema is validated by `server/workoutSchema.ts` before storage.

```json
{
  "title": "20-Min Upper Body",
  "description": "Quick push workout",
  "steps": [
    {
      "type": "work",
      "exercise_id": "push_up",
      "mode": "timer",
      "duration_sec": 30,
      "sets": 3,
      "set_rest_sec": 20,
      "rest_after_sec": 30
    }
  ]
}
```

---

## 3. Deployment Flow

### Current Setup

PromptFit runs on the **Manus WebDev platform** — a managed Node.js hosting environment. There is no manual CI/CD pipeline; deployment is triggered by clicking the **Publish** button in the Manus Management UI after creating a checkpoint.

### Build Process

```bash
# Install dependencies
pnpm install

# Build frontend (Vite) + backend (esbuild via tsx)
pnpm build
# → Frontend: dist/public/
# → Backend: dist/index.js (Express server)

# Start production server
pnpm start
# → NODE_ENV=production node dist/index.js
```

### Key Build Scripts (from `package.json`)

```json
{
  "scripts": {
    "dev": "tsx watch server/_core/index.ts",
    "build": "tsc && vite build && esbuild server/_core/index.ts --bundle --platform=node --outfile=dist/index.js",
    "start": "node dist/index.js",
    "test": "vitest run",
    "db:push": "drizzle-kit generate && drizzle-kit migrate"
  }
}
```

### Node.js Version

**v22.13.0** (confirmed via `node --version` in sandbox). The Manus platform uses Node 22 LTS.

### Local Development

```bash
pnpm install
cp .env.example .env  # fill in your values
pnpm dev              # starts Vite + Express concurrently on port 3000
```

### Database Migrations

```bash
# After editing drizzle/schema.ts:
pnpm db:push
# Runs: drizzle-kit generate && drizzle-kit migrate
```

---

## 4. GPT Custom Action / OpenAI Integration

### Overview

PromptFit integrates with a **ChatGPT Custom GPT** (GPT-4o) that acts as a workout compiler. The GPT generates structured workout plans and POSTs them to the PromptFit API, then returns a play URL to the user.

### API Endpoint

```
POST https://promptfit-yygnmjeg.manus.space/api/get-plan-id
```

This is a **public endpoint** (no authentication required) that accepts a workout plan JSON, stores it in Redis, and returns a `play_url`.

### OpenAPI Action Schema

The full schema is at `gpt-integration/openapi-action.yaml`:

```yaml
openapi: 3.1.0
info:
  title: AI Workout Plan API
  version: 1.0.0
servers:
  - url: https://promptfit-yygnmjeg.manus.space
paths:
  /api/get-plan-id:
    post:
      operationId: createWorkoutPlan
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [title, description, steps]
              properties:
                title: { type: string }
                description: { type: string }
                steps:
                  type: array
                  items:
                    type: object
                    required: [type, exercise_id, mode]
                    properties:
                      type: { type: string }        # "work" | "warmup"
                      exercise_id: { type: string } # see exercise library
                      mode: { type: string, enum: [timer, reps] }
                      duration_sec: { type: integer }
                      reps: { type: integer }
                      sets: { type: integer }
                      set_rest_sec: { type: integer }
                      rest_after_sec: { type: integer }
      responses:
        "201":
          content:
            application/json:
              schema:
                properties:
                  id: { type: string }
                  play_url: { type: string }
```

### GPT System Prompt

The full system prompt is at `gpt-integration/system-prompt.md`. Key sections:

- **Role:** "You are PromptFit Compiler — an expert personal trainer and workout programmer."
- **Output format:** Must call `createWorkoutPlan` action with valid JSON, then return the `play_url` to the user
- **Exercise library:** Full list of 101 exercise IDs grouped by category (lower_body, push, pull, core, conditioning)
- **Rules:** No exercise IDs outside the approved list; `rest_after_sec` omitted on last step; unilateral exercises (e.g. `side_plank`) auto-split by the player

### When Migrating

When you change the hostname (e.g. from `promptfit-yygnmjeg.manus.space` to your own domain):

1. Update `PRODUCTION_HOSTNAME` in `server/planRoutes.ts` (line 32)
2. Re-run the workout-compiler-gpt skill to regenerate `gpt-integration/system-prompt.md` and `gpt-integration/openapi-action.yaml`
3. Update the GPT Action schema in ChatGPT settings

---

## 5. Forge API (Manus Built-in APIs)

### What It Is

`BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` are **Manus platform credentials** that provide access to:

| Service | Endpoint | Used in PromptFit? |
|---------|----------|-------------------|
| File Storage (S3 proxy) | `POST /v1/storage/upload` | ✅ Yes — exercise animation assets |
| LLM (OpenAI proxy) | `POST /v1/chat/completions` | ❌ Not used in production |
| Voice Transcription (Whisper) | `POST /v1/audio/transcriptions` | ❌ Not used |
| Image Generation | `POST /v1/images/generations` | ❌ Not used |
| Owner Notifications | `POST /v1/notifications` | ✅ Yes — `server/_core/notification.ts` |

### Storage Usage

Exercise animation images (WebP frames) are uploaded via the Forge storage proxy and served from CloudFront CDN. The upload flow:

```typescript
// server/storage.ts
import { storagePut } from "./server/storage";

const { url } = await storagePut(
  `exercises/${exerciseId}-frame1.webp`,
  fileBuffer,
  "image/webp"
);
// url → https://d2xsxph8kpxj0f.cloudfront.net/...
```

### Migration Replacement

Replace Forge API with:
- **Storage:** Direct AWS S3 SDK (`@aws-sdk/client-s3`)
- **LLM:** OpenAI SDK (`openai` npm package)
- **Notifications:** Email (SendGrid, Resend) or Slack webhook

---

## 6. CloudFront CDN

### Domain

```
https://d2xsxph8kpxj0f.cloudfront.net
```

This CloudFront distribution is **managed by Manus** and fronts the S3 bucket used by the Forge storage proxy. You do not have direct access to the S3 bucket or CloudFront configuration.

### What's Stored

All exercise animation assets (WebP frame images) are stored here. The URL pattern is:

```
https://d2xsxph8kpxj0f.cloudfront.net/{relKey}
```

Where `relKey` is the path passed to `storagePut()`.

### Upload Flow

Assets are uploaded using the Manus CLI tool during development:

```bash
manus-upload-file --webdev path/to/image.webp
# Returns: https://d2xsxph8kpxj0f.cloudfront.net/...
```

The returned URL is then hardcoded into `client/src/lib/imageAssets.ts`.

### Migration Plan

When moving off Manus:
1. Create your own S3 bucket + CloudFront distribution (or use Cloudflare R2)
2. Re-upload all assets from `client/src/lib/imageAssets.ts` to your new CDN
3. Find-and-replace `d2xsxph8kpxj0f.cloudfront.net` with your new CDN domain in `imageAssets.ts`

---

## 7. Domain & DNS

### Current Domains

| Domain | Type | Status |
|--------|------|--------|
| `promptfit-yygnmjeg.manus.space` | Manus auto-generated | Active (primary) |
| `promptfit.coach` | Custom domain | Purchased & configured via Manus |
| `www.promptfit.coach` | Custom domain | Configured via Manus |

### DNS Configuration

The custom domains (`promptfit.coach`, `www.promptfit.coach`) are managed through the Manus Management UI → Settings → Domains. The DNS records point to Manus's load balancer.

### Migration Plan

When moving off Manus:
1. Transfer domain registrar control (or update nameservers) to your new hosting provider
2. Update `PRODUCTION_HOSTNAME` in `server/planRoutes.ts` to your new domain
3. Update CORS settings in `server/planRoutes.ts` if needed
4. Regenerate GPT integration artifacts (see Section 4)

---

## 8. Skills, Workflows & Prompts

### workout-compiler-gpt Skill

Located at `/home/ubuntu/skills/workout-compiler-gpt/`. This is a **Manus Agent Skill** — a reusable workflow that regenerates the GPT integration artifacts whenever the app hostname or exercise library changes.

**Trigger conditions:**
- Public hostname changes
- New exercises added to `client/src/lib/exercises.ts`
- API schema changes in `server/planRoutes.ts` or `client/src/lib/workoutSchema.ts`

**Output files:**
- `gpt-integration/system-prompt.md` — paste into ChatGPT Instructions field
- `gpt-integration/openapi-action.yaml` — paste into ChatGPT Actions schema editor

**Templates:** `/home/ubuntu/skills/workout-compiler-gpt/templates/`
- `system-prompt-template.md` — template with `{{HOSTNAME}}` and `{{EXERCISE_LIST}}` placeholders
- `openapi-template.yaml` — template with `{{HOSTNAME}}` placeholder

### exercise-animation Skill

Located at `/home/ubuntu/skills/exercise-animation/`. Generates consistent two-frame exercise animations using **Replicate API** (flux-kontext-pro model).

**Requires:** `REPLICATE_API_KEY` environment variable (not in the Manus project, set separately in sandbox)

**Output:** WebP frame images uploaded to CDN, URLs added to `client/src/lib/imageAssets.ts`

---

## 9. Database Schema

### Service

**Manus-managed TiDB Serverless** (MySQL-compatible). Connection via `DATABASE_URL` (standard MySQL connection string).

### Current Tables

Only one table exists currently:

```sql
-- drizzle/schema.ts
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  openId      VARCHAR(64) NOT NULL UNIQUE,  -- Manus OAuth identifier
  name        TEXT,
  email       VARCHAR(320),
  loginMethod VARCHAR(64),
  role        ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  createdAt   TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt   TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  lastSignedIn TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Data Volume

PromptFit is a **stateless workout player** — workout plans are stored in Redis (not MySQL). The `users` table only stores authenticated users who have logged in via Manus OAuth. For a public app where most users don't log in, this table may have very few rows.

### Migration

```bash
# Export current data
mysqldump -h <host> -u <user> -p <dbname> users > users_backup.sql

# On new MySQL instance
pnpm db:push  # creates tables from schema
mysql -h <new-host> -u <user> -p <dbname> < users_backup.sql
```

> **Note:** If you replace Manus OAuth with a different auth provider, the `openId` column semantics will change. You may want to add a `provider` column and rename `openId` to `providerUserId`.

---

## 10. Known Issues, Limitations & Workarounds

### Platform-Specific Workarounds

| Issue | Workaround | File |
|-------|-----------|------|
| Upstash closes idle TLS connections | `reconnectOnError: () => true` + suppress TLS disconnect errors in `_redis.on("error")` | `server/redis.ts` |
| 304 Not Modified responses causing stale animation data | `Cache-Control: no-store` on `GET /api/get-plan/:id` | `server/planRoutes.ts` |
| Vite dev server requires specific `allowedHosts` for Manus preview domains | Hardcoded list of `*.manus.computer` patterns in `vite.config.ts` | `vite.config.ts` |
| Safari Private / Firefox Strict ETP block session cookies | Known limitation — Manus OAuth uses cookies, which are blocked in strict privacy modes | `server/_core/oauth.ts` |

### Known Bugs / Limitations

- **No user-specific body weight for calorie calculation** — calories are estimated at 70 kg baseline. User weight preference is not persisted.
- **Redis plan expiry** — plans expire after 30 days of inactivity. There is no UI to warn users when a shared plan link is about to expire.
- **Unilateral exercise detection** — the player auto-splits exercises with `_side` field into Left/Right. This is set at the exercise definition level in `exercises.ts`; there is no runtime override.
- **No offline support** — the workout player requires network access to load the plan from Redis on first load. Once loaded, it runs client-side.

### Production Monitoring

Structured JSON logs are written to stdout by `server/planRoutes.ts`. Each log line includes `request_id`, `event`, `status_code`, and relevant metadata. No external log aggregation is configured — Manus captures stdout automatically.

---

## 11. Local Development Quick Start

```bash
# 1. Clone / download project
git clone <your-repo> promptfit-app
cd promptfit-app

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your values (see Section 1)

# 4. Push database schema
pnpm db:push

# 5. Start dev server
pnpm dev
# → http://localhost:3000

# 6. Run tests
pnpm test           # unit tests (vitest)
npx playwright test # E2E tests (requires dev server running)
```

### Replacing Manus Auth Locally

If you want to run without Manus OAuth, the quickest workaround is to mock the auth context in `server/_core/context.ts`:

```typescript
// Temporary local dev bypass — NEVER use in production
if (process.env.NODE_ENV === 'development' && process.env.MOCK_USER) {
  ctx.user = { id: 1, openId: 'local-dev', name: 'Dev User', role: 'admin' };
}
```

---

*This document was generated from the live codebase on 2026-03-08. For the latest state, re-read the source files listed in each section.*
