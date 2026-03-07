# PromptFit Workout Schema

> **Design principle:** every field that affects runtime behaviour is **required** and explicit.
> No hidden defaults. What you write is exactly what the player executes.

---

## `WorkoutPlan`

```json
{
  "title": "Push Day",
  "description": "Upper body push-focused session",
  "steps": [ /* WorkoutStep[] */ ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | no | Shown in the player header |
| `description` | string | no | Subtitle on the idle screen |
| `steps` | WorkoutStep[] | **yes** | At least one step required |

---

## `WorkoutStep`

```json
{
  "type": "work",
  "exercise_id": "push_up",
  "duration_sec": 30,
  "reps": 10,
  "sets": 3,
  "set_rest_sec": 60,
  "rest_after_sec": 30,
  "label": "Push-Up (bodyweight)"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | StepType | **yes** | `work`, `warmup`, `core`, `rest`, `transition`, `cue`, `check` |
| `exercise_id` | ExerciseId | **yes** | Must be one of the 100 allowed IDs (see below) |
| `duration_sec` | number | **yes** | Timer budget in seconds. For rep-based exercises, use `reps × ~3s` as a guideline |
| `reps` | number | no | When present, UI shows "X reps" as the goal alongside the countdown |
| `sets` | number | **yes** | Use `1` if there are no repeated sets |
| `set_rest_sec` | number | **yes** | Rest between sets in seconds. Use `0` when `sets = 1` |
| `rest_after_sec` | number | **yes** | Rest after this exercise before the next one, in seconds. Use `0` for no rest. Ignored on the last step |
| `label` | string | no | Overrides the display name. Useful for adding weight info, e.g. `"DB Row (12 kg)"` |

### Removed fields (will cause validation error if present)

| Field | Reason |
|-------|--------|
| `mode` | Removed — all steps are timer-driven. `reps` field signals rep display |
| `weight_kg` | Removed — include weight in `label` instead, e.g. `"Goblet Squat (16 kg)"` |
| `countdown_sec` | Removed — never implemented |
| `note` | Removed — never consumed by the player |
| `rest_sec` | Removed — use `set_rest_sec` or `rest_after_sec` |

---

## Runtime Behaviour

### Timer
Every step counts down from `duration_sec`. When the timer hits 0, the player automatically advances.

### Reps display
When `reps` is set, the UI shows **"X reps"** as the target goal. The timer still counts down — reps is purely a display hint, not a gate.

### Sets
When `sets > 1`, after each set the player shows a rest screen for `set_rest_sec` seconds, then replays the same step for the next set. After all sets complete, the `rest_after_sec` rest plays before the next exercise.

### Rest screens
- `set_rest_sec > 0` → rest screen between sets (shows "Next: same exercise, Set N")
- `rest_after_sec > 0` → rest screen after all sets complete (shows "Next: next exercise")
- Both support the **Skip Rest** button for immediate advance

---

## Allowed Exercise IDs (100 total)

### Lower Body (25)
`bodyweight_squat`, `goblet_squat`, `db_back_squat`, `kb_front_squat`, `sumo_squat`, `split_squat`, `bulgarian_split_squat`, `reverse_lunge`, `forward_lunge`, `walking_lunge`, `lateral_lunge`, `curtsy_lunge`, `step_up`, `box_step_up`, `glute_bridge`, `single_leg_glute_bridge`, `hip_thrust`, `db_rdl`, `single_leg_rdl`, `kb_deadlift`, `sumo_deadlift`, `calf_raise`, `single_leg_calf_raise`, `wall_sit`, `kb_swing`

### Push Upper (15)
`push_up`, `incline_push_up`, `decline_push_up`, `diamond_push_up`, `db_floor_press`, `db_bench_press`, `incline_db_press`, `db_shoulder_press`, `arnold_press`, `lateral_raise`, `front_raise`, `pike_push_up`, `tricep_dip`, `overhead_tricep_extension`, `close_grip_press`

### Pull Upper / Back (20)
`pull_up`, `chin_up`, `neutral_grip_pull_up`, `assisted_pull_up`, `inverted_row`, `db_row`, `single_arm_db_row`, `renegade_row`, `face_pull`, `rear_delt_raise`, `hammer_curl`, `bicep_curl`, `concentration_curl`, `preacher_curl`, `upright_row`, `lat_pulldown`, `band_pull_apart`, `dead_hang`, `scapular_pull_up`, `high_row`

### Core (20)
`plank`, `side_plank`, `hollow_hold`, `dead_bug`, `hanging_leg_raise`, `hanging_knee_raise`, `lying_leg_raise`, `reverse_crunch`, `russian_twist`, `bicycle_crunch`, `mountain_climber`, `v_up`, `toe_touch_crunch`, `flutter_kick`, `ab_rollout`, `cable_crunch`, `bird_dog`, `superman_hold`, `side_plank_reach`, `woodchopper`

### Conditioning / Full Body (20)
`burpee`, `squat_jump`, `lunge_jump`, `skater_jump`, `box_jump`, `high_knees`, `butt_kicks`, `battle_rope_wave`, `kb_clean`, `kb_snatch`, `db_thruster`, `clean_and_press`, `farmer_carry`, `suitcase_carry`, `bear_crawl`, `crab_walk`, `sled_push`, `sled_pull`, `rowing_machine`, `jump_rope`

---

## GPT Prompt Guidance

When generating a workout plan for PromptFit, produce a JSON object matching this schema exactly. Key rules:

1. **Always include all required fields** — `type`, `exercise_id`, `duration_sec`, `sets`, `set_rest_sec`, `rest_after_sec`
2. **`duration_sec` for rep-based exercises** — multiply target reps by ~3 seconds per rep as a time budget (e.g. 10 push-ups → `duration_sec: 30`)
3. **`reps` is optional** — include it when you want the UI to show "X reps" as the goal
4. **`rest_after_sec: 0`** on the last step (nothing follows it)
5. **Weight in label** — if the exercise uses equipment with a specific weight, put it in `label`: `"DB Row (12 kg)"`
6. **Do not include** `mode`, `weight_kg`, `countdown_sec`, `note` — these fields are no longer valid

### Minimal example (no sets, no rest)
```json
{
  "title": "Quick Core",
  "steps": [
    { "type": "work", "exercise_id": "plank", "duration_sec": 30, "sets": 1, "set_rest_sec": 0, "rest_after_sec": 0 }
  ]
}
```

### Full example (reps + sets + rest)
```json
{
  "title": "Push Day",
  "description": "3 sets of push-ups and dips",
  "steps": [
    {
      "type": "work",
      "exercise_id": "push_up",
      "duration_sec": 30,
      "reps": 10,
      "sets": 3,
      "set_rest_sec": 60,
      "rest_after_sec": 90
    },
    {
      "type": "work",
      "exercise_id": "tricep_dip",
      "duration_sec": 24,
      "reps": 8,
      "sets": 3,
      "set_rest_sec": 60,
      "rest_after_sec": 0
    }
  ]
}
```
