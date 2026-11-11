// Merging the phone's state with the cloud copy. Pure (no React Native imports) so Node can test it.
//
// Rules (docs/history.md, updated Nov 2026):
//  - A phone that has not finished onboarding takes the cloud copy (keeping its own per-device fields).
//  - Lists merge by key, newest wins, and anything in either side's tombstones is removed.
//  - Settings and other single values come from this phone.
//  - Per-device data never goes up: the anonymous campus id, app lock, sync bookkeeping, the open chat,
//    voice-recording files and songs copied from this phone.
import type { State } from "./store";

type Tomb = { id: string; at: number };
type Any = Record<string, any>;

const TOMBSTONE_CAP = 1000;
const arr = <T>(x: T[] | undefined): T[] => (Array.isArray(x) ? x : []);

/** Fields that describe this phone, not the student: kept from local, never uploaded. */
const DEVICE_FIELDS = ["anonId", "lock", "sync", "activeChatId"] as const;

function mergeBy<T extends Any>(
  local: T[] | undefined,
  remote: T[] | undefined,
  key: (x: T) => string,
  dead: Set<string>,
  pick: (l: T, r: T) => T = (l) => l,
): T[] {
  const out = new Map<string, T>();
  for (const r of arr(remote)) out.set(key(r), r);
  for (const l of arr(local)) {
    const k = key(l);
    const r = out.get(k);
    out.set(k, r ? pick(l, r) : l);
  }
  return [...out.values()].filter((x) => !dead.has(key(x)) && !(x.id && dead.has(x.id)));
}

export function mergeStates(local: State, remote: State): State {
  const L = local as unknown as Any;
  const R = remote as unknown as Any;

  const tombs = new Map<string, number>();
  for (const t of [...arr<Tomb>(L.tombstones), ...arr<Tomb>(R.tombstones)]) {
    tombs.set(t.id, Math.max(tombs.get(t.id) ?? 0, t.at));
  }
  const dead = new Set(tombs.keys());
  const tombstones = [...tombs.entries()]
    .map(([id, at]) => ({ id, at }))
    .sort((a, b) => b.at - a.at)
    .slice(0, TOMBSTONE_CAP);

  // Single values: this phone's, unless it has not been set up yet.
  const base: Any = L.onboarded ? { ...R, ...L } : { ...L, ...R };
  for (const f of DEVICE_FIELDS) {
    if (f in L) base[f] = L[f];
    else delete base[f];
  }

  const newer = (field: string) => (l: Any, r: Any) => ((r[field] ?? 0) > (l[field] ?? 0) ? r : l);

  const entries = mergeBy(L.entries, R.entries, (x) => x.id, dead, (l, r) => {
    const win = newer("updatedAt")(l, r);
    // The recording file exists only on the phone that made it.
    return win === r && l.audio && !r.audio ? { ...r, audio: l.audio, ...(l.transcript && !r.transcript ? { transcript: l.transcript } : {}) } : win;
  }).sort((a, b) => b.at - a.at);

  const chats = mergeBy(L.chats, R.chats, (x) => x.id, dead, (l, r) => {
    const msgs = mergeBy(l.messages, r.messages, (m) => m.id, new Set()).sort((a, b) => a.at - b.at);
    const win = newer("updatedAt")(l, r);
    return { ...win, updatedAt: Math.max(l.updatedAt ?? 0, r.updatedAt ?? 0), messages: msgs.slice(-300) };
  })
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    .slice(0, 50);

  const courseProgress: Any = {};
  for (const id of new Set([...Object.keys(L.courseProgress ?? {}), ...Object.keys(R.courseProgress ?? {})])) {
    const l = L.courseProgress?.[id] ?? {};
    const r = R.courseProgress?.[id] ?? {};
    const u = (a?: number[], b?: number[]) => [...new Set([...arr(a), ...arr(b)])].sort((x, y) => x - y);
    courseProgress[id] = { done: u(l.done, r.done), unhelpful: u(l.unhelpful, r.unhelpful) };
  }

  const merged: Any = {
    ...base,
    checkins: mergeBy(L.checkins, R.checkins, (x) => x.date, dead).sort((a, b) => a.date.localeCompare(b.date)),
    entries,
    chats,
    results: mergeBy(L.results, R.results, (x) => x.id, dead).sort((a, b) => a.at - b.at),
    reframes: mergeBy(L.reframes, R.reframes, (x) => x.id, dead).sort((a, b) => a.at - b.at),
    plans: mergeBy(L.plans, R.plans, (x) => x.id, dead).sort((a, b) => a.at - b.at),
    insights: mergeBy(L.insights, R.insights, (x) => x.date, dead).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60),
    activity: mergeBy(L.activity, R.activity, (x) => `${x.date}|${x.kind}|${x.ref ?? ""}`, dead)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 120),
    cardHistory: mergeBy(L.cardHistory, R.cardHistory, (x) => `${x.id}|${x.date}`, dead),
    musicRecent: mergeBy(L.musicRecent, R.musicRecent, (x) => x.id, dead, newer("at"))
      .sort((a, b) => b.at - a.at)
      .slice(0, 20),
    myMusic: mergeBy(L.myMusic, R.myMusic, (x) => x.id, dead).sort((a, b) => b.addedAt - a.addedAt).slice(0, 200),
    phoneDays: mergeBy(L.phoneDays, R.phoneDays, (x) => x.date, dead, (l, r) => (r.v === 2 && l.v !== 2 ? r : l))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30),
    helped: mergeBy(L.helped, R.helped, (x) => x.id, dead).sort((a, b) => b.at - a.at).slice(0, 300),
    exams: mergeBy(L.exams, R.exams, (x) => x.id, dead).sort((a, b) => a.date.localeCompare(b.date)),
    courseProgress,
    tombstones,
  };
  if (merged.activeChatId && !merged.chats.some((c: Any) => c.id === merged.activeChatId)) delete merged.activeChatId;
  return merged as State;
}

/** What goes to the server: everything about the student, nothing about this particular phone. */
export function forUpload(state: State): Any {
  const s: Any = { ...state };
  for (const f of DEVICE_FIELDS) delete s[f];
  s.entries = arr<Any>(s.entries).map((e) => {
    const { audio: _a, ...rest } = e;
    // A pending transcript can only run where the recording is.
    if (rest.transcript && rest.transcript.status !== "done") delete rest.transcript;
    return rest;
  });
  s.myMusic = arr<Any>(s.myMusic).filter((t) => t.kind === "link");
  return s;
}

export function canUpload(state: State, token: string | null): boolean {
  return !!token && state.onboarded === true;
}

/** FNV-1a; detects "nothing changed since the last upload" without keeping a copy. */
export function hashText(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36) + ":" + s.length.toString(36);
}
