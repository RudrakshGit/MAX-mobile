import type { Band, Instrument, Result } from "./types";

function pickBand(val: number, bands: Band[]): string | undefined {
  if (!bands || bands.length === 0) return undefined;
  const sorted = [...bands].sort((a, b) => a.min - b.min);
  const matching = sorted.filter((b) => val >= b.min);
  return matching.length > 0 ? matching[matching.length - 1].label : sorted[0].label;
}

export function score(instrument: Instrument, answers: (number | null)[]): Result {
  // The safety flag is decided from the answers given, before completeness is checked: a student
  // who answers "nearly every day" to the self-harm item and skips another question still gets help.
  const crisisAnswer = instrument.crisisItem !== undefined ? answers[instrument.crisisItem] : undefined;
  const flag = typeof crisisAnswer === "number" && crisisAnswer > 0;

  // Any null or missing item means the test is incomplete
  if (answers.length !== instrument.items.length || answers.some((a) => a === null)) {
    return { score: 0, flag, incomplete: true };
  }

  const validAnswers = answers as number[];

  // Calculate effective value per item respecting reverse-scoring
  const effectiveVals = validAnswers.map((val, i) => {
    const item = instrument.items[i];
    if (item.reverse) {
      const opts = item.options ?? instrument.options;
      const minVal = Math.min(...opts.map((o) => o.value));
      const maxVal = Math.max(...opts.map((o) => o.value));
      return minVal + maxVal - val;
    }
    return val;
  });

  const scoring = instrument.scoring;

  if (scoring.kind === "sum") {
    const total = effectiveVals.reduce((a, b) => a + b, 0);
    const band = pickBand(total, instrument.bands);
    return { score: total, band, flag, incomplete: false };
  }

  if (scoring.kind === "mean") {
    const sum = effectiveVals.reduce((a, b) => a + b, 0);
    const avg = Math.round((sum / effectiveVals.length) * 100) / 100;
    const band = pickBand(avg, instrument.bands);
    return { score: avg, band, flag, incomplete: false };
  }

  if (scoring.kind === "transform") {
    const raw = effectiveVals.reduce((a, b) => a + b, 0);
    const transformed = Math.round(raw * scoring.multiply);
    const band = pickBand(transformed, instrument.bands);
    return { score: transformed, band, flag, incomplete: false };
  }

  if (scoring.kind === "threshold-count") {
    let count = 0;
    for (let i = 0; i < validAnswers.length; i++) {
      if (scoring.positive(i, validAnswers[i])) {
        count++;
      }
    }
    const band = pickBand(count, instrument.bands);
    return { score: count, band, flag, incomplete: false };
  }

  if (scoring.kind === "subscales") {
    const groups: Record<string, number[]> = {};
    instrument.items.forEach((item, i) => {
      const key = item.subscale ?? "general";
      if (!groups[key]) groups[key] = [];
      groups[key].push(effectiveVals[i]);
    });

    const parts: Record<string, number> = {};
    for (const [key, vals] of Object.entries(groups)) {
      if (scoring.agg === "mean") {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        parts[key] = Math.round(avg * 10) / 10;
      } else {
        parts[key] = vals.reduce((a, b) => a + b, 0);
      }
    }

    const partValues = Object.values(parts);
    // For CBI, report maximum burnout between personal and study; otherwise sum or average
    const mainScore =
      instrument.id === "cbi"
        ? Math.max(...partValues)
        : Math.round(partValues.reduce((a, b) => a + b, 0));
    const band = pickBand(mainScore, instrument.bands);
    return { score: mainScore, band, parts, flag, incomplete: false };
  }

  if (scoring.kind === "profile") {
    const groups: Record<string, number> = {};
    instrument.items.forEach((item, i) => {
      const key = item.subscale ?? "general";
      groups[key] = (groups[key] ?? 0) + effectiveVals[i];
    });

    const top = Object.entries(groups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);

    return { score: 0, parts: groups, top, flag, incomplete: false };
  }

  return { score: 0, flag, incomplete: false };
}
