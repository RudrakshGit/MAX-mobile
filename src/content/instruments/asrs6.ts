import type { Instrument } from "./types";

export const asrs6: Instrument = {
  id: "asrs6",
  title: "Adult ADHD Screener (ASRS v1.1)",
  short: "ASRS-6",
  category: "wellness",
  minutes: 2,
  clinical: true,
  ageNote: "Designed for adults 18+. This is a screening tool, not a clinical diagnosis.",
  intro: "Please answer the questions below based on how you have felt and behaved over the past 6 months.",
  whatYouGet: [
    "Symptom frequency count (0–6)",
    "Screening result indicating whether evaluation is warranted",
    "Focus and executive functioning strategies",
  ],
  options: [
    { label: "Never", value: 0 },
    { label: "Rarely", value: 1 },
    { label: "Sometimes", value: 2 },
    { label: "Often", value: 3 },
    { label: "Very often", value: 4 },
  ],
  items: [
    { id: "asrs-1", text: "How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?" },
    { id: "asrs-2", text: "How often do you have difficulty getting things in order when you have to do a task that requires organization?" },
    { id: "asrs-3", text: "How often do you have problems remembering appointments or obligations?" },
    { id: "asrs-4", text: "When you have a task that requires a lot of thought, how often do you avoid or delay getting started?" },
    { id: "asrs-5", text: "How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?" },
    { id: "asrs-6", text: "How often do you feel overly active and compelled to do things, like you were driven by a motor?" },
  ],
  scoring: {
    kind: "threshold-count",
    positive: (idx: number, val: number) => (idx <= 2 ? val >= 2 : val >= 3),
    cutoff: 4,
  },
  bands: [
    { min: 0, label: "Unlikely ADHD", note: "Fewer than 4 positive criteria; symptoms are within common range." },
    { min: 4, label: "Consistent with Adult ADHD", note: "4 or more positive criteria; symptoms may be consistent with Adult ADHD. Further clinical evaluation is warranted." },
  ],
  source: "Kessler et al. (2005), Psychol Med 35(2):245–256. © World Health Organization, NYU & Harvard.",
  licence: "Freely available for clinical and non-clinical use with attribution; verbatim only.",
  scienceUrl: "https://pubmed.ncbi.nlm.nih.gov/15841682/",
};
