import test from "node:test";
import assert from "node:assert/strict";
import { yourCourse } from "./course.ts";
import type { State } from "./store";
import type { Course } from "../content/courses/types.ts";

const baseState: State = {
  onboarded: false,
  companion: "Max",
  anonId: "123",
  shareContext: true,
  lock: false,
  checkins: [],
  entries: [],
  chats: [],
  courseProgress: {},
  insights: [],
  cardHistory: [],
  activity: [],
  values: [],
  consents: { ai: false, voice: false, sync: false },
  musicRecent: [],
  simpleFont: false,
  results: [],
  reframes: [],
  plans: [],
};

const dummyCourses: Course[] = [
  {
    id: "stress-toolkit",
    title: "Stress toolkit",
    summary: "WHO stress tools",
    category: "stress",
    days: [
      { day: 1, title: "D1", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 2, title: "D2", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 3, title: "D3", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 4, title: "D4", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 5, title: "D5", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 6, title: "D6", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
    ],
  },
  {
    id: "exam-stress",
    title: "Exam stress",
    summary: "Exam tools",
    category: "exam",
    days: [
      { day: 1, title: "D1", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 2, title: "D2", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 3, title: "D3", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 4, title: "D4", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
    ],
  },
  {
    id: "overthinking",
    title: "Overthinking & worry",
    summary: "Worry time",
    category: "worry",
    days: [
      { day: 1, title: "D1", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 2, title: "D2", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 3, title: "D3", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 4, title: "D4", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 5, title: "D5", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
    ],
  },
  {
    id: "sleep-reset",
    title: "Sleep reset",
    summary: "CBT-I rules",
    category: "sleep",
    days: [
      { day: 1, title: "D1", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 2, title: "D2", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 3, title: "D3", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 4, title: "D4", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 5, title: "D5", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
    ],
  },
  {
    id: "get-going",
    title: "Get going again",
    summary: "Behavioural activation",
    category: "mood",
    days: [
      { day: 1, title: "D1", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 2, title: "D2", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 3, title: "D3", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 4, title: "D4", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 5, title: "D5", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
    ],
  },
  {
    id: "kind-to-yourself",
    title: "Kind to yourself",
    summary: "Self-compassion",
    category: "compassion",
    days: [
      { day: 1, title: "D1", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 2, title: "D2", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 3, title: "D3", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 4, title: "D4", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
      { day: 5, title: "D5", body: ["b"], action: { tool: "breathe" }, source: "s", licence: "l" },
    ],
  },
];

test("no data picks default stress-toolkit days 1, 2, 4, 5", () => {
  const s: State = baseState;
  const plan = yourCourse(s, dummyCourses, new Date("2026-10-13T10:00:00Z"));
  assert.equal(plan.length, 4);
  assert.deepEqual(plan, [
    { course: "stress-toolkit", day: 1 },
    { course: "stress-toolkit", day: 2 },
    { course: "stress-toolkit", day: 4 },
    { course: "stress-toolkit", day: 5 },
  ]);
});

test("high PSWQ and poor sleep picks 2 overthinking and 2 sleep-reset lessons", () => {
  const s: State = {
    ...baseState,
    results: [
      { checkup: "pswq", score: 68, band: "High worry", at: Date.now() - 1000 },
      { checkup: "sci", score: 12, band: "Poor sleep", at: Date.now() - 1000 },
    ],
  };
  const plan = yourCourse(s, dummyCourses, new Date("2026-10-13T10:00:00Z"));
  assert.equal(plan.length, 4);
  const overthinkingDays = plan.filter((p) => p.course === "overthinking");
  const sleepDays = plan.filter((p) => p.course === "sleep-reset");
  assert.equal(overthinkingDays.length, 2);
  assert.equal(sleepDays.length, 2);
});

test("an unhelpful lesson is never picked", () => {
  const s: State = {
    ...baseState,
    results: [
      { checkup: "pswq", score: 68, band: "High worry", at: Date.now() - 1000 },
      { checkup: "sci", score: 12, band: "Poor sleep", at: Date.now() - 1000 },
    ],
    courseProgress: {
      overthinking: { done: [1], unhelpful: [1, 2] },
    },
  };
  const plan = yourCourse(s, dummyCourses, new Date("2026-10-13T10:00:00Z"));
  assert.equal(plan.length, 4);
  const overthinkingDays = plan.filter((p) => p.course === "overthinking");
  assert.equal(overthinkingDays.some((p) => p.day === 1 || p.day === 2), false);
});

test("always returns exactly 4 items even when many lessons are done", () => {
  const s: State = {
    ...baseState,
    results: [{ checkup: "cbi", score: 70, band: "High burnout", at: Date.now() }],
    courseProgress: {
      "stress-toolkit": { done: [1, 2, 3, 4, 5, 6], unhelpful: [] },
    },
  };
  const plan = yourCourse(s, dummyCourses, new Date("2026-10-13T10:00:00Z"));
  assert.equal(plan.length, 4);
});
