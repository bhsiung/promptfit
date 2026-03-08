/**
 * Workout Renderer — Playback Engine Hook
 * Manages workout step progression, countdown timer, and TTS announcements.
 *
 * Schema: all steps are timer-driven (duration_sec is required).
 * When a step has `reps`, the UI shows "X reps" as a goal alongside the countdown.
 * There is no `mode` field — everything is duration-based.
 *
 * Sets logic:
 *   Each WorkoutStep has a required `sets` field.
 *   When a set finishes, if there are remaining sets we restart the same step
 *   with a set_rest_sec pause, incrementing currentSet.
 *   Only after all sets are done do we advance to the next step.
 *
 * Unilateral logic:
 *   Before playback starts, unilateral steps are auto-expanded into two internal
 *   steps: one for 'left' and one for 'right'. Each half gets duration_sec / 2
 *   (and reps / 2 if applicable). The original step's rest_after_sec is only
 *   applied after the right (second) half; between left and right there is no
 *   rest. The original step's sets apply to each half independently.
 *
 * Countdown mode:
 *   Before the first step starts, status = 'countdown' with a 5-second timer.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { announceCountdown, announceCongrats, announceExercise, announceGetReady, announceRest, cancelSpeech } from '@/lib/tts';
import type { WorkoutPlan, WorkoutStep } from '@/lib/workoutSchema';
import { getExercise } from '@/lib/exercises';

// ─── Internal step type (extends WorkoutStep with runtime-only side field) ───

export type ExerciseSide = 'left' | 'right';

export interface InternalStep extends WorkoutStep {
  /** Runtime-only: set by expandUnilateralSteps, not part of schema */
  _side?: ExerciseSide;
  /** Runtime-only: display name override (includes side suffix) */
  _displayName?: string;
}

// ─── Unilateral expansion ────────────────────────────────────────────────────

/**
 * Expand unilateral steps into left + right halves.
 * Each half gets:
 *   - duration_sec = Math.ceil(original / 2) for left, Math.floor(original / 2) for right
 *   - reps = Math.ceil(original / 2) for left, Math.floor(original / 2) for right (if set)
 *   - rest_after_sec = 0 for left (no rest between sides), original value for right
 *   - sets, set_rest_sec unchanged (each side does the same number of sets)
 */
function expandUnilateralSteps(plan: WorkoutPlan): InternalStep[] {
  const result: InternalStep[] = [];

  for (const step of plan.steps) {
    const info = getExercise(step.exercise_id);
    const isUnilateral = info?.unilateral === true;

    if (!isUnilateral) {
      result.push(step as InternalStep);
      continue;
    }

    const baseName = step.label ?? info?.name ?? step.exercise_id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const halfDurLeft = Math.ceil(step.duration_sec / 2);
    const halfDurRight = Math.floor(step.duration_sec / 2);
    const halfRepsLeft = step.reps !== undefined ? Math.ceil(step.reps / 2) : undefined;
    const halfRepsRight = step.reps !== undefined ? Math.floor(step.reps / 2) : undefined;

    const leftStep: InternalStep = {
      ...step,
      duration_sec: halfDurLeft,
      reps: halfRepsLeft,
      rest_after_sec: 0, // no rest between left and right
      _side: 'left',
      _displayName: `${baseName} - Left`,
    };

    const rightStep: InternalStep = {
      ...step,
      duration_sec: halfDurRight,
      reps: halfRepsRight,
      rest_after_sec: step.rest_after_sec, // original rest after right side
      _side: 'right',
      _displayName: `${baseName} - Right`,
    };

    result.push(leftStep, rightStep);
  }

  return result;
}

// ─── Display name helper ─────────────────────────────────────────────────────

/** Resolve a human-readable display name for a step */
function getStepDisplayName(step: InternalStep): string {
  if (step._displayName) return step._displayName;
  if (step.label) return step.label;
  const info = getExercise(step.exercise_id);
  if (info) return info.name;
  // Fallback: convert snake_case to Title Case
  return step.exercise_id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type PlaybackStatus = 'idle' | 'countdown' | 'playing' | 'paused' | 'rest' | 'completed';

export interface PlayerState {
  status: PlaybackStatus;
  currentStepIndex: number;
  currentStep: InternalStep | null;
  timeRemaining: number; // seconds countdown
  totalTime: number;     // total seconds for current step/rest
  nextStepName: string | null; // name of the next exercise (for rest preview)
  repCount: number;
  isLastThreeSeconds: boolean;
  frameIndex: number;    // 0 or 1 for animation frame switching
  currentSet: number;    // 1-based current set number
  totalSets: number;     // total sets for current step
  side?: ExerciseSide;   // 'left' | 'right' for unilateral steps
  // Workout-level progress
  workoutElapsed: number;   // seconds elapsed since start
  workoutTotal: number;     // estimated total workout seconds
  // Countdown
  countdownRemaining: number; // 5..1 before workout starts
  // Pending navigation (for rest screens)
  pendingNextSet?: number;     // next set to load when rest finishes
  pendingNextIndex?: number;   // next step index to load when rest finishes
}

const FRAME_SWITCH_INTERVAL = 600; // ms between animation frames
export const START_COUNTDOWN_SEC = 5;

/** Estimate total workout duration in seconds (operates on expanded steps) */
function estimateWorkoutTotal(steps: InternalStep[]): number {
  const lastIndex = steps.length - 1;
  return steps.reduce((acc, step, index) => {
    const stepTime = step.duration_sec;
    const restTime = step.sets > 1 ? step.set_rest_sec * (step.sets - 1) : 0;
    // Don't add rest_after_sec for the last step — workout ends immediately
    const restAfter = index < lastIndex ? step.rest_after_sec : 0;
    return acc + stepTime * step.sets + restTime + restAfter;
  }, 0);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWorkoutPlayer(plan: WorkoutPlan | null) {
  // Expand unilateral steps once when plan changes
  const expandedSteps = plan ? expandUnilateralSteps(plan) : [];
  const workoutTotal = estimateWorkoutTotal(expandedSteps);

  const [state, setState] = useState<PlayerState>({
    status: 'idle',
    currentStepIndex: 0,
    currentStep: null,
    timeRemaining: 0,
    totalTime: 0,
    nextStepName: null,
    repCount: 0,
    isLastThreeSeconds: false,
    frameIndex: 0,
    currentSet: 1,
    totalSets: 1,
    side: undefined,
    workoutElapsed: 0,
    workoutTotal,
    countdownRemaining: START_COUNTDOWN_SEC,
  });

  // Single countdown timer ref
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Frame animation timer ref
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Workout elapsed timer ref
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track which countdown numbers have been announced
  const announcedRef = useRef<Set<string>>(new Set());
  // Keep expanded steps in ref to avoid stale closures
  const stepsRef = useRef<InternalStep[]>(expandedSteps);
  // Keep latest state in ref for synchronous reads (e.g. skipRest)
  const stateRef = useRef<PlayerState>(state);

  useEffect(() => {
    stepsRef.current = expandedSteps;
  }, [plan]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep stateRef in sync with state for synchronous reads
  useEffect(() => {
    stateRef.current = state;
  });

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const clearFrameTimer = useCallback(() => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
  }, []);

  const clearElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    clearCountdown();
    clearFrameTimer();
    // NOTE: clearElapsedTimer is NOT called here — elapsed time should keep running
    // through Next/Prev/Skip operations. Call clearElapsedTimer() explicitly on reset/complete.
  }, [clearCountdown, clearFrameTimer]);

  // Start frame animation independently of countdown
  const startFrameAnimation = useCallback(() => {
    clearFrameTimer();
    frameTimerRef.current = setInterval(() => {
      setState(prev => ({ ...prev, frameIndex: prev.frameIndex === 0 ? 1 : 0 }));
    }, FRAME_SWITCH_INTERVAL);
  }, [clearFrameTimer]);

  // Start elapsed timer (increments workoutElapsed every second while playing)
  const startElapsedTimer = useCallback(() => {
    clearElapsedTimer();
    elapsedTimerRef.current = setInterval(() => {
      setState(prev => {
        // Count elapsed time during playing, rest, and countdown (not paused or idle)
        if (prev.status !== 'playing' && prev.status !== 'rest' && prev.status !== 'countdown') return prev;
        return { ...prev, workoutElapsed: prev.workoutElapsed + 1 };
      });
    }, 1000);
  }, [clearElapsedTimer]);

  // Start countdown for the current step
  const startCountdown = useCallback(() => {
    clearCountdown();
    countdownRef.current = setInterval(() => {
      setState(prev => {
        if (prev.status !== 'playing') return prev;

        const newTime = prev.timeRemaining - 1;
        const isLastThree = newTime <= 3 && newTime > 0;

        // Announce 3, 2, 1
        if (isLastThree && !announcedRef.current.has(String(newTime))) {
          announcedRef.current.add(String(newTime));
          announceCountdown(newTime);
        }

        if (newTime <= 0) {
          return { ...prev, timeRemaining: 0, isLastThreeSeconds: false };
        }

        return { ...prev, timeRemaining: newTime, isLastThreeSeconds: isLastThree };
      });
    }, 1000);
  }, [clearCountdown]);

  // Start rest countdown between sets or exercises
  const startRestCountdown = useCallback((restSec: number, onDone: () => void, nextExerciseName?: string) => {
    clearCountdown();
    let remaining = restSec;
    setState(prev => ({
      ...prev,
      status: 'rest',
      timeRemaining: remaining,
      totalTime: restSec,
      nextStepName: nextExerciseName ?? null,
    }));
    // Announce rest with next exercise name
    if (restSec > 0) announceRest(restSec, nextExerciseName);
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearCountdown();
        onDone();
      } else {
        setState(prev => ({ ...prev, timeRemaining: remaining }));
      }
    }, 1000);
  }, [clearCountdown]);

  // Load a step by index, optionally specifying which set to start from
  const loadStep = useCallback((stepIndex: number, autoPlay = true, setNumber = 1) => {
    const steps = stepsRef.current;
    if (stepIndex >= steps.length) return;

    const step = steps[stepIndex];
    const totalTime = step.duration_sec;
    const totalSets = step.sets;

    announcedRef.current.clear();
    clearAllTimers();

    setState(prev => ({
      ...prev,
      status: autoPlay ? 'playing' : 'idle',
      currentStepIndex: stepIndex,
      currentStep: step,
      timeRemaining: totalTime,
      totalTime,
      repCount: 0,
      isLastThreeSeconds: false,
      frameIndex: 0,
      currentSet: setNumber,
      pendingNextSet: undefined,
      pendingNextIndex: undefined,
      totalSets,
      side: step._side,
    }));

    // Announce exercise name and reps/duration (only on first set)
    if (setNumber === 1) {
      announceExercise(
        getStepDisplayName(step),
        step.reps !== undefined ? 'reps' : 'timer',
        step.reps,
        step.duration_sec,
      );
    }
  }, [clearAllTimers]);

  // Advance to next set or next step (auto-triggered when timer hits 0)
  const advanceStep = useCallback(() => {
    const steps = stepsRef.current;
    if (!steps.length) return;

    setState(prev => {
      const totalSets = prev.currentStep?.sets ?? 1;
      const nextSet = prev.currentSet + 1;

      if (nextSet <= totalSets) {
        // More sets remaining — rest then replay same step
        const restSec = prev.currentStep?.set_rest_sec ?? 0;
        const currentStepName = prev.currentStep ? getStepDisplayName(prev.currentStep) : undefined;
        setTimeout(() => {
          startRestCountdown(restSec, () => {
            loadStep(prev.currentStepIndex, true, nextSet);
          }, currentStepName);
        }, 0);
        // Set pendingNextSet so skipRest can navigate without the callback
        return { ...prev, pendingNextSet: nextSet, pendingNextIndex: undefined };
      }

      // All sets done — advance to next step
      const nextIndex = prev.currentStepIndex + 1;
      if (nextIndex >= steps.length) {
        clearAllTimers();
        cancelSpeech();
        announceCongrats();
        return { ...prev, status: 'completed' };
      }

      // rest_after_sec: rest AFTER current exercise, before next exercise begins
      const interRestSec = prev.currentStep?.rest_after_sec ?? 0;
      const nextStep = steps[nextIndex];
      const nextStepName = getStepDisplayName(nextStep);
      if (interRestSec > 0) {
        setTimeout(() => {
          startRestCountdown(interRestSec, () => {
            loadStep(nextIndex, true, 1);
          }, nextStepName);
        }, 0);
        // Set pendingNextIndex so skipRest can navigate without the callback
        return { ...prev, pendingNextIndex: nextIndex, pendingNextSet: undefined };
      } else {
        setTimeout(() => loadStep(nextIndex, true, 1), 400);
        return prev;
      }
    });
  }, [loadStep, clearAllTimers, startRestCountdown]);

  // React to status/step changes: start/stop timers
  // NOTE: state.side is included so countdown restarts when switching left↔right
  // (same exercise_id but different side = new step)
  useEffect(() => {
    if (state.status === 'playing' && state.currentStep) {
      startCountdown();
      startFrameAnimation();
    } else if (state.status === 'paused') {
      clearAllTimers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.currentStep?.exercise_id, state.currentSet, state.totalTime, state.side]);

  // Watch for step completion (timeRemaining hits 0)
  useEffect(() => {
    if (
      state.status === 'playing' &&
      state.timeRemaining <= 0 &&
      state.currentStep !== null &&
      state.totalTime > 0
    ) {
      clearCountdown();
      clearFrameTimer();
      advanceStep();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.timeRemaining]);

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Begin 5-second countdown then start workout */
  const start = useCallback(() => {
    const steps = stepsRef.current;
    if (!steps.length) return;
    clearAllTimers();
    clearElapsedTimer();
    announcedRef.current.clear();

    const firstStep = steps[0];
    const firstStepName = getStepDisplayName(firstStep);

    setState(prev => ({
      ...prev,
      status: 'countdown',
      countdownRemaining: START_COUNTDOWN_SEC,
      workoutElapsed: 0,
      workoutTotal: estimateWorkoutTotal(steps),
      nextStepName: firstStepName,
    }));

    // Start elapsed timer immediately — it runs through playing, rest, and countdown
    startElapsedTimer();

    // Announce "get ready" (not rest) for initial countdown
    announceGetReady(START_COUNTDOWN_SEC, firstStepName);

    let remaining = START_COUNTDOWN_SEC;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearCountdown();
        loadStep(0, true, 1);
      } else {
        setState(prev => ({ ...prev, countdownRemaining: remaining }));
      }
    }, 1000);
  }, [loadStep, clearAllTimers, clearCountdown, clearElapsedTimer, startElapsedTimer]);

  const pause = useCallback(() => {
    clearAllTimers();
    cancelSpeech();
    setState(prev => ({ ...prev, status: 'paused' }));
  }, [clearAllTimers]);

  const resume = useCallback(() => {
    setState(prev => ({ ...prev, status: 'playing' }));
  }, []);

  /** Sets-aware next: advance set first, then step */
  const next = useCallback(() => {
    clearAllTimers();
    const steps = stepsRef.current;
    if (!steps.length) return;

    // Read current state synchronously from stateRef to avoid stale closure issues
    const currentState = stateRef.current;
    const nextSet = currentState.currentSet + 1;

    // If there are more sets of same exercise, enter set rest
    if (nextSet <= currentState.totalSets) {
      const step = currentState.currentStep!;
      const restDuration = step.set_rest_sec;
      const currentStepName = getStepDisplayName(step);
      announcedRef.current.clear();
      // Set pendingNextSet so skipRest can navigate without the callback
      setState(prev => ({ ...prev, pendingNextSet: nextSet, pendingNextIndex: undefined }));
      setTimeout(() => {
        startRestCountdown(restDuration, () => {
          loadStep(currentState.currentStepIndex, true, nextSet);
        }, currentStepName);
      }, 0);
      return;
    }

    // No more sets, check if there's a next step
    const nextIndex = currentState.currentStepIndex + 1;
    if (nextIndex >= steps.length) {
      cancelSpeech();
      announceCongrats();
      setState(prev => ({ ...prev, status: 'completed' }));
      return;
    }

    // Enter rest-after period before next step
    const step = currentState.currentStep!;
    const restDuration = step.rest_after_sec;
    const nextStep = steps[nextIndex];
    const nextStepName = getStepDisplayName(nextStep);
    announcedRef.current.clear();
    // Set pendingNextIndex so skipRest can navigate without the callback
    setState(prev => ({ ...prev, pendingNextIndex: nextIndex, pendingNextSet: undefined }));
    setTimeout(() => {
      startRestCountdown(restDuration, () => {
        loadStep(nextIndex, true, 1);
      }, nextStepName);
    }, 0);
  }, [clearAllTimers, startRestCountdown, loadStep]);

  /** Skip rest or countdown: cancel countdown and immediately load the pending next step */
  const skipRest = useCallback(() => {
    clearAllTimers();
    cancelSpeech();
    announcedRef.current.clear();

    const steps = stepsRef.current;
    if (!steps.length) return;

    // Read current state synchronously from stateRef (avoids stale closure in setState callback)
    const currentState = stateRef.current;

    // Resolve the next step/set BEFORE setState so we can announce after
    let resolvedStep: InternalStep | undefined;
    let resolvedSet = 1;

    if (currentState.status === 'countdown') {
      resolvedStep = steps[0];
      resolvedSet = 1;
    } else if (currentState.status === 'rest') {
      if (currentState.pendingNextSet !== undefined) {
        resolvedStep = steps[currentState.currentStepIndex];
        resolvedSet = currentState.pendingNextSet;
      } else if (currentState.pendingNextIndex !== undefined) {
        resolvedStep = steps[currentState.pendingNextIndex];
        resolvedSet = 1;
      }
    }

    setState(prev => {
      if (!steps.length) return prev;

      // Handle countdown skip: jump to first step inline
      if (prev.status === 'countdown') {
        const step = steps[0];
        if (!step) return prev;
        resolvedStep = step;
        resolvedSet = 1;
        const totalTime = step.duration_sec;
        const totalSets = step.sets;
        return {
          ...prev,
          status: 'playing',
          currentStepIndex: 0,
          currentStep: step,
          timeRemaining: totalTime,
          totalTime,
          repCount: 0,
          isLastThreeSeconds: false,
          frameIndex: 0,
          currentSet: 1,
          totalSets,
          side: step._side,
          pendingNextSet: undefined,
          pendingNextIndex: undefined,
        };
      }

      if (prev.status !== 'rest') return prev;

      // Determine which step/set to load next
      let nextStepIndex = prev.currentStepIndex;
      let nextSetNumber = 1;

      if (prev.pendingNextSet !== undefined) {
        // Between-set rest — stay on same step, advance set
        nextSetNumber = prev.pendingNextSet;
      } else if (prev.pendingNextIndex !== undefined) {
        // Between-exercise rest — advance to next step
        nextStepIndex = prev.pendingNextIndex;
        nextSetNumber = 1;
      } else {
        return prev; // nothing pending, ignore
      }

      const step = steps[nextStepIndex];
      if (!step) return prev;

      resolvedStep = step;
      resolvedSet = nextSetNumber;

      const totalTime = step.duration_sec;
      const totalSets = step.sets;

      return {
        ...prev,
        status: 'playing',
        currentStepIndex: nextStepIndex,
        currentStep: step,
        timeRemaining: totalTime,
        totalTime,
        repCount: 0,
        isLastThreeSeconds: false,
        frameIndex: 0,
        currentSet: nextSetNumber,
        totalSets,
        side: step._side,
        pendingNextSet: undefined,
        pendingNextIndex: undefined,
      };
    });

    // Announce the exercise after state is set (only on first set)
    // Use setTimeout to ensure cancelSpeech() above has fully flushed
    if (resolvedStep && resolvedSet === 1) {
      const stepToAnnounce = resolvedStep;
      setTimeout(() => {
        announceExercise(
          getStepDisplayName(stepToAnnounce),
          stepToAnnounce.reps !== undefined ? 'reps' : 'timer',
          stepToAnnounce.reps,
          stepToAnnounce.duration_sec,
        );
      }, 50);
    }
  }, [clearAllTimers]);

  /** Sets-aware previous: go back to set 1 first, then previous step */
  const previous = useCallback(() => {
    clearAllTimers();
    const steps = stepsRef.current;
    setState(prev => {
      // If we're past set 1, enter set rest to go back to set 1
      if (prev.currentSet > 1) {
        const step = prev.currentStep!;
        const restDuration = step.set_rest_sec;
        const currentStepName = getStepDisplayName(step);
        announcedRef.current.clear();
        return {
          ...prev,
          timeRemaining: restDuration,
          totalTime: restDuration,
          status: 'rest',
          pendingNextSet: 1,
          nextStepName: currentStepName,
        };
      }
      // Go back one step
      const prevIndex = Math.max(0, prev.currentStepIndex - 1);
      if (prevIndex === prev.currentStepIndex) return prev; // already at first step

      if (!steps.length) return prev;
      const prevStep = steps[prevIndex];
      const restDuration = prevStep.rest_after_sec;
      const prevStepName = getStepDisplayName(prevStep);
      announcedRef.current.clear();
      return {
        ...prev,
        timeRemaining: restDuration,
        totalTime: restDuration,
        status: 'rest',
        pendingNextIndex: prevIndex,
        nextStepName: prevStepName,
      };
    });
  }, [clearAllTimers]);

  const reset = useCallback(() => {
    clearAllTimers();
    clearElapsedTimer(); // explicitly stop elapsed timer on reset
    cancelSpeech();
    announcedRef.current.clear();
    setState({
      status: 'idle',
      currentStepIndex: 0,
      currentStep: null,
      timeRemaining: 0,
      totalTime: 0,
      nextStepName: null,
      repCount: 0,
      isLastThreeSeconds: false,
      frameIndex: 0,
      currentSet: 1,
      totalSets: 1,
      side: undefined,
      workoutElapsed: 0,
      workoutTotal: estimateWorkoutTotal(stepsRef.current),
      countdownRemaining: START_COUNTDOWN_SEC,
    });
  }, [clearAllTimers, clearElapsedTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
      cancelSpeech();
    };
  }, [clearAllTimers]);

  return {
    state,
    start,
    pause,
    resume,
    next,
    previous,
    skipRest,
    reset,
    totalSteps: expandedSteps.length,
  };
}
