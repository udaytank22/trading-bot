import React, { useState } from "react";
import { Button } from "./ui";

const MOCK_VEHICLES = [
  {
    id: "V-001",
    vehicle_no: "MH-12-AB-1234",
    type: "Container Truck",
    owner_name: "Rajesh Kumar",
    owner_phone: "+91 98765 43210",
    capacity: "20 Tons",
    rc_expiry: "2028-12-15",
    insurance_expiry: "2026-05-20",
    fitness_expiry: "2027-08-10"
  },
  {
    id: "V-002",
    vehicle_no: "DL-01-XY-5678",
    type: "Flatbed Trailer",
    owner_name: "Amit Sharma",
    owner_phone: "+91 87654 32109",
    capacity: "25 Tons",
    rc_expiry: "2030-01-10",
    insurance_expiry: "2026-11-05",
    fitness_expiry: "2028-03-22"
  },
  {
    id: "V-003",
    vehicle_no: "KA-05-MN-9012",
    type: "Refrigerated Van",
    owner_name: "Suresh Prabhu",
    owner_phone: "+91 76543 21098",
    capacity: "10 Tons",
    rc_expiry: "2027-06-30",
    insurance_expiry: "2026-08-12",
    fitness_expiry: "2026-12-25"
  }
];

export default function AllotVehicleModal({ deal, isOpen, onClose, onAllot }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  const selectedVehicle = MOCK_VEHICLES.find(v => v.id === selectedVehicleId);

  const handleAllot = () => {
    if (!selectedVehicle) return;
    onAllot(deal.inquiry_id, selectedVehicle);
    onClose();
    setSelectedVehicleId(""); // Reset selection
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  if (!isOpen || !deal) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1e2028] border border-gray-200 dark:border-[#2a2d36] rounded-2xl shadow-2xl flex flex-col z-10 animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23]">
          <div>
            <h2 className="text-gray-900 dark:text-white text-[16px] font-bold tracking-wide">
              Allot the Vehicle
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5 uppercase tracking-widest font-semibold">
              {deal.inquiry_id} • {deal.cargo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Select Vehicle
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d36] rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            >
              <option value="">-- Choose a Vehicle --</option>
              {MOCK_VEHICLES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_no} ({v.type})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Vehicle Details */}
          {selectedVehicle ? (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-5">
                <h4 className="text-purple-400 font-semibold text-xs uppercase tracking-widest mb-4">Vehicle Information</h4>
                <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Vehicle Number</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedVehicle.vehicle_no}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Vehicle Type</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedVehicle.type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Capacity</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedVehicle.capacity}</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-purple-500/10 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">RC Expiry</p>
                    <p className="text-xs font-semibold text-purple-300">{formatDate(selectedVehicle.rc_expiry)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Insurance Expiry</p>
                    <p className="text-xs font-semibold text-purple-300">{formatDate(selectedVehicle.insurance_expiry)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Fitness Expiry</p>
                    <p className="text-xs font-semibold text-purple-300">{formatDate(selectedVehicle.fitness_expiry)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-emerald-400 font-semibold text-xs uppercase tracking-widest">Owner Information</h4>
                </div>
                <div className="flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23]/50 p-3 rounded-lg border border-gray-200 dark:border-[#2a2d36]">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Owner Name</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedVehicle.owner_name}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => window.location.href = `tel:${selectedVehicle.owner_phone}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {selectedVehicle.owner_phone}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-[#2a2d36] rounded-xl">
              <p className="text-gray-500 text-sm">Please select a vehicle to see details</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-[#1a1d23] border-t border-gray-200 dark:border-[#2a2d36] flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-transparent border border-gray-200 dark:border-[#2a2d36] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white font-bold rounded-lg transition-all active:scale-95 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleAllot}
            disabled={!selectedVehicle}
            className={`px-4 py-1.5 font-bold rounded-lg transition-all active:scale-95 text-sm ${
              selectedVehicle
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
          >
            Confirm Allotment
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
