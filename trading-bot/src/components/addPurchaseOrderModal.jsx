import React, { useState, useEffect } from "react";
import { Select } from "./ui";

const PRODUCTS = ["Safety Helmet", "Marine Paint", "Engine Oil", "Cables"];

const modalBg = "bg-white dark:bg-[#1b1d24]";
const panelBg = "bg-gray-50 dark:bg-[#1f222b]";
const tableBg = "bg-white dark:bg-[#181b22]";
const fieldBg = "bg-white dark:bg-[#0f1117]";
const borderColor = "border-gray-200 dark:border-[#2f3441]";

const labelClass =
  "block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2";

const inputClass =
  "w-full h-[52px] rounded-xl px-4 text-sm bg-white dark:bg-[#0f1117] border border-gray-300 dark:border-[#2f3441] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-normal outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-[#464c5c] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30";

export default function AddPurchaseOrderModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    vessel: "",
    vesselRef: "",
    imoNumber: "",
    supplierTel: "",
    supplierEmail: "",
    category: "",
    subcategory: "",
    orderDeadline: "",
    expectedArrival: "",
    vendorReference: "",
    currency: "INR",
    verifyAll: false,
    products: [
      {
        id: Date.now(),
        product: "",
        description: "",
        qty: 1,
        unitPrice: "",
        discount: "",
      },
    ],
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const updateProduct = (index, field, value) => {
    const updated = [...formData.products];
    updated[index][field] = value;

    setFormData((prev) => ({
      ...prev,
      products: updated,
    }));
  };

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          id: Date.now(),
          product: "",
          description: "",
          qty: 1,
          unitPrice: "",
          discount: "",
        },
      ],
    }));
  };

  const handleExcelUpload = (e) => {
    console.log(e.target.files[0]);
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
      <div
        onClick={handleBackdropClick}
        className={`fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[100] transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
      />

      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 ${isOpen ? "" : "pointer-events-none"
          }`}
      >
        <div
          className={`
            w-full max-w-7xl h-full max-h-[92vh]
            ${modalBg}
            rounded-2xl border ${borderColor}
            shadow-2xl flex flex-col overflow-hidden
            transition-all duration-300
            ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}
          `}
        >
          <div
            className={`
              px-8 py-3 border-b ${borderColor}
              ${panelBg}
              flex justify-between items-center gap-4
            `}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`
                  inline-flex items-center justify-center w-11 h-11 rounded-full
                  ${fieldBg}
                  border border-gray-300 dark:border-[#2f3441]
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-[#171922]
                  hover:border-gray-400 dark:hover:border-[#464c5c]
                  transition
                `}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Create Purchase Order
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Create and manage purchase order details.
                </p>
              </div>
            </div>

            <label
              className="
                flex items-center gap-2 px-5 py-2.5
                bg-green-50 dark:bg-green-600/10
                border border-green-200 dark:border-green-500/25
                rounded-lg text-green-700 dark:text-green-400
                text-xs font-bold uppercase cursor-pointer
                hover:bg-green-600 hover:text-white
                transition
              "
            >
              Import Excel
              <input
                type="file"
                className="hidden"
                onChange={handleExcelUpload}
              />
            </label>
          </div>

          <form
            onSubmit={handleSubmit}
            className={`flex-1 overflow-y-auto p-8 custom-scrollbar ${modalBg}`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Field
                label="Vessel"
                name="vessel"
                value={formData.vessel}
                onChange={handleChange}
                placeholder="Enter vessel name"
              />

              <Field
                label="Vessel Ref"
                name="vesselRef"
                value={formData.vesselRef}
                onChange={handleChange}
                placeholder="Enter vessel reference"
              />

              <Field
                label="IMO Number"
                name="imoNumber"
                value={formData.imoNumber}
                onChange={handleChange}
                placeholder="Enter IMO number"
              />

              <Field
                label="Supplier Tel"
                name="supplierTel"
                value={formData.supplierTel}
                onChange={handleChange}
                placeholder="Enter supplier phone"
              />

              <Field
                label="Supplier Email"
                name="supplierEmail"
                value={formData.supplierEmail}
                onChange={handleChange}
                placeholder="Enter supplier email"
                type="email"
              />

              <Field
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Enter category"
              />
            </div>

            <div className="mt-10">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-900 dark:text-white">
                  Products
                </h4>

                <button
                  type="button"
                  onClick={addProduct}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 font-semibold text-sm transition"
                >
                  + Add Product
                </button>
              </div>

              <div
                className={`
                  border ${borderColor}
                  rounded-2xl overflow-hidden
                  ${tableBg}
                `}
              >
                <table className="w-full">
                  <thead className={`${panelBg} border-b ${borderColor}`}>
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Product
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Description
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Qty
                      </th>
                    </tr>
                  </thead>

                  <div
                    className={`
    border ${borderColor}
    rounded-2xl
    ${tableBg}
    relative z-[20]
    overflow-visible
  `}
                  >
                    <table className="w-full overflow-visible">
                      <thead className={`${panelBg} border-b ${borderColor}`}>
                        <tr>
                          <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Product
                          </th>
                          <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Description
                          </th>
                          <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Qty
                          </th>
                        </tr>
                      </thead>

                      <tbody className="relative z-[30] overflow-visible">
                        {formData.products.map((item, index) => (
                          <tr
                            key={item.id}
                            className={`relative z-[40] border-t ${borderColor} hover:bg-gray-50 dark:hover:bg-white/[0.02] transition overflow-visible`}
                          >
                            <td className="p-3 relative z-[999] overflow-visible">
                              <div className="relative z-[999] overflow-visible">
                                <Select
                                  variant="form"
                                  options={PRODUCTS.map((p) => ({
                                    value: p,
                                    label: p,
                                  }))}
                                  value={item.product}
                                  onChange={(v) => updateProduct(index, "product", v)}
                                  placeholder="Select product"
                                />
                              </div>
                            </td>

                            <td className="p-3">
                              <input
                                value={item.description}
                                onChange={(e) =>
                                  updateProduct(index, "description", e.target.value)
                                }
                                className={inputClass}
                                placeholder="Enter product description"
                              />
                            </td>

                            <td className="p-3">
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => updateProduct(index, "qty", e.target.value)}
                                className={`${inputClass} max-w-[110px]`}
                                placeholder="Qty"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </table>
              </div>
            </div>
          </form>

          <div
            className={`
              px-8 py-3 border-t ${borderColor}
              ${panelBg}
              flex gap-3
            `}
          >
            <button
              type="button"
              onClick={onClose}
              className={`
                px-6 py-3 rounded-xl
                ${fieldBg}
                border border-gray-300 dark:border-[#2f3441]
                text-gray-700 dark:text-gray-300
                font-semibold
                hover:bg-gray-100 dark:hover:bg-[#171922]
                hover:border-gray-400 dark:hover:border-[#464c5c]
                transition
              `}
            >
              Discard
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="
                flex-1 rounded-xl
                bg-purple-600 hover:bg-purple-500
                text-white font-bold
                transition shadow-lg shadow-purple-900/30
              "
            >
              Confirm Purchase Order
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder || `Enter ${label}`}
        className={inputClass}
      />
    </div>
  );
}