import type { InstrumentCategory } from "@/content/instruments/types";
import type { Result } from "./store";

export type TestSummary = {
  id: string;
  title: string;
  short: string;
  category: InstrumentCategory;
  minutes?: number;
  intro?: string;
  items?: unknown[];
};

const CATEGORY_ORDER: readonly InstrumentCategory[] = [
  "wellness",
  "growth",
  "personality",
  "relationships",
  "phone",
];

/**
 * Picks the featured test for the student:
 * - First untaken test in category order: wellness → growth → personality (→ phone)
 * - If all taken: the one taken longest ago (minimum last `at` timestamp)
 */
export function featured<T extends TestSummary>(
  state: { results: Result[] },
  instruments: T[],
  _now = Date.now()
): T | undefined {
  if (!instruments || instruments.length === 0) return undefined;

  // Map each instrument ID to its most recent completed timestamp
  const lastTaken = new Map<string, number>();
  for (const r of state.results) {
    const prev = lastTaken.get(r.checkup);
    if (prev === undefined || r.at > prev) {
      lastTaken.set(r.checkup, r.at);
    }
  }

  // 1. Look for the first untaken test in category priority order
  for (const cat of CATEGORY_ORDER) {
    const candidate = instruments.find(
      (inst) => inst.category === cat && !lastTaken.has(inst.id)
    );
    if (candidate) return candidate;
  }

  // Check any untaken instrument in other categories
  const otherUntaken = instruments.find((inst) => !lastTaken.has(inst.id));
  if (otherUntaken) return otherUntaken;

  // 2. All taken: find the one taken longest ago (smallest latest timestamp)
  let oldestInst = instruments[0];
  let oldestTime = lastTaken.get(instruments[0].id) ?? Infinity;

  for (let i = 1; i < instruments.length; i++) {
    const inst = instruments[i];
    const t = lastTaken.get(inst.id) ?? Infinity;
    if (t < oldestTime) {
      oldestTime = t;
      oldestInst = inst;
    }
  }

  return oldestInst;
}

/** Case-insensitive filter matching either title or short label. */
export function filterInstruments<T extends { title: string; short: string }>(
  instruments: T[],
  query: string
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return instruments;
  return instruments.filter(
    (inst) =>
      inst.title.toLowerCase().includes(q) ||
      inst.short.toLowerCase().includes(q)
  );
}
