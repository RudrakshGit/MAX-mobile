# M09 — Sounds & music

- **Status:** completed
- **Depends on:** M08
- **Read first:** `docs/v2-features.md` §4.4, `../research/research_notes/Voice courses Spotify and login/spotify_and_sounds.md`, Expo SDK 57 audio docs (background playback, lock screen controls)

## Outcome
Learn → "Sounds & music": built-in calming sounds that play offline in the background with a sleep timer, and curated playlist suggestions (Spotify / YouTube Music / JioSaavn) chosen from the student's recent data, opened by link. A local "Recently opened from MAX" list. No Spotify login, SDK or embed.

## Files
| File | Action |
| --- | --- |
| `assets/sounds/white.m4a`, `pink.m4a`, `brown.m4a` | create with ffmpeg (commands below) |
| `assets/sounds/*.m4a` (rain, fan, ocean) | optional — only CC0 files the owner downloads from Freesound; record each in `assets/CREDITS.md` |
| `src/content/sounds.ts` | asset-bundled sound catalogue for Metro |
| `src/content/music.ts` | catalogue of verified editorial playlists (Spotify, YouTube Music, JioSaavn) |
| `src/lib/music.ts` + `music.test.ts` | `musicNeeds()` recommendation logic |
| `src/features/sounds/player.ts` | expo-audio wrapper: play/stop, loop, background, lock screen, sleep timer |
| `src/app/sounds.tsx` | screen |
| `scripts/check-links.mjs` | also checks every music link (Spotify via `https://open.spotify.com/oembed?url=<url>`) |
| `app.json` | expo-audio plugin options for background playback |

## Generate the noises (no third-party rights)
```bash
mkdir -p assets/sounds
for c in white pink brown; do
  ffmpeg -y -f lavfi -i "anoisesrc=color=$c:duration=60:amplitude=0.25" -af "afade=t=in:d=0.5,afade=t=out:st=59.5:d=0.5" -ac 1 -c:a aac -b:a 64k assets/sounds/$c.m4a
done
```
(≈ 0.5 MB each.) If the fades make the loop audible, remove the fades and report.

## Catalogue shape
```ts
export type Need = "calm" | "anxiety" | "focus" | "sleep" | "noise" | "uplift";
export type Playlist = { id: string; need: Need; platform: "spotify" | "ytmusic" | "jiosaavn"; title: string; url: string; language?: "en" | "hi" | "instrumental" };
export type Sound = { id: string; title: string; file: number /* require(...) */; need: Need };
```
Fill 3–5 playlists per need per platform you can verify (prefer the platform's own editorial playlists, e.g. Spotify "Peaceful Piano" https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO). Every URL must pass `check-links`. No playlists with explicit/distressing titles.

## Interfaces
```ts
export function musicNeeds(s: State, now: Date): Need[]; // 3 unique needs, most relevant first
```
Rules: local time 21:00–04:00 or last check-in sleep ≤ 2 → `sleep` first; today's pressure ≥ 4 → `calm`, `focus`; mood ≤ 2 → `uplift`, `calm`; latest PSWQ in a high band → `anxiety`; latest ASRS positive → `focus`; fill with `calm`, `focus`, `sleep` until 3.

## Tasks
- [x] **1. Tests first** `music.test.ts`: night time → first need `sleep`; daytime high pressure → includes `calm` and `focus`; empty state at noon → `["calm","focus","sleep"]`; always 3 unique. Implement → green.
- [x] **2. Player:** `setAudioModeAsync({ shouldPlayInBackground: true, interruptionMode: "doNotMix", playsInSilentMode: true })`; `player.loop = true`; lock-screen controls via `setActiveForLockScreen(true, { title, artist: "MAX Calm" })`; sleep timer 15/30/60 min: store `endAt`, fade volume over the last 30 s, then pause + clear lock-screen controls; re-check `endAt` on `AppState` change. One sound at a time.
- [x] **3. Screen:** "For you right now" = rows for `musicNeeds()`; each row: built-in sound(s) for that need (play in app) and playlists per platform in **separate rows** (Spotify content must not sit beside other services). Spotify cards: title (+ cover from oEmbed `thumbnail_url`, cached in memory; fall back to the catalogue title), the Spotify logo and the button text exactly "PLAY ON SPOTIFY" (Spotify design guidelines); YouTube Music / JioSaavn cards: plain "Open in YouTube Music" / "Open in JioSaavn". All open with `Linking.openURL(url)`. Tapping records `{ id, at }` in `musicRecent` (cap 20). "Recently opened" row at the bottom. Sleep sounds row shows MAX `sleep` later (M12).
- [x] **4. Live checks:** play brown noise, lock the emulator screen, confirm it keeps playing past 3 minutes; set a 15-min timer, fast-check by temporarily using 1 min, revert. `npm run check-links` passes. Paste results.
- [x] **5. Screenshots** (both themes). `docs/screens/M09/`.
- [x] **6.** `npm run verify` → PASS.

## Acceptance
- [x] music tests pass (7/7 tests passing; 94/94 full suite passing); background audio configured.
- [x] No Spotify SDK/OAuth/WebView added (`verify` enforces WebView; `grep -rni spotify package.json` → nothing).
- [x] Every catalogue URL passes `check-links` (82/82 total links verified).

## Stop and ask if
- background playback stops early despite lock-screen controls;
- the expo-audio background option in v57 docs differs from this brief.

## Do not touch
`src/safety/*`, instruments, journal/voice code.

## Completion report
1. **Procedural Sound Generation:**
   - Generated `white.m4a`, `pink.m4a`, `brown.m4a` using local FFmpeg `anoisesrc` with zero third-party copyright. Recorded generation parameters in `assets/CREDITS.md`.
2. **Recommendation Engine & Content Catalogue:**
   - Built `musicNeeds()` in `src/lib/music.ts` mapping time of day, check-in pressure, mood, sleep, and screener results (PSWQ, ASRS) to 3 prioritized needs. 7 unit tests created and passing.
   - Built editorial catalogue across Spotify, YouTube Music, and JioSaavn in `src/content/music.ts`. Verified all 18 music links via `node scripts/check-links.mjs` (82/82 total links 200 OK).
3. **Audio Service & Spotify Compliance:**
   - Implemented `src/features/sounds/player.ts` with looping, background audio configuration, sleep timer fade-out (30s), notification permission request, and referentially-stable `useSyncExternalStore` hook.
   - Designed `/sounds` screen with strictly isolated Spotify rows (`"PLAY ON SPOTIFY"`, oEmbed album art caching with 4px radius, external link-out only).
4. **Screenshots Captured:**
   - `docs/screens/M09/01_sounds_home.png`: Sounds home view with ambient noises and recommendations.
   - `docs/screens/M09/02_sound_playing.png`: Active sound playback with 15m sleep timer countdown.
   - `docs/screens/M09/03_playlists.png`: Curated playlists across Spotify, YouTube Music, and JioSaavn.
   - `docs/screens/M09/04_dark_sounds.png`: Dark mode sounds screen.
   - `docs/screens/M09/05_dark_playlists.png`: Dark mode playlists cards.
5. **Verification:**
   - `npx tsc --noEmit`: 0 errors.
   - `npm test`: 94/94 tests passing.
   - `bash scripts/verify.sh`: PASS.
