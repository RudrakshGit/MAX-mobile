# MAX v2 Implementation Plan

> **For agentic workers (Antigravity):** read `HANDOFF.md` at the repo root first. Work on ONE milestone brief at a time (`docs/plan/Mxx-*.md`), in order. Steps use checkbox (`- [ ]`) syntax; tick them as you go. Finish every milestone with `npm run verify` and the completion report at the bottom of its brief.

**Goal:** Turn MAX into a Serene-style, hand-drawn black-and-white companion app (Daily Plan, courses, AI + voice journal, 15 tests, profile, sounds, optional Google sync) without weakening its crisis safety.

**Architecture:** Expo SDK 57 Android app, local-first state (one versioned JSON envelope, `src/lib/schema.ts`), Expo Router API routes on EAS Hosting relaying to Groq and Neon. Pure logic lives in small tested modules; screens stay thin. A hand-drawn component kit (`src/ui/sketch/`) replaces the current UI kit.

**Tech Stack:** Expo 57 / RN 0.86 / TypeScript, expo-router, react-native-svg + reanimated 4.5.1, roughjs, Groq (gpt-oss-120b, gpt-oss-20b, safeguard, qwen3.8-27b, whisper-large-v3), Neon Postgres, Google Sign-In, Node's built-in test runner.

**Spec:** `docs/v2-features.md` (features + technical decisions), `docs/design-direction.md` (visual world), `docs/courses-plan.md` (Learn), `PRODUCT.md` (product truth), `docs/safety.md` (safety contract).

## Global Constraints

- Expo SDK 57; install every Expo/RN package with `npx expo install <pkg>` (never `npm install` for those).
- Exact versions for new packages: expo-dev-client ~57.0.19 · expo-audio ~57.0.5 · expo-file-system ~57.0.7 · expo-sharing ~57.0.22 · expo-document-picker ~57.0.3 · expo-secure-store ~57.0.4 · expo-web-browser ~57.0.3 · @react-native-google-signin/google-signin 16.1.5 · jose 6.2.12 · roughjs 4.6.6 · @expo-google-fonts/kalam 0.4.1 · @expo-google-fonts/atkinson-hyperlegible-next 0.4.1.
- Never add: Skia, Rive, Lottie, react-native-webview, any Spotify SDK, confetti, payment SDKs (`npm run verify` fails on them).
- Free services only. No paywall, premium, gifts, confetti, congratulation pop-ups, streak counters, artificial waits.
- Colours only in `src/lib/theme.ts`; the only non-grey colour is `help` (crisis red).
- Fonts: Kalam (display/labels/MAX voice), Atkinson Hyperlegible Next (body, chat, inputs, consent, crisis). Deep imports only (`@expo-google-fonts/kalam/700Bold`).
- AI calls only from `src/app/api/*` or `src/server/*`; model ids exactly as in `docs/v2-features.md` §4.1.
- A crisis never reaches an AI reply; `src/safety/golden.json` never shrinks; the crisis card text is fixed.
- Psychometric item text is never written from memory (see milestone M04's prerequisite).
- Every copied third-party file gets a line in `THIRD-PARTY.md`; every shipped asset a line in `assets/CREDITS.md`.
- Never commit, push or deploy. Never touch anything outside `max-app/` except reading `../research/` and `../reference-repos/copyable/`. Never copy code from `../reference-repos/reference-only/`.

## Review Focus

Failure modes the spec implies that the per-task tests could miss, most likely first. Each has a test in the owning milestone.

1. **Old data on a new build:** a v2 envelope (single `messages` list, entries without feelings) must open in v3 without loss → M02 `schema.test.ts` migration cases.
2. **Groq 429 / timeout mid-chat:** the reply model or the read call fails → chat still answers (qwen) or shows the offline message; risk becomes `unknown`, never `none` → M01 `risk.test.ts`.
3. **Two phones, one account:** both edited offline → `mergeStates` keeps both sides' entries and never pushes an empty state after "Delete everything" → M11 `sync.test.ts`.
4. **Hinglish voice note:** Whisper returns Devanagari; romanisation drifts or fails → raw transcript shown, entry never lost → M06 `transcript.test.ts`.
5. **No data yet:** a brand-new user opens Home, Insights, Your course, Profile → sensible empty states, no NaN, no crash → M07/M08 tests with an empty state.

## Milestones

| # | Milestone | Depends on | Size | Owner |
|---|---|---|---|---|
| M00 | Ground rules, dev build, emulator loop | — | S | Antigravity |
| M01 | Chat safety rework: two-call pattern, fallback, fix safeguard bug | M00 | M | Antigravity |
| M02 | Schema v3 + migration, export/import, multi-chat | M01 | M | Antigravity |
| M03 | Hand-drawn design kit (tokens, fonts, sketch primitives, icons, dark mode) | M02 | L | Antigravity |
| M04a | **Prepare verbatim instrument content (15 tests)** | — | M | **Claude** (before M04) |
| M04 | New navigation + Tests library | M03, M04a | L | Antigravity |
| M05 | Journal v2 (text): steps, chips, AI tags, reflection | M04 | M | Antigravity |
| M06 | Voice journal | M05 | M | Antigravity |
| M07 | Home (Daily Plan, Today's card, Personal Insight) + Profile | M06 | L | Antigravity |
| M08 | Learn: courses engine, Your course, Watch & read, tools hub | M07 | L | Antigravity (+ human content review) |
| M09 | Sounds & music | M08 | M | Antigravity |
| M10 | Phone use by category | M07 | S | Antigravity |
| M11 | Google login + sync + account deletion | M02, M10 | L | Antigravity (+ owner console steps) |
| M12 | MAX character + avatars + illustrations | M03 | M | Antigravity (+ owner drawing) |
| M13 | Motion pass + finish review + DESIGN.md | M12 | M | Antigravity, then Claude review |
| M14 | Release build | all | S | Antigravity + owner |

Claude reviews every completed milestone against the working tree before the next brief is started (the owner pastes the completion report back).

## Owner steps (cannot be automated)

| When | Step |
|---|---|
| before M04 | ask Claude to run M04a |
| during M08 | find the course reviewer (counsellor / psychology faculty); review drafted lessons |
| before M11 | Google Cloud: Web + Android OAuth clients (SHA-1 from `cd android && ./gradlew signingReport`), consent screen "In production"; Neon project → `DATABASE_URL` into `.env.local` and EAS env (sensitive) |
| before M12 | confirm MAX.png's origin; draw the new MAX poses (Inkscape/Krita) from the traced parts |
| before M14 | Groq console: enable Zero Data Retention; EAS env has `GROQ_API_KEY`, `DATABASE_URL`, `GOOGLE_WEB_CLIENT_ID` |

## File map (new or heavily changed)

```
src/
  safety/risk.ts            decideRisk helpers (M01)
  server/groq.ts            one place for Groq calls, model ids, fallback (M01)
  lib/schema.ts             v3 types + migration (M02)
  lib/sync.ts               mergeStates + sync engine (M11)
  lib/plan.ts               dailyPlan (M07)
  lib/course.ts             yourCourse (M08)
  lib/music.ts              musicNeeds (M09)
  lib/appCategory.ts        categoriseApp (M10)
  ui/sketch/                sketch.ts (path cache) + Frame, Button, Chip, Checkbox, Field, Underline, Divider, Balloon, HelpPill (M03)
  ui/icons/                 doodle icons as TSX (M03)
  components/max/Max.tsx    the character (M12)
  content/instruments/*.ts  15 tests (M04a)
  content/feelings.ts       20 feelings + 14 influences (M05)
  content/cards.ts          Today's cards (M07)
  content/courses/*.ts      courses (M08)
  content/resources.ts      Watch & read (M08)
  content/music.ts          playlists + sounds (M09)
  app/(tabs)/               index (Home), learn, talk, journal, tests (M04)
  app/profile/              profile screens (M07)
  app/api/                  chat, tag, transcribe, insight, auth/*, sync, account, delete-account (M01–M11)
assets/max/, assets/avatars/, assets/illustrations/, assets/sounds/
```
