import React, { useState, useEffect } from 'react';
import { formatINR } from '../services/marginEngine';

export default function POEmailModal({ po, isOpen, onClose, onStatusUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [sendState, setSendState] = useState('idle'); // 'idle', 'sending', 'success'

  useEffect(() => {
    if (isOpen) {
      setSendState('idle');
      setIsEditing(false);
    }
  }, [isOpen]);

  const handleSend = async () => {
    setSendState('sending');
    
    // Simulate API call
    setTimeout(() => {
      if (onStatusUpdate) onStatusUpdate(po.po_id, 'CONFIRMED');
      setSendState('success');
      setTimeout(() => {
        onClose();
      }, 2500);
    }, 1500);
  };

  if (!isOpen || !po) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 animate-in fade-in duration-300" onClick={() => { if (sendState === 'idle') onClose() }} />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#1a1d23] border border-[#2a2d33] rounded-2xl shadow-2xl flex flex-col z-10 animate-in zoom-in-95 duration-200 overflow-hidden">

        {sendState === 'success' ? (
          <div className="flex flex-col items-center justify-center p-16 h-full text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Email Sent Successfully!</h2>
            <p className="text-gray-400">Status updated to Confirmed for {po.po_id}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#2a2d33] flex justify-between items-center bg-[#1a1d23]">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Send Purchase Order by Email</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">The PO will be attached as a PDF document</p>
              </div>
              <button onClick={onClose} disabled={sendState === 'sending'} className="text-gray-400 hover:text-white transition-colors text-2xl leading-none">
                &times;
              </button>
            </div>

            {/* Email Body Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#0c0e12] custom-scrollbar">
              <div className={`bg-white rounded-xl p-8 text-gray-800 shadow-sm border-2 ${isEditing ? 'border-purple-500 shadow-purple-500/10' : 'border-transparent'}`}>
                <div className="space-y-2 mb-6 pb-4 border-b border-gray-100">
                  <div className="flex text-sm"><span className="w-20 text-gray-400 font-bold uppercase text-[10px] py-1">To:</span> <span className="font-bold">{po.customer} &lt;{po.customer.toLowerCase().replace(/\s/g, '.')}@trademind.com&gt;</span></div>
                  <div className="flex text-sm"><span className="w-20 text-gray-400 font-bold uppercase text-[10px] py-1">Subject:</span> <span className="font-bold">Official Purchase Order - {po.po_id}</span></div>
                </div>

                <div className="text-[14px] leading-relaxed space-y-4" contentEditable={isEditing} suppressContentEditableWarning={true}>
                  <p>Dear {po.customer},</p>
                  <p>We are pleased to place the following Purchase Order for the upcoming requirements on vessel <strong>{po.vessel}</strong>.</p>
                  
                  <p><strong>Please find the official Purchase Order document attached to this email as a PDF.</strong></p>

                  <div className="py-2">
                    <p>Summary of items included in this order:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                      {po.products.map((p, i) => (
                        <li key={i}>{p.product_name} - {p.quantity} PCS</li>
                      ))}
                    </ul>
                  </div>

                  <p>Please acknowledge the receipt of this order and confirm the estimated delivery timeline.</p>
                  
                  <div className="pt-6">
                    <p className="font-bold text-gray-900">TradeMind Purchasing Team</p>
                    <p className="text-gray-500 text-xs">contact@trademind.com | +91 98765 43210</p>
                  </div>
                </div>

                {/* PDF Attachment Simulation */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">1 Attachment</p>
                  <div className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl w-fit group hover:border-purple-300 transition-colors cursor-pointer">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="pr-4">
                      <p className="text-[12px] font-bold text-gray-700">{po.po_id}_Document.pdf</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">124 KB • PDF Document</p>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 group-hover:text-purple-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-[11px] font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {isEditing ? "Save Draft" : "Edit Email Body"}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-[#2a2d33] flex gap-3 bg-[#1a1d23] flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={sendState === 'sending'}
                className="px-6 py-2.5 rounded-lg border border-[#2a2d33] text-gray-300 text-sm font-bold hover:bg-white/[0.05] transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSend}
                disabled={sendState === 'sending' || isEditing}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {sendState === 'sending' ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending PDF PO...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Email with PDF
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
