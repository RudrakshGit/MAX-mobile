import React from "react";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useTheme } from "@/lib/theme";

export function GroundingFigure({ size = 100, ink: inkProp, paper: paperProp }: { size?: number; ink?: string; paper?: string }) {
  const t = useTheme();
  const ink = inkProp ?? t.ink;
  const paper = paperProp ?? t.paper;

  return (
    <Svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 160 120">
      {/* 5 Grounding sense stones/dots (5-4-3-2-1) */}
      <Circle cx={28} cy={42} r={3.5} fill={ink} opacity={0.5} />
      <Circle cx={38} cy={30} r={4} fill={ink} opacity={0.6} />
      <Circle cx={122} cy={32} r={4.5} fill={ink} opacity={0.6} />
      <Circle cx={134} cy={44} r={3.5} fill={ink} opacity={0.5} />
      <Circle cx={80} cy={16} r={3} fill={ink} opacity={0.7} />

      {/* Earth / Ground line */}
      <Path d="M20 98 Q 80 94 140 98" stroke={ink} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.5} />
      <Path d="M35 104 Q 80 101 125 104" stroke={ink} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.3} />

      {/* Student grounded, connected with senses */}
      <G stroke={ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Head */}
        <Circle cx={76} cy={32} r={13} fill={paper} />
        {/* Cap/Hair */}
        <Path d="M64 30 C 68 18 84 18 88 30" strokeWidth={2.4} />
        {/* Open mindful eyes */}
        <Circle cx={72} cy={34} r={1.5} fill={ink} />
        <Circle cx={80} cy={34} r={1.5} fill={ink} />
        {/* Soft smile */}
        <Path d="M73 40 Q 76 42 79 40" strokeWidth={1.5} />

        {/* Neck & Body */}
        <Path d="M76 45 L76 50" />
        <Path d="M64 52 C 70 50 82 50 88 52 L 91 80 C 85 82 67 82 61 80 Z" fill={paper} />

        {/* Left hand open touching sense sphere */}
        <Path d="M63 54 C 50 62 48 72 40 76" />
        <Circle cx={38} cy={76} r={3} fill={paper} strokeWidth={1.5} />

        {/* Right arm resting securely on knee */}
        <Path d="M89 54 C 100 62 104 74 98 80" />

        {/* Kneeling / Grounded legs */}
        <Path d="M48 88 C 54 80 66 80 76 80 C 86 80 98 80 104 88 C 96 95 56 95 48 88 Z" fill={paper} />
      </G>

      {/* Little sprout grounded in earth */}
      <Path d="M120 96 C 122 88 128 88 126 96" stroke={ink} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      <Path d="M123 90 C 120 86 116 88 120 92" stroke={ink} strokeWidth={1.5} strokeLinecap="round" fill="none" />
    </Svg>
  );
}
