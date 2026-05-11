export const mockPurchaseOrders = [
  {
    po_id: "PO-20260510-001",
    customer: "Shree Ganesha Enterprises",
    vessel: "MV Morning Star",
    date: "2026-05-10T10:30:00Z",
    status: "CONFIRMED",
    total_amount: 891250,
    products: [
      { product_name: "Mild Steel Sheets 2mm", quantity: 5000, unit: "kg" },
      { product_name: "Galvanized Iron Pipes", quantity: 1000, unit: "mtr" }
    ],
  },
  {
    po_id: "PO-20260510-002",
    customer: "Om Sai Manufacturing",
    vessel: "Oceanic Voyager",
    date: "2026-05-10T11:15:00Z",
    status: "PENDING",
    total_amount: 288000,
    products: [
      { product_name: "Copper Wires 1.5 sqmm", quantity: 200, unit: "roll" }
    ],
  }
];
