# Product

<!-- impeccable:product-schema 1 -->

All facts below were confirmed by the owner in conversation (Sep–Oct 2026). Nothing here is inferred unless marked.

## Platform

android

## Users

College students in India, mostly on budget Android phones and 4G, writing in English, Hindi or romanised Hinglish. They open the app at night in a hostel or PG room, between classes, or before an exam, often with a short attention span and sometimes in distress. Secondary audience: the college (counsellor / administration), which sees only anonymous campus averages.

## Product Purpose

MAX (Mental-health Assistance & eXpert) is a free mental-health companion: daily check-ins, an AI companion to talk to, a journal (typed or spoken), validated self-tests, short courses and curated resources, calming sounds and music suggestions, and one-tap access to real helplines. It exists because Indian colleges are legally required to provide mental-health support (Supreme Court, *Sukdeb Saha v. State of Andhra Pradesh*, 25 Jul 2025) but most cannot staff it. Success: students come back on their own, feel helped ("Did this help?" taps), and anyone at risk reaches a human helpline fast.

## Positioning

Serene's concept (daily plan, courses, AI journal, tests, insights) without the paywall and dark patterns, plus what no comparable app has: code-level crisis detection in English, Hindi and Hinglish that never lets an AI handle a crisis, Indian helplines everywhere, validated screeners only, and a hand-drawn character (MAX) instead of a clinical interface.

## Operating Context

- Major Project E-G18, SVIIT (SVVV Indore), guide Mr. Devendra Kuril; built by Rudraksh Mishra with Antigravity implementing from written briefs.
- Distributed as APKs (Play Store optional later). Server: Expo Router API routes on EAS Hosting (free plan). AI: Groq free tier.
- Demo and pilot with real classmates (campus pulse needs ≥10 students).

## Capabilities and Constraints

- Free only: no paid services, no credit card.
- Optional Google login; signed-in users' app data is stored on the server so progress survives a new phone (owner decision, Oct 2026: the earlier "no data leaves the phone" rule is dropped).
- All ages allowed (owner decision). Known legal item: India's DPDP Rules require verifiable parental consent for under-18s from ~May 2027.
- Only 15 verified, legally shippable psychometric instruments (see `docs/v2-features.md`).
- No paywall, premium, gifts, confetti or congratulation pop-ups, no artificial waiting.
- English UI; the safety classifier and the AI understand Hindi and Hinglish.

## Brand Commitments

- Name **MAX**, expansion "Mental-health Assistance & eXpert".
- Mascot **MAX**: a cloud in 1930s rubber-hose cartoon style (gloves, black shoes, blush hatch marks, motion lines), bold rounded ink outline on cream paper. Source: `rough/files/MAX.png` (owner to confirm origin/ownership).
- Visual world pinned by the owner: fully hand-drawn, black and white, digital-pencil sketch / comic feel, minimalist, soft editorial, dark mode supported, animations where they help. Reference: getillustrations.com hand-drawn packs, but no colour.
- Avatars and people illustrations from Open Peeps (CC0).
- One colour exception allowed: the crisis / Help red.

## Evidence on Hand

- Research: `../research/reports/` and `../research/research_notes/` (Serene teardown, repos, instruments, AI stack, courses, sounds, login, UI).
- Owner's Serene and BetterMind screenshots: `../rough/files/serene_screenshots/`.
- Live server: `https://max-companion.expo.app`.
- No user testimonials, outcome data or clinical validation of MAX exist yet; do not claim any.

## Product Principles

1. Safety is code, not prompt text: a crisis always reaches a human helpline, never an AI reply.
2. Useful in 60 seconds, every time; nothing makes the student wait or feel guilty.
3. A bridge to people, not a replacement: every path can end at a friend, counsellor or helpline.
4. Honest: ranges not diagnoses, cited content, no invented claims.
5. Light enough for a budget phone on 4G.

## Accessibility & Inclusion

- Readable body font for long text, chat, inputs, consent and crisis text (handwriting only for display); a "Simple font" setting.
- States never rely on colour alone (fill, stroke weight, pattern, text).
- Respect reduced-motion; every animation has a still fallback.
- Hinglish-first examples; avatar picker open to everyone regardless of gender.
