/**
 * @file EmployeeTable.jsx
 * @description Table for the Employees module.
 *
 * REFACTORED: 
 *   - Removed local StatusBadge (was a limited duplicate) — now uses the
 *     centralized StatusBadge from ui/ which covers Active/Inactive properly.
 *   - Uses centralized DataTable, Button (icon variant).
 *
 * ACTIONS PER ROW:
 *   - View   (eye icon, purple)  → opens EmployeeViewModal with attendance calendar
 *   - Edit   (pencil icon, blue) → opens AddEmployeeModal pre-filled
 *   - Delete (trash icon, red)   → SweetAlert2 confirm → removes employee
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
  { key: "employee",    label: "Employee" },
  { key: "department",  label: "Department" },
  { key: "role",        label: "Role" },
  { key: "joiningDate", label: "Joining Date", hidden: "hidden lg:table-cell" },
  { key: "status",      label: "Status" },
  { key: "actions",     label: "Actions",     className: "text-right" },
];

// ─── SVG Icons ─────────────────────────────────────────────────────────────────

function ViewIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

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
 * @param {Array}    props.employees - Filtered + paginated employee records
 * @param {function} props.onView   - Open EmployeeViewModal
 * @param {function} props.onEdit   - Open AddEmployeeModal pre-filled
 * @param {function} props.onDelete - Trigger delete confirmation
 */
export default function EmployeeTable({ employees, onEdit, onDelete, onView }) {

  const renderRow = (emp, idx) => (
    <tr
      key={emp.id}
      className={`${ROW_HOVER_CLS} ${rowStripeClass(idx)}`}
    >
      <td className="px-2 sm:px-3 md:px-4 py-3 md:py-4 text-center text-gray-500 text-sm font-medium">{idx + 1}</td>
      {/* ── Avatar + Name + Email stacked ─────────────────────────────── */}
      <td className="px-2 sm:px-3 md:px-4 py-3 md:py-4">
        <div className="flex items-center gap-3">
          {/* Avatar circle with initials */}
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400 font-bold text-xs border border-purple-500/20 shadow-inner flex-shrink-0">
            {emp.avatar}
          </div>
          <div className="flex flex-col">
            <span className="text-gray-900 dark:text-white font-bold text-sm leading-tight">
              {emp.name}
            </span>
            <span className="text-gray-500 text-[11px] mt-0.5">{emp.email}</span>
          </div>
        </div>
      </td>

      {/* ── Department ────────────────────────────────────────────────── */}
      <td className="px-2 sm:px-3 md:px-4 py-3 md:py-4">
        <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
          {emp.department}
        </span>
      </td>

      {/* ── Role pill ─────────────────────────────────────────────────── */}
      <td className="px-2 sm:px-3 md:px-4 py-3 md:py-4">
        <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[11px] font-bold border border-gray-200 dark:border-white/5">
          {emp.role}
        </span>
      </td>

      {/* ── Joining Date (hidden on small screens) ─────────────────────── */}
      <td className="px-2 sm:px-3 md:px-4 py-3 md:py-4 hidden lg:table-cell">
        <span className="text-gray-400 text-sm font-mono">
          {new Date(emp.joiningDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </td>

      {/* ── Status badge (uses centralized StatusBadge) ─────────────────── */}
      <td className="px-2 sm:px-3 md:px-4 py-3 md:py-4">
        <StatusBadge status={emp.status} />
      </td>

      {/* ── Icon action buttons: View + Edit + Delete ────────────────────── */}
      <td className="px-2 sm:px-3 md:px-4 py-3 md:py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="icon" color="purple" onClick={() => onView(emp)} title="View Employee">
            <ViewIcon />
          </Button>
          <Button variant="icon" color="blue" onClick={() => onEdit(emp)} title="Edit Employee">
            <EditIcon />
          </Button>
          <Button variant="icon" color="red" onClick={() => onDelete(emp.id)} title="Delete Employee">
            <DeleteIcon />
          </Button>
        </div>
      </td>
    </tr>
  );

  return (
    <DataTable
      columns={COLUMNS}
      data={employees}
      renderRow={renderRow}
      emptyMessage="No employees found."
    />
  );
}
