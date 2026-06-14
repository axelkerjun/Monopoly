import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const result = await pool.query(
      `UPDATE transactions
       SET ticker = $1,
           type = $2,
           quantity = $3,
           price = $4,
           transaction_date = $5
       WHERE id = $6
       RETURNING *`,
      [
        body.ticker.toUpperCase(),
        body.type.toUpperCase(),
        body.quantity,
        body.price,
        body.transaction_date,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      transaction: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error while updating transaction." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const result = await pool.query(
      `DELETE FROM transactions
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Transaction deleted successfully",
      deletedTransaction: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error while deleting transaction." },
      { status: 500 }
    );
  }
}