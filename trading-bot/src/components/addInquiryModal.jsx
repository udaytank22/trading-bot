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

const modalBg = "bg-white dark:bg-[#1b1d24]";
const panelBg = "bg-gray-50 dark:bg-[#1f222b]";
const borderColor = "border-gray-200 dark:border-[#2f3441]";

const labelClass =
  "block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2";

const inputClass =
  "w-full h-[52px] rounded-xl px-4 text-sm transition-all duration-200 bg-white dark:bg-[#0f1117] border border-gray-300 dark:border-[#2f3441] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 hover:border-gray-400 dark:hover:border-[#464c5c]";

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

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateField = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      updateField("attachment", file);
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);

      if (data && data.length > 0) {
        const firstRow = data[0];

        setFormData((prev) => ({
          ...prev,
          customer: firstRow.Customer || firstRow.customer || prev.customer,
          vessel: firstRow.Vessel || firstRow.vessel || prev.vessel,
          imoNumber: firstRow.IMO || firstRow.imoNumber || prev.imoNumber,
          salesperson:
            firstRow.Salesperson || firstRow.salesperson || prev.salesperson,
          currency: firstRow.Currency || firstRow.currency || prev.currency,
          vesselReference:
            firstRow.Reference ||
            firstRow.vesselReference ||
            prev.vesselReference,
          validityDate:
            firstRow.ValidityDate || firstRow.validityDate || prev.validityDate,
          requestType:
            firstRow.RequestType || firstRow.requestType || prev.requestType,
          clientCategory:
            firstRow.Category || firstRow.category || prev.clientCategory,
          subCategory:
            firstRow.SubCategory || firstRow.subCategory || prev.subCategory,
        }));

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
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm z-[100]"
        onClick={handleBackdropClick}
      />

      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className={`
            relative w-full max-w-[86rem] h-full max-h-[90vh]
            ${modalBg}
            border ${borderColor}
            rounded-2xl shadow-2xl
            flex flex-col overflow-hidden
          `}
        >
          {/* Header */}
          <div
            className={`
              px-8 py-3 border-b ${borderColor}
              flex justify-between items-center gap-4
              ${panelBg}
            `}
          >
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onClose}
                className="
                  inline-flex items-center justify-center w-11 h-11 rounded-full
                  bg-white dark:bg-[#0f1117]
                  border border-gray-300 dark:border-[#2f3441]
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-[#171922]
                  hover:border-gray-400 dark:hover:border-[#464c5c]
                  transition-all duration-200
                "
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
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Add Inquiry
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Please fill in the inquiry details below.
                </p>
              </div>
            </div>

            <label
              className="
                flex items-center gap-2 px-5 py-2.5 rounded-lg cursor-pointer
                bg-green-50 dark:bg-green-600/10
                text-green-700 dark:text-green-400
                border border-green-200 dark:border-green-600/30
                hover:bg-green-600 hover:text-white
                transition-all duration-200 font-semibold text-sm
              "
            >
              Import Excel
              <input
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
              />
            </label>
          </div>

          {/* Body */}
          <form
            onSubmit={handleSubmit}
            className={`flex-1 overflow-y-auto p-8 ${modalBg}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7">
              <div>
                <label className={labelClass}>Customer</label>
                <Select
                  variant="form"
                  value={formData.customer}
                  onChange={(val) => updateField("customer", val)}
                  options={CUSTOMERS.map((customer) => ({
                    value: customer,
                    label: customer,
                  }))}
                  className="w-full"
                  placeholder="Select customer"
                />
              </div>

              <div>
                <label className={labelClass}>Customer Currency</label>
                <Select
                  variant="form"
                  value={formData.currency}
                  onChange={(val) => updateField("currency", val)}
                  options={[
                    { value: "USD", label: "USD" },
                    { value: "EUR", label: "EUR" },
                    { value: "INR", label: "INR" },
                  ]}
                  className="w-full"
                  placeholder="Select currency"
                />
              </div>

              <Field
                label="Vessel"
                name="vessel"
                value={formData.vessel}
                onChange={handleChange}
                placeholder="Enter vessel name"
              />

              <Field
                label="Vessel Reference"
                name="vesselReference"
                value={formData.vesselReference}
                onChange={handleChange}
                placeholder="Enter vessel reference"
              />

              <Field
                label="IMO Number"
                name="imoNumber"
                value={formData.imoNumber}
                onChange={handleChange}
                placeholder="Enter IMO number"
              />

              <Field
                label="Validity Date"
                name="validityDate"
                type="date"
                value={formData.validityDate}
                onChange={handleChange}
              />

              <div>
                <label className={labelClass}>Attachment</label>

                <div className="relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />

                  <div className={`${inputClass} flex items-center`}>
                    <span
                      className={`truncate ${formData.attachment
                        ? "text-gray-900 dark:text-gray-100"
                        : "text-gray-400 dark:text-gray-500"
                        }`}
                    >
                      {formData.attachment
                        ? formData.attachment.name
                        : "Upload Attachment"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Salesperson</label>
                <Select
                  variant="form"
                  value={formData.salesperson}
                  onChange={(val) => updateField("salesperson", val)}
                  options={SALESPEOPLE.map((person) => ({
                    value: person,
                    label: person,
                  }))}
                  className="w-full"
                  placeholder="Select salesperson"
                />
              </div>

              <div>
                <label className={labelClass}>Request Type</label>
                <Select
                  variant="form"
                  value={formData.requestType}
                  onChange={(val) => updateField("requestType", val)}
                  options={[
                    { value: "Normal", label: "Normal" },
                    { value: "Urgent", label: "Urgent" },
                  ]}
                  className="w-full"
                  placeholder="Select request type"
                />
              </div>

              <Field
                label="Client Category"
                name="clientCategory"
                value={formData.clientCategory}
                onChange={handleChange}
                placeholder="Enter client category"
              />

              <Field
                label="Sub Category"
                name="subCategory"
                value={formData.subCategory}
                onChange={handleChange}
                placeholder="Enter sub category"
              />
            </div>
          </form>

          {/* Footer */}
          <div
            className={`
              px-8 py-3 border-t ${borderColor}
              flex gap-3 ${panelBg}
            `}
          >
            <button
              type="button"
              onClick={onClose}
              className="
                px-6 py-3 rounded-xl
                bg-white dark:bg-[#0f1117]
                border border-gray-300 dark:border-[#2f3441]
                text-gray-700 dark:text-gray-300
                font-semibold
                hover:bg-gray-100 dark:hover:bg-[#171922]
                hover:border-gray-400 dark:hover:border-[#464c5c]
                transition-all duration-200
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              onClick={handleSubmit}
              className="
                flex-1 px-6 py-3 rounded-xl
                bg-purple-600 hover:bg-purple-500
                text-white font-bold
                shadow-lg shadow-purple-900/30
                transition-all duration-200
              "
            >
              Create Inquiry
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder || `Enter ${label}`}
        className={inputClass}
      />
    </div>
  );
}

export default AddInquiryModal;