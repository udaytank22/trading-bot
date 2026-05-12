import React from "react";
import Tooltip from "./ui/Tooltip";

function StatusBadge({ status }) {
  const isActive = status === "Active";
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
      isActive 
        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
        : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
    }`}>
      {status}
    </span>
  );
}

export default function EmployeeTable({ employees, onEdit, onDelete }) {
  return (
    <div className="w-full overflow-hidden flex flex-col h-full">
      <div className="w-full overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
        <table className="w-full text-left text-sm table-auto border-separate border-spacing-0">
          <thead className="bg-gray-50 dark:bg-[#242830]/80 text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200 dark:border-[#2a2d33] sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="px-3 md:px-6 py-4 border-b border-[#2a2d33]">Employee</th>
              <th className="px-3 md:px-6 py-4 border-b border-[#2a2d33]">Department</th>
              <th className="px-3 md:px-6 py-4 border-b border-[#2a2d33]">Role</th>
              <th className="px-3 md:px-6 py-4 border-b border-[#2a2d33] hidden lg:table-cell">Joining Date</th>
              <th className="px-3 md:px-6 py-4 border-b border-[#2a2d33]">Status</th>
              <th className="px-3 md:px-6 py-4 text-right border-b border-[#2a2d33]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2d33]/50">
            {employees.map((emp, idx) => (
              <tr 
                key={emp.id}
                className={`hover:bg-white/[0.04] transition-colors ${idx % 2 !== 0 ? "bg-[#242830]/20" : ""}`}
              >
                {/* Employee Info */}
                <td className="px-3 md:px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400 font-bold text-xs border border-purple-500/20 shadow-inner">
                      {emp.avatar}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-sm leading-tight">{emp.name}</span>
                      <span className="text-gray-500 text-[11px] mt-0.5">{emp.email}</span>
                    </div>
                  </div>
                </td>

                {/* Department */}
                <td className="px-3 md:px-6 py-4">
                  <span className="text-gray-300 text-sm font-medium">{emp.department}</span>
                </td>

                {/* Role */}
                <td className="px-3 md:px-6 py-4">
                  <span className="px-2 py-0.5 rounded-lg bg-white/5 text-gray-400 text-[11px] font-bold border border-white/5">
                    {emp.role}
                  </span>
                </td>

                {/* Joining Date */}
                <td className="px-3 md:px-6 py-4 hidden lg:table-cell">
                  <span className="text-gray-400 text-sm font-mono">
                    {new Date(emp.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </td>

                {/* Status */}
                <td className="px-3 md:px-6 py-4">
                  <StatusBadge status={emp.status} />
                </td>

                {/* Actions */}
                <td className="px-3 md:px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onEdit(emp)}
                      className="p-2 text-blue-500/70 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all shadow-sm active:scale-90"
                      title="Edit Employee"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => onDelete(emp.id)}
                      className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all shadow-sm active:scale-90"
                      title="Delete Employee"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
