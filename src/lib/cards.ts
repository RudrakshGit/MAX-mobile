import type { Card } from "../content/cards.ts";
import type { State } from "./store.ts";

export function todaysCard(
  cards: Card[],
  history: State["cardHistory"] = [],
  date: string,
  offset = 0
): Card {
  if (!cards || cards.length === 0) {
    throw new Error("No cards provided to todaysCard");
  }

  // Cards marked 'less' by the user
  const lessIds = new Set(history.filter((h) => h.less).map((h) => h.id));

  // If there's an existing non-less card recorded for this exact date and offset is 0, return it
  if (offset === 0) {
    const todayEntry = history.find((h) => h.date === date);
    if (todayEntry && !todayEntry.less) {
      const existing = cards.find((c) => c.id === todayEntry.id);
      if (existing) return existing;
    }
  }

  // Calculate 60 days window before this date
  const d = new Date(date + "T12:00:00");
  const validD = Number.isNaN(d.getTime()) ? new Date() : d;
  const sixtyDaysAgoMs = new Date(
    validD.getFullYear(),
    validD.getMonth(),
    validD.getDate() - 60
  ).getTime();
  const dateMs = validD.getTime();

  // IDs shown in the last 60 days (excluding today itself)
  const recentIds = new Set(
    history
      .filter((h) => {
        if (h.date === date) return false;
        const hd = new Date(h.date + "T12:00:00").getTime();
        return hd >= sixtyDaysAgoMs && hd <= dateMs;
      })
      .map((h) => h.id)
  );

  // Filter eligible: not marked less, not seen in last 60 days
  let eligible = cards.filter((c) => !lessIds.has(c.id) && !recentIds.has(c.id));

  // If all cards were seen in the last 60 days, fall back to any non-less card
  if (eligible.length === 0) {
    eligible = cards.filter((c) => !lessIds.has(c.id));
  }

  // If every card is marked less, fallback to all cards
  if (eligible.length === 0) {
    eligible = cards;
  }

  // Deterministic pick based on date string hash + offset
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) >>> 0;
  }
  const index = (hash + offset) % eligible.length;
  return eligible[index];
}
