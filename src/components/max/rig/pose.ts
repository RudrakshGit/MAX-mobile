// MAX's pose: plain numbers per body part, in the 180×172 drawing's units (docs/plan/M16-motion-cards-ia.md).
import type { EaseName } from "./motion.ts";

/**
 * Every animatable number. Body moves happen on the whole character, pivoting at the feet (90, 172); arms rotate at
 * the shoulders (degrees; positive lifts the left arm outward, negative lifts the right one); feet slide and lift;
 * the face shifts to look around (eyes move most, brows and mouth less); `lid` closes the eyes (0 open, 1 shut).
 */
export interface Pose {
  bx: number;
  by: number;
  br: number;
  bsx: number;
  bsy: number;
  alr: number;
  arr: number;
  flx: number;
  fly: number;
  frx: number;
  fry: number;
  fx: number;
  fy: number;
  lid: number;
}
export type Channel = keyof Pose;

export const CHANNELS: Channel[] = ["bx", "by", "br", "bsx", "bsy", "alr", "arr", "flx", "fly", "frx", "fry", "fx", "fy", "lid"];

export const REST: Pose = { bx: 0, by: 0, br: 0, bsx: 1, bsy: 1, alr: 0, arr: 0, flx: 0, fly: 0, frx: 0, fry: 0, fx: 0, fy: 0, lid: 0 };

export type EyesKind = "default" | "blink" | "happy" | "thinking" | "sleep" | "sad" | "wink" | "surprised" | "dizzy" | "angry";
export type BrowsKind = "default" | "curious" | "anxious" | "care" | "angry";
export type MouthKind = "smile" | "open" | "calm" | "sad" | "o" | "whistle" | "dizzy" | "angry";

export interface Face {
  eyes: EyesKind;
  brows: BrowsKind;
  mouth: MouthKind;
}
export const DEFAULT_FACE: Face = { eyes: "default", brows: "default", mouth: "smile" };

/** Comic marks around MAX. They animate on their own while switched on. */
export interface Marks {
  zs: boolean;
  sweat: boolean;
  dots: boolean;
  heart: boolean;
  sparkles: boolean;
  notes: boolean;
  stars: boolean;
}
export const NO_MARKS: Marks = { zs: false, sweat: false, dots: false, heart: false, sparkles: false, notes: false, stars: false };

/** One keyframe: at `at` ms the listed channels reach these values, eased with `ease` from the previous key. */
export interface Key {
  at: number;
  pose?: Partial<Pose>;
  ease?: EaseName;
  face?: Partial<Face>;
  marks?: Partial<Marks>;
}

export interface Clip {
  name: string;
  /** "loop" repeats from the start and must end on its first pose; "action" plays once and must hold a pose. */
  kind: "loop" | "action";
  keys: Key[];
}

export const clipLength = (c: Clip) => c.keys[c.keys.length - 1].at;
