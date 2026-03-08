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

## Unilateral Exercise Support
- [x] Add `unilateral?: boolean` to ExerciseInfo interface in exercises.ts
- [x] Mark 18 exercises as unilateral: true (split_squat, bulgarian_split_squat, reverse_lunge, forward_lunge, lateral_lunge, curtsy_lunge, step_up, box_step_up, single_leg_glute_bridge, single_leg_rdl, single_leg_calf_raise, single_arm_db_row, concentration_curl, side_plank, side_plank_reach, woodchopper, suitcase_carry, skater_jump)
- [x] Restructure imageAssets.ts: unilateral exercises get { left: { frame1, frame2 }, right: { frame1, frame2 } } with placeholder URLs
- [x] Update getActiveFramePair() to accept optional side parameter
- [x] Update ExerciseAnimation component to accept side prop
- [x] Implement expandUnilateralSteps() in useWorkoutPlayer: auto-split into left/right InternalSteps at runtime
- [x] Each half gets duration_sec/2, reps/2 (if set), rest_after_sec=0 for left, original for right
- [x] Add side field to PlayerState; add state.side to useEffect deps (fixes countdown restart on left↔right)
- [x] Update WorkoutPlayer to pass side to ExerciseAnimation and ExerciseInfoCard
- [x] Update ExerciseInfoCard to read _displayName from InternalStep (includes " - Left" / " - Right")
- [x] Add D1 E2E test for unilateral auto-split
- [x] 10/10 E2E tests passing

## Sample Workout Update
- [x] Update SAMPLE_WORKOUT in Home.tsx to new declarative schema (no mode, all required fields, include unilateral example)
- [x] Update textarea placeholder to show new schema format

## TTS Bug Fixes
- [x] Bug#TTS1: Skip rest blocks next exercise TTS announcement — skipRest now calls announceExercise(50ms after cancelSpeech)
- [x] Bug#TTS2: Unilateral steps now announce side in TTS (getStepDisplayName reads _displayName → "Side Plank - Left")

## TTS Bug Fixes (Re-investigation)
- [x] Bug#TTS1 (still broken): Skip rest silences next exercise TTS — root cause: stateRef not available, setState callback async
- [x] Bug#TTS2 (still broken): Unilateral TTS doesn't say side name — root cause: same skipRest path

## TDD Bug Fixes: TTS + UI (Round 3 — TDD)
- [x] U1: unit test — buildGetReadyText() says "get ready" not "rest" (RED then GREEN)
- [x] U2: unit test — buildExerciseAnnouncement with unilateral side suffix (GREEN)
- [x] U3: unit test — buildRestAnnouncement existing behavior preserved (GREEN)
- [x] U4: unit test — buildCountdownText returns null outside 1-3 (GREEN)
- [x] E1: E2E — skip rest fires TTS for next exercise (RED then GREEN)
- [x] E2: E2E — unilateral TTS includes "Left"/"Right" (GREEN)
- [x] E3: E2E — initial countdown TTS says "get ready" not "rest" (RED then GREEN)
- [x] Fix: Add buildGetReadyText() + announceGetReady() to tts.ts
- [x] Fix: Replace announceRest() with announceGetReady() in start() countdown
- [x] Fix: Add stateRef to useWorkoutPlayer for synchronous state reads
- [x] Fix: skipRest() reads stateRef.current BEFORE setState to resolve next step
- [x] Fix: skipRest() calls announceExercise() after setState with correct step
- [x] Fix: Desktop card max-width — animation + info card both capped at 640px
- [x] Fix: vitest config excludes e2e/ to prevent Playwright spec collision
- [x] 18/18 unit tests passing
- [x] 13/13 E2E tests passing

## Next Button Bug Fix (TDD)
- [x] Add data-testid="next-exercise-btn" to ExerciseInfoCard next button
- [x] E-Next1: E2E — next button → rest screen countdown actually ticks (RED then GREEN)
- [x] E-Next2: E2E — next button → rest completes → next exercise auto-loads (RED then GREEN)
- [x] Fix: next() now calls startRestCountdown() via setTimeout (same pattern as advanceStep) instead of directly setting rest state without starting interval
- [x] Fix: next() reads stateRef.current synchronously to avoid stale closure
- [x] 15/15 E2E tests passing
- [x] 18/18 unit tests passing

## Next Button Bug Fix (TDD)
- [x] Add data-testid="next-exercise-btn" to ExerciseInfoCard next button
- [x] E-Next1: E2E — next button → rest screen countdown actually ticks (RED then GREEN)
- [x] E-Next2: E2E — next button → rest completes → next exercise auto-loads (RED then GREEN)
- [x] Fix: next() now calls startRestCountdown() via setTimeout (same pattern as advanceStep) instead of directly setting rest state without starting interval
- [x] Fix: next() reads stateRef.current synchronously to avoid stale closure
- [x] 15/15 E2E tests passing
- [x] 18/18 unit tests passing

## Desktop Layout Pixel-Perfect Fix
- [x] Capture current screenshot and compare with reference design
- [x] Fix animation card: white card, rounded corners, proper aspect ratio, centered image
- [x] Fix info card: proper spacing, typography, timer bar, tip section
- [x] Pixel-perfect match reference screenshot
- [x] Add style prop to ExerciseAnimation component
- [x] Increase image padding to 2.5rem for more whitespace
- [x] Set animation card height to min(48vh, 400px)
- [x] Use items-center + overflow-y-auto for vertical centering
- [x] 15/15 E2E tests passing after layout changes

## GPT Integration Update
- [x] Fix hardcoded hostname in server API response (play_url)
- [x] Generate updated GPT prompt file with new hostname
- [x] Generate updated OpenAPI action schema with new hostname
- [x] Create skill to auto-generate GPT prompt + action schema

## Public Pages & Footer
- [x] New landing page at / (hero, how it works, CTA)
- [x] Move JSON compiler from / to /compile
- [x] Global Footer component (About, Privacy, Terms links)
- [x] Footer added to Home, Library, About, Privacy, Terms pages
- [x] About page (/about)
- [x] Privacy Policy page (/privacy)
- [x] Terms of Service page (/terms)
- [x] Update App.tsx routes

## GPT System Prompt Schema Update
- [x] Rewrite system-prompt.md to match new schema (duration_sec required, no mode, sets/set_rest_sec/rest_after_sec all required, label optional, removed fields list)
- [x] Update skill template to match

## Logo & Navigation Improvements
- [x] Generate new PromptFit logo (kettlebell + lightning bolt, Apple icon style)
- [x] Create shared SiteLogo component (links to /)
- [x] Use SiteLogo in all page headers (Landing, Home/Compiler, Library, About, Privacy, Terms)
- [x] Replace "<-- Library" on /play page with SiteLogo component
- [x] Fix Library Play button (was using hash URL, now calls /api/get-plan-id → /play?id=...)

## Skip Rest Bug Fix (TDD)
- [x] Write failing E2E test: E-SkipAll (next + skip rest all the way, last exercise completes normally → congratulation)
- [x] Fix next() to set pendingNextSet/pendingNextIndex before calling startRestCountdown
- [x] Verify all E2E tests pass (E-SkipAll uses strict 800ms timeout to catch regression)

## Workout Player Improvements (Phase 2)

### C. Overall Timer Fix
- [ ] Fix workoutElapsed to increment every second regardless of status (playing or rest), only pause when status === 'paused'
- [ ] U-Timer1: unit test — elapsed increments during rest status
- [ ] U-Timer2: unit test — elapsed pauses when status === 'paused'

### B. Calorie Data
- [ ] Add MET value to each exercise in exercises.ts
- [ ] Add calorie estimation helper: calories = MET × weight(kg) × duration(hours)
- [ ] U-Cal1: unit test for calorie calculation helper

### A. Get Ready Screen Upgrade
- [ ] Display exercise checklist: name, sets × reps/duration, set_rest_sec, rest_after_sec
- [ ] Display two time totals: pure workout time (no rest) vs total time (with rest)
- [ ] Display estimated calorie burn (footnote: based on 70kg adult)
- [ ] E-GetReady1: E2E — get-ready screen shows exercise list and time estimates

### D. Rest Screen Redesign (inline, future ad slot)
- [x] Remove full-screen dark rest screen (data-testid="rest-screen" removed)
- [x] Animation card shows large "Rest" text (data-testid="rest-label") instead of exercise image
- [x] Info card shows "Next up: [exercise name]" during rest
- [x] No separate skip-rest-btn — use next-exercise-btn to skip rest
- [x] Pause button still works during rest
- [x] Timer bar counts down rest time
- [x] Update waitForRestScreen helper to wait for data-testid="rest-label"
- [x] Update all existing skip-rest-btn clicks to use next-exercise-btn
- [x] E-Rest1: E2E — rest shows rest-label in animation card, next-exercise-btn visible
- [x] E-Rest2: E2E — click next-exercise-btn during rest → rest-label disappears in 800ms
- [x] 18/18 E2E tests pass after redesign
