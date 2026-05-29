import { UserProfile } from "../types";
import { User, Edit2, Check, X, Shield, Smartphone } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";

interface ProfileProps {
  profile: UserProfile | null;
  token: string | null;
  onRefresh: () => void;
}

export default function Profile({ profile, token, onRefresh }: ProfileProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(profile?.displayName || "");
  const [savingName, setSavingName] = useState(false);

  const handleSaveName = async () => {
    if (!token || !editNameValue.trim()) return;
    setSavingName(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName: editNameValue.trim() })
      });
      if (res.ok) {
        setIsEditingName(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-semibold text-slate-800 text-lg tracking-tight">Sozlamalar</h2>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-7 rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col items-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 mb-6">
          <div className="relative">
            {profile?.telegramPhotoUrl ? (
              <img src={profile.telegramPhotoUrl} alt="Profile" className="w-28 h-28 rounded-full border-[6px] border-white object-cover shadow-[0_8px_30px_rgb(0,0,0,0.12)]" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-indigo-50 flex items-center justify-center border-[6px] border-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <User className="w-12 h-12 text-indigo-300" />
              </div>
            )}
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
               <Shield className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        <div className="w-full space-y-5">
          <div>
            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider ml-1 mb-1.5 block">Körünuvchi Ism</label>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 font-medium transition-all"
                  placeholder="Ismingiz..."
                />
                <button 
                  onClick={handleSaveName} 
                  disabled={savingName || !editNameValue.trim()} 
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-[0_4px_12px_rgb(79,70,229,0.2)]"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    setIsEditingName(false);
                    setEditNameValue(profile?.displayName || "");
                  }} 
                  className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-100/80 group transition-all hover:bg-slate-50">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600" />
                   </div>
                   <span className="font-semibold text-slate-800 tracking-tight">{profile?.displayName || profile?.telegramFirstName || "Foydalanuvchi"}</span>
                </div>
                <button 
                  onClick={() => { setIsEditingName(true); setEditNameValue(profile?.displayName || ""); }}
                  className="text-slate-400 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider ml-1 mb-1.5 block">Ulangan Telegram Hisob</label>
            <div className="flex items-center p-4 bg-slate-50/80 rounded-xl border border-slate-100/80">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                 </div>
                 <div>
                    <p className="font-semibold text-slate-800 tracking-tight">@{profile?.telegramUsername || profile?.telegramFirstName || "Yashirin"}</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5 tracking-wide">ID: {profile?.telegramId}</p>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
