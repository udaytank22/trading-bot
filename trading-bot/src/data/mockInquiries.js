export const mockInquiries = [
  {
    inquiry_id: "INQ-20260416-001",
    buyer_name: "Shree Ganesha Enterprises",
    buyer_email: "purchase@shreeganesha.in",
    date_received: "2026-05-10T10:30:00Z",
    status: "CLOSED",
    margin_percent: 15,
    discount_percent: 2,
    admin_approved: true,
    tl_approved: true,
    products: [
      { product_name: "Mild Steel Sheets 2mm", quantity: 5000, unit: "kg", specs: "IS 2062 Grade B" },
      { product_name: "Galvanized Iron Pipes", quantity: 1000, unit: "mtr", specs: "Class C, 4 inch diameter" }
    ],
    seller_quote: {
      seller_name: "Tata Steel Distributors",
      seller_email: "sales@tatasteel-dist.in",
      date_received: "2026-04-16T15:45:00Z",
      products: [
        { product_name: "Mild Steel Sheets 2mm", seller_unit_price: 65, moq: 1000, lead_time: "5 Days" },
        { product_name: "Galvanized Iron Pipes", seller_unit_price: 450, moq: 500, lead_time: "7 Days" }
      ]
    },
    my_quote: {
      products: [
        { product_name: "Mild Steel Sheets 2mm", my_unit_price: 74.75, margin_percent: 15, total_price: 373750 },
        { product_name: "Galvanized Iron Pipes", my_unit_price: 517.50, margin_percent: 15, total_price: 517500 }
      ]
    }
  },
  {
    inquiry_id: "INQ-20260417-002",
    buyer_name: "Om Sai Manufacturing",
    buyer_email: "info@omsaimfg.com",
    date_received: "2026-05-10T11:15:00Z",
    status: "QUOTE_SENT",
    margin_percent: 20,
    discount_percent: 0,
    admin_approved: true,
    tl_approved: true,
    products: [
      { product_name: "Copper Wires 1.5 sqmm", quantity: 200, unit: "roll", specs: "FR Grade, Red" }
    ],
    seller_quote: {
      seller_name: "Polycab Dealers Ltd.",
      seller_email: "orders@polycab-dealers.co.in",
      date_received: "2026-04-18T09:20:00Z",
      products: [
        { product_name: "Copper Wires 1.5 sqmm", seller_unit_price: 1200, moq: 50, lead_time: "3 Days" }
      ]
    },
    my_quote: {
      products: [
        { product_name: "Copper Wires 1.5 sqmm", my_unit_price: 1440, margin_percent: 20, total_price: 288000 }
      ]
    }
  },
  {
    inquiry_id: "INQ-20260418-003",
    buyer_name: "Balaji Impex",
    buyer_email: "procurement@balajiimpex.in",
    date_received: "2026-05-10T14:45:00Z",
    status: "PENDING",
    products: [
      { product_name: "Industrial Safety Helmets", quantity: 500, unit: "pcs", specs: "IS:2925 certified, Yellow" },
      { product_name: "Safety Shoes", quantity: 150, unit: "pair", specs: "Steel toe, PU sole, Size 8-10" }
    ],
    seller_quote: null,
    my_quote: null
  },
  {
    inquiry_id: "INQ-20260419-004",
    buyer_name: "Krishna Engineering Works",
    buyer_email: "contact@krishnaengineering.co.in",
    date_received: "2026-05-09T09:30:00Z",
    status: "CLIENT_QUOTING",
    products: [
      { product_name: "CNC Router Tool Bits", quantity: 50, unit: "pcs", specs: "Carbide tipped, 6mm shank" }
    ],
    seller_quote: null,
    my_quote: null
  },
  {
    inquiry_id: "INQ-20260420-005",
    buyer_name: "Saraswati Textiles",
    buyer_email: "purchase@saraswatitextiles.com",
    date_received: "2026-04-20T16:20:00Z",
    status: "TL_REVIEW",
    products: [
      { product_name: "Cotton Yarn 40s", quantity: 2000, unit: "kg", specs: "Combed, Weaving grade" }
    ],
    seller_quote: {
      seller_name: "Vardhman Spinning",
      seller_email: "sales@vardhman.in",
      date_received: "2026-04-20T18:00:00Z",
      products: [
        { product_name: "Cotton Yarn 40s", seller_unit_price: 280, moq: 1000, lead_time: "Immediately" }
      ]
    },
    my_quote: null
  },
  {
    inquiry_id: "INQ-20260512-011",
    buyer_name: "Global Tech Solutions",
    buyer_email: "procurement@globaltech.com",
    date_received: "2026-05-12T09:00:00Z",
    status: "ADMIN_APPROVAL",
    margin_percent: 10,
    discount_percent: 5,
    tl_approved: true,
    products: [
      { product_name: "Server Racks 42U", quantity: 10, unit: "pcs", specs: "Standard width, black" }
    ],
    seller_quote: {
      seller_name: "Rack Solutions Inc.",
      seller_email: "sales@racksolutions.com",
      date_received: "2026-05-12T10:30:00Z",
      products: [
        { product_name: "Server Racks 42U", seller_unit_price: 45000, moq: 1, lead_time: "2 Weeks" }
      ]
    },
    my_quote: null
  },
  {
    inquiry_id: "INQ-20260512-012",
    buyer_name: "Modern Builders",
    buyer_email: "build@modern.com",
    date_received: "2026-05-12T11:00:00Z",
    status: "EMPLOYEE_VERIFY",
    margin_percent: 12,
    discount_percent: 0,
    tl_approved: true,
    admin_approved: true,
    products: [
      { product_name: "Cement Grade 53", quantity: 1000, unit: "bags", specs: "Standard OPC" }
    ],
    seller_quote: {
      seller_name: "UltraTech Cement",
      seller_email: "sales@ultratech.com",
      date_received: "2026-05-12T12:00:00Z",
      products: [
        { product_name: "Cement Grade 53", seller_unit_price: 380, moq: 100, lead_time: "2 Days" }
      ]
    },
    my_quote: null
  },
  {
    inquiry_id: "INQ-20260512-013",
    buyer_name: "Apex Electronics",
    buyer_email: "sourcing@apex.com",
    date_received: "2026-05-12T14:00:00Z",
    status: "CLIENT_FINAL_APPROVAL",
    margin_percent: 15,
    discount_percent: 2,
    tl_approved: true,
    admin_approved: true,
    products: [
      { product_name: "LED Panels 55\"", quantity: 50, unit: "pcs", specs: "4K resolution" }
    ],
    seller_quote: {
      seller_name: "Samsung Display",
      seller_email: "sales@samsung.com",
      date_received: "2026-05-12T15:00:00Z",
      products: [
        { product_name: "LED Panels 55\"", seller_unit_price: 25000, moq: 10, lead_time: "1 Week" }
      ]
    },
    my_quote: {
      products: [
        { product_name: "LED Panels 55\"", my_unit_price: 28750, margin_percent: 15, total_price: 1437500 }
      ]
    }
  },
  {
    inquiry_id: "INQ-LARGE-001",
    buyer_name: "Mega Infrastructure Ltd.",
    buyer_email: "procurement@megainfra.com",
    date_received: "2026-05-12T16:00:00Z",
    status: "PENDING",
    products: Array.from({ length: 50 }, (_, i) => ({
      product_name: `Component ${String.fromCharCode(65 + (i % 26))}${i + 1}`,
      quantity: Math.floor(Math.random() * 1000) + 100,
      unit: "pcs",
      specs: `Standard specifications for item ${i + 1}`
    })),
    seller_quote: null,
    my_quote: null
  }
];
