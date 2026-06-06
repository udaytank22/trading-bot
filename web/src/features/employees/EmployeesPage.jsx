import { useAuth, useUI, useData } from '@context';
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
import { Toast, PageToolbar, Pagination } from '@components/ui';

// ─── Filter options for the status dropdown ────────────────────────────────────
const FILTER_OPTIONS = [
  { value: "All",      label: "All Status" },
  { value: "Active",   label: "Active" },
  { value: "Inactive", label: "Inactive" },
];



// ─── Main Page Component ───────────────────────────────────────────────────────
export default function EmployeesPage() {

  // ── Local UI state ────────────────────────────────────────────────────────
  const [search, setSearch]               = useState("");         // Search input value
  const [filter, setFilter]               = useState("All");      // Status filter
  const [isModalOpen, setIsModalOpen]     = useState(false);      // Add/Edit modal open?
  const [employeeToEdit, setEmployeeToEdit] = useState(null);     // Employee being edited (null = create mode)
  const [employeeToView, setEmployeeToView] = useState(null);     // Employee whose attendance is being viewed
  const [currentPage, setCurrentPage]     = useState(1);          // Current pagination page
  const [itemsPerPage, setItemsPerPage]   = useState(10);

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
          showToast("Employee updated successfully", "success");
          refresh();
        } else {
          showToast(res.message || "Failed to update employee", "error");
        }
      } else {
        const res = await api.employees.createEmployee(payload);
        if (res.success) {
          showToast("New employee registered", "success");
          refresh();
        } else {
          showToast(res.message || "Failed to register employee", "error");
        }
      }
    } catch (e) {
      console.error(e);
      showToast("An error occurred while saving employee details", "error");
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
          showToast("Employee record deleted", "success");
          refresh();
        } else {
          showToast(res.message || "Failed to delete employee", "error");
        }
      } catch (e) {
        console.error(e);
        showToast("An error occurred while deleting employee", "error");
      }
    }
  };

  // ── Handler: open add modal in create mode ────────────────────────────────
  const handleAdd = () => {
    setEmployeeToEdit(null); // Clear any previous edit state
    setIsModalOpen(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-full pb-4 relative">
      {/* Global toast notification */}
      <Toast message={toast.message} type={toast.type} />

      {/*
       * CENTRALIZED TOOLBAR
       * Replaces ~60 lines of manually-written search input + filter select + add button.
       * PageToolbar handles all three in a consistent flex layout.
       */}
      <PageToolbar
        search={search}
        onSearchChange={(val) => { setSearch(val); handlePageChange(1); }}
        searchPlaceholder="Search by name, email or role..."
        filterValue={filter}
        onFilterChange={(val) => { setFilter(val); handlePageChange(1); }}
        filterOptions={FILTER_OPTIONS}
        onAdd={handleAdd}
        addLabel="Add Employee"
      />

      {/* ── Grid Container ─────────────────────────────────────────────────── */}
      <div className="flex-1 w-full flex flex-col transition-colors duration-300 min-h-0 overflow-y-auto mt-4 gap-4">

        {/* Employee grid */}
        <EmployeeTable
          employees={mappedEmployees}
          onView={(emp) => setEmployeeToView(emp)}
          onEdit={(emp) => {
            setEmployeeToEdit(emp);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
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
      />
    </div>
  );
}
