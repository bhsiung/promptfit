/**
 * PromptFit E2E — Elapsed Timer Timeline Tests
 *
 * Verifies that data-testid="workout-elapsed" shows the correct value
 * at each key checkpoint in the workout timeline.
 *
 * ELAPSED SEMANTICS (timeline position, not real-time seconds):
 *   - elapsed = sum of all completed steps + current step progress
 *   - countdown is NOT counted
 *   - skip exercise → elapsed jumps to step end position
 *   - skip rest     → elapsed jumps to next step start position
 *
 * Timeline per fixture (no countdown):
 *
 *   Workout A (Reps):
 *     push_up:  0s → 9s    range [0, 9]
 *     rest:     9s → 11s   range [9, 11]
 *     squat:   11s → 20s   range [11, 20]
 *     done:    20s          exact 20
 *
 *   Workout B (Timer):
 *     plank:   0s → 3s     range [0, 3]
 *     rest:    3s → 5s     range [3, 5]
 *     climber: 5s → 7s     range [5, 7]
 *     done:    7s           exact 7
 *
 *   Workout C (Sets):
 *     push_up set1:  0s → 9s    range [0, 9]
 *     set_rest:      9s → 11s   range [9, 11]
 *     push_up set2: 11s → 20s   range [11, 20]
 *     exercise_rest: 20s → 22s  range [20, 22]
 *     plank:        22s → 24s   range [22, 24]
 *     done:         24s          exact 24
 *
 *   Workout D (Unilateral):
 *     side_plank-Left:  0s → 3s   range [0, 3]
 *     side_plank-Right: 3s → 6s   range [3, 6]
 *     push_up:          6s → 10s  range [6, 10]
 *     done:             10s        exact 10
 */

import { test, expect, Page } from '@playwright/test';
import workoutA from './fixtures/workout-a-reps.json' assert { type: 'json' };
import workoutB from './fixtures/workout-b-timer.json' assert { type: 'json' };
import workoutC from './fixtures/workout-c-sets.json' assert { type: 'json' };
import workoutD from './fixtures/workout-d-unilateral.json' assert { type: 'json' };

// ── Helpers ──────────────────────────────────────────────────────────────────

function encodeWorkout(plan: object): string {
  const b64 = Buffer.from(JSON.stringify(plan)).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function loadWorkout(page: Page, plan: object) {
  await page.goto(`/workout#data=${encodeWorkout(plan)}`);
}

async function startWorkout(page: Page) {
  const startBtn = page.getByRole('button', { name: /start workout/i });
  await expect(startBtn).toBeVisible({ timeout: 8000 });
  await startBtn.click();
}

async function skipCountdownIfVisible(page: Page) {
  const skipBtn = page.getByTestId('skip-countdown-btn');
  try {
    await skipBtn.waitFor({ state: 'visible', timeout: 1000 });
    await skipBtn.click();
  } catch {
    // countdown already done or not shown
  }
}

/**
 * Read the current elapsed value from data-testid="workout-elapsed".
 * The element shows text like "0:09 elapsed" — we parse the seconds.
 * Format is M:SS (e.g. "0:09", "1:05").
 */
async function getElapsed(page: Page): Promise<number> {
  const el = page.getByTestId('workout-elapsed');
  await expect(el).toBeVisible({ timeout: 5000 });
  const text = await el.textContent();
  if (!text) return -1;
  // Parse "M:SS elapsed" or "M:SS" → total seconds
  const match = text.match(/(\d+):(\d{2})/);
  if (!match) return -1;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

/**
 * Assert elapsed is within [min, max] inclusive.
 * For normal playback: [entry_time, entry_time + phase_duration]
 * For skip targets: [exact, exact+1] (small tolerance for UI render delay)
 */
async function assertElapsedInRange(page: Page, min: number, max: number, label: string) {
  const elapsed = await getElapsed(page);
  expect(elapsed, `${label}: elapsed=${elapsed} should be in [${min}, ${max}]`).toBeGreaterThanOrEqual(min);
  expect(elapsed, `${label}: elapsed=${elapsed} should be in [${min}, ${max}]`).toBeLessThanOrEqual(max);
}

async function waitForExerciseName(page: Page, timeout = 12000) {
  await expect(page.getByTestId('exercise-name')).toBeVisible({ timeout });
}

async function waitForRestLabel(page: Page, timeout = 20000) {
  await expect(page.getByTestId('rest-label')).toBeVisible({ timeout });
}

async function waitForCompleteScreen(page: Page, timeout = 60000) {
  await expect(page.getByTestId('complete-screen')).toBeVisible({ timeout });
}

// ── Workout A: Reps Mode ─────────────────────────────────────────────────────

test.describe('Timer Timeline — Workout A (Reps)', () => {
  test('A-Timer: elapsed at each checkpoint matches expected range', async ({ page }) => {
    await loadWorkout(page, workoutA);
    await startWorkout(page);
    await skipCountdownIfVisible(page);

    // Checkpoint 1: push_up starts — elapsed in [0, 9]
    await waitForExerciseName(page);
    const name1 = await page.getByTestId('exercise-name').textContent();
    expect(name1?.toLowerCase()).toContain('push');
    await assertElapsedInRange(page, 0, 9, 'A: push_up start');

    // Checkpoint 2: rest starts — elapsed in [9, 11]
    await waitForRestLabel(page, 30000);
    await assertElapsedInRange(page, 9, 11, 'A: rest entry');

    // Checkpoint 3: squat starts — elapsed in [11, 20]
    await page.waitForSelector('[data-testid="rest-label"]', { state: 'hidden', timeout: 15000 });
    await waitForExerciseName(page, 10000);
    const name2 = await page.getByTestId('exercise-name').textContent();
    expect(name2?.toLowerCase()).toMatch(/squat|bodyweight/);
    await assertElapsedInRange(page, 11, 20, 'A: squat start');

    // Checkpoint 4: complete — elapsed = 20 (exact, ±1 for render delay)
    await waitForCompleteScreen(page, 30000);
    await assertElapsedInRange(page, 19, 21, 'A: complete');
  });
});

// ── Workout B: Timer Mode ─────────────────────────────────────────────────────

test.describe('Timer Timeline — Workout B (Timer)', () => {
  test('B-Timer: elapsed at each checkpoint matches expected range', async ({ page }) => {
    await loadWorkout(page, workoutB);
    await startWorkout(page);
    await skipCountdownIfVisible(page);

    // Checkpoint 1: plank starts — elapsed in [0, 3]
    await waitForExerciseName(page);
    const name1 = await page.getByTestId('exercise-name').textContent();
    expect(name1?.toLowerCase()).toContain('plank');
    await assertElapsedInRange(page, 0, 3, 'B: plank start');

    // Checkpoint 2: rest starts — elapsed in [3, 5]
    await waitForRestLabel(page, 15000);
    await assertElapsedInRange(page, 3, 5, 'B: rest entry');

    // Checkpoint 3: mountain_climber starts — elapsed in [5, 7]
    await page.waitForSelector('[data-testid="rest-label"]', { state: 'hidden', timeout: 15000 });
    await waitForExerciseName(page, 10000);
    const name2 = await page.getByTestId('exercise-name').textContent();
    expect(name2?.toLowerCase()).toMatch(/mountain|climber/);
    await assertElapsedInRange(page, 5, 7, 'B: mountain_climber start');

    // Checkpoint 4: complete — elapsed = 7 (exact, ±1)
    await waitForCompleteScreen(page, 20000);
    await assertElapsedInRange(page, 6, 8, 'B: complete');
  });
});

// ── Workout C: Sets Mode ──────────────────────────────────────────────────────

test.describe('Timer Timeline — Workout C (Sets)', () => {
  test('C-Timer: elapsed at each checkpoint matches expected range', async ({ page }) => {
    await loadWorkout(page, workoutC);
    await startWorkout(page);
    await skipCountdownIfVisible(page);

    // Checkpoint 1: push_up set 1 — elapsed in [0, 9]
    await waitForExerciseName(page);
    const name1 = await page.getByTestId('exercise-name').textContent();
    expect(name1?.toLowerCase()).toContain('push');
    await assertElapsedInRange(page, 0, 9, 'C: push_up set1 start');

    // Checkpoint 2: set_rest — elapsed in [9, 11]
    await waitForRestLabel(page, 30000);
    await assertElapsedInRange(page, 9, 11, 'C: set_rest entry');

    // Checkpoint 3: push_up set 2 — elapsed in [11, 20]
    await page.waitForSelector('[data-testid="rest-label"]', { state: 'hidden', timeout: 15000 });
    await waitForExerciseName(page, 10000);
    const name2 = await page.getByTestId('exercise-name').textContent();
    expect(name2?.toLowerCase()).toContain('push');
    const setBadge = await page.getByTestId('set-badge').textContent();
    expect(setBadge).toContain('2');
    await assertElapsedInRange(page, 11, 20, 'C: push_up set2 start');

    // Checkpoint 4: exercise_rest — elapsed in [20, 22]
    await waitForRestLabel(page, 30000);
    await assertElapsedInRange(page, 20, 22, 'C: exercise_rest entry');

    // Checkpoint 5: plank — elapsed in [22, 24]
    await page.waitForSelector('[data-testid="rest-label"]', { state: 'hidden', timeout: 15000 });
    await waitForExerciseName(page, 10000);
    const name3 = await page.getByTestId('exercise-name').textContent();
    expect(name3?.toLowerCase()).toContain('plank');
    await assertElapsedInRange(page, 22, 24, 'C: plank start');

    // Checkpoint 6: complete — elapsed = 24 (exact, ±1)
    await waitForCompleteScreen(page, 20000);
    await assertElapsedInRange(page, 23, 25, 'C: complete');
  });
});

// ── Workout D: Unilateral Mode ────────────────────────────────────────────────

test.describe('Timer Timeline — Workout D (Unilateral)', () => {
  test('D-Timer: elapsed at each checkpoint matches expected range', async ({ page }) => {
    await loadWorkout(page, workoutD);
    await startWorkout(page);
    await skipCountdownIfVisible(page);

    // Checkpoint 1: side_plank-Left — elapsed in [0, 3]
    await waitForExerciseName(page);
    const name1 = await page.getByTestId('exercise-name').textContent();
    expect(name1?.toLowerCase()).toContain('left');
    await assertElapsedInRange(page, 0, 3, 'D: side_plank-Left start');

    // Checkpoint 2: side_plank-Right — elapsed in [3, 6]
    await expect(async () => {
      const text = await page.getByTestId('exercise-name').textContent();
      expect(text?.toLowerCase()).toContain('right');
    }).toPass({ timeout: 10000 });
    await assertElapsedInRange(page, 3, 6, 'D: side_plank-Right start');

    // Checkpoint 3: push_up — elapsed in [6, 10]
    await expect(async () => {
      const text = await page.getByTestId('exercise-name').textContent();
      expect(text?.toLowerCase()).toContain('push');
    }).toPass({ timeout: 15000 });
    await assertElapsedInRange(page, 6, 10, 'D: push_up start');

    // Checkpoint 4: complete — elapsed = 10 (exact, ±1)
    await waitForCompleteScreen(page, 20000);
    await assertElapsedInRange(page, 9, 11, 'D: complete');
  });
});
