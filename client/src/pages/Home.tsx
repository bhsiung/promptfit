/**
 * Home — Landing page with JSON input and workout launcher
 * Design: Luminous Minimal — Apple style with clean textarea and validation
 */

import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { BookOpen, Play, AlertCircle, CheckCircle2, ChevronDown, Loader2 } from 'lucide-react';
import { parseAndValidateWorkout } from '@/lib/workoutSchema';
import { cn } from '@/lib/utils';

// Sample workout demonstrating the declarative schema:
// - No `mode` field — all steps are timer-driven
// - All required fields explicit (duration_sec, sets, set_rest_sec, rest_after_sec)
// - reps is optional — shows "X reps" goal alongside the countdown
// - side_plank is unilateral → auto-split into Left / Right at runtime
const SAMPLE_WORKOUT = JSON.stringify(
  {
    title: 'Full Body Starter',
    description: 'A balanced 5-exercise circuit covering push, core, and lower body.',
    steps: [
      {
        type: 'warmup',
        exercise_id: 'high_knees',
        duration_sec: 30,
        sets: 1,
        set_rest_sec: 0,
        rest_after_sec: 10,
      },
      {
        type: 'work',
        exercise_id: 'push_up',
        reps: 12,
        duration_sec: 40,
        sets: 3,
        set_rest_sec: 20,
        rest_after_sec: 30,
      },
      {
        type: 'work',
        exercise_id: 'bodyweight_squat',
        reps: 15,
        duration_sec: 45,
        sets: 3,
        set_rest_sec: 20,
        rest_after_sec: 30,
      },
      {
        type: 'core',
        exercise_id: 'side_plank',
        duration_sec: 40,
        sets: 2,
        set_rest_sec: 15,
        rest_after_sec: 20,
      },
      {
        type: 'core',
        exercise_id: 'dead_bug',
        reps: 10,
        duration_sec: 40,
        sets: 2,
        set_rest_sec: 15,
        rest_after_sec: 0,
      },
    ],
  },
  null,
  2,
);

export default function Home() {
  const [, navigate] = useLocation();
  const [jsonInput, setJsonInput] = useState('');
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'error'>('idle');
  const [errors, setErrors] = useState<Array<{ path: string; message: string }>>([]);
  const [showSample, setShowSample] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const handleValidate = useCallback((value: string) => {
    if (!value.trim()) {
      setValidationState('idle');
      setErrors([]);
      return;
    }
    const result = parseAndValidateWorkout(value);
    if (result.valid) {
      setValidationState('valid');
      setErrors([]);
    } else {
      setValidationState('error');
      setErrors(result.errors);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setJsonInput(value);
    handleValidate(value);
  };

  const handleLaunch = async () => {
    if (validationState !== 'valid' || launching) return;
    setLaunching(true);
    setLaunchError(null);
    try {
      const body = JSON.parse(jsonInput);
      const res = await fetch('/api/get-plan-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const { id } = await res.json();
        navigate(`/play?id=${encodeURIComponent(id)}`);
      } else {
        const err = await res.json().catch(() => ({}));
        setLaunchError(err.error ?? `Server error (${res.status})`);
      }
    } catch {
      setLaunchError('Network error. Please try again.');
    } finally {
      setLaunching(false);
    }
  };

  const handleLoadSample = () => {
    setJsonInput(SAMPLE_WORKOUT);
    handleValidate(SAMPLE_WORKOUT);
    setShowSample(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#F0F0F5]">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663298408851/XyFvSN3VK3nvaXR5w2ESua/logo-kb4-192_c35ef4c9.png"
              alt="AI Workout"
              className="w-9 h-9 rounded-xl object-cover"
            />
            <div>
              <h1 className="text-base font-bold text-[#1D1D1F] leading-none">Workout Renderer</h1>
              <p className="text-[11px] text-[#6E6E73]">AI Workout Compiler</p>
            </div>
          </div>
          <a href="/library">
            <button className="flex items-center gap-1.5 text-[#007AFF] text-sm font-medium hover:opacity-70 transition-opacity">
              <BookOpen className="w-4 h-4" />
              Library
            </button>
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-8 flex flex-col gap-6">
        {/* Hero */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1D1D1F] mb-2 tracking-tight">
            Paste Your Workout Plan
          </h2>
          <p className="text-[#6E6E73] text-sm leading-relaxed">
            Paste a JSON workout plan below and launch your session. GPT can generate plans and link directly to this page.
          </p>
        </div>

        {/* JSON Input Card */}
        <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.07)] overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F5]">
            <span className="text-xs font-semibold text-[#3C3C43] uppercase tracking-wider">
              workout-plan.json
            </span>
            <div className="flex items-center gap-2">
              {validationState === 'valid' && (
                <div className="flex items-center gap-1 text-[#34C759]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Valid</span>
                </div>
              )}
              {validationState === 'error' && (
                <div className="flex items-center gap-1 text-[#FF3B30]">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{errors.length} error{errors.length !== 1 ? 's' : ''}</span>
                </div>
              )}
              <button
                onClick={() => setShowSample(s => !s)}
                className="flex items-center gap-1 text-xs font-medium text-[#007AFF] hover:opacity-70 transition-opacity"
              >
                Sample
                <ChevronDown className={cn('w-3 h-3 transition-transform', showSample && 'rotate-180')} />
              </button>
            </div>
          </div>

          {/* Sample dropdown */}
          {showSample && (
            <div className="px-4 py-3 bg-[#F9F9FB] border-b border-[#F0F0F5]">
              <p className="text-xs text-[#6E6E73] mb-2">Load a sample workout to get started:</p>
              <button
                onClick={handleLoadSample}
                className="text-xs font-medium text-[#007AFF] hover:opacity-70 transition-opacity"
              >
                Quick Upper Body (4 exercises) →
              </button>
            </div>
          )}

          {/* Textarea */}
          <textarea
            value={jsonInput}
            onChange={e => handleInputChange(e.target.value)}
            placeholder={`{\n  "title": "My Workout",\n  "steps": [\n    {\n      "type": "work",\n      "exercise_id": "push_up",\n      "reps": 10,\n      "duration_sec": 40,\n      "sets": 3,\n      "set_rest_sec": 20,\n      "rest_after_sec": 30\n    }\n  ]\n}`}
            className={cn(
              'w-full h-56 px-4 py-3 font-mono text-xs text-[#1D1D1F] bg-transparent',
              'placeholder:text-[#C7C7CC] focus:outline-none resize-none',
              'leading-relaxed',
            )}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />

          {/* Errors */}
          {validationState === 'error' && errors.length > 0 && (
            <div className="border-t border-[#F0F0F5] px-4 py-3 bg-[#FFF5F5] max-h-36 overflow-y-auto">
              <div className="space-y-1.5">
                {errors.map((err, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-[10px] font-mono font-bold text-[#FF3B30] flex-shrink-0 mt-0.5">
                      {err.path}
                    </span>
                    <span className="text-[10px] text-[#3C3C43]">{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Launch button */}
        <button
          onClick={handleLaunch}
          disabled={validationState !== 'valid' || launching}
          className={cn(
            'w-full py-4 rounded-2xl font-bold text-base',
            'flex items-center justify-center gap-2',
            'transition-all duration-150',
            validationState === 'valid' && !launching
              ? 'bg-[#007AFF] text-white shadow-[0_4px_20px_rgba(0,122,255,0.35)] hover:bg-[#0066DD] hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-[#E8E8ED] text-[#8E8E93] cursor-not-allowed',
          )}
        >
          {launching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Play className={cn('w-5 h-5', validationState === 'valid' ? 'fill-white' : 'fill-[#8E8E93]')} />
          )}
          {launching ? 'Generating link...' : 'Start Workout'}
        </button>
        {launchError && (
          <div className="flex items-center gap-2 text-[#FF3B30] text-xs bg-[#FFF5F5] rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {launchError}
          </div>
        )}

        {/* URL param info */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_1px_8px_rgba(0,0,0,0.05)]">
          <h3 className="text-xs font-bold text-[#3C3C43] uppercase tracking-wider mb-2">
            GPT Integration
          </h3>
          <p className="text-xs text-[#6E6E73] leading-relaxed mb-2">
            GPT posts the plan JSON to <code className="bg-[#F5F5F7] px-1 rounded">POST /api/get-plan-id</code>, receives a stable content-addressed ID, then links directly:
          </p>
          <code className="block text-[10px] font-mono bg-[#F5F5F7] rounded-lg px-3 py-2 text-[#3C3C43] break-all">
            {window.location.origin}/play?id=&lt;planId&gt;
          </code>
          <p className="text-[10px] text-[#8E8E93] mt-2 leading-relaxed">
            Same plan JSON always produces the same ID (SHA-256 Base62). Plans are cached for 30 days with sliding expiration.
          </p>
        </div>
      </main>
    </div>
  );
}
