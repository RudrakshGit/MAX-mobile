import type { RiskLevel } from "./classifier";

// How the regex layer, the per-message "read" score and the safeguard model
// combine. Pure, so every branch is tested. A failed read is unknown, not safe.
export type Read = { emotions: string[]; intensity: number; risk: number };

const clamp = (n: number) => Math.max(0, Math.min(10, Number.isFinite(n) ? n : 0));
export const CRISIS_AT = 7;
export const BORDER_AT = 4;

// `words` is the length of the latest user message. When the read call failed we cannot call the
// message calm just because the regex said "none", so anything longer than a couple of words
// gets the safeguard check instead (fail closed).
export function needsSafeguard(regex: RiskLevel, read: Read | null, words = 0): boolean {
  if (read && clamp(read.risk) >= CRISIS_AT) return false;
  if (regex === "distress") return true;
  if (!read) return regex !== "none" || words >= 3;
  return clamp(read.risk) >= BORDER_AT;
}

export function finalLevel(regex: RiskLevel, read: Read | null, safeguard: RiskLevel | null): RiskLevel {
  if (regex === "crisis") return "crisis";
  if (read && clamp(read.risk) >= CRISIS_AT) return "crisis";
  if (safeguard === "crisis") return "crisis";
  if (regex === "distress" || safeguard === "distress" || (read && clamp(read.risk) >= BORDER_AT)) return "distress";
  return "none";
}
