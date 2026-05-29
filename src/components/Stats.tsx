import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Goal } from "../types";

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
      <div className="flex items-center justify-center py-20 text-slate-500 text-sm animate-in fade-in">
        Hozircha maqsadlar yo'q
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 text-sm animate-in fade-in">
        Maqsadlarga hali pul ajratilmagan
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="font-bold text-slate-800 text-lg">Tejashlar Taqsimoti</h2>
      
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString()} UZS`, 'Mablag\'']} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 text-sm mb-3">Statistika</h3>
        <div className="space-y-3">
          {chartData.map((d, i) => (
             <div key={i} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-600 font-medium">{d.name}</span>
                </div>
                <span className="font-bold text-slate-800">{d.value.toLocaleString()} UZS</span>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
