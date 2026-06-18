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
    { id: 'permissions', label: 'Role Permissions', module: 'settings' },
  ];

  const tabs = allTabs.filter(t => hasPermission(t.module, 'read'));
  const [activeTab, setActiveTab] = useState(() => {
    return tabs[0]?.id || 'products';
  });

  return (
    <div className="flex flex-col w-full min-h-full pb-4">
      <div className="w-full flex-1 flex flex-col">

        {/* Tab Bar */}
        <div className="bg-white dark:bg-[#1a1d23] rounded-xl shadow-sm p-1.5 border border-gray-100 dark:border-[#2a2d33] mb-4">
          <div className="flex flex-wrap items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-[13px] font-semibold rounded-lg whitespace-nowrap transition-all duration-200 border
                  ${activeTab === tab.id
                    ? 'bg-[#edf5ff] text-[#0070f3] border-[#bfdbfe] dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 shadow-sm'
                    : 'bg-transparent text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {/* {activeTab === 'general' && <GeneralSettingsTab />} */}
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