import { test } from "node:test";
import assert from "node:assert/strict";
import { lastDays, patterns, moodDistribution, insightSignals } from "./insights.ts";

const now = new Date(2026, 8, 29);
const days = lastDays(10, now);
const mk = (i: number, mood: number, sleep: number, screen: number, stress: number) => ({ date: days[i], mood, sleep, screen, stress });

test("too few check-ins gives no patterns", () => {
  assert.deepEqual(patterns([mk(9, 3, 3, 0, 3)], now), []);
});

test("finds screen→sleep, sleep→mood, stress→mood and a low streak", () => {
  const data = [
    mk(0, 4, 5, 0, 2), mk(1, 4, 4, 15, 1), mk(2, 5, 5, 0, 2),
    mk(3, 3, 2, 60, 4), mk(4, 2, 1, 60, 5),
    mk(7, 2, 2, 60, 4), mk(8, 1, 2, 30, 5), mk(9, 2, 3, 60, 4),
  ];
  const p = patterns(data, now).join("\n");
  assert.match(p, /phone before bed/);
  assert.match(p, /good night's sleep/);
  assert.match(p, /study-pressure/);
  assert.match(p, /low three days running/);
});

test("lastDays crosses month boundaries", () => {
  assert.deepEqual(lastDays(2, new Date(2026, 9, 1)), ["2026-09-30", "2026-10-01"]);
});

test("moodDistribution on empty check-ins returns all 0s", () => {
  const dist = moodDistribution([], 7, now);
  assert.equal(dist.length, 5);
  assert.deepEqual(dist.map((r) => r.count), [0, 0, 0, 0, 0]);
  assert.deepEqual(dist.map((r) => r.pct), [0, 0, 0, 0, 0]);
});

test("moodDistribution percentages always sum to 100", () => {
  const checkins = [
    { date: days[0], mood: 1, sleep: 3, screen: 0, stress: 3 },
    { date: days[1], mood: 2, sleep: 3, screen: 0, stress: 3 },
    { date: days[2], mood: 4, sleep: 3, screen: 0, stress: 3 },
    { date: days[3], mood: 5, sleep: 3, screen: 0, stress: 3 },
  ];
  const dist = moodDistribution(checkins, 7, now);
  const sum = dist.reduce((acc, r) => acc + r.pct, 0);
  assert.equal(sum, 100);
});

test("insightSignals on empty state returns checkins7: 0 and empty arrays, never journal text", () => {
  const baseState: any = {
    checkins: [],
    entries: [
      { id: "e1", at: Date.now(), text: "sensitive secret journal diary text", feelings: [], influences: [] },
    ],
    chats: [],
    results: [],
    insights: [],
  };
  const sig = insightSignals(baseState, "2026-09-29");
  assert.equal(sig.checkins7, 0);
  assert.deepEqual(sig.feelings, []);
  assert.deepEqual(sig.influences, []);
  assert.deepEqual(sig.bands, []);
  assert.deepEqual(sig.avoidTitles, []);
  assert.equal("text" in (sig as any), false);
  assert.equal(JSON.stringify(sig).includes("sensitive secret journal diary text"), false);
});
