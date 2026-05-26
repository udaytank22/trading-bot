import React, { useMemo, useState } from "react";
import { confirmAction } from "../utils/swal";
import { PageToolbar, Select } from "../components/ui";

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
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col gap-4">
        {Object.entries(item).map(([key, value]) => (
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
      name: "",
      category: "",
      quantity: "",
      price: "",
      location: "",
      status: "In Stock",
    },
  );

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
            value={formData.name}
            onChange={set("name")}
            placeholder="e.g. Copper Wire"
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

        <Field label="Quantity">
          <input
            type="number"
            className={inputCls}
            value={formData.quantity}
            onChange={set("quantity")}
            placeholder="e.g. 150"
          />
        </Field>

        <Field label="Unit Price">
          <input
            type="text"
            className={inputCls}
            value={formData.price}
            onChange={set("price")}
            placeholder="e.g. $45.00"
          />
        </Field>

        <Field label="Location / Warehouse">
          <input
            type="text"
            className={inputCls}
            value={formData.location}
            onChange={set("location")}
            placeholder="e.g. Warehouse A"
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
              { value: "In Stock", label: "In Stock" },
              { value: "Low Stock", label: "Low Stock" },
              { value: "Out of Stock", label: "Out of Stock" },
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
  const [inventory, setInventory] = useState([
    {
      id: "INV-1001",
      name: "Industrial Motor",
      category: "Machinery",
      quantity: 45,
      price: "$1,200.00",
      location: "Warehouse A",
      status: "In Stock",
    },
    {
      id: "INV-1002",
      name: "Steel Bearings",
      category: "Parts",
      quantity: 12,
      price: "$45.00",
      location: "Warehouse B",
      status: "Low Stock",
    },
    {
      id: "INV-1003",
      name: "Circuit Boards",
      category: "Electronics",
      quantity: 0,
      price: "$150.00",
      location: "Warehouse A",
      status: "Out of Stock",
    },
    {
      id: "INV-1004",
      name: "Hydraulic Fluid",
      category: "Consumables",
      quantity: 200,
      price: "$85.00",
      location: "Warehouse C",
      status: "In Stock",
    },
  ]);

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
      setInventory(inventory.filter((item) => item.id !== id));
    }
  };

  const filteredInventory = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return inventory;
    return inventory.filter(
      (item) =>
        item.id.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.price.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query),
    );
  }, [inventory, search]);

  const handleSave = (formData) => {
    if (editItem) {
      setInventory(
        inventory.map((item) =>
          item.id === editItem.id ? { ...item, ...formData } : item,
        ),
      );
    } else {
      setInventory([
        ...inventory,
        { id: `INV-${1000 + inventory.length + 1}`, ...formData },
      ]);
    }
    setIsFormOpen(false);
    setEditItem(null);
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
          searchPlaceholder="Search inventory..."
          onAdd={() => setIsFormOpen(true)}
          addLabel="Add Item"
        />

        <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden flex flex-col shadow-lg transition-colors duration-300">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="min-w-full w-full text-left text-[13px] table-auto border-collapse">
              <thead className="bg-gray-50 dark:bg-[#0f1117]/50 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-[#2a2d33] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3">Item ID</th>
                  <th className="px-5 py-3">Item Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2d33] text-gray-700 dark:text-gray-300">
                {filteredInventory.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400">
                      {item.id}
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-[#2a2d36] rounded text-[11px] font-bold text-gray-600 dark:text-gray-400">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-3">{item.location}</td>
                    <td className="px-5 py-3">{item.quantity}</td>
                    <td className="px-5 py-3">{item.price}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-1 rounded text-[11px] font-bold ${
                          item.status === "In Stock"
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : item.status === "Low Stock"
                              ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {item.status}
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
                ))}
                {filteredInventory.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      No inventory items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
