import { test } from "node:test";
import assert from "node:assert/strict";
import { getSketchPath, seedFrom } from "./sketch.ts";

test("same inputs give the same path (no twitching)", () => {
  assert.equal(getSketchPath("rect", 200, 60, 7), getSketchPath("rect", 200, 60, 7));
});

test("a different seed gives a different path", () => {
  assert.notEqual(getSketchPath("rect", 200, 60, 7), getSketchPath("rect", 200, 60, 8));
});

test("numbers are rounded to one decimal to keep paths small", () => {
  assert.doesNotMatch(getSketchPath("pill", 120, 40, 3), /\d\.\d\d/);
});

test("seedFrom is stable and positive", () => {
  assert.equal(seedFrom("save-button"), seedFrom("save-button"));
  assert.ok(seedFrom("x") > 0);
});

test("zero or negative sizes return an empty path instead of throwing", () => {
  assert.equal(getSketchPath("rect", 0, 40, 1), "");
});
