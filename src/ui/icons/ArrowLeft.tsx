import React from "react";
import Svg, { Path } from "react-native-svg";

export interface ArrowLeftIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function ArrowLeftIcon({ size = 24, color = "currentColor", stroke }: ArrowLeftIconProps) {
  const strokeColor = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.5 12 C15.5 11.6 10.5 12.2 4.5 12 M10.5 7 C8.2 8.8 6.2 10.5 4.5 12 C6.2 13.5 8.2 15.2 10.5 17"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
