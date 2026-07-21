/**
* @file StatusBadge.jsx
* @description Centralized status badge — single source of truth for ALL status
*              values across every module in TradeMind.
*
* MODULES COVERED:
*   - Inquiries  → PENDING, RFQ_SENT, RFQ_RECEIVED, QUOTE_SENT, CONFIRMED, CLOSED
*   - Purchase Orders → PENDING, CONFIRMED, SHIPPED, CLOSED
*   - Supply     → PENDING, LOADING, IN_TRANSIT, DELIVERED
*   - Employees  → Active, Inactive
*   - Accounts   → Active, Inactive
*
* WHY ONE FILE:
*   Previously each module had its own badge (Employee had an inline StatusBadge,
*   Supply passed getStatusStyle() as a prop, PO/Inquiry used this file but
*   didn't cover all statuses). Now one map handles everything.
*
* ADDING A NEW STATUS:
*   1. Add an entry to STATUS_STYLES with a Tailwind color set.
*   2. Add a human-readable label to STATUS_LABELS (optional — falls back to
*      the raw status string with underscores replaced by spaces).
*   That's it — all badges across the app update automatically.
*
* USAGE:
*   <StatusBadge status="PENDING" />
*   <StatusBadge status="Active" />
*   <StatusBadge status="DELIVERED" />
*
* @author TradeMind Dev Team
*/

import React from "react";
import { useAuth } from "@context";

// ─── Style map ─────────────────────────────────────────────────────────────────
/**
 * Maps each status string → Tailwind classes.
 * Pattern: bg + text + border, each with dark: variants.
 */
const STATUS_STYLES = {
  // ── Inquiry statuses ──────────────────────────────────────────────────────
  PENDING:
    "bg-[#fef3c7] dark:bg-amber-500/20 text-[#b45309] dark:text-amber-300 border-[#fde68a] dark:border-amber-500/30",
  RFQ_SENT:
    "bg-[#e0e7ff] dark:bg-blue-500/20 text-[#2563eb] dark:text-blue-300 border-[#c7d2fe] dark:border-blue-500/30",
  RFQ_RECEIVED:
    "bg-[#e0e7ff] dark:bg-purple-500/20 text-[#4338ca] dark:text-purple-300 border-[#c7d2fe] dark:border-purple-500/30",
  CLIENT_QUOTING:
    "bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30",
  TL_REVIEW:
    "bg-[#ffedd5] dark:bg-rose-500/20 text-[#9a3412] dark:text-rose-300 border-[#fed7aa] dark:border-rose-500/30",
  ADMIN_APPROVAL:
    "bg-[#ffedd5] dark:bg-orange-500/20 text-[#b45309] dark:text-orange-300 border-[#fed7aa] dark:border-orange-500/30",
  EMPLOYEE_VERIFY:
    "bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30",
  CLIENT_FINAL_APPROVAL:
    "bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30",
  QUOTE_SENT:
    "bg-[#dcfce7] dark:bg-emerald-500/20 text-[#15803d] dark:text-emerald-300 border-[#bbf7d0] dark:border-emerald-500/30",
  CONFIRMED:
    "bg-[#dcfce7] dark:bg-emerald-500/20 text-[#15803d] dark:text-emerald-300 border-[#bbf7d0] dark:border-emerald-500/30",
  CLOSED:
    "bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600/30",
  READY_TO_DISPATCH:
    "bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30",

  // ── Purchase Order statuses ────────────────────────────────────────────────
  SHIPPED:
    "bg-[#e0e7ff] dark:bg-indigo-500/20 text-[#3730a3] dark:text-indigo-300 border-[#c7d2fe] dark:border-indigo-500/30",
  ORDERED:
    "bg-[#e0e7ff] dark:bg-blue-500/20 text-[#2563eb] dark:text-blue-300 border-[#c7d2fe] dark:border-blue-500/30",

  // ── Supply / Cargo statuses ────────────────────────────────────────────────
  ORDER_PLACED:
    "bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30",
  DISPATCHED:
    "bg-[#e0e7ff] dark:bg-indigo-500/20 text-[#3730a3] dark:text-indigo-300 border-[#c7d2fe] dark:border-indigo-500/30",
  LOADING:
    "bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30",
  VEHICLE_ALLOTTED:
    "bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30",
  IN_TRANSIT:
    "bg-[#e0e7ff] dark:bg-blue-500/20 text-[#2563eb] dark:text-blue-300 border-[#c7d2fe] dark:border-blue-500/30",
  DELIVERED:
    "bg-[#dcfce7] dark:bg-emerald-500/20 text-[#15803d] dark:text-emerald-300 border-[#bbf7d0] dark:border-emerald-500/30",
  OUT_FOR_DELIVERY:
    "bg-[#ffedd5] dark:bg-orange-500/20 text-[#b45309] dark:text-orange-300 border-[#fed7aa] dark:border-orange-500/30",
  DELIVERED_TO_VESSEL:
    "bg-[#dcfce7] dark:bg-emerald-500/20 text-[#15803d] dark:text-emerald-300 border-[#bbf7d0] dark:border-emerald-500/30",
  CHALLAN_RECEIVED:
    "bg-[#dcfce7] dark:bg-teal-500/20 text-[#0f6460] dark:text-teal-300 border-[#bbf7d0] dark:border-teal-500/30",

  // ── Employee / Account statuses ────────────────────────────────────────────
  Active:
    "bg-[#dcfce7] dark:bg-emerald-500/20 text-[#15803d] dark:text-emerald-300 border-[#bbf7d0] dark:border-emerald-500/30",
  Inactive:
    "bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600/30",

  // ── Invoice statuses ──────────────────────────────────────────────────────
  PENDING_INVOICE:
    "bg-[#fef3c7] dark:bg-amber-500/20 text-[#b45309] dark:text-amber-300 border-[#fde68a] dark:border-amber-500/30",
  SENT:
    "bg-[#e0e7ff] dark:bg-blue-500/20 text-[#2563eb] dark:text-blue-300 border-[#c7d2fe] dark:border-blue-500/30",
  PAID:
    "bg-[#dcfce7] dark:bg-emerald-500/20 text-[#15803d] dark:text-emerald-300 border-[#bbf7d0] dark:border-emerald-500/30",
  OVERDUE:
    "bg-[#fef2f2] dark:bg-red-900/20 text-[#ef4444] dark:text-red-300 border-[#fecaca] dark:border-red-500/30",
  "N/A":
    "bg-gray-100 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600/30",
};

// ─── Label map ─────────────────────────────────────────────────────────────────
/**
 * Human-readable label overrides.
 * If a status isn't listed here, the raw value is displayed with "_" replaced by " ".
 */
const STATUS_LABELS = {
  PENDING: "Pending",
  RFQ_SENT: "RFQ sent",
  QUOTE_SENT: "Quoted",
  RFQ_RECEIVED: "RFQ Received",
  CLIENT_QUOTING: "Client Quoting",
  TL_REVIEW: "TL Review",
  ADMIN_APPROVAL: "Admin review",
  EMPLOYEE_VERIFY: "Employee Verify",
  CLIENT_FINAL_APPROVAL: "Client Final Approval",
  CONFIRMED: "Confirmed",
  OVERDUE: "Overdue",
  IN_TRANSIT: "In Transit",
  ORDERED: "Ordered",
  ORDER_PLACED: "Order Placed",
  VEHICLE_ALLOTTED: "Vehicle Allotted",
  DISPATCHED: "Dispatched",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED_TO_VESSEL: "Delivered To Vessel",
  CHALLAN_RECEIVED: "Challan Received",
  PENDING_INVOICE: "Pending Invoice",
  READY_TO_DISPATCH: "Ready to Dispatch"
};

// ─── Fallback style for unknown statuses ───────────────────────────────────────
const FALLBACK_STYLE =
  "bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600/30";

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * @param {Object} props
 * @param {string} props.status - Any status string from any module
 */
export default function StatusBadge({ status }) {
  const { user } = useAuth();

  // Look up styles — fall back to gray if status is unknown
  const styleCls = STATUS_STYLES[status] ?? FALLBACK_STYLE;

  // Look up label — fall back to status string with underscores as spaces
  let label = STATUS_LABELS[status] ?? status?.replace(/_/g, " ") ?? "—";

  if (status === 'SENT') {
    label = user?.role === 'Client' ? 'Received' : 'Sent';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border shadow-sm ${styleCls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      {label}
    </span>
  );
}
