/**
 * Workout Renderer — Schema & Validator
 * Design: Apple Fitness+ Inspired "Luminous Minimal"
 * Validates incoming workout JSON against the PRD-defined schema.
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

export const MODES = ['reps', 'timer'] as const;
export type Mode = typeof MODES[number];

export interface WorkoutStep {
  type: StepType;
  exercise_id: ExerciseId;
  mode: Mode;
  reps?: number;
  duration_sec?: number;
  countdown_sec?: number;
  label?: string;
  note?: string;
  sets?: number;
  /**
   * Rest between sets of the SAME exercise (seconds).
   * Only meaningful when sets > 1. Defaults to 45s if omitted.
   * Example: sets=3, set_rest_sec=60 → 60s rest after set 1 and set 2.
   */
  set_rest_sec?: number;
  /**
   * Rest after this exercise before the NEXT exercise (seconds).
   * Ignored on the last step (nothing follows). Defaults to 30s if omitted.
   * Example: rest_after_sec=30 → 30s rest before the next exercise begins.
   */
  rest_after_sec?: number;
  weight_kg?: number;
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

    // type
    if (!s.type) {
      errors.push({ path: `${prefix}.type`, message: 'type is required' });
    } else if (!STEP_TYPES.includes(s.type as StepType)) {
      errors.push({
        path: `${prefix}.type`,
        message: `type must be one of: ${STEP_TYPES.join(', ')}. Got: "${s.type}"`,
      });
    }

    // exercise_id
    if (!s.exercise_id) {
      errors.push({ path: `${prefix}.exercise_id`, message: 'exercise_id is required' });
    } else if (!(ALLOWED_EXERCISE_IDS as readonly string[]).includes(s.exercise_id as string)) {
      errors.push({
        path: `${prefix}.exercise_id`,
        message: `Unknown exercise_id: "${s.exercise_id}". Must be one of the 100 allowed IDs.`,
      });
    }

    // mode
    if (!s.mode) {
      errors.push({ path: `${prefix}.mode`, message: 'mode is required' });
    } else if (!MODES.includes(s.mode as Mode)) {
      errors.push({
        path: `${prefix}.mode`,
        message: `mode must be "reps" or "timer". Got: "${s.mode}"`,
      });
    } else {
      // mode-specific validation
      if (s.mode === 'reps') {
        if (s.reps === undefined || s.reps === null) {
          errors.push({
            path: `${prefix}.reps`,
            message: 'reps is required when mode is "reps"',
          });
        } else if (typeof s.reps !== 'number' || s.reps <= 0 || !Number.isInteger(s.reps)) {
          errors.push({
            path: `${prefix}.reps`,
            message: 'reps must be a positive integer',
          });
        }
      }

      if (s.mode === 'timer') {
        if (s.duration_sec === undefined || s.duration_sec === null) {
          errors.push({
            path: `${prefix}.duration_sec`,
            message: 'duration_sec is required when mode is "timer"',
          });
        } else if (typeof s.duration_sec !== 'number' || s.duration_sec <= 0) {
          errors.push({
            path: `${prefix}.duration_sec`,
            message: 'duration_sec must be a positive number',
          });
        }
      }
    }

    // Optional numeric fields
    if (s.countdown_sec !== undefined && (typeof s.countdown_sec !== 'number' || s.countdown_sec < 0)) {
      errors.push({ path: `${prefix}.countdown_sec`, message: 'countdown_sec must be a non-negative number' });
    }
    if (s.sets !== undefined && (typeof s.sets !== 'number' || s.sets <= 0 || !Number.isInteger(s.sets))) {
      errors.push({ path: `${prefix}.sets`, message: 'sets must be a positive integer' });
    }
    if (s.set_rest_sec !== undefined && (typeof s.set_rest_sec !== 'number' || s.set_rest_sec < 0)) {
      errors.push({ path: `${prefix}.set_rest_sec`, message: 'set_rest_sec must be a non-negative number' });
    }
    if (s.rest_after_sec !== undefined && (typeof s.rest_after_sec !== 'number' || s.rest_after_sec < 0)) {
      errors.push({ path: `${prefix}.rest_after_sec`, message: 'rest_after_sec must be a non-negative number' });
    }
    // Backward compatibility: accept legacy rest_sec and map to set_rest_sec
    if (s.rest_sec !== undefined && (typeof s.rest_sec !== 'number' || s.rest_sec < 0)) {
      errors.push({ path: `${prefix}.rest_sec`, message: 'rest_sec must be a non-negative number (deprecated, use set_rest_sec or rest_after_sec)' });
    }
    if (s.weight_kg !== undefined && (typeof s.weight_kg !== 'number' || s.weight_kg < 0)) {
      errors.push({ path: `${prefix}.weight_kg`, message: 'weight_kg must be a non-negative number' });
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
  // Strip leading # or ? before parsing
  const stripped = hashOrSearch.startsWith('#') || hashOrSearch.startsWith('?')
    ? hashOrSearch.slice(1)
    : hashOrSearch;
  const params = new URLSearchParams(stripped);
  const raw = params.get('data');
  if (!raw) return null;

  // Try base64url / base64 decode first, then fall back to raw JSON
  let jsonString = raw;
  try {
    // Convert base64url → standard base64: replace - with +, _ with /, add padding
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/')
      + '=='.slice(0, (4 - (raw.length % 4)) % 4);
    const decoded = atob(b64);
    // Verify it looks like JSON
    if (decoded.trim().startsWith('{') || decoded.trim().startsWith('[')) {
      jsonString = decoded;
    }
  } catch {
    // Not base64/base64url, use raw
  }

  return parseAndValidateWorkout(jsonString);
}
