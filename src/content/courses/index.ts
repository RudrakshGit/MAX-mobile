import type { Course } from "./types.ts";
import { stressToolkit } from "./stress-toolkit.ts";
import { examStress } from "./exam-stress.ts";
import { overthinking } from "./overthinking.ts";
import { sleepReset } from "./sleep-reset.ts";
import { getGoing } from "./get-going.ts";
import { kindToYourself } from "./kind-to-yourself.ts";

export { stressToolkit, examStress, overthinking, sleepReset, getGoing, kindToYourself };

export const courses: Course[] = [
  stressToolkit,
  examStress,
  overthinking,
  sleepReset,
  getGoing,
  kindToYourself,
];

export const coursesById = new Map<string, Course>(courses.map((c) => [c.id, c]));
