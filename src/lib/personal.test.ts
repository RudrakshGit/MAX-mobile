import { test } from "node:test";
import assert from "node:assert/strict";
import { afterCheckin, chatStarters, helpScore, journalBridge, nextExam, rankActions, usualCheckinTime, whatHelps } from "./personal.ts";

const at = (h: number, m = 0, d = 3) => new Date(2026, 10, d, h, m);
const S = (o: any = {}): any => ({ checkins: [], entries: [], exams: [], helped: [], ...o });
const ci = (date: string, o: any = {}) => ({ date, mood: 3, sleep: 3, screen: 15, stress: 3, ...o });
const ids = (xs: { id: string }[]) => xs.map((x) => x.id);

test("heavy study pressure today puts the one-minute reset first, with the reason", () => {
  const r = rankActions(S({ checkins: [ci("2026-11-03", { stress: 5 })] }), at(15));
  assert.equal(r[0].id, "breathe");
  assert.equal(r[0].reason, "Study pressure is heavy today");
});

test("late at night after a rough night: 4-7-8 breathing and a sleep sound come first", () => {
  const r = rankActions(S({ checkins: [ci("2026-11-03", { sleep: 1 })] }), at(23, 30));
  assert.deepEqual(ids(r).slice(0, 2).sort(), ["breathe478", "sleepSound"]);
});

test("an exam tomorrow brings the brain dump and a focus session during the day", () => {
  const r = rankActions(S({ exams: [{ id: "x", name: "Physics", date: "2026-11-04" }] }), at(11));
  assert.equal(r[0].id, "braindump");
  assert.equal(r[0].reason, "Physics tomorrow");
  assert.ok(ids(r).includes("focus"));
});

test("three heavy days in a row point to a person and the safety plan", () => {
  const r = rankActions(S({ checkins: [ci("2026-11-01", { mood: 1 }), ci("2026-11-02", { mood: 2 }), ci("2026-11-03", { mood: 2 })] }), at(18));
  assert.equal(r[0].id, "talk");
  assert.ok(ids(r).includes("safetyPlan"));
});

test("what helped this student before beats the generic order", () => {
  const fb = (tool: string, ok: boolean) => [1, 2, 3].map((i) => ({ id: `${tool}${i}`, tool, at: at(10, i).getTime(), helped: ok }));
  // with no feedback the default order puts the one-minute reset first
  assert.equal(rankActions(S(), at(12))[0].id, "breathe");
  // this student found talking helpful and breathing not
  const r = rankActions(S({ helped: [...fb("talk", true), ...fb("breathe", false)] }), at(12));
  assert.equal(r[0].id, "talk");
  assert.ok(ids(r).indexOf("breathe") === -1 || ids(r).indexOf("breathe") > 1);
});

test("helpScore: recent answers count more, and one answer moves it only a little", () => {
  const now = at(12).getTime();
  assert.equal(helpScore([], "x", now), 0);
  assert.ok(helpScore([{ id: "1", tool: "x", at: now, helped: true }], "x", now) <= 0.5);
  const old = helpScore([{ id: "1", tool: "x", at: now - 90 * 864e5, helped: true }], "x", now);
  const recent = helpScore([{ id: "1", tool: "x", at: now, helped: true }], "x", now);
  assert.ok(recent > old);
});

test("after a check-in: a clear next step only when the check-in says something", () => {
  assert.equal(afterCheckin(S({ checkins: [ci("2026-11-03")] }), at(20)), null);
  const step = afterCheckin(S({ checkins: [ci("2026-11-03", { mood: 1 })] }), at(20));
  assert.ok(step && step.reason);
  assert.equal(afterCheckin(S(), at(20)), null);
});

test("journal bridge follows the feelings picked", () => {
  assert.equal(journalBridge({ feelings: ["anxious"], mood: 3 })?.id, "ground");
  assert.equal(journalBridge({ feelings: ["lonely"], mood: 3 })?.id, "talk");
  assert.equal(journalBridge({ feelings: ["happy"], mood: 4 }), null);
});

test("usual check-in time is learned, and late-night check-ins wrap around midnight", () => {
  const mk = (h: number, m: number, d: number) => ci(`2026-11-0${d}`, { at: at(h, m, d).getTime() });
  assert.equal(usualCheckinTime([mk(21, 0, 1), mk(21, 10, 2)]), null, "needs at least 4");
  assert.equal(usualCheckinTime([mk(21, 0, 1), mk(21, 20, 2), mk(21, 5, 3), mk(20, 50, 4)]), "21:00");
  assert.equal(usualCheckinTime([mk(23, 50, 1), mk(0, 20, 2), mk(0, 5, 3), mk(23, 40, 4)]), "00:00");
});

test("next exam is within the window and today counts", () => {
  const exams = [{ id: "a", name: "Maths", date: "2026-11-03" }, { id: "b", name: "Bio", date: "2026-11-09" }];
  assert.equal(nextExam(exams, at(9))?.name, "Maths");
  assert.equal(nextExam([exams[1]], at(9)), null);
});

test("chat starters fit the time of day and an upcoming exam", () => {
  assert.ok(chatStarters(S(), at(23, 30)).includes("I can't switch my brain off to sleep"));
  assert.ok(chatStarters(S(), at(9)).includes("I don't feel like starting today"));
  assert.equal(chatStarters(S({ exams: [{ id: "x", name: "Physics", date: "2026-11-05" }] }), at(15))[0], "I'm worried about my Physics exam");
  assert.equal(chatStarters(S(), at(15)).length, 4);
  // always a neutral and a happy one, whatever the day looks like
  const low = chatStarters(S({ checkins: [ci("2026-11-03", { mood: 1 })] }), at(15));
  assert.ok(low.includes("Just want to chat") && low.includes("Something good happened today"));
});

test("what helps me: most helpful first, only tools rated at least twice", () => {
  const h = (tool: string, ok: boolean, i: number) => ({ id: `${tool}${i}`, tool, at: at(10, i).getTime(), helped: ok });
  const list = whatHelps([h("ground", true, 1), h("ground", true, 2), h("breathe", false, 3), h("breathe", true, 4), h("talk", true, 5)], at(12).getTime());
  assert.deepEqual(list.map((x) => [x.tool, x.yes, x.total]), [["ground", 2, 2], ["breathe", 1, 2]]);
});
