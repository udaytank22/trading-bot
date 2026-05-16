import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { fetchProfitData } from '../services/sheetsService';
import { formatINR } from '../services/marginEngine';

/* ── Summary card ─────────────────────────────────────────────────── */
function SummaryCard({ value, label, colorClass, icon }) {
  return (
    <div className={`${colorClass} rounded-xl p-4 hover:brightness-110 transition-all cursor-default shadow-sm flex items-center gap-3`}>
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-lg">{icon}</div>
      <div>
        <div className="text-[18px] font-black leading-none mb-1 tracking-tighter">{value}</div>
        <div className="text-[10px] font-black tracking-[0.1em] uppercase opacity-75">{label}</div>
      </div>
    </div>
  );
}

/* ── Custom Tooltip ───────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl px-4 py-3 min-w-[140px]">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[16px] font-black text-purple-500">{formatINR(payload[0].value)}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">Net Profit</p>
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
    const rev  = closedDeals.reduce((s, d) => s + d.my_price, 0);
    const cost = closedDeals.reduce((s, d) => s + d.seller_cost, 0);
    const profit = rev - cost;
    return {
      totalRevenue: rev,
      totalCost: cost,
      totalProfit: profit,
      marginPercent: rev > 0 ? (profit / rev) * 100 : 0,
    };
  }, [closedDeals]);

  const maxProfit = useMemo(
    () => Math.max(...weeklyTrend.map(d => d.profit ?? 0), 1),
    [weeklyTrend]
  );

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
    <div className="flex flex-col w-full h-full pb-4 gap-4 animate-in fade-in duration-700">

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryCard
          value={formatINR(totalRevenue)}
          label="Total Revenue"
          icon="📈"
          colorClass="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
        />
        <SummaryCard
          value={formatINR(totalCost)}
          label="Seller Cost"
          icon="🧾"
          colorClass="bg-gradient-to-br from-rose-500/10 to-orange-500/10 border border-rose-500/20 text-rose-500"
        />
        {/* Net Profit card */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-4 shadow-lg shadow-purple-500/20 group relative overflow-hidden flex items-center gap-3">
          <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-lg relative z-10">💰</div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="text-[18px] font-black text-white tracking-tighter leading-none">{formatINR(totalProfit)}</div>
              <div className="text-white text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-[0.1em] backdrop-blur-md">
                +{marginPercent.toFixed(1)}%
              </div>
            </div>
            <div className="text-white/70 text-[10px] font-bold tracking-[0.15em] uppercase">Net Profit Realized</div>
          </div>
        </div>
      </div>

      {/* ── Weekly Trend Chart ── */}
      <section className="bg-white dark:bg-[#161922] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm p-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-gray-900 dark:text-white text-[14px] font-black tracking-tight">Weekly Profit Trend</h2>
            <p className="text-gray-400 text-[11px] font-medium mt-0.5">Daily net profit this week</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-purple-500 text-[11px] font-bold tracking-wide">Net Profit</span>
          </div>
        </div>

        {weeklyTrend.length === 0 ? (
          <div className="h-[240px] flex flex-col items-center justify-center gap-2 text-gray-400 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl">
            <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium">No trend data available</p>
          </div>
        ) : (
          <div className="w-full h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="35%">
                <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.06} strokeDasharray="4 4" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 700 }}
                  tickMargin={12}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 700 }}
                  tickFormatter={v => `₹${v / 1000}k`}
                  tickMargin={8}
                  width={52}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(168,85,247,0.06)' }} />
                <Bar dataKey="profit" radius={[8, 8, 0, 0]} maxBarSize={56}>
                  {weeklyTrend.map((entry, i) => (
                    <Cell
                      key={i}
                      fill="#a855f7"
                      fillOpacity={0.35 + ((entry.profit ?? 0) / maxProfit) * 0.65}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* ── Closed Deals Table ── */}
      {closedDeals.length > 0 && (
        <section className="bg-white dark:bg-[#161922] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between flex-shrink-0">
            <h2 className="text-gray-900 dark:text-white text-[13px] font-black tracking-tight">Closed Deals</h2>
            <span className="text-[11px] text-gray-400 font-bold">{closedDeals.length} records</span>
          </div>
          <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-white/[0.03] text-gray-400 text-[10px] font-black uppercase tracking-widest sticky top-0">
                <tr>
                  {['Deal ID', 'Buyer', 'Revenue', 'Cost', 'Profit', 'Margin'].map(h => (
                    <th key={h} className="px-4 py-2.5 border-b border-gray-100 dark:border-white/10 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {closedDeals.map((d, i) => {
                  const profit = d.my_price - d.seller_cost;
                  const margin = d.my_price > 0 ? (profit / d.my_price * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-2.5 font-mono text-purple-500 dark:text-purple-400 text-[11px] font-bold">{d.inquiry_id || `#${i + 1}`}</td>
                      <td className="px-4 py-2.5 text-gray-900 dark:text-white font-medium">{d.buyer_name || '—'}</td>
                      <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400 font-bold">{formatINR(d.my_price)}</td>
                      <td className="px-4 py-2.5 text-rose-500 font-bold">{formatINR(d.seller_cost)}</td>
                      <td className="px-4 py-2.5 text-purple-600 dark:text-purple-400 font-black">{formatINR(profit)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          parseFloat(margin) >= 20
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
