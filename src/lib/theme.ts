import { useColorScheme } from "react-native";
import { useStore } from "./store";

// MAX sketchbook monochrome palette: Black ink on warm paper.
// The only non-grey color permitted across the entire app is help red.
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
};

export type Theme = typeof light;

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
