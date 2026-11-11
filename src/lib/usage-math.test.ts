import { test } from "node:test";
import assert from "node:assert/strict";
import { analyse, EV } from "./usage-math.ts";

const M = 60_000;
const H = 60 * M;
const DAY = 24 * H;
const from = Date.UTC(2026, 10, 2); // window start (a "midnight")
const to = from + DAY;
const at = (h: number, m = 0) => from + h * H + m * M;
const ev = (...rows: [number, number, number?][]) => rows.flatMap(([c, t, p]) => [c, t, p ?? -1]);

test("a missing 'closed' event no longer runs an app until midnight (the 63-hour bug)", () => {
  // Instagram (0) resumed at 10:00 and its pause event was lost; the screen went off at 10:20.
  const u = analyse(ev([EV.ON, at(10)], [EV.UNLOCK, at(10)], [EV.RESUME, at(10), 0], [EV.OFF, at(10, 20)]), from, to);
  assert.equal(u.appMin.get(0), 20);
  assert.equal(u.screenOnMin, 20);
});

test("only one app is in the foreground at a time: opening another app stops the first", () => {
  const u = analyse(
    ev([EV.UNLOCK, at(9)], [EV.RESUME, at(9), 0], [EV.RESUME, at(9, 15), 1], [EV.PAUSE, at(9, 40), 1], [EV.OFF, at(9, 45)]),
    from,
    to,
  );
  assert.equal(u.appMin.get(0), 15);
  assert.equal(u.appMin.get(1), 25);
});

test("app time can never add up to more than the screen-on time, or than the day", () => {
  const rows: [number, number, number?][] = [[EV.ON, at(0, 0)]];
  // 20 apps all "resumed" without pauses throughout the day, screen on 6 hours in total
  for (let i = 0; i < 20; i++) rows.push([EV.RESUME, at(8, i * 3), i]);
  rows.push([EV.OFF, at(9)], [EV.ON, at(13)], [EV.RESUME, at(13), 3], [EV.OFF, at(18)]);
  const u = analyse(ev(...rows.slice(1)), from, to);
  const totalApps = [...u.appMin.values()].reduce((a, b) => a + b, 0);
  assert.ok(totalApps <= u.screenOnMin + 0.5, `${totalApps} > ${u.screenOnMin}`);
  assert.ok(u.screenOnMin <= 24 * 60);
});

test("time before the window is not counted, but the app on screen at midnight is", () => {
  // YouTube (2) started at 23:30 the day before and ran until 00:30
  const u = analyse(ev([EV.UNLOCK, from - 30 * M], [EV.RESUME, from - 30 * M, 2], [EV.PAUSE, at(0, 30), 2], [EV.OFF, at(0, 31)]), from, to);
  assert.equal(u.appMin.get(2), 30);
  assert.equal(u.nightMin, 31);
});

test("pickups count unlocks in the window; longest stretch and the hourly chart follow the screen", () => {
  const u = analyse(
    ev([EV.ON, at(7)], [EV.UNLOCK, at(7)], [EV.OFF, at(7, 10)], [EV.ON, at(22)], [EV.UNLOCK, at(22)], [EV.OFF, at(23, 30)]),
    from,
    to,
  );
  assert.equal(u.pickups, 2);
  assert.equal(u.longestMin, 90);
  assert.equal(u.hourly.length, 24);
  assert.equal(u.hourly[7], 10);
  assert.equal(u.hourly[22], 60);
  assert.equal(u.hourly[23], 30);
  assert.equal(u.screenOnMin, 100);
});

test("today so far: an app still open now counts up to now, not to midnight", () => {
  const u = analyse(ev([EV.UNLOCK, at(14)], [EV.RESUME, at(14), 4]), from, to, at(14, 45));
  assert.equal(u.appMin.get(4), 45);
  assert.equal(u.screenOnMin, 45);
});

test("first screen event 'off' means the screen was already on", () => {
  const u = analyse(ev([EV.RESUME, at(1), 5], [EV.OFF, at(1, 5)]), from, to);
  assert.equal(u.appMin.get(5), 5);
});

test("phones without screen events: one forgotten session is capped at 3 hours", () => {
  const u = analyse(ev([EV.RESUME, at(9), 6]), from, to);
  assert.equal(u.appMin.get(6), 180);
});
