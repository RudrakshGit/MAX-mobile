import React from "react";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import { useTheme } from "@/lib/theme";

export function PersonalityFigure({ size = 100, ink: inkProp, paper: paperProp }: { size?: number; ink?: string; paper?: string }) {
  const t = useTheme();
  const ink = inkProp ?? t.ink;
  const paper = paperProp ?? t.paper;

  return (
    <Svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 160 120">
      {/* 3 expressive masks / faces like Serene Personality */}
      {/* 1. Left Face (Curious/Thoughtful) */}
      <G stroke={ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Ellipse cx={44} cy={55} rx={22} ry={28} fill={paper} />
        {/* Hair */}
        <Path d="M26 48 Q 44 32 62 45" strokeWidth={2.2} />
        {/* Curious eye */}
        <Circle cx={42} cy={54} r={2} fill={ink} />
        <Path d="M38 48 Q 44 45 48 49" strokeWidth={1.5} />
        {/* Thoughtful mouth */}
        <Circle cx={44} cy={66} r={2.5} fill={ink} />
      </G>

      {/* 2. Right Face (Quiet/Calm) */}
      <G stroke={ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Ellipse cx={116} cy={55} rx={22} ry={28} fill={paper} />
        {/* Hair */}
        <Path d="M98 45 Q 116 32 134 48" strokeWidth={2.2} />
        {/* Closed serene eyes */}
        <Path d="M108 55 Q 113 58 118 55" strokeWidth={1.6} />
        <Path d="M122 55 Q 127 58 132 55" strokeWidth={1.6} />
        {/* Gentle smile */}
        <Path d="M114 66 Q 120 69 126 66" strokeWidth={1.6} />
      </G>

      {/* 3. Center Main Face (Warm & Self-Aware) */}
      <G stroke={ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Ellipse cx={80} cy={50} rx={26} ry={32} fill={paper} />
        {/* Hair with curl */}
        <Path d="M58 40 C 70 24 95 24 102 38" strokeWidth={2.5} />
        {/* Eyes */}
        <Circle cx={73} cy={48} r={2.5} fill={ink} />
        <Circle cx={87} cy={48} r={2.5} fill={ink} />
        {/* Smile */}
        <Path d="M72 60 Q 80 67 88 60" strokeWidth={2} />
        {/* Cute blush */}
        <Ellipse cx={67} cy={54} rx={3} ry={2} fill={ink} opacity={0.3} />
        <Ellipse cx={93} cy={54} rx={3} ry={2} fill={ink} opacity={0.3} />
      </G>

      {/* Underline base curve */}
      <Path
        d="M30 100 Q 80 106 130 100"
        stroke={ink}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
    </Svg>
  );
}
