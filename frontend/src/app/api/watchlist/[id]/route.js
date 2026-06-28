import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!id || !userId) {
      return Response.json(
        { error: "Missing watchlist ID or user ID." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      DELETE FROM watchlist
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { error: "Watchlist item not found." },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      deletedItem: result.rows[0],
    });
  } catch (error) {
    console.error("Watchlist DELETE error:", error);

    return Response.json(
      { error: "Server error while deleting watchlist item." },
      { status: 500 }
    );
  }
}