import React, { useMemo, useState } from "react";
import EmailPreviewModal from "../components/EmailPreviewModal";
import DealDrawer from "../components/DealDrawer";

const cargoData = [
  {
    inquiry_id: "CGO-1001",
    supplier: "Oceanic Logistics",
    buyer_name: "Oceanic Logistics",
    buyer_email: "oceanic@example.com",
    cargo: "Steel Pipes",
    quantity: "120 MT",
    destination: "Dubai",
    status: "IN_TRANSIT",
    products: [
      {
        product_name: "Steel Pipes",
      },
    ],
  },
  {
    inquiry_id: "CGO-1002",
    supplier: "Global Marine",
    buyer_name: "Global Marine",
    buyer_email: "global@example.com",
    cargo: "Copper Wire",
    quantity: "45 MT",
    destination: "Singapore",
    status: "PENDING",
    products: [
      {
        product_name: "Copper Wire",
      },
    ],
  },
  {
    inquiry_id: "CGO-1003",
    supplier: "BlueWave Cargo",
    buyer_name: "BlueWave Cargo",
    buyer_email: "bluewave@example.com",
    cargo: "Industrial Valves",
    quantity: "80 Units",
    destination: "Rotterdam",
    status: "DELIVERED",
    products: [
      {
        product_name: "Industrial Valves",
      },
    ],
  },
  {
    inquiry_id: "CGO-1004",
    supplier: "Atlantic Freight",
    buyer_name: "Atlantic Freight",
    buyer_email: "atlantic@example.com",
    cargo: "Engine Parts",
    quantity: "25 Boxes",
    destination: "Hamburg",
    status: "LOADING",
    products: [
      {
        product_name: "Engine Parts",
      },
    ],
  },
];

export default function SupplyPage() {
  const [search, setSearch] = useState("");

  /* Drawer State */
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  /* Email Modal State */
  const [emailModalDeal, setEmailModalDeal] = useState(null);
  const [emailModalType, setEmailModalType] = useState("SUPPLY");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  /* Search Filter */
  const filteredData = useMemo(() => {
    return cargoData.filter((item) => {
      const q = search.toLowerCase();

      return (
        item.supplier.toLowerCase().includes(q) ||
        item.cargo.toLowerCase().includes(q) ||
        item.destination.toLowerCase().includes(q)
      );
    });
  }, [search]);

  /* Dummy Update Function */
  const updateDealStatus = (id, status) => {
    console.log("Updated:", id, status);
  };

  /* Status Badge */
  const getStatusStyle = (status) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-500/10 text-emerald-400";

      case "PENDING":
        return "bg-yellow-500/10 text-yellow-400";

      case "LOADING":
        return "bg-purple-500/10 text-purple-400";

      default:
        return "bg-blue-500/10 text-blue-400";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Supply Of Cargo</h1>

          <p className="text-sm text-gray-500 mt-1">
            Track cargo supply and shipment details
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full sm:w-[280px] px-4 rounded-lg bg-[#1a1d23] border border-[#2a2d33] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />

          {/* Add Button */}
          <button className="h-10 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors">
            Add Cargo
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1d23] border border-[#2a2d33] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-[#242830] border-b border-[#2a2d33]">
              <tr className="text-left text-[11px] uppercase text-gray-400">
                <th className="px-4 md:px-6 py-4">Cargo ID</th>

                <th className="px-4 md:px-6 py-4">Supplier</th>

                <th className="px-4 md:px-6 py-4">Cargo</th>

                <th className="px-4 md:px-6 py-4 hidden md:table-cell">
                  Quantity
                </th>

                <th className="px-4 md:px-6 py-4 hidden lg:table-cell">
                  Destination
                </th>

                <th className="px-4 md:px-6 py-4">Status</th>

                <th className="px-4 md:px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#2a2d33]/50">
              {filteredData.map((item, idx) => (
                <tr
                  key={item.inquiry_id}
                  className={`hover:bg-white/[0.04] transition-colors ${
                    idx % 2 !== 0 ? "bg-[#242830]/20" : ""
                  }`}
                >
                  {/* Cargo ID */}
                  <td className="px-4 md:px-6 py-4 text-sm text-gray-400">
                    {item.inquiry_id}
                  </td>

                  {/* Supplier */}
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-semibold text-sm">
                        {item.supplier}
                      </span>

                      <span className="text-gray-500 text-[11px] break-all">
                        {item.buyer_email}
                      </span>
                    </div>
                  </td>

                  {/* Cargo */}
                  <td className="px-4 md:px-6 py-4 text-sm text-gray-300">
                    {item.cargo}
                  </td>

                  {/* Quantity */}
                  <td className="px-4 md:px-6 py-4 text-sm text-gray-300 hidden md:table-cell">
                    {item.quantity}
                  </td>

                  {/* Destination */}
                  <td className="px-4 md:px-6 py-4 text-sm text-gray-300 hidden lg:table-cell">
                    {item.destination}
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
                      {/* View */}
                      <button
                        onClick={() => {
                          setSelectedDeal(item);
                          setIsDrawerOpen(true);
                        }}
                        className="px-3 py-2 text-xs font-semibold cursor-pointer border border-blue-500/40 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-all"
                      >
                        View
                      </button>

                      {/* Contact */}
                      <button
                        onClick={() => {
                          setEmailModalDeal(item);
                          setEmailModalType("SUPPLY");
                          setIsEmailModalOpen(true);
                        }}
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

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#2a2d33] text-sm text-gray-500">
          Total Cargo Supplies:
          <span className="text-gray-300 ml-1">{filteredData.length}</span>
        </div>
      </div>

      {/* Drawer */}
      <DealDrawer
        deal={selectedDeal}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStatusUpdate={updateDealStatus}
      />

      {/* Email Modal */}
      <EmailPreviewModal
        deal={emailModalDeal}
        initialEmailType={emailModalType}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onStatusUpdate={updateDealStatus}
      />
    </div>
  );
}
