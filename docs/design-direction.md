# Design direction — "MAX's sketchbook"

Planning contract for the v2 visual world, pinned by the owner (Oct 2026). `DESIGN.md` is written **after** the UI is built, from the shipped screens (impeccable's documenter step in milestone M14), not before.
Evidence: `research/research_notes/Voice courses Spotify and login/ui_hand_drawn_system.md` and `max_animation_and_illustrations.md`.

## Direction contract

**THESIS.** The app is MAX's sketchbook: every screen looks drawn by the same pen that drew MAX, so the companion and the interface are one character. It refuses the category default (pastel cards, gradient blobs, stock 3D illustrations, purple wellness gradients).

**OWN-WORLD.** Black ink on warm paper (dark mode: chalk on charcoal). One pen family: MAX's bold rounded ink line for the mascot, a thinner 2 dp hand-drawn line for UI. Comic and zine idioms do the work colour normally does: hard offset shadows (a solid ink copy shifted 3 dp, never a blur), hatching only where it means something (selected, shaded chart area, MAX's blush `///`), speech balloons for MAX, a hand-lettered underline that runs slightly too long, short wobbly rules instead of full-width dividers. The only colour in the app is the Help / crisis red.

**STORY.** A tired student opens the app at night, is greeted by MAX in a speech balloon, does one small thing (check-in, a 1-minute breath, a journal line) and leaves feeling a little lighter. Anyone in trouble sees the red Help button on every screen and reaches a human in one tap.

**FIRST VIEWPORT (Home).** Left-aligned hand-lettered greeting ("Good evening, Ria") with a draw-on underline; MAX (`wave` state, ~120 dp) at the right edge, half out of frame, talking in a balloon that holds today's card; below, the Daily Plan as three hand-drawn tick rows (not cards); the red Help pill top-right; tab bar of doodle icons with a hand-drawn circle around the active one.

**FORM.** Pinned by the owner (no concept roll): hand-drawn monochrome sketch / comic, soft editorial layout, Operate mode for app screens, Read mode for lessons and insights.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Physical scene (decides light/dark)

Hostel room at 11 pm, phone brightness low, roommate asleep → dark mode must be first-class, not an afterthought. Daytime between classes, outdoors → the light (paper) theme must hold contrast in sunlight. The app follows the system setting.

## Tokens (proposal; validate with screenshots on a 720p phone)

| Token | Light | Dark | Use |
|---|---|---|---|
| `paper` | `#FCF8EE` (= MAX.png background) | `#1B1A18` | screen ground |
| `raised` | `#FFFDF7` | `#252321` | sheets, the few boxed groups |
| `ink` | `#1A1816` (16.7:1) | `#EDE7DC` (14.1:1) | text, outlines |
| `ink2` | `#4A4540` | `#BDB5A8` | secondary text |
| `ink3` | `#6E6761` | `#9A9288` | captions, placeholders |
| `rule` | `#8A8379` (3.5:1) | `#7D766C` (3.9:1) | non-text lines needing 3:1 |
| `hair` | `#B8B0A3` | `#5C5852` | decorative only |
| `help` / `onHelp` | `#B3261E` / `#FFFFFF` | `#FF8A80` / `#1B1A18` | **the only colour**: Help pill, crisis card, PHQ-9 item-9 alert. Never for ordinary errors |

Strokes: hair 1.25 · line 2 · bold 2.75 · icon 1.75 dp. Sketch: roughness ≤ 1.0 (0.8 default), hero 1.1, offset shadow 3 dp, boil 8 fps. Spacing adds `xxl: 64` for editorial air. Paper grain: 128 px tiled PNG at 4% (light) / 6% (dark).

Type: **Kalam** (OFL, has Devanagari) for display, titles, labels, chips, tab labels and MAX's voice; **Atkinson Hyperlegible Next** for body, chat bubbles, inputs, settings, consent and crisis text. Never handwriting for paragraphs, numbers in data, or crisis text. Settings → "Simple font" swaps Kalam for Atkinson everywhere.

## Components

All draw an absolutely positioned `<Svg pointerEvents="none">` behind native `Text`/`Pressable`, with paths from a cached `getSketchPath(shape, w, h, seed)` (roughjs generator → path string, rounded to 1 decimal, cached by shape+size+seed). Seeds are stable per component id, so borders never twitch on re-render. At most 2 paths per list row.

| Component | Drawn as | States without colour |
|---|---|---|
| `SketchFrame` (primitive) | wobbly rounded rect, optional fill, optional offset shadow, optional dashed | — |
| `SketchButton` | primary: ink fill + inverse label + offset shadow; secondary: outline; quiet: label + draw-on underline; help: red fill + phone doodle | pressed: moves 2 dp onto its shadow + squash; disabled: dashed `ink3`, no shadow |
| `Chip` (replaces `Choice`) | pill outline | selected: ink fill + inverse text + a scribble circle drawn on |
| `SketchCheckbox` | wobbly square, tick drawn on (0.3 s) | focus: dashed ring |
| `SketchField` | notebook underline at rest, full frame on focus | error: bold stroke + zigzag + `!` doodle + text |
| `Underline`, `Divider` | slightly-too-long hand line; short rule or the `///` motif | — |
| Tab icons | Doodle Icons (CC0) as TSX, 24 dp | active: hand-drawn ellipse behind + Kalam 700 label |
| `HelpPill` | red sketched pill, phone doodle, "Help" | never animated, never hidden |
| `Balloon` | comic speech balloon with tail toward MAX | — |
| Charts | ink lines with dash patterns (solid, `6 4`, `2 4`), one static hatch area per chart, direct labels | — |

## MAX, the character

Pipeline: trace `MAX.png` with potrace (tested: 4 KB SVG after SVGO, 0.17% pixel difference) → split into parts (body, eyes, mouth, arm-L, arm-R, legs, extras) → redraw the outline hidden behind each arm → draw new parts for new poses by hand (Inkscape/Krita) in the same line weight. Do not generate poses with AI image tools (style drift, unclear ownership). Two colourways via props (`ink`, `paper`) so dark mode needs no second file.

| State | Where | Motion (reanimated, transform/opacity only) |
|---|---|---|
| `wave` | Home greeting, onboarding | arm-L ±18° ×3 then rest; motion ticks flicker |
| `idle` | default | bob 0→-3 dp over 2.4 s; blink every 3–6 s |
| `thinking` | chat while the reply is generated | three dots in sequence, head tilt ±3°; stops the moment the reply arrives |
| `listening` | voice recording, typing | lean 4° toward input; cupped-hand pulse |
| `breathe` | breathing tool | body scale 1.00→1.06 driven by the breathing timer |
| `sleep` | sleep sounds, night | slow bob 4 s, three Z's float up |
| `cheer` | course day done (instead of confetti) | one hop with squash/stretch, plays once |
| `care` | Help and crisis | very slow sway ±2°, no bounce; static in crisis flow |
| `empty` | empty states | idle + a prop, 2-frame boil |

Files: `assets/max/parts/*.svg`, `src/components/max/Max.tsx` (`<Max state="wave" size={120} />`). Budget ≈ 12 KB per state, ≈ 100 KB total. Reduced motion → first frame, no loop.

## Illustrations and avatars

- People, empty states, test and course art: **Open Peeps** (CC0, verified on openpeeps.com) and Open Doodles (CC0), recoloured to `ink` line on transparent. Not getillustrations (paid; reference only), not unDraw/DrawKit (style clash, AI-training clauses).
- **Avatars:** 24 ready-made Open Peeps busts, 12 in a feminine set and 12 in a masculine set, exported as SVG into `assets/avatars/`. New users get a random one; Profile → "Change avatar" opens a picker with both sets open to everyone (tabs, not a gender question). No runtime composition engine.
- Budget ≈ 250 KB for all illustrations. Every shipped raster/SVG records its source and licence in `assets/CREDITS.md`.

## Motion grammar

1. One authored moment per screen (MAX, or a draw-on underline), never scattered effects.
2. Draw-on strokes (`strokeDashoffset`) for underlines, ticks, the active-tab circle — 250–400 ms, ease-out.
3. Press: squash (scaleX 1.03 / scaleY 0.95, spring) + 2 dp shift onto the shadow.
4. Boiling line (3 seeded paths at 8 fps) on at most one hero element per screen, paused when the screen loses focus.
5. No confetti, no celebration modals, no sounds; completion = a quiet tick + `cheer` once.
6. Reduced motion: no loops, no boil, draw-ons appear instantly.

## Anti-slop rules (checked in the finish review)

1. Roughness ≤ 1; double strokes only on 1–2 hero elements per screen.
2. Handwriting only for display/labels; calm body font for reading.
3. Stable seeds; nothing twitches on re-render.
4. One pen family: no Feather/Material icons left, no emoji as icons, no mixed illustration styles.
5. No fake paper (photo textures, coffee stains, torn edges, blurred shadows).
6. At most one rotated element per screen.
7. Hatching only with meaning.
8. Editorial asymmetry: left-aligned titles, generous white space, not everything in a box, real copy in MAX's voice.
9. Cream + serif is the AI default for "warm" apps; this world is earned by the comic idioms above, not by the paper colour alone.

## QA checklist (per milestone that touches UI)

- Greyscale screenshot: every state still distinguishable.
- Contrast: text ≥ 4.5:1, UI lines ≥ 3:1, both themes.
- Font scale 1.3 screenshot: nothing clipped.
- Reduced-motion screenshot: no loops.
- 3-button and gesture navigation; keyboard open on every input screen.
- No colour except `help`.
