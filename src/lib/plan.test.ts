import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyPlan } from "./plan.ts";
import type { State } from "./store";

const base = { checkins: [], activity: [] } as unknown as State;

test("new user gets three open goals", () => {
  const p = dailyPlan(base, "2026-10-20");
  assert.deepEqual(
    p.map((i) => i.id),
    ["log", "do", "learn"]
  );
  assert.ok(p.every((i) => !i.done));
});

test("goals tick from today's data only", () => {
  const s = {
    checkins: [{ date: "2026-10-20", mood: 2, sleep: 2, screen: 60, stress: 4 }],
    activity: [
      { date: "2026-10-19", kind: "learn" },
      { date: "2026-10-20", kind: "do" },
    ],
  } as unknown as State;

  const p = dailyPlan(s, "2026-10-20");
  assert.equal(p[0].done, true);
  assert.equal(p[1].done, true);
  assert.equal(p[2].done, false); // yesterday's lesson doesn't count
});

test("do goal uses nextStep suggestion when available", () => {
  const s = {
    checkins: [{ date: "2026-10-20", mood: 1, sleep: 3, screen: 15, stress: 2 }],
    activity: [],
  } as unknown as State;

  const p = dailyPlan(s, "2026-10-20");
  assert.equal(p[1].title, "Talk it through");
  assert.equal(p[1].href, "/talk");
});

test("plan: a ticked lesson keeps its own name even if the recommended course changes (audit F21)", () => {
  const s = { ...base, activity: [{ date: "2026-10-14", kind: "learn" as const, ref: "sleep-reset:1" }] } as unknown as State;
  const item = dailyPlan(s, "2026-10-14").find((i) => i.id === "learn")!;
  assert.equal(item.done, true);
  assert.match(item.title, /Sleep reset: Day 1/);
});
