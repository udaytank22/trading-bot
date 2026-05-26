import React, { useState, useEffect } from "react";
import { Select } from "./ui";
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

const inputCls =
  "w-full bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition-all";

const labelCls =
  "text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 ml-1";

export default function AddEmployeeModal({
  isOpen,
  onClose,
  onSubmit,
  employeeToEdit,
}) {
  const defaultData = {
    name: "",
    email: "",
    role: "",
    department: "",
    status: "Active",
    phone: "",
    joiningDate: new Date().toISOString().split("T")[0],
  };

  const [formData, setFormData] = useState(defaultData);

  useEffect(() => {
    if (employeeToEdit) {
      setFormData(employeeToEdit);
    } else {
      setFormData(defaultData);
    }
  }, [employeeToEdit, isOpen]);

  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", esc);

    return () => window.removeEventListener("keydown", esc);
  }, []);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      const row = data[0];

      setFormData((prev) => ({
        ...prev,
        name: row.Name || prev.name,
        email: row.Email || prev.email,
        role: row.Role || prev.role,
        department: row.Department || prev.department,
        phone: row.Phone || prev.phone,
      }));

      Swal.fire({
        icon: "success",
        title: "Imported",
        text: "Excel imported successfully",
        toast: true,
        position: "top-end",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Import Failed",
      });
    }
  };

  return (
    <>
      {/* BACKDROP */}

      <div
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
      />

      {/* MODAL */}

      <div className="fixed inset-0 z-[101] flex items-center justify-center p-5">
        <div className="w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden border border-[#2a2d36] bg-white dark:bg-[#1e2028] shadow-2xl flex flex-col">
          {/* HEADER */}

          <div className="px-8 py-5 border-b border-[#2a2d36] bg-gray-50 dark:bg-[#1a1d23] flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0
                    4 4 0 018 0zM12
                    14a7 7 0 00-7
                    7h14a7 7 0
                    00-7-7z"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">
                  {employeeToEdit ? "Edit Employee" : "Add New Employee"}
                </h2>

                <p className="text-xs tracking-[0.25em] uppercase text-gray-500">
                  Staff Management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                Import Excel
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelUpload}
                />
              </label>

              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-white/5 text-gray-500 text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* BODY */}

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Full Name</label>

                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Email</label>

                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelCls}>Department</label>

                <Select
                  variant="form"
                  value={formData.department}
                  onChange={(val) =>
                    handleChange({
                      target: {
                        name: "department",
                        value: val,
                      },
                    })
                  }
                  options={DEPARTMENTS.map((d) => ({
                    value: d,
                    label: d,
                  }))}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelCls}>Role</label>

                <Select
                  variant="form"
                  value={formData.role}
                  onChange={(val) =>
                    handleChange({
                      target: {
                        name: "role",
                        value: val,
                      },
                    })
                  }
                  options={ROLES.map((r) => ({
                    value: r,
                    label: r,
                  }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className={labelCls}>Phone</label>

                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Joining Date</label>

                <input
                  type="date"
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelCls}>Status</label>

                <Select
                  variant="form"
                  value={formData.status}
                  onChange={(val) =>
                    handleChange({
                      target: {
                        name: "status",
                        value: val,
                      },
                    })
                  }
                  options={[
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                  ]}
                  className="w-full"
                />
              </div>
            </div>
          </form>

          {/* FOOTER */}

          <div className="px-8 py-5 border-t border-[#2a2d36] bg-[#1a1d23] flex justify-end gap-4">
            <button onClick={onClose} className="px-6 py-3 border rounded-xl">
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-purple-600 rounded-xl text-white font-bold hover:bg-purple-500"
            >
              {employeeToEdit ? "Update Employee" : "Register Employee"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
