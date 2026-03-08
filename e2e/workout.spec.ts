/**
 * PromptFit E2E Test Suite
 * Tests all workout flow scenarios using short (5-10s) workouts for efficiency.
 *
 * Workout fixtures:
 *   A: Reps mode  — push_up 5 reps + 2s rest, bodyweight_squat 3 reps
 *   B: Timer mode — plank 3s + 2s rest, mountain_climber 2s
 *   C: Sets mode  — push_up 3 reps × 2 sets (2s set-rest), plank 2s
 *
 * Test scenarios:
 *   A1, B1, C1 — Normal completion (let timers run)
 *   A2, B2, C2 — Skip all rest (click skip-rest-btn)
 *   Bug#1 — Plan loads via ?id= URL
 *   Bug#2 — Rest screen shows readable name, not raw exercise_id
 *   Bug#3 — Workout idle screen loads correctly
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

/** Wait for rest screen to appear */
async function waitForRestScreen(page: Page, timeout = 20000) {
  await expect(page.getByTestId('rest-screen')).toBeVisible({ timeout });
}

/** Wait for completion screen to appear */
async function waitForCompleteScreen(page: Page, timeout = 60000) {
  await expect(page.getByTestId('complete-screen')).toBeVisible({ timeout });
}

/**
 * Skip rest screen: wait for it, click skip, then wait for rest to disappear.
 * Uses waitFor hidden to confirm the transition completed.
 */
async function skipRestScreen(page: Page, waitTimeout = 20000) {
  await waitForRestScreen(page, waitTimeout);
  await page.getByTestId('skip-rest-btn').click();
  // Wait for rest screen to disappear (transition complete)
  await expect(page.getByTestId('rest-screen')).not.toBeVisible({ timeout: 5000 });
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

    // Rest screen after push_up
    await waitForRestScreen(page, 30000);
    const nextExercise = page.getByTestId('rest-next-exercise');
    await expect(nextExercise).toBeVisible();
    const nextName = await nextExercise.textContent();
    expect(nextName?.toLowerCase()).toMatch(/squat|bodyweight/);

    // Second exercise: bodyweight_squat
    await waitForExerciseName(page, 10000);
    const name2 = await exerciseName.textContent();
    expect(name2?.toLowerCase()).toMatch(/squat|bodyweight/);

    // Completion
    await waitForCompleteScreen(page, 60000);
    await expect(page.getByTestId('complete-screen')).toBeVisible();
  });

  test('A2: Skip all rest — reps mode, skip rest screen immediately', async ({ page }) => {
    await loadWorkout(page, workoutA);
    await startWorkout(page);
    await skipCountdownIfVisible(page);
    await waitForExerciseName(page);

    // Skip rest then verify second exercise loads
    await skipRestScreen(page, 30000);
    await waitForExerciseName(page, 8000);
    const name = await page.getByTestId('exercise-name').textContent();
    expect(name?.toLowerCase()).toMatch(/squat|bodyweight/);

    // Completion
    await waitForCompleteScreen(page, 60000);
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

    // Timer bar visible for timer mode
    await expect(page.getByTestId('step-timer-container')).toBeVisible();

    // Rest screen after plank (3s + buffer)
    await waitForRestScreen(page, 15000);
    const restTimer = page.getByTestId('rest-timer');
    await expect(restTimer).toBeVisible();
    const timerVal = await restTimer.textContent();
    expect(Number(timerVal)).toBeGreaterThanOrEqual(0);
    expect(Number(timerVal)).toBeLessThanOrEqual(2);

    // Next exercise name on rest screen
    const nextExercise = page.getByTestId('rest-next-exercise');
    await expect(nextExercise).toBeVisible();
    const nextName = await nextExercise.textContent();
    expect(nextName?.toLowerCase()).toMatch(/mountain|climber/);

    // Second exercise: mountain_climber
    await waitForExerciseName(page, 10000);
    const name2 = await exerciseName.textContent();
    expect(name2?.toLowerCase()).toMatch(/mountain|climber/);

    // Completion
    await waitForCompleteScreen(page, 30000);
  });

  test('B2: Skip all rest — timer mode, skip rest screen immediately', async ({ page }) => {
    await loadWorkout(page, workoutB);
    await startWorkout(page);
    await skipCountdownIfVisible(page);
    await waitForExerciseName(page);

    // Skip rest then verify second exercise loads
    await skipRestScreen(page, 15000);
    await waitForExerciseName(page, 8000);
    const name = await page.getByTestId('exercise-name').textContent();
    expect(name?.toLowerCase()).toMatch(/mountain|climber/);

    // Completion
    await waitForCompleteScreen(page, 30000);
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

    // Set rest after Set 1
    await waitForRestScreen(page, 30000);

    // Set 2 of push_up after rest
    await waitForExerciseName(page, 10000);
    const name2 = await exerciseName.textContent();
    expect(name2?.toLowerCase()).toContain('push');

    // Set badge now shows Set 2 / 2
    await expect(setBadge).toBeVisible();
    const badge2Text = await setBadge.textContent();
    expect(badge2Text).toContain('2');

    // After Set 2, plank starts (may have rest in between)
    await expect(async () => {
      const text = await exerciseName.textContent();
      expect(text?.toLowerCase()).toContain('plank');
    }).toPass({ timeout: 30000 });

    // Completion
    await waitForCompleteScreen(page, 30000);
  });

  test('C2: Skip all rest — sets mode, skip set rest immediately', async ({ page }) => {
    await loadWorkout(page, workoutC);
    await startWorkout(page);
    await skipCountdownIfVisible(page);
    await waitForExerciseName(page);

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

    // Skip any remaining rest screens until completion
    for (let i = 0; i < 5; i++) {
      const restVisible = await page.getByTestId('rest-screen').isVisible();
      if (restVisible) {
        await page.getByTestId('skip-rest-btn').click();
        await expect(page.getByTestId('rest-screen')).not.toBeVisible({ timeout: 5000 });
      }
      const completeVisible = await page.getByTestId('complete-screen').isVisible();
      if (completeVisible) break;
      // Wait a bit for next state
      await page.waitForTimeout(2000);
    }

    await waitForCompleteScreen(page, 60000);
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

    // No rest between left and right (rest_after_sec = 0 for left half)
    // Second half: Side Plank - Right should appear without rest screen
    await expect(async () => {
      const text = await exerciseName.textContent();
      expect(text?.toLowerCase()).toContain('right');
    }).toPass({ timeout: 15000 });
    const name2 = await exerciseName.textContent();
    expect(name2?.toLowerCase()).toContain('plank');

    // Then push_up (bilateral, no split)
    // right side takes up to 3s to finish, then push_up starts
    await expect(async () => {
      const text = await exerciseName.textContent();
      expect(text?.toLowerCase()).toContain('push');
    }).toPass({ timeout: 25000 });

    // Completion
    await waitForCompleteScreen(page, 30000);
  });
});

// ── Regression Tests ──────────────────────────────────────────────────────────

test.describe('Regression — Bug Fixes', () => {
  test('Bug #2: Rest screen shows readable exercise name (not raw key)', async ({ page }) => {
    await loadWorkout(page, workoutA);
    await startWorkout(page);
    await skipCountdownIfVisible(page);
    await waitForExerciseName(page);

    // Wait for rest screen
    await waitForRestScreen(page, 30000);

    // The next exercise name should be readable, NOT the raw exercise_id
    const nextExercise = page.getByTestId('rest-next-exercise');
    await expect(nextExercise).toBeVisible();
    const text = await nextExercise.textContent();

    // Raw key would be 'bodyweight_squat' — readable name should NOT be that
    expect(text).not.toBe('bodyweight_squat');
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

    // Wait for rest screen
    await waitForRestScreen(page, 30000);

    // Clear log before skip
    await page.evaluate(() => { (window as any).__ttsLog = []; });

    // Click skip
    const skipBtn = page.getByTestId('skip-rest-btn');
    await skipBtn.click();

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
