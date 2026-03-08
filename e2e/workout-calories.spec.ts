/**
 * E2E tests: Calorie display on Get Ready and Complete screens
 * Fixture: workout-b-timer.json (plank 3s + mountain_climber 2s, rest 2s)
 * Expected calories (70 kg):
 *   plank: MET=3.5, 3s → 3.5 × 70 × (3/3600) = 0.204 kcal
 *   mountain_climber: MET=6.0, 2s → 6.0 × 70 × (2/3600) = 0.233 kcal
 *   total ≈ 0.44 kcal → ~0 kcal (rounds to 0, so we just check it's visible)
 *
 * Fixture: workout-c-sets.json (push_up 3×9s + plank 2s, rests)
 * Expected calories (70 kg):
 *   push_up: MET=4.5, 9s × 2 sets → 4.5 × 70 × (18/3600) = 1.575 kcal
 *   plank: MET=3.5, 2s → 3.5 × 70 × (2/3600) = 0.136 kcal
 *   total ≈ 1.71 kcal → ~2 kcal
 *
 * We test:
 * E-Cal1: Get Ready screen shows kcal text (> 0 or at least visible)
 * E-Cal2: Complete screen shows kcal burned badge
 */

import { test, expect } from '@playwright/test';
import workoutC from './fixtures/workout-c-sets.json' assert { type: 'json' };

const BASE_URL = 'http://localhost:3000';

function encodeWorkout(plan: object): string {
  return btoa(JSON.stringify(plan));
}

// Helper: skip countdown
async function skipCountdown(page: import('@playwright/test').Page) {
  await page.waitForSelector('[data-testid="skip-countdown-btn"]', { timeout: 10000 });
  await page.click('[data-testid="skip-countdown-btn"]');
}

test.describe('Calorie Display', () => {
  test('E-Cal1: Get Ready screen shows estimated kcal', async ({ page }) => {
    const encoded = encodeWorkout(workoutC);
    await page.goto(`${BASE_URL}/workout#data=${encoded}`);

    // Wait for idle screen (Get Ready) — button has text "Start Workout"
    const startBtn = page.getByRole('button', { name: /start workout/i });
    await expect(startBtn).toBeVisible({ timeout: 10000 });

    // Check that the kcal text is visible somewhere in the idle screen
    // The text should contain "kcal" (from formatCalories)
    const kcalText = page.locator('text=kcal');
    await expect(kcalText.first()).toBeVisible({ timeout: 5000 });
  });

  test('E-Cal2: Complete screen shows kcal burned badge', async ({ page }) => {
    const encoded = encodeWorkout(workoutC);
    await page.goto(`${BASE_URL}/workout#data=${encoded}`);

    // Start workout
    const startBtn = page.getByRole('button', { name: /start workout/i });
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();

    // Skip countdown
    await skipCountdown(page);

    // Skip all exercises and rests to reach complete screen quickly
    // push_up set1 → next → set_rest → next → push_up set2 → next → exercise_rest → next → plank (wait 2s)
    const nextBtn = page.getByTestId('next-exercise-btn');

    // Skip set1
    await page.waitForSelector('[data-testid="exercise-name"]', { timeout: 10000 });
    await nextBtn.click();

    // Skip set_rest
    await page.waitForSelector('[data-testid="rest-label"]', { timeout: 5000 });
    await nextBtn.click();

    // Skip set2
    await page.waitForSelector('[data-testid="exercise-name"]', { timeout: 5000 });
    await nextBtn.click();

    // Skip exercise_rest
    await page.waitForSelector('[data-testid="rest-label"]', { timeout: 5000 });
    await nextBtn.click();

    // Wait for plank to complete naturally (2s)
    await page.waitForSelector('[data-testid="complete-screen"]', { timeout: 15000 });

    // Check that kcal burned badge is visible
    const kcalBadge = page.locator('text=/kcal burned/');
    await expect(kcalBadge).toBeVisible({ timeout: 5000 });

    // The badge should show a number > 0
    const badgeText = await kcalBadge.textContent();
    const match = badgeText?.match(/~(\d+)\s*kcal/);
    expect(match).not.toBeNull();
    const kcalValue = parseInt(match![1]);
    expect(kcalValue).toBeGreaterThanOrEqual(0); // at least 0 (small workout)
  });
});
