import { InventoryPageSchema1 } from '@config/tableSchemas';
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { confirmAction } from '@utils/swal';
import { PageToolbar, Select, DataTable, Pagination, rowStripeClass, ROW_HOVER_CLS } from '@components/ui';
import {
  fetchInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  moveStock,
  getInventoryTransactionHistory
} from '../../api/inventory';
import { useAuth } from '@context';

const inputCls =
  "w-full bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-[36px] px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all shadow-sm focus:ring-1 focus:ring-purple-500/50";

const getTypeStyle = (type) => {
  switch (type) {
    case 'IN':
    case 'INVENTORY_RELEASED':
      return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
    case 'OUT':
    case 'INVENTORY_DISPATCHED':
      return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
    case 'INVENTORY_RESERVED':
      return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
    default:
      return 'bg-gray-50 dark:bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/20';
  }
};

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
    "Selling Price": `₹ ${parseFloat(item.sellingPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    "Purchase Price": `₹ ${parseFloat(item.purchasePrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    "Min Stock Level": item.minimumStockLevel,
    "Status": item.status,
    "Total Quantity": item.stocks?.reduce((acc, st) => acc + st.quantity, 0) || 0,
    "Warehouse Locations": item.stocks?.map(s => `${s.warehouse?.name} (${s.quantity})`).join(', ') || 'None'
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(details).map(([key, value]) => (
          <div
            key={key}
            className="flex flex-col border-b border-gray-100 dark:border-[#2a2d36]/30 pb-3"
          >
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {key}
            </span>
            <span className="text-[13px] text-gray-800 dark:text-gray-200 font-semibold mt-1">
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Stock Ledger (Movements)</h4>
        {!item.movements || item.movements.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-400 italic bg-gray-50/50 dark:bg-[#242830]/20 rounded-xl border border-dashed border-gray-250 dark:border-[#2a2d36]">
            No movements recorded for this item.
          </div>
        ) : (
          <div className="rounded-xl border border-gray-250 dark:border-[#2a2d36] overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
            <DataTable
              columns={[
                { key: 'date', label: 'Date', renderCell: (m) => new Date(m.createdAt).toLocaleString(), cellClassName: 'text-gray-500 font-medium' },
                { key: 'type', label: 'Type', renderCell: (m) => (
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border tracking-wider ${getTypeStyle(m.type)}`}>
                    {m.type?.replace('INVENTORY_', '')}
                  </span>
                )},
                { key: 'qty', label: 'Qty', cellClassName: 'text-center font-mono font-bold text-gray-900 dark:text-white', renderCell: (m) => (m.type === 'OUT' || m.type === 'INVENTORY_RESERVED' || m.type === 'INVENTORY_DISPATCHED' ? '-' : '+') + m.quantity },
                { key: 'prev', label: 'Prev', cellClassName: 'text-center font-mono text-gray-500', renderCell: (m) => m.previousQuantity !== null ? m.previousQuantity : '—' },
                { key: 'rem', label: 'Rem', cellClassName: 'text-center font-mono font-bold text-gray-700 dark:text-gray-300', renderCell: (m) => m.remainingQuantity !== null ? m.remainingQuantity : '—' },
                { key: 'ref', label: 'Reference', cellClassName: 'font-medium', renderCell: (m) => m.referenceNumber?.startsWith('INQ-') ? <a href={`/#/inquiries/${m.referenceId}`} onClick={onClose} className="text-purple-600 hover:text-purple-550 dark:text-purple-400 dark:hover:text-purple-300 font-bold hover:underline">{m.referenceNumber}</a> : (m.referenceNumber || '—') },
                { key: 'actionBy', label: 'Action By', cellClassName: 'text-gray-500 font-mono truncate max-w-[120px]', renderCell: (m) => m.actionBy || 'system' }
              ]}
              data={item.movements}
              emptyMessage="No movements recorded for this item."
            />
          </div>
        )}
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
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('inventory', 'create');
  const canUpdate = hasPermission('inventory', 'update');
  const canDelete = hasPermission('inventory', 'delete');

  const [search, setSearch] = useState("");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'transactions'

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [txTotalItems, setTxTotalItems] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txCurrentPage, setTxCurrentPage] = useState(1);
  const [txItemsPerPage, setTxItemsPerPage] = useState(10);
  const [txLoading, setTxLoading] = useState(false);

  // Filters for transactions
  const [txTypeFilter, setTxTypeFilter] = useState('');
  const [txItemSearch, setTxItemSearch] = useState('');
  const [txStartDate, setTxStartDate] = useState('');
  const [txEndDate, setTxEndDate] = useState('');
  const [txRefNumber, setTxRefNumber] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      const timer = setTimeout(() => {
        loadTransactions();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, txCurrentPage, txItemsPerPage, txTypeFilter, txItemSearch, txStartDate, txEndDate, txRefNumber]);

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

  const loadTransactions = async () => {
    try {
      setTxLoading(true);
      const params = {
        page: txCurrentPage,
        pageSize: txItemsPerPage,
        type: txTypeFilter || undefined,
        itemName: txItemSearch || undefined,
        startDate: txStartDate || undefined,
        endDate: txEndDate || undefined,
        referenceNumber: txRefNumber || undefined
      };
      const res = await getInventoryTransactionHistory(params);
      if (res.success) {
        setTransactions(res.data.items || []);
        setTxTotalItems(res.data.total || 0);
        setTxTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to load transaction history:", error);
    } finally {
      setTxLoading(false);
    }
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setTxCurrentPage(1);
  };

  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleViewDetails = async (item) => {
    try {
      const res = await getInventoryItem(item.id);
      setViewItem(res.data || res);
    } catch (error) {
      console.error("Failed to fetch inventory item details:", error);
      setViewItem(item);
    }
  };

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
            warehouseId: parseInt(formData.warehouseId, 10) || 1,
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

  const handleExportCSV = () => {
    const headers = ["Date & Time", "Item Name", "Type", "Quantity", "Previous Stock", "Remaining Stock", "Inquiry #", "Action By", "Remarks"];
    const rows = transactions.map(t => [
      new Date(t.createdAt).toLocaleString(),
      t.inventoryItem?.itemName || 'Unknown',
      t.type,
      t.quantity,
      t.previousQuantity ?? '',
      t.remainingQuantity ?? '',
      t.referenceNumber || '',
      t.actionBy || '',
      t.remarks || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const txColumns = [
    { key: "date", label: "Date & Time" },
    { key: "itemName", label: "Item Name" },
    { key: "type", label: "Type" },
    { key: "qty", label: "Qty" },
    { key: "prev", label: "Prev Stock" },
    { key: "rem", label: "Rem Stock" },
    { key: "inquiry", label: "Inquiry #" },
    { key: "actionBy", label: "Action By" }
  ];

  return (
    <div className="flex flex-col w-full h-full pb-4">
      <div className="w-full flex-1 flex flex-col mt-4">
        
        {/* VIEW DETAILS DRAWER */}
        <RightDrawer
          isOpen={!!viewItem}
          title="Inventory Item Details"
          onClose={() => setViewItem(null)}
        >
          {viewItem && (
            <ViewDetails item={viewItem} onClose={() => setViewItem(null)} />
          )}
        </RightDrawer>

        {/* ADD/EDIT FORM DRAWER */}
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

        {/* TABS SELECTOR */}
        <div className="flex border-b border-gray-200 dark:border-[#2a2d36] mb-4">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-6 py-2.5 font-bold text-sm border-b-2 transition-all duration-200 ${activeTab === 'items'
              ? 'border-purple-500 text-purple-650 dark:text-purple-400 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            Inventory Items
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-2.5 font-bold text-sm border-b-2 transition-all duration-200 ${activeTab === 'transactions'
              ? 'border-purple-500 text-purple-650 dark:text-purple-400 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            Transaction History
          </button>
        </div>

        {activeTab === 'items' ? (
          <div className="flex-1 flex flex-col gap-4">
            <PageToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search inventory by SKU, Name, Category..."
              onAdd={canCreate ? () => setIsFormOpen(true) : undefined}
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
                      <td className="px-5 py-3 font-mono font-semibold">{totalQty}</td>
                      <td className="px-5 py-3 font-mono">₹ {parseFloat(item.sellingPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded text-[11px] font-bold ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right space-x-3">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                          title="View Details"
                        >
                          <EyeIcon />
                        </button>
                        {canUpdate && (
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
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Filter controls */}
            <div className="bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d36] rounded-xl p-4 flex flex-col gap-4 shadow-sm transition-colors duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* Search Item Name */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Item Name</label>
                  <input
                    type="text"
                    value={txItemSearch}
                    onChange={(e) => handleFilterChange(setTxItemSearch, e.target.value)}
                    placeholder="Search item name..."
                    className="w-full bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-xl h-9 px-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-sm"
                  />
                </div>

                {/* Search Inquiry Number */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Inquiry #</label>
                  <input
                    type="text"
                    value={txRefNumber}
                    onChange={(e) => handleFilterChange(setTxRefNumber, e.target.value)}
                    placeholder="e.g. INQ-1004"
                    className="w-full bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-xl h-9 px-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-sm"
                  />
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Transaction Type</label>
                  <select
                    value={txTypeFilter}
                    onChange={(e) => handleFilterChange(setTxTypeFilter, e.target.value)}
                    className="w-full bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d36] rounded-xl h-9 px-3 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-purple-500 shadow-sm cursor-pointer"
                  >
                    <option value="">All Types</option>
                    <option value="IN">IN (Stock Added)</option>
                    <option value="OUT">OUT (Stock Removed)</option>
                    <option value="INVENTORY_RESERVED">Reserved</option>
                    <option value="INVENTORY_DISPATCHED">Dispatched</option>
                    <option value="INVENTORY_RELEASED">Released</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={txStartDate}
                    onChange={(e) => handleFilterChange(setTxStartDate, e.target.value)}
                    className="w-full bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d36] rounded-xl h-9 px-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-sm"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={txEndDate}
                    onChange={(e) => handleFilterChange(setTxEndDate, e.target.value)}
                    className="w-full bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d36] rounded-xl h-9 px-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-gray-150 dark:border-[#2a2d36] pt-3 flex-wrap gap-3">
                <button
                  onClick={() => {
                    setTxItemSearch('');
                    setTxRefNumber('');
                    setTxTypeFilter('');
                    setTxStartDate('');
                    setTxEndDate('');
                    setTxCurrentPage(1);
                  }}
                  className="text-xs text-gray-550 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white font-bold transition-all"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={transactions.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-550 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-purple-600/10 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden flex flex-col shadow-lg transition-colors duration-300">
              <DataTable
                columns={txColumns}
                data={transactions}
                emptyMessage={txLoading ? "Loading transaction ledger..." : "No transactions found matching criteria."}
                renderRow={(tx, idx) => {
                  const isLinkable = tx.referenceNumber && tx.referenceNumber.startsWith('INQ-');
                  return (
                    <tr key={tx.id} className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}>
                      <td className="px-5 py-3 text-gray-500 font-medium font-mono text-xs">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">
                        {tx.inventoryItem?.itemName || 'Unknown'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border tracking-wider ${getTypeStyle(tx.type)}`}>
                          {tx.type?.replace('INVENTORY_', '')}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-gray-900 dark:text-white">
                        {tx.type === 'OUT' || tx.type === 'INVENTORY_RESERVED' || tx.type === 'INVENTORY_DISPATCHED' ? '-' : '+'}{tx.quantity}
                      </td>
                      <td className="px-5 py-3 font-mono text-gray-500">
                        {tx.previousQuantity !== null ? tx.previousQuantity : '—'}
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-gray-750 dark:text-gray-300">
                        {tx.remainingQuantity !== null ? tx.remainingQuantity : '—'}
                      </td>
                      <td className="px-5 py-3 font-medium">
                        {isLinkable ? (
                          <a
                            href={`/#/inquiries/${tx.referenceId}`}
                            className="text-purple-650 hover:text-purple-550 dark:text-purple-400 dark:hover:text-purple-300 font-bold hover:underline"
                          >
                            {tx.referenceNumber}
                          </a>
                        ) : (
                          tx.referenceNumber || '—'
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-500 font-mono text-xs max-w-[120px] truncate" title={tx.actionBy}>
                        {tx.actionBy || 'system'}
                      </td>
                    </tr>
                  );
                }}
              />
              {txTotalItems > 0 && (
                <div className="p-4 border-t border-gray-150 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#1a1d23]">
                  <Pagination
                    currentPage={txCurrentPage}
                    totalPages={txTotalPages}
                    totalItems={txTotalItems}
                    itemsPerPage={txItemsPerPage}
                    onPrev={() => setTxCurrentPage(prev => Math.max(prev - 1, 1))}
                    onNext={() => setTxCurrentPage(prev => Math.min(prev + 1, txTotalPages))}
                    onPageChange={(page) => setTxCurrentPage(page)}
                    onItemsPerPageChange={(size) => {
                      setTxItemsPerPage(size);
                      setTxCurrentPage(1);
                    }}
                    itemLabel="transactions"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
