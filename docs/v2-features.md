# MAX v2 — features and technical decisions

Final decisions, 13 Oct 2026. Companion docs: `PRODUCT.md` (product truth), `docs/design-direction.md` (visual world), `docs/courses-plan.md` (Learn tab), `docs/plan/00-master-plan.md` (build order for Antigravity).
Evidence lives in `../research/research_notes/` (three rounds). **[measured]** = tested directly on the team's Groq account or an emulator; **[unverified]** = check before release.

## 1. What we are building

Serene's concept (Daily Plan, courses, AI journal, self-tests, profile with mood history and daily insights) plus BetterMind's chat, on MAX's foundation (crisis safety, check-in, screen time, campus pulse). Free. No paywall, premium, gifts, confetti, congratulation pop-ups or waiting screens.

### Owner decisions (Oct 2026) that change earlier rules
- **Data:** the "nothing leaves the phone" rule is dropped. Optional Google login stores the user's app data on our server so progress survives a new phone. Data is used to restore the user's app and for anonymous campus aggregates; any other use (e.g. research) needs a separate, explicit opt-in.
- **Ages:** all ages allowed. Known legal item: DPDP Rules need verifiable parental consent for under-18s from ~May 2027 (penalty up to ₹200 crore); revisit before then.
- **Tests:** only the 15 verified instruments in §5. No permission-pending or unvalidated tests.
- **Journal and voice may be sent to the AI** (with the onboarding consent and per-feature toggles in Settings).

### Rules for a short attention span
1. Something useful within 60 s of first launch.
2. Daily Plan ≤ 3 items; any one completes the day.
3. One reminder a day at most, at a time the student picks, no guilt wording.
4. No streak counter: "days you showed up this month", "3 of the last 7 days"; missed days blank, never red.
5. After a gap: "Welcome back — 2-minute reset?", never a backlog.
6. Progress = thin line + quiet tick + MAX `cheer` once. No confetti, sounds or modals.
7. No drip-feed, no fake loading; local content is instant; AI calls are optimistic.
8. Daily cards don't repeat within ~60 days; "show me less of this".
9. "Get help now" one tap from every screen, including the lock screen.

## 2. Information architecture

Tabs: **Home · Learn · Talk · Journal · Tests**. **Profile** opens from the avatar in the Home header.

| Area | Contents |
|---|---|
| Home | greeting + MAX balloon with Today's card, Daily Plan (≤3), today's check-in, Personal Insight entry |
| Learn | Your course, 6 courses, tools (breathing, grounding, reframe, spiral breaker, safety plan), Watch & read library, Sounds & music |
| Talk | multi-chat AI companion, history sheet, inline tool/test chips |
| Journal | entries by day; new entry by text or voice; feelings + "influenced by" chips; transcript + waveform player |
| Tests | search, featured, category rows, intro page, result page, "About these tests" |
| Profile | avatar + name, Mood (entries calendar, mood distribution, phone use by category), Tests taken, Insights history, Settings, account & data |

## 3. Feature decisions

| Feature | Decision | Tech | Source / licence |
|---|---|---|---|
| Daily Plan | 3 derived goals (one Learn step, one Do tool, one check-in or journal); ticks derived from today's data | pure `dailyPlan(state, date)` + tests | own |
| Today's card | 4 rotating types: values prompt, one small step (if-then), normalising line, skill nudge; ~90 own-written cards | local data, no repeat in 60 days | own writing (generic affirmations rejected: Wood et al. 2009) |
| Check-in | keep 4-tap check-in; phone-before-bed auto-filled in the APK | existing | existing |
| Journal entry | mood → feelings (≤3) → influenced by (≤2) → write or speak; AI suggests chips, the student confirms | step flow | flow idea from Pixy (MIT, spec only) |
| Voice journal | see §4.3 | expo-audio, Groq Whisper + gpt-oss-20b | own; Emotion-Diary flow idea (MIT) |
| Feelings / influences | 20 feelings in 4 energy × pleasantness quadrants; 14 student factors | strict JSON enum | circumplex idea; GoEmotions mapping for evaluation |
| AI reflection | optional 2–3 sentences under an entry | gpt-oss-120b, chat safety path | own |
| Personal Insight | one article/day, 3 themed sections, cites ≥2 of the student's own data points; 20-theme rotation + avoid-list; support card instead if a crisis flag fired in the last 7 days | gpt-oss-20b, generated on first Home open of the day, cached locally; built from structured signals (mood, chips, check-ins, test bands) | own |
| Courses | see `docs/courses-plan.md` (6 in-app courses, library, rule-based "Your course") | local content | WHO DWM (CC BY-NC-SA 3.0 IGO), 29k (CC BY-SA 4.0), own writing |
| Watch & read | vetted videos and sites; YouTube opens the YouTube app, sites open in an in-app browser tab | `Linking`, `expo-web-browser` | per-item creator/credential recorded |
| Tests | 15 instruments (§5) with intro, one question per screen, result + next step | extend `checkups.ts` | per instrument |
| Profile mood views | entries calendar (face per day or "+"), mood distribution (7d/30d/all), phone use by category | re-implemented, no new deps | Pixy as spec (MIT) |
| Phone use by category | Social, Video & OTT, Games, Messaging, Study & productivity, Payments & shopping, Other | Kotlin returns `ApplicationInfo.category` (API 26+); own override map for Indian apps reporting "undefined" | idea from lalitshankarch/serene (no licence → idea only) |
| Multi-chat | conversation list in a sheet, title = first message, new, delete | schema v3 `chats[]` | own |
| Chat chips | tool/test chips under replies | `suggestFor()` + model marker `[[test:<id>]]` checked against an allow-list | BetterMind pattern |
| Safety plan | warning signs, coping, people, places, professionals, reasons for living | one page | Nepanikar pattern (MIT), guilt prompt removed |
| Sounds & music | see §4.4 | expo-audio; curated links | own catalogue; generated + CC0 audio |
| Avatars | 24 Open Peeps busts (12 + 12 sets, open to everyone), random default, picker | static SVGs | Open Peeps (CC0) |
| Login & sync | see §4.5 | Google Sign-In + Neon | own |
| Export / import | backup file for people who don't sign in | `expo-file-system`, `expo-sharing`, `expo-document-picker` | Pixy (MIT) |
| Breathing | add box (4-4-4-4) and 4-7-8 next to cyclic sigh | data in the existing tool | own |
| Campus pulse | keep | Neon | existing |

Dropped: Premium, Gift, paywall, scratch-card, fake loaders, review nagging, and the tests with no legal validated version (Love Language, Toxic Person, People Pleasing, Childhood Trauma, Mood Disorder, Mood Swings, plus everything that needed author permission).

## 4. Technical design

### 4.1 Models (Groq — no training on API data; enable Zero Data Retention in the console)

| Job | Model | Notes |
|---|---|---|
| chat reply, journal reflection | `openai/gpt-oss-120b` | best CBT quality in the bake-off **[measured]** |
| chat fallback on 429 | `qwen/qwen3.8-27b` | separate pool; fastest; one garbled Hinglish phrase seen → fallback only **[measured]** |
| "read" call, tagging, romanising, daily insight | `openai/gpt-oss-20b` | separate pool; strict JSON schema |
| borderline crisis tie-break | `openai/gpt-oss-safeguard-20b` | only when borderline (2000 tokens/min) |
| transcription | `whisper-large-v3` (retry on `whisper-large-v3-turbo`) | |

Limits **[measured]**: 120b and 20b each 1000 req/day and 8000 tokens/min; safeguard 1000/day, 2000 tokens/min; reasoning tokens count, keep `reasoning_effort: "low"`. Capacity ≈ 30–80 daily-active students. The 20b pool is shared by read + tag + insight, so it runs out first; when it fails, safety falls back to regex + safeguard, never to "safe".
Gemini: not used (1.5 shut down Sep 2025; free tier trains on content **[verified on Google's pricing page]**). No better free no-training model exists today.

### 4.2 Chat: two-call pattern (from pc-1827, fixed)
Per message, in parallel: (1) reply — 120b, qwen on 429; (2) read — 20b → `{ emotions: string[≤3], intensity: 0–10, risk: 0–10 }`.
Decision (pure function `decideRisk`, unit-tested): regex crisis → crisis (model never called); read.risk ≥ 7 → crisis, reply discarded; regex distress or 4 ≤ risk < 7 → safeguard tie-break; read failed → `unknown` (never 0) → safeguard if regex is not "none". Output guard on every reply. Emotions stored on the message for Insights. This replaces today's safeguard-on-every-message call (a current bug: it throttles at ~4–5 messages/min).

### 4.3 Voice journal (simplest free setup)
- Record: `expo-audio` ~57.0.5 + `expo-file-system` ~57.0.7. `RecordingPresets.HIGH_QUALITY` overridden to 16 kHz, mono, 32 kbps, metering on, saved in the documents directory, max 120 s (≈ 240 KB/min). Not the LOW_QUALITY preset (AMR on Android). Clips < 1.5 s or silent are discarded.
- Waveform: save ~60 metering levels with the entry; the player draws bars from them.
- Upload (only if the student taps "Transcribe" or has auto-transcribe on): the phone sends the raw file bytes to `POST /api/transcribe` (`content-type: audio/mp4`, ≤ 1.5 MB). The route wraps them for Groq Whisper with a short Hinglish prompt (keeps English words in Latin script **[measured]**). Audio is not stored on the server.
- Romanise + tag: `POST /api/tag` → gpt-oss-20b strict JSON `{ roman, feelings[], influences[] }`; romanising is skipped when there is no Devanagari; reject a romanisation whose word count differs by > 25%; if the LLM step fails show the raw transcript. The crisis classifier runs on the transcript.
- Failure: 429 → retry once on turbo; otherwise the entry stays "pending" (audio safe) and retries when the Journal opens.
- Not used: on-device recognition (`expo-speech-recognition` — Android 13+ only for audio, WAV 8× larger, unclear Hinglish, may still send audio to Google), rule-based transliteration (produced "acchā… āja" **[measured by researcher]**), Sarvam (paid after ₹100 credit; noted as a paid upgrade).

### 4.4 Sounds and music (Spotify feasibility settled)
Spotify's 2026 rules make real integration impossible for a student app: Development Mode allows 5 allowlisted users, the owner needs Premium, recommendations/featured/category endpoints are gone for new apps, and Extended Quota requires a registered organisation with 250k MAU.
- **Built:** `src/content/music.ts` — curated playlists grouped by need (calm, anxiety relief, focus/ADHD-friendly, sleep, noise, uplift), separate rows per platform (Spotify / YouTube Music / JioSaavn; Spotify content may not sit beside other services). Rules map state → needs (e.g. high pressure → focus + calm; poor sleep → sleep; low mood → uplift). Spotify titles/covers from the keyless oEmbed endpoint (cached; fallback title in the catalogue), Spotify logo + "PLAY ON SPOTIFY" per Spotify's design guidelines, opened by `Linking` (`open.spotify.com` link opens the app or browser). "Recently opened from MAX" = last 20 taps stored locally.
- **In-app sounds (work offline):** white, pink and brown noise generated with ffmpeg (no third-party rights) + 2–3 CC0 Freesound loops (rain, fan, ocean), ~0.5 MB each. expo-audio with `shouldPlayInBackground: true`, `interruptionMode: 'doNotMix'` and lock-screen controls (without them Android stops audio after ~3 min); sleep timer with fade-out in app code.
- **Not built:** Spotify OAuth, App Remote SDK, Web Playback SDK, embedded players, unofficial JioSaavn APIs.

### 4.5 Login and sync (optional)
- Client: `@react-native-google-signin/google-signin` 16.1.5 (free version; needs a development build and its config plugin), session token in `expo-secure-store` ~57.0.4. Offered once after onboarding and in Settings ("Back up and sync with Google"); the app works fully signed out.
- Google Cloud (owner, one-time): Web OAuth client (its id is passed to `configure()` and checked by the server) + an Android OAuth client for `com.eg18.max` per signing-key SHA-1 (local debug keystore, any EAS keystore). Scopes `openid email profile` only; consent screen "In production".
- Server: `jose` 6.2.12 verifies the Google ID token once at sign-in (key: Google `sub`, not email) and issues a random session token; only its SHA-256 hash is stored. Neon tables: `users(id, google_sub unique, email, name, created_at)`, `sessions(token_hash, user_id, expires_at)`, `user_state(user_id, rev, envelope text, updated_at)`, `deletion_requests(email, created_at)`.
- Routes: `POST /api/auth/google`, `POST /api/auth/signout`, `GET /api/sync?rev=N` (304-style "unchanged"), `PUT /api/sync?base=N` (409 if the server moved on), `DELETE /api/account` (deletes rows), `GET /api/delete-account` (plain HTML page: how to delete in-app + a form to request deletion by email — Google Play requires a web deletion path).
- Sync: the phone stays the source of truth. Pull on sign-in and app start; push 30 s after a change and when the app goes to background. On 409 or first sign-in on a phone with data, `mergeStates(local, remote)` unions list items by id and takes scalars from the newer side (pure, unit-tested). The envelope is passed through as text (no JSON parsing on the server; fits 10 CPU-ms). `anonId` and `lock` are stripped before upload; `resetAll()` signs out before wiping so an empty state is never pushed. Bodies > 1 MB rejected. Audio files are never synced.
- Fallbacks: `react-native-nitro-google-signin` 2.3.0 if the client library breaks; Firebase Auth + Firestore if our own server becomes impossible.

### 4.6 Server routes (EAS Hosting free: 100k req/month, 10 CPU-ms, 10 subrequests per request — verified)
`/api/chat`, `/api/transcribe`, `/api/tag`, `/api/insight`, `/api/auth/google`, `/api/auth/signout`, `/api/sync`, `/api/account`, `/api/delete-account`, `/api/pulse`. Routes relay; they never parse audio or the sync envelope. Unverified: audio relay CPU time and token-verify CPU time — measure on the first deploy.

### 4.7 Tuning and evaluation
No fine-tuning (Groq offers none; LoRA is enterprise-only). Versioned prompts + few-shot examples + frozen eval sets; a prompt change that lowers crisis recall fails `npm run verify`. Eval data: MAX golden set (91 cases, grows with every miss), Reddit C-SSRS (CC BY 4.0) for English risk, GoEmotions (Apache-2.0) for feelings via the label mapping.

## 5. Tests (15, verified licences only)

| Category | Test | Items | Licence note |
|---|---|---|---|
| Personality | Mini-IPIP (Big Five; replaces MBTI) | 20 | public domain |
| Personal growth | O*NET Mini Interest Profiler | 30 | CC BY 4.0; attribute; don't cut items |
| | Short Almost Perfect Scale | 8 | "no permission needed" |
| | Brief Resilience Scale | 6 | listed unrestricted |
| | Rosenberg Self-Esteem | 10 | public domain |
| Wellness | PHQ-9, GAD-7, CBI | 9 / 7 / 13 | already shipping |
| | WHO-5 | 5 | CC BY-NC-SA 3.0 IGO |
| | Three-Item Loneliness | 3 | UCLA: non-profit use |
| | ASRS v1.1 screener (ADHD) | 6 | free, verbatim, credit NYU/Harvard |
| | AQ-10 (autistic traits) | 10 | free for non-profit, no changes |
| | Body Appreciation Scale-2 | 10 | free in any setting |
| | Sleep Condition Indicator | 8 | CC BY-NC 4.0 |
| | Penn State Worry Questionnaire | 16 | public domain |

(The existing 8-item tech-stress check stays, labelled "MAX's own, not validated".)
**Item text and scoring keys must come verbatim from the official sources listed in `research/research_notes/Serene features technical implementation/instruments.md` and be checked by a human before shipping** — a small model must never write items from memory. Results are ranges, never diagnoses; ADHD/autism say "screening result, not a diagnosis" with a counsellor card; PHQ-9 item 9 > 0 shows helplines before the result; skipped items are never scored as 0; one "About these tests" screen holds every citation and licence line.

## 6. Privacy and consent
- Onboarding consent explains: what is stored on the phone, what is sent to our server when signed in, what goes to Groq (chat, journal reflections, voice transcription, tagging), that Groq does not train on it, and how to delete everything. Settings has per-feature toggles (AI journal reflections & tags, voice transcription, cloud sync; chat itself is covered by the onboarding consent) and "Delete my account and data".
- No identifiers are sent to the AI (the phone fills in the name; emails/phone numbers redacted).
- Play Store (if published): Data safety form lists email/user ID, health info and user content; in-app + web account deletion.

## 7. Code reuse
Reference clones in `../reference-repos/` (`copyable/` MIT/MPL; `reference-only/` never copy code). `THIRD-PARTY.md` lists every copied file with its copyright line. New dependencies (exact versions in `docs/plan/00-master-plan.md`): expo-dev-client, expo-audio, expo-file-system, expo-sharing, expo-document-picker, expo-secure-store, expo-web-browser, @react-native-google-signin/google-signin, jose, roughjs, @expo-google-fonts/kalam, @expo-google-fonts/atkinson-hyperlegible-next. Not added: Skia, Rive, Lottie, react-native-webview, any Spotify SDK.

## 8. Open items for the owner
- Confirm MAX.png's origin (AI-generated images have weak copyright); prefer tracing + hand-drawn poses.
- Find the content reviewer (counsellor / psychology faculty) for courses.
- Google Cloud OAuth clients, Neon `DATABASE_URL` and Groq Zero Data Retention (console steps).
- DPDP under-18 consent before ~May 2027.
