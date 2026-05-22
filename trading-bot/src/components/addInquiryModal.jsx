import React, { useState, useEffect } from "react";
import { Select } from "./ui";
import { parseExcelFile } from "../utils/excelUtils";
import Swal from "sweetalert2";

const CUSTOMERS = [
  "Shree Ganesha Enterprises",
  "Om Sai Manufacturing",
  "Balaji Impex",
  "Krishna Engineering Works",
  "Saraswati Textiles",
  "Prakash Industrial Supplies",
  "Venkateswara Metals",
  "Shiv Shakti Hardware",
];

const SALESPEOPLE = ["Bharat", "Anjali", "Vikram", "Priya", "Rahul", "Neha"];

const VESSELS = [
  "MV Morning Star",
  "Oceanic Voyager",
  "Global Mariner",
  "Pacific Explorer",
  "Northern Light",
  "Caspian Sea",
  "Ever Given",
  "Arctic Express",
];

const AddInquiryModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    customer: "",
    vessel: "",
    imoNumber: "",
    salesperson: "",
    clientCategory: "",
    currency: "USD",
    vesselReference: "",
    validityDate: new Date().toISOString().split("T")[0],
    requestType: "Normal",
    category: "",
    subCategory: "",
    attachment: null,
  });

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen && !formData.customer) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, attachment: file }));
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      if (data && data.length > 0) {
        const firstRow = data[0];

        const newFormData = {
          ...formData,
          customer: firstRow.Customer || firstRow.customer || formData.customer,
          vessel: firstRow.Vessel || firstRow.vessel || formData.vessel,
          imoNumber: firstRow.IMO || firstRow.imoNumber || formData.imoNumber,
          salesperson:
            firstRow.Salesperson ||
            firstRow.salesperson ||
            formData.salesperson,
          currency: firstRow.Currency || firstRow.currency || formData.currency,
          vesselReference:
            firstRow.Reference ||
            firstRow.vesselReference ||
            formData.vesselReference,
          validityDate:
            firstRow.ValidityDate ||
            firstRow.validityDate ||
            formData.validityDate,
          requestType:
            firstRow.RequestType ||
            firstRow.requestType ||
            formData.requestType,
          clientCategory:
            firstRow.Category || firstRow.category || formData.clientCategory,
          subCategory:
            firstRow.SubCategory ||
            firstRow.subCategory ||
            formData.subCategory,
        };

        setFormData(newFormData);
        Swal.fire({
          icon: "success",
          title: "Data Imported",
          text: "Inquiry fields updated from Excel.",
          timer: 1800,
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
        text: "Unable to parse the Excel file.",
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`relative w-full max-w-[86rem] h-full max-h-[90vh]
        bg-white dark:bg-[#1e2028]
        border border-gray-200 dark:border-[#2a2d36]
        rounded-xl shadow-2xl flex flex-col
        ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          {/* Header */}
          <div className="px-8 py-5 border-b flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 dark:border-[#2a2d36] text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 transition"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-bold">Add Inquiry</h2>
                <p className="text-sm text-gray-500">
                  Please fill in the inquiry details below.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-500 transition">
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Import Excel
              <input
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
              />
            </label>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  Customer
                </label>
                <Select
                  variant="form"
                  value={formData.customer}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, customer: val }))
                  }
                  options={CUSTOMERS.map((customer) => ({
                    value: customer,
                    label: customer,
                  }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">
                    Customer Currency
                  </label>
                </div>
                <Select
                  variant="form"
                  value={formData.currency}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, currency: val }))
                  }
                  options={[
                    { value: "USD", label: "USD" },
                    { value: "EUR", label: "EUR" },
                    { value: "INR", label: "INR" },
                  ]}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  Vessel
                </label>
                <input
                  type="text"
                  name="vessel"
                  value={formData.vessel}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  placeholder="Enter vessel name"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  Vessel Reference
                </label>
                <input
                  type="text"
                  name="vesselReference"
                  value={formData.vesselReference}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  placeholder="Enter reference"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  IMO Number
                </label>
                <input
                  type="text"
                  name="imoNumber"
                  value={formData.imoNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  placeholder="Enter IMO number"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  Validity Date
                </label>
                <input
                  type="date"
                  name="validityDate"
                  value={formData.validityDate}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  Attachment
                </label>
                <div className="relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                  <div className="w-full border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600 flex items-center gap-2 cursor-pointer hover:border-purple-300 transition">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <span>
                      {formData.attachment
                        ? formData.attachment.name
                        : "Upload Attachment"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  Salesperson
                </label>
                <Select
                  variant="form"
                  value={formData.salesperson}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, salesperson: val }))
                  }
                  options={SALESPEOPLE.map((person) => ({
                    value: person,
                    label: person,
                  }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  Request Type
                </label>
                <Select
                  variant="form"
                  value={formData.requestType}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, requestType: val }))
                  }
                  options={[
                    { value: "Normal", label: "Normal" },
                    { value: "Urgent", label: "Urgent" },
                  ]}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  Client Category
                </label>
                <input
                  type="text"
                  name="clientCategory"
                  value={formData.clientCategory}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  placeholder="Enter category"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">
                    Sub Category
                  </label>
                  <span className="text-xs text-gray-400">?</span>
                </div>
                <input
                  type="text"
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  placeholder="Enter sub category"
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-8 py-5 border-t flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border px-5 py-2 rounded"
            >
              Cancel
            </button>

            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 bg-purple-600 text-white px-5 py-2 rounded"
            >
              Create Inquiry
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddInquiryModal;
