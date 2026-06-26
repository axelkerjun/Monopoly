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

    const result = await pool.query(
      `
      SELECT id, ticker, type, quantity, price, transaction_date
      FROM transactions
      WHERE user_id = $1
      ORDER BY transaction_date ASC, id ASC
      `,
      [userId]
    );

    const transactions = result.rows.map((tx) => ({
      ticker: String(tx.ticker).toUpperCase(),
      type: String(tx.type).toUpperCase(),
      quantity: Number(tx.quantity),
      price: Number(tx.price),
      date: toDateKey(tx.transaction_date),
    }));

    if (transactions.length === 0) {
      return Response.json({
        success: true,
        currencies: [],
        timeline: [],
      });
    }

    const tickers = [...new Set(transactions.map((tx) => tx.ticker))];
    const firstDate = transactions[0].date;

    const historyResults = await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const history = await getYahooHistory(ticker, firstDate);
          return [ticker, history];
        } catch (error) {
          console.error(`History error for ${ticker}:`, error.message);
          return [ticker, null];
        }
      })
    );

    const histories = Object.fromEntries(historyResults);

    const currencies = [
      ...new Set(
        Object.values(histories)
          .filter(Boolean)
          .map((history) => history.currency || "USD")
      ),
    ].sort();

    const allDates = [
      ...new Set(
        Object.values(histories)
          .filter(Boolean)
          .flatMap((history) => Object.keys(history.prices))
      ),
    ].sort();

    const positions = {};
    const latestPrices = {};
    const timeline = [];

    tickers.forEach((ticker) => {
      positions[ticker] = 0;
      latestPrices[ticker] = null;
    });

    let txIndex = 0;

    for (const date of allDates) {
      for (const ticker of tickers) {
        const history = histories[ticker];

        if (history?.prices?.[date] !== undefined) {
          latestPrices[ticker] = history.prices[date];
        }
      }

      while (
        txIndex < transactions.length &&
        transactions[txIndex].date <= date
      ) {
        const tx = transactions[txIndex];

        if (tx.type === "BUY") {
          positions[tx.ticker] += tx.quantity;
        } else if (tx.type === "SELL") {
          positions[tx.ticker] -= tx.quantity;
        }

        txIndex++;
      }

      const row = { date };

      currencies.forEach((currency) => {
        row[currency] = 0;
      });

      for (const ticker of tickers) {
        const history = histories[ticker];
        const currency = history?.currency || "USD";
        const quantity = positions[ticker];
        const price = latestPrices[ticker];

        if (quantity > 0 && price !== null) {
          row[currency] += quantity * price;
        }
      }

      currencies.forEach((currency) => {
        row[currency] = Number(row[currency].toFixed(2));
      });

      if (currencies.some((currency) => row[currency] > 0)) {
        timeline.push(row);
      }
    }

    return Response.json({
      success: true,
      currencies,
      timeline,
    });
  } catch (error) {
    console.error("Portfolio timeline error:", error);

    return Response.json(
      {
        error: "Server error while creating portfolio timeline.",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}

async function getYahooHistory(rawTicker, firstDate) {
  const symbol = normalizeYahooSymbol(rawTicker);

  const result = await yahooFinance.chart(symbol, {
    period1: new Date(firstDate),
    period2: new Date(),
    interval: "1d",
  });

  if (!result?.quotes?.length) {
    throw new Error(`No price history found for ${symbol}`);
  }

  const prices = {};

  result.quotes.forEach((item) => {
    if (item.close !== null && item.close !== undefined) {
      prices[toDateKey(item.date)] = Number(item.close);
    }
  });

  return {
    symbol,
    currency: result.meta?.currency || "USD",
    prices,
  };
}

function normalizeYahooSymbol(rawSymbol) {
  const symbol = rawSymbol.trim().toUpperCase();

  if (symbol.endsWith(":SGX")) {
    return symbol.replace(":SGX", ".SI");
  }

  if (symbol.endsWith(":DIGITAL_CURRENCY")) {
    return symbol.replace(":DIGITAL_CURRENCY", "").replace("/", "-");
  }

  if (symbol.includes("/")) {
    return symbol.replace("/", "-");
  }

  const suffixes = [":STOCK", ":ETF"];

  for (const suffix of suffixes) {
    if (symbol.endsWith(suffix)) {
      return symbol.slice(0, -suffix.length);
    }
  }

  return symbol;
}

function toDateKey(value) {
  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
}