import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@context";
import { api } from "@services/api";
import { Select, Field, DataTable, DatePicker, StatusBadge, Button } from "@components/ui";
import Swal from "sweetalert2";

export default function ClientRFQsPage() {
  const { currentUser } = useAuth();
  
  // State
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Active Quote Panel State
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [prices, setPrices] = useState({}); // { inquiryItemId: price }
  const [validityDate, setValidityDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] // default 1 week validity
  );

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [suppliersRes, inquiriesRes] = await Promise.all([
        api.suppliers.getSuppliers(),
        api.inquiries.getInquiries(),
      ]);
      setSuppliers(suppliersRes.data || []);
      setInquiries(inquiriesRes.data || []);
      
      // Auto-select first supplier if available
      if (suppliersRes.data && suppliersRes.data.length > 0) {
        setSelectedSupplierId(suppliersRes.data[0].id);
      }
    } catch (err) {
      console.error("Error loading client portal data:", err);
      Swal.fire({
        icon: "error",
        title: "Load Error",
        text: "Failed to load portal data. Please try again.",
        background: "#1a1d23",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter inquiries in RFQ_SENT status containing the selected supplier
  const activeRFQs = useMemo(() => {
    if (!selectedSupplierId) return [];
    return inquiries.filter(
      (inq) =>
        inq.status === "RFQ_SENT" &&
        inq.suppliers?.some((s) => s.supplierId === selectedSupplierId)
    );
  }, [inquiries, selectedSupplierId]);

  // Handle selected inquiry change to reset prices
  const handleSelectInquiry = (inq) => {
    setSelectedInquiry(inq);
    const initialPrices = {};
    if (inq && inq.items) {
      inq.items.forEach((item) => {
        initialPrices[item.id] = "";
      });
    }
    setPrices(initialPrices);
  };

  // Price calculations
  const totals = useMemo(() => {
    if (!selectedInquiry || !selectedInquiry.items) {
      return { subtotal: 0, tax: 0, total: 0 };
    }
    let subtotal = 0;
    selectedInquiry.items.forEach((item) => {
      const unitPrice = parseFloat(prices[item.id]) || 0;
      subtotal += unitPrice * item.quantity;
    });
    const tax = subtotal * 0.18; // default 18% GST/tax
    return {
      subtotal,
      tax,
      total: subtotal + tax,
    };
  }, [selectedInquiry, prices]);

  const handlePriceChange = (itemId, val) => {
    setPrices((prev) => ({
      ...prev,
      [itemId]: val,
    }));
  };

  const isFormValid = useMemo(() => {
    if (!selectedInquiry || !selectedInquiry.items) return false;
    return selectedInquiry.items.every(
      (item) => parseFloat(prices[item.id]) > 0
    );
  }, [selectedInquiry, prices]);

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (!isFormValid || !selectedInquiry) return;

    setSubmitting(true);
    try {
      const payload = {
        supplierId: selectedSupplierId,
        quoteAmount: totals.subtotal,
        taxAmount: totals.tax,
        finalAmount: totals.total,
        validityDate: new Date(validityDate).toISOString(),
        items: selectedInquiry.items.map((item) => {
          const unitPrice = parseFloat(prices[item.id]);
          return {
            inquiryItemId: item.id,
            unitPrice,
            quantity: item.quantity,
            totalPrice: unitPrice * item.quantity,
          };
        }),
      };

      const res = await api.inquiries.supplierQuote(selectedInquiry.id, payload);
      if (res.success) {
        Swal.fire({
          icon: "success",
          title: "Quote Submitted Successfully",
          text: `Your quote for inquiry ${selectedInquiry.inquiry_id} has been submitted.`,
          timer: 2000,
          showConfirmButton: false,
          background: "#1a1d23",
          color: "#fff",
        });
        
        // Refresh local lists and close quoting panel
        setSelectedInquiry(null);
        const inquiriesRes = await api.inquiries.getInquiries();
        setInquiries(inquiriesRes.data || []);
      }
    } catch (err) {
      console.error("Quote submission error:", err);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: err.response?.data?.message || "Failed to submit quote. Please try again.",
        background: "#1a1d23",
        color: "#fff",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full pb-8 animate-pulse gap-6">
        <div className="flex items-center justify-between h-12 bg-gray-100 dark:bg-[#1a1d23] rounded-xl opacity-40" />
        <div className="w-1/3 h-10 bg-gray-100 dark:bg-[#1a1d23] rounded-xl opacity-40" />
        <div className="flex-1 w-full bg-gray-100 dark:bg-[#1a1d23] rounded-2xl opacity-30 border border-gray-200 dark:border-[#2a2d33]" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1a1d23] p-6 rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Supplier Quotation Portal</h1>
          <p className="text-xs text-gray-500 mt-1">Submit product unit prices for requested inquiries.</p>
        </div>
        
        {/* Supplier Profile Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Active Supplier Profile:
          </label>
          <Select
            variant="settings"
            value={selectedSupplierId}
            onChange={(val) => {
              setSelectedSupplierId(val);
              setSelectedInquiry(null);
            }}
            options={suppliers.map((s) => ({
              value: s.id,
              label: s.name,
            }))}
            className="min-w-[200px]"
          />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left Column: RFQ List */}
        <div className={`flex flex-col bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm overflow-hidden ${selectedInquiry ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
              Pending RFQs ({activeRFQs.length})
            </h2>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <DataTable
              columns={[
                { key: "inquiry_id", label: "Inquiry Ref" },
                { key: "buyer", label: "Client" },
                { key: "vessel", label: "Vessel" },
                { key: "itemsCount", label: "Items" },
                { key: "date", label: "Received Date" },
                { key: "action", label: "", className: "text-right" }
              ]}
              data={activeRFQs}
              emptyMessage="No pending RFQs found for this supplier profile."
              renderRow={(inq, idx) => (
                <tr
                  key={inq.inquiry_id}
                  className={`border-b border-gray-100 dark:border-[#2a2d33] hover:bg-gray-55/40 dark:hover:bg-white/[0.01] transition-colors cursor-pointer ${
                    selectedInquiry?.id === inq.id ? "bg-purple-500/5" : ""
                  }`}
                  onClick={() => handleSelectInquiry(inq)}
                >
                  <td className="px-6 py-4 font-mono font-bold text-sm text-gray-900 dark:text-white">
                    {inq.inquiry_id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800 dark:text-white text-sm">{inq.buyer_name}</span>
                      <span className="text-[10px] text-gray-400">{inq.buyer_email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {inq.vessel_name || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {inq.products?.length || 0}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {inq.date_received ? new Date(inq.date_received).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    }) : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant={selectedInquiry?.id === inq.id ? "primary" : "secondary"}
                      size="sm"
                    >
                      {selectedInquiry?.id === inq.id ? "Selected" : "Enter Prices"}
                    </Button>
                  </td>
                </tr>
              )}
            />
          </div>
        </div>

        {/* Right Column: Quote Quoting Panel */}
        {selectedInquiry && (
          <div className="lg:col-span-5 flex flex-col bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1f222b]">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Submit Prices for {selectedInquiry.inquiry_id}</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">{selectedInquiry.buyer_name}</p>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-gray-400 hover:text-gray-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitQuote} className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Product Price Inputs */}
              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Quote Unit Prices
                </label>
                
                {selectedInquiry.items?.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-xl space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">{item.description}</h4>
                        <span className="text-[10px] text-gray-500">
                          Quantity: {item.quantity} {item.unit || "pcs"}
                        </span>
                      </div>
                      
                      {prices[item.id] && (
                        <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                          Total: ₹{((parseFloat(prices[item.id]) || 0) * item.quantity).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-semibold">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={prices[item.id]}
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        className="w-full h-9 pl-7 pr-3 rounded-lg text-xs bg-white dark:bg-[#1a1d23] border border-gray-300 dark:border-[#2f3441] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Validity and Totals */}
              <div className="border-t border-gray-200 dark:border-[#2a2d33] pt-6 space-y-5">
                <DatePicker
                  label="Quote Validity Date"
                  name="validityDate"
                  value={validityDate}
                  onChange={(e) => setValidityDate(e.target.value)}
                />

                <div className="bg-gray-55/30 dark:bg-[#0c0e12] p-4.5 rounded-xl border border-gray-200 dark:border-[#2a2d33] space-y-2">
                  <div className="flex justify-between text-xs font-medium text-gray-500">
                    <span>Subtotal:</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">₹{totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-gray-500">
                    <span>GST (18%):</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">₹{totals.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white border-t border-dashed border-gray-200 dark:border-[#2a2d33] pt-2 mt-1">
                    <span>Final Quote Amount:</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400">₹{totals.total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedInquiry(null)}
                    className="w-1/3 py-2.5 rounded-lg border border-gray-300 dark:border-[#2a2d33] text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid || submitting}
                    className="flex-1 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      "Submit Quote"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
