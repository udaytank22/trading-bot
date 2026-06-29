import { TOAST_MESSAGES } from '../../constants/toastMessages';
import { useAuth, useUI } from '@context';
import { useAccounts } from '@hooks/queries';
import { useTablePageSize } from '@hooks/useTablePageSize';
import { api } from '@services/api';
/**
 * @file AccountPage.jsx
 * @description Bank Accounts management page — list, add, edit, delete accounts.
 *
 * CENTRALIZED COMPONENTS USED:
 *   - PageToolbar  → search + status filter + "Add Account" button
 *   - Pagination   → Previous/Next with item count
 *   - Toast        → success/error feedback
 *   - AccountTable → table with Edit/Delete icon actions
 *
 * DATA FLOW:
 *   AppContext.accountsData → useMemo(filter+search) → paginate → AccountTable
 *
 * @author TradeMind Dev Team
 */

import React, { useMemo, useState } from "react";
import AccountTable from './components/AccountTable';
import AddAccountModal from './modals/AddAccountModal';

import { useToast } from '@hooks/useToast';
import { confirmAction } from '@utils/swal';
import { Toast, PageToolbar, Pagination } from '@components/ui';

// ─── Filter dropdown options ───────────────────────────────────────────────────
const FILTER_OPTIONS = [
  { value: "All",      label: "All Status" },
  { value: "Active",   label: "Active" },
  { value: "Inactive", label: "Inactive" },
];



// ─── Main Page Component ───────────────────────────────────────────────────────
export default function AccountPage() {
  // Global accounts data from AppContext
  const { data: accountsData, refetch: refreshAll } = useAccounts();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('bankAccounts', 'create');
  const canUpdate = hasPermission('bankAccounts', 'update');
  const canDelete = hasPermission('bankAccounts', 'delete');

  // ── Local UI state ────────────────────────────────────────────────────────
  const [search, setSearch]             = useState("");
  const [filter, setFilter]             = useState("All");
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useTablePageSize(50);
  const [accountToEdit, setAccountToEdit] = useState(null); // null = create mode
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const { toast, showToast } = useToast();

  // ── Derived: filter accounts by search text and status ────────────────────
  const filteredData = useMemo(() => {
    return (accountsData || []).filter((item) => {
      // Apply status filter
      if (filter !== "All" && item.status !== filter) return false;

      // Apply text search across ID, bank name, account name, number, currency
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        item.id.toLowerCase().includes(q) ||
        item.bankName.toLowerCase().includes(q) ||
        item.accountName.toLowerCase().includes(q) ||
        item.accountNumber.toLowerCase().includes(q) ||
        item.currency.toLowerCase().includes(q)
      );
    });
  }, [accountsData, search, filter]);

  // ── Derived: paginate filtered results ────────────────────────────────────
  const totalPages   = Math.ceil(filteredData.length / itemsPerPage);
  const currentData  = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ── Handler: open edit modal ──────────────────────────────────────────────
  const handleEdit = (acc) => {
    setAccountToEdit(acc);
    setIsModalOpen(true);
  };

  // ── Handler: confirm-then-delete ──────────────────────────────────────────
  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: "Delete Account?",
      text: "Are you sure? This action cannot be undone.",
      confirmButtonText: "Yes, delete it!",
    });
    if (isConfirmed) {
      try {
        const res = await api.bankAccounts.deleteBankAccount(id);
        if (res.success) {
          showToast(TOAST_MESSAGES.ACCOUNTS.DELETED, "success");
          refreshAll();
        } else {
          showToast(res.message || TOAST_MESSAGES.ACCOUNTS.DELETE_ERROR, "error");
        }
      } catch (e) {
        console.error(e);
        showToast("An error occurred while deleting bank account", "error");
      }
    }
  };

  // ── Handler: save (create or update) ─────────────────────────────────────
  const handleSaveAccount = async (formData) => {
    try {
      const payload = {
        bankName: formData.bankName,
        accountHolderName: formData.accountName,
        accountNumber: formData.accountNumber,
        routingNumber: formData.routingNumber,
        currency: formData.currency,
        status: formData.status === 'Active' ? 'ACTIVE' : 'INACTIVE'
      };

      if (accountToEdit) {
        const res = await api.bankAccounts.updateBankAccount(accountToEdit.id, payload);
        if (res.success) {
          showToast("Account updated successfully", "success");
          refreshAll();
        } else {
          showToast(res.message || "Failed to update bank account", "error");
        }
      } else {
        const res = await api.bankAccounts.createBankAccount(payload);
        if (res.success) {
          showToast("Account added successfully", "success");
          refreshAll();
        } else {
          showToast(res.message || "Failed to add bank account", "error");
        }
      }
    } catch (e) {
      console.error(e);
      showToast("An error occurred while saving bank account", "error");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-full pb-4">
      <Toast message={toast.message} type={toast.type} />

      {/* Centralized toolbar: search + filter + Add Account button */}
      <PageToolbar
        search={search}
        onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
        searchPlaceholder="Search Bank, Account, Currency..."
        filterValue={filter}
        onFilterChange={(val) => { setFilter(val); setCurrentPage(1); }}
        filterOptions={FILTER_OPTIONS}
        onAdd={canCreate ? () => { setAccountToEdit(null); setIsModalOpen(true); } : undefined}
        addLabel="Add Account"
      />

      {/* ── Table card ─────────────────────────────────────────────────────── */}
      <div className="flex-1 bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <AccountTable
          items={currentData}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          paginationProps={filteredData.length > 0 ? {
            currentPage,
            totalPages,
            totalItems: filteredData.length,
            itemsPerPage,
            onPrev: () => setCurrentPage((p) => Math.max(1, p - 1)),
            onNext: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
            onPageChange: (p) => setCurrentPage(p),
            onItemsPerPageChange: (val) => { setItemsPerPage(val); setCurrentPage(1); },
            itemLabel: "accounts"
          } : undefined}
        />

        {/* Empty state */}
        {filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg font-medium">No accounts found</p>
            <p className="text-sm mt-1 opacity-75">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Account modal */}
      <AddAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveAccount}
        accountToEdit={accountToEdit}
      />
    </div>
  );
}
