/**
 * Workout Renderer — Schema & Validator
 *
 * @see SCHEMA.md for full field reference and GPT prompt guidance.
 *
 * Design principle: every field that affects runtime behaviour is REQUIRED and explicit.
 * No hidden defaults. What you write is exactly what the player executes.
 */

export const ALLOWED_EXERCISE_IDS = [
  // Lower Body (25)
  'bodyweight_squat', 'goblet_squat', 'db_back_squat', 'kb_front_squat',
  'sumo_squat', 'split_squat', 'bulgarian_split_squat', 'reverse_lunge',
  'forward_lunge', 'walking_lunge', 'lateral_lunge', 'curtsy_lunge',
  'step_up', 'box_step_up', 'glute_bridge', 'single_leg_glute_bridge',
  'hip_thrust', 'db_rdl', 'single_leg_rdl', 'kb_deadlift', 'sumo_deadlift',
  'calf_raise', 'single_leg_calf_raise', 'wall_sit', 'kb_swing',
  // Push Upper (15)
  'push_up', 'incline_push_up', 'decline_push_up', 'diamond_push_up',
  'db_floor_press', 'db_bench_press', 'incline_db_press', 'db_shoulder_press',
  'arnold_press', 'lateral_raise', 'front_raise', 'pike_push_up',
  'tricep_dip', 'overhead_tricep_extension', 'close_grip_press',
  // Pull Upper/Back (20)
  'pull_up', 'chin_up', 'neutral_grip_pull_up', 'assisted_pull_up',
  'inverted_row', 'db_row', 'single_arm_db_row', 'renegade_row',
  'face_pull', 'rear_delt_raise', 'hammer_curl', 'bicep_curl',
  'concentration_curl', 'preacher_curl', 'upright_row', 'lat_pulldown',
  'band_pull_apart', 'dead_hang', 'scapular_pull_up', 'high_row',
  // Core (20)
  'plank', 'side_plank', 'hollow_hold', 'dead_bug', 'hanging_leg_raise',
  'hanging_knee_raise', 'lying_leg_raise', 'reverse_crunch', 'russian_twist',
  'bicycle_crunch', 'mountain_climber', 'v_up', 'toe_touch_crunch',
  'flutter_kick', 'ab_rollout', 'cable_crunch', 'bird_dog', 'superman_hold',
  'side_plank_reach', 'woodchopper',
  // Conditioning / Full Body (20)
  'burpee', 'squat_jump', 'lunge_jump', 'skater_jump', 'box_jump',
  'high_knees', 'butt_kicks', 'battle_rope_wave', 'kb_clean', 'kb_snatch',
  'db_thruster', 'clean_and_press', 'farmer_carry', 'suitcase_carry',
  'bear_crawl', 'crab_walk', 'sled_push', 'sled_pull', 'rowing_machine',
  'jump_rope',
] as const;

export type ExerciseId = typeof ALLOWED_EXERCISE_IDS[number];

export const STEP_TYPES = ['warmup', 'work', 'core', 'rest', 'transition', 'cue', 'check'] as const;
export type StepType = typeof STEP_TYPES[number];

/**
 * A single exercise step in a workout plan.
 *
 * All fields that affect runtime behaviour are REQUIRED.
 * The player executes exactly what is written — no hidden defaults.
 */
export interface WorkoutStep {
  /** Step category. Use "work" for main exercises, "warmup"/"core" for blocks. */
  type: StepType;

  /** Exercise identifier. Must be one of the 100 allowed IDs. */
  exercise_id: ExerciseId;

  /**
   * How long this step runs, in seconds. REQUIRED for all steps.
   * For rep-based exercises, set this to the time budget (e.g. reps × 3s).
   * The timer counts down from this value regardless of whether reps is set.
   */
  duration_sec: number;

  /**
   * Target rep count. OPTIONAL.
   * When present, the UI displays "X reps" as the goal alongside the timer.
   * When absent, the UI shows only the countdown timer.
   */
  reps?: number;

  /**
   * Number of sets. REQUIRED. Use 1 if there are no repeated sets.
   * When sets > 1, the player will rest for set_rest_sec between each set.
   */
  sets: number;

  /**
   * Rest between sets of the SAME exercise, in seconds. REQUIRED when sets > 1.
   * Ignored (and may be omitted or set to 0) when sets = 1.
   * Example: sets=3, set_rest_sec=60 → 60s rest after set 1 and set 2.
   */
  set_rest_sec: number;

  /**
   * Rest after this exercise before the NEXT exercise begins, in seconds. REQUIRED.
   * Set to 0 if no rest is needed. Ignored on the last step.
   * Example: rest_after_sec=30 → 30s rest screen before the next exercise.
   */
  rest_after_sec: number;

  /**
   * Optional display name override. When provided, shown instead of the
   * exercise_id lookup name. Useful for adding weight info, e.g. "DB Row (12 kg)".
   */
  label?: string;
}

export interface WorkoutPlan {
  version?: string;
  title?: string;
  description?: string;
  total_duration_sec?: number;
  steps: WorkoutStep[];
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  plan?: WorkoutPlan;
}

/**
 * Validate a workout plan JSON object against the schema.
 */
export function validateWorkoutPlan(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      valid: false,
      errors: [{ path: 'root', message: 'Workout plan must be a JSON object' }],
    };
  }

  const plan = data as Record<string, unknown>;

  // Validate steps array
  if (!Array.isArray(plan.steps)) {
    errors.push({ path: 'steps', message: 'steps must be an array' });
    return { valid: false, errors };
  }

  if (plan.steps.length === 0) {
    errors.push({ path: 'steps', message: 'steps array must not be empty' });
  }

  // Validate each step
  (plan.steps as unknown[]).forEach((step, index) => {
    const prefix = `steps[${index}]`;

    if (typeof step !== 'object' || step === null) {
      errors.push({ path: prefix, message: 'Each step must be an object' });
      return;
    }

    const s = step as Record<string, unknown>;

    // type — required
    if (!s.type) {
      errors.push({ path: `${prefix}.type`, message: 'type is required' });
    } else if (!STEP_TYPES.includes(s.type as StepType)) {
      errors.push({
        path: `${prefix}.type`,
        message: `type must be one of: ${STEP_TYPES.join(', ')}. Got: "${s.type}"`,
      });
    }

    // exercise_id — required
    if (!s.exercise_id) {
      errors.push({ path: `${prefix}.exercise_id`, message: 'exercise_id is required' });
    } else if (!(ALLOWED_EXERCISE_IDS as readonly string[]).includes(s.exercise_id as string)) {
      errors.push({
        path: `${prefix}.exercise_id`,
        message: `Unknown exercise_id: "${s.exercise_id}". Must be one of the ${ALLOWED_EXERCISE_IDS.length} allowed IDs.`,
      });
    }

    // duration_sec — required for all steps
    if (s.duration_sec === undefined || s.duration_sec === null) {
      errors.push({
        path: `${prefix}.duration_sec`,
        message: 'duration_sec is required for all steps',
      });
    } else if (typeof s.duration_sec !== 'number' || s.duration_sec <= 0) {
      errors.push({
        path: `${prefix}.duration_sec`,
        message: 'duration_sec must be a positive number',
      });
    }

    // reps — optional, but must be valid if present
    if (s.reps !== undefined && s.reps !== null) {
      if (typeof s.reps !== 'number' || s.reps <= 0 || !Number.isInteger(s.reps)) {
        errors.push({ path: `${prefix}.reps`, message: 'reps must be a positive integer' });
      }
    }

    // sets — required
    if (s.sets === undefined || s.sets === null) {
      errors.push({ path: `${prefix}.sets`, message: 'sets is required (use 1 if no repeated sets)' });
    } else if (typeof s.sets !== 'number' || s.sets <= 0 || !Number.isInteger(s.sets)) {
      errors.push({ path: `${prefix}.sets`, message: 'sets must be a positive integer' });
    }

    // set_rest_sec — required
    if (s.set_rest_sec === undefined || s.set_rest_sec === null) {
      errors.push({
        path: `${prefix}.set_rest_sec`,
        message: 'set_rest_sec is required (use 0 when sets = 1)',
      });
    } else if (typeof s.set_rest_sec !== 'number' || s.set_rest_sec < 0) {
      errors.push({ path: `${prefix}.set_rest_sec`, message: 'set_rest_sec must be a non-negative number' });
    }

    // rest_after_sec — required
    if (s.rest_after_sec === undefined || s.rest_after_sec === null) {
      errors.push({
        path: `${prefix}.rest_after_sec`,
        message: 'rest_after_sec is required (use 0 for no rest)',
      });
    } else if (typeof s.rest_after_sec !== 'number' || s.rest_after_sec < 0) {
      errors.push({ path: `${prefix}.rest_after_sec`, message: 'rest_after_sec must be a non-negative number' });
    }

    // label — optional string
    if (s.label !== undefined && typeof s.label !== 'string') {
      errors.push({ path: `${prefix}.label`, message: 'label must be a string' });
    }

    // Warn about removed fields (backward compat: reject cleanly)
    for (const removed of ['mode', 'weight_kg', 'countdown_sec', 'note', 'rest_sec']) {
      if (s[removed] !== undefined) {
        errors.push({
          path: `${prefix}.${removed}`,
          message: `"${removed}" is no longer part of the schema and must be removed`,
        });
      }
    }
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], plan: plan as unknown as WorkoutPlan };
}

/**
 * Parse and validate JSON string.
 */
export function parseAndValidateWorkout(jsonString: string): ValidationResult {
  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch (e) {
    return {
      valid: false,
      errors: [{ path: 'json', message: `Invalid JSON: ${(e as Error).message}` }],
    };
  }
  return validateWorkoutPlan(data);
}

/**
 * Parse workout plan from URL hash or search params.
 * Supports: #data=<base64url-or-json>  (preferred — hash is never sent to server)
 * Also supports legacy: ?data=<base64url-or-json>
 *
 * Encoding priority:
 *   1. base64url (URL-safe: uses - and _ instead of + and /, no padding)
 *   2. standard base64 (with + / and optional = padding)
 *   3. raw JSON string (percent-encoded via encodeURIComponent)
 */
export function parseWorkoutFromUrl(hashOrSearch: string): ValidationResult | null {
  const stripped = hashOrSearch.startsWith('#') || hashOrSearch.startsWith('?')
    ? hashOrSearch.slice(1)
    : hashOrSearch;
  const params = new URLSearchParams(stripped);
  const raw = params.get('data');
  if (!raw) return null;

  let jsonString = raw;
  try {
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/')
      + '=='.slice(0, (4 - (raw.length % 4)) % 4);
    const decoded = atob(b64);
    if (decoded.trim().startsWith('{') || decoded.trim().startsWith('[')) {
      jsonString = decoded;
    }
  } catch {
    // Not base64/base64url, use raw
  }

  return parseAndValidateWorkout(jsonString);
}
