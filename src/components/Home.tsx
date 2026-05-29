import { Goal, Transaction, UserProfile } from "../types";
import { TrendingUp, Target, Plus, CheckCircle2, X, Edit2, Check, Trash2, ChevronRight, Wallet, Award, Flame, Bot, CalendarDays } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { useTranslation } from "../i18n";
import { useAppContext } from "../contexts/AppContext";

interface HomeProps {
  goals: Goal[];
  transactions: Transaction[];
  token: string;
  onRefresh: () => void;
  totalSaved: number;
}

export default function Home({ goals, transactions, token, onRefresh, totalSaved }: HomeProps) {
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState("");
  const [editGoalTarget, setEditGoalTarget] = useState("");
  const [editGoalDeadline, setEditGoalDeadline] = useState("");
  
  const { t } = useTranslation();
  const { formatMoney, currencySymbol, showToast, currency } = useAppContext();

  const streakDays = useMemo(() => {
    if (!transactions.length) return 0;
    const dates = new Set(transactions.map(t => new Date(t.createdAt).toDateString()));
    return dates.size;
  }, [transactions]);
  
  const hasMillionBadge = (totalSaved / (currency === 'UZS' ? 1 : currency === 'USD' ? 12500 : currency === 'EUR' ? 13500 : 140)) >= 1000000;
  
  const activeGoals = useMemo(() => goals.filter(g => !g.isCompleted && g.currentAmount < g.targetAmount), [goals]);
  const completedGoals = useMemo(() => goals.filter(g => g.isCompleted || g.currentAmount >= g.targetAmount), [goals]);

  const aiMessage = useMemo(() => {
    if (activeGoals.length === 0 && completedGoals.length === 0) return t("home.aiNoGoals");
    if (totalSaved === 0) return t("home.aiStart");
    if (hasMillionBadge) return t("home.aiMillion", { currency: currencySymbol });
    return t("home.aiProgress", { amount: formatMoney(totalSaved), currency: currencySymbol });
  }, [goals, totalSaved, hasMillionBadge, t, formatMoney, currencySymbol]);

  const handleCreateGoal = async () => {
    if (!token || !newGoalTitle.trim() || !newGoalTarget.trim()) return;
    setSavingGoal(true);
    try {
      const rate = currency === 'UZS' ? 1 : currency === 'USD' ? 12500 : currency === 'EUR' ? 13500 : 140;
      const targetAmountBase = parseFloat(newGoalTarget) * rate;

      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          title: newGoalTitle.trim(), 
          targetAmount: targetAmountBase,
          deadline: newGoalDeadline || undefined,
          color: "#" + Math.floor(Math.random()*16777215).toString(16)
        })
      });
      if (res.ok) {
        setNewGoalTitle(""); setNewGoalTarget(""); setNewGoalDeadline(""); setShowNewGoal(false);
        showToast("Maqsad yaratildi", "success");
        onRefresh();
      } else {
        showToast("Xatolik yuz berdi", "error");
      }
    } catch (err) { console.error(err); showToast("Xatolik xuz berdi", "error"); } 
    finally { setSavingGoal(false); }
  };

  const handleSaveEdit = async (goalId: string) => {
    try {
      const rate = currency === 'UZS' ? 1 : currency === 'USD' ? 12500 : currency === 'EUR' ? 13500 : 140;
      const targetAmountBase = parseFloat(editGoalTarget) * rate;

      await fetch(`/api/goals/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editGoalTitle, targetAmount: targetAmountBase, deadline: editGoalDeadline || undefined })
      });
      setEditingGoalId(null);
      showToast("Maqsad o'zgartirildi", "success");
      onRefresh();
    } catch (err) { console.error(err); showToast("Xatolik yuz berdi", "error"); }
  };

  const handleCompleteGoal = async (goalId: string) => {
    if (!confirm("Haqiqatdan ham bu maqsadni tugatilgan deb belgilaysizmi?")) return;
    try {
      await fetch(`/api/goals/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isCompleted: true })
      });
      confetti({
         particleCount: 150,
         spread: 70,
         origin: { y: 0.6 },
         colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      });
      showToast("Maqsad yakunlandi, tabriklaymiz!", "success");
      onRefresh();
    } catch (err) { console.error(err); showToast("Xatolik yuz berdi", "error"); }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Haqiqatdan ham bu maqsadni o'chirasizmi? DIQQAT: unga tegishli barcha tranzaksiyalar ham o'chib ketadi!")) return;
    try {
      await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Maqsad to'liq o'chirildi", "info");
      onRefresh();
    } catch (err) { console.error(err); showToast("Xatolik yuz berdi", "error"); }
  };

  return (
    <div className="space-y-8 pb-4">
      {/* Gamification & AI Section */}
      <section className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x hide-scrollbar">
         {hasMillionBadge && (
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-shrink-0 snap-center bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl p-4 rounded-[1.25rem] shadow-sm border border-white/60 dark:border-slate-700/50 flex items-center gap-3 w-64 relative overflow-hidden transition-colors">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-400/20 rounded-full blur-xl" />
              <div className="bg-gradient-to-br from-amber-300 to-orange-400 p-2.5 rounded-xl text-white shadow-sm z-10">
                 <Award className="w-6 h-6" />
              </div>
              <div className="z-10">
                 <p className="text-slate-800 dark:text-white text-[15px] font-bold leading-tight">{t("home.millionaire")}</p>
                 <p className="text-slate-500 dark:text-slate-400 text-[12px] font-medium mt-0.5 leading-snug">{t("home.millionSaved", { currency: currencySymbol })}</p>
              </div>
           </motion.div>
         )}
         
         <div className="flex-shrink-0 snap-center bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl p-4 rounded-[1.25rem] shadow-sm border border-white/60 dark:border-slate-700/50 flex items-center gap-3 w-56 relative overflow-hidden transition-colors">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-400/20 rounded-full blur-xl" />
            <div className="bg-gradient-to-br from-rose-400 to-pink-500 p-2.5 rounded-xl text-white shadow-sm z-10">
               <Flame className="w-6 h-6" />
            </div>
            <div className="z-10">
               <p className="text-slate-800 dark:text-white text-[15px] font-bold leading-tight">{streakDays} {t("home.streak")}</p>
               <p className="text-slate-500 dark:text-slate-400 text-[12px] font-medium mt-0.5 leading-snug">{t("home.activeStreak")}</p>
            </div>
         </div>
         
         <div className="flex-shrink-0 snap-center bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl p-4 rounded-[1.25rem] shadow-sm border border-white/60 dark:border-slate-700/50 flex items-center gap-3 w-[260px] relative overflow-hidden transition-colors">
            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-indigo-500/15 rounded-full blur-xl" />
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl text-white shadow-sm z-10 shrink-0">
               <Bot className="w-6 h-6" />
            </div>
            <div className="z-10">
               <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">{t("home.aiConsult")}</p>
               <p className="text-slate-700 dark:text-slate-200 text-[12px] font-medium leading-tight line-clamp-2">{aiMessage}</p>
            </div>
         </div>
      </section>

      {/* Goals Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-slate-800 dark:text-white text-[19px] tracking-tight">{t("home.goals")}</h2>
          <button 
            onClick={() => setShowNewGoal(!showNewGoal)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {showNewGoal ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4" /><span className="text-xs font-semibold">{t("home.add")}</span></>}
          </button>
        </div>

        <AnimatePresence>
          {showNewGoal && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.95 }} 
              animate={{ opacity: 1, height: 'auto', scale: 1 }} 
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl p-5 rounded-[1.5rem] shadow-sm border border-white/60 dark:border-slate-700/50 mb-5 overflow-hidden transition-colors"
            >
              <h3 className="text-[15px] font-bold text-slate-800 dark:text-white mb-4 tracking-tight">{t("home.newCategory")}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5 block">{t('home.name')}</label>
                  <input 
                    type="text" 
                    placeholder={t('home.namePlaceholder')} 
                    value={newGoalTitle} 
                    onChange={e => setNewGoalTitle(e.target.value)} 
                    className="w-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border border-white/80 dark:border-slate-700/50 shadow-sm rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all font-medium text-slate-800 dark:text-white placeholder-slate-400 caret-indigo-500" 
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5 block">{t('home.amount')} ({currencySymbol})</label>
                  <input 
                    type="number" 
                    placeholder="5000" 
                    value={newGoalTarget} 
                    onChange={e => setNewGoalTarget(e.target.value)} 
                    className="w-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border border-white/80 dark:border-slate-700/50 shadow-sm rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all font-medium text-slate-800 dark:text-white placeholder-slate-400 caret-indigo-500" 
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5 block">{t('home.deadline')}</label>
                  <input 
                    type="date" 
                    value={newGoalDeadline} 
                    onChange={e => setNewGoalDeadline(e.target.value)} 
                    className="w-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border border-white/80 dark:border-slate-700/50 shadow-sm rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all font-medium text-slate-700 dark:text-slate-200 caret-indigo-500 color-scheme-light dark:color-scheme-dark" 
                  />
                </div>
                <button onClick={handleCreateGoal} disabled={savingGoal || !newGoalTitle || !newGoalTarget} className="w-full bg-indigo-600 active:scale-[0.98] hover:bg-indigo-700 text-white font-semibold rounded-xl py-3.5 text-[15px] transition-all disabled:opacity-50 mt-2 shadow-sm">
                  {savingGoal ? t("home.saving") : t("home.save")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeGoals.length === 0 ? (
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-8 rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 text-center shadow-sm transition-colors">
            <Target className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-700 dark:text-slate-200 font-medium text-[15px]">{t("home.noGoalsTitle")}</p>
            <p className="text-slate-500 dark:text-slate-400 text-[13px] mt-1">{t("home.noGoalsDesc")}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeGoals.map((goal, index) => {
              const percentRaw = (goal.currentAmount / goal.targetAmount) * 100;
              const percent = Math.min(percentRaw, 100).toFixed(1);
              const isComplete = goal.currentAmount >= goal.targetAmount;
              const isEditing = editingGoalId === goal.id;
              
              let daysLeft: number | null = null;
              let dailyRequired: number | null = null;
              if (goal.deadline) {
                 const diffTime = new Date(goal.deadline).getTime() - new Date().getTime();
                 daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                 if (daysLeft > 0 && !isComplete) {
                   dailyRequired = (goal.targetAmount - goal.currentAmount) / daysLeft;
                 }
              }

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={goal.id} 
                  className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl p-5 rounded-[1.5rem] shadow-sm border border-white/60 dark:border-slate-700/50 relative overflow-hidden group transition-colors"
                >
                  {isEditing ? (
                    <div className="space-y-3 relative z-10 bg-white/40 dark:bg-slate-900/40 p-2.5 rounded-2xl border border-white/50 dark:border-slate-700/50">
                       <input type="text" value={editGoalTitle} onChange={e => setEditGoalTitle(e.target.value)} className="w-full bg-white/80 dark:bg-slate-800 border border-white/80 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none font-medium shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/50 dark:text-white caret-indigo-500" />
                       <input type="number" value={editGoalTarget} onChange={e => setEditGoalTarget(e.target.value)} className="w-full bg-white/80 dark:bg-slate-800 border border-white/80 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none font-medium shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/50 dark:text-white caret-indigo-500" />
                       <input type="date" value={editGoalDeadline} onChange={e => setEditGoalDeadline(e.target.value)} className="w-full bg-white/80 dark:bg-slate-800 border border-white/80 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none font-medium text-slate-600 dark:text-slate-300 shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/50 caret-indigo-500" />
                       <div className="flex items-center gap-2 pt-1">
                         <button onClick={() => handleSaveEdit(goal.id)} className="flex-1 bg-slate-800 dark:bg-slate-700 text-white text-[13px] font-semibold py-2.5 rounded-xl flex justify-center items-center gap-1.5 shadow-sm active:scale-95 transition-transform">{t("home.save")}</button>
                         <button onClick={() => setEditingGoalId(null)} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[13px] font-semibold py-2.5 rounded-xl flex justify-center items-center gap-1.5 active:scale-95 transition-transform">{t("home.cancel")}</button>
                       </div>
                    </div>
                  ) : (
                    <div className="relative z-10 w-full">
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
                         <div className="flex items-center gap-1">
                           <button onClick={(e) => { e.stopPropagation(); handleCompleteGoal(goal.id); }} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all active:scale-90" title="Tugatish"><CheckCircle2 className="w-[18px] h-[18px]" /></button>
                           <button onClick={() => { 
                               setEditingGoalId(goal.id); 
                               setEditGoalTitle(goal.title); 
                               // Convert back to current currency display amount when editing
                               const rate = currency === 'UZS' ? 1 : currency === 'USD' ? 12500 : currency === 'EUR' ? 13500 : 140;
                               setEditGoalTarget((goal.targetAmount / rate).toString()); 
                               setEditGoalDeadline(goal.deadline || ""); 
                           }} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all active:scale-90" title="Tahrirlash"><Edit2 className="w-[18px] h-[18px]" /></button>
                           <button onClick={() => handleDeleteGoal(goal.id)} className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all active:scale-90" title="O'chirish"><Trash2 className="w-[18px] h-[18px]" /></button>
                         </div>
                      </div>
                      
                       {daysLeft !== null && (
                        <div className="mb-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur p-2.5 rounded-xl flex items-center justify-between border border-white/60 dark:border-slate-700/50">
                           <div className="flex items-center gap-2">
                             <div className="p-1 bg-white/80 dark:bg-slate-800 rounded-md shadow-sm border border-white/60 dark:border-slate-700">
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
                        <div className="h-[8px] w-full bg-white/60 dark:bg-slate-900/60 rounded-full overflow-hidden border border-white/50 dark:border-slate-700/50 shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full shadow-inner ${isComplete ? 'bg-emerald-500' : 'bg-slate-800 dark:bg-indigo-400'}`} 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {completedGoals.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-slate-800 dark:text-white text-[19px] tracking-tight">Yakunlangan maqsadlar 🎉</h2>
            </div>
            <div className="grid gap-4">
              {completedGoals.map((goal, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={goal.id} 
                  className="bg-emerald-50/50 dark:bg-emerald-900/20 backdrop-blur-xl p-5 rounded-[1.5rem] shadow-sm border border-emerald-100 dark:border-emerald-800/30 relative overflow-hidden"
                >
                  <div className="flex justify-between items-center relative z-10 w-full">
                     <div className="flex items-center gap-3">
                       <div className="w-[42px] h-[42px] rounded-[14px] flex items-center justify-center shrink-0 bg-emerald-100/80 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                          <CheckCircle2 className="w-[22px] h-[22px]" />
                       </div>
                       <div className="min-w-0 pr-2">
                         <h3 className="font-display font-semibold text-slate-800 dark:text-white text-[17px] leading-tight truncate">
                           {goal.title}
                         </h3>
                         <p className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5 truncate tracking-wide">Yig'ilgan: {formatMoney(goal.currentAmount)} {currencySymbol}</p>
                       </div>
                     </div>
                     <button onClick={() => handleDeleteGoal(goal.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white/50 dark:hover:bg-slate-800 rounded-full transition-all active:scale-90" title="O'chirish"><Trash2 className="w-[18px] h-[18px]" /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Transactions Section */}
      <section>
        <div className="flex items-center justify-between mb-4 mt-2">
          <h2 className="font-display font-semibold text-slate-800 dark:text-white text-[19px] tracking-tight">{t("home.recentActivity")}</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-6 rounded-[1.5rem] text-center border border-white/60 dark:border-slate-700/50 shadow-sm transition-colors">
            <Wallet className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-300 font-medium text-[15px]">{t("home.noActivity")}</p>
          </div>
        ) : (
          <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl rounded-[1.5rem] shadow-sm border border-white/60 dark:border-slate-700/50 overflow-hidden transition-colors">
            {transactions.slice().reverse().slice(0, 10).map((tItem, index) => {
              const associatedGoal = goals.find(g => g.id === tItem.goalId) || { title: t("home.archived") };
              const isLast = index === Math.min(transactions.length, 10) - 1;
              return (
                <div key={tItem.id} className={`p-4 flex items-center justify-between gap-4 transition-colors ${!isLast ? 'border-b border-black/5 dark:border-white/5' : ''}`}>
                  <div className="flex items-center gap-3.5 w-full min-w-0">
                    <div className="w-[42px] h-[42px] rounded-full bg-white/60 dark:bg-slate-700 flex flex-shrink-0 items-center justify-center border border-white/50 dark:border-slate-600 shadow-sm">
                       <TrendingUp className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white text-[16px] truncate">{associatedGoal.title}</p>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate tracking-wide">
                        {new Date(tItem.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                       <p className="font-display font-semibold text-slate-800 dark:text-white text-[16px]">+{formatMoney(tItem.amount)}</p>
                       <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">{currencySymbol}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
