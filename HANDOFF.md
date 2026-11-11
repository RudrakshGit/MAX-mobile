# Handoff — read this first (Antigravity)

You are implementing MAX v2 from written briefs. Claude (planner/reviewer) wrote the plan; the owner (Rudraksh) decides. You do the building. Think while you build: the plan can be wrong, and catching that is part of your job.

## Claude is working in the same folder right now (Nov 2026)
**M16 is done (7 Nov 2026, Claude, owner asked): read `docs/plan/M16-motion-cards-ia.md` before touching MAX, any
animation, cards, tabs or the theme switch.** Keep these rules:
- No springs or bounce anywhere: timing curves from `src/components/max/rig/motion.ts`; overshoot ≤ 1%, squash ≤ 8%
  from the feet, a hold after every action. Slow loops and comic marks move on twos (`steppedEasing`, `twos()`).
- MAX is the rig in `src/components/max/rig/` (poses and clips are data; `clips.test.ts` checks the rules; the lab is
  `/dev/max`). `<Max>` keeps its props. `MaxWalk.tsx`, the traced sleeping drawing and `ThemeSwitchBulbAnimation` are
  gone.
- Card pictures are MAX scenes (`src/components/scenes/`, `SceneArt`, `SceneCard`: picture, title, one detail).
  `src/ui/illustrations/` (the old pencil-drawn figures) was removed. Avatars are unchanged.
- Colours only in `src/lib/theme.ts`: the help red (only alarm colour), MAX's cheeks (`characterBlush`) and the card
  tints (`tint.*`), never for text.
- Tabs: Today · Explore · Talk · Journal. `/learn` and `/tools` redirect to `/explore`; self-tests live at
  `/check-yourself`.
- Change the theme only through `switchTheme()` (`src/lib/theme-switch.tsx` + `modules/theme-reveal`: ink spreads
  from the tap at once, the app re-renders under it).
- Scene cards animate only when in view: shelves use `SceneShelf id=…` inside a `FocusScope` (`scenes/focus.tsx`).
- Settings pages live in `src/components/settings/sections.tsx`; the menu is `app/profile/settings/index.tsx`.
- Avatars, like MAX, use the `character*` colours in both themes.
- Numbers, times and dates use `TimeField` / `DateField` / `NumberField` from `src/ui/sketch/Wheel.tsx` (a field that
  opens a sheet with wheels), never a row of buttons and never a wheel open on a scrolling page.
- Long rows of cards use `SceneShelf` (lazy). Don't subscribe a screen to the whole store (`useStore((s) => s)`);
  pick the fields. The floating MAX stays mounted and is only hidden.
- Home's walk story starts from "Show me less" (owner); MAX sits, sighs, lies down and sleeps (`sitting`, `lying`).
- Overdraw: the native stack's `contentStyle` is the only paper under a screen. `Screen`, `Page` and the tab scenes
  paint no background, and the window background is dropped after start. Don't add a full-screen
  `backgroundColor: t.paper` to a screen.
- Buttons, chips, checkboxes and the Help pill are plain rounded boxes (owner, 11 Nov 2026); only card outlines, the
  text-field line and MAX are hand-drawn. Don't bring sketch paths back onto anything tappable.
- The college staff dashboard is not in the app any more (owner, 11 Nov 2026); it will be a web dashboard on the
  MAX website. The app only has Settings → "Share stats with college" and an optional College ID in onboarding.
- The app also runs on the web ("Try now", served with the API on EAS Hosting). Anything native goes behind
  `isWeb` from `src/lib/platform.ts`; deploy with `npx expo export --platform web` then `eas deploy --prod`.
- MAX's prompt (`src/lib/prompt.ts`): MAX is MAX (Mental-health Assistance and eXpert), starts neutral and never
  assumes feelings; keep `identity()` and `NO_ASSUMPTIONS` when editing it, and re-run real-model checks.
- Chat: after a helpline card, MAX keeps talking in care mode (`afterCrisis`, `src/lib/chat-payload.ts`); never make
  the card the only answer to follow-ups again.
- `Chip` takes `role`: `radio` (one of a set, the default), `checkbox` (multi-pick or on/off) or `button` (an
  action). Every `Pressable` has an `accessibilityRole`; every free-text field has a `maxLength`. A modal's dim
  backdrop is a sibling of its sheet (`StyleSheet.absoluteFill`), never a `Pressable` wrapped around it.
- Onboarding asks for the permissions features use (notifications, microphone, usage access) in
  `src/components/OnboardingPermissions.tsx`, all optional; each feature still asks when it's used.

Claude is building M11 (Google backup), reminders and personalisation in these files: `src/lib/{cloud,sync,personal,reminders,reminder-plan,my-music}.ts`, `src/server/*`, `src/app/api/*`, `src/app/profile/{account,exams}.tsx`, `src/features/account/*`, `src/components/{HelpedPrompt,ReminderOffer,CollegeShare}.tsx`, `src/lib/college.ts`, `src/server/college*.ts`. Please don't rename, move or delete them; if one breaks your build, tell the owner instead. MAX's own files (`src/components/max/*`) are yours.

*(History, superseded by M16 on 7 Nov 2026: the walk, breathing and Zs now live in the rig; `MaxWalk.tsx` and `ThemeSwitchBulbAnimation` no longer exist.)* **4 Nov 2026, Claude reviewed the walk on the emulator (owner asked) and changed:** feet move back at a constant speed on the ground and Home moves MAX at `walkSpeed(size, cycle)` from `MaxWalk.tsx` (before, the feet slid: they pushed back at ~62 dp/s while MAX moved at 35); solid charcoal feet like the standing pose (the grey sole line made them look faded); side lobes moved out and down (`LOBE_SHIFT`) so they no longer sit on the cheek; whistle notes and sleep Zs moved off the head line; sweat drop is an outlined drop beside the head (it was a solid blot on the outline); `TIRED_WALK_CYCLE_MS` exported from `Max.tsx`. `WalkingMaxCorridor.tsx` was unused and has been removed (4 Nov cleanup; it's in the Trash if needed). Later the same day (owner asked): `Max` takes `breath` (a 0–1 shared value) and `breathPhase` to breathe along (body fills upward, eyes closed, "o" mouth and air on the out-breath; used by the breathing tool and the deep breath before sleep on Home); `ThemeSwitchBulbAnimation` dims the room and the light now shrinks into / spreads out of the bulb instead of a grey fade.

## Read order
1. This file.
2. `AGENTS.md` (invariants that break the product if violated).
3. `docs/plan/00-master-plan.md` (milestones, global constraints, review focus).
4. The **one** milestone brief you are working on (`docs/plan/Mxx-*.md`) and only the docs it lists under "Read first".

## How to work
- **One milestone at a time, in order.** Don't start the next brief until the owner says the current one is reviewed.
- **Tests before code** for every pure function (the briefs give the test code). Run the test, see it fail, implement, see it pass.
- **Check APIs, don't remember them.** Expo ships breaking changes every SDK. Before using an Expo/RN API, read the SDK 57 docs page for it (`https://docs.expo.dev/versions/v57.0.0/`). Install Expo packages only with `npx expo install`.
- **Small, real verification.** Run the exact commands in the brief and paste their real output and exit codes. Never write "tests pass" without the output.
- **Screens:** check on the Android emulator (`docs/dev-loop.md`), both light and dark, 3-button navigation, keyboard open on input screens. Save the screenshots the brief asks for.
- **Finish every milestone with** `npm run verify` → `VERIFY: PASS`, then fill the brief's "Completion report" section.

## Absolute rules
1. Never commit, push, deploy, publish or delete branches. The owner does that.
2. Work only inside `max-app/`. You may read `../research/` and `../reference-repos/copyable/`. Never copy code from `../reference-repos/reference-only/`. Never touch anything under `/Users/Work/Dev/DevOps/`.
3. Never print, log or commit secrets (`.env.local`, Groq/Neon keys, session tokens). Never put a secret in an `EXPO_PUBLIC_` variable.
4. Never weaken safety: don't edit `src/safety/classifier.ts`, `golden.json`, `guard.ts` or the crisis card text unless a brief explicitly says so; never let an AI reply through when risk is crisis; a failed safety check is "unknown", never "safe".
5. Never write psychometric questionnaire items or scoring from memory (Claude prepares `src/content/instruments/`).
6. Never swap a library, model id, or architecture decision for "a better one" on your own. Never add a dependency the brief doesn't list. `npm run verify` blocks the rejected ones.
7. Never edit `scripts/verify.sh` to make a check pass.
8. No paywall, premium, gifts, confetti, congratulation pop-ups, streak counters or artificial waiting. No colour except the `help` red.

## Use your own judgement — and say so
Follow the brief, but don't follow it blindly. While working, watch for:
- a step that would break something already working;
- a test in the brief that contradicts the brief's own rules;
- an API that doesn't exist or behaves differently in SDK 57;
- a simpler way to reach the same outcome;
- a missing case (empty data, offline, 3-button nav, dark mode, Hinglish input).

## When to stop and ask
Stop and ask **before** changing course when:
- you find a bug or a contradiction in the plan or brief;
- you want to change a decision (library, model, data shape, file layout, wording of safety text, thresholds);
- a brief's "Stop and ask if" condition happens;
- a fix would touch files the brief lists under "Do not touch";
- you are about to do anything irreversible or outward-facing.

How to ask: write the question under **"Questions for Claude / the owner"** at the end of the brief's completion report, with (1) what you found, (2) the evidence (file:line, command output, screenshot), (3) the options you see and which you'd pick and why. Then stop that part of the work. You may keep working on parts of the milestone that don't depend on the answer — say which ones.

Small, obviously-correct fixes inside your milestone's own files (a typo, a missing import, a wrong path in the brief) don't need a question: fix them and list them under "Deviations from the brief".

## Completion report (append to the brief)
```markdown
## Completion report
- Status: done | partly done | blocked
- What changed (files): …
- Commands run (paste real output, including `npm run verify`): …
- Screenshots: docs/screens/Mxx/…
- Deviations from the brief (and why): …
- Things I noticed that are outside this milestone: …
- Questions for Claude / the owner: …
```

## Copy-paste prompt for the owner
> Read `HANDOFF.md`, then work on `docs/plan/M00-ground-rules.md` only. Follow the rules in HANDOFF.md. When done, fill in the completion report in that brief and stop.

(Change `M00-ground-rules.md` to the next milestone each time.)
