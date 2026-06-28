import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return Response.json({ error: "Missing user ID." }, { status: 400 });
    }

    const result = await pool.query(
      `
      SELECT id, user_id, ticker, created_at
      FROM watchlist
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return Response.json({
      success: true,
      watchlist: result.rows,
    });
  } catch (error) {
    console.error("Watchlist GET error:", error);

    return Response.json(
      { error: "Server error while loading watchlist." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { user_id, ticker } = await request.json();

    if (!user_id || !ticker) {
      return Response.json(
        { error: "Missing user ID or ticker." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      INSERT INTO watchlist (user_id, ticker)
      VALUES ($1, $2)
      ON CONFLICT (user_id, ticker) DO NOTHING
      RETURNING *
      `,
      [user_id, ticker.trim().toUpperCase()]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { error: "Ticker is already in your watchlist." },
        { status: 409 }
      );
    }

    return Response.json({
      success: true,
      watchlistItem: result.rows[0],
    });
  } catch (error) {
    console.error("Watchlist POST error:", error);

    return Response.json(
      { error: "Server error while adding to watchlist." },
      { status: 500 }
    );
  }
}