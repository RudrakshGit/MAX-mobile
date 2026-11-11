// MAX's acting, pose to pose. Times in ms; values in the drawing's units and degrees (see pose.ts). Every action
// anticipates, moves, then holds; loops end where they start. clips.test.ts checks these rules.
import type { Clip, Pose } from "./pose.ts";

/** Sitting down to sleep: a little lower, wider and leaning, arms relaxed. Used by sitDown, sleep and wakeUp. */
const SAT: Partial<Pose> = { by: 6, bsy: 0.93, bsx: 1.06, br: 4, alr: -6, arr: 6, fy: 2 };
/**
 * Lying on its side after the walk on Home: tipped over from the feet, lifted and shifted so the side rests on the
 * ground inside MAX's own box; the lower arm tucked in, the upper one resting forward. Used by lieDown, lieSleep, getUp.
 */
const LIE: Partial<Pose> = { bx: 70, by: -58, br: -80, bsx: 1, bsy: 1, alr: 0, arr: 0, fy: 0 };

export const CLIPS = {
  /** Standing idle: one slow breath (in 1.9 s, out 2.6 s); arms follow 150 ms late. */
  idle: {
    name: "idle",
    kind: "loop",
    keys: [
      { at: 0, pose: { bsy: 1, bsx: 1, alr: 0, arr: 0 } },
      { at: 1900, pose: { bsy: 1.018, bsx: 0.982 }, ease: "inOut" },
      { at: 2050, pose: { alr: 2.5, arr: -2.5 }, ease: "inOut" },
      { at: 4500, pose: { bsy: 1, bsx: 1, alr: 0, arr: 0 }, ease: "inOut" },
    ],
  },
  /** Asleep sitting down: slower, deeper breaths, Zs drifting up. */
  sleep: {
    name: "sleep",
    kind: "loop",
    keys: [
      { at: 0, pose: SAT, face: { eyes: "sleep", brows: "default", mouth: "calm" }, marks: { zs: true } },
      { at: 2200, pose: { bsy: 0.95, bsx: 1.04 }, ease: "inOut" },
      { at: 5200, pose: { bsy: 0.93, bsx: 1.06 }, ease: "inOut" },
    ],
  },
  /** Sitting, awake but worn out, eyes shut, catching its breath (Home's story, before lying down). */
  sit: {
    name: "sit",
    kind: "loop",
    keys: [
      { at: 0, pose: SAT, face: { eyes: "sleep", brows: "default", mouth: "calm" } },
      { at: 2000, pose: { bsy: 0.95, bsx: 1.04 }, ease: "inOut" },
      { at: 4600, pose: { bsy: 0.93, bsx: 1.06 }, ease: "inOut" },
    ],
  },
  /** From sitting, MAX leans back a touch, then slowly tips over onto its side and settles. */
  lieDown: {
    name: "lieDown",
    kind: "action",
    keys: [
      { at: 0 },
      { at: 280, pose: { br: 8, by: 5 }, ease: "standard" },
      { at: 1250, pose: LIE, ease: "inOut", face: { eyes: "sleep", brows: "default", mouth: "calm" } },
      { at: 1750, pose: LIE },
    ],
  },
  /** Asleep lying down: slow breaths, Zs drifting up. */
  lieSleep: {
    name: "lieSleep",
    kind: "loop",
    keys: [
      { at: 0, pose: LIE, face: { eyes: "sleep", brows: "default", mouth: "calm" }, marks: { zs: true } },
      { at: 2600, pose: { bsy: 1.03, bsx: 0.97 }, ease: "inOut" },
      { at: 6000, pose: { bsy: 1, bsx: 1 }, ease: "inOut" },
    ],
  },
  /** Woken while lying: rolls back up to sitting (the stretch and yawn of wakeUp follow). */
  getUp: {
    name: "getUp",
    kind: "action",
    keys: [
      { at: 0, marks: { zs: false } },
      { at: 1150, pose: { ...SAT, bx: 0 }, ease: "inOut" },
      { at: 1600, pose: { ...SAT, bx: 0 } },
    ],
  },
  sitDown: {
    name: "sitDown",
    kind: "action",
    keys: [
      { at: 0 },
      { at: 160, pose: { by: -1 }, ease: "standard" },
      { at: 700, pose: SAT, ease: "standard", face: { eyes: "sleep", mouth: "calm" } },
      { at: 1150, pose: SAT },
    ],
  },
  /** Waking up: a deeper squat, a big stretch with a yawn, hold, then a smile. */
  wakeUp: {
    name: "wakeUp",
    kind: "action",
    keys: [
      { at: 0, marks: { zs: false } },
      { at: 200, pose: { by: 7, bsy: 0.93, bsx: 1.07 }, ease: "standard" },
      { at: 650, pose: { by: -2, br: 0, bsy: 1.06, bsx: 0.95, alr: 140, arr: -140, fy: -2 }, ease: "standard", face: { eyes: "sleep", mouth: "o" } },
      { at: 1150, pose: { by: -2, bsy: 1.06, bsx: 0.95, alr: 140, arr: -140 } },
      { at: 1700, pose: { by: 0, bsy: 1, bsx: 1, alr: 0, arr: 0, fy: 0 }, ease: "standard", face: { eyes: "default", mouth: "smile" } },
      { at: 2150 },
    ],
  },
  /** A real wave: the arm dips first, rises, waves twice, holds, comes down. */
  wave: {
    name: "wave",
    kind: "action",
    keys: [
      { at: 0 },
      { at: 120, pose: { arr: 12, by: 1, br: 1 }, ease: "standard", face: { eyes: "happy", mouth: "open" } },
      { at: 560, pose: { arr: -145, by: 0, br: -2 }, ease: "standard" },
      { at: 800, pose: { arr: -118 }, ease: "inOut" },
      { at: 1040, pose: { arr: -145 }, ease: "inOut" },
      { at: 1280, pose: { arr: -118 }, ease: "inOut" },
      { at: 1520, pose: { arr: -140 }, ease: "inOut" },
      { at: 1950, pose: { arr: -140, br: -2 } },
      { at: 2600, pose: { arr: 0, br: 0 }, ease: "standard", face: { eyes: "default", mouth: "smile" } },
    ],
  },
  /** One happy hop (instead of confetti): squat, rise with arms up, short hang, land, settle, hold. */
  hop: {
    name: "hop",
    kind: "action",
    keys: [
      { at: 0 },
      { at: 140, pose: { by: 0, bsy: 0.93, bsx: 1.07, alr: -8, arr: 8 }, ease: "standard", face: { eyes: "happy", mouth: "open" } },
      { at: 440, pose: { by: -12, bsy: 1.05, bsx: 0.95 }, ease: "standard", marks: { sparkles: true } },
      { at: 540, pose: { by: -12 } },
      // the arms follow the body up a beat later (follow-through)
      { at: 620, pose: { alr: 130, arr: -130 }, ease: "standard" },
      { at: 760, pose: { by: 0, bsy: 0.94, bsx: 1.06 }, ease: "accel" },
      { at: 1040, pose: { bsy: 1, bsx: 1, alr: 30, arr: -30 }, ease: "standard" },
      { at: 1540, pose: { bsy: 1, bsx: 1, alr: 30, arr: -30 }, marks: { sparkles: false } },
      { at: 1940, pose: { alr: 0, arr: 0 }, ease: "standard", face: { eyes: "default", mouth: "smile" } },
    ],
  },
  /** The floating MAX's small hop when the student changes tab. */
  smallHop: {
    name: "smallHop",
    kind: "action",
    keys: [
      { at: 0 },
      { at: 110, pose: { bsy: 0.95, bsx: 1.05 }, ease: "standard" },
      { at: 330, pose: { by: -8, bsy: 1.03, bsx: 0.97 }, ease: "decel" },
      { at: 540, pose: { by: 0, bsy: 0.96, bsx: 1.04 }, ease: "accel" },
      { at: 740, pose: { bsy: 1, bsx: 1 }, ease: "decel" },
      { at: 1150, pose: { bsy: 1, bsx: 1 } },
    ],
  },
  nod: {
    name: "nod",
    kind: "action",
    keys: [
      { at: 0 },
      { at: 180, pose: { fy: 3, by: 1.5 }, ease: "standard" },
      { at: 420, pose: { fy: 0, by: 0 }, ease: "standard" },
      { at: 600, pose: { fy: 2.5, by: 1 }, ease: "standard" },
      { at: 850, pose: { fy: 0, by: 0 }, ease: "standard" },
      { at: 1300, pose: { fy: 0, by: 0 } },
    ],
  },
  /** Tapped: looks straight at the student and smiles, a tiny lift, holds. */
  tapReact: {
    name: "tapReact",
    kind: "action",
    keys: [
      { at: 0 },
      { at: 100, pose: { fx: 0, fy: 0, by: -2 }, ease: "decel", face: { eyes: "happy", mouth: "open" } },
      { at: 350, pose: { by: 0 }, ease: "standard" },
      { at: 1000, pose: { by: 0, fx: 0, fy: 0 } },
      { at: 1300, face: { eyes: "default", mouth: "smile" } },
    ],
  },
  lookLeft: {
    name: "lookLeft",
    kind: "action",
    keys: [
      { at: 0 },
      { at: 90, pose: { fx: -5 }, ease: "standard" },
      { at: 640, pose: { br: -1.5 }, ease: "standard" },
      { at: 1900, pose: { fx: -5, br: -1.5 } },
      { at: 2300, pose: { fx: 0, br: 0 }, ease: "standard" },
    ],
  },
  lookRight: {
    name: "lookRight",
    kind: "action",
    keys: [
      { at: 0 },
      { at: 90, pose: { fx: 5 }, ease: "standard" },
      { at: 640, pose: { br: 1.5 }, ease: "standard" },
      { at: 1900, pose: { fx: 5, br: 1.5 } },
      { at: 2300, pose: { fx: 0, br: 0 }, ease: "standard" },
    ],
  },
  lookAround: {
    name: "lookAround",
    kind: "action",
    keys: [
      { at: 0 },
      { at: 90, pose: { fx: -5 }, ease: "standard" },
      { at: 900, pose: { fx: -5 } },
      { at: 990, pose: { fx: 5 }, ease: "standard" },
      { at: 1800, pose: { fx: 5 } },
      { at: 2200, pose: { fx: 0 }, ease: "standard" },
      { at: 2600, pose: { fx: 0 } },
    ],
  },
  yawn: {
    name: "yawn",
    kind: "action",
    keys: [
      { at: 0 },
      { at: 200, pose: { by: 1, fy: 1 }, ease: "standard" },
      { at: 700, pose: { by: -2, bsy: 1.04, bsx: 0.96, alr: 50, arr: -50, fy: -2 }, ease: "standard", face: { eyes: "sleep", mouth: "o" } },
      { at: 1300, pose: { by: -2, bsy: 1.04, bsx: 0.96, alr: 50, arr: -50, fy: -2 } },
      { at: 1800, pose: { by: 0, bsy: 1, bsx: 1, alr: 0, arr: 0, fy: 0 }, ease: "standard", face: { eyes: "default", mouth: "smile" } },
      { at: 2200 },
    ],
  },
  /** Thinking: head tilted, eyes up, one arm raised toward the chin; dots appear one by one. */
  think: {
    name: "think",
    kind: "loop",
    keys: [
      { at: 0, pose: { br: 3, fx: 3, fy: -3, arr: -25, bsy: 1, bsx: 1 }, face: { eyes: "thinking", brows: "curious", mouth: "smile" }, marks: { dots: true } },
      { at: 1800, pose: { br: 1.5, fx: 2.5, fy: -3.5, bsy: 1.012, bsx: 0.988 }, ease: "inOut" },
      { at: 3600, pose: { br: 3, fx: 3, fy: -3, bsy: 1, bsx: 1 }, ease: "inOut" },
    ],
  },
  /** Listening: leaning toward what the student types, eyes on it. */
  listen: {
    name: "listen",
    kind: "loop",
    keys: [
      { at: 0, pose: { br: -4, fx: -3, fy: 2, bsy: 1, bsx: 1 }, face: { eyes: "default", brows: "curious", mouth: "smile" } },
      { at: 2000, pose: { br: -3, bsy: 1.012, bsx: 0.988 }, ease: "inOut" },
      { at: 4000, pose: { br: -4, bsy: 1, bsx: 1 }, ease: "inOut" },
    ],
  },
  /** Care (Help, a hard journal entry): a very slow sway, soft face, a small heart. No bounce. */
  care: {
    name: "care",
    kind: "loop",
    keys: [
      { at: 0, pose: { br: -1.5, bsy: 1, bsx: 1 }, face: { eyes: "default", brows: "care", mouth: "calm" }, marks: { heart: true } },
      { at: 3200, pose: { br: 1.5, bsy: 1.012, bsx: 0.988 }, ease: "inOut" },
      { at: 6400, pose: { br: -1.5, bsy: 1, bsx: 1 }, ease: "inOut" },
    ],
  },
  /** Long press: leans into the finger, eyes closed happily. */
  pet: {
    name: "pet",
    kind: "loop",
    keys: [
      { at: 0, pose: { br: 4, bsy: 0.97, bsx: 1.03, fy: 1 }, face: { eyes: "happy", mouth: "open" }, marks: { heart: true } },
      { at: 1200, pose: { br: 5, bsy: 0.965, bsx: 1.035 }, ease: "inOut" },
      { at: 2400, pose: { br: 4, bsy: 0.97, bsx: 1.03 }, ease: "inOut" },
    ],
  },
  /** Held by the finger (floating MAX): stretched a little, arms dangling. */
  drag: {
    name: "drag",
    kind: "loop",
    keys: [
      { at: 0, pose: { bsy: 1.06, bsx: 0.95, alr: 35, arr: -35, by: 0, br: 0 }, face: { eyes: "surprised", mouth: "o" } },
      { at: 800, pose: { alr: 42, arr: -42 }, ease: "inOut" },
      { at: 1600, pose: { alr: 35, arr: -35 }, ease: "inOut" },
    ],
  },
  /** Pressed against a screen edge while dragged. */
  wall: {
    name: "wall",
    kind: "loop",
    keys: [
      { at: 0, pose: { bsx: 0.94, bsy: 1.05, alr: 20, arr: -20 }, face: { eyes: "surprised", brows: "anxious", mouth: "calm" } },
      { at: 1000, pose: { bsx: 0.94, bsy: 1.05, alr: 20, arr: -20 } },
    ],
  },
  /** Let go: a short squash on landing, settle, hold. */
  land: {
    name: "land",
    kind: "action",
    keys: [
      { at: 0 },
      { at: 120, pose: { bsy: 0.93, bsx: 1.07, alr: 20, arr: -20 }, ease: "accel" },
      { at: 460, pose: { bsy: 1, bsx: 1, alr: 0, arr: 0 }, ease: "decel", face: { eyes: "default", brows: "default", mouth: "smile" } },
      { at: 900, pose: { bsy: 1, bsx: 1, alr: 0, arr: 0 } },
    ],
  },
  /** Shaken: wobbles with spiral eyes and stars, then shakes it off and smiles (never angry). */
  dizzy: {
    name: "dizzy",
    kind: "action",
    keys: [
      { at: 0, face: { eyes: "dizzy", brows: "default", mouth: "dizzy" }, marks: { stars: true } },
      { at: 400, pose: { br: -6 }, ease: "inOut" },
      { at: 800, pose: { br: 5 }, ease: "inOut" },
      { at: 1200, pose: { br: -4 }, ease: "inOut" },
      { at: 1600, pose: { br: 0 }, ease: "inOut", marks: { stars: false } },
      { at: 1750, pose: { fx: -3 }, ease: "standard" },
      { at: 1900, pose: { fx: 3 }, ease: "standard" },
      { at: 2050, pose: { fx: 0 }, ease: "standard", face: { eyes: "happy", mouth: "smile" } },
      { at: 2500, pose: { fx: 0, br: 0 } },
    ],
  },
  /** After a low check-in: MAX leans in gently with a soft face and a small heart, holds, then smiles. */
  comfort: {
    name: "comfort",
    kind: "action",
    keys: [
      { at: 0, face: { eyes: "default", brows: "care", mouth: "calm" }, marks: { heart: true } },
      { at: 450, pose: { br: -3, by: 1.5, fy: 2 }, ease: "inOut" },
      { at: 1450, pose: { br: -3, by: 1.5, fy: 2 } },
      { at: 1950, pose: { br: 0, by: 0, fy: 0 }, ease: "inOut" },
      { at: 2900, pose: { br: 0, by: 0, fy: 0 }, face: { brows: "default", mouth: "smile" }, marks: { heart: false } },
    ],
  },
  /** Settings → Appearance: MAX reaches up and tugs the lamp's cord (the theme switch starts as it pulls). */
  tug: {
    name: "tug",
    kind: "action",
    keys: [
      { at: 0 },
      { at: 300, pose: { arr: -150, by: -2, br: -2 }, ease: "inOut", face: { eyes: "happy", mouth: "open" } },
      { at: 440, pose: { arr: -105, by: 1, br: 0 }, ease: "accel" },
      { at: 900, pose: { arr: -105, by: 1 } },
      { at: 1300, pose: { arr: 0, by: 0 }, ease: "inOut", face: { eyes: "default", mouth: "smile" } },
    ],
  },
} satisfies Record<string, Clip>;

export type ClipName = keyof typeof CLIPS;

/** The blink runs on its own channel, over any other clip. Too short to hold, by design. */
export const BLINK_CLIP: Clip = {
  name: "blink",
  kind: "action",
  keys: [
    { at: 0, pose: { lid: 0 } },
    { at: 80, pose: { lid: 1 }, ease: "accel" },
    { at: 110, pose: { lid: 1 } },
    { at: 270, pose: { lid: 0 }, ease: "decel" },
  ],
};

/** Idle gestures MAX picks from now and then (yawns only late at night). */
export const IDLE_GESTURES: ClipName[] = ["lookLeft", "lookRight", "lookAround", "nod"];
export const NIGHT_GESTURES: ClipName[] = ["yawn", "lookLeft", "lookRight"];
