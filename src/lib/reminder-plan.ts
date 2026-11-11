import { dateKey, usualCheckinTime } from "./personal.ts";
import type { State } from "./store.ts";

// Which reminders to schedule for the next week. Pure, so it can be tested; reminders.ts does the scheduling.
// Rules (docs/v2-features.md rule 3, and the reminders research in docs/audit):
// - at most one notification a day, at a time the student picked, never guilt or streak wording;
// - skipped on days they've already checked in;
// - if they stop checking in, MAX reminds less (every other day after 3 quiet days) and stops after a week;
// - lock-screen text stays neutral: no mood words, no numbers, nothing personal.

export type Planned = { id: string; at: number; title: string; body: string; url: string };
type Copy = [title: string, body: string];

const DAY = 86_400_000;
const HORIZON = 7;
const mins = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const CHECKIN: Copy[] = [
  ["How was today?", "Four quick taps, if you feel like it."],
  ["A minute for you?", "Check in on how today went. Or skip it, that's fine too."],
  ["Quick pause", "How did today go? Tap to note it, or leave it for now."],
  ["Hi, it's MAX", "Want to note how today felt? It takes under a minute."],
  ["End-of-day check-in", "Only if you have a moment."],
  ["How's your evening?", "A quick check-in is here when you want it."],
  ["Today, in four taps", "Note how it went, or skip today. Your call."],
  ["Little check-in?", "Sleep, study, how you feel: a few taps."],
  ["Before the day ends", "A quick look back at today, if you'd like."],
  ["MAX here", "Got a minute? Check in, or skip it tonight."],
];
const WINDDOWN: Copy[] = [
  ["Time to start winding down", "Bedtime's coming up. A calm sound or a slow breath can help."],
  ["Winding down?", "A good moment to put the phone aside soon."],
  ["Evening, slowly", "Screens off soon? MAX has sleep sounds if you want them."],
  ["Bedtime soon", "A few slow breaths can make it easier to switch off."],
  ["Rest mode", "Start easing into sleep, whenever you're ready."],
];
const EVENING: Copy[] = [
  ["Winding down soon?", "A quick check-in on today first, if you like. Then something calm for sleep."],
  ["Evening check-in", "Note how today went, then ease into sleep. Or skip it tonight."],
  ["Before bed", "Four taps on how today went, then rest. Only if you feel like it."],
];
const EXAM_EVE: Copy = ["Big day tomorrow", "Two minutes to empty your head can make sleep easier. Or skip it tonight."];

/** Day number of a local date, so the wording changes every day and doesn't repeat for 10 days. */
const dayNo = (d: Date) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
const pick = (list: Copy[], d: Date) => list[dayNo(d) % list.length];

/**
 * Check-in reminder time in minutes after midnight, or null when off. "smart" starts from the time the student
 * picked and moves up to an hour toward when they usually check in; never later than 23:00.
 */
export function checkinMinutes(s: Pick<State, "reminders" | "remindAt" | "checkins">): number | null {
  if (s.reminders.mode === "off") return null;
  const base = mins(s.remindAt ?? "21:00");
  const usual = s.reminders.mode === "smart" ? usualCheckinTime(s.checkins) : null;
  if (!usual) return base;
  const diff = ((((mins(usual) - base) % 1440) + 1440 + 720) % 1440) - 720; // -720..719, the short way round
  return Math.min(base + Math.max(-60, Math.min(60, diff)), 23 * 60);
}

/** Fewer reminders when the student goes quiet: daily, then every other day after 3 quiet days, none after a week. */
const keepGoing = (quietDays: number) => quietDays <= 2 || quietDays === 4 || quietDays === 6;

const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / DAY);

export function planReminders(
  s: Pick<State, "reminders" | "remindAt" | "bedtime" | "checkins" | "exams">,
  now: Date,
): Planned[] {
  const out: Planned[] = [];
  const checkAt = checkinMinutes(s);
  // wind-down an hour before bedtime: Android may deliver it up to an hour late, so no exact minutes in the text
  const windAt = s.bedtime ? (mins(s.bedtime) - 60 + 1440) % 1440 : null;
  const todayKey = dateKey(now);
  const lastCheckin = s.checkins.reduce<string | null>((m, c) => (!m || c.date > m ? c.date : m), null);
  const anchor = lastCheckin && lastCheckin < todayKey ? lastCheckin : null;
  const examDays = new Set(s.reminders.exams ? s.exams.map((e) => e.date) : []);

  for (let d = 0; d < HORIZON; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    const key = dateKey(day);
    // a wind-down after midnight (bedtime 00:30 → 23:30 is fine; bedtime 01:00 → 00:00) belongs to this evening
    const at = (m: number) => new Date(day.getFullYear(), day.getMonth(), day.getDate() + (m < 6 * 60 ? 1 : 0), 0, m).getTime();
    const doneToday = d === 0 && lastCheckin === todayKey;
    // quiet days so far on that day: since the last check-in, or since today if there's none before today
    const quiet = anchor ? daysBetween(anchor, key) - 1 : d - 1;
    const check = checkAt != null && !doneToday && keepGoing(quiet) ? checkAt : null;
    const wind = windAt != null && keepGoing(d - 1) ? windAt : null;

    const tomorrow = dateKey(new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1));
    let slot: Planned | null = null;
    if (examDays.has(tomorrow)) {
      const m = wind ?? check ?? 20 * 60;
      slot = { id: `exam-${key}`, at: at(m), title: EXAM_EVE[0], body: EXAM_EVE[1], url: "/journal-new?template=braindump" };
    } else if (wind != null && check != null) {
      // one a day: the evening note asks for the check-in too, at the wind-down time
      const [title, body] = pick(EVENING, day);
      slot = { id: `evening-${key}`, at: at(wind), title, body, url: "/" };
    } else if (wind != null) {
      const [title, body] = pick(WINDDOWN, day);
      slot = { id: `winddown-${key}`, at: at(wind), title, body, url: "/sounds" };
    } else if (check != null) {
      const [title, body] = pick(CHECKIN, day);
      slot = { id: `checkin-${key}`, at: at(check), title, body, url: "/" };
    }
    if (slot && slot.at > now.getTime() + 60_000) out.push(slot);
  }
  return out;
}
