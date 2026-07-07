"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import styles from "./styles.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

const ranges = ["1M", "3M", "6M", "YTD", "1Y", "ALL"];

function getStartDate(range) {
  const now = new Date();
  const start = new Date();

  if (range === "1M") start.setMonth(now.getMonth() - 1);
  else if (range === "3M") start.setMonth(now.getMonth() - 3);
  else if (range === "6M") start.setMonth(now.getMonth() - 6);
  else if (range === "YTD") start.setFullYear(now.getFullYear(), 0, 1);
  else if (range === "1Y") start.setFullYear(now.getFullYear() - 1);
  else return null;

  return start;
}

function formatCurrency(value, currency) {
  if (value === null || value === undefined) return "-";

  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  });
}

export default function StockChart({ symbol, currency }) {
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState("6M");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/market/history?symbol=${encodeURIComponent(symbol)}`
        );

        const data = await res.json();

        setHistory(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load stock chart:", error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }

    if (symbol) loadHistory();
  }, [symbol]);

  const filteredHistory = useMemo(() => {
    const startDate = getStartDate(range);

    if (!startDate) return history;

    return history.filter((item) => new Date(item.date) >= startDate);
  }, [history, range]);

  const firstClose = filteredHistory[0]?.close;
  const lastClose = filteredHistory[filteredHistory.length - 1]?.close;

  const changePercent =
    firstClose && lastClose
      ? ((lastClose - firstClose) / firstClose) * 100
      : null;

  const chartData = {
    labels: filteredHistory.map((item) => item.date),
    datasets: [
      {
        label: `${symbol} Close Price`,
        data: filteredHistory.map((item) => item.close),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.08)",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.25,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Close: ${formatCurrency(context.raw, currency)}`;
          },
        },
      },
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 8,
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          callback: function (value) {
            return formatCurrency(value, currency);
          },
        },
      },
    },
  };

  return (
    <section className={styles.card}>
      <div className={styles.chartHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Price Chart</h2>

          <p className={styles.chartSubtext}>
            {range} performance{" "}
            {changePercent !== null && (
              <strong
                className={
                  changePercent >= 0 ? styles.positiveText : styles.negativeText
                }
              >
                {changePercent >= 0 ? "+" : ""}
                {changePercent.toFixed(2)}%
              </strong>
            )}
          </p>
        </div>

        <div className={styles.timelineButtons}>
          {ranges.map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={range === item ? styles.activeTimelineButton : ""}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className={styles.chartMessage}>Loading chart...</p>
      ) : filteredHistory.length === 0 ? (
        <p className={styles.chartMessage}>No chart data available.</p>
      ) : (
        <div className={styles.chartBox}>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </section>
  );
}