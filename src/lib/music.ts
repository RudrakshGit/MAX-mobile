import type { State } from "./store";

export type Need = "calm" | "anxiety" | "focus" | "sleep" | "noise" | "uplift";

export function musicNeeds(s: State, now: Date = new Date()): Need[] {
  const needs: Need[] = [];
  const hour = now.getHours();

  // 1. Time / Sleep check
  const isNight = hour >= 21 || hour < 4;
  const lastCheckin = s.checkins && s.checkins.length > 0 ? s.checkins[s.checkins.length - 1] : undefined;
  const poorSleep = lastCheckin ? lastCheckin.sleep <= 2 : false;

  if (isNight || poorSleep) {
    needs.push("sleep");
  }

  // 2. High stress / academic pressure
  if (lastCheckin && lastCheckin.stress >= 4) {
    if (!needs.includes("calm")) needs.push("calm");
    if (!needs.includes("focus")) needs.push("focus");
  }

  // 3. Low mood
  if (lastCheckin && lastCheckin.mood <= 2) {
    if (!needs.includes("uplift")) needs.push("uplift");
    if (!needs.includes("calm")) needs.push("calm");
  }

  // 4. Latest PSWQ checkup
  const pswqResult = s.results?.filter((r) => r.checkup === "pswq").pop();
  if (pswqResult) {
    const isHigh =
      pswqResult.score >= 60 ||
      (pswqResult.band && /high/i.test(pswqResult.band));
    if (isHigh && !needs.includes("anxiety")) {
      needs.push("anxiety");
    }
  }

  // 5. Latest ASRS checkup
  const asrsResult = s.results?.filter((r) => r.checkup === "asrs").pop();
  if (asrsResult) {
    const isPositive = asrsResult.flag || asrsResult.score >= 4 || (asrsResult.band && /positive/i.test(asrsResult.band));
    if (isPositive && !needs.includes("focus")) {
      needs.push("focus");
    }
  }

  // 6. Fillers: calm, focus, sleep until exactly 3 unique items
  const fillers: Need[] = ["calm", "focus", "sleep", "uplift", "noise"];
  for (const f of fillers) {
    if (needs.length >= 3) break;
    if (!needs.includes(f)) {
      needs.push(f);
    }
  }

  return needs.slice(0, 3);
}
