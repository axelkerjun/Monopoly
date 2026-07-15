// frontend/__tests__/holdings.test.js
import { describe, it, expect } from 'vitest'

/**
 * Enhanced holdings aggregator calculation engine.
 * Filters out invalid parameters and processes buy/sell history.
 */
function calculateHoldings(transactions) {
  const holdings = {};

  // Input Validation Guard Layer: Ignore negative or empty values
  const validTransactions = transactions.filter(
    t => parseFloat(t.quantity) > 0 && parseFloat(t.price) > 0
  );

  validTransactions.forEach(({ ticker, type, quantity, price }) => {
    const qty = parseFloat(quantity);
    const prc = parseFloat(price);

    if (!holdings[ticker]) {
      holdings[ticker] = { quantity: 0, totalCost: 0, averageCost: 0 };
    }

    if (type === 'BUY') {
      holdings[ticker].quantity += qty;
      holdings[ticker].totalCost += (qty * prc);
      holdings[ticker].averageCost = holdings[ticker].totalCost / holdings[ticker].quantity;
    } else if (type === 'SELL') {
      holdings[ticker].quantity -= qty;
      // Capital tracking: Sell scales down the remaining cost basis proportionately based on average cost
      holdings[ticker].totalCost = holdings[ticker].quantity * holdings[ticker].averageCost;
    }
  });

  // Filter out fully liquidated assets down to 0 or beneath numerical precision thresholds
  return Object.keys(holdings)
    .filter(ticker => holdings[ticker].quantity > 0.00001)
    .reduce((obj, key) => {
      obj[key] = holdings[key];
      return obj;
    }, {});
}

describe('Monopoly Holdings Aggregator Math', () => {
  
  // Test 1: Core Grouping logic
  it('should accurately calculate remaining shares and average cost across multiple BUYs', () => {
    const mockTransactions = [
      { ticker: 'AAPL', type: 'BUY', quantity: '10', price: '150' },
      { ticker: 'AAPL', type: 'BUY', quantity: '5', price: '180' }
    ];

    const result = calculateHoldings(mockTransactions);

    expect(result['AAPL']).toBeDefined();
    expect(result['AAPL'].quantity).toBe(15);
    expect(result['AAPL'].averageCost).toBe(160); // (1500 + 900) / 15
  });

  // Test 2: Standard Deduction logic
  it('should correctly reduce share quantity when a SELL transaction is applied', () => {
    const mockTransactions = [
      { ticker: 'VOO', type: 'BUY', quantity: '10', price: '400' },
      { ticker: 'VOO', type: 'SELL', quantity: '3', price: '420' }
    ];

    const result = calculateHoldings(mockTransactions);

    expect(result['VOO'].quantity).toBe(7);
    expect(result['VOO'].averageCost).toBe(400); 
  });

  // Test 3: Edge Case - Partial Liquidation Capital Cost Scaling
  it('should correctly update remaining total cost after a partial positional SELL', () => {
    const mockTransactions = [
      { ticker: 'AAPL', type: 'BUY', quantity: '10', price: '100' }, 
      { ticker: 'AAPL', type: 'SELL', quantity: '3', price: '150' }  
    ];

    const result = calculateHoldings(mockTransactions);

    expect(result['AAPL'].quantity).toBe(7);
    expect(result['AAPL'].totalCost).toBe(700); // 7 remaining shares * $100 avg purchase cost
    expect(result['AAPL'].averageCost).toBe(100);
  });

  // Test 4: Edge Case - Floating Point & Fractional Crypto Calculations
  it('should precisely calculate floating point quantities for fractional crypto transactions', () => {
    const mockTransactions = [
      { ticker: 'BTC-USD', type: 'BUY', quantity: '0.255', price: '60000' },
      { ticker: 'BTC-USD', type: 'BUY', quantity: '0.145', price: '65000' }
    ];

    const result = calculateHoldings(mockTransactions);

    // 0.255 + 0.145 = 0.400 shares exactly. toBeCloseTo avoids JS floating-point issues (.1+.2 = .300000000004)
    expect(result['BTC-USD'].quantity).toBeCloseTo(0.400, 5);
  });

  // Test 5: Edge Case - Defensive Parameter Resiliency
  it('should filter out or safely ignore transactions with missing, zero, or negative quantities', () => {
    const mockTransactions = [
      { ticker: 'MSFT', type: 'BUY', quantity: '-5', price: '300' },
      { ticker: 'MSFT', type: 'BUY', quantity: '0', price: '300' }   
    ];

    const result = calculateHoldings(mockTransactions);
    expect(result['MSFT']).toBeUndefined();
  });
});
