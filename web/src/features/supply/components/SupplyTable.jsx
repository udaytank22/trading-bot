/**
 * @file SupplyTable.jsx
 * @description Table for the Supply / Cargo Tracking module.
 *
 * REFACTORED: Now uses centralized DataTable, Button, StatusBadge from ui/index.
 * All action callbacks now use item.id (the shipment integer ID), not item.inquiry_id.
 *
 * @author TradeMind Dev Team
 */

import React from "react";
import {
  DataTable,
  rowStripeClass,
  ROW_HOVER_CLS,
  StatusBadge,
  Tooltip,
  Button,
  DateCell,
} from '@components/ui';

// ─── Column definitions ─────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "sr_no", label: "#" },
  { key: "order_id", label: "ORDER ID" },
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

/**
 * @param {Object}   props
 * @param {Array}    props.items          - Filtered + paginated supply records
 * @param {function} props.onView         - Navigate to detail page
 * @param {function} props.onContact      - Opens ContactModal
 * @param {function} props.onAllot        - Opens AllotVehicleModal
 * @param {function} props.onStatusUpdate - Updates shipment status
 * @param {Object}   [props.paginationProps]
 */
const SupplyTable = ({ items, onView, onContact, onAllot, onStatusUpdate, paginationProps }) => {
  const renderRow = (item, idx) => (
    <tr
      key={item.id || idx}
      className={`${ROW_HOVER_CLS} ${rowStripeClass(idx)} border-b border-[#eee8dd] dark:border-[#2a2d33]`}
    >
      <td className="px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">{idx + 1}</td>

      {/* ── Order ID (monospace teal link) ───────────────────────────────── */}
      <td className="px-5 py-3.5 font-mono text-[#0f6460] dark:text-teal-400 font-medium cursor-pointer hover:underline" onClick={() => onView(item)}>
        {item.shipmentNumber || `SH-${item.id}`}
      </td>

      {/* ── Customer name ───────────────────────────────────────────── */}
      <td className="px-5 py-3.5 font-bold text-[#1e293b] dark:text-white">
        {item.customer || item.supplier}
      </td>

      {/* ── Vessel name ───────────────────────────────────────────────── */}
      <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-medium">
        {item.vessel || item.destination}
      </td>

      {/* ── First product + "+N more" badge ───────────────────────────── */}
      <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-medium">
        <div className="flex items-center gap-1.5">
          <span>{item.products?.[0]?.product_name || item.cargo}</span>
          {item.products && item.products.length > 1 && (
            <span className="px-2 py-[2px] bg-[#f4efe6] dark:bg-gray-700/60 text-gray-650 dark:text-gray-300 text-[10px] font-bold rounded-lg border border-[#e6e0d2] dark:border-none">
              +{item.products.length - 1}
            </span>
          )}
        </div>
      </td>

      {/* ── Date formatted as e.g. "18 Jul" ───────────────────────────── */}
      <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-medium">
        {formatDate(item.date)}
      </td>

      {/* ── Status badge ────────────────────────────────────────────── */}
      <td className="px-5 py-3.5">
        <StatusBadge status={item.status} />
      </td>

      {/* ── Actions: Dynamic text links ─────────────────────────────── */}
      <td className="px-5 py-3.5 text-right space-x-3">
        {!item.isGrouped && item.status === "LOADING" && onStatusUpdate && (
          <span
            onClick={() => {
              if (confirm("Mark this cargo as loaded and advance to IN_TRANSIT?")) {
                onStatusUpdate(item.id, "IN_TRANSIT");
              }
            }}
            className="text-orange-650 dark:text-orange-400 hover:underline font-bold text-sm cursor-pointer"
          >
            Mark Loaded
          </span>
        )}

        {!item.isGrouped && item.status === "LOADING" && onAllot && (
          <span
            onClick={() => onAllot(item)}
            className="text-purple-600 dark:text-purple-400 hover:underline font-bold text-sm cursor-pointer"
          >
            Allot Vehicle
          </span>
        )}

        {!item.isGrouped && (item.status === "IN_TRANSIT" || item.status === "DISPATCHED") && onStatusUpdate && (
          <span
            onClick={() => onStatusUpdate(item.id, "DELIVERED")}
            className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-sm cursor-pointer"
          >
            Mark Delivered
          </span>
        )}

        <span
          onClick={() => onView(item)}
          className="text-[#0f6460] dark:text-teal-400 hover:underline font-bold text-sm cursor-pointer"
        >
          View
        </span>

        {!item.isGrouped && item.status === "SHIPPED" && onStatusUpdate && (
          <span
            onClick={() => onStatusUpdate(item.id, "SUPPLY")}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold text-sm cursor-pointer"
          >
            Move to Supply
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
      emptyMessage="No cargo supply records found."
      paginationProps={paginationProps}
    />
  );
};

export default SupplyTable;
