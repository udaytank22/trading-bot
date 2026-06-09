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
} from '@components/ui';

// ─── Column definitions ─────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "sr_no",       label: "#",           className: "w-10 text-center" },
  { key: "shipment_no", label: "Shipment No." },
  { key: "supplier",    label: "Supplier" },
  { key: "cargo",       label: "Cargo" },
  { key: "quantity",    label: "Quantity",    hidden: "hidden lg:table-cell" },
  { key: "destination", label: "Destination", hidden: "hidden xl:table-cell" },
  { key: "status",      label: "Status" },
  { key: "actions",     label: "Actions",     className: "text-right" },
];

/**
 * @param {Object}   props
 * @param {Array}    props.items          - Filtered + paginated supply records
 * @param {function} props.onView         - Navigate to detail page
 * @param {function} props.onContact      - Opens ContactModal
 * @param {function} props.onAllot        - Opens AllotVehicleModal
 * @param {function} props.onStatusUpdate - Updates shipment status
 */
const SupplyTable = ({ items, onView, onContact, onAllot, onStatusUpdate }) => {
  const renderRow = (item, idx) => (
    <tr
      key={item.id || idx}
      className={`${ROW_HOVER_CLS} ${rowStripeClass(idx)}`}
    >
      <td className="px-4 md:px-6 py-4 text-center text-gray-500 text-sm font-medium">{idx + 1}</td>

      {/* ── Shipment Number ─────────────────────────────────────────── */}
      <td className="px-4 md:px-6 py-4 text-sm text-gray-400 font-mono">
        <Tooltip content={item.shipmentNumber || `SH-${item.id}`}>
          <span className="cursor-default">{item.shipmentNumber || `SH-${item.id}`}</span>
        </Tooltip>
      </td>

      {/* ── Supplier name ───────────────────────────────────────────── */}
      <td className="px-4 md:px-6 py-4">
        <div className="flex flex-col">
          <Tooltip content={item.supplier}>
            <span className="text-gray-900 dark:text-white font-semibold text-sm cursor-default">
              {item.supplier}
            </span>
          </Tooltip>
          {item.buyer_email && (
            <Tooltip content={item.buyer_email}>
              <span className="text-gray-500 text-[11px] break-all cursor-default">
                {item.buyer_email}
              </span>
            </Tooltip>
          )}
        </div>
      </td>

      {/* ── Cargo description ─────────────────────────────────────────── */}
      <td className="px-4 md:px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-[250px]">
        <Tooltip content={item.cargo}>
          <span className="cursor-default truncate block">{item.cargo}</span>
        </Tooltip>
      </td>

      {/* ── Quantity (hidden on mobile) ────────────────────────────────── */}
      <td className="px-4 md:px-6 py-4 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">
        <span>{item.quantity || '—'}</span>
      </td>

      {/* ── Destination (hidden on tablet) ────────────────────────────── */}
      <td className="px-4 md:px-6 py-4 text-sm text-gray-600 dark:text-gray-300 hidden xl:table-cell">
        <Tooltip content={item.destination}>
          <span className="cursor-default">{item.destination}</span>
        </Tooltip>
      </td>

      {/* ── Status badge ────────────────────────────────────────────── */}
      <td className="px-4 md:px-6 py-4">
        <StatusBadge status={item.status} />
      </td>

      {/* ── Actions: Dynamic based on Status ───────────────────────── */}
      <td className="px-4 md:px-6 py-4 text-right">
        <div className="flex flex-col md:flex-row justify-end gap-2">


          {item.status === "LOADING" && (
            <Button
              variant="secondary"
              size="sm"
              className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
              onClick={() => {
                if (confirm("Mark this cargo as loaded and advance to IN_TRANSIT?")) {
                  onStatusUpdate(item.id, "IN_TRANSIT");
                }
              }}
            >
              Mark Loaded
            </Button>
          )}

          {item.status === "LOADING" && (
            <Button
              variant="secondary"
              size="sm"
              className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
              onClick={() => onAllot(item)}
            >
              Allot Vehicle
            </Button>
          )}

          {(item.status === "IN_TRANSIT" || item.status === "DISPATCHED") && (
            <Button
              variant="secondary"
              size="sm"
              className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
              onClick={() => onStatusUpdate(item.id, "DELIVERED")}
            >
              Mark Delivered
            </Button>
          )}

          {item.status === "DELIVERED" && (
            <Button
              variant="secondary"
              size="sm"
              className="border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10"
              onClick={() => onStatusUpdate(item.id, "SEND_INVOICE")}
            >
              Send Invoice
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
            onClick={() => onView(item)}
          >
            View
          </Button>

          {item.status === "SHIPPED" && (
            <Button
              variant="secondary"
              size="sm"
              className="border-green-500/40 text-green-400 hover:bg-green-500/10"
              onClick={() => onStatusUpdate(item.id, "SUPPLY")}
            >
              Move to Supply
            </Button>
          )}
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
