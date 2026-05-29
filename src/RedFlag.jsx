import React, { useState, useEffect, useRef } from "react";
// SPOT THE BS — train the habit of checking the AI instead of surrendering to it.
// You face confident AI answers. ~half are subtly wrong. Call the bluff.
const C = {
  paper: "#f3ede1",
  paper2: "#ece4d3",
  ink: "#1b1510",
  inkSoft: "#5a4f44",
  blood: "#c0211f",
  bloodDeep: "#7c1513",
  flag: "#fbf8f2",
  hold: "#13675c",
  line: "#d8cdb8",
};
const POINTS = { catch: 25, correctTrust: 10, surrender: -20, falseAlarm: -5 };
const ROUNDS = 8;
// isCorrect = whether the AI's shown answer is actually correct.
const BANK = [
  // ECONOMICS
  { domain: "Economics", q: "Ricardo's case for trade says a country should specialize based on which kind of advantage?", ai: "Absolute advantage — make whatever it produces more cheaply than rivals in absolute terms.", conf: 95, isCorrect: false, truth: "Comparative advantage.", why: "Even a country worse at everything gains by specializing where its relative cost is lowest. That's the whole counterintuitive point." },
  { domain: "Economics", q: "How many times does the phrase 'invisible hand' appear in Adam Smith's Wealth of Nations?", ai: "Just once, in Book IV.", conf: 90, isCorrect: true, truth: "Once.", why: "Smith's signature idea gets a single mention. The trap is assuming it's repeated throughout." },
  { domain: "Economics", q: "In the Solow model, what drives long-run growth in output per worker?", ai: "Capital accumulation — the more a country saves and invests, the faster it grows, indefinitely.", conf: 93, isCorrect: false, truth: "Technological progress.", why: "Capital alone hits diminishing returns and growth stalls. Sustained per-capita growth comes from technology." },
  { domain: "Economics", q: "What does Baumol's cost disease explain?", ai: "Why labor-intensive services like education and live music keep getting pricier without matching productivity gains.", conf: 92, isCorrect: true, truth: "Rising costs in low-productivity sectors.", why: "Wages rise economy-wide with productivity, so sectors that can't automate see costs climb anyway." },
  { domain: "Economics", q: "A Giffen good is strange because as its price rises, quantity demanded…", ai: "…falls sharply, since it's a luxury people drop once it gets expensive.", conf: 90, isCorrect: false, truth: "…rises.", why: "For a Giffen good (classically a staple for the poor) the income effect overwhelms substitution, so demand goes up with price." },
  { domain: "Economics", q: "The median voter theorem predicts two-candidate platforms will tend to…", ai: "…diverge toward the extremes to fire up each base.", conf: 88, isCorrect: false, truth: "…converge toward the center.", why: "Candidates chase the decisive median voter, so platforms move to the middle, not the extremes." },
  { domain: "Economics", q: "The Coase theorem says that with zero transaction costs, parties will…", ai: "…bargain to an efficient outcome regardless of who holds the initial property right.", conf: 90, isCorrect: true, truth: "Reach efficiency regardless of initial rights.", why: "Correct. The starting allocation changes who pays whom, not whether the outcome is efficient." },
  { domain: "Economics", q: "The Jevons paradox observes that using a resource more efficiently tends to…", ai: "…cut total consumption, since each unit of output now needs less of it.", conf: 89, isCorrect: false, truth: "…raise total consumption.", why: "Efficiency lowers the effective price, which can lift demand enough that total use rises — Jevons' coal example." },
  { domain: "Economics", q: "An allocation is 'Pareto efficient' when…", ai: "…no one can be made better off without making someone else worse off.", conf: 92, isCorrect: true, truth: "No one gains without another losing.", why: "Correct — and notably it says nothing about fairness. A wildly unequal split can still be Pareto efficient." },
  { domain: "Economics", q: "In standard economics, how should a past 'sunk cost' affect a future decision?", ai: "Not at all — only future costs and benefits should matter.", conf: 90, isCorrect: true, truth: "It shouldn't.", why: "Correct. Rational choice ignores unrecoverable spending, even though people rarely manage to." },
  // SOCIAL SCIENCE
  { domain: "Social science", q: "Dunbar's number — the rough cap on stable social relationships — is about…", ai: "…500 people.", conf: 90, isCorrect: false, truth: "~150.", why: "Dunbar's estimate is around 150. 500 sounds plausible but is more than triple." },
  { domain: "Social science", q: "What's the current scholarly status of Zimbardo's Stanford Prison Experiment?", ai: "A landmark, well-replicated proof that situations override individual character.", conf: 88, isCorrect: false, truth: "Largely discredited; not replicated.", why: "Evidence later showed guards were coached and the study hasn't replicated. It's now a cautionary tale, not settled science." },
  { domain: "Social science", q: "When the famous 'marshmallow test' was re-run with controls, the link to later success…", ai: "…mostly vanished once family wealth and background were accounted for.", conf: 87, isCorrect: true, truth: "Largely disappeared with controls.", why: "Correct. A 2018 replication found the predictive power shrank dramatically after controlling for environment." },
  { domain: "Social science", q: "Goodhart's law warns that…", ai: "…when a measure becomes a target, it stops being a good measure.", conf: 92, isCorrect: true, truth: "Targets corrupt measures.", why: "Correct. Once a metric is the goal, people optimize the number rather than the thing it stood for." },
  { domain: "Social science", q: "Arrow's impossibility theorem shows that…", ai: "…simple majority rule satisfies every fairness criterion once you allow runoffs.", conf: 89, isCorrect: false, truth: "No rank-order rule satisfies them all.", why: "Arrow proved the opposite: no ranked voting system can meet a short list of reasonable fairness conditions at once." },
  { domain: "Social science", q: "The Pareto principle (the '80/20 rule') is the idea that…", ai: "…roughly 80% of effects often come from about 20% of causes.", conf: 90, isCorrect: true, truth: "~80% of effects from ~20% of causes.", why: "Correct as a rough heuristic, named for Pareto's note that a fifth of Italians owned most of the land." },
  // HISTORY & IDEAS
  { domain: "History & ideas", q: "Malthus predicted population grows ___ while food grows ___.", ai: "Arithmetically … geometrically, so food always outruns mouths.", conf: 88, isCorrect: false, truth: "Population geometrically; food arithmetically.", why: "He had it the other way — population exponentially, food only linearly — which is the source of his pessimism." },
  { domain: "History & ideas", q: "In what year was Adam Smith's Wealth of Nations published?", ai: "1776 — the same year as the American Declaration of Independence.", conf: 93, isCorrect: true, truth: "1776.", why: "Correct, and a handy mnemonic. The trap would nudge it to 1789." },
  { domain: "History & ideas", q: "Gutenberg's movable-type printing press in Europe dates to roughly…", ai: "…the 1440s.", conf: 91, isCorrect: true, truth: "~1440.", why: "Correct. A confident wrong version shifts it a full century to the 1500s." },
  { domain: "History & ideas", q: "Which book did Adam Smith publish before The Wealth of Nations?", ai: "The Theory of Moral Sentiments.", conf: 90, isCorrect: true, truth: "The Theory of Moral Sentiments (1759).", why: "Correct. Smith the moral philosopher came before Smith the economist." },
  { domain: "History & ideas", q: "Keynes's line 'in the long run we are all dead' was an argument for…", ai: "…acting on short-run problems instead of waiting for markets to self-correct eventually.", conf: 88, isCorrect: true, truth: "Acting in the short run.", why: "Correct. He mocked economists who waved away present suffering by pointing to some distant equilibrium." },
  // SCIENCE
  { domain: "Science", q: "Moore's law, as usually stated today, says transistor density doubles roughly every…", ai: "…18 months, exactly as Gordon Moore originally predicted.", conf: 89, isCorrect: false, truth: "~2 years (and Moore never said 18 months).", why: "Moore's 1975 revision was every two years. '18 months' was a later popularization by a colleague, not Moore's law." },
  { domain: "Science", q: "Light from the Sun takes roughly how long to reach Earth?", ai: "About 8 minutes (8 min 20 s on average).", conf: 95, isCorrect: true, truth: "~8 minutes.", why: "Correct. The clean-sounding trap is '8 seconds', off by a factor of 60." },
  { domain: "Science", q: "How many bases make up the genetic alphabet of DNA?", ai: "Five — A, T, C, G, and U.", conf: 92, isCorrect: false, truth: "Four (A, T, C, G).", why: "Uracil (U) belongs to RNA, not DNA. Sneaking it in makes a four-letter code look like five." },
  { domain: "Science", q: "In evolution, 'survival of the fittest' means the fittest organisms are…", ai: "…the strongest and most physically dominant ones.", conf: 88, isCorrect: false, truth: "Those best suited to reproduce in their environment.", why: "'Fittest' means best-fitting the environment, not strongest. A well-adapted microbe out-fits a lion." },
  { domain: "Science", q: "How many bones are in the adult human body?", ai: "206.", conf: 95, isCorrect: true, truth: "206.", why: "Correct. Babies have ~270; many fuse by adulthood. The trap answer is 212." },
  { domain: "Science", q: "Which gas is most abundant in Earth's atmosphere?", ai: "Nitrogen, at about 78%.", conf: 94, isCorrect: true, truth: "Nitrogen.", why: "Correct. The common wrong guess is oxygen, which is only ~21%." },
  { domain: "Science", q: "Occam's razor advises that among competing explanations you should…", ai: "…prefer the one with the fewest assumptions, all else equal.", conf: 91, isCorrect: true, truth: "Prefer the fewest assumptions.", why: "Correct. It's a tie-breaker between equally good explanations, not proof the simplest is true." },
  // MONEY & MARKETS
  { domain: "Money & markets", q: "A stock falls from 10,000 to 8,000. What's the percentage decline?", ai: "25% — the 2,000 drop over the 8,000 ending price.", conf: 98, isCorrect: false, truth: "20%.", why: "Decline is measured against the start: 2,000 / 10,000 = 20%. Recovering it would take a 25% rise, which is the mix-up." },
  { domain: "Money & markets", q: "An investment gains 50% one year, loses 50% the next. Versus the start, it ends…", ai: "…back to even — the gain and loss cancel exactly.", conf: 98, isCorrect: false, truth: "Down 25%.", why: "100 → 150 → 75. Percentage moves don't cancel because the base changes between them." },
  { domain: "Money & markets", q: "When market interest rates rise, existing bond prices…", ai: "…fall — price and yield move inversely.", conf: 94, isCorrect: true, truth: "Fall.", why: "Correct. Older, lower-coupon bonds get less attractive, so their price drops." },
  { domain: "Money & markets", q: "With 3% annual inflation, prices roughly double in about…", ai: "…24 years, by the Rule of 72 (72 ÷ 3).", conf: 93, isCorrect: true, truth: "~24 years.", why: "Correct use of the Rule of 72. The trap divides by 100 instead." },
  { domain: "Money & markets", q: "Diversification across many assets mainly reduces which risk?", ai: "Systematic, market-wide risk — spread your bets and the whole market matters less.", conf: 90, isCorrect: false, truth: "Unsystematic (asset-specific) risk.", why: "Diversification cancels idiosyncratic risk. Market-wide risk can't be diversified away." },
  { domain: "Money & markets", q: "At 7% annual compounding, money roughly doubles in about…", ai: "…10 years, by the Rule of 72 (72 ÷ 7).", conf: 92, isCorrect: true, truth: "~10 years.", why: "Correct (≈10.3). The trap divides 100 by 7 and lands near 14." },
  // LOGIC & NUMBERS
  { domain: "Logic & numbers", q: "A racket and a ball cost 110,000 in total. The racket costs 100,000 more than the ball. The ball costs…", ai: "10,000 — subtract 100,000 from the 110,000 total.", conf: 99, isCorrect: false, truth: "5,000.", why: "If the ball is 5k the racket is 105k, total 110k, gap exactly 100k. 10k is the intuitive trap." },
  { domain: "Logic & numbers", q: "5 machines take 5 minutes to make 5 widgets. How long for 100 machines to make 100 widgets?", ai: "100 minutes — more widgets means proportionally more time.", conf: 97, isCorrect: false, truth: "5 minutes.", why: "Each machine makes one widget in 5 minutes regardless of count. 100 machines make 100 in the same 5 minutes." },
  { domain: "Logic & numbers", q: "On the Monty Hall problem, after a goat is revealed, should you switch doors?", ai: "It doesn't matter — two doors left, a clean 50/50.", conf: 94, isCorrect: false, truth: "Switch — it wins 2/3 of the time.", why: "Your first pick stays at 1/3; the host's reveal concentrates the other 2/3 on the remaining door." },
  { domain: "Logic & numbers", q: "Does the repeating decimal 0.999… equal exactly 1?", ai: "No — it gets infinitely close but always stays just below 1.", conf: 92, isCorrect: false, truth: "Yes, exactly 1.", why: "They're two notations for one number. The difference is zero, not an infinitesimal." },
  { domain: "Logic & numbers", q: "Roughly how many people are needed for a >50% chance two share a birthday?", ai: "About 183 — roughly half of 365.", conf: 91, isCorrect: false, truth: "About 23.", why: "The birthday paradox counts pairs, not days, so the number is far lower than intuition expects." },
  { domain: "Logic & numbers", q: "Flip a fair coin twice. Chance of two heads?", ai: "50% — each flip is independently 50% to land heads.", conf: 95, isCorrect: false, truth: "25% (½ × ½).", why: "Each flip is 50%, but both happening is the product: 0.5 × 0.5 = 0.25." },
  { domain: "Logic & numbers", q: "What is 15% of 80?", ai: "12 — ten percent is 8, half of that is 4, so 8 + 4.", conf: 95, isCorrect: true, truth: "12.", why: "Correct, and the shown reasoning is sound. Not every confident answer is a trap." },
  // GENERAL
  { domain: "General", q: "What is the capital of Australia?", ai: "Sydney — the country's largest and most internationally known city.", conf: 96, isCorrect: false, truth: "Canberra.", why: "Sydney is the biggest city, not the capital. A very confident, very common error." },
  { domain: "General", q: "Can the Great Wall of China be seen from space with the naked eye?", ai: "Yes — it's famously the only human-made structure visible from orbit unaided.", conf: 93, isCorrect: false, truth: "No.", why: "A long-debunked myth. It's far too narrow to resolve with the naked eye from orbit." },
  { domain: "General", q: "What is the capital of Canada?", ai: "Toronto — the country's financial and most populous hub.", conf: 95, isCorrect: false, truth: "Ottawa.", why: "Toronto is the biggest city; the capital is Ottawa. The 'biggest city = capital' reflex strikes again." },
  { domain: "General", q: "Which planet is largest in the solar system?", ai: "Jupiter, by a wide margin in both mass and diameter.", conf: 97, isCorrect: true, truth: "Jupiter.", why: "Correct. The plausible wrong version swaps in Saturn." },
];
function shuffle(a) {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}
async function getBoard() {
  const res = await fetch("/api/leaderboard");
  if (!res.ok) throw new Error("board fetch failed");
  return res.json();
}
async function postScore(entry) {
  const res = await fetch("/api/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error("board post failed");
  return res.json();
}
export default function RedFlag() {
  const [screen, setScreen] = useState("home"); // home | play | reveal | results
  const [name, setName] = useState("");
  const [queue, setQueue] = useState([]);
  const [round, setRound] = useState(0);
  const [item, setItem] = useState(null);
  const [choice, setChoice] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [tally, setTally] = useState({ catch: 0, surrender: 0, correctTrust: 0, falseAlarm: 0, wrongShown: 0, rightShown: 0, mistakes: [] });
  const [board, setBoard] = useState([]);
  const [boardNote, setBoardNote] = useState("");
  const usedRef = useRef([]);
  useEffect(() => { loadBoard(); }, []);
  async function loadBoard() {
    try {
      const arr = await getBoard();
      if (Array.isArray(arr)) setBoard(arr);
    } catch (e) { /* empty board, fine */ }
  }
  function nextItem(remaining) {
    const it = remaining[0];
    usedRef.current.push(it.q);
    setItem(it);
    setQueue(remaining.slice(1));
  }
  function start() {
    const fresh = shuffle(BANK);
    usedRef.current = [];
    setScore(0); setStreak(0); setRound(1);
    setTally({ catch: 0, surrender: 0, correctTrust: 0, falseAlarm: 0, wrongShown: 0, rightShown: 0, mistakes: [] });
    setChoice(null);
    setScreen("play");
    setQueue(fresh);
    nextItem(fresh);
  }
  function decide(c) {
    if (!item) return;
    setChoice(c);
    const aiWrong = !item.isCorrect;
    let kind;
    if (aiWrong && c === "flag") kind = "catch";
    else if (aiWrong && c === "accept") kind = "surrender";
    else if (!aiWrong && c === "accept") kind = "correctTrust";
    else kind = "falseAlarm";
    setScore((s) => s + POINTS[kind]);
    const win = kind === "catch" || kind === "correctTrust";
    setStreak((st) => (win ? st + 1 : 0));
    const isMistake = kind === "surrender" || kind === "falseAlarm";
    setTally((t) => ({
      ...t,
      [kind]: t[kind] + 1,
      wrongShown: t.wrongShown + (aiWrong ? 1 : 0),
      rightShown: t.rightShown + (aiWrong ? 0 : 1),
      mistakes: isMistake ? [...t.mistakes, { ...item, kind }] : t.mistakes,
    }));
    setScreen("reveal");
  }
  function advance() {
    if (round >= ROUNDS) { setScreen("results"); submitScoreSoon(); return; }
    setRound((r) => r + 1);
    setChoice(null);
    setScreen("play");
    nextItem(queue);
  }
  async function submitScoreSoon() {
    const nm = (name || "Anonymous").slice(0, 24);
    const sr = tally.wrongShown ? Math.round((tally.surrender / tally.wrongShown) * 100) : 0;
    try {
      const arr = await postScore({ name: nm, bestScore: score, surrenderRate: sr });
      setBoard(arr);
      setBoardNote("Saved to the shared board.");
    } catch (e) {
      setBoardNote("Couldn't reach the board. Score kept this session.");
    }
  }
  const surrenderRate = tally.wrongShown ? Math.round((tally.surrender / tally.wrongShown) * 100) : 0;
  const catchRate = tally.wrongShown ? Math.round((tally.catch / tally.wrongShown) * 100) : 0;
  const css = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Spline+Sans+Mono:wght@400;500;600&display=swap');
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { -webkit-tap-highlight-color: transparent; }
.rf-root { font-family: 'Newsreader', Georgia, serif; color: ${C.ink}; -webkit-font-smoothing: antialiased; }
.rf-disp { font-family: 'Anton', Impact, sans-serif; letter-spacing: .02em; text-transform: uppercase; line-height: .92; }
.rf-mono { font-family: 'Spline Sans Mono', ui-monospace, monospace; }
@keyframes rfIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.rf-rise { animation: rfIn .42s cubic-bezier(.2,.8,.2,1) both; }
.rf-btn { cursor: pointer; border: none; touch-action: manipulation; user-select: none; -webkit-user-select: none; transition: transform .12s ease, box-shadow .12s ease, opacity .12s ease; }
.rf-btn:active { transform: translateY(2px); opacity: .92; }
.rf-paperbg { background:
   radial-gradient(circle at 12% 8%, rgba(192,33,31,.06), transparent 40%),
   radial-gradient(circle at 88% 92%, rgba(19,103,92,.05), transparent 40%),
   ${C.paper}; }
.rf-grain { position:absolute; inset:0; opacity:.04; pointer-events:none; mix-blend-mode:multiply;
   background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
input:focus { border-color: ${C.blood} !important; }
.rf-grade-text { font-size: clamp(34px, 11vw, 44px); }
`;
  const wrap = {
    minHeight: "100vh", position: "relative",
    padding: "calc(20px + env(safe-area-inset-top)) 16px calc(40px + env(safe-area-inset-bottom))",
  };
  const inner = { maxWidth: 480, margin: "0 auto", position: "relative", zIndex: 1 };
  const card = { background: C.flag, border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: "0 1px 0 rgba(0,0,0,.03), 0 16px 34px -26px rgba(27,21,16,.5)" };
  const tag = (col) => ({ display: "inline-block", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: col, fontWeight: 600 });
  return (
    <div className="rf-root rf-paperbg" style={wrap}>
      <style>{css}</style>
      <div className="rf-grain" />
      <div style={inner}>
        {/* Masthead */}
        <div className="rf-rise" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 32, height: 24, background: C.blood, position: "relative", flex: "0 0 auto", borderRadius: 2 }}>
            <div style={{ position: "absolute", left: 6, top: 4, width: 15, height: 10, background: C.flag, transform: "skewX(-12deg)" }} />
            <div style={{ position: "absolute", left: 5, top: 3, width: 2, height: 17, background: C.flag }} />
          </div>
          <div className="rf-disp" style={{ fontSize: 21 }}>Spot&nbsp;the&nbsp;BS</div>
          <div className="rf-mono" style={{ marginLeft: "auto", fontSize: 10, color: C.inkSoft }}>is the AI bluffing?</div>
        </div>
        {screen === "home" && <Home {...{ name, setName, start, board, card, tag, C }} />}
        {(screen === "play" || screen === "reveal") && (
          <Play {...{ item, round, score, streak, choice, screen, decide, advance, card, tag, C, POINTS }} />
        )}
        {screen === "results" && (
          <Results {...{ score, surrenderRate, catchRate, tally, board, boardNote, start, setScreen, card, tag, C, name }} />
        )}
        <div className="rf-mono" style={{ textAlign: "center", fontSize: 10, color: C.inkSoft, marginTop: 26, opacity: .65 }}>
          confidence is not accuracy.
        </div>
      </div>
    </div>
  );
}
function Pill({ children, bg, fg }) {
  return <span className="rf-mono" style={{ background: bg, color: fg, fontSize: 10, padding: "3px 8px", borderRadius: 999, fontWeight: 600, letterSpacing: ".06em" }}>{children}</span>;
}
function Home({ name, setName, start, board, card, tag, C }) {
  return (
    <div>
      <h1 className="rf-disp rf-rise" style={{ fontSize: 52, margin: "4px 0 10px", animationDelay: ".04s" }}>
        Spot the<br /><span style={{ color: C.blood }}>BS.</span>
      </h1>
      <p className="rf-rise" style={{ fontSize: 18, lineHeight: 1.45, color: C.inkSoft, margin: "0 0 22px", animationDelay: ".1s" }}>
        Eight confident AI answers. Half are wrong. Call the bluff.
      </p>
      <div className="rf-rise" style={{ ...card, padding: 16, marginBottom: 12, animationDelay: ".16s" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name for the board"
          className="rf-mono"
          style={{ width: "100%", padding: "12px 14px", fontSize: 16, border: `1px solid ${C.line}`, borderRadius: 8, background: "#fff", color: C.ink, outline: "none" }}
        />
      </div>
      <button onClick={start} className="rf-btn rf-disp rf-rise" style={{ width: "100%", background: C.blood, color: C.flag, fontSize: 24, padding: "17px", borderRadius: 12, boxShadow: `0 5px 0 ${C.bloodDeep}`, animationDelay: ".22s" }}>
        Start →
      </button>
      <div className="rf-rise" style={{ marginTop: 16, animationDelay: ".28s" }}>
        <ScoreLegend C={C} />
      </div>
      <div className="rf-rise" style={{ marginTop: 20, animationDelay: ".34s" }}>
        <div style={{ ...tag(C.ink), fontSize: 12, marginBottom: 8 }}>Leaderboard</div>
        <Board board={board} C={C} card={card} compact />
      </div>
    </div>
  );
}
function ScoreLegend({ C }) {
  const rows = [
    ["Catch a lie", "+25", C.hold],
    ["Trust the truth", "+10", C.inkSoft],
    ["Buy a lie", "−20", C.blood],
    ["Flag the truth", "−5", C.inkSoft],
  ];
  return (
    <div className="rf-mono" style={{ width: "100%", fontSize: 12, border: `1px dashed ${C.line}`, borderRadius: 10, padding: "10px 14px" }}>
      {rows.map(([l, v, col]) => (
        <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: C.inkSoft }}>
          <span>{l}</span><span style={{ color: col, fontWeight: 600 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
function Play({ item, round, score, streak, choice, screen, decide, advance, card, tag, C, POINTS }) {
  if (!item) {
    return (
      <div style={{ ...card, padding: 28, textAlign: "center" }} className="rf-rise">
        <div className="rf-mono" style={{ fontSize: 13, color: C.inkSoft }}>loading…</div>
      </div>
    );
  }
  const aiWrong = !item.isCorrect;
  const kind = !choice ? null
    : aiWrong && choice === "flag" ? "catch"
    : aiWrong && choice === "accept" ? "surrender"
    : !aiWrong && choice === "accept" ? "correctTrust"
    : "falseAlarm";
  const verdict = {
    catch: { label: "CAUGHT IT", col: C.hold, msg: "Wrong — and you flagged it." },
    surrender: { label: "SURRENDERED", col: C.blood, msg: "Wrong — and you bought it." },
    correctTrust: { label: "GOOD CALL", col: C.hold, msg: "True — and you trusted it." },
    falseAlarm: { label: "FALSE ALARM", col: C.inkSoft, msg: "Actually true. Doubt has a cost too." },
  }[kind];
  return (
    <div>
      <div className="rf-mono" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: C.inkSoft, marginBottom: 12 }}>
        <span>Round {round}/{ROUNDS}</span>
        <span style={{ marginLeft: "auto" }}>Score <b style={{ color: C.ink }}>{score}</b></span>
        {streak > 1 && <Pill bg={C.hold} fg="#fff">{streak} streak</Pill>}
      </div>
      <div style={{ ...card, padding: 18, marginBottom: 12 }} className="rf-rise" key={item.q}>
        <div style={tag(C.blood)}>{item.domain}</div>
        <p style={{ fontSize: 20, lineHeight: 1.38, margin: "10px 0 0", fontWeight: 500 }}>{item.q}</p>
      </div>
      <div style={{ ...card, padding: 0, overflow: "hidden", marginBottom: 16 }} className="rf-rise">
        <div style={{ background: C.ink, color: C.paper, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <span className="rf-mono" style={{ fontSize: 11, letterSpacing: ".12em" }}>AI</span>
          <span className="rf-mono" style={{ marginLeft: "auto", fontSize: 11, color: "#e8b3b2" }}>● {item.conf}% confident</span>
        </div>
        <p className="rf-mono" style={{ fontSize: 14, lineHeight: 1.55, margin: 0, padding: "14px 16px", color: C.ink }}>{item.ai}</p>
      </div>
      {screen === "play" && (
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => decide("accept")} className="rf-btn rf-disp" style={{ flex: 1, background: C.paper2, color: C.ink, fontSize: 19, padding: "17px 8px", borderRadius: 12, border: `1px solid ${C.line}` }}>
            Trust it
          </button>
          <button onClick={() => decide("flag")} className="rf-btn rf-disp" style={{ flex: 1, background: C.blood, color: C.flag, fontSize: 19, padding: "17px 8px", borderRadius: 12, boxShadow: `0 4px 0 ${C.bloodDeep}` }}>
            🚩 Call BS
          </button>
        </div>
      )}
      {screen === "reveal" && verdict && (
        <div className="rf-rise">
          <div style={{ ...card, padding: 16, borderTop: `4px solid ${verdict.col}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="rf-disp" style={{ fontSize: 23, color: verdict.col }}>{verdict.label}</span>
              <span className="rf-mono" style={{ marginLeft: "auto", fontSize: 16, fontWeight: 600, color: verdict.col }}>
                {POINTS[kind] > 0 ? "+" : ""}{POINTS[kind]}
              </span>
            </div>
            <div className="rf-mono" style={{ fontSize: 12, marginTop: 10, color: C.inkSoft }}>
              {verdict.msg} Answer: <b style={{ color: C.ink }}>{item.truth}</b>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.5, margin: "10px 0 0", color: C.ink, fontStyle: "italic" }}>{item.why}</p>
          </div>
          <button onClick={advance} className="rf-btn rf-disp" style={{ width: "100%", marginTop: 12, background: C.ink, color: C.paper, fontSize: 19, padding: "15px", borderRadius: 12 }}>
            {round >= ROUNDS ? "Verdict →" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}
function Results({ score, surrenderRate, catchRate, tally, board, boardNote, start, setScreen, card, tag, C, name }) {
  const grade =
    surrenderRate === 0 && tally.wrongShown > 0 ? { t: "BULLETPROOF", c: C.hold, s: "You caught every confident lie." }
    : surrenderRate <= 25 ? { t: "SHARP", c: C.hold, s: "Strong skepticism. A few slipped, but you override the model when it counts." }
    : surrenderRate <= 50 ? { t: "WAVERING", c: C.blood, s: "Half the lies got through. The confident tone is doing your thinking." }
    : { t: "SURRENDERED", c: C.bloodDeep, s: "Most confident-but-wrong answers got a pass. That's the failure mode." };
  const quad = [
    { k: "catch", label: "Caught", v: tally.catch, col: C.hold },
    { k: "correctTrust", label: "Good trust", v: tally.correctTrust, col: C.inkSoft },
    { k: "surrender", label: "Surrenders", v: tally.surrender, col: C.blood },
    { k: "falseAlarm", label: "False alarms", v: tally.falseAlarm, col: C.inkSoft },
  ];
  return (
    <div>
      <div className="rf-rise" style={{ ...card, padding: 20, borderTop: `5px solid ${grade.c}`, marginBottom: 12 }}>
        <div style={tag(C.inkSoft)}>{name ? name + "'s verdict" : "Verdict"}</div>
        <div className="rf-disp rf-grade-text" style={{ color: grade.c, margin: "4px 0 6px" }}>{grade.t}</div>
        <p style={{ fontSize: 16, lineHeight: 1.45, margin: 0, color: C.ink }}>{grade.s}</p>
        <div className="rf-stats-row" style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
          <Stat big label="Score" v={score} C={C} />
          <Stat big label="Surrender" v={surrenderRate + "%"} col={surrenderRate > 25 ? C.blood : C.hold} C={C} />
          <Stat big label="Catch" v={catchRate + "%"} col={C.hold} C={C} />
        </div>
      </div>
      <div className="rf-rise" style={{ ...card, padding: 16, marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {quad.map((q) => (
            <div key={q.k} style={{ border: `1px solid ${C.line}`, borderLeft: `4px solid ${q.col}`, borderRadius: 8, padding: "10px 12px" }}>
              <div className="rf-disp" style={{ fontSize: 26, color: q.col }}>{q.v}</div>
              <div className="rf-mono" style={{ fontSize: 11, color: C.inkSoft }}>{q.label}</div>
            </div>
          ))}
        </div>
      </div>
      {/* where you went wrong */}
      {tally.mistakes && tally.mistakes.length > 0 && (
        <div className="rf-rise" style={{ marginBottom: 12 }}>
          <div style={{ ...tag(C.blood), fontSize: 12, marginBottom: 8 }}>Where you went wrong ({tally.mistakes.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tally.mistakes.map((m, i) => (
              <div key={i} style={{ ...card, padding: 0, overflow: "hidden", borderTop: `3px solid ${m.kind === "surrender" ? C.blood : C.inkSoft}` }}>
                <div style={{ padding: "10px 14px 8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={tag(m.kind === "surrender" ? C.blood : C.inkSoft)}>
                      {m.kind === "surrender" ? "Bought a lie" : "Flagged the truth"}
                    </span>
                    <span style={{ ...tag(C.inkSoft), marginLeft: "auto" }}>{m.domain}</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.4, margin: "0 0 8px", color: C.ink }}>{m.q}</p>
                </div>
                <div style={{ background: C.ink, padding: "8px 14px" }}>
                  <div className="rf-mono" style={{ fontSize: 10, letterSpacing: ".1em", color: "#aaa", marginBottom: 4 }}>AI SAID</div>
                  <p className="rf-mono" style={{ fontSize: 13, lineHeight: 1.5, margin: 0, color: C.paper }}>{m.ai}</p>
                </div>
                <div style={{ padding: "10px 14px" }}>
                  <div className="rf-mono" style={{ fontSize: 10, letterSpacing: ".1em", color: C.inkSoft, marginBottom: 2 }}>CORRECT ANSWER</div>
                  <div className="rf-mono" style={{ fontSize: 13, fontWeight: 600, color: C.hold, marginBottom: 8 }}>{m.truth}</div>
                  <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0, color: C.inkSoft, fontStyle: "italic" }}>{m.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {boardNote && <div className="rf-mono" style={{ fontSize: 11, color: C.inkSoft, marginBottom: 10, textAlign: "center" }}>{boardNote}</div>}
      <div className="rf-rise" style={{ marginBottom: 14 }}>
        <div style={{ ...tag(C.ink), fontSize: 12, marginBottom: 8 }}>Leaderboard</div>
        <Board board={board} C={C} card={card} highlight={name} />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setScreen("home")} className="rf-btn rf-disp" style={{ flex: 1, background: C.paper2, color: C.ink, fontSize: 18, padding: "15px", borderRadius: 12, border: `1px solid ${C.line}` }}>Home</button>
        <button onClick={start} className="rf-btn rf-disp" style={{ flex: 2, background: C.blood, color: C.flag, fontSize: 18, padding: "15px", borderRadius: 12, boxShadow: `0 4px 0 ${C.bloodDeep}` }}>Again →</button>
      </div>
    </div>
  );
}
function Stat({ label, v, col, big, C }) {
  return (
    <div style={{ flex: 1, minWidth: 80 }}>
      <div className="rf-disp" style={{ fontSize: big ? 30 : 22, color: col || C.ink, lineHeight: 1 }}>{v}</div>
      <div className="rf-mono" style={{ fontSize: 10, color: C.inkSoft, marginTop: 4 }}>{label}</div>
    </div>
  );
}
function Board({ board, C, card, compact, highlight }) {
  if (!board || board.length === 0) {
    return <div className="rf-mono" style={{ ...card, padding: 14, fontSize: 12, color: C.inkSoft, textAlign: "center" }}>No scores yet. Go first.</div>;
  }
  const rows = compact ? board.slice(0, 4) : board.slice(0, 8);
  return (
    <div style={{ ...card, padding: 6 }}>
      {rows.map((r, i) => {
        const me = highlight && r.name === highlight.slice(0, 24);
        return (
          <div key={r.name + i} className="rf-mono" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", fontSize: 13, background: me ? "rgba(192,33,31,.07)" : "transparent", borderRadius: 8 }}>
            <span style={{ color: i === 0 ? C.blood : C.inkSoft, width: 18, fontWeight: 700 }}>{i + 1}</span>
            <span style={{ color: C.ink, flex: 1, fontWeight: me ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
            <span style={{ color: C.inkSoft, fontSize: 11 }}>surr {r.surrenderRate}%</span>
            <span style={{ color: C.ink, fontWeight: 700, width: 42, textAlign: "right" }}>{r.bestScore}</span>
          </div>
        );
      })}
    </div>
  );
}
