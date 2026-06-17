import { ClientRFQsPageSchema1, ClientRFQsPageSchema2, ClientRFQsPageSchema3, ClientRFQsPageSchema4 } from '@config/tableSchemas';
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@context";
import { api } from "@services/api";
import { Select, Field, DataTable, rowStripeClass, ROW_HOVER_CLS, DatePicker, StatusBadge, Button } from "@components/ui";
import Swal from "sweetalert2";
import InvoiceReviewModal from './modals/InvoiceReviewModal';
import { RightDrawer } from "../settings/components/shared";

export default function ClientRFQsPage() {
  const { currentUser } = useAuth();

  // State
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [inquiries, setInquiries] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [invoicesData, setInvoicesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [viewingQuoteInquiry, setViewingQuoteInquiry] = useState(null);

  const [activeTab, setActiveTab] = useState("rfqs"); // "rfqs" | "orders" | "invoices"
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPOModal, setShowPOModal] = useState(false);

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
      const [suppliersRes, inquiriesRes, shipmentsRes, invoicesRes] = await Promise.all([
        api.suppliers.getSuppliers(),
        api.inquiries.getInquiries(),
        api.shipments.getShipments(),
        api.invoices.getInvoices(),
      ]);
      setSuppliers(suppliersRes.data || []);
      setInquiries(inquiriesRes.data || []);
      setShipments(shipmentsRes.data || []);

      if (invoicesRes.data) {
        const mappedInvoices = invoicesRes.data.map(inv => ({
          ...inv,
          inquiry_id: inv.id,
          buyer_name: inv.client?.name || 'Unknown Buyer',
          buyer_email: inv.client?.email || '',
          cargo: inv.shipment?.cargoDetails || 'General Cargo',
          invoice_date: inv.invoiceDate,
          invoice_status: inv.status,
          products: inv.items?.map(item => ({
            product_name: item.description,
            quantity: item.quantity,
            total_price: item.totalPrice
          })) || []
        }));
        setInvoicesData(mappedInvoices);
      }

      // Auto-select first supplier or matching supplier if available
      if (suppliersRes.data && suppliersRes.data.length > 0) {
        const matched = suppliersRes.data.find(s => s.email.toLowerCase() === currentUser?.email?.toLowerCase());
        if (matched) {
          setSelectedSupplierId(matched.id);
        } else {
          setSelectedSupplierId(suppliersRes.data[0].id);
        }
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

  const matchedSupplier = useMemo(() => {
    return suppliers.find(s => s.email.toLowerCase() === currentUser?.email?.toLowerCase());
  }, [suppliers, currentUser]);

  const currentSupplier = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId);
  }, [suppliers, selectedSupplierId]);

  // Get allotted items for an inquiry
  const getAllottedItems = (inq, supplier) => {
    if (!inq || !inq.items || !supplier) return [];
    return inq.items.filter(item => {
      const itemCategory = item.product?.category || "General";
      return (supplier.categories || []).some(
        cat => cat.toLowerCase() === itemCategory.toLowerCase()
      );
    });
  };

  // Filter inquiries to show active RFQs and quoted history
  const activeRFQs = useMemo(() => {
    if (!selectedSupplierId || !currentSupplier) return [];
    const preRFQStatuses = ["PENDING", "RFQ_READY"];
    return inquiries.filter((inq) => {
      if (preRFQStatuses.includes(inq.status)) return false;
      const isAssignedSupplier = inq.suppliers?.some((s) => s.supplierId === selectedSupplierId);
      if (!isAssignedSupplier) return false;
      if (getAllottedItems(inq, currentSupplier).length === 0) return false;

      const hasQuoted = inq.supplierQuotes?.some((q) => q.supplierId === selectedSupplierId);
      const isClosedOrConfirmed = ["CONFIRMED", "CLOSED", "ORDERED", "ORDER_PLACED"].includes(inq.status);

      if (isClosedOrConfirmed) {
        return hasQuoted;
      }
      return true;
    });
  }, [inquiries, selectedSupplierId, currentSupplier]);

  const activeOrders = useMemo(() => {
    if (!selectedSupplierId) return [];
    const validStatuses = [
      "PENDING", "ORDER_PLACED", "ORDERED", "VEHICLE_ALLOTTED", "LOADING", "DISPATCHED", "IN_TRANSIT",
      "OUT_FOR_DELIVERY", "DELIVERED", "DELIVERED_TO_VESSEL", "DELIVERED TO VESSEL", "CHALLAN_RECEIVED"
    ];
    return shipments.filter(
      (ship) =>
        validStatuses.includes(ship.currentStatus) &&
        ship.supplierId === selectedSupplierId
    );
  }, [shipments, selectedSupplierId]);

  // Filter invoices belonging to the active supplier
  const filteredInvoices = useMemo(() => {
    if (!selectedSupplierId) return [];
    return invoicesData.filter(inv => inv.shipment?.supplierId === selectedSupplierId);
  }, [invoicesData, selectedSupplierId]);

  const getSupplierDisplayStatus = (status) => {
    const postDispatchStatuses = ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "DELIVERED_TO_VESSEL", "DELIVERED TO VESSEL", "CHALLAN_RECEIVED"];
    if (postDispatchStatuses.includes(status)) {
      return "DISPATCHED";
    }
    return status;
  };

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
    if (!selectedInquiry || !selectedInquiry.items || !currentSupplier) {
      return { subtotal: 0, tax: 0, total: 0 };
    }
    let subtotal = 0;
    const allotted = getAllottedItems(selectedInquiry, currentSupplier);
    allotted.forEach((item) => {
      const unitPrice = parseFloat(prices[item.id]) || 0;
      subtotal += unitPrice * item.quantity;
    });
    const tax = subtotal * 0.18; // default 18% GST/tax
    return {
      subtotal,
      tax,
      total: subtotal + tax,
    };
  }, [selectedInquiry, prices, currentSupplier]);

  const handlePriceChange = (itemId, val) => {
    setPrices((prev) => ({
      ...prev,
      [itemId]: val,
    }));
  };

  const isFormValid = useMemo(() => {
    if (!selectedInquiry || !selectedInquiry.items || !currentSupplier) return false;
    const allotted = getAllottedItems(selectedInquiry, currentSupplier);
    if (allotted.length === 0) return false;
    return allotted.every(
      (item) => parseFloat(prices[item.id]) > 0
    );
  }, [selectedInquiry, prices, currentSupplier]);

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (!isFormValid || !selectedInquiry || !currentSupplier) return;

    setSubmitting(true);
    try {
      const allotted = getAllottedItems(selectedInquiry, currentSupplier);
      const payload = {
        supplierId: selectedSupplierId,
        quoteAmount: totals.subtotal,
        taxAmount: totals.tax,
        finalAmount: totals.total,
        validityDate: new Date(validityDate).toISOString(),
        items: allotted.map((item) => {
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

  const handleViewPDF = (url) => {
    if (!url) return;
    if (url.startsWith('data:')) {
      try {
        const parts = url.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'application/pdf';
        const b64 = parts[1];

        const byteCharacters = atob(b64);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        return;
      } catch (err) {
        console.error("Error converting base64 to blob:", err);
      }
    }
    // Fallback or normal URL
    window.open(url, '_blank');
  };

  const handleDispatchOrder = async () => {
    if (!selectedOrder) return;
    try {
      const res = await api.shipments.updateShipment(selectedOrder.id, { currentStatus: "DISPATCHED" });
      if (res.success) {
        Swal.fire({
          toast: true, position: 'top-end', icon: 'success',
          title: 'Order Dispatched',
          text: 'The shipment status has been updated to Dispatched.',
          background: '#1a1d23',
          color: '#fff',
          showConfirmButton: false,
          timer: 1500
        });

        await loadData();
        setSelectedOrder(prev => prev ? { ...prev, currentStatus: "DISPATCHED" } : null);
      }
    } catch (e) {
      console.error("Failed to dispatch order:", e);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'An error occurred while updating shipment status.',
        background: '#1a1d23',
        color: '#fff',
        confirmButtonColor: '#8b5cf6'
      });
    }
  };

  const handleGenerateInvoice = async (ship = null) => {
    const targetOrder = (ship && ship.id) ? ship : selectedOrder;
    if (!targetOrder) return;
    setGeneratingInvoice(true);
    try {
      const res = await api.invoices.generateInvoiceFromShipment(targetOrder.id);
      if (res.success) {
        setPreviewData({
          ...res.data,
          client: targetOrder.client || res.data.client || res.data.invoice?.client
        });
      }
    } catch (e) {
      console.error("Failed to generate invoice draft:", e);
      Swal.fire({
        icon: 'error',
        title: 'Generation Failed',
        text: e?.response?.data?.message || 'An error occurred while generating the invoice.',
        background: '#1a1d23',
        color: '#fff',
        confirmButtonColor: '#8b5cf6'
      });
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleInvoiceSent = () => {
    setPreviewData(null);
    loadData();
  };

  const handleDownloadPdf = async (invoiceId, invoiceNumber) => {
    try {
      const blob = await api.invoices.downloadPdf(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF:", err);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Could not download the invoice PDF.',
        background: '#1a1d23',
        color: '#fff',
        confirmButtonColor: '#8b5cf6'
      });
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

  if (selectedInquiry) {
    return (
      <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in duration-200">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1a1d23] p-6 rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedInquiry(null)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-55 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider border border-gray-200 dark:border-[#2a2d36] transition-all duration-200 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to RFQs
            </button>
            <span className="text-gray-305 dark:text-[#2a2d36] font-light">|</span>
            <span className="font-mono text-gray-950 dark:text-white text-base font-bold tracking-wide">
              Submit Prices for {selectedInquiry.inquiry_id}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Client</span>
            <span className="text-gray-950 dark:text-white font-bold text-sm">TradeMind</span>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmitQuote} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Product Price Inputs */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#1a1d23] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2d33] shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Quote Unit Prices</h3>
              <div className="space-y-4">
                {getAllottedItems(selectedInquiry, currentSupplier).map((item) => (
                  <div
                    key={item.id}
                    className="p-5 bg-gray-55/35 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-2xl space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{item.description}</h4>
                        <span className="text-xs text-gray-450 mt-1 block">
                          Quantity: <span className="font-bold text-gray-800 dark:text-gray-200">{item.quantity} {item.unit || "pcs"}</span>
                        </span>
                      </div>
                      {prices[item.id] && (
                        <span className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg">
                          Total: ₹{((parseFloat(prices[item.id]) || 0) * item.quantity).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">
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
                        className="w-full h-11 pl-8 pr-4 rounded-xl text-sm bg-white dark:bg-[#1a1d23] border border-gray-300 dark:border-[#2a2d36] text-gray-900 dark:text-white placeholder-gray-450 focus:outline-none focus:border-purple-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Validity & Totals */}
          <div className="lg:col-span-5 space-y-6">
            {/* Validity Date */}
            <div className="bg-white dark:bg-[#1a1d23] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2d33] shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Quote Validity</h3>
              <DatePicker
                label="Quote Validity Date"
                name="validityDate"
                value={validityDate}
                onChange={(e) => setValidityDate(e.target.value)}
              />
            </div>

            {/* Totals Summary */}
            <div className="bg-white dark:bg-[#1a1d23] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2d33] shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Quote Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-semibold text-gray-500 dark:text-gray-455 tracking-wide">
                  <span>Subtotal:</span>
                  <span className="font-mono text-gray-900 dark:text-white text-base">₹{totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-gray-500 dark:text-gray-455 tracking-wide">
                  <span>GST (18%):</span>
                  <span className="font-mono text-gray-900 dark:text-white text-base">₹{totals.tax.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-100 dark:border-[#2a2d36] pt-4 mt-2">
                  <div className="flex justify-between items-center text-sm font-black text-gray-900 dark:text-white">
                    <span className="uppercase tracking-wider text-[10px] text-gray-400 font-bold">Final Quote Amount</span>
                    <span className="font-mono text-xl font-extrabold text-purple-650 dark:text-purple-400 bg-purple-500/10 px-4 py-2 rounded-xl border border-purple-500/20 shadow-sm">
                      ₹{totals.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedInquiry(null)}
                    className="w-1/3 py-3 rounded-xl border border-gray-300 dark:border-[#2a2d36] text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid || submitting}
                    className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
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
            </div>
          </div>
        </form>
      </div>
    );
  }

  if (viewingQuoteInquiry) {
    const myQuote = viewingQuoteInquiry.supplierQuotes?.find(
      (q) => q.supplierId === selectedSupplierId
    );

    return (
      <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in duration-200">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-[#2a2d36] pb-4 gap-4 bg-white dark:bg-[#1a1d23] p-6 rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewingQuoteInquiry(null)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-55 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider border border-gray-200 dark:border-[#2a2d36] transition-all duration-200 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to RFQs
            </button>
            <span className="text-gray-300 dark:text-[#2a2d36] font-light">|</span>
            <span className="font-mono text-gray-950 dark:text-white text-lg font-bold tracking-wide">
              Quote Details — {viewingQuoteInquiry.inquiry_id}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={viewingQuoteInquiry.status} />
          </div>
        </div>

        {/* Content Grid */}
        {myQuote ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Quoted Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-[#1a1d23] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2d33] shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Quoted Items & Prices</h3>
                <div className="space-y-4">
                  {myQuote.items?.map((item) => {
                    const origItem = viewingQuoteInquiry.items?.find((i) => i.id === item.inquiryItemId) || {};
                    return (
                      <div
                        key={item.id}
                        className="p-5 bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl flex justify-between items-center shadow-sm"
                      >
                        <div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white block">
                            {origItem.description || item.inquiryItem?.description || "Product Item"}
                          </span>
                          <span className="text-xs text-gray-455 mt-1 block">
                            Quantity: {item.quantity} {origItem.unit || item.inquiryItem?.unit || "pcs"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">
                            Unit Price: ₹{Number(item.unitPrice).toLocaleString()}
                          </span>
                          <span className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400 block mt-0.5">
                            Total: ₹{Number(item.totalPrice).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Context & Summary */}
            <div className="space-y-6">
              {/* Meta details */}
              <div className="bg-white dark:bg-[#1a1d23] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2d33] shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Quote Context</h3>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest block">Client Name</span>
                  <span className="text-sm font-bold text-gray-800 dark:text-white mt-1 block">TradeMind</span>
                </div>
                <div className="border-t border-gray-100 dark:border-[#2a2d33]/80 pt-3">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest block">Quote Validity</span>
                  <span className="text-sm font-semibold text-gray-705 dark:text-gray-305 mt-1 block">
                    {myQuote.validityDate ? new Date(myQuote.validityDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    }) : "—"}
                  </span>
                </div>
                <div className="border-t border-gray-100 dark:border-[#2a2d33]/80 pt-3">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest block">Quoted Date</span>
                  <span className="text-sm font-semibold text-gray-705 dark:text-gray-305 mt-1 block">
                    {new Date(myQuote.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </span>
                </div>
              </div>

              {/* Quote Summary */}
              <div className="bg-white dark:bg-[#1a1d23] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2d33] shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Quote Summary</h3>
                <div className="space-y-3.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-555 dark:text-gray-455 tracking-wide">
                    <span>Subtotal Quoted:</span>
                    <span className="font-mono text-gray-900 dark:text-gray-105 text-sm">₹{Number(myQuote.quoteAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-gray-555 dark:text-gray-455 tracking-wide">
                    <span>GST (18%):</span>
                    <span className="font-mono text-gray-900 dark:text-gray-105 text-sm">₹{Number(myQuote.taxAmount).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-dashed border-gray-200 dark:border-[#2a2d33] pt-3.5 mt-2">
                    <div className="flex justify-between items-center text-sm font-black text-gray-900 dark:text-white">
                      <span className="uppercase tracking-wider text-[10px] text-gray-400 font-bold">Final Quoted Amount</span>
                      <span className="font-mono text-lg font-extrabold text-purple-650 dark:text-purple-400 bg-purple-500/10 px-3.5 py-1.5 rounded-xl border border-purple-500/20">
                        ₹{Number(myQuote.finalAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 italic bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200 dark:border-[#2a2d33] p-12">
            No quote found.
          </div>
        )}
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in duration-200">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-[#2a2d36] pb-4 gap-4 bg-white dark:bg-[#1a1d23] p-6 rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedOrder(null)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-55 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider border border-gray-200 dark:border-[#2a2d36] transition-all duration-200 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Confirmed Orders
            </button>
            <span className="text-gray-300 dark:text-[#2a2d36] font-light">|</span>
            <span className="font-mono text-gray-950 dark:text-white text-lg font-bold tracking-wide">
              Order Details — {selectedOrder.shipmentNumber}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={selectedOrder.currentStatus === 'PENDING' ? 'CONFIRMED' : getSupplierDisplayStatus(selectedOrder.currentStatus)} />
            {(selectedOrder.currentStatus === "ORDER_PLACED" || selectedOrder.currentStatus === "PENDING") && (
              <button
                onClick={handleDispatchOrder}
                className="px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-purple-600 hover:bg-purple-550 text-white shadow-purple-600/10"
              >
                Mark Dispatched
              </button>
            )}
            {(selectedOrder.currentStatus === "DISPATCHED" || selectedOrder.currentStatus === "DELIVERED" || selectedOrder.currentStatus === "DELIVERED_TO_VESSEL" || selectedOrder.currentStatus === "DELIVERED TO VESSEL" || selectedOrder.currentStatus === "CHALLAN_RECEIVED") && (
              <button
                onClick={() => handleGenerateInvoice()}
                disabled={generatingInvoice}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/10 disabled:opacity-50"
              >
                {generatingInvoice ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                Create & Send Invoice
              </button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Cargo Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#1a1d23] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2d33] shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                {selectedOrder.purchaseOrder?.items?.length > 0 ? "Order Items" : "Cargo Details"}
              </h3>
              {selectedOrder.purchaseOrder?.items?.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner">
                  <DataTable
                    columns={ClientRFQsPageSchema1}
                    data={selectedOrder.purchaseOrder.items}
                    emptyMessage="No items found."
                    renderRow={(item, idx) => (
                      <tr key={item.id || idx} className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}>
                        <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + idx + 1}</td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white font-bold">
                          {item.description || item.product?.name || "Product Item"}
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-900 dark:text-white font-medium">
                          {item.quantity} {item.product?.unit || "PCS"}
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-400">
                          ₹{Number(item.unitPrice).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-purple-600 dark:text-purple-400 text-base">
                          ₹{Number(item.totalPrice).toLocaleString()}
                        </td>
                      </tr>
                    )}
                  />
                </div>
              ) : (
                <div className="p-6 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-inner">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                    {selectedOrder.cargoDetails || "No cargo details provided."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Context & Associated Info */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1a1d23] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2d33] shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Order Context</h3>

              <div>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest block">Customer</span>
                <span className="text-sm font-bold text-gray-850 dark:text-white mt-1 block">TradeMind</span>
              </div>
              <div className="border-t border-gray-100 dark:border-[#2a2d33]/80 pt-3">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest block">Client Email</span>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1 block">contact@trademind.com</span>
              </div>
              <div className="border-t border-gray-100 dark:border-[#2a2d33]/80 pt-3">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest block">Destination</span>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1 block">{selectedOrder.client?.address || "—"}</span>
              </div>
              <div className="border-t border-gray-100 dark:border-[#2a2d33]/80 pt-3">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest block">Ordered Date</span>
                <span className="text-sm font-semibold text-gray-750 dark:text-gray-350 mt-1 block">
                  {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                  }) : "—"}
                </span>
              </div>
            </div>

            {/* Linked Purchase Order if available */}
            {(selectedOrder.purchaseOrder?.poNumber || selectedOrder.purchaseOrderId) && (
              <div className="bg-white dark:bg-[#1a1d23] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2d33] shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Linked Purchase Order</h3>
                <div className="flex justify-between items-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <span>PO Reference:</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100 font-bold text-sm bg-gray-50 dark:bg-[#0c0e12] px-2.5 py-1 rounded-lg border border-gray-200 dark:border-[#2a2d36]">
                    {selectedOrder.purchaseOrder?.poNumber || selectedOrder.purchaseOrderId}
                  </span>
                </div>
                {selectedOrder.purchaseOrder?.attachment && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleViewPDF(selectedOrder.purchaseOrder.attachment)}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-550 text-white text-xs font-bold transition-all shadow-md shadow-purple-650/10 flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View PO PDF
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <InvoiceReviewModal
          isOpen={!!previewData}
          previewData={previewData}
          onClose={() => setPreviewData(null)}
          onSent={handleInvoiceSent}
        />
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

        {/* Supplier Profile Info / Selector */}
        {matchedSupplier ? (
          <div className="flex items-center gap-2.5 bg-purple-500/10 border border-purple-550/20 px-4 py-2 rounded-xl">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-550 uppercase tracking-wider">
              Supplier Profile:
            </span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {matchedSupplier.company ? `${matchedSupplier.name} (${matchedSupplier.company})` : matchedSupplier.name}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-400 dark:text-gray-550 uppercase tracking-wider">
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
                label: s.company ? `${s.name} (${s.company})` : `${s.name} (${s.email})`,
              }))}
              className="min-w-[200px]"
            />
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-6 border-b border-gray-200 dark:border-[#2a2d33] pb-1">
        <button
          onClick={() => {
            setActiveTab("rfqs");
            setSelectedInquiry(null);
            setSelectedOrder(null);
          }}
          className={`pb-3 text-sm font-bold tracking-wide transition-colors relative ${activeTab === "rfqs"
            ? "text-purple-600 dark:text-white"
            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
        >
          RFQs & Quotations ({activeRFQs.length})
          {activeTab === "rfqs" && (
            <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-purple-500 rounded-t" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("orders");
            setSelectedInquiry(null);
            setSelectedOrder(null);
          }}
          className={`pb-3 text-sm font-bold tracking-wide transition-colors relative ${activeTab === "orders"
            ? "text-purple-600 dark:text-white"
            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
        >
          Confirmed Orders ({activeOrders.length})
          {activeTab === "orders" && (
            <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-purple-500 rounded-t" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("invoices");
            setSelectedInquiry(null);
            setSelectedOrder(null);
          }}
          className={`pb-3 text-sm font-bold tracking-wide transition-colors relative ${activeTab === "invoices"
            ? "text-purple-600 dark:text-white"
            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
        >
          Invoices
          {activeTab === "invoices" && (
            <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-purple-500 rounded-t" />
          )}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {activeTab === "rfqs" && (
          <>
            {/* Left Column: RFQ List */}
            <div className="flex flex-col bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm overflow-hidden lg:col-span-12">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                  My RFQs & Quotations ({activeRFQs.length})
                </h2>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar">
                <DataTable
                  columns={ClientRFQsPageSchema2}
                  data={activeRFQs}
                  emptyMessage="No pending RFQs found for this supplier profile."
                  renderRow={(inq, idx) => {
                    const hasAlreadyQuoted = inq.supplierQuotes?.some(q => q.supplierId === selectedSupplierId);
                    return (
                      <tr
                        key={inq.inquiry_id}
                        className={`border-b border-gray-100 dark:border-[#2a2d33] transition-colors ${inq.status === "RFQ_SENT" && !hasAlreadyQuoted
                          ? "hover:bg-gray-55/40 dark:hover:bg-white/[0.01] cursor-pointer"
                          : "opacity-85"
                          }`}
                        onClick={() => inq.status === "RFQ_SENT" && !hasAlreadyQuoted && handleSelectInquiry(inq)}
                      >
                        <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + idx + 1}</td>
                        <td className="px-6 py-4 font-mono font-bold text-sm text-gray-900 dark:text-white">
                          {inq.inquiry_id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 dark:text-white text-sm">TradeMind</span>
                            <span className="text-[10px] text-gray-400">contact@trademind.com</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                          {getAllottedItems(inq, currentSupplier).length}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {inq.date_received ? new Date(inq.date_received).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          }) : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {["CONFIRMED", "CLOSED"].includes(inq.status) ? (
                            (() => {
                              const myQuote = inq.supplierQuotes?.find(q => q.supplierId === selectedSupplierId);
                              const isOrdered = myQuote?.isSelected || shipments.some(s => (s.inquiryId === inq.id || s.inquiryId === inq.inquiry_id) && s.supplierId === selectedSupplierId);
                              if (isOrdered) {
                                return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 uppercase tracking-wider">Ordered</span>;
                              } else {
                                return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 uppercase tracking-wider">Rejected</span>;
                              }
                            })()
                          ) : (
                            <StatusBadge status={inq.status} />
                          )}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          {inq.status === "RFQ_SENT" && !hasAlreadyQuoted ? (
                            <Button
                              variant="secondary"
                              size="sm"
                            >
                              Enter Prices
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              {hasAlreadyQuoted && (
                                <>
                                  <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
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
                                </>
                              )}
                              {!hasAlreadyQuoted && inq.status !== "RFQ_SENT" && (
                                <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20">
                                  Missed
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  }}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "orders" && (
          <>
            {/* Left Column: Confirmed Orders List */}
            <div className="flex flex-col bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm overflow-hidden lg:col-span-12">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                  Confirmed Orders ({activeOrders.length})
                </h2>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar">
                <DataTable
                  columns={ClientRFQsPageSchema3}
                  data={activeOrders}
                  emptyMessage="No confirmed orders found for this supplier profile."
                  renderRow={(ship, idx) => (
                    <tr
                      key={ship.id}
                      className="border-b border-gray-100 dark:border-[#2a2d33] transition-colors hover:bg-gray-55/40 dark:hover:bg-white/[0.01] cursor-pointer"
                      onClick={() => setSelectedOrder(ship)}
                    >
                      <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + idx + 1}</td>
                      <td className="px-6 py-4 font-mono font-bold text-sm text-gray-900 dark:text-white">
                        {ship.shipmentNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 dark:text-white text-sm">TradeMind</span>
                          <span className="text-[10px] text-gray-400">contact@trademind.com</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 truncate max-w-[200px]" title={ship.cargoDetails}>
                        {ship.cargoDetails || "General Cargo"}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {ship.createdAt ? new Date(ship.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        }) : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <StatusBadge status={ship.currentStatus === 'PENDING' ? 'CONFIRMED' : getSupplierDisplayStatus(ship.currentStatus)} />
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        {(ship.currentStatus === "DISPATCHED" || ship.currentStatus === "DELIVERED" || ship.currentStatus === "DELIVERED_TO_VESSEL" || ship.currentStatus === "DELIVERED TO VESSEL" || ship.currentStatus === "CHALLAN_RECEIVED") && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateInvoice(ship);
                            }}
                          >
                            Raise Invoice
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  )}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "invoices" && (
          <div className="lg:col-span-12 bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200 dark:border-[#2a2d33] overflow-hidden shadow-lg animate-in fade-in duration-300 flex flex-col h-full min-h-[400px]">
            <div className="overflow-x-auto flex-1">
              <DataTable
                columns={ClientRFQsPageSchema4}
                data={filteredInvoices}
                emptyMessage="No invoices found."
                renderRow={(inv, idx) => (
                  <tr key={inv.id} className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}>
                    <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + idx + 1}</td>
                    <td className="px-6 py-4 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {inv.shipment?.purchaseOrder?.poNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200" title={inv.cargo}>
                      <div className="max-w-[200px] overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {inv.cargo}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      }) : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <StatusBadge status={inv.invoice_status} />
                      {inv.invoice_status === 'PAID' && inv.paymentDetails && (
                        <div className="mt-2 flex flex-col gap-1.5">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 w-max shadow-sm">
                            <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-[10px] font-bold text-green-700 dark:text-green-400">
                              {inv.paymentDetails.method}
                            </span>
                          </div>
                          {inv.paymentDetails.reference && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 dark:bg-[#1e2028] border border-gray-200 dark:border-[#2a2d36] w-max shadow-sm">
                              <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Ref</span>
                              <span className="text-[10px] font-mono font-bold text-gray-700 dark:text-gray-300">
                                {inv.paymentDetails.reference}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {inv.invoice_status?.toUpperCase() === 'DRAFT' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                            onClick={async () => {
                              try {
                                setGeneratingInvoice(true);
                                const res = await api.invoices.previewInvoice(inv.id);
                                if (res?.success && res?.data) {
                                  setPreviewData({
                                    ...res.data,
                                    client: inv.client || res.data.client || res.data.invoice?.client
                                  });
                                }
                              } catch (e) {
                                console.error("Failed to preview invoice:", e);
                                Swal.fire({
                                  icon: 'error',
                                  title: 'Preview Failed',
                                  text: 'Could not load invoice preview.',
                                  background: '#1a1d23',
                                  color: '#fff',
                                  confirmButtonColor: '#8b5cf6'
                                });
                              } finally {
                                setGeneratingInvoice(false);
                              }
                            }}
                          >
                            Send Invoice
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                          >
                            Download
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              />
            </div>
          </div>
        )}
      </div>

      <InvoiceReviewModal
        isOpen={!!previewData}
        previewData={previewData}
        onClose={() => setPreviewData(null)}
        onSent={handleInvoiceSent}
      />
    </div>
  );
}
