import React, { useState, useEffect, useRef } from 'react';
import { api } from '@services/api';
import { calculateMargin, formatINR } from '@services/marginEngine';
import { CONFIG } from '@/config.js';
import Swal from 'sweetalert2';
import { DataTable } from '@components/ui';

export default function EmailPreviewModal({ deal, initialEmailType = 'RFQ', isOpen, onClose, onStatusUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [sendState, setSendState] = useState('idle'); // 'idle', 'sending', 'success'
  const bodyRef = useRef(null);

  const handleDownloadPDF = () => {
    import('../utils/quotePdfGenerator.js').then(({ generateQuotePDF }) => {
      const doc = generateQuotePDF(deal);
      doc.save(`Quotation_${deal.inquiry_id}.pdf`);
    });
  };

  const handleViewPDF = () => {
    import('../utils/quotePdfGenerator.js').then(({ generateQuotePDF }) => {
      const doc = generateQuotePDF(deal);
      const pdfBlobUrl = doc.output('bloburl');
      window.open(pdfBlobUrl, '_blank');
    });
  };

  const isRFQ = initialEmailType === 'RFQ';

  const selectedSuppliers = React.useMemo(() => {
    if (!deal) return [];
    
    if (deal.supplierQuotes && deal.supplierQuotes.length > 0) {
      const supplierMap = new Map();
      deal.supplierQuotes.forEach(quote => {
        const selectedItems = (quote.items || []).filter(item => item.isSelected);
        if (selectedItems.length > 0) {
          const id = quote.supplierId || quote.id;
          const name = quote.supplier?.name || quote.supplier_name || 'Unknown';
          const email = quote.supplier?.email || quote.seller_email || 'supplier@tbd.com';
          
          if (!supplierMap.has(email)) {
            supplierMap.set(email, { id, name, email, items: [] });
          }

          const mappedItems = selectedItems.map(si => {
             const origItem = deal.items?.find(ii => ii.id === si.inquiryItemId) || {};
             return {
               product_name: origItem.description || si.product_name,
               quantity: origItem.quantity || si.quantity,
               unit: origItem.unit || si.unit,
               specs: origItem.specs || si.specs,
             }
          });
          
          supplierMap.get(email).items.push(...mappedItems);
        }
      });
      const suppliers = Array.from(supplierMap.values());
      if (suppliers.length > 0) return suppliers;
    }

    return [{
      id: 'default',
      name: deal.seller_quote?.seller_name || 'Valued Supplier',
      email: deal.seller_quote?.seller_email || 'supplier@tbd.com',
      items: deal.products || []
    }];
  }, [deal]);

  useEffect(() => {
    if (isOpen) {
      setSendState('idle');
      setIsEditing(false);
    }
  }, [isOpen]);

  const handleSend = async () => {
    setSendState('sending');
    try {
      if (isRFQ) {
        await api.inquiries.sendRFQ(deal.id);
        if (onStatusUpdate) onStatusUpdate(deal.inquiry_id, 'RFQ_SENT');
      } else {
        await api.inquiries.finalVerify(deal.id);
        if (onStatusUpdate) onStatusUpdate(deal.inquiry_id, 'CLIENT_FINAL_APPROVAL');
      }
      
      setSendState('success');
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Emails have been successfully dispatched.',
        showConfirmButton: false,
        timer: 3000,
        background: '#1a1d23',
        color: '#fff'
      });
      
      setTimeout(() => {
        onClose();
      }, 500);

    } catch (error) {
      console.error("Failed to send emails:", error);
      setSendState('idle');
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Failed to dispatch emails.',
        showConfirmButton: false,
        timer: 3000,
        background: '#1a1d23',
        color: '#fff'
      });
    }
  };

  if (!isOpen || !deal) return null;

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

            {/* Email Preview Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-[#0c0e12] custom-scrollbar">
              {/* Vendor Emails */}
              {isRFQ && (
                <>
                  {selectedSuppliers.map((supp, idx) => (
                    <div key={idx} className={`bg-white dark:bg-[#1e2028] rounded-xl overflow-hidden shadow-sm transition-all border mb-6 ${isEditing ? 'border-blue-500 shadow-blue-500/20' : 'border-gray-200 dark:border-[#2a2d33]'}`}>
                      <div className="bg-gray-50 dark:bg-[#242830]/30 px-6 py-3 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Draft for {supp.name}</span>
                        </div>
                      </div>
                      
                      {/* Meta Attributes */}
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] space-y-2 bg-gray-50/30 dark:bg-[#242830]/20">
                        <div className="flex items-center text-[13px]">
                          <span className="w-20 text-gray-400 font-bold uppercase tracking-wider text-[10px]">From:</span>
                          <span className="text-gray-900 dark:text-gray-100 font-bold">purchasing@trademind.com</span>
                        </div>
                        <div className="flex items-center text-[13px]">
                          <span className="w-20 text-gray-400 font-bold uppercase tracking-wider text-[10px]">To:</span>
                          <span className="text-gray-900 dark:text-gray-100 font-semibold">{supp.email}</span>
                        </div>
                        <div className="flex items-center text-[13px]">
                          <span className="w-20 text-gray-400 font-bold uppercase tracking-wider text-[10px]">Subject:</span>
                          <span className="text-gray-900 dark:text-white font-bold">Request for Quotation - Ref: {deal.inquiry_id}</span>
                        </div>
                      </div>

                      {/* Main Body */}
                      <div
                        className="p-6 text-gray-800 dark:text-gray-300 leading-[1.7] text-[13px] focus:outline-none min-h-[200px]"
                        contentEditable={isEditing}
                        suppressContentEditableWarning={true}
                      >
                        <p className="mb-5 font-medium">Dear {supp.name},</p>
                        <p className="mb-5">
                          We hope this email finds you well. We are currently sourcing products for an upcoming requirement.
                          Please review the items requested below and provide your best wholesale quotation including unit prices, minimum order quantities, and estimated lead times.
                        </p>
                        <div className="my-6">
                          <DataTable
                            columns={[
                              { key: 'product', label: 'Product', cellClassName: 'p-3 border border-gray-200 dark:border-[#2a2d33] font-medium', renderCell: (p) => p.product_name },
                              { key: 'qty', label: 'Qty', cellClassName: 'p-3 border border-gray-200 dark:border-[#2a2d33] text-center font-mono font-medium', renderCell: (p) => `${p.quantity} ${p.unit}` },
                              { key: 'specs', label: 'Specs', cellClassName: 'p-3 border border-gray-200 dark:border-[#2a2d33] text-gray-500 text-[11px] leading-snug', renderCell: (p) => p.specs }
                            ]}
                            data={supp.items}
                            emptyMessage="No products."
                            rowClassName="hover:bg-gray-50/50"
                          />
                        </div>
                        <p className="mt-7 mb-8 font-medium">Looking forward to receiving your prompt response soon.</p>
                        <div className="text-[12px] font-bold tracking-wide text-gray-800 dark:text-gray-200 border-t border-gray-200 dark:border-[#2a2d33] pt-4 mt-8 inline-block select-none">
                          TradeMind Sourcing Team<br />
                          <span className="text-gray-500 font-medium mt-1 inline-block">contact@trademind.com | +91-9876543210</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Buyer Email */}
              {!isRFQ && (
                <div className={`bg-white dark:bg-[#1e2028] rounded-xl overflow-hidden shadow-sm transition-all border ${isEditing ? 'border-blue-500 shadow-blue-500/20' : 'border-gray-200 dark:border-[#2a2d33]'}`}>
                  {/* Meta Attributes */}
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] bg-gray-50/50 dark:bg-[#242830]/30 space-y-2">
                    <div className="flex items-center text-[13px]">
                      <span className="w-20 text-gray-400 font-bold uppercase tracking-wider text-[10px]">From:</span>
                      <span className="text-gray-900 dark:text-gray-100 font-bold">purchasing@trademind.com</span>
                    </div>
                    <div className="flex items-center text-[13px]">
                      <span className="w-20 text-gray-400 font-bold uppercase tracking-wider text-[10px]">To:</span>
                      <span className="text-gray-900 dark:text-gray-100 font-semibold">{deal.buyer_email}</span>
                    </div>
                    <div className="flex items-center text-[13px]">
                      <span className="w-20 text-gray-400 font-bold uppercase tracking-wider text-[10px]">Subject:</span>
                      <span className="text-gray-900 dark:text-white font-bold">Quotation Details - Ref: {deal.inquiry_id}</span>
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
                      Dear {deal.buyer_name.split(' ')[0]},
                    </p>

                    <p className="mb-5">
                      Thank you for your recent inquiry! We are pleased to offer the following quotation for the requested items. Our team ensures the highest quality standards, resulting in pristine compliance for B2B channels.
                    </p>

                    <div className="my-6">
                      <DataTable
                        columns={[
                          { key: 'product', label: 'Product', cellClassName: 'p-3 border border-gray-200 dark:border-[#2a2d33] font-medium', renderCell: (p) => p.product_name },
                          { key: 'unitPrice', label: 'Unit Price', cellClassName: 'p-3 border border-gray-200 dark:border-[#2a2d33] text-right font-mono font-medium', renderCell: (p) => {
                            let myQuoteProd = deal.my_quote?.products?.find(mqp => mqp.product_name === p.product_name) || deal.calculated_my_quote?.products?.find(mqp => mqp.product_name === p.product_name);
                            return myQuoteProd ? formatCurrency(myQuoteProd.my_unit_price) : 'TBD';
                          }},
                          { key: 'qty', label: 'Qty', cellClassName: 'p-3 border border-gray-200 dark:border-[#2a2d33] text-center font-mono font-medium', renderCell: (p) => `${p.quantity} ${p.unit}` },
                          { key: 'total', label: 'Total', cellClassName: 'p-3 border border-gray-200 dark:border-[#2a2d33] text-right font-mono font-bold w-[25%]', renderCell: (p) => {
                            let myQuoteProd = deal.my_quote?.products?.find(mqp => mqp.product_name === p.product_name) || deal.calculated_my_quote?.products?.find(mqp => mqp.product_name === p.product_name);
                            return myQuoteProd ? formatCurrency(myQuoteProd.total_my_price || myQuoteProd.total_price) : 'TBD';
                          }}
                        ]}
                        data={deal.products}
                        emptyMessage="No products."
                        rowClassName="hover:bg-gray-50/50"
                      />
                    </div>

                    <div className="mb-6 bg-gray-50 dark:bg-[#242830] p-5 border-l-[3px] border-purple-500 rounded-r shadow-sm">
                      <p className="font-bold text-[12px] mb-2.5 uppercase tracking-wider text-gray-800 dark:text-gray-200">Payment Terms</p>
                      <ul className="list-disc pl-5 text-[12px] text-gray-600 dark:text-gray-400 space-y-1.5 font-medium">
                        <li>50% advance along with confirmed formal PO.</li>
                        <li>Balance 50% prior to dispatch from our warehouse footprint.</li>
                        <li>Price validity runs strictly 15 days from the date of quotation formulation.</li>
                      </ul>
                    </div>

                    <p className="mt-7 mb-8 font-medium">
                      We look forward to serving you. Please let us know if you need any clarifications on the enclosed proposal.
                    </p>

                    <div className="text-[12px] font-bold tracking-wide text-gray-800 dark:text-gray-200 border-t border-gray-200 dark:border-[#2a2d33] pt-4 mt-8 inline-block select-none">
                      TradeMind Sourcing Team<br />
                      <span className="text-gray-500 font-medium mt-1 inline-block">contact@trademind.com | +91-9876543210</span>
                    </div>
                  </div>

                  {/* Attachment Section */}
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2a2d33] bg-gray-50/50 dark:bg-[#242830]/30 select-none">
                    <p className="font-bold text-[11px] mb-2 uppercase tracking-wider text-gray-500 dark:text-gray-400">Attachments (1)</p>
                    <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-[#2a2d33] rounded-xl w-max bg-white dark:bg-[#1a1d23] hover:shadow-sm transition-all">
                      <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 rounded-lg flex items-center justify-center border border-red-100 dark:border-red-500/20">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex flex-col pr-4">
                        <span className="text-[13px] font-bold text-gray-900 dark:text-white">Quotation_{deal.inquiry_id}.pdf</span>
                        <span className="text-[11px] text-gray-500 font-medium">System Generated • Contains all pricing details</span>
                      </div>
                      <div className="flex items-center gap-2 pl-4 border-l border-gray-200 dark:border-[#2a2d33]">
                        <button onClick={handleViewPDF} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded transition-colors" title="View PDF">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button onClick={handleDownloadPDF} className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded transition-colors" title="Download PDF">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
