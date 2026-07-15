// frontend/__tests__/components.test.jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// A mock layout of your dashboard metric blocks to verify rendering
function SummaryCards({ totalValue, returns, returnPercentage, currency }) {
  // Strip away spaces, dollar signs, and commas so parseFloat reads a clean mathematical number
  const cleanReturns = returns.replace(/[^0-9.-]/g, '');
  const isPositive = parseFloat(cleanReturns) >= 0;

  return (
    <div className="summary-container">
      <h2>Portfolio Summary ({currency})</h2>
      <div data-testid="total-value">Net Worth: {totalValue}</div>
      <div data-testid="returns" style={{ color: isPositive ? 'green' : 'red' }}>
        Total Returns: {returns} ({returnPercentage}%)
      </div>
    </div>
  );
}

describe('Dashboard React Components UI Test', () => {

  it('should cleanly render portfolio dollar metrics and handle positive return styling', () => {
    render(
      <SummaryCards 
        totalValue="$12,450.00" 
        returns="+$1,200.00" 
        returnPercentage="10.6" 
        currency="USD" 
      />
    );

    // Verify text components are present on the DOM screen
    expect(screen.getByText('Portfolio Summary (USD)')).toBeDefined();
    expect(screen.getByTestId('total-value').textContent).toContain('$12,450.00');
    
    // Verify values display precisely
    const returnsElement = screen.getByTestId('returns');
    expect(returnsElement.textContent).toContain('+$1,200.00 (10.6%)');
    expect(returnsElement.style.color).toBe('green');
  });

  it('should switch style color metrics to red when returns are negative', () => {
    render(
      <SummaryCards 
        totalValue="$8,500.00" 
        returns="- $450.00" 
        returnPercentage="-5.0" 
        currency="SGD" 
      />
    );

    const returnsElement = screen.getByTestId('returns');
    expect(returnsElement.style.color).toBe('red');
  });
});
