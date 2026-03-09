/**
 * Get Ready Screen Checklist + Prev Elapsed E2E Tests
 *
 * E-GetReady1: Get Ready screen shows exercise checklist with correct names
 * E-Prev1: Press prev mid-exercise → goes back to previous exercise,
 *           elapsed is monotonically non-decreasing (never goes backward)
 */

import { test, expect, type Page } from '@playwright/test';
import workoutC from './fixtures/workout-c-sets.json' assert { type: 'json' };
import workoutB from './fixtures/workout-b-timer.json' assert { type: 'json' };

const BASE_URL = 'http://localhost:3000';

function encodeWorkout(plan: object): string {
  return btoa(JSON.stringify(plan));
}

/** Get current elapsed seconds from the workout-elapsed testid */
async function getElapsed(page: Page): Promise<number> {
  const el = page.getByTestId('workout-elapsed');
  const text = await el.textContent();
  const match = text?.match(/(\d+):(\d{2})/);
  if (!match) return -1;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

/** Click the Start Workout button */
async function startWorkout(page: Page) {
  const startBtn = page.getByRole('button', { name: /start workout/i });
  await expect(startBtn).toBeVisible({ timeout: 8000 });
  await startBtn.click();
}

/** Skip countdown if visible */
async function skipCountdown(page: Page) {
  const skipBtn = page.getByTestId('skip-countdown-btn');
  try {
    await skipBtn.waitFor({ state: 'visible', timeout: 1500 });
    await skipBtn.click();
  } catch {
    // countdown may have already ended
  }
}

test.describe('Get Ready Screen Checklist', () => {
  test('E-GetReady1: Get Ready screen shows exercise checklist with correct names', async ({ page }) => {
    const encoded = encodeWorkout(workoutC);
    await page.goto(`${BASE_URL}/workout#data=${encoded}`);

    // Wait for idle screen
    const startBtn = page.getByRole('button', { name: /start workout/i });
    await expect(startBtn).toBeVisible({ timeout: 10000 });

    // Checklist should show exercise names from the workout
    // workout-c has: push_up (2 sets × 3 reps) and plank
    const checklistContainer = page.getByTestId('exercise-checklist');
    await expect(checklistContainer).toBeVisible({ timeout: 5000 });

    // Should contain "Push-Up" (or "Push Up") and "Plank"
    const checklistText = await checklistContainer.textContent();
    expect(checklistText?.toLowerCase()).toContain('push');
    expect(checklistText?.toLowerCase()).toContain('plank');
  });
});

test.describe('Prev Button — Elapsed Non-Decreasing', () => {
  test('E-Prev1: prev mid-exercise → back to previous exercise, elapsed does not decrease', async ({ page }) => {
    // Use workout B: plank(3s) → rest(2s) → mountain_climber(2s)
    const encoded = encodeWorkout(workoutB);
    await page.goto(`${BASE_URL}/workout#data=${encoded}`);

    await startWorkout(page);
    await skipCountdown(page);

    // Wait for plank to start
    await expect(page.getByTestId('exercise-name')).toHaveText(/plank/i, { timeout: 8000 });

    // Wait 1s so elapsed has a non-zero value
    await page.waitForTimeout(1500);
    const elapsedAtPlank = await getElapsed(page);
    expect(elapsedAtPlank).toBeGreaterThanOrEqual(0);

    // Click next to skip plank → go to rest
    await page.getByTestId('next-exercise-btn').click();

    // Wait for rest state
    await expect(page.getByTestId('rest-label')).toBeVisible({ timeout: 5000 });
    const elapsedAtRest = await getElapsed(page);

    // elapsed should have jumped to plank end position (≥ plank duration = 3s)
    expect(elapsedAtRest).toBeGreaterThanOrEqual(3);

    // Now click PREV to go back to plank
    const prevBtn = page.getByTestId('prev-exercise-btn');
    await expect(prevBtn).toBeVisible({ timeout: 3000 });
    await prevBtn.click();

    // Should be back on plank
    await expect(page.getByTestId('exercise-name')).toHaveText(/plank/i, { timeout: 5000 });

    // elapsed after prev should NOT be less than elapsed at rest
    // (elapsed is monotonically non-decreasing — it never goes backward)
    const elapsedAfterPrev = await getElapsed(page);
    expect(elapsedAfterPrev).toBeGreaterThanOrEqual(elapsedAtRest - 1); // allow 1s tolerance

    // Continue: let plank finish naturally or skip again → rest → climber → complete
    await page.getByTestId('next-exercise-btn').click();
    await expect(page.getByTestId('rest-label')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('next-exercise-btn').click();
    await expect(page.getByTestId('exercise-name')).toHaveText(/mountain|climber/i, { timeout: 5000 });

    // Wait for complete screen
    await expect(page.getByTestId('complete-screen')).toBeVisible({ timeout: 15000 });

    // Final elapsed should be ≥ total workout time (7s) since we went back and replayed plank
    const elapsedFinal = await getElapsed(page);
    expect(elapsedFinal).toBeGreaterThanOrEqual(7);
  });
});
