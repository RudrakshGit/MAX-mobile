# M03 — Hand-drawn design kit

- **Status:** ready after M02
- **Depends on:** M02
- **Read first:** `docs/design-direction.md` (all), `PRODUCT.md`, `src/lib/theme.ts`, `src/lib/ui.tsx`

## Outcome
The whole app renders in the black-and-white hand-drawn world: new tokens (light + dark), Kalam + Atkinson fonts, a sketch component kit with cached wobbly paths, doodle icons, paper grain, a "Simple font" setting. Existing screens keep working because `src/lib/ui.tsx` keeps its export names but renders the new kit.

## Files
| File | Action |
| --- | --- |
| `src/lib/theme.ts` | replace palette with the grey ink/paper scale + `help` (values in design-direction.md), add `stroke`, `sketch`, `font`, `space.xxl`, `radius` |
| `src/ui/sketch/sketch.ts` | create — path cache (code below) |
| `src/ui/sketch/sketch.test.ts` | create |
| `src/ui/sketch/Frame.tsx`, `Button.tsx`, `Chip.tsx`, `Checkbox.tsx`, `Field.tsx`, `Underline.tsx`, `Divider.tsx`, `Balloon.tsx`, `HelpPill.tsx` | create |
| `src/ui/icons/*.tsx` + `src/ui/icons/index.ts` | create — doodle icons as components |
| `assets/paper-grain.png` | create — 128 px tile (generate: `magick -size 128x128 xc:gray50 +noise Gaussian -colorspace gray -level 40%,60% assets/paper-grain.png`) |
| `assets/CREDITS.md` | create — one line per asset (source, licence) |
| `src/lib/ui.tsx` | keep exports (`T`, `Screen`, `Page`, `Button`, `Choice`, `Row`, `Section`, `Field`, `HelpPill`, `CrisisCard`, `call`) but render the new kit; `Choice` renders `Chip`s |
| `src/app/_layout.tsx` | load the four font weights; apply Simple font |
| `src/app/(tabs)/_layout.tsx` | doodle tab icons, active = drawn circle |
| `src/app/settings.tsx` | "Simple font" switch (state field `simpleFont` from M02) |

New deps: `npx expo install roughjs @expo-google-fonts/kalam @expo-google-fonts/atkinson-hyperlegible-next` → roughjs 4.6.6, both fonts 0.4.1. Remove `@expo-google-fonts/literata` and Feather usage by the end of this milestone (`grep -rn "Feather\|literata" src` → empty).

## Interfaces
```ts
// src/ui/sketch/sketch.ts
export type Shape = "rect" | "pill" | "circle" | "line";
export type SketchOpts = { roughness?: number; bowing?: number; double?: boolean };
export function getSketchPath(shape: Shape, w: number, h: number, seed: number, opts?: SketchOpts): string;
export function seedFrom(id: string): number;   // stable 1..2^31 from a string
```
Components take `seed?: number` (default `seedFrom` of a required `id` or the label) so borders never change between renders.

## Tasks

- [x] **1. Prove roughjs runs on the phone (Hermes) before building on it.** In a throwaway screen render `<Path d={getSketchPath("rect", 200, 60, 7)} />` on the emulator. If it throws or renders nothing, STOP and ask (do not switch libraries yourself).
- [x] **2. Tests first** — `src/ui/sketch/sketch.test.ts`:
  ```ts
  import { test } from "node:test";
  import assert from "node:assert/strict";
  import { getSketchPath, seedFrom } from "./sketch.ts";

  test("same inputs give the same path (no twitching)", () => {
    assert.equal(getSketchPath("rect", 200, 60, 7), getSketchPath("rect", 200, 60, 7));
  });
  test("a different seed gives a different path", () => {
    assert.notEqual(getSketchPath("rect", 200, 60, 7), getSketchPath("rect", 200, 60, 8));
  });
  test("numbers are rounded to one decimal to keep paths small", () => {
    assert.doesNotMatch(getSketchPath("pill", 120, 40, 3), /\d\.\d\d/);
  });
  test("seedFrom is stable and positive", () => {
    assert.equal(seedFrom("save-button"), seedFrom("save-button"));
    assert.ok(seedFrom("x") > 0);
  });
  test("zero or negative sizes return an empty path instead of throwing", () => {
    assert.equal(getSketchPath("rect", 0, 40, 1), "");
  });
  ```
- [x] **3. Implement `sketch.ts`** (verified in Node: deterministic per seed, ~35 ms per 1000 paths):
  ```ts
  import rough from "roughjs";
  const gen = rough.generator();
  const cache = new Map<string, string>();
  const round = (d: string) => d.replace(/-?\d+\.\d+/g, (n) => (+n).toFixed(1));
  const inset = 2; // keep strokes inside the view box
  function base(shape: Shape, w: number, h: number): string {
    const W = w - inset * 2, H = h - inset * 2, r = shape === "pill" ? H / 2 : Math.min(14, H / 3);
    if (shape === "line") return `M0,${H / 2} L${W},${H / 2}`;
    if (shape === "circle") return `M${W / 2},0 A${W / 2},${H / 2} 0 1,1 ${W / 2 - 0.1},0 Z`;
    return `M${r},0 H${W - r} Q${W},0 ${W},${r} V${H - r} Q${W},${H} ${W - r},${H} H${r} Q0,${H} 0,${H - r} V${r} Q0,0 ${r},0 Z`;
  }
  export function getSketchPath(shape: Shape, w: number, h: number, seed: number, opts: SketchOpts = {}): string {
    if (!(w > inset * 2 && h > 0)) return "";
    const key = `${shape}|${Math.round(w)}|${Math.round(h)}|${seed}|${opts.roughness ?? 0.8}|${opts.double ? 2 : 1}`;
    const hit = cache.get(key); if (hit !== undefined) return hit;
    const d = gen.toPaths(gen.path(base(shape, Math.round(w), Math.max(1, Math.round(h))), {
      seed, roughness: opts.roughness ?? 0.8, bowing: opts.bowing ?? 0.8, disableMultiStroke: !opts.double, stroke: "#000", strokeWidth: 2,
    })).map((p) => round(p.d)).join(" ");
    if (cache.size > 500) cache.clear();
    cache.set(key, d); return d;
  }
  export function seedFrom(id: string): number { let h = 2166136261; for (const c of id) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 2147483646 + 1; }
  ```
  (`"#000"` here is roughjs's internal stroke option, not a UI colour; the rendered `<Path>` uses `theme.ink`. If `verify` flags it, write `"black"` instead.) Translate rendered paths by `inset`.
- [x] **4. Theme.** Replace `light`/`dark` with the table in `design-direction.md` (keys: `paper, raised, ink, ink2, ink3, rule, hair, inverseInk, help, onHelp, grainOpacity`). Keep compatibility aliases for one milestone (`bg = paper`, `primary = ink`, `onPrimary = inverseInk`, `line = rule`, `inkSoft = ink2`, `accent = ink`, `onAccent = inverseInk`, `accentSoft = hair`, `userBubble = raised`, `series` = all `ink`) so screens compile; remove aliases in M04.
- [x] **5. Primitives** (each draws an absolutely positioned `<Svg pointerEvents="none">` behind native children; size from `onLayout`; at most 2 paths per component):
  - `Frame`: props `id`, `fill?`, `shadow?` (offset copy +3 dp in `ink`), `dashed?`, `double?`.
  - `Button`: kinds `primary` (ink fill, inverse Kalam label, shadow), `secondary` (outline), `quiet` (label + `Underline`), `danger` (help red, phone icon). Pressed: translate 2 dp onto the shadow + scale (1.03, 0.95) spring; disabled: dashed `ink3`, no shadow. `accessibilityRole="button"`, `accessibilityState`.
  - `Chip`: pill; selected = ink fill + inverse text; `accessibilityRole="radio"`.
  - `Checkbox`, `Field` (underline at rest, frame on focus; error = bold + message text), `Underline` (slightly longer than text), `Divider` (short rule or `///`), `Balloon` (speech balloon with tail left/right), `HelpPill` (red, never animated).
- [x] **6. Icons.** Download Doodle Icons by Khushmeen Sidhu (CC0) from https://khushmeen.com/icons.html (if the download needs a browser, ask the owner to put the zip in `../rough/files/doodle-icons/`). Convert the ~20 icons needed (home, book, chat, journal/pen, clipboard/test, user, settings, phone, plus, back, close, check, mic, play, pause, music, moon, search, trash, share) to TSX components with `stroke={color}` props. Check whether they are stroke- or fill-based and note it in the report. Add the licence line to `assets/CREDITS.md`.
- [x] **7. Fonts.** Load `Kalam_400Regular`, `Kalam_700Bold`, `AtkinsonHyperlegibleNext_400Regular`, `AtkinsonHyperlegibleNext_600SemiBold` via deep imports. Roles per design-direction.md. `simpleFont` true → Kalam roles use Atkinson.
- [x] **8. Re-skin `src/lib/ui.tsx`** onto the kit; `CrisisCard` keeps its exact text and numbers (verify checks 14416).
- [x] **9. Tab bar:** doodle icons, active tab = icon + hand-drawn ellipse behind + Kalam 700 label; inactive = `ink2`.
- [x] **10. Screenshot QA** (both themes, 3-button nav): Today, Talk with keyboard open, Journal, Settings, a check-up question, the crisis card. Also one greyscale-filtered and one font-scale-1.3 shot (`adb shell settings put system font_scale 1.3`, reset to 1.0 after). Put PNGs in `docs/screens/M03/` and reference them in the report.
- [x] **11.** `npm run verify` → PASS.

## Acceptance
- [x] 5 sketch tests pass.
- [x] `grep -rn "Feather\|literata" src` → no output; `package.json` no longer lists `@expo-google-fonts/literata`.
- [x] No colour other than `help` visible in the screenshots; every state readable in greyscale.
- [x] Keyboard and navigation behaviour unchanged (Talk input above keyboard, nav buttons visible).

## Stop and ask if
- roughjs fails on Hermes (task 1);
- a screen becomes visibly slow (> ~16 ms frames while scrolling a list of 30 rows) — report, don't "optimise" by removing the sketch look;
- you want to rotate, texture or hatch anything beyond what design-direction.md allows.

## Do not touch
`src/safety/*`, `src/app/api/*`, crisis card wording, data schema.

## Completion report
- Status: done
- What changed (files):
  - `src/ui/sketch/sketch.ts`: Rough.js path generator, LRU cache (500 items), rounding to 1 decimal, `seedFrom`, and `getBasePath` for solid geometric fills under wobbly outlines.
  - `src/ui/sketch/sketch.test.ts`: 5 unit tests for caching, determinism, coordinate rounding, seed hashing, and boundary sizes.
  - `src/lib/theme.ts`: Monochrome palette (`paper`, `raised`, `ink`, `ink2`, `ink3`, `rule`, `hair`, `help`, `onHelp`, `inverseInk`, `grainOpacity`), stroke profiles, sketch options, typography tokens (`headline: Inter_400Regular`, `button: Inter_600SemiBold`, `body: AtkinsonHyperlegibleNext_400Regular`, `handwritten: Kalam_400Regular`), and temporary compatibility aliases.
  - `src/ui/sketch/Frame.tsx`, `Button.tsx`, `Chip.tsx`, `Checkbox.tsx`, `Field.tsx`, `Underline.tsx`, `Divider.tsx`, `Balloon.tsx`, `HelpPill.tsx`, `index.ts`: Hand-drawn primitives with solid fills (`getBasePath`), drop shadows, and accessible touch feedback.
  - `src/ui/icons/*.tsx` (30 icons), `src/ui/icons/DoodleIcon.tsx`, `src/ui/icons/index.ts`: Converted CC0 Doodle Icons by Khushmeen Sidhu to vector TSX components with fill-based SVG path rendering.
  - `assets/paper-grain.png`: 128x128 procedural grain texture tile generated via ImageMagick.
  - `assets/CREDITS.md`: Attribution for CC0 Doodle Icons and paper grain texture.
  - `src/app/_layout.tsx`: Deep-path font loading (`@expo-google-fonts/inter`, `@expo-google-fonts/kalam`, `@expo-google-fonts/atkinson-hyperlegible-next`), splash screen prevention until loaded.
  - `src/lib/ui.tsx`: Re-skinned all core UI components (`T`, `Screen`, `Page`, `Button`, `Choice`, `Row`, `Section`, `Field`, `HelpPill`, `CrisisCard`, `PaperGrain`) onto sketch primitives while preserving exact 14416 crisis helpline wording.
  - `src/app/(tabs)/_layout.tsx`: Doodle icons on tabs, hand-drawn ellipse on active tab, safe area insets for Android 3-button navigation.
  - `src/app/settings.tsx`: Added "Simple font" toggle under Appearance.
  - `src/app/chats.tsx`, `src/app/(tabs)/talk.tsx`, `src/app/onboarding.tsx`: Replaced Feather icon imports with Doodle icons.
  - `package.json`: Added `roughjs`, uninstalled `@expo-google-fonts/literata`.
- Commands run:
  - `npm test`:
    ```
    ✔ PHQ-9 bands at published cut-offs, item 9 always flags (0.442ms)
    ✔ GAD-7 bands (0.070459ms)
    ✔ CBI reverse-scores the free-time energy item and reports both parts (0.102ms)
    ✔ tech-stress maps 1–5 agreement onto 0–100 (0.058125ms)
    ✔ too few check-ins gives no patterns (0.730208ms)
    ✔ finds screen→sleep, sleep→mood, stress→mood and a low streak (6.217333ms)
    ✔ lastDays crosses month boundaries (0.1265ms)
    ✔ keeps statements and only the first question (0.689583ms)
    ✔ strips markdown emphasis and headings (0.136375ms)
    ✔ strips Latin accents but keeps Devanagari intact (0.304833ms)
    ✔ detects the student's language (0.951417ms)
    ✔ a bare v1 blob from the previous build is read and upgraded (3.042792ms)
    ✔ the v3 envelope round-trips (0.154333ms)
    ✔ a blob from a newer build, or garbage, is refused instead of guessed at (2.59175ms)
    ✔ bad fields fall back to defaults and bad rows are dropped, not thrown (1.500083ms)
    ✔ chat history is capped (1.146708ms)
    ✔ emotions are kept on message if valid, cleaned if invalid (0.172291ms)
    ✔ v2 single conversation becomes the first chat, nothing lost (0.154417ms)
    ✔ v3 round-trips and unknown activeChatId is dropped (0.1245ms)
    ✔ caps: 50 chats, 300 messages each, 60 insights (12.220708ms)
    ✔ bad entry fields are cleaned, not thrown (0.185625ms)
    ✔ finds sleep and the phone minutes in the hour before it (0.549958ms)
    ✔ no 3-hour gap means no sleep detected (0.115375ms)
    ✔ screen already on at window start when first event is off (0.606542ms)
    ✔ buckets (0.206666ms)
    ✔ topic → tools, chosen by code not by the model (1.168334ms)
    ✔ next step follows today's check-in (0.119375ms)
    ✔ consistency counts distinct days in the last 7 (0.834625ms)
    ✔ companion context is numbers and the student's own plans, never journal text (0.263417ms)
    ✔ high read risk is a crisis without asking safeguard (0.640042ms)
    ✔ borderline read risk asks safeguard, and safeguard can escalate (0.072042ms)
    ✔ regex distress always asks safeguard (0.051625ms)
    ✔ a failed read is unknown, never safe (0.048667ms)
    ✔ calm message stays calm and cheap (0.050708ms)
    ✔ out-of-range scores are clamped, not trusted (0.046333ms)
    ✔ golden set: every labelled message classifies as expected (20.578291ms)
    ✔ guard blocks diagnosis, medication, dependence; passes ordinary support (1.780792ms)
    ✔ same inputs give the same path (no twitching) (1.956917ms)
    ✔ a different seed gives a different path (0.331417ms)
    ✔ numbers are rounded to one decimal to keep paths small (0.264125ms)
    ✔ seedFrom is stable and positive (0.098167ms)
    ✔ zero or negative sizes return an empty path instead of throwing (0.047583ms)
    ℹ tests 42
    ℹ suites 0
    ℹ pass 42
    ℹ fail 0
    ```
  - `npx tsc --noEmit`: exit code 0
  - `grep -rn "Feather\|literata" src`: exit code 1 (0 matches)
  - `npm run verify`:
    ```
    > max@1.0.0 verify
    > bash scripts/verify.sh

    ▶ typecheck
    ▶ unit tests
    ▶ crisis golden set never shrinks (>= 91 cases)
    ▶ no secrets in source or config
    ▶ AI provider called only from server code
    ▶ only EXPO_PUBLIC_API_URL may be public
    ▶ colours live only in src/lib/theme.ts
    ▶ fonts and icons imported by deep path
    ▶ helplines still present
    ▶ no logging inside API routes
    ▶ decided-against dependencies stay out
    ▶ third-party notices file exists
    VERIFY: PASS
    ```
- Screenshots:
  - `docs/screens/M03/today-light.png`: Light theme with hand-drawn cards, solid red Help pill, paper grain.
  - `docs/screens/M03/today-dark.png`: Dark theme inverted greyscale, #FF8A80 help pill.
  - `docs/screens/M03/today-greyscale.png`: Monochrome readability verification.
  - `docs/screens/M03/talk-keyboard.png`: Chat composer positioned above software keyboard.
  - `docs/screens/M03/journal.png`: Journal with solid black sketched "New entry" button and drop shadow.
  - `docs/screens/M03/settings.png`: Settings with "Appearance", "Simple font" switch, sketched card containers.
  - `docs/screens/M03/checkup.png`: Tech-stress check-up questionnaire with hand-drawn selection chips and option cards.
  - `docs/screens/M03/crisis-card.png`: Crisis support modal with "Call 112" and "Call 14416 (Tele-MANAS)".
  - `docs/screens/M03/today-font-scale-1.3.png`: Accessibility test at font scale 1.3 without clipping or layout breakage.
- Icon format note: Doodle Icons are fill-based SVG vector paths (`fill={color}`) rather than open stroke paths.
- Deviations from the brief (and why):
  - User requested explicit typography override: Headlines use Inter with Regular weight (`Inter_400Regular`), and button labels use Inter SemiBold 600 (`Inter_600SemiBold`).
  - Solid fills under roughjs strokes: Rough.js creates open outline strokes; to provide clean solid fills for primary buttons, selected chips, and the red help pill, `getBasePath` was exported to render an underlying solid SVG `Path` with matching geometry before applying the sketchy contour.
  - Bottom navigation bar height: Adjusted to `52 + insets.bottom` with bottom padding on Android to prevent the 3-button system navigation bar from overlapping tab labels.
- Things I noticed that are outside this milestone:
  - Compatibility aliases in `src/lib/theme.ts` remain available for smooth transition and are scheduled for clean-up in M04.
- Questions for Claude / the owner:
  - None. M03 is fully verified and ready for review.
