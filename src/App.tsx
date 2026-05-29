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
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-8 text-white rounded-b-[2rem] shadow-lg flex flex-col justify-end min-h-[140px]">
        {activeTab === "home" && <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Jami Yig'ildi</p>}
        {activeTab === "stats" && <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Statistika</p>}
        {activeTab === "profile" && <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Profil {profile?.displayName ? `(${profile.displayName})` : ""}</p>}
        
        <p className="text-4xl font-extrabold tracking-tight">
          {totalSaved.toLocaleString()} <span className="text-xl font-semibold opacity-70">UZS</span>
        </p>
      </div>

      <div className="px-5 mt-8 max-w-xl mx-auto">
         {loadingData ? (
           <div className="flex justify-center py-10">
             <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
           </div>
         ) : (
           <>
             {activeTab === "home" && <Home goals={goals} transactions={transactions} token={token} onRefresh={fetchData} totalSaved={totalSaved} />}
             {activeTab === "stats" && <Stats goals={goals} />}
             {activeTab === "profile" && <Profile profile={profile} token={token} onRefresh={fetchData} />}
           </>
         )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-around items-center z-50">
         <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center gap-1 ${activeTab === "home" ? "text-blue-600" : "text-slate-400"}`}>
            <HomeIcon className={`w-6 h-6 ${activeTab === 'home' ? 'fill-blue-50' : ''}`} />
            <span className="text-[10px] font-semibold">Asosiy</span>
         </button>
         <button onClick={() => setActiveTab("stats")} className={`flex flex-col items-center gap-1 ${activeTab === "stats" ? "text-blue-600" : "text-slate-400"}`}>
            <PieChartIcon className={`w-6 h-6 ${activeTab === 'stats' ? 'fill-blue-50' : ''}`} />
            <span className="text-[10px] font-semibold">Statistika</span>
         </button>
         <button onClick={() => setActiveTab("profile")} className={`flex flex-col items-center gap-1 ${activeTab === "profile" ? "text-blue-600" : "text-slate-400"}`}>
            <UserIcon className={`w-6 h-6 ${activeTab === 'profile' ? 'fill-blue-50' : ''}`} />
            <span className="text-[10px] font-semibold">Profil</span>
         </button>
      </div>
    </div>
  );
}
