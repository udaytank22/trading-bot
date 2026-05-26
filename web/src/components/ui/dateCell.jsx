/**
 * @file DateCell.jsx
 * @description Centralized date display cell used in InquiryTable and POTable.
 *
 * PROBLEM SOLVED:
 *   Both InquiryTable.jsx and POTable.jsx had their own identical copy of a
 *   local DateCell function. This centralizes it.
 *
 * OUTPUT FORMAT:
 *   Line 1: "12 May 2026"   (from formatDateString)
 *   Line 2: "2:30 PM"       (local time, 12h)
 *
 * USAGE:
 *   <DateCell isoString={inquiry.date_received} />
 *   <DateCell isoString={po.date} />
 *
 * @author TradeMind Dev Team
 */

import React from "react";
import { formatDateString } from "../../services/marginEngine";

/**
 * @param {Object} props
 * @param {string} props.isoString - ISO 8601 date string e.g. "2026-05-12T09:30:00Z"
 */
export default function DateCell({ isoString }) {
  // Guard: render nothing if date is missing or invalid
  if (!isoString) return <span className="text-gray-400">—</span>;

  const d = new Date(isoString);
  if (isNaN(d.getTime())) return <span className="text-gray-400">—</span>;

  // Format the time portion separately (12-hour with AM/PM)
  const timeStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);

  return (
    <div className="flex flex-col">
      {/* Date in human-readable format e.g. "12 May 2026" */}
      <span className="text-gray-900 dark:text-white font-bold leading-tight">
        {formatDateString(isoString)}
      </span>
      {/* Time below in gray */}
      <span className="text-gray-500 text-xs mt-[1px]">{timeStr}</span>
    </div>
  );
}
