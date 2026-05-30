import React, { useState } from "react";
import { useTranslation } from "../i18n";
import { useAppContext } from "../contexts/AppContext";
import { triggerHaptic } from "../utils/haptics";
import { Plus, X, Loader2 } from "lucide-react";

interface AddGoalProps {
  token: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddGoal({ token, onSuccess, onCancel }: AddGoalProps) {
  const { t } = useTranslation();
  const { showToast } = useAppContext();
  
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !targetAmount.trim() || !token) return;
    triggerHaptic('heavy');
    setSaving(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          targetAmount: parseFloat(targetAmount),
          deadline: deadline || undefined,
          color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
        })
      });
      if (!res.ok) throw new Error("Tarmoq xatosi");
      
      showToast(t("home.addSuccess"), "success");
      onSuccess();
    } catch(err) {
      showToast("Xatolik yuz berdi", "error");
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl p-5 rounded-[1.5rem] shadow-sm border border-white/60 dark:border-slate-700/50 my-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white tracking-tight">{t("home.newCategory")}</h3>
        <button onClick={() => { triggerHaptic('light'); onCancel(); }} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500">
           <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5 block">{t("home.name")}</label>
          <input 
            type="text" 
            placeholder={t("home.namePlaceholder")} 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            className="w-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border border-white/80 dark:border-slate-700/50 shadow-sm rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 font-medium text-slate-800 dark:text-white" 
          />
        </div>
        <div>
          <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5 block">{t("home.amount")}</label>
          <input 
            type="number" 
            placeholder="0" 
            value={targetAmount} 
            onChange={e => setTargetAmount(e.target.value)} 
            className="w-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border border-white/80 dark:border-slate-700/50 shadow-sm rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 font-medium text-slate-800 dark:text-white" 
          />
        </div>
        <div>
          <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5 block">{t?.("home.deadline") || "Muddat"}</label>
          <input 
            type="date" 
            value={deadline} 
            onChange={e => setDeadline(e.target.value)} 
            className="w-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border border-white/80 dark:border-slate-700/50 shadow-sm rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 font-medium text-slate-800 dark:text-white" 
          />
        </div>

        <button 
          onClick={handleSubmit}
          disabled={!title.trim() || !targetAmount.trim() || saving}
          className="w-full py-3.5 mt-2 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:active:bg-indigo-500 flex justify-center items-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          {t("home.save")}
        </button>
      </div>
    </div>
  );
}
