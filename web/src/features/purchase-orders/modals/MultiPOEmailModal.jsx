import React, { useState, useEffect } from "react";
import { formatINR } from '@services/marginEngine';
import { generatePOPDF } from "../utils/poPdfGenerator";
import { DataTable } from '@components/ui';

const POEmailDraftCard = ({ po }) => {
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfSize, setPdfSize] = useState("150 KB");

  useEffect(() => {
    if (po) {
      try {
        const doc = generatePOPDF(po);
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);

        const sizeInKB = Math.round(blob.size / 1024);
        setPdfSize(`${sizeInKB} KB`);

        return () => {
          URL.revokeObjectURL(url);
          setPdfUrl("");
        };
      } catch (err) {
        console.error("Failed to generate PO PDF for draft:", err);
      }
    }
  }, [po]);

  const poNumber = po.poNumber || po.po_id || '—';
  const supplierName = po.supplier?.name || po.supplier || "Supplier";
  const supplierEmail = po.supplier?.email || `${supplierName.toLowerCase().replace(/\s/g, ".")}@trademind.com`;
  const itemsList = po.items || po.products || [];
  
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm mb-6">
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Draft for {supplierName}</span>
        </div>
        <span className="text-[10px] font-medium text-gray-400">PO: {poNumber}</span>
      </div>

      <div className="p-6 text-[13px] text-gray-800">
        <div className="space-y-1 mb-6 pb-4 border-b border-gray-100">
          <div className="flex"><span className="w-16 text-gray-400 font-bold uppercase text-[10px]">To:</span> <span className="font-bold">{supplierName} &lt;{supplierEmail}&gt;</span></div>
          <div className="flex"><span className="w-16 text-gray-400 font-bold uppercase text-[10px]">Subject:</span> <span className="font-bold">Official Purchase Order - {poNumber}</span></div>
        </div>

        <div className="space-y-4 leading-relaxed">
          <p>Dear {supplierName},</p>
          <p>We are pleased to place the following Purchase Order for the upcoming requirements.</p>

          <div className="my-4">
            <DataTable
              columns={[
                { key: 'product', label: 'Product', cellClassName: 'p-2 border border-gray-200 font-medium', renderCell: (p) => p.description || p.product?.name || p.product_name || '—' },
                { key: 'qty', label: 'Qty', cellClassName: 'p-2 border border-gray-200 text-center', renderCell: (p) => `${p.quantity} PCS` },
                { key: 'total', label: 'Total Price', cellClassName: 'p-2 border border-gray-200 text-right font-semibold text-purple-600', renderCell: (p) => formatINR(p.totalPrice || p.total_price || 0) }
              ]}
              data={itemsList}
              emptyMessage="No products."
            />
          </div>

          <p>Please find the official PDF attached to the final email.</p>

          {/* ── PDF Attachment Card ── */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              1 Attachment
            </p>
            <div
              onClick={() => {
                if (pdfUrl) window.open(pdfUrl, '_blank');
              }}
              className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl w-fit group hover:border-purple-400 hover:shadow-md hover:shadow-purple-500/10 transition-all cursor-pointer select-none"
            >
              {/* PDF icon */}
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-[12px] font-bold text-gray-700 group-hover:text-purple-600 transition-colors">
                  {poNumber}_Document.pdf
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                  {pdfSize} • PDF Document
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <div
                  title="View PDF"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-500 bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <a
                  href={pdfUrl}
                  download={`${poNumber}_Document.pdf`}
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
          </div>

        </div>
      </div>
    </div>
  );
};

export default function MultiPOEmailModal({ groupedPo, isOpen, onClose, onStatusUpdate }) {
  const [sendState, setSendState] = useState("idle");

  if (!isOpen || !groupedPo) return null;

  const unsentPOs = (groupedPo.subPOs || []).filter(po => po.status !== 'ORDERED');

  const handleSendAll = () => {
    setSendState("sending");

    setTimeout(() => {
      unsentPOs.forEach(po => {
        let pdfBase64 = null;
        try {
          const doc = generatePOPDF(po);
          pdfBase64 = doc.output('datauristring');
        } catch (err) {
          console.error("Failed to generate base64 PDF for PO", po.id, err);
        }
        if (onStatusUpdate) onStatusUpdate(po.id, "ORDERED", pdfBase64);
      });
      setSendState("idle");
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl w-full max-w-5xl h-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                  Send All Purchase Orders
                </h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                  Prepare to send {unsentPOs.length} PDF documents
                </p>
              </div>
              <button onClick={onClose} disabled={sendState === "sending"} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-2xl leading-none">
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-[#0c0e12] custom-scrollbar">
              {unsentPOs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  All POs have already been ordered.
                </div>
              ) : (
                unsentPOs.map((po, idx) => (
                  <POEmailDraftCard key={idx} po={po} />
                ))
              )}
            </div>

            <div className="px-8 py-5 border-t border-gray-200 dark:border-[#2a2d33] flex gap-3 bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={sendState === "sending"}
                className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-[#2a2d33] text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendAll}
                disabled={sendState === "sending" || unsentPOs.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {sendState === "sending" ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending All POs...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send All {unsentPOs.length} POs
                  </>
                )}
              </button>
            </div>
      </div>
    </div>
  );
}
