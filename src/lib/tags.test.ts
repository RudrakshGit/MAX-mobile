import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanTags } from "./tags.ts";

test("keeps only known ids, max 3 feelings and 2 influences, no duplicates", () => {
  const r = cleanTags({
    feelings: ["anxious", "anxious", "sad", "bogus", "lonely", "drained"],
    influences: ["studies", "sleep", "money"],
  });
  assert.deepEqual(r, {
    feelings: ["anxious", "sad", "lonely"],
    influences: ["studies", "sleep"],
  });
});

test("garbage input gives empty lists", () => {
  assert.deepEqual(cleanTags(null), { feelings: [], influences: [] });
  assert.deepEqual(cleanTags({ feelings: "sad" }), { feelings: [], influences: [] });
  assert.deepEqual(cleanTags(undefined), { feelings: [], influences: [] });
  assert.deepEqual(cleanTags("not an object"), { feelings: [], influences: [] });
});
