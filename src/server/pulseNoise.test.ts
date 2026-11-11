import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptableDay, noisyMean } from "./pulseNoise.ts";

test("pulse noise is stable for the same seed, so repeated requests can't average it away", () => {
  assert.equal(noisyMean(3.2, 12, "SVIIT:2026-10-27:mood"), noisyMean(3.2, 12, "SVIIT:2026-10-27:mood"));
});

test("pulse noise stays inside the 1–5 scale and is rounded to one decimal", () => {
  for (let i = 0; i < 200; i++) {
    const v = noisyMean(i % 2 ? 1 : 5, 10, `seed-${i}`);
    assert.ok(v >= 1 && v <= 5);
    assert.equal(Math.round(v * 10) / 10, v);
  }
});

test("one student's influence is hidden: with 10 students the noise is often larger than 1/10 of the range", () => {
  let big = 0;
  for (let i = 0; i < 400; i++) if (Math.abs(noisyMean(3, 10, `s${i}`) - 3) >= 0.4) big++;
  assert.ok(big > 80, `expected meaningful noise, got ${big}/400 draws ≥ 0.4`);
});

test("noise shrinks as more students take part", () => {
  const spread = (n: number) => {
    let sum = 0;
    for (let i = 0; i < 400; i++) sum += Math.abs(noisyMean(3, n, `k${i}`) - 3);
    return sum / 400;
  };
  assert.ok(spread(200) < spread(10));
});

test("only today's or yesterday's check-in is accepted", () => {
  const now = new Date("2026-10-27T10:00:00Z");
  assert.equal(acceptableDay("2026-10-27", now), true);
  assert.equal(acceptableDay("2026-10-26", now), true);
  assert.equal(acceptableDay("2026-10-20", now), false);
  assert.equal(acceptableDay("2026-11-05", now), false);
  assert.equal(acceptableDay("not-a-day", now), false);
});
