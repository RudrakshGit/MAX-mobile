import { FEELING_IDS, INFLUENCE_IDS } from "../content/feelings.ts";

const VALID_FEELINGS = new Set<string>(FEELING_IDS);
const VALID_INFLUENCES = new Set<string>(INFLUENCE_IDS);

export function cleanTags(raw: unknown): { feelings: string[]; influences: string[] } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { feelings: [], influences: [] };
  }
  const obj = raw as Record<string, unknown>;

  const cleanList = (list: unknown, allowed: Set<string>, limit: number): string[] => {
    if (!Array.isArray(list)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of list) {
      if (typeof item === "string" && allowed.has(item) && !seen.has(item)) {
        seen.add(item);
        out.push(item);
        if (out.length >= limit) break;
      }
    }
    return out;
  };

  return {
    feelings: cleanList(obj.feelings, VALID_FEELINGS, 3),
    influences: cleanList(obj.influences, VALID_INFLUENCES, 2),
  };
}
