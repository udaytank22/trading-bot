import React, { useMemo, useState } from "react";
import Tooltip from "../components/ui/Tooltip";
import AccountTable from "../components/AccountTable";
import AddAccountModal from "../components/AddAccountModal";
import { AppContext } from "../context";
import { useToast } from "../hooks/useToast";
import Toast from "../components/ui/Toast";
import { confirmAction } from "../utils/swal";

export default function AccountPage() {
  const { accountsData, setAccountsData } = React.useContext(AppContext);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const { toast, showToast } = useToast();

  /* Modal State */
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* Search & Filter */
  const filteredData = useMemo(() => {
    let result = accountsData.filter((item) => {
      const q = search.toLowerCase();

      // Status Filter
      if (filter !== "All" && item.status !== filter) {
        return false;
      }

      // Search Query
      if (q) {
        return (
          item.id.toLowerCase().includes(q) ||
          item.bankName.toLowerCase().includes(q) ||
          item.accountName.toLowerCase().includes(q) ||
          item.accountNumber.toLowerCase().includes(q) ||
          item.currency.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return result;
  }, [accountsData, search, filter]);

  /* Pagination */
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /* Handlers */
  const handleEdit = (acc) => {
    setAccountToEdit(acc);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Delete Account?',
      text: "Are you sure you want to delete this account? This action cannot be undone.",
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (isConfirmed) {
      setAccountsData((prev) => prev.filter((acc) => acc.id !== id));
      showToast("Account deleted successfully", "success");
    }
  };

  const handleSaveAccount = (formData) => {
    if (accountToEdit) {
      setAccountsData((prev) =>
        prev.map((acc) => (acc.id === accountToEdit.id ? { ...formData, id: accountToEdit.id } : acc))
      );
      showToast("Account updated successfully", "success");
    } else {
      const newAccount = {
        ...formData,
        id: `BANK-00${accountsData.length + 1}`
      };
      setAccountsData((prev) => [newAccount, ...prev]);
      showToast("Account added successfully", "success");
    }
  };

  return (
    <div className="flex flex-col w-full h-full pb-8">
      <Toast message={toast.message} type={toast.type} />

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 mt-2">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-[320px]">
            <svg
              className="absolute left-3.5 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search Bank, Account, Currency..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl h-10 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors shadow-sm"
            />
          </div>

          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl h-10 px-4 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-purple-500 cursor-pointer shadow-sm appearance-none pr-8 relative"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3e%3c/path%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            setAccountToEdit(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/20 active:scale-95 flex items-center justify-center gap-2 font-bold text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Account
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
        <AccountTable
          items={currentData}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg font-medium">No accounts found</p>
            <p className="text-sm mt-1 opacity-75">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Showing <span className="text-gray-900 dark:text-white font-bold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
            <span className="text-gray-900 dark:text-white font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}</span> of{" "}
            <span className="text-gray-900 dark:text-white font-bold">{filteredData.length}</span> results
          </div>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 border border-gray-200 dark:border-[#2a2d33] rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 border border-gray-200 dark:border-[#2a2d33] rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveAccount}
        accountToEdit={accountToEdit}
      />
    </div>
  );
}
