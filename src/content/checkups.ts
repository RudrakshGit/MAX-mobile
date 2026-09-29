// Check-ups report a range, never a diagnosis. PHQ-9, GAD-7 and CBI are public
// domain / free to use. Do not add ISI or PSS-10: they are licensed via Mapi Trust.

type Option = { label: string; score: number };
type Item = { text: string; options?: Option[]; reverse?: boolean; part?: string };
export type Checkup = { id: string; title: string; short: string; intro: string; source: string; options: Option[]; items: Item[]; minutes: number };

const freq4: Option[] = [
  { label: "Not at all", score: 0 },
  { label: "Several days", score: 1 },
  { label: "More than half the days", score: 2 },
  { label: "Nearly every day", score: 3 },
];
const often5: Option[] = [
  { label: "Always", score: 100 },
  { label: "Often", score: 75 },
  { label: "Sometimes", score: 50 },
  { label: "Seldom", score: 25 },
  { label: "Never or almost never", score: 0 },
];
const degree5: Option[] = [
  { label: "To a very high degree", score: 100 },
  { label: "To a high degree", score: 75 },
  { label: "Somewhat", score: 50 },
  { label: "To a low degree", score: 25 },
  { label: "To a very low degree", score: 0 },
];
const agree5: Option[] = [
  { label: "Strongly disagree", score: 1 },
  { label: "Disagree", score: 2 },
  { label: "Neutral", score: 3 },
  { label: "Agree", score: 4 },
  { label: "Strongly agree", score: 5 },
];

export const checkups: Checkup[] = [
  {
    id: "phq9",
    title: "Low mood check (PHQ-9)",
    short: "PHQ-9",
    intro: "Over the last 2 weeks, how often have you been bothered by the following?",
    source: "Kroenke, Spitzer & Williams (2001), J Gen Intern Med 16(9):606–613.",
    options: freq4,
    minutes: 2,
    items: [
      { text: "Little interest or pleasure in doing things" },
      { text: "Feeling down, depressed, or hopeless" },
      { text: "Trouble falling or staying asleep, or sleeping too much" },
      { text: "Feeling tired or having little energy" },
      { text: "Poor appetite or overeating" },
      { text: "Feeling bad about yourself, or that you are a failure or have let yourself or your family down" },
      { text: "Trouble concentrating on things, such as reading or watching something" },
      { text: "Moving or speaking so slowly that other people could have noticed, or being so fidgety or restless that you move around a lot more than usual" },
      { text: "Thoughts that you would be better off dead, or of hurting yourself in some way" },
    ],
  },
  {
    id: "gad7",
    title: "Worry check (GAD-7)",
    short: "GAD-7",
    intro: "Over the last 2 weeks, how often have you been bothered by the following?",
    source: "Spitzer, Kroenke, Williams & Löwe (2006), Arch Intern Med 166(10):1092–1097.",
    options: freq4,
    minutes: 2,
    items: [
      { text: "Feeling nervous, anxious, or on edge" },
      { text: "Not being able to stop or control worrying" },
      { text: "Worrying too much about different things" },
      { text: "Trouble relaxing" },
      { text: "Being so restless that it is hard to sit still" },
      { text: "Becoming easily annoyed or irritable" },
      { text: "Feeling afraid, as if something awful might happen" },
    ],
  },
  {
    id: "cbi",
    title: "Burnout check (CBI)",
    short: "CBI",
    intro: "Personal and study-related burnout. Answer for how things have been lately.",
    source: "Kristensen, Borritz, Villadsen & Christensen (2005), Work & Stress 19(3):192–207. Study items reworded for students by MAX.",
    options: often5,
    minutes: 3,
    items: [
      { part: "personal", text: "How often do you feel tired?" },
      { part: "personal", text: "How often are you physically exhausted?" },
      { part: "personal", text: "How often are you emotionally exhausted?" },
      { part: "personal", text: "How often do you think: “I can't take it anymore”?" },
      { part: "personal", text: "How often do you feel worn out?" },
      { part: "personal", text: "How often do you feel weak and susceptible to illness?" },
      { part: "study", text: "Are your studies emotionally exhausting?", options: degree5 },
      { part: "study", text: "Do you feel burnt out because of your studies?", options: degree5 },
      { part: "study", text: "Do your studies frustrate you?", options: degree5 },
      { part: "study", text: "Do you feel worn out at the end of a day at college?" },
      { part: "study", text: "Are you exhausted in the morning at the thought of another day at college?" },
      { part: "study", text: "Do you feel that every hour of studying is tiring for you?" },
      { part: "study", text: "Do you have enough energy for family and friends in your free time?", reverse: true },
    ],
  },
  {
    id: "tech",
    title: "Weekly tech-stress check",
    short: "Tech-stress",
    intro: "Think about the last 7 days with your phone, laptop and college apps.",
    source: "MAX's own wording, not a validated scale. Built on the technostress dimensions of Tarafdar et al. (2007), J Manag Inf Syst 24(1):301–328.",
    options: agree5,
    minutes: 1,
    items: [
      { part: "overload", text: "My devices push me to do more than I can handle." },
      { part: "overload", text: "Being always reachable makes me feel I have to reply or study faster." },
      { part: "invasion", text: "Notifications and group chats eat into my rest or family time." },
      { part: "invasion", text: "I pick up my phone even after deciding to take a break." },
      { part: "complexity", text: "Keeping up with college portals, apps and tools drains me." },
      { part: "complexity", text: "I feel behind because others seem to handle tech more easily." },
      { part: "uncertainty", text: "Constant changes in apps, platforms or online classes unsettle me." },
      { part: "uncertainty", text: "I worry about missing something important if I go offline." },
    ],
  },
];

export const checkupById = (id: string) => checkups.find((c) => c.id === id);

const band = (x: number, cuts: [number, string][]) => cuts.filter(([min]) => x >= min).at(-1)![1];
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** answers[i] is the chosen option's score for item i. */
export function score(id: string, answers: number[]): { score: number; band: string; detail?: string; flag?: boolean } {
  if (id === "phq9") {
    const s = answers.reduce((a, b) => a + b, 0);
    // Item 9 above zero shows helplines whatever the total says.
    return { score: s, flag: answers[8] > 0, band: band(s, [[0, "Minimal"], [5, "Mild"], [10, "Moderate"], [15, "Moderately severe"], [20, "Severe"]]) };
  }
  if (id === "gad7") {
    const s = answers.reduce((a, b) => a + b, 0);
    return { score: s, band: band(s, [[0, "Minimal"], [5, "Mild"], [10, "Moderate"], [15, "Severe"]]) };
  }
  if (id === "cbi") {
    const c = checkupById("cbi")!;
    const adj = answers.map((a, i) => (c.items[i].reverse ? 100 - a : a));
    const personal = Math.round(mean(adj.filter((_, i) => c.items[i].part === "personal")));
    const study = Math.round(mean(adj.filter((_, i) => c.items[i].part === "study")));
    const s = Math.max(personal, study);
    return { score: s, detail: `Personal ${personal} · Study ${study} (out of 100)`, band: band(s, [[0, "Low"], [50, "Moderate"], [75, "High"], [100, "Severe"]]) };
  }
  // tech: 1–5 agreement mapped to 0–100
  const s = Math.round(((mean(answers) - 1) / 4) * 100);
  return { score: s, band: band(s, [[0, "Low"], [35, "Moderate"], [65, "High"]]) };
}

export const maxScore: Record<string, number> = { phq9: 27, gad7: 21, cbi: 100, tech: 100 };
