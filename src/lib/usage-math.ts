// Screen-time maths over raw Android usage events. Pure, so it runs under `node --test`.
//
// Why this exists: the first version added up "app opened → app closed" pairs per app and, when a close event
// was missing, counted the app as open until the end of the day. One lost event per app was enough to show
// 63 hours of "Study" in a 24-hour day. Here only ONE app can be in the foreground at a time, an app stops
// counting the moment another app (or the launcher) comes up, and nothing counts while the screen is off,
// so the total can never exceed the time the screen was on.

export const EV = { RESUME: 1, PAUSE: 2, OFF: 3, ON: 4, UNLOCK: 5 } as const;

/** Flat [code, timeMs, pkgIndex] triples, as returned by the native `appEvents`. */
export type RawEvents = number[];

export type DayUsage = {
  /** minutes the screen was on in [from, to] */
  screenOnMin: number;
  /** foreground minutes per package index */
  appMin: Map<number, number>;
  /** screen-on minutes for each hour of the window */
  hourly: number[];
  /** times the phone was unlocked (or switched on, on phones without a lock screen) */
  pickups: number;
  /** longest unbroken screen-on stretch, minutes */
  longestMin: number;
  /** screen-on minutes between midnight and 5 am at the start of the window */
  nightMin: number;
};

const MIN = 60_000;
const HOUR = 60 * MIN;
// Without screen on/off events (very old phones) a forgotten-open app could still run on; cap one session.
const MAX_SESSION_NO_SCREEN = 3 * HOUR;

type Span = [number, number];

function clip([a, b]: Span, from: number, to: number): Span | null {
  const s = Math.max(a, from), e = Math.min(b, to);
  return e > s ? [s, e] : null;
}

const overlap = (spans: Span[], from: number, to: number) =>
  spans.reduce((m, sp) => {
    const c = clip(sp, from, to);
    return c ? m + (c[1] - c[0]) : m;
  }, 0);

/**
 * Works out screen and app time for [from, to]. `ev` may start before `from` (a few hours of lookback lets us
 * know what was on screen at the start of the window); anything outside the window is not counted.
 * `now` caps the window for "today so far".
 */
export function analyse(ev: RawEvents, from: number, to: number, now = to): DayUsage {
  const end = Math.min(to, now);
  const hasScreen = ev.some((_, i) => i % 3 === 0 && (ev[i] === EV.OFF || ev[i] === EV.ON));
  const hasUnlock = ev.some((_, i) => i % 3 === 0 && ev[i] === EV.UNLOCK);

  // Initial screen state: if the first screen event is "off", the screen was on before it.
  let screenOn = false;
  for (let i = 0; i < ev.length; i += 3) {
    const c = ev[i];
    if (c === EV.OFF) { screenOn = true; break; }
    if (c === EV.ON || c === EV.UNLOCK || c === EV.RESUME) break;
  }
  const firstT = ev.length ? ev[1] : from;
  let onSince: number | null = screenOn ? Math.min(firstT, from) : null;
  const screenSpans: Span[] = [];
  const appSpans: Span[] = [];
  const appMs = new Map<number, number>();
  let pickups = 0;

  let current: number | null = null;
  let since = 0;
  const accrue = (until: number) => {
    if (current === null) return;
    let stop = until;
    if (!hasScreen) stop = Math.min(stop, since + MAX_SESSION_NO_SCREEN);
    const c = clip([since, stop], from, end);
    if (c) {
      appMs.set(current, (appMs.get(current) ?? 0) + (c[1] - c[0]));
      appSpans.push(c);
    }
  };
  const screenUp = (t: number) => {
    if (onSince === null) onSince = t;
  };
  const screenDown = (t: number) => {
    if (onSince !== null) screenSpans.push([onSince, t]);
    onSince = null;
  };

  for (let i = 0; i + 2 < ev.length; i += 3) {
    const code = ev[i], t = ev[i + 1], pkg = ev[i + 2];
    if (t > end) break;
    switch (code) {
      case EV.RESUME:
        if (current !== pkg) {
          accrue(t);
          current = pkg;
          since = t;
        }
        screenUp(t);
        break;
      case EV.PAUSE:
        if (current === pkg) {
          accrue(t);
          current = null;
        }
        break;
      case EV.OFF:
        accrue(t);
        current = null;
        screenDown(t);
        break;
      case EV.ON:
        screenUp(t);
        if (!hasUnlock && t >= from && t < end) pickups++;
        break;
      case EV.UNLOCK:
        screenUp(t);
        if (t >= from && t < end) pickups++;
        break;
    }
  }
  // Still on at the end of the window: count up to the end, but only while the screen is (still) on.
  if (!hasScreen || onSince !== null) accrue(end);
  if (onSince !== null) screenDown(end);

  const spans = hasScreen ? screenSpans : appSpans;
  const screenMs = overlap(spans, from, end);
  const hours = Math.max(1, Math.ceil((to - from) / HOUR));
  const hourly = Array.from({ length: hours }, (_, h) => Math.round(overlap(spans, from + h * HOUR, Math.min(from + (h + 1) * HOUR, end)) / MIN));
  const longest = spans.reduce((m, sp) => {
    const c = clip(sp, from, end);
    return c ? Math.max(m, c[1] - c[0]) : m;
  }, 0);

  const appMin = new Map<number, number>();
  for (const [k, ms] of appMs) appMin.set(k, Math.round((ms / MIN) * 10) / 10);

  return {
    screenOnMin: Math.round(screenMs / MIN),
    appMin,
    hourly,
    pickups,
    longestMin: Math.round(longest / MIN),
    nightMin: Math.round(overlap(spans, from, Math.min(from + 5 * HOUR, end)) / MIN),
  };
}
