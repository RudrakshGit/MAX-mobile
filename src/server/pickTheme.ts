import type { InsightSignals } from "../lib/insights";
import { INSIGHT_THEMES, type ThemeInsight } from "./insightThemes.ts";

// Choose the theme that fits this student's own numbers, so the article is about their week, not a random one.
// Scales are 1–5 (sleep: 1 badly … 5 deeply; pressure: 5 = heaviest).
export function pickTheme(signals: InsightSignals | null, eligible: ThemeInsight[]): ThemeInsight {
  const byTitle = (title: string) => eligible.find((t) => t.title === title);
  const feel = new Set((signals?.feelings ?? []).map(([id]) => id));
  const infl = new Set((signals?.influences ?? []).map(([id]) => id));
  const ordered: [boolean, string][] = [
    [(signals?.sleep ?? 5) <= 2.5, "Sleep and Energy"],
    [(signals?.pressure ?? 0) >= 4 || infl.has("studies") || infl.has("deadlines"), "Exam Stress Patterns"],
    [feel.has("lonely") || infl.has("friends"), "Social Connection"],
    [feel.has("guilty") || feel.has("disappointed") || (signals?.mood ?? 5) <= 2, "Kindness to Self"],
    [(signals?.phoneMin ?? 0) >= 150 || infl.has("phone"), "Focus"],
    [infl.has("career"), "Uncertainty About the Future"],
    [infl.has("money"), "Money Worries"],
    [infl.has("family"), "Family"],
  ];
  for (const [match, title] of ordered) {
    const t = match ? byTitle(title) : undefined;
    if (t) return t;
  }
  // Nothing stands out (a good week): something encouraging, not a problem the student doesn't have.
  return byTitle("Small Wins") ?? eligible[0] ?? INSIGHT_THEMES[0];
}

