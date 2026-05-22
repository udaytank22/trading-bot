import React, { useState, useEffect } from "react";
import { Select } from "./ui";

const PRODUCTS = ["Safety Helmet", "Marine Paint", "Engine Oil", "Cables"];

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
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* backdrop */}

      <div
        onClick={handleBackdropClick}
        className={`fixed inset-0 bg-black/60 z-[100]
        transition-all duration-300
        ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      {/* modal */}

      <div
        className={`fixed inset-0 z-[101]
        flex items-center justify-center p-4
        ${isOpen ? "" : "pointer-events-none"}`}
      >
        <div
          className={`w-full max-w-7xl h-full
          max-h-[92vh]
          bg-white
          dark:bg-[#1e2028]
          rounded-2xl
          border
          border-gray-200
          dark:border-[#2a2d36]
          shadow-2xl
          flex flex-col
          overflow-hidden
          transition-all duration-300
          ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        >
          {/* Header */}

          <div className="px-8 py-5 border-b border-gray-200 dark:border-[#2a2d36] flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center
                w-10 h-10 rounded-full
                border border-gray-200
                dark:border-[#2a2d36]
                text-gray-600 dark:text-gray-300
                hover:bg-gray-100
                dark:hover:bg-white/5
                transition"
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
                <h2 className="text-xl font-bold">Create Purchase Order</h2>

                <p className="text-sm text-gray-500">
                  Create and manage purchase order details.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 px-4 py-2 bg-green-600/10 border border-green-500/20 rounded-lg text-green-600 text-xs font-bold uppercase cursor-pointer hover:bg-green-600/20 transition">
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
            className="flex-1 overflow-y-auto p-8 custom-scrollbar"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Field
                label="Vessel"
                name="vessel"
                value={formData.vessel}
                onChange={handleChange}
              />

              <Field
                label="Vessel Ref"
                name="vesselRef"
                value={formData.vesselRef}
                onChange={handleChange}
              />

              <Field
                label="IMO Number"
                name="imoNumber"
                value={formData.imoNumber}
                onChange={handleChange}
              />

              <Field
                label="Supplier Tel"
                name="supplierTel"
                value={formData.supplierTel}
                onChange={handleChange}
              />

              <Field
                label="Supplier Email"
                name="supplierEmail"
                value={formData.supplierEmail}
                onChange={handleChange}
              />

              <Field
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              />
            </div>

            {/* Products */}

            <div className="mt-10">
              <div className="flex justify-between mb-4">
                <h4 className="font-bold">Products</h4>

                <button
                  type="button"
                  onClick={addProduct}
                  className="text-purple-600"
                >
                  + Add Product
                </button>
              </div>

              <div className="border rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4">Product</th>

                      <th>Description</th>

                      <th>Qty</th>
                    </tr>
                  </thead>

                  <tbody>
                    {formData.products.map((item, index) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">
                          <Select
                            variant="form"
                            options={PRODUCTS.map((p) => ({
                              value: p,
                              label: p,
                            }))}
                            onChange={(v) => updateProduct(index, "product", v)}
                          />
                        </td>

                        <td>
                          <input className="border rounded p-2 w-full" />
                        </td>

                        <td>
                          <input
                            type="number"
                            className="border rounded p-2 w-20"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </form>

          {/* Footer */}

          <div className="px-8 py-5 border-t bg-gray-50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border"
            >
              Discard
            </button>

            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-purple-600 text-white font-bold"
            >
              Confirm Purchase Order
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border rounded-xl p-3"
      />
    </div>
  );
}
