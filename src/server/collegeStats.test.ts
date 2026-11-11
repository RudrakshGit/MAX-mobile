import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDashboard, K } from "./collegeStats.ts";
import { cleanCode, cleanExams, cleanRegistration, newJoinCode } from "./college.ts";

const agg = (n: number, o: any = {}) => ({ n, mood: 3, sleep: 3, stress: 3, heavy: 0.3, poorSleep: 0.2, low: 0.1, ...o });
const raw = (o: any = {}) => ({ now: agg(40), prev: agg(30), weeks: [], sources: [], years: [], ...o });

test("nothing at all from fewer than 10 students", () => {
  const d = buildDashboard(raw({ now: agg(K - 1) }), "s");
  assert.equal(d.enough, false);
  assert.equal(d.students, null);
  assert.equal(d.now, undefined);
});

test("student count is rounded down to 5 and averages stay in range", () => {
  const d = buildDashboard(raw({ now: agg(23, { mood: 4.2 }) }), "s");
  assert.equal(d.students, 20);
  assert.ok(d.now!.mood >= 1 && d.now!.mood <= 5);
  assert.ok(d.shares!.heavy >= 0 && d.shares!.heavy <= 100);
});

test("the earlier window and weeks only appear with 10+ students each", () => {
  const d = buildDashboard(raw({ prev: agg(9), weeks: [{ week: "2026-10-26", n: 12, mood: 3, sleep: 3, stress: 3 }, { week: "2026-11-02", n: 4, mood: 1, sleep: 1, stress: 5 }] }), "s");
  assert.equal(d.prev, null);
  assert.deepEqual(d.weeks.map((w) => w.week), ["2026-10-26"]);
});

test("journal categories need 5 students and unknown ids are dropped", () => {
  const d = buildDashboard(raw({ sources: [{ tag: "studies", n: 20 }, { tag: "hostel", n: 4 }, { tag: "<script>", n: 30 }] }), "s");
  assert.deepEqual(d.sources.map((s) => s.id), ["studies"]);
  assert.equal(d.sources[0].label, "Studies & exams");
});

test("a single hidden year group takes the smallest shown one with it", () => {
  const y = (year: number, n: number) => ({ year, n, mood: 3, sleep: 3, stress: 3 });
  assert.deepEqual(buildDashboard(raw({ years: [y(1, 15), y(2, 12), y(3, 4)] }), "s").years.map((x) => x.year), [1]);
  assert.deepEqual(buildDashboard(raw({ years: [y(1, 15), y(2, 12), y(3, 11)] }), "s").years.map((x) => x.year), [1, 2, 3]);
  assert.deepEqual(buildDashboard(raw({ years: [y(1, 15), y(2, 3), y(3, 4)] }), "s").years.map((x) => x.year), [1]);
});

test("the same question on the same day gets the same noise (asking again can't average it away)", () => {
  assert.deepEqual(buildDashboard(raw(), "c:30:2026-11-04"), buildDashboard(raw(), "c:30:2026-11-04"));
});

test("registration: required fields, AISHE format, declaration", () => {
  const ok = { name: "Shri Vaishnav Institute", city: "Indore", state: "Madhya Pradesh", role: "counsellor", phone: "+91 98765 43210", aishe: "c 12345", agree: true };
  assert.equal(cleanRegistration(ok)?.aishe, "C-12345");
  assert.equal(cleanRegistration({ ...ok, agree: false }), null);
  assert.equal(cleanRegistration({ ...ok, aishe: "12345" }), null);
  assert.equal(cleanRegistration({ ...ok, role: "student" }), null);
  assert.equal(cleanRegistration({ ...ok, website: "javascript:alert(1)" }), null);
  assert.equal(cleanRegistration({ ...ok, name: "<b>X</b> College" })?.name, "bX/b College");
});

test("join codes: readable alphabet, typed loosely, look-alikes rejected", () => {
  const c = newJoinCode();
  assert.match(c, /^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
  assert.equal(cleanCode(c.toLowerCase().replace("-", " ")), c);
  assert.equal(cleanCode("K7QX-29M0"), null);
  assert.equal(cleanExams([{ name: "Mid-sem", date: "2026-11-20" }])?.length, 1);
  assert.equal(cleanExams([{ name: "Mid-sem", date: "20/11/2026" }]), null);
});
