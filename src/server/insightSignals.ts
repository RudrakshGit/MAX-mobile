import type { InsightSignals } from "../lib/insights";

// The body comes from the phone and goes into a model prompt: keep only the expected shapes and lengths,
// so a modified client can't smuggle instructions into the prompt or crash the handler.
const num = (v: unknown, lo: number, hi: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? Math.round(v * 10) / 10 : undefined;
const word = (v: unknown) => (typeof v === "string" && /^[a-z][a-z-]{0,30}$/.test(v) ? v : null);
const pairs = (v: unknown): [string, number][] =>
  Array.isArray(v)
    ? v
        .filter((p): p is [string, number] => Array.isArray(p) && word(p[0]) !== null && num(p[1], 0, 1000) !== undefined)
        .slice(0, 10)
        .map(([k, n]) => [k, n])
    : [];

export function cleanSignals(raw: unknown): InsightSignals | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    checkins7: num(r.checkins7, 0, 7) ?? 0,
    mood: num(r.mood, 1, 5),
    sleep: num(r.sleep, 1, 5),
    pressure: num(r.pressure, 1, 5),
    phoneMin: num(r.phoneMin, 0, 1440),
    feelings: pairs(r.feelings),
    influences: pairs(r.influences),
    bands: Array.isArray(r.bands)
      ? r.bands
          .filter((b): b is { test: string; band: string } => !!b && typeof b.test === "string" && typeof b.band === "string")
          .slice(0, 8)
          .map((b) => ({ test: b.test.slice(0, 20).replace(/[^\w -]/g, ""), band: b.band.slice(0, 40).replace(/[^\w ,()–-]/g, "") }))
      : [],
    avoidTitles: Array.isArray(r.avoidTitles) ? r.avoidTitles.filter((x): x is string => typeof x === "string").slice(0, 30).map((x) => x.slice(0, 60)) : [],
  };
}

