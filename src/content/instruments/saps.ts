import type { Instrument } from "./types";

export const saps: Instrument = {
  id: "saps",
  title: "Short Almost Perfect Scale (SAPS)",
  short: "SAPS",
  category: "growth",
  minutes: 2,
  clinical: false,
  intro: "The statements below relate to your personal standards and your feelings about performance.",
  whatYouGet: [
    "High Standards subscale score (4–28)",
    "Discrepancy (self-critical gap) score (4–28)",
    "Insight into adaptive vs maladaptive perfectionism",
  ],
  options: [
    { label: "Strongly disagree", value: 1 },
    { label: "Disagree", value: 2 },
    { label: "Slightly disagree", value: 3 },
    { label: "Neutral", value: 4 },
    { label: "Slightly agree", value: 5 },
    { label: "Agree", value: 6 },
    { label: "Strongly agree", value: 7 },
  ],
  // Official wording and item order (Rice, Richardson & Tueller 2014, Table 1). Standards = 1,3,5,7; Discrepancy = 2,4,6,8.
  items: [
    { id: "saps-1", subscale: "standards", text: "I have high expectations for myself." },
    { id: "saps-2", subscale: "discrepancy", text: "Doing my best never seems to be enough." },
    { id: "saps-3", subscale: "standards", text: "I set very high standards for myself." },
    { id: "saps-4", subscale: "discrepancy", text: "I often feel disappointment after completing a task because I know I could have done better." },
    { id: "saps-5", subscale: "standards", text: "I have a strong need to strive for excellence." },
    { id: "saps-6", subscale: "discrepancy", text: "My performance rarely measures up to my standards." },
    { id: "saps-7", subscale: "standards", text: "I expect the best from myself." },
    { id: "saps-8", subscale: "discrepancy", text: "I am hardly ever satisfied with my performance." },
  ],
  scoring: { kind: "subscales", agg: "sum" },
  bands: [],
  source: "Rice, Richardson & Tueller (2014), J Pers Assess 96(3):368–379.",
  licence: "Public research use (GSU Rice lab; no permission needed).",
  scienceUrl: "https://pubmed.ncbi.nlm.nih.gov/24168058/",
};
