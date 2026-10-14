# Handoff — read this first (Antigravity)

You are implementing MAX v2 from written briefs. Claude (planner/reviewer) wrote the plan; the owner (Rudraksh) decides. You do the building. Think while you build: the plan can be wrong, and catching that is part of your job.

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
