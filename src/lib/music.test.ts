import test from "node:test";
import assert from "node:assert/strict";
import { musicNeeds, type Need } from "./music.ts";
import type { State } from "./store";

const baseState: State = {
  onboarded: false,
  companion: "Max",
  anonId: "123",
  shareContext: true,
  lock: false,
  checkins: [],
  entries: [],
  chats: [],
  courseProgress: {},
  insights: [],
  cardHistory: [],
  activity: [],
  values: [],
  consents: { ai: false, voice: false, sync: false },
  musicRecent: [],
  simpleFont: false,
  results: [],
  reframes: [],
  plans: [],
};

test("empty state at noon returns [calm, focus, sleep]", () => {
  const noon = new Date("2026-10-13T12:00:00");
  const needs = musicNeeds(baseState, noon);
  assert.deepEqual(needs, ["calm", "focus", "sleep"]);
  assert.equal(needs.length, 3);
});

test("night time (21:00-04:00) prioritises sleep first", () => {
  const night1 = new Date("2026-10-13T22:30:00");
  const needs1 = musicNeeds(baseState, night1);
  assert.equal(needs1[0], "sleep");
  assert.equal(needs1.length, 3);
  assert.equal(new Set(needs1).size, 3);

  const night2 = new Date("2026-10-13T02:15:00");
  const needs2 = musicNeeds(baseState, night2);
  assert.equal(needs2[0], "sleep");
});

test("last check-in poor sleep (<= 2) prioritises sleep first", () => {
  const noon = new Date("2026-10-13T12:00:00");
  const s: State = {
    ...baseState,
    checkins: [
      { date: "2026-10-13", mood: 3, sleep: 2, stress: 2, screen: 3 },
    ],
  };
  const needs = musicNeeds(s, noon);
  assert.equal(needs[0], "sleep");
  assert.equal(needs.length, 3);
});

test("daytime high academic pressure (stress >= 4) includes calm and focus", () => {
  const afternoon = new Date("2026-10-13T15:00:00");
  const s: State = {
    ...baseState,
    checkins: [
      { date: "2026-10-13", mood: 3, sleep: 4, stress: 5, screen: 4 },
    ],
  };
  const needs = musicNeeds(s, afternoon);
  assert.ok(needs.includes("calm"));
  assert.ok(needs.includes("focus"));
  assert.equal(needs.length, 3);
  assert.equal(new Set(needs).size, 3);
});

test("low mood (<= 2) prioritises uplift and calm", () => {
  const noon = new Date("2026-10-13T12:00:00");
  const s: State = {
    ...baseState,
    checkins: [
      { date: "2026-10-13", mood: 2, sleep: 4, stress: 2, screen: 3 },
    ],
  };
  const needs = musicNeeds(s, noon);
  assert.equal(needs[0], "uplift");
  assert.ok(needs.includes("calm"));
  assert.equal(needs.length, 3);
});

test("high PSWQ anxiety band prioritises anxiety", () => {
  const noon = new Date("2026-10-13T12:00:00");
  const s: State = {
    ...baseState,
    results: [
      { checkup: "pswq", score: 65, at: Date.now() },
    ],
  };
  const needs = musicNeeds(s, noon);
  assert.ok(needs.includes("anxiety"));
  assert.equal(needs.length, 3);
  assert.equal(new Set(needs).size, 3);
});

test("positive ASRS result adds focus", () => {
  const noon = new Date("2026-10-13T12:00:00");
  const s: State = {
    ...baseState,
    results: [
      { checkup: "asrs6", score: 5, band: "May be consistent with adult ADHD", at: Date.now() },
    ],
  };
  const needs = musicNeeds(s, noon);
  assert.ok(needs.includes("focus"));
  assert.equal(needs.length, 3);
  assert.equal(new Set(needs).size, 3);
});
