/**
 * Workout Renderer — Text-to-Speech Utilities
 * Uses Web Speech API (SpeechSynthesis) for voice announcements.
 * Pure builder functions are separated for testability.
 */

// ─── Pure text builders (testable, no side effects) ─────────────────────────

export function buildExerciseAnnouncement(
  name: string,
  mode: 'reps' | 'timer',
  reps?: number,
  durationSec?: number,
): string {
  if (mode === 'reps' && reps !== undefined) {
    // Tell user how many reps and the estimated time budget (3s per rep)
    const estSec = reps * 3;
    return `${name}. ${reps} rep${reps !== 1 ? 's' : ''}, ${estSec} seconds.`;
  }
  if (mode === 'timer' && durationSec !== undefined) {
    return `${name}. ${durationSec} second${durationSec !== 1 ? 's' : ''}.`;
  }
  return `${name}.`;
}

export function buildRestAnnouncement(seconds: number, nextExerciseName?: string): string {
  const restText = `Rest. ${seconds} second${seconds !== 1 ? 's' : ''}.`;
  if (nextExerciseName) {
    return `${restText} Next up: ${nextExerciseName}.`;
  }
  return restText;
}

export function buildCountdownText(seconds: number): string | null {
  if (seconds === 3 || seconds === 2 || seconds === 1) {
    return String(seconds);
  }
  return null;
}

export function buildCompletionText(): string {
  return 'Congratulations! Workout complete. Great job!';
}

// ─── Voice management ────────────────────────────────────────────────────────

/** Returns all available SpeechSynthesisVoice objects, sorted by quality heuristic */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * Quality-sorted voices: prefer enhanced/premium/neural voices,
 * then Google voices, then Apple, then others.
 */
export function getSortedEnglishVoices(): SpeechSynthesisVoice[] {
  const voices = getAvailableVoices().filter(v =>
    v.lang.startsWith('en') || v.lang === '',
  );

  const score = (v: SpeechSynthesisVoice): number => {
    const name = v.name.toLowerCase();
    if (name.includes('enhanced') || name.includes('premium') || name.includes('neural')) return 100;
    if (name.includes('google')) return 80;
    if (name.includes('siri') || name.includes('samantha') || name.includes('alex')) return 70;
    if (name.includes('microsoft')) return 60;
    if (v.localService) return 40;
    return 20;
  };

  return voices.sort((a, b) => score(b) - score(a));
}

/** Get best default voice automatically */
export function getBestDefaultVoice(): SpeechSynthesisVoice | null {
  const sorted = getSortedEnglishVoices();
  return sorted[0] ?? null;
}

// ─── Global voice state (shared across all speak calls) ─────────────────────
let _selectedVoice: SpeechSynthesisVoice | null = null;

// ─── Mute state (persisted in localStorage) ─────────────────────────────────
const MUTE_KEY = 'workout_muted';

export function isMuted(): boolean {
  if (typeof window === 'undefined') return false;
  // Explicit 'true' only — missing key or any other value = NOT muted
  return localStorage.getItem(MUTE_KEY) === 'true';
}

export function setMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  if (muted) {
    localStorage.setItem(MUTE_KEY, 'true');
    // Stop any ongoing speech immediately
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  } else {
    localStorage.removeItem(MUTE_KEY); // remove key entirely so isMuted() returns false
  }
}

export function setSelectedVoice(voice: SpeechSynthesisVoice | null): void {
  _selectedVoice = voice;
}

export function getSelectedVoice(): SpeechSynthesisVoice | null {
  return _selectedVoice;
}

// ─── Side-effectful speech functions ────────────────────────────────────────

export function speak(text: string, rate = 1.0, pitch = 1.0): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  if (isMuted()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = 1;

  // Use selected voice, or fall back to best available
  const voice = _selectedVoice ?? getBestDefaultVoice();
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function announceExercise(
  name: string,
  mode: 'reps' | 'timer',
  reps?: number,
  durationSec?: number,
): void {
  speak(buildExerciseAnnouncement(name, mode, reps, durationSec), 0.95, 1.0);
}

export function announceCountdown(count: number): void {
  const text = buildCountdownText(count);
  if (text) speak(text, 1.1, 1.1);
}

export function announceCongrats(): void {
  speak(buildCompletionText(), 0.9, 1.05);
}

export function announceRest(seconds: number, nextExerciseName?: string): void {
  speak(buildRestAnnouncement(seconds, nextExerciseName), 0.95, 1.0);
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
