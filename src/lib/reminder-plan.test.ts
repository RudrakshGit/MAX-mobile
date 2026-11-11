import { test } from "node:test";
import assert from "node:assert/strict";
import { checkinMinutes, planReminders } from "./reminder-plan.ts";

const at = (h: number, m = 0, d = 3) => new Date(2026, 10, d, h, m);
const R = (o: any = {}) => ({ mode: "fixed", exams: true, ...o });
const S = (o: any = {}): any => ({ checkins: [], exams: [], remindAt: "21:00", reminders: R(), ...o });
const ci = (date: string, o: any = {}) => ({ date, mood: 3, sleep: 3, screen: 15, stress: 3, ...o });
const hm = (ms: number) => new Date(ms).toTimeString().slice(0, 5);
const day = (ms: number) => new Date(ms).getDate();

test("off means nothing is scheduled", () => {
  assert.deepEqual(planReminders(S({ reminders: R({ mode: "off" }) }), at(10)), []);
});

test("at most one a day, at the picked time, and none today once checked in", () => {
  const p = planReminders(S({ checkins: [ci("2026-11-03")] }), at(10));
  assert.ok(p.every((x) => hm(x.at) === "21:00"));
  assert.ok(!p.some((x) => day(x.at) === 3), "checked in today: no reminder today");
  assert.equal(new Set(p.map((x) => day(x.at))).size, p.length, "one per day");
});

test("a reminder whose time has passed today is not scheduled", () => {
  const p = planReminders(S({ checkins: [ci("2026-11-02")] }), at(21, 30));
  assert.equal(day(p[0].at), 4);
});

test("going quiet: daily for 3 days, then every other day, then stops after a week", () => {
  // last check-in yesterday: today is quiet day 0
  const p = planReminders(S({ checkins: [ci("2026-11-02")] }), at(9));
  assert.deepEqual(p.map((x) => day(x.at)), [3, 4, 5, 7, 9]);
  // last check-in 8 days ago: nothing until they come back
  assert.deepEqual(planReminders(S({ checkins: [ci("2026-10-26")] }), at(9)), []);
});

test("smart timing moves at most an hour toward the usual check-in time", () => {
  const usual = (h: number, m: number) => [1, 2, 3, 4].map((d) => ci(`2026-10-0${d}`, { at: new Date(2026, 9, d, h, m).getTime() }));
  const s = (h: number, m: number, base = "21:00") => checkinMinutes(S({ remindAt: base, reminders: R({ mode: "smart" }), checkins: usual(h, m) }));
  assert.equal(s(21, 30), 21 * 60 + 30);
  assert.equal(s(19, 0), 20 * 60, "clamped to an hour earlier");
  assert.equal(s(0, 30, "22:00"), 23 * 60, "after midnight counts as later, capped at 23:00");
  assert.equal(checkinMinutes(S({ remindAt: "21:00", reminders: R({ mode: "fixed" }), checkins: usual(19, 0) })), 21 * 60);
});

test("bedtime and check-in on the same evening become one note at the wind-down time", () => {
  const p = planReminders(S({ bedtime: "23:30" }), at(9));
  assert.equal(p[0].id.split("-")[0], "evening");
  assert.equal(hm(p[0].at), "22:30");
  assert.equal(p[0].url, "/");
  // checked in today: tonight is a plain wind-down
  const q = planReminders(S({ bedtime: "23:30", checkins: [ci("2026-11-03")] }), at(9));
  assert.equal(q[0].id, "winddown-2026-11-03");
});

test("a bedtime after midnight puts the wind-down late that same evening", () => {
  const p = planReminders(S({ bedtime: "01:00", reminders: R({ mode: "off" }) }), at(9));
  assert.equal(p[0].id, "winddown-2026-11-03");
  assert.equal(new Date(p[0].at).getDate(), 4);
  assert.equal(hm(p[0].at), "00:00");
});

test("the evening before an exam gets the brain dump note instead", () => {
  const p = planReminders(S({ exams: [{ id: "x", name: "Physics", date: "2026-11-05" }] }), at(9));
  const eve = p.find((x) => x.id === "exam-2026-11-04");
  assert.ok(eve);
  assert.equal(eve.url, "/journal-new?template=braindump");
  assert.ok(!p.some((x) => x.id === "checkin-2026-11-04"));
  // the exam name never shows on the lock screen
  assert.ok(!JSON.stringify(p).includes("Physics"));
  // switched off: no exam note
  assert.ok(!planReminders(S({ reminders: R({ exams: false }), exams: [{ id: "x", name: "P", date: "2026-11-05" }] }), at(9)).some((x) => x.id.startsWith("exam")));
});

test("lock-screen wording stays neutral and the text changes day to day", () => {
  const p = planReminders(S({ bedtime: "23:00" }), at(9)).concat(planReminders(S(), at(9)));
  for (const x of p) assert.doesNotMatch(`${x.title} ${x.body}`, /mood|anxi|depress|mental|stress|streak|missed|\d/i);
  const titles = planReminders(S(), at(9)).map((x) => x.title);
  assert.equal(new Set(titles).size, titles.length);
});
