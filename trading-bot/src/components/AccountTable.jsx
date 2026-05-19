/**
 * @file AccountTable.jsx
 * @description Table for the Bank Accounts module.
 *
 * REFACTORED: Now uses centralized DataTable, Button (icon variant), StatusBadge.
 *
 * ACTIONS PER ROW:
 *   - Edit (pencil icon, blue)  → opens AddAccountModal pre-filled
 *   - Delete (trash icon, red)  → triggers SweetAlert2 confirm then removes
 *
 * @author TradeMind Dev Team
 */

import React from "react";
import {
  DataTable,
  rowStripeClass,
  ROW_HOVER_CLS,
  StatusBadge,
  Button,
} from "./ui";

// ─── Column definitions ─────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "sr_no", label: "#", className: "w-10 text-center" },
  { key: "id",          label: "ID" },
  { key: "bankName",    label: "Bank Name" },
  { key: "accountInfo", label: "Account Info" },
  { key: "balance",     label: "Balance" },
  { key: "status",      label: "Status" },
  { key: "actions",     label: "Actions", className: "text-right" },
];

// ─── SVG icon helpers ──────────────────────────────────────────────────────────

/** Pencil / edit icon */
function EditIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

/** Trash / delete icon */
function DeleteIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * @param {Object}   props
 * @param {Array}    props.items    - Filtered + paginated account records
 * @param {function} props.onEdit   - Called with the account object to pre-fill modal
 * @param {function} props.onDelete - Called with the account ID; triggers confirm
 */
const AccountTable = ({ items, onEdit, onDelete }) => {
  const renderRow = (acc, idx) => (
    <tr
      key={acc.id}
      className={`${ROW_HOVER_CLS} ${rowStripeClass(idx)}`}
    >
      <td className="px-3 md:px-6 py-4 text-center text-gray-500 text-sm font-medium">{idx + 1}</td>
      {/* ── ID (monospace, muted) ─────────────────────────────────────── */}
      <td className="px-3 md:px-6 py-4 font-mono text-gray-500 dark:text-gray-400 text-[12px] break-words">
        <span className="cursor-default">{acc.id}</span>
      </td>

      {/* ── Bank name + account alias stacked ─────────────────────────── */}
      <td className="px-3 md:px-6 py-4">
        <div className="flex flex-col">
          <span className="text-gray-900 dark:text-white font-bold text-sm">
            {acc.bankName}
          </span>
          <span className="text-gray-500 text-[11px]">{acc.accountName}</span>
        </div>
      </td>

      {/* ── Account number + routing/SWIFT stacked ─────────────────────── */}
      <td className="px-3 md:px-6 py-4">
        <div className="flex flex-col">
          <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">
            {acc.accountNumber}
          </span>
          <span className="text-gray-500 text-[11px]">
            Routing/SWIFT: {acc.routingNumber}
          </span>
        </div>
      </td>

      {/* ── Balance — green for positive, red for negative ─────────────── */}
      <td className="px-3 md:px-6 py-4">
        <div className="flex items-baseline gap-1">
          <span className="text-gray-500 font-medium text-xs">{acc.currency}</span>
          <span
            className={`font-bold ${
              acc.balance >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {acc.balance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </td>

      {/* ── Status badge ──────────────────────────────────────────────── */}
      <td className="px-3 md:px-6 py-4">
        <StatusBadge status={acc.status} />
      </td>

      {/* ── Icon action buttons (edit + delete) ────────────────────────── */}
      <td className="px-3 md:px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="icon"
            color="blue"
            onClick={() => onEdit(acc)}
            title="Edit Account"
          >
            <EditIcon />
          </Button>
          <Button
            variant="icon"
            color="red"
            onClick={() => onDelete(acc.id)}
            title="Delete Account"
          >
            <DeleteIcon />
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
      emptyMessage="No bank accounts found."
    />
  );
};

export default AccountTable;
