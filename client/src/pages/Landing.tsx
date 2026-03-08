/**
 * Landing — Public-facing home page for PromptFit
 * Design: Luminous Minimal — Apple Fitness+ inspired
 */

import { BookOpen, Zap, Link2, Play, ArrowRight, Dumbbell } from 'lucide-react';
import Footer from '@/components/Footer';

const GPT_URL = 'https://chatgpt.com/g/g-6838e4a8e4e08191a7e5d1c8a7b2f3d9-promptfit';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#F0F0F5] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663298408851/XyFvSN3VK3nvaXR5w2ESua/logo-kb4-192_c35ef4c9.png"
              alt="PromptFit"
              className="w-9 h-9 rounded-xl object-cover"
            />
            <div>
              <h1 className="text-base font-bold text-[#1D1D1F] leading-none">PromptFit</h1>
              <p className="text-[11px] text-[#6E6E73]">AI Workout Compiler</p>
            </div>
          </div>
          <nav className="flex items-center gap-5">
            <a href="/library" className="text-sm text-[#6E6E73] hover:text-[#1D1D1F] transition-colors font-medium">
              Library
            </a>
            <a href="/compile" className="text-sm text-[#6E6E73] hover:text-[#1D1D1F] transition-colors font-medium">
              Compiler
            </a>
            <a
              href={GPT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#007AFF] text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#0066DD] transition-colors"
            >
              Try GPT
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-5 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-[#007AFF]/10 text-[#007AFF] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            Powered by GPT Actions
          </div>
          <h2 className="text-5xl font-bold text-[#1D1D1F] tracking-tight leading-tight mb-5">
            Tell GPT what you want.<br />
            <span className="text-[#007AFF]">Start your workout instantly.</span>
          </h2>
          <p className="text-lg text-[#6E6E73] max-w-xl mx-auto leading-relaxed mb-10">
            PromptFit connects ChatGPT to a live workout renderer. Describe your session, and GPT compiles a structured plan and links you directly to it — no app, no account.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href={GPT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#007AFF] text-white font-bold text-base px-7 py-3.5 rounded-2xl shadow-[0_4px_20px_rgba(0,122,255,0.35)] hover:bg-[#0066DD] hover:scale-[1.02] active:scale-[0.99] transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              Open in ChatGPT
            </a>
            <a
              href="/library"
              className="flex items-center gap-2 bg-white text-[#1D1D1F] font-semibold text-base px-7 py-3.5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] hover:scale-[1.02] active:scale-[0.99] transition-all"
            >
              <BookOpen className="w-5 h-5" />
              Browse Exercises
            </a>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-5 pb-20">
          <h3 className="text-center text-xs font-bold text-[#8E8E93] uppercase tracking-widest mb-10">
            How it works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: '01',
                icon: <Zap className="w-6 h-6 text-[#007AFF]" />,
                title: 'Describe your workout',
                desc: 'Tell GPT what you need — muscles, duration, equipment, intensity. It handles the rest.',
              },
              {
                step: '02',
                icon: <Link2 className="w-6 h-6 text-[#34C759]" />,
                title: 'GPT compiles & links',
                desc: 'GPT calls the PromptFit API, gets a stable plan ID, and returns a direct play link.',
              },
              {
                step: '03',
                icon: <Play className="w-6 h-6 fill-[#FF9500] text-[#FF9500]" />,
                title: 'Tap and go',
                desc: 'Open the link on any device. Your workout starts immediately — animated, timed, guided.',
              },
            ].map(({ step, icon, title, desc }) => (
              <div
                key={step}
                className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)] flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-[#F5F5F7] flex items-center justify-center">
                    {icon}
                  </div>
                  <span className="text-2xl font-black text-[#E8E8ED]">{step}</span>
                </div>
                <div>
                  <h4 className="font-bold text-[#1D1D1F] mb-1.5">{title}</h4>
                  <p className="text-sm text-[#6E6E73] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Exercise Library promo */}
        <section className="max-w-5xl mx-auto px-5 pb-20">
          <div className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)] flex flex-col md:flex-row items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-7 h-7 text-[#1D1D1F]" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="font-bold text-[#1D1D1F] text-lg mb-1">100 exercises, all animated</h4>
              <p className="text-sm text-[#6E6E73] leading-relaxed">
                Every exercise in the library has a two-frame animation. Browse by muscle group, see the movement, copy the exact exercise ID for your GPT prompts.
              </p>
            </div>
            <a
              href="/library"
              className="flex items-center gap-2 bg-[#F5F5F7] text-[#1D1D1F] font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#E8E8ED] transition-colors flex-shrink-0"
            >
              View Library
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
