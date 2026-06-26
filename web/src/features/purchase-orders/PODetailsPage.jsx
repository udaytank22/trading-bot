import { PODetailsPageSchema1 } from '@config/tableSchemas';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@context';
import { api } from '@services/api';
import { formatINR } from '@services/marginEngine';
import { StatusBadge, DataTable, rowStripeClass, ROW_HOVER_CLS } from '@components/ui';
import POEmailModal from './modals/POEmailModal';
import MultiPOEmailModal from './modals/MultiPOEmailModal';
import Swal from 'sweetalert2';
import { generatePOPDF, getSourcedSupplierForItem, getSourcedQuoteItemAndSupplier } from './utils/poPdfGenerator';

export default function PODetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isMultiEmailModalOpen, setIsMultiEmailModalOpen] = useState(false);

  useEffect(() => {
    if (typeof id === 'string' && id.startsWith('inq-')) {
      const inqId = parseInt(id.replace('inq-', ''), 10);
      setLoading(true);
      api.purchaseOrders.getPurchaseOrders({ inquiryId: inqId, pageSize: 500 })
        .then(res => {
          if (res.success && res.data && res.data.length > 0) {
            const groupPOs = res.data;
            setPo({
              isGrouped: true,
              id: id,
              poNumber: groupPOs[0].inquiry?.inquiryNumber ? `ORD-${groupPOs[0].inquiry.inquiryNumber}` : `ORD-${inqId}`,
              client: groupPOs[0].client,
              inquiry: groupPOs[0].inquiry,
              createdAt: groupPOs[0].createdAt,
              status: groupPOs[0].status,
              subPOs: groupPOs,
              items: groupPOs.flatMap(p => (p.items || []).map(i => ({ ...i, supplier: p.supplier, originalPoId: p.id, po: p })))
            });
          }
        })
        .catch(err => console.error('Failed to fetch grouped POs:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      api.purchaseOrders.getPurchaseOrder(id)
        .then(res => {
          if (res.success && res.data) setPo(res.data);
        })
        .catch(err => console.error('Failed to fetch PO details:', err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const updatePOStatus = async (poId, status, attachment) => {
    try {
      const payload = { status };
      if (attachment) payload.attachment = attachment;
      const res = await api.purchaseOrders.updatePurchaseOrder(poId, payload);
      if (res.success) {
        setPo(prev => prev?.id === poId ? { ...prev, status, ...(attachment ? { attachment } : {}) } : prev);
      }
    } catch (e) {
      console.error('Failed to update PO status:', e);
    }
  };

  const handleDownloadPDF = () => {
    try {
      const doc = generatePOPDF(po);
      doc.save(`PO_${po?.poNumber || po?.po_id || 'order'}.pdf`);
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: 'PDF Downloaded',
        text: 'Purchase order document downloaded successfully.',
        background: '#1a1d23',
        color: '#fff',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (err) {
      console.error('Failed to download PO PDF:', err);
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
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
        >
          Back to Purchase Orders
        </button>
      </div>
    );
  }

  // ── Field mappings ──────────────────────────────────────────────────
  // Backend returns: poNumber, items[], client{name}, supplier{name},
  //                  inquiry{vessel}, createdAt, amount
  const poNumber = po.poNumber || po.po_id || '—';
  const customer = po.client?.name || po.customer || '—';
  const supplierName = po.supplier?.name || po.supplier || '—';
  const vessel = po.inquiry?.vesselName || po.inquiry?.vessel || po.vessel || '—';
  const poDate = po.createdAt || po.date;

  const itemsSrc = po.items || po.products || [];
  const items = itemsSrc.map(item => ({
    id: item.id,
    description: item.description || item.product?.name || item.product_name || '',
    product: item.product,
    quantity: item.quantity,
    unitPrice: item.unitPrice || item.unit_price || 0,
    totalPrice: item.totalPrice || item.total_price || 0,
    supplier: item.supplier || po.supplier
  }));

  const columns = [
    { key: 'srno', label: 'Sr. No.' },
    { key: "product", label: "Product" },
    { key: "vendor", label: "Vendor" },
    { key: "unitPrice", label: "Unit Price" },
    { key: "quantity", label: "Quantity" },
    { key: "totalPrice", label: "Total Price", className: "text-right" }
  ];

  // ── Calculations ────────────────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.totalPrice ?? item.total_price ?? 0);
    return sum + (isNaN(price) ? 0 : price);
  }, 0);
  const totalAmount = subtotal * 1.18;
  const gstAmount = totalAmount - subtotal;

  const formatDate = (d) => {
    if (!d) return '—';
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  return (
    <div className="w-full animate-in fade-in duration-300 pb-6">
      <div className="max-w-7xl mx-auto py-2 px-2 md:px-4 flex flex-col gap-4">

        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-[#2a2d36] pb-4 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/purchase-orders')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider border border-gray-200 dark:border-[#2a2d36] transition-all duration-200 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Purchase Orders
            </button>
            <span className="text-gray-300 dark:text-[#2a2d36] font-light">|</span>
            <span className="font-mono text-gray-900 dark:text-white text-lg font-bold tracking-wide">{poNumber}</span>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={po.status} />
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-white hover:bg-gray-50 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2a2d36] transition-all shadow-sm"
            >
              Download PDF
            </button>
            {po.status !== 'ORDERED' && !po.isGrouped && hasPermission('purchaseOrders', 'update') && (
              <button
                onClick={() => setIsEmailModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-sm"
              >
                Send PO Email
              </button>
            )}
            {po.isGrouped && po.subPOs && po.subPOs.some(subPo => subPo.status !== 'ORDERED') && hasPermission('purchaseOrders', 'update') && (
              <button
                onClick={() => setIsMultiEmailModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-sm"
              >
                Send All PO Emails
              </button>
            )}
          </div>
        </div>

        {/* METADATA CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1e2028] p-5 rounded-xl border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Vessel</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{vessel}</p>
          </div>
          <div className="bg-white dark:bg-[#1e2028] p-5 rounded-xl border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Date</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatDate(poDate)}</p>
          </div>
          <div className="bg-white dark:bg-[#1e2028] p-5 rounded-xl border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Amount</p>
            <p className="text-lg font-mono font-bold text-purple-600 dark:text-purple-400">{formatINR(totalAmount)}</p>
          </div>
        </div>

        {/* BOTTOM ROW: Sourcing Context & Financial Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Sourcing Context */}
          <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Sourcing Context</h3>
            <div className="space-y-3">
              <div className="flex flex-col bg-gray-50 dark:bg-[#242830]/30 p-4 rounded-xl border border-gray-200 dark:border-[#2a2d36]">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Customer / Buyer</span>
                <span className="text-gray-900 dark:text-white font-extrabold text-base mt-1">{customer}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col bg-gray-50 dark:bg-[#242830]/30 p-3.5 rounded-xl border border-gray-200 dark:border-[#2a2d36]">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">PO ID</span>
                  <span className="font-mono text-gray-900 dark:text-white font-bold text-xs mt-1">{poNumber}</span>
                </div>
                <div className="flex flex-col bg-gray-50 dark:bg-[#242830]/30 p-3.5 rounded-xl border border-gray-200 dark:border-[#2a2d36]">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Status</span>
                  <span className="text-gray-900 dark:text-white font-bold text-xs mt-1">{po.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-4">Financial Summary</h4>
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
                <span className="text-purple-600 dark:text-purple-400 font-extrabold font-mono text-base bg-purple-500/10 px-3.5 py-1.5 rounded-xl border border-purple-500/20 shadow-sm">
                  {formatINR(totalAmount)}
                </span>
              </div>
            </div>
          </div>

        </div>

        {po.isGrouped && po.subPOs && po.subPOs.length > 0 && (
          <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Separate Vendor POs</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner">
              <DataTable
                columns={[
                  { key: 'supplier', label: 'Vendor' },
                  { key: 'poNumber', label: 'PO Number' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'action', label: '', className: 'text-right' }
                ]}
                data={po.subPOs}
                emptyMessage="No vendor POs found."
                renderRow={(subPo, idx) => (
                  <tr key={subPo.id || idx} className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-bold">
                      {subPo.supplier?.name || 'Unknown Supplier'}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-500">
                      {subPo.poNumber}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {formatINR(parseFloat(subPo.amount || 0))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            try {
                              const doc = generatePOPDF(subPo);
                              const blob = doc.output('blob');
                              const url = URL.createObjectURL(blob);
                              window.open(url, '_blank');
                            } catch (err) {
                              console.error('Failed to view subPO PDF:', err);
                              Swal.fire({
                                icon: 'error',
                                title: 'View Failed',
                                text: 'An error occurred while generating the PDF preview.',
                                background: '#1a1d23',
                                color: '#fff',
                                confirmButtonColor: '#8b5cf6'
                              });
                            }
                          }}
                          className="px-3 py-1.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1.5 text-xs font-bold border border-purple-500/20 rounded-lg transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View PO
                        </button>
                        <button
                          onClick={() => {
                            try {
                              const doc = generatePOPDF(subPo);
                              doc.save(`PO_${subPo.poNumber || subPo.po_id || 'order'}.pdf`);
                            } catch (err) {
                              console.error('Failed to download subPO PDF:', err);
                              Swal.fire({
                                icon: 'error',
                                title: 'Download Failed',
                                text: 'An error occurred while generating the PDF.',
                                background: '#1a1d23',
                                color: '#fff',
                                confirmButtonColor: '#8b5cf6'
                              });
                            }
                          }}
                          className="px-3 py-1.5 bg-white dark:bg-[#1a1d23] flex items-center justify-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2a2d33] rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-[#242830] transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              />
            </div>
          </div>
        )}

        {/* ORDER ITEMS - Full Width */}
        <div className="mb-8">
          <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
              Order Items ({items.length})
            </h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner">
              <DataTable
                columns={columns}
                data={items}
                emptyMessage="No items found."
                renderRow={(item, idx) => {
                  const sourcedSupplier = item.supplier || po.supplier;
                  const vendorName = sourcedSupplier?.name || (typeof sourcedSupplier === 'string' ? sourcedSupplier : '—');
                  return (
                    <tr key={idx} className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}>
                      <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{idx + 1}</td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white font-bold">
                        {item.product?.name || item.product_name || item.description || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded">
                          {vendorName}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-400">
                        {formatINR(item.unitPrice || item.unit_price || 0)}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-900 dark:text-white font-medium">
                        {item.quantity} PCS
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-purple-600 dark:text-purple-400 text-base">
                        {formatINR(item.totalPrice || item.total_price || 0)}
                      </td>
                    </tr>
                  );
                }}
              />
            </div>
          </div>
        </div>


      </div>

      <POEmailModal
        po={po._emailModalPo || (!po.isGrouped ? po : null)}
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setPo(prev => ({ ...prev, _emailModalPo: null }));
        }}
        onStatusUpdate={(id, status, attachment) => {
          updatePOStatus(id, status, attachment);
          if (po.isGrouped) {
            setPo(prev => ({
              ...prev,
              subPOs: prev.subPOs.map(sp => sp.id === id ? { ...sp, status } : sp)
            }));
          }
        }}
      />

      <MultiPOEmailModal
        groupedPo={po.isGrouped ? po : null}
        isOpen={isMultiEmailModalOpen}
        onClose={() => setIsMultiEmailModalOpen(false)}
        onStatusUpdate={(id, status, attachment) => {
          updatePOStatus(id, status, attachment);
          setPo(prev => ({
            ...prev,
            subPOs: prev.subPOs.map(sp => sp.id === id ? { ...sp, status } : sp)
          }));
        }}
      />
    </div>
  );
}
