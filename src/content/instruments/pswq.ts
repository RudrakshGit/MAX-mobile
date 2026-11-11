import type { Instrument } from "./types";

export const pswq: Instrument = {
  id: "pswq",
  title: "Penn State Worry Questionnaire (PSWQ)",
  short: "PSWQ",
  category: "wellness",
  minutes: 3,
  clinical: false,
  intro: "Rate each statement from 1 (not at all typical of me) to 5 (very typical of me).",
  whatYouGet: [
    "Overall worry score (16–80)",
    "Severity band from low to severe worry",
    "Cognitive tools for worry loops and spiral-breaking",
  ],
  options: [
    // Meyer et al. (1990) name only the two ends of the 1–5 scale.
    { label: "1 · Not at all typical of me", value: 1 },
    { label: "2", value: 2 },
    { label: "3", value: 3 },
    { label: "4", value: 4 },
    { label: "5 · Very typical of me", value: 5 },
  ],
  items: [
    { id: "pswq-1", text: "If I do not have enough time to do everything, I do not worry about it.", reverse: true },
    { id: "pswq-2", text: "My worries overwhelm me." },
    { id: "pswq-3", text: "I do not tend to worry about things.", reverse: true },
    { id: "pswq-4", text: "Many situations make me worry." },
    { id: "pswq-5", text: "I know I should not worry about things, but I just cannot help it." },
    { id: "pswq-6", text: "When I am under pressure I worry a lot." },
    { id: "pswq-7", text: "I am always worrying about something." },
    { id: "pswq-8", text: "I find it easy to dismiss worrisome thoughts.", reverse: true },
    { id: "pswq-9", text: "As soon as I finish one task, I start to worry about everything else I have to do." },
    { id: "pswq-10", text: "I never worry about anything.", reverse: true },
    { id: "pswq-11", text: "When there is nothing more I can do about a concern, I do not worry about it any more.", reverse: true },
    { id: "pswq-12", text: "I have been a worrier all my life." },
    { id: "pswq-13", text: "I notice that I have been worrying about things." },
    { id: "pswq-14", text: "Once I start worrying, I cannot stop." },
    { id: "pswq-15", text: "I worry all the time." },
    { id: "pswq-16", text: "I worry about projects until they are all done." },
  ],
  scoring: { kind: "sum" },
  // Meyer et al. (1990) give no cut-offs, only group means (all students 48.8, SD 13.8). No bands are claimed.
  bands: [],
  source: "Meyer, Miller, Metzger & Borkovec (1990), Behav Res Ther 28(6):487–495.",
  licence: "Reported as public domain (Borkovec, personal communication cited by CamCOPS); © 1990 Pergamon Press on the original paper.",
  scienceUrl: "https://pubmed.ncbi.nlm.nih.gov/2076098/",
};
