/**
 * Unit tests for estimateCalories helper (TDD — RED first)
 * Formula: calories = MET × weightKg × durationHours
 */

import { describe, it, expect } from 'vitest';
import { estimateCalories } from './calories';
import type { WorkoutStep } from '@/types/workout';

// Minimal WorkoutStep factory
function makeStep(overrides: Partial<WorkoutStep> = {}): WorkoutStep {
  return {
    exercise_id: 'push_up',
    duration_sec: 60,
    sets: 1,
    set_rest_sec: 0,
    rest_after_sec: 0,
    ...overrides,
  };
}

describe('estimateCalories', () => {
  // U-Cal1: single step, known MET
  it('U-Cal1: calculates calories for a single step with known exercise MET', () => {
    // push_up: MET=4.5, 70kg, 60s = 4.5 × 70 × (60/3600) = 5.25 kcal
    const steps = [makeStep({ exercise_id: 'push_up', duration_sec: 60, sets: 1 })];
    const result = estimateCalories(steps, 70);
    expect(result).toBeCloseTo(5.25, 1);
  });

  // U-Cal2: multi-step accumulation
  it('U-Cal2: accumulates calories across multiple steps', () => {
    // push_up: 4.5 × 70 × (60/3600) = 5.25
    // plank: 3.5 × 70 × (30/3600) = 2.042
    // total ≈ 7.29
    const steps = [
      makeStep({ exercise_id: 'push_up', duration_sec: 60, sets: 1 }),
      makeStep({ exercise_id: 'plank', duration_sec: 30, sets: 1 }),
    ];
    const result = estimateCalories(steps, 70);
    expect(result).toBeCloseTo(7.29, 1);
  });

  // U-Cal2b: multi-set step (sets multiply duration)
  it('U-Cal2b: multiplies duration by sets for multi-set exercises', () => {
    // push_up: 4.5 × 70 × (60 × 3 / 3600) = 15.75
    const steps = [makeStep({ exercise_id: 'push_up', duration_sec: 60, sets: 3 })];
    const result = estimateCalories(steps, 70);
    expect(result).toBeCloseTo(15.75, 1);
  });

  // U-Cal3: unknown exercise falls back to category default
  it('U-Cal3: unknown exercise_id falls back to category MET fallback', () => {
    // 'unknown_push_exercise' not in EXERCISES → falls back to push category MET=4.5
    // But since we don't know the category, it should use a global fallback (5.0)
    // OR the caller passes a fallback MET
    // Design: estimateCalories uses EXERCISE_MAP to look up MET;
    // if not found, uses CATEGORY_MET_FALLBACK['conditioning'] = 7.0 as last resort
    const steps = [makeStep({ exercise_id: 'unknown_exercise_xyz', duration_sec: 60, sets: 1 })];
    const result = estimateCalories(steps, 70);
    // Should not throw, should return a positive number using fallback
    expect(result).toBeGreaterThan(0);
  });

  // U-Cal4: different body weight scales linearly
  it('U-Cal4: calories scale linearly with body weight', () => {
    const steps = [makeStep({ exercise_id: 'push_up', duration_sec: 60, sets: 1 })];
    const result70 = estimateCalories(steps, 70);
    const result140 = estimateCalories(steps, 140);
    expect(result140).toBeCloseTo(result70 * 2, 1);
  });

  // U-Cal5: zero duration returns 0
  it('U-Cal5: zero duration step contributes 0 calories', () => {
    const steps = [makeStep({ exercise_id: 'push_up', duration_sec: 0, sets: 1 })];
    const result = estimateCalories(steps, 70);
    expect(result).toBe(0);
  });

  // U-Cal6: empty steps array returns 0
  it('U-Cal6: empty steps array returns 0', () => {
    const result = estimateCalories([], 70);
    expect(result).toBe(0);
  });
});
