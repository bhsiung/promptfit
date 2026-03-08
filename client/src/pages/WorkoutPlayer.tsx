/**
 * WorkoutPlayer — Main workout playback page
 * Design: Luminous Minimal — Apple Fitness+ inspired
 * Layout: h-screen overflow-hidden — everything fits in one viewport, no scroll
 *   Header (fixed height) → WorkoutProgressBar → StepProgressBar → Animation → InfoCard
 *
 * Data sources (priority order):
 *   1. ?id=<planId>  → fetch from /api/get-plan/:id (Redis)
 *   2. #data=<b64>   → decode inline (legacy / GPT direct link)
 *   3. ?data=<b64>   → legacy query param fallback
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { parseWorkoutFromUrl, validateWorkoutPlan, WorkoutPlan } from '@/lib/workoutSchema';
import { useWorkoutPlayer, START_COUNTDOWN_SEC } from '@/hooks/useWorkoutPlayer';
import { useWakeLock } from '@/hooks/useWakeLock';
import { ExerciseAnimation } from '@/components/workout/ExerciseAnimation';
import { StepProgressBar } from '@/components/workout/StepProgressBar';
import { ExerciseInfoCard } from '@/components/workout/ExerciseInfoCard';
import { CompletionScreen } from '@/components/workout/CompletionScreen';
import { VoicePicker, MuteButton } from '@/components/workout/VoicePicker';
import { AlertCircle, Dumbbell, Loader2, Play } from 'lucide-react';
import { Link } from 'wouter';

type LoadState =
  | { status: 'loading' }
  | { status: 'no_data' }
  | { status: 'error'; errors: Array<{ path: string; message: string }>; isNotFound?: boolean }
  | { status: 'ready'; plan: WorkoutPlan };

/** Format seconds as mm:ss */
function formatTime(sec: number): string {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.max(0, sec) % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function WorkoutPlayer() {
  const [location] = useLocation();
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    const search = window.location.search;
    const hash = window.location.hash;
    const params = new URLSearchParams(search);
    const planId = params.get('id');

    if (planId) {
      setLoadState({ status: 'loading' });
      fetch(`/api/get-plan/${encodeURIComponent(planId)}`)
        .then(async (res) => {
          if (res.status === 404) {
            setLoadState({
              status: 'error',
              errors: [{ path: 'planId', message: 'Plan not found or expired. Please regenerate your workout.' }],
              isNotFound: true,
            });
            return;
          }
          if (!res.ok) {
            setLoadState({
              status: 'error',
              errors: [{ path: 'server', message: `Server error (${res.status}). Please try again.` }],
            });
            return;
          }
          const data = await res.json();
          const result = validateWorkoutPlan(data);
          if (!result.valid) {
            setLoadState({ status: 'error', errors: result.errors });
          } else {
            setLoadState({ status: 'ready', plan: result.plan! });
          }
        })
        .catch(() => {
          setLoadState({
            status: 'error',
            errors: [{ path: 'network', message: 'Network error. Please check your connection and retry.' }],
          });
        });
    } else if (hash || search) {
      const source = hash || search;
      const result = parseWorkoutFromUrl(source);
      if (!result) {
        setLoadState({ status: 'no_data' });
      } else if (!result.valid) {
        setLoadState({ status: 'error', errors: result.errors });
      } else {
        setLoadState({ status: 'ready', plan: result.plan! });
      }
    } else {
      setLoadState({ status: 'no_data' });
    }
  }, [location]);

  const plan = loadState.status === 'ready' ? loadState.plan : null;

  const {
    state,
    start,
    pause,
    resume,
    next,
    previous,
    skipRest,
    reset,
    totalSteps,
  } = useWorkoutPlayer(plan);

  // Wake lock must be called here (before any early returns) to satisfy Rules of Hooks
  // Keep wake lock active during rest too, so screen doesn't dim between sets
  const isActiveForWakeLock = state.status === 'playing' || state.status === 'rest' || state.status === 'countdown';
  useWakeLock(isActiveForWakeLock);

  // Don't auto-start — show Start button instead
  // (removed the auto-start useEffect)

  if (loadState.status === 'loading') return <LoadingScreen />;
  if (loadState.status === 'no_data') return <NoDataScreen />;
  if (loadState.status === 'error') return (
    <ErrorScreen errors={loadState.errors} isNotFound={loadState.isNotFound} />
  );

  if (state.status === 'completed') {
    return (
      <div data-testid="complete-screen" className="h-screen bg-[#F5F5F7] flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-md px-5">
          <CompletionScreen
            totalSteps={totalSteps}
            onRestart={() => { reset(); setTimeout(() => start(), 100); }}
          />
        </div>
      </div>
    );
  }

  // ── Idle: show Start screen ────────────────────────────────────────────────
  if (state.status === 'idle' && plan) {
    return (
      <div className="h-screen bg-[#F5F5F7] flex flex-col overflow-hidden">
        <header className="flex-none flex items-center justify-between px-5 pt-4 pb-2">
          <Link href="/library">
            <button className="text-[#007AFF] text-sm font-medium hover:opacity-70 transition-opacity">
              ← Library
            </button>
          </Link>
          {plan.title && (
            <h1 className="text-sm font-semibold text-[#1D1D1F] truncate max-w-[180px]">
              {plan.title}
            </h1>
          )}
          <VoicePicker />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
            <Dumbbell className="w-10 h-10 text-[#007AFF]" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-[#1D1D1F]">{plan.title ?? 'Workout'}</h2>
            {plan.description && (
              <p className="text-[#3C3C43] text-sm leading-relaxed max-w-xs mx-auto">
                {plan.description}
              </p>
            )}
            <p className="text-[#6E6E73] text-xs mt-1">
              {totalSteps} exercise{totalSteps !== 1 ? 's' : ''} · ~{Math.round(state.workoutTotal / 60)} min
            </p>
          </div>
          <button
            onClick={start}
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#007AFF] text-white font-semibold text-base shadow-[0_4px_16px_rgba(0,122,255,0.35)] hover:bg-[#0066DD] active:scale-95 transition-all"
          >
            <Play className="w-5 h-5 fill-white" />
            Start Workout
          </button>
        </div>
      </div>
    );
  }

  // ── Rest screen ──────────────────────────────────────────────────────────
  if (state.status === 'rest') {
    const restProgress = state.totalTime > 0 ? state.timeRemaining / state.totalTime : 0;
    return (
      <div data-testid="rest-screen" className="h-screen bg-[#1C1C1E] flex flex-col items-center justify-center overflow-hidden px-8">
        <p className="text-white/50 text-xs font-semibold tracking-widest uppercase mb-6">Rest</p>

        {/* Big countdown */}
        <div className="relative flex items-center justify-center mb-6">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="#34C759"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - restProgress)}`}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span data-testid="rest-timer" className="text-5xl font-black text-white tabular-nums leading-none">
              {state.timeRemaining}
            </span>
            <span className="text-white/40 text-xs mt-1">seconds</span>
          </div>
        </div>

        {/* Next exercise preview */}
        {state.nextStepName && (
          <div className="text-center mb-8">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Next up</p>
            <p data-testid="rest-next-exercise" className="text-white text-lg font-semibold">{state.nextStepName}</p>
          </div>
        )}

        {/* Skip rest button */}
        <button
          data-testid="skip-rest-btn"
          onClick={skipRest}
          className="mt-2 px-6 py-2.5 rounded-full border border-white/20 text-white/60 text-sm font-medium hover:border-white/40 hover:text-white/80 active:scale-95 transition-all"
        >
          Skip Rest
        </button>
      </div>
    );
  }

  // ── Countdown overlay (same style as rest screen) ────────────────────────
  if (state.status === 'countdown') {
    const cdProgress = state.countdownRemaining / START_COUNTDOWN_SEC;
    return (
      <div className="h-screen bg-[#1C1C1E] flex flex-col items-center justify-center overflow-hidden px-8">
        <p className="text-white/50 text-xs font-semibold tracking-widest uppercase mb-6">Get Ready</p>

        {/* Big countdown ring */}
        <div className="relative flex items-center justify-center mb-6">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="#007AFF"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - cdProgress)}`}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-black text-white tabular-nums leading-none">
              {state.countdownRemaining}
            </span>
            <span className="text-white/40 text-xs mt-1">seconds</span>
          </div>
        </div>

        {/* First exercise preview */}
        {state.nextStepName && (
          <div className="text-center mb-8">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">First up</p>
            <p className="text-white text-lg font-semibold">{state.nextStepName}</p>
          </div>
        )}

        {/* Skip countdown button */}
        <button
          data-testid="skip-countdown-btn"
          onClick={() => { skipRest(); }}
          className="mt-2 px-6 py-2.5 rounded-full border border-white/20 text-white/60 text-sm font-medium hover:border-white/40 hover:text-white/80 active:scale-95 transition-all"
        >
          Skip
        </button>
      </div>
    );
  }

  const { currentStep, timeRemaining, totalTime, isLastThreeSeconds, frameIndex, status, currentSet, totalSets, workoutElapsed, workoutTotal, side } = state;
  const isPlaying = status === 'playing';
  const workoutRemaining = Math.max(0, workoutTotal - workoutElapsed);
  const workoutProgress = workoutTotal > 0 ? Math.min(1, workoutElapsed / workoutTotal) : 0;

  // Sets-aware canGoPrev/canGoNext
  const canGoPrev = state.currentStepIndex > 0 || currentSet > 1;
  const canGoNext = state.currentStepIndex < totalSteps - 1 || currentSet < totalSets;

  return (
    <div className="h-screen bg-[#F5F5F7] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-none flex items-center justify-between px-5 pt-4 pb-2">
        <Link href="/library">
          <button className="text-[#007AFF] text-sm font-medium hover:opacity-70 transition-opacity">
            ← Library
          </button>
        </Link>
        {plan?.title && (
          <h1 className="text-sm font-semibold text-[#1D1D1F] truncate max-w-[180px]">
            {plan.title}
          </h1>
        )}
        <VoicePicker />
      </header>

      {/* Workout-level progress bar */}
      <div className="flex-none px-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span data-testid="workout-elapsed" className="text-[11px] font-medium text-[#6E6E73]">
            {formatTime(workoutElapsed)} elapsed
          </span>
          <span data-testid="workout-remaining" className="text-[11px] font-medium text-[#6E6E73]">
            ~{formatTime(workoutRemaining)} left
          </span>
        </div>
        <div className="h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#007AFF] rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${workoutProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Step progress bar */}
      <div className="flex-none px-5 pb-3">
        <StepProgressBar
          currentStep={state.currentStepIndex}
          totalSteps={totalSteps}
        />
      </div>

      {/* Main content: animation + info card, vertically centered */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-5 py-4 overflow-y-auto">
        {currentStep && (
          <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 640 }}>
            {/* Animation card — flexible height, image contained within */}
            <ExerciseAnimation
              exerciseId={currentStep.exercise_id}
              frameIndex={frameIndex}
              isPlaying={isPlaying}
              side={side}
              style={{ height: 'min(48vh, 400px)', width: '100%' }}
            />

            {/* Info card */}
            <ExerciseInfoCard
              step={currentStep}
              side={side}
              currentSet={currentSet}
              totalSets={totalSets}
              timeRemaining={timeRemaining}
              totalTime={totalTime}
              isPlaying={isPlaying}
              isLastThree={isLastThreeSeconds}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              onPause={pause}
              onPlay={resume}
              onNext={next}
              onPrev={previous}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen bg-[#F5F5F7] flex flex-col items-center justify-center px-8 text-center overflow-hidden">
      <Loader2 className="w-10 h-10 text-[#007AFF] animate-spin mb-4" />
      <p className="text-[#6E6E73] text-sm">Loading workout...</p>
    </div>
  );
}

function NoDataScreen() {
  return (
    <div className="h-screen bg-[#F5F5F7] flex flex-col items-center justify-center px-8 text-center overflow-hidden">
      <div className="w-16 h-16 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center mb-5">
        <Dumbbell className="w-8 h-8 text-[#007AFF]" />
      </div>
      <h1 className="text-2xl font-bold text-[#1D1D1F] mb-2">No Workout Loaded</h1>
      <p className="text-[#6E6E73] text-sm mb-6 max-w-xs leading-relaxed">
        Pass a workout plan via <code className="bg-[#E8E8ED] px-1 rounded text-xs">?id=</code> or the{' '}
        <code className="bg-[#E8E8ED] px-1 rounded text-xs">#data=</code> URL hash, or browse the exercise library.
      </p>
      <Link href="/library">
        <button className="px-6 py-2.5 rounded-full bg-[#007AFF] text-white font-semibold text-sm shadow-[0_4px_12px_rgba(0,122,255,0.3)] hover:bg-[#0066DD] transition-colors">
          Browse Exercises
        </button>
      </Link>
    </div>
  );
}

function ErrorScreen({ errors, isNotFound }: { errors: Array<{ path: string; message: string }>; isNotFound?: boolean }) {
  return (
    <div className="h-screen bg-[#F5F5F7] flex flex-col items-center justify-center px-6 overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#FF3B30]/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-[#FF3B30]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1D1D1F]">
              {isNotFound ? 'Plan Not Found' : 'Invalid Workout Plan'}
            </h2>
            <p className="text-xs text-[#6E6E73]">{errors.length} error{errors.length !== 1 ? 's' : ''} found</p>
          </div>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {errors.map((err, i) => (
            <div key={i} className="bg-[#FFF5F5] rounded-xl p-3">
              <p className="text-xs font-mono font-semibold text-[#FF3B30] mb-0.5">{err.path}</p>
              <p className="text-xs text-[#3C3C43]">{err.message}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link href="/">
            <button className="w-full py-2.5 rounded-full bg-[#007AFF] text-white font-semibold text-sm hover:bg-[#0066DD] transition-colors">
              {isNotFound ? 'Generate New Workout' : 'Try Again'}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
