import React from "react";
import Tooltip from "./ui/Tooltip";
import StatusBadge from "./ui/StatusBadge";

const AccountTable = ({ items, onEdit, onDelete }) => {
  return (
    <div className="w-full overflow-hidden flex flex-col h-full">
      <div className="w-full overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
        <table className="w-full text-left text-sm table-auto border-separate border-spacing-0">
          <thead className="bg-gray-50 dark:bg-[#242830]/80 text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200 dark:border-[#2a2d33] sticky top-0 z-10 backdrop-blur-md transition-colors duration-300">
            <tr>
              <th className="px-3 md:px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33]">ID</th>
              <th className="px-3 md:px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33]">Bank Name</th>
              <th className="px-3 md:px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33]">Account Info</th>
              <th className="px-3 md:px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33]">Balance</th>
              <th className="px-3 md:px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33]">Status</th>
              <th className="px-3 md:px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#2a2d33]/50">
            {items.map((acc, idx) => (
              <tr
                key={acc.id}
                className={`hover:bg-gray-50/80 dark:hover:bg-white/[0.04] transition-colors ${
                  idx % 2 !== 0 ? "bg-gray-50/30 dark:bg-[#242830]/20" : ""
                }`}
              >
                <td className="px-3 md:px-6 py-4 font-mono text-gray-500 dark:text-gray-400 text-[12px] break-words">
                  <span className="cursor-default">{acc.id}</span>
                </td>
                <td className="px-3 md:px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-white font-bold text-sm cursor-default">
                      {acc.bankName}
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      {acc.accountName}
                    </span>
                  </div>
                </td>
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
                <td className="px-3 md:px-6 py-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-gray-500 font-medium text-xs">{acc.currency}</span>
                    <span className={`font-bold ${acc.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </td>
                <td className="px-3 md:px-6 py-4">
                  <StatusBadge status={acc.status} />
                </td>
                <td className="px-3 md:px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onEdit(acc)}
                      className="p-2 text-blue-500/70 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all shadow-sm active:scale-90"
                      title="Edit Account"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => onDelete(acc.id)}
                      className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all shadow-sm active:scale-90"
                      title="Delete Account"
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
};

export default AccountTable;
