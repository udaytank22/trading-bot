import React, { useState, useEffect } from "react";
import { Select } from "./ui";
import { parseExcelFile } from "../utils/excelUtils";
import Swal from "sweetalert2";

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

const AddInquiryModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    customer: "",
    vessel: "",
    imoNumber: "",
    salesperson: "",
    clientCategory: "",
    currency: "USD",
    vesselReference: "",
    validityDate: new Date().toISOString().split("T")[0],
    requestType: "Normal",
    category: "",
    subCategory: "",
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

  if (!isOpen && !formData.customer) return null;

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

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      if (data && data.length > 0) {
        const firstRow = data[0];

        // Map header fields
        const newFormData = {
          ...formData,
          customer: firstRow.Customer || firstRow.customer || formData.customer,
          vessel: firstRow.Vessel || firstRow.vessel || formData.vessel,
          imoNumber: firstRow.IMO || firstRow.imoNumber || formData.imoNumber,
          salesperson:
            firstRow.Salesperson ||
            firstRow.salesperson ||
            formData.salesperson,
          currency: firstRow.Currency || firstRow.currency || formData.currency,
          validityDate:
            firstRow.Date || firstRow.validityDate || formData.validityDate,
          requestType:
            firstRow.Type || firstRow.requestType || formData.requestType,
        };

        // Map products
        const products = data
          .map((row) => ({
            id: Date.now() + Math.random(),
            description:
              row.Description ||
              row.description ||
              row.Product ||
              row.product ||
              "",
            quantity: row.Quantity || row.quantity || row.Qty || row.qty || 1,
            unit: row.Unit || row.unit || "PCS",
          }))
          .filter((p) => p.description);

        if (products.length > 0) {
          newFormData.products = products;
        }

        setFormData(newFormData);
        Swal.fire({
          icon: "success",
          title: "Data Imported",
          text: `Successfully imported ${products.length} items from Excel.`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }
    } catch (error) {
      console.error("Excel parse error:", error);
      Swal.fire({
        icon: "error",
        title: "Import Failed",
        text: "Failed to parse Excel file. Please check the format.",
      });
    }
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
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-[#1e2028] border-l border-gray-200 dark:border-[#2a2d36] z-[101] transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-200 dark:border-[#2a2d36] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-600/10">
              <svg
                className="w-6 h-6 text-purple-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                Create New Inquiry
              </h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-0.5">
                Sourcing Request
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1.5 bg-green-600/10 border border-green-500/20 rounded-lg text-green-500 text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-green-600/20 transition-all">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Import Excel
              <input
                type="file"
                className="hidden"
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelUpload}
              />
            </label>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-all p-2 hover:bg-white/5 rounded-full text-2xl leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar"
        >
          {/* Form Fields */}
          <div className="grid grid-cols-1 gap-y-8">
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                  Customer
                </label>
                <Select
  variant="form"
                  value={formData.customer}
                  onChange={(val) => handleChange({ target: { name: "customer", value: val } })}
                  options={[
                    { value: "", label: "Select Customer" },
                    ...CUSTOMERS.map((c) => ({ value: c, label: c }))
                  ]}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                    Vessel
                  </label>
                  <Select
  variant="form"
                    value={formData.vessel}
                    onChange={(val) => handleChange({ target: { name: "vessel", value: val } })}
                    options={[
                      { value: "", label: "Select Vessel" },
                      ...VESSELS.map((v) => ({ value: v, label: v }))
                    ]}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                    IMO Number
                  </label>
                  <input
                    type="text"
                    name="imoNumber"
                    value={formData.imoNumber}
                    onChange={handleChange}
                    className="w-full bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                    Currency
                  </label>
                  <Select
  variant="form"
                    value={formData.currency}
                    onChange={(val) => handleChange({ target: { name: "currency", value: val } })}
                    options={[
                      { value: "USD", label: "USD - US Dollar" },
                      { value: "EUR", label: "EUR - Euro" },
                      { value: "AED", label: "AED - Dirham" }
                    ]}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                    Validity Date
                  </label>
                  <input
                    type="date"
                    name="validityDate"
                    value={formData.validityDate}
                    onChange={handleChange}
                    className="w-full bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                    Request Type
                  </label>
                  <Select
  variant="form"
                    value={formData.requestType}
                    onChange={(val) => handleChange({ target: { name: "requestType", value: val } })}
                    options={[
                      { value: "Normal", label: "Normal" },
                      { value: "Urgent", label: "Urgent" },
                      { value: "Quote Only", label: "Quote Only" }
                    ]}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                    Salesperson
                  </label>
                  <input
                    type="text"
                    name="salesperson"
                    value={formData.salesperson}
                    onChange={handleChange}
                    className="w-full bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Product Lines */}
            <div className="space-y-4 pt-6">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2a2d33] pb-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Order Lines
                  <span className="bg-purple-600/20 text-purple-400 text-[10px] px-2 py-0.5 rounded-full uppercase">
                    {formData.products.length} Items
                  </span>
                </h3>
              </div>

              <div className="overflow-visible border border-gray-200 dark:border-[#2a2d33] rounded-xl bg-gray-100 dark:bg-[#0c0e12]/30">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-[#0c0e12]/50 text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-200 dark:border-[#2a2d33]">
                      <th className="px-4 py-3 font-semibold">
                        Item Description
                      </th>
                      <th className="px-4 py-3 font-semibold w-24 text-center">
                        Qty
                      </th>
                      <th className="px-4 py-3 font-semibold w-24">Unit</th>
                      <th className="px-4 py-3 font-semibold w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2d33]">
                    {formData.products.map((product, index) => (
                      <tr
                        key={product.id}
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Select
  variant="form"
                            value={product.description}
                            onChange={(val) => handleProductChange(index, "description", val)}
                            options={[
                              { value: "", label: "Select Product" },
                              ...PRODUCTS.map((p) => ({ value: p, label: p }))
                            ]}
                            className="w-full"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) =>
                              handleProductChange(
                                index,
                                "quantity",
                                e.target.value,
                              )
                            }
                            className="w-full bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded px-2 py-1 text-center text-gray-900 dark:text-white text-sm focus:border-purple-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Select
  variant="form"
                            value={product.unit}
                            onChange={(val) => handleProductChange(index, "unit", val)}
                            options={[
                              { value: "PCS", label: "PCS" },
                              { value: "KGS", label: "KGS" },
                              { value: "MTR", label: "MTR" },
                              { value: "SET", label: "SET" }
                            ]}
                            className="w-full"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeProduct(index)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
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
                className="w-full py-2.5 border border-dashed border-gray-200 dark:border-[#2a2d33] rounded-xl text-xs font-bold text-gray-500 hover:text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all flex items-center justify-center gap-2 group"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Item
              </button>
            </div>

            {/* Attachment */}
            <div className="pt-4">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2 block">
                Attachment
              </label>
              <div className="relative group">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleFileChange}
                />
                <div
                  className={`w-full border-2 border-dashed rounded-xl px-5 py-4 transition-all flex items-center justify-between ${
                    formData.attachment
                      ? "bg-purple-600/5 border-purple-500/40 text-purple-400"
                      : "bg-gray-100 dark:bg-[#0c0e12]/40 border-gray-200 dark:border-[#2a2d33] text-gray-600 group-hover:border-purple-500/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${formData.attachment ? "bg-purple-600/20" : "bg-white/5"}`}
                    >
                      <svg
                        className={`w-5 h-5 ${formData.attachment ? "text-purple-400" : "text-gray-500"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider truncate max-w-[200px]">
                      {formData.attachment
                        ? formData.attachment.name
                        : "Upload Inquiry File"}
                    </span>
                  </div>
                  {!formData.attachment && (
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest">
                      Max 10MB
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-200 dark:border-[#2a2d36] flex gap-3 bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-[#2a2d36] text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98]"
          >
            Create Inquiry
          </button>
        </div>
      </div>
    </>
  );
};

export default AddInquiryModal;
