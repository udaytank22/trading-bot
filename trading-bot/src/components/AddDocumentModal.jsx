import React, { useState, useEffect } from "react";
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
  const [formData, setFormData] = useState({
    title: "",
    entityType: initialTab || "Employee",
    entityName: "",
    category: "Identity",
    status: "Valid",
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split("T")[0],
  });

  useEffect(() => {
    if (documentToEdit) {
      setFormData(documentToEdit);
    } else {
      setFormData({
        title: "",
        entityType: initialTab || "Employee",
        entityName: "",
        category: "Identity",
        status: "Valid",
        expiryDate: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        )
          .toISOString()
          .split("T")[0],
      });
    }
  }, [documentToEdit, isOpen, initialTab]);

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
          title: row.Title || row.title || row.DocumentTitle || formData.title,
          entityType:
            row.EntityType || row.entityType || row.Type || formData.entityType,
          entityName:
            row.EntityName || row.entityName || row.Name || formData.entityName,
          category: row.Category || row.category || formData.category,
          status: row.Status || row.status || "Valid",
          expiryDate:
            row.ExpiryDate || row.expiryDate || row.Date || formData.expiryDate,
        });

        Swal.fire({
          icon: "success",
          title: "Data Imported",
          text: "Document details filled from Excel.",
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
        className={`fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={handleBackdropClick}
      />

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#1e2028] border-l border-[#2a2d36] z-[101] transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2a2d36] flex justify-between items-center bg-[#1a1d23] flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-600/10">
              <svg
                className="w-5 h-5 text-purple-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {documentToEdit ? "Edit Document" : "Upload Document"}
              </h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-0.5">
                Records
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
              className="text-gray-500 hover:text-white transition-all p-2 hover:bg-white/5 rounded-full"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
        >
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
              Document Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. Driving License"
              className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white focus:border-purple-500/50 transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                Entity Type
              </label>
              <select
                name="entityType"
                value={formData.entityType}
                onChange={handleChange}
                className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white focus:border-purple-500/50 transition-all outline-none cursor-pointer"
              >
                {ENTITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white focus:border-purple-500/50 transition-all outline-none cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
              Related Name / ID
            </label>
            <input
              type="text"
              name="entityName"
              value={formData.entityName}
              onChange={handleChange}
              required
              placeholder={
                formData.entityType === "Vehicle"
                  ? "e.g. MH-01-AB-1234"
                  : "e.g. John Doe"
              }
              className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white focus:border-purple-500/50 transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white focus:border-purple-500/50 transition-all outline-none cursor-pointer"
              >
                <option value="Valid">Valid</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                Expiry Date
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                required
                className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white focus:border-purple-500/50 transition-all outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="border-2 border-dashed border-[#2a2d33] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all">
            <svg
              className="w-8 h-8 text-gray-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-white font-medium mb-1">
              Click to upload file
            </p>
            <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 5MB)</p>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-[#2a2d33] flex gap-3 bg-[#1a1d23] flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-[#2a2d33] text-gray-300 text-sm font-bold hover:bg-white/[0.05] transition-colors flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-[2] px-5 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98]"
          >
            {documentToEdit ? "Update Document" : "Save Document"}
          </button>
        </div>
      </div>
    </>
  );
}
