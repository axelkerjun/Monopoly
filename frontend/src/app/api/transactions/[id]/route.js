import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;

    const { ticker, type, quantity, price, transaction_date } =
      await request.json();

    if (!id) {
      return Response.json(
        { error: "Missing transaction ID" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      UPDATE transactions
      SET ticker = $1,
          type = $2,
          quantity = $3,
          price = $4,
          transaction_date = $5
      WHERE id = $6
      RETURNING *
      `,
      [
        ticker.toUpperCase(),
        type.toUpperCase(),
        quantity,
        price,
        transaction_date,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return Response.json({
      message: "Transaction updated successfully",
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error("Update transaction error:", error);

    return Response.json(
      { error: "Server error while updating transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return Response.json(
        { error: "Missing transaction ID" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      DELETE FROM transactions
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return Response.json({
      message: "Transaction deleted successfully",
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error("Delete transaction error:", error);

    return Response.json(
      { error: "Server error while deleting transaction" },
      { status: 500 }
    );
  }
}