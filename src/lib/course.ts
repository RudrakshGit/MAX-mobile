import type { State } from "./store";
import type { Course } from "@/content/courses/types";

export type LessonRef = { course: string; day: number };

type NeedArea = "worry" | "sleep" | "mood" | "stress" | "compassion";

const AREA_COURSES: Record<NeedArea, string[]> = {
  worry: ["overthinking"],
  sleep: ["sleep-reset"],
  mood: ["get-going"],
  stress: ["stress-toolkit", "exam-stress"],
  compassion: ["kind-to-yourself"],
};

export function yourCourse(s: State, courses: Course[], now = new Date()): LessonRef[] {
  const byCourseId = new Map(courses.map((c) => [c.id, c]));

  // 1. Calculate need scores based on results and recent checkins
  const needScores: Record<NeedArea, number> = {
    worry: 0,
    sleep: 0,
    mood: 0,
    stress: 0,
    compassion: 0,
  };

  let hasData = false;

  // Screener results
  for (const r of s.results || []) {
    hasData = true;
    if (r.checkup === "pswq") {
      needScores.worry += r.score >= 50 ? 3 : 1;
    } else if (r.checkup === "sci") {
      needScores.sleep += r.score <= 16 ? 3 : 1;
    } else if (r.checkup === "phq9") {
      needScores.mood += r.score >= 10 ? 3 : 1;
    } else if (r.checkup === "who5") {
      needScores.mood += r.score <= 50 ? 3 : 1;
    } else if (r.checkup === "cbi") {
      needScores.stress += r.score >= 50 ? 3 : 1;
    } else if (r.checkup === "rses") {
      needScores.compassion += r.score <= 15 ? 3 : 1;
    }
  }

  // Checkins in last 7 days
  const checkins = s.checkins || [];
  if (checkins.length > 0) {
    const recent = checkins.slice(-7);
    const avgSleep = recent.reduce((sum, c) => sum + c.sleep, 0) / recent.length;
    const avgStress = recent.reduce((sum, c) => sum + c.stress, 0) / recent.length;
    if (avgSleep <= 2.5) {
      needScores.sleep += 2;
      hasData = true;
    }
    if (avgStress >= 3.5) {
      needScores.stress += 2;
      hasData = true;
    }
  }

  // Default fallback if no data
  if (!hasData) {
    return [
      { course: "stress-toolkit", day: 1 },
      { course: "stress-toolkit", day: 2 },
      { course: "stress-toolkit", day: 4 },
      { course: "stress-toolkit", day: 5 },
    ];
  }

  // Sort areas by score descending
  const sortedAreas = (Object.keys(needScores) as NeedArea[])
    .filter((a) => needScores[a] > 0)
    .sort((a, b) => needScores[b] - needScores[a]);

  if (sortedAreas.length === 0) {
    return [
      { course: "stress-toolkit", day: 1 },
      { course: "stress-toolkit", day: 2 },
      { course: "stress-toolkit", day: 4 },
      { course: "stress-toolkit", day: 5 },
    ];
  }

  const result: LessonRef[] = [];
  const pickedKeys = new Set<string>();

  const pickFromCourse = (courseId: string, count: number) => {
    const c = byCourseId.get(courseId);
    if (!c) return;
    const progress = s.courseProgress?.[courseId];
    const unhelpful = new Set(progress?.unhelpful || []);
    const done = new Set(progress?.done || []);

    const availableDays = c.days
      .map((d) => d.day)
      .filter((day) => !unhelpful.has(day));

    // First try days that are neither done nor already picked
    const freshDays = availableDays.filter((d) => !done.has(d) && !pickedKeys.has(`${courseId}:${d}`));
    for (const day of freshDays) {
      if (result.length < 4 && count > 0) {
        result.push({ course: courseId, day });
        pickedKeys.add(`${courseId}:${day}`);
        count--;
      }
    }

    // If still need more, allow already done (but not unhelpful or already picked)
    if (count > 0) {
      const remaining = availableDays.filter((d) => !pickedKeys.has(`${courseId}:${d}`));
      for (const day of remaining) {
        if (result.length < 4 && count > 0) {
          result.push({ course: courseId, day });
          pickedKeys.add(`${courseId}:${day}`);
          count--;
        }
      }
    }
  };

  // Top area: pick 2
  const top1 = sortedAreas[0];
  const course1 = AREA_COURSES[top1][0];
  pickFromCourse(course1, 2);

  // Second area: pick 2
  if (sortedAreas.length > 1) {
    const top2 = sortedAreas[1];
    const course2 = AREA_COURSES[top2][0];
    pickFromCourse(course2, 2);
  } else {
    pickFromCourse(course1, 2);
  }

  // If still less than 4, fill from remaining courses
  const fallbackCourses = ["stress-toolkit", "overthinking", "sleep-reset", "get-going", "kind-to-yourself"];
  for (const fId of fallbackCourses) {
    if (result.length >= 4) break;
    pickFromCourse(fId, 4 - result.length);
  }

  // Ultimate fallback to ensure exactly 4 items
  const defaultItems: LessonRef[] = [
    { course: "stress-toolkit", day: 1 },
    { course: "stress-toolkit", day: 2 },
    { course: "stress-toolkit", day: 4 },
    { course: "stress-toolkit", day: 5 },
  ];
  for (const item of defaultItems) {
    if (result.length >= 4) break;
    if (!pickedKeys.has(`${item.course}:${item.day}`)) {
      result.push(item);
      pickedKeys.add(`${item.course}:${item.day}`);
    }
  }

  return result.slice(0, 4);
}
