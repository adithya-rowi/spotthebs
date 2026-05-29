import React, { useState, useEffect, useRef } from "react";
// RED FLAG — a cognitive surrender gym.
// Inspired by Shaw & Nave's "cognitive surrender" experiment (The Economist, Bartleby, Apr 2026).
// You face confident AI answers. ~half are subtly wrong. Catch them. Don't wave the white flag.
const C = {
  paper: "#f3ede1",
  paper2: "#ece4d3",
  ink: "#1b1510",
  inkSoft: "#5a4f44",
  blood: "#c0211f",
  bloodDeep: "#7c1513",
  flag: "#fbf8f2",
  hold: "#13675c", // resistance / caught
  line: "#d8cdb8",
};
const POINTS = { catch: 25, correctTrust: 10, surrender: -20, falseAlarm: -5 };
const ROUNDS = 8;
const DOMAINS = ["Cybersecurity", "GRC & compliance", "General knowledge", "Logic & numbers", "Finance"];
// Curated bank. isCorrect = whether the AI's shown answer is actually correct.
const BANK = [
  { domain: "Cybersecurity", q: "In the classic CIA triad of information security, what does the 'A' stand for?", ai: "Authentication. It ensures that users proving their identity is one of the three foundational security goals.", conf: 97, isCorrect: false, truth: "Availability.", why: "The triad is Confidentiality, Integrity, Availability. 'Authentication' sounds right because it's a security word, but it's not the A." },
  { domain: "GRC & compliance", q: "How many core Functions does NIST CSF 2.0 define?", ai: "Six: Govern, Identify, Protect, Detect, Respond, and Recover.", conf: 96, isCorrect: true, truth: "Six.", why: "CSF 2.0 added Govern to the original five. Many people still answer 'five' from the old version." },
  { domain: "Cybersecurity", q: "A CVSS v3.1 base score of 7.5 falls into which severity rating?", ai: "Critical. Anything at or above 7.0 is classified as Critical severity.", conf: 95, isCorrect: false, truth: "High (7.0–8.9). Critical starts at 9.0.", why: "7.0–8.9 is High; Critical is 9.0–10.0. The cutoff was nudged up by 2 points." },
  { domain: "General knowledge", q: "What is the capital city of Australia?", ai: "Sydney, the country's largest and most internationally recognised city.", conf: 96, isCorrect: false, truth: "Canberra.", why: "Sydney is the biggest city, not the capital. A very confident, very common error." },
  { domain: "Logic & numbers", q: "A racket and a ball cost 110,000 rupiah in total. The racket costs 100,000 more than the ball. How much is the ball?", ai: "10,000 rupiah. Subtract 100,000 from the 110,000 total and the ball is what remains.", conf: 99, isCorrect: false, truth: "5,000 rupiah.", why: "If the ball is 5k, the racket is 105k, total 110k, and the gap is exactly 100k. 10k is the intuitive trap." },
  { domain: "Cybersecurity", q: "MITRE maintains both ATT&CK and ATLAS. What does ATLAS specifically cover?", ai: "The adversarial threat landscape for AI and machine-learning systems.", conf: 92, isCorrect: true, truth: "Adversarial threats to AI/ML systems.", why: "ATLAS = Adversarial Threat Landscape for AI Systems. ATT&CK is the general enterprise matrix." },
  { domain: "General knowledge", q: "Who coined the term 'cognitive surrender' for over-reliance on AI?", ai: "Daniel Kahneman, in his book 'Thinking, Fast and Slow'.", conf: 91, isCorrect: false, truth: "Steven Shaw and Gideon Nave (Wharton), in a recent paper.", why: "A fabricated-but-plausible attribution. Kahneman fits the theme, so the lie slides past." },
  { domain: "Finance", q: "A stock falls from 10,000 to 8,000. What is the percentage decline?", ai: "25%. The 2,000 drop divided against the 8,000 ending price gives 25%.", conf: 98, isCorrect: false, truth: "20%.", why: "Decline is measured against the starting price: 2,000 / 10,000 = 20%. It would need a 25% rise to recover, which is the source of the mix-up." },
  { domain: "Cybersecurity", q: "AES-256 refers to a symmetric cipher using a key length of 256 what?", ai: "256 bits. AES-256 uses a 256-bit key with a fixed 128-bit block size.", conf: 96, isCorrect: true, truth: "Bits.", why: "Correct. The plausible wrong version would say 'bytes', which would be a 2048-bit key." },
  { domain: "GRC & compliance", q: "ISO/IEC 27001 is fundamentally a standard for what?", ai: "Establishing and maintaining an Information Security Management System (ISMS).", conf: 93, isCorrect: true, truth: "An ISMS.", why: "Correct. 27001 certifies the management system, not individual controls (that's the 27002 guidance)." },
  { domain: "Logic & numbers", q: "If it takes 5 machines 5 minutes to make 5 widgets, how long for 100 machines to make 100 widgets?", ai: "100 minutes. More widgets means proportionally more time on the line.", conf: 97, isCorrect: false, truth: "5 minutes.", why: "Each machine makes 1 widget in 5 minutes regardless of count. 100 machines make 100 widgets in the same 5 minutes." },
  { domain: "Cybersecurity", q: "In a TLS 1.3 connection, what does the handshake establish before application data flows?", ai: "Shared symmetric session keys, negotiated using asymmetric key exchange.", conf: 94, isCorrect: true, truth: "Shared session keys via asymmetric exchange.", why: "Correct. Asymmetric crypto bootstraps a fast symmetric key for the actual data." },
  { domain: "GRC & compliance", q: "Under most breach-notification regimes like GDPR, what is the headline deadline to notify the supervisory authority?", ai: "72 hours after becoming aware of the breach.", conf: 93, isCorrect: true, truth: "72 hours.", why: "Correct under GDPR Art. 33. The plausible wrong version would say '30 days', conflating it with data-subject timelines." },
  { domain: "Finance", q: "An investment grows 50% one year then falls 50% the next. Where does it end versus the start?", ai: "Back to even. A 50% gain and a 50% loss cancel each other out exactly.", conf: 98, isCorrect: false, truth: "Down 25%.", why: "100 → 150 → 75. Percentage gains and losses don't cancel because the base changes." },
  { domain: "General knowledge", q: "Light from the Sun takes roughly how long to reach Earth?", ai: "About 8 minutes (8 minutes 20 seconds on average).", conf: 95, isCorrect: true, truth: "~8 minutes.", why: "Correct. The plausible wrong version is '8 seconds', which sounds clean but is off by 60x." },
  { domain: "Cybersecurity", q: "What does the 'salt' in password hashing primarily defend against?", ai: "Brute-force attacks, by slowing down each individual hash computation.", conf: 92, isCorrect: false, truth: "Precomputed/rainbow-table attacks (and identical-password detection).", why: "Salt defeats precomputation and makes identical passwords hash differently. Slowing each hash is the job of a work factor, not the salt." },
  // --- a few more, spread across domains ---
  { domain: "General knowledge", q: "How many bones are in the adult human body?", ai: "206 bones, a count reached as cartilage fuses through childhood.", conf: 95, isCorrect: true, truth: "206.", why: "Correct. Babies have ~270; many fuse by adulthood. The plausible wrong version says '212'." },
  { domain: "Finance", q: "If an asset compounds at 7% a year, roughly how long until it doubles?", ai: "About 14 years, using the standard rule that doubling time equals 100 divided by the rate.", conf: 94, isCorrect: false, truth: "~10 years (Rule of 72: 72/7 ≈ 10.3).", why: "The doubling shortcut is the Rule of 72, not 100. 72/7 ≈ 10 years, not 14." },
  { domain: "Logic & numbers", q: "What is 15% of 80?", ai: "12. Ten percent of 80 is 8, and half of that again is 4, so 8 + 4 = 12.", conf: 97, isCorrect: true, truth: "12.", why: "Correct, and the reasoning shown is sound. Not every confident answer is a trap." },
  { domain: "GRC & compliance", q: "In RACI, what does the 'A' stand for?", ai: "Assisting — the people who pitch in to help complete the task.", conf: 90, isCorrect: false, truth: "Accountable.", why: "RACI = Responsible, Accountable, Consulted, Informed. 'Assisting' is invented; there is exactly one Accountable owner per task." },
  // ===== expanded bank — more variety across plays =====
  { domain: "General knowledge", q: "What is the capital of Canada?", ai: "Toronto, the country's financial and most populous hub.", conf: 95, isCorrect: false, truth: "Ottawa.", why: "Toronto is the biggest city; the capital is Ottawa. The 'biggest city = capital' reflex strikes again." },
  { domain: "General knowledge", q: "Can the Great Wall of China be seen from space with the naked eye?", ai: "Yes — it's famously the only human-made structure visible from orbit unaided.", conf: 93, isCorrect: false, truth: "No.", why: "A long-debunked myth. It's far too narrow to resolve with the naked eye from orbit." },
  { domain: "General knowledge", q: "Which planet is the largest in our solar system?", ai: "Jupiter, by a wide margin in both mass and diameter.", conf: 97, isCorrect: true, truth: "Jupiter.", why: "Correct. The plausible wrong version swaps in Saturn." },
  { domain: "General knowledge", q: "What is the chemical symbol for gold?", ai: "Go, taken from the first two letters of the element's English name.", conf: 90, isCorrect: false, truth: "Au (from Latin 'aurum').", why: "Element symbols often come from Latin. 'Go' is invented; gold is Au." },
  { domain: "General knowledge", q: "In which museum does the Mona Lisa hang?", ai: "The Louvre, in Paris.", conf: 96, isCorrect: true, truth: "The Louvre.", why: "Correct. A confident wrong version would say the Musée d'Orsay." },
  { domain: "Logic & numbers", q: "On the Monty Hall problem, after a goat is revealed should you switch doors?", ai: "It doesn't matter — with two doors left it's a clean 50/50 either way.", conf: 94, isCorrect: false, truth: "Switch — it wins 2/3 of the time.", why: "Your first pick stays at 1/3; the host's reveal concentrates the other 2/3 on the remaining door." },
  { domain: "Logic & numbers", q: "Does the repeating decimal 0.999… equal exactly 1?", ai: "No, it gets infinitely close but always stays just below 1.", conf: 92, isCorrect: false, truth: "Yes, 0.999… = 1 exactly.", why: "They are two notations for the same number; the difference is zero, not infinitesimal." },
  { domain: "Logic & numbers", q: "How many minutes are there in one week?", ai: "10,080 minutes (7 × 24 × 60).", conf: 96, isCorrect: true, truth: "10,080.", why: "Correct. The trap answer is 1,440, which is minutes in a single day." },
  { domain: "Logic & numbers", q: "Flip a fair coin twice. What's the chance of two heads?", ai: "50%, since each flip independently has a 50% chance of heads.", conf: 95, isCorrect: false, truth: "25% (½ × ½).", why: "Each flip is 50%, but both happening is the product: 0.5 × 0.5 = 0.25." },
  { domain: "Logic & numbers", q: "Roughly how many people are needed for a >50% chance two share a birthday?", ai: "Around 183 — about half of 365 days.", conf: 91, isCorrect: false, truth: "About 23.", why: "The birthday paradox: it counts pairs, not days, so the number is far lower than intuition expects." },
  { domain: "Finance", q: "When market interest rates rise, what happens to existing bond prices?", ai: "They fall — bond prices and yields move inversely.", conf: 94, isCorrect: true, truth: "They fall.", why: "Correct. Older, lower-coupon bonds become less attractive, so their price drops." },
  { domain: "Finance", q: "With 3% annual inflation, roughly how long until prices double?", ai: "About 24 years, using the Rule of 72 (72 ÷ 3).", conf: 93, isCorrect: true, truth: "~24 years.", why: "Correct application of the Rule of 72. The trap would divide by 100 and say ~33 years." },
  { domain: "Finance", q: "What does diversification primarily reduce in a portfolio?", ai: "Systematic (market-wide) risk, by spreading bets across many assets.", conf: 90, isCorrect: false, truth: "Unsystematic (asset-specific) risk.", why: "Diversification cancels idiosyncratic risk; market-wide (systematic) risk can't be diversified away." },
  { domain: "Finance", q: "A company earns $20 profit on $100 of revenue. What's its net profit margin?", ai: "20%. Margin is profit divided by revenue: 20 / 100.", conf: 96, isCorrect: true, truth: "20%.", why: "Correct. Margin is profit over revenue, not profit over cost." },
  { domain: "Cybersecurity", q: "What is the default port for HTTPS?", ai: "Port 80, the standard web-traffic port.", conf: 92, isCorrect: false, truth: "443 (port 80 is plain HTTP).", why: "80 is HTTP; HTTPS uses 443. The two get swapped constantly." },
  { domain: "Cybersecurity", q: "Is RSA a symmetric or asymmetric cipher?", ai: "Asymmetric — it uses a public/private key pair.", conf: 95, isCorrect: true, truth: "Asymmetric.", why: "Correct. AES is the common symmetric counterexample." },
  { domain: "Cybersecurity", q: "What best mitigates SQL injection?", ai: "Client-side input validation in the browser before the form submits.", conf: 91, isCorrect: false, truth: "Parameterized queries / prepared statements.", why: "Client-side checks are trivially bypassed. The real fix is parameterized queries on the server." },
  { domain: "Cybersecurity", q: "What is a zero-day vulnerability?", ai: "A flaw unknown to the vendor, with no patch available yet.", conf: 93, isCorrect: true, truth: "An unpatched flaw unknown to the vendor.", why: "Correct. 'Zero days' of warning before exploitation is possible." },
  { domain: "Cybersecurity", q: "Is a cryptographic hash function reversible if you have the key?", ai: "Yes — with the correct key you can decrypt a hash back to the original input.", conf: 90, isCorrect: false, truth: "No. Hashing is one-way and uses no key.", why: "Hashing isn't encryption; it has no key and can't be reversed. This confuses hashing with ciphers." },
  { domain: "GRC & compliance", q: "What does a SOC 2 Type II report cover that Type I does not?", ai: "Control effectiveness over a period of time, not just at a single point.", conf: 92, isCorrect: true, truth: "Operating effectiveness over a period.", why: "Correct. Type I is design at a point in time; Type II tests operation over months." },
  { domain: "GRC & compliance", q: "What kind of data is PCI DSS designed to protect?", ai: "Protected health information held by hospitals and insurers.", conf: 89, isCorrect: false, truth: "Payment card (cardholder) data.", why: "That's HIPAA's domain. PCI DSS governs credit/debit card data." },
  { domain: "GRC & compliance", q: "What is 'residual risk'?", ai: "The risk that remains after controls and mitigations are applied.", conf: 91, isCorrect: true, truth: "Risk remaining after controls.", why: "Correct. Inherent risk is before controls; residual is what's left after." },
  { domain: "GRC & compliance", q: "Who can issue an official SOC 2 attestation report?", ai: "Any internal security team member who completes the audit checklist.", conf: 88, isCorrect: false, truth: "An independent licensed CPA firm.", why: "SOC 2 is an AICPA attestation; it must come from an independent CPA, not an internal self-assessment." },
  // ===== additional questions — batch 2 =====
  // --- Cybersecurity ---
  { domain: "Cybersecurity", q: "Which layer of the OSI model does a traditional firewall primarily operate on?", ai: "Layer 7 (Application), inspecting full HTTP payloads to make decisions.", conf: 88, isCorrect: false, truth: "Layer 3/4 (Network/Transport) — packet-filtering firewalls work on IP and port.", why: "Traditional firewalls filter by IP address and port (layers 3 & 4). Layer 7 inspection is next-gen NGFW territory." },
  { domain: "Cybersecurity", q: "What distinguishes a worm from a virus?", ai: "A worm encrypts your files for ransom; a virus merely replicates.", conf: 86, isCorrect: false, truth: "A worm self-propagates across networks without user action; a virus needs a host file.", why: "Ransomware is a separate category. Worm vs virus is about self-propagation, not encryption." },
  { domain: "Cybersecurity", q: "What does 'MFA fatigue' (prompt bombing) attack exploit?", ai: "A weakness in biometric sensors that causes them to misread fingerprints after repeated scans.", conf: 87, isCorrect: false, truth: "It floods a user with push notifications until they accidentally approve one out of frustration.", why: "MFA fatigue targets human impatience, not technology flaws — sending dozens of push requests hoping the user taps 'Approve' to make it stop." },
  { domain: "Cybersecurity", q: "In PKI, what is a Certificate Revocation List (CRL)?", ai: "A published list of certificates that have been revoked before their expiry date.", conf: 93, isCorrect: true, truth: "A list of certificates revoked before expiry.", why: "Correct. OCSP is the online real-time alternative to the batch CRL approach." },
  { domain: "Cybersecurity", q: "Which type of scan sends a SYN packet but never completes the TCP handshake?", ai: "A stealth (half-open) SYN scan — it reads the SYN-ACK response then sends RST instead of ACK.", conf: 90, isCorrect: true, truth: "A SYN (stealth/half-open) scan.", why: "Correct. Not completing the handshake avoids logging on many older systems." },
  // --- GRC & compliance ---
  { domain: "GRC & compliance", q: "Under GDPR, which legal basis allows processing without asking for consent?", ai: "There is none — GDPR always requires explicit consent before processing personal data.", conf: 89, isCorrect: false, truth: "Several, including legitimate interests, contract performance, and legal obligation.", why: "GDPR has six lawful bases; consent is just one. Contracts, legal obligations, and legitimate interests are common non-consent bases." },
  { domain: "GRC & compliance", q: "What is the purpose of a Business Impact Analysis (BIA)?", ai: "To identify and rank the criticality of business processes and quantify the effect of disruptions.", conf: 91, isCorrect: true, truth: "Identify critical processes and quantify disruption impact.", why: "Correct. BIA feeds into RTO/RPO targets and recovery prioritisation." },
  { domain: "GRC & compliance", q: "HIPAA's Security Rule applies to which type of information specifically?", ai: "All personal data of US citizens, including financial and educational records.", conf: 87, isCorrect: false, truth: "Electronic Protected Health Information (ePHI) held by covered entities.", why: "HIPAA is scoped to health data (ePHI). Financial data is GLBA territory; educational records are FERPA." },
  { domain: "GRC & compliance", q: "In risk management, what is the difference between 'risk appetite' and 'risk tolerance'?", ai: "They are synonyms — both describe the maximum risk an organisation is willing to accept.", conf: 85, isCorrect: false, truth: "Appetite is the broad level of risk willingness; tolerance is the acceptable deviation from that target.", why: "Appetite is strategic guidance; tolerance is the operational threshold before action is required. Many frameworks distinguish them." },
  // --- General knowledge ---
  { domain: "General knowledge", q: "What is the most spoken native language in the world?", ai: "English — it is the global lingua franca and has the most first-language speakers.", conf: 88, isCorrect: false, truth: "Mandarin Chinese (by native speakers).", why: "English leads in total speakers when including second-language speakers, but Mandarin has the most native/first-language speakers by a wide margin." },
  { domain: "General knowledge", q: "Did humans and dinosaurs coexist?", ai: "Yes — early Homo sapiens coexisted with the last dinosaurs before a mass extinction.", conf: 85, isCorrect: false, truth: "No — non-avian dinosaurs went extinct ~66 million years ago; humans appeared ~300,000 years ago.", why: "There's a ~65.7 million year gap. The confusion sometimes stems from birds being technically dinosaurs, but that's not what the question implies." },
  { domain: "General knowledge", q: "Which ocean is the largest by surface area?", ai: "The Pacific Ocean, covering more than 30% of Earth's total surface.", conf: 96, isCorrect: true, truth: "The Pacific Ocean.", why: "Correct. The Pacific is roughly equal in area to all the landmasses combined." },
  { domain: "General knowledge", q: "What is the hardest natural substance on Earth?", ai: "Diamonds — they score 10 on the Mohs hardness scale.", conf: 97, isCorrect: true, truth: "Diamond.", why: "Correct. The plausible wrong version says 'tungsten', which is the hardest metal but not the hardest natural substance." },
  { domain: "General knowledge", q: "In what year did the Berlin Wall fall?", ai: "1987, following Ronald Reagan's famous 'Tear down this wall' speech.", conf: 88, isCorrect: false, truth: "1989.", why: "Reagan's speech was in 1987, but the Wall fell on 9 November 1989. Associating the two events blurs the two-year gap." },
  { domain: "General knowledge", q: "How many continents are there on Earth?", ai: "Seven: Africa, Antarctica, Asia, Australia, Europe, North America, and South America.", conf: 93, isCorrect: true, truth: "Seven (by the most common model).", why: "Correct under the 7-continent model taught in most English-speaking countries. Some models use 5 or 6, but 7 is standard." },
  // --- Logic & numbers ---
  { domain: "Logic & numbers", q: "You have a 3-litre jug and a 5-litre jug. How do you measure exactly 4 litres using only water and those jugs?", ai: "It's impossible — neither jug is a multiple of 4.", conf: 88, isCorrect: false, truth: "Fill the 5L, pour into 3L (leaves 2L in 5L jug), empty 3L, pour 2L in, fill 5L again, top off the 3L (which needs 1L), leaving 4L in the 5L jug.", why: "A classic pouring puzzle. Since gcd(3,5)=1 you can measure any integer up to 5 — including 4." },
  { domain: "Logic & numbers", q: "Is the number zero even or odd?", ai: "Neither — zero is a special case that falls outside the even/odd classification.", conf: 86, isCorrect: false, truth: "Even. Zero is divisible by 2 with no remainder.", why: "By definition, an even number is any integer n where n mod 2 = 0. Zero satisfies this perfectly." },
  { domain: "Logic & numbers", q: "A store marks an item up 20% then discounts it 20%. Is the final price the same as the original?", ai: "Yes — a 20% rise and a 20% fall cancel out exactly.", conf: 94, isCorrect: false, truth: "No — it ends up 4% lower than the original price.", why: "100 → 120 → 96. The discount applies to the higher marked-up price, so the bases differ. Net effect: −4%." },
  // --- Finance ---
  { domain: "Finance", q: "What does 'shorting' a stock mean?", ai: "Buying a stock you expect to rise in value, to profit from the increase.", conf: 87, isCorrect: false, truth: "Borrowing and selling a stock you expect to fall, then buying it back cheaper to pocket the difference.", why: "Shorting is a bet on decline, not a rise. Long positions profit from increases; short positions from decreases." },
  { domain: "Finance", q: "A credit card charges 2% monthly interest. What is the approximate annual percentage rate (APR)?", ai: "2% per month is 24% APR (2 × 12).", conf: 90, isCorrect: false, truth: "~26.8% APR (compounded: 1.02^12 − 1).", why: "Simple multiplication ignores compounding. With monthly compounding, the effective annual rate is ~26.8%, not 24%." },
  { domain: "Finance", q: "What is the difference between gross profit and net profit?", ai: "Gross profit subtracts all costs including taxes and interest; net profit is revenue minus only cost of goods.", conf: 84, isCorrect: false, truth: "Gross profit = revenue minus cost of goods sold; net profit further deducts operating expenses, interest, and taxes.", why: "It's the opposite of what the AI states. Gross is the top-level margin; net is after all deductions." },
  { domain: "Finance", q: "Which of these is generally considered a 'risk-free' benchmark rate in finance?", ai: "The return on short-term government treasury bills.", conf: 92, isCorrect: true, truth: "Short-term government treasury bills (e.g., US T-bills).", why: "Correct. Government bonds of stable economies are treated as effectively risk-free and used as the discount-rate floor." },
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
  const [choice, setChoice] = useState(null); // "accept" | "flag"
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [tally, setTally] = useState({ catch: 0, surrender: 0, correctTrust: 0, falseAlarm: 0, wrongShown: 0, rightShown: 0 });
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
    setTally({ catch: 0, surrender: 0, correctTrust: 0, falseAlarm: 0, wrongShown: 0, rightShown: 0 });
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
    setTally((t) => ({
      ...t,
      [kind]: t[kind] + 1,
      wrongShown: t.wrongShown + (aiWrong ? 1 : 0),
      rightShown: t.rightShown + (aiWrong ? 0 : 1),
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
      setBoardNote("Saved to the shared board (visible to everyone playing).");
    } catch (e) {
      setBoardNote("Couldn't reach the shared board. Score kept for this session.");
    }
  }
  const surrenderRate = tally.wrongShown ? Math.round((tally.surrender / tally.wrongShown) * 100) : 0;
  const catchRate = tally.wrongShown ? Math.round((tally.catch / tally.wrongShown) * 100) : 0;
  // ---------- styles ----------
  const css = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Spline+Sans+Mono:wght@400;500;600&display=swap');
* { box-sizing: border-box; }
body { overflow-x: hidden; }
.rf-root { font-family: 'Newsreader', Georgia, serif; color: ${C.ink}; overflow-x: hidden; }
.rf-disp { font-family: 'Anton', Impact, sans-serif; letter-spacing: .02em; text-transform: uppercase; line-height: .92; }
.rf-mono { font-family: 'Spline Sans Mono', ui-monospace, monospace; }
@keyframes rfIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes rfWave { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(4deg); } }
@keyframes rfPulse { 0%,100% { opacity:.5 } 50% { opacity:1 } }
.rf-rise { animation: rfIn .5s cubic-bezier(.2,.8,.2,1) both; }
.rf-btn { cursor: pointer; border: none; transition: transform .12s ease, box-shadow .12s ease; min-height: 48px; touch-action: manipulation; }
.rf-btn:active { transform: translateY(1px) scale(.99); }
.rf-paperbg { background:
   radial-gradient(circle at 12% 8%, rgba(192,33,31,.06), transparent 40%),
   radial-gradient(circle at 88% 92%, rgba(19,103,92,.05), transparent 40%),
   ${C.paper}; }
.rf-grain { position:absolute; inset:0; opacity:.045; pointer-events:none; mix-blend-mode:multiply;
   background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.rf-home-h1 { font-size: 46px; margin: 4px 0 8px; }
.rf-grade-text { font-size: 40px; }
.rf-q-text { font-size: 20px; }
.rf-ai-text { font-size: 14px; }
.rf-masthead-sub { display: block; }
@media (max-width: 430px) {
  .rf-home-h1 { font-size: 32px; }
  .rf-grade-text { font-size: 30px; }
  .rf-q-text { font-size: 17px; }
  .rf-ai-text { font-size: 13px; }
  .rf-masthead-sub { display: none; }
  .rf-stats-row { flex-wrap: wrap; }
  .rf-stats-row > * { flex: 1 1 40%; min-width: 80px; }
}
`;
  const wrap = { minHeight: "100vh", position: "relative", padding: "20px 16px 56px" };
  const inner = { maxWidth: 560, margin: "0 auto", position: "relative", zIndex: 1 };
  const card = { background: C.flag, border: `1px solid ${C.line}`, borderRadius: 4, boxShadow: "0 1px 0 rgba(0,0,0,.04), 0 14px 30px -22px rgba(27,21,16,.5)" };
  const tag = (col) => ({ display: "inline-block", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: col, fontWeight: 600 });
  return (
    <div className="rf-root rf-paperbg" style={wrap}>
      <style>{css}</style>
      <div className="rf-grain" />
      <div style={inner}>
        {/* Masthead */}
        <div className="rf-rise" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 34, height: 26, background: C.blood, position: "relative", flex: "0 0 auto" }}>
            <div style={{ position: "absolute", left: 6, top: 4, width: 16, height: 11, background: C.flag, transform: "skewX(-12deg)" }} />
            <div style={{ position: "absolute", left: 5, top: 4, width: 2, height: 18, background: C.flag }} />
          </div>
          <div className="rf-disp" style={{ fontSize: 22 }}>Red&nbsp;Flag</div>
          <div className="rf-mono rf-masthead-sub" style={{ marginLeft: "auto", fontSize: 10, color: C.inkSoft, textAlign: "right", lineHeight: 1.3 }}>
            a cognitive<br />surrender gym
          </div>
        </div>
        {screen === "home" && (
          <Home {...{ name, setName, start, board, card, tag, C }} />
        )}
        {(screen === "play" || screen === "reveal") && (
          <Play
            {...{ item, round, score, streak, choice, screen, decide, advance, card, tag, C, POINTS }}
          />
        )}
        {screen === "results" && (
          <Results
            {...{ score, surrenderRate, catchRate, tally, board, boardNote, start, setScreen, card, tag, C, name }}
          />
        )}
        <div className="rf-mono" style={{ textAlign: "center", fontSize: 10, color: C.inkSoft, marginTop: 28, opacity: .7 }}>
          confidence is the trap. don't read swagger as accuracy.
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
      <h1 className="rf-disp rf-rise rf-home-h1" style={{ animationDelay: ".05s" }}>
        Don't wave<br /><span style={{ color: C.blood }}>the white flag.</span>
      </h1>
      <p className="rf-rise" style={{ fontSize: 17, lineHeight: 1.5, color: C.inkSoft, margin: "0 0 22px", animationDelay: ".12s" }}>
        You'll get eight confident AI answers. Roughly half are subtly wrong. Your job is to catch them.
        Accept a lie and you've surrendered. Flag it and you resist.
      </p>
      <div className="rf-rise" style={{ ...card, padding: 16, marginBottom: 14, animationDelay: ".18s" }}>
        <div style={tag(C.inkSoft)}>Your name (for the team board)</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Adith"
          className="rf-mono"
          style={{ width: "100%", marginTop: 8, padding: "10px 12px", fontSize: 15, border: `1px solid ${C.line}`, borderRadius: 4, background: "#fff", color: C.ink, outline: "none" }}
        />
      </div>
      <button onClick={start} className="rf-btn rf-disp rf-rise" style={{ width: "100%", background: C.blood, color: C.flag, fontSize: 24, padding: "16px", borderRadius: 4, boxShadow: `0 6px 0 ${C.bloodDeep}`, animationDelay: ".24s" }}>
        Begin the drill →
      </button>
      <div className="rf-rise" style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap", animationDelay: ".3s" }}>
        <ScoreLegend C={C} />
      </div>
      <div className="rf-rise" style={{ marginTop: 22, animationDelay: ".36s" }}>
        <div style={{ ...tag(C.ink), fontSize: 12, marginBottom: 8 }}>Team board</div>
        <Board board={board} C={C} card={card} compact />
      </div>
    </div>
  );
}
function ScoreLegend({ C }) {
  const rows = [
    ["Catch a wrong answer", "+25", C.hold],
    ["Trust a right answer", "+10", C.inkSoft],
    ["Surrender to a lie", "-20", C.blood],
    ["Flag a correct answer", "-5", C.inkSoft],
  ];
  return (
    <div className="rf-mono" style={{ width: "100%", fontSize: 12, border: `1px dashed ${C.line}`, borderRadius: 4, padding: "10px 12px" }}>
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
        <div className="rf-mono" style={{ fontSize: 13, color: C.inkSoft, animation: "rfPulse 1.1s infinite" }}>
          loading the drill…
        </div>
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
    catch: { label: "CAUGHT IT", col: C.hold, msg: "Confident and wrong, and you flagged it. That's the muscle." },
    surrender: { label: "SURRENDERED", col: C.blood, msg: "It was wrong and you took it. This is the exact failure the study warns about." },
    correctTrust: { label: "GOOD TRUST", col: C.inkSoft, msg: "It was right and you accepted it. Calibrated." },
    falseAlarm: { label: "FALSE ALARM", col: C.inkSoft, msg: "It was actually correct. Paranoia has a cost too." },
  }[kind];
  return (
    <div>
      {/* status bar */}
      <div className="rf-mono" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: C.inkSoft, marginBottom: 12 }}>
        <span>Round {round}/{ROUNDS}</span>
        <span style={{ marginLeft: "auto" }}>Score <b style={{ color: C.ink }}>{score}</b></span>
        {streak > 1 && <Pill bg={C.hold} fg="#fff">{streak} streak</Pill>}
      </div>
      <div style={{ ...card, padding: 18, marginBottom: 14 }} className="rf-rise" key={item.q}>
        <div style={tag(C.blood)}>{item.domain}</div>
        <p className="rf-q-text" style={{ lineHeight: 1.4, margin: "10px 0 0", fontWeight: 500 }}>{item.q}</p>
      </div>
      {/* AI dispatch */}
      <div style={{ ...card, padding: 0, overflow: "hidden", marginBottom: 16 }} className="rf-rise">
        <div style={{ background: C.ink, color: C.paper, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <span className="rf-mono" style={{ fontSize: 11, letterSpacing: ".1em" }}>AI ASSISTANT</span>
          <span className="rf-mono" style={{ marginLeft: "auto", fontSize: 11, color: "#e8b3b2" }}>● {item.conf}% confident</span>
        </div>
        <p className="rf-mono rf-ai-text" style={{ lineHeight: 1.55, margin: 0, padding: "14px 16px", color: C.ink }}>{item.ai}</p>
      </div>
      {screen === "play" && (
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => decide("accept")} className="rf-btn rf-disp" style={{ flex: 1, background: C.paper2, color: C.ink, fontSize: 20, padding: "16px 8px", borderRadius: 4, border: `1px solid ${C.line}` }}>
            Accept
            <div className="rf-mono" style={{ fontSize: 10, fontWeight: 400, opacity: .6, letterSpacing: 0 }}>trust it</div>
          </button>
          <button onClick={() => decide("flag")} className="rf-btn rf-disp" style={{ flex: 1, background: C.blood, color: C.flag, fontSize: 20, padding: "16px 8px", borderRadius: 4, boxShadow: `0 5px 0 ${C.bloodDeep}` }}>
            🚩 Red Flag
            <div className="rf-mono" style={{ fontSize: 10, fontWeight: 400, opacity: .85, letterSpacing: 0 }}>it's wrong</div>
          </button>
        </div>
      )}
      {screen === "reveal" && verdict && (
        <div className="rf-rise">
          <div style={{ ...card, padding: 16, borderTop: `4px solid ${verdict.col}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="rf-disp" style={{ fontSize: 22, color: verdict.col }}>{verdict.label}</span>
              <span className="rf-mono" style={{ marginLeft: "auto", fontSize: 16, fontWeight: 600, color: verdict.col }}>
                {POINTS[kind] > 0 ? "+" : ""}{POINTS[kind]}
              </span>
            </div>
            <div className="rf-mono" style={{ fontSize: 12, marginTop: 10, color: C.inkSoft }}>
              The AI was <b style={{ color: aiWrong ? C.blood : C.hold }}>{aiWrong ? "WRONG" : "RIGHT"}</b>. Correct answer: <b style={{ color: C.ink }}>{item.truth}</b>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.5, margin: "10px 0 0", color: C.ink }}>{verdict.msg}</p>
            <p style={{ fontSize: 14, lineHeight: 1.5, margin: "8px 0 0", color: C.inkSoft, fontStyle: "italic" }}>{item.why}</p>
          </div>
          <button onClick={advance} className="rf-btn rf-disp" style={{ width: "100%", marginTop: 12, background: C.ink, color: C.paper, fontSize: 20, padding: "14px", borderRadius: 4 }}>
            {round >= ROUNDS ? "See the verdict →" : "Next round →"}
          </button>
        </div>
      )}
    </div>
  );
}
function Results({ score, surrenderRate, catchRate, tally, board, boardNote, start, setScreen, card, tag, C, name }) {
  const grade =
    surrenderRate === 0 && tally.wrongShown > 0 ? { t: "UNSURRENDERED", c: C.hold, s: "You caught every confident lie. This is exactly the worker the article says to hire." }
    : surrenderRate <= 25 ? { t: "RESISTANT", c: C.hold, s: "Strong skepticism. A few got through, but you override the model when it counts." }
    : surrenderRate <= 50 ? { t: "WAVERING", c: C.blood, s: "Half the lies slipped past. The confident tone is doing your thinking for you." }
    : { t: "SURRENDERED", c: C.bloodDeep, s: "Most confident-but-wrong answers were accepted. This is the failure mode, in miniature." };
  const quad = [
    { k: "catch", label: "Caught lies", v: tally.catch, col: C.hold, good: true },
    { k: "correctTrust", label: "Right trust", v: tally.correctTrust, col: C.inkSoft, good: true },
    { k: "surrender", label: "Surrenders", v: tally.surrender, col: C.blood, good: false },
    { k: "falseAlarm", label: "False alarms", v: tally.falseAlarm, col: C.inkSoft, good: false },
  ];
  return (
    <div>
      <div className="rf-rise" style={{ ...card, padding: 20, borderTop: `5px solid ${grade.c}`, marginBottom: 14 }}>
        <div style={tag(C.inkSoft)}>{name ? name + "'s verdict" : "Verdict"}</div>
        <div className="rf-disp rf-grade-text" style={{ color: grade.c, margin: "4px 0 6px" }}>{grade.t}</div>
        <p style={{ fontSize: 16, lineHeight: 1.5, margin: 0, color: C.ink }}>{grade.s}</p>
        <div className="rf-stats-row" style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
          <Stat big label="Score" v={score} C={C} />
          <Stat big label="Surrender rate" v={surrenderRate + "%"} col={surrenderRate > 25 ? C.blood : C.hold} C={C} />
          <Stat big label="Catch rate" v={catchRate + "%"} col={C.hold} C={C} />
        </div>
      </div>
      {/* confusion quadrant */}
      <div className="rf-rise" style={{ ...card, padding: 16, marginBottom: 14 }}>
        <div style={{ ...tag(C.ink), fontSize: 12, marginBottom: 10 }}>Your confusion matrix</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {quad.map((q) => (
            <div key={q.k} style={{ border: `1px solid ${C.line}`, borderLeft: `4px solid ${q.col}`, borderRadius: 4, padding: "10px 12px" }}>
              <div className="rf-disp" style={{ fontSize: 26, color: q.col }}>{q.v}</div>
              <div className="rf-mono" style={{ fontSize: 11, color: C.inkSoft }}>{q.label}</div>
            </div>
          ))}
        </div>
      </div>
      {boardNote && <div className="rf-mono" style={{ fontSize: 11, color: C.inkSoft, marginBottom: 10, textAlign: "center" }}>{boardNote}</div>}
      <div className="rf-rise" style={{ marginBottom: 16 }}>
        <div style={{ ...tag(C.ink), fontSize: 12, marginBottom: 8 }}>Team board</div>
        <Board board={board} C={C} card={card} highlight={name} />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setScreen("home")} className="rf-btn rf-disp" style={{ flex: 1, background: C.paper2, color: C.ink, fontSize: 18, padding: "14px", borderRadius: 4, border: `1px solid ${C.line}` }}>Home</button>
        <button onClick={start} className="rf-btn rf-disp" style={{ flex: 2, background: C.blood, color: C.flag, fontSize: 18, padding: "14px", borderRadius: 4, boxShadow: `0 5px 0 ${C.bloodDeep}` }}>Run it again →</button>
      </div>
    </div>
  );
}
function Stat({ label, v, col, big, C }) {
  return (
    <div style={{ flex: 1 }}>
      <div className="rf-disp" style={{ fontSize: big ? 30 : 22, color: col || C.ink, lineHeight: 1 }}>{v}</div>
      <div className="rf-mono" style={{ fontSize: 10, color: C.inkSoft, marginTop: 4 }}>{label}</div>
    </div>
  );
}
function Board({ board, C, card, compact, highlight }) {
  if (!board || board.length === 0) {
    return <div className="rf-mono" style={{ ...card, padding: 14, fontSize: 12, color: C.inkSoft, textAlign: "center" }}>No scores yet. Be the first to refuse to surrender.</div>;
  }
  const rows = compact ? board.slice(0, 4) : board.slice(0, 8);
  return (
    <div style={{ ...card, padding: 6 }}>
      {rows.map((r, i) => {
        const me = highlight && r.name === highlight.slice(0, 24);
        return (
          <div key={r.name + i} className="rf-mono" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", fontSize: 13, background: me ? "rgba(192,33,31,.07)" : "transparent", borderRadius: 4 }}>
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
