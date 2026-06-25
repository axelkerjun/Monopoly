import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    if (!userId || isNaN(Number(userId))) {
      return Response.json({ error: "Invalid user ID." }, { status: 400 });
    }

    const result = await pool.query(
      `
      SELECT
        ticker,
        SUM(
          CASE
            WHEN type = 'BUY' THEN quantity
            WHEN type = 'SELL' THEN -quantity
            ELSE 0
          END
        ) AS quantity,
        SUM(
          CASE
            WHEN type = 'BUY' THEN quantity * price
            ELSE 0
          END
        ) AS total_buy_cost,
        SUM(
          CASE
            WHEN type = 'BUY' THEN quantity
            ELSE 0
          END
        ) AS total_buy_quantity
      FROM transactions
      WHERE user_id = $1
      GROUP BY ticker
      HAVING SUM(
        CASE
          WHEN type = 'BUY' THEN quantity
          WHEN type = 'SELL' THEN -quantity
          ELSE 0
        END
      ) > 0
      ORDER BY ticker;
      `,
      [userId]
    );

    const holdings = result.rows.map((row) => {
      const quantity = Number(row.quantity);
      const totalBuyCost = Number(row.total_buy_cost);
      const totalBuyQuantity = Number(row.total_buy_quantity);

      const avgPrice =
        totalBuyQuantity > 0 ? totalBuyCost / totalBuyQuantity : 0;

      return {
        ticker: row.ticker,
        quantity,
        avgPrice: Number(avgPrice.toFixed(2)),
      };
    });

    return Response.json({
      success: true,
      userId: Number(userId),
      holdings,
    });
  } catch (error) {
    console.error("Holdings route error:", error);

    return Response.json(
      { error: "Server error while fetching holdings." },
      { status: 500 }
    );
  }
}