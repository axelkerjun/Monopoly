// frontend/src/app/utils/marketData.js
import YahooFinance from "yahoo-finance2";

// Safe instantiation inside Next.js Server setups
const yahooFinance = new YahooFinance();

function normalizeYahooDate(value) {
  if (!value) return null;

  const timestamp = Number(value);
  return timestamp;
}

export async function getMarketSummary(symbol) {
  if (!symbol) return null;

  const cleanSymbol = decodeURIComponent(symbol).trim().toUpperCase();

  try {
    const queryOptions = {
      modules: [
        "price",
        "summaryDetail",
        "defaultKeyStatistics",
        "assetProfile",
        "financialData",
      ],
    };

    const [rawData, searchData] = await Promise.all([
      yahooFinance.quoteSummary(cleanSymbol, queryOptions),
      yahooFinance
        .search(
          cleanSymbol,
          {
            quotesCount: 0,
            newsCount: 20,
          },
          {
            validateResult: false,
          }
        )
        .catch(() => ({ news: [] })),
    ]);

    if (!rawData) return null;

    const news = (searchData.news || [])
      .filter((article) => article.title && article.link && article.providerPublishTime)
      .sort((a, b) => {
        return (
          normalizeYahooDate(b.providerPublishTime) -
          normalizeYahooDate(a.providerPublishTime)
        );
      })
      .slice(0, 10)
      .map((article) => ({
        title: article.title,
        url: article.link,
        site: article.publisher || "Unknown source",
        publishedDate: normalizeYahooDate(article.providerPublishTime),
      }));

    return {
      overview: {
        symbol: rawData.price?.symbol || cleanSymbol,
        name:
          rawData.price?.longName ||
          rawData.price?.shortName ||
          "Unknown Name",
        price: rawData.price?.regularMarketPrice,
        change: rawData.price?.regularMarketChange,
        changesPercentage: rawData.price?.regularMarketChangePercent
          ? rawData.price.regularMarketChangePercent * 100
          : 0,
        exchange: rawData.price?.exchangeName || "N/A",
        currency: rawData.price?.currency || "USD",
        marketCap: rawData.price?.marketCap || 0,
      },

      profile: {
        sector: rawData.assetProfile?.sector || "N/A",
        industry: rawData.assetProfile?.industry || "N/A",
        description:
          rawData.assetProfile?.longBusinessSummary ||
          "No description available.",
      },

      ratios: {
        peRatioTTM:
          rawData.summaryDetail?.trailingPE ??
          rawData.defaultKeyStatistics?.trailingPE ??
          null,

        priceToBookRatioTTM:
          rawData.defaultKeyStatistics?.priceToBook ?? null,

        returnOnEquityTTM:
          rawData.financialData?.returnOnEquity ??
          rawData.defaultKeyStatistics?.returnOnEquity ??
          null,

        returnOnAssetsTTM:
          rawData.financialData?.returnOnAssets ??
          rawData.defaultKeyStatistics?.returnOnAssets ??
          null,

        netProfitMarginTTM:
          rawData.financialData?.profitMargins ??
          rawData.defaultKeyStatistics?.profitMargins ??
          null,

        debtToEquityTTM:
          rawData.financialData?.debtToEquity ??
          rawData.defaultKeyStatistics?.debtToEquity ??
          null,
      },

      news,
    };
  } catch (error) {
    console.error("Yahoo Finance Data Engine Error:", error);
    return null;
  }
}