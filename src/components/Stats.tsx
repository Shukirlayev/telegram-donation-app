import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Goal, Transaction } from "../types";
import { PieChart as PieChartIcon } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";

interface StatsProps {
  goals: Goal[];
  transactions: Transaction[];
}

export default function Stats({ goals, transactions }: StatsProps) {
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
      <div className="bg-white p-8 rounded-[1.5rem] border border-dashed border-slate-200 text-center shadow-sm">
        <PieChartIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium text-sm">Hozircha maqsadlar yo'q</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-8 rounded-[1.5rem] border border-dashed border-slate-200 text-center shadow-sm">
        <PieChartIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium text-sm">Maqsadlarga hali pul ajratilmagan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-semibold text-slate-800 text-lg tracking-tight">Taqsimot</h2>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-6 rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col items-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />
        <div className="h-[280px] w-full relative z-10">
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
                formatter={(value: number) => [`${value.toLocaleString()} UZS`, 'Mablag\'']} 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', padding: '12px' }}
                itemStyle={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 600 }}
              />
              <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {monthlyData.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100"
        >
          <h3 className="font-display font-semibold text-slate-800 text-base mb-4">Oxirgi 7 Kundagi Tejashlar</h3>
          <div className="h-[220px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  formatter={(value: number) => [`${value.toLocaleString()} UZS`, 'Tejaldi']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-5 rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 mb-6"
      >
        <h3 className="font-display font-semibold text-slate-800 text-base mb-4">Mablag'lar</h3>
        <div className="space-y-4">
          {chartData.map((d, i) => (
             <div key={i} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${d.color}20` }}>
                     <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  </div>
                  <span className="text-slate-700 font-medium">{d.name}</span>
                </div>
                <span className="font-display font-bold text-slate-800">{d.value.toLocaleString()} <span className="text-[10px] text-slate-400">UZS</span></span>
             </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
