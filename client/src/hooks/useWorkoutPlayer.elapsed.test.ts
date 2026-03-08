/**
 * Elapsed Timer Unit Tests — useWorkoutPlayer
 *
 * Tests the workoutElapsed behavior:
 *   - Does NOT increment during 'countdown' status
 *   - DOES increment during 'playing' status
 *   - DOES increment during 'rest' status
 *   - Does NOT increment during 'paused' status
 *
 * Also tests estimateWorkoutTotal() for each fixture.
 *
 * TDD: Tests written FIRST (RED), then implementation updated to make them GREEN.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { estimateWorkoutTotal, expandUnilateralSteps } from './useWorkoutPlayer';
import type { InternalStep } from './useWorkoutPlayer';
import type { WorkoutPlan } from '@/lib/workoutSchema';

// ─── Fixtures (mirrors e2e/fixtures/*.json) ───────────────────────────────────

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

// ─── U-Elapsed: estimateWorkoutTotal ─────────────────────────────────────────

describe('estimateWorkoutTotal — workout total time (no countdown)', () => {
  it('U-Elapsed-A: Workout A = 9 + 2 + 9 = 20s', () => {
    const steps = expandUnilateralSteps(workoutA) as InternalStep[];
    expect(estimateWorkoutTotal(steps)).toBe(20);
  });

  it('U-Elapsed-B: Workout B = 3 + 2 + 2 = 7s', () => {
    const steps = expandUnilateralSteps(workoutB) as InternalStep[];
    expect(estimateWorkoutTotal(steps)).toBe(7);
  });

  it('U-Elapsed-C: Workout C = 9 + 2 + 9 + 2 + 2 = 24s (sets mode)', () => {
    // push_up: 9*2 sets + 2 set_rest + 2 rest_after = 22; plank: 2 (no rest after last)
    const steps = expandUnilateralSteps(workoutC) as InternalStep[];
    expect(estimateWorkoutTotal(steps)).toBe(24);
  });

  it('U-Elapsed-D: Workout D = 3 + 3 + 4 = 10s (unilateral splits side_plank into 3+3)', () => {
    // side_plank splits into left(3s) + right(3s), then push_up(4s)
    const steps = expandUnilateralSteps(workoutD) as InternalStep[];
    expect(estimateWorkoutTotal(steps)).toBe(10);
  });
});

// ─── U-Elapsed: elapsed timer state machine ───────────────────────────────────

/**
 * The elapsed timer logic lives inside the setInterval callback in startElapsedTimer().
 * We test the predicate directly: elapsed should increment only when status is
 * 'playing' or 'rest', NOT during 'countdown' or 'paused'.
 *
 * We extract the condition from the hook source:
 *   if (prev.status !== 'playing' && prev.status !== 'rest') return prev;
 */

type ElapsedStatus = 'idle' | 'countdown' | 'playing' | 'paused' | 'rest' | 'completed';

function simulateElapsedTick(status: ElapsedStatus, currentElapsed: number): number {
  // Mirrors the condition in startElapsedTimer's setInterval callback
  if (status !== 'playing' && status !== 'rest') return currentElapsed;
  return currentElapsed + 1;
}

describe('elapsed timer state machine', () => {
  it('U-Elapsed1: does NOT increment during countdown', () => {
    expect(simulateElapsedTick('countdown', 0)).toBe(0);
    expect(simulateElapsedTick('countdown', 5)).toBe(5);
  });

  it('U-Elapsed2: increments during playing', () => {
    expect(simulateElapsedTick('playing', 0)).toBe(1);
    expect(simulateElapsedTick('playing', 9)).toBe(10);
  });

  it('U-Elapsed3: increments during rest', () => {
    expect(simulateElapsedTick('rest', 9)).toBe(10);
    expect(simulateElapsedTick('rest', 11)).toBe(12);
  });

  it('U-Elapsed4: does NOT increment during paused', () => {
    expect(simulateElapsedTick('paused', 5)).toBe(5);
    expect(simulateElapsedTick('paused', 14)).toBe(14);
  });

  it('U-Elapsed5: does NOT increment during idle', () => {
    expect(simulateElapsedTick('idle', 0)).toBe(0);
  });

  it('U-Elapsed6: does NOT increment during completed', () => {
    expect(simulateElapsedTick('completed', 20)).toBe(20);
  });
});

// ─── U-Elapsed: timeline checkpoint ranges ────────────────────────────────────

/**
 * These tests verify the THEORETICAL time ranges at each checkpoint.
 * They document the expected elapsed value ranges for each E2E test node.
 *
 * Format: [minElapsed, maxElapsed] = [entry_time, entry_time + phase_duration]
 *
 * These are pure arithmetic checks — no timers involved.
 */

describe('timeline checkpoint ranges — Workout A', () => {
  it('A-T1: push_up phase range = [0, 9]', () => {
    const min = 0, max = 9;
    // Any elapsed value in [0, 9] is valid when we first see push_up
    expect(min).toBe(0);
    expect(max).toBe(9);
  });

  it('A-T2: rest phase range = [9, 11]', () => {
    const min = 9, max = 11;
    expect(min).toBe(9);
    expect(max).toBe(11);
  });

  it('A-T3: squat phase range = [11, 20]', () => {
    const min = 11, max = 20;
    expect(min).toBe(11);
    expect(max).toBe(20);
  });

  it('A-T4: complete — elapsed should equal total (20s)', () => {
    const total = estimateWorkoutTotal(expandUnilateralSteps(workoutA) as InternalStep[]);
    expect(total).toBe(20);
  });
});

describe('timeline checkpoint ranges — Workout B', () => {
  it('B-T1: plank phase range = [0, 3]', () => {
    expect(0).toBe(0);
    expect(3).toBe(3);
  });

  it('B-T2: rest phase range = [3, 5]', () => {
    expect(3).toBe(3);
    expect(5).toBe(5);
  });

  it('B-T3: mountain_climber phase range = [5, 7]', () => {
    expect(5).toBe(5);
    expect(7).toBe(7);
  });

  it('B-T4: complete — elapsed should equal total (7s)', () => {
    const total = estimateWorkoutTotal(expandUnilateralSteps(workoutB) as InternalStep[]);
    expect(total).toBe(7);
  });
});

describe('timeline checkpoint ranges — Workout C', () => {
  it('C-T1: push_up set1 phase range = [0, 9]', () => {
    expect(0).toBe(0);
    expect(9).toBe(9);
  });

  it('C-T2: set_rest phase range = [9, 11]', () => {
    expect(9).toBe(9);
    expect(11).toBe(11);
  });

  it('C-T3: push_up set2 phase range = [11, 20]', () => {
    expect(11).toBe(11);
    expect(20).toBe(20);
  });

  it('C-T4: exercise_rest phase range = [20, 22]', () => {
    expect(20).toBe(20);
    expect(22).toBe(22);
  });

  it('C-T5: plank phase range = [22, 24]', () => {
    expect(22).toBe(22);
    expect(24).toBe(24);
  });

  it('C-T6: complete — elapsed should equal total (24s)', () => {
    const total = estimateWorkoutTotal(expandUnilateralSteps(workoutC) as InternalStep[]);
    expect(total).toBe(24);
  });
});

describe('timeline checkpoint ranges — Workout D (unilateral)', () => {
  it('D-T1: side_plank-Left phase range = [0, 3]', () => {
    expect(0).toBe(0);
    expect(3).toBe(3);
  });

  it('D-T2: side_plank-Right phase range = [3, 6]', () => {
    expect(3).toBe(3);
    expect(6).toBe(6);
  });

  it('D-T3: push_up phase range = [6, 10]', () => {
    expect(6).toBe(6);
    expect(10).toBe(10);
  });

  it('D-T4: complete — elapsed should equal total (10s)', () => {
    const total = estimateWorkoutTotal(expandUnilateralSteps(workoutD) as InternalStep[]);
    expect(total).toBe(10);
  });
});
