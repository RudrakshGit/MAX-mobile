import { classifyRisk } from "@/safety/classifier";
import { GUARD_FALLBACK, inspectOutput } from "@/safety/guard";
import { reflectPrompt, systemPrompt } from "@/lib/prompt";
import { modelRisk } from "@/safety/model-check";
import { finalLevel, needsSafeguard } from "@/safety/risk";
import { reply, read } from "@/server/groq";
import { oneQuestion, plain, replyLanguage } from "@/lib/reply";

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

  const isReflect = body?.mode === "reflect";
  // A helpline card was shown a few messages ago (the phone says so). The latest message itself was checked above;
  // the earlier one already got its card, so it isn't scored again, and MAX keeps talking in care mode.
  const afterCrisis = !isReflect && body?.afterCrisis === true;
  const system = isReflect
    ? reflectPrompt(name, replyLanguage(last.text))
    : systemPrompt(name, risk.level === "distress", context, replyLanguage(last.text), afterCrisis);

  const convo = messages.map((m) => ({ role: m.role, content: redact(m.text) }));
  const recent = messages.filter((m) => m.role === "user").slice(-3).map((m) => redact(m.text));
  // Before: every follow-up was scored together with the message that triggered the card, so each one showed the
  // card again and MAX never answered ("ye manas kaun hai", "baat karo na"). A new crisis message still gets one.
  const scored = afterCrisis ? recent.slice(-1) : recent;
  const [text, r] = await Promise.all([reply(convo, system, key), read(scored, key)]);
  const sg = needsSafeguard(risk.level, r, last.text.trim().split(/\s+/).length) ? await modelRisk(scored, key) : null;
  const level = finalLevel(risk.level, r, sg);
  if (r === null) console.warn(JSON.stringify({ event: "safety.read.unavailable", safeguard: sg === null ? "none" : "ran" }));
  if (level === "crisis") return Response.json({ kind: "crisis" });
  if (!text) return Response.json({ error: "The AI provider did not answer" }, { status: 502 });

  const cleaned = oneQuestion(plain(text));
  if (!cleaned) return Response.json({ error: "The AI returned an empty reply" }, { status: 502 });

  // The full reply is inspected before it is sent, never after.
  const verdict = inspectOutput(cleaned);
  if (!verdict.safe) console.warn(JSON.stringify({ event: "safety.output_guard.blocked", code: verdict.code }));
  return Response.json({ kind: "reply", text: verdict.safe ? cleaned : GUARD_FALLBACK, distress: level === "distress", care: afterCrisis, emotions: r?.emotions });
}
