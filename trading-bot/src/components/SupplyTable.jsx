import React from "react";
import Tooltip from "./ui/Tooltip";

const SupplyTable = ({
  items,
  onStatusUpdate,
  onView,
  onContact,
  getStatusStyle,
}) => {
  return (
    <div className="w-full overflow-hidden flex flex-col h-full">
      <div className="w-full overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
        <table className="w-full text-left text-sm table-auto border-separate border-spacing-0">
          <thead className="bg-gray-50 dark:bg-[#242830] text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200 dark:border-[#2a2d33] sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33]">
                Cargo ID
              </th>
              <th className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33]">
                Supplier
              </th>
              <th className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33]">
                Cargo
              </th>
              <th className="px-4 md:px-6 py-4 hidden md:table-cell border-b border-gray-200 dark:border-[#2a2d33]">
                Quantity
              </th>
              <th className="px-4 md:px-6 py-4 hidden lg:table-cell border-b border-gray-200 dark:border-[#2a2d33]">
                Destination
              </th>
              <th className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33]">
                Status
              </th>
              <th className="px-4 md:px-6 py-4 text-right border-b border-gray-200 dark:border-[#2a2d33]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-[#2a2d33]/50">
            {items.map((item, idx) => (
              <tr
                key={item.inquiry_id}
                className={`hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors ${
                  idx % 2 !== 0 ? "bg-gray-50/30 dark:bg-[#242830]/20" : ""
                }`}
              >
                {/* Cargo ID */}
                <td className="px-4 md:px-6 py-4 text-sm text-gray-400">
                  <Tooltip content={item.inquiry_id}>
                    <span className="cursor-default">{item.inquiry_id}</span>
                  </Tooltip>
                </td>

                {/* Supplier */}
                <td className="px-4 md:px-6 py-4">
                  <div className="flex flex-col">
                    <Tooltip content={item.supplier}>
                      <span className="text-gray-900 dark:text-white font-semibold text-sm cursor-default">
                        {item.supplier}
                      </span>
                    </Tooltip>

                    <Tooltip content={item.buyer_email}>
                      <span className="text-gray-500 text-[11px] break-all cursor-default">
                        {item.buyer_email}
                      </span>
                    </Tooltip>
                  </div>
                </td>

                {/* Cargo */}
                <td className="px-4 md:px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  <Tooltip content={item.cargo}>
                    <span className="cursor-default">{item.cargo}</span>
                  </Tooltip>
                </td>

                {/* Quantity */}
                <td className="px-4 md:px-6 py-4 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                  <Tooltip content={item.quantity}>
                    <span className="cursor-default">{item.quantity}</span>
                  </Tooltip>
                </td>

                {/* Destination */}
                <td className="px-4 md:px-6 py-4 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                  <Tooltip content={item.destination}>
                    <span className="cursor-default">{item.destination}</span>
                  </Tooltip>
                </td>

                {/* Status */}
                <td className="px-4 md:px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusStyle(
                      item.status,
                    )}`}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 md:px-6 py-4">
                  <div className="flex flex-col md:flex-row justify-end gap-2">
                    <button
                      onClick={() => onView(item)}
                      className="px-3 py-2 text-xs font-semibold cursor-pointer border border-blue-500/40 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-all"
                    >
                      View
                    </button>

                    <button
                      onClick={() => onContact(item)}
                      className="px-3 py-2 text-xs font-semibold cursor-pointer border border-emerald-500/40 text-emerald-400 rounded-lg hover:bg-emerald-500/10 transition-all"
                    >
                      Contact
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

export default SupplyTable;
