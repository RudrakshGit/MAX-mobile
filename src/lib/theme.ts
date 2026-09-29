import { useColorScheme } from "react-native";

// "Notebook": warm paper, ink, one marigold accent and neem green for action.
// Every colour in the app comes from here.
const light = {
  bg: "#F6F1E7",
  paper: "#FFFCF6",
  ink: "#211C17",
  inkSoft: "#5F564B",
  line: "#E3D8C7",
  primary: "#2E5B4E",
  onPrimary: "#FFFCF6",
  accent: "#E2A33B",
  onAccent: "#211C17",
  accentSoft: "#F6E3BE",
  help: "#A93A2C",
  onHelp: "#FFFCF6",
  userBubble: "#E9DFCD",
  series: { mood: "#C9831F", sleep: "#3F4F85", screen: "#A93A2C", stress: "#2E7D6B" },
};

const dark: typeof light = {
  bg: "#15120F",
  paper: "#1F1A15",
  ink: "#F2E9DA",
  inkSoft: "#B7AA95",
  line: "#3A3129",
  primary: "#8CC2AE",
  onPrimary: "#15120F",
  accent: "#E9B04F",
  onAccent: "#15120F",
  accentSoft: "#3B2F1C",
  help: "#E26D5C",
  onHelp: "#15120F",
  userBubble: "#2C251E",
  series: { mood: "#E9B04F", sleep: "#8E9CD6", screen: "#E26D5C", stress: "#6CC3AA" },
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? dark : light;
}

export const serif = "Literata_500Medium";
export const serifItalic = "Literata_400Regular_Italic";

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 } as const;
export const radius = { sm: 10, md: 16, pill: 999 } as const;
