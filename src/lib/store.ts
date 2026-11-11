import { useEffect, useState, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { loadState, saveState, wipeStorage } from "./persist";

// Everything the student writes lives on the phone. It leaves only as chat text (to the reply API), journal text
// or voice for AI help when those are switched on, the Google backup when signed in (src/lib/cloud.ts), and,
// only if they join their college, the day's check-in numbers (src/lib/api.ts sendPulse).

export type CheckIn = {
  date: string;
  mood: number;
  sleep: number;
  screen: number;
  stress: number;
  screenMin?: number;
  /** optional "one small thing that went okay today" */
  win?: string;
  /** when the check-in was saved (ms); used to learn the student's usual check-in time */
  at?: number;
};
export type Msg = { id: string; role: "user" | "assistant"; text: string; at: number; kind?: "crisis" | "distress" | "care" | "offline"; suggest?: { label: string; href: string }[]; emotions?: string[] };
export type Chat = { id: string; title: string; createdAt: number; updatedAt: number; messages: Msg[] };
export type Entry = {
  id: string;
  at: number;
  updatedAt: number;
  mood?: number; // 1–5
  feelings: string[]; // ≤3, ids from src/content/feelings.ts (M05)
  influences: string[]; // ≤2
  text?: string;
  prompt?: string;
  audio?: { uri: string; ms: number; levels: number[] }; // M06
  transcript?: { raw?: string; roman?: string; status: "pending" | "done" | "failed" };
  reflection?: string;
};
export type Insight = { date: string; title: string; sections: { tag: string; heading: string; body: string }[] };
export type MusicApp = "spotify" | "ytmusic" | "jiosaavn";
export type MusicNeed = "calm" | "anxiety" | "focus" | "sleep" | "noise" | "uplift";
export type MyTrack = {
  id: string;
  kind: "link" | "file";
  title: string;
  /** link: an https address that opens in the music app or browser */
  url?: string;
  /** file: a copy inside MAX's own storage (documentDirectory/music/) */
  uri?: string;
  /** detected from the link */
  platform?: "spotify" | "ytmusic" | "youtube" | "jiosaavn" | "apple" | "other";
  need?: MusicNeed;
  addedAt: number;
};
/** One finished day of phone use. `v: 2` marks days measured with the corrected method (Nov 2026). */
export type PhoneDay = { date: string; minutes: Record<string, number>; screenOn?: number; pickups?: number; v?: number };
export type SafetyPlan = {
  warningSigns: string;
  coping: string;
  people: string;
  places: string;
  professionals: string;
  reasons: string;
  /** One person the student can call right now; shown as a call button on the Help screen. */
  callName?: string;
  callPhone?: string;
};
export type Consents = { ai: boolean; voice: boolean; sync: boolean; at?: number };
export type Reframe = { id: string; at: number; situation: string; thought: string; trap: string; balanced: string };
export type Result = {
  id: string;
  checkup: string;
  at: number;
  score: number;
  band?: string;
  detail?: string;
  flag?: boolean;
  parts?: Record<string, number>;
  top?: string[];
  incomplete?: boolean;
};
export type Plan = { id: string; at: number; trigger: string; usual: string; instead: string };

/** "Did that help?" after a tool, sound or lesson; drives what MAX suggests next time. */
export type Helped = { id: string; tool: string; at: number; helped: boolean; mood?: number };
export type Exam = { id: string; name: string; date: string };
/** Sync bookkeeping for this phone (never uploaded). The session token itself lives in SecureStore. */
export type SyncInfo = { email?: string; name?: string; rev: number; lastHash?: string; lastAt?: number; error?: string };
export type ReminderPrefs = {
  /** check-in reminder: "fixed" at remindAt; "smart" moves it up to an hour toward the usual check-in time */
  mode: "smart" | "fixed" | "off";
  /** the evening before an exam in `exams`, a brain-dump note instead of the usual one */
  exams: boolean;
  /** the offer after the first check-in was answered (yes or no), so it isn't shown again */
  asked?: boolean;
};

export type CollegeLink = {
  id: string;
  name: string;
  city: string;
  /** 1–5, or 6 for postgraduate; only if the student chose to share it */
  year?: number;
  counsellor?: { name: string; phone: string; hours?: string };
  exams: { name: string; date: string }[];
  joinedAt: number;
  /** the college stopped taking check-ins (left MAX or was removed) */
  gone?: boolean;
};

export type Activity = { date: string; kind: "learn" | "do" | "log" | "journal"; ref?: string };

export type State = {
  onboarded: boolean;
  companion: string;
  consentAt?: number;
  campus?: string;
  anonId: string;
  shareContext: boolean;
  remindAt?: string; // "21:00"
  bedtime?: string; // "23:30"
  lock: boolean;
  checkins: CheckIn[];
  entries: Entry[];
  chats: Chat[];
  activeChatId?: string;
  displayName?: string;
  avatar?: string;
  courseProgress: Record<string, { done: number[]; unhelpful: number[] }>;
  insights: Insight[];
  cardHistory: { id: string; date: string; less?: boolean }[];
  activity: Activity[];
  values: string[];
  safetyPlan?: SafetyPlan;
  consents: Consents;
  musicRecent: { id: string; at: number }[];
  /** The student's own music: links to playlists/songs, or audio files copied into MAX from the phone. */
  myMusic: MyTrack[];
  /** Music apps the student uses; editorial playlists for other apps are hidden. Empty = show all. */
  musicApps: MusicApp[];
  simpleFont: boolean;
  themePreference?: "system" | "light" | "dark";
  /** How much MAX moves: normal; calm (settles still after a few seconds, no idle gestures); still (no motion). */
  maxMotion?: "normal" | "calm" | "still";
  results: Result[];
  reframes: Reframe[];
  plans: Plan[];
  phoneDays: PhoneDay[];
  /** ids deleted on this phone, so a sync never brings them back (keep 1000) */
  tombstones: { id: string; at: number }[];
  sync?: SyncInfo;
  helped: Helped[];
  exams: Exam[];
  reminders: ReminderPrefs;
  /** last time the app was opened (ms) */
  lastOpenAt?: number;
  /** a campus counsellor or mentor, shown on the Help screen */
  counsellor?: { name: string; phone: string };
  /** the college this phone shares anonymous check-ins with (docs/history.md); its presence is the consent */
  college?: CollegeLink;
};

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const initialState = (): State => ({
  onboarded: false,
  companion: "Max",
  anonId: newId() + newId(),
  shareContext: true,
  lock: false,
  checkins: [],
  entries: [],
  chats: [],
  courseProgress: {},
  insights: [],
  cardHistory: [],
  activity: [],
  values: [],
  consents: { ai: false, voice: false, sync: false },
  musicRecent: [],
  myMusic: [],
  musicApps: [],
  simpleFont: false,
  themePreference: "light",
  results: [],
  reframes: [],
  plans: [],
  phoneDays: [],
  tombstones: [],
  helped: [],
  exams: [],
  reminders: { mode: "off", exams: true },
});

let state = initialState();
const listeners = new Set<() => void>();

export function activeChat(s: State): Chat | undefined {
  if (s.activeChatId) {
    const found = s.chats.find((c) => c.id === s.activeChatId);
    if (found) return found;
  }
  return s.chats[0];
}

export function startChat(): string {
  // an empty conversation is reused, so tapping "New" again never piles up blank chats (or pushes a real one out)
  const blank = getState().chats.find((c) => c.messages.length === 0);
  if (blank) {
    update(() => ({ activeChatId: blank.id }));
    return blank.id;
  }
  const id = newId();
  const now = Date.now();
  const chat: Chat = { id, title: "New conversation", createdAt: now, updatedAt: now, messages: [] };
  update((s) => ({
    chats: [chat, ...s.chats].slice(0, 50),
    activeChatId: id,
  }));
  return id;
}

export function addMessage(chatId: string, m: Omit<Msg, "id" | "at">) {
  const now = Date.now();
  const msg: Msg = { ...m, id: newId(), at: now };
  update((s) => ({
    chats: s.chats.map((c) => {
      if (c.id !== chatId) return c;
      const title = c.messages.length === 0 && m.role === "user" ? m.text.trim().slice(0, 40) || c.title : c.title;
      return {
        ...c,
        title,
        updatedAt: now,
        messages: [...c.messages, msg].slice(-300),
      };
    }),
  }));
}

/** Records deleted ids so a sync from another phone never brings them back. */
export const tombstone = (s: State, ...ids: string[]) =>
  [...ids.map((id) => ({ id, at: Date.now() })), ...s.tombstones.filter((t) => !ids.includes(t.id))].slice(0, 1000);

export function deleteChat(id: string) {
  update((s) => {
    const remaining = s.chats.filter((c) => c.id !== id);
    const activeChatId = s.activeChatId === id ? remaining[0]?.id : s.activeChatId;
    return { chats: remaining, activeChatId, tombstones: tombstone(s, id) };
  });
}

export function deleteEntry(id: string) {
  update((s) => ({ entries: s.entries.filter((e) => e.id !== id), tombstones: tombstone(s, id) }));
}

export function renameChat(id: string, title: string) {
  const clean = title.trim().slice(0, 40);
  if (!clean) return;
  update((s) => ({
    chats: s.chats.map((c) => (c.id === id ? { ...c, title: clean } : c)),
  }));
}

export async function hydrate() {
  state = await loadState(initialState);
  listeners.forEach((l) => l());
}

// Non-React observers (the backup engine) get the state before and after each change.
const changeListeners = new Set<(prev: State, next: State) => void>();
export function onStateChange(cb: (prev: State, next: State) => void) {
  changeListeners.add(cb);
  return () => changeListeners.delete(cb);
}

function commit(next: State) {
  const prev = state;
  state = next;
  listeners.forEach((l) => l());
  saveState(state);
  changeListeners.forEach((l) => l(prev, next));
}

export function update(fn: (s: State) => Partial<State>) {
  commit({ ...state, ...fn(state) });
}

export function replaceState(newState: State) {
  commit(newState);
}

/** Wipes every trace on this phone and returns to a first-run state. */
export async function resetAll() {
  state = initialState();
  listeners.forEach((l) => l());
  await wipeStorage();
}

export const getState = () => state;

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Select a slice. Return existing references, never build new objects here. */
export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}

export function today(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Today's date, refreshed when the app returns to the foreground or the clock passes midnight. */
export function useToday() {
  const [d, setD] = useState(today);
  useEffect(() => {
    const refresh = () => setD((prev) => (prev === today() ? prev : today()));
    const sub = AppState.addEventListener("change", (st) => st === "active" && refresh());
    const tick = setInterval(refresh, 60_000);
    return () => {
      sub.remove();
      clearInterval(tick);
    };
  }, []);
  return d;
}

export function logActivity(kind: Activity["kind"], ref?: string, date = today()) {
  update((s) => {
    const list = s.activity ?? [];
    if (list.some((a) => a.date === date && a.kind === kind && a.ref === ref)) {
      return s;
    }
    return {
      activity: [{ date, kind, ...(ref ? { ref } : {}) }, ...list].slice(0, 120),
    };
  });
}

export function logMusicRecent(id: string, at = Date.now()) {
  update((s) => {
    const list = (s.musicRecent ?? []).filter((m) => m.id !== id);
    return {
      musicRecent: [{ id, at }, ...list].slice(0, 20),
    };
  });
}

