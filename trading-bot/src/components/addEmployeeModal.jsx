import React, { useState, useEffect } from "react";
import { Select } from "./ui";
import { parseExcelFile } from "../utils/excelUtils";
import Swal from "sweetalert2";

const DEPARTMENTS = ["Management", "Sales", "Operations", "Finance", "Logistics", "IT"];

const ROLES = [
  "Admin",
  "Sales Executive",
  "Sourcing Manager",
  "Accountant",
  "Logistics Coordinator",
  "HR Manager",
];

const inputClass =
  "w-full h-[48px] rounded-xl px-4 text-sm bg-white dark:bg-[#0f1117] border border-gray-300 dark:border-[#2f3441] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30";

const labelClass =
  "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.18em] mb-2";

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

  const updateField = (name, value) => {
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
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);

      if (data && data.length > 0) {
        const row = data[0];

        setFormData((prev) => ({
          ...prev,
          name: row.Name || row.name || row.FullName || row.fullName || prev.name,
          email: row.Email || row.email || prev.email,
          role: row.Role || row.role || prev.role,
          department: row.Department || row.department || row.Dept || prev.department,
          status: row.Status || row.status || prev.status,
          phone: row.Phone || row.phone || row.Mobile || prev.phone,
          joiningDate:
            row.JoiningDate || row.joiningDate || row.Date || prev.joiningDate,
        }));

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
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[100]"
        onClick={handleBackdropClick}
      />

      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="
            relative w-full max-w-5xl max-h-[90vh]
            bg-white dark:bg-[#1b1d24]
            border border-gray-200 dark:border-[#2f3441]
            rounded-2xl shadow-2xl
            flex flex-col overflow-hidden
          "
        >
          <div className="px-8 py-5 border-b border-gray-200 dark:border-[#2f3441] flex justify-between items-center bg-gray-50 dark:bg-[#1f222b]">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-purple-100 dark:bg-purple-600/20 rounded-xl flex items-center justify-center border border-purple-200 dark:border-purple-500/20 shadow-lg shadow-purple-600/10">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
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
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {employeeToEdit ? "Edit Employee" : "Add New Employee"}
                </h2>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mt-1">
                  Staff Management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-600/10 border border-green-200 dark:border-green-500/25 rounded-lg text-green-700 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-green-600 hover:text-white transition-all">
                Import Excel
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelUpload}
                />
              </label>

              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-2xl leading-none"
              >
                &times;
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Arjun Sharma"
                required
              />

              <Field
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. arjun@trademind.com"
                required
              />

              <div>
                <label className={labelClass}>Department</label>
                <Select
                  variant="form"
                  value={formData.department}
                  onChange={(val) => updateField("department", val)}
                  options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                  className="w-full"
                  placeholder="Select department"
                />
              </div>

              <div>
                <label className={labelClass}>Role</label>
                <Select
                  variant="form"
                  value={formData.role}
                  onChange={(val) => updateField("role", val)}
                  options={ROLES.map((r) => ({ value: r, label: r }))}
                  className="w-full"
                  placeholder="Select role"
                />
              </div>

              <Field
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
              />

              <Field
                label="Joining Date"
                name="joiningDate"
                type="date"
                value={formData.joiningDate}
                onChange={handleChange}
              />

              <div className="md:col-span-2">
                <label className={labelClass}>Status</label>

                <div className="flex gap-6">
                  {["Active", "Inactive"].map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value={s}
                        checked={formData.status === s}
                        onChange={handleChange}
                        className="w-4 h-4 accent-purple-600"
                      />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {s}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 bg-purple-50 dark:bg-purple-600/5 border border-purple-200 dark:border-purple-500/10 rounded-2xl p-6">
                <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-3">
                  Login Credentials
                </h4>

                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                  Employees will use their work email and a default password to login.
                  Password resets can be initiated from the admin panel.
                </p>

                <label className={labelClass}>Access Level</label>
                <div className="h-[48px] flex items-center bg-white dark:bg-[#0f1117] border border-gray-300 dark:border-[#2f3441] rounded-xl px-4 text-sm text-purple-600 dark:text-purple-400 font-mono">
                  {formData.role || "Select a role to see access level"}
                </div>
              </div>
            </div>
          </form>

          <div className="px-8 py-5 border-t border-gray-200 dark:border-[#2f3441] flex gap-3 bg-gray-50 dark:bg-[#1f222b]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-gray-300 dark:border-[#2f3441] text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0f1117] text-sm font-bold hover:bg-gray-100 dark:hover:bg-[#171922] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98]"
            >
              {employeeToEdit ? "Update Employee" : "Register Employee"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}