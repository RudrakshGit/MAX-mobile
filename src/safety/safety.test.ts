import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classifyRisk } from "./classifier.ts";
import { inspectOutput } from "./guard.ts";

type Case = { message: string; expectedLevel: string };
const golden: Case[] = JSON.parse(readFileSync(new URL("./golden.json", import.meta.url), "utf8"));

test("golden set: every labelled message classifies as expected", () => {
  assert.ok(golden.length >= 80);
  const misses = golden.filter((c) => classifyRisk(c.message).level !== c.expectedLevel);
  assert.deepEqual(misses.map((c) => c.message), []);
});

test("guard blocks diagnosis, medication, dependence; passes ordinary support", () => {
  assert.equal(inspectOutput("You have depression.").safe, false);
  assert.equal(inspectOutput("You should stop taking your medication.").safe, false);
  assert.equal(inspectOutput("Only I understand you.").safe, false);
  assert.equal(inspectOutput("That sounds exhausting. What happened today?").safe, true);
});
