import React, { useState } from 'react';
import { api } from '@services/api';
import { formatINR } from '@services/marginEngine';
import Swal from 'sweetalert2';
import { DataTable } from '@components/ui';
import { generateRFQPdf } from '../utils/rfqPdfGenerator';

const EmailDraftCard = ({ rfq, inquiryId, buyerName, allProducts }) => {
  const products = allProducts.filter(p => rfq.products.includes(p.product_name));

  const handleViewRFQ = () => {
    const doc = generateRFQPdf(rfq, inquiryId, buyerName, products);
    window.open(doc.output('bloburl'), '_blank');
  };

  const handleDownloadRFQ = () => {
    const doc = generateRFQPdf(rfq, inquiryId, buyerName, products);
    doc.save(`RFQ_Order_${inquiryId}_${rfq.supplierName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm mb-6">
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Draft for {rfq.supplierName}</span>
        </div>
        <span className="text-[10px] font-medium text-gray-400">Ref: {inquiryId}</span>
      </div>

      <div className="p-6 text-[13px] text-gray-800">
        <div className="space-y-1 mb-6 pb-4 border-b border-gray-100">
          <div className="flex"><span className="w-16 text-gray-400 font-bold uppercase text-[10px]">To:</span> <span className="font-bold">{rfq.supplierName} &lt;{rfq.supplierEmail || 'supplier@trademind.com'}&gt;</span></div>
          <div className="flex"><span className="w-16 text-gray-400 font-bold uppercase text-[10px]">Subject:</span> <span className="font-bold">Request for Quotation - Ref: {inquiryId}</span></div>
        </div>

        <div className="space-y-4 leading-relaxed">
          <p>Dear {rfq.supplierName},</p>
          <p>We are currently sourcing products for an upcoming requirement. Please review the items requested below and provide your best wholesale quotation.</p>

          <div className="my-4">
            <DataTable
              columns={[
                { key: 'product', label: 'Product', cellClassName: 'p-2 border border-gray-200 font-medium', renderCell: (p) => p.product_name },
                { key: 'qty', label: 'Qty', cellClassName: 'p-2 border border-gray-200 text-center', renderCell: (p) => `${p.quantity} ${p.unit}` },
                { key: 'specs', label: 'Specs', cellClassName: 'p-2 border border-gray-200 text-gray-500 italic text-[11px]', renderCell: (p) => p.specs }
              ]}
              data={products}
              emptyMessage="No products."
            />
          </div>

          <p>Looking forward to your prompt response.</p>
          <div className="pt-4 text-gray-500 font-bold text-[11px]">
            TradeMind Sourcing Team
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Attachments:</span>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-500/20 w-fit shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="font-bold text-xs tracking-wide">RFQ_Order_{inquiryId}.pdf</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleViewRFQ}
                className="px-3 py-1.5 text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 border border-purple-200 dark:border-purple-500/20 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View PDF
              </button>
              <button
                onClick={handleDownloadRFQ}
                className="px-3 py-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MultiEmailPreviewModal({ isOpen, onClose, stagedRFQs, inquiryDeal, onStatusUpdate }) {
  const [sendState, setSendState] = useState('idle'); // 'idle', 'sending', 'success'

  if (!isOpen || !inquiryDeal) return null;

  const handleSendAll = async () => {
    const result = await Swal.fire({
      title: "Send All RFQs?",
      text: "This process cannot be reverted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, send all",
      cancelButtonText: "Cancel",
      background: "#fff",
      color: "#000"
    });
    if (!result.isConfirmed) return;

    setSendState('sending');
    try {
      // Dispatch RFQs via backend API
      await api.inquiries.sendRFQ(inquiryDeal.id);

      if (onStatusUpdate) onStatusUpdate(inquiryDeal.inquiry_id, 'RFQ_SENT');

      setSendState('idle');
      onClose();
    } catch (err) {
      setSendState('idle');
      alert("Failed to send some emails. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl w-full max-w-5xl h-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold dark:text-white">Review RFQ Drafts</h2>
            <p className="text-xs text-gray-500 mt-0.5">Prepare to send {stagedRFQs.length} emails</p>
          </div>
          <button onClick={onClose} disabled={sendState === 'sending'} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-100 dark:bg-[#0c0e12]">
          {stagedRFQs.map((rfq, idx) => (
            <EmailDraftCard
              key={idx}
              rfq={rfq}
              inquiryId={inquiryDeal.inquiry_id}
              buyerName={inquiryDeal.buyer_name}
              allProducts={inquiryDeal.products}
            />
          ))}
        </div>

        <div className="p-5 border-t border-gray-200 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0">
          <button
            onClick={onClose}
            disabled={sendState === 'sending'}
            className="px-6 py-2.5 text-gray-400 font-bold text-sm hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSendAll}
            disabled={sendState === 'sending'}
            className="flex items-center gap-2.5 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 active:scale-95"
          >
            {sendState === 'sending' ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending All...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send {stagedRFQs.length} RFQs Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
