import { UserProfile, Transaction, Goal } from "../types";
import { 
  User, Edit2, Check, X, Shield, Smartphone, 
  Settings, Bell, Globe, Moon, ChevronRight, 
  HelpCircle, LogOut, Download, Lock, CreditCard 
} from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { downloadCSV } from "../utils/export";

interface ProfileProps {
  profile: UserProfile | null;
  token: string | null;
  onRefresh: () => void;
  transactions: Transaction[];
  goals: Goal[];
}

export default function Profile({ profile, token, onRefresh, transactions, goals }: ProfileProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(profile?.displayName || "");
  const [savingName, setSavingName] = useState(false);
  
  const [notification, setNotification] = useState(true);
  const [nightMode, setNightMode] = useState(false);

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
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display font-semibold text-slate-800 text-lg tracking-tight">Sozlamalar</h2>
      </div>

      {/* Main Profile Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-7 rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-5 mb-6">
          <div className="relative shrink-0">
            {profile?.telegramPhotoUrl ? (
              <img src={profile.telegramPhotoUrl} alt="Profile" className="w-20 h-20 rounded-full border-[4px] border-white object-cover shadow-[0_8px_30px_rgb(0,0,0,0.12)]" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center border-[4px] border-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <User className="w-8 h-8 text-indigo-300" />
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-sm">
               <Shield className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditingName ? (
               <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 font-medium transition-all"
                      placeholder="Ismingiz..."
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveName} 
                      disabled={savingName || !editNameValue.trim()} 
                      className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm flex-1"
                    >
                      Saqlash
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditingName(false);
                        setEditNameValue(profile?.displayName || "");
                      }} 
                      className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors flex-1"
                    >
                      Bekor
                    </button>
                  </div>
               </div>
            ) : (
               <div>
                  <div className="flex items-center justify-between group">
                    <h3 className="font-display font-bold text-xl text-slate-800 truncate pr-2">
                      {profile?.displayName || profile?.telegramFirstName || "Foydalanuvchi"}
                    </h3>
                    <button 
                      onClick={() => { setIsEditingName(true); setEditNameValue(profile?.displayName || ""); }}
                      className="text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 rounded-full p-2"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                     <Smartphone className="w-3.5 h-3.5" />
                     <p className="text-sm font-medium truncate">@{profile?.telegramUsername || profile?.telegramFirstName || "Yashirin"}</p>
                  </div>
               </div>
            )}
          </div>
        </div>
        
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
           <div className="text-center w-full">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ilova versiyasi</p>
              <p className="text-xs font-mono font-medium text-slate-500 bg-slate-50 py-1.5 px-3 rounded-lg inline-block border border-slate-100">v1.2.0-beta</p>
           </div>
        </div>
      </motion.div>

      {/* Settings iOS Style Lists */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
        
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-4 mb-2">Asosiy Sozlamalar</h3>
          <div className="bg-white rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
             <SettingsRow icon={Globe} iconBg="bg-blue-100" iconColor="text-blue-600" label="Ilova tili" value="O'zbekcha" onClick={() => alert("Til sozlamalari tez orada qo'shiladi")} />
             <SettingsRow icon={CreditCard} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Asosiy valyuta" value="UZS" onClick={() => alert("Faqat UZS valyutasi qo'llab-quvvatlanadi")} />
             <SettingsRow icon={Bell} iconBg="bg-rose-100" iconColor="text-rose-600" label="Bildirishnomalar" value={notification ? "Yoqilgan" : "O'ch."} onClick={() => setNotification(!notification)} />
             <SettingsRow icon={Moon} iconBg="bg-slate-100" iconColor="text-slate-600" label="Tungi rejim" value={nightMode ? "Yoqilgan" : "Avto"} onClick={() => setNightMode(!nightMode)} isLast={true} />
          </div>
        </div>

        <div>
           <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-4 mb-2">Xavfsizlik</h3>
           <div className="bg-white rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
             <SettingsRow icon={Lock} iconBg="bg-violet-100" iconColor="text-violet-600" label="PIN-kod o'rnatish" onClick={() => alert("PIN-kod sozlamalari yangilanmoqda...")} isLast={true} />
           </div>
        </div>

        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-4 mb-2">Ma'lumot va Xavfsizlik</h3>
          <div className="bg-white rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
             <SettingsRow icon={HelpCircle} iconBg="bg-indigo-100" iconColor="text-indigo-600" label="Yordam va qoidalar" onClick={() => alert("Yordam sahifasi tayyorlanmoqda")} />
             <SettingsRow icon={Download} iconBg="bg-orange-100" iconColor="text-orange-600" label="Tranzaksiyalarni yuklash" onClick={() => downloadCSV(transactions, "tranzaksiyalar.csv")} />
             <SettingsRow icon={Download} iconBg="bg-blue-100" iconColor="text-blue-600" label="Maqsadlarni yuklash" onClick={() => downloadCSV(goals, "maqsadlar.csv")} isLast={true} />
          </div>
        </div>

        <button 
          onClick={() => {
            if (window.Telegram?.WebApp) {
              window.Telegram.WebApp.close();
            } else {
              alert("Oynani yoping");
            }
          }}
          className="w-full bg-white text-rose-500 font-semibold py-4 rounded-[1.5rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center justify-center gap-2 hover:bg-rose-50 active:bg-rose-100 transition-colors mb-6"
        >
          <LogOut className="w-5 h-5" />
          <span>Chiqish / Yopish</span>
        </button>
        
      </motion.div>
    </div>
  );
}

function SettingsRow({ icon: Icon, iconBg, iconColor, label, value, isLast = false, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex items-center justify-between p-4 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer ${!isLast ? 'border-b border-slate-100' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-9 h-9 rounded-[0.85rem] flex items-center justify-center ${iconBg}`}>
           <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
        </div>
        <span className="font-semibold text-slate-800 text-[15px]">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm font-medium text-slate-400">{value}</span>}
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </div>
    </div>
  )
}
