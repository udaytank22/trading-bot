import React, { useState, useEffect } from "react";
import { Select, Field, Modal } from '@components/ui';
import { parseExcelFile } from '@utils/excelUtils';
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
          toast: true, position: 'top-end', icon: 'success',
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={accountToEdit ? "Edit Bank Account" : "Add Bank Account"}
      subtitle="Financial Details"
      onSubmit={handleSubmit}
      submitLabel={accountToEdit ? "Update Account" : "Save Account"}
      cancelLabel="Cancel"
      onExcelUpload={handleExcelUpload}
      maxWidthClass="max-w-5xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="Bank Name"
          name="bankName"
          value={formData.bankName}
          onChange={handleChange}
          placeholder="e.g. Chase Bank"
          required
          labelClassName={labelClass}
        />

        <Field
          label="Account Purpose / Name"
          name="accountName"
          value={formData.accountName}
          onChange={handleChange}
          placeholder="e.g. Main Operating"
          required
          labelClassName={labelClass}
        />

        <Field
          label="Account Number"
          name="accountNumber"
          value={formData.accountNumber}
          onChange={handleChange}
          placeholder="1234567890"
          required
          labelClassName={labelClass}
        />

        <Field
          label="Routing / SWIFT"
          name="routingNumber"
          value={formData.routingNumber}
          onChange={handleChange}
          placeholder="021000021"
          required
          labelClassName={labelClass}
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
              className="w-full h-[35px] rounded-lg pl-8 pr-3.5 text-sm bg-white dark:bg-[#0f1117] border border-gray-300 dark:border-[#2f3441] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-normal outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-[#464c5c] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}