import { useAuth, useUI } from '@context';
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import logo from "../../../public/memories/logo.png";

const NAV_LINKS = [
  { name: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { name: "Inquiries", path: "/inquiries", icon: <InquiriesIcon /> },
  { name: "Client RFQs", path: "/client-rfqs", icon: <InquiriesIcon /> },
  { name: "Purchase Orders", path: "/purchase-orders", icon: <POIcon /> },
  { name: "Supply", path: "/supply", icon: <InquiriesIcon /> },
  { name: "Invoices", path: "/invoices", icon: <InvoicesIcon /> },
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
    if (link.name === "Purchase Orders") return hasPermission("purchaseOrders", "read");
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
      className={`flex-shrink-0 bg-white dark:bg-[#1a1d23] text-gray-500 dark:text-gray-400 flex flex-col h-full border-r border-gray-200 dark:border-[#2a2d33] shadow-lg z-10 transition-all duration-300 overflow-hidden ${effectiveOpen ? "w-[200px]" : "w-[60px]"}`}
    >
      {/* Logo */}
      <div className="p-4 pb-4 flex items-center gap-2.5">
        <div className="w-6 h-6 flex-shrink-0 bg-purple-600 rounded flex items-center justify-center shadow-md">
          <img src={logo} alt="Logo" className="w-4 h-4 object-contain" />
        </div>
        <div className={`flex flex-col ${effectiveOpen ? '' : 'hidden'}`}>
          <span className="text-gray-900 dark:text-white font-bold text-[14px] leading-tight">
            TradeMind
          </span>
          <span className="text-gray-400 dark:text-gray-500 text-[10px] font-medium tracking-wide">
            Quotation Dashboard
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1 mt-1" aria-label="Main navigation">
        {filteredLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end={link.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-2.5 pl-3 pr-3 h-[34px] border-l-[3px] transition-colors duration-150 ${isActive
                ? "border-purple-500 bg-purple-50 dark:bg-white/[0.04] text-purple-600 dark:text-white font-semibold"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.02] hover:text-gray-900 dark:hover:text-gray-200 font-medium"
              }`
            }
          >
            <span className="w-4 h-4 flex-shrink-0">{link.icon}</span>
            <span className={`text-[12px] ${effectiveOpen ? "" : "hidden"}`}>
              {link.name}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="mt-auto border-t border-gray-200 dark:border-[#2a2d33] p-3">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-all font-bold text-[12px] ${effectiveOpen ? "" : "justify-center px-0"}`}
          title="Logout"
        >
          <span className="w-4 h-4 flex-shrink-0">
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  );
}
function InquiriesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" />
    </svg>
  );
}
function POIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
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
function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.909A2.25 2.25 0 0 1 2.25 6.993V6.75m19.5 0v.243m0 0a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.909a2.25 2.25 0 0 1-1.07-1.916V6.75" />
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
