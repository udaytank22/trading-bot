import { SupplyDetailsPageSchema1 } from '@config/tableSchemas';
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { useData, useAuth } from '@context';
import { api } from '@services/api';
import { formatINR } from '@services/marginEngine';
import { DataTable, rowStripeClass, ROW_HOVER_CLS, StatusBadge } from '@components/ui';
import AllotVehicleModal from '@features/employees/modals/AllotVehicleModal';
import InvoiceEmailModal from '@features/invoices/modals/InvoiceEmailModal';
import Swal from 'sweetalert2';

const DUMMY_PDF_URL = "/memories/file-sample_150kB.pdf";

export default function SupplyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { supplyData, refreshAll } = useData();
  const { currentUser } = useAuth();

  const roleLower = currentUser?.role?.toLowerCase();
  const isAdminOrClient = roleLower === 'admin' || roleLower === 'super admin' || roleLower === 'administrator' || roleLower === 'client';

  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [pdfLabel, setPdfLabel] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  // Modals state
  const [allotModalDeal, setAllotModalDeal] = useState(null);
  const [isAllotModalOpen, setIsAllotModalOpen] = useState(false);
  const [invoiceModalDeal, setInvoiceModalDeal] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Load shipment — id from URL is a string, backend IDs are integers
  useEffect(() => {
    const numId = parseInt(id, 10);
    const found = supplyData.find(item => item.id === numId || item.id === id);
    if (found) {
      setDeal({
        ...found,
        status: found.currentStatus || found.status
      });
    } else {
      setLoading(true);
      api.shipments.getShipment(id)
        .then(res => {
          if (res.success && res.data) {
            setDeal({
              ...res.data,
              status: res.data.currentStatus || res.data.status
            });
          }
        })
        .catch(err => console.error('Failed to fetch shipment details:', err))
        .finally(() => setLoading(false));
    }
  }, [id, supplyData]);

  // Close PDF viewer on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showPdf) setShowPdf(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPdf]);

  const handleStatusUpdate = async (shipmentId, newStatus) => {
    if (newStatus === "SUPPLY") {
      const res = await api.shipments.updateShipment(shipmentId, { currentStatus: "SUPPLY" });
      if (res.success) refreshAll();
      return;
    }
    if (newStatus === "SEND_INVOICE") {
      setInvoiceModalDeal(deal);
      setIsInvoiceModalOpen(true);
      return;
    }
    if (newStatus === "INVOICE_SENT") {
      try {
        const res = await api.shipments.updateShipment(shipmentId, { currentStatus: "DELIVERED" });
        if (res.success) {
          const invoicePayload = {
            clientId: deal.clientId,
            inquiryId: deal.inquiryId,
            shipmentId: deal.id,
            subtotal: 1000.00,
            status: 'SENT',
            items: deal.purchaseOrder?.items?.map(p => ({
              description: p.product?.name || p.description || 'Product',
              quantity: p.quantity || 1,
              unitPrice: Number(p.unitPrice) || 1000.00,
              totalPrice: Number(p.totalPrice) || 1000.00
            })) || []
          };
          await api.invoices.createInvoice(invoicePayload);
          refreshAll();
          setDeal(prev => ({ ...prev, status: "DELIVERED" }));
        }
      } catch (e) {
        console.error("Failed to transition shipment to invoice:", e);
      }
      return;
    }

    try {
      const res = await api.shipments.updateShipment(shipmentId, { currentStatus: newStatus });
      if (res.success) {
        refreshAll();
        setDeal(prev => ({ ...prev, status: newStatus }));
      }
    } catch (e) {
      console.error("Failed to update shipment status:", e);
    }
  };

  const productsList = useMemo(() => {
    if (deal?.purchaseOrder?.items && deal.purchaseOrder.items.length > 0) {
      return deal.purchaseOrder.items.map((item) => ({
        product_name: item.product?.name || item.description || "Product Item",
        quantity: item.quantity,
        unit: item.product?.unit || "PCS",
        specs: item.product?.category || "—",
      }));
    }
    return deal?.products || [];
  }, [deal]);

  const subtotal = useMemo(() => {
    if (deal?.purchaseOrder?.items && deal.purchaseOrder.items.length > 0) {
      return deal.purchaseOrder.items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
    }
    return deal?.purchaseOrder?.amount ? Number(deal.purchaseOrder.amount) / 1.18 : 0;
  }, [deal]);

  const totalAmount = useMemo(() => {
    return deal?.purchaseOrder?.amount ? Number(deal.purchaseOrder.amount) : subtotal * 1.18;
  }, [deal, subtotal]);

  const gstAmount = useMemo(() => Math.max(0, totalAmount - subtotal), [totalAmount, subtotal]);

  const pickupLocation = deal?.supplier?.address || deal?.supplier?.company || deal?.supplier?.name || "N/A";
  const dropLocation = deal?.client?.address || deal?.client?.name || deal?.destination || "N/A";
  const driverDetails = deal?.driverDetails || "Not Assigned";
  const vehicleDetails = deal?.vehicleDetails || "Not Assigned";

  const formatDateTime = (d) => {
    if (!d) return "Not Scheduled";
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return "Not Scheduled";
    return parsed.toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const loadingDate = formatDateTime(deal?.loadingDate);
  const deliveryDate = formatDateTime(deal?.deliveryDate);

  const contactPerson = deal?.supplier?.name
    ? `${deal.supplier.name} (${deal.supplier.phone || "—"})`
    : "—";

  const documents = useMemo(() => {
    const docList = [];
    if (deal?.purchaseOrder?.attachment) {
      docList.push({
        name: `Purchase Order (${deal.purchaseOrder.poNumber})`,
        type: "PDF",
        size: "Generated PO Document",
        url: deal.purchaseOrder.attachment,
      });
    }
    docList.push(
      { name: "Delivery Challan", type: "PDF", size: "1.2 MB", url: DUMMY_PDF_URL },
      { name: "Gate Pass (Entry)", type: "PDF", size: "850 KB", url: DUMMY_PDF_URL },
      { name: "Vehicle Registration (RC)", type: "IMG", size: "2.4 MB", url: DUMMY_PDF_URL },
      { name: "Driver Identity / License", type: "IMG", size: "1.8 MB", url: DUMMY_PDF_URL }
    );
    return docList;
  }, [deal]);

  const steps = [
    { id: "ORDER_PLACED", label: "Order Placed" },
    { id: "LOADING", label: "Loading" },
    { id: "DISPATCHED", label: "Dispatched" },
    { id: "DELIVERED", label: "Delivered" },
  ];

  const currentStepIdx = useMemo(() => {
    if (!deal) return 0;
    const s = deal.status || deal.currentStatus;
    if (s === "PENDING" || s === "ORDER_PLACED") return 0;
    if (s === "LOADING") return 1;
    if (s === "DISPATCHED" || s === "IN_TRANSIT") return 2;
    if (s === "DELIVERED") return 3;
    return 0;
  }, [deal]);

  if (loading || !deal) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const status = deal.status || deal.currentStatus;
  const isVehicleAllotted = status !== "ORDER_PLACED" && status !== "DISPATCHED";

  return (
    <div className="w-full animate-in fade-in duration-300 pb-6">
      <div className="max-w-7xl mx-auto py-2 px-2 md:px-4 flex flex-col gap-4 relative">

        {/* ── Inline PDF Viewer overlay ── */}
        {showPdf && (
          <div className="absolute inset-0 z-50 flex flex-col bg-white dark:bg-[#1e2028] rounded-2xl overflow-hidden border border-gray-200 dark:border-[#2a2d36] min-h-[70vh] shadow-2xl">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36] bg-gray-50 dark:bg-[#1a1d23] flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => setShowPdf(false)}
                className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Supply Details
              </button>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {pdfLabel}
                </div>
                <a href={pdfUrl} download={pdfLabel} className="flex items-center gap-1.5 text-xs font-bold text-purple-500 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20 hover:bg-purple-500/20 transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-[#0c0e12]">
              <iframe src={pdfUrl} title="Document Preview" className="w-full h-full border-0" />
            </div>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-[#2a2d36] pb-4 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/supply')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider border border-gray-200 dark:border-[#2a2d36] transition-all duration-200 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Supply
            </button>
            <span className="text-gray-300 dark:text-[#2a2d36] font-light">|</span>
            <span className="font-mono text-gray-900 dark:text-white text-lg font-bold tracking-wide">
              {deal.shipmentNumber || `SH-${deal.id}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />


            {status === "ORDER_PLACED" && isAdminOrClient && (
              <button
                onClick={async () => {
                  const result = await Swal.fire({
                    title: 'Mark as Dispatched?',
                    text: 'This will advance the shipment status to Dispatched.',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#8b5cf6',
                    cancelButtonColor: '#374151',
                    confirmButtonText: 'Yes, Dispatch',
                    cancelButtonText: 'Cancel',
                    background: '#1a1d23',
                    color: '#fff',
                  });
                  if (result.isConfirmed) handleStatusUpdate(deal.id, 'DISPATCHED');
                }}
                className="px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-purple-600 hover:bg-purple-500 text-white"
              >
                Mark Dispatched
              </button>
            )}

            {status === "LOADING" && (
              <button
                onClick={async () => {
                  const result = await Swal.fire({
                    title: 'Mark as Loaded?',
                    text: 'This will advance the shipment status to In Transit.',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#ea580c',
                    cancelButtonColor: '#374151',
                    confirmButtonText: 'Yes, Mark Loaded',
                    cancelButtonText: 'Cancel',
                    background: '#1a1d23',
                    color: '#fff',
                  });
                  if (result.isConfirmed) handleStatusUpdate(deal.id, 'IN_TRANSIT');
                }}
                className="px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-orange-600 hover:bg-orange-500 text-white"
              >
                Mark Loaded
              </button>
            )}

            {status === "LOADING" && (
              <button
                onClick={() => { setAllotModalDeal(deal); setIsAllotModalOpen(true); }}
                className="px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-white hover:bg-gray-50 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-purple-600 dark:text-purple-400 border border-purple-500/30 transition-all shadow-sm"
              >
                Allot Vehicle
              </button>
            )}

            {(status === "IN_TRANSIT" || status === "DISPATCHED") && (
              <button
                onClick={async () => {
                  const result = await Swal.fire({
                    title: 'Mark as Delivered?',
                    text: 'This will mark the shipment as successfully delivered.',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#2563eb',
                    cancelButtonColor: '#374151',
                    confirmButtonText: 'Yes, Delivered',
                    cancelButtonText: 'Cancel',
                    background: '#1a1d23',
                    color: '#fff',
                  });
                  if (result.isConfirmed) handleStatusUpdate(deal.id, 'DELIVERED');
                }}
                className="px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
              >
                Mark Delivered
              </button>
            )}

            {status === "DELIVERED" && (
              <button
                onClick={() => handleStatusUpdate(deal.id, "SEND_INVOICE")}
                className="px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
              >
                Send Invoice
              </button>
            )}

            {status === "SHIPPED" && (
              <button
                onClick={() => handleStatusUpdate(deal.id, "SUPPLY")}
                className="px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-green-600 hover:bg-green-500 text-white transition-all shadow-sm"
              >
                Move to Supply
              </button>
            )}
          </div>
        </div>

        {/* STEPPER TIMELINE */}
        <div className="bg-white dark:bg-[#1e2028] rounded-xl p-5 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1">
            Logistics Milestone Progress
          </div>
          <div className="overflow-x-auto w-full pb-1">
            <div className="relative flex items-start pt-1 pb-2 min-w-[500px] justify-between px-10">
              <div className="absolute left-[80px] right-[80px] h-[2px] bg-gray-200 dark:bg-[#2a2d36] -z-10" style={{ top: "15px" }} />
              <div
                className="absolute left-[80px] h-[2px] bg-purple-500 -z-10 transition-all duration-350"
                style={{ top: "15px", width: `calc((${currentStepIdx} / ${steps.length - 1}) * (100% - 160px))` }}
              />
              {steps.map((step, idx) => {
                const isActive = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step.id} className="flex flex-col items-center w-[80px] flex-shrink-0">
                    <div className="h-4 flex items-center justify-center">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-[#1e2028] z-10 transition-all duration-300 flex items-center justify-center ${isActive ? "border-purple-500 shadow" : "border-gray-300 dark:border-gray-600"}`}>
                        {isActive && <div className={`w-1.5 h-1.5 rounded-full bg-purple-500 ${isCurrent ? "animate-pulse" : ""}`} />}
                      </div>
                    </div>
                    <span className={`text-[8px] mt-2 font-bold uppercase tracking-wider text-center max-w-[76px] leading-tight select-none ${isCurrent ? "text-purple-500 font-extrabold" : isActive ? "text-purple-400/80" : "text-gray-400"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left Column: Items and Logistics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cargo Items */}
            <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Cargo Items</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner">
                <DataTable
                  columns={SupplyDetailsPageSchema1}
                  data={productsList}
                  emptyMessage="No items requested."
                  renderRow={(p, i) => (
                    <tr key={i} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
                      <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{i + 1}</td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white font-bold">{p.product_name}</td>
                      <td className="px-6 py-4 font-mono text-gray-900 dark:text-white font-medium">{p.quantity}</td>
                      <td className="px-6 py-4 text-gray-500 font-semibold">{p.unit || "PCS"}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{p.specs || "—"}</td>
                    </tr>
                  )}
                />
              </div>
            </div>

            {/* Logistics Card */}
            <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Logistics Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Pickup Address", value: pickupLocation },
                  { label: "Delivery Address", value: dropLocation },
                  { label: "Scheduled Loading Date", value: loadingDate },
                  { label: "Scheduled Delivery Date", value: deliveryDate },
                  { label: "Vehicle Details", value: vehicleDetails },
                  { label: "Driver / Operator Details", value: driverDetails },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col bg-gray-50 dark:bg-[#0c0e12] p-4 rounded-xl border border-gray-200 dark:border-[#2a2d36]/60">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</span>
                    <span className="text-gray-900 dark:text-white font-semibold mt-1">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Order Context */}
            <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Order Context</h3>
              <div>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Customer Name</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white mt-1 block">{deal.client?.name || deal.buyer_name || "—"}</span>
              </div>
              <div className="border-t border-gray-100 dark:border-[#2a2d36]/80 pt-3">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Supplier</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1 block">{deal.supplier?.name || deal.supplier?.company || "—"}</span>
              </div>
              <div className="border-t border-gray-100 dark:border-[#2a2d36]/80 pt-3">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Contact Person</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1 block">{contactPerson}</span>
              </div>
              <div className="border-t border-gray-100 dark:border-[#2a2d36]/80 pt-3">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Shipment No.</span>
                <span className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400 mt-1 block">{deal.shipmentNumber || `SH-${deal.id}`}</span>
              </div>
            </div>

            {/* Quotation Summary */}
            <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Quotation Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-semibold text-gray-500 tracking-wide">
                  <span>Subtotal Quoted:</span>
                  <span className="font-mono text-gray-900 dark:text-white text-sm">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-gray-500 tracking-wide">
                  <span>GST (18%):</span>
                  <span className="font-mono text-gray-900 dark:text-white text-sm">{formatINR(gstAmount)}</span>
                </div>
                <div className="border-t border-dashed border-gray-200 dark:border-[#2a2d36] pt-3 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="uppercase tracking-wider text-[10px] text-gray-400 font-bold">Total PO Amount</span>
                    <span className="font-mono text-base font-extrabold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">
                      {formatINR(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Associated Documents */}
            <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Associated Documents</h3>
              {isVehicleAllotted ? (
                <div className="space-y-3">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#242830]/50 border border-gray-200 dark:border-[#2a2d36] rounded-xl hover:border-purple-400/40 hover:bg-purple-500/5 dark:hover:bg-[#242830] transition-all group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${doc.type === "PDF" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"}`}>
                          {doc.type}
                        </div>
                        <div
                          onClick={() => { setPdfLabel(doc.name); setPdfUrl(doc.url); setShowPdf(true); }}
                          className="cursor-pointer min-w-0"
                          title="Click to view document"
                        >
                          <p className="text-gray-900 dark:text-white text-xs font-bold group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors hover:underline truncate max-w-[140px]">{doc.name}</p>
                          <p className="text-gray-400 text-[10px] truncate">{doc.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setPdfLabel(doc.name); setPdfUrl(doc.url); setShowPdf(true); }}
                          title="View document"
                          className="p-1 rounded-lg text-purple-500 bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <a href={doc.url} download={doc.name} title="Download" className="p-1 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#242830]/30 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-3 border border-gray-200 dark:border-[#2a2d36]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                    Documents will be available after vehicle allotment
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      <AllotVehicleModal
        deal={allotModalDeal}
        isOpen={isAllotModalOpen}
        onClose={() => setIsAllotModalOpen(false)}
        onAllot={async (allotId, vehicle) => {
          try {
            const res = await api.shipments.updateShipment(allotId, {
              currentStatus: "LOADING",
              vehicleDetails: vehicle.vehicle_no,
              driverDetails: `${vehicle.driver_name || vehicle.owner_name} (${vehicle.phone || vehicle.owner_phone})`
            });
            if (res.success) {
              refreshAll();
              setDeal(prev => ({
                ...prev,
                status: "LOADING",
                vehicleDetails: vehicle.vehicle_no,
                driverDetails: `${vehicle.driver_name || vehicle.owner_name} (${vehicle.phone || vehicle.owner_phone})`
              }));
            }
          } catch (e) {
            console.error("Failed to allot vehicle:", e);
          }
        }}
      />

      <InvoiceEmailModal
        deal={invoiceModalDeal}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}
