require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test database connection
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    return res.json({
      status: "Backend is connected to PostgreSQL",
      time: result.rows[0].now,
    });
  } catch (err) {
    console.error("Database test error:", err);

    return res.status(500).json({
      error: "Database connection failed.",
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  return res.json({
    status: "Backend is running smoothly!",
  });
});

// Register
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required.",
    });
  }

  try {
    const userCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        error: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, created_at
      `,
      [email, hashedPassword]
    );

    return res.status(201).json({
      message: "User registered successfully!",
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error("Registration error:", err);

    return res.status(500).json({
      error: "Server error during registration.",
    });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required.",
    });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid credentials.",
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid credentials.",
      });
    }

    return res.json({
      message: "Login successful!",
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      error: "Server error during login.",
    });
  }
});

// Log transaction
app.post("/api/transactions", async (req, res) => {
  const { user_id, ticker, type, quantity, price, transaction_date } = req.body;

  if (!user_id || !ticker || !type || !quantity || !price || !transaction_date) {
    return res.status(400).json({
      error: "All transaction fields are required.",
    });
  }

  const normalizedType = String(type).toUpperCase();

  if (normalizedType !== "BUY" && normalizedType !== "SELL") {
    return res.status(400).json({
      error: "Transaction type must be BUY or SELL.",
    });
  }

  try {
    const newTransaction = await pool.query(
      `
      INSERT INTO transactions 
        (user_id, ticker, type, quantity, price, transaction_date)
      VALUES 
        ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        user_id,
        String(ticker).toUpperCase(),
        normalizedType,
        quantity,
        price,
        transaction_date,
      ]
    );

    return res.status(201).json({
      message: "Transaction logged successfully!",
      transaction: newTransaction.rows[0],
    });
  } catch (err) {
    console.error("Transaction logging error:", err);

    return res.status(500).json({
      error: "Server error while saving transaction.",
    });
  }
});

// Get holdings
app.get("/api/holdings/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId || isNaN(Number(userId))) {
    return res.status(400).json({
      error: "Invalid user ID.",
    });
  }

  try {
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

    return res.json({
      success: true,
      userId: Number(userId),
      holdings,
    });
  } catch (err) {
    console.error("Holdings fetch error:", err);

    return res.status(500).json({
      error: "Server error while fetching holdings.",
    });
  }
});

// Delete transaction
app.delete("/api/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({
      error: "Invalid transaction ID.",
    });
  }

  if (!user_id || isNaN(Number(user_id))) {
    return res.status(400).json({
      error: "Invalid user ID.",
    });
  }

  try {
    const result = await pool.query(
      `
      DELETE FROM transactions
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Transaction not found.",
      });
    }

    return res.json({
      message: "Transaction deleted successfully!",
      transaction: result.rows[0],
    });
  } catch (err) {
    console.error("Transaction delete error:", err);

    return res.status(500).json({
      error: "Server error while deleting transaction.",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});