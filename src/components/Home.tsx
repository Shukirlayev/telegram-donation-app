import { Goal, Transaction, UserProfile } from "../types";
import { TrendingUp, Target, Plus, CheckCircle2, X, Edit2, Check, Trash2, ChevronRight, Wallet, Award, Flame, Bot, CalendarDays } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

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

  const streakDays = useMemo(() => {
    if (!transactions.length) return 0;
    const dates = new Set(transactions.map(t => new Date(t.createdAt).toDateString()));
    return dates.size;
  }, [transactions]);
  
  const hasMillionBadge = totalSaved >= 1000000;
  
  const aiMessage = useMemo(() => {
    if (goals.length === 0) return "Sizda hali maqsadlar yo'q. Birinchi maqsadingizni yarating!";
    if (totalSaved === 0) return "Ajoyib boshlanish! Maqsad yaratibsiz, endi unga bot orqali pul ajrating.";
    if (hasMillionBadge) return "Siz 1 Million UZS dan ortiq mablag' yig'ishga muvaffaq bo'ldingiz! Ajoyib natija, shu ruhda davom eting! 🔥";
    return `Siz umumiy hisobda ${totalSaved.toLocaleString()} UZS yig'dingiz. Rejali tejashni davom ettirsangiz, barchasiga tezda erishasiz.`;
  }, [goals, totalSaved, hasMillionBadge]);

  const handleCreateGoal = async () => {
    if (!token || !newGoalTitle.trim() || !newGoalTarget.trim()) return;
    setSavingGoal(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          title: newGoalTitle.trim(), 
          targetAmount: newGoalTarget,
          deadline: newGoalDeadline || undefined,
          color: "#" + Math.floor(Math.random()*16777215).toString(16)
        })
      });
      if (res.ok) {
        setNewGoalTitle(""); setNewGoalTarget(""); setNewGoalDeadline(""); setShowNewGoal(false);
        onRefresh();
      }
    } catch (err) { console.error(err); } 
    finally { setSavingGoal(false); }
  };

  const handleSaveEdit = async (goalId: string) => {
    try {
      await fetch(`/api/goals/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editGoalTitle, targetAmount: editGoalTarget, deadline: editGoalDeadline || undefined })
      });
      setEditingGoalId(null);
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Haqiqatdan ham bu maqsadni o'chirasizmi? (Tranzaksiyalar qoladi lekin arxivalangan bo'ladi)")) return;
    try {
      await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-8 pb-4">
      {/* Gamification & AI Section */}
      <section className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x hide-scrollbar">
         {hasMillionBadge && (
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-shrink-0 snap-center bg-white p-4 rounded-[1.25rem] shadow-sm border border-slate-200/60 flex items-center gap-3 w-64 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-400/10 rounded-full blur-xl" />
              <div className="bg-gradient-to-br from-amber-300 to-orange-400 p-2.5 rounded-xl text-white shadow-sm z-10">
                 <Award className="w-6 h-6" />
              </div>
              <div className="z-10">
                 <p className="text-slate-800 text-[15px] font-bold leading-tight">Millioner!</p>
                 <p className="text-slate-500 text-[12px] font-medium mt-0.5 leading-snug">1M+ UZS yig'ildi</p>
              </div>
           </motion.div>
         )}
         
         <div className="flex-shrink-0 snap-center bg-white p-4 rounded-[1.25rem] shadow-sm border border-slate-200/60 flex items-center gap-3 w-56 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-400/10 rounded-full blur-xl" />
            <div className="bg-gradient-to-br from-rose-400 to-pink-500 p-2.5 rounded-xl text-white shadow-sm z-10">
               <Flame className="w-6 h-6" />
            </div>
            <div className="z-10">
               <p className="text-slate-800 text-[15px] font-bold leading-tight">{streakDays} Kun</p>
               <p className="text-slate-500 text-[12px] font-medium mt-0.5 leading-snug">Faol seriya</p>
            </div>
         </div>
         
         <div className="flex-shrink-0 snap-center bg-white p-4 rounded-[1.25rem] shadow-sm border border-slate-200/60 flex items-center gap-3 w-[260px] relative overflow-hidden">
            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl" />
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl text-white shadow-sm z-10 shrink-0">
               <Bot className="w-6 h-6" />
            </div>
            <div className="z-10">
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Moliya AI</p>
               <p className="text-slate-700 text-[12px] font-medium leading-tight line-clamp-2">{aiMessage}</p>
            </div>
         </div>
      </section>

      {/* Goals Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-slate-800 text-[19px] tracking-tight">Maqsadlar</h2>
          <button 
            onClick={() => setShowNewGoal(!showNewGoal)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200/50 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
          >
            {showNewGoal ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4" /><span className="text-xs font-semibold">Qo'shish</span></>}
          </button>
        </div>

        <AnimatePresence>
          {showNewGoal && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.95 }} 
              animate={{ opacity: 1, height: 'auto', scale: 1 }} 
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-200/60 mb-5 overflow-hidden"
            >
              <h3 className="text-[15px] font-bold text-slate-800 mb-4 tracking-tight">Yangi Kategoriya</h3>
              <div className="space-y-4">
                <div className="space-y-3 bg-slate-50/50 p-1 rounded-xl">
                   <div className="border border-slate-200 bg-white rounded-xl overflow-hidden focus-within:ring-2 ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
                     <div className="px-3 py-1.5 border-b border-slate-100 flex items-center">
                        <label className="text-[11px] font-semibold text-slate-500 w-24">Nomi</label>
                        <input type="text" placeholder="Masalan: Noutbuk" value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} className="w-full bg-transparent border-0 px-1 py-1.5 text-sm outline-none font-medium placeholder-slate-300" />
                     </div>
                     <div className="px-3 py-1.5 border-b border-slate-100 flex items-center">
                        <label className="text-[11px] font-semibold text-slate-500 w-24">Summa (UZS)</label>
                        <input type="number" placeholder="5000000" value={newGoalTarget} onChange={e => setNewGoalTarget(e.target.value)} className="w-full bg-transparent border-0 px-1 py-1.5 text-sm outline-none font-medium placeholder-slate-300" />
                     </div>
                     <div className="px-3 py-1.5 flex items-center">
                        <label className="text-[11px] font-semibold text-slate-500 w-24">Muddat</label>
                        <input type="date" value={newGoalDeadline} onChange={e => setNewGoalDeadline(e.target.value)} className="w-full bg-transparent border-0 px-1 py-1.5 text-sm outline-none font-medium text-slate-600" />
                     </div>
                   </div>
                </div>
                <button onClick={handleCreateGoal} disabled={savingGoal || !newGoalTitle || !newGoalTarget} className="w-full bg-indigo-600 active:scale-[0.98] hover:bg-indigo-700 text-white font-semibold rounded-xl py-3.5 text-[15px] transition-all disabled:opacity-50 mt-1">
                  {savingGoal ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {goals.length === 0 ? (
          <div className="bg-white p-8 rounded-[1.5rem] border border-slate-200/60 text-center shadow-sm">
            <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium text-[15px]">Hali maqsad qo'shilmagan.</p>
            <p className="text-slate-400 text-[13px] mt-1">Pul yig'ishni boshlash uchun kategoriya yaratib uni tanlang</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {goals.map((goal, index) => {
              const percentRaw = (goal.currentAmount / goal.targetAmount) * 100;
              const percent = Math.min(percentRaw, 100).toFixed(1);
              const isComplete = goal.currentAmount >= goal.targetAmount;
              const isEditing = editingGoalId === goal.id;
              
              let daysLeft = null;
              let dailyRequired = null;
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
                  className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-200/60 relative overflow-hidden group"
                >
                  {isEditing ? (
                    <div className="space-y-3 relative z-10 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/50">
                       <input type="text" value={editGoalTitle} onChange={e => setEditGoalTitle(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none font-medium shadow-sm transition-all focus:border-indigo-400" />
                       <input type="number" value={editGoalTarget} onChange={e => setEditGoalTarget(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none font-medium shadow-sm transition-all focus:border-indigo-400" />
                       <input type="date" value={editGoalDeadline} onChange={e => setEditGoalDeadline(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none font-medium text-slate-600 shadow-sm transition-all focus:border-indigo-400" />
                       <div className="flex items-center gap-2 pt-1">
                         <button onClick={() => handleSaveEdit(goal.id)} className="flex-1 bg-slate-800 text-white text-[13px] font-semibold py-2.5 rounded-xl flex justify-center items-center gap-1.5 shadow-sm active:scale-95 transition-transform">Saqlash</button>
                         <button onClick={() => setEditingGoalId(null)} className="flex-1 bg-slate-200 text-slate-700 text-[13px] font-semibold py-2.5 rounded-xl flex justify-center items-center gap-1.5 active:scale-95 transition-transform">Bekor</button>
                       </div>
                    </div>
                  ) : (
                    <div className="relative z-10 w-full">
                      <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center gap-3">
                           <div className={`w-[42px] h-[42px] rounded-[14px] flex items-center justify-center shrink-0 ${isComplete ? 'bg-emerald-100/80 text-emerald-600' : 'bg-slate-100 text-slate-700'}`}>
                              {isComplete ? <CheckCircle2 className="w-[22px] h-[22px]" /> : <Target className="w-[22px] h-[22px]" />}
                           </div>
                           <div className="min-w-0 pr-2">
                             <h3 className="font-display font-semibold text-slate-800 text-[17px] leading-tight truncate">
                               {goal.title}
                             </h3>
                             <p className="text-[12px] font-medium text-slate-500 mt-0.5 truncate tracking-wide">Maqsad: {goal.targetAmount.toLocaleString()}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-1">
                           <button onClick={() => { setEditingGoalId(goal.id); setEditGoalTitle(goal.title); setEditGoalTarget(goal.targetAmount.toString()); setEditGoalDeadline(goal.deadline || ""); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-all active:scale-90"><Edit2 className="w-[18px] h-[18px]" /></button>
                           <button onClick={() => handleDeleteGoal(goal.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-100 rounded-full transition-all active:scale-90"><Trash2 className="w-[18px] h-[18px]" /></button>
                         </div>
                      </div>
                      
                      {daysLeft !== null && (
                        <div className="mb-4 bg-[#f2f2f7] p-2.5 rounded-xl flex items-center justify-between border border-slate-200/50">
                           <div className="flex items-center gap-2">
                             <div className="p-1 bg-white rounded-md shadow-sm border border-slate-100">
                               <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                             </div>
                             <span className="text-[13px] font-medium text-slate-600">
                               {daysLeft > 0 ? (isComplete ? "Muddat tugallandi" : `${daysLeft} kun qoldi`) : "Muddat o'tdi"}
                             </span>
                           </div>
                           {dailyRequired && dailyRequired > 0 && (
                             <span className="text-[11px] font-bold text-slate-700">~{Math.round(dailyRequired).toLocaleString()} UZS / kun</span>
                           )}
                        </div>
                      )}

                      <div className="mt-4">
                        <div className="flex justify-between items-end mb-2.5">
                           <span className="font-display font-semibold text-[22px] text-slate-800 tracking-tight leading-none">{goal.currentAmount.toLocaleString()}</span>
                           <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{percent}%</span>
                        </div>
                        <div className="h-[8px] w-full bg-[#f2f2f7] rounded-full overflow-hidden border border-slate-200/40">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full shadow-inner ${isComplete ? 'bg-emerald-500' : 'bg-slate-800'}`} 
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
      </section>

      {/* Transactions Section */}
      <section>
        <div className="flex items-center justify-between mb-4 mt-2">
          <h2 className="font-display font-semibold text-slate-800 text-[19px] tracking-tight">So'nggi harakatlar</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white p-6 rounded-[1.5rem] text-center border border-slate-200/60 shadow-sm">
            <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium text-[15px]">Harakatlar mavjud emas.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
            {transactions.slice().reverse().slice(0, 10).map((t, index) => {
              const associatedGoal = goals.find(g => g.id === t.goalId) || { title: 'Arxivlangan' };
              const isLast = index === Math.min(transactions.length, 10) - 1;
              return (
                <div key={t.id} className={`p-4 flex items-center justify-between gap-4 transition-colors ${!isLast ? 'border-b border-slate-100' : ''}`}>
                  <div className="flex items-center gap-3.5 w-full min-w-0">
                    <div className="w-[42px] h-[42px] rounded-full bg-[#f2f2f7] flex flex-shrink-0 items-center justify-center border border-slate-200/50">
                       <TrendingUp className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-[16px] truncate">{associatedGoal.title}</p>
                      <p className="text-[12px] text-slate-500 font-medium mt-0.5 truncate tracking-wide">
                        {new Date(t.createdAt).toLocaleDateString('uz-UZ', { month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                       <p className="font-display font-semibold text-slate-800 text-[16px]">+{t.amount.toLocaleString()}</p>
                       <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">UZS</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  );
}
