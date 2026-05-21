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
import AccountTable from "../components/accountTable";
import AddAccountModal from "../components/addAccountModal";
import { AppContext } from "../context";
import { useToast } from "../hooks/useToast";
import { confirmAction } from "../utils/swal";
import { Toast, PageToolbar, Pagination } from "../components/ui";

// ─── Filter dropdown options ───────────────────────────────────────────────────
const FILTER_OPTIONS = [
  { value: "All",      label: "All Status" },
  { value: "Active",   label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const ITEMS_PER_PAGE = 5;

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function AccountPage() {
  // Global accounts data from AppContext
  const { accountsData, setAccountsData } = React.useContext(AppContext);

  // ── Local UI state ────────────────────────────────────────────────────────
  const [search, setSearch]             = useState("");
  const [filter, setFilter]             = useState("All");
  const [currentPage, setCurrentPage]   = useState(1);
  const [accountToEdit, setAccountToEdit] = useState(null); // null = create mode
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const { toast, showToast } = useToast();

  // ── Derived: filter accounts by search text and status ────────────────────
  const filteredData = useMemo(() => {
    return accountsData.filter((item) => {
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
  const totalPages   = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentData  = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
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
      setAccountsData((prev) => prev.filter((acc) => acc.id !== id));
      showToast("Account deleted successfully", "success");
    }
  };

  // ── Handler: save (create or update) ─────────────────────────────────────
  const handleSaveAccount = (formData) => {
    if (accountToEdit) {
      // UPDATE: preserve existing ID
      setAccountsData((prev) =>
        prev.map((acc) =>
          acc.id === accountToEdit.id ? { ...formData, id: accountToEdit.id } : acc
        )
      );
      showToast("Account updated successfully", "success");
    } else {
      // CREATE: generate sequential ID
      const newAccount = {
        ...formData,
        id: `BANK-00${accountsData.length + 1}`,
      };
      setAccountsData((prev) => [newAccount, ...prev]);
      showToast("Account added successfully", "success");
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
        onAdd={() => { setAccountToEdit(null); setIsModalOpen(true); }}
        addLabel="Add Account"
      />

      {/* ── Table card ─────────────────────────────────────────────────────── */}
      <div className="flex-1 bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <AccountTable
          items={currentData}
          onEdit={handleEdit}
          onDelete={handleDelete}
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

        {/* Centralized pagination footer */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          itemLabel="accounts"
        />
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
