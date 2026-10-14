# M05 — Journal v2 (text): steps, feelings & influences, AI tags, reflection

- **Status:** ready after M04
- **Depends on:** M04
- **Read first:** `docs/v2-features.md` §3 (journal rows), §4.1, §6; `src/app/(tabs)/journal.tsx`, `src/app/journal-new.tsx`, `src/server/groq.ts`

## Outcome
A journal entry is a short step flow — mood → feelings (≤3) → influenced by (≤2) → write — like Serene, with AI-suggested chips the student can accept or change. Entries list by day with mood and chips. An optional AI reflection (2–3 sentences) can be requested under an entry. AI features respect `consents.ai`.

## Files
| File | Action |
| --- | --- |
| `src/content/feelings.ts` | create — lists below |
| `src/app/journal-new.tsx` | rewrite as steps |
| `src/app/journal/[id].tsx` | create — entry detail (mood, chips, text, reflection) |
| `src/app/(tabs)/journal.tsx` | list grouped "Today / Yesterday / date", mood + first line + chips |
| `src/app/api/tag+api.ts` | create |
| `src/server/groq.ts` | add `tag()` |
| `src/app/api/chat+api.ts` | accept `mode: "reflect"` (different system prompt, same safety path) |
| `src/lib/prompt.ts` | add `reflectPrompt(name, lang)` |
| `src/lib/api.ts` | `suggestTags(text)`, `askReflection(entryText)` |
| `src/lib/tags.test.ts` + `src/lib/tags.ts` | `cleanTags()` pure helper + tests |

## The lists (write exactly; ids are stable, labels can be styled later)
```ts
// src/content/feelings.ts
export const FEELINGS = [
  // energetic + pleasant
  { id: "happy", label: "Happy", q: "yellow" }, { id: "excited", label: "Excited", q: "yellow" }, { id: "proud", label: "Proud", q: "yellow" },
  { id: "hopeful", label: "Hopeful", q: "yellow" }, { id: "curious", label: "Curious", q: "yellow" },
  // calm + pleasant
  { id: "calm", label: "Calm", q: "green" }, { id: "relieved", label: "Relieved", q: "green" }, { id: "grateful", label: "Grateful", q: "green" },
  { id: "connected", label: "Loved / connected", q: "green" }, { id: "okay", label: "Okay", q: "green" },
  // energetic + unpleasant
  { id: "anxious", label: "Anxious", q: "red" }, { id: "overwhelmed", label: "Stressed / overwhelmed", q: "red" }, { id: "frustrated", label: "Frustrated", q: "red" },
  { id: "angry", label: "Angry", q: "red" }, { id: "embarrassed", label: "Embarrassed", q: "red" },
  // low + unpleasant
  { id: "sad", label: "Sad", q: "blue" }, { id: "disappointed", label: "Disappointed", q: "blue" }, { id: "lonely", label: "Lonely", q: "blue" },
  { id: "guilty", label: "Guilty", q: "blue" }, { id: "drained", label: "Drained / tired", q: "blue" }, { id: "confused", label: "Confused", q: "blue" },
] as const;
export const INFLUENCES = [
  { id: "studies", label: "Studies & exams" }, { id: "deadlines", label: "Assignments & deadlines" }, { id: "career", label: "Placements & career" },
  { id: "family", label: "Family" }, { id: "friends", label: "Friends" }, { id: "relationship", label: "Relationship" },
  { id: "hostel", label: "Hostel & roommates" }, { id: "money", label: "Money" }, { id: "health", label: "Health & body" },
  { id: "sleep", label: "Sleep" }, { id: "phone", label: "Phone & social media" }, { id: "thoughts", label: "Internal thoughts" },
  { id: "loneliness", label: "Loneliness" }, { id: "good_news", label: "Something good happened" },
] as const;
export const FEELING_IDS = FEELINGS.map((f) => f.id);
export const INFLUENCE_IDS = INFLUENCES.map((i) => i.id);
```
(The `q` quadrant is for grouping/visual patterns only — no colours; the world is monochrome.)

## Interfaces
- `POST /api/tag` body `{ text: string, roman?: boolean }` (text ≤ 4000 chars, redacted like chat) → `{ feelings: string[], influences: string[], roman?: string }`. Server: `tag()` on gpt-oss-20b, strict JSON schema with `enum: FEELING_IDS` / `enum: INFLUENCE_IDS`; when `roman` is true and the text contains Devanagari (`/[ऀ-ॿ]/`), also return `roman` (prompt: "Rewrite in romanised Hinglish exactly as people text, e.g. 'mujhe accha lag raha hai'. Do not translate. Keep English words as they are."). Failure → `{ feelings: [], influences: [] }` with status 200 (the UI just shows no suggestions).
- `src/lib/tags.ts`: `cleanTags(raw: unknown): { feelings: string[]; influences: string[] }` — keeps known ids, dedupes, caps 3/2. Used by the server AND the client.
- `POST /api/chat` with `{ mode: "reflect", messages: [{ role: "user", text: entryText }] }` → same response shape; uses `reflectPrompt` ("Write 2–3 warm sentences reflecting what the student wrote. Notice one strength or one gentle pattern. No questions needed. No advice lists. Same never-rules as chat."). Same risk pipeline: a crisis entry returns `{ kind: "crisis" }` and the UI shows the crisis card on the entry.

## Tasks
- [x] **1. Test first** `src/lib/tags.test.ts`:
  ```ts
  import { test } from "node:test";
  import assert from "node:assert/strict";
  import { cleanTags } from "./tags.ts";
  test("keeps only known ids, max 3 feelings and 2 influences, no duplicates", () => {
    const r = cleanTags({ feelings: ["anxious", "anxious", "sad", "bogus", "lonely", "drained"], influences: ["studies", "sleep", "money"] });
    assert.deepEqual(r, { feelings: ["anxious", "sad", "lonely"], influences: ["studies", "sleep"] });
  });
  test("garbage input gives empty lists", () => {
    assert.deepEqual(cleanTags(null), { feelings: [], influences: [] });
    assert.deepEqual(cleanTags({ feelings: "sad" }), { feelings: [], influences: [] });
  });
  ```
- [x] **2.** Implement `cleanTags` (imports the id lists from `src/content/feelings.ts` with a relative `.ts` path so Node tests run), run tests → pass.
- [x] **3. Server** `tag()` + `tag+api.ts` (rate-limited like chat; validate body; never log text). Live check: `curl -s -X POST localhost:8081/api/tag -H 'content-type: application/json' -d '{"text":"exam ke pehle neend nahi aayi, bahut tension hai"}'` → expect `overwhelmed`/`anxious` + `studies`/`sleep`. Paste output.
- [x] **4. Step flow** in `journal-new.tsx`: Step 1 mood (5 word chips from Today); Step 2 feelings grouped in four rows; Step 3 influences; Step 4 text (prompts row stays). If `consents.ai` and text ≥ 15 chars, call `suggestTags(text)` on "Next" from step 4 and show suggested chips as pre-selected-but-editable on a final "Looks right?" step. Saving never waits for the AI: if the call hasn't returned in 2.5 s, save without suggestions.
- [x] **5. Entry detail** `journal/[id].tsx`: big mood word, date, FEELINGS and INFLUENCED BY chip rows, text, "Get a reflection" button (only if `consents.ai`) → shows the reflection under the entry (stored in `reflection`); crisis response → crisis card. Edit button returns to the step flow prefilled.
- [x] **6. List** grouped by day; tap → detail; long-press → delete (confirm).
- [x] **7. Settings → Privacy:** toggles for "AI journal reflections & tags" (`consents.ai`) — off hides the AI buttons. Update onboarding step 3 copy to `docs/v2-features.md` §6 (what stays on the phone, what goes to our server when signed in, what goes to Groq and that it doesn't train on it, how to delete) — show the new text to the owner in the report before finishing.
- [x] **8. Screenshots** (both themes): each step, list, detail with reflection, crisis entry detail. `docs/screens/M05/`.
- [x] **9.** `npm run verify` → PASS.

## Acceptance
- [x] `tags.test.ts` passes; the tag curl output is in the report.
- [x] Saving an entry works in airplane mode (no suggestions, no error).
- [x] An entry with crisis wording shows the crisis card in detail and never shows an AI reflection.

## Stop and ask if
- strict JSON schema with `enum` is rejected by Groq (paste error);
- you want to add, rename or remove a feeling or influence.

## Do not touch
`src/safety/*` (except importing), instruments, theme.

## Completion report

### 1. Test & Verification Status
- **`tags.test.ts`**: Pass (all tests pass).
- **Test suite (`npm test`)**: 67/67 passing across all 16 test files.
- **Typecheck (`npx tsc --noEmit`)**: 0 errors.
- **Project Verification (`bash scripts/verify.sh`)**: PASS (all invariants satisfied).

### 2. Live Server Tag Check Output
```bash
$ curl -s -X POST http://localhost:8081/api/tag -H 'content-type: application/json' -d '{"text":"exam ke pehle neend nahi aayi, bahut tension hai"}'
{"feelings":["anxious"],"influences":["studies","deadlines"]}
```

### 3. Safety & Privacy Compliance
- **Crisis Gating in Journal**: Any entry with crisis wording (`classifyRisk(entryText).level === "crisis"`) renders the full `<CrisisCard />` at the top of the detail screen, suppresses the "Get a reflection" button, and completely bypasses AI models.
- **Reflection Safety**: If a requested reflection triggers crisis detection, it returns `{ kind: "crisis" }` and displays the CrisisCard without persisting or rendering unsafe content.
- **Settings Privacy Toggle**: "AI Reflections & Tags" (`consents.ai`) toggle in `src/app/profile/settings.tsx` disables all AI tagging and reflection capabilities when turned off.
- **Onboarding Step 3 Copy**: Updated to disclose what stays on phone, what syncs to server, Groq zero-retention / non-training terms, and helplines.

### 4. Visual Deliverables (`docs/screens/M05/`)
16 screenshots captured across both themes:
- `step1.png` / `step1-dark.png`: Step 1 - Mood baseline (5 chips)
- `step2.png` / `step2-dark.png`: Step 2 - Pick feelings grouped by quadrant
- `step3.png` / `step3-dark.png`: Step 3 - Influences selection
- `step4.png` / `step4-dark.png`: Step 4 - Writing area with prompt chips
- `step5.png` / `step5-dark.png`: Step 5 - "Looks right?" AI tag review with preselected editable chips
- `journal-list.png` / `journal-list-dark.png`: Journal list grouped by day with mood, chips, and previews
- `detail-reflection.png` / `detail-reflection-dark.png`: Journal detail with hand-drawn reflection balloon
- `detail-crisis.png` / `detail-crisis-dark.png`: Crisis entry detail displaying top CrisisCard and zero AI actions
