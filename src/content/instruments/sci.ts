import type { Instrument, Option } from "./types";

// Official Sleep Condition Indicator (Espie et al. 2014, BMJ Open 4:e004183, Appendix). Each option's value is the
// published item score (4 = best sleep, 0 = worst), options listed in the paper's order.
const minutes5: Option[] = [
  { label: "0–15 min", value: 4 },
  { label: "16–30 min", value: 3 },
  { label: "31–45 min", value: 2 },
  { label: "46–60 min", value: 1 },
  { label: "61 min or more", value: 0 },
];

const extent5: Option[] = [
  { label: "Not at all", value: 4 },
  { label: "A little", value: 3 },
  { label: "Somewhat", value: 2 },
  { label: "Much", value: 1 },
  { label: "Very much", value: 0 },
];

export const sci: Instrument = {
  id: "sci",
  title: "Sleep Condition Indicator (SCI)",
  short: "SCI",
  category: "wellness",
  minutes: 2,
  clinical: true,
  intro: "Thinking about a typical night in the last month…",
  whatYouGet: [
    "Sleep score (0–32; higher means better sleep)",
    "Whether your answers fall in the probable-insomnia range (16 or below)",
    "Practical sleep hygiene and wind-down strategies",
  ],
  options: minutes5,
  items: [
    { id: "sci-1", text: "How long does it take you to fall asleep?" },
    { id: "sci-2", text: "If you then wake up during the night, how long are you awake for in total? (Add all the wakenings up.)" },
    {
      id: "sci-3",
      text: "How many nights a week do you have a problem with your sleep?",
      options: [
        { label: "0–1 nights", value: 4 },
        { label: "2 nights", value: 3 },
        { label: "3 nights", value: 2 },
        { label: "4 nights", value: 1 },
        { label: "5–7 nights", value: 0 },
      ],
    },
    {
      id: "sci-4",
      text: "How would you rate your sleep quality?",
      options: [
        { label: "Very good", value: 4 },
        { label: "Good", value: 3 },
        { label: "Average", value: 2 },
        { label: "Poor", value: 1 },
        { label: "Very poor", value: 0 },
      ],
    },
    { id: "sci-5", text: "Thinking about the past month, to what extent has poor sleep affected your mood, energy, or relationships?", options: extent5 },
    { id: "sci-6", text: "Thinking about the past month, to what extent has poor sleep affected your concentration, productivity, or ability to stay awake?", options: extent5 },
    { id: "sci-7", text: "Thinking about the past month, to what extent has poor sleep troubled you in general?", options: extent5 },
    {
      id: "sci-8",
      text: "How long have you had a problem with your sleep?",
      options: [
        { label: "I don't have a problem / less than 1 month", value: 4 },
        { label: "1–2 months", value: 3 },
        { label: "3–6 months", value: 2 },
        { label: "7–12 months", value: 1 },
        { label: "More than 1 year", value: 0 },
      ],
    },
  ],
  scoring: { kind: "sum" },
  bands: [
    { min: 0, label: "Probable insomnia range", note: "A score of 16 or below is the published cut-off for probable insomnia disorder. This is a screen, not a diagnosis: a doctor or campus counsellor can look at it properly." },
    { min: 17, label: "Above the insomnia range", note: "A score above 16 is outside the published insomnia range. Higher is better sleep." },
  ],
  source: "Espie et al. (2014), BMJ Open 4:e004183.",
  licence: "Creative Commons Attribution Non-Commercial 4.0 (CC BY-NC 4.0, Sleepio Ltd).",
  scienceUrl: "https://pubmed.ncbi.nlm.nih.gov/24647963/",
};
