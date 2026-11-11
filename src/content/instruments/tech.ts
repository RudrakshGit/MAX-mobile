import type { Instrument } from "./types";

export const tech: Instrument = {
  id: "tech",
  title: "Weekly tech-stress check",
  short: "Tech-stress",
  category: "phone",
  minutes: 1,
  clinical: false,
  ownWording: true,
  intro: "Think about the last 7 days with your phone, laptop and college apps.",
  whatYouGet: [
    "Overall tech-stress score (8–40)",
    "Breakdown across overload, invasion, complexity, and uncertainty",
    "Digital boundary practices and notification resets",
  ],
  options: [
    { label: "Strongly disagree", value: 1 },
    { label: "Disagree", value: 2 },
    { label: "Neutral", value: 3 },
    { label: "Agree", value: 4 },
    { label: "Strongly agree", value: 5 },
  ],
  items: [
    { id: "tech-1", subscale: "overload", text: "My devices push me to do more than I can handle." },
    { id: "tech-2", subscale: "overload", text: "Being always reachable makes me feel I have to reply or study faster." },
    { id: "tech-3", subscale: "invasion", text: "Notifications and group chats eat into my rest or family time." },
    { id: "tech-4", subscale: "invasion", text: "I pick up my phone even after deciding to take a break." },
    { id: "tech-5", subscale: "complexity", text: "Keeping up with college portals, apps and tools drains me." },
    { id: "tech-6", subscale: "complexity", text: "I feel behind because others seem to handle tech more easily." },
    { id: "tech-7", subscale: "uncertainty", text: "Constant changes in apps, platforms or online classes unsettle me." },
    { id: "tech-8", subscale: "uncertainty", text: "I worry about missing something important if I go offline." },
  ],
  scoring: { kind: "subscales", agg: "sum" },
  bands: [
    { min: 8, label: "Low", note: "Low digital friction and tech-stress." },
    { min: 18, label: "Moderate", note: "Moderate tech-stress; watch out for screen fatigue." },
    { min: 28, label: "High", note: "High tech-stress; try digital detox or phone boundaries." },
  ],
  source: "MAX's own wording, not a validated scale. Built on the technostress dimensions of Tarafdar et al. (2007), J Manag Inf Syst 24(1):301–328.",
  licence: "Open academic project use.",
  scienceUrl: "https://www.tandfonline.com/doi/abs/10.2753/MIS0742-1222240109",
};
