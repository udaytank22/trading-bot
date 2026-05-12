import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchProfitData } from '../services/sheetsService';
import { formatINR, formatDateString } from '../services/marginEngine';

/* ── Summary card ────────────────────────────────────────────────── */
function SummaryCard({ value, label, colorClass }) {
  return (
    <div className={`${colorClass} rounded-xl p-6 hover:brightness-110 transition-all cursor-default`}>
      <div className="text-[25px] font-bold leading-none mb-2">{value}</div>
      <div className="text-gray-500 dark:text-gray-400 text-[13px] font-bold tracking-wide uppercase">{label}</div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
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

  const sortedDeals = useMemo(() =>
    [...closedDeals].sort((a, b) => new Date(b.date_closed) - new Date(a.date_closed)),
    [closedDeals]);

  const handleExportCSV = () => {
    const headers = ['Inquiry ID', 'Buyer', 'Products', 'Seller Cost', 'My Price', 'Margin %', 'Profit', 'Date'];
    const rows = sortedDeals.map(d => [
      d.inquiry_id, `"${d.buyer_name}"`, `"${d.products}"`,
      d.seller_cost, d.my_price, d.margin_percent, d.profit,
      new Date(d.date_closed).toISOString().split('T')[0],
    ]);
    rows.push(['TOTAL', '', '', totalCost, totalRevenue, marginPercent.toFixed(1), totalProfit, '']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'profit_report.csv' });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
    <div className="flex flex-col w-full h-full pb-8 gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-5">
        <SummaryCard value={formatINR(totalRevenue)} label="Total Revenue This Month" colorClass="bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e]" />
        <SummaryCard value={formatINR(totalCost)} label="Total Seller Cost This Month" colorClass="bg-red-500/10 border border-red-500/20 text-red-500" />
        <div className="bg-[#a855f7]/10 border border-[#a855f7]/20 rounded-xl p-6 hover:brightness-110 transition-all cursor-default">
          <div className="flex items-end gap-3 mb-2">
            <div className="text-[30px] font-bold text-[#a855f7] leading-none">{formatINR(totalProfit)}</div>
            <div className="text-emerald-600 dark:text-emerald-400 text-[13px] font-bold pb-[3px] bg-emerald-500/10 px-2 rounded tracking-wide">
              +{marginPercent.toFixed(1)}% margin
            </div>
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-[13px] font-bold tracking-wide uppercase">Net Profit This Month</div>
        </div>
      </div>

      {/* Weekly trend chart */}
      <section className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-lg p-6 flex-shrink-0 transition-colors duration-300">
        <h2 className="text-gray-900 dark:text-white text-[16px] font-bold tracking-wide mb-6">Weekly Profit Trend</h2>
        <div className="w-full h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 500 }} tickMargin={12} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 500 }} tickFormatter={v => `₹${v / 1000}k`} tickMargin={8} />
              <Tooltip
                cursor={{ fill: '#f3f4f6', opacity: 0.1 }}
                contentStyle={{
                  backgroundColor: 'white',
                  borderColor: '#e5e7eb',
                  borderRadius: '8px',
                  color: '#111827',
                  fontSize: '13px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ color: '#a855f7', fontWeight: 'bold' }}
                labelStyle={{ color: '#6b7280', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}
                formatter={v => [formatINR(v), 'Profit']}
              />
              <Bar dataKey="profit" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Closed deals table */}
      <section className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl flex flex-col overflow-hidden shadow-lg flex-1 transition-colors duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2d33]">
          <h2 className="text-gray-900 dark:text-white text-[16px] font-bold tracking-wide">Closed Deals</h2>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-[13px] font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#3a3d43] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white transition-all active:scale-[0.98] flex-shrink-0 whitespace-nowrap"
          >
            Export CSV
          </button>
        </div>
        <div className="w-full overflow-x-auto min-w-0">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
            <thead className="bg-gray-50 dark:bg-[#242830]/80 text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200 dark:border-[#2a2d33]">
              <tr>
                <th className="px-6 py-4">Inquiry ID</th>
                <th className="px-6 py-4">Buyer</th>
                <th className="px-6 py-4">Products</th>
                <th className="px-6 py-4 text-right">Seller Cost</th>
                <th className="px-6 py-4 text-right">My Price</th>
                <th className="px-6 py-4 text-center">Margin %</th>
                <th className="px-6 py-4 text-right">Profit</th>
                <th className="px-6 py-4 pl-8">Date</th>
              </tr>
            </thead>
            {sortedDeals.length === 0 ? (
              <tbody>
                <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">No closed deals yet.</td></tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2d33]/50">
                {sortedDeals.map((deal, idx) => (
                  <tr key={deal.inquiry_id} className={`h-[56px] hover:bg-gray-50/80 dark:hover:bg-white/[0.04] transition-colors ${idx % 2 !== 0 ? 'bg-gray-50/30 dark:bg-[#242830]/20' : ''}`}>
                    <td className="px-6 font-mono text-gray-500 dark:text-gray-400 text-[13px]">{deal.inquiry_id}</td>
                    <td className="px-6 text-gray-900 dark:text-white font-semibold">{deal.buyer_name}</td>
                    <td className="px-6 text-gray-600 dark:text-gray-300 font-medium truncate max-w-[200px]" title={deal.products}>{deal.products}</td>
                    <td className="px-6 text-right font-mono text-gray-500 dark:text-gray-400">{formatINR(deal.seller_cost)}</td>
                    <td className="px-6 text-right font-mono text-gray-900 dark:text-white font-semibold">{formatINR(deal.my_price)}</td>
                    <td className="px-6 text-center font-mono text-gray-500 dark:text-gray-400 font-bold">{(deal.margin_percent ?? 0).toFixed(1)}%</td>
                    <td className="px-6 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formatINR(deal.profit)}</td>
                    <td className="px-6 pl-8 text-gray-400 dark:text-gray-500 text-[13px]">{formatDateString(deal.date_closed)}</td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-gray-50 dark:bg-[#0f1117]/80 hover:bg-gray-100 dark:hover:bg-[#0f1117] transition-colors">
                  <td colSpan="3" className="px-6 py-5 text-right font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[12px]">Totals</td>
                  <td className="px-6 py-5 text-right font-mono font-bold text-gray-600 dark:text-gray-300">{formatINR(totalCost)}</td>
                  <td className="px-6 py-5 text-right font-mono font-bold text-gray-900 dark:text-white">{formatINR(totalRevenue)}</td>
                  <td className="px-6 py-5 text-center font-mono font-bold text-gray-500 dark:text-gray-400">{marginPercent.toFixed(1)}%</td>
                  <td className="px-6 py-5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[15px]">{formatINR(totalProfit)}</td>
                  <td className="px-6 py-5" />
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
