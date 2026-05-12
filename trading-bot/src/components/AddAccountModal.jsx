import React, { useState, useEffect } from "react";
import { parseExcelFile } from "../utils/excelUtils";
import Swal from "sweetalert2";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "SGD"];

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
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      if (data && data.length > 0) {
        const row = data[0];
        setFormData({
          ...formData,
          bankName:
            row.BankName || row.bankName || row.Bank || formData.bankName,
          accountName:
            row.AccountName ||
            row.accountName ||
            row.Purpose ||
            formData.accountName,
          accountNumber:
            row.AccountNumber ||
            row.accountNumber ||
            row.Number ||
            formData.accountNumber,
          routingNumber:
            row.RoutingNumber ||
            row.routingNumber ||
            row.Routing ||
            row.Swift ||
            formData.routingNumber,
          currency: row.Currency || row.currency || formData.currency,
          balance: parseFloat(row.Balance || row.balance || 0),
          status: row.Status || row.status || "Active",
        });

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
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {accountToEdit ? "Edit Bank Account" : "Add Bank Account"}
              </h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-0.5">
                Financial Details
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
              Bank Name
            </label>
            <input
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              required
              placeholder="e.g. Chase Bank"
              className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white focus:border-purple-500/50 transition-all outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
              Account Purpose / Name
            </label>
            <input
              type="text"
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
              required
              placeholder="e.g. Main Operating"
              className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white focus:border-purple-500/50 transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                Account Number
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                required
                placeholder="1234567890"
                className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white focus:border-purple-500/50 transition-all outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                Routing / SWIFT
              </label>
              <input
                type="text"
                name="routingNumber"
                value={formData.routingNumber}
                onChange={handleChange}
                required
                placeholder="021000021"
                className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white focus:border-purple-500/50 transition-all outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white focus:border-purple-500/50 transition-all outline-none cursor-pointer"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
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
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
              Current Balance
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-gray-500 font-bold">
                $
              </span>
              <input
                type="number"
                step="0.01"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg pl-8 pr-4 py-2.5 text-sm text-white focus:border-purple-500/50 transition-all outline-none"
              />
            </div>
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
            {accountToEdit ? "Update Account" : "Save Account"}
          </button>
        </div>
      </div>
    </>
  );
}
