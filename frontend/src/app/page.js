"use client";

import CSVuploader from './CSVuploader';
import { useState } from "react";

export default function Home() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const [ticker, setTicker] = useState("");
  const [type, setType] = useState("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");
  const [tradeMessage, setTradeMessage] = useState("");
  const [isTradeError, setIsTradeError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    const endpoint = isLoginMode ? "/api/auth/login" : "/api/auth/register";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (isLoginMode) {
        setLoggedInUser(data.user);
        setMessage(`Welcome back, ${data.user.email}!`);
      } else {
        setMessage("Success! Account created. You can now toggle to Log In.");
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.message);
    }
  };

  const handleLogTransaction = async (e) => {
    e.preventDefault();
    setTradeMessage("");
    setIsTradeError(false);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: loggedInUser?.id,
          ticker,
          type,
          quantity: parseFloat(quantity),
          price: parseFloat(price),
          transaction_date: date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save trade");
      }

      setTradeMessage(
        `Logged: ${data.transaction.type} ${data.transaction.quantity} shares of ${data.transaction.ticker}`
      );
      setTicker("");
      setQuantity("");
      setPrice("");
      setDate("");
    } catch (err) {
      setIsTradeError(true);
      setTradeMessage(err.message);
    }
  };

  // --- VIEW 1: LOGGED IN USER DASHBOARD ---
  if (loggedInUser) {
    return (
      <main className="page">
        <div className="card">
          <h1 className="dashboardTitle">Monopoly Dashboard</h1>
          <p className="centerText">
            Logged in as: <strong>{loggedInUser.email}</strong> (ID: {loggedInUser.id})
          </p>

          <hr className="hr" />

          {/* 🌟 Top-Snapped Banner Updates */}
          {tradeMessage && (
            <div className={`message ${isTradeError ? "error" : "success"}`}>
              {tradeMessage}
            </div>
          )}

          {/* 📥 Drag & Drop File Upload Component */}
          <CSVuploader
            userId={loggedInUser?.id}
            setTradeMessage={setTradeMessage}
            setIsTradeError={setIsTradeError}
          />

          <hr className="hr" style={{ margin: '20px 0' }} />

          <h3 className="dashboardSectionTitle">Log a Stock Transaction</h3>
          <form onSubmit={handleLogTransaction} className="form">
            <div className="field">
              <label>Stock Ticker:</label>
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
              <label>Transaction Type:</label>
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
              <label>Quantity:</label>
              <input
                className="input"
                type="number"
                step="any"
                placeholder="e.g. 10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Price per Share ($):</label>
              <input
                className="input"
                type="number"
                step="any"
                placeholder="e.g. 150.25"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Date of Transaction:</label>
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

          <button
            className="logoutButton"
            onClick={() => {
              setLoggedInUser(null);
              setTradeMessage("");
            }}
          >
            Log Out
          </button>
        </div>
      </main>
    );
  }

  // --- VIEW 2: LOGGED OUT AUTHENTICATION PORTAL ---
  return (
    <main className="page">
      <div className="card">
        <h1 className="title">Monopoly</h1>
        <p className="subtitle">Track your stock portfolio in one place.</p>

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="button" type="submit">
            {isLoginMode ? "Sign In" : "Register"}
          </button>
        </form>

        <button
          className="linkButton"
          onClick={() => {
            setIsLoginMode(!isLoginMode);
            setMessage("");
          }}
        >
          {isLoginMode
            ? "Don't have an account? Sign up"
            : "Already have an account? Log in"}
        </button>

        {message && (
          <div className={`message ${isError ? "error" : "success"}`}>
            {message}
          </div>
        )}
      </div>
    </main>
  );
}
