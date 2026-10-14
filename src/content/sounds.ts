import type { Need } from "./music.ts";

export type Sound = {
  id: string;
  title: string;
  file: any;
  need: Need;
  description: string;
};

export const sounds: Sound[] = [
  {
    id: "brown-noise",
    title: "Brown Noise",
    file: require("../../assets/sounds/brown.m4a"),
    need: "focus",
    description: "Deep, waterfall-like rumble. Blocks library chatter and harsh sudden sounds.",
  },
  {
    id: "pink-noise",
    title: "Pink Noise",
    file: require("../../assets/sounds/pink.m4a"),
    need: "sleep",
    description: "Gentle rain-like frequency balance. Soothes active brain rhythms before sleep.",
  },
  {
    id: "white-noise",
    title: "White Noise",
    file: require("../../assets/sounds/white.m4a"),
    need: "noise",
    description: "Steady static mask. Covers hostel door slams, traffic, and background noise.",
  },
];
