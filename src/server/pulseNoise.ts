// Privacy of what students share with their college. Student IDs are random and unauthenticated, so k-anonymity alone can be beaten:
// someone could add 9 fake students to a campus and read the tenth (real) student's numbers off the average.
// Each published average therefore gets Laplace noise sized to one student's influence (scale = range / (n·ε)),
// drawn deterministically from the campus and date so asking again and again cannot average the noise away.

const EPSILON = 1;
const RANGE = 4; // answers are 1–5

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Uniform in (0, 1), stable for a given seed (mulberry32). */
function uniform(seed: string): number {
  let a = hash(seed) + 0x6d2b79f5;
  a = Math.imul(a ^ (a >>> 15), a | 1);
  a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
  const u = ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  return Math.min(Math.max(u, 1e-9), 1 - 1e-9);
}

function laplace(seed: string, b: number): number {
  const u = uniform(seed) - 0.5;
  return -b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

export function noisyMean(mean: number, n: number, seed: string): number {
  const v = Math.min(5, Math.max(1, mean + laplace(seed, RANGE / (Math.max(n, 1) * EPSILON))));
  return Math.round(v * 10) / 10;
}

/** A share (0–1) from n students as a whole percent, with noise sized to one student's influence. */
export function noisyShare(share: number, n: number, seed: string): number {
  const v = Math.min(1, Math.max(0, share + laplace(seed, 1 / (Math.max(n, 1) * EPSILON))));
  return Math.round(v * 100);
}

/** Only today's check-in (or yesterday's, for a late-night check-in or a timezone edge) may be sent. */
export function acceptableDay(day: string, now = new Date()): boolean {
  const d = Date.parse(`${day}T00:00:00Z`);
  if (Number.isNaN(d)) return false;
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diffDays = (d - todayUtc) / 86_400_000;
  return diffDays >= -1 && diffDays <= 1;
}
