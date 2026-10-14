import React from "react";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useTheme } from "@/lib/theme";

export function SpiralFigure({ size = 100, ink: inkProp, paper: paperProp }: { size?: number; ink?: string; paper?: string }) {
  const t = useTheme();
  const ink = inkProp ?? t.ink;
  const paper = paperProp ?? t.paper;

  return (
    <Svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 160 120">
      {/* Tangle unspooling into a smooth line */}
      <Path
        d="M24 45 C 32 30 50 30 52 48 C 54 62 38 68 34 54 C 30 42 46 36 58 44 C 70 52 74 65 86 65 L 142 65"
        stroke={ink}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        opacity={0.65}
      />
      {/* Sparkles of clarity at the straight end */}
      <Path d="M142 55 L 142 61 M139 58 L 145 58" stroke={ink} strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
      <Path d="M125 48 L 125 52 M123 50 L 127 50" stroke={ink} strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />

      {/* Thoughtful student unknotting the loop */}
      <G stroke={ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Head */}
        <Circle cx={85} cy={35} r={13} fill={paper} />
        {/* Hair */}
        <Path d="M73 32 C 77 22 93 22 97 32" strokeWidth={2.4} />
        {/* Focused, confident eyes */}
        <Path d="M78 36 L 82 36" strokeWidth={1.8} />
        <Path d="M86 36 L 90 36" strokeWidth={1.8} />
        {/* Subtle reassuring smile */}
        <Path d="M82 42 Q 85 44 88 42" strokeWidth={1.5} />

        {/* Neck */}
        <Path d="M85 48 L 85 53" />
        {/* Torso */}
        <Path d="M74 54 C 80 52 92 52 97 54 L 100 82 C 94 84 76 84 70 82 Z" fill={paper} />

        {/* Hands guiding the line */}
        <Path d="M73 57 C 62 65 60 74 72 74" />
        <Path d="M98 57 C 108 64 112 70 102 75" />

        {/* Sitting steady */}
        <Path d="M54 94 C 62 85 75 83 88 83 C 101 83 114 85 122 94 C 112 100 64 100 54 94 Z" fill={paper} />
      </G>
    </Svg>
  );
}
