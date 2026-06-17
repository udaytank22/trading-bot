import { InvoicesPageSchema1 } from '@config/tableSchemas';
import { useAuth, useUI, useData } from '@context';
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from '@services/api';
import { usePaginatedFetch } from '@hooks/usePaginatedFetch';

import { PageToolbar, Pagination, Button, StatusBadge, DataTable, rowStripeClass, ROW_HOVER_CLS, DatePicker, Select } from '@components/ui';

export default function InvoicesPage() {
    const { accountsData } = useData();

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
        statuses: 'DELIVERED_TO_VESSEL,CHALLAN_RECEIVED,CLOSED'
    });

    const mappedInvoices = useMemo(() => {
        return (inquiriesData || []).map(inq => {
            const hasInvoices = inq.invoices && inq.invoices.length > 0;
            return {
                id: `inq-${inq.id}`,
                inquiryId: inq.id,
                isGrouped: hasInvoices,
                invoiceNumber: `INQ-${inq.inquiryNumber}`,
                clientName: inq.client?.name || 'Unknown',
                vesselName: inq.vesselName || 'N/A',
                invoiceDate: inq.createdAt,
                status: hasInvoices ? 'GROUPED' : 'PENDING',
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
            <PageToolbar
                search={search}
                onSearchChange={(val) => { setSearch(val); handlePageChange(1); }}
                searchPlaceholder="Search invoices by ID, buyer or cargo..."
            />

            <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden flex flex-col shadow-lg mt-4">
                <DataTable
                    columns={InvoicesPageSchema1}
                    data={mappedInvoices}
                    emptyMessage="No invoices found"
                    renderRow={(inv, idx) => (
                        <tr key={inv.id} className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}>
                            <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{((meta.currentPage ? meta.currentPage : 1) - 1) * (meta.pageSize ? meta.pageSize : 10) + idx + 1}</td>
                            <td className="px-4 py-3 font-mono text-gray-500">{inv.invoiceNumber || inv.id}</td>
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{inv.clientName}</td>
                            <td className="px-4 py-3 text-sm truncate max-w-[250px]" title={inv.vesselName}>{inv.vesselName}</td>
                            <td className="px-4 py-3">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleString('en-GB') : '-'}</td>
                            <td className="px-4 py-3">
                                {inv.isGrouped ? (
                                    inv.invoices.every(i => i.status === 'PAID') ? (
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status="PAID" />
                                            <span className="text-xs text-gray-500 font-medium">
                                                ({inv.invoices.length} Invoices)
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 text-xs font-bold uppercase tracking-wide">
                                            {inv.invoices.length} {inv.invoices.length === 1 ? 'Invoice' : 'Invoices'}
                                        </span>
                                    )
                                ) : (
                                    <span className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-700 text-xs font-bold uppercase tracking-wide">
                                        Pending Invoice
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                                        onClick={() => navigate(`/invoices/${inv.inquiryId}`)}
                                    >
                                        View
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    )}
                />
                <div className="p-4 border-t border-gray-200 dark:border-[#2a2d33]">
                    <Pagination
                        currentPage={meta.currentPage}
                        totalPages={meta.totalPages}
                        totalItems={meta.totalItems}
                        itemsPerPage={meta.pageSize}
                        onPrev={() => handlePageChange(meta.currentPage - 1)}
                        onNext={() => handlePageChange(meta.currentPage + 1)}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handlePageSizeChange}
                        itemLabel="invoices"
                    />
                </div>
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
