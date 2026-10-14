import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptRoman, downsample, hasDevanagari, isUsableClip } from "./transcript.ts";

test("devanagari detection", () => {
  assert.equal(hasDevanagari("आज exam है"), true);
  assert.equal(hasDevanagari("aaj exam hai"), false);
});

test("romanisation accepted only when it keeps roughly the same length", () => {
  assert.equal(acceptRoman("आज मुझे अच्छा लग रहा है", "aaj mujhe accha lag raha hai"), "aaj mujhe accha lag raha hai");
  assert.equal(acceptRoman("आज मुझे अच्छा लग रहा है", "I feel good"), undefined);
  assert.equal(acceptRoman("आज", ""), undefined);
});

test("downsample to 60 buckets, empty stays empty", () => {
  assert.equal(downsample(Array.from({ length: 600 }, () => 0.5)).length, 60);
  assert.deepEqual(downsample([]), []);
  assert.equal(downsample([0.2, 0.4], 60).length, 2); // never upsamples
});

test("too short or silent clips are rejected", () => {
  assert.equal(isUsableClip(1000, [0.5]), false);
  assert.equal(isUsableClip(5000, [0.01, 0.02]), false);
  assert.equal(isUsableClip(5000, [0.01, 0.4]), true);
});
