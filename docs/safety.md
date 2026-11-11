# Safety

The most important page in this repo. Read it before changing `src/safety/`, `src/lib/prompt.ts`,
`src/lib/chat-payload.ts` or `src/app/api/chat+api.ts`.

## The rule

Safety is code, not prompt text. A prompt is a request a model may ignore; a classifier is a gate. Every chat message
goes through code before and after the model, and a crisis is never handled by AI.

## Layers

| # | Where | What | If it fires |
| --- | --- | --- | --- |
| 1 | Phone, before sending | `classifyRisk()`: reviewed patterns for English, Hindi and Hinglish, idioms masked first ("this exam is killing me") | Crisis card at once, nothing sent. Works offline |
| 2 | Server | The same `classifyRisk()` again, so a modified client can't skip it | `{ kind: "crisis" }` |
| 3 | Server, beside the reply | `modelRisk()`: a safety-tuned model over the last three student messages. Can only raise to crisis; on failure or timeout layers 1–2 stand | Reply discarded unseen, crisis card |
| 4 | Server, after the reply | `inspectOutput()`: diagnosis, medicine advice, claiming to be human or a professional, dependence, discouraging contact, promising secrecy | Safe fallback reply; reason code logged, never the text |
| 5 | Phone | Three distress or care replies in the last 12 messages → "heavy conversation" card with a call button | — |

Ambiguity resolves upward: a false alarm costs a dismissible card; a miss costs far more.

## Care mode (after a helpline card)

The card is never the only answer to what comes next. For up to `CARE_REPLIES` (2) replies after a card, MAX talks
gently and asks whether the student is safe (`afterCrisis`, built by `chatPayload()` in `src/lib/chat-payload.ts`).
Care mode ends early when the student says they're safe ("safe hu", "it was a joke") or MAX has already answered
normally. The server scores only what the student said after the card, so an old message can't bring the card back on
every reply; a new crisis message still gets one. Tests: `chat-payload.test.ts`.

## Test sets

`src/safety/golden.json` (91 cases) and `holdout.json` (79 fresh phrasings plus everyday controls that must not
trigger). `npm test` fails on any miss and `verify.sh` fails if either set shrinks. When a real phrase slips through,
add it first, then fix the pattern.

## Crisis card

Fixed, reviewed text in `CrisisCard` (`src/lib/ui.tsx`), never written by a model:

- 112, national emergency number
- Tele-MANAS, 14416 and 1-800-891-4416: Government of India, free, 24×7, many Indian languages
- Vandrevala Foundation, 9999666555: 24×7, call or WhatsApp

Re-check every number before each release. The Help button is on every main screen and works while the app is
locked. A PHQ-9 item 9 answer above zero shows the crisis card whatever the total.

## Self-checks

Each instrument reports a range or profile, never a diagnosis; screeners add "screening result, not a diagnosis" and
a counsellor card. What was checked against which paper: `src/content/instruments/SOURCES.md`. The weekly tech-stress
check is MAX's own wording and says it is not validated. ISI and PSS-10 are licensed and must not be added.

## Privacy boundary

- Signed out, everything stays on the phone. With the optional Google login the state syncs to Neon, minus the
  anonymous id, the lock setting and other per-phone fields (`src/lib/sync.ts`).
- Emails and Indian mobile numbers are removed before text reaches the model; no name or account id is sent to the AI.
  Chat text is not stored on the server.
- The chat model sees the conversation and, if "What MAX knows" is on, weekly averages, self-check bands and the
  student's own plans. Never journal text.
- Journal text goes to the AI only with "AI in the journal" on; audio only with "Voice to text" on, and audio is
  never stored on the server.
- The daily insight uses numbers and chip ids only. Per-app screen time is never sent to the AI.
- College sharing is opt-in, needs a College ID, and works only for colleges MAX has verified. Sent: mood, sleep and
  pressure (1–5), journal category ids and optional year of study, with a random id; never text or a name. Staff see
  nothing until 10 distinct students share; small groups are hidden, numbers carry noise and counts round to 5.
  Stopping can delete what the phone shared.
- Notification text never mentions mental health.
