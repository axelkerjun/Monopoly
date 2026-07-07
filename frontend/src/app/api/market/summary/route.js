// frontend/src/app/api/market/summary/route.js
import { getMarketSummary } from "@/app/utils/marketData";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get("symbol");

  if (!rawSymbol) {
    return NextResponse.json(
      { error: "Missing symbol" },
      { status: 400 }
    );
  }

  const yahooSymbol = normalizeYahooSymbol(rawSymbol);
  const data = await getMarketSummary(yahooSymbol);

  if (!data) {
    return NextResponse.json(
      { error: "Unable to find this stock." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ...data,
    requestedSymbol: rawSymbol,
    providerSymbol: yahooSymbol,
  });
}

function normalizeYahooSymbol(rawSymbol) {
  const symbol = rawSymbol.trim().toUpperCase();

  if (symbol.endsWith(":SGX")) {
    return symbol.replace(":SGX", ".SI");
  }

  if (symbol.endsWith(":DIGITAL_CURRENCY")) {
    return symbol
      .replace(":DIGITAL_CURRENCY", "")
      .replace("/", "-");
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