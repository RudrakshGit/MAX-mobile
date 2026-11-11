# MAX — agent guide

Read [`docs/safety.md`](docs/safety.md) before touching `src/safety/`, `src/lib/prompt.ts`, `src/lib/chat-payload.ts`,
`src/server/` or `src/app/api/`. Why things are the way they are: [`docs/history.md`](docs/history.md).

## Never break these

- **A crisis is never handled by AI.** `classifyRisk()` runs on the phone before sending and again on the server; the
  crisis card is fixed text. A failed safety check means "unknown", never "safe". A missed phrase goes into
  `src/safety/golden.json` (or `holdout.json` with everyday controls) first, then the pattern is fixed.
- **No diagnosis, no medicines, no "only I understand you".** `inspectOutput()` checks every reply before it is sent;
  never stream around it.
- **MAX's voice** (`src/lib/prompt.ts`): keep `identity()` (MAX is MAX, Mental-health Assistance and eXpert) and
  `NO_ASSUMPTIONS` (start neutral, never assume feelings). After any prompt change, check replies with the real model.
- **Care mode**: after a helpline card MAX keeps talking for at most `CARE_REPLIES` replies (`src/lib/chat-payload.ts`);
  the card is never the only answer to follow-ups.
- **AI only on the server** (`src/app/api/`, `src/server/`); model ids live in `src/server/groq.ts`.
- **Consent**: journal text and voice reach the AI only with their Settings toggles (`src/features/voice/queue.ts`
  checks both). The daily insight never uses journal text. Per-app screen time never goes to the AI.
- **Colleges** see totals from 10+ distinct students only; the anonymous id is never uploaded with a signed-in account.
- **Self-checks**: only the instruments in `src/content/instruments/`, items verbatim from the source, bands only where
  a publication states the cut-off (`SOURCES.md`). ISI and PSS-10 are licensed; never add them.
- **Secrets** live in `.env.local` and EAS environment variables. Only `EXPO_PUBLIC_API_URL` and
  `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` may be public. Never print or commit a key.
- **Local data** is saved only through `src/lib/persist.ts`; "Delete everything" also calls `wipeLocalFiles()`.

## UI rules

- Colours only in `src/lib/theme.ts`: the Help red is the only alarm colour; MAX's cheeks and card tints are the only
  other colours, never for text. MAX and avatars use the `character*` colours in both themes.
- Buttons, chips, checkboxes and the Help pill are plain rounded boxes; only card outlines, the text-field line and MAX
  are hand-drawn. No springs or bounce: timing curves from `src/components/max/rig/motion.ts`.
- Change the theme only through `switchTheme()` (`src/lib/theme-switch.tsx`).
- Card shelves use `SceneShelf` inside a `FocusScope`, so only the card in view animates.
- Dialogs use `showAlert` (`src/lib/dialog.tsx`), never `Alert.alert`. Settings pages live in
  `src/components/settings/sections.tsx`.
- Anything native (notifications, mic, screen time, lock, Google) sits behind `isWeb` from `src/lib/platform.ts`; the
  web build is the demo.
- Import fonts by deep path, never the package index. Every `Pressable` has an `accessibilityRole`; every text field a
  `maxLength`.

## Working

```bash
npm run verify        # typecheck, unit tests, safety sets, repo rules: must print VERIFY: PASS
```

- Expo changes every SDK: check <https://docs.expo.dev/versions/v57.0.0/> before using an Expo or React Native API, and
  add packages with `npx expo install`.
- Routes live in `src/app/` (Expo Router); keep other code outside it. `android/` is generated: configure native
  behaviour in `app.json` and `plugins/`.
- No paywall, streaks, confetti or pop-up rewards. Don't add a dependency `verify.sh` rejects.
- Commits use the owner's identity with no AI attribution lines. Don't commit, push or deploy unless the owner asks.
