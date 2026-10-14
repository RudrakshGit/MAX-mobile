import { test } from "node:test";
import assert from "node:assert/strict";
import {
  categoriseApp,
  CATEGORY_LABELS,
  byCategory,
  sevenDayCategoryAverage,
  type PhoneCategory,
} from "./appCategory.ts";

test("overrides take priority over OS category", () => {
  assert.equal(categoriseApp("com.instagram.android", "undefined"), "social");
  assert.equal(categoriseApp("com.instagram.android", "game"), "social");
  assert.equal(categoriseApp("com.whatsapp", "undefined"), "messaging");
  assert.equal(categoriseApp("com.phonepe.app", "undefined"), "payments");
  assert.equal(categoriseApp("xyz.penpencil.physicswala", "undefined"), "study");
  assert.equal(categoriseApp("com.google.android.youtube", "undefined"), "video");
});

test("falls back to OS category when package is not in override map", () => {
  assert.equal(categoriseApp("com.supercell.clashofclans", "game"), "games");
  assert.equal(categoriseApp("com.some.musicplayer", "audio"), "video");
  assert.equal(categoriseApp("com.some.videoapp", "video"), "video");
  assert.equal(categoriseApp("com.some.socialnetwork", "social"), "social");
  assert.equal(categoriseApp("com.some.officeapp", "productivity"), "study");
  assert.equal(categoriseApp("com.some.newsapp", "news"), "other");
  assert.equal(categoriseApp("com.some.mapsapp", "maps"), "other");
  assert.equal(categoriseApp("com.some.photoapp", "image"), "other");
});

test("unmapped package with undefined or missing OS category returns other", () => {
  assert.equal(categoriseApp("com.unknown.app", "undefined"), "other");
  assert.equal(categoriseApp("com.unknown.app", ""), "other");
  assert.equal(categoriseApp("com.unknown.app"), "other");
});

test("all PhoneCategories have human-readable labels", () => {
  const categories: PhoneCategory[] = ["social", "video", "games", "messaging", "study", "payments", "other"];
  for (const c of categories) {
    assert.ok(CATEGORY_LABELS[c], `Missing label for category ${c}`);
  }
});

test("byCategory sums apps into their correct buckets", () => {
  const apps = [
    { pkg: "com.instagram.android", category: "undefined", minutes: 45.2 },
    { pkg: "com.whatsapp", category: "undefined", minutes: 20 },
    { pkg: "com.google.android.youtube", category: "undefined", minutes: 60.5 },
    { pkg: "com.phonepe.app", category: "undefined", minutes: 5 },
    { pkg: "xyz.penpencil.physicswala", category: "undefined", minutes: 30 },
    { pkg: "com.supercell.clash", category: "game", minutes: 25 },
    { pkg: "com.unknown.tools", category: "undefined", minutes: 12 },
  ];
  const res = byCategory(apps);
  assert.equal(res.social, 45.2);
  assert.equal(res.messaging, 20);
  assert.equal(res.video, 60.5);
  assert.equal(res.payments, 5);
  assert.equal(res.study, 30);
  assert.equal(res.games, 25);
  assert.equal(res.other, 12);
});

test("sevenDayCategoryAverage computes average of logged days in the week window", () => {
  const weekDates = [
    "2026-10-07",
    "2026-10-08",
    "2026-10-09",
    "2026-10-10",
    "2026-10-11",
    "2026-10-12",
    "2026-10-13",
  ];
  const phoneDays = [
    { date: "2026-10-01", minutes: { social: 100 } }, // outside window
    { date: "2026-10-11", minutes: { social: 60, video: 30 } },
    { date: "2026-10-12", minutes: { social: 40, video: 50, games: 20 } },
  ];
  const avg = sevenDayCategoryAverage(phoneDays, weekDates);
  // 2 days in window:
  // social: (60 + 40) / 2 = 50
  // video: (30 + 50) / 2 = 40
  // games: (0 + 20) / 2 = 10
  // messaging: 0
  assert.equal(avg.social, 50);
  assert.equal(avg.video, 40);
  assert.equal(avg.games, 10);
  assert.equal(avg.messaging, 0);
  assert.equal(avg.study, 0);
  assert.equal(avg.payments, 0);
  assert.equal(avg.other, 0);
});

test("sevenDayCategoryAverage returns all zeroes on empty history", () => {
  const avg = sevenDayCategoryAverage([], ["2026-10-12", "2026-10-13"]);
  assert.equal(avg.social, 0);
  assert.equal(avg.video, 0);
  assert.equal(avg.games, 0);
});

