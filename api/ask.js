// "Ask the Atlas" — grounded Q&A over the structured PSI investigation records.
// Runs as a Vercel serverless function. The API key stays server-side (ANTHROPIC_API_KEY).
const INV = require("../data/investigations.json");

const MODEL = process.env.ATLAS_MODEL || "claude-sonnet-5-5";

const SYSTEM = `You are the analysis engine of "Free Fall Fire Atlas", a NASA Space Apps tool that helps aerospace engineers and researchers apply NASA's microgravity combustion experiments (PSI database) to crew-habitat fire safety.

Rules:
- Answer ONLY from the investigation records provided. Each record has an "id".
- After every factual sentence, cite the record(s) it relies on as [ID], e.g. [BASS-II] or [SAF1, CFIG].
- If the records do not contain the answer, say so plainly and name the research gap. Never invent numbers, materials or results.
- Ranges marked conf "≈" are approximate; say "approximately" when you use them.
- PSI has no partial-gravity combustion data; for Moon or Mars, reason that behaviour is bounded by microgravity and 1 g data, and mention ACME E-FIELD as the nearest proxy.
- Organize practical advice under prevention, detection and suppression when relevant.
- Be concise: at most 180 words, plain language, no markdown headings.`;

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: "The AI engine is not configured on this deployment." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const question = String(body?.question || "").slice(0, 600).trim();
  const scenario = body?.scenario || {};
  if (!question) return res.status(400).json({ error: "Ask a question first." });

  const user = `Habitat scenario: ${JSON.stringify(scenario)}

Investigation records (JSON):
${JSON.stringify(INV)}

Question: ${question}`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 2000, system: SYSTEM, messages: [{ role: "user", content: user }] })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: j?.error?.message || "AI request failed." });
    const text = (j.content || []).filter(c => c.type === "text").map(c => c.text).join("\n");
    const cited = [...new Set([...text.matchAll(/\[([^\]]+)\]/g)].flatMap(m => m[1].split(/,\s*/)))]
      .filter(id => INV.some(i => i.id === id));
    res.status(200).json({ answer: text, cited, model: MODEL });
  } catch (e) {
    res.status(500).json({ error: "Could not reach the AI engine." });
  }
};
