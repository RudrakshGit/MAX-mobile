import { test } from "node:test";
import assert from "node:assert/strict";
import { lastDays, patterns } from "./insights.ts";

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
