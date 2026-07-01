import React, { useState, useEffect } from "react";
import { api } from '../../../services/api';
import { formatINR } from '@services/marginEngine';
import { DataTable } from '@components/ui';

export default function InvoiceReviewModal({ isOpen, onClose, previewData, onSent }) {
  const [isEditing, setIsEditing] = useState(false);
  const [sendState, setSendState] = useState("idle"); // 'idle' | 'sending' | 'success'
  const [showPdf, setShowPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfSize, setPdfSize] = useState("150 KB");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSendState("idle");
      setIsEditing(false);
      setShowPdf(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let blobUrl = "";
    if (isOpen && previewData) {
      setSubject(previewData.defaultEmailSubject || '');
      setBody(previewData.defaultEmailBody || '');

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

        // Calculate approximate size from base64 string length
        const sizeInBytes = previewData.pdfBase64.length * 0.75;
        const sizeInKB = Math.round(sizeInBytes / 1024);
        setPdfSize(`${sizeInKB} KB`);
      } catch (err) {
        console.error("Failed to load PDF:", err);
      }
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, previewData]);

  const handleSend = async () => {
    setSendState("sending");
    try {
      const res = await api.invoices.sendInvoiceEmail(previewData.invoice.id, { subject, body, toEmail: client.email });
      if (res.success) {
        if (res.data?.emailPreviewUrl) {
          console.log("Email Preview URL:", res.data.emailPreviewUrl);
        }
        setSendState("success");
        setTimeout(() => {
          onSent();
          onClose();
        }, 2500);
      } else {
        setSendState("idle");
      }
    } catch (e) {
      console.error("Failed to send invoice:", e);
      setSendState("idle");
    }
  };

  if (!isOpen || !previewData) return null;

  const invoice = previewData.invoice;
  const client = previewData.client || invoice.client || {};

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 animate-in fade-in duration-300"
        onClick={() => {
          if (sendState === "idle" && !showPdf) onClose();
        }}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl h-full bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl shadow-2xl flex flex-col z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
        {sendState === "success" ? (
          <div className="flex flex-col items-center justify-center p-16 h-full text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Email Sent Successfully!
            </h2>
            <p className="text-gray-400">
              Invoice {invoice.invoiceNumber} has been sent to {client.name}
            </p>
          </div>
        ) : /* ── PDF VIEWER PANEL ── */
          showPdf ? (
            <div
              className="flex flex-col w-full flex-1 h-full"
              style={{ minHeight: 0 }}
            >
              {/* PDF viewer header */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d33] bg-gray-50 dark:bg-[#1a1d23] flex items-center justify-between flex-shrink-0">
                <button
                  onClick={() => setShowPdf(false)}
                  className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to Email
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    PDF Preview
                  </div>
                  <a
                    href={pdfUrl}
                    download={`Invoice_${invoice.invoiceNumber}.pdf`}
                    className="flex items-center gap-1.5 text-xs font-bold text-purple-500 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download
                  </a>
                </div>
              </div>
              {/* PDF Viewer */}
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
                      <a
                        href={pdfUrl}
                        download={`Invoice_${invoice.invoiceNumber}.pdf`}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold"
                      >
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
          ) : (
            /* ── EMAIL COMPOSE VIEW ── */
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                    Send Invoice by Email
                  </h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                    The Invoice will be attached as a PDF document
                  </p>
                </div>
                <button
                  onClick={onClose}
                  disabled={sendState === "sending"}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-2xl leading-none"
                >
                  &times;
                </button>
              </div>

              {/* Email Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-[#0c0e12] custom-scrollbar">
                <div
                  className={`bg-white rounded-xl p-8 text-gray-800 shadow-sm border-2 ${isEditing ? "border-purple-500 shadow-purple-500/10" : "border-transparent"}`}
                >
                  {/* To / Subject */}
                  <div className="space-y-2 mb-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center text-sm">
                      <span className="w-20 text-gray-400 font-bold uppercase text-[10px] py-1">
                        To:
                      </span>
                      {isEditing ? (
                        <span className="font-bold">
                          {client.name} &lt;{client.email}&gt;
                        </span>
                      ) : (
                        <span className="font-bold">
                          {client.name} &lt;{client.email || 'No email provided'}&gt;
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-20 text-gray-400 font-bold uppercase text-[10px] py-1">
                        Subject:
                      </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={subject}
                          onChange={e => setSubject(e.target.value)}
                          className="flex-1 border-b border-gray-200 focus:border-purple-500 outline-none px-1 py-1 font-bold text-gray-800"
                        />
                      ) : (
                        <span className="font-bold">{subject}</span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  {isEditing ? (
                    <textarea
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      className="w-full h-48 border border-gray-200 focus:border-purple-500 rounded-lg outline-none p-3 text-sm text-gray-800 resize-none"
                    ></textarea>
                  ) : (
                    <div className="text-[14px] leading-relaxed space-y-4">
                      {body.split('\n').map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}

                      <div className="py-3">
                        <p className="mb-3 font-semibold text-gray-700">Summary of items included in this invoice:</p>
                        <div className="overflow-hidden border border-gray-200 rounded-xl bg-gray-50/20 shadow-inner">
                          <DataTable
                            columns={[
                              { key: 'description', label: 'Product Description', cellClassName: 'px-4 py-2 font-medium text-gray-900', renderCell: (p) => p.description },
                              { key: 'quantity', label: 'Quantity', cellClassName: 'px-4 py-2 text-center text-gray-600 font-mono w-24', renderCell: (p) => p.quantity },
                              { key: 'unitPrice', label: 'Unit Price', cellClassName: 'px-4 py-2 text-right text-gray-600 font-mono w-28', renderCell: (p) => formatINR(p.unitPrice || 0) },
                              { key: 'totalPrice', label: 'Total Price', cellClassName: 'px-4 py-2 text-right font-semibold text-purple-600 font-mono w-28', renderCell: (p) => formatINR(p.totalPrice || 0) }
                            ]}
                            data={invoice.items || []}
                            emptyMessage="No items in invoice."
                            rowClassName="hover:bg-gray-50/40 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── PDF Attachment Card ── */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                      1 Attachment
                    </p>

                    {/* Clickable card → opens PDF viewer */}
                    <div
                      onClick={() => setShowPdf(true)}
                      className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl w-fit group hover:border-purple-400 hover:shadow-md hover:shadow-purple-500/10 transition-all cursor-pointer select-none"
                    >
                      {/* PDF icon */}
                      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                        <svg
                          className="w-6 h-6 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>

                      {/* File info */}
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-[12px] font-bold text-gray-700 group-hover:text-purple-600 transition-colors">
                          Invoice_{invoice.invoiceNumber}.pdf
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                          {pdfSize} • PDF Document
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        {/* Eye / View button */}
                        <div
                          title="View PDF"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-500 bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </div>
                        {/* Download button — stops propagation so card click isn't fired */}
                        <a
                          href={pdfUrl}
                          download={`Invoice_${invoice.invoiceNumber}.pdf`}
                          onClick={(e) => e.stopPropagation()}
                          title="Download PDF"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit toggle */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-[11px] font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    {isEditing ? "Save Draft" : "Edit Email"}
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t border-gray-200 dark:border-[#2a2d33] flex gap-3 bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={sendState === "sending"}
                  className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-[#2a2d33] text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSend}
                  disabled={sendState === "sending" || isEditing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {sendState === "sending" ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending Invoice...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
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
