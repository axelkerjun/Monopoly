import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    let result;

    if (userId) {
      result = await pool.query(
        `SELECT * FROM transactions
         WHERE user_id = $1
         ORDER BY transaction_date DESC`,
        [userId]
      );
    } else {
      result = await pool.query(
        `SELECT * FROM transactions
         ORDER BY transaction_date DESC`
      );
    }

    return NextResponse.json({ transactions: result.rows });
  } catch (err) {
    console.error("GET /api/transactions failed:", err);
    return NextResponse.json(
      { error: err.message || "Server error while fetching transactions." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const {
      user_id,
      ticker,
      type,
      quantity,
      price,
      transaction_date,
    } = await request.json();

    const result = await pool.query(
      `INSERT INTO transactions
       (user_id, ticker, type, quantity, price, transaction_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        user_id,
        ticker.toUpperCase(),
        type.toUpperCase(),
        quantity,
        price,
        transaction_date,
      ]
    );

    return NextResponse.json({
      message: "Transaction logged successfully!",
      transaction: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error while saving transaction." },
      { status: 500 }
    );
  }
}