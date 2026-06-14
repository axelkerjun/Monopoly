function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

function normalizeTransaction(tx) {
  return {
    ...tx,
    ticker: String(tx.ticker || "").trim().toUpperCase(),
    type: String(tx.type || "").trim().toUpperCase(),
    quantity: toNumber(tx.quantity),
    price: toNumber(tx.price),
    transaction_date: tx.transaction_date || tx.date || tx.trade_date || null,
  };
}

function calculateTickerPosition(transactions) {
  const sorted = [...transactions]
    .map(normalizeTransaction)
    .sort((a, b) => toDate(a.transaction_date) - toDate(b.transaction_date));

  let sharesOwned = 0;
  let totalCost = 0;
  const warnings = [];

  for (const tx of sorted) {
    const quantity = toNumber(tx.quantity);
    const price = toNumber(tx.price);
    const type = String(tx.type || "").toUpperCase();

    if (!tx.ticker) continue;
    if (quantity <= 0 || price < 0) continue;

    if (type === "BUY") {
      sharesOwned += quantity;
      totalCost += quantity * price;
    }

    if (type === "SELL") {
      if (sharesOwned <= 0) {
        warnings.push(
          `Sell ignored for ${tx.ticker} because there are no shares left.`
        );
        continue;
      }

      const sellQty = Math.min(quantity, sharesOwned);
      const avgCostBeforeSell = sharesOwned > 0 ? totalCost / sharesOwned : 0;

      sharesOwned -= sellQty;
      totalCost -= avgCostBeforeSell * sellQty;

      if (quantity > sellQty) {
        warnings.push(
          `Sell for ${tx.ticker} was larger than current holdings. Only ${sellQty} shares were processed.`
        );
      }

      if (sharesOwned === 0) {
        totalCost = 0;
      }
    }
  }

  const averageCost = sharesOwned > 0 ? totalCost / sharesOwned : 0;

  return {
    ticker: sorted[0]?.ticker || "",
    sharesOwned,
    totalCost,
    averageCost,
    warnings,
  };
}

export function calculatePortfolio(transactions) {
  const cleaned = Array.isArray(transactions)
    ? transactions.map(normalizeTransaction)
    : [];

  const byTicker = new Map();

  for (const tx of cleaned) {
    if (!tx.ticker) continue;

    if (!byTicker.has(tx.ticker)) {
      byTicker.set(tx.ticker, []);
    }

    byTicker.get(tx.ticker).push(tx);
  }

  const positions = [];
  let totalSharesOwned = 0;
  let totalCapitalInvested = 0;

  for (const [ticker, tickerTransactions] of byTicker.entries()) {
    const position = calculateTickerPosition(tickerTransactions);

    positions.push({
      ticker,
      sharesOwned: position.sharesOwned,
      averageCost: position.averageCost,
      investedCapital: position.totalCost,
      warnings: position.warnings,
    });

    totalSharesOwned += position.sharesOwned;
    totalCapitalInvested += position.totalCost;
  }

  positions.sort((a, b) => a.ticker.localeCompare(b.ticker));

  return {
    positions,
    totals: {
      totalSharesOwned,
      totalCapitalInvested,
    },
  };
}

export function calculateSinglePosition(transactions, ticker) {
  const filtered = Array.isArray(transactions)
    ? transactions.filter(
        (tx) => String(tx.ticker || "").trim().toUpperCase() === String(ticker || "").trim().toUpperCase()
      )
    : [];

  return calculateTickerPosition(filtered);
}