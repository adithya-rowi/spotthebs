import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const MAX_ENTRIES = 25;

app.use(express.json({ limit: "16kb" }));

// --- PostgreSQL pool --------------------------------------------------------
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      name VARCHAR(24) PRIMARY KEY,
      best_score INTEGER NOT NULL,
      surrender_rate INTEGER NOT NULL,
      ts BIGINT NOT NULL
    )
  `);
}

// Run once at startup
ensureTable().catch((err) => {
  console.error("Failed to ensure leaderboard table:", err);
});

async function readBoard() {
  const result = await pool.query(
    "SELECT name, best_score AS \"bestScore\", surrender_rate AS \"surrenderRate\", ts FROM leaderboard ORDER BY best_score DESC LIMIT $1",
    [MAX_ENTRIES]
  );
  return result.rows;
}

async function writeBoard(name, bestScore, surrenderRate, ts) {
  await pool.query(
    `INSERT INTO leaderboard (name, best_score, surrender_rate, ts)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (name) DO UPDATE
       SET best_score = EXCLUDED.best_score,
           surrender_rate = EXCLUDED.surrender_rate,
           ts = EXCLUDED.ts
     WHERE EXCLUDED.best_score > leaderboard.best_score`,
    [name, bestScore, surrenderRate, ts]
  );
}

function clampInt(v, lo, hi, fallback) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(lo, Math.min(hi, n));
}

// --- API -------------------------------------------------------------------
app.get("/api/leaderboard", async (_req, res) => {
  try {
    const board = await readBoard();
    res.json(board);
  } catch (err) {
    console.error("GET /api/leaderboard error:", err);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

app.post("/api/leaderboard", async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || "Anonymous").slice(0, 24).trim() || "Anonymous";
  const bestScore = clampInt(body.bestScore, -10000, 10000, 0);
  const surrenderRate = clampInt(body.surrenderRate, 0, 100, 0);
  const ts = Date.now();

  try {
    await writeBoard(name, bestScore, surrenderRate, ts);
    const board = await readBoard();
    res.json(board);
  } catch (err) {
    console.error("POST /api/leaderboard error:", err);
    res.status(500).json({ error: "Failed to save score" });
  }
});

// --- serve the built frontend in production --------------------------------
const distDir = path.join(__dirname, "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  // SPA fallback for any non-API route
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Red Flag server listening on http://0.0.0.0:${PORT}`);
});
