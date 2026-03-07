/**
 * StepProgressBar — Shows progress through workout steps
 * Design: Luminous Minimal — thin dots with active indicator
 */

import { cn } from '@/lib/utils';

interface StepProgressBarProps {
  totalSteps: number;
  currentStep: number;
  className?: string;
}

export function StepProgressBar({ totalSteps, currentStep, className }: StepProgressBarProps) {
  if (totalSteps <= 1) return null;

  // For many steps, show a progress bar instead of dots
  if (totalSteps > 12) {
    const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-[#6E6E73]">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-xs font-medium text-[#6E6E73]">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#007AFF] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center gap-1.5', className)}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full transition-all duration-300',
            i === currentStep
              ? 'w-5 h-2 bg-[#007AFF]'
              : i < currentStep
              ? 'w-2 h-2 bg-[#007AFF] opacity-40'
              : 'w-2 h-2 bg-[#D1D5DB]',
          )}
        />
      ))}
    </div>
  );
}
