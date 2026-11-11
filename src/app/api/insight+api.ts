import { insight } from "@/server/groq";
import { pickTheme } from "@/server/pickTheme";
import { INSIGHT_THEMES, type ThemeInsight } from "@/server/insightThemes";
import type { InsightSignals } from "@/lib/insights";
import { cleanSignals } from "@/server/insightSignals";

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
    const fallback = INSIGHT_THEMES[0];
    return Response.json(
      { insight: { title: fallback.title, sections: fallback.sections } },
      { status: 200 }
    );
  }

  const signals = cleanSignals(await req.json().catch(() => null));

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
