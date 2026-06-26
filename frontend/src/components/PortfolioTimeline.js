"use client";

const colors = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c"];

import { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function formatMoney(value, currency) {
    return Number(value || 0).toLocaleString(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    });
}

export default function PortfolioTimeline({ userId }) {
    const [timeline, setTimeline] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchTimeline() {
            if (!userId) return;

            try {
                setLoading(true);
                setError("");

                const response = await fetch(`/api/portfolio/timeline/${userId}`, {
                    cache: "no-store",
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to load timeline");
                }

                setTimeline(data.timeline || []);
                setCurrencies(data.currencies || []);
            } catch (err) {
                setError(err.message || "Failed to load portfolio timeline");
            } finally {
                setLoading(false);
            }
        }

        fetchTimeline();
    }, [userId]);

    if (loading) {
        return <p className="subtitle">Loading portfolio timeline...</p>;
    }

    if (error) {
        return <div className="message error">{error}</div>;
    }

    if (timeline.length === 0) {
        return <p className="subtitle">No timeline data yet.</p>;
    }

    const chartData = {
        labels: timeline.map((row) => row.date),
        datasets: currencies.map((currency, index) => ({
            label: `${currency} Portfolio Value`,
            data: timeline.map((row) => row[currency] || 0),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length],
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
        })),
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "index",
            intersect: false,
        },
        plugins: {
            legend: {
                position: "top",
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const currency = context.dataset.label.split(" ")[0];
                        return `${context.dataset.label}: ${formatMoney(
                            context.raw,
                            currency
                        )}`;
                    },
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    maxTicksLimit: 8,
                },
            },
            y: {
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="holdingsSection">
            <h2 className="holdingsTitle">Portfolio Timeline</h2>

            <div
                className="tableWrap"
                style={{
                    height: "360px",
                    padding: "20px",
                }}
            >
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
}