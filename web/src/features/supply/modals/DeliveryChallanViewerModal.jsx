import React from 'react';

/**
 * DeliveryChallanViewerModal
 *
 * Displays a generated Delivery Challan PDF in the same inline-viewer
 * style used throughout SupplyDetailsPage.
 *
 * Props:
 *  - isOpen   {boolean}  — controls visibility
 *  - pdfUrl   {string}   — blob URL of the generated PDF
 *  - challanNo {string}  — e.g. "DC-001" shown as the label
 *  - onClose  {function} — called when user clicks Back or presses Escape
 */
export default function DeliveryChallanViewerModal({ isOpen, pdfUrl, challanNo, onClose }) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !pdfUrl) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white dark:bg-[#1e2028]">
      {/* ── Top bar — identical to SupplyDetailsPage inline viewer ── */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36] bg-gray-50 dark:bg-[#1a1d23] flex items-center justify-between flex-shrink-0">
        {/* Back button */}
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Supply Details
        </button>

        {/* Label + Download */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Delivery Challan — {challanNo}
          </div>
          <a
            href={pdfUrl}
            download={`Delivery_Challan_${challanNo}.pdf`}
            className="flex items-center gap-1.5 text-xs font-bold text-purple-500 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
        </div>
      </div>

      {/* ── PDF iframe (fills remaining height) ── */}
      <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-[#0c0e12]">
        <iframe
          src={pdfUrl}
          title="Delivery Challan Preview"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
