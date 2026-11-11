import type { State } from "./store";
import { nextStep } from "./insights.ts";
import { yourCourse } from "./course.ts";
import { courses, coursesById } from "../content/courses/index.ts";

export type PlanItem = {
  id: "learn" | "do" | "log";
  title: string;
  href: string;
  done: boolean;
};

/**
 * Returns exactly 3 daily goals in order: log, do, learn.
 * Ticks follow today's actions on `date` only.
 */
export function dailyPlan(s: State, date: string): PlanItem[] {
  const checkins = s.checkins ?? [];
  const activity = s.activity ?? [];

  const todayCheckIn = checkins.find((c) => c.date === date);
  const logDone = Boolean(todayCheckIn);

  const todays = activity.filter((a) => a.date === date);
  // a course lesson (ref "course:day"); the quick reads are logged as "learn" too, but aren't the course step
  const learnDone = todays.some((a) => a.kind === "learn" && a.ref?.includes(":"));

  // "do" step: derived from today's checkin if present, else default one-minute reset
  let doTitle = "One-minute reset";
  let doHref = "/tool/breathe";
  if (todayCheckIn) {
    const step = nextStep(todayCheckIn);
    if (step) {
      doTitle = step.label;
      doHref = step.href;
    }
  }

  // ticked only by the step the student actually did (audit: talk, journal and lesson steps never ticked before)
  const didStep = (href: string) => {
    if (href.startsWith("/journal-new")) return todays.some((a) => a.kind === "journal");
    if (href.startsWith("/lesson/")) return todays.some((a) => a.kind === "learn" && a.ref === href.slice("/lesson/".length));
    const ref = href === "/talk" ? "talk" : href.startsWith("/tool/") ? href.slice("/tool/".length) : undefined;
    return todays.some((a) => a.kind === "do" && (ref === undefined || a.ref === ref));
  };
  const doDone = didStep(doHref);

  // "learn" step: references the next uncompleted lesson from yourCourse
  let learnTitle = "Today's lesson";
  let learnHref = "/explore";
  try {
    const refs = yourCourse(s, courses);
    const nextRef =
      refs.find((ref) => {
        const p = s.courseProgress?.[ref.course];
        return !p?.done?.includes(ref.day);
      }) || refs[0];

    if (nextRef) {
      const c = coursesById.get(nextRef.course);
      const l = c?.days.find((d) => d.day === nextRef.day);
      if (l) {
        learnTitle = `${c?.title}: Day ${nextRef.day}`;
        learnHref = `/course/${nextRef.course}/${nextRef.day}`;
      }
    }
  } catch {
    learnTitle = "Today's lesson";
    learnHref = "/explore";
  }

  // Once a lesson is done today the tick must name that lesson, not whichever one is "next" after it
  // (a check-in can change the recommended course; audit F21).
  if (learnDone) {
    const doneRef = activity.find((a) => a.date === date && a.kind === "learn" && a.ref?.includes(":"));
    if (doneRef?.ref) {
      const [courseId, dayStr] = doneRef.ref.split(":");
      const c = coursesById.get(courseId);
      if (c?.days.some((d) => d.day === Number(dayStr))) {
        learnTitle = `${c.title}: Day ${dayStr}`;
        learnHref = `/course/${courseId}/${dayStr}`;
      }
    }
  }

  return [
    {
      id: "log",
      title: "Check in — 4 taps",
      href: "/",
      done: logDone,
    },
    {
      id: "do",
      title: doTitle,
      href: doHref,
      done: doDone,
    },
    {
      id: "learn",
      title: learnTitle,
      href: learnHref,
      done: learnDone,
    },
  ];
}
