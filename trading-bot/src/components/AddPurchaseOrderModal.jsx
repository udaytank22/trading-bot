import React, { useState, useEffect } from "react";

const CUSTOMERS = [
  "Shree Ganesha Enterprises",
  "Om Sai Manufacturing",
  "Balaji Impex",
  "Krishna Engineering Works",
  "Saraswati Textiles",
  "Prakash Industrial Supplies",
  "Venkateswara Metals",
  "Shiv Shakti Hardware",
];

const VESSELS = [
  "MV Morning Star",
  "Oceanic Voyager",
  "Global Mariner",
  "Pacific Explorer",
  "Northern Light",
  "Caspian Sea",
  "Ever Given",
  "Arctic Express",
];

const PRODUCTS = [
  "Mild Steel Sheets 2mm",
  "Galvanized Iron Pipes",
  "Copper Wires 1.5 sqmm",
  "Industrial Safety Helmets",
  "Safety Shoes",
  "CNC Router Tool Bits",
  "Cotton Yarn 40s",
  "PTFE Thread Seal Tape",
  "Ball Valves 1 inch",
  "Aluminium Extrusion Profiles",
  "Aluminium Checkered Plates",
  "SS 304 Fasteners Hex Bolt",
  "Packaging Tape 2 inch",
  "Corrugated Boxes",
  "Stretch Film",
  "Nitrile Inspection Gloves",
];

const AddPurchaseOrderModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    vendor: "",
    gstTreatment: "Consumer",
    salesType: "Sales Invoice",
    vessel: "",
    vesselRef: "",
    totalQty: 0,
    receivedQty: 0,
    grnStatus: "GRN Done",
    imoNumber: "",
    supplierTel: "",
    supplierRefNo: "",
    referenceDate: "",
    declarationNo: "",
    awbBl: "",
    supplierEmail: "",
    category: "",
    subCategory: "",
    paymentTerms: "30 Days",
    taxes: "",
    deliveryTime: "Urgent",
    orderDeadline: new Date().toISOString().slice(0, 16),
    expectedArrival: "",
    askConfirmation: false,
    products: [{ id: Date.now(), description: "", quantity: 1, unit: "PCS" }],
    attachment: null,
  });

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen && !formData.vendor) return null; // Keep rendered for animation if needed, but simple return for now

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, attachment: file }));
    }
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...formData.products];
    newProducts[index][field] = value;
    setFormData((prev) => ({ ...prev, products: newProducts }));
  };

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { id: Date.now(), description: "", quantity: 1, unit: "PCS" },
      ],
    }));
  };

  const removeProduct = (index) => {
    if (formData.products.length > 1) {
      const newProducts = formData.products.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, products: newProducts }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={handleBackdropClick}
      />

      {/* Side Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-[#1e2028] border-l border-[#2a2d36] z-[101] transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-[#2a2d36] flex justify-between items-center bg-[#1a1d23] flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-600/10">
              <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Create Purchase Order</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-0.5">New Transaction Request</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-all p-2 hover:bg-white/5 rounded-full text-2xl leading-none">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Form Content */}
          <div className="grid grid-cols-1 gap-y-8">
            {/* Vendor & General */}
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Vendor</label>
                <select
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white focus:border-purple-500/50 transition-all outline-none cursor-pointer hover:bg-[#14171c]"
                >
                  <option value="">Select Vendor</option>
                  {CUSTOMERS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">GST Treatment</label>
                  <input
                    type="text"
                    name="gstTreatment"
                    value={formData.gstTreatment}
                    onChange={handleChange}
                    className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition-all hover:bg-[#14171c]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Sales Type</label>
                  <input
                    type="text"
                    name="salesType"
                    value={formData.salesType}
                    onChange={handleChange}
                    className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition-all hover:bg-[#14171c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Vessel</label>
                  <select
                    name="vessel"
                    value={formData.vessel}
                    onChange={handleChange}
                    className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition-all cursor-pointer hover:bg-[#14171c]"
                  >
                    <option value="">Select Vessel</option>
                    {VESSELS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Vessel Ref</label>
                  <input
                    type="text"
                    name="vesselRef"
                    value={formData.vesselRef}
                    onChange={handleChange}
                    className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition-all hover:bg-[#14171c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">IMO Number</label>
                  <input
                    type="text"
                    name="imoNumber"
                    value={formData.imoNumber}
                    onChange={handleChange}
                    className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition-all hover:bg-[#14171c]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Supplier Tel</label>
                  <input
                    type="text"
                    name="supplierTel"
                    value={formData.supplierTel}
                    onChange={handleChange}
                    className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition-all hover:bg-[#14171c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Payment Terms</label>
                  <select
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                    className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition-all cursor-pointer hover:bg-[#14171c]"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="45 Days">45 Days</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Delivery Time</label>
                  <input
                    type="time"
                    name="deliveryTime"
                    value={formData.deliveryTime}
                    onChange={handleChange}
                    className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition-all [color-scheme:dark] cursor-pointer hover:bg-[#14171c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Order Deadline</label>
                  <input
                    type="datetime-local"
                    name="orderDeadline"
                    value={formData.orderDeadline}
                    onChange={handleChange}
                    className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition-all [color-scheme:dark] cursor-pointer hover:bg-[#14171c]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Expected Arrival</label>
                  <input
                    type="date"
                    name="expectedArrival"
                    value={formData.expectedArrival}
                    onChange={handleChange}
                    className="w-full bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition-all [color-scheme:dark] cursor-pointer hover:bg-[#14171c]"
                  />
                </div>
              </div>
            </div>

            {/* Product Lines Section */}
            <div className="space-y-4 pt-6">
              <div className="flex items-center justify-between border-b border-[#2a2d33] pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  PO Items
                  <span className="bg-purple-600/20 text-purple-400 text-[10px] px-2 py-0.5 rounded-full uppercase">{formData.products.length} Items</span>
                </h3>
              </div>

              <div className="overflow-hidden border border-[#2a2d33] rounded-xl bg-[#0c0e12]/30">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#0c0e12]/50 text-gray-400 text-[11px] uppercase tracking-wider border-b border-[#2a2d33]">
                      <th className="px-4 py-3 font-semibold">Item Description</th>
                      <th className="px-4 py-3 font-semibold w-24 text-center">Qty</th>
                      <th className="px-4 py-3 font-semibold w-24">Unit</th>
                      <th className="px-4 py-3 font-semibold w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2d33]">
                    {formData.products.map((product, index) => (
                      <tr key={product.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <select
                            value={product.description}
                            onChange={(e) => handleProductChange(index, "description", e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-white cursor-pointer text-sm p-0 outline-none"
                          >
                            <option value="" className="bg-[#1a1d23]">Select Product</option>
                            {PRODUCTS.map(p => (
                              <option key={p} value={p} className="bg-[#1a1d23]">{p}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                            className="w-full bg-[#1a1d23] border border-[#2a2d33] rounded px-2 py-1 text-center text-white text-sm focus:border-purple-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={product.unit}
                            onChange={(e) => handleProductChange(index, "unit", e.target.value)}
                            className="w-full bg-[#1a1d23] border border-[#2a2d33] rounded px-2 py-1 text-white text-sm focus:border-purple-500 outline-none"
                          >
                            <option value="PCS">PCS</option>
                            <option value="KGS">KGS</option>
                            <option value="MTR">MTR</option>
                            <option value="SET">SET</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeProduct(index)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={addProduct}
                className="w-full py-2.5 border border-dashed border-[#2a2d33] rounded-xl text-xs font-bold text-gray-500 hover:text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all flex items-center justify-center gap-2 group"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>

            {/* Attachment & Confirmation */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    name="askConfirmation"
                    checked={formData.askConfirmation}
                    onChange={(e) => setFormData(prev => ({ ...prev, askConfirmation: e.target.checked }))}
                    className="peer w-5 h-5 rounded-md border-[#2a2d33] bg-[#0c0e12] text-purple-600 focus:ring-purple-500/50 transition-all cursor-pointer appearance-none border"
                  />
                  <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity left-[3px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-300 transition-colors">Ask confirmation</label>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block">Attachment</label>
                <div className="relative group">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleFileChange}
                  />
                  <div className={`w-full border-2 border-dashed rounded-xl px-5 py-4 transition-all flex items-center justify-between ${formData.attachment
                      ? "bg-purple-600/5 border-purple-500/40 text-purple-400"
                      : "bg-[#0c0e12]/40 border-[#2a2d33] text-gray-600 group-hover:border-purple-500/30"
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${formData.attachment ? "bg-purple-600/20" : "bg-white/5"}`}>
                        <svg className={`w-5 h-5 ${formData.attachment ? "text-purple-400" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider truncate max-w-[200px]">{formData.attachment ? formData.attachment.name : "Upload PO"}</span>
                    </div>
                    {!formData.attachment && <span className="text-[9px] text-gray-500 uppercase tracking-widest">Max 10MB</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-[#2a2d33] flex gap-3 bg-[#1a1d23] flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-[#2a2d33] text-gray-300 text-sm font-bold hover:bg-white/[0.05] transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98]"
          >
            Confirm Purchase Order
          </button>
        </div>
      </div>
    </>
  );
};

export default AddPurchaseOrderModal;
