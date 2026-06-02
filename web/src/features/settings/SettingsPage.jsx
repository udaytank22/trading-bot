import React, { useState } from 'react';
import AccountPage from '@features/accounts/AccountPage';

import ProductsTab from './components/ProductsTab';
import ClientsTab from './components/ClientsTab';
import VendorsTab from './components/VendorsTab';
import DocumentsTab from './components/DocumentsTab';
import ReportingTab from './components/ReportingTab';
import RolePermissionsTab from './components/RolePermissionsTab';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('products');

  const tabs = [
    // { id: 'general', label: 'General' },
    { id: 'products', label: 'Products' },
    { id: 'clients', label: 'Clients' },
    { id: 'vendors', label: 'Vendors' },
    { id: 'documents', label: 'Documents' },
    { id: 'reporting', label: 'Reporting' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'permissions', label: 'Role Permissions' },
  ];

  return (
    <div className="flex flex-col w-full h-full pb-4">
      <div className="w-full flex-1 flex flex-col mt-4">

        {/* Tab Bar */}
        <div className="bg-white dark:bg-[#1a1d23] rounded-2xl shadow-sm p-2 border border-gray-100 dark:border-[#2a2d33] mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none min-w-[120px] px-4 py-2.5 text-[13px] font-semibold rounded-xl whitespace-nowrap transition-all duration-200 border
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
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'reporting' && <ReportingTab />}
        {activeTab === 'accounts' && <AccountPage />}
        {activeTab === 'permissions' && <RolePermissionsTab />}
      </div>
    </div>
  );
}