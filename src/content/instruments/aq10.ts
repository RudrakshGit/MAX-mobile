import type { Instrument } from "./types";

export const aq10: Instrument = {
  id: "aq10",
  title: "Autism Spectrum Quotient (AQ-10)",
  short: "AQ-10",
  category: "wellness",
  minutes: 2,
  clinical: true,
  ageNote: "Designed for adults 18+. This is a brief screening tool, not a diagnosis.",
  intro: "Please select one option per question only. A quick referral guide for adults with suspected autism who do not have a learning disability.",
  whatYouGet: [
    "AQ-10 total score (0–10)",
    "Indication of whether full clinical referral is recommended",
    "Sensory, social, and executive support tools",
  ],
  options: [
    { label: "Definitely agree", value: 0 },
    { label: "Slightly agree", value: 1 },
    { label: "Slightly disagree", value: 2 },
    { label: "Definitely disagree", value: 3 },
  ],
  items: [
    { id: "aq10-1", text: "I often notice small sounds when others do not." },
    { id: "aq10-2", text: "I usually concentrate more on the whole picture, rather than the small details." },
    { id: "aq10-3", text: "I find it easy to do more than one thing at once." },
    { id: "aq10-4", text: "If there is an interruption, I can switch back to what I was doing very quickly." },
    { id: "aq10-5", text: "I find it easy to 'read between the lines' when someone is talking to me." },
    { id: "aq10-6", text: "I know how to tell if someone listening to me is getting bored." },
    { id: "aq10-7", text: "When I'm reading a story I find it difficult to work out the characters' intentions." },
    { id: "aq10-8", text: "I like to collect information about categories of things (e.g. types of car, types of bird, types of train, types of plant etc)" },
    { id: "aq10-9", text: "I find it easy to work out what someone is thinking or feeling just by looking at their face." },
    { id: "aq10-10", text: "I find it difficult to work out people's intentions." },
  ],
  scoring: {
    kind: "threshold-count",
    positive: (idx: number, val: number) =>
      [0, 6, 7, 9].includes(idx) ? val <= 1 : val >= 2,
    cutoff: 6,
  },
  bands: [
    { min: 0, label: "Below threshold", note: "Score below 6; does not meet the threshold for autism referral." },
    { min: 6, label: "Referral threshold met", note: "Score 6 or higher; NICE CG142 recommends considering comprehensive diagnostic assessment." },
  ],
  source: "Allison, Auyeung & Baron-Cohen (2012), J Am Acad Child Adolesc Psychiatry 51(2):202–212. © SBC/CA/BA/ARC/Cambridge University 1/5/12.",
  licence: "Free of charge for non-profit research and education (Autism Research Centre, Cambridge).",
  scienceUrl: "https://pubmed.ncbi.nlm.nih.gov/22265366/",
};
