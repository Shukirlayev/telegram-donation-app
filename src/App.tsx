/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from "react";
import AnimatedNumber from "./components/AnimatedNumber";
import { triggerHaptic } from "./utils/haptics";
import { UserProfile, Goal, Transaction } from "./types";
import { Loader2, AlertCircle, Home as HomeIcon, PieChart as PieChartIcon, User as UserIcon, Clock as ClockIcon, Plus as PlusIcon } from "lucide-react";
import Home from "./components/Home";
import History from "./components/History";
import AddGoal from "./components/AddGoal";
import Stats from "./components/Stats";
import Profile from "./components/Profile";
import Onboarding from "./components/Onboarding";
import { HomeSkeleton, StatsSkeleton, ProfileSkeleton } from "./components/Skeletons";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "./i18n";
import { useAppContext } from "./contexts/AppContext";

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export default function App() {
  const { t } = useTranslation();
  const { showToast, formatMoney, currencySymbol } = useAppContext();
  const [token, setToken] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState<string>("Boshlanmoqda...");
  const [error, setError] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  
  const [activeTab, setActiveTab] = useState<"home" | "history" | "add" | "stats" | "profile">("home");
  
  const [isOnboarding, setIsOnboarding] = useState<boolean>(() => !localStorage.getItem('app_onboarded'));
  const [telegramUser, setTelegramUser] = useState<any>(null);

  // 1. Auth
  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData;
    
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      setTelegramUser(window.Telegram.WebApp.initDataUnsafe.user);
    }

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
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Imzo tasdiqlanmadi");
        }
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
        showToast("Avtorizatsiya xatosi", "error");
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
      showToast("Ma'lumotni yuklashda xatolik", "error");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  if (isOnboarding) {
    return (
      <Onboarding
        telegramUser={telegramUser || profile || null}
        onComplete={() => {
          localStorage.setItem('app_onboarded', 'true');
          setIsOnboarding(false);
        }}
      />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
          <AlertCircle className="w-14 h-14 text-rose-500 mb-4" />
          <h2 className="text-xl font-display font-semibold mb-2">Xatolik</h2>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400 max-w-sm">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (loadingText) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">{loadingText}</p>
      </div>
    );
  }

  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("greeting.morning");
    if (hour < 18) return t("greeting.day");
    if (hour < 22) return t("greeting.evening");
    return t("greeting.night");
  };

  return (
    <div className="min-h-[100dvh] bg-[#f2f2f7] dark:bg-slate-900 pb-28 font-sans overflow-x-hidden selection:bg-indigo-500/30 transition-colors duration-300">
      {/* Premium Header - Apple Wallet Style */}
      <div className="relative bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 dark:from-indigo-950 dark:via-slate-900 dark:to-indigo-950 px-6 py-10 text-white rounded-b-[2.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.15)] min-h-[190px] overflow-hidden transition-colors duration-300">
        {/* Decorative subtle gradient */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-sky-500/10 rounded-full blur-3xl border border-white/5" />
        
        <div className="relative z-10 flex flex-col h-full justify-between mt-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-slate-400 text-[13px] font-medium mb-0.5">{getGreeting()},</p>
              <h1 className="text-2xl font-display font-semibold text-white tracking-tight truncate max-w-[200px]">
                {profile?.displayName || profile?.telegramFirstName || t("header.user")}
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
               {activeTab === "home" ? t("header.totalSaved") : activeTab === "history" ? t("nav.history") || "Tarix" : activeTab === "add" ? t("home.add") || "Yangi maqsad" : activeTab === "stats" ? t("header.stats") : t("header.profile")}
             </p>
             <motion.div 
               key="header-val"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex items-baseline gap-2"
             >
               <AnimatedNumber 
                  className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white"
                  value={totalSaved}
                  formatFunc={formatMoney}
               />
               {activeTab === "home" && <span className="text-lg font-semibold text-slate-400">{currencySymbol}</span>}
             </motion.div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 max-w-xl mx-auto relative z-10">
         {loadingData ? (
           <div className="py-2">
             {activeTab === "home" && <HomeSkeleton />}
             {activeTab === "stats" && <StatsSkeleton />}
             {activeTab === "profile" && <ProfileSkeleton />}
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
               {activeTab === "history" && <History goals={goals} transactions={transactions} />}
               {activeTab === "add" && <AddGoal token={token} onSuccess={() => { fetchData(); setActiveTab("home"); }} onCancel={() => setActiveTab("home")} />}
               {activeTab === "stats" && <Stats goals={goals} transactions={transactions} />}
               {activeTab === "profile" && <Profile profile={profile} token={token} onRefresh={fetchData} transactions={transactions} goals={goals} />}
             </motion.div>
           </AnimatePresence>
         )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-t border-white/50 dark:border-slate-800/80 pb-safe pt-2 px-6 shadow-[0_-4px_20px_rgb(0,0,0,0.02)] transition-colors duration-300">
        <div className="flex justify-around items-center max-w-md mx-auto pb-4 pt-1">
           <NavItem icon={HomeIcon} label={t("nav.home")} isActive={activeTab === "home"} onClick={() => setActiveTab("home")} />
           <NavItem icon={ClockIcon} label={t("nav.history") || "Tarix"} isActive={activeTab === "history"} onClick={() => setActiveTab("history")} />
           
           <div className="relative -top-5">
             <button
               onClick={() => { triggerHaptic('light'); setActiveTab("add"); }}
               className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 transition-transform active:scale-90 ${activeTab === "add" ? "bg-indigo-600 scale-105" : "bg-indigo-500 hover:bg-indigo-600"}`}
             >
               <PlusIcon className={`w-7 h-7 transition-transform ${activeTab === 'add' ? 'rotate-45' : ''}`} strokeWidth={2.5} />
             </button>
           </div>

           <NavItem icon={PieChartIcon} label={t("nav.stats")} isActive={activeTab === "stats"} onClick={() => setActiveTab("stats")} />
           <NavItem icon={UserIcon} label={t("nav.profile")} isActive={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, isActive, onClick }: { icon: any, label: string, isActive: boolean, onClick: () => void }) {
  const handleClick = () => {
    if (!isActive) triggerHaptic('light');
    onClick();
  };

  return (
    <button 
      onClick={handleClick} 
      className={`flex flex-col items-center justify-center gap-1 w-[72px] transition-colors duration-200 ${
        isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      }`}
    >
      <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : 'active:scale-95'}`} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] font-semibold tracking-wide">{label}</span>
    </button>
  );
}
