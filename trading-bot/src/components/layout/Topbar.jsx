import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatDrawer from "../chat/ChatDrawer";
import { useAppContext } from "../../context";

const PAGE_TITLES = {
  "/": "Dashboard",
  "/inquiries": "Inquiries",
  "/supply": "Supply",
  "/profit": "Profit Report",
  "/settings": "Settings",
};

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function Topbar({ onToggleSidebar }) {
  const { logout } = useAppContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";
  const [isChatOpen, setIsChatOpen] = useState(false);


  const d = new Date();
  const formattedDate = `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <header className="h-[56px] border-b border-[#2a2d33] flex items-center justify-between px-8 bg-[#0f1117] flex-shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
          className="p-2 rounded hover:bg-white/10 transition"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <h1 className="text-white text-[20px] font-bold tracking-tight">
          {title}
        </h1>
      </div>
      
      <div className="flex items-center gap-6">
        <time
          className="text-gray-400 text-sm font-medium"
          dateTime={d.toISOString()}
        >
          {formattedDate}
        </time>

        <button 
          onClick={() => setIsChatOpen(true)}
          className="p-2 rounded-full hover:bg-white/10 transition-all text-gray-400 hover:text-purple-400 relative group"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-purple-500 border-2 border-[#0f1117] rounded-full" />
        </button>

        <button 
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all text-sm font-medium border border-red-500/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </header>
  );
}

