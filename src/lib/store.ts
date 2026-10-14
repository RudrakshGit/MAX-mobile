import { useEffect, useState, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { loadState, saveState, wipeStorage } from "./persist";

// Everything the student writes lives on the phone. Nothing here is sent
// anywhere except chat text (to the reply API) and, only if they opt in,
// the three campus pulse numbers.

export type CheckIn = { date: string; mood: number; sleep: number; screen: number; stress: number; screenMin?: number };
export type Msg = { id: string; role: "user" | "assistant"; text: string; at: number; kind?: "crisis" | "distress" | "offline"; suggest?: { label: string; href: string }[]; emotions?: string[] };
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
export type SafetyPlan = { warningSigns: string; coping: string; people: string; places: string; professionals: string; reasons: string };
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
  simpleFont: boolean;
  themePreference?: "system" | "light" | "dark";
  results: Result[];
  reframes: Reframe[];
  plans: Plan[];
  phoneDays: { date: string; minutes: Record<string, number> }[];
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
  simpleFont: false,
  themePreference: "light",
  results: [],
  reframes: [],
  plans: [],
  phoneDays: [],
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

export function deleteChat(id: string) {
  update((s) => {
    const remaining = s.chats.filter((c) => c.id !== id);
    const activeChatId = s.activeChatId === id ? remaining[0]?.id : s.activeChatId;
    return { chats: remaining, activeChatId };
  });
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

export function update(fn: (s: State) => Partial<State>) {
  state = { ...state, ...fn(state) };
  listeners.forEach((l) => l());
  saveState(state);
}

export function replaceState(newState: State) {
  state = newState;
  listeners.forEach((l) => l());
  saveState(state);
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

