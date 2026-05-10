import { useLocation } from "react-router-dom";

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
      <time
        className="text-gray-400 text-sm font-medium"
        dateTime={d.toISOString()}
      >
        {formattedDate}
      </time>
    </header>
  );
}
