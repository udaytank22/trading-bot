import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchInquiries } from '../services/n8nService';
import { fetchProfitData } from '../services/sheetsService';
import { formatINR, formatDateString } from '../services/marginEngine';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { inquiriesData, setInquiriesData } = useContext(AppContext);
  
  const [inquiries, setInquiries] = useState([]);
  const [profitData, setProfitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [inqRes, profRes] = await Promise.all([
        fetchInquiries(),
        fetchProfitData()
      ]);
      setInquiries(inqRes || []);
      setInquiriesData(inqRes || []); // Keep context in sync if other pages use it
      setProfitData(profRes || { closedDeals: [], weeklyTrend: [] });
    } catch (err) {
      setError("Could not connect to bot. Showing last known data.");
      try {
        const mockInq = await import('../data/mockInquiries');
        const mockProf = await import('../data/mockProfit');
        setInquiries(mockInq.mockInquiries || []);
        setInquiriesData(mockInq.mockInquiries || []);
        setProfitData({
          closedDeals: mockProf.closedDeals || [],
          weeklyTrend: mockProf.weeklyTrend || []
        });
      } catch (fallbackErr) {
        console.error("Fallback failed", fallbackErr);
      }
    } finally {
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const { todayCount, pendingCount, quotesSentCount, profitToday } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let today = 0, pending = 0, quotes = 0;

    inquiries.forEach(inq => {
      if (inq.date_received && inq.date_received.startsWith(todayStr)) today++;
      if (['PENDING', 'RFQ_SENT'].includes(inq.status)) pending++;
      if (['QUOTE_SENT', 'CLOSED'].includes(inq.status)) quotes++;
    });

    let pToday = 0;
    if (profitData && profitData.closedDeals) {
      pToday = profitData.closedDeals
        .filter(deal => deal.date_closed && deal.date_closed.startsWith(todayStr))
        .reduce((sum, deal) => sum + deal.profit, 0);
    }

    return { todayCount: today, pendingCount: pending, quotesSentCount: quotes, profitToday: pToday };
  }, [inquiries, profitData]);

  const latestInquiries = useMemo(() => {
    return [...inquiries]
      .sort((a, b) => new Date(b.date_received).getTime() - new Date(a.date_received).getTime())
      .slice(0, 5);
  }, [inquiries]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': 
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-500">PENDING</span>;
      case 'RFQ_SENT': 
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-500">RFQ SENT</span>;
      case 'QUOTE_SENT': 
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-500/20 text-green-500">QUOTE SENT</span>;
      case 'CLOSED': 
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-500/20 text-gray-400">CLOSED</span>;
      default: 
        return null;
    }
  };

  const formatCurrency = formatINR;
  const formatDate = formatDateString;

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full pb-8">
        {/* Skeleton Header Area */}
        <div className="flex items-center justify-between mb-4 h-10">
          <div className="w-1/3 h-full rounded bg-[#242830] animate-[pulse_1.5s_ease-in-out_infinite]" style={{ opacity: 0.4 }}></div>
          <div className="w-32 h-full rounded bg-[#242830] animate-[pulse_1.5s_ease-in-out_infinite]" style={{ opacity: 0.4 }}></div>
        </div>
        
        {/* Skeleton Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-[#242830] border border-[#2a2d33] rounded-xl p-6 h-[118px] animate-[pulse_1.5s_ease-in-out_infinite]" style={{ opacity: 0.4 }}></div>
          ))}
        </div>
        
        <div className="text-right text-xs text-gray-500 mb-6 font-medium invisible">
          Last updated: 00:00
        </div>

        {/* Skeleton Lower Section */}
        <div className="flex gap-6 mt-2">
          <div className="w-[65%] bg-[#242830] border border-[#2a2d33] rounded-xl h-[300px] animate-[pulse_1.5s_ease-in-out_infinite]" style={{ opacity: 0.4 }}></div>
          <div className="w-[40%] bg-[#242830] border border-[#2a2d33] rounded-xl h-[300px] animate-[pulse_1.5s_ease-in-out_infinite]" style={{ opacity: 0.4 }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full pb-8">
      {/* Header Area with Refresh Button & Error */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          {error && (
            <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg border border-red-500/30 text-sm font-medium inline-block">
              {error}
            </div>
          )}
        </div>
        <button 
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#242830] hover:bg-[#2a2d33] border border-[#2a2d33] rounded-lg text-sm text-gray-300 font-medium transition-colors"
        >
          {isRefreshing ? (
            <svg className="animate-spin h-4 w-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          )}
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* ROW 1: Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-2">
        <div 
          onClick={() => navigate('/inquiries', { state: { filter: 'All', date: 'today' } })}
          className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 transition-all hover:bg-blue-500/20 hover:-translate-y-1 cursor-pointer shadow-lg active:scale-95"
        >
          <div className="text-[36px] font-bold text-blue-500 leading-none mb-2">{todayCount}</div>
          <div className="text-gray-400 text-sm font-semibold tracking-wide uppercase">Total Inquiries Today</div>
        </div>
        
        <div 
          onClick={() => navigate('/inquiries', { state: { filter: 'QUOTE_SENT_ONLY' } })}
          className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 transition-all hover:bg-green-500/20 hover:-translate-y-1 cursor-pointer shadow-lg active:scale-95"
        >
          <div className="text-[36px] font-bold text-green-500 leading-none mb-2">{quotesSentCount}</div>
          <div className="text-gray-400 text-sm font-semibold tracking-wide uppercase">Quotes Sent</div>
        </div>

        <div 
          onClick={() => navigate('/inquiries', { state: { filter: 'PENDING_REPLIES' } })}
          className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 transition-all hover:bg-amber-500/20 hover:-translate-y-1 cursor-pointer shadow-lg active:scale-95"
        >
          <div className="text-[36px] font-bold text-amber-500 leading-none mb-2">{pendingCount}</div>
          <div className="text-gray-400 text-sm font-semibold tracking-wide uppercase">Pending Replies</div>
        </div>

        <div 
          onClick={() => navigate('/profit')}
          className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 transition-all hover:bg-purple-500/20 hover:-translate-y-1 cursor-pointer shadow-lg active:scale-95"
        >
          <div className="text-[36px] font-bold text-[#a855f7] leading-none mb-1">{formatCurrency(profitToday)}</div>
          <div className="text-gray-400 text-[13px] font-medium tracking-wide">Total Profit Today</div>
        </div>
      </div>

      <div className="text-right text-xs text-gray-500 mb-6 font-medium">
        Last updated: {lastUpdated}
      </div>

      {/* ROW 2 */}
      <div className="flex gap-6 mt-2">
        {/* Left Column - 60% */}
        <div className="w-[65%] flex flex-col bg-[#1a1d23] border border-[#2a2d33] rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d33]">
            <h2 className="text-white text-[16px] font-bold tracking-wide">Recent Inquiries</h2>
            <button 
              onClick={() => navigate('/inquiries')}
              className="text-purple-400 text-[13px] font-bold hover:text-purple-300 transition-colors"
            >View All</button>
          </div>
          <div className="flex-1 w-full overflow-x-auto">
            {latestInquiries.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 h-[200px] text-gray-500">
                <span>No recent inquiries</span>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-300 whitespace-nowrap">
                <thead className="bg-[#242830]/50 text-gray-400 font-medium text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Inquiry ID</th>
                    <th className="px-6 py-3">Buyer</th>
                    <th className="px-6 py-3 w-1/3">Products</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2d33]/50">
                  {latestInquiries.map((inq, idx) => (
                    <tr key={inq.inquiry_id} className={`hover:bg-white/[0.03] transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#242830]/30'}`}>
                      <td className="px-6 py-4 font-mono text-purple-300 text-xs">{inq.inquiry_id}</td>
                      <td className="px-6 py-4 font-medium text-gray-200">{inq.buyer_name}</td>
                      <td className="px-6 py-4 truncate max-w-[200px]" title={inq.products?.map(p => p.product_name).join(', ')}>
                        {inq.products && inq.products.length > 0 ? (inq.products.length === 1 ? inq.products[0].product_name : `${inq.products[0].product_name} +${inq.products.length - 1} more`) : ''}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(inq.status)}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">{formatDate(inq.date_received)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column - 40% */}
        <div className="w-[40%] flex flex-col bg-[#1a1d23] border border-[#2a2d33] rounded-xl flex-shrink-0 p-6 shadow-lg">
          <h2 className="text-white text-[16px] font-bold tracking-wide mb-6">Profit This Week</h2>
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitData?.weeklyTrend || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickMargin={12} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(val) => `₹${val/1000}k`} tickMargin={8} />
                <Tooltip 
                  cursor={{fill: '#2a2d33'}}
                  contentStyle={{ backgroundColor: '#0f1117', borderColor: '#2a2d33', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  itemStyle={{ color: '#a855f7', fontWeight: 'bold' }}
                  labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                  formatter={(value) => [formatCurrency(value), 'Profit']}
                />
                <Bar dataKey="profit" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
