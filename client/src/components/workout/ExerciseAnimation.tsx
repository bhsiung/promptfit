/**
 * ExerciseAnimation — Displays exercise illustration with frame switching
 * Design: Luminous Minimal — clean white card with smooth opacity crossfade
 *
 * Mobile fix: Pixel/Android Chrome can skip CSS transitions on opacity changes
 * when the element is not composited. Using `will-change: opacity` + a GPU-
 * compositing hint (`translateZ(0)`) forces the browser to promote each frame
 * to its own compositing layer, ensuring transitions fire reliably on mobile.
 */

import { cn } from '@/lib/utils';
import { getActiveFramePair, getExerciseFrames } from '@/lib/imageAssets';

const FALLBACK_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298408851/XyFvSN3VK3nvaXR5w2ESua/push_up_frame1_mobile_1x_95235f5b.webp';

function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src !== FALLBACK_URL) img.src = FALLBACK_URL;
}

interface ExerciseAnimationProps {
  exerciseId: string;
  frameIndex: number; // 0 or 1
  isPlaying: boolean;
  side?: 'left' | 'right'; // for unilateral exercises
  className?: string;
}

export function ExerciseAnimation({
  exerciseId,
  frameIndex,
  isPlaying,
  side,
  className,
}: ExerciseAnimationProps) {
  const framePair = getActiveFramePair(exerciseId, side);
  const meta = getExerciseFrames(exerciseId, side);

  return (
    <div
      data-testid="exercise-animation"
      className={cn(
        'relative overflow-hidden rounded-3xl bg-white',
        'shadow-[0_2px_20px_rgba(0,0,0,0.08)]',
        'w-full h-full',
        className,
      )}
    >
      {/* Frame 1 */}
      <img
        src={framePair.frame1.mobile_1x}
        srcSet={`${framePair.frame1.mobile_1x} 1x, ${framePair.frame1.mobile_2x} 2x`}
        alt={`${exerciseId} frame 1`}
        loading="eager"
        draggable={false}
        onError={handleImgError}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          padding: '1rem',
          // GPU compositing — forces mobile browser to honour the transition
          willChange: 'opacity',
          transform: 'translateZ(0)',
          transition: 'opacity 250ms ease-in-out',
          opacity: frameIndex === 0 && isPlaying ? 1 : 0,
        }}
      />
      {/* Frame 2 */}
      <img
        src={framePair.frame2.mobile_1x}
        srcSet={`${framePair.frame2.mobile_1x} 1x, ${framePair.frame2.mobile_2x} 2x`}
        alt={`${exerciseId} frame 2`}
        loading="eager"
        draggable={false}
        onError={handleImgError}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          padding: '1rem',
          willChange: 'opacity',
          transform: 'translateZ(0)',
          transition: 'opacity 250ms ease-in-out',
          opacity: frameIndex === 1 && isPlaying ? 1 : 0,
        }}
      />
      {/* Static frame when paused — always visible, no transition */}
      <img
        src={framePair.frame1.mobile_1x}
        srcSet={`${framePair.frame1.mobile_1x} 1x, ${framePair.frame1.mobile_2x} 2x`}
        alt={`${exerciseId} preview`}
        loading="eager"
        draggable={false}
        onError={handleImgError}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          padding: '1rem',
          transition: 'opacity 200ms ease-in-out',
          opacity: isPlaying ? 0 : 1,
          pointerEvents: 'none',
        }}
      />
      {/* Placeholder badge */}
      {meta.isPlaceholder && (
        <div className="absolute top-3 right-3 bg-[#F5F5F7] rounded-full px-2 py-0.5">
          <span className="text-[10px] font-medium text-[#6E6E73]">Preview</span>
        </div>
      )}
    </div>
  );
}
