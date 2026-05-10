import React, { useState } from "react";

const QuoteModal = ({ isOpen, onClose, onSubmit, deal }) => {
  const [discount, setDiscount] = useState("");
  const [margin, setMargin] = useState("");
  const [narrative, setNarrative] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1a1d23] border border-[#2a2d33] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-[#2a2d33] flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Send Quote</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">
            &times;
          </button>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ discount, margin, narrative });
            onClose();
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Discount (%)
            </label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="e.g. 5"
              required
              className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Margin (%)
            </label>
            <input
              type="number"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              placeholder="e.g. 15"
              required
              className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Narrative / Notes
            </label>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Enter details for the buyer..."
              rows={3}
              required
              className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-[#2a2d33] text-gray-300 text-sm font-semibold hover:bg-white/[0.05] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20"
            >
              Confirm & Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuoteModal;
