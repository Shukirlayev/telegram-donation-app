/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from "react";
import { UserProfile, Goal, Transaction } from "./types";
import { Loader2, TrendingUp, AlertCircle, Edit2, Check, X, User, Plus, Target, CheckCircle2 } from "lucide-react";

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState<string>("Boshlanmoqda...");
  const [error, setError] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);

  // New Goal State
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  // 1. Auth
  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData;

    if (!initData) {
      setError("Bu ilova Telegram orqali ochilishi kerak.");
      setLoadingText("");
      return;
    }

    setLoadingText("Avtorizatsiya...");

    fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData })
    })
      .then(res => {
        if (!res.ok) throw new Error("Imzo tasdiqlanmadi");
        return res.json();
      })
      .then((data: { token: string; userId: number }) => {
        setToken(data.token);
        if (window.Telegram?.WebApp?.expand) {
            window.Telegram.WebApp.expand();
        }
      })
      .catch(err => {
        setError(err.message || "Telegram orqali tizimga kirishda xato");
      })
      .finally(() => setLoadingText(""));
  }, []);

  // 2. Fetch data (Goals, Transactions, Profile)
  const fetchData = async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      const res = await fetch("/api/data", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Ma'lumotni yuklashda xatolik");
      const data = await res.json();
      setGoals(data.goals || []);
      setTransactions(data.transactions || []);
      setProfile(data.profile || null);
      if (data.profile?.displayName) {
        setEditNameValue(data.profile.displayName);
      }
    } catch(err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSaveName = async () => {
    if (!token || !editNameValue.trim()) return;
    setSavingName(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ displayName: editNameValue.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setIsEditingName(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingName(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!token || !newGoalTitle.trim() || !newGoalTarget.trim()) return;
    setSavingGoal(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: newGoalTitle.trim(), 
          targetAmount: newGoalTarget,
          color: "#" + Math.floor(Math.random()*16777215).toString(16) // Random color indicator
        })
      });
      if (res.ok) {
        setNewGoalTitle("");
        setNewGoalTarget("");
        setShowNewGoal(false);
        fetchData(); // reload goals
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingGoal(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Xatolik</h2>
        <p className="text-center text-sm text-gray-600 max-w-sm">{error}</p>
      </div>
    );
  }

  if (loadingText) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500 font-medium">{loadingText}</p>
      </div>
    );
  }

  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-8 text-white rounded-b-[2rem] shadow-lg">
        
        {/* Profile Section */}
        <div className="flex items-center gap-4 mb-6 bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-md">
          {profile?.telegramPhotoUrl ? (
            <img src={profile.telegramPhotoUrl} alt="Profile" className="w-12 h-12 rounded-full border border-white/30 object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/30">
              <User className="w-6 h-6 text-white/80" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {isEditingName ? (
               <div className="flex items-center gap-2">
                 <input
                   type="text"
                   value={editNameValue}
                   onChange={(e) => setEditNameValue(e.target.value)}
                   className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm outline-none placeholder-white/40"
                   placeholder="Ismingiz..."
                 />
                 <button 
                   onClick={handleSaveName} 
                   disabled={savingName || !editNameValue.trim()} 
                   className="p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                 >
                   <Check className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={() => {
                     setIsEditingName(false);
                     setEditNameValue(profile?.displayName || "");
                   }} 
                   className="p-1.5 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
                 >
                   <X className="w-4 h-4" />
                 </button>
               </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg truncate">
                  {profile?.displayName || profile?.telegramFirstName || "Foydalanuvchi"}
                </p>
                <button 
                 onClick={() => setIsEditingName(true)}
                 className="text-white/50 hover:text-white transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            
            {(profile?.telegramUsername) && (
              <p className="text-slate-400 text-xs mt-0.5 truncate">
                @{profile.telegramUsername}
              </p>
            )}
          </div>
        </div>

        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Jami Yig'ildi</p>
        <p className="text-4xl font-extrabold tracking-tight mb-2">
          {totalSaved.toLocaleString()} <span className="text-xl font-semibold opacity-70">UZS</span>
        </p>
      </div>

      <div className="px-5 mt-8 max-w-xl mx-auto space-y-8">
        
        {/* Goals Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Maqsadlar / Kategoriyalar
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
                <input
                  type="text"
                  placeholder="Kategoriya nomi (masalan: Noutbuk)"
                  value={newGoalTitle}
                  onChange={e => setNewGoalTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Maqsad summam (UZS)"
                  value={newGoalTarget}
                  onChange={e => setNewGoalTarget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleCreateGoal}
                  disabled={savingGoal || !newGoalTitle || !newGoalTarget}
                  className="w-full bg-blue-600 text-white font-medium rounded-lg py-2.5 text-sm disabled:opacity-50"
                >
                  {savingGoal ? "Saqlanmoqda..." : "Kategoriya Qo'shish"}
                </button>
              </div>
            </div>
          )}

          {loadingData ? (
             <div className="flex justify-center py-4">
               <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
             </div>
          ) : goals.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center">
              <p className="text-slate-500 text-sm">Hali hech qanday maqsad yoki kategoriya qo'shilmagan.</p>
              <button 
                onClick={() => setShowNewGoal(true)}
                className="mt-3 text-blue-600 text-sm font-medium flex items-center justify-center gap-1 mx-auto"
              >
                <Plus className="w-4 h-4" /> Kategoriya yaratish
              </button>
            </div>
          ) : (
            <div className="grid gap-3 font-sans">
              {goals.map(goal => {
                const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100).toFixed(1);
                const isComplete = goal.currentAmount >= goal.targetAmount;
                return (
                  <div key={goal.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between mb-2">
                       <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                         {goal.title}
                         {isComplete && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                       </h3>
                       <p className="text-right text-sm">
                         <span className="font-bold text-slate-800">{goal.currentAmount.toLocaleString()}</span>
                         <span className="text-slate-400 text-xs"> / {goal.targetAmount.toLocaleString()}</span>
                       </p>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 text-right font-medium">{percent}% bajarildi</p>
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

          {loadingData ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white p-5 rounded-2xl text-center border border-slate-100 shadow-sm">
              <p className="text-slate-500 text-sm">Tranzaksiyalar mavjud emas.</p>
              <p className="text-xs text-slate-400 mt-2">Botga o'tib, summamni yozing (masalan: 500 noutbuk).</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => {
                const associatedGoal = goals.find(g => g.id === t.goalId);
                return (
                  <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-base">+{t.amount.toLocaleString()} <span className="text-xs font-medium text-slate-500">UZS</span></p>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md font-medium truncate">
                           {associatedGoal?.title || 'Noma\'lum'}
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
    </div>
  );
}
