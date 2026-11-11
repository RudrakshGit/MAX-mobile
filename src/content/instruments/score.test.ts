import { test } from "node:test";
import assert from "node:assert/strict";
import { score } from "./score.ts";
import { phq9 } from "./phq9.ts";
import { gad7 } from "./gad7.ts";
import { cbi } from "./cbi.ts";
import { who5 } from "./who5.ts";
import { loneliness3 } from "./loneliness3.ts";
import { asrs6 } from "./asrs6.ts";
import { aq10 } from "./aq10.ts";
import { bas2 } from "./bas2.ts";
import { sci } from "./sci.ts";
import { pswq } from "./pswq.ts";
import { rses } from "./rses.ts";
import { brs } from "./brs.ts";
import { saps } from "./saps.ts";
import { miniIpip } from "./miniIpip.ts";
import { onetMiniIp } from "./onetMiniIp.ts";
import { tech } from "./tech.ts";

test("score: incomplete on any null or missing answer", () => {
  const inc1 = score(phq9, [0, 0, 0, null, 0, 0, 0, 0, 0]);
  assert.equal(inc1.incomplete, true);
  assert.equal(inc1.band, undefined);

  const inc2 = score(gad7, [1, 1]); // too few answers
  assert.equal(inc2.incomplete, true);
});

test("PHQ-9: scoring sum and crisis flag", () => {
  const v1 = score(phq9, [0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(v1.score, 0);
  assert.equal(v1.band, "Minimal");
  assert.equal(v1.flag, false);

  const v2 = score(phq9, [2, 2, 2, 2, 2, 2, 2, 2, 2]);
  assert.equal(v2.score, 18);
  assert.equal(v2.band, "Moderately severe");
  assert.equal(v2.flag, true); // item 9 is index 8 > 0
});

test("GAD-7: scoring sum and cutoffs", () => {
  const v1 = score(gad7, [0, 0, 0, 0, 0, 0, 0]);
  assert.equal(v1.score, 0);
  assert.equal(v1.band, "Minimal");

  const v2 = score(gad7, [3, 3, 3, 3, 3, 3, 3]);
  assert.equal(v2.score, 21);
  assert.equal(v2.band, "Severe");
});

test("CBI: personal and study burnout subscales with reverse item", () => {
  // All 0: item 13 reverse gives 100, study avg is 100/7 = 14.3
  const v1 = score(cbi, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(v1.parts?.personal, 0);
  assert.equal(v1.parts?.study, 14.3);
  assert.equal(v1.band, undefined); // CBI: no published cut-offs

  // All 100: item 13 reverse gives 0, personal avg is 100, study avg is 600/7 = 85.7
  const v2 = score(cbi, [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]);
  assert.equal(v2.parts?.personal, 100);
  assert.equal(v2.parts?.study, 85.7);
  assert.equal(v2.score, 100); // max of personal and study
  assert.equal(v2.band, undefined);
});

test("WHO-5: raw sum multiplied by 4 transform", () => {
  const v1 = score(who5, [5, 5, 5, 5, 5]);
  assert.equal(v1.score, 100);
  assert.equal(v1.band, "Above the low well-being cut-off");

  const v2 = score(who5, [1, 1, 1, 1, 1]);
  assert.equal(v2.score, 20);
  assert.equal(v2.band, "Low well-being");
});

test("Loneliness-3: 3–9 sum", () => {
  const v1 = score(loneliness3, [1, 1, 1]);
  assert.equal(v1.score, 3);
  assert.equal(v1.band, undefined); // no published bands: raw 3–9 score only

  const v2 = score(loneliness3, [3, 3, 3]);
  assert.equal(v2.score, 9);
  assert.equal(v2.band, undefined);
});

test("ASRS-6: threshold-count scoring", () => {
  const v1 = score(asrs6, [0, 0, 0, 0, 0, 0]);
  assert.equal(v1.score, 0);
  assert.equal(v1.band, "Below the screening threshold");

  // Items 0-2 >= 2 are positive (2), items 3-5 >= 3 are positive (3) -> all 6 positive
  const v2 = score(asrs6, [2, 2, 2, 3, 3, 3]);
  assert.equal(v2.score, 6);
  assert.equal(v2.band, "May be consistent with adult ADHD");
});

test("AQ-10: threshold-count scoring", () => {
  // All 3 (Definitely disagree): items 1, 7, 8, 10 give 0; items 2, 3, 4, 5, 6, 9 give 1 -> count 6
  const v1 = score(aq10, [3, 3, 3, 3, 3, 3, 3, 3, 3, 3]);
  assert.equal(v1.score, 6);
  assert.equal(v1.band, "Referral threshold met");

  // All 0 (Definitely agree): items 1, 7, 8, 10 give 1; others give 0 -> count 4
  const v2 = score(aq10, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(v2.score, 4);
  assert.equal(v2.band, "Below threshold");
});

test("BAS-2: mean score", () => {
  const v1 = score(bas2, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  assert.equal(v1.score, 1);
  assert.equal(v1.band, undefined); // no published bands: mean only

  const v2 = score(bas2, [5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
  assert.equal(v2.score, 5);
  assert.equal(v2.band, undefined);
});

test("SCI: sleep score sum and insomnia cutoff", () => {
  const v1 = score(sci, [0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(v1.score, 0);
  assert.equal(v1.band, "Probable insomnia range");

  const v2 = score(sci, [4, 4, 4, 4, 4, 4, 4, 4]);
  assert.equal(v2.score, 32);
  assert.equal(v2.band, "Above the insomnia range");
});

test("PSWQ: worry sum with 5 reverse items", () => {
  // All 1s: 11 direct items = 11, 5 reverse items (1->5) = 25 -> total 36
  const v1 = score(pswq, Array(16).fill(1));
  assert.equal(v1.score, 36);
  assert.equal(v1.band, undefined); // PSWQ: Meyer 1990 gives no cut-offs

  // All 5s: 11 direct items = 55, 5 reverse items (5->1) = 5 -> total 60
  const v2 = score(pswq, Array(16).fill(5));
  assert.equal(v2.score, 60);
  assert.equal(v2.band, undefined);
});

test("RSES: self-esteem sum with 5 reverse items", () => {
  // Items 3, 5, 8, 9, 10 reversed (0-indexed: 2, 4, 7, 8, 9)
  // Positive direct 3s, negative 0s (which reverse to 3): all effective 3s -> 30
  const allMax = [3, 3, 0, 3, 0, 3, 3, 0, 0, 0];
  const v1 = score(rses, allMax);
  assert.equal(v1.score, 30);
  assert.equal(v1.band, undefined); // RSES: "no discrete cut-off points" (UMD)

  // Positive direct 0s, negative 3s (which reverse to 0): all effective 0s -> 0
  const allMin = [0, 0, 3, 0, 3, 0, 0, 3, 3, 3];
  const v2 = score(rses, allMin);
  assert.equal(v2.score, 0);
  assert.equal(v2.band, undefined);
});

test("BRS: resilience mean with 3 reverse items", () => {
  // All 3s: 3 stays 3 on reverse -> avg 3.0
  const v1 = score(brs, [3, 3, 3, 3, 3, 3]);
  assert.equal(v1.score, 3);
  assert.equal(v1.band, "Normal resilience");

  // Direct 5s, reverse items 1s (which reverse to 5) -> all effective 5s -> avg 5.0
  const v2 = score(brs, [5, 1, 5, 1, 5, 1]);
  assert.equal(v2.score, 5);
  assert.equal(v2.band, "High resilience");
});

test("SAPS: standards and discrepancy subscale sums", () => {
  const v1 = score(saps, [1, 1, 1, 1, 1, 1, 1, 1]);
  assert.equal(v1.parts?.standards, 4);
  assert.equal(v1.parts?.discrepancy, 4);

  const v2 = score(saps, [7, 7, 7, 7, 7, 7, 7, 7]);
  assert.equal(v2.parts?.standards, 28);
  assert.equal(v2.parts?.discrepancy, 28);
});

test("Mini-IPIP: Big Five factor subscales", () => {
  const v1 = score(miniIpip, Array(20).fill(3));
  assert.equal(v1.parts?.extraversion, 3);
  assert.equal(v1.parts?.agreeableness, 3);
  assert.equal(v1.parts?.conscientiousness, 3);
  assert.equal(v1.parts?.neuroticism, 3);
  assert.equal(v1.parts?.openness, 3);
});

test("O*NET Mini-IP: 30 official items, 5 per RIASEC theme, top themes by sum", () => {
  assert.equal(onetMiniIp.items.length, 30);
  const counts: Record<string, number> = {};
  onetMiniIp.items.forEach((it) => (counts[it.subscale!] = (counts[it.subscale!] ?? 0) + 1));
  assert.deepEqual(Object.values(counts), [5, 5, 5, 5, 5, 5]);
  // official numbering cycles R, I, A, S, E, C
  assert.deepEqual(onetMiniIp.items.slice(0, 6).map((i) => i.subscale), ["realistic", "investigative", "artistic", "social", "enterprising", "conventional"]);
  assert.equal(onetMiniIp.items[0].text, "Build kitchen cabinets");
  assert.equal(onetMiniIp.items[29].text, "Stamp, sort, and distribute mail for an organization");

  const answers = onetMiniIp.items.map((it) =>
    it.subscale === "realistic" ? 4 : it.subscale === "artistic" ? 3 : it.subscale === "social" ? 2 : 0,
  );
  const res = score(onetMiniIp, answers);
  assert.deepEqual(res.top, ["realistic", "artistic", "social"]);
});

test("Tech-stress: digital balance subscale sums and bands", () => {
  const v1 = score(tech, Array(8).fill(1));
  assert.equal(v1.score, 8);
  assert.equal(v1.band, "Low");

  const v2 = score(tech, Array(8).fill(5));
  assert.equal(v2.score, 40);
  assert.equal(v2.band, "High");
});

test("PHQ-9: item 9 flag survives skipped questions (audit F12)", () => {
  const skipped = score(phq9, [null, 0, 0, 0, 0, 0, 0, 0, 3]);
  assert.equal(skipped.incomplete, true);
  assert.equal(skipped.flag, true);
  assert.equal(score(phq9, [null, 0, 0, 0, 0, 0, 0, 0, 0]).flag, false);
  // item 9 itself skipped: no flag can be inferred
  assert.equal(score(phq9, [3, 3, 3, 3, 3, 3, 3, 3, null]).flag, false);
  // short answer list still reports the flag for the answered crisis item
  assert.equal(score(phq9, [0, 0, 0, 0, 0, 0, 0, 0, 1]).flag, true);
});

test("SCI: official cut-off is 16 or below (Espie 2014)", () => {
  assert.equal(score(sci, [2, 2, 2, 2, 2, 2, 2, 2]).score, 16);
  assert.equal(score(sci, [2, 2, 2, 2, 2, 2, 2, 2]).band, "Probable insomnia range");
  assert.equal(score(sci, [3, 2, 2, 2, 2, 2, 2, 2]).band, "Above the insomnia range");
});

test("SAPS: official item order, standards 1,3,5,7 and discrepancy 2,4,6,8", () => {
  assert.equal(saps.items.length, 8);
  saps.items.forEach((it, i) => assert.equal(it.subscale, i % 2 === 0 ? "standards" : "discrepancy"));
  assert.equal(saps.items[0].text, "I have high expectations for myself.");
  assert.equal(saps.items[7].text, "I am hardly ever satisfied with my performance.");
});

test("ASRS-6: the shaded answers shown on screen are exactly the ones the scoring counts", () => {
  const positive = (asrs6.scoring as { positive: (i: number, v: number) => boolean }).positive;
  asrs6.items.forEach((item, i) => {
    const counted = asrs6.options.filter((o) => positive(i, o.value)).map((o) => o.value);
    assert.deepEqual(item.shade, counted, item.id);
  });
});

test("wording pinned to the official forms (checked 27 Oct 2026)", () => {
  assert.equal(phq9.items[8].text, "Thoughts that you would be better off dead or of hurting yourself in some way");
  assert.match(phq9.intro, /bothered by any of the following problems\?$/);
  assert.equal(gad7.items[0].text, "Feeling nervous, anxious or on edge");
  assert.equal(rses.items[0].text, "I feel that I'm a person of worth, at least on an equal plane with others.");
  assert.equal(pswq.items[11].text, "I have been a worrier all my life.");
  assert.match(aq10.items[7].text, /types of plant etc\)$/);
});
