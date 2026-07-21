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
  { key: "sr_no", label: "#" },
  { key: "po_id", label: "PO ID" },
  { key: "customer", label: "CUSTOMER" },
  { key: "vessel", label: "VESSEL" },
  { key: "products", label: "PRODUCTS" },
  { key: "date", label: "DATE" },
  { key: "status", label: "STATUS" },
  { key: "actions", label: "", className: "text-right" },
];

const formatDate = (isoString) => {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch (e) {
    return "—";
  }
};

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * @param {Object}   props
 * @param {Array}    props.items   - Filtered + paginated PO records
 * @param {function} props.onView  - Open PODrawer for detail view
 * @param {function} props.onOrder - Open POEmailModal to place order
 * @param {Object}   [props.paginationProps]
 */
const POTable = ({ items, onView, onOrder, paginationProps }) => {
  const renderRow = (po, idx) => (
    <tr
      key={po.po_id}
      className={`${ROW_HOVER_CLS} ${rowStripeClass(idx)} border-b border-[#eee8dd] dark:border-[#2a2d33]`}
    >
      <td className="px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">{idx + 1}</td>
      
      {/* ── PO ID (monospace teal link) ─────────────────────────────────── */}
      <td className="px-5 py-3.5 font-mono text-[#0f6460] dark:text-teal-400 font-medium cursor-pointer hover:underline" onClick={() => onView(po)}>
        {po.po_id}
      </td>

      {/* ── Customer name ─────────────────────────────────────────────── */}
      <td className="px-5 py-3.5 font-bold text-[#1e293b] dark:text-white">
        {po.customer}
      </td>

      {/* ── Vessel name ───────────────────────────────────────────────── */}
      <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-medium">
        {po.vessel}
      </td>

      {/* ── First product + "+N more" badge ───────────────────────────── */}
      <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-medium">
        <div className="flex items-center gap-1.5">
          {po.products && po.products.length > 0 ? (
            <span>{po.products[0]?.product_name}</span>
          ) : po._count?.items > 0 ? (
            <span>{po._count.items} item{po._count.items !== 1 ? 's' : ''}</span>
          ) : (
            <span>—</span>
          )}
          {po.products && po.products.length > 1 && (
            <span className="px-2 py-[2px] bg-[#f4efe6] dark:bg-gray-700/60 text-gray-650 dark:text-gray-300 text-[10px] font-bold rounded-lg border border-[#e6e0d2] dark:border-none">
              +{po.products.length - 1}
            </span>
          )}
        </div>
      </td>

      {/* ── Date formatted as e.g. "18 Jul" ───────────────────────────── */}
      <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-medium">
        {formatDate(po.date)}
      </td>

      {/* ── Status badge ──────────────────────────────────────────────── */}
      <td className="px-5 py-3.5">
        <StatusBadge status={po.status} />
      </td>

      {/* ── Actions (teal links instead of buttons) ───────────────────── */}
      <td className="px-5 py-3.5 text-right space-x-3">
        <span onClick={() => onView(po)} className="text-[#0f6460] dark:text-teal-400 hover:underline font-bold text-sm cursor-pointer">
          View
        </span>
        {po.status !== "ORDERED" && onOrder && (
          <span onClick={() => onOrder(po)} className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-sm cursor-pointer">
            Order
          </span>
        )}
      </td>
    </tr>
  );

  return (
    <DataTable
      columns={COLUMNS}
      data={items}
      renderRow={renderRow}
      emptyMessage="No purchase orders found."
      paginationProps={paginationProps}
    />
  );
};

export default POTable;
