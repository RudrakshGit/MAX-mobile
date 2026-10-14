import { insight } from "@/server/groq";
import { INSIGHT_THEMES, type ThemeInsight } from "@/server/insightThemes";
import type { InsightSignals } from "@/lib/insights";

const hits = new Map<string, number[]>();
function limited(ip: string, perMinute = 30) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > perMinute;
}

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
  return eligible[0] ?? INSIGHT_THEMES[0];
}

export async function POST(req: Request) {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "local";
  if (limited(ip)) {
    const fallback = INSIGHT_THEMES[0];
    return Response.json(
      { insight: { title: fallback.title, sections: fallback.sections } },
      { status: 200 }
    );
  }

  const signals = (await req.json().catch(() => null)) as InsightSignals | null;

  const avoid = new Set(signals?.avoidTitles ?? []);
  let eligible = INSIGHT_THEMES.filter((th) => !avoid.has(th.title));
  if (eligible.length === 0) {
    eligible = INSIGHT_THEMES;
  }

  const theme = pickTheme(signals, eligible);

  const key = process.env.GROQ_API_KEY;
  if (!key || !signals) {
    return Response.json(
      { insight: { title: theme.title, sections: theme.sections } },
      { status: 200 }
    );
  }

  const generated = await insight(signals, theme, key);
  if (!generated) {
    return Response.json(
      { insight: { title: theme.title, sections: theme.sections } },
      { status: 200 }
    );
  }

  return Response.json({ insight: generated }, { status: 200 });
}
