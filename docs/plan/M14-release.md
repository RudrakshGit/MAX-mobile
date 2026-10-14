# M14 — Release build

- **Status:** after the milestones chosen for the release
- **Depends on:** all chosen milestones; owner has EAS env vars set
- **Read first:** `docs/setup.md`, `docs/dev-loop.md`

## Outcome
A tested v2 APK pair (arm64 + armv7) built against the deployed server, docs updated, and a QA record. Deploying the server is the **owner's** action (Antigravity prepares and asks).

## Tasks
- [ ] **1. Version:** `app.json` `version` → `2.0.0`, `android.versionCode` → `3`.
- [ ] **2. Docs:** update `README.md` (features), `docs/architecture.md` (new modules, sync, sketch kit), `docs/safety.md` (two-call pattern, read failure = unknown), `docs/setup.md` (dev build, Google Cloud, Neon, check-links). Keep them short and true to the code.
- [ ] **3. Pre-flight:** `npm run verify` → PASS; `npm run check-links` → pass or every failure marked hidden.
- [ ] **4. Server deploy — ASK THE OWNER FIRST.** Show the owner these commands; run only after a clear "yes":
  ```bash
  eas env:list --environment production          # must list GROQ_API_KEY, DATABASE_URL, GOOGLE_WEB_CLIENT_ID
  npx expo export --platform web
  eas deploy --prod --environment production
  curl -s -X POST https://max-companion.expo.app/api/chat -H 'content-type: application/json' -d '{"messages":[{"role":"user","text":"hi"}]}'
  curl -s https://max-companion.expo.app/api/delete-account | head -5
  ```
- [ ] **5. APKs** (local build; commands in `docs/setup.md` §5 Option B) with `EXPO_PUBLIC_API_URL=https://max-companion.expo.app` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<owner's web client id>`, one per architecture, copied to `../apk/MAX-2.0.0-arm64.apk` and `../apk/MAX-2.0.0-armv7-older-phones.apk`. Check: `unzip -p <apk> 'assets/*' | grep -ac gsk_` → 0.
- [ ] **6. Release QA on the emulator** (install the v1.1.0 APK first, add data, then update to 2.0.0): migration keeps chats/journal/check-ins; onboarding for a fresh install; sign-in + sync; crisis card from Talk, from a journal entry, from PHQ-9 item 9; voice note offline → online; sounds in background > 3 min; dark mode; 3-button nav; keyboard on every input screen. Table in the report.
- [ ] **7.** Fill the completion report. Do not commit or push; the owner does.

## Acceptance
- [ ] Both APKs exist, contain only their architecture's native libs, and no key.
- [ ] Release QA table complete with every crisis path passing.

## Stop and ask if
- any crisis path fails — release is blocked;
- deploy needs credentials you don't have.
