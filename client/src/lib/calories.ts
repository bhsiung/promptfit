/**
 * Calorie estimation helper
 * Formula: calories = MET × weightKg × durationHours
 * MET values from Compendium of Physical Activities (Ainsworth et al.)
 */

import { EXERCISE_MAP, CATEGORY_MET_FALLBACK } from './exercises';
import type { WorkoutStep } from './workoutSchema';

/** Global fallback MET when exercise is unknown and has no category info */
const UNKNOWN_MET_FALLBACK = 5.0;

/**
 * Estimate total calories burned for a workout.
 * @param steps  Expanded workout steps (after unilateral expansion if needed)
 * @param weightKg  User body weight in kg (default: 70)
 * @returns Estimated kilocalories burned (rounded to 1 decimal)
 */
export function estimateCalories(steps: WorkoutStep[], weightKg = 70): number {
  if (steps.length === 0) return 0;

  let totalKcal = 0;

  for (const step of steps) {
    const exercise = EXERCISE_MAP.get(step.exercise_id);

    // Resolve MET: exercise-specific → category fallback → global fallback
    let met: number;
    if (exercise?.met) {
      met = exercise.met;
    } else if (exercise?.category) {
      met = CATEGORY_MET_FALLBACK[exercise.category];
    } else {
      met = UNKNOWN_MET_FALLBACK;
    }

    // Total active seconds = duration × sets (set_rest not counted as exercise)
    const totalActiveSec = step.duration_sec * (step.sets ?? 1);
    const durationHours = totalActiveSec / 3600;

    totalKcal += met * weightKg * durationHours;
  }

  return totalKcal;
}

/**
 * Format calories for display.
 * @returns e.g. "~45 kcal" or "~120 kcal"
 */
export function formatCalories(kcal: number): string {
  return `~${Math.round(kcal)} kcal`;
}
