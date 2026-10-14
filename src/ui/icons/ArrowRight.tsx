import React from "react";
import Svg, { Path } from "react-native-svg";

export interface ArrowRightIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function ArrowRightIcon({ size = 24, color = "currentColor", stroke }: ArrowRightIconProps) {
  const strokeColor = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 12 C8.5 11.6 13.5 12.2 19.5 12 M13.5 7 C15.8 8.8 17.8 10.5 19.5 12 C17.8 13.5 15.8 15.2 13.5 17"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
