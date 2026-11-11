import type { Instrument } from "./types";

export const asrs6: Instrument = {
  id: "asrs6",
  title: "Adult ADHD Screener (ASRS v1.1)",
  short: "ASRS-6",
  category: "wellness",
  minutes: 2,
  clinical: true,
  ageNote: "Designed for adults 18+. This is a screening tool, not a clinical diagnosis.",
  intro: "Select the option that best describes how you have felt and conducted yourself over the past 6 months.",
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
    { label: "Very Often", value: 4 },
  ],
  items: [
    { id: "asrs-1", shade: [2, 3, 4], text: "How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?" },
    { id: "asrs-2", shade: [2, 3, 4], text: "How often do you have difficulty getting things in order when you have to do a task that requires organization?" },
    { id: "asrs-3", shade: [2, 3, 4], text: "How often do you have problems remembering appointments or obligations?" },
    { id: "asrs-4", shade: [3, 4], text: "When you have a task that requires a lot of thought, how often do you avoid or delay getting started?" },
    { id: "asrs-5", shade: [3, 4], text: "How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?" },
    { id: "asrs-6", shade: [3, 4], text: "How often do you feel overly active and compelled to do things, like you were driven by a motor?" },
  ],
  scoring: {
    kind: "threshold-count",
    positive: (idx: number, val: number) => (idx <= 2 ? val >= 2 : val >= 3),
    cutoff: 4,
  },
  bands: [
    { min: 0, label: "Below the screening threshold", note: "Fewer than four answers in the shaded range. This screener cannot rule anything in or out; if attention problems trouble you, a doctor can help." },
    { min: 4, label: "May be consistent with adult ADHD", note: "Four (4) or more checkmarks indicate that your symptoms may be consistent with Adult ADHD. It may be beneficial for you to talk with your healthcare provider about an evaluation." },
  ],
  source: "Kessler et al. (2005), Psychol Med 35(2):245–256. ASRS v1.1 Screener © New York University and Ronald C. Kessler, PhD. All rights reserved.",
  licence: "Free to use with citation and copyright notice, provided the items, all response options, the scoring and the two levels of shading are kept unchanged (Harvard NCS).",
  scienceUrl: "https://pubmed.ncbi.nlm.nih.gov/15841682/",
};
