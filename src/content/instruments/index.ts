import type { Instrument, InstrumentCategory } from "./types";
import { phq9 } from "./phq9";
import { gad7 } from "./gad7";
import { cbi } from "./cbi";
import { who5 } from "./who5";
import { loneliness3 } from "./loneliness3";
import { asrs6 } from "./asrs6";
import { aq10 } from "./aq10";
import { bas2 } from "./bas2";
import { sci } from "./sci";
import { pswq } from "./pswq";
import { brs } from "./brs";
import { rses } from "./rses";
import { saps } from "./saps";
import { miniIpip } from "./miniIpip";
import { onetMiniIp } from "./onetMiniIp";
import { tech } from "./tech";

export * from "./types";
export * from "./score";

export const instruments: Instrument[] = [
  // Wellness
  phq9,
  gad7,
  cbi,
  who5,
  loneliness3,
  asrs6,
  aq10,
  sci,
  pswq,
  // Growth
  brs,
  rses,
  saps,
  bas2,
  onetMiniIp,
  // Personality
  miniIpip,
  // Phone / Lifestyle
  tech,
];

export const byId: Record<string, Instrument> = Object.fromEntries(
  instruments.map((inst) => [inst.id, inst])
);

export const categories: { id: InstrumentCategory; title: string }[] = [
  { id: "wellness", title: "Mental Wellness" },
  { id: "growth", title: "Personal Growth" },
  { id: "personality", title: "Personality" },
  { id: "phone", title: "Digital Balance" },
];
