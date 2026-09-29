# MAX — Mental-health Assistance & eXpert

A private, offline-first wellbeing companion for college students in India, built for a budget Android phone on a 4G connection.

**Major Project E-G18** · Shri Vaishnav Institute of Information Technology, SVVV, Indore · Guide: Mr. Devendra Kuril
Prayagi Sahajwani · Sanskriti Kachole · Raja Jain · Rudraksh Mishra

> Indian colleges now have a legal duty to provide mental health support (Supreme Court, *Sukdeb Saha v. State of Andhra Pradesh*, 25 July 2025), but most rural and semi-urban campuses cannot staff it. MAX fills the gap between "a counsellor is mandated" and "a counsellor exists": always available, stigma-free, and built to hand students on to real people when it matters.

MAX is **not** a doctor or a therapist. It never diagnoses, never discusses medication, and never handles a crisis with AI.

## What it does

| Screen | What the student gets |
| --- | --- |
| **Today** | A four-tap daily check-in (mood, last night's sleep, phone in the hour before sleep, study pressure), a suggested next step, and the strongest pattern found so far |
| **Talk** | An AI companion the student names. CBT-informed: reflects, asks one Socratic question, names thinking traps kindly. Replies in English, romanised Hinglish or Hindi to match the student. Knows their weekly averages and their own coping plans (opt-out), never their journal |
| **Journal** | Free writing or prompts, with "Talk about this" to carry an entry into the conversation |
| **Insights** | Mood, sleep, phone use and pressure on one timeline; plain-language patterns ("on nights with an hour of phone before bed, your sleep was 2.5 points lower"); check-up trends; a text summary the student can share with a counsellor |
| **Explore** | Tools (one-minute cyclic-sigh breathing, 5-4-3-2-1 grounding, Thought Reframe, Spiral Breaker), six short cited lessons, and check-ups: PHQ-9, GAD-7, Copenhagen Burnout Inventory and a weekly tech-stress check |
| **Help** | On every screen. One tap to call 112, Tele-MANAS (14416 / 1-800-891-4416) or Vandrevala Foundation |
| **Settings** | Rename the companion, reminders (daily check-in, wind-down before bed), fingerprint/PIN app lock, automatic screen time, campus pulse, export or delete everything |
| **Campus pulse** | Anonymous averages for a college, shown only once 10 or more students contribute (k-anonymity, k ≥ 10) |

**Automatic screen time** (Android APK only): with the student's permission, MAX reads when the screen was on and which apps were in the foreground, works out when they fell asleep and how much they used the phone in the hour before, and fills in the check-in. All of it is computed on the phone.

## Safety, in one paragraph

Every message passes a deterministic classifier (English, Hindi, Hinglish; 91 labelled test cases) **on the phone** before anything is sent, so a crisis gets helplines instantly and offline. The server classifies again, and a safety-tuned model (`gpt-oss-safeguard-20b`) runs alongside the reply to catch indirect phrasing; if either says crisis, the AI's reply is discarded unseen. Every reply is inspected for diagnosis, medication advice, false identity and dependence before it is sent. See [`docs/safety.md`](docs/safety.md).

## Privacy, in one paragraph

No account, no email, no phone number. Check-ins, journal, check-ups, tools and chat history live only on the phone. Chat text goes to our server and to Groq (which does not train on API data) with emails and phone numbers redacted. Campus pulse is opt-in and sends three numbers with a random ID. Export and delete-everything are in Settings.

## Quick start

```bash
npm install
cp .env.example .env.local   # then add your GROQ_API_KEY
npx expo start               # scan the QR code with Expo Go (SDK 57) on Android
```

First time building an app? Follow [`docs/setup.md`](docs/setup.md) step by step. It also covers building the APK and deploying the server.

## Stack

Expo SDK 57 (React Native 0.86, TypeScript) · Expo Router with API routes on EAS Hosting · Groq (`openai/gpt-oss-120b` for replies, `openai/gpt-oss-safeguard-20b` for risk) · on-device storage (AsyncStorage) · Neon Postgres for the optional campus pulse · a small Kotlin module for Android usage stats · Node's built-in test runner.

Everything runs on free tiers with no credit card. See [`docs/architecture.md`](docs/architecture.md).

## Checks

```bash
npm run typecheck
npm test            # safety golden set, scoring, insights, screen-time maths, reply shaping
```

## Licence

MIT, see [`LICENSE`](LICENSE). Fonts: Literata (SIL Open Font License). Icons: Feather (MIT).
