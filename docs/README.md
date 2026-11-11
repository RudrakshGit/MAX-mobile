# MAX docs

Start here. Each file has one job; keep them short and true to the code.

## Product and design
| File | What it is |
| --- | --- |
| [`../README.md`](../README.md) | What MAX is, features, privacy and safety in one paragraph each, quick start |
| [`../PRODUCT.md`](../PRODUCT.md) | Who it's for and what success looks like |
| [`v2-features.md`](v2-features.md) | The v2 feature list, owner decisions and the rules for a short attention span |
| [`design-direction.md`](design-direction.md) | The hand-drawn black-and-white look and MAX the mascot |
| [`courses-plan.md`](courses-plan.md) | Learn tab: courses, lessons, verified resources |

## How it's built
| File | What it is |
| --- | --- |
| [`architecture.md`](architecture.md) | How the phone, server and AI fit together; folders; key decisions |
| [`safety.md`](safety.md) | Crisis detection, output guard, privacy boundary |
| [`setup.md`](setup.md) | Run it, deploy the server, build an APK |
| [`dev-loop.md`](dev-loop.md) | Day-to-day development and testing on the emulator |

## Work
| Path | What it is |
| --- | --- |
| [`plan/00-master-plan.md`](plan/00-master-plan.md) | All milestones (M00–M16), who does what, owner steps |
| [`plan/M16-motion-cards-ia.md`](plan/M16-motion-cards-ia.md) | Latest: MAX's rig and motion rules, theme switch, card scenes, tabs (research, decisions, completion report) |
| [`plan/`](plan/) | One brief per milestone, each with its completion report |
| [`audit/2026-10-14-findings.md`](audit/2026-10-14-findings.md) | Every review pass: what was found and how it was fixed |
| [`screens/`](screens/) | Screenshots per milestone |
| [`../HANDOFF.md`](../HANDOFF.md) | Rules for the second agent (Antigravity) and who owns which files |

## Still waiting on the owner
Google Cloud sign-in and the Neon database ([M11](plan/M11-login-and-sync.md#owner-steps-all-free-no-card)), `ADMIN_EMAILS`
for college review ([M15](plan/M15-college-dashboard.md#owner-steps)), deploying the server, and signing the release APK
with a private key. Built APKs live outside the repo in `Major_Project/apk/` (latest: `max-phone-1.8.4.apk`, 11 Nov 2026). M16's motion
still needs a check on a real phone ([M16](plan/M16-motion-cards-ia.md#phase-6--7-nov-2026-claude)).
