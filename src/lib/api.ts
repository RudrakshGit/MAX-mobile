import { wellbeingContext } from "./insights";
import { getState, type CheckIn, type Msg } from "./store";

// In development, relative URLs reach the dev server. A release build needs
// EXPO_PUBLIC_API_URL set to the deployed server (see eas.json).
const BASE = process.env.EXPO_PUBLIC_API_URL ?? "";

export type Reply = { kind: "reply"; text: string; distress?: boolean } | { kind: "crisis" };

/** A release build without EXPO_PUBLIC_API_URL has nowhere to send chat. */
export const chatConfigured = __DEV__ || !!BASE;

export async function askCompanion(history: Msg[], companion: string): Promise<Reply> {
  if (!chatConfigured) throw new Error("no-server");
  const messages = history
    .filter((m) => !m.kind || m.kind === "distress")
    .slice(-20)
    .map((m) => ({ role: m.role, text: m.text }));
  const s = getState();
  const context = s.shareContext ? wellbeingContext(s) : "";
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companion, messages, context }),
  });
  if (!res.ok) throw new Error(`chat ${res.status}`);
  return res.json();
}

/** Opt-in only. Sends three numbers and a random id: never text, never a name. */
export function sendPulse(c: CheckIn) {
  const { campus, anonId } = getState();
  if (!campus) return;
  fetch(`${BASE}/api/pulse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campus, anon: anonId, day: c.date, mood: c.mood, sleep: c.sleep, stress: c.stress }),
  }).catch(() => {});
}

export type CampusPulse = { enough: false } | { enough: true; students: number; mood: number; sleep: number; stress: number; days: { day: string; mood: number }[] };

export async function getCampus(campus: string): Promise<CampusPulse> {
  const res = await fetch(`${BASE}/api/pulse?campus=${encodeURIComponent(campus)}`);
  if (!res.ok) throw new Error(`pulse ${res.status}`);
  return res.json();
}
