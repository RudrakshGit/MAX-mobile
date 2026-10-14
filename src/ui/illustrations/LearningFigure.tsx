import React from "react";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useTheme } from "@/lib/theme";

export function LearningFigure({ size = 100, ink: inkProp, paper: paperProp }: { size?: number; ink?: string; paper?: string }) {
  const t = useTheme();
  const ink = inkProp ?? t.ink;
  const paper = paperProp ?? t.paper;

  return (
    <Svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 160 120">
      {/* Lightbulb / spark of understanding */}
      <G stroke={ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Circle cx={80} cy={22} r={7} fill={paper} />
        <Path d="M77 29 L 83 29" />
        <Path d="M68 18 L 64 15" />
        <Path d="M92 18 L 96 15" />
        <Path d="M80 11 L 80 8" />
      </G>

      {/* Student absorbed in an open book */}
      <G stroke={ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Head tilted down to read */}
        <Circle cx={80} cy={46} r={13} fill={paper} />
        {/* Hair */}
        <Path d="M68 42 C 75 32 90 32 92 46" strokeWidth={2.4} />
        {/* Focused eyes */}
        <Path d="M74 48 L 78 50" strokeWidth={1.8} />
        <Path d="M82 50 L 86 48" strokeWidth={1.8} />

        {/* Shoulders and Torso */}
        <Path d="M66 59 C 72 56 88 56 94 59 L 98 86 L 62 86 Z" fill={paper} />

        {/* Arms holding open book */}
        <Path d="M64 62 Q 55 76 68 84" />
        <Path d="M96 62 Q 105 76 92 84" />

        {/* Open Book */}
        <Path d="M80 84 L 54 80 L 54 94 L 80 98 Z" fill={paper} strokeWidth={2} />
        <Path d="M80 84 L 106 80 L 106 94 L 80 98 Z" fill={paper} strokeWidth={2} />
        {/* Book spine */}
        <Path d="M80 84 L 80 98" strokeWidth={2.2} />

        {/* Lines of text */}
        <Path d="M60 85 L 74 87" strokeWidth={1.2} opacity={0.6} />
        <Path d="M60 89 L 72 91" strokeWidth={1.2} opacity={0.6} />
        <Path d="M86 87 L 100 85" strokeWidth={1.2} opacity={0.6} />
        <Path d="M86 91 L 98 89" strokeWidth={1.2} opacity={0.6} />
      </G>

      {/* Desk line */}
      <Path d="M30 98 L 130 98" stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
