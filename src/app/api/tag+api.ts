import { tag } from "@/server/groq";

// Obvious identifiers never reach the model provider.
const redact = (s: string) =>
  s
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
    .replace(/(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g, "[phone]")
    .slice(0, 4000);

const hits = new Map<string, number[]>();
function limited(ip: string, perMinute = 30) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > perMinute;
}

export async function POST(req: Request) {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "local";
  if (limited(ip)) {
    return Response.json({ feelings: [], influences: [] }, { status: 200 });
  }

  const body = await req.json().catch(() => null);
  const rawText = typeof body?.text === "string" ? body.text.trim() : "";
  if (!rawText) {
    return Response.json({ feelings: [], influences: [] }, { status: 200 });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return Response.json({ feelings: [], influences: [] }, { status: 200 });
  }

  const redacted = redact(rawText);
  const roman = Boolean(body?.roman);

  const res = await tag(redacted, roman, key);
  if (!res) {
    return Response.json({ feelings: [], influences: [] }, { status: 200 });
  }

  return Response.json(res, { status: 200 });
}
