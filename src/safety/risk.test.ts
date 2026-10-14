import { test } from "node:test";
import assert from "node:assert/strict";
import { finalLevel, needsSafeguard } from "./risk.ts";

const read = (risk: number) => ({ emotions: [], intensity: 5, risk });

test("high read risk is a crisis without asking safeguard", () => {
  assert.equal(needsSafeguard("none", read(8)), false);
  assert.equal(finalLevel("none", read(8), null), "crisis");
});

test("borderline read risk asks safeguard, and safeguard can escalate", () => {
  assert.equal(needsSafeguard("none", read(5)), true);
  assert.equal(finalLevel("none", read(5), "crisis"), "crisis");
  assert.equal(finalLevel("none", read(5), "none"), "distress");
});

test("regex distress always asks safeguard", () => {
  assert.equal(needsSafeguard("distress", read(1)), true);
  assert.equal(finalLevel("distress", read(1), null), "distress");
});

test("a failed read is unknown, never safe", () => {
  assert.equal(needsSafeguard("distress", null), true);
  assert.equal(needsSafeguard("none", null), false); // one-word message, nothing to check
  assert.equal(needsSafeguard("none", null, 2), false);
  assert.equal(needsSafeguard("none", null, 3), true); // read failed: fail closed, ask safeguard
  assert.equal(finalLevel("distress", null, null), "distress");
  assert.equal(finalLevel("none", null, "crisis"), "crisis");
});

test("calm message stays calm and cheap", () => {
  assert.equal(needsSafeguard("none", read(1)), false);
  assert.equal(finalLevel("none", read(1), null), "none");
});

test("out-of-range scores are clamped, not trusted", () => {
  assert.equal(finalLevel("none", read(42), null), "crisis");
  assert.equal(finalLevel("none", read(-3), null), "none");
});
