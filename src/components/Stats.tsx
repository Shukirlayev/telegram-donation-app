import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Goal } from "../types";
import { PieChart as PieChartIcon } from "lucide-react";
import { motion } from "motion/react";

interface StatsProps {
  goals: Goal[];
}

export default function Stats({ goals }: StatsProps) {
  const chartData = goals.map(g => ({
    name: g.title,
    value: g.currentAmount,
    color: g.color || "#" + Math.floor(Math.random()*16777215).toString(16)
  })).filter(g => g.value > 0);

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

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-5 rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100"
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
