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
