import { InvoicesPageSchema1 } from '@config/tableSchemas';
import { useAccounts } from '@hooks/queries';
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from '@services/api';
import { usePaginatedFetch } from '@hooks/usePaginatedFetch';
import { PageToolbar, Pagination, Button, StatusBadge, DataTable, rowStripeClass, ROW_HOVER_CLS, DatePicker, Select } from '@components/ui';
import { HeaderButton } from '../settings/components/shared';

const INVOICE_COLUMNS = [
  { key: "srno", label: "#" },
  { key: "invoice", label: "INVOICE" },
  { key: "client", label: "CLIENT" },
  { key: "vessel", label: "VESSEL" },
  { key: "amount", label: "AMOUNT" },
  { key: "date", label: "DATE" },
  { key: "status", label: "STATUS" },
  { key: "actions", label: "", className: "text-right" }
];

const formatDate = (isoString) => {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch (e) {
    return "—";
  }
};

const formatAmount = (num) => {
  if (num === undefined || num === null) return "—";
  try {
    const parsed = parseFloat(num);
    if (isNaN(parsed)) return "—";
    return "₹" + Math.round(parsed).toLocaleString("en-IN");
  } catch (e) {
    return "—";
  }
};

export default function InvoicesPage() {
    const { data: accountsData } = useAccounts();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
    const [paymentForm, setPaymentForm] = useState({ amount: "", date: "", reference: "", bankAccountId: "", paymentMode: "Bank Transfer" });

    const {
        data: inquiriesData,
        meta,
        loading,
        handlePageChange,
        handlePageSizeChange,
        refresh
    } = usePaginatedFetch(api.inquiries.getInquiries, 1, 10, {
        search,
        statuses: 'DELIVERED_TO_VESSEL,CHALLAN_RECEIVED,CLOSED',
    });

    const mappedInvoices = useMemo(() => {
        return (inquiriesData || []).map(inq => {
            const hasInvoices = inq.invoices && inq.invoices.length > 0;
            const totalAmount = hasInvoices
                ? inq.invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0)
                : inq.items?.reduce((sum, item) => sum + (parseFloat(item.sellingPrice || item.unitPrice || 0) * (item.quantity || 1)), 0)
                || 0;

            let status = 'PENDING';
            if (hasInvoices) {
                if (inq.invoices.every(i => i.status === 'PAID')) {
                    status = 'PAID';
                } else if (inq.invoices.some(i => i.status === 'OVERDUE')) {
                    status = 'OVERDUE';
                } else {
                    status = 'SENT';
                }
            }

            return {
                id: `inq-${inq.id}`,
                inquiryId: inq.id,
                isGrouped: hasInvoices,
                invoiceNumber: inq.invoices?.[0]?.invoiceNumber || `INV-${inq.inquiryNumber || inq.id.slice(-4)}`,
                clientName: inq.client?.name || 'Unknown',
                vesselName: inq.vesselName || 'N/A',
                invoiceDate: inq.invoices?.[0]?.createdAt || inq.createdAt,
                amount: totalAmount,
                status: status,
                invoices: inq.invoices || []
            };
        });
    }, [inquiriesData]);

    const handleSend = async (id) => {
        try {
            const res = await api.invoices.updateInvoice(id, { status: "SENT" });
            if (res.success) {
                refresh();
            }
        } catch (e) {
            console.error("Failed to send invoice:", e);
        }
    };

    const openPaymentModal = (inv) => {
        const defaultAmount = inv.items?.reduce((s, p) => s + (p.totalPrice || 0), 0) || "";
        const defaultBankId = accountsData?.[0]?.id || "";
        setPaymentForm({
            amount: defaultAmount,
            date: new Date().toISOString().split("T")[0],
            reference: "",
            bankAccountId: defaultBankId,
            paymentMode: "Bank Transfer"
        });
        setPaymentModalInvoice(inv);
    };

    const handleMarkPaid = async () => {
        if (!paymentModalInvoice) return;
        try {
            const payload = {
                invoiceId: paymentModalInvoice.id,
                amount: parseFloat(paymentForm.amount),
                paymentDate: paymentForm.date,
                paymentMode: paymentForm.paymentMode,
                bankAccountId: paymentForm.bankAccountId,
                transactionReference: paymentForm.reference,
                notes: `Payment for Invoice ${paymentModalInvoice.invoiceNumber || paymentModalInvoice.id}`
            };

            const res = await api.payments.createPayment(payload);
            if (res.success) {
                setPaymentModalInvoice(null);
                refresh();
            } else {
                console.error("Failed to save payment:", res.message);
            }
        } catch (e) {
            console.error("Failed to mark paid:", e);
        }
    };

    const handleDownloadPdf = async (invoiceId, invoiceNumber) => {
        try {
            const blob = await api.invoices.downloadPdf(invoiceId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Invoice_${invoiceNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download PDF:", err);
            // Ignore error or show alert
        }
    };

    return (
        <div className="flex flex-col w-full h-full pb-4">
            {/* Page Header */}
            <div className="mb-5">
                <h1 className="text-3xl font-serif font-medium text-[#1e293b] dark:text-white tracking-tight">
                    Invoices
                </h1>
                <p className="text-sm font-sans font-medium text-[#64748b] dark:text-gray-400 mt-1">
                    Everything billed and what's still outstanding.
                </p>
            </div>

            <PageToolbar
                search={search}
                onSearchChange={(val) => { setSearch(val); handlePageChange(1); }}
                searchPlaceholder="Search invoice, buyer or cargo..."
                rightSlot={
                    <HeaderButton onClick={() => console.log('Exporting invoices...')}>
                        Export
                    </HeaderButton>
                }
            />

            <div className="flex-1 w-full bg-[#faf8f5] dark:bg-[#1a1d23] border border-[#e6e0d2] dark:border-[#2a2d33] rounded-2xl overflow-hidden flex flex-col shadow-sm mt-4">
                <DataTable
                    columns={INVOICE_COLUMNS}
                    data={mappedInvoices}
                    emptyMessage="No invoices found"
                    renderRow={(inv, idx) => (
                        <tr key={inv.id} className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS} border-b border-[#eee8dd] dark:border-[#2a2d33]`}>
                            <td className="px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">{((meta.currentPage ? meta.currentPage : 1) - 1) * (meta.pageSize ? meta.pageSize : 10) + idx + 1}</td>
                            
                            {/* Monospace teal link for Invoice Number */}
                            <td className="px-5 py-3.5 font-mono text-[#0f6460] dark:text-teal-400 font-medium cursor-pointer hover:underline" onClick={() => navigate(`/invoices/${inv.inquiryId}`)}>
                                {inv.invoiceNumber || inv.id}
                            </td>
                            
                            <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{inv.clientName}</td>
                            <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-medium">{inv.vesselName}</td>
                            <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{formatAmount(inv.amount)}</td>
                            <td className="px-5 py-3.5 text-gray-705 dark:text-gray-300 font-medium">{formatDate(inv.invoiceDate)}</td>
                            
                            <td className="px-5 py-3.5">
                                <StatusBadge status={inv.status} />
                            </td>
                            
                            <td className="px-5 py-3.5 text-right">
                                <span
                                    onClick={() => navigate(`/invoices/${inv.inquiryId}`)}
                                    className="text-[#0f6460] dark:text-teal-400 hover:underline font-bold text-sm cursor-pointer"
                                >
                                    View
                                </span>
                            </td>
                        </tr>
                    )}
                    paginationProps={{
                        currentPage: meta.currentPage,
                        totalPages: meta.totalPages,
                        totalItems: meta.totalItems,
                        itemsPerPage: meta.pageSize,
                        onPrev: () => handlePageChange(meta.currentPage - 1),
                        onNext: () => handlePageChange(meta.currentPage + 1),
                        onPageChange: handlePageChange,
                        onItemsPerPageChange: handlePageSizeChange,
                        itemLabel: "invoices"
                    }}
                />
            </div>

            {/* Payment Modal */}
            {paymentModalInvoice && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
                        onClick={() => setPaymentModalInvoice(null)}
                    />

                    <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-[#2a2d36] dark:bg-[#1a1d23]">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Mark Invoice Paid
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Invoice: {paymentModalInvoice.invoiceNumber || paymentModalInvoice.id} • {paymentModalInvoice.client?.name || 'Unknown Buyer'}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Amount Paid
                                </label>
                                <input
                                    type="number"
                                    value={paymentForm.amount}
                                    onChange={(e) =>
                                        setPaymentForm((p) => ({ ...p, amount: e.target.value }))
                                    }
                                    className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-[#343844] dark:bg-[#0f1117] dark:text-white dark:placeholder:text-gray-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Payment Date
                                </label>
                                <DatePicker
                                    name="date"
                                    value={paymentForm.date}
                                    onChange={(e) =>
                                        setPaymentForm((p) => ({ ...p, date: e.target.value }))
                                    }
                                    className="h-11 border border-gray-300 dark:border-[#343844] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Payment Mode
                                </label>
                                <Select
                                    variant="form"
                                    value={paymentForm.paymentMode}
                                    onChange={(val) =>
                                        setPaymentForm((p) => ({ ...p, paymentMode: val }))
                                    }
                                    options={[
                                        { value: "Bank Transfer", label: "Bank Transfer" },
                                        { value: "Cash", label: "Cash" },
                                        { value: "Cheque", label: "Cheque" },
                                        { value: "Online", label: "Online" }
                                    ]}
                                    className="w-full text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Bank Account
                                </label>
                                <Select
                                    variant="form"
                                    value={paymentForm.bankAccountId}
                                    onChange={(val) =>
                                        setPaymentForm((p) => ({ ...p, bankAccountId: val }))
                                    }
                                    options={accountsData.map(acc => ({
                                        value: acc.id,
                                        label: `${acc.bankName} - ${acc.accountNumber}`
                                    }))}
                                    className="w-full text-gray-900"
                                    placeholder="Select bank account"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Reference
                                </label>
                                <input
                                    type="text"
                                    value={paymentForm.reference}
                                    onChange={(e) =>
                                        setPaymentForm((p) => ({ ...p, reference: e.target.value }))
                                    }
                                    placeholder="Enter payment reference"
                                    className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-[#343844] dark:bg-[#0f1117] dark:text-white dark:placeholder:text-gray-500"
                                />
                            </div>
                        </div>

                        <div className="mt-7 flex justify-end gap-3">
                            <button
                                onClick={() => setPaymentModalInvoice(null)}
                                className="h-10 rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-[#3a3f4b] dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleMarkPaid}
                                className="h-10 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                            >
                                Mark Paid
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
