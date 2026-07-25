import { TOAST_MESSAGES } from '../../constants/toastMessages';
import { useAuth } from '@context';
import { useTablePageSize } from '@hooks/useTablePageSize';
import { api } from '@services/api';
/**
 * @file EmployeesPage.jsx
 * @description Employee management page — list, add, edit, delete, view attendance.
 *
 * CENTRALIZED COMPONENTS USED:
 *   - PageToolbar     → search + status filter + "Add Employee" button (replaces ~60 lines)
 *   - Pagination      → Previous/Next footer with item count (replaces ~30 lines)
 *   - Toast           → success/error notifications
 *   - EmployeeTable   → table with View/Edit/Delete icon actions
 *   - EmployeeViewModal → attendance calendar modal
 *   - AddEmployeeModal  → create/edit form modal
 *
 * DATA FLOW:
 *   AppContext.employeesData → useMemo(filter) → useMemo(paginate) → EmployeeTable
 *
 * @author TradeMind Dev Team
 */

import React, { useState, useMemo } from "react";

import { useToast } from '@hooks/useToast';
import { usePaginatedFetch } from '@hooks/usePaginatedFetch';
import EmployeeTable from './components/EmployeeTable';
import AddEmployeeModal from './modals/AddEmployeeModal';
import EmployeeViewModal from './modals/EmployeeViewModal';
import { confirmAction } from '@utils/swal';
import { Toast, PageToolbar, Pagination, PageContainer } from '@components/ui';

// ─── Filter options for the status dropdown ────────────────────────────────────
const FILTER_OPTIONS = [
  { value: "All", label: "All Status" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];



// ─── Main Page Component ───────────────────────────────────────────────────────
export default function EmployeesPage() {

  // ── Local UI state ────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");         // Search input value
  const [filter, setFilter] = useState("All");      // Status filter
  const [isModalOpen, setIsModalOpen] = useState(false);      // Add/Edit modal open?
  const [employeeToEdit, setEmployeeToEdit] = useState(null);     // Employee being edited (null = create mode)
  const [employeeToView, setEmployeeToView] = useState(null);     // Employee whose attendance is being viewed
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useTablePageSize(50);

  const { toast, showToast } = useToast();

  const {
    data: employeesData,
    meta,
    loading,
    handlePageChange,
    handlePageSizeChange,
    refresh
  } = usePaginatedFetch(api.employees.getEmployees, 1, 10, {
    search,
    status: filter === 'All' ? undefined : filter
  });

  const mappedEmployees = useMemo(() => {
    return (employeesData || []).map(emp => ({
      ...emp,
      name: emp.fullName || emp.name || '',
      role: emp.designation || emp.role || '',
      status: emp.status === 'ACTIVE' ? 'Active' : (emp.status === 'INACTIVE' ? 'Inactive' : (emp.status || 'Active')),
      avatar: (emp.fullName || emp.name || '')
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }));
  }, [employeesData]);

  // ── Handler: add new or update existing employee ──────────────────────────
  const handleAddOrEdit = async (formData) => {
    try {
      const payload = {
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        department: formData.department || '',
        designation: formData.role || '',
        status: formData.status === 'Active' ? 'ACTIVE' : 'INACTIVE',
        joiningDate: formData.joiningDate
      };

      if (employeeToEdit) {
        const res = await api.employees.updateEmployee(employeeToEdit.id, payload);
        if (res.success) {
          showToast(TOAST_MESSAGES.EMPLOYEES.UPDATED, "success");
          refresh();
        } else {
          showToast(res.message || TOAST_MESSAGES.EMPLOYEES.UPDATE_ERROR, "error");
        }
      } else {
        const res = await api.employees.createEmployee(payload);
        if (res.success) {
          showToast(TOAST_MESSAGES.EMPLOYEES.REGISTERED, "success");
          refresh();
        } else {
          showToast(res.message || TOAST_MESSAGES.EMPLOYEES.REGISTER_ERROR, "error");
        }
      }
    } catch (e) {
      console.error(e);
      showToast(TOAST_MESSAGES.EMPLOYEES.SAVE_ERROR, "error");
    }
    // Reset modal state after save
    setIsModalOpen(false);
    setEmployeeToEdit(null);
  };

  // ── Handler: confirm-then-delete an employee ──────────────────────────────
  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: "Remove Employee?",
      text: "Are you sure you want to remove this employee?",
      confirmButtonText: "Yes, remove them!",
    });

    if (isConfirmed) {
      try {
        const res = await api.employees.deleteEmployee(id);
        if (res.success) {
          showToast(TOAST_MESSAGES.EMPLOYEES.DELETED, "success");
          refresh();
        } else {
          showToast(res.message || TOAST_MESSAGES.EMPLOYEES.DELETE_ERROR, "error");
        }
      } catch (e) {
        console.error(e);
        showToast(TOAST_MESSAGES.EMPLOYEES.DELETE_SYSTEM_ERROR, "error");
      }
    }
  };

  // ── Handler: open add modal in create mode ────────────────────────────────
  const handleAdd = () => {
    setEmployeeToEdit(null); // Clear any previous edit state
    setIsModalOpen(true);
  };

  const { hasPermission } = useAuth();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageContainer
      title="Employees"
      subtitle="Everyone with access to TradeMind."
    >
      {/* Global toast notification */}
      <Toast message={toast.message} type={toast.type} />

      {/* Custom Mockup-aligned Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Left: Search + Status Dropdown */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); handlePageChange(1); }}
              placeholder="Search name, email or role..."
              className="pl-9 pr-4 py-2.5 w-[280px] bg-white dark:bg-[#16191f] border border-[#E6DFD5] dark:border-[#2c303b] text-gray-800 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A5D5E]/20 focus:border-[#0A5D5E] transition-all"
            />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value); handlePageChange(1); }}
              className="appearance-none pl-3.5 pr-9 py-2.5 bg-white dark:bg-[#16191f] border border-[#E6DFD5] dark:border-[#2c303b] text-gray-800 dark:text-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0A5D5E]/20 focus:border-[#0A5D5E] transition-all cursor-pointer min-w-[130px]"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label === "All Status" ? "All status" : opt.label}
                </option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 15 3.75 3.75 3.75-3.75m0-6L12 5.25 8.25 9" />
              </svg>
            </span>
          </div>
        </div>

        {/* Right: Add Employee Button */}
        {hasPermission('employees', 'create') && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0A5D5E] hover:bg-[#084D4F] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add employee
          </button>
        )}
      </div>


      {/* ── Grid Container ─────────────────────────────────────────────────── */}
      <div className="flex-1 w-full flex flex-col transition-colors duration-300 min-h-0 overflow-y-auto mt-4 gap-4">

        {/* Employee grid */}
        <EmployeeTable
          employees={mappedEmployees}
          onView={(emp) => setEmployeeToView(emp)}
          onEdit={hasPermission('employees', 'update') ? (emp) => {
            setEmployeeToEdit(emp);
            setIsModalOpen(true);
          } : undefined}
          onDelete={hasPermission('employees', 'delete') ? handleDelete : undefined}
        />

        {/* Empty state when no employees match the filter */}
        {mappedEmployees.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center mb-4 border border-gray-200 dark:border-gray-700/50">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No employees match your search.</p>
            <button
              onClick={() => { setSearch(""); setFilter("All"); }}
              className="text-purple-500 text-sm font-bold mt-2 hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/*
         * CENTRALIZED PAGINATION
         */}
        <div className="mt-auto bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden shadow-sm">
          <Pagination
            currentPage={meta.currentPage}
            totalPages={meta.totalPages}
            totalItems={meta.totalItems}
            itemsPerPage={meta.pageSize}
            onPrev={() => handlePageChange(meta.currentPage - 1)}
            onNext={() => handlePageChange(meta.currentPage + 1)}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handlePageSizeChange}
            itemLabel="employees"
          />
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Add / Edit employee form modal */}
      <AddEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddOrEdit}
        employeeToEdit={employeeToEdit}
      />

      {/* Attendance calendar view modal */}
      <EmployeeViewModal
        isOpen={!!employeeToView}
        onClose={() => setEmployeeToView(null)}
        employee={employeeToView}
        onRefresh={refresh}
      />
    </PageContainer>
  );
}
