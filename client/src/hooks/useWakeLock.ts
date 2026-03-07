/**
 * useWakeLock — Prevents screen from sleeping during workout
 *
 * Uses the Screen Wake Lock API (supported in Chrome 84+, Safari 16.4+).
 * Automatically re-acquires the lock when the page becomes visible again
 * (e.g. user switches tabs and comes back).
 *
 * Usage:
 *   useWakeLock(isPlaying);  // lock when playing, release when paused/done
 */

import { useEffect, useRef } from 'react';

export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  const acquire = async () => {
    if (!('wakeLock' in navigator)) return;
    if (lockRef.current && !lockRef.current.released) return; // already held
    try {
      lockRef.current = await navigator.wakeLock.request('screen');
    } catch {
      // Silently ignore — user may have denied or browser doesn't support
    }
  };

  const release = async () => {
    if (lockRef.current && !lockRef.current.released) {
      try {
        await lockRef.current.release();
      } catch {
        // ignore
      }
      lockRef.current = null;
    }
  };

  // Acquire / release based on active flag
  useEffect(() => {
    if (active) {
      acquire();
    } else {
      release();
    }
    return () => {
      release();
    };
  }, [active]);

  // Re-acquire when page becomes visible again (tab switch, phone unlock)
  useEffect(() => {
    if (!active) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        acquire();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [active]);
}
