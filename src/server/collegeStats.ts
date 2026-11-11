import { INFLUENCES } from "../content/feelings.ts";
import { noisyMean, noisyShare } from "./pulseNoise.ts";

// Turns the raw totals of one college's shared check-ins into what its staff may see. Rules (docs/plan/M15):
// nothing from fewer than K students; subgroups under K hidden, plus one more when a single one is hidden so it
// can't be worked out from the rest; journal categories only when at least K_SOURCE students picked them; every
// published number carries noise sized to one student's influence; student counts rounded down to 5.

export const K = 10;
export const K_SOURCE = 5;

export type Agg = {
  n: number;
  mood: number | null;
  sleep: number | null;
  stress: number | null;
  heavy: number | null;
  poorSleep: number | null;
  low: number | null;
};
export type RawDashboard = {
  now: Agg | null;
  prev: Agg | null;
  weeks: { week: string; n: number; mood: number; sleep: number; stress: number }[] | null;
  sources: { tag: string; n: number }[] | null;
  years: { year: number; n: number; mood: number; sleep: number; stress: number }[] | null;
};
type Three = { mood: number; sleep: number; stress: number };
export type Dashboard = {
  enough: boolean;
  /** students who shared in the window, rounded down to 5; null below K */
  students: number | null;
  now?: Three;
  prev?: Three | null;
  shares?: { heavy: number; poorSleep: number; low: number };
  weeks: ({ week: string } & Three)[];
  sources: { id: string; label: string; pct: number }[];
  years: ({ year: number } & Three)[];
};

const LABEL = new Map<string, string>(INFLUENCES.map((i) => [i.id, i.label]));
const three = (a: { mood: number | null; sleep: number | null; stress: number | null }, n: number, seed: (w: string) => string): Three => ({
  mood: noisyMean(Number(a.mood), n, seed("mood")),
  sleep: noisyMean(Number(a.sleep), n, seed("sleep")),
  stress: noisyMean(Number(a.stress), n, seed("stress")),
});

export function buildDashboard(raw: RawDashboard, seedBase: string): Dashboard {
  const n = Number(raw.now?.n ?? 0);
  if (!raw.now || n < K) return { enough: false, students: null, weeks: [], sources: [], years: [] };
  const seed = (scope: string) => (what: string) => `${seedBase}:${scope}:${what}`;
  const now = raw.now;
  const pn = Number(raw.prev?.n ?? 0);

  const years = (raw.years ?? []).filter((y) => y.year >= 1 && y.year <= 6);
  let shown = years.filter((y) => Number(y.n) >= K);
  // one hidden group could be worked out from the total and the others, so hide the smallest shown one too
  if (years.length - shown.length === 1 && shown.length > 0) {
    const smallest = shown.reduce((a, b) => (Number(b.n) < Number(a.n) ? b : a));
    shown = shown.filter((y) => y !== smallest);
  }

  return {
    enough: true,
    students: Math.floor(n / 5) * 5,
    now: three(now, n, seed("now")),
    prev: raw.prev && pn >= K ? three(raw.prev, pn, seed("prev")) : null,
    shares: {
      heavy: noisyShare(Number(now.heavy), n, seed("share")("heavy")),
      poorSleep: noisyShare(Number(now.poorSleep), n, seed("share")("sleep")),
      low: noisyShare(Number(now.low), n, seed("share")("low")),
    },
    weeks: (raw.weeks ?? [])
      .filter((w) => Number(w.n) >= K)
      .sort((a, b) => a.week.localeCompare(b.week))
      .map((w) => ({ week: w.week, ...three(w, Number(w.n), seed(`week:${w.week}`)) })),
    sources: (raw.sources ?? [])
      .filter((s) => LABEL.has(s.tag) && Number(s.n) >= K_SOURCE)
      .map((s) => ({ id: s.tag, label: LABEL.get(s.tag)!, pct: noisyShare(Number(s.n) / n, n, seed("source")(s.tag)) }))
      .sort((a, b) => b.pct - a.pct),
    years: shown.sort((a, b) => a.year - b.year).map((y) => ({ year: y.year, ...three(y, Number(y.n), seed(`year:${y.year}`)) })),
  };
}
