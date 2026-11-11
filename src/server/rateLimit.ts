// ponytail: per-instance memory, so limits reset on cold start; move to a KV if abuse shows up.
const buckets = new Map<string, number[]>();

export function limited(req: Request, name: string, perMinute: number): boolean {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "local";
  const key = `${name}:${ip}`;
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > 5000) buckets.clear();
  return recent.length > perMinute;
}
