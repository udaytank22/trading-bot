import React, { useState, useEffect, useMemo } from "react";
import { Select, Field, Modal, DatePicker } from '@components/ui';
import { parseExcelFile } from '@utils/excelUtils';
import Swal from "sweetalert2";
import { useData } from '@context';

const modalBg = "bg-white dark:bg-[#1b1d24]";
const panelBg = "bg-gray-50 dark:bg-[#1f222b]";
const borderColor = "border-gray-200 dark:border-[#2f3441]";

const labelClass =
  "block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2";

const inputClass =
  "w-full h-[52px] rounded-xl px-4 text-sm transition-all duration-200 bg-white dark:bg-[#0f1117] border border-gray-300 dark:border-[#2f3441] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 hover:border-gray-400 dark:hover:border-[#464c5c]";

const AddInquiryModal = ({ isOpen, onClose, onSubmit }) => {
  const { clientsData, employeesData, productsData = [] } = useData();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("pcs");

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
    attachment: null,
    products: []
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
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateField = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addProductToInquiry = () => {
    if (!selectedProduct) return;
    const prodName = selectedProduct;
    if (formData.products.some(p => p.product_name.toLowerCase() === prodName.toLowerCase())) {
      Swal.fire({
        icon: "warning",
        title: "Product already added",
        text: "This product is already in the list.",
        background: "#1a1d23",
        color: "#fff",
      });
      return;
    }
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { product_name: prodName, quantity: qty, unit }]
    }));
    setSelectedProduct("");
    setQty(1);
    setUnit("pcs");
  };

  const removeProductFromInquiry = (index) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, idx) => idx !== index)
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      updateField("attachment", file);
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);

      if (data && data.length > 0) {
        const firstRow = data[0];

        setFormData((prev) => ({
          ...prev,
          customer: firstRow.Customer || firstRow.customer || prev.customer,
          vessel: firstRow.Vessel || firstRow.vessel || prev.vessel,
          imoNumber: firstRow.IMO || firstRow.imoNumber || prev.imoNumber,
          salesperson:
            firstRow.Salesperson || firstRow.salesperson || prev.salesperson,
          currency: firstRow.Currency || firstRow.currency || prev.currency,
          vesselReference:
            firstRow.Reference ||
            firstRow.vesselReference ||
            prev.vesselReference,
          validityDate:
            firstRow.ValidityDate || firstRow.validityDate || prev.validityDate,
          requestType:
            firstRow.RequestType || firstRow.requestType || prev.requestType,
          clientCategory:
            firstRow.Category || firstRow.category || prev.clientCategory,
          subCategory:
            firstRow.SubCategory || firstRow.subCategory || prev.subCategory,
          products: firstRow.products
            ? (typeof firstRow.products === "string"
              ? JSON.parse(firstRow.products)
              : firstRow.products)
            : prev.products,
        }));

        Swal.fire({
          icon: "success",
          title: "Data Imported",
          text: "Inquiry fields updated from Excel.",
          timer: 1800,
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
        text: "Unable to parse the Excel file.",
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.products.length === 0) {
      Swal.fire({
        icon: "error",
        title: "No products added",
        text: "Please add at least one product to the inquiry before submitting.",
        background: "#1a1d23",
        color: "#fff",
      });
      return;
    }
    onSubmit(formData);
    onClose();
  };



  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Inquiry"
      subtitle="Please fill in the inquiry details below."
      onSubmit={handleSubmit}
      submitLabel="Create Inquiry"
      cancelLabel="Cancel"
      onExcelUpload={handleExcelUpload}
      maxWidthClass="max-w-[86rem]"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7">
        <div>
          <label className={labelClass}>Customer</label>
          <Select
            variant="form"
            value={formData.customer}
            onChange={(val) => updateField("customer", val)}
            options={clientsData.map((client) => ({
              value: client.name,
              label: client.name,
            }))}
            className="w-full"
            placeholder="Select customer"
          />
        </div>

        <div>
          <label className={labelClass}>Customer Currency</label>
          <Select
            variant="form"
            value={formData.currency}
            onChange={(val) => updateField("currency", val)}
            options={[
              { value: "USD", label: "USD" },
              { value: "EUR", label: "EUR" },
              { value: "INR", label: "INR" },
            ]}
            className="w-full"
            placeholder="Select currency"
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
          label="Vessel Reference"
          name="vesselReference"
          value={formData.vesselReference}
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

        <DatePicker
          label="Validity Date"
          name="validityDate"
          value={formData.validityDate}
          onChange={handleChange}
        />

        <div>
          <label className={labelClass}>Attachment</label>

          <div className="relative">
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />

            <div className="w-full h-[35px] rounded-lg px-3.5 text-sm bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-[#2f3441] text-gray-900 dark:text-gray-100 flex items-center">
              <span
                className={`truncate ${formData.attachment
                  ? "text-gray-900 dark:text-gray-100"
                  : "text-gray-400 dark:text-gray-500"
                  }`}
              >
                {formData.attachment
                  ? formData.attachment.name
                  : "Upload Attachment"}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Salesperson</label>
          <Select
            variant="form"
            value={formData.salesperson}
            onChange={(val) => updateField("salesperson", val)}
            options={employeesData.map((person) => ({
              value: person.name,
              label: person.name,
            }))}
            className="w-full"
            placeholder="Select salesperson"
          />
        </div>

        <div>
          <label className={labelClass}>Request Type</label>
          <Select
            variant="form"
            value={formData.requestType}
            onChange={(val) => updateField("requestType", val)}
            options={[
              { value: "Normal", label: "Normal" },
              { value: "Urgent", label: "Urgent" },
            ]}
            className="w-full"
            placeholder="Select request type"
          />
        </div>

        <Field
          label="Client Category"
          name="clientCategory"
          value={formData.clientCategory}
          onChange={handleChange}
          placeholder="Enter client category"
        />

        <Field
          label="Sub Category"
          name="subCategory"
          value={formData.subCategory}
          onChange={handleChange}
          placeholder="Enter sub category"
        />

        <div className="md:col-span-2 border-t border-gray-200 dark:border-[#2f3441] pt-6 mt-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Inquiry Items / Products</h3>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 bg-gray-50/50 dark:bg-[#0f1117]/30 p-4 rounded-2xl border border-gray-200 dark:border-[#2f3441] mb-4 items-end">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Product</label>
              <Select
                variant="form"
                value={selectedProduct}
                onChange={(val) => setSelectedProduct(val)}
                options={[
                  { value: "", label: "Choose a product" },
                  ...productsData.map(p => ({
                    value: p.name,
                    label: p.name
                  }))
                ]}
                className="w-full flex items-center"
              />
            </div>

            <div className="sm:col-span-1">
              <Field
                label="Quantity"
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                placeholder="1"
                labelClassName="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
              />
            </div>

            <div className="sm:col-span-1">
              <Field
                label="Unit"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs"
                labelClassName="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
              />
            </div>

            <div className="sm:col-span-1">
              <button
                type="button"
                onClick={addProductToInquiry}
                className="w-full h-[35px] bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors shadow-md shadow-purple-600/20 text-xs flex items-center justify-center"
              >
                Add
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {formData.products.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#1a1d24] border border-gray-200 dark:border-[#2f3441] rounded-xl animate-fade-in">
                <div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{p.product_name}</span>
                  <span className="text-xs text-gray-500 ml-3">({p.quantity} {p.unit})</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeProductFromInquiry(idx)}
                  className="text-red-500 hover:text-red-600 text-xs font-bold transition-colors uppercase tracking-wider"
                >
                  Remove
                </button>
              </div>
            ))}
            {formData.products.length === 0 && (
              <div className="text-center py-6 text-sm text-gray-500 italic bg-gray-50/50 dark:bg-[#1a1d24]/50 rounded-xl border border-dashed border-gray-200 dark:border-[#2f3441]">
                No products added yet. Add at least one product above.
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};


export default AddInquiryModal;