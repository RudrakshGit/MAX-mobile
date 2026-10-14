import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

export interface TvIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function TvIcon({ size = 24, color = "currentColor", stroke }: TvIconProps) {
  const s = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3}
        y={7}
        width={18}
        height={13}
        rx={2}
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 3.5L12 7L8 3.5"
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
