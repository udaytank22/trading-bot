import { useAuth } from '@context';
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const NAV_LINKS = [
  { name: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { name: "Inquiries", path: "/inquiries", icon: <InquiriesIcon /> },
  { name: "Client RFQs", path: "/client-rfqs", icon: <InquiriesIcon /> },
  { name: "Purchase orders", path: "/purchase-orders", icon: <POIcon /> },
  { name: "Invoices", path: "/invoices", icon: <InvoicesIcon /> },
  { name: "Supply", path: "/supply", icon: <SupplyIcon /> },
  { name: "Inventory", path: "/inventory", icon: <InventoryIcon /> },
  { name: "Employees", path: "/employees", icon: <UsersIcon /> },
  { name: "Inbox", path: "/inbox", icon: <InboxIcon /> },
  { name: "To-Do", path: "/todo", icon: <TodoIcon /> },
  { name: "Reports", path: "/reports", icon: <ReportsIcon /> },
];

export default function Sidebar({ isOpen }) {
  const { logout, currentUser, hasPermission } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const effectiveOpen = isOpen || isHovered;
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredLinks = NAV_LINKS.filter(link => {
    const roleLower = currentUser?.role?.toLowerCase();

    // Client portal logic
    if (roleLower === 'client') {
      return link.name === "Client RFQs";
    }
    if (link.name === "Client RFQs") {
      return false; // Non-clients don't see Client RFQs tab
    }

    // Permission checks
    if (link.name === "Dashboard") return hasPermission("dashboard", "read");
    if (link.name === "Inquiries") return hasPermission("inquiries", "read");
    if (link.name.startsWith("Purchase")) return hasPermission("purchaseOrders", "read");
    if (link.name === "Supply") return hasPermission("suppliers", "read");
    if (link.name === "Invoices") return hasPermission("invoices", "read");
    if (link.name === "Inventory") return hasPermission("inventory", "read");
    if (link.name === "Employees") return hasPermission("employees", "read");
    if (link.name === "Inbox") return hasPermission("chat", "read");
    if (link.name === "To-Do") return hasPermission("dashboard", "read");
    if (link.name === "Reports") return hasPermission("reports", "read");

    return true;
  });

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex-shrink-0 bg-[#09141f] text-[#8fa0b8] flex flex-col h-full border-r border-white/[0.06] shadow-2xl z-20 transition-all duration-300 overflow-hidden ${effectiveOpen ? "w-[215px]" : "w-[75px]"}`}
    >
      {/* Brand Header */}
      <div className="p-4 pb-5 flex items-center gap-3">
        <div className="w-10 h-10 flex-shrink-0 bg-[#c59235] text-[#09141f] rounded-xl flex items-center justify-center font-serif font-bold text-xl shadow-md">
          T
        </div>
        <div className={`flex flex-col ${effectiveOpen ? '' : 'hidden'}`}>
          <span className="text-white font-serif font-medium text-[16px] leading-tight tracking-wide">
            TradeMind
          </span>
          <span className="text-[#64748b] text-[9px] font-bold tracking-widest leading-tight uppercase mt-0.5">
            TRADING & SUPPLY<br />LEDGER
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1 px-3 space-y-1 mt-1 overflow-y-auto custom-scrollbar" aria-label="Main navigation">
        {filteredLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end={link.path === "/"}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 ${isActive
                ? "bg-[#0e2b37] border border-[#164e5e] text-white font-semibold shadow-[0_0_15px_rgba(20,77,89,0.3)]"
                : "bg-transparent border border-transparent text-[#8b9cb4] hover:bg-white/[0.04] hover:text-white font-medium"
              }`
            }
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="w-5 h-5 flex-shrink-0">{link.icon}</span>
              <span className={`text-[13px] truncate ${effectiveOpen ? "" : "hidden"}`}>
                {link.name}
              </span>
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="mt-auto border-t border-white/[0.08] p-3">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-semibold text-[13px] ${effectiveOpen ? "" : "justify-center px-0"}`}
          title="Logout"
        >
          <span className="w-5 h-5 flex-shrink-0">
            <LogoutIcon />
          </span>
          <span className={`${effectiveOpen ? "" : "hidden"}`}>Logout</span>
        </button>
      </div>
    </aside>
  );
}

/* ── SVG Icons ── */
function DashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" strokeWidth="1.8" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" strokeWidth="1.8" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" strokeWidth="1.8" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" strokeWidth="1.8" />
    </svg>
  );
}
function InquiriesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h12m-12 5.25h16.5" />
    </svg>
  );
}
function POIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}
function SupplyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-2.123-7.674 4.125 4.125 0 0 0-2.122 7.674 9.337 9.337 0 0 0 4.121-.952 9.38 9.38 0 0 0 2.625.372M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.003c0 1.113.285 2.16.786 3.07M15 19.128A9.321 9.321 0 0 0 12 18a9.321 9.321 0 0 0-3 1.128m6 0c0 1.113-.285 2.16-.786 3.07M15 19.128c0-1.113-.285-2.16-.786-3.07M9.75 9.75c0 1.242 1.008 2.25 2.25 2.25s2.25-1.008 2.25-2.25-1.008-2.25-2.25-2.25-2.25 1.008-2.25 2.25Z" />
    </svg>
  );
}
function TodoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m.75-12h3.75M9 9h3.75M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm-9-9a9 9 0 0 1 9-9" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  );
}
function InventoryIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}
function InvoicesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6M9 10h6M21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6M7 8h10l-1.5-3h-7L7 8z" />
    </svg>
  );
}
function InboxIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 1 19.5 4.5h-15a2.25 2.25 0 0 1-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.909A2.25 2.25 0 0 1 2.25 6.993V6.75m19.5 0v.243m0 0a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.909a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}
function ReportsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}
