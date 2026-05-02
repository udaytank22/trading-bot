import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AppContext } from '../context';
import DealDrawer from '../components/DealDrawer';
import EmailPreviewModal from '../components/EmailPreviewModal';
import { fetchInquiries, triggerRFQ } from '../services/n8nService';
import { formatDateString } from '../services/marginEngine';

export default function InquiriesPage() {
  const location = useLocation();
  const { inquiriesData, setInquiriesData } = useContext(AppContext);

  const initialFilter = location.state?.filter || 'All';
  const initialDate = location.state?.date || 'all';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Data fetching and sync
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(new Date());
  const [now, setNow] = useState(new Date());

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const inqRes = await fetchInquiries();
      setInquiriesData(inqRes || []);
    } catch (err) {
      if (!isSilent) setError("Could not connect to bot. Showing last known data.");
      try {
        const mockInq = await import('../data/mockInquiries');
        setInquiriesData(mockInq.mockInquiries || []);
      } catch (fallbackErr) {
        console.error("Fallback failed", fallbackErr);
      }
    } finally {
      setLastSynced(new Date());
      setNow(new Date());
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const fetchInterval = setInterval(() => loadData(true), 3 * 60 * 1000); // Auto-refresh 3 min
    const timeInterval = setInterval(() => setNow(new Date()), 10000); // Update relative time every 10s
    return () => {
      clearInterval(fetchInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const getRelativeTime = () => {
    const diffMins = Math.floor((now - lastSynced) / 60000);
    if (diffMins < 1) return 'Just now';
    return `${diffMins} min ago`;
  };

  const filteredInquiries = useMemo(() => {
    return inquiriesData.filter(inq => {
      if (filter === 'QUOTE_SENT_ONLY') {
        if (inq.status !== 'QUOTE_SENT' && inq.status !== 'CLOSED') return false;
      } else if (filter === 'PENDING_REPLIES') {
        if (inq.status !== 'PENDING' && inq.status !== 'RFQ_SENT') return false;
      } else if (filter !== 'All' && inq.status !== filter) {
        return false;
      }

      if (initialDate === 'today' && location.state?.date === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (!inq.date_received.startsWith(todayStr)) return false;
      }
      
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesBuyer = inq.buyer_name.toLowerCase().includes(q) || inq.buyer_email.toLowerCase().includes(q);
        const matchesProduct = inq.products.some(p => p.product_name.toLowerCase().includes(q));
        if (!matchesBuyer && !matchesProduct) return false;
      }
      return true;
    });
  }, [inquiriesData, search, filter]);

  const totalItems = filteredInquiries.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInquiries.slice(start, start + itemsPerPage);
  }, [filteredInquiries, currentPage]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-500 border border-amber-500/20 tracking-wide uppercase">PENDING</span>;
      case 'RFQ_SENT': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/20 text-blue-500 border border-blue-500/20 tracking-wide uppercase">RFQ SENT</span>;
      case 'QUOTE_SENT': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-500/20 text-green-500 border border-green-500/20 tracking-wide uppercase">QUOTE SENT</span>;
      case 'CLOSED': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-500/20 tracking-wide uppercase">CLOSED</span>;
      default: 
        return null;
    }
  };

  const formatDateLines = (isoString) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    const dateStr = formatDateString(isoString);
    const timeStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
    return (
      <div className="flex flex-col">
        <span className="text-white font-bold leading-tight">{dateStr}</span>
        <span className="text-gray-500 text-xs mt-[1px]">{timeStr}</span>
      </div>
    );
  };

  const startShowing = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endShowing = Math.min(currentPage * itemsPerPage, totalItems);

  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Action states
  const [inlineActionRow, setInlineActionRow] = useState(null); // { id, type: 'PENDING_WARNING' | 'QUOTE_WARNING' }
  const [rowActionLoading, setRowActionLoading] = useState(false);
  const [emailModalDeal, setEmailModalDeal] = useState(null);
  const [emailModalType, setEmailModalType] = useState('RFQ');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Listen to custom event for toast
  useEffect(() => {
    const handleToast = (e) => {
      setToastMsg(e.detail);
      setTimeout(() => setToastMsg(null), 5000);
    };
    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const handleOpenDrawer = (deal) => {
    setSelectedDeal(deal);
    setIsDrawerOpen(true);
  };

  const updateDealStatus = (id, newStatus) => {
    setInquiriesData(prev => prev.map(inq => 
      inq.inquiry_id === id ? { ...inq, status: newStatus } : inq
    ));
    setSelectedDeal(prev => prev && prev.inquiry_id === id ? { ...prev, status: newStatus } : prev);
  };

  const handleSendQuoteClick = (deal) => {
    if (deal.status === 'PENDING') {
      setInlineActionRow({ id: deal.inquiry_id, type: 'PENDING_WARNING' });
    } else if (deal.status === 'RFQ_SENT') {
      setEmailModalDeal(deal);
      setEmailModalType('RFQ');
      setIsEmailModalOpen(true);
      setInlineActionRow(null);
    } else if (deal.status === 'QUOTE_SENT' || deal.status === 'CLOSED') {
      setInlineActionRow({ id: deal.inquiry_id, type: 'QUOTE_WARNING' });
    }
  };

  const handleDirectSendRFQ = async (deal) => {
    setRowActionLoading(true);
    try {
      await triggerRFQ(deal);
      updateDealStatus(deal.inquiry_id, 'RFQ_SENT');
      setInlineActionRow(null);
    } catch (err) {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Failed to send. Please try again.' }));
    } finally {
      setRowActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full pb-8">
        <div className="flex items-center justify-between mb-5 h-10">
          <div className="w-1/3 bg-[#242830] rounded-lg animate-[pulse_1.5s_ease-in-out_infinite]" style={{ opacity: 0.4 }}></div>
          <div className="w-32 bg-[#242830] rounded-lg animate-[pulse_1.5s_ease-in-out_infinite]" style={{ opacity: 0.4 }}></div>
        </div>
        <div className="flex-1 w-full bg-[#1a1d23] border border-[#2a2d33] rounded-xl overflow-hidden shadow-lg animate-[pulse_1.5s_ease-in-out_infinite]" style={{ opacity: 0.4 }}></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full pb-8 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-8 right-8 z-[100] bg-red-500 text-white px-6 py-3 rounded-lg shadow-2xl font-bold animate-fade-in flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {toastMsg}
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="relative w-[340px]">
             <svg className="absolute left-3.5 top-2.5 w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
             </svg>
             <input 
               type="text" 
               placeholder="Search by buyer or product..." 
               className="w-full bg-[#1a1d23] border border-[#2a2d33] rounded-lg h-10 pl-11 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors shadow-sm"
               value={search}
               onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
             />
          </div>
          
          <div className="relative">
             <select 
               className="appearance-none bg-[#1a1d23] border border-[#2a2d33] rounded-lg h-10 pl-4 pr-11 text-sm text-gray-300 font-medium focus:outline-none focus:border-purple-500 transition-colors cursor-pointer shadow-sm hover:border-gray-600"
               value={filter === 'QUOTE_SENT_ONLY' || filter === 'PENDING_REPLIES' ? 'All' : filter}
               onChange={e => { 
                 setFilter(e.target.value); 
                 if(location.state) location.state.date = null;
                 setCurrentPage(1); 
               }}
             >
               <option value="All">All Status</option>
               <option value="PENDING">Pending</option>
               <option value="RFQ_SENT">RFQ Sent</option>
               <option value="QUOTE_SENT">Quote Sent</option>
               <option value="CLOSED">Closed</option>
             </select>
             <svg className="absolute right-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
             </svg>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {error && <span className="text-red-400 text-sm font-medium">{error}</span>}
          <div className="text-sm text-gray-400 font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Synced {getRelativeTime()}
          </div>
        </div>
      </div>

      {/* TABLE METRICS */}
      <div className="flex-1 w-full bg-[#1a1d23] border border-[#2a2d33] rounded-xl overflow-hidden flex flex-col shadow-lg">
        {totalItems > 0 ? (
          <div className="flex-1 overflow-x-auto min-w-0">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
              <thead className="bg-[#242830]/80 text-gray-400 text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-[#2a2d33]">
                <tr>
                  <th className="px-6 py-4">Inquiry ID</th>
                  <th className="px-6 py-4">Buyer</th>
                  <th className="px-6 py-4 w-1/4">Products</th>
                  <th className="px-6 py-4">Received</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2d33]/50">
                {currentItems.map((inq, idx) => (
                  <tr key={inq.inquiry_id} className={`h-[56px] hover:bg-white/[0.04] transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#242830]/20'}`}>
                    <td className="px-6 font-mono text-gray-400 text-[13px]">{inq.inquiry_id}</td>
                    <td className="px-6">
                      <div className="flex flex-col justify-center">
                        <span className="text-white font-bold leading-tight">{inq.buyer_name}</span>
                        <span className="text-gray-500 text-[12px] mt-[2px]">{inq.buyer_email}</span>
                      </div>
                    </td>
                    <td className="px-6">
                       <div className="flex items-center gap-2">
                         <span className="text-gray-300 truncate max-w-[180px] font-medium" title={inq.products[0]?.product_name}>{inq.products[0]?.product_name}</span>
                         {inq.products.length > 1 && (
                           <span className="px-2 py-[2px] bg-gray-700/60 text-gray-300 text-[11px] font-bold rounded-lg ml-1 whitespace-nowrap" title={inq.products.slice(1).map(p=>p.product_name).join(', ')}>
                             +{inq.products.length - 1} more
                           </span>
                         )}
                       </div>
                    </td>
                    <td className="px-6 pt-2 pb-2">{formatDateLines(inq.date_received)}</td>
                    <td className="px-6">{getStatusBadge(inq.status)}</td>
                    <td className="px-6 text-right">
                      {inlineActionRow?.id === inq.inquiry_id ? (
                        <div className="flex items-center justify-end gap-3 fade-in-fast">
                          {inlineActionRow.type === 'PENDING_WARNING' && (
                            <>
                              <span className="text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-1 rounded">RFQ not sent yet. Send RFQ first.</span>
                              <button 
                                onClick={() => handleDirectSendRFQ(inq)}
                                disabled={rowActionLoading}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center gap-1"
                              >
                                {rowActionLoading ? 'Sending...' : 'Send RFQ'}
                              </button>
                            </>
                          )}
                          {inlineActionRow.type === 'QUOTE_WARNING' && (
                            <span className="text-gray-400 text-xs font-bold bg-gray-500/10 px-3 py-1.5 rounded">Quote already sent</span>
                          )}
                          <button onClick={() => setInlineActionRow(null)} className="text-gray-500 hover:text-gray-300">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenDrawer(inq)}
                            className="view-btn px-3.5 py-1.5 text-xs font-bold text-blue-400 border border-blue-500/40 rounded-lg hover:bg-blue-500/10 hover:border-blue-500 hover:text-blue-300 transition-all"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleSendQuoteClick(inq)}
                            className="px-3.5 py-1.5 text-xs font-bold text-emerald-400 border border-emerald-500/40 rounded-lg hover:bg-emerald-500/10 hover:border-emerald-500 hover:text-emerald-300 transition-all"
                          >
                            Send Quote
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#1a1d23] min-h-[400px]">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-14 h-14 text-white/10 mb-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
             </svg>
             <h3 className="text-white text-lg font-bold mb-1.5">No inquiries found</h3>
             <p className="text-gray-500 text-sm font-medium">Try changing your search or filter</p>
          </div>
        )}

        {/* PAGINATION SECTION */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a2d33] bg-[#0c0e12]/30">
          <span className="text-sm text-gray-500 font-medium tracking-wide">
            Showing <span className="text-gray-300 mx-0.5">{startShowing}-{endShowing}</span> of <span className="text-gray-300 mx-0.5">{totalItems}</span> inquiries
          </span>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1 || totalItems === 0} 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 border border-[#2a2d33] rounded-lg text-sm text-gray-300 font-bold hover:bg-white/[0.04] disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all shadow-sm"
            >
              ← Previous
            </button>
            <button 
              disabled={currentPage === totalPages || totalItems === 0} 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-4 py-2 border border-[#2a2d33] rounded-lg text-sm text-gray-300 font-bold hover:bg-white/[0.04] disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <DealDrawer 
        deal={selectedDeal} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onStatusUpdate={updateDealStatus}
      />
      
      <EmailPreviewModal 
        deal={emailModalDeal}
        initialEmailType={emailModalType}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onStatusUpdate={updateDealStatus}
      />
    </div>
  );
}
