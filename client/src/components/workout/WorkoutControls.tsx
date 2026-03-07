/**
 * WorkoutControls — Playback control buttons
 * Design: Luminous Minimal — Apple-style frosted glass pill buttons
 */

import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutControlsProps {
  isPlaying: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPlay: () => void;
  onPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}

export function WorkoutControls({
  isPlaying,
  canGoPrev,
  canGoNext,
  onPlay,
  onPause,
  onPrev,
  onNext,
  className,
}: WorkoutControlsProps) {
  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      {/* Previous */}
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        aria-label="Previous exercise"
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center',
          'bg-[#F5F5F7] text-[#1D1D1F]',
          'transition-all duration-150',
          'hover:bg-[#E8E8ED] hover:scale-105 active:scale-95',
          'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100',
        )}
      >
        <SkipBack className="w-5 h-5" />
      </button>

      {/* Play / Pause */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        aria-label={isPlaying ? 'Pause workout' : 'Play workout'}
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center',
          'bg-[#007AFF] text-white',
          'shadow-[0_4px_16px_rgba(0,122,255,0.35)]',
          'transition-all duration-150',
          'hover:bg-[#0066DD] hover:scale-105 active:scale-95',
        )}
      >
        {isPlaying ? (
          <Pause className="w-6 h-6 fill-white" />
        ) : (
          <Play className="w-6 h-6 fill-white ml-0.5" />
        )}
      </button>

      {/* Next */}
      <button
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Next exercise"
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center',
          'bg-[#F5F5F7] text-[#1D1D1F]',
          'transition-all duration-150',
          'hover:bg-[#E8E8ED] hover:scale-105 active:scale-95',
          'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100',
        )}
      >
        <SkipForward className="w-5 h-5" />
      </button>
    </div>
  );
}
