import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

const DATA_DIR = path.join(__dirname, "data");
const LB_FILE = path.join(DATA_DIR, "leaderboard.json");
const MAX_ENTRIES = 25;

app.use(express.json({ limit: "16kb" }));

// --- tiny JSON-file persistence -------------------------------------------
function readBoard() {
  try {
    const raw = fs.readFileSync(LB_FILE, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeBoard(arr) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(LB_FILE, JSON.stringify(arr, null, 2));
}

function clampInt(v, lo, hi, fallback) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(lo, Math.min(hi, n));
}

// --- API -------------------------------------------------------------------
app.get("/api/leaderboard", (_req, res) => {
  res.json(readBoard());
});

app.post("/api/leaderboard", (req, res) => {
  const body = req.body || {};
  const name = String(body.name || "Anonymous").slice(0, 24).trim() || "Anonymous";
  const bestScore = clampInt(body.bestScore, -10000, 10000, 0);
  const surrenderRate = clampInt(body.surrenderRate, 0, 100, 0);

  let arr = readBoard();
  const existing = arr.find((x) => x.name === name);
  if (!existing || bestScore > existing.bestScore) {
    arr = arr.filter((x) => x.name !== name);
    arr.push({ name, bestScore, surrenderRate, ts: Date.now() });
  }
  arr.sort((a, b) => b.bestScore - a.bestScore);
  arr = arr.slice(0, MAX_ENTRIES);
  writeBoard(arr);
  res.json(arr);
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
