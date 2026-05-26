export interface OrderProduct {
  product_name: string;
  quantity: number | string;
  unit?: string;
  total_price?: number;
}

export interface PurchaseOrder {
  po_id: string;
  customer: string;
  vessel: string;
  date: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | string;
  total_amount: number;
  products: OrderProduct[];
}

export interface Invoice {
  inquiry_id: string;
  buyer_name: string;
  buyer_email: string;
  cargo: string;
  invoice_date: string | null;
  invoice_status: 'SENT' | 'DRAFT' | 'PAID' | string;
  products: OrderProduct[];
}

export const mockPurchaseOrders: PurchaseOrder[] = [
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

export const mockInvoices: Invoice[] = [
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
  }
];
