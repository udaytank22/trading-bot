import React, { useState, useEffect, useRef } from 'react';
import { api } from '@services/api';
import { calculateMargin, formatINR } from '@services/marginEngine';
import { CONFIG } from '@/config.js';
import Swal from 'sweetalert2';

export default function EmailPreviewModal({ deal, initialEmailType = 'RFQ', isOpen, onClose, onStatusUpdate }) {
  const [activeTab, setActiveTab] = useState(initialEmailType);
  const [isEditing, setIsEditing] = useState(false);
  const [sendState, setSendState] = useState('idle'); // 'idle', 'sending', 'success'
  const bodyRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSendState('idle');
      setIsEditing(false);
      setActiveTab(initialEmailType);
    }
  }, [isOpen, initialEmailType]);

  const handleSend = async () => {
    const result = await Swal.fire({
      title: "Send Email?",
      text: "This process cannot be reverted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, send now",
      cancelButtonText: "Cancel",
      background: "#1a1d23",
      color: "#fff"
    });
    if (!result.isConfirmed) return;

    setSendState('sending');
    const sendPromise = (async () => {
      if (activeTab === 'RFQ') {
        await api.inquiries.sendRFQ(deal.id);
        if (onStatusUpdate) onStatusUpdate(deal.inquiry_id, 'RFQ_SENT');
      } else {
        await api.inquiries.finalVerify(deal.id);
        if (onStatusUpdate) onStatusUpdate(deal.inquiry_id, 'CLIENT_FINAL_APPROVAL');
      }
    })();

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000));

    try {
      await Promise.race([sendPromise, timeoutPromise]);

      setSendState('success');
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (err) {
      setSendState('idle'); // Revert state so they can try again
      window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Failed to send. Please try again.' }));
    }
  };

  if (!isOpen || !deal) return null;

  const isRFQ = activeTab === 'RFQ';
  const formatCurrency = formatINR;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl w-full max-w-5xl h-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

        {sendState === 'success' ? (
          <div className="flex flex-col items-center justify-center p-16 h-full text-center fade-in-fast">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-emerald-500 mb-6 drop-shadow-lg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h2 className="text-white text-3xl font-bold mb-3 tracking-wide">Email Sent Successfully!</h2>
            <p className="text-gray-800 dark:text-gray-300 font-bold text-lg">{deal.buyer_name}</p>
            <p className="text-gray-500 text-sm mb-6 pb-6 border-b border-gray-200 dark:border-[#2a2d36] w-full max-w-[300px] mx-auto">{deal.buyer_email}</p>
            <p className="text-blue-400 text-sm font-bold tracking-wide uppercase bg-blue-500/10 px-4 py-2 rounded-lg">Deal status updated to {isRFQ ? 'RFQ Sent' : 'Quote Sent'}</p>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Review Email Before Sending</h2>
                <p className="text-xs text-gray-500 mt-0.5">Check carefully before approving</p>
              </div>
              <button onClick={onClose} disabled={sendState === 'sending'} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">
                &times;
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="px-6 flex gap-7 border-b border-gray-200 dark:border-[#2a2d33] flex-shrink-0 bg-gray-50 dark:bg-[#1a1d23]">
              <button
                className={`py-3 text-[13px] font-bold tracking-wide relative hover:text-gray-900 dark:hover:text-white transition-colors ${activeTab === 'RFQ' ? 'text-purple-600 dark:text-white' : 'text-gray-500'}`}
                onClick={() => setActiveTab('RFQ')}
              >
                RFQ to Seller
                {activeTab === 'RFQ' && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-purple-500 rounded-t" />}
              </button>
              <button
                className={`py-3 text-[13px] font-bold tracking-wide relative hover:text-gray-900 dark:hover:text-white transition-colors ${activeTab === 'QUOTE' ? 'text-purple-600 dark:text-white' : 'text-gray-500'}`}
                onClick={() => setActiveTab('QUOTE')}
              >
                Quote to Buyer
                {activeTab === 'QUOTE' && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-purple-500 rounded-t" />}
              </button>
            </div>

            {/* Email Preview Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-[#0c0e12] custom-scrollbar">
              <div className={`bg-white dark:bg-[#1e2028] rounded-xl overflow-hidden shadow-sm transition-all border ${isEditing ? 'border-blue-500 shadow-blue-500/20' : 'border-gray-200 dark:border-[#2a2d33]'}`}>

                {/* Meta Attributes */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] bg-gray-50/50 dark:bg-[#242830]/30 space-y-2">
                  <div className="flex items-center text-[13px]">
                    <span className="w-20 text-gray-400 font-bold uppercase tracking-wider text-[10px]">From:</span>
                    <span className="text-gray-900 dark:text-gray-100 font-bold">purchasing@trademind.com</span>
                  </div>
                  <div className="flex items-center text-[13px]">
                    <span className="w-20 text-gray-400 font-bold uppercase tracking-wider text-[10px]">To:</span>
                    <span className="text-gray-900 dark:text-gray-100 font-semibold">{isRFQ ? (deal.seller_quote?.seller_email || 'supplier@tbd.com') : deal.buyer_email}</span>
                  </div>
                  <div className="flex items-center text-[13px]">
                    <span className="w-20 text-gray-400 font-bold uppercase tracking-wider text-[10px]">Subject:</span>
                    <span className="text-gray-900 dark:text-white font-bold">{isRFQ ? `Request for Quotation - Ref: ${deal.inquiry_id}` : `Quotation Details - Ref: ${deal.inquiry_id}`}</span>
                  </div>
                </div>

                {/* Main Body */}
                <div
                  ref={bodyRef}
                  className="p-6 text-gray-800 dark:text-gray-300 leading-[1.7] text-[13px] focus:outline-none min-h-[200px]"
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                >
                  <p className="mb-5 font-medium">
                    Dear {isRFQ ? (deal.seller_quote?.seller_name || 'Valued Supplier') : deal.buyer_name.split(' ')[0]},
                  </p>

                  {isRFQ ? (
                    <p className="mb-5">
                      We hope this email finds you well. We are currently sourcing products for an upcoming requirement.
                      Please review the items requested below and provide your best wholesale quotation including unit prices, minimum order quantities, and estimated lead times.
                    </p>
                  ) : (
                    <p className="mb-5">
                      Thank you for your recent inquiry! We are pleased to offer the following quotation for the requested items. Our team ensures the highest quality standards, resulting in pristine compliance for B2B channels.
                    </p>
                  )}

                  <table className="w-full border-collapse border border-gray-200 dark:border-[#2a2d33] my-6 text-[12px] text-gray-900 dark:text-white shadow-sm font-sans">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-[#0c0e12] text-gray-500 dark:text-gray-400 tracking-wide text-left">
                        <th className="p-3 border border-gray-200 dark:border-[#2a2d33] font-bold">Product</th>
                        {isRFQ ? (
                          <>
                            <th className="p-3 border border-gray-200 dark:border-[#2a2d33] text-center font-bold">Qty</th>
                            <th className="p-3 border border-gray-200 dark:border-[#2a2d33] font-bold">Specs</th>
                          </>
                        ) : (
                          <>
                            <th className="p-3 border border-gray-200 dark:border-[#2a2d33] text-right font-bold">Unit Price</th>
                            <th className="p-3 border border-gray-200 dark:border-[#2a2d33] text-center font-bold">Qty</th>
                            <th className="p-3 border border-gray-200 dark:border-[#2a2d33] text-right font-bold w-[25%]">Total</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {deal.products.map((p, i) => {
                        let myQuoteProd = deal.my_quote?.products?.[i] || deal.calculated_my_quote?.products?.[i];
                        return (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="p-3 border border-gray-200 dark:border-[#2a2d33] font-medium">{p.product_name}</td>
                            {isRFQ ? (
                              <>
                                <td className="p-3 border border-gray-200 dark:border-[#2a2d33] text-center font-mono font-medium">{p.quantity} {p.unit}</td>
                                <td className="p-3 border border-gray-200 dark:border-[#2a2d33] text-gray-500 text-[11px] leading-snug">{p.specs}</td>
                              </>
                            ) : (
                              <>
                                <td className="p-3 border border-gray-200 dark:border-[#2a2d33] text-right font-mono font-medium">{myQuoteProd ? formatCurrency(myQuoteProd.my_unit_price) : 'TBD'}</td>
                                <td className="p-3 border border-gray-200 dark:border-[#2a2d33] text-center font-mono font-medium">{p.quantity} {p.unit}</td>
                                <td className="p-3 border border-gray-200 dark:border-[#2a2d33] text-right font-mono font-bold">{myQuoteProd ? formatCurrency(myQuoteProd.total_my_price || myQuoteProd.total_price) : 'TBD'}</td>
                              </>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {!isRFQ && (
                    <div className="mb-6 bg-gray-50 dark:bg-[#242830] p-5 border-l-[3px] border-purple-500 rounded-r shadow-sm">
                      <p className="font-bold text-[12px] mb-2.5 uppercase tracking-wider text-gray-800 dark:text-gray-200">Payment Terms</p>
                      <ul className="list-disc pl-5 text-[12px] text-gray-600 dark:text-gray-400 space-y-1.5 font-medium">
                        <li>50% advance along with confirmed formal PO.</li>
                        <li>Balance 50% prior to dispatch from our warehouse footprint.</li>
                        <li>Price validity runs strictly 15 days from the date of quotation formulation.</li>
                      </ul>
                    </div>
                  )}

                  <p className="mt-7 mb-8 font-medium">
                    {isRFQ
                      ? 'Looking forward to receiving your prompt response soon.'
                      : 'We look forward to serving you. Please let us know if you need any clarifications on the enclosed proposal.'
                    }
                  </p>

                  <div className="text-[12px] font-bold tracking-wide text-gray-800 dark:text-gray-200 border-t border-gray-200 dark:border-[#2a2d33] pt-4 mt-8 inline-block select-none">
                    TradeMind Sourcing Team<br />
                    <span className="text-gray-500 font-medium mt-1 inline-block">contact@trademind.com | +91-9876543210</span>
                  </div>
                </div>
              </div>

              {/* Edit Mode Handlers */}
              <div className="mt-5 flex justify-end">
                {isEditing ? (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 bg-blue-50 text-blue-600 font-bold border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-sm active:scale-[0.98]"
                  >
                    Done Editing
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-2.5 text-blue-500 font-bold border-2 border-blue-500/50 rounded-lg hover:bg-blue-500/10 transition-colors active:scale-[0.98]"
                  >
                    Edit Email
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="p-5 border-t border-gray-200 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0">
              <button
                onClick={onClose}
                disabled={sendState === 'sending'}
                className="px-6 py-2.5 text-gray-400 font-bold text-sm hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSend}
                disabled={sendState === 'sending' || isEditing}
                className="flex items-center gap-2.5 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 active:scale-95 min-w-[180px] justify-center"
              >
                {sendState === 'sending' ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Now
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(15px) scale(0.96); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
        }
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .animate-fade-in {
          animation: fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .fade-in-fast {
          animation: fade-in 0.3s cubic-bezier(0.2, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
