import React, { useState, useEffect } from "react";
import { Select } from "./ui";
import { parseExcelFile } from "../utils/excelUtils";
import Swal from "sweetalert2";

const CATEGORIES = [
  "Identity",
  "Registration",
  "Insurance",
  "Legal",
  "Financial",
  "Other",
];

const ENTITY_TYPES = ["Employee", "Vehicle", "Company"];

export default function AddDocumentModal({
  isOpen,
  onClose,
  onSubmit,
  documentToEdit,
  initialTab,
}) {
  const defaultForm = {
    title: "",
    entityType: initialTab || "Employee",
    entityName: "",
    category: "Identity",
    status: "Valid",
    expiryDate: new Date(
      new Date().setFullYear(new Date().getFullYear() + 1)
    )
      .toISOString()
      .split("T")[0],
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (documentToEdit) {
      setFormData(documentToEdit);
    } else {
      setFormData({
        ...defaultForm,
        entityType: initialTab || "Employee",
      });
    }
  }, [documentToEdit, isOpen, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();

    onSubmit(formData);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    try {
      const data = await parseExcelFile(file);

      if (data?.length > 0) {
        const row = data[0];

        setFormData((prev) => ({
          ...prev,
          title:
            row.Title ||
            row.title ||
            row.DocumentTitle ||
            prev.title,

          entityType:
            row.EntityType ||
            row.entityType ||
            row.Type ||
            prev.entityType,

          entityName:
            row.EntityName ||
            row.entityName ||
            row.Name ||
            prev.entityName,

          category:
            row.Category ||
            row.category ||
            prev.category,

          status:
            row.Status ||
            row.status ||
            "Valid",

          expiryDate:
            row.ExpiryDate ||
            row.expiryDate ||
            row.Date ||
            prev.expiryDate,
        }));

        Swal.fire({
          icon: "success",
          title: "Data Imported",
          text: "Document details filled from Excel",
          toast: true,
          timer: 2000,
          position: "top-end",
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Import Failed",
        text: "Failed to parse Excel file",
      });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-black/60 z-[100]"
      />

      {/* Sidebar Modal */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#1e2028] border-l border-gray-200 dark:border-[#2a2d36] z-[101] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2d36] flex items-center justify-between bg-gray-50 dark:bg-[#1a1d23]">

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/20 flex items-center justify-center">
              📄
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {documentToEdit
                  ? "Edit Document"
                  : "Upload Document"}
              </h2>

              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <label className="cursor-pointer px-3 py-2 rounded-lg text-xs font-bold border border-green-500/20 bg-green-500/10 text-green-600 hover:bg-green-500/20">

              Import Excel

              <input
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
              />
            </label>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/5 flex items-center justify-center"
            >
              ✕
            </button>

          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Document Title
            </label>

            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="Driving License"
              className="w-full mt-2 rounded-lg border px-4 py-3 bg-gray-100 dark:bg-[#0c0e12]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Entity Type
              </label>

              <Select
                variant="form"
                value={formData.entityType}
                onChange={(val) =>
                  handleChange({
                    target: {
                      name: "entityType",
                      value: val,
                    },
                  })
                }
                options={ENTITY_TYPES.map((i) => ({
                  value: i,
                  label: i,
                }))}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Category
              </label>

              <Select
                variant="form"
                value={formData.category}
                onChange={(val) =>
                  handleChange({
                    target: {
                      name: "category",
                      value: val,
                    },
                  })
                }
                options={CATEGORIES.map((i) => ({
                  value: i,
                  label: i,
                }))}
              />
            </div>

          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Related Name / ID
            </label>

            <input
              type="text"
              required
              name="entityName"
              value={formData.entityName}
              onChange={handleChange}
              className="w-full mt-2 rounded-lg border px-4 py-3 bg-gray-100 dark:bg-[#0c0e12]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Status
              </label>

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
                  { value: "Valid", label: "Valid" },
                  {
                    value: "Expiring Soon",
                    label: "Expiring Soon",
                  },
                  { value: "Expired", label: "Expired" },
                ]}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Expiry Date
              </label>

              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full mt-2 rounded-lg border px-4 py-3 bg-gray-100 dark:bg-[#0c0e12]"
              />
            </div>

          </div>

          <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-purple-500">

            <p className="font-medium">
              Click to upload file
            </p>

            <p className="text-xs text-gray-500">
              PDF, JPG, PNG (Max 5MB)
            </p>

          </div>

        </form>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-200 dark:border-[#2a2d33] flex gap-3">

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="flex-[2] py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-semibold"
          >
            {documentToEdit
              ? "Update Document"
              : "Save Document"}
          </button>

        </div>

      </div>
    </>
  );
}