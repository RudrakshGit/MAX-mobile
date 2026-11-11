// On-device personalisation. Pure (no React Native imports) so Node can test it.
//
// MAX picks what to offer from what it already knows on this phone: today's check-in, the time of day, upcoming
// exams, the feelings in today's journal, a run of heavy days, and, most of all, what has actually helped this
// student before ("Did that help?"). Nothing here leaves the phone.
import type { CheckIn, Entry, Exam, Helped, State } from "./store";

export type ActionId =
  | "breathe"
  | "breathe478"
  | "ground"
  | "reframe"
  | "spiral"
  | "journal"
  | "braindump"
  | "talk"
  | "sleepSound"
  | "focus"
  | "examCourse"
  | "winddown"
  | "safetyPlan";

export type Action = { id: ActionId; title: string; sub: string; href: string; icon: string; reason?: string };

export const ACTIONS: Record<ActionId, Omit<Action, "id" | "reason">> = {
  breathe: { title: "One-minute reset", sub: "Slow breathing takes the edge off a racing body", href: "/tool/breathe", icon: "wind" },
  breathe478: { title: "4-7-8 breathing", sub: "A slow pattern to help you settle for sleep", href: "/tool/breathe?pattern=478", icon: "moon" },
  ground: { title: "5-4-3-2-1 grounding", sub: "Pull a racing mind back into the room", href: "/tool/ground", icon: "compass" },
  reframe: { title: "Reframe the thought", sub: "Find a fairer way to see what's bothering you", href: "/tool/reframe", icon: "refresh-cw" },
  spiral: { title: "Spiral breaker", sub: "Plan what you'll do when the loop starts", href: "/tool/spiral", icon: "activity" },
  journal: { title: "Write it down", sub: "Get it out of your head and onto the page", href: "/journal-new", icon: "edit-3" },
  braindump: { title: "Exam brain dump", sub: "Three questions that shrink the pile", href: "/journal-new?template=braindump", icon: "edit-3" },
  talk: { title: "Talk it through", sub: "Think it over together, no judgement", href: "/talk", icon: "message-circle" },
  sleepSound: { title: "A sound to fall asleep to", sub: "Plays offline, with a sleep timer", href: "/sounds", icon: "moon" },
  focus: { title: "25-minute focus session", sub: "A calm sound and a soft bell at the end", href: "/sounds?focus=1", icon: "music" },
  examCourse: { title: "Exam stress course", sub: "Short daily lessons for the days before an exam", href: "/course/exam-stress", icon: "book-open" },
  winddown: { title: "Your phone and your sleep", sub: "A two-minute read for tonight", href: "/lesson/phone-sleep", icon: "smartphone" },
  safetyPlan: { title: "Look at your safety plan", sub: "Your own steps and people for heavy days", href: "/tool/safety-plan", icon: "shield" },
};

/** Which "Did that help?" key an action's feedback is stored under. */
export const FEEDBACK_KEY: Record<ActionId, string> = {
  breathe: "breathe",
  breathe478: "breathe",
  ground: "ground",
  reframe: "reframe",
  spiral: "spiral",
  journal: "journal",
  braindump: "journal",
  talk: "talk",
  sleepSound: "sounds",
  focus: "focus",
  examCourse: "exam-course",
  winddown: "winddown",
  safetyPlan: "safety-plan",
};

const DAY = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / DAY);

/**
 * How much a tool has helped this student, in -1…1. Recent answers count more (half-life 30 days) and a
 * single answer only moves it a little, so one bad session doesn't bury a useful tool.
 */
export function helpScore(helped: Helped[] | undefined, tool: string, now = Date.now()): number {
  let sum = 0;
  let weight = 0;
  for (const h of helped ?? []) {
    if (h.tool !== tool) continue;
    const w = Math.pow(0.5, Math.max(0, now - h.at) / (30 * DAY));
    sum += w * (h.helped ? 1 : -1);
    weight += w;
  }
  return sum / (weight + 1);
}

/** The next exam within `days` days (today counts), if any. */
export function nextExam(exams: Exam[] | undefined, now: Date, days = 3): (Exam & { inDays: number }) | null {
  const today = dateKey(now);
  const soon = (exams ?? [])
    .map((e) => ({ ...e, inDays: daysBetween(today, e.date) }))
    .filter((e) => e.inDays >= 0 && e.inDays <= days)
    .sort((a, b) => a.inDays - b.inDays);
  return soon[0] ?? null;
}

const when = (n: number) => (n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`);

/** Heavy days (mood 1–2) among the last three check-ins in the last four days. */
export function heavyRun(checkins: CheckIn[], now: Date): number {
  const recent = new Set([0, 1, 2, 3].map((i) => dateKey(new Date(now.getTime() - i * DAY))));
  return checkins.filter((c) => recent.has(c.date)).slice(-3).filter((c) => c.mood <= 2).length;
}

type Score = { s: number; reason?: string };

/** Best actions for this moment, most useful first. */
export function rankActions(state: State, now = new Date(), limit = 3, exclude: ActionId[] = []): Action[] {
  const h = now.getHours();
  const night = h >= 22 || h < 4;
  const day = h >= 8 && h < 20;
  const today = dateKey(now);
  const c = state.checkins.find((x) => x.date === today);
  const exam = nextExam(state.exams, now);
  const feelings = new Set(
    state.entries.filter((e) => dateKey(new Date(e.at)) === today).flatMap((e) => e.feelings),
  );
  const heavy = heavyRun(state.checkins, now);

  const score = new Map<ActionId, Score>();
  const add = (id: ActionId, s: number, reason?: string) => {
    const cur = score.get(id) ?? { s: 0 };
    score.set(id, { s: cur.s + s, reason: cur.reason && (cur.s >= s || !reason) ? cur.reason : reason ?? cur.reason });
  };

  // gentle defaults so there is always something
  add("breathe", 1);
  add("journal", 0.9);
  add("talk", 0.8);

  if (heavy >= 3) {
    add("talk", 3, "A few heavy days in a row");
    add("safetyPlan", 2.4, "A few heavy days in a row");
  }
  if (c) {
    if (c.stress >= 4) add("breathe", 3, "Study pressure is heavy today");
    if (c.stress >= 5) add("spiral", 1.6, "Pressure is intense today");
    if (c.mood <= 2) {
      add("talk", 2.5, "Today feels low");
      add("journal", 2, "Today feels low");
      add("reframe", 1.2, "Today feels low");
    }
    if (c.sleep <= 2) {
      if (night) add("breathe478", 3, "To help tonight's sleep after a rough night");
      else {
        add("sleepSound", 1.6, "You slept badly last night");
        add("winddown", c.screen >= 30 ? 1.8 : 1, "You slept badly last night");
      }
    }
    if (day && c.stress >= 3) add("focus", 1.4, "To get some studying done calmly");
  }
  if (night) {
    add("breathe478", 2, "It's late");
    add("sleepSound", 2, "It's late");
  }
  if (exam) {
    add("braindump", 2.6, `${exam.name} ${when(exam.inDays)}`);
    if (day) add("focus", 2.2, `${exam.name} ${when(exam.inDays)}`);
    if (exam.inDays >= 1) add("examCourse", 1.5, `${exam.name} ${when(exam.inDays)}`);
  }
  if (feelings.has("anxious") || feelings.has("overwhelmed")) add("ground", 2.5, "You wrote that you feel anxious");
  if (feelings.has("lonely")) add("talk", 2.5, "You wrote that you feel lonely");
  if (feelings.has("guilty") || feelings.has("disappointed")) add("reframe", 2, "You wrote that you feel let down");
  if (feelings.has("drained")) add("breathe", 1.5, "You wrote that you feel drained");

  // What has helped this student before counts most of all.
  const ms = now.getTime();
  for (const [id, sc] of score) sc.s += 1.6 * helpScore(state.helped, FEEDBACK_KEY[id], ms);

  return [...score.entries()]
    .filter(([id]) => !exclude.includes(id))
    .sort((a, b) => b[1].s - a[1].s)
    .slice(0, limit)
    .map(([id, sc]) => ({ id, ...ACTIONS[id], ...(sc.reason ? { reason: sc.reason } : {}) }));
}

/** One clear next step right after a check-in, only when the check-in says something. */
export function afterCheckin(state: State, now = new Date()): Action | null {
  const c = state.checkins.find((x) => x.date === dateKey(now));
  if (!c) return null;
  const notable = c.stress >= 4 || c.mood <= 2 || c.sleep <= 2 || heavyRun(state.checkins, now) >= 3 || !!nextExam(state.exams, now);
  if (!notable) return null;
  const top = rankActions(state, now, 1)[0];
  return top?.reason ? top : null;
}

/** A tool to offer after a journal entry is saved, from the feelings the student picked. */
export function journalBridge(entry: Pick<Entry, "feelings" | "mood">, state?: State, now = Date.now()): Action | null {
  const f = new Set(entry.feelings);
  const options: [boolean, ActionId, string][] = [
    [f.has("anxious") || f.has("overwhelmed"), "ground", "When worry is loud, your senses can steady you."],
    [f.has("lonely"), "talk", "You don't have to sit with this alone."],
    [f.has("guilty") || f.has("disappointed"), "reframe", "Is there a kinder, fairer way to see it?"],
    [f.has("drained") || f.has("frustrated") || f.has("angry"), "breathe", "One slow minute before the next thing."],
    [(entry.mood ?? 3) <= 2, "talk", "Heavy days are easier to carry with someone."],
  ];
  const matches = options.filter(([hit]) => hit);
  if (!matches.length) return null;
  // Prefer the one that has helped before.
  matches.sort((a, b) => helpScore(state?.helped, FEEDBACK_KEY[b[1]], now) - helpScore(state?.helped, FEEDBACK_KEY[a[1]], now));
  const [, id, reason] = matches[0];
  return { id, ...ACTIONS[id], reason };
}

/**
 * The student's usual check-in time, learned from when they actually check in (at least 4 check-ins with a
 * time). Times after midnight count as late evening, so 23:50 and 00:20 average to around midnight.
 */
export function usualCheckinTime(checkins: CheckIn[]): string | null {
  const mins = checkins
    .slice(-21)
    .filter((c) => typeof c.at === "number")
    .map((c) => {
      const d = new Date(c.at as number);
      const m = d.getHours() * 60 + d.getMinutes();
      return m < 4 * 60 ? m + 1440 : m;
    })
    .sort((a, b) => a - b);
  if (mins.length < 4) return null;
  const mid = mins.length / 2;
  const median = mins.length % 2 ? mins[Math.floor(mid)] : Math.round((mins[mid - 1] + mins[mid]) / 2);
  // round to the quarter hour, then wrap back into the day
  const q = (Math.round(median / 15) * 15) % 1440;
  return `${pad(Math.floor(q / 60))}:${pad(q % 60)}`;
}

/** Conversation starters that fit the moment. */
export function chatStarters(state: State, now = new Date()): string[] {
  const h = now.getHours();
  const exam = nextExam(state.exams, now, 5);
  const c = state.checkins.find((x) => x.date === dateKey(now));
  // Two that fit the moment, then always one neutral and one happy starter (owner, 11 Nov 2026: people don't only
  // come to MAX when they're sad, so the starters mustn't suggest that either).
  const fit: string[] = [];
  if (exam) fit.push(`I'm worried about my ${exam.name} exam`);
  if (c && c.mood <= 2) fit.push("Today feels heavy");
  if (h >= 22 || h < 4) fit.push("I can't switch my brain off to sleep", "I'm thinking about tomorrow");
  else if (h < 12) fit.push("I don't feel like starting today", "Help me plan my day");
  else fit.push("I can't focus on my studies", "I keep overthinking something");
  return [...new Set(fit)].slice(0, 2).concat("Just want to chat", "Something good happened today");
}

const TOOL_NAMES: Record<string, string> = {
  breathe: "Breathing reset",
  ground: "5-4-3-2-1 grounding",
  reframe: "Reframing a thought",
  spiral: "Spiral breaker",
  journal: "Writing it down",
  talk: "Talking it through",
  sounds: "Calming sounds",
  focus: "Focus sessions",
  "exam-course": "Exam stress course",
  winddown: "Winding down before sleep",
  "safety-plan": "Safety plan",
};

/** "What helps me": tools the student rated, most helpful first (needs at least 2 answers each). */
export function whatHelps(helped: Helped[] | undefined, now = Date.now()): { tool: string; name: string; yes: number; total: number }[] {
  const by = new Map<string, { yes: number; total: number }>();
  for (const h of helped ?? []) {
    const cur = by.get(h.tool) ?? { yes: 0, total: 0 };
    cur.total++;
    if (h.helped) cur.yes++;
    by.set(h.tool, cur);
  }
  return [...by.entries()]
    .filter(([, v]) => v.total >= 2)
    .map(([tool, v]) => ({ tool, name: TOOL_NAMES[tool] ?? tool, ...v }))
    .sort((a, b) => helpScore(helped, b.tool, now) - helpScore(helped, a.tool, now));
}
