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

import React, { useState, useContext, useMemo } from "react";

import { useToast } from '@hooks/useToast';
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

// ─── Items per page constant ───────────────────────────────────────────────────
const ITEMS_PER_PAGE = 8;

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function EmployeesPage() {
  // Global employee data from AppContext (shared across pages)
  const { employeesData, refreshAll } = useData();

  // ── Local UI state ────────────────────────────────────────────────────────
  const [search, setSearch]               = useState("");         // Search input value
  const [filter, setFilter]               = useState("All");      // Status filter
  const [isModalOpen, setIsModalOpen]     = useState(false);      // Add/Edit modal open?
  const [employeeToEdit, setEmployeeToEdit] = useState(null);     // Employee being edited (null = create mode)
  const [employeeToView, setEmployeeToView] = useState(null);     // Employee whose attendance is being viewed
  const [currentPage, setCurrentPage]     = useState(1);          // Current pagination page

  const { toast, showToast } = useToast();

  // ── Derived: filter employees by search + status ──────────────────────────
  const filteredEmployees = useMemo(() => {
    return employeesData.filter((emp) => {
      const q = search.toLowerCase();

      // Apply status filter first (short-circuit if status doesn't match)
      if (filter !== "All" && emp.status !== filter) return false;

      // Then apply text search across name, email, department, role
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q)
      );
    });
  }, [employeesData, search, filter]);

  // ── Derived: paginate the filtered results ────────────────────────────────
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

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
          refreshAll();
        } else {
          showToast(res.message || "Failed to update employee", "error");
        }
      } else {
        const res = await api.employees.createEmployee(payload);
        if (res.success) {
          showToast("New employee registered", "success");
          refreshAll();
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
          refreshAll();
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
        onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
        searchPlaceholder="Search by name, email or role..."
        filterValue={filter}
        onFilterChange={(val) => { setFilter(val); setCurrentPage(1); }}
        filterOptions={FILTER_OPTIONS}
        onAdd={handleAdd}
        addLabel="Add Employee"
      />

      {/* ── Grid Container ─────────────────────────────────────────────────── */}
      <div className="flex-1 w-full flex flex-col transition-colors duration-300 min-h-0 overflow-y-auto mt-4 gap-4">

        {/* Employee grid */}
        <EmployeeTable
          employees={currentItems}
          onView={(emp) => setEmployeeToView(emp)}
          onEdit={(emp) => {
            setEmployeeToEdit(emp);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
        />

        {/* Empty state when no employees match the filter */}
        {filteredEmployees.length === 0 && (
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
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredEmployees.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPrev={() => setCurrentPage((p) => p - 1)}
            onNext={() => setCurrentPage((p) => p + 1)}
            onPageChange={(p) => setCurrentPage(p)}
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
