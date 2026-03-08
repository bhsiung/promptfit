/**
 * Timeline Elapsed Unit Tests — computeElapsedBase
 *
 * TDD: Tests written FIRST (RED), then implementation added to make them GREEN.
 *
 * computeElapsedBase(steps, stepIndex, setNumber) returns the timeline position
 * (in seconds) at the START of the given step/set.
 *
 * Formula:
 *   For each step before stepIndex:
 *     + step.duration_sec * step.sets
 *     + step.set_rest_sec * (step.sets - 1)
 *     + step.rest_after_sec  (except for the very last step in the workout)
 *   For the current step (stepIndex), add the time for completed sets:
 *     + (setNumber - 1) * (step.duration_sec + step.set_rest_sec)
 *
 * Examples using Workout C (push_up 9s×2sets, set_rest=2s, rest_after=2s; plank 2s):
 *   computeElapsedBase(steps, 0, 1) = 0         (start of push_up set1)
 *   computeElapsedBase(steps, 0, 2) = 9+2 = 11  (start of push_up set2)
 *   computeElapsedBase(steps, 1, 1) = 9+2+9+2 = 22  (start of plank)
 *
 * Skip behavior:
 *   When next() is called during an exercise:
 *     elapsed jumps to computeElapsedBase(steps, stepIndex, set) + step.duration_sec
 *   When skipRest() is called during rest:
 *     elapsed jumps to computeElapsedBase(steps, nextStepIndex, nextSet)
 */

import { describe, expect, it } from 'vitest';
import { computeElapsedBase, expandUnilateralSteps } from './useWorkoutPlayer';
import type { InternalStep } from './useWorkoutPlayer';
import type { WorkoutPlan } from '@/lib/workoutSchema';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const workoutA: WorkoutPlan = {
  title: 'Reps Mode Test',
  description: '',
  steps: [
    { type: 'work', exercise_id: 'push_up', duration_sec: 9, reps: 3, sets: 1, set_rest_sec: 0, rest_after_sec: 2 },
    { type: 'work', exercise_id: 'bodyweight_squat', duration_sec: 9, reps: 3, sets: 1, set_rest_sec: 0, rest_after_sec: 0 },
  ],
};

const workoutB: WorkoutPlan = {
  title: 'Timer Mode Test',
  description: '',
  steps: [
    { type: 'work', exercise_id: 'plank', duration_sec: 3, sets: 1, set_rest_sec: 0, rest_after_sec: 2 },
    { type: 'work', exercise_id: 'mountain_climber', duration_sec: 2, sets: 1, set_rest_sec: 0, rest_after_sec: 0 },
  ],
};

const workoutC: WorkoutPlan = {
  title: 'Sets Mode Test',
  description: '',
  steps: [
    { type: 'work', exercise_id: 'push_up', duration_sec: 9, reps: 3, sets: 2, set_rest_sec: 2, rest_after_sec: 2 },
    { type: 'work', exercise_id: 'plank', duration_sec: 2, sets: 1, set_rest_sec: 0, rest_after_sec: 0 },
  ],
};

const workoutD: WorkoutPlan = {
  title: 'Unilateral Test',
  description: '',
  steps: [
    { type: 'work', exercise_id: 'side_plank', duration_sec: 6, sets: 1, set_rest_sec: 0, rest_after_sec: 0 },
    { type: 'work', exercise_id: 'push_up', duration_sec: 4, sets: 1, set_rest_sec: 0, rest_after_sec: 0 },
  ],
};

// ─── U-Timeline: computeElapsedBase ──────────────────────────────────────────

describe('computeElapsedBase — Workout A (single sets, rest_after=2)', () => {
  const steps = expandUnilateralSteps(workoutA) as InternalStep[];
  // Timeline: push_up(9) → rest(2) → squat(9) = 20s total

  it('U-Timeline-A1: step 0, set 1 → elapsed base = 0', () => {
    expect(computeElapsedBase(steps, 0, 1)).toBe(0);
  });

  it('U-Timeline-A2: step 1, set 1 → elapsed base = 9 + 2 = 11 (push_up + rest_after)', () => {
    expect(computeElapsedBase(steps, 1, 1)).toBe(11);
  });

  it('U-Timeline-A3: skip push_up → elapsed jumps to 9 (push_up end = base + duration)', () => {
    const base = computeElapsedBase(steps, 0, 1);
    const skipTarget = base + steps[0].duration_sec;
    expect(skipTarget).toBe(9);
  });

  it('U-Timeline-A4: skip rest after push_up → elapsed jumps to 11 (squat start)', () => {
    // After skipping rest, elapsed = computeElapsedBase(steps, 1, 1)
    expect(computeElapsedBase(steps, 1, 1)).toBe(11);
  });
});

describe('computeElapsedBase — Workout B (single sets, rest_after=2)', () => {
  const steps = expandUnilateralSteps(workoutB) as InternalStep[];
  // Timeline: plank(3) → rest(2) → climber(2) = 7s total

  it('U-Timeline-B1: step 0, set 1 → elapsed base = 0', () => {
    expect(computeElapsedBase(steps, 0, 1)).toBe(0);
  });

  it('U-Timeline-B2: step 1, set 1 → elapsed base = 3 + 2 = 5', () => {
    expect(computeElapsedBase(steps, 1, 1)).toBe(5);
  });

  it('U-Timeline-B3: skip plank → elapsed jumps to 3 (plank end)', () => {
    const skipTarget = computeElapsedBase(steps, 0, 1) + steps[0].duration_sec;
    expect(skipTarget).toBe(3);
  });
});

describe('computeElapsedBase — Workout C (2 sets, set_rest=2, rest_after=2)', () => {
  const steps = expandUnilateralSteps(workoutC) as InternalStep[];
  // Timeline: push_up-set1(9) → set_rest(2) → push_up-set2(9) → ex_rest(2) → plank(2) = 24s

  it('U-Timeline-C1: step 0, set 1 → elapsed base = 0', () => {
    expect(computeElapsedBase(steps, 0, 1)).toBe(0);
  });

  it('U-Timeline-C2: step 0, set 2 → elapsed base = 9 + 2 = 11 (set1 + set_rest)', () => {
    expect(computeElapsedBase(steps, 0, 2)).toBe(11);
  });

  it('U-Timeline-C3: step 1, set 1 → elapsed base = 9 + 2 + 9 + 2 = 22 (both sets + set_rest + ex_rest)', () => {
    expect(computeElapsedBase(steps, 1, 1)).toBe(22);
  });

  it('U-Timeline-C4: skip set1 → elapsed jumps to 9 (set1 end)', () => {
    const skipTarget = computeElapsedBase(steps, 0, 1) + steps[0].duration_sec;
    expect(skipTarget).toBe(9);
  });

  it('U-Timeline-C5: skip set_rest → elapsed jumps to 11 (set2 start)', () => {
    expect(computeElapsedBase(steps, 0, 2)).toBe(11);
  });

  it('U-Timeline-C6: skip set2 → elapsed jumps to 20 (set2 end = 11 + 9)', () => {
    const skipTarget = computeElapsedBase(steps, 0, 2) + steps[0].duration_sec;
    expect(skipTarget).toBe(20);
  });

  it('U-Timeline-C7: skip ex_rest → elapsed jumps to 22 (plank start)', () => {
    expect(computeElapsedBase(steps, 1, 1)).toBe(22);
  });
});

describe('computeElapsedBase — Workout D (unilateral, no rest)', () => {
  const steps = expandUnilateralSteps(workoutD) as InternalStep[];
  // Expanded: side_plank-Left(3) → side_plank-Right(3) → push_up(4) = 10s total
  // No rest_after between any steps

  it('U-Timeline-D1: step 0 (Left), set 1 → elapsed base = 0', () => {
    expect(computeElapsedBase(steps, 0, 1)).toBe(0);
  });

  it('U-Timeline-D2: step 1 (Right), set 1 → elapsed base = 3 (Left duration, no rest)', () => {
    expect(computeElapsedBase(steps, 1, 1)).toBe(3);
  });

  it('U-Timeline-D3: step 2 (push_up), set 1 → elapsed base = 3 + 3 = 6', () => {
    expect(computeElapsedBase(steps, 2, 1)).toBe(6);
  });
});

// ─── U-Timeline: skip elapsed jump calculations ───────────────────────────────

describe('skip elapsed jump — E-SkipAll scenario (Workout C)', () => {
  const steps = expandUnilateralSteps(workoutC) as InternalStep[];

  it('U-SkipAll-1: start → set1 entry elapsed = 0', () => {
    expect(computeElapsedBase(steps, 0, 1)).toBe(0);
  });

  it('U-SkipAll-2: skip set1 → elapsed jumps to 9 (set1 end)', () => {
    const jumpTo = computeElapsedBase(steps, 0, 1) + steps[0].duration_sec;
    expect(jumpTo).toBe(9);
  });

  it('U-SkipAll-3: skip set_rest → elapsed jumps to 11 (set2 start)', () => {
    expect(computeElapsedBase(steps, 0, 2)).toBe(11);
  });

  it('U-SkipAll-4: skip set2 → elapsed jumps to 20 (set2 end)', () => {
    const jumpTo = computeElapsedBase(steps, 0, 2) + steps[0].duration_sec;
    expect(jumpTo).toBe(20);
  });

  it('U-SkipAll-5: skip ex_rest → elapsed jumps to 22 (plank start)', () => {
    expect(computeElapsedBase(steps, 1, 1)).toBe(22);
  });

  it('U-SkipAll-6: plank completes naturally → elapsed = 24 (total)', () => {
    const plankEnd = computeElapsedBase(steps, 1, 1) + steps[1].duration_sec;
    expect(plankEnd).toBe(24);
  });
});
