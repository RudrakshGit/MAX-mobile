import type { CheckIn, State } from "./store";

// Patterns, not proof. Every sentence here says "tends to" or "on average"
// because a fortnight of self-reports shows association, never cause.

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const r1 = (x: number) => Math.round(x * 10) / 10;

export function lastDays(n: number, end = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  return out;
}

export const MIN_CHECKINS = 5;
export const moodWords = ["heavy", "low", "okay", "good", "bright"];

export function patterns(all: CheckIn[], now = new Date()): string[] {
  const window = new Set(lastDays(28, now));
  const c = all.filter((x) => window.has(x.date)).sort((a, b) => a.date.localeCompare(b.date));
  if (c.length < MIN_CHECKINS) return [];
  const out: string[] = [];

  // Phone in the hour before bed vs how that night's sleep felt.
  const heavy = c.filter((x) => x.screen >= 60).map((x) => x.sleep);
  const light = c.filter((x) => x.screen <= 15).map((x) => x.sleep);
  if (heavy.length >= 2 && light.length >= 2 && avg(light) - avg(heavy) >= 0.5) {
    out.push(`On nights with an hour or more of phone before bed, you rated your sleep ${r1(avg(light) - avg(heavy))} points lower on average.`);
  }

  // Sleep vs next-day mood (same check-in: last night's sleep, today's mood).
  const good = c.filter((x) => x.sleep >= 4).map((x) => x.mood);
  const poor = c.filter((x) => x.sleep <= 2).map((x) => x.mood);
  if (good.length >= 2 && poor.length >= 2 && avg(good) - avg(poor) >= 0.5) {
    out.push(`After a good night's sleep your mood tends to be ${r1(avg(good) - avg(poor))} points higher.`);
  }

  // Study pressure vs mood.
  const hi = c.filter((x) => x.stress >= 4).map((x) => x.mood);
  const lo = c.filter((x) => x.stress <= 2).map((x) => x.mood);
  if (hi.length >= 2 && lo.length >= 2 && avg(lo) - avg(hi) >= 0.5) {
    out.push(`On heavy study-pressure days your mood tends to dip by about ${r1(avg(lo) - avg(hi))} points.`);
  }

  // Three low days in a row, ending today or yesterday.
  const recent = new Map(c.map((x) => [x.date, x.mood]));
  const last3 = lastDays(3, now);
  if (last3.every((d) => (recent.get(d) ?? 5) <= 2)) {
    out.push("Your mood has been low three days running. That's worth a gentle look: write it down, talk it through, or reach out to someone you trust.");
  }

  // This week vs last week.
  const week = new Set(lastDays(7, now));
  const thisWeek = c.filter((x) => week.has(x.date)).map((x) => x.mood);
  const before = c.filter((x) => !week.has(x.date) && x.date >= lastDays(14, now)[0]).map((x) => x.mood);
  if (thisWeek.length >= 3 && before.length >= 3) {
    const diff = avg(thisWeek) - avg(before);
    if (diff >= 0.5) out.push(`Your mood this week is up ${r1(diff)} points on last week.`);
    if (diff <= -0.5) out.push(`Your mood this week is down ${r1(-diff)} points on last week.`);
  }
  return out;
}

/** One gentle suggestion from today's answers, or null when things look okay. */
export function nextStep(c: CheckIn): { text: string; label: string; href: string } | null {
  if (c.mood <= 1) return { text: "Today feels heavy. You don't have to carry it alone.", label: "Talk it through", href: "/talk" };
  if (c.screen >= 60 && c.sleep <= 2) return { text: "Rough sleep after a lot of phone time. Worth a two-minute read tonight.", label: "Your phone and your sleep", href: "/learn/phone-sleep" };
  if (c.stress >= 5) return { text: "Study pressure is intense today. Plan what you'll do when it spikes.", label: "Build a spiral breaker", href: "/tool/spiral" };
  if (c.mood <= 2) return { text: "A low day. Getting it onto the page often makes it smaller.", label: "Write it down", href: "/journal-new" };
  if (c.stress >= 4) return { text: "Heavy pressure today. One slow minute can take the edge off.", label: "One-minute reset", href: "/tool/breathe" };
  return null;
}

/** Days checked in out of the last seven. Shown gently, never as a streak to lose. */
export function consistency(all: CheckIn[], now = new Date()) {
  const week = new Set(lastDays(7, now));
  return new Set(all.filter((c) => week.has(c.date)).map((c) => c.date)).size;
}

const names: Record<string, string> = { phq9: "PHQ-9", gad7: "GAD-7", cbi: "CBI burnout", tech: "Tech-stress" };

/**
 * What the companion is told about the student: averages and bands, plus their
 * own if-then plans so it can remind them of them. Never journal text.
 */
export function wellbeingContext(s: Pick<State, "checkins" | "results" | "plans">, now = new Date()): string {
  const week = new Set(lastDays(7, now));
  const c = s.checkins.filter((x) => week.has(x.date));
  const lines: string[] = [];
  if (c.length) {
    const a = (f: (x: CheckIn) => number) => r1(avg(c.map(f)));
    lines.push(`Last 7 days (${c.length} check-ins, 1 = worst, 5 = best except pressure): mood ${a((x) => x.mood)}/5, sleep ${a((x) => x.sleep)}/5, study pressure ${a((x) => x.stress)}/5, phone in the hour before sleep ~${Math.round(avg(c.map((x) => x.screenMin ?? x.screen)))} min.`);
  }
  const latest = ["phq9", "gad7", "cbi", "tech"].map((id) => s.results.filter((r) => r.checkup === id).at(-1)).filter((r) => !!r);
  if (latest.length) lines.push(`Latest check-ups: ${latest.map((r) => `${names[r.checkup]}: ${r.band}`).join("; ")}. These are screening ranges, not diagnoses.`);
  if (s.plans.length) lines.push(`Their own coping plans: ${s.plans.slice(-3).map((p) => `"If ${p.trigger}, then I will ${p.instead}"`).join("; ")}.`);
  return lines.join("\n");
}
