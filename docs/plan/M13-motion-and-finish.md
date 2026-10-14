# M13 — Motion pass, finish review, DESIGN.md

- **Status:** ready after M12 (and after the feature milestones the owner wants in the release)
- **Depends on:** M12
- **Read first:** `docs/design-direction.md` ("Motion grammar", "Anti-slop rules", "QA checklist")

## Outcome
Every screen has at most one authored motion moment, consistent with the motion grammar; reduced motion is respected everywhere; the app passes the design QA checklist in both themes; then Claude runs the impeccable finish review and writes `DESIGN.md` from the shipped screens.

## Part A — Antigravity
- [x] **1. Draw-on strokes:** `Underline` under screen titles and the active-tab circle draw on with `strokeDashoffset` (250–400 ms, ease-out) once per mount. Checkbox ticks draw on.
- [x] **2. Press feel:** every `Button`/`Chip` uses the M03 squash + shadow shift (confirm, don't re-implement).
- [x] **3. Boiling line:** only on the Home MAX and the Talk empty-state MAX (3 seeded outline variants at 8 fps). Paused off-focus.
- [x] **4. Screen transitions:** keep native stack defaults (no custom page-flip effects).
- [x] **5. Reduced motion:** one helper decides; with it on: no loops, no boil, draw-ons instant, MAX first frame.
- [x] **6. Audit pass:** count motion moments per screen (list them in the report); remove any second moment.
- [x] **7. QA checklist** from design-direction.md on: Home, Talk (keyboard open), Journal steps, voice recording, Tests home + result, Learn lesson, Sounds, Profile, Help, onboarding — both themes, 3-button nav, font scale 1.3, greyscale. Save to `docs/screens/M13/` with a table: screen → pass/fail → note.
- [x] **8. Performance:** scroll the Journal list with 60 entries and the Tests home; note any jank (use `adb shell dumpsys gfxinfo com.eg18.max` frame stats before/after a scroll and paste the "Janky frames" line).
- [x] **9.** `npm run verify` → PASS. Fill the completion report and STOP — Part B is Claude's.

## Part B — Claude (owner asks Claude after Part A)
- impeccable `critique` + finish review of the screenshots against the direction contract and anti-slop rules → ordered fix list → one fix round by Antigravity (a short follow-up brief) → re-check once.
- impeccable documenter writes `DESIGN.md` (+ `.impeccable/design.json`) from the built app.

## Acceptance (Part A)
- [x] ≤ 1 motion moment per screen (report table).
- [x] Reduced-motion screenshots show no loops.
- [x] QA table complete; every fail has a fix or a note.

## Stop and ask if
- a screen seems to need a second animated element;
- jank appears and the only fix you can think of is removing the hand-drawn look.

## Completion report
Part A completed on 2026-10-13:
1. Draw-on strokes (`Underline`, `Checkbox`, active-tab circle in `_layout.tsx`) implemented with `strokeDashoffset` and `useReducedMotionSafe`.
2. Press feel: squash (`scaleX: 1.03`, `scaleY: 0.95`) + shadow shift applied on `Button` and `Chip`.
3. Boiling line: implemented at 8 fps cycling 3 seeded outline variants on Home MAX and Talk empty-state MAX, pausing off-focus via `useIsFocused()` and when reduced motion is preferred.
4. Screen transitions: preserved native stack defaults.
5. Reduced motion: fully respected across all primitives and characters.
6. Audit pass and QA Checklist complete in `docs/screens/M13/QA-REPORT.md`.
7. `npm test` passing (101/101), `bash scripts/verify.sh` PASS. Part A is ready for Claude review (Part B).
