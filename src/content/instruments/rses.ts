import type { Instrument } from "./types";

export const rses: Instrument = {
  id: "rses",
  title: "Rosenberg Self-Esteem Scale (RSES)",
  short: "RSES",
  category: "growth",
  minutes: 2,
  clinical: false,
  intro: "Below is a list of statements dealing with your general feelings about yourself.",
  whatYouGet: [
    "Total self-esteem score (0–30)",
    "Reflection on self-worth and self-acceptance",
    "CBT practices for self-compassion and validation",
  ],
  options: [
    { label: "Strongly agree", value: 3 },
    { label: "Agree", value: 2 },
    { label: "Disagree", value: 1 },
    { label: "Strongly disagree", value: 0 },
  ],
  items: [
    { id: "rses-1", text: "I feel that I'm a person of worth, at least on an equal plane with others." },
    { id: "rses-2", text: "I feel that I have a number of good qualities." },
    { id: "rses-3", text: "All in all, I am inclined to feel that I am a failure.", reverse: true },
    { id: "rses-4", text: "I am able to do things as well as most other people." },
    { id: "rses-5", text: "I feel I do not have much to be proud of.", reverse: true },
    { id: "rses-6", text: "I take a positive attitude toward myself." },
    { id: "rses-7", text: "On the whole, I am satisfied with myself." },
    { id: "rses-8", text: "I wish I could have more respect for myself.", reverse: true },
    { id: "rses-9", text: "I certainly feel useless at times.", reverse: true },
    { id: "rses-10", text: "At times I think I am no good at all.", reverse: true },
  ],
  scoring: { kind: "sum" },
  // The scale's owner (UMD sociology FAQ): "There are no discrete cut-off points to delineate high and low self-esteem."
  bands: [],
  source: "Rosenberg (1965), Society and the Adolescent Self-Image. Princeton University Press.",
  licence: "Free to use for research and education per the University of Maryland sociology department page; no formal licence is published.",
  scienceUrl: "https://socy.umd.edu/about-us/using-rosenberg-self-esteem-scale",
};
