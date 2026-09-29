import { test } from "node:test";
import assert from "node:assert/strict";
import { score } from "./checkups.ts";

test("PHQ-9 bands at published cut-offs, item 9 always flags", () => {
  assert.equal(score("phq9", [0, 0, 0, 0, 0, 0, 0, 0, 0]).band, "Minimal");
  assert.equal(score("phq9", [1, 1, 1, 1, 1, 0, 0, 0, 0]).band, "Mild");
  assert.equal(score("phq9", [3, 3, 3, 3, 3, 3, 2, 0, 0]).band, "Severe");
  assert.equal(score("phq9", [0, 0, 0, 0, 0, 0, 0, 0, 1]).flag, true);
  assert.equal(score("phq9", [3, 3, 3, 3, 3, 0, 0, 0, 0]).flag, false);
});

test("GAD-7 bands", () => {
  assert.equal(score("gad7", [2, 2, 2, 2, 2, 0, 0]).band, "Moderate");
  assert.equal(score("gad7", [3, 3, 3, 3, 3, 0, 0]).band, "Severe");
});

test("CBI reverse-scores the free-time energy item and reports both parts", () => {
  const personal = [50, 50, 50, 50, 50, 50];
  // six study answers at 75; the last item "enough energy" answered Always (100) → reversed to 0
  const r = score("cbi", [...personal, 75, 75, 75, 75, 75, 75, 100]);
  assert.equal(r.detail, "Personal 50 · Study 64 (out of 100)");
  assert.equal(r.band, "Moderate");
});

test("tech-stress maps 1–5 agreement onto 0–100", () => {
  assert.equal(score("tech", [1, 1, 1, 1, 1, 1, 1, 1]).score, 0);
  assert.equal(score("tech", [5, 5, 5, 5, 5, 5, 5, 5]).band, "High");
});
