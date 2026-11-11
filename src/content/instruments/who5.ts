import type { Instrument } from "./types";

export const who5: Instrument = {
  id: "who5",
  title: "Well-Being Index (WHO-5)",
  short: "WHO-5",
  category: "wellness",
  minutes: 1,
  clinical: true,
  intro: "Please indicate for each of the five statements which is closest to how you have been feeling over the last two weeks. Notice that higher numbers mean better well-being.",
  whatYouGet: [
    "Overall well-being score (0–100)",
    "Benchmark against typical student well-being",
    "Actionable habits to nurture daily energy",
  ],
  options: [
    { label: "All of the time", value: 5 },
    { label: "Most of the time", value: 4 },
    { label: "More than half of the time", value: 3 },
    { label: "Less than half of the time", value: 2 },
    { label: "Some of the time", value: 1 },
    { label: "At no time", value: 0 },
  ],
  items: [
    { id: "who5-1", text: "I have felt cheerful and in good spirits" },
    { id: "who5-2", text: "I have felt calm and relaxed" },
    { id: "who5-3", text: "I have felt active and vigorous" },
    { id: "who5-4", text: "I woke up feeling fresh and rested" },
    { id: "who5-5", text: "My daily life has been filled with things that interest me" },
  ],
  scoring: { kind: "transform", multiply: 4 },
  // WHO publishes one cut-off: a 0–100 score of 50 or below suggests low well-being and is a reason to ask about mood.
  bands: [
    { min: 0, label: "Low well-being", note: "A percentage score below 50 (raw score below 13) has been suggested as a cut-off for poor mental well-being. It is worth talking to someone you trust or a campus counsellor." },
    { min: 51, label: "Above the low well-being cut-off", note: "At or above the suggested cut-off of 50. Higher is better." },
  ],
  source: "World Health Organization. The World Health Organization-Five Well-Being Index (WHO-5). Geneva: WHO; 2024 (WHO/UCN/MSD/MHE/2024.1).",
  licence: "CC BY-NC-SA 3.0 IGO. WHO does not endorse this app.",
  scienceUrl: "https://cdn.who.int/media/docs/default-source/mental-health/who-5_english-original4da539d6ed4b49389e3afe47cda2326a.pdf",
};
