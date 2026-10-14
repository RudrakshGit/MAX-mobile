import React from "react";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useTheme } from "@/lib/theme";

export function SleepFigure({ size = 100, ink: inkProp, paper: paperProp }: { size?: number; ink?: string; paper?: string }) {
  const t = useTheme();
  const ink = inkProp ?? t.ink;
  const paper = paperProp ?? t.paper;

  return (
    <Svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 160 120">
      {/* Crescent Moon in night sky */}
      <Path
        d="M118 20 C 110 20 102 26 100 34 C 108 34 116 42 116 50 C 124 48 130 40 130 32 C 130 25 125 20 118 20 Z"
        stroke={ink}
        strokeWidth={1.8}
        fill={paper}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Gentle twinkling stars */}
      <Path d="M42 24 L44 28 L48 30 L44 32 L42 36 L40 32 L36 30 L40 28 Z" fill={ink} opacity={0.7} />
      <Path d="M78 18 L79 21 L82 22 L79 23 L78 26 L77 23 L74 22 L77 21 Z" fill={ink} opacity={0.6} />
      <Path d="M136 58 L137 60 L139 61 L137 62 L136 64 L135 62 L133 61 L135 60 Z" fill={ink} opacity={0.5} />

      {/* Zzz drifting sleep letters */}
      <Path d="M96 46 L104 46 L96 54 L104 54" stroke={ink} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.6} />
      <Path d="M106 38 L111 38 L106 43 L111 43" stroke={ink} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.5} />

      {/* Peaceful sleeping student on pillow */}
      <G stroke={ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Soft pillow */}
        <Path d="M38 72 C 34 64 42 56 58 56 C 74 56 82 64 78 72 C 74 80 42 80 38 72 Z" fill={paper} strokeWidth={1.8} />

        {/* Head resting sideways on pillow */}
        <Circle cx={58} cy={66} r={13} fill={paper} />
        {/* Messy relaxed hair */}
        <Path d="M48 64 C 48 54 62 52 68 62" strokeWidth={2.4} />
        {/* Sleeping peaceful closed eye */}
        <Path d="M54 68 Q 57 71 60 68" strokeWidth={1.8} />

        {/* Cozy blanket covering resting student */}
        <Path
          d="M68 70 C 78 66 100 66 116 74 C 122 78 126 86 120 94 C 114 100 52 102 46 96 C 42 90 56 74 68 70 Z"
          fill={paper}
        />
        {/* Blanket folds */}
        <Path d="M72 74 Q 88 80 108 78" strokeWidth={1.5} opacity={0.6} />
        <Path d="M60 88 Q 80 92 104 90" strokeWidth={1.4} opacity={0.5} />
      </G>
    </Svg>
  );
}
