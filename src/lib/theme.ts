import { useColorScheme } from "react-native";

// Calming, human-crafted mental wellbeing palette:
// Clean warm porcelain, rich charcoal ink, serene therapeutic emerald, and gentle amber accents.
const light = {
  bg: "#FAF8F5",
  paper: "#FFFFFF",
  ink: "#1C1917",
  inkSoft: "#686055",
  line: "#ECE5DA",
  primary: "#25594C",
  onPrimary: "#FFFFFF",
  accent: "#D97724",
  onAccent: "#1C1917", // white on this orange is only ~3.3:1
  accentSoft: "#FDF4E7",
  help: "#C83E2D",
  onHelp: "#FFFFFF",
  userBubble: "#EFE8DC",
  series: { mood: "#D97724", sleep: "#485B9E", screen: "#C83E2D", stress: "#2D7A68" },
};

const dark: typeof light = {
  bg: "#13110F",
  paper: "#1D1915",
  ink: "#F5EFE6",
  inkSoft: "#A89B88",
  line: "#2E2620",
  primary: "#7EBAA4",
  onPrimary: "#13110F",
  accent: "#E8A843",
  onAccent: "#13110F",
  accentSoft: "#362917",
  help: "#E66B5A",
  onHelp: "#13110F",
  userBubble: "#29221B",
  series: { mood: "#E8A843", sleep: "#95A4DE", screen: "#E66B5A", stress: "#6EC7AE" },
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? dark : light;
}

export const serif = "Literata_500Medium";
export const serifItalic = "Literata_400Regular_Italic";

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 } as const;
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;
