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
  const uniqueUnits = useMemo(() => {
    const unitsSet = new Set();
    productsData.forEach(p => {
      if (p.unit) unitsSet.add(p.unit);
    });
    // Add default common units just in case
    ["pcs", "box", "set", "meter", "kg", "ltr"].forEach(u => unitsSet.add(u));
    return Array.from(unitsSet).sort();
  }, [productsData]);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("");

  const [formData, setFormData] = useState({
    customer: "",
    vessel: "",
    imoNumber: "",
    salesperson: "",
    clientCategory: "",
    currency: "",
    vesselReference: "",
    validityDate: "",
    requestType: "",
    category: "",
    subCategory: "",
    attachment: null,
    products: []
  });

  const selectedClientObj = useMemo(() => {
    return clientsData.find(c => c.id === Number(formData.customer) || c.name === formData.customer);
  }, [clientsData, formData.customer]);


  const clientVessels = selectedClientObj?.vessels || [];

  const handleVesselChange = (val) => {
    setFormData(prev => {
      const updated = { ...prev, vessel: val };
      const selectedVesselObj = clientVessels.find(v => v.name === val);
      if (selectedVesselObj && selectedVesselObj.imoNumber) {
        updated.imoNumber = selectedVesselObj.imoNumber;
      }
      return updated;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-populate IMO number whenever the vessel changes or is default selected
  useEffect(() => {
    if (formData.vessel) {
      const selectedVesselObj = clientVessels.find(v => v.name === formData.vessel);
      if (selectedVesselObj) {
        setFormData(prev => {
          if (prev.imoNumber !== (selectedVesselObj.imoNumber || "")) {
            return { ...prev, imoNumber: selectedVesselObj.imoNumber || "" };
          }
          return prev;
        });
      }
    } else {
      setFormData(prev => {
        if (prev.imoNumber !== "") {
          return { ...prev, imoNumber: "" };
        }
        return prev;
      });
    }
  }, [formData.vessel, clientVessels]);

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

  const updateProductInList = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.products];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return {
        ...prev,
        products: updated
      };
    });
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

        setFormData((prev) => {
          const customerVal = firstRow.Customer || firstRow.customer || "";
          const matchedClient = clientsData.find(c => c.name.toLowerCase() === customerVal.toLowerCase());
          const customerId = matchedClient ? matchedClient.id : (customerVal || prev.customer);

          const productsList = data.map(row => {
            const name = row.Product || row.Product_Name || row.product || row.product_name || row.Name || row.name || row.Description || row.description || row.Item || row.item || "";
            const quantity = parseInt(row.Quantity || row.Qty || row.qty || row.quantity || 1, 10);
            const unit = row.Unit || row.unit || "pcs";
            return {
              product_name: name,
              quantity: isNaN(quantity) ? 1 : quantity,
              unit: unit
            };
          }).filter(p => p.product_name);

          return {
            ...prev,
            customer: customerId,
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
            products: productsList.length > 0 ? productsList : prev.products,
          };
        });

        Swal.fire({
          toast: true, position: 'top-end', icon: 'success',
          title: "Data Imported",
          text: "Inquiry fields and products updated from Excel.",
          timer: 1800,
          showConfirmButton: false
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
      fullscreen={true}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7">
        <div>
          <label className={labelClass}>Customer</label>
          <Select
            variant="form"
            value={formData.customer}
            onChange={(val) => updateField("customer", val)}
            options={clientsData.map((client) => ({
              value: client.id,
              label: client.company ? `${client.name} (${client.company})` : `${client.name} (${client.email})`,
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

        <div>
          <label className={labelClass}>Vessel</label>
          <Select
            variant="form"
            value={formData.vessel}
            onChange={handleVesselChange}
            options={[
              ...clientVessels.map((v) => ({
                value: v.name,
                label: v.name,
              }))
            ]}
            className="w-full"
            placeholder="Select vessel"
          />
        </div>

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
          placeholder="IMO Number will populate automatically"
          disabled={true}
          className="bg-gray-100 cursor-not-allowed text-gray-500 dark:bg-[#1a1d24] dark:text-gray-400"
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
          <div className="flex justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Inquiry Items / Products</h3>
            <span className="text-sm text-gray-500 dark:text-white mb-4 tracking-wider">{formData.products.length} Items Selected</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 bg-gray-50/50 dark:bg-[#0f1117]/30 p-4 rounded-2xl border border-gray-200 dark:border-[#2f3441] mb-4 items-end">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Product</label>
              <Select
                variant="form"
                value={selectedProduct}
                onChange={(val) => {
                  setSelectedProduct(val);
                  const prodObj = productsData.find(p => p.name === val);
                  if (prodObj?.unit) {
                    setUnit(prodObj.unit);
                  }
                }}
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
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Unit</label>
              <Select
                variant="form"
                value={unit}
                onChange={(val) => setUnit(val)}
                options={uniqueUnits.map(u => ({
                  value: u,
                  label: u
                }))}
                placeholder="Select unit"
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

          <div className="border border-gray-250 dark:border-[#2f3441] rounded-xl overflow-hidden bg-white dark:bg-[#181b22]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] table-fixed">
                <thead className="bg-gray-55 dark:bg-[#1f222b] border-b border-gray-250 dark:border-[#2f3441]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 w-[60px]">
                      S.No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 w-[120px]">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 w-[120px]">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 w-[80px]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#2f3441]">
                  {formData.products.map((p, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-55/30 dark:hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="px-4 py-2 text-sm text-gray-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2">
                        <div className="relative z-[11111] overflow-visible">
                          <Select
                            variant="form"
                            value={p.product_name}
                            onChange={(val) => {
                              const productObj = productsData.find(prod => prod.name === val);
                              setFormData(prev => {
                                const updated = [...prev.products];
                                updated[idx] = {
                                  ...updated[idx],
                                  product_name: val,
                                  unit: productObj?.unit || updated[idx].unit || "pcs"
                                };
                                return { ...prev, products: updated };
                              });
                            }}
                            options={productsData.map(prod => ({
                              value: prod.name,
                              label: prod.name
                            }))}
                            placeholder="Select product"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="1"
                          value={p.quantity}
                          onChange={(e) => updateProductInList(idx, "quantity", Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-full h-[36px] rounded-lg px-3 text-sm bg-white dark:bg-[#0f1117] border border-gray-300 dark:border-[#2f3441] text-gray-900 dark:text-white text-center focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="relative z-[1111] overflow-visible">
                          <Select
                            variant="form"
                            value={p.unit}
                            onChange={(val) => updateProductInList(idx, "unit", val)}
                            options={uniqueUnits.map(u => ({
                              value: u,
                              label: u
                            }))}
                            placeholder="Select unit"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeProductFromInquiry(idx)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors mx-auto"
                          title="Remove product"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {formData.products.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-sm text-gray-500 italic bg-gray-55/30 dark:bg-[#1a1d24]/50">
                        No products added yet. Add at least one product above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};


export default AddInquiryModal;