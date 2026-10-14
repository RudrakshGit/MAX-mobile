import React from "react";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useTheme } from "@/lib/theme";

export function BreathingFigure({ size = 100, ink: inkProp, paper: paperProp }: { size?: number; ink?: string; paper?: string }) {
  const t = useTheme();
  const ink = inkProp ?? t.ink;
  const paper = paperProp ?? t.paper;

  return (
    <Svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 160 120">
      {/* Expanding breath rings */}
      <Circle cx={80} cy={55} r={46} stroke={ink} strokeWidth={1.2} strokeDasharray="4 4" fill="none" opacity={0.35} />
      <Circle cx={80} cy={55} r={36} stroke={ink} strokeWidth={1.5} strokeDasharray="3 3" fill="none" opacity={0.5} />

      {/* Gentle somatic breath currents */}
      <Path d="M18 50 Q 35 40 52 50 Q 69 60 86 50" stroke={ink} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.4} />
      <Path d="M74 72 Q 91 62 108 72 Q 125 82 142 72" stroke={ink} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.4} />

      {/* Meditative Breathing Student */}
      <G stroke={ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Head */}
        <Circle cx={80} cy={34} r={13} fill={paper} />
        {/* Hair curve */}
        <Path d="M68 32 C 72 20 88 20 92 32" strokeWidth={2.4} />
        {/* Gentle closed eyes */}
        <Path d="M73 35 Q 76 38 79 35" strokeWidth={1.8} />
        <Path d="M81 35 Q 84 38 87 35" strokeWidth={1.8} />
        {/* Serene smile */}
        <Path d="M77 41 Q 80 43 83 41" strokeWidth={1.5} />

        {/* Neck */}
        <Path d="M80 47 L80 52" />
        {/* Torso */}
        <Path d="M69 54 C 74 52 86 52 91 54 L 95 80 C 88 82 72 82 65 80 Z" fill={paper} />

        {/* Hand resting gently over heart/chest */}
        <Path d="M68 56 C 60 64 64 74 76 70" />
        <Path d="M92 56 C 100 64 96 74 84 72" />
        <Circle cx={80} cy={66} r={3.5} fill={paper} strokeWidth={1.5} />

        {/* Sitting lap base */}
        <Path d="M44 94 C 52 84 66 82 80 82 C 94 82 108 84 116 94 C 106 100 54 100 44 94 Z" fill={paper} />
      </G>

      {/* Gentle leaf of fresh air */}
      <Path d="M80 14 C 83 8 90 11 88 16 C 84 18 80 14 80 14 Z" fill={ink} opacity={0.8} />
    </Svg>
  );
}
