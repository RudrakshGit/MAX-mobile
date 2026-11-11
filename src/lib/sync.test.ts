import { test } from "node:test";
import assert from "node:assert/strict";
import { canUpload, forUpload, hashText, mergeStates } from "./sync.ts";

// Minimal state-shaped objects; mergeStates must treat missing lists as [].
const S = (o: any): any => ({
  onboarded: true,
  anonId: "anonlocal123",
  lock: false,
  chats: [],
  entries: [],
  results: [],
  reframes: [],
  plans: [],
  checkins: [],
  insights: [],
  activity: [],
  cardHistory: [],
  musicRecent: [],
  myMusic: [],
  phoneDays: [],
  helped: [],
  exams: [],
  courseProgress: {},
  tombstones: [],
  ...o,
});
const e = (id: string, updatedAt: number, text = id, extra: any = {}) => ({ id, at: updatedAt, updatedAt, feelings: [], influences: [], text, ...extra });

test("fresh phone takes the cloud copy but keeps its own anonId, lock and sync", () => {
  const r = mergeStates(
    S({ onboarded: false, anonId: "anonphone999", lock: true, sync: { rev: 0 } }),
    S({ anonId: "anoncloud000", companion: "Eva", entries: [e("e1", 1), e("e2", 2)] }),
  );
  assert.equal(r.entries.length, 2);
  assert.equal(r.companion, "Eva");
  assert.equal(r.anonId, "anonphone999");
  assert.equal(r.lock, true);
  assert.deepEqual(r.sync, { rev: 0 });
});

test("both phones' new entries survive", () => {
  const r = mergeStates(S({ entries: [e("e1", 1)] }), S({ entries: [e("e2", 2)] }));
  assert.deepEqual(r.entries.map((x: any) => x.id).sort(), ["e1", "e2"]);
});

test("a deleted entry is not resurrected from the other phone, on either side", () => {
  const r = mergeStates(S({ entries: [e("e1", 1)], tombstones: [{ id: "e2", at: 5 }] }), S({ entries: [e("e1", 1), e("e2", 2)] }));
  assert.deepEqual(r.entries.map((x: any) => x.id), ["e1"]);
  assert.ok(r.tombstones.some((t: any) => t.id === "e2"));
  const r2 = mergeStates(S({ entries: [e("e1", 1), e("e2", 2)] }), S({ entries: [e("e1", 1)], tombstones: [{ id: "e2", at: 5 }] }));
  assert.deepEqual(r2.entries.map((x: any) => x.id), ["e1"]);
});

test("same entry edited on both phones: newer updatedAt wins", () => {
  const r = mergeStates(S({ entries: [e("e1", 10, "phone")] }), S({ entries: [e("e1", 20, "cloud")] }));
  assert.equal(r.entries[0].text, "cloud");
});

test("a voice recording stays attached on the phone that has the file", () => {
  const audio = { uri: "file:///x/voice/e1.m4a", ms: 3000, levels: [1] };
  const r = mergeStates(S({ entries: [e("e1", 10, "phone", { audio })] }), S({ entries: [e("e1", 20, "edited elsewhere")] }));
  assert.equal(r.entries[0].text, "edited elsewhere");
  assert.deepEqual(r.entries[0].audio, audio);
});

test("same chat on both phones: messages unioned in time order", () => {
  const m = (id: string, at: number) => ({ id, role: "user", text: id, at });
  const r = mergeStates(
    S({ chats: [{ id: "c1", title: "t", createdAt: 1, updatedAt: 3, messages: [m("a", 1), m("c", 3)] }] }),
    S({ chats: [{ id: "c1", title: "t", createdAt: 1, updatedAt: 2, messages: [m("a", 1), m("b", 2)] }] }),
  );
  assert.deepEqual(r.chats[0].messages.map((x: any) => x.id), ["a", "b", "c"]);
  assert.equal(r.chats[0].updatedAt, 3);
});

test("check-ins merge by date, local wins a tie", () => {
  const c = (date: string, mood: number) => ({ date, mood, sleep: 3, screen: 0, stress: 3 });
  const r = mergeStates(S({ checkins: [c("2026-10-01", 2)] }), S({ checkins: [c("2026-10-01", 5), c("2026-10-02", 4)] }));
  assert.deepEqual(r.checkins.map((x: any) => [x.date, x.mood]), [["2026-10-01", 2], ["2026-10-02", 4]]);
});

test("course progress is unioned per course", () => {
  const r = mergeStates(
    S({ courseProgress: { sleep: { done: [1, 2], unhelpful: [] } } }),
    S({ courseProgress: { sleep: { done: [2, 3], unhelpful: [4] }, exam: { done: [1], unhelpful: [] } } }),
  );
  assert.deepEqual(r.courseProgress.sleep.done, [1, 2, 3]);
  assert.deepEqual(r.courseProgress.sleep.unhelpful, [4]);
  assert.deepEqual(r.courseProgress.exam.done, [1]);
});

test("my music: links sync, songs copied from a phone stay on that phone", () => {
  const link = { id: "l1", kind: "link", title: "Mix", url: "https://open.spotify.com/x", addedAt: 1 };
  const file = { id: "f1", kind: "file", title: "Song", uri: "file:///a/music/f1.m4a", addedAt: 2 };
  const up = forUpload(S({ myMusic: [link, file] }));
  assert.deepEqual(up.myMusic.map((t: any) => t.id), ["l1"]);
  const r = mergeStates(S({ myMusic: [file] }), S({ myMusic: [link] }));
  assert.deepEqual(r.myMusic.map((t: any) => t.id).sort(), ["f1", "l1"]);
});

test("phone days: the corrected measurement wins over the old one", () => {
  const r = mergeStates(
    S({ phoneDays: [{ date: "2026-11-01", minutes: { social: 999 } }] }),
    S({ phoneDays: [{ date: "2026-11-01", minutes: { social: 40 }, v: 2 }] }),
  );
  assert.equal(r.phoneDays[0].minutes.social, 40);
});

test("forUpload strips per-device fields: anonId, lock, sync, voice-file paths", () => {
  const up = forUpload(
    S({ sync: { rev: 3 }, activeChatId: "c1", entries: [e("e1", 1, "x", { audio: { uri: "file:///v.m4a", ms: 1, levels: [] }, transcript: { status: "pending" } })] }),
  );
  assert.equal("anonId" in up, false);
  assert.equal("lock" in up, false);
  assert.equal("sync" in up, false);
  assert.equal("activeChatId" in up, false);
  assert.equal("audio" in up.entries[0], false);
  // a transcript that can never run on another phone is dropped; a finished one is kept
  assert.equal("transcript" in up.entries[0], false);
});

test("nothing is uploaded without a session token or before onboarding", () => {
  assert.equal(canUpload(S({}), null), false);
  assert.equal(canUpload(S({ onboarded: false }), "tok"), false);
  assert.equal(canUpload(S({}), "tok"), true);
});

test("tombstones are unioned and capped, newest kept", () => {
  const many = Array.from({ length: 1200 }, (_, i) => ({ id: `t${i}`, at: i }));
  const r = mergeStates(S({ tombstones: many.slice(0, 700) }), S({ tombstones: many.slice(500) }));
  assert.equal(r.tombstones.length, 1000);
  assert.ok(r.tombstones.some((t: any) => t.id === "t1199"));
  assert.ok(!r.tombstones.some((t: any) => t.id === "t0"));
});

test("hashText is stable and changes with the content", () => {
  assert.equal(hashText("abc"), hashText("abc"));
  assert.notEqual(hashText("abc"), hashText("abd"));
});
