import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatDrawer from "../chat/chatDrawer";
import SearchBar from "../ui/searchBar";
import { useAppContext } from "../../context";

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
  const { logout, theme, toggleTheme, currentUser, inquiriesData } =
    useAppContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const firstName = currentUser?.name?.split(" ")[0] || "Admin";

  const d = new Date();
  const formattedDate = `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <header className="h-[42px] border-b border-gray-200 dark:border-[#2a2d33] flex items-center justify-between px-5 bg-white dark:bg-[#0f1117] flex-shrink-0 transition-colors duration-300 relative">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 transition text-gray-600 dark:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <h1 className="text-gray-900 dark:text-white text-[14px] font-bold tracking-tight">
          {title}
        </h1>
        <div className="relative hidden md:block">
          <SearchBar
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const q = searchQuery.trim().toLowerCase();
                if (!q) return;
                const exact = (inquiriesData || []).find(
                  (i) => i.inquiry_id.toLowerCase() === q,
                );
                const first = (inquiriesData || []).find((i) =>
                  i.inquiry_id.toLowerCase().includes(q),
                );
                const pick = exact || first;
                if (pick) {
                  setShowSuggestions(false);
                  navigate("/inquiries", {
                    state: { openInquiryId: pick.inquiry_id },
                  });
                }
              }
            }}
            placeholder="Global search..."
            width="w-[220px]"
            className=""
          />

          {/* Suggestions dropdown (inquiry numbers) */}
          {showSuggestions &&
            searchQuery.trim().length > 0 &&
            (inquiriesData || [])
              .filter((i) =>
                i.inquiry_id
                  .toLowerCase()
                  .includes(searchQuery.trim().toLowerCase()),
              )
              .slice(0, 5).length > 0 && (
              <div className="absolute left-0 mt-1 w-[220px] bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d33] rounded-md shadow-lg z-50">
                {(inquiriesData || [])
                  .filter((i) =>
                    i.inquiry_id
                      .toLowerCase()
                      .includes(searchQuery.trim().toLowerCase()),
                  )
                  .slice(0, 5)
                  .map((inq) => (
                    <button
                      key={inq.inquiry_id}
                      onClick={() => {
                        setShowSuggestions(false);
                        setSearchQuery(inq.inquiry_id);
                        navigate("/inquiries", {
                          state: { openInquiryId: inq.inquiry_id },
                        });
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

      {/* Centered Welcome Greeting */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-1.5">
        <span className="text-gray-400 dark:text-gray-500 text-[11px] font-bold tracking-wider uppercase">
          Welcome back, <span className="text-purple-500">{firstName}</span>
        </span>
        <div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" />
      </div>

      <div className="flex items-center gap-3">
        <time
          className="text-gray-500 dark:text-gray-400 text-[11px] font-medium"
          dateTime={d.toISOString()}
        >
          {formattedDate}
        </time>

        <div className="h-4 w-[1px] bg-gray-200 dark:bg-[#2a2d33]" />

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>

        <button
          onClick={() => setIsChatOpen(true)}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 relative group"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-500 border border-white dark:border-[#0f1117] rounded-full" />
        </button>

        <button
          onClick={() => navigate("/notifications")}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 relative group"
          aria-label="Notifications"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 border border-white dark:border-[#0f1117] rounded-full shadow-sm animate-pulse" />
        </button>

        <div className="h-4 w-[1px] bg-gray-200 dark:bg-[#2a2d33] hidden sm:block mx-1" />

        <button
          onClick={() => navigate("/settings")}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          aria-label="Settings"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </button>
      </div>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </header>
  );
}
