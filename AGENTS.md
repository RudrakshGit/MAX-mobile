# MAX — agent guide

Antigravity: start with `HANDOFF.md`. Then the milestone brief in `docs/plan/`. Read `docs/safety.md` before touching `src/safety/`, `src/lib/prompt.ts`, `src/server/` or `src/app/api/`.

## Invariants: these break the product if violated

- A crisis is never handled by AI. The deterministic classifier runs on the phone before sending and again on the server; the crisis card is fixed text. A failed safety check means "unknown", never "safe".
- No diagnosis, no medication talk, no "only I understand you". `inspectOutput()` checks every reply before it is sent; never stream around it.
- AI calls happen only on the server (`src/app/api/`, `src/server/`). Model ids live in `src/server/groq.ts`.
- Journal text and voice go to the AI only when the student has consented (Settings toggles); the daily insight never uses journal text; screen-time per app never goes to the AI.
- Campus aggregates only, minimum 10 distinct students; the anonymous campus id is never uploaded with a signed-in account.
- Only the 15 verified instruments in `docs/v2-features.md` §5 ship; their items come verbatim from the source (Claude-maintained `src/content/instruments/`). ISI and PSS-10 are licensed; never add them.
- Colours live only in `src/lib/theme.ts`; the only non-grey colour is the crisis `help` red. Import fonts and icons by deep path, never the package index.
- Secrets live in `.env.local` (dev) and EAS environment variables (deploy). Only `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` may be public.
- A missed crisis phrase goes into `src/safety/golden.json` first, then the pattern is fixed.

## Verify

```bash
npm run verify
```

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
