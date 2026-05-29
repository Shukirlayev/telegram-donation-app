import { UserProfile, Transaction, Goal } from "../types";
import { 
  User, Edit2, Check, X, Shield, Smartphone, 
  Settings, Bell, Globe, Moon, ChevronRight, 
  HelpCircle, LogOut, Download, Lock, CreditCard 
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { downloadCSV } from "../utils/export";
import Portal from "./Portal";
import { useTranslation, translations } from "../i18n";
import { useAppContext } from "../contexts/AppContext";

interface ProfileProps {
  profile: UserProfile | null;
  token: string | null;
  onRefresh: () => void;
  transactions: Transaction[];
  goals: Goal[];
}

export default function Profile({ profile, token, onRefresh, transactions, goals }: ProfileProps) {
  const { t, lang, setLang } = useTranslation();
  const { notificationsEnabled, setNotificationsEnabled, theme, setTheme, currency, setCurrency, showToast } = useAppContext();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(profile?.displayName || "");
  const [savingName, setSavingName] = useState(false);
  
  const [showLangModal, setShowLangModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

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
        showToast("Ism o'zgartirildi", "success");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      showToast("Xatolik yuz berdi", "error");
    } finally {
      setSavingName(false);
    }
  };

  const getThemeLabel = () => {
    if (theme === 'system') return t("profile.auto");
    if (theme === 'dark') return t("profile.on");
    return t("profile.off");
  };

  return (
    <div className="space-y-6 pb-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display font-semibold text-slate-800 dark:text-white text-[26px] tracking-tight">{t("profile.settings")}</h2>
      </div>

      {/* Main Profile Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl p-5 rounded-[1.25rem] shadow-sm border border-white/60 dark:border-slate-700/50 flex flex-col relative overflow-hidden transition-colors"
      >
        <div className="relative z-10 flex items-center gap-5">
          <div className="relative shrink-0">
            {profile?.telegramPhotoUrl ? (
              <img src={profile.telegramPhotoUrl} alt="Profile" className="w-[84px] h-[84px] rounded-full border-[3px] border-white dark:border-slate-700 object-cover shadow-sm transition-colors" />
            ) : (
              <div className="w-[84px] h-[84px] rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-[3px] border-white dark:border-slate-600 shadow-sm transition-colors">
                <User className="w-8 h-8 text-slate-400 dark:text-slate-300" />
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#34C759] rounded-full border-[3px] border-white dark:border-slate-700 flex items-center justify-center shadow-sm transition-colors">
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
                      className="w-full bg-[#f2f2f7] dark:bg-slate-900 border-0 rounded-xl px-3 py-2 text-[15px] outline-none font-medium transition-all focus:ring-2 ring-indigo-400 dark:text-white caret-indigo-500"
                      placeholder={t("profile.namePlaceholder")}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveName} 
                      disabled={savingName || !editNameValue.trim()} 
                      className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white text-[13px] font-semibold rounded-xl active:scale-95 transition-transform disabled:opacity-50 flex-1 shadow-sm"
                    >
                      {t("home.save")}
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditingName(false);
                        setEditNameValue(profile?.displayName || "");
                      }} 
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[13px] font-semibold rounded-xl active:scale-95 transition-transform flex-1"
                    >
                      {t("home.cancel")}
                    </button>
                  </div>
               </div>
            ) : (
               <div>
                  <div className="flex items-center justify-between group">
                    <h3 className="font-display font-semibold text-[20px] text-slate-800 dark:text-white truncate pr-2">
                      {profile?.displayName || profile?.telegramFirstName || "Foydalanuvchi"}
                    </h3>
                    <button 
                      onClick={() => { setIsEditingName(true); setEditNameValue(profile?.displayName || ""); }}
                      className="text-slate-400 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors bg-[#f2f2f7] dark:bg-slate-700 rounded-full p-2"
                    >
                      <Edit2 className="w-[14px] h-[14px]" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 dark:text-slate-400">
                     <Smartphone className="w-[14px] h-[14px]" />
                     <p className="text-[13px] font-medium truncate">@{profile?.telegramUsername || profile?.telegramFirstName || t("profile.hidden")}</p>
                  </div>
               </div>
            )}
          </div>
        </div>
        
        {!isEditingName && (
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between transition-colors">
             <div className="text-left w-full flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{t("profile.appVersion")}</span>
                <span className="text-[13px] font-medium text-slate-400 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 py-1 px-2.5 rounded-md border border-slate-100 dark:border-slate-700 transition-colors">v1.2.0-beta</span>
             </div>
          </div>
        )}
      </motion.div>

      {/* Settings iOS Style Lists */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
        
        <div>
          <h3 className="text-[13px] font-medium text-slate-500 dark:text-slate-400 ml-4 mb-1.5">{t("profile.mainSettings")}</h3>
          <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl rounded-[1.25rem] overflow-hidden shadow-sm border border-white/60 dark:border-slate-700/50 transition-colors">
             <SettingsRow icon={Globe} iconBg="bg-[#007AFF]" iconColor="text-white" label={t("profile.language")} value={(translations[lang] as any).profile.languageNames[lang]} onClick={() => setShowLangModal(true)} />
             <SettingsRow icon={CreditCard} iconBg="bg-[#34C759]" iconColor="text-white" label={t("profile.currency")} value={currency} onClick={() => setShowCurrencyModal(true)} />
             <SettingsRow icon={Bell} iconBg="bg-[#FF3B30]" iconColor="text-white" label={t("profile.notifications")} value={notificationsEnabled ? t("profile.on") : t("profile.off")} onClick={() => { setNotificationsEnabled(!notificationsEnabled); showToast(notificationsEnabled ? 'Bildirishnomalar o\'chirildi' : 'Bildirishnomalar yoqildi', 'info'); }} />
             <SettingsRow icon={Moon} iconBg="bg-[#5856D6]" iconColor="text-white" label={t("profile.darkMode")} value={getThemeLabel()} onClick={() => setShowThemeModal(true)} isLast={true} />
          </div>
        </div>

        <div>
           <h3 className="text-[13px] font-medium text-slate-500 dark:text-slate-400 ml-4 mb-1.5">{t("profile.securityGroup")}</h3>
           <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl rounded-[1.25rem] overflow-hidden shadow-sm border border-white/60 dark:border-slate-700/50 transition-colors">
             <SettingsRow icon={Lock} iconBg="bg-[#8E8E93]" iconColor="text-white" label={t("profile.pinCode")} onClick={() => alert("Soon...")} isLast={true} />
           </div>
        </div>

        <div>
           <h3 className="text-[13px] font-medium text-slate-500 dark:text-slate-400 ml-4 mb-1.5">{t("profile.infoGroup")}</h3>
           <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl rounded-[1.25rem] overflow-hidden shadow-sm border border-white/60 dark:border-slate-700/50 transition-colors">
             <SettingsRow icon={HelpCircle} iconBg="bg-[#007AFF]" iconColor="text-white" label={t("profile.help")} onClick={() => setShowHelpModal(true)} />
             <SettingsRow icon={Download} iconBg="bg-[#34C759]" iconColor="text-white" label={t("profile.downloadTx")} onClick={() => downloadCSV(transactions, "tranzaksiyalar.csv")} />
             <SettingsRow icon={Download} iconBg="bg-[#FF9500]" iconColor="text-white" label={t("profile.downloadGoals")} onClick={() => downloadCSV(goals, "maqsadlar.csv")} isLast={true} />
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
          className="w-full bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl text-[#FF3B30] font-semibold py-3.5 rounded-[1.25rem] border border-white/60 dark:border-slate-700/50 shadow-sm flex items-center justify-center gap-2 active:bg-white/50 dark:active:bg-slate-800 transition-colors mb-6 text-[15px]"
        >
          <span>{t("profile.exit")}</span>
        </button>
        
      </motion.div>

      {/* Language Selection Modal */}
      <Portal>
        <AnimatePresence>
          {showLangModal && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowLangModal(false)}
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] p-6 relative z-10 shadow-2xl mb-safe transition-colors"
              >
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden transition-colors" />
                <h3 className="text-xl font-display font-semibold text-slate-800 dark:text-white text-center mb-6">{t("profile.languageModalTitle")}</h3>
                
                <div className="space-y-3">
                  {['uz', 'en', 'ru'].map((l) => (
                    <button key={l} onClick={() => { setLang(l as any); setShowLangModal(false); }} className={`w-full p-4 rounded-2xl flex items-center justify-between transition-colors ${lang === l ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-700'}`}>
                       <span className="font-semibold">{(translations[l as 'uz'|'en'|'ru'] as any).profile.languageNames[l]}</span>
                       {lang === l && <Check className="w-5 h-5 text-indigo-500" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>

      {/* Currency Selection Modal */}
      <Portal>
        <AnimatePresence>
          {showCurrencyModal && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowCurrencyModal(false)}
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] p-6 relative z-10 shadow-2xl mb-safe transition-colors"
              >
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden transition-colors" />
                <h3 className="text-xl font-display font-semibold text-slate-800 dark:text-white text-center mb-6">Valyutani tanlang</h3>
                
                <div className="space-y-3">
                  {['UZS', 'USD', 'EUR', 'RUB'].map((c) => (
                    <button key={c} onClick={() => { setCurrency(c as any); setShowCurrencyModal(false); showToast("Valyuta o'zgartirildi", "success"); }} className={`w-full p-4 rounded-2xl flex items-center justify-between transition-colors ${currency === c ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-700'}`}>
                       <span className="font-semibold">{c}</span>
                       {currency === c && <Check className="w-5 h-5 text-indigo-500" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>

      {/* Theme Selection Modal */}
      <Portal>
        <AnimatePresence>
          {showThemeModal && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowThemeModal(false)}
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] p-6 relative z-10 shadow-2xl mb-safe transition-colors"
              >
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden transition-colors" />
                <h3 className="text-xl font-display font-semibold text-slate-800 dark:text-white text-center mb-6">Tungi rejim</h3>
                
                <div className="space-y-3">
                  {[
                    { id: 'light', label: 'Kunduzgi' },
                    { id: 'dark', label: 'Tungi' },
                    { id: 'system', label: 'Avtomatik (Tizim)' }
                  ].map((tOpt) => (
                    <button key={tOpt.id} onClick={() => { setTheme(tOpt.id as any); setShowThemeModal(false); }} className={`w-full p-4 rounded-2xl flex items-center justify-between transition-colors ${theme === tOpt.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-700'}`}>
                       <span className="font-semibold">{tOpt.label}</span>
                       {theme === tOpt.id && <Check className="w-5 h-5 text-indigo-500" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>

      {/* Help Modal */}
      <Portal>
        <AnimatePresence>
          {showHelpModal && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowHelpModal(false)}
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] p-6 relative z-10 shadow-2xl mb-safe transition-colors max-h-[80vh] overflow-y-auto"
              >
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden transition-colors" />
                <h3 className="text-xl font-display font-semibold text-slate-800 dark:text-white text-center mb-4">Yordam va qoidalar</h3>
                
                <div className="space-y-4 text-slate-600 dark:text-slate-300 text-[15px] leading-relaxed pb-4">
                   <div>
                     <h4 className="font-semibold text-slate-800 dark:text-white text-[16px] mb-1">Qanday ishlaydi?</h4>
                     <p>Ilova sizga maqsadlaringizni yaratish va boshqarish imkonini beradi. Har safar Telegram bot orqali pul o'tkazsangiz, u avtomatik ravishda tanlangan maqsadingizga qo'shiladi.</p>
                   </div>
                   <div>
                     <h4 className="font-semibold text-slate-800 dark:text-white text-[16px] mb-1">Telegram Bot</h4>
                     <p>Bot sizning yordamchingizdir. Unga "50000 noutbuk" deb yozsangiz, tushunadi. Agar aniq maqsad deb topmasa, eng yaxshi mos keladiganini so'raydi.</p>
                   </div>
                   <div>
                     <h4 className="font-semibold text-slate-800 dark:text-white text-[16px] mb-1">Valyutalar</h4>
                     <p>Siz 4 xil valyutadan foydalanishingiz mumkin. Kiritilgan ma'lumotlar avtomatik hisoblab boriladi.</p>
                   </div>
                </div>
                
                <button onClick={() => setShowHelpModal(false)} className="w-full bg-slate-800 dark:bg-slate-700 text-white font-semibold py-3.5 rounded-2xl active:scale-95 transition-transform">
                   Tushunarli
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  );
}

function SettingsRow({ icon: Icon, iconBg, iconColor, label, value, isLast = false, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex items-center justify-between py-3 px-4 bg-transparent active:bg-white/50 dark:active:bg-slate-700/50 transition-colors cursor-pointer relative`}>
      <div className="flex items-center gap-3.5 z-10">
        <div className={`w-[30px] h-[30px] rounded-[7px] flex items-center justify-center shrink-0 ${iconBg} shadow-sm`}>
           <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
        </div>
        <span className="font-semibold text-slate-800 dark:text-white text-[16px] tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-2 z-10">
        {value && <span className="text-[15px] font-medium text-slate-500 dark:text-slate-400">{value}</span>}
        <ChevronRight className="w-[18px] h-[18px] text-slate-300 dark:text-slate-500" />
      </div>
      {!isLast && <div className="absolute bottom-0 left-[60px] right-0 h-[1px] bg-black/5 dark:bg-white/5" />}
    </div>
  )
}
