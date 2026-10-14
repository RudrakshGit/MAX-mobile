import React from "react";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useTheme } from "@/lib/theme";

export function MediaFigure({ size = 100, ink: inkProp, paper: paperProp }: { size?: number; ink?: string; paper?: string }) {
  const t = useTheme();
  const ink = inkProp ?? t.ink;
  const paper = paperProp ?? t.paper;

  return (
    <Svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 160 120">
      {/* Musical & ambient sound notes in air */}
      <Path d="M120 28 L 128 26 L 128 34 M 120 30 L 120 38" stroke={ink} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.6} />
      <Circle cx={118} cy={38} r={3} fill={ink} opacity={0.6} />
      <Circle cx={126} cy={34} r={3} fill={ink} opacity={0.6} />

      <Path d="M36 34 Q 42 28 48 34" stroke={ink} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.5} />
      <Path d="M32 40 Q 42 32 52 40" stroke={ink} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.35} />

      {/* Student with headphones */}
      <G stroke={ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Head */}
        <Circle cx={80} cy={36} r={13} fill={paper} />
        {/* Hair */}
        <Path d="M68 34 C 72 22 88 22 92 34" strokeWidth={2.4} />

        {/* Over-ear Headphones band */}
        <Path d="M66 38 C 66 22 94 22 94 38" strokeWidth={2.2} />
        {/* Headphone ear pads */}
        <Path d="M65 32 L 65 44 C 64 45 61 44 61 38 C 61 32 64 31 65 32 Z" fill={ink} />
        <Path d="M95 32 L 95 44 C 96 45 99 44 99 38 C 99 32 96 31 95 32 Z" fill={ink} />

        {/* Relaxed listening expression */}
        <Path d="M74 38 Q 77 41 80 38" strokeWidth={1.8} />
        <Path d="M82 38 Q 85 41 88 38" strokeWidth={1.8} />
        <Path d="M78 44 Q 81 46 84 44" strokeWidth={1.5} />

        {/* Neck */}
        <Path d="M80 49 L80 54" />
        {/* Torso */}
        <Path d="M68 56 C 74 54 86 54 92 56 L 96 84 C 90 86 70 86 64 84 Z" fill={paper} />

        {/* Arms holding audio device / resting peaceful */}
        <Path d="M66 58 C 55 68 58 78 74 80" />
        <Path d="M94 58 C 105 68 102 78 86 80" />

        {/* Sitting comfortably */}
        <Path d="M44 94 C 52 85 66 84 80 84 C 94 84 108 85 116 94 C 106 100 54 100 44 94 Z" fill={paper} />
      </G>

      {/* Gentle play emblem */}
      <Path d="M80 72 L 86 76 L 80 80 Z" fill={ink} opacity={0.8} />
    </Svg>
  );
}
