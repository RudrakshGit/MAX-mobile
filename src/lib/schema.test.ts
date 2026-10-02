import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, sanitize, SCHEMA_VERSION } from "./schema.ts";
import type { State } from "./store.ts";

const fresh = (): State => ({ onboarded: false, companion: "Max", anonId: "freshanon12345", shareContext: true, lock: false, checkins: [], entries: [], messages: [], results: [], reframes: [], plans: [] });

test("a bare v1 blob from the previous build is read and upgraded", () => {
  const v1 = JSON.stringify({ onboarded: true, companion: "Eva", checkins: [{ date: "2026-09-28", mood: 3, sleep: 4, screen: 15, stress: 2 }], entries: [{ id: "e1", at: 1, text: "hi" }], anonId: "abcdefgh1234" });
  const s = parse(v1, fresh)!;
  assert.equal(s.onboarded, true);
  assert.equal(s.companion, "Eva");
  assert.equal(s.checkins.length, 1);
  assert.equal(s.shareContext, true); // field added after v1 gets its default
  assert.equal(s.anonId, "abcdefgh1234");
});

test("the v2 envelope round-trips", () => {
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
  assert.equal(s.messages.length, 2);
  assert.deepEqual(s.messages[1].suggest, [{ label: "b", href: "/tool/breathe" }]);
  assert.deepEqual(s.results.map((r) => r.checkup), ["phq9"]);
});

test("chat history is capped", () => {
  const many = Array.from({ length: 450 }, (_, i) => ({ role: "user", text: `m${i}`, at: i }));
  const s = sanitize({ messages: many }, fresh);
  assert.equal(s.messages.length, 300);
  assert.equal(s.messages.at(-1)!.text, "m449");
});
