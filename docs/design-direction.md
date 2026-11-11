# Design direction — "MAX's sketchbook"

Planning contract for the v2 visual world, pinned by the owner (Oct 2026). `DESIGN.md` is written **after** the UI is built, from the shipped screens (impeccable's documenter step in milestone M14), not before.
Evidence: `research/research_notes/Voice courses Spotify and login/ui_hand_drawn_system.md` and `max_animation_and_illustrations.md`.

## Direction contract

**THESIS.** The app is MAX's sketchbook: every screen looks drawn by the same pen that drew MAX, so the companion and the interface are one character. It refuses the category default (pastel cards, gradient blobs, stock 3D illustrations, purple wellness gradients).

**OWN-WORLD.** Black ink on warm paper (dark mode: chalk on charcoal). One pen family: MAX's bold rounded ink line for the mascot, a thinner 2 dp hand-drawn line for UI. Comic and zine idioms do the work colour normally does: hard offset shadows (a solid ink copy shifted 3 dp, never a blur), hatching only where it means something (selected, shaded chart area), speech balloons for MAX, a hand-lettered underline that runs slightly too long, short wobbly rules instead of full-width dividers. Colour stays rare: the Help / crisis red is the only alarm colour, and since M16 (owner, 7 Nov 2026) the only other colours are MAX's pink cheeks and a soft tint behind each card picture, never for text.

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
| `help` / `onHelp` | `#B3261E` / `#FFFFFF` | `#FF8A80` / `#1B1A18` | **the only alarm colour**: Help pill, crisis card, PHQ-9 item-9 alert. Never for ordinary errors |
| `characterBlush` | `#EBA49A` | `#EBA49A` | MAX's cheeks only (the design sheet's pink), drawn at 75% |
| `tint.*` | exam `#F8E7C4`, sleep `#E3E4F3`, calm `#DCEFE8`, thoughts `#ECE3F3`, kind `#F7E1E1`, focus `#DDEBF5`, support `#F6E2D3` | `#3A3222`, `#262A3F`, `#1F3631`, `#312A3A`, `#3B2829`, `#22323D`, `#3B2D24` | the soft ground behind a card picture, one per topic (M16). Never for text, controls or states |

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

Since M16 MAX is drawn in code as a rig (`src/components/max/rig/`; plan, research and reasons in `docs/plan/M16-motion-cards-ia.md`). The shape follows the decided design sheet (`assets/max/source/max_design.png`): the traced head and body with its own flanks and round bottom, plump round mitten arms (at rest only the outer edge shows; the full outline fades in once an arm lifts, so a raised hand is whole and round), small charcoal oval feet tucked under the body with no legs, and the sheet's subtle pink cheeks. Every part is a small drawing in its own view with its own pivot, so MAX moves between poses instead of swapping pictures. Two colourways come from the theme, so dark mode needs no second file. Do not generate poses with AI image tools (style drift, unclear ownership).

Motion is data: poses and short clips (`clips.ts`), a pure sampler (`sample.ts`) and a player on the UI thread (`useRigPlayer.ts`). The rules below are unit tests (`clips.test.ts`). The developer-only lab at `/dev/max` plays any clip and shows a filmstrip.

| Where | What MAX does |
|---|---|
| At rest, everywhere | slow breathing on twos, random blinks (2–7 s apart, sometimes double), a glance or small gesture every 6–15 s (size ≥ 70) |
| Home | after "Show me less" the story: a stroll, back slower and worn out, sits half-way, one long breath out, lies down on its side and sleeps with drifting Zs; a tap wakes MAX (rolls up, stretches) and it walks back. After the check-in: a small hop (good day), a nod (okay) or leaning in with a heart (hard day) |
| Talk | leans in while the student types, thinks (dots one by one) while waiting, nods when the reply arrives |
| Settings → Appearance | reaches up and tugs the lamp cord, then the theme changes |
| Floating MAX | a small calm hop on tab change, eyes turn toward a touch (touch-down only), a calm sink when switched off |
| Tapped / shaken | looks up and smiles / gets dizzy, shakes it off and smiles (no anger) |

Settings → "MAX moves: normal / calm / still": calm drops the idle gestures and settles still after 5 s; still, like the system's reduce motion, shows still poses (WCAG 2.2.2).

## Illustrations and avatars

- **Card pictures** (tools, courses, quick reads, media, self-tests): **MAX's world**, drawn in code since M16 (`src/components/scenes/`: `MaxFigure`, a still MAX built from the rig's parts, plus a small prop kit; 21 scenes). Each sits on its topic's soft tint; one or two small parts move once (2–4 s) the first time a card shows in a session, then hold; still with reduce motion or "MAX moves: still". A card is the picture, a title and one detail (`SceneCard`). The pencil-drawn figures that used to sit on cards (`src/ui/illustrations/`) were removed in M16.
- **Avatars:** 24 ready-made Open Peeps busts, 12 in a feminine set and 12 in a masculine set, exported as SVG into `assets/avatars/`. New users get a random one; Profile → "Change avatar" opens a picker with both sets open to everyone (tabs, not a gender question). No runtime composition engine.
- Budget ≈ 250 KB for all illustrations. Every shipped raster/SVG records its source and licence in `assets/CREDITS.md`.

## Motion grammar

1. One authored moment per screen (MAX, or a draw-on underline), never scattered effects.
2. Draw-on strokes (`strokeDashoffset`) for underlines, ticks, the active-tab circle — 250–400 ms, ease-out.
3. Press: the button sits 2 dp onto its shadow with a slight squash while held — an instant state, not a spring.
4. **No springs and no bounce anywhere** (owner, M16): timing curves only (`rig/motion.ts`: standard, decelerate, accelerate, in-out). Overshoot at most 1%, squash at most 8% and always from the feet with the volume kept, anticipation before big moves, a hold of at least 400 ms after every action, follow-through on arms and comic marks.
5. Slow loops (breathing, sways) and comic marks move **on twos**: the value changes 12 times a second (`steppedEasing`, `twos()`), so Android redraws far less and the motion reads as drawn.
6. Card scenes play once per session and hold; nothing on a card loops.
7. Theme switch: a picture of the old screen closes in a circle into the point the student tapped (420 ms, Android RenderThread, `modules/theme-reveal`); it starts only after the new theme's first heavy frame is drawn.
8. No confetti, no celebration modals, no sounds; completion = a quiet tick + one small cheer.
9. Reduced motion or "MAX moves: still": no loops, still poses, draw-ons appear instantly, the theme just changes.

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
- No colour except `help`, MAX's cheeks and the card tints.
- Motion on a real phone (release build): the emulator's GPU takes 40–100 ms for every full-screen frame, so it can't show smoothness.
