import { Goal, Transaction, UserProfile } from "../types";
import { TrendingUp, Target, Plus, CheckCircle2, X, Edit2, Check, Trash2, ChevronRight, Wallet } from "lucide-react";
import { useState } from "react";
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
  const [savingGoal, setSavingGoal] = useState(false);
  
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState("");
  const [editGoalTarget, setEditGoalTarget] = useState("");

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
          color: "#" + Math.floor(Math.random()*16777215).toString(16)
        })
      });
      if (res.ok) {
        setNewGoalTitle(""); setNewGoalTarget(""); setShowNewGoal(false);
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
        body: JSON.stringify({ title: editGoalTitle, targetAmount: editGoalTarget })
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
    <div className="space-y-10">
      {/* Goals Section */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-slate-800 text-lg tracking-tight">Maqsadlar</h2>
          <button 
            onClick={() => setShowNewGoal(!showNewGoal)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
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
              className="bg-white p-5 rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 mb-6 overflow-hidden"
            >
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Yangi Kategoriya</h3>
              <div className="space-y-4">
                <div>
                   <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block tracking-wider">Nomi</label>
                   <input type="text" placeholder="Masalan: Noutbuk" value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" />
                </div>
                <div>
                   <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block tracking-wider">Maqsad summasi (UZS)</label>
                   <input type="number" placeholder="5000000" value={newGoalTarget} onChange={e => setNewGoalTarget(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" />
                </div>
                <button onClick={handleCreateGoal} disabled={savingGoal || !newGoalTitle || !newGoalTarget} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl py-3.5 text-sm transition-colors disabled:opacity-50 mt-2 shadow-[0_4px_12px_rgb(79,70,229,0.3)]">
                  {savingGoal ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {goals.length === 0 ? (
          <div className="bg-white p-8 rounded-[1.5rem] border border-dashed border-slate-200 text-center shadow-sm">
            <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium text-sm">Hali maqsad qo'shilmagan.</p>
            <p className="text-slate-400 text-xs mt-1">Pul yig'ishni boshlash uchun kategoriya unga qo'shing</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {goals.map((goal, index) => {
              const percentRaw = (goal.currentAmount / goal.targetAmount) * 100;
              const percent = Math.min(percentRaw, 100).toFixed(1);
              const isComplete = goal.currentAmount >= goal.targetAmount;
              const isEditing = editingGoalId === goal.id;

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={goal.id} 
                  className="bg-white p-5 rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/50 relative overflow-hidden group"
                >
                  {isEditing ? (
                    <div className="space-y-3 relative z-10">
                       <input type="text" value={editGoalTitle} onChange={e => setEditGoalTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-medium" />
                       <input type="number" value={editGoalTarget} onChange={e => setEditGoalTarget(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-medium" />
                       <div className="flex items-center gap-2 pt-2">
                         <button onClick={() => handleSaveEdit(goal.id)} className="flex-1 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl flex justify-center items-center gap-1 shadow-sm"><Check className="w-4 h-4" /> Saqlash</button>
                         <button onClick={() => setEditingGoalId(null)} className="flex-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl flex justify-center items-center gap-1"><X className="w-4 h-4" /> Bekor qilish</button>
                       </div>
                    </div>
                  ) : (
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                         <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                              {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                           </div>
                           <div>
                             <h3 className="font-display font-semibold text-slate-800 text-base leading-tight">
                               {goal.title}
                             </h3>
                             <p className="text-[11px] font-semibold text-slate-400 mt-0.5 tracking-wider uppercase">Maqsad: {goal.targetAmount.toLocaleString()}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-full">
                           <button onClick={() => { setEditingGoalId(goal.id); setEditGoalTitle(goal.title); setEditGoalTarget(goal.targetAmount.toString()); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-full transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                           <button onClick={() => handleDeleteGoal(goal.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-full transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                         </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex justify-between items-end mb-2">
                           <span className="font-display font-bold text-xl text-slate-800 tracking-tight">{goal.currentAmount.toLocaleString()} <span className="text-xs font-semibold text-slate-400">UZS</span></span>
                           <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{percent}%</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-slate-800 text-lg tracking-tight">So'nggi harakatlar</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white p-6 rounded-[1.5rem] text-center border border-slate-100/50 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
            <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium text-sm">Tranzaksiyalar mavjud emas.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100/50 overflow-hidden">
            {transactions.map((t, index) => {
              const associatedGoal = goals.find(g => g.id === t.goalId) || { title: 'Arxivlangan' };
              const isLast = index === transactions.length - 1;
              return (
                <div key={t.id} className={`p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors ${!isLast ? 'border-b border-slate-100' : ''}`}>
                  <div className="flex items-center gap-3 w-full min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex flex-shrink-0 items-center justify-center">
                       <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{associatedGoal.title}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                        {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                       <p className="font-display font-bold text-emerald-600 text-sm">+{t.amount.toLocaleString()} <span className="text-[10px] font-semibold opacity-70">UZS</span></p>
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
