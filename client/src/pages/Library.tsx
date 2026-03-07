/**
 * Library — Exercise Library page showing all 100 supported exercises
 * Design: Luminous Minimal — grid layout with category filter tabs
 */

import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Search, Play, Dumbbell } from 'lucide-react';
import { EXERCISES, CATEGORY_CONFIG, type ExerciseCategory } from '@/lib/exercises';
import { getExerciseFrames } from '@/lib/imageAssets';
import { cn } from '@/lib/utils';

const DEMO_PLAN_TEMPLATE = (exerciseId: string) =>
  JSON.stringify({
    title: 'Demo',
    steps: [
      {
        type: 'work',
        exercise_id: exerciseId,
        mode: 'timer',
        duration_sec: 30,
      },
    ],
  });

const FALLBACK_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298408851/XyFvSN3VK3nvaXR5w2ESua/push_up_frame1_thumb_2x_1ba804a2.webp';

function handleLibImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src !== FALLBACK_IMG) img.src = FALLBACK_IMG;
}

function ExerciseCard({ exercise }: { exercise: (typeof EXERCISES)[0] }) {
  const frames = getExerciseFrames(exercise.exercise_id);
  const config = CATEGORY_CONFIG[exercise.category];
  const demoUrl = `/#data=${encodeURIComponent(DEMO_PLAN_TEMPLATE(exercise.exercise_id))}`;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] transition-shadow group">
      {/* Image */}
      <div className="relative aspect-square bg-[#F5F5F7] overflow-hidden">
        <img
          src={frames.frame1.thumb_2x}
          srcSet={`${frames.frame1.thumb_1x} 1x, ${frames.frame1.thumb_2x} 2x`}
          alt={exercise.name}
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={handleLibImgError}
        />
        {/* Category dot */}
        <div
          className="absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        {/* Placeholder badge */}
        {frames.isPlaceholder && (
          <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <span className="text-[9px] font-medium text-[#6E6E73]">Preview</span>
          </div>
        )}
        {/* Demo button on hover */}
        <Link href={demoUrl}>
          <button className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center shadow-lg">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          </button>
        </Link>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-[#1D1D1F] leading-tight mb-1 line-clamp-1">
          {exercise.name}
        </h3>
        <div className="flex flex-wrap gap-1">
          {exercise.primary_muscles.slice(0, 2).map(m => (
            <span
              key={m}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#F5F5F7] text-[#6E6E73]"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Library() {
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return EXERCISES.filter(ex => {
      const matchesCategory = activeCategory === 'all' || ex.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.exercise_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.primary_muscles.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const categories: Array<{ key: ExerciseCategory | 'all'; label: string; count: number }> = [
    { key: 'all', label: 'All', count: EXERCISES.length },
    ...(['lower', 'push', 'pull', 'core', 'conditioning'] as ExerciseCategory[]).map(cat => ({
      key: cat,
      label: CATEGORY_CONFIG[cat].label,
      count: EXERCISES.filter(e => e.category === cat).length,
    })),
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-10 border-b border-[#F0F0F5]">
        <div className="max-w-5xl mx-auto px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663298408851/XyFvSN3VK3nvaXR5w2ESua/logo-kb4-192_c35ef4c9.png"
                alt="AI Workout"
                className="w-8 h-8 rounded-xl object-cover"
              />
              <div>
                <h1 className="text-lg font-bold text-[#1D1D1F] leading-none">Exercise Library</h1>
                <p className="text-xs text-[#6E6E73]">{EXERCISES.length} exercises supported</p>
              </div>
            </div>
            <Link href="/">
              <button className="text-[#007AFF] text-sm font-medium hover:opacity-70 transition-opacity">
                ← Back
              </button>
            </Link>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6E73]" />
            <input
              type="text"
              placeholder="Search exercises, muscles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F5F5F7] rounded-xl text-sm text-[#1D1D1F] placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150',
                  activeCategory === cat.key
                    ? 'bg-[#007AFF] text-white shadow-[0_2px_8px_rgba(0,122,255,0.3)]'
                    : 'bg-[#F5F5F7] text-[#3C3C43] hover:bg-[#E8E8ED]',
                )}
              >
                {cat.label}
                <span className={cn('ml-1', activeCategory === cat.key ? 'opacity-80' : 'opacity-50')}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="max-w-5xl mx-auto px-5 py-5">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#6E6E73] text-sm">No exercises found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map(ex => (
              <ExerciseCard key={ex.exercise_id} exercise={ex} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
