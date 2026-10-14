import React from "react";
import Svg, { Path } from "react-native-svg";

export interface ArrowUpIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function ArrowUpIcon({ size = 24, color = "currentColor", stroke }: ArrowUpIconProps) {
  const strokeColor = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20.5 C11.6 15.5 12.2 10.5 12 4.5 M7 13.5 C8.8 11.2 10.5 9.2 12 4.5 C13.5 9.2 15.2 11.2 17 13.5"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
