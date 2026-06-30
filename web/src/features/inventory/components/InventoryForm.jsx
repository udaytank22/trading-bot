import React, { useState, useEffect } from 'react';
import { Select } from '@components/ui';

const inputCls =
  "w-full bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-[36px] px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all shadow-sm focus:ring-1 focus:ring-purple-500/50";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 dark:text-gray-300 font-medium mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export function InventoryForm({ initialData, onSave, onClose }) {
  const [formData, setFormData] = useState(
    initialData || {
      itemName: "",
      impa: "",
      category: "",
      unit: "pcs",
      quantity: "", 
      warehouseId: "1", 
      sellingPrice: "",
      purchasePrice: "",
      minimumStockLevel: "5",
      status: "ACTIVE",
    },
  );

  useEffect(() => {
    if (initialData) {
      const totalQty = initialData.stocks?.reduce((acc, st) => acc + st.quantity, 0) || 0;
      setFormData(prev => ({
        ...prev,
        quantity: totalQty,
        warehouseId: initialData.stocks?.[0]?.warehouseId?.toString() || "1"
      }));
    }
  }, [initialData]);

  const set = (key) => (e) =>
    setFormData((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Item Name">
          <input
            type="text"
            className={inputCls}
            value={formData.itemName}
            onChange={set("itemName")}
            placeholder="e.g. Copper Wire"
          />
        </Field>

        <Field label="IMPA">
          <input
            type="text"
            className={inputCls}
            value={formData.impa}
            onChange={set("impa")}
            placeholder="e.g. CW-001"
          />
        </Field>

        <Field label="Category">
          <input
            type="text"
            className={inputCls}
            value={formData.category}
            onChange={set("category")}
            placeholder="e.g. Raw Materials"
          />
        </Field>

        <Field label="Unit">
          <input
            type="text"
            className={inputCls}
            value={formData.unit}
            onChange={set("unit")}
            placeholder="e.g. kg, pcs, liters"
          />
        </Field>

        <Field label="Selling Price">
          <input
            type="number"
            step="0.01"
            className={inputCls}
            value={formData.sellingPrice}
            onChange={set("sellingPrice")}
            placeholder="e.g. 45.00"
          />
        </Field>

        <Field label="Purchase Price">
          <input
            type="number"
            step="0.01"
            className={inputCls}
            value={formData.purchasePrice}
            onChange={set("purchasePrice")}
            placeholder="e.g. 30.00"
          />
        </Field>

        <Field label="Min Stock Level">
          <input
            type="number"
            className={inputCls}
            value={formData.minimumStockLevel}
            onChange={set("minimumStockLevel")}
            placeholder="e.g. 10"
          />
        </Field>

        <Field label="Status">
          <Select
            variant="settings"
            className={inputCls}
            value={formData.status}
            onChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                status: val,
              }))
            }
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />
        </Field>

        <Field label="Quantity">
          <input
            type="number"
            className={inputCls}
            value={formData.quantity}
            onChange={set("quantity")}
            placeholder="e.g. 150"
          />
        </Field>

        <Field label="Location / Warehouse">
          <Select
            variant="settings"
            className={inputCls}
            value={formData.warehouseId}
            onChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                warehouseId: val,
              }))
            }
            options={[
              { value: "1", label: "Port Warehouse Alpha" },
              { value: "2", label: "Port Warehouse Beta" },
            ]}
          />
        </Field>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-[13px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={() => onSave(formData)}
          className="px-5 py-2 text-[13px] font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors"
        >
          Save Details
        </button>
      </div>
    </div>
  );
}
