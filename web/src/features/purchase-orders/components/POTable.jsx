/**
 * @file POTable.jsx
 * @description Table for the Purchase Orders module.
 *
 * REFACTORED: Now uses centralized DataTable, Button, StatusBadge, DateCell.
 *
 * ACTIONS PER ROW:
 *   - "View"  → opens PODrawer sidebar
 *   - "Order" → opens POEmailModal to send the order email
 *
 * @author TradeMind Dev Team
 */

import React from "react";
import {
  DataTable,
  rowStripeClass,
  ROW_HOVER_CLS,
  StatusBadge,
  DateCell,
  Tooltip,
  Button,
} from '@components/ui';

// ─── Column definitions ─────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "sr_no", label: "#", className: "w-10 text-center" },
  { key: "po_id",    label: "PO ID" },
  { key: "customer", label: "Customer" },
  { key: "vessel",   label: "Vessel",  hidden: "hidden lg:table-cell" },
  { key: "products", label: "Products" },
  { key: "date",     label: "Date",    hidden: "hidden xl:table-cell" },
  { key: "status",   label: "Status" },
  { key: "actions",  label: "Actions", className: "text-right" },
];

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * @param {Object}   props
 * @param {Array}    props.items   - Filtered + paginated PO records
 * @param {function} props.onView  - Open PODrawer for detail view
 * @param {function} props.onOrder - Open POEmailModal to place order
 */
const POTable = ({ items, onView, onOrder }) => {
  const renderRow = (po, idx) => (
    <tr
      key={po.po_id}
      className={`${ROW_HOVER_CLS} ${rowStripeClass(idx)}`}
    >
      <td className="px-3 md:px-6 py-4 text-center text-gray-500 text-sm font-medium">{idx + 1}</td>
      {/* ── PO ID (monospace) ─────────────────────────────────────────── */}
      <td className="px-3 md:px-6 py-4 font-mono text-gray-400 text-[12px] break-words">
        <Tooltip content={po.po_id}>
          <span className="cursor-default">{po.po_id}</span>
        </Tooltip>
      </td>

      {/* ── Customer name ─────────────────────────────────────────────── */}
      <td className="px-3 md:px-6 py-4">
        <Tooltip content={po.customer}>
          <span className="text-gray-900 dark:text-white font-bold text-sm cursor-default">
            {po.customer}
          </span>
        </Tooltip>
      </td>

      {/* ── Vessel name ───────────────────────────────────────────────── */}
      <td className="px-3 md:px-6 py-4 hidden lg:table-cell">
        <Tooltip content={po.vessel}>
          <span className="text-gray-600 dark:text-gray-300 text-sm font-medium cursor-default">
            {po.vessel}
          </span>
        </Tooltip>
      </td>

      {/* ── First product + "+N more" badge ───────────────────────────── */}
      <td className="px-3 md:px-6 py-4">
        <div className="flex flex-col gap-1">
          <Tooltip content={po.products.map((p) => p.product_name).join(", ")}>
            <span className="text-gray-600 dark:text-gray-300 text-sm cursor-default">
              {po.products[0]?.product_name}
            </span>
          </Tooltip>
          {po.products.length > 1 && (
            <Tooltip content={po.products.map((p) => p.product_name).join(", ")}>
              <span className="inline-block w-fit px-2 py-[2px] bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded-lg cursor-default border border-gray-200 dark:border-none">
                +{po.products.length - 1} more
              </span>
            </Tooltip>
          )}
        </div>
      </td>

      {/* ── Date (hidden on small screens) ────────────────────────────── */}
      <td className="px-3 md:px-6 py-4 hidden xl:table-cell">
        <Tooltip content={new Date(po.date).toLocaleString("en-GB")}>
          <DateCell isoString={po.date} />
        </Tooltip>
      </td>

      {/* ── Status badge ──────────────────────────────────────────────── */}
      <td className="px-3 md:px-6 py-4">
        <StatusBadge status={po.status} />
      </td>

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <td className="px-3 md:px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
            onClick={() => onView(po)}
          >
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
            onClick={() => onOrder(po)}
          >
            Order
          </Button>
        </div>
      </td>
    </tr>
  );

  return (
    <DataTable
      columns={COLUMNS}
      data={items}
      renderRow={renderRow}
      emptyMessage="No purchase orders found."
    />
  );
};

export default POTable;
