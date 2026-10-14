export type Option = { label: string; value: number };

export type Item = {
  id: string;
  text: string;
  options?: Option[];
  reverse?: boolean;
  subscale?: string;
};

export type Scoring =
  | { kind: "sum" }                                    // PHQ-9, GAD-7, RSES, PSWQ, Loneliness, SCI
  | { kind: "mean"; scaleMin?: number }                // BRS, BAS-2
  | { kind: "subscales"; agg: "sum" | "mean" }          // Mini-IPIP traits, SAPS, CBI
  | { kind: "transform"; multiply: number }             // WHO-5 raw × 4
  | { kind: "threshold-count"; positive: (itemIndex: number, value: number) => boolean; cutoff: number } // ASRS-6, AQ-10
  | { kind: "profile" };                               // O*NET RIASEC top 3

export type Band = { min: number; label: string; note?: string };

export type InstrumentCategory =
  | "personality"
  | "growth"
  | "relationships"
  | "wellness"
  | "phone";

export type Instrument = {
  id: string;
  title: string;
  short: string;
  category: InstrumentCategory;
  minutes: number;
  intro: string;
  whatYouGet: [string, string, string];
  options: Option[];
  items: Item[];
  scoring: Scoring;
  bands: Band[];
  clinical: boolean;            // true → "screening result, not a diagnosis" + counsellor card
  crisisItem?: number;          // PHQ-9: index 8 → helplines before the result if value > 0
  ageNote?: string;             // e.g. ASRS/AQ-10 "designed for adults"
  source: string;
  licence: string;
  scienceUrl: string;
};

export type Result = {
  score: number;
  band?: string;
  parts?: Record<string, number>;
  top?: string[];
  flag?: boolean;
  incomplete?: boolean;
};
