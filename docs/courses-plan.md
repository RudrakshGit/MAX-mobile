# Courses and resources plan

Decided Oct 2026. Evidence and the full vetted resource list: `research/research_notes/Voice courses Spotify and login/courses_and_resources.md` (and `../Serene features technical implementation/content_and_engagement.md`).

## The rule

Build a course in-app only where (a) a published, evidence-based technique exists, (b) an open-licensed or field-tested source can be adapted, and (c) a qualified reviewer can sign it off. Everything else goes to a curated **Watch & read** library of trustworthy videos and websites, with a short in-app first-aid card and the helpline. A thin course is worse than a good link.

## What ships

### A. In-app courses at launch (6)

| # | Course (days) | Technique and source | Daily "Watch" companion (optional) |
|---|---|---|---|
| 1 | **Stress toolkit** (6) | WHO *Doing What Matters in Times of Stress*, tools 1–6 (CC BY-NC-SA 3.0 IGO, adapted, Hindi edition exists) | WHO-SEARO "Managing Stress Better" videos, 2–5 min each |
| 2 | **Exam stress** (7) | DWM grounding + unhooking, catastrophe check (CBT), if-then study plan, self-kindness after the paper | Mind stress tips; LLL 5-4-3-2-1; WHO-SEARO grounding |
| 3 | **Overthinking & worry** (5) | worry vs problem, worry time, problem-solving steps, unhooking, present focus | Every Mind Matters; Therapy in a Nutshell |
| 4 | **Sleep reset** (5) | CBT-I rules: fixed wake time, stimulus control, wind-down, worry before bed, review (written originally) | Therapy in a Nutshell CBT-I; EMM sleep; Hindi: Dr Praveen Tripathi (verify registration first) |
| 5 | **Get going again** — low mood + procrastination (5) | behavioural activation: activity–mood link, tiny tasks, two-minute start, if-then, self-forgiveness | TED-Ed procrastination; WHO "Depression: let's talk" |
| 6 | **Kind to yourself** — self-criticism (5) | 29k Self-compassion I rewritten as solo cards (CC BY-SA 4.0) + DWM "Being kind" | Therapy in a Nutshell; EMM reframe; WHO-SEARO being kind |

### B. Later, after reviewer time (3)
Placements & comparison · Hostel life: loneliness & homesickness · Phone & focus. All need original writing (no qualified source exists, especially in Hindi), so they wait for review capacity.

### C. Library only (no full course)
Panic attacks · Grief & loss · Breakups · Anger · Low mood beyond mild. Each gets one in-app card (e.g. "During a panic attack": slow breath + grounding + "see a doctor if…" + Tele-MANAS), the vetted Watch & read list, and the helpline. If a recent screener is high (PHQ-9 ≥ 15 or item 9 > 0), "Talk to someone" comes before any content.

### D. "Your course" (personalised, 5 days)
Rule-based, no AI:
1. Rank need areas from the latest results (PSWQ → worry, SCI → sleep, PHQ-9/WHO-5 → mood, CBI → stress, RSES → self-criticism) and the last 7 check-ins (low sleep, high pressure).
2. Pick days 1–4 as single lessons from courses 1–6 matching the top two areas (e.g. high worry → Overthinking D2, D3; poor sleep → Sleep D2, D4).
3. Day 5 is "What helped?" → suggests the full course or a "go deeper" resource.
4. With no data yet, "Your course" = Stress toolkit days 1, 2, 4, 5 + "What helped?".
5. Lessons marked "Did this help? — no" are not picked again.

## Lesson format (every lesson)

- Title ≤ 6 words · one idea · 250–450 words (2–4 min) · second person · Indian student examples (hostel, mess, PG, placements, CGPA, calls home).
- "Try it now": opens an existing MAX tool (breathing, 5-4-3-2-1, reframe, if-then) or a one-line write box. ≤ 2 min.
- Optional one "Watch" item (≤ 5 min, never autoplay).
- "Did this help? yes / no".
- Footer: source, licence, reviewer, review date. WHO-derived and 29k-derived text never share a lesson (different share-alike licences). WHO lessons carry WHO's required disclaimer: "This adaptation was not created by WHO. WHO is not responsible for the content or accuracy of this adaptation." No WHO logo.
- No cure promises, no diagnosis words, a "when to get more help" line, Tele-MANAS 14416 on every course page.
- No time locks: the next day is available immediately; pacing is suggested, not enforced.

Content file: `src/content/courses/<course-id>.ts` exporting `{ id, title, summary, days: Lesson[] }` where `Lesson = { day, title, body, action: { tool } | { write: string }, watch?: ResourceId, source, licence, reviewer?, reviewedOn?, reviewDue? }`.

## Review process (definition of done for content)

1. A student drafts from the named source (Antigravity may draft; a human edits).
2. A second student checks it against the lesson format and a readability check.
3. A qualified reviewer signs off: college counsellor or psychology faculty. Name + date recorded in the file.
4. 3–5 students read it and answer "what would you do now?" — rewrite if they can't.
5. Re-review every 12 months (`reviewDue`).

A course without reviewer sign-off ships behind a "Draft — under review" label or not at all; never silently.

## Watch & read library

- One file `src/content/resources.ts`: `{ id, topic, kind: "video" | "article", title, creator, credential: "official" | "clinician" | "ngo", url, language: "en" | "hi" | "hinglish", minutes?, reviewedOn, status: "ok" | "hidden" }`. Seed it only from items marked **verified** in the research note (creator and credentials checked, link live). Creators with unverified credentials are excluded until verified.
- Grouped by the 13 topics; each card shows duration, language, creator, credential badge and reviewed date, plus "Report a broken or unhelpful link".
- **Opening (decided: link out, no embedded player):** YouTube links open the YouTube app via `Linking.openURL` (YouTube's policy prefers the app; embedding needs a WebView, an app-identity Referer header that has been fragile since late 2025, and adds weight). Websites open in an in-app browser tab via `expo-web-browser`. Each card says "Opens YouTube" / "Opens nhs.uk".
- Maintenance: `npm run check-links` (a Node script) checks every URL (YouTube via the free oEmbed endpoint; sites via HEAD/GET) and prints dead or blocked items for a human to mark `hidden`. Run before every release. Mind's site blocks bots: treat "blocked" as "check by hand".

## Effort

≈ 33 lessons at launch × ~400 words ≈ 13,000 words, plus Hinglish adaptations. Realistic only with the review process above; this is the long pole of v2, so content writing starts in parallel with engineering milestones.
