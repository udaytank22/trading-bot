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

// ─── Style map ─────────────────────────────────────────────────────────────────
/**
 * Maps each status string → Tailwind classes.
 * Pattern: bg + text + border, each with dark: variants.
 */
const STATUS_STYLES = {
  // ── Inquiry statuses ──────────────────────────────────────────────────────
  PENDING:
    "bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/25",
  RFQ_SENT:
    "bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/25",
  RFQ_RECEIVED:
    "bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/25",
  QUOTE_SENT:
    "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25",
  CONFIRMED:
    "bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/25",
  CLOSED:
    "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-500/25",

  // ── Purchase Order statuses ────────────────────────────────────────────────
  // PENDING already defined above
  SHIPPED:
    "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/25",
  // CONFIRMED already defined above
  // CLOSED already defined above

  // ── Supply / Cargo statuses ────────────────────────────────────────────────
  LOADING:
    "bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/25",
  IN_TRANSIT:
    "bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/25",
  DELIVERED:
    "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25",

  // ── Employee / Account statuses ────────────────────────────────────────────
  Active:
    "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 border-emerald-200 dark:border-emerald-500/20",
  Inactive:
    "bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-500 border-gray-200 dark:border-gray-500/20",
};

// ─── Label map ─────────────────────────────────────────────────────────────────
/**
 * Human-readable label overrides.
 * If a status isn't listed here, the raw value is displayed with "_" replaced by " ".
 */
const STATUS_LABELS = {
  RFQ_SENT:     "RFQ Sent",
  RFQ_RECEIVED: "RFQ Received",
  QUOTE_SENT:   "Quote Sent",
  IN_TRANSIT:   "In Transit",
};

// ─── Fallback style for unknown statuses ───────────────────────────────────────
const FALLBACK_STYLE =
  "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-500/25";

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * @param {Object} props
 * @param {string} props.status - Any status string from any module
 */
export default function StatusBadge({ status }) {
  // Look up styles — fall back to gray if status is unknown
  const styleCls = STATUS_STYLES[status] ?? FALLBACK_STYLE;

  // Look up label — fall back to status string with underscores as spaces
  const label = STATUS_LABELS[status] ?? status?.replace(/_/g, " ") ?? "—";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border tracking-wide uppercase ${styleCls}`}
    >
      {label}
    </span>
  );
}
