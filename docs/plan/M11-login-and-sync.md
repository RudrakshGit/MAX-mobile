# M11 — Google login, sync, account deletion

- **Status:** ready after M02 and M10, once the owner has done the Google Cloud + Neon steps
- **Depends on:** M02, M10; owner: OAuth clients, `DATABASE_URL`, `GOOGLE_WEB_CLIENT_ID`
- **Read first:** `docs/v2-features.md` §4.5–4.6 and §6, `../research/research_notes/Voice courses Spotify and login/login_and_sync.md`, `src/lib/schema.ts`, `src/lib/persist.ts`, `src/app/api/pulse+api.ts` (Neon usage pattern)

## Outcome
Optional "Back up and sync with Google". Signed-in students' state is stored on our server and merged across phones without losing or resurrecting items. Signed-out use is unchanged. Account deletion works in-app and from a web page.

## Files
| File | Action |
| --- | --- |
| `src/lib/store.ts`, `schema.ts` | add `tombstones: { id: string; at: number }[]` (keep 1000) and `sync?: { rev: number; dirty: boolean; lastAt?: number }`; every delete helper pushes a tombstone |
| `src/lib/sync.ts` + `sync.test.ts` | `mergeStates`, `forUpload` (pure) + `syncNow()` (I/O) |
| `src/lib/auth.ts` | Google sign-in, session token in secure store, sign-out |
| `src/server/db.ts` | Neon client + `ensureSchema()` (`create table if not exists …`, run once per instance) |
| `src/server/session.ts` | `sha256(token)`, `requireUser(req)` |
| `src/app/api/auth/google+api.ts`, `auth/signout+api.ts`, `sync+api.ts`, `account+api.ts`, `delete-account+api.ts` | routes |
| `src/app/profile/account.tsx` | sign in/out, last synced, delete account |
| `app.json` | google-signin config plugin; `extra.supportEmail` |
| `scripts/verify.sh` | allow `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (a public client id) in the EXPO_PUBLIC rule |

New deps: `npx expo install @react-native-google-signin/google-signin expo-secure-store` (→ 16.1.5, ~57.0.4) and `npm install jose@6.2.12` (server only). Rebuild the dev client.

## Tables
```sql
create table if not exists users (id text primary key, google_sub text unique not null, email text not null, name text, created_at timestamptz default now());
create table if not exists sessions (token_hash text primary key, user_id text not null references users(id) on delete cascade, expires_at timestamptz not null);
create table if not exists user_state (user_id text primary key references users(id) on delete cascade, rev integer not null, envelope text not null, updated_at timestamptz default now());
create table if not exists deletion_requests (email text not null, created_at timestamptz default now());
```

## Routes (all JSON unless noted; `Authorization: Bearer <session>` where marked 🔒)
- `POST /api/auth/google` `{ idToken }` → verify with `jose` `createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"))` + `jwtVerify(idToken, jwks, { issuer: ["https://accounts.google.com","accounts.google.com"], audience: process.env.GOOGLE_WEB_CLIENT_ID })`; upsert user by `sub`; create a random 32-byte token (`crypto.getRandomValues`, base64url), store its SHA-256 hex with 180-day expiry; return `{ token, email, name }`.
- 🔒 `POST /api/auth/signout` → delete the session row.
- 🔒 `GET /api/sync?rev=N` → `{ unchanged: true }` if `rev === N`, else `{ rev, envelope }` (envelope is the stored text; do not `JSON.parse` it on the server).
- 🔒 `PUT /api/sync?base=N` body = envelope text (≤ 1 MB, else 413) → if stored rev ≠ N → 409 `{ rev }`; else store with `rev = N + 1` → `{ rev }`. First upload: base=0 creates the row.
- 🔒 `DELETE /api/account` → delete the user (cascades) → 204.
- `GET /api/delete-account` → a small **HTML** page: "Delete your MAX account: in the app go to Profile → Account → Delete. No access to the app? Enter your Gmail address and we'll delete your data within 30 days." `POST` of that form (`email`) → insert into `deletion_requests` → HTML "Request received".
Never log tokens, emails or envelopes. Rate-limit auth routes like chat.

## Pure merge rules (`mergeStates(local, remote)`)
- If `local.onboarded` is false → take `remote` (keeping local `anonId`, `lock`, `sync`).
- List fields merge by key, newest wins, and any key in either side's `tombstones` is removed: `chats` (id; same id → messages unioned by id, sorted by `at`), `entries` (id, newer `updatedAt`), `results`, `reframes`, `plans` (id), `checkins` (date; local wins on a tie), `insights` (date), `activity` (date+kind+ref), `cardHistory` (id+date), `musicRecent` (id, newer `at`, cap 20), `phoneDays` (date). `courseProgress`: union of `done` and `unhelpful` per course. `tombstones`: union, cap 1000.
- Scalars (`companion`, `displayName`, `avatar`, `remindAt`, `bedtime`, `consents`, `simpleFont`, `shareContext`, `campus`, `values`, `safetyPlan`) come from `local`.
- `forUpload(state)` removes `anonId`, `lock`, `sync` before upload (so a named account is never linked to the anonymous campus pulse id, and the lock stays per device).

## Tasks
- [ ] **1. Tests first** `src/lib/sync.test.ts` (`sync.ts` must keep its pure functions free of React Native imports so Node can run them):
  ```ts
  import { test } from "node:test";
  import assert from "node:assert/strict";
  import { canUpload, forUpload, mergeStates } from "./sync.ts";

  // Minimal v3-shaped states; mergeStates must treat missing lists as [].
  const S = (o: any) => ({ onboarded: true, anonId: "anonlocal123", lock: false, chats: [], entries: [], results: [], reframes: [], plans: [], checkins: [],
    insights: [], activity: [], cardHistory: [], musicRecent: [], phoneDays: [], courseProgress: {}, tombstones: [], ...o });
  const e = (id: string, updatedAt: number, text = id) => ({ id, at: updatedAt, updatedAt, feelings: [], influences: [], text });

  test("fresh phone takes the cloud copy but keeps its own anonId", () => {
    const r = mergeStates(S({ onboarded: false, anonId: "anonphone999" }), S({ anonId: "anoncloud000", entries: [e("e1", 1), e("e2", 2)] }));
    assert.equal(r.entries.length, 2);
    assert.equal(r.anonId, "anonphone999");
  });

  test("both phones' new entries survive", () => {
    const r = mergeStates(S({ entries: [e("e1", 1)] }), S({ entries: [e("e2", 2)] }));
    assert.deepEqual(r.entries.map((x: any) => x.id).sort(), ["e1", "e2"]);
  });

  test("a deleted entry is not resurrected from the other phone", () => {
    const r = mergeStates(S({ entries: [e("e1", 1)], tombstones: [{ id: "e2", at: 5 }] }), S({ entries: [e("e1", 1), e("e2", 2)] }));
    assert.deepEqual(r.entries.map((x: any) => x.id), ["e1"]);
    assert.ok(r.tombstones.some((t: any) => t.id === "e2"));
  });

  test("same entry edited on both phones: newer updatedAt wins", () => {
    const r = mergeStates(S({ entries: [e("e1", 10, "phone")] }), S({ entries: [e("e1", 20, "cloud")] }));
    assert.equal(r.entries[0].text, "cloud");
  });

  test("same chat on both phones: messages unioned in time order", () => {
    const m = (id: string, at: number) => ({ id, role: "user", text: id, at });
    const r = mergeStates(
      S({ chats: [{ id: "c1", title: "t", createdAt: 1, updatedAt: 3, messages: [m("a", 1), m("c", 3)] }] }),
      S({ chats: [{ id: "c1", title: "t", createdAt: 1, updatedAt: 2, messages: [m("a", 1), m("b", 2)] }] }),
    );
    assert.deepEqual(r.chats[0].messages.map((x: any) => x.id), ["a", "b", "c"]);
  });

  test("check-ins merge by date, local wins a tie", () => {
    const c = (date: string, mood: number) => ({ date, mood, sleep: 3, screen: 0, stress: 3 });
    const r = mergeStates(S({ checkins: [c("2026-10-01", 2)] }), S({ checkins: [c("2026-10-01", 5), c("2026-10-02", 4)] }));
    assert.deepEqual(r.checkins.map((x: any) => [x.date, x.mood]), [["2026-10-01", 2], ["2026-10-02", 4]]);
  });

  test("forUpload strips anonId, lock and sync", () => {
    const up = forUpload(S({ sync: { rev: 3, dirty: true } }));
    assert.equal("anonId" in up, false);
    assert.equal("lock" in up, false);
    assert.equal("sync" in up, false);
  });

  test("nothing is uploaded without a session token or before onboarding", () => {
    assert.equal(canUpload(S({}), null), false);
    assert.equal(canUpload(S({ onboarded: false }), "tok"), false);
    assert.equal(canUpload(S({}), "tok"), true);
  });
  ```
- [ ] **2.** Implement `mergeStates`, `forUpload`, `canUpload` → green.
- [ ] **3. Server** routes + `db.ts` + `session.ts`. Local check with a real Neon `DATABASE_URL` in `.env.local`: `curl -i localhost:8081/api/sync` → 401; `curl -s localhost:8081/api/delete-account | head` → HTML. Paste outputs.
- [ ] **4. Client** `auth.ts`: `GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID })`; `signIn()` → `idToken` → `/api/auth/google` → store token in SecureStore; `signOut()` revokes server session + `GoogleSignin.signOut()` + delete token. `resetAll()` (Delete everything) calls `signOut()` FIRST.
- [ ] **5. Sync engine** `syncNow()`: pull on sign-in and app start; mark `sync.dirty` on every `update()` while signed in; push 30 s after the last change and when the app goes to background; on 409 pull → merge → push once more; offline → keep dirty, retry next time. Show "Last synced 2 min ago" in Account.
- [ ] **6. Account screen:** sign in button (Google logo per Google branding), signed-in email, "Sync now", sign out, "Delete my account and data" (confirm twice; calls `DELETE /api/account`, then local `resetAll()`).
- [ ] **7. Onboarding:** after the last onboarding step, one optional screen "Back up with Google?" (Skip is equally prominent).
- [ ] **8. Two-device check:** two emulators or emulator + phone: create entries on both offline, go online, both end with both entries; delete one on device A → disappears on B after sync. Describe what you did in the report.
- [ ] **9.** `npm run verify` → PASS.

## Acceptance
- [ ] 8 sync tests pass.
- [ ] `GET /api/sync` without a token → 401; with a token for user A never returns user B's data (test by hand with two accounts or two tokens).
- [ ] Delete account removes the user's rows (`select count(*) from user_state where user_id=…` → 0) and wipes the phone.
- [ ] The web deletion page works without the app.

## Stop and ask if
- Google sign-in returns DEVELOPER_ERROR (almost always a SHA-1 / client id mismatch — ask the owner, don't change the package name);
- `jose` verification exceeds the EAS CPU limit after deploy (paste the error);
- you think any field should not sync.

## Do not touch
`src/safety/*`, `/api/pulse` behaviour (campus stays anonymous), instruments.

## Completion report
**4 Nov 2026 (Claude).** Code done and checked; switching it on needs the owner's Google Cloud and Neon steps below.

What was built:
- Server: `src/server/{db,session,google,rateLimit}.ts`, routes `api/auth/google`, `api/auth/signout`, `api/sync`, `api/account`, `api/delete-account`. Tables are created on first use. Session tokens are stored only as SHA-256. Sync is one envelope per user with a revision; `PUT /api/sync?base=N` returns 409 if another phone wrote first.
- Phone: `src/lib/sync.ts` (merge, tombstones for deletions, per-phone fields never uploaded), `src/lib/cloud.ts` (sign in/out, `syncNow`, auto-sync 20 s after a change and when the app goes to the background), `src/features/account/google.ts`, Backup screen `src/app/profile/account.tsx`, optional onboarding step, Delete everything signs out first.
- Field decisions: not synced = `anonId`, app lock, sync info, active chat, voice recordings, songs added from the phone, pending transcripts. Everything else syncs.

Checks:
- 14 sync tests (`src/lib/sync.test.ts`).
- Server against a real Postgres 17 (`scripts/m11-server-check.mts`, instructions in its header): valid and invalid Google tokens (garbage, wrong audience/issuer, unverified email, expired), 401s, first write, stale write 409, isolation between two users, bad body 400, over 3 MB 413, second phone restore, sign-out ends one session only, account delete cascades and leaves other users alone, deletion page escapes input. All pass; red-checked.
- Not done: step 8 with real Google accounts on two devices. It needs the OAuth clients; the two-phone case is covered by the server check (two sessions, one account) and the merge tests.

### Done on 7 Nov 2026 (owner signed in, Claude did the clicks)
- Google Cloud project `max-companion-514004` (owner rudroidm@gmail.com): consent screen "MAX", External, **Testing** mode (publishing needs a privacy-policy URL on the Branding page first; until then add each tester under Audience → Test users, up to 100).
- Web client `123498008922-r3scs585958v0ansp6faqcfetf3bfk05.apps.googleusercontent.com` (no secret needed by MAX). Android client for `com.eg18.max` with the debug-keystore SHA-1.
- Expo environment: `ADMIN_EMAILS`, `DATABASE_URL` (Secret, the existing Neon `max-db`, US East), `GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`; the client ID is also in `.env.local` for local builds.
- `DATABASE_URL` must be **Sensitive**, not Secret: EAS Hosting does not deploy Secret variables. Preview `https://max-companion--cis6ho7h8e.expo.app` checked: database reachable (tables created), Google audience set (bad token → 401 invalid-token). Still to do: add test users, promote to production (owner), rebuild the APK.

### Owner steps (all free, no card)
1. **Google Cloud** (console.cloud.google.com): new project "MAX" → OAuth consent screen: External, app name MAX, support email, scopes `openid`, `email`, `profile` only (these need no Google review) → **Publish app** (otherwise only test users can sign in).
2. **Web client:** Credentials → Create OAuth client → *Web application*. Its client ID goes into two variables: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (app build) and `GOOGLE_WEB_CLIENT_ID` (server).
3. **Android client(s):** Create OAuth client → *Android*, package `com.eg18.max`, one per signing key SHA-1:
   - local builds (debug keystore): `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`;
   - EAS builds: SHA-1 from `eas credentials` → Android → Keystore;
   - Play Store: the "App signing key" SHA-1 from Play Console.
   A missing SHA-1 shows as `DEVELOPER_ERROR` when signing in.
4. **Neon** (neon.tech): new project, region Singapore. Copy the pooled connection string → `DATABASE_URL` as an EAS environment variable (sensitive) and in `.env.local` for local runs.
5. Put `GOOGLE_WEB_CLIENT_ID` and `DATABASE_URL` in the EAS server environment and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in the build environment, deploy a preview (`eas deploy`), test sign-in, then promote when happy (owner's call).
6. Rebuild the APK so it contains the client ID. Until then the Backup screen says backup isn't switched on, and onboarding skips the backup step.
7. **Before a wide release:** sign the APK with a private keystore (EAS-managed is fine). Local APKs are signed with the public debug keystore, so anyone could build an app that Google treats as MAX.
8. **Deletion requests from the web page** land in the `deletion_requests` table. Email the address to confirm it's theirs (the page says so), then within 30 days:
   `delete from users where lower(email) = lower('<address>');` (backup and sessions go with it), then `delete from deletion_requests where lower(email) = lower('<address>');`.
