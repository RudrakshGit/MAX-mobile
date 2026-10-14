/**
 * Pure voice transcription & audio level helpers.
 */

export function hasDevanagari(s: string): boolean {
  return /[\u0900-\u097F]/.test(s);
}

export function acceptRoman(raw: string, roman: string | undefined): string | undefined {
  if (!roman || !roman.trim()) return undefined;
  const rawWords = raw.trim().split(/\s+/).filter(Boolean).length;
  const romanWords = roman.trim().split(/\s+/).filter(Boolean).length;
  if (rawWords === 0 || romanWords === 0) return undefined;
  if (Math.abs(romanWords - rawWords) / rawWords > 0.25) return undefined;
  return roman;
}

export function downsample(levels: number[], n = 60): number[] {
  if (!levels || levels.length === 0) return [];
  if (levels.length <= n) return [...levels];

  const bucketSize = levels.length / n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const start = Math.floor(i * bucketSize);
    const end = Math.min(levels.length, Math.floor((i + 1) * bucketSize));
    const slice = levels.slice(start, Math.max(end, start + 1));
    const avg = slice.reduce((acc, v) => acc + v, 0) / slice.length;
    out.push(Math.round(avg * 1000) / 1000);
  }
  return out;
}

export function isUsableClip(ms: number, levels: number[]): boolean {
  return ms >= 1500 && levels.some((l) => l > 0.08);
}
