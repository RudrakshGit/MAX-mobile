# Architecture

## The shape of it

```
Phone (Expo / React Native)                         Server (Expo Router API routes on EAS Hosting)
───────────────────────────                         ──────────────────────────────────────────────
screens in src/app/                                  POST /api/chat
  │                                                    ├─ validate, rate-limit, redact email/phone
  ├─ src/lib/store.ts  ← AsyncStorage (all data)      ├─ classifyRisk()  (same file as the phone)
  ├─ src/safety/classifier.ts  ← runs BEFORE send     ├─ in parallel:
  │     crisis → helpline card, nothing sent          │     modelRisk()  gpt-oss-safeguard-20b
  ├─ src/lib/api.ts  ── text + weekly numbers ──────▶ │     reply        gpt-oss-120b
  │                                                    ├─ crisis from either → { kind: "crisis" }
  │                                                    ├─ plain() + oneQuestion() + inspectOutput()
  │ ◀──────────────── { kind, text, distress } ────── └─ reply
  │
  ├─ modules/usage-stats (Kotlin) → screen on/off, per-app minutes
  │     └─ src/lib/screen-time.ts (pure maths, tested)
  └─ opt-in pulse: 3 numbers + random id ───────────▶ POST/GET /api/pulse → Neon (k ≥ 10)
```

There is no login. The phone is the database; the server keeps nothing except the optional campus pulse.

## Folders

| Path | Owns |
| --- | --- |
| `src/app/(tabs)/` | Today, Talk, Journal, Insights, Explore |
| `src/app/` | Pushed screens: onboarding, help, settings, campus, check-ups, lessons, tools, new journal entry |
| `src/app/api/` | `chat+api.ts`, `pulse+api.ts`. Server only; secrets never reach the app bundle |
| `src/safety/` | Deterministic classifier, output guard, model risk check, golden test set |
| `src/lib/` | Store, theme, shared UI, API client, prompt, insights, suggestions, reply shaping, reminders, screen-time maths |
| `src/content/` | Check-up instruments and scoring, lessons and their sources |
| `modules/usage-stats/` | Android-only Expo module (Kotlin). `null` in Expo Go and on iOS, so the feature hides itself |

## Decisions and why

| Decision | Why |
| --- | --- |
| Expo + React Native, Android first | One TypeScript codebase; Expo Go means no Android Studio to start; most students use budget Android phones |
| Data on the phone, no accounts | The strongest privacy promise is not holding the data. Also no auth to build or break |
| API routes inside the app project | The safety classifier is one file shared by phone and server, so there's no copy to drift |
| Groq | Free, fast on weak networks, and does not train on API data |
| Replies generated in full, not streamed | The output guard must see the whole reply before the student does |
| Tool suggestions chosen by code | Tested rules are reliable; tags asked of a model are forgotten or invented |
| Hand-drawn SVG chart | One small chart doesn't justify a charting library on a budget phone |
| Deep imports for fonts and icons | Package indexes bundle every weight and every icon set (~8 MB saved) |
| Only ARM builds, minified, resources shrunk | x86 is only for emulators; keeps the APK small |

## Data on the phone

One versioned envelope, `{ version, state }`, under `max.state` in AsyncStorage: settings, check-ins, journal entries, chat messages (last 300), check-up results, reframes and if-then plans. `update()` writes it through a single queue so writes can't land out of order; `useStore(select)` reads it with `useSyncExternalStore`.

Reading is defensive (`src/lib/schema.ts`, tested in `schema.test.ts`): every field is validated and bad rows are dropped, so a new build can open an old install's data. The previous build's bare `max.v1` blob is migrated once. A blob that can't be read, or that a newer build wrote, is kept under `max.corrupt` instead of being overwritten. Bump `SCHEMA_VERSION` when the shape changes and add a migration step in `parse()`.

`android:allowBackup` is off, so Google's cloud backup can't restore a previous install's data after a reinstall. Updating the APK in place keeps the data (that is what an update should do); a clean slate is Settings → Delete everything, or uninstall. Settings shows the build number at the bottom so you can tell which build is running.

Export shares the state; delete wipes storage and cancels scheduled reminders.

## What the model is told

The system prompt (`src/lib/prompt.ts`) sets tone and method (CBT-informed, one question, the student's own language) and the never-list. When "What your companion knows" is on, it adds `wellbeingContext()`: last-7-day averages, latest check-up bands and up to three of the student's if-then plans. Journal text is never included. The language to reply in is decided in code (`replyLanguage()`), not left to the model.
