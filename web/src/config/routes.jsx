// src/config/routes.jsx
import React from 'react';

// Lazy-load all page components from their feature folders
const LoginPage = React.lazy(() => import('@features/auth/LoginPage'));
const DashboardPage = React.lazy(() => import('@features/dashboard/DashboardPage'));
const InquiriesPage = React.lazy(() => import('@features/inquiries/InquiriesPage'));
const SupplyPage = React.lazy(() => import('@features/supply/SupplyPage'));
const PurchaseOrdersPage = React.lazy(() => import('@features/purchase-orders/PurchaseOrdersPage'));
const InvoicesPage = React.lazy(() => import('@features/invoices/InvoicesPage'));
const InvoiceDetailsPage = React.lazy(() => import('@features/invoices/InvoiceDetailsPage'));
const EmployeesPage = React.lazy(() => import('@features/employees/EmployeesPage'));
const AccountPage = React.lazy(() => import('@features/accounts/AccountPage'));
const InventoryPage = React.lazy(() => import('@features/inventory/InventoryPage'));
const ProfitPage = React.lazy(() => import('@features/profit/ProfitPage'));
const DocumentsPage = React.lazy(() => import('@features/documents/DocumentsPage'));
const NotificationsPage = React.lazy(() => import('@features/notifications/NotificationsPage'));
const TodoPage = React.lazy(() => import('@features/todo/TodoPage'));
const SettingsPage = React.lazy(() => import('@features/settings/SettingsPage'));
const ProfilePage = React.lazy(() => import('@features/profile/ProfilePage'));
const InboxPage = React.lazy(() => import('@features/inbox/InboxPage'));
const ClientRFQsPage = React.lazy(() => import('@features/client-portal/ClientRFQsPage'));
const InquiryDetailsPage = React.lazy(() => import('@features/inquiries/InquiryDetailsPage'));
const PODetailsPage = React.lazy(() => import('@features/purchase-orders/PODetailsPage'));
const SupplyDetailsPage = React.lazy(() => import('@features/supply/SupplyDetailsPage'));
const ReportsPage = React.lazy(() => import('@features/reports/ReportsPage'));
const RequestProductPage = React.lazy(() => import('@features/public-portal/RequestProductPage'));

/** Public routes (no auth required) */
export const PUBLIC_ROUTES = [
  { path: '/login', element: <LoginPage /> },
  { path: '/request-product', element: <RequestProductPage /> },
];

/** Protected routes (auth required, rendered inside AppShell) */
export const PROTECTED_ROUTES = [
  { path: '/', element: <DashboardPage /> },
  { path: '/inquiries', element: <InquiriesPage /> },
  { path: '/inquiries/:id', element: <InquiryDetailsPage /> },
  { path: '/client-rfqs', element: <ClientRFQsPage /> },
  { path: '/supply', element: <SupplyPage /> },
  { path: '/supply/:id', element: <SupplyDetailsPage /> },
  { path: '/purchase-orders', element: <PurchaseOrdersPage /> },
  { path: '/purchase-orders/:id', element: <PODetailsPage /> },
  { path: '/invoices', element: <InvoicesPage /> },
  { path: '/invoices/:id', element: <InvoiceDetailsPage /> },
  { path: '/employees', element: <EmployeesPage /> },
  { path: '/accounts', element: <AccountPage /> },
  { path: '/inventory', element: <InventoryPage /> },
  { path: '/profit', element: <ProfitPage /> },
  { path: '/documents', element: <DocumentsPage /> },
  { path: '/notifications', element: <NotificationsPage /> },
  { path: '/todo', element: <TodoPage /> },
  { path: '/inbox', element: <InboxPage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/reports', element: <ReportsPage /> },
];
