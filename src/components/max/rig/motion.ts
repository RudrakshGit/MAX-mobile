// MAX's motion rules (docs/plan/M16-motion-cards-ia.md, "Animation approach"). Plain data and pure functions so the
// clips can be unit-tested with `node --test`; every function used on the UI thread is a worklet.

/** Cubic-bezier control points. Every curve keeps y within [0, 1], so nothing overshoots its target. */
export const EASE = {
  /** Material 3 standard: most UI and pose changes. */
  standard: [0.2, 0, 0, 1],
  /** Material 3 standard decelerate: things arriving (a hop's rise, a settle). */
  decel: [0, 0, 0, 1],
  /** Material 3 standard accelerate: things leaving (a fall, a blink closing). */
  accel: [0.3, 0, 1, 1],
  /** Sine in-out: breathing, sways and other back-and-forth character motion. */
  inOut: [0.37, 0, 0.63, 1],
  linear: [0, 0, 1, 1],
} as const;
export type EaseName = keyof typeof EASE;

/** Limits the tests enforce on every clip. */
export const LIMITS = {
  /** Squash and stretch: at most 8% either way, measured from the feet. */
  squash: 0.08,
  /** A value may pass its keyframes by at most 1% of the move. */
  overshoot: 0.01,
  /** Every action clip holds a pose this long before it ends or returns. */
  holdMs: 400,
} as const;

/** Blinks: lid closes fast, opens about twice as slow; random gaps, sometimes a double blink. */
export const BLINK = { closeMs: 80, shutMs: 30, openMs: 160, gapMinMs: 2000, gapMaxMs: 7000, doubleChance: 0.12 } as const;

/** Idle: one slow breath every 4.5 s (about 13 a minute) and an idle gesture every 6–15 s. */
export const IDLE = { breathMs: 4500, breathAmp: 0.018, gestureGapMinMs: 6000, gestureGapMaxMs: 15000 } as const;

/** Looking: eyes jump first, the head (face shift) follows; a gaze is held at most 3 s. */
export const LOOK = { eyesMs: 90, headDelayMs: 150, headMs: 400, holdMaxMs: 3000 } as const;

/** A calm walk: 0.65 s per step (one cycle = two steps), a bob of about 2% of MAX's height, no squash per step. */
export const WALK = { cycleMs: 1300, tiredCycleMs: 1700, bob: 3, lean: -2, sway: 0.8 } as const;

/** Cubic-bezier easing: `bezier(points, x)` for x in [0, 1]. Newton steps with a bisection fallback (WebKit UnitBezier). */
export function bezier(p: readonly number[], x: number): number {
  "worklet";
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const x1 = p[0], y1 = p[1], x2 = p[2], y2 = p[3];
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  let t = x;
  for (let i = 0; i < 8; i++) {
    const err = ((ax * t + bx) * t + cx) * t - x;
    if (Math.abs(err) < 1e-6) return ((ay * t + by) * t + cy) * t;
    const d = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(d) < 1e-6) break;
    t -= err / d;
  }
  let lo = 0, hi = 1;
  t = x;
  for (let i = 0; i < 40; i++) {
    const v = ((ax * t + bx) * t + cx) * t;
    if (Math.abs(v - x) < 1e-6) break;
    if (x > v) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return ((ay * t + by) * t + cy) * t;
}

/** Easing by name, as a worklet function `withTiming` can use. */
export function easing(name: EaseName): (x: number) => number {
  const p = EASE[name];
  return (x: number) => {
    "worklet";
    return bezier(p, x);
  };
}

/** Hand-drawn animation runs "on twos" (12 drawings a second). */
export const ON_TWOS_MS = 1000 / 12;

/**
 * The same easing in `steps` held steps, for slow loops (breathing, sways): the value only changes 12 times a second,
 * and a view whose transform didn't change isn't redrawn, so a breathing MAX costs a fraction of 60 redraws a second.
 */
export function steppedEasing(name: EaseName, durationMs: number): (x: number) => number {
  const p = EASE[name];
  const n = Math.max(1, Math.round(durationMs / ON_TWOS_MS));
  return (x: number) => {
    "worklet";
    return bezier(p, Math.round(x * n) / n);
  };
}

/** Seeded random numbers (mulberry32) so idle timing is irregular but reproducible in tests. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Milliseconds until the next blink, and whether it is a double blink. */
export function nextBlink(random: () => number): { inMs: number; double: boolean } {
  return {
    inMs: Math.round(BLINK.gapMinMs + random() * (BLINK.gapMaxMs - BLINK.gapMinMs)),
    double: random() < BLINK.doubleChance,
  };
}

/** Milliseconds until the next idle gesture. */
export function nextGesture(random: () => number): number {
  return Math.round(IDLE.gestureGapMinMs + random() * (IDLE.gestureGapMaxMs - IDLE.gestureGapMinMs));
}
