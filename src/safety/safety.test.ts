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

// Phrasings written after the audit of 14 Oct 2026 found the first classifier caught ~22% of them.
// "not-crisis" rows are everyday talk and idioms that must never show the crisis card.
const holdout: Case[] = JSON.parse(readFileSync(new URL("./holdout.json", import.meta.url), "utf8"));

test("holdout set: crisis phrasings are caught, everyday talk is not flagged as crisis", () => {
  assert.ok(holdout.length >= 60);
  const misses = holdout.filter((c) => {
    const level = classifyRisk(c.message).level;
    return c.expectedLevel === "crisis" ? level !== "crisis" : level === "crisis";
  });
  assert.deepEqual(misses.map((c) => c.message), []);
});
