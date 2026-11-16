// "Ask the Atlas" — grounded Q&A over the structured PSI investigation records.
// Runs as a Vercel serverless function. The API key stays server-side (ANTHROPIC_API_KEY).
const INV = require("../data/investigations.json");

const MODEL = process.env.ATLAS_MODEL || "claude-haiku-5-5";

// --- Abuse protection ---------------------------------------------------
// 1) Only accept requests coming from the atlas itself.
const ALLOWED_HOSTS = ["free-fall-fire-atlas.vercel.app", "localhost", "127.0.0.1"];
// 2) Per-visitor limits (per server instance; the Anthropic spend cap is the hard backstop).
const PER_10_MIN = 5;
const PER_DAY = 20;
// 3) Total questions per server instance per day.
const INSTANCE_PER_DAY = 300;

const hits = new Map(); // ip -> [timestamps]
let dayStart = Date.now(), dayCount = 0;

function hostOf(u) { try { return new URL(u).hostname; } catch { return ""; } }
function allowedOrigin(req) {
  const h = hostOf(req.headers.origin || req.headers.referer || "");
  return ALLOWED_HOSTS.some(a => h === a || h.endsWith("." + a));
}
function rateLimited(ip) {
  const now = Date.now();
  if (now - dayStart > 864e5) { dayStart = now; dayCount = 0; hits.clear(); }
  if (dayCount >= INSTANCE_PER_DAY) return "The atlas has answered its daily limit of questions. Please try again tomorrow.";
  const list = (hits.get(ip) || []).filter(t => now - t < 864e5);
  if (list.filter(t => now - t < 6e5).length >= PER_10_MIN) return "You've asked several questions in a row. Please wait a few minutes and try again.";
  if (list.length >= PER_DAY) return "You've reached today's question limit. Please come back tomorrow.";
  list.push(now); hits.set(ip, list); dayCount++;
  if (hits.size > 5000) hits.clear();
  return null;
}
// ------------------------------------------------------------------------

const SYSTEM = `You are the analysis engine of "Free Fall Fire Atlas", a NASA Space Apps tool that helps aerospace engineers and researchers apply NASA's microgravity combustion experiments (PSI database) to crew-habitat fire safety.

Rules:
- Answer ONLY from the investigation records provided. Each record has an "id".
- After every factual sentence, cite the record(s) it relies on as [ID], e.g. [BASS-II] or [SAF1, CFIG].
- If the records do not contain the answer, say so plainly and name the research gap. Never invent numbers, materials or results.
- Ranges marked conf "≈" are approximate; say "approximately" when you use them.
- PSI has no partial-gravity combustion data. For Moon or Mars, say that microgravity and 1 g results are reference cases only and cannot be directly extrapolated, because combustion is nonlinear. ACME E-FIELD reproduces only some body-force effects.
- Distinguish what a study reported from your own inference, and never present safety advice as validated for engineering use.
- Organize practical advice under prevention, detection and suppression when relevant.
- Only answer questions about these investigations and spacecraft fire safety; politely decline anything else.
- Be concise: at most 180 words, plain language, no markdown headings.`;

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  if (!allowedOrigin(req)) return res.status(403).json({ error: "Questions can only be asked from the atlas page." });

  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const limited = rateLimited(ip);
  if (limited) return res.status(429).json({ error: limited });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: "The AI engine is not configured on this deployment." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const question = String(body?.question || "").slice(0, 400).trim();
  const scenario = body?.scenario && typeof body.scenario === "object" ? body.scenario : {};
  if (!question) return res.status(400).json({ error: "Ask a question first." });

  const user = `Habitat scenario: ${JSON.stringify(scenario).slice(0, 600)}

Investigation records (JSON):
${JSON.stringify(INV)}

Question: ${question}`;

  async function call(model) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", signal: ctl.signal,
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: 900, system: SYSTEM, messages: [{ role: "user", content: user }] })
      });
      const j = await r.json();
      if (!r.ok) console.error("Anthropic error", model, r.status, j?.error?.message);
      return { r, j };
    } finally { clearTimeout(timer); }
  }

  try {
    let { r, j } = await call(MODEL);
    if (!r.ok && MODEL !== "claude-sonnet-5-5") ({ r, j } = await call("claude-sonnet-5-5"));
    if (!r.ok) return res.status(502).json({ error: "The AI engine is unavailable right now. The ranking, map and brief still work." });
    const text = (j.content || []).filter(c => c.type === "text").map(c => c.text).join("\n");
    const cited = [...new Set([...text.matchAll(/\[([^\]]+)\]/g)].flatMap(m => m[1].split(/,\s*/)))]
      .filter(id => INV.some(i => i.id === id));
    res.status(200).json({ answer: text, cited, model: MODEL });
  } catch (e) {
    console.error("Ask failed", e && e.name, e && e.message);
    res.status(504).json({ error: e && e.name === "AbortError" ? "The AI engine took too long to answer. Please try again." : "Could not reach the AI engine." });
  }
};
