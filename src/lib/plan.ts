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

  const doDone = activity.some((a) => a.date === date && a.kind === "do");
  const learnDone = activity.some((a) => a.date === date && a.kind === "learn");

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

  // "learn" step: references the next uncompleted lesson from yourCourse
  let learnTitle = "Today's lesson";
  let learnHref = "/learn";
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
    learnHref = "/learn";
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
