import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type Currency = 'UZS' | 'USD' | 'EUR' | 'RUB';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  syncCurrencySilent: (c: Currency) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (b: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  formatMoney: (amount: number) => string;
  currencySymbol: string;
}

const EX_RATES: Record<Currency, number> = {
  UZS: 1,
  USD: 12500,
  EUR: 13500,
  RUB: 140
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  UZS: 'UZS',
  USD: '$',
  EUR: '€',
  RUB: '₽'
};

const AppContext = createContext<AppContextType | null>(null);

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('app_theme') as Theme) || 'system');
  const [currency, setCurrencyState] = useState<Currency>(() => (localStorage.getItem('app_currency') as Currency) || 'UZS');
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_notifications');
    return saved !== null ? saved === 'true' : true;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('app_theme', t);
  };

  const setCurrencyAndSave = async (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('app_currency', c);
    
    const token = localStorage.getItem('app_token');
    if (token) {
      try {
        await fetch("/api/user/profile", {
           method: "PUT",
           headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
           body: JSON.stringify({ preferredCurrency: c })
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const syncCurrencySilent = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('app_currency', c);
  };

  const setNotificationsEnabled = async (b: boolean) => {
    if (b) {
      if ('Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') {
             b = false;
          }
        } else if (Notification.permission === 'denied') {
          b = false;
        }
      } else {
        b = false; // Not supported
      }
    }
    setNotificationsEnabledState(b);
    localStorage.setItem('app_notifications', b ? 'true' : 'false');
  };

  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = () => {
      root.classList.remove('light', 'dark');
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') applyTheme();
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', force = false) => {
    import('../utils/haptics').then(m => m.triggerNotification(type === 'info' ? 'warning' : type));
    if (!notificationsEnabled && !force) return;
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (notificationsEnabled || force) {
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
           new Notification('Smart Jamg\'arma', { body: message });
        } catch (e) {
           // iOS safari might require service worker for notifications, wrap in try-catch
        }
      }
    }

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const formatMoney = (amount: number) => {
    const rate = EX_RATES[currency];
    const converted = amount / rate;
    
    // We only want decimals if it's not UZS and has decimals
    const hasDecimals = currency !== 'UZS' && converted % 1 !== 0;
    
    return new Intl.NumberFormat('uz-UZ', {
       minimumFractionDigits: hasDecimals ? 2 : 0,
       maximumFractionDigits: hasDecimals ? 2 : 0
    }).format(converted);
  };

  return (
    <AppContext.Provider value={{
      theme, setTheme,
      currency, setCurrency: setCurrencyAndSave,
      syncCurrencySilent,
      notificationsEnabled, setNotificationsEnabled,
      showToast, formatMoney,
      currencySymbol: CURRENCY_SYMBOLS[currency]
    }}>
      {children}

      <div className="fixed top-safe pt-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:bg-slate-800/90 dark:border-slate-700/50 rounded-2xl p-3 pr-4 flex items-center gap-3 pointer-events-auto max-w-sm w-full"
            >
              <div className={`shrink-0 rounded-full p-1.5 ${
                toast.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                toast.type === 'error' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
              }`}>
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {toast.type === 'error' && <XCircle className="w-5 h-5" />}
                {toast.type === 'info' && <Info className="w-5 h-5" />}
              </div>
              <p className="flex-1 text-[14px] font-medium text-slate-800 dark:text-slate-200">
                {toast.message}
              </p>
              <button 
                onClick={() => setToasts(t => t.filter(x => x.id !== toast.id))}
                className="shrink-0 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:bg-slate-100 dark:active:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
