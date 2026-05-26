export const mockInvoices = [
    {
        inquiry_id: "INV-1001",
        buyer_name: "BlueWave Cargo",
        buyer_email: "bluewave@example.com",
        cargo: "Industrial Valves",
        invoice_date: "2026-05-12T10:00:00.000Z",
        invoice_status: "SENT",
        products: [
            { product_name: "Industrial Valves", quantity: 80, total_price: 50000 },
        ],
    },
    {
        inquiry_id: "INV-1002",
        buyer_name: "Oceanic Logistics",
        buyer_email: "oceanic@example.com",
        cargo: "Steel Pipes",
        invoice_date: null,
        invoice_status: "DRAFT",
        products: [
            { product_name: "Steel Pipes", quantity: "120 MT", total_price: 120000 },
        ],
    },
];
