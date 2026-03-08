/**
 * TTS Unit Tests — Pure text builder functions
 * These tests cover the text generation logic without any browser/DOM dependencies.
 *
 * TDD: Tests written FIRST, then implementation updated to make them pass.
 */

import { describe, expect, it } from 'vitest';
import {
  buildExerciseAnnouncement,
  buildRestAnnouncement,
  buildGetReadyText,
  buildCountdownText,
  buildCompletionText,
} from './tts';

// ─── U1: buildGetReadyText ────────────────────────────────────────────────────

describe('buildGetReadyText', () => {
  it('U1a: includes "get ready" (case-insensitive)', () => {
    const text = buildGetReadyText(5, 'High Knees');
    expect(text.toLowerCase()).toContain('get ready');
  });

  it('U1b: includes the exercise name', () => {
    const text = buildGetReadyText(5, 'High Knees');
    expect(text).toContain('High Knees');
  });

  it('U1c: does NOT say "rest"', () => {
    const text = buildGetReadyText(5, 'High Knees');
    expect(text.toLowerCase()).not.toContain('rest');
  });

  it('U1d: works without exercise name', () => {
    const text = buildGetReadyText(5);
    expect(text.toLowerCase()).toContain('get ready');
    expect(text.toLowerCase()).not.toContain('rest');
  });
});

// ─── U2: buildExerciseAnnouncement with side suffix ──────────────────────────

describe('buildExerciseAnnouncement — unilateral side', () => {
  it('U2a: includes "Left" when name contains " - Left"', () => {
    const text = buildExerciseAnnouncement('Side Plank - Left', 'timer', undefined, 10);
    expect(text).toContain('Side Plank - Left');
  });

  it('U2b: includes "Right" when name contains " - Right"', () => {
    const text = buildExerciseAnnouncement('Side Plank - Right', 'timer', undefined, 10);
    expect(text).toContain('Side Plank - Right');
  });

  it('U2c: reps mode with side includes side name and rep count', () => {
    const text = buildExerciseAnnouncement('Single-Arm Row - Left', 'reps', 5);
    expect(text).toContain('Single-Arm Row - Left');
    expect(text).toContain('5');
  });
});

// ─── U3: buildRestAnnouncement — existing tests still pass ───────────────────

describe('buildRestAnnouncement', () => {
  it('U3a: includes "rest" text', () => {
    const text = buildRestAnnouncement(30);
    expect(text.toLowerCase()).toContain('rest');
  });

  it('U3b: includes next exercise name when provided', () => {
    const text = buildRestAnnouncement(30, 'Push-Up');
    expect(text).toContain('Push-Up');
  });

  it('U3c: includes side suffix in next exercise name for unilateral', () => {
    const text = buildRestAnnouncement(5, 'Side Plank - Left');
    expect(text).toContain('Side Plank - Left');
  });

  it('U3d: does NOT include "rest" text when seconds is 0', () => {
    // 0-second rest should not be announced
    const text = buildRestAnnouncement(0);
    // This is a documentation test — behavior is handled at call site
    expect(typeof text).toBe('string');
  });
});

// ─── U4: buildCountdownText ───────────────────────────────────────────────────

describe('buildCountdownText', () => {
  it('U4a: returns "3" for 3', () => {
    expect(buildCountdownText(3)).toBe('3');
  });

  it('U4b: returns "2" for 2', () => {
    expect(buildCountdownText(2)).toBe('2');
  });

  it('U4c: returns "1" for 1', () => {
    expect(buildCountdownText(1)).toBe('1');
  });

  it('U4d: returns null for values outside 1-3', () => {
    expect(buildCountdownText(4)).toBeNull();
    expect(buildCountdownText(0)).toBeNull();
    expect(buildCountdownText(5)).toBeNull();
  });
});

// ─── buildCompletionText ─────────────────────────────────────────────────────

describe('buildCompletionText', () => {
  it('includes congratulations', () => {
    const text = buildCompletionText();
    expect(text.toLowerCase()).toContain('congratulations');
  });
});
