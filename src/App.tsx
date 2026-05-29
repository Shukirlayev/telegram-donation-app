/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from "react";
import { Donation, UserProfile } from "./types";
import { Loader2, Coins, TrendingUp, AlertCircle, Edit2, Check, X, User } from "lucide-react";

// Add missing Telegram WebApp typing globally
declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);

  // 1. Auth on load using Telegram InitData
  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData;

    if (!initData) {
      setError("This application must be opened inside Telegram Mini App. Or your initData is empty.");
      setLoadingText("");
      return;
    }

    setLoadingText("Authenticating...");

    fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to authenticate signature");
        return res.json();
      })
      .then((data: { token: string; userId: number }) => {
        setToken(data.token);
        // Expand Telegram Web App view
        if (window.Telegram?.WebApp?.expand) {
            window.Telegram.WebApp.expand();
        }
      })
      .catch(err => {
        setError(err.message || "Failed to login via Telegram");
      })
      .finally(() => setLoadingText(""));
  }, []);

  // 2. Fetch donations & profile once we have a token
  useEffect(() => {
    if (!token) return;

    setLoadingData(true);
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("/api/donations", { headers }).then(r => r.ok ? r.json() : { donations: [] }),
      fetch("/api/user/profile", { headers }).then(r => r.ok ? r.json() : { profile: null })
    ])
      .then(([donationsData, profileData]) => {
        setDonations(donationsData.donations || []);
        setProfile(profileData.profile || null);
        if (profileData.profile?.displayName) {
          setEditNameValue(profileData.profile.displayName);
        }
      })
      .catch(err => {
        setError(err.message || "Failed to load payload");
      })
      .finally(() => setLoadingData(false));
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Error</h2>
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

  const totalSum = donations.reduce((acc, current) => acc + current.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-blue-600 px-6 py-8 text-white rounded-b-[2rem] shadow-md">
        
        {/* Profile Section */}
        <div className="flex items-center gap-4 mb-6 bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
          {profile?.telegramPhotoUrl ? (
            <img src={profile.telegramPhotoUrl} alt="Profile" className="w-12 h-12 rounded-full border-2 border-white/50 object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {isEditingName ? (
               <div className="flex items-center gap-2">
                 <input
                   type="text"
                   value={editNameValue}
                   onChange={(e) => setEditNameValue(e.target.value)}
                   className="flex-1 bg-white/20 border border-white/30 rounded-lg px-2 py-1 text-white text-sm outline-none placeholder-white/50"
                   placeholder="Your Name..."
                 />
                 <button 
                   onClick={handleSaveName} 
                   disabled={savingName || !editNameValue.trim()} 
                   className="p-1.5 bg-white/20 rounded-md hover:bg-white/30 transition-colors disabled:opacity-50"
                 >
                   <Check className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={() => {
                     setIsEditingName(false);
                     setEditNameValue(profile?.displayName || "");
                   }} 
                   className="p-1.5 bg-white/10 rounded-md hover:bg-white/30 transition-colors"
                 >
                   <X className="w-4 h-4" />
                 </button>
               </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg truncate">
                  {profile?.displayName || profile?.telegramFirstName || "User"}
                </p>
                <button 
                 onClick={() => setIsEditingName(true)}
                 className="text-white/70 hover:text-white transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            
            {(profile?.telegramUsername) && (
              <p className="text-blue-200 text-xs mt-0.5 truncate">
                @{profile.telegramUsername}
              </p>
            )}
          </div>
        </div>

        <h1 className="text-xl font-bold mb-1">My Donations</h1>
        <p className="text-blue-100 opacity-90 text-sm">Thank you for your contributions!</p>
        
        <div className="mt-6 bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/20">
          <div className="flex items-center gap-3 mb-1 text-blue-50">
            <Coins className="w-5 h-5 text-yellow-300" />
            <span className="font-semibold text-sm">Total Sum</span>
          </div>
          <p className="text-3xl font-extrabold tracking-tight">
            {totalSum.toLocaleString()} <span className="text-lg font-medium opacity-80">UZS</span>
          </p>
        </div>
      </div>

      {/* List */}
      <div className="px-5 mt-8 max-w-xl mx-auto">
        <div className="flex items-center gap-2 mb-4 text-gray-800">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-lg">History</h2>
        </div>

        {loadingData ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : donations.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm text-center border border-gray-100">
            <p className="text-gray-500 text-sm">You haven't made any donations yet.</p>
            <p className="text-xs text-gray-400 mt-2">Send a message to the bot (e.g. 500 noutbuk) to see it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {donations.map((d) => (
              <div key={d.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-800 text-base">{d.amount.toLocaleString()} UZS</p>
                  <p className="text-gray-500 text-sm mt-0.5">{d.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md">
                    {new Date(d.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
