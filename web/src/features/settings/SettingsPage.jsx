import React, { useState } from 'react';
import AccountPage from '@features/accounts/AccountPage';
import { useAuth } from '@context';

import ProductsTab from './components/ProductsTab';
import ClientsTab from './components/ClientsTab';
import VendorsTab from './components/VendorsTab';
import VehiclesTab from './components/VehiclesTab';
import DocumentsTab from './components/DocumentsTab';
import ReportingTab from './components/ReportingTab';
import RolePermissionsTab from './components/RolePermissionsTab';

export default function SettingsPage() {
  const { hasPermission } = useAuth();

  const allTabs = [
    { id: 'products', label: 'Products', module: 'products' },
    { id: 'clients', label: 'Clients', module: 'clients' },
    { id: 'vendors', label: 'Vendors', module: 'suppliers' },
    { id: 'vehicles', label: 'Vehicles', module: 'vehicles' },
    { id: 'documents', label: 'Documents', module: 'documents' },
    { id: 'accounts', label: 'Accounts', module: 'bankAccounts' },
    { id: 'permissions', label: 'Role permissions', module: 'settings' },
  ];

  const tabs = allTabs.filter(t => hasPermission(t.module, 'read'));
  const [activeTab, setActiveTab] = useState(() => {
    return tabs[0]?.id || 'products';
  });

  return (
    <div className="flex flex-col w-full min-h-full pb-2">
      {/* Header Title & Subtitle */}
      <div className="mb-5">
        <h1 className="text-3xl font-serif font-medium text-[#1e293b] dark:text-white tracking-tight">
          Settings
        </h1>
        <p className="text-sm font-sans font-medium text-[#64748b] dark:text-gray-400 mt-1">
          Manage the records and access that power every other page.
        </p>
      </div>

      <div className="w-full flex-1 flex flex-col">

        {/* Tab Bar - Underline style matching reference design */}
        <div className="border-b border-[#e6e0d2] dark:border-[#2a2d33] flex items-center gap-6 mb-4 text-sm overflow-x-auto [::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap transition-colors duration-200 pb-2.5 ${activeTab === tab.id
                ? 'text-[#0d6e6e] dark:text-teal-400 font-bold border-b-2 border-[#0d6e6e] dark:border-teal-400 -mb-px'
                : 'text-[#64748b] dark:text-gray-400 hover:text-[#1e293b] dark:hover:text-white font-semibold'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'clients' && <ClientsTab />}
        {activeTab === 'vendors' && <VendorsTab />}
        {activeTab === 'vehicles' && <VehiclesTab />}
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'reporting' && <ReportingTab />}
        {activeTab === 'accounts' && <AccountPage />}
        {activeTab === 'permissions' && <RolePermissionsTab />}
      </div>
    </div>
  );
}