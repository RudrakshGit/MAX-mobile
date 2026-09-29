import { classifyRisk } from "@/safety/classifier";
import { GUARD_FALLBACK, inspectOutput } from "@/safety/guard";
import { systemPrompt } from "@/lib/prompt";
import { modelRisk } from "@/safety/model-check";
import { oneQuestion, plain, replyLanguage } from "@/lib/reply";

const MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

type In = { role: "user" | "assistant"; text: string };
const valid = (m: any): m is In => (m?.role === "user" || m?.role === "assistant") && typeof m.text === "string" && m.text.length > 0;

// Obvious identifiers never reach the model provider.
const redact = (s: string) =>
  s
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
    .replace(/(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g, "[phone]")
    .slice(0, 2000);


// ponytail: per-instance memory, so limits reset on cold start; move to a KV if abuse shows up.
const hits = new Map<string, number[]>();
function limited(ip: string, perMinute = 20) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > perMinute;
}

export async function POST(req: Request) {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "local";
  if (limited(ip)) return Response.json({ error: "Too many messages. Take a breath and try again in a minute." }, { status: 429 });
  const body = await req.json().catch(() => null);
  const messages: In[] = Array.isArray(body?.messages) ? body.messages.filter(valid).slice(-20) : [];
  const last = messages.at(-1);
  if (!last || last.role !== "user") return Response.json({ error: "Expected a user message last" }, { status: 400 });

  // The phone already checked; check again here so no client can skip it.
  const risk = classifyRisk(last.text);
  if (risk.level === "crisis") return Response.json({ kind: "crisis" });

  const key = process.env.GROQ_API_KEY;
  if (!key) return Response.json({ error: "GROQ_API_KEY is not set" }, { status: 503 });

  const name = String(body?.companion ?? "Max").replace(/[^\p{L}\p{N} ]/gu, "").slice(0, 20) || "Max";
  const context = typeof body?.context === "string" ? redact(body.context).slice(0, 1200) : "";

  // Layer 2 runs alongside the reply, so it adds no waiting. If it says crisis,
  // the reply is thrown away unseen.
  const recent = messages.filter((m) => m.role === "user").slice(-3).map((m) => redact(m.text));
  const [modelLevel, res] = await Promise.all([modelRisk(recent, key), fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      max_completion_tokens: 1024,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: systemPrompt(name, risk.level === "distress", context, replyLanguage(last.text)) },
        ...messages.map((m) => ({ role: m.role, content: redact(m.text) })),
      ],
    }),
  })]);
  // Layer 2 exists to catch missed crises; it over-labels ordinary stress as
  // distress, so it may only escalate to crisis.
  const level = modelLevel === "crisis" ? "crisis" : risk.level;
  if (modelLevel === null) console.warn(JSON.stringify({ event: "safety.model_check.unavailable" }));
  if (level === "crisis") return Response.json({ kind: "crisis" });
  if (!res.ok) {
    console.warn(JSON.stringify({ event: "chat.provider_error", status: res.status }));
    return Response.json({ error: "The AI provider did not answer" }, { status: 502 });
  }
  const data = await res.json();
  const text = oneQuestion(plain(data?.choices?.[0]?.message?.content ?? ""));
  if (!text) return Response.json({ error: "The AI returned an empty reply" }, { status: 502 });

  // The full reply is inspected before it is sent, never after.
  const verdict = inspectOutput(text);
  if (!verdict.safe) console.warn(JSON.stringify({ event: "safety.output_guard.blocked", code: verdict.code }));
  return Response.json({ kind: "reply", text: verdict.safe ? text : GUARD_FALLBACK, distress: level === "distress" });
}
