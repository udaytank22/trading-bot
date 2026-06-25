import React, { useState } from 'react';
import { Modal } from '@components/ui';
import { api } from '@services/api';
import Swal from 'sweetalert2';

export default function PaymentModal({ isOpen, onClose, invoiceId, inquiryId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    method: 'Bank Transfer',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    remarks: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    // Modal component calls preventDefault
    setLoading(true);
    try {
      const res = await api.invoices.updateInvoice(invoiceId, { 
        status: "PAID",
        paymentDetails: formData
      });
      if (res.success) {
        // Also close the inquiry when the client invoice is marked paid
        if (inquiryId) {
          try {
            await api.inquiries.updateInquiry(inquiryId, { currentStatus: 'CLOSED' });
          } catch (err) {
            console.error('Failed to update inquiry status to CLOSED:', err);
          }
        }
        Swal.fire({
          toast: true, position: 'top-end', icon: 'success',
          title: 'Paid & Closed',
          text: 'Invoice marked as paid and inquiry closed.',
          background: '#1a1d23',
          color: '#fff',
          showConfirmButton: false,
          timer: 2000
        });
        onSuccess(formData);
        onClose();
      }
    } catch (error) {
      console.error("Failed to mark invoice as paid:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to record payment.',
        background: '#1a1d23',
        color: '#fff',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Record Payment Details" 
      maxWidthClass="max-w-xl"
      submitLabel={loading ? 'Recording...' : 'Record Payment'}
      cancelLabel="Cancel"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-4 text-left p-1">
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Payment Method</label>
          <select 
            name="method"
            value={formData.method}
            onChange={handleChange}
            className="w-full bg-white dark:bg-[#1e2028] border border-gray-200 dark:border-[#2a2d36] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors shadow-sm"
          >
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Date Received</label>
          <input 
            type="date" 
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full bg-white dark:bg-[#1e2028] border border-gray-200 dark:border-[#2a2d36] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors shadow-sm" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Reference No. (UTR/Cheque No)</label>
          <input 
            type="text" 
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            placeholder="Enter reference number..." 
            className="w-full bg-white dark:bg-[#1e2028] border border-gray-200 dark:border-[#2a2d36] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors shadow-sm" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Remarks (Optional)</label>
          <textarea 
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            rows="2" 
            className="w-full bg-white dark:bg-[#1e2028] border border-gray-200 dark:border-[#2a2d36] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors resize-none shadow-sm"
          ></textarea>
        </div>
      </div>
    </Modal>
  );
}
