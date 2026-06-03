import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@context";
import { api } from "@services/api";
import { Select, Field, DataTable, DatePicker, StatusBadge, Button } from "@components/ui";
import Swal from "sweetalert2";
import { RightDrawer } from "../settings/components/shared";

export default function ClientRFQsPage() {
  const { currentUser } = useAuth();
  
  // State
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewingQuoteInquiry, setViewingQuoteInquiry] = useState(null);

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

  // Filter inquiries that are in RFQ_SENT status or any status after it, containing the selected supplier
  const activeRFQs = useMemo(() => {
    if (!selectedSupplierId) return [];
    const nonPortalStatuses = ["PENDING", "RFQ_READY"];
    return inquiries.filter(
      (inq) =>
        !nonPortalStatuses.includes(inq.status) &&
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
        // Refresh local lists and close quoting panel
        setSelectedInquiry(null);
        const inquiriesRes = await api.inquiries.getInquiries();
        setInquiries(inquiriesRes.data || []);
      }
    } catch (err) {
      console.error("Quote submission error:", err);
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
              My RFQs & Quotations ({activeRFQs.length})
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
                { key: "status", label: "Status" },
                { key: "action", label: "", className: "text-right" }
              ]}
              data={activeRFQs}
              emptyMessage="No pending RFQs found for this supplier profile."
              renderRow={(inq, idx) => (
                <tr
                  key={inq.inquiry_id}
                  className={`border-b border-gray-100 dark:border-[#2a2d33] transition-colors ${
                    inq.status === "RFQ_SENT"
                      ? "hover:bg-gray-55/40 dark:hover:bg-white/[0.01] cursor-pointer"
                      : "opacity-85"
                  } ${selectedInquiry?.id === inq.id ? "bg-purple-500/5" : ""}`}
                  onClick={() => inq.status === "RFQ_SENT" && handleSelectInquiry(inq)}
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
                  <td className="px-6 py-4 text-sm">
                    <StatusBadge status={inq.status} />
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    {inq.status === "RFQ_SENT" ? (
                      <Button
                        variant={selectedInquiry?.id === inq.id ? "primary" : "secondary"}
                        size="sm"
                      >
                        {selectedInquiry?.id === inq.id ? "Selected" : "Enter Prices"}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                          Quoted
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingQuoteInquiry(inq);
                          }}
                        >
                          View Quote
                        </Button>
                      </div>
                    )}
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

                <div className="bg-gray-50 dark:bg-[#0f111a] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d33] space-y-3.5 shadow-inner">
                  <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                    <span>Subtotal:</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100 text-sm">₹{totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                    <span>GST (18%):</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100 text-sm">₹{totals.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black text-gray-900 dark:text-white border-t border-dashed border-gray-200 dark:border-[#2a2d33] pt-3.5 mt-2">
                    <span className="uppercase tracking-wider text-[11px] text-gray-600 dark:text-gray-400 font-bold">Final Quote Amount</span>
                    <span className="font-mono text-lg font-extrabold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-3.5 py-1.5 rounded-xl border border-purple-500/20 shadow-sm">
                      ₹{totals.total.toLocaleString()}
                    </span>
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

      {/* View Quote Drawer */}
      {viewingQuoteInquiry && (() => {
        const myQuote = viewingQuoteInquiry.supplierQuotes?.find(
          (q) => q.supplierId === selectedSupplierId
        );
        
        return (
          <RightDrawer
            isOpen={!!viewingQuoteInquiry}
            title={`Quotation Details — ${viewingQuoteInquiry.inquiry_id}`}
            onClose={() => setViewingQuoteInquiry(null)}
          >
            {myQuote ? (
              <div className="space-y-6">
                {/* Meta details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-[#0c0e12] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d33]">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Client Name</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-white mt-1 block">{viewingQuoteInquiry.buyer_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Vessel / Reference</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-white mt-1 block">{viewingQuoteInquiry.vessel_name || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Quote Validity</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-white mt-1 block">
                      {myQuote.validityDate ? new Date(myQuote.validityDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      }) : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Quoted Date</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-white mt-1 block">
                      {new Date(myQuote.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                </div>

                {/* Quoted Items */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Quoted Items & Prices</h4>
                  <div className="space-y-3">
                    {myQuote.items?.map((item) => {
                      const origItem = viewingQuoteInquiry.items?.find((i) => i.id === item.inquiryItemId) || {};
                      
                      return (
                        <div key={item.id} className="p-4 bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl flex justify-between items-center shadow-sm">
                          <div>
                            <span className="text-sm font-bold text-gray-800 dark:text-white block">{origItem.description || item.inquiryItem?.description || "Product Item"}</span>
                            <span className="text-[10px] text-gray-500 mt-0.5 block">Quantity: {item.quantity} {origItem.unit || item.inquiryItem?.unit || "pcs"}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Unit: ₹{Number(item.unitPrice).toLocaleString()}</span>
                            <span className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400 block mt-0.5">Total: ₹{Number(item.totalPrice).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quote Summary */}
                <div className="bg-gray-55/30 dark:bg-[#0f111a] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d33] space-y-3 shadow-inner mt-4">
                  <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                    <span>Subtotal Quoted:</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100 text-sm">₹{Number(myQuote.quoteAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                    <span>GST (18%):</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100 text-sm">₹{Number(myQuote.taxAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black text-gray-900 dark:text-white border-t border-dashed border-gray-200 dark:border-[#2a2d33] pt-3.5 mt-2">
                    <span className="uppercase tracking-wider text-[11px] text-gray-600 dark:text-gray-400 font-bold">Final Quoted Amount</span>
                    <span className="font-mono text-lg font-extrabold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-3.5 py-1.5 rounded-xl border border-purple-500/20">
                      ₹{Number(myQuote.finalAmount).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setViewingQuoteInquiry(null)}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs transition-all outline-none border-none"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 italic">No quote found.</div>
            )}
          </RightDrawer>
        );
      })()}
    </div>
  );
}
