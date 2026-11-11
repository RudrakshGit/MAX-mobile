import { useSyncExternalStore } from "react";
import { AccessibilityInfo, Appearance, PixelRatio } from "react-native";
import ThemeReveal from "../../modules/theme-reveal/src/ThemeRevealModule";
import { getFloatingMaxState } from "@/lib/max-store";
import { getState, update } from "@/lib/store";
import { THEMES } from "@/lib/theme";

// Switching light ↔ dark as ink spreading on paper (owner, 11 Nov 2026; modules/theme-reveal explains the native side).
// A picture of the window covers the app and ink in the new paper colour spreads from the tap straight away, while
// the app re-renders in the new theme underneath, unseen. Before, nothing moved until that re-render was done, so
// on a phone the switch looked stuck for a second. Then the cover fades and the new screen shows through.
// Reduce motion, an error or an old phone: the theme just changes.

type Pref = "system" | "light" | "dark";
const INK_MS = 650;
const FADE_MS = 220;

let busy = false;

const isDark = (pref: Pref) => pref === "dark" || (pref === "system" && Appearance.getColorScheme() === "dark");

// React has committed the new theme when the root layout's layout effect runs (it re-renders on every theme change).
let committed: (() => void) | null = null;
export function markThemeCommitted() {
  committed?.();
  committed = null;
}
const nextCommit = () => new Promise<void>((resolve) => (committed = resolve));
const frames = (n: number) => new Promise<void>((resolve) => {
  const step = (k: number) => (k <= 0 ? resolve() : requestAnimationFrame(() => step(k - 1)));
  step(n);
});
const timeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<"late">((resolve) => setTimeout(() => resolve("late"), ms))]);

// While the circle moves, the status and navigation bar icons keep the old theme until the edge passes them.
let heldDark: boolean | null = null;
const barListeners = new Set<() => void>();
const setHeld = (v: boolean | null) => {
  heldDark = v;
  barListeners.forEach((l) => l());
};
/** The bars' theme: the real one, or the old one while a switch is still revealing. */
export function useBarsDark(actualDark: boolean) {
  const held = useSyncExternalStore(
    (l) => (barListeners.add(l), () => barListeners.delete(l)),
    () => heldDark,
  );
  return held ?? actualDark;
}

export async function switchTheme(pref: Pref, origin?: { x: number; y: number }) {
  const before = getState().themePreference ?? "system";
  // where the student tapped, read now: the touch store forgets it after 2 s
  const at = origin ?? getFloatingMaxState().touchPos ?? { x: 0, y: 0 };
  if (pref === before) return;
  const apply = () => update(() => ({ themePreference: pref }));
  if (busy || isDark(pref) === isDark(before)) return apply();
  busy = true;
  try {
    if (!ThemeReveal || (await AccessibilityInfo.isReduceMotionEnabled())) return apply();
    if (!(await ThemeReveal.cover())) return apply();
    setHeld(isDark(before));
    const px = PixelRatio.get();
    const next = isDark(pref) ? THEMES.dark : THEMES.light;
    // the ink starts now, on the RenderThread; the heavy re-render below happens under it
    const inked = ThemeReveal.ink(at.x * px, at.y * px, next.paper, INK_MS);
    const done = nextCommit();
    apply();
    await timeout(done, 1500);
    await frames(2);
    if (!(await inked)) return void ThemeReveal.clear();
    setHeld(null);
    if (!(await ThemeReveal.finish(FADE_MS))) ThemeReveal.clear();
  } catch {
    ThemeReveal?.clear();
    apply();
  } finally {
    setHeld(null);
    busy = false;
  }
}

