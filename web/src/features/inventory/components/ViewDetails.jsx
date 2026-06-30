import React from 'react';
import { DataTable } from '@components/ui';

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

export function ViewDetails({ item, onClose }) {
  const details = {
    "IMPA": item.impa,
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
