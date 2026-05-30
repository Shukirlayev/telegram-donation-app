import React from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';

export function EmptyGoalsState({ title, description }: { title: string, description: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-8 rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 text-center shadow-sm transition-colors py-12"
    >
      <motion.div 
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center"
      >
         {/* Sleeping Wallet Character */}
         <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl shadow-sm border border-indigo-200 dark:border-indigo-400/30 transform rotate-[-5deg]"></div>
         <div className="absolute inset-x-2 bottom-0 h-1/2 bg-indigo-200 dark:bg-indigo-500/40 rounded-b-xl border-t border-indigo-300 dark:border-indigo-400/50"></div>
         <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-3">
             <motion.div 
                animate={{ scaleY: [1, 0.1, 1] }} 
                transition={{ repeat: Infinity, duration: 4, repeatDelay: 1 }}
                className="w-4 h-1.5 bg-indigo-400 dark:bg-indigo-300 rounded-full"
             ></motion.div>
             <motion.div 
                animate={{ scaleY: [1, 0.1, 1] }} 
                transition={{ repeat: Infinity, duration: 4, repeatDelay: 1 }}
                className="w-4 h-1.5 bg-indigo-400 dark:bg-indigo-300 rounded-full"
             ></motion.div>
         </div>
         {/* Zzz... */}
         <motion.div 
            animate={{ opacity: [0, 1, 0], y: [0, -15], x: [0, 10] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
            className="absolute -top-2 -right-2 text-indigo-400 font-bold text-sm"
         >z</motion.div>
         <motion.div 
            animate={{ opacity: [0, 1, 0], y: [0, -20], x: [0, 15] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut", delay: 0.5 }}
            className="absolute -top-6 -right-6 text-indigo-300 font-bold text-base"
         >Z</motion.div>
      </motion.div>
      <p className="text-slate-800 dark:text-slate-200 font-display font-semibold text-[18px] mb-2">{title}</p>
      <p className="text-slate-500 dark:text-slate-400 text-[14px] leading-relaxed max-w-xs mx-auto">{description}</p>
    </motion.div>
  );
}

export function EmptyTransactionsState({ description }: { description: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-8 rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 text-center shadow-sm transition-colors py-10"
    >
      <motion.div 
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="mx-auto mb-4 w-16 h-16 flex items-center justify-center relative"
      >
        <Search className="w-10 h-10 text-slate-400 absolute" />
        <motion.div 
           animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
           transition={{ repeat: Infinity, duration: 2 }}
           className="w-12 h-12 rounded-full border-2 border-indigo-400/30 absolute"
        />
      </motion.div>
      <p className="text-slate-600 dark:text-slate-300 font-medium text-[15px]">{description}</p>
    </motion.div>
  );
}
