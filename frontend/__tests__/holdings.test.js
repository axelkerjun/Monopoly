// frontend/__tests__/holdings.test.js
import { describe, it, expect } from 'vitest'

// This is a replica of your holdings math engine.
// Later, you can import your exact utility function here!
function calculateHoldings(transactions) {
  const holdings = {};

  transactions.forEach(({ ticker, type, quantity, price }) => {
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
      holdings[ticker].totalCost = holdings[ticker].quantity * holdings[ticker].averageCost;
    }
  });

  return Object.keys(holdings)
    .filter(ticker => holdings[ticker].quantity > 0)
    .reduce((obj, key) => {
      obj[key] = holdings[key];
      return obj;
    }, {});
}

describe('Monopoly Holdings Aggregator Math', () => {
  
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

  it('should correctly reduce share quantity when a SELL transaction is applied', () => {
    const mockTransactions = [
      { ticker: 'VOO', type: 'BUY', quantity: '10', price: '400' },
      { ticker: 'VOO', type: 'SELL', quantity: '3', price: '420' }
    ];

    const result = calculateHoldings(mockTransactions);

    expect(result['VOO'].quantity).toBe(7);
    expect(result['VOO'].averageCost).toBe(400); 
  });
});
