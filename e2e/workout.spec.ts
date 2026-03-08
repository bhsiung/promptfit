/**
 * PromptFit E2E Test Suite
 * Tests all workout flow scenarios using short (5-10s) workouts for efficiency.
 *
 * Workout fixtures:
 *   A: Reps mode  — push_up 5 reps + 2s rest, bodyweight_squat 3 reps
 *   B: Timer mode — plank 3s + 2s rest, mountain_climber 2s
 *   C: Sets mode  — push_up 3 reps × 2 sets (2s set-rest), plank 2s
 *
 * Rest screen redesign (v2):
 *   - No full-screen dark overlay (rest-screen removed)
 *   - data-testid="rest-label" appears in animation card (large "Rest" text)
 *   - next-exercise-btn skips rest (no separate skip-rest-btn)
 *   - pause button still works during rest
 */

import { test, expect, Page } from '@playwright/test';
import workoutA from './fixtures/workout-a-reps.json' assert { type: 'json' };
import workoutB from './fixtures/workout-b-timer.json' assert { type: 'json' };
import workoutC from './fixtures/workout-c-sets.json' assert { type: 'json' };
import workoutD from './fixtures/workout-d-unilateral.json' assert { type: 'json' };

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Encode a workout plan as base64url for the URL hash */
function encodeWorkout(plan: object): string {
  const b64 = Buffer.from(JSON.stringify(plan)).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Navigate to WorkoutPlayer with the given workout plan via hash */
async function loadWorkout(page: Page, plan: object) {
  const encoded = encodeWorkout(plan);
  await page.goto(`/workout#data=${encoded}`);
}

/** Click the Start Workout button to begin */
async function startWorkout(page: Page) {
  const startBtn = page.getByRole('button', { name: /start workout/i });
  await expect(startBtn).toBeVisible({ timeout: 8000 });
  await startBtn.click();
}

/** Skip countdown if visible (waits up to 1s for it to appear) */
async function skipCountdownIfVisible(page: Page) {
  const skipBtn = page.getByTestId('skip-countdown-btn');
  try {
    await skipBtn.waitFor({ state: 'visible', timeout: 1000 });
    await skipBtn.click();
  } catch {
    // countdown already done or not shown
  }
}

/** Wait for exercise-name to be visible (playing state) */
async function waitForExerciseName(page: Page, timeout = 12000) {
  await expect(page.getByTestId('exercise-name')).toBeVisible({ timeout });
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
  const match = text.match(/(\d+):(\d{2})/);
  if (!match) return -1;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

/**
 * Assert elapsed is within [min, max] inclusive.
 * Uses expect.poll to retry every 100ms for up to 3s — handles async React state updates
 * where the element may render before workoutElapsed state is committed.
 *
 * For normal playback: [entry_time, entry_time + phase_duration]
 * For skip targets: [exact-1, exact+1] (small tolerance for UI render delay)
 */
async function assertElapsedInRange(page: Page, min: number, max: number, label: string) {
  await expect.poll(
    async () => {
      const el = page.getByTestId('workout-elapsed');
      const text = await el.textContent();
      const match = text?.match(/(\d+):(\d{2})/);
      if (!match) return -1;
      return parseInt(match[1]) * 60 + parseInt(match[2]);
    },
    {
      message: `${label}: elapsed should be in [${min}, ${max}]`,
      timeout: 3000,
      intervals: [100, 200, 500],
    }
  ).toBeGreaterThanOrEqual(min);

  // Also verify it hasn't exceeded max (read immediately after min is satisfied)
  const el = page.getByTestId('workout-elapsed');
  const text = await el.textContent();
  const match = text?.match(/(\d+):(\d{2})/);
  const elapsed = match ? parseInt(match[1]) * 60 + parseInt(match[2]) : -1;
  expect(elapsed, `${label}: elapsed=${elapsed} should be <= ${max}`).toBeLessThanOrEqual(max);
}

/**
 * Wait for rest state: data-testid="rest-label" (large "Rest" text in animation card).
 * v2 design: rest is inline, no full-screen overlay.
 */
async function waitForRestScreen(page: Page, timeout = 20000) {
  await expect(page.getByTestId('rest-label')).toBeVisible({ timeout });
}

/** Wait for completion screen to appear */
async function waitForCompleteScreen(page: Page, timeout = 60000) {
  await expect(page.getByTestId('complete-screen')).toBeVisible({ timeout });
}

/**
 * Skip rest: wait for rest-label, click next-exercise-btn, then wait for rest-label to disappear.
 * v2 design: uses next-exercise-btn (no separate skip-rest-btn).
 */
async function skipRestScreen(page: Page, waitTimeout = 20000) {
  await waitForRestScreen(page, waitTimeout);
  await page.getByTestId('next-exercise-btn').click();
  // Wait for rest-label to disappear (transition complete)
  await expect(page.getByTestId('rest-label')).not.toBeVisible({ timeout: 5000 });
}

// ── Test Suite ────────────────────────────────────────────────────────────────

test.describe('WorkoutPlayer — Reps Mode (Workout A)', () => {
  test('A1: Normal completion — reps mode with rest between exercises', async ({ page }) => {
    await loadWorkout(page, workoutA);

    // Idle screen: heading + start button visible
    await expect(page.getByRole('heading', { name: /reps mode test/i }).first()).toBeVisible({ timeout: 5000 });
    await startWorkout(page);
    await skipCountdownIfVisible(page);

    // Playing: push_up
    await waitForExerciseName(page);
    const exerciseName = page.getByTestId('exercise-name');
    const name1 = await exerciseName.textContent();
    expect(name1?.toLowerCase()).toContain('push');
    // A1-T1: push_up start — elapsed in [0, 9]
    await assertElapsedInRange(page, 0, 9, 'A1: push_up start');

    // Rest state after push_up — rest-label appears in animation card
    await waitForRestScreen(page, 30000);
    // rest-label card shows "Rest" and "Next up" info
    const restCard = page.getByTestId('rest-label');
    await expect(restCard).toBeVisible();
    const restText = await restCard.textContent();
    expect(restText?.toLowerCase()).toMatch(/squat|bodyweight|next/);
    // A1-T2: rest entry — elapsed in [9, 11]
    await assertElapsedInRange(page, 9, 11, 'A1: rest entry');

    // Second exercise: bodyweight_squat — wait for rest to end first
    await page.waitForSelector('[data-testid="rest-label"]', { state: 'hidden', timeout: 15000 });
    await waitForExerciseName(page, 10000);
    const name2 = await exerciseName.textContent();
    expect(name2?.toLowerCase()).toMatch(/squat|bodyweight/);
    // A1-T3: squat start — elapsed in [11, 20]
    await assertElapsedInRange(page, 11, 20, 'A1: squat start');

    // Completion
    await waitForCompleteScreen(page, 60000);
    await expect(page.getByTestId('complete-screen')).toBeVisible();
    // A1-T4: complete — elapsed = 20 (±1)
    await assertElapsedInRange(page, 19, 21, 'A1: complete');
  });

  test('A2: Skip all rest — reps mode, skip rest immediately', async ({ page }) => {
    await loadWorkout(page, workoutA);
    await startWorkout(page);
    await skipCountdownIfVisible(page);
    await waitForExerciseName(page);

    // A2-T1: push_up start — elapsed in [0, 9]
    await assertElapsedInRange(page, 0, 9, 'A2: push_up start');

    // Skip rest then verify second exercise loads
    await skipRestScreen(page, 30000);
    await waitForExerciseName(page, 8000);
    const name = await page.getByTestId('exercise-name').textContent();
    expect(name?.toLowerCase()).toMatch(/squat|bodyweight/);
    // A2-T2: after skip rest, squat start — elapsed jumps to 11 (±1)
    await assertElapsedInRange(page, 10, 12, 'A2: squat after skip-rest');

    // Completion
    await waitForCompleteScreen(page, 60000);
    // A2-T3: complete — elapsed = 20 (±1)
    await assertElapsedInRange(page, 19, 21, 'A2: complete');
  });
});

test.describe('WorkoutPlayer — Timer Mode (Workout B)', () => {
  test('B1: Normal completion — timer mode with rest between exercises', async ({ page }) => {
    await loadWorkout(page, workoutB);
    await startWorkout(page);
    await skipCountdownIfVisible(page);
    await waitForExerciseName(page);

    // First exercise: plank (3s timer)
    const exerciseName = page.getByTestId('exercise-name');
    const name1 = await exerciseName.textContent();
    expect(name1?.toLowerCase()).toContain('plank');
    // B1-T1: plank start — elapsed in [0, 3]
    await assertElapsedInRange(page, 0, 3, 'B1: plank start');

    // Timer bar visible for timer mode
    await expect(page.getByTestId('step-timer-container')).toBeVisible();

    // Rest state after plank (3s + buffer) — rest-label appears
    await waitForRestScreen(page, 15000);
    const restCard = page.getByTestId('rest-label');
    await expect(restCard).toBeVisible();
    const restText = await restCard.textContent();
    expect(restText?.toLowerCase()).toMatch(/rest/);
    // Next exercise info shown in rest card
    expect(restText?.toLowerCase()).toMatch(/mountain|climber|next/);
    // B1-T2: rest entry — elapsed in [3, 5]
    await assertElapsedInRange(page, 3, 5, 'B1: rest entry');

    // Second exercise: mountain_climber — wait for rest to end first
    await page.waitForSelector('[data-testid="rest-label"]', { state: 'hidden', timeout: 15000 });
    await waitForExerciseName(page, 10000);
    const name2 = await exerciseName.textContent();
    expect(name2?.toLowerCase()).toMatch(/mountain|climber/);
    // B1-T3: mountain_climber start — elapsed in [5, 7]
    await assertElapsedInRange(page, 5, 7, 'B1: mountain_climber start');

    // Completion
    await waitForCompleteScreen(page, 30000);
    // B1-T4: complete — elapsed = 7 (±1)
    await assertElapsedInRange(page, 6, 8, 'B1: complete');
  });

  test('B2: Skip all rest — timer mode, skip rest immediately', async ({ page }) => {
    await loadWorkout(page, workoutB);
    await startWorkout(page);
    await skipCountdownIfVisible(page);
    await waitForExerciseName(page);

    // B2-T1: plank start — elapsed in [0, 3]
    await assertElapsedInRange(page, 0, 3, 'B2: plank start');

    // Skip rest then verify second exercise loads
    await skipRestScreen(page, 15000);
    await waitForExerciseName(page, 8000);
    const name = await page.getByTestId('exercise-name').textContent();
    expect(name?.toLowerCase()).toMatch(/mountain|climber/);
    // B2-T2: after skip rest, climber start — elapsed jumps to 5 (±1)
    await assertElapsedInRange(page, 4, 6, 'B2: climber after skip-rest');

    // Completion
    await waitForCompleteScreen(page, 30000);
    // B2-T3: complete — elapsed = 7 (±1)
    await assertElapsedInRange(page, 6, 8, 'B2: complete');
  });
});

test.describe('WorkoutPlayer — Sets Mode (Workout C)', () => {
  test('C1: Normal completion — sets mode with set rest between sets', async ({ page }) => {
    await loadWorkout(page, workoutC);
    await startWorkout(page);
    await skipCountdownIfVisible(page);
    await waitForExerciseName(page);

    // First exercise: push_up, Set 1 / 2
    const exerciseName = page.getByTestId('exercise-name');
    const name1 = await exerciseName.textContent();
    expect(name1?.toLowerCase()).toContain('push');

    // Set badge shows "Set 1 / 2"
    const setBadge = page.getByTestId('set-badge');
    await expect(setBadge).toBeVisible();
    const badgeText = await setBadge.textContent();
    expect(badgeText).toContain('1');
    expect(badgeText).toContain('2');
    // C1-T1: push_up set1 start — elapsed in [0, 9]
    await assertElapsedInRange(page, 0, 9, 'C1: push_up set1 start');

    // Set rest after Set 1 — rest-label appears
    await waitForRestScreen(page, 30000);
    // C1-T2: set_rest entry — elapsed in [9, 11]
    await assertElapsedInRange(page, 9, 11, 'C1: set_rest entry');

    // Set 2 of push_up after rest
    await waitForExerciseName(page, 10000);
    const name2 = await exerciseName.textContent();
    expect(name2?.toLowerCase()).toContain('push');

    // Set badge now shows Set 2 / 2
    await expect(setBadge).toBeVisible();
    const badge2Text = await setBadge.textContent();
    expect(badge2Text).toContain('2');
    // C1-T3: push_up set2 start — elapsed in [11, 20]
    await assertElapsedInRange(page, 11, 20, 'C1: push_up set2 start');

    // After Set 2, plank starts (may have rest in between)
    await expect(async () => {
      const text = await exerciseName.textContent();
      expect(text?.toLowerCase()).toContain('plank');
    }).toPass({ timeout: 30000 });
    // C1-T4: plank start — elapsed in [22, 24]
    await assertElapsedInRange(page, 22, 24, 'C1: plank start');

    // Completion
    await waitForCompleteScreen(page, 30000);
    // C1-T5: complete — elapsed = 24 (±1)
    await assertElapsedInRange(page, 23, 25, 'C1: complete');
  });

  test('C2: Skip all rest — sets mode, skip set rest immediately', async ({ page }) => {
    await loadWorkout(page, workoutC);
    await startWorkout(page);
    await skipCountdownIfVisible(page);
    await waitForExerciseName(page);

    // C2-T1: push_up set1 start — elapsed in [0, 9]
    await assertElapsedInRange(page, 0, 9, 'C2: push_up set1 start');

    // Skip set rest after Set 1
    await skipRestScreen(page, 30000);

    // Should immediately show Set 2 of push_up
    await waitForExerciseName(page, 8000);
    const name = await page.getByTestId('exercise-name').textContent();
    expect(name?.toLowerCase()).toContain('push');

    // Set badge shows Set 2
    const setBadge = page.getByTestId('set-badge');
    await expect(setBadge).toBeVisible({ timeout: 3000 });
    const badgeText = await setBadge.textContent();
    expect(badgeText).toContain('2');
    // C2-T2: after skip set_rest, set2 start — elapsed jumps to 11 (±1)
    await assertElapsedInRange(page, 10, 12, 'C2: set2 after skip-set-rest');

    // Skip any remaining rest states until completion
    for (let i = 0; i < 5; i++) {
      const restVisible = await page.getByTestId('rest-label').isVisible();
      if (restVisible) {
        await page.getByTestId('next-exercise-btn').click();
        await expect(page.getByTestId('rest-label')).not.toBeVisible({ timeout: 5000 });
      }
      const completeVisible = await page.getByTestId('complete-screen').isVisible();
      if (completeVisible) break;
      await page.waitForTimeout(2000);
    }

    await waitForCompleteScreen(page, 60000);
    // C2-T3: complete — elapsed = 24 (±1)
    await assertElapsedInRange(page, 23, 25, 'C2: complete');
  });
});

// ── Unilateral Tests ────────────────────────────────────────────────────────

test.describe('WorkoutPlayer — Unilateral Mode (Workout D)', () => {
  test('D1: Unilateral auto-split — side_plank splits into left/right halves', async ({ page }) => {
    await loadWorkout(page, workoutD);
    await startWorkout(page);
    await skipCountdownIfVisible(page);

    // First half: Side Plank - Left (3s, half of 6s)
    await waitForExerciseName(page);
    const exerciseName = page.getByTestId('exercise-name');
    const name1 = await exerciseName.textContent();
    expect(name1?.toLowerCase()).toContain('left');
    expect(name1?.toLowerCase()).toContain('plank');
    // D1-T1: Left start — elapsed in [0, 3]
    await assertElapsedInRange(page, 0, 3, 'D1: side_plank-Left start');

    // No rest between left and right (rest_after_sec = 0 for left half)
    // Second half: Side Plank - Right should appear without rest screen
    await expect(async () => {
      const text = await exerciseName.textContent();
      expect(text?.toLowerCase()).toContain('right');
    }).toPass({ timeout: 15000 });
    const name2 = await exerciseName.textContent();
    expect(name2?.toLowerCase()).toContain('plank');
    // D1-T2: Right start — elapsed in [3, 6]
    await assertElapsedInRange(page, 3, 6, 'D1: side_plank-Right start');

    // Then push_up (bilateral, no split)
    await expect(async () => {
      const text = await exerciseName.textContent();
      expect(text?.toLowerCase()).toContain('push');
    }).toPass({ timeout: 25000 });
    // D1-T3: push_up start — elapsed in [6, 10]
    await assertElapsedInRange(page, 6, 10, 'D1: push_up start');

    // Completion
    await waitForCompleteScreen(page, 30000);
    // D1-T4: complete — elapsed = 10 (±1)
    await assertElapsedInRange(page, 9, 11, 'D1: complete');
  });
});

// ── Regression Tests ──────────────────────────────────────────────────────────

test.describe('Regression — Bug Fixes', () => {
  test('Bug #2: Rest state shows readable exercise name (not raw key)', async ({ page }) => {
    await loadWorkout(page, workoutA);
    await startWorkout(page);
    await skipCountdownIfVisible(page);
    await waitForExerciseName(page);

    // Wait for rest state
    await waitForRestScreen(page, 30000);

    // The rest-label card should show readable name, not raw exercise_id
    const restCard = page.getByTestId('rest-label');
    await expect(restCard).toBeVisible();
    const text = await restCard.textContent();

    // Raw key would be 'bodyweight_squat' — readable name should NOT be that
    expect(text).not.toContain('bodyweight_squat');
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(2);
  });

  test('Bug #3: Workout idle screen loads correctly with title and start button', async ({ page }) => {
    await loadWorkout(page, workoutB);

    // Start button must be visible
    await expect(page.getByRole('button', { name: /start workout/i })).toBeVisible({ timeout: 5000 });

    // Workout title heading must be visible (first match to avoid strict mode violation)
    await expect(page.getByRole('heading', { name: /timer mode test/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('Bug #1: WorkoutPlayer loads correctly via ?id= URL (Redis plan)', async ({ page }) => {
    // POST a plan to get an ID — API returns 201 with { id, play_url }
    const response = await page.request.post('/api/get-plan-id', {
      data: workoutB,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    const planId = body.id;
    expect(planId).toBeTruthy();
    expect(planId.length).toBe(22);

    // Navigate to workout via /play?id= URL (the canonical route)
    await page.goto(`/play?id=${planId}`);

    // Should load and show idle screen (not error)
    await expect(page.getByRole('button', { name: /start workout/i })).toBeVisible({ timeout: 10000 });
  });
});

// ── TTS Tests (mock speechSynthesis) ─────────────────────────────────────────

/**
 * Mock speechSynthesis in the browser so we can capture what text is spoken.
 * Returns an array of spoken strings via window.__ttsLog.
 */
async function injectTTSMock(page: Page) {
  await page.addInitScript(() => {
    (window as any).__ttsLog = [];
    const mockSynth = {
      cancel: () => {},
      speak: (utterance: SpeechSynthesisUtterance) => {
        (window as any).__ttsLog.push(utterance.text);
      },
      getVoices: () => [],
      speaking: false,
      pending: false,
      paused: false,
      onvoiceschanged: null,
      pause: () => {},
      resume: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
    Object.defineProperty(window, 'speechSynthesis', {
      get: () => mockSynth,
      configurable: true,
    });
    // Mock SpeechSynthesisUtterance
    (window as any).SpeechSynthesisUtterance = class {
      text: string;
      lang = 'en-US';
      rate = 1;
      pitch = 1;
      volume = 1;
      voice = null;
      constructor(text: string) { this.text = text; }
    };
  });
}

async function getTTSLog(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as any).__ttsLog ?? []);
}

test.describe('TTS Announcements', () => {
  test('E3: Initial countdown announces "get ready" not "rest"', async ({ page }) => {
    await injectTTSMock(page);
    await loadWorkout(page, workoutA);
    await startWorkout(page);

    // Wait briefly for TTS to fire
    await page.waitForTimeout(500);

    const log = await getTTSLog(page);
    // The first announcement should contain "get ready" (case-insensitive)
    expect(log.length).toBeGreaterThan(0);
    const firstAnnouncement = log[0].toLowerCase();
    expect(firstAnnouncement).toContain('get ready');
    expect(firstAnnouncement).not.toContain('rest');
  });

  test('E1: Skip rest — next exercise TTS fires immediately after skip', async ({ page }) => {
    await injectTTSMock(page);
    await loadWorkout(page, workoutA);
    await startWorkout(page);
    await skipCountdownIfVisible(page);
    await waitForExerciseName(page);

    // Wait for rest state
    await waitForRestScreen(page, 30000);

    // Clear log before skip
    await page.evaluate(() => { (window as any).__ttsLog = []; });

    // Click next-exercise-btn to skip rest (v2: no separate skip-rest-btn)
    const nextBtn = page.getByTestId('next-exercise-btn');
    await nextBtn.click();

    // Wait for exercise to appear
    await waitForExerciseName(page, 5000);

    // TTS should have fired with exercise name
    await page.waitForTimeout(300);
    const log = await getTTSLog(page);
    expect(log.length).toBeGreaterThan(0);
    // Should contain the next exercise name (bodyweight_squat → "Bodyweight Squat")
    const spoken = log.join(' ').toLowerCase();
    expect(spoken).toContain('squat');
  });

  test('E2: Unilateral exercise TTS includes side ("Left" and "Right")', async ({ page }) => {
    await injectTTSMock(page);
    await loadWorkout(page, workoutD);
    await startWorkout(page);
    await skipCountdownIfVisible(page);

    // Wait for left side
    await expect(async () => {
      const text = await page.getByTestId('exercise-name').textContent();
      expect(text?.toLowerCase()).toContain('left');
    }).toPass({ timeout: 12000 });

    // Collect TTS log so far
    await page.waitForTimeout(200);
    const logAfterLeft = await getTTSLog(page);
    const spokenLeft = logAfterLeft.join(' ').toLowerCase();
    expect(spokenLeft).toContain('left');

    // Wait for right side
    await expect(async () => {
      const text = await page.getByTestId('exercise-name').textContent();
      expect(text?.toLowerCase()).toContain('right');
    }).toPass({ timeout: 12000 });

    await page.waitForTimeout(200);
    const logAfterRight = await getTTSLog(page);
    const spokenRight = logAfterRight.join(' ').toLowerCase();
    expect(spokenRight).toContain('right');
  });
});

// ── Next Button Tests ─────────────────────────────────────────────────────────

test.describe('Next Button — Rest Countdown', () => {
  /**
   * E-Next1: Press next during exercise → rest state appears → timer bar still counting
   * Uses workout B (plank 3s + 2s rest → mountain_climber)
   * Verifies rest-label stays visible for at least 1.5s (rest is 3s, not frozen at 0).
   */
  test('E-Next1: Next button → rest state countdown actually ticks', async ({ page }) => {
    await loadWorkout(page, workoutB);
    await startWorkout(page);
    await skipCountdownIfVisible(page);
    await waitForExerciseName(page);

    // Verify we are on plank (first exercise)
    const exerciseName = page.getByTestId('exercise-name');
    const name = await exerciseName.textContent();
    expect(name?.toLowerCase()).toContain('plank');
    // E-Next1-T1: plank start — elapsed in [0, 3]
    await assertElapsedInRange(page, 0, 3, 'E-Next1: plank start');

    // Click next to skip to rest
    const nextBtn = page.getByTestId('next-exercise-btn');
    await expect(nextBtn).toBeVisible({ timeout: 3000 });
    await nextBtn.click();

    // Rest state must appear (rest-label visible in animation card)
    await waitForRestScreen(page, 5000);
    // E-Next1-T2: rest entry after skip plank — elapsed jumps to 3 (±1)
    await assertElapsedInRange(page, 2, 4, 'E-Next1: rest after skip-plank');

    // Timer bar should be visible (step-timer-container)
    const timerContainer = page.getByTestId('step-timer-container');
    await expect(timerContainer).toBeVisible({ timeout: 3000 });

    // Wait 1.5s and verify rest-label is still visible
    // (rest_after_sec=3 in workoutB, so if timer is running correctly, rest hasn't ended yet)
    await page.waitForTimeout(1500);
    await expect(page.getByTestId('rest-label')).toBeVisible({ timeout: 500 });
  });

  /**
   * E-Next2: Press next during exercise → rest state appears → after rest, next exercise loads
   * Verifies the full flow: next → rest countdown → auto-advance to next exercise
   */
  test('E-Next2: Next button → rest completes → next exercise auto-loads', async ({ page }) => {
    await loadWorkout(page, workoutB);
    await startWorkout(page);
    await skipCountdownIfVisible(page);
    await waitForExerciseName(page);

    // E-Next2-T1: plank start — elapsed in [0, 3]
    await assertElapsedInRange(page, 0, 3, 'E-Next2: plank start');

    // Click next to skip to rest
    const nextBtn = page.getByTestId('next-exercise-btn');
    await expect(nextBtn).toBeVisible({ timeout: 3000 });
    await nextBtn.click();

    // Rest state must appear
    await waitForRestScreen(page, 5000);
    // E-Next2-T2: rest entry after skip plank — elapsed jumps to 3 (±1)
    await assertElapsedInRange(page, 2, 4, 'E-Next2: rest after skip-plank');

    // Wait for rest to finish naturally (2s), then check next exercise
    await page.waitForSelector('[data-testid="rest-label"]', { state: 'hidden', timeout: 15000 });
    await waitForExerciseName(page, 10000);
    const name = await page.getByTestId('exercise-name').textContent();
    expect(name?.toLowerCase()).toMatch(/mountain|climber/);
    // E-Next2-T3: climber start after rest — elapsed in [5, 7]
    await assertElapsedInRange(page, 5, 7, 'E-Next2: climber after rest');
  });
});

// ── E-SkipAll Test ────────────────────────────────────────────────────────────

/**
 * E-SkipAll: Skip everything as fast as possible using the next button.
 * Uses workout C (push_up 2 sets + plank 1 set).
 *
 * Flow:
 *   start → skip countdown → [push_up set1] → next → skip rest (next again) →
 *   [push_up set2] → next → skip rest (next again) →
 *   [plank] → wait for completion → congratulation screen
 *
 * KEY: After clicking next to skip rest, we assert rest-label disappears within 800ms.
 * This is STRICT — if skipRest() does nothing (the bug), the rest timer (2s) won't
 * have expired yet, so rest-label will still be visible and the assertion fails.
 */
test.describe('WorkoutPlayer — Skip All Path', () => {
  test('E-SkipAll: next + skip rest all the way → last exercise completes → congratulation', async ({ page }) => {
    await loadWorkout(page, workoutC);
    await startWorkout(page);
    await skipCountdownIfVisible(page);

    // ── Step 1: push_up Set 1 ──────────────────────────────────────────────
    await waitForExerciseName(page, 8000);
    const name1 = await page.getByTestId('exercise-name').textContent();
    expect(name1?.toLowerCase()).toContain('push');
    // E-SkipAll-T1: set1 start — elapsed = 0 (just entered)
    await assertElapsedInRange(page, 0, 1, 'E-SkipAll: set1 start');

    // Click next to skip set 1 → should enter rest state
    const nextBtn = page.getByTestId('next-exercise-btn');
    await expect(nextBtn).toBeVisible({ timeout: 3000 });
    await nextBtn.click();

    // Rest state must appear (set rest between push_up sets)
    await waitForRestScreen(page, 5000);
    // E-SkipAll-T2: after skip set1 → elapsed jumps to 9 (±1)
    await assertElapsedInRange(page, 8, 10, 'E-SkipAll: set_rest after skip-set1');

    // Click next to skip rest → rest-label must disappear within 800ms
    // (rest duration is 2s, so if skip does nothing, rest-label will still be visible)
    await nextBtn.click();
    await expect(page.getByTestId('rest-label')).not.toBeVisible({ timeout: 800 });

    // We should be back on push_up (set 2)
    await waitForExerciseName(page, 3000);
    const name2 = await page.getByTestId('exercise-name').textContent();
    expect(name2?.toLowerCase()).toContain('push');
    // E-SkipAll-T3: after skip set_rest → elapsed jumps to 11 (±1)
    await assertElapsedInRange(page, 10, 12, 'E-SkipAll: set2 after skip-set-rest');

    // ── Step 2: push_up Set 2 ──────────────────────────────────────────────
    // Click next to skip set 2 → should enter exercise-rest state
    await expect(nextBtn).toBeVisible({ timeout: 3000 });
    await nextBtn.click();

    // Rest state must appear (rest between push_up and plank)
    await waitForRestScreen(page, 5000);
    // E-SkipAll-T4: after skip set2 → elapsed jumps to 20 (±1)
    await assertElapsedInRange(page, 19, 21, 'E-SkipAll: ex_rest after skip-set2');

    // Click next to skip rest → rest-label must disappear within 800ms
    await nextBtn.click();
    await expect(page.getByTestId('rest-label')).not.toBeVisible({ timeout: 800 });

    // We should now be on plank (last exercise)
    await waitForExerciseName(page, 3000);
    const name3 = await page.getByTestId('exercise-name').textContent();
    expect(name3?.toLowerCase()).toContain('plank');
    // E-SkipAll-T5: after skip ex_rest → elapsed jumps to 22 (±1)
    await assertElapsedInRange(page, 21, 23, 'E-SkipAll: plank after skip-ex-rest');

    // ── Step 3: plank (last exercise, no next) ─────────────────────────────
    // Wait for plank to complete naturally (2s duration) → congratulation screen
    await waitForCompleteScreen(page, 15000);
    // E-SkipAll-T6: complete — elapsed = 24 (±1)
    await assertElapsedInRange(page, 23, 25, 'E-SkipAll: complete');
  });
});

// ── Rest Screen Redesign Tests ────────────────────────────────────────────────

/**
 * E-Rest1 & E-Rest2: Rest screen redesign — inline layout (no full-screen dark overlay)
 *
 * After redesign:
 *   - data-testid="rest-label" appears in the animation card (large "Rest" text)
 *   - data-testid="rest-screen" no longer exists
 *   - next-exercise-btn is used to skip rest (no separate skip-rest-btn)
 *   - pause button still works during rest
 */
test.describe('WorkoutPlayer — Rest Screen Redesign', () => {
  test('E-Rest1: rest shows rest-label in animation card, controls still visible', async ({ page }) => {
    await loadWorkout(page, workoutB);
    await startWorkout(page);
    await skipCountdownIfVisible(page);
    await waitForExerciseName(page, 8000);

    // Click next to skip to rest
    const nextBtn = page.getByTestId('next-exercise-btn');
    await expect(nextBtn).toBeVisible({ timeout: 3000 });
    await nextBtn.click();

    // E-Rest1a: rest-label must appear (large "Rest" text in animation card)
    await expect(page.getByTestId('rest-label')).toBeVisible({ timeout: 3000 });
    // E-Rest1b: old full-screen rest-screen must NOT exist
    await expect(page.getByTestId('rest-screen')).not.toBeVisible({ timeout: 500 });
    // E-Rest1c: next-exercise-btn still visible (used to skip rest)
    await expect(page.getByTestId('next-exercise-btn')).toBeVisible({ timeout: 1000 });
    // E-Rest1d: no separate skip-rest-btn
    await expect(page.getByTestId('skip-rest-btn')).not.toBeVisible({ timeout: 500 });
  });

  test('E-Rest2: click next-exercise-btn during rest → rest-label disappears in 800ms', async ({ page }) => {
    await loadWorkout(page, workoutB);
    await startWorkout(page);
    await skipCountdownIfVisible(page);
    await waitForExerciseName(page, 8000);

    // Skip to rest via next button
    const nextBtn = page.getByTestId('next-exercise-btn');
    await expect(nextBtn).toBeVisible({ timeout: 3000 });
    await nextBtn.click();

    // Wait for rest-label to appear
    await expect(page.getByTestId('rest-label')).toBeVisible({ timeout: 3000 });

    // Click next to skip rest — rest-label must disappear within 800ms
    // (rest duration is 3s, so if skip does nothing, rest-label will still be visible)
    await nextBtn.click();
    await expect(page.getByTestId('rest-label')).not.toBeVisible({ timeout: 800 });

    // We should now be on the next exercise
    await waitForExerciseName(page, 3000);
  });
});
