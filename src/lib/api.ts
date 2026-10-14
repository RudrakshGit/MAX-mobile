import { wellbeingContext, type InsightSignals } from "./insights";
import { getState, type CheckIn, type Msg, type Insight } from "./store";

// In development, relative URLs reach the dev server. A release build needs
// EXPO_PUBLIC_API_URL set to the deployed server (see eas.json).
const BASE = __DEV__ ? "http://localhost:8081" : (process.env.EXPO_PUBLIC_API_URL ?? "");

export type Reply = { kind: "reply"; text: string; distress?: boolean; emotions?: string[] } | { kind: "crisis" };

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

export async function suggestTags(text: string): Promise<{ feelings: string[]; influences: string[]; roman?: string }> {
  if (!chatConfigured || !text.trim()) return { feelings: [], influences: [] };
  try {
    const res = await fetch(`${BASE}/api/tag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, roman: true }),
    });
    if (!res.ok) return { feelings: [], influences: [] };
    const data = await res.json().catch(() => null);
    return {
      feelings: Array.isArray(data?.feelings) ? data.feelings : [],
      influences: Array.isArray(data?.influences) ? data.influences : [],
      roman: typeof data?.roman === "string" ? data.roman : undefined,
    };
  } catch {
    return { feelings: [], influences: [] };
  }
}

export async function askReflection(entryText: string): Promise<Reply> {
  if (!chatConfigured) throw new Error("no-server");
  const s = getState();
  const companion = s.companion || "Max";
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "reflect",
      companion,
      messages: [{ role: "user", text: entryText }],
    }),
  });
  if (!res.ok) throw new Error(`reflect ${res.status}`);
  return res.json();
}

export async function transcribeAudioFile(fileUri: string, lang: "hi" | "en" = "hi"): Promise<string | null> {
  if (!chatConfigured) return null;
  try {
    const FileSystem = await import("expo-file-system/legacy");
    const res = await FileSystem.uploadAsync(`${BASE}/api/transcribe`, fileUri, {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        "content-type": "audio/mp4",
        "x-lang": lang,
      },
    });
    if (res.status !== 200) return null;
    const data = JSON.parse(res.body);
    return typeof data?.transcript === "string" ? data.transcript : null;
  } catch (e) {
    console.warn("transcribeAudioFile failed:", e);
    return null;
  }
}

export async function fetchDailyInsight(signals: InsightSignals): Promise<Insight | null> {
  if (!chatConfigured) return null;
  try {
    const res = await fetch(`${BASE}/api/insight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signals),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (data?.insight?.title && Array.isArray(data?.insight?.sections)) {
      return data.insight;
    }
    return null;
  } catch {
    return null;
  }
}

