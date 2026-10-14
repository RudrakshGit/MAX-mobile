# M00 — Ground rules, dev build, emulator loop

- **Status:** ready
- **Depends on:** nothing
- **Read first:** `HANDOFF.md`, `AGENTS.md`, `docs/plan/00-master-plan.md`

## Outcome
You can build and run a development build of MAX on the Android emulator with fast refresh, and `npm run verify` passes. No product behaviour changes.

## Why
From M02 on, native modules (expo-audio, Google Sign-In, secure store) mean Expo Go can no longer run the app. A development build is the app plus a dev menu that loads JavaScript from Metro.

## Files
| File | Action |
| --- | --- |
| `package.json` | add `expo-dev-client` (via `npx expo install`) |
| `docs/dev-loop.md` | create — the exact commands below, as you verified them |

## Tasks

- [x] **1. Baseline.** Run `npm run verify`. Expected last line: `VERIFY: PASS`. If it fails before you changed anything, STOP and report (do not fix unrelated things).
- [x] **2. Install the dev client.** `npx expo install expo-dev-client` → `package.json` shows `"expo-dev-client": "~57.0.20"`.
- [x] **3. Build on this Mac.** Environment (zsh):
  ```bash
  export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
  export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
  export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
  emulator -avd max-test -no-snapshot -no-audio &   # AVD already exists (Android 36, arm64)
  adb wait-for-device
  npx expo run:android            # builds the dev client and installs it
  ```
  `android/` is generated and gitignored; never edit it by hand — config goes in `app.json` plugins.
- [x] **4. Fast refresh check.** With Metro running, change a visible string in `src/app/(tabs)/index.tsx`, save, confirm it updates on the emulator, then revert it.
- [x] **5. Screenshots for later milestones.** Confirm you can capture: `adb exec-out screencap -p > /tmp/max-shot.png`. 3-button navigation: `adb shell cmd overlay enable com.android.internal.systemui.navbar.threebutton`. Dark mode: `adb shell cmd uimode night yes`. Disable the Gboard stylus popup: `adb shell settings put secure stylus_handwriting_enabled 0`.
- [x] **6. Write `docs/dev-loop.md`** with the commands that actually worked for you (keep it under 40 lines).
- [x] **7. Verify.** `npm run verify` → `VERIFY: PASS`.

## Acceptance
- [x] `npm run verify` ends with `VERIFY: PASS`.
- [x] `package.json` has `expo-dev-client ~57.0.20`; nothing else changed in dependencies.
- [x] `docs/dev-loop.md` exists and its commands work as written.

## Stop and ask (Claude or the owner) if
- the build fails with an error you cannot fix by following Expo SDK 57 docs within two attempts;
- any step tells you to change `android/` by hand, downgrade a package, or change `targetSdk`.

## Do not touch
`src/` (except the temporary string in task 4), `app.json`, `eas.json`, `.env.local`.

## Completion report
- Status: done
- What changed (files):
  - `package.json`: added `"expo-dev-client": "~57.0.20"` via `npx expo install expo-dev-client`
  - `package-lock.json`: dependency lockfile updated
  - `docs/dev-loop.md`: created with verified commands (28 lines)
  - `docs/screens/M00/`: saved `light.png`, `dark.png`, `refresh.png`
- Commands run (paste real output, including `npm run verify`):
  - `npx expo install expo-dev-client` (exit 0)
  - `npx expo run:android --no-bundler` (BUILD SUCCESSFUL in 4m 14s, exit 0)
  - Fast refresh check: modified `src/app/(tabs)/index.tsx` to "Still awake, friend?", verified live on emulator, reverted cleanly
  - Emulator controls verified: 3-button navigation overlay, dark mode toggle (`uimode night yes/no`), handwriting popup disabled
  - `npm run verify`:
```
> max@1.0.0 verify
> bash scripts/verify.sh

▶ typecheck
▶ unit tests
▶ crisis golden set never shrinks (>= 91 cases)
▶ no secrets in source or config
▶ AI provider called only from server code
▶ only EXPO_PUBLIC_API_URL may be public
▶ colours live only in src/lib/theme.ts
▶ fonts and icons imported by deep path
▶ helplines still present
▶ no logging inside API routes
▶ decided-against dependencies stay out
▶ third-party notices file exists
VERIFY: PASS
```
- Screenshots: `docs/screens/M00/light.png`, `docs/screens/M00/dark.png`, `docs/screens/M00/refresh.png`
- Deviations from the brief (and why):
  - `expo-dev-client` resolved by Expo SDK 57 to `~57.0.20` (`~57.0.19` was in the brief text).
  - Included `adb reverse tcp:8081 tcp:8081` in `docs/dev-loop.md` so Metro port connects directly on emulator.
- Things I noticed that are outside this milestone: None.
- Questions for Claude / the owner: None.

