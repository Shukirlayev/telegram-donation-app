import { motion } from "motion/react";

export function HomeSkeleton() {
  return (
    <div className="space-y-8 pb-4 animate-pulse">
      {/* Gamification & AI Section Skeleton */}
      <section className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x hide-scrollbar">
        <div className="flex-shrink-0 snap-center bg-white/40 dark:bg-slate-800/40 p-4 rounded-[1.25rem] w-64 h-20" />
        <div className="flex-shrink-0 snap-center bg-white/40 dark:bg-slate-800/40 p-4 rounded-[1.25rem] w-56 h-20" />
        <div className="flex-shrink-0 snap-center bg-white/40 dark:bg-slate-800/40 p-4 rounded-[1.25rem] w-[260px] h-20" />
      </section>

      {/* Goals Section Skeleton */}
      <section>
        <div className="flex justify-between mb-4">
          <div className="h-6 w-24 bg-white/50 dark:bg-slate-800/50 rounded-md" />
          <div className="h-8 w-20 bg-white/50 dark:bg-slate-800/50 rounded-full" />
        </div>
        
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/40 dark:bg-slate-800/40 p-5 rounded-[1.5rem] h-36" />
          ))}
        </div>
      </section>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="space-y-6 pb-2 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-8 w-40 bg-white/50 dark:bg-slate-800/50 rounded-md" />
      </div>
      
      {/* Pie chart skeleton */}
      <div className="bg-white/40 dark:bg-slate-800/40 p-6 rounded-[1.25rem] h-[300px]" />

      {/* Bar chart skeleton */}
      <div className="bg-white/40 dark:bg-slate-800/40 p-5 rounded-[1.25rem] h-[280px]" />

      {/* List skeleton */}
      <div className="bg-white/40 dark:bg-slate-800/40 rounded-[1.25rem] p-4 space-y-4">
         <div className="h-6 w-24 bg-white/50 dark:bg-slate-800/50 rounded-md mb-2" />
         {[1, 2].map((i) => (
           <div key={i} className="h-12 w-full bg-white/50 dark:bg-slate-800/50 rounded-lg" />
         ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 pb-2 animate-pulse">
      <div className="h-8 w-32 bg-white/50 dark:bg-slate-800/50 rounded-md mb-6" />
      
      <div className="bg-white/40 dark:bg-slate-800/40 p-5 rounded-[1.25rem] flex items-center gap-5">
        <div className="w-[84px] h-[84px] rounded-full bg-white/50 dark:bg-slate-700/50" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-32 bg-white/50 dark:bg-slate-700/50 rounded-md" />
          <div className="h-4 w-40 bg-white/50 dark:bg-slate-700/50 rounded-md" />
        </div>
      </div>
      
      <div className="space-y-4">
        {[1, 2, 3].map((g) => (
          <div key={g} className="bg-white/40 dark:bg-slate-800/40 rounded-[1.25rem] h-40" />
        ))}
      </div>
    </div>
  );
}
