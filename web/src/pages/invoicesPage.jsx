import React, { useMemo, useState } from "react";
import { AppContext } from "../context";
import { PageToolbar, Pagination, Button } from "../components/ui";

export default function InvoicesPage() {
    const { invoicesData, setInvoicesData } = React.useContext(AppContext);

    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
    const [paymentForm, setPaymentForm] = useState({ amount: "", date: "", reference: "" });
    const ITEMS_PER_PAGE = 10;

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

    const totalPages = Math.max(1, Math.ceil((filtered?.length || 0) / ITEMS_PER_PAGE));
    const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleSend = (id) => {
        setInvoicesData((prev) =>
            prev.map((inv) => (inv.inquiry_id === id ? { ...inv, invoice_status: "SENT", invoice_date: new Date().toISOString() } : inv)),
        );
    };

    const openPaymentModal = (inv) => {
        const defaultAmount = inv.products?.reduce((s, p) => s + (p.total_price || 0), 0) || "";
        setPaymentForm({ amount: defaultAmount, date: new Date().toISOString().split("T")[0], reference: "" });
        setPaymentModalInvoice(inv);
    };

    const handleMarkPaid = () => {
        if (!paymentModalInvoice) return;
        const id = paymentModalInvoice.inquiry_id;
        setInvoicesData((prev) =>
            prev.map((inv) =>
                inv.inquiry_id === id
                    ? {
                        ...inv,
                        invoice_status: "PAID",
                        payment: {
                            amount: paymentForm.amount,
                            date: paymentForm.date,
                            reference: paymentForm.reference,
                        },
                    }
                    : inv,
            ),
        );
        setPaymentModalInvoice(null);
    };

    return (
        <div className="flex flex-col w-full h-full pb-4">
            <PageToolbar
                search={search}
                onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
                searchPlaceholder="Search invoices by ID, buyer or cargo..."
            />

            <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden flex flex-col shadow-lg">
                <div className="p-4 overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-[#1a1d23] text-gray-400 text-[11px] font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Invoice ID</th>
                                <th className="px-4 py-3">Buyer</th>
                                <th className="px-4 py-3">Cargo</th>
                                <th className="px-4 py-3">Invoice Date</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-[#2a2d36]/50">
                            {currentItems && currentItems.length > 0 ? (
                                currentItems.map((inv) => (
                                    <tr key={inv.inquiry_id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                        <td className="px-4 py-3 font-mono text-gray-500">{inv.inquiry_id}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{inv.buyer_name}</td>
                                        <td className="px-4 py-3">{inv.cargo}</td>
                                        <td className="px-4 py-3">{inv.invoice_date ? new Date(inv.invoice_date).toLocaleString() : '-'}</td>
                                        <td className="px-4 py-3 uppercase text-sm text-gray-600">{inv.invoice_status || 'N/A'}</td>
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
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-gray-400">No invoices found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-[#2a2d33]">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filtered?.length || 0}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        itemLabel="invoices"
                    />
                </div>
            </div>

            {/* Payment Modal */}
            {paymentModalInvoice && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60" onClick={() => setPaymentModalInvoice(null)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-[#1e2028] border border-gray-200 dark:border-[#2a2d36] rounded-xl shadow-2xl p-6 z-10">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Mark Invoice Paid</h3>
                        <p className="text-sm text-gray-500 mb-4">Invoice: {paymentModalInvoice.inquiry_id} • {paymentModalInvoice.buyer_name}</p>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Amount Paid</label>
                                <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} className="w-full mt-2 rounded-lg border px-3 py-2" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Payment Date</label>
                                <input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm((p) => ({ ...p, date: e.target.value }))} className="w-full mt-2 rounded-lg border px-3 py-2" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Reference</label>
                                <input type="text" value={paymentForm.reference} onChange={(e) => setPaymentForm((p) => ({ ...p, reference: e.target.value }))} className="w-full mt-2 rounded-lg border px-3 py-2" />
                            </div>
                        </div>

                        <div className="mt-5 flex gap-3 justify-end">
                            <button onClick={() => setPaymentModalInvoice(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
                            <button onClick={handleMarkPaid} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Mark Paid</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
