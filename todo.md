# PromptFit TODO

## Migration
- [x] Migrate planService.ts (Redis content-addressed storage)
- [x] Migrate planRoutes.ts (POST /api/get-plan-id, GET /api/get-plan/:id)
- [x] Migrate WorkoutPlayer.tsx (full player with animations, rest, countdown)
- [x] Migrate shared types (WorkoutPlan schema)
- [x] Migrate imageAssets.ts (exercise animation mapping)
- [x] Wire routes into new Manus scaffold (tRPC + Express hybrid)
- [x] Install ioredis dependency

## Bug Fixes
- [x] Fix WorkoutPlayer animation not displaying after ?id= flow (304 cache issue)
- [x] Fix rest screen showing raw exercise key instead of readable name
- [x] Fix total duration calculation missing rest time between sets

## Features Backlog
- [ ] Generate remaining ~98 exercise animations via Replicate flux-kontext-pro
- [ ] Voice TTS upgrade (OpenAI TTS or ElevenLabs)
- [ ] Single-sided exercise support (left/right separate sets)
- [ ] GPT Custom Action OpenAPI spec

## Deployment
- [ ] Deploy to permanent Manus URL
- [ ] Configure promptfit.coach CNAME to point to new Manus URL

## Active Bugs
- [x] Redis connection fails in Manus managed environment — fixed by setting REDIS_URL (Upstash)

## E2E Tests (Playwright)
- [x] Add data-testid to WorkoutPlayer UI elements (step-timer, total-timer, exercise-name, set-badge, rest-screen, rest-next-exercise, skip-rest-btn, complete-screen)
- [x] Install and configure Playwright
- [x] A1: Reps workout - full run (rest screen, complete screen)
- [x] A2: Reps workout - skip all rest
- [x] B1: Timer workout - full run (timer bar, rest screen, complete screen)
- [x] B2: Timer workout - skip all rest
- [x] C1: Sets workout - full run (set badge counting, set rest, inter-exercise rest)
- [x] C2: Sets workout - skip all rest
- [x] Bug#1: ?id= URL loads correctly via Redis plan
- [x] Bug#2: Rest screen shows readable exercise name (not raw key)
- [x] Bug#3: Idle screen loads correctly with title and start button
- [x] Fix skipRest to use inline setState (no setTimeout) for immediate transition
- [x] Fix advanceStep to set pendingNextIndex/pendingNextSet for skipRest navigation

## Schema: Fully Declarative WorkoutStep
- [x] Remove mode field entirely — all steps are timer-driven
- [x] Make duration_sec required for all steps
- [x] Make sets, set_rest_sec, rest_after_sec required (use 0 for no rest)
- [x] reps optional — when present, UI shows "X reps" goal alongside timer
- [x] Remove weight_kg (use label instead), countdown_sec, note fields
- [x] label optional — overrides exercise display name
- [x] Update WorkoutStep TypeScript interface
- [x] Update validateWorkoutPlan() — enforce required fields, reject removed fields
- [x] Write SCHEMA.md with full field reference and GPT prompt guidance
- [x] Update useWorkoutPlayer hook — no more ?? defaults for required fields
- [x] Update ExerciseInfoCard — remove mode/weight_kg/note rendering
- [x] Update all E2E test fixtures to new declarative schema
- [x] 9/9 E2E tests passing after schema changes
