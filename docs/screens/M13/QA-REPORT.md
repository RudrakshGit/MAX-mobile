# M13 Motion & Finish — QA report (rewritten 14 Oct 2026)

The first version of this file marked every row PASS without evidence (7 screenshots existed, none for dark/light pairs, font scale, greyscale or reduced motion). It was replaced after the audit in `docs/audit/2026-10-14-findings.md`. This version only lists what was **actually checked** and says plainly what was not.

## Checked on the Android emulator (dev build, 3-button navigation)

| Check | Result | Notes |
|---|---|---|
| Light and dark themes | pass | Home, Learn, Journal, Tests, Settings, Profile, tools and onboarding looked right in both. Help pill is red in both. |
| Font scale 1.3 | pass | Tab bar, test options, journal cards and Home stay readable; no clipped text found on Home, Journal, Tests, a WHO-5 question. |
| Paper grain | pass (after fix) | Was one rectangular patch on Android (`resizeMode="repeat"` ignored); now one stretched pre-tiled image. |
| Help reachable | pass (after fix) | Tab screens have the pill in the page header, pushed screens in the native header (not on the Help screen itself). |
| Crisis flows | pass (after fix) | Talk (Hinglish message) shows the crisis card; saving a journal entry with crisis wording shows MAX (care) + the crisis card; list shows a "free help" line. |
| Theme-switch animation | checked in frames | Lamp drops, MAX pops up, flip happens under a fading veil; the header changes at the same moment. Frames were captured about every 0.6 s, so the leap itself was not seen frame by frame. |
| Walking MAX (Home → "Show me less") | checked in frames | Awake with happy eyes and whistle notes; no more closed-eye sleeping walk. |
| Performance, dev build, Profile screen idle (before → after the boil/walk-phase change) | measured | Janky frames 46 % → 1.5 %, p50 48 → 17 ms, p90 109 → 23 ms, CPU 102–173 % → ~31 %. |
| Performance, **release build** (arm64 emulator with software rendering, not a real phone) | measured | Screen idle with MAX asleep: 0 frames drawn, CPU 1.6 %. Floating MAX awake (bobbing): ~35 frames/s at about 35 ms each on this emulator. Scrolling the Tests list up and down 4×: 331 frames, 12.7 % janky, p50 40 ms, p90 65 ms. The Tests screen draws one hand-drawn SVG frame per card; **check on a real mid-range phone before judging**. |

## Not checked yet (do not treat as passed)

- Greyscale view, contrast measurements (the contrast numbers from the first report were calculated, not measured on screens).
- Reduced-motion screenshots (the code path exists: `useReducedMotionSafe`; the theme switch now skips straight to the new theme).
- Gesture-navigation phones, small (320 dp) screens, Android 12 and below.
- "At most one motion moment per screen": MAX can still appear twice on the Home screen while the daily thought is open (hero MAX + floating MAX is hidden on Home, so this is OK there), and on Learn/Journal/Tests the floating MAX is the only loop. The earlier table is not evidence.
- Scrolling a journal list with 60 entries.

## Motion rules in force

- Boil (hand-drawn wobble) is a 3-pose, 8 fps jitter computed on the UI thread; no JS timer redraws the SVG, and a sleeping MAX does not boil, so a still screen draws no frames.
- Floating MAX is hidden on onboarding, test/tool/lesson screens, settings, help, sounds, new journal entry, chats.
- A walking or whistling MAX is never shown asleep.
- Reduced motion: no loops, no boil, theme changes instantly.
