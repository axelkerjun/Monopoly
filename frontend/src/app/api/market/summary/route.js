import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance(); 

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // 1. Core modules only (removing 'news' so it passes strict validation)
    const queryOptions = { modules: ['price', 'summaryDetail', 'defaultKeyStatistics'] };

    // 2. Fetch both the core metrics and news in parallel for peak performance!
    const [rawData, searchData] = await Promise.all([
      yahooFinance.quoteSummary(symbol, queryOptions),
      yahooFinance.search(symbol).catch(() => ({ news: [] })) // Safe fallback if search breaks
    ]);

    if (!rawData) {
      return NextResponse.json({ error: 'Unable to find this stock.' }, { status: 404 });
    }

    // Shaping the data cleanly to feed your frontend layout
    return NextResponse.json({
      overview: {
        symbol: rawData.price?.symbol || symbol,
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
      // 3. Extract the news safely from the news array
      news: (searchData.news || []).slice(0, 8).map(article => ({
        title: article.title,
        url: article.link,
        site: article.publisher,
        publishedDate: article.providerPublishTime ? article.providerPublishTime * 1000 : Date.now()
      }))
    });
  } catch (error) {
    console.error('Yahoo Finance Fetch Error:', error);
    return NextResponse.json({ error: 'Unable to find this stock.' }, { status: 404 });
  }
}
