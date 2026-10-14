# M01 — Chat safety rework: two-call pattern, fallback, safeguard fix

- **Status:** ready after M00
- **Depends on:** M00
- **Read first:** `docs/safety.md` (all of it), `docs/v2-features.md` §4.1–4.2, `src/app/api/chat+api.ts`, `src/safety/model-check.ts`

## Outcome
Every chat message runs two Groq calls in parallel — the reply (gpt-oss-120b, falling back to qwen3.8-27b on 429/5xx) and a "read" (gpt-oss-20b, strict JSON: emotions, intensity, risk). The safeguard model is called only for borderline messages. When the read fails, risk is `unknown`, never "safe". Emotions are stored on the assistant message.

## Why
Today `chat+api.ts` calls `gpt-oss-safeguard-20b` on every message. That model allows 2000 tokens/min on our account (measured), so it throttles after ~4–5 messages a minute across all students and the route silently drops to regex-only. The two-call pattern (from pc-1827/serene, MIT) gives a per-message emotion + risk score on a pool that can carry it.

## Files
| File | Action |
| --- | --- |
| `src/safety/risk.ts` | create — pure decision helpers (code below) |
| `src/safety/risk.test.ts` | create — tests below |
| `src/server/groq.ts` | create — the only module that talks to Groq for chat/read |
| `src/safety/model-check.ts` | keep `modelRisk`, import the fetch helper from `src/server/groq.ts` |
| `src/app/api/chat+api.ts` | rewrite the middle section to use the above |
| `src/lib/store.ts`, `src/lib/schema.ts` | add optional `emotions?: string[]` to `Msg` and keep it in `sanitize` |
| `src/app/(tabs)/talk.tsx` | store `emotions` from the response on the assistant message |
| `scripts/verify.sh` | no change (the existing "AI provider only from server" rule already allows `src/server/`) |

## Interfaces
- Produces `src/safety/risk.ts`:
  ```ts
  export type Read = { emotions: string[]; intensity: number; risk: number };
  export function needsSafeguard(regex: RiskLevel, read: Read | null): boolean;
  export function finalLevel(regex: RiskLevel, read: Read | null, safeguard: RiskLevel | null): RiskLevel;
  ```
- Produces `src/server/groq.ts`:
  ```ts
  export const MODELS = { reply: "openai/gpt-oss-120b", replyFallback: "qwen/qwen3.8-27b", read: "openai/gpt-oss-20b", safeguard: "openai/gpt-oss-safeguard-20b" } as const;
  export async function groqChat(body: object, key: string, timeoutMs?: number): Promise<Response>;   // POST /chat/completions with AbortSignal.timeout
  export async function reply(messages: object[], system: string, key: string): Promise<string | null>;  // 120b, then qwen on 429/5xx/timeout; null if both fail
  export async function read(recentUserTexts: string[], key: string): Promise<Read | null>;           // 20b strict JSON; null on any failure
  ```
- Response of `POST /api/chat` gains `emotions?: string[]`: `{ kind: "reply", text, distress, emotions? }`.

## Tasks

- [x] **1. Write the failing tests** — `src/safety/risk.test.ts`:
  ```ts
  import { test } from "node:test";
  import assert from "node:assert/strict";
  import { finalLevel, needsSafeguard } from "./risk.ts";

  const read = (risk: number) => ({ emotions: [], intensity: 5, risk });

  test("high read risk is a crisis without asking safeguard", () => {
    assert.equal(needsSafeguard("none", read(8)), false);
    assert.equal(finalLevel("none", read(8), null), "crisis");
  });

  test("borderline read risk asks safeguard, and safeguard can escalate", () => {
    assert.equal(needsSafeguard("none", read(5)), true);
    assert.equal(finalLevel("none", read(5), "crisis"), "crisis");
    assert.equal(finalLevel("none", read(5), "none"), "distress");
  });

  test("regex distress always asks safeguard", () => {
    assert.equal(needsSafeguard("distress", read(1)), true);
    assert.equal(finalLevel("distress", read(1), null), "distress");
  });

  test("a failed read is unknown, never safe", () => {
    assert.equal(needsSafeguard("distress", null), true);
    assert.equal(needsSafeguard("none", null), false);
    assert.equal(finalLevel("distress", null, null), "distress");
    assert.equal(finalLevel("none", null, "crisis"), "crisis");
  });

  test("calm message stays calm and cheap", () => {
    assert.equal(needsSafeguard("none", read(1)), false);
    assert.equal(finalLevel("none", read(1), null), "none");
  });

  test("out-of-range scores are clamped, not trusted", () => {
    assert.equal(finalLevel("none", read(42), null), "crisis");
    assert.equal(finalLevel("none", read(-3), null), "none");
  });
  ```
- [x] **2. Run** `node --test src/safety/risk.test.ts` → fails (module missing).
- [x] **3. Implement** `src/safety/risk.ts` exactly:
  ```ts
  import type { RiskLevel } from "./classifier";

  // How the regex layer, the per-message "read" score and the safeguard model
  // combine. Pure, so every branch is tested. A failed read is unknown, not safe.
  export type Read = { emotions: string[]; intensity: number; risk: number };

  const clamp = (n: number) => Math.max(0, Math.min(10, Number.isFinite(n) ? n : 0));
  export const CRISIS_AT = 7;
  export const BORDER_AT = 4;

  export function needsSafeguard(regex: RiskLevel, read: Read | null): boolean {
    if (read && clamp(read.risk) >= CRISIS_AT) return false;
    if (regex === "distress") return true;
    if (!read) return regex !== "none";
    return clamp(read.risk) >= BORDER_AT;
  }

  export function finalLevel(regex: RiskLevel, read: Read | null, safeguard: RiskLevel | null): RiskLevel {
    if (regex === "crisis") return "crisis";
    if (read && clamp(read.risk) >= CRISIS_AT) return "crisis";
    if (safeguard === "crisis") return "crisis";
    if (regex === "distress" || safeguard === "distress" || (read && clamp(read.risk) >= BORDER_AT)) return "distress";
    return "none";
  }
  ```
- [x] **4. Run** the test file → all pass.
- [x] **5. Write `src/server/groq.ts`.** Rules: base URL `https://api.groq.com/openai/v1/chat/completions`; every call has `AbortSignal.timeout` (reply 15 s, read 6 s); `reasoning_effort: "low"` for `openai/*` models only; for qwen send `reasoning_format: "hidden"`. `read()` uses `response_format: { type: "json_schema", json_schema: { name: "read", strict: true, schema } }` with schema `{ type:"object", additionalProperties:false, required:["emotions","intensity","risk"], properties:{ emotions:{ type:"array", items:{ type:"string" } }, intensity:{ type:"integer" }, risk:{ type:"integer" } } }`, system prompt: "Rate the student's latest message. emotions: up to 3 words. intensity: 0–10. risk: 0–10 for suicide or self-harm risk, where 7+ means any sign of wanting to die, self-harm, being a burden or saying goodbye. Messages may be English, Hindi or Hinglish." Parse defensively: if JSON is invalid or fields are missing → return `null`. Truncate emotions to 3 in code.
- [x] **6. Rewrite the middle of `chat+api.ts`.** Keep: rate limit, validation, redaction, the early regex crisis return, `inspectOutput`, `oneQuestion(plain(...))`, `replyLanguage`. New flow:
  ```ts
  const system = systemPrompt(name, risk.level === "distress", context, replyLanguage(last.text));   // as today
  const convo = messages.map((m) => ({ role: m.role, content: redact(m.text) }));                       // as today
  const recent = messages.filter((m) => m.role === "user").slice(-3).map((m) => redact(m.text));
  const [text, r] = await Promise.all([reply(convo, system, key), read(recent, key)]);
  const sg = needsSafeguard(risk.level, r) ? await modelRisk(recent, key) : null;
  const level = finalLevel(risk.level, r, sg);
  if (r === null) console.warn(JSON.stringify({ event: "safety.read.unavailable" }));
  if (level === "crisis") return Response.json({ kind: "crisis" });
  if (!text) return Response.json({ error: "The AI provider did not answer" }, { status: 502 });
  ```
  then the existing guard and `Response.json({ kind: "reply", text: ..., distress: level === "distress", emotions: r?.emotions })`.
  Note: the safeguard call now runs after the parallel pair only when needed; it adds ~0.4 s to borderline messages only. That is intended.
- [x] **7. Client.** In `talk.tsx` `send()`, keep `emotions` from the reply on the assistant `Msg`. In `schema.ts` `messages()` sanitizer, keep `emotions` when it is an array of ≤3 strings (≤30 chars each).
- [x] **8. Live check on the dev server** (`npx expo start`, `.env.local` has the key):
  ```bash
  curl -s -X POST localhost:8081/api/chat -H 'content-type: application/json' -d '{"messages":[{"role":"user","text":"exam ka pressure hai"}]}'
  curl -s -X POST localhost:8081/api/chat -H 'content-type: application/json' -d '{"messages":[{"role":"user","text":"kabhi kabhi lagta hai sab mere bina better rahenge"}]}'
  curl -s -X POST localhost:8081/api/chat -H 'content-type: application/json' -d '{"messages":[{"role":"user","text":"I just feel empty and tired of everything"}]}'
  ```
  Expected: 1 → `kind:"reply"` with `emotions`; 2 → `kind:"crisis"`; 3 → reply or crisis, and the server log shows whether safeguard was asked. Paste all three outputs in the report.
- [x] **9.** `npm run verify` → PASS.

## Acceptance
- [x] `risk.test.ts` passes (6 tests); total test count went up, none removed.
- [x] `grep -n "modelRisk" src/app/api/chat+api.ts` shows it only inside the `needsSafeguard(...) ?` branch.
- [x] `grep -rn "api.groq.com" src` lists only `src/server/groq.ts` (and `model-check.ts` if it still builds its own request — prefer importing `groqChat`).
- [x] The three curl outputs are in the report.

## Stop and ask if
- Groq rejects `response_format` json_schema for gpt-oss-20b (paste the error) — do not switch to free-text parsing on your own;
- you think a threshold (7 / 4) should change;
- any golden-set test fails.

## Do not touch
`src/safety/classifier.ts`, `src/safety/golden.json`, `src/safety/guard.ts`, the crisis card text in `src/lib/ui.tsx`.

## Completion report
- Status: done
- What changed (files):
  - `src/safety/risk.ts`: created pure decision logic (`needsSafeguard`, `finalLevel`, `clamp`, `CRISIS_AT = 7`, `BORDER_AT = 4`)
  - `src/safety/risk.test.ts`: created 6 unit tests covering crisis, borderline escalation, distress, failed read, calm message, and clamped out-of-range values
  - `src/server/groq.ts`: created Groq integration module (`MODELS`, `groqChat`, `reply` with 120b fallback to qwen3.8-27b on 429/5xx/timeout, and `read` with gpt-oss-20b strict json_schema)
  - `src/safety/model-check.ts`: refactored to use `groqChat` and `MODELS.safeguard` from `src/server/groq.ts`
  - `src/app/api/chat+api.ts`: refactored to execute `reply` and `read` concurrently via `Promise.all`, conditional safeguard check only when `needsSafeguard(...)` is true, and returned `emotions`
  - `src/lib/store.ts`: added optional `emotions?: string[]` to `Msg` type
  - `src/lib/api.ts`: added optional `emotions?: string[]` to `Reply` type
  - `src/lib/schema.ts`: updated `messages()` sanitizer to keep `emotions` when array of <=3 strings (<=30 chars)
  - `src/lib/schema.test.ts`: added test case verifying valid emotions retention and invalid emotions stripping
  - `src/app/(tabs)/talk.tsx`: stored `r.emotions` from assistant response on assistant `Msg`
- Commands run (paste real output, including `npm run verify`):
  - `node --test src/safety/risk.test.ts` (RED phase):
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/safety/risk.ts'
✖ src/safety/risk.test.ts (137.375166ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
```
  - `node --test src/safety/risk.test.ts` (GREEN phase):
```
✔ high read risk is a crisis without asking safeguard (0.382416ms)
✔ borderline read risk asks safeguard, and safeguard can escalate (0.060666ms)
✔ regex distress always asks safeguard (0.048125ms)
✔ a failed read is unknown, never safe (0.046834ms)
✔ calm message stays calm and cheap (0.049208ms)
✔ out-of-range scores are clamped, not trusted (0.042833ms)
ℹ tests 6
ℹ pass 6
```
  - Live curls against dev server:
    1. Normal distress (`exam ka pressure hai`):
```json
{"kind":"reply","text":"Lagta hai exam ka pressure bahut zyada feel ho raha hai, sahi?","distress":false,"emotions":["stress","anxiety","pressure"]}
```
    2. Subtle crisis (`kabhi kabhi lagta hai sab mere bina better rahenge`):
```json
{"kind":"crisis"}
```
    3. Empty and tired (`I just feel empty and tired of everything`):
```json
{"kind":"reply","text":"I hear you’re feeling empty and exhausted right now. Try taking a slow breath in for 4 seconds, then a long exhale for 6 seconds. If it feels overwhelming, would you tap the red Help button to connect with someone right away?","distress":true,"emotions":["sad","exhausted","empty"]}
```
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
- Screenshots: None required for M01.
- Deviations from the brief (and why): None. Followed exact patterns and specifications.
- Things I noticed that are outside this milestone: None.
- Questions for Claude / the owner: None.

