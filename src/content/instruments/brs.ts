import type { Instrument } from "./types";

export const brs: Instrument = {
  id: "brs",
  title: "Brief Resilience Scale (BRS)",
  short: "BRS",
  category: "growth",
  minutes: 2,
  clinical: false,
  intro: "Please indicate how much you agree with each statement about how you bounce back from difficulties.",
  whatYouGet: [
    "Resilience mean score (1.0–5.0)",
    "Benchmark against normative resilience bands",
    "Tools for bounce-back and emotional recovery",
  ],
  options: [
    { label: "Strongly disagree", value: 1 },
    { label: "Disagree", value: 2 },
    { label: "Neutral", value: 3 },
    { label: "Agree", value: 4 },
    { label: "Strongly agree", value: 5 },
  ],
  items: [
    { id: "brs-1", text: "I tend to bounce back quickly after hard times." },
    { id: "brs-2", text: "I have a hard time making it through stressful events.", reverse: true },
    { id: "brs-3", text: "It does not take me long to recover from a stressful event." },
    { id: "brs-4", text: "It is hard for me to snap back when something bad happens.", reverse: true },
    { id: "brs-5", text: "I usually come through difficult times with little trouble." },
    { id: "brs-6", text: "I tend to take a long time to get over set-backs in my life.", reverse: true },
  ],
  scoring: { kind: "mean", scaleMin: 1 },
  bands: [
    { min: 1.0, label: "Low resilience", note: "Score 1.00–2.99; hard time bouncing back from stress." },
    { min: 3.0, label: "Normal resilience", note: "Score 3.00–4.30; typical resilience in facing challenges." },
    { min: 4.31, label: "High resilience", note: "Score 4.31–5.00; exceptional ability to bounce back quickly." },
  ],
  source: "Smith et al. (2008), Int J Behav Med 15(3):194–200.",
  licence: "Open access / unrestricted research use.",
  scienceUrl: "https://pubmed.ncbi.nlm.nih.gov/18696313/",
};
