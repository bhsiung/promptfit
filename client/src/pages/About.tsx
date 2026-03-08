/**
 * About — About PromptFit page
 */

import { Zap, Link2, Dumbbell, Code2 } from 'lucide-react';
import Footer from '@/components/Footer';
import SiteLogo from '@/components/SiteLogo';

export default function About() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#F0F0F5] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <SiteLogo size={36} />
          <a href="/" className="text-sm text-[#007AFF] font-medium hover:opacity-70 transition-opacity">
            ← Back
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-12">
        {/* Hero */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-[#1D1D1F] tracking-tight mb-4">About PromptFit</h2>
          <p className="text-lg text-[#6E6E73] leading-relaxed">
            PromptFit is an AI-powered workout compiler that bridges ChatGPT and a live workout renderer. Describe your session in natural language — GPT compiles a structured plan and links you directly to it.
          </p>
        </div>

        {/* What it is */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)] mb-6">
          <h3 className="text-xl font-bold text-[#1D1D1F] mb-4">What is PromptFit?</h3>
          <p className="text-[#3C3C43] leading-relaxed mb-4">
            PromptFit is a GPT Action integration — a custom ChatGPT tool that lets you describe a workout in plain English and immediately receive a playable, animated workout session. No app to download, no account to create.
          </p>
          <p className="text-[#3C3C43] leading-relaxed">
            Under the hood, GPT calls the PromptFit API with a structured workout plan. The API validates the plan, assigns it a stable content-addressed ID, and returns a direct play URL. Every exercise in the plan is rendered with a two-frame animation, a countdown timer, and audio cues.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)] mb-6">
          <h3 className="text-xl font-bold text-[#1D1D1F] mb-6">How it works</h3>
          <div className="space-y-5">
            {[
              {
                icon: <Zap className="w-5 h-5 text-[#007AFF]" />,
                title: 'You describe the workout',
                desc: 'Tell the PromptFit GPT what you want — target muscles, duration, available equipment, fitness level. GPT understands natural language and translates it into a structured plan.',
              },
              {
                icon: <Link2 className="w-5 h-5 text-[#34C759]" />,
                title: 'GPT calls the API',
                desc: 'GPT uses the PromptFit Action to POST the plan to our API. The API validates every exercise ID against a whitelist of 100 supported exercises, then returns a stable plan ID.',
              },
              {
                icon: <Dumbbell className="w-5 h-5 text-[#FF9500]" />,
                title: 'You start your workout',
                desc: 'GPT returns a direct play link. Tap it on any device — phone, tablet, desktop. The workout renderer guides you through every exercise with animations, timers, and rest countdowns.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {icon}
                </div>
                <div>
                  <h4 className="font-semibold text-[#1D1D1F] mb-1">{title}</h4>
                  <p className="text-sm text-[#6E6E73] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exercise library */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)] mb-6">
          <h3 className="text-xl font-bold text-[#1D1D1F] mb-4">Exercise Library</h3>
          <p className="text-[#3C3C43] leading-relaxed mb-4">
            PromptFit supports 100 exercises across five categories: Lower Body, Push, Pull, Core, and Conditioning. Every exercise has a unique ID, a two-frame animation, and is categorised by primary muscle group.
          </p>
          <a
            href="/library"
            className="inline-flex items-center gap-2 text-[#007AFF] font-medium text-sm hover:opacity-70 transition-opacity"
          >
            Browse the full exercise library →
          </a>
        </div>

        {/* For developers */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3 mb-4">
            <Code2 className="w-5 h-5 text-[#8E8E93]" />
            <h3 className="text-xl font-bold text-[#1D1D1F]">For Developers</h3>
          </div>
          <p className="text-[#3C3C43] leading-relaxed mb-4">
            The PromptFit API is open. You can POST a workout plan JSON to <code className="bg-[#F5F5F7] px-1.5 py-0.5 rounded text-sm font-mono">/api/get-plan-id</code> and receive a stable, shareable play URL. Plans are content-addressed (SHA-256 Base62) and cached for 30 days with sliding expiration.
          </p>
          <a
            href="/compile"
            className="inline-flex items-center gap-2 text-[#007AFF] font-medium text-sm hover:opacity-70 transition-opacity"
          >
            Open the JSON compiler →
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
