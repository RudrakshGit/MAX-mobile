# Architecture

## The shape of it

```
Android app / web demo (this repo)              Server: API routes in src/app/api/ (EAS Hosting)
──────────────────────────────────              ────────────────────────────────────────────────
screens in src/app/                             POST /api/chat
  ├─ src/lib/store.ts ← AsyncStorage (all data)   ├─ validate, rate-limit, redact email/phone
  ├─ classifyRisk() before sending                ├─ classifyRisk() again (same file as the phone)
  │    crisis → helpline card, nothing sent       ├─ in parallel: modelRisk() and the reply (Groq)
  ├─ chatPayload() → messages + afterCrisis ────▶ ├─ crisis from either → { kind: "crisis" }
  │                                               ├─ plain() · latinOnly() · oneQuestion() · inspectOutput()
  │ ◀──────────── { kind, text, distress, care } ─┘
  ├─ journal tags, voice, reflection ──────────▶ /api/tag, /api/transcribe, /api/chat (with consent)
  ├─ daily insight (numbers only) ──────────────▶ /api/insight
  ├─ optional Google backup ────────────────────▶ /api/auth/google, /api/sync, /api/account → Neon
  └─ College ID set → daily numbers ────────────▶ /api/college/join, /api/pulse → Neon

Website (separate repo, Vercel) ────────────────▶ /api/college/apply, /dashboard, /admin (bearer token)
  /try embeds the web demo in an iframe
```

The phone is the database. The server keeps only what the student opted into: the Google backup and anonymous
numbers shared with a verified college. Chat text passes through and is not stored.

## Folders

| Path | Owns |
| --- | --- |
| `src/app/(tabs)/` | Today (`index`), Explore, Talk, Journal. `learn`, `tools`, `tests` are hidden redirects for old links |
| `src/app/` | Pushed screens: onboarding, help, check-in insight, tools, courses, self-checks, journal entry, sounds, profile and settings |
| `src/app/api/` | Server routes. Secrets never reach the app bundle |
| `src/server/` | Groq calls, database, sessions, Google token check, rate limits, college rules and noise, CORS |
| `src/safety/` | Classifier, output guard, model risk check, golden (91) and holdout (79) test sets |
| `src/lib/` | Store, persistence, theme, prompt, reply shaping, chat payload, insights, plan, reminders, sync, college client |
| `src/components/` | MAX rig (`max/`), card scenes (`scenes/`), settings pages, shared pieces |
| `src/ui/` | Design kit: sketch outlines, fields, wheels, chips, avatars, doodle icons |
| `src/content/` | Self-check instruments and scoring, courses, reads, resources, music |
| `src/features/` | Voice notes, sounds, account |
| `modules/` | Kotlin: `usage-stats` (screen time) and `theme-reveal` (ink theme switch). Absent on web, so features hide |

## Web demo

The same code exported with `npx expo export --platform web` and served by EAS Hosting next to the API. `isWeb`
(`src/lib/platform.ts`) marks it a demo: auto-onboarded, 20 chats a day, settings limited to Get app, Appearance and
Your data. `DemoBar` shows only when the page is not inside the website's iframe.

EAS rewrites the `Origin` header, so the college routes allow `*` and accept only bearer tokens, never cookies
(`src/server/cors.ts`).

## Data on the phone

One versioned envelope, `{ version, state }`, saved through `src/lib/persist.ts` (chunked, crash-safe). `update()`
writes through one queue; `useStore(select)` reads with `useSyncExternalStore`. `src/lib/schema.ts` validates every
field and drops bad rows, so a new build opens an old install's data; bump `SCHEMA_VERSION` and add a step in
`parse()` when the shape changes. Unreadable data is kept aside, never overwritten.

`android:allowBackup` is off. Updating the APK keeps data; Settings → Delete everything (or uninstall) clears it.

## What the model is told

`src/lib/prompt.ts` builds the system prompt: `identity(name)`, `NO_ASSUMPTIONS`, tone and method (one gentle
question, the student's own language decided in code by `replyLanguage()`), and the never-list. With "What MAX knows"
on (named after the companion), it adds weekly averages, latest self-check bands and up to three of the student's own plans, marked as background
only. Journal text is never included. In care mode it adds the after-crisis instructions.

## Decisions

| Decision | Why |
| --- | --- |
| Expo + React Native, Android first | One TypeScript codebase; most students use budget Android phones |
| API routes in the app project | The classifier is one file shared by phone and server, so it can't drift |
| Groq | Free, fast on weak networks, no training on API data |
| Replies not streamed | The output guard must see the whole reply first |
| Tool suggestions chosen by code | Tested rules beat tags a model may forget or invent |
| Deep imports for fonts, ARM-only minified builds | Keeps the APK small |
