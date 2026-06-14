"use client";

import { useEffect, useMemo, useState } from "react";

export default function TransactionsTable({ userId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingTx, setEditingTx] = useState(null);
  const [deletingTx, setDeletingTx] = useState(null);

  const [editForm, setEditForm] = useState({
    ticker: "",
    type: "BUY",
    quantity: "",
    price: "",
    transaction_date: "",
  });

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 2,
      }),
    []
  );

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const url =
        userId != null
          ? `/api/transactions?user_id=${encodeURIComponent(userId)}`
          : "/api/transactions";

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load transactions");
      }

      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const openEditModal = (tx) => {
    setEditingTx(tx);
    setEditForm({
      ticker: tx.ticker ?? "",
      type: tx.type ?? "BUY",
      quantity: tx.quantity ?? "",
      price: tx.price ?? "",
      transaction_date: tx.transaction_date?.slice(0, 10) ?? "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveEdit = async () => {
    if (!editingTx) return;

    try {
      const res = await fetch(`/api/transactions/${editingTx.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker: editForm.ticker,
          type: editForm.type,
          quantity: Number(editForm.quantity),
          price: Number(editForm.price),
          transaction_date: editForm.transaction_date,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update transaction");
      }

      setTransactions((prev) =>
        prev.map((tx) => (tx.id === editingTx.id ? data.transaction : tx))
      );

      setEditingTx(null);
    } catch (err) {
      alert(err.message || "Update failed");
    }
  };

  const deleteTransaction = async () => {
    if (!deletingTx) return;

    try {
      const res = await fetch(`/api/transactions/${deletingTx.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete transaction");
      }

      setTransactions((prev) => prev.filter((tx) => tx.id !== deletingTx.id));
      setDeletingTx(null);
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  };

  return (
    <div style={{ marginTop: "24px" }}>
      {loading && <p className="subtitle">Loading transactions...</p>}

      {error && (
        <div className="message error" style={{ marginTop: 0 }}>
          {error}
        </div>
      )}

      {!loading && !error && transactions.length === 0 && (
        <p className="subtitle">No transactions found.</p>
      )}

      {!loading && transactions.length > 0 && (
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ticker</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.transaction_date?.slice(0, 10) || "-"}</td>
                  <td style={{ fontWeight: 700 }}>{tx.ticker}</td>
                  <td>{tx.type}</td>
                  <td>{numberFormatter.format(Number(tx.quantity) || 0)}</td>
                  <td>{numberFormatter.format(Number(tx.price) || 0)}</td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={() => openEditModal(tx)}
                        className="actionButton editButton"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingTx(tx)}
                        className="actionButton deleteButton"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingTx && (
        <div className="modalOverlay">
          <div className="modal">
            <h2 className="modalTitle">Edit Transaction</h2>

            <div className="modalGrid">
              <div className="modalField">
                <label>Date</label>
                <input
                  type="date"
                  name="transaction_date"
                  value={editForm.transaction_date}
                  onChange={handleEditChange}
                />
              </div>

              <div className="modalField">
                <label>Ticker</label>
                <input
                  type="text"
                  name="ticker"
                  value={editForm.ticker}
                  onChange={handleEditChange}
                />
              </div>

              <div className="modalField">
                <label>Type</label>
                <select
                  name="type"
                  value={editForm.type}
                  onChange={handleEditChange}
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>

              <div className="modalField">
                <label>Quantity</label>
                <input
                  type="number"
                  step="any"
                  name="quantity"
                  value={editForm.quantity}
                  onChange={handleEditChange}
                />
              </div>

              <div className="modalField">
                <label>Price</label>
                <input
                  type="number"
                  step="any"
                  name="price"
                  value={editForm.price}
                  onChange={handleEditChange}
                />
              </div>
            </div>

            <div className="modalActions">
              <button
                onClick={() => setEditingTx(null)}
                className="cancelButton"
              >
                Cancel
              </button>
              <button onClick={saveEdit} className="saveButton">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingTx && (
        <div className="modalOverlay">
          <div className="modal" style={{ maxWidth: "440px" }}>
            <h2 className="modalTitle">Delete Transaction</h2>
            <p className="subtitle" style={{ marginBottom: "0" }}>
              Are you sure you want to delete{" "}
              <strong>{deletingTx.ticker}</strong>?
            </p>

            <div className="modalActions">
              <button
                onClick={() => setDeletingTx(null)}
                className="cancelButton"
              >
                Cancel
              </button>
              <button onClick={deleteTransaction} className="deleteButton actionButton">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}