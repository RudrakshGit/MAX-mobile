import { transcribe } from "@/server/groq";

const MAX_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

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
  if (limited(ip)) {
    return Response.json({ transcript: "" }, { status: 429 });
  }

  const contentLength = Number(req.headers.get("content-length"));
  if (contentLength && contentLength > MAX_BYTES) {
    return new Response("Payload Too Large", { status: 413 });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return Response.json({ transcript: "" }, { status: 500 });
  }

  const arrayBuffer = await req.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_BYTES) {
    return new Response("Payload Too Large", { status: 413 });
  }
  if (arrayBuffer.byteLength === 0) {
    return Response.json({ transcript: "" }, { status: 400 });
  }

  const langHeader = req.headers.get("x-lang");
  const lang: "hi" | "en" = langHeader === "en" ? "en" : "hi";

  const result = await transcribe(new Uint8Array(arrayBuffer), lang, key);
  if (!result) {
    return Response.json({ transcript: "" }, { status: 502 });
  }

  return Response.json({ transcript: result }, { status: 200 });
}
