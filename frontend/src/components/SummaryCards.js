"use client";

import { useEffect, useState } from "react";
import { calculatePortfolio } from "@/lib/calculations";

function formatMoney(value) {
  const num = Number(value) || 0;
  return num.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function formatNumber(value) {
  const num = Number(value) || 0;
  return num.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

export default function SummaryCards({ userId }) {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/transactions?user_id=${encodeURIComponent(userId)}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load portfolio data");
        }

        const transactions = Array.isArray(data.transactions)
          ? data.transactions
          : [];

        const result = calculatePortfolio(transactions);
        setPortfolio(result);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchPortfolio();
  }, [userId]);

  const positions = portfolio?.positions || [];
  const totalCapitalInvested = portfolio?.totals?.totalCapitalInvested || 0;

  const totalInvested = positions.reduce(
    (sum, p) => sum + (Number(p.investedCapital) || 0),
    0
  );

  // Placeholder until live pricing is connected
  const netPortfolioValue = totalInvested;
  const totalReturns = netPortfolioValue - totalInvested;

  const returnPercentage =
  totalInvested > 0
    ? (totalReturns / totalInvested) * 100
    : 0;
  
    if (loading) {
    return <p className="subtitle">Loading portfolio summary...</p>;
  }

  if (error) {
    return <div className="message error">{error}</div>;
  }

  return (
    <div className="holdingsSection">
      <h2 className="holdingsTitle">Your Holdings</h2>

      {positions.filter((p) => p.sharesOwned > 0).length === 0 ? (
        <p className="subtitle">No holdings yet.</p>
      ) : (
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Shares Owned</th>
                <th>Avg Cost</th>
                <th>Total Cost</th>
                <th>Current Price</th>
                <th>Final Value</th>
              </tr>
            </thead>
            <tbody>
              {positions
                .filter((p) => p.sharesOwned > 0)
                .map((position) => {
                  const currentPrice = null; // live price API comes later
                  const finalValue =
                    currentPrice != null
                      ? position.sharesOwned * currentPrice
                      : null;

                  return (
                    <tr key={position.ticker}>
                      <td style={{ fontWeight: 700 }}>{position.ticker}</td>
                      <td>{formatNumber(position.sharesOwned)}</td>
                      <td>{formatMoney(position.averageCost)}</td>
                      <td>{formatMoney(position.investedCapital)}</td>
                      <td>{currentPrice == null ? "—" : formatMoney(currentPrice)}</td>
                      <td>{finalValue == null ? "—" : formatMoney(finalValue)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          <div className="portfolioFooter">
            <span>
              <strong>Total Invested:</strong> {formatMoney(totalInvested)}
            </span>

            <span>
              <strong>Net Portfolio Value:</strong>{" "}
              {formatMoney(netPortfolioValue)}
            </span>

            <span>
              <strong>Total Returns:</strong>{" "}
              <span
                style={{
                  color: totalReturns >= 0 ? "#16a34a" : "#dc2626",
                }}
              >
                {formatMoney(totalReturns)} ({returnPercentage.toFixed(2)}%)
              </span>
            </span>

          </div>
        </div>
      )}
    </div>
  );
}