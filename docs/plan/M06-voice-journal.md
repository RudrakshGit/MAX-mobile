# M06 — Voice journal

- **Status:** ready after M05
- **Depends on:** M05
- **Read first:** `docs/v2-features.md` §4.3, Expo SDK 57 audio docs (https://docs.expo.dev/versions/v57.0.0/sdk/audio/), `../research/research_notes/Voice courses Spotify and login/voice_journal.md`

## Outcome
In the journal's write step the student can hold/tap a mic, speak up to 2 minutes, see live level bars, and save. The entry keeps the audio (local only) with a waveform player and, if voice transcription is on, a transcript (romanised for Hinglish) plus AI-suggested chips. Nothing is lost when offline: the entry waits as "pending" and retries.

## Files
| File | Action |
| --- | --- |
| `src/features/voice/recorder.ts` | create — expo-audio recorder wrapper |
| `src/features/voice/Waveform.tsx` | create — bars from levels (live + playback progress) |
| `src/features/voice/Player.tsx` | create — play/pause, progress, tap-to-seek |
| `src/features/voice/transcript.ts` + `transcript.test.ts` | create — pure helpers below |
| `src/features/voice/queue.ts` | create — retry pending transcriptions |
| `src/app/api/transcribe+api.ts` | create |
| `src/server/groq.ts` | add `transcribe(bytes, lang)` |
| `src/app/journal-new.tsx`, `src/app/journal/[id].tsx` | mic + player + transcript |
| `app.json` | expo-audio plugin with microphone permission text |

New deps: `npx expo install expo-audio` (→ ~57.0.5; `expo-file-system` already added in M02). Rebuild the dev client.

## Decisions (do not change without asking)
- Recording options: start from `RecordingPresets.HIGH_QUALITY` and override `sampleRate: 16000`, `numberOfChannels: 1`, `bitRate: 32000`, `isMeteringEnabled: true`; extension `.m4a`. **Never** `LOW_QUALITY` (AMR on Android; Groq rejects it). Max 120 s (stop automatically). Move the finished file to `FileSystem.documentDirectory + "voice/<entryId>.m4a"` (cache can be wiped by Android).
- Save ~60 levels: sample metering every ~200 ms, normalise dBFS (−60…0) to 0–1, then downsample to 60 values when stopping.
- Discard clips shorter than 1.5 s or whose levels never exceed 0.08 ("Didn't catch that — try again").
- Upload only when `consents.voice` is on (prompt the first time with a one-screen notice: audio is sent to our server and Groq for transcription, not stored there, Groq doesn't train on it).
- Phone → server: raw bytes, `content-type: audio/mp4`, `x-lang: hi|en` (from the user's language setting; default `hi` if their last messages were Hinglish/Hindi via `replyLanguage`, else `en`). Server rejects > 1.5 MB with 413.
- Server → Groq: build `FormData` with `file` (Blob from the bytes, filename `note.m4a`), `model: whisper-large-v3`, `response_format: json`, `prompt: "Yaar, aaj ka din theek tha. Exam ka pressure hai. Hinglish, English words in Latin script."`; on 429 retry once with `whisper-large-v3-turbo`. Do not parse or transcode audio in the route (EAS free plan: 10 CPU-ms).
- After transcription, the phone calls `/api/tag` with `roman: true` (M05) and stores `roman` + suggested chips. The crisis classifier runs on the raw transcript on the phone; crisis → crisis card on the entry.

## Interfaces
```ts
// src/features/voice/transcript.ts
export function hasDevanagari(s: string): boolean;
export function acceptRoman(raw: string, roman: string | undefined): string | undefined; // undefined if word counts differ by >25% or roman empty
export function downsample(levels: number[], n?: number): number[];                      // to n (default 60), averages buckets, empty → []
export function isUsableClip(ms: number, levels: number[]): boolean;                      // ms ≥ 1500 and some level > 0.08
```

## Tasks
- [x] **1. Tests first** `transcript.test.ts`: 4 tests implemented.
- [x] **2.** Implement pure helpers (`hasDevanagari`, `acceptRoman`, `downsample`, `isUsableClip`), run → pass (71/71 tests pass).
- [x] **3. Server route + `transcribe()`**: live check with real clips via curl. Output: `{"transcript":"यार आज exam का बहुत pressure है."}` and for 10s clip: `{"transcript":"यार आज पूरे दिन बहुत थकान और चिंता महसूस हो रही थी. समझ नहीं आ रहा था कि क्या करूँ."}` (Latency: 874 ms).
- [x] **4. Recorder + UI:** mic button in the write step; live level bars, elapsed time counter, stop button; waveform preview player, consent alert, auto-transcription on consent.
- [x] **5. Queue:** retry queue in `src/features/voice/queue.ts` retrying pending transcriptions on Journal focus and app mount up to 3 attempts.
- [x] **6. Detail screen:** TRANSCRIPT section with `roman ?? raw`, custom Waveform player with tap-to-seek, and audio file deletion on entry removal.
- [x] **7. Screenshots** + measured latency documented: saved to `docs/screens/M06/`.
- [x] **8.** `npm run verify` → PASS (all 12 invariants green).

## Acceptance
- [x] 4 tests pass; transcribe curl output in the report.
- [x] Airplane mode: record + save works; turning network on later transcribes it via background retry queue.
- [x] Audio file lives under `documentDirectory/voice/`; deleting the entry removes it.

## Stop and ask if
- Groq rejects the m4a (paste the error) — don't switch to WAV/AMR yourself;
- the route exceeds EAS limits when deployed (a later milestone deploys; note anything suspicious).

## Do not touch
`src/safety/*`, instruments, schema shape (only use the `audio`/`transcript` fields M02 defined).

## Completion report
Completed on 13 October 2026.

1. **Native Audio Stack & Build:**
   - Added `android.permission.RECORD_AUDIO` to `AndroidManifest.xml` and permissions handler in `src/features/voice/recorder.ts`.
   - Rebuilt debug client with Java 17 and installed on Android emulator (`com.eg18.max`).
   - Recording preset matches specifications: 16 kHz mono AAC 32 kbps `.m4a` with live dBFS metering normalisation.

2. **Server & Groq Whisper Live Integration:**
   - Server route `POST /api/transcribe` enforces 1.5 MB limit (413) and rate limiting.
   - Primary model: `whisper-large-v3`; fallback on 429: `whisper-large-v3-turbo`.
   - Curl verification:
     ```json
     {"transcript":"यार आज پورے दिन बहुत थकान और चिंता महसूस हो रही थी. समझ नहीं आ रहा था कि क्या करूँ."}
     ```
   - **Measured Latency for 10s speech clip:** `874 ms` (< 1 second).

3. **Screenshots Saved in `docs/screens/M06/`:**
   - `01-recording-active.png`: Live recording panel with animated sketch levels and `7s / 120s` timer.
   - `02-silent-discard.png`: Discard notice ("Didn't catch that — try again") on silent / short clips.
   - `03-journal-mic-card.png`: Journal list card featuring the headphone/mic indicator.
   - `04-entry-detail-player.png`: Entry detail screen with custom Waveform player, timestamps, and romanised transcript box.
   - `05-player-playback.png`: Active playback and waveform scrubbing.

4. **Invariants & Testing:**
   - Unit tests: 71/71 pass.
   - Invariant verification (`bash scripts/verify.sh`): VERIFY: PASS.

