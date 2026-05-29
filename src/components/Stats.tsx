import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Goal, Transaction } from "../types";
import { PieChart as PieChartIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useTranslation } from "../i18n";
import { useAppContext } from "../contexts/AppContext";

interface StatsProps {
  goals: Goal[];
  transactions: Transaction[];
}

export default function Stats({ goals, transactions }: StatsProps) {
  const { t } = useTranslation();
  const { formatMoney, currencySymbol } = useAppContext();

  const chartData = goals.map(g => ({
    name: g.title,
    value: g.currentAmount,
    color: g.color || "#" + Math.floor(Math.random()*16777215).toString(16)
  })).filter(g => g.value > 0);

  const monthlyData = useMemo(() => {
    if (!transactions) return [];
    
    // Simple bar chart mapping (e.g. per day or per month based on last 7 items)
    const dataByDate: Record<string, number> = {};
    transactions.forEach(t => {
      const d = new Date(t.createdAt);
      const dateStr = d.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' });
      dataByDate[dateStr] = (dataByDate[dateStr] || 0) + t.amount;
    });

    return Object.keys(dataByDate).map(date => ({
      date,
      amount: dataByDate[date]
    })).reverse().slice(-7); // Last 7 active days
  }, [transactions]);


  if (goals.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-8 rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 text-center shadow-sm transition-colors">
        <PieChartIcon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">{t("stats.noGoals")}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-8 rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 text-center shadow-sm transition-colors">
        <PieChartIcon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">{t("stats.noFunds")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-slate-800 dark:text-white text-[26px] tracking-tight">{t("stats.distribution")}</h2>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-[1.25rem] shadow-sm border border-white/60 dark:border-slate-700/50 flex flex-col items-center relative overflow-hidden transition-colors"
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50/50 dark:from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="h-[250px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                stroke="none"
                cornerRadius={6}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${formatMoney(value)} ${currencySymbol}`, t("stats.funds")]} 
                contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', padding: '12px', background: 'rgba(255,255,255,0.95)' }}
                itemStyle={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}
              />
              <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500, color: '#6e6e73' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {monthlyData.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl p-5 rounded-[1.25rem] shadow-sm border border-white/60 dark:border-slate-700/50 transition-colors"
        >
          <h3 className="font-display font-semibold text-slate-800 dark:text-white text-[17px] tracking-tight mb-4">{t("stats.savings7days")}</h3>
          <div className="h-[220px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5ea" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8e8e93' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8e8e93' }} tickFormatter={(val) => `${formatMoney(val)}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  formatter={(value: number) => [`${formatMoney(value)} ${currencySymbol}`, t("stats.saved")]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.95)' }}
                  itemStyle={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}
                />
                <Bar dataKey="amount" fill="#007AFF" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl rounded-[1.25rem] shadow-sm border border-white/60 dark:border-slate-700/50 mb-6 overflow-hidden transition-colors"
      >
        <div className="p-4 border-b border-black/5 dark:border-white/5">
           <h3 className="font-display font-semibold text-slate-800 dark:text-white text-[17px] tracking-tight">{t("stats.funds")}</h3>
        </div>
        <div className="flex flex-col">
          {chartData.map((d, i) => (
             <div key={i} className={`flex justify-between items-center py-3.5 px-4 bg-transparent relative ${i !== chartData.length - 1 ? 'border-b border-black/5 dark:border-white/5' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-[14px] h-[14px] rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-800 dark:text-white font-semibold text-[16px]">{d.name}</span>
                </div>
                <span className="font-display text-[16px] text-slate-500 dark:text-slate-400 font-medium">{formatMoney(d.value)} <span className="text-[12px] uppercase">{currencySymbol}</span></span>
             </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
