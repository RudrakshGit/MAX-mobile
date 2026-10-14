import React from "react";
import Svg, { Path } from "react-native-svg";

export interface ChevronRightIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function ChevronRightIcon({ size = 24, color = "currentColor", stroke }: ChevronRightIconProps) {
  const strokeColor = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.5 6 C11.5 8.5 13.5 10.5 15.5 12 C13.5 13.5 11.5 15.5 9.5 18"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
