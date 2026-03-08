/**
 * CompletionScreen — Shown when workout is complete
 * Design: Luminous Minimal — celebratory but clean Apple style
 */

import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompletionScreenProps {
  totalSteps: number;
  caloriesBurned?: number;
  onRestart: () => void;
  className?: string;
}

export function CompletionScreen({ totalSteps, caloriesBurned, onRestart, className }: CompletionScreenProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-8 py-16',
        className,
      )}
    >
      {/* Trophy icon */}
      <div className="w-24 h-24 rounded-full bg-[#FFF9E6] flex items-center justify-center mb-6 shadow-[0_4px_24px_rgba(255,204,0,0.25)]">
        <Trophy className="w-12 h-12 text-[#FFCC00]" />
      </div>

      {/* Headline */}
      <h1 className="text-3xl font-bold text-[#1D1D1F] mb-2 tracking-tight">
        Workout Complete!
      </h1>
      <p className="text-[#6E6E73] text-base mb-1">
        You crushed {totalSteps} exercise{totalSteps !== 1 ? 's' : ''}.
      </p>
      {caloriesBurned !== undefined && caloriesBurned > 0 && (
        <div className="flex items-center gap-2 mb-4 px-5 py-2.5 rounded-full bg-[#FFF3E0] border border-[#FFCC00]/30">
          <span className="text-xl">🔥</span>
          <span className="text-sm font-semibold text-[#FF6B00]">
            ~{Math.round(caloriesBurned)} kcal burned
          </span>
          <span className="text-xs text-[#6E6E73]">(70 kg basis)</span>
        </div>
      )}
      <p className="text-[#6E6E73] text-sm mb-10">
        Great job — keep up the momentum!
      </p>

      {/* Restart button */}
      <button
        onClick={onRestart}
        className={cn(
          'px-8 py-3 rounded-full',
          'bg-[#007AFF] text-white font-semibold text-base',
          'shadow-[0_4px_16px_rgba(0,122,255,0.3)]',
          'transition-all duration-150 hover:bg-[#0066DD] hover:scale-105 active:scale-95',
        )}
      >
        Restart Workout
      </button>
    </div>
  );
}
