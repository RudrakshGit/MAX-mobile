import { test } from "node:test";
import assert from "node:assert/strict";
import { bucket, lastNight, onSpans } from "./screen-time.ts";

const now = new Date(2026, 8, 29, 9, 0); // 9 am
const at = (day: number, h: number, min = 0) => new Date(2026, 8, day, h, min).getTime();

test("finds sleep and the phone minutes in the hour before it", () => {
  const ev: [number, number][] = [
    [1, at(28, 10)], [0, at(28, 12)],          // 2 h in the morning
    [1, at(28, 23, 20)], [0, at(29, 0, 5)],    // 45 min in bed, sleeps 00:05
    [1, at(29, 7, 30)], [0, at(29, 7, 40)],    // morning alarm
  ];
  const r = lastNight(ev, now);
  assert.equal(r.sleepAt, at(29, 0, 5));
  assert.equal(r.beforeSleep, 45);
  assert.equal(r.yesterday, 120 + 40); // midnight cut: 23:20–24:00 counts to yesterday
  assert.equal(bucket(r.beforeSleep!), 60); // 45 is the midpoint; rounds up
});

test("no 3-hour gap means no sleep detected", () => {
  const ev: [number, number][] = [];
  for (let h = 20; h < 33; h++) ev.push([1, at(28, h, 0)], [0, at(28, h, 50)]);
  assert.equal(lastNight(ev, now).sleepAt, null);
});

test("screen already on at window start when first event is off", () => {
  assert.deepEqual(onSpans([[0, 50]], 0, 100), [[0, 50]]);
});

test("buckets", () => {
  assert.deepEqual([0, 7, 10, 30, 44, 60, 200].map(bucket), [0, 0, 15, 30, 30, 60, 60]);
});
