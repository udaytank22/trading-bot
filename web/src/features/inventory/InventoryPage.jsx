import { InventoryPageSchema1 } from '@config/tableSchemas';
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { confirmAction } from '@utils/swal';
import { PageToolbar, DataTable, rowStripeClass, ROW_HOVER_CLS } from '@components/ui';
import {
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  moveStock
} from '../../api/inventory';
import { useAuth } from '@context';
import { useTablePageSize } from '@hooks/useTablePageSize';
import { useInventory } from '@hooks/queries/useInventory';

// Components
import { RightDrawer } from './components/RightDrawer';
import { ViewDetails } from './components/ViewDetails';
import { InventoryForm } from './components/InventoryForm';
import { TransactionFilters } from './components/TransactionFilters';

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

  const {
    inventory,
    setInventory,
    loading,
    loadInventory,
    transactions,
    txTotalItems,
    txTotalPages,
    txLoading,
    loadTransactions
  } = useInventory();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'transactions'

  // Transactions local state
  const [txCurrentPage, setTxCurrentPage] = useState(1);
  const [txItemsPerPage, setTxItemsPerPage] = useTablePageSize(50);

  const [txTypeFilter, setTxTypeFilter] = useState('');
  const [txItemSearch, setTxItemSearch] = useState('');
  const [txStartDate, setTxStartDate] = useState('');
  const [txEndDate, setTxEndDate] = useState('');
  const [txRefNumber, setTxRefNumber] = useState('');

  useEffect(() => {
    if (activeTab === 'transactions') {
      const timer = setTimeout(() => {
        loadTransactions({
          page: txCurrentPage,
          pageSize: txItemsPerPage,
          type: txTypeFilter || undefined,
          itemName: txItemSearch || undefined,
          startDate: txStartDate || undefined,
          endDate: txEndDate || undefined,
          referenceNumber: txRefNumber || undefined
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, txCurrentPage, txItemsPerPage, txTypeFilter, txItemSearch, txStartDate, txEndDate, txRefNumber]);

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
    { key: "date", label: "Date & Time", renderCell: (row) => new Date(row.createdAt).toLocaleString() },
    { key: "itemName", label: "Item Name", renderCell: (row) => row.inventoryItem?.itemName },
    { key: "type", label: "Type", renderCell: (row) => row.type },
    { key: "qty", label: "Qty", renderCell: (row) => row.quantity },
    { key: "prev", label: "Prev Stock", renderCell: (row) => row.previousQuantity },
    { key: "rem", label: "Rem Stock", renderCell: (row) => row.remainingQuantity },
    { key: "inquiry", label: "Inquiry #", renderCell: (row) => row.referenceNumber },
    { key: "actionBy", label: "Action By", renderCell: (row) => row.actionBy }
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
            <TransactionFilters
              txItemSearch={txItemSearch} setTxItemSearch={(val) => { setTxItemSearch(val); setTxCurrentPage(1); }}
              txRefNumber={txRefNumber} setTxRefNumber={(val) => { setTxRefNumber(val); setTxCurrentPage(1); }}
              txTypeFilter={txTypeFilter} setTxTypeFilter={(val) => { setTxTypeFilter(val); setTxCurrentPage(1); }}
              txStartDate={txStartDate} setTxStartDate={(val) => { setTxStartDate(val); setTxCurrentPage(1); }}
              txEndDate={txEndDate} setTxEndDate={(val) => { setTxEndDate(val); setTxCurrentPage(1); }}
            />

            <div className="flex justify-between items-center px-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Transaction Log</h2>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2d36] rounded-lg border border-gray-200 dark:border-[#2a2d36] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            </div>

            <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden flex flex-col shadow-lg transition-colors duration-300">
              <DataTable
                columns={txColumns}
                data={transactions}
                emptyMessage={txLoading ? "Loading transactions..." : "No transactions found matching criteria."}
                paginationProps={txTotalPages > 0 ? {
                  currentPage: txCurrentPage,
                  totalPages: txTotalPages,
                  totalItems: txTotalItems,
                  itemsPerPage: 10,
                  onPrev: () => setTxCurrentPage(p => Math.max(1, p - 1)),
                  onNext: () => setTxCurrentPage(p => Math.min(txTotalPages, p + 1)),
                  onPageChange: (p) => setTxCurrentPage(p),
                  onItemsPerPageChange: undefined,
                  itemLabel: "transactions"
                } : undefined}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
