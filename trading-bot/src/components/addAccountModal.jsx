import React, { useState, useEffect } from "react";
import { Select } from "./ui";
import { parseExcelFile } from "../utils/excelUtils";
import Swal from "sweetalert2";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "SGD"];

const inputClass =
  "w-full h-[48px] rounded-xl px-4 text-sm bg-white dark:bg-[#0f1117] border border-gray-300 dark:border-[#2f3441] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30";

const labelClass =
  "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.18em] mb-2";

export default function AddAccountModal({
  isOpen,
  onClose,
  onSubmit,
  accountToEdit,
}) {
  const [formData, setFormData] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    routingNumber: "",
    currency: "USD",
    balance: 0,
    status: "Active",
  });

  useEffect(() => {
    if (accountToEdit) {
      setFormData(accountToEdit);
    } else {
      setFormData({
        bankName: "",
        accountName: "",
        accountNumber: "",
        routingNumber: "",
        currency: "USD",
        balance: 0,
        status: "Active",
      });
    }
  }, [accountToEdit, isOpen]);

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
      [name]: name === "balance" ? parseFloat(value) || 0 : value,
    }));
  };

  const updateField = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === "balance" ? parseFloat(value) || 0 : value,
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
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);

      if (data && data.length > 0) {
        const row = data[0];

        setFormData((prev) => ({
          ...prev,
          bankName: row.BankName || row.bankName || row.Bank || prev.bankName,
          accountName:
            row.AccountName || row.accountName || row.Purpose || prev.accountName,
          accountNumber:
            row.AccountNumber ||
            row.accountNumber ||
            row.Number ||
            prev.accountNumber,
          routingNumber:
            row.RoutingNumber ||
            row.routingNumber ||
            row.Routing ||
            row.Swift ||
            prev.routingNumber,
          currency: row.Currency || row.currency || prev.currency,
          balance: parseFloat(row.Balance || row.balance || prev.balance || 0),
          status: row.Status || row.status || prev.status,
        }));

        Swal.fire({
          icon: "success",
          title: "Data Imported",
          text: "Form filled from Excel.",
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
          <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2f3441] flex justify-between items-center bg-gray-50 dark:bg-[#1f222b]">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-purple-100 dark:bg-purple-600/20 rounded-xl flex items-center justify-center border border-purple-200 dark:border-purple-500/20 shadow-lg shadow-purple-600/10">
                <svg
                  className="w-5 h-5 text-purple-600 dark:text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {accountToEdit ? "Edit Bank Account" : "Add Bank Account"}
                </h2>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mt-1">
                  Financial Details
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
                className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"
              >
                ✕
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label="Bank Name"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="e.g. Chase Bank"
                required
              />

              <Field
                label="Account Purpose / Name"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                placeholder="e.g. Main Operating"
                required
              />

              <Field
                label="Account Number"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="1234567890"
                required
              />

              <Field
                label="Routing / SWIFT"
                name="routingNumber"
                value={formData.routingNumber}
                onChange={handleChange}
                placeholder="021000021"
                required
              />

              <div>
                <label className={labelClass}>Currency</label>
                <Select
                  variant="form"
                  value={formData.currency}
                  onChange={(val) => updateField("currency", val)}
                  options={CURRENCIES.map((currency) => ({
                    value: currency,
                    label: currency,
                  }))}
                  className="w-full"
                  placeholder="Select currency"
                />
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <Select
                  variant="form"
                  value={formData.status}
                  onChange={(val) => updateField("status", val)}
                  options={[
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                  ]}
                  className="w-full"
                  placeholder="Select status"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Current Balance</label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold">
                    $
                  </span>

                  <input
                    type="number"
                    step="0.01"
                    name="balance"
                    value={formData.balance}
                    onChange={handleChange}
                    placeholder="0.00"
                    className={`${inputClass} pl-8`}
                  />
                </div>
              </div>
            </div>
          </form>

          <div className="px-6 py-5 border-t border-gray-200 dark:border-[#2f3441] flex gap-3 bg-gray-50 dark:bg-[#1f222b]">
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
              {accountToEdit ? "Update Account" : "Save Account"}
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