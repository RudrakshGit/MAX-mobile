import React from "react";
import Svg, { Path } from "react-native-svg";

export interface WindIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function WindIcon({ size = 24, color = "currentColor", stroke }: WindIconProps) {
  const s = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8.5H16.5C18.5 8.5 20 7 20 5C20 3 18.5 1.5 16.5 1.5C14.5 1.5 13 3 13 5"
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2.5 13H18.5C20.5 13 22 14.5 22 16.5C22 18.5 20.5 20 18.5 20C16.5 20 15 18.5 15 16.5"
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 17.5H11.5C13 17.5 14 18.5 14 19.8C14 21 13 22 11.5 22"
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
