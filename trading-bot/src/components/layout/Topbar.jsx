import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import ChatDrawer from "../chat/ChatDrawer";

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
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";
  const [isChatOpen, setIsChatOpen] = useState(false);

  const d = new Date();
  const formattedDate = `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <header className="h-[56px] border-b border-[#2a2d33] flex items-center justify-between px-8 bg-[#0f1117] flex-shrink-0">
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
      <div className="flex items-center gap-6">
        <button 
          onClick={() => setIsChatOpen(true)}
          className="p-2 rounded-full hover:bg-white/10 transition-all text-gray-400 hover:text-purple-400 relative group"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-purple-500 border-2 border-[#0f1117] rounded-full" />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Messages
          </span>
        </button>

        <time
          className="text-gray-400 text-sm font-medium"
          dateTime={d.toISOString()}
        >
          {formattedDate}
        </time>
      </div>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </header>
  );
}
