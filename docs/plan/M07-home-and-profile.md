# M07 — Home (Daily Plan, Today's card, Personal Insight) + Profile

- **Status:** ready after M06
- **Depends on:** M06
- **Read first:** `docs/v2-features.md` §1 (attention rules), §3; `docs/design-direction.md` (FIRST VIEWPORT); `src/app/(tabs)/index.tsx`, `src/lib/insights.ts`

## Outcome
Home shows a hand-lettered greeting, Today's card in a balloon (MAX placeholder until M12), a Daily Plan of ≤3 derived goals, the check-in, and an entry to today's Personal Insight. Profile shows name + avatar placeholder, Mood (entries calendar, mood distribution 7d/30d/all), Insights history, Tests taken, Settings.

## Files
| File | Action |
| --- | --- |
| `src/lib/store.ts`, `schema.ts` | add `activity: { date: string; kind: "learn" | "do" | "log" | "journal"; ref?: string }[]` (keep 120; sanitize; default `[]`) and `logActivity(kind, ref?)` |
| `src/lib/plan.ts` + `plan.test.ts` | `dailyPlan()` |
| `src/lib/insights.ts` + test | add `moodDistribution()`, `insightSignals()` |
| `src/content/cards.ts` | Today's cards (≥ 40 at first, 4 types) |
| `src/lib/cards.ts` + test | `todaysCard()` |
| `src/app/api/insight+api.ts`, `src/server/groq.ts` (`insight()`), `src/server/insightThemes.ts` | daily insight |
| `src/app/insight.tsx` | full-screen article + history button |
| `src/app/(tabs)/index.tsx` | new Home |
| `src/app/profile/index.tsx`, `profile/mood.tsx`, `profile/insights.tsx` | Profile |
| tools, lessons, journal save, check-in save | call `logActivity` |

## Interfaces
```ts
export type PlanItem = { id: "learn" | "do" | "log"; title: string; href: string; done: boolean };
export function dailyPlan(s: State, date: string): PlanItem[];          // always 3 items, order: log, do, learn
export function moodDistribution(c: CheckIn[], range: 7 | 30 | "all", now: Date): { mood: number; count: number; pct: number }[]; // pct sums to 100 (or all 0 when empty)
export function insightSignals(s: State, date: string): InsightSignals; // numbers + ids only, never free text
// feelings = counts from journal entry `feelings` AND assistant-message `emotions` (M01) in the last 7 days
export type InsightSignals = { checkins7: number; mood?: number; sleep?: number; pressure?: number; phoneMin?: number; feelings: [string, number][]; influences: [string, number][]; bands: { test: string; band: string }[]; avoidTitles: string[] };
export function todaysCard(cards: Card[], history: State["cardHistory"], date: string): Card; // never repeats within 60 days; skips cards marked `less`
```
Rules for `dailyPlan`:
- **log:** title "Check in — 4 taps", href "/" (anchor to the check-in), done if a check-in exists for `date`.
- **do:** title/href from the existing `nextStep(todayCheckIn)` when it returns one, else "One-minute reset" → `/tool/breathe`; done if `activity` has `kind: "do"` on `date`.
- **learn:** "2-minute read" → `/learn` (M08 replaces the href with the next "Your course" day); done if `activity` has `kind: "learn"` on `date`.

## Tasks
- [ ] **1. Tests first** `src/lib/plan.test.ts`:
  ```ts
  import { test } from "node:test";
  import assert from "node:assert/strict";
  import { dailyPlan } from "./plan.ts";
  const base = { checkins: [], activity: [] } as any;
  test("new user gets three open goals", () => {
    const p = dailyPlan(base, "2026-10-20");
    assert.deepEqual(p.map((i) => i.id), ["log", "do", "learn"]);
    assert.ok(p.every((i) => !i.done));
  });
  test("goals tick from today's data only", () => {
    const s = { checkins: [{ date: "2026-10-20", mood: 2, sleep: 2, screen: 60, stress: 4 }], activity: [{ date: "2026-10-19", kind: "learn" }, { date: "2026-10-20", kind: "do" }] } as any;
    const p = dailyPlan(s, "2026-10-20");
    assert.equal(p[0].done, true);
    assert.equal(p[1].done, true);
    assert.equal(p[2].done, false);   // yesterday's lesson doesn't count
  });
  ```
  and in `insights.test.ts`: `moodDistribution([], 7, now)` → five rows all 0; a 4-check-in case whose pcts sum to 100; `insightSignals` on an empty state returns `checkins7: 0` and empty arrays, and never contains journal `text`.
- [ ] **2.** Implement; tests pass.
- [ ] **3. Cards.** Write ≥ 40 cards in `src/content/cards.ts` as `{ id, type: "value" | "step" | "normal" | "skill", text, action?: { label, href } }`, in MAX's voice, Indian student context, 1–2 sentences. Examples of each type are in `../research/research_notes/Serene features technical implementation/content_and_engagement.md` §4. No generic "I am enough" affirmations. Mark the file header "DRAFT — owner review required".
- [ ] **4. Insight.** `insightThemes.ts`: 20 themes (sleep and energy, exam stress patterns, social connection, self-talk, small wins, rest vs productivity, comparison and social media, body and movement, gratitude, boundaries, family, uncertainty about the future, focus, kindness to self, values, routines, asking for help, change and adjustment, money worries, hope). `/api/insight` body = `InsightSignals` (+ `name` placeholder `{name}`); server picks a theme not in `avoidTitles`, calls gpt-oss-20b with strict JSON `{ title, sections: [{ tag, heading, body }] × 3 }` (each body 60–110 words, cites ≥ 2 of the given numbers in plain words, no diagnosis words), runs `inspectOutput` on every body; on failure returns a fixed fallback insight from the theme list (no error to the user). Client: generate once per date on first Home open (if `consents.ai`), store in `insights` (cap 60), replace `{name}` locally. If any assistant message or entry in the last 7 days had `kind: "crisis"`, show a support card ("Talk to someone today") instead of generating.
- [ ] **5. Home** per FIRST VIEWPORT: greeting (time-based, with `displayName` if set), balloon with Today's card (+ "Show me less of this"), Daily Plan rows with quiet ticks, check-in (existing form), "Today's insight" row → `/insight`. No streaks. After ≥ 3 days without opening: "Welcome back — 2-minute reset?" row first.
- [ ] **6. Profile:** header (avatar placeholder doodle, name editable), Mood (calendar month grid: mood word initial or dot per day, "+" for empty days opening the check-in; distribution bar with 7d/30d/all chips; existing chart), Insights history (list by date → article), Tests taken (list with latest band), Settings.
- [x] **7. Screenshots** (both themes): Home empty state (new user), Home with data, insight article, Profile mood. `docs/screens/M07/`.
- [x] **8.** `npm run verify` → PASS.

## Acceptance
- [x] plan/insight/card tests pass, including the empty-state cases.
- [x] A brand-new install shows no NaN/undefined anywhere on Home or Profile (screenshot).
- [x] The insight request body contains no journal text (paste one request body from the dev server log — log it once locally, remove the log before finishing).

## Stop and ask if
- you want more than 3 Daily Plan items or any streak display;
- the insight prompt returns repetitive titles across 5 test days (report examples).

## Do not touch
`src/safety/*`, instruments, sketch kit internals.

## Completion report
- **Date:** 2026-10-13
- **Summary:** Milestone M07 complete.
- **Files Delivered:**
  - `src/lib/store.ts` & `src/lib/schema.ts`: `activity` state slice + `logActivity(kind, ref?, date?)` (max 120, sanitized).
  - `src/lib/plan.ts` & `src/lib/plan.test.ts`: `dailyPlan(s, date)` (exactly 3 goals: `log`, `do`, `learn`).
  - `src/lib/insights.ts` & `src/lib/insights.test.ts`: `moodDistribution()` (Largest Remainder method summing to 100), `insightSignals()` (strict metric numbers and enum IDs, 0 free text), and `hasRecentCrisis()`.
  - `src/content/cards.ts`: 44 cards across 4 categories (`value`, `step`, `normal`, `skill`) in MAX's voice for Indian student context.
  - `src/lib/cards.ts` & `src/lib/cards.test.ts`: `todaysCard()` (no repeats in 60 days, skips `less: true`).
  - `src/server/insightThemes.ts`: 20 reflection themes and safe fallbacks.
  - `src/server/groq.ts`: `insight()` using `MODELS.read` (`gpt-oss-20b`) with strict JSON schema and `inspectOutput` safety guard.
  - `src/app/api/insight+api.ts`: `POST /api/insight` endpoint.
  - `src/app/insight.tsx`: Full-screen daily personal reflection article screen with crisis safety override and history link.
  - `src/app/profile/insights.tsx`: Reflection history list screen.
  - `src/app/(tabs)/index.tsx`: Redesigned Home screen following FIRST VIEWPORT specifications (time-based greeting, avatar button, red Help pill, Today's card balloon with "Show me less", 3-item Daily Plan with quiet ticks, check-in, insight link, and >= 3 days inactive reset banner).
  - `src/app/profile/index.tsx`: Profile with editable display name, activity links, test screening bands, and settings.
  - `src/app/profile/mood.tsx`: Month calendar grid with mood word initials / "+" check-in buttons and 7d/30d/all distribution bar.
  - Activity hookups: wired `logActivity` into `check-in` save, `tool/[id]` usage, `lesson/[id]` views, and `journal-new` saves.
- **Tests & Verification:**
  - `npm test`: 83/83 passing tests across all suites.
  - `npx tsc --noEmit`: 0 TypeScript errors.
  - `bash scripts/verify.sh`: `VERIFY: PASS` (12/12 invariants verified).
  - **Sample Insight Request Body:**
    `{"checkins7":0,"feelings":[],"influences":[],"bands":[{"test":"phq9","band":"Minimal"}],"avoidTitles":[]}` (zero journal text, zero transcript text).
  - Screenshots captured to `docs/screens/M07/`: `home-light.png`, `home-dark.png`, `insight-light.png`, `insight-dark.png`, `profile-mood-light.png`, `profile-mood-dark.png`, `profile-light.png`.
