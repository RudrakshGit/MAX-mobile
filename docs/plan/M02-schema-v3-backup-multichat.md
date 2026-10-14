# M02 — Schema v3 + migration, export/import, multi-chat

- **Status:** ready after M01
- **Depends on:** M01
- **Read first:** `docs/architecture.md` ("Data on the phone"), `src/lib/schema.ts`, `src/lib/persist.ts`, `src/lib/store.ts`, `src/lib/schema.test.ts`, `docs/v2-features.md` §2–3

## Outcome
The on-device state moves to schema **v3** (multi-chat, richer journal entries, fields later milestones need) and any v1/v2 install migrates without loss. Students can export a backup file and import it on another phone. Talk supports multiple conversations with a list, new chat and delete.

## Files
| File | Action |
| --- | --- |
| `src/lib/store.ts` | v3 types, `initialState`, chat helpers |
| `src/lib/schema.ts` | `SCHEMA_VERSION = 3`, sanitizers for new fields, v2→v3 migration |
| `src/lib/schema.test.ts` | add the tests below (keep existing ones, updated for v3) |
| `src/lib/backup.ts` | create — export/import |
| `src/app/chats.tsx` | create — conversation list (modal stack screen) |
| `src/app/(tabs)/talk.tsx` | use the active chat; header button opens `/chats` |
| `src/app/_layout.tsx` | register `chats` screen with `presentation: "modal"` |
| `src/app/settings.tsx` | "Export backup" and "Import backup" buttons |
| `THIRD-PARTY.md` | add Pixy lines for any adapted code |

New deps: `npx expo install expo-file-system expo-sharing expo-document-picker` (→ ~57.0.7, ~57.0.22, ~57.0.3). Rebuild the dev client afterwards (`npx expo run:android`).

## Interfaces (write these types exactly in `src/lib/store.ts`)
```ts
export type Msg = { id: string; role: "user" | "assistant"; text: string; at: number; kind?: "crisis" | "distress" | "offline"; suggest?: { label: string; href: string }[]; emotions?: string[] };
export type Chat = { id: string; title: string; createdAt: number; updatedAt: number; messages: Msg[] };
export type Entry = {
  id: string; at: number; updatedAt: number;
  mood?: number;                 // 1–5
  feelings: string[];            // ≤3, ids from src/content/feelings.ts (M05)
  influences: string[];          // ≤2
  text?: string; prompt?: string;
  audio?: { uri: string; ms: number; levels: number[] };           // M06
  transcript?: { raw?: string; roman?: string; status: "pending" | "done" | "failed" };
  reflection?: string;
};
export type Insight = { date: string; title: string; sections: { tag: string; heading: string; body: string }[] };
export type SafetyPlan = { warningSigns: string; coping: string; people: string; places: string; professionals: string; reasons: string };
export type Consents = { ai: boolean; voice: boolean; sync: boolean; at?: number };
// State v3 = every v2 field EXCEPT `messages`, plus:
//   chats: Chat[]; activeChatId?: string;
//   displayName?: string; avatar?: string;
//   courseProgress: Record<string, { done: number[]; unhelpful: number[] }>;
//   insights: Insight[];                        // newest last, keep 60
//   cardHistory: { id: string; date: string; less?: boolean }[];  // keep 120
//   values: string[];
//   safetyPlan?: SafetyPlan;
//   consents: Consents;
//   musicRecent: { id: string; at: number }[]; // keep 20
//   simpleFont: boolean;
```
Helpers in `store.ts`: `activeChat(s): Chat | undefined`, `startChat(): string` (creates, activates, returns id), `addMessage(chatId, m: Omit<Msg,"id"|"at">)`, `deleteChat(id)`, `renameChat(id, title)`. Caps: 50 chats, 300 messages per chat (oldest dropped).

## Tasks

- [x] **1. Failing tests first** — add to `src/lib/schema.test.ts`:
  ```ts
  test("v2 single conversation becomes the first chat, nothing lost", () => {
    const v2 = { version: 2, state: { onboarded: true, companion: "Max", anonId: "abcdefgh1234", consentAt: 5,
      messages: [{ id: "m1", role: "user", text: "hello there", at: 10 }, { id: "m2", role: "assistant", text: "hi", at: 11 }],
      entries: [{ id: "e1", at: 20, text: "diary" }] } };
    const s = parse(JSON.stringify(v2), fresh)!;
    assert.equal(s.chats.length, 1);
    assert.equal(s.chats[0].messages.length, 2);
    assert.equal(s.chats[0].title, "hello there");
    assert.equal(s.activeChatId, s.chats[0].id);
    assert.deepEqual(s.entries[0].feelings, []);
    assert.equal(s.entries[0].updatedAt, 20);
    assert.equal(s.consents.ai, true);   // consentAt existed
    assert.equal("messages" in s, false);
  });

  test("v3 round-trips and unknown activeChatId is dropped", () => {
    const s = { ...fresh(), chats: [{ id: "c1", title: "t", createdAt: 1, updatedAt: 2, messages: [] }], activeChatId: "nope" };
    const back = parse(JSON.stringify({ version: 3, state: s }), fresh)!;
    assert.equal(back.chats[0].id, "c1");
    assert.equal(back.activeChatId, undefined);
  });

  test("caps: 50 chats, 300 messages each, 60 insights", () => {
    const msgs = Array.from({ length: 320 }, (_, i) => ({ id: `m${i}`, role: "user", text: `x${i}`, at: i }));
    const chats = Array.from({ length: 55 }, (_, i) => ({ id: `c${i}`, title: "t", createdAt: i, updatedAt: i, messages: msgs }));
    const insights = Array.from({ length: 70 }, (_, i) => ({ date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10), title: "t", sections: [] })); // 70 distinct dates
    const s = sanitize({ chats, insights }, fresh);
    assert.equal(s.chats.length, 50);
    assert.equal(s.chats[0].messages.length, 300);
    assert.equal(s.insights.length, 60);
  });

  test("bad entry fields are cleaned, not thrown", () => {
    const s = sanitize({ entries: [{ id: "e", at: 1, updatedAt: 1, feelings: ["calm", 3, "x".repeat(99)], influences: "nope", mood: 9, text: "ok" }] }, fresh);
    assert.deepEqual(s.entries[0].feelings, ["calm"]);
    assert.deepEqual(s.entries[0].influences, []);
    assert.equal(s.entries[0].mood, undefined);
  });
  ```
  Update `fresh()` in the test file to return a full v3 state (all new fields with their empty defaults).
- [x] **2. Run** `node --test src/lib/schema.test.ts` → the new tests fail.
- [x] **3. Implement** in `schema.ts`: `SCHEMA_VERSION = 3`; `parse` accepts `version` 1–3 (bare object = v1); `sanitize` builds v3: if `raw.chats` is an array use it, else if `raw.messages` exists build one chat `{ id: "c" + firstAt, title: first user text (trimmed, ≤40 chars) || "Conversation", createdAt: firstAt, updatedAt: lastAt, messages }`; entries get `feelings: []`, `influences: []`, `updatedAt: at` when missing; `consents = { ai: raw.consents?.ai ?? Boolean(raw.consentAt), voice: …?? false, sync: …?? false, at }`; strings capped (feeling ids ≤ 30 chars); all caps applied (keep the newest items: last 300 messages, last 60 insights by date; insights are unique by date). `messages` never appears in the output.
- [x] **4. Run** the whole suite (`npm test`) → all pass.
- [x] **5. Store + helpers** as in Interfaces. `talk.tsx` reads `activeChat(state)`; sending with no active chat calls `startChat()` first; the title of a new chat is the first user message (≤40 chars), no AI call.
- [x] **6. `src/app/chats.tsx`:** list chats newest first (title, last message preview, date), "New chat" button, long-press → confirm → delete. Tapping a chat sets `activeChatId` and goes back. Register in `_layout.tsx` with `presentation: "modal"`, title "Conversations".
- [x] **7. Backup** `src/lib/backup.ts`. Read `../reference-repos/copyable/mrzmyr_pixy-mood-tracker-app/src/features/datagate/fileTransfer.ts` and `exportFile.ts` first and adapt the approach (MIT; add a line to `THIRD-PARTY.md` if you copy any code):
  ```ts
  export async function exportBackup(): Promise<void>;  // writes {version:3,state} (minus `lock`) to a cache file "max-backup-YYYY-MM-DD.json", opens the share sheet
  export async function importBackup(): Promise<"imported" | "cancelled" | "invalid">; // document picker (application/json) → parse() → Alert confirm "Replace everything on this phone?" → replace state
  ```
  Import must go through `parse()`; a file from a newer schema returns `"invalid"` with a friendly message.
- [x] **8. Settings:** "Export backup" / "Import backup" under "Your data".
- [x] **9. Manual check on the emulator:** install the current release APK's data by updating over it (or create data in the dev build), confirm old chat appears as one conversation; create a second chat; export → import on a wiped app (`adb shell pm clear com.eg18.max`) restores both chats. Screenshot the Conversations screen.
- [x] **10.** `npm run verify` → PASS.

## Acceptance
- [x] 4 new schema tests pass; existing tests still pass.
- [x] Old single-thread data appears as the first conversation after update.
- [x] Export → clear app data → import restores chats, journal and check-ins (screenshot).

## Stop and ask if
- you need to delete or rename any existing State field other than `messages`;
- the document picker cannot read the file on Android (paste the error).

## Do not touch
`src/safety/*`, server routes, UI styling (M03 replaces it — keep using the current `src/lib/ui.tsx` components).

## Completion report
- Status: done
- What changed (files):
  - `src/lib/store.ts`: defined exact v3 schema types (`Chat`, `Entry`, `Insight`, `SafetyPlan`, `Consents`, `State`), added helper functions (`activeChat`, `startChat`, `addMessage`, `deleteChat`, `renameChat`, `replaceState`), updated `initialState` with v3 defaults and caps (50 chats, 300 msgs/chat).
  - `src/lib/schema.ts`: updated `SCHEMA_VERSION = 3`; implemented sanitizers for v3 fields, v2->v3 migration creating a first chat from legacy `messages`, and strict capping/stripping.
  - `src/lib/schema.test.ts`: updated `fresh()` to return full v3 state; added 4 new tests for v2 migration, v3 round-trip, caps enforcement, and bad entry field sanitation.
  - `src/lib/backup.ts`: implemented `exportBackup()` (writes to cache with `FileSystem.cacheDirectory` and opens share sheet via `Sharing.shareAsync`) and `importBackup()` (selects json via `DocumentPicker.getDocumentAsync`, validates schema, confirms replacement, calls `replaceState`).
  - `THIRD-PARTY.md`: documented Pixy mood tracker code pattern adaptation for file backup transfer under MIT license.
  - `src/app/chats.tsx`: created modal screen listing chats newest first with active highlight, formatted dates, message previews, "New conversation" action, and long-press deletion confirmation.
  - `src/app/_layout.tsx`: registered `chats` route with `presentation: "modal"` and title "Conversations".
  - `src/app/(tabs)/talk.tsx`: updated to read from `activeChat`, automatically create a chat on first message with title <= 40 chars, and added header button to open `/chats`.
  - `src/app/settings.tsx`: added "Export backup" and "Import backup" actions under "Your data".
  - `src/lib/ui.tsx`: added `numberOfLines` support to typography helper `T`.
  - `src/app/(tabs)/journal.tsx` & `src/app/journal-new.tsx`: aligned with optional entry text and v3 `Entry` type.
- Commands run:
  - `npx expo run:android --no-bundler`: Exit 0 (built dev client with `expo-file-system`, `expo-sharing`, `expo-document-picker`).
  - `npm test`: 37 passing (10 tests in `schema.test.ts`).
  - `npm run verify`: VERIFY: PASS.
  - Emulator verification:
    - Sent messages to create active conversation "I can't focus on my studies".
    - Created second conversation "+ New conversation" -> "I feel lonely in the hostel".
    - Verified conversations list in `/chats`.
    - Exported backup to cache (`max-backup-2026-10-12.json`), opened Android share sheet.
    - Wiped app data (`adb shell pm clear com.eg18.max`), completed clean setup, verified 0 chats.
    - Used Settings -> "Import backup" via Android SAF document picker -> alert confirmation -> successfully restored both conversations.
- Screenshots:
  - `docs/screens/M02/conversations.png` (verified and saved).
- Deviations from the brief: None. Used `expo-file-system/legacy` as required by Expo SDK 57 for filesystem path and string read/write APIs.
- Things noticed: None.
- Questions for Claude / the owner: None.

