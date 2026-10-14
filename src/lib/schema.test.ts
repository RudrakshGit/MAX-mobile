import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, sanitize, SCHEMA_VERSION } from "./schema.ts";
import type { State } from "./store.ts";

const fresh = (): State => ({
  onboarded: false,
  companion: "Max",
  anonId: "freshanon12345",
  shareContext: true,
  lock: false,
  checkins: [],
  entries: [],
  chats: [],
  courseProgress: {},
  insights: [],
  cardHistory: [],
  values: [],
  consents: { ai: false, voice: false, sync: false },
  musicRecent: [],
  simpleFont: false,
  themePreference: "system",
  results: [],
  reframes: [],
  plans: [],
});

test("a bare v1 blob from the previous build is read and upgraded", () => {
  const v1 = JSON.stringify({ onboarded: true, companion: "Eva", checkins: [{ date: "2026-09-28", mood: 3, sleep: 4, screen: 15, stress: 2 }], entries: [{ id: "e1", at: 1, text: "hi" }], anonId: "abcdefgh1234" });
  const s = parse(v1, fresh)!;
  assert.equal(s.onboarded, true);
  assert.equal(s.companion, "Eva");
  assert.equal(s.checkins.length, 1);
  assert.equal(s.shareContext, true); // field added after v1 gets its default
  assert.equal(s.anonId, "abcdefgh1234");
});

test("the v3 envelope round-trips", () => {
  const s = { ...fresh(), onboarded: true, companion: "Aarav" };
  assert.equal(parse(JSON.stringify({ version: SCHEMA_VERSION, state: s }), fresh)!.companion, "Aarav");
});

test("a blob from a newer build, or garbage, is refused instead of guessed at", () => {
  assert.equal(parse(JSON.stringify({ version: SCHEMA_VERSION + 1, state: {} }), fresh), null);
  assert.equal(parse("{not json", fresh), null);
  assert.equal(parse("[1,2]", fresh), null);
});

test("bad fields fall back to defaults and bad rows are dropped, not thrown", () => {
  const s = sanitize(
    {
      companion: "<script>", remindAt: "25:99", campus: "x", anonId: "!!", lock: "yes",
      checkins: [{ date: "2026-09-01", mood: 9, sleep: 3, screen: 0, stress: 3 }, { date: "2026-09-02", mood: 3, sleep: 3, screen: 0, stress: 3 }, { date: "2026-09-02", mood: 4, sleep: 3, screen: 0, stress: 3 }, "x", null],
      messages: [{ role: "robot", text: "x" }, { role: "assistant", text: "", kind: "crisis" }, { role: "user", text: "ok", suggest: [{ label: "a", href: "javascript:x" }, { label: "b", href: "/tool/breathe" }] }],
      results: [{ checkup: "isi", band: "x", score: 1 }, { checkup: "phq9", band: "Mild", score: 6 }],
    },
    fresh,
  );
  assert.equal(s.companion, "script");
  assert.equal(s.remindAt, undefined);
  assert.equal(s.campus, undefined);
  assert.equal(s.anonId, "freshanon12345");
  assert.equal(s.lock, false);
  assert.deepEqual(s.checkins.map((c) => [c.date, c.mood]), [["2026-09-02", 4]]); // bad mood dropped, duplicate day keeps the latest
  assert.equal(s.chats.length, 1);
  assert.equal(s.chats[0].messages.length, 2);
  assert.deepEqual(s.chats[0].messages[1].suggest, [{ label: "b", href: "/tool/breathe" }]);
  assert.deepEqual(s.results.map((r) => r.checkup), ["phq9"]);
});

test("chat history is capped", () => {
  const many = Array.from({ length: 450 }, (_, i) => ({ role: "user", text: `m${i}`, at: i }));
  const s = sanitize({ messages: many }, fresh);
  assert.equal(s.chats[0].messages.length, 300);
  assert.equal(s.chats[0].messages.at(-1)!.text, "m449");
});

test("emotions are kept on message if valid, cleaned if invalid", () => {
  const s = sanitize(
    {
      messages: [
        { role: "assistant", text: "hello", emotions: ["calm", "tired", "hopeful", "extra"] },
        { role: "assistant", text: "world", emotions: ["this-string-is-way-longer-than-thirty-characters-and-should-be-dropped"] },
        { role: "assistant", text: "test", emotions: "not-an-array" },
      ],
    },
    fresh,
  );
  assert.deepEqual(s.chats[0].messages[0].emotions, ["calm", "tired", "hopeful"]);
  assert.equal(s.chats[0].messages[1].emotions, undefined);
  assert.equal(s.chats[0].messages[2].emotions, undefined);
});

test("v2 single conversation becomes the first chat, nothing lost", () => {
  const v2 = { version: 2, state: { onboarded: true, companion: "Max", anonId: "abcdefgh1234", consentAt: 5,
    messages: [{ id: "m1", role: "user", text: "hello there", at: 10 }, { id: "m2", role: "assistant", text: "hi", at: 11 }],
    entries: [{ id: "e1", at: 20, text: "diary" }] } };
  const s = parse(JSON.stringify(v2), fresh)!;
  assert.equal(s.chats.length, 1);
  assert.equal(s.chats[0].messages.length, 2);
  assert.equal(s.chats[0].title, "hello there");
  assert.equal(s.activeChatId, s.chats[0].id);
  assert.deepEqual(s.entries[0].feelings, []);
  assert.equal(s.entries[0].updatedAt, 20);
  assert.equal(s.consents.ai, true);   // consentAt existed
  assert.equal("messages" in s, false);
});

test("v3 round-trips and unknown activeChatId is dropped", () => {
  const s = { ...fresh(), chats: [{ id: "c1", title: "t", createdAt: 1, updatedAt: 2, messages: [] }], activeChatId: "nope" };
  const back = parse(JSON.stringify({ version: 3, state: s }), fresh)!;
  assert.equal(back.chats[0].id, "c1");
  assert.equal(back.activeChatId, undefined);
});

test("caps: 50 chats, 300 messages each, 60 insights", () => {
  const msgs = Array.from({ length: 320 }, (_, i) => ({ id: `m${i}`, role: "user", text: `x${i}`, at: i }));
  const chats = Array.from({ length: 55 }, (_, i) => ({ id: `c${i}`, title: "t", createdAt: i, updatedAt: i, messages: msgs }));
  const insights = Array.from({ length: 70 }, (_, i) => ({ date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10), title: "t", sections: [] })); // 70 distinct dates
  const s = sanitize({ chats, insights }, fresh);
  assert.equal(s.chats.length, 50);
  assert.equal(s.chats[0].messages.length, 300);
  assert.equal(s.insights.length, 60);
});

test("bad entry fields are cleaned, not thrown", () => {
  const s = sanitize({ entries: [{ id: "e", at: 1, updatedAt: 1, feelings: ["calm", 3, "x".repeat(99)], influences: "nope", mood: 9, text: "ok" }] }, fresh);
  assert.deepEqual(s.entries[0].feelings, ["calm"]);
  assert.deepEqual(s.entries[0].influences, []);
  assert.equal(s.entries[0].mood, undefined);
});

test("results handles parts, top, incomplete and validates instrument IDs", () => {
  const raw = {
    results: [
      { checkup: "miniIpip", score: 0, parts: { Extraversion: 14.5, Neuroticism: "bad", Agreeableness: 18 } },
      { checkup: "onetMiniIp", score: 0, top: ["Investigative", "Artistic", 123, "Social"] },
      { checkup: "phq9", score: 0, incomplete: true },
      { checkup: "unknown_test", score: 10, band: "High" },
    ],
  };
  const s = sanitize(raw, fresh);
  assert.equal(s.results.length, 3);

  // miniIpip has parts sanitized
  assert.equal(s.results[0].checkup, "miniIpip");
  assert.deepEqual(s.results[0].parts, { Extraversion: 14.5, Agreeableness: 18 });

  // onetMiniIp has top strings sanitized
  assert.equal(s.results[1].checkup, "onetMiniIp");
  assert.deepEqual(s.results[1].top, ["Investigative", "Artistic", "Social"]);

  // phq9 incomplete is preserved
  assert.equal(s.results[2].checkup, "phq9");
  assert.equal(s.results[2].incomplete, true);
});
