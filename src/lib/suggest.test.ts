import { test } from "node:test";
import assert from "node:assert/strict";
import { suggestFor } from "./suggest.ts";
import { consistency, nextStep, wellbeingContext } from "./insights.ts";

const ids = (s: string) => suggestFor(s).map((x) => x.href);

test("topic → tools, chosen by code not by the model", () => {
  assert.ok(ids("neend nahi aa rahi raat bhar").includes("/lesson/phone-sleep"));
  assert.ok(ids("I keep overthinking what she said").includes("/tool/reframe"));
  assert.ok(ids("heart racing, panic ho raha hai").includes("/tool/ground"));
  assert.ok(ids("I scroll reels till 3am every night and hate it").includes("/tool/spiral"));
  assert.deepEqual(ids("hi"), []);
  assert.ok(suggestFor("can't sleep, overthinking, panic, scrolling").length <= 2);
});

test("next step follows today's check-in", () => {
  const base = { date: "2026-09-29", mood: 3, sleep: 3, screen: 15, stress: 3 };
  assert.equal(nextStep({ ...base, mood: 1 })?.href, "/talk");
  assert.equal(nextStep({ ...base, screen: 60, sleep: 2 })?.href, "/lesson/phone-sleep");
  assert.equal(nextStep({ ...base, stress: 5 })?.href, "/tool/spiral");
  assert.equal(nextStep({ ...base, mood: 4, sleep: 4, stress: 2 }), null);
});

test("consistency counts distinct days in the last 7", () => {
  const now = new Date(2026, 8, 29);
  const c = ["2026-09-29", "2026-09-27", "2026-09-20"].map((date) => ({ date, mood: 3, sleep: 3, screen: 0, stress: 3 }));
  assert.equal(consistency(c, now), 2);
});

test("companion context is numbers and the student's own plans, never journal text", () => {
  const now = new Date(2026, 8, 29);
  const ctx = wellbeingContext({
    checkins: [{ date: "2026-09-28", mood: 2, sleep: 2, screen: 60, stress: 5 }, { date: "2026-09-29", mood: 1, sleep: 1, screen: 60, stress: 4 }],
    results: [{ id: "a", checkup: "gad7", at: now.getTime(), score: 11, band: "Moderate" }],
    plans: [{ id: "p", at: 0, trigger: "a bad mark", usual: "scroll", instead: "call my sister" }],
    entries: [{ id: "e", at: 0, text: "SECRET DIARY" }],
  } as any, now);
  assert.match(ctx, /mood 1\.5\/5/);
  assert.match(ctx, /GAD-7: Moderate/);
  assert.match(ctx, /If a bad mark, then I will call my sister/);
  assert.doesNotMatch(ctx, /SECRET/);
});
