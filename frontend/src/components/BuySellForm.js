"use client";

import { useState } from "react";

export default function BuySellForm({ userId }) {
  const [ticker, setTicker] = useState("");
  const [type, setType] = useState("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          ticker,
          type,
          quantity: parseFloat(quantity),
          price: parseFloat(price),
          transaction_date: date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save transaction");
      }

      setMessage(
        `${data.transaction.type} transaction for ${data.transaction.ticker} saved successfully`
      );

      setTicker("");
      setQuantity("");
      setPrice("");
      setDate("");
    } catch (err) {
      setIsError(true);
      setMessage(err.message);
    }
  };

  return (
    <div>
      <h2 className="dashboardSectionTitle">
        Log a Stock Transaction
      </h2>

      <form onSubmit={handleSubmit} className="form">
        <div className="field">
          <label>Stock Ticker</label>
          <input
            className="input"
            type="text"
            placeholder="e.g. AAPL"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label>Transaction Type</label>
          <select
            className="select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>

        <div className="field">
          <label>Quantity</label>
          <input
            className="input"
            type="number"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label>Price Per Share</label>
          <input
            className="input"
            type="number"
            step="any"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label>Transaction Date</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <button className="button" type="submit">
          Save {type} Transaction
        </button>
      </form>

      {message && (
        <div className={`message ${isError ? "error" : "success"}`}>
          {message}
        </div>
      )}
    </div>
  );
}