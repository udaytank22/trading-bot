import React, { Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppContext } from "./context";
import { mockInquiries } from "./data/mockInquiries";
import { mockSupply } from "./data/mockSupply";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import SupplyPage from "./pages/SupplyPage";

// Lazy-load pages for code splitting
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const InquiriesPage = React.lazy(() => import("./pages/InquiriesPage"));
const ProfitPage = React.lazy(() => import("./pages/ProfitPage"));
const SettingsPage = React.lazy(() => import("./pages/SettingsPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <svg
        className="animate-spin h-7 w-7 text-purple-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

export default function App() {
  const [inquiriesData, setInquiriesData] = React.useState(mockInquiries);
  const [supplyData, setSupplyData] = React.useState(mockSupply);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <AppContext.Provider value={{ inquiriesData, setInquiriesData, supplyData, setSupplyData }}>
      <HashRouter>
        <div className="flex w-screen h-screen bg-[#0f1117] text-white overflow-hidden font-sans">
          <Sidebar isOpen={isSidebarOpen} />
          <main className="flex-1 flex flex-col h-full bg-[#0f1117] relative overflow-hidden">
            <Topbar onToggleSidebar={toggleSidebar} />
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-[1280px] min-w-[1024px] mx-auto h-full">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/inquiries" element={<InquiriesPage />} />
                    <Route path="/supply" element={<SupplyPage />} />
                    <Route path="/profit" element={<ProfitPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </Suspense>
              </div>
            </div>
          </main>
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
}
