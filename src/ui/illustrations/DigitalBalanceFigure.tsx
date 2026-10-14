import React from "react";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { useTheme } from "@/lib/theme";

export function DigitalBalanceFigure({ size = 100, ink: inkProp, paper: paperProp }: { size?: number; ink?: string; paper?: string }) {
  const t = useTheme();
  const ink = inkProp ?? t.ink;
  const paper = paperProp ?? t.paper;

  return (
    <Svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 160 120">
      {/* Background warm window arch */}
      <Path
        d="M35 85 L 35 45 C 35 25 80 25 80 45 L 80 85"
        stroke={ink}
        strokeWidth={1.2}
        strokeDasharray="3 3"
        fill="none"
        opacity={0.4}
      />

      {/* Relaxing student with tea and phone resting face-down */}
      <G stroke={ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Head */}
        <Circle cx={65} cy={42} r={13} fill={paper} />
        {/* Hair */}
        <Path d="M54 38 Q 65 28 76 36" strokeWidth={2.4} />
        {/* Relaxed closed eye */}
        <Path d="M60 44 Q 64 47 68 44" strokeWidth={1.6} />
        {/* Smile */}
        <Path d="M62 49 Q 65 52 68 49" strokeWidth={1.5} />

        {/* Torso leaning back comfortably */}
        <Path d="M58 55 C 54 75 52 85 70 88 C 80 89 86 78 82 58 Z" fill={paper} />

        {/* Arm holding a warm cup of chai/coffee */}
        <Path d="M62 62 Q 74 68 84 64" />
        {/* Cup */}
        <Path d="M84 60 L 92 60 L 90 70 L 84 70 Z" fill={paper} strokeWidth={1.6} />
        {/* Steam */}
        <Path d="M86 56 Q 88 52 86 48" strokeWidth={1.2} opacity={0.6} />
        <Path d="M90 56 Q 92 52 90 48" strokeWidth={1.2} opacity={0.6} />

        {/* Lounging legs */}
        <Path d="M68 88 Q 90 92 110 90" strokeWidth={2.4} />
        <Path d="M110 90 L 118 94" />

        {/* Little bedside table */}
        <Path d="M115 72 L 145 72 M 125 72 L 125 98 M 138 72 L 138 98" strokeWidth={1.8} />

        {/* Phone resting face-down with screen off */}
        <Rect x={124} y={64} width={14} height={8} rx={2} fill={paper} strokeWidth={1.6} />
        <Path d="M128 68 L 134 68" strokeWidth={1.2} opacity={0.5} />
      </G>

      {/* Ground line */}
      <Path d="M25 98 L 148 98" stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
