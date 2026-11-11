# M16: MAX's motion, MAX's world on cards, theme switch, a simpler app

Research, analysis and plan by Claude, 7 Nov 2026; the owner answered the open questions the same day (see "Owner's
answers"). Built by Claude, phase by phase (see "Build plan").

## What the owner asked (7 Nov 2026)
- MAX should move like a comic character: calm and logical, not bouncy. Fix every existing animation and add
  interaction where it makes sense.
- Rebuild the theme-change animation from scratch: it stutters and doesn't work properly.
- Replace the pencil-drawn people on tool, course and test cards with pictures of MAX in "MAX's world" that match
  each card, with a short animation inside the card. Subtle colour is allowed.
- Find where agent-built apps fall short of enterprise-grade, user-friendly UI/UX, compare MAX, fix it.
- Much less text: a stressed student or a child won't read it. Minimal, simple, picture-led.
- Give every tool and feature one sensible place, like industry-standard apps.

## How this was checked
- Read every MAX file (13 files, about 3,300 lines), the five tab screens, Settings and the root layout.
- On the emulator with the release APK 1.6.0: screen recordings turned into frame sheets (`adb shell screenrecord`
  + ffmpeg), frame timing (`dumpsys gfxinfo`), and the words on each tab's first screen (uiautomator). Emulator
  timings are relative; they need a check on a real low-end phone.
- Four web research passes: mascot animation craft and tooling; smooth theme switching; card illustration options
  and colour; where agent-built UIs fail, mental-health UX, and how wellbeing apps organise features. Sources are
  listed at the end.

## Findings

### 1. MAX's motion
| # | Problem | Evidence |
|---|---|---|
| 1 | MAX is one rigid picture. The arms and feet are part of the traced outline, so standing MAX can only bounce, tilt and squash as a whole. "Wave" never waves: it bobs and rocks. | `parts.tsx` `BODY_PATH` is one filled path; `Max.tsx` wave/greeting branches |
| 2 | All 26 springs overshoot and wobble. Damping ratios are 0.27–0.68, which means 10–37% overshoot and several swings. This is the "bouncy" look. | e.g. `Max.tsx` waking spring: damping 8, stiffness 220 → ratio 0.27 |
| 3 | Squash and stretch go up to 24–35% (scaleX 1.24–1.3, scaleY 0.74–0.65), scaled from the centre, so the feet leave the floor. | `Max.tsx` landed/jump/dizzy; `FloatingMax.tsx` jump |
| 4 | Tilts rotate around MAX's middle, not the feet, so MAX spins instead of leaning. | `Max.tsx` `animatedStyle` |
| 5 | MAX is never still: a bob that never stops, a whole-body jitter 8 times a second ("boil"), constant sways. There are no holds, and the jitter looks like stutter. | `Max.tsx` idle loop and boil transform |
| 6 | Blinks on a fixed 3.8 s JavaScript timer that re-renders the whole drawing. | `Max.tsx` blink `setInterval` |
| 7 | Comic marks (Zs, sparkles, hearts, thinking dots, notes) are still images that pop in and out. | `parts.tsx` |
| 8 | Jump cuts: the standing and walking bodies swap in one frame; after the deep breath MAX snaps into a smaller, flatter sleeping drawing with a different viewBox. | Home frame sheet, 34 s → 35 s |
| 9 | Behaviour feels random: MAX falls asleep after 10 s without a touch (even while the student reads), jumps on every screen visit, reacts to every touch anywhere in the app, gets dizzy and then angry when shaken, and the walk → tired → breath → sleep story starts only when the student taps "Show me less". | `useMaxInactivity.ts` (`SLEEP_MS` 10 s), `MaxBehaviorEngine.ts`, `_layout.tsx` touch capture, `(tabs)/index.tsx` |
| 10 | State bugs: some behaviours don't reset every value (a nudge after a pat keeps the tilt); dizzy re-renders the drawing every 60 ms. | `Max.tsx` nudge and dizzy branches |
| 11 | With MAX set to dark on a light phone, the app opens on a cream splash and then flips to dark. Android draws the splash from the phone's theme before the app runs. | start frame sheet 0.3–1.2 s; `app.json` splash `dark` follows the system |
| 12 | MAX walks in a hurry: 0.24 s per step (0.36 s when tired), with a 3.5% squash on every step. A calm walk is 0.6–0.7 s per step with no squash [A18]. | `Max.tsx` `WALK_CYCLE_MS` 480, `TIRED_WALK_CYCLE_MS` 720; walk squash in `animatedStyle` |

### 2. Theme switch
- A 2.5 s cinematic (lamp drops, MAX jumps and pulls the chain) for a settings toggle, blocking touches the whole time.
- Runs on a chain of JavaScript timers. The whole app re-renders at the exact moment the light starts to move, and a
  full-screen SVG mask is redrawn every frame.
- At the click the screen goes solid dark for a frame; MAX's pop-in overshoots to about twice its size.
- Emulator: 4 frames of 81–85 ms during the switch (a smooth frame is 16 ms).

### 3. Stutter elsewhere (likely causes; confirm on a real phone)
- First open of Learn took about 2.4 s from tap to screen, Tests about 2 s.
- Scrolling Settings: 26% janky frames, the slowest 5% over 129 ms.
- Every touch and finger movement anywhere in the app writes to a store that every MAX listens to
  (`_layout.tsx` → `recordGlobalTouch`/`setTouchPos`; `Max.tsx` reads `lastGlobalTouch` even when not interactive),
  so MAX re-renders while the student scrolls.
- The draw-on lines (active tab circle, checkbox tick, underline) use the old `Animated` API on the JavaScript thread.
- Home and Learn subscribe to the whole store (`useStore((s) => s)`), so any change re-renders the whole screen.
- Each card draws a rough.js frame plus a 20–30-path figure; a tab with 10+ cards does a lot of SVG work on first open.

### 4. Cards and pictures
- 15 people figures are reused across about 40 cards (the same meditating figure on breathing, sounds, the burnout
  test and the stress course), with thin lines that get lost in dark mode.
- Each card is a picture box inside a framed card (card in card), a capitalised category badge (SOMATIC, CBT,
  NEUROSCIENCE, BREAK LOOP), a duration badge, a two-line subtitle and a footer ("Practice tool ›").

### 5. Text
Words on each tab's first screen, before scrolling: Home 87, Learn 80, Tests 70, Tools 63, Profile 51, Journal 29.
Most sections also carry a one-line explanation under the title.

### 6. Where features live
| Feature | Where it is today |
|---|---|
| Sounds & music | Learn and Tools |
| Watch & read library | Learn and Tools |
| Mood history, reflections, patterns | Tools, Profile, and Home ("Noticed", "Today's reflection") |
| What to do now | Four blocks on Home: Daily plan, the step after the check-in, "Right now", "Today's reflection" |
| Settings | Home header, Learn, Profile |
| Helplines | the Help pill (every screen), Learn, Profile |
| College | Learn, Profile, Settings |
| Talk to MAX | not in the tab bar; only by tapping MAX |
| Tests | its own tab; results in Profile; "About these tests" in Tests and Profile |
| Screen time | Tools, Mood, Settings |

The floating MAX also covers cards on Learn, Tools and Tests.

### 7. Smaller things seen on the way
- Chat replies and the Home check-in summary are long paragraphs in the handwriting font (`T v="voice"` uses Kalam
  unless "Simple font" is on). The design direction says handwriting is never for paragraphs.
- The breathing screen opens with a citation and jargon ("Stanford protocol (Balban et al., 2023)", "parasympathetic
  brake"), and the layout jumps up when the exercise starts.
- Screens with a looping MAX never go idle: uiautomator reports "could not get idle state" on the breathing screen
  while the boil loop runs. Continuous redraws also cost battery.
- Talk opens with the tab bar showing no active tab, because Talk is a hidden tab.

### 8. Common failures of agent-built UIs, checked against MAX
From the UX research checklist (sources 1–13 at the end): **present in MAX** — cards inside cards, decorative
badges, walls of text, one feature reachable from many places, endless loops and long animations, JS-thread
animation stutter, nobody looking at the result in motion. **Mostly fine** — colours only in `theme.ts` (verify
enforces it), labelled tab icons, the Help pill in the same place on every screen, reduce-motion support, edge-to-edge
insets. **Not yet checked on a device** — 200% text size, TalkBack order on every screen, 48 dp targets everywhere,
loading/empty/error/offline states on every screen.

## What the research says

### Animation approach
- **Why MAX bounces.** Reanimated 4's default spring is critically damped (no overshoot) [A20]. The bounce comes from
  the hand-set springs listed in finding 2. A spring overshoots by 16% at a damping ratio of 0.5, 4.6% at 0.7 and
  0.15% at 0.9 [A19]. Material 3's spatial springs use 0.9 and its effect springs 1.0 [A23]; Apple's default bounce is
  0, and 30% already reads clearly bouncy [A24].
- **What calm but alive looks like.** One main action at a time, long low-amplitude cycles, eases without overshoot,
  irregular layered timing, actions with a reason, real holds. The cheap look is bouncy springs everywhere, constant
  bobbing, identical loops and a hop on every step [A1, A2, A13, A14].
- **Starting numbers** (animator references, partly the research's own synthesis):
  - blink: close 80 ms, shut 30 ms, open 160 ms; random gaps of 2–7 s with an occasional double blink; also blink when
    the gaze moves or a reaction starts, never on a fixed timer [A6–A8];
  - idle: one breath every 4–5 s, at most 2% scale with volume kept, limbs lagging 80–150 ms; an idle gesture every
    6–15 s from a pool with cooldowns, so the loop never repeats exactly (Duolingo blends 64+ idle variations) [A2, A13,
    A15];
  - looking: eyes jump in 60–100 ms, the head follows 100–200 ms later over 300–500 ms; hold a gaze at most 3 s [A9–A12];
  - reactions: start within 100 ms; anticipation 100–150 ms, action 300–500 ms, settle 300–600 ms, hold at least 1 s,
    return over 600–800 ms [A17];
  - walking: 0.6–0.7 s per step, bob at most 2% of height, no squash on each step [A18]. MAX now takes 0.24 s per
    step (0.36 s when tired), 2.5 times too fast, with a 3.5% squash on every step.
  - UI moves: Material's standard curve `(0.2, 0, 0, 1)` over 300–500 ms; springs at a damping ratio of 0.8–0.9 only
    for letting go of a drag, dangling props and one celebration hop [A21, A23].
- **Why it stutters on Android, and the fix.** react-native-svg throws away and redraws the whole drawing on the CPU
  whenever any animated SVG property changes [A31–A33]. Move whole-body motion to the wrapping view's transform (no
  redraw), and split MAX into small stacked drawings so a blink redraws only the eyes. Reanimated suggests at most about
  100 animated components on a low-end Android phone [A34].
- **Pose system.** Each pose is plain numbers; each body part blends between poses and adds layers on top (breath,
  blink, gaze, reaction), all from one clock (`useFrameCallback`) [A2, A36]. Updating idle values at 12 frames a second
  gives a hand-drawn "on twos" feel with about 5 times fewer redraws.
- **Other tools.** Rive (Duolingo's choice) needs a human animator in its editor; its new MCP server still edits a binary
  file the agent can't watch play, and exports from the free plan carry a splash [A37–A41]. Lottie is timeline playback
  and isn't meant to be hand-written [A42–A46]. Skia stays the fallback if profiling still shows redraw jank [A47, A48].
  Verdict: keep the code-drawn SVG character, restructured.
- **How an agent checks motion without watching video.** Motion as pure functions of time, with unit tests for the
  rules (overshoot ≤ 1%, no jumps between frames, blink 250–350 ms, minimum holds, loops that start and end on the same
  pose); Jest with fake timers and `toHaveAnimatedStyle` [A50, A51]; a dev-only screen that freezes the clock at any time
  so each pose can be screenshotted and tiled [A52]; emulator recordings as contact sheets [A53, A54]; a reduced-motion
  pass [A56–A59].
- **Interaction without nagging.** Respond to the student's attention, be easy to dismiss, behave politely (lessons
  from Clippy) [A62, A63]. Motion that starts by itself and runs longer than 5 s beside other content needs a way to
  pause it (WCAG 2.2.2) [A64]. Ideas that fit MAX: a look and a blink on the first tap, varied small reactions with
  cooldowns after that; a slow pet with a long press; eyes that follow the finger within limits; MAX looks away while
  the student types in the journal; a nod after the check-in; MAX writes in his own notebook while the student journals;
  sits still during focus; yawns at night; never guilt for skipped days [A64–A68].

### Theme switch
- Don't animate colours. Take a picture of the screen, switch the theme underneath it while it's hidden, wait until
  the new screen has painted, then animate only the picture's edge. Telegram does exactly this on Android: 400 ms,
  ease-in-out [T2].
- The cheapest way on Android is a small local Kotlin module (MAX already has one, `modules/usage-stats`):
  `PixelCopy` captures the window including the header [T3, T18], and `ViewAnimationUtils.createCircularReveal`
  animates the circle off the UI thread [T19]. No new npm package and almost no APK size.
- Rejected: the react-native-svg mask (redraws a full-screen bitmap on the CPU every frame on Android [T1]);
  Skia (blocked by `verify.sh`, about 20 MB more for our APK, snapshot bugs in the pinned version [T14–T17]);
  `react-native-theme-switch-animation` (last release Aug 2024, open bug under expo-router [T6, T7]);
  `react-native-view-shot` (encodes a PNG file, slow on Android [T10–T12]).
- Order: block repeat taps → reduce motion? switch instantly → capture and cover → change the theme → wait for React
  to commit plus 2 frames → reveal (≈420 ms) → remove the cover. Any failure or a wait over 1.5 s falls back to a
  150 ms fade [T6, T9, T33, T34].
- Status bar and navigation bar: their backgrounds are the app's own pixels (edge-to-edge), so they are inside the
  picture; only the icon colour flips, at the moment the circle passes the bar [T2, T25–T28].

### Card pictures
- Draw every scene in code from MAX's own parts plus a small kit of props. It is the only option that is free, stays
  in MAX's line style, works in both themes, animates part by part and has no licensing question [C1–C7].
- AI image tools: no tool keeps a simple line mascot consistent across a set; prompts alone don't give copyright in
  the US [C22]; India's position on AI-made works is unsettled [C24–C26]; raster pictures can't follow the dark theme
  or animate part by part [C27–C29]. At most useful for private sketches. `docs/design-direction.md` already rules out
  AI-generated poses.
- In-card animation: play once when a card is at least 60% visible for about 300 ms, 2–4 s, never looping (WCAG 2.2.2
  asks for a pause control above 5 s), at most 1–2 cards at a time, stop when the screen loses focus, and reduced
  motion shows the final still frame [C34–C41].
- Colour: colour plus icon plus picture helps people find a category faster in a busy screen; never colour alone
  [C42, C43]. Use light, low-saturation tints [C45]; desaturate on dark backgrounds [C49]. A rough check of the
  palette below gives 13.7–14.4:1 for ink on the light tints and 10.4–11.6:1 for chalk on the dark ones.

| Category | Light tint | Dark tint |
|---|---|---|
| Exams and stress | `#F8E7C4` | `#3A3222` |
| Sleep | `#E3E4F3` | `#262A3F` |
| Body and calm | `#DCEFE8` | `#1F3631` |
| Thoughts | `#ECE3F3` | `#312A3A` |
| Kindness | `#F7E1E1` | `#3B2829` |
| Focus and digital | `#DDEBF5` | `#22323D` |
| Support | `#F6E2D3` | `#3B2D24` |

### Text and attention
- Acute stress weakens working memory and task switching [U35]. People read about 20% of the words on a page [U19],
  and understand hard text on a phone much worse than on a desktop [U36].
- NHS writing targets: reading age 9–11, sentences of 20 words or fewer, paragraphs of 3 sentences or fewer [U37].
- No published words-per-screen standard exists. Working budget for MAX: one heading plus up to three short
  sentences, about 50 words on a first screen (the research's estimate from the NHS limits; unverified).
- Icons always with a visible label [U15]; detail behind "show more" [U39]; trauma-informed wording: optional detail,
  the student's own pace, plain privacy words [U41].
- Mental-health apps lose users fast: a median 3.9% are still active after 15 days [U44]. Personalisation, a sense of
  control and learning about yourself keep people [U45, U46].

### How leading wellbeing apps organise features
- 4–5 tabs. The first is Today/Home: a check-in plus 1–3 suggestions. One library tab holds tools, courses and
  content. AI chat gets its own tab when it is a headline feature (Headspace's Ebb, Wysa). Tracking either has its own
  tab or sits with the journal or profile [U47–U58].
- **None of the apps checked has a Tests tab.** Questionnaires sit inside a care plan, onboarding or the tools library
  [U47, U56, U58].
- Clinical apps keep a permanent, labelled crisis button (Wysa, Intellect), and WCAG 2.2 (3.2.6) asks that help sits
  in the same place on every screen [U22, U50, U56]. MAX's Help pill already does this.

## Decisions taken by Claude
The owner can overrule any of these.

### MAX's motion
1. Stay on react-native-svg + Reanimated 4.5, which the app already uses; animations run on the UI thread. No Rive,
   Lottie or Skia: Rive and Lottie need a human animator working in their editors, and Skia is blocked by `verify.sh`
   and adds about 20 MB.
2. Rebuild MAX as a rig: separate layers for the body, two arms, two feet, eyes with lids, brows, mouth and comic
   marks, each with its own pivot. One rig for standing, walking, sitting and lying down, so MAX moves between poses
   instead of swapping drawings. The traced outline is redrawn as clean parts in the same line weight (the walk pose
   already does this for the arms and feet).
3. Poses and short clips are data (pose to pose, with holds) played on the UI thread. A pure `sampleClip(clip, t)`
   makes every clip testable.
4. Motion rules, checked by unit tests, using the starting numbers above: timing curves instead of springs (springs
   only at 0.8–0.9 damping for letting go of a drag, dangling props and one celebration hop); squash and stretch at
   most 8%, keeping volume, always from the feet; anticipation before big moves, a hold after every action,
   follow-through on arms and comic marks; idle is slow breathing, random blinks and an occasional glance or gesture,
   with no bobbing or jitter; a calm walking pace (0.6–0.7 s per step); comic marks move (Zs drift up and fade,
   thinking dots appear one by one); reduce motion shows still poses with short cross-fades and no loops.
4a. Whole-body moves happen on the wrapping view; each moving part is its own small drawing; idle updates run at
   12 frames a second; everything pauses when the screen isn't in front.
4b. Settings gets "MAX moves: normal / calm / still" (calm settles almost still after 5 s), which also meets WCAG
   2.2.2.
5. MAX reacts to what the student does, not to every touch:
   - time of day: a stretch and wave on the first open of the day, yawns after 10 pm, asleep after midnight (a tap
     wakes MAX with a stretch);
   - after the check-in: MAX mirrors the mood gently (low → sits close with soft eyes; good → one small hop);
   - tap → looks at the student and smiles; a second tap → waves; long press → leans into the finger, eyes closed;
   - Talk: leans in while the student types, thinks (hand on chin, dots one by one) while waiting, mouth moves briefly
     when the reply arrives; Journal: looks away while the student writes (privacy), then nods; breathing tool:
     breathes along; focus session: sits still with a book; Help: hand on heart, a very slow sway; a finished course
     day: one small cheer.
6. Removed: anger (a shaken MAX gets dizzy, then shakes it off and smiles), falling asleep after 10 s, Home MAX's jump
   on every visit, and the whole-app touch tracking that re-renders every MAX. The floating MAX keeps its eyes following
   the finger, using touch-down only, on the UI thread, without re-rendering.
7. The Home story (walk → tired → deep breath → sleep), which the owner asked for, stays, but it starts at night or
   after the student has left Home untouched for a while, not on "Show me less". MAX lies down in the same rig, with
   no jump cut.

### Theme switch
8. A new local module `modules/theme-reveal` (Kotlin): `PixelCopy` + circular reveal, about 420 ms, from the point the
   student tapped. Switching to light, the new light spreads out from there; switching to dark, the old light shrinks
   back into it. A 150 ms fade if anything fails; instant with reduce motion.
9. MAX keeps a small part: Settings → Appearance gets a little lamp with MAX, who tugs the cord (about 250 ms) before
   the reveal starts from the lamp. No full-screen movie, no 2.5 s wait.
10. The app sets Android's own night mode to MAX's theme so the splash matches (to be confirmed on Android 12+). If
    that doesn't stick, the logo intro starts in the splash colour and fades into MAX's theme.

### Cards
11. Every card picture becomes a MAX scene drawn in code (the rig plus a prop kit): about 21 scenes for 5 tools,
    6 courses, 4 quick reads, 2 media cards and 4 test groups.
12. Each scene plays once (2–4 s) the first time its card is seen, then holds its final frame; at most 2 at a time;
    a still final frame with reduce motion.
13. Three pilot scenes (Exam stress, Sleep reset, Breathing) go to the owner for sign-off before the rest are drawn.

### Text and layout
14. A card is a picture, a title of at most 4 words and one detail ("1 min"). No category badges, subtitles or
    footers.
15. Section subtitles go. About 50 words on a first screen; sentences of 20 words or fewer in plain words (reading age
    9–11); longer explanations behind "More".
16. Chat replies and other paragraphs use the reading font (Atkinson). Handwriting stays for titles, labels and MAX's
    short balloon lines.
17. The breathing screen loses the citation and jargon, and its layout no longer jumps when it starts.

### Speed and quality
18. Remove the whole-app touch tracking; Home and Learn subscribe only to the fields they use; draw-on lines move to
    Reanimated; card scenes render lazily; every loop pauses off screen.
19. Every screen gets loading, empty, error and offline states, 48 dp touch targets, works at 200% text, and passes a
    TalkBack walk-through.
20. Proof of done for each step: emulator frame sheets, `gfxinfo` janky-frame numbers before and after, screenshots in
    light, dark, 200% text and reduce motion, and a final check on a real low-end phone by the owner.

## Owner's answers (7 Nov 2026)
1. **Tabs: four — Today · Explore · Talk · Journal.** Explore holds the tools, sounds and focus, courses, read & watch
   and the self-tests. Mood history and insights sit with the Journal. Profile and Settings open from the avatar. The
   Help pill stays on every screen in the same place.
2. **Floating MAX: keep it as it is** (draggable, tap opens Talk, shown on the tab screens). It still gets the new MAX
   rig and the calm motion rules, because every animation must stop bouncing; its own jump and landing are toned down
   to match.
3. **Colour: yes, subtle.** A soft tint per topic behind each picture plus one small accent (the palette above). Text
   stays ink; the Help red stays the only alarm colour. `AGENTS.md`, `docs/design-direction.md` and `verify.sh` are
   updated to say so.
4. **Dev server: allowed.** Claude may run Metro on this laptop (localhost only) while tuning animations.

Options that were offered: tabs A (Today · Tools · Talk · Journal · Learn, recommended) or C (keep today's tabs);
floating MAX removed (recommended) or a calmer still one; colour only inside pictures or none.

## Build plan
Each phase ends with its checks passing and a short note in the completion report at the end of this file. Nothing is
committed until the owner asks.

**Phase 0 — dev loop and baseline.** Build a development client (`npx expo run:android`), run Metro with
`adb reverse tcp:8081 tcp:8081`. Record baseline frame stats (`dumpsys gfxinfo`) for Home idle, a tab switch, scrolling
Settings and the theme switch, so every later change is measured against them.

**Phase 1 — MAX rig and motion system.**
- `src/components/max/rig/`: MAX redrawn as parts (body without the baked arms and feet, two arms, two feet, eyes with
  lids, brows, mouth shapes, comic marks), each a small Svg inside an `Animated.View` with its own pivot.
- `motion.ts` (durations, curves, limits), `poses.ts` and `clips.ts` (data), `sample.ts` (pure `sampleClip(clip, t)`),
  a director hook (state → clips; seeded random blinks, glances and idle gestures; one clock; pauses off screen).
- `<Max>` keeps its current props, so every screen keeps working while the inside changes.
- Tests: no overshoot beyond 1%, squash ≤ 8% from the feet, holds ≥ 400 ms, blinks 250–350 ms, loops start and end on
  the same pose, walk 0.6–0.7 s per step.
- MAX lab (developer builds only): pick a clip, scrub time, filmstrip at fixed steps, light/dark, reduce motion.

**Phase 2 — MAX everywhere.** Every place MAX appears (Home, Talk, Journal, new entry, Help, test intro, course day
done, sounds, onboarding, logo and peeking intros, the breathing tool, empty screens, the floating MAX) moves to the new
clips and the behaviour in decisions 5–7. Splash and logo intro made seamless. Settings: "MAX moves: normal / calm /
still". Checks: a frame sheet per place, frame stats, reduce-motion screenshots, TalkBack labels.

**Phase 3 — theme switch.** `modules/theme-reveal` (Kotlin: `cover()` with PixelCopy, `reveal(x, y, mode, ms)` with
the circular reveal, fade fallback) and its TypeScript wrapper; a commit signal from the root layout; bar icons flip as
the circle passes. The lamp-and-MAX row in Settings → Appearance. `ThemeSwitchBulbAnimation` and its host are deleted.
Checks: both directions recorded and stepped through frame by frame, double taps, backgrounding mid-switch, 3-button
navigation, memory after 20 switches.

**Phase 4 — colour and card scenes.** Tint tokens in `theme.ts`; `AGENTS.md`, `design-direction.md` and the colour
rule in `verify.sh` updated. A prop kit and a `Scene` component; three pilot scenes (Exam stress, Sleep reset,
Breathing) shown to the owner; then the other 18. Play once when first seen, still final frame, still with reduce
motion. Checks: every scene in light, dark and greyscale; frame stats while scrolling a list of cards.

**Phase 5 — tabs, text and states.** Tabs Today · Explore · Talk · Journal (Explore: Feel better now, Sounds & focus,
Courses, Read & watch, Check yourself; Journal: entries plus Mood); old routes redirect so reminders and links keep
working. Today keeps MAX, the check-in, one next step and the daily plan. Text cut to the rules in decisions 14–17.
Loading, empty, error and offline states; 48 dp targets; 200% text; TalkBack. Checks: words per first screen,
screenshots in every mode.

**Phase 6 — speed, docs, APK.** The speed fixes in decision 18, measured against the Phase 0 baseline; docs
(`design-direction.md`, `HANDOFF.md`, the audit file, this file's completion report); a new APK.

## Sources
The four research reports, with every link, are in
`Major_Project/research/research_notes/MAX motion cards and navigation/` (outside this repo): `animation.md` [A],
`theme-switch.md` [T], `card-illustrations-and-colour.md` [C] and `ux-failures-and-navigation.md` [U]. A reference
like [T19] means source 19 in `theme-switch.md`. The links were gathered by research agents and not re-checked one by
one.

## Completion report

### Phase 0 and 1 — 7 Nov 2026 (Claude)
- Dev loop: debug dev client built locally (`./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a`) and
  installed over the release app without losing data (same debug signing key); Metro on localhost with
  `adb reverse tcp:8081 tcp:8081`. `adb root` resets that reverse, so run it again after.
- New rig in `src/components/max/rig/`: `motion.ts` (curves, limits, blink/idle/look/walk numbers, seeded random),
  `pose.ts`, `clips.ts` (idle, sleep, sitDown, wakeUp, wave, hop, smallHop, nod, tapReact, lookLeft/Right/Around,
  yawn, think, listen, care, pet, drag, wall, land, dizzy, blink), `sample.ts`, `geometry.ts` (torso flanks so a raised
  arm leaves no gap), `useRigPlayer.ts`, `MaxRig.tsx`, `Marks.tsx` (moving Zs, sweat, dots, heart, sparkles, notes,
  stars). `Max.tsx` rewritten on top of it with the same props, so every screen keeps working. `MaxWalk.tsx` removed
  (its walk is now in the rig, at the calm pace). The old traced sleeping drawing is no longer used: MAX sits and
  dozes in the same rig.
- Behaviour: no anger (dizzy → idle), the floating MAX's tab hop is the calm `smallHop`, dozing off on its own only
  at night (after 60 s), behaviour timings match the clip lengths.
- Tests: `src/components/max/rig/clips.test.ts` (128 checks: no curve overshoot, squash ≤ 8% with volume kept, no
  keyframe overshoot, no frame jumps, loops close, actions hold ≥ 400 ms, blink 250–350 ms, walk 0.6–0.7 s per step,
  tap answer ≤ 100 ms, seeded blink gaps). The "no jumps" check caught a too-fast arm curve on the first run.
- MAX lab (`/dev/max`, developer builds only): play any clip live, a filmstrip of six frozen moments, one state at a
  time.
- **Speed finding.** On the debug build, Home with the new MAX used a full CPU core while idle (429 frames in 10 s,
  36% janky, median 48 ms; Settings without MAX: 3 frames). The ANR trace showed why: Reanimated applied every
  transform through a full shadow-tree commit, and react-native-svg sends a layout event from every SVG element
  whenever it redraws, which Reanimated handles on the main thread. Fix: Reanimated's
  `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` static flag (`package.json` → `reanimated.staticFeatureFlags`), which applies
  transforms and opacity straight to the views. Its known side effect (React Native's `Pressable` can miss taps on a
  transformed view) is handled by using gesture-handler's `Pressable` for MAX. That alone was not enough: on this
  emulator's debug build any 60 fps animation costs about 40 ms a frame (a plain scaling box measured the same as one
  SVG layer). The real fix was running slow loops (breathing, sways) **on twos**: `steppedEasing` changes the value 12
  times a second, and Android doesn't redraw a view whose transform didn't change. Home idle after that: median frame
  19 ms (was 44–48), 90th percentile 31 ms (was 85–97), app CPU 16% (was 70–103%), debug build. Lesson for the card
  scenes: keep each scene to one static drawing plus a few small moving parts, never a full rig per card. Release
  numbers on a real phone are still to be measured (Phase 6).

### MAX's shape, owner feedback (7 Nov 2026)
- Owner: the first rig "looked distorted"; keep the decided design (the design sheet, `assets/max/source/max_design.png`),
  cute and round, with proper body parts. Then: raised arms looked cut off and flat.
- Fixed: the arms are now plump round mittens like the design sheet's front view (`rig/geometry.ts` `ARM`); at rest only
  the outer edge, round bottom and a short inner line show, and the full outline fades in once an arm lifts (10°–25°),
  so a raised hand is whole and round. Feet are small charcoal ovals tucked under the body, no legs. The torso is the
  traced head with its own flanks and round bottom. MAX's cheeks are the design sheet's subtle pink (`characterBlush`
  in `theme.ts`; `AGENTS.md` colour rule updated for the owner's colour decision). Comparison:
  `docs/screens/M16-max-rig-vs-design-sheet.png`; lab filmstrips: `docs/screens/M16-max-lab-filmstrips.png`.
- Phase 2 so far: touch-down only for the floating MAX's gaze (`_layout.tsx`); the floating MAX's hop, landing and
  switch-off exit are calm (no shake, no spring); Home's story starts after 45 s untouched (10 s late at night), the
  thought balloon steps aside while MAX strolls and comes back when it is home, "Show me less" makes MAX nod, a tap
  on a sleeping MAX wakes it (stretch and yawn) and it walks back; both intros use timing curves instead of springs.
  Still to do in Phase 2: Talk (listen while typing, nod on reply), the journal look-away, the check-in reaction on
  Home, the "MAX moves" setting, and a seamless splash → logo.
- Checks: `npm test` 321/321, `tsc --noEmit` clean.

### Phase 2 and 3 — 7 Nov 2026 (Claude)
- Phase 2 done: Talk's header MAX leans in while the student types, thinks while waiting and nods when the reply
  arrives; after the check-in MAX hops (good day), nods (okay) or leans in with a heart (hard day, `comfort` clip);
  Settings → Appearance → "MAX moves: normal / calm / still" (`maxMotion` in the store; calm stops idle gestures and
  settles still after 5 s, still = no motion); the logo intro starts in the phone's splash colour and fades into MAX's
  theme. The journal look-away is not needed: the journal's writing step has no MAX beside the text field.
- Phase 3 done: `modules/theme-reveal` (Kotlin) — `cover()` (PixelCopy of the window), `reveal(x, y, "shrink",
  420)` (the old screen closes into the tapped point with `ViewAnimationUtils.createCircularReveal`, on the
  RenderThread), `clear()`. Opening the new theme out of the tap was tried and dropped: revealing the root view
  didn't clip, a UI-thread "hole" animation jumped while the app re-rendered, and drawing the new screen in software
  fails on React Native's hardware images. `src/lib/theme-switch.tsx` waits for the root layout's layout effect (the
  whole app has re-rendered) plus two frames, and holds the old bar icon colour until the circle passes.
  `ThemeSwitchBulbAnimation.tsx` deleted. Settings → Appearance has a small lamp beside MAX: picking a theme, MAX
  tugs the cord (`tug` clip) and the theme closes in on the lamp (`src/components/ThemeLamp.tsx`).
- Every navigator now uses `freezeOnBlur`, so screens out of view don't re-render on store changes or a theme switch.
- Measured on the emulator's debug build: picture 0.15–0.35 s, React re-render of the visible screen about 1.5 s (debug
  React; to be measured on a release build), reveal about 0.5 s. Frame sampling confirmed the circle closes toward
  the tap in both directions.

### Phase 4 — 7 Nov 2026 (Claude)
- Colour: `tint.*` in `theme.ts` (exam, sleep, calm, thoughts, kind, focus, support; light and dark) plus
  `characterBlush`. `AGENTS.md` and `docs/design-direction.md` say so; the `verify.sh` rule (hex colours only in
  `theme.ts`) still holds, so it needed no change.
- `src/components/scenes/`: `MaxFigure.tsx` (a still MAX built from the rig's own parts, in a pose), `scenes.tsx`
  (21 scenes: exam, sleep, breathe, ground, reframe, spiral, safety, toolkit, overthinking, getgoing, kind, alarm,
  waves, sigh, traps, sounds, library, wellness, growth, personality, phone) and `SceneArt.tsx` (`SceneArt`, and
  `SceneCard`: picture, a title with room for two lines, one detail). One or two small parts of a scene move once
  (appear, float, pulse or wiggle, 0.9–1.5 s, twice) the first time it shows in a session, then hold; still with
  reduce motion or "MAX moves: still".
- Every card picture is now a MAX scene: Explore's tool, course, lesson and self-check cards and the self-test
  catalogue (16 tests mapped to scenes). `src/ui/illustrations/` (the old pencil figures) is removed and nothing
  imports it; `assets/illustrations/` is empty; `assets/CREDITS.md` updated.
- Not as planned: the three pilot scenes (decision 13) were not shown first; after "continue karo aur kaam pura karo"
  all 21 were drawn at once. **Owner: please look through them** (`docs/screens/M16-release-screens.png`, or Explore
  and Check yourself in the app) and name any to redraw. "At most 2 moving at a time" (decision 12) is not a hard
  limit; the moves are short and staggered.
- Checks: light, dark and greyscale screenshots (in greyscale everything is still readable; nothing depends on the
  tints).

### Phase 5 — 7 Nov 2026 (Claude)
- Tabs Today · Explore · Talk · Journal (`(tabs)/_layout.tsx`). Explore (`(tabs)/explore.tsx`): Feel better now (5
  tools), your next lesson, Courses, Read, watch, listen (quick reads, Watch and read, Sounds and focus), Check
  yourself (categories). `/learn` and `/tools` redirect to `/explore`; the self-tests live at `/check-yourself`;
  `learnHref` and Profile → Tests taken point there; reminder links (`/`, `/sounds`, `/journal-new`) were already fine.
  Journal has "Your mood and patterns" → `/profile/mood`.
- Today: the check-in summary is four small pictures with a word each (Mood, Sleep, Phone, Stress) instead of a
  sentence, and the next step shows only its reason ("Study pressure is heavy today.") above the button: 34 words →
  14. A screen reader still hears the full sentence. "For you" no longer repeats the step the check-in card offers.
- Self-test cards: were a code badge, a minutes chip, the title, "9 questions · Validated scale" and a "Screening,
  not a diagnosis" footer; now `SceneCard` (picture, title, "2 min · 9 questions" or "Last: …"). The result screen
  and "About these tests" still say it's a screening, not a diagnosis. The featured test lost its cut-off first line.
- 200% text: Today and Explore checked; the check-in pictures switch to two columns at large text (a word broke in
  the middle before).
- Not done in M16: the loading / empty / error / offline sweep, the 48 dp touch-target audit and a TalkBack
  walk-through (decision 19). They need their own pass.

### Phase 6 — 7 Nov 2026 (Claude)
- Measured on the **release** build on the emulator, offline (airplane mode, so the production server wasn't
  contacted). Phase 0–1 numbers were from the debug build and aren't comparable.
  - Cold start to first frame: 2.2–2.9 s.
  - Home, MAX awake: 101 frames in 10 s, app CPU 18–29% of one core.
  - Home, MAX asleep: 205 frames in 10 s at about 32% CPU, because the comic marks (Zs) moved at 60 fps. Marks now
    move on twos like the loops (`Marks.tsx`, `twos()`): 83 frames at about 18%.
  - FrameMetrics show every full-screen frame on this emulator takes 40–100+ ms, almost all GPU and buffer swap
    (the emulator translates OpenGL to Metal), even for a small change. **The emulator can't show smoothness**; the
    numbers above are only relative.
- Theme switch, release build (step timings logged, then removed): MAX's tug 440 ms → picture of the screen
  0.2–0.4 s → React re-renders in the new theme 0.5–0.95 s → two frames ~0.4 s → circle 420 ms. The circle used to
  start while the new theme's first frames were still drawing (50–118 ms each), so a recording showed old → new in a
  single step. Fix in `ThemeRevealModule.kt`: wait for the first light frame (FrameMetrics, under 50 ms, after at
  least two frames, at most 600 ms), then start the circle. On the emulator it still shows only one or two in-between
  frames for the GPU reason above; tap to finished is about 3 s there. **Real-phone check needed.**
- Decision 18: whole-app touch tracking removed (Phase 2); no screen reads the whole store any more; every navigator
  freezes screens out of view and inactive tabs are detached, so they don't draw. Not done: moving the draw-on lines
  to Reanimated (short one-off 260–320 ms timings, low value for the risk).
- Found, not fixed (follow-ups):
  1. **Overdraw.** Android's overdraw view is red (4× or more) on every screen: the window background, the stack's
     content, the tab scene, `Screen` and the paper grain each paint the whole screen. Every animation frame pays
     for that, which matters on low-end phones. Fix with care for navigation transitions: drop the window background
     after start and let only `Screen` paint paper and grain.
  2. **Reanimated warnings.** "synchronouslyUpdateUIProps failed … Unable to find SurfaceMountingManager", each with a
     stack trace, in bursts of about 45 when an animated view is removed mid-animation (seen at the Home story's
     transitions; none while idle). It looks like a race between React Native removing the view and Reanimated's
     cleanup, under the `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` flag. Harmless, but it costs a little at those
     moments; check Reanimated's tracker before the next upgrade.
- Version: `app.json` 1.7.0 / 9. `android/` is generated and git-ignored, so `android/app/build.gradle` was set by hand
  to the same (`app.json` alone doesn't reach it without a prebuild).
- APK: `Major_Project/apk/max-phone-1.7.0.apk` (arm64, server `https://max-companion.expo.app`, 1.7.0 / 9, signed with
  the debug key like the earlier builds), SHA-256 `86989c1dcfd34276ab125b7972ac63d4ccb5d69ebc451598bcb0901b13446667`.
  No server change in M16, so nothing to redeploy.
- Checks: `npm test` 333/333, `tsc --noEmit` clean. Screens: `docs/screens/M16-release-screens.png` (Explore light,
  Check yourself, Today's check-in, Explore dark).
- Docs: `docs/design-direction.md` (colour rule, tokens, MAX's rig, card scenes, motion grammar, QA list),
  `HANDOFF.md` (M16 rules for Antigravity), `docs/plan/00-master-plan.md` (M16 row), `docs/README.md` (latest APK).
- **Owner, still to do:** install the APK on a real phone and check MAX's motion, the theme switch (both ways) and
  the card animations, ideally on a low-end phone too; look through the 21 scenes; nothing is committed yet.

### Follow-up: functions, speed, the walk story, number inputs — 7 Nov 2026 evening (Claude, owner asked)
- **Walk story (owner overrules decision 7):** "Show me less" now starts it, and the 45-second idle trigger is gone.
  MAX strolls away, turns, walks back slower, worn out, with a sweat drop; half-way it sits down, lets out one long
  breath, lies down on its side right there and sleeps, with Zs that stay upright. A tap on MAX (or "Thought") rolls
  it back up, it stretches and walks home. New rig clips `sit`, `lieDown`, `lieSleep`, `getUp` (pose `LIE`, all within
  the motion tests); `Max` takes `sitting` and `lying`; the director chains sit → lie → sleep and back.
- **Explore speed (release build, emulator, tap → first frame):** 4.6–5.3 s → 0.8–1.2 s. Causes found by logging: the
  page built all 21 cards (about 80 drawings) at once, every card outline drew in a second layout pass, and the
  floating MAX was rebuilt on every tab change (about 0.5 s on any tab). Fixes: `SceneShelf` (a lazy horizontal list),
  shelves below the first one built 0.3 s and 0.7 s later, card outlines sized ahead (`Frame size`), still card
  scenes drawn as one drawing, Explore reads only the three store fields it needs, and the floating MAX is built once
  and only hidden. Journal's first open went 1.1–1.5 s → about 0.95 s. Check yourself uses the same lazy shelves.
- **Numbers and times:** no more rows of buttons. A field shows the value ("9:15 pm ✎"); a tap opens a sheet with
  scroll wheels (`src/ui/sketch/Wheel.tsx`: `Wheel`, `TimeField`, `DateField`, `NumberField`) and Cancel / Done.
  Wheels never sit open on a scrolling page, because on the emulator a page scroll over an open wheel changed a value.
  Used for the check-in reminder and bedtime (Off/On plus a time), focus length and sleep timer (5–120 min), phone
  minutes in the check-in (0–60, saved exactly as `screenMin`), and exam dates (a year ahead, student and college).
  The earlier note from the owner about this couldn't be found in past chats, so this pattern is Claude's choice.
- **Flaws fixed** (a read-only audit by a helper agent, each checked before fixing):
  - App lock's "set a screen lock first" message was never shown.
  - A course day's "Save reflection" threw the text away; it now saves to Journal and can't save empty.
  - Editing a journal entry could delete its voice note before Save; files now go only on Save, and backing out cleans
    up new ones.
  - The journal wizard got a Back step on every step; the phone's back steps back, and leaving with unsaved words asks
    first.
  - Daily plan ticks only for the step actually done (talk, journal and lessons never ticked before), and opening a
    tool or course day no longer ticks it at once (20 s / 30 s, or marking it done).
  - Double taps: journal save, self-test answers and saving, New conversation, avatar save. New conversation reuses an
    empty chat instead of piling up blanks.
  - The safety plan won't save a half-filled contact.
  - "Delete everything" shows progress and says so if the college copy couldn't be removed offline.
  - Call buttons show the number if the phone can't dial.
  - Editing today's check-in can be cancelled.
  - A daily card's "Reframe a thought" opened the spiral tool.
  - Smaller fixes: onboarding Continue with an empty companion name, course day buttons no longer stack screens,
    sync errors are no longer in the alarm red, the breathing timer says "Finishing this breath…" instead of
    "0 seconds", video links fall back to the browser, "Talk about this" only on entries with words, and bigger tap
    areas (Thought pill, voice trash, entry edit/delete).
- The other audit lows and the overdraw were fixed the same evening (next section). Still open: the Reanimated
  warnings above.
- Checks: `npm test` 356/356 (the daily plan test was updated to the corrected rule, plus a new case), `tsc` clean,
  colour rule clean. On the emulator (release, offline): the story recorded end to end and the wake-up, the reminder
  field → sheet → Done round trip, the journal Back steps, the check-in edit with Cancel and the phone field.
- APK `Major_Project/apk/max-phone-1.7.1.apk` (1.7.1 / 10), SHA-256
  `b58d5a82fc63d31e3f350a1365e6aa2813a7a8f3c55c418de1527734ee411bf8`.

### Follow-up: audit lows, overdraw, permissions in onboarding — 7 Nov 2026 night (Claude, owner asked)
- **Overdraw** (Android's overdraw view, release build): every screen was 4× or more (red). The window background,
  the tab scene and `Screen` / `Page` each painted a full sheet of paper under the native stack's own. Now only the
  stack's `contentStyle` paints paper (plus the grain): `Screen`, `Page` and the tab scenes paint nothing, and
  `ThemeReveal.dropWindowBackground()` removes the window background 1.5 s after start. Screens are now 1× (paper +
  grain), cards 2×. Card scenes paint their tint inside the drawing (4× → 3×). Left as is: MAX's own box stays 4×+,
  because each rig part is its own SVG layer and Android draws each layer's full box. That is what lets MAX move on
  the GPU without redrawing, and the box is small.
- **Accessibility:** every `Pressable` has a role (Talk back/conversations, Transcribe, course day rows with "Day N:
  title, done", Tele-MANAS links with the number read out, the peeking MAX). `Chip` takes `role`: radio with
  `checked` (one of a set), checkbox (journal feelings and influences, Hindi filter) or button (Talk's action chips);
  the library topics and mood ranges are radios. Modal backdrops (dialog, wheel sheet, MAX quick actions) are
  siblings of the sheet, so a screen reader reads the sheet's own words instead of one "Close" button.
- **Text limits:** journal 5000, reframe and spiral tools 1000 / 200, safety plan 1000, searches 80, music link 500,
  profile name 30.
- **Large text:** chip labels can take two lines, and filled rows (mood, sleep, stress) wrap instead of squeezing
  when the font is above 130% (at 200% the words broke inside the chips).
- **Mood calendar:** day cells are a full seventh of the row (about 44 dp, were 36), with the same layout for the
  last week (the old `space-between` spread a short last row). At exactly 100/7 % the seventh day wrapped, so 14.28 %.
- **Smaller fixes:** a stray tap on "College staff" in onboarding no longer makes the app open the college dashboard
  next time (only a staff sign-in does); `/campus` ("How my college is doing") is reachable from Settings → Share with
  my college and has Try again on errors; saying no to the microphone no longer shows Android's prompt a second time.
- **Permissions in onboarding (owner):** a new step 4 of 5, "What MAX can use", after the consent and before the
  backup (`src/components/OnboardingPermissions.tsx`). Notifications (allowing it turns on the 9 pm evening
  reminder, the same as saying yes on Today), microphone (voice notes) and usage access (phone use; opens Android's
  screen and re-checks on return). Each shows Allowed, or "Not allowed" with a link to Android settings. All optional;
  every feature still asks when used. No prompt needed for app lock (the phone's screen lock) or songs (file picker).
- Checks: `npm test` 356/356, `tsc` clean. On the emulator (release, offline): overdraw before/after on Today, Explore
  and Settings; the dialog stays open on a tap inside and closes on the backdrop; the time sheet wheel scrolls and a
  backdrop tap keeps the old time; the calendar for November 2026 starts on Sunday; a fresh install through all five
  onboarding steps, notifications allowed and the microphone refused; the check-in at 200% text.
- APK `Major_Project/apk/max-phone-1.7.2.apk` (1.7.2 / 11), SHA-256 `1c9b7057b067542e67dbf5df3199d07f0dedbad63d33a038deff5724f7287649`.

### Follow-up: MAX keeps talking after a helpline card, plain buttons, distinct read scenes — 11 Nov 2026 (Claude, owner asked)
- **Chat bug (owner's screenshots):** after one message showed the helpline card, every later message showed it again
  and MAX never answered ("ye manas kaun hai, mujhe toh max chahiye", "are baat karo na"). Cause: the server scores risk
  on the last three user messages together, so the message that triggered the card counted again on each follow-up;
  the card was also sent to the model as nothing, so it didn't know helplines were shown.
  Fix, kept small:
  - The phone sends the card as a note ("I showed the student free helplines…") and `afterCrisis` while a card is in
    the last 10 messages (`src/lib/chat-payload.ts`, tested).
  - In that window the server scores only the latest message (the phone and server regex still check it first). A new
    crisis message ("i have pills and will take them tonight") still gets the card.
  - Otherwise MAX answers in care mode (`systemPrompt(..., afterCrisis)`): stays warm, explains Tele-MANAS if asked,
    asks once whether they're safe, urges 14416 / 112 if they might act on it, no CBT challenges. These replies are
    kind `care`: "Call Tele-MANAS · 14416" and "Talk to a person" sit under each one.
  - The card itself now comes with one line from MAX: still here, keep talking, and please reach a person too.
  - Language: short Hinglish replies ("haan safe hu, bas bura laga") were answered in English; more Hinglish words
    (tested). A stray "(End)" a model added is stripped. MAX no longer opens every reply with "Lagta hai".
  - Checked end to end by calling the chat route with the real model (local script, the key from `.env.local` never
    printed): the owner's conversation, a continued crisis, crisis then calmer, an idiom ("exam is killing me"),
    normal Hinglish, an off-topic ask and a greeting.
  - **Needs a production deploy** (server) and the new APK (phone): either alone keeps the old behaviour.
- **Plain buttons (owner):** `Button`, `Chip`, `Checkbox` and the Help pill are plain rounded boxes (radius 12, like
  the time field): primary filled ink, danger filled red, secondary outline, quiet a plain underlined text, disabled an
  outline with faint text. Library tabs and topics and self-test answers too. Card outlines, the text-field line and
  MAX stay hand-drawn. Chip labels stay on one line and shrink a little in tight rows (the wider font broke "poorl/y").
- **Read, watch, listen:** "Your phone and your sleep" and "Loops that pull you back" had no scene and showed the
  library picture, like "Watch and read". New scenes `phoneSleep` (MAX up in bed at night, lit by the phone) and
  `loops` (a dizzy MAX by a phone caught in a round arrow).
- Checks: `npm test` 359/359, `tsc` clean. Emulator (release, offline): Today, Explore's read shelf, Talk (offline
  chips, the crisis card with MAX's line), library, a self-test.
- APK `Major_Project/apk/max-phone-1.8.0.apk` (1.8.0 / 12), SHA-256 `b788a7f7bf412ce37286133a2aa86b05a2065e81fcd2c71cc44c940243c9f02d`.

### Follow-up: college dashboard out of the app, simpler Settings — 11 Nov 2026 (Claude, owner asked)
- **College:** the staff side left the app (dashboard, registration, staff settings, admin review, "For college
  staff" in Profile, the staff links in onboarding, `staffMode`) and so did `/campus`. Archived outside the repo in
  `Major_Project/archive/college-dashboard-app-2026-11-11/`; the server routes stay for the planned web dashboard
  (see the note at the top of M15).
  - Settings → **Share stats with college**: one line on what's shared, a College ID field (required, 8 letters and
    numbers) and Share. Sharing shows the college's name and Stop sharing, which also deletes what was shared. The
    year-of-study choice and the two-step confirm were dropped.
  - Onboarding step 2 takes an optional **College ID**: checked on Continue (a wrong ID says so and stays; offline
    lets set-up go on and points to Settings), joined when set-up finishes.
- **Settings:** shorter texts on every section; "Connection" (server name and Test connection) removed; On always
  before Off; the long reminder and data notes cut to one line each.
- Checks: `npm test` 359/359, `tsc` clean. Emulator (release, offline, fresh install): onboarding with a too-short ID
  and with a valid-looking ID offline, the trimmed Settings. A real join needs the server (not tried, production).
- APK `Major_Project/apk/max-phone-1.8.1.apk` (1.8.1 / 13), SHA-256 `4d71bca579e1eb1b1214acf6f73f873635019fecdb9882b14f4f183045f97eda`.

### Follow-up: cards play when in view, Settings pages, ink theme switch, cut-out avatars — 11 Nov 2026 (Claude, owner asked)
- **Cards play only when in view** (owner: "like YouTube"): `src/components/scenes/focus.tsx`. When the page stops
  scrolling, the shelf most on screen becomes active (measured once per settle, never per frame); inside it the first
  fully visible card plays its moves once (2–4 s) and rests. Leaving the tab stops everything; coming back plays the
  card in view again. Explore and Check yourself use it. Checked on the emulator by diffing screenshots: on open only
  the first tool card changes; after scrolling, only the first course card.
- **Settings is a menu** (`app/profile/settings/index.tsx`) with one page per topic (`[section].tsx`, bodies in
  `components/settings/sections.tsx`): Backup, companion, AI features, Reminders, Appearance, Privacy & lock,
  Share stats with college, Your data. The menu shows each one's state. Links that pointed into the old page go to
  the right section (wind-down → Reminders, voice-to-text → AI features).
- **Theme switch as ink** (owner: it stuck on the phone; "ink spreading on paper"):
  - Why it stuck: the old switch covered the screen with a picture and moved nothing until the app had finished
    re-rendering in the new theme (about a second on a phone), then ran the circle.
  - Now (`modules/theme-reveal`, `lib/theme-switch.tsx`): the picture covers the screen and ink in the new paper
    colour starts spreading from the tap at once, while the app re-renders underneath. The ink is a blot with a
    wavy edge and droplets, grown by scaling, plus a second turned blot; then the cover fades (220 ms) and the new
    screen shows through.
  - Research: circular reveal runs on the RenderThread ([Android docs](https://developer.android.com/reference/kotlin/android/view/ViewAnimationUtils)),
    but ViewPropertyAnimator's RenderThread path is switched off in Android (b/15287046), so scaling runs on the UI
    thread. A RenderThread circle grows under the blot and times the switch, so the page is covered on time even if
    the UI thread stalls. AGSL shaders were left out: Android 13+ only, and costlier on a view
    ([AGSL guide](https://developer.android.com/develop/ui/views/graphics/agsl/using-agsl)).
  - Overlapping circles alone were tried first and looked like one round edge when large.
  - The emulator draws only one or two frames of it, so **smoothness needs the owner's phone**.
- **Avatars** keep their light-theme ink and paper in dark mode, like MAX (a cut-out).
- Checks: `npm test` 359/359, `tsc` clean. Emulator (release, offline): Settings menu and Appearance page, both
  switch directions recorded, card focus.
- APK `Major_Project/apk/max-phone-1.8.2.apk` (1.8.2 / 14), SHA-256 `f4b4f9e13c6a401de3e85080304dd9e092dd4e18bb3283c4d0f1de2bc3cf8000`.

### Follow-up: MAX on the web ("Try now") and the server deploy — 11 Nov 2026 (Claude, owner asked)
- **The app runs on the web** (`npx expo export --platform web`, served by the same EAS Hosting deployment as the
  API at https://max-companion.expo.app). It was a blank page before: expo-notifications threw on the web.
  `src/lib/platform.ts` (`isWeb`, `DOWNLOAD_URL`, `WEB_CHATS_PER_DAY`, `THIS_DEVICE`) guards everything native.
  - Web limits (owner: "limits rakhenge"):
    - Left out: reminders, Google backup, college sharing, app lock, screen time, voice notes, the floating MAX,
      backup export/import and the onboarding permissions step.
    - 20 chat messages a day. A crisis message always gets the helplines first.
    - Data stays in the browser. Settings has a "Get the MAX app" row.
  - Web fixes found on the way: tab scenes keep their paper on the web (inactive tabs stay in the page there);
    Enter sends a message; the keyboard-avoiding view is off on the web; the paper grain is clipped to its screen
    (it made Talk scroll and hide its header); fitted titles wrap instead of being cut off; a phone-width column on
    wide windows; same-origin API calls on the web.
- **CORS for the website's college dashboard** (`src/server/cors.ts`) on the college and auth routes. EAS Hosting
  replaces the browser's Origin header with its own host (seen in a debug preview), so origins can't be checked;
  the routes allow any origin, which is safe because they take only bearer tokens.
- **Deployed to production** (owner: "deploy karke dikhana"), after testing preview deployments: the web app, CORS
  and the chat care-mode fix. Checked on production: CORS preflight 204, a follow-up after a helpline card gets a
  care reply explaining Tele-MANAS, the web app opens and chats.
- The college staff screens are on the website now (`../M.A.X--Major-Project`, see its HANDOFF.md).

### Follow-up: chat care mode, MAX's identity, no assumptions, AI journal checks — 11 Nov 2026 night (Claude, owner asked)
- **Care mode ends** (owner's phone: after "Yes I feel safe" every reply still pushed helplines). `src/lib/chat-payload.ts`:
  care mode lasts at most two replies after a helpline card, ends at once when the student says they're safe
  ("I feel safe", "safe hu", "mazak tha"; "safe nahi hu" doesn't count), and doesn't come back for that card. The
  server scores only what the student said after the last card (`userTextsAfterCard`), so an old message can't bring
  the card back; a new crisis message still gets one. Tested (9 cases) and with the real model.
- **MAX is MAX** (owner): the prompt says MAX is the companion itself, short for "Mental-health Assistance and
  eXpert", answers to a renamed name, says who made it and what powers it only when asked (`identity()` in
  `src/lib/prompt.ts`, used by chat and journal reflections).
- **No assumptions** (owner: "blah" got "you seem sad"): MAX starts neutral, matches the student's tone, names a
  feeling only as a question, treats a fact ("kal exam hai") as a fact, never makes up facts or app features, and
  uses the check-in context only when the student brings up the same thing. Gender-neutral Hinglish, no "raha/rahi".
  Chat starters always include "Just want to chat" and "Something good happened today". Checked with the real model:
  "blah", "meh", "bored", "lol", good news, with and without a low-mood week in the context; identity, maker,
  "are you ChatGPT", a jailbreak, medicines, diagnosis, an off-topic question, a feature question.
- **Journal AI** (real model, and in the app on the emulator): tags in 0.3–2 s (the phone now waits up to 6 s, was
  2.5 s, so tags were often skipped); influence meanings added, so "roommate se jhagda" is tagged hostel, not friends;
  reflections in the student's script (a Devanagari sentence in a Latin reply is dropped) and with "tum".
  Voice to text: English, Hindi and Hinglish clips through the real route, shown in romanised Hinglish. On the
  emulator the microphone gets no sound (the host's mic isn't shared), so "Didn't catch that" was the path seen there;
  a real recording needs the owner's phone.
- **Daily reflection**: one check-in was called "a pattern of rising tension"; with 1–2 check-ins it now says
  "today" and a check rejects trend words; causes only from the student's own tags; rejections are logged.
- Smaller: typing indicator in Talk is a spinner (the animated MAX there logged ~35 Reanimated warnings per message,
  now ~16 from the header MAX); the breathing Stop is centred; "Talk it through with {name}"; a shared hourly cap of 20
  on public college applications (the per-IP limit is per server instance).
- Checks: `npm test` 366/366, `tsc` clean. Server deployed to production. APK `Major_Project/apk/max-phone-1.8.4.apk`
  (1.8.4 / 16), SHA-256 `09882031eba90ae26409a1a7f8fcc97529418c0085a7e6e2a06d11820d6144fa`, also on the website's download page.
