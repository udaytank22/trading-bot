/**
 * @file InquiryTable.jsx
 * @description Table for the Inquiries module.
 *
 * REFACTORED: Now uses the centralized DataTable shell instead of its own
 * <table> / <thead> / <tbody> boilerplate. This file now only defines:
 *   - Column definitions (header labels)
 *   - Row renderer (how each inquiry maps to a <tr>)
 *
 * ACTIONS PER ROW:
 *   - "View"         → opens DealDrawer (always visible)
 *   - "Send RFQ"     → visible when status is PENDING
 *   - "Send Quote"   → visible when status is RFQ_RECEIVED
 *   - "Confirm Deal" → visible when status is QUOTE_SENT
 *   (Only the relevant action shows; the rest are hidden to reduce clutter)
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
} from "./ui";

// ─── Column definitions ─────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "inquiry_id",   label: "Inquiry ID" },
  { key: "buyer",        label: "Buyer" },
  { key: "products",     label: "Products" },
  { key: "received",     label: "Received", hidden: "hidden lg:table-cell" },
  { key: "status",       label: "Status" },
  { key: "actions",      label: "Actions",  className: "text-right" },
];

// ─── Helper: pick the right action button label/color based on status ───────────
/**
 * Returns the action button props for the dynamic action button.
 * The button text and colour changes based on the inquiry's current status.
 */
function getActionBtn(inq, onAction, currentUser) {
  const role = currentUser?.role || "Admin";
  const status = inq.status;

  // Admin has full rights
  const isAdmin = role === "Admin" || role === "Administrator";

  const map = {
    PENDING: {
      label: "Check Stock",
      variant: "secondary",
      color: "amber",
      allowedRoles: ["Sales Executive", "Sourcing Manager", "Admin"],
    },
    RFQ_READY: {
      label: "Create RFQ",
      variant: "secondary",
      color: "blue",
      allowedRoles: ["Sales Executive", "Sourcing Manager", "Admin"],
    },
    CLIENT_QUOTING: {
      label: "Quote Prices",
      variant: "secondary",
      color: "cyan",
      allowedRoles: ["Client", "Admin"],
    },
    TL_REVIEW: {
      label: "Set Margin",
      variant: "secondary",
      color: "rose",
      allowedRoles: ["Sourcing Manager", "Admin"], // Assuming Sourcing Manager as TL
    },
    ADMIN_APPROVAL: {
      label: "Approve",
      variant: "secondary",
      color: "orange",
      allowedRoles: ["Admin"],
    },
    EMPLOYEE_VERIFY: {
      label: "Verify & Quote",
      variant: "secondary",
      color: "sky",
      allowedRoles: ["Sales Executive", "Sourcing Manager", "Admin"],
    },
    CLIENT_FINAL_APPROVAL: {
      label: "Final Decision",
      variant: "secondary",
      color: "violet",
      allowedRoles: ["Client", "Admin"],
    },
    QUOTE_SENT: {
      label: "Confirm Deal",
      variant: "secondary",
      color: "emerald",
      allowedRoles: ["Admin", "Sales Executive"],
    },
  };

  const cfg = map[status];
  if (!cfg) return null;

  const isAllowed = isAdmin || cfg.allowedRoles.includes(role);
  if (!isAllowed) return null;

  return (
    <Button
      variant="secondary"
      size="sm"
      className={`border-${cfg.color}-500/40 text-${cfg.color}-400 hover:bg-${cfg.color}-500/10`}
      onClick={() => onAction(inq, status)}
    >
      {cfg.label}
    </Button>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * @param {Object}   props
 * @param {Array}    props.items       - Filtered + paginated inquiry records
 * @param {function} props.onView      - Open detail drawer
 * @param {function} props.onAction    - Dynamic action handler
 * @param {Object}   props.currentUser - Current logged in user
 */
const InquiryTable = ({ items, onView, onAction, currentUser }) => {
  /**
   * Renders a single inquiry as a <tr>.
   * DataTable calls this for each item in props.items.
   */
  const renderRow = (inq, idx) => (
    <tr
      key={inq.inquiry_id}
      className={`${ROW_HOVER_CLS} ${rowStripeClass(idx)}`}
    >
      {/* ── Inquiry ID (monospace, muted) ──────────────────────────────── */}
      <td className="px-3 md:px-6 py-4 font-mono text-gray-500 dark:text-gray-400 text-[12px] break-words">
        <Tooltip content={inq.inquiry_id}>
          <span className="cursor-default">{inq.inquiry_id}</span>
        </Tooltip>
      </td>

      {/* ── Buyer name + email stacked ─────────────────────────────────── */}
      <td className="px-3 md:px-6 py-4">
        <div className="flex flex-col">
          <Tooltip content={inq.buyer_name}>
            <span className="text-gray-900 dark:text-white font-bold text-sm cursor-default">
              {inq.buyer_name}
            </span>
          </Tooltip>
          <Tooltip content={inq.buyer_email}>
            <span className="text-gray-500 text-[11px] break-all cursor-default">
              {inq.buyer_email}
            </span>
          </Tooltip>
        </div>
      </td>

      {/* ── First product + "+N more" badge ───────────────────────────── */}
      <td className="px-3 md:px-6 py-4">
        <div className="flex flex-col gap-1">
          <Tooltip content={inq.products.map((p) => p.product_name).join(", ")}>
            <span className="text-gray-600 dark:text-gray-300 text-sm cursor-default">
              {inq.products[0]?.product_name}
            </span>
          </Tooltip>
          {inq.products.length > 1 && (
            <Tooltip content={inq.products.map((p) => p.product_name).join(", ")}>
              <span className="inline-block w-fit px-2 py-[2px] bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded-lg cursor-default border border-gray-200 dark:border-none">
                +{inq.products.length - 1} more
              </span>
            </Tooltip>
          )}
        </div>
      </td>

      {/* ── Date received (hidden on small screens) ─────────────────────── */}
      <td className="px-3 md:px-6 py-4 hidden lg:table-cell">
        <Tooltip content={new Date(inq.date_received).toLocaleString("en-GB")}>
          <DateCell isoString={inq.date_received} />
        </Tooltip>
      </td>

      {/* ── Status badge (single source from StatusBadge) ──────────────── */}
      <td className="px-3 md:px-6 py-4">
        <StatusBadge status={inq.status} />
      </td>

      {/* ── Actions: View always + dynamic action based on status ──────── */}
      <td className="px-3 md:px-6 py-4">
        <div className="flex flex-col md:flex-row items-end justify-end gap-2">
          {/* View button is always present */}
          <Button
            variant="secondary"
            size="sm"
            className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
            onClick={() => onView(inq)}
          >
            View
          </Button>

          {/* Dynamic action changes based on inquiry status */}
          {getActionBtn(inq, onAction, currentUser)}
        </div>
      </td>
    </tr>
  );

  return (
    <DataTable
      columns={COLUMNS}
      data={items}
      renderRow={renderRow}
      emptyMessage="No inquiries found."
    />
  );
};

export default InquiryTable;
