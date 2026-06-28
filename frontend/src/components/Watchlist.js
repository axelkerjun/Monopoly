"use client";

import { useEffect, useState } from "react";
import TickerAutocomplete from "@/components/TickerAutocomplete";

function formatMoney(value, currency = "USD") {
  return Number(value || 0).toLocaleString(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
}

async function fetchCurrentPrice(ticker) {
  try {
    const response = await fetch(
      `/api/market/quote?symbol=${encodeURIComponent(ticker)}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        error: true,
        message: "Price unavailable",
        currency: "Unknown",
      };
    }

    return {
      price: Number(data.price),
      currency: data.currency || "Unknown",
    };
  } catch {
    return {
      error: true,
      message: "Price unavailable",
      currency: "Unknown",
    };
  }
}

export default function Watchlist({ userId }) {
  const [ticker, setTicker] = useState(""); //stores typed in ticker
  const [watchlist, setWatchlist] = useState([]); //stores items from db
  const [prices, setPrices] = useState({}); //stores prices
  const [message, setMessage] = useState(""); //stores message for added and removed
  const [isError, setIsError] = useState(false); //controls the message is error or success
  const [loading, setLoading] = useState(true); //loads saved wl from db

  async function loadWatchlist() {
    if (!userId) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/watchlist?user_id=${userId}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load watchlist.");
      }

      const items = data.watchlist || [];
      setWatchlist(items);

      const priceEntries = await Promise.all(
        items.map(async (item) => {
          const quote = await fetchCurrentPrice(item.ticker);
          return [item.ticker, quote];
        })
      );

      setPrices(Object.fromEntries(priceEntries));
    } catch (error) {
      setMessage(error.message || "Failed to load watchlist.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWatchlist();
  }, [userId]);

  async function handleAdd(e) {
    e.preventDefault();

    if (!ticker.trim()) {
      setMessage("Please enter a ticker.");
      setIsError(true);
      return;
    }

    try {
      setMessage("");
      setIsError(false);

      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          ticker: ticker.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add ticker.");
      }

      setTicker("");
      setMessage("Ticker added to watchlist.");
      setIsError(false);

      await loadWatchlist();
    } catch (error) {
      setMessage(error.message || "Failed to add ticker.");
      setIsError(true);
    }
  }

  async function handleDelete(itemId) {
    try {
      setMessage("");
      setIsError(false);

      const response = await fetch(
        `/api/watchlist/${itemId}?user_id=${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove ticker.");
      }

      setMessage("Ticker removed from watchlist.");
      setIsError(false);

      await loadWatchlist();
    } catch (error) {
      setMessage(error.message || "Failed to remove ticker.");
      setIsError(true);
    }
  }

  const groupedWatchlist = {};

  watchlist.forEach((item) => {
    const currency = prices[item.ticker]?.currency || "Unknown";

    if (!groupedWatchlist[currency]) {
      groupedWatchlist[currency] = [];
    }

    groupedWatchlist[currency].push(item);
  });

  return (
    <div className="holdingsSection">
      <h2 className="holdingsTitle">Watchlist</h2>

      <div className="tableWrap" style={{ padding: "20px" }}>
        <form onSubmit={handleAdd} className="form">
          <div className="field">
            <label>Add ticker to watchlist</label>
            <TickerAutocomplete value={ticker} onChange={setTicker} />
          </div>

          <button className="button" type="submit">
            Add to Watchlist
          </button>
        </form>

        {message && (
          <div className={`message ${isError ? "error" : "success"}`}>
            {message}
          </div>
        )}

        {loading ? (
          <p className="subtitle">Loading watchlist...</p>
        ) : watchlist.length === 0 ? (
          <p className="subtitle">No watchlist items yet.</p>
        ) : (
          Object.keys(groupedWatchlist)
            .sort()
            .map((currency) => (
              <div key={currency} style={{ marginTop: "24px" }}>
                <h3 style={{ marginBottom: "12px" }}>{currency} Watchlist</h3>

                <table
                  className="table"
                  style={{ tableLayout: "fixed", width: "100%" }}
                >
                  <colgroup>
                    <col style={{ width: "45%" }} />
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "25%" }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Ticker</th>
                      <th style={{ textAlign: "center" }}>Current Price</th>
                      <th style={{ textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {groupedWatchlist[currency].map((item) => {
                      const quote = prices[item.ticker];

                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 700, wordBreak: "break-word" }}>
                            {item.ticker}
                          </td>

                          <td style={{ textAlign: "center" }}>
                            {quote?.error
                              ? "Price unavailable"
                              : formatMoney(quote?.price, quote?.currency)}
                          </td>

                          <td style={{ textAlign: "center" }}>
                            <button
                              className="linkButton"
                              type="button"
                              onClick={() => handleDelete(item.id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
        )}
      </div>
    </div>
  );
}