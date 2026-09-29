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

PHQ-9, GAD-7 and the Copenhagen Burnout Inventory (with its reverse-scored item) report a range, never a diagnosis. The weekly tech-stress check is MAX's own wording on the technostress dimensions of Tarafdar et al. (2007) and is labelled as not validated. ISI and PSS-10 are licensed through Mapi Trust and must not be added.

## Privacy boundary

- No account; nothing identifying is collected.
- Emails and Indian mobile numbers are redacted before text reaches the model.
- The model may see weekly averages, check-up bands and the student's own if-then plans (toggle in Settings). Never journal text.
- Screen-time data is read and computed on the phone and never sent.
- Campus pulse is opt-in: mood, sleep and pressure (1–5) with a random ID. A campus sees nothing until 10 distinct students contribute; per-day points appear only for days that clear 10 on their own.
- Notification text never mentions mental health.
