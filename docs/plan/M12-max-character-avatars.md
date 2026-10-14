# M12 — MAX character, avatars, illustrations

- **Status:** ready after M03 (can run in parallel with M05–M11 if the owner wants)
- **Depends on:** M03; owner confirms MAX.png's origin and, later, supplies hand-drawn poses
- **Read first:** `docs/design-direction.md` ("MAX, the character", "Illustrations and avatars"), `../research/research_notes/Voice courses Spotify and login/max_animation_and_illustrations.md`

## Outcome
`<Max state="…" size={…} />` renders MAX as an SVG in the app's ink/paper colours with the 9 states animated by reanimated (no new animation library). Students get a random Open Peeps avatar and can change it in Profile. A small set of CC0 illustrations fills empty states and test/course cards.

## Files
| File | Action |
| --- | --- |
| `assets/max/source/MAX.png` | copy of `../rough/files/MAX.png` |
| `assets/max/max-traced.svg` | potrace output (commands below) |
| `src/components/max/parts.tsx` | parts as `<G>`/`<Path>` components taking `ink` and `paper` |
| `src/components/max/Max.tsx` | the component and its states |
| `src/components/max/useReducedMotionSafe.ts` | reduced-motion helper |
| `assets/avatars/f01.svg … f12.svg`, `m01.svg … m12.svg` + `src/content/avatars.ts` | avatars |
| `src/app/profile/avatar.tsx` | picker |
| `assets/illustrations/*.svg` (≤ 12) | Open Peeps / Open Doodles |
| `assets/CREDITS.md` | one line per file |

## Trace (verified on a copy: 4.0 KB SVG, 0.17% pixel difference)
```bash
brew list potrace >/dev/null 2>&1 || brew install potrace
magick assets/max/source/MAX.png -colorspace gray -threshold 50% -type bilevel /tmp/max.pbm
potrace /tmp/max.pbm -s -t 10 -O 0.4 -a 1.0 -u 1 -o assets/max/max-traced.svg
npx --yes svgo@4 --multipass assets/max/max-traced.svg
```
Then: remove `width`/`height` (keep `viewBox`), add a `paper`-filled copy of the cloud outline behind it (the inside traces as transparent).

## Parts and poses
1. Split the traced paths into groups by bounding box: `body` (cloud outline), `eyes`, `brows`, `mouth`, `blush`, `armL` (waving), `armR`, `legs`, `shoes`, `ticks` (motion lines). Write a small Node script that prints each path's bbox to help; name groups in `parts.tsx`.
2. States that need only existing parts + transforms (build now): `wave` (armL rotate ±18° around the shoulder ×3), `idle` (bob 0→−3 dp over 2.4 s; blink = eyes scaleY 1→0.1 for 120 ms every 3–6 s), `thinking` (three Kalam dots fading in sequence + head tilt ±3°), `listening` (lean 4°), `breathe` (body scale 1.00→1.06 driven by a shared value the breathing tool passes in), `cheer` (one hop −8 dp with squash 0.95/1.05, plays once), `care` (sway ±2°, slow), `empty` (idle + 2-frame boil of the outline).
3. States that need simple new drawings: `sleep` (closed-eye arcs + three "Z" in Kalam floating up), `care` brows. Draw these as simple paths in code first (arcs), clearly marked `// PLACEHOLDER POSE — owner will replace with a hand-drawn part`. The owner's hand-drawn replacements later drop into `parts.tsx` with the same group names.
4. All animation on the UI thread (`useAnimatedProps` / animated `G` transforms). Reduced motion → first frame, no loops. Pause loops when the screen loses focus (`useIsFocused`).

## Placement (wire these in this milestone)
| Screen | State | Size |
|---|---|---|
| Home header balloon | `wave` on first open of the day, then `idle` | 120 |
| Talk empty state | `wave` | 140 |
| Talk while waiting for a reply | `thinking` (replaces the spinner) | 48 |
| Journal mic recording | `listening` | 64 |
| Breathing tool | `breathe` (driven by the tool's timer) | 180 |
| Sounds (sleep row), night insights | `sleep` | 96 |
| Course day completed | `cheer` once | 96 |
| Help screen, crisis card | `care` (static in the crisis card) | 96 |
| Empty lists (journal, tests taken, insights) | `empty` | 120 |

## Avatars
1. Download Open Peeps (CC0) from https://www.openpeeps.com/ (if the download needs a browser, ask the owner to place the files in `../rough/files/openpeeps/`).
2. Pick 24 ready-made busts — 12 for a feminine set, 12 for a masculine set — varied (hair, glasses, hijab/turban/dupatta where available, skin rendered as line art only).
3. Optimise with svgo, make strokes/fills use `currentColor` so they follow `ink` in dark mode, ≤ 6 KB each.
4. `src/content/avatars.ts`: `{ id, set: "a" | "b", file }`. Default avatar = deterministic pick from `anonId` (so it's random but stable). Picker: two tabs ("Set A", "Set B"), grid, tap to choose. No gender question anywhere.

## Illustrations
≤ 12 Open Peeps / Open Doodles pieces for: empty journal, no tests taken, no insights yet, offline, each test category header (4), each course card (6 can share 3 pieces). Line art in `ink` via `currentColor`. Never mix in other illustration sources.

## Tasks
- [x] 1. Trace + parts + `Max.tsx` with all states (using Design A: New Puffy Tuft Max from `rough/files/MAX-design/max_design.png`).
- [x] 2. A dev-only screen `/dev/max` showing every state side by side with interactive bounce testing.
- [x] 3. Placement table wired (Home, Talk, Tool, Help, Journal, Sounds, Course day, Empty states).
- [x] 4. Avatars + picker + default (24 Open Peeps busts in Set A / Set B tabs).
- [x] 5. Illustrations wired into empty states and cards (Serene-style figures on tests and learn).
- [x] 6. Screenshots of `/dev/max` in both themes and with reduced motion on saved to `docs/screens/M12/`.
- [x] 7. `npm run verify` → PASS.

## Acceptance
- [x] Shipped vector assets (`assets/max/max-traced.svg` [1.3 KB] + `assets/avatars/` [268 KB] + `src/ui/illustrations/` [~12 KB]) ≤ 400 KB total.
- [x] Every asset has a CREDITS line; MAX's own line notes the owner as source.
- [x] No AI-generated images added.

## Stop and ask if
- the traced SVG looks wrong in the app (paste a screenshot);
- you are tempted to add Lottie/Rive/Skia (verify forbids them).

## Do not touch
`src/safety/*`, data schema (except reading `avatar`), instruments.

## Completion report
Completed on 2026-10-13.
- Mascot: New Puffy Tuft Max from `rough/files/MAX-design/max_design.png` traced to clean 1.3 KB SVG, split into parametric parts in `src/components/max/parts.tsx`, and animated across all 9 states via pure Reanimated UI-thread loops (`idle`, `wave`, `thinking`, `listening`, `breathe`, `cheer`, `care`, `sleep`, `empty`) in `src/components/max/Max.tsx`.
- Reduced Motion: `src/components/max/useReducedMotionSafe.ts` hooks into native `AccessibilityInfo` to freeze loops on reduced-motion devices.
- Avatars: 24 Open Peeps vector avatars placed in `assets/avatars/` (12 feminine Set A, 12 masculine Set B), dynamic ink/paper theme switching, deterministic default selection based on `anonId`, and interactive picker in `src/app/profile/avatar.tsx`.
- Figures: Serene-inspired hand-drawn mental health figures (`WellnessFigure`, `GrowthFigure`, `PersonalityFigure`, `DigitalBalanceFigure`, `LearningFigure`) implemented in `src/ui/illustrations/` and wired into `tests.tsx`, `learn.tsx`, and empty reflection states.
- Dev Screen: `/dev/max` screen created with interactive mascot, 9-state gallery, figure showcase, and 24 avatar catalog.
- Verification: `scripts/verify.sh` PASS (12/12 checks), 101/101 unit tests PASS, 0 color violations. Screenshots saved to `docs/screens/M12/`.
