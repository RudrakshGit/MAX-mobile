import React from "react";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import { useTheme } from "@/lib/theme";

export function WellnessFigure({ size = 100, ink: inkProp, paper: paperProp }: { size?: number; ink?: string; paper?: string }) {
  const t = useTheme();
  const ink = inkProp ?? t.ink;
  const paper = paperProp ?? t.paper;

  return (
    <Svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 160 120">
      {/* Background soft sun aura */}
      <Circle cx={80} cy={55} r={40} fill={paper} stroke={ink} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.6} />

      {/* Gentle wind / breath curves */}
      <Path d="M20 70 Q 35 60 50 68" stroke={ink} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.5} />
      <Path d="M110 65 Q 125 55 140 62" stroke={ink} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.5} />
      <Path d="M15 82 Q 30 75 45 80" stroke={ink} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.4} />

      {/* Meditating / Calm Figure */}
      <G stroke={ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Head */}
        <Circle cx={80} cy={35} r={14} fill={paper} />
        {/* Hair curve */}
        <Path d="M68 32 Q 80 20 92 32" strokeWidth={2.5} />
        {/* Peaceful closed eyes */}
        <Path d="M73 36 Q 76 39 79 36" strokeWidth={1.8} />
        <Path d="M81 36 Q 84 39 87 36" strokeWidth={1.8} />
        {/* Gentle smile */}
        <Path d="M77 42 Q 80 44 83 42" strokeWidth={1.5} />

        {/* Neck and Torso */}
        <Path d="M80 49 L80 54" />
        <Path d="M68 56 C 72 54 88 54 92 56 L 96 82 C 90 84 70 84 64 82 Z" fill={paper} />

        {/* Arms folded in lap / meditation pose */}
        <Path d="M66 58 C 55 68 56 80 72 82" />
        <Path d="M94 58 C 105 68 104 80 88 82" />

        {/* Cross-legged base */}
        <Path d="M42 96 C 50 86 65 84 80 84 C 95 84 110 86 118 96 C 110 102 50 102 42 96 Z" fill={paper} />
        {/* Feet / knees */}
        <Ellipse cx={50} cy={94} rx={8} ry={5} />
        <Ellipse cx={110} cy={94} rx={8} ry={5} />
      </G>

      {/* Little leaf / sprout of peace */}
      <Path d="M80 15 Q 82 8 88 12 Q 82 18 80 15 Z" fill={ink} opacity={0.8} />
      <Path d="M80 15 Q 76 10 74 14 Q 78 18 80 15 Z" fill={ink} opacity={0.8} />
    </Svg>
  );
}
