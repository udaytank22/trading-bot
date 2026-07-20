import { describe, it, expect } from 'vitest';
import { calculateMargin, formatINR } from './marginEngine';

describe('marginEngine', () => {
  const defaultSettings = { default_margin_percent: 50 };

  it('Case 1: Should use default margin if no keywords and price tier is lower than default', () => {
    // default 50%, price 1500 (tier 15%), max is 50%
    const products = [{ product_name: "Generic Item", seller_unit_price: 1500, quantity: 10, currency: "USD" }];
    const result = calculateMargin(products, defaultSettings);
    expect(result.products[0].applied_margin_percent).toBe(50);
    // price = 1500 * 1.50 = 2250 (already multiple of 10)
    expect(result.products[0].my_unit_price).toBe(2250);
  });

  it('Case 2: Rule 1 - Should apply 18% minimum for fastener', () => {
    // "bolt" keyword, price > 2000 (tier 12%), default settings 10%
    const products = [{ product_name: "steel bolt", seller_unit_price: 2500, quantity: 100 }];
    const result = calculateMargin(products, { default_margin_percent: 10 });
    // Rule 1: 18%, Rule 2: 12%, Default: 10%. Max is 18%.
    expect(result.products[0].applied_margin_percent).toBe(18);
    // 2500 * 1.18 = 2950.
    expect(result.products[0].my_unit_price).toBe(2950);
  });

  it('Case 3: Rule 2 - Should apply 25% minimum for price < 100 and round up to nearest 10', () => {
    // "pipe" keyword (12%), price 50 (tier 25%) => max is 25%.
    const products = [{ product_name: "pipe", seller_unit_price: 50, quantity: 50 }]; 
    const result = calculateMargin(products, { default_margin_percent: 10 });
    expect(result.products[0].applied_margin_percent).toBe(25);
    // 50 * 1.25 = 62.5 -> ceil(62.5/10)*10 = 70
    expect(result.products[0].my_unit_price).toBe(70);
  });

  it('Case 4: Rule 3 - Quantity discount 2% for > 1000', () => {
    // default 50%, qty 1500 -> 50 - 2 = 48%
    const products = [{ product_name: "Generic Item", seller_unit_price: 1500, quantity: 1500 }];
    const result = calculateMargin(products, defaultSettings);
    expect(result.products[0].applied_margin_percent).toBe(48);
  });

  it('Case 5: Rule 3 - Quantity discount 4% for > 5000 with minimum floor of 10%', () => {
    // rule 1 (pipe) = 12%. rule 2 (2500) = 12%. max = 12%. 
    // qty 6000 -> 12 - 4 = 8%, but minimum floor is 10%.
    const products = [{ product_name: "pipe", seller_unit_price: 2500, quantity: 6000 }];
    const result = calculateMargin(products, { default_margin_percent: 10 });
    expect(result.products[0].applied_margin_percent).toBe(10);
  });

  it('Case 6: Should calculate correct total costs and profits', () => {
    const products = [
      { product_name: "pipe", seller_unit_price: 50, quantity: 50 }, // sell=70
      { product_name: "bolt", seller_unit_price: 2500, quantity: 100 } // sell=2950
    ];
    const result = calculateMargin(products, { default_margin_percent: 10 });
    // Total seller cost = (50*50) + (2500*100) = 2500 + 250000 = 252500
    // Total my price = (70*50) + (2950*100) = 3500 + 295000 = 298500
    // Total profit = 298500 - 252500 = 46000
    expect(result.summary.total_seller_cost).toBe(252500);
    expect(result.summary.total_my_price).toBe(298500);
    expect(result.summary.total_profit).toBe(46000);
  });

  it('Case 7: formatINR should format properly', () => {
    expect(formatINR(1000)).toBe("₹1,000.00");
    expect(formatINR(100000)).toBe("₹1,00,000.00");
    expect(formatINR(2500000)).toBe("₹25,00,000.00");
  });
});
