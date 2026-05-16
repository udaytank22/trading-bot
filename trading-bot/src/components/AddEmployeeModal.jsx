import React, { useState, useEffect } from "react";
import { parseExcelFile } from "../utils/excelUtils";
import Swal from "sweetalert2";

const DEPARTMENTS = [
  "Management",
  "Sales",
  "Operations",
  "Finance",
  "Logistics",
  "IT",
];
const ROLES = [
  "Admin",
  "Sales Executive",
  "Sourcing Manager",
  "Accountant",
  "Logistics Coordinator",
  "HR Manager",
];

export default function AddEmployeeModal({
  isOpen,
  onClose,
  onSubmit,
  employeeToEdit,
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    status: "Active",
    phone: "",
    joiningDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (employeeToEdit) {
      setFormData(employeeToEdit);
    } else {
      setFormData({
        name: "",
        email: "",
        role: "",
        department: "",
        status: "Active",
        phone: "",
        joiningDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [employeeToEdit, isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      if (data && data.length > 0) {
        const row = data[0];
        setFormData({
          ...formData,
          name:
            row.Name ||
            row.name ||
            row.FullName ||
            row.fullName ||
            formData.name,
          email: row.Email || row.email || formData.email,
          role: row.Role || row.role || formData.role,
          department:
            row.Department || row.department || row.Dept || formData.department,
          status: row.Status || row.status || "Active",
          phone: row.Phone || row.phone || row.Mobile || formData.phone,
          joiningDate:
            row.JoiningDate ||
            row.joiningDate ||
            row.Date ||
            formData.joiningDate,
        });

        Swal.fire({
          icon: "success",
          title: "Data Imported",
          text: "Employee data filled from Excel.",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }
    } catch (error) {
      console.error("Excel parse error:", error);
      Swal.fire({
        icon: "error",
        title: "Import Failed",
        text: "Failed to parse Excel file.",
      });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={handleBackdropClick}
      />

      {/* Side Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xl bg-white dark:bg-[#1e2028] border-l border-gray-200 dark:border-[#2a2d36] z-[101] transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-200 dark:border-[#2a2d36] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-600/10">
              <svg
                className="w-6 h-6 text-purple-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {employeeToEdit ? "Edit Employee" : "Add New Employee"}
              </h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-0.5">
                Staff Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1.5 bg-green-600/10 border border-green-500/20 rounded-lg text-green-500 text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-green-600/20 transition-all">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Import Excel
              <input
                type="file"
                className="hidden"
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelUpload}
              />
            </label>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-all p-2 hover:bg-white/5 rounded-full text-2xl leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar"
        >
          {/* General Information */}
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Arjun Sharma"
                className="w-full bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-purple-500/50 transition-all outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="e.g. arjun@trademind.com"
                className="w-full bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-purple-500/50 transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-purple-500/50 transition-all outline-none cursor-pointer"
                >
                  <option value="">Select Dept</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-purple-500/50 transition-all outline-none cursor-pointer"
                >
                  <option value="">Select Role</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-purple-500/50 transition-all outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                  Joining Date
                </label>
                <input
                  type="date"
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  className="w-full bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-purple-500/50 transition-all outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                Status
              </label>
              <div className="flex gap-4">
                {["Active", "Inactive"].map((s) => (
                  <label
                    key={s}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <div className="relative flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value={s}
                        checked={formData.status === s}
                        onChange={handleChange}
                        className="peer w-5 h-5 rounded-full border-gray-200 dark:border-[#2a2d33] bg-gray-100 dark:bg-[#0c0e12] text-purple-600 focus:ring-0 transition-all cursor-pointer appearance-none border"
                      />
                      <div className="absolute w-2 h-2 bg-purple-500 rounded-full left-1.5 opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span
                      className={`text-sm font-medium ${formData.status === s ? "text-white" : "text-gray-500"} transition-colors`}
                    >
                      {s}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-purple-600/5 border border-purple-500/10 rounded-2xl p-6">
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Login Credentials
            </h4>
            <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
              Employees will use their work email and a default password to
              login. Password resets can be initiated from the admin panel.
            </p>
            <div className="flex flex-col gap-2 opacity-60">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                Access Level
              </label>
              <div className="bg-gray-100 dark:bg-[#0c0e12] rounded-lg px-4 py-2.5 text-[11px] text-purple-400 font-mono">
                {formData.role || "Select a role to see access level"}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-200 dark:border-[#2a2d33] flex gap-3 bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-200 dark:border-[#2a2d33] text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98]"
          >
            {employeeToEdit ? "Update Employee" : "Register Employee"}
          </button>
        </div>
      </div>
    </>
  );
}
