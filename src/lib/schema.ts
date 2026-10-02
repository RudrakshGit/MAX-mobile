import type { CheckIn, Entry, Msg, Plan, Reframe, Result, State } from "./store";

// Pure: no storage imports, so Node can test it.
// Everything on the phone is stored as one versioned envelope. Reading is
// defensive: whatever an older build, a hand edit or a failed write left
// behind is cleaned field by field, never trusted, so a new build can always
// open an old install's data without crashing.

export const SCHEMA_VERSION = 2;

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => !!x && typeof x === "object" && !Array.isArray(x);
const str = (x: unknown, max = 5000) => (typeof x === "string" ? x.slice(0, max) : undefined);
const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const int = (x: unknown, lo: number, hi: number) => (Number.isInteger(x) && (x as number) >= lo && (x as number) <= hi ? (x as number) : undefined);
const list = (x: unknown): Obj[] => (Array.isArray(x) ? x.filter(isObj) : []);

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const KINDS = new Set(["crisis", "distress", "offline"]);
const CHECKUPS = new Set(["phq9", "gad7", "cbi", "tech"]);
export const MAX_MESSAGES = 300;

function checkins(x: unknown): CheckIn[] {
  const byDate = new Map<string, CheckIn>();
  for (const o of list(x)) {
    const date = str(o.date);
    const mood = int(o.mood, 1, 5), sleep = int(o.sleep, 1, 5), stress = int(o.stress, 1, 5);
    const screen = num(o.screen);
    if (!date || !DATE.test(date) || !mood || !sleep || !stress || screen === undefined || screen < 0) continue;
    byDate.set(date, { date, mood, sleep, stress, screen, screenMin: num(o.screenMin) });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function entries(x: unknown): Entry[] {
  return list(x).flatMap((o) => {
    const text = str(o.text, 20000);
    return text?.trim() ? [{ id: str(o.id) ?? idFrom(o), at: num(o.at) ?? 0, text, prompt: str(o.prompt, 200) }] : [];
  });
}

function messages(x: unknown): Msg[] {
  return list(x)
    .flatMap((o): Msg[] => {
      const role = o.role === "user" || o.role === "assistant" ? o.role : null;
      const text = str(o.text, 20000);
      const kind = typeof o.kind === "string" && KINDS.has(o.kind) ? (o.kind as Msg["kind"]) : undefined;
      if (!role || text === undefined || (!text && kind !== "crisis")) return [];
      const suggest = list(o.suggest).flatMap((s) => (str(s.label, 60) && str(s.href, 80)?.startsWith("/") ? [{ label: s.label as string, href: s.href as string }] : []));
      return [{ id: str(o.id) ?? idFrom(o), role, text, at: num(o.at) ?? 0, kind, suggest: suggest.length ? suggest : undefined }];
    })
    .slice(-MAX_MESSAGES);
}

function results(x: unknown): Result[] {
  return list(x).flatMap((o) => {
    const checkup = str(o.checkup), band = str(o.band, 60), score = num(o.score);
    if (!checkup || !CHECKUPS.has(checkup) || !band || score === undefined) return [];
    return [{ id: str(o.id) ?? idFrom(o), checkup, at: num(o.at) ?? 0, score, band, detail: str(o.detail, 120), flag: o.flag === true ? true : undefined }];
  });
}

function reframes(x: unknown): Reframe[] {
  return list(x).flatMap((o) => {
    const [situation, thought, trap, balanced] = [str(o.situation), str(o.thought), str(o.trap, 60), str(o.balanced)];
    return situation && thought && trap && balanced ? [{ id: str(o.id) ?? idFrom(o), at: num(o.at) ?? 0, situation, thought, trap, balanced }] : [];
  });
}

function plans(x: unknown): Plan[] {
  return list(x).flatMap((o) => {
    const [trigger, usual, instead] = [str(o.trigger, 300), str(o.usual, 300), str(o.instead, 300)];
    return trigger && usual && instead ? [{ id: str(o.id) ?? idFrom(o), at: num(o.at) ?? 0, trigger, usual, instead }] : [];
  });
}

const idFrom = (o: Obj) => `r${num(o.at) ?? 0}${Math.random().toString(36).slice(2, 7)}`;

/** Turns anything into a valid State: unknown fields dropped, bad ones replaced by the default. */
export function sanitize(raw: unknown, fresh: () => State): State {
  const d = fresh();
  if (!isObj(raw)) return d;
  const companion = (str(raw.companion, 40) ?? "").replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 20);
  const campus = str(raw.campus, 20);
  const anon = str(raw.anonId, 40);
  const remindAt = str(raw.remindAt, 5), bedtime = str(raw.bedtime, 5);
  return {
    onboarded: raw.onboarded === true,
    companion: companion || d.companion,
    consentAt: num(raw.consentAt),
    campus: campus && /^[A-Z0-9-]{2,20}$/.test(campus) ? campus : undefined,
    anonId: anon && /^[a-z0-9]{8,40}$/.test(anon) ? anon : d.anonId,
    shareContext: typeof raw.shareContext === "boolean" ? raw.shareContext : d.shareContext,
    remindAt: remindAt && HHMM.test(remindAt) ? remindAt : undefined,
    bedtime: bedtime && HHMM.test(bedtime) ? bedtime : undefined,
    lock: raw.lock === true,
    checkins: checkins(raw.checkins),
    entries: entries(raw.entries),
    messages: messages(raw.messages),
    results: results(raw.results),
    reframes: reframes(raw.reframes),
    plans: plans(raw.plans),
  };
}

/** Accepts the v2 envelope or a bare v1 state. Returns null when the blob is unusable. */
export function parse(blob: string, fresh: () => State): State | null {
  let json: unknown;
  try {
    json = JSON.parse(blob);
  } catch {
    return null;
  }
  if (!isObj(json)) return null;
  const version = num(json.version);
  if (version !== undefined && version > SCHEMA_VERSION) return null; // written by a newer build: don't guess
  return sanitize(version === undefined ? json : json.state, fresh);
}

