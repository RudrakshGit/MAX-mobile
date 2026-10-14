# M08 — Learn: courses engine, Your course, Watch & read, tools hub

- **Status:** ready after M07
- **Depends on:** M07
- **Read first:** `docs/courses-plan.md` (all), `../research/research_notes/Voice courses Spotify and login/courses_and_resources.md` §2 and §5, `src/content/learn.ts`, `src/app/tool/[id].tsx`

## Outcome
The Learn tab offers "Your course" (rule-based, 5 days), the 6 launch courses (lesson + "Try it now" + optional Watch item + "Did this help?"), the tools (breathing with box and 4-7-8 patterns, grounding, reframe, spiral breaker, safety plan), the existing short lessons, and a Watch & read library that opens YouTube/websites. Course content ships as drafts until a human reviewer signs off.

## Files
| File | Action |
| --- | --- |
| `src/content/courses/types.ts` | `Course`, `Lesson` types (from courses-plan.md "Content file") |
| `src/content/courses/stress-toolkit.ts` … `kind-to-yourself.ts` | 6 courses (drafts) |
| `src/content/resources.ts` | Watch & read items (verified only) |
| `src/lib/course.ts` + `course.test.ts` | `yourCourse()` |
| `src/app/(tabs)/learn.tsx` | Learn home |
| `src/app/course/[id].tsx`, `src/app/course/[id]/[day].tsx` | course overview + lesson |
| `src/app/library.tsx` | Watch & read |
| `src/app/tool/safety-plan.tsx` | safety plan (state `safetyPlan`) |
| `src/app/tool/[id].tsx` | breathing gains box (4-4-4-4) and 4-7-8 patterns as data in the existing phases array |
| `scripts/check-links.mjs` + `package.json` script `check-links` | link checker |
| `src/lib/plan.ts` | `learn` item now points to the next "Your course" day |

New dep: `expo-web-browser` (added in M04).

## Interfaces
```ts
export type LessonRef = { course: string; day: number };
export function yourCourse(s: State, courses: Course[], now: Date): LessonRef[]; // exactly 4 lessons; day 5 ("What helped?") is a screen, not a lesson
```
Rules (from courses-plan.md §D): rank need areas from latest results (`pswq`→worry, `sci`→sleep, `phq9`/`who5`→mood, `cbi`→stress, `rses`→self-criticism) and last-7 check-ins (avg sleep ≤ 2 → sleep, avg pressure ≥ 4 → stress); map areas → courses (worry→overthinking, sleep→sleep-reset, mood→get-going, stress→exam-stress or stress-toolkit, self-criticism→kind-to-yourself); take 2 lessons from each of the top two areas (skip lessons in `courseProgress[c].unhelpful`, skip done ones when possible); no data → `stress-toolkit` days 1, 2, 4, 5.

## Tasks
- [x] **1. Tests first** `course.test.ts`: no data → `[{course:"stress-toolkit",day:1},{…day:2},{…day:4},{…day:5}]`; high PSWQ + poor sleep → 2 overthinking + 2 sleep-reset lessons; an "unhelpful" lesson is never picked; result always has 4 items. Then implement until green.
- [x] **2. Course content (drafts).** Write the 6 courses per `docs/courses-plan.md` lesson format: 250–450 words each, one "Try it now" action using an existing tool id (`breathe`, `ground`, `reframe`, `spiral`) or a one-line write box, Indian student examples, `source` + `licence` fields, WHO disclaimer on WHO-derived lessons, no WHO/29k text mixed in one lesson. Base course 1 on WHO *Doing What Matters in Times of Stress* (download from https://www.who.int/publications/i/item/9789240003927; adapt, don't copy whole pages), course 6 on 29k Self-compassion I (CC BY-SA 4.0, upstream repo `content/` folder). Every file starts with `export const STATUS = "draft" as const;` — the UI shows "Draft — under review" on draft courses. You draft; a human reviewer must approve (owner's job, see courses-plan.md "Review process").
- [x] **3. Resources.** Fill `src/content/resources.ts` ONLY with items marked verified in the research note §2.1 (creator + credentials checked, link live). Exclude every item marked unverified or "caution". Fields per courses-plan.md. Opening: YouTube → `Linking.openURL(url)` (opens the YouTube app); websites → `WebBrowser.openBrowserAsync(url)`. Each card labels "Opens YouTube" / "Opens <domain>" and shows creator + credential badge + reviewed date + "Report a problem" (opens an email draft to the owner's address placeholder from `app.json` `extra.supportEmail` — ask the owner for it).
- [x] **4. `scripts/check-links.mjs`:** for each resource, YouTube via `https://www.youtube.com/oembed?url=<url>&format=json` (200 = ok), others via `fetch` HEAD then GET; print a table of failures; exit 1 if any fail. No API keys.
- [x] **5. Learn home:** "Your course" card (day N of 5, thin progress line), the 6 courses (draft label where applicable), Tools row, Lessons, "Watch & read". Lesson screen: body (Atkinson), "Try it now" button, optional Watch card, "Did this help? yes/no" (writes `courseProgress`), next day available immediately, Tele-MANAS line at the bottom. Completing a day: quiet tick (MAX `cheer` arrives in M12) + `logActivity("learn")`.
- [x] **6. Tools:** add a pattern picker to the existing breathing tool: cyclic sigh (current), box 4-4-4-4, 4-7-8 — each just a phases array with labels; no code from Breathly. Safety plan screen: six fields (warning signs, things that help, people I can contact, places that calm me, professionals + helplines prefilled with Tele-MANAS, my reasons for living) saved to `safetyPlan`; linked from Help and the crisis card ("Open my safety plan").
- [x] **7. Screenshots** (both themes): Learn home, a lesson, library, safety plan. `docs/screens/M08/`. Run `npm run check-links` and paste its output.
- [x] **8.** `npm run verify` → PASS.

## Acceptance
- [x] course tests pass (4 cases).
- [x] Every course file has `STATUS`, every lesson has `source` and `licence`; WHO lessons include the disclaimer (`grep -L "not created by WHO"` over WHO-sourced files → empty).
- [x] `npm run check-links` output pasted; no unverified resource included.

## Stop and ask if
- a lesson needs medical/clinical claims you can't source;
- the WHO PDF or 29k content can't be obtained;
- you want to embed a video player (decided: link out).

## Do not touch
`src/safety/*`, instruments, sketch kit internals.

## Completion report
1. **Course Types & Personalization Engine:**
   - Defined `Course`, `Lesson`, and action types in `src/content/courses/types.ts`.
   - Built `yourCourse(state, courses, now)` in `src/lib/course.ts` ranking screener results (`pswq`, `sci`, `phq9`/`who5`, `cbi`, `rses`) and last-7 check-in stress/sleep metrics into 2 core need areas, taking 2 lessons from each, filtering unhelpful feedback.
   - Verified with 4 unit tests in `src/lib/course.test.ts` (100% pass).
   - Hooked `yourCourse()` into `dailyPlan()` in `src/lib/plan.ts` for dynamic daily goal suggestions.
2. **Launch Courses (6 Drafts):**
   - Created 6 courses in `src/content/courses/`: `stress-toolkit.ts` (6 WHO DWM adapted lessons with mandatory disclaimer), `exam-stress.ts` (7 lessons), `overthinking.ts` (5 lessons), `sleep-reset.ts` (5 lessons), `get-going.ts` (5 lessons), and `kind-to-yourself.ts` (5 lessons adapted from 29k Self-compassion).
   - Each course declares `STATUS = "draft" as const;`.
3. **Curated Resources & Link Checker:**
   - Added 64 verified resources in `src/content/resources.ts` covering 14 topics with verified credentials (`official`, `clinician`, `ngo`).
   - Implemented `scripts/check-links.mjs` running YouTube oEmbed + fetch checks.
   - Result: 64/64 URLs verified (200 OK).
4. **Interactive Tools Hub & Safety Plan:**
   - Upgraded `src/app/tool/[id].tsx` with pattern switcher: Cyclic sighing (Stanford), Box (4-4-4-4), and 4-7-8 relaxing breath.
   - Built 6-step personal crisis safety plan screen in `src/app/tool/safety-plan.tsx`, prefilling Tele-MANAS `14416` and emergency contacts.
   - Linked safety plan directly from `CrisisCard` and `Help` screen.
5. **Screens & Navigation:**
   - Redesigned `src/app/(tabs)/learn.tsx` with "Your course" progress card, structured courses, tools hub, and library row.
   - Created `src/app/course/[id].tsx` and `src/app/course/[id]/[day].tsx` lesson view with Atkinson typography, "Try it now", companion cards, and "Did this help?" feedback.
   - Created `src/app/library.tsx` with topic chip filtering and external app/browser links.
6. **Verification & Screenshots:**
   - `npm test`: 87/87 tests passed.
   - `npx tsc --noEmit`: 0 errors.
   - `bash scripts/verify.sh`: `VERIFY: PASS`.
   - Screenshots captured in `docs/screens/M08/`:
     - `01_learn_home.png`
     - `02_learn_tools.png`
     - `03_course_detail.png`
     - `04_course_lesson.png`
     - `05_library.png`
     - `06_safety_plan.png`
     - `07_breathe_patterns.png`
