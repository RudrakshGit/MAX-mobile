import { NativeModule, requireOptionalNativeModule } from "expo";

declare class ThemeRevealModule extends NativeModule<{}> {
  /** Lays a picture of the window over the app. False if it couldn't (old Android, no window). */
  cover(): Promise<boolean>;
  /** Spreads ink of `color` (#RRGGBB) from (x, y) in pixels over the picture; resolves when the page is all ink. */
  ink(x: number, y: number, color: string, durationMs: number): Promise<boolean>;
  /** After the new theme's first light frame, fades the picture out and frees it. */
  finish(fadeMs: number): Promise<boolean>;
  /** Removes the picture at once. */
  clear(): void;
  /** Removes the window's own background (every screen paints its own paper). */
  dropWindowBackground(): void;
}

// Null in Expo Go, on iOS and on the web: the theme then just changes.
export default requireOptionalNativeModule<ThemeRevealModule>("ThemeReveal");
