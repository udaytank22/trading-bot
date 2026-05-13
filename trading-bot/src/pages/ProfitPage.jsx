import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchProfitData } from '../services/sheetsService';
import { formatINR } from '../services/marginEngine';

/* ── Summary card ────────────────────────────────────────────────── */
function SummaryCard({ value, label, colorClass }) {
  return (
    <div className={`${colorClass} rounded-[2rem] p-8 hover:brightness-110 transition-all cursor-default shadow-lg`}>
      <div className="text-[32px] font-black leading-none mb-3 tracking-tighter">{value}</div>
      <div className="text-gray-500 dark:text-gray-400 text-[11px] font-black tracking-[0.1em] uppercase opacity-80">{label}</div>
    </div>
  );
}

export default function ProfitPage() {
  const [closedDeals, setClosedDeals] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfitData()
      .then(res => {
        if (res) {
          setClosedDeals(res.closedDeals ?? []);
          setWeeklyTrend(res.weeklyTrend ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const { totalRevenue, totalCost, totalProfit, marginPercent } = useMemo(() => {
    const rev = closedDeals.reduce((s, d) => s + d.my_price, 0);
    const cost = closedDeals.reduce((s, d) => s + d.seller_cost, 0);
    const profit = rev - cost;
    return { totalRevenue: rev, totalCost: cost, totalProfit: profit, marginPercent: rev > 0 ? (profit / rev) * 100 : 0 };
  }, [closedDeals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full pb-8 gap-6 animate-in fade-in duration-700">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard 
          value={formatINR(totalRevenue)} 
          label="Total Revenue" 
          colorClass="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-500" 
        />
        <SummaryCard 
          value={formatINR(totalCost)} 
          label="Seller Cost" 
          colorClass="bg-gradient-to-br from-rose-500/10 to-orange-500/10 border border-rose-500/20 text-rose-500" 
        />
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 shadow-2xl shadow-purple-500/20 group relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex items-end justify-between mb-2">
              <div className="text-[32px] font-black text-white tracking-tighter leading-none">{formatINR(totalProfit)}</div>
              <div className="text-white text-[11px] font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-[0.1em] backdrop-blur-md">
                +{marginPercent.toFixed(1)}% Margin
              </div>
            </div>
            <div className="text-white/70 text-xs font-bold tracking-[0.15em] uppercase">Net Profit Realized</div>
          </div>
        </div>
      </div>

      {/* Weekly trend chart */}
      <section className="bg-white dark:bg-[#161922] border border-gray-200 dark:border-white/10 rounded-[2.5rem] shadow-xl p-8 flex-shrink-0 transition-all duration-300">
        <h2 className="text-gray-900 dark:text-white text-lg font-black tracking-tight mb-8">Weekly Profit Trend</h2>
        <div className="w-full h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 700 }} tickMargin={16} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 700 }} tickFormatter={v => `₹${v / 1000}k`} tickMargin={12} />
              <Tooltip
                cursor={{ fill: '#f3f4f6', opacity: 0.1 }}
                contentStyle={{
                  backgroundColor: '#161922',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  color: '#fff',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  padding: '12px'
                }}
                itemStyle={{ color: '#a855f7', fontWeight: '900' }}
                labelStyle={{ color: '#9ca3af', marginBottom: '8px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                formatter={v => [formatINR(v), 'Profit']}
              />
              <Bar dataKey="profit" fill="#a855f7" radius={[12, 12, 0, 0]} barSize={64} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
