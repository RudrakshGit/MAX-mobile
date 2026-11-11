# Design

**MAX's sketchbook.** Every screen looks drawn by the pen that drew MAX, so the companion and the interface feel like
one character. Black ink on warm paper; dark mode is chalk on charcoal. It avoids the usual wellness look: pastel
gradients, blobs, stock 3D art.

## Colour and type

All tokens live in `src/lib/theme.ts`.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `paper` | `#FCF8EE` | `#1B1A18` | screen ground |
| `raised` | `#FFFDF7` | `#252321` | sheets, boxed groups |
| `ink` / `ink2` / `ink3` | `#1A1816` / `#4A4540` / `#6E6761` | `#EDE7DC` / `#BDB5A8` / `#9A9288` | text, outlines |
| `help` | `#B3261E` | `#FF8A80` | **the only alarm colour**: Help pill, crisis card, PHQ-9 item 9 |
| `characterBlush` | `#EBA49A` | same | MAX's cheeks |
| `tint.*` | soft pastels | deep versions | the ground behind a card picture, one per topic; never text or controls |

MAX and the avatars keep their light colours in dark mode, like a paper cut-out.

Type: **Kalam** (handwriting, has Devanagari) for titles, labels and MAX's voice; **Atkinson Hyperlegible Next** for
body, chat, inputs, consent and crisis text. Never handwriting for paragraphs, data or crisis text.

## Components

- **Hand-drawn:** card outlines, the text-field underline, MAX. Outlines come from a cached roughjs path with a stable
  seed per component, so nothing twitches on re-render.
- **Plain rounded boxes:** buttons, chips, checkboxes, the Help pill. Pressed state is instant, no spring.
- Numbers, times and dates use `TimeField` / `DateField` / `NumberField` (a field that opens a sheet with wheels).
- Icons: Doodle Icons (CC0) as components, one pen family. No emoji as icons.

## MAX, the character

MAX is drawn in code as a rig (`src/components/max/rig/`), following the design sheet in
`assets/max/source/max_design.png`: traced head and body, round mitten arms, small oval feet, pink cheeks. Each part
has its own pivot, so MAX moves between poses instead of swapping pictures. Poses and clips are data (`clips.ts`), a
pure sampler plays them on the UI thread, and `clips.test.ts` checks the motion rules. `/dev/max` is a developer lab.
Never generate MAX with AI image tools.

| Where | What MAX does |
| --- | --- |
| Everywhere | slow breathing, random blinks, an occasional glance |
| Today | after "Show me less": a walk, then sits, sighs, lies down and sleeps; a tap wakes it. A small reaction after the check-in |
| Talk | leans in while you type, thinks while waiting, nods when the reply comes |
| Appearance | tugs a lamp cord, then the theme changes |
| Floating MAX | a small hop on tab change; tap for shortcuts |

Card pictures are MAX scenes (`src/components/scenes/`) on their topic tint. Avatars are Open Peeps busts (CC0).

## Motion rules

1. No springs or bounce. Timing curves from `rig/motion.ts`; overshoot at most 1%, squash at most 8% from the feet,
   a hold after every action.
2. Slow loops move on twos (12 changes a second): cheaper to draw and reads as hand-drawn.
3. Cards animate only while in view (`SceneShelf` in a `FocusScope`), one at a time, like videos in a feed.
4. Theme switch: ink spreads from the tap point over the old screen (`modules/theme-reveal`, Android RenderThread),
   only after the new theme's first frame is ready. Always through `switchTheme()`.
5. No confetti, celebration pop-ups or sounds. Completion is a quiet tick.
6. "MAX moves: calm / still" and the system's reduce-motion give still poses and instant changes.

## Checklist for UI changes

- Light and dark; greyscale still tells every state apart.
- Text contrast at least 4.5:1, UI lines 3:1.
- Font scale 1.3: nothing clipped. Keyboard open on input screens.
- No colour except Help red, MAX's cheeks and card tints.
- Judge smoothness on a real phone, not the emulator.
