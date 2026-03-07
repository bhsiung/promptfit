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
 * Countdown mode:
 *   Before the first step starts, status = 'countdown' with a 5-second timer.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { announceCountdown, announceCongrats, announceExercise, announceRest, cancelSpeech } from '@/lib/tts';
import type { WorkoutPlan, WorkoutStep } from '@/lib/workoutSchema';
import { getExercise } from '@/lib/exercises';

/** Resolve a human-readable display name for a step */
function getStepDisplayName(step: WorkoutStep): string {
  if (step.label) return step.label;
  const info = getExercise(step.exercise_id);
  if (info) return info.name;
  // Fallback: convert snake_case to Title Case
  return step.exercise_id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export type PlaybackStatus = 'idle' | 'countdown' | 'playing' | 'paused' | 'rest' | 'completed';

export interface PlayerState {
  status: PlaybackStatus;
  currentStepIndex: number;
  currentStep: WorkoutStep | null;
  timeRemaining: number; // seconds countdown
  totalTime: number;     // total seconds for current step/rest
  nextStepName: string | null; // name of the next exercise (for rest preview)
  repCount: number;
  isLastThreeSeconds: boolean;
  frameIndex: number;    // 0 or 1 for animation frame switching
  currentSet: number;    // 1-based current set number
  totalSets: number;     // total sets for current step
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

/** Estimate total workout duration in seconds */
function estimateWorkoutTotal(plan: WorkoutPlan): number {
  const lastIndex = plan.steps.length - 1;
  return plan.steps.reduce((acc, step, index) => {
    const stepTime = step.duration_sec;
    const restTime = step.sets > 1 ? step.set_rest_sec * (step.sets - 1) : 0;
    // Don't add rest_after_sec for the last step — workout ends immediately
    const restAfter = index < lastIndex ? step.rest_after_sec : 0;
    return acc + stepTime * step.sets + restTime + restAfter;
  }, 0);
}

export function useWorkoutPlayer(plan: WorkoutPlan | null) {
  const workoutTotal = plan ? estimateWorkoutTotal(plan) : 0;

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
  // Keep plan in ref to avoid stale closures
  const planRef = useRef<WorkoutPlan | null>(plan);

  useEffect(() => {
    planRef.current = plan;
  }, [plan]);

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
    announceRest(restSec, nextExerciseName);
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
    const currentPlan = planRef.current;
    if (!currentPlan || stepIndex >= currentPlan.steps.length) return;

    const step = currentPlan.steps[stepIndex];
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
    const currentPlan = planRef.current;
    if (!currentPlan) return;

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
      if (nextIndex >= currentPlan.steps.length) {
        clearAllTimers();
        cancelSpeech();
        announceCongrats();
        return { ...prev, status: 'completed' };
      }

      // rest_after_sec: rest AFTER current exercise, before next exercise begins
      const interRestSec = prev.currentStep?.rest_after_sec ?? 0;
      const nextStep = currentPlan.steps[nextIndex];
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
  useEffect(() => {
    if (state.status === 'playing' && state.currentStep) {
      startCountdown();
      startFrameAnimation();
    } else if (state.status === 'paused') {
      clearAllTimers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.currentStep?.exercise_id, state.currentSet, state.totalTime]);

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
    if (!plan || plan.steps.length === 0) return;
    clearAllTimers();
    clearElapsedTimer();
    announcedRef.current.clear();

    const firstStep = plan.steps[0];
    const firstStepName = getStepDisplayName(firstStep);

    setState(prev => ({
      ...prev,
      status: 'countdown',
      countdownRemaining: START_COUNTDOWN_SEC,
      workoutElapsed: 0,
      workoutTotal: estimateWorkoutTotal(plan),
      nextStepName: firstStepName,
    }));

    // Start elapsed timer immediately — it runs through playing, rest, and countdown
    startElapsedTimer();

    // Announce first exercise like rest screen
    announceRest(START_COUNTDOWN_SEC, firstStepName);

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
  }, [plan, loadStep, clearAllTimers, clearCountdown, clearElapsedTimer, startElapsedTimer]);

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
    const currentPlan = planRef.current;
    if (!currentPlan) return;

    setState(prev => {
      const nextSet = prev.currentSet + 1;

      // If there are more sets of same exercise, enter set rest
      if (nextSet <= prev.totalSets) {
        const step = prev.currentStep!;
        const restDuration = step.set_rest_sec;
        const currentStepName = getStepDisplayName(step);
        announcedRef.current.clear();
        return {
          ...prev,
          timeRemaining: restDuration,
          totalTime: restDuration,
          status: 'rest',
          pendingNextSet: nextSet,
          nextStepName: currentStepName,
        };
      }

      // No more sets, check if there's a next step
      const nextIndex = prev.currentStepIndex + 1;
      if (nextIndex >= currentPlan.steps.length) {
        cancelSpeech();
        announceCongrats();
        return { ...prev, status: 'completed' };
      }

      // Enter rest-after period before next step
      const step = prev.currentStep!;
      const restDuration = step.rest_after_sec;
      const nextStep = currentPlan.steps[nextIndex];
      const nextStepName = getStepDisplayName(nextStep);
      announcedRef.current.clear();
      return {
        ...prev,
        timeRemaining: restDuration,
        totalTime: restDuration,
        status: 'rest',
        pendingNextIndex: nextIndex,
        nextStepName,
      };
    });
  }, [clearAllTimers]);

  /** Skip rest or countdown: cancel countdown and immediately load the pending next step */
  const skipRest = useCallback(() => {
    clearAllTimers();
    cancelSpeech();
    announcedRef.current.clear();

    setState(prev => {
      const currentPlan = planRef.current;
      if (!currentPlan) return prev;

      // Handle countdown skip: jump to first step inline
      if (prev.status === 'countdown') {
        const step = currentPlan.steps[0];
        if (!step) return prev;
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

      const step = currentPlan.steps[nextStepIndex];
      if (!step) return prev;

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
        pendingNextSet: undefined,
        pendingNextIndex: undefined,
      };
    });
  }, [clearAllTimers]);

  /** Sets-aware previous: go back to set 1 first, then previous step */
  const previous = useCallback(() => {
    clearAllTimers();
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

      const currentPlan = planRef.current;
      if (!currentPlan) return prev;
      const prevStep = currentPlan.steps[prevIndex];
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
      workoutElapsed: 0,
      workoutTotal: plan ? estimateWorkoutTotal(plan) : 0,
      countdownRemaining: START_COUNTDOWN_SEC,
    });
  }, [clearAllTimers, clearElapsedTimer, plan]);

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
    totalSteps: plan?.steps.length ?? 0,
  };
}
