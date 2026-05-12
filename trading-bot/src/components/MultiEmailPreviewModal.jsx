import React, { useState } from 'react';
import { triggerRFQ } from '../services/n8nService';
import { formatINR } from '../services/marginEngine';

const EmailDraftCard = ({ rfq, inquiryId, buyerName, allProducts }) => {
  const products = allProducts.filter(p => rfq.products.includes(p.product_name));

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
          <div className="flex"><span className="w-16 text-gray-400 font-bold uppercase text-[10px]">To:</span> <span className="font-bold">{rfq.supplierName} &lt;supplier@trademind.com&gt;</span></div>
          <div className="flex"><span className="w-16 text-gray-400 font-bold uppercase text-[10px]">Subject:</span> <span className="font-bold">Request for Quotation - Ref: {inquiryId}</span></div>
        </div>

        <div className="space-y-4 leading-relaxed">
          <p>Dear {rfq.supplierName},</p>
          <p>We are currently sourcing products for an upcoming requirement. Please review the items requested below and provide your best wholesale quotation.</p>

          <table className="w-full border-collapse border border-gray-200 my-4 text-[12px]">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-2 border border-gray-200">Product</th>
                <th className="p-2 border border-gray-200 text-center">Qty</th>
                <th className="p-2 border border-gray-200">Specs</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i}>
                  <td className="p-2 border border-gray-200 font-medium">{p.product_name}</td>
                  <td className="p-2 border border-gray-200 text-center">{p.quantity} {p.unit}</td>
                  <td className="p-2 border border-gray-200 text-gray-500 italic text-[11px]">{p.specs}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p>Looking forward to your prompt response.</p>
          <div className="pt-4 text-gray-500 font-bold text-[11px]">
            TradeMind Sourcing Team
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
    setSendState('sending');
    try {
      // Send all RFQs in parallel
      await Promise.all(stagedRFQs.map(() => triggerRFQ(inquiryDeal)));

      if (onStatusUpdate) onStatusUpdate(inquiryDeal.inquiry_id, 'RFQ_SENT');

      setSendState('success');
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      setSendState('idle');
      alert("Failed to send some emails. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1a1d23] border border-[#2a2d33] rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

        {sendState === 'success' ? (
          <div className="flex flex-col items-center justify-center p-16 h-full text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">All RFQs Sent!</h2>
            <p className="text-gray-400">Status updated to RFQ Sent for {inquiryDeal.inquiry_id}</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-[#2a2d33] flex justify-between items-center bg-[#1a1d23] flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">Review RFQ Drafts</h2>
                <p className="text-xs text-gray-500 mt-0.5">Prepare to send {stagedRFQs.length} emails</p>
              </div>
              <button onClick={onClose} disabled={sendState === 'sending'} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#0c0e12]">
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

            <div className="p-5 border-t border-[#2a2d33] flex justify-between items-center bg-[#1a1d23] flex-shrink-0">
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
          </>
        )}
      </div>
    </div>
  );
}
