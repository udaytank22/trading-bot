import { useAuth, useUI, useData } from '@context';
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatDrawer from "../chat/chatDrawer";

const PAGE_TITLES = {
  "/": "Dashboard",
  "/inquiries": "Inquiries",
  "/purchase-orders": "Purchase Orders",
  "/supply": "Supply",
  "/profit": "Profit Report",
  "/profile": "Profile",
  "/accounts": "Accounts",
  "/employees": "Employees",
  "/documents": "Documents",
  "/notifications": "Notifications",
  "/todo": "To-Do",
  "/settings": "Settings",
  "/inventory": "Inventory",
};

export default function Topbar({ onToggleSidebar }) {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useUI();
  const { inquiriesData } = useData();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const firstName = currentUser?.name?.split(" ")[0] || "Admin";
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <header className="h-[50px] border-b border-gray-200/60 dark:border-[#2a2d33] flex items-center justify-between px-8 bg-[#f8f9fc] dark:bg-[#0f1117] flex-shrink-0 transition-colors duration-300 relative">
      <div className="flex items-center gap-8">
        <h1 className="text-[#1e293b] dark:text-white text-[18px] font-bold tracking-tight">
          {title}
        </h1>
        <div className="relative hidden md:block">
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const q = searchQuery.trim().toLowerCase();
                  if (!q) return;
                  const exact = (inquiriesData || []).find((i) => i.inquiry_id.toLowerCase() === q);
                  const first = (inquiriesData || []).find((i) => i.inquiry_id.toLowerCase().includes(q));
                  const pick = exact || first;
                  if (pick) {
                    setShowSuggestions(false);
                    navigate("/inquiries", { state: { openInquiryId: pick.inquiry_id } });
                  }
                }
              }}
              placeholder="Global search..."
              className="w-[420px] h-[38px] pl-10 pr-4 bg-white dark:bg-[#1a1d23] border border-purple-100 dark:border-[#2a2d33] rounded-full text-[13px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
            />
          </div>

          {showSuggestions && searchQuery.trim().length > 0 && (inquiriesData || []).filter((i) => i.inquiry_id.toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 5).length > 0 && (
            <div className="absolute left-0 mt-1 w-full bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d33] rounded-md shadow-lg z-50">
              {(inquiriesData || [])
                .filter((i) => i.inquiry_id.toLowerCase().includes(searchQuery.trim().toLowerCase()))
                .slice(0, 5)
                .map((inq) => (
                  <button
                    key={inq.inquiry_id}
                    onClick={() => {
                      setShowSuggestions(false);
                      setSearchQuery(inq.inquiry_id);
                      navigate("/inquiries", { state: { openInquiryId: inq.inquiry_id } });
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="font-mono text-xs text-gray-700 dark:text-gray-200">
                      {inq.inquiry_id}
                    </span>
                    <div className="text-[11px] text-gray-500 truncate">
                      {inq.buyer_name} · {inq.products?.[0]?.product_name}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-4">
          <span className="text-[12px] font-medium text-slate-500 dark:text-gray-400">
            {todayDate}
          </span>
          {/* <div className="flex items-center bg-[#eef2fc] dark:bg-purple-900/20 px-4 py-1.5 rounded-full">
            <span className="text-[11px] font-bold text-slate-500 dark:text-gray-300 tracking-wider">
              WELCOME BACK, <span className="text-purple-600 dark:text-purple-400 uppercase">{firstName}</span>
            </span>
          </div> */}
        </div>

        <div className="flex items-center gap-1 text-slate-500 dark:text-gray-400">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          <button
            onClick={() => setIsChatOpen(true)}
            className="w-8 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors relative"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </button>

          <button
            onClick={() => navigate("/notifications")}
            className="w-8 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors relative"
            aria-label="Notifications"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-[#f8f9fc] dark:ring-[#0f1117]" />
          </button>

          <button
            onClick={() => navigate("/settings")}
            className="w-8 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
            aria-label="Settings"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* Horizontal Divider */}
          <div className="h-6 w-px bg-slate-300 dark:bg-white/10" />
        </div>

        <div
          onClick={() => navigate("/profile")}
          className="w-9 h-9 rounded-full ring-2 ring-purple-100 dark:ring-purple-900/50 ring-offset-2 ring-offset-[#f8f9fc] dark:ring-offset-[#0f1117] shadow-sm overflow-hidden flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
        >
          <img
            src="https://i.pravatar.cc/150?u=a042581f4e29026024d"
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </header>
  );
}
