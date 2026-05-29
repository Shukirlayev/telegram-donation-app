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
    <div className="space-y-6 pb-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display font-semibold text-slate-800 text-[26px] tracking-tight">Sozlamalar</h2>
      </div>

      {/* Main Profile Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-5 rounded-[1.25rem] shadow-sm border border-slate-200/60 flex flex-col relative overflow-hidden"
      >
        <div className="relative z-10 flex items-center gap-5">
          <div className="relative shrink-0">
            {profile?.telegramPhotoUrl ? (
              <img src={profile.telegramPhotoUrl} alt="Profile" className="w-[84px] h-[84px] rounded-full border-[3px] border-white object-cover shadow-sm" />
            ) : (
              <div className="w-[84px] h-[84px] rounded-full bg-slate-100 flex items-center justify-center border-[3px] border-white shadow-sm">
                <User className="w-8 h-8 text-slate-400" />
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#34C759] rounded-full border-[3px] border-white flex items-center justify-center shadow-sm">
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
                      className="w-full bg-[#f2f2f7] border-0 rounded-xl px-3 py-2 text-[15px] outline-none font-medium transition-all focus:ring-2 ring-slate-200"
                      placeholder="Ismingiz..."
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveName} 
                      disabled={savingName || !editNameValue.trim()} 
                      className="px-4 py-2 bg-slate-800 text-white text-[13px] font-semibold rounded-xl active:scale-95 transition-transform disabled:opacity-50 flex-1"
                    >
                      Saqlash
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditingName(false);
                        setEditNameValue(profile?.displayName || "");
                      }} 
                      className="px-4 py-2 bg-slate-200 text-slate-700 text-[13px] font-semibold rounded-xl active:scale-95 transition-transform flex-1"
                    >
                      Bekor
                    </button>
                  </div>
               </div>
            ) : (
               <div>
                  <div className="flex items-center justify-between group">
                    <h3 className="font-display font-semibold text-[20px] text-slate-800 truncate pr-2">
                      {profile?.displayName || profile?.telegramFirstName || "Foydalanuvchi"}
                    </h3>
                    <button 
                      onClick={() => { setIsEditingName(true); setEditNameValue(profile?.displayName || ""); }}
                      className="text-slate-400 hover:text-slate-800 transition-colors bg-[#f2f2f7] rounded-full p-2"
                    >
                      <Edit2 className="w-[14px] h-[14px]" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-slate-500">
                     <Smartphone className="w-[14px] h-[14px]" />
                     <p className="text-[13px] font-medium truncate">@{profile?.telegramUsername || profile?.telegramFirstName || "Yashirin"}</p>
                  </div>
               </div>
            )}
          </div>
        </div>
        
        {!isEditingName && (
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
             <div className="text-left w-full flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-500">Ilova versiyasi</span>
                <span className="text-[13px] font-medium text-slate-400 bg-slate-50 py-1 px-2.5 rounded-md border border-slate-100">v1.2.0-beta</span>
             </div>
          </div>
        )}
      </motion.div>

      {/* Settings iOS Style Lists */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
        
        <div>
          <h3 className="text-[13px] font-medium text-slate-500 ml-4 mb-1.5">ASOSIY SOZLAMALAR</h3>
          <div className="bg-white rounded-[1.25rem] overflow-hidden shadow-sm border border-slate-200/60">
             <SettingsRow icon={Globe} iconBg="bg-[#007AFF]" iconColor="text-white" label="Ilova tili" value="O'zbekcha" onClick={() => alert("Til sozlamalari tez orada qo'shiladi")} />
             <SettingsRow icon={CreditCard} iconBg="bg-[#34C759]" iconColor="text-white" label="Asosiy valyuta" value="UZS" onClick={() => alert("Faqat UZS valyutasi qo'llab-quvvatlanadi")} />
             <SettingsRow icon={Bell} iconBg="bg-[#FF3B30]" iconColor="text-white" label="Bildirishnomalar" value={notification ? "Yoqilgan" : "O'ch."} onClick={() => setNotification(!notification)} />
             <SettingsRow icon={Moon} iconBg="bg-[#5856D6]" iconColor="text-white" label="Tungi rejim" value={nightMode ? "Yoqilgan" : "Avto"} onClick={() => setNightMode(!nightMode)} isLast={true} />
          </div>
        </div>

        <div>
           <h3 className="text-[13px] font-medium text-slate-500 ml-4 mb-1.5">XAVFSIZLIK</h3>
           <div className="bg-white rounded-[1.25rem] overflow-hidden shadow-sm border border-slate-200/60">
             <SettingsRow icon={Lock} iconBg="bg-[#8E8E93]" iconColor="text-white" label="PIN-kod o'rnatish" onClick={() => alert("PIN-kod sozlamalari yangilanmoqda...")} isLast={true} />
           </div>
        </div>

        <div>
          <h3 className="text-[13px] font-medium text-slate-500 ml-4 mb-1.5">MA'LUMOT</h3>
          <div className="bg-white rounded-[1.25rem] overflow-hidden shadow-sm border border-slate-200/60">
             <SettingsRow icon={HelpCircle} iconBg="bg-[#007AFF]" iconColor="text-white" label="Yordam va qoidalar" onClick={() => alert("Yordam sahifasi tayyorlanmoqda")} />
             <SettingsRow icon={Download} iconBg="bg-[#34C759]" iconColor="text-white" label="Tranzaksiyalarni yuklash" onClick={() => downloadCSV(transactions, "tranzaksiyalar.csv")} />
             <SettingsRow icon={Download} iconBg="bg-[#FF9500]" iconColor="text-white" label="Maqsadlarni yuklash" onClick={() => downloadCSV(goals, "maqsadlar.csv")} isLast={true} />
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
          className="w-full bg-white text-[#FF3B30] font-semibold py-3.5 rounded-[1.25rem] border border-slate-200/60 shadow-sm flex items-center justify-center gap-2 active:bg-slate-50 transition-colors mb-6 text-[15px]"
        >
          <span>Chiqish / Yopish</span>
        </button>
        
      </motion.div>
    </div>
  );
}

function SettingsRow({ icon: Icon, iconBg, iconColor, label, value, isLast = false, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex items-center justify-between py-3 px-4 bg-white active:bg-slate-100 transition-colors cursor-pointer relative`}>
      <div className="flex items-center gap-3.5 z-10">
        <div className={`w-[30px] h-[30px] rounded-[7px] flex items-center justify-center shrink-0 ${iconBg} shadow-sm`}>
           <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
        </div>
        <span className="font-semibold text-slate-800 text-[16px] tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-2 z-10">
        {value && <span className="text-[15px] font-medium text-slate-400">{value}</span>}
        <ChevronRight className="w-[18px] h-[18px] text-slate-300" />
      </div>
      {!isLast && <div className="absolute bottom-0 left-[60px] right-0 h-[1px] bg-slate-200/60" />}
    </div>
  )
}
