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

// Score bounds derived from game rules: 8 rounds, best = 8×25 = 200, worst = 8×(−20) = −160
const GAME_ROUNDS = 8;
const MAX_POINTS_PER_ROUND = 25;  // "catch" action
const MIN_POINTS_PER_ROUND = -20; // "surrender" action
const MAX_ACHIEVABLE_SCORE = GAME_ROUNDS * MAX_POINTS_PER_ROUND;  // 200
const MIN_ACHIEVABLE_SCORE = GAME_ROUNDS * MIN_POINTS_PER_ROUND;  // -160

app.post("/api/leaderboard", async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || "Anonymous").slice(0, 24).trim() || "Anonymous";

  const rawScore = parseInt(body.bestScore, 10);
  if (Number.isNaN(rawScore)) {
    return res.status(400).json({ error: "Invalid score: must be a number." });
  }
  if (rawScore > MAX_ACHIEVABLE_SCORE) {
    return res.status(400).json({
      error: `Score ${rawScore} exceeds the maximum achievable score of ${MAX_ACHIEVABLE_SCORE}.`,
    });
  }
  if (rawScore < MIN_ACHIEVABLE_SCORE) {
    return res.status(400).json({
      error: `Score ${rawScore} is below the minimum achievable score of ${MIN_ACHIEVABLE_SCORE}.`,
    });
  }

  const rawSurrender = parseInt(body.surrenderRate, 10);
  if (Number.isNaN(rawSurrender) || rawSurrender < 0 || rawSurrender > 100) {
    return res.status(400).json({ error: "Invalid surrenderRate: must be an integer between 0 and 100." });
  }

  const bestScore = rawScore;
  const surrenderRate = rawSurrender;
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
