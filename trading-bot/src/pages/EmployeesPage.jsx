import React, { useState, useContext, useMemo } from "react";
import { AppContext } from "../context";
import { useToast } from "../hooks/useToast";
import EmployeeTable from "../components/EmployeeTable";
import AddEmployeeModal from "../components/AddEmployeeModal";
import Toast from "../components/ui/Toast";
import { confirmAction } from "../utils/swal";

export default function EmployeesPage() {
  const { employeesData, setEmployeesData } = useContext(AppContext);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const { toast, showToast } = useToast();

  const filteredEmployees = useMemo(() => {
    return employeesData.filter(emp => {
      const q = search.toLowerCase();
      
      // Status Filter
      if (filter !== "All" && emp.status !== filter) {
        return false;
      }

      // Search Filter
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q)
      );
    });
  }, [employeesData, search, filter]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  const handleAddOrEdit = (formData) => {
    if (employeeToEdit) {
      setEmployeesData(prev => 
        prev.map(emp => emp.id === employeeToEdit.id ? { ...formData, id: emp.id } : emp)
      );
      showToast("Employee updated successfully", "success");
    } else {
      const newEmp = {
        ...formData,
        id: `EMP-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        avatar: formData.name.split(' ').map(n => n[0]).join('').toUpperCase()
      };
      setEmployeesData(prev => [newEmp, ...prev]);
      showToast("New employee registered", "success");
    }
    setIsModalOpen(false);
    setEmployeeToEdit(null);
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Remove Employee?',
      text: "Are you sure you want to remove this employee?",
      confirmButtonText: 'Yes, remove them!'
    });

    if (isConfirmed) {
      setEmployeesData(prev => prev.filter(emp => emp.id !== id));
      showToast("Employee record deleted", "success");
    }
  };

  const startShowing = filteredEmployees.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endShowing = Math.min(currentPage * ITEMS_PER_PAGE, filteredEmployees.length);

  return (
    <div className="flex flex-col w-full h-full pb-8 relative gap-6">
      <Toast message={toast.message} type={toast.type} />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative w-[340px]">
            <svg
              className="absolute left-3.5 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email or role..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-lg h-10 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors shadow-sm"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-lg h-10 pl-4 pr-11 text-sm text-gray-700 dark:text-gray-300 font-medium focus:outline-none focus:border-purple-500 transition-colors cursor-pointer shadow-sm hover:border-gray-300 dark:hover:border-gray-600"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <svg
              className="absolute right-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>
        </div>

        <button
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-lg active:scale-95 transform whitespace-nowrap flex-shrink-0 flex items-center gap-2 font-bold text-sm"
          onClick={() => {
            setEmployeeToEdit(null);
            setIsModalOpen(true);
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
        </button>
      </div>

      {/* Table Section */}
      <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden flex flex-col shadow-lg transition-colors duration-300">
        <EmployeeTable 
          employees={currentItems}
          onEdit={(emp) => {
            setEmployeeToEdit(emp);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
        />
        
        {filteredEmployees.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/50 dark:bg-[#0c0e12]/10 min-h-[400px]">
            <div className="w-16 h-16 bg-gray-200/50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center mb-4 border border-gray-300/50 dark:border-gray-700/50">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No employees found matching your search.</p>
            <button onClick={() => { setSearch(""); setFilter("All"); }} className="text-purple-500 text-sm font-bold mt-2 hover:underline transition-all">Clear All Filters</button>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-[#2a2d33] bg-gray-50/50 dark:bg-[#0c0e12]/30">
          <span className="text-sm text-gray-500 font-medium">
            Showing{" "}
            <span className="text-gray-700 dark:text-gray-300 mx-0.5">
              {startShowing}–{endShowing}
            </span>{" "}
            of{" "}
            <span className="text-gray-700 dark:text-gray-300 mx-0.5">
              {filteredEmployees.length}
            </span>{" "}
            employees
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1 || filteredEmployees.length === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-4 py-2 border border-gray-200 dark:border-[#2a2d33] rounded-lg text-sm text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Previous
            </button>
            <button
              disabled={currentPage === totalPages || filteredEmployees.length === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-4 py-2 border border-gray-200 dark:border-[#2a2d33] rounded-lg text-sm text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <AddEmployeeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddOrEdit}
        employeeToEdit={employeeToEdit}
      />
    </div>
  );
}
