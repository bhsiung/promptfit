/**
 * VoicePicker — TTS voice selector + mute toggle, combined in one gear popover
 * Design: Luminous Minimal — compact settings in header
 *
 * Key fixes:
 *   - Gear icon ALWAYS renders (never returns null), even before voices load
 *   - Mute toggle is inside the popover (no separate MuteButton needed)
 *   - Mute state persisted in localStorage via tts.ts helpers
 */

import { useEffect, useState, useRef } from 'react';
import { Settings2, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSortedEnglishVoices,
  setSelectedVoice,
  getSelectedVoice,
  speak,
  isMuted,
  setMuted,
} from '@/lib/tts';

export function VoicePicker() {
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [muted, setMutedState] = useState(() => isMuted());
  const popoverRef = useRef<HTMLDivElement>(null);

  // Load voices — async on Android Chrome, sync on iOS Safari
  useEffect(() => {
    const load = () => {
      const sorted = getSortedEnglishVoices();
      setVoices(sorted);
      if (!getSelectedVoice() && sorted.length > 0) {
        setSelectedVoice(sorted[0]);
        setSelected(sorted[0].name);
      } else if (getSelectedVoice()) {
        setSelected(getSelectedVoice()!.name);
      }
    };

    load();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = load;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) {
      // Brief confirmation when unmuting
      setTimeout(() => speak('Sound on', 0.9, 1.0), 50);
    }
  };

  const handleSelectVoice = (voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
    setSelected(voice.name);
    // Unmute if muted so user can hear the preview
    if (muted) {
      setMuted(false);
      setMutedState(false);
    }
    speak('Ready!', 1.0, 1.0);
    setOpen(false);
  };

  const qualityLabel = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('enhanced') || n.includes('premium') || n.includes('neural')) return '★★★';
    if (n.includes('google') || n.includes('siri') || n.includes('samantha') || n.includes('alex')) return '★★';
    return '★';
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Gear button — always visible */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Voice settings"
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center',
          'text-[#6E6E73] hover:text-[#007AFF] hover:bg-[#007AFF]/10',
          'transition-colors',
          open && 'text-[#007AFF] bg-[#007AFF]/10',
          muted && !open && 'text-[#FF3B30]',
        )}
      >
        <Settings2 className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.14)] border border-[#F0F0F5] overflow-hidden">
          {/* Mute toggle row */}
          <div className="px-4 py-3 border-b border-[#F0F0F5]">
            <button
              onClick={handleToggleMute}
              className={cn(
                'w-full flex items-center justify-between rounded-xl px-3 py-2.5',
                'transition-colors',
                muted ? 'bg-[#FF3B30]/8 hover:bg-[#FF3B30]/14' : 'bg-[#F5F5F7] hover:bg-[#EBEBF0]',
              )}
            >
              <div className="flex items-center gap-2.5">
                {muted
                  ? <VolumeX className="w-4 h-4 text-[#FF3B30]" />
                  : <Volume2 className="w-4 h-4 text-[#007AFF]" />
                }
                <span className={cn(
                  'text-sm font-medium',
                  muted ? 'text-[#FF3B30]' : 'text-[#1D1D1F]',
                )}>
                  {muted ? 'Voice Off — tap to unmute' : 'Voice On'}
                </span>
              </div>
              {/* Toggle pill */}
              <div className={cn(
                'w-10 h-6 rounded-full transition-colors relative flex-shrink-0',
                muted ? 'bg-[#E5E5EA]' : 'bg-[#34C759]',
              )}>
                <div className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
                  muted ? 'translate-x-0.5' : 'translate-x-4',
                )} />
              </div>
            </button>
          </div>

          {/* Voice list */}
          {voices.length > 0 ? (
            <>
              <div className="px-4 pt-2.5 pb-1">
                <p className="text-[10px] font-semibold text-[#AEAEB2] uppercase tracking-wider">Voice</p>
                <p className="text-[10px] text-[#C7C7CC] mt-0.5">★★★ = enhanced / neural quality</p>
              </div>
              <div className="max-h-56 overflow-y-auto pb-1">
                {voices.map(voice => (
                  <button
                    key={voice.name}
                    onClick={() => handleSelectVoice(voice)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-2.5',
                      'text-left transition-colors',
                      'hover:bg-[#F5F5F7]',
                      selected === voice.name && 'bg-[#007AFF]/8',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-xs font-medium truncate',
                        selected === voice.name ? 'text-[#007AFF]' : 'text-[#1D1D1F]',
                      )}>
                        {voice.name}
                      </p>
                      <p className="text-[10px] text-[#AEAEB2] truncate">{voice.lang}</p>
                    </div>
                    <span className="text-[10px] text-[#AEAEB2] ml-2 flex-shrink-0">
                      {qualityLabel(voice.name)}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="px-4 py-3 text-center">
              <p className="text-xs text-[#AEAEB2]">Loading voices…</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Keep MuteButton export for backward compat but make it a no-op wrapper
// (WorkoutPlayer still imports it; we'll clean up the import separately)
export function MuteButton() {
  return null;
}
