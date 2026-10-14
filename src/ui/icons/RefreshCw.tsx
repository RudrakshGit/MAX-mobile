import React from "react";
import Svg, { Path } from "react-native-svg";

export interface RefreshCwIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function RefreshCwIcon({ size = 24, color = "currentColor", stroke }: RefreshCwIconProps) {
  const s = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 2v6h-6" stroke={s} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 22v-6h6" stroke={s} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M3.5 9a9 9 0 0 1 14.85-3.36L21 8M20.5 15a9 9 0 0 1-14.85 3.36L3 16"
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
