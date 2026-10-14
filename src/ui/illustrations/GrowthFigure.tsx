import React from "react";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useTheme } from "@/lib/theme";

export function GrowthFigure({ size = 100, ink: inkProp, paper: paperProp }: { size?: number; ink?: string; paper?: string }) {
  const t = useTheme();
  const ink = inkProp ?? t.ink;
  const paper = paperProp ?? t.paper;

  return (
    <Svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 160 120">
      {/* Radiant growth stars and sparkles */}
      <G stroke={ink} strokeWidth={1.8} strokeLinecap="round" fill="none">
        <Path d="M120 22 L128 22 M124 18 L124 26" />
        <Path d="M136 38 L142 38 M139 35 L139 41" />
        <Path d="M110 42 L114 42 M112 40 L112 44" />
      </G>

      {/* Stepping stones / mountain curve */}
      <Path
        d="M20 105 C 40 102 70 95 100 80 C 120 70 140 60 150 48"
        stroke={ink}
        strokeWidth={1.5}
        strokeDasharray="4 3"
        fill="none"
        opacity={0.5}
      />

      {/* Reaching / Leaping figure */}
      <G stroke={ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Head */}
        <Circle cx={85} cy={34} r={13} fill={paper} />
        {/* Hair */}
        <Path d="M74 30 Q 82 22 96 28" strokeWidth={2.5} />
        {/* Confident eye looking up-right */}
        <Circle cx={90} cy={34} r={2} fill={ink} />
        <Path d="M88 40 Q 92 42 95 39" strokeWidth={1.5} />

        {/* Torso leaning forward / upward */}
        <Path d="M82 47 L 76 75 L 64 74 L 72 48 Z" fill={paper} />

        {/* Reaching arm raised high */}
        <Path d="M78 50 Q 95 35 112 25" strokeWidth={2.2} />
        {/* Hand */}
        <Circle cx={113} cy={24} r={3} fill={ink} />

        {/* Other arm balancing */}
        <Path d="M74 55 Q 58 62 48 70" />

        {/* Leading leg stepping up */}
        <Path d="M76 75 L 88 88 L 100 85" strokeWidth={2.2} />
        {/* Trailing leg pushed off */}
        <Path d="M66 74 L 52 88 L 40 96" />
      </G>

      {/* Sprouting plant at base */}
      <Path d="M30 105 Q 32 95 38 92 Q 38 98 32 105" fill={ink} opacity={0.7} />
      <Path d="M32 105 Q 26 98 24 94 Q 28 98 32 105" fill={ink} opacity={0.7} />
    </Svg>
  );
}
