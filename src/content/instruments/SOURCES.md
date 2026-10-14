# Instrument Sources and Verification Log

This document records the exact sources, licences, checking dates, and verification details for all psychological self-assessment instruments in MAX.

Context: Free, non-commercial, no-ads academic mobile app for college students.

## Verification status (updated 14 October 2026)

The first version of this file claimed every instrument was verified by the project team. It was not: the first implementation was written from memory. After an audit the following were rewritten from the primary documents and have unit tests that pin the official wording:

| Instrument | Checked against | State |
|---|---|---|
| SCI | Espie et al. 2014, BMJ Open, Appendix (all 8 items, answer options, 0–32 scoring, cut-off ≤ 16) | verified |
| SAPS | Rice, Richardson & Tueller 2014, Table 1 (8 items, standards 1,3,5,7 / discrepancy 2,4,6,8) | verified |
| O*NET Mini-IP | O*NET Mini-IP Development Report, Appendix A (30 items, 0–4 scale) | verified |
| WHO-5 | WHO wording and 6 options; only published cut-off (≤ 50) is used | verified, bands trimmed |
| BAS-2 | items 8 and 10 corrected to published wording; no cut-offs claimed | to re-check against the Handbook PDF |
| PHQ-9, GAD-7, ASRS-6, AQ-10, RSES, PSWQ, BRS, Mini-IPIP, CBI, Loneliness-3 | wording matches the widely published versions | **not yet compared line by line with the primary PDF; the project guide or a psychology faculty member should sign off before release** |
| Tech-stress | MAX's own wording, not a validated scale (labelled as such) | by design |

Bands that no publication defines (WHO-5 "moderate/high", Loneliness-3 bands, BAS-2 bands, SCI 17–24/25–32, CBI "severe ≥ 90") were removed; those instruments now show the raw score or only the published cut-off.

---

## 1. PHQ-9 (Patient Health Questionnaire-9)
- **Construct:** Depressive symptom severity screening
- **Primary Citation:** Kroenke, K., Spitzer, R. L., & Williams, J. B. (2001). The PHQ-9: validity of a brief depression severity measure. *Journal of General Internal Medicine*, 16(9), 606–613. [DOI: 10.1046/j.1525-1497.2001.016009606.x](https://pubmed.ncbi.nlm.nih.gov/11556941/)
- **Licence:** Public domain. Pfizer holds no copyright restrictions on clinical/educational use.
- **Verification:** Item 9 nonzero response acts as an unconditional safety flag that opens crisis helplines (Tele-MANAS 14416) before scoring results.

## 2. GAD-7 (Generalised Anxiety Disorder-7)
- **Construct:** General anxiety symptom severity
- **Primary Citation:** Spitzer, R. L., Kroenke, K., Williams, J. B., & Löwe, B. (2006). A brief measure for assessing generalized anxiety disorder: the GAD-7. *Archives of Internal Medicine*, 166(10), 1092–1097. [DOI: 10.1001/archinte.166.10.1092](https://pubmed.ncbi.nlm.nih.gov/16717171/)
- **Licence:** Public domain / Pfizer open access.
- **Verification:** 7 items scored 0–3, sum 0–21. Published cutoffs at 5, 10, 15.

## 3. CBI (Copenhagen Burnout Inventory)
- **Construct:** Personal and student/work burnout
- **Primary Citation:** Kristensen, T. S., Borritz, M., Villadsen, E., & Christensen, K. B. (2005). The Copenhagen Burnout Inventory: A new tool for the assessment of burnout. *Work & Stress*, 19(3), 192–207. [DOI: 10.1080/02678370500297720](https://pubmed.ncbi.nlm.nih.gov/19223398/)
- **Licence:** Free for academic and research use without permission.
- **Verification:** 6 personal items and 7 study items on 0–100 scale. Item 13 reverse-keyed.

## 4. WHO-5 Well-Being Index
- **Construct:** Positive psychological well-being
- **Primary Citation:** World Health Organization (1998). Use of well-being measures in primary health care—the DepCare project. Psychiatric Research Unit, Mental Health Centre North Zealand. [WHO Publication](https://www.psykiatri-regionh.dk/who-5/who-5-questionnaires/Pages/default.aspx)
- **Licence:** Creative Commons Attribution-NonCommercial-ShareAlike 3.0 IGO (CC BY-NC-SA 3.0 IGO).
- **Verification:** 5 items scored 0–5; raw sum multiplied by 4 gives standard 0–100 index. ≤50 indicates reduced well-being.

## 5. Three-Item Loneliness Scale (TILS / UCLA-3)
- **Construct:** Subjective social isolation and loneliness
- **Primary Citation:** Hughes, M. E., Waite, L. J., Hawkley, L. C., & Cacioppo, J. T. (2004). A Short Scale for Measuring Loneliness in Large Surveys: Results From Two Population-Based Studies. *Research on Aging*, 26(6), 655–672. [DOI: 10.1177/0164027504268574](https://pubmed.ncbi.nlm.nih.gov/18504506/)
- **Licence:** UCLA Loneliness Studies grants free use for non-profit research and education without prior permission.
- **Verification:** 3 items scored 1–3, sum 3–9. Higher means lonelier. No published bands; the app shows the raw score only.

## 6. ASRS v1.1 6-Question Screener (Adult ADHD)
- **Construct:** Adult Attention-Deficit/Hyperactivity Disorder screening
- **Primary Citation:** Kessler, R. C., et al. (2005). The World Health Organization Adult ADHD Self-Report Scale (ASRS): a short screening scale for use in the general population. *Psychological Medicine*, 35(2), 245–256. [DOI: 10.1017/S0033291704002892](https://pubmed.ncbi.nlm.nih.gov/15841682/)
- **Licence:** NYU Technology Opportunities & Ventures (TOV) open licence: freely available for clinical and non-clinical use with attribution ("© New York University and President and Fellows of Harvard College"); no modifications other than electronic presentation.
- **Verification:** Threshold-count scoring: Items 1–3 positive if ≥ 2; Items 4–6 positive if ≥ 3. Cutoff ≥ 4 positive items indicates symptoms consistent with adult ADHD. Framed as a screener, not a diagnosis.

## 7. AQ-10 Adult (Autism Spectrum Quotient)
- **Construct:** Autistic traits screening in adults
- **Primary Citation:** Allison, C., Auyeung, B., & Baron-Cohen, S. (2012). Toward brief “red flags” for autism spectrum conditions: The short Autism Spectrum Quotient (AQ-10). *Journal of the American Academy of Child & Adolescent Psychiatry*, 51(2), 202–212. [DOI: 10.1016/j.jaac.2011.11.003](https://pubmed.ncbi.nlm.nih.gov/22265366/)
- **Licence:** Autism Research Centre (ARC), University of Cambridge: available free of charge for non-profit research and education; verbatim without modification.
- **Verification:** 10 items; 1 point scored for autistic response (agree for items 1, 7, 8, 10; disagree for 2, 3, 4, 5, 6, 9). Cutoff ≥ 6 recommended by NICE CG142 for comprehensive diagnostic assessment.

## 8. BAS-2 (Body Appreciation Scale-2)
- **Construct:** Positive body appreciation and functionality gratitude
- **Primary Citation:** Tylka, T. L., & Wood-Barcalow, N. L. (2015). The Body Appreciation Scale-2: item refinement and psychometric evaluation. *Body Image*, 12, 53–67. [DOI: 10.1016/j.bodyim.2014.09.006](https://pubmed.ncbi.nlm.nih.gov/25462882/)
- **Licence:** Cambridge *Handbook of Body Image-Related Measures* confirms BAS-2 is free to use in any setting.
- **Verification:** 10 items on 1–5 scale. Mean score 1.0–5.0.

## 9. SCI (Sleep Condition Indicator)
- **Construct:** Sleep quality and insomnia screening
- **Primary Citation:** Espie, C. A., et al. (2014). The Sleep Condition Indicator: a clinical screening tool to evaluate insomnia disorder. *BMJ Open*, 4(3), e004183. [DOI: 10.1136/bmjopen-2013-004183](https://pubmed.ncbi.nlm.nih.gov/24647963/)
- **Licence:** Creative Commons Attribution Non-Commercial 4.0 International (CC BY-NC 4.0, Sleepio Ltd).
- **Verification:** 8 items scored 0–4; total 0–32; higher is better. Published cutoff ≤ 16 indicates probable insomnia.

## 10. PSWQ (Penn State Worry Questionnaire)
- **Construct:** Trait worry and cognitive rumination
- **Primary Citation:** Meyer, T. J., Miller, M. L., Metzger, R. L., & Borkovec, T. D. (1990). Development and validation of the Penn State Worry Questionnaire. *Behaviour Research and Therapy*, 28(6), 487–495. [DOI: 10.1016/0005-7967(90)90135-6](https://pubmed.ncbi.nlm.nih.gov/2076098/)
- **Licence:** Public domain (confirmed by T. D. Borkovec, personal communication cited in CamCOPS documentation).
- **Verification:** 16 items on 1–5 scale. Items 1, 3, 8, 10, 11 reverse-scored. Range 16–80.

## 11. RSES (Rosenberg Self-Esteem Scale)
- **Construct:** Global self-esteem and self-acceptance
- **Primary Citation:** Rosenberg, M. (1965). *Society and the Adolescent Self-Image*. Princeton University Press. [UMD Department of Sociology](https://socy.umd.edu/about-us/using-rosenberg-self-esteem-scale)
- **Licence:** Public domain per University of Maryland Department of Sociology; free to use without permission.
- **Verification:** 10 items on 0–3 scale. Items 3, 5, 8, 9, 10 reverse-scored. Total 0–30.

## 12. BRS (Brief Resilience Scale)
- **Construct:** Ability to bounce back and recover from stress
- **Primary Citation:** Smith, B. W., et al. (2008). The brief resilience scale: assessing the ability to bounce back. *International Journal of Behavioral Medicine*, 15(3), 194–200. [DOI: 10.1080/10705500802222972](https://pubmed.ncbi.nlm.nih.gov/18696313/)
- **Licence:** Salford PsyTech and EdInstruments list as unrestricted / open access.
- **Verification:** 6 items on 1–5 scale. Items 2, 4, 6 reverse-scored. Mean score 1.0–5.0. Cutoffs at 1.00–2.99 (low), 3.00–4.30 (normal), 4.31–5.00 (high).

## 13. SAPS (Short Almost Perfect Scale)
- **Construct:** Adaptive and maladaptive perfectionism
- **Primary Citation:** Rice, K. G., Richardson, C. M., & Tueller, S. (2014). The short almost perfect scale. *Journal of Personality Assessment*, 96(3), 368–379. [DOI: 10.1080/00223891.2013.838172](https://pubmed.ncbi.nlm.nih.gov/24168058/)
- **Licence:** Georgia State University Rice Lab: "There is no permission needed to use or translate the scale, as it is a subset of the APS-R."
- **Verification:** 8 items on 1–7 scale. Standards subscale (items 1, 3, 5, 7) and Discrepancy subscale (items 2, 4, 6, 8). Reports separate sums (4–28 each) without clinical diagnostic cutoffs.

## 14. Mini-IPIP Big Five Personality
- **Construct:** Five-Factor Model of Personality (Extraversion, Agreeableness, Conscientiousness, Neuroticism, Intellect/Openness)
- **Primary Citation:** Donnellan, M. B., Oswald, F. L., Baird, B. M., & Lucas, R. E. (2006). The Mini-IPIP scales: tiny-yet-effective measures of the Big Five factors of personality. *Psychological Assessment*, 18(2), 192–203. [DOI: 10.1037/1040-3590.18.2.192](https://pubmed.ncbi.nlm.nih.gov/16768595/)
- **Licence:** Public domain (International Personality Item Pool; Lew Goldberg). Free for any purpose, commercial or non-commercial.
- **Verification:** 20 items (4 per trait) on 1–5 scale. Reverse-keyed items handled per IPIP key. Subscale means 1.0–5.0 reported.

## 15. O*NET Mini Interest Profiler (Mini-IP)
- **Construct:** Vocational and career interests across Holland RIASEC codes
- **Primary Citation:** Rounds, J., Su, R., Lewis, P., & Rivkin, D. (2010). O*NET® Interest Profiler Short Form, National Center for O*NET Development. [O*NET IP Documentation](https://www.onetcenter.org/IP.html)
- **Licence:** Creative Commons Attribution 4.0 International (CC BY 4.0).
- **Verification:** 30 items (5 per Holland dimension) on 1–3 scale. Profile scoring returns top 3 themes.

## 16. Tech-Stress Check
- **Construct:** Weekly digital overload, invasion, complexity, and uncertainty
- **Primary Citation:** Tarafdar, M., Tu, Q., Ragu-Nathan, B. S., & Ragu-Nathan, T. S. (2007). The impact of technostress on role stress and productivity. *Journal of Management Information Systems*, 24(1), 301–328.
- **Licence:** MAX academic project original wording (MIT). Explicitly labelled "MAX's own wording, not a validated clinical scale."
- **Verification:** 8 items on 1–5 scale. Sum 8–40 with 4 subscale parts.
