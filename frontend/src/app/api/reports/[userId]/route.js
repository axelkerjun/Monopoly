import { Pool } from "pg";
import YahooFinance from "yahoo-finance2";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const yahooFinance = new YahooFinance();

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    if (!userId || isNaN(Number(userId))) {
      return Response.json({ error: "Invalid user ID." }, { status: 400 });
    }

    const transactions = await fetchTransactions(userId);
    const holdings = calculateHoldings(transactions);

    if (holdings.length === 0) {
      return Response.json(emptyReport());
    }

    const enrichedHoldings = await fetchQuotes(holdings);
    const historicalDataByTicker = await fetchHistoricalData(holdings);

    const summary = calculateSummary(transactions, enrichedHoldings);
    const exposureByTicker = calculateExposure(
      enrichedHoldings,
      summary.portfolioValue
    );

    const portfolioHistory = buildPortfolioHistory(
      transactions,
      historicalDataByTicker
    );

    return Response.json({
      success: true,
      summary,
      exposureByTicker,
      diversity: calculateDiversity(exposureByTicker),
      portfolioHistory,
      drawdownRisk: calculateDrawdown(portfolioHistory),
      multiPeriodReturns: calculateMultiPeriodReturns(portfolioHistory),
      correlationMatrix: calculateCorrelationMatrix(historicalDataByTicker),
    });
  } catch (error) {
    console.error("Reports API error:", error);

    return Response.json(
      {
        error: "Server error while generating reports.",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}

function emptyReport() {
  return {
    success: true,
    summary: {
      totalContributions: 0,
      netContributions: 0,
      portfolioValue: 0,
      totalReturns: 0,
      totalReturnPercent: 0,
    },
    exposureByTicker: [],
    diversity: {
      byAssetType: [],
      byMarket: [],
    },
    portfolioHistory: [],
    drawdownRisk: {
      maxDrawdownPercent: 0,
      maxDrawdownAmount: 0,
    },
    multiPeriodReturns: {},
    correlationMatrix: [],
  };
}

async function fetchTransactions(userId) {
  const result = await pool.query(
    `
    SELECT *
    FROM transactions
    WHERE user_id = $1
    ORDER BY transaction_date ASC, id ASC
    `,
    [userId]
  );

  return result.rows;
}

function calculateHoldings(transactions) {
  const holdings = new Map();

  for (const transaction of transactions) {
    const ticker = clean(transaction.ticker);
    const type = clean(transaction.type);
    const quantity = num(transaction.quantity);
    const price = num(transaction.price);

    if (!holdings.has(ticker)) {
      holdings.set(ticker, {
        ticker,
        quantity: 0,
        totalBuyCost: 0,
        totalBuyQuantity: 0,
      });
    }

    const holding = holdings.get(ticker);

    if (type === "BUY") {
      holding.quantity += quantity;
      holding.totalBuyCost += quantity * price;
      holding.totalBuyQuantity += quantity;
    }

    if (type === "SELL") {
      holding.quantity -= quantity;
    }
  }

  return Array.from(holdings.values())
    .filter((holding) => holding.quantity > 0)
    .map((holding) => ({
      ticker: holding.ticker,
      quantity: holding.quantity,
      avgPrice:
        holding.totalBuyQuantity > 0
          ? holding.totalBuyCost / holding.totalBuyQuantity
          : 0,
    }));
}

async function fetchQuotes(holdings) {
  return Promise.all(
    holdings.map(async (holding) => {
      const providerSymbol = normalizeYahooSymbol(holding.ticker);

      try {
        const quote = await yahooFinance.quote(providerSymbol);

        const price =
          quote.regularMarketPrice ??
          quote.postMarketPrice ??
          quote.preMarketPrice ??
          null;

        return buildHoldingReport(holding, quote, providerSymbol, price);
      } catch {
        return buildHoldingReport(holding, null, providerSymbol, null);
      }
    })
  );
}

function buildHoldingReport(holding, quote, providerSymbol, price) {
  const currentPrice = price === null ? null : num(price);
  const totalCost = holding.quantity * holding.avgPrice;
  const marketValue =
    currentPrice !== null ? holding.quantity * currentPrice : totalCost;

  const unrealizedPL = marketValue - totalCost;
  const unrealizedPLPercent =
    totalCost > 0 ? (unrealizedPL / totalCost) * 100 : 0;

  return {
    ticker: holding.ticker,
    providerSymbol,
    name: quote?.shortName || quote?.longName || holding.ticker,
    quantity: holding.quantity,
    avgPrice: round(holding.avgPrice),
    currentPrice,
    currency: quote?.currency || "USD",
    assetType: getAssetType(holding.ticker, quote),
    market: getMarket(holding.ticker, quote),
    totalCost,
    marketValue,
    unrealizedPL,
    unrealizedPLPercent,
    priceAvailable: currentPrice !== null,
  };
}

function calculateSummary(transactions, holdings) {
  const totalContributions = transactionValue(transactions, "BUY");
  const sellProceeds = transactionValue(transactions, "SELL");
  const netContributions = totalContributions - sellProceeds;

  const portfolioValue = sum(holdings, "marketValue");
  const totalCost = sum(holdings, "totalCost");
  const totalReturns = portfolioValue - totalCost;

  return {
    totalContributions: round(totalContributions),
    netContributions: round(netContributions),
    portfolioValue: round(portfolioValue),
    totalCost: round(totalCost),
    totalReturns: round(totalReturns),
    totalReturnPercent:
      totalCost > 0 ? round((totalReturns / totalCost) * 100) : 0,
  };
}

function transactionValue(transactions, targetType) {
  return transactions.reduce((total, transaction) => {
    if (clean(transaction.type) !== targetType) return total;

    return total + num(transaction.quantity) * num(transaction.price);
  }, 0);
}

function calculateExposure(holdings, portfolioValue) {
  return holdings.map((holding) => ({
    ticker: holding.ticker,
    name: holding.name,
    assetType: holding.assetType,
    market: holding.market,
    currency: holding.currency,
    quantity: holding.quantity,
    currentPrice: holding.currentPrice,
    totalCost: round(holding.totalCost),
    marketValue: round(holding.marketValue),
    allocationPercent:
      portfolioValue > 0
        ? round((holding.marketValue / portfolioValue) * 100)
        : 0,
    unrealizedPL: round(holding.unrealizedPL),
    unrealizedPLPercent: round(holding.unrealizedPLPercent),
  }));
}

function calculateDiversity(exposureByTicker) {
  return {
    byAssetType: groupAllocation(exposureByTicker, "assetType"),
    byMarket: groupAllocation(exposureByTicker, "market"),
  };
}

function groupAllocation(items, key) {
  const groups = new Map();

  for (const item of items) {
    const name = item[key] || "Unknown";
    groups.set(name, (groups.get(name) || 0) + num(item.allocationPercent));
  }

  return Array.from(groups.entries()).map(([name, allocationPercent]) => ({
    name,
    allocationPercent: round(allocationPercent),
  }));
}

async function fetchHistoricalData(holdings) {
  const entries = await Promise.all(
    holdings.map(async (holding) => {
      try {
        const providerSymbol = normalizeYahooSymbol(holding.ticker);

        const history = await yahooFinance.chart(providerSymbol, {
          period1: new Date("2024-01-01"),
          period2: new Date(),
          interval: "1d",
        });

        const prices = (history.quotes || [])
          .filter((item) => item.close !== null && item.close !== undefined)
          .map((item) => ({
            date: toDateOnly(item.date),
            close: num(item.close),
          }));

        return [holding.ticker, prices];
      } catch (error) {
        console.error(`History error for ${holding.ticker}:`, error.message);
        return [holding.ticker, []];
      }
    })
  );

  return Object.fromEntries(entries);
}

function buildPortfolioHistory(transactions, historicalDataByTicker) {
  const dates = [
    ...new Set(
      Object.values(historicalDataByTicker).flatMap((prices) =>
        prices.map((price) => price.date)
      )
    ),
  ].sort();

  const priceMaps = Object.fromEntries(
    Object.entries(historicalDataByTicker).map(([ticker, prices]) => [
      ticker,
      new Map(prices.map((price) => [price.date, price.close])),
    ])
  );

  const latestPrices = {};
  const history = [];

  for (const date of dates) {
    for (const [ticker, priceMap] of Object.entries(priceMaps)) {
      if (priceMap.has(date)) {
        latestPrices[ticker] = priceMap.get(date);
      }
    }

    const quantities = getQuantitiesAsOfDate(transactions, date);

    let value = 0;

    for (const [ticker, quantity] of Object.entries(quantities)) {
      if (quantity > 0 && latestPrices[ticker] !== undefined) {
        value += quantity * latestPrices[ticker];
      }
    }

    if (value > 0) {
      history.push({
        date,
        value: round(value),
      });
    }
  }

  return history;
}

function getQuantitiesAsOfDate(transactions, date) {
  const quantities = {};

  for (const transaction of transactions) {
    if (toDateOnly(transaction.transaction_date) > date) continue;

    const ticker = clean(transaction.ticker);
    const type = clean(transaction.type);
    const quantity = num(transaction.quantity);

    quantities[ticker] = quantities[ticker] || 0;

    if (type === "BUY") quantities[ticker] += quantity;
    if (type === "SELL") quantities[ticker] -= quantity;
  }

  return quantities;
}

function calculateDrawdown(portfolioHistory) {
  let peak = 0;
  let maxDrawdownPercent = 0;
  let maxDrawdownAmount = 0;

  for (const point of portfolioHistory) {
    peak = Math.max(peak, point.value);

    if (peak === 0) continue;

    const drawdownAmount = point.value - peak;
    const drawdownPercent = (drawdownAmount / peak) * 100;

    if (drawdownPercent < maxDrawdownPercent) {
      maxDrawdownPercent = drawdownPercent;
      maxDrawdownAmount = drawdownAmount;
    }
  }

  return {
    maxDrawdownPercent: round(maxDrawdownPercent),
    maxDrawdownAmount: round(maxDrawdownAmount),
  };
}

function calculateMultiPeriodReturns(portfolioHistory) {
  if (portfolioHistory.length === 0) return {};

  return {
    "1D": calculatePeriodReturn(portfolioHistory, 1),
    "1W": calculatePeriodReturn(portfolioHistory, 7),
    "1M": calculatePeriodReturn(portfolioHistory, 30),
    "3M": calculatePeriodReturn(portfolioHistory, 90),
    YTD: calculateYtdReturn(portfolioHistory),
    ALL: calculateAllTimeReturn(portfolioHistory),
  };
}

function calculatePeriodReturn(history, daysBack) {
  const latest = history[history.length - 1];
  const targetDate = new Date(latest.date);

  targetDate.setDate(targetDate.getDate() - daysBack);

  const past = findClosestPointOnOrBefore(
    history,
    targetDate.toISOString().split("T")[0]
  );

  return calculateReturn(latest, past);
}

function calculateYtdReturn(history) {
  const latest = history[history.length - 1];
  const year = new Date(latest.date).getFullYear();
  const past = findClosestPointOnOrAfter(history, `${year}-01-01`);

  return calculateReturn(latest, past);
}

function calculateAllTimeReturn(history) {
  return calculateReturn(history[history.length - 1], history[0]);
}

function calculateReturn(latest, past) {
  if (!past || past.value <= 0) return null;

  return round(((latest.value - past.value) / past.value) * 100);
}

function findClosestPointOnOrBefore(history, date) {
  return [...history].reverse().find((point) => point.date <= date) || null;
}

function findClosestPointOnOrAfter(history, date) {
  return history.find((point) => point.date >= date) || null;
}

const CORRELATION_LOOKBACK_DAYS = 90;

function calculateCorrelationMatrix(historicalDataByTicker) {
  const tickers = Object.keys(historicalDataByTicker);

  const returnsByTicker = Object.fromEntries(
    tickers.map((ticker) => [
      ticker,
      calculateDailyReturns(historicalDataByTicker[ticker]),
    ])
  );

  return tickers.map((tickerA) => ({
    ticker: tickerA,
    correlations: Object.fromEntries(
      tickers.map((tickerB) => {
        if (tickerA === tickerB) {
          return [tickerB, 1];
        }

        const correlation = calculateTrailingCorrelation(
          returnsByTicker[tickerA],
          returnsByTicker[tickerB],
          CORRELATION_LOOKBACK_DAYS
        );

        return [tickerB, correlation];
      })
    ),
  }));
}

function calculateTrailingCorrelation(returnsA, returnsB, lookbackDays) {
  const commonDates = [...returnsA.keys()]
    .filter((date) => returnsB.has(date))
    .sort()
    .slice(-lookbackDays);

  if (commonDates.length < 2) return null;

  const valuesA = commonDates.map((date) => returnsA.get(date));
  const valuesB = commonDates.map((date) => returnsB.get(date));

  const meanA = average(valuesA);
  const meanB = average(valuesB);

  let numerator = 0;
  let denominatorA = 0;
  let denominatorB = 0;

  for (let i = 0; i < commonDates.length; i++) {
    const diffA = valuesA[i] - meanA;
    const diffB = valuesB[i] - meanB;

    numerator += diffA * diffB;
    denominatorA += diffA * diffA;
    denominatorB += diffB * diffB;
  }

  const denominator = Math.sqrt(denominatorA * denominatorB);

  if (denominator === 0) return null;

  return round(numerator / denominator);
}

function calculateDailyReturns(prices) {
  const returns = new Map();

  for (let i = 1; i < prices.length; i++) {
    const previous = prices[i - 1];
    const current = prices[i];

    if (previous.close > 0) {
      returns.set(current.date, (current.close - previous.close) / previous.close);
    }
  }

  return returns;
}

function calculateCorrelation(returnsA, returnsB) {
  const commonDates = [...returnsA.keys()].filter((date) => returnsB.has(date));

  if (commonDates.length < 2) return null;

  const valuesA = commonDates.map((date) => returnsA.get(date));
  const valuesB = commonDates.map((date) => returnsB.get(date));

  const meanA = average(valuesA);
  const meanB = average(valuesB);

  let numerator = 0;
  let denominatorA = 0;
  let denominatorB = 0;

  for (let i = 0; i < commonDates.length; i++) {
    const diffA = valuesA[i] - meanA;
    const diffB = valuesB[i] - meanB;

    numerator += diffA * diffB;
    denominatorA += diffA * diffA;
    denominatorB += diffB * diffB;
  }

  const denominator = Math.sqrt(denominatorA * denominatorB);

  return denominator === 0 ? null : round(numerator / denominator);
}

function getAssetType(ticker, quote) {
  const quoteType = clean(quote?.quoteType);

  if (
    quoteType === "CRYPTOCURRENCY" ||
    ticker.includes("DIGITAL_CURRENCY") ||
    ticker.includes("/")
  ) {
    return "Crypto";
  }

  if (quoteType === "ETF" || ticker.endsWith(":ETF")) {
    return "ETF";
  }

  return "Stock";
}

function getMarket(ticker, quote) {
  const exchangeName = String(quote?.fullExchangeName || quote?.exchange || "");

  if (
    ticker.includes("DIGITAL_CURRENCY") ||
    ticker.includes("/") ||
    quote?.quoteType === "CRYPTOCURRENCY"
  ) {
    return "Crypto";
  }

  if (
    ticker.endsWith(":SGX") ||
    ticker.endsWith(".SI") ||
    exchangeName.toLowerCase().includes("singapore")
  ) {
    return "Singapore";
  }

  return "United States";
}

function normalizeYahooSymbol(rawSymbol) {
  const symbol = clean(rawSymbol);

  if (symbol.endsWith(":SGX")) {
    return symbol.replace(":SGX", ".SI");
  }

  if (symbol.endsWith(":DIGITAL_CURRENCY")) {
    return symbol.replace(":DIGITAL_CURRENCY", "").replace("/", "-");
  }

  if (symbol.includes("/")) {
    return symbol.replace("/", "-");
  }

  if (symbol.endsWith(":STOCK")) {
    return symbol.replace(":STOCK", "");
  }

  if (symbol.endsWith(":ETF")) {
    return symbol.replace(":ETF", "");
  }

  return symbol;
}

function clean(value) {
  return String(value || "").trim().toUpperCase();
}

function num(value) {
  return Number(value) || 0;
}

function sum(items, key) {
  return items.reduce((total, item) => total + num(item[key]), 0);
}

function average(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function toDateOnly(value) {
  return value instanceof Date
    ? value.toISOString().split("T")[0]
    : String(value).split("T")[0];
}

function round(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }

  return Number(Number(value).toFixed(2));
}