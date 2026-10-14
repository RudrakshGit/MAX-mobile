import React from "react";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useTheme } from "@/lib/theme";

export function SafetyFigure({ size = 100, ink: inkProp, paper: paperProp }: { size?: number; ink?: string; paper?: string }) {
  const t = useTheme();
  const ink = inkProp ?? t.ink;
  const paper = paperProp ?? t.paper;

  return (
    <Svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 160 120">
      {/* Soft supportive aura */}
      <Circle cx={80} cy={55} r={44} stroke={ink} strokeWidth={1.2} strokeDasharray="4 4" fill="none" opacity={0.35} />

      {/* Gentle shielding embrace / caring figure */}
      <G stroke={ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Head */}
        <Circle cx={80} cy={34} r={13} fill={paper} />
        {/* Hair */}
        <Path d="M68 31 C 72 20 88 20 92 31" strokeWidth={2.4} />
        {/* Soft reassuring expression */}
        <Path d="M74 36 Q 77 39 80 36" strokeWidth={1.8} />
        <Path d="M82 36 Q 85 39 88 36" strokeWidth={1.8} />
        <Path d="M78 42 Q 81 44 84 42" strokeWidth={1.5} />

        {/* Neck */}
        <Path d="M80 47 L80 52" />
        {/* Body */}
        <Path d="M68 54 C 74 52 86 52 92 54 L 96 82 C 90 84 70 84 64 82 Z" fill={paper} />

        {/* Cupped caring hands holding safety symbol */}
        <Path d="M66 58 C 54 68 56 80 74 80" />
        <Path d="M94 58 C 106 68 104 80 86 80" />

        {/* Little reassuring heart held safely in hands */}
        <Path
          d="M80 73 C 80 73 75 67 71 67 C 67 67 65 70 65 73 C 65 77 72 82 80 86 C 88 82 95 77 95 73 C 95 70 93 67 89 67 C 85 67 80 73 80 73 Z"
          fill={paper}
          strokeWidth={1.6}
        />

        {/* Grounded seated base */}
        <Path d="M44 94 C 52 85 66 84 80 84 C 94 84 108 85 116 94 C 106 100 54 100 44 94 Z" fill={paper} />
      </G>

      {/* Safety anchor star */}
      <Path d="M80 14 L80 20 M77 17 L83 17" stroke={ink} strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
    </Svg>
  );
}
