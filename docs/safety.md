# Safety

The most important page in this repo. Read it before changing anything in `src/safety/`, `src/lib/prompt.ts` or `src/app/api/chat+api.ts`.

## The rule

Safety is code, not prompt text. A prompt is a request a model may ignore; a classifier is a gate. Every chat message goes through code before and after the model, and a crisis is never handled by AI.

## Layers

| # | Where | What | If it fires |
| --- | --- | --- | --- |
| 1 | Phone, before sending | `classifyRisk()`: reviewed patterns for English, Hindi (Devanagari) and romanised Hinglish, with idioms masked out first ("this exam is killing me") | Crisis card shown instantly, nothing sent. Works offline |
| 2 | Server | The same `classifyRisk()` again, so a modified client can't skip it | `{ kind: "crisis" }` |
| 3 | Server, in parallel with the reply | `modelRisk()`: `gpt-oss-safeguard-20b` with our policy, over the last three user messages. May only raise to crisis; if it fails or times out (3 s), layers 1–2 stand | Reply discarded unseen, crisis card |
| 4 | Server, after generation | `inspectOutput()`: diagnosis as verdict, medication advice, claiming to be human or a professional, "only I understand you", discouraging contact, promising confidentiality | Reply replaced by a safe fallback; reason code logged, no content |
| 5 | Phone | Three distress replies in recent turns → "this has been a heavy conversation" card with a call button | — |

Ambiguity resolves upward: a false alarm costs a dismissible card; a miss costs far more.

## The golden set

`src/safety/golden.json` holds 91 labelled messages: crisis, distress and none, in English, Hindi and Hinglish, including hard negatives that must not escalate. `npm test` fails on any miss. When a real phrase slips through, add it here first, then fix the pattern.

Phrases added after live testing, because layer 1 missed them: "gayab ho jaana chahta hu", "sab mere bina better rahenge", "apni cheezein de di", "never wake up", "happier without me".

## Crisis card

Fixed, reviewed text in `CrisisCard` (`src/lib/ui.tsx`). Never generated or paraphrased by a model.

- 112: national emergency number
- Tele-MANAS, 14416 and 1-800-891-4416: Government of India, free, 24×7, English and 20 Indian languages
- Vandrevala Foundation, 9999666555: 24×7, call or WhatsApp

KIRAN (1800-599-0019) is not listed: it has been merged into Tele-MANAS (Department of Empowerment of Persons with Disabilities, "Other Helplines"). Re-verify every number before each release.

The Help button is on every tab and still works when the app is locked. A PHQ-9 answer above zero on item 9 shows the crisis card regardless of the total score.

## Check-ups

All 15 instruments (`docs/v2-features.md` §5) report a range or profile, never a diagnosis; clinical screeners add "screening result, not a diagnosis" and a counsellor card. The weekly tech-stress check is MAX's own wording on the technostress dimensions of Tarafdar et al. (2007) and is labelled as not validated. ISI and PSS-10 are licensed through Mapi Trust and must not be added.

## Privacy boundary

v2 (owner decision, Oct 2026): optional Google login stores the signed-in student's app data on our server; journal text and voice may be sent to the AI with consent. The rules below are the current boundary — see `docs/v2-features.md` §6.

- Login is optional; signed out, everything stays on the phone. Signed in, the state envelope syncs to our server (Neon), minus the anonymous id, the lock setting and other per-phone fields (`src/lib/sync.ts`).
- Emails and Indian mobile numbers are redacted before text reaches the model; no name or account identifier is sent to the AI.
- The chat model sees the conversation, weekly averages, check-up bands and the student's own if-then plans ("What your companion knows" toggle).
- Journal text goes to the AI only for reflections/tags when "AI journal reflections & tags" is on; voice only for transcription when "Voice transcription" is on. Audio is never stored on the server.
- The daily insight is built from numbers and chip ids only, never journal text.
- Per-app screen-time is computed on the phone and never sent to the AI (it may sync with the student's account).
- Sharing with a college is opt-in and only with a college MAX has verified: mood, sleep and pressure (1–5), journal category ids and optional year of study, with a random ID; never text or a name. Staff see nothing until 10 distinct students contribute; smaller groups are hidden, numbers carry noise and counts are rounded to 5. Stopping can delete everything the phone shared (`docs/plan/M15-college-dashboard.md`).
- Notification text never mentions mental health.
