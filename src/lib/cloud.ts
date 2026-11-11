import { AppState } from "react-native";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "./api";
import { parse, SCHEMA_VERSION } from "./schema";
import { canUpload, forUpload, hashText, mergeStates } from "./sync";
import { getState, initialState, onStateChange, replaceState, update, type State } from "./store";
import { googleIdToken, googleSignOut } from "@/features/account/google";

// Optional "Back up with Google". The session token lives in the Android keystore (SecureStore), never in the
// state that is saved, exported or uploaded. Everything here fails soft: no network means "try later".

const TOKEN_KEY = "max.session";
let token: string | null | undefined; // undefined = not read yet

async function getToken(): Promise<string | null> {
  if (token === undefined) token = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
  return token;
}
async function setToken(t: string | null) {
  token = t;
  if (t) await SecureStore.setItemAsync(TOKEN_KEY, t);
  else await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
}

export const isSignedIn = () => !!getState().sync?.email;

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

export type SignInResult = { ok: true } | { ok: false; reason: "cancelled" | "not-configured" | "offline" | "failed" };

export async function signIn(): Promise<SignInResult> {
  const g = await googleIdToken();
  if (!g.ok) return g;
  try {
    const res = await apiFetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: g.idToken }),
    });
    if (res.status === 503) return { ok: false, reason: "not-configured" };
    if (!res.ok) return { ok: false, reason: "failed" };
    const data = await res.json();
    await setToken(data.token);
    update(() => ({ sync: { email: data.email, ...(data.name ? { name: data.name } : {}), rev: 0 }, consents: { ...getState().consents, sync: true } }));
    await syncNow();
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: (e as Error).message === "offline" ? "offline" : "failed" };
  }
}

/** A request with this phone's session (college screens). null when signed out; a 401 signs this phone out. */
export async function authFetch(path: string, init: RequestInit = {}, ms?: number): Promise<Response | null> {
  const t = await getToken();
  if (!t) return null;
  const res = await apiFetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init.headers as object), ...auth(t) } }, ms);
  if (res.status === 401) await expired();
  return res;
}

/** Ends this phone's session; the backup stays on the server. Local data stays on the phone. */
export async function signOut() {
  const t = await getToken();
  if (t) await apiFetch("/api/auth/signout", { method: "POST", headers: auth(t) }, 8000).catch(() => {});
  await googleSignOut();
  await setToken(null);
  update((s) => ({ sync: undefined, consents: { ...s.consents, sync: false } }));
}

/** Deletes the account and the backup on the server. The caller then wipes the phone. */
export async function deleteAccount(): Promise<"ok" | "offline" | "failed"> {
  const t = await getToken();
  if (!t) return "failed";
  try {
    const res = await apiFetch("/api/account", { method: "DELETE", headers: auth(t) }, 15_000);
    if (res.status !== 204 && res.status !== 401) return "failed";
  } catch {
    return "offline";
  }
  await googleSignOut();
  await setToken(null);
  return "ok";
}

export type SyncResult = "ok" | "signed-out" | "offline" | "too-large" | "failed";
let running: Promise<SyncResult> | null = null;

/** Pull, merge, push. Safe to call often; concurrent calls share one run. */
export function syncNow(): Promise<SyncResult> {
  running ??= run().finally(() => {
    running = null;
  });
  return running;
}

async function run(attempt = 0): Promise<SyncResult> {
  const t = await getToken();
  const s0 = getState();
  if (!t || !s0.sync?.email) return "signed-out";
  try {
    // 1. Pull (the server answers "unchanged" when we already have its latest revision).
    const pull = await apiFetch(`/api/sync?rev=${s0.sync.rev}`, { headers: auth(t) }, 30_000);
    if (pull.status === 401) return await expired();
    if (!pull.ok) return fail("failed");
    const remote = await pull.json();
    let rev: number = remote.rev ?? 0;
    if (remote.envelope && !remote.unchanged) {
      const parsed = parse(remote.envelope, initialState);
      if (parsed) {
        const merged = mergeStates(getState(), parsed);
        replaceState({ ...merged, sync: { ...(getState().sync as NonNullable<State["sync"]>), rev } });
      }
    }

    // A phone still in onboarding only restores; it never uploads its empty state over a backup.
    if (!canUpload(getState(), t)) {
      update((s) => (s.sync ? { sync: { ...s.sync, rev, lastAt: Date.now() } } : {}));
      return "ok";
    }

    // 2. Push only if something changed since the last upload.
    const body = JSON.stringify({ version: SCHEMA_VERSION, state: forUpload(getState()) });
    const hash = hashText(body);
    if (hash === getState().sync?.lastHash && rev > 0) return done(rev, hash);
    const push = await apiFetch(`/api/sync?base=${rev}`, { method: "PUT", headers: { ...auth(t), "Content-Type": "application/json" }, body }, 45_000);
    if (push.status === 409 && attempt < 2) return run(attempt + 1); // another phone wrote first: pull, merge, retry
    if (push.status === 413) return fail("too-large");
    if (push.status === 401) return await expired();
    if (!push.ok) return fail("failed");
    rev = (await push.json()).rev;
    return done(rev, hash);
  } catch {
    return "offline";
  }
}

function done(rev: number, lastHash: string): SyncResult {
  update((s) => (s.sync ? { sync: { ...s.sync, rev, lastHash, lastAt: Date.now(), error: undefined } } : {}));
  return "ok";
}

function fail(r: SyncResult): SyncResult {
  update((s) => (s.sync ? { sync: { ...s.sync, error: r } } : {}));
  return r;
}

async function expired(): Promise<SyncResult> {
  // The session was ended elsewhere (signed out on the server or account deleted): sign out here too.
  await setToken(null);
  update((s) => ({ sync: undefined, consents: { ...s.consents, sync: false } }));
  return "signed-out";
}

let started = false;
/** Starts automatic backup: on launch, 20 s after the last change, and when the app goes to the background. */
export function startAutoSync() {
  if (started) return;
  started = true;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedule = (ms: number) => {
    if (!isSignedIn()) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void syncNow(), ms);
  };
  onStateChange((prev, next) => {
    // Ignore changes that are only sync bookkeeping or per-device fields, or the loop would never stop.
    for (const k of Object.keys(next) as (keyof State)[]) {
      if (k === "sync" || k === "lastOpenAt" || k === "activeChatId" || k === "lock") continue;
      if (prev[k] !== next[k]) return schedule(20_000);
    }
  });
  AppState.addEventListener("change", (st) => {
    if (st === "background" && isSignedIn()) void syncNow();
    if (st === "active") schedule(1500);
  });
  schedule(1500);
}
