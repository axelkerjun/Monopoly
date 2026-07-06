export const dynamic = 'force-dynamic'; // Forces Vercel to compute the page live on request

import styles from './styles.module.css';

export default async function StockDetailPage({ params }) {
  const { symbol } = await params;

  // Resolves local development vs. Vercel production hosting URLs seamlessly
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const res = await fetch(`${baseUrl}/api/market/summary?symbol=${symbol.toUpperCase()}`, {
    cache: 'no-store' // Critical to prevent stale financial information bundles
  });

  if (!res.ok) {
    return (
      <div className={styles.errorBox}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>Stock code not found</h2>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>We couldn't retrieve records for "{symbol}".</p>
      </div>
    );
  }

  const { overview, profile, ratios, news } = await res.json();

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        
        {/* HEADER BLOCK */}
        <header className={`${styles.card} ${styles.header}`}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>{overview.symbol}</h1>
              <span className={styles.tickerBadge}>{overview.exchange}</span>
            </div>
            <p style={{ color: '#64748b', margin: '4px 0 0 0', fontWeight: '500' }}>{overview.name}</p>
          </div>
          
          <div className={styles.priceBlock}>
            <div className={styles.price}>
              ${overview.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className={`${styles.changeBadge} ${overview.change >= 0 ? styles.positive : styles.negative}`}>
              {overview.change >= 0 ? '▲ +' : '▼ '}{overview.change?.toFixed(2)} ({overview.changesPercentage?.toFixed(2)}%)
            </span>
          </div>
        </header>

        {/* DASHBOARD GRID */}
        <div className={styles.grid}>
          
          {/* MAIN CONTENT STACK */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* PROFILE SECTION */}
            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Company Profile</h2>
              <div className={styles.profileGrid}>
                <div className={styles.profilePill}>
                  <span className={styles.pillLabel}>Sector</span>
                  <p className={styles.pillValue}>{profile.sector || '—'}</p>
                </div>
                <div className={styles.profilePill}>
                  <span className={styles.pillLabel}>Industry</span>
                  <p className={styles.pillValue}>{profile.industry || '—'}</p>
                </div>
                <div className={styles.profilePill}>
                  <span className={styles.pillLabel}>Market Cap</span>
                  <p className={styles.pillValue}>
                    {overview.marketCap ? `$${(overview.marketCap / 1e9).toFixed(2)}B` : '—'}
                  </p>
                </div>
              </div>
              <div>
                <span className={styles.pillLabel} style={{ marginBottom: '6px' }}>Business Summary</span>
                <p className={styles.description}>{profile.description || "No corporate records listed."}</p>
              </div>
            </section>

            {/* FINANCIAL RATIOS */}
            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Valuation Metrics</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 24px' }}>
                {[
                  { label: "P/E Ratio (TTM)", val: ratios.peRatioTTM?.toFixed(2) },
                  { label: "P/B Ratio (TTM)", val: ratios.priceToBookRatioTTM?.toFixed(2) },
                  { label: "Return on Equity", val: ratios.returnOnEquityTTM ? `${(ratios.returnOnEquityTTM * 100).toFixed(2)}%` : null },
                  { label: "Return on Assets", val: ratios.returnOnAssetsTTM ? `${(ratios.returnOnAssetsTTM * 100).toFixed(2)}%` : null },
                  { label: "Net Profit Margin", val: ratios.netProfitMarginTTM ? `${(ratios.netProfitMarginTTM * 100).toFixed(2)}%` : null },
                  { label: "Debt to Equity", val: ratios.debtToEquityTTM?.toFixed(2) }
                ].map((item, index) => (
                  <div key={index} className={styles.ratioRow}>
                    <span style={{ color: '#64748b' }}>{item.label}</span>
                    <span className={styles.ratioValue}>{item.val || '—'}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* SIDEBAR NEWS BLOCK */}
          <section className={styles.card} style={{ height: 'fit-content' }}>
            <h2 className={styles.sectionTitle}>Recent News</h2>
            {news.length === 0 ? (
              <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px', textAlign: 'center' }}>No recent coverage logs.</p>
            ) : (
              <div className={styles.newsList}>
                {news.map((article, idx) => (
                  <div key={idx} className={styles.newsCard}>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <h3>{article.title}</h3>
                      <div className={styles.newsMeta}>
                        <span style={{ color: '#2563eb', fontWeight: '600' }}>{article.site}</span>
                        <span>{new Date(article.publishedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
