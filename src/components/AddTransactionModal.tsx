import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Hash } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAppContext } from '../contexts/AppContext';
import { Goal } from '../types';
import { triggerHaptic } from '../utils/haptics';
import confetti from 'canvas-confetti';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  token: string | null;
  onRefresh: () => void;
}

export default function AddTransactionModal({ isOpen, onClose, goal, token, onRefresh }: AddTransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  const { showToast, currency, currencySymbol } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !token || !amount) return;

    setIsSubmitting(true);
    triggerHaptic('light');

    try {
      const rate = currency === 'UZS' ? 1 : currency === 'USD' ? 12500 : currency === 'EUR' ? 13500 : 140;
      const numAmountBase = parseFloat(amount) * rate;

      if (numAmountBase <= 0) {
         showToast("Noto'g'ri summa", "error");
         setIsSubmitting(false);
         return;
      }

      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: numAmountBase,
          goalId: goal.id,
          type: "deposit"
        })
      });

      // Check if this makes it 100%
      if (goal.currentAmount + numAmountBase >= goal.targetAmount) {
         triggerHaptic('heavy');
         confetti({
           particleCount: 150,
           spread: 70,
           origin: { y: 0.6 },
           colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
         });
         showToast("Ajoyib! Maqsadga erishdingiz 🎉", "success");
      } else {
         showToast("Pul muvaffaqiyatli qo'shildi", "success");
      }

      setAmount('');
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Xatolik yuz berdi", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && goal && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed bottom-0 left-0 right-0 md:top-1/2 md:bottom-auto md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-white dark:bg-slate-900 rounded-t-[2rem] md:rounded-[2rem] p-6 z-[101] shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-display font-semibold text-slate-800 dark:text-white">Pul qo'shish</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{goal.title}</p>
              </div>
              <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full active:scale-95 transition-transform"><X className="w-5 h-5"/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[12px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-2 block">Summa ({currencySymbol})</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <Hash className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    required
                    autoFocus
                    placeholder="Masalan: 50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-lg font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors dark:text-white caret-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !amount}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? "Saqlanmoqda..." : <><Plus className="w-5 h-5" /> Qo'shish</>}
              </button>
            </form>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
