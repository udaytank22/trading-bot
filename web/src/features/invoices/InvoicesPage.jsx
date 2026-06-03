import { useAuth, useUI, useData } from '@context';
import React, { useMemo, useState } from "react";
import { api } from '@services/api';

import { PageToolbar, Pagination, Button, StatusBadge, DataTable, rowStripeClass, ROW_HOVER_CLS, DatePicker, Select } from '@components/ui';

export default function InvoicesPage() {
    const { invoicesData, refreshAll, accountsData } = useData();

    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
    const [paymentForm, setPaymentForm] = useState({ amount: "", date: "", reference: "", bankAccountId: "", paymentMode: "Bank Transfer" });
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return invoicesData;
        return invoicesData.filter((inv) =>
            inv.inquiry_id.toLowerCase().includes(q) ||
            (inv.buyer_name && inv.buyer_name.toLowerCase().includes(q)) ||
            (inv.buyer_email && inv.buyer_email.toLowerCase().includes(q)) ||
            (inv.cargo && inv.cargo.toLowerCase().includes(q))
        );
    }, [invoicesData, search]);

    const totalPages = Math.max(1, Math.ceil((filtered?.length || 0) / itemsPerPage));
    const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSend = async (id) => {
        try {
            const res = await api.invoices.updateInvoice(id, { status: "SENT" });
            if (res.success) {
                refreshAll();
            }
        } catch (e) {
            console.error("Failed to send invoice:", e);
        }
    };

    const openPaymentModal = (inv) => {
        const defaultAmount = inv.products?.reduce((s, p) => s + (p.total_price || 0), 0) || "";
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
                refreshAll();
            } else {
                console.error("Failed to save payment:", res.message);
            }
        } catch (e) {
            console.error("Failed to mark paid:", e);
        }
    };

    return (
        <div className="flex flex-col w-full h-full pb-4">
            <PageToolbar
                search={search}
                onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
                searchPlaceholder="Search invoices by ID, buyer or cargo..."
            />

            <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden flex flex-col shadow-lg">
                <DataTable
                    columns={[
                        { key: "id", label: "Invoice ID" },
                        { key: "buyer", label: "Buyer" },
                        { key: "cargo", label: "Cargo" },
                        { key: "date", label: "Invoice Date" },
                        { key: "status", label: "Status" },
                        { key: "actions", label: "Actions", className: "text-right" },
                    ]}
                    data={currentItems}
                    emptyMessage="No invoices found"
                    renderRow={(inv, idx) => (
                        <tr key={inv.inquiry_id} className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}>
                            <td className="px-4 py-3 font-mono text-gray-500">{inv.inquiry_id}</td>
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{inv.buyer_name}</td>
                            <td className="px-4 py-3">{inv.cargo}</td>
                            <td className="px-4 py-3">{inv.invoice_date ? new Date(inv.invoice_date).toLocaleString() : '-'}</td>
                            <td className="px-4 py-3">
                                <StatusBadge status={inv.invoice_status || 'N/A'} />
                            </td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <a
                                        href="/memories/file-sample_150kB.pdf"
                                        download={`Invoice_${inv.inquiry_id}.pdf`}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-500/40 px-3 py-1.5 text-xs font-bold text-purple-400 hover:bg-purple-500/10"
                                    >
                                        Download
                                    </a>

                                    {inv.invoice_status !== 'SENT' && inv.invoice_status !== 'PAID' && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                                            onClick={() => handleSend(inv.inquiry_id)}
                                        >
                                            Send Invoice
                                        </Button>
                                    )}

                                    {inv.invoice_status === 'SENT' && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="border-blue-500/40 text-blue-500 hover:bg-blue-500/10"
                                            onClick={() => openPaymentModal(inv)}
                                        >
                                            Mark Paid
                                        </Button>
                                    )}

                                    {inv.invoice_status === 'PAID' && (
                                        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 text-xs font-bold uppercase tracking-wide">
                                            Paid
                                        </span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )}
                />

                <div className="p-4 border-t border-gray-200 dark:border-[#2a2d33]">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filtered?.length || 0}
                        itemsPerPage={itemsPerPage}
                        onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        onPageChange={(p) => setCurrentPage(p)}
                        onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
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
                                Invoice: {paymentModalInvoice.inquiry_id} • {paymentModalInvoice.buyer_name}
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
