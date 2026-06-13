import { InvoicesPageSchema1 } from '@config/tableSchemas';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@services/api';
import { formatINR } from '@services/marginEngine';
import { StatusBadge, DataTable, rowStripeClass, ROW_HOVER_CLS, Button } from '@components/ui';
import Swal from 'sweetalert2';
import { generatePOPDF } from '../purchase-orders/utils/poPdfGenerator';
import InquiryInvoiceEmailModal from './modals/InquiryInvoiceEmailModal';
import PaymentModal from './modals/PaymentModal';

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inquiryData, setInquiryData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [challanConfirmed, setChallanConfirmed] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetId, setPaymentTargetId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inqRes, invRes, docRes] = await Promise.all([
        api.inquiries.getInquiry(id),
        api.invoices.getInvoices({ inquiryId: id, paginate: false }),
        api.documents ? api.documents.getDocuments({ entityType: 'INQUIRY', entityId: id }) : Promise.resolve({ success: false })
      ]);

      if (inqRes.success && inqRes.data) {
        setInquiryData(inqRes.data);
        if (inqRes.data.status === 'CHALLAN_RECEIVED' || inqRes.data.currentStatus === 'CHALLAN_RECEIVED') {
          setChallanConfirmed(true);
        }
      }

      if (invRes.success && invRes.data) {
        setInvoices(invRes.data);
      }

      if (docRes && docRes.success && docRes.data) {
        setDocuments(docRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch invoice details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

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
        text: 'An error occurred while downloading the PDF.',
        background: '#1a1d23',
        color: '#fff',
        confirmButtonColor: '#8b5cf6'
      });
    }
  };

  const handleSend = async (invoiceId) => {
    try {
      const res = await api.invoices.updateInvoice(invoiceId, { status: "SENT" });
      if (res.success) {
        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: "SENT" } : inv));
        Swal.fire({
          toast: true, position: 'top-end', icon: 'success',
          title: 'Sent',
          text: 'Invoice marked as sent.',
          background: '#1a1d23',
          color: '#fff',
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (e) {
      console.error("Failed to send invoice:", e);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const hasClientInvoice = invoices.some(inv => !inv.shipmentId);
  const clientInvoice = invoices.find(inv => !inv.shipmentId);
  const supplierInvoices = invoices.filter(inv => inv.shipmentId);

  if (!inquiryData) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Inquiry details not found.</p>
        <button
          onClick={() => navigate('/invoices')}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  const quoteColumns = [
    { key: "product_name", label: "Product" },
    { key: "quantity", label: "Qty" },
    { key: "unit", label: "Unit" },
    { key: "seller_unit_price", label: "Seller Price" },
    { key: "margin_percent", label: "Margin" },
    { key: "discount_percent", label: "Discount" },
    { key: "my_unit_price", label: "Selling Price" },
    { key: "total_price", label: "Total Price" }
  ];

  const poColumns = [
    { key: "poNumber", label: "PO Number" },
    { key: "supplier", label: "Supplier" },
    { key: "date", label: "Date" },
    { key: "actions", label: "Actions", className: "text-right" }
  ];

  const docColumns = [
    { key: "title", label: "Title" },
    { key: "category", label: "Category" },
    { key: "actions", label: "Actions", className: "text-right" }
  ];

  const columns = [
    { key: 'srno', label: 'Sr. No.' },
    { key: "id", label: "Invoice ID" },
    { key: "supplier", label: "Supplier" },
    { key: "amount", label: "Total Amount" },
    { key: "date", label: "Date" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", className: "text-right" }
  ];

  return (
    <div className="w-full animate-in fade-in duration-300 pb-6">
      <div className="max-w-7xl mx-auto py-2 px-2 md:px-4 flex flex-col gap-4">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-[#2a2d36] pb-4 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/invoices')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider border border-gray-200 dark:border-[#2a2d36] transition-all duration-200 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Invoices
            </button>
            <span className="text-gray-300 dark:text-[#2a2d36] font-light">|</span>
            <span className="font-mono text-gray-900 dark:text-white text-lg font-bold tracking-wide">INQ-{inquiryData?.inquiryNumber || inquiryData?.inquiry_id || id}</span>
          </div>

          {!hasClientInvoice ? (
            <div className="flex items-center gap-3">
              <div className="ml-2">
                <StatusBadge status="PENDING_INVOICE" />
              </div>
              {!challanConfirmed ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    Swal.fire({
                      title: 'Confirm Challan Receipt',
                      text: "Are you sure you have received the signed delivery challan?",
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonColor: '#8b5cf6',
                      cancelButtonColor: '#ef4444',
                      confirmButtonText: 'Yes, Received',
                      background: '#1a1d23',
                      color: '#fff'
                    }).then((result) => {
                      if (result.isConfirmed) {
                        api.inquiries.updateInquiry(id, { currentStatus: 'CHALLAN_RECEIVED' })
                          .then(() => {
                            setChallanConfirmed(true);
                            fetchData();
                          })
                          .catch(err => {
                            console.error('Failed to update status', err);
                            Swal.fire({
                              icon: 'error',
                              title: 'Error',
                              text: 'Failed to update challan status.',
                              background: '#1a1d23',
                              color: '#fff',
                            });
                          });
                      }
                    });
                  }}
                >
                  Signed challan received
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => setIsInvoiceModalOpen(true)}
                >
                  Create Invoice
                </Button>
              )}
            </div>
          ) : clientInvoice && (
            <div className="flex items-center gap-3">
              {clientInvoice.status === 'PAID' && (
                <div className="mr-2">
                  <StatusBadge status="PAID" />
                </div>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10"
                onClick={() => handleDownloadPdf(clientInvoice.id, clientInvoice.invoiceNumber || clientInvoice.id)}
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Invoice
              </Button>
              {clientInvoice.status !== 'PAID' && (
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                  onClick={() => setPaymentTargetId(clientInvoice?.id)}
                >
                  Mark as Paid
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="bg-white dark:bg-[#1e2028] p-5 rounded-xl border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Customer</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{inquiryData?.clientName || inquiryData?.buyer_name || 'N/A'}</p>
          </div>
          <div className="bg-white dark:bg-[#1e2028] p-5 rounded-xl border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Vessel</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{inquiryData?.vesselName || 'N/A'}</p>
          </div>
          <div className="bg-white dark:bg-[#1e2028] p-5 rounded-xl border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Invoices</p>
            <p className="text-lg font-mono font-bold text-purple-600 dark:text-purple-400">{supplierInvoices.length}</p>
          </div>
        </div>

        {inquiryData?.my_quote?.products && inquiryData.my_quote.products.length > 0 && (
          <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Quoted Price</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner">
              <DataTable
                columns={quoteColumns}
                data={inquiryData.my_quote.products}
                emptyMessage="No quoted products found."
                renderRow={(prod, idx) => (
                  <tr key={idx} className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{prod.product_name}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono">{prod.quantity}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{prod.unit}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{formatINR(prod.seller_unit_price || 0)}</td>
                    <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400">{prod.margin_percent || 0}%</td>
                    <td className="px-4 py-3 font-mono font-bold text-rose-600 dark:text-rose-400">{prod.discount_percent || 0}%</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatINR(prod.my_unit_price || 0)}</td>
                    <td className="px-4 py-3 font-mono font-bold text-purple-600 dark:text-purple-400">{formatINR(prod.total_price || 0)}</td>
                  </tr>
                )}
              />
            </div>
          </div>
        )}

        {inquiryData?.purchaseOrders && inquiryData.purchaseOrders.length > 0 && (
          <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">PO Details</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner">
              <DataTable
                columns={poColumns}
                data={inquiryData.purchaseOrders}
                emptyMessage="No POs found."
                renderRow={(po, idx) => (
                  <tr key={po.id} className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}>
                    <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">{po.poNumber}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{po.supplier?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(po.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
                        onClick={() => {
                          try {
                            const doc = generatePOPDF(po);
                            doc.save(`PO_${po.poNumber || po.id || 'order'}.pdf`);
                          } catch (err) {
                            console.error('Failed to generate PDF:', err);
                            Swal.fire({
                              icon: 'error',
                              title: 'PDF Generation Failed',
                              text: 'There was an error generating the PO PDF.',
                              background: '#1a1d23',
                              color: '#fff',
                            });
                          }
                        }}
                      >
                        View PDF
                      </Button>
                    </td>
                  </tr>
                )}
              />
            </div>
          </div>
        )}

        {documents && documents.length > 0 && (
          <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Documents</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner">
              <DataTable
                columns={docColumns}
                data={documents}
                emptyMessage="No documents found."
                renderRow={(doc, idx) => (
                  <tr key={doc.id} className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{doc.title}</td>
                    <td className="px-4 py-3 text-gray-500">{doc.category}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                        onClick={() => window.open(doc.filePath, '_blank')}
                      >
                        View Document
                      </Button>
                    </td>
                  </tr>
                )}
              />
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Invoices Breakdown</h3>
          </div>

          {supplierInvoices.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner mt-4">
              <DataTable
                columns={columns}
                data={supplierInvoices}
                emptyMessage="No invoices found."
                renderRow={(inv, idx) => (
                  <tr key={inv.id} className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}>
                    <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-gray-500">{inv.invoiceNumber || inv.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{inv.shipment?.supplier?.name || inv.client?.name || 'Unknown Supplier'}</td>
                    <td className="px-4 py-3 font-mono font-bold text-purple-600 dark:text-purple-400">{formatINR(inv.total || 0)}</td>
                    <td className="px-4 py-3">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status || 'N/A'} />
                      {inv.status === 'PAID' && inv.paymentDetails && (
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
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber || inv.id)}
                      >
                        Download PDF
                      </Button>
                      {inv.status !== "SENT" && inv.status !== "PAID" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSend(inv.id)}
                        >
                          Send
                        </Button>
                      )}
                      {inv.status !== "PAID" && (
                        <Button
                          variant="success"
                          size="sm"
                          className="ml-2"
                          onClick={() => setPaymentTargetId(inv.id)}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </td>
                  </tr>
                )}
              />
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-12 bg-gray-50/50 dark:bg-[#242830]/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 mt-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">No invoices have been generated for this inquiry yet.</p>
            </div>
          )}
        </div>

        {clientInvoice?.status === 'PAID' && clientInvoice?.paymentDetails && (
          <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 bg-gray-50/50 dark:bg-[#242830]/30 rounded-xl p-5 border border-gray-200 dark:border-[#2a2d36]">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Method</p>
                <p className="font-medium text-gray-900 dark:text-white">{clientInvoice.paymentDetails.method || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Date Received</p>
                <p className="font-medium text-gray-900 dark:text-white">{clientInvoice.paymentDetails.date ? new Date(clientInvoice.paymentDetails.date).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Reference No.</p>
                <p className="font-medium font-mono text-purple-600 dark:text-purple-400">{clientInvoice.paymentDetails.reference || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Remarks</p>
                <p className="font-medium text-gray-900 dark:text-white">{clientInvoice.paymentDetails.remarks || 'None'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <InquiryInvoiceEmailModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        inquiry={inquiryData}
        onSuccess={() => {
          setIsInvoiceModalOpen(false);
          fetchData();
        }}
      />

      <PaymentModal
        isOpen={!!paymentTargetId}
        onClose={() => setPaymentTargetId(null)}
        invoiceId={paymentTargetId}
        onSuccess={() => {
          setPaymentTargetId(null);
          fetchData();
        }}
      />
    </div>
  );
}
