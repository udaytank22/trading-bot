import React, { useState } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import InquiriesPage from './pages/InquiriesPage';
import ProfitPage from './pages/ProfitPage';
import SettingsPage from './pages/SettingsPage';
import { mockInquiries } from './data/mockInquiries';
import { AppContext } from './context';
import { refreshConfig } from './config';
import axios from 'axios';
import { CONFIG } from './config';

function Sidebar() {
  const [failedSyncs, setFailedSyncs] = useState(0);

  React.useEffect(() => {
    const checkSyncs = async () => {
      if (window.electronStore) {
        const failed = await window.electronStore.get('failed_writes') || [];
        setFailedSyncs(failed.length);
        
        // Auto-retry
        if (failed.length > 0) {
          const remaining = [];
          for (let item of failed) {
            try {
              if (item.type === 'logQuoteSent') {
                await axios.post(`${CONFIG.n8nBaseUrl}/webhook/update-status`, { dealId: item.payload.inquiry_id, status: 'QUOTE_SENT' }, {
                  headers: { 'Authorization': `Bearer ${CONFIG.n8nSecret}` },
                  timeout: 15000
                });
              }
            } catch(e) {
              remaining.push(item);
            }
          }
          await window.electronStore.set('failed_writes', remaining);
          setFailedSyncs(remaining.length);
        }
      }
    };
    checkSyncs();
    const interval = setInterval(checkSyncs, 10 * 60 * 1000); // 10 minutes
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: <PathData1 /> },
    { name: 'Inquiries', path: '/inquiries', icon: <PathData2 /> },
    { name: 'Profit Report', path: '/profit', icon: <PathData3 /> },
    { name: 'Settings', path: '/settings', icon: <PathData4 /> }
  ];

  return (
    <div className="w-[240px] flex-shrink-0 bg-[#1a1d23] text-gray-400 flex flex-col h-full border-r border-[#2a2d33] shadow-lg z-10">
      {/* Logo & Branding */}
      <div className="p-6 pb-8 flex items-center gap-3">
        <div className="w-8 h-8 flex-shrink-0 bg-purple-600 rounded flex items-center justify-center shadow-md">
          {/* Simple geometric element inside */}
          <div className="w-3 h-3 bg-white rounded-sm rotate-45"></div>
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-[18px] leading-tight">TradeMind</span>
          <span className="text-gray-500 text-[12px] font-medium tracking-wide">Quotation Dashboard</span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex flex-col flex-1 mt-2">
        {navLinks.map((link) => (
          <NavLink 
            key={link.name} 
            to={link.path}
            className={({ isActive }) => `
              flex items-center gap-3 pl-4 pr-4 h-[44px] border-l-[3px] transition-colors duration-200
              ${isActive 
                ? 'border-purple-500 bg-white/[0.04] text-white font-semibold' 
                : 'border-transparent text-gray-400 hover:bg-white/[0.02] hover:text-gray-200 font-medium'}
            `}
          >
            <div className="w-5 h-5 flex-shrink-0">{link.icon}</div>
            <span className="text-[14px]">{link.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Bottom Status */}
      <div className="p-6 mt-auto">
        <div className="flex items-center gap-2 mb-1">
          <div className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-500"></span>
          </div>
          <span className="text-[12px] text-gray-400 font-medium tracking-wide text-transform uppercase">Bot Active</span>
        </div>
        {failedSyncs > 0 && (
          <div className="flex items-center gap-2 mb-1 mt-2">
            <div className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full w-2 h-2 bg-amber-500"></span>
            </div>
            <span className="text-[12px] text-amber-500 font-medium tracking-wide">{failedSyncs} pending sync{failedSyncs !== 1 ? 's' : ''}</span>
          </div>
        )}
        <div className="text-[11px] text-gray-600 font-mono tracking-wider ml-4 mt-2">v1.0.0</div>
      </div>
    </div>
  );
}

function Topbar() {
  const location = useLocation();
  const pageTitles = {
    '/': 'Dashboard',
    '/inquiries': 'Inquiries',
    '/profit': 'Profit Report',
    '/settings': 'Settings'
  };
  const title = pageTitles[location.pathname] || 'Dashboard';

  const d = new Date();
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const formattedDate = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <div className="h-[56px] border-b border-[#2a2d33] flex items-center justify-between px-8 bg-[#0f1117] flex-shrink-0 z-0">
      <h1 className="text-white text-[20px] font-bold tracking-tight">{title}</h1>
      <div className="text-gray-400 text-sm font-medium">{formattedDate}</div>
    </div>
  );
}

function PagePlaceholder({ name }) {
  return (
    <div className="flex flex-1 items-center justify-center h-full w-full">
      <div className="px-8 py-4 border border-dashed border-[#2a2d33] rounded-2xl flex flex-col items-center justify-center bg-white/[0.01]">
        <h2 className="text-gray-400 text-xl font-medium mb-2">{name}</h2>
        <p className="text-gray-600 text-sm max-w-[300px] text-center leading-relaxed">
          This is a placeholder for the {name} page. Connect the inner components here.
        </p>
      </div>
    </div>
  );
}

function Dashboard() { return <DashboardPage />; }
function Inquiries() { return <InquiriesPage />; }
function ProfitReport() { return <ProfitPage />; }
function Settings() { return <SettingsPage />; }

export default function App() {
  const [inquiriesData, setInquiriesData] = useState(mockInquiries);

  React.useEffect(() => {
    refreshConfig().catch(err => console.error("Error refreshing config:", err));
  }, []);

  return (
    <AppContext.Provider value={{ inquiriesData, setInquiriesData }}>
      <HashRouter>
        <div className="flex w-screen h-screen bg-[#0f1117] text-white overflow-hidden font-sans">
          <Sidebar />
          
          <main className="flex-1 flex flex-col h-full bg-[#0f1117] relative">
            <Topbar />
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-[1280px] min-w-[1024px] mx-auto h-full">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/inquiries" element={<Inquiries />} />
                  <Route path="/profit" element={<ProfitReport />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </div>
            </div>
          </main>
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
}

// Crisp, modern SVG Icons
const PathData1 = () => (
  // Grid / Home icon
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
  </svg>
)
const PathData2 = () => (
  // Inbox icon
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" />
  </svg>
)
const PathData3 = () => (
  // Chart icon
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
)
const PathData4 = () => (
  // Settings Gear Icon
   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
)
