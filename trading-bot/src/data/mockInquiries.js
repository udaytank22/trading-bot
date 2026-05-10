export const mockInquiries = [
  {
    inquiry_id: "INQ-20260416-001",
    buyer_name: "Shree Ganesha Enterprises",
    buyer_email: "purchase@shreeganesha.in",
    date_received: "2026-05-10T10:30:00Z",
    status: "CLOSED",
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
    seller_quote: {
      seller_name: "Karam Safety Solutions",
      seller_email: "wholesale@karam.in",
      date_received: "2026-04-19T10:00:00Z",
      products: [
        { product_name: "Industrial Safety Helmets", seller_unit_price: 150, moq: 100, lead_time: "7 Days" },
        { product_name: "Safety Shoes", seller_unit_price: 650, moq: 50, lead_time: "10 Days" }
      ]
    },
    my_quote: null
  },
  {
    inquiry_id: "INQ-20260419-004",
    buyer_name: "Krishna Engineering Works",
    buyer_email: "contact@krishnaengineering.co.in",
    date_received: "2026-05-09T09:30:00Z",
    status: "PENDING",
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
    status: "CLOSED",
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
    my_quote: {
      products: [
        { product_name: "Cotton Yarn 40s", my_unit_price: 308, margin_percent: 10, total_price: 616000 }
      ]
    }
  },
  {
    inquiry_id: "INQ-20260420-006",
    buyer_name: "Prakash Industrial Supplies",
    buyer_email: "rfq@prakashsupplies.in",
    date_received: "2026-05-08T11:05:00Z",
    status: "PENDING",
    products: [
      { product_name: "PTFE Thread Seal Tape", quantity: 1000, unit: "roll", specs: "12mm x 0.075mm x 10m" },
      { product_name: "Ball Valves 1 inch", quantity: 200, unit: "pcs", specs: "SS 316, threaded end" }
    ],
    seller_quote: null,
    my_quote: null
  },
  {
    inquiry_id: "INQ-20260421-007",
    buyer_name: "Venkateswara Metals",
    buyer_email: "admin@vmetals.in",
    date_received: "2026-04-21T10:10:00Z",
    status: "QUOTE_SENT",
    products: [
      { product_name: "Aluminium Extrusion Profiles", quantity: 500, unit: "kg", specs: "6063 T6 Alloy, architectural" },
      { product_name: "Aluminium Checkered Plates", quantity: 1500, unit: "kg", specs: "3mm thickness, 5 bar pattern" }
    ],
    seller_quote: {
      seller_name: "Hindalco Authorized Dist",
      seller_email: "orders@hindalcodist.com",
      date_received: "2026-04-21T14:30:00Z",
      products: [
        { product_name: "Aluminium Extrusion Profiles", seller_unit_price: 240, moq: 200, lead_time: "15 Days" },
        { product_name: "Aluminium Checkered Plates", seller_unit_price: 260, moq: 500, lead_time: "10 Days" }
      ]
    },
    my_quote: {
      products: [
        { product_name: "Aluminium Extrusion Profiles", my_unit_price: 276, margin_percent: 15, total_price: 138000 },
        { product_name: "Aluminium Checkered Plates", my_unit_price: 299, margin_percent: 15, total_price: 448500 }
      ]
    }
  },
  {
    inquiry_id: "INQ-20260421-008",
    buyer_name: "Shiv Shakti Hardware",
    buyer_email: "shivshakti@hardware.in",
    date_received: "2026-04-21T15:55:00Z",
    status: "RFQ_SENT",
    products: [
      { product_name: "SS 304 Fasteners Hex Bolt", quantity: 10000, unit: "pcs", specs: "M10 x 50mm" }
    ],
    seller_quote: {
      seller_name: "Pooja Forge array",
      seller_email: "sales@poojaforge.net",
      date_received: "2026-04-22T08:15:00Z",
      products: [
        { product_name: "SS 304 Fasteners Hex Bolt", seller_unit_price: 18, moq: 5000, lead_time: "2 Days" }
      ]
    },
    my_quote: null
  },
  {
    inquiry_id: "INQ-20260422-009",
    buyer_name: "Rameshwar Distributors",
    buyer_email: "orders@rameshwardist.com",
    date_received: "2026-04-22T09:45:00Z",
    status: "PENDING",
    products: [
      { product_name: "Packaging Tape 2 inch", quantity: 5000, unit: "roll", specs: "BOPP, Brown, 65 meters" },
      { product_name: "Corrugated Boxes", quantity: 2000, unit: "pcs", specs: "3-ply, 12x12x12 inches" },
      { product_name: "Stretch Film", quantity: 200, unit: "roll", specs: "23 micron, 500mm x 300m" }
    ],
    seller_quote: null,
    my_quote: null
  },
  {
    inquiry_id: "INQ-20260422-010",
    buyer_name: "Tirupati Associates",
    buyer_email: "sourcing@tirupatiassociates.in",
    date_received: "2026-04-22T14:10:00Z",
    status: "CLOSED",
    products: [
      { product_name: "Nitrile Inspection Gloves", quantity: 1000, unit: "box", specs: "Powder-free, Blue, Size M" }
    ],
    seller_quote: {
      seller_name: "Kanam Latex",
      seller_email: "bulk@kanamlatex.com",
      date_received: "2026-04-22T15:30:00Z",
      products: [
        { product_name: "Nitrile Inspection Gloves", seller_unit_price: 350, moq: 100, lead_time: "Ready Stock" }
      ]
    },
    my_quote: {
      products: [
        { product_name: "Nitrile Inspection Gloves", my_unit_price: 420, margin_percent: 20, total_price: 420000 }
      ]
    }
  }
];
