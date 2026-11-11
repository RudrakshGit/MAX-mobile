import type {
  CollegeLink,
  Activity,
  Chat,
  CheckIn,
  Consents,
  Entry,
  Insight,
  Exam,
  Helped,
  Msg,
  MusicApp,
  MyTrack,
  PhoneDay,
  Plan,
  Reframe,
  ReminderPrefs,
  Result,
  SafetyPlan,
  SyncInfo,
  State,
} from "./store";

// Pure: no storage imports, so Node can test it.
// Everything on the phone is stored as one versioned envelope. Reading is
// defensive: whatever an older build, a hand edit or a failed write left
// behind is cleaned field by field, never trusted, so a new build can always
// open an old install's data without crashing.

export const SCHEMA_VERSION = 3;

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => !!x && typeof x === "object" && !Array.isArray(x);
const str = (x: unknown, max = 5000) => (typeof x === "string" ? x.slice(0, max) : undefined);
const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const int = (x: unknown, lo: number, hi: number) => (Number.isInteger(x) && (x as number) >= lo && (x as number) <= hi ? (x as number) : undefined);
const list = (x: unknown): Obj[] => (Array.isArray(x) ? x.filter(isObj) : []);

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const KINDS = new Set(["crisis", "distress", "care", "offline"]);
const THEMES = new Set(["system", "light", "dark"]);
const CHECKUPS = new Set([
  "phq9",
  "gad7",
  "cbi",
  "miniIpip",
  "onetMiniIp",
  "saps",
  "brs",
  "rses",
  "who5",
  "loneliness3",
  "asrs6",
  "aq10",
  "bas2",
  "sci",
  "pswq",
  "tech",
]);
export const MAX_MESSAGES = 300;

function checkins(x: unknown): CheckIn[] {
  const byDate = new Map<string, CheckIn>();
  for (const o of list(x)) {
    const date = str(o.date);
    const mood = int(o.mood, 1, 5), sleep = int(o.sleep, 1, 5), stress = int(o.stress, 1, 5);
    const screen = num(o.screen);
    if (!date || !DATE.test(date) || !mood || !sleep || !stress || screen === undefined || screen < 0) continue;
    const win = str(o.win, 140)?.trim();
    const at = num(o.at);
    byDate.set(date, { date, mood, sleep, stress, screen, screenMin: num(o.screenMin), ...(win ? { win } : {}), ...(at ? { at } : {}) });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function entries(x: unknown): Entry[] {
  return list(x).flatMap((o): Entry[] => {
    const id = str(o.id) ?? idFrom(o);
    const at = num(o.at) ?? 0;
    const updatedAt = num(o.updatedAt) ?? at;
    const mood = int(o.mood, 1, 5);
    const feelings = Array.isArray(o.feelings)
      ? o.feelings.filter((f): f is string => typeof f === "string" && f.length > 0 && f.length <= 30).slice(0, 3)
      : [];
    const influences = Array.isArray(o.influences)
      ? o.influences.filter((i): i is string => typeof i === "string" && i.length > 0 && i.length <= 30).slice(0, 2)
      : [];
    const text = str(o.text, 20000);
    const prompt = str(o.prompt, 200);
    const reflection = str(o.reflection, 5000);
    let audio: Entry["audio"];
    if (isObj(o.audio)) {
      const uri = str(o.audio.uri, 500);
      const ms = num(o.audio.ms);
      const levels = Array.isArray(o.audio.levels) ? (o.audio.levels.filter(num) as number[]) : [];
      if (uri && ms !== undefined) audio = { uri, ms, levels };
    }
    let transcript: Entry["transcript"];
    if (isObj(o.transcript)) {
      const raw = str(o.transcript.raw, 20000);
      const roman = str(o.transcript.roman, 20000);
      const status = o.transcript.status === "done" || o.transcript.status === "failed" ? o.transcript.status : "pending";
      transcript = { raw, roman, status };
    }
    return [{
      id,
      at,
      updatedAt,
      mood,
      feelings,
      influences,
      text,
      prompt,
      audio,
      transcript,
      reflection,
    }];
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
      const emotions = Array.isArray(o.emotions)
        ? o.emotions
            .filter((e): e is string => typeof e === "string" && e.length > 0 && e.length <= 30)
            .slice(0, 3)
        : undefined;
      return [{
        id: str(o.id) ?? idFrom(o),
        role,
        text,
        at: num(o.at) ?? 0,
        kind,
        suggest: suggest.length ? suggest : undefined,
        emotions: emotions && emotions.length > 0 ? emotions : undefined,
      }];
    })
    .slice(-MAX_MESSAGES);
}

function sanitizeChats(x: unknown): Chat[] {
  return list(x)
    .map((o): Chat => {
      const id = str(o.id) ?? idFrom(o);
      const title = str(o.title, 40) ?? "Conversation";
      const createdAt = num(o.createdAt) ?? 0;
      const updatedAt = num(o.updatedAt) ?? createdAt;
      const msgs = messages(o.messages);
      return { id, title, createdAt, updatedAt, messages: msgs };
    })
    .slice(0, 50);
}

function insights(x: unknown): Insight[] {
  const byDate = new Map<string, Insight>();
  for (const o of list(x)) {
    const date = str(o.date);
    if (!date || !DATE.test(date)) continue;
    const title = str(o.title, 100) ?? "";
    const sections = list(o.sections).map((s) => ({
      tag: str(s.tag, 40) ?? "",
      heading: str(s.heading, 100) ?? "",
      body: str(s.body, 2000) ?? "",
    }));
    byDate.set(date, { date, title, sections });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-60);
}

function cardHistory(x: unknown): { id: string; date: string; less?: boolean }[] {
  return list(x)
    .flatMap((o) => {
      const id = str(o.id, 60), date = str(o.date);
      if (!id || !date || !DATE.test(date)) return [];
      return [{ id, date, less: o.less === true ? true : undefined }];
    })
    .slice(-120);
}

const ACTIVITY_KINDS = new Set(["learn", "do", "log", "journal"]);

function activity(x: unknown): Activity[] {
  return list(x)
    .flatMap((o): Activity[] => {
      const date = str(o.date);
      const kind = typeof o.kind === "string" && ACTIVITY_KINDS.has(o.kind) ? (o.kind as Activity["kind"]) : null;
      if (!date || !DATE.test(date) || !kind) return [];
      const ref = str(o.ref, 60);
      return [{ date, kind, ...(ref ? { ref } : {}) }];
    })
    .slice(0, 120);
}

function courseProgress(x: unknown): Record<string, { done: number[]; unhelpful: number[] }> {
  if (!isObj(x)) return {};
  const out: Record<string, { done: number[]; unhelpful: number[] }> = {};
  for (const [k, v] of Object.entries(x)) {
    if (!isObj(v)) continue;
    const done = Array.isArray(v.done) ? (v.done.filter((n) => typeof n === "number" && Number.isInteger(n)) as number[]) : [];
    const unhelpful = Array.isArray(v.unhelpful) ? (v.unhelpful.filter((n) => typeof n === "number" && Number.isInteger(n)) as number[]) : [];
    out[k.slice(0, 40)] = { done, unhelpful };
  }
  return out;
}

function musicRecent(x: unknown): { id: string; at: number }[] {
  return list(x)
    .flatMap((o) => {
      const id = str(o.id, 60), at = num(o.at);
      if (!id || at === undefined) return [];
      return [{ id, at }];
    })
    .slice(-20);
}

const NEEDS = new Set(["calm", "anxiety", "focus", "sleep", "noise", "uplift"]);
const PLATFORMS = new Set(["spotify", "ytmusic", "youtube", "jiosaavn", "apple", "other"]);
const APPS = new Set(["spotify", "ytmusic", "jiosaavn"]);

function myMusic(x: unknown): MyTrack[] {
  return list(x)
    .flatMap((o): MyTrack[] => {
      const id = str(o.id, 60), title = str(o.title, 120)?.trim(), addedAt = num(o.addedAt) ?? 0;
      if (!id || !title) return [];
      const need = typeof o.need === "string" && NEEDS.has(o.need) ? (o.need as MyTrack["need"]) : undefined;
      if (o.kind === "link") {
        const url = str(o.url, 500);
        if (!url || !/^https:\/\/[^\s]+$/i.test(url)) return [];
        const platform = typeof o.platform === "string" && PLATFORMS.has(o.platform) ? (o.platform as MyTrack["platform"]) : "other";
        return [{ id, kind: "link", title, url, platform, ...(need ? { need } : {}), addedAt }];
      }
      if (o.kind === "file") {
        const uri = str(o.uri, 500);
        // only copies MAX made in its own music folder
        if (!uri || !/^file:\/\/.+\/music\/[^/]+$/.test(uri)) return [];
        return [{ id, kind: "file", title, uri, ...(need ? { need } : {}), addedAt }];
      }
      return [];
    })
    .slice(0, 200);
}

function musicApps(x: unknown): MusicApp[] {
  return Array.isArray(x) ? [...new Set(x.filter((a): a is MusicApp => typeof a === "string" && APPS.has(a)))] : [];
}

function safetyPlan(x: unknown): SafetyPlan | undefined {
  if (!isObj(x)) return undefined;
  return {
    warningSigns: str(x.warningSigns, 1000) ?? "",
    coping: str(x.coping, 1000) ?? "",
    people: str(x.people, 1000) ?? "",
    places: str(x.places, 1000) ?? "",
    professionals: str(x.professionals, 1000) ?? "",
    reasons: str(x.reasons, 1000) ?? "",
    ...(callContact(x) ?? {}),
  };
}

/** A name plus a dialable number, or nothing: a half-filled contact would give a call button that fails. */
function callContact(x: Record<string, unknown>): { callName: string; callPhone: string } | undefined {
  const name = str(x.callName, 40)?.trim();
  const phone = str(x.callPhone, 20)?.trim();
  if (!name || !phone || !PHONE.test(phone)) return undefined;
  return { callName: name, callPhone: phone };
}

export const PHONE = /^\+?[0-9][0-9 -]{5,17}$/;

function results(x: unknown): Result[] {
  return list(x).flatMap((o) => {
    const checkup = str(o.checkup), score = num(o.score);
    if (!checkup || !CHECKUPS.has(checkup) || score === undefined) return [];
    const band = str(o.band, 60);
    const detail = str(o.detail, 120);
    const flag = o.flag === true ? true : undefined;
    const incomplete = o.incomplete === true ? true : undefined;

    let parts: Record<string, number> | undefined;
    if (isObj(o.parts)) {
      parts = {};
      for (const [k, v] of Object.entries(o.parts)) {
        if (typeof v === "number" && Number.isFinite(v)) {
          parts[k.slice(0, 40)] = Math.round(v * 100) / 100;
        }
      }
      if (Object.keys(parts).length === 0) parts = undefined;
    }

    let top: string[] | undefined;
    if (Array.isArray(o.top)) {
      top = o.top.filter((s): s is string => typeof s === "string" && s.length > 0 && s.length <= 40).slice(0, 10);
      if (top.length === 0) top = undefined;
    }

    const r: Result = {
      id: str(o.id) ?? idFrom(o),
      checkup,
      at: num(o.at) ?? 0,
      score,
      ...(band ? { band } : {}),
      ...(detail ? { detail } : {}),
      ...(flag ? { flag } : {}),
      ...(parts ? { parts } : {}),
      ...(top ? { top } : {}),
      ...(incomplete ? { incomplete } : {}),
    };
    return [r];
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

function phoneDays(x: unknown): PhoneDay[] {
  const byDate = new Map<string, PhoneDay>();
  for (const o of list(x)) {
    const date = str(o.date);
    if (!date || !DATE.test(date) || !isObj(o.minutes)) continue;
    const minutes: Record<string, number> = {};
    for (const [k, v] of Object.entries(o.minutes)) {
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
        minutes[k.slice(0, 30)] = Math.round(v * 10) / 10;
      }
    }
    const screenOn = num(o.screenOn);
    const pickups = num(o.pickups);
    byDate.set(date, {
      date,
      minutes,
      ...(screenOn !== undefined && screenOn >= 0 && screenOn <= 1440 ? { screenOn: Math.round(screenOn) } : {}),
      ...(pickups !== undefined && pickups >= 0 && pickups < 5000 ? { pickups: Math.round(pickups) } : {}),
      ...(o.v === 2 ? { v: 2 } : {}),
    });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
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

  let chatList: Chat[] = [];
  let activeId: string | undefined = undefined;

  if (Array.isArray(raw.chats)) {
    chatList = sanitizeChats(raw.chats);
    if (typeof raw.activeChatId === "string" && chatList.some((c) => c.id === raw.activeChatId)) {
      activeId = raw.activeChatId;
    }
  } else if (Array.isArray(raw.messages)) {
    const msgs = messages(raw.messages);
    if (msgs.length > 0) {
      const firstUser = msgs.find((m) => m.role === "user");
      const title = firstUser?.text.trim().slice(0, 40) || "Conversation";
      const firstAt = msgs[0].at;
      const lastAt = msgs.at(-1)!.at;
      const chatId = "c" + firstAt;
      chatList = [{ id: chatId, title, createdAt: firstAt, updatedAt: lastAt, messages: msgs }];
      activeId = chatId;
    }
  }

  const rawConsents = isObj(raw.consents) ? raw.consents : null;
  const consentAt = num(raw.consentAt);
  const consents: Consents = {
    ai: typeof rawConsents?.ai === "boolean" ? rawConsents.ai : Boolean(consentAt),
    voice: rawConsents?.voice === true,
    sync: rawConsents?.sync === true,
    at: num(rawConsents?.at) ?? consentAt,
  };

  const values = Array.isArray(raw.values)
    ? (raw.values.filter((v): v is string => typeof v === "string").map((v) => v.slice(0, 40)))
    : [];

  return {
    onboarded: raw.onboarded === true,
    companion: companion || d.companion,
    consentAt,
    campus: campus && /^[A-Z0-9-]{2,20}$/.test(campus) ? campus : undefined,
    anonId: anon && /^[a-z0-9]{8,40}$/.test(anon) ? anon : d.anonId,
    shareContext: typeof raw.shareContext === "boolean" ? raw.shareContext : d.shareContext,
    remindAt: remindAt && HHMM.test(remindAt) ? remindAt : undefined,
    bedtime: bedtime && HHMM.test(bedtime) ? bedtime : undefined,
    lock: raw.lock === true,
    checkins: checkins(raw.checkins),
    entries: entries(raw.entries),
    chats: chatList,
    activeChatId: activeId,
    displayName: str(raw.displayName, 40),
    avatar: str(raw.avatar, 60),
    courseProgress: courseProgress(raw.courseProgress),
    insights: insights(raw.insights),
    cardHistory: cardHistory(raw.cardHistory),
    activity: activity(raw.activity),
    values,
    safetyPlan: safetyPlan(raw.safetyPlan),
    consents,
    musicRecent: musicRecent(raw.musicRecent),
    myMusic: myMusic(raw.myMusic),
    musicApps: musicApps(raw.musicApps),
    simpleFont: raw.simpleFont === true,
    maxMotion: raw.maxMotion === "calm" || raw.maxMotion === "still" ? raw.maxMotion : "normal",
    themePreference: typeof raw.themePreference === "string" && THEMES.has(raw.themePreference) ? (raw.themePreference as "system" | "light" | "dark") : "system",
    results: results(raw.results),
    reframes: reframes(raw.reframes),
    plans: plans(raw.plans),
    phoneDays: phoneDays(raw.phoneDays),
    tombstones: list(raw.tombstones)
      .flatMap((o) => {
        const id = str(o.id, 80), at = num(o.at);
        return id && at !== undefined ? [{ id, at }] : [];
      })
      .slice(0, 1000),
    sync: syncInfo(raw.sync),
    helped: list(raw.helped)
      .flatMap((o): Helped[] => {
        const id = str(o.id, 60), tool = str(o.tool, 60), at = num(o.at);
        if (!id || !tool || at === undefined || typeof o.helped !== "boolean") return [];
        const mood = int(o.mood, 1, 5);
        return [{ id, tool, at, helped: o.helped, ...(mood ? { mood } : {}) }];
      })
      .slice(0, 300),
    exams: list(raw.exams)
      .flatMap((o): Exam[] => {
        const id = str(o.id, 60), name = str(o.name, 60)?.trim(), date = str(o.date);
        return id && name && date && DATE.test(date) ? [{ id, name, date }] : [];
      })
      .slice(0, 30),
    reminders: reminderPrefs(raw.reminders, d.reminders, {
      remindAt: remindAt && HHMM.test(remindAt) ? remindAt : undefined,
      bedtime: bedtime && HHMM.test(bedtime) ? bedtime : undefined,
    }),
    lastOpenAt: num(raw.lastOpenAt),
    counsellor: counsellor(raw.counsellor),
    college: collegeLink(raw.college),
  };
}

function syncInfo(x: unknown): SyncInfo | undefined {
  if (!isObj(x)) return undefined;
  const rev = int(x.rev, 0, 1e9) ?? 0;
  const email = str(x.email, 120), name = str(x.name, 80), lastHash = str(x.lastHash, 60), lastAt = num(x.lastAt), error = str(x.error, 200);
  return { rev, ...(email ? { email } : {}), ...(name ? { name } : {}), ...(lastHash ? { lastHash } : {}), ...(lastAt ? { lastAt } : {}), ...(error ? { error } : {}) };
}

function reminderPrefs(x: unknown, d: ReminderPrefs, legacy: { remindAt?: string; bedtime?: string }): ReminderPrefs {
  // before v1.4 the only setting was a fixed daily time; anyone who had set a reminder has seen the choice already
  if (!isObj(x)) return { ...d, mode: legacy.remindAt ? "fixed" : "off", ...(legacy.remindAt || legacy.bedtime ? { asked: true } : {}) };
  const mode = x.mode === "smart" || x.mode === "fixed" || x.mode === "off" ? x.mode : d.mode;
  return { mode, exams: typeof x.exams === "boolean" ? x.exams : d.exams, ...(x.asked === true ? { asked: true } : {}) };
}

function collegeLink(x: unknown): CollegeLink | undefined {
  if (!isObj(x)) return undefined;
  const id = str(x.id, 40), name = str(x.name, 120), city = str(x.city, 60);
  if (!id || !/^[0-9a-f-]{36}$/.test(id) || !name || !city) return undefined;
  const year = int(x.year, 1, 6);
  const c = isObj(x.counsellor) ? x.counsellor : null;
  const cName = c ? str(c.name, 60) : undefined, cPhone = c ? str(c.phone, 20) : undefined, cHours = c ? str(c.hours, 60) : undefined;
  const exams = Array.isArray(x.exams)
    ? x.exams.flatMap((e) => (isObj(e) && str(e.name, 60) && typeof e.date === "string" && DATE.test(e.date) ? [{ name: str(e.name, 60)!, date: e.date }] : [])).slice(0, 20)
    : [];
  return {
    id,
    name,
    city,
    ...(year ? { year } : {}),
    ...(cName && cPhone && PHONE.test(cPhone) ? { counsellor: { name: cName, phone: cPhone, ...(cHours ? { hours: cHours } : {}) } } : {}),
    exams,
    joinedAt: num(x.joinedAt) ?? Date.now(),
    ...(x.gone === true ? { gone: true } : {}),
  };
}

function counsellor(x: unknown): { name: string; phone: string } | undefined {
  if (!isObj(x)) return undefined;
  const name = str(x.name, 40)?.trim(), phone = str(x.phone, 20)?.trim();
  return name && phone && PHONE.test(phone) ? { name, phone } : undefined;
}

/** Accepts the v3, v2 envelope or a bare v1 state. Returns null when the blob is unusable. */
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
