/**
 * @file SupplyTable.jsx
 * @description Table for the Supply / Cargo Tracking module.
 *
 * REFACTORED: Now uses centralized DataTable, Button, StatusBadge from ui/index.
 * The previous version used a custom getStatusStyle() prop — now replaced by
 * the unified StatusBadge which covers all supply statuses (PENDING, LOADING,
 * IN_TRANSIT, DELIVERED).
 *
 * ACTIONS PER ROW:
 *   - "View"    → opens SupplyViewModal for cargo details
 *   - "Contact" → opens ContactModal to message the supplier
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
} from "./ui";

// ─── Column definitions ─────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "inquiry_id",   label: "Cargo ID" },
  { key: "supplier",     label: "Supplier" },
  { key: "cargo",        label: "Cargo" },
  { key: "quantity",     label: "Quantity",    hidden: "hidden md:table-cell" },
  { key: "destination",  label: "Destination", hidden: "hidden lg:table-cell" },
  { key: "status",       label: "Status" },
  { key: "actions",      label: "Actions",     className: "text-right" },
];

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * @param {Object}   props
 * @param {Array}    props.items     - Filtered + paginated supply records
 * @param {function} props.onView    - Opens SupplyViewModal
 * @param {function} props.onContact - Opens ContactModal
 *
 * NOTE: The old `getStatusStyle` prop has been removed. StatusBadge now handles
 * all supply statuses internally via its STATUS_STYLES map.
 */
const SupplyTable = ({ items, onView, onContact }) => {
  const renderRow = (item, idx) => (
    <tr
      key={item.inquiry_id}
      className={`${ROW_HOVER_CLS} ${rowStripeClass(idx)}`}
    >
      {/* ── Cargo ID (monospace, muted) ───────────────────────────────── */}
      <td className="px-4 md:px-6 py-4 text-sm text-gray-400">
        <Tooltip content={item.inquiry_id}>
          <span className="cursor-default">{item.inquiry_id}</span>
        </Tooltip>
      </td>

      {/* ── Supplier name + buyer email stacked ───────────────────────── */}
      <td className="px-4 md:px-6 py-4">
        <div className="flex flex-col">
          <Tooltip content={item.supplier}>
            <span className="text-gray-900 dark:text-white font-semibold text-sm cursor-default">
              {item.supplier}
            </span>
          </Tooltip>
          <Tooltip content={item.buyer_email}>
            <span className="text-gray-500 text-[11px] break-all cursor-default">
              {item.buyer_email}
            </span>
          </Tooltip>
        </div>
      </td>

      {/* ── Cargo description ─────────────────────────────────────────── */}
      <td className="px-4 md:px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
        <Tooltip content={item.cargo}>
          <span className="cursor-default">{item.cargo}</span>
        </Tooltip>
      </td>

      {/* ── Quantity (hidden on mobile) ────────────────────────────────── */}
      <td className="px-4 md:px-6 py-4 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
        <Tooltip content={item.quantity}>
          <span className="cursor-default">{item.quantity}</span>
        </Tooltip>
      </td>

      {/* ── Destination (hidden on tablet) ────────────────────────────── */}
      <td className="px-4 md:px-6 py-4 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">
        <Tooltip content={item.destination}>
          <span className="cursor-default">{item.destination}</span>
        </Tooltip>
      </td>

      {/* ── Status badge (uses unified StatusBadge) ────────────────────── */}
      <td className="px-4 md:px-6 py-4">
        <StatusBadge status={item.status} />
      </td>

      {/* ── Actions: View + Contact ────────────────────────────────────── */}
      <td className="px-4 md:px-6 py-4 text-right">
        <div className="flex flex-col md:flex-row justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
            onClick={() => onView(item)}
          >
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            onClick={() => onContact(item)}
          >
            Contact
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
      emptyMessage="No cargo supply records found."
    />
  );
};

export default SupplyTable;
