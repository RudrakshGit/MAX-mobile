export type ToolAction = { tool: "breathe" | "ground" | "reframe" | "spiral" | "safety-plan" };
export type WriteAction = { write: string };
export type LessonAction = ToolAction | WriteAction;

export interface Lesson {
  day: number;
  title: string;
  body: string[];
  action: LessonAction;
  watch?: string; // ResourceId from resources.ts
  source: string;
  licence: string;
  reviewer?: string;
  reviewedOn?: string;
  reviewDue?: string;
}

export interface Course {
  id: string;
  title: string;
  summary: string;
  category: "stress" | "exam" | "worry" | "sleep" | "mood" | "compassion";
  days: Lesson[];
}
