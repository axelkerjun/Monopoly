"use client";

import { useEffect, useState } from "react";

function formatMoney(value, currency = "USD") {
  const num = Number(value) || 0;

  return num.toLocaleString(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
}

function formatNumber(value) {
  const num = Number(value) || 0;

  return num.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

async function fetchCurrentPrice(ticker) {
  try {
    const res = await fetch(
      `/api/market/quote?symbol=${encodeURIComponent(ticker)}`,
      { cache: "no-store" }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        error: true,
        message: "Invalid ticker or price unavailable",
      };
    }

    return {
      price: Number(data.price),
      currency: data.currency || "USD",
      provider: data.provider || "Yahoo Finance",
    };
  } catch (error) {
    return {
      error: true,
      message: "Invalid ticker or price unavailable",
    };
  }
}

function calculateSummary(positions) {
  const totalInvested = positions.reduce(
    (sum, position) => sum + position.totalCost,
    0
  );

  const netPortfolioValue = positions.reduce((sum, position) => {
    if (position.finalValue === null) {
      return sum + position.totalCost;
    }

    return sum + position.finalValue;
  }, 0);

  const totalReturns = netPortfolioValue - totalInvested;

  const returnPercentage =
    totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  return {
    totalInvested,
    netPortfolioValue,
    totalReturns,
    returnPercentage,
  };
}

export default function SummaryCards({ userId }) {
  const [holdings, setHoldings] = useState([]);
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;

    let intervalId;
    let isMounted = true;
    let isFetching = false;

    async function fetchPortfolio() {
      if (isFetching) return;

      try {
        isFetching = true;
        setError("");

        const holdingsRes = await fetch(`/api/holdings/${userId}`, {
          cache: "no-store",
        });

        const holdingsData = await holdingsRes.json();

        if (!holdingsRes.ok) {
          throw new Error(holdingsData.error || "Failed to load holdings");
        }

        const fetchedHoldings = Array.isArray(holdingsData.holdings)
          ? holdingsData.holdings
          : [];

        if (!isMounted) return;
        setHoldings(fetchedHoldings);

        if (fetchedHoldings.length === 0) {
          setMarketData({ stockPrices: {} });
          return;
        }

        const tickers = [
          ...new Set(fetchedHoldings.map((holding) => holding.ticker)),
        ];

        const quoteEntries = await Promise.all(
          tickers.map(async (ticker) => {
            const quote = await fetchCurrentPrice(ticker);
            return [ticker, quote];
          })
        );

        if (!isMounted) return;

        setMarketData({
          stockPrices: Object.fromEntries(quoteEntries),
        });
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Something went wrong");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }

        isFetching = false;
      }
    }

    fetchPortfolio();

    intervalId = setInterval(fetchPortfolio, 30000); //set to 30s refresh rate

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [userId]);

  const positionsWithPrices = holdings.map((holding) => {
    const quote = marketData?.stockPrices?.[holding.ticker];

    const quantity = Number(holding.quantity) || 0;
    const avgPrice = Number(holding.avgPrice) || 0;

    const currentPrice =
      quote && !quote.error && quote.price !== undefined
        ? Number(quote.price)
        : null;

    const currency = quote?.currency || "USD";

    const totalCost = quantity * avgPrice;
    const finalValue = currentPrice !== null ? quantity * currentPrice : null;
    const returns = finalValue !== null ? finalValue - totalCost : null;

    const returnPercentage =
      returns !== null && totalCost > 0 ? (returns / totalCost) * 100 : null;

    return {
      ticker: holding.ticker,
      quantity,
      avgPrice,
      totalCost,
      currentPrice,
      finalValue,
      returns,
      returnPercentage,
      currency,
      priceError: quote?.error ? quote.message : "",
    };
  });

  const positionsByCurrency = positionsWithPrices.reduce((groups, position) => {
    const currency = position.currency || "USD";

    if (!groups[currency]) {
      groups[currency] = [];
    }

    groups[currency].push(position);
    return groups;
  }, {});

  const currencyOrder = Object.keys(positionsByCurrency).sort((a, b) => {
    const order = ["USD", "SGD"];
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);

    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });

  function exportCSV() {
    if (positionsWithPrices.length === 0) {
      setError("No holdings to export.");
      return;
    }

    const csvRows = [
      [
        "Ticker",
        "Quantity",
        "Avg Cost",
        "Current Price",
        "Final Value",
        "Currency",
        "Returns",
        "Return %",
      ],
      ...positionsWithPrices.map((position) => [
        position.ticker,
        position.quantity,
        position.avgPrice,
        position.currentPrice || "N/A",
        position.finalValue || "N/A",
        position.currency,
        position.returns || "N/A",
        position.returnPercentage !== null
          ? position.returnPercentage.toFixed(2) + "%"
          : "N/A",
      ]),
    ];

    const csv = csvRows.map((row) => row.join(",")).join("\n");

    const file = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(file);
    link.download = "myholdings.csv";
    link.click();
  }

  if (loading) {
    return <p className="subtitle">Loading portfolio summary...</p>;
  }

  if (error) {
    return <div className="message error">{error}</div>;
  }

  return (
    <div className="holdingsSection">
      <h2 className="holdingsTitle">Your Holdings</h2>

      {positionsWithPrices.length === 0 ? (
        <p className="subtitle">No holdings yet.</p>
      ) : (
        <>
          {currencyOrder.map((currency) => {
            const positions = positionsByCurrency[currency];
            const summary = calculateSummary(positions);

            return (
              <div
                className="tableWrap"
                key={currency}
                style={{ marginBottom: "32px" }}
              >
                <h3 style={{ margin: "20px 0 12px 16px" }}>
                  {currency} Holdings
                </h3>

                <table className="table">
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Shares Owned</th>
                      <th>Avg Cost</th>
                      <th>Total Cost</th>
                      <th>Current Price</th>
                      <th>Final Value</th>
                      <th>Returns</th>
                    </tr>
                  </thead>

                  <tbody>
                    {positions.map((position) => (
                      <tr key={position.ticker}>
                        <td style={{ fontWeight: 700 }}>{position.ticker}</td>

                        <td>{formatNumber(position.quantity)}</td>

                        <td>
                          {formatMoney(position.avgPrice, position.currency)}
                        </td>

                        <td>
                          {formatMoney(position.totalCost, position.currency)}
                        </td>

                        <td>
                          {position.currentPrice === null ? (
                            <span style={{ color: "#dc2626" }}>
                              Price unavailable
                            </span>
                          ) : (
                            formatMoney(
                              position.currentPrice,
                              position.currency
                            )
                          )}
                        </td>

                        <td>
                          {position.finalValue === null
                            ? "—"
                            : formatMoney(
                              position.finalValue,
                              position.currency
                            )}
                        </td>

                        <td>
                          {position.returns === null ? (
                            <span style={{ color: "#dc2626" }}>
                              {position.priceError || "—"}
                            </span>
                          ) : (
                            <span
                              style={{
                                color:
                                  position.returns >= 0
                                    ? "#16a34a"
                                    : "#dc2626",
                              }}
                            >
                              {formatMoney(
                                position.returns,
                                position.currency
                              )}{" "}
                              ({position.returnPercentage.toFixed(2)}%)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="portfolioFooter">
                  <span>
                    <strong>Total Invested:</strong>{" "}
                    {formatMoney(summary.totalInvested, currency)}
                  </span>

                  <span>
                    <strong>Net Portfolio Value:</strong>{" "}
                    {formatMoney(summary.netPortfolioValue, currency)}
                  </span>

                  <span>
                    <strong>Total Returns:</strong>{" "}
                    <span
                      style={{
                        color:
                          summary.totalReturns >= 0 ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {formatMoney(summary.totalReturns, currency)}{" "}
                      ({summary.returnPercentage.toFixed(2)}%)
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </>
      )}
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button className="button" type="button" onClick={exportCSV}>
          Export CSV
        </button>
      </div>
    </div>
  );
}