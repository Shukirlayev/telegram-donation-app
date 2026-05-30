import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'motion/react';
import { Target, CheckCircle2, Edit2, Trash2, CalendarDays, PlusCircle } from 'lucide-react';
import { Goal } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface SwipeableGoalProps {
  goal: Goal;
  isComplete: boolean;
  percent: string;
  daysLeft: number | null;
  dailyRequired: number | null;
  currencySymbol: string;
  t: (key: string) => string;
  formatMoney: (val: number) => string;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onAddMoney: (goal: Goal) => void;
}

export default function SwipeableGoal({
  goal,
  isComplete,
  percent,
  daysLeft,
  dailyRequired,
  currencySymbol,
  t,
  formatMoney,
  onEdit,
  onDelete,
  onComplete,
  onAddMoney
}: SwipeableGoalProps) {
  const x = useMotionValue(0);
  const ref = useRef<HTMLDivElement>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  // Background colors based on swipe direction
  const background = useTransform(
    x,
    [-100, -50, 0, 50, 100],
    [
      'hsl(348, 100%, 61%)',  // Red (Delete)
      'hsl(348, 100%, 61%)',
      'hsl(0, 0%, 96%)',      // Default
      'hsl(152, 69%, 51%)',   // Green (Complete/Add)
      'hsl(152, 69%, 51%)'
    ]
  );

  const handleDragEnd = (e: any, info: PanInfo) => {
    setIsSwiping(false);
    const threshold = 80;
    if (info.offset.x > threshold) {
      // Swiped right -> Complete or Add Money
      triggerHaptic('heavy');
      animate(x, 100);
      if (isComplete) {
         // Maybe just animate back if already complete
         animate(x, 0, { type: 'spring', stiffness: 300, damping: 20 });
      } else {
         // Show Add money modal
         onAddMoney(goal);
         setTimeout(() => animate(x, 0, { type: 'spring', stiffness: 300, damping: 20 }), 300);
      }
    } else if (info.offset.x < -threshold) {
      // Swiped left -> Delete
      triggerHaptic('heavy');
      animate(x, -100);
      onDelete(goal.id);
      setTimeout(() => animate(x, 0, { type: 'spring', stiffness: 300, damping: 20 }), 300);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 20 });
    }
  };

  const handleDragStart = () => {
    setIsSwiping(true);
    triggerHaptic('selection');
  };

  return (
    <div className="relative rounded-[1.5rem] overflow-hidden mb-4 group shadow-sm bg-slate-100 dark:bg-slate-800">
      {/* Background Actions */}
      <motion.div 
         className="absolute inset-0 flex justify-between items-center px-6"
         style={{ background }}
      >
         <div className="flex flex-col items-center justify-center text-white font-medium">
            <PlusCircle className="w-6 h-6 mb-1" />
            <span className="text-[11px] uppercase tracking-wider">{t("home.add")}</span>
         </div>
         <div className="flex flex-col items-center justify-center text-white font-medium">
            <Trash2 className="w-6 h-6 mb-1" />
            <span className="text-[11px] uppercase tracking-wider">O'chirish</span>
         </div>
      </motion.div>

      {/* Foreground Card */}
      <motion.div 
        ref={ref}
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-5 rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 relative z-10 w-full"
      >
        <div className="flex justify-between items-start mb-3">
           <div className="flex items-center gap-3">
             <div className={`w-[42px] h-[42px] rounded-[14px] flex items-center justify-center shrink-0 ${isComplete ? 'bg-emerald-100/80 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                {isComplete ? <CheckCircle2 className="w-[22px] h-[22px]" /> : <Target className="w-[22px] h-[22px]" />}
             </div>
             <div className="min-w-0 pr-2">
               <h3 className="font-display font-semibold text-slate-800 dark:text-white text-[17px] leading-tight truncate">
                 {goal.title}
               </h3>
               <p className="text-[12px] font-medium text-slate-500 mt-0.5 truncate tracking-wide">{t("home.target")} {formatMoney(goal.targetAmount)} {currencySymbol}</p>
             </div>
           </div>
           
           <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
             <button onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onAddMoney(goal); }} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all active:scale-90" title="Pul qo'shish"><PlusCircle className="w-[18px] h-[18px]" /></button>
             <button onClick={(e) => { e.stopPropagation(); triggerHaptic('heavy'); onComplete(goal.id); }} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all active:scale-90" title="Tugatish"><CheckCircle2 className="w-[18px] h-[18px]" /></button>
             <button onClick={() => { 
                 triggerHaptic('light');
                 onEdit(goal); 
             }} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all active:scale-90" title="Tahrirlash"><Edit2 className="w-[18px] h-[18px]" /></button>
           </div>
        </div>
        
         {daysLeft !== null && (
          <div className="mb-4 bg-slate-50/50 dark:bg-slate-900/50 p-2.5 rounded-xl flex items-center justify-between border border-white/60 dark:border-slate-700/50">
             <div className="flex items-center gap-2">
               <div className="p-1 bg-white/80 dark:bg-slate-800 rounded-md shadow-sm border border-black/5 dark:border-white/5">
                 <CalendarDays className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
               </div>
               <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">
                 {daysLeft > 0 ? (isComplete ? t("home.deadlineEnd") : `${daysLeft} ${t("home.daysLeft")}`) : t("home.deadlinePassed")}
               </span>
             </div>
             {dailyRequired && dailyRequired > 0 && (
               <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">~{formatMoney(dailyRequired)} {currencySymbol}/k</span>
             )}
          </div>
        )}

        <div className="mt-4">
          <div className="flex justify-between items-end mb-2.5">
             <span className="font-display font-semibold text-[22px] text-slate-800 dark:text-white tracking-tight leading-none">{formatMoney(goal.currentAmount)}</span>
             <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${isComplete ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-200/50 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400'}`}>{percent}%</span>
          </div>
          <div className="h-[8px] w-full bg-slate-100 dark:bg-slate-900/60 rounded-full overflow-hidden border border-black/5 dark:border-white/5 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full shadow-inner ${isComplete ? 'bg-emerald-500' : 'bg-slate-800 dark:bg-indigo-400'}`} 
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
