import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = String(searchParams.get("query") || "").trim();

    if (!query) {
      return Response.json({
        success: true,
        results: [],
      });
    }

    const searchResult = await yahooFinance.search(
      query,
      {
        quotesCount: 10,
        newsCount: 0,
      },
      {
        validateResult: false,
      }
    );

    const quotes = Array.isArray(searchResult.quotes)
      ? searchResult.quotes
      : [];

    const results = quotes
      .filter((item) => {
        const quoteType = String(item.quoteType || "").toUpperCase();

        return (
          quoteType === "EQUITY" ||
          quoteType === "ETF" ||
          quoteType === "CRYPTOCURRENCY"
        );
      })
      .map((item) => {
        const yahooSymbol = String(item.symbol || "").toUpperCase();

        return {
          symbol: yahooSymbol,
          tradeSymbol: yahooSymbol,
          name: item.shortname || item.longname || item.name || "",
          exchange: item.exchDisp || item.exchange || "",
          type: item.typeDisp || item.quoteType || "",
          country: getCountry(item),
          currency: item.currency || "",
        };
      });

    return Response.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Yahoo search error:", error);

    return Response.json(
      {
        error: "Server error while searching tickers.",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}

function toAppSymbol(yahooSymbol, item) {
  if (yahooSymbol.endsWith(".SI")) {
    return yahooSymbol.replace(".SI", ":SGX");
  }
  if (item.quoteType === "CRYPTOCURRENCY" && yahooSymbol.endsWith("-USD")) {
    return yahooSymbol.replace("-USD", "/USD:DIGITAL_CURRENCY");
  }

  return yahooSymbol;
}

function getCountry(item) {
  const symbol = String(item.symbol || "").toUpperCase();
  const exchange = String(item.exchange || "").toUpperCase();
  const exchDisp = String(item.exchDisp || "").toUpperCase();

  if (symbol.endsWith(".SI") || exchange.includes("SES") || exchDisp.includes("SES")) {
    return "Singapore";
  }

  if (item.quoteType === "CRYPTOCURRENCY") {
    return "Global";
  }

  return "United States";
}