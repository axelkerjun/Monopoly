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

    const data = await getYahooQuote(symbol, rawSymbol);

    return Response.json(data);
  } catch (error) {
    console.error("Market quote error:", error);

    return Response.json(
      {
        error: "Server error while fetching market quote",
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

async function getYahooQuote(symbol, rawSymbol) {
  const quote = await yahooFinance.quote(symbol);

  if (!quote) {
    throw new Error(`No Yahoo Finance quote found for ${symbol}`);
  }

  const price =
    quote.regularMarketPrice ??
    quote.postMarketPrice ??
    quote.preMarketPrice;

  if (price === null || price === undefined) {
    throw new Error(`No Yahoo Finance price found for ${symbol}`);
  }

  return {
    symbol: rawSymbol,
    providerSymbol: symbol,
    price: Number(price),
    currency: quote.currency || "USD",
    provider: "Yahoo Finance",
  };
}