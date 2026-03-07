/**
 * CountdownRing — Apple Fitness+ style animated SVG countdown circle
 * Design: Luminous Minimal — large centered ring with number in middle
 */

import { cn } from '@/lib/utils';

interface CountdownRingProps {
  timeRemaining: number;
  totalTime: number;
  isLastThree: boolean;
  mode: 'timer' | 'reps';
  className?: string;
}

const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CountdownRing({
  timeRemaining,
  totalTime,
  isLastThree,
  mode,
  className,
}: CountdownRingProps) {
  const progress = totalTime > 0 ? timeRemaining / totalTime : 1;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  // Both reps and timer use the same shrinking ring
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg width="200" height="200" viewBox="0 0 200 200" className="rotate-[-90deg]">
        {/* Track */}
        <circle
          cx="100" cy="100" r={RADIUS}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="8"
        />
        {/* Animated ring */}
        <circle
          cx="100" cy="100" r={RADIUS}
          fill="none"
          stroke={isLastThree ? '#FF3B30' : '#007AFF'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            'text-5xl font-bold tracking-tight leading-none',
            isLastThree ? 'text-[#FF3B30]' : 'text-[#1D1D1F]',
            isLastThree && 'animate-pulse',
          )}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {timeRemaining}
        </span>
        <span className="text-xs font-medium text-[#6E6E73] uppercase tracking-widest mt-1">
          {mode === 'reps' ? 'reps' : 'sec'}
        </span>
      </div>
    </div>
  );
}
