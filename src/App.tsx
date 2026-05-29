/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from "react";
import { UserProfile, Goal, Transaction } from "./types";
import { Loader2, AlertCircle, Home as HomeIcon, PieChart as PieChartIcon, User as UserIcon } from "lucide-react";
import Home from "./components/Home";
import Stats from "./components/Stats";
import Profile from "./components/Profile";
import { AnimatePresence, motion } from "motion/react";

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
  
  const [activeTab, setActiveTab] = useState<"home" | "stats" | "profile">("home");

  // 1. Auth
  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData;

    // FOR TESTING LOCALLY WITHOUT TELEGRAM:
    if (!initData) {
       setError("Bu ilova Telegram orqali ochilishi kerak!");
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
            window.Telegram.WebApp.setHeaderColor?.('#1e1b4b'); // Match indigo-950
        }
      })
      .catch(err => {
        setError(err.message || "Telegram orqali tizimga kirishda xato");
      })
      .finally(() => setLoadingText(""));
  }, []);

  // 2. Fetch data
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
    } catch(err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 text-slate-800 p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
          <AlertCircle className="w-14 h-14 text-rose-500 mb-4" />
          <h2 className="text-xl font-display font-semibold mb-2">Xatolik</h2>
          <p className="text-center text-sm text-slate-600 max-w-sm">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (loadingText) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">{loadingText}</p>
      </div>
    );
  }

  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Xayrli tong";
    if (hour < 18) return "Xayrli kun";
    return "Xayrli kech";
  };

  return (
    <div className="min-h-[100dvh] bg-[#f2f2f7] pb-28 font-sans overflow-x-hidden selection:bg-indigo-500/30">
      {/* Premium Header - Apple Wallet Style */}
      <div className="relative bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 px-6 py-10 text-white rounded-b-[2.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.15)] min-h-[190px] overflow-hidden">
        {/* Decorative subtle gradient */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-sky-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col h-full justify-between mt-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-slate-400 text-[13px] font-medium mb-0.5">{getGreeting()},</p>
              <h1 className="text-2xl font-display font-semibold text-white tracking-tight truncate max-w-[200px]">
                {profile?.displayName || profile?.telegramFirstName || "Foydalanuvchi"}
              </h1>
            </div>
            {profile?.telegramPhotoUrl ? (
              <img src={profile.telegramPhotoUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover shadow-sm" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                <span className="text-lg font-bold font-display uppercase text-white/90">{profile?.displayName?.charAt(0) || "U"}</span>
              </div>
            )}
          </div>

          <div className="mt-2">
             <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
               {activeTab === "home" ? "Jami Yig'ildi" : activeTab === "stats" ? "Statistika" : "Profil sozlamalari"}
             </p>
             <motion.div 
               key={totalSaved}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex items-baseline gap-2"
             >
               <span className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white">
                 {totalSaved.toLocaleString()}
               </span>
               {activeTab === "home" && <span className="text-lg font-semibold text-slate-400">UZS</span>}
             </motion.div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 max-w-xl mx-auto relative z-10">
         {loadingData ? (
           <div className="flex justify-center py-16">
             <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
           </div>
         ) : (
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.98 }}
               transition={{ duration: 0.2 }}
             >
               {activeTab === "home" && <Home goals={goals} transactions={transactions} token={token} onRefresh={fetchData} totalSaved={totalSaved} />}
               {activeTab === "stats" && <Stats goals={goals} transactions={transactions} />}
               {activeTab === "profile" && <Profile profile={profile} token={token} onRefresh={fetchData} transactions={transactions} goals={goals} />}
             </motion.div>
           </AnimatePresence>
         )}
      </div>

      {/* Floating Bottom Navigation (Glassmorphism Pill) */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.08)] px-2 py-2 rounded-full flex justify-between items-center gap-1 pointer-events-auto max-w-[320px] w-full">
           <NavItem icon={HomeIcon} label="Asosiy" isActive={activeTab === "home"} onClick={() => setActiveTab("home")} />
           <NavItem icon={PieChartIcon} label="Statistika" isActive={activeTab === "stats"} onClick={() => setActiveTab("stats")} />
           <NavItem icon={UserIcon} label="Profil" isActive={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, isActive, onClick }: { icon: any, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 ${
        isActive ? "text-indigo-600 bg-white/60 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/30"
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
      {isActive && (
        <motion.span 
          initial={{ opacity: 0, width: 0 }} 
          animate={{ opacity: 1, width: 'auto' }} 
          className="text-[13px] font-semibold overflow-hidden whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}
    </button>
  );
}
