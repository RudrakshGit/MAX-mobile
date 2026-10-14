# M04 — New navigation + Tests library

- **Status:** ready after M03 and M04a
- **Depends on:** M03, M04a (instrument files must exist — do not create them yourself). If M04a is not ready yet, do Task 1 (navigation) only, report, and stop.
- **Read first:** `docs/v2-features.md` §2 and §5, `docs/design-direction.md`, `src/content/instruments/types.ts`, `src/content/instruments/index.ts`, `src/app/checkup/[id].tsx`

## Outcome
Tabs become **Home · Learn · Talk · Journal · Tests**; Profile opens from the avatar on Home. The Tests tab has search, a featured test, category rows, an intro page, one-question-per-screen flow, and a result page that uses the M04a scoring engine and the safety rules. "About these tests" lists every citation and licence.

## Files
| File | Action |
| --- | --- |
| `src/app/(tabs)/_layout.tsx` | tabs: `index` (Home), `learn`, `talk`, `journal`, `tests` |
| `src/app/(tabs)/learn.tsx` | create — move the content of `explore.tsx` here (tools, lessons; courses come in M08) |
| `src/app/(tabs)/tests.tsx` | create — Tests home |
| `src/app/(tabs)/explore.tsx`, `src/app/(tabs)/insights.tsx` | delete; Insights content moves to `src/app/profile/mood.tsx` (M07 extends it) |
| `src/app/profile/index.tsx` | create — profile hub (avatar placeholder, name, links: Mood, Tests taken, Insights, Settings) |
| `src/app/profile/mood.tsx` | create — current Insights screen moved here unchanged |
| `src/app/test/[id].tsx` | create — intro → questions → result (replaces `src/app/checkup/[id].tsx`; keep a redirect file at the old path for deep links) |
| `src/app/tests-about.tsx` | create — "About these tests" |
| `src/app/learn/[id].tsx` → `src/app/lesson/[id].tsx` | move (avoids `/learn` tab vs `/learn/:id` ambiguity); update every `/learn/<id>` href, including `src/lib/suggest.ts`, `src/content/learn.ts` (`tryThis`), `src/lib/insights.ts` `nextStep()` and their tests' expected hrefs |
| `src/lib/prompt.ts`, `src/lib/reply.ts` (+ tests), `src/app/(tabs)/talk.tsx` | test-recommendation chips in chat (Task 6b) |
| `src/content/checkups.ts` | keep only what other code still imports; the source of truth is `src/content/instruments` |
| `src/lib/theme.ts` | remove the compatibility aliases from M03; fix every usage |
| `src/lib/store.ts` / `schema.ts` | `Result` gains `parts?`, `top?`, `incomplete?` (sanitize them); `CHECKUPS` allow-list = instrument ids |

## Tasks

- [x] **1. Navigation.** Rename/move screens as listed; Home header shows a round avatar button (placeholder doodle until M12) → `router.push("/profile")`. Help pill stays on every tab. Update every `router.push` that pointed to `/explore`, `/insights`, `/checkup/*`, `/settings` (Settings now lives at `/profile/settings` — move the file and keep `/settings` as a redirect).
- [x] **2. Tests home** (`tests.tsx`): search field (filters by title/short, case-insensitive); "Featured" = the instrument the student hasn't taken that `featured(state)` picks (rule: first untaken in the order wellness → growth → personality; if all taken, the one taken longest ago); category rows (horizontal lists of cards: hand-drawn frame, title, `N min · N questions`, "Taken" mark if a result exists).
- [x] **3. Test flow** (`test/[id].tsx`): intro (title, minutes, items, intro text, the three `whatYouGet` lines, "The science" → opens `scienceUrl` in the in-app browser — add `npx expo install expo-web-browser`, `ageNote` if present) → one question per screen with options as `Chip`s, a thin progress line, Back, and "Skip" (stores `null`) → result. Never time-limit.
- [x] **4. Result page.** `score()` from M04a. Order: if `instrument.crisisItem` answered > 0 → `CrisisCard` first; then band/parts; then for `clinical` instruments the text "This is a screening result, not a diagnosis." + "Talk to someone" card (`/help`); then one next step (a Learn course/tool suggestion); then source line. If `incomplete` → "You skipped some questions, so we can't score this. Want to finish it?". Save the `Result` (with `parts/top/incomplete`).
- [x] **5. About these tests:** list each instrument's `source` and `licence`; link `scienceUrl`.
- [x] **6. Tests in a pure helper** `src/lib/tests.ts` with `featured(state, instruments, now)` and a test file covering: nobody tested yet → first wellness test; all taken → oldest; search filter.
- [x] **6b. Test chips in chat (BetterMind pattern).** In the system prompt add: "If one of these self-tests would genuinely help the student understand what they describe, you may end your reply with [[test:<id>]] using one id from this list: <ids from instruments with clinical=false plus phq9, gad7, pswq, sci, loneliness3>. At most one, only when relevant." In `reply.ts` add `extractTestChip(text, allowedIds): { text: string; testId?: string }` that strips every `[[test:...]]` marker and returns the first allowed id (unknown ids are dropped). Test it (marker stripped; unknown id ignored; no marker → unchanged). `talk.tsx` shows the chip under the reply (`/test/<id>`).
- [x] **7. Screenshots** (both themes): Tests home, an intro, a question, a PHQ-9 result with item 9 > 0 (crisis first), an ASRS result (screening disclaimer), About. Save to `docs/screens/M04/`.
- [x] **8.** `npm run verify` → PASS.

## Acceptance
- [x] `extractTestChip` tests pass; an unknown test id never renders a chip.
- [x] Five tabs exactly as listed; Profile reachable from Home; every old route redirects or is updated (`grep -rn "/explore\|/insights\|/checkup" src` → only redirect files).
- [x] PHQ-9 with item 9 > 0 shows the crisis card above the score (screenshot).
- [x] A skipped item never produces a band.
- [x] No test content was added or edited by you (`git diff --stat src/content/instruments` → empty).

## Stop and ask if
- an instrument file seems wrong (typo, missing item) — report it, don't fix it;
- you think a band label or disclaimer wording should change.

## Do not touch
`src/content/instruments/*` (Claude-owned), `src/safety/*`, server routes.

## Completion report

### Status
Complete. 5-tab navigation, Profile hub, full Tests library, test runner with crisis-first safety prioritization, clinical screening disclaimers, chat recommendation chips, and "About these tests" screen implemented and verified.

### Key Changes
1. **Navigation Structure:**
   - Tabs: `Home` (`index`), `Learn` (`learn`), `Talk` (`talk`), `Journal` (`journal`), `Tests` (`tests`).
   - Profile hub at `/profile` (avatar button in Home header), Mood timeline moved to `/profile/mood`, Settings moved to `/profile/settings`.
   - Deep link redirects preserved at `/explore`, `/insights`, `/checkup/[id]`, `/settings`.
2. **Tests Library Hub (`src/app/(tabs)/tests.tsx`):**
   - Search filter matching title or short identifier.
   - Dynamic featured test picking the first untaken test (wellness -> growth -> personality) or oldest taken test.
   - Category rows (Wellness, Growth, Relationships, Personality, Digital Balance) with hand-drawn framed cards, metadata, and "Taken" check marks.
   - Header link to "About these tests" (`/tests-about`).
3. **Test Flow & Runner (`src/app/test/[id].tsx`):**
   - Intro: title, time, question count, what you'll get, age note, and "The science" in-app browser link.
   - One question per screen with `Chip` options, sketch progress indicator, Back, and Skip (stores `null`).
   - Result:
     - Item 9 > 0 in PHQ-9 unconditionally displays `CrisisCard` (Tele-MANAS 14416 / 112) above the score band.
     - Clinical instruments display "This is a screening result, not a diagnosis." disclaimer with "Talk to someone · Helplines" card.
     - Personalized next steps suggested based on result.
     - Skipped questions flag `incomplete: true` without producing invalid diagnostic bands.
4. **Chat Test Chips (`src/lib/reply.ts` & `src/app/(tabs)/talk.tsx`):**
   - AI companion prompt updated with `[[test:<id>]]` format for validated non-clinical instruments + safe screeners.
   - `extractTestChip` safely parses and sanitizes chips against an allow-list, stripping markup and displaying interactive test navigation buttons in chat.
5. **Theme Compatibility Cleanup:**
   - Removed temporary color aliases from `src/lib/theme.ts`.
   - Updated all callers to canonical theme tokens (`surface`, `ink`, `inkLight`, `rule`, `paper`, `crisis`).
   - Mood chart series updated to monochrome ink with dash array differentiation.
6. **Verification & Evidence:**
   - `npm test`: 65/65 tests passing.
   - `npx tsc --noEmit`: 0 errors.
   - `bash scripts/verify.sh`: PASS (all 12 project invariants verified).
   - Captured screenshots in `docs/screens/M04/`:
     - `tests-home.png` & `tests-home-dark.png`
     - `test-intro.png` & `test-intro-dark.png`
     - `test-question.png` & `test-question-dark.png`
     - `phq9-crisis.png` & `phq9-crisis-dark.png`
     - `asrs-result.png` & `asrs-result-dark.png`
     - `tests-about.png` & `tests-about-dark.png`
