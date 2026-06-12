import React, { useState, useEffect } from "react";
import { Select, Field, Modal, DatePicker } from "@components/ui";
import { parseExcelFile } from "@utils/excelUtils";
import Swal from "sweetalert2";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "LOADING", label: "Loading" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
];

const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2";

export default function AddSupplyModal({ isOpen, onClose, onSubmit }) {
  const defaultForm = {
    supplier: "",
    buyer_name: "",
    buyer_email: "",
    cargo: "",
    quantity: "",
    destination: "",
    status: "PENDING",
    date: new Date().toISOString().split("T")[0],
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (isOpen) {
      setFormData(defaultForm);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
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

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);

      if (data && data.length > 0) {
        const row = data[0];

        setFormData((prev) => ({
          ...prev,
          supplier: row.Supplier || row.supplier || prev.supplier,
          buyer_name: row.BuyerName || row.buyer_name || row.Buyer || prev.buyer_name,
          buyer_email: row.BuyerEmail || row.buyer_email || prev.buyer_email,
          cargo: row.Cargo || row.cargo || prev.cargo,
          quantity: row.Quantity || row.quantity || prev.quantity,
          destination: row.Destination || row.destination || prev.destination,
          status: row.Status || row.status || prev.status || "PENDING",
          date: row.Date || row.date || prev.date || prev.date,
        }));

        Swal.fire({
          toast: true, position: 'top-end', icon: 'success',
          title: "Data Imported",
          text: "Supply details filled from Excel",
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

  const handleSubmit = (e) => {
    e.preventDefault();

    // Auto-generate inquiry ID (using a suffix based on the timestamp)
    const uniqueId = `CGO-${Math.floor(1008 + Math.random() * 8992)}`;

    const newSupply = {
      ...formData,
      inquiry_id: uniqueId,
      // SupplyViewModal uses date_received, so keep both date and date_received synced
      date_received: new Date(formData.date).toISOString(),
      products: [{ product_name: formData.cargo }],
    };

    onSubmit(newSupply);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Cargo Supply"
      subtitle="Create a new cargo/supply tracking record."
      onSubmit={handleSubmit}
      submitLabel="Save Supply"
      cancelLabel="Cancel"
      onExcelUpload={handleExcelUpload}
      maxWidthClass="max-w-4xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="Supplier Name"
          name="supplier"
          required
          value={formData.supplier}
          onChange={handleChange}
          placeholder="Enter supplier name"
        />

        <Field
          label="Buyer Name"
          name="buyer_name"
          required
          value={formData.buyer_name}
          onChange={handleChange}
          placeholder="Enter buyer name"
        />

        <Field
          label="Buyer Email"
          name="buyer_email"
          type="email"
          required
          value={formData.buyer_email}
          onChange={handleChange}
          placeholder="Enter buyer email"
        />

        <Field
          label="Cargo / Product Name"
          name="cargo"
          required
          value={formData.cargo}
          onChange={handleChange}
          placeholder="Enter cargo details (e.g. Steel Pipes)"
        />

        <Field
          label="Quantity"
          name="quantity"
          required
          value={formData.quantity}
          onChange={handleChange}
          placeholder="Enter quantity (e.g. 100 MT)"
        />

        <Field
          label="Destination"
          name="destination"
          required
          value={formData.destination}
          onChange={handleChange}
          placeholder="Enter destination port/city"
        />

        <div>
          <label className={labelClass}>Status</label>
          <Select
            variant="form"
            value={formData.status}
            onChange={(val) => updateField("status", val)}
            options={STATUS_OPTIONS}
            className="w-full"
          />
        </div>

        <DatePicker
          label="Record Date"
          name="date"
          required
          value={formData.date}
          onChange={handleChange}
        />
      </div>
    </Modal>
  );
}
