import type { Instrument } from "./types";

export const gad7: Instrument = {
  id: "gad7",
  title: "Worry check (GAD-7)",
  short: "GAD-7",
  category: "wellness",
  minutes: 2,
  clinical: true,
  intro: "Over the last 2 weeks, how often have you been bothered by the following problems?",
  whatYouGet: [
    "A screening range for generalized anxiety",
    "Reflection on recent tension and worry",
    "Next steps and campus support resources",
  ],
  options: [
    { label: "Not at all", value: 0 },
    { label: "Several days", value: 1 },
    { label: "More than half the days", value: 2 },
    { label: "Nearly every day", value: 3 },
  ],
  items: [
    { id: "gad7-1", text: "Feeling nervous, anxious or on edge" },
    { id: "gad7-2", text: "Not being able to stop or control worrying" },
    { id: "gad7-3", text: "Worrying too much about different things" },
    { id: "gad7-4", text: "Trouble relaxing" },
    { id: "gad7-5", text: "Being so restless that it is hard to sit still" },
    { id: "gad7-6", text: "Becoming easily annoyed or irritable" },
    { id: "gad7-7", text: "Feeling afraid as if something awful might happen" },
  ],
  scoring: { kind: "sum" },
  bands: [
    { min: 0, label: "Minimal", note: "Minimal anxiety symptoms." },
    { min: 5, label: "Mild", note: "Mild anxiety symptoms." },
    { min: 10, label: "Moderate", note: "Moderate anxiety; discussing with a counsellor may help." },
    { min: 15, label: "Severe", note: "Severe anxiety symptoms; consultation recommended." },
  ],
  source: "Spitzer, Kroenke, Williams & Löwe (2006), Arch Intern Med 166(10):1092–1097.",
  licence: "Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues, with an educational grant from Pfizer Inc. No permission required to reproduce, translate, display or distribute.",
  scienceUrl: "https://pubmed.ncbi.nlm.nih.gov/16717171/",
};
