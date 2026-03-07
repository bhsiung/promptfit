/**
 * ExerciseInfoCard — Shows exercise name, muscles, tips, controls, timer
 * Design: Luminous Minimal — compact card, no separators, tight spacing
 * Goal: All content fits in one screen without scrolling
 */

import { cn } from '@/lib/utils';
import { getExercise, CATEGORY_CONFIG } from '@/lib/exercises';
import type { WorkoutStep } from '@/lib/workoutSchema';
import { TimerBar } from './TimerBar';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';

interface ExerciseInfoCardProps {
  step: WorkoutStep;
  className?: string;
  // Set progress (1-based)
  currentSet?: number;
  totalSets?: number;
  // Timer props
  timeRemaining?: number;
  totalTime?: number;
  isLastThree?: boolean;
  isPlaying?: boolean;
  // Playback controls
  canGoPrev?: boolean;
  canGoNext?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function ExerciseInfoCard({
  step,
  className,
  currentSet,
  totalSets,
  timeRemaining,
  totalTime,
  isLastThree = false,
  isPlaying = false,
  canGoPrev = false,
  canGoNext = false,
  onPlay,
  onPause,
  onPrev,
  onNext,
}: ExerciseInfoCardProps) {
  const exercise = getExercise(step.exercise_id);
  const category = exercise?.category ?? 'conditioning';
  const config = CATEGORY_CONFIG[category];
  const displayName = step.label ?? exercise?.name ?? step.exercise_id.replace(/_/g, ' ');

  // Determine set badge display:
  // - multi-set in progress → "Set X / Y"  (blue pill)
  // - single set or no set info → nothing
  const hasMultipleSets = totalSets !== undefined && totalSets > 1;
  const setLabel = hasMultipleSets && currentSet
    ? `Set ${currentSet} / ${totalSets}`
    : null;

  return (
    <div
      className={cn(
        'rounded-2xl bg-white border border-[#F0F0F5]',
        'shadow-[0_1px_8px_rgba(0,0,0,0.06)]',
        'px-4 py-3 flex flex-col gap-2',
        className,
      )}
    >
      {/* Row 1: Category badge + set progress */}
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: config.color }}
        />
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
        {setLabel && (
          <span data-testid="set-badge" className="ml-auto text-[11px] font-semibold text-[#007AFF] bg-[#EAF3FF] px-2 py-0.5 rounded-full">
            {setLabel}
          </span>
        )}
      </div>

      {/* Row 2: Exercise name + reps goal (when present) */}
      <div className="flex items-baseline gap-3">
        <h2 data-testid="exercise-name" className="text-lg font-bold text-[#1D1D1F] leading-tight flex-1">
          {displayName}
        </h2>
        <div className="flex items-baseline gap-1 flex-shrink-0">
          {step.reps && (
            <>
              <span className="text-xl font-bold text-[#007AFF]">{step.reps}</span>
              <span className="text-xs text-[#6E6E73] font-medium">reps</span>
            </>
          )}
          {!step.reps && step.duration_sec && (
            <>
              <span className="text-xl font-bold text-[#007AFF]">{step.duration_sec}</span>
              <span className="text-xs text-[#6E6E73] font-medium">sec</span>
            </>
          )}
        </div>
      </div>

      {/* Row 3: Muscle tags */}
      {exercise?.primary_muscles && exercise.primary_muscles.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {exercise.primary_muscles.slice(0, 4).map(muscle => (
            <span
              key={muscle}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F5F5F7] text-[#3C3C43]"
            >
              {muscle}
            </span>
          ))}
          {step.set_rest_sec > 0 && step.sets > 1 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FFF3E0] text-[#FF9500]">
              Set rest {step.set_rest_sec}s
            </span>
          )}
          {step.rest_after_sec > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#34C759] ml-auto">
              Rest after {step.rest_after_sec}s
            </span>
          )}
        </div>
      )}

      {/* Row 4: Controls (no separator, just spacing from gap-2) */}
      {(onPlay || onPause) && (
        <div className="flex items-center justify-center gap-3 py-1">
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            aria-label="Previous exercise"
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center',
              'bg-[#F5F5F7] text-[#1D1D1F]',
              'transition-all duration-150',
              'hover:bg-[#E8E8ED] hover:scale-105 active:scale-95',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100',
            )}
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            aria-label={isPlaying ? 'Pause workout' : 'Play workout'}
            className={cn(
              'w-13 h-13 rounded-full flex items-center justify-center',
              'bg-[#007AFF] text-white',
              'shadow-[0_4px_14px_rgba(0,122,255,0.35)]',
              'transition-all duration-150',
              'hover:bg-[#0066DD] hover:scale-105 active:scale-95',
            )}
            style={{ width: 52, height: 52 }}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            disabled={!canGoNext}
            aria-label="Next exercise"
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center',
              'bg-[#F5F5F7] text-[#1D1D1F]',
              'transition-all duration-150',
              'hover:bg-[#E8E8ED] hover:scale-105 active:scale-95',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100',
            )}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Row 5: Timer bar */}
      {timeRemaining !== undefined && totalTime !== undefined && totalTime > 0 && (
        <div data-testid="step-timer-container">
          <TimerBar
            timeRemaining={timeRemaining}
            totalTime={totalTime}
            isLastThree={isLastThree}
            mode={step.reps !== undefined ? 'reps' : 'timer'}
          />
        </div>
      )}

      {/* Row 6: Pro tip (compact, no separator) */}
      {exercise?.pro_tips && exercise.pro_tips.length > 0 && (
        <p className="text-[11px] text-[#6E6E73] leading-relaxed">
          <span className="font-semibold text-[#3C3C43]">Tip: </span>
          {exercise.pro_tips[0]}
        </p>
      )}


    </div>
  );
}
