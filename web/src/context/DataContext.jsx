// src/context/DataContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { mockInquiries }      from '@data/mockInquiries';
import { mockSupply }         from '@data/mockSupply';
import { mockPurchaseOrders } from '@data/mockPurchaseOrders';
import { mockEmployees }      from '@data/mockEmployees';
import { mockDocuments }      from '@data/mockDocuments';
import { mockAccounts }       from '@data/mockAccounts';
import { mockInvoices }       from '@data/mockInvoices';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [inquiriesData,      setInquiriesData]      = useState(mockInquiries);
  const [supplyData,         setSupplyData]         = useState(mockSupply);
  const [purchaseOrdersData, setPurchaseOrdersData] = useState(mockPurchaseOrders);
  const [employeesData,      setEmployeesData]      = useState(mockEmployees);
  const [documentsData,      setDocumentsData]      = useState(mockDocuments);
  const [accountsData,       setAccountsData]       = useState(mockAccounts);
  const [invoicesData,       setInvoicesData]       = useState(mockInvoices);

  return (
    <DataContext.Provider value={{
      inquiriesData,      setInquiriesData,
      supplyData,         setSupplyData,
      purchaseOrdersData, setPurchaseOrdersData,
      employeesData,      setEmployeesData,
      documentsData,      setDocumentsData,
      accountsData,       setAccountsData,
      invoicesData,       setInvoicesData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
