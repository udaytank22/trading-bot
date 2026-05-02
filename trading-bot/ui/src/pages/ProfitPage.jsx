import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchProfitData } from '../services/sheetsService';
import { formatINR, formatDateString } from '../services/marginEngine';

export default function ProfitPage() {
  const [closedDeals, setClosedDeals] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetchProfitData();
      if (res) {
        setClosedDeals(res.closedDeals || []);
        setWeeklyTrend(res.weeklyTrend || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const formatCurrency = formatINR;
  const formatDate = formatDateString;

  const { totalRevenue, totalCost, totalProfit, marginPercent } = useMemo(() => {
    let rev = 0, cost = 0;
    closedDeals.forEach(deal => {
      rev += deal.my_price;
      cost += deal.seller_cost;
    });
    const profit = rev - cost;
    const margin = rev > 0 ? ((profit / rev) * 100) : 0;
    return { totalRevenue: rev, totalCost: cost, totalProfit: profit, marginPercent: margin };
  }, [closedDeals]);

  const sortedDeals = useMemo(() => {
    return [...closedDeals].sort((a, b) => new Date(b.date_closed).getTime() - new Date(a.date_closed).getTime());
  }, [closedDeals]);

  const handleExportCSV = () => {
    const headers = ['Inquiry ID', 'Buyer', 'Products', 'Seller Cost', 'My Price', 'Margin %', 'Profit', 'Date'];
    const rows = sortedDeals.map(d => [
      d.inquiry_id,
      `"${d.buyer_name}"`,
      `"${d.products}"`,
      d.seller_cost,
      d.my_price,
      d.margin_percent,
      d.profit,
      new Date(d.date_closed).toISOString().split('T')[0]
    ]);
    
    // Add total row at the very bottom of the CSV logically
    rows.push(['TOTAL', '', '', totalCost, totalRevenue, marginPercent.toFixed(1), totalProfit, '']);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'profit_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full pb-8">
      {/* TOP ROW */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {/* Card 1: Revenue */}
        <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl p-6 transition-colors hover:bg-[#22c55e]/20 cursor-default">
          <div className="text-[36px] font-bold text-[#22c55e] leading-none mb-2">{formatCurrency(totalRevenue)}</div>
          <div className="text-gray-400 text-[13px] font-bold tracking-wide uppercase">Total Revenue This Month</div>
        </div>
        {/* Card 2: Cost */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 transition-colors hover:bg-red-500/20 cursor-default">
          <div className="text-[36px] font-bold text-red-500 leading-none mb-2">{formatCurrency(totalCost)}</div>
          <div className="text-gray-400 text-[13px] font-bold tracking-wide uppercase">Total Seller Cost This Month</div>
        </div>
        {/* Card 3: Net Profit */}
        <div className="bg-[#a855f7]/10 border border-[#a855f7]/20 rounded-xl p-6 transition-colors hover:bg-[#a855f7]/20 cursor-default flex flex-col justify-center">
          <div className="flex items-end gap-3 mb-2">
            <div className="text-[36px] font-bold text-[#a855f7] leading-none tracking-tight">{formatCurrency(totalProfit)}</div>
            <div className="text-emerald-400 text-[13px] font-bold pb-[3px] bg-emerald-500/10 px-2 rounded tracking-wide">+{marginPercent.toFixed(1)}% margin</div>
          </div>
          <div className="text-gray-400 text-[13px] font-bold tracking-wide uppercase">Net Profit This Month</div>
        </div>
      </div>

      {/* MIDDLE SECTION - Chart */}
      <div className="bg-[#1a1d23] border border-[#2a2d33] rounded-xl mb-6 shadow-lg p-6 flex-shrink-0">
        <h2 className="text-white text-[16px] font-bold tracking-wide mb-6">Weekly Profit Trend</h2>
        <div className="w-full h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 500 }} tickMargin={12} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 500 }} tickFormatter={(val) => `₹${val/1000}k`} tickMargin={8} />
              <Tooltip 
                cursor={{fill: '#2a2d33'}}
                contentStyle={{ backgroundColor: '#0f1117', borderColor: '#2a2d33', borderRadius: '8px', color: '#fff', fontSize: '13px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                itemStyle={{ color: '#a855f7', fontWeight: 'bold' }}
                labelStyle={{ color: '#9ca3af', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}
                formatter={(value) => [formatCurrency(value), 'Profit']}
              />
              <Bar dataKey="profit" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BOTTOM SECTION - Table */}
      <div className="bg-[#1a1d23] border border-[#2a2d33] rounded-xl flex flex-col overflow-hidden shadow-lg flex-1">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#2a2d33]">
          <h2 className="text-white text-[16px] font-bold tracking-wide">Closed Deals</h2>
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 text-[13px] font-bold text-gray-300 border border-[#3a3d43] rounded-lg hover:bg-white/[0.05] hover:text-white transition-all shadow-sm active:scale-[0.98]"
          >
            Export CSV
          </button>
        </div>
        <div className="w-full overflow-x-auto min-w-0">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
            <thead className="bg-[#242830]/80 text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-[#2a2d33]">
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
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No closed deals yet.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-[#2a2d33]/50">
                {sortedDeals.map((deal, idx) => (
                  <tr key={deal.inquiry_id} className={`h-[56px] hover:bg-white/[0.04] transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#242830]/20'}`}>
                    <td className="px-6 font-mono text-gray-400 text-[13px]">{deal.inquiry_id}</td>
                    <td className="px-6 text-white font-semibold">{deal.buyer_name}</td>
                    <td className="px-6 text-gray-300 font-medium truncate max-w-[200px]" title={deal.products}>{deal.products}</td>
                    <td className="px-6 text-right font-mono text-gray-400 font-medium">{formatCurrency(deal.seller_cost)}</td>
                    <td className="px-6 text-right font-mono text-white font-semibold">{formatCurrency(deal.my_price)}</td>
                    <td className="px-6 text-center font-mono text-gray-400 font-bold">{deal.margin_percent?.toFixed(1) || 0}%</td>
                    <td className="px-6 text-right font-mono text-emerald-400 font-bold tracking-wide">{formatCurrency(deal.profit)}</td>
                    <td className="px-6 pl-8 text-gray-500 text-[13px] font-medium">{formatDate(deal.date_closed)}</td>
                  </tr>
                ))}
                {/* TOTALS ROW */}
                <tr className="bg-[#0f1117]/80 hover:bg-[#0f1117] transition-colors">
                  <td colSpan="3" className="px-6 py-5 text-right font-bold text-gray-400 uppercase tracking-widest text-[12px]">Totals</td>
                  <td className="px-6 py-5 text-right font-mono font-bold text-gray-300">{formatCurrency(totalCost)}</td>
                  <td className="px-6 py-5 text-right font-mono font-bold text-white">{formatCurrency(totalRevenue)}</td>
                  <td className="px-6 py-5 text-center font-mono font-bold text-gray-400">{marginPercent.toFixed(1)}%</td>
                  <td className="px-6 py-5 text-right font-mono font-bold text-emerald-400 text-[15px]">{formatCurrency(totalProfit)}</td>
                  <td className="px-6 py-5"></td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
