import type { Instrument, Option } from "./types";

const often5: Option[] = [
  { label: "Always", value: 100 },
  { label: "Often", value: 75 },
  { label: "Sometimes", value: 50 },
  { label: "Seldom", value: 25 },
  { label: "Never/almost never", value: 0 },
];

const degree5: Option[] = [
  { label: "To a very high degree", value: 100 },
  { label: "To a high degree", value: 75 },
  { label: "Somewhat", value: 50 },
  { label: "To a low degree", value: 25 },
  { label: "To a very low degree", value: 0 },
];

export const cbi: Instrument = {
  id: "cbi",
  title: "Burnout check (CBI)",
  short: "CBI",
  category: "wellness",
  minutes: 3,
  clinical: false,
  intro: "Personal and study-related burnout. Answer for how things have been lately.",
  whatYouGet: [
    "Personal exhaustion score (0–100)",
    "Study-related exhaustion score (0–100)",
    "Practical ideas to reset and balance energy",
  ],
  options: often5,
  items: [
    { id: "cbi-1", subscale: "personal", text: "How often do you feel tired?" },
    { id: "cbi-2", subscale: "personal", text: "How often are you physically exhausted?" },
    { id: "cbi-3", subscale: "personal", text: "How often are you emotionally exhausted?" },
    { id: "cbi-4", subscale: "personal", text: "How often do you think: “I can't take it anymore”?" },
    { id: "cbi-5", subscale: "personal", text: "How often do you feel worn out?" },
    { id: "cbi-6", subscale: "personal", text: "How often do you feel weak and susceptible to illness?" },
    { id: "cbi-7", subscale: "study", text: "Are your studies emotionally exhausting?", options: degree5 },
    { id: "cbi-8", subscale: "study", text: "Do you feel burnt out because of your studies?", options: degree5 },
    { id: "cbi-9", subscale: "study", text: "Do your studies frustrate you?", options: degree5 },
    { id: "cbi-10", subscale: "study", text: "Do you feel worn out at the end of a day at college?" },
    { id: "cbi-11", subscale: "study", text: "Are you exhausted in the morning at the thought of another day at college?" },
    { id: "cbi-12", subscale: "study", text: "Do you feel that every hour of studying is tiring for you?" },
    { id: "cbi-13", subscale: "study", text: "Do you have enough energy for family and friends in your free time?", reverse: true },
  ],
  scoring: { kind: "subscales", agg: "mean" },
  // Commonly used CBI categories in the literature (the original paper defines none): below 50 low, 50–74 moderate, 75–99 high, 100 severe.
  // The official CBI scoring (NFA, Denmark) is the mean of each scale, 0–100, with no cut-offs. The 50/75/100
  // categories seen in later papers could not be traced to a primary source, so none are shown.
  bands: [],
  source: "Kristensen, Borritz, Villadsen & Christensen (2005), Work & Stress 19(3):192–207. Student items adapted by MAX from the work-burnout scale (no clean English student version is published).",
  licence: "Free to use; the authors state the wording may be adapted (NFA, Denmark).",
  scienceUrl: "https://pubmed.ncbi.nlm.nih.gov/19223398/",
};
