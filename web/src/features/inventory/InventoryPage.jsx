import { InventoryPageSchema1 } from '@config/tableSchemas';
import React, { useMemo, useState, useEffect } from "react";
import { confirmAction } from '@utils/swal';
import { PageToolbar, Select, DataTable, rowStripeClass, ROW_HOVER_CLS } from '@components/ui';
import { fetchInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, moveStock } from '../../api/inventory';

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

function RightDrawer({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-[#1a1d23] shadow-2xl flex flex-col rounded-2xl overflow-hidden border border-gray-200 dark:border-[#2a2d33] animate-fade-in">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23]">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
            {title}
          </h3>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

function ViewDetails({ item, onClose }) {
  const details = {
    "SKU": item.sku,
    "Item Name": item.itemName,
    "Category": item.category || 'N/A',
    "Unit": item.unit || 'N/A',
    "Selling Price": `$${parseFloat(item.sellingPrice).toFixed(2)}`,
    "Purchase Price": `$${parseFloat(item.purchasePrice).toFixed(2)}`,
    "Min Stock Level": item.minimumStockLevel,
    "Status": item.status,
    "Total Quantity": item.stocks?.reduce((acc, st) => acc + st.quantity, 0) || 0,
    "Warehouse Locations": item.stocks?.map(s => `${s.warehouse?.name} (${s.quantity})`).join(', ') || 'None'
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col gap-4">
        {Object.entries(details).map(([key, value]) => (
          <div
            key={key}
            className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 border-b border-gray-50 dark:border-[#2a2d33]/50 pb-3 last:border-0 last:pb-0"
          >
            <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider w-1/3">
              {key}
            </span>
            <span className="text-[14px] text-gray-900 dark:text-white font-medium flex-1">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InventoryForm({ initialData, onSave, onClose }) {
  const [formData, setFormData] = useState(
    initialData || {
      itemName: "",
      sku: "",
      category: "",
      unit: "pcs",
      quantity: "", // Only used for creation initial stock
      warehouseId: "1001", // Default Port Warehouse Alpha
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
        warehouseId: initialData.stocks?.[0]?.warehouseId || "1001"
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

        <Field label="SKU">
          <input
            type="text"
            className={inputCls}
            value={formData.sku}
            onChange={set("sku")}
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
              { value: "1001", label: "Port Warehouse Alpha" },
              { value: "1002", label: "Port Warehouse Beta" },
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

const EyeIcon = () => (
  <svg
    className="w-4 h-4 inline"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);
const EditIcon = () => (
  <svg
    className="w-4 h-4 inline"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);
const TrashIcon = () => (
  <svg
    className="w-4 h-4 inline"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await fetchInventory();
      setInventory(res.data || res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: "Delete Item?",
      text: "Are you sure you want to remove this item from inventory?",
      confirmButtonText: "Yes, delete it!",
    });
    if (isConfirmed) {
      try {
        await deleteInventoryItem(id);
        setInventory(inventory.filter((item) => item.id !== id));
      } catch (error) {
        console.error(error);
        alert('Failed to delete item.');
      }
    }
  };

  const filteredInventory = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return inventory;
    return inventory.filter(
      (item) =>
        (item.sku && item.sku.toLowerCase().includes(query)) ||
        (item.itemName && item.itemName.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.status && item.status.toLowerCase().includes(query)),
    );
  }, [inventory, search]);

  const handleSave = async (formData) => {
    try {
      if (editItem) {
        await updateInventoryItem(editItem.id, formData);

        // Update quantity to the new absolute value
        const currentQty = editItem.stocks?.reduce((acc, st) => acc + st.quantity, 0) || 0;
        const newQty = parseInt(formData.quantity, 10);
        if (!isNaN(newQty) && newQty !== currentQty) {
          const difference = newQty - currentQty;
          await moveStock({
            inventoryItemId: editItem.id,
            warehouseId: parseInt(formData.warehouseId, 10) || 1001,
            type: difference > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(difference),
            remarks: 'Absolute Stock Update from Edit Form'
          });
        }
      } else {
        const newItemRes = await createInventoryItem(formData);
        const newItem = newItemRes.data || newItemRes;
        
        // If quantity is provided, add an initial stock movement
        if (formData.quantity && parseInt(formData.quantity) > 0) {
          await moveStock({
            inventoryItemId: newItem.id,
            warehouseId: parseInt(formData.warehouseId),
            type: 'IN',
            quantity: parseInt(formData.quantity),
            remarks: 'Initial Stock'
          });
        }
      }
      await loadInventory();
      setIsFormOpen(false);
      setEditItem(null);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Error saving inventory item');
    }
  };

  return (
    <div className="flex flex-col w-full h-full pb-4">
      <div className="w-full flex-1 flex flex-col mt-4">
        <RightDrawer
          isOpen={!!viewItem}
          title="Inventory Item Details"
          onClose={() => setViewItem(null)}
        >
          <ViewDetails item={viewItem} onClose={() => setViewItem(null)} />
        </RightDrawer>

        <RightDrawer
          isOpen={isFormOpen}
          title={editItem ? "Edit Inventory Item" : "Add New Item"}
          onClose={() => {
            setIsFormOpen(false);
            setEditItem(null);
          }}
        >
          <InventoryForm
            initialData={editItem}
            onSave={handleSave}
            onClose={() => {
              setIsFormOpen(false);
              setEditItem(null);
            }}
          />
        </RightDrawer>

        <PageToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search inventory by SKU, Name, Category..."
          onAdd={() => setIsFormOpen(true)}
          addLabel="Add Item"
        />

        <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden flex flex-col shadow-lg transition-colors duration-300">
          <DataTable
            columns={InventoryPageSchema1}
            data={filteredInventory}
            emptyMessage={loading ? "Loading..." : "No inventory items found."}
            renderRow={(item, idx) => {
              const totalQty = item.stocks?.reduce((acc, st) => acc + st.quantity, 0) || 0;
              const isLowStock = totalQty < item.minimumStockLevel;
              let statusLabel = 'In Stock';
              let statusColor = 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
              
              if (totalQty === 0) {
                statusLabel = 'Out of Stock';
                statusColor = 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
              } else if (isLowStock) {
                statusLabel = 'Low Stock';
                statusColor = 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
              }

              return (
                <tr
                  key={item.id}
                  className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}
                >
                  <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + idx + 1}</td>
                  <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400">
                    {item.sku}
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">
                    {item.itemName}
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-[#2a2d36] rounded text-[11px] font-bold text-gray-600 dark:text-gray-400">
                      {item.category || '-'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {item.stocks?.[0]?.warehouse?.name || 'Main Warehouse'}
                  </td>
                  <td className="px-5 py-3">{totalQty}</td>
                  <td className="px-5 py-3">${parseFloat(item.sellingPrice).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded text-[11px] font-bold ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-3">
                    <button
                      onClick={() => setViewItem(item)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      title="View"
                    >
                      <EyeIcon />
                    </button>
                    <button
                      onClick={() => {
                        setEditItem(item);
                        setIsFormOpen(true);
                      }}
                      className="text-blue-500 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}
