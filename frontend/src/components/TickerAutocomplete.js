"use client";

import { useEffect, useRef, useState } from "react";

export default function TickerAutocomplete({ value, onChange, onSelect }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const search = async () => {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        setResults([]);
        return;
      }

      try {
        const res = await fetch(
          `/api/market/search?query=${encodeURIComponent(trimmedQuery)}`
        );

        const data = await res.json();

        if (!res.ok) {
          setResults([]);
          return;
        }

        setResults(data.results || []);
        setIsOpen(true);
      } catch {
        setResults([]);
      }
    };

    const timer = setTimeout(search, 400);
    return () => clearTimeout(timer);
  }, [query]);

  function handleInputChange(event) {
    const newValue = event.target.value.toUpperCase();
    setQuery(newValue);
    if (onChange) onChange(newValue);
    setIsOpen(true);
  }

  function handleSelect(result) {
    const targetSymbol = result.tradeSymbol;
    setQuery(targetSymbol);
    setIsOpen(false);

    // 1. Tell the parent element the text changed (for form submissions)
    if (onChange) onChange(targetSymbol);
    
    // 2. Run an optional custom action (like page redirection) ONLY if passed down!
    if (onSelect) onSelect(result);
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <input
        className="input"
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Search ticker, e.g. AAPL, DBS, BTC"
        autoComplete="off"
        required
      />

      {isOpen && query.trim() && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "white",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            marginTop: "6px",
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {results.map((result) => (
            <button
              key={`${result.symbol}-${result.exchange}`}
              type="button"
              onClick={() => handleSelect(result)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "12px",
                border: "none",
                background: "white",
                cursor: "pointer",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <strong>{result.tradeSymbol}</strong>{" "}
              <span style={{ color: "#6b7280" }}>{result.exchange}</span>

              <div style={{ fontSize: "13px", color: "#4b5563" }}>
                {result.name}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
