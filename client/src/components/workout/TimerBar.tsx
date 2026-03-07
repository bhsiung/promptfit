/**
 * TimerBar — Horizontal media-player style progress bar
 * Design: Luminous Minimal — thin scrubber line with elapsed/remaining labels
 *
 * Layout:  5s ███████|────────────────────── 25s
 */

import { cn } from '@/lib/utils';

interface TimerBarProps {
  timeRemaining: number;
  totalTime: number;
  isLastThree: boolean;
  mode: 'timer' | 'reps';
  className?: string;
}

export function TimerBar({ timeRemaining, totalTime, isLastThree, mode, className }: TimerBarProps) {
  const progress = totalTime > 0 ? Math.max(0, Math.min(1, timeRemaining / totalTime)) : 1;
  const elapsed = totalTime - timeRemaining;
  // reps mode uses seconds countdown (3s per rep estimate), so always show 's'
  const unit = 's';

  const trackColor = isLastThree ? '#FF3B30' : '#007AFF';

  return (
    <div className={cn('w-full', className)}>
      {/* Labels row */}
      <div className="flex items-center justify-between mb-1.5">
        {/* Elapsed */}
        <span
          className="text-xs font-semibold tabular-nums"
          style={{ color: isLastThree ? '#FF3B30' : '#007AFF' }}
        >
          {elapsed}{unit}
        </span>

        {/* Big countdown number in centre */}
        <span
          className={cn(
            'text-2xl font-bold tabular-nums leading-none tracking-tight',
            isLastThree ? 'text-[#FF3B30] animate-pulse' : 'text-[#1D1D1F]',
          )}
        >
          {timeRemaining}
          <span className="text-sm font-medium text-[#6E6E73] ml-0.5">{unit}</span>
        </span>

        {/* Total */}
        <span className="text-xs font-medium text-[#AEAEB2] tabular-nums">
          {totalTime}{unit}
        </span>
      </div>

      {/* Progress track */}
      <div className="relative h-1 rounded-full bg-[#E5E7EB] overflow-hidden">
        {/* Filled portion (elapsed) */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${(1 - progress) * 100}%`,
            backgroundColor: trackColor,
          }}
        />
        {/* Playhead dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shadow-sm border-2 border-white transition-all duration-1000 ease-linear"
          style={{
            left: `calc(${(1 - progress) * 100}% - 5px)`,
            backgroundColor: trackColor,
          }}
        />
      </div>
    </div>
  );
}
