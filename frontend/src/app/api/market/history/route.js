import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const rawSymbol = searchParams.get("symbol");

    if (!rawSymbol) {
      return Response.json(
        { error: "Missing symbol" },
        { status: 400 }
      );
    }

    const symbol = normalizeYahooSymbol(rawSymbol);

    const data = await getYahooHistory(symbol, rawSymbol);

    return Response.json(data);
  } catch (error) {
    console.error("Market history error:", error);

    return Response.json(
      {
        error: "Server error while fetching market history",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}

function normalizeYahooSymbol(rawSymbol) {
  const symbol = rawSymbol.trim().toUpperCase();

  // Singapore stocks
  // D05:SGX -> D05.SI
  if (symbol.endsWith(":SGX")) {
    return symbol.replace(":SGX", ".SI");
  }

  // Crypto
  // BTC/USD:DIGITAL_CURRENCY -> BTC-USD
  if (symbol.endsWith(":DIGITAL_CURRENCY")) {
    return symbol
      .replace(":DIGITAL_CURRENCY", "")
      .replace("/", "-");
  }

  // BTC/USD -> BTC-USD
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

async function getYahooHistory(symbol, rawSymbol) {
  const result = await yahooFinance.chart(symbol, {
    period1: new Date("2024-01-01"),
    period2: new Date(),
    interval: "1d",
  });

  if (!result || !result.quotes || result.quotes.length === 0) {
    throw new Error(`No Yahoo Finance history found for ${symbol}`);
  }

  return result.quotes
    .filter((item) => item.close !== null && item.close !== undefined)
    .map((item) => ({
      symbol: rawSymbol,
      providerSymbol: symbol,
      date:
        item.date instanceof Date
          ? item.date.toISOString().split("T")[0]
          : String(item.date).split("T")[0],
      open: Number(item.open || 0),
      high: Number(item.high || 0),
      low: Number(item.low || 0),
      close: Number(item.close),
      volume: Number(item.volume || 0),
      provider: "Yahoo Finance",
    }));
}