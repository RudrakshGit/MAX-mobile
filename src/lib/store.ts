import { useEffect, useState, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { loadState, saveState, wipeStorage } from "./persist";

// Everything the student writes lives on the phone. Nothing here is sent
// anywhere except chat text (to the reply API) and, only if they opt in,
// the three campus pulse numbers.

export type CheckIn = { date: string; mood: number; sleep: number; screen: number; stress: number; screenMin?: number };
export type Entry = { id: string; at: number; text: string; prompt?: string };
export type Msg = { id: string; role: "user" | "assistant"; text: string; at: number; kind?: "crisis" | "distress" | "offline"; suggest?: { label: string; href: string }[] };
export type Result = { id: string; checkup: string; at: number; score: number; band: string; detail?: string; flag?: boolean };
export type Reframe = { id: string; at: number; situation: string; thought: string; trap: string; balanced: string };
export type Plan = { id: string; at: number; trigger: string; usual: string; instead: string };

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
  messages: Msg[];
  results: Result[];
  reframes: Reframe[];
  plans: Plan[];
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
  messages: [],
  results: [],
  reframes: [],
  plans: [],
});

let state = initialState();
const listeners = new Set<() => void>();

export async function hydrate() {
  state = await loadState(initialState);
  listeners.forEach((l) => l());
}

export function update(fn: (s: State) => Partial<State>) {
  state = { ...state, ...fn(state) };
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
