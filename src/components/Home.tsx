import { Goal, Transaction, UserProfile } from "../types";
import { TrendingUp, Target, Plus, CheckCircle2, X, Edit2, Check, Trash2, PieChart as PieChartIcon } from "lucide-react";
import { useState } from "react";

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Goals Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Maqsadlar
          </h2>
          <button 
            onClick={() => setShowNewGoal(!showNewGoal)}
            className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
          >
            {showNewGoal ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {showNewGoal && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 mb-4 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Yangi Kategoriya qo'shish</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Kategoriya nomi (masalan: Noutbuk)" value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
              <input type="number" placeholder="Maqsad summam (UZS)" value={newGoalTarget} onChange={e => setNewGoalTarget(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
              <button onClick={handleCreateGoal} disabled={savingGoal || !newGoalTitle || !newGoalTarget} className="w-full bg-blue-600 text-white font-medium rounded-lg py-2.5 text-sm disabled:opacity-50">
                {savingGoal ? "Saqlanmoqda..." : "Kategoriya Qo'shish"}
              </button>
            </div>
          </div>
        )}

        {goals.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center">
            <p className="text-slate-500 text-sm">Hali hech qanday maqsad yoki kategoriya qo'shilmagan.</p>
            <button onClick={() => setShowNewGoal(true)} className="mt-3 text-blue-600 text-sm font-medium flex items-center justify-center gap-1 mx-auto">
              <Plus className="w-4 h-4" /> Kategoriya yaratish
            </button>
          </div>
        ) : (
          <div className="grid gap-3 font-sans">
            {goals.map(goal => {
              const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100).toFixed(1);
              const isComplete = goal.currentAmount >= goal.targetAmount;
              const isEditing = editingGoalId === goal.id;

              return (
                <div key={goal.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative group overflow-hidden">
                  {isEditing ? (
                    <div className="space-y-2">
                       <input type="text" value={editGoalTitle} onChange={e => setEditGoalTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-sm outline-none" />
                       <input type="number" value={editGoalTarget} onChange={e => setEditGoalTarget(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-sm outline-none" />
                       <div className="flex items-center gap-2 mt-2">
                         <button onClick={() => handleSaveEdit(goal.id)} className="flex-1 bg-green-500 text-white text-xs font-semibold py-1.5 rounded-md"><Check className="w-4 h-4 mx-auto" /></button>
                         <button onClick={() => setEditingGoalId(null)} className="flex-1 bg-slate-200 text-slate-700 text-xs font-semibold py-1.5 rounded-md"><X className="w-4 h-4 mx-auto" /></button>
                       </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                         <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                           {goal.title}
                           {isComplete && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                         </h3>
                         <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => { setEditingGoalId(goal.id); setEditGoalTitle(goal.title); setEditGoalTarget(goal.targetAmount.toString()); }} className="p-1 text-slate-400 hover:text-blue-500"><Edit2 className="w-3.5 h-3.5" /></button>
                           <button onClick={() => handleDeleteGoal(goal.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                         </div>
                      </div>
                      <p className="text-right text-sm">
                         <span className="font-bold text-slate-800">{goal.currentAmount.toLocaleString()}</span>
                         <span className="text-slate-400 text-xs"> / {goal.targetAmount.toLocaleString()}</span>
                      </p>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }} />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 text-right font-medium">{percent}% bajarildi</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Transactions Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 text-slate-800">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <h2 className="font-bold text-lg">Oxirgi Yozuvlar (Daromadlar)</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white p-5 rounded-2xl text-center border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-sm">Tranzaksiyalar mavjud emas.</p>
            <p className="text-xs text-slate-400 mt-2">Botga o'tib, summamni yozing (masalan: 500 noutbuk).</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => {
              const associatedGoal = goals.find(g => g.id === t.goalId) || { title: 'Arxivlangan' };
              return (
                <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-base">+{t.amount.toLocaleString()} <span className="text-xs font-medium text-slate-500">UZS</span></p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md truncate">
                         {associatedGoal.title}
                       </span>
                       <span className="text-slate-400 text-xs truncate">Bot orqali qo'shildi</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </p>
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
