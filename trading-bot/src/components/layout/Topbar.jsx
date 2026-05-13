import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatDrawer from "../chat/ChatDrawer";
import { useAppContext } from "../../context";

const PAGE_TITLES = {
  "/": "Dashboard",
  "/inquiries": "Inquiries",
  "/purchase-orders": "Purchase Orders",
  "/supply": "Supply",
  "/profit": "Profit Report",
  "/settings": "Settings",
  "/accounts": "Accounts",
  "/employees": "Employees",
  "/documents": "Documents",
  "/notifications": "Notifications",
  "/todo": "To-Do",
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
  const { logout, theme, toggleTheme, currentUser } = useAppContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";
  const [isChatOpen, setIsChatOpen] = useState(false);
  const firstName = currentUser?.name?.split(" ")[0] || "Admin";


  const d = new Date();
  const formattedDate = `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <header className="h-[56px] border-b border-gray-200 dark:border-[#2a2d33] flex items-center justify-between px-8 bg-white dark:bg-[#0f1117] flex-shrink-0 transition-colors duration-300 relative">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-white/10 transition text-gray-600 dark:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <h1 className="text-gray-900 dark:text-white text-[20px] font-bold tracking-tight">
          {title}
        </h1>
      </div>

      {/* Centered Welcome Greeting */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-2">
        <span className="text-gray-400 dark:text-gray-500 text-sm font-bold tracking-wider uppercase">
          Welcome back, <span className="text-purple-500">{firstName}</span>
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
      </div>

      <div className="flex items-center gap-6">
        <time
          className="text-gray-500 dark:text-gray-400 text-sm font-medium"
          dateTime={d.toISOString()}
        >
          {formattedDate}
        </time>

        <div className="h-6 w-[1px] bg-gray-200 dark:bg-[#2a2d33]" />

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        <button
          onClick={() => setIsChatOpen(true)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 relative group"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-purple-500 border-2 border-white dark:border-[#0f1117] rounded-full" />
        </button>

        <button
          onClick={() => navigate("/notifications")}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 relative group"
          aria-label="Notifications"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 border-2 border-white dark:border-[#0f1117] rounded-full shadow-sm animate-pulse" />
        </button>
      </div>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </header>
  );
}

