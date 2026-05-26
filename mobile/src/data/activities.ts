export interface InquiryProduct {
  product_name: string;
  quantity: number;
  unit: string;
  specs: string;
}

export interface SellerQuoteProduct {
  product_name: string;
  seller_unit_price: number;
  moq: number;
  lead_time: string;
}

export interface SellerQuote {
  seller_name: string;
  seller_email: string;
  date_received: string;
  products: SellerQuoteProduct[];
}

export interface MyQuoteProduct {
  product_name: string;
  my_unit_price: number;
  margin_percent: number;
  total_price: number;
}

export interface MyQuote {
  products: MyQuoteProduct[];
}

export interface Inquiry {
  inquiry_id: string;
  buyer_name: string;
  buyer_email: string;
  vessel_name: string;
  vessel_ref: string;
  date_received: string;
  status: 'PENDING' | 'RFQ_SENT' | 'RFQ_RECEIVED' | 'QUOTE_SENT' | 'RFQ_READY' | 'CLIENT_QUOTING' | 'TL_REVIEW' | 'ADMIN_APPROVAL' | 'EMPLOYEE_VERIFY' | 'CONFIRMED' | string;
  margin_percent: number;
  discount_percent: number;
  admin_approved: boolean;
  tl_approved: boolean;
  products: InquiryProduct[];
  seller_quote: SellerQuote | null;
  my_quote: MyQuote | null;
}

export interface SupplyItem {
  inquiry_id: string;
  supplier: string;
  buyer_name: string;
  buyer_email: string;
  cargo: string;
  quantity: string;
  destination: string;
  status: 'PENDING' | 'LOADING' | 'IN_TRANSIT' | 'DELIVERED' | string;
  date: string;
  products: { product_name: string }[];
  vehicle?: string;
  driver?: string;
  driverPhone?: string;
}

export interface TodoItem {
  id: number;
  title: string;
  time: string;
  location: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  date: string;
  completed?: boolean;
}

export const mockInquiries: Inquiry[] = [
  {
    inquiry_id: "OM-ENQ-26-02131",
    buyer_name: "HK LINE CO.LTD",
    buyer_email: "procurement@hk.com",
    vessel_name: "HAPPY FOUNDER",
    vessel_ref: "HKL-09-05",
    date_received: "2026-05-08T05:22:27.999Z",
    status: "QUOTE_SENT",
    margin_percent: 15,
    discount_percent: 2,
    admin_approved: true,
    tl_approved: true,
    products: [
      {
        product_name: "Cylinder Liner for Yanmar 6EY18AL",
        quantity: 2,
        unit: "pcs",
        specs: "Marine Grade Standard"
      }
    ],
    seller_quote: {
      seller_name: "Yanmar Marine Supplies Ltd",
      seller_email: "parts@yanmarmarine.com",
      date_received: "2026-05-08T07:22:27.999Z",
      products: [
        {
          product_name: "Cylinder Liner for Yanmar 6EY18AL",
          seller_unit_price: 1200,
          moq: 1,
          lead_time: "2 Days"
        }
      ]
    },
    my_quote: {
      products: [
        {
          product_name: "Cylinder Liner for Yanmar 6EY18AL",
          my_unit_price: 1352.4,
          margin_percent: 15,
          total_price: 2704.8
        }
      ]
    }
  },
  {
    inquiry_id: "OM-ENQ-26-02130",
    buyer_name: "Avinya Ship Management LLC",
    buyer_email: "procurement@avinya.com",
    vessel_name: "ASPHALT ALLIANCE",
    vessel_ref: "FR/CPM/CH-08 / 11",
    date_received: "2026-05-07T07:27:56.000Z",
    status: "RFQ_READY",
    margin_percent: 15,
    discount_percent: 0,
    admin_approved: false,
    tl_approved: false,
    products: [
      {
        product_name: "Gasket Set for Cylinder Head",
        quantity: 5,
        unit: "set",
        specs: "Non-asbestos High-temp"
      },
      {
        product_name: "Main Engine Fuel Injection Valve",
        quantity: 10,
        unit: "pcs",
        specs: "MAN B&W 6S50MC"
      }
    ],
    seller_quote: null,
    my_quote: null
  },
  {
    inquiry_id: "OM-ENQ-26-02129",
    buyer_name: "AKIJ SHIPPING LINE LTD",
    buyer_email: "procurement@akij.com",
    vessel_name: "AKIJ PEARL",
    vessel_ref: "APL-EN-EL-1468",
    date_received: "2026-05-06T07:23:49.000Z",
    status: "PENDING",
    margin_percent: 15,
    discount_percent: 2,
    admin_approved: false,
    tl_approved: false,
    products: [
      {
        product_name: "Main Engine Fuel Injection Valve",
        quantity: 8,
        unit: "pcs",
        specs: "MAN B&W 6S50MC"
      },
      {
        product_name: "Cargo Hose 4 inch 15m",
        quantity: 13,
        unit: "pcs",
        specs: "Max Pressure 15 Bar"
      }
    ],
    seller_quote: null,
    my_quote: null
  },
  {
    inquiry_id: "OM-ENQ-26-02128",
    buyer_name: "AKIJ SHIPPING LINE LTD",
    buyer_email: "procurement@akij.com",
    vessel_name: "AKIJ PEARL",
    vessel_ref: "APL-DK-ST-1476",
    date_received: "2026-05-06T07:21:12.000Z",
    status: "CLIENT_QUOTING",
    margin_percent: 15,
    discount_percent: 0,
    admin_approved: false,
    tl_approved: false,
    products: [
      {
        product_name: "Cargo Hose 4 inch 15m",
        quantity: 11,
        unit: "pcs",
        specs: "Max Pressure 15 Bar"
      }
    ],
    seller_quote: {
      seller_name: "Danfoss Industrial India",
      seller_email: "support@danfoss.in",
      date_received: "2026-05-06T09:21:12.000Z",
      products: [
        {
          product_name: "Cargo Hose 4 inch 15m",
          seller_unit_price: 380,
          moq: 1,
          lead_time: "5 Days"
        }
      ]
    },
    my_quote: null
  },
  {
    inquiry_id: "OM-ENQ-26-02127",
    buyer_name: "AKIJ SHIPPING LINE LTD",
    buyer_email: "procurement@akij.com",
    vessel_name: "AKIJ PEARL",
    vessel_ref: "APL-EN-EL-1474",
    date_received: "2026-05-06T07:09:15.000Z",
    status: "TL_REVIEW",
    margin_percent: 15,
    discount_percent: 2,
    admin_approved: false,
    tl_approved: false,
    products: [
      {
        product_name: "Anchor Chain Link 28mm",
        quantity: 14,
        unit: "mtr",
        specs: "Grade U3 Stud Link"
      }
    ],
    seller_quote: {
      seller_name: "Rexroth Hydraulics Corp",
      seller_email: "supplies@rexroth-hydraulic.de",
      date_received: "2026-05-06T09:09:15.000Z",
      products: [
        {
          product_name: "Anchor Chain Link 28mm",
          seller_unit_price: 85,
          moq: 1,
          lead_time: "2 Days"
        }
      ]
    },
    my_quote: null
  },
  {
    inquiry_id: "OM-ENQ-26-02122",
    buyer_name: "AKIJ SHIPPING LINE LTD",
    buyer_email: "procurement@akij.com",
    vessel_name: "AKIJ GLORY",
    vessel_ref: "AGR-DK-ST-01463",
    date_received: "2026-05-04T07:07:09.000Z",
    status: "ADMIN_APPROVAL",
    margin_percent: 15,
    discount_percent: 0,
    admin_approved: false,
    tl_approved: false,
    products: [
      {
        product_name: "Lubricating Oil Filter Element",
        quantity: 29,
        unit: "pcs",
        specs: "Boll & Kirch 1.36.2"
      }
    ],
    seller_quote: {
      seller_name: "Danfoss Industrial India",
      seller_email: "support@danfoss.in",
      date_received: "2026-05-04T09:07:09.000Z",
      products: [
        {
          product_name: "Lubricating Oil Filter Element",
          seller_unit_price: 95,
          moq: 1,
          lead_time: "3 Days"
        }
      ]
    },
    my_quote: null
  },
  {
    inquiry_id: "OM-ENQ-26-02118",
    buyer_name: "MM SOLUTIONS",
    buyer_email: "procurement@mm.com",
    vessel_name: "HERMES",
    vessel_ref: "HER/0034/26",
    date_received: "2026-05-02T05:54:27.000Z",
    status: "EMPLOYEE_VERIFY",
    margin_percent: 15,
    discount_percent: 0,
    admin_approved: true,
    tl_approved: true,
    products: [
      {
        product_name: "V-Belt SPA 1500",
        quantity: 11,
        unit: "pcs",
        specs: "Optibelt Marine Antistatic"
      }
    ],
    seller_quote: {
      seller_name: "MAN Energy Solutions",
      seller_email: "marineparts@man-es.com",
      date_received: "2026-05-02T07:54:27.000Z",
      products: [
        {
          product_name: "V-Belt SPA 1500",
          seller_unit_price: 12,
          moq: 1,
          lead_time: "3 Days"
        }
      ]
    },
    my_quote: {
      products: [
        {
          product_name: "V-Belt SPA 1500",
          my_unit_price: 13.8,
          margin_percent: 15,
          total_price: 151.8
        }
      ]
    }
  }
];

export const mockSupply: SupplyItem[] = [
  {
    inquiry_id: "CGO-1001",
    supplier: "Oceanic Logistics",
    buyer_name: "Oceanic Logistics",
    buyer_email: "oceanic@example.com",
    cargo: "Steel Pipes",
    quantity: "120 MT",
    destination: "Dubai",
    status: "IN_TRANSIT",
    date: "2026-05-10",
    products: [{ product_name: "Steel Pipes" }],
    vehicle: "MH-01-AB-1234",
    driver: "Rajesh Kumar",
    driverPhone: "+91 99887 76655"
  },
  {
    inquiry_id: "CGO-1002",
    supplier: "Global Marine",
    buyer_name: "Global Marine",
    buyer_email: "global@example.com",
    cargo: "Copper Wire",
    quantity: "45 MT",
    destination: "Singapore",
    status: "PENDING",
    date: "2026-05-10",
    products: [{ product_name: "Copper Wire" }],
  },
  {
    inquiry_id: "CGO-1003",
    supplier: "BlueWave Cargo",
    buyer_name: "BlueWave Cargo",
    buyer_email: "bluewave@example.com",
    cargo: "Industrial Valves",
    quantity: "80 Units",
    destination: "Rotterdam",
    status: "DELIVERED",
    date: "2026-05-09",
    products: [{ product_name: "Industrial Valves" }],
    vehicle: "MH-02-CD-5678",
    driver: "Sukhwinder Singh",
    driverPhone: "+91 88776 65544"
  },
  {
    inquiry_id: "CGO-1004",
    supplier: "Atlantic Freight",
    buyer_name: "Atlantic Freight",
    buyer_email: "atlantic@example.com",
    cargo: "Engine Parts",
    quantity: "25 Boxes",
    destination: "Hamburg",
    status: "LOADING",
    date: "2026-05-08",
    products: [{ product_name: "Engine Parts" }],
  }
];

export const mockTodoEvents: TodoItem[] = [
  { id: 1, title: "Client Meeting - Global Traders", time: "10:00 AM", location: "Conference Room A", priority: "High", date: "2026-05-13", completed: false },
  { id: 2, title: "Project Sync", time: "02:30 PM", location: "Zoom", priority: "Medium", date: "2026-05-13", completed: true },
  { id: 3, title: "Operations Review", time: "04:00 PM", location: "Office", priority: "Low", date: "2026-05-13", completed: false },
  { id: 4, title: "Product Demo", time: "11:00 AM", location: "Showroom", priority: "High", date: "2026-05-14", completed: false }
];

export const mockLeaves = [
  { id: 1, name: "Arjun Sharma", type: "Sick Leave", duration: "13 May - 14 May" },
  { id: 2, name: "Sneha Reddy", type: "Vacation", duration: "10 May - 15 May" }
];

export const mockPastEvents = [
  { 
    id: 101, 
    title: "Annual Team Celebration 2025", 
    date: "Dec 15, 2025", 
    description: "A wonderful evening celebrating our yearly achievements with the whole team.",
    attendees: 45,
    location: "Grand Ballroom, Marriott"
  }
];
