# Red Flag — a cognitive surrender gym

You face confident AI answers. Roughly half are subtly wrong. Catch them. Don't wave the white flag.

Inspired by the "cognitive surrender" idea (over-trusting confident AI) discussed in The Economist's Bartleby column.

## Run locally

```bash
npm install
npm run dev      # Vite on :5173, API on :3001 (proxied)
```

Open http://localhost:5173

## Run in production / on Replit

```bash
npm install
npm run build    # builds the frontend into /dist
npm start        # Express serves /dist + the leaderboard API on $PORT
```

On Replit, just hit **Run** — the `.replit` file installs, builds, and starts automatically. The public URL serves everything from one Express process.

## How it works

- **Frontend**: a single React component (`src/RedFlag.jsx`), built with Vite.
- **Backend**: a tiny Express server (`server.js`) exposing:
  - `GET  /api/leaderboard` → returns the shared score board
  - `POST /api/leaderboard` → submits `{ name, bestScore, surrenderRate }`
- **Storage**: scores persist to `data/leaderboard.json` on the server's disk.

> Note: on Replit's free tier the filesystem may reset on cold redeploys. For a permanently durable board, swap the JSON file in `server.js` for a database (e.g. Replit DB, SQLite, or Supabase). The read/write is isolated in two functions (`readBoard` / `writeBoard`) to make that swap easy.

## Scoring

| Outcome | Points |
| --- | --- |
| Catch a wrong answer | +25 |
| Trust a right answer | +10 |
| Surrender to a lie | −20 |
| Flag a correct answer | −5 |

## Adding questions

Edit the `BANK` array in `src/RedFlag.jsx`. Each item:

```js
{
  domain: "Cybersecurity",
  q: "the question",
  ai: "the confident assistant answer",
  conf: 95,            // confidence shown, 88–99
  isCorrect: false,    // is the AI answer actually right?
  truth: "the real answer",
  why: "one line on the trap"
}
```
