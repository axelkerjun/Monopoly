// frontend/src/app/utils/marketData.js
import YahooFinance from 'yahoo-finance2';

// Safe instantiation inside Next.js Server setups
const yahooFinance = new YahooFinance(); 

export async function getMarketSummary(symbol) {
  if (!symbol) return null;
  const cleanSymbol = symbol.toUpperCase();

  try {
    const queryOptions = { modules: ['price', 'summaryDetail', 'defaultKeyStatistics'] };

    // Executing your exact parallel performance data calls!
    const [rawData, searchData] = await Promise.all([
      yahooFinance.quoteSummary(cleanSymbol, queryOptions),
      yahooFinance.search(cleanSymbol).catch(() => ({ news: [] }))
    ]);

    if (!rawData) return null;

    // Returns the data structured identically to what your frontend elements expect
    return {
      overview: {
        symbol: rawData.price?.symbol || cleanSymbol,
        name: rawData.price?.longName || rawData.price?.shortName || 'Unknown Name',
        price: rawData.price?.regularMarketPrice,
        change: rawData.price?.regularMarketChange,
        changesPercentage: rawData.price?.regularMarketChangePercent ? rawData.price.regularMarketChangePercent * 100 : 0,
        exchange: rawData.price?.exchangeName || 'N/A',
        currency: rawData.price?.currency || 'USD',
        marketCap: rawData.price?.marketCap || 0,
      },
      profile: {
        sector: rawData.summaryDetail?.sector || 'N/A',
        industry: rawData.summaryDetail?.industry || 'N/A',
        description: rawData.summaryDetail?.longBusinessSummary || 'No description available.',
      },
      ratios: {
        peRatioTTM: rawData.summaryDetail?.trailingPE || null,
        priceToBookRatioTTM: rawData.defaultKeyStatistics?.priceToBook || null,
        returnOnEquityTTM: rawData.defaultKeyStatistics?.returnOnEquity || null,
        returnOnAssetsTTM: rawData.defaultKeyStatistics?.returnOnAssets || null,
        netProfitMarginTTM: rawData.defaultKeyStatistics?.profitMargins || null,
        debtToEquityTTM: rawData.defaultKeyStatistics?.debtToEquity || null,
      },
      news: (searchData.news || []).slice(0, 8).map(article => ({
        title: article.title,
        url: article.link,
        site: article.publisher,
        publishedDate: article.providerPublishTime ? article.providerPublishTime * 1000 : Date.now()
      }))
    };
  } catch (error) {
    console.error('Yahoo Finance Data Engine Error:', error);
    return null;
  }
}
