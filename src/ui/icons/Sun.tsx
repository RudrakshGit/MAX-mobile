import React from "react";
import Svg, { Path } from "react-native-svg";

export interface SunIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function SunIcon({ size = 24, color = "currentColor", stroke }: SunIconProps) {
  const s = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Hand-drawn centre circle */}
      <Path
        d="M12 7.2c2.65 0 4.8 2.15 4.8 4.8s-2.15 4.8-4.8 4.8-4.8-2.15-4.8-4.8c0-2.65 2.15-4.8 4.8-4.8z"
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 8 Hand-drawn sun rays */}
      <Path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
