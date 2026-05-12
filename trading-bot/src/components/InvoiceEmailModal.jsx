import React, { useState, useEffect, useRef } from 'react';

export default function InvoiceEmailModal({ deal, isOpen, onClose, onStatusUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [sendState, setSendState] = useState('idle'); // 'idle', 'sending', 'success'
  const bodyRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSendState('idle');
      setIsEditing(false);
    }
  }, [isOpen]);

  const handleSend = () => {
    setSendState('sending');
    // Simulate API call / Verification
    setTimeout(() => {
      setSendState('success');
      if (onStatusUpdate) onStatusUpdate(deal.inquiry_id, 'INVOICE_SENT');
      setTimeout(() => {
        onClose();
      }, 2500);
    }, 2000);
  };

  if (!isOpen || !deal) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70 animate-fade-in" onClick={() => { if (sendState === 'idle') onClose() }} />
      <div className="relative w-[700px] max-h-[85vh] bg-[#1e2028] border border-[#2a2d36] rounded-xl shadow-2xl flex flex-col z-10 animate-fade-in overflow-hidden">

        {sendState === 'success' ? (
          <div className="flex flex-col items-center justify-center p-16 h-full text-center fade-in-fast">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-emerald-500 mb-6 drop-shadow-lg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h2 className="text-white text-3xl font-bold mb-3 tracking-wide">Invoice Sent Successfully!</h2>
            <p className="text-gray-300 font-bold text-lg">{deal.buyer_name}</p>
            <p className="text-gray-500 text-sm mb-6 pb-6 border-b border-[#2a2d36] w-full max-w-[300px] mx-auto">{deal.buyer_email}</p>
            <p className="text-blue-400 text-sm font-bold tracking-wide uppercase bg-blue-500/10 px-4 py-2 rounded-lg">Status updated to Invoice Sent</p>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="p-6 border-b border-[#2a2d36] flex justify-between items-start flex-shrink-0 bg-[#1a1d23]">
              <div>
                <h2 className="text-white text-[20px] font-bold tracking-wide">Review Invoice Before Sending</h2>
                <p className="text-gray-400 text-[13px] mt-1.5 font-medium tracking-wide text-transform uppercase">Final verification of tax invoice</p>
              </div>
              <button onClick={onClose} disabled={sendState === 'sending'} className="text-gray-500 hover:text-white transition-colors disabled:opacity-50 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Email Preview Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#1a1d23] custom-scrollbar">
              <div className={`bg-white rounded-[10px] p-6 text-[15px] transition-colors border-2 shadow-sm ${isEditing ? 'border-blue-500 shadow-blue-500/20' : 'border-gray-200'}`}>

                {/* Meta Attributes */}
                <div className="flex items-center pb-3 border-b border-gray-100">
                  <span className="w-20 text-gray-400 font-bold font-sans text-[12px] uppercase tracking-wider">From:</span>
                  <span className="text-black font-bold">accounts@trademind.com</span>
                </div>
                <div className="flex items-center py-3 border-b border-gray-100">
                  <span className="w-20 text-gray-400 font-bold font-sans text-[12px] uppercase tracking-wider">To:</span>
                  <span className="text-black font-semibold">{deal.buyer_email}</span>
                </div>
                <div className="flex items-center py-3 border-b border-gray-300">
                  <span className="w-20 text-gray-400 font-bold font-sans text-[12px] uppercase tracking-wider">Subject:</span>
                  <span className="text-black font-bold text-[16px]">Tax Invoice - Ref: {deal.inquiry_id} | {deal.cargo}</span>
                </div>

                {/* Main Body */}
                <div
                  ref={bodyRef}
                  className="mt-6 text-[#333333] leading-[1.7] focus:outline-none min-h-[200px]"
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                >
                  <p className="mb-5 font-medium">Dear {deal.buyer_name},</p>
                  
                  <p className="mb-5">
                    We hope this email finds you well. Following the successful delivery of your shipment, we are pleased to share the final tax invoice for your records.
                  </p>

                  <table className="w-full border-collapse border border-gray-300 my-7 text-[14px] text-black shadow-sm font-sans">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 tracking-wide text-left">
                        <th className="p-3 border border-gray-300 font-bold">Product</th>
                        <th className="p-3 border border-gray-300 text-center font-bold">Qty</th>
                        <th className="p-3 border border-gray-300 text-right font-bold w-[25%]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deal.products.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="p-3 border border-gray-300 font-medium">{p.product_name}</td>
                          <td className="p-3 border border-gray-300 text-center font-mono font-medium">{deal.quantity}</td>
                          <td className="p-3 border border-gray-300 text-right font-mono font-bold">₹{p.total_price || '---'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Simulated PDF Attachment */}
                  <div className="my-8 p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-between group cursor-default" contentEditable={false}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-7 h-7 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Invoice_{deal.inquiry_id}.pdf</p>
                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Adobe PDF Document • 1.2 MB</p>
                      </div>
                    </div>
                    <div className="text-purple-600 font-bold text-xs uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                      Attachment Included
                    </div>
                  </div>

                  <p className="mt-7 mb-8 font-medium">
                    Please let us know if you have any questions regarding the invoice or payment process.
                  </p>

                  <div className="text-[14px] font-bold tracking-wide text-gray-800 border-t border-gray-200 pt-4 mt-8 inline-block select-none">
                    TradeMind Accounts Team<br />
                    <span className="text-gray-500 font-medium mt-1 inline-block">accounts@trademind.com | +91-9876543210</span>
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
            <div className="p-5 border-t border-[#2a2d36] flex justify-between items-center bg-[#1a1d23] flex-shrink-0 shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.5)]">
              <button
                onClick={onClose}
                disabled={sendState === 'sending'}
                className="px-6 py-3 text-gray-400 font-bold tracking-wide hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSend}
                disabled={sendState === 'sending' || isEditing}
                className="flex items-center gap-2.5 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold tracking-widest uppercase text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px] justify-center shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
              >
                {sendState === 'sending' ? (
                  <>
                    <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 -ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                    Send Invoice
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
