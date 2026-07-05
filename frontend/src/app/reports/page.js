"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import Navbar from "@/components/Navbar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

function formatMoney(value) {
  return (Number(value) || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function formatPercent(value) {
  return value === null || value === undefined
    ? "N/A"
    : `${Number(value).toFixed(2)}%`;
}

function formatTicker(ticker) {
  const value = String(ticker || "").toUpperCase();

  if (value.endsWith(":DIGITAL_CURRENCY")) {
    return value.replace(":DIGITAL_CURRENCY", "").replace("/", "-");
  }

  return value;
}

function buildDoughnutData(items) {
  return {
    labels: items.map((item) => item.name),
    datasets: [
      {
        data: items.map((item) => Number(item.allocationPercent) || 0),
        backgroundColor: [
          "#2563eb",
          "#16a34a",
          "#f97316",
          "#dc2626",
          "#9333ea",
          "#0891b2",
        ],
        borderWidth: 1,
      },
    ],
  };
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom" },
    tooltip: {
      callbacks: {
        label: (context) =>
          `${context.label}: ${Number(context.raw).toFixed(2)}%`,
      },
    },
  },
};

function filterPortfolioHistory(history, range) {
  if (!Array.isArray(history) || history.length === 0) return [];
  if (range === "ALL") return history;

  const latestDate = new Date(history[history.length - 1].date);
  let startDate = new Date(latestDate);

  if (range === "3M") startDate.setMonth(startDate.getMonth() - 3);
  if (range === "6M") startDate.setMonth(startDate.getMonth() - 6);
  if (range === "1Y") startDate.setFullYear(startDate.getFullYear() - 1);
  if (range === "YTD") startDate = new Date(latestDate.getFullYear(), 0, 1);

  return history.filter((point) => new Date(point.date) >= startDate);
}

function getCorrelationColor(value) {
  if (value === null || value === undefined) return "#f3f4f6";

  const num = Math.max(-1, Math.min(1, Number(value)));

  if (num < 0) {
    const intensity = Math.abs(num);
    return `rgb(220, ${Math.round(255 - intensity * 120)}, ${Math.round(
      255 - intensity * 120
    )})`;
  }

  return `rgb(${Math.round(255 - num * 130)}, 220, ${Math.round(
    255 - num * 130
  )})`;
}

export default function ReportsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartRange, setChartRange] = useState("1Y");
  const [sortConfig, setSortConfig] = useState({
    key: "allocationPercent",
    direction: "desc",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");

    if (!storedUser) {
      router.push("/");
      return;
    }

    setUser(JSON.parse(storedUser));
  }, [router]);

  useEffect(() => {
    async function fetchReport() {
      if (!user) return;

      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/reports/${user.id}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load reports");
        }

        setReport(data);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [user]);

  const summary = report?.summary || {};
  const exposureByTicker = report?.exposureByTicker || [];
  const diversity = report?.diversity || {};
  const portfolioHistory = report?.portfolioHistory || [];
  const drawdownRisk = report?.drawdownRisk || {};
  const multiPeriodReturns = report?.multiPeriodReturns || {};
  const correlationMatrix = report?.correlationMatrix || [];

  const filteredPortfolioHistory = useMemo(
    () => filterPortfolioHistory(portfolioHistory, chartRange),
    [portfolioHistory, chartRange]
  );

  const sortedExposureByTicker = useMemo(() => {
    const direction = sortConfig.direction === "asc" ? 1 : -1;

    return [...exposureByTicker].sort((a, b) => {
      if (sortConfig.key === "ticker") {
        return String(a.ticker).localeCompare(String(b.ticker)) * direction;
      }

      return (
        ((Number(a[sortConfig.key]) || 0) -
          (Number(b[sortConfig.key]) || 0)) *
        direction
      );
    });
  }, [exposureByTicker, sortConfig]);

  function handleSort(key) {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }

  function getSortArrow(key) {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  }

  if (!user) return null;

  if (loading || error) {
    return (
      <PageShell>
        {loading ? (
          <p className="subtitle">Loading reports...</p>
        ) : (
          <div className="message error">{error}</div>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell user={user}>
      <section className="reportGrid4">
        <ReportCard
          title="Total Contributions"
          value={formatMoney(summary.totalContributions)}
        />
        <ReportCard
          title="Portfolio Value"
          value={formatMoney(summary.portfolioValue)}
        />
        <ReportCard
          title="Total Returns"
          value={formatMoney(summary.totalReturns)}
          positive={summary.totalReturns >= 0}
        />
        <ReportCard
          title="Max Drawdown"
          value={formatPercent(drawdownRisk.maxDrawdownPercent)}
          positive={false}
        />
      </section>

      <section className="reportGrid2">
        <ExposureTable
          items={sortedExposureByTicker}
          handleSort={handleSort}
          getSortArrow={getSortArrow}
        />

        <DiversityPanel diversity={diversity} />
      </section>

      <section className="reportGrid2">
        <PortfolioChart
          history={filteredPortfolioHistory}
          chartRange={chartRange}
          setChartRange={setChartRange}
        />

        <ReturnsPanel
          multiPeriodReturns={multiPeriodReturns}
          drawdownRisk={drawdownRisk}
        />
      </section>

      <CorrelationMatrix correlationMatrix={correlationMatrix} />
    </PageShell>
  );
}

function PageShell({ user, children }) {
  return (
    <main className="pageWide">
      <div className="cardWide">
        <Navbar />

        {user && (
          <>
            <h1 className="dashboardTitle">Portfolio Reports</h1>

            <p className="centerText">
              Logged in as: <strong>{user.email}</strong>
            </p>

            <hr className="hr" />
          </>
        )}

        {children}
      </div>
    </main>
  );
}

function ReportCard({ title, value, positive }) {
  let color = "#111827";
  if (positive === true) color = "#16a34a";
  if (positive === false) color = "#dc2626";

  return (
    <div className="reportCard">
      <p className="reportCardTitle">{title}</p>
      <h2 style={{ color }}>{value}</h2>
    </div>
  );
}

function ExposureTable({ items, handleSort, getSortArrow }) {
  const sortableHeaders = [
    ["ticker", "Ticker"],
    ["marketValue", "Value"],
    ["allocationPercent", "Allocation"],
  ];

  return (
    <div className="reportPanel">
      <h2 className="holdingsTitle">Exposure by Ticker</h2>

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              {sortableHeaders.slice(0, 1).map(([key, label]) => (
                <SortHeader
                  key={key}
                  label={label}
                  sortKey={key}
                  handleSort={handleSort}
                  getSortArrow={getSortArrow}
                />
              ))}
              <th>Type</th>
              <th>Market</th>
              {sortableHeaders.slice(1).map(([key, label]) => (
                <SortHeader
                  key={key}
                  label={label}
                  sortKey={key}
                  handleSort={handleSort}
                  getSortArrow={getSortArrow}
                />
              ))}
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.ticker}>
                <td style={{ fontWeight: 700 }} title={item.ticker}>
                  {formatTicker(item.ticker)}
                </td>
                <td>{item.assetType}</td>
                <td>{item.market}</td>
                <td>{formatMoney(item.marketValue)}</td>
                <td>{formatPercent(item.allocationPercent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortHeader({ label, sortKey, handleSort, getSortArrow }) {
  return (
    <th>
      <button
        className="sortButton"
        type="button"
        onClick={() => handleSort(sortKey)}
      >
        {label} {getSortArrow(sortKey)}
      </button>
    </th>
  );
}

function DiversityPanel({ diversity }) {
  return (
    <div className="reportPanel">
      <h2 className="holdingsTitle">Diversity</h2>

      <div className="doughnutGrid">
        <DoughnutBlock title="By Asset Type" items={diversity.byAssetType} />
        <DoughnutBlock title="By Market" items={diversity.byMarket} />
      </div>
    </div>
  );
}

function DoughnutBlock({ title, items = [] }) {
  return (
    <div>
      <h3 className="reportSubheading">{title}</h3>

      {items.length === 0 ? (
        <p className="subtitle">No data.</p>
      ) : (
        <div className="doughnutBox">
          <Doughnut data={buildDoughnutData(items)} options={doughnutOptions} />
        </div>
      )}
    </div>
  );
}

function PortfolioChart({ history, chartRange, setChartRange }) {
  return (
    <div className="reportPanel">
      <h2 className="holdingsTitle">Portfolio Value Over Time</h2>

      <div className="chartRangeButtons">
        {["3M", "6M", "1Y", "YTD", "ALL"].map((range) => (
          <button
            key={range}
            type="button"
            className={
              chartRange === range
                ? "chartRangeButton active"
                : "chartRangeButton"
            }
            onClick={() => setChartRange(range)}
          >
            {range}
          </button>
        ))}
      </div>

      {history.length === 0 ? (
        <p className="subtitle">Not enough historical data yet.</p>
      ) : (
        <div style={{ width: "100%", height: 320 }}>
          <Line
            data={{
              labels: history.map((point) => point.date),
              datasets: [
                {
                  label: "Portfolio Value",
                  data: history.map((point) => point.value),
                  borderColor: "#16a34a",
                  borderWidth: 2,
                  tension: 0.3,
                  pointRadius: 0,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true },
                tooltip: {
                  callbacks: {
                    label: (context) =>
                      `Portfolio Value: ${formatMoney(context.raw)}`,
                  },
                },
              },
              scales: {
                y: {
                  ticks: {
                    callback: (value) => "$" + value,
                  },
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}

function ReturnsPanel({ multiPeriodReturns, drawdownRisk }) {
  return (
    <div className="reportPanel">
      <h2 className="holdingsTitle">Multi-period Returns</h2>

      <div className="miniList">
        {Object.entries(multiPeriodReturns).map(([period, value]) => (
          <div className="miniListRow" key={period}>
            <span>{period}</span>
            <strong style={{ color: Number(value) >= 0 ? "#16a34a" : "#dc2626" }}>
              {formatPercent(value)}
            </strong>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "24px" }}>
        <h3 className="reportSubheading">Drawdown Risk</h3>

        <div className="miniList">
          <div className="miniListRow">
            <span>Max Drawdown %</span>
            <strong style={{ color: "#dc2626" }}>
              {formatPercent(drawdownRisk.maxDrawdownPercent)}
            </strong>
          </div>

          <div className="miniListRow">
            <span>Max Drawdown Amount</span>
            <strong style={{ color: "#dc2626" }}>
              {formatMoney(drawdownRisk.maxDrawdownAmount)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function CorrelationMatrix({ correlationMatrix }) {
  return (
    <section className="reportPanel fullWidth">
      <h2 className="holdingsTitle">Correlation Matrix</h2>

      {correlationMatrix.length === 0 ? (
        <p className="subtitle">Not enough price history for correlation.</p>
      ) : (
        <div className="correlationTableWrap">
          <table className="table correlationTable">
            <thead>
              <tr>
                <th className="correlationCorner"></th>
                {correlationMatrix.map((row) => (
                  <th className="correlationHeaderCell" key={row.ticker}>
                    <div className="rotatedTicker" title={row.ticker}>
                      {formatTicker(row.ticker)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {correlationMatrix.map((row) => (
                <tr key={row.ticker}>
                  <td className="correlationRowHeader" title={row.ticker}>
                    {formatTicker(row.ticker)}
                  </td>

                  {correlationMatrix.map((column) => {
                    const value = row.correlations[column.ticker];

                    return (
                      <td
                        className="correlationCell"
                        key={column.ticker}
                        style={{ backgroundColor: getCorrelationColor(value) }}
                      >
                        {value === null || value === undefined
                          ? "N/A"
                          : Number(value).toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}