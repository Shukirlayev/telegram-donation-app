import React from "react";
import { Transaction, Goal } from "../types";
import { useTranslation } from "../i18n";
import { useAppContext } from "../contexts/AppContext";
import { Clock, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

interface HistoryProps {
  transactions: Transaction[];
  goals: Goal[];
}

export default function History({ transactions, goals }: HistoryProps) {
  const { t } = useTranslation();
  const { formatMoney, currencySymbol } = useAppContext();

  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-6">
         <h2 className="font-display font-semibold text-slate-800 dark:text-white text-[19px] tracking-tight">{t("nav.history") || "Tarix"}</h2>
         <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-lg">
           <div className="px-3 py-1 bg-white dark:bg-slate-700 rounded-md shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200">
             Barchasi
           </div>
         </div>
      </div>

      {sortedTransactions.length === 0 ? (
        <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-[1.5rem] shadow-sm border border-white/60 dark:border-slate-700/50 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
             <Clock className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">{t("stats.noData")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTransactions.map((tx, idx) => {
            const goal = goals.find(g => g.id === tx.goalId);
            return (
              <motion.div 
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-white/60 dark:border-slate-700/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center`} style={{ backgroundColor: goal ? `${goal.color}20` : '#e2e8f0', color: goal?.color || '#64748b' }}>
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold text-slate-800 dark:text-white">{goal?.title || "Noma'lum maqsad"}</h4>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      {new Intl.DateTimeFormat('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(tx.createdAt))}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-bold text-emerald-500">
                    +{formatMoney(tx.amount)} <span className="text-xs">{currencySymbol}</span>
                  </div>
                  {tx.note && <p className="text-xs text-slate-400 font-medium truncate max-w-[80px]">{tx.note}</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
