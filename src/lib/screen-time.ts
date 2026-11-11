// Pure maths over screen on/off events from the phone. No native imports, so
// it runs under `node --test`.

export type Ev = [number, number]; // [1 = on | 0 = off, timeMs]
type Span = [number, number];
const H = 3600e3;

/** Screen-on spans clipped to [from, to]. If the first event is "off", the screen was on at `from`. */
export function onSpans(ev: Ev[], from: number, to: number): Span[] {
  const out: Span[] = [];
  let onAt: number | null = ev.length && ev[0][0] === 0 ? from : null;
  for (const [state, t] of ev) {
    if (state === 1 && onAt === null) onAt = t;
    else if (state === 0 && onAt !== null) {
      out.push([onAt, t]);
      onAt = null;
    }
  }
  if (onAt !== null) out.push([onAt, to]);
  return out.map(([a, b]): Span => [Math.max(a, from), Math.min(b, to)]).filter(([a, b]) => b > a);
}

export function minutesOn(spans: Span[], from: number, to: number) {
  return spans.reduce((m, [a, b]) => m + Math.max(0, Math.min(b, to) - Math.max(a, from)), 0) / 60000;
}

/** Sleep starts where the longest screen-off gap (at least 3 h) in [from, to] begins. */
export function sleepStart(spans: Span[], from: number, to: number): number | null {
  let best = 0;
  let at: number | null = null;
  let cursor = from;
  for (const [a, b] of [...spans.filter(([, b]) => b > from), [to, to] as Span]) {
    if (a - cursor > best) {
      best = a - cursor;
      at = cursor;
    }
    cursor = Math.max(cursor, b);
  }
  // A gap that starts at the very beginning of the window means no phone use was seen that evening at all
  // (phone off, or not used): the sleep time is unknown, not "8 pm".
  return best >= 3 * H && at !== from ? at : null;
}

/** Yesterday midnight → now; the night is yesterday 8 pm → today noon (or now, if earlier). */
export function windows(now: Date) {
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  const dayStart = new Date(y, m, d - 1).getTime();
  const nightFrom = new Date(y, m, d - 1, 20).getTime();
  const nightTo = Math.min(new Date(y, m, d, 12).getTime(), now.getTime());
  return { dayStart, dayEnd: new Date(y, m, d).getTime(), nightFrom, nightTo, now: now.getTime() };
}

export function lastNight(ev: Ev[], now: Date) {
  const w = windows(now);
  const spans = onSpans(ev, w.dayStart, w.now);
  const sleepAt = sleepStart(spans, w.nightFrom, w.nightTo);
  return {
    sleepAt,
    beforeSleep: sleepAt === null ? null : Math.round(minutesOn(spans, sleepAt - H, sleepAt)),
    yesterday: Math.round(minutesOn(spans, w.dayStart, w.dayEnd)),
  };
}

/** Maps measured minutes onto the check-in's choices. */
export const bucket = (min: number) => (min < 8 ? 0 : min < 23 ? 15 : min < 45 ? 30 : 60);
