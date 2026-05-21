import React, { Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppContext } from "./context";
import { mockInquiries } from "./data/mockInquiries";
import { mockSupply } from "./data/mockSupply";
import { mockPurchaseOrders } from "./data/mockPurchaseOrders";
import { mockEmployees } from "./data/mockEmployees";
import { mockDocuments } from "./data/mockDocuments";
import { mockAccounts } from "./data/mockAccounts";
import Sidebar from "./components/layout/sidebar";
import Topbar from "./components/layout/topbar";
import CallOverlay from "./components/layout/callOverlay";
import SupplyPage from "./pages/supplyPage";

// Lazy-load pages for code splitting
const DashboardPage = React.lazy(() => import("./pages/dashboardPage"));
const InquiriesPage = React.lazy(() => import("./pages/inquiriesPage"));
const ProfitPage = React.lazy(() => import("./pages/profitPage"));
const SettingsPage = React.lazy(() => import("./pages/settingsPage"));
const InventoryPage = React.lazy(() => import("./pages/inventoryPage"));
const ProfilePage = React.lazy(() => import("./pages/profilePage"));
const LoginPage = React.lazy(() => import("./pages/loginPage"));
const PurchaseOrdersPage = React.lazy(() => import("./pages/purchaseOrdersPage"));
const EmployeesPage = React.lazy(() => import("./pages/employeesPage"));
const DocumentsPage = React.lazy(() => import("./pages/documentsPage"));
const AccountPage = React.lazy(() => import("./pages/accountPage"));
const NotificationsPage = React.lazy(() => import("./pages/notificationsPage"));
const TodoPage = React.lazy(() => import("./pages/todoPage"));

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
  const [purchaseOrdersData, setPurchaseOrdersData] = React.useState(mockPurchaseOrders);
  const [employeesData, setEmployeesData] = React.useState(mockEmployees);
  const [documentsData, setDocumentsData] = React.useState(mockDocuments);
  const [accountsData, setAccountsData] = React.useState(mockAccounts);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => {
    return localStorage.getItem("is_auth") === "true";
  });
  const [activeCall, setActiveCall] = React.useState(null);
  const [theme, setTheme] = React.useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  const startCall = (user, type = 'voice') => {
    setActiveCall({
      caller: user,
      type,
      status: 'ongoing',
      startTime: Date.now(),
      duration: 0
    });
  };

  const endCall = () => setActiveCall(null);

  React.useLayoutEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    body.classList.remove("light", "dark");
    body.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const login = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user || { name: "Admin", role: "Administrator", email: "admin@trademind.com" });
    localStorage.setItem("is_auth", "true");
    if (user) {
      localStorage.setItem("user_profile", JSON.stringify(user));
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem("is_auth");
    localStorage.removeItem("user_profile");
  };

  return (
    <AppContext.Provider
      value={{
        inquiriesData,
        setInquiriesData,
        supplyData,
        setSupplyData,
        purchaseOrdersData,
        setPurchaseOrdersData,
        employeesData,
        setEmployeesData,
        documentsData,
        setDocumentsData,
        accountsData,
        setAccountsData,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        login,
        logout,
        theme,
        toggleTheme,
        activeCall,
        startCall,
        endCall
      }}
    >
      <HashRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="*"
              element={
                isAuthenticated ? (
                  <div className="flex w-screen h-screen bg-gray-50 dark:bg-[#0c0e12] text-gray-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
                    <Sidebar isOpen={isSidebarOpen} />
                    <main className="flex-1 flex flex-col h-full bg-white dark:bg-[#0f1117] relative overflow-hidden transition-colors duration-300">
                      <Topbar onToggleSidebar={toggleSidebar} />
                      <CallOverlay />
                      <div className="flex-1 overflow-y-auto p-4 md:p-5 custom-scrollbar">
                        <div className="w-full h-full mx-auto max-w-[1920px]">
                          <Routes>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/inquiries" element={<InquiriesPage />} />
                            <Route path="/supply" element={<SupplyPage />} />
                            <Route path="/profit" element={<ProfitPage />} />
                            <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
                            <Route path="/employees" element={<EmployeesPage />} />
                            <Route path="/documents" element={<DocumentsPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/inventory" element={<InventoryPage />} />
                            <Route path="/accounts" element={<AccountPage />} />
                            <Route path="/notifications" element={<NotificationsPage />} />
                            <Route path="/todo" element={<TodoPage />} />
                          </Routes>
                        </div>
                      </div>
                    </main>
                  </div>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </Suspense>
      </HashRouter>
    </AppContext.Provider>
  );
}


