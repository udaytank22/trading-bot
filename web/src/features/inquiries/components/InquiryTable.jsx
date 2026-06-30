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
} from '@components/ui';

// ─── Column definitions ─────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "sr_no", label: "#", className: "w-10 text-center" },
  { key: "inquiry_id",   label: "Order Reference" },
  { key: "buyer",        label: "Customer" },
  { key: "vessel",       label: "Vessel Name", hidden: "hidden md:table-cell" },
  { key: "received",     label: "Inquiry Date", hidden: "hidden lg:table-cell" },
  { key: "status",       label: "Enquiry Status" },
  { key: "actions",      label: "Actions",  className: "text-right" },
];

// ─── Color Classes Map (Static classes to guarantee Tailwind compilation) ───────
const COLOR_CLASSES = {
  amber: "border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10",
  blue: "border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10",
  cyan: "border-cyan-500/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10",
  rose: "border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10",
  orange: "border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10",
  sky: "border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10",
  violet: "border-violet-500/40 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10",
  emerald: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10",
};

// ─── Helper: pick the right action button label/color based on status ───────────
/**
 * Returns the action button props for the dynamic action button.
 * The button text and colour changes based on the inquiry's current status.
 */
function getActionBtn(inq, onAction, currentUser) {
  const role = currentUser?.role || "Admin";
  const status = inq.status;

  const map = {
    PENDING: {
      label: "Check Stock",
      variant: "secondary",
      color: "amber",
    },
    RFQ_READY: {
      label: "Create RFQ",
      variant: "secondary",
      color: "blue",
    },
    CLIENT_QUOTING: {
      label: "Quote Prices",
      variant: "secondary",
      color: "cyan",
    },
    TL_REVIEW: {
      label: "Set Margin",
      variant: "secondary",
      color: "rose",
    },
    ADMIN_APPROVAL: {
      label: "Approve",
      variant: "secondary",
      color: "orange",
    },
    EMPLOYEE_VERIFY: {
      label: "Verify & Quote",
      variant: "secondary",
      color: "sky",
    },
    CLIENT_FINAL_APPROVAL: {
      label: "Final Decision",
      variant: "secondary",
      color: "violet",
    },
    QUOTE_SENT: {
      label: "Confirm Deal",
      variant: "secondary",
      color: "emerald",
    },
  };

  const cfg = map[status];
  if (!cfg) return null;

  const isRoleAllowed = (status, roleName) => {
    const rNameLower = roleName?.toLowerCase();
    if (rNameLower === "admin" || rNameLower === "super admin" || rNameLower === "administrator") return true;
    if (rNameLower === "viewer") return false;

    switch (status) {
      case "PENDING":
      case "RFQ_READY":
      case "EMPLOYEE_VERIFY":
      case "QUOTE_SENT":
        return rNameLower === "employee" || rNameLower === "team lead";
      case "TL_REVIEW":
        return rNameLower === "team lead";
      case "CLIENT_QUOTING":
      case "CLIENT_FINAL_APPROVAL":
        return rNameLower === "client";
      case "ADMIN_APPROVAL":
        return false;
      default:
        return false;
    }
  };

  const isAllowed = isRoleAllowed(status, role);
  if (!isAllowed) return null;

  const btnClass = COLOR_CLASSES[cfg.color] || "";

  return (
    <Button
      variant="secondary"
      size="sm"
      className={btnClass}
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
 * @param {Object}   [props.paginationProps]
 */
const InquiryTable = ({ items, onView, onAction, currentUser, paginationProps }) => {
  const COLUMNS_SCHEMA = [
    { key: "sr_no", label: "#", cellClassName: "text-center text-gray-500 text-sm font-medium w-10", renderCell: (_, idx) => idx + 1 },
    { 
      key: "inquiry_id",   
      label: "Order Reference", 
      cellClassName: "font-mono text-gray-900 dark:text-white text-[12px] md:text-[13px] font-bold break-words",
      renderCell: (inq) => (
        <Tooltip content={
          inq.products && inq.products.length > 0
            ? inq.products.map((p) => `${p.product_name} (${p.quantity} ${p.unit})`).join(", ")
            : `${inq._count?.items || 0} items`
        }>
          <div className="flex flex-col">
            <span className="cursor-pointer hover:text-purple-400 transition-colors" onClick={() => onView(inq)}>{inq.inquiry_id}</span>
            {inq.products && inq.products.length > 0 ? (
              <span className="text-gray-500 text-[11px] font-normal font-sans">
                {inq.products[0].product_name}
                {inq.products.length > 1 && ` (+${inq.products.length - 1} more)`}
              </span>
            ) : inq._count?.items > 0 ? (
              <span className="text-gray-500 text-[11px] font-normal font-sans">
                {inq._count.items} item{inq._count.items !== 1 ? 's' : ''}
              </span>
            ) : null}
          </div>
        </Tooltip>
      )
    },
    { 
      key: "buyer",        
      label: "Customer",
      renderCell: (inq) => (
        <div className="flex flex-col">
          <Tooltip content={inq.buyer_email}>
            <span className="text-gray-900 dark:text-white font-bold text-sm cursor-default">
              {inq.buyer_name}
            </span>
          </Tooltip>
          <span className="text-gray-500 text-[11px] cursor-default break-all">
            {inq.buyer_email}
          </span>
        </div>
      )
    },
    { 
      key: "vessel",       
      label: "Vessel Name", 
      hidden: "hidden md:table-cell",
      renderCell: (inq) => (
        <span className="text-gray-900 dark:text-white font-semibold text-[13px] cursor-default">
          {inq.vesselName || "—"}
        </span>
      )
    },
    { 
      key: "received",     
      label: "Inquiry Date", 
      hidden: "hidden lg:table-cell",
      renderCell: (inq) => (
        <Tooltip content={new Date(inq.date_received).toLocaleString("en-GB")}>
          <span className="text-gray-600 dark:text-gray-300 text-sm cursor-default">
            {new Date(inq.date_received).toLocaleString("en-GB", {
              day: "2-digit", month: "2-digit", year: "numeric",
              hour: "2-digit", minute: "2-digit", second: "2-digit",
              hour12: false
            }).replace(/,/g, "")}
          </span>
        </Tooltip>
      )
    },
    { 
      key: "status",       
      label: "Enquiry Status",
      renderCell: (inq) => <StatusBadge status={inq.status} />
    },
    { 
      key: "actions",      
      label: "Actions",  
      cellClassName: "text-right",
      renderCell: (inq) => (
        <div className="flex items-center justify-end gap-1 md:gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
            onClick={() => onView(inq)}
          >
            View
          </Button>
          {getActionBtn(inq, onAction, currentUser)}
        </div>
      )
    },
  ];

  return (
    <DataTable
      columns={COLUMNS_SCHEMA}
      data={items}
      emptyMessage="No inquiries found."
      paginationProps={paginationProps}
    />
  );
};

export default InquiryTable;
