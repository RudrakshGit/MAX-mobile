# M04a — Instrument content and scoring engine (Claude, not Antigravity)

- **Status:** owner asks Claude to run this before M04
- **Owner of the work:** Claude (research + verification). Antigravity must NOT write psychometric items.
- **Read first:** `docs/v2-features.md` §5, `../research/research_notes/Serene features technical implementation/instruments.md`

## Outcome
`src/content/instruments/` holds the 15 instruments with item text copied verbatim from the official source, the response options, reverse-keyed items, subscales, bands and the citation/licence line — plus a tested scoring engine. M04 then only builds UI.

## Why Claude
A small model will "remember" questionnaire items that are slightly wrong. Wrong items invalidate a validated scale. Each file must be checked against its source document.

## Deliverables
| File | Content |
| --- | --- |
| `src/content/instruments/types.ts` | `Instrument`, `Item`, `Option`, `Scoring`, `Band`, `Result` types (below) |
| `src/content/instruments/<id>.ts` × 15 | `phq9, gad7, cbi, miniIpip, onetMiniIp, saps, brs, rses, who5, loneliness3, asrs6, aq10, bas2, sci, pswq` (+ existing `tech`) |
| `src/content/instruments/score.ts` | `score(instrument, answers: (number|null)[]): Result` |
| `src/content/instruments/score.test.ts` | known-vector tests per instrument (from the source papers' examples or hand-computed) |
| `src/content/instruments/index.ts` | `instruments`, `byId`, `categories` |
| `src/content/instruments/SOURCES.md` | per instrument: source URL, date checked, licence text quoted, who verified |

## Types (contract M04 builds on)
```ts
export type Option = { label: string; value: number };
export type Item = { id: string; text: string; options?: Option[]; reverse?: boolean; subscale?: string };
export type Scoring =
  | { kind: "sum" }                                    // PHQ-9, GAD-7, RSES, PSWQ, Loneliness, SCI
  | { kind: "mean"; scaleMin?: number }                // BRS, BAS-2
  | { kind: "subscales"; agg: "sum" | "mean" }          // Mini-IPIP traits, SAPS, CBI
  | { kind: "transform"; multiply: number }             // WHO-5 raw × 4
  | { kind: "threshold-count"; positive: (itemIndex: number, value: number) => boolean; cutoff: number } // ASRS-6, AQ-10
  | { kind: "profile" };                               // O*NET RIASEC top 3
export type Band = { min: number; label: string; note?: string };
export type Instrument = {
  id: string; title: string; short: string;
  category: "personality" | "growth" | "relationships" | "wellness" | "phone";
  minutes: number; intro: string; whatYouGet: [string, string, string];
  options: Option[]; items: Item[]; scoring: Scoring; bands: Band[];
  clinical: boolean;            // true → "screening result, not a diagnosis" + counsellor card
  crisisItem?: number;          // PHQ-9: index 8 → helplines before the result if value > 0
  ageNote?: string;             // e.g. ASRS/AQ-10 "designed for adults"
  source: string; licence: string; scienceUrl: string;
};
export type Result = { score: number; band?: string; parts?: Record<string, number>; top?: string[]; flag?: boolean; incomplete?: boolean };
```
Rules: a `null` answer is never scored as 0 — if any item is unanswered, `incomplete: true` and no band. Bands only where the source publishes cut-offs; otherwise descriptive (`parts` only).

## Done when
- [x] every item string matches its source (SOURCES.md records the check);
- [x] `score.test.ts` passes with at least two vectors per instrument;
- [x] `npm run verify` passes;
- [x] the owner has seen the list.

## Completion report

### Status
Complete. 16 psychometric instruments authored with 100% verified question text, options, subscales, and bands based on peer-reviewed sources. Universal scoring engine implemented and validated against known vectors.

### Implemented Scales (`src/content/instruments/`)
1. **PHQ-9** (`phq9.ts`): Depressive symptom severity screening (Kroenke et al., 2001). 9 items (0–3), sum 0–27. Minimal, Mild, Moderate, Moderately severe, Severe. Item 9 nonzero response flags crisis card.
2. **GAD-7** (`gad7.ts`): Generalized anxiety disorder screening (Spitzer et al., 2006). 7 items (0–3), sum 0–21. Minimal, Mild, Moderate, Severe.
3. **CBI** (`cbi.ts`): Copenhagen Burnout Inventory (Kristensen et al., 2005). 13 items (0–100), Personal (6 items) & Studies (7 items) subscales. Item 13 reversed. Low, Moderate, High, Severe.
4. **WHO-5** (`who5.ts`): Well-Being Index (WHO, 1998). 5 items (0–5), raw sum × 4 gives 0–100 index. Reduced well-being (≤50) vs Good well-being.
5. **Loneliness-3** (`loneliness3.ts`): Three-Item Loneliness Scale / TILS (Hughes et al., 2004). 3 items (1–3), sum 3–9. Connected, Moderate, High loneliness.
6. **ASRS-6** (`asrs6.ts`): Adult ADHD Self-Report Scale v1.1 Screener (Kessler et al., 2005). 6 items. Threshold count (items 1–3 ≥2, 4–6 ≥3). Cutoff ≥4 indicates symptoms consistent with adult ADHD.
7. **AQ-10** (`aq10.ts`): Autism Spectrum Quotient 10-item short form (Allison et al., 2012). 10 items. 1 point for autistic response. Cutoff ≥6 recommends comprehensive assessment.
8. **BAS-2** (`bas2.ts`): Body Appreciation Scale-2 (Tylka & Wood-Barcalow, 2015). 10 items (1–5). Mean score 1.0–5.0.
9. **SCI** (`sci.ts`): Sleep Condition Indicator (Espie et al., 2014). 8 items (0–4), sum 0–32. Cutoff ≤16 indicates probable insomnia.
10. **PSWQ** (`pswq.ts`): Penn State Worry Questionnaire (Meyer et al., 1990). 16 items (1–5). Items 1, 3, 8, 10, 11 reversed. Sum 16–80.
11. **RSES** (`rses.ts`): Rosenberg Self-Esteem Scale (Rosenberg, 1965). 10 items (0–3). Items 3, 5, 8, 9, 10 reversed. Sum 0–30.
12. **BRS** (`brs.ts`): Brief Resilience Scale (Smith et al., 2008). 6 items (1–5). Items 2, 4, 6 reversed. Mean 1.0–5.0. Low, Normal, High resilience.
13. **SAPS** (`saps.ts`): Short Almost Perfect Scale (Rice et al., 2014). 8 items (1–7). Standards (items 1, 3, 5, 7) & Discrepancy (items 2, 4, 6, 8) subscales.
14. **Mini-IPIP** (`miniIpip.ts`): Big Five Personality (Donnellan et al., 2006). 20 items (1–5). Extraversion, Agreeableness, Conscientiousness, Neuroticism, Intellect subscales.
15. **O*NET Mini-IP** (`onetMiniIp.ts`): Interest Profiler Short Form (Rounds et al., 2010). 30 items (1–3). Realistic, Investigative, Artistic, Social, Enterprising, Conventional (RIASEC) top 3 themes.
16. **Tech** (`tech.ts`): Tech-stress check. 8 items (1–5). Overload, Invasion, Complexity, Uncertainty subscales.

### Scoring Engine & Test Vectors
- `src/content/instruments/score.ts`: Supports `sum`, `mean`, `subscales`, `transform`, `threshold-count`, `profile`, reverse scoring, and `incomplete` handling for skipped/unanswered items (`null`).
- `src/content/instruments/score.test.ts`: 15 test suites with >=2 vectors per instrument plus universal incomplete checks. 100% passing.
- `src/content/instruments/SOURCES.md`: Comprehensive references, DOIs, licensing terms, and verification signatures.
