import React, { useState, useEffect } from "react";
import { Select, Field, Modal, DatePicker } from '@components/ui';
import { parseExcelFile } from '@utils/excelUtils';
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



  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    try {
      const data = await parseExcelFile(file);

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
        toast: true, position: 'top-end', icon: 'success',
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? "Edit Employee" : "Add New Employee"}
      subtitle="Staff Management"
      onSubmit={handleSubmit}
      submitLabel={employeeToEdit ? "Update Employee" : "Register Employee"}
      cancelLabel="Cancel"
      onExcelUpload={handleExcelUpload}
      maxWidthClass="max-w-5xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          labelClassName={labelCls}
        />

        <Field
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          labelClassName={labelCls}
        />

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

        <Field
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          labelClassName={labelCls}
        />

        <DatePicker
          label="Joining Date"
          name="joiningDate"
          value={formData.joiningDate}
          onChange={handleChange}
          labelClassName={labelCls}
        />

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

        <div className="md:col-span-2 bg-purple-500/5 border border-purple-500/10 rounded-2xl p-6 mt-2">
          <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">
            Login Credentials
          </h4>

          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            Employees will use their work email and a default password to login.
            Password resets can be initiated from the admin panel.
          </p>

          <label className={labelCls}>Access Level</label>
          <div className="h-[35px] flex items-center bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-4 text-sm text-purple-400 font-mono">
            {formData.role || "Select a role to see access level"}
          </div>
        </div>
      </div>
    </Modal>
  );
}
