import { wellbeingContext, type InsightSignals } from "./insights";
import { getState, update, type CheckIn, type Msg, type Insight } from "./store";
import { chatPayload } from "./chat-payload";
import { isWeb } from "./platform";

// In development, relative URLs reach the dev server. A release build needs
// EXPO_PUBLIC_API_URL set to the deployed server (see eas.json).
// On the web the app is served by the same server, so it calls its own origin.
const BASE = __DEV__ ? "http://localhost:8081" : isWeb ? "" : (process.env.EXPO_PUBLIC_API_URL ?? "");

export type Reply = { kind: "reply"; text: string; distress?: boolean; care?: boolean; emotions?: string[] } | { kind: "crisis" };

/**
 * A release build needs an https server address. Without one, or with a developer address that only works
 * inside an emulator (http, localhost, 10.0.2.2), a phone can never reach the server, so say so honestly
 * ("not connected in this build") instead of blaming the student's internet.
 */
const isPhoneReachable = (u: string) => /^https:\/\//i.test(u) && !/^https:\/\/(localhost|127\.|10\.0\.2\.2)/i.test(u);
export const chatConfigured = __DEV__ || isWeb || (!!BASE && isPhoneReachable(BASE));

/** The server this build talks to, for the Settings connection check. */
export const serverHost = BASE ? BASE.replace(/^https?:\/\//i, "").replace(/\/.*$/, "") : "none";

/** Settings → "Test connection". Calls an endpoint that returns at once without touching the AI. */

/**
 * fetch with a deadline: on a weak 4G connection a request can hang for minutes, and a student
 * should never stare at a "thinking" MAX forever. Errors carry a short reason the UI can explain.
 */
async function call(url: string, init: RequestInit = {}, ms = 25_000): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctl.signal });
  } catch {
    throw new Error("offline");
  } finally {
    clearTimeout(timer);
  }
}

/** Calls a MAX server route; throws Error("offline") on network failure or timeout. */
export function apiFetch(path: string, init: RequestInit = {}, ms = 25_000): Promise<Response> {
  if (!chatConfigured) return Promise.reject(new Error("no-server"));
  return call(`${BASE}${path}`, init, ms);
}

const failure = (status: number) => new Error(status === 429 ? "rate" : status >= 500 ? "busy" : `http-${status}`);

export async function askCompanion(history: Msg[], companion: string): Promise<Reply> {
  if (!chatConfigured) throw new Error("no-server");
  const { messages, afterCrisis } = chatPayload(history);
  const s = getState();
  const context = s.shareContext ? wellbeingContext(s) : "";
  const res = await call(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companion, messages, context, afterCrisis }),
  });
  if (!res.ok) throw failure(res.status);
  return res.json();
}

/**
 * Only after the student chose to share with their college (docs/history.md). Sends a random id, the day's three
 * numbers, the journal categories picked that day and, if given, the year of study: never text or a name.
 */
export function sendPulse(c: CheckIn) {
  const { college, anonId, entries } = getState();
  if (!college || college.gone || !chatConfigured) return;
  const tags = [...new Set(entries.filter((e) => dayOf(e.at) === c.date).flatMap((e) => e.influences))].slice(0, 6);
  call(`${BASE}/api/pulse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ college: college.id, anon: anonId, day: c.date, mood: c.mood, sleep: c.sleep, stress: c.stress, tags, ...(college.year ? { year: college.year } : {}) }),
  })
    .then((res) => {
      if (res.status === 404) update((s) => (s.college ? { college: { ...s.college, gone: true } } : {}));
    })
    .catch(() => {});
}
const dayOf = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};


export async function suggestTags(text: string): Promise<{ feelings: string[]; influences: string[]; roman?: string }> {
  if (!chatConfigured || !text.trim()) return { feelings: [], influences: [] };
  try {
    const res = await call(`${BASE}/api/tag`, {
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
  const res = await call(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "reflect",
      companion,
      messages: [{ role: "user", text: entryText }],
    }),
  });
  if (!res.ok) throw failure(res.status);
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
    const res = await call(`${BASE}/api/insight`, {
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

