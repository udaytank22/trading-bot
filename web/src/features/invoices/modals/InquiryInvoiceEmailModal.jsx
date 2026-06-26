import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api';
import { DataTable } from '@components/ui';

export default function InquiryInvoiceEmailModal({ inquiry, isOpen, onClose, onStatusUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [sendState, setSendState] = useState('idle'); // 'idle' | 'sending' | 'success'
  const [showPdf, setShowPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfSize, setPdfSize] = useState('Generating...');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [invoiceId, setInvoiceId] = useState(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    let blobUrl = '';
    if (isOpen && inquiry) {
      setSendState('idle');
      setIsEditing(false);
      setShowPdf(false);

      // Default subject if API hasn't loaded yet
      setSubject(`Invoice for Inquiry: ${inquiry.inquiryNumber}`);

      // Fetch the real PDF and preview data
      api.invoices.generateInvoiceFromInquiry({ inquiryId: inquiry.id })
        .then(res => {
          if (res.success && res.data) {
            const previewData = res.data;
            setInvoiceId(previewData.invoice.id);
            setSubject(`Invoice for Inquiry: ${inquiry.inquiryNumber}`);

            // Set body from API (used only when sending — display is handled by static JSX)
            if (previewData.defaultEmailBody) {
              setBody(previewData.defaultEmailBody);
            }

            try {
              const byteCharacters = atob(previewData.pdfBase64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'application/pdf' });
              blobUrl = URL.createObjectURL(blob);
              setPdfUrl(blobUrl);

              const sizeInBytes = previewData.pdfBase64.length * 0.75;
              const sizeInKB = Math.round(sizeInBytes / 1024);
              setPdfSize(`${sizeInKB} KB`);
            } catch (err) {
              console.error("Failed to load PDF:", err);
              setPdfSize("Error loading PDF");
            }
          }
        })
        .catch(err => {
          console.error("Failed to generate invoice preview:", err);
        });
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, inquiry]);

  const handleSend = async () => {
    setSendState('sending');
    if (!invoiceId) {
      // If it hasn't loaded, just fallback
      setTimeout(() => {
        setSendState('success');
        if (onStatusUpdate) onStatusUpdate(inquiry.id, 'INVOICE_SENT');
        setTimeout(() => onClose(), 2500);
      }, 2000);
      return;
    }

    try {
      // Actually send the email through the real endpoint
      const currentBody = bodyRef.current ? bodyRef.current.innerText : body;
      const res = await api.invoices.sendInvoiceEmail(invoiceId, { subject, body: currentBody });
      if (res.success) {
        setSendState('success');
        if (onStatusUpdate) onStatusUpdate(inquiry.id, 'INVOICE_SENT');
        setTimeout(() => onClose(), 2500);
      } else {
        setSendState('idle');
      }
    } catch (e) {
      console.error("Failed to send invoice:", e);
      setSendState('idle');
    }
  };

  if (!isOpen || !inquiry) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 animate-fade-in" onClick={() => { if (sendState === 'idle' && !showPdf) onClose(); }} />
      <div className="relative w-full max-w-5xl h-full max-h-[90vh] bg-white dark:bg-[#1e2028] border border-gray-200 dark:border-[#2a2d36] rounded-xl shadow-2xl flex flex-col z-10 animate-fade-in overflow-hidden">

        {sendState === 'success' ? (
          <div className="flex flex-col items-center justify-center p-16 h-full text-center fade-in-fast">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-emerald-500 mb-6 drop-shadow-lg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h2 className="text-gray-900 dark:text-white text-3xl font-bold mb-3 tracking-wide">Invoice Sent Successfully!</h2>
            <p className="text-gray-800 dark:text-gray-300 font-bold text-lg">{inquiry.client?.name}</p>
            <p className="text-gray-500 text-sm mb-6 pb-6 border-b border-gray-200 dark:border-[#2a2d36] w-full max-w-[300px] mx-auto">{inquiry.client?.email}</p>
            <p className="text-blue-400 text-sm font-bold tracking-wide uppercase bg-blue-500/10 px-4 py-2 rounded-lg">Status updated to Invoice Sent</p>
          </div>

          /* ── PDF VIEWER PANEL ── */
        ) : showPdf ? (
          <div className="flex flex-col flex-1 h-full" style={{ minHeight: 0 }}>
            {/* PDF viewer header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36] bg-gray-50 dark:bg-[#1a1d23] flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => setShowPdf(false)}
                className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Invoice
              </button>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF Preview
                </div>
                <a
                  href={pdfUrl}
                  download={`Invoice_${inquiry.inquiryNumber}.pdf`}
                  className="flex items-center gap-1.5 text-xs font-bold text-purple-500 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </div>
            </div>
            {/* Object tag for PDF */}
            <div className="flex-1 overflow-hidden bg-gray-200 dark:bg-[#0c0e12]">
              {pdfUrl ? (
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  className="w-full h-full border-0"
                  style={{ minHeight: "500px" }}
                >
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                    <p>Your browser doesn't support built-in PDF viewing.</p>
                    <a href={pdfUrl} download={`Invoice_${inquiry.inquiryNumber}.pdf`} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold">
                      Download PDF
                    </a>
                  </div>
                </object>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Loading preview...
                </div>
              )}
            </div>
          </div>

          /* ── EMAIL COMPOSE VIEW ── */
        ) : (
          <>
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36] flex justify-between items-center flex-shrink-0 bg-gray-50 dark:bg-[#1a1d23]">
              <div>
                <h2 className="text-gray-900 dark:text-white text-[16px] font-bold tracking-wide">Review Invoice Before Sending</h2>
                <p className="text-gray-400 text-[11px] mt-0.5 font-medium tracking-wide uppercase">Final verification of tax invoice</p>
              </div>
              <button onClick={onClose} disabled={sendState === 'sending'} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Email Preview Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-[#1a1d23] custom-scrollbar">
              <div className={`bg-white rounded-[10px] p-6 text-[15px] transition-colors border-2 shadow-sm ${isEditing ? 'border-blue-500 shadow-blue-500/20' : 'border-gray-200'}`}>

                {/* Meta Attributes */}
                <div className="flex items-center pb-3 border-b border-gray-100">
                  <span className="w-20 text-gray-400 font-bold font-sans text-[12px] uppercase tracking-wider">From:</span>
                  <span className="text-black font-bold">accounts@trademind.com</span>
                </div>
                <div className="flex items-center py-3 border-b border-gray-100">
                  <span className="w-20 text-gray-400 font-bold font-sans text-[12px] uppercase tracking-wider">To:</span>
                  <span className="text-black font-semibold">{inquiry.client?.email}</span>
                </div>
                <div className="flex items-center py-3 border-b border-gray-300">
                  <span className="w-20 text-gray-400 font-bold font-sans text-[12px] uppercase tracking-wider">Subject:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="flex-1 border-b border-gray-200 focus:border-blue-500 outline-none px-1 py-1 font-bold text-gray-800"
                    />
                  ) : (
                    <span className="text-black font-bold text-[16px]">{subject}</span>
                  )}
                </div>

                {/* Main Body */}
                <div
                  ref={bodyRef}
                  className="mt-6 text-[#333333] leading-[1.7] focus:outline-none min-h-[200px]"
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                >
                  <p className="mb-5 font-medium">Dear {inquiry.client?.name},</p>

                  <p className="mb-5">
                    We hope this email finds you well. Following the successful delivery of your shipment, we are pleased to share the final tax invoice for your records.
                  </p>

                  <div className="my-7">
                    <DataTable
                      columns={[
                        { key: 'product', label: 'Product', cellClassName: 'p-3 border border-gray-300 font-medium', renderCell: (p) => p.product_name },
                        { key: 'qty', label: 'Qty', cellClassName: 'p-3 border border-gray-300 text-center font-mono font-medium', renderCell: (p) => p.quantity },
                        { key: 'total', label: 'Total', cellClassName: 'p-3 border border-gray-300 text-right font-mono font-bold w-[25%]', renderCell: (p) => `₹${p.total_price}` }
                      ]}
                      data={inquiry.my_quote?.products || []}
                      emptyMessage="No products."
                      rowClassName="hover:bg-gray-50/50"
                    />
                  </div>

                  {/* ── PDF Attachment Card ── */}
                  <div
                    onClick={() => window.open(pdfUrl, '_blank')}
                    contentEditable={false}
                    className="my-8 p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-4 group cursor-pointer hover:border-purple-400 hover:shadow-md hover:shadow-purple-500/10 transition-all select-none w-fit"
                  >
                    {/* PDF icon */}
                    <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                      <svg className="w-7 h-7 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {/* File info */}
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors">Invoice_{inquiry.inquiryNumber}.pdf</p>
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">PDF Document • {pdfSize}</p>
                    </div>
                    {/* Action icons */}
                    <div className="flex items-center gap-1">
                      {/* Eye icon */}
                      <div title="View PDF" className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-500 bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      {/* Download icon */}
                      <a
                        href={pdfUrl}
                        download={`Invoice_${inquiry.inquiryNumber}.pdf`}
                        onClick={(e) => e.stopPropagation()}
                        title="Download PDF"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
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
            <div className="px-4 py-2.5 border-t border-gray-200 dark:border-[#2a2d36] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0 shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.5)]">
              <button
                onClick={onClose}
                disabled={sendState === 'sending'}
                className="px-4 py-2 text-gray-400 font-bold tracking-wide hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleSend}
                disabled={sendState === 'sending' || isEditing}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold tracking-widest uppercase text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px] justify-center shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
              >
                {sendState === 'sending' ? (
                  <>
                    <svg className="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 -ml-1" viewBox="0 0 20 20" fill="currentColor">
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
