import type { Instrument } from "./types";

export const bas2: Instrument = {
  id: "bas2",
  title: "Body Appreciation Scale-2 (BAS-2)",
  short: "BAS-2",
  category: "growth",
  minutes: 2,
  clinical: false,
  intro: "Please indicate how much each statement describes your feelings about your body.",
  whatYouGet: [
    "Overall body appreciation mean score (1.0–5.0)",
    "Perspective on body gratitude and respect",
    "Body neutrality and self-kindness reflections",
  ],
  options: [
    { label: "Never", value: 1 },
    { label: "Seldom", value: 2 },
    { label: "Sometimes", value: 3 },
    { label: "Often", value: 4 },
    { label: "Always", value: 5 },
  ],
  items: [
    { id: "bas-1", text: "I respect my body." },
    { id: "bas-2", text: "I feel good about my body." },
    { id: "bas-3", text: "I feel that my body has at least some good qualities." },
    { id: "bas-4", text: "I take a positive attitude towards my body." },
    { id: "bas-5", text: "I am attentive to my body's needs." },
    { id: "bas-6", text: "I feel love for my body." },
    { id: "bas-7", text: "I appreciate the different and unique characteristics of my body." },
    { id: "bas-8", text: "My behavior reveals my positive attitude toward my body; for example, I walk holding my head high and smiling." },
    { id: "bas-9", text: "I am comfortable in my body." },
    { id: "bas-10", text: "I feel like I am beautiful even if I am different from media images of attractive people (e.g., models, actresses/actors)." },
  ],
  scoring: { kind: "mean", scaleMin: 1 },
  // Tylka & Wood-Barcalow (2015) give the mean (1–5), higher means more body appreciation. No cut-offs are published.
  bands: [],
  source: "Tylka & Wood-Barcalow (2015), Body Image 12:53–67.",
  licence: "Free to use in any setting (Cambridge Handbook of Body Image-Related Measures).",
  scienceUrl: "https://pubmed.ncbi.nlm.nih.gov/25462882/",
};
