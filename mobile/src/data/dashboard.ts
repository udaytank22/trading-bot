export interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}

export interface ClosedDeal {
  inquiry_id: string;
  buyer_name: string;
  products: string;
  seller_cost: number;
  my_price: number;
  margin_percent: number;
  profit: number;
  date_closed: string;
}

export interface WeeklyTrend {
  day: string;
  profit: number;
}

export const mockDashboardMetrics: MetricCard[] = [
  {
    id: "m-1",
    title: "Today's Inquiries",
    value: "14",
    change: "+12% from yesterday",
    changeType: "positive",
    icon: "inquiry"
  },
  {
    id: "m-2",
    title: "Quotes Sent",
    value: "8 / 14",
    change: "57% conversion rate",
    changeType: "neutral",
    icon: "quote"
  },
  {
    id: "m-3",
    title: "Pending Replies",
    value: "6",
    change: "-15% from last week",
    changeType: "positive",
    icon: "pending"
  },
  {
    id: "m-4",
    title: "Total Profit (Month)",
    value: "$432,650",
    change: "+24.5% vs target",
    changeType: "positive",
    icon: "profit"
  }
];

export const mockClosedDeals: ClosedDeal[] = [
  { inquiry_id: "INQ-20260324-001", buyer_name: "Shyam Synthetics", products: "Polyester Resin & Hardener", seller_cost: 150000, my_price: 172500, margin_percent: 15, profit: 22500, date_closed: "2026-03-24T14:20:00Z" },
  { inquiry_id: "INQ-20260326-003", buyer_name: "Laxmi Cement Products", products: "Hydraulic Cement Grade 53", seller_cost: 240000, my_price: 268800, margin_percent: 12, profit: 28800, date_closed: "2026-03-26T10:15:00Z" },
  { inquiry_id: "INQ-20260329-002", buyer_name: "Apex Solar Tech", products: "Solar Panels 400W", seller_cost: 450000, my_price: 495000, margin_percent: 10, profit: 45000, date_closed: "2026-03-29T16:45:00Z" },
  { inquiry_id: "INQ-20260401-001", buyer_name: "Mahavir Steel Fabricators", products: "TMT Bars 12mm", seller_cost: 310000, my_price: 356500, margin_percent: 15, profit: 46500, date_closed: "2026-04-01T11:30:00Z" },
  { inquiry_id: "INQ-20260403-005", buyer_name: "Globe Electricals", products: "LT Power Cables", seller_cost: 180000, my_price: 212400, margin_percent: 18, profit: 32400, date_closed: "2026-04-03T13:10:00Z" },
  { inquiry_id: "INQ-20260405-002", buyer_name: "Bharat Chemicals", products: "Industrial Solvents", seller_cost: 55000, my_price: 66000, margin_percent: 20, profit: 11000, date_closed: "2026-04-05T09:40:00Z" },
  { inquiry_id: "INQ-20260408-004", buyer_name: "Pioneer Machineries", products: "Bearings & V-Belts", seller_cost: 42000, my_price: 52500, margin_percent: 25, profit: 10500, date_closed: "2026-04-08T15:25:00Z" },
  { inquiry_id: "INQ-20260410-001", buyer_name: "Sunrise Plastics", products: "HDPE Granules", seller_cost: 215000, my_price: 247250, margin_percent: 15, profit: 32250, date_closed: "2026-04-10T12:00:00Z" }
];

export const mockWeeklyTrend: WeeklyTrend[] = [
  { day: "Thu", profit: 12500 },
  { day: "Fri", profit: 8200 },
  { day: "Sat", profit: 3400 },
  { day: "Sun", profit: 2100 },
  { day: "Mon", profit: 14500 },
  { day: "Tue", profit: 11600 },
  { day: "Wed", profit: 13900 }
];

export const mockAccountsData = [
  { id: "BANK-001", bankName: "Chase Bank", accountName: "Main Operating", accountNumber: "1234567890", routingNumber: "021000021", currency: "USD", balance: 250000.00, status: "Active" },
  { id: "BANK-002", bankName: "Bank of America", accountName: "Payroll Account", accountNumber: "0987654321", routingNumber: "026009593", currency: "USD", balance: 75000.50, status: "Active" },
  { id: "BANK-003", bankName: "HSBC", accountName: "International Trade", accountNumber: "GB29MIDL400515", routingNumber: "MIDLGB22", currency: "GBP", balance: 12500.00, status: "Active" },
  { id: "BANK-004", bankName: "Wells Fargo", accountName: "Reserve Fund", accountNumber: "1122334455", routingNumber: "121000248", currency: "USD", balance: 500000.00, status: "Inactive" }
];
