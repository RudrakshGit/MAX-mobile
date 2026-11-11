import { useColorScheme } from "react-native";
import { useStore } from "./store";

// MAX sketchbook palette: black ink on warm paper. Help red is the only alarm colour; since M16 (owner, 7 Nov 2026)
// MAX's pink cheeks and the subtle topic tints are the only other colours, and they live here too.
const light = {
  paper: "#FCF8EE",
  raised: "#FFFDF7",
  ink: "#1A1816",
  ink2: "#4A4540",
  ink3: "#6E6761",
  rule: "#8A8379",
  hair: "#B8B0A3",
  inverseInk: "#EDE7DC",
  help: "#B3261E",
  onHelp: "#FFFFFF",
  grainOpacity: 0.04,
  characterPaper: "#FCF8EE",
  characterInk: "#1A1816",
  characterFoot: "#2E2B28",
  // MAX's cheeks: the subtle pink of the design sheet (M16, owner approved subtle colour on 7 Nov 2026)
  characterBlush: "#EBA49A",
  // Soft topic tints behind card pictures, never behind text (M16 research: ink on these is 13.7–14.4:1)
  tint: {
    exam: "#F8E7C4",
    sleep: "#E3E4F3",
    calm: "#DCEFE8",
    thoughts: "#ECE3F3",
    kind: "#F7E1E1",
    focus: "#DDEBF5",
    support: "#F6E2D3",
  },
};

const dark: typeof light = {
  paper: "#1B1A18",
  raised: "#252321",
  ink: "#EDE7DC",
  ink2: "#BDB5A8",
  ink3: "#9A9288",
  rule: "#7D766C",
  hair: "#5C5852",
  inverseInk: "#1A1816",
  help: "#FF8A80",
  onHelp: "#1B1A18",
  grainOpacity: 0.035,
  characterPaper: "#FCF8EE",
  characterInk: "#1A1816",
  // charcoal feet need to stay visible on the dark page
  characterFoot: "#6A645D",
  characterBlush: "#EBA49A",
  // desaturated on the dark page; chalk on these is 10.4–11.6:1
  tint: {
    exam: "#3A3222",
    sleep: "#262A3F",
    calm: "#1F3631",
    thoughts: "#312A3A",
    kind: "#3B2829",
    focus: "#22323D",
    support: "#3B2D24",
  },
};

export type Theme = typeof light;
export type TintName = keyof Theme["tint"];
export const THEMES = { light, dark } as const;

/** For the few native widgets that take a light/dark switch instead of colours (e.g. Google's sign-in button). */
export const isDarkTheme = (t: Theme) => t === dark;

export function useTheme(): Theme {
  const pref = useStore((s) => s.themePreference);
  const sys = useColorScheme();
  const isDark = pref === "dark" || (pref === "system" && sys === "dark");
  return isDark ? dark : light;
}

export const stroke = {
  hair: 1.25,
  line: 2,
  bold: 2.75,
  icon: 1.75,
} as const;

export const sketch = {
  roughness: 0.8,
  heroRoughness: 1.1,
  shadowOffset: 3,
  boilFps: 8,
} as const;

export const font = {
  headline: "Inter_400Regular",
  button: "Inter_600SemiBold",
  body: "AtkinsonHyperlegibleNext_400Regular",
  bodyBold: "AtkinsonHyperlegibleNext_600SemiBold",
  handwritten: "Kalam_400Regular",
  handwrittenBold: "Kalam_700Bold",
} as const;

// Backward-compatibility aliases for legacy font names
export const serif = font.headline;
export const serifItalic = font.handwritten;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40, xxl: 64 } as const;
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;
