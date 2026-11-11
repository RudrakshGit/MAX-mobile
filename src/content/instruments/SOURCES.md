# Instrument Sources and Verification Log

This document records the exact sources, licences, checking dates, and verification details for all psychological self-assessment instruments in MAX.

Context: Free, non-commercial, no-ads academic mobile app for college students.

## Verification status (updated 27 October 2026)

The first version of this file claimed every instrument was verified by the project team. It was not: the first implementation was written from memory. Since then each instrument has been compared with the owner's own form or the original paper, and unit tests in `score.test.ts` pin the official wording and scoring.

| Instrument | Checked against | State |
|---|---|---|
| SCI | Espie et al. 2014, BMJ Open, Appendix (8 items, options, 0–32, cut-off ≤ 16) | verified |
| SAPS | Rice, Richardson & Tueller 2014, Table 1 | verified |
| O*NET Mini-IP | O*NET Mini-IP Development Report, Appendix A (30 items, 0–4) | verified |
| PHQ-9, GAD-7 | Pfizer forms and instruction manual on phqscreeners.com | verified; punctuation and intro fixed; licence text is Pfizer's own wording |
| ASRS v1.1 screener | Harvard NCS 6-question form, asrs.php terms and the 28 Feb 2024 scoring update | verified; printed 0–6 rule kept; the two levels of shading are shown on screen as the terms require; result text is the form's own |
| AQ-10 adult | ARC Cambridge AQ10.pdf and Allison et al. 2012 | verified; item 8 "etc" restored; copyright line added |
| RSES | UMD sociology scale and FAQ | verified; item 1 "I'm" restored; bands removed (owner: "no discrete cut-off points") |
| PSWQ | Meyer et al. 1990, Table 1 | verified; item 12 restored; only the scale ends are labelled; bands removed (no cut-offs in the paper) |
| WHO-5 | WHO 2024 publication WHO/UCN/MSD/MHE/2024.1 | verified; WHO's instruction text and "below 50" wording; citation updated |
| Three-Item Loneliness | Hughes et al. 2004 (PMC2394670), Table 1 | verified; intro follows the paper's lead-in |
| Mini-IPIP | IPIP scoring key and permission page | verified (IPIP: public domain; no cut-offs) |
| CBI | NFA Denmark official English CBI | personal items verified; study items are MAX's adaptation of the work scale (no clean English student version exists; Campos et al. 2013 is Portuguese); bands removed (none in the official scoring) |
| BRS | secondary only (PsyToolkit) | items and cut-offs match the secondary source; primary (Smith 2008/2013) not read — needs a human check |
| BAS-2 | secondary only (EMERGE, UCSD) | items match the secondary source; primary (Tylka & Wood-Barcalow 2015) not read — needs a human check |
| Tech-stress | MAX's own wording, not a validated scale (labelled as such) | by design |

Bands that no publication defines were removed (WHO-5 "moderate/high", Loneliness-3, BAS-2, SCI 17–24/25–32, CBI, RSES, PSWQ); those instruments show the raw score or only the published cut-off.

---

## 1. PHQ-9 (Patient Health Questionnaire-9)
- **Construct:** Depressive symptom severity screening
- **Primary Citation:** Kroenke, K., Spitzer, R. L., & Williams, J. B. (2001). The PHQ-9: validity of a brief depression severity measure. *Journal of General Internal Medicine*, 16(9), 606–613. [DOI: 10.1046/j.1525-1497.2001.016009606.x](https://pubmed.ncbi.nlm.nih.gov/11556941/)
- **Licence:** Pfizer forms: "No permission required to reproduce, translate, display or distribute." (not described as public domain).
- **Verification:** Item 9 nonzero response acts as an unconditional safety flag that opens crisis helplines (Tele-MANAS 14416) before scoring results.

## 2. GAD-7 (Generalised Anxiety Disorder-7)
- **Construct:** General anxiety symptom severity
- **Primary Citation:** Spitzer, R. L., Kroenke, K., Williams, J. B., & Löwe, B. (2006). A brief measure for assessing generalized anxiety disorder: the GAD-7. *Archives of Internal Medicine*, 166(10), 1092–1097. [DOI: 10.1001/archinte.166.10.1092](https://pubmed.ncbi.nlm.nih.gov/16717171/)
- **Licence:** Pfizer forms: "No permission required to reproduce, translate, display or distribute." (not described as public domain).
- **Verification:** 7 items scored 0–3, sum 0–21. Manual cut-points 5, 10, 15 (10+ recommended for further evaluation).

## 3. CBI (Copenhagen Burnout Inventory)
- **Construct:** Personal and student/work burnout
- **Primary Citation:** Kristensen, T. S., Borritz, M., Villadsen, E., & Christensen, K. B. (2005). The Copenhagen Burnout Inventory: A new tool for the assessment of burnout. *Work & Stress*, 19(3), 192–207. [DOI: 10.1080/02678370500297720](https://pubmed.ncbi.nlm.nih.gov/19223398/)
- **Licence:** Official English text published by NFA Denmark; authors state it may be adapted.
- **Verification:** 6 personal items (official) and 7 study items (MAX adaptation of the work scale), 0–100, mean per scale, item 13 reverse-keyed. No cut-offs in the official scoring.

## 4. WHO-5 Well-Being Index
- **Construct:** Positive psychological well-being
- **Primary Citation:** World Health Organization (1998). Use of well-being measures in primary health care—the DepCare project. Psychiatric Research Unit, Mental Health Centre North Zealand. [WHO Publication](https://www.psykiatri-regionh.dk/who-5/who-5-questionnaires/Pages/default.aspx)
- **Licence:** Creative Commons Attribution-NonCommercial-ShareAlike 3.0 IGO (CC BY-NC-SA 3.0 IGO).
- **Verification:** 5 items scored 0–5; raw sum multiplied by 4 gives the 0–100 percentage. WHO 2024: a percentage below 50 (raw below 13) has been suggested as a cut-off for poor well-being.

## 5. Three-Item Loneliness Scale (TILS / UCLA-3)
- **Construct:** Subjective social isolation and loneliness
- **Primary Citation:** Hughes, M. E., Waite, L. J., Hawkley, L. C., & Cacioppo, J. T. (2004). A Short Scale for Measuring Loneliness in Large Surveys: Results From Two Population-Based Studies. *Research on Aging*, 26(6), 655–672. [DOI: 10.1177/0164027504268574](https://pubmed.ncbi.nlm.nih.gov/18504506/)
- **Licence:** Not stated in the paper (open author manuscript PMC2394670).
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
- **Licence:** Reported as public domain via CamCOPS (secondary; Borkovec personal communication). Original paper © 1990 Pergamon Press.
- **Verification:** 16 items on 1–5 scale (only ends labelled). Items 1, 3, 8, 10, 11 reverse-scored. Range 16–80. No cut-offs in the paper; group mean 48.8 (SD 13.8).

## 11. RSES (Rosenberg Self-Esteem Scale)
- **Construct:** Global self-esteem and self-acceptance
- **Primary Citation:** Rosenberg, M. (1965). *Society and the Adolescent Self-Image*. Princeton University Press. [UMD Department of Sociology](https://socy.umd.edu/about-us/using-rosenberg-self-esteem-scale)
- **Licence:** No formal licence published by UMD; the department page describes use for research and education.
- **Verification:** 10 items on 0–3 scale. Items 3, 5, 8, 9, 10 reverse-scored. Total 0–30. UMD FAQ: no discrete cut-off points.

## 12. BRS (Brief Resilience Scale)
- **Construct:** Ability to bounce back and recover from stress
- **Primary Citation:** Smith, B. W., et al. (2008). The brief resilience scale: assessing the ability to bounce back. *International Journal of Behavioral Medicine*, 15(3), 194–200. [DOI: 10.1080/10705500802222972](https://pubmed.ncbi.nlm.nih.gov/18696313/)
- **Licence:** Salford PsyTech and EdInstruments list as unrestricted / open access.
- **Verification:** 6 items on 1–5 scale. Items 2, 4, 6 reverse-scored. Mean score 1.0–5.0. Cut-offs 1.00–2.99 (low), 3.00–4.30 (normal), 4.31–5.00 (high) as attributed by PsyToolkit to Smith et al. 2013 p.177 (primary not read).

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
- **Verification:** 30 items (5 per Holland dimension) on the official 0–4 scale (Strongly dislike … Strongly like). Profile scoring returns top 3 themes.

## 16. Tech-Stress Check
- **Construct:** Weekly digital overload, invasion, complexity, and uncertainty
- **Primary Citation:** Tarafdar, M., Tu, Q., Ragu-Nathan, B. S., & Ragu-Nathan, T. S. (2007). The impact of technostress on role stress and productivity. *Journal of Management Information Systems*, 24(1), 301–328.
- **Licence:** MAX academic project original wording (MIT). Explicitly labelled "MAX's own wording, not a validated clinical scale."
- **Verification:** 8 items on 1–5 scale. Sum 8–40 with 4 subscale parts.
