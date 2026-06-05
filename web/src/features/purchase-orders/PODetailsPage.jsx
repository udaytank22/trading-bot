import { PODetailsPageSchema1 } from '@config/tableSchemas';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@context';
import { api } from '@services/api';
import { formatINR } from '@services/marginEngine';
import { StatusBadge, DataTable, rowStripeClass, ROW_HOVER_CLS } from '@components/ui';
import POEmailModal from './modals/POEmailModal';
import Swal from 'sweetalert2';
import { generatePOPDF } from './utils/poPdfGenerator';

export default function PODetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { purchaseOrdersData, refreshAll } = useData();

  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  useEffect(() => {
    const found = purchaseOrdersData.find(item => item.id === id || item.po_id === id);
    if (found) {
      setPo(found);
    } else {
      setLoading(true);
      api.purchaseOrders.getPurchaseOrder(id).then(res => {
        if (res.success && res.data) {
          setPo(res.data);
        }
      }).catch(err => {
        console.error('Failed to fetch PO details:', err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [id, purchaseOrdersData]);

  const updatePOStatus = async (poId, status, attachment) => {
    try {
      const payload = { status };
      if (attachment) {
        payload.attachment = attachment;
      }
      const res = await api.purchaseOrders.updatePurchaseOrder(poId, payload);
      if (res.success) {
        refreshAll();
        setPo(prev => prev?.id === poId ? { ...prev, status, ...(attachment ? { attachment } : {}) } : prev);
      }
    } catch (e) {
      console.error("Failed to update PO status:", e);
    }
  };

  const handleDownloadPDF = () => {
    try {
      const doc = generatePOPDF(po);
      doc.save(`PO_${po?.po_id || 'order'}.pdf`);
      
      Swal.fire({
        icon: 'success',
        title: 'PDF Downloaded',
        text: 'Purchase order document downloaded successfully.',
        background: '#1a1d23',
        color: '#fff',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (err) {
      console.error("Failed to download PO PDF:", err);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'An error occurred while generating the PDF.',
        background: '#1a1d23',
        color: '#fff',
        confirmButtonColor: '#8b5cf6'
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Purchase Order not found.</p>
        <button
          onClick={() => navigate('/purchase-orders')}
          className="px-4 py-2 bg-purple-655 hover:bg-purple-600 text-white text-xs font-bold rounded-xl"
        >
          Back to Purchase Orders
        </button>
      </div>
    );
  }

  // Calculations
  const subtotal = po.products?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;
  const totalAmount = po.total_amount || po.amount || (subtotal * 1.18);
  const gstAmount = Math.max(0, totalAmount - subtotal);

  return (
    <div className="w-full animate-in fade-in duration-300 pb-6">
      <div className="max-w-7xl mx-auto py-2 px-2 md:px-4 flex flex-col gap-4">
        
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-[#2a2d36] pb-4 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/purchase-orders')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-55 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider border border-gray-200 dark:border-[#2a2d36] transition-all duration-200 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Purchase Orders
            </button>
            <span className="text-gray-300 dark:text-[#2a2d36] font-light">|</span>
            <span className="font-mono text-gray-955 dark:text-white text-lg font-bold tracking-wide">{po.po_id}</span>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={po.status} />
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-white hover:bg-gray-50 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2a2d36] transition-all shadow-sm"
            >
              Download PDF
            </button>
            {po.status !== "ORDERED" && (
              <button
                onClick={() => setIsEmailModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-purple-600 hover:bg-purple-550 text-white shadow-purple-600/10 transition-all"
              >
                Send PO Email
              </button>
            )}
          </div>
        </div>

        {/* METADATA CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1e2028] p-5 rounded-xl border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Vessel</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{po.vessel}</p>
          </div>
          <div className="bg-white dark:bg-[#1e2028] p-5 rounded-xl border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Date</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {new Date(po.date).toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>
          <div className="bg-white dark:bg-[#1e2028] p-5 rounded-xl border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Amount</p>
            <p className="text-lg font-mono font-bold text-purple-600 dark:text-purple-400">{formatINR(totalAmount)}</p>
          </div>
        </div>

        {/* TWO-COLUMN DETAILS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Order Items */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Order Items Table */}
            <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Order Items ({po.products?.length || 0})</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner">
                <DataTable
                  columns={PODetailsPageSchema1}
                  data={po.products || []}
                  emptyMessage="No items found."
                  renderRow={(item, idx) => (
                    <tr key={idx} className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}>
                      <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + idx + 1}</td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white font-bold">{item.product_name}</td>
                      <td className="px-6 py-4 font-mono text-gray-400">{formatINR(item.unit_price || 0)}</td>
                      <td className="px-6 py-4 font-mono text-gray-900 dark:text-white font-medium">{item.quantity} PCS</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-purple-600 dark:text-purple-450 text-base">{formatINR(item.total_price || 0)}</td>
                    </tr>
                  )}
                />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Sourcing Context & Financial Summary */}
          <div className="space-y-6">
            
            {/* Sourcing Context / Customer Details */}
            <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Sourcing Context</h3>
              <div className="space-y-4">
                <div className="flex flex-col bg-gray-55 dark:bg-[#242830]/30 p-4 rounded-xl border border-gray-250 dark:border-[#2a2d36]">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Customer / Buyer</span>
                  <span className="text-gray-900 dark:text-white font-extrabold text-base mt-1">{po.customer}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col bg-gray-50 dark:bg-[#242830]/30 p-3.5 rounded-xl border border-gray-250 dark:border-[#2a2d36]">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">PO ID</span>
                    <span className="font-mono text-gray-900 dark:text-white font-bold text-xs mt-1">{po.po_id}</span>
                  </div>
                  <div className="flex flex-col bg-gray-50 dark:bg-[#242830]/30 p-3.5 rounded-xl border border-gray-250 dark:border-[#2a2d36]">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Status</span>
                    <span className="text-gray-950 dark:text-white font-bold text-xs mt-1">{po.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-purple-650 dark:text-purple-400 mb-4">Financial Summary</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Subtotal (Excl. Tax)</span>
                  <span className="text-gray-900 dark:text-white font-bold font-mono">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">GST (18%)</span>
                  <span className="text-gray-900 dark:text-white font-bold font-mono">{formatINR(gstAmount)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-dashed border-gray-200 dark:border-[#2a2d36] pt-4 mt-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total (Incl. Tax)</span>
                  <span className="text-purple-600 dark:text-purple-450 font-extrabold font-mono text-base bg-purple-500/10 px-3.5 py-1.5 rounded-xl border border-purple-500/20 shadow-sm">
                    {formatINR(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>



      </div>

      {/* RENDER MODAL FOR EMAIL */}
      <POEmailModal
        po={po}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onStatusUpdate={updatePOStatus}
      />
    </div>
  );
}
