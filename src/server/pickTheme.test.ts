import { test } from "node:test";
import assert from "node:assert/strict";
import { pickTheme } from "./pickTheme.ts";
import { INSIGHT_THEMES } from "./insightThemes.ts";

const base = { checkins7: 3, feelings: [], influences: [], bands: [], avoidTitles: [] };

test("daily reflection theme follows the student's own week", () => {
  assert.equal(pickTheme({ ...base, sleep: 2 }, INSIGHT_THEMES).title, "Sleep and Energy");
  assert.equal(pickTheme({ ...base, sleep: 4, pressure: 4.5 }, INSIGHT_THEMES).title, "Exam Stress Patterns");
  assert.equal(pickTheme({ ...base, feelings: [["lonely", 2]] }, INSIGHT_THEMES).title, "Social Connection");
});

test("a good week gets an encouraging theme, not a problem the student doesn't have", () => {
  assert.equal(pickTheme({ ...base, mood: 4, sleep: 4, pressure: 3, phoneMin: 30 }, INSIGHT_THEMES).title, "Small Wins");
});
