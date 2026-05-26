export interface MarginProduct {
  product_name: string;
  seller_unit_price?: number;
  quantity?: number;
  [key: string]: any;
}

export function calculateMargin(sellerProducts: MarginProduct[], settings: { default_margin_percent: number }) {
  let total_seller_cost = 0;
  let total_my_price = 0;
  let total_profit = 0;

  const defaultMargin = settings?.default_margin_percent || 0;

  const products = sellerProducts.map(product => {
    const nameLower = (product.product_name || "").toLowerCase();
    let rule1Margin = defaultMargin;

    // Rule 1 — Category based markup
    const keywords12 = ["pipe", "rod", "bar", "sheet", "plate"];
    const keywords18 = ["bolt", "nut", "screw", "fastener", "washer"];

    if (keywords18.some(kw => nameLower.includes(kw))) {
      rule1Margin = 18;
    } else if (keywords12.some(kw => nameLower.includes(kw))) {
      rule1Margin = 12;
    }

    // Rule 2 — Price tier override
    const price = product.seller_unit_price || 0;
    let rule2Margin = 0;
    
    if (price < 100) {
      rule2Margin = 25;
    } else if (price >= 100 && price <= 500) {
      rule2Margin = 18;
    } else if (price > 500 && price <= 2000) {
      rule2Margin = 15;
    } else if (price > 2000) {
      rule2Margin = 12;
    }

    // Take highest between Rule 1 and Rule 2
    let applied_margin_percent = Math.max(rule1Margin, rule2Margin);

    // Rule 3 — Quantity discount for buyer
    const qty = product.quantity || 0;
    let discount = 0;
    if (qty > 5000) {
      discount = 4;
    } else if (qty > 1000) {
      discount = 2;
    }

    if (discount > 0) {
      applied_margin_percent -= discount;
      if (applied_margin_percent < 10) {
        applied_margin_percent = 10;
      }
    }

    // Calculations
    const exact_my_unit_price = price * (1 + applied_margin_percent / 100);
    const my_unit_price = Math.ceil(exact_my_unit_price / 10) * 10; // round up to nearest 10
    
    const prod_seller_cost = price * qty;
    const prod_my_price = my_unit_price * qty;
    const profit_per_unit = my_unit_price - price;
    const prod_profit = profit_per_unit * qty;

    total_seller_cost += prod_seller_cost;
    total_my_price += prod_my_price;
    total_profit += prod_profit;

    return {
      ...product,
      applied_margin_percent,
      my_unit_price,
      total_seller_cost: prod_seller_cost,
      total_my_price: prod_my_price,
      profit_per_unit,
      total_profit: prod_profit
    };
  });

  const average_margin_percent = total_seller_cost > 0 
    ? ((total_profit / total_seller_cost) * 100) 
    : 0;

  return {
    products,
    summary: {
      total_seller_cost,
      total_my_price,
      total_profit,
      average_margin_percent,
      currency: "USD"
    }
  };
}

export function formatINR(amount: number | undefined | null) {
  if (amount === undefined || amount === null) return "₹ 0";
  const formatted = new Intl.NumberFormat('en-IN').format(amount);
  return `₹ ${formatted}`;
}

export function formatUSD(amount: number | undefined | null) {
  if (amount === undefined || amount === null) return "$ 0";
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
  return `$${formatted}`;
}

export function formatDateString(dateStr: string | undefined | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
