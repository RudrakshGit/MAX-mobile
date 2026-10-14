import { test } from "node:test";
import assert from "node:assert/strict";
import { featured, filterInstruments, type TestSummary } from "./tests.ts";
import type { Result } from "./store";

const mockInstruments: TestSummary[] = [
  { id: "phq9", title: "Low mood check (PHQ-9)", short: "PHQ-9", category: "wellness", minutes: 2 },
  { id: "gad7", title: "Worry check (GAD-7)", short: "GAD-7", category: "wellness", minutes: 2 },
  { id: "saps", title: "Perfectionism (SAPS)", short: "SAPS", category: "growth", minutes: 2 },
  { id: "brs", title: "Brief Resilience Scale", short: "BRS", category: "growth", minutes: 2 },
  { id: "miniIpip", title: "Personality (Mini-IPIP)", short: "Mini-IPIP", category: "personality", minutes: 3 },
  { id: "tech", title: "Tech-stress check", short: "Tech-stress", category: "phone", minutes: 1 },
];

test("featured: nobody tested yet picks the first wellness test", () => {
  const state = { results: [] };
  const picked = featured(state, mockInstruments);
  assert.equal(picked?.id, "phq9");
});

test("featured: picks first untaken in order wellness → growth → personality", () => {
  const r1: Result = { id: "1", checkup: "phq9", at: 1000, score: 3, band: "Minimal" };
  const r2: Result = { id: "2", checkup: "gad7", at: 1050, score: 2, band: "Minimal" };
  // Wellness all taken -> first growth untaken (saps)
  const picked1 = featured({ results: [r1, r2] }, mockInstruments);
  assert.equal(picked1?.id, "saps");

  // saps taken -> next growth (brs)
  const r3: Result = { id: "3", checkup: "saps", at: 1100, score: 10, band: "Normal" };
  const picked2 = featured({ results: [r1, r2, r3] }, mockInstruments);
  assert.equal(picked2?.id, "brs");

  // growth all taken -> first personality (miniIpip)
  const r4: Result = { id: "4", checkup: "brs", at: 1200, score: 3.5, band: "Normal" };
  const picked3 = featured({ results: [r1, r2, r3, r4] }, mockInstruments);
  assert.equal(picked3?.id, "miniIpip");
});

test("featured: all taken picks the one taken longest ago", () => {
  const results: Result[] = [
    { id: "1", checkup: "phq9", at: 100, score: 5, band: "Mild" },
    { id: "2", checkup: "gad7", at: 300, score: 4, band: "Minimal" },
    { id: "3", checkup: "saps", at: 400, score: 12, band: "Normal" },
    { id: "4", checkup: "brs", at: 500, score: 3.2, band: "Normal" },
    { id: "5", checkup: "miniIpip", at: 600, score: 0, band: "Profile" },
    { id: "6", checkup: "tech", at: 700, score: 20, band: "Low" },
  ];
  // phq9 is at 100, which is oldest
  const picked = featured({ results }, mockInstruments);
  assert.equal(picked?.id, "phq9");

  // If phq9 retaken at 800, now gad7 (at 300) is oldest
  const retaken = [...results, { id: "7", checkup: "phq9", at: 800, score: 2, band: "Minimal" }];
  const pickedAfter = featured({ results: retaken }, mockInstruments);
  assert.equal(pickedAfter?.id, "gad7");
});

test("filterInstruments filters case-insensitively by title or short", () => {
  const matchTitle = filterInstruments(mockInstruments, "mood");
  assert.equal(matchTitle.length, 1);
  assert.equal(matchTitle[0].id, "phq9");

  const matchShort = filterInstruments(mockInstruments, "gad");
  assert.equal(matchShort.length, 1);
  assert.equal(matchShort[0].id, "gad7");

  const matchCase = filterInstruments(mockInstruments, "MINI");
  assert.equal(matchCase.length, 1);
  assert.equal(matchCase[0].id, "miniIpip");

  const matchEmpty = filterInstruments(mockInstruments, "");
  assert.equal(matchEmpty.length, mockInstruments.length);

  const matchNone = filterInstruments(mockInstruments, "xyznonexistent");
  assert.equal(matchNone.length, 0);
});
