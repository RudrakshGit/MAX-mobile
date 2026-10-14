import React from "react";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useTheme } from "@/lib/theme";

export function ReadingFigure({ size = 100, ink: inkProp, paper: paperProp }: { size?: number; ink?: string; paper?: string }) {
  const t = useTheme();
  const ink = inkProp ?? t.ink;
  const paper = paperProp ?? t.paper;

  return (
    <Svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 160 120">
      {/* Little warm idea star above head */}
      <Path d="M80 12 L 80 18 M 77 15 L 83 15" stroke={ink} strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
      <Path d="M125 34 L 129 34 M 127 32 L 127 36" stroke={ink} strokeWidth={1.2} strokeLinecap="round" opacity={0.5} />

      {/* Reader Figure */}
      <G stroke={ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Head tilted slightly towards book */}
        <Circle cx={80} cy={34} r={13} fill={paper} />
        {/* Hair */}
        <Path d="M68 31 C 72 20 88 20 92 31" strokeWidth={2.4} />

        {/* Reading glasses */}
        <Circle cx={75} cy={35} r={3.5} strokeWidth={1.5} />
        <Circle cx={85} cy={35} r={3.5} strokeWidth={1.5} />
        <Path d="M78.5 35 L 81.5 35" strokeWidth={1.4} />

        {/* Focused gentle smile */}
        <Path d="M78 42 Q 80 44 82 42" strokeWidth={1.4} />

        {/* Neck */}
        <Path d="M80 47 L80 52" />
        {/* Torso */}
        <Path d="M68 54 C 74 52 86 52 92 54 L 96 82 C 90 84 70 84 64 82 Z" fill={paper} />

        {/* Arms holding the open book */}
        <Path d="M66 58 C 55 68 58 78 68 76" />
        <Path d="M94 58 C 105 68 102 78 92 76" />

        {/* Open book in lap */}
        <Path
          d="M60 74 Q 80 77 80 83 Q 80 77 100 74 L 102 85 Q 80 88 80 94 Q 80 88 58 85 Z"
          fill={paper}
          strokeWidth={1.8}
        />
        {/* Book spine & lines */}
        <Path d="M80 83 L 80 94" strokeWidth={1.6} />
        <Path d="M66 80 Q 73 81 75 80" strokeWidth={1.2} opacity={0.6} />
        <Path d="M85 80 Q 87 81 94 80" strokeWidth={1.2} opacity={0.6} />

        {/* Base seated curve */}
        <Path d="M44 94 C 52 86 64 85 80 85 C 96 85 108 86 116 94 C 106 100 54 100 44 94 Z" fill={paper} />
      </G>
    </Svg>
  );
}
