import React, { useState, useEffect } from "react";
import { Select, Field, Modal, DataTable } from "@components/ui";
import { useClients, useSuppliers } from "@hooks/queries";
import { parseExcelFile } from '@utils/excelUtils';
import Swal from "sweetalert2";

const PRODUCTS = ["Safety Helmet", "Marine Paint", "Engine Oil", "Cables"];

const modalBg = "bg-white dark:bg-[#1b1d24]";
const panelBg = "bg-gray-50 dark:bg-[#1f222b]";
const tableBg = "bg-white dark:bg-[#181b22]";
const fieldBg = "bg-white dark:bg-[#0f1117]";
const borderColor = "border-gray-200 dark:border-[#2f3441]";

const labelClass =
  "block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2";

const inputClass =
  "w-full h-[35px] rounded-lg px-3.5 text-sm bg-white dark:bg-[#0f1117] border border-gray-300 dark:border-[#2f3441] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-normal outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-[#464c5c] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20";

const emptyProduct = () => ({
  id: Date.now() + Math.random(),
  product: "",
  description: "",
  qty: 1,
  unitPrice: "",
  discount: "",
});

export default function AddPurchaseOrderModal({ isOpen, onClose, onSubmit }) {
  const { data: clientsData } = useClients();
  const { data: suppliersData } = useSuppliers();
  const [formData, setFormData] = useState({
    clientId: "",
    supplierId: "",
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
    products: [emptyProduct()],
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
    setFormData((prev) => {
      const updatedProducts = [...prev.products];
      updatedProducts[index] = {
        ...updatedProducts[index],
        [field]: value,
      };

      return {
        ...prev,
        products: updatedProducts,
      };
    });
  };

  const updateField = (name, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "supplierId") {
        const supplier = suppliersData.find(s => s.id === value);
        if (supplier) {
          updated.supplierEmail = supplier.email || "";
          updated.supplierTel = supplier.phone || "";
        }
      }
      return updated;
    });
  };

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, emptyProduct()],
    }));
  };

  const deleteProduct = (index) => {
    setFormData((prev) => {
      const updatedProducts = prev.products.filter((_, i) => i !== index);

      return {
        ...prev,
        products: updatedProducts.length ? updatedProducts : [emptyProduct()],
      };
    });
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);

      if (data && data.length > 0) {
        const firstRow = data[0];

        const productsList = data.map(row => {
          const prodName = row.Product || row.Product_Name || row.product || row.product_name || row.Name || row.name || "";
          const desc = row.Description || row.description || row.Details || row.details || "";
          const qtyVal = parseInt(row.Quantity || row.Qty || row.qty || row.quantity || 1, 10);
          const priceVal = parseFloat(row.UnitPrice || row.unitPrice || row.Price || row.price || 0);
          const discVal = parseFloat(row.Discount || row.discount || 0);
          return {
            id: Date.now() + Math.random(),
            product: prodName,
            description: desc,
            qty: isNaN(qtyVal) ? 1 : qtyVal,
            unitPrice: isNaN(priceVal) ? "" : priceVal,
            discount: isNaN(discVal) ? "" : discVal,
          };
        }).filter(p => p.product || p.description);

        setFormData((prev) => {
          const clientName = firstRow.Customer || firstRow.customer || firstRow.Client || firstRow.client || "";
          const matchedClient = clientsData.find(c => c.name.toLowerCase() === clientName.toLowerCase() || c.company?.toLowerCase() === clientName.toLowerCase());
          const clientId = matchedClient ? matchedClient.id : prev.clientId;

          const supplierName = firstRow.Supplier || firstRow.supplier || firstRow.Vendor || firstRow.vendor || "";
          const matchedSupplier = suppliersData.find(s => s.name.toLowerCase() === supplierName.toLowerCase() || s.company?.toLowerCase() === supplierName.toLowerCase());
          const supplierId = matchedSupplier ? matchedSupplier.id : prev.supplierId;

          let supplierEmail = firstRow.SupplierEmail || firstRow.supplierEmail || firstRow.Email || firstRow.email || "";
          let supplierTel = firstRow.SupplierTel || firstRow.supplierTel || firstRow.Phone || firstRow.phone || "";
          if (matchedSupplier) {
            supplierEmail = supplierEmail || matchedSupplier.email || "";
            supplierTel = supplierTel || matchedSupplier.phone || "";
          }

          return {
            ...prev,
            clientId,
            supplierId,
            supplierEmail,
            supplierTel,
            vessel: firstRow.Vessel || firstRow.vessel || prev.vessel,
            vesselRef: firstRow.VesselRef || firstRow.vesselRef || firstRow.Reference || firstRow.reference || prev.vesselRef,
            imoNumber: firstRow.IMO || firstRow.imoNumber || prev.imoNumber,
            category: firstRow.Category || firstRow.category || prev.category,
            subcategory: firstRow.Subcategory || firstRow.subcategory || prev.subcategory,
            currency: firstRow.Currency || firstRow.currency || prev.currency,
            products: productsList.length > 0 ? productsList : prev.products
          };
        });

        Swal.fire({
           icon: 'success',
          title: "Data Imported",
          text: "Purchase Order fields and products updated from Excel.",
          timer: 1800,
          showConfirmButton: false,
          
        });
      }
    } catch (error) {
      console.error("Excel parse error:", error);

      Swal.fire({
        icon: "error",
        title: "Import Failed",
        text: "Unable to parse the Excel file.",
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };



  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Order"
      subtitle="Create and manage purchase order details."
      onSubmit={handleSubmit}
      submitLabel="Confirm Purchase Order"
      cancelLabel="Discard"
      onExcelUpload={handleExcelUpload}
      fullscreen={true}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-5">
        <div>
          <label className={labelClass}>Customer (Client)</label>
          <Select
            variant="form"
            value={formData.clientId}
            onChange={(val) => updateField("clientId", val)}
            options={clientsData.map((client) => ({
              value: client.id,
              label: client.company ? `${client.name} (${client.company})` : `${client.name} (${client.email})`,
            }))}
            className="w-full text-gray-900"
            placeholder="Select customer"
          />
        </div>

        <div>
          <label className={labelClass}>Supplier (Vendor)</label>
          <Select
            variant="form"
            value={formData.supplierId}
            onChange={(val) => updateField("supplierId", val)}
            options={suppliersData.map((supplier) => ({
              value: supplier.id,
              label: supplier.company ? `${supplier.name} (${supplier.company})` : `${supplier.name} (${supplier.email})`,
            }))}
            className="w-full text-gray-900"
            placeholder="Select supplier"
          />
        </div>

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

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-gray-900 dark:text-white text-sm">
            Products
          </h4>

          <button
            type="button"
            onClick={addProduct}
            className="
              px-4 py-2 rounded-lg
              text-purple-600 dark:text-purple-400
              hover:bg-purple-50 dark:hover:bg-purple-500/10
              text-sm font-semibold transition
            "
          >
            + Add Product
          </button>
        </div>

        <div
          className={`
            border ${borderColor}
            rounded-xl overflow-hidden
            ${tableBg}
          `}
        >
          <div className="overflow-x-auto">
            <DataTable
              columns={[
                { key: 'product', label: 'Product', cellClassName: 'p-3 align-top w-[280px]', renderCell: (item, index) => (
                  <div className="relative z-[1111111] overflow-visible">
                    <Select
                      variant="form"
                      options={PRODUCTS.map((p) => ({ value: p, label: p }))}
                      value={item.product}
                      onChange={(v) => updateProduct(index, "product", v)}
                      placeholder="Select product"
                    />
                  </div>
                )},
                { key: 'description', label: 'Description', cellClassName: 'p-3 align-top', renderCell: (item, index) => (
                  <input
                    value={item.description}
                    onChange={(e) => updateProduct(index, "description", e.target.value)}
                    className={inputClass}
                    placeholder="Enter product description"
                  />
                )},
                { key: 'qty', label: 'Qty', cellClassName: 'p-3 align-top w-[130px]', renderCell: (item, index) => (
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateProduct(index, "qty", e.target.value)}
                    className={inputClass}
                    placeholder="Qty"
                  />
                )},
                { key: 'action', label: 'Action', cellClassName: 'p-3 align-top w-[100px] text-center', renderCell: (item, index) => (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => deleteProduct(index)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition"
                      title="Delete product"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12M9 7V4h6v3m-7 4v6m4-6v6m4-6v6M5 7h14l-1 13H6L5 7z" />
                      </svg>
                    </button>
                  </div>
                )}
              ]}
              data={formData.products}
              emptyMessage="No products added."
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}