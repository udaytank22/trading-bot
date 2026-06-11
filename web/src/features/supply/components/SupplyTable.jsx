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
  { key: "sr_no",       label: "#",           className: "w-10 text-center" },
  { key: "order_id",    label: "Order ID" },
  { key: "customer",    label: "Customer" },
  { key: "vessel",      label: "Vessel",      hidden: "hidden lg:table-cell" },
  { key: "products",    label: "Products" },
  { key: "date",        label: "Date",        hidden: "hidden xl:table-cell" },
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

      {/* ── Order ID (monospace) ─────────────────────────────────────────── */}
      <td className="px-3 md:px-6 py-4 font-mono text-gray-400 text-[12px] break-words">
        <Tooltip content={item.shipmentNumber || `SH-${item.id}`}>
          <span className="cursor-default">{item.shipmentNumber || `SH-${item.id}`}</span>
        </Tooltip>
      </td>

      {/* ── Customer name ───────────────────────────────────────────── */}
      <td className="px-3 md:px-6 py-4">
        <Tooltip content={item.customer || item.supplier}>
          <span className="text-gray-900 dark:text-white font-bold text-sm cursor-default">
            {item.customer || item.supplier}
          </span>
        </Tooltip>
      </td>

      {/* ── Vessel name ───────────────────────────────────────────────── */}
      <td className="px-3 md:px-6 py-4 hidden lg:table-cell">
        <Tooltip content={item.vessel || item.destination}>
          <span className="text-gray-600 dark:text-gray-300 text-sm font-medium cursor-default">
            {item.vessel || item.destination}
          </span>
        </Tooltip>
      </td>

      {/* ── First product + "+N more" badge ───────────────────────────── */}
      <td className="px-3 md:px-6 py-4">
        <div className="flex flex-col gap-1">
          <Tooltip content={item.products?.map((p) => p.product_name).join(", ") || item.cargo}>
            <span className="text-gray-600 dark:text-gray-300 text-sm cursor-default">
              {item.products?.[0]?.product_name || item.cargo}
            </span>
          </Tooltip>
          {item.products && item.products.length > 1 && (
            <Tooltip content={item.products.map((p) => p.product_name).join(", ")}>
              <span className="inline-block w-fit px-2 py-[2px] bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded-lg cursor-default border border-gray-200 dark:border-none">
                +{item.products.length - 1} more
              </span>
            </Tooltip>
          )}
        </div>
      </td>

      {/* ── Date (hidden on small screens) ────────────────────────────── */}
      <td className="px-3 md:px-6 py-4 hidden xl:table-cell">
        <Tooltip content={new Date(item.date).toLocaleString("en-GB")}>
          <DateCell isoString={item.date} />
        </Tooltip>
      </td>

      {/* ── Status badge ────────────────────────────────────────────── */}
      <td className="px-4 md:px-6 py-4">
        <StatusBadge status={item.status} />
      </td>

      {/* ── Actions: Dynamic based on Status ───────────────────────── */}
      <td className="px-4 md:px-6 py-4 text-right">
        <div className="flex flex-col md:flex-row justify-end gap-2">


          {!item.isGrouped && item.status === "LOADING" && (
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

          {!item.isGrouped && item.status === "LOADING" && (
            <Button
              variant="secondary"
              size="sm"
              className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
              onClick={() => onAllot(item)}
            >
              Allot Vehicle
            </Button>
          )}

          {!item.isGrouped && (item.status === "IN_TRANSIT" || item.status === "DISPATCHED") && (
            <Button
              variant="secondary"
              size="sm"
              className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
              onClick={() => onStatusUpdate(item.id, "DELIVERED")}
            >
              Mark Delivered
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

          {!item.isGrouped && item.status === "SHIPPED" && (
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
