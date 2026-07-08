"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";

export default function StockSentiment({ symbol }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNews, setShowNews] = useState(false);

  useEffect(() => {
    async function loadSentiment() {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/market/sentiment?symbol=${encodeURIComponent(symbol)}`
        );

        const json = await res.json();

        setData(json);
      } catch (error) {
        console.error("Failed to load sentiment:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    if (symbol) loadSentiment();
  }, [symbol]);

  if (loading) {
    return (
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>NLP Sentiment Analysis</h2>
        <p className={styles.description}>Analyzing recent news...</p>
      </section>
    );
  }

  if (!data || data.error) {
    return (
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>NLP Sentiment Analysis</h2>
        <p className={styles.description}>
          Sentiment analysis is unavailable for this stock.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>NLP Sentiment Analysis</h2>

      <div className={styles.sentimentSummary}>
        <div>
          <span className={styles.pillLabel}>Overall Sentiment</span>
          <p className={styles.sentimentLabel}>{data.overall.label}</p>
        </div>

        <div>
          <span className={styles.pillLabel}>Sentiment Score</span>
          <p className={styles.sentimentLabel}>{data.overall.score}</p>
        </div>

        <div>
          <span className={styles.pillLabel}>Articles Analyzed</span>
          <p className={styles.sentimentLabel}>
            {data.overall.articlesAnalyzed}
          </p>
        </div>
      </div>

      <div className={styles.sentimentCounts}>
        <span>Bullish: {data.overall.counts.bullish}</span>
        <span>Neutral: {data.overall.counts.neutral}</span>
        <span>Bearish: {data.overall.counts.bearish}</span>
      </div>

      <div className={styles.hiddenNewsSection}>
  <button
    className={styles.newsToggleButton}
    onClick={() => setShowNews(!showNews)}
  >
    <span>
      {showNews ? "Hide analysed news" : "Show analysed news"}
    </span>
    <span>{showNews ? "▲" : "▼"}</span>
  </button>

  {showNews && (
    <div className={styles.sentimentNewsList}>
      {data.articles.map((article, index) => {
        const confidence = Math.round(article.sentiment.confidence * 100);

        return (
          <div key={index} className={styles.sentimentNewsItem}>
            <div className={styles.sentimentNewsText}>
              <h3>{article.title}</h3>
              <p>{article.site || "Unknown source"}</p>
            </div>

            <div
              className={`${styles.sentimentResultBox} ${
                article.sentiment.label === "Bullish"
                  ? styles.bullishSentiment
                  : article.sentiment.label === "Bearish"
                  ? styles.bearishSentiment
                  : styles.neutralSentiment
              }`}
            >
              <strong>{article.sentiment.label}</strong>
              <span>{confidence}% confidence</span>
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>
    </section>
  );
}