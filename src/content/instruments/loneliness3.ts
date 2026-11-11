import type { Instrument } from "./types";

export const loneliness3: Instrument = {
  id: "loneliness3",
  title: "Loneliness check (TILS / UCLA-3)",
  short: "Loneliness",
  category: "wellness",
  minutes: 1,
  clinical: false,
  intro: "The next questions are about how you feel about different aspects of your life. For each one, choose how often you feel that way.",
  whatYouGet: [
    "A 3–9 score reflecting social connection",
    "Insights into feeling left out or isolated",
    "Connection practices and campus groups",
  ],
  options: [
    { label: "Hardly ever", value: 1 },
    { label: "Some of the time", value: 2 },
    { label: "Often", value: 3 },
  ],
  items: [
    { id: "loneliness-1", text: "How often do you feel that you lack companionship?" },
    { id: "loneliness-2", text: "How often do you feel left out?" },
    { id: "loneliness-3", text: "How often do you feel isolated from others?" },
  ],
  scoring: { kind: "sum" },
  // Hughes et al. (2004) publish the 3–9 score, not clinical bands. Higher means lonelier; no cut-offs are claimed.
  bands: [],
  source: "Hughes, Waite, Hawkley & Cacioppo (2004), Res Aging 26(6):655–672.",
  licence: "Published in an open author manuscript (PMC2394670); no separate licence is stated.",
  scienceUrl: "https://pubmed.ncbi.nlm.nih.gov/18504506/",
};
